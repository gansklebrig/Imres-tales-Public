/* Brücke zwischen Programm und Spiel: window.__zsPC (nur wenige, ungefährliche Funktionen).
   Das Spiel erkennt daran das Programm (Grafik-Automatik startet oben, Menüpunkte „Nach Updates suchen“ und „Beenden“). */
'use strict';
const { contextBridge, ipcRenderer } = require('electron');
let info = {};
try { info = ipcRenderer.sendSync('zs:info') || {}; } catch (e) { }
const hoerer = new Set();
ipcRenderer.on('zs:hinweis', (e, n) => { for (const f of hoerer) { try { f(n); } catch (x) { } } });
contextBridge.exposeInMainWorld('__zsPC', {
  version: info.version || '',
  plattform: info.plattform || '',
  chrom: info.chrom || '',
  stand: info.stand || 0,
  vollbild: an => ipcRenderer.invoke('zs:vollbild', an),
  istVollbild: () => ipcRenderer.invoke('zs:istVollbild'),
  updates: () => ipcRenderer.invoke('zs:updates'),
  neuLaden: () => ipcRenderer.invoke('zs:neuLaden'),
  gpu: () => ipcRenderer.invoke('zs:gpu'),
  beenden: () => ipcRenderer.invoke('zs:beenden'),
  /* W31: Spielbericht über den Speichern-Dialog sichern → { ok, pfad } | { ok:false, abbruch|fehler } */
  speichern: (name, text) => ipcRenderer.invoke('zs:speichern', String(name || ''), String(text || '')),
  /* W39 Teilen: Ergebniskarte als PNG (ArrayBuffer/Uint8Array, ≤ 4 MB, PNG-Signatur wird im Programm geprüft) → { ok, pfad } | { ok:false, … } */
  speichernBild: (name, daten) => ipcRenderer.invoke('zs:speichernBild', String(name || ''), (daten instanceof ArrayBuffer || daten instanceof Uint8Array) ? daten : null),
  /* Hinweise vom Programm: {art: 'inhalt'|'programm'|'vollbild', …} */
  bei: f => { if (typeof f === 'function') hoerer.add(f); }
});
