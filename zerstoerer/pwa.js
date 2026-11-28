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

  /* W39 PWA: „Offline spielen“ in den Einstellungen – alles speichern (mit Größe, Fortschritt, Abbrechen, Platzprüfung), löschen */
  const MB = b => (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace(".", L([",", "."])) + " MB";
  const sw = () => navigator.serviceWorker && navigator.serviceWorker.controller;
  const senden = m => { const c = sw(); if (c) c.postMessage({ zsSw: m }); return !!c; };
  let OF = { stand: null, fort: null, platz: null, offen: false };
  async function platz() { try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); OF.platz = { frei: Math.max(0, (e.quota || 0) - (e.usage || 0)), belegt: e.usage || 0 }; } } catch (_) {} }
  async function dauerhaft() { try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) P.persist = await navigator.storage.persist(); else P.persist = true; } catch (_) {} }
  P.dauerhaft = dauerhaft;
  if (swOk) {
    navigator.serviceWorker.addEventListener("message", e => {
      const d = e.data; if (!d || !d.zsSw) return;
      if (d.stand) OF.stand = d.stand;
      if (d.art === "fort") OF.fort = d;
      if (d.art === "fertig" || d.art === "gestoppt") { OF.fort = null; OF.ende = d.art; OF.fehler = d.fehler | 0; platz(); }
      if (OF.offen) zeichne();
    });
    window.addEventListener("appinstalled", dauerhaft);
    if (standalone()) setTimeout(dauerhaft, 3000);
  }
  function zeichne() {
    const box = document.querySelector("#modal .zs-off"); if (!box) { OF.offen = false; return; }
    const s = OF.stand, f = OF.fort;
    let h = "";
    if (!s) h += "<p>" + L(["Offline-Helfer wird gestartet …", "Starting the offline helper …"]) + "</p>";
    else {
      h += '<p class="zs-off-z">' + L(["Spiel und Schriften: ", "Game and fonts: "]) + "<b>" + (s.kern > 0 ? L(["gespeichert", "stored"]) : L(["noch nicht gespeichert", "not stored yet"])) + "</b></p>";
      const nN = f ? Math.min(s.tonTotal, s.tonN + f.n) : s.tonN, nB = f ? Math.min(s.tonGes, s.tonB + f.b) : s.tonB; /* während des Ladens mitzählen */
      h += '<p class="zs-off-z">' + L(["Klänge und Instrumente: ", "Sounds and instruments: "]) + "<b>" + nN + " / " + s.tonTotal + "</b> · " + MB(nB) + " / " + MB(s.tonGes) + (s.voll ? " · " + L(["alles offline", "all offline"]) : "") + "</p>";
      if (OF.platz) h += '<p class="zs-off-z">' + L(["Freier Speicher für den Browser: ", "Free browser storage: "]) + MB(OF.platz.frei) + "</p>";
      const rest = Math.max(0, s.tonGes - s.tonB);
      if (OF.platz && rest > 0 && OF.platz.frei < rest * 1.3) h += '<p class="zs-off-warn">⚠ ' + L(["Der Platz ist knapp – das Speichern kann abbrechen. Andere Offline-Daten oder Apps freiräumen hilft.", "Storage is tight – saving may stop early. Freeing other offline data or apps helps."]) + "</p>";
      if (f) { const pz = f.ges ? Math.round(f.b / f.ges * 100) : 100; h += '<div class="zs-off-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pz + '"><i style="width:' + pz + '%"></i></div><p class="zs-off-z">' + f.n + " / " + f.N + " · " + MB(f.b) + " / " + MB(f.ges) + (f.fehler ? " · " + f.fehler + L([" Fehler", " errors"]) : "") + "</p>"; }
      else if (OF.ende) h += '<p class="zs-off-z">' + (OF.ende === "fertig" ? (OF.fehler ? "⚠ " + OF.fehler + L([" Dateien fehlen noch – später erneut versuchen.", " files still missing – try again later."]) : "✓ " + L(["Alles offline gespeichert.", "Everything stored offline."])) : L(["Abgebrochen.", "Cancelled."])) + "</p>";
    }
    const k = [];
    if (f) k.push('<button data-act="zsOffStopp" autofocus>' + L(["Abbrechen", "Cancel"]) + "</button>");
    else if (s) {
      const rest = Math.max(0, s.tonGes - s.tonB);
      if (rest > 0 || !s.voll) k.push('<button data-act="zsOffAlles" autofocus>⬇ ' + L(["Alles offline speichern", "Save everything offline"]) + (rest > 0 ? " (" + MB(rest) + ")" : "") + "</button>");
      if (s.ton > 0) k.push('<button data-act="zsOffWeg" class="gefahr">' + L(["Offline-Daten löschen", "Delete offline data"]) + "</button>");
    }
    k.push('<button data-act="zsOffZu">' + L(["Zurück", "Back"]) + "</button>");
    const hadFocus = document.activeElement && box.contains(document.activeElement) ? document.activeElement.dataset.act : null;
    if (!k.some(x => /autofocus/.test(x))) k[k.length - 1] = k[k.length - 1].replace("<button ", "<button autofocus ");
    box.innerHTML = h + '<div class="knoepfe senk">' + k.join("") + "</div>";
    const auto = box.querySelector("[autofocus]"), keep = hadFocus && hadFocus !== OF.lastAuto ? box.querySelector('[data-act="' + hadFocus + '"]') : null; /* selbst gewählten Fokus behalten, sonst den neuen Hauptknopf */
    OF.lastAuto = auto ? auto.dataset.act : null;
    const fo = keep || auto || box.querySelector("button");
    if (fo) fo.focus({ preventScroll: true });
  }
  function offlineFenster() {
    if (!swOk) return;
    Z.ui.open("<h2>" + L(["Offline spielen", "Play offline"]) + '</h2><p class="hinweis">' + L(["Nach dem ersten Besuch läuft das Spiel auch ohne Netz. Klänge werden beim Spielen gespeichert – oder hier alle auf einmal. Online-Koop braucht immer Internet.", "After the first visit the game runs without a connection. Sounds are stored while you play – or all at once here. Online co-op always needs the internet."]) + '</p><div class="zs-off"></div>', { cls: "schmal", onClose: () => { OF.offen = false; } });
    OF.offen = true; OF.ende = null; zeichne(); platz().then(() => OF.offen && zeichne());
    if (!senden("stand")) { navigator.serviceWorker.ready.then(() => setTimeout(() => senden("stand"), 300)); }
  }
  P.offlineFenster = offlineFenster; P.OF = OF;
  function wireOff() {
    const u = Z.ui; if (!u || !u.actions || typeof u.settings !== "function") return setTimeout(wireOff, 80);
    const a = u.actions;
    a.zsOffAlles = async () => {
      await platz(); const s = OF.stand, rest = s ? Math.max(0, s.tonGes - s.tonB) : 0;
      const go = () => { dauerhaft(); OF.ende = null; OF.fort = { b: 0, ges: rest, n: 0, N: s ? s.tonTotal - s.tonN : 0, fehler: 0 }; senden("alles"); zeichne(); };
      if (OF.platz && rest > OF.platz.frei) { frage(L(["Speicher knapp", "Low storage"]), L(["Vermutlich reicht der Speicher nicht (frei: ", "Probably not enough storage (free: "]) + MB(OF.platz.frei) + L([", nötig: ", ", needed: "]) + MB(rest) + L(["). Trotzdem versuchen?", "). Try anyway?"]), L(["Trotzdem speichern", "Save anyway"]), go); return; }
      go();
    };
    a.zsOffStopp = () => { senden("stopp"); };
    /* Rückfrage im Spielfenster (Steuerkreuz/Touch), danach zurück ins Offline-Fenster */
    const frage = (titel, text, ok, fn) => { if (u.confirm) u.confirm(titel, text, ok, () => { offlineFenster(); fn(); }); else fn(); };
    a.zsOffWeg = () => frage(L(["Offline-Daten löschen", "Delete offline data"]), L(["Alle gespeicherten Klänge löschen? Das Spiel selbst bleibt offline nutzbar, Klänge kommen beim Spielen wieder.", "Delete all stored sounds? The game itself stays available offline; sounds return while playing."]), L(["Löschen", "Delete"]), () => { OF.ende = null; senden("loeschen"); });
    a.zsOffZu = () => { OF.offen = false; u.close(); try { u.settings(); } catch (_) {} };
    a.zsOffOpen = () => { u.onClose = null; offlineFenster(); };
    if (u.settings._zsOff) return;
    const s0 = u.settings;
    u.settings = function () {
      const r = s0.apply(this, arguments);
      try {
        const box = document.querySelector("#modal .einst");
        if (swOk && box && !box.querySelector('[data-act="zsOffOpen"]')) {
          const b = document.createElement("button"); b.className = "steuerknopf"; b.dataset.act = "zsOffOpen"; b.textContent = "⬇ " + L(["Offline spielen …", "Play offline …"]);
          const g = box.querySelector('[data-act="w31Bericht"]') || box.querySelector('[data-act="graphics"]'); if (g) g.after(b); else box.appendChild(b);
        }
      } catch (_) {}
      return r;
    };
    Object.keys(s0).forEach(k => { u.settings[k] = s0[k]; }); u.settings._zsOff = true;
  }
  if (swOk) setTimeout(wireOff, 0);

  /* Aussehen: warm, dezent */
  const st = document.createElement("style");
  st.textContent = "#zs-neu{position:fixed;left:10px;bottom:10px;z-index:60;display:flex;gap:8px;align-items:center;padding:6px 8px 6px 12px;border-radius:10px;background:rgba(26,14,16,.9);border:1px solid rgba(229,180,84,.55);color:#e8dcc0;font:600 13px 'Alegreya Sans',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4)}" +
    "#zs-neu button{min-height:32px;padding:2px 10px;border-radius:7px;border:1px solid #c89040;background:#3a2018;color:#ffd27a;font:inherit;cursor:pointer}#zs-neu .zs-neu-x{min-width:32px;padding:2px 6px;border-color:rgba(200,180,150,.35);background:transparent;color:#c8b8a8}" +
    "#title .t-ios{margin:8px auto 0;max-width:30em;font:500 13px 'Alegreya Sans',sans-serif;color:#c8b8a8;text-align:center}" +
    ".zs-off .zs-off-z{margin:4px 0}.zs-off .zs-off-warn{margin:6px 0;color:#ffb070}.zs-off-bar{height:10px;margin:8px 0 2px;border-radius:5px;background:rgba(255,255,255,.08);border:1px solid rgba(229,180,84,.35);overflow:hidden}.zs-off-bar i{display:block;height:100%;background:linear-gradient(90deg,#c8501a,#e5b454)}";
  document.head.appendChild(st);
})();
