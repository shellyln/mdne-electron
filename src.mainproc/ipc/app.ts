// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import   child_process             from 'child_process';
import   fs                        from 'fs';
import   path                      from 'path';
import   util                      from 'util';
import { HtmlRenderer }            from 'red-agate/modules/red-agate/renderer';
import   requireDynamic            from 'red-agate-util/modules/runtime/require-dynamic';
import { render,
         getAppEnv,
         CliConfig }           from 'menneu/modules';
import { ipcMain,
         dialog,
         BrowserWindow,
         WebContents,
         app }                     from 'electron';
import { contentsRootDir }         from '../settings';
import { curDir,
         thisDirName,
         getStartupFilePath,
         setStartupFilePath,
         setLastSrcPath,
         tmpDir,
         tmpOutDir }               from '../lib/paths';
import   commandRunner             from '../lib/cmdrunner';
import { additionalContentStyles } from '../lib/styles';
import { createMainWindow }        from '../windows/MainWindow';
import { CarloLaunchOptions,
         findChrome }              from '../vendor/carlo/find_chrome';


// tslint:disable-next-line:no-var-requires
const readFileAsync  = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const readdirAsync   = util.promisify(fs.readdir);
const statAsync      = util.promisify(fs.stat);
const mkdirAsync     = util.promisify(fs.mkdir);
const copyFileAsync  = util.promisify(fs.copyFile);


const carloOptions: CarloLaunchOptions = {};


function setLocalChromium() {
    carloOptions.channel = ['chromium'];

    carloOptions.localDataDir = path.normalize(path.join(tmpDir, '.local-chromium'));
    fs.mkdirSync(carloOptions.localDataDir, {recursive: true});
}


if (process.env.MDNE_CHROME_CHANNEL_CHROMIUM &&
    String(process.env.MDNE_CHROME_CHANNEL_CHROMIUM).toLowerCase() === 'true') {

    setLocalChromium();
}


HtmlRenderer.rendererPackageName = 'puppeteer-core';
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
    try {
        HtmlRenderer.launchOptions = {
            executablePath: (await findChrome(carloOptions)).executablePath,
        };
    } catch (e) {
        // Chrome browser is not available.
        // eslint-disable-next-line no-console
        console.error(e);

        // retry
        try {
            setLocalChromium();
            HtmlRenderer.launchOptions = {
                executablePath: (await findChrome(carloOptions)).executablePath,
            };
        } catch (e2) {
            // eslint-disable-next-line no-console
            console.error(e2);
        }
    }
})();


// TODO: Change to `ipcRenderer.invoke()` <-> `ipcMain.handle()`


function ipc(eventName: string, fn: (arg: any, sender: WebContents) => any) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ipcMain.on(eventName, async (event, arg: any) => {
        try {
            let ret = fn(arg, event.sender);
            if (ret instanceof Promise) {
                ret = await ret;
            }
            event.sender.send(eventName, {succeeded: true, payload: ret});
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(eventName);
            // eslint-disable-next-line no-console
            console.error(e);
            event.sender.send(eventName, {succeeded: false, error: e.message});
        }
    });
}


function ipcSync(eventName: string, fn: (arg: any, sender: WebContents) => any) {
    ipcMain.on(eventName, (event, arg: any) => {
        try {
            event.returnValue = fn(arg, event.sender);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(eventName);
            // eslint-disable-next-line no-console
            console.error(e);
            event.returnValue = void 0;
        }
    });
}


function getDesktopPath() {
    return path.join(process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] as string, 'Desktop');
}


ipcMain.on('app:editor:toggleFullScreen', (event, arg: any) => {
    try {
        if (arg.force || app.isPackaged) {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
                win.setFullScreen(!win.isFullScreen());
            }
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('app:editor:toggleFullScreen');
        // eslint-disable-next-line no-console
        console.error(e);
    }
});


ipcMain.on('app:editor:notifyEditorDirty', (event, arg: any) => {
    try {
        const win = BrowserWindow.fromWebContents(event.sender);
        (win as any).editorIsDirty = arg.dirty;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('app:editor:notifyEditorDirty');
        // eslint-disable-next-line no-console
        console.error(e);
    }
});


