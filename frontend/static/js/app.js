/**
 * Modern Nexus AI OS Frontend Controller.
 * Features:
 * - Single-page unified command center (Pill-based switching, zero dropdowns)
 * - Prominent Telegram AI OS Flow
 * - 60 FPS Canvas Graph rendering
 * - Real-Time WebSocket event streaming
 * - Interactive Time-Travel Event Replay
 */

document.addEventListener('DOMContentLoaded', () => {
    const graph = new NeuralGraph('neuralCanvas');
    let currentFlow = 'all';
    let ws = null;
    let isReplayMode = false;

    // Replay State
    let replayEvents = [];
    let replayIdx = 0;
    let replayTimer = null;
    let replaySpeed = 1;
    let isPlaying = false;

    // Elements
    const hudClock = document.getElementById('hud-clock');
    const wsStatus = document.getElementById('ws-status');
    const bentoContainer = document.getElementById('bento-container');
    const matrixGrid = document.getElementById('matrix-grid');
    const matrixTitle = document.getElementById('matrix-title');
    const matrixSubtext = document.getElementById('matrix-subtext');
    const terminalStream = document.getElementById('terminal-stream');
    const ingressBrief = document.getElementById('ingress-brief');
    const ingressPayload = document.getElementById('ingress-payload');
    const activeFlowBadge = document.getElementById('active-flow-badge');
    const agentActiveCount = document.getElementById('agent-active-count');

    // Navigation Pills
    const navPills = document.querySelectorAll('.nav-pill');
    
    // Mode Buttons & Replay Bar
    const btnModeLive = document.getElementById('btn-mode-live');
    const btnModeReplay = document.getElementById('btn-mode-replay');
    const replayBar = document.getElementById('replay-bar');
    const replayPlayBtn = document.getElementById('replay-play-btn');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const replaySessionSelect = document.getElementById('replay-session-select');
    const replaySlider = document.getElementById('replay-slider');
    const replaySessionName = document.getElementById('replay-session-name');
    const replayEventCounter = document.getElementById('replay-event-counter');

    // 1. Live Clock
    setInterval(() => {
        const now = new Date();
        hudClock.innerText = now.toTimeString().split(' ')[0] + ' IST';
    }, 1000);

    // 2. Multi-Pipeline Topology Catalog
    const FLOW_CATALOG = {
        telegram: {
            name: 'TELEGRAM AI OS FLOW',
            brief: 'Bi-directional natural language interface routing commands, trading queries, and media requests to specialized local agents.',
            payload: {
                bot: 'CinemaScout / Homelab Assistant',
                token_hash: '9217419...xya4',
                owner_chat_id: '1119935406',
                voice_engine: 'OpenTTS glow-tts'
            },
            nodes: [
                { id: 'tg_user', label: 'User Message', type: 'input', icon: 'TG', subtext: 'POLL', lane: 'l1' },
                { id: 'tg_bot', label: 'Telegram Bot API', type: 'worker', icon: 'API', subtext: '200 OK', lane: 'l1' },
                { id: 'intent_router', label: 'Intent Router', type: 'agent', icon: 'AI', subtext: 'QWEN 14B', lane: 'l1' },
                { id: 'sub_agent', label: 'Target Agent', type: 'agent', icon: 'ROUT', subtext: 'MULTI', lane: 'l1' },
                { id: 'tts_synth', label: 'Neural OpenTTS', type: 'worker', icon: 'TTS', subtext: '5500', lane: 'l1' },
                { id: 'tg_dispatch', label: 'Telegram Card/Voice', type: 'sink', icon: 'OUT', subtext: 'DISPATCH', lane: 'l1' }
            ],
            edges: [
                { from: 'tg_user', to: 'tg_bot', label: 'long-poll' },
                { from: 'tg_bot', to: 'intent_router', label: 'prompt' },
                { from: 'intent_router', to: 'sub_agent', label: 'route' },
                { from: 'sub_agent', to: 'tts_synth', label: 'audio script' },
                { from: 'sub_agent', to: 'tg_dispatch', label: 'markdown' },
                { from: 'tts_synth', to: 'tg_dispatch', label: 'voice .wav' }
            ],
            bento: [
                { title: 'Telegram Gateway', badge: 'ACTIVE', status: 'good', icon: '💬', metrics: { 'Chat ID': '1119935406', 'Polling': '1.2s' } },
                { title: 'Host Intent Router', badge: 'QWEN 14B', status: 'good', icon: '🧠', metrics: { 'GPU': 'Radeon 890M', 'Latency': '340ms' } },
                { title: 'OpenTTS Voice Engine', badge: 'READY', status: 'good', icon: '🎙️', metrics: { 'Voice': 'glow-tts', 'Voices': '181' } }
            ],
            matrixTitle: 'TELEGRAM CONVERSATION & DISPATCH MATRIX',
            matrix: Array.from({ length: 24 }, (_, i) => ({
                label: `MSG #${100 + i}`,
                val: i % 4 === 0 ? 'AUDIO' : (i % 3 === 0 ? 'MEDIA' : 'QUANT'),
                level: i % 4 === 0 ? 'purple' : (i % 3 === 0 ? 'green' : 'cyan')
            }))
        },

        horizon: {
            name: 'HORIZON QUANT COUNCIL',
            brief: 'Institutional quantitative derivative desk running options Greeks evaluation, Dr. Popper audits, and circuit breakers.',
            payload: {
                underlying: 'NIFTY',
                capital: '₹1,000,000',
                delta: '+0.04',
                theta: '+₹4,200',
                vega: '-₹1,250',
                circuit_breaker: 'ACTIVE'
            },
            nodes: [
                { id: 'ticks', label: 'Tick Feed (Kafka)', type: 'input', icon: 'TICK', subtext: 'KAFKA', lane: 'l1' },
                { id: 'alpha', label: 'Strategy Engine', type: 'agent', icon: 'ORB', subtext: '15m ORB', lane: 'l1' },
                { id: 'popper', label: 'Dr. Popper (Auditor)', type: 'agent', icon: 'AUD', subtext: 'CRITIC', lane: 'l1' },
                { id: 'sinclair', label: 'Sinclair (Options)', type: 'agent', icon: 'OPT', subtext: 'GREEKS', lane: 'l1' },
                { id: 'cro', label: 'CRO Risk Gate', type: 'agent', icon: 'CRO', subtext: 'LIMITS', lane: 'l1' },
                { id: 'broker', label: 'Broker Gateway', type: 'sink', icon: 'OA', subtext: 'ZERODHA', lane: 'l1' }
            ],
            edges: [
                { from: 'ticks', to: 'alpha' },
                { from: 'alpha', to: 'popper' },
                { from: 'alpha', to: 'sinclair' },
                { from: 'popper', to: 'cro' },
                { from: 'sinclair', to: 'cro' },
                { from: 'cro', to: 'broker' }
            ],
            bento: [
                { title: 'Dr. Popper Auditor', badge: 'VERIFIED', status: 'good', icon: '🔬', metrics: { 'Lookahead': 'None', 'Overfit': 'Clean' } },
                { title: 'Sinclair Options', badge: 'HEDGED', status: 'good', icon: '📐', metrics: { 'Delta': '+0.04', 'Theta': '+₹4.2k' } },
                { title: 'CRO Risk Guard', badge: 'PASS', status: 'good', icon: '🛡️', metrics: { 'Margin': '28.5%', 'Cap': '35%' } }
            ],
            matrixTitle: '24-STRIKE IMPLIED VOLATILITY MATRIX',
            matrix: Array.from({ length: 24 }, (_, i) => ({
                label: `NIFTY ${22000 + i * 50}`,
                val: `${(12.4 + (i % 6) * 1.8).toFixed(1)}%`,
                level: i % 2 === 0 ? 'green' : 'amber'
            }))
        },

        media: {
            name: 'HOLYARRS MEDIA PIPELINE',
            brief: 'Unified movie and television acquisition pipeline bridging Telegram, HolyArrs API, Prowlarr indexers, Transmission, and Jellyfin.',
            payload: {
                media_suite: 'HolyArrs Unified (:6262)',
                download_client: 'Transmission (:9091)',
                library: 'Jellyfin (:8096)',
                ram_saved: '940 MiB'
            },
            nodes: [
                { id: 'm_tg', label: 'CinemaScout', type: 'input', icon: 'BOT', subtext: 'SEARCH', lane: 'l1' },
                { id: 'm_tmdb', label: 'TMDB Engine', type: 'worker', icon: 'META', subtext: 'TMDB API', lane: 'l1' },
                { id: 'm_holy', label: 'HolyArrs Suite', type: 'agent', icon: 'ARR', subtext: 'AUTH OK', lane: 'l1' },
                { id: 'm_prowl', label: 'Prowlarr Indexer', type: 'worker', icon: 'TORR', subtext: '12 SITES', lane: 'l1' },
                { id: 'm_trans', label: 'Transmission', type: 'worker', icon: 'DL', subtext: '42 MB/s', lane: 'l1' },
                { id: 'm_jelly', label: 'Jellyfin Scan', type: 'sink', icon: 'MEDIA', subtext: 'PLAYABLE', lane: 'l1' }
            ],
            edges: [
                { from: 'm_tg', to: 'm_tmdb' },
                { from: 'm_tmdb', to: 'm_holy' },
                { from: 'm_holy', to: 'm_prowl' },
                { from: 'm_prowl', to: 'm_trans' },
                { from: 'm_trans', to: 'm_jelly' }
            ],
            bento: [
                { title: 'HolyArrs Unified', badge: 'ACTIVE', status: 'good', icon: '🎬', metrics: { 'Movies': 'Consolidated', 'RAM': '3.9 GiB' } },
                { title: 'Transmission Engine', badge: 'DOWNLOADING', status: 'good', icon: '⚡', metrics: { 'Bandwidth': '42 MB/s', 'Active': '6' } },
                { title: 'Jellyfin Media', badge: 'SYNCED', status: 'good', icon: '📺', metrics: { 'Hardware Accel': 'VAAPI', 'Streams': '0' } }
            ],
            matrixTitle: 'TORRENT SEED & COMPLETION MATRIX',
            matrix: Array.from({ length: 24 }, (_, i) => ({
                label: `DL #${i + 1}`,
                val: `${Math.min(100, (i + 1) * 9)}%`,
                level: (i + 1) * 9 >= 100 ? 'green' : ((i + 1) * 9 > 50 ? 'cyan' : 'amber')
            }))
        },

        sre: {
            name: 'HOMELAB SRE SENTINEL',
            brief: 'Automated self-healing infrastructure sentinel polling /var/run/docker.sock with local Qwen 2.5 Coder diagnosis.',
            payload: {
                daemon: '/var/run/docker.sock',
                containers: '28 Total',
                unhealthy: '0',
                restarting: '0',
                host_gpu: 'Radeon 890M'
            },
            nodes: [
                { id: 's_sock', label: 'Docker Socket', type: 'input', icon: 'SOCK', subtext: 'DAEMON', lane: 'l1' },
                { id: 's_scan', label: 'Container Scan', type: 'worker', icon: 'SCAN', subtext: '15m PULSE', lane: 'l1' },
                { id: 's_filter', label: 'Anomaly Detector', type: 'worker', icon: 'FILT', subtext: 'HEALTH', lane: 'l1' },
                { id: 's_qwen', label: 'Qwen Coder SRE', type: 'agent', icon: 'QWEN', subtext: 'DIAGNOSE', lane: 'l1' },
                { id: 's_tg', label: 'Telegram Card', type: 'sink', icon: 'ALERT', subtext: 'INCIDENT', lane: 'l1' }
            ],
            edges: [
                { from: 's_sock', to: 's_scan' },
                { from: 's_scan', to: 's_filter' },
                { from: 's_filter', to: 's_qwen' },
                { from: 's_qwen', to: 's_tg' }
            ],
            bento: [
                { title: 'Docker Daemon', badge: 'HEALTHY', status: 'good', icon: '🐳', metrics: { 'Active': '28 UP', 'Restarting': '0' } },
                { title: 'Host Qwen 14B Coder', badge: 'READY', status: 'good', icon: '🧠', metrics: { 'VRAM': 'Available', 'Latency': '280ms' } },
                { title: 'Telegram Dispatcher', badge: 'ENABLED', status: 'good', icon: '📱', metrics: { 'Auto Heal': 'True', 'Cards': 'Active' } }
            ],
            matrixTitle: 'HOMELAB CONTAINER HEALTH MESH',
            matrix: [
                'n8n', 'open-webui', 'holyarrs', 'redpanda', 'transmission', 'jellyfin',
                'glances', 'uptime-kuma', 'navidrome', 'audiobookshelf', 'calibre', 'metube',
                'portainer', 'watchtower', 'openalgo', 'tts', 'horizon-api', 'horizon-strat',
                'telegram-bot', 'ai-dashboard', 'dockerproxy', 'bindery', 'prowlarr', 'flaresolverr'
            ].map(name => ({ label: name.toUpperCase().slice(0, 8), val: 'UP', level: 'green' }))
        },

        all: {
            name: 'ALL SYSTEMS (UNIFIED MESH)',
            brief: 'Unified multi-pipeline topology showing Telegram AI OS, Horizon Quant Council, HolyArrs Pipeline, and SRE Sentinel concurrently on one screen.',
            payload: {
                active_systems: 4,
                nodes_in_mesh: 23,
                mesh_status: 'SYNCHRONIZED',
                engine: 'Nexus Universal Plane'
            },
            nodes: [
                // Lane 1: Telegram Flow
                { id: 'tg_user', label: 'Telegram User', type: 'input', icon: 'TG', subtext: 'USER', lane: 'tg' },
                { id: 'tg_bot', label: 'CinemaScout Bot', type: 'worker', icon: 'BOT', subtext: 'POLL', lane: 'tg' },
                { id: 'intent_router', label: 'Qwen AI Router', type: 'agent', icon: 'AI', subtext: '14B', lane: 'tg' },
                { id: 'tts_synth', label: 'Neural Voice', type: 'worker', icon: 'TTS', subtext: 'GLOW', lane: 'tg' },
                { id: 'tg_dispatch', label: 'Telegram Card', type: 'sink', icon: 'OUT', subtext: 'DISPATCH', lane: 'tg' },

                // Lane 2: Horizon Quant Flow
                { id: 'ticks', label: 'Kafka Ticks', type: 'input', icon: 'TICK', subtext: '9092', lane: 'quant' },
                { id: 'alpha', label: 'Strategy Alpha', type: 'agent', icon: 'ORB', subtext: '15m ORB', lane: 'quant' },
                { id: 'popper', label: 'Dr. Popper', type: 'agent', icon: 'AUD', subtext: 'AUDIT', lane: 'quant' },
                { id: 'cro', label: 'CRO Gate', type: 'agent', icon: 'CRO', subtext: 'LIMITS', lane: 'quant' },
                { id: 'broker', label: 'Zerodha Gateway', type: 'sink', icon: 'OA', subtext: 'ROUTER', lane: 'quant' },

                // Lane 3: Media Stack
                { id: 'm_holy', label: 'HolyArrs Suite', type: 'agent', icon: 'ARR', subtext: ':6262', lane: 'media' },
                { id: 'm_prowl', label: 'Prowlarr Index', type: 'worker', icon: 'TORR', subtext: 'P2P', lane: 'media' },
                { id: 'm_trans', label: 'Transmission', type: 'worker', icon: 'DL', subtext: '42 MB/s', lane: 'media' },
                { id: 'm_jelly', label: 'Jellyfin Scan', type: 'sink', icon: 'MEDIA', subtext: ':8096', lane: 'media' },

                // Lane 4: SRE Sentinel
                { id: 's_sock', label: 'Docker Socket', type: 'input', icon: 'SOCK', subtext: 'DAEMON', lane: 'sre' },
                { id: 's_scan', label: 'Container Scan', type: 'worker', icon: 'SCAN', subtext: 'POLL', lane: 'sre' },
                { id: 's_qwen', label: 'Qwen Coder SRE', type: 'agent', icon: 'SRE', subtext: 'AI HEAL', lane: 'sre' }
            ],
            edges: [
                // Lane 1 Edges
                { from: 'tg_user', to: 'tg_bot' },
                { from: 'tg_bot', to: 'intent_router' },
                { from: 'intent_router', to: 'tts_synth' },
                { from: 'tts_synth', to: 'tg_dispatch' },

                // Cross-connections!
                { from: 'intent_router', to: 'm_holy', label: 'media_req', color: '#10b981' },
                { from: 'intent_router', to: 'alpha', label: 'quant_query', color: '#ff5500' },
                { from: 's_qwen', to: 'tg_dispatch', label: 'incident_alert', color: '#a855f7' },

                // Lane 2 Edges
                { from: 'ticks', to: 'alpha' },
                { from: 'alpha', to: 'popper' },
                { from: 'popper', to: 'cro' },
                { from: 'cro', to: 'broker' },

                // Lane 3 Edges
                { from: 'm_holy', to: 'm_prowl' },
                { from: 'm_prowl', to: 'm_trans' },
                { from: 'm_trans', to: 'm_jelly' },

                // Lane 4 Edges
                { from: 's_sock', to: 's_scan' },
                { from: 's_scan', to: 's_qwen' }
            ],
            bento: [
                { title: 'Telegram AI OS', badge: 'ACTIVE', status: 'good', icon: '💬', metrics: { 'Mode': 'Long-Polling', 'Response': '340ms' } },
                { title: 'Horizon Quant Desk', badge: 'HEDGED', status: 'good', icon: '📈', metrics: { 'PnL': '+₹14,250', 'Margin': '28.5%' } },
                { title: 'HolyArrs Media Suite', badge: 'CONSOLIDATED', status: 'good', icon: '🎬', metrics: { 'RAM Saved': '940 MiB', 'DL': '42 MB/s' } },
                { title: 'SRE Sentinel', badge: 'HEALTHY', status: 'good', icon: '🛡️', metrics: { 'Containers': '28 UP', 'Errors': '0' } }
            ],
            matrixTitle: 'CROSS-SYSTEM MESH TELEMETRY',
            matrix: Array.from({ length: 24 }, (_, i) => ({
                label: `SYS NODE #${i + 1}`,
                val: 'ONLINE',
                level: i % 4 === 0 ? 'cyan' : (i % 3 === 0 ? 'green' : (i % 2 === 0 ? 'amber' : 'purple'))
            }))
        }
    };

    // 3. Render Pipeline View
    function switchPipeline(flowKey) {
        currentFlow = flowKey;
        const cfg = FLOW_CATALOG[flowKey] || FLOW_CATALOG.all;

        // Update pills
        navPills.forEach(pill => {
            pill.classList.toggle('active', pill.dataset.flow === flowKey);
        });

        // Update Header & Directives
        activeFlowBadge.innerText = cfg.name;
        ingressBrief.innerText = cfg.brief;
        ingressPayload.innerText = JSON.stringify(cfg.payload, null, 2);

        // Update Graph
        graph.setTopology(cfg.nodes, cfg.edges);

        // Update Bento Cards
        renderBento(cfg.bento);

        // Update Matrix
        renderMatrix({ title: cfg.matrixTitle, cells: cfg.matrix });

        // Stream switch event to terminal
        appendLog({
            source: 'SYSTEM',
            message: `Focused on pipeline [${cfg.name}]. Loaded ${cfg.nodes.length} nodes and ${cfg.edges.length} directed filaments.`,
            level: 'FLOW'
        });
    }

    // 4. Render Bento Cards
    function renderBento(cards) {
        if (!cards) return;
        bentoContainer.innerHTML = '';
        cards.forEach(c => {
            const cardEl = document.createElement('div');
            cardEl.className = 'modern-bento-tile';

            let metricsHtml = '';
            if (c.metrics) {
                for (const [k, v] of Object.entries(c.metrics)) {
                    metricsHtml += `
                        <div class="bento-metric-pill">
                            <span>${k}</span>
                            <span>${v}</span>
                        </div>
                    `;
                }
            }

            cardEl.innerHTML = `
                <div class="bento-top-row">
                    <div class="bento-title-group">
                        <div class="bento-avatar">${c.icon || '⬡'}</div>
                        <span class="bento-name">${c.title}</span>
                    </div>
                    <span class="modern-badge ${c.status || 'good'}">${c.badge || 'UP'}</span>
                </div>
                <div class="bento-metrics-flow">${metricsHtml}</div>
            `;
            bentoContainer.appendChild(cardEl);
        });
        agentActiveCount.innerText = `${cards.length} ACTIVE`;
    }

    // 5. Render Matrix
    function renderMatrix(data) {
        if (!data || !data.cells) return;
        matrixTitle.innerText = data.title;
        matrixGrid.innerHTML = '';
        data.cells.forEach(c => {
            const tile = document.createElement('div');
            tile.className = `modern-matrix-tile ${c.level || 'green'}`;
            tile.innerHTML = `
                <span class="tile-key">${c.label}</span>
                <span class="tile-metric">${c.val}</span>
            `;
            matrixGrid.appendChild(tile);
        });
    }

    // 6. Append Log Line
    function appendLog(log) {
        const row = document.createElement('div');
        row.className = `log-row ${log.level ? log.level.toLowerCase() : 'info'}`;

        const ts = log.timestamp || new Date().toISOString().split('T')[1].slice(0, 12);
        const src = (log.source || 'SYS').toLowerCase();
        let badgeClass = 'system';
        if (src.includes('tg') || src.includes('tele')) badgeClass = 'telegram';
        else if (src.includes('horiz') || src.includes('quant') || src.includes('tick')) badgeClass = 'horizon';
        else if (src.includes('holy') || src.includes('media') || src.includes('trans')) badgeClass = 'media';
        else if (src.includes('sre') || src.includes('dock')) badgeClass = 'sre';

        row.innerHTML = `
            <span class="log-ts">[${ts}]</span>
            <span class="log-badge-src ${badgeClass}">${log.source || 'SYS'}</span>
            <span class="log-text">${log.message}</span>
        `;
        terminalStream.appendChild(row);
        terminalStream.scrollTop = terminalStream.scrollHeight;
    }

    document.getElementById('btn-clear-log')?.addEventListener('click', () => {
        terminalStream.innerHTML = '';
    });

    // 7. Navigation Pill Event Listeners
    navPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const flow = pill.dataset.flow;
            switchPipeline(flow);
        });
    });

    document.getElementById('btn-recenter')?.addEventListener('click', () => {
        graph.layoutNodes();
    });

    // 8. WebSocket Live Connection
    function connectWS() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        ws = new WebSocket(`${protocol}//${host}/ws/all`);

        ws.onopen = () => {
            wsStatus.innerText = 'CONNECTED';
            wsStatus.className = 'stat-value status-online';
        };

        ws.onmessage = (event) => {
            if (isReplayMode) return;
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'pulse') {
                    graph.emitPulse(msg.data.from || msg.data.from_node, msg.data.to || msg.data.to_node, msg.data.color || '#00f2fe', msg.data.duration_ms || 1200);
                } else if (msg.type === 'log') {
                    appendLog(msg.data);
                }
            } catch (e) {
                console.error(e);
            }
        };

        ws.onclose = () => {
            wsStatus.innerText = 'OFFLINE';
            wsStatus.className = 'stat-value text-rose';
            setTimeout(connectWS, 3000);
        };
    }

    // 9. Time-Travel Replay Controller
    btnModeLive.addEventListener('click', () => {
        isReplayMode = false;
        btnModeLive.classList.add('active');
        btnModeReplay.classList.remove('active');
        replayBar.classList.add('hidden');
        if (replayTimer) clearInterval(replayTimer);
        switchPipeline(currentFlow);
    });

    btnModeReplay.addEventListener('click', () => {
        isReplayMode = true;
        btnModeReplay.classList.add('active');
        btnModeLive.classList.remove('active');
        replayBar.classList.remove('hidden');
        loadAllReplaySessions();
    });

    async function loadAllReplaySessions() {
        try {
            const resp = await fetch('/api/v1/projects/horizon_quant/history');
            const sessions1 = await resp.json();
            const resp2 = await fetch('/api/v1/projects/media_stack/history');
            const sessions2 = await resp2.json();
            
            const allSessions = [...sessions1, ...sessions2];
            replaySessionSelect.innerHTML = '<option value="">Select past execution session...</option>';
            allSessions.forEach(s => {
                const opt = document.createElement('option');
                opt.value = `${s.project_id}:${s.id}`;
                opt.innerText = `${s.started_at.slice(0, 19).replace('T', ' ')} - [${s.project_id}] ${s.title}`;
                replaySessionSelect.appendChild(opt);
            });
        } catch (e) {
            console.error('Failed to load sessions:', e);
        }
    }

    replaySessionSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        if (!val) return;
        const [projId, sId] = val.split(':');
        try {
            const resp = await fetch(`/api/v1/projects/${projId}/sessions/${sId}/replay`);
            const data = await resp.json();
            replayEvents = data.events || [];
            replayIdx = 0;
            replaySlider.max = Math.max(0, replayEvents.length - 1);
            replaySlider.value = 0;
            replaySessionName.innerText = `Session: ${data.session.title}`;
            replayEventCounter.innerText = `0 / ${replayEvents.length} Events`;
            terminalStream.innerHTML = '';
            appendLog({ source: 'REPLAY', message: `Loaded session '${data.session.title}' (${replayEvents.length} events)`, level: 'FLOW' });
            
            // Switch to appropriate pipeline view
            if (projId.includes('horizon')) switchPipeline('horizon');
            else if (projId.includes('media')) switchPipeline('media');
        } catch (err) {
            console.error(err);
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
        playIcon.innerText = '⏸';
        playText.innerText = 'PAUSE';
        const interval = Math.max(100, 800 / replaySpeed);

        replayTimer = setInterval(() => {
            if (replayIdx >= replayEvents.length) {
                pauseReplay();
                return;
            }
            const ev = replayEvents[replayIdx];
            if (ev.type === 'pulse') {
                graph.emitPulse(ev.payload.from || ev.payload.from_node, ev.payload.to || ev.payload.to_node, ev.payload.color || '#00f2fe');
            } else if (ev.type === 'log') {
                appendLog(ev.payload);
            }
            replaySlider.value = replayIdx;
            replayEventCounter.innerText = `${replayIdx + 1} / ${replayEvents.length} Events`;
            replayIdx++;
        }, interval);
    }

    function pauseReplay() {
        isPlaying = false;
        playIcon.innerText = '▶';
        playText.innerText = 'PLAY';
        if (replayTimer) clearInterval(replayTimer);
    }

    replaySlider.addEventListener('input', (e) => {
        pauseReplay();
        replayIdx = parseInt(e.target.value, 10);
        replayEventCounter.innerText = `${replayIdx} / ${replayEvents.length} Events`;
    });

    document.querySelectorAll('.speed-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.speed-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            replaySpeed = parseFloat(btn.dataset.speed);
            if (isPlaying) {
                pauseReplay();
                playReplay();
            }
        });
    });

    // 10. Autonomous Pulse Simulator (Visual Heartbeat in Live Mode)
    setInterval(() => {
        if (isReplayMode) return;
        // Randomly pulse an active edge to maintain a breathing visual heartbeat
        const activeEdges = graph.edges;
        if (activeEdges.length > 0) {
            const edge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
            const colors = ['#00f2fe', '#ff5500', '#10b981', '#38bdf8', '#a855f7'];
            const randColor = colors[Math.floor(Math.random() * colors.length)];
            graph.emitPulse(edge.from || edge.from_node, edge.to || edge.to_node, randColor, 1000);
        }
    }, 2800);

    // Initial Launch
    switchPipeline('all');
    connectWS();
});
