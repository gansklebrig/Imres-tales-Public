/* Heldensturm als Programm für Windows und Linux.
   Eine schlanke Chromium-Hülle (Electron), die das ganze Spiel offline aus dem Programmordner liefert –
   mit Grafikkarte, voller Bildwiederholrate und echtem Vollbild. Die Browser-Fassung bleibt unverändert.

   Adresse im Programm: heldensturm://spiel/heldensturm.html (eigenes, sicheres Schema – Spielstände liegen
   im Programm-Speicher und bleiben bei Updates erhalten).
   Tasten: F11 oder Alt+Enter = Vollbild · Strg+R = neu laden · Strg+Umschalt+I = Entwicklerwerkzeuge · Strg+Q = beenden */
'use strict';
const { app, BrowserWindow, Menu, protocol, shell, dialog, ipcMain, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const SCHEMA = 'heldensturm';
const START = SCHEMA + '://spiel/heldensturm.html';
const NETZ = 'https://imrestales.de/';
const RELEASES = 'https://api.github.com/repos/gansklebrig/Imres-tales-Public/releases?per_page=40';
const TAG = /^heldensturm-pc-1\.(\d+)$/;
const SPIEL = app.isPackaged ? path.join(process.resourcesPath, 'spiel') : path.join(__dirname, 'spiel');
const ARG = n => process.argv.some(a => a === '--' + n);

/* ---------- Grafikkarte ausreizen (muss vor „ready“ stehen) ---------- */
if (ARG('ohne-gpu')) app.disableHardwareAcceleration();
else {
  app.commandLine.appendSwitch('force_high_performance_gpu');     // Laptop mit zwei Grafikkarten: die starke nehmen
  app.commandLine.appendSwitch('ignore-gpu-blocklist');           // v. a. Linux: Treiber nicht vorsorglich aussperren
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('canvas-oop-rasterization');
}
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
if (process.platform === 'linux') app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

protocol.registerSchemesAsPrivileged([{ scheme: SCHEMA, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } }]);

/* ---------- Einstellungen des Programms (Fenster, Vollbild) ---------- */
const CFG_DATEI = () => path.join(app.getPath('userData'), 'programm.json');
let CFG = { vollbild: true, b: 1600, h: 900, max: true };
function cfgLaden() { try { Object.assign(CFG, JSON.parse(fs.readFileSync(CFG_DATEI(), 'utf8'))); } catch (e) { } }
function cfgSichern() { try { fs.writeFileSync(CFG_DATEI(), JSON.stringify(CFG)); } catch (e) { } }

/* ---------- Spieldateien ausliefern (mit Teilabrufen für Ton und Video) ---------- */
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', webmanifest: 'application/manifest+json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif', ico: 'image/x-icon', mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', webm: 'video/webm', mp4: 'video/mp4', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', txt: 'text/plain; charset=utf-8', wasm: 'application/wasm' };
function pfadZu(url) {
  let p; try { p = decodeURIComponent(new URL(url).pathname); } catch (e) { return null; }
  if (p === '/' || p === '') p = '/heldensturm.html';
  const ziel = path.normalize(path.join(SPIEL, p));
  if (ziel !== SPIEL && !ziel.startsWith(SPIEL + path.sep)) return null;   // nichts außerhalb des Spielordners
  return ziel;
}
async function liefern(req) {
  const datei = pfadZu(req.url);
  if (!datei) return new Response('', { status: 403 });
  let st; try { st = await fs.promises.stat(datei); } catch (e) { st = null; }
  if (!st || !st.isFile()) return new Response('', { status: 404 });
  const kopf = { 'Content-Type': MIME[path.extname(datei).slice(1).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  if (req.method === 'HEAD') return new Response(null, { status: 200, headers: Object.assign(kopf, { 'Content-Length': String(st.size) }) });
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (m && (m[1] || m[2]) && st.size > 0) {
    let a = m[1] ? parseInt(m[1], 10) : Math.max(0, st.size - parseInt(m[2], 10));
    let b = m[1] && m[2] ? Math.min(parseInt(m[2], 10), st.size - 1) : st.size - 1;
    if (!(a <= b) || a >= st.size) return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + st.size } });
    kopf['Content-Range'] = `bytes ${a}-${b}/${st.size}`; kopf['Content-Length'] = String(b - a + 1);
    return new Response(Readable.toWeb(fs.createReadStream(datei, { start: a, end: b })), { status: 206, headers: kopf });
  }
  kopf['Content-Length'] = String(st.size);
  return new Response(st.size ? Readable.toWeb(fs.createReadStream(datei)) : null, { status: 200, headers: kopf });
}

