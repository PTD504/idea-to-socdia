"""
Tests for the GoogleGenAIService making sure prompt building
and API call wiring work as expected, mocking actual API calls.
"""

import os
from unittest.mock import MagicMock, patch
import pytest

from src.services.google_genai_service import GoogleGenAIService


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


@pytest.mark.asyncio
async def test_generate_dynamic_system_prompt(service, mock_genai_client):
    """Verifies that the meta-prompt asks for a Creative Director system prompt."""
    
    # Setup mock response
    mock_response = MagicMock()
    mock_response.text = "You are an expert Creative Director. Do X, Y, and Z."
    mock_genai_client.models.generate_content.return_value = mock_response

    # Execute
    result = await service.generate_dynamic_system_prompt(
        topic="A day in the life of a cat",
        style="Cinematic documentary"
    )

    # Assertions
    assert result == "You are an expert Creative Director. Do X, Y, and Z."
    
    # Check that genai client was called with correct model and our meta prompt
    mock_genai_client.models.generate_content.assert_called_once()
    call_args = mock_genai_client.models.generate_content.call_args[1]
    
    assert call_args["model"] == service.model_name
    assert "A day in the life of a cat" in call_args["contents"]
    assert "Cinematic documentary" in call_args["contents"]
    assert "System Prompt for a 'Creative Director' agent" in call_args["contents"]


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
