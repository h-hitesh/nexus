/**
 * NEXUS MISSION CONTROL // Autonomous Multi-System Execution Plane
 * Core Application Engine & Dynamic Hardware-Accelerated SVG Fiber Graph
 */

// Pipeline Edge Topology Definition
const PIPELINE_EDGES = [
    // 1. Telegram AI OS Flow
    { id: 'e-tg-1', from: 'node-tg_ingress', to: 'node-intent_router', system: 'telegram', color: '#38bdf8' },
    { id: 'e-tg-2', from: 'node-cron_briefing', to: 'node-intent_router', system: 'telegram', color: '#38bdf8' },
    { id: 'e-tg-3', from: 'node-intent_router', to: 'node-tg_dispatch', system: 'telegram', color: '#38bdf8' },
    
    // 2. Horizon Quant Desk Flow
    { id: 'e-hor-1', from: 'node-horizon_ticks', to: 'node-cro_risk', system: 'horizon', color: '#f97316' },
    { id: 'e-hor-2', from: 'node-cro_risk', to: 'node-popper_audit', system: 'horizon', color: '#f97316' },
    { id: 'e-hor-3', from: 'node-cro_risk', to: 'node-sinclair_greeks', system: 'horizon', color: '#f97316' },
    { id: 'e-hor-4', from: 'node-popper_audit', to: 'node-horizon_order', system: 'horizon', color: '#f97316' },
    { id: 'e-hor-5', from: 'node-sinclair_greeks', to: 'node-horizon_order', system: 'horizon', color: '#f97316' },

    // 3. HolyArrs Media Flow
    { id: 'e-med-1', from: 'node-intent_router', to: 'node-holyarrs_engine', system: 'holyarrs', color: '#10b981' },
    { id: 'e-med-2', from: 'node-holyarrs_engine', to: 'node-transmission_sink', system: 'holyarrs', color: '#10b981' },

    // 4. SRE Sentinel Flow
    { id: 'e-sre-1', from: 'node-docker_socket', to: 'node-sre_filter', system: 'sre', color: '#a855f7' },
    { id: 'e-sre-2', from: 'node-sre_filter', to: 'node-sre_diagnostician', system: 'sre', color: '#a855f7' },
    { id: 'e-sre-3', from: 'node-sre_diagnostician', to: 'node-tg_dispatch', system: 'sre', color: '#a855f7' }
];

