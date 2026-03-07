import json
import pytest
from fastapi.testclient import TestClient

from src.main import app

def test_stream_workflow_endpoint():
    request_data = {
        "topic": "A futuristic city in the clouds.",
        "style": "cinematic",
        "target_format": "facebook_post",
        "deep_description": "Flying cars, neon signs.",
        "reference_images": ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="]
    }
    
    # Use TestClient as a context manager to trigger FastAPI's lifespan events
    with TestClient(app) as client:
        # We use a POST request with stream=True for StreamingResponse
        with client.stream("POST", "/stream_workflow", json=request_data) as response:
            assert response.status_code == 200
        assert response.headers["content-type"] == "application/x-ndjson"
        
        import httpx
        # In a real environment against Gemini this tests the actual stream
        # Read the first few lines to ensure NDJSON format is respected
        lines_read = 0
        try:
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        assert "type" in chunk
                        lines_read += 1
                    except json.JSONDecodeError:
                        pytest.fail(f"Could not parse line as JSON: {line}")
                if lines_read >= 2:
                    break
        except httpx.StreamClosed:
            pass # Expected when breaking early
            
        assert lines_read > 0, "Expected at least one chunk from the stream"
