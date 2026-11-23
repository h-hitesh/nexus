import asyncio
import json
from typing import Dict, List, Set
from fastapi import WebSocket

class ConnectionHub:
    def __init__(self):
        # project_id -> Set[WebSocket]
        self.project_connections: Dict[str, Set[WebSocket]] = {}
        # All connected WebSockets
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        self.all_connections.add(websocket)
        if project_id not in self.project_connections:
            self.project_connections[project_id] = set()
        self.project_connections[project_id].add(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str):
        self.all_connections.discard(websocket)
        if project_id in self.project_connections:
            self.project_connections[project_id].discard(websocket)
            if not self.project_connections[project_id]:
                del self.project_connections[project_id]

    async def broadcast_project(self, project_id: str, message: dict):
        payload = json.dumps(message)
        recipients = list(self.project_connections.get(project_id, []))
        for ws in recipients:
            try:
                await ws.send_text(payload)
            except Exception:
                self.disconnect(ws, project_id)

    async def broadcast_all(self, message: dict):
        payload = json.dumps(message)
        for ws in list(self.all_connections):
            try:
                await ws.send_text(payload)
            except Exception:
                self.all_connections.discard(ws)

hub = ConnectionHub()
