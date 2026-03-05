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
from google import genai
from google.genai import types


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
        
        # Ensure the static directories exist
        os.makedirs(self.STATIC_IMAGES_DIR, exist_ok=True)
        os.makedirs(self.STATIC_VIDEOS_DIR, exist_ok=True)

    async def generate_image(self, prompt: str) -> str:
        """Generate an image using the Gemini API and save it locally.
        
        Args:
            prompt: The text prompt describing the image to generate.
            
        Returns:
            The public URL to access the generated image.
        """
        logger.info("Generating real image for prompt: %s", prompt[:80])
        asset_id = uuid.uuid4().hex[:12]
        filename = f"img_{asset_id}.png"
        filepath = os.path.join(self.STATIC_IMAGES_DIR, filename)
        
        try:
            # Offload the synchronous SDK call to a background thread
            def _generate():
                return self.client.models.generate_images(
                    model='imagen-4.0-generate-001',
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio="16:9",
                        output_mime_type="image/png"
                    )
                )
                
            result = await asyncio.to_thread(_generate)
            
            if not result.generated_images:
                raise ValueError("No images returned from Vertex AI Image Generation Pipeline.")
                
            generated_image = result.generated_images[0]
            image_bytes = generated_image.image.image_bytes
            
            # Save image bytes locally
            def _save():
                with open(filepath, "wb") as f:
                    f.write(image_bytes)
                    
            await asyncio.to_thread(_save)
            
            url = f"http://localhost:8000/static/generated/images/{filename}"
            logger.info("Image generated and saved to: %s", url)
            return url
            
        except Exception as e:
            logger.error("Failed to generate image. Fallback to placeholder. Error: %s", str(e))
            return "https://placehold.co/1920x1080?text=Image+Generation+Failed"
            
    async def generate_video(self, prompt: str) -> str:
        """Generate a video using the Vertex AI Veo API and save it locally.

        Args:
            prompt: The text prompt describing the video to generate.

        Returns:
            The public URL to access the generated video.
        """
        logger.info("Generating video for prompt: %s", prompt[:80])
        asset_id = uuid.uuid4().hex[:12]
        filename = f"vid_{asset_id}.mp4"
        filepath = os.path.join(self.STATIC_VIDEOS_DIR, filename)

        try:
            def _generate_and_save():
                # Start the long-running video generation operation
                operation = self.client.models.generate_videos(
                    model='veo-3.0-fast-generate-001',
                    prompt=prompt,
                    config=types.GenerateVideosConfig(
                        aspect_ratio="9:16",
                    )
                )

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
            return "https://placehold.co/1920x1080?text=Video+Generation+Failed"
             
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
