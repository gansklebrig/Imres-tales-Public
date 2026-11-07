/* =====================================================================
   VORLESEN – die Chronik als Hörbuch (Sprecher: Helmut, ElevenLabs)
   ---------------------------------------------------------------------
   Die Aufnahmen entstehen per GitHub-Ablauf (tools/vertonung/vertonen.py)
   und liegen unter audio/chronik/<sprache>/ mit manifest.json:
   { kapitel: { "I": [{ i, datei, titel }], "vorab": [...] } }
   i = Index des Absatzes in inhalt.js → entspricht dem i-ten Kind von
   #kapitel-<nr> .prose. Bilder werden übersprungen.
   Knöpfe: am Kapitelanfang „Kapitel vorlesen“, an jeder Zwischenüberschrift
   ein kleines ▶ („ab hier“). Unten erscheint ein kleiner Spieler.
   ===================================================================== */
(function () {
  "use strict";
  const de = () => (document.documentElement.lang || "de").slice(0, 2) !== "en";
  const TX = {
    de: { kapitel: n => "Kapitel " + n + " vorlesen", kurz: "Vorlesen", abHier: "Ab hier vorlesen", spielen: "Weiter", pause: "Pause", zurueck: "Absatz zurück", vor: "Absatz vor", zu: "Vorlesen beenden", sprecher: "gelesen von Helmut", tempo: "Tempo", vorab: "Ein Wort vorab" },
    en: { kapitel: n => "Listen to chapter " + n, kurz: "Listen", abHier: "Listen from here", spielen: "Play", pause: "Pause", zurueck: "Previous paragraph", vor: "Next paragraph", zu: "Stop listening", sprecher: "read by Helmut", tempo: "Speed", vorab: "A word first" }
  };
  const t = () => TX[de() ? "de" : "en"];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  let manifest = null, mSprache = null, liste = [], pos = -1, audio = null, naechstes = null, spielt = false, tempo = parseFloat(lies("imres-vorlesen-tempo", "1")) || 1;
  let leiste = null, letztesScrollen = 0;

  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor"/></svg>';
  const ZURUECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5.5v13L9.5 12z" fill="currentColor"/></svg>';
  const VOR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5.5v13L14.5 12z" fill="currentColor"/></svg>';
  const OHR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3.2" y="12.5" width="4.6" height="7" rx="1.6" fill="currentColor"/><rect x="16.2" y="12.5" width="4.6" height="7" rx="1.6" fill="currentColor"/></svg>';
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.vl-knopf { justify-self: start; width: max-content; max-width: 100%; display: inline-flex; align-items: center; gap: .55rem; margin: .2rem .6rem .2rem 0; padding: .55rem 1rem .55rem .7rem; border: 1px solid rgba(224,160,70,.55); background: rgba(16,14,21,.55); color: var(--vellum, #ebe2cc); font: inherit; font-size: .92rem; cursor: pointer; border-radius: 999px; transition: background .25s, border-color .25s, box-shadow .25s; }
.vl-knopf svg { width: 1.25rem; height: 1.25rem; color: var(--ember, #e0a046); flex: none; }
.vl-knopf small { color: var(--ash, #b8a998); font-size: .78em; margin-left: .2rem; }
.vl-knopf:hover, .vl-knopf:focus-visible { border-color: var(--ember, #e0a046); background: rgba(224,160,70,.14); box-shadow: 0 0 18px rgba(224,160,70,.18); }
.vl-ab { display: inline-grid; place-items: center; width: 1.9rem; height: 1.9rem; margin-left: .5rem; padding: 0; vertical-align: middle; border: 1px solid rgba(224,160,70,.35); border-radius: 50%; background: none; color: var(--ember, #e0a046); cursor: pointer; opacity: .55; transition: opacity .2s, background .2s; }
.vl-ab svg { width: .95rem; height: .95rem; }
.sub:hover .vl-ab, .vl-ab:hover, .vl-ab:focus-visible { opacity: 1; background: rgba(224,160,70,.12); }
@media (pointer: coarse) { .vl-ab { width: 2.3rem; height: 2.3rem; opacity: .75; } }
/* gerade gelesener Absatz */
#chapters .prose > .vl-aktiv { position: relative; transition: color .4s; }
#chapters .prose > p.vl-aktiv::before, #chapters .prose > .sub.vl-aktiv::before { content: ""; position: absolute; left: -1rem; top: .2em; bottom: .2em; width: 3px; border-radius: 3px; background: linear-gradient(180deg, transparent, var(--ember, #e0a046) 20%, var(--ember, #e0a046) 80%, transparent); box-shadow: 0 0 12px rgba(224,160,70,.55); animation: vlAtem 2.4s ease-in-out infinite; }
#chapters .prose > p.vl-aktiv { color: #f3ead6; }
@keyframes vlAtem { 50% { opacity: .55; } }
@media (max-width: 600px) { #chapters .prose > p.vl-aktiv::before, #chapters .prose > .sub.vl-aktiv::before { left: -.6rem; } }
/* kleiner Spieler unten */
.vl-leiste { position: fixed; left: 50%; bottom: calc(var(--vl-unten, 16px) + env(safe-area-inset-bottom, 0px)); z-index: 60; display: flex; align-items: center; gap: .4rem; max-width: min(36rem, calc(100vw - 1.5rem)); width: max-content; padding: .45rem .55rem .45rem .5rem; border: 1px solid rgba(224,160,70,.45); border-radius: 999px;
  background: rgba(18,15,24,.92); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 10px 30px rgba(0,0,0,.5), 0 0 22px rgba(224,160,70,.12); color: var(--vellum, #ebe2cc);
  transform: translate(-50%, 140%); opacity: 0; transition: transform .45s cubic-bezier(.2,.8,.3,1), opacity .35s; }
.vl-leiste.da { transform: translate(-50%, 0); opacity: 1; }
.vl-leiste button { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--vellum, #ebe2cc); cursor: pointer; flex: none; }
.vl-leiste button svg { width: 1.15rem; height: 1.15rem; }
.vl-leiste button:hover, .vl-leiste button:focus-visible { background: rgba(224,160,70,.16); color: var(--ember, #e0a046); }
.vl-leiste .vl-haupt { width: 2.8rem; height: 2.8rem; background: var(--ember, #e0a046); color: #1a1208; }
.vl-leiste .vl-haupt:hover, .vl-leiste .vl-haupt:focus-visible { background: #f0b85e; color: #1a1208; }
.vl-leiste .vl-haupt svg { width: 1.35rem; height: 1.35rem; }
.vl-info { min-width: 0; display: grid; gap: .1rem; padding: 0 .35rem; cursor: pointer; }
.vl-info b { font-family: var(--name, serif); font-weight: 400; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 15rem; }
.vl-info small { font-size: .7rem; letter-spacing: .08em; color: var(--ash, #b8a998); white-space: nowrap; }
.vl-balken { height: 3px; border-radius: 3px; background: rgba(235,226,204,.15); overflow: hidden; margin-top: .15rem; }
.vl-balken i { display: block; height: 100%; width: 0; background: var(--ember, #e0a046); }
.vl-leiste .vl-tempo { width: auto; padding: 0 .55rem; font: inherit; font-size: .78rem; border-radius: 999px; color: var(--ash, #b8a998); }
.vl-leiste .vl-zu { width: 2rem; height: 2rem; color: var(--ash, #b8a998); font-size: 1rem; }
.vl-welle { display: inline-flex; gap: 2px; align-items: flex-end; height: .8rem; margin-left: .35rem; vertical-align: -1px; }
.vl-welle i { width: 2px; background: var(--ember, #e0a046); border-radius: 1px; height: 30%; }
.vl-leiste.spielt .vl-welle i { animation: vlWelle 1s ease-in-out infinite; } .vl-welle i:nth-child(2) { animation-delay: -.3s !important; } .vl-welle i:nth-child(3) { animation-delay: -.6s !important; }
@keyframes vlWelle { 50% { height: 100%; } }
@media (max-width: 520px) { .vl-info b { max-width: 9rem; } .vl-leiste .vl-tempo { display: none; } }
@media (prefers-reduced-motion: reduce) { .vl-welle i, #chapters .prose > .vl-aktiv::before { animation: none !important; } }
`;
  document.head.appendChild(css);

  /* ---------- Daten ---------- */
  function manifestLaden() {
    const sp = de() ? "de" : "en";
    if (mSprache === sp) return Promise.resolve(manifest);
    mSprache = sp; manifest = null;
    return fetch("audio/chronik/" + sp + "/manifest.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null).then(m => { if (mSprache === sp) manifest = m; return manifest; });
  }
  const absatzEl = (kap, i) => { const art = document.getElementById("kapitel-" + kap); const pr = art && art.querySelector(".prose"); return pr ? pr.children[i] || null : null; };
  function listeBauen() {
    liste = [];
    const K = (manifest && manifest.kapitel) || {};
    /* Reihenfolge wie auf der Seite: Kapitel in Dokumentreihenfolge */
    const arts = Array.from(document.querySelectorAll("#chapters > .chapter"));
    arts.forEach(a => {
      const nr = a.id.replace(/^kapitel-/, ""); (K[nr] || []).forEach(e => liste.push({ kap: nr, i: e.i, datei: e.datei, titel: !!e.titel }));
    });
  }
  function abschnittVon(kap, i) {
    const art = document.getElementById("kapitel-" + kap); if (!art) return "";
    const kinder = art.querySelector(".prose").children;
    for (let j = Math.min(i, kinder.length - 1); j >= 0; j--) if (kinder[j].classList.contains("sub")) return kinder[j].textContent.replace(/Auf der Karte.*$|On the map.*$/, "").trim();
    const h = art.querySelector("h3"); return h ? h.textContent : "";
  }

  /* ---------- Abspielen ---------- */
  function markieren() {
    document.querySelectorAll("#chapters .vl-aktiv").forEach(e => e.classList.remove("vl-aktiv"));
    const x = liste[pos]; if (!x) return;
    const el = absatzEl(x.kap, x.i); if (!el) return;
    el.classList.add("vl-aktiv");
    /* mitscrollen – außer der Nutzer hat gerade selbst gescrollt */
    if (Date.now() - letztesScrollen > 6000) {
      const r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 140) { const y = scrollY + r.top - Math.max(100, innerHeight * .28); window.scrollTo({ top: y, behavior: "smooth" }); eigenesScrollen = Date.now(); }
    }
  }
  let eigenesScrollen = 0;
  window.addEventListener("scroll", () => { if (Date.now() - eigenesScrollen > 1200) letztesScrollen = Date.now(); }, { passive: true });

  function spielen(i) {
    if (i < 0 || i >= liste.length) { stopp(true); return; }
    pos = i; const x = liste[pos];
    if (!audio) { audio = new Audio(); audio.preload = "auto"; audio.addEventListener("ended", () => spielen(pos + 1)); audio.addEventListener("timeupdate", fortschritt); audio.addEventListener("error", () => setTimeout(() => spielen(pos + 1), 300)); }
    const src = x.datei;
    if (naechstes && naechstes.dataset.src === src) { audio.src = naechstes.src; } else audio.src = src;
    audio.playbackRate = tempo;
    const p = audio.play(); if (p && p.catch) p.catch(() => { spielt = false; zeichnen(); });
    spielt = true;
    schreib("imres-vorlesen-pos", JSON.stringify({ sp: mSprache, kap: x.kap, i: x.i }));
    markieren(); zeichnen(); medienInfo();
    /* nächsten Absatz vorladen */
    const n = liste[pos + 1];
    if (n) { naechstes = new Audio(); naechstes.preload = "auto"; naechstes.src = n.datei; naechstes.dataset.src = n.datei; }
  }
  function umschalten() { if (!audio || pos < 0) return; if (audio.paused) { audio.play(); spielt = true; } else { audio.pause(); spielt = false; } zeichnen(); }
  function stopp(fertig) {
    if (audio) audio.pause(); spielt = false;
    document.querySelectorAll("#chapters .vl-aktiv").forEach(e => e.classList.remove("vl-aktiv"));
    if (leiste) leiste.classList.remove("da", "spielt");
    if (fertig) pos = -1;
  }
  function fortschritt() { if (!leiste || !audio) return; const b = leiste.querySelector(".vl-balken i"); const ges = liste.length || 1; b.style.width = (((pos + (audio.duration ? audio.currentTime / audio.duration : 0)) / ges) * 100).toFixed(2) + "%"; }

  /* ---------- Spieler-Leiste ---------- */
  function leisteBauen() {
    if (leiste) return;
    leiste = document.createElement("div"); leiste.className = "vl-leiste"; leiste.setAttribute("role", "region");
    leiste.innerHTML = '<button type="button" class="vl-zurueck">' + ZURUECK + '</button><button type="button" class="vl-haupt">' + PAUSE + '</button><button type="button" class="vl-vor">' + VOR + '</button>' +
      '<div class="vl-info"><b></b><small></small><div class="vl-balken"><i></i></div></div><button type="button" class="vl-tempo"></button><button type="button" class="vl-zu">✕</button>';
    document.body.appendChild(leiste);
    leiste.addEventListener("click", e => {
      const b = e.target.closest("button, .vl-info"); if (!b) return;
      if (b.classList.contains("vl-haupt")) umschalten();
      else if (b.classList.contains("vl-vor")) spielen(pos + 1);
      else if (b.classList.contains("vl-zurueck")) spielen(audio && audio.currentTime > 3 ? pos : Math.max(0, pos - 1));
      else if (b.classList.contains("vl-zu")) stopp(false);
      else if (b.classList.contains("vl-tempo")) { const st = [1, 1.15, 1.3, 0.9]; tempo = st[(st.indexOf(tempo) + 1) % st.length] || 1; schreib("imres-vorlesen-tempo", String(tempo)); if (audio) audio.playbackRate = tempo; zeichnen(); }
      else if (b.classList.contains("vl-info")) { letztesScrollen = 0; markieren(); }
    });
  }
  function untenAbstand() {
    const nav = document.querySelector(".handyleiste");
    let u = 16;
    if (nav) { const cs = getComputedStyle(nav), r = nav.getBoundingClientRect(); if (cs.display !== "none" && r.height > 0 && r.top < innerHeight) u = innerHeight - r.top + 10; }
    document.documentElement.style.setProperty("--vl-unten", u + "px");
  }
  function zeichnen() {
    if (pos < 0) return; leisteBauen(); untenAbstand();
    const T = t(), x = liste[pos];
    leiste.classList.add("da"); leiste.classList.toggle("spielt", spielt && audio && !audio.paused);
    const h = leiste.querySelector(".vl-haupt"); const an = audio && !audio.paused;
    h.innerHTML = an ? PAUSE : PLAY; h.setAttribute("aria-label", an ? T.pause : T.spielen);
    leiste.querySelector(".vl-zurueck").setAttribute("aria-label", T.zurueck); leiste.querySelector(".vl-vor").setAttribute("aria-label", T.vor); leiste.querySelector(".vl-zu").setAttribute("aria-label", T.zu);
    leiste.querySelector(".vl-info b").textContent = x ? (x.kap === "vorab" ? T.vorab : abschnittVon(x.kap, x.i)) : "";
    leiste.querySelector(".vl-info small").innerHTML = esc(x && x.kap !== "vorab" ? (de() ? "Kapitel " : "Chapter ") + x.kap + " · " : "") + esc(T.sprecher) + '<span class="vl-welle"><i></i><i></i><i></i></span>';
    const tk = leiste.querySelector(".vl-tempo"); tk.textContent = (tempo === 1 ? "1" : String(tempo).replace(".", de() ? "," : ".")) + "×"; tk.setAttribute("aria-label", T.tempo);
  }
  function medienInfo() {
    if (!("mediaSession" in navigator) || pos < 0) return;
    const x = liste[pos];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: abschnittVon(x.kap, x.i), artist: "Barradin – " + t().sprecher, album: "Imres Tales · Chronik", artwork: [{ src: "barradin.jpg", sizes: "512x512", type: "image/jpeg" }] });
      navigator.mediaSession.setActionHandler("play", umschalten); navigator.mediaSession.setActionHandler("pause", umschalten);
      navigator.mediaSession.setActionHandler("nexttrack", () => spielen(pos + 1)); navigator.mediaSession.setActionHandler("previoustrack", () => spielen(Math.max(0, pos - 1)));
    } catch (_) {}
  }

  /* ---------- Knöpfe in der Chronik ---------- */
  function knoepfe() {
    document.querySelectorAll(".vl-knopf, .vl-ab").forEach(e => e.remove());
    if (!manifest) return;
    const T = t(), K = manifest.kapitel || {};
    document.querySelectorAll("#chapters > .chapter").forEach(art => {
      const nr = art.id.replace(/^kapitel-/, ""); if (!(K[nr] || []).length) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "vl-knopf"; b.dataset.vlKap = nr;
      b.innerHTML = OHR + "<span>" + esc(T.kapitel(nr)) + "<small>· Helmut</small></span>";
      const rb = art.querySelector(".rb-kapitel, .rb-knopf");
      const h = art.querySelector("h3");
      if (rb && rb.parentNode === art) rb.insertAdjacentElement("afterend", b); else if (h) h.insertAdjacentElement("afterend", b); else art.prepend(b);
      const vorhanden = new Set((K[nr] || []).map(e => e.i));
      Array.from(art.querySelectorAll(".prose > .sub")).forEach(sub => {
        const i = Array.prototype.indexOf.call(sub.parentNode.children, sub); if (!vorhanden.has(i)) return;
        const a = document.createElement("button"); a.type = "button"; a.className = "vl-ab"; a.dataset.vlKap = nr; a.dataset.vlI = i;
        a.setAttribute("aria-label", T.abHier); a.title = T.abHier; a.innerHTML = PLAY;
        const h4 = sub.querySelector("h4"); (h4 || sub).insertAdjacentElement("afterend", a);
      });
    });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-vl-kap]"); if (!b) return;
    e.preventDefault(); listeBauen();
    const kap = b.dataset.vlKap, i = b.dataset.vlI != null ? +b.dataset.vlI : -1;
    let start = liste.findIndex(x => x.kap === kap && (i < 0 || x.i >= i));
    if (start < 0) start = 0;
    letztesScrollen = 0; spielen(start);
  });
  document.addEventListener("keydown", e => {
    if (pos < 0 || !leiste || !leiste.classList.contains("da")) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    if (e.key === "k" || e.key === "K") { e.preventDefault(); umschalten(); }
  });

  /* ---------- Start und Sprachwechsel ---------- */
  function aufbauen() {
    if (!document.querySelector("#chapters > .chapter")) return;
    manifestLaden().then(() => { knoepfe(); if (pos >= 0) { listeBauen(); zeichnen(); } });
  }
  let uhr = 0;
  const beob = new MutationObserver(() => { clearTimeout(uhr); uhr = setTimeout(() => { if (!document.querySelector(".vl-knopf") || mSprache !== (de() ? "de" : "en")) { if (mSprache !== (de() ? "de" : "en")) stopp(true); aufbauen(); } }, 300); });
  const ch = document.getElementById("chapters"); if (ch) beob.observe(ch, { childList: true });
  new MutationObserver(() => { clearTimeout(uhr); uhr = setTimeout(aufbauen, 300); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("resize", () => { if (pos >= 0) untenAbstand(); });
  aufbauen();
  window.ImresVorlesen = { spielen: (kap, i) => { listeBauen(); const s = liste.findIndex(x => x.kap === String(kap) && x.i >= (i || 0)); spielen(s < 0 ? 0 : s); }, stopp: () => stopp(true), zustand: () => ({ pos, laenge: liste.length, spielt: !!(audio && !audio.paused) }) };
})();
