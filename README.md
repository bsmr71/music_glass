<p align="center">
  <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80" width="140" style="border-radius: 28px; box-shadow: 0 12px 36px rgba(0, 102, 255, 0.4);" alt="Convx Logo">
</p>

<h1 align="center">CONVX — Liquid Glass Music Player</h1>

<p align="center">
  <strong>Next-Gen Web Music Player with Apple/iOS-Inspired Liquid Glass UI, Web Audio Equalizer, 60FPS Canvas Visualizer, Live Synced Karaoke Lyrics, and Zero-Lag Dual Engine Streaming.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Web_Audio_API-Enabled-0066FF?style=for-the-badge&logo=w3c&logoColor=white" alt="Web Audio API">
  <img src="https://img.shields.io/badge/Style-Liquid_Glass_CSS-00D2FF?style=for-the-badge" alt="Liquid Glass CSS">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License">
</p>

---

## 🌟 Overview

**Convx Web** is a music streaming web client engineered with a custom **Liquid Glass (Glassmorphism)** design system and powered by the **Web Audio API**. It delivers seamless zero-lag streaming from YouTube Music alongside synchronized lyrics, a 10-band hardware-grade equalizer, and synchronized listening rooms.

---

## ✨ Key Features

### 🎧 Dual-Stream Audio Engine (Instant Playback)
- **Zero-Latency Playback**: Initiates instant playback via YouTube Stream Engine with background HTML5 direct audio fallover.
- **Failover Recovery**: Automatic recovery if network streams disconnect or fail.
- **Background Autoplay**: Automatically queues recommended songs when reaching the end of the queue.

### 💎 Liquid Glass Design System
- **iOS-Inspired Aesthetics**: Deep multi-layered backdrop blurs (`backdrop-filter: blur(32px)`), translucent glow cards, and spring-physics transitions.
- **Dynamic Ambient Color Thief**: Automatically extracts dominant ambient colors from album cover artwork to tint background meshes dynamically in real-time.
- **Responsive Layout**: Designed for Desktop, Tablet, and Mobile with optimized touch targets and navigation bars.

### 🎤 Live Synced Karaoke Lyrics
- **LRCLIB Synchronized Lyrics**: Real-time word/line synced karaoke lyrics view.
- **Physics-based Centering**: Automatic smooth scrolling to keep the active singing line perfectly centered.

### 🎚️ 10-Band Web Audio Equalizer & FX
- **Parametric 10-Band Biquad Filters**: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
- **Curated Presets**: Flat, Bass Boost, Vocal Booster, Acoustic, Electronic, Rock, and Pop.
- **3D Spatial Sound**: Audio spatializer widening simulation.

### 📊 60 FPS Real-time Audio Visualizer
- **Web Audio `AnalyserNode` Canvas**: Ultra-smooth real-time multi-frequency visualizer overlay with customized neon gradients.

### 💫 Liquid Glass Shimmer Skeleton Loading
- **Instant Search & Page Transition Feedback**: Pulsing liquid-glass skeleton shimmer cards across search queries, explore feeds, playlists, and history.

### 📋 Queue Management
- **Slide-out Drawer**: Dedicated queue drawer accessible from both Mini Player and Fullscreen Player.
- **Interactive Controls**: Click to jump, remove individual tracks, clear queue, or shuffle.

### 👥 Listen Together (Synchronized Rooms)
- **Shared Listening Rooms**: Generate a unique 6-character room code to sync playback, pause state, and track position in real-time with friends.

### 🌙 Sleep Timer
- **Smart Countdown**: Set automatic sleep timers (15m, 30m, 45m, 60m, or End of Current Track).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Space`** or **`K`** | Play / Pause toggle |
| **`Arrow Left (←)`** / **`J`** | Seek backward 5s / 10s |
| **`Arrow Right (→)`** / **`L`** | Seek forward 5s / 10s |
| **`Shift` + `←`** / **`P`** | Previous track |
| **`Shift` + `→`** / **`N`** | Next track |
| **`Arrow Up (↑)`** | Volume up (+5%) |
| **`Arrow Down (↓)`** | Volume down (-5%) |
| **`M`** | Mute / Unmute audio |
| **`F`** | Toggle Fullscreen Player |
| **`C`** | Toggle Synced Lyrics View |
| **`Q`** | Toggle Playing Queue Drawer |
| **`Escape`** | Close open modals, drawers, or Fullscreen Player |

> *Note: Shortcuts are intelligently disabled when typing in search bars or text input fields.*

---

## 🚀 Getting Started

### Prerequisites
- **PHP** >= 8.2
- **Composer**
- **Node.js** & **NPM** (optional, for asset bundling)
- **SQLite** or **MySQL**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bsmr71/convx_web.git
   cd convx_web
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Set up Environment File:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Run Database Migrations:**
   ```bash
   php artisan migrate
   ```

5. **Start the Laravel Development Server:**
   ```bash
   php artisan serve
   ```

6. **Open in Browser:**
   ```
   http://127.0.0.1:8000
   ```

---

## 📁 Project Architecture

```
convx_web/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── LibraryController.php    # Playlist, favorites, history CRUD
│   │       ├── MusicController.php      # Search & audio stream routing
│   │       └── RoomController.php       # Listen Together sync rooms
│   ├── Models/
│   │   ├── Favorite.php
│   │   ├── History.php
│   │   ├── Playlist.php
│   │   ├── PlaylistTrack.php
│   │   └── Room.php
│   └── Services/
│       ├── LyricsService.php            # LRCLIB synced lyrics engine
│       └── YouTubeMusicService.php      # YouTube Music scraper & search
├── database/
│   └── migrations/                      # SQLite/MySQL schema definitions
├── public/
│   ├── css/
│   │   └── convx.css                    # Liquid Glass Design System
│   └── js/
│       └── convx.js                     # Core player engine & Web Audio API
├── resources/
│   └── views/
│       └── app.blade.php                # SPA single-page container
└── routes/
    └── web.php                          # API routes & SPA catch-all route
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/music/search?q={query}&filter={filter}` | Search songs, artists, albums |
| `GET` | `/api/music/trending` | Fetch explore and trending playlists |
| `GET` | `/api/music/stream/{id}` | Direct audio stream failover link |
| `GET` | `/api/music/lyrics?title={title}&artist={artist}` | Fetch synced LRCLIB lyrics |
| `GET` | `/api/playlists` | List user playlists |
| `POST` | `/api/playlists` | Create new playlist |
| `GET` | `/api/favorites` | Get all favorite tracks |
| `POST` | `/api/favorites/toggle` | Toggle favorite status |
| `GET` | `/api/history` | Get playback history |
| `POST` | `/api/rooms` | Create Listen Together room |
| `POST` | `/api/rooms/{code}/sync` | Sync room playback state |

---

## 📄 License

This project is licensed under the **MIT License**.
