// ==========================================
// DEFAULTS, QUOTES & STORAGE HELPERS
// ==========================================
const DEFAULT_SETTINGS = {
    focus: 25,
    short: 5,
    long: 15,
    sound: true,
    autoStart: false
};

const MOTIVATIONAL_QUOTES = [
    { text: "Small consistent steps build extraordinary outcomes.", author: "FocusFlow" },
    { text: "Calm focus is a superpower in a noisy world.", author: "FocusFlow" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "One focused session completed is better than ten planned.", author: "FocusFlow" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Protect your attention; it is your most valuable asset.", author: "FocusFlow" },
    { text: "Progress, not perfection, is what moves you forward.", author: "FocusFlow" },
    { text: "Rest when you need to, then return with quiet clarity.", author: "FocusFlow" }
];

function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function getLocalDateKey(dateObj) {
    const d = dateObj || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

let settings = Object.assign({}, DEFAULT_SETTINGS, loadJSON("ff_settings", {}));
let historyLog = loadJSON("ff_history", []);
if (!Array.isArray(historyLog)) historyLog = [];

// ==========================================
// THEME TOGGLE (LIGHT DEFAULT, SWITCHABLE TO DARK)
// ==========================================
const themeBtn = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("ff_theme_v2") || "light";

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeBtn) themeBtn.textContent = theme === "light" ? "☾" : "☀";
    localStorage.setItem("ff_theme_v2", theme);
    if (document.getElementById("focus-chart")) {
        drawAnalyticsChart();
    }
}

applyTheme(currentTheme);

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        currentTheme = currentTheme === "light" ? "dark" : "light";
        applyTheme(currentTheme);
    });
}

// ==========================================
// QUICK GUIDE MODAL (OPENS ON FIRST VISIT)
// ==========================================
const guideModal = document.getElementById("guide-modal");
if (guideModal) {
    const openGuideBtn = document.getElementById("btn-open-guide");
    const openGuideCardBtn = document.getElementById("btn-guide-card");
    const closeGuideBtn = document.getElementById("btn-close-guide");
    const closeGuideX = document.getElementById("btn-close-guide-x");

    function openGuide() {
        guideModal.classList.remove("hidden");
    }

    function closeGuide() {
        guideModal.classList.add("hidden");
        localStorage.setItem("ff_guide_seen", "true");
    }

    if (!localStorage.getItem("ff_guide_seen")) {
        openGuide();
    }

    if (openGuideBtn) openGuideBtn.addEventListener("click", openGuide);
    if (openGuideCardBtn) openGuideCardBtn.addEventListener("click", openGuide);
    if (closeGuideBtn) closeGuideBtn.addEventListener("click", closeGuide);
    if (closeGuideX) closeGuideX.addEventListener("click", closeGuide);

    guideModal.addEventListener("click", (e) => {
        if (e.target === guideModal) closeGuide();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !guideModal.classList.contains("hidden")) {
            closeGuide();
        }
    });
}

// ==========================================
// WEB AUDIO API (GENTLE HARMONIC CHIME)
// ==========================================
function playChime() {
    if (!settings.sound) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [440, 554.37, 659.25];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + idx * 0.18 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.65);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.18);
            osc.stop(ctx.currentTime + idx * 0.18 + 0.7);
        });
    } catch (e) {}
}

// ==========================================
// DESKTOP NOTIFICATION API
// ==========================================
function requestDesktopNotifications(callback) {
    if (typeof Notification === "undefined") {
        alert("Desktop notifications are not supported in this browser.");
        return;
    }
    Notification.requestPermission().then((perm) => {
        if (callback) callback(perm);
    });
}

function sendDesktopNotification(title, body) {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
            new Notification(title, { body: body });
        } catch (e) {}
    }
}