/* ---------- Fenster ---------- */
let win = null;
const imSpiel = u => { try { return new URL(u).protocol === SCHEMA + ':'; } catch (e) { return false; } };
/* Verweise, die aus dem Spiel hinausführen (Taverne, andere Seiten, Downloads), öffnet der normale Browser */
function nachAussen(u) {
  try {
    const x = new URL(u);
    if (x.protocol === 'https:' || x.protocol === 'http:' || x.protocol === 'mailto:') { shell.openExternal(x.href); return; }
    if (x.protocol === SCHEMA + ':') shell.openExternal(NETZ + x.pathname.replace(/^\/+/, '') + x.search + x.hash);
  } catch (e) { }
}
function vollbild(an) { if (!win) return false; const z = an === undefined ? !win.isFullScreen() : !!an; win.setFullScreen(z); CFG.vollbild = z; cfgSichern(); return z; }
function fenster() {
  win = new BrowserWindow({
    width: CFG.b, height: CFG.h, minWidth: 640, minHeight: 400, show: false, fullscreen: !!CFG.vollbild && !ARG('fenster'),
    backgroundColor: '#100c12', title: 'Heldensturm', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false, devTools: true }
  });
  if (CFG.max && !win.isFullScreen()) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', e => e.preventDefault());
  win.on('close', () => { try { if (!win.isFullScreen() && !win.isMaximized()) { const [b, h] = win.getSize(); CFG.b = b; CFG.h = h; } CFG.max = win.isMaximized(); CFG.vollbild = win.isFullScreen(); cfgSichern(); } catch (e) { } });
  win.on('closed', () => { win = null; });
  const wc = win.webContents;
  wc.setWindowOpenHandler(({ url }) => { nachAussen(url); return { action: 'deny' }; });
  wc.on('will-navigate', (e, url) => {
    if (!imSpiel(url)) { e.preventDefault(); nachAussen(url); return; }
    const d = pfadZu(url); if (!d || !fs.existsSync(d)) { e.preventDefault(); nachAussen(url); }   // z. B. „Zur Taverne“ – gehört nicht zum Programm
  });
  wc.on('before-input-event', (e, k) => {
    if (k.type !== 'keyDown') return;
    const strg = k.control || k.meta;
    if (k.key === 'F11' || (k.alt && k.key === 'Enter')) { e.preventDefault(); vollbild(); }
    else if (strg && !k.shift && k.key.toLowerCase() === 'r') { e.preventDefault(); wc.reloadIgnoringCache(); }
    else if (strg && k.shift && k.key.toLowerCase() === 'i') { e.preventDefault(); wc.toggleDevTools(); }
    else if (strg && k.key.toLowerCase() === 'q') { e.preventDefault(); app.quit(); }
  });
  wc.on('render-process-gone', (e, d) => { if (d && d.reason !== 'clean-exit' && win) setTimeout(() => { try { win.loadURL(START); } catch (x) { } }, 400); });
  win.loadURL(START);
}