// Node Metadata Dictionary for Inspector Drawer
const NODE_METADATA = {
    'node-tg_ingress': {
        name: 'telegram.ingress',
        type: 'INGRESS',
        system: 'Telegram AI OS',
        latency: '340 ms',
        circuit: 'NOMINAL',
        payload: { flow: 'telegram_ingress', chat_id: 1119935406, bot: 'CinemaScout', mode: 'long-polling' }
    },
    'node-horizon_ticks': {
        name: 'horizon.ticks',
        type: 'INGRESS',
        system: 'Horizon Quant Desk',
        latency: '0.8 ms',
        circuit: 'NOMINAL',
        payload: { feed: 'Redpanda / Kafka', symbol: 'NIFTY 50', last_tick: 22482.80, depth: 5 }
    },
    'node-docker_socket': {
        name: 'docker.socket',
        type: 'INGRESS',
        system: 'SRE Sentinel',
        latency: '1.4 ms',
        circuit: 'NOMINAL',
        payload: { path: '/var/run/docker.sock', monitored_containers: 28, socket_events: 'ACTIVE' }
    },
    'node-cron_briefing': {
        name: 'n8n.cron_briefing',
        type: 'INGRESS',
        system: 'Telegram AI OS',
        latency: '2.1 ms',
        circuit: 'SCHEDULED',
        payload: { schedule: '08:00 AM IST', cron: '0 8 * * *', workflow: 'Morning Briefing' }
    },
    'node-intent_router': {
        name: 'intent.router',
        type: 'ROUTER',
        system: 'Telegram AI OS',
        latency: '320 ms',
        circuit: 'NOMINAL',
        payload: { engine: 'qwen2.5:14b', accelerator: 'Radeon 890M', routing_mode: 'zero-shot JSON' }
    },
    'node-cro_risk': {
        name: 'quant.cro_gate',
        type: 'GATE',
        system: 'Horizon Quant Desk',
        latency: '1.1 ms',
        circuit: 'ARMED',
        payload: { circuit_breaker: 'ARMED', margin_utilized: '28.5%', max_daily_loss: '₹10,000' }
    },
    'node-sre_filter': {
        name: 'sre.event_filter',
        type: 'FILTER',
        system: 'SRE Sentinel',
        latency: '0.4 ms',
        circuit: 'ACTIVE',
        payload: { matched_events: ['die', 'oom', 'unhealthy'], rate_limit: '10/min' }
    },
    'node-popper_audit': {
        name: 'quant.dr_popper',
        type: 'AUDITOR',
        system: 'Horizon Quant Desk',
        latency: '45 ms',
        circuit: 'PASSED',
        payload: { role: 'Chief Epistemological Auditor', lookahead_bias: false, curve_fit_score: 0.964 }
    },
    'node-sinclair_greeks': {
        name: 'quant.sinclair',
        type: 'GREEKS',
        system: 'Horizon Quant Desk',
        latency: '12 ms',
        circuit: 'HEDGED',
        payload: { delta: '+0.04', theta: '+₹4,200/day', vega: '-₹1,250', gamma: '+0.0012' }
    },
    'node-holyarrs_engine': {
        name: 'media.holyarrs',
        type: 'MEDIA SUITE',
        system: 'HolyArrs Media Suite',
        latency: '3.2 ms',
        circuit: 'CONSOLIDATED',
        payload: { radarr_sonarr_proxy: 'ENABLED', ram_saved: '940 MiB', qbittorrent_link: 'OK' }
    },
    'node-sre_diagnostician': {
        name: 'sre.diagnostician',
        type: 'AI AGENT',
        system: 'SRE Sentinel',
        latency: '510 ms',
        circuit: 'ARMED',
        payload: { model: 'qwen2.5:14b', auto_remediation: 'CARDS_ACTIVE', healthy_containers: 28 }
    },
    'node-tg_dispatch': {
        name: 'telegram.dispatch',
        type: 'DISPATCH',
        system: 'Telegram AI OS',
        latency: '140 ms',
        circuit: 'READY',
        payload: { voice_engine: 'OpenTTS', voice: 'glow-tts', output_format: 'audio/wav + MD' }
    },
    'node-horizon_order': {
        name: 'horizon.order_sink',
        type: 'GATEWAY',
        system: 'Horizon Quant Desk',
        latency: '5.4 ms',
        circuit: 'CONNECTED',
        payload: { net_pnl: '+₹14,250', open_positions: 4, broker: 'Dhan / Flattrade API' }
    },
    'node-transmission_sink': {
        name: 'transmission.sink',
        type: 'SINK',
        system: 'HolyArrs Media Suite',
        latency: '2.0 ms',
        circuit: 'ACTIVE',
        payload: { client: 'qBittorrent', active_downloads: 12, disk_available: '1.4 TB' }
    }
};

class NexusApp {
    constructor() {
        this.svgCanvas = document.getElementById('dagSvgCanvas');
        this.dagStage = document.getElementById('dagStage');
        this.paths = {};
        this.particles = [];
        this.activeFilter = 'all';
        this.selectedNodeId = 'node-tg_ingress';
        this.ws = null;
        
        this.init();
    }

    init() {
        this.startClock();
        this.buildSvgEdges();
        this.bindEvents();
        this.connectWebSocket();
        this.startParticleAnimation();
        this.selectNode(this.selectedNodeId);

        // Auto-refresh lines on window resize
        window.addEventListener('resize', () => {
            this.buildSvgEdges();
        });
    }

    startClock() {
        const clockEl = document.getElementById('systemClock');
        const update = () => {
            const now = new Date();
            clockEl.textContent = now.toTimeString().split(' ')[0] + ' IST';
        };
        update();
        setInterval(update, 1000);
    }

