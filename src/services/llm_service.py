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
    async def generate_interleaved_storyboard(
        self,
        dynamic_system_prompt: str,
        topic: str,
        **kwargs,
    ) -> dict:
        """Generate an interleaved storyboard of text and image prompts.

        Args:
            dynamic_system_prompt: The system prompt produced by
                ``generate_dynamic_system_prompt``.
            topic: The content topic.

        Returns:
            A dict representing the structured storyboard
            (keys / schema TBD by concrete implementation).
        """
        ...
