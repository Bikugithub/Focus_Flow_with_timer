# FocusFlow — Calm Pomodoro Timer & Productivity Suite

A lightweight, luminous Pomodoro timer and focus-tracking web application built with vanilla web technologies and backed by Supabase cloud sync.

---

## Preview

🔗 **Live Demo:** [FocusFlow Web App](https://bikugithub.github.io/Focus_Flow_w/)


---

## Description

**FocusFlow** is designed to make deep work sessions calm, visually soothing, and easy to measure without clutter or heavy frameworks. It combines a drift-free Pomodoro timer with color-coded session tagging, real-time analytics, and optional cloud synchronization so your study, coding, and work sessions stay organized across devices.

Unlike static timers, FocusFlow pairs **localStorage** speed with **Supabase** persistence, custom Web Audio sound synthesis (zero external audio files required), and a **Date-Wise Analysis** view that visualizes each day's effort as a dynamic, color-matched stacked bar.

---

## Utilities & Features

### 1. Focus Timer (`index.html`)
- **3 Session Modes:** Focus, Short Break, and Long Break with customizable durations and an animated SVG circular progress ring.
- **Tab-Accurate Countdown:** Uses real timestamps so the timer remains accurate even when switching browser tabs or locking your device.
- **Auto-Start & Motivational Quotes:** Optional automatic transition between focus and break blocks, paired with a dismissible motivational quote banner upon session completion.
- **Custom Color-Coded Session Labels:** Tap **+ Add Session** to create new labels, rename existing or default labels, pick any custom hex color, or delete unused labels for future sessions—without altering past history logs.
- **Today's Overview & Recent History:** Live summary cards for daily minutes, completed sessions, current streak, and your 3 most recent logs.

### 2. Floating 10-Theme Palette
- **Instant Switching Everywhere:** Click the palette icon in the top navigation bar on any page to open a floating 2×5 circular theme picker.
- **5 Light Themes:** Sage Mist, Ocean Breeze, Lavender Cloud, Warm Peach, Rose Quartz.
- **5 Dark Themes:** Midnight Pine, Deep Ocean, Twilight Plum, Amber Dusk, Nordic Slate.
- **Ambient Floating UI:** Soft luminous radial gradients and subtle animated background icons that adapt automatically to the active theme.

### 3. Date-Wise Analysis & Analytics (`analytics.html`)
- **KPI Summary Cards:** Tracks Current Streak, Total Focus Time, Total Sessions Done, and 7-Day Daily Average.
- **7-Day Bar Chart & Time by Label:** HTML5 Canvas bar graph of the last 7 days alongside color-coded percentage bars for all labels.
- **3-Column Date-Wise Analysis:**
  - **Custom Past Calendar:** Hoverable monthly calendar popover highlighting logged days so you can inspect any past date.
  - **This Week Only Roller (Sun–Sat):** Scrollable with a mouse wheel on desktop/laptop and draggable via touch on mobile/tablet to roll smoothly through the current week.
  - **Animated Stacked Bar (`Label - %`):** Tall rectangular, painterly stacked bar displaying each session label's percentage for the selected day, framed by a continuous glowing border that dynamically matches the user-chosen session colors.

### 4. Searchable Time History (`history.html`)
- **Instant Search & Label Filtering:** Filter completed sessions by task name or session label with live session count and total minute summaries.
- **Full Control:** Delete individual session entries or clear all logs with cloud sync support.

### 5. Studio Web Audio Alerts & Desktop Notifications (`settings.html`)
- **6 Synthesized Completion Sounds:** Harmonic Chime, Tibetan Singing Bowl, Crystal Wind Chimes, Soft Zen Gong, Morning Harp, and Calm Water Drops—generated via the Web Audio API with instant dropdown preview and a **Test Sound** button.
- **Desktop Notifications:** Optional browser notifications when focus or break intervals finish.
- **Quick Guide Modal:** Built-in onboarding guide on first visit, re-openable anytime from the `?` navbar icon or Utilities card.

### 6. Cloud Sync, Authentication & Feedback
- **Email & Password Accounts:** Powered by Supabase Auth so users can sign up, sign in, and sync their personal `focus_logs` across devices (with Row Level Security).
- **Offline-First Fallback:** Automatically caches settings, themes, custom labels, and logs in `localStorage`.
- **In-App Feedback System:** 1–5 ★ rating and message form accessible from both the navbar icon and Settings, stored directly in Supabase.

---

## Tech Stack

- **Frontend:** HTML5, CSS3 (Custom Properties, Grid/Flexbox, `@property` Keyframe Animations), Vanilla JavaScript (ES6+)
- **Audio & Graphics:** Web Audio API, HTML5 Canvas, Inline SVG
- **Backend & Auth:** Supabase JS v2 (PostgreSQL + Row Level Security + Email/Password Auth)
- **Hosting:** GitHub Pages

---

## Project Structure

```text
├── index.html       # Focus Timer, custom session label manager, quick guide & feedback modal
├── history.html     # Searchable & filterable session log
├── analytics.html   # KPI cards, 7-day Canvas chart & Date-Wise Analysis
├── settings.html    # Timer durations, 6 Web Audio sounds, 10 themes, Auth & Feedback
├── style.css        # 10 luminous themes, responsive layouts & Ghibli bar animations
└── script.js        # Timer engine, Web Audio synth, Supabase sync, Auth & Date-Wise logic
