"""
Tests for ContentWorkflowManager.

Verifies the end-to-end workflow orchestration by mocking the LLM,
media, and YouTube services, ensuring state transitions, storyboard
storage, asset URL resolution, and YouTube publishing work correctly.
"""

import asyncio
from unittest.mock import AsyncMock

import pytest

from src.core.state_machine import ContentWorkflowState
from src.services.llm_service import LLMService
from src.services.media_service import MediaService
from src.services.youtube_service import YouTubeService
from src.workflows.workflow_manager import ContentWorkflowManager


@pytest.fixture
def mock_llm_service():
    """Create a fully mocked LLMService with predictable return values."""
    service = AsyncMock(spec=LLMService)
    service.generate_dynamic_system_prompt.return_value = (
        "You are a Creative Director specialising in cats."
    )
    service.generate_interleaved_storyboard.return_value = {
        "scenes": [
            {
                "narration": "A cat stretches lazily.",
                "image_prompt": "A fluffy cat stretching on a windowsill.",
                "video_prompt": "Short clip of a cat yawning.",
            }
        ]
    }
    return service


@pytest.fixture
def mock_media_service():
    """Create a mocked MediaService returning deterministic URLs."""
    service = AsyncMock(spec=MediaService)
    service.generate_image.return_value = (
        "https://storage.googleapis.com/idea-to-socdia-assets/images/test123.png"
    )
    service.generate_video.return_value = (
        "https://storage.googleapis.com/idea-to-socdia-assets/videos/test456.mp4"
    )
    return service


@pytest.fixture
def mock_youtube_service():
    """Create a mocked YouTubeService returning a deterministic video ID."""
    service = AsyncMock(spec=YouTubeService)
    service.upload_video.return_value = "yt_dummy_id_1"
    return service


@pytest.fixture
def manager(mock_llm_service, mock_media_service, mock_youtube_service):
    """Instantiate a ContentWorkflowManager with all mocked services."""
    return ContentWorkflowManager(
        llm_service=mock_llm_service,
        media_service=mock_media_service,
        youtube_service=mock_youtube_service,
    )


# ------------------------------------------------------------------
# start_workflow tests
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_start_workflow_returns_id(manager):
    """start_workflow should return a non-empty workflow ID string."""
    workflow_id = await manager.start_workflow(
        topic="Cats", style="Cinematic"
    )
    assert isinstance(workflow_id, str)
    assert len(workflow_id) > 0


@pytest.mark.asyncio
async def test_start_workflow_calls_llm_service(manager, mock_llm_service):
    """The manager should call both LLM methods during start_workflow."""
    await manager.start_workflow(topic="Cats", style="Cinematic")

    mock_llm_service.generate_dynamic_system_prompt.assert_awaited_once_with(
        topic="Cats", style="Cinematic", deep_description=None,
    )
    mock_llm_service.generate_interleaved_storyboard.assert_awaited_once_with(
        dynamic_system_prompt="You are a Creative Director specialising in cats.",
        topic="Cats",
    )


@pytest.mark.asyncio
async def test_workflow_pauses_at_hitl_review(manager):
    """After start_workflow the state machine should be at HITL_REVIEW."""
    workflow_id = await manager.start_workflow(
        topic="Cats", style="Cinematic"
    )
    status = await manager.get_workflow_status(workflow_id)
    assert status["current_state"] == ContentWorkflowState.HITL_REVIEW.value


@pytest.mark.asyncio
async def test_storyboard_stored_in_memory(manager):
    """The storyboard returned by the LLM should be stored in the workflow entry."""
    workflow_id = await manager.start_workflow(
        topic="Cats", style="Cinematic"
    )
    status = await manager.get_workflow_status(workflow_id)
    assert status["storyboard"] is not None
    assert status["storyboard"]["scenes"][0]["narration"] == "A cat stretches lazily."


# ------------------------------------------------------------------
# approve_workflow and post-approval pipeline tests
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_approve_workflow_transitions_to_completed(manager):
    """Approving the review should eventually transition to COMPLETED."""
    workflow_id = await manager.start_workflow(
        topic="Cats", style="Cinematic"
    )

    await manager.approve_workflow(workflow_id)

    # Give the background task time to complete the full pipeline.
    await asyncio.sleep(0.5)

    status = await manager.get_workflow_status(workflow_id)
    assert status["current_state"] == ContentWorkflowState.COMPLETED.value


@pytest.mark.asyncio
async def test_asset_urls_resolved_in_storyboard(
    manager, mock_media_service,
):
    """After approval, the storyboard scenes should contain generated asset URLs."""
    workflow_id = await manager.start_workflow(
        topic="Cats", style="Cinematic"
    )

    await manager.approve_workflow(workflow_id)
    await asyncio.sleep(0.5)

    status = await manager.get_workflow_status(workflow_id)
    scene = status["storyboard"]["scenes"][0]

    assert scene["image_url"] == (
        "https://storage.googleapis.com/idea-to-socdia-assets/images/test123.png"
    )
    assert scene["video_url"] == (
        "https://storage.googleapis.com/idea-to-socdia-assets/videos/test456.mp4"
    )

    mock_media_service.generate_image.assert_awaited_once()
    mock_media_service.generate_video.assert_awaited_once()


@pytest.mark.asyncio
async def test_youtube_video_id_stored(manager, mock_youtube_service):
    """After full pipeline, the YouTube video ID should be stored."""
    workflow_id = await manager.start_workflow(
        topic="Cats", style="Cinematic"
    )

    await manager.approve_workflow(workflow_id)
    await asyncio.sleep(0.5)

    status = await manager.get_workflow_status(workflow_id)
    assert status["youtube_video_id"] == "yt_dummy_id_1"
    mock_youtube_service.upload_video.assert_awaited_once()


# ------------------------------------------------------------------
# Error handling
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_unknown_workflow_raises(manager):
    """Requesting a non-existent workflow should raise KeyError."""
    with pytest.raises(KeyError, match="not found"):
        await manager.get_workflow_status("nonexistent-id")
