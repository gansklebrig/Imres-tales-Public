/* „Ezekiel – The Destroyer“ als Programm für Windows und Linux.
   Schlanke Chromium-Hülle (Electron), die das Spiel offline aus dem Programmordner liefert – mit Grafikkarte, voller
   Bildwiederholrate und echtem Vollbild. Die Browser-Fassung bleibt unverändert. Aufbau nach der Heldensturm-Hülle (desktop/).

   Adresse im Programm: zerstoerer://spiel/zerstoerer.html (eigenes, sicheres Schema – Spielstände liegen im Programmspeicher
   und bleiben bei allen Updates erhalten).
   Zwei Arten von Updates:
   - Spiel-Updates (häufig): beim Start und über „Nach Updates suchen“ die Dateiliste von imrestales.de holen und nur geänderte
     Dateien laden (inhalt.js). Aktiv beim nächsten Start oder sofort mit „Jetzt neu laden“. Keine Neuinstallation.
   - Programm-Updates (selten, nur wenn sich die Hülle ändert): electron-updater aus dem Release „zerstoerer-pc“;
     Windows installiert still an Ort und Stelle (Verknüpfungen bleiben), Linux ersetzt die AppImage-Datei unter gleichem Pfad.
   Tasten: F11 oder Alt+Enter = Vollbild · Strg+R = neu laden · Strg+Umschalt+I = Entwicklerwerkzeuge · Strg+Q = beenden */
