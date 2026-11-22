/* Ezekiel – The Destroyer · Ebenen, Türen und Nebel
   - Fallschaden ab großer Höhe (mit Rolle kurz vor der Landung: abrollen, kein Schaden) – auch für Gegner.
   - Gegner springen nicht mehr von selbst in Abgründe oder Schächte.
   - Türen zwischen Räumen: man sieht nicht, was dahinter liegt, bis man sie aufstößt.
   - Unerforschte Räume liegen im Nebel und werden erst beim Betreten sichtbar.
   - Jede Sackgasse lohnt sich: dort steht immer etwas (Truhe, Essen, Schriftrolle oder Gold). */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const { glow, poly, limb, circ } = Z.draw;
  const CW = Z.CW, CH = Z.CH;
  const alive = e => e && !e.dead && !(e.intro > 0);
  let doors = [], seen = new Set(), lvRef = null, fogT = 0;

  /* ======================= Aufbau je Gebiet ======================= */
  function setup(lv) {
    doors = []; seen = new Set(); lvRef = lv; Z.lvDoors = doors;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    /* Türen auf Pfad- und Seitenverbindungen nach rechts */
    for (const k in lv.cells) {
      const c = lv.cells[k], r = lv.cells[(c.x + 1) + "," + c.y];
      if (!r || !c.need.R || c.need.R === "X" || r.kind === "secret" || Math.random() > 0.5) continue;
      const x = (c.x + 1) * CW, y0 = c.y * CH + 8;
      let ok = true; for (let y = y0; y <= y0 + 2; y++) if (lv.get(x, y) !== 0) ok = false;
      if (!W.solidT(lv.get(x, y0 + 3)) && !W.isPlat(x, y0 + 3)) ok = false;
      if (lv.doors.some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - (y0 + 2)) < 3)) ok = false;
      if (!ok) continue;
      for (let y = y0; y <= y0 + 2; y++) lv.set(x, y, 12);
      doors.push({ x, y0, open: 0, opening: false, cells: [c.x + "," + c.y, r.x + "," + r.y] });
    }
    /* Sackgassen belohnen */
    const hasLoot = (c) => (Z.pickups || []).some(p => Math.floor(p.x / T / CW) === c.x && Math.floor(p.y / T / CH) === c.y && ["chest", "item", "scroll", "food", "cursed"].includes(p.kind));
    for (const k in lv.cells) {
      const c = lv.cells[k]; if (c === lv.startCell || c === lv.endCell) continue;
      const exits = ["L", "R", "U", "D"].filter(s => c.need[s]).length;
      if ((c.kind === "side" || c.kind === "secret" || exits <= 1) && !hasLoot(c)) {
        for (let i = 0; i < 200; i++) {
          const x = c.x * CW + 2 + ((Math.random() * (CW - 4)) | 0), y = c.y * CH + 2 + ((Math.random() * (CH - 4)) | 0);
          if (!Z.standable(lv, x, y, 2)) continue;
          const r = Math.random(), px = x * T + 8, py = (y + 1) * T - 2;
          if (r < 0.45) Z.spawnPickup("chest", px, py, { vx: 0, vy: 0 });
          else if (r < 0.65) Z.spawnPickup("scroll", px, py, { vx: 0, vy: 0 });
          else if (r < 0.85) Z.spawnPickup("food", px, py, { food: Z.R.pick(Z.FOOD), vx: 0, vy: 0 });
          else for (let n = 0; n < 6; n++) Z.spawnPickup("gold", px, py - 4, { n: 6, vx: (Math.random() - 0.5) * 60, vy: -80 });
          break;
        }
      }
    }
    const P = Z.player; if (P) reveal(P);
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };
  const cellOf = (x, y) => Math.floor(x / T / CW) + "," + Math.floor(y / T / CH);
  function reveal(P) { const k = cellOf(P.x + P.w / 2, P.y + P.h / 2); if (!seen.has(k)) { seen.add(k); fogT = 0; } }

  /* ======================= Türen ======================= */
  function doorTick(dt) {
    const P = Z.player; if (!P) return;
    for (const d of doors) {
      if (d.opening) { d.open = Math.min(1, d.open + dt * 4); continue; }
      const dx = d.x * T, r = { x: dx - 3, y: d.y0 * T, w: T + 6, h: 3 * T };
      const push = (U.overlap(r, P) && ((P.vx > 10 && P.x < dx) || (P.vx < -10 && P.x > dx) || Z.input.held.right || Z.input.held.left)) || (Z.input.pressed.use && Math.abs(P.x + P.w / 2 - (dx + 8)) < 26 && Math.abs(P.y + P.h - (d.y0 + 3) * T) < 20);
      let hitByE = false;
      if (P.act && P.act.type === "melee" && P.act.phase === "act" && Math.abs(P.x + P.w / 2 - (dx + 8)) < 34 && Math.abs(P.y - d.y0 * T) < 30) hitByE = true;
      if (push || hitByE) {
        d.opening = true; d.dir = P.x < dx ? 1 : -1;
        for (let y = d.y0; y <= d.y0 + 2; y++) Z.level.set(d.x, y, 0);
        A.play(hitByE ? "crate" : "door", { vol: 0.6, x: dx }); A.play("chain", { vol: 0.2, rate: 0.6 });
        FX.burst(dx + 8, (d.y0 + 2) * T, 8, { col: [Z.dustCol || "#8a7a70"], sp: 50, life: 0.6, size: 3, kind: "smoke" });
        for (const k of d.cells) seen.add(k);
      }
    }
  }
  function drawDoors(c, t) {
    const B = Z.biome || {}, wood = B.plat || "#6a4a2a";
    for (const d of doors) {
      const x = d.x * T, y = d.y0 * T, h = 3 * T;
      /* Rahmen */
      c.fillStyle = "#1a1214"; c.fillRect(x - 2, y - 4, 2, h + 4); c.fillRect(x + T, y - 4, 2, h + 4); c.fillRect(x - 2, y - 5, T + 4, 3);
      if (d.open >= 1) { /* offen: Türblatt flach an der Wand */ c.fillStyle = Z.shade ? Z.shade(wood, -0.4) : wood; c.fillRect(d.dir > 0 ? x + T - 3 : x, y, 3, h); continue; }
      const w = T * (1 - d.open * 0.85), ox = d.dir > 0 ? x + T - w : x;
      c.fillStyle = Z.shade ? Z.shade(wood, -0.15) : wood; c.fillRect(ox, y, w, h);
      c.fillStyle = Z.shade ? Z.shade(wood, -0.4) : "#3a2a1a"; for (let i = 1; i < 4; i++) c.fillRect(ox + (w / 4) * i, y, 0.8, h);
      c.fillStyle = "#4a4448"; c.fillRect(ox, y + 6, w, 2); c.fillRect(ox, y + h - 9, w, 2);
      if (d.open < 0.1) { circ(c, x + (d.dir || 1) > 0 ? x + 12 : x + 4, y + h * 0.55, 1.4, "#c8a060"); /* Licht unter der Tür */ c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,190,110," + (0.25 + 0.1 * Math.sin(t * 3 + d.x)) + ")"; c.fillRect(x, y + h - 1, T, 1); c.restore(); }
    }
  }

  /* ======================= Nebel über unerforschten Räumen ======================= */
  let fogSpr = null;
  function fogSprite() {
    if (fogSpr) return fogSpr;
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64; const g = cv.getContext("2d");
    for (let i = 0; i < 26; i++) { const x = Math.random() * 64, y = Math.random() * 64, r = 10 + Math.random() * 18; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(120,110,120,.18)"); gr.addColorStop(1, "rgba(120,110,120,0)"); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    return (fogSpr = cv);
  }
  function drawFog(c, cam, t) {
    const lv = Z.level; if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    fogT = Math.min(1, fogT + 0.02);
    const sw = CW * T, sh = CH * T, x0 = Math.floor(cam.x / sw), x1 = Math.floor((cam.x + cam.w) / sw), y0 = Math.floor(cam.y / sh), y1 = Math.floor((cam.y + cam.h) / sh);
    const spr = fogSprite();
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const k = cx + "," + cy; if (seen.has(k) || !lv.cells[k]) continue;
      const px = cx * sw, py = cy * sh, pad = 18;
      c.save();
      /* weicher Rand: zur Seite eines bekannten Raums hin auslaufen */
      const g = c.createLinearGradient(px, 0, px + sw, 0);
      const lk = seen.has((cx - 1) + "," + cy), rk = seen.has((cx + 1) + "," + cy);
      g.addColorStop(0, lk ? "rgba(8,6,10,.55)" : "rgba(8,6,10,.96)"); g.addColorStop(lk ? 0.12 : 0, "rgba(8,6,10,.96)"); g.addColorStop(rk ? 0.88 : 1, "rgba(8,6,10,.96)"); g.addColorStop(1, rk ? "rgba(8,6,10,.55)" : "rgba(8,6,10,.96)");
      c.fillStyle = g; c.fillRect(px - 1, py - 1, sw + 2, sh + 2);
      /* treibender Nebel */
      if (Z.gq && Z.gq.level === 0) { c.restore(); continue; }
      c.globalAlpha = 0.9; const o = (t * 6) % 64;
      for (let yy = py - 64; yy < py + sh; yy += 64) for (let xx = px - 64 + o; xx < px + sw; xx += 64) c.drawImage(spr, xx, yy + Math.sin(t * 0.5 + xx * 0.01) * 4, 64, 64);
      c.restore();
    }
  }

  /* ======================= Fallschaden & Schutz vor Selbstmord ======================= */
  function groundAhead(e, dist) {
    for (let s = 8; s <= dist; s += 8) {
      const x = e.face > 0 ? e.x + e.w + s : e.x - s, tx = Math.floor(x / T), ty = Math.floor((e.y + e.h + 2) / T);
      let ground = false; for (let k = 0; k < 4; k++) { const v = W.tile(tx, ty + k); if (v === 9 || v === 3 || v === 5) break; if (W.solidT(v) || W.isPlat(tx, ty + k)) { ground = true; break; } }
      if (!ground) return false;
    }
    return true;
  }
  function fallTick(dt) {
    const P = Z.player;
    if (P && !P.dead) {
      if (P.onGround || P.climbing || P.ledge || P.grapple) { if (P._wasAir && P.peakY != null && !P.climbing) landed(P); P.peakY = P.y; P._wasAir = false; }
      else { P._wasAir = true; P.peakY = Math.min(P.peakY == null ? P.y : P.peakY, P.y); if (P.vy < -100) P.peakY = Math.min(P.peakY, P.y); }
      if (Z.input.pressed.roll) P._rollPress = P.time;
      reveal(P);
    }
    for (const e of Z.enemies) {
      if (!alive(e) || e.def.fly || e.def.boss) continue;
      /* Angriffe, die über eine Kante führen würden, abbrechen */
      const a = e.act && e.act.a;
      if (a && e.act.phase === "pre" && ["leap", "lunge", "charge"].includes(a.k) && !e.act.gcheck) {
        e.act.gcheck = true;
        const dist = a.k === "leap" ? Math.min(140, (a.jump ? a.jump[0] : 240) * 0.55) : a.k === "charge" ? 90 : Math.min(90, (a.lunge || 200) * (a.act || 0.15) * 0.7);
        if (!groundAhead(e, dist)) { e.act = null; e.cd = 0.4; }
      }
      /* Fallschaden für Gegner (z. B. vom Spieler in einen Schacht gestoßen) */
      if (e.onGround) { if (e._air && e.peakY != null && e.y - e.peakY > 9 * T) { const n = Math.round(e.hpMax * Math.min(0.6, (e.y - e.peakY - 9 * T) / (T * 20))); Z.hitEnemy(e, n, { src: "fall", fx: true, heavy: true }); FX.burst(e.x + e.w / 2, e.y + e.h, 10, { col: Z.dustCol || "#8a7a70", sp: 90, ang: -Math.PI / 2, spread: 2.6, life: 0.4, size: 2.5, kind: "smoke" }); } e.peakY = e.y; e._air = false; }
      else { e._air = true; e.peakY = Math.min(e.peakY == null ? e.y : e.peakY, e.y); }
    }
  }
  function landed(P) {
    const h = P.y - P.peakY; if (h <= 8 * T || P.plunge || P._noFall) return;
    if (P.rollT > 0 || (P._rollPress && P.time - P._rollPress < 0.18)) { FX.text(P.x + P.w / 2, P.y - 10, L(["Abgerollt!", "Rolled!"]), "#ffe08a"); A.play("roll", { vol: 0.6 }); if (P.rollT <= 0) { P.rollT = 0.18; P.rollDir = P.face; } return; }
    const frac = Math.min(0.35, (h - 8 * T) / (T * 30) + 0.05);
    const n = Math.round(P.hpMax * frac);
    Z.hurtPlayer(n, { x: P.x, kb: 0, unblockable: true, hazard: true, force: true, fall: true });
    P.hurtT = 0.25; FX.addShake(6); A.play("land", { vol: 0.9, rate: 0.7 });
    FX.burst(P.x + P.w / 2, P.y + P.h, 16, { col: Z.dustCol || "#8a7a70", sp: 140, ang: -Math.PI / 2, spread: 2.8, life: 0.5, size: 3, kind: "smoke" });
    FX.text(P.x + P.w / 2, P.y - 14, L(["Aufprall!", "Impact!"]), "#ff9a7a", true);
  }
  /* Ausweichsprung der Gegner nur, wenn hinter ihnen Boden ist (kampfkunst setzt e.vx nach hinten) */
  const ek0 = Z.kampfTick;
  Z.kampfTick = function (dt) {
    const before = new Map(); for (const e of Z.enemies) before.set(e, e.evadeCd || 0);
    ek0(dt);
    for (const e of Z.enemies) if (alive(e) && (e.evadeCd || 0) > (before.get(e) || 0) + 1) { e.face = -e.face; const ok = groundAhead(e, 50); e.face = -e.face; if (!ok) { e.vx = 0; e.vy = Math.min(e.vy, -120); } }
  };

  Z.ebenenTick = function (dt) { doorTick(dt); fallTick(dt); };
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (dp0) dp0(c, t); drawDoors(c, t); };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) { if (al0) al0(c, cam, W2, H2, t); c.save(); drawFog(c, cam, t); c.restore(); };
  Z.fogSeen = () => seen;
})();
