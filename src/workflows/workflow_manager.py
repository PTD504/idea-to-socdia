"""
Abstract base class for managing content-creation workflows.

A concrete ``WorkflowManager`` orchestrates the state machine, LLM
calls, and persistence for one or more concurrent workflows.
"""

from abc import ABC, abstractmethod


class WorkflowManager(ABC):
    """High-level interface for workflow lifecycle operations."""

    @abstractmethod
    async def stream_workflow(
        self,
        topic: str,
        style: str | None,
        target_format: str,
        deep_description: str | None = None,
        reference_images: list[str] | None = None,
        image_instructions: str | None = None,
        include_media_in_post: bool = False,
    ):
        """Streams content creation (text and media events)."""
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
        """Delegate text enhancement to the LLM service."""
        ...


# ------------------------------------------------------------------
# Concrete Implementation
# ------------------------------------------------------------------

import asyncio
import logging
from typing import Any

from src.services.llm_service import LLMService
from src.services.media_service import MediaService

logger = logging.getLogger(__name__)


class ContentWorkflowManager(WorkflowManager):
    """Concrete workflow manager that connects the state machine to an LLM service.

    Maintains an in-memory dictionary of active workflows. Each entry
    maps a ``workflow_id`` to a dict containing the ``ContentStateMachine``
    instance and the generated ``storyboard`` data.
    """

    def __init__(
        self,
        llm_service: LLMService,
        media_service: MediaService,
    ) -> None:
        self._llm_service = llm_service
        self._media_service = media_service

    async def stream_workflow(
        self,
        topic: str,
        style: str | None,
        target_format: str,
        deep_description: str | None = None,
        reference_images: list[str] | None = None,
        image_instructions: str | None = None,
        include_media_in_post: bool = False,
    ):
        """Pass-through to the underlying LLM service streaming content generator."""
        logger.info(
            "Starting workflow stream -- topic=%r, style=%r, target_format=%r, "
            "deep_description=%r, num_ref_images=%d",
            topic, style, target_format, deep_description,
            len(reference_images) if reference_images else 0,
        )
        stream = self._llm_service.stream_creative_content(
            topic=topic,
            style=style,
            target_format=target_format,
            deep_description=deep_description,
            reference_images=reference_images,
            image_instructions=image_instructions,
            include_media_in_post=include_media_in_post,
        )
        async for chunk in stream:
            yield chunk

    async def enhance_text(
        self,
        target_format: str,
        main_field_label: str,
        main_field_text: str,
        target_field_label: str,
        target_field_text: str | None = None,
        extra_context: str | None = None,
    ) -> str:
        """Delegate text enhancement to the LLM service."""
        return await self._llm_service.enhance_text(
            target_format=target_format,
            main_field_label=main_field_label,
            main_field_text=main_field_text,
            target_field_label=target_field_label,
            target_field_text=target_field_text,
            extra_context=extra_context,
        )