'use strict';
const { app, BrowserWindow, Menu, protocol, shell, dialog, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const Inhalt = require('./inhalt');

const SCHEMA = 'zerstoerer';
const START = SCHEMA + '://spiel/zerstoerer.html';
const NETZ = 'https://imrestales.de/';
const SPIEL = app.isPackaged ? path.join(process.resourcesPath, 'spiel') : path.join(__dirname, 'spiel');
const ARG = n => process.argv.some(a => a === '--' + n);
const ENTW = !app.isPackaged || ARG('entwickler');   // Entwicklerwerkzeuge nur beim Entwickeln oder mit --entwickler
const NAME = 'Ezekiel – The Destroyer';

/* Programmspeicher mit festem, einfachem Namen (Windows %APPDATA%\Zerstoerer, Linux ~/.config/Zerstoerer) – vor allem anderen setzen */
app.setPath('userData', path.join(app.getPath('appData'), 'Zerstoerer'));

/* ---------- Sicherheit: im fertigen Programm lässt sich Chromium nicht von außen fernsteuern ---------- */
if (app.isPackaged) for (const s of ['remote-debugging-port', 'remote-debugging-pipe', 'remote-debugging-address', 'remote-allow-origins', 'inspect', 'inspect-brk', 'js-flags', 'load-extension', 'disable-web-security', 'allow-running-insecure-content']) app.commandLine.removeSwitch(s);

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
const log = (...a) => { if (ENTW) console.log('[zerstoerer]', ...a); };

/* ---------- Spiel-Updates (inhalt.js) ---------- */
let INH = null;
function inhaltEinrichten() {
  /* eigene Sitzung nur für die Updates: ohne Zwischenspeicher, und sie darf ausschließlich https://imrestales.de erreichen */
  const ses = session.fromPartition('zs-inhalt', { cache: false });
  ses.webRequest.onBeforeRequest((d, cb) => { let ok = false; try { const u = new URL(d.url); ok = u.protocol === 'https:' && u.host === new URL(NETZ).host; } catch (e) { } cb({ cancel: !ok }); });
  ses.setPermissionRequestHandler((wc, r, cb) => cb(false));
  /* nur zum Testen beim Entwickeln (nie im fertigen Programm): „imrestales.de“ aus einem lokalen Ordner spielen */
  if (!app.isPackaged && process.env.ZS_TEST_ORDNER) {
    const T = path.resolve(process.env.ZS_TEST_ORDNER);
    ses.protocol.handle('https', async req => { const u = new URL(req.url); const f = path.resolve(T, '.' + decodeURIComponent(u.pathname)); if (!f.startsWith(T + path.sep) || !fs.existsSync(f)) return new Response('', { status: 404 }); return new Response(fs.readFileSync(f), { status: 200 }); });
  }
  INH = Inhalt.erstellen({ eingebaut: SPIEL, daten: path.join(app.getPath('userData'), 'inhalt'), basis: NETZ, holen: (url, o) => ses.fetch(url, o) });
  const s = INH.start();
  log('Spielstand', s);
}
async function inhaltPruefen(laut) {
  try {
    const r = await INH.pruefen();
    log('Spiel-Update', r);
    if (r.neu && r.wartet) melden({ art: 'inhalt', stand: r.stand });
    return Object.assign({ ok: true }, r);
  } catch (e) {
    log('Spiel-Update nicht möglich:', e && e.message);   // offline oder Fehler → still weiterspielen, alter Stand bleibt
    return { ok: false, fehler: String(e && e.message || e).slice(0, 200) };
  }
}

/* ---------- Programm-Updates (electron-updater, Release „zerstoerer-pc“) ---------- */
let UPD = null, programmBereit = null;
function programmUpdatesEinrichten() {
  if (!app.isPackaged || ARG('ohne-update')) return;
  if (process.platform === 'linux' && !process.env.APPIMAGE) return;   // nur die AppImage kann sich selbst ersetzen
  /* electron-updater lädt in seiner eigenen Sitzung – die darf nur verschlüsselt zu GitHub (Release-Seite und Download-Server) */
  try {
    session.fromPartition('electron-updater', { cache: false }).webRequest.onBeforeRequest((d, cb) => {
      let ok = false; try { const u = new URL(d.url); ok = u.protocol === 'https:' && /(^|\.)(github\.com|githubusercontent\.com)$/.test(u.hostname); } catch (e) { }
      cb({ cancel: !ok });
    });
  } catch (e) { }
  try { UPD = require('electron-updater').autoUpdater; } catch (e) { UPD = null; return; }
  UPD.autoDownload = true;            // im Hintergrund laden …
  UPD.autoInstallOnAppQuit = true;    // … und beim Beenden still an Ort und Stelle installieren
  UPD.allowDowngrade = false;
  UPD.allowPrerelease = false;
  UPD.logger = null;
  UPD.on('update-downloaded', info => { programmBereit = info && info.version || '?'; melden({ art: 'programm', version: programmBereit }); });
  UPD.on('error', e => log('Programm-Update:', e && e.message));
}
async function programmPruefen() {
  if (!UPD) return { ok: false, aus: true };
  if (programmBereit) return { ok: true, neu: true, bereit: true, version: programmBereit };
  try {
    const r = await UPD.checkForUpdates();
    const v = r && r.updateInfo && r.updateInfo.version;
    const neu = !!(v && r.isUpdateAvailable !== false && v !== app.getVersion());
    return { ok: true, neu, version: v || app.getVersion() };
  } catch (e) { return { ok: false, fehler: String(e && e.message || e).slice(0, 200) }; }
}

/* ---------- Spieldateien ausliefern (mit Teilabrufen für Ton) ---------- */
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif', ico: 'image/x-icon', mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', txt: 'text/plain; charset=utf-8' };
function pfadZu(url) {
  let p; try { const u = new URL(url); if (u.protocol !== SCHEMA + ':' || u.hostname !== 'spiel') return null; p = decodeURIComponent(u.pathname); } catch (e) { return null; }
  if (p.includes('\0')) return null;
  if (p === '/' || p === '') p = '/zerstoerer.html';
  return INH ? INH.datei(p) : null;   // zuerst Update-Ordner, sonst mitgeliefert – nie etwas außerhalb
}
/* Inhaltsrichtlinie: Programmcode nur aus dem Spiel (kein Nachladen von Skripten aus dem Netz), keine Rahmen, keine Plugins.
   Das Spiel braucht kein Netz – also auch keine Verbindungen nach außen. 'unsafe-inline' braucht das Spiel für seine Skripte im Dokument.
   W32 Online: einzige Ausnahme ist der PeerJS-Vermittler (VERMITTLER) für „Online spielen“ – nur https/wss zu genau diesem Host.
   Die Spieldaten selbst laufen über WebRTC-Datenkanäle (UDP, nicht von CSP/webRequest erfasst); STUN ohne TURN, keine Medien. */
