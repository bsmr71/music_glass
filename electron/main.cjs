const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, shell, session } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const fs = require('fs');

let mainWindow = null;
let tray = null;
let phpProcess = null;
let currentTrackInfo = { title: 'No track playing', artist: 'Music Glass', isPlaying: false };

const APP_URL = process.env.APP_URL || 'http://127.0.0.1:8000';
const PORT = 8000;

// Enable instant background autoplay without user gesture requirements & prevent iframe suspension
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

function checkServerAvailable(url, callback) {
    const req = http.get(url, (res) => {
        callback(true);
    });
    req.on('error', () => {
        callback(false);
    });
    req.setTimeout(1500, () => {
        req.destroy();
        callback(false);
    });
}

function startPhpServerIfNeeded(onReady) {
    checkServerAvailable(APP_URL, (isAvailable) => {
        if (isAvailable) {
            console.log(`[Music Glass Desktop] Connected to existing server at ${APP_URL}`);
            onReady();
            return;
        }

        console.log('[Music Glass Desktop] Starting local PHP background server...');
        const isWin = process.platform === 'win32';
        const projectRoot = path.join(__dirname, '..');

        phpProcess = spawn('php', ['artisan', 'serve', `--port=${PORT}`], {
            cwd: projectRoot,
            shell: isWin,
            stdio: 'ignore'
        });

        phpProcess.on('error', (err) => {
            console.warn('[Music Glass Desktop] Could not auto-start PHP process:', err.message);
        });

        // Poll until ready
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            checkServerAvailable(APP_URL, (ready) => {
                if (ready || attempts > 20) {
                    clearInterval(interval);
                    onReady();
                }
            });
        }, 500);
    });
}

function createWindow() {
    const cleanUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#090a12',
        title: 'Music Glass',
        icon: path.join(__dirname, '../public/favicon.ico'),
        frame: false, // Pure Custom Liquid Glass Window!
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false, // Allows cross-origin audio streaming & YouTube embeds
            allowRunningInsecureContent: true,
            backgroundThrottling: false
        }
    });

    // Spoof User-Agent so YouTube Iframe API doesn't block Electron
    mainWindow.webContents.setUserAgent(cleanUserAgent);
    mainWindow.loadURL(APP_URL, { userAgent: cleanUserAgent });

    // Open external web links in user's default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('did-fail-load', () => {
        console.warn(`[Music Glass] Failed to load ${APP_URL}. Retrying in 2 seconds...`);
        setTimeout(() => {
            if (mainWindow) mainWindow.loadURL(APP_URL, { userAgent: cleanUserAgent });
        }, 2000);
    });

    mainWindow.on('close', (e) => {
        // Hide to tray on minimize or close if tray exists
        if (!app.isQuitting) {
            // Allow standard close
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    setupGlobalShortcuts();
    setupSystemTray();
}

function setupGlobalShortcuts() {
    try {
        globalShortcut.register('MediaPlayPause', () => {
            if (mainWindow) mainWindow.webContents.send('media-control', 'play-pause');
        });
        globalShortcut.register('MediaNextTrack', () => {
            if (mainWindow) mainWindow.webContents.send('media-control', 'next');
        });
        globalShortcut.register('MediaPreviousTrack', () => {
            if (mainWindow) mainWindow.webContents.send('media-control', 'prev');
        });
        globalShortcut.register('MediaStop', () => {
            if (mainWindow) mainWindow.webContents.send('media-control', 'stop');
        });
    } catch (err) {
        console.warn('[Music Glass] Could not register media shortcuts:', err.message);
    }
}

function setupSystemTray() {
    const iconPath = path.join(__dirname, '../public/favicon.ico');
    try {
        if (fs.existsSync(iconPath) && fs.statSync(iconPath).size > 0) {
            const nIcon = nativeImage.createFromPath(iconPath);
            tray = new Tray(nIcon);
            updateTrayMenu();

            tray.setToolTip('Music Glass — Liquid Glass Player');
            tray.on('double-click', () => {
                if (mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.show();
                    mainWindow.focus();
                }
            });
        }
    } catch (err) {
        console.warn('[Music Glass] Could not create system tray:', err.message);
    }
}

function updateTrayMenu() {
    if (!tray) return;

    const playLabel = currentTrackInfo.isPlaying ? '⏸ Pause' : '▶ Play';
    const nowPlayingLabel = currentTrackInfo.title 
        ? `${currentTrackInfo.title} - ${currentTrackInfo.artist}` 
        : 'No track playing';

    const contextMenu = Menu.buildFromTemplate([
        { label: `🎵 ${nowPlayingLabel.substring(0, 32)}...`, enabled: false },
        { type: 'separator' },
        {
            label: playLabel,
            click: () => {
                if (mainWindow) mainWindow.webContents.send('media-control', 'play-pause');
            }
        },
        {
            label: '⏭ Next Track',
            click: () => {
                if (mainWindow) mainWindow.webContents.send('media-control', 'next');
            }
        },
        {
            label: '⏮ Previous Track',
            click: () => {
                if (mainWindow) mainWindow.webContents.send('media-control', 'prev');
            }
        },
        { type: 'separator' },
        {
            label: '🪟 Show Music Glass',
            click: () => {
                if (mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: '❌ Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

// IPC Handlers for window actions
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.on('open-external', (event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        shell.openExternal(url);
    }
});

// IPC Handler for live track sync to OS tray / title
ipcMain.on('track-update', (event, track) => {
    if (track) {
        currentTrackInfo = { ...currentTrackInfo, ...track };
        if (mainWindow) {
            mainWindow.setTitle(`${track.title} • ${track.artist || 'Music Glass'}`);
        }
        updateTrayMenu();
    }
});

ipcMain.on('play-state', (event, isPlaying) => {
    currentTrackInfo.isPlaying = isPlaying;
    updateTrayMenu();
});

// App Lifecycle
app.whenReady().then(() => {
    // Strip X-Frame-Options and CSP headers for seamless YouTube embed playback in Electron
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const responseHeaders = { ...details.responseHeaders };
        delete responseHeaders['x-frame-options'];
        delete responseHeaders['X-Frame-Options'];
        delete responseHeaders['content-security-policy'];
        delete responseHeaders['Content-Security-Policy'];
        delete responseHeaders['cross-origin-embedder-policy'];
        delete responseHeaders['Cross-Origin-Embedder-Policy'];
        delete responseHeaders['cross-origin-opener-policy'];
        delete responseHeaders['Cross-Origin-Opener-Policy'];
        callback({ responseHeaders });
    });

    startPhpServerIfNeeded(() => {
        createWindow();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (phpProcess) {
        try {
            phpProcess.kill();
        } catch (e) {}
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
