/* Klangwelten offline: steuert nur ambient.html (Scope „/ambient“).
   Aufnahmen kommen zuerst aus dem Speicher (sie ändern sich nie), die Seite selbst zuerst aus dem Netz. */
const CACHE = "imres-klangwelten-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
async function teil(antwort, range) {
  const blob = await antwort.blob(), m = /bytes=(\d*)-(\d*)/.exec(range || ""), n = blob.size;
  let a = m && m[1] ? +m[1] : 0, b = m && m[2] ? +m[2] : n - 1;
  if (m && !m[1] && m[2]) { a = Math.max(0, n - +m[2]); b = n - 1; }
  b = Math.min(b, n - 1);
  return new Response(blob.slice(a, b + 1), { status: 206, statusText: "Partial Content",
    headers: { "Content-Type": antwort.headers.get("Content-Type") || "audio/mpeg", "Content-Range": "bytes " + a + "-" + b + "/" + n, "Content-Length": String(b - a + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  const pfad = u.pathname;
  if (/\/ambient\.html$/.test(pfad) || pfad.endsWith("/klangwerk.js")) {
    /* Seite: Netz zuerst (damit Neuerungen ankommen), sonst gespeicherte Fassung */
    e.respondWith(fetch(r).then(x => { if (x.ok) { const k = x.clone(); caches.open(CACHE).then(c => c.put(pfad.endsWith(".js") ? "klangwerk.js" : "ambient.html", k)); } return x; })
      .catch(() => caches.match(pfad.endsWith(".js") ? "klangwerk.js" : "ambient.html")));
    return;
  }
  if (!/\/(amb|klang)\/[^/]+\.mp3$/.test(pfad)) return;
  const range = r.headers.get("range");
  e.respondWith(caches.open(CACHE).then(async c => {
    const t = await c.match(pfad.replace(/^\//, ""), { ignoreSearch: true }) || await c.match(r, { ignoreSearch: true });
    if (t) return range ? teil(t, range) : t;
    if (range) return fetch(r);
    const x = await fetch(r);
    if (x.ok && x.status === 200) c.put(r, x.clone());
    return x;
  }));
});
