/* Klangwelten Live – Service Worker: liefert App und Aufnahmen aus dem Offline-Speicher, damit alles ohne Internet läuft.
   App-Dateien (Seite, daten.js, klangwerk.js …) kommen sofort aus dem Speicher und werden im Hintergrund aufgefrischt;
   ob sich Aufnahmen geändert haben oder weggefallen sind, prüft die App selbst (offlineVorbereiten in index.html). */
importScripts("daten.js");
const CACHE = self.KLANG.CACHE;
const SCHALE = self.KLANG.SCHALE.map(u => new URL(u, location.href).href);
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(self.KLANG.SCHALE.map(u => c.add(new Request(u, { cache: "no-cache" })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith("klangwelten-live-") && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  const url = new URL(r.url);
  if (r.method !== "GET" || url.origin !== location.origin) return;
  /* Prüfabrufe der App (offlineVorbereiten) gehen immer ans Netz */
  if (r.headers.has("X-Klang-Pruefen")) return;
  const ohneSuche = url.origin + url.pathname;
  const seite = r.mode === "navigate" || SCHALE.includes(ohneSuche);
  e.respondWith(caches.open(CACHE).then(async c => {
    const treffer = await c.match(r, { ignoreSearch: true }) || (r.mode === "navigate" ? await c.match("./index.html") : null);
    /* App-Dateien im Hintergrund auffrischen (am HTTP-Cache vorbei nachfragen), wenn Internet da ist */
    const netzHolen = () => fetch(seite ? new Request(ohneSuche, { cache: "no-cache" }) : r).then(antw => {
      if (antw.ok && antw.status === 200) return c.put(ohneSuche, antw.clone()).catch(() => {}).then(() => antw);
      return antw;
    }).catch(() => null);
    if (treffer) { if (seite && self.navigator.onLine !== false) e.waitUntil(netzHolen()); return treffer; }
    return (await netzHolen()) || new Response("", { status: 504, statusText: "offline" });
  }));
});
