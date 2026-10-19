'use strict';
const { contextBridge, ipcRenderer } = require('electron');

// Main replies { ok, value } | { ok, error } so validation messages reach the UI unmangled.
async function call(channel, ...args) {
  const res = await ipcRenderer.invoke(channel, ...args);
  if (!res.ok) throw new Error(res.error);
  return res.value;
}

contextBridge.exposeInMainWorld('recivo', {
  list: () => call('recipes:list'),
  save: (recipe) => call('recipes:save', recipe),
  remove: (id) => call('recipes:remove', id),
  savePhoto: (bytes) => call('photos:save', bytes),
  openFolder: () => call('app:open-folder'),
});
