/* Spiel-Updates ohne Neuinstallation – reine Logik (ohne Electron, deshalb mit Node testbar: test/inhalt.test.js).

   Ablauf:
   - Das Programm bringt die Spieldateien mit (resources/spiel) samt Liste zerstoerer/dateien.json {stand, dateien: {pfad: {sha256, groesse}}}.
   - Im Programmspeicher (userData/inhalt) liegen höchstens ein aktiver Update-Ordner „stand-<n>-<zeit>“ (nur die Dateien, die sich
     vom mitgelieferten Spiel unterscheiden, unter spiel/ – dazu manifest.json, die vollständige Liste dieses Standes) und aktuell.json,
     das auf ihn zeigt. Ausgeliefert wird: zuerst der aktive Update-Ordner, sonst das mitgelieferte Spiel.
   - pruefen(): lädt die Liste von imrestales.de, vergleicht sie mit dem genutzten Stand, lädt NUR geänderte/neue Dateien, prüft jede
     SHA-256 und Größe, schreibt alles in einen neuen Ordner (*.teil) und schaltet erst nach vollständigem Erfolg um
     (Ordner umbenennen, dann aktuell.json atomar ersetzen). Bei jedem Fehler bleibt der alte Stand unverändert.
   - Wird das Programm selbst erneuert (andere mitgelieferte Liste), gilt der alte Update-Ordner nicht mehr und wird verworfen. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST_REL = 'zerstoerer/dateien.json';
const GRENZE_DATEI = 32 * 1024 * 1024;      // keine Spieldatei ist größer als 2 MB – 32 MB ist reichlich Luft
const GRENZE_GESAMT = 600 * 1024 * 1024;    // höchstens so viel auf einmal laden
const GRENZE_LISTE = 8 * 1024 * 1024;
const GRENZE_ANZAHL = 20000;
/* Nur diese Orte und Dateiarten dürfen aus einer Liste kommen */
const ERLAUBT_ORT = [/^zerstoerer\.html$/, /^tonregler\.js$/, /^favicon\.svg$/, /^zerstoerer\/./, /^schriften\/./, /^klang\/./, /^amb\/./];
const ERLAUBT_ART = /\.(html|js|css|json|svg|mp3|ogg|wav|webp|png|jpg|woff2|txt)$/;
const SEGMENT = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/;     // kein „.“/„..“, nichts Verstecktes, keine Leer- oder Sonderzeichen
const WIN_RESERVIERT = /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i;

/* ---------- Pfade ---------- */
function relGueltig(rel) {
  if (typeof rel !== 'string' || rel.length === 0 || rel.length > 200) return false;
  const teile = rel.split('/');
  if (teile.some(t => !SEGMENT.test(t) || WIN_RESERVIERT.test(t) || t.endsWith('.'))) return false;
  if (!ERLAUBT_ORT.some(r => r.test(rel))) return false;
  if (!ERLAUBT_ART.test(rel)) return false;
  return rel !== MANIFEST_REL;
}
/* absoluter Pfad unterhalb von basis – oder null, wenn rel hinausführen würde */
function innerhalb(basis, rel) {
  if (typeof rel !== 'string' || rel.includes('\0')) return null;
  const b = path.resolve(basis);
  const z = path.resolve(b, '.' + path.sep + rel.replace(/^[/\\]+/, ''));
  if (z === b || !z.startsWith(b + path.sep)) return null;
  return z;
}

/* ---------- Liste prüfen ---------- */
function manifestPruefen(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) throw new Error('Liste: kein Objekt');
  if (!Number.isInteger(m.stand) || m.stand < 0) throw new Error('Liste: Stand fehlt');
  const d = m.dateien;
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Liste: keine Dateien');
  const pfade = Object.keys(d);
  if (!pfade.length || pfade.length > GRENZE_ANZAHL) throw new Error('Liste: Anzahl ungültig');
  const klein = new Set();
  for (const p of pfade) {
    if (!relGueltig(p)) throw new Error('Liste: unzulässiger Pfad ' + JSON.stringify(p).slice(0, 80));
    const k = p.toLowerCase(); if (klein.has(k)) throw new Error('Liste: doppelter Pfad ' + p); klein.add(k);   // Windows unterscheidet keine Groß-/Kleinschreibung
    const e = d[p];
    if (!e || typeof e.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(e.sha256)) throw new Error('Liste: Prüfsumme fehlt bei ' + p);
    if (!Number.isInteger(e.groesse) || e.groesse < 0 || e.groesse > GRENZE_DATEI) throw new Error('Liste: Größe ungültig bei ' + p);
  }
  if (!d['zerstoerer.html']) throw new Error('Liste: zerstoerer.html fehlt');
  return m;
}
/* gleiche Dateien mit gleichem Inhalt? */
function gleich(a, b) {
  if (!a || !b) return false;
  const ka = Object.keys(a.dateien), kb = Object.keys(b.dateien);
  if (ka.length !== kb.length) return false;
  return ka.every(p => b.dateien[p] && b.dateien[p].sha256 === a.dateien[p].sha256 && b.dateien[p].groesse === a.dateien[p].groesse);
}
const shaText = t => crypto.createHash('sha256').update(t).digest('hex');
async function shaDatei(p) {
  const h = crypto.createHash('sha256');
  await new Promise((res, rej) => fs.createReadStream(p).on('data', c => h.update(c)).on('end', res).on('error', rej));
  return h.digest('hex');
}
const lesenJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } };
function entfernen(p) { try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 3 }); } catch (e) { } }

