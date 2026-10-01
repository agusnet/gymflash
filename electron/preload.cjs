const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Authentication
  login: (credentials) => ipcRenderer.invoke('db:login', credentials),
  
  // Generic DB methods
  query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
  execute: (sql, params) => ipcRenderer.invoke('db:execute', { sql, params }),
});
