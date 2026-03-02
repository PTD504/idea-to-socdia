"""
Abstract and concrete media generation services.

Provides an interface for generating images and videos from text prompts,
and a mock implementation simulating Google Vertex AI rendering times.
"""

import asyncio
import logging
import uuid
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
    """Media service using Google GenAI for real image generation.

    Uses the real 'imagen-4.0-fast-generate-001' model to generate images and
    saves them locally to `frontend/static/images/`.
    Returns the local static URL for frontend rendering.
    Video generation remains mocked for speed.
    """

    STORAGE_BASE = "https://storage.googleapis.com/idea-to-socdia-assets"
    STATIC_DIR = os.path.join("frontend", "static", "images")

    def __init__(self) -> None:
        """Initialise the Google GenAI client."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY environment variable not found.")

        self.client = genai.Client(api_key=api_key)
        
        # Ensure the static directory exists
        os.makedirs(self.STATIC_DIR, exist_ok=True)

    async def generate_image(self, prompt: str) -> str:
        """Generate an image using the Gemini API and save it locally."""
        asset_id = uuid.uuid4().hex[:12]
        filename = f"{asset_id}.png"
        filepath = os.path.join(self.STATIC_DIR, filename)
        
        logger.info("Generating real image for prompt: %s", prompt[:80])
        
        # Offload the synchronous SDK call to a background thread
        def _generate():
            return self.client.models.generate_images(
                model='imagen-4.0-fast-generate-001',
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="16:9",
                )
            )
        # def _generate():
        #     return self.client.models.generate_content(
        #         model='gemini-2.5-flash-image',
        #         contents=[prompt],
        #         config=types.GenerateContentConfig(
        #             response_modalities=["IMAGE"],
        #             image_config=types.ImageConfig(
        #                 aspect_ratio="16:9",
        #                 image_size="1K",
        #             )
        #         )
        #     )
            
        result = await asyncio.to_thread(_generate)
        
        if not result.generated_images:
            raise ValueError("No images returned from Gemini API.")
            
        generated_image = result.generated_images[0]
        image_bytes = generated_image.image.image_bytes
        
        # Save image bytes locally
        def _save():
            with open(filepath, "wb") as f:
                f.write(image_bytes)
                
        await asyncio.to_thread(_save)
        
        url = f"/static/images/{filename}"
        logger.info("Real image generated and saved to: %s", url)
        return url

    async def generate_video(self, prompt: str) -> str:
        """Simulate video generation with a longer delay."""
        asset_id = uuid.uuid4().hex[:12]
        logger.info("Generating video for prompt: %s", prompt[:80])
        # Simulate longer rendering time for video.
        await asyncio.sleep(0.1)
        url = f"{self.STORAGE_BASE}/videos/{asset_id}.mp4"
        logger.info("Video generated: %s", url)
        return url
