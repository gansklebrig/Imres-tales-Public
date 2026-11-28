/* Ezekiel – The Destroyer · Kampfkunst
   Spieler: Sturzangriffe je Waffe (wie ein „Down-Air“), Aufwärtshieb (Hoch + Angriff), Sturmstoß direkt nach der Rolle, neue Waffen.
   Paarungen: bestimmte Ausrüstungs-Kombinationen schalten Zusatzwirkungen frei.
   Gegner: mehr Angriffe je Typ, Kombo-Ketten, Ausweichen, Konter gegen Hämmern, mehr Schaden – aber alles mit klarer Vorwarnung. */
(function () {
  "use strict";
  /* Verzögerungen in Spielzeit (Pause/Zeitlupe/Gebietswechsel-sicher), sonst Rückfall auf setTimeout */
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : window.setTimeout(fn, ms));
  const Z = window.Z, U = Z.U, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const inp = Z.input, { limb, circ, poly, ell, glow } = Z.draw;
  const alive = e => e && !e.dead && !(e.intro > 0);
  const big = e => e.def.boss || e.def.heavy;
  const wd = it => (it ? Z.WEAPONS[it.id] : Z.WEAPONS.faeuste);
  const has = id => { const P = Z.player; if (!P) return false; for (const s of ["a1", "a2", "s1", "s2"]) if (P.slots[s] && P.slots[s].id === id) return true; return false; };

  /* ======================= SPIELER: SONDERANGRIFFE ======================= */
  function meleeAct(P, s, it, d, def) {
    P.act = { slot: s, it, d, def, type: "melee", step: 9, phase: "pre", t: 0, speed: 1 + (Z.hasAff(it, "flink") ? 0.18 : 0), hit: new Set(), lungeT: 0 };
    P.combo[s] = 0; P.comboT[s] = 0;
    if (inp.held.left && !inp.held.right) P.face = -1; else if (inp.held.right && !inp.held.left) P.face = 1;
  }
  const base = d => (d.combo ? Math.max(...d.combo.map(c => c.dmg)) : 12);
  Z.attackMod = function (P, s, it, d) {
    if (!d || d.kind !== "melee") return false;
    const c0 = d.combo[0];
    /* Sturmstoß: Angriff direkt aus der Rolle */
    if (P.afterRoll > 1.74 && P.onGround) {
      meleeAct(P, s, it, d, { pre: 0.04, act: 0.13, post: 0.22, dmg: base(d) * 1.5, box: [-2, -26, 34, 24], lunge: 330, kb: 220, kbUp: 80, crit: "always", critMul: 1.5, sw: c0.sw || "slash", heavy: true, smear: { r: 28, a0: -0.08, a1: 0.08, th: 6, stab: true } });
      FX.text(P.x + P.w / 2, P.y - 10, L(["Sturmstoß!", "Dash strike!"]), "#ffd27a"); return true;
    }
    /* Aufwärtshieb: wirft leichte Gegner hoch – dann hinterherspringen */
    if (inp.held.up && P.onGround) {
      meleeAct(P, s, it, d, { pre: 0.07, act: 0.12, post: 0.22, dmg: base(d) * 1.1, box: [-4, -46, 28, 46], lunge: 30, kb: 30, kbUp: 460, sw: c0.sw || "slash", heavy: true, smear: { r: 24, a0: 1.7, a1: -1.6, th: 8 },
        onHit: (P2, e) => { if (!big(e)) { e.vy = -470; e.onGround = false; e.kbT = 0.4; Z.addStatus(e, "stun", 0.6); } } });
      return true;
    }
    return false;
  };

  /* ---------- Sturzangriffe: Runter + Angriff in der Luft, je Waffe eigen ---------- */
  const DIVE = {
    fist: "meteor", stonefist: "meteor", sickles: "wirbel", scimitar: "wirbel", claw: "wirbel", krallen: "wirbel", dagger: "meuchel", rapier: "meuchel",
    dawn: "morgen", hammer: "beben", club: "beben", flegel: "beben", scythe: "mond", whip: "kette", anchor: "kette", spear: "pfahl", hellebarde: "pfahl", axe: "glut",
    zweihaender: "beben", kampfstab: "pfahl",
    bow: "regen", xbow: "salve", knives: "faecher", vial: "phiole", staff: "blitz", web: "netz", schleuder: "faecher", feuerkugel: "phiole", eiszapfen: "faecher"
  };
  const DIVEN = { meteor: ["Meteor", "Meteor"], wirbel: ["Wirbelsturz", "Spin dive"], meuchel: ["Meuchelsturz", "Assassin dive"], morgen: ["Morgenfall", "Dawnfall"], beben: ["Erdbeben", "Earthquake"], mond: ["Sensenmond", "Reaper moon"], kette: ["Kettensturz", "Chain dive"], pfahl: ["Pfähler", "Impaler"], glut: ["Glutsturz", "Ember dive"], schild: ["Schildsurfer", "Shield surfer"] };
  Z.DIVEN = DIVEN;
  function styleOf(d) { if (d.kind === "shield") return "schild"; return DIVE[d.icon] || (d.kind === "ranged" ? "faecher" : "meteor"); }
  Z.diveStart = function (P, s, it, d) {
    const st = styleOf(d);
    if (d.kind === "ranged") {
      if ((P.diveShots || 0) >= 2) return true;
      P.diveShots = (P.diveShots || 0) + 1;
      const x = P.x + P.w / 2, y = P.y + P.h - 4, dm = Z.dmgOf(P, it, (d.shoot.dmgFull || d.shoot.dmg || 8) * 0.9), eff = {};
      it && it.aff.forEach(af => { const ad = Z.AFFIX[af]; if (ad.eff) Object.assign(eff, ad.eff); });
      if (st === "regen") for (let i = 0; i < 5; i++) Z.spawnProj("pfeil", x, y, 1, { vx: (i - 2) * 70, vy: 460, dmg: dm * 0.6, it, eff });
      else if (st === "salve") for (let i = 0; i < 3; i++) Z.spawnProj("bolzen", x + (i - 1) * 6, y, 1, { vx: 0, vy: 600, dmg: dm, it, eff, pierce: true });
      else if (st === "faecher") for (let i = 0; i < 6; i++) Z.spawnProj("messer", x, y, 1, { vx: (i - 2.5) * 90, vy: 420, dmg: dm * 0.5, it, eff: Object.assign({ bleed: 1 }, eff) });
      else if (st === "phiole") for (let i = 0; i < 2; i++) Z.spawnProj("phiole", x, y, 1, { vx: (i ? 40 : -40), vy: 200, dmg: dm, it, eff });
      else if (st === "blitz") { const gy = W.groundBelow(x, y, 300) || y + 100; Z.bolts.push({ x0: x, y0: y, x1: x, y1: gy, t: 0, life: 0.25 }); A.play("zap", { vol: 0.6 }); for (const e of Z.enemies) if (alive(e) && Math.abs(e.x + e.w / 2 - x) < 18 && e.y > y - 4 && e.y < gy + 4) Z.hitEnemy(e, dm * 1.3, { src: "ranged", it, eff: { stun: 0.6 } }); }
      else if (st === "netz") Z.spawnProj("netz", x, y, 1, { vx: 0, vy: 380, dmg: dm * 0.3, it, eff: { root: 2.4, mark: 3 } });
      P.vy = Math.min(P.vy, -190); A.play(d.shoot.sw || "bow", { vol: 0.5 });
      return true;
    }
    P.plunge = true; P.plungeItem = it; P.diveStyle = st; P.diveD = d; P.diveT = 0; P.diveHits = new Set();
    P.vx = st === "meuchel" ? P.face * 300 : 0; P.vy = st === "meuchel" ? 520 : st === "wirbel" ? 420 : 660;
    if (st === "schild") P.iframe = Math.max(P.iframe, 0.15);
    A.play("swingHeavy", { vol: 0.7, rate: st === "wirbel" ? 1.4 : 1 });
    return true;
  };
  const POGO = { pfahl: 1, meuchel: 1, meteor: 1, schild: 1 };
  function diveTick(P, dt) {
    diveClock += dt; if (P.bebenT > 0) P.bebenT -= dt;
    if (P.onGround) P.diveShots = 0;
    /* Hängender Sturz (Leiter, Gebietswechsel, Boden ohne Landung): beenden, sonst wirbelt er endlos weiter */
    if (P.plunge && (P.onGround || P.climbing || P.ledge || P.grapple || P.dead || P.grabbed)) { P.plunge = false; P.diveStyle = null; P.diveRecPend = false; }
    if (!P.plunge || !P.diveStyle) return;
    const st = P.diveStyle, it = P.plungeItem, d = P.diveD || wd(it);
    P.diveT += dt;
    if (st === "meuchel") P.vx = P.face * 300;
    if (st === "wirbel") { P.vy = Math.min(P.vy, 430); if (Math.random() < dt * 60) FX.p({ x: P.x + P.w / 2 + (Math.random() - 0.5) * 26, y: P.y + P.h * Math.random(), vx: 0, vy: -40, life: 0.2, size: 2, col: d.col || "#ff5a4e", kind: "spark", add: true }); }
    if (Math.random() < dt * 50) FX.p({ x: P.x + P.w / 2, y: P.y + 4, vx: 0, vy: -60, life: 0.25, size: 3, col: "rgba(255,200,150,.5)", kind: "smoke" });
    const r = st === "wirbel" ? { x: P.x - 10, y: P.y, w: P.w + 20, h: P.h + 6 } : { x: P.x - 3, y: P.y + P.h - 6, w: P.w + 6, h: 12 };
    for (const e of Z.enemies) {
      if (!alive(e) || !U.overlap(r, e)) continue;
      if (st === "wirbel") { const k = Math.floor(P.diveT / 0.07); if (P.diveHits.has(e.uid + "_" + k)) continue; e.uid = e.uid || Math.random(); P.diveHits.add(e.uid + "_" + k); Z.hitEnemy(e, Z.dmgOf(P, it, base(d) * 0.32), { src: "melee", it, kb: 20, kbUp: 40, dir: U.sign(e.x - P.x) || 1 }); continue; }
      if (POGO[st]) {
        { const n = diveMul(e); if (Z.stats) Z.stats.divesHit = (Z.stats.divesHit || 0) + 1; /* W9: auch Abprall-Treffer (Teufels-Pogo) mit abnehmendem Ertrag, Betäubung nur beim ersten */
          Z.hitEnemy(e, Z.dmgOf(P, it, base(d) * (st === "meuchel" ? 1.6 : 1.3)) * DIVE_DR[n], { src: "melee", it, crit: st === "meuchel" && n === 0, kb: 60, kbUp: 120, heavy: n === 0, eff: n > 0 ? null : st === "schild" ? { stun: 1 } : st === "meteor" ? { stun: 0.5 } : null, dir: P.face }); }
        if (Z.pogoOn && Z.pogoOn(P)) { P.plunge = false; P.diveStyle = null; P.vy = -470; P.vx *= 0.4; P.airJumps = 1; P.cut = true; P.diveShots = 0; P.diveLock = false; FX.ring(P.x + P.w / 2, P.y + P.h, 26, "#ff6ae0", 0.3, 3); }
        else { P.plunge = false; P.diveStyle = null; P.vy = -120; P.vx = -P.face * 60; P.airJumps = 0; P.cut = true; P.diveShots = 0; P.diveLock = true; P.diveRecPend = true; }
        FX.stop(0.06); FX.ring(P.x + P.w / 2, P.y + P.h, 18, "#ffd27a", 0.25, 3);
        A.play(st === "schild" ? "block" : "hitHeavy", { vol: 0.6 }); Z.vib("hitHeavy"); /* W20 Steuerung */
        return;
      }
    }
  }
  /* W9 (Abuse-Bot): Sturzangriff-Spam aus kleinen Hüpfern war 7–20× so stark wie die Kombo (Kriegshammer/Keule/Zweihänder/Flegel
     „Erdbeben“: Elite in 0,8 s, Dauer-Betäubung). Jetzt: je Ziel abnehmender Ertrag für Sturz-Treffer kurz hintereinander
     (1 → 0,6 → 0,4 → 0,25; nach 1,6 s Pause wieder voll) und Betäubung nur beim ersten Sturz-Treffer der Reihe.
     Der erste Sturz in eine Gruppe bleibt voll; schwere Erdbeben-Stürze brauchen etwas länger zum Aufstehen. */
  const DIVE_DR = [1, 0.6, 0.4, 0.25];
  let diveClock = 0;
  Z.kkClock = () => diveClock; /* Spielzeit-Uhr für Abklingzeiten in kampf.js (Schild) */
  function diveMul(e) {
    const n = e._dvT != null && diveClock - e._dvT < 1.6 ? Math.min(DIVE_DR.length - 1, (e._dvN || 0) + 1) : 0;
    e._dvT = diveClock; e._dvN = n; return n;
  }
  Z.diveLand = function (P) {
    const st = P.diveStyle; P.diveStyle = null; if (!st) return false;
    const it = P.plungeItem, d = P.diveD || wd(it), cx = P.x + P.w / 2, fy = P.y + P.h, b = base(d);
    let landed = false;
    const hitDive = (e, dmg, o) => { const n = diveMul(e); if (!landed && Z.stats) { landed = true; Z.stats.divesHit = (Z.stats.divesHit || 0) + 1; } o = Object.assign({ src: "melee", it, heavy: n === 0, dir: U.sign(e.x - P.x) || 1 }, o); if (n > 0 && o.eff && (o.eff.stun || o.eff.root)) { o.eff = Object.assign({}, o.eff); delete o.eff.stun; delete o.eff.root; o.kbUp = Math.min(o.kbUp || 0, 60); } Z.hitEnemy(e, dmg * DIVE_DR[n], o); };
    const ring = (rad, dmg, o, col) => { FX.ring(cx, fy, rad, col || "#ff8a5a", 0.35, 4); for (const e of Z.enemies) if (alive(e) && Math.abs(e.x + e.w / 2 - cx) < rad && Math.abs(e.y + e.h - fy) < 34) hitDive(e, dmg, o); Z.hitProps && Z.hitProps({ x: cx - rad, y: fy - 30, w: rad * 2, h: 34 }, dmg, null); };
    const dust = n => FX.burst(cx, fy, n, { col: [Z.dustCol || "#8a7a70", "#ff7a4a"], sp: 170, ang: -Math.PI / 2, spread: 2.8, life: 0.5, size: 3, kind: "smoke" });
    A.play("land", { vol: 0.8 }); P.vy = 0; P.diveRec = 0.32; P.diveRecPend = false;
    switch (st) {
      case "beben": { FX.addShake(10); FX.stop(0.08); A.play("quake", { vol: 0.8 }); dust(30); const fresh = !(P.bebenT > 0); ring(92, Z.dmgOf(P, it, b * 1.7), { kb: 120, kbUp: 300, eff: { stun: 0.7 } }, "#e5a43a");
        /* Steinspitzen nur, wenn das letzte Erdbeben eine Weile her ist (sonst Spitzen-Teppich beim Hüpfen) */
        if (fresh) for (const dir of [-1, 1]) for (let i = 0; i < 3; i++) later(() => Z.spawnHazard({ kind: "rockspike", x: cx + dir * (30 + i * 20), y: fy, w: 14, life: 0.45, dmg: Z.dmgOf(P, it, b * 0.5), owner: "p", kbUp: 320, once: true }), i * 70);
        P.bebenT = 1.2; P.diveRecX = 0.16; break; }
      case "meteor": FX.addShake(6); dust(18); ring(56, Z.dmgOf(P, it, b * 1.6), { kb: 80, kbUp: 380 }); break;
      case "morgen": FX.addShake(6); dust(14); ring(50, Z.dmgOf(P, it, b * 1.4), { kb: 100, kbUp: 200 }, "#ffd27a"); for (const dir of [-1, 1]) Z.spawnProj("lichtwelle", cx + dir * 10, P.y + 8, dir, { dmg: Z.dmgOf(P, it, b * 0.8), it }); FX.flashScreen("#fff0c0", 0.2); break;
      case "mond": FX.addShake(5); dust(12); ring(40, Z.dmgOf(P, it, b), { kb: 80 }); for (const dir of [-1, 1]) Z.spawnProj("glutsichel", cx + dir * 10, P.y + 12, dir, { dmg: Z.dmgOf(P, it, b * 0.9), it }); break;
      case "glut": FX.addShake(5); dust(12); ring(48, Z.dmgOf(P, it, b * 1.2), { eff: { burn: 2 }, kb: 80, kbUp: 120 }, "#ff6a1a"); Z.spawnHazard({ kind: "fire", x: cx, y: fy, w: 96, life: 3, dmg: Z.dmgOf(P, it, b * 0.25), owner: "p", eff: { burn: 1 } }); A.play("fireBig", { vol: 0.5 }); break;
      case "kette": FX.addShake(4); dust(10); A.play("chain", { vol: 0.7 }); for (const e of Z.enemies) if (alive(e) && !big(e) && Math.abs(e.x - cx) < 120 && Math.abs(e.y + e.h - fy) < 60) { e.vx = U.sign(cx - e.x) * 300; e.kbT = 0.25; } ring(44, Z.dmgOf(P, it, b * 1.2), { kb: 0, eff: { stun: 0.8 } }, "#9a8a7a"); break;
      case "wirbel": dust(8); ring(36, Z.dmgOf(P, it, b * 0.9), { kb: 140, kbUp: 100 }, d.col); break;
      case "pfahl": case "meuchel": dust(6); ring(26, Z.dmgOf(P, it, b), { kb: 60 }); break;
      case "schild": FX.addShake(5); dust(12); A.play("block", { vol: 0.8, rate: 0.7 }); ring(50, Z.dmgOf(P, it, (d.shield ? d.shield.bash : 10) * 1.5), { kb: 160, kbUp: 160, eff: { stun: 1.4 } }, "#e8e0d8"); P.iframe = Math.max(P.iframe, 0.25); break;
      default: return false;
    }
    if (P.diveRecX) { P.diveRec += P.diveRecX; P.diveRecX = 0; }
    FX.text(cx, P.y - 10, L(DIVEN[st] || ["Sturz", "Dive"]), "#ffd27a");
    return true;
  };

  /* ======================= NEUE WAFFEN ======================= */
  const WP = Z.WEAPONS;
  Object.assign(WP, {
    zweihaender: { n: ["Bluthand-Zweihänder", "Bloodhand Greatsword"], kind: "melee", stat: "brut", find: "selten", tier: 1, icon: "zweihaender", col: "#c84040",
      d: ["Drei weite, schwere Schwünge. Der dritte dreht sich einmal um Ezekiel und schleudert alles weg. Rüstung während des Schwungs.", "Three wide, heavy swings. The third spins once around Ezekiel and flings everything away. Armoured while swinging."],
      combo: [
        { pre: 0.16, act: 0.12, post: 0.2, dmg: 26, box: [-6, -34, 46, 34], lunge: 60, kb: 160, sw: "swingHeavy", heavy: true, smear: { r: 36, a0: -2.2, a1: 1.2, th: 12 } },
        { pre: 0.14, act: 0.12, post: 0.2, dmg: 26, box: [-6, -34, 46, 34], lunge: 60, kb: 160, sw: "swingHeavy", heavy: true, smear: { r: 36, a0: 1.4, a1: -1.8, th: 12 } },
        { pre: 0.22, act: 0.18, post: 0.36, dmg: 44, box: [-30, -36, 60, 38], lunge: 40, kb: 300, kbUp: 160, sw: "swingHeavy", heavy: true, spin: true, smear: { r: 38, a0: -3.1, a1: 3.1, th: 14 } }
      ], tags: ["schwer", "Gruppe"], master: ["Meisterschaft: Der Drehschwung zieht Gegner zuerst heran.", "Mastery: the spin pulls enemies in first."] },
    kampfstab: { n: ["Mönchsstab", "Monk's Staff"], kind: "melee", stat: "takt", find: "haeufig", tier: 0, icon: "kampfstab", col: "#c8a060",
      d: ["Fünf schnelle Stöße mit großer Reichweite, vorn und hinten. Treffer in der Luft sind kritisch.", "Five quick strikes with long reach, front and back. Hits on airborne foes crit."],
      combo: [
        { pre: 0.05, act: 0.07, post: 0.07, dmg: 8, box: [2, -24, 40, 12], lunge: 40, kb: 60, sw: "punch", smear: { r: 34, a0: -0.05, a1: 0.05, th: 4, stab: true } },
        { pre: 0.05, act: 0.07, post: 0.07, dmg: 8, box: [-36, -24, 36, 12], lunge: 20, kb: 60, sw: "punch", smear: { r: 30, a0: 3.0, a1: 3.2, th: 4 } },
        { pre: 0.05, act: 0.08, post: 0.07, dmg: 9, box: [-10, -40, 40, 30], lunge: 30, kb: 40, kbUp: 260, sw: "swing", smear: { r: 30, a0: 1.6, a1: -1.4, th: 6 } },
        { pre: 0.05, act: 0.07, post: 0.07, dmg: 9, box: [2, -24, 44, 14], lunge: 60, kb: 80, sw: "punch", smear: { r: 38, a0: -0.05, a1: 0.05, th: 4, stab: true } },
        { pre: 0.1, act: 0.14, post: 0.24, dmg: 16, box: [-38, -32, 80, 30], lunge: 30, kb: 220, sw: "swingHeavy", heavy: true, spin: true, smear: { r: 36, a0: -3.1, a1: 3.1, th: 6 } }
      ], crit: "air", tags: ["schnell", "Reichweite"], master: ["Meisterschaft: Der fünfte Schlag lässt eine Druckwelle los.", "Mastery: the fifth strike releases a shockwave."] },
    krallen: { n: ["Wolfskrallen", "Wolf Claws"], kind: "melee", stat: "brut", find: "haeufig", tier: 0, icon: "krallen", col: "#d8c8b0",
      d: ["Sechs rasend schnelle Hiebe, jeder lässt bluten. Blutende Gegner werden kritisch getroffen.", "Six frenzied slashes, each causes bleeding. Bleeding enemies take critical hits."],
      combo: [0, 1, 2, 3, 4, 5].map(i => ({ pre: 0.03, act: 0.05, post: i === 5 ? 0.2 : 0.05, dmg: i === 5 ? 10 : 5, box: [0, -24, 22, 18], lunge: i === 5 ? 120 : 40, kb: i === 5 ? 160 : 20, sw: "slash", eff: { bleed: 1 }, heavy: i === 5, smear: { r: 18, a0: i % 2 ? 1.1 : -1.1, a1: i % 2 ? -0.9 : 0.9, th: 4 } })),
      crit: "bleeding", critMul: 1.7, tags: ["schnell", "blutung"], master: ["Meisterschaft: Kills mit den Krallen heilen 3 %.", "Mastery: kills with the claws heal 3%."] },
    flegel: { n: ["Morgenstern", "Morning Star"], kind: "melee", stat: "ueber", find: "selten", tier: 1, icon: "flegel", col: "#a8a0a0",
      d: ["Zwei langsame, verheerende Schläge. Jeder Treffer betäubt. Der zweite Schlag erzeugt eine Bodenwelle.", "Two slow, devastating blows. Every hit stuns. The second blow sends a ground wave."],
      combo: [
        { pre: 0.24, act: 0.12, post: 0.26, dmg: 30, box: [-2, -36, 40, 36], lunge: 40, kb: 200, kbUp: 120, sw: "swingHeavy", heavy: true, eff: { stun: 0.9 }, smear: { r: 34, a0: -2.4, a1: 1.0, th: 10 } },
        { pre: 0.3, act: 0.14, post: 0.4, dmg: 42, box: [0, -40, 42, 40], lunge: 60, kb: 260, kbUp: 200, sw: "swingHeavy", heavy: true, eff: { stun: 1.2 }, quake: true, smear: { r: 38, a0: -2.6, a1: 1.4, th: 12 } }
      ], crit: "stunned", tags: ["schwer", "Kontrolle"], master: ["Meisterschaft: Betäubte Gegner nehmen doppelten Schaden.", "Mastery: stunned enemies take double damage."] },
    hellebarde: { n: ["Hellebarde der Torwache", "Gate Guard's Halberd"], kind: "melee", stat: "ueber", find: "selten", tier: 0, icon: "hellebarde", col: "#c0b8b0",
      d: ["Zwei weite Stiche und ein Schwung, der Gegner auf Abstand hält. Treffer mit der Spitze sind kritisch.", "Two long thrusts and a sweep that keeps foes at bay. Hits with the tip crit."],
      combo: [
        { pre: 0.08, act: 0.08, post: 0.12, dmg: 16, box: [8, -26, 50, 12], lunge: 50, kb: 120, sw: "stab", smear: { r: 50, a0: -0.04, a1: 0.04, th: 4, stab: true } },
        { pre: 0.08, act: 0.08, post: 0.12, dmg: 16, box: [8, -20, 50, 12], lunge: 50, kb: 120, sw: "stab", smear: { r: 50, a0: 0.1, a1: 0.14, th: 4, stab: true } },
        { pre: 0.16, act: 0.14, post: 0.3, dmg: 26, box: [-4, -40, 56, 40], lunge: 40, kb: 280, kbUp: 120, sw: "swingHeavy", heavy: true, smear: { r: 48, a0: -2.0, a1: 1.2, th: 10 } }
      ], crit: "tip" /* W9 R15: Stiche 14 → 16, Schwung 24 → 26 (gegen Bosse ohne Rückstoß selten Spitzentreffer: Erzpriesterin 48–78 s statt 24 s) */, tags: ["Reichweite", "Abstand"], master: ["Meisterschaft: Der Schwung reißt auch Gegner hinter dir mit.", "Mastery: the sweep also catches foes behind you."] },
    schleuder: { n: ["Kobold-Schleuder", "Kobold Sling"], kind: "ranged", stat: "takt", find: "haeufig", tier: 0, icon: "schleuder", col: "#9a8a7a",
      d: ["Steine, die zweimal von Wänden abprallen und kurz betäuben. Perfekt für Banden-Schüsse um die Ecke.", "Stones that ricochet off walls twice and briefly stun. Perfect for trick shots."],
      shoot: { pre: 0.08, post: 0.2, proj: "stein", dmg: 9, sw: "swing" }, tags: ["Kontrolle", "Abpraller"], master: ["Meisterschaft: Steine prallen viermal ab.", "Mastery: stones ricochet four times."] },
    feuerkugel: { n: ["Glasstabs Feuerbuch", "Glasstaff's Fire Tome"], kind: "ranged", stat: "ueber", find: "selten", tier: 1, icon: "feuerkugel", col: "#ff8a3a",
      d: ["Eine langsame Feuerkugel, die beim Aufprall explodiert und alles in Brand setzt.", "A slow fireball that explodes on impact and sets everything ablaze."],
      shoot: { pre: 0.2, post: 0.35, proj: "feuerkugel", dmg: 26, sw: "fire" }, tags: ["Brand", "Explosion"], master: ["Meisterschaft: Die Explosion hinterlässt Flammen.", "Mastery: the explosion leaves flames behind."] },
    eiszapfen: { n: ["Eiszapfenstab", "Icicle Staff"], kind: "ranged", stat: "takt", find: "selten", tier: 1, icon: "eiszapfen", col: "#eef6f2",
      d: ["Drei Eiszapfen im Fächer. Sie verlangsamen; jeder fünfte Treffer friert ein.", "Three icicles in a fan. They slow; every fifth hit freezes."],
      shoot: { pre: 0.1, post: 0.24, proj: "eis", dmg: 7, sw: "glass" }, tags: ["Kontrolle", "Frost"], master: ["Meisterschaft: Fünf Zapfen statt drei.", "Mastery: five icicles instead of three."] }
  });
  Object.assign(Z.PK, {
    stein: { speed: 430, g: 260, r: 2.5, life: 1.4, col: "#a89a8a", spin: true },
    feuerkugel: { speed: 230, g: 0, r: 5, life: 1.8, col: "#ff8a3a", glow: "#ff6a1a", fire: true },
    eis: { speed: 500, g: 50, r: 2, life: 1, col: "#eef6f2", trail: "#ffffff" }
  });
  let iceCount = 0;
  Z.SHOT_FX = Object.assign(Z.SHOT_FX || {}, {
    stein: (P, a, x, y, dm, eff, lv) => Z.spawnProj("stein", x, y, P.face, { dmg: dm, it: a.it, eff: Object.assign({ stun: 0.35 }, eff), bounce: lv >= 3 ? 4 : 2 }),
    feuerkugel: (P, a, x, y, dm, eff, lv) => Z.spawnProj("feuerkugel", x, y, P.face, { dmg: dm * 0.4, it: a.it, eff,
      onEnd: (p, hx, hy) => { Z.explode(hx, hy, 46, dm, "p", { burn: 2 }); if (lv >= 3) Z.spawnHazard({ kind: "fire", x: hx, y: Z.groundY(hx, hy), w: 60, life: 3, dmg: dm * 0.15, owner: "p", eff: { burn: 1 } }); } }),
    eis: (P, a, x, y, dm, eff, lv) => { const n = lv >= 3 ? 5 : 3; for (let i = 0; i < n; i++) Z.spawnProj("eis", x, y, P.face, { vy: (i - (n - 1) / 2) * 70, dmg: dm, it: a.it, eff: Object.assign({ slow: 1.5 }, eff),
      onHitE: (p, e) => { if (++iceCount % 5 === 0) { Z.addStatus(e, "stun", 1.6); e.frozenT = e.st.stun; } } }); }
  });
  /* Waffensymbole */
  Z.WICON = Object.assign(Z.WICON || {}, {
    zweihaender: c => { limb(c, -4, 0, 2, 0, 2.2, "#3a2020"); limb(c, 2, -3, 2, 3, 1.4, "#c8a060"); poly(c, [2, -2, 20, -1.2, 22, 0, 20, 1.2, 2, 2], "#d8d0c8"); limb(c, 4, 0, 18, 0, 0.6, "#c84040"); },
    kampfstab: c => { limb(c, -12, 0, 16, 0, 1.8, "#8a6a40"); limb(c, -12, 0, -9, 0, 2.2, "#c8a060"); limb(c, 13, 0, 16, 0, 2.2, "#c8a060"); },
    krallen: c => { ell(c, 0, 0, 3, 2.5, "#4a3a30"); for (let i = -1; i <= 1; i++) poly(c, [2, i * 2 - 0.6, 10, i * 3, 2, i * 2 + 0.6], "#e8e0d0"); },
    flegel: c => { limb(c, -4, 0, 4, 0, 2, "#5a4030"); limb(c, 4, 0, 10, 3, 0.6, "#8a8480"); circ(c, 12, 4, 3.4, "#7a7476"); for (let i = 0; i < 6; i++) { const a = i * 1.047; limb(c, 12 + Math.cos(a) * 3, 4 + Math.sin(a) * 3, 12 + Math.cos(a) * 5, 4 + Math.sin(a) * 5, 0.8, "#c8c0c4"); } },
    hellebarde: c => { limb(c, -10, 0, 18, 0, 1.4, "#6a4a2a"); poly(c, [16, -1, 24, 0, 16, 1], "#d8d0c8"); poly(c, [15, -1, 15, -6, 19, -2], "#c0b8b0"); poly(c, [15, 1, 15, 4, 13, 1], "#c0b8b0"); },
    schleuder: c => { limb(c, -3, 0, 3, 0, 1.6, "#6a4a2a"); limb(c, 3, 0, 7, -4, 1.2, "#6a4a2a"); limb(c, 3, 0, 7, 4, 1.2, "#6a4a2a"); c.strokeStyle = "#c8b090"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(7, -4); c.lineTo(4, 0); c.lineTo(7, 4); c.stroke(); circ(c, 4, 0, 1.4, "#a89a8a"); },
    feuerkugel: c => { poly(c, [-6, -5, 6, -5, 6, 5, -6, 5], "#6a2a1a"); poly(c, [-5, -4, 5, -4, 5, 4, -5, 4], "#8a3a22"); glow(c, 0, 0, 6, "rgba(255,140,40,.7)"); circ(c, 0, 0, 2, "#ffd27a"); },
    eiszapfen: c => { limb(c, -10, 0, 10, 0, 1.4, "#8a8a90"); poly(c, [10, -3, 18, 0, 10, 3], "#eef6f2"); glow(c, 12, 0, 5, "rgba(230,250,245,.6)"); }
  });

  /* ======================= PAARUNGEN ======================= */
  const any = ids => ids.some(has);
  const SYN = [
    { id: "eisbrecher", n: ["Eisbrecher", "Icebreaker"], d: ["Frost + schwere Waffe: gefrorene Gegner zerspringen mit dreifachem Schaden.", "Frost + heavy weapon: frozen foes shatter for triple damage."], ok: () => any(["frostgranate", "frostschild", "eiszapfen"]) && any(["kriegshammer", "riesenkeule", "flegel", "steinfaust", "zweihaender"]) },
    { id: "netzjaeger", n: ["Netz & Pfeil", "Web & Arrow"], d: ["Fesseln + Fernkampf: gefesselte Gegner nehmen 50 % mehr Fernkampfschaden und werden immer kritisch getroffen.", "Roots + ranged: rooted foes take 50% more ranged damage and always crit."], ok: () => any(["netzdruese", "ranken", "baerenfalle", "kraehenfuesse"]) && any(["bogen", "armbrust", "wurfmesser", "schleuder", "eiszapfen", "bolzenwerfer"]) },
    { id: "blutrausch", n: ["Blutrausch", "Blood Frenzy"], d: ["Zwei Blutungsquellen: Blutende nehmen 30 % mehr Schaden, jeder Kill heilt 3 %.", "Two bleed sources: bleeding foes take 30% more damage, every kill heals 3%."], ok: () => [["sicheln"], ["krallen"], ["krummsaebel"], ["messerfaecher"], ["kraehenfuesse"], ["blinkstein"], ["wurfmesser"], ["splittergranate"]].filter(any).length >= 2 },
    { id: "feuersturm", n: ["Feuersturm", "Firestorm"], d: ["Zwei Brandquellen: brennende Gegner explodieren beim Tod.", "Two fire sources: burning foes explode on death."], ok: () => [["glutaxt"], ["feuerkugel"], ["phiolen"], ["brandtopf"], ["feuerturm"], ["lavaschild"], ["sprengphiole"]].filter(any).length >= 2 },
    { id: "donnerschild", n: ["Gewitterfront", "Storm Front"], d: ["Zwei Blitzquellen: jeder Kettenblitz springt zwei Ziele weiter.", "Two lightning sources: every chain lightning jumps two more targets."], ok: () => [["funkenschild"], ["blitzstab"], ["echoblitz"], ["donnerkeil"]].filter(any).length >= 2 },
    { id: "rudel", n: ["Rudelführer", "Pack Leader"], d: ["Rex + Peitsche oder Kettenhaken: Rex beißt doppelt so fest und bleibt länger.", "Rex + whip or chain hook: Rex bites twice as hard and stays longer."], ok: () => has("rex") && any(["kettenpeitsche", "kettenhaken", "anker"]) },
    { id: "bollwerk", n: ["Doppeltes Bollwerk", "Double Bulwark"], d: ["Schild + Schutzrune oder zwei Schilde: Paraden heilen 6 % und das Paradefenster ist 50 % größer.", "Shield + warding rune or two shields: parries heal 6% and the parry window is 50% larger."], ok: () => { const P = Z.player; const sh = ["a1", "a2"].filter(s => P.slots[s] && Z.WEAPONS[P.slots[s].id] && Z.WEAPONS[P.slots[s].id].kind === "shield").length; return sh >= 2 || (sh >= 1 && has("schutzrune")); } },
    { id: "sprengmeister", n: ["Sprengmeister", "Demolitionist"], d: ["Zwei Sprengmittel: Sprengfähigkeiten laden 35 % schneller.", "Two explosives: explosive skills recharge 35% faster."], ok: () => ["sprengphiole", "klebebombe", "streubombe", "pulverfass", "splittergranate", "magnetbombe"].filter(has).length >= 2 },
    { id: "schattentanz", n: ["Schattentanz", "Shadow Dance"], d: ["Zwei Schattenkünste: nach jeder Rolle 0,8 s unsichtbar, der nächste Treffer ist kritisch.", "Two shadow arts: after every roll you're invisible for 0.8 s, the next hit crits."], ok: () => ["schattendolch", "blinkstein", "schattenschritt", "rauchbombe", "spiegelbild"].filter(has).length >= 2 },
    { id: "kettenreaktion", n: ["Kettenreaktion", "Chain Reaction"], d: ["Kette + Magnet- oder Schwerkraftstein: Treffer mit Ketten betäuben, gezogene Gegner nehmen 40 % mehr Schaden.", "Chain + magnet or gravity: chain hits stun, pulled foes take 40% more damage."], ok: () => any(["kettenpeitsche", "anker", "kettenhaken"]) && any(["magnetbombe", "schwerkraftstein", "sturmphiole"]) },
    { id: "jagd", n: ["Jäger & Beute", "Hunter & Prey"], d: ["Fernwaffe + Falle: verlangsamte oder gefesselte Gegner nehmen 60 % mehr Schaden.", "Ranged + trap: slowed or rooted foes take 60% more damage."], ok: () => any(["bogen", "armbrust", "schleuder", "eiszapfen"]) && any(["baerenfalle", "kraehenfuesse", "bolzenwerfer", "ranken"]) },
    { id: "heilig", n: ["Heiliges Licht", "Holy Light"], d: ["Dawnbringer oder Weihwasser + Licht/Feuer: +50 % gegen Untote und Dämonen.", "Dawnbringer or holy water + light/fire: +50% against undead and demons."], ok: () => any(["dawnbringer", "weihwasser"]) && any(["blendgranate", "feuerkugel", "glutaxt", "brandtopf", "lavaschild", "weihwasser", "dawnbringer"].filter(i => !(has("dawnbringer") && i === "dawnbringer") && !(has("weihwasser") && i === "weihwasser" && !has("dawnbringer")))) },
    { id: "gift", n: ["Gift & Galle", "Venom & Bile"], d: ["Zwei Giftquellen: Vergiftete nehmen 25 % mehr Schaden, Säure und Gift zusammen sogar 50 %.", "Two poison sources: poisoned foes take 25% more damage, acid plus poison even 50%."], ok: () => ["drachenzahn", "giftwolke", "drachenatem", "saeurephiole", "phiolen"].filter(has).length >= 2 },
    { id: "klingenwechsel", n: ["Klingenwechsel", "Blade Swap"], d: ["Zwei Nahkampfwaffen: wer die Waffe wechselt, trifft 30 % härter (innerhalb von 0,7 s).", "Two melee weapons: switching weapons hits 30% harder (within 0.7 s)."], ok: () => { const P = Z.player; return ["a1", "a2"].every(s => { const d = wd(P.slots[s]); return P.slots[s] && d.kind === "melee"; }); } },
    { id: "fernmeister", n: ["Schützenkönig", "Marksman"], d: ["Zwei Fernwaffen: +20 % Fernkampfschaden, kritische Treffer prallen zum nächsten Gegner.", "Two ranged weapons: +20% ranged damage, crits ricochet to the next foe."], ok: () => { const P = Z.player; return ["a1", "a2"].every(s => P.slots[s] && wd(P.slots[s]).kind === "ranged"); } },
    { id: "phalanx", n: ["Phalanx", "Phalanx"], d: ["Schild + Speer oder Hellebarde: Stiche betäuben kurz und treffen 30 % härter.", "Shield + spear or halberd: thrusts briefly stun and hit 30% harder."], ok: () => any(["scherenspeer", "hellebarde", "kampfstab"]) && ["a1", "a2"].some(s => { const P = Z.player; return P.slots[s] && wd(P.slots[s]).kind === "shield"; }) },
    { id: "sturmlauf", n: ["Sturmläufer", "Storm Runner"], d: ["Enterhaken oder Blinkstein + Sturmstoß-Waffe (Dolch, Säbel, Krallen): Sturmstöße nach Rolle oder Haken treffen doppelt.", "Grappling hook or blink stone + dash weapon (dagger, sabre, claws): dash strikes hit twice as hard."], ok: () => any(["enterhaken", "blinkstein"]) && any(["schattendolch", "krummsaebel", "krallen", "drachenzahn"]) },
    { id: "barde", n: ["Barden-Duett", "Bard's Duet"], d: ["Spottlied + Horn oder Flöte: verunsicherte Gegner nehmen 25 % mehr Schaden.", "Mocking song + horn or flute: shaken foes take 25% more damage."], ok: () => has("spottlied") && any(["kriegshorn", "floete"]) }
  ];
  Z.SYNERGIES = SYN;
  const act = new Set(); let synT = 0;
  Z.synActive = id => act.has(id);
  function synTick(dt) {
    synT -= dt; if (synT > 0 || !Z.player) return; synT = 0.4;
    for (const s of SYN) { let ok = false; try { ok = !!s.ok(); } catch (_) {} if (ok && !act.has(s.id)) { act.add(s.id); Z.toast && Z.toast("<b>" + L(["Paarung: ", "Pairing: "]) + L(s.n) + "</b><br><small>" + L(s.d) + "</small>", 3600); A.play("magic", { vol: 0.4, rate: 1.4 }); Z.meta.syn = Z.meta.syn || {}; Z.meta.syn[s.id] = 1; } else if (!ok) act.delete(s.id); }
  }
  /* Wirkungen */
  const hit0 = Z.hitEnemy;
  let lastSlotHit = null, lastSlotT = 0;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    if (e && !e.dead && !o.dot && act.size) {
      if (act.has("eisbrecher") && e.frozenT > 0) dmg *= 1.9;
      if (act.has("netzjaeger") && e.st.root > 0 && o.src === "ranged") { dmg *= 1.5; o.crit = true; }
      if (act.has("blutrausch") && e.st.bleed > 0) dmg *= 1.3;
      if (act.has("jagd") && (e.st.root > 0 || e.st.slow > 0)) dmg *= 1.6;
      if (act.has("heilig") && (e.def.undead || e.def.demon)) dmg *= 1.5;
      if (act.has("gift") && e.st.poison > 0) dmg *= e.acidT > 0 ? 1.5 : 1.25;
      if (act.has("kettenreaktion") && (e.kbT > 0 || e.floatT > 0)) dmg *= 1.4;
      if (act.has("kettenreaktion") && o.it && ["kettenpeitsche", "anker"].includes(o.it.id)) o.eff = Object.assign({ stun: 0.5 }, o.eff || {});
      if (act.has("fernmeister") && o.src === "ranged") dmg *= 1.2;
      if (act.has("barde") && e.st.weak > 0) dmg *= 1.25;
      if (act.has("phalanx") && o.it && ["scherenspeer", "hellebarde", "kampfstab"].includes(o.it.id)) { dmg *= 1.3; o.eff = Object.assign({ stun: 0.3 }, o.eff || {}); }
      if (act.has("klingenwechsel") && o.src === "melee" && o.it) { const P = Z.player, now = P.time; if (lastSlotHit && lastSlotHit !== o.it.uid && now - lastSlotT < 0.7) dmg *= 1.3; if (!o.it.uid) o.it.uid = Math.random(); lastSlotHit = o.it.uid; lastSlotT = now; }
      if (act.has("sturmlauf") && o.crit && Z.player && Z.player.act && Z.player.act.def && Z.player.act.def.lunge >= 300) dmg *= 2;
    }
    const n = hit0(e, dmg, o);
    if (act.has("fernmeister") && o.crit && o.src === "ranged" && !o.bounced && n > 0) { let b = null, bd = 120; for (const x of Z.enemies) if (alive(x) && x !== e) { const d = U.dist(x.x, x.y, e.x, e.y); if (d < bd) { bd = d; b = x; } } if (b) { Z.bolts.push({ x0: e.x + e.w / 2, y0: e.y + e.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2, t: 0, life: 0.15 }); Z.hitEnemy(b, dmg * 0.6, { src: "ranged", bounced: true, kb: 40 }); } }
    return n;
  };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const burning = e && e.st && e.st.burn > 0;
    const r = kill0.apply(this, arguments);
    if (e && !e.dummy && Z.player) {
      if (act.has("blutrausch")) Z.healPlayer(Z.player.hpMax * 0.03);
      if (act.has("feuersturm") && burning && !(o && o.self)) { Z.explode(e.x + e.w / 2, e.y + e.h / 2, 40, 22 * (1 + 0.2 * (Z.run ? Z.run.tier : 0)), "p", { burn: 1 }); }
      if (o && o.it && o.it.id === "krallen" && Z.metaLvl("krallen") >= 3) Z.healPlayer(Z.player.hpMax * 0.03);
    }
    return r;
  };
  const chain0 = Z.chainLightning;
  Z.chainLightning = function (P, x, y, dmg, jumps, eff, it, sky) { return chain0(P, x, y, dmg, jumps + (act.has("donnerschild") ? 2 : 0), eff, it, sky); };
  const ally0 = Z.spawnAlly;
  Z.spawnAlly = function (kind, x, y, o) { const a = ally0(kind, x, y, o); if (a && kind === "rex" && act.has("rudel")) { a.dmg *= 2; a.life += 6; } return a; };
  const sh0 = Z.shieldHook;
  Z.shieldHook = function (ev, P, o, dmg) { if (ev === "parry" && act.has("bollwerk")) Z.healPlayer(P.hpMax * 0.06); return sh0 ? sh0(ev, P, o, dmg) : undefined; };
  let prevCd = { s1: 0, s2: 0 }, prevRoll = 0, prevShield = false;
  function synEffects(dt) {
    const P = Z.player; if (!P) return;
    for (const k of ["s1", "s2"]) {
      if (P.cd[k] > prevCd[k] + 0.3 && act.has("sprengmeister") && P.slots[k] && ["sprengphiole", "klebebombe", "streubombe", "pulverfass", "splittergranate", "magnetbombe"].includes(P.slots[k].id)) P.cd[k] *= 0.65;
      prevCd[k] = P.cd[k];
    }
    if (prevRoll > 0 && P.rollT <= 0 && act.has("schattentanz")) { P.invis = Math.max(P.invis, 0.8); P.st.smoke = 1; }
    prevRoll = P.rollT;
    const sh = P.act && P.act.type === "shield";
    if (sh && !prevShield && act.has("bollwerk")) P.parryT *= 1.5;
    prevShield = sh;
  }

  /* ======================= GEGNER ======================= */
  const MELEE = { walker: 1, shielder: 1, charger: 1, skirmish: 1, pack: 1, duelist: 1, drunk: 1, swarm: 1, jumper: 1, exploder: 0 };
  const AGILE = { skirmish: 1, duelist: 1, pack: 1, ranged: 1, caster: 1 };
  /* jeder Typ bekommt zusätzliche, eigene Angriffe – passend zu Größe, Tempo und Art */
  for (const id in Z.ENEMIES) {
    const d = Z.ENEMIES[id]; if (!d || d.boss || d.kkDone || id === "puppe" || id === "dummy") continue; d.kkDone = true;
    d.atks = d.atks || [];
    const h = d.h || 18, w = d.w || 12, ks = new Set(d.atks.map(a => a.k)), heavy = d.heavy || (d.size || 1) > 1.3;
    if (d.fly) {
      if (!ks.has("dive")) d.atks.push({ k: "dive", r: [20, 170], pre: 0.5, act: 0.7, post: 0.45, cd: 2.6, spd: 300, box: [-4, -h, w + 8, h], sfx: "swing", w: 0.7 });
      d.chain = 0.25; continue;
    }
    if (MELEE[d.ai]) {
      const hit = d.atks.find(a => a.k === "hit" || a.k === "lunge");
      if (!ks.has("combo") && hit) d.atks.push({ k: "combo", n: heavy ? 2 : 3, gap: heavy ? 0.32 : 0.2, r: [0, (hit.r ? hit.r[1] : 30)], pre: heavy ? 0.55 : 0.38, act: 0.08, post: 0.5, cd: 1.8, box: hit.box || [0, -h * 0.8, 22, h * 0.7], armor: heavy, sfx: hit.sfx || "swing", dmg: 0.85, w: 0.7 });
      if (!heavy && !ks.has("leap") && (d.spd || 80) >= 70) d.atks.push({ k: "leap", r: [60, 150], pre: 0.42, act: 0.7, post: 0.45, cd: 3.2, box: [-2, -h, w + 14, h], jump: [240, -290], sfx: "swing", w: 0.5 });
      if (heavy && !ks.has("charge")) d.atks.push({ k: "charge", r: [70, 220], pre: 0.65, act: 0.95, post: 0.6, cd: 4.5, box: [0, -h, w + 12, h], spd: 300, armor: true, glyph: "!!", sfx: "roar", hitSfx: "hitHeavy", kb: 320, w: 0.6 });
      if (heavy && !ks.has("slam")) d.atks.push({ k: "slam", r: [0, 46], pre: 0.75, act: 0.12, post: 0.6, cd: 3, box: [-6, -h * 1.2, w + 36, h * 1.2], armor: true, wave: true, glyph: "!!", sfx: "swingHeavy", hitSfx: "hitHeavy", w: 0.6 });
      d.chain = heavy ? 0.3 : 0.45;
    } else if (d.ai === "ranged" || d.ai === "caster") {
      const sh = d.atks.find(a => a.k === "shoot");
      if (sh && !d.atks.some(a => a.k === "shoot" && a.n > 1 && !a.gap)) d.atks.push(Object.assign({}, sh, { n: 3, gap: 0, spread: 0.2, pre: (sh.pre || 0.5) + 0.2, cd: 2.8, w: 0.45 }));
      if (!ks.has("lunge")) d.atks.push({ k: "lunge", r: [0, 26], pre: 0.28, act: 0.12, post: 0.4, cd: 2, lunge: 160, box: [0, -h * 0.8, 18, h * 0.7], kb: 280, dmg: 0.7, sfx: "punch", w: 1.4 });
      d.chain = 0.3;
    }
  }
  /* Schaden etwas hoch, schwere Brocken etwas weniger zäh */
  const spawn0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    const e = spawn0(id, x, y, o);
    if (e && !e.def.boss && !e.dummy) { e.dmgMul *= 1.3; if (e.def.heavy && e.hpMax > 120) { e.hpMax = e.hp = Math.round(e.hpMax * 0.88); } }
    return e;
  };
  function startAct(e, a, P) {
    e.act = { a, phase: "pre", t: 0, n: 0, hit: false, fast: e.elite === "wuetend" ? 0.75 : 1, armor: a.armor || e.elite === "gepanzert" };
    e.uses[a.k] = (e.uses[a.k] || 0) + 1;
    if (["shoot", "lob", "web", "volley"].includes(a.k)) e.act.aim = { x: P.x + P.w / 2, y: P.y + 12 };
    if (a.k === "mark") e.act.aim = { x: P.x + P.w / 2, y: Z.groundY(P.x + P.w / 2, P.y + P.h) };
  }
  const COUNTER = { k: "hit", r: [0, 80], pre: 0.3, act: 0.12, post: 0.45, box: [-26, -40, 52, 44], armor: true, glyph: "!!", sfx: "swingHeavy", hitSfx: "hitHeavy", kb: 320, dmg: 1.1, counter: true };
  /* Treffer mitzählen: wer gegen einen Gegner nur hämmert, wird ausgekontert */
  const hit1 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    if (e && !e.dead && !o.dot && !e.def.boss && !e.thief && (o.src === "melee") && e.hpMax > 60) {
      const now = Z.player ? Z.player.time : 0; e.hitLog = (e.hitLog || []).filter(t => now - t < 1.5); e.hitLog.push(now);
      if (e.hitLog.length >= 5 && (e.counterCd || 0) <= 0 && !(e.st.stun > 0.4) && !e.frozenT) {
        e.counterCd = 5; e.hitLog.length = 0; e.stagger = 0; e.kbT = 0;
        if (Z.player) { startAct(e, COUNTER, Z.player); e.face = U.sign(Z.player.x - e.x) || e.face; }
        FX.text(e.x + e.w / 2, e.y - 14, L(["Konter!", "Counter!"]), "#ff6a4a", true); A.play("roar", { x: e.x, vol: 0.4, rate: 1.3 });
      }
    }
    return hit1(e, dmg, o);
  };
  /* Gegner-Taktik je Schritt: Ketten-Angriffe, Ausweichen, Abstand nach dem Schlag */
  function enemyTick(dt) {
    const P = Z.player; if (!P || P.dead) return;
    for (const e of Z.enemies) {
      if (!alive(e) || e.def.boss || !e.aware) { if (e) e._pa = e.act; continue; }
      if (e.counterCd > 0) e.counterCd -= dt;
      if (e.evadeCd > 0) e.evadeCd -= dt;
      const d = e.def, dx = P.x + P.w / 2 - (e.x + e.w / 2), adx = Math.abs(dx), dy = P.y + P.h - (e.y + e.h);
      /* Kette: Angriff vorbei → gleich der nächste (Muster aus mehreren Aktionen) */
      if (e._pa && !e.act && !(e.st.stun > 0) && !(e.stagger > 0) && !(e.kbT > 0) && e._pa.phase === "post" && !e._pa.a.counter) {
        if (Z.R() < (d.chain || 0)) {
          const opts = (d.atks || []).filter(a => a !== e._pa.a && adx >= a.r[0] && adx <= a.r[1] + 10 && Math.abs(dy) < (["shoot", "lob", "mark", "volley"].includes(a.k) ? 160 : a.k === "leap" ? 90 : 30) && !["summon", "heal", "shield", "grow", "explode"].includes(a.k));
          if (opts.length) { const a = Z.R.pick(opts); startAct(e, a, P); e.face = U.sign(dx) || e.face; }
        } else if (MELEE[d.ai] && !d.heavy && Z.R() < 0.4) { e.st.fear = Math.max(e.st.fear || 0, 0.35); }
      }
      e._pa = e.act ? { a: e.act.a, phase: e.act.phase } : null;
      /* Ausweichen: flinke Gegner springen vor deinem Schlag zurück */
      if (AGILE[d.ai] && !d.heavy && !e.act && (e.evadeCd || 0) <= 0 && e.onGround && P.act && P.act.type === "melee" && P.act.phase === "pre" && adx < 50 && Math.abs(dy) < 24 && U.sign(dx) === -P.face && Z.R() < 0.4) {
        e.evadeCd = 2.8 + Z.R() * 1.5; e.vx = -U.sign(dx) * 250; e.vy = -190; e.onGround = false; e.invuln = 0.22; e.kbT = 0.25;
        FX.burst(e.x + e.w / 2, e.y + e.h, 6, { col: Z.dustCol || "#8a7a70", sp: 60, life: 0.3, size: 2, kind: "smoke" });
        if (Z.R() < 0.5) e.cd = 0;
      }
    }
  }

  /* ======================= Schritt ======================= */
  /* Sicherheitsnetz: Gegner, die durch Zug-Effekte (Anker, schwarzes Loch, Kettenzug) oder versiegelte Ausgänge
     in Fels geraten sind, wieder herausschieben – sonst wären sie unerreichbar (Hinterhalt/Wächter hängen). */
  let stuckT = 0;
  function unstickTick(dt) {
    stuckT -= dt; if (stuckT > 0) return; stuckT = 0.2;
    for (const e of Z.enemies) if (alive(e) && !e.ghost && !e.def.ghost && e.def.ai !== "phase" && !e.def.boss && !e.ceil && !(e.kbT > 0 && e.def.fly)) Z.unstick(e);
  }
  /* W9: Magazin-Nachladen in Spielzeit statt im HUD (Echtzeit) – lief vorher in Zeitlupe/Trefferstopp und bei Auswahl-Zeitlupe weiter */
  Z.magTick = function (P, dt) {
    if (!P || !P.mag) return;
    for (const s of ["a1", "a2"]) { const m = P.mag[s], it = P.slots[s]; if (!m || !(m.t > 0)) continue; const wd = it && Z.WEAPONS[it.id]; if (!wd || !wd.shoot) { delete P.mag[s]; continue; } m.t -= dt; if (m.t <= 0) { m.t = 0; m.n = wd.shoot.mag + (Z.metaLvl(it.id) >= 3 ? 2 : 0); } }
  };
  Z.kampfTick = function (dt) { Z.magTick(Z.player, dt); diveTick(Z.player, dt); synTick(dt); synEffects(dt); enemyTick(dt); unstickTick(dt); };
})();
