"""
Google GenAI implementation of the LLMService.
"""

import logging
import os
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from src.services.llm_service import LLMService

logger = logging.getLogger(__name__)

# Load environment variables (e.g., GEMINI_API_KEY)
load_dotenv()


# ------------------------------------------------------------------
# Structured Output Models
# ------------------------------------------------------------------

class StoryboardScene(BaseModel):
    """Represents a single scene in the generated storyboard."""

    narration: str = Field(
        description="The spoken text or voiceover narration for this scene."
    )
    voiceover_text: Optional[str] = Field(
        default=None,
        description="The exact text that an AI voice should speak for this scene.",
    )
    image_prompt: str = Field(
        description="A detailed prompt for generating an image for this scene."
    )
    video_prompt: Optional[str] = Field(
        default=None,
        description="An optional detailed prompt for generating a video clip for this scene.",
    )


class Storyboard(BaseModel):
    """The complete structured storyboard returned by the model."""

    youtube_title: str = Field(
        description="A highly engaging, SEO-optimized title for the YouTube video."
    )
    youtube_description: str = Field(
        description="A full SEO-optimized description with hashtags for the YouTube video."
    )
    thumbnail_prompt: str = Field(
        description="A detailed prompt for generating the YouTube thumbnail image."
    )
    scenes: list[StoryboardScene] = Field(
        description="A sequential list of scenes making up the storyboard."
    )


# ------------------------------------------------------------------
# Service Implementation
# ------------------------------------------------------------------

class GoogleGenAIService(LLMService):
    """Implementation of LLMService using the official google-genai SDK."""

    def __init__(self, model_name: str = "gemini-2.5-flash"):
        """Initialise the Google GenAI client.

        The client automatically picks up the GEMINI_API_KEY environment
        variable.

        Args:
            model_name: The Gemini model to use (default: gemini-2.5-flash).
        """
        # We explicitly pass the api_key if it exists to fail fast if missing
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY environment variable not found.")

        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    async def generate_dynamic_system_prompt(
        self,
        topic: str,
        style: str,
        deep_description: str | None = None,
        **kwargs,
    ) -> str:
        """Ask Gemini to act as a Meta-Agent and write a System Prompt.

        This prompt is intended for a 'Creative Director' agent tailoring
        output to the specific topic and style.
        """
        description_instruction = ""
        if deep_description:
            description_instruction = (
                f"A deep_description is provided: '{deep_description}'. "
                "You MUST prioritize these details (mood, lighting, specific elements) over the general topic.\n"
            )
        else:
            description_instruction = (
                "No deep_description is provided. You MUST infer the details (mood, lighting, specific elements) "
                "based on the general topic.\n"
            )

        meta_prompt = (
            "You are an expert prompt-engineer and Meta-Agent. Your task is to write a "
            "comprehensive, highly specific System Prompt for a 'Creative Director' agent. "
            f"The 'Creative Director' agent will be responsible for creating a storyboard "
            f"about '{topic}' in the style of '{style}'.\n\n"
            f"{description_instruction}\n"
            "The system prompt should instruct the agent on the tone, pacing, visual "
            "requirements, and how to balance narration with visual descriptions.\n\n"
            "CRITICAL OPTIMISATION REQUIREMENTS:\n"
            "1. STRICTLY FORBID copy-pasting the exact same style prefixes or suffixes across different scenes. "
            "Do not start every prompt with 'Ultra high-end...' or end with '...4k resolution'. "
            "Vary the vocabulary and sentence structure naturally.\n"
            "2. Enforce High Shot Diversity: The storyboard MUST flow logically using a mix of different "
            "camera angles (e.g., Wide Establishing Shots, Medium Tracking Shots, Extreme Close-ups, "
            "High-angle, Drone shots) to create a dynamic visual narrative.\n"
            "3. Ensure Visual Progression: The prompts should describe a progressing scene or changing "
            "environment, not simply variations of the exact same object.\n"
            "4. For EVERY single scene in the storyboard, the 'Creative Director' MUST provide BOTH "
            "a highly detailed `image_prompt` AND a highly detailed `video_prompt`. No scene can be "
            "left without both.\n\n"
            "Return ONLY the raw system prompt text. Do not include introductory remarks."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=meta_prompt,
        )

        if not response.text:
            raise ValueError("No text returned for dynamic system prompt.")

        return response.text.strip()

    async def generate_interleaved_storyboard(
        self,
        dynamic_system_prompt: str,
        topic: str,
        **kwargs,
    ) -> dict:
        """Generate a storyboard using native Structured Outputs.

        Passes the dynamic system prompt as instructions, and requests the
        model to output strictly matching the Pydantic `Storyboard` schema.
        """
        prompt = (
            f"Please generate a complete storyboard for the topic: '{topic}'. "
            "Follow all instructions in your system prompt perfectly."
        )

        # Configure the schema to use our Pydantic classes
        config = types.GenerateContentConfig(
            system_instruction=dynamic_system_prompt,
            response_mime_type="application/json",
            response_schema=Storyboard,
            temperature=0.7,
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )

        # The SDK natively parses application/json when response_schema is provided.
        # Ensure we return a dict representation.
        if hasattr(response, "parsed") and response.parsed:
            # If the SDK parsed it back into our Pydantic model natively
            if isinstance(response.parsed, Storyboard):
                return response.parsed.model_dump()
            elif isinstance(response.parsed, dict):
                return response.parsed

        # Fallback if manual parsing is needed (e.g., text block fallback)
        if response.text:
            # Pydantic v2's model_validate_json
            parsed_storyboard = Storyboard.model_validate_json(response.text)
            return parsed_storyboard.model_dump()

        raise ValueError("Failed to retrieve or parse the structured storyboard.")
