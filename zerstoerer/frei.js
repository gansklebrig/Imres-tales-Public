/* Ezekiel – The Destroyer · W38 Frei: drei Schwächen aus einem kritischen Probelauf (frei.js)
   1) Boss-Auftritt auf kleinen Bildschirmen: das große Namensband (#banner, 30 % Höhe) lag auf der Boss-Lebensleiste
      (#bossbar) – Handy quer und Handheld. Liegt das Band über der Leiste, rückt es knapp darunter (nur so weit wie nötig,
      nie aus dem Bild); sonst bleibt alles wie gehabt.
   2) „Verfehlt: …“: Herausforderungen melden ein Scheitern nur noch auf der Tafel (bilanz.js fail(): rotes Aufflackern des
      durchgestrichenen Ziels); hier nur das Aussehen dazu.
   3) Schwebetext-Gedränge: Im Kampf standen bis zu sechs große Zurufe gleichzeitig („Durchschaut!“, „Unterbrochen!“,
      „Adrenalin! +25 %“, Boss-Hinweise …). Höchstens drei große Zurufe zugleich (Handheld/Stufe 0: zwei); kommt ein neuer,
      tritt der unwichtigste ältere zurück (Boss-/Lernhinweise zuletzt). Schadenszahlen, Heilung und „!“ bleiben unberührt.
   Kein Blau. Schalter Z.gfx.off.w38frei. Prüfhilfe Z.frei.dbg(). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.frei) return;
  const off = () => !!(Z.gfx && Z.gfx.off && Z.gfx.off.w38frei);
  const errN = {};
  const safe = (fn, tag) => function () { try { return fn.apply(this, arguments); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W38 Frei", tag, e); } } };

  /* ---------- 1) Namensband unter die Boss-Leiste ---------- */
  let shift = 0, bandT = 0;
  function band() {
    const bn = document.getElementById("banner"), bb = document.getElementById("bossbar");
    if (!bn) return;
    const shown = !bn.hidden && (bn.classList.contains("an") || +getComputedStyle(bn).opacity > 0.02); /* auch beim Ausblenden nicht zurückspringen */
    const barOn = bb && !bb.hidden && bb.offsetParent !== null && bb.getBoundingClientRect().height > 0;
    if (off() || !shown || !barOn) { if (shift) { bn.style.transform = ""; shift = 0; } return; }
    const r0 = bn.getBoundingClientRect(), b = bb.getBoundingClientRect();
    const top0 = r0.top - shift * (r0.height / Math.max(1, bn.offsetHeight)); /* Lage ohne eigene Verschiebung */
    const k = r0.height / Math.max(1, bn.offsetHeight) || 1; /* CSS-zoom des Bandes */
    let need = b.bottom + 6 - top0;
    if (need <= 0) { if (shift) { bn.style.transform = ""; shift = 0; } return; }
    need = Math.min(need, Math.max(0, innerHeight - 8 - (top0 + r0.height))); /* nicht aus dem Bild */
    const s = Math.round(need / k);
    if (Math.abs(s - shift) > 1) { shift = s; bn.style.transform = "translate(-50%, calc(-50% + " + s + "px))"; }
  }
  /* Meldungen während des Boss-Auftritts (vor „bosskampf“) lagen ebenfalls auf der Leiste: knapp darunter setzen */
  function noten() {
    const m = document.getElementById("meldungen"), bb = document.getElementById("bossbar"); if (!m) return;
    const barOn = !off() && bb && !bb.hidden && bb.offsetParent !== null && bb.getBoundingClientRect().height > 0;
    if (!barOn) { if (m.dataset.w38f) { m.style.top = ""; delete m.dataset.w38f; } return; }
    if (m.style.left) return; /* einstieg.js hat sie gerade selbst ausgerichtet */
    const b0 = bb.getBoundingClientRect(), hud = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hud")) || 1;
    let lim = b0.bottom; /* liegt das Namensband (noch sichtbar) im Weg, auch darunter */
    const bn = document.getElementById("banner");
    if (bn && !bn.hidden && +getComputedStyle(bn).opacity > 0.12) { const r = bn.getBoundingClientRect(); if (r.height > 0 && r.bottom < innerHeight * 0.6) lim = Math.max(lim, r.bottom); }
    const b = { bottom: lim };
    const top0 = m.dataset.w38f ? +m.dataset.w38f0 : m.getBoundingClientRect().top;
    if (!m.dataset.w38f && top0 >= b.bottom + 4) return;
    if (!m.dataset.w38f) { m.dataset.w38f = "1"; m.dataset.w38f0 = String(top0); }
    if (top0 >= b.bottom + 4) { m.style.top = ""; delete m.dataset.w38f; return; }
    m.style.top = Math.round((b.bottom + 6) / hud) + "px";
  }
  const notenS = safe(noten, "noten");
  const bandS0 = safe(band, "band"), bandS = () => { bandS0(); notenS(); };
  (function loop() { requestAnimationFrame(loop); const now = performance.now(); if (now - bandT > 120) { bandT = now; bandS(); } })();

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

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = [
    "@keyframes w38verf{0%{color:#ff7a6a;opacity:1;transform:translateX(0)}15%{transform:translateX(-3px)}30%{transform:translateX(3px)}45%{transform:translateX(-2px)}60%{transform:translateX(0);color:#ff7a6a;opacity:1}100%{color:inherit;opacity:.45}}",
    "#hfzeile .hc.weg.w38-verf{animation:w38verf 1.3s ease-out 1;text-decoration-color:#ff7a6a}",
    "@media (prefers-reduced-motion:reduce){#hfzeile .hc.weg.w38-verf{animation:none;color:#ff9a8a}}"
  ].join("\n");
  document.head.appendChild(css);

  Z.frei = { dbg: () => ({ shift, drops, live: FX ? FX.texts.filter(ruf).map(t => t.txt) : [] }) };
})();