    buildSvgEdges() {
        if (!this.svgCanvas || !this.dagStage) return;
        this.svgCanvas.innerHTML = '';
        this.paths = {};

        const stageRect = this.dagStage.getBoundingClientRect();

        PIPELINE_EDGES.forEach(edge => {
            const fromNode = document.getElementById(edge.from);
            const toNode = document.getElementById(edge.to);
            if (!fromNode || !toNode) return;

            const fromRect = fromNode.getBoundingClientRect();
            const toRect = toNode.getBoundingClientRect();

            // Right center of fromNode -> Left center of toNode
            const x1 = fromRect.right - stageRect.left;
            const y1 = fromRect.top + (fromRect.height / 2) - stageRect.top;
            const x2 = toRect.left - stageRect.left;
            const y2 = toRect.top + (toRect.height / 2) - stageRect.top;

            const dx = Math.max(x2 - x1, 40);
            const pathData = `M ${x1} ${y1} C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('id', edge.id);
            path.setAttribute('data-system', edge.system);
            path.setAttribute('data-from', edge.from);
            path.setAttribute('data-to', edge.to);
            path.style.stroke = edge.color;

            this.svgCanvas.appendChild(path);
            this.paths[edge.id] = { element: path, edge: edge, length: path.getTotalLength() };
        });

        this.applyFilter(this.activeFilter);
    }

    startParticleAnimation() {
        let lastSpawn = Date.now();

        const animate = () => {
            const now = Date.now();
            
            // Spawn new photons periodically
            if (now - lastSpawn > 600) {
                lastSpawn = now;
                const visibleEdgeKeys = Object.keys(this.paths).filter(key => {
                    const item = this.paths[key];
                    return this.activeFilter === 'all' || item.edge.system === this.activeFilter;
                });

                if (visibleEdgeKeys.length > 0) {
                    const randomKey = visibleEdgeKeys[Math.floor(Math.random() * visibleEdgeKeys.length)];
                    this.spawnPhoton(randomKey);
                }
            }

            // Update active particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.progress += p.speed;

                if (p.progress >= 1) {
                    if (p.element.parentNode) p.element.parentNode.removeChild(p.element);
                    this.particles.splice(i, 1);
                } else {
                    const length = p.pathItem.length;
                    const point = p.pathItem.element.getPointAtLength(p.progress * length);
                    p.element.setAttribute('cx', point.x);
                    p.element.setAttribute('cy', point.y);
                }
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    spawnPhoton(edgeId) {
        const pathItem = this.paths[edgeId];
        if (!pathItem) return;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '2.5');
        circle.setAttribute('fill', pathItem.edge.color || '#f97316');
        circle.setAttribute('filter', 'drop-shadow(0 0 4px ' + (pathItem.edge.color || '#f97316') + ')');
        circle.style.pointerEvents = 'none';

        this.svgCanvas.appendChild(circle);

        this.particles.push({
            element: circle,
            pathItem: pathItem,
            progress: 0,
            speed: 0.015 + Math.random() * 0.01
        });
    }

    bindEvents() {
        // System Filter Switchers
        const filterBtns = document.querySelectorAll('#systemFilterGroup .seg-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sys = btn.getAttribute('data-system');
                this.applyFilter(sys);
            });
        });

        // Node Click & Hover
        const nodes = document.querySelectorAll('.dag-node');
        nodes.forEach(node => {
            node.addEventListener('click', () => {
                this.selectNode(node.id);
            });

            node.addEventListener('mouseenter', () => {
                this.isolateNodePaths(node.id);
            });

            node.addEventListener('mouseleave', () => {
                this.applyFilter(this.activeFilter);
            });
        });

        // Ingress Tile Click
        const ingressTiles = document.querySelectorAll('.ingress-tile');
        ingressTiles.forEach(tile => {
            tile.addEventListener('click', () => {
                const sys = tile.getAttribute('data-system');
                const matchingBtn = document.querySelector(`#systemFilterGroup .seg-btn[data-system="${sys}"]`);
                if (matchingBtn) matchingBtn.click();
            });
        });

        // Clear Logs Button
        const btnClear = document.getElementById('btnClearTerminal');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                const stream = document.getElementById('consoleStream');
                if (stream) stream.innerHTML = '<div class="log-row"><span class="log-time">' + new Date().toTimeString().split(' ')[0] + '</span><span class="log-msg text-muted">Console buffer cleared.</span></div>';
            });
        }

        // Test Pulse Button
        const btnPulse = document.getElementById('btnEmitPulse');
        if (btnPulse) {
            btnPulse.addEventListener('click', () => {
                this.emitTestPulse();
            });
        }

        // Log Filter Chips
        const chips = document.querySelectorAll('.log-filter-chips .chip-filter');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const filter = chip.getAttribute('data-filter');
                this.filterLogs(filter);
            });
        });
    }

    applyFilter(system) {
        this.activeFilter = system;
        const nodes = document.querySelectorAll('.dag-node');

        nodes.forEach(node => {
            const nodeSys = node.getAttribute('data-system');
            if (system === 'all' || nodeSys === system) {
                node.classList.remove('dimmed-node');
            } else {
                node.classList.add('dimmed-node');
            }
        });

        Object.keys(this.paths).forEach(key => {
            const item = this.paths[key];
            if (system === 'all' || item.edge.system === system) {
                item.element.classList.remove('dimmed-spline');
                item.element.style.opacity = '1';
            } else {
                item.element.classList.add('dimmed-spline');
                item.element.style.opacity = '0.08';
            }
        });
    }

    isolateNodePaths(nodeId) {
        const connectedEdges = PIPELINE_EDGES.filter(e => e.from === nodeId || e.to === nodeId);
        const connectedNodeIds = new Set([nodeId]);
        connectedEdges.forEach(e => {
            connectedNodeIds.add(e.from);
            connectedNodeIds.add(e.to);
        });

        const nodes = document.querySelectorAll('.dag-node');
        nodes.forEach(node => {
            if (connectedNodeIds.has(node.id)) {
                node.classList.remove('dimmed-node');
            } else {
                node.classList.add('dimmed-node');
            }
        });

        Object.keys(this.paths).forEach(key => {
            const item = this.paths[key];
            const isConnected = connectedEdges.some(e => e.id === key);
            if (isConnected) {
                item.element.classList.add('active-spline');
                item.element.style.opacity = '1';
            } else {
                item.element.classList.add('dimmed-spline');
                item.element.style.opacity = '0.06';
            }
        });
    }

    selectNode(nodeId) {
        this.selectedNodeId = nodeId;
        document.querySelectorAll('.dag-node').forEach(n => n.classList.remove('focused-node'));
        
        const node = document.getElementById(nodeId);
        if (node) node.classList.add('focused-node');

        const meta = NODE_METADATA[nodeId];
        if (meta) {
            document.getElementById('insNodeId').textContent = meta.name;
            document.getElementById('insNodeType').textContent = meta.type;
            document.getElementById('insSystem').textContent = meta.system;
            document.getElementById('insLatency').textContent = meta.latency;
            document.getElementById('insCircuit').textContent = meta.circuit;
            document.getElementById('insLastEvent').textContent = new Date().toTimeString().split(' ')[0] + ' IST';
            document.getElementById('insPayload').textContent = JSON.stringify(meta.payload, null, 2);
        }
    }

    emitTestPulse() {
        const meta = NODE_METADATA[this.selectedNodeId];
        if (!meta) return;

        // Visual flash on current node
        const node = document.getElementById(this.selectedNodeId);
        if (node) {
            node.style.borderColor = '#fff';
            setTimeout(() => { node.style.borderColor = ''; }, 300);
        }

        // Spawn photon on outgoing edges
        const outEdges = PIPELINE_EDGES.filter(e => e.from === this.selectedNodeId);
        outEdges.forEach(e => this.spawnPhoton(e.id));

        // Append log
        this.appendLog(meta.system.toUpperCase().replace(/\s+/g, '_'), `Manual test pulse executed on node [${meta.name}]. Execution latency: 0.9ms.`);

        // Call backend webhook API
        fetch('/api/v1/webhook/horizon_quant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'pulse',
                from: meta.name,
                to: 'nexus_telemetry',
                label: 'manual_pulse',
                log: `Executed test pulse from node ${meta.name}`
            })
        }).catch(() => {});
    }

    appendLog(source, message) {
        const stream = document.getElementById('consoleStream');
        if (!stream) return;

        const timeStr = new Date().toTimeString().split(' ')[0];
        let tagClass = 'tag-horizon';
        let rowClass = 'log-horizon';

        if (source.includes('TELEGRAM')) { tagClass = 'tag-tg'; rowClass = 'log-tg'; }
        else if (source.includes('MEDIA') || source.includes('HOLY')) { tagClass = 'tag-holyarrs'; rowClass = 'log-holyarrs'; }
        else if (source.includes('SRE') || source.includes('SENTINEL')) { tagClass = 'tag-sre'; rowClass = 'log-sre'; }

        const row = document.createElement('div');
        row.className = `log-row ${rowClass}`;
        row.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-tag ${tagClass}">[${source}]</span><span class="log-msg">${message}</span>`;

        stream.appendChild(row);
        stream.scrollTop = stream.scrollHeight;
    }

    filterLogs(filter) {
        const rows = document.querySelectorAll('.console-stream .log-row');
        rows.forEach(r => {
            if (filter === 'all' || r.classList.contains(`log-${filter}`)) {
                r.style.display = 'flex';
            } else {
                r.style.display = 'none';
            }
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/horizon_quant`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                const statusEl = document.getElementById('meshStatusText');
                if (statusEl) statusEl.textContent = 'MESH SYNCHRONIZED';
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'pulse') {
                        const matchingEdge = PIPELINE_EDGES.find(e => e.from.includes(msg.data.from) || e.to.includes(msg.data.to));
                        if (matchingEdge) this.spawnPhoton(matchingEdge.id);
                    } else if (msg.type === 'log') {
                        this.appendLog(msg.data.source || 'SYSTEM', msg.data.message || '');
                    }
                } catch (e) {}
            };

            this.ws.onclose = () => {
                setTimeout(() => this.connectWebSocket(), 3000);
            };
        } catch (e) {
            setTimeout(() => this.connectWebSocket(), 5000);
        }
    }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    window.nexus = new NexusApp();
});
