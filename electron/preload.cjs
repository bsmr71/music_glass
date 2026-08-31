const { contextBridge, ipcRenderer } = require('electron');

// Safe polyfill for Chrome runtime to prevent YouTube embed widgetapi errors
try {
    window.chrome = window.chrome || {};
    window.chrome.runtime = window.chrome.runtime || {
        sendMessage: () => {},
        connect: () => ({ onMessage: { addListener: () => {} }, postMessage: () => {} })
    };
} catch (e) {}

contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,

    // Window controls
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

    // Open external links in default browser
    openExternal: (url) => ipcRenderer.send('open-external', url),

    // Media state sync to OS / Tray / SMTC
    sendTrackUpdate: (trackData) => ipcRenderer.send('track-update', trackData),
    sendPlayState: (isPlaying) => ipcRenderer.send('play-state', isPlaying),

    // Listen to global media shortcuts / tray clicks from main process
    onMediaControl: (callback) => {
        ipcRenderer.on('media-control', (event, action) => callback(action));
    }
});