ipc('app:editor:nativeAlert', (arg, sender) =>
    nativeAlert(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
async function nativeAlert(sender: BrowserWindow | null, message: string, type: string) {
    if (!sender) {
        throw new Error('Sender BrowserWindow is not exists.');
    }
    const promise = dialog.showMessageBox(sender, {
        type: type || 'error',
        message,
        buttons: ['OK'],
    });
    return await promise;
}


ipcSync('app:editor:nativeAlertSync', (arg, sender) =>
    nativeAlertSync(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
function nativeAlertSync(sender: BrowserWindow | null, message: string, type: string) {
    if (!sender) {
        throw new Error('Sender BrowserWindow is not exists.');
    }
    dialog.showMessageBoxSync(sender, {
        type: type || 'error',
        message,
        buttons: ['OK'],
    });
    return true;
}


ipc('app:editor:nativeConfirm', (arg, sender) =>
    nativeConfirm(BrowserWindow.fromWebContents(sender), arg.message, arg.type));
async function nativeConfirm(sender: BrowserWindow | null, message: string, type: string) {
    if (!sender) {
        throw new Error('Sender BrowserWindow is not exists.');
    }
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
function nativeConfirmSync(sender: BrowserWindow | null, message: string, type: string) {
    if (!sender) {
        throw new Error('Sender BrowserWindow is not exists.');
    }
    const ret = dialog.showMessageBoxSync(sender, {
        type: type || 'warning',
        message,
        buttons: ['OK', 'Cancel'],
    });
    return ret === 0 ? true : false;
}


ipc('app:editor:nativeFileOpenDialog', (arg, sender) =>
    nativeFileOpenDialog(BrowserWindow.fromWebContents(sender), arg.title, arg.defaultPath, arg.filters));
async function nativeFileOpenDialog(sender: BrowserWindow | null, title: string, defaultPath: string, filters: any) {
    if (!sender) {
        throw new Error('Sender BrowserWindow is not exists.');
    }
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
async function nativeFileSaveDialog(sender: BrowserWindow | null, title: string, defaultPath: string, filters: any) {
    if (!sender) {
        throw new Error('Sender BrowserWindow is not exists.');
    }
    if (defaultPath) {
        let needModExt = false;
        const p = path.normalize(defaultPath);
        if (fs.existsSync(p)) {
            const stat = fs.statSync(p);
            if (stat.isFile()) {
                needModExt = true;
            }
        } else {
            needModExt = true;
        }
        if (needModExt) {
            if (filters && filters.length &&
                filters[0].extensions && filters[0].extensions.length) {

                let matched = false;
                for (;;) {
                    const ext = path.extname(defaultPath);
                    if (! ext) {
                        break;
                    }
                    defaultPath = defaultPath.slice(0, defaultPath.length - ext.length);
                    matched = true;
                }
                if (matched) {
                    defaultPath += `.${filters[0].extensions[0]}`;
                }
            }
        }
    }
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
        source: string, data: Record<string, unknown> | string, options: CliConfig, srcPath: string, ...exportPath: string[]) {

    if (srcPath === null || srcPath === void 0) {
        srcPath = path.join(getDesktopPath(), 'H8f5iZPgOwtZoIN4');
    }
    const srcDir = path.dirname(srcPath);
    const srcBaseName = path.basename(srcPath).slice(0, -(path.extname(srcPath).length));

    let cf: CliConfig | null = null;
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
            const mod = requireDynamic(fileName);
            if (typeof mod === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                cf = mod(getAppEnv());
            } else {
                cf = mod;
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
            const mod = requireDynamic(fileName);
            if (typeof mod === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                cf = mod(getAppEnv());
            } else {
                cf = mod;
            }
        }
    }
    cf = Object.assign({}, cf || {}) as any;

    let d = data;
    if (! d) {
        const fileName = path.join(srcDir, srcBaseName + '.data.lisp');
        if (fs.existsSync(fileName)) {
            d = await readFileAsync(fileName, { encoding: 'utf8' });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            cf!.dataFormat = 'lisp';
        }
    }
    if (! d) {
        const fileName = path.join(srcDir, srcBaseName + '.data.json');
        if (fs.existsSync(fileName)) {
            d = await readFileAsync(fileName, { encoding: 'utf8' });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            cf!.dataFormat = 'json';
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    cf!.tempDir = srcDir;
    let buf = null;
    try {
        // TODO: This has concurrency issue.
        process.chdir(srcDir);
        setLastSrcPath(srcDir);
        buf = await render(source, d || {}, Object.assign(options, cf));
    } finally {
        process.chdir(curDir);
    }

    if (exportPath.length === 0) {
        await mkdirAsync(tmpOutDir, {recursive: true});
    }

    if (options.outputFormat.toLowerCase() === 'pdf') {
        const embedHtmlPath = path.join(tmpDir, 'embed.html');

        if (exportPath.length === 0) {
            await copyFileAsync(
                path.normalize(path.join(thisDirName, `./${contentsRootDir}/embed.html`)),
                embedHtmlPath);
        }

        const outPath = exportPath.length === 0 ?
            path.normalize(path.join(tmpOutDir, `./preview.pdf`)) :
            path.normalize(path.join(...exportPath));
        await writeFileAsync(outPath, buf);

        return embedHtmlPath;
    } else {
        const outPath = exportPath.length === 0 ?
            path.normalize(path.join(tmpOutDir, `./preview.${options.outputFormat}`)) :
            path.normalize(path.join(...exportPath));
        if (options.outputFormat.toLowerCase() === 'html' && outPath.startsWith(tmpOutDir)) {
            buf = Buffer.concat([buf, Buffer.from(additionalContentStyles)]);
        }
        await writeFileAsync(outPath, buf);

        return outPath;
    }
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
            // eslint-disable-next-line no-empty
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
    filePath = filePath.filter(x => x !== null && x!== void 0);
    if (typeof filePath[0] !== 'string') {
        throw new Error('File name is not specified');
    }
    return fs.existsSync(path.normalize(path.join(...filePath)));
}


ipc('app:editor:pathJoin', arg => pathJoin(...arg.filePath));
function pathJoin(...filePath: string[]) {
    filePath = filePath.filter(x => x !== null && x!== void 0);
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
    const startupPath = getStartupFilePath();
    if (startupPath) {
        const p = path.resolve(startupPath);
        setStartupFilePath(void 0);
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
// eslint-disable-next-line @typescript-eslint/require-await
async function openURL(theUrl: string) {
    if (theUrl.match(/^https?:\/\//)) {
        const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
        const child = child_process.exec(start + ' ' + theUrl);
        child.unref();
    }
    return true;
}


ipc('app:editor:openNewWindow', arg => openNewWindow());
// eslint-disable-next-line @typescript-eslint/require-await
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
