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

export function createMainWindow(): electron.BrowserWindow {
    // NOTE: You cannot require or use this module until the ready event of the app module is emitted.
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    let mainWindow: BrowserWindow | null = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false,             // Electron 11: default is false
            nodeIntegrationInWorker: false,     // Electron 11: default is false
            nodeIntegrationInSubFrames: false,  // Electron 11: default is false
            enableRemoteModule: false,          // Electron 11: default is false
            contextIsolation: true,
            preload: path.join(app.getAppPath(), 'src.preload/preload-isolated.js'),
            plugins: true, // enable PDF plugin
        },
        width: Math.max(600, Math.ceil(width * 0.667)),
        height: Math.max(400, Math.ceil(height * 0.667)),
        icon: path.join(app.getAppPath(), 'icons/app/256x256.png'),
        backgroundColor: '#000',
    });
    registerWindow(mainWindow, mainWindow);

    // and load the html of the app.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    mainWindow.loadFile(path.join(app.getAppPath(), `${contentsRootDir}/electron.html`));

    // CSP is not work while the location scheme is 'file'.
    // And when if navigated to http/https, CSP is to be enabled.
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        if (details.url.match(/^https?:\/\//)) {
            const headers = {...details.responseHeaders};
            for (const key of Object.keys(headers)) {
                if (key.toLowerCase() === 'content-security-policy') {
                    delete headers[key];
                }
                if (key.toLowerCase() === 'x-content-security-policy') {
                    delete headers[key];
                }
            }
            callback({
                responseHeaders: {
                    ...headers,
                    'content-security-policy': [
                        `default-src 'none';` +
                        `frame-ancestors 'none';`,
                    ],
                },
            });
        } else {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'content-security-policy': [
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
        }
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

    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();
        if (url.match(/^https?:\/\//)) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            shell.openExternal(url);
        }
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        // NOTE: Protect from `target="_top"` navigation links in the iframe.
        event.preventDefault();
    });

    (mainWindow as any).editorIsDirty = false;

    return mainWindow;
}
