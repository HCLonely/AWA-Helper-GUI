/* eslint-disable max-len */

import { readSetting, readDefaultSetting, saveSetting } from './readSetting';
import { contextBridge, ipcRenderer } from 'electron';
const version = '__APP_VERSION__';
const author = '__APP_AUTHOR__';
contextBridge.exposeInMainWorld('ipcRenderer', {
  ...ipcRenderer,
  on(ipcName: string, callback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) {
    ipcRenderer.on(ipcName, callback);
  },
});
export { readSetting, readDefaultSetting, saveSetting, version, author };
