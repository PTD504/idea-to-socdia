# Idea2Socdia: The AI Content Director

Idea2Socdia is a multimodal Gemini-powered creative agent that transforms a user topic into production-ready social media content through interleaved text, image, and video generation, with Human-in-the-Loop control over every major decision point.

![Architecture Diagram](assets/architecture.svg)

## Key Features

- Multimodal interleaved generation: Streams content while invoking media tools for image and video generation in the same workflow.
- Human-in-the-Loop orchestration: Users review and refine generated artifacts before finalizing output.
- Regenerate workflow: Supports targeted image/video regeneration from updated prompts.
- Video assembly pipeline: Merges generated clips into a final video using FFmpeg.
- Stateless cloud-native media handling: Uses Google Cloud Storage for persistent assets and `/tmp` only for short-lived processing required by FFmpeg.
- Cloud Run-ready architecture: Backend and frontend are containerized and deployable independently.

## Tech Stack

- **LLM and multimodal SDK:** Gemini 3 Flash via `google-genai`
- **Media generation backend:** Vertex AI - Gemini image (`gemini-2.5-flash-image`) and Veo (`veo-3.0-fast-generate-001`) video flows
- **API layer:** FastAPI
- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Containerization:** Docker + Docker Compose
- **Cloud runtime:** Google Cloud Run
- **Persistent media storage:** Google Cloud Storage
- **Infrastructure & Security:** Google Cloud Secret Manager + Google Artifact Registry
- **CI/CD:** GitHub Actions (Automated Build & Deploy Pipeline)

## Prerequisites

Install the following before running locally:

- Python 3.13+
- Node.js 18+ and npm
- Docker Desktop (or Docker Engine + Compose v2)
- FFmpeg available on PATH (required for video merge operations)
- Google Cloud account and project with access to Vertex AI and Cloud Storage
- Optional for local ADC flow: Google Cloud CLI (`gcloud`) authenticated for your project

## Environment Variables

Create a root `.env` file in this repository. Do not commit secrets.

```dotenv
# Required by backend LLM calls
GEMINI_API_KEY=your_gemini_api_key

# Required for Vertex/GCP context (local and cloud)
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=us-central1

# Required for media persistence
GCS_BUCKET_NAME=your_gcs_bucket_name

# CORS allowlist for frontend application URL
FRONTEND_URL=http://localhost:3000

# Optional for local explicit service account authentication
# GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Optional deployment metadata used in CI/CD contexts
GCP_PROJECT_ID=your_gcp_project_id
BACKEND_URL=http://localhost:8000
```

Create `frontend/.env.local` for local frontend runtime:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Reproducible Testing Instructions

### A. Run Entire Application with Docker Compose

From repository root:

```bash
docker compose up --build
```

Expected services:

- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:3000`

Smoke checks (new terminal):

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

Stop stack:

```bash
docker compose down
```

### B. Run Backend Locally (without Docker)

From repository root:

```bash
python -m venv venv
```

Activate virtual environment:

PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

Bash:

```bash
source venv/Scripts/activate
```

Install dependencies and start API:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend verification:

```bash
curl http://localhost:8000/health
```

Optional automated check:

```bash
python -m pytest tests/test_api.py -q
```

### C. Run Frontend Locally (without Docker)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

- `http://localhost:3000`

It will call the backend using `NEXT_PUBLIC_API_URL` from `frontend/.env.local` (or fallback to `http://localhost:8000`).

### D. End-to-End Manual Flow Validation

1. Open `http://localhost:3000`.
2. Start a workflow with a topic and target format.
3. Confirm streamed output appears incrementally.
4. Regenerate image/video once and confirm a new URL is returned.
5. For video workflows, trigger merge and confirm final merged URL is returned.

## Deployment

This repository includes CI/CD for Google Cloud Run via GitHub Actions in `.github/workflows/deploy.yml`.

- On push to `main`, backend and frontend changes are filtered and deployed independently.
- Images are built with Docker and pushed to Artifact Registry.
- Services are deployed to Cloud Run with environment variables injected from GitHub Secrets.
- Backend runtime is configured for Gemini access and Cloud Storage persistence.
