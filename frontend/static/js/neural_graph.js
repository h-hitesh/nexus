/**
 * Bulletproof 60 FPS Neural Flow Graph Engine.
 * Supports:
 * - Built-in roundRect Polyfill for all browsers (Chrome, Firefox, Safari, Mobile)
 * - Safe Dimension Detection with nonzero fallbacks
 * - High-Contrast Glassmorphic Node Rendering
 * - Multi-Lane Swimlane Auto-Layout
 */

// 1. Built-in roundRect Polyfill (Guarantees zero crashes across all browsers)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'undefined') r = 8;
        if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
        else {
            const defaultR = { tl: 0, tr: 0, br: 0, bl: 0 };
            for (const side in defaultR) r[side] = r[side] || defaultR[side];
        }
        this.beginPath();
        this.moveTo(x + r.tl, y);
        this.lineTo(x + w - r.tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
        this.lineTo(x + w, y + h - r.br);
        this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
        this.lineTo(x + r.bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
        this.lineTo(x, y + r.tl);
        this.quadraticCurveTo(x, y, x + r.tl, y);
        this.closePath();
        return this;
    };
}

class NeuralGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with ID '${canvasId}' not found.`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.particles = [];
        this.nodeMap = new Map();
        
        this.width = 800;
        this.height = 500;
        this.dpr = window.devicePixelRatio || 1;
        this.glowPhase = 0;
        
        this.initResize();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initResize() {
        const updateDims = () => {
            const parent = this.canvas.parentElement;
            const rect = parent ? parent.getBoundingClientRect() : null;
            
            const w = (rect && rect.width > 50) ? rect.width : (parent ? parent.clientWidth : window.innerWidth * 0.5);
            const h = (rect && rect.height > 50) ? rect.height : (parent ? parent.clientHeight : window.innerHeight * 0.5);
            
            this.width = Math.max(300, Math.floor(w || 800));
            this.height = Math.max(250, Math.floor(h || 500));
            
            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            
            this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
            this.ctx.scale(this.dpr, this.dpr);
            
            this.layoutNodes();
        };

        window.addEventListener('resize', updateDims);
        updateDims();
        setTimeout(updateDims, 50);
        setTimeout(updateDims, 250);
        setTimeout(updateDims, 600);
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
        if (this.nodes.length === 0) return;

        // Group by lane
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
                node.x = Math.floor(colWidth * (colIdx + 1));
                node.y = Math.floor(y);
            });
        });
    }

    emitPulse(fromId, toId, color = '#00f2fe', durationMs = 1200) {
        const fromNode = this.nodeMap.get(fromId);
        const toNode = this.nodeMap.get(toId);
        if (!fromNode || !toNode) return;

        // 6 glowing traveling photons
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

        fromNode.pulseActive = true;
        setTimeout(() => { fromNode.pulseActive = false; }, 500);
        setTimeout(() => {
            toNode.pulseActive = true;
            setTimeout(() => { toNode.pulseActive = false; }, 600);
        }, durationMs * 0.7);

        const pulseCounter = document.getElementById('stat-pulse-count');
        if (pulseCounter) {
            const current = parseInt(pulseCounter.innerText, 10) || 0;
            pulseCounter.innerText = current + 1;
        }
    }

    drawSafeRoundedRect(x, y, w, h, r) {
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, w, h, r);
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(x + r, y);
            this.ctx.arcTo(x + w, y, x + w, y + h, r);
            this.ctx.arcTo(x + w, y + h, x, y + h, r);
            this.ctx.arcTo(x, y + h, x, y, r);
            this.ctx.arcTo(x, y, x + w, y, r);
            this.ctx.closePath();
        }
    }

    animate() {
        try {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.glowPhase += 0.05;

            // 1. Draw Flow Filaments (Curved Bezier Paths)
            this.edges.forEach(edge => {
                const from = this.nodeMap.get(edge.from || edge.from_node);
                const to = this.nodeMap.get(edge.to || edge.to_node);
                if (!from || !to || !from.x || !to.x) return;

                const dx = to.x - from.x;
                const cp1x = from.x + dx * 0.5;
                const cp1y = from.y;
                const cp2x = from.x + dx * 0.5;
                const cp2y = to.y;

                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.moveTo(from.x, from.y);
                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);

                this.ctx.strokeStyle = edge.color || 'rgba(255, 255, 255, 0.12)';
                this.ctx.lineWidth = edge.active ? 2.5 : 1.2;
                this.ctx.stroke();

                if (edge.label && Math.abs(dx) > 100) {
                    const mx = (from.x + to.x) / 2;
                    const my = (from.y + to.y) / 2;
                    this.ctx.fillStyle = '#64748b';
                    this.ctx.font = '500 9px monospace';
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
                if (!from.x || !to.x) continue;

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
                this.ctx.arc(cx, cy, Math.max(1, p.size), 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 12;
                this.ctx.fill();
                this.ctx.restore();
            }

            // 3. Draw Modern Glassmorphic Node Tiles
            this.nodes.forEach(node => {
                if (typeof node.x === 'undefined' || typeof node.y === 'undefined') return;

                const nx = node.x;
                const ny = node.y;
                const nw = 136;
                const nh = 46;
                const r = 8;

                this.ctx.save();

                let accentColor = '#38bdf8';
                if (node.type === 'agent') accentColor = '#ff5500';
                else if (node.type === 'worker') accentColor = '#a855f7';
                else if (node.type === 'sink') accentColor = '#10b981';
                else if (node.type === 'input') accentColor = '#00f2fe';

                // Pulsating halo if active
                if (node.pulseActive) {
                    const pulseScale = 1.05 + Math.sin(this.glowPhase * 2) * 0.05;
                    this.drawSafeRoundedRect(nx - (nw * pulseScale) / 2, ny - (nh * pulseScale) / 2, nw * pulseScale, nh * pulseScale, r + 2);
                    this.ctx.strokeStyle = accentColor;
                    this.ctx.lineWidth = 2.0;
                    this.ctx.shadowColor = accentColor;
                    this.ctx.shadowBlur = 20;
                    this.ctx.stroke();
                }

                // Card Body
                this.drawSafeRoundedRect(nx - nw / 2, ny - nh / 2, nw, nh, r);
                this.ctx.fillStyle = 'rgba(20, 26, 42, 0.95)';
                this.ctx.shadowColor = node.pulseActive ? accentColor : 'rgba(0, 0, 0, 0.7)';
                this.ctx.shadowBlur = node.pulseActive ? 16 : 8;
                this.ctx.fill();

                // Border
                this.ctx.strokeStyle = node.pulseActive ? accentColor : 'rgba(255, 255, 255, 0.18)';
                this.ctx.lineWidth = 1.2;
                this.ctx.stroke();

                // Category Mini Pill (Top left)
                this.ctx.shadowBlur = 0;
                this.drawSafeRoundedRect(nx - nw / 2 + 8, ny - nh / 2 + 7, 26, 14, 4);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                this.ctx.fill();
                this.ctx.fillStyle = accentColor;
                this.ctx.font = '700 8px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(node.icon || (node.type ? node.type.slice(0, 2).toUpperCase() : 'ND'), nx - nw / 2 + 21, ny - nh / 2 + 17);

                // Sub-metric Tag (Top right)
                this.ctx.fillStyle = '#64748b';
                this.ctx.font = '500 8px monospace';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(node.subtext || (node.status === 'active' ? 'ACTIVE' : 'IDLE'), nx + nw / 2 - 8, ny - nh / 2 + 17);

                // Node Main Title
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '600 11px sans-serif';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(node.label, nx - nw / 2 + 8, ny + 11);

                this.ctx.restore();
            });
        } catch (err) {
            console.error('Error in NeuralGraph.animate:', err);
        }

        requestAnimationFrame(this.animate);
    }
}
