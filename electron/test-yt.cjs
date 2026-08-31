const { app, BrowserWindow } = require('electron');
const path = require('path');

app.setPath('userData', path.join(app.getPath('temp'), 'music_glass_test_userdata_' + Date.now()));

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            webSecurity: false,
            autoplayPolicy: 'no-user-gesture-required'
        }
    });

    win.loadURL('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
    console.log('Window loaded YouTube embed URL directly...');
});
