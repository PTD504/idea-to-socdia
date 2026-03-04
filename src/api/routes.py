"""
API routes for the content-creation agent.

Provides health-check, workflow creation, status, and approval endpoints.
"""

import logging

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.core.state_machine import InvalidTransitionError
from src.workflows.workflow_manager import ContentWorkflowManager

logger = logging.getLogger(__name__)

router = APIRouter()

# The workflow manager is injected at startup via ``set_workflow_manager``.
_manager: ContentWorkflowManager | None = None


def set_workflow_manager(manager: ContentWorkflowManager) -> None:
    """Wire the concrete workflow manager into the router at startup."""
    global _manager
    _manager = manager


def _require_manager() -> ContentWorkflowManager:
    """Return the manager or raise a 503 if it has not been configured."""
    if _manager is None:
        raise HTTPException(
            status_code=503,
            detail="Workflow manager not initialised.",
        )
    return _manager


# ------------------------------------------------------------------
# Request / Response schemas
# ------------------------------------------------------------------


class StartWorkflowRequest(BaseModel):
    """Body for POST /workflows."""
    topic: str
    style: str
    deep_description: Optional[str] = None


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------


@router.get("/health")
async def health_check() -> dict:
    """Liveness probe."""
    return {"status": "ok"}


@router.get("/workflows")
async def list_workflows() -> list[dict]:
    """Return a list of all workflows currently in memory."""
    manager = _require_manager()
    return manager.get_all_workflows()


@router.post("/workflows")
async def create_workflow(body: StartWorkflowRequest) -> dict:
    """Start a new content-creation workflow.

    The workflow runs through prompt generation and storyboard creation,
    then pauses at HITL_REVIEW for human approval.
    """
    manager = _require_manager()
    workflow_id = await manager.start_workflow(
        topic=body.topic,
        style=body.style,
        deep_description=body.deep_description,
    )
    status = await manager.get_workflow_status(workflow_id)
    return status


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str) -> dict:
    """Return the current state and storyboard for a workflow."""
    manager = _require_manager()
    try:
        return await manager.get_workflow_status(workflow_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Workflow not found.")


@router.post("/workflows/{workflow_id}/approve")
async def approve_workflow(workflow_id: str) -> dict:
    """Trigger the HITL approval for a workflow stuck at review.

    This unblocks the ``advance()`` coroutine so the state machine
    transitions from ``HITL_REVIEW`` through the remaining pipeline to ``COMPLETED``.
    """
    manager = _require_manager()
    try:
        await manager.approve_workflow(workflow_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    except InvalidTransitionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    status = await manager.get_workflow_status(workflow_id)
    return {
        "message": "Review approved.",
        **status,
    }
