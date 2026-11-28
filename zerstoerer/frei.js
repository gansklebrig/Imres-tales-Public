/* Ezekiel – The Destroyer · W38 Frei: drei Schwächen aus einem kritischen Probelauf (frei.js)
   1) Boss-Auftritt auf kleinen Bildschirmen: das große Namensband (#banner, 30 % Höhe) lag auf der Boss-Lebensleiste
      (#bossbar) – Handy quer und Handheld. Liegt das Band über der Leiste, rückt es knapp darunter (nur so weit wie nötig,
      nie aus dem Bild); sonst bleibt alles wie gehabt.
   2) „Verfehlt: …“: Herausforderungen melden ein Scheitern nur noch auf der Tafel (bilanz.js fail(): rotes Aufflackern des
      durchgestrichenen Ziels); hier nur das Aussehen dazu.
   3) Schwebetext-Gedränge: Im Kampf standen bis zu sechs große Zurufe gleichzeitig („Durchschaut!“, „Unterbrochen!“,
      „Adrenalin! +25 %“, Boss-Hinweise …). Höchstens drei große Zurufe zugleich (Handheld/Stufe 0: zwei); kommt ein neuer,
      tritt der unwichtigste ältere zurück (Boss-/Lernhinweise zuletzt). Schadenszahlen, Heilung und „!“ bleiben unberührt.
   Kein Blau. 4) (Folgeauftrag) Türschilder (bild.js) weichen am Handy den Touch-Knöpfen aus, mit feiner Linie zur Tür; Seelenfunken
      (effekte.js) als rosé Funkenspur statt orangem Band.
   Schalter Z.gfx.off.w38frei. Prüfhilfe Z.frei.dbg(). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.frei) return;
  const off = () => !!(Z.gfx && Z.gfx.off && Z.gfx.off.w38frei);
  const errN = {};
  const safe = (fn, tag) => function () { try { return fn.apply(this, arguments); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W38 Frei", tag, e); } } };

  /* ---------- 1) Namensband unter die Boss-Leiste ---------- */
  let shift = 0, bandT = 0;
  let shiftX = 0;
  function band() {
    const bn = document.getElementById("banner"), bb = document.getElementById("bossbar");
    if (!bn) return;
    const shown = !bn.hidden && (bn.classList.contains("an") || +getComputedStyle(bn).opacity > 0.02); /* auch beim Ausblenden nicht zurückspringen */
    const vis = el => { if (!el || el.hidden) return false; const r = el.getBoundingClientRect(); if (!(r.height > 0 && r.width > 0)) return false; const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05; }; /* fest positionierte Elemente haben kein offsetParent */
    const hf = document.getElementById("hfzeile");
    const kh = document.getElementById("koop-hl"), gc = document.getElementById("w38gch");
    const hoch = innerHeight > innerWidth;
    const ecke = [document.getElementById("t-map"), document.getElementById("t-pause")].filter(vis); /* W38 QA: Karten-/Pause-Knopf (Touch) */
    /* senkrecht ausweichen: Boss-Leiste, Herausforderungstafel, P2-Kasten (W38 Frei 4), Gast-Ziele; hochkant auch die Eckknöpfe */
    const obs = [vis(bb) ? bb : null, hf && hf.classList.contains("an") && vis(hf) ? hf : null, vis(kh) ? kh : null, gc && !gc.hidden && vis(gc) ? gc : null].concat(hoch ? ecke : []).filter(Boolean);
    if (!vis(bb)) for (const m of document.querySelectorAll("#meldungen .meldung")) if (vis(m) && m.getBoundingClientRect().top < innerHeight * 0.45) obs.push(m); /* W38 QA: Meldungen beim Betreten (Lager) – Band darunter; mit Boss-Leiste regelt noten() die Reihenfolge */
    const reset = () => { if (shift || shiftX) { bn.style.transform = ""; shift = 0; shiftX = 0; } };
    if (off() || !shown || (!obs.length && (hoch || !ecke.length))) return reset();
    const r0 = bn.getBoundingClientRect();
    const k = r0.height / Math.max(1, bn.offsetHeight) || 1; /* CSS-zoom des Bandes */
    const top0 = r0.top - shift * k, left0 = r0.left - shiftX * k; /* Lage ohne eigene Verschiebung */
    let need = 0, needX = 0;
    for (const el of obs) { const b = el.getBoundingClientRect(); if (b.left < left0 + r0.width && b.right > left0 && b.top < top0 + r0.height && b.bottom > top0) need = Math.max(need, b.bottom + 6 - top0); }
    if (!hoch) for (const el of ecke) { /* quer: seitlich an den Eckknöpfen vorbei (Linkshänder: Knöpfe links) */
      const b = el.getBoundingClientRect(); if (!(b.left < left0 + r0.width && b.right > left0 && b.top < top0 + r0.height && b.bottom > top0)) continue;
      if (b.left + b.width / 2 < innerWidth / 2) needX = Math.max(needX, b.right + 6 - left0); else needX = Math.min(needX, b.left - 6 - (left0 + r0.width));
    }
    if (need <= 0 && !needX) return reset();
    need = Math.min(Math.max(0, need), Math.max(0, innerHeight - 8 - (top0 + r0.height))); /* nicht aus dem Bild */
    const sy = Math.round(need / k), sx = Math.round(needX / k);
    if (Math.abs(sy - shift) > 1 || Math.abs(sx - shiftX) > 1) { shift = sy; shiftX = sx; bn.style.transform = "translate(calc(-50% + " + sx + "px), calc(-50% + " + sy + "px))"; }
  }
  /* Meldungen während des Boss-Auftritts (vor „bosskampf“) lagen ebenfalls auf der Leiste: knapp darunter setzen */
  function noten() {
    const m = document.getElementById("meldungen"), bb = document.getElementById("bossbar"); if (!m) return;
    const barOn = !off() && bb && !bb.hidden && bb.offsetParent !== null && bb.getBoundingClientRect().height > 0;
    /* W38 Frei: Herausforderungstafel (#hfzeile) als Hindernis – im Bosskampf (Meldungen bei 150 px) lag auf Handheld/Handy quer
       eine Meldung auf der Tafel (37–127 px, gemessen beim Tod). Nur wenn eine Meldung die Tafel waagrecht trifft. */
    const top0 = m.dataset.w38f ? +m.dataset.w38f0 : m.getBoundingClientRect().top;
    const boss = !off() && document.body.classList.contains("bosskampf");
    if ((!barOn && !boss) || m.style.left) { if (m.dataset.w38f && !m.style.left) { m.style.top = ""; delete m.dataset.w38f; } return; } /* sonst ordnet einstieg.js (layoutNotes) die Meldungen */
    const hud = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hud")) || 1;
    let y = top0;
    if (barOn) { /* liegt das Namensband (noch sichtbar) im Weg, auch darunter */
      let lim = bb.getBoundingClientRect().bottom;
      const bn = document.getElementById("banner");
      if (bn && !bn.hidden && +getComputedStyle(bn).opacity > 0.12) { const r = bn.getBoundingClientRect(); if (r.height > 0 && r.bottom < innerHeight * 0.6) lim = Math.max(lim, r.bottom); }
      if (top0 < lim + 4) y = lim + 6;
    }
    if (boss) { /* Herausforderungstafel, hochkant Karten-/Pause-Knopf: beim Tod auf Handheld/Handy quer lag eine Meldung auf der Tafel (37–127 px);
                   wiederholt prüfen, damit der Stapel nach dem Ausweichen nicht ins nächste Hindernis rutscht */
      const hf = document.getElementById("hfzeile"), mt = m.getBoundingClientRect().top;
      const R = [hf && hf.classList.contains("an") ? hf : null, document.getElementById("t-map"), document.getElementById("t-pause")].filter(Boolean).map(el => {
        const h = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return h.height > 0 && h.width > 0 && cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05 && h.bottom < innerHeight * 0.6 ? h : null; }).filter(Boolean);
      const M = Array.from(m.querySelectorAll(".meldung")).map(e => e.getBoundingClientRect()).filter(r => r.width > 2).map(r => [r.left, r.right, r.top - mt, r.bottom - mt]);
      for (let it = 0; it < 4; it++) { let ch = false;
        for (const h of R) if (h.bottom + 6 > y && M.some(q => q[0] < h.right - 4 && q[1] > h.left + 4 && y + q[2] < h.bottom && y + q[3] > h.top + 4)) { y = h.bottom + 6; ch = true; }
        if (!ch) break; }
    }
    if (y <= top0 + 1) { if (m.dataset.w38f) { m.style.top = ""; delete m.dataset.w38f; } return; }
    if (!m.dataset.w38f) { m.dataset.w38f = "1"; m.dataset.w38f0 = String(top0); }
    const nt = Math.round(y / hud) + "px"; if (m.style.top !== nt) m.style.top = nt;
  }
  const notenS = safe(noten, "noten");
  /* W38 QA: Handy hochkant – Boss-Leiste ragte 24 px in die Minikarte: rechten Rand um die Überdeckung einrücken */
  let bbFix = 0;
  function bossKarte() {
    const bb = document.getElementById("bossbar"), mm = document.getElementById("minimap"); if (!bb || !mm) return;
    if (bb.hidden || off()) { if (bbFix) { bb.style.right = ""; bbFix = 0; } return; }
    const a = bb.getBoundingClientRect(), m = mm.getBoundingClientRect(); if (!(a.width > 0 && m.width > 0)) return;
    const ov = Math.min(a.right, m.right) - Math.max(a.left, m.left), vy = Math.min(a.bottom, m.bottom) - Math.max(a.top, m.top);
    if (ov > 1 && vy > 1) {
      const hud = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hud")) || 1;
      const cur = parseFloat(getComputedStyle(bb).right) || 0; bb.style.right = Math.round((cur + ov + 6) / hud) + "px"; bbFix = 1;
      if (getComputedStyle(bb).transform !== "none") { bb.style.left = Math.round(Math.max(8, a.left) / hud) + "px"; bb.style.transform = "none"; bb.style.width = "auto"; }
    }
  }
  const bossKarteS = safe(bossKarte, "bosskarte");
  const bandS0 = safe(band, "band"), bandS = () => { bandS0(); notenS(); bossKarteS(); };
  (function loop() { requestAnimationFrame(loop); const now = performance.now(); if (now - bandT > 120) { bandT = now; bandS(); } })();

  /* ---------- 5) Handy hochkant: Ezekiel nicht hinter Schnellleiste und Touch-Knöpfen ----------
     Hochkant nimmt die Knopfgruppe das untere gute Drittel ein, die Schnellleiste liegt knapp darüber – genau auf Ezekiels
     Höhe (gemessen: Figur bei 59 % der Bildhöhe, Leiste 56–61 %). Die Kamera hält ihn hochkant bei etwa 40 %. */
  function hochOff() {
    const c = Z.cam; if (!c || off() || !(c.h > c.w * 1.35)) return 0;
    const tc = document.getElementById("touch"); if (!tc || tc.hidden) return 0;
    return c.h * 0.10;
  }
  function wrapCam() {
    const c = Z.cam; if (!c || !c.update) return setTimeout(wrapCam, 100);
    if (c.update._w38f) return;
    const u0 = c.update;
    c.update = function (dt, p) {
      const o = p ? hochOff() : 0;
      if (!o) return u0.apply(this, arguments);
      const q = Object.create(p); q.y = p.y + o; /* Ziel tiefer → Figur höher im Bild; alle anderen Felder wie gehabt */
      const lk = c.lock; if (lk && typeof lk.y === "number") lk.y += o; /* W38 QA: auch bei Boss-/Ereignis-Kamera (Lock) */
      try { return u0.call(this, dt, q); } finally { if (lk && typeof lk.y === "number") lk.y -= o; }
    };
    c.update._w38f = true;
    /* Kurze Gebiete sind hochkant kaum höher als das Bild: die Kamera darf um den Versatz unter den unteren Rand schauen
       (dort liegen ohnehin die Touch-Knöpfe) – sonst bliebe Ezekiel trotz Versatz hinter der Leiste. */
    const k0 = c.clamp;
    if (k0 && !k0._w38f) {
      c.clamp = function () {
        const o = hochOff(), b = c.bounds;
        if (!o || !b) return k0.apply(this, arguments);
        if (b.h <= c.h) { const r = k0.apply(this, arguments); c.y += o; return r; } /* W38 QA: kurze Arenen (ganz im Bild) – Ausschnitt um den Versatz tiefer */
        c.bounds = { x: b.x, y: b.y, w: b.w, h: b.h + o };
        try { return k0.apply(this, arguments); } finally { c.bounds = b; }
      };
      c.clamp._w38f = true;
    }
  }
  wrapCam();

  /* ---------- 3) Höchstens drei große Zurufe zugleich ---------- */
  const FX = Z.fx;
  const NUM = /^[+\-−]?\d+$/;
  const ALARM = new Set(["!", "?!", "?", "Alarm!"]);
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini || Z.gq.level === 0));
  const ruf = t => t && t.big && !NUM.test(String(t.txt).trim()) && !ALARM.has(String(t.txt).trim()) && t.t < t.life * 0.8 && !t._w38weg;
  const rang = t => (t._pr != null ? t._pr : 3) + (String(t.txt).length >= 14 ? 1 : 0); /* lange Boss-/Lernhinweise wiegen mehr */
  let drops = 0;
  if (FX && FX.text) {
    const t0 = FX.text;
    FX.text = function (x, y, txt, col, big) {
      const r = t0.apply(this, arguments);
      try {
        if (big && !off()) {
          const L = FX.texts, n = L[L.length - 1], cam = Z.cam;
          if (n && n.txt === String(txt) && ruf(n)) {
            const MAX = lean() ? 2 : 3;
            const live = L.filter(t => ruf(t) && (!cam || (t.x > cam.x - 80 && t.x < cam.x + cam.w + 80 && t.y > cam.y - 60 && t.y < cam.y + cam.h + 60)));
            while (live.length > MAX) {
              let w = null; for (const t of live) if (t !== n && (!w || rang(t) < rang(w) || (rang(t) === rang(w) && t.t > w.t))) w = t;
              if (!w) break;
              if (rang(w) > rang(n)) { w = n; } /* der Neue ist unwichtiger als alle anderen: er tritt selbst zurück */
              w._w38weg = true; w.t = Math.max(w.t, w.life * 0.86); drops++;
              live.splice(live.indexOf(w), 1);
              if (w === n) break;
            }
          }
        }
      } catch (e) { if (!errN.text) { errN.text = 1; console.error("W38 Frei", e); } }
      return r;
    };
  }

  /* ---------- 4) Türschilder weichen Touch-Knöpfen aus (bild.js ruft Z.doorLabelPos) ---------- */
  let btnR = [], btnT = 0;
  function buttons() {
    const now = performance.now(); if (now - btnT < 300) return btnR; btnT = now;
    const tc = document.getElementById("touch");
    btnR = [];
    if (!tc || tc.hidden || getComputedStyle(tc).display === "none") return btnR;
    for (const b of tc.querySelectorAll("[data-t], button")) { const r = b.getBoundingClientRect(); if (r.width > 4 && r.height > 4 && +getComputedStyle(b).opacity > 0.05) btnR.push(r); }
    return btnR;
  }
  let placed = [], placedF = -1;
  Z.doorLabelPos = function (c, x, y, w) {
    try {
      if (off()) return null;
      const B = buttons(); if (!B.length || !c || !c.canvas) return null;
      const fr = (Z.gfx && Z.gfx.frame) || 0; if (fr !== placedF) { placedF = fr; placed = []; } /* andere Schilder dieses Bildes */
      const m = c.getTransform(), cr = c.canvas.getBoundingClientRect(), k = cr.width / (c.canvas.width || 1);
      const box = (wx, wy) => { const sx = cr.left + (m.a * wx + m.e) * k, sy = cr.top + (m.d * wy + m.f) * k, hw = (w / 2 + 3) * m.a * k, hh = 9 * m.d * k; return { l: sx - hw, r: sx + hw, t: sy - hh, b: sy + 3 * m.d * k }; };
      const hits = q => B.some(r => q.l < r.right + 4 && q.r > r.left - 4 && q.t < r.bottom + 4 && q.b > r.top - 4) || placed.some(r => q.l < r.r + 3 && q.r > r.l - 3 && q.t < r.b + 2 && q.b > r.t - 2);
      const q0 = box(x, y);
      if (!hits(q0)) { placed.push(q0); return null; }
      const tries = [[0, -14], [0, -28], [-(w / 2 + 18), 0], [-(w / 2 + 18), -14], [0, -42], [-(w + 24), -6], [-(w + 24), -20], [w / 2 + 18, -14], [0, -56]];
      for (const [dx, dy] of tries) { const q = box(x + dx, y + dy); if (q.l < cr.left + 2 || q.r > cr.right - 2 || q.t < cr.top + 2) continue; if (!hits(q)) { placed.push(q); return [x + dx, y + dy]; } }
      placed.push(q0); return null;
    } catch (e) { if (!errN.tuer) { errN.tuer = 1; console.error("W38 Frei", e); } return null; }
  };

  /* ---------- 6) Untere Bildkante für Karten/Blasen: Oberkante der Waffenleiste (#hud .hb), sonst Bildrand ----------
     Seltene-Ereignis-Banner (nemesis.js) und Sprechblasen (ui.js) lagen auf dem Handheld auf der Waffenleiste. */
  let untenY = 0, untenT = 0;
  Z.freiUnten = function () {
    const now = performance.now(); if (now - untenT < 250 && untenY) return untenY; untenT = now;
    let y = innerHeight - 6;
    try { const hb = document.querySelector("#hud .hb"), hud = document.getElementById("hud"); if (!off() && hb && hud && !hud.hidden) { const r = hb.getBoundingClientRect(); if (r.height > 0 && r.top > innerHeight * 0.45) y = Math.min(y, r.top - 6); } } catch (_) {}
    return (untenY = y);
  };

  /* ---------- 7) Breitbild: Lichtkreis um Ezekiel wächst ab 16:9 mit dem Seitenverhältnis (bild.js cutHoles) ----------
     Gemessen (Torhof, Stufe 3): Randhelligkeit/Mitte bei 1920×1080 ≈ 0,5, bei 3440×1440 ≈ 0,3 – die Seiten lagen im Schwarz. */
  Z.uwLicht = function () {
    const c = Z.cam; if (off() || !c || !c.h) return 1;
    const a = c.w / c.h; if (a <= 1.8) return 1;
    return Math.pow(Math.min(a / 1.78, 1.6), 0.75);
  };

  /* ---------- 8) Breitbild: Pausenmenü zweispaltig, wenn die Knopfliste nicht ins Fenster passt ---------- */
  function pauseSpalten() {
    const sp = document.querySelector("#modal .p-spalten"), box = document.querySelector("#modal .mbox"); if (!sp || !box || off()) return;
    const kn = sp.querySelector(".knoepfe.senk"); if (!kn) return;
    if (innerWidth / innerHeight < 1.7 || innerWidth < 1280) return; /* nur breite Bildschirme (ab 16:9, Desktop) */
    if (box.scrollHeight <= box.clientHeight + 4) return;
    sp.classList.add("w38-zwei");
  }
  /* W38 Frei: niedrige Bildschirme (Handheld 640×480, Handy quer): die 15 Knöpfe des Pausenmenüs standen untereinander
     (Messung: 351–454 px Überlauf; Tablet 1180×820: 191 px). Dort Knöpfe als Raster über die ganze Breite, „Weiter“ zuerst, Lauf-Infos darunter. */
  function pauseFlach() {
    const sp = document.querySelector("#modal:not([hidden]) .p-spalten"), box = sp && sp.closest(".mbox"); if (!sp || !box) return;
    if (off() || sp.classList.contains("w38-zwei") || innerWidth < 540 || innerHeight > innerWidth) { sp.classList.remove("w38-flach"); return; } /* auch Tablet quer (1180×820: „Zur Taverne“ lag unter dem Rand) */
    if (sp.classList.contains("w38-flach") || box.scrollHeight <= box.clientHeight + 4) return;
    sp.classList.add("w38-flach");
  }
  function wirePause() {
    const ui = Z.ui; if (!ui || typeof ui.pause !== "function") return setTimeout(wirePause, 80);
    if (ui.pause._w38z) return;
    const p0 = ui.pause;
    ui.pause = function () { const r = p0.apply(this, arguments); try { pauseSpalten(); pauseFlach(); } catch (e) { console.error("W38 Frei", e); } return r; };
    ui.pause._w38z = true;
  }
  wirePause();
  /* W38 QA: Lange Fenster (Zielbuch, Fundbuch, Erfolge …): Knopfleiste klebt unten, wenn der Inhalt rollt – „Schließen“
     war sonst erst nach dem Rollen zu sehen (Messung: Zielbuch 92–123 px Überlauf auf 1920/3440). */
  function klebe() {
    const m = document.querySelector("#modal:not([hidden]) .mbox"); if (!m || off()) return;
    const k = m.querySelector(":scope > .knoepfe"); if (!k) return;
    m.classList.toggle("w38-klebt", m.scrollHeight > m.clientHeight + 4);
  }
  function wireOpen() {
    const md = document.getElementById("modal"); if (!md) return setTimeout(wireOpen, 120);
    let pend = 0;
    new MutationObserver(() => { if (pend) return; pend = setTimeout(() => { pend = 0; try { pauseFlach(); klebe(); } catch (e) { console.error("W38 QA", e); } }, 60); }).observe(md, { childList: true, subtree: true });
    addEventListener("resize", () => { try { klebe(); } catch (_) {} });
  }
  wireOpen();

  /* ---------- 9) Breitbild: HUD wahlweise an den Bildrand (statt im 16:9-Mittelfeld) ----------
     Die Anzeige sitzt bewusst im 16:9-Bereich (--safe-x). Auf 21:9/32:9 schwebt die Lebensleiste dadurch weit im Bild;
     neue Einstellung „Anzeige an den Bildrand“ (nur auf Breitbild angeboten), gilt für Lebensleiste, Karte, Boss-Leiste. */
  const hudRand = () => { try { document.body.classList.toggle("w38-hudrand", !!(Z.settings && Z.settings.w38hudRand) && !off()); } catch (_) {} };
  function wireSet() {
    const ui = Z.ui; if (!ui || typeof ui.settings !== "function" || !document.body) return setTimeout(wireSet, 80);
    hudRand();
    if (ui.settings._w38h) return;
    const s0 = ui.settings;
    ui.settings = function () {
      const r = s0.apply(this, arguments);
      try {
        if (innerWidth / innerHeight > 1.85 && !document.querySelector('#modal [data-w38h]')) {
          const ref = document.querySelector('#modal [data-set="autoAim"]'), lab = ref && ref.closest("label");
          if (lab) {
            const el = document.createElement("label"); el.className = "schalter";
            el.innerHTML = '<input type="checkbox" data-w38h="1"' + (Z.settings.w38hudRand ? " checked" : "") + "> " + Z.L(["Breitbild: Anzeige an den Bildrand", "Ultrawide: HUD at the screen edges"]);
            lab.parentNode.insertBefore(el, lab);
            el.querySelector("input").onchange = e => { Z.settings.w38hudRand = e.target.checked; try { Z.saveSettings && Z.saveSettings(); } catch (_) {} hudRand(); };
          }
        }
      } catch (e) { console.error("W38 Frei", e); }
      return r;
    };
    ui.settings._w38h = true;
  }
  wireSet();

  /* ---------- 10) Online-Gast: wer ist wer, und die Herausforderungen des Gebiets ----------
     Probelauf (Gastgeber Desktop, Gast Handy quer, 4 Gebiete): Beim Gast zeigt die große Lebensleiste Ezekiel (Gastgeber),
     die eigene steht klein im P2-Kasten – ohne Hinweis. Und die Herausforderungstafel fehlte beim Gast ganz.
     Gast: „Ezekiel“ an der großen Leiste, „du“ am P2-Kasten. Gastgeber schreibt die Ziele in Gebietsfelder (lv.w38c0–2,
     über die Schnappschüsse gespiegelt), der Gast zeigt sie kompakt unter der Karte (in seiner Sprache). */
  const OS = () => Z.online && Z.online.S;
  const istGast = () => { const s = OS(); return !!(s && s.role === "guest" && s.playing); };
  const istHost = () => { const s = OS(); return !!(s && s.role === "host" && s.playing); };
  let chT = 0;
  function chHost() {
    const lv = Z.level, C = Z.chState && Z.chState(); if (!lv) return;
    for (let i = 0; i < 3; i++) {
      const x = C && C.list && C.list[i]; let v = "";
      if (x && x.h && x.h.id) {
        let pr = "";
        try {
          if (x.h.art === "zeit" && x.lim != null && Z.run) { const sec = Math.max(0, Math.ceil(x.lim - (Z.run.time - C.t0))); pr = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0"); }
          else if (x.h.prog) { C.need = x.need; pr = Math.min(x.h.prog(C), x.need || 1e9) + (x.need ? "/" + x.need : ""); }
        } catch (_) {}
        v = (x.h.id + "|" + pr + "|" + (x.state === "ok" ? "ok" : x.state === "weg" ? "weg" : "")).slice(0, 60);
      }
      if (lv["w38c" + i] !== v) lv["w38c" + i] = v;
    }
  }
  let gEl = null;
  function chGast() {
    const lv = Z.level, hl = document.querySelector("#hud .hl"); if (!lv || !hl) return;
    if (!gEl) { gEl = document.createElement("div"); gEl.id = "w38gch"; gEl.className = "eisen"; }
    const kh = document.getElementById("koop-hl"); /* links unter dem P2-Kasten: rechts liegen am Handy Karte/Pause-Knöpfe */
    if (kh && kh.parentNode === hl) { if (gEl.previousSibling !== kh) hl.insertBefore(gEl, kh.nextSibling); } else if (gEl.parentNode !== hl) hl.appendChild(gEl);
    let h = "";
    for (let i = 0; i < 3; i++) {
      const v = lv["w38c" + i]; if (!v || typeof v !== "string") continue;
      const [id, pr, st] = v.split("|"), d = (Z.CHALLENGES || []).find(c => c.id === id); if (!d) continue;
      h += '<span class="hc ' + (st || "") + '">' + d.ico + " " + Z.U.esc(Z.L(d.n)) + (st === "ok" ? " ✓" : pr ? " " + Z.U.esc(pr) : "") + "</span>";
    }
    gEl.hidden = !h || !!lv.hub; if (gEl.dataset.h !== h) { gEl.dataset.h = h; gEl.innerHTML = h ? '<span class="hk">✦</span>' + h : ""; }
  }
  function werIstWer() {
    const g = istGast() && !off();
    document.body.classList.toggle("w38-gast", g);
    const bar = document.getElementById("hpbar");
    if (bar) { let t = bar.querySelector(".w38-wer"); if (g && !t) { t = document.createElement("span"); t.className = "w38-wer"; t.textContent = "Ezekiel"; bar.appendChild(t); } if (!g && t) t.remove(); }
    const kk = document.querySelector("#koop-hl .kh-kopf");
    if (kk) { let t = kk.querySelector(".w38-du"); if (g && !t) { t = document.createElement("span"); t.className = "w38-du"; t.textContent = Z.L(["du", "you"]); kk.appendChild(t); } if (!g && t) t.remove(); }
    if (!g && gEl && !gEl.hidden) gEl.hidden = true;
  }
  (function gl() {
    setTimeout(gl, 250);
    try { werIstWer(); if (off()) return; if (istHost()) chHost(); else if (istGast()) chGast(); } catch (e) { if (!errN.gast) { errN.gast = 1; console.error("W38 Frei", e); } }
  })();

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = [
    "@keyframes w38verf{0%{color:#ff7a6a;opacity:1;transform:translateX(0)}15%{transform:translateX(-3px)}30%{transform:translateX(3px)}45%{transform:translateX(-2px)}60%{transform:translateX(0);color:#ff7a6a;opacity:1}100%{color:inherit;opacity:.45}}",
    "#hfzeile .hc.weg.w38-verf{animation:w38verf 1.3s ease-out 1;text-decoration-color:#ff7a6a}",
    "@media (prefers-reduced-motion:reduce){#hfzeile .hc.weg.w38-verf{animation:none;color:#ff9a8a}}",
    "body.w38-hudrand{--safe-x:0px}",
    "#modal .mbox.w38-klebt>.knoepfe{position:sticky;bottom:0;z-index:2;margin-top:8px;padding:8px 0 4px;background:linear-gradient(rgba(30,14,12,0),rgba(30,14,12,.94) 28%,rgba(30,14,12,.98))}",
    "#modal .mbox.rb21box>.knoepfe{position:sticky;bottom:0;z-index:2;margin:8px -6px 0;padding:8px 6px 4px;background:linear-gradient(rgba(30,14,12,0),rgba(30,14,12,.94) 28%,rgba(30,14,12,.98))}" /* W38 Frei: Lauf-Rückblick – „Weiter ins Lager“ auf kleinen Bildschirmen ohne Rollen sichtbar */ + "",
    "#hpbar .w38-wer{position:absolute;left:6px;top:50%;transform:translateY(-50%);font-size:calc(var(--fs-xs,11px) * .85);font-weight:800;color:#f0e2cc;text-shadow:0 1px 2px #000;opacity:.85;pointer-events:none}",
    "#koop-hl .w38-du{margin-left:auto;font-size:var(--fs-xs,11px);color:#1a1012;background:#e5b454;border-radius:6px;padding:0 6px;font-weight:800}",
    "#w38gch{margin-top:6px;max-width:min(300px,42vw);padding:3px 8px;font-size:12px;font-weight:700;line-height:1.35}#w38gch .hc{white-space:nowrap;margin-right:8px;display:inline-block}#w38gch .hc.ok{color:#ffd27a}#w38gch .hc.weg{opacity:.45;text-decoration:line-through}#w38gch .hk{color:#e5b454;margin-right:4px}",
    "#modal .p-spalten.w38-flach{grid-template-columns:1fr;gap:8px}#modal .p-spalten.w38-flach .knoepfe.senk{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:5px}#modal .p-spalten.w38-flach .knoepfe.senk>*{margin:0;width:auto;min-height:0;padding-top:5px;padding-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#modal .p-spalten.w38-flach .knoepfe.senk>[data-act=close]{font-weight:800}", /* W38 Frei: Pausenmenü auf niedrigen Bildschirmen */
    "#modal .p-spalten.w38-zwei{grid-template-columns:minmax(420px,560px) 1fr}#modal .p-spalten.w38-zwei .knoepfe.senk{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch}#modal .p-spalten.w38-zwei .knoepfe.senk>*{margin:0;width:auto}"
  ].join("\n");
  document.head.appendChild(css);

  Z.frei = { dbg: () => ({ shift, drops, live: FX ? FX.texts.filter(ruf).map(t => t.txt) : [] }) };
})();