/* ---------- Antwort lesen: höchstens n Bytes ---------- */
async function lesenBegrenzt(r, n) {
  const len = +(r.headers && r.headers.get && r.headers.get('content-length'));
  if (len && len > n) throw new Error('zu groß');
  if (r.body && r.body.getReader) {
    const rd = r.body.getReader(), teile = []; let summe = 0;
    for (; ;) {
      const { done, value } = await rd.read();
      if (done) break;
      summe += value.byteLength;
      if (summe > n) { try { rd.cancel(); } catch (e) { } throw new Error('zu groß'); }
      teile.push(Buffer.from(value.buffer, value.byteOffset, value.byteLength));
    }
    return Buffer.concat(teile, summe);
  }
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length > n) throw new Error('zu groß');
  return b;
}

/* ---------- Verwalter ----------
   opt: { eingebaut: Ordner der mitgelieferten Spieldateien, daten: Ordner im Programmspeicher,
          holen(url, {signal}) → Promise<Response> (fetch-artig), basis: 'https://imrestales.de/', zeit?: () => Zahl } */
function erstellen(opt) {
  const BASIS = opt.basis || 'https://imrestales.de/';
  const HOST = new URL(BASIS).host;
  const jetzt = opt.zeit || Date.now;
  const D = opt.daten;
  const AKT = path.join(D, 'aktuell.json');
  const eingebautText = (() => { try { return fs.readFileSync(path.join(opt.eingebaut, MANIFEST_REL), 'utf8'); } catch (e) { return null; } })();
  let eingebaut = null; try { eingebaut = eingebautText && manifestPruefen(JSON.parse(eingebautText)); } catch (e) { eingebaut = null; }
  const basisHash = eingebautText ? shaText(eingebautText) : '';
  const st = { aktiv: null, aktivManifest: null, wartend: null, wartendManifest: null, laeuft: null };

  /* gültigen Update-Ordner aus aktuell.json lesen (oder null) */
  function ausAktuell() {
    const a = lesenJson(AKT);
    if (!a || typeof a.ordner !== 'string' || !/^stand-\d+-\d+$/.test(a.ordner) || a.basis !== basisHash) return null;
    const o = path.join(D, a.ordner);
    const m = lesenJson(path.join(o, 'manifest.json'));
    try { manifestPruefen(m); } catch (e) { return null; }
    return { ordner: o, name: a.ordner, manifest: m };
  }
  /* beim Programmstart: Stand wählen, Reste aufräumen */
  function start() {
    try { fs.mkdirSync(D, { recursive: true }); } catch (e) { }
    const a = ausAktuell();
    if (!a) { try { fs.rmSync(AKT, { force: true }); } catch (e) { } }
    st.aktiv = a ? a.ordner : null; st.aktivManifest = a ? a.manifest : null; st.wartend = null; st.wartendManifest = null;
    let namen = []; try { namen = fs.readdirSync(D); } catch (e) { }
    for (const n of namen) if (n !== 'aktuell.json' && (!a || n !== a.name)) entfernen(path.join(D, n));
    return status();
  }
  function status() {
    const m = st.aktivManifest || eingebaut;
    return { stand: m ? m.stand : 0, ausUpdate: !!st.aktiv, wartet: !!st.wartend, wartendStand: st.wartendManifest ? st.wartendManifest.stand : null, eingebautStand: eingebaut ? eingebaut.stand : 0 };
  }
  /* Datei für die Auslieferung: zuerst aktiver Update-Ordner, sonst mitgeliefert */
  function datei(rel) {
    if (st.aktiv) {
      const u = innerhalb(path.join(st.aktiv, 'spiel'), rel);
      if (u && fs.existsSync(u)) return u;
    }
    return innerhalb(opt.eingebaut, rel);
  }
  /* wartenden Stand sofort benutzen (Knopf „Jetzt neu laden“) */
  function umschalten() {
    if (!st.wartend) return false;
    st.aktiv = st.wartend; st.aktivManifest = st.wartendManifest; st.wartend = null; st.wartendManifest = null;
    return true;
  }

  function urlFuer(rel, extra) {
    const u = new URL(rel.split('/').map(encodeURIComponent).join('/'), BASIS);
    if (extra) u.search = extra;
    if (u.protocol !== 'https:' || u.host !== HOST) throw new Error('fremde Adresse');
    return u.href;
  }
  async function abruf(url, ms) {
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ac ? setTimeout(() => ac.abort(), ms) : null;
    try {
      const r = await opt.holen(url, { signal: ac && ac.signal, cache: 'no-store', redirect: 'follow', headers: { 'Cache-Control': 'no-cache' } });
      if (r.url) { const z = new URL(r.url); if (z.protocol !== 'https:' || z.host !== HOST) throw new Error('Umleitung zu fremder Adresse'); }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r;
    } finally { if (t) clearTimeout(t); }
  }

  async function pruefenIntern() {
    if (!eingebaut) throw new Error('mitgelieferte Liste fehlt');
    const r = await abruf(urlFuer(MANIFEST_REL, 't=' + jetzt()), 20000);
    const neu = manifestPruefen(JSON.parse((await lesenBegrenzt(r, GRENZE_LISTE)).toString('utf8')));
    const genutzt = st.aktivManifest || eingebaut;
    if (gleich(neu, genutzt)) return { neu: false, stand: neu.stand };
    if (st.wartendManifest && gleich(neu, st.wartendManifest)) return { neu: true, wartet: true, stand: neu.stand, geladen: 0 };

    /* Plan: was mitgeliefert gleich ist, bleibt weg; was schon in einem Update-Ordner liegt, wird kopiert; der Rest geladen */
    const quellen = [[st.wartend, st.wartendManifest], [st.aktiv, st.aktivManifest]].filter(q => q[0] && q[1]);
    const aufgaben = []; let summe = 0;
    for (const p of Object.keys(neu.dateien).sort()) {
      const e = neu.dateien[p];
      const ein = eingebaut.dateien[p];
      if (ein && ein.sha256 === e.sha256 && ein.groesse === e.groesse) continue;
      let von = null;
      for (const [o, m] of quellen) { const x = m.dateien[p]; const f = innerhalb(path.join(o, 'spiel'), p); if (x && x.sha256 === e.sha256 && f && fs.existsSync(f)) { von = f; break; } }
      if (!von) summe += e.groesse;
      aufgaben.push({ p, e, von });
    }
    if (summe > GRENZE_GESAMT) throw new Error('Update zu groß');

    const name = 'stand-' + neu.stand + '-' + jetzt();
    const teil = path.join(D, name + '.teil');
    entfernen(teil);
    fs.mkdirSync(path.join(teil, 'spiel'), { recursive: true });
    let geladen = 0, bytes = 0;
    try {
      let i = 0;
      const arbeiter = async () => {
        for (; ;) {
          const a = aufgaben[i++]; if (!a) return;
          const ziel = innerhalb(path.join(teil, 'spiel'), a.p);
          if (!ziel) throw new Error('unzulässiger Pfad');
          fs.mkdirSync(path.dirname(ziel), { recursive: true });
          let buf;
          if (a.von) buf = fs.readFileSync(a.von);
          else {
            const rr = await abruf(urlFuer(a.p, 'h=' + a.e.sha256.slice(0, 12)), 60000);
            buf = await lesenBegrenzt(rr, Math.min(a.e.groesse, GRENZE_DATEI));
            geladen++; bytes += buf.length;
          }
          if (buf.length !== a.e.groesse) throw new Error('Größe passt nicht: ' + a.p);
          if (shaText(buf) !== a.e.sha256) throw new Error('Prüfsumme passt nicht: ' + a.p);
          fs.writeFileSync(ziel, buf);
        }
      };
      await Promise.all([arbeiter(), arbeiter(), arbeiter(), arbeiter()]);
      fs.writeFileSync(path.join(teil, 'manifest.json'), JSON.stringify(neu));
      const fertig = path.join(D, name);
      fs.renameSync(teil, fertig);
      const tmp = AKT + '.neu';
      fs.writeFileSync(tmp, JSON.stringify({ ordner: name, basis: basisHash, stand: neu.stand, zeit: jetzt() }));
      fs.renameSync(tmp, AKT);   // atomar: entweder alter oder neuer Stand
      /* alter wartender Ordner wird nicht mehr gebraucht (der laufende aktive bleibt bis zum Neustart) */
      if (st.wartend && st.wartend !== st.aktiv) entfernen(st.wartend);
      st.wartend = fertig; st.wartendManifest = neu;
      return { neu: true, wartet: true, stand: neu.stand, geladen, bytes, dateien: aufgaben.length };
    } catch (e) {
      entfernen(teil);
      throw e;
    }
  }
  /* nie zwei Prüfungen gleichzeitig */
  function pruefen() {
    if (!st.laeuft) st.laeuft = pruefenIntern().finally(() => { st.laeuft = null; });
    return st.laeuft;
  }
  return { start, status, datei, pruefen, umschalten, _st: st };
}

module.exports = { erstellen, manifestPruefen, relGueltig, innerhalb, gleich, shaDatei, MANIFEST_REL, GRENZE_DATEI };