// ==========================================
// STREAK & TODAY HELPERS
// ==========================================
function calculateStreak() {
    const activeDates = new Set(historyLog.map((item) => item.date));
    let streak = 0;
    const cursor = new Date();

    if (!activeDates.has(getLocalDateKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (activeDates.has(getLocalDateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function getTodayStats() {
    const todayKey = getLocalDateKey();
    const todaySessions = historyLog.filter((item) => item.date === todayKey);
    const totalMins = todaySessions.reduce((sum, item) => sum + item.minutes, 0);
    return {
        minutes: totalMins,
        count: todaySessions.length,
        streak: calculateStreak()
    };
}

// ==========================================
// PAGE 1: FOCUS TIMER (index.html)
// ==========================================
const timerDisplay = document.getElementById("timer-display");

if (timerDisplay) {
    const ringEl = document.getElementById("ring-progress");
    const statusEl = document.getElementById("timer-status");
    const startPauseBtn = document.getElementById("btn-start-pause");
    const resetBtn = document.getElementById("btn-reset");
    const taskInput = document.getElementById("task-input");
    const modeButtons = document.querySelectorAll(".mode-btn");
    const labelPills = document.querySelectorAll(".label-pill");
    const quickNotifyBtn = document.getElementById("btn-quick-notify");
    const quoteBanner = document.getElementById("quote-banner");
    const quoteTextEl = document.getElementById("quote-text");
    const quoteAuthorEl = document.getElementById("quote-author");
    const dismissQuoteBtn = document.getElementById("btn-dismiss-quote");

    const CIRCUMFERENCE = 2 * Math.PI * 118;
    let tickInterval = null;

    function getModeSeconds(mode) {
        if (mode === "short") return settings.short * 60;
        if (mode === "long") return settings.long * 60;
        return settings.focus * 60;
    }

    let timerState = loadJSON("ff_timer_state", {
        mode: "focus",
        isRunning: false,
        endTime: null,
        remainingSeconds: getModeSeconds("focus"),
        label: "Study",
        task: ""
    });

    if (!timerState.label) timerState.label = "Study";

    function syncLabelPills() {
        labelPills.forEach((pill) => {
            pill.classList.toggle("active", pill.getAttribute("data-label") === timerState.label);
        });
    }

    labelPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            timerState.label = pill.getAttribute("data-label");
            saveJSON("ff_timer_state", timerState);
            syncLabelPills();
        });
    });

    if (taskInput) {
        taskInput.value = timerState.task || "";
        taskInput.addEventListener("input", () => {
            timerState.task = taskInput.value;
            saveJSON("ff_timer_state", timerState);
        });
    }

    function showRandomQuote() {
        if (!quoteBanner) return;
        const pick = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        quoteTextEl.textContent = `"${pick.text}"`;
        quoteAuthorEl.textContent = `— ${pick.author}`;
        quoteBanner.classList.remove("hidden");
    }

    if (dismissQuoteBtn) {
        dismissQuoteBtn.addEventListener("click", () => {
            quoteBanner.classList.add("hidden");
        });
    }

    function updateTodayWidgets() {
        const stats = getTodayStats();
        document.getElementById("today-minutes").textContent = stats.minutes;
        document.getElementById("today-sessions").textContent = stats.count;
        document.getElementById("today-streak").textContent = stats.streak + "d";

        const miniLog = document.getElementById("recent-mini-log");
        if (miniLog) {
            miniLog.innerHTML = "";
            if (historyLog.length === 0) {
                miniLog.innerHTML = `<p class="muted-text">No sessions saved yet.</p>`;
            } else {
                historyLog.slice(0, 3).forEach((item) => {
                    const row = document.createElement("div");
                    row.className = "log-item";
                    row.style.padding = "10px 12px";
                    row.innerHTML = `
                        <div class="log-main">
                            <div class="log-top-line">
                                <span class="label-chip">${escapeHTML(item.label || "General")}</span>
                                <span class="log-task">${escapeHTML(item.task)}</span>
                            </div>
                            <span class="log-meta">${escapeHTML(item.date)} • ${escapeHTML(item.time)}</span>
                        </div>
                        <span class="log-badge">+${item.minutes}m</span>
                    `;
                    miniLog.appendChild(row);
                });
            }
        }
    }

    function renderTimerUI() {
        const totalSecs = getModeSeconds(timerState.mode);
        const rem = Math.max(0, timerState.remainingSeconds);
        const mins = Math.floor(rem / 60);
        const secs = rem % 60;
        const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        timerDisplay.textContent = formatted;
        document.title = `${formatted} - FocusFlow`;

        const progress = totalSecs > 0 ? rem / totalSecs : 0;
        ringEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

        modeButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-mode") === timerState.mode);
        });

        startPauseBtn.textContent = timerState.isRunning ? "PAUSE" : "START";
        statusEl.textContent = timerState.isRunning
            ? (timerState.mode === "focus" ? `FOCUSING • ${timerState.label.toUpperCase()}` : "RESTING...")
            : "READY";
    }

    function completeSession() {
        clearInterval(tickInterval);
        tickInterval = null;
        timerState.isRunning = false;
        timerState.endTime = null;

        playChime();
        showRandomQuote();

        if (timerState.mode === "focus") {
            const entry = {
                id: Date.now(),
                date: getLocalDateKey(),
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                minutes: settings.focus,
                label: timerState.label || "General",
                task: (timerState.task || "").trim() || "Focused Session"
            };
            historyLog.unshift(entry);
            saveJSON("ff_history", historyLog);
            updateTodayWidgets();
            sendDesktopNotification("Focus Session Complete!", `${settings.focus} min logged under ${entry.label}.`);
            timerState.mode = "short";
        } else {
            sendDesktopNotification("Break Complete!", "Ready for your next calm focus session.");
            timerState.mode = "focus";
        }

        timerState.remainingSeconds = getModeSeconds(timerState.mode);
        saveJSON("ff_timer_state", timerState);
        renderTimerUI();

        if (settings.autoStart) {
            startTimer();
        }
    }

    function tick() {
        if (!timerState.isRunning || !timerState.endTime) return;
        const remaining = Math.ceil((timerState.endTime - Date.now()) / 1000);
        if (remaining <= 0) {
            timerState.remainingSeconds = 0;
            renderTimerUI();
            completeSession();
        } else if (remaining !== timerState.remainingSeconds) {
            timerState.remainingSeconds = remaining;
            renderTimerUI();
        }
    }

    function startTimer() {
        if (timerState.isRunning) return;
        timerState.isRunning = true;
        timerState.endTime = Date.now() + timerState.remainingSeconds * 1000;
        saveJSON("ff_timer_state", timerState);
        renderTimerUI();
        tickInterval = setInterval(tick, 250);
    }

    function pauseTimer() {
        clearInterval(tickInterval);
        tickInterval = null;
        if (timerState.isRunning && timerState.endTime) {
            timerState.remainingSeconds = Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
        }
        timerState.isRunning = false;
        timerState.endTime = null;
        saveJSON("ff_timer_state", timerState);
        renderTimerUI();
    }

    function switchMode(newMode) {
        pauseTimer();
        timerState.mode = newMode;
        timerState.remainingSeconds = getModeSeconds(newMode);
        saveJSON("ff_timer_state", timerState);
        renderTimerUI();
    }

    startPauseBtn.addEventListener("click", () => {
        if (timerState.isRunning) pauseTimer();
        else startTimer();
    });

    resetBtn.addEventListener("click", () => switchMode(timerState.mode));

    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => switchMode(btn.getAttribute("data-mode")));
    });

    if (quickNotifyBtn) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            quickNotifyBtn.textContent = "Desktop Alerts Enabled ✓";
        }
        quickNotifyBtn.addEventListener("click", () => {
            requestDesktopNotifications((perm) => {
                quickNotifyBtn.textContent = perm === "granted"
                    ? "Desktop Alerts Enabled ✓"
                    : "Permission Denied";
            });
        });
    }

    if (timerState.isRunning && timerState.endTime) {
        const left = Math.ceil((timerState.endTime - Date.now()) / 1000);
        if (left <= 0) {
            completeSession();
        } else {
            timerState.remainingSeconds = left;
            tickInterval = setInterval(tick, 250);
        }
    }

    syncLabelPills();
    updateTodayWidgets();
    renderTimerUI();
}

