/* Ezekiel – The Destroyer · Runen
   A) BEWEGUNGS-RUNEN (Z.MOVE_RUNES, daten.js): Krallenrune (Wandrutschen/Wandsprung), Schattenrune (Schattensprint,
      flach durch Schattenspalten), Darkin-Schwingen (dritter Sprung, Gleiten, Aufwinde), Erdrune (Bodenstampfer bricht
      rissige Böden), Kettenrune (Enterhaken an Ösen), Nebelrune (in der Rolle durch Nebelgitter).
      Im Lauf gefunden (Runensockel) gilt die Rune für den Lauf; an der Runenstele im Lager mit Seelensplittern dauerhaft.
      Die Karten (welt.js runeGates) sperren Nebenkammern mit diesen Fähigkeiten – Hauptweg und Ausgänge nie.
   B) SPIELWEISE-RUNEN (Z.RUNES mit mech, Familien Z.RUNE_FAM): wirken, solange die gravierte Waffe in der Hand liegt
      oder der Runenstein im Runengürtel steckt (max. Z.RUNE_NUM.guertel). Familienbonus bei 2 bzw. 3 verschiedenen
      Runen derselben Familie (sichtbar im Pausenmenü).
   Physik ohne Runen bleibt unverändert: alle Eingriffe in kampf.js laufen über Felder, die nur hier gesetzt werden
   (P.capV, P.gMul, P.rollMul, P.shadowForm) und Hooks (Z.preJump, Z.extraJump). Farben warm – kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v), inp = Z.input;
  const C = Z.PC, RN = Z.RUNE_NUM, MR = Z.MOVE_RUNES, FAM = Z.RUNE_FAM, CW = Z.CW, CH = Z.CH;
  const TAU = Math.PI * 2;
  const esc = U.esc, clamp = U.clamp;
  const alive = e => e && !e.dead && !e.dummy;
  const ecx = e => e.x + e.w / 2, ecy = e => e.y + e.h / 2;
  const notify = (html, o) => { if (Z.ui && Z.ui.notify) { try { return Z.ui.notify(html, o || {}); } catch (_) {} } if (Z.toast) Z.toast(html, (o && o.dauer) || 2600); return null; };
  const keyHint = a => (Z.ui && Z.ui.key ? Z.ui.key(a) : "");

  /* ======================= SPEICHER ======================= */
  /* Z.meta.runen = { frei: {k:1} dauerhaft, gesehen: {k:1}, tut: {k:1} } · Z.run.moveRunes = {k:1} (dieser Lauf) */
  const MM = () => { const m = Z.meta; if (!m.runen || typeof m.runen !== "object") m.runen = {}; const r = m.runen; r.frei = r.frei || {}; r.gesehen = r.gesehen || {}; r.tut = r.tut || {}; return r; };
  const runMR = () => (Z.run ? (Z.run.moveRunes = Z.run.moveRunes || {}) : null);
  Z.hasMoveRune = k => { const m = MM(); if (m.frei[k]) return true; const r = runMR(); return !!(r && r[k]); };
  /* Testschalter: Z.runeAll = true → alle Bewegungs-Runen */
  const has = k => (Z.runeAll ? true : Z.hasMoveRune(k));

  /* ======================= AKTIVE SPIELWEISE-RUNEN (gecacht) ======================= */
  const ACT = { keys: new Set(), fam: {}, sig: "", any: false };
  function recalcActive() {
    const P = Z.player; let sig = "";
    if (P) { for (const s of ["a1", "a2"]) { const it = P.slots[s]; sig += (it ? it.uid + ":" + (it.runes || []).join(",") : "-") + "|"; } sig += (P.runeBelt || []).join(","); }
    if (sig === ACT.sig) return; ACT.sig = sig;
    ACT.keys = new Set(); ACT.fam = {};
    if (!P) { ACT.any = false; return; }
    for (const s of ["a1", "a2"]) { const it = P.slots[s]; if (it && it.runes) for (const k of it.runes) if (Z.RUNES[k]) ACT.keys.add(k); }
    for (const k of P.runeBelt || []) if (Z.RUNES[k]) ACT.keys.add(k);
    for (const k of ACT.keys) { const f = Z.RUNES[k].fam; if (f) ACT.fam[f] = (ACT.fam[f] || 0) + 1; }
    ACT.any = ACT.keys.size > 0;
  }
  const on = k => ACT.keys.has(k);
  const fam = (f, n) => (ACT.fam[f] || 0) >= n;
  Z.runeActive = () => (recalcActive(), { keys: [...ACT.keys], fam: Object.assign({}, ACT.fam) });
  const hand = () => { const P = Z.player; return P && (P.slots.a1 || P.slots.a2) || null; };
  const wdmg = (base, it) => { const P = Z.player; return Z.dmgOf ? Z.dmgOf(P, it || hand(), base) : base; };

  /* ======================= KARTE: Sperren zur Laufzeit ======================= */
  /* Nebelgitter: in den Kacheln offen (0), für Körper aber fest (W.tile meldet 12), außer Ezekiel ist Nebel.
     Rissige Böden: bleiben Fels (1), bis der Bodenstampfer sie bricht. */
  let G = null; /* { lv, grate: Uint8Array, crack: Map idx→{gate,v}, gates, rings, ups, scratch:[], hinted:Set } */
  let mistPass = false;
  const tile0 = W.tile;
  W.tile = (tx, ty) => {
    const v = tile0(tx, ty);
    if (v === 0 && G && !mistPass && G.lv === W.lv && G.nGrate && tx >= 0 && ty >= 0 && tx < G.lv.W && ty < G.lv.H && G.grate[ty * G.lv.W + tx]) return 12;
    return v;
  };
  const gen0 = Z.genLevel;
  Z.genLevel = function () {
    const lv = gen0.apply(this, arguments);
    try { prepLevel(lv); } catch (e) { console.error(e); }
    return lv;
  };
  function prepLevel(lv) {
    if (!lv || !lv.runeGates || lv._rnPrep) return;
    lv._rnPrep = true;
    for (const g of lv.runeGates) if (g.kind === "nebel") for (const [x, y, v] of g.tiles) lv.set(x, y, v);
  }
  function setupLevel(lv) {
    G = null;
    if (!lv || !lv.runeGates || !lv.runeGates.length) { if (lv && (lv.rings || lv.updrafts)) G = { lv, grate: null, nGrate: 0, crack: new Map(), gates: [], rings: lv.rings || [], ups: lv.updrafts || [], scratch: [], hinted: new Set(), slits: [] }; return; }
    prepLevel(lv);
    const g = (G = { lv, grate: new Uint8Array(lv.W * lv.H), nGrate: 0, crack: new Map(), gates: lv.runeGates, rings: lv.rings || [], ups: lv.updrafts || [], scratch: [], hinted: new Set(), slits: [] });
    for (const gt of lv.runeGates) {
      const [cx, cy] = gt.cell.split(",").map(Number), ox = cx * CW, oy = cy * CH;
      gt.ox = ox; gt.oy = oy;
      if (gt.kind === "nebel") for (const [x, y] of gt.tiles) { g.grate[y * lv.W + x] = 1; g.nGrate++; }
      if (gt.kind === "erde") for (const [x, y, v] of gt.tiles) g.crack.set(y * lv.W + x, { gt, v, x, y });
      if (gt.kind === "schatten" && gt.slit) g.slits.push(gt.slit);
      if (gt.kind === "kralle") {
        const lb = gt.lb || oy + CH + 4;
        for (let y = oy + 4; y <= lb - 2; y += 3) { g.scratch.push({ x: (ox + 10) * T, y: y * T + 4, d: 1, s: (y * 7 + ox) % 5 }); g.scratch.push({ x: (ox + 14) * T, y: (y + 1.5) * T + 4, d: -1, s: (y * 3 + ox) % 5 }); }
      }
      /* Hinweisort: wo die Sperre beginnt */
      gt.hx = gt.side === "D" ? (ox + 11.5) * T : gt.side === "U" ? (ox + 11.5) * T : gt.side === "L" ? ox * T : (ox + CW) * T;
      gt.hy = gt.side === "D" ? ((gt.lb || oy + CH) + 1) * T : gt.side === "U" ? (oy - 1) * T : (oy + 11) * T;
    }
  }
  const la0 = Z.loadArea;
  Z.loadArea = function () {
    const r = la0.apply(this, arguments);
    try { setupLevel(Z.level); resetLevelFx(); const P = Z.player; if (P) { P.ringHang = null; P.ringPull = null; P.capV = null; P.gMul = null; P.shadowForm = false; P._mist = false; if (P.h !== C.H && !P.crouch) { P.y -= C.H - P.h; P.h = C.H; } } } catch (e) { console.error(e); }
    return r;
  };
  const mb0 = Z.moveBody;
  Z.moveBody = function (b, dt) {
    if (b && b._mist && b === Z.player) { mistPass = true; try { return mb0.call(this, b, dt); } finally { mistPass = false; } }
    return mb0.call(this, b, dt);
  };
  const overGrate = P => {
    if (!G || !G.nGrate) return false;
    const lv = G.lv;
    for (let ty = Math.floor(P.y / T); ty <= Math.floor((P.y + P.h - 0.1) / T); ty++) for (let tx = Math.floor(P.x / T); tx <= Math.floor((P.x + P.w - 0.1) / T); tx++) if (tx >= 0 && ty >= 0 && tx < lv.W && ty < lv.H && G.grate[ty * lv.W + tx]) return true;
    return false;
  };
  const solidAt = (tx, ty) => W.solidT(W.tile(tx, ty));
  const bodyFree = (x, y, w, h) => { for (let ty = Math.floor(y / T); ty <= Math.floor((y + h - 0.01) / T); ty++) for (let tx = Math.floor((x + 0.01) / T); tx <= Math.floor((x + w - 0.01) / T); tx++) if (solidAt(tx, ty)) return false; return true; };

  /* ======================= BEWEGUNG ======================= */
  const WALL = { SLIDE: 92, KICK: 238, KICKV: 392, CLIMBX: 120, CLIMBV: 404, LOCK: 0.15, COYOTE: 0.1 };
  const GLIDE = { CAP: 78, SPD: 1.12, UPV: -250 };
  const RING = { R: 7 * T, PULL: 560 };
  const SH = { MUL: 1.45, H: 12 };
  /* Wand neben dem Körper (−1 links, 1 rechts, 0 keine) */
  function wallSide(P) {
    const yA = Math.floor((P.y + 3) / T), yB = Math.floor((P.y + P.h - 3) / T);
    const lx = Math.floor((P.x - 1.5) / T), rx = Math.floor((P.x + P.w + 1.5) / T);
    let l = false, r = false;
    for (let ty = yA; ty <= yB; ty++) { if (solidAt(lx, ty)) l = true; if (solidAt(rx, ty)) r = true; }
    return l && !r ? -1 : r && !l ? 1 : l && r ? 2 : 0;
  }
  function nearestRing(P) {
    if (!G || !G.rings.length) return null;
    const px = P.x + P.w / 2, py = P.y + P.h * 0.4; let best = null, bd = RING.R;
    for (const r of G.rings) {
      const rx = r.x * T + 8, ry = r.y * T + 8, d = Math.hypot(rx - px, ry - py);
      if (d < bd && W.los(px, py, rx, ry + 2)) { bd = d; best = r; }
    }
    return best;
  }
  /* Wandsprung vor dem Doppelsprung (kampf.js ruft Z.preJump) */
  Z.preJump = function (P, h) {
    if (!has("kralle") || P.onGround || P.climbing || P.ringHang) return false;
    let side = wallSide(P); if (side === 2) side = h || P.face;
    if (!side && P.wallCoy > 0) side = P.wallDir;
    if (!side) return false;
    const toward = h === side;
    Z.PJ.doJump(P, toward ? WALL.CLIMBV : WALL.KICKV);
    P.vx = -side * (toward ? WALL.CLIMBX : WALL.KICK); P.face = -side;
    P.wallKick = toward ? 0.1 : WALL.LOCK; P.kickVx = P.vx; P.wallCoy = 0; P.wallT = 0;
    P.airJumps = 1; P.j3 = false; P.sprintAir = false;
    const fx = side > 0 ? P.x + P.w : P.x;
    FX.burst(fx, P.y + P.h * 0.5, 9, { col: ["#ffb347", "#ffe0a0", Z.dustCol || "#8a7a70"], sp: 90, ang: side > 0 ? Math.PI : 0, spread: 1.4, life: 0.35, size: 2, kind: "spark", add: true });
    for (let i = 0; i < 3; i++) FX.p({ x: fx, y: P.y + 6 + i * 6, vx: -side * 20, vy: 10, life: 0.5, size: 1.5, col: "#ffb347", kind: "glow", add: true });
    A.play("claw", { vol: 0.45, rate: 1.15 }); A.play("jump", { vol: 0.35, rate: 1.1 });
    return true;
  };
  /* Dritter Sprung (Darkin-Schwingen) oder Enterhaken an Ösen (kampf.js ruft Z.extraJump, wenn kein Luftsprung mehr übrig ist) */
  Z.extraJump = function (P, h) {
    if (P.onGround || P.climbing) return false;
    if (has("kette")) { const r = nearestRing(P); if (r && (!has("schwingen") || P.j3 || ringPreferred(P, r))) return startPull(P, r); }
    if (has("schwingen") && !P.j3) {
      P.j3 = true; Z.PJ.doJump(P, C.DJUMP * 0.94);
      wingBurst(P, 1); A.play("jump", { vol: 0.5, rate: 0.8 }); A.play("whip", { vol: 0.25, rate: 0.6 });
      return true;
    }
    return false;
  };
  const ringPreferred = (P, r) => r.y * T + 8 < P.y; /* Öse über dem Kopf: Haken vor dem dritten Sprung */
  function startPull(P, r) {
    P.ringPull = { r, t: 0 }; P.jumpBuf = 0; P.plunge = false; P.rollT = 0; P.act = null;
    A.play("chain", { vol: 0.6, rate: 1.2 }); A.play("throwK", { vol: 0.4 });
    return true;
  }
  function wingBurst(P, k) {
    const x = P.x + P.w / 2, y = P.y + 10;
    for (const d of [-1, 1]) FX.burst(x + d * 6, y, 7 * k, { col: ["#ff5a4e", "#8a1a1a", "#ffb040"], sp: 80, ang: Math.PI / 2 + d * 0.9, spread: 0.9, life: 0.45, size: 2.2, kind: "spark", add: true });
    FX.ring(x, P.y + P.h, 14, "#ff5a4e", 0.3, 2);
  }

  /* --- vor dem eigentlichen Spieler-Update --- */
  const upd0 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    if (!P || P.dead || P !== Z.player) { if (P) { P.capV = null; P.gMul = null; } return upd0.call(this, P, dt); }
    recalcActive();
    /* Zug zur Öse: eigene Bewegung, das normale Update ruht kurz (wie der Enterhaken in werkzeuge.js) */
    if (P.ringPull) {
      const g = P.ringPull; g.t += dt;
      const tx = g.r.x * T + 8, ty = g.r.y * T + 8;
      const hx = tx - P.w / 2, hy = ty - 3; /* Hände an der Öse */
      const dx = hx - P.x, dy = hy - P.y, d = Math.hypot(dx, dy) || 1;
      P.iframe = Math.max(P.iframe, 0.05); P.climbing = false; P.ledge = null;
      const sp = Math.min(RING.PULL, d / dt);
      P.vx = dx / d * sp; P.vy = dy / d * sp; if (Math.abs(dx) > 2) P.face = U.sign(dx);
      Z.moveBody(P, dt);
      if (Math.random() < dt * 50) FX.p({ x: P.x + P.w / 2, y: P.y + 8, vx: -P.vx * 0.1, vy: -P.vy * 0.1, life: 0.25, size: 1.6, col: "#c8a070", kind: "spark" });
      if (d < 3 || g.t > 0.6 || (P.hitWall && g.t > 0.08) || P.hitCeil) {
        P.ringPull = null;
        if (d < 10) { P.ringHang = { r: g.r, t: 0 }; P.x = hx; P.y = hy; A.play("hitMetal", { vol: 0.4, rate: 1.4 }); FX.ring(tx, ty, 10, "#e5b454", 0.25, 2); }
        P.vx = 0; P.vy = 0; P.airJumps = 1; P.j3 = false; P.sprintAir = false;
      }
      P.time += dt; P.anim.t += dt; P.jumpBuf = 0;
      return;
    }
    const h = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0);
    /* Kettenrune: „Benutzen“ in der Luft zieht ebenfalls zur nächsten Öse (so steht es in der Beschreibung – fehlte bisher) */
    if (inp.pressed.use && has("kette") && !P.onGround && !P.climbing && !P.ringHang && !P.ledge) { const r = nearestRing(P); if (r) { startPull(P, r); P.time += dt; return; } }
    /* Hängen an der Öse: Sprung zählt wie vom Boden (Coyote), Runter lässt los */
    const hang = P.ringHang;
    if (hang) {
      hang.t += dt;
      P.coyote = C.COYOTE; P.airJumps = 1; P.vx = 0; P.vy = 0; P.gMul = 0; P.capV = 0;
      if (h) P.face = h;
      if (inp.pressed.down || inp.held.down && hang.t > 0.15 || P.buf.roll > 0 || P.hurtT > 0) { P.ringHang = null; P.coyote = 0; P.gMul = null; P.capV = null; if (inp.held.down) P.vy = 60; }
    }
    /* Wand */
    const kralle = has("kralle");
    P.wallKick = Math.max(0, (P.wallKick || 0) - dt); P.wallCoy = Math.max(0, (P.wallCoy || 0) - dt);
    if (P.wallKick > 0 && P.kickVx && !P.onGround) { if (!h || U.sign(h) === U.sign(P.kickVx) || P.wallKick > 0.06) P.vx = P.kickVx; }
    let sliding = false;
    if (kralle && !P.onGround && !P.climbing && !P.ledge && !hang && !P.plunge && P.rollT <= 0 && P.vy > -40 && !(P.act && P.act.type === "melee" && P.act.phase !== "post")) {
      const s = wallSide(P);
      if (s && s !== 2 && h === s) { sliding = true; P.wallDir = s; P.wallCoy = WALL.COYOTE; P.face = s; }
    }
    P.wallT = sliding ? (P.wallT || 0) + dt : 0;
    if (!hang) P.capV = sliding ? WALL.SLIDE : null;
    if (sliding) {
      if (P.vy > WALL.SLIDE) P.vy = U.approach(P.vy, WALL.SLIDE, 2400 * dt);
      P.airJumps = Math.max(P.airJumps, 0); P.j3 = false;
      if (Math.random() < dt * 22) FX.p({ x: P.wallDir > 0 ? P.x + P.w : P.x, y: P.y + 4 + Math.random() * 4, vx: -P.wallDir * 14, vy: -18, life: 0.35, size: 1.4, col: Math.random() < 0.5 ? "#ffb347" : Z.dustCol || "#8a7a70", kind: "spark", add: true });
      P._slideSnd = (P._slideSnd || 0) - dt; if (P._slideSnd <= 0) { P._slideSnd = 0.22; A.play("step", { vol: 0.12, rate: 1.6 }); }
    }
    /* Schwingen: Gleiten (Sprung gehalten beim Fallen) und Aufwind */
    let gk = null;
    P.gliding = false;
    if (has("schwingen") && !P.onGround && !P.climbing && !hang && !P.plunge && !sliding && P.rollT <= 0 && inp.held.jump && (P.jumpT || 0) > 0.12) {
      const up = inUpdraft(P);
      if (up) { P.vy = U.approach(P.vy, P.y + P.h < (up.y0 + 2) * T ? 0 : GLIDE.UPV, 1500 * dt); P.airJumps = 1; P.j3 = false; P.gliding = true; gk = 0.0001; P.capV = 200; if (Math.random() < dt * 30) FX.p({ x: P.x + Math.random() * P.w, y: P.y + P.h, vx: 0, vy: 80, life: 0.4, size: 1.6, col: "#ffb040", kind: "glow", add: true }); }
      else if (P.vy > 10) { P.gliding = true; P.capV = GLIDE.CAP; if (h) P.vx = U.approach(P.vx, h * C.RUN * GLIDE.SPD, 900 * dt); }
      if (P.gliding) { P._glideSnd = (P._glideSnd || 0) - dt; if (P._glideSnd <= 0) { P._glideSnd = 0.55; A.play("whip", { vol: 0.08, rate: 0.35 }); } }
    }
    /* Schwebeklinge: Lufttreffer halten in der Schwebe */
    if (P.rnHover > 0) { P.rnHover -= dt; if (!P.onGround && !P.plunge && !sliding) { gk = Math.min(gk == null ? 1 : gk, 0.1); if (P.vy > 20) P.vy = 20; } }
    /* Schattenrune: Schattensprint */
    const shadow = has("schatten");
    P.rollMul = shadow ? SH.MUL : null;
    /* W7: auch ein am Boden begonnener Sprint fällt nicht mehr, wenn er über eine Kante hinausträgt (vorher: aus dem
       Schattenspalt heraus direkt in einen Abgrund dahinter → zurückgesetzt vor den Spalt) */
    if (shadow && P.rollT > 0 && !P.onGround && (P.sprintAirNow || P.sprintGround)) { gk = 0; P.vy = Math.min(P.vy, 0); if (P.sprintGround) P.vy = 0; }
    if (!hang) P.gMul = gk;
    /* Erdrune: Runter + Angriff in der Luft stampft immer – auch mit Fernkampfwaffe in der Hand (sonst nur Sturzschüsse) */
    if (has("erde") && !P.onGround && !P.plunge && !P.climbing && inp.held.down && P.vy > -260 && !P.diveLock && !(P.act && P.act.phase !== "post") && P.rollT <= 0) {
      for (const s of ["a1", "a2"]) { if (!(P.buf[s] > 0)) continue; const d = Z.itemDef(P.slots[s]); if (d && d.kind === "ranged") { P.buf[s] = 0; P.plunge = true; P.plungeItem = null; P.vy = 640; P.vx = 0; P.diveLock = true; A.play("swingHeavy", { vol: 0.6, rate: 0.8 }); } break; }
    }
    /* Nebel: in der Rolle (und solange man noch im Gitter steckt) */
    P._mist = has("nebel") && (P.rollT > 0 || overGrate(P));
    if (P._mist && P.rollT <= 0 && overGrate(P)) { P.vx = (P.rollDir || P.face) * 150; }
    const pre = { plunge: P.plunge, rollT: P.rollT, jumpT: P.jumpT || 0, onGround: P.onGround, vy: P.vy, x: P.x, y: P.y };
    upd0.call(this, P, dt);
    post(P, dt, pre, h);
  };

  function inUpdraft(P) {
    if (!G || !G.ups.length) return null;
    const cx = (P.x + P.w / 2) / T, fy = (P.y + P.h) / T;
    for (const u of G.ups) if (cx >= u.x0 && cx <= u.x1 + 1 && fy >= u.y0 && fy <= u.y1 + 5.5) return u;
    return null;
  }

  /* --- nach dem Spieler-Update --- */
  function post(P, dt, pre, h) {
    /* Öse: Lage halten, Sprung/Ledge/Treffer beenden das Hängen */
    const hang = P.ringHang;
    if (hang) {
      if (P.vy < -100 || P.ledge || P.climbing || P.onGround || P.dead || P.grapple) { P.ringHang = null; P.gMul = null; P.capV = null; if (P.vy < -100) { A.play("chain", { vol: 0.3, rate: 1.6 }); P.j3 = false; } }
      else { P.x = hang.r.x * T + 8 - P.w / 2; P.y = hang.r.y * T + 8 - 3; P.vx = 0; P.vy = 0; }
    }
    if (P.onGround || P.climbing || P.ledge) { P.j3 = false; P.sprintAir = false; P.rnAirHits = 0; }
    /* Rolle begonnen? */
    if (P.rollT > 0 && pre.rollT <= 0) onRollStart(P, pre.onGround);
    if (P.rollT <= 0) { P.sprintAirNow = false; P.sprintGround = false; }
    /* Schattengestalt: flach während des Sprints, aufrichten sobald Platz ist */
    if (has("schatten") && P.rollT > 0 && !P.shadowForm && P.h > SH.H) { P.y += P.h - SH.H; P.h = SH.H; P.shadowForm = true; P.crouch = false; }
    if (P.shadowForm) {
      if (P.h === C.H && P.rollT <= 0) P.shadowForm = false;
      else if (P.rollT <= 0) {
        if (bodyFree(P.x, P.y + P.h - C.H, P.w, C.H)) { P.y += P.h - C.H; P.h = C.H; P.shadowForm = false; }
        else if (P.h !== C.HC && bodyFree(P.x, P.y + P.h - C.HC, P.w, C.HC)) { P.y += P.h - C.HC; P.h = C.HC; P.crouch = true; P.shadowForm = false; }
      }
      if (P.shadowForm && Math.random() < dt * 40) FX.p({ x: P.x + Math.random() * P.w, y: P.y + P.h - 2, vx: -P.vx * 0.2, vy: -10, life: 0.4, size: 2.4, col: Math.random() < 0.5 ? "#3a1a4a" : "#b77cff", kind: "smoke" });
    }
    /* Sprung gezählt (Donnersprung) */
    if ((P.jumpT || 0) < pre.jumpT && P.vy < -150) onJump(P);
    /* Bodenstampfer: im Sturz bricht ein rissiger Boden schon bei Berührung (auch an Leitern, wo die Landung sonst ausfällt) */
    if ((P.plunge || pre.plunge) && G && G.crack.size && has("erde")) { const c = crackUnder(P, 3); if (c) { breakFloor(c.gt); P.plunge = true; P.vy = Math.max(P.vy, 300); P.onGround = false; } }

    /* Nebel-Spur */
    if (P._mist && Math.random() < dt * 50) FX.p({ x: P.x + Math.random() * P.w, y: P.y + Math.random() * P.h, vx: -P.vx * 0.15, vy: -8, life: 0.5, size: 3, col: Math.random() < 0.6 ? "#e0d0d8" : "#a89098", kind: "smoke" });
    /* Gleiten: Funken an den Schwingen */
    if (P.gliding && Math.random() < dt * 14) FX.p({ x: P.x + P.w / 2 - P.face * 10, y: P.y + 8, vx: -P.vx * 0.2, vy: 10, life: 0.5, size: 1.4, col: "#ff6a4a", kind: "glow", add: true });
    tickWorld(P, dt);
  }

  function onRollStart(P, pre0Ground) {
    if (has("schatten")) {
      if (!P.onGround && !P.sprintAir) { P.sprintAir = true; P.sprintAirNow = true; P.vy = 0; }
      P.sprintGround = !!pre0Ground;
      FX.burst(P.x + P.w / 2, P.y + P.h - 6, 10, { col: ["#b77cff", "#3a1a4a", "#ff5a8a"], sp: 70, ang: P.rollDir > 0 ? Math.PI : 0, spread: 1, life: 0.4, size: 2.4, kind: "smoke" });
      A.play("shadow", { vol: 0.35, rate: 1.3 });
    }
    if (has("nebel")) { A.play("dark", { vol: 0.25, rate: 1.6 }); FX.burst(P.x + P.w / 2, P.y + P.h / 2, 12, { col: ["#e0d0d8", "#a89098"], sp: 40, life: 0.6, size: 3, kind: "smoke" }); }
    if (!ACT.any) return;
    const x = P.x + P.w / 2, fy = P.y + P.h;
    if (on("schattenklinge")) spawnBlade(x, P.y + P.h * 0.5, false);
    if (fam("schatten", 3)) spawnBlade(x, P.y + P.h * 0.4, true);
    if (fam("schatten", 2) && !(P.rnCritCd > 0)) { P.rnCritReady = 1.6; }
    if (on("giftschleier") && !(P.rnVeilCd > 0)) { P.rnVeilCd = RN.schleierCd; Z.spawnHazard({ kind: "poisoncloud", x, y: fy, w: 44, life: 2.6, dmg: wdmg(3), owner: "p", eff: { poison: 1 } }); FX.burst(x, fy - 10, 14, { col: ["#9ad04a", "#4a6a20"], sp: 40, life: 0.8, size: 3.4, kind: "smoke" }); }
    if (fam("feuer", 3)) P.rnEmberT = C.ROLL;
  }
  function onJump(P) {
    if (!on("donnersprung")) return;
    P.rnJumps = (P.rnJumps || 0) + 1;
    if (P.rnJumps % RN.donnerN) return;
    const x = P.x + P.w / 2, y = P.y + P.h;
    FX.ring(x, y, RN.donnerR, "#f0e060", 0.35, 3); FX.ring(x, y, RN.donnerR * 0.6, "#fff6c0", 0.25, 2);
    for (let i = 0; i < 4; i++) Z.bolts && Z.bolts.push({ x0: x, y0: y, x1: x + Math.cos(i * 1.6 + P.time) * RN.donnerR, y1: y + Math.sin(i * 1.6 + P.time) * RN.donnerR * 0.4, t: 0, life: 0.2, col: "#fff2a0" });
    A.play("thunder", { vol: 0.35, rate: 1.4 }); A.play("zap", { vol: 0.4 }); FX.addShake(2);
    for (const e of Z.enemies) if (alive(e) && U.dist(x, y, ecx(e), ecy(e)) < RN.donnerR + e.w / 2) Z.hitEnemy(e, wdmg(9), { src: "skill", eff: { stun: RN.donnerStun }, kb: 80, kbUp: 120, dir: U.sign(ecx(e) - x) || 1, col: "#f0e060" });
  }
  /* jede Sturz-Landung läuft über Z.diveLand (kampf.js plungeLand) – dort zuerst der Bodenstampfer */
  const dl0 = Z.diveLand;
  Z.diveLand = function (P) { try { if (P === Z.player) onPound(P); } catch (e) { console.error(e); } return dl0 ? dl0.apply(this, arguments) : false; };
  function crackUnder(P, d) {
    const lv = W.lv, fy = Math.floor((P.y + P.h + d) / T);
    for (let tx = Math.floor((P.x + 0.5) / T); tx <= Math.floor((P.x + P.w - 0.5) / T); tx++) { const c = G.crack.get(fy * lv.W + tx); if (c) return c; }
    return null;
  }
  function onPound(P) {
    const erde = has("erde"), lv = W.lv;
    const fy = Math.floor((P.y + P.h + 1) / T);
    let hit = null;
    if (G && G.crack.size) for (let tx = Math.floor(P.x / T) - 1; tx <= Math.floor((P.x + P.w) / T) + 1 && !hit; tx++) for (const ty of [fy, fy + 1]) { const c = G.crack.get(ty * lv.W + tx); if (c) { hit = c; break; } }
    if (hit && erde) { breakFloor(hit.gt); return; }
    if (hit && !erde) { const k = "erde_no"; if (!G.hinted.has(k) && !(Z.schilder && Z.schilder.hat("rune:" + hit.gt.cell))) { G.hinted.add(k); notify("⛰ <b>" + L(["Der Boden knirscht", "The floor creaks"]) + "</b><small>" + L(["Nur ein Bodenstampfer mit der Erdrune bricht ihn.", "Only a ground pound with the Earth Rune breaks it."]) + "</small>", { prio: 1, ort: "welt", x: P.x + P.w / 2, y: P.y - 8, dauer: 3200 }); } }
    if (erde) {
      /* Beben: weiterer Ring */
      const x = P.x + P.w / 2, y = P.y + P.h;
      FX.ring(x, y, 72, "#d8a060", 0.4, 3); FX.addShake(4);
      for (const e of Z.enemies) if (alive(e) && Math.abs(ecx(e) - x) < 72 && Math.abs(e.y + e.h - y) < 40 && Math.abs(ecx(e) - x) > 30) Z.hitEnemy(e, wdmg(8), { src: "melee", eff: { stun: 0.45 }, kb: 60, kbUp: 220, dir: U.sign(ecx(e) - x) || 1 });
    }
  }
  function breakFloor(gt) {
    const lv = W.lv; if (!G) return;
    let n = 0;
    for (const [x, y, v] of gt.tiles) {
      const idx = y * lv.W + x; if (!G.crack.has(idx)) continue;
      G.crack.delete(idx); lv.set(x, y, v); n++;
      FX.burst(x * T + 8, y * T + 8, 7, { col: [Z.tileCol || "#5a4a40", "#3a3030", "#d8a060"], sp: 140, life: 0.8, size: 3, kind: "shard", g: 700 });
      Z.dirtyTiles && Z.dirtyTiles(x, y);
    }
    if (!n) return;
    A.play("rock", { vol: 0.9 }); A.play("quake", { vol: 0.5 }); FX.addShake(8); FX.stop(0.06);
    const P = Z.player; if (P) { P.onGround = false; P.vy = 40; }
    if (Z.stats) Z.stats.secrets = (Z.stats.secrets || 0) + 1;
    notify("⛰ <b>" + L(["Durchgebrochen!", "Broke through!"]) + "</b>", { prio: 1, ort: "welt", x: gt.hx, y: gt.hy - 10, dauer: 1800 });
  }

  /* ======================= WELT-EFFEKTE DER SPIELWEISE-RUNEN ======================= */
  let blades = [], booms = [], puddles = [], tickT = 0, stormT = 0, chainDepth = 0;
  function resetLevelFx() { blades = []; booms = []; puddles = []; const P = Z.player; if (P) { P.rnCharge = P.rnCharge || 0; } }
  function spawnBlade(x, y, home) {
    if (blades.length > 8) blades.shift();
    blades.push({ x, y, t: 0, life: home ? 2.2 : RN.klingeT, home, hit: new Map(), rot: Math.random() * TAU, vx: 0, vy: 0 });
    A.play("slash", { vol: 0.25, rate: 1.5 });
  }
  function spawnBoom(P) {
    const it = P.act && P.act.it;
    booms.push({ x: P.x + P.w / 2, y: P.y + 12, dir: P.face, t: 0, out: true, dist: 0, hits: new Set(), dmg: wdmg(12, it) * RN.bumerangDmg, rot: 0 });
    A.play("throwK", { vol: 0.5 });
  }
  function tickWorld(P, dt) {
    /* Abklingzeiten */
    for (const k of ["rnVeilCd", "rnCritCd", "rnCritReady", "rnEmberT"]) if (P[k] > 0) P[k] -= dt;
    if (P.rnEmberT > 0 && Math.random() < dt * 40) Z.spawnHazard({ kind: "fire", x: P.x + P.w / 2, y: P.y + P.h - 2, w: 14, life: 2, dmg: wdmg(3), owner: "p" });
    /* Schattenklingen */
    for (let i = blades.length - 1; i >= 0; i--) {
      const b = blades[i]; b.t += dt; b.rot += dt * 18;
      if (b.t > b.life) { blades.splice(i, 1); continue; }
      if (b.home) {
        let tg = null, bd = 190; for (const e of Z.enemies) if (alive(e)) { const d = U.dist(b.x, b.y, ecx(e), ecy(e)); if (d < bd) { bd = d; tg = e; } }
        if (tg) { const d = bd || 1; b.vx = U.approach(b.vx, (ecx(tg) - b.x) / d * 260, 900 * dt); b.vy = U.approach(b.vy, (ecy(tg) - b.y) / d * 260, 900 * dt); }
        else { b.vx *= 0.95; b.vy *= 0.95; }
        b.x += b.vx * dt; b.y += b.vy * dt;
      }
      for (const e of Z.enemies) {
        if (!alive(e) || Math.abs(ecx(e) - b.x) > e.w / 2 + 12 || Math.abs(ecy(e) - b.y) > e.h / 2 + 12) continue;
        const last = b.hit.get(e) || -9; if (b.t - last < 0.3) continue; b.hit.set(e, b.t);
        Z.hitEnemy(e, wdmg(10) * RN.klingeDmg * (b.home ? 1.3 : 1), { src: "skill", kb: 30, dir: U.sign(ecx(e) - b.x) || 1, col: "#b77cff" });
      }
    }
    /* Schildbumerang */
    for (let i = booms.length - 1; i >= 0; i--) {
      const o = booms[i]; o.t += dt; o.rot += dt * 20;
      if (o.out) { o.x += o.dir * 420 * dt; o.dist += 420 * dt; if (o.dist > RN.bumerangW || W.solidAt(o.x, o.y)) { o.out = false; o.hits.clear(); } }
      else { const tx = P.x + P.w / 2, ty = P.y + 12, d = U.dist(o.x, o.y, tx, ty) || 1; o.x += (tx - o.x) / d * 480 * dt; o.y += (ty - o.y) / d * 480 * dt; if (d < 12 || o.t > 3) { booms.splice(i, 1); A.play("block", { vol: 0.3, rate: 1.4 }); continue; } }
      for (const e of Z.enemies) if (alive(e) && !o.hits.has(e) && U.overlap({ x: o.x - 8, y: o.y - 8, w: 16, h: 16 }, e)) { o.hits.add(e); Z.hitEnemy(e, o.dmg, { src: "skill", eff: { stun: 0.8 }, kb: 120, dir: o.out ? o.dir : -o.dir, col: "#d8a060" }); A.play("hitMetal", { vol: 0.4, x: o.x }); }
    }
    /* Pfützen */
    for (let i = puddles.length - 1; i >= 0; i--) { const p = puddles[i]; p.t += dt; if (p.t > RN.pfuetzeT) puddles.splice(i, 1); }
    if (!ACT.any) return;
    tickT -= dt;
    if (tickT <= 0) {
      tickT = 0.2;
      /* Giftblüte: auch Stapel aus Wolken und Pfützen zählen */
      if (on("giftbluete")) for (const e of Z.enemies) if (alive(e) && e.st && (e.st.poisonN || 0) >= RN.bluete) bloom(e);
      /* Funkenflug: Brennende stecken Nachbarn an */
      if (on("funkenflug")) {
        P.rnSparkT = (P.rnSparkT || 0) - 0.2;
        if (P.rnSparkT <= 0) {
          P.rnSparkT = RN.funkenT;
          for (const e of Z.enemies) {
            if (!alive(e) || !(e.st && e.st.burn > 0)) continue;
            let tg = null, bd = RN.funkenR; for (const o of Z.enemies) if (o !== e && alive(o) && !(o.st.burn > 0)) { const d = U.dist(ecx(e), ecy(e), ecx(o), ecy(o)); if (d < bd) { bd = d; tg = o; } }
            if (tg) { Z.addStatus(tg, "burn", 1); Z.bolts && Z.bolts.push({ x0: ecx(e), y0: ecy(e), x1: ecx(tg), y1: ecy(tg), t: 0, life: 0.18, col: "#ff9a3a" }); FX.burst(ecx(tg), ecy(tg), 6, { col: ["#ff9a3a", "#ffd27a"], sp: 60, life: 0.4, size: 2, kind: "spark", add: true }); }
          }
        }
      }
    }
    /* Gewitterherz */
    if (fam("sturm", 3)) {
      stormT -= dt;
      if (stormT <= 0) {
        stormT = 4;
        let tg = null, bd = 210; for (const e of Z.enemies) if (alive(e)) { const d = U.dist(P.x, P.y, ecx(e), ecy(e)); if (d < bd) { bd = d; tg = e; } }
        if (tg) Z.chainLightning(P, ecx(tg), ecy(tg) - 40, wdmg(14), 1, { stun: 0.3 }, null, true);
      }
    }
  }
  function bloom(e) {
    const x = ecx(e), y = ecy(e); e.st.poisonN = 0;
    FX.burst(x, y, 22, { col: ["#a8e050", "#5a8a20", "#e0f0a0"], sp: 120, life: 0.7, size: 3, kind: "glow", add: true }); FX.ring(x, y, 40, "#a8e050", 0.35, 3);
    A.play("poison", { vol: 0.6 }); A.play("slime", { vol: 0.4, rate: 0.8 });
    busy++; try {
      Z.hitEnemy(e, wdmg(12) * RN.blueteDmg, { src: "skill", col: "#a8e050" });
      for (const o of Z.enemies) if (o !== e && alive(o) && U.dist(x, y, ecx(o), ecy(o)) < 64) Z.addStatus(o, "poison", RN.blueteAnst);
    } finally { busy--; }
  }

  /* ======================= TREFFER, KILLS, PARADEN ======================= */
  let busy = 0;
  const hitR = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    const P = Z.player;
    if (!e || e.dead || !P || busy) return hitR.call(this, e, dmg, o);
    recalcActive();
    if (!ACT.any) { if (chainDepth && on("gewitter")) {} return hitR.call(this, e, dmg, o); }
    const it = o.it, fromHand = !!(it && (P.slots.a1 === it || P.slots.a2 === it));
    const air = !P.onGround && !P.climbing;
    /* vorher */
    if (fam("faden", 2) && e.st && e.st.hmark > 0 && !o.dot) dmg *= 1.15;
    if (fam("blut", 3) && P.hp < P.hpMax * 0.4 && !o.dot) dmg *= 1.3;
    if (o.dot && o.col === "#ff8a3a" && fam("feuer", 2)) dmg *= 1.5;
    if (o.dot && o.col === "#9ad04a" && fam("gift", 2)) dmg *= 1.5;
    if (o.src === "trap" && on("fallensteller")) dmg *= RN.falleMul;
    if (fromHand && o.kb && on("fallensteller")) o = Object.assign({}, o, { kb: o.kb * RN.falleKb });
    if (fromHand && o.src === "melee" && !o.crit && P.rnCritReady > 0 && fam("schatten", 2)) { P.rnCritReady = 0; P.rnCritCd = 3; dmg *= 1.6; o = Object.assign({}, o, { crit: true }); FX.text(ecx(e), e.y - 14, L(["Schattenstoß!", "Shadow strike!"]), "#b77cff", true); }
    if (fromHand && o.src === "melee" && air && on("schwebeklinge")) { P.rnAirHits = (P.rnAirHits || 0) + 1; if (P.rnAirHits % 3 === 0 && !o.crit) { dmg *= 1.6; o = Object.assign({}, o, { crit: true }); } }
    if (chainDepth && on("gewitter")) { const fx = ecx(e), fy = e.y + e.h; if (puddles.length < 8 && !puddles.some(p => Math.abs(p.x - fx) < 24 && Math.abs(p.y - fy) < 12)) { const gy = W.groundBelow(fx, e.y + e.h - 4, 60); if (gy != null) puddles.push({ x: fx, y: gy, t: 0 }); } }
    const r = hitR.call(this, e, dmg, o);
    if (!(r > 0)) return r;
    e._rnIt = it || e._rnIt;
    busy++;
    try {
      if (o.crit && on("funkenflug") && !e.dead) Z.addStatus(e, "burn", 1);
      if (!o.dot && fam("gift", 3) && !e.dead && (fromHand || o.src === "skill")) Z.addStatus(e, "poison", 1);
      if (fam("faden", 2) && e.st && e.st.hmark >= 3.9 && e.st.hmark <= 4.01) e.st.hmark = 8;
      if (fam("blut", 3) && Z.hasRune(it, "raub")) Z.healPlayer(r * 0.04);
      if (on("giftbluete") && !e.dead && (e.st.poisonN || 0) >= RN.bluete) bloom(e);
      if (o.crit && on("fadenriss") && o.src !== "riss") { const d = Z.itemDef(it); if (d && d.faden) splinter(e, r, it); }
      if (fromHand && air && on("schwebeklinge") && o.src === "melee") { P.rnHover = RN.schwebeT; if (P.vy > 0) P.vy = 0; }
      if (fromHand && o.src === "melee" && on("darkinladung") && (P.rnCharge || 0) >= RN.ladungN) nova(P, e, it);
    } finally { busy--; }
    return r;
  };
  function splinter(e, r, it) {
    const x = ecx(e), y = ecy(e);
    const list = Z.enemies.filter(o => o !== e && alive(o) && U.dist(x, y, ecx(o), ecy(o)) < 140).sort((a, b) => U.dist(x, y, ecx(a), ecy(a)) - U.dist(x, y, ecx(b), ecy(b))).slice(0, RN.rissN);
    for (const o of list) {
      Z.bolts && Z.bolts.push({ x0: x, y0: y, x1: ecx(o), y1: ecy(o), t: 0, life: 0.2, col: "#ffd27a" });
      Z.hitEnemy(o, r * RN.rissDmg, { src: "riss", it, kb: 30, col: "#ffd27a" });
      if (o.st && !o.dead) o.st.hmark = fam("faden", 2) ? 8 : 4;
    }
    if (list.length) A.play("whip", { vol: 0.3, rate: 1.6 });
  }
  function nova(P, e, it) {
    P.rnCharge = 0;
    const x = P.x + P.w / 2, y = P.y + P.h / 2;
    FX.ring(x, y, RN.ladungR, "#ff3a3a", 0.45, 4); FX.ring(x, y, RN.ladungR * 0.6, "#ffb040", 0.3, 2); FX.flashScreen && FX.flashScreen("#ff3a2a", 0.15);
    FX.burst(x, y, 26, { col: ["#ff3a3a", "#8a0a0a", "#ffb040"], sp: 180, life: 0.6, size: 2.6, kind: "spark", add: true });
    A.play("roar", { vol: 0.35, rate: 1.2 }); A.play("explode", { vol: 0.5 }); FX.addShake(6);
    for (const o of Z.enemies) if (alive(o) && U.dist(x, y, ecx(o), ecy(o)) < RN.ladungR + o.w / 2) Z.hitEnemy(o, wdmg(20, it) * RN.ladungDmg, { src: "skill", kb: 180, kbUp: 160, dir: U.sign(ecx(o) - x) || 1, col: "#ff3a3a" });
    Z.healPlayer(P.hpMax * RN.ladungHeil);
  }
  const killR = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && !e.dead, burning = e && e.st && e.st.burn > 0, marked = e && e.st && e.st.hmark > 0;
    const r = killR.apply(this, arguments);
    if (!was || !e.dead || e.dummy) return r;
    const P = Z.player; if (!P) return r;
    recalcActive(); if (!ACT.any) return r;
    const x = ecx(e), y = ecy(e);
    busy++;
    try {
      if (burning && on("glutherz")) {
        FX.ring(x, y, RN.glutR, "#ff6a2a", 0.35, 3); FX.burst(x, y, 20, { col: ["#ff6a2a", "#ffd27a", "#8a2a0a"], sp: 160, life: 0.6, size: 3, kind: "spark", add: true }); A.play("explode", { vol: 0.45, x });
        for (const o2 of Z.enemies) if (o2 !== e && alive(o2) && U.dist(x, y, ecx(o2), ecy(o2)) < RN.glutR + o2.w / 2) { busy--; try { Z.hitEnemy(o2, wdmg(16, e._rnIt) * RN.glutDmg, { src: "skill", kb: 90, kbUp: 120, dir: U.sign(ecx(o2) - x) || 1, col: "#ff6a2a" }); } finally { busy++; } if (!o2.dead) Z.addStatus(o2, "burn", 1); }
      }
      if (on("darkinladung")) { const was2 = P.rnCharge || 0; P.rnCharge = Math.min(RN.ladungN, was2 + 1); if (P.rnCharge >= RN.ladungN && was2 < RN.ladungN) { FX.text(P.x + P.w / 2, P.y - 22, L(["Darkin-Glut bereit!", "Darkin embers ready!"]), "#ff3a3a", true); A.play("magic", { vol: 0.4, rate: 0.7 }); } }
      if (fam("blut", 2)) Z.healPlayer(P.hpMax * 0.02);
      if (marked && fam("faden", 3)) { const list = Z.enemies.filter(o2 => o2 !== e && alive(o2)).sort((a, b) => U.dist(x, y, ecx(a), ecy(a)) - U.dist(x, y, ecx(b), ecy(b))).slice(0, 2); for (const o2 of list) if (U.dist(x, y, ecx(o2), ecy(o2)) < 260) { o2.st.hmark = fam("faden", 2) ? 8 : 4; Z.bolts && Z.bolts.push({ x0: x, y0: y, x1: ecx(o2), y1: ecy(o2), t: 0, life: 0.25, col: "#ffd27a" }); } }
    } finally { busy--; }
    return r;
  };
  /* Kettenblitz: Sturm-Familie (+1 Sprung, kurze Betäubung) und Gewitterpfützen */
  const chainR = Z.chainLightning;
  Z.chainLightning = function (P, x, y, dmg, jumps, eff, it, sky) {
    recalcActive();
    if (fam("sturm", 2)) { jumps += 1; eff = Object.assign({ stun: 0.25 }, eff || {}); }
    chainDepth++;
    let r;
    try { r = chainR.call(this, P, x, y, dmg, jumps, eff, it, sky); } finally { chainDepth--; }
    /* über Pfützen und Wasser weiter springen */
    if (on("gewitter") && !chainDepth && puddles.length) {
      const lv = W.lv;
      for (const p of puddles.slice()) {
        if (p.zap > 0.4 && p.t - p.zap < 0.4) continue; p.zap = p.t;
        let tg = null, bd = 110 * (1 + RN.pfuetzeWeit);
        for (const e of Z.enemies) if (alive(e)) { const d = U.dist(p.x, p.y - 6, ecx(e), ecy(e)); if (d < bd && d > 4) { bd = d; tg = e; } }
        if (tg && U.dist(x, y, p.x, p.y) < 220) { Z.bolts && Z.bolts.push({ x0: p.x, y0: p.y - 2, x1: ecx(tg), y1: ecy(tg), t: 0, life: 0.2, col: "#f0e060" }); busy++; try { Z.hitEnemy(tg, dmg * 0.5, { src: "ranged", it, kb: 10, eff: { stun: 0.2 }, col: "#f0e060" }); } finally { busy--; } }
      }
      void lv;
    }
    return r;
  };
  /* Paraden: Spiegelparade, Schildbumerang, Bollwerk 3 */
  const shR = Z.shieldHook;
  Z.shieldHook = function (ev, P, o, dmg) {
    const res = shR ? shR.apply(this, arguments) : undefined;
    if (ev !== "parry" || !P) return res;
    recalcActive(); if (!ACT.any) return res;
    const x = P.x + P.w / 2, y = P.y + 12;
    if (on("spiegelparade")) {
      let n = 0;
      for (const p of Z.projs) {
        if (p.owner === "p" || p.dead || U.dist(x, y, p.x, p.y) > RN.spiegelR) continue;
        let tg = null, bd = 400; for (const e of Z.enemies) if (alive(e)) { const d = U.dist(p.x, p.y, ecx(e), ecy(e)); if (d < bd) { bd = d; tg = e; } }
        const sp = Math.max(260, Math.hypot(p.vx || 0, p.vy || 0) * 1.2);
        if (tg) { const d = bd || 1; p.vx = (ecx(tg) - p.x) / d * sp; p.vy = (ecy(tg) - p.y) / d * sp; } else { p.vx = -(p.vx || 0) * 1.2; p.vy = -(p.vy || 0) * 0.4; }
        p.owner = "p"; p.dmg = wdmg(12, P.act && P.act.it) * 1.4; p.hits = new Set(); p.reflected = true; n++;
      }
      FX.ring(x, y, RN.spiegelR * 0.8, "#e8c890", 0.35, 3);
      for (const e of Z.enemies) if (alive(e) && U.dist(x, y, ecx(e), ecy(e)) < 56) Z.hitEnemy(e, wdmg(8, P.act && P.act.it), { src: "skill", kb: 220, kbUp: 100, dir: U.sign(ecx(e) - x) || 1, col: "#e8c890" });
      if (n) FX.text(x, P.y - 22, L(["Gespiegelt ×", "Reflected ×"]) + n, "#e8c890", true);
    }
    if (on("schildbumerang")) spawnBoom(P);
    if (fam("bollwerk", 3)) { P.iframe = Math.max(P.iframe, 1); for (const k of ["s1", "s2"]) P.cd[k] = Math.max(0, P.cd[k] - 2); }
    return res;
  };
  const blR = Z.blockLeak;
  Z.blockLeak = function () { const b = blR ? blR() : 0; recalcActive(); return b - (fam("bollwerk", 2) ? 0.1 : 0); };

  /* ======================= FUNDE: Runensteine, Runensockel ======================= */
  let finds = [];
  const la1 = Z.loadArea;
  Z.loadArea = function () { finds = []; return la1.apply(this, arguments); };
  function mechPool() {
    const P = Z.player, shield = P && ["a1", "a2"].some(s => { const d = Z.itemDef(P.slots[s]); return d && d.kind === "shield"; });
    recalcActive();
    return Object.keys(Z.RUNES).filter(k => Z.RUNES[k].mech && !ACT.keys.has(k) && (!Z.RUNES[k].needShield || shield));
  }
  /* bevorzugt Familien, die man schon trägt (×3) */
  function pickMech(R) {
    R = R || Z.R; const pool = mechPool(); if (!pool.length) return null;
    const w = {}; for (const k of pool) w[k] = (ACT.fam[Z.RUNES[k].fam] ? 3 : 1);
    return R.weighted(w);
  }
  Z.pickMechRune = pickMech;
  function pickMove(lv) {
    const lack = Object.keys(MR).filter(k => !has(k));
    if (!lack.length) return null;
    const want = lv && lv.runeGates ? lv.runeGates.map(g => g.kind).filter(k => lack.includes(k)) : [];
    return want.length ? Z.R.pick(want) : Z.R.pick(lack);
  }
  function spawnFind(kind, x, y, o) {
    if (Z.freeSpot) { const s = Z.freeSpot(x, y, 10, 16, { r: 20 }); x = s.x; y = s.y; } /* platz.js: nie in der Wand */
    const f = Object.assign({ kind, x, y, t: Math.random() * 9, got: false }, o || {});
    if (kind === "stein" && !f.rune) f.rune = pickMech();
    if (kind === "stein" && !f.rune) return Z.spawnReward && Z.spawnReward("glut", x, y, { n: 2 });
    if (kind === "sockel" && !f.rune) f.rune = pickMove(Z.level);
    if (kind === "sockel" && !f.rune) { f.kind = "stein"; f.rune = pickMech(); if (!f.rune) return Z.spawnReward && Z.spawnReward("glut", x, y, { n: 2 }); }
    finds.push(f); return f;
  }
  Z.runen = {
    /* aus erkundung.js (Belohnungen der Karte) */
    give(kind, x, y, q, r) {
      if (kind === "runenstein") return spawnFind("stein", x, y - 4, {});
      if (kind === "bewegung") return spawnFind("sockel", x, y, {});
      return null;
    },
    drawReward(c, r, t) { return r.kind === "runenstein" || r.kind === "bewegung"; },
    spawnStone: (x, y, rune) => spawnFind("stein", x, y, { rune }),
    spawnAltar: (x, y, rune) => spawnFind("sockel", x, y, { rune }),
    grantMove, addBelt, finds: () => finds, gates: () => (G ? G.gates : []), level: () => G, _setup: lv => { prepLevel(lv); setupLevel(lv); }
  };
  function grantMove(k, silent) {
    if (!MR[k]) return;
    const m = MM(), rr = runMR(); if (rr) rr[k] = 1; const first = !m.gesehen[k]; m.gesehen[k] = 1; Z.saveMeta && Z.saveMeta();
    const P = Z.player; if (!P || silent) return;
    const d = MR[k];
    FX.burst(P.x + P.w / 2, P.y + 10, 34, { col: [d.col, "#fff0c0", "#ff8a3a"], sp: 150, up: 60, life: 1, size: 2.4, kind: "glow", add: true });
    FX.ring(P.x + P.w / 2, P.y + 14, 40, d.col, 0.5, 3); FX.slowmo && FX.slowmo(0.5, 0.35); A.play("rune", { vol: 0.8 }); A.play("holy", { vol: 0.4 });
    tutorial(k, first);
  }
  /* Tutorial-Moment in der Welt: kurze Zeile mit der Steuerung über Ezekiel, dazu (falls vorhanden) ein Wegweiser
     zur passenden Sperre dieses Gebiets. Beim ersten Mal ausführlich, danach kurz. */
  /* W7: jede Zeile nennt die Taste(n) – Tastatur, Controller oder Touch, wie gerade benutzt (Z.ui.key) */
  const HOW = {
    kralle: () => [L(["Gegen eine Wand drücken: rutschen", "Press into a wall: slide"]) + " · " + keyHint("jump") + " " + L(["abstoßen", "kick off"]), L(["Zur Wand hin springen klettert höher.", "Jumping toward the wall climbs higher."])],
    schatten: () => [keyHint("roll") + " " + L(["Rolle wird Schattensprint: weiter, in der Luft ohne Fallen", "Roll becomes a shadow sprint: further, no falling in the air"]), L(["Flach genug für Schattenspalten – einfach hineinrollen.", "Flat enough for shadow slits – just roll in."])],
    schwingen: () => [keyHint("jump") + " " + L(["in der Luft: dritter Sprung", "in the air: third jump"]) + " · " + keyHint("jump") + " " + L(["halten: gleiten", "hold: glide"]), L(["Aufwinde tragen dich hinauf.", "Updrafts carry you up."])],
    erde: () => [keyHint("down") + " + " + keyHint("a1") + " " + L(["in der Luft: Bodenstampfer", "in the air: ground pound"]), L(["Bricht rissige Böden.", "Smashes cracked floors."])],
    kette: () => [L(["In der Luft ohne Sprünge: ", "Airborne with no jumps left: "]) + keyHint("jump") + " " + L(["oder", "or"]) + " " + keyHint("use") + " " + L(["zur Öse", "to the ring"]), L(["Runter lässt los.", "Down lets go."])],
    nebel: () => [keyHint("roll") + " " + L(["Rolle wird Nebel: durch Nebelgitter", "Roll turns to mist: through mist grates"]), L(["Geschosse gehen durch dich hindurch.", "Projectiles pass through you."])]
  };
  Z.runeHow = k => (HOW[k] ? HOW[k]() : ["", ""]);
  function tutorial(k, first) {
    const P = Z.player, m = MM(), d = MR[k], how = HOW[k] ? HOW[k]() : ["", ""];
    const long = !m.tut[k]; m.tut[k] = 1; Z.saveMeta && Z.saveMeta();
    notify("ᛟ <b>" + esc(L(d.n)) + "</b><small>" + how[0] + (long ? " · " + how[1] : "") + "</small>", { prio: 2, ort: "welt", x: P.x + P.w / 2, y: P.y - 30, dauer: long ? 6500 : 3500, key: "rune_" + k });
    if (G) { const gt = G.gates.find(g => g.kind === k); if (gt) { gt.lit = 12; } }
    void first;
  }
  function addBelt(k) {
    const P = Z.player; if (!P || !Z.RUNES[k]) return;
    P.runeBelt = P.runeBelt || [];
    let out = null;
    if (P.runeBelt.length >= RN.guertel) {
      /* ersetzt den Stein, der am wenigsten zur eigenen Familie passt */
      recalcActive();
      let wi = 0, wv = 1e9; P.runeBelt.forEach((b, i) => { const v = ACT.fam[Z.RUNES[b].fam] || 0; if (v < wv) { wv = v; wi = i; } });
      out = P.runeBelt.splice(wi, 1)[0];
    }
    P.runeBelt.push(k); ACT.sig = ""; recalcActive();
    const r = Z.RUNES[k], f = FAM[r.fam];
    const n = ACT.fam[r.fam] || 0;
    notify((r.ico || "ᚱ") + " <b>" + esc(L(r.n)) + "</b> <small>" + esc(L(f.n)) + (n >= 2 ? " · " + L(["Familienbonus ", "Set bonus "]) + n + ": " + esc(L(n >= 3 ? f.b3 : f.b2)) : "") + (out ? " · " + L(["ersetzt ", "replaces "]) + esc(L(Z.RUNES[out].n)) : "") + "</small>", { prio: 2, ort: "welt", x: P.x + P.w / 2, y: P.y - 30, dauer: 4200, art: "magie" });
    FX.ring(P.x + P.w / 2, P.y + 14, 30, r.col, 0.4, 3); A.play("rune", { vol: 0.6 }); A.play("gem", { vol: 0.4 });
  }
  function tickFinds(P, dt) {
    for (const f of finds) {
      f.t += dt; if (f.got) continue;
      if (Math.abs(f.x - (P.x + P.w / 2)) < 16 && Math.abs(f.y - (P.y + P.h)) < 26) {
        f.got = true;
        if (f.kind === "stein") addBelt(f.rune);
        else grantMove(f.rune);
      }
    }
  }
  /* Bosse lassen einen Runenstein fallen */
  const boss0 = Z.onBossDown;
  Z.onBossDown = function (b) {
    const r = boss0 ? boss0.apply(this, arguments) : undefined;
    try { if (b && !b.warden || (b && b.warden && Z.R() < 0.4)) { const x = b.x + b.w / 2, gy = W.groundBelow(x, b.y + b.h - 8, 200); setTimeout(() => { if (Z.level && Z.player) spawnFind("stein", x, gy != null ? gy : b.y + b.h); }, 900); } } catch (e) { console.error(e); }
    return r;
  };

  /* ======================= HINWEISE AN DEN SPERREN ======================= */
  const GATE_TXT = {
    kralle: ["Tiefe Kratzspuren an den Schachtwänden …", "Deep claw marks on the shaft walls…"],
    kette: ["Eiserne Ösen hängen unter der Decke …", "Iron rings hang under the ceiling…"],
    schwingen: ["Ein warmer Aufwind steigt den Schacht hinauf …", "A warm updraft rises up the shaft…"],
    erde: ["Der Boden ist rissig und hohl …", "The floor is cracked and hollow…"],
    nebel: ["Ein Gitter, durch das Nebel kriecht …", "A grate with mist seeping through…"],
    schatten: ["Ein Spalt, kaum eine Handbreit hoch …", "A slit barely a hand high…"]
  };
  function tickHints(P) {
    if (!G || !G.gates.length) return;
    const px = P.x + P.w / 2, py = P.y + P.h;
    for (const gt of G.gates) {
      if (gt.lit > 0) gt.lit -= 1 / 60;
      const d = Math.hypot(gt.hx - px, (gt.hy - py) * 1.4);
      if (d > 130 || G.hinted.has(gt.cell)) continue;
      G.hinted.add(gt.cell);
      /* steht ein Schild an der Sperre (schilder.js), erzählt das schon alles */
      if (Z.schilder && Z.schilder.hat("rune:" + gt.cell)) continue;
      const owned = has(gt.kind), d2 = MR[gt.kind];
      notify((owned ? "ᛟ " : "? ") + "<b>" + esc(L(GATE_TXT[gt.kind])) + "</b><small>" + (owned ? L(["Deine ", "Your "]) + esc(L(d2.n)) + L([" hilft hier.", " helps here."]) : MM().gesehen[gt.kind] ? esc(L(d2.n)) + L([" nötig – im Lager dauerhaft freischalten.", " needed – unlock it for good at camp."]) : L(["Eine Rune könnte hier weiterhelfen.", "A rune might help here."])) + "</small>", { prio: owned ? 1 : 0, ort: "welt", x: gt.hx, y: gt.hy - 20, dauer: 3200, key: "gate_" + gt.cell });
    }
  }
  /* Hinweise und Funde laufen im Spieler-Update mit */
  const upd1 = Z.updatePlayer;
  Z.updatePlayer = function (P, dt) {
    upd1.call(this, P, dt);
    if (P && P === Z.player && !P.dead && Z.level) { tickFinds(P, dt); if (!Z.level.hub) tickHints(P); }
  };

  /* ======================= ZEICHNEN ======================= */
  const vis = (x, y, m) => { const cam = Z.cam; m = m || 40; return x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m && y < cam.y + cam.h + m; };
  function drawGates(c, t) {
    if (!G || G.lv !== W.lv) return;
    const lv = G.lv, P = Z.player;
    /* Kratzspuren */
    const kr = has("kralle");
    for (const s of G.scratch) {
      if (!vis(s.x, s.y)) continue;
      c.save(); c.strokeStyle = kr ? "rgba(255,179,71,.75)" : "rgba(30,20,20,.75)"; c.lineWidth = 1.3;
      const bx = s.x - s.d * 1;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx - s.d * (1 + i * 1.6), s.y + i * 1.2); c.lineTo(bx - s.d * (3 + i * 1.6), s.y + 10 + i * 1.2 + s.s); c.stroke(); }
      if (kr) { c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,120,40,.25)"; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - s.d * 3, s.y + 2); c.lineTo(bx - s.d * 5, s.y + 12); c.stroke(); }
      c.restore();
    }
    /* Ösen */
    const ke = has("kette"), nr = ke && P && !P.onGround ? nearestRing(P) : null;
    for (const r of G.rings) {
      const x = r.x * T + 8, y = r.y * T + 8; if (!vis(x, y)) continue;
      let top = r.y; while (top > 0 && !W.solidT(lv.get(r.x, top - 1)) && r.y - top < 6) top--;
      c.strokeStyle = "#4a3a30"; c.lineWidth = 1.5; c.setLineDash([2, 1.5]); c.beginPath(); c.moveTo(x, top * T); c.lineTo(x, y - 4); c.stroke(); c.setLineDash([]);
      c.strokeStyle = r === nr ? "#ffd27a" : ke ? "#c8a070" : "#6a5a4a"; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.stroke();
      if (ke) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = r === nr ? 0.8 : 0.25 + 0.1 * Math.sin(t * 3 + r.x); Z.draw.glow(c, x, y, r === nr ? 14 : 9, "rgba(229,180,84,.6)"); c.restore(); }
    }
    /* Aufwind */
    for (const u of G.ups) {
      const x0 = u.x0 * T, x1 = (u.x1 + 1) * T, y0 = u.y0 * T, y1 = (u.y1 + 1) * T;
      if (!vis((x0 + x1) / 2, (y0 + y1) / 2, (y1 - y0) / 2 + 40)) continue;
      c.save(); c.globalCompositeOperation = "lighter";
      const gr = c.createLinearGradient(0, y1, 0, y0); gr.addColorStop(0, "rgba(255,140,60,.10)"); gr.addColorStop(1, "rgba(255,90,60,0)"); c.fillStyle = gr; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.strokeStyle = "rgba(255,190,110,.28)"; c.lineWidth = 1;
      for (let i = 0; i < 7; i++) { const xx = x0 + ((i * 37) % (x1 - x0)), ph = (t * 0.6 + i * 0.37) % 1, yy = y1 - ph * (y1 - y0); c.beginPath(); c.moveTo(xx + Math.sin(t * 3 + i) * 3, yy); c.lineTo(xx + Math.sin(t * 3 + i + 1) * 3, yy - 14); c.stroke(); }
      c.restore();
    }
    /* rissiger Boden */
    if (G.crack.size) {
      const er = has("erde");
      for (const cr of G.crack.values()) {
        const x = cr.x * T, y = cr.y * T; if (!vis(x, y)) continue;
        c.strokeStyle = er ? "rgba(255,170,90,.85)" : "rgba(20,12,10,.85)"; c.lineWidth = 1.2;
        const s = (cr.x * 13 + cr.y * 7) % 5;
        c.beginPath(); c.moveTo(x + 2 + s, y + 1); c.lineTo(x + 6, y + 6); c.lineTo(x + 4 + s, y + 11); c.moveTo(x + 6, y + 6); c.lineTo(x + 12, y + 8 - s * 0.5); c.lineTo(x + 15, y + 13); c.stroke();
        if (er) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = 0.25 + 0.12 * Math.sin(t * 2.5 + cr.x); Z.draw.glow(c, x + 8, y + 3, 10, "rgba(255,150,60,.6)"); c.restore(); }
      }
    }
    /* Nebelgitter */
    if (G.nGrate) {
      const ne = has("nebel");
      for (const gt of G.gates) if (gt.kind === "nebel") for (const [x0, y0] of gt.tiles) {
        const x = x0 * T, y = y0 * T; if (!vis(x, y)) continue;
        c.fillStyle = "rgba(20,14,16,.35)"; c.fillRect(x, y, T, T);
        c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (ne ? 0.35 : 0.18) + 0.08 * Math.sin(t * 2 + y0); Z.draw.glow(c, x + 8, y + 8, 16, "rgba(240,215,225,.5)"); c.restore();
        c.fillStyle = "#7a6a60"; for (let i = 0; i < 4; i++) c.fillRect(x + 1 + i * 4, y, 2, T);
        c.fillStyle = "#a89080"; for (let i = 0; i < 4; i++) c.fillRect(x + 1 + i * 4, y, 0.7, T);
        c.fillStyle = "#8a7468"; c.fillRect(x, y + 2, T, 1.5); c.fillRect(x, y + 11, T, 1.5);
        c.save(); c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 1.5 + y0); c.fillStyle = ne ? "#f0e0e8" : "#c8b8c0";
        for (let i = 0; i < 3; i++) { const px = x + 8 + Math.sin(t * 0.8 + i * 2.1 + y0) * 9, py = y + 4 + i * 4; c.beginPath(); c.ellipse(px, py, 7, 2.5, 0, 0, TAU); c.fill(); }
        c.restore();
      }
    }
    /* Schattenspalt */
    for (const s of G.slits) {
      const x0 = s.x0 * T, x1 = (s.x1 + 1) * T, y = s.y * T; if (!vis((x0 + x1) / 2, y)) continue;
      c.fillStyle = "rgba(10,4,14,.45)"; c.fillRect(x0, y, x1 - x0, T);
      c.save(); c.globalCompositeOperation = "lighter"; const sa = has("schatten") ? 1 : 0.55;
      c.globalAlpha = (0.45 + 0.2 * Math.sin(t * 2)) * sa; c.fillStyle = "#b77cff"; c.fillRect(x0, y, x1 - x0, 1.5); c.fillRect(x0, y + T - 1.5, x1 - x0, 1.5);
      c.globalAlpha = 0.35 * sa; for (let i = 0; i < 3; i++) { const px = x0 + ((t * 18 + i * 23) % (x1 - x0)); Z.draw.glow(c, px, y + 8, 7, "rgba(183,124,255,.6)"); }
      c.restore();
    }
  }
  function drawFind(c, f, t) {
    const x = f.x, y = f.y, bob = Math.sin(t * 2 + f.t) * 1.5;
    if (f.kind === "sockel") {
      const d = MR[f.rune] || {}; const col = d.col || "#ffb347";
      c.fillStyle = "#2e2428"; c.fillRect(x - 9, y - 10, 18, 10); c.fillStyle = "#4a3c40"; c.fillRect(x - 11, y - 12, 22, 3); c.fillRect(x - 7, y - 2, 14, 2);
      if (f.got) return;
      c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y - 22 + bob, 18 + Math.sin(t * 3) * 2, "rgba(255,140,60,.45)"); c.restore();
      c.save(); c.translate(x, y - 22 + bob); c.rotate(Math.sin(t * 1.3 + f.t) * 0.15);
      c.fillStyle = "#2a1e1c"; c.beginPath(); c.moveTo(0, -8); c.lineTo(6, 0); c.lineTo(0, 8); c.lineTo(-6, 0); c.closePath(); c.fill();
      c.strokeStyle = col; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = col; c.font = "700 8px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ᛟ", 0, 0.5); c.restore();
      if (Math.random() < 0.15) FX.p({ x: x + (Math.random() - 0.5) * 16, y: y - 14 - Math.random() * 14, vx: 0, vy: -16, life: 0.8, size: 1.3, col, kind: "glow", add: true });
    } else {
      if (f.got) return;
      const r = Z.RUNES[f.rune] || {}; const col = r.col || "#ffd27a";
      c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y - 10 + bob, 12, "rgba(255,170,90,.35)"); c.restore();
      c.save(); c.translate(x, y - 10 + bob);
      c.fillStyle = "#3a302c"; c.beginPath(); c.ellipse(0, 0, 6, 7.5, 0, 0, TAU); c.fill(); c.strokeStyle = "#6a5a50"; c.lineWidth = 1; c.stroke();
      c.fillStyle = col; c.font = "700 8px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(r.ico || "ᚱ", 0, 0.5); c.restore();
      if (Math.random() < 0.08) FX.p({ x: x + (Math.random() - 0.5) * 10, y: y - 8 - Math.random() * 10, vx: 0, vy: -12, life: 0.7, size: 1.2, col, kind: "glow", add: true });
    }
  }
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (dwp0) dwp0.apply(this, arguments);
    try { drawGates(c, t); for (const f of finds) if (vis(f.x, f.y)) drawFind(c, f, t); for (const p of puddles) if (vis(p.x, p.y)) { const a = Math.min(1, (RN.pfuetzeT - p.t) * 2); c.save(); c.globalAlpha = 0.5 * a; c.fillStyle = "#4a3a20"; c.beginPath(); c.ellipse(p.x, p.y - 1, 14, 2.5, 0, 0, TAU); c.fill(); c.globalCompositeOperation = "lighter"; c.globalAlpha = (0.35 + 0.25 * Math.sin(t * 20 + p.x)) * a; c.fillStyle = "#f0e060"; c.beginPath(); c.ellipse(p.x, p.y - 1, 10, 1.5, 0, 0, TAU); c.fill(); c.restore(); } } catch (e) { console.error(e); }
  };
  /* Spieler: Schwingen beim Gleiten, Schattengestalt, Nebel, Kette zur Öse */
  const dpl0 = Z.drawPlayer;
  Z.drawPlayer = function (c, P, t) {
    if (!P || P !== Z.player) return dpl0.apply(this, arguments);
    const x = P.x + P.w / 2;
    if (P.shadowForm) {
      c.save();
      c.fillStyle = "rgba(20,6,26,.85)"; c.beginPath(); c.ellipse(x, P.y + P.h - 5, 13, 5.5, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = "lighter"; c.fillStyle = "#ff5a8a"; c.fillRect(x + P.face * 5 - 1, P.y + P.h - 8, 2, 1.4); c.fillRect(x + P.face * 8 - 1, P.y + P.h - 8, 2, 1.4);
      c.strokeStyle = "rgba(183,124,255,.5)"; c.lineWidth = 1; c.beginPath(); c.ellipse(x, P.y + P.h - 5, 14, 6, 0, 0, TAU); c.stroke();
      c.restore();
      return;
    }
    if (P.gliding || (P.j3 && (P.jumpT || 0) < 0.3 && !P.onGround)) {
      const k = P.gliding ? 1 : clamp((P.jumpT || 0) / 0.3, 0, 1), fl = Math.sin(t * (P.gliding ? 6 : 14)) * 3;
      c.save(); c.translate(x - P.face * 2, P.y + 9);
      for (const d of [-1, 1]) {
        c.fillStyle = "rgba(90,14,20,.88)"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(d * 12, -10 - fl, d * 22 * k, -4 - fl); c.lineTo(d * 18 * k, 2); c.lineTo(d * 13 * k, 0); c.lineTo(d * 9 * k, 5); c.closePath(); c.fill();
        c.strokeStyle = "#ff5a4e"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(d * 12, -10 - fl, d * 22 * k, -4 - fl); c.stroke();
      }
      c.restore();
    }
    if (P.ringHang || P.ringPull) {
      const r = (P.ringHang || P.ringPull).r; c.strokeStyle = "#c8a070"; c.lineWidth = 1.4; c.setLineDash([2, 1.5]); c.beginPath(); c.moveTo(x + P.face * 3, P.y + 6); c.lineTo(r.x * T + 8, r.y * T + 8); c.stroke(); c.setLineDash([]);
    }
    if (P._mist && P.rollT > 0) { c.save(); c.globalAlpha = 0.4; const r = dpl0.apply(this, arguments); c.restore(); return r; }
    const r = dpl0.apply(this, arguments);
    if (P.wallT > 0.05) { c.save(); c.globalCompositeOperation = "lighter"; const wx = P.wallDir > 0 ? P.x + P.w : P.x; c.strokeStyle = "rgba(255,179,71,.6)"; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(wx, P.y + 6 + i * 2); c.lineTo(wx - P.wallDir * 2, P.y + 2 + i * 2 - 4); c.stroke(); } c.restore(); }
    return r;
  };
  const dpr0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dpr0) dpr0.apply(this, arguments);
    if (!blades.length && !booms.length) return;
    c.save();
    for (const b of blades) {
      const a = Math.min(1, (b.life - b.t) * 4);
      c.save(); c.translate(b.x, b.y); c.rotate(b.rot); c.globalAlpha = 0.85 * a;
      c.strokeStyle = "#b77cff"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 1.2); c.stroke();
      c.strokeStyle = "#ff8ac8"; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 6, Math.PI, Math.PI * 2.1); c.stroke();
      c.restore();
    }
    for (const o of booms) { c.save(); c.translate(o.x, o.y); c.rotate(o.rot); c.fillStyle = "#8a6a40"; c.beginPath(); c.ellipse(0, 0, 7, 5, 0, 0, TAU); c.fill(); c.strokeStyle = "#e8c890"; c.lineWidth = 1.2; c.stroke(); c.restore(); }
    c.restore();
  };

  /* ======================= LAGER: RUNENSTELE ======================= */
  function steleHTML() {
    const M = Z.meta, m = MM();
    let h = '<h2>' + L(["Runenstele", "Rune Stele"]) + ' <small>' + L(["Bewegungs-Runen dauerhaft binden", "Bind movement runes for good"]) + '</small></h2><p class="hinweis">' + L(["Einmal in der Feste gefunden, lässt sich eine Rune hier mit Seelensplittern dauerhaft binden.", "Once found in the keep, a rune can be bound here for good with soul shards."]) + ' <span class="bank">' + U.fmt(M.shards) + " ◆</span></p><div class=\"rn-liste\">";
    let i = 0;
    for (const k in MR) {
      const d = MR[k], frei = !!m.frei[k], seen = !!m.gesehen[k]; i++;
      h += '<div class="rn-zeile' + (frei ? " frei" : "") + '" style="--c:' + d.col + '"><div class="rn-txt"><b>ᛟ ' + (seen || frei ? esc(L(d.n)) : "???") + "</b><small>" + (seen || frei ? esc(L(d.d)) : L(["Noch nicht gefunden. Sperre: ", "Not found yet. Barrier: "]) + esc(L(d.gate))) + "</small></div>" +
        (frei ? '<span class="rn-ok">✓</span>' : '<button data-act="rnFrei" data-arg="' + k + '" data-key="' + i + '"' + (!seen || M.shards < d.cost ? " disabled" : "") + ">" + d.cost + " ◆</button>") + "</div>";
    }
    return h + '</div><div class="knoepfe"><button data-act="close">' + L(["Zurück", "Back"]) + "</button></div>";
  }
  function openStele() { if (Z.ui && Z.ui.open) Z.ui.open(steleHTML(), { cls: "lager schmal" }); }
  function wireUI() {
    if (!Z.ui || !Z.ui.actions) return setTimeout(wireUI, 60);
    Z.ui.actions.rnFrei = k => {
      const M = Z.meta, m = MM(), d = MR[k]; if (!d || m.frei[k] || !m.gesehen[k] || M.shards < d.cost) return;
      M.shards -= d.cost; m.frei[k] = 1; Z.saveMeta(); A.play("rune", { vol: 0.7 }); A.play("anvil", { vol: 0.4 });
      const P = Z.player; if (P) FX.ring(P.x + P.w / 2, P.y + 14, 36, d.col, 0.5, 3);
      openStele();
    };
    /* Pausenmenü: Runengürtel und Familien – steht jetzt vollständig im Reiter „Ausrüstung“ (ui.js, Z.ui.gear);
       nur ohne ihn (ältere Oberfläche) hier anhängen */
    const p0 = Z.ui.pause;
    if (p0 && !p0._rn && !Z.ui.gear) {
      Z.ui.pause = function () { const r = p0.apply(this, arguments); try { const h = pauseHTML(), box = document.querySelector("#modal .pausenmenue .p-info"); if (h && box) box.insertAdjacentHTML("beforeend", h); } catch (e) { console.error(e); } return r; };
      Z.ui.pause._rn = true;
    }
    if (Z.lager && Z.lager.station) {
      Z.lager.station("runenstele", {
        n: ["Runenstele", "Rune Stele"], near: "sigrun", dx: 2.8, ok: () => Object.keys(MM().gesehen).length > 0 || Object.keys(MM().frei).length > 0,
        label: () => L(["Runenstele", "Rune Stele"]), use: openStele,
        draw: (c, x, y, t) => {
          c.fillStyle = "#2e2628"; c.fillRect(x - 6, y - 30, 12, 30); c.fillStyle = "#3e3436"; c.fillRect(x - 8, y - 32, 16, 4); c.fillRect(x - 9, y - 3, 18, 3);
          const m = MM(); let i = 0;
          for (const k in MR) { const lit = m.frei[k] ? 1 : m.gesehen[k] ? 0.4 : 0.08; c.globalAlpha = lit; c.fillStyle = MR[k].col; c.fillRect(x - 3 + (i % 2) * 4, y - 26 + Math.floor(i / 2) * 7, 2.5, 4); i++; }
          c.globalAlpha = 1;
          if (Object.keys(m.gesehen).some(k => !m.frei[k])) { c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y - 18, 14 + Math.sin(t * 2) * 2, "rgba(255,140,60,.3)"); c.restore(); }
        }
      });
    }
  }
  function pauseHTML() {
    const P = Z.player; if (!P) return "";
    recalcActive();
    const mv = Object.keys(MR).filter(k => has(k));
    let h = "";
    /* W7: mit Bedienzeile (Taste), damit man im Pausenmenü nachlesen kann, wie die Rune ausgelöst wird */
    if (mv.length) h += "<h3>" + L(["Bewegungs-Runen", "Movement runes"]) + "</h3>" + mv.map(k => '<p class="hinweis rn-how"><b style="color:' + MR[k].col + '" title="' + esc(L(MR[k].d)) + '">ᛟ ' + esc(L(MR[k].n)) + (MM().frei[k] ? "" : " · " + L(["Lauf", "run"])) + "</b> " + HOW[k]()[0] + "</p>").join("");
    if (!ACT.any) return h;
    h += "<h3>" + L(["Runen & Familien", "Runes & families"]) + "</h3>";
    const belt = P.runeBelt || [];
    if (belt.length) h += '<p class="hinweis">' + L(["Runengürtel ", "Rune belt "]) + belt.length + "/" + RN.guertel + ": " + belt.map(k => '<span style="color:' + Z.RUNES[k].col + '">' + (Z.RUNES[k].ico || "") + " " + esc(L(Z.RUNES[k].n)) + "</span>").join(" · ") + "</p>";
    h += '<div class="p-chips">';
    for (const f in ACT.fam) {
      const n = ACT.fam[f], F = FAM[f]; if (!F) continue;
      const tip = L(["2: ", "2: "]) + L(F.b2) + " · 3: " + L(F.b3);
      h += '<span style="color:' + F.col + (n >= 2 ? ";font-weight:800" : ";opacity:.75") + '" title="' + esc(tip) + '">' + F.ico + " " + esc(L(F.n)) + " " + "◆".repeat(Math.min(3, n)) + "◇".repeat(Math.max(0, 3 - n)) + "</span>";
    }
    h += "</div>";
    for (const f in ACT.fam) { const n = ACT.fam[f], F = FAM[f]; if (F && n >= 2) h += '<p class="hinweis" style="color:' + F.col + '">' + F.ico + " " + esc(L(n >= 3 ? F.b3 : F.b2)) + (n >= 3 ? " + " + esc(L(F.b2)) : "") + "</p>"; }
    return h;
  }
  const css = document.createElement("style");
  css.textContent = [
    ".rn-liste{display:flex;flex-direction:column;gap:5px;margin:6px 0}",
    ".rn-zeile{display:flex;gap:10px;align-items:center;padding:6px 9px;border:1px solid #33241f;border-left:4px solid var(--c);border-radius:6px;background:rgba(255,235,200,.03)}",
    ".rn-zeile.frei{background:rgba(229,180,84,.07)}.rn-txt{flex:1;min-width:0}.rn-txt b{color:var(--c)}.rn-txt small{display:block;color:var(--mute,#ab9c8c);font-size:12.5px;line-height:1.3}",
    ".rn-ok{color:var(--gold,#e5b454);font-weight:800;font-size:18px;padding:0 12px}.rn-zeile button{min-width:80px}"
  ].join("\n");
  document.head.appendChild(css);
  if (document.readyState === "complete") setTimeout(wireUI, 0); else window.addEventListener("load", () => setTimeout(wireUI, 0));

  /* ======================= GRAVUR-POOL: Familie bevorzugt ======================= */
  /* schmiede.js fragt Z.runePool(it, n) – passend zur getragenen Familie dreifach gewichtet, Schildrunen nur mit Schild */
  Z.runePool = function (it, n) {
    const d = Z.itemDef(it), have = it.runes || [], P = Z.player;
    const shield = (d && d.kind === "shield") || (P && ["a1", "a2"].some(s => { const dd = Z.itemDef(P.slots[s]); return dd && dd.kind === "shield"; }));
    recalcActive();
    const pool = Object.keys(Z.RUNES).filter(k => !have.includes(k) && !(d && d.kind === "shield" && Z.RUNES[k].noShield) && !(Z.RUNES[k].needShield && !shield));
    const fams = {}; for (const k of have) if (Z.RUNES[k].fam) fams[Z.RUNES[k].fam] = 1; for (const f in ACT.fam) fams[f] = 1;
    const out = [], R = Z.R;
    while (out.length < n && pool.length) {
      let sum = 0; const w = pool.map(k => { const v = (fams[Z.RUNES[k].fam] ? 3 : 1) * (Z.RUNES[k].mech ? 1.2 : 1); sum += v; return v; });
      let x = R() * sum, i = 0; for (; i < pool.length - 1; i++) { x -= w[i]; if (x <= 0) break; }
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  };
})();
