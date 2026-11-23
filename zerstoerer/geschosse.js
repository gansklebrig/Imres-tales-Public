/* Ezekiel – The Destroyer · Geschosse, Bodeneffekte, Verbündete, Beute und zerbrechliche Dinge */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  Z.projs = []; Z.hazards = []; Z.allies = []; Z.pickups = []; Z.propsLive = []; Z.stats = Z.stats || {};

  /* ======================= GESCHOSSE ======================= */
  /* Grundwerte je Art: speed, g (Schwerkraft), r (Radius), life, pierce, stick (bleibt stecken) */
  const PK = {
    pfeil: { speed: 520, g: 120, r: 2, life: 1.4, col: "#d8b46a", trail: "#ffe0a0" },
    bolzen: { speed: 620, g: 40, r: 2, life: 1.2, pierce: true, col: "#c8a060", trail: "#ffe0a0" },
    messer: { speed: 470, g: 60, r: 2, life: 0.9, col: "#e0d8d0", spin: true },
    phiole: { speed: 0, g: 700, r: 3, life: 3, col: "#7fd36a", lob: true, spin: true },
    netz: { speed: 380, g: 160, r: 5, life: 1, col: "#eee8f0" },
    falle: { speed: 160, g: 900, r: 4, life: 14, col: "#b0a090", trap: true },
    bombe: { speed: 0, g: 750, r: 3, life: 3, col: "#ff6a2a", lob: true, spin: true },
    regenpfeil: { speed: 0, g: 900, r: 2, life: 2, col: "#8fd36b", rain: true },
    lichtwelle: { speed: 330, g: 0, r: 10, life: 0.6, pierce: true, col: "#ffd27a", wave: true, ghost: true },
    glutsichel: { speed: 300, g: 0, r: 8, life: 0.7, pierce: true, col: "#ff5a3a", wave: true, ghost: true, spin: true },
    schockwelle: { speed: 260, g: 0, r: 7, life: 0.5, pierce: true, col: "#e5a43a", ground: true },
    anker: { speed: 420, g: 0, r: 6, life: 0.9, pierce: true, col: "#9a8a7a", anchor: true },
    /* Gegner */
    e_pfeil: { speed: 300, g: 90, r: 2, life: 2, col: "#c9b38a", trail: "#c9b38a", parry: true },
    e_bolzen: { speed: 430, g: 20, r: 2, life: 2, col: "#d8d0c0", trail: "#fff", parry: true },
    e_feuerball: { speed: 180, g: 0, r: 5, life: 3, col: "#ff8a3a", glow: "#ff6a1a", parry: true, fire: true },
    e_phiole: { speed: 0, g: 600, r: 3, life: 4, col: "#7ac0a0", lob: true, spin: true, splash: "fire", parry: true },
    e_gift: { speed: 0, g: 600, r: 4, life: 4, col: "#9ad04a", lob: true, splash: "poison", parry: true },
    e_netz: { speed: 230, g: 80, r: 5, life: 2, col: "#eee8f0", web: true },
    e_nadel: { speed: 260, g: 40, r: 1.6, life: 2, col: "#b8d060", parry: true },
    e_dolch: { speed: 360, g: 30, r: 2, life: 2, col: "#c890ff", spin: true, parry: true },
    e_stein: { speed: 0, g: 650, r: 7, life: 4, col: "#7a6a5a", lob: true, spin: true, rock: true, parry: false },
    e_funke: { speed: 120, g: 0, r: 4, life: 4, col: "#ffb040", glow: "#ff9020", homing: 1.6, parry: true },
    e_bombe: { speed: 0, g: 650, r: 4, life: 3, col: "#3a3a3a", lob: true, fuse: true, parry: true },
    e_scherbe: { speed: 0, g: 900, r: 3, life: 3, col: "#d8f0e0", shard: true, parry: false },
    e_blase: { speed: 90, g: -10, r: 6, life: 4, col: "#a0d0b0", bubble: true, homing: 0.9, parry: true },
    e_feder: { speed: 300, g: 40, r: 2, life: 2, col: "#3a3a30", parry: true },
    e_glut: { speed: 0, g: 500, r: 4, life: 4, col: "#ff6a1a", lob: true, splash: "fire", glow: "#ff4a0a", parry: true },
    e_schall: { speed: 200, g: 0, r: 9, life: 1.6, col: "#ffd27a", wave: true, ghost: true, parry: false },
    e_kugel: { speed: 150, g: 0, r: 6, life: 5, col: "#c060ff", glow: "#a040ff", homing: 1.2, parry: true },
    e_welle: { speed: 200, g: 0, r: 8, life: 1.4, col: "#e5a43a", ground: true, parry: false },
    e_zahn: { speed: 0, g: 800, r: 3, life: 3, col: "#ffd27a", lob: true, spin: true, coin: true, parry: true }
  };
  Z.PK = PK;
  Z.spawnProj = function (kind, x, y, dir, o) {
    const k = PK[kind]; o = o || {};
    const sp = o.speed || k.speed;
    const p = Object.assign({ kind, k, x, y, vx: o.vx != null ? o.vx : dir * sp, vy: o.vy || 0, g: k.g, r: k.r, life: o.life || k.life, t: 0, dmg: o.dmg || 5, owner: kind.startsWith("e_") ? "e" : "p", pierce: o.pierce || k.pierce, hits: new Set(), dir: dir || 1, rot: 0 }, o);
    if (kind === "regenpfeil") { p.vx = (Math.random() - 0.5) * 30; p.vy = 300; }
    if (k.homing && Z.player) { const P = Z.player; const a = Math.atan2(P.y + 14 - y, P.x + P.w / 2 - x); p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; }
    Z.projs.push(p); return p;
  };
  /* auf einen Punkt zielen (Gegner) */
  Z.aimProj = function (kind, x, y, tx, ty, o) {
    const k = PK[kind]; o = o || {};
    if (k.lob) {
      const t = U.clamp(Math.abs(tx - x) / 170, 0.55, 1.2);
      o.vx = (tx - x) / t; o.vy = (ty - y - 0.5 * k.g * t * t) / t;
    } else {
      const a = Math.atan2(ty - y, tx - x), sp = o.speed || k.speed;
      o.vx = Math.cos(a) * sp; o.vy = Math.sin(a) * sp - (k.g ? k.g * Math.abs(tx - x) / sp * 0.5 : 0);
    }
    return Z.spawnProj(kind, x, y, U.sign(tx - x) || 1, o);
  };

  function projEnd(p, hitX, hitY) {
    p.dead = true;
    if (p.onEnd && !p.ended) { p.ended = true; p.onEnd(p, hitX, hitY); }
    const k = p.k;
    if (p.kind === "phiole") { Z.spawnHazard({ kind: "fire", x: hitX, y: groundY(hitX, hitY), w: 46, life: 3, dmg: p.dmg * 0.25, owner: "p", eff: { burn: 1 } }); A.play("glass", { x: hitX, y: hitY, vol: 0.6 }); A.play("fire", { x: hitX, vol: 0.4 }); FX.burst(hitX, hitY, 14, { col: ["#7fd36a", "#ffb040", "#ff6a2a"], sp: 120, life: 0.4, size: 2, kind: "spark", add: true }); splashDamage(p, hitX, hitY, 30); }
    if (p.kind === "bombe") { explode(hitX, hitY, 46, p.dmg, "p", p.eff); }
    if (k.splash === "fire") { Z.spawnHazard({ kind: "fire", x: hitX, y: groundY(hitX, hitY), w: 40, life: 3, dmg: p.dmg * 0.3, owner: "e" }); A.play("glass", { x: hitX, vol: 0.5 }); FX.burst(hitX, hitY, 10, { col: ["#ffb040", "#ff6a2a"], sp: 100, life: 0.35, size: 2, kind: "spark", add: true }); }
    if (k.splash === "poison") { Z.spawnHazard({ kind: "poisonpool", x: hitX, y: groundY(hitX, hitY), w: 40, life: 4, dmg: p.dmg * 0.25, owner: "e", eff: { poison: 1 } }); A.play("slime", { x: hitX, vol: 0.5 }); }
    if (k.fuse) explode(hitX, hitY, 40, p.dmg, "e");
    if (k.rock) { FX.burst(hitX, hitY, 14, { col: ["#7a6a5a", "#5a4a3a"], sp: 140, ang: -Math.PI / 2, spread: 2.6, life: 0.6, size: 3, kind: "shard", g: 500 }); A.play("rock", { x: hitX, vol: 0.6 }); FX.addShake(3); }
    if (k.fire && !k.splash) FX.burst(hitX, hitY, 10, { col: ["#ffb040", "#ff6a2a"], sp: 90, life: 0.3, size: 2, kind: "spark", add: true });
    if (p.kind === "pfeil" || p.kind === "bolzen" || p.kind === "e_pfeil" || p.kind === "e_bolzen") { if (p.wall) { Z.stuck.push({ x: hitX, y: hitY, rot: Math.atan2(p.vy, p.vx), t: 0, col: k.col }); A.play("arrowHit", { x: hitX, vol: 0.4 }); } }
    /* Wurfmesser bleiben mit einem hellen „Tock“ kurz in der Wand stecken und zittern nach */
    if (p.kind === "messer" && p.wall && !p.bounced) { Z.stuck.push({ x: hitX, y: hitY, rot: Math.atan2(p.vy, p.vx), t: 0, col: k.col, knife: true }); A.play("arrowHit", { x: hitX, vol: 0.35, rate: 1.35 }); FX.burst(hitX, hitY, 4, { col: ["#fff0d0", "#c8c0b4"], sp: 70, life: 0.18, size: 1.2, kind: "spark", add: true }); }
    if (p.kind === "falle") {}
    if (k.shard) { FX.burst(hitX, hitY, 8, { col: ["#d8f0e0", "#a0c0b0"], sp: 100, life: 0.4, size: 2, kind: "shard", g: 600 }); A.play("glass", { x: hitX, vol: 0.4 }); }
    if (k.coin) { A.play("coin", { x: hitX, vol: 0.4 }); }
    if (k.bubble) { FX.burst(hitX, hitY, 8, { col: "#c0e0d0", sp: 60, life: 0.4, size: 2, kind: "bubble" }); A.play("slime", { x: hitX, vol: 0.3 }); }
  }
  function groundY(x, y) { const g = W.groundBelow(x, y - 4, 60); return g != null ? g : y; }
  Z.groundY = groundY;
  /* W8: Druckwelle/Spritzer nur mit Sichtlinie vom Zentrum (Mitte, Kopf oder Füße des Ziels) */
  function blastSees(x, y, b) { const bx = b.x + b.w / 2; return W.los(x, y, bx, b.y + b.h / 2) || W.los(x, y, bx, b.y + 3) || W.los(x, y, bx, b.y + b.h - 3); }
  Z.blastSees = blastSees;
  /* Zentrum aus massivem Fels herausschieben (sonst sähe es von innen auf beide Seiten einer Wand) */
  function freeCenter(x, y) {
    if (!W.solidAt(x, y)) return [x, y];
    for (const r of [3, 6, 9, 12]) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1]]) if (!W.solidAt(x + dx * r, y + dy * r)) return [x + dx * r, y + dy * r];
    return [x, y];
  }
  function splashDamage(p, x, y, r) {
    [x, y] = freeCenter(x, y);
    for (const e of Z.enemies) if (!e.dead && !p.hits.has(e) && U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2) < r + e.w / 2 && blastSees(x, y, e)) Z.hitEnemy(e, p.dmg, { eff: p.eff, src: "ranged", it: p.it, kb: 60 });
  }
  function explode(x, y, r, dmg, owner, eff) {
    [x, y] = freeCenter(x, y);
    A.play("explode", { x, y, vol: 0.8 }); FX.addShake(5); FX.stop(0.04);
    FX.ring(x, y, r, "#ffb040", 0.3, 4);
    FX.burst(x, y, 26, { col: ["#ffd27a", "#ff6a2a", "#5a4a40"], sp: 200, life: 0.5, size: 3, kind: "spark", add: true });
    FX.burst(x, y, 12, { col: ["#4a4040", "#6a5a50"], sp: 80, life: 1, size: 6, kind: "smoke", g: -30 });
    /* auch zerstörbare Ausstattung trifft jede Explosion (auch die von Gegnern) */
    if (owner !== "p" && r > 0 && Z.ausstattungTreffer) { try { Z.ausstattungTreffer({ x: x - r, y: y - r, w: 2 * r, h: 2 * r }, { explo: true }); } catch (err) { console.error(err); } }
    if (owner === "p") { for (const e of Z.enemies) if (!e.dead && U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2) < r + e.w / 2 && blastSees(x, y, e)) Z.hitEnemy(e, dmg, { eff: Object.assign({ burn: 1 }, eff || {}), kb: 200, kbUp: 160, src: "skill", heavy: true, dir: U.sign(e.x - x) || 1 }); Z.hitProps(r && { x: x - r, y: y - r, w: r * 2, h: r * 2 }, dmg); }
    else { const P = Z.player; if (P && U.dist(x, y, P.x + P.w / 2, P.y + P.h / 2) < r + 6 && blastSees(x, y, P)) Z.hurtPlayer(dmg, { x, kb: 220, unblockable: false }); for (const e of Z.enemies) if (!e.dead && U.dist(x, y, e.x + e.w / 2, e.y + e.h / 2) < r && blastSees(x, y, e)) Z.hitEnemy(e, dmg * 0.5, { kb: 120 }); }
  }
  Z.explode = explode;

  Z.updateProjs = function (dt) {
    const P = Z.player;
    for (let i = Z.projs.length - 1; i >= 0; i--) {
      const p = Z.projs[i]; p.t += dt;
      if (p.dead || p.t > p.life) {
        if (!p.dead && (p.k.lob || p.k.fuse || p.onEnd)) projEnd(p, p.x, p.y);
        if (!p.dead && p.kind === "anker" && p.returning == null) {}
        Z.projs.splice(i, 1); continue;
      }
      const k = p.k;
      /* Lenkung */
      if (k.homing && p.owner === "e" && P && p.t < 2.5) {
        const a = Math.atan2(P.y + 14 - p.y, P.x + P.w / 2 - p.x), cur = Math.atan2(p.vy, p.vx), sp = Math.hypot(p.vx, p.vy);
        const na = cur + U.clamp(U.angDiff(cur, a), -k.homing * dt, k.homing * dt);
        p.vx = Math.cos(na) * sp; p.vy = Math.sin(na) * sp;
      }
      /* Anker: fliegt hinaus und kehrt zurück, zieht Getroffene mit */
      if (k.anchor) {
        if (!p.ret && p.t > 0.32) { p.ret = true; p.hits = new Set(); }
        if (p.ret && P) { const a = Math.atan2(P.y + 12 - p.y, P.x + P.w / 2 - p.x); p.vx = Math.cos(a) * 480; p.vy = Math.sin(a) * 480; if (U.dist(p.x, p.y, P.x + P.w / 2, P.y + 12) < 14) { p.dead = true; p.returns = (p.returns || 0) + 1; if (Z.metaLvl("anker") >= 3 && p.returns < 3) { const q = Z.spawnProj("anker", p.x, p.y, P.face, { dmg: p.dmg, it: p.it }); q.returns = p.returns; } } }
        for (const e of p.grab || []) if (!e.dead && p.ret) { e.x += (p.x - e.w / 2 - e.x) * Math.min(1, dt * 12); e.y += (p.y - e.h / 2 - e.y) * Math.min(1, dt * 6); }
      }
      p.vy += p.g * dt;
      const ox = p.x, oy = p.y;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (k.spin) p.rot += dt * 18 * U.sign(p.vx || 1);
      else p.rot = Math.atan2(p.vy, p.vx);
      /* Bodenwelle: folgt dem Boden, endet an Wänden/Kanten */
      if (k.ground) {
        const gy = W.groundBelow(p.x, p.y - 10, 30);
        if (gy == null || W.solidAt(p.x + U.sign(p.vx) * 4, p.y - 4)) { p.dead = true; continue; }
        p.y = gy - 4;
        if (Math.random() < dt * 30) FX.p({ x: p.x, y: gy, vx: (Math.random() - 0.5) * 40, vy: -60 - Math.random() * 60, g: 400, life: 0.4, size: 2.5, col: Z.dustCol || "#8a7a70", kind: "shard" });
      }
      /* Spuren */
      if (k.trail && Math.random() < 0.6) FX.p({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.15, size: 1.2, col: k.trail, a: 0.5 });
      if (k.glow && Math.random() < dt * 40) FX.p({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: -10, life: 0.3, size: 4, col: k.glow, kind: "glow", add: true });
      /* Wände */
      /* W8: gefegt statt nur am Endpunkt – schnelle Geschosse schlüpfen nicht mehr durch Ecken oder dünne Wände;
         Wellen (Lichtwelle, Glutsichel, Schrei) und der Anker gehen nicht mehr durch Wände */
      if (!k.ground) {
        const ht = W.solidAt(ox, oy) ? 0 : W.rayHit(ox, oy, p.x, p.y);
        if (ht >= 0) {
          const len = Math.hypot(p.x - ox, p.y - oy) || 1, u = Math.max(0, ht - 0.75 / len);
          const hx = ox + (p.x - ox) * u, hy = oy + (p.y - oy) * u;
          if (k.anchor) { p.x = hx; p.y = hy; if (!p.ret) { p.ret = true; p.hits = new Set(); A.play("hitMetal", { x: hx, y: hy, vol: 0.3, rate: 1.3 }); } }
          else if (k.ghost) { FX.burst(hx, hy, 6, { col: k.col, sp: 60, life: 0.25, size: 2, kind: "spark", add: true }); p.dead = true; Z.projs.splice(i, 1); continue; }
          else {
            if (p.bounce > 0) { p.bounce--; p.vx *= -0.8; p.x = ox; p.y = oy; p.hits = new Set(); continue; }
            p.wall = true; p.x = hx; p.y = hy; projEnd(p, p.x, p.y); Z.projs.splice(i, 1); continue;
          }
        }
      }
      /* Plattformen fangen Würfe auf */
      if ((k.lob || k.rain || k.shard) && p.vy > 0 && W.isPlat(Math.floor(p.x / T), Math.floor(p.y / T)) && oy < Math.floor(p.y / T) * T) { projEnd(p, p.x, Math.floor(p.y / T) * T); Z.projs.splice(i, 1); continue; }
      if (k.trap) { const gy = W.groundBelow(p.x, p.y - 2, 8); if (gy != null && p.y + 2 >= gy) { p.y = gy - 2; p.vx = 0; p.vy = 0; p.g = 0; p.armed = true; } }
      /* Treffer */
      if (p.owner === "p") {
        for (const e of Z.enemies) {
          if (e.dead || p.hits.has(e) || e.intro > 0) continue;
          const r = p.r + (k.wave ? 6 : 0);
          if (p.x + r < e.x || p.x - r > e.x + e.w || p.y + r < e.y || p.y - r > e.y + e.h) continue;
          if (k.trap && !p.armed) continue;
          p.hits.add(e);
          const crit = p.critAlways || (p.crit === "far" && P && Math.abs(e.x - P.x) > 130) || (p.it && Z.WEAPONS[p.it.id] && Z.WEAPONS[p.it.id].crit === "bleeding" && e.st.bleed > 0) || (P && P.st.smoke > 0);
          let dmg = p.dmg * (crit ? (p.it && Z.WEAPONS[p.it.id] && Z.WEAPONS[p.it.id].critMul) || 2 : 1);
          if (p.kind === "lichtwelle" && (e.def.undead || e.def.demon)) dmg *= 2;
          if (P && P.st.smoke > 0) { P.st.smoke = 0; P.invis = 0; }
          const eff = Object.assign({}, p.eff || {});
          if (k.trap) { eff.root = 3; p.dead = true; A.play("chain", { x: p.x }); FX.burst(p.x, p.y, 8, { col: "#c0b0a0", sp: 80, life: 0.3, size: 2, kind: "spark" }); }
          Z.hitEnemy(e, dmg, { crit, eff, kb: k.anchor ? 0 : p.kind === "schockwelle" ? 60 : 40, kbUp: p.kind === "schockwelle" ? 140 : 20, src: "ranged", it: p.it, dir: U.sign(p.vx) || 1, sfx: p.kind === "pfeil" || p.kind === "bolzen" ? "arrowHit" : null });
          if (k.anchor) { p.grab = p.grab || []; if (!e.def.boss && !e.def.heavy) p.grab.push(e); }
          if (p.kind === "phiole" || p.kind === "bombe") { projEnd(p, p.x, p.y); break; }
          if (p.kind === "netz") { FX.burst(p.x, p.y, 10, { col: "#eee8f0", sp: 60, life: 0.4, size: 2 }); A.play("web", { x: p.x, vol: 0.5 }); }
          if (p.onHitE) p.onHitE(p, e);
          if (!p.pierce && !k.trap) { if (p.onEnd && !p.ended) { p.ended = true; p.onEnd(p, p.x, p.y); } p.dead = true; break; }
        }
      } else if (P && !P.dead) {
        const r = p.r, B = k.trap && Z.playerHurtBox ? Z.playerHurtBox(P) : { x: P.x + 2, y: P.y + 3, w: P.w - 4, h: P.h - 4 };
        if (p.x + r > B.x && p.x - r < B.x + B.w && p.y + r > B.y && p.y - r < B.y + B.h && !p.hits.has(P)) { /* etwas kleinere Trefferfläche: faires Ausweichen */
          p.hits.add(P);
          if (k.web) { if (P.iframe <= 0 && !(P.act && P.act.type === "shield")) { Z.addStatus(P, "web", 2, true); FX.text(P.x + P.w / 2, P.y - 8, L(["Eingesponnen!", "Webbed!"]), "#eee8f0"); A.play("web"); } p.dead = true; continue; }
          const hurt = Z.hurtPlayer(p.dmg, { x: p.x - p.vx * 0.05, kb: k.rock ? 220 : 120, proj: k.parry !== false ? p : null, parryable: k.parry !== false, eff: p.eff });
          if (p.reflected) continue;
          if (k.lob || k.fuse) { projEnd(p, p.x, p.y); Z.projs.splice(i, 1); continue; }
          if (!k.wave && !k.ground) p.dead = true;
        }
      }
    }
    /* steckende Pfeile verblassen */
    for (let i = Z.stuck.length - 1; i >= 0; i--) { const s = Z.stuck[i]; s.t += dt; if (s.t > 4) Z.stuck.splice(i, 1); }
    for (let i = Z.bolts.length - 1; i >= 0; i--) { const b = Z.bolts[i]; b.t += dt; if (b.t > b.life) Z.bolts.splice(i, 1); }
  };
  Z.stuck = [];

  Z.drawProjs = function (c) {
    for (const s of Z.stuck) {
      c.save(); c.translate(s.x, s.y); c.rotate(s.rot); c.globalAlpha = Math.min(1, (4 - s.t));
      if (s.knife) { c.rotate(Math.sin(s.t * 60) * 0.25 * Math.max(0, 1 - s.t * 3)); c.fillStyle = "#4a3a30"; c.fillRect(-7, -1, 3.4, 2); c.fillStyle = "#8a6a40"; c.fillRect(-3.8, -1.4, 0.8, 2.8); c.fillStyle = s.col; c.beginPath(); c.moveTo(1, 0); c.lineTo(-3, -1.3); c.lineTo(-3, 1.3); c.fill(); }
      else { c.fillStyle = s.col; c.fillRect(-7, -0.5, 7, 1); }
      c.restore();
    }
    c.globalAlpha = 1;
    for (const p of Z.projs) {
      const k = p.k;
      c.save(); c.translate(p.x, p.y);
      /* feindliche Geschosse: roter Schein, damit man sie im Getümmel sofort sieht */
      if (p.owner === "e") { c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,80,40,.28)"; c.beginPath(); c.arc(0, 0, (k.r || 3) + 5, 0, 6.283); c.fill(); c.fillStyle = "rgba(255,200,150,.25)"; c.beginPath(); c.arc(0, 0, (k.r || 3) + 2, 0, 6.283); c.fill(); c.globalCompositeOperation = "source-over"; }
      switch (p.kind) {
        case "pfeil": case "e_pfeil": case "bolzen": case "e_bolzen": case "regenpfeil": case "e_feder": {
          c.rotate(p.rot); const len = p.kind.includes("bolzen") ? 8 : 11;
          c.fillStyle = k.col; c.fillRect(-len, -0.6, len, 1.2);
          c.fillStyle = "#e8e0d0"; c.beginPath(); c.moveTo(2, 0); c.lineTo(-1, -1.6); c.lineTo(-1, 1.6); c.fill();
          c.fillStyle = p.kind === "pfeil" && p.critAlways ? "#ffd27a" : "#a04030"; c.fillRect(-len, -1.5, 3, 3);
          if (p.critAlways) { c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,210,120,.5)"; c.fillRect(-len - 4, -1.5, len + 6, 3); }
          break;
        }
        case "messer": case "e_dolch":
          /* Wurfmesser: kurzer heller Wirbelschweif, dann die rotierende Klinge */
          if (p.kind === "messer" && p.owner === "p") { c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,235,200,.35)"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 4.2, p.rot + Math.PI, p.rot + Math.PI * 1.8); c.stroke(); c.restore(); }
          c.rotate(p.rot); c.fillStyle = k.col; c.beginPath(); c.moveTo(5, 0); c.lineTo(-2, -1.5); c.lineTo(-2, 1.5); c.fill(); c.fillStyle = "#4a3a30"; c.fillRect(-5, -1, 3, 2); break;
        case "phiole": case "e_phiole": case "bombe": case "e_bombe": {
          c.rotate(p.rot); c.fillStyle = k.col; c.beginPath(); c.arc(0, 1, 3, 0, 6.283); c.fill(); c.fillRect(-1, -4, 2, 3); c.fillStyle = "#e0d8c0"; c.fillRect(-1.2, -5, 2.4, 1.4);
          if (k.fuse || p.kind === "bombe") { c.rotate(-p.rot); c.globalCompositeOperation = "lighter"; c.fillStyle = Math.random() < 0.5 ? "#ffd27a" : "#ff6a1a"; c.fillRect(-1, -7, 2, 2); }
          break;
        }
        case "e_gift": case "e_glut": c.fillStyle = k.col; c.beginPath(); c.arc(0, 0, k.r, 0, 6.283); c.fill(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.5; c.beginPath(); c.arc(0, 0, k.r + 2, 0, 6.283); c.fill(); break;
        case "netz": case "e_netz": { c.strokeStyle = k.col; c.lineWidth = 0.8; c.globalAlpha = 0.9; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + p.t * 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); c.stroke(); } c.beginPath(); c.arc(0, 0, 3.5, 0, 6.283); c.stroke(); c.beginPath(); c.arc(0, 0, 6, 0, 6.283); c.stroke(); break; }
        case "falle": { c.fillStyle = "#6a6058"; c.fillRect(-6, -1, 12, 2); c.fillStyle = "#b0a090"; for (let i = -5; i <= 5; i += 2.5) { c.beginPath(); c.moveTo(i - 1, -1); c.lineTo(i, p.armed ? -5 : -3); c.lineTo(i + 1, -1); c.fill(); } break; }
        case "lichtwelle": case "glutsichel": case "e_schall": {
          c.scale(U.sign(p.vx) || 1, 1); c.globalCompositeOperation = "lighter"; const a = 1 - p.t / p.life;
          c.globalAlpha = a; c.fillStyle = k.col; c.beginPath(); c.arc(-6, 0, 14, -1.2, 1.2); c.arc(-10, 0, 11, 1.2, -1.2, true); c.fill();
          c.globalAlpha = a * 0.5; c.beginPath(); c.arc(-6, 0, 18, -1, 1); c.arc(-9, 0, 15, 1, -1, true); c.fill();
          break;
        }
        case "schockwelle": case "e_welle": { c.globalCompositeOperation = "lighter"; c.fillStyle = k.col; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(-8, 4); c.quadraticCurveTo(0, -12 - Math.sin(p.t * 30) * 3, 8, 4); c.fill(); break; }
        case "anker": { c.restore(); const P = Z.player; if (P) { c.strokeStyle = "#7a6a5a"; c.lineWidth = 1; c.setLineDash([2, 2]); c.beginPath(); c.moveTo(P.x + P.w / 2, P.y + 12); c.lineTo(p.x, p.y); c.stroke(); c.setLineDash([]); } c.save(); c.translate(p.x, p.y); c.rotate(p.t * 14); c.strokeStyle = "#9a8a7a"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 6); c.moveTo(-4, -4); c.lineTo(4, -4); c.stroke(); c.beginPath(); c.arc(0, 2, 5, 0.3, Math.PI - 0.3); c.stroke(); break; }
        case "e_feuerball": case "e_funke": case "e_kugel": {
          c.globalCompositeOperation = "lighter"; const r = k.r * (1 + Math.sin(p.t * 20) * 0.15);
          const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 2.2); g.addColorStop(0, "#fff4d0"); g.addColorStop(0.35, k.col); g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g; c.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4); break;
        }
        case "e_nadel": c.rotate(p.rot); c.fillStyle = k.col; c.fillRect(-5, -0.5, 7, 1); break;
        case "e_stein": c.rotate(p.rot); c.fillStyle = "#6a5a4a"; c.beginPath(); c.moveTo(-7, -3); c.lineTo(-2, -7); c.lineTo(6, -5); c.lineTo(7, 3); c.lineTo(1, 7); c.lineTo(-6, 4); c.fill(); c.fillStyle = "#8a7a68"; c.fillRect(-3, -4, 5, 3); break;
        case "e_scherbe": c.rotate(p.t * 6); c.fillStyle = "rgba(216,240,224,.9)"; c.beginPath(); c.moveTo(0, -5); c.lineTo(2, 2); c.lineTo(-2, 3); c.fill(); break;
        case "e_blase": c.strokeStyle = "#c0e0d0"; c.lineWidth = 1; c.globalAlpha = 0.85; c.beginPath(); c.arc(0, 0, 6 + Math.sin(p.t * 8), 0, 6.283); c.stroke(); c.fillStyle = "rgba(160,208,176,.25)"; c.fill(); c.fillStyle = "#fff"; c.fillRect(-3, -3, 1.5, 1.5); break;
        case "e_zahn": c.rotate(p.rot); c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(0, 0, 3, 0, 6.283); c.fill(); c.fillStyle = "#c08a2a"; c.fillRect(-1, -1, 2, 2); break;
        default: c.fillStyle = k.col || "#fff"; c.beginPath(); c.arc(0, 0, k.r || 2, 0, 6.283); c.fill();
      }
      c.restore();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    /* Blitze */
    for (const b of Z.bolts) {
      const a = 1 - b.t / b.life; c.globalCompositeOperation = "lighter";
      for (const [w, col] of [[3, "rgba(255,230,140," + a * 0.5 + ")"], [1.2, "rgba(255,255,230," + a + ")"]]) {
        c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(b.x0, b.y0);
        const n = 7; for (let i = 1; i < n; i++) { const t = i / n; c.lineTo(U.lerp(b.x0, b.x1, t) + (Math.random() - 0.5) * 12, U.lerp(b.y0, b.y1, t) + (Math.random() - 0.5) * 8); }
        c.lineTo(b.x1, b.y1); c.stroke();
      }
      c.globalCompositeOperation = "source-over";
    }
  };

  /* ======================= BODENEFFEKTE ======================= */
  /* {kind, x (Mitte), y (Boden), w, life, dmg, owner, eff, once, warn (Vorwarnzeit), dir} */
  Z.spawnHazard = function (o) {
    const h = Object.assign({ t: 0, hits: new Set(), tick: 0, h: 20 }, o);
    if (h.kind === "rockspike" || h.kind === "roots") { const gy = W.groundBelow(h.x, h.y - 14, 40); if (gy == null) return; h.y = gy; }
    /* W8: Wände blockieren – Stacheln/Ranken des Spielers nicht hinter Wänden, Atem/Strahl endet an der ersten Wand */
    const P0 = Z.player;
    if (h.owner === "p" && (h.kind === "rockspike" || h.kind === "roots") && P0 && !W.los(P0.x + P0.w / 2, P0.y + P0.h / 2, h.x, h.y - 8) && !W.los(P0.x + P0.w / 2, P0.y + 4, h.x, h.y - 8)) return;
    /* Bodenflächen (Feuer, Gift, Lava, Giftwolke) breiten sich nicht durch Wände aus */
    if ((h.kind === "fire" || h.kind === "poisonpool" || h.kind === "lava" || h.kind === "poisoncloud") && h.w > 0) {
      const ty = Math.floor((h.y - 4) / T), half = h.w / 2; let L = half, R = half;
      for (let d = 2; d < half; d += 3) if (W.solidT(W.tile(Math.floor((h.x - d) / T), ty))) { L = d; break; }
      for (let d = 2; d < half; d += 3) if (W.solidT(W.tile(Math.floor((h.x + d) / T), ty))) { R = d; break; }
      if (L < half || R < half) { h.w = Math.max(6, L + R); h.x += (R - L) / 2; }
    }
    if (h.kind === "breath" && h.w > 0) { const dir = h.dir > 0 ? 1 : -1, ty = Math.floor((h.y - 4) / T); for (let d = 4; d < h.w; d += 4) if (W.solidT(W.tile(Math.floor((h.x + dir * d) / T), ty))) { h.w = Math.max(6, d); break; } }
    if (h.kind === "rockspike") { A.play("rock", { x: h.x, vol: 0.4, gap: 0.05 }); FX.burst(h.x, h.y, 6, { col: Z.dustCol || "#8a7a70", sp: 90, ang: -Math.PI / 2, spread: 1.4, life: 0.4, size: 2.5, kind: "shard", g: 500 }); }
    Z.hazards.push(h); return h;
  };
  Z.updateHazards = function (dt) {
    const P = Z.player;
    for (let i = Z.hazards.length - 1; i >= 0; i--) {
      const h = Z.hazards[i]; h.t += dt;
      if (h.t > h.life + (h.warn || 0)) { Z.hazards.splice(i, 1); continue; }
      if (h.warn && h.t < h.warn) continue;
      const at = h.t - (h.warn || 0);
      h.tick -= dt;
      const tickNow = h.tick <= 0; if (tickNow) h.tick = 0.35;
      let r;
      switch (h.kind) {
        case "fire": case "poisonpool": case "lava": r = { x: h.x - h.w / 2, y: h.y - 10, w: h.w, h: 12 }; break;
        case "poisoncloud": r = { x: h.x - h.w / 2, y: h.y - 50, w: h.w, h: 52 }; break;
        case "rockspike": r = at < 0.25 ? { x: h.x - h.w / 2, y: h.y - 26, w: h.w, h: 26 } : null; break;
        case "roots": r = at < 0.4 ? { x: h.x - h.w / 2, y: h.y - 22, w: h.w, h: 22 } : null; break;
        case "breath": { const x0 = h.dir > 0 ? h.x : h.x - h.w; r = { x: x0, y: h.y - 16, w: h.w, h: 30 }; break; }
        case "strike": r = at < 0.18 ? { x: h.x - h.w / 2, y: h.y - (h.hgt || 400), w: h.w, h: h.hgt || 400 } : null; break;
        case "column": r = { x: h.x - h.w / 2, y: h.y - (h.hgt || 200), w: h.w, h: h.hgt || 200 }; break;
        case "zone": r = at < (h.active || 0.2) ? { x: h.x - h.w / 2, y: h.y - (h.hgt || 30), w: h.w, h: h.hgt || 30 } : null; break;
        case "sleep": r = { x: h.x - h.w / 2, y: h.y - h.w / 2, w: h.w, h: h.w }; break;
        default: r = null;
      }
      if (!r) continue;
      const once = h.once || h.kind === "strike" || h.kind === "zone";
      if (h.owner === "p") {
        if (!once && !tickNow) continue;
        for (const e of Z.enemies) {
          if (e.dead || !U.overlap(r, e)) continue;
          if (once && h.hits.has(e)) continue; h.hits.add(e);
          Z.hitEnemy(e, h.dmg, { eff: h.eff, kb: h.kbUp ? 20 : 0, kbUp: h.kbUp || 0, src: "skill", dot: !once && h.kind !== "breath", col: h.kind === "fire" ? "#ff8a3a" : "#9ad04a" });
          if (h.kind === "fire") Z.addStatus(e, "burn", 1);
        }
      } else if (P && !P.dead && U.overlap(r, P)) {
        if (h.kind === "sleep") { Z.addStatus(P, "slow", 0.3, true); continue; }
        if (once && h.hits.has(P)) continue;
        if (!once && !tickNow) continue;
        h.hits.add(P);
        Z.hurtPlayer(h.dmg, { x: h.x, kb: h.kb || 140, kbUp: h.kbUp, unblockable: h.unblockable != null ? h.unblockable : h.kind !== "strike", parryable: false, eff: h.eff });
        if (h.kind === "fire" || h.kind === "lava") Z.addStatus(P, "burn", 1, true);
      }
    }
  };
  Z.drawHazards = function (c, time) {
    for (const h of Z.hazards) {
      const warn = h.warn && h.t < h.warn, at = h.t - (h.warn || 0), life = h.life;
      const fade = warn ? 1 : U.clamp((life - at) / 0.4, 0, 1);
      c.save();
      if (warn) {
        /* Vorwarnung: pulsierende Bodenmarkierung */
        const k = h.t / h.warn, pulse = 0.4 + 0.4 * Math.sin(h.t * 30);
        c.globalAlpha = 0.25 + 0.35 * k;
        c.fillStyle = h.warnCol || "#ff3a2a";
        if (h.kind === "strike" || h.kind === "column") { c.fillRect(h.x - h.w / 2, h.y - (h.hgt || 400), h.w, h.hgt || 400); c.globalAlpha = pulse; c.fillRect(h.x - h.w / 2, h.y - 3, h.w, 3); }
        else { c.fillRect(h.x - h.w / 2, h.y - 4, h.w, 4); c.globalAlpha = pulse * 0.5; c.fillRect(h.x - h.w / 2, h.y - (h.hgt || 24) * k, h.w, (h.hgt || 24) * k); }
        c.restore(); continue;
      }
      c.globalAlpha = fade;
      switch (h.kind) {
        case "fire": case "lava":
          c.globalCompositeOperation = "lighter";
          for (let i = 0; i < h.w / 5; i++) {
            const x = h.x - h.w / 2 + i * 5 + 2, f = Math.sin(time * 14 + i * 1.7) * 0.5 + 0.5, hh = 5 + f * 9;
            const g = c.createLinearGradient(0, h.y - hh, 0, h.y); g.addColorStop(0, "rgba(255,200,90,0)"); g.addColorStop(0.4, "rgba(255,140,40,.8)"); g.addColorStop(1, "rgba(255,80,20,.9)");
            c.fillStyle = g; c.beginPath(); c.moveTo(x - 3, h.y); c.quadraticCurveTo(x, h.y - hh * 1.3, x + 3, h.y); c.fill();
          }
          if (Math.random() < 0.3) FX.p({ x: h.x + (Math.random() - 0.5) * h.w, y: h.y - 4, vx: 0, vy: -50, life: 0.5, size: 1.5, col: "#ffb040", kind: "spark", add: true });
          break;
        case "poisonpool": c.fillStyle = "rgba(140,200,60,.6)"; c.beginPath(); c.ellipse(h.x, h.y - 1, h.w / 2, 3, 0, 0, 6.283); c.fill(); if (Math.random() < 0.2) FX.p({ x: h.x + (Math.random() - 0.5) * h.w, y: h.y - 2, vx: 0, vy: -15, life: 0.6, size: 2, col: "#b0e060", kind: "bubble" }); break;
        case "poisoncloud": {
          for (let i = 0; i < 7; i++) { const a = time * 0.8 + i; const x = h.x + Math.cos(a * 1.3 + i) * h.w * 0.32, y = h.y - 22 + Math.sin(a + i * 2) * 14; const r = 16 + Math.sin(a * 2 + i) * 4;
            const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(150,210,70,.45)"); g.addColorStop(1, "rgba(120,180,50,0)"); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
          break;
        }
        case "rockspike": {
          const k = U.clamp(at / 0.08, 0, 1) * U.clamp((life - at) / 0.2, 0, 1), hh = 26 * k;
          c.fillStyle = h.owner === "p" ? "#8a6a50" : "#6a5a50"; c.beginPath(); c.moveTo(h.x - h.w / 2, h.y); c.lineTo(h.x - 2, h.y - hh); c.lineTo(h.x + 2, h.y - hh * 0.85); c.lineTo(h.x + h.w / 2, h.y); c.fill();
          c.fillStyle = h.owner === "p" ? "#ff9a3a" : "#9a8a78"; c.beginPath(); c.moveTo(h.x - 2, h.y - hh); c.lineTo(h.x + 2, h.y - hh * 0.85); c.lineTo(h.x, h.y - hh * 0.4); c.fill();
          break;
        }
        case "roots": {
          const k = U.clamp(at / 0.1, 0, 1) * U.clamp((life - at) / 0.25, 0, 1);
          c.strokeStyle = "#5a7a30"; c.lineWidth = 2.2; c.lineCap = "round";
          for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(h.x + i * 5, h.y); c.quadraticCurveTo(h.x + i * 9 + Math.sin(time * 6 + i) * 3, h.y - 12 * k, h.x + i * 4, h.y - 22 * k); c.stroke(); }
          c.lineCap = "butt"; break;
        }
        case "breath": {
          c.globalCompositeOperation = "lighter";
          for (let i = 0; i < 18; i++) { const t = ((at * 3 + i / 18) % 1), x = h.x + h.dir * t * h.w, y = h.y + Math.sin(i * 3 + time * 8) * t * 12, r = 4 + t * 12;
            const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, h.col || "rgba(180,230,80,.6)"); g.addColorStop(1, "rgba(100,160,40,0)"); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
          break;
        }
        case "strike": {
          c.globalCompositeOperation = "lighter"; const k = U.clamp(1 - at / 0.3, 0, 1), hh = h.hgt || 400;
          c.fillStyle = h.col || "rgba(255,240,170," + k + ")"; c.globalAlpha = k;
          c.fillRect(h.x - h.w * 0.15, h.y - hh, h.w * 0.3, hh);
          c.globalAlpha = k * 0.4; c.fillRect(h.x - h.w / 2, h.y - hh, h.w, hh);
          break;
        }
        case "column": {
          c.globalCompositeOperation = "lighter"; const hh = h.hgt || 200;
          const g = c.createLinearGradient(h.x - h.w / 2, 0, h.x + h.w / 2, 0); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, h.col || "rgba(255,140,40,.7)"); g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g; c.fillRect(h.x - h.w / 2, h.y - hh, h.w, hh); break;
        }
        case "zone": {
          if (at < 0.3) { c.globalCompositeOperation = "lighter"; c.globalAlpha = 1 - at / 0.3; c.fillStyle = h.col || "#ffb040"; c.fillRect(h.x - h.w / 2, h.y - (h.hgt || 30), h.w, h.hgt || 30); }
          break;
        }
        case "sleep": { c.globalAlpha = 0.18 * fade; c.fillStyle = "#d8c040"; c.beginPath(); c.arc(h.x, h.y, h.w / 2, 0, 6.283); c.fill(); break; }
      }
      c.restore();
    }
  };

  /* ======================= VERBÜNDETE: Rex & Illusion ======================= */
  Z.spawnAlly = function (kind, x, y, o) {
    const a = Object.assign({ kind, x, y, w: kind === "rex" ? 16 : 22, h: kind === "rex" ? 13 : 24, vx: 0, vy: 0, face: 1, t: 0, life: 10, bite: 0, onGround: false }, o);
    if (kind === "illusion") a.ghost = false;
    Z.allies.push(a); FX.burst(x, y, 10, { col: kind === "rex" ? "#c8a070" : "#d890ff", sp: 60, life: 0.5, size: 3, kind: "smoke" });
    return a;
  };
  Z.updateAllies = function (dt) {
    for (let i = Z.allies.length - 1; i >= 0; i--) {
      const a = Z.allies[i]; a.t += dt;
      if (a.t > a.life) { FX.burst(a.x + a.w / 2, a.y + a.h / 2, 10, { col: "#a99a8b", sp: 50, life: 0.5, size: 3, kind: "smoke" }); Z.allies.splice(i, 1); continue; }
      if (a.kind === "rex") {
        let tgt = null, bd = 260;
        for (const e of Z.enemies) { if (e.dead || e.hidden) continue; const d = U.dist(a.x, a.y, e.x, e.y); if (d < bd) { bd = d; tgt = e; } }
        const P = Z.player;
        const tx = tgt ? tgt.x + tgt.w / 2 : P.x + P.w / 2 - P.face * 20;
        const dx = tx - (a.x + a.w / 2);
        a.face = U.sign(dx) || a.face;
        const sp = tgt ? 230 : Math.abs(dx) > 30 ? 200 : 0;
        a.vx = U.approach(a.vx, U.sign(dx) * sp, 1600 * dt);
        a.vy += 1400 * dt; a.vy = Math.min(a.vy, 500);
        if (a.onGround && (a.hitWall || (tgt && tgt.y + tgt.h < a.y - 10 && Math.abs(dx) < 60))) a.vy = -360;
        Z.moveBody(a, dt);
        a.bite -= dt;
        if (tgt && a.bite <= 0 && U.overlap({ x: a.x - 4, y: a.y - 4, w: a.w + 8, h: a.h + 8 }, tgt)) {
          a.bite = 0.45; Z.hitEnemy(tgt, a.dmg, { kb: 50, eff: { mark: 4 }, src: "skill" }); A.play("bite", { x: a.x, vol: 0.5 });
          if (Math.random() < 0.2) A.play("bark", { x: a.x, vol: 0.4 });
        }
        if (!tgt && Math.abs(dx) > 240) { a.x = P.x - P.face * 20; a.y = P.y + P.h - a.h; }
        a.run = (a.run || 0) + Math.abs(a.vx) * dt / 12;
      } else if (a.kind === "illusion") {
        a.vy = Math.sin(a.t * 3) * 10; a.y += a.vy * dt;
        for (const e of Z.enemies) if (!e.dead && U.dist(a.x, a.y, e.x, e.y) < 260 && !e.def.boss) e.decoy = a;
        if (Math.random() < dt * 2) A.play("monster", { x: a.x, vol: 0.25, rate: 2 });
      }
    }
    for (const e of Z.enemies) if (e.decoy && !Z.allies.includes(e.decoy)) e.decoy = null;
  };

  /* ======================= BEUTE ======================= */
  /* kind: gold (n), shard (n), item (it), scroll, food, chest, cursed, heal */
  Z.spawnPickup = function (kind, x, y, o) {
    const p = Object.assign({ kind, x, y, vx: (Math.random() - 0.5) * 120, vy: -120 - Math.random() * 120, w: 6, h: 6, t: 0, onGround: false }, o);
    if (kind === "item" || kind === "scroll" || kind === "chest" || kind === "cursed" || kind === "food") { p.w = kind === "chest" || kind === "cursed" ? 18 : 12; p.h = kind === "chest" || kind === "cursed" ? 14 : 12; if (!o || o.vx == null) { p.vx = 0; p.vy = o && o.drop ? -160 : 0; } }
    /* nie in Wänden/Decken oder unerreichbar (platz.js): Schwebendes braucht einen Stehplatz in Reichweite, Fallendes
       freien Raum (und, wenn es fast senkrecht fällt, einen erreichbaren Landeplatz) */
    if (Z.freeSpot && !p.rack && Z.level) try { placePickup(p); } catch (e) { console.error(e); }
    Z.pickups.push(p); return p;
  };
  function placePickup(p) {
    const mag = p.kind === "gold" || p.kind === "shard" || p.kind === "glut" || p.kind === "key";
    if (mag || !p.float) {
      let ok = Z.spotOK(p.x, p.y, p.w, p.h, { loose: true });
      if (ok && !mag && Math.abs(p.vx) < 40) { const gy = W.groundBelow(p.x, p.y - 1, 26 * T); ok = gy != null && Z.spotOK(p.x, gy, p.w, p.h, { r: 24 }); }
      if (ok) return;
      const s = Z.freeSpot(p.x, p.y, p.w, p.h, mag ? { r: 24, maxR: 6 } : { r: 24 }); p.x = s.x; p.y = s.y;
      if (!mag) p.vx = U.clamp(p.vx, -40, 40);
      return;
    }
    const s = Z.freeSpot(p.x, p.y, p.w, p.h, { r: 24 }); p.x = s.x; p.y = s.y;
  }
  Z.dropGold = (x, y, n) => {
    const P = Z.player; if (Z.has("goldgier")) n *= 1.6;
    n = Math.round(n); let coins = Math.min(12, Math.max(1, Math.round(n / 6)));
    for (let i = 0; i < coins; i++) Z.spawnPickup("gold", x, y, { n: Math.ceil(n / coins) });
  };
  Z.dropShards = (x, y, n) => { if (Z.has("splitterjaeger")) n *= 1.6; if (["a1", "a2", "s1", "s2"].some(s => Z.hasAff(Z.player.slots[s], "splitternd"))) n *= 1.3; n = Math.round(n); for (let i = 0; i < Math.min(8, n); i++) Z.spawnPickup("shard", x, y, { n: Math.ceil(n / Math.min(8, n)), vy: -80 - Math.random() * 100 }); };
  Z.updatePickups = function (dt) {
    const P = Z.player;
    if (Z.unstickTick) Z.unstickTick(dt); /* platz.js: festsitzende Beute einmal pro Sekunde freiploppen */
    for (let i = Z.pickups.length - 1; i >= 0; i--) {
      const p = Z.pickups[i]; p.t += dt;
      const magnet = (p.kind === "gold" || p.kind === "shard" || p.kind === "glut" || p.kind === "key") && p.t > 0.45;
      if (magnet && P && !P.dead) {
        const dx = P.x + P.w / 2 - p.x, dy = P.y + P.h / 2 - p.y, d = Math.hypot(dx, dy);
        if (d < (p.kind === "shard" || p.kind === "glut" || p.kind === "key" ? 400 : 90) || p.t > 2.5) { const sp = Math.min(500, 120 + p.t * 260); p.vx = dx / d * sp; p.vy = dy / d * sp; p.x += p.vx * dt; p.y += p.vy * dt; if (d < 10) { collect(p); Z.pickups.splice(i, 1); } continue; }
      }
      if ((p.kind === "shard" || p.kind === "glut" || p.kind === "key") && p.t < 0.45) { p.vy += 300 * dt; const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt; /* nicht in Wände fliegen */ if (W.solidAt(nx, ny - 3)) { if (W.solidAt(nx, p.y - 3)) p.vx *= -0.4; else p.x = nx; if (W.solidAt(p.x, ny - 3)) p.vy *= -0.3; else p.y = ny; } else { p.x = nx; p.y = ny; } p.vx *= 0.96; continue; }
      if (!p.float) { p.vy = Math.min(p.vy + 900 * dt, 500); const ox = p.x; const b = { x: p.x - p.w / 2, y: p.y - p.h, w: p.w, h: p.h, vx: p.vx, vy: p.vy }; Z.moveBody(b, dt); p.x = b.x + p.w / 2; p.y = b.y + p.h; p.vx = b.vx; p.vy = b.vy; if (b.onGround) { p.vx *= 0.8; if (p.kind === "gold" && Math.abs(b.landV || 0) > 120) { p.vy = -(b.landV || 0) * 0.35; A.play("coin", { vol: 0.15, x: p.x, gap: 0.08 }); } } }
    }
  };
  function collect(p) {
    const P = Z.player;
    if (p.kind === "gold") { P.gold += p.n; A.play("coin", { vol: 0.3, gap: 0.04 }); Z.stats.gold = (Z.stats.gold || 0) + p.n; if (Z.has("goldgier")) Z.healPlayer(0.5); }
    /* Schmiedeglut und Schlüssel (schmiede.js) */
    if (p.kind === "glut") { P.glut = (P.glut || 0) + (p.n || 1); Z.stats.glut = (Z.stats.glut || 0) + (p.n || 1); A.play("fire", { vol: 0.35, gap: 0.05, rate: 1.5 }); FX.text(P.x + P.w / 2, P.y - 10, "+" + (p.n || 1) + " " + L(["Glut", "Ember"]), "#ff9a3a"); FX.p({ x: P.x + P.w / 2, y: P.y + 10, vx: 0, vy: -20, life: 0.35, size: 12, col: "#ff7a2a", kind: "glow", add: true }); }
    if (p.kind === "key") { P.keys = (P.keys || 0) + 1; A.play("chain", { vol: 0.4, rate: 1.6 }); FX.text(P.x + P.w / 2, P.y - 10, L(["Schlüssel", "Key"]), "#ffd27a", true); }
    if (p.kind === "shard") { P.shards += p.n; A.play("gem", { vol: 0.35, gap: 0.05, rate: 1.4 }); FX.p({ x: P.x + P.w / 2, y: P.y + 10, vx: 0, vy: -20, life: 0.3, size: 10, col: "#ff5a8a", kind: "glow", add: true }); }
  }
  Z.drawPickups = function (c, time) {
    const cam = Z.cam;
    for (const p of Z.pickups) {
      /* nur was im Bild liegt (Lichtsäulen reichen 64 hoch) */
      if (p.x < cam.x - 40 || p.x > cam.x + cam.w + 40 || p.y < cam.y - 20 || p.y > cam.y + cam.h + 80) continue;
      c.save(); c.translate(p.x, p.y);
      const bob = p.float || p.kind === "item" || p.kind === "scroll" ? Math.sin(time * 3 + p.x) * 2 - 4 : 0;
      switch (p.kind) {
        case "gold": { const s = Math.abs(Math.sin(time * 6 + p.x)); c.fillStyle = "#c08a2a"; c.fillRect(-2 * s - 0.5, -4, 4 * s + 1, 4); c.fillStyle = "#ffd27a"; c.fillRect(-1.5 * s, -3.5, 3 * s, 2); break; }
        case "glut": {
          /* Schmiedeglut: glühender Splitter mit Funken */
          c.globalCompositeOperation = "lighter"; const pu = 0.75 + 0.25 * Math.sin(time * 9 + p.x);
          const g = c.createRadialGradient(0, -2, 0, 0, -2, 9); g.addColorStop(0, "#fff0c0"); g.addColorStop(0.35, "rgba(255,140,40," + pu + ")"); g.addColorStop(1, "rgba(200,40,10,0)"); c.fillStyle = g; c.fillRect(-9, -11, 18, 18);
          c.globalCompositeOperation = "source-over"; c.fillStyle = "#ff8a2a"; c.beginPath(); c.moveTo(0, -6); c.lineTo(3, -2); c.lineTo(0, 2); c.lineTo(-3, -2); c.closePath(); c.fill(); c.fillStyle = "#ffe0a0"; c.fillRect(-0.8, -4, 1.6, 3);
          if (Math.random() < 0.08) FX.p({ x: p.x + (Math.random() - 0.5) * 6, y: p.y - 4, vx: (Math.random() - 0.5) * 20, vy: -40, life: 0.5, size: 1.2, col: "#ffb060", kind: "spark", add: true });
          break;
        }
        case "key": {
          const b = Math.sin(time * 3 + p.x) * 1.5; c.translate(0, b - 4);
          Z.draw.glow(c, 0, -3, 10, "rgba(255,210,120,.45)");
          c.strokeStyle = "#ffd27a"; c.lineWidth = 1.6; c.beginPath(); c.arc(-3, -3, 2.4, 0, 6.283); c.stroke();
          c.fillStyle = "#ffd27a"; c.fillRect(-0.6, -3.8, 6, 1.6); c.fillRect(3.4, -3.8, 1.4, 3.4); c.fillRect(1.4, -3.8, 1.2, 2.6);
          break;
        }
        case "shard": { c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(0, 0, 0, 0, 0, 7); g.addColorStop(0, "#ffe0f0"); g.addColorStop(0.4, "#ff5a8a"); g.addColorStop(1, "rgba(160,20,60,0)"); c.fillStyle = g; c.fillRect(-7, -7, 14, 14); break; }
        case "item": case "scroll": case "food": {
          if (p.kind === "item" && p.rack) {
            /* Waffenständer im Lager (schmiede.js): aufrecht angelehnt, sanftes Glänzen statt Lichtsäule */
            const d = Z.itemDef(p.it), pc = Z.plusCol ? Z.plusCol(p.it.plus || 0) : "#ffd27a";
            c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.28 + 0.12 * Math.sin(time * 2.4 + p.x * 0.1); Z.draw.glow(c, 0, -10, 14, pc); c.restore();
            c.save(); c.translate(0, -13); if (p.it.type !== "skill" && d.kind !== "shield") c.rotate(-0.79); Z.drawIcon(c, d.icon, 0, 0, 21, d.col); c.restore();
            const gl = (time * 0.45 + p.x * 0.013) % 1; if (gl < 0.12) { const k = gl / 0.12; c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = Math.sin(k * Math.PI); c.fillStyle = "#fff6d8"; c.translate(-3 + k * 6, -18 + k * 14); c.rotate(0.785); c.fillRect(-0.6, -4, 1.2, 8); c.fillRect(-4, -0.6, 8, 1.2); c.restore(); }
            if (p.it.plus) { c.font = "800 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "rgba(14,8,10,.8)"; c.fillRect(4, -25, 11, 7); c.fillStyle = pc; c.fillText("+" + p.it.plus, 9.5, -19.6); }
            break;
          }
          c.translate(0, bob);
          /* Lichtsäule wie in einem Schrein */
          const col = p.kind === "item" ? Z.RARITY[p.it.rar].col : p.kind === "scroll" ? "#ffd27a" : "#e8c890";
          c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.18 + 0.08 * Math.sin(time * 3);
          const g = c.createLinearGradient(0, -60, 0, 4); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, col); c.fillStyle = g; c.fillRect(-6, -60 - bob, 12, 64);
          c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
          if (p.kind === "item") {
            Z.drawIcon(c, Z.itemDef(p.it).icon, 0, -6, 13, Z.itemDef(p.it).col);
            /* Schmiedestufe (+1 … +5) als kleines Abzeichen */
            if (p.it.plus) { const pc = Z.plusCol ? Z.plusCol(p.it.plus) : "#ffd27a"; c.font = "800 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "rgba(14,8,10,.8)"; c.fillRect(4, -17, 11, 7); c.fillStyle = pc; c.fillText("+" + p.it.plus, 9.5, -11.6); }
          }
          else if (p.kind === "scroll") {
            /* Werte-Schriftrolle: größer, mit dreifarbigem Runenkranz (Brutalität, Taktik, Überleben) – gut sichtbar */
            const cols = [Z.STATS.brut.col, Z.STATS.takt.col, Z.STATS.ueber.col];
            c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, 0, -6, 15 + Math.sin(time * 3) * 2, "rgba(255,210,122,.35)");
            for (let i = 0; i < 3; i++) { const q = time * 1.6 + i * 2.094; c.fillStyle = cols[i]; c.globalAlpha = 0.85; c.beginPath(); c.arc(Math.cos(q) * 10, -6 + Math.sin(q) * 4, 1.6, 0, 6.283); c.fill(); }
            c.restore();
            c.fillStyle = "#efe0b8"; c.fillRect(-6, -12, 12, 11); c.fillStyle = "#c0a070"; c.fillRect(-7.5, -13, 15, 2.4); c.fillRect(-7.5, -2.4, 15, 2.4);
            for (let i = 0; i < 3; i++) { c.fillStyle = cols[i]; c.fillRect(-4 + i * 3, -9, 2, 5); }
          }
          else { c.fillStyle = "#a0603a"; c.beginPath(); c.ellipse(0, -5, 6, 4, 0, 0, 6.283); c.fill(); c.fillStyle = "#e0a070"; c.beginPath(); c.ellipse(-1, -6, 4, 2.2, 0, 0, 6.283); c.fill(); }
          break;
        }
        case "chest": case "cursed": {
          const open = p.open;
          c.fillStyle = p.kind === "cursed" ? "#3a2440" : "#5a3a22"; c.fillRect(-9, -11, 18, 11);
          c.fillStyle = p.kind === "cursed" ? "#6a3a7a" : "#8a5a30"; c.fillRect(-9, open ? -18 : -14, 18, 4);
          c.fillStyle = p.kind === "cursed" ? "#c040ff" : "#e5b454"; c.fillRect(-9, -7, 18, 1.5); c.fillRect(-1.5, -9, 3, 4);
          if (p.kind === "cursed" && !open) { Z.draw.glow(c, 0, -8, 16, "rgba(192,64,255," + (0.25 + 0.12 * Math.sin(time * 4)) + ")"); if (Math.random() < 0.1) FX.p({ x: p.x + (Math.random() - 0.5) * 16, y: p.y - 10, vx: 0, vy: -20, life: 0.8, size: 2, col: "#c040ff", kind: "glow", add: true }); }
          if (!open && p.kind === "chest") { c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.25 + 0.1 * Math.sin(time * 3); c.fillStyle = "#ffd27a"; c.fillRect(-9, -15, 18, 1); }
          break;
        }
      }
      c.restore();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  };

  /* ======================= ZERBRECHLICHES ======================= */
  Z.hitProps = function (r, dmg, act) {
    if (!r) return;
    for (const p of Z.propsLive) {
      if (p.dead || p.kind !== "breakable") continue;
      if (!U.overlap(r, p)) continue;
      p.hp -= dmg; p.shake = 0.15;
      if (p.hp <= 0) breakProp(p);
      else A.play("crate", { vol: 0.3, x: p.x, rate: 1.4 });
    }
    /* rissige Wände */
    const lv = W.lv; if (!lv) return;
    for (let ty = Math.floor(r.y / T); ty <= Math.floor((r.y + r.h) / T); ty++)
      for (let tx = Math.floor(r.x / T); tx <= Math.floor((r.x + r.w) / T); tx++)
        if (lv.get(tx, ty) === 7) breakWall(tx, ty);
  };
  function breakWall(tx, ty) {
    const lv = W.lv; const q = [[tx, ty]]; let n = 0;
    while (q.length && n < 40) { const [x, y] = q.pop(); if (lv.get(x, y) !== 7) continue; lv.set(x, y, 0); n++; FX.burst(x * T + 8, y * T + 8, 6, { col: [Z.tileCol || "#5a4a40", "#3a3030"], sp: 120, life: 0.7, size: 3, kind: "shard", g: 600 }); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
    A.play("rock", { vol: 0.8 }); A.play("quake", { vol: 0.3 }); FX.addShake(5);
    Z.dirtyTiles && Z.dirtyTiles(tx, ty);
    Z.toast && Z.toast(L(["Ein geheimer Gang!", "A secret passage!"]));
    Z.stats.secrets = (Z.stats.secrets || 0) + 1;
  }
  function breakProp(p) {
    p.dead = true;
    A.play("break", { vol: 0.6, x: p.x });
    FX.burst(p.x + p.w / 2, p.y + p.h / 2, 14, { col: p.style === "pot" ? ["#a0603a", "#704020"] : ["#7a5432", "#5a3a20", "#9a7448"], sp: 140, life: 0.8, size: 3, kind: "shard", g: 700, drag: 0.98 });
    const R = Z.R;
    if (R() < 0.55) Z.dropGold(p.x + p.w / 2, p.y, 3 + R() * 8 * Z.BAL.goldMul(Z.run ? Z.run.tier : 0));
    if (R() < 0.12) Z.spawnPickup("food", p.x + p.w / 2, p.y + p.h, { food: Z.R.pick(Z.FOOD), drop: true });
    if (R() < 0.06) Z.dropShards(p.x + p.w / 2, p.y, 2);
  }
})();
