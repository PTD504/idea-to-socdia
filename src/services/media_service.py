"""
Abstract and concrete media generation services.

Provides an interface for generating images and videos from text prompts,
and a mock implementation simulating Google Vertex AI rendering times.
"""

import asyncio
import logging
import uuid
import time
from abc import ABC, abstractmethod
import random

logger = logging.getLogger(__name__)


class MediaService(ABC):
    """Interface for media asset generation from text prompts."""

    @abstractmethod
    async def generate_image(self, prompt: str) -> str:
        """Generate an image from a text prompt.

        Args:
            prompt: Descriptive text for image generation.

        Returns:
            A URL pointing to the generated image asset.
        """
        ...

    @abstractmethod
    async def generate_video(self, prompt: str) -> str:
        """Generate a video clip from a text prompt.

        Args:
            prompt: Descriptive text for video generation.

        Returns:
            A URL pointing to the generated video asset.
        """
        ...


import os
import io
import base64
from PIL import Image
from google import genai
from google.genai import types

use_mock_image = os.getenv("USE_MOCK_IMAGE", "false") == "true"
use_mock_video = os.getenv("USE_MOCK_VIDEO", "false") == "true"


class GoogleVertexMediaService(MediaService):
    """Media service using Google GenAI for real image and video generation.

    Uses `imagen-4.0-generate-001` and `veo-3.0-fast-generate-001` models.
    """

    STATIC_IMAGES_DIR = os.path.join("src", "static", "generated", "images")
    STATIC_VIDEOS_DIR = os.path.join("src", "static", "generated", "videos")

    def __init__(self) -> None:
        """Initialise the Google GenAI client for Vertex AI."""
        # Using vertexai=True required for imagen and veo models.
        # This will automatically pick up GOOGLE_CLOUD_PROJECT from the environment.
        self.client = genai.Client(vertexai=True)
        
        # State variable to hold reference images for model context
        self.reference_images_pil: list[Image.Image] = []
        
        # Ensure the static directories exist
        os.makedirs(self.STATIC_IMAGES_DIR, exist_ok=True)
        os.makedirs(self.STATIC_VIDEOS_DIR, exist_ok=True)

    def set_reference_images(self, b64_list: list[str] | None) -> None:
        """Decodes and stores a list of base64 images as PIL images for model context."""
        self.reference_images_pil = []
        if not b64_list:
            return
        for idx, b64_str in enumerate(b64_list):
            try:
                decoded_bytes = base64.b64decode(b64_str)
                img = Image.open(io.BytesIO(decoded_bytes))
                self.reference_images_pil.append(img)
                logger.info("Loaded reference image %d into MediaService state.", idx + 1)
            except Exception as e:
                logger.error("Failed to decode reference image %d: %s", idx + 1, e)

    async def generate_image(self, prompt: str, aspect_ratio: str = "16:9") -> str:
        """Generate an image using the Gemini API and save it locally.
        
        Args:
            prompt: The text prompt describing the image to generate.
            
        Returns:
            The public URL to access the generated image.
        """
        logger.info("Generating real image for prompt: %s", prompt[:80])
        asset_id = uuid.uuid4().hex[:12]

        ### BEGIN TEST

        dimensions = "1080x1920" if aspect_ratio == "9:16" else "1920x1080"
        
        image_number = random.randint(1, 32)
        image_filename = f"image_{image_number}.png"

        if use_mock_image:
            if dimensions == "1080x1920":
                return f"http://localhost:8000/static/generated/images/short/image.jpeg"
            return f"http://localhost:8000/static/generated/images/{image_filename}"

        ### END TEST

        filename = f"img_{asset_id}.png"
        filepath = os.path.join(self.STATIC_IMAGES_DIR, filename)
        
        try:
            # Offload the synchronous SDK call to a background thread
            def _generate_and_save():
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
                                response_modalities=['IMAGE'],
                                image_config=types.ImageConfig(aspect_ratio=aspect_ratio, image_size="2K"),
                            )
                        )
                        break
                    except Exception as e:
                        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                            if attempt < max_retries - 1:
                                logger.warning("Rate limit hit generating image. Retrying in 20s (attempt %d/3)...", attempt + 1)
                                time.sleep(20)
                                continue
                        raise e
                
                saved = False
                if response.parts:
                    for part in response.parts:
                        if image := part.as_image():
                            image.save(filepath)
                            saved = True
                            break
                            
                if not saved:
                    raise ValueError("No image returned by Gemini Image Generation Pipeline.")
                
            await asyncio.to_thread(_generate_and_save)
            
            url = f"http://localhost:8000/static/generated/images/{filename}"
            logger.info("Image generated and saved to: %s", url)
            return url
            
        except Exception as e:
            logger.error("Failed to generate image. Fallback to placeholder. Error: %s", str(e))
            return "https://placehold.co/1920x1080?text=Image+Generation+Failed"
            
    async def generate_video(self, prompt: str, aspect_ratio: str = "16:9") -> str:
        """Generate a video using the Vertex AI Veo API and save it locally.

        Args:
            prompt: The text prompt describing the video to generate.

        Returns:
            The public URL to access the generated video.
        """
        logger.info("Generating video for prompt: %s", prompt[:80])
        asset_id = uuid.uuid4().hex[:12]

        ### BEGIN TEST

        dimensions = "1080x1920" if aspect_ratio == "9:16" else "1920x1080"
        
        if dimensions == "1080x1920":
            dimension_name = "shorts"
        else:
            dimension_name = "longs"

        video_number = random.randint(1, 5)
        filename = f"video_{video_number}.mp4"

        if use_mock_video:
            return f"http://localhost:8000/static/generated/videos/{dimension_name}/{filename}"

        ### END TEST

        filename = f"vid_{asset_id}.mp4"
        filepath = os.path.join(self.STATIC_VIDEOS_DIR, filename)

        try:
            def _generate_and_save():
                # Start the long-running video generation operation
                kwargs = {
                    "model": "veo-3.0-fast-generate-001",
                    "prompt": prompt,
                    "config": types.GenerateVideosConfig(
                        aspect_ratio=aspect_ratio,
                    )
                }
                
                # Veo only supports a single input image
                if self.reference_images_pil:
                    kwargs["image"] = self.reference_images_pil[0]

                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        operation = self.client.models.generate_videos(**kwargs)
                        break
                    except Exception as e:
                        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                            if attempt < max_retries - 1:
                                logger.warning("Rate limit hit generating video. Retrying in 20s (attempt %d/3)...", attempt + 1)
                                time.sleep(20)
                                continue
                        raise e

                # Poll until the operation is complete
                while not operation.done:
                    logger.info("Waiting for video generation to complete...")
                    time.sleep(10)
                    operation = self.client.operations.get(operation)

                # Validate the response contains generated videos
                if not operation.response or not operation.response.generated_videos:
                    logger.warning("Operation completed but returned no videos. Response: %s", operation.response)
                    raise ValueError("No video returned from Veo video generation.")

                # On Vertex AI, video bytes are available directly without calling client.files.download()
                video_bytes = operation.response.generated_videos[0].video.video_bytes
                if not video_bytes:
                    raise ValueError("Operation completed but video_bytes is empty.")

                with open(filepath, "wb") as f:
                    f.write(video_bytes)

            await asyncio.to_thread(_generate_and_save)

            url = f"http://localhost:8000/static/generated/videos/{filename}"
            logger.info("Video saved successfully: %s", url)
            return url

        except Exception as e:
            logger.error("Failed to generate video. Error: %s", str(e))
            return f"https://placehold.co/{dimensions}?text=Video+Generation+Failed"
            
    async def concatenate_videos(self, video_urls: list[str]) -> str:
        """Download and concatenate multiple videos into a single file.

        Args:
            video_urls: List of URLs pointing to the video files to be merged.

        Returns:
            The public URL to access the merged video.
        """
        if not video_urls:
            raise ValueError("video_urls list cannot be empty.")
            
        # Detect mock URLs and short-circuit to avoid moviepy codec crashes on SVGs
        if any("placehold.co" in url for url in video_urls):
            logger.info("Mock video URL detected. Bypassing concatenation logic.")
            await asyncio.sleep(2)  # Simulate processing time
            return "https://placehold.co/1080x1920/000000/FFF?text=Merged+Video"
            
        logger.info("Concatenating %d videos...", len(video_urls))
        asset_id = uuid.uuid4().hex[:12]
        filename = f"merged_{asset_id}.mp4"
        filepath = os.path.join(self.STATIC_VIDEOS_DIR, filename)
        
        # Determine paths for temporary downloads
        temp_dir = os.path.join(self.STATIC_VIDEOS_DIR, "temp_downloads")
        os.makedirs(temp_dir, exist_ok=True)
        temp_filepaths = []
        for i in range(len(video_urls)):
            temp_file = os.path.join(temp_dir, f"temp_{asset_id}_{i}.mp4")
            temp_filepaths.append(temp_file)

        def _merge_and_save():
            import urllib.request
            try:
                # 1. Download videos
                for url, temp_path in zip(video_urls, temp_filepaths):
                    logger.info("Downloading video from %s to %s", url, temp_path)
                    urllib.request.urlretrieve(url, temp_path)
                
                # 2. Extract and concatenate Using moviepy
                from moviepy import VideoFileClip, concatenate_videoclips
                
                clips = []
                final_clip = None
                try:
                    for path in temp_filepaths:
                        clip = VideoFileClip(path)
                        clips.append(clip)
                    
                    logger.info("Concatenating clips...")
                    final_clip = concatenate_videoclips(clips, method='compose')
                    
                    # 3. Write output
                    logger.info("Writing merged video to %s", filepath)
                    # Ensure no audio codec errors if some clips lack sound, and suppress command line output
                    final_clip.write_videofile(
                        filepath, 
                        codec='libx264', 
                        audio_codec='aac', 
                        temp_audiofile=os.path.join(temp_dir, f"temp-audio_{asset_id}.m4a"),
                        remove_temp=True,
                        logger=None
                    )
                finally:
                    # Close the clips manually to avoid memory leaks or file locks on Windows
                    if final_clip is not None:
                        try:
                            final_clip.close()
                        except Exception as e:
                            logger.warning("Error closing final_clip: %s", e)
                    for clip in clips:
                        try:
                            clip.close()
                        except Exception as e:
                            logger.warning("Error closing clip: %s", e)
                
            finally:
                # 4. Cleanup temporary files
                for temp_path in temp_filepaths:
                    if os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except OSError as e:
                            logger.warning("Could not remove temp file %s: %s", temp_path, e)

        # Offload all blocking operations to thread to prevent stalling FastAPI event loop
        await asyncio.to_thread(_merge_and_save)
        
        url = f"http://localhost:8000/static/generated/videos/{filename}"
        logger.info("Merged video saved successfully: %s", url)
        return url
             
    def get_tools(self) -> list:
        """Returns the list of functions intended to be passed to the Gemini 'tools' parameter.
        
        These functions MUST include full docstrings because Gemini uses them to determine
        when and how to call the tools.
        """
        
        # We define nested stubs purely to give Gemini the required metadata cleanly.
        # The agent evaluates the function signatures.
        def generate_image(prompt: str) -> str:
            """Generates a high-quality image from a detailed prompt using a state-of-the-art text-to-image model.
            
            Args:
                prompt: An extremely detailed, visually evocative description of the scene, character, lighting, and composition. Do not include camera movements here.
            
            Returns:
                A URL string pointing to the generated image file.
            """
            pass
            
        def generate_video(prompt: str) -> str:
            """Generates a dynamic video clip from a detailed prompt using a state-of-the-art text-to-video model.
            
            Args:
                prompt: An extremely detailed description of the scene focusing on motion, camera movement (pan, tilt, zoom), subject action, and cinematic lighting.
            
            Returns:
                A URL string pointing to the generated video file.
            """
            pass
            
        return [generate_image, generate_video]
