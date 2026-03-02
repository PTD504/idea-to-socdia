"""
Content workflow state machine with HITL pause support.

Defines the valid workflow states and a state machine that blocks
at the HITL_REVIEW gate until an external approval signal is received.
"""

import asyncio
import enum
import logging
import uuid
from typing import Optional

logger = logging.getLogger(__name__)


class ContentWorkflowState(enum.Enum):
    """Ordered states for the content-creation workflow."""

    TOPIC_ANALYSIS_AND_PROMPTING = "topic_analysis_and_prompting"
    INTERLEAVED_GENERATION = "interleaved_generation"
    HITL_REVIEW = "hitl_review"
    ASSET_GENERATION = "asset_generation"
    PUBLISH_TO_YOUTUBE = "publish_to_youtube"
    COMPLETED = "completed"


# Explicit forward-only transition map.
_TRANSITIONS: dict[ContentWorkflowState, Optional[ContentWorkflowState]] = {
    ContentWorkflowState.TOPIC_ANALYSIS_AND_PROMPTING: ContentWorkflowState.INTERLEAVED_GENERATION,
    ContentWorkflowState.INTERLEAVED_GENERATION: ContentWorkflowState.HITL_REVIEW,
    ContentWorkflowState.HITL_REVIEW: ContentWorkflowState.ASSET_GENERATION,
    ContentWorkflowState.ASSET_GENERATION: ContentWorkflowState.PUBLISH_TO_YOUTUBE,
    ContentWorkflowState.PUBLISH_TO_YOUTUBE: ContentWorkflowState.COMPLETED,
    ContentWorkflowState.COMPLETED: None,  # Terminal state
}


class InvalidTransitionError(Exception):
    """Raised when a state transition is not allowed."""


class ContentStateMachine:
    """
    Manages the lifecycle of a single content-creation workflow.

    The machine advances linearly through the defined states.  When it
    reaches ``HITL_REVIEW`` the ``advance()`` coroutine **awaits** an
    ``asyncio.Event`` so the workflow is paused until a human approves
    via ``approve_review()``.
    """

    def __init__(self, workflow_id: Optional[str] = None) -> None:
        self.workflow_id: str = workflow_id or uuid.uuid4().hex
        self.current_state: ContentWorkflowState = (
            ContentWorkflowState.TOPIC_ANALYSIS_AND_PROMPTING
        )
        self._review_event: asyncio.Event = asyncio.Event()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def advance(self) -> ContentWorkflowState:
        """Move to the next state in the workflow.

        If the next state is ``HITL_REVIEW`` the coroutine will block
        until ``approve_review()`` is called.  Raises
        ``InvalidTransitionError`` if the machine is already in the
        terminal state.

        Returns:
            The new ``ContentWorkflowState`` after the transition.
        """
        next_state = _TRANSITIONS.get(self.current_state)
        if next_state is None:
            raise InvalidTransitionError(
                f"Cannot advance from terminal state "
                f"'{self.current_state.value}'."
            )

        self.current_state = next_state
        logger.info(
            "Workflow %s transitioned to %s",
            self.workflow_id,
            self.current_state.value,
        )

        # Block at the HITL review gate until external approval.
        if self.current_state == ContentWorkflowState.HITL_REVIEW:
            logger.info(
                "Workflow %s paused at HITL_REVIEW -- awaiting approval.",
                self.workflow_id,
            )
            await self._review_event.wait()
            logger.info(
                "Workflow %s approved -- HITL_REVIEW unblocked.",
                self.workflow_id,
            )

        return self.current_state

    def approve_review(self) -> None:
        """Unblock a workflow that is paused at ``HITL_REVIEW``.

        Raises ``InvalidTransitionError`` if the machine is not
        currently in the ``HITL_REVIEW`` state.
        """
        if self.current_state != ContentWorkflowState.HITL_REVIEW:
            raise InvalidTransitionError(
                f"Cannot approve review: workflow is in "
                f"'{self.current_state.value}', not 'hitl_review'."
            )

        self._review_event.set()
        logger.info("Workflow %s review approved.", self.workflow_id)

    def reset(self) -> None:
        """Return the machine to its initial state."""
        self.current_state = ContentWorkflowState.TOPIC_ANALYSIS_AND_PROMPTING
        self._review_event = asyncio.Event()
        logger.info("Workflow %s has been reset.", self.workflow_id)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def status(self) -> dict:
        """Return a JSON-serialisable snapshot of the machine."""
        return {
            "workflow_id": self.workflow_id,
            "current_state": self.current_state.value,
        }

    def __repr__(self) -> str:
        return (
            f"ContentStateMachine(workflow_id={self.workflow_id!r}, "
            f"state={self.current_state.value!r})"
        )