// ==========================================
// PAGE 2: TIME HISTORY (history.html)
// ==========================================
const fullHistoryList = document.getElementById("full-history-list");

if (fullHistoryList) {
    const searchInput = document.getElementById("history-search");
    const labelFilter = document.getElementById("history-label-filter");
    const countText = document.getElementById("history-count-text");
    const totalText = document.getElementById("history-total-text");
    const clearAllBtn = document.getElementById("btn-clear-history");

    function renderFullHistory() {
        const query = (searchInput.value || "").trim().toLowerCase();
        const selectedLabel = labelFilter.value;

        const filtered = historyLog.filter((item) => {
            const itemLabel = item.label || "General";
            const matchLabel = selectedLabel === "ALL" || itemLabel === selectedLabel;
            const matchQuery = !query ||
                (item.task || "").toLowerCase().includes(query) ||
                itemLabel.toLowerCase().includes(query);
            return matchLabel && matchQuery;
        });

        const totalMins = filtered.reduce((sum, item) => sum + item.minutes, 0);
        countText.textContent = `${filtered.length} session${filtered.length === 1 ? "" : "s"} shown`;
        totalText.textContent = `${totalMins} min total`;

        fullHistoryList.innerHTML = "";

        if (filtered.length === 0) {
            fullHistoryList.innerHTML = `<p class="muted-text" style="text-align:center; padding: 24px;">No matching time history found.</p>`;
            return;
        }

        filtered.forEach((item) => {
            const row = document.createElement("div");
            row.className = "log-item";
            row.innerHTML = `
                <div class="log-main">
                    <div class="log-top-line">
                        <span class="label-chip">${escapeHTML(item.label || "General")}</span>
                        <span class="log-task">${escapeHTML(item.task)}</span>
                    </div>
                    <span class="log-meta">${escapeHTML(item.date)} • Completed at ${escapeHTML(item.time)}</span>
                </div>
                <div class="log-right">
                    <span class="log-badge">+${item.minutes} min</span>
                    <button type="button" class="btn-danger-sm del-entry-btn">Delete</button>
                </div>
            `;

            row.querySelector(".del-entry-btn").addEventListener("click", () => {
                historyLog = historyLog.filter((entry) => entry.id !== item.id);
                saveJSON("ff_history", historyLog);
                renderFullHistory();
            });

            fullHistoryList.appendChild(row);
        });
    }

    searchInput.addEventListener("input", renderFullHistory);
    labelFilter.addEventListener("change", renderFullHistory);

    clearAllBtn.addEventListener("click", () => {
        if (historyLog.length > 0 && confirm("Delete all saved time history?")) {
            historyLog = [];
            saveJSON("ff_history", historyLog);
            renderFullHistory();
        }
    });

    renderFullHistory();
}

