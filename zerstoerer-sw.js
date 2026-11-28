/* Ezekiel – The Destroyer offline (W39 PWA): steuert zerstoerer.html und den Spielordner (Scope „./zerstoerer“,
   kein Überlapp mit heldensturm/waldbuch/klangwelten).
   - Seite: zuerst aus dem Netz (5 s), sonst gespeichert – so kommen Neuerungen sofort an.
   - Kern: beim Installieren und bei jeder neuen Spielversion (?v=…) werden alle Skripte und Stile der Seite plus die Schriften
     vorgeladen; Einträge alter Versionen werden danach entfernt.
   - Geräusche/Instrumente: erst beim ersten Abspielen gespeichert, höchstens MAXTON Einträge (älteste zuerst raus) –
     außer nach „Alles offline speichern“ (Einstellungen): dann alle laut zerstoerer/dateien.json, ohne Grenze.
     Schlüssel mit Kurz-Hash (…mp3?h=<sha256 8 Zeichen>): ändert sich eine Aufnahme laut dateien.json, wird die alte Fassung ersetzt.
   - Alles andere (Vermittler für Online-Koop, fremde Adressen) geht ungefiltert ins Netz. */
const SWV = 2; /* 2: W39 PWA – Klänge mit Kurz-Hash, „Alles offline speichern“, Offline-Daten löschen */
const KERN = 'zs-kern', TON = 'zs-ton', MARK = 'zs-meta';
const MAXTON = 1400;
const FEST = ['zerstoerer.webmanifest', 'zerstoerer-icon-192.png', 'zerstoerer-icon-512.png', 'zerstoerer-icon-maskable-512.png', 'favicon.svg'];
const basis = new URL('./', self.location).href;
const rel = u => { const x = new URL(u, basis); return x.origin === location.origin && x.href.startsWith(basis) ? x.href.slice(basis.length) : null; };
const ohneQ = p => p.split('?')[0];
const vOf = html => { let m, v = 0; const re = /\?v=(\d+)/g; while ((m = re.exec(html))) v = Math.max(v, +m[1]); return v; };
const istTon = q => /^(klang|amb)\/[^?]+\.(mp3|ogg|wav)$/.test(q);
const istKern = p => /^zerstoerer\/[^?]+\.(js|css|json)\?v=\d+$/.test(p) || /^tonregler\.js\?v=\d+$/.test(p) || /^schriften\//.test(p) || FEST.includes(p);

/* Kernliste aus der Seite: alle lokalen src/href (Skripte mit ?v, Stile, Symbol) und die Schriftdateien aus schriften.css */
async function kernListe(html) {
  const s = new Set(FEST);
  const re = /(?:src|href)\s*=\s*"([^"#]+)"/g; let m;
  while ((m = re.exec(html))) { const p = rel(m[1]); if (p && !/^https?:/.test(m[1]) && !p.endsWith('.html') && (/\.(js|css|svg)(\?|$)/.test(p))) s.add(p); }
  try {
    const css = await (await fetch('schriften/schriften.css', { cache: 'no-cache' })).text(); s.add('schriften/schriften.css');
    const ru = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g; while ((m = ru.exec(css))) { const p = rel(new URL(m[1], new URL('schriften/', basis)).href); if (p) s.add(p); }
  } catch (_) {}
  return [...s];
}
let kernLaeuft = null;
function kernLaden(html) {
  if (kernLaeuft) return kernLaeuft;
  kernLaeuft = (async () => {
    const c = await caches.open(KERN), liste = await kernListe(html), soll = new Set(liste.concat(['zerstoerer.html']));
    const fehlt = []; for (const p of liste) if (!(await c.match(p))) fehlt.push(p);
    const lauf = async () => { while (fehlt.length) { const p = fehlt.shift(); try { const x = await fetch(p, { cache: 'no-cache' }); if (x.ok && x.status === 200) await c.put(p, x); } catch (_) {} } };
    await Promise.all([lauf(), lauf(), lauf(), lauf()]);
    /* alte Spielversion aufräumen: was die aktuelle Seite nicht mehr nennt */
    for (const k of await c.keys()) { const p = rel(k.url); if (p && !soll.has(p)) await c.delete(k); }
    await (await caches.open(MARK)).put('v', new Response(String(vOf(html))));
    await karte(true); /* neue Spielversion: Klangliste frisch, geänderte Aufnahmen ersetzen */
  })().finally(() => { kernLaeuft = null; });
  return kernLaeuft;
}
async function seiteHolen(timeout) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  try { const x = await fetch('zerstoerer.html', { cache: 'no-cache', signal: ctl.signal }); clearTimeout(t); return x.ok ? x : null; } catch (_) { clearTimeout(t); return null; }
}
async function alteV() { const r = await (await caches.open(MARK)).match('v'); return r ? +(await r.text()) || 0 : 0; }

