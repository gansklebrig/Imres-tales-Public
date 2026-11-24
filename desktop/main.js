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
const crypto = require('crypto');
const { spawn } = require('child_process');

const SCHEMA = 'heldensturm';
const START = SCHEMA + '://spiel/heldensturm.html';
const NETZ = 'https://imrestales.de/';
const RELEASES = 'https://api.github.com/repos/gansklebrig/Imres-tales-Public/releases?per_page=40';
const TAG = /^heldensturm-pc-1\.(\d+)$/;
const QUELLE = 'https://github.com/gansklebrig/Imres-tales-Public/releases';
const SPIEL = app.isPackaged ? path.join(process.resourcesPath, 'spiel') : path.join(__dirname, 'spiel');
const ARG = n => process.argv.some(a => a === '--' + n);
const ENTW = !app.isPackaged || ARG('entwickler');   // Entwicklerwerkzeuge nur beim Entwickeln oder mit --entwickler

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

/* ---------- Spieldateien ausliefern (mit Teilabrufen für Ton und Video) ---------- */
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', webmanifest: 'application/manifest+json', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif', ico: 'image/x-icon', mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg', wav: 'audio/wav', m4a: 'audio/mp4', webm: 'video/webm', mp4: 'video/mp4', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', txt: 'text/plain; charset=utf-8', wasm: 'application/wasm' };
function pfadZu(url) {
  let p; try { const u = new URL(url); if (u.hostname !== 'spiel') return null; p = decodeURIComponent(u.pathname); } catch (e) { return null; }
  if (p.includes('\0')) return null;
  if (p === '/' || p === '') p = '/heldensturm.html';
  const ziel = path.normalize(path.join(SPIEL, p));
  if (ziel !== SPIEL && !ziel.startsWith(SPIEL + path.sep)) return null;   // nichts außerhalb des Spielordners
  return ziel;
}
/* Inhaltsrichtlinie: Programmcode nur aus dem Programmordner (kein Nachladen von Skripten aus dem Netz), keine Rahmen, keine Plugins.
   'unsafe-inline'/'unsafe-eval' braucht das Spiel für seine eigenen Skripte im Dokument; Netz nur verschlüsselt (Bestenliste, Online-Mehrspieler, Updates). */
const CSP = ["default-src 'self' heldensturm: data: blob:", "script-src 'self' heldensturm: 'unsafe-inline' 'unsafe-eval' blob:", "style-src 'self' heldensturm: 'unsafe-inline'",
  "img-src 'self' heldensturm: data: blob:", "media-src 'self' heldensturm: data: blob:", "font-src 'self' heldensturm: data:", "connect-src 'self' heldensturm: https: wss: data: blob:",
  "worker-src 'self' heldensturm: blob:", "frame-src 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'none'"].join('; ');
async function liefern(req) {
  const roh = pfadZu(req.url);
  if (!roh) return new Response('', { status: 403 });
  const datei = geladen(roh);
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
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, spellcheck: false, devTools: ENTW, webSecurity: true, allowRunningInsecureContent: false, webviewTag: false }
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
    const d = pfadZu(url); if (!d || !fs.existsSync(geladen(d))) { e.preventDefault(); nachAussen(url); }   // z. B. „Zur Taverne“ – gehört nicht zum Programm
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
  win.loadURL(START);
}

/* ---------- Updates ----------
   1. Spiel-Updates ohne Neuinstallation: jede Fassung (Release heldensturm-pc-1.N) enthält spiel-manifest.json mit
      Prüfsummen aller Spieldateien. Das Programm lädt nur Dateien, die sich vom mitgelieferten Stand unterscheiden,
      prüft jede gegen ihre SHA-256-Summe und legt sie im eigenen Datenordner ab (userData/spiel-neu). Beim nächsten
      Start wird daraus userData/spiel-aktuell; geliefert wird zuerst von dort, sonst aus dem Programmordner.
      Programmdatei, Verknüpfung und Tastenkürzel bleiben unberührt.
   2. Programm-Updates (nur wenn sich die Hülle geändert hat): Windows lädt die Setup-Datei, prüft sie und spielt sie
      beim Beenden still am selben Ort ein; Linux ersetzt die AppImage-Datei unter demselben Namen. */
