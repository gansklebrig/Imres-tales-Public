/* Tests für die Spiel-Updates (inhalt.js). Aufruf: node --test test/   (im Ordner desktop-zerstoerer) */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const I = require('../inhalt');

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
function manifest(stand, dateien) {
  const d = {}; for (const [p, inhalt] of Object.entries(dateien)) d[p] = { sha256: sha(Buffer.from(inhalt)), groesse: Buffer.byteLength(inhalt) };
  return { stand, dateien: d };
}
function ordner(dateien, m) {
  const o = fs.mkdtempSync(path.join(os.tmpdir(), 'zs-'));
  for (const [p, inhalt] of Object.entries(dateien)) { fs.mkdirSync(path.dirname(path.join(o, p)), { recursive: true }); fs.writeFileSync(path.join(o, p), inhalt); }
  if (m) { fs.mkdirSync(path.join(o, 'zerstoerer'), { recursive: true }); fs.writeFileSync(path.join(o, I.MANIFEST_REL), JSON.stringify(m)); }
  return o;
}
/* Netz-Attrappe: Inhalte je Pfad; zählt Abrufe */
function netz(dateien, liste, extra) {
  const n = { abrufe: [], dateien, liste, kaputt: new Set(), lang: new Set(), aus: false };
  n.holen = async (url, o) => {
    n.abrufe.push(url);
    if (n.aus) throw new Error('offline');
    const u = new URL(url);
    if (extra && extra.umleiten) return { ok: true, status: 200, url: 'https://boese.example/x', headers: new Map(), arrayBuffer: async () => new ArrayBuffer(0) };
    const p = decodeURIComponent(u.pathname.slice(1));
    let body = p === I.MANIFEST_REL ? JSON.stringify(n.liste) : n.dateien[p];
    if (body === undefined) return { ok: false, status: 404, url, headers: new Map() };
    if (n.kaputt.has(p)) body = body.slice(0, -1) + 'X';   // gleiche Größe, anderer Inhalt
    if (n.lang.has(p)) body = body + 'XXXX';
    const buf = Buffer.from(body);
    return { ok: true, status: 200, url, headers: new Map([['content-length', String(buf.length)]]), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) };
  };
  return n;
}
const ALT = { 'zerstoerer.html': '<html>v1', 'zerstoerer/kern.js': 'kern1', 'amb/a.mp3': 'ton', 'schriften/s.css': 'css' };
function aufbau(neuDateien, extra) {
  const mAlt = manifest(1, ALT);
  const ein = ordner(ALT, mAlt);
  const daten = fs.mkdtempSync(path.join(os.tmpdir(), 'zsd-'));
  const n = netz(neuDateien, manifest(2, neuDateien), extra);
  let t = 1000;
  const v = I.erstellen({ eingebaut: ein, daten, holen: n.holen, basis: 'https://imrestales.de/', zeit: () => ++t });
  v.start();
  return { ein, daten, n, v };
}

test('Pfadsicherheit', () => {
  for (const p of ['zerstoerer.html', 'zerstoerer/kern.js', 'amb/a_feuer1.mp3', 'klang/LIZENZ.txt', 'schriften/x.woff2']) assert.ok(I.relGueltig(p), p);
  for (const p of ['../x.js', 'zerstoerer/../../x.js', '/etc/passwd', 'zerstoerer/.versteckt.js', 'zerstoerer\\..\\x.js', 'C:/x.js', 'index.html', 'zerstoerer/a.exe',
    'zerstoerer//a.js', 'zerstoerer/./a.js', 'zerstoerer/con.js', 'zerstoerer/a b.js', 'zerstoerer/dateien.json', '', 'amb/a.mp3.']) assert.ok(!I.relGueltig(p), p);
  const b = path.join(os.tmpdir(), 'basis');
  assert.strictEqual(I.innerhalb(b, '../x'), null);
  assert.strictEqual(I.innerhalb(b, '/../../etc/passwd'), null);
  assert.strictEqual(I.innerhalb(b, 'a/../../x'), null);
  assert.strictEqual(I.innerhalb(b, ''), null);
  assert.strictEqual(I.innerhalb(b, 'a\0b'), null);
  assert.strictEqual(I.innerhalb(b, '/zerstoerer.html'), path.join(b, 'zerstoerer.html'));
});

