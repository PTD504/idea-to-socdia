"""
Tests for the GoogleGenAIService making sure Structured Outputs 
and internal prompt building work as expected, mocking actual API calls.
"""

import os
from unittest.mock import MagicMock, patch
import pytest

from src.services.google_genai_service import (
    GoogleGenAIService,
    Storyboard,
    StoryboardScene,
)


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
async def test_generate_interleaved_storyboard(service, mock_genai_client):
    """Verifies that structured outputs are requested and parsed natively."""
    
    # Setup mock parsed response
    mock_scene = StoryboardScene(
        narration="The sun rises.",
        voiceover_text="Good morning, world.",
        image_prompt="A beautiful sunrise over the city.",
        video_prompt="Time-lapse video of the sun rising."
    )
    mock_storyboard = Storyboard(
        youtube_title="Beautiful Sunrise",
        youtube_description="A time-lapse of the city.",
        thumbnail_prompt="A glowing sun over skyscrapers.",
        scenes=[mock_scene]
    )
    
    mock_response = MagicMock()
    mock_response.parsed = mock_storyboard
    mock_genai_client.models.generate_content.return_value = mock_response

    # Execute
    result = await service.generate_interleaved_storyboard(
        dynamic_system_prompt="You are a Creative Director.",
        topic="Morning routine"
    )

    # Assertions
    assert "scenes" in result
    assert len(result["scenes"]) == 1
    assert result["scenes"][0]["narration"] == "The sun rises."
    
    # Check that genai client was called with Structured Output config
    mock_genai_client.models.generate_content.assert_called_once()
    call_args = mock_genai_client.models.generate_content.call_args[1]
    
    assert call_args["model"] == service.model_name
    assert "Morning routine" in call_args["contents"]
    
    config = call_args["config"]
    assert config.system_instruction == "You are a Creative Director."
    assert config.response_mime_type == "application/json"
    assert config.response_schema == Storyboard
