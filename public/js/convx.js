/**
 * CONVX WEB — LIQUID GLASS MUSIC PLAYER CLIENT ENGINE
 * Full-featured Web Audio API, Dual-Stream Engine, Synced Lyrics, and iOS-like Physics
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Main App Controller
    const app = new ConvxApp();
    app.init();
});

class ConvxApp {
    constructor() {
        // Core State
        this.currentTrack = null;
        this.queue = [];
        this.queueIndex = -1;
        this.isPlaying = false;
        this.isShuffle = false;
        this.repeatMode = 'off'; // 'off' | 'all' | 'one'
        this.originalQueue = [];
        this.favorites = new Set();
        this.playlists = [];
        this.history = [];
        this.activeRoom = null;
        this.roomPollTimer = null;
        this.sleepTimer = null;
        this.sleepTimeEnd = null;

        // Audio & Visualizer Engines
        this.audio = document.getElementById('audio-player');
        this.ytPlayer = null;
        this.ytReady = false;
        this.useYouTubeEngine = false;
        this.audioCtx = null;
        this.analyser = null;
        this.sourceNode = null;
        this.eqFilters = [];
        this.isVisualizerActive = true;
        this.isAudioCtxInitialized = false;
        this.isBuffering = false;

        // Lyrics Engine
        this.currentLyrics = [];
        this.activeLyricIndex = -1;

        // Equalizer Frequencies (10 bands in Hz)
        this.eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        this.eqPresets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            bass: [6, 5.5, 4, 2, 0, 0, 0, 1, 2, 3],
            vocal: [-2, -1, 0, 2, 4.5, 4, 3, 2, 0, -1],
            acoustic: [3, 2.5, 1.5, 1, 2, 2.5, 3, 3.5, 3, 2],
            electronic: [4.5, 4, 2, 0, -1, 2, 1, 3, 4, 4.5],
            rock: [4.5, 3, 1, -1, -2, 1, 2.5, 3.5, 4, 4],
            pop: [-1, 1, 2.5, 3.5, 4, 3, 1, 2, 3, 3.5]
        };

        // Cache DOM elements
        this.dom = {
            // View containers
            viewPanels: document.querySelectorAll('.view-panel'),
            navItems: document.querySelectorAll('.sidebar-nav .nav-item, .mob-nav-item'),
            
            // Search
            searchInput: document.getElementById('global-search-input'),
            searchClearBtn: document.getElementById('btn-clear-search'),
            searchSpinner: document.getElementById('search-spinner'),
            searchResultsList: document.getElementById('search-results-list'),
            filterChips: document.querySelectorAll('.filter-chip'),

            // Mini Player
            miniPlayer: document.getElementById('mini-player'),
            miniProgressFill: document.getElementById('mini-progress-fill'),
            miniThumb: document.getElementById('mini-thumb'),
            miniTitle: document.getElementById('mini-title'),
            miniArtist: document.getElementById('mini-artist'),
            miniBtnPlay: document.getElementById('mini-btn-play'),
            miniPlayIcon: document.getElementById('mini-play-icon'),
            miniBtnFav: document.getElementById('mini-btn-fav'),
            miniFavIcon: document.getElementById('mini-fav-icon'),
            miniBtnPrev: document.getElementById('mini-btn-prev'),
            miniBtnNext: document.getElementById('mini-btn-next'),
            miniBtnExpand: document.getElementById('mini-btn-expand'),
            miniBtnLyrics: document.getElementById('mini-btn-lyrics'),
            miniBtnQueue: document.getElementById('mini-btn-queue'),
            miniOpenFullscreen: document.getElementById('mini-open-fullscreen'),

            // Fullscreen Player
            fsPlayer: document.getElementById('fullscreen-player'),
            fsBtnClose: document.getElementById('fs-btn-close'),
            fsCoverImg: document.getElementById('fs-cover-img'),
            fsArt3d: document.getElementById('fs-art-3d'),
            fsArtGlow: document.getElementById('fs-art-glow'),
            fsVinyl: document.getElementById('fs-vinyl'),
            fsTrackTitle: document.getElementById('fs-track-title'),
            fsTrackArtist: document.getElementById('fs-track-artist'),
            fsAlbumName: document.getElementById('fs-album-name'),
            fsBtnPlay: document.getElementById('fs-btn-play'),
            fsPlayIcon: document.getElementById('fs-play-icon'),
            fsBtnPrev: document.getElementById('fs-btn-prev'),
            fsBtnNext: document.getElementById('fs-btn-next'),
            fsBtnShuffle: document.getElementById('fs-btn-shuffle'),
            fsBtnRepeat: document.getElementById('fs-btn-repeat'),
            repeatOneIndicator: document.getElementById('repeat-one-indicator'),
            fsBtnFav: document.getElementById('fs-btn-fav'),
            fsFavIcon: document.getElementById('fs-fav-icon'),
            fsSeekTrack: document.getElementById('fs-seek-track'),
            fsSeekFill: document.getElementById('fs-seek-fill'),
            fsSeekHandle: document.getElementById('fs-seek-handle'),
            fsSeekBuffered: document.getElementById('fs-seek-buffered'),
            fsTimeCurrent: document.getElementById('fs-time-current'),
            fsTimeTotal: document.getElementById('fs-time-total'),
            fsVolumeSlider: document.getElementById('fs-volume-slider'),
            fsLyricsScroller: document.getElementById('fs-lyrics-scroller'),
            fsCanvasVisualizer: document.getElementById('fs-canvas-visualizer'),
            fsBtnToggleLyricsView: document.getElementById('fs-btn-toggle-lyrics-view'),
            fsBtnToggleVisualizer: document.getElementById('fs-btn-toggle-visualizer'),
            fsLyricsWrap: document.getElementById('fs-lyrics-wrap'),
            fsVisualWrap: document.getElementById('fs-visual-wrap'),
            fsBtnEqModal: document.getElementById('fs-btn-eq-modal'),
            fsBtnOpenQueue: document.getElementById('fs-btn-open-queue'),
            fsBtnDownload: document.getElementById('fs-btn-download'),

            // Ambient background
            ambientMesh: document.getElementById('ambient-mesh'),
            ambientGlow: document.getElementById('ambient-glow'),
            fsAmbientMesh: document.getElementById('fs-ambient-mesh'),

            // Queue Drawer
            queueDrawer: document.getElementById('queue-drawer'),
            queueBackdrop: document.getElementById('queue-drawer-backdrop'),
            btnToggleQueue: document.getElementById('btn-toggle-queue'),
            btnCloseQueue: document.getElementById('btn-close-queue'),
            btnClearQueue: document.getElementById('btn-clear-queue'),
            queueCounterBadge: document.getElementById('queue-counter-badge'),
            queueCurrentItem: document.getElementById('queue-current-item'),
            queueItemsList: document.getElementById('queue-items-list'),

            // EQ Modal
            eqModal: document.getElementById('eq-modal'),
            btnOpenEq: document.getElementById('btn-open-eq'),
            quickEqBtn: document.getElementById('quick-eq-btn'),
            btnCloseEq: document.getElementById('btn-close-eq'),
            eqSlidersContainer: document.getElementById('eq-sliders-container'),
            eqPresetBtns: document.querySelectorAll('.eq-preset-btn'),

            // Playlist Modal
            playlistModal: document.getElementById('playlist-modal'),
            btnCreatePlaylistSidebar: document.getElementById('btn-create-playlist-sidebar'),
            btnCreatePlaylistLib: document.getElementById('btn-create-playlist-lib'),
            btnClosePlModal: document.getElementById('btn-close-pl-modal'),
            btnCancelNewPl: document.getElementById('btn-cancel-new-pl'),
            btnSaveNewPl: document.getElementById('btn-save-new-pl'),
            newPlName: document.getElementById('new-pl-name'),
            newPlDesc: document.getElementById('new-pl-desc'),
            colorSwatches: document.querySelectorAll('.color-swatch'),

            // Sleep Timer
            timerModal: document.getElementById('timer-modal'),
            btnOpenTimer: document.getElementById('btn-open-timer'),
            btnCloseTimer: document.getElementById('btn-close-timer'),
            timerOptBtns: document.querySelectorAll('.timer-opt-btn'),
            timerActiveLabel: document.getElementById('timer-active-label'),
            timerCountdown: document.getElementById('timer-countdown'),

            // Home feeds
            quickPicksList: document.getElementById('quick-picks-list'),
            trendingCarousel: document.getElementById('trending-carousel'),
            genresGrid: document.getElementById('genres-grid'),
            indonesiaCarousel: document.getElementById('indonesia-carousel'),
            chillCarousel: document.getElementById('chill-carousel'),
            workoutCarousel: document.getElementById('workout-carousel'),

            // Library & History
            playlistsGrid: document.getElementById('playlists-grid'),
            sidebarPlaylists: document.getElementById('sidebar-playlists'),
            favsTracklist: document.getElementById('favs-tracklist'),
            historyTracklist: document.getElementById('history-tracklist'),
            libFavCount: document.getElementById('lib-fav-count'),
            libHistoryCount: document.getElementById('lib-history-count'),
            favCountBadge: document.getElementById('fav-count-badge'),
            cardOpenFavorites: document.getElementById('card-open-favorites'),
            cardOpenHistory: document.getElementById('card-open-history'),
            btnClearHistory: document.getElementById('btn-clear-history'),
            btnPlayAllFavs: document.getElementById('btn-play-all-favs'),
            btnShuffleFavs: document.getElementById('btn-shuffle-favs'),

            // Room / Listen Together
            btnCreateRoom: document.getElementById('btn-create-room'),
            btnJoinRoom: document.getElementById('btn-join-room'),
            roomCreateName: document.getElementById('room-create-name'),
            roomJoinCode: document.getElementById('room-join-code'),
            roomActiveStatus: document.getElementById('room-active-status'),
            roomStatusTitle: document.getElementById('room-status-title'),
            roomStatusCode: document.getElementById('room-status-code'),
            btnLeaveRoom: document.getElementById('btn-leave-room'),
            activeRoomPill: document.getElementById('active-room-pill'),
            activeRoomCode: document.getElementById('active-room-code'),

            // Mobile toggle
            btnMobileMenu: document.getElementById('btn-mobile-menu'),
            mainSidebar: document.getElementById('main-sidebar'),
        };
    }

    /**
     * App Initialization
     */
    init() {
        this.bindEvents();
        this.setupAudioListeners();
        this.setupYouTubeAPI();
        this.buildEqualizerUI();
        this.loadExploreFeed();
        this.loadFavorites();
        this.loadPlaylists();
        this.loadHistory();
        this.restorePlaybackState();
        this.startVisualizer();
        this.checkUrlRoute();
        this.setupElectronBridge();
        this.initAuth();
    }

    /**
     * Electron Desktop Bridge (Global Media Keys, Custom Controls & Tray Sync)
     */
    setupElectronBridge() {
        if (window.electronAPI) {
            document.body.classList.add('is-electron');

            // Window Control Buttons (Topbar)
            const btnMin = document.getElementById('win-btn-min');
            const btnMax = document.getElementById('win-btn-max');
            const btnClose = document.getElementById('win-btn-close');

            if (btnMin) btnMin.addEventListener('click', () => window.electronAPI.minimize());
            if (btnMax) btnMax.addEventListener('click', () => window.electronAPI.maximize());
            if (btnClose) btnClose.addEventListener('click', () => window.electronAPI.close());

            // Window Control Buttons (Fullscreen Player)
            const fsBtnMin = document.getElementById('fs-win-btn-min');
            const fsBtnMax = document.getElementById('fs-win-btn-max');
            const fsBtnClose = document.getElementById('fs-win-btn-close');

            if (fsBtnMin) fsBtnMin.addEventListener('click', () => window.electronAPI.minimize());
            if (fsBtnMax) fsBtnMax.addEventListener('click', () => window.electronAPI.maximize());
            if (fsBtnClose) fsBtnClose.addEventListener('click', () => window.electronAPI.close());

            // GitHub External Link Handler
            const githubPill = document.getElementById('btn-github-profile');
            if (githubPill) {
                githubPill.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.electronAPI.openExternal(githubPill.href);
                });
            }

            // Global Media Keys / System Tray Controls
            window.electronAPI.onMediaControl((action) => {
                if (action === 'play-pause') {
                    this.togglePlay();
                } else if (action === 'next') {
                    this.nextTrack();
                } else if (action === 'prev') {
                    this.prevTrack();
                } else if (action === 'stop') {
                    if (this.isPlaying) this.togglePlay();
                }
            });
        }
    }

    /**
     * Attach Event Handlers
     */
    bindEvents() {
        // Navigation clicks
        this.dom.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });

        window.addEventListener('popstate', () => this.checkUrlRoute());

        // Mobile Menu Toggle
        if (this.dom.btnMobileMenu) {
            this.dom.btnMobileMenu.addEventListener('click', () => {
                this.dom.mainSidebar.classList.toggle('mobile-open');
            });
        }

        // Global Search (Menunggu user selesai mengetik / Tekan Enter)
        let searchDebounce = null;
        this.dom.searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            this.dom.searchClearBtn.classList.toggle('active', val.length > 0);
            
            clearTimeout(searchDebounce);
            if (val.length >= 2) {
                this.dom.searchSpinner.classList.add('active');
                searchDebounce = setTimeout(() => {
                    this.switchView('search');
                    this.performSearch(val);
                }, 750);
            } else {
                this.dom.searchSpinner.classList.remove('active');
            }
        });

        this.dom.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = this.dom.searchInput.value.trim();
                if (val.length >= 2) {
                    clearTimeout(searchDebounce);
                    this.switchView('search');
                    this.performSearch(val);
                }
            }
        });

        // Click on search icon to trigger search immediately
        const searchIcon = document.querySelector('.top-search-bar .search-icon');
        if (searchIcon) {
            searchIcon.style.cursor = 'pointer';
            searchIcon.addEventListener('click', () => {
                const val = this.dom.searchInput.value.trim();
                if (val.length >= 2) {
                    clearTimeout(searchDebounce);
                    this.switchView('search');
                    this.performSearch(val);
                }
            });
        }

        this.dom.searchClearBtn.addEventListener('click', () => {
            clearTimeout(searchDebounce);
            this.dom.searchInput.value = '';
            this.dom.searchClearBtn.classList.remove('active');
            this.dom.searchSpinner.classList.remove('active');
            this.dom.searchInput.focus();
        });

        this.dom.filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.dom.filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const query = this.dom.searchInput.value.trim();
                if (query) {
                    this.performSearch(query, chip.dataset.filter);
                }
            });
        });

        // Mini Player actions
        this.dom.miniBtnPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });
        this.dom.miniBtnPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevTrack();
        });
        this.dom.miniBtnNext.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextTrack();
        });
        this.dom.miniBtnFav.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavoriteCurrent();
        });
        this.dom.miniOpenFullscreen.addEventListener('click', () => this.openFullscreenPlayer());
        this.dom.miniBtnExpand.addEventListener('click', () => this.openFullscreenPlayer());
        this.dom.miniBtnLyrics.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openFullscreenPlayer();
            this.toggleLyricsView(true);
        });

        // Fullscreen Player actions
        this.dom.fsBtnClose.addEventListener('click', () => this.closeFullscreenPlayer());
        this.dom.fsBtnPlay.addEventListener('click', () => this.togglePlay());
        this.dom.fsBtnPrev.addEventListener('click', () => this.prevTrack());
        this.dom.fsBtnNext.addEventListener('click', () => this.nextTrack());
        this.dom.fsBtnShuffle.addEventListener('click', () => this.toggleShuffle());
        this.dom.fsBtnRepeat.addEventListener('click', () => this.toggleRepeat());
        this.dom.fsBtnFav.addEventListener('click', () => this.toggleFavoriteCurrent());

        // Scrubbing on Fullscreen Seek Track
        this.dom.fsSeekTrack.addEventListener('click', (e) => {
            const rect = this.dom.fsSeekTrack.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            this.seekToPercent(Math.max(0, Math.min(1, pos)));
        });

        // Volume slider
        this.dom.fsVolumeSlider.addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });

        // Fullscreen Extra Toggles
        this.dom.fsBtnToggleLyricsView.addEventListener('click', () => this.toggleLyricsView());
        this.dom.fsBtnToggleVisualizer.addEventListener('click', () => {
            this.isVisualizerActive = !this.isVisualizerActive;
            this.dom.fsBtnToggleVisualizer.classList.toggle('active', this.isVisualizerActive);
        });
        this.dom.fsBtnEqModal.addEventListener('click', () => this.openEqModal());
        this.dom.fsBtnOpenQueue.addEventListener('click', () => this.toggleQueueDrawer(true));
        this.dom.fsBtnDownload.addEventListener('click', () => this.downloadCurrentTrack());

        // Queue Drawer
        if (this.dom.miniBtnQueue) {
            this.dom.miniBtnQueue.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleQueueDrawer();
            });
        }
        if (this.dom.fsBtnOpenQueue) {
            this.dom.fsBtnOpenQueue.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleQueueDrawer();
            });
        }
        if (this.dom.btnToggleQueue) {
            this.dom.btnToggleQueue.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleQueueDrawer();
            });
        }
        if (this.dom.btnCloseQueue) {
            this.dom.btnCloseQueue.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleQueueDrawer(false);
            });
        }
        if (this.dom.queueBackdrop) {
            this.dom.queueBackdrop.addEventListener('click', () => {
                this.toggleQueueDrawer(false);
            });
        }
        if (this.dom.btnClearQueue) {
            this.dom.btnClearQueue.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearQueue();
            });
        }

        // Modals (EQ, Playlist, Timer)
        this.dom.btnOpenEq.addEventListener('click', () => this.openEqModal());
        this.dom.quickEqBtn.addEventListener('click', () => this.openEqModal());
        this.dom.btnCloseEq.addEventListener('click', () => this.closeEqModal());

        this.dom.btnCreatePlaylistSidebar.addEventListener('click', () => this.openPlaylistModal());
        this.dom.btnCreatePlaylistLib.addEventListener('click', () => this.openPlaylistModal());
        this.dom.btnClosePlModal.addEventListener('click', () => this.closePlaylistModal());
        this.dom.btnCancelNewPl.addEventListener('click', () => this.closePlaylistModal());
        this.dom.btnSaveNewPl.addEventListener('click', () => this.saveNewPlaylist());

        this.dom.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.dom.colorSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
        });

        this.dom.btnOpenTimer.addEventListener('click', () => this.openTimerModal());
        this.dom.btnCloseTimer.addEventListener('click', () => this.closeTimerModal());
        this.dom.timerOptBtns.forEach(btn => {
            btn.addEventListener('click', () => this.setSleepTimer(btn.dataset.minutes));
        });

        // Hero Button Actions
        const heroPlayBtn = document.getElementById('btn-hero-play');
        if (heroPlayBtn) {
            heroPlayBtn.addEventListener('click', () => {
                const firstCard = document.querySelector('.quick-picks-grid .track-row-card');
                if (firstCard) firstCard.click();
            });
        }
        const heroExploreBtn = document.getElementById('btn-hero-explore');
        if (heroExploreBtn) {
            heroExploreBtn.addEventListener('click', () => {
                document.getElementById('genres-grid').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Library shortcuts
        this.dom.cardOpenFavorites.addEventListener('click', () => this.switchView('favorites'));
        this.dom.cardOpenHistory.addEventListener('click', () => this.switchView('history'));
        this.dom.btnClearHistory.addEventListener('click', () => this.clearHistory());
        this.dom.btnPlayAllFavs.addEventListener('click', () => this.playAllFavorites(false));
        this.dom.btnShuffleFavs.addEventListener('click', () => this.playAllFavorites(true));

        // Listen Together
        this.dom.btnCreateRoom.addEventListener('click', () => this.createRoom());
        this.dom.btnJoinRoom.addEventListener('click', () => this.joinRoom());
        this.dom.btnLeaveRoom.addEventListener('click', () => this.leaveRoom());
        this.dom.activeRoomPill.addEventListener('click', () => this.switchView('rooms'));

        // Keyboard Shortcuts (Space for Play/Pause, Arrows, etc.)
        this.setupKeyboardShortcuts();
    }

    /**
     * Global Keyboard Shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const activeEl = document.activeElement;
            const isTyping = activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'TEXTAREA' ||
                activeEl.tagName === 'SELECT' ||
                activeEl.isContentEditable
            );

            // If user is currently typing in an input field, do not capture player shortcuts
            if (isTyping) {
                if (e.key === 'Escape') {
                    activeEl.blur();
                }
                return;
            }

            // Spacebar: Toggle Play / Pause
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault(); // Prevent page scroll down
                if (activeEl && activeEl.tagName === 'BUTTON') {
                    activeEl.blur();
                }
                this.togglePlay();
                return;
            }

            // Escape: Close open modals, drawers, or fullscreen player
            if (e.key === 'Escape') {
                if (this.dom.eqModal && this.dom.eqModal.classList.contains('open')) {
                    this.closeEqModal();
                } else if (this.dom.playlistModal && this.dom.playlistModal.classList.contains('open')) {
                    this.closePlaylistModal();
                } else if (this.dom.timerModal && this.dom.timerModal.classList.contains('open')) {
                    this.closeTimerModal();
                } else if (this.dom.queueDrawer && this.dom.queueDrawer.classList.contains('open')) {
                    this.toggleQueueDrawer(false);
                } else if (this.dom.fsPlayer && this.dom.fsPlayer.classList.contains('open')) {
                    this.closeFullscreenPlayer();
                }
                return;
            }

            // Arrow Left: Seek backward 5s (Shift+ArrowLeft: Prev Track)
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.prevTrack();
                } else {
                    this.seekRelative(-5);
                }
                return;
            }

            // Arrow Right: Seek forward 5s (Shift+ArrowRight: Next Track)
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.nextTrack();
                } else {
                    this.seekRelative(5);
                }
                return;
            }

            // Arrow Up: Volume Up (+5%)
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.adjustVolume(0.05);
                return;
            }

            // Arrow Down: Volume Down (-5%)
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.adjustVolume(-0.05);
                return;
            }

            // Key 'k' or 'K': Toggle Play / Pause
            if (e.key === 'k' || e.key === 'K') {
                e.preventDefault();
                this.togglePlay();
                return;
            }

            // Key 'j' or 'J': Seek backward 10s
            if (e.key === 'j' || e.key === 'J') {
                e.preventDefault();
                this.seekRelative(-10);
                return;
            }

            // Key 'l' or 'L': Seek forward 10s
            if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                this.seekRelative(10);
                return;
            }

            // Key 'm' or 'M': Toggle Mute
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                this.toggleMute();
                return;
            }

            // Key 'f' or 'F': Fullscreen Player toggle
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                this.toggleFullscreenPlayer();
                return;
            }

            // Key 'c' or 'C': Toggle Lyrics view
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                this.toggleLyricsView();
                return;
            }

            // Key 'q' or 'Q': Toggle Playing Queue Drawer
            if (e.key === 'q' || e.key === 'Q') {
                e.preventDefault();
                this.toggleQueueDrawer();
                return;
            }

            // Key 'n' or 'N': Next Track
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                this.nextTrack();
                return;
            }

            // Key 'p' or 'P': Previous Track
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.prevTrack();
                return;
            }
        });
    }

    /**
     * View Router
     */
    switchView(viewName) {
        this.dom.viewPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `view-${viewName}`);
        });

        this.dom.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        window.location.hash = viewName;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile sidebar on navigate
        if (this.dom.mainSidebar) {
            this.dom.mainSidebar.classList.remove('mobile-open');
        }

        // Re-render Lucide icons
        if (window.lucide) lucide.createIcons();
    }

    checkUrlRoute() {
        const hash = window.location.hash.replace('#', '') || 'discover';
        this.switchView(hash);
    }

    /**
     * Setup Audio Event Listeners (HTML5)
     */
    setupAudioListeners() {
        this.audio.addEventListener('waiting', () => {
            this.setBuffering(true);
        });

        this.audio.addEventListener('playing', () => {
            this.setBuffering(false);
            this.isPlaying = true;
            this.updatePlayStateUI();
            this.broadcastRoomSync();
        });

        this.audio.addEventListener('canplay', () => {
            this.setBuffering(false);
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayStateUI();
            this.broadcastRoomSync();
        });

        this.audio.addEventListener('pause', () => {
            this.setBuffering(false);
            this.isPlaying = false;
            this.updatePlayStateUI();
            this.broadcastRoomSync();
        });

        this.audio.addEventListener('timeupdate', () => {
            if (!this.useYouTubeEngine) {
                this.updateProgress(this.audio.currentTime, this.audio.duration);
                this.updateLyricsSync(this.audio.currentTime);
            }
        });

        this.audio.addEventListener('progress', () => {
            if (this.audio.buffered.length > 0 && this.audio.duration) {
                const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
                const percent = (bufferedEnd / this.audio.duration) * 100;
                this.dom.fsSeekBuffered.style.width = `${percent}%`;
            }
        });

        this.audio.addEventListener('ended', () => {
            if (this.repeatMode === 'one') {
                this.audio.currentTime = 0;
                this.audio.play();
            } else {
                this.nextTrack();
            }
        });

        this.audio.addEventListener('error', (e) => {
            console.warn('HTML5 Audio encountered an error, activating YouTube failover engine...', e);
            if (this.currentTrack) {
                this.playViaYouTubeEngine(this.currentTrack);
            }
        });
    }    /**
     * Setup Universal YouTube Streaming Engine
     */
    setupYouTubeAPI() {
        // 1. Universal postMessage listener for YouTube embed iframe state sync & automatic unmute
        window.addEventListener('message', (event) => {
            if (!event || typeof event.data !== 'string') return;
            try {
                const data = JSON.parse(event.data);

                // When YouTube iframe reports it is ready, immediately unmute and set full volume!
                if (data.event === 'onReady' || data.event === 'initialDelivery') {
                    this.sendYouTubeCommand('unMute');
                    this.sendYouTubeCommand('setVolume', Math.round((this.audio ? this.audio.volume : 0.8) * 100));
                    this.sendYouTubeCommand('playVideo');
                }

                if (data.event === 'infoDelivery' && data.info) {
                    const info = data.info;
                    if (info.muted === true) {
                        this.sendYouTubeCommand('unMute');
                    }
                    if (typeof info.volume === 'number' && info.volume < 10) {
                        this.sendYouTubeCommand('setVolume', Math.round((this.audio ? this.audio.volume : 0.8) * 100));
                    }
                    if (typeof info.duration === 'number' && info.duration > 0) {
                        this.currentTrackDuration = info.duration;
                    }
                    if (typeof info.currentTime === 'number') {
                        this.currentTrackTime = info.currentTime;
                        const duration = this.currentTrackDuration || (this.currentTrack?.duration ? this.parseDurationSeconds(this.currentTrack.duration) : 180);
                        this.updateProgress(this.currentTrackTime, duration);
                        this.updateLyricsSync(this.currentTrackTime);
                    }
                    if (info.playerState === 1) { // Playing
                        this.isPlaying = true;
                        this.updatePlayStateUI();
                    } else if (info.playerState === 2) { // Paused
                        this.isPlaying = false;
                        this.updatePlayStateUI();
                    } else if (info.playerState === 0) { // Ended
                        if (this.repeatMode === 'one') {
                            this.sendYouTubeCommand('seekTo', [0, true]);
                            this.sendYouTubeCommand('playVideo');
                        } else {
                            this.nextTrack();
                        }
                    }
                }
                // Capture YouTube Embed Errors (150 = Embedding not allowed, 101, 100, 2)
                if (data.event === 'onError' || (data.info && typeof data.info.errorCode === 'number')) {
                    const code = data.info?.errorCode || data.info;
                    console.warn(`[Music Glass] YouTube embed restriction (${code}) on:`, this.currentTrack?.title);
                    if (this.currentTrack) {
                        this.findPlayableAlternative(this.currentTrack);
                    }
                }
            } catch (e) {}
        });

        // 2. Start reliable progress ticker
        this.startYouTubeProgressInterval();
    }

    sendYouTubeCommand(command, args = '') {
        const frame = document.getElementById('yt-stream-iframe') || document.querySelector('#yt-player-container iframe');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: args !== '' ? (Array.isArray(args) ? args : [args]) : []
            }), '*');
        }
    }

    parseDurationSeconds(durStr) {
        if (!durStr) return 180;
        const parts = durStr.split(':').map(Number);
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        return 180;
    }

    startYouTubeProgressInterval() {
        clearInterval(this.ytProgressInterval);
        this.ytProgressInterval = setInterval(() => {
            if (this.useYouTubeEngine && this.isPlaying) {
                // Request live info from YouTube iframe
                this.sendYouTubeCommand('listening');
                // Increment fallback time smoothly
                this.currentTrackTime = (this.currentTrackTime || 0) + 0.25;
                const duration = this.currentTrackDuration || (this.currentTrack?.duration ? this.parseDurationSeconds(this.currentTrack.duration) : 180);
                this.updateProgress(this.currentTrackTime, duration);
                this.updateLyricsSync(this.currentTrackTime);
            }
        }, 250);
    }

    playViaYouTubeEngine(track) {
        this.useYouTubeEngine = true;
        this.audio.pause();

        this.currentTrackTime = 0;
        this.currentTrackDuration = track.duration ? this.parseDurationSeconds(track.duration) : 180;

        const embedUrl = `https://www.youtube.com/embed/${track.id}?autoplay=1&mute=0&controls=1&playsinline=1`;
        const iframe = document.getElementById('yt-stream-iframe');
        const container = document.getElementById('yt-player-container');

        if (iframe) {
            iframe.src = embedUrl;
        } else if (container) {
            container.innerHTML = `
                <iframe 
                    id="yt-stream-iframe"
                    src="${embedUrl}"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    style="width: 100%; height: 100%; border: 0;"
                ></iframe>
            `;
        }

        // Send unMute, setVolume, and play commands in staggered sequence
        [100, 300, 700, 1500].forEach(delay => {
            setTimeout(() => {
                this.sendYouTubeCommand('unMute');
                this.sendYouTubeCommand('setVolume', Math.round((this.audio ? this.audio.volume : 0.8) * 100));
                this.sendYouTubeCommand('loadVideoById', track.id);
                this.sendYouTubeCommand('playVideo');

                // Force direct hardware unmute via Electron C++ WebFrameMain API
                if (window.electronAPI && typeof window.electronAPI.forceUnmute === 'function') {
                    window.electronAPI.forceUnmute(this.audio ? this.audio.volume : 1.0);
                }
            }, delay);
        });

        this.isPlaying = true;
        this.updatePlayStateUI();
    }

    /**
     * Smart Alternative Finder for restricted / unplayable songs
     */
    async findPlayableAlternative(track) {
        if (track._triedAlternative) {
            this.showNotification(`Lagu "${track.title}" dibatasi oleh label musik. Memutar lagu berikutnya...`, 'info');
            setTimeout(() => this.nextTrack(), 1200);
            return;
        }
        track._triedAlternative = true;

        console.log(`[Music Glass] Searching playable alternative for "${track.title}"...`);
        this.showNotification(`Mencari versi audio alternatif untuk "${track.title}"...`, 'info');

        try {
            const query = encodeURIComponent(`${track.title} ${track.artist || ''} audio`);
            const res = await fetch(`/api/music/search?q=${query}`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                // Pick best matching alternative with different video ID
                const alt = data.results.find(item => item.id !== track.id) || data.results[0];
                if (alt && alt.id !== track.id) {
                    console.log(`[Music Glass] Playing alternative ID: ${alt.id} for "${track.title}"`);
                    alt._triedAlternative = true;
                    alt.title = track.title;
                    alt.artist = track.artist;
                    alt.thumbnail = track.thumbnail || alt.thumbnail;
                    this.currentTrack = alt;
                    this.playViaYouTubeEngine(alt);
                    return;
                }
            }
        } catch (err) {}

        this.showNotification(`Lagu "${track.title}" tidak tersedia di wilayah ini. Memutar lagu berikutnya...`, 'info');
        setTimeout(() => this.nextTrack(), 1200);
    }  /**
     * Initialize Web Audio API for 10-Band Equalizer & Visualizer
     */
    initAudioContext() {
        if (this.isAudioCtxInitialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 128;
            this.analyser.smoothingTimeConstant = 0.8;

            this.isAudioCtxInitialized = true;
        } catch (e) {
            console.warn('Web Audio API could not be initialized:', e);
        }
    }

    /**
     * Play Track with Instant Zero-Lag Playback
     */
    async playTrack(track, addToQueue = true) {
        if (!track || !track.id) return;

        this.currentTrack = track;
        this.updateTrackMetaUI(track);

        if (addToQueue) {
            this.addToHistory(track);
            // Check if track is in queue
            const idx = this.queue.findIndex(t => t.id === track.id);
            if (idx !== -1) {
                this.queueIndex = idx;
            } else {
                this.queue.push(track);
                this.queueIndex = this.queue.length - 1;
            }
            this.updateQueueUI();
        }

        // Save State Persistently for Seamless Page Reloads
        this.savePlaybackState();

        // Fetch Synced Lyrics in background
        this.fetchLyrics(track);

        // Extract and Apply Ambient Album Art Color Palette
        this.extractAlbumColors(track.thumbnail);

        // Immediately pause existing audio before loading new track
        if (this.audio) {
            this.audio.pause();
        }

        // Trigger Instant Liquid Glass Buffering State & Shimmer Animation
        this.setBuffering(true);
        this.updateProgress(0, 0);

        // Fetch and play direct native master audio stream
        fetch(`/api/music/stream/${track.id}`)
            .then(res => res.json())
            .then(streamData => {
                if (streamData && streamData.success && streamData.primaryUrl && this.currentTrack?.id === track.id) {
                    this.audio.src = streamData.primaryUrl;
                    this.useYouTubeEngine = false;
                    this.audio.play().then(() => {
                        this.setBuffering(false);
                        this.isPlaying = true;
                        this.updatePlayStateUI();
                    }).catch(() => {
                        this.setBuffering(false);
                    });
                } else {
                    this.setBuffering(false);
                }
            })
            .catch(() => {
                this.setBuffering(false);
            });
    }

    setBuffering(isBuffering) {
        this.isBuffering = isBuffering;
        document.body.classList.toggle('is-buffering', isBuffering);

        const nowPlayingTag = document.querySelector('.fs-now-playing-tag');
        if (nowPlayingTag) {
            nowPlayingTag.textContent = isBuffering ? '✦ MEMUAT AUDIO...' : 'NOW STREAMING';
        }

        this.updatePlayStateUI();
    }

    togglePlay() {

        // If no track loaded, try to play first song in queue or quick picks
        if (!this.currentTrack) {
            if (this.queue.length > 0) {
                this.playTrack(this.queue[0], false);
                return;
            }
            const firstCard = document.querySelector('.quick-picks-grid .track-row-card') || document.querySelector('.track-card');
            if (firstCard) {
                firstCard.click();
                return;
            }
        }

        if (this.audio) {
            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
            } else {
                if (!this.audio.src && this.currentTrack) {
                    this.playTrack(this.currentTrack, false);
                } else if (this.audio.src) {
                    this.audio.play().then(() => {
                        this.isPlaying = true;
                    }).catch(() => {});
                    this.isPlaying = true;
                }
            }
            this.updatePlayStateUI();
        }
    }

    prevTrack() {
        if (this.queue.length === 0) return;
        const currentTime = this.audio ? this.audio.currentTime : 0;

        if (currentTime > 3) {
            this.seekToPercent(0);
            return;
        }
        let nextIdx = this.queueIndex - 1;
        if (nextIdx < 0) nextIdx = this.queue.length - 1;
        this.queueIndex = nextIdx;
        this.playTrack(this.queue[this.queueIndex], false);
    }

    async nextTrack() {
        if (this.queue.length === 0 && this.currentTrack) {
            this.queue = [this.currentTrack];
            this.queueIndex = 0;
        }
        if (this.queue.length === 0) return;

        let nextIdx = this.queueIndex + 1;
        if (nextIdx < this.queue.length) {
            this.queueIndex = nextIdx;
            this.playTrack(this.queue[this.queueIndex], false);
            return;
        }

        // Reached end of queue
        if (this.repeatMode === 'all') {
            this.queueIndex = 0;
            this.playTrack(this.queue[0], false);
            return;
        }

        // Autoplay Up-Next / Recommended tracks automatically
        try {
            const query = this.currentTrack?.artist || this.currentTrack?.title || 'Trending Music';
            const resp = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&filter=songs`);
            const data = await resp.json();
            const recs = (data.results || []).filter(r => r.id && !this.queue.some(q => q.id === r.id));
            if (recs.length > 0) {
                this.queue.push(...recs);
                this.queueIndex = nextIdx;
                this.updateQueueUI();
                this.playTrack(this.queue[this.queueIndex], false);
                return;
            }
        } catch (e) {
            console.warn('Autoplay fetch failed:', e);
        }

        // Loop back to first song if no new recommendations
        this.queueIndex = 0;
        this.playTrack(this.queue[0], false);
    }

    seekToPercent(pos) {
        const duration = this.currentTrackDuration || (this.currentTrack?.duration ? this.parseDurationSeconds(this.currentTrack.duration) : 180);
        const targetSeconds = (pos / 100) * duration;

        if (this.useYouTubeEngine) {
            this.sendYouTubeCommand('seekTo', [targetSeconds, true]);
            this.currentTrackTime = targetSeconds;
            this.updateProgress(targetSeconds, duration);
            this.updateLyricsSync(targetSeconds);
        } else if (this.audio && this.audio.duration) {
            this.audio.currentTime = (pos / 100) * this.audio.duration;
        }
    }

    seekRelative(seconds) {
        const duration = this.currentTrackDuration || (this.currentTrack?.duration ? this.parseDurationSeconds(this.currentTrack.duration) : 180);
        const cur = this.currentTrackTime || (this.audio ? this.audio.currentTime : 0) || 0;
        const target = Math.max(0, Math.min(duration || Infinity, cur + seconds));

        if (this.useYouTubeEngine) {
            this.sendYouTubeCommand('seekTo', [target, true]);
            this.currentTrackTime = target;
            this.updateProgress(target, duration);
            this.updateLyricsSync(target);
        } else if (this.audio) {
            this.audio.currentTime = target;
        }
    }

    setVolume(val) {
        this.audio.volume = val;
        this.sendYouTubeCommand('setVolume', [Math.round(val * 100)]);
        if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
            this.ytPlayer.setVolume(val * 100);
        }
        const volIcon = document.getElementById('vol-icon');
        if (volIcon) {
            if (val === 0) volIcon.setAttribute('data-lucide', 'volume-x');
            else if (val < 0.5) volIcon.setAttribute('data-lucide', 'volume-1');
            else volIcon.setAttribute('data-lucide', 'volume-2');
            if (window.lucide) lucide.createIcons();
        }
    }

    adjustVolume(delta) {
        let cur = this.audio ? this.audio.volume : 0.8;
        let newVol = Math.max(0, Math.min(1, Math.round((cur + delta) * 100) / 100));
        this.setVolume(newVol);
        if (this.dom.fsVolumeSlider) {
            this.dom.fsVolumeSlider.value = newVol;
        }
    }

    toggleMute() {
        let cur = this.audio ? this.audio.volume : 0.8;
        if (cur > 0) {
            this.lastUnmutedVolume = cur;
            this.setVolume(0);
            if (this.dom.fsVolumeSlider) this.dom.fsVolumeSlider.value = 0;
        } else {
            const restoreVol = this.lastUnmutedVolume || 0.8;
            this.setVolume(restoreVol);
            if (this.dom.fsVolumeSlider) this.dom.fsVolumeSlider.value = restoreVol;
        }
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.dom.fsBtnShuffle.classList.toggle('active', this.isShuffle);
        if (this.isShuffle) {
            this.originalQueue = [...this.queue];
            // Fisher-Yates shuffle keeping current track at index 0
            const rest = this.queue.filter((_, i) => i !== this.queueIndex);
            for (let i = rest.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rest[i], rest[j]] = [rest[j], rest[i]];
            }
            this.queue = [this.currentTrack, ...rest];
            this.queueIndex = 0;
        } else {
            if (this.originalQueue.length > 0) {
                this.queue = [...this.originalQueue];
                this.queueIndex = this.queue.findIndex(t => t.id === this.currentTrack?.id);
            }
        }
        this.updateQueueUI();
    }

    toggleRepeat() {
        if (this.repeatMode === 'off') {
            this.repeatMode = 'all';
            this.dom.fsBtnRepeat.classList.add('active');
            this.dom.repeatOneIndicator.classList.remove('active');
        } else if (this.repeatMode === 'all') {
            this.repeatMode = 'one';
            this.dom.fsBtnRepeat.classList.add('active');
            this.dom.repeatOneIndicator.classList.add('active');
        } else {
            this.repeatMode = 'off';
            this.dom.fsBtnRepeat.classList.remove('active');
            this.dom.repeatOneIndicator.classList.remove('active');
        }
    }    /**
     * UI Updates
     */
    updatePlayStateUI() {
        const playSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`;
        const pauseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect width="4" height="16" x="6" y="4" rx="1"></rect><rect width="4" height="16" x="14" y="4" rx="1"></rect></svg>`;
        const bufferSvg = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.15)" stroke-width="2.5" fill="none"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#9333ea" stroke-linecap="round"/></svg>`;

        let iconHtml = this.isPlaying ? pauseSvg : playSvg;
        if (this.isBuffering) {
            iconHtml = bufferSvg;
        }

        if (this.dom.miniBtnPlay) {
            this.dom.miniBtnPlay.innerHTML = iconHtml;
        }
        if (this.dom.fsBtnPlay) {
            this.dom.fsBtnPlay.innerHTML = iconHtml;
        }
        
        document.body.classList.toggle('playing', this.isPlaying && !this.isBuffering);
        if (this.dom.fsVinyl) {
            this.dom.fsVinyl.style.animationPlayState = (this.isPlaying || this.isBuffering) ? 'running' : 'paused';
        }

        // Sync with Electron Desktop Process
        if (window.electronAPI) {
            window.electronAPI.sendPlayState(this.isPlaying);
        }
    }

    updateTrackMetaUI(track) {
        this.dom.miniTitle.textContent = track.title || 'Unknown Title';
        this.dom.miniArtist.textContent = track.artist || 'Unknown Artist';
        this.dom.miniThumb.src = track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120';

        this.dom.fsTrackTitle.textContent = track.title || 'Unknown Title';
        this.dom.fsTrackArtist.textContent = track.artist || 'Unknown Artist';
        this.dom.fsAlbumName.textContent = track.album || 'YouTube Music Stream';
        this.dom.fsCoverImg.src = track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';

        // Update favorite icons
        const isFav = this.favorites.has(track.id);
        this.dom.miniBtnFav.classList.toggle('active', isFav);
        this.dom.fsBtnFav.classList.toggle('active', isFav);

        // Update MediaSession for OS / lockscreen controls
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                album: track.album || 'Convx Liquid Glass',
                artwork: [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
        }

        // Sync with Electron Desktop Process (Window title & system tray)
        if (window.electronAPI) {
            window.electronAPI.sendTrackUpdate({
                title: track.title,
                artist: track.artist,
                album: track.album,
                thumbnail: track.thumbnail,
                isPlaying: this.isPlaying
            });
        }
    }

    updateProgress(current, duration) {
        if (!duration || isNaN(duration)) return;
        const percent = (current / duration) * 100;
        this.dom.miniProgressFill.style.width = `${percent}%`;
        this.dom.fsSeekFill.style.width = `${percent}%`;
        this.dom.fsSeekHandle.style.left = `${percent}%`;

        this.dom.fsTimeCurrent.textContent = this.formatTime(current);
        this.dom.fsTimeTotal.textContent = this.formatTime(duration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60) || 0;
        const secs = Math.floor(seconds % 60) || 0;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    /**
     * Color Extraction for Dynamic Ambient Glow Mesh
     */
    extractAlbumColors(imageUrl) {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 10;
                canvas.height = 10;
                ctx.drawImage(img, 0, 0, 10, 10);
                const data = ctx.getImageData(0, 0, 10, 10).data;

                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    // Skip extreme bright/dark
                    const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                    if (brightness > 20 && brightness < 235) {
                        r += data[i];
                        g += data[i+1];
                        b += data[i+2];
                        count++;
                    }
                }
                if (count > 0) {
                    r = Math.floor(r / count);
                    g = Math.floor(g / count);
                    b = Math.floor(b / count);
                } else {
                    r = 139; g = 92; b = 246;
                }

                // Apply dynamically
                const rgb = `${r}, ${g}, ${b}`;
                document.documentElement.style.setProperty('--ambient-accent', `rgb(${rgb})`);
                this.dom.ambientGlow.style.background = `radial-gradient(circle at center, rgba(${rgb}, 0.3) 0%, rgba(${rgb}, 0.08) 50%, transparent 80%)`;
                this.dom.fsAmbientMesh.style.background = `radial-gradient(circle at 30% 30%, rgba(${rgb}, 0.45) 0%, rgba(10, 10, 15, 0.95) 75%)`;
                this.dom.fsArtGlow.style.background = `radial-gradient(circle, rgba(${rgb}, 0.55) 0%, transparent 70%)`;
            } catch (e) {
                // Ignore canvas security errors on some external CORS domains
            }
        };
    }

    /**
     * Karaoke Synced Lyrics Engine
     */
    async fetchLyrics(track) {
        this.currentLyrics = [];
        this.activeLyricIndex = -1;
        this.dom.fsLyricsScroller.innerHTML = `
            <div class="lyrics-empty">
                <i data-lucide="loader-2" class="pulse-icon search-spinner active" style="display:inline-block;width:32px;height:32px;"></i>
                <p>Loading live synced lyrics...</p>
            </div>
        `;

        try {
            let durSec = '';
            if (track.duration && typeof track.duration === 'string') {
                const parts = track.duration.split(':').map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    durSec = parts[0] * 60 + parts[1];
                } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
                    durSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                }
            }

            const url = `/api/music/lyrics?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist || '')}${durSec ? `&duration=${durSec}` : ''}`;
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.found && data.isSynced && data.synced.length > 0) {
                this.currentLyrics = data.synced;
                this.renderSyncedLyrics(data.synced);
            } else if (data.plain) {
                this.dom.fsLyricsScroller.innerHTML = `
                    <div class="lyrics-plain-text" style="white-space: pre-line; line-height: 2.2; font-size: 1.15rem; color: #e2e8f0; padding: 20px; font-weight: 500;">
                        ${data.plain}
                    </div>
                `;
            } else {
                this.dom.fsLyricsScroller.innerHTML = `
                    <div class="lyrics-empty">
                        <i data-lucide="mic-off" class="pulse-icon"></i>
                        <p>No lyrics found for this track.</p>
                    </div>
                `;
            }
        } catch (e) {
            this.dom.fsLyricsScroller.innerHTML = `
                <div class="lyrics-empty">
                    <i data-lucide="alert-circle" class="pulse-icon"></i>
                    <p>Could not fetch lyrics.</p>
                </div>
            `;
        }
        if (window.lucide) lucide.createIcons();
    }

    renderSyncedLyrics(lines) {
        this.dom.fsLyricsScroller.innerHTML = lines.map((line, idx) => `
            <div class="lyric-line" data-index="${idx}" data-time="${line.time}">
                ${line.text || '♪'}
            </div>
        `).join('');

        // Add Click-to-Seek on any lyric line
        this.dom.fsLyricsScroller.querySelectorAll('.lyric-line').forEach(el => {
            el.addEventListener('click', () => {
                const targetTime = parseFloat(el.dataset.time);
                if (!isNaN(targetTime)) {
                    if (this.useYouTubeEngine && this.ytPlayer) {
                        this.ytPlayer.seekTo(targetTime, true);
                    } else {
                        this.audio.currentTime = targetTime;
                    }
                }
            });
        });
    }

    updateLyricsSync(currentTime) {
        if (!this.currentLyrics || this.currentLyrics.length === 0) return;

        let activeIdx = -1;
        for (let i = 0; i < this.currentLyrics.length; i++) {
            if (currentTime >= this.currentLyrics[i].time) {
                activeIdx = i;
            } else {
                break;
            }
        }

        if (activeIdx !== this.activeLyricIndex && activeIdx !== -1) {
            this.activeLyricIndex = activeIdx;
            const lines = this.dom.fsLyricsScroller.querySelectorAll('.lyric-line');
            lines.forEach((line, idx) => {
                line.classList.toggle('active', idx === activeIdx);
            });

            // Auto-scroll smooth centering
            const activeEl = lines[activeIdx];
            if (activeEl) {
                const scroller = this.dom.fsLyricsScroller;
                const offset = activeEl.offsetTop - (scroller.clientHeight / 2) + (activeEl.clientHeight / 2);
                scroller.scrollTo({ top: offset, behavior: 'smooth' });
            }
        }
    }

    /**
     * Web Audio API 60FPS Canvas Visualizer
     */
    startVisualizer() {
        const canvas = this.dom.fsCanvasVisualizer;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const renderFrame = () => {
            requestAnimationFrame(renderFrame);

            if (!this.isVisualizerActive || !this.isPlaying || !this.analyser) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barCount = 36;
            const barWidth = (canvas.width / barCount) - 3;
            let x = 0;

            for (let i = 0; i < barCount; i++) {
                const binIndex = Math.floor(i * (bufferLength / barCount));
                const barHeight = (dataArray[binIndex] / 255) * canvas.height * 0.9;

                const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
                grad.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
                grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.8)');
                grad.addColorStop(1, '#ffffff');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
                ctx.fill();

                x += barWidth + 3;
            }
        };

        renderFrame();
    }

    /**
     * Equalizer UI Builder & Presets
     */
    buildEqualizerUI() {
        this.dom.eqSlidersContainer.innerHTML = this.eqFrequencies.map((freq, i) => `
            <div class="eq-band-col">
                <span class="eq-gain-val" id="eq-val-${i}">0dB</span>
                <input type="range" class="eq-slider-vertical" min="-12" max="12" step="0.5" value="0" data-band="${i}">
                <span class="eq-freq-label">${freq >= 1000 ? (freq/1000)+'k' : freq}</span>
            </div>
        `).join('');

        this.dom.eqSlidersContainer.querySelectorAll('.eq-slider-vertical').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const bandIndex = parseInt(e.target.dataset.band);
                const gain = parseFloat(e.target.value);
                this.setEqGain(bandIndex, gain);
                document.getElementById(`eq-val-${bandIndex}`).textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
            });
        });

        this.dom.eqPresetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.eqPresetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyEqPreset(btn.dataset.preset);
            });
        });
    }

    setEqGain(bandIndex, gain) {
        if (this.eqFilters[bandIndex]) {
            this.eqFilters[bandIndex].gain.value = gain;
        }
    }

    applyEqPreset(presetName) {
        const gains = this.eqPresets[presetName] || this.eqPresets.flat;
        const sliders = this.dom.eqSlidersContainer.querySelectorAll('.eq-slider-vertical');
        gains.forEach((gain, i) => {
            if (sliders[i]) {
                sliders[i].value = gain;
                document.getElementById(`eq-val-${i}`).textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
                this.setEqGain(i, gain);
            }
        });
    }

    /**
     * Fullscreen Modal Transitions
     */
    openFullscreenPlayer() {
        this.dom.fsPlayer.classList.add('open');
    }

    closeFullscreenPlayer() {
        this.dom.fsPlayer.classList.remove('open');
    }

    toggleFullscreenPlayer() {
        if (this.dom.fsPlayer.classList.contains('open')) {
            this.closeFullscreenPlayer();
        } else {
            this.openFullscreenPlayer();
        }
    }

    toggleLyricsView(forceOpen = null) {
        const isCurrentlyOpen = this.dom.fsPlayer.classList.contains('lyrics-open');
        const nextState = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

        this.dom.fsPlayer.classList.toggle('lyrics-open', nextState);
        this.dom.fsBtnToggleLyricsView.classList.toggle('active', nextState);

        if (nextState) {
            setTimeout(() => {
                const activeEl = this.dom.fsLyricsScroller.querySelector('.lyric-line.active');
                if (activeEl) {
                    const scroller = this.dom.fsLyricsScroller;
                    const offset = activeEl.offsetTop - (scroller.clientHeight / 2) + (activeEl.clientHeight / 2);
                    scroller.scrollTo({ top: offset, behavior: 'smooth' });
                }
            }, 300);
        }
    }

    toggleQueueDrawer(forceOpen = null) {
        if (!this.dom.queueDrawer) return;
        const isOpen = this.dom.queueDrawer.classList.contains('open');
        const nextState = forceOpen !== null ? forceOpen : !isOpen;
        this.dom.queueDrawer.classList.toggle('open', nextState);
        if (this.dom.queueBackdrop) {
            this.dom.queueBackdrop.classList.toggle('open', nextState);
        }
        if (this.dom.fsBtnOpenQueue) {
            this.dom.fsBtnOpenQueue.classList.toggle('active', nextState);
        }
        if (this.dom.miniBtnQueue) {
            this.dom.miniBtnQueue.classList.toggle('active', nextState);
        }
        if (nextState) {
            this.updateQueueUI();
        }
    }

    openEqModal() {
        this.dom.eqModal.classList.add('open');
    }

    closeEqModal() {
        this.dom.eqModal.classList.remove('open');
    }

    openPlaylistModal() {
        this.dom.playlistModal.classList.add('open');
        this.dom.newPlName.focus();
    }

    closePlaylistModal() {
        this.dom.playlistModal.classList.remove('open');
        this.dom.newPlName.value = '';
        this.dom.newPlDesc.value = '';
    }

    openTimerModal() {
        this.dom.timerModal.classList.add('open');
    }

    closeTimerModal() {
        this.dom.timerModal.classList.remove('open');
    }

    setSleepTimer(minutes) {
        clearTimeout(this.sleepTimer);
        clearInterval(this.sleepInterval);

        if (minutes === 'off') {
            this.dom.timerActiveLabel.classList.add('hidden');
            this.closeTimerModal();
            return;
        }

        if (minutes === 'end_of_track') {
            this.dom.timerActiveLabel.textContent = 'Playback will stop after current track.';
            this.dom.timerActiveLabel.classList.remove('hidden');
            return;
        }

        const mins = parseInt(minutes);
        this.sleepTimeEnd = Date.now() + (mins * 60 * 1000);
        this.dom.timerActiveLabel.classList.remove('hidden');

        this.sleepInterval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((this.sleepTimeEnd - Date.now()) / 1000));
            this.dom.timerCountdown.textContent = `${Math.floor(remaining / 60)}m ${remaining % 60}s remaining`;
            if (remaining <= 0) {
                clearInterval(this.sleepInterval);
                this.togglePlay(); // Pause
                this.dom.timerActiveLabel.classList.add('hidden');
            }
        }, 1000);

        this.closeTimerModal();
    }

    /**
     * Shimmer Skeleton Generators
     */
    getTrackRowSkeletonHTML(count = 6) {
        return Array.from({ length: count }).map(() => `
            <div class="skeleton-track-row">
                <div class="skeleton-thumb skeleton-shimmer"></div>
                <div class="skeleton-info">
                    <div class="skeleton-title skeleton-shimmer"></div>
                    <div class="skeleton-subtitle skeleton-shimmer"></div>
                </div>
                <div class="skeleton-actions">
                    <div class="skeleton-action-btn skeleton-shimmer"></div>
                    <div class="skeleton-action-btn skeleton-shimmer"></div>
                </div>
            </div>
        `).join('');
    }

    getCardSkeletonHTML(count = 5) {
        return Array.from({ length: count }).map(() => `
            <div class="skeleton-music-card">
                <div class="skeleton-card-art skeleton-shimmer"></div>
                <div class="skeleton-card-title skeleton-shimmer"></div>
                <div class="skeleton-card-artist skeleton-shimmer"></div>
            </div>
        `).join('');
    }

    getGenreSkeletonHTML(count = 6) {
        return Array.from({ length: count }).map(() => `
            <div class="skeleton-genre-card skeleton-shimmer"></div>
        `).join('');
    }

    /**
     * Search Execution
     */
    async performSearch(query, filter = 'all') {
        this.dom.searchSpinner.classList.add('active');
        this.dom.searchResultsList.innerHTML = `
            <div class="tracklist-table">
                ${this.getTrackRowSkeletonHTML(8)}
            </div>
        `;
        try {
            const resp = await fetch(`/api/music/search?q=${encodeURIComponent(query)}&filter=${filter}`);
            const data = await resp.json();
            this.renderSearchResults(data.results || []);
        } catch (e) {
            this.dom.searchResultsList.innerHTML = `<div class="empty-state"><h3>Search Error</h3><p>Could not connect to YouTube Music API.</p></div>`;
        }
        this.dom.searchSpinner.classList.remove('active');
    }

    renderSearchResults(results) {
        if (results.length === 0) {
            this.dom.searchResultsList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="frown" class="empty-icon"></i>
                    <h3>No results found</h3>
                    <p>Try searching for a different track title or artist name.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        this.dom.searchResultsList.innerHTML = `
            <div class="tracklist-table">
                ${results.map(track => this.buildTrackRowHTML(track)).join('')}
            </div>
        `;

        this.attachTrackRowEvents(this.dom.searchResultsList);
        if (window.lucide) lucide.createIcons();
    }

    /**
     * Load Explore & Trending Feed
     */
    async loadExploreFeed() {
        // Initial Shimmer Skeleton Loading
        if (this.dom.quickPicksList) this.dom.quickPicksList.innerHTML = this.getTrackRowSkeletonHTML(6);
        if (this.dom.trendingCarousel) this.dom.trendingCarousel.innerHTML = this.getCardSkeletonHTML(5);
        if (this.dom.indonesiaCarousel) this.dom.indonesiaCarousel.innerHTML = this.getCardSkeletonHTML(5);
        if (this.dom.chillCarousel) this.dom.chillCarousel.innerHTML = this.getCardSkeletonHTML(5);
        if (this.dom.workoutCarousel) this.dom.workoutCarousel.innerHTML = this.getCardSkeletonHTML(5);
        if (this.dom.genresGrid) this.dom.genresGrid.innerHTML = this.getGenreSkeletonHTML(6);

        try {
            const resp = await fetch('/api/music/trending');
            const data = await resp.json();

            // Quick Picks
            if (data.quick_picks && this.dom.quickPicksList) {
                this.dom.quickPicksList.innerHTML = data.quick_picks.map(t => this.buildTrackRowHTML(t)).join('');
                this.attachTrackRowEvents(this.dom.quickPicksList);
            }

            // Trending Carousel
            if (data.trending_now && this.dom.trendingCarousel) {
                this.dom.trendingCarousel.innerHTML = data.trending_now.map(t => this.buildMusicCardHTML(t)).join('');
                this.attachMusicCardEvents(this.dom.trendingCarousel);
            }

            // Indo Hits
            if (data.indonesia_hits && this.dom.indonesiaCarousel) {
                this.dom.indonesiaCarousel.innerHTML = data.indonesia_hits.map(t => this.buildMusicCardHTML(t)).join('');
                this.attachMusicCardEvents(this.dom.indonesiaCarousel);
            }

            // Chill Vibes
            if (data.chill_vibes && this.dom.chillCarousel) {
                this.dom.chillCarousel.innerHTML = data.chill_vibes.map(t => this.buildMusicCardHTML(t)).join('');
                this.attachMusicCardEvents(this.dom.chillCarousel);
            }

            // Workout
            if (data.workout_energy && this.dom.workoutCarousel) {
                this.dom.workoutCarousel.innerHTML = data.workout_energy.map(t => this.buildMusicCardHTML(t)).join('');
                this.attachMusicCardEvents(this.dom.workoutCarousel);
            }

            // Bento Genres
            if (data.genres && this.dom.genresGrid) {
                this.dom.genresGrid.innerHTML = data.genres.map(g => `
                    <div class="genre-card" style="background: ${g.color};" data-query="${g.query}">
                        <h3>${g.name}</h3>
                        <i data-lucide="${g.icon}" class="genre-card-icon"></i>
                    </div>
                `).join('');

                this.dom.genresGrid.querySelectorAll('.genre-card').forEach(card => {
                    card.addEventListener('click', () => {
                        this.dom.searchInput.value = card.dataset.query;
                        this.switchView('search');
                        this.performSearch(card.dataset.query, 'songs');
                    });
                });
            }
            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.warn('Could not load explore feed:', e);
        }
    }

    /**
     * Card & Row HTML Templates
     */
    buildTrackRowHTML(track) {
        const isFav = this.favorites.has(track.id);
        const isArtist = track.type === 'artist';

        return `
            <div class="track-row-card ${isArtist ? 'artist-row-card' : ''}" data-track='${JSON.stringify(track).replace(/'/g, "&apos;")}'>
                <div class="track-thumb-wrap" style="${isArtist ? 'border-radius: 50%;' : ''}">
                    <img src="${track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}" class="track-thumb-img" alt="${track.title}">
                    <div class="track-thumb-play-overlay">
                        <i data-lucide="${isArtist ? 'user' : 'play'}" size="20" fill="${isArtist ? 'none' : 'currentColor'}"></i>
                    </div>
                </div>
                <div class="track-info">
                    <div class="track-name">${track.title}</div>
                    <div class="track-artist">
                        ${isArtist ? '<span class="artist-badge-chip">Artist</span> ' : ''}${track.artist || 'Artist'} ${track.duration ? '• ' + track.duration : ''}
                    </div>
                </div>
                <div class="track-more-actions">
                    ${isArtist ? `
                        <button class="btn-primary-glass" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 12px;" title="View Songs">
                            <span>Explore</span>
                        </button>
                    ` : `
                        <button class="track-action-btn btn-fav ${isFav ? 'active' : ''}" data-id="${track.id}" title="Favorite">
                            <i data-lucide="heart" size="18" fill="${isFav ? '#ec4899' : 'none'}"></i>
                        </button>
                        <button class="track-action-btn btn-add-queue" title="Add to Queue">
                            <i data-lucide="list-plus" size="18"></i>
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    buildMusicCardHTML(track) {
        return `
            <div class="music-card" data-track='${JSON.stringify(track).replace(/'/g, "&apos;")}'>
                <div class="music-card-art">
                    <img src="${track.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}" alt="${track.title}">
                    <button class="card-play-fab" title="Play">
                        <i data-lucide="play" size="22" fill="currentColor"></i>
                    </button>
                </div>
                <div class="music-card-title">${track.title}</div>
                <div class="music-card-artist">${track.artist || 'YouTube Music'}</div>
            </div>
        `;
    }

    attachTrackRowEvents(container) {
        const allRows = Array.from(container.querySelectorAll('.track-row-card'));
        allRows.forEach((row, idx) => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.track-more-actions .btn-fav') || e.target.closest('.track-more-actions .btn-add-queue')) return;
                const track = JSON.parse(row.getAttribute('data-track'));
                if (track.type === 'artist') {
                    // Search songs by this artist
                    this.dom.searchInput.value = track.title;
                    this.dom.filterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'songs'));
                    this.performSearch(track.title, 'songs');
                } else {
                    // Populate full list into queue
                    const songTracks = allRows
                        .map(r => {
                            try { return JSON.parse(r.getAttribute('data-track')); } catch (err) { return null; }
                        })
                        .filter(t => t && t.id && t.type !== 'artist');

                    if (songTracks.length > 1) {
                        this.queue = songTracks;
                        this.queueIndex = songTracks.findIndex(t => t.id === track.id);
                        if (this.queueIndex === -1) this.queueIndex = 0;
                        this.updateQueueUI();
                        this.playTrack(track, false);
                    } else {
                        this.playTrack(track, true);
                    }
                }
            });

            const favBtn = row.querySelector('.btn-fav');
            if (favBtn) {
                favBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const track = JSON.parse(row.getAttribute('data-track'));
                    this.toggleFavorite(track, favBtn);
                });
            }

            const queueBtn = row.querySelector('.btn-add-queue');
            if (queueBtn) {
                queueBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const track = JSON.parse(row.getAttribute('data-track'));
                    this.queue.push(track);
                    this.updateQueueUI();
                });
            }
        });
    }

    attachMusicCardEvents(container) {
        const allCards = Array.from(container.querySelectorAll('.music-card'));
        allCards.forEach(card => {
            card.addEventListener('click', () => {
                const track = JSON.parse(card.getAttribute('data-track'));
                const songTracks = allCards
                    .map(c => {
                        try { return JSON.parse(c.getAttribute('data-track')); } catch (err) { return null; }
                    })
                    .filter(t => t && t.id);

                if (songTracks.length > 1) {
                    this.queue = songTracks;
                    this.queueIndex = songTracks.findIndex(t => t.id === track.id);
                    if (this.queueIndex === -1) this.queueIndex = 0;
                    this.updateQueueUI();
                    this.playTrack(track, false);
                } else {
                    this.playTrack(track, true);
                }
            });
        });
    }

    /**
     * Favorites Management
     */
    async loadFavorites() {
        if (this.dom.favsTracklist && this.dom.favsTracklist.children.length === 0) {
            this.dom.favsTracklist.innerHTML = this.getTrackRowSkeletonHTML(6);
        }
        try {
            const resp = await fetch('/api/favorites');
            const data = await resp.json();
            this.favorites = new Set(data.map(f => f.video_id));
            this.dom.favCountBadge.textContent = data.length;
            this.dom.libFavCount.textContent = `${data.length} tracks`;

            if (data.length === 0) {
                this.dom.favsTracklist.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="heart" class="empty-icon"></i>
                        <h3>No favorites yet</h3>
                        <p>Click the heart icon on any track to add it here!</p>
                    </div>
                `;
            } else {
                this.dom.favsTracklist.innerHTML = data.map(f => this.buildTrackRowHTML({
                    id: f.video_id,
                    title: f.title,
                    artist: f.artist,
                    album: f.album,
                    duration: f.duration,
                    thumbnail: f.thumbnail
                })).join('');
                this.attachTrackRowEvents(this.dom.favsTracklist);
            }
            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.warn('Could not load favorites:', e);
        }
    }

    async toggleFavorite(track, btnEl = null) {
        try {
            const resp = await fetch('/api/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: track.id,
                    title: track.title,
                    artist: track.artist || '',
                    album: track.album || '',
                    duration: track.duration || '',
                    thumbnail: track.thumbnail || ''
                })
            });
            const data = await resp.json();
            if (data.favorited) {
                this.favorites.add(track.id);
            } else {
                this.favorites.delete(track.id);
            }
            if (btnEl) {
                btnEl.classList.toggle('active', data.favorited);
            }
            this.loadFavorites();
        } catch (e) {
            console.warn('Could not toggle favorite:', e);
        }
    }

    toggleFavoriteCurrent() {
        if (this.currentTrack) {
            this.toggleFavorite(this.currentTrack);
            const isFav = this.favorites.has(this.currentTrack.id);
            this.dom.miniBtnFav.classList.toggle('active', !isFav);
            this.dom.fsBtnFav.classList.toggle('active', !isFav);
        }
    }

    playAllFavorites(shuffle = false) {
        const rows = this.dom.favsTracklist.querySelectorAll('.track-row-card');
        if (rows.length === 0) return;
        const tracks = Array.from(rows).map(r => JSON.parse(r.getAttribute('data-track')));
        this.queue = shuffle ? tracks.sort(() => Math.random() - 0.5) : tracks;
        this.queueIndex = 0;
        this.playTrack(this.queue[0], false);
        this.updateQueueUI();
    }

    /**
     * History Management
     */
    async loadHistory() {
        if (this.dom.historyTracklist && this.dom.historyTracklist.children.length === 0) {
            this.dom.historyTracklist.innerHTML = this.getTrackRowSkeletonHTML(6);
        }
        try {
            const resp = await fetch('/api/history');
            const data = await resp.json();
            this.dom.libHistoryCount.textContent = `${data.length} tracks`;
            
            if (data.length === 0) {
                this.dom.historyTracklist.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="clock" class="empty-icon"></i>
                        <h3>No listening history</h3>
                        <p>Songs you stream will automatically appear here.</p>
                    </div>
                `;
            } else {
                this.dom.historyTracklist.innerHTML = data.map(h => this.buildTrackRowHTML({
                    id: h.video_id,
                    title: h.title,
                    artist: h.artist,
                    album: h.album,
                    duration: h.duration,
                    thumbnail: h.thumbnail
                })).join('');
                this.attachTrackRowEvents(this.dom.historyTracklist);
            }
            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.warn('Could not load history:', e);
        }
    }

    async addToHistory(track) {
        try {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id: track.id,
                    title: track.title,
                    artist: track.artist || '',
                    album: track.album || '',
                    duration: track.duration || '',
                    thumbnail: track.thumbnail || ''
                })
            });
            this.loadHistory();
        } catch (e) {
            console.warn('History save failed:', e);
        }
    }

    async clearHistory() {
        try {
            await fetch('/api/history', { method: 'DELETE' });
            this.loadHistory();
        } catch (e) {
            console.warn('Clear history failed:', e);
        }
    }

    /**
     * Playlists Management
     */
    async loadPlaylists() {
        if (this.dom.playlistsGrid && this.dom.playlistsGrid.children.length === 0) {
            this.dom.playlistsGrid.innerHTML = this.getCardSkeletonHTML(4);
        }
        try {
            const resp = await fetch('/api/playlists');
            const playlists = await resp.json();
            this.playlists = playlists;

            // Sidebar playlists
            this.dom.sidebarPlaylists.innerHTML = playlists.map(p => `
                <a href="#playlist" class="nav-item" data-playlist-id="${p.id}">
                    <i data-lucide="music" style="color: ${p.color_accent || '#a855f7'};"></i>
                    <span>${p.name}</span>
                </a>
            `).join('');

            // Library playlists grid
            if (playlists.length === 0) {
                this.dom.playlistsGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i data-lucide="list-music" class="empty-icon"></i>
                        <h3>No playlists yet</h3>
                        <p>Create your first custom playlist!</p>
                    </div>
                `;
            } else {
                this.dom.playlistsGrid.innerHTML = playlists.map(p => `
                    <div class="music-card" data-playlist-id="${p.id}">
                        <div class="music-card-art" style="background: linear-gradient(135deg, ${p.color_accent || '#a855f7'}, #09090b); display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="music" size="48" style="color: #ffffff; opacity:0.8;"></i>
                        </div>
                        <div class="music-card-title">${p.name}</div>
                        <div class="music-card-artist">${p.tracks ? p.tracks.length : 0} tracks</div>
                    </div>
                `).join('');
            }

            // Attach playlist click events
            document.querySelectorAll('[data-playlist-id]').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    const plId = el.getAttribute('data-playlist-id');
                    this.openPlaylistDetail(plId);
                });
            });

            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.warn('Could not load playlists:', e);
        }
    }

    async saveNewPlaylist() {
        const name = this.dom.newPlName.value.trim();
        const desc = this.dom.newPlDesc.value.trim();
        const activeSwatch = document.querySelector('.color-swatch.active');
        const color = activeSwatch ? activeSwatch.dataset.color : '#7c3aed';

        if (!name) return;

        try {
            await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: desc, color_accent: color })
            });
            this.closePlaylistModal();
            this.loadPlaylists();
        } catch (e) {
            console.warn('Create playlist failed:', e);
        }
    }

    async openPlaylistDetail(id) {
        this.switchView('playlist-detail');
        const tracklistEl = document.getElementById('playlist-tracklist');
        if (tracklistEl) {
            tracklistEl.innerHTML = this.getTrackRowSkeletonHTML(5);
        }

        try {
            const resp = await fetch(`/api/playlists/${id}`);
            const pl = await resp.json();

            document.getElementById('pl-detail-title').textContent = pl.name;
            document.getElementById('pl-detail-desc').textContent = pl.description || 'Custom playlist created on Convx.';
            document.getElementById('pl-detail-banner').style.background = `linear-gradient(135deg, ${pl.color_accent || '#7c3aed'}66, rgba(14, 14, 20, 0.7))`;
            document.getElementById('pl-detail-cover').style.background = `linear-gradient(135deg, ${pl.color_accent || '#7c3aed'}, #09090b)`;

            if (pl.tracks && pl.tracks.length > 0) {
                tracklistEl.innerHTML = pl.tracks.map(t => this.buildTrackRowHTML({
                    id: t.video_id,
                    title: t.title,
                    artist: t.artist,
                    album: t.album,
                    duration: t.duration,
                    thumbnail: t.thumbnail
                })).join('');
                this.attachTrackRowEvents(tracklistEl);
            } else {
                tracklistEl.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="music" class="empty-icon"></i>
                        <h3>Playlist is empty</h3>
                        <p>Search songs and add them to this playlist!</p>
                    </div>
                `;
            }

            document.getElementById('btn-delete-playlist').onclick = async () => {
                if (confirm(`Delete playlist "${pl.name}"?`)) {
                    await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
                    this.loadPlaylists();
                    this.switchView('library');
                }
            };
            if (window.lucide) lucide.createIcons();
        } catch (e) {
            console.warn('Could not load playlist detail:', e);
        }
    }

    /**
     * Queue Drawer Management
     */
    updateQueueUI() {
        if (this.dom.queueCounterBadge) {
            this.dom.queueCounterBadge.textContent = this.queue.length;
        }

        if (this.dom.queueCurrentItem) {
            if (this.currentTrack) {
                this.dom.queueCurrentItem.innerHTML = `
                    <img src="${this.currentTrack.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}" class="queue-item-thumb" alt="">
                    <div class="queue-item-info">
                        <div class="queue-item-title">${this.currentTrack.title || 'Unknown Title'}</div>
                        <div class="queue-item-artist">${this.currentTrack.artist || 'Unknown Artist'}</div>
                    </div>
                `;
            } else {
                this.dom.queueCurrentItem.innerHTML = `
                    <div class="queue-empty-msg">No track currently playing</div>
                `;
            }
        }

        if (this.dom.queueItemsList) {
            const upNext = this.queue.slice(this.queueIndex + 1);
            if (upNext.length === 0) {
                this.dom.queueItemsList.innerHTML = `
                    <div class="queue-empty-msg">
                        <i data-lucide="music-2" style="width: 24px; height: 24px; opacity: 0.4; margin: 0 auto 8px; display: block;"></i>
                        No songs up next.<br>Autoplay will queue recommendations automatically!
                    </div>
                `;
            } else {
                this.dom.queueItemsList.innerHTML = upNext.map((t, idx) => `
                    <div class="queue-item" data-queue-idx="${this.queueIndex + 1 + idx}">
                        <img src="${t.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120'}" class="queue-item-thumb" alt="${t.title}">
                        <div class="queue-item-info">
                            <div class="queue-item-title">${t.title || 'Untitled Track'}</div>
                            <div class="queue-item-artist">${t.artist || 'Unknown Artist'}</div>
                        </div>
                        <button class="queue-remove-btn" data-remove-idx="${this.queueIndex + 1 + idx}" title="Remove from queue">
                            <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                `).join('');

                this.dom.queueItemsList.querySelectorAll('.queue-item').forEach(el => {
                    el.addEventListener('click', (e) => {
                        if (e.target.closest('.queue-remove-btn')) return;
                        const targetIdx = parseInt(el.getAttribute('data-queue-idx'));
                        if (!isNaN(targetIdx) && this.queue[targetIdx]) {
                            this.queueIndex = targetIdx;
                            this.playTrack(this.queue[this.queueIndex], false);
                        }
                    });
                });

                this.dom.queueItemsList.querySelectorAll('.queue-remove-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const remIdx = parseInt(btn.getAttribute('data-remove-idx'));
                        if (!isNaN(remIdx) && remIdx >= 0 && remIdx < this.queue.length) {
                            this.queue.splice(remIdx, 1);
                            this.updateQueueUI();
                        }
                    });
                });
            }

            if (window.lucide) lucide.createIcons();
        }

        this.savePlaybackState();
    }

    savePlaybackState() {
        try {
            if (this.currentTrack) {
                localStorage.setItem('convx_playback_state', JSON.stringify({
                    track: this.currentTrack,
                    queue: this.queue,
                    queueIndex: this.queueIndex
                }));
            }
        } catch (e) {
            console.warn('Could not save playback state:', e);
        }
    }

    restorePlaybackState() {
        try {
            const saved = localStorage.getItem('convx_playback_state');
            if (saved) {
                const data = JSON.parse(saved);
                if (data && data.track) {
                    this.currentTrack = data.track;
                    this.queue = Array.isArray(data.queue) ? data.queue : [data.track];
                    this.queueIndex = typeof data.queueIndex === 'number' ? data.queueIndex : 0;
                    this.updateTrackMetaUI(this.currentTrack);
                    this.updateQueueUI();
                    this.extractAlbumColors(this.currentTrack.thumbnail);
                }
            }
        } catch (e) {
            console.warn('Could not restore playback state:', e);
        }
    }

    clearQueue() {
        this.queue = this.currentTrack ? [this.currentTrack] : [];
        this.queueIndex = 0;
        this.updateQueueUI();
    }

    /**
     * Download Audio
     */
    downloadCurrentTrack() {
        if (!this.currentTrack) return;
        alert(`Starting download for: ${this.currentTrack.title}`);
        window.open(`https://api.pipedapi.kavin.rocks/streams/${this.currentTrack.id}`, '_blank');
    }

    /**
     * Listen Together Rooms
     */
    async createRoom() {
        const name = this.dom.roomCreateName.value.trim() || 'Convx Lounge';
        try {
            const resp = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, current_track: this.currentTrack })
            });
            const room = await resp.json();
            this.enterRoom(room);
        } catch (e) {
            console.warn('Create room failed:', e);
        }
    }

    async joinRoom() {
        const code = this.dom.roomJoinCode.value.trim().toUpperCase();
        if (code.length !== 6) {
            alert('Please enter a valid 6-character room code.');
            return;
        }
        try {
            const resp = await fetch(`/api/rooms/${code}`);
            const room = await resp.json();
            this.enterRoom(room);
        } catch (e) {
            alert('Room not found or expired.');
        }
    }

    enterRoom(room) {
        this.activeRoom = room;
        this.dom.roomStatusTitle.textContent = room.name;
        this.dom.roomStatusCode.textContent = room.code;
        this.dom.roomActiveStatus.classList.remove('hidden');

        this.dom.activeRoomCode.textContent = room.code;
        this.dom.activeRoomPill.classList.remove('hidden');

        // Start polling room state
        clearInterval(this.roomPollTimer);
        this.roomPollTimer = setInterval(async () => {
            try {
                const resp = await fetch(`/api/rooms/${this.activeRoom.code}`);
                const state = await resp.json();
                if (state.current_track && (!this.currentTrack || this.currentTrack.id !== state.current_track.id)) {
                    this.playTrack(state.current_track, true);
                }
            } catch (err) {}
        }, 3000);
    }

    async broadcastRoomSync() {
        if (!this.activeRoom || !this.currentTrack) return;
        try {
            await fetch(`/api/rooms/${this.activeRoom.code}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_track: this.currentTrack,
                    is_playing: this.isPlaying,
                    seek_time: this.audio.currentTime || 0
                })
            });
        } catch (e) {}
    }

    leaveRoom() {
        clearInterval(this.roomPollTimer);
        this.activeRoom = null;
        this.dom.roomActiveStatus.classList.add('hidden');
        this.dom.activeRoomPill.classList.add('hidden');
    }

    /**
     * ==================== LIQUID GLASS AUTHENTICATION ENGINE ====================
     */
    async initAuth() {
        this.currentUser = null;
        this.pendingVerifyEmail = null;

        // Cache elements
        const authModal = document.getElementById('auth-modal');
        const btnAuthUser = document.getElementById('btn-auth-user');
        const btnCloseModal = document.getElementById('btn-close-auth-modal');
        const tabLoginBtn = document.getElementById('tab-login-btn');
        const tabRegisterBtn = document.getElementById('tab-register-btn');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        const formVerifyOtp = document.getElementById('form-verify-otp');
        const btnGoogleLogin = document.getElementById('btn-google-login');
        const btnResendOtp = document.getElementById('btn-resend-otp');
        const btnBackToLogin = document.getElementById('btn-back-to-login');
        const btnLogoutAccount = document.getElementById('btn-logout-account');
        const btnAutoFillCode = document.getElementById('btn-auto-fill-code');
        const btnProfileExplore = document.getElementById('btn-profile-explore');

        // Check active session on startup
        await this.checkAuthSession();

        // Open Auth Modal from Topbar
        if (btnAuthUser) {
            btnAuthUser.addEventListener('click', () => {
                if (this.currentUser) {
                    this.showAuthView('profile');
                } else {
                    this.showAuthView('form');
                }
                if (authModal) authModal.classList.add('active');
            });
        }

        // Close Auth Modal
        if (btnCloseModal && authModal) {
            btnCloseModal.addEventListener('click', () => {
                authModal.classList.remove('active');
            });
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) authModal.classList.remove('active');
            });
        }

        // Switch between Login & Register tabs
        if (tabLoginBtn && tabRegisterBtn) {
            tabLoginBtn.addEventListener('click', () => {
                tabLoginBtn.classList.add('active');
                tabRegisterBtn.classList.remove('active');
                if (formLogin) { formLogin.classList.remove('hidden'); formLogin.classList.add('active'); }
                if (formRegister) { formRegister.classList.add('hidden'); formRegister.classList.remove('active'); }
                const title = document.getElementById('auth-modal-title');
                const sub = document.getElementById('auth-modal-subtitle');
                if (title) title.textContent = 'Masuk ke Music Glass';
                if (sub) sub.textContent = 'Nikmati pengalaman mendengarkan musik Liquid Glass tanpa batas.';
            });

            tabRegisterBtn.addEventListener('click', () => {
                tabRegisterBtn.classList.add('active');
                tabLoginBtn.classList.remove('active');
                if (formRegister) { formRegister.classList.remove('hidden'); formRegister.classList.add('active'); }
                if (formLogin) { formLogin.classList.add('hidden'); formLogin.classList.remove('active'); }
                const title = document.getElementById('auth-modal-title');
                const sub = document.getElementById('auth-modal-subtitle');
                if (title) title.textContent = 'Buat Akun Music Glass';
                if (sub) sub.textContent = 'Daftar sekarang untuk sinkronisasi playlist, favorit, dan riwayat musik.';
            });
        }

        // Password visibility toggles
        document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    const isPwd = input.type === 'password';
                    input.type = isPwd ? 'text' : 'password';
                    btn.innerHTML = isPwd ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
                    if (window.lucide) lucide.createIcons();
                }
            });
        });

        // Submit Login Form
        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;
                const remember = document.getElementById('login-remember').checked;
                const errorMsg = document.getElementById('login-error-msg');
                const submitBtn = document.getElementById('btn-submit-login');

                if (errorMsg) errorMsg.classList.add('hidden');
                if (submitBtn) submitBtn.disabled = true;

                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ email, password, remember })
                    });
                    const data = await res.json();

                    if (data.success) {
                        this.currentUser = data.user;
                        this.updateUserUI();
                        if (authModal) authModal.classList.remove('active');
                        this.showNotification(`Selamat datang kembali, ${data.user.name}!`, 'success');
                    } else if (data.unverified) {
                        this.pendingVerifyEmail = data.email;
                        this.showVerifyOtpView(data.email, data.verification_code);
                    } else {
                        if (errorMsg) {
                            errorMsg.textContent = data.message || 'Login gagal. Periksa email dan kata sandi Anda.';
                            errorMsg.classList.remove('hidden');
                        }
                    }
                } catch (err) {
                    if (errorMsg) {
                        errorMsg.textContent = 'Terjadi kesalahan koneksi server.';
                        errorMsg.classList.remove('hidden');
                    }
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            });
        }

        // Submit Register Form
        if (formRegister) {
            formRegister.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const password = document.getElementById('reg-password').value;
                const password_confirmation = document.getElementById('reg-password-conf').value;
                const errorMsg = document.getElementById('reg-error-msg');
                const submitBtn = document.getElementById('btn-submit-register');

                if (errorMsg) errorMsg.classList.add('hidden');
                if (submitBtn) submitBtn.disabled = true;

                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ name, email, password, password_confirmation })
                    });
                    const data = await res.json();

                    if (data.success) {
                        this.pendingVerifyEmail = email;
                        this.showVerifyOtpView(email, data.verification_code);
                        this.showNotification('Pendaftaran berhasil! Silakan masukkan kode verifikasi.', 'info');
                    } else {
                        if (errorMsg) {
                            errorMsg.textContent = data.message || 'Pendaftaran gagal.';
                            errorMsg.classList.remove('hidden');
                        }
                    }
                } catch (err) {
                    if (errorMsg) {
                        errorMsg.textContent = 'Terjadi kesalahan saat memproses pendaftaran.';
                        errorMsg.classList.remove('hidden');
                    }
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            });
        }

        // Submit Verify OTP Form
        if (formVerifyOtp) {
            formVerifyOtp.addEventListener('submit', async (e) => {
                e.preventDefault();
                const code = document.getElementById('otp-code-input').value.trim();
                const errorMsg = document.getElementById('verify-error-msg');
                const successMsg = document.getElementById('verify-success-msg');
                const submitBtn = document.getElementById('btn-submit-verify');

                if (errorMsg) errorMsg.classList.add('hidden');
                if (successMsg) successMsg.classList.add('hidden');
                if (submitBtn) submitBtn.disabled = true;

                try {
                    const res = await fetch('/api/auth/verify-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ email: this.pendingVerifyEmail, code })
                    });
                    const data = await res.json();

                    if (data.success) {
                        if (successMsg) {
                            successMsg.textContent = data.message;
                            successMsg.classList.remove('hidden');
                        }
                        this.currentUser = data.user;
                        this.updateUserUI();
                        setTimeout(() => {
                            if (authModal) authModal.classList.remove('active');
                            this.showNotification(`Email berhasil diverifikasi! Selamat datang, ${data.user.name}!`, 'success');
                        }, 1200);
                    } else {
                        if (errorMsg) {
                            errorMsg.textContent = data.message || 'Kode verifikasi salah.';
                            errorMsg.classList.remove('hidden');
                        }
                    }
                } catch (err) {
                    if (errorMsg) {
                        errorMsg.textContent = 'Terjadi kesalahan koneksi server.';
                        errorMsg.classList.remove('hidden');
                    }
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                }
            });
        }

        // Auto Fill Code Button
        if (btnAutoFillCode) {
            btnAutoFillCode.addEventListener('click', () => {
                const codeDisplay = document.getElementById('verify-code-display');
                const input = document.getElementById('otp-code-input');
                if (codeDisplay && input) {
                    input.value = codeDisplay.textContent.trim();
                    input.focus();
                }
            });
        }

        // Resend OTP Code
        if (btnResendOtp) {
            btnResendOtp.addEventListener('click', async () => {
                if (!this.pendingVerifyEmail) return;
                try {
                    const res = await fetch('/api/auth/resend-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ email: this.pendingVerifyEmail })
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.showVerifyOtpView(this.pendingVerifyEmail, data.verification_code);
                        this.showNotification(data.message, 'success');
                    }
                } catch (e) {}
            });
        }

        // Back to login button
        if (btnBackToLogin) {
            btnBackToLogin.addEventListener('click', () => {
                this.showAuthView('form');
                if (tabLoginBtn) tabLoginBtn.click();
            });
        }

        // Google / YouTube One-Click Sign In
        if (btnGoogleLogin) {
            btnGoogleLogin.addEventListener('click', async () => {
                const googlePayload = {
                    name: 'Bintang Pratama',
                    email: 'bintang.pratama@gmail.com',
                    google_id: 'goog_8829104819',
                    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BintangPratama'
                };

                try {
                    const res = await fetch('/api/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(googlePayload)
                    });
                    const data = await res.json();
                    if (data.success) {
                        this.currentUser = data.user;
                        this.updateUserUI();
                        if (authModal) authModal.classList.remove('active');
                        this.showNotification(`Berhasil masuk dengan Google: ${data.user.name}!`, 'success');
                    }
                } catch (e) {
                    this.showNotification('Gagal menghubungkan akun Google.', 'error');
                }
            });
        }

        // Logout Account
        if (btnLogoutAccount) {
            btnLogoutAccount.addEventListener('click', async () => {
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: { 'Accept': 'application/json' }
                    });
                    this.currentUser = null;
                    this.updateUserUI();
                    if (authModal) authModal.classList.remove('active');
                    this.showNotification('Anda telah berhasil keluar dari akun.', 'info');
                } catch (e) {}
            });
        }

        // Explore button from Profile Modal
        if (btnProfileExplore) {
            btnProfileExplore.addEventListener('click', () => {
                if (authModal) authModal.classList.remove('active');
                this.switchView('discover');
            });
        }
    }

    async checkAuthSession() {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data.authenticated && data.user) {
                this.currentUser = data.user;
            } else {
                this.currentUser = null;
            }
            this.updateUserUI();
        } catch (e) {}
    }

    updateUserUI() {
        const topbarAvatar = document.getElementById('topbar-user-avatar');
        const topbarName = document.getElementById('topbar-user-name');
        const topbarSub = document.getElementById('topbar-user-sub');
        const profileAvatar = document.getElementById('user-profile-avatar-img');
        const profileName = document.getElementById('user-profile-name');
        const profileEmail = document.getElementById('user-profile-email');
        const statFav = document.getElementById('stat-fav-count');
        const statPl = document.getElementById('stat-pl-count');
        const statHistory = document.getElementById('stat-history-count');

        if (this.currentUser) {
            const avatarUrl = this.currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(this.currentUser.name)}`;
            if (topbarAvatar) topbarAvatar.src = avatarUrl;
            if (topbarName) topbarName.textContent = this.currentUser.name;
            if (topbarSub) topbarSub.textContent = 'PRO Member';

            if (profileAvatar) profileAvatar.src = avatarUrl;
            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;

            if (statFav) statFav.textContent = this.favorites ? this.favorites.size : '0';
            if (statPl) statPl.textContent = this.playlists ? this.playlists.length : '0';
            if (statHistory) statHistory.textContent = this.history ? this.history.length : '0';
        } else {
            if (topbarAvatar) topbarAvatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest';
            if (topbarName) topbarName.textContent = 'Masuk / Daftar';
            if (topbarSub) topbarSub.textContent = 'Liquid Glass';
        }

        if (window.lucide) lucide.createIcons();
    }

    showAuthView(viewName) {
        const viewForm = document.getElementById('auth-view-form');
        const viewVerify = document.getElementById('auth-view-verify');
        const viewProfile = document.getElementById('auth-view-profile');

        if (viewForm) viewForm.classList.add('hidden');
        if (viewVerify) viewVerify.classList.add('hidden');
        if (viewProfile) viewProfile.classList.add('hidden');

        if (viewName === 'form' && viewForm) viewForm.classList.remove('hidden');
        if (viewName === 'verify' && viewVerify) viewVerify.classList.remove('hidden');
        if (viewName === 'profile' && viewProfile) {
            this.updateUserUI();
            viewProfile.classList.remove('hidden');
        }

        if (window.lucide) lucide.createIcons();
    }

    showVerifyOtpView(email, code) {
        this.pendingVerifyEmail = email;
        const targetEmail = document.getElementById('verify-target-email');
        const hintWrap = document.getElementById('verify-instant-hint');
        const codeDisplay = document.getElementById('verify-code-display');
        const errorMsg = document.getElementById('verify-error-msg');
        const successMsg = document.getElementById('verify-success-msg');
        const otpInput = document.getElementById('otp-code-input');

        if (targetEmail) targetEmail.textContent = email;
        if (errorMsg) errorMsg.classList.add('hidden');
        if (successMsg) successMsg.classList.add('hidden');
        if (otpInput) { otpInput.value = ''; otpInput.focus(); }

        if (code) {
            if (codeDisplay) codeDisplay.textContent = code;
            if (hintWrap) hintWrap.classList.remove('hidden');
        } else {
            if (hintWrap) hintWrap.classList.add('hidden');
        }

        this.showAuthView('verify');
    }
}
