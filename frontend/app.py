"""
Streamlit HITL dashboard for the content-creation AI agent.

Communicates with the FastAPI backend at http://127.0.0.1:8000
to create, review, and approve content workflows.

Run with:
    streamlit run frontend/app.py
"""

import requests
import streamlit as st
import time

# -- Configuration --
API_BASE = "http://127.0.0.1:8000"


# ------------------------------------------------------------------
# API helper functions
# ------------------------------------------------------------------

def api_create_workflow(topic: str, style: str) -> dict | None:
    """POST /workflows -- start a new content workflow."""
    try:
        resp = requests.post(
            f"{API_BASE}/workflows",
            json={"topic": topic, "style": style},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        st.error(f"Failed to create workflow: {exc}")
        return None


def api_get_status(workflow_id: str) -> dict | None:
    """GET /workflows/{id} -- fetch current workflow status."""
    try:
        resp = requests.get(
            f"{API_BASE}/workflows/{workflow_id}",
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        st.error(f"Failed to fetch status: {exc}")
        return None


def api_get_all_workflows() -> list[dict] | None:
    """GET /workflows -- fetch all workflows."""
    try:
        resp = requests.get(
            f"{API_BASE}/workflows",
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        st.error(f"Failed to fetch workflows: {exc}")
        return None


def api_approve(workflow_id: str) -> dict | None:
    """POST /workflows/{id}/approve -- approve the HITL review."""
    try:
        resp = requests.post(
            f"{API_BASE}/workflows/{workflow_id}/approve",
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        st.error(f"Failed to approve workflow: {exc}")
        return None


# ------------------------------------------------------------------
# Page configuration
# ------------------------------------------------------------------

st.set_page_config(
    page_title="Idea-to-Social-Media Agent",
    page_icon="",
    layout="wide",
)

st.title("Content Creator AI Agent")
st.caption("Human-in-the-Loop workflow dashboard")


# ------------------------------------------------------------------
# Sidebar -- Workflow creation
# ------------------------------------------------------------------

with st.sidebar:
    st.header("New Workflow")

    topic = st.text_input(
        "Topic",
        placeholder="e.g. A day in the life of a cat",
    )
    style = st.text_input(
        "Style",
        placeholder="e.g. Cinematic documentary",
    )

    generate_clicked = st.button(
        "Generate Storyboard",
        type="primary",
        disabled=not (topic and style),
    )

    st.divider()
    st.header("Load Existing Workflow")
    manual_id = st.text_input(
        "Workflow ID",
        placeholder="Paste a workflow ID to resume",
    )
    load_clicked = st.button("Load Workflow")

    st.divider()
    with st.expander("View All Workflows", icon="📜"):
        if st.button("Refresh List"):
            st.rerun()
            
        workflows = api_get_all_workflows()
        if workflows:
            for w in workflows:
                st.markdown(f"**ID**: `{w['workflow_id']}`")
                st.markdown(f"**Topic**: {w['topic']}")
                st.markdown(f"**Status**: {w['current_state']}")
                if st.button("Load", key=f"load_{w['workflow_id']}"):
                    st.session_state.workflow_id = w["workflow_id"]
                    st.session_state.workflow_status = api_get_status(w["workflow_id"])
                    st.rerun()
                st.divider()
        else:
            st.write("No active workflows found.")


# ------------------------------------------------------------------
# Session state management
# ------------------------------------------------------------------

if "workflow_id" not in st.session_state:
    st.session_state.workflow_id = None
if "workflow_status" not in st.session_state:
    st.session_state.workflow_status = None

# Handle sidebar actions
if generate_clicked and topic and style:
    with st.spinner("Generating storyboard -- this may take a moment..."):
        result = api_create_workflow(topic, style)
    if result:
        st.session_state.workflow_id = result.get("workflow_id")
        st.session_state.workflow_status = result

if load_clicked and manual_id:
    result = api_get_status(manual_id)
    if result:
        st.session_state.workflow_id = result.get("workflow_id")
        st.session_state.workflow_status = result


# ------------------------------------------------------------------
# Main content area
# ------------------------------------------------------------------

if st.session_state.workflow_id is None:
    st.info("Create a new workflow from the sidebar or load an existing one to get started.")
    st.stop()

workflow_id = st.session_state.workflow_id
status_data = st.session_state.workflow_status

# Refresh button
col_id, col_refresh = st.columns([3, 1])
with col_id:
    st.subheader(f"Workflow: `{workflow_id}`")
with col_refresh:
    if st.button("Refresh Status"):
        status_data = api_get_status(workflow_id)
        if status_data:
            st.session_state.workflow_status = status_data

if status_data is None:
    st.warning("No status data available. Click 'Refresh Status'.")
    st.stop()

current_state = status_data.get("current_state", "unknown")
storyboard = status_data.get("storyboard")
youtube_id = status_data.get("youtube_video_id")

# State indicator
state_labels = {
    "topic_analysis_and_prompting": ("Topic Analysis", "running"),
    "interleaved_generation": ("Generating Storyboard", "running"),
    "hitl_review": ("Awaiting Your Review", "error"),
    "asset_generation": ("Generating Assets", "running"),
    "publish_to_youtube": ("Publishing to YouTube", "running"),
    "completed": ("Completed", "complete"),
}
label, badge_type = state_labels.get(current_state, (current_state, "running"))
st.status(f"Current State: {label}", state=badge_type)

st.divider()

# ------------------------------------------------------------------
# HITL_REVIEW -- display storyboard and approval button
# ------------------------------------------------------------------

if current_state == "hitl_review":
    st.header("Storyboard Review")
    st.write("Please review each scene below. Once satisfied, click **Approve** to proceed to asset generation and publishing.")

    if storyboard:
        st.subheader("Global Metadata")
        st.markdown(f"**YouTube Title:** {storyboard.get('youtube_title', 'N/A')}")
        st.markdown(f"**YouTube Description:**\n```text\n{storyboard.get('youtube_description', 'N/A')}\n```")
        st.markdown(f"**Thumbnail Prompt:**\n{storyboard.get('thumbnail_prompt', 'N/A')}")
        st.divider()

    if storyboard and "scenes" in storyboard:
        for idx, scene in enumerate(storyboard["scenes"], start=1):
            with st.expander(f"Scene {idx}", expanded=True):
                st.markdown("**Narration (Context)**")
                st.write(scene.get("narration", "N/A"))
                st.markdown("**Voiceover Text**")
                st.write(scene.get("voiceover_text", "N/A"))

                col_img, col_vid = st.columns(2)
                with col_img:
                    st.markdown("**Image Prompt**")
                    st.code(scene.get("image_prompt", "N/A"), language=None)
                with col_vid:
                    st.markdown("**Video Prompt**")
                    video_prompt = scene.get("video_prompt")
                    st.code(video_prompt if video_prompt else "None", language=None)
    else:
        st.warning("No storyboard data available.")

    st.divider()
    if st.button("Approve Storyboard", type="primary"):
        with st.spinner("Approving and running post-approval pipeline..."):
            approve_result = api_approve(workflow_id)
        if approve_result:
            st.success("Storyboard approved! The pipeline is now running.")
            # Poll until the pipeline completes or a reasonable timeout.
            for _ in range(30):
                time.sleep(1)
                refreshed = api_get_status(workflow_id)
                if refreshed and refreshed.get("current_state") == "completed":
                    st.session_state.workflow_status = refreshed
                    st.rerun()
                    break
            else:
                # Pipeline did not complete within the polling window.
                refreshed = api_get_status(workflow_id)
                if refreshed:
                    st.session_state.workflow_status = refreshed
                st.rerun()

# ------------------------------------------------------------------
# COMPLETED -- show generated assets and YouTube ID
# ------------------------------------------------------------------

elif current_state == "completed":
    st.header("Pipeline Complete")
    st.success("All assets have been generated and the video has been published.")

    if youtube_id:
        st.subheader("YouTube Video ID")
        st.code(youtube_id)

    if storyboard:
        st.subheader("Global Metadata")
        st.markdown(f"**YouTube Title:** {storyboard.get('youtube_title', 'N/A')}")
        st.markdown(f"**YouTube Description:**\n```text\n{storyboard.get('youtube_description', 'N/A')}\n```")
        st.markdown(f"**Thumbnail Prompt:**\n{storyboard.get('thumbnail_prompt', 'N/A')}")
        st.divider()

    if storyboard and "scenes" in storyboard:
        st.subheader("Generated Assets")
        for idx, scene in enumerate(storyboard["scenes"], start=1):
            with st.expander(f"Scene {idx}", expanded=True):
                st.markdown("**Narration (Context)**")
                st.write(scene.get("narration", "N/A"))
                st.markdown("**Voiceover Text**")
                st.write(scene.get("voiceover_text", "N/A"))

                col_img, col_vid = st.columns(2)
                with col_img:
                    st.markdown("**Image**")
                    image_url = scene.get("image_url")
                    if image_url:
                        # Construct full URL since the backend serves this relative path
                        full_img_url = f"{API_BASE}{image_url}"
                        st.image(full_img_url, use_container_width=True)
                        st.caption(f"Path: `{image_url}`")
                    else:
                        st.write("N/A")
                with col_vid:
                    st.markdown("**Video URL**")
                    video_url = scene.get("video_url")
                    if video_url:
                        st.code(video_url, language=None)
                    else:
                        st.write("N/A")

# ------------------------------------------------------------------
# Other states -- generic status display
# ------------------------------------------------------------------

else:
    st.info(f"The workflow is currently in the **{label}** phase. Click 'Refresh Status' to check for updates.")
    if storyboard and "scenes" in storyboard:
        st.subheader("Storyboard Preview")
        for idx, scene in enumerate(storyboard["scenes"], start=1):
            with st.expander(f"Scene {idx}"):
                st.write(scene.get("narration", "N/A"))
