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
    ):
        """Stream interleaved text and media generation events.

        Args:
            topic: The core subject of the content.
            target_format: The intended platform format (e.g., 'facebook_post', 'youtube_short').
            deep_description: Optional detailed context or instructions.
            style: Optional artistic or tonal style instructions.

        Yields:
            Dicts representing streaming chunks, such as:
            - {"type": "text", "content": "..."}
            - {"type": "tool_start", "tool": "...", "args": {...}}
            - {"type": "media_result", "tool": "...", "url": "..."}
        """
        ...
