"""
YouTube publishing service.

Provides an interface for uploading video content to YouTube.
Currently uses a mock implementation for development.
"""

import asyncio
import logging
import uuid

logger = logging.getLogger(__name__)


class YouTubeService:
    """Mock YouTube publishing service.

    Simulates uploading a video to YouTube and returns a dummy video ID.
    """

    async def upload_video(
        self,
        video_url: str,
        title: str,
        description: str,
    ) -> str:
        """Upload a video to YouTube.

        Args:
            video_url: URL of the rendered video asset to upload.
            title: Title for the YouTube video.
            description: Description for the YouTube video.

        Returns:
            A YouTube video ID string.
        """
        video_id = uuid.uuid4().hex[:11]
        logger.info(
            "Uploading video to YouTube -- title=%r, source=%s",
            title, video_url,
        )
        # Simulate upload latency.
        await asyncio.sleep(0.05)
        logger.info("YouTube upload complete -- video_id=%s", video_id)
        return video_id
