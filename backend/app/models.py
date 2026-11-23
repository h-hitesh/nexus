from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

class NodeModel(BaseModel):
    id: str
    label: str
    type: Optional[str] = "agent"  # input, agent, router, worker, sink
    status: Optional[str] = "idle" # idle, active, processing, success, warning, error
    icon: Optional[str] = None
    subtext: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class EdgeModel(BaseModel):
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    label: Optional[str] = None
    active: Optional[bool] = False
    pulse: Optional[bool] = False
    color: Optional[str] = None

class GraphPayload(BaseModel):
    nodes: List[NodeModel]
    edges: List[EdgeModel]

class BentoCard(BaseModel):
    title: str
    badge: Optional[str] = "NORMAL"
    status: Optional[str] = "good"  # good, warning, danger, neutral
    icon: Optional[str] = None
    metrics: Optional[Dict[str, str]] = None
    progress: Optional[float] = None # 0.0 to 100.0

class MatrixCell(BaseModel):
    label: str
    val: str
    level: Optional[str] = "neutral" # green, amber, red, cyan, purple, neutral
    subtext: Optional[str] = None

class MatrixPayload(BaseModel):
    title: str = "EXECUTION MATRIX"
    subtitle: Optional[str] = None
    cells: List[MatrixCell]

class StatePayload(BaseModel):
    bento: Optional[List[BentoCard]] = None
    matrix: Optional[MatrixPayload] = None
    kpis: Optional[Dict[str, str]] = None

class LogPayload(BaseModel):
    source: str
    message: str
    level: Optional[str] = "INFO" # INFO, WARN, ERROR, SUCCESS, AUDIT
    metadata: Optional[Dict[str, Any]] = None

class PulsePayload(BaseModel):
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    label: Optional[str] = None
    color: Optional[str] = "#ff5500"
    duration_ms: Optional[int] = 1200
    log: Optional[str] = None

class SessionStartPayload(BaseModel):
    title: str
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
