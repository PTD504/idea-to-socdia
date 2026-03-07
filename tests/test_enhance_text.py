"""
Tests for the /enhance_text endpoint and the multi-image set_reference_images helper.
"""

import io
import base64
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from PIL import Image

from src.main import app
from src.api.routes import set_workflow_manager
from src.services.media_service import GoogleVertexMediaService


# ------------------------------------------------------------------
# /enhance_text endpoint tests
# ------------------------------------------------------------------


def _create_mock_manager():
    """Build a mock ContentWorkflowManager with a working enhance_text."""
    manager = MagicMock()
    manager.enhance_text = AsyncMock(return_value="Enhanced caption text.")
    return manager


def test_enhance_text_endpoint_success():
    """POST /enhance_text should return the enhanced text from the manager."""
    mock_manager = _create_mock_manager()

    with TestClient(app) as client:
        set_workflow_manager(mock_manager)
        response = client.post("/enhance_text", json={
            "target_format": "facebook_post",
            "main_field_label": "Topic",
            "main_field_text": "Cats are amazing",
            "target_field_label": "Post Body",
        })

    assert response.status_code == 200
    data = response.json()
    assert data["enhanced_text"] == "Enhanced caption text."
    mock_manager.enhance_text.assert_awaited_once()


def test_enhance_text_endpoint_with_target_text():
    """Existing target_field_text should be passed through to the manager."""
    mock_manager = _create_mock_manager()

    with TestClient(app) as client:
        set_workflow_manager(mock_manager)
        response = client.post("/enhance_text", json={
            "target_format": "instagram_post",
            "main_field_label": "Topic",
            "main_field_text": "Beach vibes",
            "target_field_label": "Caption",
            "target_field_text": "asdfjkl;",
            "extra_context": "summer mood",
        })

    assert response.status_code == 200
    call_kwargs = mock_manager.enhance_text.call_args[1]
    assert call_kwargs["target_field_text"] == "asdfjkl;"
    assert call_kwargs["extra_context"] == "summer mood"


# ------------------------------------------------------------------
# Multi-image set_reference_images tests
# ------------------------------------------------------------------


def _make_b64_png(width: int = 2, height: int = 2) -> str:
    """Create a minimal valid PNG image encoded as base64."""
    img = Image.new("RGB", (width, height), color="red")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@patch("src.services.media_service.genai")
def test_set_reference_images_multiple(mock_genai):
    """set_reference_images should decode and store multiple PIL images."""
    service = GoogleVertexMediaService()
    b64_list = [_make_b64_png(), _make_b64_png(4, 4), _make_b64_png(8, 8)]

    service.set_reference_images(b64_list)

    assert len(service.reference_images_pil) == 3
    assert service.reference_images_pil[0].size == (2, 2)
    assert service.reference_images_pil[1].size == (4, 4)
    assert service.reference_images_pil[2].size == (8, 8)


@patch("src.services.media_service.genai")
def test_set_reference_images_none_clears_list(mock_genai):
    """Passing None should reset the reference images list to empty."""
    service = GoogleVertexMediaService()
    # Pre-load one image
    service.set_reference_images([_make_b64_png()])
    assert len(service.reference_images_pil) == 1

    # Clear
    service.set_reference_images(None)
    assert len(service.reference_images_pil) == 0


@patch("src.services.media_service.genai")
def test_set_reference_images_empty_list(mock_genai):
    """An empty list should also result in an empty reference images list."""
    service = GoogleVertexMediaService()
    service.set_reference_images([])
    assert len(service.reference_images_pil) == 0
