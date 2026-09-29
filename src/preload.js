const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (title) => ipcRenderer.invoke('add-task', title),
  toggleTask: (data) => ipcRenderer.invoke('toggle-task', data),
  updateTaskTitle: (data) => ipcRenderer.invoke('update-task-title', data),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id)
});