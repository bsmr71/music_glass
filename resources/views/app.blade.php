<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#0a0a0f">
    <meta name="description" content="Convx Web - Liquid Glass Music Player streaming from YouTube Music with synced lyrics, Web Audio visualizer, and 10-band equalizer.">
    <title>Convx — Liquid Glass Music Player</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <!-- Color Thief for ambient color extraction -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js"></script>

    <!-- Custom CSS -->
    <link rel="stylesheet" href="/css/convx.css?v={{ time() }}">
</head>
<body class="convx-app">
    <!-- Dynamic Ambient Glow Canvas & Mesh -->
    <div id="ambient-mesh" class="ambient-mesh"></div>
    <div id="ambient-glow" class="ambient-glow"></div>

    <!-- Hidden Audio & YouTube Engine -->
    <audio id="audio-player" crossorigin="anonymous" preload="auto"></audio>
    <div id="yt-player-container" class="yt-hidden-player"></div>

    <!-- App Container -->
    <div class="app-layout">
        
        <!-- Glass Sidebar Navigation (Desktop) -->
        <aside class="glass-sidebar" id="main-sidebar">
            <div class="sidebar-brand">
                <div class="brand-logo-icon">
                    <svg viewBox="0 0 32 32" class="brand-svg">
                        <defs>
                            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#a855f7" />
                                <stop offset="50%" stop-color="#6366f1" />
                                <stop offset="100%" stop-color="#06b6d4" />
                            </linearGradient>
                        </defs>
                        <circle cx="16" cy="16" r="14" fill="url(#logo-grad)" opacity="0.9"/>
                        <circle cx="16" cy="16" r="6" fill="#09090b"/>
                        <circle cx="16" cy="16" r="2.5" fill="url(#logo-grad)"/>
                    </svg>
                </div>
                <div class="brand-text">
                    <span class="brand-title">CONVX</span>
                    <span class="brand-badge">LIQUID GLASS</span>
                </div>
            </div>

            <!-- Navigation Links -->
            <nav class="sidebar-nav">
                <div class="nav-section-label">DISCOVER</div>
                <a href="#discover" class="nav-item active" data-view="discover">
                    <i data-lucide="compass"></i>
                    <span>Explore</span>
                </a>
                <a href="#search" class="nav-item" data-view="search">
                    <i data-lucide="search"></i>
                    <span>Search</span>
                </a>

                <div class="nav-section-label">MY COLLECTION</div>
                <a href="#library" class="nav-item" data-view="library">
                    <i data-lucide="library"></i>
                    <span>Library</span>
                </a>
                <a href="#favorites" class="nav-item" data-view="favorites">
                    <i data-lucide="heart"></i>
                    <span>Favorites</span>
                    <span class="nav-badge" id="fav-count-badge">0</span>
                </a>
                <a href="#history" class="nav-item" data-view="history">
                    <i data-lucide="clock"></i>
                    <span>History</span>
                </a>

                <div class="nav-section-label">PLAYLISTS</div>
                <div class="playlist-nav-list" id="sidebar-playlists">
                    <!-- Dynamic user playlists -->
                </div>
                <button class="create-playlist-btn" id="btn-create-playlist-sidebar">
                    <i data-lucide="plus-circle"></i>
                    <span>New Playlist</span>
                </button>

                <div class="nav-section-label">FEATURES</div>
                <a href="#rooms" class="nav-item" data-view="rooms">
                    <i data-lucide="users"></i>
                    <span>Listen Together</span>
                    <span class="pulse-dot"></span>
                </a>
            </nav>

            <!-- Bottom Profile & Settings -->
            <div class="sidebar-bottom">
                <button class="glass-btn-icon" id="btn-open-eq" title="Audio Equalizer & FX">
                    <i data-lucide="sliders"></i>
                </button>
                <button class="glass-btn-icon" id="btn-open-settings" title="Settings">
                    <i data-lucide="settings"></i>
                </button>
                <button class="glass-btn-icon" id="btn-open-timer" title="Sleep Timer">
                    <i data-lucide="moon"></i>
                </button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="main-viewport">
            
            <!-- Top Glass Header -->
            <header class="glass-topbar">
                <div class="topbar-left">
                    <button class="mobile-sidebar-toggle" id="btn-mobile-menu">
                        <i data-lucide="menu"></i>
                    </button>
                    
                    <!-- Search Input Bar -->
                    <div class="top-search-bar" id="search-bar-wrap">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="global-search-input" placeholder="Search songs, artists, albums, or paste YouTube link..." autocomplete="off">
                        <button class="search-clear-btn" id="btn-clear-search">
                            <i data-lucide="x"></i>
                        </button>
                        <div class="search-spinner" id="search-spinner"></div>
                    </div>
                </div>

                <div class="topbar-right">
                    <!-- Audio Quality Indicator Badge -->
                    <div class="glass-pill-badge" id="audio-quality-badge" title="Streaming Quality">
                        <span class="dot-green"></span>
                        <span class="badge-text" id="quality-text">LOSSLESS</span>
                    </div>

                    <!-- Room Status Pill (if active) -->
                    <button class="glass-room-pill hidden" id="active-room-pill" title="Listen Together Active">
                        <i data-lucide="radio"></i>
                        <span id="active-room-code">ROOM</span>
                    </button>

                    <!-- Equalizer Quick Toggle -->
                    <button class="glass-icon-pill" id="quick-eq-btn" title="Equalizer & FX">
                        <i data-lucide="sliders-horizontal"></i>
                    </button>

                    <!-- Queue Drawer Toggle -->
                    <button class="glass-icon-pill queue-toggle-btn" id="btn-toggle-queue" title="Current Queue">
                        <i data-lucide="list-music"></i>
                        <span class="queue-counter" id="queue-counter-badge">0</span>
                    </button>
                </div>
            </header>

            <!-- Views Container -->
            <div class="content-scroll-area" id="content-area">
                
                <!-- 1. DISCOVER / EXPLORE VIEW -->
                <section class="view-panel active" id="view-discover">
                    
                    <!-- Liquid Glass Hero Banner -->
                    <div class="glass-hero-card" id="hero-banner">
                        <div class="hero-bg-art" id="hero-bg-art"></div>
                        <div class="hero-content">
                            <span class="hero-tag"><i data-lucide="sparkles"></i> CONVX LIQUID GLASS</span>
                            <h1 class="hero-title" id="hero-title">Experience Pure Sound</h1>
                            <p class="hero-subtitle" id="hero-subtitle">High-fidelity streaming, real-time synced karaoke lyrics, and ultra-fluid Liquid Glass aesthetics.</p>
                            <div class="hero-actions">
                                <button class="btn-primary-glass" id="btn-hero-play">
                                    <i data-lucide="play" fill="currentColor"></i>
                                    <span>Play Featured Hits</span>
                                </button>
                                <button class="btn-secondary-glass" id="btn-hero-explore">
                                    <i data-lucide="compass"></i>
                                    <span>Explore Genres</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Picks Section -->
                    <div class="section-container">
                        <div class="section-header">
                            <div>
                                <h2 class="section-title">Quick Picks</h2>
                                <p class="section-desc">Songs curated for your immediate vibe</p>
                            </div>
                            <button class="see-all-btn" data-category="quick_picks">Play All</button>
                        </div>
                        <div class="quick-picks-grid" id="quick-picks-list">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Trending Now Horizontal Carousel -->
                    <div class="section-container">
                        <div class="section-header">
                            <div>
                                <h2 class="section-title">Trending Global Hits</h2>
                                <p class="section-desc">Top streamed tracks right now</p>
                            </div>
                        </div>
                        <div class="cards-carousel" id="trending-carousel">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Moods & Genres Bento Grid -->
                    <div class="section-container">
                        <div class="section-header">
                            <div>
                                <h2 class="section-title">Moods & Genres</h2>
                                <p class="section-desc">Find your frequency</p>
                            </div>
                        </div>
                        <div class="genres-grid" id="genres-grid">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Indonesia Hits / Local Vibes -->
                    <div class="section-container">
                        <div class="section-header">
                            <div>
                                <h2 class="section-title">Top Indo Hits 🇮🇩</h2>
                                <p class="section-desc">Lagu terpopuler & viral hari ini</p>
                            </div>
                        </div>
                        <div class="cards-carousel" id="indonesia-carousel">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Chill & Lo-Fi Lounge -->
                    <div class="section-container">
                        <div class="section-header">
                            <div>
                                <h2 class="section-title">Chill & Lo-Fi Sanctuary ☕</h2>
                                <p class="section-desc">Smooth beats to relax, focus, and study</p>
                            </div>
                        </div>
                        <div class="cards-carousel" id="chill-carousel">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- Workout & Phonk Energy -->
                    <div class="section-container">
                        <div class="section-header">
                            <div>
                                <h2 class="section-title">Workout & High Energy ⚡</h2>
                                <p class="section-desc">Fast-paced beats for gym & motivation</p>
                            </div>
                        </div>
                        <div class="cards-carousel" id="workout-carousel">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                </section>

                <!-- 2. SEARCH VIEW -->
                <section class="view-panel" id="view-search">
                    <div class="search-view-header">
                        <h1 class="view-title">Search Results</h1>
                        <!-- Search Filter Chips -->
                        <div class="filter-chips-row">
                            <button class="filter-chip active" data-filter="all">All</button>
                            <button class="filter-chip" data-filter="songs">Songs</button>
                            <button class="filter-chip" data-filter="videos">Music Videos</button>
                            <button class="filter-chip" data-filter="albums">Albums</button>
                            <button class="filter-chip" data-filter="artists">Artists</button>
                        </div>
                    </div>

                    <div class="search-results-container" id="search-results-list">
                        <div class="empty-state">
                            <i data-lucide="search" class="empty-icon"></i>
                            <h3>Search YouTube Music</h3>
                            <p>Type a song, artist name, lyrics, or album to stream instantly.</p>
                        </div>
                    </div>
                </section>

                <!-- 3. LIBRARY VIEW -->
                <section class="view-panel" id="view-library">
                    <div class="library-header">
                        <div>
                            <h1 class="view-title">My Library</h1>
                            <p class="view-subtitle">Your personal collection of favorite tracks and custom playlists</p>
                        </div>
                        <button class="btn-primary-glass" id="btn-create-playlist-lib">
                            <i data-lucide="folder-plus"></i>
                            <span>Create Playlist</span>
                        </button>
                    </div>

                    <!-- Library Quick Cards -->
                    <div class="library-cards-row">
                        <div class="lib-hero-card fav-card" id="card-open-favorites">
                            <div class="lib-card-icon"><i data-lucide="heart" fill="#ec4899"></i></div>
                            <div class="lib-card-info">
                                <h3>Liked Songs</h3>
                                <p id="lib-fav-count">0 tracks</p>
                            </div>
                        </div>
                        <div class="lib-hero-card history-card" id="card-open-history">
                            <div class="lib-card-icon"><i data-lucide="clock"></i></div>
                            <div class="lib-card-info">
                                <h3>Recently Played</h3>
                                <p id="lib-history-count">0 tracks</p>
                            </div>
                        </div>
                    </div>

                    <h2 class="section-title mt-6">Custom Playlists</h2>
                    <div class="playlists-grid" id="playlists-grid">
                        <!-- Populated dynamically -->
                    </div>
                </section>

                <!-- 4. FAVORITES VIEW -->
                <section class="view-panel" id="view-favorites">
                    <div class="playlist-hero-banner" style="background: linear-gradient(135deg, rgba(0, 102, 255, 0.35), rgba(0, 210, 255, 0.15));">
                        <div class="playlist-cover-art" style="background: linear-gradient(135deg, #0066ff, #00d2ff);">
                            <i data-lucide="heart" size="48" fill="white"></i>
                        </div>
                        <div class="playlist-meta">
                            <span class="playlist-type">PLAYLIST</span>
                            <h1 class="playlist-name">Liked Songs</h1>
                            <p class="playlist-desc">All your favorite tracks saved in one place</p>
                            <div class="playlist-action-bar">
                                <button class="btn-primary-glass" id="btn-play-all-favs">
                                    <i data-lucide="play" fill="currentColor"></i> Play All
                                </button>
                                <button class="btn-secondary-glass" id="btn-shuffle-favs">
                                    <i data-lucide="shuffle"></i> Shuffle
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="tracklist-table" id="favs-tracklist">
                        <!-- Populated dynamically -->
                    </div>
                </section>

                <!-- 5. HISTORY VIEW -->
                <section class="view-panel" id="view-history">
                    <div class="section-header">
                        <div>
                            <h1 class="view-title">Listening History</h1>
                            <p class="view-subtitle">Tracks you've streamed recently</p>
                        </div>
                        <button class="btn-secondary-glass" id="btn-clear-history">
                            <i data-lucide="trash-2"></i> Clear History
                        </button>
                    </div>
                    <div class="tracklist-table" id="history-tracklist">
                        <!-- Populated dynamically -->
                    </div>
                </section>

                <!-- 6. PLAYLIST DETAIL VIEW -->
                <section class="view-panel" id="view-playlist-detail">
                    <div class="playlist-hero-banner" id="pl-detail-banner">
                        <div class="playlist-cover-art" id="pl-detail-cover">
                            <i data-lucide="music" size="48"></i>
                        </div>
                        <div class="playlist-meta">
                            <span class="playlist-type">PLAYLIST</span>
                            <h1 class="playlist-name" id="pl-detail-title">Playlist Name</h1>
                            <p class="playlist-desc" id="pl-detail-desc">Description</p>
                            <div class="playlist-action-bar">
                                <button class="btn-primary-glass" id="btn-play-all-playlist">
                                    <i data-lucide="play" fill="currentColor"></i> Play
                                </button>
                                <button class="btn-secondary-glass" id="btn-shuffle-playlist">
                                    <i data-lucide="shuffle"></i> Shuffle
                                </button>
                                <button class="btn-secondary-glass" id="btn-delete-playlist">
                                    <i data-lucide="trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="tracklist-table" id="playlist-tracklist">
                        <!-- Tracks -->
                    </div>
                </section>

                <!-- 7. LISTEN TOGETHER / ROOM VIEW -->
                <section class="view-panel" id="view-rooms">
                    <div class="rooms-container">
                        <div class="rooms-hero">
                            <div class="room-icon-badge"><i data-lucide="radio" size="40"></i></div>
                            <h1 class="view-title">Listen Together</h1>
                            <p class="view-subtitle">Stream music simultaneously with friends. Host a lounge or join a room code to sync playback in real time!</p>
                        </div>

                        <div class="rooms-actions-grid">
                            <!-- Create Room Card -->
                            <div class="glass-panel room-card">
                                <h3><i data-lucide="plus-circle"></i> Host a New Room</h3>
                                <p>Create a shared music room and invite your friends with a 6-letter code.</p>
                                <div class="input-group">
                                    <input type="text" id="room-create-name" placeholder="Lounge Name (e.g. Midnight Chill)">
                                    <button class="btn-primary-glass w-full" id="btn-create-room">Create Room</button>
                                </div>
                            </div>

                            <!-- Join Room Card -->
                            <div class="glass-panel room-card">
                                <h3><i data-lucide="log-in"></i> Join with Code</h3>
                                <p>Enter the 6-character room code shared by your friend.</p>
                                <div class="input-group">
                                    <input type="text" id="room-join-code" placeholder="Enter Room Code (e.g. X9K2LM)" maxlength="6" style="text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">
                                    <button class="btn-primary-glass w-full" id="btn-join-room">Join Room</button>
                                </div>
                            </div>
                        </div>

                        <div id="room-active-status" class="glass-panel room-status-box hidden">
                            <div class="room-status-header">
                                <div>
                                    <span class="live-tag"><span class="pulse-dot"></span> CONNECTED</span>
                                    <h2 id="room-status-title">Party Lounge</h2>
                                    <p>Share code: <strong id="room-status-code" class="code-highlight">------</strong></p>
                                </div>
                                <button class="btn-secondary-glass" id="btn-leave-room">Leave Room</button>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            <!-- Floating Liquid Mini Player (Docked Bottom) -->
            <div class="liquid-mini-player" id="mini-player">
                <!-- Progress Line Indicator -->
                <div class="mini-progress-bar">
                    <div class="mini-progress-fill" id="mini-progress-fill"></div>
                </div>

                <div class="mini-player-inner">
                    <!-- Artwork & Track Info -->
                    <div class="mini-track-group" id="mini-open-fullscreen">
                        <div class="mini-art-wrap">
                            <img id="mini-thumb" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80" alt="Album Cover" class="mini-artwork">
                            <div class="mini-play-indicator" id="mini-pulse-ring"></div>
                        </div>
                        <div class="mini-text-wrap">
                            <div class="mini-title" id="mini-title">No Track Playing</div>
                            <div class="mini-artist" id="mini-artist">Select a song to start streaming</div>
                        </div>
                    </div>

                    <!-- Mini Controls -->
                    <div class="mini-controls">
                        <button class="mini-btn" id="mini-btn-fav" title="Add to Favorites">
                            <i data-lucide="heart" id="mini-fav-icon"></i>
                        </button>
                        <button class="mini-btn" id="mini-btn-prev" title="Previous Track">
                            <i data-lucide="skip-back"></i>
                        </button>
                        <button class="mini-btn-play" id="mini-btn-play" title="Play/Pause">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
                        </button>
                        <button class="mini-btn" id="mini-btn-next" title="Next Track">
                            <i data-lucide="skip-forward"></i>
                        </button>
                        <button class="mini-btn" id="mini-btn-lyrics" title="Open Lyrics">
                            <i data-lucide="mic-2"></i>
                        </button>
                        <button class="mini-btn" id="mini-btn-queue" title="Playing Queue">
                            <i data-lucide="list-music"></i>
                        </button>
                        <button class="mini-btn" id="mini-btn-expand" title="Fullscreen Player">
                            <i data-lucide="chevron-up"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Bottom Mobile Navigation Bar -->
            <nav class="mobile-bottom-nav">
                <button class="mob-nav-item active" data-view="discover">
                    <i data-lucide="compass"></i>
                    <span>Explore</span>
                </button>
                <button class="mob-nav-item" data-view="search">
                    <i data-lucide="search"></i>
                    <span>Search</span>
                </button>
                <button class="mob-nav-item" data-view="library">
                    <i data-lucide="library"></i>
                    <span>Library</span>
                </button>
                <button class="mob-nav-item" data-view="favorites">
                    <i data-lucide="heart"></i>
                    <span>Favorites</span>
                </button>
            </nav>

        </main>

    </div>

    <!-- ==================== QUEUE DRAWER & BACKDROP (ROOT LEVEL) ==================== -->
    <div class="queue-drawer-backdrop" id="queue-drawer-backdrop"></div>
    <aside class="glass-queue-drawer" id="queue-drawer">
        <div class="queue-header">
            <div class="queue-title-wrap">
                <i data-lucide="list-music"></i>
                <h3>Playing Queue</h3>
                <span class="queue-count-pill" id="queue-counter-badge">0</span>
            </div>
            <div class="queue-actions">
                <button class="glass-btn-sm" id="btn-clear-queue">Clear</button>
                <button class="glass-btn-sm" id="btn-close-queue"><i data-lucide="x"></i></button>
            </div>
        </div>
        <div class="queue-current-card" id="queue-now-playing-card">
            <span class="queue-badge">NOW PLAYING</span>
            <div class="queue-item active" id="queue-current-item">
                <!-- Current track info -->
            </div>
        </div>
        <div class="queue-section-label">UP NEXT</div>
        <div class="queue-items-list" id="queue-items-list">
            <!-- Queue Items -->
        </div>
    </aside>

    <!-- ==================== FULLSCREEN LIQUID GLASS PLAYER MODAL ==================== -->
    <div class="fullscreen-player-modal" id="fullscreen-player">
        <div class="fs-backdrop-blur"></div>
        <div class="fs-ambient-mesh" id="fs-ambient-mesh"></div>

        <!-- Top Navigation -->
        <div class="fs-topbar">
            <button class="fs-icon-btn" id="fs-btn-close" title="Minimize">
                <i data-lucide="chevron-down"></i>
            </button>
            <div class="fs-header-title">
                <span class="fs-now-playing-tag">NOW STREAMING</span>
                <span class="fs-album-name" id="fs-album-name">YouTube Music HQ</span>
            </div>
            <div class="fs-top-actions">
                <button class="fs-icon-btn" id="fs-btn-toggle-visualizer" title="Toggle Live Audio Visualizer">
                    <i data-lucide="activity"></i>
                </button>
                <button class="fs-icon-btn" id="fs-btn-toggle-lyrics-view" title="Toggle Synced Karaoke Lyrics">
                    <i data-lucide="mic-2"></i>
                </button>
            </div>
        </div>

        <!-- Main Player Body (Side-by-side or Centered) -->
        <div class="fs-main-body">
            
            <!-- Left Side: 3D Artwork / Vinyl Record / Visualizer Canvas -->
            <div class="fs-visual-section" id="fs-visual-wrap">
                
                <!-- 3D Vinyl / Glass Artwork Container -->
                <div class="fs-artwork-container" id="fs-art-3d">
                    <div class="fs-artwork-glow" id="fs-art-glow"></div>
                    <div class="fs-vinyl-disc" id="fs-vinyl">
                        <div class="vinyl-grooves"></div>
                        <div class="vinyl-center"></div>
                    </div>
                    <img id="fs-cover-img" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80" alt="Cover Art" class="fs-cover-image">
                </div>

                <!-- Web Audio Visualizer Canvas Overlay -->
                <div class="fs-visualizer-container" id="fs-visualizer-wrap">
                    <canvas id="fs-canvas-visualizer"></canvas>
                </div>
            </div>

            <!-- Right Side: Synced Karaoke Lyrics Mode -->
            <div class="fs-lyrics-section" id="fs-lyrics-wrap">
                <div class="lyrics-header">
                    <span><i data-lucide="sparkles"></i> LIVE SYNCED LYRICS</span>
                    <span class="lyrics-source" id="lyrics-source-badge">LRCLIB</span>
                </div>
                <div class="lyrics-scroller" id="fs-lyrics-scroller">
                    <div class="lyrics-empty" id="lyrics-placeholder">
                        <i data-lucide="music-2" class="pulse-icon"></i>
                        <p>Synced lyrics will flow here automatically as the song plays...</p>
                    </div>
                </div>
            </div>

        </div>

        <!-- Bottom Controls & Scrub Bar -->
        <div class="fs-bottom-controls">
            
            <!-- Track Info & Favorite Heart -->
            <div class="fs-track-info-row">
                <div class="fs-track-details">
                    <h2 class="fs-track-title" id="fs-track-title">Song Title</h2>
                    <p class="fs-track-artist" id="fs-track-artist">Artist Name</p>
                </div>
                <button class="fs-fav-btn" id="fs-btn-fav">
                    <i data-lucide="heart" id="fs-fav-icon"></i>
                </button>
            </div>

            <!-- Scrub Bar -->
            <div class="fs-scrubber-container">
                <div class="fs-seek-track" id="fs-seek-track">
                    <div class="fs-seek-buffered" id="fs-seek-buffered"></div>
                    <div class="fs-seek-fill" id="fs-seek-fill"></div>
                    <div class="fs-seek-handle" id="fs-seek-handle"></div>
                </div>
                <div class="fs-time-row">
                    <span id="fs-time-current">0:00</span>
                    <span id="fs-time-total">0:00</span>
                </div>
            </div>

            <!-- Main Playback Actions -->
            <div class="fs-actions-row">
                <button class="fs-ctrl-btn" id="fs-btn-shuffle" title="Shuffle">
                    <i data-lucide="shuffle"></i>
                </button>
                <button class="fs-ctrl-btn" id="fs-btn-prev" title="Previous Track">
                    <i data-lucide="skip-back"></i>
                </button>
                <button class="fs-play-circle" id="fs-btn-play" title="Play/Pause">
                    <i data-lucide="play" id="fs-play-icon" fill="currentColor"></i>
                </button>
                <button class="fs-ctrl-btn" id="fs-btn-next" title="Next Track">
                    <i data-lucide="skip-forward"></i>
                </button>
                <button class="fs-ctrl-btn" id="fs-btn-repeat" title="Repeat Mode">
                    <i data-lucide="repeat"></i>
                    <span class="repeat-one-indicator" id="repeat-one-indicator">1</span>
                </button>
            </div>

            <!-- Volume & Extra Tools Row -->
            <div class="fs-extra-tools-row">
                <div class="volume-slider-group">
                    <i data-lucide="volume-2" id="vol-icon"></i>
                    <input type="range" id="fs-volume-slider" min="0" max="1" step="0.01" value="0.8" class="glass-slider">
                </div>

                <div class="fs-aux-btns">
                    <button class="fs-aux-btn" id="fs-btn-eq-modal" title="Equalizer">
                        <i data-lucide="sliders"></i>
                    </button>
                    <button class="fs-aux-btn" id="fs-btn-download" title="Download Audio">
                        <i data-lucide="download"></i>
                    </button>
                    <button class="fs-aux-btn" id="fs-btn-open-queue" title="View Queue">
                        <i data-lucide="list-music"></i>
                    </button>
                </div>
            </div>

        </div>
    </div>

    <!-- ==================== EQUALIZER & AUDIO FX MODAL ==================== -->
    <div class="glass-modal-overlay" id="eq-modal">
        <div class="glass-modal-content eq-modal-content">
            <div class="modal-header">
                <div class="modal-title-wrap">
                    <i data-lucide="sliders"></i>
                    <h3>10-Band Liquid Equalizer</h3>
                </div>
                <button class="modal-close-btn" id="btn-close-eq"><i data-lucide="x"></i></button>
            </div>

            <div class="modal-body">
                <!-- Preset Buttons -->
                <div class="eq-presets-label">EQUALIZER PRESETS</div>
                <div class="eq-presets-row">
                    <button class="eq-preset-btn active" data-preset="flat">Flat</button>
                    <button class="eq-preset-btn" data-preset="bass">Bass Boost</button>
                    <button class="eq-preset-btn" data-preset="vocal">Vocal Pro</button>
                    <button class="eq-preset-btn" data-preset="acoustic">Acoustic</button>
                    <button class="eq-preset-btn" data-preset="electronic">Electronic</button>
                    <button class="eq-preset-btn" data-preset="rock">Rock</button>
                    <button class="eq-preset-btn" data-preset="pop">Pop</button>
                </div>

                <!-- 10 Sliders -->
                <div class="eq-sliders-grid" id="eq-sliders-container">
                    <!-- Populated by JS -->
                </div>

                <!-- Spatial Audio & Bass Boost Toggles -->
                <div class="eq-fx-row">
                    <div class="fx-toggle-card">
                        <div class="fx-info">
                            <h4>3D Spatial Sound</h4>
                            <p>Virtual surround sound widening</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="toggle-spatial-sound">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ==================== CREATE PLAYLIST MODAL ==================== -->
    <div class="glass-modal-overlay" id="playlist-modal">
        <div class="glass-modal-content">
            <div class="modal-header">
                <h3>Create New Playlist</h3>
                <button class="modal-close-btn" id="btn-close-pl-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <div class="input-field">
                    <label>Playlist Name</label>
                    <input type="text" id="new-pl-name" placeholder="e.g. Midnight Drives, Chill Workout">
                </div>
                <div class="input-field">
                    <label>Description (Optional)</label>
                    <textarea id="new-pl-desc" placeholder="A cozy collection of favorite songs..."></textarea>
                </div>
                <div class="input-field">
                    <label>Accent Color</label>
                    <div class="color-picker-row">
                        <button class="color-swatch active" data-color="#7c3aed" style="background:#7c3aed;"></button>
                        <button class="color-swatch" data-color="#ec4899" style="background:#ec4899;"></button>
                        <button class="color-swatch" data-color="#3b82f6" style="background:#3b82f6;"></button>
                        <button class="color-swatch" data-color="#10b981" style="background:#10b981;"></button>
                        <button class="color-swatch" data-color="#f59e0b" style="background:#f59e0b;"></button>
                        <button class="color-swatch" data-color="#ef4444" style="background:#ef4444;"></button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary-glass" id="btn-cancel-new-pl">Cancel</button>
                <button class="btn-primary-glass" id="btn-save-new-pl">Create Playlist</button>
            </div>
        </div>
    </div>

    <!-- ==================== SLEEP TIMER MODAL ==================== -->
    <div class="glass-modal-overlay" id="timer-modal">
        <div class="glass-modal-content">
            <div class="modal-header">
                <div class="modal-title-wrap">
                    <i data-lucide="moon"></i>
                    <h3>Sleep Timer</h3>
                </div>
                <button class="modal-close-btn" id="btn-close-timer"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <p class="timer-desc">Automatically pause playback after the chosen duration so you can sleep peacefully.</p>
                <div class="timer-options-list">
                    <button class="timer-opt-btn" data-minutes="15">15 Minutes</button>
                    <button class="timer-opt-btn" data-minutes="30">30 Minutes</button>
                    <button class="timer-opt-btn" data-minutes="45">45 Minutes</button>
                    <button class="timer-opt-btn" data-minutes="60">60 Minutes</button>
                    <button class="timer-opt-btn" data-minutes="end_of_track">End of Current Track</button>
                    <button class="timer-opt-btn text-danger" data-minutes="off">Turn Off Timer</button>
                </div>
                <div id="timer-active-label" class="timer-status hidden">Timer active: <span id="timer-countdown"></span></div>
            </div>
        </div>
    </div>

    <!-- YouTube Iframe API Script -->
    <script src="https://www.youtube.com/iframe_api"></script>

    <!-- Convx Core JavaScript -->
    <script src="/js/convx.js?v={{ time() }}"></script>
</body>
</html>
