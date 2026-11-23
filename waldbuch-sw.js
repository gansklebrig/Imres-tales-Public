/* Friedrichs Waldbuch – Offline-Helfer (Service Worker).
   Kern (Texte, Programm, Schriften) wird beim Installieren gespeichert.
   Fotos landen in einem eigenen Speicher, sobald man sie ansieht oder über
   „Offline nutzen“ alle auf einmal herunterlädt. Programmdateien: erst Netz,
   dann Speicher (so kommen Updates an). Fotos: erst Speicher, dann Netz. */
const KERN = "waldbuch-kern-v2", BILDER = "waldbuch-bilder-v1";
const DATEIEN = ["waldbuch.html", "waldbuch.webmanifest", "waldbuch.js", "waldbuch-spiel.js", "waldbuch-merk.js", "waldbuch-mehr.js", "pflanzen/stimmen.json", "waldbuch-arten-1.js", "waldbuch-arten-2.js", "waldbuch-arten-3.js", "waldbuch-arten-4.js", "waldbuch-arten-5.js", "pflanzen/bilder.json", "friedrich-frei.webp", "rex-frei.webp", "favicon.svg", "waldbuch-icon-192.png", "waldbuch-icon-512.png", "schriften/schriften.css", "schriften/alegreya-sans-latin-400-normal.woff2", "schriften/alegreya-sans-latin-500-normal.woff2", "schriften/alegreya-sans-latin-700-normal.woff2", "schriften/alegreya-sans-latin-800-normal.woff2", "schriften/alegreya-sans-latin-ext-400-normal.woff2", "schriften/alegreya-sans-latin-ext-500-normal.woff2", "schriften/alegreya-sans-latin-ext-700-normal.woff2", "schriften/alegreya-sans-latin-ext-800-normal.woff2", "schriften/caveat-latin-500-normal.woff2", "schriften/caveat-latin-600-normal.woff2", "schriften/caveat-latin-ext-500-normal.woff2", "schriften/caveat-latin-ext-600-normal.woff2", "schriften/im-fell-english-latin-400-italic.woff2", "schriften/im-fell-english-latin-400-normal.woff2", "schriften/im-fell-english-sc-latin-400-normal.woff2", "schriften/spectral-latin-400-italic.woff2", "schriften/spectral-latin-400-normal.woff2", "schriften/spectral-latin-500-normal.woff2", "schriften/spectral-latin-600-normal.woff2", "schriften/spectral-latin-ext-400-italic.woff2", "schriften/spectral-latin-ext-400-normal.woff2", "schriften/spectral-latin-ext-500-normal.woff2", "schriften/spectral-latin-ext-600-normal.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(KERN).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith("waldbuch-") && n !== KERN && n !== BILDER).map(n => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (u.pathname.includes("/pflanzen/bilder/") || u.pathname.includes("/pflanzen/stimmen/") || /\.(webp|png|jpg|woff2|svg)$/.test(u.pathname)) {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(t => t || fetch(r).then(n => { if (n.ok && (u.pathname.includes("/pflanzen/bilder/") || u.pathname.includes("/pflanzen/stimmen/"))) { const k = n.clone(); caches.open(BILDER).then(c => c.put(u.pathname, k)); } return n; })));
    return;
  }
  e.respondWith(fetch(r).then(n => { if (n.ok && DATEIEN.some(d => u.pathname.endsWith("/" + d))) { const k = n.clone(); caches.open(KERN).then(c => c.put(u.pathname, k)); } return n; }).catch(() => caches.match(r, { ignoreSearch: true }).then(t => t || (r.mode === "navigate" ? caches.match("waldbuch.html", { ignoreSearch: true }) : undefined))));
});
