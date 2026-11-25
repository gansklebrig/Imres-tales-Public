/* Ezekiel – The Destroyer · Steuerungs-Feedback
   Spürbare Rückmeldung zur Bewegung, ohne figuren.js/effekte.js anzufassen: Landestaub auch bei kleinen Sprüngen,
   Bremsstaub beim Wenden, dezente Controller-Vibration (Landung, Doppelsprung, Kantengriff – abschaltbar über
   „Vibration“ in den Einstellungen). Die Physik selbst steckt in kampf.js (Bewegungsteil), die Trefferfläche
   gegenüber Fallen in Z.playerHurtBox (kampf.js). */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, inp = Z.input, C = Z.PC;
  const dust = () => Z.dustCol || "#8a7a70";
  /* Vibration nur am Controller und gedrosselt, damit sie nicht zu einem Dauerbrummen wird */
  /* W20 Steuerung: über Z.vib (kern.js) – Stärkeregler, Vorrang und Drossel gelten auch hier */
  const buzz = (P, s, ms) => {
    if (!inp.vib || inp.device !== "pad" || !Z.vib) return;
    Z.vib({ s, w: s * 0.7, ms, p: 0, gap: 0.09 });
  };
  /* W20 Steuerung: Boss-Großangriffe (starkes Beben außerhalb der Spieler-Aktion, solange ein Boss lebt), Phasenwechsel, Tod */
  let inPlayer = false, lastDead = null;
  const bossAlive = () => { const P = Z.player; if (!P || !Z.enemies) return false; for (const e of Z.enemies) if (e && !e.dead && e.def && e.def.boss && Math.abs(e.x - P.x) < 520) return true; return false; };
  {
    const sh0 = FX.addShake;
    FX.addShake = function (v, cap) { try { if (!inPlayer && +v >= 6 && Z.level && !Z.paused && bossAlive()) Z.vib && Z.vib("boss"); } catch (_) {} return sh0.apply(this, arguments); };
  }
  const phSeen = new WeakMap();
  function bossWatch() {
    if (!Z.enemies) return;
    for (const e of Z.enemies) { if (!e || !e.def || !e.def.boss) continue; const ph = e.phase || 0, was = phSeen.get(e); phSeen.set(e, ph); if (was != null && ph > was && !e.dead) Z.vib && Z.vib("phase"); }
  }
  let skidT = 0;
  /* W9 Treppen: Figur um P.stepOff versetzt zeichnen (Stufe hinauf/hinab weich nachgezogen, siehe stepUp/stickDown in kampf.js).
     figuren.js lädt erst nach dieser Datei → Umhüllung beim ersten Spieler-Update. */
  let drawWrapped = false;
  const wrapDraw = () => {
    const d0 = Z.drawPlayer; if (!d0 || drawWrapped) return; drawWrapped = true;
    Z.drawPlayer = function (c, P, t) {
      const o = P && P === Z.player ? P.stepOff || 0 : 0;
      if (!o || !c || !c.translate) return d0.apply(this, arguments);
      c.save(); c.translate(0, o);
      try { return d0.apply(this, arguments); } finally { c.restore(); }
    };
  };
  const up0 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    wrapDraw();
    const wasGround = P.onGround, vy0 = P.vy, vx0 = P.vx, aj0 = P.airJumps, ledge0 = !!P.ledge;
    let r; inPlayer = true; try { r = up0.apply(this, arguments); } finally { inPlayer = false; }
    try { if (P && P === Z.player) { if (P.dead && lastDead !== P) Z.vib && Z.vib("death"); lastDead = P.dead ? P : null; bossWatch(); } } catch (e) { console.error(e); } /* W20 Steuerung */
    if (!P || P.dead) return r;
    try {
      skidT = Math.max(0, skidT - dt);
      /* Landung: kleine Staubwolke auch unter der bisherigen Schwelle, Vibration ab spürbarer Fallhöhe */
      if (P.onGround && !wasGround && !P.ledge) {
        const v = Math.max(vy0, P.landV || 0);
        if (v > 110 && v <= 200) FX.burst(P.x + P.w / 2, P.y + P.h, 3, { col: dust(), sp: 34, ang: -Math.PI / 2, spread: 2.8, life: 0.3, size: 2, kind: "smoke", g: -10 });
        if (v > 330) buzz(P, Math.min(0.24, 0.06 + (v - 330) / 900), 45 + Math.min(40, (v - 330) / 6));
      }
      /* Doppelsprung: kurzer, leichter Impuls */
      if (P.airJumps < aj0 && P.vy < -250) buzz(P, 0.07, 32);
      /* Kantengriff */
      if (P.ledge && !ledge0) buzz(P, 0.1, 40);
      /* Wenden am Boden mit Schwung: Bremsstaub an den Füßen */
      if (P.onGround && wasGround && skidT <= 0 && Math.abs(vx0) > C.RUN * 0.7) {
        const h = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0);
        if (h && Math.sign(h) !== Math.sign(vx0)) {
          skidT = 0.22;
          FX.burst(P.x + P.w / 2 + Math.sign(vx0) * 4, P.y + P.h - 1, 4, { col: dust(), sp: 45, ang: vx0 > 0 ? -2.6 : -0.55, spread: 0.9, life: 0.32, size: 2, kind: "smoke", g: -15 });
        }
      }
    } catch (e) { console.error(e); }
    return r;
  };
})();
