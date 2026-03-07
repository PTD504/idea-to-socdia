"""
Abstract base class for LLM service integrations.

Concrete subclasses will wrap specific providers (e.g. OpenAI, Gemini)
and implement the methods required by the interleaved generation workflow.
"""

from abc import ABC, abstractmethod


class LLMService(ABC):
    """Interface that every LLM backend must satisfy."""

    @abstractmethod
    async def generate_dynamic_system_prompt(
        self,
        topic: str,
        style: str,
        deep_description: str | None = None,
        **kwargs,
    ) -> str:
        """Build a tailored system prompt for the given topic and style.

        Args:
            topic: The subject the content will cover.
            style: Desired visual / tonal style for the content.
            deep_description: Optional detailed description elements.

        Returns:
            A fully-formed system prompt string.
        """
        ...

    @abstractmethod
    async def stream_creative_content(
        self,
        topic: str,
        target_format: str,
        deep_description: str | None = None,
        style: str | None = None,
        reference_images: list[str] | None = None,
        image_instructions: str | None = None,
        include_media_in_post: bool = True,
    ):
        """Stream interleaved text and media generation events.

        Args:
            topic: The core subject of the content.
            target_format: The intended platform format (e.g., 'facebook_post', 'youtube_short').
            deep_description: Optional detailed context or instructions.
            style: Optional artistic or tonal style instructions.
            reference_images: Optional list of base64-encoded reference images.
            image_instructions: Optional instructions on how to use the reference images.
            include_media_in_post: Whether the generated post should include media assets.

        Yields:
            Dicts representing streaming chunks, such as:
            - {"type": "text", "content": "..."}
            - {"type": "tool_start", "tool": "...", "args": {...}}
            - {"type": "media_result", "tool": "...", "url": "..."}
        """
        ...

    @abstractmethod
    async def enhance_text(
        self,
        target_format: str,
        main_field_label: str,
        main_field_text: str,
        target_field_label: str,
        target_field_text: str | None = None,
        extra_context: str | None = None,
    ) -> str:
        """Enhance or generate text for a specific form field.

        Uses the LLM to act as an expert copywriter, producing polished
        content suitable for the given target format and field.

        Args:
            target_format: The social media platform format.
            main_field_label: Label of the primary input field.
            main_field_text: The core idea / topic text.
            target_field_label: Label of the field to generate content for.
            target_field_text: Optional existing text in the target field.
            extra_context: Optional extra context to guide generation.

        Returns:
            The enhanced or freshly generated text string.
        """
        ...
