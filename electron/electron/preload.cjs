const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },
  on: (channel, func) => {
    const subscription = (event, ...args) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  startRealTraining: (config) => ipcRenderer.invoke('start-real-training', config),
  stopRealTraining: () => ipcRenderer.invoke('stop-real-training'),
});

