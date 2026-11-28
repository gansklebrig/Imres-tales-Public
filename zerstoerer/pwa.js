/* Ezekiel – The Destroyer · App und offline (W39 PWA)
   Im Browser (http/https): Web-Manifest einhängen, Offline-Helfer anmelden (zerstoerer-sw.js im Wurzelordner, Scope ./zerstoerer),
   „App installieren“ im Titel (beforeinstallprompt), Hinweis „Zum Home-Bildschirm“ auf iPhone/iPad, dezenter Hinweis bei neuer
   Spielversion, klare Meldung, wenn Online-Koop ohne Netz geöffnet wird.
   Nicht im PC-Programm (eigenes Schema, window.__zsPC) und nicht ohne Service-Worker-Unterstützung.
   Prüfhilfe: Z.pwa. Farben warm, kein Blau. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z) return;
  const L = v => (Z.L ? Z.L(v) : v[0]);
  const web = /^https?:$/.test(location.protocol) && !window.__zsPC;
  const swOk = web && "serviceWorker" in navigator && (!navigator.webdriver || window.__zsSwTest); /* Testläufe ohne Offline-Helfer, außer ausdrücklich gewünscht */
  const P = (Z.pwa = { web, swOk, reg: null, err: "", prompt: null, neu: 0, installiert: false });
  const meineV = () => { const m = /v=(\d+)/.exec(Z.VERSION || ""); return m ? +m[1] : 0; };
  const iOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches) || navigator.standalone === true;

  /* Kopf: Manifest, Farbe, Symbol (nur im Browser – das PC-Programm darf die Dateien im Wurzelordner gar nicht laden) */
  if (web) {
    const add = (tag, a) => { const e = document.createElement(tag); for (const k in a) e.setAttribute(k, a[k]); document.head.appendChild(e); };
    if (!document.querySelector('link[rel="manifest"]')) add("link", { rel: "manifest", href: "zerstoerer.webmanifest" });
    if (!document.querySelector('meta[name="theme-color"]')) add("meta", { name: "theme-color", content: "#1a0e10" });
    add("link", { rel: "apple-touch-icon", href: "zerstoerer-icon-192.png" });
    add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
    add("meta", { name: "apple-mobile-web-app-title", content: "Ezekiel" });
  }

  /* Offline-Helfer */
  if (swOk) {
    const go = () => navigator.serviceWorker.register("zerstoerer-sw.js", { scope: "./zerstoerer" }).then(r => { P.reg = r; }).catch(e => { P.err = String((e && e.message) || e); });
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
  }

  /* Neue Version: Seite kam aus dem Speicher (offline/langsam) oder lief lange – kurz nachsehen, dezent melden */
  let bar = null;
  function zeigeNeu(v) {
    if (bar || !document.body) return; P.neu = v;
    bar = document.createElement("div"); bar.id = "zs-neu"; bar.setAttribute("role", "status");
    bar.innerHTML = "<span>" + L(["Neue Version", "New version"]) + "</span><button type=\"button\">" + L(["Neu laden", "Reload"]) + "</button><button type=\"button\" class=\"zs-neu-x\" aria-label=\"" + L(["Später", "Later"]) + "\">×</button>";
    bar.querySelector("button").onclick = () => location.reload();
    bar.querySelector(".zs-neu-x").onclick = () => { bar.hidden = true; };
    document.body.appendChild(bar);
  }
  async function pruefeNeu() {
    if (!web || !navigator.onLine || bar) return;
    try {
      const t = await (await fetch("zerstoerer.html", { cache: "no-store" })).text();
      let m, v = 0; const re = /\?v=(\d+)/g; while ((m = re.exec(t))) v = Math.max(v, +m[1]);
      if (v > meineV() && meineV() > 0) zeigeNeu(v);
    } catch (_) {}
  }
  if (web) {
    setTimeout(pruefeNeu, 20000);
    setInterval(pruefeNeu, 30 * 60000);
    window.addEventListener("online", () => setTimeout(pruefeNeu, 3000));
    document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(pruefeNeu, 2000); });
  }
  P.pruefeNeu = pruefeNeu; P.zeigeNeu = zeigeNeu;

  /* Installieren im Titel */
  function titelKnopf() {
    const t = document.getElementById("title"); if (!t || t.hidden) return;
    const box = t.querySelector(".tbtn"); if (!box) return;
    let b = t.querySelector("#t-install");
    if (P.prompt && !P.installiert && !standalone()) {
      if (!b) { b = document.createElement("button"); b.id = "t-install"; b.className = "t-klein"; b.textContent = "⬇ " + L(["Als App installieren", "Install as app"]); b.onclick = installieren; const nach = box.querySelector("#t-online") || box.querySelector("#t-slots") || box.querySelector("#t-play"); if (nach && nach.parentNode === box) box.insertBefore(b, nach.nextSibling); else box.appendChild(b); }
    } else if (b) b.remove();
    let h = t.querySelector("#t-ios");
    if (web && iOS() && !standalone()) {
      if (!h) { h = document.createElement("p"); h.id = "t-ios"; h.className = "t-ios"; h.textContent = L(["Als App: im Teilen-Menü „Zum Home-Bildschirm“ wählen.", "As an app: choose “Add to Home Screen” in the Share menu."]); box.parentNode.insertBefore(h, box.nextSibling); }
    } else if (h) h.remove();
  }
  async function installieren() {
    const e = P.prompt; if (!e) return; P.prompt = null;
    try { e.prompt(); const r = await e.userChoice; if (r && r.outcome === "accepted") P.installiert = true; } catch (_) {}
    titelKnopf();
  }
  P.installieren = installieren; P.titelKnopf = titelKnopf;
  if (web) {
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); P.prompt = e; titelKnopf(); });
    window.addEventListener("appinstalled", () => { P.installiert = true; P.prompt = null; titelKnopf(); });
  }

  /* Online-Koop ohne Netz: klare Meldung statt Wartezeit auf den Vermittler */
  function haken() {
    const st = Z.ui && Z.ui.showTitle;
    if (st && !st._pwa) { const w = function () { const r = st.apply(this, arguments); try { titelKnopf(); } catch (_) {} return r; }; w._pwa = true; Object.keys(st).forEach(k => { w[k] = st[k]; }); Z.ui.showTitle = w; }
    const O = Z.online;
    if (O && O.open && !O.open._pwa) {
      const o0 = O.open;
      const w = function () {
        if (navigator.onLine === false && !(O.S && O.S.role)) {
          Z.ui.open("<h2>" + L(["Online spielen", "Play online"]) + "</h2><p>" + L(["Gerade keine Internetverbindung. Online-Koop braucht das Netz – lokal (zweites Steuergerät) und allein geht es auch offline.", "No internet connection right now. Online co-op needs the network – local co-op (second controller) and solo play work offline too."]) + '</p><div class="knoepfe"><button data-act="close" autofocus>' + L(["Verstanden", "Got it"]) + "</button></div>", { cls: "schmal" });
          return;
        }
        return o0.apply(this, arguments);
      };
      w._pwa = true; O.open = w;
    }
    titelKnopf();
  }
  setTimeout(haken, 0);

  /* Aussehen: warm, dezent */
  const st = document.createElement("style");
  st.textContent = "#zs-neu{position:fixed;left:10px;bottom:10px;z-index:60;display:flex;gap:8px;align-items:center;padding:6px 8px 6px 12px;border-radius:10px;background:rgba(26,14,16,.9);border:1px solid rgba(229,180,84,.55);color:#e8dcc0;font:600 13px 'Alegreya Sans',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4)}" +
    "#zs-neu button{min-height:32px;padding:2px 10px;border-radius:7px;border:1px solid #c89040;background:#3a2018;color:#ffd27a;font:inherit;cursor:pointer}#zs-neu .zs-neu-x{min-width:32px;padding:2px 6px;border-color:rgba(200,180,150,.35);background:transparent;color:#c8b8a8}" +
    "#title .t-ios{margin:8px auto 0;max-width:30em;font:500 13px 'Alegreya Sans',sans-serif;color:#c8b8a8;text-align:center}";
  document.head.appendChild(st);
})();
