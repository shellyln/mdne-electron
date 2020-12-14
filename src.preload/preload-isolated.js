
{
    const { contextBridge, ipcRenderer } = require('electron');
    const apiKey = require('crypto').randomBytes(128).toString('hex');
    let apiKeyCopy = apiKey;

    contextBridge.exposeInMainWorld(
        'mdneApi', {
            getKey: () => {
                const k = apiKeyCopy;
                apiKeyCopy = null;
                return k;
            },
            on: (key, channel, listener) => {
                if (key !== apiKey) {
                    throw new Error('Denied');
                }
                ipcRenderer.on(channel, (evt, ...args) => {
                    const send = (...params) => evt.sender.sendTo(evt.senderId, ...params);
                    // NOTE: Don't pass `evt.ports`.
                    listener({ send }, ...args);
                });
            },
            send: (key, eventName, params) => {
                if (key !== apiKey) {
                    throw new Error('Denied');
                }
                ipcRenderer.send(eventName, params);
            },
            ipc: (key, eventName, params) => {
                if (key !== apiKey) {
                    throw new Error('Denied');
                }
                // TODO: Change to `ipcRenderer.invoke()` <-> `ipcMain.handle()`
                return new Promise((resolve, reject) => {
                    ipcRenderer.send(eventName, params);
                    ipcRenderer.once(eventName, (event, arg) => {
                        if (arg && arg.succeeded) {
                            resolve(arg.payload);
                        } else {
                            reject(arg && arg.error);
                        }
                    });
                });
            },
            ipcSync: (key, eventName, params) => {
                if (key !== apiKey) {
                    throw new Error('Denied');
                }
                return ipcRenderer.sendSync(eventName, params);
            },
        }
    );
}
