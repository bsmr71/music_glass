const { app, BrowserWindow } = require('electron');

app.whenReady().then(async () => {
    const win = new BrowserWindow({ show: false });
    await win.loadURL('data:text/html,<html><body></body></html>');
    
    const results = await win.webContents.executeJavaScript(`
        ({
            mp3: document.createElement('audio').canPlayType('audio/mpeg'),
            aac: document.createElement('audio').canPlayType('audio/aac'),
            mp4: document.createElement('audio').canPlayType('audio/mp4'),
            webm_opus: document.createElement('audio').canPlayType('audio/webm; codecs="opus"'),
            ogg_vorbis: document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"'),
            wav: document.createElement('audio').canPlayType('audio/wav')
        })
    `);
    
    console.log('=== ELECTRON AUDIO CODEC SUPPORT ===');
    console.log(results);
    app.quit();
});
