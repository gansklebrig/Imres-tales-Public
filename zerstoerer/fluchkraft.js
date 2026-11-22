/* Ezekiel – The Destroyer · Fluchkräfte
   Jeder verfluchte Gegenstand trägt eine Kraft, die es sonst nirgends gibt. Sie verändert den Spielstil komplett –
   und wird mit der Fluchstufe stärker (×1 / ×1,4 / ×2). */
(function () {
  "use strict";
  /* Verzögerungen in Spielzeit (Pause/Zeitlupe/Gebietswechsel-sicher), sonst Rückfall auf setTimeout */
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : window.setTimeout(fn, ms));
  const Z = window.Z, U = Z.U, FX = Z.fx, A = Z.audio, W = Z.world, T = Z.TILE, L = v => Z.L(v);
  const { glow, circ, poly, limb, ell } = Z.draw;
  const alive = e => e && !e.dead && !(e.intro > 0);
  const K = it => [0, 1, 1.4, 2][it.cursed || 1];
  const near = (x, y, r, not) => { let b = null, bd = r; for (const e of Z.enemies) { if (!alive(e) || e === not || e.hidden) continue; const d = U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2); if (d < bd) { bd = d; b = e; } } return b; };
  const cx = e => e.x + e.w / 2, cy = e => e.y + e.h / 2;
  const fxHit = (e, dmg, o) => Z.hitEnemy(e, dmg, Object.assign({ src: "curse", fx: true, kb: 30 }, o || {}));
  const fl = []; /* eigene Effekte: Kugeln, Löcher, Schädel, Meteore, Strahlen */

  const P_ = () => Z.player;
  const equipped = id => { const P = P_(); if (!P) return null; for (const s of ["a1", "a2", "s1", "s2"]) { const it = P.slots[s]; if (it && it.power === id) return it; } return null; };

  const CP = (Z.CPOWER = {
    himmel: { n: ["Himmelsgericht", "Heaven's Verdict"], d: ["Jeder Treffer ruft einen Lichtpfeil vom Himmel auf das Ziel.", "Every hit calls down a bolt of light onto the target."],
      hit: (e, dmg, it) => { fl.push({ k: "strahl", x: cx(e), y: e.y + e.h, t: 0, life: 0.35, col: "255,230,150" }); later(() => { if (alive(e)) { fxHit(e, dmg * 0.45 * K(it), { crit: true }); FX.burst(cx(e), e.y + e.h, 10, { col: ["#fff6d0", "#ffd27a"], sp: 120, ang: -Math.PI / 2, spread: 2, life: 0.35, size: 2, kind: "spark", add: true }); A.play("zap", { vol: 0.25, rate: 1.8, gap: 0.05 }); } }, 120); } },
    frost: { n: ["Frostherz", "Frost Heart"], d: ["Jeder vierte Treffer friert das Ziel ein, eingefrorene Gegner zerspringen in Eissplitter, die weitere einfrieren.", "Every fourth hit freezes the target; frozen foes shatter into shards that freeze others."],
      hit: (e, dmg, it, st) => { st.n = (st.n || 0) + 1; if (e.frozenT > 0) { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; Z.spawnProj("eis", cx(e), cy(e), 1, { vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, dmg: dmg * 0.3, fx: true, onHitE: (p, x) => { Z.addStatus(x, "stun", 1); x.frozenT = x.st.stun; } }); } }
        if (st.n % Math.max(2, Math.round(4 / K(it))) === 0) { Z.addStatus(e, "stun", 1.6); e.frozenT = e.st.stun; FX.ring(cx(e), cy(e), 22, "#ffffff", 0.35, 3); A.play("glass", { vol: 0.4, rate: 0.7 }); } } },
    seuche: { n: ["Seuchenträger", "Plaguebearer"], d: ["Treffer vergiften dreifach. Vergiftete platzen beim Tod in eine Giftwolke, die weiterspringt.", "Hits poison three times over. Poisoned foes burst into a spreading cloud on death."],
      hit: (e, dmg, it) => { Z.addStatus(e, "poison", Math.round(3 * K(it))); }, kill: (e, it) => { if (!(e.st.poison > 0)) return; Z.spawnHazard({ kind: "poisoncloud", x: cx(e), y: e.y + e.h, w: 90, life: 4, dmg: 4 * K(it), owner: "p", eff: { poison: 2 } }); FX.burst(cx(e), cy(e), 20, { col: ["#9ad04a", "#4a7a2a"], sp: 90, life: 0.8, size: 4, kind: "smoke" }); A.play("poison", { vol: 0.5 }); } },
    zwilling: { n: ["Spiegelklinge", "Mirror Blade"], d: ["Jeder Schlag wird von einer Geisterklinge wiederholt, jedes Geschoss fliegt doppelt.", "Every strike is repeated by a ghost blade; every projectile flies twice."],
      hit: (e, dmg, it, st, o) => { if (o.src !== "melee") return; later(() => { if (!alive(e)) return; fxHit(e, dmg * 0.6 * K(it), { kb: 60 }); const P = P_(); FX.smear({ x: cx(e) - P.face * 8, y: cy(e), dir: P.face, r: 20, a0: 1.2, a1: -1.2, th: 6, life: 0.16, col: "#c890ff", core: "#fff", a: 0.7 }); A.play("slash", { vol: 0.25, rate: 1.4, gap: 0.04 }); }, 160); } },
    wind: { n: ["Windläufer", "Windrunner"], d: ["Die Rolle hat keine Abklingzeit und schneidet Gegner, durch die du rollst.", "The roll has no cooldown and cuts through enemies you roll past."], passive: true },
    blutmond: { n: ["Blutmond", "Blood Moon"], d: ["Jeder Kill beschwört einen Blutmond, der um dich kreist und auf Gegner feuert (bis zu 5).", "Every kill summons a blood moon that orbits you and fires at foes (up to 5)."],
      kill: (e, it) => { if (fl.filter(f => f.k === "mond").length >= 5) return; fl.push({ k: "mond", a: Math.random() * 6.28, t: 0, life: 9, cd: 0.4, dmg: 9 * K(it) }); A.play("magic", { vol: 0.4, rate: 0.7 }); } },
    sturm: { n: ["Sturmseele", "Storm Soul"], d: ["Jeder Treffer springt als Blitz auf zwei weitere Gegner über.", "Every hit leaps as lightning to two more foes."],
      hit: (e, dmg, it) => { let from = e, hit = new Set([e]); for (let i = 0; i < Math.round(2 * K(it)); i++) { const n = near(cx(from), cy(from), 110, null); if (!n || hit.has(n)) break; hit.add(n); Z.bolts.push({ x0: cx(from), y0: cy(from), x1: cx(n), y1: cy(n), t: 0, life: 0.18 }); fxHit(n, dmg * 0.4, { eff: { stun: 0.2 } }); from = n; } if (hit.size > 1) A.play("zap", { vol: 0.25, gap: 0.05 }); } },
    leere: { n: ["Leere", "The Void"], d: ["Jeder sechste Treffer öffnet ein schwarzes Loch, das Gegner einsaugt und dann zermalmt.", "Every sixth hit opens a black hole that sucks foes in, then crushes them."],
      hit: (e, dmg, it, st) => { st.n = (st.n || 0) + 1; if (st.n % 6) return; fl.push({ k: "loch", x: cx(e), y: cy(e), t: 0, life: 1.4, dmg: 34 * K(it) }); A.play("shadow", { vol: 0.6, rate: 0.5 }); } },
    stern: { n: ["Sternenfall", "Starfall"], d: ["Jeder Kill lässt einen Meteor auf den nächsten Gegner stürzen.", "Every kill drops a meteor on the nearest foe."],
      kill: (e, it) => { const n = near(cx(e), cy(e), 260, e); const tx = n ? cx(n) : cx(e) + (Math.random() - 0.5) * 80, ty = n ? n.y + n.h : e.y + e.h; fl.push({ k: "meteor", x0: tx - 120, y0: Z.cam.y - 30, tx, ty, t: 0, life: 0.55, dmg: 40 * K(it) }); } },
    geist: { n: ["Geisterschwarm", "Ghost Swarm"], d: ["Treffer setzen Geisterschädel frei, die selbst Gegner jagen.", "Hits release ghost skulls that hunt foes on their own."],
      hit: (e, dmg, it, st) => { st.n = (st.n || 0) + 1; if (st.n % 2) return; fl.push({ k: "schaedel", x: cx(e), y: e.y - 6, vx: (Math.random() - 0.5) * 80, vy: -90, t: 0, life: 3, dmg: dmg * 0.35 * K(it), tgt: null }); } },
    zeit: { n: ["Zeitriss", "Time Rift"], d: ["Treffer verlangsamen alle Gegner in der Nähe – die Zeit gehört dir.", "Hits slow every foe nearby – time belongs to you."],
      hit: (e, dmg, it, st) => { const P = P_(); if ((st.cd || 0) > P.time) return; st.cd = P.time + 1.2; for (const x of Z.enemies) if (alive(x) && U.dist(cx(x), cy(x), cx(e), cy(e)) < 130) Z.addStatus(x, "slow", 3 * K(it)); fl.push({ k: "uhr", x: cx(e), y: cy(e), t: 0, life: 0.7 }); A.play("magic", { vol: 0.35, rate: 1.6 }); } },
    widerhall: { n: ["Widerhall", "Reverberation"], d: ["Jeder Schlag schickt eine Schallsichel nach vorn, die durch alles schneidet.", "Every strike sends a sound crescent forward that cuts through everything."], swing: true },
    dornen: { n: ["Dornenkrone", "Crown of Thorns"], d: ["Unter getroffenen Gegnern brechen Dornenranken hervor und fesseln alles in der Nähe.", "Thorny vines burst from under struck foes and bind everything nearby."],
      hit: (e, dmg, it, st) => { const P = P_(); if ((st.cd || 0) > P.time) return; st.cd = P.time + 0.5; for (let i = -1; i <= 1; i++) Z.spawnHazard({ kind: "roots", x: cx(e) + i * 18, y: e.y + e.h, w: 18, life: 0.7, dmg: dmg * 0.25 * K(it), owner: "p", eff: { root: 1.4 }, once: true }); A.play("roots", { vol: 0.35, gap: 0.08 }); } },
    gier: { n: ["Goldgier", "Gold Greed"], d: ["Jeder Treffer lässt Münzen spritzen, Kills regnen Gold. Gold sammelt sich von selbst.", "Every hit splashes coins, kills rain gold. Gold flies to you on its own."],
      hit: (e) => { if (Math.random() < 0.6) Z.spawnPickup("gold", cx(e), cy(e), { n: 1 + ((Math.random() * 3) | 0), vx: (Math.random() - 0.5) * 120, vy: -160 }); }, kill: (e, it) => { for (let i = 0; i < 6 * K(it); i++) Z.spawnPickup("gold", cx(e), cy(e), { n: 3, vx: (Math.random() - 0.5) * 200, vy: -200 - Math.random() * 120 }); }, magnet: true },
    phoenix: { n: ["Phönixfeder", "Phoenix Feather"], d: ["Würde dich der Fluch töten, verbrennt die Waffe stattdessen – und du stehst in einer Feuersäule wieder auf.", "If the curse would kill you, the weapon burns instead – and you rise again in a pillar of fire."], passive: true },
    orbit: { n: ["Kugelblitz", "Ball Lightning"], d: ["Drei Kugelblitze umkreisen dich und zerreißen alles, was ihnen zu nahe kommt.", "Three ball lightnings orbit you and tear apart anything that gets too close."], passive: true },
    seelensog: { n: ["Seelensog", "Soul Siphon"], d: ["Kills geben dreifach Seelensplitter, die als Lichtstrom zu dir fliegen.", "Kills grant triple soul shards that stream to you as light."],
      kill: (e, it) => { Z.dropShards && Z.dropShards(cx(e), cy(e), Math.round(3 * K(it))); for (let i = 0; i < 8; i++) FX.p({ x: cx(e), y: cy(e), vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, life: 0.9, size: 2, col: "#ff6ad0", kind: "glow", add: true }); }, magnet: true },
    vulkan: { n: ["Vulkanherz", "Volcano Heart"], d: ["Treffer auf brennende Gegner lösen Feuerfontänen aus, die Rolle hinterlässt Lava.", "Hits on burning foes trigger fire geysers, your roll leaves lava."],
      hit: (e, dmg, it, st) => { Z.addStatus(e, "burn", 2); const P = P_(); if (e.st.burn > 0 && (st.cd || 0) < P.time) { st.cd = P.time + 0.6; Z.spawnHazard({ kind: "column", x: cx(e), y: e.y + e.h, w: 22, hgt: 90, warn: 0.15, life: 0.35, dmg: dmg * 0.5 * K(it), owner: "p", eff: { burn: 2 } }); A.play("fireBig", { vol: 0.35, gap: 0.1 }); } } },
    teufel: { n: ["Teufelshüpfer", "Devil's Pogo"], d: ["Sturzangriffe federn dich vom Gegner wieder hoch – endlos. Jeder Abpraller in Folge trifft härter und hinterlässt einen Höllenring.", "Dive attacks bounce you off the foe – endlessly. Each bounce in a row hits harder and leaves a ring of hellfire."],
      hit: (e, dmg, it, st, o) => { const P = P_(); if (!P || P.onGround || o.src !== "melee" || !P.plunge) return; const now = performance.now(); st.k = now - (st.t || 0) < 1400 ? (st.k || 0) + 1 : 1; st.t = now; fxHit(e, dmg * 0.15 * Math.min(st.k, 8) * K(it), { crit: true }); FX.ring(cx(e), e.y + e.h, 20 + Math.min(st.k, 8) * 4, "#ff4ad0", 0.3, 3); Z.spawnHazard && Z.spawnHazard({ kind: "fire", x: cx(e), y: e.y + e.h, w: 30, life: 1.2, dmg: dmg * 0.1, owner: "p", eff: { burn: 1 } }); } },
  });
  Z.CPOWER_IDS = Object.keys(CP);
  /* Endloses Abprallen nur mit dem Teufelshüpfer */
  Z.pogoOn = P => !!P && ["a1", "a2"].some(s => P.slots[s] && P.slots[s].power === "teufel");

  /* ======================= Auslöser ======================= */
  const state = new WeakMap();
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    const n = hit0(e, dmg, o);
    if (n > 0 && !o.fx && !o.dot && o.it && o.it.power && CP[o.it.power].hit && e) {
      let st = state.get(o.it); if (!st) { st = {}; state.set(o.it, st); }
      try { CP[o.it.power].hit(e, n, o.it, st, o); } catch (err) {}
    }
    return n;
  };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const r = kill0.apply(this, arguments);
    const P = P_();
    if (e && !e.dummy && P) for (const s of ["a1", "a2", "s1", "s2"]) { const it = P.slots[s]; if (it && it.power && CP[it.power].kill && (!o || !o.self)) { try { CP[it.power].kill(e, it); } catch (err) {} } }
    return r;
  };
  /* Doppelte Geschosse */
  const sp0 = Z.spawnProj;
  Z.spawnProj = function (kind, x, y, dir, o) {
    const p = sp0(kind, x, y, dir, o);
    if (o && o.it && o.it.power === "zwilling" && !o.twin && !kind.startsWith("e_")) { const q = sp0(kind, x, y - 5, dir, Object.assign({}, o, { twin: true, vy: (o.vy || 0) - 40, dmg: (o.dmg || 5) * 0.7 * K(o.it) })); q.ghost = true; q.tint = "#c890ff"; }
    return p;
  };
  /* Phönix: rettet einmal vor dem Fluchtod */
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = P_();
    if (P && P.curse > 0 && !(o && o.hazard) && P.iframe <= 0 && !Z.godMode) {
      const it = equipped("phoenix");
      if (it && !(P.act && P.act.type === "shield")) {
        for (const s of ["a1", "a2", "s1", "s2"]) if (P.slots[s] === it) P.slots[s] = null;
        P.curse = 0; P.iframe = 2.5; Z.healPlayer(P.hpMax * 0.5);
        fl.push({ k: "phoenix", x: P.x + P.w / 2, y: P.y + P.h, t: 0, life: 1.2 });
        for (const e of Z.enemies) if (alive(e) && U.dist(cx(e), cy(e), P.x, P.y) < 120) { fxHit(e, 80, { eff: { burn: 3 }, kb: 260, kbUp: 220 }); }
        FX.flashScreen("#ff8a3a", 0.7); FX.addShake(10); A.play("fireBig", { vol: 0.9 }); A.play("roar", { vol: 0.5 });
        FX.text(P.x + P.w / 2, P.y - 20, L(["Phönix!", "Phoenix!"]), "#ffb040", true);
        Z.toast && Z.toast(L(["Die Phönixfeder verbrennt – und du lebst.", "The phoenix feather burns – and you live."]), 3000);
        return false;
      }
    }
    return hurt0.apply(this, arguments);
  };

  /* ======================= je Schritt ======================= */
  let prevAct = null, prevRoll = 0;
  Z.fluchkraftTick = function (dt) {
    const P = P_(); if (!P || !Z.level) return;
    /* Windläufer */
    const wind = equipped("wind");
    if (wind) { P.rollCd = 0; if (P.rollT > 0) { if (Math.random() < dt * 60) FX.p({ x: P.x + P.w / 2, y: P.y + 4 + Math.random() * P.h, vx: -P.rollDir * 140, vy: 0, life: 0.25, size: 1.2, col: "#e8f0e8", kind: "spark", add: true }); for (const e of Z.enemies) if (alive(e) && U.overlap(P, e) && !(e._windT > P.time)) { e._windT = P.time + 0.4; fxHit(e, Z.dmgOf(P, wind, 14) * K(wind), { it: wind, fx: true, kb: 80, dir: P.rollDir }); FX.smear({ x: cx(e), y: cy(e), dir: P.rollDir, r: 16, a0: -0.6, a1: 0.6, th: 4, life: 0.12, col: "#e8f0e8", core: "#fff", a: 0.8 }); } } }
    /* Vulkan: Lava hinter der Rolle */
    const vul = equipped("vulkan"); if (vul && P.rollT > 0 && Math.random() < dt * 30) Z.spawnHazard({ kind: "fire", x: P.x + P.w / 2, y: P.y + P.h - 1, w: 14, life: 2, dmg: 5 * K(vul), owner: "p", eff: { burn: 1 } });
    /* Widerhall: jeder Schlag schickt eine Sichel */
    const wh = equipped("widerhall");
    if (wh && P.act && P.act.type === "melee" && P.act.phase === "act" && prevAct !== P.act && (P.act.it === wh)) { prevAct = P.act; Z.spawnProj("glutsichel", P.x + P.w / 2 + P.face * 12, P.y + 10, P.face, { dmg: Z.dmgOf(P, wh, 10) * K(wh), fx: true, tint: "#c890ff" }); A.play("swing", { vol: 0.3, rate: 0.7, gap: 0.05 }); }
    /* Kugelblitz-Orbit */
    const orb = equipped("orbit");
    if (orb && !fl.some(f => f.k === "orb")) for (let i = 0; i < 3; i++) fl.push({ k: "orb", a: i * 2.094, t: 0, life: 1e9, it: orb });
    if (!orb) for (let i = fl.length - 1; i >= 0; i--) if (fl[i].k === "orb") fl.splice(i, 1);
    /* Magnet für Gold und Splitter */
    if (equipped("gier") || equipped("seelensog")) for (const p of Z.pickups) if ((p.kind === "gold" || p.kind === "shard") && !p.dead) { const dx = P.x + P.w / 2 - p.x, dy = P.y + 10 - p.y, d = Math.hypot(dx, dy); if (d < 220) { p.vx = dx / d * 320; p.vy = dy / d * 320; p.float = true; } }
    /* eigene Effekte */
    for (let i = fl.length - 1; i >= 0; i--) {
      const f = fl[i]; f.t += dt;
      if (f.t > f.life) { fl.splice(i, 1); continue; }
      if (f.k === "mond") { f.a += dt * 2.4; f.x = P.x + P.w / 2 + Math.cos(f.a) * 26; f.y = P.y + 8 + Math.sin(f.a) * 14; f.cd -= dt; if (f.cd <= 0) { const n = near(f.x, f.y, 180); if (n) { f.cd = 1.1; Z.bolts.push({ x0: f.x, y0: f.y, x1: cx(n), y1: cy(n), t: 0, life: 0.12 }); fxHit(n, f.dmg, { eff: { bleed: 1 } }); FX.burst(cx(n), cy(n), 6, { col: ["#ff2a3a", "#ff9a8a"], sp: 80, life: 0.3, size: 1.6, kind: "spark", add: true }); } else f.cd = 0.3; } }
      else if (f.k === "orb") { f.a += dt * 3.2; f.x = P.x + P.w / 2 + Math.cos(f.a) * 30; f.y = P.y + 12 + Math.sin(f.a) * 22; for (const e of Z.enemies) if (alive(e) && U.dist(f.x, f.y, cx(e), cy(e)) < e.w / 2 + 6 && !(e._orbT > P.time)) { e._orbT = P.time + 0.35; fxHit(e, Z.dmgOf(P, f.it, 7) * K(f.it), { eff: { stun: 0.15 }, kb: 50, dir: U.sign(cx(e) - f.x) || 1 }); A.play("zap", { vol: 0.2, rate: 1.5, gap: 0.05 }); } }
      else if (f.k === "loch") { for (const e of Z.enemies) if (alive(e) && !e.def.boss) { const dx = f.x - cx(e), dy = f.y - cy(e), d = Math.hypot(dx, dy); if (d < 110) { e.x += dx / (d || 1) * Math.min(d, 170 * dt) * (e.def.heavy ? 0.4 : 1); e.y += dy / (d || 1) * Math.min(d, 90 * dt); e.vx = 0; e.vy = 0; } } if (Math.random() < 0.6) { const a = Math.random() * 6.28; FX.p({ x: f.x + Math.cos(a) * 50, y: f.y + Math.sin(a) * 40, vx: -Math.cos(a) * 160, vy: -Math.sin(a) * 120, life: 0.3, size: 1.6, col: "#b060ff", kind: "spark", add: true }); }
        if (f.t + dt > f.life) { for (const e of Z.enemies) if (alive(e) && U.dist(f.x, f.y, cx(e), cy(e)) < 60) fxHit(e, f.dmg, { kb: 220, kbUp: 200, heavy: true, eff: { stun: 0.8 } }); FX.ring(f.x, f.y, 60, "#c060ff", 0.4, 5); FX.flashScreen("#7020c0", 0.25); FX.addShake(7); A.play("explode", { vol: 0.7, rate: 0.6 }); } }
      else if (f.k === "meteor") { const k = f.t / f.life; f.x = U.lerp(f.x0, f.tx, k); f.y = U.lerp(f.y0, f.ty, k * k); if (Math.random() < 0.9) FX.p({ x: f.x, y: f.y, vx: -60, vy: -30, life: 0.4, size: 3, col: Math.random() < 0.5 ? "#ffb040" : "#ff5a1a", kind: "glow", add: true });
        if (f.t + dt > f.life) { Z.explode(f.tx, f.ty - 6, 48, f.dmg, "p", { burn: 2 }); FX.flashScreen("#ffb060", 0.2); } }
      else if (f.k === "schaedel") { if (!f.tgt || !alive(f.tgt)) f.tgt = near(f.x, f.y, 260); if (f.tgt && f.t > 0.3) { const a = Math.atan2(cy(f.tgt) - f.y, cx(f.tgt) - f.x); f.vx = U.approach(f.vx, Math.cos(a) * 260, 900 * dt); f.vy = U.approach(f.vy, Math.sin(a) * 260, 900 * dt); } else { f.vy += 60 * dt; } f.x += f.vx * dt; f.y += f.vy * dt; if (Math.random() < 0.5) FX.p({ x: f.x, y: f.y, vx: 0, vy: -10, life: 0.4, size: 2.4, col: "rgba(190,230,200,.5)", kind: "glow", add: true });
        if (f.tgt && U.dist(f.x, f.y, cx(f.tgt), cy(f.tgt)) < 10) { fxHit(f.tgt, f.dmg, { eff: { weak: 2 } }); FX.burst(f.x, f.y, 8, { col: ["#c8f0d8", "#7ab08a"], sp: 70, life: 0.35, size: 2, kind: "smoke" }); A.play("shadow", { vol: 0.2, rate: 1.6, gap: 0.05 }); f.t = f.life; } }
    }
    prevRoll = P.rollT;
  };

  /* ======================= Zeichnen ======================= */
  Z.drawFluchkraft = function (c, t) {
    const P = P_();
    for (const f of fl) {
      const k = f.t / f.life;
      c.save();
      switch (f.k) {
        case "strahl": { c.globalCompositeOperation = "lighter"; const a = 1 - k; const g = c.createLinearGradient(0, f.y - 260, 0, f.y); g.addColorStop(0, "rgba(" + f.col + ",0)"); g.addColorStop(1, "rgba(" + f.col + "," + a + ")"); c.fillStyle = g; c.fillRect(f.x - 4 * a - 1, f.y - 260, 8 * a + 2, 260); glow(c, f.x, f.y - 2, 16 * a + 4, "rgba(" + f.col + "," + a * 0.8 + ")"); break; }
        case "mond": { c.globalCompositeOperation = "lighter"; glow(c, f.x, f.y, 9, "rgba(255,40,60,.55)"); c.globalCompositeOperation = "source-over"; circ(c, f.x, f.y, 3.4, "#c01a2a"); circ(c, f.x - 1, f.y - 1, 2.4, "#ff6a6a"); break; }
        case "orb": { c.globalCompositeOperation = "lighter"; glow(c, f.x, f.y, 10 + Math.sin(t * 20 + f.a) * 2, "rgba(255,240,140,.6)"); c.strokeStyle = "rgba(255,255,220,.9)"; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i < 5; i++) { const a = t * 30 + i * 1.3; c.lineTo(f.x + Math.cos(a) * 4, f.y + Math.sin(a * 1.3) * 4); } c.stroke(); break; }
        case "loch": { const r = 6 + Math.min(1, f.t * 4) * 14; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r * 2.2); g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(0.45, "rgba(20,0,30,.95)"); g.addColorStop(0.6, "rgba(170,80,255,.7)"); g.addColorStop(1, "rgba(80,0,140,0)"); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, r * 2.2, 0, 6.283); c.fill(); c.strokeStyle = "rgba(220,170,255,.7)"; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(f.x, f.y, r * (1 + i * 0.35), t * 6 + i, t * 6 + i + 2.2); c.stroke(); } break; }
        case "meteor": { c.globalCompositeOperation = "lighter"; glow(c, f.x, f.y, 14, "rgba(255,150,40,.8)"); c.globalCompositeOperation = "source-over"; circ(c, f.x, f.y, 4, "#5a2a1a"); circ(c, f.x - 1, f.y - 1, 2.4, "#ff8a3a"); break; }
        case "schaedel": { c.globalAlpha = 0.85; c.translate(f.x, f.y); circ(c, 0, 0, 3.4, "#d8f0e0"); c.fillStyle = "#1a2a20"; c.fillRect(-1.8, -1, 1.2, 1.4); c.fillRect(0.6, -1, 1.2, 1.4); c.fillRect(-1, 1.6, 2, 0.8); break; }
        case "uhr": { c.globalAlpha = 1 - k; c.strokeStyle = "#ffe08a"; c.lineWidth = 1.2; c.beginPath(); c.arc(f.x, f.y, 10 + k * 40, 0, 6.283); c.stroke(); c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(t * 8) * 8, f.y + Math.sin(t * 8) * 8); c.moveTo(f.x, f.y); c.lineTo(f.x, f.y - 6); c.stroke(); break; }
        case "phoenix": { c.globalCompositeOperation = "lighter"; const a = 1 - k; const g = c.createLinearGradient(0, f.y - 200, 0, f.y); g.addColorStop(0, "rgba(255,200,80,0)"); g.addColorStop(1, "rgba(255,120,30," + a + ")"); c.fillStyle = g; c.fillRect(f.x - 20, f.y - 200, 40, 200); for (const s of [-1, 1]) { c.fillStyle = "rgba(255,180,60," + a * 0.7 + ")"; c.beginPath(); c.moveTo(f.x, f.y - 30); c.quadraticCurveTo(f.x + s * 40, f.y - 70 - k * 20, f.x + s * 60, f.y - 30 - k * 30); c.quadraticCurveTo(f.x + s * 30, f.y - 40, f.x, f.y - 20); c.fill(); } break; }
      }
      c.restore();
    }
    /* Aura um verfluchte Waffe in der Hand */
    if (P && P.curse > 0) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, P.x + P.w / 2 + P.face * 6, P.y + 12, 9 + Math.sin(t * 8) * 2, "rgba(170,40,255,.35)"); c.restore(); }
  };
  const la0 = Z.loadArea;
  Z.loadArea = function () { for (let i = fl.length - 1; i >= 0; i--) if (fl[i].k !== "mond") fl.splice(i, 1); return la0.apply(this, arguments); };
  /* in die Zeichen- und Spielschleife einhängen */
  const d0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (d0) d0(c, t); Z.drawFluchkraft(c, t); };
  const ft0 = Z.fluchTick;
  Z.fluchTick = function (dt) { if (ft0) ft0(dt); Z.fluchkraftTick(dt); };
  /* Geisterhafte Doppel-Geschosse violett zeichnen */
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    dp0(c);
    c.save(); c.globalCompositeOperation = "lighter";
    for (const p of Z.projs) if (p.tint && !p.dead) { c.fillStyle = "rgba(200,140,255,.35)"; c.beginPath(); c.arc(p.x, p.y, (p.r || 3) + 5, 0, 6.283); c.fill(); }
    c.restore();
  };
})();
