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


class RegenerateMediaRequest(BaseModel):
    """Body for POST /regenerate_media."""
    media_type: str
    prompt: str
    aspect_ratio: str | None = None


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


@router.post("/regenerate_media")
async def regenerate_media(body: RegenerateMediaRequest):
    """Regenerate a specific media asset (image or video)."""
    manager = _require_manager()
    aspect_ratio = body.aspect_ratio or "16:9"
    
    try:
        if body.media_type == "image":
            new_url = await manager._media_service.generate_image(
                body.prompt,
                aspect_ratio=aspect_ratio,
            )
        elif body.media_type == "video":
            new_url = await manager._media_service.generate_video(
                body.prompt, 
                aspect_ratio=aspect_ratio
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid media_type. Must be 'image' or 'video'.")
            
        return {"url": new_url}
    except Exception as e:
        logger.error("Error during media regeneration: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


class MergeVideosRequest(BaseModel):
    """Body for POST /merge_videos."""
    video_urls: list[str]


@router.post("/merge_videos")
async def merge_videos(body: MergeVideosRequest):
    """Merge multiple videos into a single video."""
    manager = _require_manager()
    try:
        # Check if media_service has concatenate_videos method (e.g. mock vs real)
        if not hasattr(manager._media_service, 'concatenate_videos'):
             raise HTTPException(status_code=501, detail="Media service does not support video concatenation.")
             
        merged_url = await manager._media_service.concatenate_videos(body.video_urls)
        return {"url": merged_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error during video merge: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
