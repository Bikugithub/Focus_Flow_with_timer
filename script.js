// ==========================================
// SUPABASE CLOUD CONFIGURATION
// ==========================================
const SUPABASE_URL = "https://dsizxvpmmslojmrbfgkn.supabase.co";
const SUPABASE_KEY = "PASTE_YOUR_PUBLISHABLE_KEY_HERE";

const db = (window.supabase && SUPABASE_KEY !== "PASTE_YOUR_PUBLISHABLE_KEY_HERE")
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// ==========================================
// DEFAULTS, THEMES, QUOTES & STORAGE HELPERS
// ==========================================
const DEFAULT_SETTINGS = {
    focus: 25,
    short: 5,
    long: 15,
    sound: true,
    soundType: "chime",
    autoStart: false
};

const THEME_PALETTE = [
    { id: "sage-mist",      name: "Sage Mist",      gradient: "linear-gradient(135deg, #d7f2e8, #4c8f78)" },
    { id: "midnight-pine",  name: "Midnight Pine",  gradient: "linear-gradient(135deg, #162923, #72bda5)" },
    { id: "ocean-breeze",   name: "Ocean Breeze",   gradient: "linear-gradient(135deg, #d6eefc, #3b82b6)" },
    { id: "deep-ocean",     name: "Deep Ocean",     gradient: "linear-gradient(135deg, #102136, #5eb8e6)" },
    { id: "lavender-cloud", name: "Lavender Cloud", gradient: "linear-gradient(135deg, #eae2fc, #7c67c4)" },
    { id: "twilight-plum",  name: "Twilight Plum",  gradient: "linear-gradient(135deg, #1f172e, #a58be8)" },
    { id: "warm-peach",     name: "Warm Peach",     gradient: "linear-gradient(135deg, #fce7d6, #c97b4b)" },
    { id: "amber-dusk",     name: "Amber Dusk",     gradient: "linear-gradient(135deg, #291e16, #dfa066)" },
    { id: "rose-quartz",    name: "Rose Quartz",    gradient: "linear-gradient(135deg, #fae0e8, #bd6582)" },
    { id: "nordic-slate",   name: "Nordic Slate",   gradient: "linear-gradient(135deg, #161d26, #7ea8c7)" }
];

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
// 10-THEME FLOATING PALETTE POPOVER ENGINE
// ==========================================
const themeBtn = document.getElementById("theme-toggle");
const allThemeIds = THEME_PALETTE.map((t) => t.id);
let currentTheme = localStorage.getItem("ff_theme_v3") || "sage-mist";
if (!allThemeIds.includes(currentTheme)) currentTheme = "sage-mist";

function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ff_theme_v3", theme);

    document.querySelectorAll("[data-theme-pick]").forEach((el) => {
        el.classList.toggle("active", el.getAttribute("data-theme-pick") === theme);
    });

    if (document.getElementById("focus-chart")) {
        drawAnalyticsChart();
    }
}

