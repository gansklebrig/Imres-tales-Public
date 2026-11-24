/* Brücke zwischen Programm und Spiel: window.__hsPC (nur wenige, ungefährliche Funktionen). */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
let info = {};
try { info = ipcRenderer.sendSync('hs:info') || {}; } catch (e) { }
contextBridge.exposeInMainWorld('__hsPC', {
  version: info.version || '',
  plattform: info.plattform || '',
  chrom: info.chrom || '',
  vollbild: an => ipcRenderer.invoke('hs:vollbild', an),
  istVollbild: () => ipcRenderer.invoke('hs:istVollbild'),
  updates: () => ipcRenderer.invoke('hs:updates'),
  gpu: () => ipcRenderer.invoke('hs:gpu'),
  beenden: () => ipcRenderer.invoke('hs:beenden')
});
