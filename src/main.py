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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Idea-to-Social-Media Agent",
    description="HITL content-creation workflow engine.",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS for local development (Next.js frontend default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"], # Support direct localhost requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the static directories exist before mounting
static_dir = os.path.join("src", "static")
os.makedirs(os.path.join(static_dir, "generated", "images"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "generated", "videos"), exist_ok=True)

# Mount the static directory to serve generated images
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.include_router(api_router)
