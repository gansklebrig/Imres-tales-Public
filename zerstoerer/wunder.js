/* Ezekiel – The Destroyer · Wunder der Feste
   Seltene, schöne, harmlose Augenblicke, die auch nach vielen Stunden noch überraschen. Höchstens eines zur selben Zeit,
   nur in ruhigen Momenten (kein Boss, keine wachen Gegner in der Nähe), nie über dem Spielgeschehen. Wird es unruhig,
   verabschiedet sich das Wunder sanft (die Katze springt davon, die Glühwürmchen stieben auseinander …).
   Seltenheit: häufig · selten · sehr selten. Jedes gesehene Wunder kommt in Barradins Fundbuch (Reiter „Wunder“),
   das erste Mal mit einer leisen Meldung „Neues Wunder: …“.
   Nur ab Grafikstufe „Mittel“ (Stufe 0 / Handheld: nichts davon, kein Mehraufwand).
   Prüfhilfe: Z.wunder.force("katze") · Z.wunder.list() · Z.wunder.stop(). Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, A = Z.audio, FX = Z.fx, L = v => Z.L(v), TAU = Math.PI * 2, PI = Math.PI;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = l => l[(Math.random() * l.length) | 0], clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = u => u * u * (3 - 2 * u);
  const mixHex = (a, b, t) => { const A = parseInt(a.slice(1), 16), B2 = parseInt(b.slice(1), 16), m = (x, y) => Math.round(x + (y - x) * t); return "rgb(" + m(A >> 16, B2 >> 16) + "," + m((A >> 8) & 255, (B2 >> 8) & 255) + "," + m(A & 255, B2 & 255) + ")"; };
  const on = () => { const q = Z.gq; if (!q) return true; if (q.lean) return false; return q.level === -1 ? q.layers !== false : q.level >= 1; };
  const rich = () => { const q = Z.gq; return !q || (q.level === -1 ? q.layers !== false : q.level >= 2); };
  const meta = () => (Z.meta.wunder = Z.meta.wunder || {});

  /* ---------- Klänge (Tierlaute, Glöckchen) ---------- */
  const AM = n => "amb/" + n + ".mp3";
  const SFX = { wKatze: [1, 2, 3, 4, 5, 6].map(i => AM("e_katze_" + i)), wSchnurr: [AM("a_schnurren")], wEule: [1, 2, 3, 4].map(i => AM("e_eule_" + i)), wVogel: [3, 5, 7, 9, 12, 15, 18, 21].map(i => AM("e_vogel_" + i)),
    wFluegel: [1, 2, 3].map(i => AM("e_fluegelschlag_" + i)), wGlocklein: [1, 2, 3].map(i => AM("e_glocklein_" + i)), wSchellen: [1, 2].map(i => AM("e_schellen_" + i)), wWal: [1, 2, 3].map(i => AM("e_wal_" + i)),
    wDrache: [AM("e_drachenbruellen_5")], wChor: [AM("a_geisterchor")], wSpuk: [2, 4].map(i => AM("e_spuk_" + i)), wSchale: [AM("a_klangschale")], wSpinne: [AM("e_spinne_1")] };
  if (A && A.SFX) for (const k in SFX) A.SFX[k] = SFX[k];
  const preload = k => { if (!A || !A.ok || !A.SFX[k]) return; for (const p of A.SFX[k]) if (A.buf && A.buf[p] === undefined && A.load) A.load(p); };
  const snd = (k, o) => { try { A.play(k, o); } catch (_) {} };
  /* kleine Melodie in der Tonart des Gebiets (Moll-Dreiklänge passen zu allen Gebietsskalen) */
  function tune(name, inst, notes, vol, oct) {
    const M = Z.music; if (!M || !M.defineMotif || !M.motif) return;
    M.defineMotif(name, { notes, inst, oct: oct || 0, vol: vol || 0.1 });
    M.motif(name, { quant: "schlag" });
  }

  /* ---------- Hilfen für die Welt ---------- */
  const solidV = v => v === 1 || v === 7, standV = v => v === 1 || v === 7 || v === 2 || v === 8 || v === 10;
  function floorY(x, y0, max) { const lv = Z.level, tx = Math.floor(x / T); let ty = Math.floor(y0 / T); for (let k = 0; k < (max || 14); k++, ty++) { const v = lv.get(tx, ty), u = lv.get(tx, ty - 1); if (standV(v) && !solidV(u)) return ty * T; } return null; }
  /* Boden unter einer Figur (Füße bei y): steckt sie im Fels, bis zu vier Kacheln hinauf, sonst hinab */
  function groundNear(x, y) {
    const lv = Z.level, tx = Math.floor(x / T); let ty = Math.floor((y - 1) / T);
    for (let k = 0; k < 4 && solidV(lv.get(tx, ty)); k++) ty--;
    if (solidV(lv.get(tx, ty))) return null;
    for (let k = 0; k < 24; k++, ty++) if (standV(lv.get(tx, ty + 1))) return (ty + 1) * T;
    return null;
  }
  const skyAt = (tx, ty) => { const lv = Z.level, s = Z.gfx.sky; return !!(s && s[ty * lv.W + tx]); };
  const wallFree = (tx, ty) => { const lv = Z.level; return tx > 0 && ty > 0 && tx < lv.W - 1 && ty < lv.H - 1 && lv.get(tx, ty) === 0 && !skyAt(tx, ty) && !(Z.gfx.isOpen && Z.gfx.isOpen(tx, ty)); };
  const airFree = (tx, ty) => { const lv = Z.level; return tx > 0 && ty > 0 && tx < lv.W - 1 && ty < lv.H - 1 && lv.get(tx, ty) === 0 && !skyAt(tx, ty); };
  /* freie Wandstelle im Bild nahe (cx, cy); f(tx, ty) zusätzliche Bedingung */
  function wallSpot(cx, cy, rx, ry, f, tries) {
    for (let i = 0; i < (tries || 160); i++) {
      const tx = Math.floor((cx + rnd(-rx, rx)) / T), ty = Math.floor((cy + rnd(-ry, ry)) / T);
      if (wallFree(tx, ty) && inCam(tx * T + 8, ty * T + 8, -12) && (!f || f(tx, ty))) return { tx, ty, x: tx * T + T / 2, y: ty * T + T / 2 };
    }
    return null;
  }
  /* sichtbare Öffnungen (Fenster, Höhlenlöcher, freier Himmel) im Bild: Mittelpunkt und Ausdehnung in Weltkoordinaten */
  function viewHole() {
    const lv = Z.level, cam = Z.cam; if (!lv) return null;
    const tx0 = Math.max(0, Math.floor(cam.x / T)), tx1 = Math.min(lv.W - 1, Math.floor((cam.x + cam.w) / T)), ty0 = Math.max(0, Math.floor(cam.y / T)), ty1 = Math.min(lv.H - 1, Math.floor((cam.y + cam.h) / T));
    let n = 0, sx = 0, sy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, best = -1, ry = 0, rx = 0, rr = 0; const cy = cam.y + cam.h * 0.45;
    for (let ty = ty0; ty <= ty1; ty++) { let run = 0, rb = 0, rc = 0;
      for (let tx = tx0; tx <= tx1 + 1; tx++) {
        const open = tx <= tx1 && lv.get(tx, ty) === 0 && (skyAt(tx, ty) || (Z.gfx.isOpen && Z.gfx.isOpen(tx, ty)));
        if (open) { n++; run++; const x = tx * T + 8, y = ty * T + 8; sx += x; sy += y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        else if (run) { if (run > rb) { rb = run; rc = (tx - run / 2) * T; } run = 0; }
      }
      /* längstes offenes Stück einer Zeile (nahe der Bildmitte bevorzugt) */
      const sc = rb - Math.abs(ty * T + 8 - cy) / 40; if (rb >= 3 && sc > best) { best = sc; ry = ty * T + 8; rx = rc; rr = rb; } }
    if (n < 6 || best < 0) return null;
    return { n, x: sx / n, y: sy / n, x0, x1, y0, y1, rx, ry, run: rr };
  }
  const P = () => Z.player, pc = () => { const p = Z.player; return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; };
  const inCam = (x, y, m) => { const c = Z.cam; m = m || 0; return x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m; };
  const glowSpr = col => Z.glowSprite(col);
  function glow(c, x, y, r, col, a) { if (a <= 0.01 || r <= 0) return; const ga = c.globalAlpha; c.globalAlpha = ga * Math.min(1, a); c.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); c.globalAlpha = ga; }
  function calm() {
    const p = Z.player; if (!p || p.dead || !Z.level) return false;
    if (Z.boss && !Z.bossDefeated) return false;
    if (Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive)) return false;
    for (const e of Z.enemies) if (!e.dead && e.aware && Math.abs(e.x - p.x) < 280 && Math.abs(e.y - p.y) < 160) return false;
    return true;
  }
  const ctx = () => {
    const lv = Z.level || {}, B = Z.biome || {}, zt = Z.zeit ? Z.zeit() : null, W = Z.wetter ? Z.wetter() : null;
    const area = lv.hub ? "lager" : lv.passage ? "passage" : lv.arena ? "arena" : lv.biome || lv.id || "";
    const back = (!Z.gq || Z.gq.layers !== false) && !!(B.open || lv.out || lv.hub || lv.arena);
    return { lv, B, bg: B.bg || "", area, out: !!(lv.out || lv.hub), back, zt, night: !zt || zt.k === "nacht" || zt.k === "blut", hour: zt ? zt.k : "nacht", mood: W ? W.mood : "", W };
  };

  /* ======================= DIE WUNDER ======================= */
  /* tier: 0 häufig · 1 selten · 2 sehr selten. where(k): darf hier erscheinen. start(s, k): einrichten (false = geht hier nicht).
     tick(s, dt): false = vorbei. back/mid/front(c, s, t): zeichnen (Weltkoordinaten). at(s): Punkt fürs „Gesehen“. */
  const DEFS = [];
  const def = o => DEFS.push(o);
  const OUTB = { castle: 1, ramparts: 1, harbour: 1, spires: 1, storm: 1, camp: 1 };

  /* ---- 1. Glühwürmchen-Reigen ---- */
  def({ id: "gluehwuermchen", tier: 0, n: ["Glühwürmchen-Reigen", "Firefly round"], hint: ["draußen und am See", "outdoors and by the lake"],
    d: ["Ein Schwarm Glühwürmchen umkreist Ezekiel, als wäre er ein Lagerfeuer.", "A swarm of fireflies circles Ezekiel as if he were a campfire."],
    where: k => k.out || k.bg === "lake" || k.bg === "chasm" || k.area === "passage",
    start(s) { const p = pc(); s.f = []; for (let i = 0; i < 16; i++) s.f.push({ a: rnd(0, TAU), r: rnd(14, 34), sp: rnd(0.6, 1.3) * (Math.random() < 0.5 ? -1 : 1), y: rnd(-18, 12), ph: rnd(0, TAU), x: p.x + rnd(-260, 260), yy: p.y + rnd(-120, 60) }); s.life = 16; },
    tick(s, dt) { const p = pc(), u = s.t / s.life; for (const f of s.f) { f.a += f.sp * dt; const tx = p.x + Math.cos(f.a) * f.r * (1.2 + Math.sin(s.t * 0.7 + f.ph) * 0.3), ty = p.y + f.y + Math.sin(f.a * 1.3 + f.ph) * 8; const k = s.leave || u > 0.85 ? -0.6 : 1.6; if (k > 0) { f.x += (tx - f.x) * Math.min(1, dt * k); f.yy += (ty - f.yy) * Math.min(1, dt * k); } else { f.x += Math.cos(f.ph) * 40 * dt; f.yy -= 18 * dt; } } return s.t < s.life; },
    front(c, s, t) { c.globalCompositeOperation = "lighter"; const fade = Math.min(1, s.t / 2) * Math.min(1, (s.life - s.t) / 2.5); for (const f of s.f) { const bl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 + f.ph * 3)); glow(c, f.x, f.yy, 7, "rgba(214,255,110,1)", 0.55 * bl * fade); c.globalAlpha = fade * bl; c.fillStyle = "#f4ffc0"; c.fillRect(f.x - 0.5, f.yy - 0.5, 1, 1); c.globalAlpha = 1; } },
    at: s => s.f[0] && { x: s.f[0].x, y: s.f[0].yy } });

  /* ---- 2. Mondmotten ---- */
  def({ id: "motten", tier: 0, n: ["Motten im Fackelschein", "Moths in the torchlight"], hint: ["wo Fackeln brennen", "where torches burn"],
    d: ["Blasse Motten tanzen um eine Flamme und werfen riesige Schatten an die Wand.", "Pale moths dance around a flame and cast giant shadows on the wall."],
    where: k => !k.out && !!(k.lv.lights || []).length,
    start(s) { const p = pc(); let best = null, bd = 1e9; for (const d of Z.level.lights || []) { if (!(d.kind === "torch" || d.kind === "candle" || d.kind === "candelabra" || d.kind === "brazier" || d.kind === "lantern")) continue; const x = d.x * T + 8, y = d.y * T + (d.kind === "torch" ? -6 : 0), dd = Math.hypot(x - p.x, y - p.y); if (dd < bd && inCam(x, y, -20)) { bd = dd; best = { x, y }; } } if (!best) return false; s.c = best; s.m = []; for (let i = 0; i < 7; i++) s.m.push({ a: rnd(0, TAU), r: rnd(5, 15), sp: rnd(2.5, 5) * (Math.random() < 0.5 ? -1 : 1), ph: rnd(0, TAU), e: rnd(0.5, 0.9) }); s.life = 22; },
    tick(s) { return s.t < s.life; },
    mid(c, s, t) {
      const fade = Math.min(1, s.t / 2) * Math.min(1, (s.life - s.t) / 2);
      for (const m of s.m) {
        const a = m.a + t * m.sp + Math.sin(t * 3 + m.ph) * 0.8, x = s.c.x + Math.cos(a) * m.r * (1 + 0.3 * Math.sin(t * 1.7 + m.ph)), y = s.c.y - 6 + Math.sin(a) * m.r * m.e + Math.sin(t * 5 + m.ph) * 2;
        /* riesiger Schatten an der Wand hinter der Flamme */
        const dx = x - s.c.x, dy = y - s.c.y, w = Math.abs(Math.sin(t * 26 + m.ph)), sx = s.c.x + dx * 3.4, sy = s.c.y + dy * 3.4;
        /* Schatten an der Wand: groß, weich, flatternd */
        c.globalAlpha = 0.2 * fade; c.fillStyle = "#000"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 8, sy - 6 * w - 1); c.lineTo(sx - 5, sy + 2); c.lineTo(sx, sy + 1); c.lineTo(sx + 5, sy + 2); c.lineTo(sx + 8, sy - 6 * w - 1); c.closePath(); c.fill();
        c.globalAlpha = 0.85 * fade; c.fillStyle = "#c8b8a0"; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 1.6 * w - 0.3); c.lineTo(x - 1.3, y + 0.6); c.closePath(); c.moveTo(x, y); c.lineTo(x + 2, y - 1.6 * w - 0.3); c.lineTo(x + 1.3, y + 0.6); c.closePath(); c.fill(); c.fillStyle = "#5a4a3a"; c.fillRect(x - 0.3, y - 0.6, 0.6, 1.6);
      }
      c.globalAlpha = 1;
    }, at: s => s.c });

  /* ---- 3. Die Burgkatze ---- */
  const COATS = [["#6a625e", "#4a4440", "#8a827c"], ["#b0602a", "#8a4418", "#d0884a"], ["#1e1a1c", "#141012", "#3a3436"], ["#d8d0c8", "#a8a098", "#f0ece4"], ["#c89a6a", "#3a2a22", "#ece0d0"]];
  def({ id: "katze", tier: 0, n: ["Die Burgkatze", "The castle cat"], hint: ["fast überall", "almost everywhere"],
    d: ["Eine Katze kommt aus dem Nichts, streicht Ezekiel um die Beine und folgt ihm ein Stück. Dann hat sie Wichtigeres zu tun.", "A cat appears from nowhere, rubs against Ezekiel's legs and follows him a while. Then she has more important things to do."],
    where: k => k.bg !== "embercity" && k.area !== "arena",
    start(s) { const p = Z.player, side = Math.random() < 0.5 ? -1 : 1, x = p.x + p.w / 2 + side * (Z.cam.w * 0.55), y = floorY(x, p.y - 10, 16); if (y == null) return false; s.x = x; s.y = y; s.vy = 0; s.face = -side; s.coat = pick(COATS); s.life = 26; s.walk = 0; s.sit = 0; s.purr = 0; preload("wKatze"); preload("wSchnurr"); setTimeout(() => snd("wKatze", { vol: 0.28, x: s.x }), 900); },
    tick(s, dt) {
      const p = Z.player, px = p.x + p.w / 2, leaving = s.leave || s.t > s.life - 5;
      const tx = leaving ? px + s.face * 600 : px - (p.face || 1) * 18, d = tx - s.x;
      if (leaving && !s.bye) { s.bye = 1; s.face = Math.sign(s.x - px) || 1; }
      const sp = leaving ? 95 : Math.abs(d) > 60 ? 80 : Math.abs(d) > 8 ? 34 : 0;
      if (sp) { s.face = Math.sign(d) || s.face; s.x += s.face * sp * dt; s.walk += dt * sp * 0.25; s.sit = Math.max(0, s.sit - dt * 3); } else { s.sit = Math.min(1, s.sit + dt * 1.5); if (!s.purr && s.sit > 0.9 && Math.abs(s.x - px) < 30) { s.purr = 1; snd("wSchnurr", { vol: 0.22, x: s.x }); } }
      /* Boden folgen: Stufen hinauf hüpft sie, über Kanten springt sie hinab */
      const gy = groundNear(s.x, s.y);
      if (gy != null) { if (gy < s.y) { s.y += (gy - s.y) * Math.min(1, dt * 14); s.vy = 0; } else { s.vy += 700 * dt; s.y = Math.min(gy, s.y + s.vy * dt); if (s.y >= gy) s.vy = 0; } }
      if (!leaving && Math.abs(s.x - px) > 420) s.x = px - Math.sign(px - s.x) * 400;
      return s.t < s.life && !(leaving && !inCam(s.x, s.y, 60));
    },
    mid(c, s, t) {
      const [col, dk, lt] = s.coat, x = s.x, y = s.y, f = s.face, st = s.sit, wk = st > 0.5 ? 0 : Math.sin(s.walk * 2.4);
      c.save(); c.translate(x, y); c.scale(f, 1);
      c.globalAlpha = 0.35; c.fillStyle = "#000"; c.beginPath(); c.ellipse(0, 0, 7, 1.2, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
      /* Schwanz */
      c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-5, -4 + st * 2); const sw = Math.sin(t * 2.3) * 3; c.quadraticCurveTo(-10, -6 - st, -9 + sw * 0.5, -11 - st * 2 + sw * 0.4); c.stroke();
      /* Beine */
      c.fillStyle = dk; if (st < 0.5) { c.fillRect(-4 + wk, -3, 1.3, 3); c.fillRect(3 - wk, -3, 1.3, 3); c.fillStyle = col; c.fillRect(-3 - wk, -3, 1.3, 3); c.fillRect(4 + wk, -3, 1.3, 3); } else { c.fillStyle = col; c.fillRect(2.5, -3, 1.3, 3); c.fillRect(4, -3, 1.3, 3); }
      /* Körper (sitzend aufgerichtet) */
      c.fillStyle = col; c.beginPath(); if (st < 0.5) c.ellipse(0, -5, 6, 2.8, 0, 0, TAU); else c.ellipse(-0.5, -5.5, 4.5, 4, -0.5, 0, TAU); c.fill();
      c.fillStyle = lt; c.beginPath(); c.ellipse(st < 0.5 ? 1 : 1.5, st < 0.5 ? -3.6 : -4, 3, 1.3, 0, 0, TAU); c.fill();
      if (s.coat === COATS[0] || s.coat === COATS[1]) { c.strokeStyle = dk; c.lineWidth = 0.6; c.beginPath(); for (let k = -2; k <= 2; k++) { c.moveTo(k * 1.8 - 0.5, -7.6 + st); c.lineTo(k * 1.8, -5.6 + st); } c.stroke(); }
      /* Kopf */
      const hy = st < 0.5 ? -7 : -10, hx = st < 0.5 ? 5.5 : 3.5, nod = Math.sin(t * 1.3) * 0.4;
      c.fillStyle = col; c.beginPath(); c.arc(hx, hy + nod, 2.6, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(hx - 2.2, hy - 1 + nod); c.lineTo(hx - 1.6, hy - 4.2 + nod); c.lineTo(hx - 0.2, hy - 2 + nod); c.moveTo(hx + 0.4, hy - 2 + nod); c.lineTo(hx + 1.6, hy - 4.4 + nod); c.lineTo(hx + 2.4, hy - 1 + nod); c.fill();
      c.fillStyle = "#e88a9a"; c.fillRect(hx - 1.4, hy - 3 + nod, 0.6, 0.8); c.fillRect(hx + 1.4, hy - 3.2 + nod, 0.6, 0.8);
      c.fillStyle = "#d0e050"; const blink = (t % 4) < 0.15; if (!blink) { c.fillRect(hx + 0.3, hy - 0.6 + nod, 0.8, 0.8); c.fillRect(hx + 1.7, hy - 0.6 + nod, 0.7, 0.8); }
      c.fillStyle = "#e88a9a"; c.fillRect(hx + 2.3, hy + 0.6 + nod, 0.5, 0.5);
      c.restore();
    },
    front(c, s, t) { /* Augen leuchten im Dunkeln */ if ((t % 4) < 0.15) return; const hy = s.sit < 0.5 ? -7 : -10, hx = (s.sit < 0.5 ? 5.5 : 3.5) * s.face; c.globalCompositeOperation = "lighter"; glow(c, s.x + hx + s.face * 1, s.y + hy, 3, "rgba(220,240,90,1)", 0.25); },
    at: s => ({ x: s.x, y: s.y - 6 }) });

  /* ---- 4. Blütenregen ---- */
  def({ id: "blueten", tier: 0, n: ["Blütenregen", "Rain of petals"], hint: ["unter freiem Himmel und in den Hallen", "under open sky and in the halls"],
    d: ["Von irgendwo weht ein Schauer Blütenblätter herab. Hier oben blüht nichts. Eigentlich.", "From somewhere a shower of petals drifts down. Nothing blooms up here. Supposedly."],
    where: k => k.out || k.bg === "halls" || k.bg === "castle" || k.bg === "ramparts",
    start(s) { s.p = []; s.life = 15; s.col = pick([["#f2b8c8", "#ffe0e8", "#e07a98"], ["#fff0f0", "#f8d8e0", "#ffffff"], ["#c83a48", "#e85a68", "#a02a38"], ["#f0d070", "#ffe8a0", "#e8a040"]]); s.acc = 0; },
    tick(s, dt) {
      const cam = Z.cam, wind = (Z.windX || 0) * 0.4 + 10; s.acc += dt * (s.t < s.life - 4 && !s.leave ? 9 : 0);
      while (s.acc > 1 && s.p.length < 80) { s.acc--; s.p.push({ x: cam.x + rnd(-40, cam.w), y: cam.y - 6, vy: rnd(10, 18), ph: rnd(0, TAU), r: rnd(0, TAU), vr: rnd(-2, 2), s: rnd(1.2, 2.2), c: pick(s.col) }); }
      for (const q of s.p) { q.y += q.vy * dt; q.x += (wind + Math.sin(s.t * 1.3 + q.ph) * 14) * dt; q.r += q.vr * dt; }
      s.p = s.p.filter(q => q.y < cam.y + cam.h + 10); return s.t < s.life || s.p.length > 0;
    },
    mid(c, s, t) { for (const q of s.p) { c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + q.ph))); c.fillStyle = q.c; c.beginPath(); c.ellipse(0, 0, q.s, q.s * 0.6, 0, 0, TAU); c.fill(); c.restore(); } },
    at: s => s.p[0] });

  /* ---- 5. Die Eule ---- */
  def({ id: "eule", tier: 0, n: ["Die Eule", "The owl"], hint: ["unter freiem Himmel, nachts", "under open sky, at night"],
    d: ["Eine Eule landet auf einem Mauervorsprung und dreht den Kopf mit, wohin Ezekiel auch geht.", "An owl lands on a ledge and turns its head to follow wherever Ezekiel goes."],
    where: k => (k.out || OUTB[k.bg] || k.B.open === "arch") && k.night,
    start(s) {
      const p = pc(), lv = Z.level; let spot = null;
      for (let i = 0; i < 200 && !spot; i++) { const tx = Math.floor((p.x + rnd(-170, 170)) / T), ty = Math.floor((p.y + rnd(-110, 10)) / T); if (Math.abs(tx * T - p.x) < 50) continue; if (lv.get(tx, ty) === 0 && lv.get(tx, ty - 1) === 0 && standV(lv.get(tx, ty + 1)) && inCam(tx * T, ty * T, -30)) spot = { x: tx * T + 8, y: (ty + 1) * T }; }
      if (!spot) return false; s.to = spot; const side = Math.random() < 0.5 ? -1 : 1; s.x = spot.x + side * 260; s.y = spot.y - 160; s.mode = "in"; s.look = 0; s.life = 30; preload("wEule"); preload("wFluegel");
    },
    tick(s, dt) {
      const p = pc();
      if (s.mode === "in") { const dx = s.to.x - s.x, dy = s.to.y - s.y, d = Math.hypot(dx, dy); s.face = Math.sign(dx) || 1; if (d < 3) { s.mode = "sit"; s.x = s.to.x; s.y = s.to.y; snd("wFluegel", { vol: 0.2, x: s.x }); setTimeout(() => snd("wEule", { vol: 0.3, x: s.x }), 1400); } else { const v = Math.min(d, 110 * dt + d * dt * 0.8); s.x += dx / d * v; s.y += dy / d * v; } }
      else if (s.mode === "sit") { const want = clamp((p.x - s.x) / 60, -1, 1); s.look += (want - s.look) * Math.min(1, dt * 3); if (s.leave || s.t > s.life || Math.hypot(p.x - s.x, p.y - s.y) < 34) { s.mode = "out"; s.vx = (Math.sign(s.x - p.x) || 1) * 90; s.face = Math.sign(s.vx); snd("wFluegel", { vol: 0.25, x: s.x }); } }
      else { s.x += s.vx * dt; s.y -= 70 * dt; s.vx *= 1 + dt * 0.5; return inCam(s.x, s.y, 40); }
      return true;
    },
    mid(c, s, t) {
      const fly = s.mode !== "sit", x = s.x, y = s.y;
      c.save(); c.translate(x, y);
      if (fly) { const w = Math.sin(t * 16); c.scale(s.face || 1, 1); c.fillStyle = "#5a4430"; c.beginPath(); c.ellipse(0, -5, 3.5, 2.6, 0, 0, TAU); c.fill(); c.fillStyle = "#7a5e40"; c.beginPath(); c.moveTo(-1, -6); c.quadraticCurveTo(-6, -8 - w * 6, -12, -5 - w * 7); c.quadraticCurveTo(-6, -4, -1, -4); c.moveTo(1, -6); c.quadraticCurveTo(-2, -10 - w * 5, -7, -8 - w * 6); c.lineTo(1, -4); c.fill(); c.fillStyle = "#e8b040"; c.fillRect(2, -6.5, 0.9, 0.9); c.restore(); return; }
      c.globalAlpha = 0.3; c.fillStyle = "#000"; c.beginPath(); c.ellipse(0, 0, 4, 1, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
      /* Körper */
      c.fillStyle = "#6a5038"; c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(5, -12, 5, -3, 3, 0); c.lineTo(-3, 0); c.bezierCurveTo(-5, -3, -5, -12, 0, -12); c.fill();
      c.fillStyle = "#c8b090"; c.beginPath(); c.ellipse(0, -4.5, 2.4, 3.6, 0, 0, TAU); c.fill(); c.strokeStyle = "rgba(90,70,50,.7)"; c.lineWidth = 0.4; c.beginPath(); for (let k = 0; k < 3; k++) { c.moveTo(-1.4, -6.5 + k * 1.6); c.lineTo(-0.6, -5.9 + k * 1.6); c.moveTo(0.6, -6.5 + k * 1.6); c.lineTo(1.4, -5.9 + k * 1.6); } c.stroke();
      c.fillStyle = "#3a2a1c"; c.fillRect(-2, 0, 1, 1.4); c.fillRect(1, 0, 1, 1.4);
      /* Kopf mit Gesichtsschleier, dreht sich mit */
      const lx = s.look * 1.4, blink = (t % 5.3) < 0.18;
      c.fillStyle = "#6a5038"; c.beginPath(); c.arc(0, -12, 4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-3.6, -14); c.lineTo(-3.2, -17.4); c.lineTo(-1.6, -15); c.moveTo(3.6, -14); c.lineTo(3.2, -17.4); c.lineTo(1.6, -15); c.fill();
      c.fillStyle = "#d8c4a0"; c.beginPath(); c.ellipse(lx - 1.5, -12, 1.8, 2, 0, 0, TAU); c.ellipse(lx + 1.5, -12, 1.8, 2, 0, 0, TAU); c.fill();
      if (!blink) { c.fillStyle = "#f0a030"; c.beginPath(); c.arc(lx - 1.5, -12, 1.1, 0, TAU); c.arc(lx + 1.5, -12, 1.1, 0, TAU); c.fill(); c.fillStyle = "#140c08"; c.fillRect(lx - 1.9, -12.4, 0.8, 0.8); c.fillRect(lx + 1.1, -12.4, 0.8, 0.8); }
      else { c.strokeStyle = "#3a2a1c"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(lx - 2.5, -12); c.lineTo(lx - 0.5, -12); c.moveTo(lx + 0.5, -12); c.lineTo(lx + 2.5, -12); c.stroke(); }
      c.fillStyle = "#c89040"; c.beginPath(); c.moveTo(lx - 0.5, -11); c.lineTo(lx + 0.5, -11); c.lineTo(lx, -9.6); c.fill();
      c.restore();
    },
    front(c, s, t) { if (s.mode !== "sit" || (t % 5.3) < 0.18) return; c.globalCompositeOperation = "lighter"; glow(c, s.x + s.look * 1.4, s.y - 12, 5, "rgba(255,180,60,1)", 0.22); },
    at: s => ({ x: s.x, y: s.y - 8 }) });

  /* ---- 6. Schmetterlingsschwarm ---- */
  const WINGS = [["#f0a030", "#5a2a10"], ["#f8e070", "#6a4a10"], ["#e8e0d4", "#4a3a30"], ["#c070d0", "#3a1a40"], ["#e85a3a", "#2a1010"]];
  def({ id: "schmetterlinge", tier: 1, n: ["Schmetterlingsschwarm", "Butterfly swarm"], hint: ["unter freiem Himmel, gern nach Regen", "under open sky, best after rain"],
    d: ["Ein Schwarm Schmetterlinge zieht durch den Hof. Einer ruht sich auf Ezekiels Horn aus – er merkt es nicht.", "A swarm of butterflies drifts through the yard. One rests on Ezekiel's horn – he doesn't notice."],
    where: k => k.out && k.bg !== "spires",
    start(s) { const cam = Z.cam, side = Math.random() < 0.5 ? -1 : 1; s.b = []; for (let i = 0; i < 11; i++) s.b.push({ x: side < 0 ? cam.x - rnd(10, 160) : cam.x + cam.w + rnd(10, 160), y: cam.y + cam.h * rnd(0.25, 0.75), ph: rnd(0, TAU), w: pick(WINGS), sp: rnd(28, 44), land: i === 0 ? 1 : 0, lt: 0 }); s.dir = -side; s.life = 24; },
    tick(s, dt) {
      const p = Z.player, cam = Z.cam;
      for (const b of s.b) {
        if (b.land === 1 && s.t > 3 && s.t < 15 && !s.leave) { const hx = p.x + p.w / 2 + (p.face || 1) * 3, hy = p.y - 3; b.x += (hx - b.x) * Math.min(1, dt * 2); b.y += (hy - b.y) * Math.min(1, dt * 2); b.lt += dt; if (Math.hypot(hx - b.x, hy - b.y) < 1.5) b.sit = 1; else b.sit = 0; if (Math.abs(p.vx) > 140 || p.rollT > 0) { b.land = 2; b.sit = 0; } continue; }
        b.sit = 0; b.x += (s.dir * b.sp + Math.sin(s.t * 2 + b.ph) * 18) * dt; b.y += Math.sin(s.t * 3.1 + b.ph * 2) * 22 * dt - (s.leave ? 30 * dt : 0);
      }
      return s.t < s.life && s.b.some(b => inCam(b.x, b.y, 200));
    },
    mid(c, s, t) {
      for (const b of s.b) {
        const fl = b.sit ? 0.25 + 0.2 * Math.sin(t * 2) : Math.abs(Math.sin(t * 14 + b.ph)); c.save(); c.translate(b.x, b.y); c.scale(b.sit ? 1 : s.dir, 1);
        c.fillStyle = b.w[0]; c.save(); c.scale(Math.max(0.12, fl), 1); c.beginPath(); c.ellipse(-1.6, -1.2, 2, 1.6, -0.5, 0, TAU); c.ellipse(1.6, -1.2, 2, 1.6, 0.5, 0, TAU); c.fill(); c.fillStyle = b.w[1]; c.beginPath(); c.ellipse(-1.2, 0.8, 1.2, 1, 0.3, 0, TAU); c.ellipse(1.2, 0.8, 1.2, 1, -0.3, 0, TAU); c.fill(); c.fillStyle = "rgba(255,255,240,.6)"; c.fillRect(-2.2, -1.8, 0.6, 0.6); c.fillRect(1.8, -1.8, 0.6, 0.6); c.restore();
        c.fillStyle = "#2a1a10"; c.fillRect(-0.3, -2, 0.6, 3.6); c.restore();
      }
    }, at: s => s.b[1] });

  /* ---- 7. Sternschnuppenregen ---- */
  def({ id: "sternschnuppen", tier: 1, n: ["Sternschnuppenregen", "Meteor shower"], hint: ["nachts, durch Fenster und unter freiem Himmel", "at night, through windows and under open sky"],
    d: ["Der Himmel regnet Sterne. Für ein paar Atemzüge ist selbst die Feste still.", "The sky rains stars. For a few breaths even the keep is quiet."],
    where: k => k.back && (k.out || k.B.open === "arch") && k.night && k.mood !== "regen" && k.mood !== "gewitter" && k.bg !== "storm",
    start(s) { s.m = []; s.life = 16; s.acc = 0; s.h = viewHole(); if (!s.h) return false; },
    tick(s, dt) { if ((s.t * 2 | 0) !== ((s.t - dt) * 2 | 0)) s.h = viewHole() || s.h; s.acc += dt * (s.t < s.life - 2 ? 7 : 0); while (s.acc > 1) { s.acc--; s.m.push({ x: rnd(-0.1, 1), y: rnd(-0.2, 0.6), a: rnd(0.35, 0.65), l: rnd(30, 80), t: 0, life: rnd(0.7, 1.5), w: rnd(0.8, 1.6), gold: Math.random() < 0.3 }); } for (const m of s.m) if (m.gold && !m.snd && m.t === 0) { m.snd = 1; if (Math.random() < 0.45) Z.klang && Z.klang.funkeln && Z.klang.funkeln(1, { vol: 0.03, len: 4 }); } /* Klang: goldene Schnuppen funkeln in der Tonart */ for (const m of s.m) m.t += dt; s.m = s.m.filter(m => m.t < m.life); return s.t < s.life || s.m.length > 0; },
    back(c, s, t, cam, oy, LH) {
      c.globalCompositeOperation = "lighter";
      for (const m of s.m) {
        const h = s.h, u = m.t / m.life, x = cam.x + m.x * cam.w + u * 90, y = h.y0 - 20 + m.y * (h.y1 - h.y0 + 40) + u * 90 * m.a, a = Math.sin(u * PI);
        const g = c.createLinearGradient(x, y, x - m.l, y - m.l * m.a); g.addColorStop(0, m.gold ? "rgba(255,230,170," + a + ")" : "rgba(255,250,240," + a + ")"); g.addColorStop(1, "rgba(255,220,200,0)");
        c.strokeStyle = g; c.lineWidth = m.w; c.beginPath(); c.moveTo(x, y); c.lineTo(x - m.l, y - m.l * m.a); c.stroke(); glow(c, x, y, 4, "rgba(255,240,210,1)", a * 0.6);
      }
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + 30 }), seenFree: true });

  /* ---- 8. Regenbogen (nachts: Mondbogen) ---- */
  def({ id: "regenbogen", tier: 1, n: ["Regenbogen", "Rainbow"], hint: ["wenn draußen der Regen aufhört", "when the rain stops outside"],
    d: ["Der Regen hört auf, und über der Feste spannt sich ein Bogen aus Rot, Gold, Rosa und Violett.", "The rain stops, and a bow of red, gold, rose and violet spans the keep."],
    where: k => k.back && k.out && (k.mood === "regen" || k.mood === "niesel" || k.mood === "gewitter"),
    start(s, k) { Z.klang && Z.klang.funkeln && Z.klang.funkeln(7, { inst: "harfe", okt: 12, stufen: "auf", vol: 0.055, len: 8 }); /* Klang: Harfenbogen */ s.life = 34; s.moon = k.night; s.x = rnd(0.25, 0.75); const B = Z.biome; if (B && B.weather) { s.wsave = B.weather.slice(); B.weather = B.weather.filter(w => w !== "rain" && w !== "drizzle"); } const W = Z.wetter && Z.wetter(); if (W) { s.msave = W.mood; W.mood = "klar"; W.ev = 99; } },
    tick(s) { if (s.t >= s.life) { return false; } return true; },
    end(s) { /* das Wetter bleibt klar – der Regen ist vorbei */ },
    back(c, s, t, cam, oy, LH) {
      const a = Math.min(1, s.t / 5) * Math.min(1, (s.life - s.t) / 6) * (s.moon ? 0.55 : 1);
      const cx = cam.x + cam.w * s.x - cam.x * 0.02, cy = oy + LH * 0.95, R = Math.min(cam.w * 0.55, LH * 0.8);
      const bands = s.moon ? ["#f0e4f4", "#e8d8ec", "#f8f0e8", "#e0c8e8", "#d8c0e0"] : ["#ff4a3a", "#ff9a30", "#ffd450", "#ff86a8", "#b060e0"];
      c.save(); c.globalCompositeOperation = "lighter";
      const lg = c.createLinearGradient(0, cy - R - 20, 0, cy); lg.addColorStop(0, "rgba(255,255,255,1)"); lg.addColorStop(0.5, "rgba(255,255,255,.8)"); lg.addColorStop(1, "rgba(255,255,255,0)");
      for (let i = 0; i < bands.length; i++) { c.globalAlpha = a * 0.2; c.strokeStyle = bands[i]; c.lineWidth = 4.2; c.beginPath(); c.arc(cx, cy, R - i * 4, PI * 1.02, PI * 1.98); c.stroke(); }
      /* heller Himmel innerhalb des Bogens */
      c.globalAlpha = a * 0.06; c.fillStyle = s.moon ? "#e8dcf0" : "#fff0d8"; c.beginPath(); c.arc(cx, cy, R - 20, PI, TAU); c.fill();
      c.restore();
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + 30 }), seenFree: true });

  /* ---- 9. Das Nest im Gewölbe ---- */
  def({ id: "vogelnest", tier: 1, n: ["Das Nest im Gewölbe", "The nest in the vault"], hint: ["unter Decken und Balken", "under ceilings and beams"],
    d: ["Unter der Decke hat eine Schwalbe genistet. Drei Schnäbel, ein Wurm, großes Geschrei.", "A swallow has nested under the ceiling. Three beaks, one worm, a great racket."],
    where: k => k.bg !== "embercity" && k.bg !== "forge" && k.area !== "arena",
    start(s) { const p = pc(), lv = Z.level; const sp = wallSpot(p.x, p.y - 50, 170, 110, (tx, ty) => (solidV(lv.get(tx, ty - 1)) || lv.get(tx, ty - 1) === 2) && airFree(tx, ty + 1) && Math.abs(tx * T - p.x) > 30, 400) || wallSpot(p.x, p.y - 50, 170, 110, (tx, ty) => (solidV(lv.get(tx, ty - 1)) || lv.get(tx, ty - 1) === 2) && airFree(tx, ty + 1), 400); if (!sp) return false; s.n = { x: sp.x, y: sp.ty * T + 1 }; s.feeds = 0; s.bird = null; s.next = 1.5; s.life = 40; s.open = 0; preload("wVogel"); stay.push({ kind: "nest", x: s.n.x, y: s.n.y, s }); },
    tick(s, dt) {
      const n = s.n; s.open = Math.max(0, s.open - dt);
      if (!s.bird && !s.leave && s.feeds < 3) { s.next -= dt; if (s.next <= 0) { const side = Math.random() < 0.5 ? -1 : 1; s.bird = { x: n.x + side * 240, y: n.y + rnd(20, 60), ph: "in", t: 0, f: -side }; } }
      const b = s.bird;
      if (b) { b.t += dt; if (b.ph === "in") { const dx = n.x + b.f * -5 - b.x, dy = n.y + 4 - b.y, d = Math.hypot(dx, dy); if (d < 2) { b.ph = "feed"; b.t = 0; s.open = 1.6; snd("wVogel", { vol: 0.25, x: n.x, rate: 1.3 }); } else { const v = Math.min(d, (150 + d) * dt); b.x += dx / d * v; b.y += dy / d * v + Math.sin(b.t * 9) * 0.4; b.f = Math.sign(dx) || b.f; } } else if (b.ph === "feed") { if (b.t > 1.3) { b.ph = "out"; b.f = -b.f; b.t = 0; s.feeds++; } } else { b.x += b.f * 160 * dt; b.y += Math.sin(b.t * 7) * 30 * dt + 20 * dt; if (!inCam(b.x, b.y, 80)) { s.bird = null; s.next = rnd(3, 6); } } }
      return (s.t < s.life || s.bird) && !(s.feeds >= 3 && !s.bird);
    },
    mid(c, s, t) { const b = s.bird; if (!b) return; drawSwallow(c, b.x, b.y, b.f, b.ph === "feed" ? 0.3 : Math.sin(t * 20), b.ph === "feed"); },
    at: s => s.n });
  function drawSwallow(c, x, y, f, w, perch) {
    c.save(); c.translate(x, y); c.scale(f, 1);
    c.fillStyle = "#2a2030"; c.beginPath(); c.ellipse(0, 0, 3.2, 1.6, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-3, 0); c.lineTo(-7, -1.4); c.lineTo(-5.4, 0); c.lineTo(-7, 1.4); c.fill();
    c.fillStyle = "#e8e0d4"; c.beginPath(); c.ellipse(0.6, 0.8, 2, 0.8, 0, 0, TAU); c.fill(); c.fillStyle = "#b04a2a"; c.fillRect(2.4, -0.6, 1, 1);
    c.fillStyle = "#3a3040"; c.beginPath(); c.moveTo(-0.5, -0.5); c.quadraticCurveTo(-2, -4 - w * 4, -5, -3 - w * 5); c.lineTo(1, -0.4); c.fill();
    if (perch) { c.strokeStyle = "#c8a050"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(3.4, 0.2); c.quadraticCurveTo(5, 1.6, 4.2, 2.6); c.stroke(); }
    c.restore();
  }
  function drawNest(c, o, t) {
    const x = o.x, y = o.y, op = o.s ? o.s.open : 0;
    /* Lehmnest unter der Decke */
    c.fillStyle = "#5a4430"; c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x - 7, y + 7, x, y + 8); c.quadraticCurveTo(x + 7, y + 7, x + 7, y); c.fill();
    c.fillStyle = "#6e5638"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x - 5 + k * 2.5, y + 2 + (k % 2) * 2.4, 1.6, 0, TAU); c.fill(); }
    c.strokeStyle = "rgba(220,190,120,.6)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x - 6, y + 4); c.lineTo(x - 2, y + 6); c.moveTo(x + 2, y + 3); c.lineTo(x + 6, y + 5); c.stroke();
    /* Junge */
    for (let k = 0; k < 3; k++) { const hx = x - 3 + k * 3, bob = Math.sin(t * (op ? 18 : 1.5) + k * 2) * (op ? 1 : 0.3), hy = y + 1 - (op ? 2.5 : 0.6) + bob; c.fillStyle = "#4a3e40"; c.beginPath(); c.arc(hx, hy, 1.5, 0, TAU); c.fill(); if (op) { c.fillStyle = "#f0b030"; c.beginPath(); c.moveTo(hx - 1.2, hy - 0.8); c.lineTo(hx, hy - 3.4 - k * 0.3); c.lineTo(hx + 1.2, hy - 0.8); c.fill(); c.fillStyle = "#e85a30"; c.fillRect(hx - 0.3, hy - 2.2, 0.6, 1.2); } else { c.fillStyle = "#e8a030"; c.fillRect(hx - 0.4, hy - 1.9, 0.8, 0.6); } }
    c.fillStyle = "rgba(240,236,228,.5)"; c.fillRect(x - 2, y + 8, 0.8, 2.2); c.fillRect(x + 3, y + 8, 0.7, 1.4);
  }

  /* ---- 10. Prozession der Pilzwesen ---- */
  const CAPS = [["#c83a2a", "#f0e4d8"], ["#8a5a30", "#e0c8a0"], ["#9a4ab0", "#e8d0f0"], ["#d8a040", "#fff0c8"], ["#c87a8a", "#fbe8ec"]];
  def({ id: "pilzvolk", tier: 1, n: ["Prozession der Pilzwesen", "Procession of the mushroom folk"], hint: ["in Kellern, Verliesen, Höhlen", "in cellars, dungeons, caves"],
    d: ["Eine Reihe winziger Pilzwesen zieht mit Laterne vorbei. Als sie Ezekiel passieren, verneigen sie sich höflich.", "A line of tiny mushroom folk files past with a lantern. Passing Ezekiel, they bow politely."],
    where: k => k.bg === "cellar" || k.bg === "dungeon" || k.bg === "chasm" || k.bg === "lake" || k.area === "lager" || k.area === "passage" || k.bg === "castle",
    start(s) {
      const p = Z.player, py = p.y + p.h; let side = Math.random() < 0.5 ? -1 : 1, x0 = 0, y = null;
      for (let tr = 0; tr < 2 && y == null; tr++, side = -side) for (let f = 0.52; f > 0.12 && y == null; f -= 0.04) { const xx = p.x + p.w / 2 + side * Z.cam.w * f, yy = floorY(xx, py - 3 * T, 7); if (yy != null && Math.abs(yy - py) <= 3 * T) { x0 = xx; y = yy; } }
      if (y == null) return false; side = Math.sign(x0 - p.x) || 1;
      s.dir = -side; s.y = y; s.m = []; const n = 5 + ((Math.random() * 4) | 0);
      for (let i = 0; i < n; i++) s.m.push({ x: x0 - s.dir * i * 9, y, cap: pick(CAPS), h: rnd(5, 7.5), ph: rnd(0, TAU), bow: 0, done: 0, role: i === 0 ? "lantern" : i === n - 1 ? "banner" : (Math.random() < 0.3 ? "drum" : "") });
      s.life = 40; preload("wSchellen"); setTimeout(() => snd("wSchellen", { vol: 0.16, x: x0 }), 800);
    },
    tick(s, dt) {
      const p = Z.player, px = p.x + p.w / 2;
      for (const m of s.m) {
        const near = Math.abs(m.x - px) < 16 && !m.done; if (near && !m.bow) { m.bow = 0.001; }
        if (m.bow > 0) { m.bow += dt; if (m.bow > 1.1) { m.bow = 0; m.done = 1; } continue; }
        m.x += s.dir * (s.leave ? 40 : 15) * dt; m.ph += dt * 9;
        const gy = floorY(m.x, m.y - 20, 4); if (gy != null && Math.abs(gy - m.y) < 20) m.y += (gy - m.y) * Math.min(1, dt * 10); else m.gone = 1;
      }
      s.m = s.m.filter(m => !m.gone);
      return s.t < s.life && s.m.some(m => inCam(m.x, m.y, 40)) || s.t < 3;
    },
    mid(c, s, t) {
      for (const m of s.m) {
        const bow = m.bow > 0 ? Math.sin(Math.min(1, m.bow / 1.1) * PI) : 0, step = m.bow ? 0 : Math.sin(m.ph), x = m.x, y = m.y - Math.abs(step) * 0.6, h = m.h;
        c.save(); c.translate(x, y); c.scale(s.dir * 1.3, 1.3);
        c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(0, (m.y - y) / 1.3, 3, 0.7, 0, 0, TAU); c.fill();
        c.fillStyle = "#d8ccb8"; c.fillRect(-1.6 + step * 0.6, -1.4, 1, 1.4); c.fillRect(0.6 - step * 0.6, -1.4, 1, 1.4);
        c.fillStyle = m.cap[1]; c.beginPath(); c.moveTo(-1.8, -1.2); c.lineTo(1.8, -1.2); c.lineTo(1.3, -h + 2); c.lineTo(-1.3, -h + 2); c.fill();
        c.fillStyle = "#2a1a14"; c.fillRect(0.4, -h + 3.2, 0.6, 0.6); c.fillRect(-0.8, -h + 3.2, 0.6, 0.6);
        c.save(); c.translate(0, -h + 2.2); c.rotate(bow * 0.9); c.fillStyle = m.cap[0]; c.beginPath(); c.ellipse(1.2 * bow, -0.6, 3.4, 2.4, 0, PI, TAU); c.fill(); c.fillStyle = "rgba(255,250,240,.85)"; c.fillRect(-1.8 + 1.2 * bow, -1.6, 0.8, 0.8); c.fillRect(0.6 + 1.2 * bow, -2.4, 0.7, 0.7); c.fillRect(1.6 + 1.2 * bow, -1.2, 0.6, 0.6); c.restore();
        if (m.role === "lantern") { c.strokeStyle = "#5a4430"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(1.5, -h + 3.5); c.lineTo(3.6, -h - 0.5); c.lineTo(4.6, -h - 0.5); c.stroke(); c.fillStyle = "#3a2a20"; c.fillRect(4, -h - 0.4, 1.4, 2); c.fillStyle = "#ffd070"; c.fillRect(4.3, -h, 0.8, 1.2); }
        if (m.role === "banner") { c.strokeStyle = "#5a4430"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-1.2, -h + 3.5); c.lineTo(-1.6, -h - 4); c.stroke(); c.fillStyle = "#b04a5a"; c.beginPath(); c.moveTo(-1.6, -h - 4); c.lineTo(-5 + Math.sin(t * 4) * 0.5, -h - 3.2); c.lineTo(-1.6, -h - 2); c.fill(); }
        if (m.role === "drum") { c.fillStyle = "#8a5a30"; c.fillRect(1.2, -h + 3, 2, 2); c.fillStyle = "#e8d8b8"; c.fillRect(1.2, -h + 3, 2, 0.5); }
        c.restore();
      }
    },
    front(c, s, t) { c.globalCompositeOperation = "lighter"; for (const m of s.m) if (m.role === "lantern") glow(c, m.x + s.dir * 6.1, m.y - m.h * 1.3 + 0.5, 9, "rgba(255,200,110,1)", 0.45 + 0.1 * Math.sin(t * 7)); },
    light(add, s) { for (const m of s.m) if (m.role === "lantern") add(m.x + s.dir * 4.7, m.y - m.h, 26, "#ffc070", 0.35); },
    at: s => s.m[0] });

  /* ---- 11. Glockenspiel im Wind ---- */
  def({ id: "glockenspiel", tier: 1, n: ["Glockenspiel im Wind", "Wind chimes"], hint: ["wo der Wind durch die Mauern geht", "where the wind blows through the walls"],
    d: ["Ein Windstoß – und irgendwo unter der Decke klingt ein vergessenes Glockenspiel eine kleine Melodie.", "A gust – and somewhere under the ceiling a forgotten wind chime plays a little tune."],
    where: k => k.bg === "ramparts" || k.bg === "spires" || k.bg === "belltower" || k.bg === "castle" || k.bg === "harbour" || k.bg === "storm" || k.area === "lager",
    start(s) {
      const p = pc(), lv = Z.level; const sp = wallSpot(p.x, p.y - 30, 140, 80, (tx, ty) => (solidV(lv.get(tx, ty - 1)) || lv.get(tx, ty - 1) === 2) && lv.get(tx, ty + 1) === 0 && lv.get(tx, ty + 2) === 0);
      if (!sp) return false; s.x = sp.x; s.y = sp.ty * T; s.life = 16; s.sw = 0; s.gust = 0; s.rang = [0, 0, 0, 0, 0]; s.next = 1.2; s.played = 0;
    },
    tick(s, dt) {
      s.gust = s.t < 9 ? Math.sin(Math.min(1, s.t / 9) * PI) : 0; Z.windX = Math.max(Z.windX || 0, 30 * s.gust);
      s.sw += dt * (1.4 + s.gust * 2);
      if (!s.played && s.t > 1.2) { s.played = 1; tune("w_glockenspiel", ["cel", "glock"], [[12, 0, 2], [15, 2, 2], [19, 4, 2], [24, 6, 3], [19, 9, 2], [22, 11, 2], [15, 13, 4]], 0.075); }
      for (let i = 0; i < 5; i++) s.rang[i] = Math.max(0, s.rang[i] - dt * 2);
      s.next -= dt; if (s.next <= 0 && s.t < 9) { s.next = rnd(0.2, 0.6); s.rang[(Math.random() * 5) | 0] = 1; }
      return s.t < s.life;
    },
    mid(c, s, t) {
      const a = Math.min(1, s.t / 1) * Math.min(1, (s.life - s.t) / 1.5), x = s.x, y = s.y, sw = Math.sin(s.sw) * (0.08 + s.gust * 0.25);
      c.globalAlpha = a; c.strokeStyle = "#3a3028"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 5); c.stroke();
      c.save(); c.translate(x, y + 5); c.rotate(sw * 0.4);
      c.fillStyle = "#6a4a2a"; c.beginPath(); c.ellipse(0, 0, 7, 1.4, 0, 0, TAU); c.fill(); c.fillStyle = "#8a6a40"; c.fillRect(-6, -0.8, 12, 0.6);
      for (let i = 0; i < 5; i++) { const ox = -5 + i * 2.5, len = 7 + [0, 3, 5, 2, 4][i], r = sw * (1 + i * 0.15) + Math.sin(t * 3 + i) * 0.05 * (1 + s.gust * 3); c.save(); c.translate(ox, 0.8); c.rotate(r); c.strokeStyle = "rgba(60,50,40,.8)"; c.lineWidth = 0.3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 2); c.stroke(); c.fillStyle = "#b8a068"; c.fillRect(-0.6, 2, 1.2, len); c.fillStyle = "#f0e0a0"; c.fillRect(-0.6, 2, 0.4, len); c.restore(); }
      c.fillStyle = "#6a4a2a"; c.beginPath(); c.arc(0, 15 + Math.sin(s.sw * 1.3) * 1.5, 1.2, 0, TAU); c.fill();
      c.restore(); c.globalAlpha = 1;
    },
    front(c, s) { c.globalCompositeOperation = "lighter"; for (let i = 0; i < 5; i++) if (s.rang[i] > 0) glow(c, s.x - 5 + i * 2.5, s.y + 10 + i, 6, "rgba(255,230,160,1)", s.rang[i] * 0.5); },
    at: s => ({ x: s.x, y: s.y + 8 }) });

  /* ---- 12. Schatten hinter den Fenstern ---- */
  def({ id: "schatten", tier: 1, n: ["Schatten hinter den Fenstern", "Shadows behind the windows"], hint: ["wo Fenster nach draußen gehen", "where windows look outside"],
    d: ["Etwas Riesiges zieht draußen vorbei. Man sieht nur seinen Schatten, Fenster für Fenster.", "Something enormous passes outside. You only see its shadow, window by window."],
    where: k => k.back && (k.out || k.B.open === "arch" || k.B.open === "vault") && k.bg !== "lake" && k.bg !== "halls" && k.hour !== "nacht",
    start(s) { s.h = viewHole(); if (!s.h) return false; s.kind = pick(["drache", "drache", "riese", "wurm"]); s.dir = Math.random() < 0.5 ? -1 : 1; s.life = 13; s.y = rnd(-0.15, 0.15); preload("wFluegel"); if (s.kind === "drache") setTimeout(() => snd("wFluegel", { vol: 0.25, rate: 0.5 }), 3000); },
    tick(s) { return s.t < s.life; },
    back(c, s, t, cam, oy, LH) {
      const u = s.t / s.life, x = s.dir > 0 ? cam.x - 160 + u * (cam.w + 320) : cam.x + cam.w + 160 - u * (cam.w + 320), y = s.h.ry + 20 * s.y + (s.kind === "riese" ? 40 : 0);
      c.save(); c.translate(x, y); c.scale(s.dir, 1); c.fillStyle = "rgba(12,6,14,.82)";
      if (s.kind === "drache") { const w = Math.sin(t * 2.6); c.beginPath(); c.ellipse(0, 0, 34, 9, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(30, -3); c.quadraticCurveTo(48, -10, 58, -6); c.lineTo(62, -2); c.lineTo(54, 0); c.quadraticCurveTo(44, 2, 30, 4); c.fill(); c.beginPath(); c.moveTo(-30, 0); c.quadraticCurveTo(-60, 6, -90, -6); c.lineTo(-86, 0); c.quadraticCurveTo(-60, 12, -30, 5); c.fill();
        c.beginPath(); c.moveTo(-10, -4); c.lineTo(-30, -50 * w - 10); c.lineTo(-10, -42 * w - 20); c.lineTo(6, -46 * w - 6); c.lineTo(16, -4); c.fill(); c.beginPath(); c.moveTo(-6, -3); c.lineTo(-20, -30 * w - 4); c.lineTo(10, -3); c.fill(); }
      else if (s.kind === "riese") { const st = Math.sin(t * 1.6); c.fillRect(-10 + st * 6, -10, 12, 120); c.fillRect(6 - st * 6, -10, 12, 120); c.beginPath(); c.ellipse(4, -40, 26, 34, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(4, -86, 14, 0, TAU); c.fill(); c.fillRect(-26, -66, 8, 50 + st * 4); }
      else { for (let i = 0; i < 9; i++) { const xx = -i * 18, yy = Math.sin(t * 2 + i * 0.7) * 10; c.beginPath(); c.arc(xx, yy, 13 - i * 0.9, 0, TAU); c.fill(); } c.beginPath(); c.moveTo(10, -8); c.lineTo(28, -4); c.lineTo(10, 8); c.fill(); }
      c.restore();
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + 40 }), seenFree: true });

  /* ---- 13. Die Silberspinne webt ---- */
  def({ id: "spinnerin", tier: 1, n: ["Die Silberspinne", "The silver spider"], hint: ["in dunklen Winkeln", "in dark corners"],
    d: ["Eine winzige Spinne webt in aller Ruhe ein Netz, das im Licht glitzert wie Raureif. Es bleibt hängen, solange Ezekiel hier ist.", "A tiny spider calmly weaves a web that glitters like hoarfrost. It stays for as long as Ezekiel is here."],
    where: k => k.bg === "chasm" || k.bg === "cellar" || k.bg === "dungeon" || k.bg === "belltower" || k.bg === "halls" || k.bg === "lake",
    start(s) { const p = pc(); const sp = wallSpot(p.x, p.y - 20, 120, 60, (tx, ty) => Math.abs(tx * T + 8 - p.x) > 26 && wallFree(tx + 1, ty) && wallFree(tx - 1, ty) && wallFree(tx, ty - 1) && wallFree(tx, ty + 1)); if (!sp) return false; s.x = sp.x; s.y = sp.y; s.R = rnd(10, 14); s.n = 9; s.life = 20; s.pr = 0; stay.push({ kind: "web", s }); preload("wSpinne"); },
    tick(s, dt) { s.pr = Math.min(1, s.t / 14); if (s.pr >= 1 && !s.klang) { s.klang = 1; Z.klang && Z.klang.funkeln && Z.klang.funkeln(3, { inst: "cel", vol: 0.03, len: 4 }); } /* Klang: das fertige Netz glitzert */ return s.t < s.life; },
    at: s => ({ x: s.x, y: s.y }) });
  function drawWeb(c, s, t) {
    const pr = s.pr, x = s.x, y = s.y, R = s.R, n = s.n, sway = Math.sin(t * 0.8 + x) * 0.4;
    const radial = Math.min(1, pr / 0.35), spiral = clamp((pr - 0.35) / 0.65, 0, 1);
    c.strokeStyle = "rgba(240,236,248,.5)"; c.lineWidth = 0.35; c.beginPath();
    const rk = k => R * (0.85 + 0.25 * Math.sin(k * 2.7 + x));
    for (let k = 0; k < n * radial; k++) { const a = k / n * TAU; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * rk(k) + sway, y + Math.sin(a) * rk(k)); }
    c.stroke();
    if (spiral > 0) { c.strokeStyle = "rgba(240,236,248,.38)"; c.beginPath(); const tot = n * 6 * spiral; for (let i = 0; i <= tot; i++) { const k = i % n, ring = Math.floor(i / n), a = k / n * TAU, rr = rk(k) * (0.95 - ring * 0.14); if (rr < 1.5) break; const px = x + Math.cos(a) * rr + sway * rr / R, py = y + Math.sin(a) * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
    /* Glitzern */
    c.save(); c.globalCompositeOperation = "lighter"; for (let k = 0; k < 6; k++) { const a = k * 2.3 + x, rr = R * (0.3 + (k % 3) * 0.2), tw = Math.max(0, Math.sin(t * 1.7 + k * 1.9)); if (spiral * 6 > k) { c.globalAlpha = tw * 0.8; c.fillStyle = "#fff8f0"; c.fillRect(x + Math.cos(a) * rr - 0.4, y + Math.sin(a) * rr - 0.4, 0.8, 0.8); } } c.restore();
    /* die Weberin selbst */
    const ang = pr < 0.35 ? (pr / 0.35) * n * TAU / n * 1 : (pr * 37) % TAU, rr = pr < 0.35 ? R * 0.7 : R * (0.95 - (pr - 0.35) / 0.65 * 0.75), sx = pr >= 1 ? x : x + Math.cos(ang) * rr, sy = pr >= 1 ? y : y + Math.sin(ang) * rr;
    c.fillStyle = "#c8c0d0"; c.beginPath(); c.ellipse(sx, sy, 1.3, 1, ang, 0, TAU); c.fill(); c.fillStyle = "#e8e0f0"; c.beginPath(); c.arc(sx + Math.cos(ang) * 1.2, sy + Math.sin(ang) * 1.2, 0.7, 0, TAU); c.fill();
    c.strokeStyle = "rgba(200,190,210,.8)"; c.lineWidth = 0.3; c.beginPath(); for (let k = 0; k < 4; k++) { const la = ang + PI / 2 + (k - 1.5) * 0.45; c.moveTo(sx, sy); c.lineTo(sx + Math.cos(la) * 2.2, sy + Math.sin(la) * 2.2); c.moveTo(sx, sy); c.lineTo(sx - Math.cos(la) * 2.2, sy - Math.sin(la) * 2.2); } c.stroke();
  }

  /* ---- 14. Das Laternenboot ---- */
  def({ id: "geisterboot", tier: 1, n: ["Das Laternenboot", "The lantern boat"], hint: ["am Hafen und am schwarzen See", "at the harbour and the black lake"],
    d: ["Ein Boot ohne Ruderer gleitet durch den Nebel, eine einzelne Laterne am Bug. Es läutet leise, dann ist es fort.", "A boat without an oarsman glides through the fog, a single lantern at its bow. It rings softly, then it is gone."],
    where: k => k.back && (k.bg === "harbour" || k.bg === "lake"),
    start(s) { s.h = viewHole(); if (!s.h) return false; s.dir = Math.random() < 0.5 ? -1 : 1; s.life = 26; preload("wGlocklein"); setTimeout(() => snd("wGlocklein", { vol: 0.18, rate: 0.7 }), 6000); },
    tick(s) { return s.t < s.life; },
    back(c, s, t, cam, oy, LH) {
      const u = s.t / s.life, a = Math.min(1, s.t / 4) * Math.min(1, (s.life - s.t) / 4), x = s.dir > 0 ? cam.x - 80 + u * (cam.w + 160) : cam.x + cam.w + 80 - u * (cam.w + 160), y = s.h.ry + 8 + Math.sin(t * 0.9) * 1.2;
      c.save(); c.globalAlpha = a * 0.7; c.translate(x, y); c.scale(s.dir, 1); c.rotate(Math.sin(t * 0.8) * 0.03);
      c.strokeStyle = "rgba(255,210,170,.35)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-22, -3.5); c.lineTo(22, -3.5); c.stroke();
      c.fillStyle = "#1a1220"; c.beginPath(); c.moveTo(-22, -3); c.lineTo(22, -3); c.quadraticCurveTo(18, 4, 10, 5); c.lineTo(-14, 5); c.quadraticCurveTo(-20, 3, -22, -3); c.fill();
      c.fillRect(-2, -26, 1.4, 23); c.fillStyle = "rgba(40,30,46,.8)"; c.beginPath(); c.moveTo(-1, -25); c.quadraticCurveTo(10, -16, -1, -5); c.fill();
      c.strokeStyle = "#1a1220"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(18, -3); c.lineTo(24, -12); c.stroke();
      c.restore();
      c.save(); c.globalCompositeOperation = "lighter"; const lx = x + s.dir * 24, ly = y - 13; glow(c, lx, ly, 22, "rgba(255,190,100,1)", a * (0.75 + 0.15 * Math.sin(t * 5))); glow(c, lx, ly, 6, "rgba(255,240,200,1)", a); c.globalAlpha = a; c.fillStyle = "#ffe0a0"; c.fillRect(lx - 0.8, ly - 1, 1.6, 2);
      /* Spiegelung im Wasser */
      for (let k = 0; k < 5; k++) { c.globalAlpha = a * 0.25 * (1 - k / 5); c.fillStyle = "#ffc070"; c.fillRect(lx - 2 + Math.sin(t * 3 + k) * 1.5, y + 8 + k * 2.4, 4 - k * 0.5, 0.7); }
      c.restore();
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + Z.cam.h * 0.5 }), seenFree: true });

  /* ---- 15. Der Funkenvogel ---- */
  def({ id: "funkenvogel", tier: 1, n: ["Der Funkenvogel", "The ember bird"], hint: ["wo es glüht", "where embers glow"],
    d: ["Funken sammeln sich zu einem Vogel aus Glut, ziehen einen Kreis um Ezekiel und zerstieben zu Asche.", "Sparks gather into a bird of embers, circle Ezekiel once and scatter into ash."],
    where: k => k.bg === "embercity" || k.bg === "forge" || k.bg === "spires",
    start(s) { const p = pc(); preload("wFluegel"); setTimeout(() => snd("wFluegel", { vol: 0.12, rate: 1.6 }), 1800); /* Klang */ s.cx = p.x; s.cy = p.y - 40; s.life = 9; s.sp = []; for (let i = 0; i < 46; i++) s.sp.push({ u: Math.random(), k: (Math.random() * 4) | 0, x: p.x + rnd(-200, 200), y: p.y + rnd(-40, 120) }); },
    tick(s, dt) {
      const u = s.t / s.life, gather = clamp(s.t / 2, 0, 1), p = pc();
      if (s.t > s.life - 1.2 && !s.burst) { s.burst = 1; snd("fire", { vol: 0.16, x: p.x, rate: 1.4 }); /* Klang: Glut zerstiebt */ for (const q of s.sp) FX.p({ x: q.x, y: q.y, vx: rnd(-40, 40), vy: rnd(-30, 10), g: 40, life: rnd(0.8, 1.6), size: 1.6, col: pick(["#ffb040", "#ff7a30", "#ffe080"]), kind: "glow", add: true }); }
      const ang = (u * 1.25) * TAU, bx = p.x + Math.cos(ang) * 70, by = p.y - 34 + Math.sin(ang) * 26, dir = -Math.sin(ang) >= 0 ? 1 : -1, flap = Math.sin(s.t * 9);
      s.bx = bx; s.by = by; s.dir = dir;
      for (const q of s.sp) { const pt = birdPt(q.u, q.k, flap); const tx = bx + pt[0] * dir, ty = by + pt[1]; q.x += (tx - q.x) * Math.min(1, dt * (1 + gather * 9)); q.y += (ty - q.y) * Math.min(1, dt * (1 + gather * 9)); }
      return s.t < s.life;
    },
    front(c, s, t) { if (s.burst) return; c.globalCompositeOperation = "lighter"; const a = Math.min(1, s.t / 1.5); for (const q of s.sp) { glow(c, q.x, q.y, 4, q.k === 0 ? "rgba(255,230,140,1)" : "rgba(255,130,40,1)", a * 0.55); c.globalAlpha = a; c.fillStyle = "#fff0c0"; c.fillRect(q.x - 0.4, q.y - 0.4, 0.8, 0.8); c.globalAlpha = 1; } },
    light(add, s) { if (!s.burst && s.bx != null) add(s.bx, s.by, 60, "#ff9a40", 0.5); },
    at: s => s.bx != null && { x: s.bx, y: s.by } });
  /* Punkte auf dem Umriss eines fliegenden Vogels: 0 Körper, 1/2 Flügel, 3 Schwanz */
  function birdPt(u, k, flap) {
    if (k === 0) return [-8 + u * 18, Math.sin(u * PI) * -2];
    if (k === 3) return [-8 - u * 12, u * 3 * (u < 0.5 ? 1 : -1)];
    const s = k === 1 ? 1 : 0.7; return [-2 + u * 6 * s, -u * 18 * s * flap - 1];
  }

  /* ---- 16. Das Irrlicht (führt zu Geheimnissen) ---- */
  def({ id: "irrlicht", tier: 1, n: ["Das freundliche Irrlicht", "The friendly will-o'-wisp"], hint: ["überall, wo es etwas zu finden gibt", "wherever there is something to find"],
    d: ["Ein Lichtwesen klingelt leise und schwebt voraus. Wer ihm folgt, findet etwas: eine brüchige Wand oder ein Häufchen Gold.", "A light being chimes softly and floats ahead. Whoever follows it finds something: a crumbling wall or a little pile of gold."],
    where: k => k.area !== "arena",
    start(s) {
      const p = pc(), lv = Z.level; let best = null, bd = 1e9;
      for (let y = 1; y < lv.H - 1; y++) for (let x = 1; x < lv.W - 1; x++) { if (lv.get(x, y) !== 7) continue; const wx = x * T + 8, wy = y * T + 8, d = Math.hypot(wx - p.x, wy - p.y); if (d > 90 && d < 900 && d < bd) { bd = d; best = { x: wx, y: wy, kind: "wall" }; } }
      if (!best) { for (let i = 0; i < 300 && !best; i++) { const tx = Math.floor((p.x + rnd(-500, 500)) / T), ty = Math.floor((p.y + rnd(-200, 200)) / T); if (lv.get(tx, ty) === 0 && lv.get(tx, ty - 1) === 0 && standV(lv.get(tx, ty + 1)) && Math.hypot(tx * T - p.x, ty * T - p.y) > 200) best = { x: tx * T + 8, y: (ty + 1) * T - 6, kind: "gold" }; } }
      if (!best) return false; s.to = best; s.x = p.x + rnd(-40, 40); s.y = p.y - 30; s.life = 70; s.trail = []; preload("wGlocklein"); snd("wGlocklein", { vol: 0.2, rate: 1.4 });
    },
    tick(s, dt) {
      const p = pc(), d = Math.hypot(s.to.x - s.x, s.to.y - s.y), pd = Math.hypot(p.x - s.x, p.y - s.y);
      if (s.done) { s.dt2 = (s.dt2 || 0) + dt; return s.dt2 < 2; }
      /* wartet auf Ezekiel, schwebt sonst voraus (wie ein Geist durch die Mauern) */
      const v = pd > 120 ? 0 : d < 6 ? 0 : 55; if (d > 1) { s.x += (s.to.x - s.x) / d * v * dt; s.y += (s.to.y - s.y) / d * v * dt; }
      if (pd > 120) { s.x += (p.x - s.x) * dt * 0.4; s.y += (p.y - 24 - s.y) * dt * 0.4; }
      s.trail.push({ x: s.x, y: s.y, t: 0 }); for (const q of s.trail) q.t += dt; s.trail = s.trail.filter(q => q.t < 0.8);
      if (d < 8 && Math.hypot(p.x - s.to.x, p.y - s.to.y) < 48) {
        s.done = 1; snd("wGlocklein", { vol: 0.3, rate: 1.7 });
        for (let k = 0; k < 3; k++) setTimeout(() => FX.ring(s.to.x, s.to.y, 30 + k * 20, "rgba(255,240,190,.6)", 0.8, 1.2), k * 150);
        if (s.to.kind === "gold" && Z.dropGold) Z.dropGold(s.to.x, s.to.y - 4, Math.round(rnd(14, 30) * (Z.BAL && Z.run ? Z.BAL.goldMul(Z.run.tier || 0) : 1)));
        else { FX.text(s.to.x, s.to.y - 10, L(["Hier!", "Here!"]), "#fff0c0", true); for (let k = 0; k < 14; k++) FX.p({ x: s.to.x + rnd(-8, 8), y: s.to.y + rnd(-8, 8), vx: rnd(-20, 20), vy: rnd(-30, -5), life: 1.2, size: 2, col: "#fff0c0", kind: "glow", add: true }); }
      }
      return s.t < s.life || s.done;
    },
    front(c, s, t) { c.globalCompositeOperation = "lighter"; const a = s.done ? Math.max(0, 1 - (s.dt2 || 0) / 2) : Math.min(1, s.t / 1.2); for (const q of s.trail) glow(c, q.x, q.y, 3, "rgba(255,240,200,1)", (1 - q.t / 0.8) * 0.3 * a); const pul = 0.8 + 0.2 * Math.sin(t * 6); glow(c, s.x, s.y, 14 * pul, "rgba(255,226,160,1)", 0.5 * a); glow(c, s.x, s.y, 5, "rgba(255,255,240,1)", 0.9 * a); },
    light(add, s) { add(s.x, s.y, 50, "#ffe0a0", 0.45); },
    at: s => ({ x: s.x, y: s.y }) });

  /* ---- 17. Der Geist an der Orgel ---- */
  def({ id: "geistorgel", tier: 2, n: ["Der Geist an der Orgel", "The ghost at the organ"], hint: ["in Hallen und Türmen", "in halls and towers"],
    d: ["Ein durchscheinender Organist spielt auf einem Instrument, das gestern noch nicht da war. Kommt man zu nah, verbeugt er sich – und ist fort.", "A translucent organist plays an instrument that wasn't there yesterday. Come too close and he bows – and is gone."],
    where: k => k.bg === "halls" || k.bg === "belltower" || k.bg === "cellar" || k.bg === "dungeon" || k.bg === "castle",
    start(s) {
      const p = Z.player, lv = Z.level; let spot = null;
      for (let i = 0; i < 200 && !spot; i++) { const x = p.x + rnd(60, 170) * (Math.random() < 0.5 ? -1 : 1), y = floorY(x, p.y - 10, 4); if (y == null) continue; const tx = Math.floor(x / T), ty = y / T - 1; let ok = true; for (let dx = -1; dx <= 1 && ok; dx++) for (let dy = 0; dy < 3 && ok; dy++) if (!airFree(tx + dx, ty - dy)) ok = false; if (ok && floorY(x - 14, y - 8, 2) === y && floorY(x + 14, y - 8, 2) === y && inCam(x, y, -30)) spot = { x, y }; }
      if (!spot) return false; s.x = spot.x; s.y = spot.y; s.life = 26; s.a = 0; s.keys = []; Z.klang && Z.klang.chor && Z.klang.chor(s.life - 6, 0.035); /* Klang: gestimmter Geisterchor (statt der ungestimmten Aufnahme) */
      tune("w_orgel", ["orgel", "ooh"], [[0, 0, 4], [3, 4, 4], [7, 8, 4], [12, 12, 6], [10, 18, 2], [7, 20, 4], [3, 24, 4], [5, 28, 4], [7, 32, 8]], 0.09, -12);
    },
    tick(s, dt) { const p = pc(); if (Math.abs(p.x - s.x) < 28 && Math.abs(p.y - s.y) < 40 && !s.bye) { s.bye = 1; s.life = Math.min(s.life, s.t + 2.2); } s.a = Math.min(1, s.t / 2.5) * Math.min(1, (s.life - s.t) / 2); if (Math.random() < dt * 3) s.keys.push({ x: s.x + rnd(-6, 6), y: s.y - 30, t: 0, k: (Math.random() * 2) | 0 }); for (const q of s.keys) q.t += dt; s.keys = s.keys.filter(q => q.t < 2.5); return s.t < s.life; },
    mid(c, s, t) {
      const x = s.x, y = s.y, a = s.a; c.globalAlpha = a * 0.75;
      /* Orgel: Gehäuse, Pfeifen, Manual */
      c.fillStyle = "#4a3022"; c.fillRect(x - 12, y - 14, 24, 14); c.fillStyle = "#5e3e2a"; c.fillRect(x - 12, y - 14, 24, 1.2);
      for (let k = 0; k < 7; k++) { const h = 10 + [6, 10, 14, 18, 14, 10, 6][k], px = x - 10.5 + k * 3.5; c.fillStyle = "#8a8078"; c.fillRect(px, y - 14 - h, 2.4, h); c.fillStyle = "#c8beb0"; c.fillRect(px, y - 14 - h, 0.7, h); c.fillStyle = "#2a2020"; c.fillRect(px + 0.5, y - 17, 1.4, 1); }
      c.fillStyle = "#e8e0d0"; c.fillRect(x - 10, y - 8, 20, 2); c.fillStyle = "#1a1210"; for (let k = 0; k < 9; k++) c.fillRect(x - 9 + k * 2.2, y - 8, 0.9, 1.1);
      c.globalAlpha = 1;
    },
    front(c, s, t) {
      const x = s.x, y = s.y, a = s.a, sw = Math.sin(t * 3) * 1.5;
      c.globalCompositeOperation = "lighter"; glow(c, x, y - 18, 26, "rgba(220,200,255,1)", 0.22 * a);
      c.globalCompositeOperation = "source-over"; c.globalAlpha = a * 0.5;
      /* Geist: Kapuze, wehender Saum, Arme auf den Tasten */
      c.fillStyle = "#e8e0f4"; c.beginPath(); c.moveTo(x - 4, y - 26); c.quadraticCurveTo(x, y - 34, x + 4, y - 26); c.lineTo(x + 5 + sw * 0.3, y - 12); c.quadraticCurveTo(x + 2, y - 9 + Math.sin(t * 5), x, y - 11); c.quadraticCurveTo(x - 2, y - 9 + Math.sin(t * 5 + 1), x - 5, y - 12); c.closePath(); c.fill();
      c.strokeStyle = "#e8e0f4"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - 3, y - 21); c.lineTo(x - 6 + sw, y - 9); c.moveTo(x + 3, y - 21); c.lineTo(x + 5 - sw, y - 9); c.stroke();
      c.fillStyle = "#4a3a6a"; c.beginPath(); c.ellipse(x, y - 27.5, 2.2, 2.4, 0, 0, TAU); c.fill();
      c.globalAlpha = a; c.fillStyle = "#fff0c0"; c.font = "7px serif"; c.textAlign = "center";
      for (const q of s.keys) { c.globalAlpha = a * (1 - q.t / 2.5) * 0.8; c.fillText(q.k ? "♪" : "♫", q.x + Math.sin(q.t * 2) * 4, q.y - q.t * 10); }
      c.globalAlpha = 1;
    }, at: s => ({ x: s.x, y: s.y - 20 }) });

  /* ---- 18. Der schlafende Drache ---- */
  def({ id: "drache", tier: 2, n: ["Der schlafende Drache", "The sleeping dragon"], hint: ["weit draußen", "far outside"],
    d: ["Auf einem fernen Grat schläft ein Drache. Sein Atem glüht im Takt. Einmal öffnet er ein Auge – und schließt es wieder.", "On a distant ridge a dragon sleeps. Its breath glows in rhythm. Once it opens an eye – and closes it again."],
    where: k => k.back && (k.out || k.bg === "embercity"),
    start(s) { s.h = viewHole(); if (!s.h || s.h.run < 9) return false; s.life = 45; preload("wDrache"); setTimeout(() => snd("wDrache", { vol: 0.12, rate: 0.45 }), 20000); },
    tick(s) { return s.t < s.life; },
    back(c, s, t, cam, oy, LH) {
      const h = s.h, a = Math.min(1, s.t / 6) * Math.min(1, (s.life - s.t) / 6), y = h.ry + 22, X = h.rx - 10, br = 0.5 + 0.5 * Math.sin(t * 0.9), S = 0.62;
      const eo = clamp(Math.sin(clamp((s.t - 24) / 6, 0, 1) * PI), 0, 1);
      /* ferner Grat mit zusammengerolltem Drachen: erst hell (Mondkante), dann dunkel leicht versetzt darüber */
      const shape = (g) => {
        g.beginPath();
        /* Schwanz, der sich um den Grat legt */
        g.moveTo(-30, -8); g.quadraticCurveTo(-70, -2, -84, 10); g.quadraticCurveTo(-92, 18, -80, 22); g.quadraticCurveTo(-88, 12, -70, 4); g.quadraticCurveTo(-50, -2, -28, -4); g.closePath();
        /* Hörner am Kopf */
        g.moveTo(44, -18); g.lineTo(38, -26); g.lineTo(47, -19); g.closePath(); g.moveTo(40, -17); g.lineTo(32, -22); g.lineTo(42, -16); g.closePath();
        g.moveTo(-34, -14); g.ellipse(0, -16 - br * 1.5, 34, 12 + br * 1.2, 0, PI, TAU);
        g.moveTo(-14, -26 - br); g.lineTo(-2, -40 - br * 2); g.lineTo(8, -27 - br); g.lineTo(18, -36 - br * 2); g.lineTo(24, -24); g.lineTo(-14, -20);
        g.moveTo(-34, -14); g.quadraticCurveTo(-56, -10, -64, -20); g.quadraticCurveTo(-60, -12, -40, -8); g.closePath();
        g.moveTo(28, -14); g.quadraticCurveTo(42, -20, 52, -16); g.lineTo(60, -13); g.lineTo(52, -10); g.quadraticCurveTo(40, -8, 28, -9); g.closePath();
        g.moveTo(48, -17); g.lineTo(46, -23); g.lineTo(51, -17); g.closePath();
      };
      c.save(); c.globalAlpha = a; c.translate(X, y); c.scale(S, S);
      const ridge = g => { g.beginPath(); g.moveTo(-220, 260); g.quadraticCurveTo(-130, 40, -60, -2); g.quadraticCurveTo(-30, -12, -20, -10); g.quadraticCurveTo(20, -14, 60, -4); g.quadraticCurveTo(110, 10, 150, 90); g.lineTo(240, 260); g.closePath(); };
      const zt = Z.zeit && Z.zeit(), hz = mixHex(zt && zt.H ? zt.H.sky[2] : "#3e2c44", "#1a1020", 0.1), hzg = c.createLinearGradient(0, -20, 0, 140); hzg.addColorStop(0, hz); hzg.addColorStop(0.6, hz.replace("rgb", "rgba").replace(")", ",.85)")); hzg.addColorStop(1, hz.replace("rgb", "rgba").replace(")", ",0)"));
      c.save(); c.translate(0, -1); c.fillStyle = "rgba(236,214,226,.22)"; ridge(c); c.fill(); c.restore();
      c.fillStyle = hzg; ridge(c); c.fill();
      c.save(); c.translate(0, -1.4); c.fillStyle = "rgba(236,214,226,.42)"; shape(c); c.fill(); c.restore();
      c.fillStyle = "#1c1220"; shape(c); c.fill();
      if (eo > 0.02) { c.fillStyle = "#ffb030"; c.beginPath(); c.ellipse(46, -15.5, 2.4, 1 * eo, 0, 0, TAU); c.fill(); c.fillStyle = "#1a0a04"; c.fillRect(45.7, -16.2, 0.6, 1.4 * eo); }
      c.restore();
      c.save(); c.globalCompositeOperation = "lighter";
      glow(c, X + 60 * S, y - 13 * S, 6 + br * 5, "rgba(255,120,40,1)", a * (0.3 + br * 0.45)); if (eo > 0.02) glow(c, X + 46 * S, y - 15.5 * S, 5, "rgba(255,190,80,1)", a * eo * 0.8);
      const k = (t * 0.25) % 1; c.globalCompositeOperation = "source-over"; c.globalAlpha = a * (1 - k) * 0.35; c.strokeStyle = "#9a8a90"; c.lineWidth = 0.9; c.beginPath(); c.ellipse(X + 62 * S + k * 8, y - 16 * S - k * 30, 2 + k * 5, 1 + k * 2.4, 0, 0, TAU); c.stroke();
      c.restore();
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + Z.cam.h * 0.4 }), seenFree: true });

  /* ---- 19. Der Spiegel der anderen Zeit ---- */
  def({ id: "spiegel", tier: 2, n: ["Der Spiegel der anderen Zeit", "The mirror of another time"], hint: ["in Hallen, Türmen und Kellern", "in halls, towers and cellars"],
    d: ["Ein Spiegel zeigt den Raum im Sonnenlicht, mit Blumen und Fahnen – und Ezekiel mit einem Blumenkranz auf den Hörnern. Sein Spiegelbild winkt. Er nicht.", "A mirror shows the room in sunlight, with flowers and banners – and Ezekiel with a wreath of flowers on his horns. His reflection waves. He doesn't."],
    where: k => k.bg === "halls" || k.bg === "spires" || k.bg === "belltower" || k.bg === "cellar" || k.bg === "castle" || k.bg === "dungeon",
    start(s) {
      const p = Z.player; let spot = null;
      for (let i = 0; i < 200 && !spot; i++) { const x = p.x + p.w / 2 + rnd(50, 140) * (Math.random() < 0.5 ? -1 : 1), y = floorY(x, p.y - 10, 4); if (y == null || Math.abs(y - (p.y + p.h)) > 8) continue; const tx = Math.floor(x / T), ty = y / T - 1; if (airFree(tx, ty) && airFree(tx, ty - 1) && airFree(tx, ty - 2) && floorY(x - 10, y - 8, 2) === y && floorY(x + 10, y - 8, 2) === y) spot = { x, y }; }
      if (!spot) return false; s.x = spot.x; s.y = spot.y; s.life = 40; s.hist = []; s.wave = 0; preload("wSchale"); setTimeout(() => snd("wSchale", { vol: 0.2, x: s.x }), 500);
    },
    tick(s, dt) { const p = Z.player; s.hist.push({ x: p.x + p.w / 2, y: p.y + p.h, f: p.face || 1, t: s.t }); while (s.hist.length && s.hist[0].t < s.t - 0.45) s.hist.shift(); const near = Math.abs(p.x + p.w / 2 - s.x) < 40; s.near = (s.near || 0) + ((near ? 1 : 0) - (s.near || 0)) * Math.min(1, dt * 2); if (near) s.wave += dt; return s.t < s.life; },
    mid(c, s, t) {
      const x = s.x, y = s.y, a = Math.min(1, s.t / 1.5) * Math.min(1, (s.life - s.t) / 2), rx = 8, ry = 15, cy = y - 22;
      c.globalAlpha = a;
      c.fillStyle = "#3a2a1a"; c.fillRect(x - 7, y - 3, 2, 3); c.fillRect(x + 5, y - 3, 2, 3); c.fillRect(x - 6, y - 5, 12, 2);
      c.save(); c.beginPath(); c.ellipse(x, cy, rx, ry, 0, 0, TAU); c.clip();
      /* die andere Zeit: warmes Sonnenlicht, Fenster, Fahne, Blumen */
      const g = c.createLinearGradient(0, cy - ry, 0, cy + ry); g.addColorStop(0, "#f8d8a0"); g.addColorStop(0.6, "#f0b888"); g.addColorStop(1, "#c88a60"); c.fillStyle = g; c.fillRect(x - rx, cy - ry, rx * 2, ry * 2);
      c.fillStyle = "rgba(255,250,230,.7)"; c.beginPath(); c.moveTo(x - 4, cy - 2); c.lineTo(x - 4, cy - 9); c.arc(x - 1.5, cy - 9, 2.5, PI, 0); c.lineTo(x + 1, cy - 2); c.fill();
      c.fillStyle = "rgba(255,255,240,.25)"; c.beginPath(); c.moveTo(x - 4, cy - 2); c.lineTo(x + 1, cy - 2); c.lineTo(x + 8, cy + 14); c.lineTo(x + 1, cy + 14); c.fill();
      c.fillStyle = "#b8303a"; c.fillRect(x + 3, cy - 12, 3, 7); c.fillStyle = "#e8b040"; c.fillRect(x + 4, cy - 10, 1, 1);
      for (let k = 0; k < 6; k++) { c.fillStyle = ["#e85a6a", "#f0d050", "#ffffff", "#e87ab0"][k % 4]; c.beginPath(); c.arc(x - 6 + k * 2.3, cy + ry - 3 - (k % 2), 0.9, 0, TAU); c.fill(); }
      /* Spiegelbild mit 0,45 s Verzögerung – und mit Blumenkranz */
      const h = s.hist[0]; if (h && Math.abs(h.x - x) < 24) { const fx = h.x, fy = cy + ry - 1; c.save(); c.translate(fx, fy); c.scale(h.f, 1);
        c.fillStyle = "#8a1a1a"; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-2, -9); c.lineTo(2, -9); c.lineTo(3.5, 0); c.fill(); c.fillStyle = "#2a1a1a"; c.fillRect(-1.5, -12, 3, 3.2);
        c.fillStyle = "#b02020"; c.beginPath(); c.arc(0, -13.5, 2.4, 0, TAU); c.fill(); c.strokeStyle = "#2a1a14"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-1.5, -15); c.quadraticCurveTo(-3, -18, -1.4, -19.5); c.moveTo(1.5, -15); c.quadraticCurveTo(3, -18, 1.6, -19.5); c.stroke();
        for (let k = 0; k < 5; k++) { c.fillStyle = ["#f0d050", "#e85a6a", "#ffffff", "#e87ab0", "#f0a040"][k]; c.beginPath(); c.arc(-2.4 + k * 1.2, -15.6 - Math.sin(k / 4 * PI) * 0.8, 0.6, 0, TAU); c.fill(); }
        if (s.wave > 1.5) { const w = Math.sin(t * 8) * 0.5; c.strokeStyle = "#8a1a1a"; c.lineWidth = 1; c.beginPath(); c.moveTo(1.5, -8); c.lineTo(4 + w, -13); c.stroke(); }
        c.restore(); }
      c.restore();
      /* Goldrahmen */
      c.strokeStyle = "#8a6a2a"; c.lineWidth = 2; c.beginPath(); c.ellipse(x, cy, rx + 1, ry + 1, 0, 0, TAU); c.stroke(); c.strokeStyle = "#e8c060"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x, cy, rx + 1.6, ry + 1.6, 0, PI * 1.1, PI * 1.7); c.stroke();
      c.fillStyle = "#c8a040"; c.beginPath(); c.arc(x, cy - ry - 2, 1.6, 0, TAU); c.fill();
      c.globalAlpha = 1;
    },
    front(c, s, t) { c.globalCompositeOperation = "lighter"; const a = Math.min(1, s.t / 1.5) * Math.min(1, (s.life - s.t) / 2); glow(c, s.x, s.y - 22, 22, "rgba(255,210,150,1)", a * (0.22 + 0.12 * (s.near || 0))); },
    light(add, s) { add(s.x, s.y - 22, 40, "#ffd8a0", 0.4); },
    at: s => ({ x: s.x, y: s.y - 20 }) });

  /* ---- 20. Das lebende Gemälde ---- */
  const POSES = 5;
  def({ id: "gemaelde", tier: 2, n: ["Das lebende Gemälde", "The living painting"], hint: ["in den Hallen", "in the halls"],
    d: ["Ein Gemälde, dessen Dame sich bewegt, sobald man nicht hinsieht. Mal winkt sie, mal ist sie fort, mal sitzt eine Katze auf ihrem Stuhl.", "A painting whose lady moves the moment you look away. Sometimes she waves, sometimes she's gone, sometimes a cat sits in her chair."],
    where: k => k.bg === "halls" || k.bg === "castle" || k.bg === "spires" || k.bg === "belltower",
    start(s) { const p = pc(); const sp = wallSpot(p.x, p.y - 26, 140, 50, (tx, ty) => Math.abs(tx * T - p.x) > 40 && wallFree(tx + 1, ty) && wallFree(tx - 1, ty) && wallFree(tx, ty - 1) && wallFree(tx + 1, ty - 1) && wallFree(tx - 1, ty - 1)); if (!sp) return false; s.x = sp.x; s.y = sp.y - 6; s.pose = 0; s.away = 0; s.life = 70; s.changes = 0; stay.push({ kind: "painting", s }); },
    tick(s, dt) {
      const p = Z.player, looking = inCam(s.x, s.y, -10) && Math.sign(s.x - (p.x + p.w / 2)) === (p.face || 1);
      if (!looking) { s.away += dt; if (s.away > 0.7) { s.away = -2; let np; do np = (Math.random() * POSES) | 0; while (np === s.pose); s.pose = np; s.changes++; snd("klang/fx_ka_creak2.mp3", { vol: 0.08, x: s.x, rate: 1.3 }); /* Klang: der Rahmen knarzt */ } } else if (s.away > 0) s.away = 0; else s.away = Math.min(0, s.away + dt);
      return s.t < s.life;
    },
    at: s => ({ x: s.x, y: s.y }) });
  function drawPainting(c, s, t) {
    const x = s.x, y = s.y, w = 22, h = 17;
    c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x - w / 2 - 1, y - h / 2 + 1, w + 4, h + 4);
    c.fillStyle = "#7a5a1e"; c.fillRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4); c.fillStyle = "#d8b050"; c.fillRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, 0.8); c.fillRect(x - w / 2 - 2, y - h / 2 - 2, 0.8, h + 4);
    c.fillStyle = "#3a2430"; c.fillRect(x - w / 2, y - h / 2, w, h);
    c.save(); c.beginPath(); c.rect(x - w / 2, y - h / 2, w, h); c.clip();
    const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, "#5a3a3a"); g.addColorStop(1, "#2a1a20"); c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
    c.fillStyle = "#4a6a3a"; c.fillRect(x - w / 2, y + 3, w, h); c.fillStyle = "#e8b878"; c.beginPath(); c.arc(x + 7, y - 5, 2, 0, TAU); c.fill();
    /* Stuhl */
    c.fillStyle = "#6a3a1a"; c.fillRect(x - 5, y - 2, 1.2, 9); c.fillRect(x - 5, y + 3, 7, 1.2); c.fillRect(x + 1, y + 3, 1, 4);
    const pose = s.pose;
    if (pose !== 3) {
      const lx = pose === 4 ? x - 5 : x - 1.5, dress = "#8a1a3a";
      c.fillStyle = dress; c.beginPath(); c.moveTo(lx - 3.5, y + 8); c.lineTo(lx - 1.5, y - 1); c.lineTo(lx + 1.5, y - 1); c.lineTo(lx + 3.5, y + 8); c.fill();
      c.fillStyle = "#e8c8a8"; c.beginPath(); c.arc(lx, y - 3, 1.8, 0, TAU); c.fill(); c.fillStyle = "#4a2a14"; c.beginPath(); c.arc(lx, y - 3.8, 2, PI, TAU); c.fill();
      const look = pose === 1 ? Math.sign(Z.player.x - x) * 0.6 : 0; c.fillStyle = "#1a1010"; c.fillRect(lx - 0.9 + look, y - 3.2, 0.5, 0.5); c.fillRect(lx + 0.5 + look, y - 3.2, 0.5, 0.5);
      if (pose === 2) { c.strokeStyle = "#e8c8a8"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(lx + 1.4, y); c.lineTo(lx + 3.5 + Math.sin(t * 8) * 0.6, y - 4); c.stroke(); }
    }
    if (pose === 3 || pose === 4) { /* eine Katze auf dem Stuhl */ c.fillStyle = "#2a2224"; c.beginPath(); c.ellipse(x - 2 + (pose === 4 ? 4 : 0), y + 1.8, 2.6, 1.4, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 0.6 + (pose === 4 ? 4 : 0), y + 0.4, 1.2, 0, TAU); c.fill(); }
    c.restore();
    c.fillStyle = "#1a1210"; c.fillRect(x - 0.6, y - h / 2 - 6, 1.2, 1.2); c.strokeStyle = "rgba(200,170,100,.5)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, y - h / 2 - 5.4); c.lineTo(x - 7, y - h / 2 - 2); c.moveTo(x, y - h / 2 - 5.4); c.lineTo(x + 7, y - h / 2 - 2); c.stroke();
  }

  /* ---- 21. Der Lichtwal ---- */
  def({ id: "lichtwal", tier: 2, n: ["Der Lichtwal", "The light whale"], hint: ["tief am schwarzen See", "deep by the black lake"],
    d: ["Ein Wal aus mattem Licht zieht durch die Dunkelheit über dem See und singt. Niemand weiß, wie er hierherkam.", "A whale of faint light drifts through the darkness above the lake and sings. Nobody knows how it got here."],
    where: k => k.back && k.bg === "lake",
    start(s) { s.h = viewHole(); if (!s.h) return false; s.dir = Math.random() < 0.5 ? -1 : 1; s.life = 30; preload("wWal"); setTimeout(() => snd("wWal", { vol: 0.2, rate: 0.8 }), 5000); },
    tick(s) { return s.t < s.life; },
    back(c, s, t, cam, oy, LH) {
      const u = s.t / s.life, a = Math.min(1, s.t / 5) * Math.min(1, (s.life - s.t) / 5), x = s.dir > 0 ? cam.x - 140 + u * (cam.w + 280) : cam.x + cam.w + 140 - u * (cam.w + 280), y = s.h.y + Math.sin(t * 0.5) * 6;
      c.save(); c.translate(x, y); c.scale(s.dir, 1); c.globalCompositeOperation = "lighter";
      c.globalAlpha = a * 0.22; c.fillStyle = "#7ae0b0"; c.beginPath(); c.moveTo(60, 0); c.quadraticCurveTo(50, -20, 10, -18); c.quadraticCurveTo(-40, -16, -70, -2); c.quadraticCurveTo(-40, 10, 10, 14); c.quadraticCurveTo(50, 14, 60, 0); c.fill();
      const fl = Math.sin(t * 1.2) * 8; c.beginPath(); c.moveTo(-68, -2); c.quadraticCurveTo(-84, -14 + fl, -96, -18 + fl); c.quadraticCurveTo(-86, -2, -96, 12 + fl); c.quadraticCurveTo(-84, 8 + fl, -68, 2); c.fill();
      c.beginPath(); c.moveTo(14, 10); c.quadraticCurveTo(4, 26 + fl * 0.5, -10, 24); c.quadraticCurveTo(0, 16, 6, 10); c.fill();
      for (let k = 0; k < 9; k++) glow(c, 40 - k * 12, -12 + Math.sin(k) * 2, 4, "rgba(200,255,220,1)", a * (0.4 + 0.3 * Math.sin(t * 2 + k)));
      glow(c, 44, -4, 3, "rgba(255,255,230,1)", a * 0.8);
      c.restore();
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + Z.cam.h * 0.4 }), seenFree: true });

  /* ---- 22. Der Glückskäfer ---- */
  def({ id: "marienkaefer", tier: 0, n: ["Der Glückskäfer", "The lucky beetle"], hint: ["wo es grünt", "where things grow green"],
    d: ["Ein Marienkäfer landet auf Ezekiels Schulter und fährt ein Stück mit. Bei der nächsten Rolle ist er weg.", "A ladybird lands on Ezekiel's shoulder and rides along for a while. At the next roll it's gone."],
    where: k => k.out || k.bg === "castle" || k.bg === "lake" || k.bg === "dungeon" || k.area === "passage",
    start(s) { const p = pc(); s.x = p.x + rnd(-120, 120); s.y = p.y - rnd(60, 100); s.life = 40; s.mode = "in"; },
    tick(s, dt) {
      const p = Z.player, ax = p.x + p.w / 2 - (p.face || 1) * 2.5, ay = p.y + 5;
      if (s.mode === "in") { const dx = ax - s.x, dy = ay - s.y, d = Math.hypot(dx, dy); if (d < 2) s.mode = "sit"; else { const v = Math.min(d, (40 + d) * dt); s.x += dx / d * v + Math.sin(s.t * 13) * 0.6; s.y += dy / d * v + Math.cos(s.t * 11) * 0.5; } }
      else if (s.mode === "sit") { s.x = ax; s.y = ay; if (p.rollT > 0 || s.leave || s.t > s.life - 3) { s.mode = "out"; s.vx = rnd(-40, 40); } }
      else { s.x += s.vx * dt + Math.sin(s.t * 13) * 0.6; s.y -= 45 * dt; return inCam(s.x, s.y, 20); }
      return true;
    },
    front(c, s, t) {
      const fly = s.mode !== "sit", x = s.x, y = s.y;
      if (fly) { const w = Math.abs(Math.sin(t * 40)); c.globalAlpha = 0.5; c.fillStyle = "#f0e8e0"; c.beginPath(); c.ellipse(x - 1.4, y - 1, 1.6, 0.5 + w, -0.6, 0, TAU); c.ellipse(x + 1.4, y - 1, 1.6, 0.5 + w, 0.6, 0, TAU); c.fill(); c.globalAlpha = 1; }
      c.fillStyle = "#d02a1e"; c.beginPath(); c.ellipse(x, y, 1.5, 1.2, 0, PI, TAU); c.fill(); c.fillRect(x - 1.5, y - 0.1, 3, 0.4); c.fillStyle = "#1a1010"; c.fillRect(x - 0.15, y - 1.2, 0.3, 1.2); c.fillRect(x - 0.9, y - 0.8, 0.5, 0.5); c.fillRect(x + 0.5, y - 0.7, 0.5, 0.5); c.beginPath(); c.arc(x + 1.5, y - 0.3, 0.6, 0, TAU); c.fill();
    }, at: s => ({ x: s.x, y: s.y }) });

  /* ---- 23. Der Fuchs ---- */
  def({ id: "fuchs", tier: 0, n: ["Der Fuchs", "The fox"], hint: ["im Torhof und im Lager", "in the gate yard and in camp"],
    d: ["Ein Fuchs trottet heran, setzt sich, mustert Ezekiel mit schiefem Kopf – und entscheidet, dass er kein Huhn ist.", "A fox trots up, sits, studies Ezekiel with its head tilted – and decides he is not a chicken."],
    where: k => k.out && (k.bg === "castle" || k.area === "lager" || k.bg === "ramparts"),
    start(s) { const p = Z.player, py = p.y + p.h; let side = Math.random() < 0.5 ? -1 : 1, x = 0, y = null;
      for (let tr = 0; tr < 2 && y == null; tr++, side = -side) for (let f = 0.55; f > 0.2 && y == null; f -= 0.05) { const xx = p.x + p.w / 2 + side * Z.cam.w * f, yy = groundNear(xx, py); if (yy != null && Math.abs(yy - py) <= T) { x = xx; y = yy; } }
      if (y == null) return false; side = Math.sign(x - p.x) || 1; s.side = side; s.x = x; s.y = y; s.face = -side; s.mode = "in"; s.walk = 0; s.sit = 0; s.life = 30; },
    tick(s, dt) {
      const p = Z.player, px = p.x + p.w / 2;
      if (s.mode === "in") { const tx = px + s.side * 46; if (Math.abs(tx - s.x) < 3) { s.mode = "sit"; s.st = 0; snd("amb/n_fuchs_" + (1 + ((Math.random() * 4) | 0)) + ".mp3", { vol: 0.16, x: s.x }); /* Klang: Fuchslaut */ } else { s.face = Math.sign(tx - s.x); s.x += s.face * 60 * dt; s.walk += dt * 15; } }
      else if (s.mode === "sit") { s.face = Math.sign(px - s.x) || s.face; s.sit = Math.min(1, s.sit + dt * 2); s.st += dt; if (s.st > 6 || s.leave || Math.abs(px - s.x) < 22 || s.t > s.life) { s.mode = "out"; s.face = s.side; } }
      else { s.sit = Math.max(0, s.sit - dt * 4); s.x += s.face * 110 * dt; s.walk += dt * 26; if (!inCam(s.x, s.y, 40)) return false; }
      const gy = groundNear(s.x, s.y); if (gy != null) s.y += (gy - s.y) * Math.min(1, dt * 12);
      return true;
    },
    mid(c, s, t) {
      const x = s.x, y = s.y, f = s.face, st = s.sit, wk = st > 0.5 ? 0 : Math.sin(s.walk), tilt = s.mode === "sit" ? Math.sin(s.st * 1.3) * 0.25 : 0;
      c.save(); c.translate(x, y); c.scale(f, 1);
      c.globalAlpha = 0.3; c.fillStyle = "#000"; c.beginPath(); c.ellipse(0, 0, 9, 1.3, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
      /* buschiger Schwanz mit weißer Spitze */
      const sw = Math.sin(t * 1.8) * 2; c.fillStyle = "#b8521e"; c.beginPath(); c.moveTo(-5, -5 + st * 2); c.quadraticCurveTo(-14, -9 + sw, -16, -2 + st * 3); c.quadraticCurveTo(-11, -2, -5, -3); c.fill(); c.fillStyle = "#f0e8dc"; c.beginPath(); c.ellipse(-15.4, -2.6 + st * 3 + sw * 0.2, 2, 1.4, 0.4, 0, TAU); c.fill();
      c.fillStyle = "#1e1410"; if (st < 0.5) { c.fillRect(-4 + wk, -3.5, 1.2, 3.5); c.fillRect(3 - wk, -3.5, 1.2, 3.5); c.fillRect(-3 - wk, -3.5, 1.2, 3.5); c.fillRect(4 + wk, -3.5, 1.2, 3.5); } else { c.fillRect(2.4, -4, 1.2, 4); c.fillRect(3.8, -4, 1.2, 4); }
      c.fillStyle = "#c45c22"; c.beginPath(); if (st < 0.5) c.ellipse(0, -6, 6.5, 3, 0, 0, TAU); else c.ellipse(-0.5, -6.5, 4.5, 4.5, -0.5, 0, TAU); c.fill();
      c.fillStyle = "#f0e4d4"; c.beginPath(); c.ellipse(st < 0.5 ? 3.5 : 2.5, st < 0.5 ? -4.8 : -6, 2.4, 1.6, 0, 0, TAU); c.fill();
      const hx = st < 0.5 ? 6 : 3.8, hy = st < 0.5 ? -8 : -12; c.save(); c.translate(hx, hy); c.rotate(tilt);
      c.fillStyle = "#c45c22"; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill(); c.beginPath(); c.moveTo(1.5, -0.5); c.lineTo(5.2, 1); c.lineTo(1.5, 2); c.fill(); c.fillStyle = "#f0e4d4"; c.beginPath(); c.moveTo(1.4, 0.8); c.lineTo(5, 1.2); c.lineTo(1.4, 2.2); c.fill(); c.fillStyle = "#1a1010"; c.fillRect(4.8, 0.6, 0.8, 0.8);
      c.fillStyle = "#8a3a14"; c.beginPath(); c.moveTo(-2, -1); c.lineTo(-1.4, -5); c.lineTo(0.2, -1.6); c.moveTo(0.4, -1.8); c.lineTo(1.4, -5.2); c.lineTo(2.2, -1); c.fill(); c.fillStyle = "#1a1010"; c.fillRect(0.8, -0.7, 0.8, 0.8); c.restore();
      c.restore();
    }, at: s => ({ x: s.x, y: s.y - 6 }) });

  /* ---- 24. Das Sternbild ---- */
  const STARFIG = [[0, -30], [-5, -38], [5, -38], [0, -22], [-9, -16], [9, -16], [-4, 0], [4, 0], [14, -26]];
  const STARLINES = [[1, 0], [2, 0], [0, 3], [3, 4], [3, 5], [3, 6], [3, 7], [5, 8]];
  def({ id: "sternbild", tier: 2, n: ["Das Sternbild des Zerstörers", "The Destroyer's constellation"], hint: ["in klaren Nächten unter freiem Himmel", "on clear nights under open sky"],
    d: ["Einige Sterne leuchten heller als die anderen und verbinden sich: eine Gestalt mit Hörnern und Schwert. Irgendjemand dort oben kennt ihn.", "Some stars shine brighter than the rest and join up: a figure with horns and a sword. Someone up there knows him."],
    where: k => k.back && k.out && k.night && k.mood !== "regen" && k.mood !== "gewitter" && k.bg !== "storm",
    start(s) { s.h = viewHole(); if (!s.h || s.h.run < 8) return false; s.life = 22; s.x = s.h.rx; s.y = s.h.ry + 8; preload("wSchale"); setTimeout(() => snd("wSchale", { vol: 0.15 }), 1500); },
    tick(s) { return s.t < s.life; },
    back(c, s, t) {
      const a = Math.min(1, (s.life - s.t) / 4), sc = 1.6; c.globalCompositeOperation = "lighter";
      for (let i = 0; i < STARLINES.length; i++) { const u = clamp((s.t - 3 - i * 0.7) / 1.2, 0, 1); if (u <= 0) continue; const [p1, p2] = STARLINES[i], A1 = STARFIG[p1], A2 = STARFIG[p2]; c.globalAlpha = a * 0.45; c.strokeStyle = "#ffe8c8"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(s.x + A1[0] * sc, s.y + A1[1] * sc); c.lineTo(s.x + (A1[0] + (A2[0] - A1[0]) * u) * sc, s.y + (A1[1] + (A2[1] - A1[1]) * u) * sc); c.stroke(); }
      c.globalAlpha = 1;
      for (let i = 0; i < STARFIG.length; i++) { const u = clamp((s.t - i * 0.25) / 1.5, 0, 1), tw = 0.75 + 0.25 * Math.sin(t * 3 + i * 2); glow(c, s.x + STARFIG[i][0] * sc, s.y + STARFIG[i][1] * sc, 5, "rgba(255,240,210,1)", a * u * tw * 0.8); c.globalAlpha = a * u; c.fillStyle = "#fffaf0"; c.fillRect(s.x + STARFIG[i][0] * sc - 0.6, s.y + STARFIG[i][1] * sc - 0.6, 1.2, 1.2); c.globalAlpha = 1; }
    }, at: () => ({ x: Z.cam.x + Z.cam.w / 2, y: Z.cam.y + 30 }), seenFree: true });

  /* ---- 25. Der Pilzring ---- */
  def({ id: "pilzring", tier: 1, n: ["Der leuchtende Pilzring", "The glowing fairy ring"], hint: ["in Höhlen und am See", "in caves and by the lake"],
    d: ["Rund um Ezekiel leuchten Pilze auf, einer nach dem anderen, und jeder singt einen Ton. Ein Hexenring – und er steht mittendrin.", "All around Ezekiel mushrooms light up one after another, each singing a note. A fairy ring – and he is standing in the middle of it."],
    where: k => k.bg === "lake" || k.bg === "chasm" || k.bg === "dungeon" || k.bg === "cellar",
    start(s) {
      const p = Z.player, py = p.y + p.h; s.m = [];
      for (let i = 0; i < 9; i++) { const x = p.x + p.w / 2 + (i - 4) * 11 + rnd(-2, 2), y = groundNear(x, py); if (y != null && Math.abs(y - py) < 2 * T) s.m.push({ x, y, h: rnd(3, 5.5), i, col: pick(["#e080c0", "#c0e070", "#f0b060", "#b080f0"]) }); }
      if (s.m.length < 5) return false; s.life = 14;
      tune("w_pilzring", ["harfe", "cel"], s.m.map((m, k) => [[0, 3, 7, 12, 15, 19, 24, 19, 15][k % 9], k * 1, 3]), 0.08, 0);
    },
    tick(s) { return s.t < s.life; },
    mid(c, s, t) { for (const m of s.m) { c.fillStyle = "#d8ccb8"; c.fillRect(m.x - 0.5, m.y - m.h, 1, m.h); c.fillStyle = m.col; c.beginPath(); c.ellipse(m.x, m.y - m.h, 2.4, 1.6, 0, PI, TAU); c.fill(); } },
    front(c, s, t) { c.globalCompositeOperation = "lighter"; const out = Math.min(1, (s.life - s.t) / 3); for (const m of s.m) { const on = clamp((s.t - 0.6 - m.i * 0.45) / 0.4, 0, 1), pul = 0.7 + 0.3 * Math.sin(t * 3 + m.i); glow(c, m.x, m.y - m.h, 9, m.col.replace("#", "") && hexA(m.col), on * pul * 0.6 * out); } },
    light(add, s) { for (const m of s.m) if (s.t > 0.6 + m.i * 0.45) add(m.x, m.y - m.h, 22, m.col, 0.25); },
    at: s => s.m[0] });
  function hexA(h) { const n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + ",1)"; }

  /* ======================= ABLAUF ======================= */
  const BYID = {}; for (const d of DEFS) BYID[d.id] = d;
  const WEIGHT = [10, 4, 1.2];
  let cur = null, lvRef = null, next = 0, visit = { n: 0, used: {} }, stay = [];
  function setup(lv) { lvRef = lv; cur = null; stay = []; visit = { n: 0, used: {} }; next = rnd(14, 40); }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };
  function begin(d, forced) {
    const k = ctx(), s = { def: d, t: 0, seen: 0, leave: false, forced };
    try { if (d.start(s, k) === false) return false; } catch (e) { console.error(e); return false; }
    cur = s; visit.n++; visit.used[d.id] = 1; return true;
  }
  function roll() {
    const k = ctx(), M = meta(); let sum = 0; const c = [];
    for (const d of DEFS) { if (visit.used[d.id]) continue; let ok = false; try { ok = d.where(k); } catch (_) {} if (!ok) continue; const w = WEIGHT[d.tier] * (M[d.id] ? 1 : 1.6); c.push([d, w]); sum += w; }
    for (let tries = 0; tries < 3 && c.length; tries++) {
      let r = Math.random() * sum, pickD = c[0][0]; for (const [d, w] of c) { r -= w; if (r <= 0) { pickD = d; break; } }
      if (begin(pickD)) return true;
    }
    return false;
  }
  function finish() { if (cur && cur.def.end) try { cur.def.end(cur); } catch (_) {} cur = null; }
  function markSeen(s) {
    const d = s.def, M = meta(), first = !M[d.id]; M[d.id] = (M[d.id] || 0) + 1; Z.saveMeta && Z.saveMeta();
    const n = DEFS.filter(x => M[x.id]).length;
    if (Z.ui && Z.ui.notify) Z.ui.notify((first ? L(["Neues Wunder: ", "New wonder: "]) : L(["Ein Wunder: ", "A wonder: "])) + "<b>" + L(d.n) + "</b>" + (first ? " <small>(" + n + "/" + DEFS.length + ")</small>" : ""), { prio: first ? 1 : 0, key: "wunder", icon: "✧", dauer: first ? 3600 : 2200 });
    if (first && A && A.ok) snd("uiOk", { vol: 0.25 });
  }
  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    if (!Z.level || Z.level !== lvRef) return;
    if (!on()) { if (cur) finish(); return; }
    if (cur) {
      const s = cur; s.t += dt;
      if (!s.leave && !s.forced && !calm()) { s.leave = true; s.life = Math.min(s.life || 99, s.t + 3); }
      let alive = true; try { alive = s.def.tick(s, dt) !== false; } catch (e) { console.error(e); alive = false; }
      if (!s.seenDone) { const pt = s.def.at && s.def.at(s); if (pt && (s.def.seenFree || inCam(pt.x, pt.y, -8))) { s.seen += dt; if (s.seen > 1.2) { s.seenDone = 1; markSeen(s); } } }
      if (!alive) finish();
      return;
    }
    if (visit.n >= 3 || Z.level.arena && !Z.bossDefeated) return;
    next -= dt; if (next > 0) return;
    if (!calm()) { next = 6; return; }
    next = rnd(45, 95);
    if (Math.random() < 0.5) roll();
  };
  /* ---------- Zeichnen ---------- */
  function draw(layer, c, args) {
    if (!on()) return;
    if (cur && cur.def[layer]) { c.save(); try { cur.def[layer].apply(null, [c, cur].concat(args)); } catch (e) { console.error("wunder", cur.def.id, e); cur = null; } c.restore(); }
  }
  const back0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) { if (back0) back0.apply(this, arguments); if (Z.level === lvRef) draw("back", c, [t, cam, oy, LH]); };
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0.apply(this, arguments);
    if (Z.level !== lvRef || !on()) return;
    for (const o of stay) { if (o.kind === "nest" ? !inCam(o.x, o.y, 30) : !inCam(o.s.x, o.s.y, 40)) continue; c.save(); try { if (o.kind === "nest") drawNest(c, o, t); else if (o.kind === "web") drawWeb(c, o.s, t); else if (o.kind === "painting") drawPainting(c, o.s, t); } catch (e) { console.error(e); } c.restore(); }
    draw("mid", c, [t, cam]);
  };
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) { if (al0) al0.apply(this, arguments); if (Z.level === lvRef) draw("front", c, [t, cam]); };
  /* Lichter der Wunder färben die Szene (Laterne der Pilzwesen, Irrlicht, Funkenvogel, Spiegel) */
  if (Z.gfx.lightGather) Z.gfx.lightGather.push(function (add, cam, t, lvl) { if (!cur || !cur.def.light || Z.level !== lvRef || !on()) return; try { cur.def.light(add, cur); } catch (_) {} });

  /* ---------- Fundbuch: Reiter „Wunder“ ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const TIER = [["häufig", "common"], ["selten", "rare"], ["sehr selten", "very rare"]];
  function bookHTML() {
    const M = meta(), n = DEFS.filter(d => M[d.id]).length, tabs = L(Z.TX && Z.TX.tabsCodex || [[], []]);
    let h = "<h2>" + L(["Wunder der Feste", "Wonders of the keep"]) + '</h2><div class="reiter">' + tabs.map((x, i) => '<button data-act="codexTab" data-arg="' + i + '">' + esc(x) + "</button>").join("") + '<button data-act="tbGruppe">' + L(["Die Vorgänger", "Before us"]) + '</button><button data-act="wunderBuch" class="an">' + L(["Wunder", "Wonders"]) + "</button></div>";
    h += '<p class="hinweis">' + L(["Wunder gesehen: ", "Wonders seen: "]) + "<b>" + n + "/" + DEFS.length + "</b> · " + L(["Barradin: „Ich schreibe nur auf, was ich mit eigenen Augen gesehen habe. Und was du mir erzählst. Meistens Letzteres.“", "Barradin: “I only write down what I've seen with my own eyes. And what you tell me. Mostly the latter.”"]) + '</p><div class="liste">';
    for (const tier of [0, 1, 2]) for (const d of DEFS) {
      if (d.tier !== tier) continue; const got = M[d.id];
      h += '<div class="zeile' + (got ? "" : " unbekannt") + '"><div><b>' + (got ? "✧ " + esc(L(d.n)) : "???") + "</b><small>" + (got ? esc(L(d.d)) : L(["Noch nicht gesehen. Gerüchte sprechen von: ", "Not seen yet. Rumour speaks of: "]) + esc(L(d.hint))) + "</small><small>" + esc(L(TIER[d.tier])) + (got ? " · " + L(["gesehen: ", "seen: "]) + got + "×" : "") + "</small></div></div>";
    }
    return h + '</div><div class="knoepfe"><button data-act="tbCodex">' + L(["Zurück", "Back"]) + "</button></div>";
  }
  function hookUI() {
    const U = Z.ui; if (!U || !U.codex || U._wunderHook) return; U._wunderHook = true;
    U.actions = U.actions || {};
    U.actions.wunderBuch = () => { U.close(); U.open(bookHTML(), { cls: "breit" }); };
    const codex0 = U.codex;
    U.codex = function () {
      const r = codex0.apply(this, arguments);
      const tabs = document.querySelector("#modal .reiter");
      if (tabs && !tabs.querySelector('[data-act="wunderBuch"]')) { const b = document.createElement("button"); b.dataset.act = "wunderBuch"; b.textContent = L(["Wunder", "Wonders"]); tabs.appendChild(b); }
      return r;
    };
    if (!U.actions.tbCodex) U.actions.tbCodex = () => { U.close(); U.codex(); };
    /* auch auf der Seite „Die Vorgänger“ (tagebuch.js) den Reiter anbieten */
    const grp0 = U.actions.tbGruppe;
    if (grp0) U.actions.tbGruppe = function () { const r = grp0.apply(this, arguments); const tabs = document.querySelector("#modal .reiter"); if (tabs && !tabs.querySelector('[data-act="wunderBuch"]')) { const b = document.createElement("button"); b.dataset.act = "wunderBuch"; b.textContent = L(["Wunder", "Wonders"]); tabs.appendChild(b); } return r; };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hookUI); else setTimeout(hookUI, 0);

  /* ---------- Prüfhilfen ---------- */
  Z.wunder = {
    list: () => DEFS.map(d => ({ id: d.id, tier: d.tier, n: L(d.n), seen: meta()[d.id] || 0 })),
    force(id) { if (!Z.level) return false; lvRef = Z.level; finish(); const d = BYID[id]; if (!d) return "unbekannt: " + Object.keys(BYID).join(", "); return begin(d, true) ? id : "geht hier nicht"; },
    stop: () => finish(), cur: () => cur && { id: cur.def.id, t: cur.t, seen: !!cur.seenDone, at: cur.def.at && cur.def.at(cur) }, _s: () => cur, stay: () => stay.length, count: () => DEFS.length,
    seen: () => DEFS.filter(d => meta()[d.id]).length
  };
})();
