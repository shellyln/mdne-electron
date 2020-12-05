
{
    const { contextBridge, ipcRenderer} = require('electron');

    contextBridge.exposeInMainWorld(
        'mdneApi', {
            on: (channel, listener) => ipcRenderer.on(channel, listener),
            send: (eventName, params) => ipcRenderer.send(eventName, params),
            ipc: (eventName, params) => {
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
            ipcSync: (eventName, params) => {
                return ipcRenderer.sendSync(eventName, params);
            },
        }
    );
}
