import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.services.google_genai_service import GoogleGenAIService

load_dotenv()

async def main():
    service = GoogleGenAIService()
    print("Starting generator...")
    
    topic = "A cyberpunk street vendor selling noodle soup to a stray dog."
    
    stream = service.stream_creative_content(
        topic=topic,
        target_format="youtube_shorts",
        deep_description="Neon lights reflecting in puddles. Raining. High-tech, low-life.",
        style="cinematic, highly detailed, Blade Runner style",
        reference_image_base64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    )
    
    try:
        async for chunk in stream:
            if chunk["type"] == "text":
                print(f"[TEXT] {chunk['content']}", end="")
            elif chunk["type"] == "tool_start":
                print(f"\n[TOOL START] {chunk['tool']} | Args: {chunk['args']}")
            elif chunk["type"] == "media_result":
                print(f"\n[MEDIA RESULT] {chunk['tool']} | URL: {chunk['url']}")
    except Exception as e:
        print(f"\nError occurred: {e}")
        
    print("\nGeneration finished.")

if __name__ == "__main__":
    asyncio.run(main())
