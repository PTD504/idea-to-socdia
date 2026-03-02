"""
FastAPI application entry point.

Creates the app instance, includes API routers, and configures
basic logging.  Run with:

    uvicorn src.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.api.routes import router as api_router, set_workflow_manager
from src.services.google_genai_service import GoogleGenAIService
from src.services.media_service import GoogleVertexMediaService
from src.services.youtube_service import YouTubeService
from src.workflows.workflow_manager import ContentWorkflowManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hook.

    Wires the concrete services and ContentWorkflowManager
    into the API router so all endpoints can access them.
    """
    log = logging.getLogger(__name__)
    log.info("Application starting up.")

    llm_service = GoogleGenAIService()
    media_service = GoogleVertexMediaService()
    youtube_service = YouTubeService()
    manager = ContentWorkflowManager(
        llm_service=llm_service,
        media_service=media_service,
        youtube_service=youtube_service,
    )
    set_workflow_manager(manager)

    log.info("Workflow manager initialised and wired into routes.")
    yield
    log.info("Application shutting down.")


import os
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Idea-to-Social-Media Agent",
    description="HITL content-creation workflow engine.",
    version="0.1.0",
    lifespan=lifespan,
)

# Ensure the static directory exists before mounting
static_dir = os.path.join("frontend", "static")
os.makedirs(static_dir, exist_ok=True)

# Mount the static directory to serve generated images
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(api_router)
