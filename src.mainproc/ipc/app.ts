// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import   child_process      from 'child_process';
import   fs                 from 'fs';
import   path               from 'path';
import   util               from 'util';
import { HtmlRenderer }     from 'red-agate/modules/red-agate/renderer';
import   requireDynamic     from 'red-agate-util/modules/runtime/require-dynamic';
import { render,
         getAppEnv }        from 'menneu/modules';
import { ipcMain,
         dialog,
         BrowserWindow,
         WebContents,
         app }              from 'electron';
import { contentsRootDir }  from '../settings';
import { curDir,
         thisDirName,
         getLastSrcPath,
         setLastSrcPath }   from '../lib/paths';
import   commandRunner      from '../lib/cmdrunner';
import { createMainWindow } from '../windows/MainWindow';

// tslint:disable-next-line:no-var-requires
const findChrome     = require('carlo/lib/find_chrome');
const readFileAsync  = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync   = util.promisify(fs.readdir);
const statAsync      = util.promisify(fs.stat);



const carloOptions = {};

// NOTE: dropped file is passed by process.argv[1] on   packed environment
// NOTE: dropped file is passed by process.argv[2] on unpacked environment
let startupFile: string | undefined = process.argv[app.isPackaged ? 1 : 2];


HtmlRenderer.rendererPackageName = 'puppeteer-core';
(async () => {
    try {
        HtmlRenderer.launchOptions = {
            executablePath: (await findChrome(carloOptions)).executablePath,
        };
    } catch (e) {
        // Chrome browser is not available.
        // tslint:disable-next-line:no-console
        console.error(e);
    }
})();


function ipc(eventName: string, fn: (arg: any, sender: WebContents) => any) {
    ipcMain.on(eventName, async (event: any, arg: any) => {
        try {
            let ret = fn(arg, event.sender);
            if (ret instanceof Promise) {
                ret = await ret;
            }
            event.sender.send(eventName, {succeeded: true, payload: ret});
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.error(eventName);
            // tslint:disable-next-line:no-console
            console.error(e);
            event.sender.send(eventName, {succeeded: false, error: e.message});
        }
    });
}


function ipcSync(eventName: string, fn: (arg: any, sender: WebContents) => any) {
    ipcMain.on(eventName, (event: any, arg: any) => {
        try {
            event.returnValue = fn(arg, event.sender);
        } catch (e) {
            // tslint:disable-next-line:no-console
            console.error(eventName);
            // tslint:disable-next-line:no-console
            console.error(e);
            event.returnValue = void 0;
        }
    });
}


function getDesktopPath() {
    return path.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] as string, 'Desktop');
}


ipcMain.on('app:editor:toggleFullScreen', (event: any, arg: any) => {
    try {
        if (arg.force || app.isPackaged) {
            const win = BrowserWindow.fromWebContents(event.sender);
            win.setFullScreen(!win.isFullScreen());
        }
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.error('app:editor:toggleFullScreen');
        // tslint:disable-next-line:no-console
        console.error(e);
    }
});


ipcMain.on('app:editor:notifyEditorDirty', (event: any, arg: any) => {
    try {
        const win = BrowserWindow.fromWebContents(event.sender);
        (win as any).editorIsDirty = arg.dirty;
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.error('app:editor:notifyEditorDirty');
        // tslint:disable-next-line:no-console
        console.error(e);
    }
});


