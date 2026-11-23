/* Ezekiel – The Destroyer · Platz für Beute
   Gemeinsamer Helfer, damit Beute, Segenskugeln, Auslagen und Fundstücke nie in Wänden, Decken, Abgründen oder
   an unerreichbaren Stellen landen.
     Z.freeSpot(x, y, w, h, opts) → { x, y, moved } – nächstgelegene gültige Stelle für ein Ding der Größe w×h.
       x/y: Mitte unten (wie Pickups: Kasten x−w/2 … x+w/2, y−h … y). Gültig heißt: Kasten frei von festen Kacheln
       (auch Nebelgitter), und ein Stehplatz für Ezekiel in Benutzen-Reichweite (opts.r), der laut lv.reach erreichbar
       ist (Geheimräume, Runenkammern und Schatzkammern nur, wenn die Quelle schon dort liegt), nicht auf Stacheln,
       Lava, Wasser, über dem Abgrund oder im Wirkbereich einer Falle.
       opts: { r: Benutzen-Radius (24), loose: nur Kasten frei (für fallende Beute – die Physik bringt sie zu Boden),
               from: {x,y} Vorzugsrichtung (sonst Ezekiel), avoid: [{x,y}] Abstand halten (z. B. Nachbarkugel),
               dist: Mindestabstand zu avoid (20), maxR: Suchradius in Kacheln (14) }
       Gesucht wird in wachsendem Radius um die Stelle, bevorzugt zur Quelle/zu Ezekiel hin und mit Sichtlinie.
       Rückfall: Ezekiels Standplatz.
     Z.spotOK(x, y, w, h, opts) → true, wenn die Stelle schon passt.
     Z.unstickPickups() – Sicherheitsnetz: einmal pro Sekunde (über Z.unstickTick aus Z.updatePickups) werden liegende
       Beute, Segenskugeln, Auslage-Stücke und Runenfunde geprüft; festsitzende ploppen sanft an einen freien Platz. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, U = Z.U;
  const SOLID = v => v === 1 || v === 7 || v === 12;
  /* Boden für Ezekiel (Leiter, bröckelnde Stege und Fährstrecken zählen) und Boden, auf dem Beute liegen bleibt */
  const GROUND = v => v === 1 || v === 2 || v === 7 || v === 8 || v === 4 || v === 10 || v === 11;
  const restGround = (tx, ty) => { const v = tile(tx, ty); return v === 1 || v === 7 || v === 12 || v === 2 || v === 8 || (Z.world && Z.world.isPlat ? Z.world.isPlat(tx, ty) && v !== 10 : false); };
  const tile = (tx, ty) => (Z.world && Z.world.tile ? Z.world.tile(tx, ty) : 1);

  /* Sonderräume je Karte (Geheimraum, Runenkammer, Schatzkammer): dort ist lv.reach absichtlich lückenhaft */
  function specialCells(lv) {
    if (lv._platzSp && lv._platzSpN === (lv.runeGates || []).length) return lv._platzSp;
    const s = new Set();
    for (const k in lv.cells || {}) if (lv.cells[k] && lv.cells[k].kind === "secret") s.add(k);
    for (const g of lv.runeGates || []) if (g && g.cell) s.add(typeof g.cell === "string" ? g.cell : g.cell.x + "," + g.cell.y);
    for (const v of lv.secretsList || []) if (v && v.cell) s.add(v.cell);
    lv._platzSp = s; lv._platzSpN = (lv.runeGates || []).length;
    return s;
  }
  const cellKey = (tx, ty) => Math.floor(tx / (Z.CW || 24)) + "," + Math.floor(ty / (Z.CH || 14));

  /* Fallen-Wirkbereiche (wie fallen.js/Z.fallenClear, vereinfacht): [x0, x1, Bodenhöhe] – höchstens alle 0,5 s neu */
  let trapZ = [], trapT = -1, trapLv = null;
  function trapZones() {
    const now = performance.now();
    if (trapLv === Z.level && now - trapT < 500) return trapZ;
    trapLv = Z.level; trapT = now; trapZ = [];
    const PL = Z.TRAPPLACE || {};
    for (const tr of Z.fallen || []) {
      const at = PL[tr.k] || "boden", fy = tr.y != null && at !== "decke" && at !== "pendel" ? tr.y : tr.fy;
      if (!isFinite(fy)) continue;
      if (at === "wand") { const r = Math.min(tr.range || (tr.run || 6) * T, 7 * T); trapZ.push([tr.dir > 0 ? tr.wx : tr.wx - r, tr.dir > 0 ? tr.wx + r : tr.wx, fy]); }
      else if (tr.x0 != null) trapZ.push([tr.x0, tr.x1, fy]);
      else if (isFinite(tr.x)) { const w = at === "pendel" ? 3 * T : 22; trapZ.push([tr.x - w, tr.x + w, fy]); }
    }
    for (const tr of Z.traps || []) {
      if (tr.k === "feder") continue;
      if (tr.k === "pendel" && isFinite(tr.ax)) { trapZ.push([tr.ax - tr.len * 0.9, tr.ax + tr.len * 0.9, tr.ay + tr.len + 16]); continue; }
      const x = isFinite(tr.x) ? tr.x : null, y = isFinite(tr.y) && tr.y > 0 ? tr.y : null;
      if (x != null && y != null) trapZ.push([x - 20, x + 20, y]);
    }
    return trapZ;
  }
  const inTrap = (x, y) => { for (const z of trapZones()) if (x > z[0] - 8 && x < z[1] + 8 && Math.abs(y - z[2]) < 24) return true; return false; };

  /* Stehplatz für Ezekiel (Füße in Kachel tx,ty): frei, Kopf frei, Boden darunter, erreichbar, keine Gefahr */
  function standOK(lv, tx, ty, home) {
    if (tx < 0 || ty < 1 || tx >= lv.W || ty >= lv.H - 1) return false;
    const v = tile(tx, ty);
    if (!(v === 0 || v === 4) || SOLID(tile(tx, ty - 1))) return false;
    if (!GROUND(tile(tx, ty + 1)) && v !== 4) return false;
    if (lv.reach && lv.W && !lv.reach[ty * lv.W + tx]) {
      /* Sonderraum: nur wenn die Quelle schon im selben Raum liegt (Beute bleibt in ihrer Kammer, wandert nicht hinein) */
      const k = cellKey(tx, ty);
      if (!home || k !== home || !specialCells(lv).has(k)) return false;
    }
    return true;
  }
  function boxFree(x, y, w, h) {
    const x0 = Math.floor((x - w / 2 + 0.01) / T), x1 = Math.floor((x + w / 2 - 0.01) / T), y0 = Math.floor((y - h + 0.01) / T), y1 = Math.floor((y - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (SOLID(tile(tx, ty))) return false;
    return true;
  }
  /* Ein Stehplatz in Benutzen-Reichweite (dieselbe Abstandsformel wie findInteract: |dx| + 0,6·|dy|) */
  function reachableAt(lv, x, y, r, home) {
    const cx = Math.floor(x / T), cy = Math.floor((y - 1) / T), lim = r - 3;
    for (let ty = cy - 2; ty <= cy + 3; ty++) for (let tx = cx - 2; tx <= cx + 2; tx++) {
      const py = (ty + 1) * T, px = Math.max(tx * T + 6, Math.min(tx * T + 10, x));
      if (Math.abs(x - px) + Math.abs(y - py) * 0.6 >= lim) continue;
      if (standOK(lv, tx, ty, home) && !inTrap(px, py)) return true;
    }
    return false;
  }
  function spotOK(x, y, w, h, o) {
    const lv = Z.level; if (!lv || !isFinite(x) || !isFinite(y)) return false;
    o = o || {};
    if (x < 0 || y < 0 || x > lv.W * T || y > lv.H * T) return false;
    if (!boxFree(x, y, w || 8, h || 8)) return false;
    if (o.loose) return true;
    const home = o.home !== undefined ? o.home : cellKey(Math.floor(x / T), Math.floor((y - 1) / T));
    return reachableAt(lv, x, y, o.r || 24, home);
  }
  Z.spotOK = spotOK;

  function playerSpot() {
    const P = Z.player; if (!P) return null;
    return { x: P.x + P.w / 2, y: P.y + P.h, moved: true, fallback: true };
  }
  Z.freeSpot = function (x, y, w, h, o) {
    o = o || {}; w = w || 8; h = h || 8;
    const lv = Z.level; if (!lv) return { x, y, moved: false };
    if (!isFinite(x) || !isFinite(y)) { const ps = playerSpot(); if (ps) return ps; x = 0; y = 0; }
    const home = cellKey(Math.floor(x / T), Math.floor((y - 1) / T));
    const oo = { r: o.r, loose: o.loose, home };
    const avoidOK = (ax, ay) => !o.avoid || o.avoid.every(a => Math.abs(a.x - ax) >= (o.dist || 20) || Math.abs(a.y - ay) > 24);
    if (spotOK(x, y, w, h, oo) && avoidOK(x, y)) return { x, y, moved: false };
    const P = Z.player, from = o.from || (P ? { x: P.x + P.w / 2, y: P.y + P.h - 4 } : null);
    const maxR = o.maxR || 14, cx = Math.floor(x / T), cy = Math.floor((y - 1) / T), half = Math.ceil(w / 2 / T);
    const cand = [];
    for (let ty = Math.max(1, cy - maxR); ty <= Math.min(lv.H - 2, cy + maxR); ty++) for (let tx = Math.max(0, cx - maxR); tx <= Math.min(lv.W - 1, cx + maxR); tx++) {
      if (!standOK(lv, tx, ty, home) || !restGround(tx, ty + 1)) continue;
      /* Mitte der Kachel, bei breiten Dingen ggf. etwas versetzt, damit der Kasten passt */
      const ay = (ty + 1) * T;
      let ax = U.clamp(x, tx * T + Math.min(8, w / 2), tx * T + T - Math.min(8, w / 2));
      if (!boxFree(ax, ay, w, h)) { let ok = false; for (const dx of [-8, 8, -16, 16]) if (half && boxFree(ax + dx, ay, w, h)) { ax += dx; ok = true; break; } if (!ok) continue; }
      if (inTrap(ax, ay)) continue;
      if (!avoidOK(ax, ay)) continue;
      let c = Math.hypot(ax - x, (ay - y) * 1.15);
      if (from) c += 0.3 * Math.hypot(ax - from.x, ay - from.y);
      if (ay < y - 8) c += (y - 8 - ay) * 0.5; /* lieber hinab als hinauf (fällt natürlicher) */
      cand.push([c, ax, ay]);
    }
    if (cand.length) {
      cand.sort((a, b) => a[0] - b[0]);
      /* Sichtlinie von der Quelle bzw. von Ezekiel bevorzugen: nicht hinter die nächste Wand in einen anderen Gang */
      const W = Z.world, n = Math.min(cand.length, 10);
      let best = cand[0], bc = 1e9;
      for (let i = 0; i < n; i++) {
        const [c, ax, ay] = cand[i];
        let pen = 0;
        if (W && W.los) {
          const seeSrc = !boxFree(x, y, 2, 2) ? true : W.los(x, y - 6, ax, ay - 6);
          const seeP = from ? W.los(from.x, from.y - 6, ax, ay - 6) : false;
          if (!seeSrc && !seeP) pen = 120; else if (!seeSrc) pen = 30;
        }
        if (c + pen < bc) { bc = c + pen; best = cand[i]; }
      }
      return { x: best[1], y: best[2], moved: true };
    }
    if (maxR < 40) return Z.freeSpot(x, y, w, h, Object.assign({}, o, { maxR: 40 }));
    return playerSpot() || { x, y, moved: false };
  };
  /* Höhe, in der ein Interaktionsobjekt gezeichnet wird (Kugeln/Waren schweben bei y − h·0,62) */
  const objH = o => Math.min(32, (o.h || 30) * 0.62 + 5);
  /* Auslage (ui.js): erst die ganze Reihe verschieben, dann einzelne Stücke, die noch festsitzen */
  Z.placeAuslage = function (g) {
    const L = g && g.list; if (!L || !L.length || !Z.level) return;
    const bad = e => !spotOK(e.x, e.y, 10, objH(e), { r: e.r || 14 });
    if (!L.some(bad)) return;
    const n = L.length, sp = (g.o && g.o.abstand) || 24, cx = L.reduce((a, e) => a + e.x, 0) / n, cy = L[0].y;
    if (n > 1) {
      const s = Z.freeSpot(cx, cy, (n - 1) * sp + 12, objH(L[0]), { r: 14 });
      if (s.moved && !s.fallback) { L.forEach((e, i) => { e.x = s.x + (i - (n - 1) / 2) * sp; e.y = s.y; }); if (g.o) { g.o.x = s.x; g.o.y = s.y; } }
    }
    const done = [];
    for (const e of L) {
      if (bad(e) || done.some(a => Math.abs(a.x - e.x) < 18 && Math.abs(a.y - e.y) < 20)) {
        const s = Z.freeSpot(e.x, e.y, 10, objH(e), { r: e.r || 14, avoid: done, dist: 22 });
        e.x = s.x; e.y = s.y;
      }
      done.push(e);
    }
  };

  /* ======================= Sicherheitsnetz ======================= */
  const DIMS = { item: [12, 12], scroll: [12, 12], food: [12, 12], chest: [18, 14], cursed: [18, 14] };
  function pop(x0, y0, x1, y1) {
    const FX = Z.fx; if (!FX || !FX.burst) return;
    FX.burst(x1, y1 - 8, 8, { col: ["#ffd27a", "#fff0c0"], sp: 50, up: 30, life: 0.45, size: 1.4, kind: "glow", add: true });
    if (Math.hypot(x1 - x0, y1 - y0) > 24) FX.burst(x0, y0 - 4, 4, { col: "rgba(200,190,170,.6)", sp: 30, life: 0.3, size: 1.2 });
  }
  let acc = 0;
  Z.unstickTick = function (dt) { acc += dt; if (acc < 1) return; acc = 0; try { Z.unstickPickups(); } catch (e) { console.error(e); } };
  Z.unstickPickups = function () {
    const lv = Z.level; if (!lv || !Z.player) return 0;
    let n = 0;
    const bottom = lv.H * T;
    for (const p of Z.pickups || []) {
      const d = DIMS[p.kind]; if (!d || p.open || p.rack || p.held) continue;
      const w = p.w || d[0], h = p.h || d[1];
      if (!p.float) {
        /* fallende Beute: nur Kasten in der Wand sofort, sonst erst wenn sie liegt (oder ins Bodenlose fällt) */
        const stuck = !boxFree(p.x, p.y, w, h);
        const rests = restGround(Math.floor(p.x / T), Math.floor((p.y + 1) / T));
        const lost = p.y > bottom - 2 || (p.t > 5 && !rests);
        if (!stuck && !rests && !lost) continue;
        if (!stuck && !lost && spotOK(p.x, p.y, w, h, { r: 24 })) continue;
      } else if (spotOK(p.x, p.y, w, h, { r: 24 })) continue;
      const s = Z.freeSpot(p.x, Math.min(p.y, bottom - T), w, h, { r: 24 });
      if (!s.moved) continue;
      pop(p.x, p.y, s.x, s.y);
      p.x = s.x; p.y = s.y; p.vx = 0; p.vy = p.float ? 0 : -60; n++;
    }
    /* Segenskugeln, Auslage-Stücke (Kugeln, Waren) und Runenfunde */
    const ia = Z.interacts || [];
    for (const o of ia) {
      if (!(o.orb || o.auslage) || o.off || (o.ok && !o.ok())) continue;
      const r = o.auslage ? o.r || 14 : o.r || 26, h = objH(o);
      if (spotOK(o.x, o.y, 10, h, { r })) continue;
      const avoid = o.g ? o.g.list.filter(e => e !== o && !e.d.weg) : null;
      const s = Z.freeSpot(o.x, o.y, 10, h, { r, avoid, dist: 22 });
      if (!s.moved) continue;
      pop(o.x, o.y, s.x, s.y); o.x = s.x; o.y = s.y; n++;
    }
    const fs = Z.runen && Z.runen.finds ? Z.runen.finds() : [];
    for (const f of fs) {
      if (f.got || spotOK(f.x, f.y, 10, 16, { r: 20 })) continue;
      const s = Z.freeSpot(f.x, f.y, 10, 16, { r: 20 });
      if (s.moved) { pop(f.x, f.y, s.x, s.y); f.x = s.x; f.y = s.y; n++; }
    }
    return n;
  };
})();
