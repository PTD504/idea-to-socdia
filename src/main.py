"""
FastAPI application entry point.

Creates the app instance, includes API routers, and configures
basic logging.  Run with:

    uvicorn src.main:app --reload
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.api.routes import limiter, router as api_router, set_workflow_manager
from src.services.google_genai_service import GoogleGenAIService
from src.services.gcs_service import GCSService
from src.services.google_vertex_media_service import GoogleVertexMediaService
from src.workflows.workflow_manager import ContentWorkflowManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hook.

    Wires the concrete services and ContentWorkflowManager
    into the API router so all endpoints can access them.
    """
    log = logging.getLogger(__name__)
    log.info("Application starting up.")

    gcs_service = GCSService()
    media_service = GoogleVertexMediaService(gcs_service=gcs_service)
    llm_service = GoogleGenAIService(media_service=media_service)
    manager = ContentWorkflowManager(
        llm_service=llm_service,
        media_service=media_service,
    )
    set_workflow_manager(manager)

    log.info("Workflow manager initialised and wired into routes.")
    yield
    log.info("Application shutting down.")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Idea-to-Social-Media Agent",
    description="HITL content-creation workflow engine.",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS for local development (Next.js frontend default port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.environ.get("FRONTEND_URL"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
