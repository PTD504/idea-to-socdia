"""
Google GenAI implementation of the LLMService.
"""

import logging
import os

from google import genai
from google.genai import types

from src.core.prompts import build_stream_system_prompt, build_enhance_text_prompt
from src.services.llm_service import LLMService

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Service Implementation
# ------------------------------------------------------------------

class GoogleGenAIService(LLMService):
    """Implementation of LLMService using the official google-genai SDK."""

    def __init__(self, model_name: str = "gemini-3-flash-preview", media_service=None):
        """Initialise the Google GenAI client.

        The client automatically picks up the GEMINI_API_KEY environment
        variable.

        Args:
            model_name: The Gemini model to use (default: gemini-3-flash-preview).
        """
        # We explicitly pass the api_key if it exists to fail fast if missing
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY environment variable not found.")

        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        
        from src.services.google_vertex_media_service import GoogleVertexMediaService
        self.media_service = media_service or GoogleVertexMediaService()

        # Tools list for Gemini
        self.tools = self.media_service.get_tools()

    async def stream_creative_content(
        self,
        topic: str,
        target_format: str,
        deep_description: str | None = None,
        style: str | None = None,
        reference_images: list[str] | None = None,
        image_instructions: str | None = None,
        include_media_in_post: bool = False,
    ):
        """Generate content by streaming and handling function calls asynchronously."""
        from google.api_core.exceptions import (
            DeadlineExceeded,
            GoogleAPICallError,
            ResourceExhausted,
            ServiceUnavailable,
            TooManyRequests,
        )
        import httpx

        def _stream_error_message(exc: Exception) -> str:
            if isinstance(exc, (ResourceExhausted, TooManyRequests)):
                return "Generation is temporarily unavailable due to quota limits. Please retry shortly."
            if isinstance(exc, (DeadlineExceeded, httpx.TimeoutException)):
                return "Generation request timed out. Please try again."
            if isinstance(exc, (ServiceUnavailable, httpx.NetworkError, httpx.ConnectError, httpx.ReadError)):
                return "Network or service interruption occurred while generating content."
            if isinstance(exc, GoogleAPICallError):
                return "An upstream AI service error occurred while generating content."
            return "Unexpected error while generating content."
        
        # Determine if the user uploaded reference images
        has_ref_images = bool(reference_images and len(reference_images) > 0)

        # Build the system prompt from centralized templates
        system_prompt = build_stream_system_prompt(
            topic=topic,
            target_format=target_format,
            deep_description=deep_description,
            style=style,
            image_instructions=image_instructions,
            has_reference_images=has_ref_images,
        )
        
        # Configure the tool settings
        # Tools are ALWAYS available: generate_image / generate_video must never be disabled.
        # Disabling automatic function calls lets us stream the `tool_start` to the UI.
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            tools=self.tools,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                 disable=True # We will handle calls manually
            )
        )
        
        # Setup media service reference image state for tool calls
        self.media_service.set_reference_images(reference_images)
        
        initial_parts = [f"Please begin generating the content for the topic: '{topic}'."]
        if reference_images:
            import base64
            # Include the first reference image in the prompt for visual context
            first_image_bytes = base64.b64decode(reference_images[0])
            initial_parts.append(
                types.Part.from_bytes(data=first_image_bytes, mime_type="image/jpeg")
            )
            
        logger.info("Starting stream chat session for topic: %s", topic)
        try:
            chat = self.client.chats.create(model=self.model_name, config=config)
        except (ResourceExhausted, TooManyRequests, DeadlineExceeded, ServiceUnavailable, GoogleAPICallError, httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError, httpx.ReadError) as exc:
            logger.exception(
                "Failed to initialize streaming chat. topic=%r, target_format=%r, error=%s",
                topic,
                target_format,
                exc,
            )
            yield {"type": "error", "message": _stream_error_message(exc)}
            return
        except Exception as exc:
            logger.exception(
                "Unexpected error creating chat stream. topic=%r, target_format=%r, error=%s",
                topic,
                target_format,
                exc,
            )
            yield {"type": "error", "message": _stream_error_message(exc)}
            return
        
        # We use a loop here because after we send a tool response back, we get a NEW stream 
        # that we must also asynchronously iterate over to continue the sequence.
        # We start by sending the initial user prompt.
        current_request = initial_parts
        
        # Keep generating until the model decides it is done (stops using tools and sends finalizing text)
        while True:
            called_tools = False
            responses_to_send_back = []

            try:
                response_stream = chat.send_message_stream(current_request)
                for chunk in response_stream:
                    # The google-genai SDK can fail when reading .text on tool-only chunks.
                    # Validate text presence before attempting to stream it.
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
                                    aspect_ratio = "9:16" if target_format == "youtube_short" else "16:9"
                                    result_url = await self.media_service.generate_image(prompt=args.get("prompt", ""), aspect_ratio=aspect_ratio)
                                elif name == "generate_video":
                                    video_ratio = "9:16" if target_format in ["youtube_short", "instagram_post"] else "16:9"
                                    result_url = await self.media_service.generate_video(prompt=args.get("prompt", ""), aspect_ratio=video_ratio)
                                else:
                                    logger.error("Model tried to call unknown tool: %s", name)
                                    result_url = "https://placehold.co/1920x1080?text=Unknown+Tool"
                            except Exception as exc:
                                logger.exception(
                                    "Error executing tool %s for topic=%r, target_format=%r: %s",
                                    name,
                                    topic,
                                    target_format,
                                    exc,
                                )
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
            except (ResourceExhausted, TooManyRequests, DeadlineExceeded, ServiceUnavailable, GoogleAPICallError, httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError, httpx.ReadError) as exc:
                logger.exception(
                    "Streaming generation failed. topic=%r, target_format=%r, error=%s",
                    topic,
                    target_format,
                    exc,
                )
                yield {"type": "error", "message": _stream_error_message(exc)}
                return
            except Exception as exc:
                logger.exception(
                    "Unexpected streaming failure. topic=%r, target_format=%r, error=%s",
                    topic,
                    target_format,
                    exc,
                )
                yield {"type": "error", "message": _stream_error_message(exc)}
                return
            
            # Now that the generator is completely exhausted and chat.history is fully updated for this turn
            if called_tools and responses_to_send_back:
                # Instead of a string prompt, our next "request" is the parts list containing tool outputs
                current_request = responses_to_send_back
            else:
                # If the model didn't call any tools, it means it's finished writing.
                break

    async def enhance_text(
        self,
        target_format: str,
        main_field_label: str,
        main_field_text: str,
        target_field_label: str,
        target_field_text: str | None = None,
        extra_context: str | None = None,
    ) -> str:
        """Use the LLM to enhance or generate text for a specific form field."""
        from google.api_core.exceptions import (
            DeadlineExceeded,
            GoogleAPICallError,
            ResourceExhausted,
            ServiceUnavailable,
            TooManyRequests,
        )
        import httpx

        # Build the system prompt from centralized templates
        system_prompt = build_enhance_text_prompt(
            target_format=target_format,
            main_field_label=main_field_label,
            target_field_label=target_field_label,
            target_field_text=target_field_text,
            extra_context=extra_context,
        )

        user_prompt = f"{main_field_label}: {main_field_text}"

        logger.info(
            "Enhancing text for format=%r, target_field=%r",
            target_format, target_field_label,
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.8,
                ),
            )
        except (ResourceExhausted, TooManyRequests) as exc:
            logger.exception(
                "Quota exceeded while enhancing text. target_format=%r, target_field=%r, error=%s",
                target_format,
                target_field_label,
                exc,
            )
            return "Text enhancement is temporarily unavailable due to quota limits. Please retry shortly."
        except (DeadlineExceeded, httpx.TimeoutException) as exc:
            logger.exception(
                "Timeout while enhancing text. target_format=%r, target_field=%r, error=%s",
                target_format,
                target_field_label,
                exc,
            )
            return "Text enhancement timed out. Please try again."
        except (ServiceUnavailable, httpx.NetworkError, httpx.ConnectError, httpx.ReadError) as exc:
            logger.exception(
                "Network/service error while enhancing text. target_format=%r, target_field=%r, error=%s",
                target_format,
                target_field_label,
                exc,
            )
            return "Text enhancement is temporarily unavailable due to a network issue."
        except GoogleAPICallError as exc:
            logger.exception(
                "Google API call error while enhancing text. target_format=%r, target_field=%r, error=%s",
                target_format,
                target_field_label,
                exc,
            )
            return "Text enhancement failed due to an upstream AI service error."
        except Exception as exc:
            logger.exception(
                "Unexpected error while enhancing text. target_format=%r, target_field=%r, error=%s",
                target_format,
                target_field_label,
                exc,
            )
            return "Text enhancement failed unexpectedly. Please try again."

        if not response.text:
            raise ValueError("No text returned from the enhance_text LLM call.")

        return response.text.strip()
