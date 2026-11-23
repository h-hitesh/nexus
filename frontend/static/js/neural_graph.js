/**
 * Nexus Neural Flow Graph Engine.
 * High-performance 60 FPS Canvas 2D engine rendering glowing Bezier paths,
 * dynamic node status glyphs, and traveling photon/particle packets.
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
        setTimeout(resize, 50);
    }

    setTopology(nodes, edges) {
        this.nodes = nodes || [];
        this.edges = edges || [];
        this.nodeMap.clear();
        this.nodes.forEach(n => this.nodeMap.set(n.id, n));
        this.layoutNodes();
        
        const countEl = document.getElementById('graph-node-count');
        if (countEl) countEl.innerText = `${this.nodes.length} NODES`;
    }

    layoutNodes() {
        if (!this.width || !this.height || this.nodes.length === 0) return;
        
        // Categorize into flow tiers
        const inputs = this.nodes.filter(n => n.type === 'input');
        const agents = this.nodes.filter(n => n.type === 'agent');
        const routers = this.nodes.filter(n => n.type === 'router');
        const sinks = this.nodes.filter(n => n.type === 'sink' || n.type === 'worker');
        
        const tiers = [inputs, agents, routers, sinks].filter(t => t.length > 0);
        const colSpacing = this.width / (tiers.length + 1);
        
        tiers.forEach((tier, tierIdx) => {
            const x = colSpacing * (tierIdx + 1);
            const rowSpacing = this.height / (tier.length + 1);
            tier.forEach((node, rowIdx) => {
                node.x = node.x || x;
                node.y = node.y || (rowSpacing * (rowIdx + 1));
            });
        });
    }

    emitPulse(fromId, toId, color = '#ff5500', durationMs = 1200) {
        const fromNode = this.nodeMap.get(fromId);
        const toNode = this.nodeMap.get(toId);
        if (!fromNode || !toNode) return;

        // Spawn multiple traveling photons for a rich glowing trail
        const count = 5;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                fromNode,
                toNode,
                progress: -(i * 0.08), // stagger
                speed: 1.0 / (durationMs / 16.6),
                color: color,
                size: 3.5 - (i * 0.4)
            });
        }
        
        // Highlight active nodes briefly
        fromNode.status = 'active';
        setTimeout(() => { fromNode.status = 'idle'; }, 600);
        setTimeout(() => { toNode.status = 'active'; }, durationMs * 0.7);
        setTimeout(() => { toNode.status = 'idle'; }, durationMs + 400);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 1. Draw Edges (Curved Bezier Paths)
        this.edges.forEach(edge => {
            const from = this.nodeMap.get(edge.from || edge.from_node);
            const to = this.nodeMap.get(edge.to || edge.to_node);
            if (!from || !to) return;
            
            const dx = to.x - from.x;
            const cp1x = from.x + dx * 0.5;
            const cp1y = from.y;
            const cp2x = from.x + dx * 0.5;
            const cp2y = to.y;
            
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, to.x, to.y);
            this.ctx.strokeStyle = edge.color || 'rgba(30, 41, 59, 0.7)';
            this.ctx.lineWidth = edge.active ? 2.5 : 1.2;
            this.ctx.stroke();
        });
        
        // 2. Update and Draw Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.progress += p.speed;
            
            if (p.progress >= 1.0) {
                this.particles.splice(i, 1);
                continue;
            }
            if (p.progress < 0) continue; // delayed particle
            
            const from = p.fromNode;
            const to = p.toNode;
            const dx = to.x - from.x;
            const cp1x = from.x + dx * 0.5;
            const cp1y = from.y;
            const cp2x = from.x + dx * 0.5;
            const cp2y = to.y;
            
            // Cubic Bezier interpolation
            const t = p.progress;
            const cx = Math.pow(1 - t, 3) * from.x + 3 * Math.pow(1 - t, 2) * t * cp1x + 3 * (1 - t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * to.x;
            const cy = Math.pow(1 - t, 3) * from.y + 3 * Math.pow(1 - t, 2) * t * cp1y + 3 * (1 - t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * to.y;
            
            // Draw glowing particle
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 3. Draw Nodes (Hexagonal or Rounded Rectangles with cyber styling)
        this.nodes.forEach(node => {
            const nx = node.x;
            const ny = node.y;
            const nw = 110;
            const nh = 36;
            
            this.ctx.save();
            
            // Status-based colors
            let borderColor = 'rgba(48, 62, 92, 0.8)';
            let glowColor = 'transparent';
            if (node.status === 'active' || node.status === 'processing') {
                borderColor = '#ff5500';
                glowColor = 'rgba(255, 85, 0, 0.4)';
            } else if (node.status === 'success') {
                borderColor = '#10b981';
                glowColor = 'rgba(16, 185, 129, 0.3)';
            } else if (node.status === 'error' || node.status === 'danger') {
                borderColor = '#ef4444';
                glowColor = 'rgba(239, 68, 68, 0.4)';
            }
            
            // Node background box
            this.ctx.fillStyle = '#0c1018';
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowColor = glowColor;
            this.ctx.shadowBlur = glowColor !== 'transparent' ? 12 : 0;
            
            this.ctx.beginPath();
            this.ctx.roundRect(nx - nw / 2, ny - nh / 2, nw, nh, 4);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Status pulse dot
            this.ctx.beginPath();
            this.ctx.arc(nx - nw / 2 + 10, ny, 3.5, 0, Math.PI * 2);
            this.ctx.fillStyle = borderColor;
            this.ctx.fill();
            
            // Node Label
            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.font = '600 11px "JetBrains Mono", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.label, nx + 4, ny + 3);
            
            // Type badge subtext
            if (node.type) {
                this.ctx.fillStyle = '#64748b';
                this.ctx.font = '500 8px "JetBrains Mono", monospace';
                this.ctx.fillText(node.type.toUpperCase(), nx + 4, ny + 13);
            }
            
            this.ctx.restore();
        });
        
        requestAnimationFrame(this.animate);
    }
}
