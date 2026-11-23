# ⬡ NEXUS // Universal Cognitive Execution Plane & Cyberpunk Telemetry HUD

> A decoupled, high-performance mission control visualizer and time-travel replay engine for homelab applications, multi-agent AI frameworks, and quant trading desks.

---

## 🌟 Overview

Nexus provides a high-contrast Cyberpunk / Bloomberg Terminal style Heads-Up Display (HUD) inspired by cinematic and institutional mission control consoles.

Instead of hardcoding visualizations into individual applications, **Nexus acts as an independent visualization and event replay server**. Any app, bot, or pipeline pushes execution events, and Nexus handles the real-time 60 FPS neural graph, bento status cards, telemetry matrix, and streaming terminal.

### Key Capabilities
* **60 FPS Neural Flow Graph**: Hardware-accelerated HTML5 Canvas engine rendering dynamic Bezier filaments and moving glowing photon packets whenever data flows between nodes.
* **Time-Travel Historical Replay**: Powered by an asynchronous SQLite database (WAL mode). Scrub back and forth across past execution sessions with variable playback speed (1x, 2x, 5x).
* **Multi-Project Workspace**: Switch between projects on the fly (Horizon Quant, Media Stack, Homelab SRE Sentinel, or any custom project).
* **Zero-Code External Adapters**: Connect applications by listening to existing REST APIs/Docker sockets without touching the upstream application's code.
* **Lightweight Python SDK**: Single-file, zero-dependency client (`nexus_client.py`) to instrument any new script in under 5 lines of code.

---

## 🚀 Quick Start

### 1. Run with Docker Compose
```bash
docker compose up -d
```
The HUD will be available at: `http://localhost:8500` (or `http://100.79.40.15:8500` over Tailscale).

---

## 🔌 Integrating Any Project (Zero-Code vs. SDK)

### Option A: Zero-Code Sidecar (Recommended for Production Apps like Horizon)
You don't need to change a single line of your application's source code. Nexus can poll existing endpoints (e.g. Horizon's `/api/risk`, `/status`, `/api/positions`) and convert them into glowing graph pulses and matrix states.

### Option B: Python SDK (`nexus_client.py`)
```python
from nexus_client import NexusClient

nexus = NexusClient(project_id="my_pipeline")

# Start recorded session for time-travel replay
nexus.start_session("Batch Ingestion Run #42")

# Emit glowing particle flow between nodes
nexus.pulse(from_node="input_feed", to_node="llm_agent", log="Received 50 records")

# Stream terminal logs
nexus.log("Evaluation complete. 0 anomalies detected.", level="SUCCESS")

# End session
nexus.end_session()
```

### Option C: Universal Webhook (For n8n & Third Parties)
```bash
curl -X POST http://100.79.40.15:8500/api/v1/webhook/my_project \
  -H "Content-Type: application/json" \
  -d '{"action": "pulse", "from": "source", "to": "destination", "log": "Event fired"}'
```

---

## 🏗️ Architecture

```
nexus/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI REST & WebSocket endpoints
│   │   ├── database.py         # Async SQLite engine (WAL mode)
│   │   ├── models.py           # Pydantic schemas (Graph, Bento, Matrix, Pulse)
│   │   └── hub.py              # WebSocket connection & broadcast manager
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── static/
│       ├── index.html          # Cyberpunk HUD layout & Replay Scrubber
│       ├── styles.css          # Dark obsidian, amber & neon styling
│       └── js/
│           ├── neural_graph.js # 60 FPS HTML5 Canvas Bezier particle engine
│           └── app.js          # Reactive controller & WebSocket client
├── sdk/
│   └── nexus_client.py         # Zero-dependency Python client
├── data/
│   └── nexus.db                # Persistent SQLite database (events, sessions)
└── docker-compose.yml
```
