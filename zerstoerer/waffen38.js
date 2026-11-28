/* Ezekiel – The Destroyer · W38 Waffen: drei Waffen mit eigener Spielweise (nur angehängt)
   Bestand (Stand v=184): Ziehen (Kettenpeitsche, Anker), Bumerang (Wurfschild), Fesseln (Ettercap-Drüse, Ranken),
   Licht nur als Bonus (Dawnbringer). Was fehlte:
   1) Laternenstab (Nahkampf, Taktik): Licht als Waffe. Treffer füllen die Laterne (Glut 0–3), der dritte Schlag öffnet
      sie zu einem Lichtblitz nach vorn: Geblendete teilen 40 % weniger aus und nehmen 30 % mehr (Status „weak“),
      volle Laterne betäubt zusätzlich. Die Laterne leuchtet und hellt die Umgebung auf (auch in Dunkelgebieten).
   2) Ladeschild (Schild, Überleben): speichert Treffer. Jeder Block lädt 1, eine Parade 2 (höchstens 5); der
      Schildstoß entlädt alles als Druckwelle, deren Reichweite und Wucht mit der Ladung wächst. Ladung verfliegt nach 8 s.
   3) Kettensichel (Fernkampf, Brutalität): Zugriff. Die Sichel fliegt an der Kette, hakt sich in Gegner oder Wand –
      noch einmal drücken, und Ezekiel zieht sich hin (kritischer Hieb mit Betäubung am Gegner, kleiner Sprung an der Wand).
      Beweglichkeit statt Schaden aus der Ferne. Koop-P2: zieht den Gegner zu sich.
   Online: Lichtblitz, Druckwelle und Sichel sind Geschosse (über die Schnappschüsse gespiegelt), Ladung/Glut sind
   Spielerfelder ohne Unterstrich.
   Ausgleich (kampf38.py, 4 Söldner, Median aller Waffen): Laternenstab-Schaden 12/12/18 → 15/15/24, Blitz 6+3·Glut → 9+4·Glut;
   Kettensichel Wurf 9 → 10, Zug-Hieb 20 → 23. Schalter Z.gfx.off.w38waffen (nur Zusatzbilder; die Waffen selbst bleiben). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || !Z.WEAPONS || Z.WEAPONS.laternenstab) return;
  const U = Z.U, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const { limb, circ, poly, ell, glow } = Z.draw;
  const offFx = () => !!(Z.gfx && Z.gfx.off && Z.gfx.off.w38waffen);
  const lvl = id => (Z.metaLvl ? Z.metaLvl(id) : 0);
  const alive = e => e && !e.dead && !(e.intro > 0);
  const errN = {};
  const safe = (tag, fn) => { try { return fn(); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W38 Waffen", tag, e); } } };
  const players = () => [Z.player, Z.koop && Z.koop.p2].filter(p => p && !p.dead);
  const holds = (P, id) => !!(P && P.slots && ((P.slots.a1 && P.slots.a1.id === id) || (P.slots.a2 && P.slots.a2.id === id)));

  /* ======================= WAFFEN ======================= */
  const glutHit = (P, e, dmg, a) => { P.w38glut = Math.min(3, (P.w38glut || 0) + 1); P.w38glutT = 6; };
  Object.assign(Z.WEAPONS, {
    laternenstab: { n: ["Laternenstab der Grabwächter", "Gravewarden's Lantern Staff"], kind: "melee", stat: "takt", find: "selten", tier: 1, icon: "laterne", col: "#ffcf6a",
      d: ["Ein Stab mit einer Laterne an der Spitze. Zwei Stöße füllen die Laterne mit Glut, der dritte Schlag öffnet sie: Ein Lichtblitz blendet alles vor dir – Geblendete treffen schwächer und nehmen mehr Schaden. Volle Laterne betäubt.",
        "A staff with a lantern at its tip. Two thrusts fill the lantern with embers, the third strike opens it: a flash blinds everything ahead – blinded foes hit weaker and take more damage. A full lantern stuns."],
      combo: [
        { pre: 0.07, act: 0.07, post: 0.1, dmg: 15, box: [4, -26, 40, 12], lunge: 50, kb: 60, sw: "swing", onHit: glutHit, smear: { r: 38, a0: -0.05, a1: 0.05, th: 4, stab: true } },
        { pre: 0.07, act: 0.07, post: 0.1, dmg: 15, box: [4, -22, 40, 12], lunge: 50, kb: 60, sw: "swing", onHit: glutHit, smear: { r: 38, a0: 0.05, a1: -0.05, th: 4, stab: true } },
        { pre: 0.14, act: 0.1, post: 0.28, dmg: 24, box: [-4, -36, 46, 34], lunge: 30, kb: 140, sw: "swingHeavy", heavy: true, w38blitz: true, smear: { r: 40, a0: -2.2, a1: 1.0, th: 8 } }
      ], crit: "stunned", critMul: 1.8, light: 80, tags: ["Licht", "Kontrolle"],
      master: ["Meisterschaft: Der Lichtblitz verbrennt Untote und Dämonen.", "Mastery: the flash burns undead and demons."] },
    ladeschild: { n: ["Ladeschild der Turmwache", "Tower Guard's Charge Shield"], kind: "shield", stat: "ueber", find: "selten", tier: 1, icon: "ladeschild", col: "#e0b060",
      d: ["Ein Schild mit einem Kern aus Glutkristall. Jeder Block lädt ihn um eins, eine Parade um zwei (bis fünf). Der Schildstoß entlädt alles als Druckwelle – je voller, desto weiter und wuchtiger. Die Ladung verfliegt nach 8 Sekunden.",
        "A shield with an ember-crystal core. Every block charges it by one, a parry by two (up to five). The bash releases it all as a shockwave – the fuller, the farther and heavier. The charge fades after 8 seconds."],
      shield: { block: 0.85, parry: 0.2, bash: 10, parryStun: 1.0 }, tags: ["Panzer", "Konter"],
      master: ["Meisterschaft: Bei voller Ladung heilt die Entladung 5 %.", "Mastery: a full discharge heals 5%."] },
    kettensichel: { n: ["Kettensichel", "Chain Sickle"], kind: "ranged", stat: "brut", find: "selten", tier: 1, icon: "kettensichel", col: "#c8c0b8",
      d: ["Eine Sichel an langer Kette. Wurf: Sie hakt sich in Gegner oder Wand. Noch einmal drücken: Ezekiel zieht sich hin – am Gegner mit einem kritischen, betäubenden Hieb, an der Wand mit einem kleinen Sprung nach oben.",
        "A sickle on a long chain. Throw: it hooks into an enemy or a wall. Press again: Ezekiel hauls himself there – at an enemy with a critical, stunning strike, at a wall with a little hop upwards."],
      shoot: { pre: 0.06, post: 0.22, proj: "w38sichel", dmg: 10, sw: "whip" }, tags: ["Zugriff", "Beweglich"],
      master: ["Meisterschaft: Der Zug-Hieb lässt bluten und trifft alles auf dem Weg.", "Mastery: the haul strike causes bleeding and hits everything on the way."] }
  });

  { const d = Z.WEAPONS.ladeschild; if (!d._hint) { d._hint = 1; d.d = [d.d[0] + " (Halten: blocken · Tippen: Schildstoß)", d.d[1] + " (Hold: block · Tap: shield bash)"]; } } /* wie werkzeuge.js für alle Schilde */

  /* ======================= GESCHOSSE ======================= */
  const NONE = "rgba(0,0,0,0)";
  Object.assign(Z.PK, {
    w38licht: { speed: 360, g: 0, r: 12, life: 0.24, pierce: true, col: NONE, wave: true, ghost: true },
    w38ladung: { speed: 300, g: 0, r: 9, life: 0.2, pierce: true, col: NONE, wave: true, ghost: true },
    w38sichel: { speed: 560, g: 0, r: 3, life: 0.42, col: NONE, spin: true }
  });

  /* ---------- Laternenstab: Lichtblitz zu Beginn des dritten Schlags ---------- */
  function blitz(P, a) {
    const g = P.w38glut || 0, full = g >= 3, it = a.it;
    const dm = Z.dmgOf(P, it, 9 + g * 4);
    const eff = { weak: full ? 4 : 2.5 }; if (full) eff.stun = 0.9;
    const p = Z.spawnProj("w38licht", P.x + P.w / 2 + P.face * 10, P.y + 12, P.face, { dmg: dm, it, eff, life: full ? 0.32 : 0.22 });
    p.w38g = g;
    p.onHitE = (q, e) => { e.w38blind = e.st.weak || 0; /* Statussymbol „geblendet“ (figuren.js); ohne Unterstrich → auch beim Online-Gast */ if (lvl("laternenstab") >= 3 && e.def && (e.def.undead || e.def.demon)) Z.addStatus(e, "burn", 3); };
    if (full) P.w38glut = 0; /* nur die volle Laterne leert sich – sonst wird jede zweite Kette zum großen Blitz */
    A.play("holy", { vol: full ? 0.6 : 0.4, rate: full ? 1 : 1.25 }); if (full) A.play("magic", { vol: 0.35, rate: 1.4 });
    if (!offFx()) { FX.ring(P.x + P.w / 2 + P.face * 14, P.y + 10, full ? 34 : 22, "#ffe8a0", 0.25, 3); FX.burst(P.x + P.w / 2 + P.face * 16, P.y + 10, full ? 18 : 9, { col: ["#fff4c8", "#ffcf6a"], sp: 160, ang: P.face > 0 ? 0 : Math.PI, spread: 0.9, life: 0.3, size: 2, kind: "spark", add: true }); }
    if (full && FX.text) FX.text(P.x + P.w / 2, P.y - 12, L(["Geblendet!", "Blinded!"]), "#ffe8a0", true);
  }

  /* ---------- Ladeschild ---------- */
  const LMAX = 5;
  function laden(P, n) {
    const v = Math.min(LMAX, (P.w38lad || 0) + n);
    if (v !== P.w38lad) { A.play("ui", { vol: 0.3, rate: 1.2 + v * 0.12 }); if (!offFx()) FX.burst(P.x + P.w / 2 + P.face * 8, P.y + 12, 3 + v, { col: ["#ffe0a0", "#e0b060"], sp: 50, life: 0.3, size: 1.6, kind: "spark", add: true }); }
    P.w38lad = v; P.w38ladT = 8;
  }
  function entladen(P, it) {
    const n = P.w38lad || 0; if (n <= 0) return;
    P.w38lad = 0; P.w38ladT = 0;
    const dm = Z.dmgOf(P, it, 8 + 7 * n); /* W38 Waffen R2: 8+8·n → 8+7·n (Schildvergleich 20 s gegen 2 Söldner: 675 Schaden, Median der Schilde 564) */
    const p = Z.spawnProj("w38ladung", P.x + P.w / 2 + P.face * 8, P.y + 14, P.face, { dmg: dm, it, eff: { stun: 0.25 + 0.15 * n }, life: 0.14 + 0.05 * n });
    p.w38n = n; p.onHitE = (q, e) => { if (!(e.def && (e.def.boss || e.def.heavy))) { e.vx = q.dir * (180 + 50 * n); e.vy = -60 - 20 * n; } };
    A.play("quake", { vol: 0.3 + 0.08 * n, rate: 1.3 - n * 0.06 }); A.play("hitHeavy", { vol: 0.5 });
    if (FX.addShake) FX.addShake(1 + n);
    if (!offFx()) FX.ring(P.x + P.w / 2 + P.face * 12, P.y + 14, 14 + n * 6, "#ffd27a", 0.3, 3);
    if (n >= LMAX && lvl("ladeschild") >= 3 && !(Z.koop && P === Z.koop.p2)) Z.healPlayer(P.hpMax * 0.05);
    if (n >= 3 && FX.text) FX.text(P.x + P.w / 2, P.y - 12, L(["Entladung!", "Discharge!"]), "#ffd27a", true);
  }
  const sh0 = Z.shieldHook;
  Z.shieldHook = function (ev, P, o, dmg) {
    safe("schild", () => {
      const act = P && P.act, it = (o && o.it) || (act && act.it);
      if (!it || it.id !== "ladeschild") return;
      if (ev === "block") laden(P, 1);
      else if (ev === "parry") laden(P, 2);
      else if (ev === "bashStart") entladen(P, it);
    });
    return sh0 ? sh0.apply(this, arguments) : undefined;
  };

  /* ---------- Kettensichel ---------- */
  Z.SHOT_FX = Z.SHOT_FX || {};
  Z.SHOT_FX.w38sichel = function (P, a, x, y, dm, eff, lv) {
    const h = P.w38hook;
    if (h && h.t > 0) { zug(P, h, a.it); return; }
    const p = Z.spawnProj("w38sichel", x, y, P.face, { dmg: dm, it: a.it, eff });
    p.w38von = Z.koop && Z.koop.p2 && P === Z.koop.p2 ? 2 : 1; /* Koop tauscht Z.player kurz gegen P2 */
    p.onHitE = (q, e) => { q.w38e = true; if (!(e.def && e.def.boss) || true) { P.w38hook = { e, t: 1.6, x: e.x + e.w / 2, y: e.y + e.h / 2 }; A.play("chain", { vol: 0.5, rate: 1.2 }); } };
    p.onEnd = (q, hx, hy) => { if (q.w38e) return; if (q.wall) { P.w38hook = { x: hx, y: hy, t: 1.6 }; A.play("hitMetal", { x: hx, y: hy, vol: 0.4, rate: 1.4 }); if (!offFx()) FX.burst(hx, hy, 5, { col: ["#fff0d0", "#c8c0b8"], sp: 70, life: 0.2, size: 1.2, kind: "spark", add: true }); } };
  };
  function zug(P, h, it) {
    P.w38hook = null;
    const tx = h.e ? h.e.x + h.e.w / 2 : h.x, ty = h.e ? h.e.y + h.e.h / 2 : h.y;
    if (Z.koop && Z.koop.p2 && P === Z.koop.p2) { /* Koop-P2: Gegner heranziehen statt selbst fliegen */
      const e = h.e; if (alive(e) && !(e.def && (e.def.boss || e.def.heavy))) { e.vx = U.sign(P.x - e.x) * 320; e.vy = -120; Z.addStatus(e, "stun", 0.5); A.play("chain", { vol: 0.5 }); }
      return;
    }
    P.w38pull = { tx, ty, e: h.e || null, t: 0.38, it, hit: new Set() };
    A.play("chain", { vol: 0.6, rate: 0.9 }); A.play("swing", { vol: 0.4, rate: 1.3 });
  }
  function zugEnde(P, z, arrived) {
    P.w38pull = null;
    if (z.e && arrived && alive(z.e)) {
      const e = z.e;
      Z.hitEnemy(e, Z.dmgOf(P, z.it, 23), { crit: true, kb: 140, kbUp: 60, eff: Object.assign({ stun: 0.7 }, lvl("kettensichel") >= 3 ? { bleed: 1 } : {}), src: "melee", it: z.it, heavy: true, dir: P.face, wallOk: true });
      if (FX.stop) FX.stop(0.05);
      if (!offFx()) FX.ring(e.x + e.w / 2, e.y + e.h / 2, 22, "#e8e0d8", 0.25, 3);
      P.vx = -P.face * 120; P.vy = -150;
    } else if (!z.e && arrived) { P.vy = -330; P.vx *= 0.3; P.airJumps = Math.max(P.airJumps || 0, 1); A.play("jump", { vol: 0.3, rate: 1.2 }); }
  }
  /* Zug: eigene Bewegung für höchstens 0,38 s (Kollision über moveBody), danach normale Steuerung */
  const up0 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    const z = P && P.w38pull;
    if (!z || P.dead) return up0.apply(this, arguments);
    let done = false;
    safe("zug", () => {
      z.t -= dt; P.time += dt; P.iframe = Math.max(P.iframe, 0.08);
      if (z.e && alive(z.e)) { z.tx = z.e.x + z.e.w / 2; z.ty = z.e.y + z.e.h / 2; }
      const cx = P.x + P.w / 2, cy = P.y + P.h / 2, dx = z.tx - cx, dy = z.ty - cy, d = Math.hypot(dx, dy) || 1;
      const near = z.e ? d < (z.e.w / 2 + 14) : d < 16;
      if (near || z.t <= 0 || (z.e && !alive(z.e))) { zugEnde(P, z, near); done = true; return; }
      P.face = dx > 0 ? 1 : -1;
      const sp = 640; P.vx = dx / d * sp; P.vy = dy / d * sp;
      const ox = P.x, oy = P.y; Z.moveBody(P, dt);
      if (Math.abs(P.x - ox) + Math.abs(P.y - oy) < sp * dt * 0.15) { zugEnde(P, z, false); done = true; return; } /* festgefahren */
      if (lvl("kettensichel") >= 3) for (const e of Z.enemies) if (alive(e) && e !== z.e && !z.hit.has(e) && U.overlap(P, e)) { z.hit.add(e); Z.hitEnemy(e, Z.dmgOf(P, z.it, 10), { kb: 80, eff: { bleed: 1 }, src: "melee", it: z.it, dir: P.face }); }
      if (!offFx() && Math.random() < 0.7) FX.p({ x: cx, y: cy, vx: -P.vx * 0.05, vy: -P.vy * 0.05, life: 0.18, size: 2, col: "#e8e0d8", a: 0.5 });
    });
    if (done) return up0.apply(this, arguments);
  };

  /* ---------- Takt: Glut/Ladung/Haken altern, Lichtblitz auslösen ---------- */
  const ue0 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    const r = ue0.apply(this, arguments);
    safe("takt", () => {
      for (const P of players()) {
        if (P.w38glutT > 0) { P.w38glutT -= dt; if (P.w38glutT <= 0) P.w38glut = 0; }
        if (P.w38ladT > 0) { P.w38ladT -= dt; if (P.w38ladT <= 0 && P.w38lad) { P.w38lad = 0; A.play("ui", { vol: 0.2, rate: 0.6 }); } }
        if (P.w38hook) { const h = P.w38hook; h.t -= dt; if (h.e && !alive(h.e)) h.t = 0; if (h.e && alive(h.e)) { h.x = h.e.x + h.e.w / 2; h.y = h.e.y + h.e.h / 2; } if (h.t <= 0 || !holds(P, "kettensichel")) P.w38hook = null; }
        const a = P.act;
        if (a && a.type === "melee" && a.def && a.def.w38blitz && a.phase === "act" && !a.w38b) { a.w38b = true; blitz(P, a); }
      }
    });
    return r;
  };

  /* ======================= BILDER ======================= */
  /* Waffensymbole im Stil von figuren.js (Griff bei 0, Waffe zeigt nach +x) */
  Z.WICON = Object.assign(Z.WICON || {}, {
    laterne: (c, col, t) => {
      limb(c, -12, 0, 17, 0, 1.7, "#5a4030"); for (let i = -9; i < 12; i += 5) limb(c, i, -1, i + 1, 1, 0.5, "#3a2a1a");
      limb(c, -12, 0, -10, 0, 2.2, "#8a6a40");
      c.strokeStyle = "#6a5a48"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(17, 0); c.lineTo(20, -2.4); c.stroke();
      poly(c, [18, -2.6, 24, -2.6, 23, 4.6, 19, 4.6], "#3a2e26");
      const f = 0.85 + Math.sin((t || 0) * 7) * 0.15;
      poly(c, [19, -1.6, 23, -1.6, 22.4, 3.8, 19.6, 3.8], "rgba(255,200,90," + (0.75 * f).toFixed(2) + ")");
      circ(c, 21, 1.3, 1.2, "#fff4c8"); limb(c, 21, -1.6, 21, 3.8, 0.4, "#2a2018");
      glow(c, 21, 1, 7 + f * 2, "rgba(255,200,90,.55)");
    },
    ladeschild: (c, col, t) => {
      ell(c, 1, 0, 5.2, 11, "#5a4a3a"); ell(c, 1.5, 0, 4, 9.6, "#8a7258");
      limb(c, 1.5, -9, 1.5, 9, 0.6, "#c8a060"); limb(c, -2, 0, 5, 0, 0.6, "#c8a060");
      poly(c, [1.5, -3.4, 3.6, 0, 1.5, 3.4, -0.6, 0], "#ffcf6a"); poly(c, [1.5, -3.4, 3.6, 0, 1.5, 0], "#fff0c0");
      glow(c, 1.5, 0, 5 + Math.sin((t || 0) * 5), "rgba(255,190,80,.5)");
    },
    kettensichel: (c, col, t) => {
      limb(c, -4, 0, 3, 0, 2, "#3a2a1a"); circ(c, -4.4, 0, 1.1, "#8a7a6a");
      c.fillStyle = "#c8c0b8"; c.beginPath(); c.moveTo(3, -1); c.quadraticCurveTo(12, -10, 15, -3); c.quadraticCurveTo(11, -6, 4, 1); c.fill();
      c.strokeStyle = "#f0e8e0"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(4.5, -1.6); c.quadraticCurveTo(11.5, -8.6, 14.4, -3.4); c.stroke();
      c.strokeStyle = "#8a7a6a"; c.lineWidth = 0.9; c.setLineDash([1.2, 0.8]); c.beginPath(); c.moveTo(-4.4, 1); c.quadraticCurveTo(-6, 7, 0, 7); c.quadraticCurveTo(5, 7, 4, 3); c.stroke(); c.setLineDash([]);
    }
  });

  /* Geschosse, Ketten, Laternenschein, Ladeperlen (Weltkoordinaten) */
  function drawSichel(c, s) { c.fillStyle = "#c8c0b8"; c.beginPath(); c.moveTo(-1, 1); c.quadraticCurveTo(4, -6 * s, 7, -1); c.quadraticCurveTo(4, -3 * s, 0, 2); c.fill(); c.fillStyle = "#f0e8e0"; c.fillRect(-2, 0, 2.4, 1.4); }
  function kette(c, x0, y0, x1, y1, t) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.floor(d / 4)), sag = Math.min(10, d * 0.06);
    c.strokeStyle = "#8a7a6a"; c.lineWidth = 0.9;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag * (1 + Math.sin(t * 9) * 0.05);
      c.beginPath(); c.ellipse(x, y, 1.6, 1, Math.atan2(y1 - y0, x1 - x0) + (i % 2 ? 0 : 1.2), 0, 6.283); c.stroke();
    }
  }
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp0) dp0.apply(this, arguments);
    safe("bild", () => {
      const t = (Z.gfx && Z.gfx.time) || 0;
      for (const p of Z.projs) {
        if (p.kind === "w38licht") {
          /* Lichtfächer vom Laternenkopf aus: heller Kegel + Strahlen, wächst und verblasst */
          const u = U.clamp(p.t / (p.life || 0.25), 0, 1), g3 = p.w38g || 0, r = 34 + u * 46 + g3 * 8, dir = p.dir || U.sign(p.vx) || 1, fa = 1 - u * u;
          const ox = -dir * (p.t * Math.abs(p.vx || 360)), a0 = dir > 0 ? -0.62 : Math.PI - 0.62, a1 = dir > 0 ? 0.62 : Math.PI + 0.62;
          c.save(); c.globalCompositeOperation = "lighter"; c.translate(p.x + ox, p.y);
          const g = c.createRadialGradient(0, 0, 2, 0, 0, r);
          g.addColorStop(0, "rgba(255,252,230," + (0.95 * fa).toFixed(2) + ")"); g.addColorStop(0.45, "rgba(255,215,120," + (0.6 * fa).toFixed(2) + ")"); g.addColorStop(1, "rgba(255,180,60,0)");
          c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, a0, a1); c.closePath(); c.fill();
          c.strokeStyle = "rgba(255,244,200," + (0.7 * fa).toFixed(2) + ")"; c.lineWidth = 1.2;
          for (let i = 0; i < 7; i++) { const an = a0 + (a1 - a0) * (i + 0.5) / 7 + Math.sin(p.t * 40 + i) * 0.03, l0 = 6 + u * 10, l1 = r * (0.75 + (i % 2) * 0.2); c.beginPath(); c.moveTo(Math.cos(an) * l0, Math.sin(an) * l0); c.lineTo(Math.cos(an) * l1, Math.sin(an) * l1); c.stroke(); }
          c.fillStyle = "rgba(255,255,240," + fa.toFixed(2) + ")"; c.beginPath(); c.arc(0, 0, 3 + g3, 0, 6.283); c.fill();
          c.restore();
          if (Z.addLight) Z.addLight(p.x, p.y, 60 + (p.w38g || 0) * 15, "#ffd890", 0.6 * (1 - u));
        } else if (p.kind === "w38ladung") {
          const u = U.clamp(p.t / (p.life || 0.2), 0, 1), n = p.w38n || 1, dir = p.dir || U.sign(p.vx) || 1;
          c.save(); c.translate(p.x, p.y); c.globalCompositeOperation = "lighter";
          for (let i = 0; i < Math.min(3, n); i++) { c.strokeStyle = "rgba(255," + (200 + i * 15) + ",120," + ((0.75 - i * 0.18) * (1 - u)).toFixed(2) + ")"; c.lineWidth = 2.4 - i * 0.6; c.beginPath(); c.arc(-dir * (6 + i * 5), 0, 8 + n * 2 + i * 3, dir > 0 ? -0.9 : Math.PI - 0.9, dir > 0 ? 0.9 : Math.PI + 0.9); c.stroke(); }
          c.restore();
        } else if (p.kind === "w38sichel") {
          const P = p.w38von === 2 && Z.koop && Z.koop.p2 ? Z.koop.p2 : Z.player;
          if (P) kette(c, P.x + P.w / 2 + P.face * 4, P.y + 11, p.x, p.y, t);
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot || 0); drawSichel(c, 1); c.restore();
        }
      }
      for (const P of players()) {
        const h = P.w38hook;
        if (h && h.t > 0) {
          kette(c, P.x + P.w / 2 + P.face * 4, P.y + 11, h.x, h.y, t);
          c.save(); c.translate(h.x, h.y); c.rotate(h.e ? 0.4 : -0.6); drawSichel(c, 1); c.restore();
          if (h.t < 1.6 && Math.sin(t * 14) > 0) { c.strokeStyle = "rgba(255,230,180,.7)"; c.lineWidth = 0.8; c.beginPath(); c.arc(h.x, h.y, 5, 0, 6.283); c.stroke(); }
        }
        if (P.w38pull) kette(c, P.x + P.w / 2, P.y + 11, P.w38pull.tx, P.w38pull.ty, t);
        /* Laterne leuchtet (stärker mit Glut) – auch Licht für die Dunkelheit */
        if (holds(P, "laternenstab") && Z.addLight) {
          const g = P.w38glut || 0, f = 1 + Math.sin(t * 7 + P.x * 0.01) * 0.06;
          Z.addLight(P.x + P.w / 2 + P.face * 12, P.y + 6, (70 + g * 14) * f, "#ffcf6a", 0.38 + g * 0.06);
          if (!offFx() && g > 0) { c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < g; i++) { c.fillStyle = "rgba(255,210,110,.85)"; c.fillRect(P.x + P.w / 2 - 4 + i * 4, P.y - 7, 2, 2); } c.restore(); }
        }
        /* Ladeperlen über Ezekiel, solange der Ladeschild geladen ist */
        if (P.w38lad > 0 && holds(P, "ladeschild")) {
          const n = P.w38lad, x0 = P.x + P.w / 2 - (LMAX - 1) * 2.5, y = P.y - 6 - (P.w38glut ? 5 : 0);
          c.save();
          for (let i = 0; i < LMAX; i++) { const on = i < n; c.fillStyle = on ? (n >= LMAX ? "#fff0b0" : "#ffcf6a") : "rgba(40,28,20,.6)"; c.beginPath(); c.arc(x0 + i * 5, y, on ? 1.6 : 1.1, 0, 6.283); c.fill(); }
          if (n >= LMAX && !offFx()) { c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,210,110," + (0.25 + 0.2 * Math.sin(t * 10)).toFixed(2) + ")"; c.beginPath(); c.arc(P.x + P.w / 2 + P.face * 8, P.y + 14, 9, 0, 6.283); c.fill(); }
          c.restore();
        }
      }
    });
  };

  /* ---------- W46 Optik (nur Bild, keine Werte) ----------
     Laternenstab: Glut sah man nur an kleinen Punkten über dem Kopf – jetzt glimmt die Laterne in der Hand selbst heller
     (Hülle um Z.drawPlayer merkt sich die Glut des gerade gezeichneten Spielers; Symbole im Inventar bleiben unverändert). Ladeschild: der Kern glühte nur bei voller Ladung – jetzt wächst ein schwacher Schein mit
     jeder Ladung. Wurfschild (werkzeuge.js, runder Schild): Drehung war unsichtbar, weil der Kreis symmetrisch ist – zwei
     helle Bögen außen am Rand drehen mit (der Schild wird danach gezeichnet), dazu ein kurzer Wischer hinter dem Flug. Alles aus bei Z.gfx.off.w38waffen; Funken
     und Wischer nicht in der sparsamen Grafikstufe. */
  let glut46 = 0;
  const dpl0 = Z.drawPlayer;
  if (dpl0) Z.drawPlayer = function (c, P) { glut46 = (P && P.w38glut) || 0; try { return dpl0.apply(this, arguments); } finally { glut46 = 0; } };
  const li0 = Z.WICON.laterne;
  Z.WICON.laterne = function (c, col, t) {
    li0(c, col, t);
    if (glut46 > 0 && !offFx()) { const f = 0.85 + Math.sin((t || 0) * 9) * 0.15; glow(c, 21, 1, 7 + glut46 * 3.5 * f, "rgba(255,205,110," + (0.2 + glut46 * 0.14).toFixed(2) + ")"); circ(c, 21, 1.3, 1.2 + glut46 * 0.4, glut46 >= 3 ? "#fffbe8" : "#fff4c8"); }
  };
  const leanQ = () => !!(Z.gq && (Z.gq.lean || Z.gq.mini || Z.gq.level === 0));
  const dp1 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp1) dp1.apply(this, arguments);
    if (offFx()) return;
    safe("bild46", () => {
      const t = (Z.gfx && Z.gfx.time) || 0, lo = leanQ();
      for (const P of players()) {
        const n = P.w38lad || 0;
        if (n > 0 && n < LMAX && holds(P, "ladeschild")) glow(c, P.x + P.w / 2 + P.face * 8, P.y + 14, 4 + n * 1.6, "rgba(255,200,100," + (0.12 + n * 0.06).toFixed(2) + ")");
      }
      for (const g of Z.gadgets || []) {
        if (g.k !== "boomerang" || !g.it || g.it.id !== "wurfschild") continue;
        const sp = Math.hypot(g.vx || 0, g.vy || 0) || 1;
        if (!lo) { c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(232,212,170,.35)"; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(g.x - g.vx / sp * 4, g.y - g.vy / sp * 4); c.lineTo(g.x - g.vx / sp * 16, g.y - g.vy / sp * 16); c.stroke(); c.restore(); }
        c.save(); c.translate(g.x, g.y); c.rotate(g.rot || 0);
        c.strokeStyle = "#f4e4bc"; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, 6.6, -0.55, 0.55); c.stroke(); c.beginPath(); c.arc(0, 0, 6.6, Math.PI - 0.55, Math.PI + 0.55); c.stroke();
        c.restore();
      }
    });
  };

  Z.w38waffen = { ids: ["laternenstab", "ladeschild", "kettensichel"] };
})();