ipc('app:editor:nativeAlert', (arg, sender) =>
    nativeAlert(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
async function nativeAlert(sender: BrowserWindow, message: string, type: string) {
    const promise = dialog.showMessageBox(sender, {
        type: type || 'error',
        message,
        buttons: ['OK'],
    });
    return await promise;
}


ipcSync('app:editor:nativeAlertSync', (arg, sender) =>
    nativeAlertSync(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
function nativeAlertSync(sender: BrowserWindow, message: string, type: string) {
    dialog.showMessageBoxSync(sender, {
        type: type || 'error',
        message,
        buttons: ['OK'],
    });
    return true;
}


ipc('app:editor:nativeConfirm', (arg, sender) =>
    nativeConfirm(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
async function nativeConfirm(sender: BrowserWindow, message: string, type: string) {
    const promise = dialog.showMessageBox(sender, {
        type: type || 'warning',
        message,
        buttons: ['OK', 'Cancel'],
    });
    const ret = await promise;
    return ret.response === 0 ? true : false;
}


ipcSync('app:editor:nativeConfirmSync', (arg, sender) =>
    nativeConfirmSync(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
function nativeConfirmSync(sender: BrowserWindow, message: string, type: string) {
    const ret = dialog.showMessageBoxSync(sender, {
        type: type || 'warning',
        message,
        buttons: ['OK', 'Cancel'],
    });
    return ret === 0 ? true : false;
}


ipc('app:editor:nativeFileOpenDialog', (arg, sender) =>
    nativeFileOpenDialog(BrowserWindow.fromWebContents(sender), arg.title, arg.defaultPath, arg.filters));
async function nativeFileOpenDialog(sender: BrowserWindow, title: string, defaultPath: string, filters: any) {
    const promise = dialog.showOpenDialog(sender, {
        title,
        defaultPath: defaultPath || getDesktopPath(),
        filters,
    });
    const ret = await promise;
    return (ret.filePaths && ret.filePaths.length > 0 ?
        ret.filePaths :
        void 0
    );
}


ipc('app:editor:nativeFileSaveDialog', (arg, sender) =>
    nativeFileSaveDialog(BrowserWindow.fromWebContents(sender), arg.title, arg.defaultPath, arg.filters));
async function nativeFileSaveDialog(sender: BrowserWindow, title: string, defaultPath: string, filters: any) {
    const promise = dialog.showSaveDialog(sender, {
        title,
        defaultPath: defaultPath || getDesktopPath(),
        filters,
    });
    const ret = await promise;
    return (ret.canceled ? void 0 : ret.filePath);
}


ipc('app:editor:renderByMenneu', arg =>
    renderByMenneu(arg.source, arg.data, arg.options, arg.srcPath, ...arg.exportPath));
async function renderByMenneu(
        source: string, data: object | string, options: any, srcPath: string, ...exportPath: string[]) {

    if (srcPath === null || srcPath === void 0) {
        srcPath = path.join(getDesktopPath(), 'H8f5iZPgOwtZoIN4');
    }
    const srcDir = path.dirname(srcPath);
    const srcBaseName = path.basename(srcPath).slice(0, -(path.extname(srcPath).length));

    let cf = null;
    if (! cf) {
        const fileName = path.join(srcDir, srcBaseName + '.config.json');
        if (fs.existsSync(fileName)) {
            const s = await readFileAsync(fileName, { encoding: 'utf8' });
            cf = JSON.parse(s);
        }
    }
    if (! cf) {
        const fileName = path.join(srcDir, srcBaseName + '.config.js');
        if (fs.existsSync(fileName)) {
            cf = requireDynamic(fileName);
            if (typeof cf === 'function') {
                cf = cf(getAppEnv());
            }
        }
    }
    if (! cf) {
        const fileName = path.join(srcDir, 'menneu.config.json');
        if (fs.existsSync(fileName)) {
            const s = await readFileAsync(fileName, { encoding: 'utf8' });
            cf = JSON.parse(s);
        }
    }
    if (! cf) {
        const fileName = path.join(srcDir, 'menneu.config.js');
        if (fs.existsSync(fileName)) {
            cf = requireDynamic(fileName);
            if (typeof cf === 'function') {
                cf = cf(getAppEnv());
            }
        }
    }
    cf = Object.assign({}, cf || {});

    let d = data;
    if (! d) {
        const fileName = path.join(srcDir, srcBaseName + '.data.lisp');
        if (fs.existsSync(fileName)) {
            d = await readFileAsync(fileName, { encoding: 'utf8' });
            cf.dataFormat = 'lisp';
        }
    }
    if (! d) {
        const fileName = path.join(srcDir, srcBaseName + '.data.json');
        if (fs.existsSync(fileName)) {
            d = await readFileAsync(fileName, { encoding: 'utf8' });
            cf.dataFormat = 'json';
        }
    }

    cf.tempDir = srcDir;
    let buf = null;
    try {
        // TODO: This has concurrency issue.
        process.chdir(srcDir);
        setLastSrcPath(srcDir);
        buf = await render(source, d || {}, Object.assign(options, cf));
    } finally {
        process.chdir(curDir);
    }

    const outPath = exportPath.length === 0 ?
        path.normalize(path.join(thisDirName, `./${contentsRootDir}/out/preview.${options.outputFormat}`)) :
        path.normalize(path.join(...exportPath));
    await writeFileAsync(outPath, buf);

    return options.outputFormat.toLowerCase() === 'pdf' ?
        'embed.html' :
        'out/preview.' + options.outputFormat;
}


ipc('app:editor:loadFile', arg => loadFile(...arg.filePath));
function loadFile(...filePath: string[]) {
    if (typeof filePath[0] !== 'string') {
        throw new Error('File name is not specified');
    }
    return readFileAsync(path.normalize(path.join(...filePath)), { encoding: 'utf8' });
}


ipc('app:editor:saveFile', arg => saveFile(arg.text, ...arg.filePath));
async function saveFile(text: string, ...filePath: string[]) {
    if (typeof filePath[0] !== 'string') {
        throw new Error('File name is not specified');
    }
    const p = path.normalize(path.join(...filePath));
    await writeFileAsync(p, text, { encoding: 'utf8' });
    return {
        path: p,
        name: path.basename(p),
    };
}


async function listDirectoryImpl(dir: string): Promise<any> {
    if (typeof dir !== 'string') {
        throw new Error('directory name is not specified');
    }
    let stat = null;
    try {
        stat = await statAsync(dir);
    } catch (e) {
        // retry once
        dir = path.dirname(dir);
        stat = await statAsync(dir);
    }
    if (stat.isDirectory()) {
        const files = await readdirAsync(dir);
        const fileInfos = [];
        for (const f of files) {
            let isDir = false;
            let succeeded = false;
            try {
                const s = await statAsync(path.join(dir, f));
                isDir = s.isDirectory();
                succeeded = true;
            // tslint:disable-next-line:no-empty
            } catch (e) {}
            if (succeeded) {
                fileInfos.push({
                    name: f,
                    path: path.join(dir, f),
                    isDirectory: isDir,
                });
            }
        }
        fileInfos.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) {
                return -1;
            }
            if (!a.isDirectory && b.isDirectory) {
                return 1;
            }
            return a.name.localeCompare(b.name);
        });
        fileInfos.unshift({
            name: '..',
            isDirectory: true,
        });
        return {
            directory: dir,
            files: fileInfos,
        };
    } else {
        return await listDirectoryImpl(path.dirname(dir));
    }
}


ipc('app:editor:listDirectory', arg => listDirectory(...arg.dirPath));
async function listDirectory(...dirPath: string[]) {
    return await listDirectoryImpl(path.normalize(path.join(...dirPath)));
}


ipc('app:editor:listDesktopDirectory', arg => listDesktopDirectory());
async function listDesktopDirectory() {
    return await listDirectoryImpl(getDesktopPath());
}


ipc('app:editor:listHomeDirectory', arg => listHomeDirectory());
async function listHomeDirectory() {
    return await listDirectoryImpl(
        process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] as string);
}


ipc('app:editor:fileExists', arg => fileExists(...arg.filePath));
function fileExists(...filePath: string[]) {
    if (typeof filePath[0] !== 'string') {
        throw new Error('File name is not specified');
    }
    return fs.existsSync(path.normalize(path.join(...filePath)));
}


ipc('app:editor:pathJoin', arg => pathJoin(...arg.filePath));
function pathJoin(...filePath: string[]) {
    if (typeof filePath[0] !== 'string') {
        throw new Error('File name is not specified');
    }
    return path.normalize(path.join(...filePath));
}


ipc('app:editor:getDirName', arg => getDirName(arg.filePath));
function getDirName(filePath: string) {
    if (typeof filePath !== 'string') {
        throw new Error('File name is not specified');
    }
    return path.dirname(filePath);
}


ipc('app:editor:getBaseName', arg => getBaseName(arg.filePath));
function getBaseName(filePath: string) {
    if (typeof filePath !== 'string') {
        throw new Error('File name is not specified');
    }
    return path.basename(filePath);
}


ipc('app:editor:getStartupFile', arg => getStartupFile());
async function getStartupFile() {
    if (startupFile) {
        const p = path.resolve(startupFile);
        startupFile = void 0;
        const text = await readFileAsync(p, { encoding: 'utf8' });
        return {
            path: p,
            text,
        };
    } else {
        return void 0;
    }
}


ipc('app:editor:openURL', arg => openURL(arg.url));
async function openURL(theUrl: string) {
    if (theUrl.match(/^https?:\/\//)) {
        const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
        const child = child_process.exec(start + ' ' + theUrl);
        child.unref();
    }
    return true;
}


ipc('app:editor:openNewWindow', arg => openNewWindow());
async function openNewWindow() {
    createMainWindow();
    return true;
}


ipc('app:editor:Backend:runCommand', arg => runCommand(arg.command));
async function runCommand(command: string) {
    return commandRunner(command);
}


ipc('app:editor:Backend:runCommandAST', arg => runCommandAST(arg.ast));
async function runCommandAST(ast: any) {
    return commandRunner.evaluateAST(ast);
}