/* ---------- Klangliste (dateien.json): Pfad → { groesse, sha256 } ---------- */
let MAP = null;
async function karte(frisch) {
  const m = await caches.open(MARK);
  if (frisch || !MAP) {
    if (frisch) try { const x = await fetch('zerstoerer/dateien.json', { cache: 'no-cache' }); if (x.ok) { const j = await x.clone().json(); if (j && j.dateien) { MAP = j.dateien; await m.put('dateien', x); await tonAbgleich(); return MAP; } } } catch (_) {}
    if (!MAP) try { const r = await m.match('dateien'); if (r) { const j = await r.json(); MAP = (j && j.dateien) || null; } } catch (_) {}
  }
  return MAP;
}
const tonListe = () => Object.keys(MAP || {}).filter(istTon);
const kurz = q => (MAP && MAP[q] && MAP[q].sha256 ? String(MAP[q].sha256).slice(0, 8) : '');
const tonKey = q => { const h = kurz(q); return h ? q + '?h=' + h : q; };
/* geänderte oder umbenannte Aufnahmen: alte Fassung raus */
async function tonAbgleich() {
  if (!MAP) return 0; const c = await caches.open(TON); let n = 0;
  for (const k of await c.keys()) {
    const u = new URL(k.url), q = rel(u.origin + u.pathname), h = u.searchParams.get('h') || '';
    if (q && MAP[q] && h !== kurz(q)) { await c.delete(k); n++; }
  }
  return n;
}
async function istVoll() { return !!(await (await caches.open(MARK)).match('voll')); }

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const x = await seiteHolen(15000); if (!x) return;
    const html = await x.clone().text(); await (await caches.open(KERN)).put('zerstoerer.html', x);
    await kernLaden(html);
  })());
});
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('zs-') && ![KERN, TON, MARK].includes(k)) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const p = rel(r.url); if (p == null) return;
  const q = ohneQ(p);
  if (q === 'zerstoerer.html' || (r.mode === 'navigate' && /^zerstoerer(\.html)?$/.test(q))) {
    e.respondWith((async () => {
      const c = await caches.open(KERN), x = await seiteHolen(5000);
      if (x) {
        const html = await x.clone().text(); await c.put('zerstoerer.html', x.clone());
        if (vOf(html) !== await alteV()) e.waitUntil(kernLaden(html)); /* neue Spielversion: Kern nachladen, alte Einträge weg */
        return x;
      }
      const k = await c.match('zerstoerer.html'); if (k) return k;
      return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><body style="background:#1a0e10;color:#e8dcc0;font:18px sans-serif;padding:2em">Ezekiel ist noch nicht offline gespeichert – bitte einmal mit Internet öffnen. / Not stored offline yet – open once while online.', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    })());
    return;
  }
  if (istKern(p)) {
    e.respondWith(caches.open(KERN).then(async c => {
      const k = await c.match(p); if (k) return k;
      const x = await fetch(r); if (x.ok && x.status === 200) c.put(p, x.clone()); return x;
    }));
    return;
  }
  if (istTon(q)) {
    e.respondWith(caches.open(TON).then(async c => {
      await karte(false);
      const key = tonKey(q);
      const k = (await c.match(key)) || (!MAP ? await c.match(q, { ignoreSearch: true }) : null); if (k) return k;
      let x;
      try { x = await fetch(r); } catch (err) { const alt = await c.match(q, { ignoreSearch: true }); if (alt) return alt; throw err; } /* offline: lieber die ältere Fassung als Stille */
      if (x.ok && x.status === 200) e.waitUntil(c.put(key, x.clone()).then(async () => { if (await istVoll()) return; const ks = await c.keys(); for (let i = 0; i < ks.length - MAXTON; i++) await c.delete(ks[i]); }));
      return x;
    }));
    return;
  }
  /* übrige Dateien im Spielordner ohne ?v (z. B. dateien.json): Netz zuerst, sonst gespeichert */
  if (/^zerstoerer\//.test(q)) {
    e.respondWith(caches.open(KERN).then(async c => { try { const x = await fetch(r); if (x.ok && x.status === 200) c.put(p, x.clone()); return x; } catch (err) { const k = await c.match(p); if (k) return k; throw err; } }));
  }
});
/* ---------- „Alles offline speichern“ ---------- */
let laeuft = null, stopp = false;
async function melden(m) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(Object.assign({ zsSw: 1 }, m)); }
async function stand() {
  await karte(false);
  const k = await caches.open(KERN), t = await caches.open(TON), liste = tonListe(), da = new Set();
  for (const r of await t.keys()) { const u = new URL(r.url); da.add(rel(u.origin + u.pathname) + (u.searchParams.get('h') ? '?h=' + u.searchParams.get('h') : '')); }
  let n = 0, b = 0, ges = 0;
  for (const q of liste) { const g = (MAP[q] && MAP[q].groesse) || 0; ges += g; if (da.has(tonKey(q))) { n++; b += g; } }
  return { swv: SWV, v: await alteV(), kern: (await k.keys()).length, ton: da.size, tonN: n, tonTotal: liste.length, tonB: b, tonGes: ges, voll: await istVoll(), laeuft: !!laeuft };
}
function allesLaden() {
  if (laeuft) return laeuft; stopp = false;
  laeuft = (async () => {
    await (await caches.open(MARK)).put('voll', new Response('1'));
    await karte(true);
    const c = await caches.open(TON), liste = tonListe(), fehlt = [];
    for (const q of liste) if (!(await c.match(tonKey(q)))) fehlt.push(q);
    let b = 0, n = 0, fehler = 0; const ges = fehlt.reduce((s, q) => s + ((MAP[q] && MAP[q].groesse) || 0), 0), N = fehlt.length;
    await melden({ art: 'fort', b, ges, n, N, fehler });
    const lauf = async () => {
      while (fehlt.length && !stopp) {
        const q = fehlt.shift();
        try { const x = await fetch(q, { cache: 'no-cache' }); if (!x.ok) throw 0; await c.put(tonKey(q), x); } catch (_) { fehler++; }
        n++; b += (MAP[q] && MAP[q].groesse) || 0; if (n % 10 === 0 || !fehlt.length) await melden({ art: 'fort', b, ges, n, N, fehler });
      }
    };
    await Promise.all([lauf(), lauf(), lauf(), lauf()]);
    if (stopp) await (await caches.open(MARK)).delete('voll');
    await melden({ art: stopp ? 'gestoppt' : 'fertig', fehler, stand: await stand() });
  })().finally(() => { laeuft = null; });
  return laeuft;
}
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.zsSw === 'stand') e.waitUntil(stand().then(s => { if (e.source) e.source.postMessage({ zsSw: 1, art: 'stand', stand: s }); }));
  if (d.zsSw === 'alles') e.waitUntil(allesLaden());
  if (d.zsSw === 'stopp') { stopp = true; }
  if (d.zsSw === 'loeschen') e.waitUntil((async () => { stopp = true; if (laeuft) await laeuft.catch(() => {}); await caches.delete(TON); await (await caches.open(MARK)).delete('voll'); await melden({ art: 'stand', stand: await stand() }); })());
});
