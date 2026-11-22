/* Ezekiel – The Destroyer · Bewegung und Kampf
   Physik (Kachelkollision), Ezekiels Steuerung, Waffen, Fähigkeiten, Geschosse, Statuseffekte und Schaden. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v);

  /* ======================= WELT-ABFRAGEN ======================= */
  const W = (Z.world = { lv: null });
  W.tile = (tx, ty) => (W.lv ? W.lv.get(tx, ty) : 1);
  W.solidT = v => v === 1 || v === 7 || v === 12;
  W.solidAt = (px, py) => W.solidT(W.tile(Math.floor(px / T), Math.floor(py / T)));
  W.isLadder = (tx, ty) => W.tile(tx, ty) === 4;
  /* Plattform: Steg, Treppe, oberste Leiterkachel */
  W.isPlat = (tx, ty) => { const v = W.tile(tx, ty); return v === 2 || v === 8 || v === 10 || (v === 4 && W.tile(tx, ty - 1) !== 4 && !W.solidT(W.tile(tx, ty - 1))); };
  /* Sichtlinie (für Gegner) */
  W.los = (x0, y0, x1, y1) => {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 8);
    for (let i = 1; i < n; i++) { const t = i / n; if (W.solidAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
    return true;
  };
  W.groundBelow = (px, py, max) => { for (let y = py; y < py + (max || 400); y += 4) { const tx = Math.floor(px / T), ty = Math.floor(y / T); if (W.solidT(W.tile(tx, ty)) || W.isPlat(tx, ty)) return ty * T; } return null; };

  /* Körper bewegen: achsengetrennt, mit Unterschritten. b.platforms=false für Geister. */
  Z.moveBody = function (b, dt) {
    b.hitWall = 0; b.hitCeil = false; const wasGround = b.onGround; b.onGround = false; b.onPlat = false;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b.vx * dt), Math.abs(b.vy * dt)) / 5));
    const sdt = dt / steps;
    for (let s = 0; s < steps; s++) {
      /* waagrecht */
      if (b.vx) {
        const nx = b.x + b.vx * sdt;
        if (b.ghost) b.x = nx;
        else {
          const edge = b.vx > 0 ? nx + b.w : nx, tx = Math.floor((b.vx > 0 ? edge - 0.001 : edge) / T);
          let hit = false;
          for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 0.01) / T); ty++) if (W.solidT(W.tile(tx, ty))) { hit = true; break; }
          if (hit) { b.x = b.vx > 0 ? tx * T - b.w : (tx + 1) * T; b.hitWall = U.sign(b.vx); b.vxHit = b.vx; b.vx = 0; }
          else b.x = nx;
        }
      }
      /* senkrecht */
      const ny = b.y + b.vy * sdt;
      if (b.ghost) { b.y = ny; continue; }
      if (b.vy > 0) {
        const foot = ny + b.h, ty = Math.floor(foot / T);
        let land = false, plat = false;
        for (let tx = Math.floor((b.x + 0.5) / T); tx <= Math.floor((b.x + b.w - 0.5) / T); tx++) {
          if (W.solidT(W.tile(tx, ty))) { land = true; break; }
          if (!b.noPlat && !b.dropT && W.isPlat(tx, ty) && b.y + b.h <= ty * T + 0.5) { land = true; plat = true; }
        }
        if (land) { b.y = ty * T - b.h; b.landV = b.vy; b.vy = 0; b.onGround = true; b.onPlat = plat; }
        else b.y = ny;
      } else if (b.vy < 0) {
        const ty = Math.floor(ny / T);
        let hit = false;
        for (let tx = Math.floor((b.x + 0.5) / T); tx <= Math.floor((b.x + b.w - 0.5) / T); tx++) if (W.solidT(W.tile(tx, ty))) { hit = true; break; }
        if (hit) { b.y = (ty + 1) * T; b.vy = 0; b.hitCeil = true; }
        else b.y = ny;
      } else {
        /* stehend: Boden prüfen */
        const ty = Math.floor((b.y + b.h + 0.5) / T);
        for (let tx = Math.floor((b.x + 0.5) / T); tx <= Math.floor((b.x + b.w - 0.5) / T); tx++) {
          if (W.solidT(W.tile(tx, ty))) { b.onGround = true; break; }
          if (!b.noPlat && !b.dropT && W.isPlat(tx, ty) && Math.abs(b.y + b.h - ty * T) < 1) { b.onGround = true; b.onPlat = true; }
        }
      }
    }
    b.justLanded = b.onGround && !wasGround;
  };
  /* steckt ein Körper in festem Fels? (nach Teleports) – dann herausschieben */
  Z.unstick = b => {
    const inside = () => { for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 0.1) / T); ty++) for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.1) / T); tx++) if (W.solidT(W.tile(tx, ty))) return true; return false; };
    if (!inside()) return;
    const ox = b.x, oy = b.y;
    for (let r = 2; r < 120; r += 2) for (const [dx, dy] of [[0, -r], [r, 0], [-r, 0], [0, r], [r, -r], [-r, -r]]) { b.x = ox + dx; b.y = oy + dy; if (!inside()) return; }
    b.x = ox; b.y = oy;
  };

  /* ======================= GEGENSTÄNDE ======================= */
  let UID = 1;
  Z.makeItem = (id, tier, rar, R) => {
    R = R || Z.R;
    const def = Z.WEAPONS[id] || Z.SKILLS[id];
    const isSkill = !!Z.SKILLS[id];
    if (def.legendaryOnly) rar = 3;
    const pool = Object.keys(Z.AFFIX).filter(a => (isSkill ? Z.AFFIX_SKILL.includes(a) : true) && !(def.kind === "shield" && ["meuchelnd", "flink"].includes(a)));
    const aff = [];
    for (let i = 0; i < Z.RARITY[rar].aff; i++) { const a = R.pick(pool.filter(p => !aff.includes(p))); if (a) aff.push(a); }
    return { uid: UID++, id, type: isSkill ? "skill" : "weapon", tier: tier | 0, rar, aff };
  };
  Z.itemDef = it => (it ? Z.WEAPONS[it.id] || Z.SKILLS[it.id] : null);
  Z.itemName = it => { const d = Z.itemDef(it); if (!d) return ""; const a = it.aff.length ? L(Z.AFFIX[it.aff[0]].n) + "e" : ""; return L(d.n); };
  Z.itemStat = it => { const d = Z.itemDef(it); return d ? d.stat : "brut"; };
  Z.metaLvl = id => (Z.meta && Z.meta.wlvl && Z.meta.wlvl[id]) || 0;
  /* Schadensfaktor eines Gegenstands (Gebietsstufe, Wert, Schmiede-Stufe, Eigenschaften) */
  Z.itemMul = it => {
    const P = Z.player; if (!it) return 1;
    let m = Z.BAL.itemMul(it.tier) * (1 + 0.12 * (P ? P.stats[Z.itemStat(it)] : 0)) * (1 + 0.1 * Z.metaLvl(it.id));
    if (it.aff.includes("scharf")) m *= 1.15;
    m *= 1 + 0.08 * it.rar;
    return m;
  };
  Z.hasAff = (it, a) => it && it.aff.includes(a);
  Z.itemPrice = it => Math.round((60 + 40 * it.tier) * (1 + 0.6 * it.rar) * (Z.meta && Z.meta.up && Z.meta.up.haendler ? 1 - 0.1 * Z.meta.up.haendler : 1));

  /* ======================= SPIELER ======================= */
  const C = (Z.PC = {
    RUN: 156, ACC_G: 2900, DEC_G: 3600, ACC_A: 2300, DEC_A: 1600,
    GRAV: 1420, FALL: 1.18, MAXFALL: 430, JUMP: 405, DJUMP: 360, CUT: 0.5, COYOTE: 0.11, JBUF: 0.15,
    ROLL: 0.3, ROLLSPD: 300, ROLLCD: 0.12, DODGE: 0.1, CLIMB: 110, H: 28, HC: 17, CRAWL: 0.42
  });
  Z.newPlayer = () => {
    const P = {
      x: 0, y: 0, w: 12, h: 28, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jumpBuf: 0, airJumps: 1, jumpHeld: false, cut: false,
      rollT: 0, rollCd: 0, rollDir: 1, rolls: 0, iframe: 0, hurtT: 0, act: null, climbing: false, ledge: null, plunge: false, dropT: 0,
      hp: 100, hpMax: 100, rally: 0, rallyT: 0, potions: 2, potMax: 2, drinkT: 0, shield: null, parryT: 0, blockT: 0,
      slots: { a1: null, a2: null, s1: null, s2: null }, cd: { s1: 0, s2: 0 }, combo: { a1: 0, a2: 0 }, comboT: { a1: 0, a2: 0 }, buf: {}, mag: {},
      gold: 0, shards: 0, kills: 0, stats: { brut: 0, takt: 0, ueber: 0 }, bless: [], st: {}, curse: 0, invis: 0, wrath: 0, afterRoll: 0,
      bountyT: 0, bounty: 0, hitCount: 0, lastSafe: null, safeT: 0, anim: { t: 0, run: 0, land: 0, blink: 0, swing: 0 }, cape: null, dead: false, revived: false,
      lookDown: false, lookUp: false, stepT: 0, rexUsed: false, firstHit: new WeakSet(), dmgDone: 0, dmgTaken: 0, time: 0
    };
    return P;
  };
  Z.has = b => Z.player && Z.player.bless.includes(b);
  Z.recalcPlayer = () => {
    const P = Z.player, s = P.stats;
    const n = s.brut + s.takt + s.ueber;
    let mx = 100 + 14 * n + 14 * s.ueber + 10 * ((Z.meta && Z.meta.up && Z.meta.up.zaeh) || 0);
    if (Z.has("unbeugsam")) mx *= 1.3;
    mx = Math.round(mx);
    const ratio = P.hpMax ? P.hp / P.hpMax : 1;
    P.hpMax = mx; P.hp = Math.min(mx, Math.max(1, Math.round(mx * ratio)));
  };

  const inp = Z.input;
  const box = (P) => ({ x: P.x, y: P.y, w: P.w, h: P.h });
  /* Aktionen puffern, damit Eingaben während einer Animation nicht verloren gehen */
  function buffer(P, dt) {
    for (const a of ["a1", "a2", "s1", "s2", "roll", "potion"]) {
      if (inp.pressed[a]) P.buf[a] = a === "roll" ? 0.14 : 0.22;
      else if (P.buf[a] > 0) P.buf[a] -= dt;
    }
    if (inp.pressed.jump) P.jumpBuf = C.JBUF; else P.jumpBuf -= dt;
  }
  const take = (P, a) => { if (P.buf[a] > 0) { P.buf[a] = 0; return true; } return false; };

  Z.updatePlayer = function (P, dt) {
    P.time += dt;
    const h = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0);
    buffer(P, dt);
    /* Zeitgeber */
    P.iframe = Math.max(0, P.iframe - dt); P.rollCd = Math.max(0, P.rollCd - dt); P.dropT = Math.max(0, P.dropT - dt);
    P.afterRoll = Math.max(0, P.afterRoll - dt); P.dodgeT = Math.max(0, (P.dodgeT || 0) - dt); P.counterT = Math.max(0, (P.counterT || 0) - dt); P.invis = Math.max(0, P.invis - dt); P.wrath = Math.max(0, P.wrath - dt);
    P.bountyT = Math.max(0, P.bountyT - dt); if (P.bountyT <= 0) P.bounty = 0;
    for (const k of ["s1", "s2"]) P.cd[k] = Math.max(0, P.cd[k] - dt * (Z.has("flinkeHaende") ? 1.3 : 1));
    for (const k of ["a1", "a2"]) { P.comboT[k] -= dt; if (P.comboT[k] <= 0) P.combo[k] = 0; }
    if (P.rallyT > 0) P.rallyT -= dt; else P.rally = Math.max(0, P.rally - dt * (Z.has("rallye") ? 8 : 16));
    statusTick(P, dt, true);
    P.lookDown = inp.held.down && P.onGround && Math.abs(P.vx) < 5 && !P.act && (P.crouchHold = (P.crouchHold || 0) + dt) > 0.6;
    if (!inp.held.down) P.crouchHold = 0;
    P.lookUp = inp.held.up && P.onGround && Math.abs(P.vx) < 5 && !P.act;

    if (P.dead) { P.vx *= 0.9; P.vy += C.GRAV * dt; Z.moveBody(P, dt); return; }
    if (P.grabbed) { if (P.grabbed.dead || !P.grabbed.act) P.grabbed = null; else { P.anim.t += dt; return; } }

    /* ---------- Kante hochziehen ---------- */
    if (P.ledge) {
      const l = P.ledge; l.t += dt; const k = U.ease(Math.min(1, l.t / l.dur));
      P.x = U.lerp(l.x0, l.x1, k > 0.5 ? (k - 0.5) * 2 : 0); P.y = U.lerp(l.y0, l.y1, Math.min(1, k * 1.6));
      P.vx = 0; P.vy = 0;
      if (l.t >= l.dur) { P.ledge = null; P.onGround = true; P.airJumps = 1; }
      return;
    }
    /* ---------- Trank trinken ---------- */
    if (P.drinkT > 0) {
      P.drinkT -= dt;
      if (P.drinkT <= 0) { const heal = Math.round(P.hpMax * 0.55); healP(P, heal); P.rally = 0; FX.burst(P.x + P.w / 2, P.y + 8, 16, { col: ["#ff6a6a", "#ffb0a0"], sp: 50, up: 40, life: 0.8, size: 2, kind: "glow", add: true }); A.play("heal"); }
    }
    /* ---------- Leiter ---------- */
    const cx = P.x + P.w / 2, tcx = Math.floor(cx / T);
    const ladderHere = W.isLadder(tcx, Math.floor((P.y + P.h - 2) / T)) || W.isLadder(tcx, Math.floor((P.y + 4) / T));
    const ladderBelow = W.isLadder(tcx, Math.floor((P.y + P.h + 2) / T));
    if (!P.climbing && !P.act && P.rollT <= 0 && P.hurtT <= 0) {
      if ((inp.held.up && ladderHere) || (inp.held.down && P.onGround && ladderBelow && !ladderHere)) {
        P.climbing = true; P.x = tcx * T + T / 2 - P.w / 2; P.vx = 0; P.vy = 0; P.airJumps = 1;
        if (inp.held.down && ladderBelow && !ladderHere) P.y += 6;
      }
    }
    if (P.climbing) {
      const v = (inp.held.down ? 1 : 0) - (inp.held.up ? 1 : 0);
      P.vy = v * C.CLIMB; P.vx = 0; P.anim.climb = (P.anim.climb || 0) + Math.abs(v) * dt * 8;
      const nextY = P.y + P.vy * dt;
      const stillLadder = W.isLadder(tcx, Math.floor((nextY + P.h - 2) / T)) || W.isLadder(tcx, Math.floor((nextY + P.h * 0.5) / T));
      if (!stillLadder && v < 0) { /* oben angekommen: auf die Leiterkante stellen */
        const top = Math.floor((P.y + P.h - 2) / T); P.y = top * T - P.h; P.climbing = false; P.onGround = true; P.vy = 0;
      } else if (!stillLadder) { P.climbing = false; }
      else { P.y = nextY; if (v > 0) { const fb = Math.floor((P.y + P.h) / T); if (W.solidT(W.tile(tcx, fb))) { P.y = fb * T - P.h; P.climbing = false; P.onGround = true; } } }
      if (P.jumpBuf > 0) { P.climbing = false; P.jumpBuf = 0; if (!inp.held.down) { P.vy = -C.JUMP * 0.8; P.vx = h * C.RUN; A.play("jump", { vol: 0.5 }); } }
      if (h && !inp.held.up && !inp.held.down && P.onGround) P.climbing = false;
      if (take(P, "roll")) { P.climbing = false; startRoll(P, h || P.face); }
      if (P.climbing) { if (P.anim.climb > 1) { P.anim.climb = 0; } return; }
    }

    /* ---------- Ducken: Runter am Boden halten – kleinere Trefferfläche, langsames Kriechen ---------- */
    const wantCrouch = inp.held.down && P.onGround && !P.climbing && !P.ledge && !P.dead && !P.grapple && !(P.act && P.act.type === "shield");
    if (wantCrouch && P.h !== C.HC) { P.y += C.H - C.HC; P.h = C.HC; P.crouch = true; if (!P.crouchSnd) { P.crouchSnd = true; A.play("step", { vol: 0.25, rate: 0.7 }); } }
    else if (!wantCrouch && P.h !== C.H) {
      /* aufstehen nur, wenn über dem Kopf Platz ist */
      const ny = P.y - (C.H - C.HC); let free = true;
      for (let tx = Math.floor((P.x + 0.5) / T); tx <= Math.floor((P.x + P.w - 0.5) / T); tx++) if (W.solidT(W.tile(tx, Math.floor(ny / T)))) free = false;
      if (free) { P.y = ny; P.h = C.H; P.crouch = false; P.crouchSnd = false; } else P.crouch = true;
    }
    /* ---------- Rolle ---------- */
    const canAct = P.hurtT <= 0 && !P.climbing;
    if (canAct && P.buf.roll > 0 && P.rollT <= 0 && (P.rollCd <= 0 || (Z.has("schattenroll") && P.rolls === 1))) {
      if (!P.act || P.act.phase !== "act" || P.act.cancelAct || (P.act.t > 0.035 && !P.act.dash)) { P.buf.roll = 0; if (P.act) endAct(P); startRoll(P, h || P.face); }
    }
    /* Rollsprung: aus der Rolle heraus springen (nach dem Ausweichfenster), Schwung bleibt erhalten */
    if (P.rollT > 0 && P.jumpBuf > 0 && C.ROLL - P.rollT > 0.06 && (P.onGround || P.coyote > 0 || P.airJumps > 0)) {
      const air = !(P.onGround || P.coyote > 0);
      P.rollT = 0; P.rollCd = C.ROLLCD; P.vx = (h || P.rollDir) * C.RUN * 1.22; if (air) P.airJumps--; doJump(P, air ? C.DJUMP : C.JUMP, air); P.coyote = 0;
    }
    if (P.rollT > 0) {
      P.rollT -= dt;
      const k = 1 - P.rollT / C.ROLL;
      const spd = C.ROLLSPD * (k < 0.75 ? 1 : 1 - (k - 0.75) * 3);
      P.vx = P.rollDir * spd;
      if (!P.onGround && k < 0.4) P.vy = Math.min(P.vy, 30);
      if (Z.has("glutspur") && Math.random() < dt * 40) Z.spawnHazard({ kind: "fire", x: P.x + P.w / 2, y: P.y + P.h - 2, w: 14, life: 2.2, dmg: 4, owner: "p" });
      if (P.rollT <= 0) { P.rollCd = C.ROLLCD; P.afterRoll = 2; if (Z.has("klingentanz")) P.st.dance = 2; P.rolls = P.rollCd > 0 && P.rolls === 1 ? 0 : P.rolls; }
    }
    /* ---------- Angriffe & Fähigkeiten ---------- */
    if (canAct && P.rollT <= 0 && P.drinkT <= 0) {
      const diving = !P.onGround && inp.held.down && !P.plunge && P.vy > -260 && !P.climbing;
      for (const s of ["a1", "a2"]) {
        if (diving && P.buf[s] > 0) continue; /* Runter + Angriff in der Luft: Sturzangriff statt normalem Schlag */
        const it = P.slots[s];
        const d = it ? Z.WEAPONS[it.id] : s === "a1" ? Z.WEAPONS.faeuste : null;
        if (!d) { take(P, s); continue; }
        if (d.kind === "shield") {
          const free = !P.act || P.act.phase === "post";
          if (P.shieldOut && P.shieldOut.slot === s) { take(P, s); continue; }
          if (inp.held[s] && (free || P.act.slot === s)) { if (!P.act || P.act.slot !== s) { startShield(P, s, it || null, d); P.buf[s] = 0; } }
          else if (P.buf[s] > 0 && !inp.held[s] && free) { P.buf[s] = 0; if (P.act) endAct(P); startBash(P, s, it || null, d); }
          continue;
        }
        if (d.kind === "ranged" && d.shoot.charge) {
          if (P.buf[s] > 0 && (!P.act || P.act.phase === "post")) { P.buf[s] = 0; if (P.act) endAct(P); startCharge(P, s, it, d); }
          continue;
        }
        if (P.buf[s] > 0 && (!P.act || (P.act.phase === "post" && P.act.t > (P.act.def.post || 0.1) * 0.25) || (P.act.slot !== s && P.act.phase === "post"))) {
          P.buf[s] = 0; if (P.act) endAct(P);
          if (Z.attackMod && Z.attackMod(P, s, it, d)) continue;
          if (d.kind === "melee") startMelee(P, s, it, d);
          else startShot(P, s, it, d);
        }
      }
      for (const s of ["s1", "s2"]) {
        const it = P.slots[s];
        if (!it) { take(P, s); continue; }
        if (P.buf[s] > 0 && P.st.silence > 0) { P.buf[s] = 0; if (P.time - (P.silT || 0) > 1) { P.silT = P.time; FX.text(P.x + P.w / 2, P.y - 8, L(["Versiegelt", "Sealed"]), "#9a6aff"); A.play("ui", { vol: 0.3 }); } }
        if (P.buf[s] > 0 && P.cd[s] <= 0 && (!P.act || P.act.phase === "post")) { P.buf[s] = 0; if (P.act) endAct(P); useSkill(P, s, it); }
      }
      /* Trank */
      if (take(P, "potion")) {
        if (P.potions > 0 && P.hp < P.hpMax && !P.act) { P.potions--; P.drinkT = 0.42; A.play("potion"); }
        else if (P.potions <= 0) { FX.text(P.x + P.w / 2, P.y - 6, L(["Leer", "Empty"]), "#a99a8b"); A.play("ui", { vol: 0.4 }); }
      }
    }
    if (P.act) updateAct(P, dt);

    /* ---------- Laufen ---------- */
    const locked = P.hurtT > 0 || P.rollT > 0;
    if (P.hurtT > 0) P.hurtT -= dt;
    if (!locked) {
      let target = h * C.RUN;
      if (P.act) {
        const a = P.act;
        if (a.type === "shield") target *= a.d.shield.move || 0.35;
        else if (a.type === "charge") target *= 0.45;
        else if (a.type === "melee" || a.type === "shot" || a.type === "skill") target = P.onGround ? 0 : P.vx * 0.98;
      }
      if (P.drinkT > 0) target *= 0.35;
      if (P.crouch && P.onGround) target *= C.CRAWL;
      if (P.st.slow > 0) target *= 0.55;
      if (P.st.web > 0) target *= 0.3;
      const acc = P.onGround ? (Math.abs(target) > Math.abs(P.vx) || U.sign(target) !== U.sign(P.vx) ? C.ACC_G : C.DEC_G) : (h ? C.ACC_A : C.DEC_A);
      if (!(P.act && P.act.lungeT > 0)) P.vx = U.approach(P.vx, target, acc * dt);
      if (h && (!P.act || P.act.type === "shield" && false || P.act.phase === "post" && P.act.type !== "shield")) { if (!P.act || P.act.phase === "post") P.face = h; }
      if (h && !P.act) P.face = h;
    }
    /* ---------- Springen ---------- */
    if (P.onGround) { P.coyote = C.COYOTE; P.airJumps = 1; P.plungeOK = true; } else P.coyote -= dt;
    if (!locked && P.jumpBuf > 0 && (!P.act || P.act.phase === "post" || P.act.type === "shield" || P.act.type === "charge")) {
      if (inp.held.down && P.onGround && P.onPlat) { P.dropT = 0.22; P.jumpBuf = 0; P.y += 2; P.onGround = false; }
      else if (P.coyote > 0) { doJump(P, C.JUMP); P.coyote = 0; }
      else if (P.airJumps > 0) { P.airJumps--; doJump(P, C.DJUMP, true); }
    }
    P.jumpT = (P.jumpT || 0) + dt;
    if (!inp.held.jump && P.jumpHeld) P.jumpRel = true;
    if (P.jumpRel && P.jumpT >= 0.085 && P.vy < 0 && !P.cut) { P.vy *= C.CUT; P.cut = true; }
    if (!inp.held.jump && P.jumpT >= 0.085) P.jumpHeld = false;
    /* Sturzangriff: in der Luft unten + Angriff */
    if (!P.onGround && !locked && inp.held.down && (P.buf.a1 > 0 || P.buf.a2 > 0) && (!P.act || P.act.phase === "post") && !P.plunge && P.vy > -260) {
      const s = P.buf.a1 > 0 ? "a1" : "a2"; if (P.act) endAct(P); const it = P.slots[s], d = it ? Z.WEAPONS[it.id] : Z.WEAPONS.faeuste;
      if (d && Z.diveStart && Z.diveStart(P, s, it, d)) { P.buf[s] = 0; }
      else if (d && d.kind === "melee") { P.buf[s] = 0; P.plunge = true; P.plungeItem = it; P.vy = 640; P.vx = 0; A.play("swingHeavy", { vol: 0.7 }); }
    }
    /* Schwerkraft */
    if (!P.onGround) {
      let g = C.GRAV;
      if (P.vy > 0) g *= C.FALL;
      if (Math.abs(P.vy) < 70 && inp.held.jump && !P.cut) g *= 0.55;
      if (P.act && P.act.type === "melee" && P.act.phase !== "post" && !P.plunge) g *= P.act.airHover ? 0.25 : 0.6;
      if (P.act && P.act.type === "charge") g *= 0.6;
      if (inp.held.down && P.vy > 0 && !P.plunge) g *= 1.35;
      P.vy = Math.min(P.vy + g * dt, P.plunge ? 700 : inp.held.down ? C.MAXFALL * 1.3 : C.MAXFALL);
    }
    const preVy = P.vy;
    if (P.vy < 0) cornerNudge(P, dt);
    Z.moveBody(P, dt);
    pushOutOfEnemies(P);
    /* Landung */
    if (P.justLanded) {
      P.cut = false; P.anim.land = Math.min(1, preVy / 500);
      if (preVy > 200) { FX.burst(P.x + P.w / 2, P.y + P.h, Math.round(preVy / 70), { col: Z.dustCol || "#8a7a70", sp: 60, ang: -Math.PI / 2, spread: 2.6, life: 0.45, size: 2.5, kind: "smoke", g: -20 }); A.play("land", { vol: U.clamp(preVy / 600, 0.25, 0.8), x: P.x, y: P.y }); }
      if (P.plunge) plungeLand(P);
    }
    /* Kante greifen: in der Luft, gegen eine Wand drückend, Kante in Handhöhe */
    if (!P.onGround && !P.act && P.rollT <= 0 && h && P.vy > -60 && !P.plunge) tryLedge(P, h);
    /* Gefahren */
    hazards(P, dt);
    /* letzter sicherer Platz */
    P.safeT -= dt;
    if (P.onGround && !P.onPlat && P.safeT <= 0) {
      const tx = Math.floor((P.x + P.w / 2) / T), ty = Math.floor((P.y + P.h + 1) / T);
      if (W.tile(tx, ty) === 1 && ![3, 5, 6, 9].includes(W.tile(tx - 1, ty - 1)) && ![3, 5, 6].includes(W.tile(tx + 1, ty - 1)) && W.tile(tx - 1, ty) === 1 && W.tile(tx + 1, ty) === 1) { P.lastSafe = { x: P.x, y: P.y + P.h - C.H }; P.safeT = 0.3; }
    }
    /* Schritte */
    if (P.onGround && Math.abs(P.vx) > 40) {
      P.anim.run += Math.abs(P.vx) * dt / 26;
      P.stepT -= dt * Math.abs(P.vx) / C.RUN;
      if (P.stepT <= 0) { P.stepT = 0.29; A.play(P.onPlat ? "stepWood" : "step", { vol: 0.22, x: P.x, y: P.y, gap: 0.1 }); if (Math.random() < 0.5) FX.p({ x: P.x + P.w / 2 - P.face * 4, y: P.y + P.h, vx: -P.vx * 0.15, vy: -12, life: 0.35, size: 2, col: Z.dustCol || "#8a7a70", kind: "smoke" }); }
    } else P.anim.run = 0;
    P.anim.t += dt; P.anim.land = Math.max(0, P.anim.land - dt * 5);
    P.anim.blink -= dt;
  };

  function doJump(P, v, dbl) {
    P.vy = -v; P.jumpBuf = 0; P.jumpHeld = true; P.jumpRel = false; P.jumpT = 0; P.cut = false; P.onGround = false;
    if (dbl) {
      FX.ring(P.x + P.w / 2, P.y + P.h, 12, "#ff5a3a", 0.3, 2);
      FX.burst(P.x + P.w / 2, P.y + P.h, 10, { col: ["#ff5a3a", "#ffb040", "#8a1a1a"], sp: 70, ang: Math.PI / 2, spread: 2.4, life: 0.4, size: 2, kind: "spark", add: true });
      A.play("jump", { vol: 0.5, rate: 1.2 });
    } else {
      FX.burst(P.x + P.w / 2, P.y + P.h, 5, { col: Z.dustCol || "#8a7a70", sp: 40, ang: -Math.PI / 2, spread: 2.8, life: 0.35, size: 2, kind: "smoke" });
      A.play("jump", { vol: 0.35 });
    }
  }
  function startRoll(P, dir) {
    P.rollT = C.ROLL; P.rollDir = dir; P.face = dir; P.iframe = Math.max(P.iframe, C.DODGE); P.dodgeT = C.DODGE; P.dodged = false; P.rolls = (P.rolls || 0) + 1;
    if (P.rolls >= 2 && Z.has("schattenroll")) { P.invis = 1.2; P.rolls = 0; }
    if (P.plunge) P.plunge = false;
    A.play("roll", { vol: 0.5 });
    FX.burst(P.x + P.w / 2, P.y + P.h - 2, 6, { col: Z.dustCol || "#8a7a70", sp: 50, ang: Math.PI + (dir > 0 ? 0 : Math.PI), spread: 0.8, life: 0.35, size: 2.5, kind: "smoke" });
  }
  /* Eckenkorrektur: stößt nur eine Kopfkante an eine Deckenecke (bis 5 px), rutscht man daran vorbei statt abzuprallen */
  function cornerNudge(P, dt) {
    const ty = Math.floor((P.y + P.vy * dt) / T); if (ty === Math.floor(P.y / T)) return;
    const l = Math.floor((P.x + 0.5) / T), r = Math.floor((P.x + P.w - 0.5) / T);
    const sl = W.solidT(W.tile(l, ty)), sr = W.solidT(W.tile(r, ty));
    if (sl && !sr) { const push = (l + 1) * T - P.x; if (push > 0 && push <= 5 && !W.solidT(W.tile(Math.floor((P.x + push + P.w - 0.5) / T), ty))) P.x += push + 0.01; }
    else if (sr && !sl) { const push = P.x + P.w - r * T; if (push > 0 && push <= 5 && !W.solidT(W.tile(Math.floor((P.x - push + 0.5) / T), ty))) P.x -= push + 0.01; }
  }
  function tryLedge(P, h) {
    const frontX = h > 0 ? P.x + P.w + 2 : P.x - 2, tx = Math.floor(frontX / T);
    for (const off of [2, 8]) {
      const handY = P.y + off, ty = Math.floor(handY / T);
      if (!W.solidT(W.tile(tx, ty))) continue;
      if (W.solidT(W.tile(tx, ty - 1)) || W.solidT(W.tile(tx, ty - 2))) continue;
      const topY = ty * T;
      if (P.y + off - topY > 14) continue;
      /* Platz über der Kante für den Körper? */
      const x1 = h > 0 ? tx * T + 1 : (tx + 1) * T - P.w - 1;
      const free = !W.solidT(W.tile(Math.floor(x1 / T), ty - 1)) && !W.solidT(W.tile(Math.floor((x1 + P.w - 1) / T), ty - 1)) && !W.solidT(W.tile(Math.floor(x1 / T), ty - 2)) && !W.solidT(W.tile(Math.floor((x1 + P.w - 1) / T), ty - 2));
      if (!free) continue;
      /* Kopf darf nicht gegen eine Decke stoßen */
      if (W.solidT(W.tile(Math.floor((P.x + P.w / 2) / T), ty - 2))) continue;
      P.ledge = { t: 0, dur: 0.17, x0: P.x, y0: P.y, x1, y1: topY - P.h };
      P.vx = 0; P.vy = 0; P.face = h; A.play("jump", { vol: 0.3, rate: 0.8 });
      return;
    }
  }
  function hazards(P, dt) {
    const tx0 = Math.floor((P.x + 2) / T), tx1 = Math.floor((P.x + P.w - 2) / T), tyF = Math.floor((P.y + P.h - 3) / T), tyM = Math.floor((P.y + P.h * 0.5) / T);
    let spike = false, liquid = 0;
    for (let tx = tx0; tx <= tx1; tx++) {
      const a = W.tile(tx, tyF), b = W.tile(tx, tyM);
      if (a === 3) spike = true;
      if (a === 5 || b === 5) liquid = 5;
      if ((a === 6 || b === 6) && !liquid) liquid = 6;
    }
    /* Abgrund: wer hineinfällt, verliert Leben und steht am letzten sicheren Platz wieder auf */
    if (W.tile(Math.floor((P.x + P.w / 2) / T), Math.floor((P.y + P.h * 0.35) / T)) === 9) {
      const hurt = Math.round(P.hpMax * 0.15);
      FX.flashScreen("#000000", 0.7); A.play("hurt", { vol: 0.6 }); A.play("land", { vol: 0.5, rate: 0.6 });
      Z.hurtPlayer(hurt, { x: P.x, unblockable: true, hazard: true, force: true, kb: 0 });
      if (!P.dead) {
        const lvS = Z.level && Z.level.start, s = P.lastSafe || (lvS ? { x: lvS.x * T + 8 - P.w / 2, y: (lvS.y + 1) * T - P.h } : null);
        if (s) { P.x = s.x; P.y = s.y; P.h = C.H; P.crouch = false; } P.vx = 0; P.vy = 0; P.iframe = Math.max(P.iframe, 1.1); P.rollT = 0; P.act = null; P.grapple = null;
        FX.text(P.x + P.w / 2, P.y - 10, L(["Abgestürzt!", "Fell!"]), "#ff8a6a", true); Z.stats.falls = (Z.stats.falls || 0) + 1;
        Z.cam.x = P.x + P.w / 2 - Z.cam.w / 2; Z.cam.y = P.y + P.h / 2 - Z.cam.h / 2; Z.cam.clamp && Z.cam.clamp();
      }
      return;
    }
    if (spike && P.iframe <= 0) {
      Z.hurtPlayer(Math.round(P.hpMax * 0.14), { x: P.x + P.w / 2, kb: 0, spike: true, unblockable: true });
      P.vy = -330; P.y -= 2;
    }
    if (liquid && P.y + P.h > Math.floor((P.y + P.h - 3) / T) * T + 6) {
      if (liquid === 5) { if (P.iframe <= 0 || true) Z.hurtPlayer(Math.round(P.hpMax * 0.18), { x: P.x, unblockable: true, hazard: true, force: true }); addStatus(P, "burn", 2, true); }
      else { A.play("splash", { x: P.x, y: P.y }); FX.burst(P.x + P.w / 2, P.y + P.h, 14, { col: ["#4a6a5a", "#8aa090"], sp: 90, ang: -Math.PI / 2, spread: 1.2, life: 0.5, g: 400, size: 2 }); Z.hurtPlayer(Math.round(P.hpMax * 0.08), { x: P.x, unblockable: true, hazard: true, force: true }); }
      if (P.lastSafe) { P.x = P.lastSafe.x; P.y = P.lastSafe.y; P.h = C.H; P.crouch = false; P.vx = 0; P.vy = 0; P.iframe = Math.max(P.iframe, 1); }
    }
  }
  function pushOutOfEnemies(P) {
    if (P.rollT > 0 || P.ledge || P.climbing || P.act && P.act.dash) return;
    for (const e of Z.enemies) {
      if (e.dead || e.def.fly || e.def.noBlock || e.ghost) continue;
      if (!U.overlap(P, e)) continue;
      const pc = P.x + P.w / 2, ec = e.x + e.w / 2;
      if (P.y + P.h < e.y + 6) continue; /* auf dem Kopf stehen: nicht schieben */
      const dir = pc < ec ? -1 : 1, pen = dir < 0 ? P.x + P.w - e.x : e.x + e.w - P.x;
      const move = Math.min(pen, 3);
      const ovx = P.vx; P.vx = dir * move * 60; const oy = P.vy; P.vy = 0; Z.moveBody(P, 1 / 60); P.vx = ovx; P.vy = oy;
      if (Math.abs(P.vx) > 0 && U.sign(P.vx) === -dir) P.vx *= 0.4;
    }
  }
  function healP(P, n) {
    const before = P.hp; P.hp = Math.min(P.hpMax, P.hp + n);
    const d = P.hp - before; if (d > 0.5) FX.text(P.x + P.w / 2, P.y - 4, "+" + Math.round(d), "#7fd36a");
    return d;
  }
  Z.healPlayer = n => healP(Z.player, n);

  /* ---------- Nahkampf ---------- */
  function startMelee(P, slot, it, d) {
    const speed = 1 + (Z.hasAff(it, "flink") ? 0.18 : 0) + (P.wrath > 0 ? 0.1 : 0);
    let step = P.combo[slot] % d.combo.length;
    const c = d.combo[step];
    P.act = { slot, it, d, def: c, type: "melee", step, phase: "pre", t: 0, speed, hit: new Set(), lungeT: 0, airHover: !P.onGround && !P.usedHover };
    if (!P.onGround) P.usedHover = true; else P.usedHover = false;
    P.combo[slot] = step + 1; P.comboT[slot] = 0.7;
    if (inp.held.left && !inp.held.right) P.face = -1; else if (inp.held.right && !inp.held.left) P.face = 1;
    /* Zielhilfe: zum nächsten Gegner drehen, wenn er knapp hinter einem steht */
    const tgt = nearestEnemy(P, 60, true); if (tgt && !inp.held.left && !inp.held.right) P.face = tgt.x + tgt.w / 2 > P.x + P.w / 2 ? 1 : -1;
  }
  function startShot(P, slot, it, d) {
    const s = d.shoot;
    if (s.mag) { const m = P.mag[slot] || { n: s.mag + (Z.metaLvl(it.id) >= 3 ? 2 : 0), t: 0 }; P.mag[slot] = m; if (m.n <= 0) return; }
    P.act = { slot, it, d, def: { pre: s.pre || 0.06, act: 0.02, post: s.post || 0.15 }, type: "shot", phase: "pre", t: 0, speed: 1 + (Z.hasAff(it, "flink") ? 0.18 : 0), fired: 0 };
    const tgt = nearestEnemy(P, 260, false); if (tgt && Z.settings.autoAim && !inp.held.left && !inp.held.right) P.face = tgt.x + tgt.w / 2 > P.x + P.w / 2 ? 1 : -1;
    else if (inp.held.left && !inp.held.right) P.face = -1; else if (inp.held.right) P.face = 1;
  }
  function startCharge(P, slot, it, d) {
    P.act = { slot, it, d, def: { pre: 0, act: 0, post: d.shoot.post }, type: "charge", phase: "charge", t: 0, charge: 0 };
    A.play("bow", { vol: 0.25, rate: 0.7 });
  }
  function startShield(P, slot, it, d) {
    if (P.act) endAct(P);
    P.act = { slot, it, d, def: { post: 0.12 }, type: "shield", phase: "hold", t: 0 };
    P.parryT = d.shield.parry * (Z.metaLvl(it ? it.id : "") >= 3 && it && it.id === "goldschild" ? 1.2 : 1);
    A.play("block", { vol: 0.3, rate: 1.3 });
  }
  /* Schildstoß: kurzer Stoß nach vorn, wenig Schaden, betäubt; jeder Schild hat eigene Wirkungen (werkzeuge.js) */
  function startBash(P, slot, it, d) {
    const sh = d.shield;
    if (Z.shieldHook && Z.shieldHook("bashStart", P, { slot, it, d }) === false) return;
    const c = Object.assign({ pre: 0.05, act: 0.1, post: 0.2, dmg: sh.bash, box: [-2, -28, 24, 28], lunge: 170, kb: 230, kbUp: 90, sw: "punch", heavy: true, hitSnd: "hitMetal",
      eff: Object.assign({ stun: 0.45 }, sh.bashEff || {}), smear: { r: 16, a0: -0.3, a1: 0.3, th: 10, stab: true } }, sh.bashDef || {});
    P.act = { slot, it, d, def: c, type: "melee", bash: true, step: 0, phase: "pre", t: 0, speed: 1, hit: new Set(), lungeT: 0 };
    if (inp.held.left && !inp.held.right) P.face = -1; else if (inp.held.right && !inp.held.left) P.face = 1;
    A.play("block", { vol: 0.4, rate: 0.8 });
  }
  function endAct(P) { P.act = null; P.parryT = 0; }
  function updateAct(P, dt) {
    const a = P.act; a.t += dt * (a.speed || 1);
    if (a.lungeT > 0) { a.lungeT -= dt; if (P.onGround || a.dash) P.vx = P.face * a.lungeV * (a.dash ? 1 : U.clamp(a.lungeT / 0.08, 0, 1)); }
    if (a.type === "shield") {
      P.parryT = Math.max(0, P.parryT - dt);
      if (!inp.held[a.slot]) { if (a.t < 0.2 && !a.parried) { startBash(P, a.slot, a.it, a.d); return; } a.phase = "post"; a.type = "shieldDown"; a.t = 0; }
      if (inp.held.left && !inp.held.right) P.face = -1; else if (inp.held.right && !inp.held.left) P.face = 1;
      return;
    }
    if (a.type === "shieldDown") { if (a.t > 0.08) endAct(P); return; }
    if (a.type === "charge") {
      if (a.phase === "charge") {
        a.charge = Math.min(1, a.charge + dt / a.d.shoot.charge);
        if (inp.held.left && !inp.held.right) P.face = -1; else if (inp.held.right && !inp.held.left) P.face = 1;
        if (a.charge >= 1 && !a.full) { a.full = true; FX.ring(P.x + P.w / 2 + P.face * 10, P.y + 10, 10, "#ffd27a", 0.25); A.play("ui", { vol: 0.35, rate: 1.6 }); }
        if (!inp.held[a.slot]) {
          if (a.t >= a.d.shoot.minCharge || true) fireBow(P, a);
          a.phase = "post"; a.t = 0;
        }
      } else if (a.t > a.def.post) endAct(P);
      return;
    }
    const c = a.def;
    if (a.phase === "pre" && a.t >= c.pre) {
      a.phase = "act"; a.t = 0;
      if (a.type === "melee") {
        a.lungeV = c.lunge || 0; a.lungeT = c.lunge ? (c.dash ? c.act : 0.09) : 0;
        if (c.dash) { P.iframe = Math.max(P.iframe, c.act + 0.05); a.dash = true; }
        A.play(c.sw || "swing", { vol: 0.55, x: P.x, y: P.y, rate: c.heavy ? 0.85 : 1 });
        const sm = c.smear;
        if (sm) {
          const col = a.d.col || "#ff5a4e";
          FX.smear({ x: P.x + P.w / 2 + (sm.stab ? P.face * 4 : 0), y: P.y + P.h - 16, dir: P.face, r: sm.r, a0: sm.a0, a1: sm.a1, th: sm.th, life: c.heavy ? 0.2 : 0.14, col: col, core: "#fff6e0", a: 0.85, stab: sm.stab });
        }
        if (c.proj === "anker") Z.spawnProj("anker", P.x + P.w / 2, P.y + 10, P.face, { dmg: dmgOf(P, a.it, c.dmg), it: a.it });
      }
      if (a.type === "shot") fireShot(P, a);
    }
    if (a.phase === "act") {
      if (a.type === "melee") meleeHits(P, a);
      if (a.type === "shot" && a.d.shoot.burst && a.fired < a.d.shoot.burst && a.t > a.fired * a.d.shoot.burstGap) fireShot(P, a);
      if (a.t >= (c.act || 0.02) + (a.type === "shot" && a.d.shoot.burst ? a.d.shoot.burst * a.d.shoot.burstGap : 0)) {
        a.phase = "post"; a.t = 0;
        if (a.type === "melee" && c.quake) quake(P, a);
        if (a.type === "melee" && c.spikes) rockSpikes(P, a);
        if (a.type === "melee" && c.proj === "lichtwelle") Z.spawnProj("lichtwelle", P.x + P.w / 2 + P.face * 14, P.y + 6, P.face, { dmg: dmgOf(P, a.it, c.dmg) * 0.7, it: a.it });
        if (a.type === "melee" && a.d === Z.WEAPONS.sicheln && Z.metaLvl("sicheln") >= 3 && a.step === 3) Z.spawnProj("glutsichel", P.x + P.w / 2, P.y + 10, P.face, { dmg: dmgOf(P, a.it, 10), it: a.it });
      }
    }
    if (a.phase === "post" && a.t >= c.post) endAct(P);
  }
  function nearestEnemy(P, range, behindToo) {
    let best = null, bd = range;
    for (const e of Z.enemies) {
      if (e.dead || e.hidden) continue;
      const dx = e.x + e.w / 2 - (P.x + P.w / 2), dy = e.y + e.h / 2 - (P.y + P.h / 2);
      if (Math.abs(dy) > 70) continue;
      if (!behindToo && U.sign(dx) !== P.face && Math.abs(dx) > 8 && (inp.held.left || inp.held.right)) continue;
      const d = Math.hypot(dx, dy * 1.5);
      if (d < bd && W.los(P.x + P.w / 2, P.y + 10, e.x + e.w / 2, e.y + e.h / 2)) { bd = d; best = e; }
    }
    return best;
  }
  Z.nearestEnemy = nearestEnemy;
  Z.dmgOf = dmgOf;
  function dmgOf(P, it, base) {
    let m = it ? Z.itemMul(it) : 1 + 0.12 * P.stats.brut;
    if (P.wrath > 0) m *= 1.6;
    if (Z.has("zerbrechlich")) m *= 1.5;
    if ((Z.has("darkinblut") || Z.hasAff(it, "zornig")) && P.hp < P.hpMax * 0.5) m *= 1.4;
    if (P.st.dance > 0) m *= 1.4;
    if (P.bounty) m *= 1 + 0.08 * P.bounty;
    m *= 1 + 0.05 * ((Z.meta && Z.meta.up && Z.meta.up.klingen) || 0);
    return base * m;
  }
  function critCheck(P, a, e, c) {
    const d = a.d, cond = c.crit || d.crit;
    let crit = false;
    const behind = (e.face === P.face) && Math.abs(e.x + e.w / 2 - (P.x + P.w / 2)) > 2;
    switch (cond) {
      case "always": crit = true; break;
      case "backstab": crit = behind || !e.aware; break;
      case "stunned": crit = e.st.stun > 0 || e.st.root > 0; break;
      case "multi": crit = a.hitCountNow >= 3; break;
      case "tip": crit = Math.abs(e.x + e.w / 2 - (P.x + P.w / 2)) > 52; break;
      case "air": crit = !e.onGround || e.def.fly; break;
      case "burning": crit = e.st.burn > 0; break;
      case "afterRoll": crit = P.afterRoll > 0; break;
      case "poisoned": crit = e.st.poison > 0; break;
      case "bleeding": crit = e.st.bleed > 0; break;
      case "far": crit = Math.abs(e.x - P.x) > 130; break;
    }
    if (!crit && Z.hasAff(a.it, "meuchelnd") && behind) crit = true;
    if (!crit && Z.hasAff(a.it, "kritisch") && Z.R() < 0.15) crit = true;
    if (P.st.smoke > 0) { crit = true; P.st.smoke = 0; P.invis = 0; }
    if (P.counterT > 0) { crit = true; P.counterT = 0; }
    return crit;
  }
  function meleeHits(P, a) {
    const c = a.def;
    const [bx, by, bw, bh] = c.box;
    const cx = P.x + P.w / 2, fy = P.y + P.h;
    const r = P.face > 0 ? { x: cx + bx, y: fy + by, w: bw, h: bh } : { x: cx - bx - bw, y: fy + by, w: bw, h: bh };
    if (c.spin) { r.x = cx - bw / 2 - 4; r.w = bw + 8; }
    const targets = [];
    for (const e of Z.enemies) if (!e.dead && !a.hit.has(e) && !(e.intro > 0) && U.overlap(r, e)) targets.push(e);
    a.hitCountNow = a.hit.size + targets.length;
    for (const e of targets) {
      a.hit.add(e);
      const crit = critCheck(P, a, e, c);
      let dmg = dmgOf(P, a.it, c.dmg);
      if (crit) dmg *= c.critMul || a.d.critMul || 1.8;
      if (a.d.vsHoly && (e.def.undead || e.def.demon)) dmg *= a.d.vsHoly;
      let kb = (c.kb || 0) * (Z.hasAff(a.it, "wuchtig") ? 1.6 : 1);
      if (c.pull) kb = -Math.min(260, Math.abs(e.x - P.x) * 3.2);
      const eff = Object.assign({}, c.eff || {}, a.d.eff || {});
      a.it && a.it.aff.forEach(af => { const ad = Z.AFFIX[af]; if (ad.eff) for (const k in ad.eff) eff[k] = (eff[k] || 0) + ad.eff[k]; });
      if (Z.hasAff(a.it, "betaeubend") && Z.R() < 0.15) eff.stun = Math.max(eff.stun || 0, 0.8);
      if (c.pull && Z.metaLvl("kettenpeitsche") >= 3) eff.stun = Math.max(eff.stun || 0, 0.6);
      Z.hitEnemy(e, dmg, { crit, kb, kbUp: c.kbUp || (crit ? 60 : 30), eff, src: "melee", it: a.it, heavy: c.heavy, wallSlam: c.wallSlam, dir: P.face, sfx: c.hitSnd });
      if (a.d.leech) Z.healPlayer(dmg * a.d.leech);
      if (c.onHit) c.onHit(P, e, dmg, a);
      if (a.bash && Z.shieldHook) Z.shieldHook("bashHit", P, { a, e, dmg });
    }
    /* Kisten, Fässer, rissige Wände */
    Z.hitProps && Z.hitProps(r, dmgOf(P, a.it, c.dmg), a);
  }
  function quake(P, a) {
    const far = Z.metaLvl("kriegshammer") >= 3 ? 2 : 1;
    FX.addShake(5); A.play("quake", { vol: 0.5 });
    for (const dir of [-1, 1]) Z.spawnProj("schockwelle", P.x + P.w / 2 + dir * 10, P.y + P.h - 6, dir, { dmg: dmgOf(P, a.it, 14), it: a.it, life: 0.5 * far });
  }
  function rockSpikes(P, a) {
    const rows = Z.metaLvl("steinfaust") >= 3 ? 3 : 1;
    for (let r = 0; r < rows; r++) for (let i = 0; i < 4; i++) setTimeout(() => Z.spawnHazard({ kind: "rockspike", x: P.x + P.w / 2 + P.face * (24 + i * 18), y: P.y + P.h, w: 14, life: 0.45, dmg: dmgOf(P, a.it, 10), owner: "p", kbUp: 300, once: true }), (i * 70 + r * 220));
    A.play("rock", { vol: 0.6 });
  }
  function plungeLand(P) {
    if (Z.diveLand && Z.diveLand(P)) { P.plunge = false; return; }
    P.plunge = false;
    const it = P.plungeItem, dmg = dmgOf(P, it, 26);
    FX.addShake(6); FX.stop(0.05); A.play("hitHeavy", { vol: 0.7 }); A.play("land", { vol: 0.8 });
    FX.ring(P.x + P.w / 2, P.y + P.h, 46, "#ff8a5a", 0.35, 3);
    FX.burst(P.x + P.w / 2, P.y + P.h, 20, { col: [Z.dustCol || "#8a7a70", "#ff7a4a"], sp: 160, ang: -Math.PI / 2, spread: 2.8, life: 0.5, size: 3, kind: "smoke" });
    const r = { x: P.x - 34, y: P.y - 6, w: P.w + 68, h: P.h + 12 };
    for (const e of Z.enemies) if (!e.dead && U.overlap(r, e)) Z.hitEnemy(e, dmg, { kb: 120, kbUp: 200, eff: { stun: 0.7 }, src: "melee", it, heavy: true, dir: U.sign(e.x - P.x) || 1 });
    Z.hitProps && Z.hitProps(r, dmg, null);
    P.vy = -160; P.onGround = false;
  }

  /* ---------- Fernkampf ---------- */
  function fireShot(P, a) {
    const s = a.d.shoot; a.fired = (a.fired || 0) + 1;
    const x = P.x + P.w / 2 + P.face * 8, y = P.y + 9;
    const base = dmgOf(P, a.it, s.dmg);
    const eff = Object.assign({}, a.d.eff || {});
    a.it && a.it.aff.forEach(af => { const ad = Z.AFFIX[af]; if (ad.eff) for (const k in ad.eff) eff[k] = (eff[k] || 0) + ad.eff[k]; });
    A.play(s.sw || "bow", { vol: 0.55 });
    if (s.mag) { const m = P.mag[a.slot]; m.n--; if (m.n <= 0) { m.t = s.reload; } }
    const lv = Z.metaLvl(a.it.id);
    switch (s.proj) {
      case "bolzen": Z.spawnProj("bolzen", x, y, P.face, { dmg: base, it: a.it, eff, crit: "far" }); break;
      case "messer": Z.spawnProj("messer", x, y + (a.fired - 2) * 3, P.face, { dmg: base, it: a.it, eff: Object.assign({ bleed: 1 }, eff), bounce: lv >= 3 ? 1 : 0, vy: (a.fired - 2) * 18 }); break;
      case "phiole": { const n = lv >= 3 ? 2 : 1; for (let i = 0; i < n; i++) Z.spawnProj("phiole", x, y, P.face, { dmg: base, it: a.it, eff, vx: P.face * (170 + i * 60), vy: -220 - i * 20 }); break; }
      case "blitz": Z.chainLightning(P, x, y, base, (s.chain || 4) + (lv >= 3 ? 2 : 0), Object.assign({ stun: 0.3 }, eff), a.it); break;
      case "netz": Z.spawnProj("netz", x, y, P.face, { dmg: base, it: a.it, eff: Object.assign({ root: 2.2, mark: 3 }, eff), pierce: lv >= 3 }); break;
      default: if (Z.SHOT_FX && Z.SHOT_FX[s.proj]) Z.SHOT_FX[s.proj](P, a, x, y, base, eff, lv);
    }
    FX.burst(x + P.face * 4, y, 4, { col: "#ffe0a0", sp: 60, ang: P.face > 0 ? 0 : Math.PI, spread: 0.6, life: 0.15, size: 1.5, kind: "spark", add: true });
  }
  function fireBow(P, a) {
    const k = a.charge, s = a.d.shoot, full = k >= 1;
    const dmg = dmgOf(P, a.it, U.lerp(s.dmg, s.dmgFull, k));
    const eff = {}; a.it.aff.forEach(af => { const ad = Z.AFFIX[af]; if (ad.eff) Object.assign(eff, ad.eff); });
    const x = P.x + P.w / 2 + P.face * 8, y = P.y + 9;
    const n = full && Z.metaLvl("bogen") >= 3 ? 3 : 1;
    for (let i = 0; i < n; i++) Z.spawnProj("pfeil", x, y, P.face, { dmg, it: a.it, eff, pierce: full, critAlways: full, speed: U.lerp(380, 640, k), vy: (i - (n - 1) / 2) * 50 });
    A.play("bow", { vol: 0.6 }); if (full) FX.addShake(2);
  }

  /* ---------- Fähigkeiten ---------- */
  function useSkill(P, slot, it) {
    const id = it.id, d = Z.SKILLS[id];
    const m = Z.itemMul(it) * (P.wrath > 0 ? 1.3 : 1) * (Z.has("zerbrechlich") ? 1.5 : 1);
    P.cd[slot] = d.cd * (Z.hasAff(it, "flink") ? 0.82 : 1);
    P.act = { slot, it, d, def: { pre: 0.06, act: 0.02, post: 0.14 }, type: "skill", phase: "post", t: 0 };
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2, f = P.face;
    const eff = {}; it.aff.forEach(af => { const ad = Z.AFFIX[af]; if (ad.eff) Object.assign(eff, ad.eff); });
    switch (id) {
      case "rex": Z.spawnAlly("rex", cx, P.y + P.h - 14, { dmg: 9 * m, life: 12 }); A.play("bark"); break;
      case "spottlied":
        A.play("laugh", { vol: 0.5 }); FX.ring(cx, cy, 110, "#ffc24a", 0.6, 3);
        for (const e of Z.enemies) if (!e.dead && U.dist(cx, cy, e.x + e.w / 2, e.y + e.h / 2) < 120) { addStatus(e, "weak", 6); addStatus(e, "fear", 1.2); FX.text(e.x + e.w / 2, e.y - 6, R2(["„Schwachkopf!“", "„Mistvieh!“", "„Ich hab Lieder über dich!“", "„Deine Mutter …“"], ['"Nitwit!"', '"Vermin!"', '"I wrote songs about you!"', '"Your mother…"']), "#ffc24a"); }
        FX.burst(cx, P.y, 10, { col: "#ffc24a", sp: 70, up: 50, life: 0.9, size: 3, kind: "glow", add: true });
        break;
      case "pfeilhagel": {
        A.play("bow", { vol: 0.6 });
        const tx = cx + f * 70;
        for (let i = 0; i < 14; i++) setTimeout(() => Z.spawnProj("regenpfeil", tx + (Math.random() - 0.5) * 90, Z.cam.y - 10, 0, { dmg: 7 * m, eff }), i * 55);
        break;
      }
      case "echoblitz": Z.chainLightning(P, cx, P.y + 6, 24 * m, 3, Object.assign({ stun: 0.5 }, eff), it, true); break;
      case "giftwolke": Z.spawnHazard({ kind: "poisoncloud", x: cx + f * 40, y: P.y + P.h, w: 80, life: 5, dmg: 3 * m, owner: "p", eff: { poison: 1 } }); A.play("poison"); break;
      case "rauchbombe": P.invis = 3; P.st.smoke = 3.2; FX.burst(cx, cy, 30, { col: ["#6a6070", "#8a8090", "#4a4050"], sp: 80, life: 1.2, size: 6, kind: "smoke", drag: 0.92 }); A.play("shadow"); for (const e of Z.enemies) if (e.aware && U.dist(cx, cy, e.x, e.y) < 300) e.lostT = 3; break;
      case "baerenfalle": Z.spawnProj("falle", cx, P.y + 6, f, { dmg: 18 * m, eff }); A.play("chain"); break;
      case "floete": Z.spawnAlly("illusion", cx + f * 30, P.y + P.h - 20, { life: 7 }); A.play("magic"); break;
      case "kristall":
        A.play("rock");
        for (let i = 0; i < 5; i++) setTimeout(() => Z.spawnHazard({ kind: "rockspike", x: cx + f * (26 + i * 20), y: P.y + P.h, w: 16, life: 0.5, dmg: 16 * m, owner: "p", kbUp: 340, once: true, eff }), i * 75);
        break;
      case "schattenschritt": {
        const e = nearestEnemy(P, 200, true);
        if (e) { const side = e.face > 0 ? -1 : 1; P.x = e.x + e.w / 2 + side * (e.w / 2 + 10) - P.w / 2; P.y = e.y + e.h - P.h; Z.unstick(P); P.face = -side; FX.burst(cx, cy, 16, { col: ["#a060ff", "#2a1a3a"], sp: 90, life: 0.4, size: 3, kind: "smoke" }); A.play("shadow");
          setTimeout(() => { if (!e.dead) { Z.hitEnemy(e, 30 * m * 2, { crit: true, kb: 60, src: "skill", it, eff }); FX.smear({ x: P.x + P.w / 2, y: P.y + 12, dir: P.face, r: 22, a0: -0.4, a1: 0.3, th: 4, life: 0.14, col: "#a060ff", core: "#fff", stab: true }); } }, 60); }
        else P.cd[slot] = 0.5;
        break;
      }
      case "kraeuter": P.st.regen = 5; P.st.regenAmt = P.hpMax * 0.3 / 5; A.play("heal"); FX.burst(cx, cy, 14, { col: "#7fd36a", sp: 40, up: 30, life: 1, size: 2, kind: "leaf" }); break;
      case "kriegshorn": A.play("horn"); FX.ring(cx, cy, 90, "#c8a060", 0.5, 4); FX.addShake(4);
        for (const e of Z.enemies) if (!e.dead && U.dist(cx, cy, e.x + e.w / 2, e.y + e.h / 2) < 95) addStatus(e, "stun", 2);
        break;
      case "sprengphiole": Z.spawnProj("bombe", cx, P.y + 6, f, { dmg: 34 * m, eff, vx: f * 200, vy: -200 }); A.play("glass", { vol: 0.4 }); break;
      case "darkinzorn": P.wrath = 8; A.play("roar", { vol: 0.6 }); FX.flashScreen("#ff2a1a", 0.25); FX.ring(cx, cy, 60, "#ff2a3a", 0.5, 4); break;
      case "ranken": A.play("roots");
        for (let i = 0; i < 6; i++) setTimeout(() => Z.spawnHazard({ kind: "roots", x: cx + f * (20 + i * 22), y: P.y + P.h, w: 20, life: 0.7, dmg: 6 * m, owner: "p", eff: Object.assign({ root: 2.5 }, eff), once: true }), i * 60);
        break;
      default: if (Z.SKILL_FX && Z.SKILL_FX[id] && Z.SKILL_FX[id](P, it, { m, eff, slot, cx, cy, f }) === false) P.cd[slot] = 0.4; break;
      case "drachenatem": Z.spawnHazard({ kind: "breath", x: cx + f * 8, y: P.y + 10, w: 90, dir: f, life: 0.9, dmg: 5 * m, owner: "p", eff: { poison: 2 } }); A.play("fireBig", { vol: 0.5, rate: 1.3 }); break;
    }
    FX.p({ x: cx, y: P.y - 4, vx: 0, vy: -20, life: 0.6, size: 10, col: d.col, kind: "glow", add: true });
  }
  const R2 = (de, en) => { const l = Z.settings.lang === "en" ? en : de; return l[(Math.random() * l.length) | 0]; };

  /* ======================= SCHADEN AM SPIELER ======================= */
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player; if (!P || P.dead) return false;
    o = o || {};
    if (Z.godMode) return false;
    if ((P.iframe > 0 || P.ledge) && !o.force) {
      if (P.dodgeT > 0 && !P.dodged && !o.hazard) {
        P.dodged = true; P.counterT = 1.2; Z.stats.dodges = (Z.stats.dodges || 0) + 1;
        FX.stop(0.04); FX.slowmo(0.3, 0.16); FX.text(P.x + P.w / 2, P.y - 10, L(["Ausgewichen!", "Dodged!"]), "#ffe08a", true);
        FX.ring(P.x + P.w / 2, P.y + 12, 18, "#ffe08a", 0.25, 2); A.play("parry", { vol: 0.35, rate: 1.6 }); Z.input.rumble(0.25, 60);
      }
      return false;
    }
    const fromX = o.x != null ? o.x : P.x + P.w / 2 + P.face;
    const fromFront = (fromX > P.x + P.w / 2) === (P.face > 0);
    /* Schild */
    if (P.act && (P.act.type === "shield" || (P.act.bash && P.act.phase !== "post")) && (fromFront || P.act.d.shield.allround) && !o.unblockable) {
      const sh = P.act.d.shield;
      if (P.parryT > 0 && o.parryable !== false) {
        A.play("parry", { vol: 0.8 }); FX.stop(0.1); FX.flashScreen("#fff3c0", 0.25); FX.ring(P.x + P.w / 2 + P.face * 8, P.y + 12, 26, "#ffe08a", 0.3, 3);
        FX.burst(P.x + P.w / 2 + P.face * 8, P.y + 12, 14, { col: ["#fff", "#ffd27a"], sp: 160, life: 0.3, size: 2, kind: "spark", add: true });
        FX.text(P.x + P.w / 2, P.y - 8, L(["Parade!", "Parry!"]), "#ffe08a", true);
        if (o.attacker && !o.attacker.dead) { addStatus(o.attacker, "stun", sh.parryStun * (Z.has("langerSchatten") ? 1.5 : 1)); Z.hitEnemy(o.attacker, dmgOf(P, P.act.it, sh.bash * 1.5), { kb: 160, src: "parry", crit: true }); }
        if (o.proj) { o.proj.owner = "p"; o.proj.vx *= -1.3; o.proj.vy *= -0.5; o.proj.dmg = dmgOf(P, P.act.it, 12) * (sh.reflectMul || 1.5); o.proj.hits = new Set(); o.proj.reflected = true; }
        if (P.act.it && Z.metaLvl(P.act.it.id) >= 3) { if (P.act.it.id === "turmschild") Z.healPlayer(P.hpMax * 0.04); if (P.act.it.id === "goldschild") P.iframe = 2; }
        if (Z.has("bollwerk")) Z.healPlayer(P.hpMax * 0.03);
        Z.stats.parries = (Z.stats.parries || 0) + 1; P.act.parried = true;
        if (Z.shieldHook) Z.shieldHook("parry", P, o);
        return false;
      }
      const through = dmg * (1 - sh.block);
      A.play("block", { vol: 0.7 }); FX.burst(P.x + P.w / 2 + P.face * 8, P.y + 12, 8, { col: "#ffe0a0", sp: 110, life: 0.25, size: 1.6, kind: "spark", add: true });
      P.vx = -P.face * 120; FX.addShake(2); FX.stop(0.04);
      if (sh.thorns && o.attacker && !o.attacker.dead) Z.hitEnemy(o.attacker, dmg * sh.thorns, { kb: 60, src: "thorns", eff: Z.metaLvl("dornenschild") >= 3 ? { bleed: 1 } : null });
      if (Z.has("bollwerk")) Z.healPlayer(P.hpMax * 0.03);
      if (Z.shieldHook && Z.shieldHook("block", P, o, dmg) === "reflect") return false;
      if (o.proj) o.proj.dead = true;
      if (through < 1) return false;
      dmg = through;
    }
    /* Ausweichen während der Rolle (iframe) bereits oben. Schaden berechnen */
    let m = 1;
    if (Z.has("zerbrechlich")) m *= 1.5;
    if (Z.has("steinhaut")) m *= 0.75;
    if (["a1", "a2"].some(s => Z.hasAff(P.slots[s], "gepanzert"))) m *= 0.88;
    if (o.attacker && o.attacker.st.weak > 0) m *= 0.6;
    if (P.curse > 0 && !o.hazard) { dmg = P.hp + 999; FX.text(P.x + P.w / 2, P.y - 12, L(["Fluch!", "Curse!"]), "#c040ff", true); }
    dmg = Math.max(1, Math.round(dmg * m));
    P.hp -= dmg; P.dmgTaken += dmg;
    P.rally = Math.min(P.rally + dmg * 0.75, dmg * 1.2 + P.rally); P.rallyT = Z.has("rallye") ? 3 : 1.6;
    P.iframe = o.spike ? 0.8 : 0.75; P.hurtT = Z.has("unbeugsam") ? 0.05 : 0.2;
    if (P.act && P.act.type !== "shield") endAct(P);
    if (!Z.has("unbeugsam") && o.kb !== 0) { P.vx = (P.x + P.w / 2 < fromX ? -1 : 1) * (o.kb || 170); P.vy = Math.min(P.vy, -(o.kbUp || 150)); P.onGround = false; }
    P.plunge = false; P.climbing = false; P.drinkT = 0;
    FX.text(P.x + P.w / 2, P.y - 6, "-" + dmg, "#ff6b5e", dmg > P.hpMax * 0.15);
    FX.addShake(Math.min(9, 3 + dmg / P.hpMax * 30)); FX.stop(0.07); FX.flashScreen("#ff2020", 0.22);
    FX.burst(P.x + P.w / 2, P.y + 12, 12, { col: ["#ff4a3a", "#8a1414", "#ffb070"], sp: 120, life: 0.4, size: 2, kind: "spark", add: true });
    A.play("hurt", { vol: 0.7 }); Z.input.rumble(0.6, 120);
    if (Z.has("dornen") && o.attacker && !o.attacker.dead && o.melee) Z.hitEnemy(o.attacker, dmg * 0.6, { kb: 40, src: "thorns" });
    if (o.eff) for (const k in o.eff) addStatus(P, k, o.eff[k], true);
    if (P.hp <= P.hpMax * 0.3 && Z.has("rexTreue") && !P.rexUsed) { P.rexUsed = true; Z.spawnAlly("rex", P.x, P.y + P.h - 14, { dmg: 10, life: 10 }); A.play("bark"); }
    if (P.hp <= 0) {
      if (Z.has("nochnicht") && !P.revived) {
        P.revived = true; P.hp = Math.round(P.hpMax * 0.5); P.iframe = 2.5; P.curse = 0;
        FX.flashScreen("#ff8a3a", 0.6); FX.text(P.x + P.w / 2, P.y - 16, L(["„Noch nicht.“", '"Not yet."']), "#ffb070", true); A.play("roar", { vol: 0.5 });
        for (const e of Z.enemies) if (!e.dead && U.dist(P.x, P.y, e.x, e.y) < 120) { addStatus(e, "stun", 1.5); e.vx = U.sign(e.x - P.x) * 250; }
      } else { P.hp = 0; Z.onPlayerDeath && Z.onPlayerDeath(o); }
    }
    return true;
  };

  /* ======================= STATUSEFFEKTE ======================= */
  /* burn, poison (Stapel), bleed (Stapel), stun, root, slow, mark, weak, fear, web, regen, smoke, dance */
  function addStatus(t, k, v, isPlayer) {
    const st = t.st;
    if (!isPlayer && t.def && t.def.boss && (k === "stun" || k === "root")) v *= 0.35; /* Bosse lassen sich kaum festhalten */
    if (!isPlayer && (k === "stun" || k === "root") && Z.has("langerSchatten")) v *= 1.5;
    if (!isPlayer && t.def && t.def.immune && t.def.immune.includes(k)) return;
    switch (k) {
      case "burn": st.burn = Math.max(st.burn || 0, 3); st.burnLvl = Math.max(st.burnLvl || 0, v); break;
      case "poison": st.poison = 5; st.poisonN = Math.min(12, (st.poisonN || 0) + v); break;
      case "bleed": st.bleed = 4; st.bleedN = Math.min(10, (st.bleedN || 0) + v); break;
      case "stun": st.stun = Math.max(st.stun || 0, v); if (!isPlayer && t.act) Z.cancelEnemyAct && Z.cancelEnemyAct(t); if (!isPlayer && Z.has("erschuetterung") && !t._shock) { t._shock = true; for (const e of Z.enemies) if (e !== t && !e.dead && U.dist(e.x, e.y, t.x, t.y) < 60) addStatus(e, "stun", 0.5); t._shock = false; } break;
      case "mark": st.mark = Math.max(st.mark || 0, v); break;
      default: st[k] = Math.max(st[k] || 0, v);
    }
  }
  Z.addStatus = addStatus;
  function statusTick(t, dt, isPlayer) {
    const st = t.st; if (!st) return;
    const mult = !isPlayer && Z.has("giftmeister") ? 2 : 1;
    st.tick = (st.tick || 0) + dt;
    const doTick = st.tick >= 0.5; if (doTick) st.tick = 0;
    const base = isPlayer ? t.hpMax * 0.012 : (t.dotBase || 5);
    if (st.burn > 0) { st.burn -= dt; if (doTick) dot(t, base * 1.2 * (st.burnLvl || 1) * mult, "#ff8a3a", isPlayer); if (Math.random() < dt * 20) FX.p({ x: t.x + Math.random() * t.w, y: t.y + Math.random() * t.h, vx: 0, vy: -40, life: 0.5, size: 3, col: Math.random() < 0.5 ? "#ff8a3a" : "#ffd27a", kind: "glow", add: true }); }
    if (st.poison > 0) { st.poison -= dt; const fast = !isPlayer && Z.player && ["a1", "a2"].some(s => Z.player.slots[s] && Z.player.slots[s].id === "drachenzahn") && Z.metaLvl("drachenzahn") >= 3; if (doTick || (fast && st.tick === 0.25)) dot(t, base * 0.35 * st.poisonN * mult, "#9ad04a", isPlayer); if (st.poison <= 0) st.poisonN = 0; if (Math.random() < dt * 8) FX.p({ x: t.x + Math.random() * t.w, y: t.y + Math.random() * t.h * 0.5, vx: 0, vy: -20, life: 0.6, size: 2, col: "#9ad04a", kind: "bubble" }); }
    if (st.bleed > 0) { st.bleed -= dt; if (doTick) dot(t, base * 0.3 * st.bleedN * mult * (Math.abs(t.vx) > 20 ? 1.6 : 1), "#e04040", isPlayer); if (st.bleed <= 0) st.bleedN = 0; if (Math.random() < dt * 10) FX.p({ x: t.x + Math.random() * t.w, y: t.y + t.h * 0.4, vx: 0, vy: 10, g: 300, life: 0.4, size: 1.5, col: "#a01818", kind: "drop" }); }
    if (st.regen > 0) { st.regen -= dt; if (doTick) Z.healPlayer(st.regenAmt * 0.5); }
    for (const k of ["stun", "root", "slow", "mark", "weak", "fear", "web", "smoke", "dance", "silence"]) if (st[k] > 0) st[k] -= dt;
  }
  Z.statusTick = statusTick;
  function dot(t, n, col, isPlayer) {
    n = Math.max(1, Math.round(n));
    if (isPlayer) { if (t.hp > 1) { t.hp = Math.max(1, t.hp - n); FX.text(t.x + t.w / 2, t.y - 4, "-" + n, col); } }
    else Z.hitEnemy(t, n, { dot: true, col, src: "dot" });
  }

  /* ======================= SCHADEN AN GEGNERN ======================= */
  Z.hitEnemy = function (e, dmg, o) {
    if (!e || e.dead) return 0;
    o = o || {};
    const P = Z.player;
    if (e.invuln > 0 && !o.dot) { FX.text(e.x + e.w / 2, e.y - 4, "—", "#a99a8b"); return 0; }
    /* Schild von vorn */
    if (e.def.front && !o.dot && o.src !== "parry" && e.st.stun <= 0 && !e.broken && P) {
      const fromFront = (P.x + P.w / 2 > e.x + e.w / 2) === (e.face > 0);
      if (fromFront && (!e.act || e.act.phase === "pre") && !o.crit) {
        A.play("block", { vol: 0.6, x: e.x }); FX.burst(e.x + e.w / 2 + e.face * 8, e.y + e.h * 0.4, 6, { col: "#ffe0a0", sp: 100, life: 0.2, size: 1.5, kind: "spark", add: true });
        e.guard = (e.guard || 0) + dmg; if (e.guard > e.hpMax * 0.45) { e.broken = 2.5; addStatus(e, "stun", 1); FX.text(e.x + e.w / 2, e.y - 8, L(["Gebrochen!", "Broken!"]), "#ffd27a"); }
        e.vx = -e.face * 60; return 0;
      }
    }
    let m = 1;
    if (e.st.mark > 0) m *= 1.25;
    if (e.st.weak > 0) m *= 1.3;
    if ((e.st.stun > 0 || e.st.root > 0) && Z.has("fesselnd")) m *= 1.6;
    if ((e.st.stun > 0 || e.st.root > 0) && Z.hasAff(o.it, "fesselnd")) m *= 1.4;
    if ((e.elite || e.def.boss) && Z.hasAff(o.it, "jagend")) m *= 1.4;
    if (P && Z.has("ersterSchlag") && !o.dot && !P.firstHit.has(e)) { P.firstHit.add(e); m *= 2; }
    if (e.def.armor && !o.dot) m *= 1 - e.def.armor;
    if (e.armorUp > 0 && !o.dot) m *= 0.3;
    dmg = Math.max(1, Math.round(dmg * m));
    e.hp -= dmg; e.flash = 0.09; if (P) P.dmgDone += dmg;
    /* Gegenwehr: Leben zurückholen */
    if (P && P.rally > 0 && !o.dot) { const back = Math.min(P.rally, dmg * 0.45); P.rally -= back; P.hp = Math.min(P.hpMax, P.hp + back); }
    if (P && Z.has("vampir") && !o.dot) Z.healPlayer(dmg * 0.02);
    if (P && Z.hasAff(o.it, "vampirisch") && !o.dot) Z.healPlayer(dmg * 0.03);
    if (P && P.wrath > 0 && !o.dot) Z.healPlayer(dmg * 0.04);
    if (P && o.src === "skill" && ["a1", "a2"].some(s => P.slots[s] && P.slots[s].id === "demonenklaue") && Z.metaLvl("demonenklaue") >= 3) Z.healPlayer(dmg * 0.03);
    if (Z.has("netzweber") && !o.dot && P) { P.hitCount++; if (P.hitCount % 5 === 0) addStatus(e, "root", 1.5); }
    if (o.eff) for (const k in o.eff) if (o.eff[k]) addStatus(e, k, o.eff[k]);
    /* Anzeige */
    if (Z.settings.showDmg) FX.text(e.x + e.w / 2, e.y - 2, dmg, o.dot ? o.col : o.crit ? "#ffb040" : "#fff4e0", o.crit);
    if (!o.dot) {
      const heavy = o.heavy || o.crit;
      FX.stop(heavy ? 0.085 : 0.05); FX.addShake(heavy ? 4 : 1.6);
      const col = e.def.blood || "#ffcf9a";
      const ang = (o.dir || (P && e.x > P.x ? 1 : -1)) > 0 ? 0 : Math.PI;
      FX.burst(e.x + e.w / 2, e.y + e.h * 0.45, heavy ? 14 : 8, { col: [col, "#fff0d0"], sp: heavy ? 190 : 130, ang, spread: 1.6, life: 0.3, size: 1.8, kind: "spark", add: true });
      if (o.crit) { FX.ring(e.x + e.w / 2, e.y + e.h * 0.45, 22, "#ffb040", 0.25, 2); A.play("crit", { vol: 0.6, x: e.x }); }
      A.play(o.sfx || (e.def.undead ? "hitBone" : e.def.metal ? "hitMetal" : "hitFlesh"), { vol: 0.6, x: e.x, y: e.y });
      Z.input.rumble(heavy ? 0.4 : 0.15, 50);
      /* Rückstoß und Taumeln */
      const kbRes = e.def.boss ? 0.1 : e.def.heavy ? 0.35 : 1;
      const dir = o.dir || (P ? (e.x + e.w / 2 > P.x + P.w / 2 ? 1 : -1) : 1);
      if (o.kb) { e.vx = dir * o.kb * kbRes; if (!e.def.fly) e.vy = Math.min(e.vy, -(o.kbUp || 30) * kbRes); else e.vy -= (o.kbUp || 20) * kbRes; e.kbT = 0.18; }
      if (o.wallSlam) e.wallSlam = 0.35;
      e.poise = (e.poise || 0) + dmg;
      if (!e.def.boss && (o.heavy || e.poise > e.hpMax * (e.def.poise || 0.12)) && !(e.act && e.act.armor)) { e.poise = 0; Z.staggerEnemy && Z.staggerEnemy(e, o.heavy ? 0.35 : 0.22); }
      e.aware = true; e.lostT = 0;
    }
    if (e.hp <= 0) Z.killEnemy && Z.killEnemy(e, o);
    else if (e.onHurt) e.onHurt(dmg, o);
    return dmg;
  };

  /* Kettenblitz: springt von Ziel zu Ziel */
  Z.chainLightning = function (P, x, y, dmg, jumps, eff, it, fromSky) {
    const hit = new Set(); let cx = x, cy = y;
    A.play("zap", { vol: 0.7 }); if (fromSky) A.play("thunder", { vol: 0.35 });
    for (let i = 0; i < jumps; i++) {
      let best = null, bd = i === 0 ? 220 : 110;
      for (const e of Z.enemies) { if (e.dead || hit.has(e)) continue; const d = U.dist(cx, cy, e.x + e.w / 2, e.y + e.h / 2); if (d < bd) { bd = d; best = e; } }
      if (!best) break;
      hit.add(best);
      const tx = best.x + best.w / 2, ty = best.y + best.h / 2;
      Z.bolts.push({ x0: fromSky && i === 0 ? tx : cx, y0: fromSky && i === 0 ? Z.cam.y : cy, x1: tx, y1: ty, t: 0, life: 0.22, col: "#fff2a0" });
      Z.hitEnemy(best, dmg * (1 - i * 0.12), { eff, src: "ranged", it, kb: 20 });
      cx = tx; cy = ty;
    }
    if (!hit.size) Z.bolts.push({ x0: x, y0: y, x1: x + (P ? P.face : 1) * 90, y1: y + (Math.random() - 0.5) * 30, t: 0, life: 0.15, col: "#fff2a0" });
  };
  Z.bolts = [];
})();
