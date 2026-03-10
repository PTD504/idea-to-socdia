import pytest
from unittest.mock import patch, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
import uuid

from src.api.routes import router, set_workflow_manager, _manager
from src.workflows.workflow_manager import ContentWorkflowManager

# Create a test app
app = FastAPI()
app.include_router(router)
client = TestClient(app)

@pytest.fixture
def mock_manager():
    """Provides a mocked WorkflowManager with a mocked MediaService."""
    manager = MagicMock(spec=ContentWorkflowManager)
    manager._media_service = MagicMock()
    
    # Needs to be async
    async def mock_concatenate(video_urls):
        return f"http://localhost:8000/static/generated/videos/merged_test.mp4"
    
    manager._media_service.concatenate_videos = mock_concatenate
    set_workflow_manager(manager)
    return manager

# We need to mark it async although using TestClient, wait, TestClient is synchronous but routes can be async.
def test_merge_videos_success(mock_manager):
    """Test successful merging of videos."""
    
    # We patch hasattr to always return True for concatenate_videos
    # because hasattr might fail if mock doesn't properly report the method.
    with patch('src.api.routes.hasattr', return_value=True):
        response = client.post(
            "/api/merge_videos", 
            json={"video_urls": ["http://example.com/a.mp4", "http://example.com/b.mp4"]}
        )
        
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"] == "http://localhost:8000/static/generated/videos/merged_test.mp4"

def test_merge_videos_not_supported(mock_manager):
    """Test when the media service doesn't support concatenation."""
    # Patch hasattr to return False
    with patch('src.api.routes.hasattr', return_value=False):
        response = client.post(
            "/api/merge_videos", 
            json={"video_urls": ["http://example.com/a.mp4"]}
        )
        
    assert response.status_code == 501
    assert "Media service does not support" in response.json()["detail"]

def test_merge_videos_service_error():
    """Test when the media service throws an error during merging."""
    manager = MagicMock(spec=ContentWorkflowManager)
    manager._media_service = MagicMock()
    
    async def mock_concatenate_error(video_urls):
        raise ValueError("Simulated concatenation error")
        
    manager._media_service.concatenate_videos = mock_concatenate_error
    set_workflow_manager(manager)

    with patch('src.api.routes.hasattr', return_value=True):
        response = client.post(
            "/api/merge_videos", 
            json={"video_urls": ["http://example.com/a.mp4", "http://example.com/b.mp4"]}
        )
        
    assert response.status_code == 500
    assert "Simulated concatenation error" in response.json()["detail"]
