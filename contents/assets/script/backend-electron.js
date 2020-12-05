// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln



{
    window.rpc = window.rpc || {};
    window.rpc.handle = window.rpc.handle || (x => x);
    window.carlo = window.carlo || {};

    window._MDNE_BACKEND_TYPE = 'ELECTRON_IPC';
    window._MDNE_BACKEND_CAPS_NO_PDF_RENDERER = false;
    window._MDNE_BACKEND_CAPS_NO_PDF_PREVIEW_PLUGIN = false;


    window.nativeNotifyEditorDirty = (dirty) => {
        mdneApi.send('app:editor:notifyEditorDirty', {
            dirty,
        });
    };


    window.nativeAlert = (async (message, type) => {
        return await mdneApi.ipc('app:editor:nativeAlert', {
            message,
            type,
        });
    });


    window.nativeAlertSync = ((message, type) => {
        return mdneApi.ipcSync('app:editor:nativeAlertSync', {
            message,
            type,
        });
    });


    window.nativeConfirm = (async (message, type) => {
        return await mdneApi.ipc('app:editor:nativeConfirm', {
            message,
            type,
        });
    });


    window.nativeConfirmSync = ((message, type) => {
        return mdneApi.ipcSync('app:editor:nativeConfirmSync', {
            message,
            type,
        });
    });


    window.nativeFileOpenDialog = (async (title, defaultPath, filters) => {
        return await mdneApi.ipc('app:editor:nativeFileOpenDialog', {
            title,
            defaultPath,
            filters,
        });
    });


    window.nativeFileSaveDialog = (async (title, defaultPath, filters) => {
        return await mdneApi.ipc('app:editor:nativeFileSaveDialog', {
            title,
            defaultPath,
            filters,
        });
    });


    window.renderByMenneu = (async (source, data, options, srcPath, ...exportPath) => {
        return await mdneApi.ipc('app:editor:renderByMenneu', {
            source,
            data,
            options,
            srcPath,
            exportPath,
        });
    });


    window.loadFile = (async (...filePath) => {
        return await mdneApi.ipc('app:editor:loadFile', {
            filePath,
        });
    });


    window.saveFile = (async (text, ...filePath) => {
        return await mdneApi.ipc('app:editor:saveFile', {
            text,
            filePath,
        });
    });


    window.listDirectory = (async (...dirPath) => {
        return await mdneApi.ipc('app:editor:listDirectory', {
            dirPath,
        });
    });


    window.listDesktopDirectory = (async () => {
        return await mdneApi.ipc('app:editor:listDesktopDirectory', {});
    });


    window.listHomeDirectory = (async () => {
        return await mdneApi.ipc('app:editor:listHomeDirectory', {});
    });


    window.fileExists = (async (...filePath) => {
        return await mdneApi.ipc('app:editor:fileExists', {
            filePath,
        });
    });


    window.pathJoin = (async (...filePath) => {
        return await mdneApi.ipc('app:editor:pathJoin', {
            filePath,
        });
    });


    window.getDirName = (async (filePath) => {
        return await mdneApi.ipc('app:editor:getDirName', {
            filePath,
        });
    });


    window.getBaseName = (async (filePath) => {
        return await mdneApi.ipc('app:editor:getBaseName', {
            filePath,
        });
    });


    window.getStartupFile = (async () => {
        return await mdneApi.ipc('app:editor:getStartupFile', {});
    });


    window.openURL = (async (url) => {
        return await mdneApi.ipc('app:editor:openURL', {
            url,
        });
    });


    window.openNewWindow = (async () => {
        return await mdneApi.ipc('app:editor:openNewWindow', {});
    });


    class Backend {
        async setFrontend(frontend) {
            this.frontend_ = frontend;
            (async () => {
                //
            })();
        }

        async runCommand(command) {
            return await mdneApi.ipc('app:editor:Backend:runCommand', {
                command,
            });
        }

        async runCommandAST(ast) {
            return await mdneApi.ipc('app:editor:Backend:runCommandAST', {
                ast,
            });
        }
    }

    const backend_ = new Backend;

    mdneApi.on('app:editor:Frontend:runCommand', async (event, arg) => {
        try {
            let ret = backend_.frontend_.runCommand(arg.command);
            if (ret instanceof Promise) {
                ret = await ret;
            }
            event.sender.send('app:editor:Frontend:runCommand', {succeeded: true, payload: ret});
        } catch (e) {
            event.sender.send('app:editor:Frontend:runCommand', {succeeded: false, error: e.message});
        }
    });


    window.carlo.loadParams = (async () => {
        return [backend_];
    });


    window.carlo.fileInfo = (async (file) => {
        return ({
            path: file.path,
            fileBodyText: await loadFile(file.path),
        });
    });


    document.addEventListener('keyup', (ev) => {
        if (ev.keyCode === 122) {
            // F11
            mdneApi.ipc('app:editor:toggleFullScreen', {});
            ev.preventDefault();
        }
    }, false);
}
