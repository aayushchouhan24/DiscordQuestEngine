    (async function () {
        if (window.jQuery) delete window.jQuery;
        const wpID = [[Symbol('QuestBypass')], {}, r => r];
        const wpReq = window.webpackChunkdiscord_app?.push(wpID);
        window.webpackChunkdiscord_app?.pop();

        const modules = wpReq?.c || {};

        const resolveModule = (filter) => {
            for (const m of Object.values(modules)) {
                if (m?.exports && filter(m.exports)) return m.exports;
            }
            return null;
        };

        const Discord = {
            Streaming: resolveModule(m => m?.A?.__proto__?.getStreamerActiveStreamMetadata)?.A,
            RunningGames: resolveModule(m => m?.Ay?.getRunningGames)?.Ay,
            Quests: resolveModule(m => m?.A?.__proto__?.getQuest)?.A,
            Channels: resolveModule(m => m?.A?.__proto__?.getAllThreadsForParent)?.A,
            GuildChannels: resolveModule(m => m?.Ay?.getSFWDefaultChannel)?.Ay,
            Dispatcher: resolveModule(m => m?.h?.__proto__?.flushWaitQueue)?.h,
            Net: resolveModule(m => m?.Bo?.get)?.Bo
        };

        if (!Discord.Quests || !Discord.Net) {
            console.log("%c[QuestEngine] Critical: Unable to hook Discord internals.", "color: red; font-weight: bold;");
            return;
        }

        const TaskTypes = {
            VIDEO: "WATCH_VIDEO",
            DESKTOP: "PLAY_ON_DESKTOP",
            STREAM: "STREAM_ON_DESKTOP",
            ACTIVITY: "PLAY_ACTIVITY",
            MOBILE: "WATCH_VIDEO_ON_MOBILE"
        };

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            #quest-panel::-webkit-scrollbar, #qe-quest-list::-webkit-scrollbar, #qe-log::-webkit-scrollbar { width: 4px !important; }
            #quest-panel::-webkit-scrollbar-track, #qe-quest-list::-webkit-scrollbar-track, #qe-log::-webkit-scrollbar-track { background: transparent !important; border: none !important; }
            #quest-panel::-webkit-scrollbar-thumb, #qe-quest-list::-webkit-scrollbar-thumb, #qe-log::-webkit-scrollbar-thumb { background: #2b2d31 !important; border-radius: 2px !important; min-height: 20px !important; }
            #quest-panel::-webkit-scrollbar-thumb:hover, #qe-quest-list::-webkit-scrollbar-thumb:hover, #qe-log::-webkit-scrollbar-thumb:hover { background: #393c41 !important; }
            #quest-panel, #qe-quest-list, #qe-log { scrollbar-width: thin !important; scrollbar-color: #2b2d31 transparent !important; }
            #qe-close { background: none; border: none; color: #b5bac1; cursor: pointer; font-size: 20px; line-height: 1; padding: 0 4px; border-radius: 4px; }
            #qe-close:hover { background: #2b2d31; }
            .qe-btn { padding: 8px 12px; border: none; border-radius: 4px; color: #fff; font-weight: 500; font-size: 13px; cursor: pointer; font-family: inherit; transition: background .15s; }
            .qe-btn-primary { background: #5865F2; }
            .qe-btn-primary:hover { background: #4752c4; }
            .qe-btn-success { background: #248046; }
            .qe-btn-success:hover { background: #1e6b3a; }
            .qe-btn-danger { background: #da373c; }
            .qe-btn-danger:hover { background: #a1282b; }
            .qe-btn-small { padding: 2px 8px; font-size: 11px; background: #2b2d31; color: #b5bac1; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; }
            .qe-btn-small:hover { background: #393c41; }
            #qe-minimize { background: none; border: none; color: #b5bac1; cursor: pointer; font-size: 18px; line-height: 1; padding: 0 4px; border-radius: 4px; }
            #qe-minimize:hover { background: #2b2d31; }
            #qe-dock {
                position: fixed;
                display: none;
                align-items: center;
                justify-content: center;
                width: 46px;
                height: 46px;
                border-radius: 16px;
                background: #5865F2;
                color: #fff;
                z-index: 100000;
                cursor: grab;
                box-shadow: 0 10px 28px rgba(0,0,0,.5);
                user-select: none;
                transition: transform .15s ease, box-shadow .15s ease;
            }
            #qe-dock:active { cursor: grabbing; }
            #qe-dock:hover { transform: scale(1.04); box-shadow: 0 12px 30px rgba(0,0,0,.58); }
            #qe-dock svg { width: 28px; height: 28px; display: block; }
            #quest-panel {
                backdrop-filter: blur(6px);
            }
            #qe-header {
                gap: 14px;
            }
            #qe-body { display: block; }
            #qe-quest-list { padding-right: 4px; }
            #qe-body > div { margin-bottom: 4px; }
            #qe-body > div:last-child { margin-bottom: 0; }
            #qe-body .qe-action-row { margin-top: 4px; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(styleSheet);

        let panelMinimized = false;
        let dragState = null;
        let panelPosition = { left: 20, top: 80 };
        let dockPosition = { left: 20, top: 80 };
        let dockDragged = false;
        const dragTargets = new Map();

        const panel = document.createElement('div');
        panel.id = 'quest-panel';
        panel.style.cssText = 'position: fixed; top: 80px; right: 20px; width: 388px; max-height: 82vh; overflow-y: auto; background: linear-gradient(180deg, rgba(30,31,34,.98), rgba(24,25,28,.98)); border: 1px solid #2b2d31; border-radius: 14px; z-index: 99999; font-family: "gg sans", "Segoe UI", system-ui, sans-serif; color: #dbdee1; box-shadow: 0 12px 36px rgba(0,0,0,.62); padding: 18px; display: flex; flex-direction: column; gap: 12px;';
        panel.innerHTML = `
            <div id="qe-header" style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2b2d31;padding-bottom:12px;margin-bottom:4px;cursor:grab;user-select:none">
                <span style="font-weight:700;font-size:16px;color:#5865F2;letter-spacing:0.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">QuestEngine</span>
                <div style="display:flex;align-items:center;gap:4px">
                    <button id="qe-minimize">—</button>
                    <button id="qe-close">✕</button>
                </div>
            </div>
            <div id="qe-body">
            <div style="display:flex;gap:6px;align-items:center;padding:4px 0 2px 0">
                <span style="font-size:13px;font-weight:600;color:#b5bac1;flex:1">Quests</span>
                <span id="qe-count" style="font-size:12px;color:#5865F2;font-weight:500">0 selected</span>
            </div>
            <div id="qe-quest-list" style="display:flex;flex-direction:column;gap:6px;max-height:320px;overflow-y:auto;padding:4px 0"></div>
            <div class="qe-action-row" style="display:flex;gap:6px;margin-top:4px;flex-wrap:wrap">
                <button class="qe-btn qe-btn-primary" id="qe-run-selected">▶ Run Selected</button>
                <button class="qe-btn qe-btn-success" id="qe-run-all">▶ Run All</button>
                <button class="qe-btn qe-btn-danger" id="qe-stop">■ Stop</button>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
                <span style="font-size:12px;font-weight:500;color:#b5bac1">Log</span>
                <button class="qe-btn-small" id="qe-clear-log" style="margin-left:auto">Clear</button>
            </div>
            <div id="qe-log" style="font-size:13px;background:#111214;border-radius:6px;padding:10px;max-height:160px;overflow-y:auto;font-family:monospace;border:1px solid #2b2d31;line-height:1.6"></div>
            </div>
        `;
        document.body.appendChild(panel);

        const dock = document.createElement('div');
        dock.id = 'qe-dock';
        dock.innerHTML = `
            <svg viewBox="0 0 118 95" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18.75 94.35C18.05 94.06 17.5 92.11 17.5 89.96V86.08L8.75 85.79L0 85.5V63V40.5L4.25 40.19L8.5 39.89V28.94V18H13H17.5V13.5V9H24.5H31.5V4.5V0H40.5H49.5V4.5V9H58.5H67.5V4.5V0H76.5H85.5V4.45V8.91L92.25 9.2L99 9.5L99.31 13.75L99.61 18H104.06H108.5V28.94V39.89L112.75 40.19L117 40.5L117.28 61C117.44 72.28 117.32 82.51 117.01 83.75C116.5 85.86 115.94 86 108.04 86H99.61L99.31 90.25L99 94.5L87.5 94.79C72.28 95.17 71.69 95 71.31 89.9L71 85.82L58 85.66L45 85.5L44.69 81.29L44.39 77.08L35.69 76.79L27 76.5V72V67.5H36H45L45.31 71.75L45.61 76H58.5H71.39L71.69 71.75L72 67.5H81H90V72V76.5L81.25 76.79L72.5 77.08V81.29V85.5L85.44 85.2L98.39 84.89L98.7 80.7C99 76.53 99.03 76.5 103.25 76.19L107.5 75.89L107.61 60.69C107.66 52.34 107.78 44.6 107.86 43.5C107.98 41.84 107.23 41.41 103.5 41L99 40.5L98.72 29.25L98.43 18H91.97H85.5V13.5V9H76.5H67.5V13.5V18H58.5H49.5V13.5V9H40.5H31.5V13.5V18H25.03H18.57L18.28 29.25L18 40.5L13.75 40.81L9.5 41.11V58.5V75.89L13.75 76.19C17.97 76.5 18 76.53 18.31 80.72L18.61 84.94L31.81 85.22L45 85.5V90V94.5L32.5 94.69C25.62 94.79 19.44 94.64 18.75 94.35ZM35.71 45.25L36 36.5L42.75 36.2L49.5 35.91V44.95V54H42.46H35.42L35.71 45.25ZM67.5 44.95V35.91L74.25 36.2L81 36.5L81.29 45.25L81.58 54H74.54H67.5V44.95Z" fill="currentColor"/>
            </svg>
        `;
        document.body.appendChild(dock);
        document.getElementById('qe-close').onclick = () => panel.remove();

        const header = document.getElementById('qe-header');
        const body = document.getElementById('qe-body');
        const minimizeBtn = document.getElementById('qe-minimize');
        dragTargets.set(panel, header);
        dragTargets.set(dock, dock);

        function setDragCursor(target, dragging) {
            const handle = dragTargets.get(target) || target;
            handle.style.cursor = dragging ? 'grabbing' : (target === dock ? 'grab' : 'grab');
            if (target !== handle) target.style.cursor = dragging ? 'grabbing' : '';
        }

        function setMinimized(nextState) {
            panelMinimized = nextState;
            if (panelMinimized) {
                const rect = panel.getBoundingClientRect();
                panelPosition = {
                    left: Math.max(0, rect.left),
                    top: Math.max(0, rect.top)
                };
                panel.style.display = 'none';
                dockPosition = { ...panelPosition };
                dock.style.left = `${dockPosition.left}px`;
                dock.style.top = `${dockPosition.top}px`;
                dock.style.right = 'auto';
                dock.style.bottom = 'auto';
                dock.style.display = 'flex';
                minimizeBtn.textContent = '+';
            } else {
                dock.style.display = 'none';
                panel.style.display = 'flex';
                panel.style.minHeight = '';
                panel.style.left = `${panelPosition.left ?? 20}px`;
                panel.style.top = `${panelPosition.top ?? 80}px`;
                panel.style.right = 'auto';
                minimizeBtn.textContent = '—';
            }
        }

        function beginDrag(target, e) {
            dragState = {
                target,
                startX: e.clientX,
                startY: e.clientY,
                startLeft: target.getBoundingClientRect().left,
                startTop: target.getBoundingClientRect().top
            };
            if (target === dock) dockDragged = false;
            target.style.right = 'auto';
            target.style.left = `${dragState.startLeft}px`;
            target.style.top = `${dragState.startTop}px`;
            setDragCursor(target, true);
            document.body.style.userSelect = 'none';
        }

        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            setMinimized(!panelMinimized);
        };

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            if (panelMinimized) return;
            beginDrag(panel, e);
        });

        panel.addEventListener('mousedown', (e) => {
            if (!panelMinimized) return;
            if (e.target.closest('button')) return;
            beginDrag(dock, e);
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragState) return;
            const nextLeft = Math.max(0, dragState.startLeft + (e.clientX - dragState.startX));
            const nextTop = Math.max(0, dragState.startTop + (e.clientY - dragState.startY));
            if (dragState.target === dock && (Math.abs(e.clientX - dragState.startX) > 3 || Math.abs(e.clientY - dragState.startY) > 3)) {
                dockDragged = true;
                dockPosition = { left: nextLeft, top: nextTop };
                panelPosition = { left: nextLeft, top: nextTop };
            }
            if (dragState.target === panel) panelPosition = { left: nextLeft, top: nextTop };
            dragState.target.style.left = `${nextLeft}px`;
            dragState.target.style.top = `${nextTop}px`;
        });

        document.addEventListener('mouseup', () => {
            if (dragState?.target) {
                setDragCursor(dragState.target, false);
            }
            dragState = null;
            document.body.style.userSelect = '';
        });

        dock.addEventListener('mousedown', (e) => {
            beginDrag(dock, e);
        });

        dock.addEventListener('click', () => {
            if (dockDragged) {
                dockDragged = false;
                return;
            }
            panelPosition = { ...dockPosition };
            setMinimized(false);
        });

        const questListDiv = document.getElementById('qe-quest-list');
        const logDiv = document.getElementById('qe-log');
        const countSpan = document.getElementById('qe-count');
        const selected = new Set();
        const liveProgress = new Map();
        const progressLogRows = new Map();
        const progressLogTimers = new Map();
        let logIndex = 0;
        const colors = {
            info: '#b5bac1',
            accent: '#5865F2',
            success: '#3ba55c',
            warn: '#faa81a',
            error: '#ed4245',
            dim: '#6d6f78'
        };

        function uiLog(msg, color = colors.info, emoji = '') {
            const el = document.createElement('div');
            el.style.cssText = `color:${color};padding:2px 0;border-bottom:1px solid #1a1b1e;display:flex;gap:4px;align-items:flex-start;animation:fadeIn .15s ease`;
            const idx = document.createElement('span');
            idx.style.cssText = `color:${colors.dim};font-size:11px;min-width:24px;text-align:right;flex-shrink:0;line-height:1.6`;
            idx.textContent = String(++logIndex).padStart(2, '0');
            const text = document.createElement('span');
            text.style.cssText = 'flex:1;word-break:break-word';
            text.textContent = emoji ? `${emoji} ${msg}` : msg;
            el.appendChild(idx);
            el.appendChild(text);
            logDiv.appendChild(el);
            while (logDiv.children.length > 80) logDiv.removeChild(logDiv.firstChild);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        function uiLogProgress(key, msg, color = colors.info, emoji = '') {
            const existing = progressLogRows.get(key);
            if (existing) {
                existing.row.style.color = color;
                existing.text.textContent = emoji ? `${emoji} ${msg}` : msg;
                existing.row.style.background = 'rgba(88, 101, 242, 0.12)';
                clearTimeout(progressLogTimers.get(key));
                progressLogTimers.set(key, setTimeout(() => {
                    existing.row.style.background = 'transparent';
                    progressLogTimers.delete(key);
                }, 250));
                return;
            }

            const row = document.createElement('div');
            row.style.cssText = `color:${color};padding:2px 0;border-bottom:1px solid #1a1b1e;display:flex;gap:4px;align-items:flex-start;animation:fadeIn .15s ease`;

            const idx = document.createElement('span');
            idx.style.cssText = `color:${colors.dim};font-size:11px;min-width:24px;text-align:right;flex-shrink:0;line-height:1.6`;
            idx.textContent = String(++logIndex).padStart(2, '0');

            const text = document.createElement('span');
            text.style.cssText = 'flex:1;word-break:break-word';
            text.textContent = emoji ? `${emoji} ${msg}` : msg;

            row.appendChild(idx);
            row.appendChild(text);
            logDiv.appendChild(row);
            progressLogRows.set(key, { row, text });
            row.style.transition = 'background-color .2s ease';
            row.style.background = 'rgba(88, 101, 242, 0.12)';
            clearTimeout(progressLogTimers.get(key));
            progressLogTimers.set(key, setTimeout(() => {
                row.style.background = 'transparent';
                progressLogTimers.delete(key);
            }, 250));
            while (logDiv.children.length > 80) logDiv.removeChild(logDiv.firstChild);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        document.getElementById('qe-clear-log').onclick = () => {
            logDiv.innerHTML = '';
            progressLogRows.clear();
            for (const timerId of progressLogTimers.values()) clearTimeout(timerId);
            progressLogTimers.clear();
            logIndex = 0;
            uiLog('Log cleared.', colors.dim);
        };

        const typeIcons = {
            WATCH_VIDEO: '🎬',
            PLAY_ON_DESKTOP: '🎮',
            STREAM_ON_DESKTOP: '📺',
            PLAY_ACTIVITY: '🎤',
            WATCH_VIDEO_ON_MOBILE: '📱'
        };

        function getTaskName(q) {
            const config = q?.config;
            const taskConf = config?.taskConfig || config?.taskConfigV2;
            const tasks = taskConf?.tasks || {};
            return Object.keys(tasks).find(k => Object.values(TaskTypes).includes(k)) || null;
        }

        function getGoal(q) {
            const config = q?.config;
            const taskConf = config?.taskConfig || config?.taskConfigV2;
            const tn = getTaskName(q);
            return taskConf?.tasks?.[tn]?.target || 900;
        }

        function getTaskLabel(tn) {
            const map = {
                WATCH_VIDEO: 'Watch Video',
                PLAY_ON_DESKTOP: 'Play on Desktop',
                STREAM_ON_DESKTOP: 'Stream on Desktop',
                PLAY_ACTIVITY: 'Voice Activity',
                WATCH_VIDEO_ON_MOBILE: 'Watch on Mobile'
            };
            return map[tn] || tn;
        }

        function getQuestEntries() {
            const store = Discord.Quests?.quests;
            if (!store) return [];
            if (typeof store.values === 'function') return [...store.values()];
            if (Array.isArray(store)) return store;
            if (typeof store === 'object') return Object.values(store);
            return [];
        }

        function getQuestEntryById(id) {
            return getQuestEntries().find(q => q?.id === id) || null;
        }

        function readQuestProgress(q, taskName) {
            if (!q || !taskName) return 0;
            const cached = liveProgress.get(q.id)?.[taskName] ?? 0;
            const storeQuest = getQuestEntryById(q.id) || q;
            const storeProgress = storeQuest?.userStatus?.progress?.[taskName]?.value ?? 0;
            const streamProgress = storeQuest?.userStatus?.streamProgressSeconds ?? 0;
            const sourceProgress = storeQuest?.config?.configVersion === 1 ? streamProgress : storeProgress;
            return Math.max(Number(sourceProgress) || 0, Number(cached) || 0);
        }

        function setLiveProgress(questId, taskName, value) {
            const questState = liveProgress.get(questId) || {};
            questState[taskName] = Math.max(Number(value) || 0, questState[taskName] || 0);
            liveProgress.set(questId, questState);
        }

        function isQuestActionable(q) {
            const status = q?.userStatus;
            const config = q?.config;
            const taskConf = config?.taskConfig || config?.taskConfigV2;
            const tasks = taskConf?.tasks;
            if (!status || !config || !tasks) return false;

            const isEnrolled = Boolean(status.enrolledAt) && !status.completedAt;
            const expiresAt = new Date(config.expiresAt).getTime();
            const validTime = Number.isFinite(expiresAt) ? expiresAt > Date.now() : true;
            const supported = Object.values(TaskTypes).some(t => Object.keys(tasks).includes(t));

            return isEnrolled && validTime && supported;
        }

        function isQuestVisible(q) {
            const status = q?.userStatus;
            const config = q?.config;
            const expiresAt = new Date(config?.expiresAt).getTime();
            const validTime = Number.isFinite(expiresAt) ? expiresAt > Date.now() : true;
            return validTime && !status?.completedAt;
        }

        function renderQuestList() {
            questListDiv.innerHTML = '';
            const quests = getQuestEntries().filter(isQuestVisible);

            if (quests.length === 0) {
                questListDiv.innerHTML = '<div style="color:#6d6f78;font-size:13px;text-align:center;padding:20px 12px">✨ No quests found yet</div>';
                countSpan.textContent = '0 quests';
                return;
            }

            const actionable = quests.filter(isQuestActionable);
            countSpan.textContent = selected.size > 0 ? `${selected.size}/${quests.length} selected` : `${quests.length} quests`;

            const header = document.createElement('div');
            header.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 4px 6px 4px;border-bottom:1px solid #2b2d31;margin-bottom:4px';
            const cbAll = document.createElement('div');
            const allChecked = actionable.length > 0 && selected.size === actionable.length;
            cbAll.style.cssText = `width:18px;height:18px;border-radius:4px;border:2px solid ${allChecked ? '#5865F2' : '#4e5058'};background:${allChecked ? '#5865F2' : 'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0`;
            cbAll.innerHTML = allChecked ? '<span style="color:#fff;font-size:12px">✓</span>' : '';
            cbAll.onclick = () => {
                if (allChecked) {
                    actionable.forEach(q => selected.delete(q.id));
                } else {
                    actionable.forEach(q => selected.add(q.id));
                }
                renderQuestList();
            };
            header.appendChild(cbAll);

            const lblAll = document.createElement('span');
            lblAll.style.cssText = 'font-size:13px;color:#b5bac1;cursor:pointer;user-select:none';
            lblAll.textContent = 'Select All';
            lblAll.onclick = () => cbAll.click();
            header.appendChild(lblAll);
            questListDiv.appendChild(header);

            quests.forEach(q => {
                const taskName = getTaskName(q);
                const goal = getGoal(q);
                const title = q?.config?.messages?.questName || q?.config?.application?.name || q?.id || 'Unknown Quest';
                const progress = taskName ? readQuestProgress(q, taskName) : 0;
                const taskLabel = getTaskLabel(taskName);
                const icon = typeIcons[taskName] || '❓';
                const pct = Math.min(100, Math.floor((progress / goal) * 100));
                const isChecked = selected.has(q.id);
                const actionableQuest = isQuestActionable(q);

                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 4px;border-radius:4px;cursor:pointer;transition:background .1s';
                row.onmouseenter = () => { row.style.background = '#2b2d31'; };
                row.onmouseleave = () => { row.style.background = 'transparent'; };

                const cb = document.createElement('div');
                cb.style.cssText = `width:18px;height:18px;border-radius:4px;border:2px solid ${isChecked ? '#5865F2' : '#4e5058'};background:${isChecked ? '#5865F2' : 'transparent'};cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;${actionableQuest ? '' : 'opacity:.35'}`;
                cb.innerHTML = isChecked ? '<span style="color:#fff;font-size:12px">✓</span>' : '';
                cb.onclick = (e) => {
                    e.stopPropagation();
                    if (!actionableQuest) return;
                    if (selected.has(q.id)) selected.delete(q.id);
                    else selected.add(q.id);
                    renderQuestList();
                };
                row.appendChild(cb);

                const info = document.createElement('div');
                info.style.cssText = 'flex:1;font-size:13px;line-height:1.4;min-width:0';

                const titleRow = document.createElement('div');
                titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:6px';
                const titleSpan = document.createElement('span');
                titleSpan.style.cssText = 'font-weight:500;color:#dbdee1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
                titleSpan.textContent = title;
                titleRow.appendChild(titleSpan);

                const badge = document.createElement('span');
                badge.style.cssText = 'font-size:11px;padding:1px 6px;border-radius:3px;background:#2b2d31;color:#b5bac1;white-space:nowrap;flex-shrink:0';
                badge.textContent = `${icon} ${pct}%${actionableQuest ? '' : ' • inactive'}`;
                titleRow.appendChild(badge);
                info.appendChild(titleRow);

                const typeRow = document.createElement('div');
                typeRow.style.cssText = 'display:flex;justify-content:space-between;font-size:12px;color:#6d6f78;margin-top:1px';
                const typeSpan = document.createElement('span');
                typeSpan.textContent = taskLabel;
                typeRow.appendChild(typeSpan);
                const timeSpan = document.createElement('span');
                timeSpan.textContent = `${Math.floor(progress)}s / ${goal}s`;
                typeRow.appendChild(timeSpan);
                info.appendChild(typeRow);

                const barOuter = document.createElement('div');
                barOuter.style.cssText = 'height:4px;background:#2b2d31;border-radius:2px;margin-top:4px;overflow:hidden';
                const barInner = document.createElement('div');
                barInner.style.cssText = `height:100%;width:${pct}%;background:${pct >= 100 ? '#3ba55c' : '#5865F2'};border-radius:2px;transition:width .3s ease`;
                barOuter.appendChild(barInner);
                info.appendChild(barOuter);

                row.appendChild(info);
                questListDiv.appendChild(row);
            });

            if (actionable.length === 0) {
                uiLog('Quests loaded, but none are currently actionable.', colors.warn, '⚠️');
            }
        }

        renderQuestList();

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        async function autoAcceptQuests() {
            const quests = getQuestEntries();
            let acceptedAny = false;
            for (const q of quests) {
                if (isQuestVisible(q) && !q.userStatus?.enrolledAt) {
                    const title = q.config?.messages?.questName || q.config?.application?.name || q.id;
                    try {
                        uiLog(`Auto-accepting quest: ${title}...`, colors.info, '⏳');
                        await Discord.Net.post({
                            url: `/quests/${q.id}/enroll`,
                            body: { location: 5 }
                        });
                        acceptedAny = true;
                        uiLog(`Accepted quest: ${title}`, colors.success, '✅');
                        renderQuestList();
                        await sleep(1500); // Prevent 429 Rate Limits
                    } catch (e) {
                        uiLog(`Failed to accept: ${title}`, colors.error, '❌');
                        console.error('[QuestEngine] Enroll Error:', e);
                        
                        if (e.status === 429 && e.body?.retry_after) {
                            const minutes = Math.ceil(e.body.retry_after / 60);
                            uiLog(`Discord Rate limit hit! Wait ~${minutes} mins for API.`, colors.warn, '⚠️');
                            break; // Abort the loop to respect rate limit
                        }
                        await sleep(1500); // Sleep even on error
                    }
                }
            }
            if (acceptedAny) {
                setTimeout(renderQuestList, 1500); // Wait for Discord's store to sync
            }
        }

        autoAcceptQuests().then(() => {
            renderQuestList();
            setTimeout(renderQuestList, 1500);
            uiLog('Panel ready. (Auto-accept checks complete)', colors.success, '⚡');
        });

        class QuestManager {
            constructor() {
                this.isDesktop = typeof DiscordNative !== "undefined";
                this.TaskTypes = TaskTypes;
                this.running = false;
                this.progressHandlers = new Set();
                this.progressTickers = new Set();
                this.pendingProgressResolves = new Set();
                this.activeGameSessions = new Map();
                this.activeStreamSessions = new Map();
                this.originalRunningGames = null;
                this.originalGetGameForPID = null;
                this.originalStreamGetter = null;
            }

            print(msg, ...args) {
                uiLog(msg, ...args);
                console.log(`%c[QuestEngine] ${msg}`, "color: #5865F2; font-weight: bold; background: #2f3136; padding: 2px 5px; border-radius: 4px;", ...args);
            }

            async ignite(questsToRun) {
                this.print("Initializing sequence...");
                this.running = true;
                progressLogRows.clear();
                for (const timerId of progressLogTimers.values()) clearTimeout(timerId);
                progressLogTimers.clear();

                const pending = (questsToRun || getQuestEntries()).filter(isQuestActionable);

                if (pending.length === 0) {
                    this.print("No actionable quests detected.");
                    return;
                }

                this.print(`Found ${pending.length} quests. Beginning operations.`);

                await Promise.allSettled(pending.map(quest => this.executeQuest(quest)));

                this.print("All tasks executed successfully.");
                this.running = false;
            }

            stop() {
                this.running = false;
                for (const handler of this.progressHandlers) {
                    Discord.Dispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                }
                this.progressHandlers.clear();
                for (const tickerId of this.progressTickers) clearInterval(tickerId);
                this.progressTickers.clear();
                for (const resolve of this.pendingProgressResolves) resolve();
                this.pendingProgressResolves.clear();
                this.activeGameSessions.clear();
                this.activeStreamSessions.clear();
                if (this.originalRunningGames) {
                    Discord.RunningGames.getRunningGames = this.originalRunningGames;
                    Discord.RunningGames.getGameForPID = this.originalGetGameForPID;
                    this.originalRunningGames = null;
                    this.originalGetGameForPID = null;
                }
                if (this.originalStreamGetter) {
                    Discord.Streaming.getStreamerActiveStreamMetadata = this.originalStreamGetter;
                    this.originalStreamGetter = null;
                }
                progressLogRows.clear();
                renderQuestList();
                this.print("Stop requested.");
            }

            ensureGameHooks() {
                if (this.originalRunningGames) return;
                this.originalRunningGames = Discord.RunningGames.getRunningGames;
                this.originalGetGameForPID = Discord.RunningGames.getGameForPID;
                Discord.RunningGames.getRunningGames = () => [...this.activeGameSessions.values()];
                Discord.RunningGames.getGameForPID = (pid) => {
                    for (const session of this.activeGameSessions.values()) {
                        if (session.pid === pid) return session;
                    }
                    return this.originalGetGameForPID?.call(Discord.RunningGames, pid) ?? null;
                };
            }

            ensureStreamHooks() {
                if (this.originalStreamGetter) return;
                this.originalStreamGetter = Discord.Streaming.getStreamerActiveStreamMetadata;
                Discord.Streaming.getStreamerActiveStreamMetadata = () => {
                    const activeStreams = [...this.activeStreamSessions.values()];
                    if (activeStreams.length > 0) {
                        return activeStreams[activeStreams.length - 1];
                    }
                    return this.originalStreamGetter?.call(Discord.Streaming) ?? null;
                };
            }

            syncGameState(added = [], removed = []) {
                const games = [...this.activeGameSessions.values()];
                Discord.Dispatcher.dispatch({
                    type: "RUNNING_GAMES_CHANGE",
                    removed,
                    added,
                    games
                });
            }

            async executeQuest(quest) {
                const config = quest.config;
                const taskConf = config.taskConfig || config.taskConfigV2;
                const taskName = Object.keys(taskConf.tasks).find(k => Object.values(this.TaskTypes).includes(k));
                const goal = taskConf.tasks[taskName].target;
                const title = config.messages.questName;

                const progress = quest.userStatus?.progress?.[taskName]?.value ?? 0;

                this.print(`Target: "${title}" | Mode: ${taskName}`);

                try {
                    switch (taskName) {
                        case this.TaskTypes.VIDEO:
                        case this.TaskTypes.MOBILE:
                            await this.simulateVideo(quest, progress, goal);
                            break;
                        case this.TaskTypes.DESKTOP:
                            await this.simulateGame(quest, config.application.id, config.application.name, goal, progress);
                            break;
                        case this.TaskTypes.STREAM:
                            await this.simulateStream(quest, config.application.id, config.application.name, goal, progress);
                            break;
                        case this.TaskTypes.ACTIVITY:
                            await this.simulateActivity(quest, goal);
                            break;
                    }
                } catch (err) {
                    this.print(`Error encountered: ${err.message}`);
                }
            }

            async withExclusiveQueue(work) {
                return work();
            }

            async simulateVideo(quest, current, max) {
                const start = new Date(quest.userStatus.enrolledAt).getTime();

                this.print("Simulating playback...");

                while (current < max) {
                    const realTimeElapsed = (Date.now() - start) / 1000;
                    const limit = realTimeElapsed + 10;

                    if (current >= limit) {
                        await this.delay(1);
                        continue;
                    }

                    const next = Math.min(max, current + 5 + Math.random() * 5);

                    await Discord.Net.post({
                        url: `/quests/${quest.id}/video-progress`,
                        body: { timestamp: next }
                    });

                    current = next;
                    setLiveProgress(quest.id, this.TaskTypes.VIDEO, current);
                    renderQuestList();

                    if (current >= max) break;

                    const percent = Math.floor((current / max) * 100);
                    this.print(`Progress: ${Math.floor(current)}/${max} (${percent}%)`);

                    await this.delay(0.7 + Math.random() * 0.4);
                }

                await Discord.Net.post({
                    url: `/quests/${quest.id}/video-progress`,
                    body: { timestamp: max }
                });
                setLiveProgress(quest.id, this.TaskTypes.VIDEO, max);
                renderQuestList();
                this.print("Video sequence finalized.");
            }

            async simulateGame(quest, appId, appName, max, current) {
                if (!this.isDesktop) {
                    this.print("Error: Desktop Client Environment Required.");
                    return;
                }

                return this.withExclusiveQueue(async () => {
                    const appReq = await Discord.Net.get({ url: `/applications/public?application_ids=${appId}` });
                    const appData = appReq.body[0];
                    const execName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[^a-zA-Z0-9]/g, "");

                    const pid = Math.floor(Math.random() * 20000) + 4000;

                    const virtProc = {
                        cmdLine: `C:\\Program Files\\${appName}\\${execName}`,
                        exeName: execName,
                        exePath: `c:/program files/${appName.toLowerCase()}/${execName}`,
                        hidden: false,
                        isLauncher: false,
                        id: appId,
                        name: appName,
                        pid: pid,
                        pidPath: [pid],
                        processName: appName,
                        start: Date.now()
                    };

                    this.ensureGameHooks();
                    this.activeGameSessions.set(quest.id, virtProc);
                    this.syncGameState([virtProc], []);

                    try {
                        this.print(`Emulating: ${appName}.`);
                        await this.trackProgress(quest, this.TaskTypes.DESKTOP, max);
                    } finally {
                        this.activeGameSessions.delete(quest.id);
                        this.syncGameState([], [virtProc]);
                        if (this.activeGameSessions.size === 0 && this.originalRunningGames) {
                            Discord.RunningGames.getRunningGames = this.originalRunningGames;
                            Discord.RunningGames.getGameForPID = this.originalGetGameForPID;
                            this.originalRunningGames = null;
                            this.originalGetGameForPID = null;
                        }
                    }
                });
            }

            async simulateStream(quest, appId, appName, max, current) {
                if (!this.isDesktop) {
                    this.print("Error: Stream tasks require Desktop Client.");
                    return;
                }

                return this.withExclusiveQueue(async () => {
                    this.ensureStreamHooks();
                    const virtStream = {
                        id: appId,
                        pid: Math.floor(Math.random() * 10000),
                        sourceName: null
                    };

                    this.activeStreamSessions.set(quest.id, virtStream);

                    try {
                        this.print(`Streaming: ${appName}. (Requires voice channel connection)`);
                        await this.trackProgress(quest, this.TaskTypes.STREAM, max);
                    } finally {
                        this.activeStreamSessions.delete(quest.id);
                        if (this.activeStreamSessions.size === 0 && this.originalStreamGetter) {
                            Discord.Streaming.getStreamerActiveStreamMetadata = this.originalStreamGetter;
                            this.originalStreamGetter = null;
                        }
                    }
                });
            }

            async simulateActivity(quest, max) {
                this.print("Attempting to connect to voice channel...");

                const privateCh = Discord.Channels.getSortedPrivateChannels()[0];
                let targetId = privateCh?.id;

                if (!targetId) {
                    const guilds = Object.values(Discord.GuildChannels.getAllGuilds());
                    const activeGuild = guilds.find(g => g.VOCAL.length > 0);
                    if (activeGuild) targetId = activeGuild.VOCAL[0].channel.id;
                }

                if (!targetId) {
                    this.print("Failed: No safe voice channel found.");
                    return;
                }

                const key = `call:${targetId}:1`;
                let current = 0;

                while (current < max) {
                    const percent = Math.floor((current / max) * 100);
                    this.print(`Heartbeat: ${Math.floor(current)}/${max} (${percent}%)`);

                    const res = await Discord.Net.post({
                        url: `/quests/${quest.id}/heartbeat`,
                        body: { stream_key: key, terminal: false }
                    });

                    current = res.body.progress.PLAY_ACTIVITY.value;
                    await this.delay(5);

                    if (current >= max) {
                        await Discord.Net.post({
                            url: `/quests/${quest.id}/heartbeat`,
                            body: { stream_key: key, terminal: true }
                        });
                        break;
                    }
                }
            }

            async trackProgress(quest, taskType, target) {
                return new Promise(resolve => {
                    this.pendingProgressResolves.add(resolve);
                    let lastPrinted = -1;
                    let livePulse = 0;
                    let finished = false;
                    let tickerId = null;
                    const cleanup = () => {
                        if (finished) return;
                        finished = true;
                        if (tickerId !== null) {
                            clearInterval(tickerId);
                            this.progressTickers.delete(tickerId);
                        }
                        Discord.Dispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                        this.progressHandlers.delete(handler);
                        this.pendingProgressResolves.delete(resolve);
                        resolve();
                    };
                    const emitProgress = (rawValue) => {
                        const cleanVal = Math.floor(rawValue || 0);
                        setLiveProgress(quest.id, taskType, cleanVal);
                        renderQuestList();
                        const percent = Math.floor((cleanVal / target) * 100);
                        if (cleanVal !== lastPrinted) {
                            lastPrinted = cleanVal;
                            this.print(`Progress: ${cleanVal}/${target} (${percent}%)`);
                        }
                        const pulse = ['◐', '◓', '◑', '◒'][livePulse++ % 4];
                        const liveText = cleanVal >= target ? '' : ` • ${pulse} live`;
                        uiLogProgress(`progress:${quest.id}:${taskType}`, `Progress: ${cleanVal}/${target} (${percent}%)${liveText}`, colors.info, '⚡');
                        return cleanVal;
                    };

                    const handler = (data) => {
                        if (!this.running) return cleanup();
                        const isV1 = quest.config.configVersion === 1;
                        const val = isV1 ? data.userStatus.streamProgressSeconds : data.userStatus.progress[taskType]?.value;
                        const cleanVal = emitProgress(val);

                        if (cleanVal >= target) {
                            cleanup();
                        }
                    };

                    tickerId = setInterval(() => {
                        if (!this.running) return cleanup();
                        const currentQuest = getQuestEntryById(quest.id) || quest;
                        const isV1 = currentQuest?.config?.configVersion === 1;
                        const currentValue = isV1
                            ? currentQuest?.userStatus?.streamProgressSeconds
                            : currentQuest?.userStatus?.progress?.[taskType]?.value;
                        emitProgress(currentValue);
                        if (Math.floor(currentValue || 0) >= target) cleanup();
                    }, 5000);
                    this.progressTickers.add(tickerId);

                    this.progressHandlers.add(handler);
                    Discord.Dispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                });
            }

            delay(s) {
                return new Promise(r => setTimeout(r, s * 1000));
            }
        }

        const Engine = new QuestManager();

        document.getElementById('qe-run-selected').onclick = async () => {
            const toRun = getQuestEntries().filter(q => selected.has(q.id) && isQuestVisible(q) && isQuestActionable(q));
            if (toRun.length === 0) {
                uiLog('No quests selected.', colors.warn, '⚠️');
                return;
            }
            await Engine.ignite(toRun);
        };

        document.getElementById('qe-run-all').onclick = async () => {
            const pending = getQuestEntries().filter(q => isQuestVisible(q) && isQuestActionable(q));

            if (pending.length === 0) {
                uiLog('No quests available.', colors.warn, '⚠️');
                return;
            }

            selected.clear();
            pending.forEach(q => selected.add(q.id));
            renderQuestList();
            await Engine.ignite(pending);
        };

        document.getElementById('qe-stop').onclick = () => {
            Engine.stop();
        };

    })();
