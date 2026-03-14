"""
Google Vertex concrete implementation of the media generation service.
"""

import asyncio
import base64
import io
import logging
import os
import subprocess
import tempfile
import time
import urllib.request
import uuid

from google import genai
from google.genai import types
from PIL import Image

from src.services.gcs_service import GCSService
from src.services.media_service import MediaService

logger = logging.getLogger(__name__)


class GoogleVertexMediaService(MediaService):
    """Media service using Google GenAI for real image and video generation.

    Uses `imagen-4.0-generate-001` and `veo-3.0-fast-generate-001` models.
    """

    def __init__(self, gcs_service: GCSService | None = None, bucket_name: str | None = None) -> None:
        """Initialise the Google GenAI client for Vertex AI."""
        # Using vertexai=True required for imagen and veo models.
        # This will automatically pick up GOOGLE_CLOUD_PROJECT from the environment.
        self.client = genai.Client(vertexai=True)
        self.gcs_service = gcs_service or GCSService()
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME", "idea-to-socdia-assets")

        # State variable to hold reference images for model context
        self.reference_images_pil: list[Image.Image] = []

    def set_reference_images(self, b64_list: list[str] | None) -> None:
        """Decode and store a list of base64 images as PIL images for model context."""
        self.reference_images_pil = []
        if not b64_list:
            return
        for idx, b64_str in enumerate(b64_list):
            try:
                decoded_bytes = base64.b64decode(b64_str)
                img = Image.open(io.BytesIO(decoded_bytes))
                self.reference_images_pil.append(img)
                logger.info("Loaded reference image %d into MediaService state.", idx + 1)
            except Exception as exc:
                logger.error("Failed to decode reference image %d: %s", idx + 1, exc)

    async def generate_image(self, prompt: str, aspect_ratio: str = "16:9") -> str:
        """Generate an image using Gemini and upload it to GCS."""
        logger.info("Generating real image for prompt: %s", prompt[:80])
        asset_id = uuid.uuid4().hex[:12]

        destination_blob_name = f"images/img_{asset_id}.png"

        try:
            # Offload the synchronous SDK call to a background thread
            def _generate_and_upload() -> str:
                contents = [prompt]
                for ref_img in self.reference_images_pil:
                    contents.append(ref_img)

                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        response = self.client.models.generate_content(
                            model="gemini-2.5-flash-image",
                            contents=contents,
                            config=types.GenerateContentConfig(
                                response_modalities=["IMAGE"],
                                image_config=types.ImageConfig(aspect_ratio=aspect_ratio, image_size="2K"),
                            ),
                        )
                        break
                    except Exception as exc:
                        if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                            if attempt < max_retries - 1:
                                logger.warning(
                                    "Rate limit hit generating image. Retrying in 20s (attempt %d/3)...",
                                    attempt + 1,
                                )
                                time.sleep(20)
                                continue
                        raise exc

                if response.parts:
                    for part in response.parts:
                        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                            img_bytes = part.inline_data.data
                            pil_image = Image.open(io.BytesIO(img_bytes))
                            
                            img_buffer = io.BytesIO()
                            pil_image.save(img_buffer, format="PNG")
                            
                            return self.gcs_service.upload_file_from_bytes(
                                bucket_name=self.bucket_name,
                                destination_blob_name=destination_blob_name,
                                file_bytes=img_buffer.getvalue(),
                                content_type="image/png",
                            )

                if not response.parts:
                    raise ValueError("No image returned by Gemini Image Generation Pipeline.")

                raise ValueError("Image response did not contain a valid image part.")

            url = await asyncio.to_thread(_generate_and_upload)
            logger.info("Image generated and uploaded to GCS: %s", url)
            return url

        except Exception as exc:
            logger.exception("Failed to generate image. Fallback to placeholder. Error: %s", str(exc))
            return "https://placehold.co/1920x1080?text=Image+Generation+Failed"

    async def generate_video(self, prompt: str, aspect_ratio: str = "16:9") -> str:
        """Generate a video using Vertex AI Veo and upload it to GCS."""
        logger.info("Generating video for prompt: %s", prompt[:80])
        asset_id = uuid.uuid4().hex[:12]

        destination_blob_name = f"videos/vid_{asset_id}.mp4"

        try:
            def _generate_and_upload() -> str:
                kwargs = {
                    "model": "veo-3.0-fast-generate-001",
                    "prompt": prompt,
                    "config": types.GenerateVideosConfig(
                        aspect_ratio=aspect_ratio,
                    ),
                }

                # Veo 3 supports at most two input images and they must be
                # provided in the initial call. For now, only the first
                # reference image is supplied if available.
                if self.reference_images_pil:
                    kwargs["image"] = self.reference_images_pil[0]

                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        operation = self.client.models.generate_videos(**kwargs)
                        break
                    except Exception as exc:
                        if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                            if attempt < max_retries - 1:
                                logger.warning(
                                    "Rate limit hit generating video. Retrying in 20s (attempt %d/3)...",
                                    attempt + 1,
                                )
                                time.sleep(20)
                                continue
                        raise exc

                while not operation.done:
                    logger.info("Waiting for video generation to complete...")
                    time.sleep(10)
                    operation = self.client.operations.get(operation)

                if not operation.response or not operation.response.generated_videos:
                    logger.warning("Operation completed but returned no videos. Response: %s", operation.response)
                    raise ValueError("No video returned from Veo video generation.")

                video_bytes = operation.response.generated_videos[0].video.video_bytes
                if not video_bytes:
                    raise ValueError("Operation completed but video_bytes is empty.")

                return self.gcs_service.upload_file_from_bytes(
                    bucket_name=self.bucket_name,
                    destination_blob_name=destination_blob_name,
                    file_bytes=video_bytes,
                    content_type="video/mp4",
                )

            url = await asyncio.to_thread(_generate_and_upload)
            logger.info("Video generated and uploaded to GCS: %s", url)
            return url

        except Exception as exc:
            logger.exception("Failed to generate video. Error: %s", str(exc))
            return "https://placehold.co/1920x1080?text=Video+Generation+Failed"

    async def concatenate_videos(self, video_urls: list[str]) -> str:
        """Download, merge with ffmpeg in /tmp, then upload merged video to GCS."""
        if not video_urls:
            raise ValueError("video_urls list cannot be empty.")

        if any("placehold.co" in url for url in video_urls):
            logger.info("Mock video URL detected. Bypassing concatenation logic.")
            await asyncio.sleep(2)
            return "https://placehold.co/1080x1920/000000/FFF?text=Merged+Video"

        logger.info("Concatenating %d videos...", len(video_urls))
        asset_id = uuid.uuid4().hex[:12]
        destination_blob_name = f"videos/merged_{asset_id}.mp4"
        tmp_root = "/tmp" if os.path.isdir("/tmp") else tempfile.gettempdir()

        def _merge_and_upload() -> str:
            temp_dir = os.path.join(tmp_root, f"idea-to-socdia-{asset_id}")
            os.makedirs(temp_dir, exist_ok=True)
            temp_filepaths: list[str] = []
            list_file_path = os.path.join(temp_dir, "concat-list.txt")
            merged_output_path = os.path.join(temp_dir, f"merged_{asset_id}.mp4")
            try:
                # 1. Download input videos to local temp files for ffmpeg.
                for i, url in enumerate(video_urls):
                    temp_path = os.path.join(temp_dir, f"input_{i}.mp4")
                    temp_filepaths.append(temp_path)
                    logger.info("Downloading source video from %s to %s", url, temp_path)
                    if url.startswith("gs://") or "storage.googleapis.com" in url:
                        self.gcs_service.download_file_from_gcs_url(url, temp_path)
                    else:
                        urllib.request.urlretrieve(url, temp_path)

                # 2. Build ffmpeg concat list file.
                with open(list_file_path, "w", encoding="utf-8") as list_file:
                    for temp_path in temp_filepaths:
                        escaped = temp_path.replace("'", "'\\''")
                        list_file.write(f"file '{escaped}'\\n")

                # 3. Concatenate using ffmpeg.
                ffmpeg_command = [
                    "ffmpeg",
                    "-y",
                    "-f",
                    "concat",
                    "-safe",
                    "0",
                    "-i",
                    list_file_path,
                    "-c:v",
                    "libx264",
                    "-c:a",
                    "aac",
                    "-movflags",
                    "+faststart",
                    merged_output_path,
                ]
                logger.info("Running ffmpeg concatenation command.")
                result = subprocess.run(
                    ffmpeg_command,
                    capture_output=True,
                    text=True,
                    check=False,
                )
                if result.returncode != 0:
                    logger.error("ffmpeg failed. stderr: %s", result.stderr)
                    raise RuntimeError("ffmpeg concatenation failed.")

                # 4. Upload merged output to GCS.
                with open(merged_output_path, "rb") as merged_file:
                    merged_bytes = merged_file.read()

                return self.gcs_service.upload_file_from_bytes(
                    bucket_name=self.bucket_name,
                    destination_blob_name=destination_blob_name,
                    file_bytes=merged_bytes,
                    content_type="video/mp4",
                )

            finally:
                # 5. Cleanup all temporary artifacts.
                for temp_path in temp_filepaths + [list_file_path, merged_output_path]:
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except OSError as exc:
                            logger.warning("Could not remove temp file %s: %s", temp_path, exc)
                try:
                    os.rmdir(temp_dir)
                except OSError:
                    # It is safe to continue if directory cleanup fails.
                    pass

        url = await asyncio.to_thread(_merge_and_upload)
        logger.info("Merged video uploaded successfully: %s", url)
        return url

    def get_tools(self) -> list:
        """Return functions intended to be passed to Gemini's tools parameter."""

        def generate_image(prompt: str) -> str:
            """Generate a high-quality image from a detailed prompt.

            Args:
                prompt: A detailed and visually evocative description.

            Returns:
                URL string to the generated image.
            """
            pass

        def generate_video(prompt: str) -> str:
            """Generate a dynamic video clip from a detailed prompt.

            Args:
                prompt: A detailed description emphasizing motion and cinematics.

            Returns:
                URL string to the generated video.
            """
            pass

        return [generate_image, generate_video]