/* Ezekiel – The Destroyer offline (W39 PWA): steuert zerstoerer.html und den Spielordner (Scope „./zerstoerer“,
   kein Überlapp mit heldensturm/waldbuch/klangwelten).
   - Seite: zuerst aus dem Netz (5 s), sonst gespeichert – so kommen Neuerungen sofort an.
   - Kern: beim Installieren und bei jeder neuen Spielversion (?v=…) werden alle Skripte und Stile der Seite plus die Schriften
     vorgeladen; Einträge alter Versionen werden danach entfernt.
   - Geräusche/Instrumente: erst beim ersten Abspielen gespeichert, höchstens MAXTON Einträge (älteste zuerst raus).
   - Alles andere (Vermittler für Online-Koop, fremde Adressen) geht ungefiltert ins Netz. */
const SWV = 1;
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
  })().finally(() => { kernLaeuft = null; });
  return kernLaeuft;
}
async function seiteHolen(timeout) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  try { const x = await fetch('zerstoerer.html', { cache: 'no-cache', signal: ctl.signal }); clearTimeout(t); return x.ok ? x : null; } catch (_) { clearTimeout(t); return null; }
}
async function alteV() { const r = await (await caches.open(MARK)).match('v'); return r ? +(await r.text()) || 0 : 0; }

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
      const k = await c.match(q); if (k) return k;
      const x = await fetch(r);
      if (x.ok && x.status === 200) e.waitUntil(c.put(q, x.clone()).then(async () => { const ks = await c.keys(); for (let i = 0; i < ks.length - MAXTON; i++) await c.delete(ks[i]); }));
      return x;
    }));
    return;
  }
  /* übrige Dateien im Spielordner ohne ?v (z. B. dateien.json): Netz zuerst, sonst gespeichert */
  if (/^zerstoerer\//.test(q)) {
    e.respondWith(caches.open(KERN).then(async c => { try { const x = await fetch(r); if (x.ok && x.status === 200) c.put(p, x.clone()); return x; } catch (err) { const k = await c.match(p); if (k) return k; throw err; } }));
  }
});
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.zsSw === 'stand') e.waitUntil((async () => {
    const k = await caches.open(KERN), t = await caches.open(TON);
    const s = { swv: SWV, v: await alteV(), kern: (await k.keys()).length, ton: (await t.keys()).length };
    if (e.source) e.source.postMessage({ zsSw: 'stand', s });
  })());
});
