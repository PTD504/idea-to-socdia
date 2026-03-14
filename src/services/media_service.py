"""
Abstract media generation service definitions.
"""

from abc import ABC, abstractmethod


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
