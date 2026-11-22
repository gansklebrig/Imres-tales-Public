/* Ezekiel – The Destroyer · Leben in der Feste
   – Manche Gegner schlafen: Zzz über dem Kopf. Wer leise (geduckt) herankommt, kann sie überraschen –
     der erste Treffer auf einen Schlafenden trifft doppelt und kritisch. Laufen, Kämpfen und Fallen wecken sie.
   – Wachen stehen mit Laterne still und halten Ausschau.
   – Wer Ezekiel entdeckt, ruft: Kameraden in der Nähe kommen dazu. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, L = v => Z.L(v), A = Z.audio, FX = Z.fx, U = Z.U;
  let lvRef = null;
  function setup(lv) {
    lvRef = lv;
    if (!lv || lv.hub || lv.arena || lv.passage) return;
    const R = Z.Rng(((lv.seed || 5) * 7 + 911) >>> 0);
    const P = Z.player;
    for (const e of Z.enemies) {
      if (e.dead || !e.def || e.def.boss || e.def.fly || e.thief || e.ambush || ["turret", "exploder", "swarm", "phase"].includes(e.def.ai)) continue;
      if (P && Math.abs(e.x - P.x) < 200 && Math.abs(e.y - P.y) < 100) continue;
      const r = R();
      if (r < 0.22) { e.sleep = true; e.sleepPh = R() * 6; }
      else if (r < 0.34) { e.watch = true; e.face = R() < 0.5 ? -1 : 1; }
    }
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  function wake(e, loud) {
    if (!e.sleep) return;
    e.sleep = false; e.aware = true; e.alertT = loud ? 0 : 0.35; e.cd = Math.max(e.cd || 0, 0.6);
    FX.text(e.x + e.w / 2, e.y - 12, "!", "#ffd27a", true); A.play("monster", { vol: 0.35, x: e.x, rate: 1.2 });
  }
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    if (e && e.sleep && !(o && o.dot)) {
      o = Object.assign({}, o || {}, { crit: true });
      dmg *= 2; e.sleep = false;
      FX.text(e.x + e.w / 2, e.y - 16, L(["Überrascht!", "Ambushed!"]), "#ffd27a", true);
      const r = hit0.call(this, e, dmg, o); if (!e.dead) wake(e, true); return r;
    }
    return hit0.apply(this, arguments);
  };

  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    const P = Z.player; if (!P || P.dead || Z.level !== lvRef) return;
    const px = P.x + P.w / 2, py = P.y + P.h / 2;
    const loud = (P.act && P.act.phase === "act") || P.rollT > 0 || (Math.abs(P.vx) > 120 && !P.crouch) || (P.justLanded && (P.anim && P.anim.land > 0.5));
    for (const e of Z.enemies) {
      if (e.dead) continue;
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = Math.hypot(ex - px, (ey - py) * 1.6);
      if (e.sleep) {
        e.aware = false; e.pDir = 0; e.patrol = 9; e.vx = 0;
        const hear = P.crouch ? 26 : loud ? 110 : 52;
        if (d < hear) wake(e, false);
        if (Math.random() < dt * 0.8) e.zz = (e.zz || []).concat([{ t: 0, x: ex + e.face * 3, y: e.y - 2 }]).slice(-3);
        continue;
      }
      if (e.watch && !e.aware) { e.pDir = 0; e.patrol = 9; e.vx = 0; if (Math.random() < dt * 0.15) e.face = -e.face; }
      /* Ruf: wer entdeckt, alarmiert die Nachbarn */
      if (e.aware && !e.called && !e.def.boss) {
        e.called = true; if (e.watch) e.watch = false;
        let any = false;
        for (const o of Z.enemies) {
          if (o === e || o.dead || o.aware || o.def.boss) continue;
          if (Math.abs(o.x - e.x) < 170 && Math.abs(o.y - e.y) < 90) { any = true; setTimeout(() => { if (o.dead) return; if (o.sleep) { if (Math.random() < 0.6) wake(o, false); } else { o.aware = true; o.alertT = 0.2; FX.text(o.x + o.w / 2, o.y - 10, "?!", "#e8c890"); } }, 300 + Math.random() * 400); }
        }
        if (any) { FX.text(e.x + e.w / 2, e.y - 14, L(["Alarm!", "Alarm!"]), "#ff8a6a"); A.play(e.def.undead ? "undead" : "monster", { vol: 0.3, x: e.x, rate: 0.85 }); }
      }
    }
  };

  /* Zzz und Laternen zeichnen */
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp0) dp0.apply(this, arguments);
    if (Z.level !== lvRef) return;
    const t = Z.gfx.time || 0, cam = Z.cam;
    c.save();
    for (const e of Z.enemies) {
      if (e.dead || e.x < cam.x - 40 || e.x > cam.x + cam.w + 40) continue;
      if (e.sleep && e.zz) {
        c.font = "700 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
        for (const z of e.zz) { z.t += 1 / 60; const u = Math.min(1, z.t / 2.4); c.globalAlpha = 1 - u; c.fillStyle = "#e8e0ff"; c.font = "700 " + (5 + u * 5) + "px 'Alegreya Sans',sans-serif"; c.fillText("z", z.x + Math.sin(z.t * 3) * 3 + u * 6, z.y - u * 18); }
        e.zz = e.zz.filter(z => z.t < 2.4); c.globalAlpha = 1;
      }
      if (e.watch && !e.aware) {
        const lx = e.x + e.w / 2 + e.face * (e.w * 0.6), ly = e.y + e.h * 0.45 + Math.sin(t * 2 + e.x) * 0.6;
        c.strokeStyle = "#2a2420"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(lx, ly - 5); c.lineTo(lx, ly - 2); c.stroke();
        c.fillStyle = "#3a3028"; c.fillRect(lx - 2, ly - 2, 4, 5); c.fillStyle = "#ffcf7a"; c.fillRect(lx - 1.2, ly - 1.2, 2.4, 3.2);
        c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(lx, ly, 0, lx, ly, 26); g.addColorStop(0, "rgba(255,200,120,.28)"); g.addColorStop(1, "rgba(255,180,90,0)"); c.fillStyle = g; c.beginPath(); c.arc(lx, ly, 26, 0, Math.PI * 2); c.fill();
        /* Blickkegel */
        const k = c.createLinearGradient(lx, 0, lx + e.face * 80, 0); k.addColorStop(0, "rgba(255,200,120,.10)"); k.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = k; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + e.face * 80, ly - 18); c.lineTo(lx + e.face * 80, ly + 14); c.closePath(); c.fill();
        c.globalCompositeOperation = "source-over";
      }
    }
    c.restore();
  };
  /* Wachen sehen nach vorn weiter, aber nicht nach hinten */
  Z.leben = { wake };
})();