test('Liste prüfen: unzulässige Listen werden abgelehnt', () => {
  const gut = manifest(5, { 'zerstoerer.html': 'x' });
  assert.ok(I.manifestPruefen(gut));
  assert.throws(() => I.manifestPruefen(manifest(5, { 'zerstoerer.html': 'x', '../boese.js': 'y' })));
  assert.throws(() => I.manifestPruefen(manifest(5, { 'zerstoerer/a.js': 'x' })), /zerstoerer.html/);
  assert.throws(() => I.manifestPruefen(manifest(5, { 'zerstoerer.html': 'x', 'zerstoerer/A.js': '1', 'zerstoerer/a.js': '2' })), /doppelt/);
  const zuGross = manifest(5, { 'zerstoerer.html': 'x' }); zuGross.dateien['zerstoerer.html'].groesse = I.GRENZE_DATEI + 1;
  assert.throws(() => I.manifestPruefen(zuGross));
  const ohneSha = manifest(5, { 'zerstoerer.html': 'x' }); ohneSha.dateien['zerstoerer.html'].sha256 = 'abc';
  assert.throws(() => I.manifestPruefen(ohneSha));
  assert.throws(() => I.manifestPruefen({ stand: '5', dateien: {} }));
  assert.throws(() => I.manifestPruefen(null));
});

test('gleicher Stand: nichts wird geladen', async () => {
  const { v, n } = aufbau(ALT);
  n.liste = manifest(1, ALT);
  const r = await v.pruefen();
  assert.strictEqual(r.neu, false);
  assert.strictEqual(n.abrufe.length, 1);   // nur die Liste
});

test('nur geänderte und neue Dateien werden geladen, Umschalten erst beim Neustart', async () => {
  const NEU = Object.assign({}, ALT, { 'zerstoerer.html': '<html>v2', 'zerstoerer/neu.js': 'neu' });
  const { v, n, ein, daten } = aufbau(NEU);
  const r = await v.pruefen();
  assert.strictEqual(r.neu, true); assert.strictEqual(r.geladen, 2);
  assert.deepStrictEqual(n.abrufe.slice(1).map(u => new URL(u).pathname).sort(), ['/zerstoerer.html', '/zerstoerer/neu.js']);
  for (const u of n.abrufe) { assert.ok(u.startsWith('https://imrestales.de/')); assert.ok(/[?&](t|h)=/.test(u), 'Cache umgehen: ' + u); }
  // laufende Sitzung liefert weiter den alten Stand
  assert.strictEqual(fs.readFileSync(v.datei('/zerstoerer.html'), 'utf8'), '<html>v1');
  // neuer Start: neuer Stand, unveränderte Dateien kommen weiter aus dem Programm
  let t = 5000;
  const v2 = I.erstellen({ eingebaut: ein, daten, holen: n.holen, zeit: () => ++t });
  assert.strictEqual(v2.start().stand, 2);
  assert.strictEqual(fs.readFileSync(v2.datei('/zerstoerer.html'), 'utf8'), '<html>v2');
  assert.strictEqual(fs.readFileSync(v2.datei('zerstoerer/neu.js'), 'utf8'), 'neu');
  assert.strictEqual(v2.datei('zerstoerer/kern.js'), path.join(ein, 'zerstoerer', 'kern.js'));
  assert.strictEqual(v2.datei('../../etc/passwd'), null);
  // nochmal prüfen: nichts Neues
  n.abrufe.length = 0;
  assert.strictEqual((await v2.pruefen()).neu, false);
  assert.strictEqual(n.abrufe.length, 1);
});

test('„Jetzt neu laden“ schaltet sofort um', async () => {
  const NEU = Object.assign({}, ALT, { 'zerstoerer/kern.js': 'kern2' });
  const { v } = aufbau(NEU);
  await v.pruefen();
  assert.strictEqual(v.status().wartet, true);
  assert.ok(v.umschalten());
  assert.strictEqual(fs.readFileSync(v.datei('zerstoerer/kern.js'), 'utf8'), 'kern2');
  assert.strictEqual(v.status().stand, 2);
});

test('falsche Prüfsumme: alter Stand bleibt, keine Reste', async () => {
  const NEU = Object.assign({}, ALT, { 'zerstoerer.html': '<html>v2', 'zerstoerer/kern.js': 'kern2' });
  const { v, n, daten, ein } = aufbau(NEU);
  n.kaputt.add('zerstoerer/kern.js');
  await assert.rejects(v.pruefen(), /Prüfsumme/);
  n.kaputt.clear(); n.lang.add('zerstoerer/kern.js');
  await assert.rejects(v.pruefen(), /zu groß/);
  assert.deepStrictEqual(fs.readdirSync(daten), []);
  const v2 = I.erstellen({ eingebaut: ein, daten, holen: n.holen });
  assert.strictEqual(v2.start().ausUpdate, false);
  assert.strictEqual(fs.readFileSync(v2.datei('zerstoerer.html'), 'utf8'), '<html>v1');
});

test('Datei fehlt auf dem Server / offline: alter Stand bleibt', async () => {
  const NEU = Object.assign({}, ALT, { 'zerstoerer/neu.js': 'neu' });
  const { v, n, daten } = aufbau(NEU);
  delete n.dateien['zerstoerer/neu.js'];
  await assert.rejects(v.pruefen(), /HTTP 404/);
  n.aus = true;
  await assert.rejects(v.pruefen(), /offline/);
  assert.deepStrictEqual(fs.readdirSync(daten), []);
  assert.strictEqual(v.status().stand, 1);
});

