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


# Removed structured models as we now stream and rely on tool calls for media.


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
        
        from src.services.media_service import GoogleVertexMediaService
        self.media_service = GoogleVertexMediaService()

        # Tools list for Gemini
        self.tools = self.media_service.get_tools()

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
            "The system prompt MUST explicitly instruct the agent: 'You are a visual storyteller. "
            "Don't just talk about the scene—SHOW IT using the tools. When you visualize a scene, "
            "DO NOT describe it in text like \"[Image of...]\". Instead, IMMEDIATELY call the `generate_image` or "
            "`generate_video` tool. Do not wait until the end. Weave the media calls naturally into the flow. "
            "Keep your narration concise and engaging between visual beats.'\n\n"
            "Return ONLY the raw system prompt text. Do not include introductory remarks."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=meta_prompt,
        )

        if not response.text:
            raise ValueError("No text returned for dynamic system prompt.")

        return response.text.strip()

    async def stream_creative_content(
        self,
        topic: str,
        deep_description: str | None = None,
        style: str | None = None,
    ):
        """Generate content by streaming and handling function calls asynchronously."""
        
        dynamic_system_prompt = await self.generate_dynamic_system_prompt(
            topic=topic,
            deep_description=deep_description,
            style=style or "cinematic",
        )
        
        # Configure the tool settings
        # Disabling automatic function calls lets us stream the `tool_start` to the UI
        config = types.GenerateContentConfig(
            system_instruction=dynamic_system_prompt,
            temperature=0.7,
            tools=self.tools,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                 disable=True # We will handle calls manually
            )
        )
        
        prompt = f"Please begin generating the content for the topic: '{topic}'."
        
        logger.info("Starting stream chat session for topic: %s", topic)
        chat = self.client.chats.create(model=self.model_name, config=config)
        
        # We use a loop here because after we send a tool response back, we get a NEW stream 
        # that we must also asynchronously iterate over to continue the sequence.
        # We start by sending the initial user prompt.
        current_request = prompt
        
        # Keep generating until the model decides it is done (stops using tools and sends finalizing text)
        while True:
            response_stream = chat.send_message_stream(current_request)
            called_tools = False
            responses_to_send_back = []
            
            for chunk in response_stream:
                # The google-genai SDK throws a warning/error if we try to access .text 
                # when the chunk only contains a function_call. 
                # We check the part type safely.
                has_text = any(part.text for part in chunk.candidates[0].content.parts if part.text) if chunk.candidates and chunk.candidates[0].content.parts else False
                
                if has_text and getattr(chunk, "text", None):
                    yield {"type": "text", "content": chunk.text}
                    
                if chunk.function_calls:
                    called_tools = True
                    for call in chunk.function_calls:
                        name = call.name
                        args = call.args
                        logger.info("Model requested tool execution: %s with args: %s", name, args)
                        
                        # Notify frontend that tool execution started
                        yield {"type": "tool_start", "tool": name, "args": args}
                        
                        result_url = ""
                        try:
                            # Execute the physical tool function natively in python
                            if name == "generate_image":
                                result_url = await self.media_service.generate_image(prompt=args.get("prompt", ""))
                            elif name == "generate_video":
                                result_url = await self.media_service.generate_video(prompt=args.get("prompt", ""))
                            else:
                                logger.error("Model tried to call unknown tool: %s", name)
                                result_url = "https://placehold.co/1920x1080?text=Unknown+Tool"
                        except Exception as e:
                            logger.error("Error executing tool %s: %s", name, e)
                            result_url = "https://placehold.co/1920x1080?text=Generation+Failed"
                            
                        # Notify frontend that tool execution finished
                        yield {"type": "media_result", "tool": name, "url": result_url}
                        
                        # Prepare the result dictionary to pass back to the model
                        function_response = {"url": result_url}
                        responses_to_send_back.append(
                            types.Part.from_function_response(
                                name=name,
                                response=function_response
                            )
                        )
            
            # Now that the generator is completely exhausted and chat.history is fully updated for this turn
            if called_tools and responses_to_send_back:
                # Instead of a string prompt, our next "request" is the parts list containing tool outputs
                current_request = responses_to_send_back
            else:
                # If the model didn't call any tools, it means it's finished writing.
                break