// ==========================================
// PAGE 3: ANALYTICS (analytics.html)
// ==========================================
function drawAnalyticsChart() {
    const canvas = document.getElementById("focus-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = getLocalDateKey(d);
        const label = d.toLocaleDateString(undefined, { weekday: "short" });
        const mins = historyLog
            .filter((item) => item.date === key)
            .reduce((sum, item) => sum + item.minutes, 0);
        days.push({ label, mins });
    }

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue("--muted").trim();
    const borderColor = styles.getPropertyValue("--border").trim();
    const accent = styles.getPropertyValue("--accent").trim();
    const accent2 = styles.getPropertyValue("--accent-2").trim();

    ctx.clearRect(0, 0, width, height);

    const padTop = 28;
    const padBottom = 34;
    const padX = 14;
    const chartH = height - padTop - padBottom;
    const chartW = width - padX * 2;
    const maxVal = Math.max(60, ...days.map((d) => d.mins));

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padTop + (chartH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(width - padX, y);
        ctx.stroke();
    }

    const slotW = chartW / days.length;
    const barW = Math.min(40, slotW * 0.55);

    days.forEach((day, idx) => {
        const x = padX + slotW * idx + (slotW - barW) / 2;
        const barH = (day.mins / maxVal) * chartH;
        const drawH = Math.max(4, barH);
        const drawY = padTop + chartH - drawH;

        const grad = ctx.createLinearGradient(0, drawY, 0, padTop + chartH);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, accent2);

        ctx.fillStyle = day.mins > 0 ? grad : borderColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, drawY, barW, drawH, [6, 6, 0, 0]);
        else ctx.rect(x, drawY, barW, drawH);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = "700 11px sans-serif";
        ctx.textAlign = "center";
        if (day.mins > 0) {
            ctx.fillText(day.mins + "m", x + barW / 2, drawY - 8);
        }
        ctx.fillText(day.label, x + barW / 2, height - 10);
    });
}