function setupThemePalettePopover() {
    if (!themeBtn) return;

    // Replace sun/moon text with a clean palette SVG icon
    themeBtn.title = "Choose Theme";
    themeBtn.setAttribute("aria-label", "Choose Theme");
    themeBtn.setAttribute("aria-expanded", "false");
    themeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="13.5" cy="6.5" r=".8" fill="currentColor"></circle>
            <circle cx="17.5" cy="10.5" r=".8" fill="currentColor"></circle>
            <circle cx="8.5" cy="7.5" r=".8" fill="currentColor"></circle>
            <circle cx="6.5" cy="12.5" r=".8" fill="currentColor"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
        </svg>
    `;

    const popover = document.createElement("div");
    popover.id = "theme-popover";
    popover.className = "theme-popover hidden";
    popover.setAttribute("role", "menu");
    popover.innerHTML = `
        <div class="theme-popover-title">Themes</div>
        <div class="theme-popover-grid">
            ${THEME_PALETTE.map((t) => `
                <button type="button" class="theme-circle-btn ${t.id === currentTheme ? "active" : ""}" data-theme-pick="${t.id}">
                    <span class="theme-circle-dot" style="background: ${t.gradient};"></span>
                    <span class="theme-circle-name">${t.name}</span>
                </button>
            `).join("")}
        </div>
    `;

    const container = themeBtn.parentElement || document.body;
    container.appendChild(popover);

    function positionPopover() {
        const btnRect = themeBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const popW = 236;
        const margin = 12;

        let desiredLeft = btnRect.left - containerRect.left;
        const screenLeft = containerRect.left + desiredLeft;

        // Keep popover cleanly inside viewport on both mobile and desktop
        if (screenLeft + popW > window.innerWidth - margin) {
            desiredLeft = (window.innerWidth - margin - popW) - containerRect.left;
        }
        if (containerRect.left + desiredLeft < margin) {
            desiredLeft = margin - containerRect.left;
        }
        popover.style.left = `${Math.round(desiredLeft)}px`;
    }

    function openPopover() {
        positionPopover();
        popover.classList.remove("hidden");
        themeBtn.classList.add("active");
        themeBtn.setAttribute("aria-expanded", "true");
    }

    function closePopover() {
        popover.classList.add("hidden");
        themeBtn.classList.remove("active");
        themeBtn.setAttribute("aria-expanded", "false");
    }

    themeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (popover.classList.contains("hidden")) openPopover();
        else closePopover();
    });

    popover.querySelectorAll("[data-theme-pick]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            applyTheme(btn.getAttribute("data-theme-pick"));
            closePopover();
        });
    });

    document.addEventListener("click", (e) => {
        if (!popover.classList.contains("hidden") && !popover.contains(e.target) && e.target !== themeBtn) {
            closePopover();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !popover.classList.contains("hidden")) {
            closePopover();
        }
    });

    window.addEventListener("resize", () => {
        if (!popover.classList.contains("hidden")) positionPopover();
    });
}

setupThemePalettePopover();
applyTheme(currentTheme);

// Bind any Settings-page theme cards too
document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", () => {
        applyTheme(card.getAttribute("data-theme-pick"));
    });
});

// ==========================================
// EMAIL & PASSWORD AUTHENTICATION
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
    const authForm = document.getElementById("auth-form");
    const logoutBtn = document.getElementById("btn-auth-logout");
    if (!authStatus || !authForm || !logoutBtn) return;

    if (currentUser) {
        authStatus.textContent = `Signed in as ${currentUser.email}`;
        authForm.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
    } else {
        authStatus.textContent = "Log in or create an account to sync your focus sessions to your personal profile.";
        authForm.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
    }
}

const authReady = initAuth();

const authForm = document.getElementById("auth-form");
const authEmailInp = document.getElementById("auth-email");
const authPassInp = document.getElementById("auth-password");
const loginBtn = document.getElementById("btn-email-login");
const signupBtn = document.getElementById("btn-email-signup");
const logoutBtn = document.getElementById("btn-auth-logout");
const authFeedback = document.getElementById("auth-feedback");

function setAuthMessage(msg) {
    if (authFeedback) authFeedback.textContent = msg;
}

if (authForm) {
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!db) {
            setAuthMessage("Add your Supabase Publishable Key in script.js first.");
            return;
        }
        const email = authEmailInp.value.trim();
        const password = authPassInp.value;

        loginBtn.disabled = true;
        signupBtn.disabled = true;
        setAuthMessage("Logging in...");

        try {
            const { error } = await db.auth.signInWithPassword({ email, password });
            if (error) {
                setAuthMessage(error.message);
            } else {
                authPassInp.value = "";
                setAuthMessage("Logged in successfully!");
                setTimeout(() => setAuthMessage(""), 2500);
            }
        } finally {
            loginBtn.disabled = false;
            signupBtn.disabled = false;
        }
    });

    signupBtn.addEventListener("click", async () => {
        if (!db) {
            setAuthMessage("Add your Supabase Publishable Key in script.js first.");
            return;
        }
        const email = authEmailInp.value.trim();
        const password = authPassInp.value;

        if (!email || !email.includes("@")) {
            setAuthMessage("Please enter a valid email address.");
            return;
        }
        if (password.length < 6) {
            setAuthMessage("Password must be at least 6 characters.");
            return;
        }

        loginBtn.disabled = true;
        signupBtn.disabled = true;
        setAuthMessage("Creating account...");

        try {
            const { data, error } = await db.auth.signUp({ email, password });
            if (error) {
                setAuthMessage(error.message);
            } else if (data && data.session) {
                authPassInp.value = "";
                setAuthMessage("Account created and signed in!");
                setTimeout(() => setAuthMessage(""), 2500);
            } else {
                authPassInp.value = "";
                setAuthMessage("Account created! Check your inbox to confirm, then log in.");
            }
        } finally {
            loginBtn.disabled = false;
            signupBtn.disabled = false;
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        if (!db) return;
        await db.auth.signOut();
        currentUser = null;
        historyLog = [];
        saveJSON("ff_history", historyLog);
        updateAuthUI();
        setAuthMessage("Signed out successfully.");
        setTimeout(() => setAuthMessage(""), 2500);
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
            playTone(ctx, 220, 0, 2.6, 0.22, "sine");
            playTone(ctx, 222.5, 0, 2.6, 0.14, "sine");
            playTone(ctx, 440, 0.02, 1.8, 0.08, "sine");
            playTone(ctx, 659.25, 0.04, 1.2, 0.04, "sine");
        } else if (choice === "crystal") {
            [880, 1046.5, 1174.66, 1318.51, 1567.98].forEach((freq, i) => {
                playTone(ctx, freq, i * 0.11, 0.9, 0.1, "sine");
            });
        } else if (choice === "gong") {
            playTone(ctx, 130.81, 0, 2.8, 0.26, "sine");
            playTone(ctx, 196.0, 0.03, 2.4, 0.14, "triangle");
            playTone(ctx, 261.63, 0.06, 2.0, 0.08, "sine");
        } else if (choice === "harp") {
            [261.63, 329.63, 392.0, 493.88, 523.25].forEach((freq, i) => {
                playTone(ctx, freq, i * 0.12, 1.1, 0.13, "triangle");
            });
        } else if (choice === "drops") {
            playTone(ctx, 420, 0.0, 0.18, 0.18, "sine", 780);
            playTone(ctx, 520, 0.22, 0.18, 0.16, "sine", 940);
            playTone(ctx, 470, 0.44, 0.22, 0.18, "sine", 860);
        } else {
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
        const formatted = `${String(Math.floor(rem / 60)).padStart(2, "0")}:${String(rem % 60).padStart(2, "0")}`;

        timerDisplay.textContent = formatted;
        document.title = `${formatted} - FocusFlow`;
        ringEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - (totalSecs > 0 ? rem / totalSecs : 0));

        modeButtons.forEach((btn) => btn.classList.toggle("active", btn.getAttribute("data-mode") === timerState.mode));
        startPauseBtn.textContent = timerState.isRunning ? "PAUSE" : "START";
        statusEl.textContent = timerState.isRunning
            ? (timerState.mode === "focus" ? `FOCUSING • ${timerState.label.toUpperCase()}` : "RESTING...")
            : "READY";
    }

    async function completeSession() {
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
            const savedEntry = await addLogToCloud(entry);
            historyLog.unshift(savedEntry);
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
        if (settings.autoStart) startTimer();
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
        getAudioContext();
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

    startPauseBtn.addEventListener("click", () => (timerState.isRunning ? pauseTimer() : startTimer()));
    resetBtn.addEventListener("click", () => switchMode(timerState.mode));
    modeButtons.forEach((btn) => btn.addEventListener("click", () => switchMode(btn.getAttribute("data-mode"))));

    if (quickNotifyBtn) {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            quickNotifyBtn.textContent = "Desktop Alerts Enabled ✓";
        }
        quickNotifyBtn.addEventListener("click", () => {
            requestDesktopNotifications((perm) => {
                quickNotifyBtn.textContent = perm === "granted" ? "Desktop Alerts Enabled ✓" : "Permission Denied";
            });
        });
    }

    syncLabelPills();
    updateTodayWidgets();
    renderTimerUI();

    authReady.then(() => {
        if (timerState.isRunning && timerState.endTime) {
            const left = Math.ceil((timerState.endTime - Date.now()) / 1000);
            if (left <= 0) {
                completeSession().then(() => syncLogsFromCloud().then(updateTodayWidgets));
            } else {
                timerState.remainingSeconds = left;
                renderTimerUI();
                tickInterval = setInterval(tick, 250);
                syncLogsFromCloud().then(updateTodayWidgets);
            }
        } else {
            syncLogsFromCloud().then(updateTodayWidgets);
        }
    });
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
            const matchQuery = !query || (item.task || "").toLowerCase().includes(query) || itemLabel.toLowerCase().includes(query);
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
            row.querySelector(".del-entry-btn").addEventListener("click", async () => {
                await deleteLogFromCloud(item.id);
                historyLog = historyLog.filter((entry) => entry.id !== item.id);
                saveJSON("ff_history", historyLog);
                renderFullHistory();
            });
            fullHistoryList.appendChild(row);
        });
    }

    searchInput.addEventListener("input", renderFullHistory);
    labelFilter.addEventListener("change", renderFullHistory);
    clearAllBtn.addEventListener("click", async () => {
        if (historyLog.length > 0 && confirm("Delete all saved time history?")) {
            await clearAllLogsFromCloud();
            historyLog = [];
            saveJSON("ff_history", historyLog);
            renderFullHistory();
        }
    });

    renderFullHistory();
    authReady.then(() => syncLogsFromCloud().then(renderFullHistory));
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
        const mins = historyLog.filter((item) => item.date === key).reduce((sum, item) => sum + item.minutes, 0);
        days.push({ label, mins });
    }

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue("--muted").trim();
    const borderColor = styles.getPropertyValue("--border").trim();
    const accent = styles.getPropertyValue("--accent").trim();
    const accent2 = styles.getPropertyValue("--accent-2").trim();

    ctx.clearRect(0, 0, width, height);

    const padTop = 28, padBottom = 34, padX = 14;
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
        if (day.mins > 0) ctx.fillText(day.mins + "m", x + barW / 2, drawY - 8);
        ctx.fillText(day.label, x + barW / 2, height - 10);
    });
}

if (document.getElementById("focus-chart")) {
    function renderAnalytics() {
        const totalMins = historyLog.reduce((sum, item) => sum + item.minutes, 0);
        const streak = calculateStreak();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 6);
        const cutoffKey = getLocalDateKey(cutoff);
        const last7Mins = historyLog.filter((item) => item.date >= cutoffKey).reduce((sum, item) => sum + item.minutes, 0);

        document.getElementById("metric-streak").textContent = `${streak} Days`;
        document.getElementById("metric-total-mins").textContent = `${totalMins} min`;
        document.getElementById("metric-sessions").textContent = historyLog.length;
        document.getElementById("metric-avg").textContent = `${Math.round(last7Mins / 7)} min`;

        const breakdownEl = document.getElementById("label-breakdown");
        breakdownEl.innerHTML = "";
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
                    <div class="bar-track"><div class="bar-fill" style="width: ${pct}%;"></div></div>
                `;
                breakdownEl.appendChild(row);
            });
        }
        drawAnalyticsChart();
    }

    window.addEventListener("resize", drawAnalyticsChart);
    renderAnalytics();
    authReady.then(() => syncLogsFromCloud().then(renderAnalytics));
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
    const inpSoundType = document.getElementById("set-sound-type");
    const inpAuto = document.getElementById("set-autostart");
    const feedback = document.getElementById("save-feedback");
    const notifyStatus = document.getElementById("notify-status");
    const notifyBtn = document.getElementById("btn-request-notify");

    inpFocus.value = settings.focus;
    inpShort.value = settings.short;
    inpLong.value = settings.long;
    inpSound.checked = settings.sound;
    if (inpSoundType) inpSoundType.value = settings.soundType || "chime";
    inpAuto.checked = settings.autoStart;

    if (inpSoundType) {
        inpSoundType.addEventListener("change", () => {
            playChime(inpSoundType.value);
        });
    }

    settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        settings.focus = Math.max(1, parseInt(inpFocus.value, 10) || 25);
        settings.short = Math.max(1, parseInt(inpShort.value, 10) || 5);
        settings.long = Math.max(1, parseInt(inpLong.value, 10) || 15);
        settings.sound = inpSound.checked;
        settings.soundType = inpSoundType ? inpSoundType.value : "chime";
        settings.autoStart = inpAuto.checked;

        saveJSON("ff_settings", settings);

        const currentTimer = loadJSON("ff_timer_state", null);
        if (currentTimer && !currentTimer.isRunning) {
            const secs = currentTimer.mode === "short" ? settings.short * 60 : currentTimer.mode === "long" ? settings.long * 60 : settings.focus * 60;
            currentTimer.remainingSeconds = secs;
            saveJSON("ff_timer_state", currentTimer);
        }

        feedback.textContent = "Settings saved.";
        setTimeout(() => { feedback.textContent = ""; }, 2500);
    });

    document.getElementById("btn-test-sound").addEventListener("click", () => {
        const chosen = inpSoundType ? inpSoundType.value : settings.soundType;
        playChime(chosen || "chime");
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

    notifyBtn.addEventListener("click", () => requestDesktopNotifications(updateNotifyStatus));
    updateNotifyStatus();
                 }
