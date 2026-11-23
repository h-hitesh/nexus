import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import (
    init_db, ensure_project, get_projects, start_session, end_session,
    record_event, get_latest_state, get_project_sessions, get_session_replay
)
from .models import (
    GraphPayload, StatePayload, LogPayload, PulsePayload, SessionStartPayload
)
from .hub import hub

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Seed default projects if empty
    await ensure_project("horizon_quant", "Horizon Quant Lab", "Options, Greeks & Multi-Agent Deliberation", "📈")
    await ensure_project("media_stack", "CinemaScout & HolyArrs", "Autonomous Media Discovery & Transmission Pipeline", "🎬")
    await ensure_project("sre_sentinel", "Homelab SRE Sentinel", "Self-Healing Docker & Infrastructure Sentinel", "🛡️")
    yield

app = FastAPI(
    title="Nexus Mission Control",
    description="Universal Cognitive Execution Plane & Cyberpunk Telemetry HUD",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. API ROUTES

@app.get("/api/v1/projects")
async def list_projects():
    return await get_projects()

@app.post("/api/v1/projects")
async def create_project(payload: Dict[str, str]):
    p_id = payload.get("id")
    if not p_id:
        raise HTTPException(status_code=400, detail="Missing project id")
    await ensure_project(p_id, payload.get("name"), payload.get("description"), payload.get("icon"))
    return {"status": "ok", "project_id": p_id}

@app.get("/api/v1/projects/{project_id}/state")
async def get_state(project_id: str):
    return await get_latest_state(project_id)

@app.post("/api/v1/projects/{project_id}/session/start")
async def api_start_session(project_id: str, payload: SessionStartPayload):
    session_id = await start_session(project_id, payload.title, payload.session_id, payload.metadata)
    event_data = {"session_id": session_id, "title": payload.title, "action": "started"}
    await hub.broadcast_project(project_id, {"type": "session_start", "data": event_data})
    return {"status": "ok", "session_id": session_id}

@app.post("/api/v1/projects/{project_id}/session/end")
async def api_end_session(project_id: str, session_id: str):
    await end_session(session_id)
    await hub.broadcast_project(project_id, {"type": "session_end", "data": {"session_id": session_id}})
    return {"status": "ok"}

@app.post("/api/v1/projects/{project_id}/graph")
async def update_graph(project_id: str, payload: GraphPayload, session_id: Optional[str] = None):
    data = payload.model_dump(by_alias=True)
    await record_event(project_id, "graph", data, session_id)
    await hub.broadcast_project(project_id, {"type": "graph", "data": data})
    return {"status": "ok"}

@app.post("/api/v1/projects/{project_id}/pulse")
async def emit_pulse(project_id: str, payload: PulsePayload, session_id: Optional[str] = None):
    data = payload.model_dump(by_alias=True)
    await record_event(project_id, "pulse", data, session_id)
    await hub.broadcast_project(project_id, {"type": "pulse", "data": data})
    
    # If the pulse includes a log line, record log as well
    if payload.log:
        log_data = {"source": payload.from_node.upper(), "message": payload.log, "level": "FLOW"}
        await record_event(project_id, "log", log_data, session_id)
        await hub.broadcast_project(project_id, {"type": "log", "data": log_data})
        
    return {"status": "ok"}

@app.post("/api/v1/projects/{project_id}/state")
async def update_state(project_id: str, payload: StatePayload, session_id: Optional[str] = None):
    data = payload.model_dump(exclude_none=True)
    await record_event(project_id, "state", data, session_id)
    await hub.broadcast_project(project_id, {"type": "state", "data": data})
    return {"status": "ok"}

@app.post("/api/v1/projects/{project_id}/log")
async def append_log(project_id: str, payload: LogPayload, session_id: Optional[str] = None):
    data = payload.model_dump()
    data["timestamp"] = datetime.now(timezone.utc).strftime("%H:%M:%S.%f")[:-3]
    await record_event(project_id, "log", data, session_id)
    await hub.broadcast_project(project_id, {"type": "log", "data": data})
    return {"status": "ok"}

@app.get("/api/v1/projects/{project_id}/history")
async def list_history(project_id: str, limit: int = 30):
    return await get_project_sessions(project_id, limit)

@app.get("/api/v1/projects/{project_id}/sessions/{session_id}/replay")
async def get_replay(project_id: str, session_id: str):
    replay = await get_session_replay(session_id)
    if not replay:
        raise HTTPException(status_code=404, detail="Session not found")
    return replay

# Universal Webhook Ingest for n8n or third parties
@app.post("/api/v1/webhook/{project_id}")
async def universal_webhook(project_id: str, request: Request):
    body = await request.json()
    action = body.get("action", "pulse")
    if action == "pulse":
        from_node = body.get("from", "input")
        to_node = body.get("to", "worker")
        pulse_data = {
            "from": from_node,
            "to": to_node,
            "label": body.get("label"),
            "color": body.get("color", "#ff5500")
        }
        await record_event(project_id, "pulse", pulse_data)
        await hub.broadcast_project(project_id, {"type": "pulse", "data": pulse_data})
        if body.get("log"):
            log_data = {"source": from_node.upper(), "message": body.get("log"), "level": "INFO"}
            await record_event(project_id, "log", log_data)
            await hub.broadcast_project(project_id, {"type": "log", "data": log_data})
    return {"status": "received"}

# 2. WEBSOCKET REAL-TIME ENDPOINT

@app.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    await hub.connect(websocket, project_id)
    try:
        # Send initial latest state
        initial_state = await get_latest_state(project_id)
        await websocket.send_json({"type": "init", "data": initial_state})
        while True:
            # Keep alive and receive client commands (e.g. pause/resume)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        hub.disconnect(websocket, project_id)
    except Exception:
        hub.disconnect(websocket, project_id)

# 3. STATIC ASSETS & SPA SERVING

static_path = Path("/home/hitesh/nexus/frontend/static")
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

    @app.get("/", response_class=FileResponse)
    async def serve_index():
        return FileResponse(str(static_path / "index.html"))
