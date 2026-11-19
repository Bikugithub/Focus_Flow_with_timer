// ==========================================
// SUPABASE CLOUD CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://dsizxvpmmslojmrbfgkn.supabase.co";
const SUPABASE_KEY = "PASTE_YOUR_PUBLISHABLE_KEY_HERE";

const db = (window.supabase && SUPABASE_KEY !== "PASTE_YOUR_PUBLISHABLE_KEY_HERE")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// ==========================================
// DEFAULTS, QUOTES & STORAGE HELPERS
// ==========================================
const DEFAULT_SETTINGS = {
    focus: 25,
    short: 5,
    long: 15,
    sound: true,
    soundType: "chime",
    autoStart: false
};

const LIGHT_THEMES = ["sage-mist", "ocean-breeze", "lavender-cloud", "warm-peach", "rose-quartz"];
const DARK_THEMES = ["midnight-pine", "deep-ocean", "twilight-plum", "amber-dusk", "nordic-slate"];

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
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
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
let currentUser = null;

// ==========================================
// 10-THEME ENGINE + QUICK LIGHT/DARK TOGGLE
// ==========================================
const themeBtn = document.getElementById("theme-toggle");
const allThemes = LIGHT_THEMES.concat(DARK_THEMES);
let currentTheme = localStorage.getItem("ff_theme_v3") || "sage-mist";
if (!allThemes.includes(currentTheme)) currentTheme = "sage-mist";

function isDarkTheme(name) {
    return DARK_THEMES.includes(name);
}

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ff_theme_v3", theme);
    if (isDarkTheme(theme)) localStorage.setItem("ff_last_dark", theme);
    else localStorage.setItem("ff_last_light", theme);

    if (themeBtn) themeBtn.textContent = isDarkTheme(theme) ? "☀" : "☾";

    document.querySelectorAll(".theme-card").forEach((card) => {
        card.classList.toggle("active", card.getAttribute("data-theme-pick") === theme);
    });

    if (document.getElementById("focus-chart")) {
        drawAnalyticsChart();
    }
}

applyTheme(currentTheme);

if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        const next = isDarkTheme(currentTheme)
            ? (localStorage.getItem("ff_last_light") || "sage-mist")
            : (localStorage.getItem("ff_last_dark") || "midnight-pine");
        applyTheme(next);
    });
}

document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
        applyTheme(card.getAttribute("data-theme-pick"));
    });
});

// ==========================================
// GMAIL (GOOGLE) AUTHENTICATION
// ==========================================
async function initAuth() {
    if (!db) return;
    try {
        const { data } = await db.auth.getSession();
        currentUser = data && data.session ? data.session.user : null;
        updateAuthUI();

        db.auth.onAuthStateChange((_event, session) => {
            currentUser = session ? session.user : null;
            updateAuthUI();
        });
    } catch (e) {
        console.error("Auth init error:", e);
    }
}

function updateAuthUI() {
    const authStatus = document.getElementById("auth-status");
    const loginBtn = document.getElementById("btn-google-login");
    const logoutBtn = document.getElementById("btn-google-logout");
    if (!authStatus || !loginBtn || !logoutBtn) return;

    if (currentUser) {
        authStatus.textContent = `Signed in as ${currentUser.email}`;
        loginBtn.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
    } else {
        authStatus.textContent = "Sign in with Gmail to link your focus sessions to your personal account.";
        loginBtn.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
    }
}

const googleLoginBtn = document.getElementById("btn-google-login");
const googleLogoutBtn = document.getElementById("btn-google-logout");
const authFeedback = document.getElementById("auth-feedback");

if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
        if (!db) {
            if (authFeedback) authFeedback.textContent = "Add your Supabase Publishable Key in script.js first.";
            return;
        }
        const redirectUrl = window.location.href.split("#")[0].split("?")[0];
        const { error } = await db.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: redirectUrl }
        });
        if (error && authFeedback) authFeedback.textContent = error.message;
    });
}

if (googleLogoutBtn) {
    googleLogoutBtn.addEventListener("click", async () => {
        if (!db) return;
        await db.auth.signOut();
        currentUser = null;
        updateAuthUI();
        if (authFeedback) {
            authFeedback.textContent = "Signed out successfully.";
            setTimeout(() => { authFeedback.textContent = ""; }, 2500);
        }
    });
}

