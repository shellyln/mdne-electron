// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


// Modules to control application life and create native browser window
import * as path            from 'path';
import * as url             from 'url';
import { app,
         protocol,
         Menu }             from 'electron';

// Configurations
import { appConfig }        from './lib/conf';
import { contentsRootDir }  from './settings';
import { setStartupFilePath,
         getLastSrcPath,
         tmpOutDir }        from './lib/paths';

// Window
import { createMainWindow } from './windows/MainWindow';

// IPC events
import './ipc/app';



const lockAcquired = app.requestSingleInstanceLock();
if (! lockAcquired) {
    app.quit();
}


// Read the application config.
// tslint:disable-next-line:no-console
// console.log('app config: ' + JSON.stringify(appConfig, null, 2));


if (app.isPackaged) {
    // Removing the menu bar from the window.
    Menu.setApplicationMenu(null);
}


// App lifecycle events.

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    let contentsRoot = path.join(app.getAppPath(), contentsRootDir);
    const previewHtml = path.join(tmpOutDir, 'preview.html');
    const previewPdf = path.join(tmpOutDir, 'preview.pdf');

    if (process.platform === 'win32') {
        contentsRoot = contentsRoot.replace(/\\/g, '/');
    }

    const normalizePath = (filePath: string) => {
        if (process.platform === 'win32') {
            filePath = filePath.replace(/\\/g, '/');
            if (filePath.match(/^\/[A-Za-z]:/)) {
                filePath = filePath.slice(1);
            }
        }
        filePath = path.normalize(filePath);
        if (filePath.startsWith(tmpOutDir) && filePath !== previewHtml && filePath !== previewPdf) {
            filePath = path.join(getLastSrcPath(), filePath.slice(tmpOutDir.length));
        }
        if (process.platform === 'win32') {
            filePath = filePath.replace(/\\/g, '/');
        }
        return filePath;
    };

    protocol.interceptFileProtocol('file', (req, callback) => {
        const filePath = normalizePath(decodeURIComponent(new url.URL(req.url).pathname));
        callback(filePath);
    });

    createMainWindow();
});


// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    createMainWindow();
});


app.on('second-instance', (event, commandLine, workingDirectory) => {
    for (const p of commandLine.slice(1)) {
        if (! p.startsWith('-')) {
            setStartupFilePath(p);
            break;
        }
    }
    createMainWindow();
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
