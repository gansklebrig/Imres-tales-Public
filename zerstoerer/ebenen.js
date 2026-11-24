/* Ezekiel – The Destroyer · Ebenen, Türen und Nebel
   - Fallschaden ab großer Höhe (ab ~12 Kacheln, höchstens 20 %) (mit Rolle kurz vor der Landung: abrollen, kein Schaden) – auch für Gegner.
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
    doors = []; seen = new Set(); lvRef = lv; Z.lvDoors = doors; lastRoom = null;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    /* Außengebiete: keine unsichtbare Decke – über der Karte ist offener Himmel */
    if (lv.out && !lv._skyOpen) {
      lv._skyOpen = true;
      /* Geheimräume in der obersten Reihe behalten ihre Decke (sonst fällt man von oben hinein und sitzt hinter rissigen Wänden) */
      const secretTop = x => { const c = lv.cells[Math.floor(x / CW) + ",0"]; return c && c.kind === "secret"; };
      for (let x = 1; x < lv.W - 1; x++) if (lv.get(x, 0) === 1 && !secretTop(x)) lv.set(x, 0, 0);
      const g0 = lv.get; lv.get = (x, y) => (y < 0 && x >= 0 && x < lv.W ? 0 : g0(x, y));
      if (Z.cam.bounds) { Z.cam.bounds.y = -6 * T; Z.cam.bounds.h = lv.H * T + 6 * T; }
    }
    /* Türen auf Pfad- und Seitenverbindungen nach rechts */
    for (const k in lv.cells) {
      const c = lv.cells[k], r = lv.cells[(c.x + 1) + "," + c.y];
      if (!r || !c.need.R || c.need.R === "X" || c.need.R === "G" || r.kind === "secret" || Math.random() > 0.5) continue;
      const x = (c.x + 1) * CW, y0 = c.y * CH + 8;
      let ok = true; for (let y = y0; y <= y0 + 2; y++) if (lv.get(x, y) !== 0) ok = false;
      if (!W.solidT(lv.get(x, y0 + 3)) && !W.isPlat(x, y0 + 3)) ok = false;
      if (lv.doors.some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - (y0 + 2)) < 3)) ok = false;
      if (!ok) continue;
      for (let y = y0; y <= y0 + 2; y++) lv.set(x, y, 12);
      doors.push({ x, y0, open: 0, opening: false, cells: [c.x + "," + c.y, r.x + "," + r.y] });
    }
    /* Sackgassen belohnen */
    /* (die großen Karten planen ihre Nebenzweige selbst – lv.rewards/lv.feats, siehe erkundung.js; hier nur noch
       Sackgassen, für die dort nichts vorgesehen ist) */
    const inCell = (c, x, y) => Math.floor(x / CW) === c.x && Math.floor(y / CH) === c.y;
    const hasLoot = (c) => (Z.pickups || []).some(p => Math.floor(p.x / T / CW) === c.x && Math.floor(p.y / T / CH) === c.y && ["chest", "item", "scroll", "food", "cursed"].includes(p.kind)) ||
      (lv.rewards || []).some(r => inCell(c, r.x, r.y)) || (lv.feats || []).some(f => f.t !== "mouth" && f.t !== "lock" && inCell(c, f.x, f.y));
    const planned = !!lv.rewards;
    for (const k in lv.cells) {
      const c = lv.cells[k]; if (c === lv.startCell || c === lv.endCell) continue;
      const exits = ["L", "R", "U", "D"].filter(s => c.need[s] && c.need[s] !== "G").length;
      if ((planned ? exits <= 1 : (c.kind === "side" || c.kind === "secret" || exits <= 1)) && !hasLoot(c)) {
        for (let i = 0; i < 200; i++) {
          const x = c.x * CW + 2 + ((Math.random() * (CW - 4)) | 0), y = c.y * CH + 2 + ((Math.random() * (CH - 4)) | 0);
          if (!Z.standable(lv, x, y, 2) || (lv.reach && !lv.reach[y * lv.W + x] && c.kind !== "secret")) continue;
          const r = Math.random(), px = x * T + 8, py = (y + 1) * T - 2;
          if (r < 0.45) Z.spawnPickup("chest", px, py, { vx: 0, vy: 0 });
          else if (r < 0.65) Z.spawnPickup("scroll", px, py, { vx: 0, vy: 0 });
          else if (r < 0.85) Z.spawnPickup("food", px, py, { food: Z.R.pick(Z.FOOD), vx: 0, vy: 0 });
          else Z.spawnPickup("chest", px, py, { vx: 0, vy: 0 }); /* (lose Münzen flögen nach 2,5 s quer durchs Gebiet zum Spieler) */
          break;
        }
      }
    }
    const P = Z.player; if (P) reveal(P);
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };
  const cellOf = (x, y) => Math.floor(x / T / CW) + "," + Math.floor(y / T / CH);
  function reveal(P) { const k = cellOf(P.x + P.w / 2, P.y + P.h / 2); if (!seen.has(k)) { seen.add(k); fogT = 0; } if (k !== lastRoom) { lastRoom = k; enterRoom(k, P); } }
  /* ======================= Räume mit Funktion (welt.js assignRooms) =======================
     Beim ersten Betreten erscheint dezent der Raumname über Ezekiel (Stimmung, Priorität 0 – bei „Hinweise: wenige“ still);
     die Karte zeigt für gesehene Räume ein kleines Zeichen in der Raumfarbe. */
  let entered = new Set(), lastRoom = null, enterLv = null;
  function enterRoom(k, P) {
    const lv = Z.level; if (!lv || !lv.cells || lv.hub || lv.arena || lv.passage) return;
    if (enterLv !== lv) { enterLv = lv; entered = new Set(); entered.add(lv.startCell ? lv.startCell.x + "," + lv.startCell.y : ""); }
    if (entered.has(k)) return; entered.add(k);
    const c = lv.cells[k]; if (!c || !c.fn || !Z.roomFnDef) return;
    const d = Z.roomFnDef(lv.biome, c.fn); if (!d || !Z.ui || !Z.ui.notify) return;
    Z.ui.notify(U.esc ? U.esc(L(d.n)) : L(d.n), { prio: 0, ort: "welt", x: P.x + P.w / 2, y: P.y - 4, art: "pergament", dauer: 2200, key: "raum" + k });
  }
  Z.minimapExtra = function (g, ox, oy, scale, big, vw, vh) {
    const lv = Z.level; if (!lv || !lv.cells || lv.hub || lv.arena || lv.passage || !Z.roomFnDef) return;
    const fs = big ? Math.max(9, Math.min(14, scale * 5)) : 8;
    g.save(); g.font = "bold " + fs + "px serif"; g.textAlign = "center"; g.textBaseline = "middle";
    for (const k in lv.cells) {
      const c = lv.cells[k]; if (!c.fn || !seen.has(k) || c.kind === "secret" && !entered.has(k)) continue;
      const d = Z.roomFnDef(lv.biome, c.fn); if (!d || !d.ico) continue;
      const x = (c.x * CW + CW / 2 - ox) * scale, y = (c.y * CH + 3 - oy) * scale;
      if (x < -10 || y < -10 || x > vw * scale + 10 || y > vh * scale + 10) continue;
      g.fillStyle = "rgba(12,8,12,.7)"; g.beginPath(); g.arc(x, y, fs * 0.62, 0, 6.283); g.fill();
      g.fillStyle = d.col || "#d8c8a0"; g.fillText(d.ico, x, y + 0.5);
    }
    g.restore();
  };

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

  /* ======================= Sicht: was Ezekiel wirklich sehen kann =======================
     Sichtlinien von Ezekiels Augen aus: durch offene Räume, Durchgänge und offene Türen klar,
     hinter Wänden und geschlossenen Türen liegt Schatten. Schon Gesehenes bleibt gedämpft erkennbar,
     Unbekanntes liegt im Dunkel. Die Sichtweite hängt vom Gebiet ab. */
  let vis = null, mem = null, tvis = null, visLv = null, visT = 0, ofs = null, ofc = null, ofImg = null, seenRef = null, seenN = null;
  const blocks = v => v === 1 || v === 7 || v === 12;
  function sightRange(lv) {
    const B = Z.biome || {};
    let r = lv.out ? 30 : B.open === "cave" ? 15 : 21;
    if (B.dark > 0.6) r -= 3;
    if (Z.darkness > 0) r = Math.min(r, 10);
    return r;
  }
  function computeVis(lv, cam) {
    const P = Z.player; if (!P) return;
    const n = lv.W * lv.H;
    if (visLv !== lv) { visLv = lv; vis = new Float32Array(n); mem = new Uint8Array(n); tvis = new Float32Array(n); }
    if (seenRef !== seen) { seenRef = seen; seenN = new Set(); }
    tvis.fill(0);
    const ex = (P.x + P.w / 2) / T, ey = (P.y + 7) / T, R = sightRange(lv), R2 = R * R;
    const x0 = Math.max(0, Math.floor(cam.x / T) - 2), x1 = Math.min(lv.W - 1, Math.ceil((cam.x + cam.w) / T) + 2);
    const y0 = Math.max(0, Math.floor(cam.y / T) - 2), y1 = Math.min(lv.H - 1, Math.ceil((cam.y + cam.h) / T) + 2);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const cx = tx + 0.5, cy = ty + 0.5, dx = cx - ex, dy = cy - ey, d2 = dx * dx + dy * dy;
      if (d2 > R2) continue;
      const d = Math.sqrt(d2), steps = Math.ceil(d * 2.2);
      let ok = true;
      for (let s = 1; s < steps; s++) {
        const u = s / steps, sx = Math.floor(ex + dx * u), sy = Math.floor(ey + dy * u);
        if (sx === tx && sy === ty) break;
        if (blocks(lv.get(sx, sy))) { ok = false; break; }
      }
      if (!ok) continue;
      /* Optik (Grafik-Runde 6): weicher, länger auslaufender Rand (~45 % der Sichtweite, Smoothstep);
         Gedächtnis/Erkundung bleibt bei der alten Schwelle (fm), damit sich am Spiel nichts ändert */
      const u = d < R * 0.55 ? 0 : Math.min(1, (d - R * 0.55) / (R * 0.45)), f = 1 - u * u * (3 - 2 * u);
      const fm = d < R * 0.7 ? 1 : Math.max(0, 1 - (d - R * 0.7) / (R * 0.3));
      const i = ty * lv.W + tx; tvis[i] = f;
      if (fm > 0.25) { mem[i] = 1; const kn = Math.floor(tx / CW) * 4096 + Math.floor(ty / CH); if (!seenN.has(kn)) { seenN.add(kn); seen.add(Math.floor(tx / CW) + "," + Math.floor(ty / CH)); } }
    }
  }
  /* Sichtnebel als kleines Bild (eine Kachel = ein Pixel) aktualisieren; liefert die Lage in Kacheln */
  function fogImage(lv, cam) {
    const now = performance.now();
    if (now - visT > 70 || visLv !== lv) { visT = now; computeVis(lv, cam); }
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(lv.W - 1, Math.ceil((cam.x + cam.w) / T) + 1);
    const y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(lv.H - 1, Math.ceil((cam.y + cam.h) / T) + 1);
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (!(w > 0 && h > 0) || !isFinite(w + h)) return null; /* ungültige Kamera (NaN) nicht weiterreichen */
    if (!ofs) { ofs = document.createElement("canvas"); ofc = ofs.getContext("2d"); }
    if (ofs.width !== w || ofs.height !== h) { ofs.width = w; ofs.height = h; ofImg = null; }
    if (!ofImg) ofImg = ofc.createImageData(w, h);
    const D = ofImg.data;
    const memA = lv.out ? 0.38 : 0.52, unA = lv.out ? 0.7 : 0.88;
    for (let ty = y0; ty <= y1; ty++) {
      let o = (ty - y0) * w * 4, i = ty * lv.W + x0;
      for (let tx = x0; tx <= x1; tx++, i++, o += 4) {
        const v = vis[i] += (tvis[i] - vis[i]) * 0.18;
        D[o] = 22; D[o + 1] = 14; D[o + 2] = 10; /* warmes Sepia-Dunkel statt Kaltschwarz */ D[o + 3] = ((mem[i] ? memA : unA) * (1 - v) * 255 + 0.5) | 0;
      }
    }
    ofc.putImageData(ofImg, 0, 0);
    return { x0, y0, w, h };
  }
  const fogOn = lv => lv && !lv.hub && !lv.arena && !lv.passage && lv.cells;
  /* bevorzugt: direkt in die Lichtkarte (spart einen Vollbild-Durchgang) */
  let fogFrame = -1;
  if (Z.gfx.lightOver) Z.gfx.lightOver.push(function (l, X0, Y0, sx, sy) {
    const lv = Z.level; if (!fogOn(lv)) return;
    const cam = Z.cam, f = fogImage(lv, { x: X0, y: Y0, w: cam.w, h: cam.h }); if (!f) return;
    l.imageSmoothingEnabled = true; l.drawImage(ofs, (f.x0 * T - X0) * sx, (f.y0 * T - Y0) * sy, f.w * T * sx, f.h * T * sy);
    fogFrame = Z.gfx.frame;
  });
  function drawFog(c, cam, t) {
    const lv = Z.level; if (!fogOn(lv)) return;
    if (fogFrame === Z.gfx.frame && Z.gfx.lightMerged && Z.gfx.lightMerged()) return;
    const f = fogImage(lv, cam); if (!f) return;
    c.save(); c.imageSmoothingEnabled = true;
    c.drawImage(ofs, f.x0 * T, f.y0 * T, f.w * T, f.h * T);
    c.restore();
  }
  Z.sightAt = (px, py) => { const lv = Z.level; if (!lv || !vis || visLv !== lv) return 1; const i = Math.floor(py / T) * lv.W + Math.floor(px / T); return vis[i] || 0; };

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
      if (P.onGround || P.climbing || P.ledge || P.grapple) { if (P._wasAir && P.peakY != null && !P.climbing) landed(P); P.peakY = P.y; P._peak0 = null; P._wasAir = false; }
      else {
        /* Abfangen: ein Schwung nach oben mitten im Fall (Doppelsprung, Sprungfeder, Schwingen, Ösen-Abstoß …) setzt die
           Fallhöhe neu an – wer kurz vor dem Aufprall noch springt, fällt danach nur noch die Resthöhe */
        if (P._wasAir && P.peakY != null && (P._vyPrev || 0) > 60 && P.vy < -150) {
          if (P._peak0 == null || P.peakY < P._peak0) P._peak0 = P.peakY;
          P.peakY = P.y;
        }
        P._wasAir = true; P.peakY = Math.min(P.peakY == null ? P.y : P.peakY, P.y); if (P.vy < -100) P.peakY = Math.min(P.peakY, P.y);
      }
      P._vyPrev = P.vy;
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
    const h = P.y - P.peakY, h0 = P._peak0 != null ? P.y - P._peak0 : h; P._peak0 = null;
    if (h <= 12 * T && h0 > 12 * T && !P.plunge && !P._noFall) {
      /* abgefangen: ohne den Sprung wäre es ein harter Aufprall geworden – dezente Rückmeldung */
      FX.text(P.x + P.w / 2, P.y - 10, L(["Abgefangen!", "Caught it!"]), "#ffe08a");
      FX.burst(P.x + P.w / 2, P.y + P.h, 8, { col: Z.dustCol || "#8a7a70", sp: 70, ang: -Math.PI / 2, spread: 2.6, life: 0.4, size: 2.2, kind: "smoke" });
    }
    if (h <= 12 * T || P.plunge || P._noFall) return; /* größere Karten mit Türmen/Kellern: erst ab ~12 Kacheln */
    if (P.rollT > 0 || (P._rollPress && P.time - P._rollPress < 0.18)) { FX.text(P.x + P.w / 2, P.y - 10, L(["Abgerollt!", "Rolled!"]), "#ffe08a"); A.play("roll", { vol: 0.6 }); if (P.rollT <= 0) { P.rollT = 0.18; P.rollDir = P.face; } return; }
    /* milder als zuvor: in den Tiefen-Gebieten führt der Weg oft durch Schächte nach unten (Leitern sind da, aber Springen soll nicht ein Viertel des Lebens kosten) */
    const frac = Math.min(0.2, (h - 12 * T) / (T * 60) + 0.04);
    const n = Math.round(P.hpMax * frac);
    Z.hurtPlayer(n, { x: P.x, kb: 0, unblockable: true, hazard: true, force: true, fall: true });
    P.hurtT = 0.25; FX.addShake(6); A.play("land", { vol: 0.9, rate: 0.7 });
    /* beim ersten Aufprall einmalig erklären, wie man ihn vermeidet */
    if (Z.meta && !Z.meta.fallTip) { Z.meta.fallTip = 1; Z.saveMeta && Z.saveMeta(); const key = Z.input.label ? Z.input.label("roll") : "Rolle"; Z.toast && Z.toast("<b>" + L(["Tipp", "Tip"]) + "</b><br><small>" + L(["Kurz vor der Landung rollen (" + key + ") fängt den Sturz ab.", "Roll (" + key + ") just before landing to break the fall."]) + "</small>", 4200); }
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

  /* Gruben-Schutz: wer kurz nach einem Treffer aus einer Grube (Stacheln, Lava, Wasser) an derselben Stelle erneut
     hineingerät, nimmt nur halben Schaden – kein Mehrfach-Schaden beim Wiederherausklettern. Abgründe regeln das in
     kampf.js selbst, Boss-Flächen (ohne Grubenkachel) bleiben unberührt. */
  const hurt0 = Z.hurtPlayer;
  if (hurt0) Z.hurtPlayer = function (n, o) {
    const P = Z.player;
    if (P && o && (o.hazard || o.spike) && !o.fall && !o.trap && !o.attacker && !o.proj) {
      const cx = Math.floor((P.x + P.w / 2) / T), fy = Math.floor((P.y + P.h - 2) / T), my = Math.floor((P.y + P.h * 0.5) / T);
      const v = W.tile(cx, fy), v2 = W.tile(cx, my);
      if (v === 3 || v === 5 || v === 6 || v2 === 5 || v2 === 6) {
        /* Lavarinnen aus aufgelösten Löchern (welt.js resolvePits) brennen ohnehin nach – der Eintritt selbst etwas milder */
        const lv = Z.level;
        if (lv && lv.pitLog && (v === 5 || v2 === 5)) {
          if (lv._pitSet == null) { lv._pitSet = new Set(); for (const r of lv.pitLog) for (const i of r.trapTiles || []) lv._pitSet.add(i); }
          if (lv._pitSet.has(fy * lv.W + cx) || lv._pitSet.has(my * lv.W + cx)) n = Math.max(1, Math.round(n * 0.6));
        }
        const now = P.time || 0;
        if (P._pitT != null && now - P._pitT < 8 && Math.abs((P._pitX || 0) - P.x) < 96) n = Math.max(1, Math.round(n * 0.5));
        P._pitT = now; P._pitX = P.x;
      }
    }
    return hurt0.apply(this, [n].concat(Array.prototype.slice.call(arguments, 1)));
  };
  /* verkettet: Module, die sich vor ebenen.js einhängen, laufen weiter (zuerst) */
  const ebTick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) { if (ebTick0) ebTick0(dt); doorTick(dt); fallTick(dt); };
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) { if (dp0) dp0(c, t); drawDoors(c, t); };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) { if (al0) al0(c, cam, W2, H2, t); c.save(); drawFog(c, cam, t); c.restore(); };
  Z.fogSeen = () => seen;
})();