/* ---------- Updates: neue Fassung in den GitHub-Releases (heldensturm-pc-1.N) ---------- */
const eigene = () => { const m = /^1\.(\d+)\./.exec(app.getVersion()); return m ? +m[1] : 0; };
const DATEI = process.platform === 'win32' ? 'Heldensturm-Setup.exe' : 'Heldensturm.AppImage';
async function updateSuchen(laut) {
  let neu = null;
  try {
    const r = await net.fetch(RELEASES, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Heldensturm-PC' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    for (const rel of await r.json()) {
      const m = TAG.exec(rel.tag_name || ''); if (!m || rel.draft) continue;
      const a = (rel.assets || []).find(x => x.name === DATEI);
      if (!neu || +m[1] > neu.n) neu = { n: +m[1], seite: rel.html_url, datei: a && a.browser_download_url, text: String(rel.body || '').split('\n')[0].slice(0, 300) };
    }
  } catch (e) {
    if (laut && win) dialog.showMessageBox(win, { type: 'warning', message: 'Die Suche nach Updates hat nicht geklappt.', detail: 'Bitte die Internetverbindung prüfen und später noch einmal versuchen.\n(' + (e && e.message || e) + ')' });
    return { ok: false };
  }
  const ich = eigene();
  if (!neu || neu.n <= ich || !ich) {
    if (laut && win) dialog.showMessageBox(win, { type: 'info', message: 'Heldensturm ist aktuell.', detail: 'Programm-Version 1.' + ich });
    return { ok: true, neu: false, version: ich };
  }
  if (!laut && CFG.spaeter === neu.n) return { ok: true, neu: true, version: neu.n };
  if (win) {
    const a = await dialog.showMessageBox(win, { type: 'info', buttons: ['Herunterladen', 'Später'], defaultId: 0, cancelId: 1, message: `Neue Fassung von Heldensturm: 1.${neu.n}`, detail: (neu.text ? neu.text + '\n\n' : '') + `Du hast 1.${ich}. Der Download öffnet sich im Browser – danach die Datei einfach ausführen. Spielstände bleiben erhalten.` });
    if (a.response === 0) shell.openExternal(neu.datei || neu.seite); else { CFG.spaeter = neu.n; cfgSichern(); }
  }
  return { ok: true, neu: true, version: neu.n };
}

/* ---------- Brücke zum Spiel (preload.js → window.__hsPC) ---------- */
ipcMain.handle('hs:vollbild', (e, an) => vollbild(an));
ipcMain.handle('hs:istVollbild', () => !!(win && win.isFullScreen()));
ipcMain.handle('hs:beenden', () => { app.quit(); });
ipcMain.handle('hs:updates', () => updateSuchen(true));
ipcMain.handle('hs:gpu', async () => { try { const i = await app.getGPUInfo('basic'); const s = app.getGPUFeatureStatus(); return { karten: (i.gpuDevice || []).map(d => ({ aktiv: !!d.active, hersteller: d.vendorId, geraet: d.deviceId })), stand: s }; } catch (e) { return null; } });
ipcMain.on('hs:info', e => { e.returnValue = { version: app.getVersion(), plattform: process.platform, chrom: process.versions.chrome, electron: process.versions.electron }; });

/* ---------- Start ---------- */
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    cfgLaden();
    Menu.setApplicationMenu(null);
    protocol.handle(SCHEMA, liefern);
    /* Mikrofon, Standort usw. braucht das Spiel nicht; Vollbild und Zeigersperre schon */
    session.defaultSession.setPermissionRequestHandler((wc, recht, cb) => cb(['fullscreen', 'pointerLock', 'clipboard-sanitized-write', 'keyboardLock'].includes(recht)));
    if (!fs.existsSync(path.join(SPIEL, 'heldensturm.html'))) { dialog.showErrorBox('Heldensturm', 'Die Spieldateien fehlen (' + SPIEL + ').\nBitte das Programm neu installieren.'); app.quit(); return; }
    fenster();
    if (app.isPackaged && !ARG('ohne-update')) setTimeout(() => updateSuchen(false), 8000);
  });
  app.on('window-all-closed', () => app.quit());
}
