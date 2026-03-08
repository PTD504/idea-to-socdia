"""
Tests for the GoogleGenAIService and centralized prompt builders,
verifying API call wiring and prompt construction.
"""

import os
from unittest.mock import MagicMock, patch
import pytest

from src.services.google_genai_service import GoogleGenAIService
from src.core.prompts import build_stream_system_prompt, build_enhance_text_prompt


@pytest.fixture
def mock_genai_client():
    with patch("src.services.google_genai_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        yield mock_client


@pytest.fixture
def service(mock_genai_client, monkeypatch):
    """Set API key so it does not fail initialization."""
    monkeypatch.setenv("GEMINI_API_KEY", "fake-api-key")
    return GoogleGenAIService()


def test_build_stream_system_prompt_contains_format_and_topic():
    """Verifies the centralized builder injects Two-Phase rules, format guidelines, and topic."""
    prompt = build_stream_system_prompt(
        topic="A day in the life of a cat",
        target_format="facebook_post",
        style="Cinematic documentary",
    )

    # Must contain the Two-Phase rule
    assert "TWO STRICT PHASES" in prompt
    assert "PHASE 1" in prompt
    assert "PHASE 2" in prompt
    assert "<final_deliverable>" in prompt
    assert "<content_body>" in prompt
    # Must contain format-specific guidelines
    assert "Facebook Post" in prompt
    assert "generate_image" in prompt
    # Must contain content context
    assert "A day in the life of a cat" in prompt
    assert "Cinematic documentary" in prompt


def test_build_stream_system_prompt_with_ref_images_and_inclusion():
    """When has_reference_images=True and include_media_in_post=True, asset inclusion block appears."""
    prompt = build_stream_system_prompt(
        topic="Test topic",
        target_format="facebook_post",
        has_reference_images=True,
        include_media_in_post=True,
    )
    assert "USER ASSET INCLUSION" in prompt
    # Must NOT disable tools
    assert "DO NOT call generate_image" not in prompt


def test_build_stream_system_prompt_no_ref_images_no_media_block():
    """Without reference images, no media instruction block should be present."""
    prompt = build_stream_system_prompt(
        topic="Test topic",
        target_format="facebook_post",
        has_reference_images=False,
        include_media_in_post=False,
    )
    assert "USER ASSET INCLUSION" not in prompt
    assert "REFERENCE MEDIA INSTRUCTIONS" not in prompt


@pytest.mark.asyncio
async def test_enhance_text_calls_llm(service, mock_genai_client):
    """Verifies that enhance_text calls the LLM with the correct prompt structure."""

    mock_response = MagicMock()
    mock_response.text = "Here is a polished Facebook post about cats."
    mock_genai_client.models.generate_content.return_value = mock_response

    result = await service.enhance_text(
        target_format="facebook_post",
        main_field_label="Topic",
        main_field_text="Cute cats doing silly things",
        target_field_label="Post Body",
        target_field_text=None,
        extra_context=None,
    )

    assert result == "Here is a polished Facebook post about cats."
    mock_genai_client.models.generate_content.assert_called_once()

    call_args = mock_genai_client.models.generate_content.call_args[1]
    system_instruction = call_args["config"].system_instruction
    assert "facebook_post" in system_instruction
    assert "Post Body" in system_instruction


@pytest.mark.asyncio
async def test_enhance_text_with_gibberish_field(service, mock_genai_client):
    """Verifies that the gibberish rule is included when target_field_text is provided."""

    mock_response = MagicMock()
    mock_response.text = "Generated fresh content."
    mock_genai_client.models.generate_content.return_value = mock_response

    result = await service.enhance_text(
        target_format="instagram_post",
        main_field_label="Topic",
        main_field_text="Summer fashion trends",
        target_field_label="Caption",
        target_field_text="asdfghjkl",
    )

    assert result == "Generated fresh content."
    call_args = mock_genai_client.models.generate_content.call_args[1]
    system_instruction = call_args["config"].system_instruction
    # Verify the gibberish detection rule is embedded in the prompt
    assert "COMPLETELY IGNORE IT" in system_instruction
    assert "asdfghjkl" in system_instruction
