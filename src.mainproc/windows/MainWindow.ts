// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import * as path            from 'path';
import * as electron        from 'electron';
import { app,
         BrowserWindow,
         dialog,
         shell }            from 'electron';
import { contentsRootDir }  from '../settings';
import { registerWindow,
         unregisterWindow } from '../lib/SimpleWindowManager';



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

export function createMainWindow() {
    // NOTE: You cannot require or use this module until the ready event of the app module is emitted.
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    let mainWindow: BrowserWindow | null = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            preload: path.join(app.getAppPath(), 'src.preload/preload.js'),
            plugins: true, // enable PDF plugin
        },
        width: Math.max(1200, width / 2),
        height: Math.max(600, height - 20),
        icon: path.join(app.getAppPath(), 'icons/app/256x256.png'),
    });
    registerWindow(mainWindow, mainWindow);

    // and load the html of the app.
    mainWindow.loadFile(path.join(app.getAppPath(), `${contentsRootDir}/electron.html`));

    // CSP is not work while the location scheme is 'file'.
    // And when if navigated to http/https, CSP is to be enabled.
    mainWindow.webContents.session.webRequest.onHeadersReceived((details: any, callback: any) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    `default-src chrome: 'self';` +
                    `script-src chrome: 'self'${app.isPackaged ? '' : ` devtools: 'unsafe-eval'`};` +
                    `style-src chrome: https: http: data: 'self' 'unsafe-inline'${app.isPackaged ? '' : ` devtools:`};` +
                    `img-src chrome: https: http: data: 'self';` +
                    `media-src chrome: https: http: data: 'self';` +
                    `object-src file:;` +
                    `frame-ancestors file:;` +
                    `frame-src file:`,
                ],
            },
        });
    });

    mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        // const url = webContents.getURL();
        //
        // if (permission === 'notifications') {
        //     // Approves the permissions request
        //     callback(true);
        // }
        // if (!url.startsWith('https://my-website.com')) {
        //     // Denies the permissions request
        //     return callback(false);
        // }
        return callback(false);
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.on('close', (ev) => {
        if ((mainWindow as any).editorIsDirty) {
            const ret = dialog.showMessageBoxSync(mainWindow as BrowserWindow, {
                type: 'warning',
                message: 'Changes you made may not be saved.\nAre you sure want to discard changes?',
                buttons: ['OK', 'Cancel'],
            });
            if (ret !== 0) {
                ev.preventDefault();
            }
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        unregisterWindow(mainWindow as BrowserWindow);
        mainWindow = null;
    });

    mainWindow.webContents.on('new-window', (event: any, url: string) => {
        event.preventDefault();
        if (url.match(/^https?:\/\//)) {
            shell.openExternal(url);
        }
    });

    mainWindow.webContents.on('will-navigate', (event: any, url: string) => {
        event.preventDefault();
    });

    (mainWindow as any).editorIsDirty = false;

    return mainWindow;
}
