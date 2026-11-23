/**
 * Nexus Mission Control Main App.
 * Orchestrates WebSocket event streaming, project workspaces,
 * dynamic UI components, and Time-Travel Event Replay.
 */

document.addEventListener('DOMContentLoaded', () => {
    const graph = new NeuralGraph('neuralCanvas');
    let currentProject = 'horizon_quant';
    let ws = null;
    let isReplayMode = false;
    
    // Replay state
    let replayEvents = [];
    let replayIdx = 0;
    let replayTimer = null;
    let replaySpeed = 1;
    let isPlaying = false;

    // Elements
    const projectSelect = document.getElementById('project-select');
    const wsStatus = document.getElementById('ws-status');
    const hudClock = document.getElementById('hud-clock');
    const bentoContainer = document.getElementById('bento-container');
    const matrixGrid = document.getElementById('matrix-grid');
    const matrixTitle = document.getElementById('matrix-title');
    const terminalStream = document.getElementById('terminal-stream');
    const ingressBrief = document.getElementById('ingress-brief');
    const ingressPayload = document.getElementById('ingress-payload');
    
    // Mode buttons
    const btnModeLive = document.getElementById('btn-mode-live');
    const btnModeReplay = document.getElementById('btn-mode-replay');
    const replayDeck = document.getElementById('replay-deck');
    const replayPlayBtn = document.getElementById('replay-play-btn');
    const replaySessionSelect = document.getElementById('replay-session-select');
    const replaySlider = document.getElementById('replay-slider');
    const replayTimeCurrent = document.getElementById('replay-time-current');
    const replayEventCount = document.getElementById('replay-event-count');

    // 1. Clock
    setInterval(() => {
        const now = new Date();
        hudClock.innerText = now.toTimeString().split(' ')[0] + ' IST';
    }, 1000);

    // 2. WebSocket Connection
    function connectWebSocket(projectId) {
        if (ws) {
            ws.close();
            ws = null;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/${projectId}`;
        
        wsStatus.innerText = 'CONNECTING...';
        wsStatus.className = 'chip-val';
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            wsStatus.innerText = 'CONNECTED';
            wsStatus.className = 'chip-val status-online';
        };

        ws.onmessage = (event) => {
            if (isReplayMode) return; // Ignore live stream during historical replay
            try {
                const msg = JSON.parse(event.data);
                handleEvent(msg);
            } catch (err) {
                console.error('Failed to parse WS msg:', err);
            }
        };

        ws.onclose = () => {
            wsStatus.innerText = 'OFFLINE';
            wsStatus.className = 'chip-val text-red';
            setTimeout(() => {
                if (!isReplayMode) connectWebSocket(currentProject);
            }, 3000);
        };
    }

    // 3. Event Router
    function handleEvent(msg) {
        const { type, data } = msg;
        switch (type) {
            case 'init':
                if (data.graph) graph.setTopology(data.graph.nodes, data.graph.edges);
                if (data.bento) renderBento(data.bento);
                if (data.matrix) renderMatrix(data.matrix);
                break;
            case 'graph':
                graph.setTopology(data.nodes, data.edges);
                break;
            case 'pulse':
                graph.emitPulse(data.from || data.from_node, data.to || data.to_node, data.color || '#ff5500', data.duration_ms || 1200);
                break;
            case 'state':
                if (data.bento) renderBento(data.bento);
                if (data.matrix) renderMatrix(data.matrix);
                break;
            case 'log':
                appendLog(data);
                break;
            case 'session_start':
                ingressBrief.innerText = data.title || 'Session active';
                appendLog({ source: 'SYSTEM', message: `=== Session Started: ${data.title} ===`, level: 'SUCCESS' });
                break;
        }
    }

    // 4. Render Bento Grid
    function renderBento(cards) {
        if (!cards || !Array.isArray(cards)) return;
        bentoContainer.innerHTML = '';
        cards.forEach(c => {
            const cardEl = document.createElement('div');
            cardEl.className = 'bento-card';
            
            let metricsHtml = '';
            if (c.metrics) {
                for (const [k, v] of Object.entries(c.metrics)) {
                    metricsHtml += `<div class="metric-item"><span>${k}:</span><span>${v}</span></div>`;
                }
            }
            
            const badgeClass = c.status || 'good';
            cardEl.innerHTML = `
                <div class="bento-header">
                    <span class="bento-title">${c.title}</span>
                    <span class="bento-badge ${badgeClass}">${c.badge || 'NORMAL'}</span>
                </div>
                <div class="bento-metrics">${metricsHtml}</div>
            `;
            bentoContainer.appendChild(cardEl);
        });
    }

    // 5. Render N-Cell Matrix
    function renderMatrix(matrixData) {
        if (!matrixData || !matrixData.cells) return;
        if (matrixData.title) matrixTitle.innerText = matrixData.title.toUpperCase();
        matrixGrid.innerHTML = '';
        
        matrixData.cells.forEach(cell => {
            const cellEl = document.createElement('div');
            const levelClass = cell.level || 'neutral';
            cellEl.className = `matrix-cell ${levelClass}`;
            cellEl.innerHTML = `
                <span class="cell-label">${cell.label}</span>
                <span class="cell-val">${cell.val}</span>
            `;
            matrixGrid.appendChild(cellEl);
        });
    }

    // 6. Append Log Line
    function appendLog(log) {
        const line = document.createElement('div');
        const levelClass = (log.level || 'info').toLowerCase();
        line.className = `log-line ${levelClass}`;
        
        const time = log.timestamp || new Date().toISOString().split('T')[1].slice(0, 12);
        line.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-source">${log.source || 'SYS'}</span>
            <span class="log-msg">${log.message}</span>
        `;
        terminalStream.appendChild(line);
        terminalStream.scrollTop = terminalStream.scrollHeight;
    }

    document.getElementById('btn-clear-log')?.addEventListener('click', () => {
        terminalStream.innerHTML = '';
    });

    // 7. Project Switching
    projectSelect.addEventListener('change', (e) => {
        currentProject = e.target.value;
        terminalStream.innerHTML = '';
        if (isReplayMode) {
            loadProjectHistory(currentProject);
        } else {
            connectWebSocket(currentProject);
            loadInitialDefaults(currentProject);
        }
    });

    // Default seed topologies per project
    function loadInitialDefaults(projectId) {
        if (projectId === 'horizon_quant') {
            ingressBrief.innerText = 'Options Skew Arbitrage & Institutional Greek Balancing';
            ingressPayload.innerText = JSON.stringify({ underlying: 'NIFTY', expiry: '06-OCT-26', delta_target: 0.0, max_margin: '35%' }, null, 2);
            graph.setTopology(
                [
                    { id: 'ticks', label: 'TICK STREAM', type: 'input' },
                    { id: 'alpha', label: 'ALPHA ENGINE', type: 'agent' },
                    { id: 'popper', label: 'DR. POPPER', type: 'agent' },
                    { id: 'sinclair', label: 'SINCLAIR', type: 'agent' },
                    { id: 'cro', label: 'CRO RISK', type: 'agent' },
                    { id: 'router', label: 'ORDER ROUTER', type: 'router' },
                    { id: 'broker', label: 'ZERODHA / OA', type: 'sink' }
                ],
                [
                    { from: 'ticks', to: 'alpha' },
                    { from: 'alpha', to: 'popper' },
                    { from: 'alpha', to: 'sinclair' },
                    { from: 'popper', to: 'cro' },
                    { from: 'sinclair', to: 'cro' },
                    { from: 'cro', to: 'router' },
                    { from: 'router', to: 'broker' }
                ]
            );
            renderBento([
                { title: 'Dr. Popper (Auditor)', badge: 'APPROVED', status: 'good', metrics: { 'Conf': '96%', 'Bias': 'None', 'Fit': 'Clean' } },
                { title: 'Sinclair (Options)', badge: 'ACTIVE', status: 'good', metrics: { 'Delta': '+0.04', 'Theta': '+₹4,200', 'Vega': '-1,250' } },
                { title: 'CRO (Risk Gate)', badge: 'GATED', status: 'good', metrics: { 'Margin': '28.5%', 'Circuit': 'Active', 'Max Lots': '10' } }
            ]);
            // Seed 24 strike matrix
            const cells = [];
            for (let i = 22000; i <= 23150; i += 50) {
                cells.push({ label: `NIFTY ${i}`, val: `${(12 + (i % 7) * 1.5).toFixed(1)}%`, level: i % 100 === 0 ? 'green' : 'amber' });
            }
            renderMatrix({ title: '24-STRIKE IMPLIED VOLATILITY HEATMAP', cells: cells.slice(0, 24) });
        } else if (projectId === 'media_stack') {
            ingressBrief.innerText = 'Autonomous Media Ingestion & Transmission Handshake';
            ingressPayload.innerText = JSON.stringify({ client: 'CinemaScout', requested_by: 'Hitesh', auto_download: true }, null, 2);
            graph.setTopology(
                [
                    { id: 'tg', label: 'TELEGRAM BOT', type: 'input' },
                    { id: 'scout', label: 'CINEMASCOUT', type: 'agent' },
                    { id: 'tmdb', label: 'TMDB METADATA', type: 'worker' },
                    { id: 'holyarrs', label: 'HOLYARRS', type: 'agent' },
                    { id: 'prowlarr', label: 'PROWLARR', type: 'worker' },
                    { id: 'trans', label: 'TRANSMISSION', type: 'worker' },
                    { id: 'jellyfin', label: 'JELLYFIN', type: 'sink' }
                ],
                [
                    { from: 'tg', to: 'scout' },
                    { from: 'scout', to: 'tmdb' },
                    { from: 'scout', to: 'holyarrs' },
                    { from: 'holyarrs', to: 'prowlarr' },
                    { from: 'prowlarr', to: 'trans' },
                    { from: 'trans', to: 'jellyfin' }
                ]
            );
            renderBento([
                { title: 'HolyArrs Unified', badge: 'ONLINE', status: 'good', metrics: { 'Radarr/Sonarr': 'Mapped', 'Active Sync': 'True' } },
                { title: 'Transmission Engine', badge: 'ACTIVE', status: 'good', metrics: { 'Speed': '42 MB/s', 'Active Peers': '44', 'Torrents': '6' } },
                { title: 'Jellyfin Library', badge: 'SYNCED', status: 'good', metrics: { 'Scan Interval': 'Auto', 'Streams': '0' } }
            ]);
            const cells = [];
            for (let i = 1; i <= 24; i++) {
                cells.push({ label: `TORRENT #${i}`, val: `${Math.min(100, i * 8)}%`, level: i * 8 >= 100 ? 'green' : (i * 8 > 40 ? 'cyan' : 'amber') });
            }
            renderMatrix({ title: 'MEDIA INGESTION & DOWNLOAD MATRIX', cells });
        } else if (projectId === 'sre_sentinel') {
            ingressBrief.innerText = 'Autonomous Docker Daemon SRE Sentinel & Self-Healing Loop';
            ingressPayload.innerText = JSON.stringify({ poll_interval: '15m', daemon: '/var/run/docker.sock', ai_diagnostician: 'qwen2.5-coder:14b' }, null, 2);
            graph.setTopology(
                [
                    { id: 'sock', label: 'DOCKER SOCK', type: 'input' },
                    { id: 'scan', label: 'SCANNER', type: 'agent' },
                    { id: 'filter', label: 'ANOMALY FILTER', type: 'router' },
                    { id: 'qwen', label: 'QWEN 14B CODER', type: 'agent' },
                    { id: 'card', label: 'TELEGRAM CARD', type: 'sink' },
                    { id: 'heal', label: 'SELF-HEAL SCRIPT', type: 'worker' }
                ],
                [
                    { from: 'sock', to: 'scan' },
                    { from: 'scan', to: 'filter' },
                    { from: 'filter', to: 'qwen' },
                    { from: 'qwen', to: 'card' },
                    { from: 'qwen', to: 'heal' }
                ]
            );
            renderBento([
                { title: 'Host Docker Daemon', badge: 'HEALTHY', status: 'good', metrics: { 'Containers': '28 UP', 'Restarting': '0', 'Unhealthy': '0' } },
                { title: 'Host Qwen Diagnostician', badge: 'READY', status: 'good', metrics: { 'GPU': 'Radeon 890M', 'Model': 'qwen2.5-coder:14b' } },
                { title: 'Telegram Dispatch', badge: 'ACTIVE', status: 'good', metrics: { 'Recipient': '1119935406', 'Remediation': 'Enabled' } }
            ]);
            const cells = [];
            const names = ['n8n', 'open-webui', 'holyarrs', 'redpanda', 'transmission', 'jellyfin', 'glances', 'uptime-kuma', 'navidrome', 'audiobookshelf', 'calibre', 'metube', 'portainer', 'watchtower', 'openalgo', 'tts', 'horizon-api', 'horizon-strat', 'telegram-bot', 'ai-dashboard', 'dockerproxy', 'bindery', 'prowlarr', 'flaresolverr'];
            names.forEach(n => {
                cells.push({ label: n.toUpperCase().slice(0, 8), val: 'UP', level: 'green' });
            });
            renderMatrix({ title: 'HOMELAB CONTAINER MESH (24 TILES)', cells });
        }
    }

    // 8. Time-Travel Replay Logic
    btnModeLive.addEventListener('click', () => {
        isReplayMode = false;
        btnModeLive.classList.add('active');
        btnModeReplay.classList.remove('active');
        replayDeck.classList.add('hidden');
        if (replayTimer) clearInterval(replayTimer);
        connectWebSocket(currentProject);
    });

    btnModeReplay.addEventListener('click', () => {
        isReplayMode = true;
        btnModeReplay.classList.add('active');
        btnModeLive.classList.remove('active');
        replayDeck.classList.remove('hidden');
        if (ws) ws.close();
        wsStatus.innerText = 'REPLAY MODE';
        wsStatus.className = 'chip-val text-cyan';
        loadProjectHistory(currentProject);
    });

    async function loadProjectHistory(projectId) {
        try {
            const resp = await fetch(`/api/v1/projects/${projectId}/history`);
            const sessions = await resp.json();
            replaySessionSelect.innerHTML = '<option value="">Select Past Event / Session...</option>';
            sessions.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.innerText = `${s.started_at.slice(0, 19).replace('T', ' ')} - ${s.title} (${s.event_count || 0} events)`;
                replaySessionSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }

    replaySessionSelect.addEventListener('change', async (e) => {
        const sId = e.target.value;
        if (!sId) return;
        try {
            const resp = await fetch(`/api/v1/projects/${currentProject}/sessions/${sId}/replay`);
            const data = await resp.json();
            replayEvents = data.events || [];
            replayIdx = 0;
            replaySlider.max = Math.max(0, replayEvents.length - 1);
            replaySlider.value = 0;
            terminalStream.innerHTML = '';
            appendLog({ source: 'REPLAY', message: `Loaded session '${data.session.title}' with ${replayEvents.length} events`, level: 'INFO' });
            replayEventCount.innerText = `0 / ${replayEvents.length} Events`;
        } catch (e) {
            console.error('Failed to load session replay:', e);
        }
    });

    replayPlayBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseReplay();
        } else {
            playReplay();
        }
    });

    function playReplay() {
        if (replayEvents.length === 0) return;
        isPlaying = true;
        replayPlayBtn.innerText = '⏸ PAUSE';
        const interval = Math.max(100, 800 / replaySpeed);
        
        replayTimer = setInterval(() => {
            if (replayIdx >= replayEvents.length) {
                pauseReplay();
                return;
            }
            const ev = replayEvents[replayIdx];
            handleEvent({ type: ev.type, data: ev.payload });
            replaySlider.value = replayIdx;
            replayEventCount.innerText = `${replayIdx + 1} / ${replayEvents.length} Events`;
            replayIdx++;
        }, interval);
    }

    function pauseReplay() {
        isPlaying = false;
        replayPlayBtn.innerText = '▶ PLAY';
        if (replayTimer) clearInterval(replayTimer);
    }

    replaySlider.addEventListener('input', (e) => {
        pauseReplay();
        replayIdx = parseInt(e.target.value, 10);
        replayEventCount.innerText = `${replayIdx} / ${replayEvents.length} Events`;
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            replaySpeed = parseFloat(btn.dataset.speed);
            if (isPlaying) {
                pauseReplay();
                playReplay();
            }
        });
    });

    // Initial Load
    loadInitialDefaults('horizon_quant');
    connectWebSocket('horizon_quant');
});
