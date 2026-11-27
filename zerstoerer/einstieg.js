/* Ezekiel – The Destroyer · W38 Einstieg (einstieg.js) – sanftere Dosierung für neue Spieler
   Befund (Erstspieler-Durchlauf, leerer Spielstand, Desktop + Handy 412×860): In den ersten Sekunden im Torhof kamen
   Herausforderungstafel, „Nundro hat dir … zugeworfen“, mehrere „Neu im Fundbuch“, Paarung, Erfolg, Händlerin und das
   Schriftrollen-Fenster fast gleichzeitig. Nach dem ersten Tod folgten zwei große Statistik-Fenster mit denselben Zahlen.
   1) Fundbuch-Meldungen bündeln: neue Funde eines Gebiets laufen in EINER Meldung zusammen („Neu im Fundbuch: A · B +2“),
      die Erklärzeile (Nundro schärft) nur beim ersten Fund im Gebiet.
   2) Erster Lauf: im Torhof noch keine Herausforderungen (bilanz.js) – erst bewegen, kämpfen, Tür finden.
      Ab dem zweiten Lauf wie bisher.
   3) Todesfenster: Folgt der Lauf-Rückblick (rueckblick.js, nicht abgeschaltet), steht im Todesfenster nur Kopf, Nemesis
      und Spruch; die Wertekacheln sind hinter „Alle Werte ▸“ eingeklappt (der Rückblick zeigt Dauer, Kills, Schaden, Gold,
      Todesursache). Wer aufklappt, bekommt es künftig gleich offen (Z.settings.w38werte).
   4) Neue Inhalte von W38 Abwechslung (Gebietslagen, Sonnenstein) erst ab dem zweiten Lauf (abwechslung.js liest
      Z.einstieg.neu()).
   4b) Startfenster: Pakte im 1./2. Lauf eingeklappt, Umhang-Abschnitt nur ab zwei Umhängen.
   5) Meldungen weichen Minimap/Ton-/Karten-/Pause-Knöpfen aus (Handy hochkant, HUD 140 %).
   Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.einstieg) return;
  const L = v => Z.L(v);
  const runs = () => (Z.meta && +Z.meta.runs) || 0;
  /* „neu“ = erster Lauf läuft oder noch keiner beendet */
  const neu = () => runs() <= 1;

  /* ---------- 1) Fundbuch bündeln ---------- */
  const FUND = /^<b>(Neu im Fundbuch: |New in the ledger: )/;
  let fund = { lv: null, names: [] };
  function wrapNotify() {
    const ui = Z.ui; if (!ui || !ui.notify) return setTimeout(wrapNotify, 60);
    if (ui.notify._w38) return;
    const n0 = ui.notify;
    ui.notify = function (text, o) {
      try {
        if (typeof text === "string" && FUND.test(text)) {
          const nm = text.replace(FUND, "").split("</b>")[0];
          if (fund.lv !== Z.level) fund = { lv: Z.level, names: [] };
          if (!fund.names.includes(nm)) fund.names.push(nm);
          const N = fund.names.length, show = fund.names.slice(-2), more = N - show.length;
          text = "<b>" + L(["Neu im Fundbuch: ", "New in the ledger: "]) + show.join(" · ") + (more > 0 ? " +" + more : "") + "</b>" +
            (N === 1 ? "<br><small>" + L(["Nundro kann sie ab jetzt im Lager schärfen.", "Nundro can now sharpen it in camp."]) + "</small>" : "");
          o = Object.assign({}, o, { key: "w38fund" });
        }
      } catch (e) { console.error("W38 Einstieg", e); }
      return n0.call(this, text, o);
    };
    ui.notify._w38 = true;
  }
  wrapNotify();

  /* ---------- 2) Erster Lauf: keine Herausforderungen im Torhof ---------- */
  if (Z.chStart) {
    const cs0 = Z.chStart;
    Z.chStart = function (lv) {
      if (lv && lv.id === "torhof" && neu() && !(Z.run && (Z.run.w38tag || Z.run.rausch))) { if (Z.chClear) Z.chClear(); return; }
      return cs0.apply(this, arguments);
    };
  }

  /* ---------- 3) Todesfenster schlanker, wenn der Rückblick folgt ---------- */
  function wrapDeath() {
    const ui = Z.ui; if (!ui || !ui.deathScreen || !ui.actions) return setTimeout(wrapDeath, 60);
    if (ui.deathScreen._w38) return;
    const d0 = ui.deathScreen;
    ui.deathScreen = function (o) {
      const r = d0.apply(this, arguments);
      try {
        const rb = !(Z.settings && Z.settings.rueckblick === false) && !(Z.bossrausch && Z.bossrausch.aktiv && Z.bossrausch.aktiv());
        const m = document.getElementById("modal"), grid = m && m.querySelector(".bilanz");
        if (rb && grid && !(Z.settings && Z.settings.w38werte) && !m.querySelector(".w38-werte")) {
          grid.classList.add("w38-zu");
          const b = document.createElement("button"); b.className = "w38-werte"; b.type = "button";
          b.textContent = L(["Alle Werte ▸", "All stats ▸"]);
          b.addEventListener("click", () => { grid.classList.remove("w38-zu"); b.remove(); try { Z.settings.w38werte = true; Z.saveSettings && Z.saveSettings(); } catch (_) {} });
          grid.parentNode.insertBefore(b, grid);
        }
      } catch (e) { console.error("W38 Einstieg", e); }
      return r;
    };
    ui.deathScreen._w38 = true;
  }
  wrapDeath();

  /* ---------- 4b) Startfenster „Die Feste betreten“ für Neulinge schlanker ----------
     In den ersten beiden Läufen (Z.meta.runs < 2) und solange kein Pakt gewählt ist: die acht Pakte (Erschwernisse für Erfahrene)
     eingeklappt hinter „Pakte – für Erfahrene ▸“; der Umhang-Abschnitt entfällt, solange es nur einen Umhang gibt. */
  let paktOffen = false;
  function wrapOpen() {
    const ui = Z.ui; if (!ui || !ui.open) return setTimeout(wrapOpen, 60);
    if (ui.open._w38) return;
    const o0 = ui.open;
    ui.open = function (html) {
      const r = o0.apply(this, arguments);
      try {
        if (typeof html === "string" && html.indexOf('data-act="abGo"') >= 0) {
          const m = document.getElementById("modal");
          const capes = m && m.querySelector(".umhaenge");
          if (capes && capes.children.length <= 1) { const h = capes.previousElementSibling; if (h && h.tagName === "H3") h.style.display = "none"; capes.style.display = "none"; }
          const pk = m && m.querySelector(".wahlen.pakte"), any = pk && pk.querySelector(".an, .aktiv, [aria-pressed=true], .sel");
          if (pk && runs() < 2 && !paktOffen && !any && !/aktiv:|active:/.test((pk.previousElementSibling || {}).textContent || "")) {
            const h = pk.previousElementSibling; if (h && h.tagName === "H3") h.style.display = "none";
            pk.style.display = "none";
            const b = document.createElement("button"); b.type = "button"; b.className = "w38-pakte";
            b.textContent = L(["Pakte – für Erfahrene ▸", "Pacts – for veterans ▸"]);
            b.addEventListener("click", () => { paktOffen = true; if (h) h.style.display = ""; pk.style.display = ""; b.remove(); const f = pk.querySelector("button"); if (f) f.focus(); });
            pk.parentNode.insertBefore(b, pk);
          }
        }
      } catch (e) { console.error("W38 Einstieg", e); }
      return r;
    };
    ui.open._w38 = true;
  }
  wrapOpen();

  /* ---------- 5) Meldungen weichen Minimap und Knöpfen aus (Handy hochkant, große HUD-Skalierung) ----------
     Befund meldrect.py: hochkant 360–412 px lagen die Meldungen über Minimap, Ton- und Kartenknopf (bei HUD 140 % auch quer/Tablet).
     Liegt der mittige Kasten über einem Hindernis, rückt er nach links unter die Lebensleiste (so breit wie frei) –
     ist dort zu wenig Platz, unter alle Hindernisse. Sonst bleibt alles wie gehabt (keine Inline-Stile). */
  const OBST = ["#hud .hl", "#hud .hr", "#t-map", "#t-pause"];
  let mEl = null, lastSig = "";
  function rectOf(e) { if (!e) return null; const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return null; const cs = getComputedStyle(e); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.05) return null; return r; }
  function layoutNotes() {
    mEl = mEl || document.getElementById("meldungen"); if (!mEl) return;
    const body = document.body;
    const clear = () => { if (mEl.classList.contains("w38-links") || mEl.style.left) { mEl.classList.remove("w38-links"); mEl.style.left = mEl.style.top = mEl.style.width = ""; } lastSig = ""; };
    if (!Z.level || body.classList.contains("bossplatte") || body.classList.contains("bosskampf")) return clear();
    const hud = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hud")) || 1;
    const W = window.innerWidth, obs = OBST.map(q => rectOf(document.querySelector(q))).filter(Boolean);
    const hl = rectOf(document.querySelector("#hud .hl")), right = obs.filter(r => r !== hl && r.left > W * 0.45);
    /* mittiger Standardkasten: Breite min(480, 92vw) bzw. handheld; oben laut CSS – nachgebildet über die tatsächliche Breite */
    const sig = [W, window.innerHeight, hud, obs.map(r => Math.round(r.left) + "," + Math.round(r.bottom)).join(";")].join("|");
    if (sig === lastSig) return; lastSig = sig;
    mEl.classList.remove("w38-links"); mEl.style.left = mEl.style.top = mEl.style.width = "";
    const m = mEl.getBoundingClientRect(), top = m.top, wBox = Math.max(m.width, 260 * hud), l0 = (W - wBox) / 2, r0 = l0 + wBox, b0 = top + 130 * hud;
    const hits = obs.some(r => r.left < r0 && r.right > l0 && r.top < b0 && r.bottom > top);
    if (!hits) return;
    /* erst versuchen: mittig bleiben, nur unter die Lebensleiste rücken */
    if (hl) { const t1 = hl.bottom + 6, b1 = t1 + 130 * hud; if (!obs.some(r => r !== hl && r.left < r0 && r.right > l0 && r.top < b1 && r.bottom > t1) && !(hl.left < r0 && hl.right > l0 && hl.bottom > t1)) { mEl.style.top = t1 / hud + "px"; return; } }
    const sx = 8, rightEdge = right.length ? Math.min(...right.filter(r => r.top < (hl ? hl.bottom : 60) + 140 * hud).map(r => r.left).concat([W])) - 8 : W - 8;
    const free = rightEdge - sx, top2 = (hl ? hl.bottom : 50) + 6;
    mEl.classList.add("w38-links");
    if (free >= 220 * hud) { mEl.style.left = sx / hud + "px"; mEl.style.top = top2 / hud + "px"; mEl.style.width = free / hud + "px"; }
    else { const low = Math.max(...obs.filter(r => r.top < window.innerHeight * 0.4).map(r => r.bottom)) + 6; mEl.style.left = sx / hud + "px"; mEl.style.top = low / hud + "px"; mEl.style.width = (W - 2 * sx) / hud + "px"; }
  }
  window.addEventListener("resize", () => { lastSig = ""; setTimeout(layoutNotes, 120); });
  setInterval(() => { try { layoutNotes(); } catch (e) { } }, 700);

  const css = document.createElement("style");
  css.textContent = [
    "#modal .bilanz.w38-zu{display:none}",
    "html #meldungen.w38-links{transform:none;align-items:flex-start}body.kampfnah #meldungen.w38-links{transform:scale(.82);transform-origin:0 0}",
    "#modal .w38-werte{display:block;margin:6px auto 10px;background:transparent;border:1px solid rgba(229,180,84,.45);border-radius:14px;color:#e8d8b8;padding:3px 14px;font:inherit;font-size:var(--fs-s,13px);cursor:pointer}",
    "#modal .w38-pakte{display:block;margin:10px 0 4px;background:transparent;border:1px dashed rgba(229,180,84,.4);border-radius:6px;color:#c8b090;padding:6px 12px;font:inherit;font-size:var(--fs-s,13px);cursor:pointer;width:100%;text-align:left}",
    "#modal .w38-pakte:hover,#modal .w38-pakte:focus{border-color:var(--gold,#e5b454);color:#ffd27a}",
    "#modal .w38-werte:hover,#modal .w38-werte:focus{border-color:var(--gold,#e5b454);color:#ffd27a}"
  ].join("\n");
  document.head.appendChild(css);

  Z.einstieg = { neu, fund: () => fund.names.slice() };
})();
