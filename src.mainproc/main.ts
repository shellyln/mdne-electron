// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


// Modules to control application life and create native browser window
import * as fs              from 'fs';
import * as path            from 'path';
import * as url             from 'url';
import * as util            from 'util';
import { app,
         protocol,
         Menu }             from 'electron';

// Configurations
import { appConfig }        from './lib/conf';
import { contentsRootDir }  from './settings';
import { getLastSrcPath,
         toUnpackedPath }   from './lib/paths';
import   getContentType     from './lib/mime';

// Window
import { createMainWindow } from './windows/MainWindow';

// IPC events
import './ipc/app';



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
// tslint:disable-next-line:only-arrow-functions
app.on('ready', function() {
    let contentsRoot = path.join(app.getAppPath(), contentsRootDir);
    let assetsRoot = path.join(contentsRoot, 'assets');
    let outRoot = path.join(contentsRoot, 'out');
    let embedHtml = path.join(contentsRoot, 'embed.html');
    let previewHtml = path.join(outRoot, 'preview.html');
    let previewPdf = path.join(outRoot, 'preview.pdf');

    if (process.platform === 'win32') {
        contentsRoot = contentsRoot.replace(/\\/g, '/');
        assetsRoot = assetsRoot.replace(/\\/g, '/');
        outRoot = outRoot.replace(/\\/g, '/');
        embedHtml = embedHtml.replace(/\\/g, '/');
        previewHtml = previewHtml.replace(/\\/g, '/');
        previewPdf = previewPdf.replace(/\\/g, '/');
    }

    // NOTE: BUG: electron 7 don't look automatically dynamic `/app.asar.unpacked/*` contents?
    const previewPdfUnpackedPath = toUnpackedPath(previewPdf);

    const normalizePath = (filePath: string, isAppScheme: boolean) => {
        if (!isAppScheme && process.platform === 'win32') {
            filePath = filePath.replace(/\\/g, '/');
            if (filePath.match(/^\/[A-Za-z]:/)) {
                filePath = filePath.slice(1);
            }
            if (filePath === previewHtml || filePath === previewPdf) {
                filePath = toUnpackedPath(filePath);
            } else if (filePath.startsWith(outRoot)) {
                filePath = path.join(getLastSrcPath(), filePath.slice(outRoot.length));
            }
        } else {
            if (isAppScheme) {
                filePath = path.join(contentsRoot, filePath.slice(1));
            } else if (filePath === previewHtml || filePath === previewPdf) {
                // nothing to do
            } else if (filePath.startsWith(outRoot)) {
                filePath = path.join(getLastSrcPath(), filePath.slice(outRoot.length));
            }
        }
        filePath = path.normalize(filePath);
        if (process.platform === 'win32') {
            filePath = filePath.replace(/\\/g, '/');
        }
        return filePath;
    };

    protocol.interceptFileProtocol('file', (req, callback) => {
        const filePath = normalizePath(decodeURIComponent(new url.URL(req.url).pathname), false);
        callback(filePath);
    });

    protocol.registerBufferProtocol('app', async (req, callback) => {
        try {
            const filePath = normalizePath(decodeURIComponent(new url.URL(req.url).pathname), true);
            const buf = await util.promisify(fs.readFile)(filePath, {encoding: 'utf8'});
            callback({mimeType: getContentType(filePath), data: Buffer.from(buf)});
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.error(e);
            // tslint:disable-next-line:no-console
            console.error(req.url);
            callback({ statusCode: 500 });
        }
    });

    createMainWindow();
});


// Quit when all windows are closed.
// tslint:disable-next-line:only-arrow-functions
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


// tslint:disable-next-line:only-arrow-functions
app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    createMainWindow();
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
