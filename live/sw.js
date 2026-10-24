/* Klangwelten Live – Service Worker: liefert App und Aufnahmen aus dem Offline-Speicher, damit alles ohne Internet läuft. */
importScripts("daten.js");
const CACHE = "klangwelten-live-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(self.KLANG.SCHALE.map(u => c.add(new Request(u, { cache: "no-cache" })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith("klangwelten-live-") && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  const seite = r.mode === "navigate" || /\/live\/(index\.html|daten\.js)?$/.test(new URL(r.url).pathname) || r.url.endsWith("daten.js");
  e.respondWith(caches.open(CACHE).then(async c => {
    const treffer = await c.match(r, { ignoreSearch: true }) || (r.mode === "navigate" ? await c.match("./index.html") : null);
    /* App-Dateien im Hintergrund auffrischen, wenn Internet da ist; Aufnahmen ändern sich nicht */
    const netzHolen = () => fetch(r).then(antw => { if (antw.ok) c.put(r, antw.clone()); return antw; }).catch(() => null);
    if (treffer) { if (seite) e.waitUntil(netzHolen()); return treffer; }
    return (await netzHolen()) || new Response("", { status: 504, statusText: "offline" });
  }));
});
