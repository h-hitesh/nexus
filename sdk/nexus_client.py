"""
Nexus Python Client SDK.
Zero-dependency HTTP client allowing any homelab application, bot, or script
to push real-time neural pulses, telemetry logs, bento cards, and session lifecycles
into the Nexus Cyberpunk Mission Control plane.
"""

import urllib.request
import json
import os
from typing import Any, Dict, List, Optional

class NexusClient:
    def __init__(self, project_id: str, base_url: Optional[str] = None):
        self.project_id = project_id
        self.base_url = (base_url or os.getenv("NEXUS_URL", "http://100.79.40.15:8500")).rstrip("/")
        self.session_id: Optional[str] = None

    def _post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1/projects/{self.project_id}/{endpoint.lstrip('/')}"
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            # Non-blocking: fail gracefully so telemetry never crashes business logic
            return {"status": "error", "message": str(e)}

    def start_session(self, title: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Start a new recorded execution session for time-travel replay."""
        res = self._post("session/start", {"title": title, "metadata": metadata or {}})
        self.session_id = res.get("session_id")
        return self.session_id

    def end_session(self):
        """Mark the active execution session as completed."""
        if self.session_id:
            self._post("session/end", {"session_id": self.session_id})
            self.session_id = None

    def pulse(self, from_node: str, to_node: str, label: Optional[str] = None, color: str = "#ff5500", log: Optional[str] = None):
        """Animate a glowing particle packet between two nodes on the neural graph."""
        payload = {
            "from": from_node,
            "to": to_node,
            "label": label,
            "color": color,
            "log": log
        }
        return self._post("pulse", payload)

    def log(self, message: str, source: str = "APP", level: str = "INFO"):
        """Stream an execution log line to the cybernetic terminal."""
        return self._post("log", {"source": source, "message": message, "level": level})

    def update_bento(self, cards: List[Dict[str, Any]]):
        """Update the micro-agent status cards in the bento grid."""
        return self._post("state", {"bento": cards})

    def update_matrix(self, title: str, cells: List[Dict[str, Any]]):
        """Update the N-cell execution matrix heatmap."""
        return self._post("state", {"matrix": {"title": title, "cells": cells}})

    def set_topology(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        """Set the neural graph DAG structure."""
        return self._post("graph", {"nodes": nodes, "edges": edges})