const VERMITTLER = '0.peerjs.com';
const CSP = ["default-src 'self' zerstoerer: data: blob:", "script-src 'self' zerstoerer: 'unsafe-inline' 'unsafe-eval' blob:", "style-src 'self' zerstoerer: 'unsafe-inline'",
  "img-src 'self' zerstoerer: data: blob:", "media-src 'self' zerstoerer: data: blob:", "font-src 'self' zerstoerer: data:", "connect-src 'self' zerstoerer: data: blob: https://" + VERMITTLER + " wss://" + VERMITTLER,
  "worker-src 'self' zerstoerer: blob:", "frame-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"].join('; ');
async function liefern(req) {
  const datei = pfadZu(req.url);
  if (!datei) return new Response('', { status: 403 });
  let st; try { st = await fs.promises.stat(datei); } catch (e) { st = null; }
  if (!st || !st.isFile()) return new Response('', { status: 404 });
  const kopf = { 'Content-Type': MIME[path.extname(datei).slice(1).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
  if (/\.html?$/i.test(datei)) kopf['Content-Security-Policy'] = CSP;
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
/* Verweise, die aus dem Spiel hinausführen (Taverne, Release-Seite), öffnet der normale Browser */
function nachAussen(u) {
  try {
    const x = new URL(u);
    if (x.protocol === 'https:' || x.protocol === 'http:' || x.protocol === 'mailto:') { shell.openExternal(x.href); return; }
    if (x.protocol === SCHEMA + ':') shell.openExternal(NETZ + x.pathname.replace(/^\/+/, '') + x.search + x.hash);
  } catch (e) { }
}
function melden(n) { try { if (win && !win.isDestroyed()) win.webContents.send('zs:hinweis', n); } catch (e) { } }
function vollbild(an) { if (!win) return false; const z = an === undefined ? !win.isFullScreen() : !!an; win.setFullScreen(z); CFG.vollbild = z; cfgSichern(); return z; }
function fenster() {
  win = new BrowserWindow({
    width: CFG.b, height: CFG.h, minWidth: 640, minHeight: 400, show: false, fullscreen: !!CFG.vollbild && !ARG('fenster'),
    backgroundColor: '#0e0a0c', title: NAME, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false, devTools: ENTW, webSecurity: true, allowRunningInsecureContent: false, webviewTag: false }
  });
  if (CFG.max && !win.isFullScreen()) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', e => e.preventDefault());
  win.on('enter-full-screen', () => melden({ art: 'vollbild', an: true }));
  win.on('leave-full-screen', () => melden({ art: 'vollbild', an: false }));
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
    else if (strg && k.shift && k.key.toLowerCase() === 'i') { e.preventDefault(); if (ENTW) wc.toggleDevTools(); }
    else if (strg && k.key.toLowerCase() === 'q') { e.preventDefault(); app.quit(); }
  });
  wc.on('render-process-gone', (e, d) => { if (d && d.reason !== 'clean-exit' && win) setTimeout(() => { try { win.loadURL(START); } catch (x) { } }, 400); });
  /* liegt beim Neuladen ein fertiges Update bereit, noch einmal darauf hinweisen */
  wc.on('did-finish-load', () => setTimeout(() => { if (INH && INH.status().wartet) melden({ art: 'inhalt', stand: INH.status().wartendStand }); if (programmBereit) melden({ art: 'programm', version: programmBereit }); }, 2500));
  win.loadURL(START);
}

