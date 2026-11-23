"""
Nexus Persistent Database Engine.
High-throughput asynchronous SQLite database with Write-Ahead Logging (WAL)
for session recording, event auditing, and historical time-travel replay.
"""

import aiosqlite
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

DB_PATH = os.getenv("NEXUS_DB_PATH", "/home/hitesh/nexus/data/nexus.db")

async def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode = WAL;")
        await db.execute("PRAGMA synchronous = NORMAL;")
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                created_at TEXT NOT NULL
            );
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                metadata TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            );
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            );
        """)
        
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_events_session 
            ON events(session_id, timestamp);
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS latest_state (
                project_id TEXT PRIMARY KEY,
                graph TEXT,
                bento TEXT,
                matrix TEXT,
                updated_at TEXT NOT NULL
            );
        """)
        
        await db.commit()

async def ensure_project(project_id: str, name: Optional[str] = None, description: Optional[str] = None, icon: Optional[str] = None):
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT OR IGNORE INTO projects (id, name, description, icon, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (project_id, name or project_id.replace('_', ' ').title(), description or "", icon or "◈", now))
        await db.commit()

async def get_projects() -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM projects ORDER BY created_at ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

async def start_session(project_id: str, title: str, session_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> str:
    s_id = session_id or str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()
    await ensure_project(project_id)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO sessions (id, project_id, title, status, started_at, metadata)
            VALUES (?, ?, ?, 'active', ?, ?)
        """, (s_id, project_id, title, now, json.dumps(metadata or {})))
        await db.commit()
    return s_id

async def end_session(session_id: str, status: str = "completed"):
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            UPDATE sessions 
            SET status = ?, ended_at = ?
            WHERE id = ?
        """, (status, now, session_id))
        await db.commit()

async def record_event(project_id: str, event_type: str, payload: Dict[str, Any], session_id: Optional[str] = None):
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        if not session_id:
            # Attach to the latest active session or create a default session
            async with db.execute("""
                SELECT id FROM sessions 
                WHERE project_id = ? AND status = 'active' 
                ORDER BY started_at DESC LIMIT 1
            """, (project_id,)) as cursor:
                row = await cursor.fetchone()
                if row:
                    session_id = row[0]
                else:
                    session_id = f"auto-{datetime.now(timezone.utc).strftime('%Y%m%d-%H')}"
                    await db.execute("""
                        INSERT OR IGNORE INTO sessions (id, project_id, title, status, started_at, metadata)
                        VALUES (?, ?, 'Continuous Stream', 'active', ?, '{}')
                    """, (session_id, project_id, now))
        
        await db.execute("""
            INSERT INTO events (session_id, project_id, timestamp, event_type, payload)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, project_id, now, event_type, json.dumps(payload)))
        
        # If this updates state, cache in latest_state
        if event_type == "graph":
            await db.execute("""
                INSERT INTO latest_state (project_id, graph, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(project_id) DO UPDATE SET graph = excluded.graph, updated_at = excluded.updated_at
            """, (project_id, json.dumps(payload), now))
        elif event_type == "state":
            bento = json.dumps(payload.get("bento", []))
            matrix = json.dumps(payload.get("matrix", {}))
            await db.execute("""
                INSERT INTO latest_state (project_id, bento, matrix, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(project_id) DO UPDATE SET bento = excluded.bento, matrix = excluded.matrix, updated_at = excluded.updated_at
            """, (project_id, bento, matrix, now))
            
        await db.commit()

async def get_latest_state(project_id: str) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM latest_state WHERE project_id = ?", (project_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return {"project_id": project_id, "graph": None, "bento": None, "matrix": None}
            return {
                "project_id": project_id,
                "graph": json.loads(row["graph"]) if row["graph"] else None,
                "bento": json.loads(row["bento"]) if row["bento"] else None,
                "matrix": json.loads(row["matrix"]) if row["matrix"] else None,
                "updated_at": row["updated_at"]
            }

async def get_project_sessions(project_id: str, limit: int = 30) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT s.*, count(e.id) as event_count 
            FROM sessions s
            LEFT JOIN events e ON s.id = e.session_id
            WHERE s.project_id = ?
            GROUP BY s.id
            ORDER BY s.started_at DESC
            LIMIT ?
        """, (project_id, limit)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

async def get_session_replay(session_id: str) -> Dict[str, Any]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cursor:
            s_row = await cursor.fetchone()
            if not s_row:
                return {}
            session_info = dict(s_row)
            
        async with db.execute("""
            SELECT timestamp, event_type, payload 
            FROM events 
            WHERE session_id = ? 
            ORDER BY id ASC
        """, (session_id,)) as cursor:
            events = []
            for r in await cursor.fetchall():
                events.append({
                    "timestamp": r["timestamp"],
                    "type": r["event_type"],
                    "payload": json.loads(r["payload"])
                })
            
            return {
                "session": session_info,
                "events": events
            }
