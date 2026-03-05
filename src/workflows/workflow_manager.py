"""
Abstract base class for managing content-creation workflows.

A concrete ``WorkflowManager`` orchestrates the state machine, LLM
calls, and persistence for one or more concurrent workflows.
"""

from abc import ABC, abstractmethod


class WorkflowManager(ABC):
    """High-level interface for workflow lifecycle operations."""

    @abstractmethod
    async def start_workflow(self, topic: str, style: str, deep_description: str | None = None) -> str:
        """Create and kick off a new content workflow.

        Args:
            topic: The subject the content will cover.
            style: Desired visual / tonal style.

        Returns:
            A unique workflow ID.
        """
        ...

    @abstractmethod
    async def get_workflow_status(self, workflow_id: str) -> dict:
        """Return the current status of a workflow.

        Args:
            workflow_id: Identifier returned by ``start_workflow``.

        Returns:
            A dict with at least ``workflow_id`` and ``current_state``.
        """
        ...

    @abstractmethod
    async def approve_workflow(self, workflow_id: str) -> None:
        """Approve the HITL review gate for a workflow.

        Args:
            workflow_id: Identifier returned by ``start_workflow``.
        """
    @abstractmethod
    def get_all_workflows(self) -> list[dict]:
        """Return a list of all active workflows and their statuses."""
        ...

    @abstractmethod
    async def stream_workflow(
        self,
        topic: str,
        style: str,
        target_format: str,
        deep_description: str | None = None,
    ):
        """Streams content creation (text and media events)."""
        ...


# ------------------------------------------------------------------
# Concrete Implementation
# ------------------------------------------------------------------

import asyncio
import logging
from typing import Any