/* ---------- Brücke zum Spiel (preload.js → window.__zsPC) ---------- */
const vomSpiel = e => { try { return !!(win && e.sender === win.webContents && e.senderFrame && e.senderFrame === win.webContents.mainFrame && imSpiel(e.senderFrame.url)); } catch (x) { return false; } };
const nur = f => (e, ...a) => (vomSpiel(e) ? f(e, ...a) : undefined);
ipcMain.handle('zs:vollbild', nur((e, an) => vollbild(an === undefined || an === null ? undefined : !!an)));
ipcMain.handle('zs:istVollbild', nur(() => !!(win && win.isFullScreen())));
ipcMain.handle('zs:beenden', nur(() => { app.quit(); }));
ipcMain.handle('zs:updates', nur(async () => { const [inhalt, programm] = await Promise.all([inhaltPruefen(true), programmPruefen()]); return { inhalt, programm, stand: INH ? INH.status() : null, version: app.getVersion() }; }));
ipcMain.handle('zs:neuLaden', nur(() => {
  if (programmBereit && UPD) { setImmediate(() => { try { UPD.quitAndInstall(true, true); } catch (e) { } }); return 'programm'; }   // still installieren und neu starten
  if (INH && INH.umschalten()) { setTimeout(() => { if (win) win.webContents.reloadIgnoringCache(); }, 50); return 'inhalt'; }
  return false;
}));
ipcMain.handle('zs:gpu', nur(async () => { try { const i = await app.getGPUInfo('basic'); const s = app.getGPUFeatureStatus(); return { karten: (i.gpuDevice || []).map(d => ({ aktiv: !!d.active, hersteller: d.vendorId, geraet: d.deviceId })), stand: s }; } catch (e) { return null; } }));
/* W31 Spielbericht: Text (JSON) über den Speichern-Dialog des Systems sichern. Nur, was der Spieler im Dialog wählt;
   nur .json/.txt, höchstens 5 MB, Vorschlag im Dokumente-Ordner. Das Spiel selbst bekommt keinen Dateizugriff. */
ipcMain.handle('zs:speichern', nur(async (e, name, text) => {
  try {
    if (typeof text !== 'string' || text.length > 5 * 1024 * 1024) return { ok: false, fehler: 'zu groß' };
    const vorschlag = String(name || 'zerstoerer-bericht.json').replace(/[^\w.\-äöüÄÖÜß]/g, '_').slice(0, 80);
    const r = await dialog.showSaveDialog(win, { title: 'Spielbericht speichern', defaultPath: path.join(app.getPath('documents'), vorschlag),
      filters: [{ name: 'Spielbericht (JSON)', extensions: ['json'] }, { name: 'Text', extensions: ['txt'] }] });
    if (r.canceled || !r.filePath) return { ok: false, abbruch: true };
    if (!/\.(json|txt)$/i.test(r.filePath)) return { ok: false, fehler: 'nur .json oder .txt' };
    await fs.promises.writeFile(r.filePath, text, 'utf8');
    return { ok: true, pfad: r.filePath };
  } catch (x) { return { ok: false, fehler: String(x && x.message || x) }; }
}));
/* W39 Teilen: Ergebniskarte als PNG über den Speichern-Dialog. Nur .png, höchstens 4 MB, Daten als ArrayBuffer/Uint8Array,
   die mit der PNG-Signatur beginnen müssen. Ziel wählt der Spieler im Dialog (Vorschlag: Bilder-Ordner). */
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
ipcMain.handle('zs:speichernBild', nur(async (e, name, daten) => {
  try {
    let buf = null;
    if (daten instanceof ArrayBuffer) buf = Buffer.from(daten);
    else if (ArrayBuffer.isView(daten) && daten instanceof Uint8Array) buf = Buffer.from(daten.buffer, daten.byteOffset, daten.byteLength);
    if (!buf) return { ok: false, fehler: 'falscher Typ' };
    if (buf.length < 64 || buf.length > 4 * 1024 * 1024) return { ok: false, fehler: 'Größe' };
    if (!buf.subarray(0, 8).equals(PNG_SIG)) return { ok: false, fehler: 'kein PNG' };
    const vorschlag = (String(name || 'ezekiel.png').replace(/[^\w.\-äöüÄÖÜß]/g, '_').replace(/\.png$/i, '').replace(/^\.+/, '').slice(0, 76) || 'ezekiel') + '.png';
    let ordner; try { ordner = app.getPath('pictures'); } catch (x) { ordner = app.getPath('documents'); }
    const r = await dialog.showSaveDialog(win, { title: 'Ergebniskarte speichern', defaultPath: path.join(ordner, vorschlag), filters: [{ name: 'Bild (PNG)', extensions: ['png'] }] });
    if (r.canceled || !r.filePath) return { ok: false, abbruch: true };
    if (!/\.png$/i.test(r.filePath)) return { ok: false, fehler: 'nur .png' };
    await fs.promises.writeFile(r.filePath, buf);
    return { ok: true, pfad: r.filePath };
  } catch (x) { return { ok: false, fehler: String(x && x.message || x) }; }
}));
ipcMain.on('zs:info', e => { if (!vomSpiel(e)) { e.returnValue = {}; return; } const s = INH ? INH.status() : {}; e.returnValue = { version: app.getVersion(), plattform: process.platform, chrom: process.versions.chrome, electron: process.versions.electron, stand: s.stand || 0, ausUpdate: !!s.ausUpdate }; });