if (document.getElementById("focus-chart")) {
    const totalMins = historyLog.reduce((sum, item) => sum + item.minutes, 0);
    const streak = calculateStreak();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = getLocalDateKey(cutoff);
    const last7Mins = historyLog
        .filter((item) => item.date >= cutoffKey)
        .reduce((sum, item) => sum + item.minutes, 0);

    document.getElementById("metric-streak").textContent = `${streak} Days`;
    document.getElementById("metric-total-mins").textContent = `${totalMins} min`;
    document.getElementById("metric-sessions").textContent = historyLog.length;
    document.getElementById("metric-avg").textContent = `${Math.round(last7Mins / 7)} min`;

    const breakdownEl = document.getElementById("label-breakdown");
    const totalsByLabel = {};
    historyLog.forEach((item) => {
        const lbl = item.label || "General";
        totalsByLabel[lbl] = (totalsByLabel[lbl] || 0) + item.minutes;
    });

    const entries = Object.entries(totalsByLabel).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
        breakdownEl.innerHTML = `<p class="muted-text">Complete a session to see your label breakdown.</p>`;
    } else {
        entries.forEach(([lbl, mins]) => {
            const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
            const row = document.createElement("div");
            row.innerHTML = `
                <div class="breakdown-item-top">
                    <span>${escapeHTML(lbl)}</span>
                    <span>${mins} min (${pct}%)</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${pct}%;"></div>
                </div>
            `;
            breakdownEl.appendChild(row);
        });
    }

    window.addEventListener("resize", drawAnalyticsChart);
    drawAnalyticsChart();
}

// ==========================================
// PAGE 4: SETTINGS (settings.html)
// ==========================================
const settingsForm = document.getElementById("settings-form");

if (settingsForm) {
    const inpFocus = document.getElementById("set-focus");
    const inpShort = document.getElementById("set-short");
    const inpLong = document.getElementById("set-long");
    const inpSound = document.getElementById("set-sound");
    const inpAuto = document.getElementById("set-autostart");
    const feedback = document.getElementById("save-feedback");
    const notifyStatus = document.getElementById("notify-status");
    const notifyBtn = document.getElementById("btn-request-notify");

    inpFocus.value = settings.focus;
    inpShort.value = settings.short;
    inpLong.value = settings.long;
    inpSound.checked = settings.sound;
    inpAuto.checked = settings.autoStart;

    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        settings.focus = Math.max(1, parseInt(inpFocus.value, 10) || 25);
        settings.short = Math.max(1, parseInt(inpShort.value, 10) || 5);
        settings.long = Math.max(1, parseInt(inpLong.value, 10) || 15);
        settings.sound = inpSound.checked;
        settings.autoStart = inpAuto.checked;

        saveJSON("ff_settings", settings);

        const currentTimer = loadJSON("ff_timer_state", null);
        if (currentTimer && !currentTimer.isRunning) {
            const secs = currentTimer.mode === "short"
                ? settings.short * 60
                : currentTimer.mode === "long"
                    ? settings.long * 60
                    : settings.focus * 60;
            currentTimer.remainingSeconds = secs;
            saveJSON("ff_timer_state", currentTimer);
        }

        feedback.textContent = "Settings saved.";
        setTimeout(() => { feedback.textContent = ""; }, 2500);
    });

    document.getElementById("btn-test-sound").addEventListener("click", () => {
        const prev = settings.sound;
        settings.sound = true;
        playChime();
        settings.sound = prev;
    });

    function updateNotifyStatus() {
        if (typeof Notification === "undefined") {
            notifyStatus.textContent = "Status: Not supported in this browser.";
            notifyBtn.style.display = "none";
        } else if (Notification.permission === "granted") {
            notifyStatus.textContent = "Status: Desktop notifications are ENABLED.";
            notifyBtn.textContent = "Notifications Active ✓";
        } else if (Notification.permission === "denied") {
            notifyStatus.textContent = "Status: Blocked in browser site permissions.";
        } else {
            notifyStatus.textContent = "Status: Not enabled yet.";
        }
    }

    notifyBtn.addEventListener("click", () => {
        requestDesktopNotifications(updateNotifyStatus);
    });

    updateNotifyStatus();
}