// ==========================================
// SUPABASE CLOUD SYNC & FEEDBACK HELPERS
// ==========================================
async function syncLogsFromCloud() {
    if (!db) return;
    try {
        let query = db.from("focus_logs").select("*").order("created_at", { ascending: false });
        if (currentUser) query = query.eq("user_id", currentUser.id);

        const { data, error } = await query;
        if (error) {
            console.error("Supabase fetch error:", error.message);
            return;
        }
        historyLog = data || [];
        saveJSON("ff_history", historyLog);
    } catch (e) {
        console.error("Network error fetching logs:", e);
    }
}

async function addLogToCloud(entry) {
    if (!db) return entry;
    try {
        const payload = {
            date: entry.date,
            time: entry.time,
            minutes: entry.minutes,
            label: entry.label,
            task: entry.task
        };
        if (currentUser) payload.user_id = currentUser.id;

        const { data, error } = await db.from("focus_logs").insert([payload]).select().single();
        if (error) {
            console.error("Supabase insert error:", error.message);
            return entry;
        }
        return data;
    } catch (e) {
        return entry;
    }
}

async function deleteLogFromCloud(id) {
    if (!db) return;
    try {
        await db.from("focus_logs").delete().eq("id", id);
    } catch (e) {}
}

async function clearAllLogsFromCloud() {
    if (!db) return;
    try {
        let query = db.from("focus_logs").delete().gt("id", 0);
        if (currentUser) query = query.eq("user_id", currentUser.id);
        await query;
    } catch (e) {}
}

async function submitFeedbackToCloud(rating, message, statusEl) {
    if (!message.trim()) return false;
    if (!db) {
        if (statusEl) statusEl.textContent = "Feedback saved locally (connect Supabase key to sync).";
        return true;
    }
    const { error } = await db.from("feedback").insert([{
        user_email: currentUser ? currentUser.email : "Anonymous",
        rating: rating,
        message: message.trim()
    }]);
    if (error) {
        if (statusEl) statusEl.textContent = "Could not send feedback: " + error.message;
        return false;
    }
    if (statusEl) statusEl.textContent = "Thank you! Your feedback was sent.";
    return true;
}

function bindFeedbackForm(formId, textareaId, statusId, groupName, onDone) {
    const formEl = document.getElementById(formId);
    if (!formEl) return;

    let selectedRating = 5;
    const group = document.querySelector(`[data-rating-group="${groupName}"]`);
    if (group) {
        group.querySelectorAll(".rate-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                selectedRating = parseInt(btn.getAttribute("data-val"), 10) || 5;
                group.querySelectorAll(".rate-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
            });
        });
    }

    formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const textarea = document.getElementById(textareaId);
        const statusEl = document.getElementById(statusId);
        const ok = await submitFeedbackToCloud(selectedRating, textarea.value, statusEl);
        if (ok) {
            textarea.value = "";
            setTimeout(() => {
                if (statusEl) statusEl.textContent = "";
                if (onDone) onDone();
            }, 1600);
        }
    });
}

const feedbackModal = document.getElementById("feedback-modal");
if (feedbackModal) {
    const openFbBtn = document.getElementById("btn-open-feedback");
    const closeFbX = document.getElementById("btn-close-fb-x");

    function closeFeedbackModal() { feedbackModal.classList.add("hidden"); }
    if (openFbBtn) openFbBtn.addEventListener("click", () => feedbackModal.classList.remove("hidden"));
    if (closeFbX) closeFbX.addEventListener("click", closeFeedbackModal);
    feedbackModal.addEventListener("click", (e) => { if (e.target === feedbackModal) closeFeedbackModal(); });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !feedbackModal.classList.contains("hidden")) closeFeedbackModal();
    });

    bindFeedbackForm("modal-feedback-form", "modal-fb-text", "modal-fb-status", "modal", closeFeedbackModal);
}

bindFeedbackForm("settings-feedback-form", "settings-fb-text", "settings-fb-status", "settings");