from src.core.state_machine import (
    ContentStateMachine,
    ContentWorkflowState,
    InvalidTransitionError,
)
from src.services.llm_service import LLMService
from src.services.media_service import MediaService
from src.services.youtube_service import YouTubeService

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
        youtube_service: YouTubeService,
    ) -> None:
        self._llm_service = llm_service
        self._media_service = media_service
        self._youtube_service = youtube_service
        # In-memory store: workflow_id -> {"state_machine": ..., "storyboard": ..., ...}
        self._workflows: dict[str, dict[str, Any]] = {}

    @property
    def workflows(self) -> dict[str, dict[str, Any]]:
        """Read-only access to the in-memory workflow store."""
        return self._workflows

    async def start_workflow(self, topic: str, style: str, deep_description: str | None = None) -> str:
        """Orchestrate a new content workflow end-to-end.

        1. Create a state machine (starts at TOPIC_ANALYSIS_AND_PROMPTING).
        2. Call LLM to generate a dynamic system prompt.
        3. Advance to INTERLEAVED_GENERATION and generate the storyboard.
        4. Store the storyboard in memory.
        5. Fire ``advance()`` as a background task so it blocks at
           HITL_REVIEW without blocking the caller.

        Returns:
            The workflow ID.
        """
        sm = ContentStateMachine()
        workflow_id = sm.workflow_id

        self._workflows[workflow_id] = {
            "state_machine": sm,
            "topic": topic,
            "style": style,
            "deep_description": deep_description,
            "storyboard": None,
            "youtube_video_id": None,
        }

        logger.info(
            "Workflow %s started -- topic=%r, style=%r, deep_description=%r",
            workflow_id, topic, style, deep_description,
        )

        # -- Phase 1: TOPIC_ANALYSIS_AND_PROMPTING --
        # State machine already starts at this state.
        dynamic_system_prompt = await self._llm_service.generate_dynamic_system_prompt(
            topic=topic,
            style=style,
            deep_description=deep_description,
        )
        logger.info("Workflow %s: dynamic system prompt generated.", workflow_id)

        # -- Phase 2: INTERLEAVED_GENERATION --
        await sm.advance()  # TOPIC_ANALYSIS -> INTERLEAVED_GENERATION

        storyboard = await self._llm_service.generate_interleaved_storyboard(
            dynamic_system_prompt=dynamic_system_prompt,
            topic=topic,
        )
        self._workflows[workflow_id]["storyboard"] = storyboard
        logger.info("Workflow %s: storyboard generated.", workflow_id)

        # -- Phase 3: Advance to HITL_REVIEW (blocks until approval) --
        # Fire the remaining pipeline as a background task.
        asyncio.create_task(
            self._run_review_and_publish(workflow_id, sm)
        )

        # Give the event loop a chance to start the task so the state
        # is already HITL_REVIEW when the caller reads it.
        await asyncio.sleep(0)

        return workflow_id

    async def _run_review_and_publish(
        self,
        workflow_id: str,
        sm: ContentStateMachine,
    ) -> None:
        """Background coroutine that blocks at HITL_REVIEW then drives
        the rest of the pipeline: asset generation, YouTube publish,
        and transition to COMPLETED.
        """
        # This call blocks until approve_review() sets the event.
        await sm.advance()  # INTERLEAVED_GENERATION -> HITL_REVIEW (blocks)

        storyboard = self._workflows[workflow_id].get("storyboard", {})

        # -- Phase 4: ASSET_GENERATION --
        await sm.advance()  # HITL_REVIEW -> ASSET_GENERATION
        logger.info("Workflow %s: starting asset generation.", workflow_id)

        scenes = storyboard.get("scenes", [])
        for scene in scenes:
            # Resolve image prompt into a generated URL.
            image_prompt = scene.get("image_prompt")
            if image_prompt:
                scene["image_url"] = await self._media_service.generate_image(
                    image_prompt
                )

            # Resolve video prompt into a generated URL (if present).
            video_prompt = scene.get("video_prompt")
            if video_prompt:
                scene["video_url"] = await self._media_service.generate_video(
                    video_prompt
                )

        self._workflows[workflow_id]["storyboard"] = storyboard
        logger.info("Workflow %s: asset generation complete.", workflow_id)

        # -- Phase 5: PUBLISH_TO_YOUTUBE --
        await sm.advance()  # ASSET_GENERATION -> PUBLISH_TO_YOUTUBE
        logger.info("Workflow %s: publishing to YouTube.", workflow_id)

        # Build a simple combined video URL from the first available video asset.
        video_url = ""
        for scene in scenes:
            if scene.get("video_url"):
                video_url = scene["video_url"]
                break
            if scene.get("image_url"):
                video_url = scene["image_url"]
                break

        narration_title = scenes[0].get("narration", "Untitled")[:70] if scenes else "Untitled"
        youtube_id = await self._youtube_service.upload_video(
            video_url=video_url,
            title=narration_title,
            description=f"Auto-generated content for workflow {workflow_id}.",
        )
        self._workflows[workflow_id]["youtube_video_id"] = youtube_id
        logger.info(
            "Workflow %s: published to YouTube (video_id=%s).",
            workflow_id, youtube_id,
        )

        # -- Phase 6: COMPLETED --
        await sm.advance()  # PUBLISH_TO_YOUTUBE -> COMPLETED
        logger.info("Workflow %s: pipeline completed.", workflow_id)

    async def get_workflow_status(self, workflow_id: str) -> dict:
        """Return the current state and storyboard for a given workflow."""
        entry = self._workflows.get(workflow_id)
        if entry is None:
            raise KeyError(f"Workflow '{workflow_id}' not found.")

        sm: ContentStateMachine = entry["state_machine"]
        return {
            "workflow_id": workflow_id,
            "current_state": sm.current_state.value,
            "storyboard": entry.get("storyboard"),
            "youtube_video_id": entry.get("youtube_video_id"),
        }

    async def approve_workflow(self, workflow_id: str) -> None:
        """Approve the HITL review gate, unblocking the background task."""
        entry = self._workflows.get(workflow_id)
        if entry is None:
            raise KeyError(f"Workflow '{workflow_id}' not found.")

        sm: ContentStateMachine = entry["state_machine"]
        sm.approve_review()

    def get_all_workflows(self) -> list[dict]:
        """Return a list summarizing all active workflows."""
        summary = []
        for wid, entry in self._workflows.items():
            sm: ContentStateMachine = entry["state_machine"]
            summary.append({
                "workflow_id": wid,
                "topic": entry.get("topic"),
                "style": entry.get("style"),
                "current_state": sm.current_state.value,
            })
        return summary
    async def stream_workflow(
        self,
        topic: str,
        style: str,
        target_format: str,
        deep_description: str | None = None,
    ):
        """Pass-through to the underlying LLM service streaming content generator."""
        logger.info(
            "Starting workflow stream -- topic=%r, style=%r, target_format=%r, deep_description=%r",
            topic, style, target_format, deep_description,
        )
        stream = self._llm_service.stream_creative_content(
            topic=topic,
            style=style,
            target_format=target_format,
            deep_description=deep_description,
        )
        async for chunk in stream:
            yield chunk