test('Umleitung auf fremden Host wird abgelehnt', async () => {
  const { v } = aufbau(Object.assign({}, ALT, { 'zerstoerer.html': 'v2' }), { umleiten: true });
  await assert.rejects(v.pruefen(), /fremde/);
});

test('bösartige Liste vom Server: nichts wird geschrieben', async () => {
  const { v, n, daten } = aufbau(ALT);
  n.liste = manifest(9, { 'zerstoerer.html': 'x', '../../ausbruch.js': 'boese' });
  await assert.rejects(v.pruefen(), /unzulässig/);
  n.liste = manifest(9, { 'zerstoerer.html': 'x', 'index.html': 'boese' });
  await assert.rejects(v.pruefen(), /unzulässig/);
  assert.deepStrictEqual(fs.readdirSync(daten), []);
});

test('Folge-Update: schon geladene Dateien werden kopiert statt neu geladen, alter Ordner wird beim Start aufgeräumt', async () => {
  const V2 = Object.assign({}, ALT, { 'zerstoerer.html': '<html>v2', 'zerstoerer/neu.js': 'neu' });
  const { n, ein, daten } = aufbau(V2);
  let t = 2000;
  const a = I.erstellen({ eingebaut: ein, daten, holen: n.holen, zeit: () => ++t });
  a.start(); await a.pruefen();
  const b = I.erstellen({ eingebaut: ein, daten, holen: n.holen, zeit: () => ++t });
  b.start();
  const V3 = Object.assign({}, V2, { 'zerstoerer/kern.js': 'kern3' });
  n.dateien = V3; n.liste = manifest(3, V3); n.abrufe.length = 0;
  const r = await b.pruefen();
  assert.strictEqual(r.geladen, 1);   // nur kern.js – zerstoerer.html und neu.js kommen aus dem alten Update-Ordner
  const c = I.erstellen({ eingebaut: ein, daten, holen: n.holen, zeit: () => ++t });
  assert.strictEqual(c.start().stand, 3);
  assert.strictEqual(fs.readdirSync(daten).filter(x => x.startsWith('stand-')).length, 1);
  assert.strictEqual(fs.readFileSync(c.datei('zerstoerer/neu.js'), 'utf8'), 'neu');
  assert.strictEqual(fs.readFileSync(c.datei('zerstoerer/kern.js'), 'utf8'), 'kern3');
});

test('neue Programm-Fassung (andere mitgelieferte Liste) verwirft alte Updates', async () => {
  const V2 = Object.assign({}, ALT, { 'zerstoerer.html': '<html>v2' });
  const { n, ein, daten, v } = aufbau(V2);
  await v.pruefen();
  // Programm-Update: neues mitgeliefertes Spiel
  fs.writeFileSync(path.join(ein, 'zerstoerer.html'), '<html>v4');
  fs.writeFileSync(path.join(ein, I.MANIFEST_REL), JSON.stringify(manifest(4, Object.assign({}, ALT, { 'zerstoerer.html': '<html>v4' }))));
  const w = I.erstellen({ eingebaut: ein, daten, holen: n.holen });
  const s = w.start();
  assert.strictEqual(s.ausUpdate, false); assert.strictEqual(s.stand, 4);
  assert.deepStrictEqual(fs.readdirSync(daten), []);
  assert.strictEqual(fs.readFileSync(w.datei('zerstoerer.html'), 'utf8'), '<html>v4');
});

test('halb geschriebener Stand (Absturz beim Laden) wird ignoriert und aufgeräumt', () => {
  const { ein, daten, n } = aufbau(ALT);
  fs.mkdirSync(path.join(daten, 'stand-2-1.teil', 'spiel'), { recursive: true });
  fs.writeFileSync(path.join(daten, 'aktuell.json'), '{kaputt');
  const v = I.erstellen({ eingebaut: ein, daten, holen: n.holen });
  assert.strictEqual(v.start().ausUpdate, false);
  assert.deepStrictEqual(fs.readdirSync(daten), []);
});

test('zwei gleichzeitige Prüfungen laden nur einmal', async () => {
  const NEU = Object.assign({}, ALT, { 'zerstoerer.html': '<html>v2' });
  const { v, n } = aufbau(NEU);
  const [a, b] = await Promise.all([v.pruefen(), v.pruefen()]);
  assert.strictEqual(a, b);
  assert.strictEqual(n.abrufe.length, 2);
});

test('Manifest im Repo ist gültig und passt zu manifest.py', () => {
  const p = path.join(__dirname, '..', '..', I.MANIFEST_REL);
  if (!fs.existsSync(p)) return;
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  I.manifestPruefen(m);
  assert.ok(m.stand > 0);
});
