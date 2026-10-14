/* =====================================================================
   IMRES TALES – AM LAGERFEUER
   ---------------------------------------------------------------------
   Die Gruppe rastet am Feuer – im Wald, in einer Festung, in der Taverne
   oder in einer Höhle. Welche Szene erscheint, richtet sich nach dem Ort,
   an dem die Gruppe in der Geschichte gerade ist: der letzten Station der
   Reise (Feld „lager“ der Station in inhalt.js).
   Feste Szene erzwingen oder eigene Hintergrundbilder einsetzen:
   in inhalt.js unter „lagerfeuer“.
   ===================================================================== */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const ziel = $("lagerfeuer");
  if (!ziel) return;

  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SZENEN = ["wald", "festung", "taverne", "hoehle"];
  const TX = {
    de: {
      label: "Am Lagerfeuer", titel: "Die Gruppe rastet",
      zuletzt: ort => "Zuletzt gerastet: " + ort,
      namen: { wald: "Wald", festung: "Festung", taverne: "Taverne", hoehle: "Höhle" },
      wahl: "Szene wählen", aktuell: "aktueller Ort"
    },
    en: {
      label: "By the campfire", titel: "The party rests",
      zuletzt: ort => "Last camp: " + ort,
      namen: { wald: "Forest", festung: "Fortress", taverne: "Tavern", hoehle: "Cave" },
      wahl: "Choose a scene", aktuell: "current location"
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Wo ist die Gruppe gerade? ---------- */
  function ortJetzt() {
    const de = window.INHALT || {}, lokal = (sprache() === "en" ? window.INHALT_EN : window.INHALT) || de;
    const cfg = de.lagerfeuer || {};
    const karten = (de.reise && de.reise.karten) || [], kartenL = (lokal.reise && lokal.reise.karten) || karten;
    let letzte = null, name = "";
    karten.forEach((k, i) => (k.stationen || []).forEach((st, j) => {
      letzte = st;
      const l = kartenL[i] && kartenL[i].stationen && kartenL[i].stationen[j];
      name = (l && l.name) || st.name;
    }));
    let szene = cfg.szene || (letzte && letzte.lager) || "wald";
    if (!SZENEN.includes(szene)) szene = "wald";
    return { szene, name, bilder: cfg.hintergruende || {} };
  }

  /* ---------- Gemalte Hintergründe (SVG, 1600 × 900) ---------- */
  let saat = 7;
  const zz = () => { saat = (saat * 9301 + 49297) % 233280; return saat / 233280; };
  function sterne(n, hoehe) {
    let s = "";
    for (let i = 0; i < n; i++) s += '<circle class="lf-stern" cx="' + (zz() * 1600).toFixed(0) + '" cy="' + (zz() * hoehe).toFixed(0) + '" r="' + (zz() * 1.4 + .4).toFixed(1) + '" style="animation-delay:' + (-zz() * 5).toFixed(1) + 's"/>';
    return s;
  }
  function tannen(n, y, hMin, hMax, farbe, breite) {
    let s = '<g fill="' + farbe + '">';
    for (let i = 0; i < n; i++) {
      const x = (i + zz() * .8) * (1700 / n) - 50, h = hMin + zz() * (hMax - hMin), b = h * (breite || .36);
      let p = "M" + x + " " + (y - h);
      for (let k = 1; k <= 4; k++) { const yy = y - h + h * k / 4; const bb = b * k / 4; p += " L" + (x + bb) + " " + (yy - h * .05) + " L" + (x + bb * .45) + " " + (yy - h * .05); }
      p += " L" + (x + b * .1) + " " + y + " L" + (x - b * .1) + " " + y;
      for (let k = 4; k >= 1; k--) { const yy = y - h + h * k / 4; const bb = b * k / 4; p += " L" + (x - bb * .45) + " " + (yy - h * .05) + " L" + (x - bb) + " " + (yy - h * .05); }
      s += '<path d="' + p + ' Z"/>';
    }
    return s + "</g>";
  }
  const HIMMEL = '<defs><linearGradient id="lf-nacht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a18"/><stop offset=".6" stop-color="#141a30"/><stop offset="1" stop-color="#231a22"/></linearGradient>' +
    '<radialGradient id="lf-mond" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#e9edf8"/><stop offset=".62" stop-color="rgba(200,215,255,.35)"/><stop offset="1" stop-color="rgba(160,180,255,0)"/></radialGradient>' +
    '<radialGradient id="lf-boden" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="#3a2416"/><stop offset="1" stop-color="#0f0b0b"/></radialGradient></defs>';
  function bildWald() {
    saat = 11;
    return HIMMEL + '<rect width="1600" height="900" fill="url(#lf-nacht)"/>' + sterne(90, 420) +
      '<circle cx="1260" cy="150" r="90" fill="url(#lf-mond)"/>' +
      tannen(16, 560, 220, 340, "#141b26", .3) + tannen(12, 600, 260, 420, "#0e131b", .34) +
      '<rect y="560" width="1600" height="340" fill="url(#lf-boden)"/>' +
      tannen(7, 920, 520, 760, "#07090d", .32) +
      '<g fill="#0a0c0e">' + Array.from({ length: 40 }, (_, i) => { const x = i * 41 + zz() * 20; return '<path d="M' + x + ' 600 l6 -' + (12 + zz() * 18).toFixed(0) + ' l6 ' + (10 + zz() * 8).toFixed(0) + ' l5 -' + (8 + zz() * 14).toFixed(0) + ' l6 14 Z"/>'; }).join("") + "</g>";
  }
  function bildFestung() {
    saat = 23;
    let zinnen = "";
    for (let x = 0; x < 1600; x += 64) zinnen += '<rect x="' + x + '" y="228" width="38" height="40"/>';
    let steine = "";
    for (let y = 280; y < 600; y += 34) for (let x = (y / 34 % 2) * -40; x < 1600; x += 84) steine += '<rect x="' + x + '" y="' + y + '" width="80" height="30" rx="3"/>';
    let pflaster = "";
    for (let y = 610; y < 900; y += 30) for (let x = (y / 30 % 2) * -30; x < 1600; x += 64) pflaster += '<rect x="' + x + '" y="' + y + '" width="58" height="24" rx="8"/>';
    const fenster = [[180, 120], [260, 160], [1360, 110], [1430, 170], [720, 330], [880, 330]].map(([x, y], i) => '<rect class="lf-fenster" x="' + x + '" y="' + y + '" width="22" height="40" rx="11" style="animation-delay:' + (-i * .7) + 's"/>').join("");
    return HIMMEL + '<rect width="1600" height="900" fill="url(#lf-nacht)"/>' + sterne(60, 220) +
      '<g fill="#1a1820">' + zinnen + '<rect y="262" width="1600" height="350"/></g>' +
      '<g fill="#221f28" stroke="#15131a" stroke-width="2">' + steine + "</g>" +
      '<g fill="#17151c"><rect x="120" y="40" width="220" height="580"/><rect x="1300" y="30" width="220" height="590"/>' +
      '<path d="M110 40 L230 -40 L350 40 Z M1290 30 L1410 -50 L1530 30 Z"/></g>' +
      '<g class="lf-fenster-g" fill="#ffb347">' + fenster + "</g>" +
      '<path d="M690 610 L690 420 Q800 330 910 420 L910 610 Z" fill="#0b0a0e" stroke="#3a3440" stroke-width="10"/>' +
      '<g class="lf-banner"><path d="M470 300 h70 v170 l-35 -30 l-35 30 Z" fill="#7a1d16"/><path d="M1060 300 h70 v170 l-35 -30 l-35 30 Z" fill="#7a1d16"/>' +
      '<path d="M505 340 l12 22 h-24 Z M1095 340 l12 22 h-24 Z" fill="#e0a046"/></g>' +
      '<rect y="600" width="1600" height="300" fill="#141117"/><g fill="#1d1a21" stroke="#0e0c10" stroke-width="2">' + pflaster + "</g>" +
      '<rect y="600" width="1600" height="300" fill="url(#lf-boden)" opacity=".55"/>' +
      '<g class="lf-fackel"><rect x="610" y="440" width="10" height="50" fill="#3a2412"/><ellipse cx="615" cy="430" rx="10" ry="20" fill="#ffb347"/>' +
      '<rect x="980" y="440" width="10" height="50" fill="#3a2412"/><ellipse cx="985" cy="430" rx="10" ry="20" fill="#ffb347"/></g>';
  }
  function bildTaverne() {
    saat = 5;
    let bretter = "";
    for (let x = 0; x < 1600; x += 70) bretter += '<rect x="' + x + '" y="0" width="68" height="620" fill="' + (zz() < .5 ? "#2a1c13" : "#24180f") + '"/><line x1="' + (x + 69) + '" y1="0" x2="' + (x + 69) + '" y2="620" stroke="#120b07" stroke-width="3"/>';
    let dielen = "";
    for (let i = 0; i < 13; i++) { const x = -200 + i * 160; dielen += '<path d="M' + (800 + (x - 800) * .55) + ' 620 L' + (800 + (x - 800) * 2.1) + ' 900" stroke="#140d08" stroke-width="3"/>'; }
    const krug = (x, y, s) => '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><rect x="0" y="0" width="34" height="44" rx="4"/><path d="M34 10 q16 0 16 14 q0 14 -16 14" fill="none" stroke="#120b07" stroke-width="7"/></g>';
    const flasche = (x, y) => '<path d="M' + x + " " + y + " h18 v-34 q0 -10 -6 -14 v-16 h-6 v16 q-6 4 -6 14 Z" + '"/>';
    return '<defs><radialGradient id="lf-boden" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#4a2c18"/><stop offset="1" stop-color="#140d08"/></radialGradient>' +
      '<linearGradient id="lf-fenster-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1430"/><stop offset="1" stop-color="#223058"/></linearGradient></defs>' +
      bretter +
      '<g><rect x="1120" y="150" width="200" height="230" fill="url(#lf-fenster-n)"/><circle cx="1260" cy="210" r="26" fill="#e9edf8" opacity=".85"/>' +
      '<path d="M1120 265 h200 M1220 150 v230" stroke="#120b07" stroke-width="12"/><rect x="1112" y="142" width="216" height="246" fill="none" stroke="#3a2412" stroke-width="16"/></g>' +
      '<rect x="0" y="70" width="1600" height="46" fill="#1a110a"/><rect x="0" y="116" width="1600" height="8" fill="#0d0805"/>' +
      '<rect x="140" y="300" width="560" height="16" fill="#3a2412"/><g fill="#120b07">' + krug(170, 256, 1) + krug(230, 256, 1) + flasche(320, 300) + flasche(350, 300) + krug(400, 256, 1) + flasche(480, 300) + krug(540, 256, 1) + flasche(620, 300) + "</g>" +
      '<rect x="140" y="420" width="560" height="16" fill="#3a2412"/><g fill="#120b07">' + flasche(180, 420) + krug(230, 376, 1) + krug(290, 376, 1) + flasche(370, 420) + flasche(395, 420) + krug(460, 376, 1) + "</g>" +
      '<g class="lf-laterne"><line x1="980" y1="116" x2="980" y2="200" stroke="#120b07" stroke-width="4"/><rect x="960" y="200" width="40" height="56" rx="6" fill="#ffb347" stroke="#2a1c13" stroke-width="6"/></g>' +
      '<g fill="#0d0805"><rect x="1380" y="470" width="150" height="20" rx="4"/><rect x="1392" y="490" width="14" height="130"/><rect x="1500" y="490" width="14" height="130"/></g>' +
      '<rect y="620" width="1600" height="280" fill="url(#lf-boden)"/>' + dielen;
  }
  function bildHoehle() {
    saat = 3;
    let zapfen = "", kristalle = "", pilze = "";
    for (let i = 0; i < 26; i++) { const x = i * 64 + zz() * 30, l = 60 + zz() * 200, b = 20 + zz() * 30; zapfen += '<path d="M' + (x - b) + " 0 Q" + x + " " + (l * .4) + " " + x + " " + l + " Q" + x + " " + (l * .4) + " " + (x + b) + ' 0 Z"/>'; }
    for (let i = 0; i < 14; i++) { const x = zz() < .5 ? 20 + zz() * 300 : 1280 + zz() * 300, y = 380 + zz() * 260, h = 40 + zz() * 70, f = zz() < .5 ? "#6fe0ff" : "#b07bff"; kristalle += '<path class="lf-kristall" style="animation-delay:' + (-zz() * 4).toFixed(1) + 's" d="M' + x + " " + y + " l12 -" + h + " l12 " + h + ' Z" fill="' + f + '"/>'; }
    for (let i = 0; i < 12; i++) { const x = zz() * 1600, y = 600 + zz() * 40; pilze += '<g class="lf-pilz" style="animation-delay:' + (-zz() * 5).toFixed(1) + 's"><rect x="' + (x - 2) + '" y="' + (y - 14) + '" width="4" height="14" fill="#2a3a3a"/><ellipse cx="' + x + '" cy="' + (y - 14) + '" rx="11" ry="6" fill="#7fffd0"/></g>'; }
    return '<defs><radialGradient id="lf-hoehle" cx=".5" cy=".75" r=".9"><stop offset="0" stop-color="#3e2e30"/><stop offset=".55" stop-color="#1e1a24"/><stop offset="1" stop-color="#0a090e"/></radialGradient>' +
      '<radialGradient id="lf-boden" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="#352217"/><stop offset="1" stop-color="#0c0a0c"/></radialGradient></defs>' +
      '<rect width="1600" height="900" fill="url(#lf-hoehle)"/>' +
      '<path d="M0 0 H360 Q300 200 240 330 Q170 480 220 620 H0 Z M1600 0 H1260 Q1340 220 1380 360 Q1440 520 1380 620 H1600 Z" fill="#0b0a10"/>' +
      '<g fill="#0e0c13">' + zapfen + "</g>" +
      '<rect y="600" width="1600" height="300" fill="url(#lf-boden)"/>' +
      '<g fill="#0b0a0f"><path d="M80 640 l40 -150 l40 150 Z M1460 650 l30 -120 l30 120 Z M300 630 l24 -80 l24 80 Z"/></g>' +
      '<g class="lf-glimmer">' + kristalle + pilze + "</g>";
  }
  const BILD = { wald: bildWald, festung: bildFestung, taverne: bildTaverne, hoehle: bildHoehle };

  /* ---------- Die Gruppe ---------- */
  /* x/unten/h in Bühnenpunkten (1600 × 900), seite = von welcher Seite das Feuer scheint */
  const FIGUREN = [
    { id: "echo", bild: "lager-echo.webp", x: 105, unten: 0, h: 640, seite: "rechts", z: 1 },
    { id: "barradin", bild: "lager-barradin.webp", x: 770, unten: 160, h: 470, seite: "unten", z: 2 },
    { id: "rex", bild: "lager-rex.webp", x: 1030, unten: 230, h: 230, seite: "links", z: 3, huepft: true },
    { id: "friedrich", bild: "lager-friedrich.webp", x: 360, unten: 8, h: 450, seite: "rechts", z: 5 },
    { id: "ezekiel", bild: "lager-ezekiel.webp", x: 1080, unten: 6, h: 480, seite: "links", z: 5 }
  ];
  const FEUER = { x: 560, unten: 40, b: 480 };

  function bauen() {
    const T = t(), ort = ortJetzt();
    let szene = gewaehlt || ort.szene;
    const eigenesBild = ort.bilder && ort.bilder[szene];
    const helden = {};
    const D = (sprache() === "en" ? window.INHALT_EN : window.INHALT) || window.INHALT || {};
    (D.helden || []).forEach(h => { helden[h.id] = h.name; if (h.begleiter) helden[h.begleiter.id] = h.begleiter.name; });

    ziel.className = "lagerfeuer szene-" + szene;
    ziel.innerHTML =
      '<div class="wrap lf-kopf"><p class="label">' + esc(T.label) + "</p><h2>" + esc(T.titel) + "</h2>" +
        (ort.name ? '<p class="lf-ort">' + esc(T.zuletzt(ort.name)) + "</p>" : "") + "</div>" +
      '<div class="lf-rahmen"><div class="lf-buehne" aria-hidden="false">' +
        (eigenesBild ? '<img class="lf-hg" src="' + esc(eigenesBild) + '" alt="">' : '<svg class="lf-hg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + BILD[szene]() + "</svg>") +
        '<div class="lf-schein"></div>' +
        FIGUREN.map(f =>
          '<a class="lf-figur f-' + f.id + " licht-" + f.seite + (f.huepft ? " huepft" : "") + '" href="#' + f.id + '" title="' + esc(helden[f.id] || f.id) + '" ' +
            'style="left:' + f.x + "px;bottom:" + f.unten + "px;height:" + f.h + "px;z-index:" + f.z + ";--maske:url(" + f.bild + ')">' +
            '<img src="' + f.bild + '" alt="' + esc(helden[f.id] || f.id) + '"><span class="lf-licht"></span></a>').join("") +
        '<div class="lf-feuer" style="left:' + FEUER.x + "px;bottom:" + FEUER.unten + "px;width:" + FEUER.b + 'px">' +
          '<img src="lager-feuer.webp" alt="">' +
          '<span class="lf-flamme a"></span><span class="lf-flamme b"></span><span class="lf-flamme c"></span><span class="lf-flamme d"></span>' +
        "</div>" +
        '<canvas class="lf-funken" width="1600" height="900"></canvas>' +
        '<div class="lf-vignette"></div>' +
      "</div></div>" +
      '<div class="wrap lf-wahl" role="group" aria-label="' + esc(T.wahl) + '">' +
        SZENEN.map(s => '<button type="button" data-szene="' + s + '" aria-pressed="' + (s === szene) + '">' + esc(T.namen[s]) + (s === ort.szene ? " <small>· " + esc(T.aktuell) + "</small>" : "") + "</button>").join("") +
      "</div>";
    skalieren();
    funkenStarten();
  }

  /* Die Bühne ist 1600 × 900 groß und wird passend skaliert.
     Schmale Bildschirme schneiden die Ränder ab, die Gruppe bleibt in der Mitte. */
  function skalieren() {
    const r = ziel.querySelector(".lf-rahmen"), b = ziel.querySelector(".lf-buehne");
    if (!r || !b) return;
    const W = r.clientWidth, H = r.clientHeight;
    /* Die ganze Gruppe (x ≈ 100–1480) soll immer sichtbar bleiben */
    const s = Math.min(Math.max(W / 1600, H / 900), W / 1380);
    b.style.transform = "translate(" + ((W - 1600 * s) / 2) + "px, " + (H - 900 * s) + "px) scale(" + s + ")";
  }
  window.addEventListener("resize", () => { clearTimeout(skalieren.t); skalieren.t = setTimeout(skalieren, 60); });

  /* ---------- Funken ---------- */
  let funkenLauf = 0;
  function funkenStarten() {
    const cv = ziel.querySelector(".lf-funken");
    if (!cv || ruhig) return;
    const ctx = cv.getContext("2d"), lauf = ++funkenLauf;
    const fx = FEUER.x + FEUER.b / 2, fy = 900 - FEUER.unten - FEUER.b * .45;
    const neu = () => ({ x: fx + (Math.random() - .5) * 140, y: fy + Math.random() * 40, vx: (Math.random() - .5) * 30, vy: -60 - Math.random() * 110, t: 0, d: 1.2 + Math.random() * 2, r: .8 + Math.random() * 2.2, p: Math.random() * 6 });
    const f = Array.from({ length: 46 }, () => { const n = neu(); n.t = Math.random() * n.d; return n; });
    let alt = performance.now(), sichtbar = true;
    if (window.IntersectionObserver) new IntersectionObserver(e => { sichtbar = e[0].isIntersecting; }).observe(cv);
    (function bild(jetzt) {
      if (lauf !== funkenLauf || !cv.isConnected) return;
      const dt = Math.min(.05, (jetzt - alt) / 1000); alt = jetzt;
      if (sichtbar && !document.hidden) {
        ctx.clearRect(0, 0, 1600, 900);
        ctx.globalCompositeOperation = "lighter";
        for (const s of f) {
          s.t += dt; if (s.t > s.d) Object.assign(s, neu());
          s.x += (s.vx + Math.sin(jetzt / 300 + s.p) * 25) * dt; s.y += s.vy * dt;
          const a = Math.max(0, 1 - s.t / s.d);
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
          g.addColorStop(0, "rgba(255,230,160," + a + ")"); g.addColorStop(.4, "rgba(255,150,50," + a * .7 + ")"); g.addColorStop(1, "rgba(255,90,20,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, 7); ctx.fill();
        }
      }
      requestAnimationFrame(bild);
    })(alt);
  }

  /* ---------- Szenenwahl ---------- */
  let gewaehlt = null;
  ziel.addEventListener("click", e => {
    const b = e.target.closest("[data-szene]");
    if (!b) return;
    gewaehlt = b.dataset.szene === ortJetzt().szene ? null : b.dataset.szene;
    bauen();
  });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.lagerfeuer { padding-block: clamp(2rem, 5vw, 3.5rem) 0; }
.lf-kopf { display: grid; gap: .3rem; margin-bottom: 1.2rem; }
.lf-kopf h2 { font-family: var(--display); font-weight: 400; font-size: clamp(2rem, 5.5vw, 3.2rem); line-height: 1; }
.lf-ort { color: var(--ash); font-style: italic; }
.lf-rahmen { position: relative; height: clamp(250px, 62vw, 720px); overflow: hidden; background: #08070b;
  border-block: 1px solid var(--line); }
.lf-buehne { position: absolute; left: 0; top: 0; width: 1600px; height: 900px; transform-origin: 0 0; }
.lf-hg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.lf-schein { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen;
  background: radial-gradient(ellipse 620px 420px at 800px 720px, rgba(255,150,60,.42), rgba(255,110,40,.12) 55%, transparent 75%);
  animation: lfatmen 2.4s ease-in-out infinite; }
.szene-hoehle .lf-schein, .szene-festung .lf-schein { background: radial-gradient(ellipse 680px 460px at 800px 720px, rgba(255,150,60,.5), rgba(255,110,40,.14) 55%, transparent 78%); }
@keyframes lfatmen { 0%, 100% { opacity: .85 } 23% { opacity: 1 } 41% { opacity: .78 } 63% { opacity: .95 } 82% { opacity: .82 } }
.lf-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 85% 80% at 50% 62%, transparent 55%, rgba(4,3,6,.75)); }
.lf-stern { fill: #e8ecff; animation: lfstern 4s ease-in-out infinite; }
@keyframes lfstern { 50% { opacity: .3 } }
.lf-fenster, .lf-fackel ellipse, .lf-laterne rect { animation: lfflacker 1.7s ease-in-out infinite; }
@keyframes lfflacker { 0%, 100% { opacity: 1 } 30% { opacity: .7 } 55% { opacity: .95 } 75% { opacity: .75 } }
.lf-kristall, .lf-pilz { animation: lfglimmen 4.5s ease-in-out infinite; }
@keyframes lfglimmen { 50% { opacity: .45 } }
.lf-glimmer { filter: drop-shadow(0 0 6px rgba(120,230,255,.7)); }
.lf-banner { transform-origin: 800px 300px; }

.lf-figur { position: absolute; display: block; text-decoration: none; transform-origin: 50% 100%; }
.lf-figur img { height: 100%; width: auto; display: block; filter: brightness(.82) saturate(.9) contrast(1.05) drop-shadow(0 10px 18px rgba(0,0,0,.55)); transition: filter .4s; }
.lf-figur:hover img, .lf-figur:focus-visible img { filter: brightness(1.05) saturate(1) drop-shadow(0 0 16px rgba(255,170,80,.6)); }
.lf-licht { position: absolute; inset: 0; pointer-events: none; -webkit-mask: var(--maske) center / contain no-repeat; mask: var(--maske) center / contain no-repeat;
  mix-blend-mode: overlay; opacity: .9; animation: lfschein 1.9s ease-in-out infinite; }
.licht-rechts .lf-licht { background: linear-gradient(90deg, rgba(20,25,60,.75) 0%, rgba(20,25,60,.2) 35%, rgba(255,150,50,.55) 75%, rgba(255,190,90,.9) 100%); }
.licht-links .lf-licht { background: linear-gradient(270deg, rgba(20,25,60,.75) 0%, rgba(20,25,60,.2) 35%, rgba(255,150,50,.55) 75%, rgba(255,190,90,.9) 100%); }
.licht-unten .lf-licht { background: linear-gradient(0deg, rgba(255,190,90,.95) 0%, rgba(255,150,50,.6) 35%, rgba(20,25,60,.45) 100%); }
.f-friedrich .lf-licht { animation-delay: -.4s; } .f-ezekiel .lf-licht { animation-delay: -1.1s; } .f-echo .lf-licht { animation-delay: -.7s; } .f-rex .lf-licht { animation-delay: -1.5s; }
@keyframes lfschein { 0%, 100% { opacity: .9 } 18% { opacity: 1 } 37% { opacity: .72 } 52% { opacity: .95 } 71% { opacity: .78 } 88% { opacity: 1 } }
.f-rex.huepft { animation: lfhuepf 2.8s cubic-bezier(.4,0,.6,1) infinite; }
@keyframes lfhuepf { 0%, 100% { transform: translateY(0) rotate(0) } 18% { transform: translateY(20px) rotate(3deg) } 45% { transform: translateY(-70px) rotate(-6deg) } 70% { transform: translateY(8px) rotate(2deg) } }
.f-barradin { animation: lfsingen 3.2s ease-in-out infinite; }
@keyframes lfsingen { 0%, 100% { transform: rotate(0) } 25% { transform: rotate(-1.6deg) translateY(-4px) } 75% { transform: rotate(1.4deg) } }
.f-echo { animation: lfatmen2 5s ease-in-out infinite; }
@keyframes lfatmen2 { 50% { transform: translateY(-4px) } }

.lf-feuer { position: absolute; z-index: 4; pointer-events: none; }
.lf-feuer img { width: 100%; display: block; animation: lffeuerbild 1.3s ease-in-out infinite; transform-origin: 50% 100%; }
@keyframes lffeuerbild { 0%, 100% { filter: brightness(1) } 30% { filter: brightness(1.12) saturate(1.1) } 60% { filter: brightness(.94) } }
.lf-flamme { position: absolute; left: 50%; bottom: 30%; transform-origin: 50% 100%; mix-blend-mode: screen; filter: blur(5px);
  border-radius: 50% 50% 20% 20% / 65% 65% 35% 35%; }
.lf-flamme.a { width: 46%; height: 70%; margin-left: -23%; background: radial-gradient(ellipse at 50% 85%, rgba(255,170,60,.85), rgba(240,80,20,.5) 50%, transparent 72%); animation: lfflamme1 .9s ease-in-out infinite alternate; }
.lf-flamme.b { width: 30%; height: 58%; margin-left: -19%; background: radial-gradient(ellipse at 50% 85%, rgba(255,220,130,.8), rgba(255,130,40,.4) 55%, transparent 74%); animation: lfflamme2 .7s ease-in-out infinite alternate; }
.lf-flamme.c { width: 26%; height: 50%; margin-left: -4%; background: radial-gradient(ellipse at 50% 85%, rgba(255,210,110,.75), rgba(255,120,40,.35) 55%, transparent 74%); animation: lfflamme1 .6s ease-in-out infinite alternate-reverse; }
.lf-flamme.d { width: 16%; height: 30%; margin-left: -8%; bottom: 32%; filter: blur(3px); background: radial-gradient(ellipse at 50% 80%, rgba(255,255,230,.95), rgba(255,220,130,.5) 60%, transparent 76%); animation: lfflamme2 .45s ease-in-out infinite alternate; }
@keyframes lfflamme1 { from { transform: scale(1, 1) skewX(-4deg); } to { transform: scale(.9, 1.14) skewX(5deg); } }
@keyframes lfflamme2 { from { transform: scale(.94, 1.06) skewX(6deg); } to { transform: scale(1.06, .9) skewX(-5deg); } }
.lf-funken { position: absolute; inset: 0; width: 1600px; height: 900px; z-index: 6; pointer-events: none; }
.lf-vignette { z-index: 7; }

.lf-wahl { display: flex; flex-wrap: wrap; gap: .4rem; padding-block: 1rem 0; }
.lf-wahl button { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .85rem; padding: .3rem .8rem; cursor: pointer; border-radius: 999px; }
.lf-wahl button small { font-size: .78em; opacity: .8; }
.lf-wahl button[aria-pressed="true"] { border-color: var(--ember); color: var(--night); background: var(--ember); }
@media (prefers-reduced-motion: reduce) {
  .lagerfeuer *, .lagerfeuer *::after { animation: none !important; }
}
`;
  document.head.appendChild(css);

  bauen();
  let letzte = sprache();
  new MutationObserver(() => { if (sprache() !== letzte) { letzte = sprache(); bauen(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Sobald die Startseite sichtbar wird, neu vermessen */
  window.addEventListener("popstate", () => setTimeout(skalieren, 50));
  document.addEventListener("click", () => setTimeout(skalieren, 80));
})();