const MANI = 'spiel-manifest.json';
const RAW = 'https://raw.githubusercontent.com/gansklebrig/Imres-tales-Public/';
const UD = () => app.getPath('userData');
const AKT = () => path.join(UD(), 'spiel-aktuell');
const NEU = () => path.join(UD(), 'spiel-neu');
const PROG = () => path.join(UD(), 'programm-update');
const HEX = /^[0-9a-f]{64}$/;
let BUND = null, OVER = null;   // Manifest des Programmordners / der geladenen Spieldateien
function maniLesen(dir) { try { const m = JSON.parse(fs.readFileSync(path.join(dir, MANI), 'utf8')); if (m && m.v === 1 && m.dateien && typeof m.inhalt === 'number') return m; } catch (e) { } return null; }
function weg(d) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { } }
const relOk = r => typeof r === 'string' && r.length > 0 && r.length < 400 && !/[\\:\0]/.test(r) && !r.split('/').some(s => s === '' || s === '.' || s === '..');
const relPfad = (wurzel, r) => path.join(wurzel, ...r.split('/'));
/* beim Start: fertig geladenes Spiel-Update übernehmen, Veraltetes aufräumen */
function spielStand() {
  BUND = maniLesen(SPIEL);
  if (maniLesen(NEU())) {
    const alt = path.join(UD(), 'spiel-alt'); weg(alt);
    try { if (fs.existsSync(AKT())) fs.renameSync(AKT(), alt); fs.renameSync(NEU(), AKT()); } catch (e) { }
    weg(alt);
  } else weg(NEU());
  OVER = maniLesen(AKT());
  if (OVER && (!BUND || OVER.inhalt <= BUND.inhalt)) { weg(AKT()); OVER = null; }   // ein Programm-Update brachte schon Neueres mit
  if (CFG.programm && CFG.programm.n <= eigene()) { weg(PROG()); delete CFG.programm; cfgSichern(); }
}
/* Datei für eine Adresse: zuerst die nachgeladene Fassung, sonst der Programmordner */
function geladen(datei) {
  if (!OVER) return datei;
  const r = path.relative(SPIEL, datei).split(path.sep).join('/');
  const o = OVER.dateien[r], b = BUND && BUND.dateien[r];
  if (o && (!b || b[0] !== o[0])) { const z = relPfad(AKT(), r); if (fs.existsSync(z)) return z; }
  return datei;
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const KOPF = { 'User-Agent': 'Heldensturm-PC' };
async function holenText(url, max) {
  const r = await net.fetch(url, { headers: KOPF }); if (!r.ok) throw new Error('HTTP ' + r.status);
  const b = Buffer.from(await r.arrayBuffer()); if (b.length > max) throw new Error('zu groß'); return b;
}
/* lädt in eine Datei und rechnet dabei die Prüfsumme mit (auch große Dateien ohne viel Speicher) */
async function holenNach(url, ziel, max) {
  const r = await net.fetch(url, { headers: KOPF }); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  const h = crypto.createHash('sha256'), aus = fs.createWriteStream(ziel); let n = 0, fehler = null;
  aus.on('error', e => { fehler = e; });
  try {
    const leser = r.body.getReader();
    for (; ;) {
      const { done, value } = await leser.read(); if (done) break;
      if (fehler) throw fehler;
      n += value.length; if (n > max) { try { leser.cancel(); } catch (e) { } throw new Error('Datei größer als angekündigt'); }
      h.update(value); if (!aus.write(Buffer.from(value))) await new Promise(res => aus.once('drain', res));
    }
  } finally { await new Promise(res => aus.end(res)); }
  if (fehler) throw fehler;
  return { hash: h.digest('hex'), n };
}
const eigene = () => { const m = /^1\.(\d+)\./.exec(app.getVersion()); return m ? +m[1] : 0; };
const DATEI = process.platform === 'win32' ? 'Heldensturm-Setup.exe' : 'Heldensturm.AppImage';
/* neueste Fassung in den Releases; nur Dateien aus dem eigenen GitHub-Projekt */
async function neuestesRelease() {
  const r = await net.fetch(RELEASES, { headers: Object.assign({ Accept: 'application/vnd.github+json' }, KOPF) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  let neu = null;
  for (const rel of await r.json()) {
    const m = TAG.exec(rel.tag_name || ''); if (!m || rel.draft) continue;
    if (neu && +m[1] <= neu.n) continue;
    const a = {}; for (const x of rel.assets || []) if (typeof x.browser_download_url === 'string' && x.browser_download_url.startsWith(QUELLE + '/download/')) a[x.name] = { url: x.browser_download_url, groesse: x.size | 0 };
    neu = { n: +m[1], seite: rel.html_url, a, text: String(rel.body || '').split('\n')[0].slice(0, 300) };
  }
  return neu;
}
function summen(txt) { const s = {}; for (const z of String(txt).split('\n')) { const m = /^([0-9a-f]{64})\s+\*?(\S+)\s*$/.exec(z.trim()); if (m) s[m[2]] = m[1]; } return s; }
/* kurze Meldung im Spiel */
function melden(text) {
  if (!win) return;
  win.webContents.executeJavaScript(`(function(t){try{if(typeof toast==='function'){toast(t,'#ffd27a');return}}catch(e){}var d=document.createElement('div');d.textContent=t;d.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#241a12;color:#ffd27a;border:1px solid #8a6a3a;padding:8px 16px;border-radius:8px;font:15px sans-serif;z-index:99999;pointer-events:none';document.body.appendChild(d);setTimeout(function(){d.remove()},4500)})(${JSON.stringify(text)})`).catch(() => { });
}
/* 1. geänderte Spieldateien nachladen */
async function spielLaden(m) {
  if (!/^[0-9a-f]{40}$/.test(m.commit || '')) throw new Error('Manifest ohne Stand');
  const ziel = NEU(); weg(ziel); fs.mkdirSync(ziel, { recursive: true });
  const offen = [];
  for (const [r, e] of Object.entries(m.dateien)) {
    if (!relOk(r) || !Array.isArray(e) || !HEX.test(e[0]) || !(e[1] >= 0)) throw new Error('Manifest fehlerhaft: ' + r);
    if (BUND && BUND.dateien[r] && BUND.dateien[r][0] === e[0]) continue;   // unverändert gegenüber dem Programmordner
    const z = relPfad(ziel, r);
    const vorh = OVER && OVER.dateien[r] && OVER.dateien[r][0] === e[0] ? relPfad(AKT(), r) : null;
    if (vorh) { try { const b = fs.readFileSync(vorh); if (sha(b) === e[0]) { fs.mkdirSync(path.dirname(z), { recursive: true }); fs.writeFileSync(z, b); continue; } } catch (x) { } }
    offen.push([r, e, z]);
  }
  let i = 0, bytes = 0;
  const arbeiter = async () => {
    while (i < offen.length) {
      const [r, e, z] = offen[i++];
      const url = RAW + m.commit + '/' + r.split('/').map(encodeURIComponent).join('/');
      let ok = false, letzter = null;
      for (let v = 0; v < 3 && !ok; v++) {
        try { const g = await holenNach(url, z, e[1]); if (g.n !== e[1] || g.hash !== e[0]) throw new Error('Prüfsumme passt nicht: ' + r); ok = true; bytes += g.n; }
        catch (x) { letzter = x; }
      }
      if (!ok) throw letzter;
    }
  };
  try { await Promise.all([arbeiter(), arbeiter(), arbeiter(), arbeiter()]); }
  catch (x) { weg(ziel); throw x; }
  fs.writeFileSync(path.join(ziel, MANI), JSON.stringify(m));   // zuletzt: erst damit gilt das Update als vollständig
  return { dateien: offen.length, bytes };
}
/* 2. Programm-Update am selben Ort */
async function programmLaden(rel, s) {
  const a = rel.a[DATEI], soll = s[DATEI];
  if (!a || !soll) throw new Error('Programmdatei fehlt im Release');
  if (process.platform === 'win32') {
    const z = path.join(PROG(), DATEI);
    if (!(CFG.programm && CFG.programm.n === rel.n && fs.existsSync(z))) {
      weg(PROG());
      const g = await holenNach(a.url, z, Math.max(a.groesse, 1) + 1024);
      if (g.hash !== soll) { weg(PROG()); throw new Error('Prüfsumme der Setup-Datei passt nicht'); }
      CFG.programm = { n: rel.n, hash: soll }; cfgSichern();
    }
    return 'beim-beenden';
  }
  const ai = process.env.APPIMAGE;
  if (process.platform !== 'linux' || !ai || !path.isAbsolute(ai) || !fs.existsSync(ai)) return null;   // kein AppImage (z. B. beim Entwickeln)
  const tmp = ai + '.neu';
  try {
    const g = await holenNach(a.url, tmp, Math.max(a.groesse, 1) + 1024);
    if (g.hash !== soll) throw new Error('Prüfsumme der AppImage-Datei passt nicht');
    fs.chmodSync(tmp, 0o755);
    fs.renameSync(tmp, ai);   // gleicher Name, gleicher Ort: Verknüpfungen und Starter bleiben gültig
  } catch (x) { try { fs.unlinkSync(tmp); } catch (e) { } throw x; }
  return 'fertig';
}
/* Windows: geladene Setup-Datei still einspielen, sobald das Programm beendet ist */
function programmBeimBeenden() {
  if (process.platform !== 'win32' || !CFG.programm || CFG.programm.n <= eigene()) return;
  const z = path.join(PROG(), DATEI);
  try {
    if (sha(fs.readFileSync(z)) !== CFG.programm.hash) { weg(PROG()); delete CFG.programm; cfgSichern(); return; }
    spawn(z, ['/S', '--updated'], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  } catch (e) { }
}
let sucht = false;
async function updateSuchen(laut) {
  if (sucht) { if (laut && win) dialog.showMessageBox(win, { type: 'info', message: 'Die Update-Suche läuft schon.' }); return { ok: true, laeuft: true }; }
  sucht = true;
  const ich = eigene();
  try {
    const rel = await neuestesRelease();
    if (!rel || !rel.a[MANI] || !rel.a['SHA256SUMS.txt'] || !BUND) {
      /* ältere Fassung ohne Manifest: wie früher den Download im Browser anbieten */
      if (rel && rel.n > ich && ich && win && (laut || CFG.spaeter !== rel.n)) {
        const a = await dialog.showMessageBox(win, { type: 'info', buttons: ['Herunterladen', 'Später'], defaultId: 0, cancelId: 1, message: `Neue Fassung von Heldensturm: 1.${rel.n}`, detail: (rel.text ? rel.text + '\n\n' : '') + `Du hast 1.${ich}. Der Download öffnet sich im Browser. Spielstände bleiben erhalten.` });
        if (a.response === 0) shell.openExternal(rel.a[DATEI] ? rel.a[DATEI].url : (String(rel.seite || '').startsWith(QUELLE) ? rel.seite : QUELLE)); else { CFG.spaeter = rel.n; cfgSichern(); }
        return { ok: true, neu: true, version: rel.n };
      }
      if (laut && win) dialog.showMessageBox(win, { type: 'info', message: 'Heldensturm ist aktuell.', detail: 'Programm-Version 1.' + ich });
      return { ok: true, neu: false, version: ich };
    }
    const s = summen(await holenText(rel.a['SHA256SUMS.txt'].url, 64 * 1024));
    const mb = await holenText(rel.a[MANI].url, 8 * 1024 * 1024);
    if (!s[MANI] || sha(mb) !== s[MANI]) throw new Error('Prüfsumme des Manifests passt nicht');
    const m = JSON.parse(mb.toString('utf8'));
    if (!m || m.v !== 1 || typeof m.inhalt !== 'number' || !m.dateien) throw new Error('Manifest unlesbar');
    const warte = maniLesen(NEU());
    const stand = Math.max(BUND.inhalt, OVER ? OVER.inhalt : 0, warte ? warte.inhalt : 0);
    const meld = [];
    if (m.inhalt > stand) { await spielLaden(m); meld.push('spiel'); }
    if (m.huelle && m.huelle !== BUND.huelle && rel.n > ich) {
      try { const p = await programmLaden(rel, s); if (p) meld.push(p); }
      catch (x) { if (laut) throw x; }
    }
    if (meld.length) {
      melden(meld.includes('beim-beenden') ? 'Update geladen – wird beim Beenden eingespielt' : 'Update geladen – beim nächsten Start ist es da');
      if (laut && win) dialog.showMessageBox(win, { type: 'info', message: 'Update geladen.', detail: meld.includes('beim-beenden') ? 'Das Programm-Update wird beim Beenden still eingespielt. Spielstände bleiben erhalten.' : 'Beim nächsten Start ist die neue Fassung da. Spielstände bleiben erhalten.' });
      return { ok: true, neu: true, version: m.inhalt };
    }
    if (laut && win) dialog.showMessageBox(win, { type: 'info', message: warte || (CFG.programm && CFG.programm.n > ich) ? 'Update schon geladen.' : 'Heldensturm ist aktuell.', detail: warte || (CFG.programm && CFG.programm.n > ich) ? 'Es wird beim nächsten Start (bzw. beim Beenden) eingespielt.' : 'Fassung 1.' + Math.max(stand, ich) });
    return { ok: true, neu: false, version: Math.max(stand, ich) };
  } catch (e) {
    if (laut && win) dialog.showMessageBox(win, { type: 'warning', message: 'Das Update hat nicht geklappt.', detail: 'Bitte die Internetverbindung prüfen und später noch einmal versuchen.\n(' + (e && e.message || e) + ')' });
    return { ok: false };
  } finally { sucht = false; }
}

/* ---------- Brücke zum Spiel (preload.js → window.__hsPC) ---------- */
const vomSpiel = e => { try { return !!(win && e.sender === win.webContents && e.senderFrame && e.senderFrame === win.webContents.mainFrame && imSpiel(e.senderFrame.url)); } catch (x) { return false; } };
const nur = f => (e, ...a) => (vomSpiel(e) ? f(e, ...a) : undefined);
ipcMain.handle('hs:vollbild', nur((e, an) => vollbild(an === undefined ? undefined : !!an)));
ipcMain.handle('hs:istVollbild', nur(() => !!(win && win.isFullScreen())));
ipcMain.handle('hs:beenden', nur(() => { app.quit(); }));
ipcMain.handle('hs:updates', nur(() => updateSuchen(true)));
ipcMain.handle('hs:gpu', nur(async () => { try { const i = await app.getGPUInfo('basic'); const s = app.getGPUFeatureStatus(); return { karten: (i.gpuDevice || []).map(d => ({ aktiv: !!d.active, hersteller: d.vendorId, geraet: d.deviceId })), stand: s }; } catch (e) { return null; } }));
ipcMain.on('hs:info', e => { if (!vomSpiel(e)) { e.returnValue = {}; return; } e.returnValue = { version: app.getVersion(), inhalt: (OVER || BUND || {}).inhalt || 0, plattform: process.platform, chrom: process.versions.chrome, electron: process.versions.electron }; });

/* ---------- Start ---------- */
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    cfgLaden();
    spielStand();
    Menu.setApplicationMenu(null);
    protocol.handle(SCHEMA, liefern);
    /* Mikrofon, Standort usw. braucht das Spiel nicht; Vollbild und Zeigersperre schon */
    const RECHTE = ['fullscreen', 'pointerLock', 'clipboard-sanitized-write', 'keyboardLock'];
    const ses = session.defaultSession;
    ses.setPermissionRequestHandler((wc, recht, cb) => cb(RECHTE.includes(recht)));
    ses.setPermissionCheckHandler((wc, recht) => RECHTE.includes(recht));
    if (ses.setDevicePermissionHandler) ses.setDevicePermissionHandler(() => false);
    /* Netz: nur verschlüsselt (https/wss) und die eigenen Spieldateien – kein http, kein Zugriff auf Dateien des Rechners */
    ses.webRequest.onBeforeRequest((d, cb) => { let pr = ''; try { pr = new URL(d.url).protocol; } catch (e) { } cb({ cancel: !['heldensturm:', 'https:', 'wss:', 'data:', 'blob:', 'devtools:'].includes(pr) }); });
    ses.on('will-download', e => e.preventDefault());   // das Programm lädt nichts auf den Rechner – Downloads laufen über den Browser
    if (!fs.existsSync(path.join(SPIEL, 'heldensturm.html'))) { dialog.showErrorBox('Heldensturm', 'Die Spieldateien fehlen (' + SPIEL + ').\nBitte das Programm neu installieren.'); app.quit(); return; }
    fenster();
    if (app.isPackaged && !ARG('ohne-update')) { setTimeout(() => updateSuchen(false), 8000); setInterval(() => updateSuchen(false), 3 * 3600 * 1000); }
  });
  /* keine weiteren Fenster, Rahmen oder eingebetteten Seiten – alles außerhalb des Spiels geht an den Browser */
  app.on('web-contents-created', (ev, wc) => {
    wc.on('will-attach-webview', e => e.preventDefault());
    wc.setWindowOpenHandler(({ url }) => { nachAussen(url); return { action: 'deny' }; });
    wc.on('will-frame-navigate', e => { if (!e.isMainFrame && !imSpiel(e.url)) e.preventDefault(); });
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', programmBeimBeenden);
}
