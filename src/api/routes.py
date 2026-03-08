"""
API routes for the content-creation agent.

Provides health-check, workflow creation, status, and approval endpoints.
"""

import logging

import asyncio
import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

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
    """Body for POST /stream_workflow."""
    topic: str
    style: str | None = None
    target_format: str
    deep_description: str | None = None
    reference_images: list[str] | None = None
    image_instructions: str | None = None
    include_media_in_post: bool = False


class EnhanceTextRequest(BaseModel):
    """Body for POST /enhance_text."""
    target_format: str
    main_field_label: str
    main_field_text: str
    target_field_label: str
    target_field_text: str | None = None
    extra_context: str | None = None


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------


@router.get("/health")
async def health_check() -> dict:
    """Liveness probe."""
    return {"status": "ok"}

@router.post("/stream_workflow")
async def stream_workflow(body: StartWorkflowRequest):
    """Start and stream a content-creation workflow.
    
    Yields NDJSON encoded dictionary chunks containing text generation
    and tool execution statuses.
    """
    manager = _require_manager()
    
    async def event_generator():
        # Validate: cannot include media in post without reference images
        if body.include_media_in_post and not body.reference_images:
            yield json.dumps({"type": "error", "error": "Cannot include media in post if no reference images are provided."}) + "\n"
            return

        try:
            stream = manager.stream_workflow(
                topic=body.topic,
                style=body.style,
                target_format=body.target_format,
                deep_description=body.deep_description,
                reference_images=body.reference_images,
                image_instructions=body.image_instructions,
                include_media_in_post=body.include_media_in_post,
            )
            async for chunk in stream:
                # NDJSON format: JSON object followed by newline
                yield json.dumps(chunk) + "\n"
                
        except asyncio.CancelledError:
            logger.info("Client disconnected from streaming workflow early.")
            raise # Re-raise for FastAPI to handle disconnection cleanly
        except Exception as e:
            logger.error("Error during streaming workflow: %s", e)
            error_chunk = {"type": "error", "error": str(e)}
            yield json.dumps(error_chunk) + "\n"
            
    return StreamingResponse(
        event_generator(), 
        media_type="application/x-ndjson"
    )


@router.post("/enhance_text")
async def enhance_text(body: EnhanceTextRequest):
    """Enhance or generate text for a specific form field using the LLM."""
    manager = _require_manager()
    try:
        result = await manager.enhance_text(
            target_format=body.target_format,
            main_field_label=body.main_field_label,
            main_field_text=body.main_field_text,
            target_field_label=body.target_field_label,
            target_field_text=body.target_field_text,
            extra_context=body.extra_context,
        )
        return {"enhanced_text": result}
    except Exception as e:
        logger.error("Error during text enhancement: %s", e)
        raise HTTPException(status_code=500, detail=str(e))