/**
 * Modern Neural Execution Graph Engine.
 * Features:
 * - 60 FPS Canvas with Glassmorphic Node Cards
 * - Curved Neon Bezier Filaments with Flowing Photon Trails
 * - Pulsating Halos on Active Nodes
 * - Multi-System Swimlane Layout (Telegram Flow, Horizon Quant, Media Pipeline, SRE Sentinel)
 */

class NeuralGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.particles = [];
        this.nodeMap = new Map();
        
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;
        this.animationFrame = null;
        this.glowPhase = 0;
        
        this.initResize();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initResize() {
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);
            this.layoutNodes();
        };
        window.addEventListener('resize', resize);
        setTimeout(resize, 60);
    }

    setTopology(nodes, edges) {
        this.nodes = nodes || [];
        this.edges = edges || [];
        this.nodeMap.clear();
        this.nodes.forEach(n => this.nodeMap.set(n.id, n));
        this.layoutNodes();
        
        const countEl = document.getElementById('stat-node-count');
        if (countEl) countEl.innerText = this.nodes.length;
    }

    layoutNodes() {
        if (!this.width || !this.height || this.nodes.length === 0) return;

        // Group by lane if specified
        const lanes = {};
        this.nodes.forEach(n => {
            const laneKey = n.lane || 'main';
            if (!lanes[laneKey]) lanes[laneKey] = [];
            lanes[laneKey].push(n);
        });

        const laneKeys = Object.keys(lanes);
        const laneHeight = this.height / (laneKeys.length + 1);

        laneKeys.forEach((laneKey, lIdx) => {
            const laneNodes = lanes[laneKey];
            const y = laneHeight * (lIdx + 1);
            const colWidth = this.width / (laneNodes.length + 1);
            laneNodes.forEach((node, colIdx) => {
                node.x = colWidth * (colIdx + 1);
                node.y = y;
            });
        });
    }

    emitPulse(fromId, toId, color = '#00f2fe', durationMs = 1200) {
        const fromNode = this.nodeMap.get(fromId);
        const toNode = this.nodeMap.get(toId);
        if (!fromNode || !toNode) return;

        // Spawn a packet trail of 6 glowing photons
        const count = 6;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                fromNode,
                toNode,
                progress: -(i * 0.07),
                speed: 1.0 / (durationMs / 16.6),
                color: color,
                size: 4.0 - (i * 0.5)
            });
        }

        // Trigger node activation halos
        fromNode.pulseActive = true;
        setTimeout(() => { fromNode.pulseActive = false; }, 500);
        setTimeout(() => {
            toNode.pulseActive = true;
            setTimeout(() => { toNode.pulseActive = false; }, 600);
        }, durationMs * 0.7);

        // Update pulse count badge
        const pulseCounter = document.getElementById('stat-pulse-count');
        if (pulseCounter) {
            const current = parseInt(pulseCounter.innerText, 10) || 0;
            pulseCounter.innerText = current + 1;
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.glowPhase += 0.05;

        // 1. Draw Flow Filaments (Curved Bezier Paths)
        this.edges.forEach(edge => {
            const from = this.nodeMap.get(edge.from || edge.from_node);
            const to = this.nodeMap.get(edge.to || edge.to_node);
            if (!from || !to) return;

            const dx = to.x - from.x;
            const cp1x = from.x + dx * 0.5;
            const cp1y = from.y;
            const cp2x = from.x + dx * 0.5;
            const cp2y = to.y;

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);

            // Subtle base filament
            this.ctx.strokeStyle = edge.color || 'rgba(255, 255, 255, 0.08)';
            this.ctx.lineWidth = edge.active ? 2.5 : 1.2;
            this.ctx.stroke();

            // Edge label if present
            if (edge.label && dx > 120) {
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2;
                this.ctx.fillStyle = '#64748b';
                this.ctx.font = '500 9px "JetBrains Mono", monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(edge.label, mx, my - 6);
            }
            this.ctx.restore();
        });

        // 2. Animate Traveling Glowing Photons
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.progress += p.speed;

            if (p.progress >= 1.0) {
                this.particles.splice(i, 1);
                continue;
            }
            if (p.progress < 0) continue;

            const from = p.fromNode;
            const to = p.toNode;
            const dx = to.x - from.x;
            const cp1x = from.x + dx * 0.5;
            const cp1y = from.y;
            const cp2x = from.x + dx * 0.5;
            const cp2y = to.y;

            const t = p.progress;
            const cx = Math.pow(1 - t, 3) * from.x + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * to.x;
            const cy = Math.pow(1 - t, 3) * from.y + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * to.y;

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 14;
            this.ctx.fill();
            this.ctx.restore();
        }

        // 3. Draw Modern Glassmorphic Node Tiles
        this.nodes.forEach(node => {
            const nx = node.x;
            const ny = node.y;
            const nw = 136;
            const nh = 46;
            const r = 10;

            this.ctx.save();

            // Accent color per category
            let accentColor = '#38bdf8'; // Cyan default
            if (node.type === 'agent') accentColor = '#ff5500'; // Amber
            else if (node.type === 'worker') accentColor = '#a855f7'; // Purple
            else if (node.type === 'sink') accentColor = '#10b981'; // Green
            else if (node.type === 'input') accentColor = '#00f2fe';

            // Pulsating halo if active
            if (node.pulseActive) {
                const pulseScale = 1.0 + Math.sin(this.glowPhase * 2) * 0.08;
                this.ctx.beginPath();
                this.ctx.roundRect(nx - (nw * pulseScale) / 2, ny - (nh * pulseScale) / 2, nw * pulseScale, nh * pulseScale, r + 2);
                this.ctx.strokeStyle = accentColor;
                this.ctx.lineWidth = 2.0;
                this.ctx.shadowColor = accentColor;
                this.ctx.shadowBlur = 24;
                this.ctx.stroke();
            }

            // Glass Card Body (Gradient)
            const grad = this.ctx.createLinearGradient(nx - nw / 2, ny - nh / 2, nx + nw / 2, ny + nh / 2);
            grad.addColorStop(0, 'rgba(22, 28, 44, 0.92)');
            grad.addColorStop(1, 'rgba(11, 14, 22, 0.96)');
            
            this.ctx.beginPath();
            this.ctx.roundRect(nx - nw / 2, ny - nh / 2, nw, nh, r);
            this.ctx.fillStyle = grad;
            this.ctx.shadowColor = node.pulseActive ? accentColor : 'rgba(0, 0, 0, 0.6)';
            this.ctx.shadowBlur = node.pulseActive ? 16 : 8;
            this.ctx.fill();

            // Card Border
            this.ctx.strokeStyle = node.pulseActive ? accentColor : 'rgba(255, 255, 255, 0.12)';
            this.ctx.lineWidth = 1.0;
            this.ctx.stroke();

            // Category Mini Pill (Top left)
            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.roundRect(nx - nw / 2 + 8, ny - nh / 2 + 7, 24, 14, 4);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            this.ctx.fill();
            this.ctx.fillStyle = accentColor;
            this.ctx.font = '700 8px "JetBrains Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.icon || (node.type ? node.type.slice(0, 2).toUpperCase() : 'ND'), nx - nw / 2 + 20, ny - nh / 2 + 17);

            // Sub-metric Tag (Top right)
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '500 8px "JetBrains Mono", monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(node.subtext || (node.status === 'active' ? 'ACTIVE' : 'IDLE'), nx + nw / 2 - 8, ny - nh / 2 + 17);

            // Node Main Title
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.font = '600 11px "Inter", sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(node.label, nx - nw / 2 + 8, ny + 11);

            this.ctx.restore();
        });

        requestAnimationFrame(this.animate);
    }
}