// ==========================================
// QUICK GUIDE MODAL (OPENS ON FIRST VISIT)
// ==========================================
const guideModal = document.getElementById("guide-modal");
if (guideModal) {
    const openGuideBtn = document.getElementById("btn-open-guide");
    const openGuideCardBtn = document.getElementById("btn-guide-card");
    const closeGuideBtn = document.getElementById("btn-close-guide");
    const closeGuideX = document.getElementById("btn-close-guide-x");

    function openGuide() { guideModal.classList.remove("hidden"); }
    function closeGuide() {
        guideModal.classList.add("hidden");
        localStorage.setItem("ff_guide_seen", "true");
    }

    if (!localStorage.getItem("ff_guide_seen")) openGuide();
    if (openGuideBtn) openGuideBtn.addEventListener("click", openGuide);
    if (openGuideCardBtn) openGuideCardBtn.addEventListener("click", openGuide);
    if (closeGuideBtn) closeGuideBtn.addEventListener("click", closeGuide);
    if (closeGuideX) closeGuideX.addEventListener("click", closeGuide);
    guideModal.addEventListener("click", (e) => { if (e.target === guideModal) closeGuide(); });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !guideModal.classList.contains("hidden")) closeGuide();
    });
}

// ==========================================
// WEB AUDIO API (6 CALMING COMPLETION SOUNDS)
// ==========================================
let sharedAudioCtx = null;

function getAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume();
    return sharedAudioCtx;
}

function playTone(ctx, freq, startOffset, duration, volume, type, endFreq) {
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.04, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
}

function playChime(previewType) {
    if (!previewType && !settings.sound) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const choice = previewType || settings.soundType || "chime";

        if (choice === "bowl") {
            // Tibetan Singing Bowl
            playTone(ctx, 220, 0, 2.6, 0.22, "sine");
            playTone(ctx, 222.5, 0, 2.6, 0.14, "sine");
            playTone(ctx, 440, 0.02, 1.8, 0.08, "sine");
            playTone(ctx, 659.25, 0.04, 1.2, 0.04, "sine");
        } else if (choice === "crystal") {
            // Crystal Wind Chimes
            [880, 1046.5, 1174.66, 1318.51, 1567.98].forEach((freq, i) => {
                playTone(ctx, freq, i * 0.11, 0.9, 0.1, "sine");
            });
        } else if (choice === "gong") {
            // Soft Zen Gong
            playTone(ctx, 130.81, 0, 2.8, 0.26, "sine");
            playTone(ctx, 196.0, 0.03, 2.4, 0.14, "triangle");
            playTone(ctx, 261.63, 0.06, 2.0, 0.08, "sine");
        } else if (choice === "harp") {
            // Morning Harp
            [261.63, 329.63, 392.0, 493.88, 523.25].forEach((freq, i) => {
                playTone(ctx, freq, i * 0.12, 1.1, 0.13, "triangle");
            });
        } else if (choice === "drops") {
            // Calm Water Drops
            playTone(ctx, 420, 0.0, 0.18, 0.18, "sine", 780);
            playTone(ctx, 520, 0.22, 0.18, 0.16, "sine", 940);
            playTone(ctx, 470, 0.44, 0.22, 0.18, "sine", 860);
        } else {
            // Harmonic Chime (Default)
            [440, 554.37, 659.25].forEach((freq, i) => {
                playTone(ctx, freq, i * 0.18, 0.7, 0.16, "sine");
            });
        }
    } catch (e) {}
}

// ==========================================
// DESKTOP NOTIFICATIONS & STREAKS
// ==========================================
function requestDesktopNotifications(callback) {
    if (typeof Notification === "undefined") {
        alert("Desktop notifications are not supported in this browser.");
        return;
    }
    Notification.requestPermission().then((perm) => { if (callback) callback(perm); });
}

function sendDesktopNotification(title, body) {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try { new Notification(title, { body: body }); } catch (e) {}
    }
}

function calculateStreak() {
    const activeDates = new Set(historyLog.map((item) => item.date));
    let streak = 0;
    const cursor = new Date();
    if (!activeDates.has(getLocalDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (activeDates.has(getLocalDateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

function getTodayStats() {
    const todayKey = getLocalDateKey();
    const todaySessions = historyLog.filter((item) => item.date === todayKey);
    return {
        minutes: todaySessions.reduce((sum, item) => sum + item.minutes, 0),
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

    if (dismissQuoteBtn) dismissQuoteBtn.addEventListener("click", () => quoteBanner.classList.add("hidden"));

    function updateTodayWidgets() {
        const stats = getTodayStats();
        document.getElementById("today-minutes").textContent = stats.minutes;
        document.getElementById("today-sessions").textContent = stats.count;
        document.getElementById("today-streak").textContent = stats.streak + "d";

        const miniLog = document.getElementById("recent-mini-log");
        if (miniLog) {
            miniLog.innerHTML = "";
            if (historyLog.length === 0) {
                miniLog.innerHTML = `<p class="m