/* ---------- Start ---------- */
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    cfgLaden();
    Menu.setApplicationMenu(null);
    if (!fs.existsSync(path.join(SPIEL, 'zerstoerer.html'))) { dialog.showErrorBox(NAME, 'Die Spieldateien fehlen (' + SPIEL + ').\nBitte das Programm neu installieren.'); app.quit(); return; }
    inhaltEinrichten();
    protocol.handle(SCHEMA, liefern);
    /* Mikrofon, Standort usw. braucht das Spiel nicht; Vollbild und Zeigersperre schon */
    const RECHTE = ['fullscreen', 'pointerLock', 'clipboard-sanitized-write', 'keyboardLock'];
    const ses = session.defaultSession;
    ses.setPermissionRequestHandler((wc, recht, cb) => cb(RECHTE.includes(recht)));
    ses.setPermissionCheckHandler((wc, recht) => RECHTE.includes(recht));
    if (ses.setDevicePermissionHandler) ses.setDevicePermissionHandler(() => false);
    /* Netz: das Spiel selbst lädt nichts von außen – nur die eigenen Spieldateien (kein http/https, kein Zugriff auf Dateien des Rechners).
       Die Updates laufen in eigenen Sitzungen (zs-inhalt nur https://imrestales.de, electron-updater nur https). */
    /* W32 Online: zusätzlich nur der PeerJS-Vermittler (https/wss, genau dieser Host, Standard-Port) – sonst weiterhin nichts */
    ses.webRequest.onBeforeRequest((d, cb) => { let pr = '', ok = false; try { const u = new URL(d.url); pr = u.protocol; ok = (pr === 'https:' || pr === 'wss:') && u.hostname === VERMITTLER && (u.port === '' || u.port === '443') && !u.username && !u.password; } catch (e) { } cb({ cancel: !ok && !['zerstoerer:', 'data:', 'blob:', 'devtools:'].includes(pr) }); });
    ses.on('will-download', e => e.preventDefault());   // das Programm lädt nichts auf den Rechner – Downloads laufen über den Browser
    fenster();
    programmUpdatesEinrichten();
    if (!ARG('ohne-update')) {
      setTimeout(() => inhaltPruefen(false), 4000);
      if (UPD) setTimeout(() => programmPruefen(), 9000);
    }
  });
  /* keine weiteren Fenster, Rahmen oder eingebetteten Seiten – alles außerhalb des Spiels geht an den Browser */
  app.on('web-contents-created', (ev, wc) => {
    wc.on('will-attach-webview', e => e.preventDefault());
    wc.setWindowOpenHandler(({ url }) => { nachAussen(url); return { action: 'deny' }; });
    wc.on('will-frame-navigate', e => { if (!e.isMainFrame && !imSpiel(e.url)) e.preventDefault(); });
  });
  app.on('window-all-closed', () => app.quit());
}
