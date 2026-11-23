# Nexus Mission Control Design System (DESIGN.md)
*Standardized Agent-Native UX & Frontend Component Specification*

## 1. Visual Rationale & Anti-"AI Slop" Guidelines
This document serves as the machine-readable design specification for autonomous coding agents and frontend engineers working on the Nexus Mission Control platform.

### Core Problems Identified in Legacy Dashboard:
- **Canvas Blurring**: Low-level 2D canvas text rasterization created illegible grey blocks and washed-out text.
- **Visual Ghosting**: Sub-3:1 contrast ratios violated WCAG 2.2 AA accessibility standards.
- **Information Inflation**: 24 generic tiles with no distinct domain value created visual fatigue.
- **Arbitrary Graph Topologies**: Nodes placed without clear sequential pipeline stages (Ingress -> Routing -> Reasoning -> Egress).

---

## 2. Color Palette & Surface Elevation Ladder

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#08090a` | Deepest matte backdrop, zero-glare dark surface |
| `--bg-surface-0` | `#0e1013` | Secondary structural panels (dock, ticker, inspector) |
| `--bg-surface-1` | `#15181e` | Interactive card bodies, resting state |
| `--bg-surface-hover` | `#1d212a` | Card hover and active states |
| `--border-subtle` | `#232730` | 1px clean container dividers and card outlines |
| `--border-active` | `#f97316` | Active selection, circuit flow accent |
| `--accent-orange` | `#f97316` | Primary action accent, signal pulse, node titles |
| `--accent-cyan` | `#06b6d4` | Ingress ports, network packet identifiers |
| `--accent-purple` | `#a855f7` | AI cognitive agents and LLM router indicators |
| `--accent-emerald` | `#10b981` | Healthy system status, positive financial returns |
| `--accent-rose` | `#f43f5e` | Critical errors, circuit breaker trips |
| `--text-primary` | `#f1f5f9` | High-contrast headings and primary metrics (95% brightness) |
| `--text-secondary` | `#94a3b8` | Parameter labels, table headers, breadcrumbs |
| `--text-muted` | `#64748b` | Timestamps, static structural identifiers |

---

## 3. Typographic Discipline

- **Sans-Serif UI Font**: `Inter`, `Geist`, or system font stack for all titles, badges, and controls.
  - Heading 1: `14px`, `font-weight: 700`, `letter-spacing: -0.02em`
  - Heading 2: `12px`, `font-weight: 600`, `letter-spacing: -0.01em`
  - Body UI: `11px`, `font-weight: 500`
- **Monospace Font**: `JetBrains Mono` or `Geist Mono` for all numerical telemetry, parameters, hashes, and terminal logs.
  - Dotted Parameter Rows: `11px`, `font-weight: 400`
  - Terminal Stream: `11px`, line-height `1.5`, tabular numerals.
  - Strict Rule: Minimum font size in any component is `10px`. No 8px or 9px micro-labels.

---

## 4. Pipeline DAG Component Pattern (4-Stage Horizontal Flow)

Every data flow in Nexus must follow the horizontal 4-stage Directed Acyclic Graph:
1. **Stage 1 (INGRESS)**: External webhooks, Kafka streams, OS sockets, cron triggers.
2. **Stage 2 (ROUTING / GATE)**: Intent classifiers, risk gates, deduplication filters.
3. **Stage 3 (COGNITIVE AGENTS)**: LLM reasoning engines (Qwen 14B), quant auditors, self-healers.
4. **Stage 4 (SINKS / DISPATCH)**: Telegram Bot API, execution gateways, download clients, SQLite WAL.

### Node Component DOM Anatomy:
```html
<div class="dag-node" id="node-{id}" data-stage="{stage}" data-system="{system}">
  <div class="node-badge stage-{stage}">{STAGE_NAME}</div>
  <div class="node-header">
    <span class="node-title">{TITLE}</span>
    <span class="node-status-dot online"></span>
  </div>
  <div class="node-params">
    <div class="param-row"><span>label</span><strong>value</strong></div>
  </div>
  <div class="node-port port-in"></div>
  <div class="node-port port-out"></div>
</div>
```

---

## 5. Interaction Patterns
- **Semantic Path Isolation (Focus Mode)**: Hovering or selecting any node dims non-connected nodes to `opacity: 0.15` and illuminates connecting SVG Bezier splines.
- **Dynamic Traveling Photons**: Hardware-accelerated SVG `<circle>` elements trace spline paths (`stroke-dasharray` and `requestAnimationFrame`) to indicate live data throughput.
- **Single Viewport Guarantee**: The interface fits within a standard 1080p viewport without outer page scrolling.
