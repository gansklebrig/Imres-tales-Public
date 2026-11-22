/* Ezekiel – The Destroyer · Spuren
   Kleine Geschichten im Aufbau der Welt: Wer vor Ezekiel hier war, hat Spuren hinterlassen.
   Ein Abenteurer, der an der Wand zusammengesunken ist – sein Fund liegt noch neben ihm.
   Einer, der den kurzen Weg nach unten nehmen wollte. Ein Opfer der Falle direkt daneben.
   Ein letztes Gefecht hinter Kisten, ein erkaltetes Lager, ein Ritualkreis, ein Kokon im Netz.
   Wer nah herangeht, liest eingeritzte Worte. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH, L = v => Z.L(v), A = Z.audio, FX = Z.fx;
  const TAU = Math.PI * 2;
  let list = [], lvRef = null;

  const NOTES = {
    abenteurer: [
      ["„Nur noch kurz ausruhen.“", "“Just a short rest.”"],
      ["„Sagt Mira, ich hab es versucht.“", "“Tell Mira I tried.”"],
      ["„Der Schatz ist echt. Der Weg zurück nicht.“", "“The treasure is real. The way back isn't.”"],
      ["„Dritter Tag. Die Fackel wird schwächer.“", "“Day three. The torch grows weak.”"],
      ["„Wer das findet: nimm es. Ich brauch es nicht mehr.“", "“Whoever finds this: take it. I won't need it.”"]
    ],
    sturz: [
      ["„Das Seil hält schon …“", "“The rope will hold…”"],
      ["Ein gerissenes Seil. Daneben ein Stiefel, ein zweiter fehlt.", "A snapped rope. One boot nearby, the other missing."],
      ["„Abkürzung“, steht auf einem Zettel. Durchgestrichen.", "“Shortcut,” says a note. Crossed out."]
    ],
    falle: [
      ["Er hat die Platte zu spät gesehen.", "He saw the plate too late."],
      ["„Vorsicht, die zweite Stufe …“ – der Rest ist unleserlich.", "“Careful, the second step…” – the rest is illegible."],
      ["Ein Beutel Münzen. Seinem Besitzer hat er nichts genützt.", "A pouch of coins. Little good it did its owner."]
    ],
    gefecht: [
      ["Pfeile in der Kiste, Pfeile in der Wand, Pfeile überall.", "Arrows in the crate, arrows in the wall, arrows everywhere."],
      ["„Sie kamen zu zehnt. Sieben hab ich erwischt.“", "“Ten of them came. I got seven.”"],
      ["Die Barrikade hat gehalten. Er nicht.", "The barricade held. He didn't."]
    ],
    lager: [
      ["Die Asche ist kalt. Jemand hat hier gewartet – auf wen?", "The ashes are cold. Someone waited here – for whom?"],
      ["„Morgen gehen wir tiefer. Heute schlafen wir.“", "“Tomorrow we go deeper. Tonight we sleep.”"],
      ["Ein halber Laib Brot, steinhart. Und eine Karte voller Kreuze.", "Half a loaf, stone hard. And a map full of crosses."]
    ],
    ritual: [
      ["Kreide, Wachs, ein Kreis. Was immer gerufen wurde – es kam.", "Chalk, wax, a circle. Whatever was called – it came."],
      ["Die Runen glimmen noch. Nicht hineintreten.", "The runes still glimmer. Don't step in."]
    ],
    kokon: [
      ["Etwas zappelt nicht mehr im Netz.", "Something has stopped struggling in the web."],
      ["Ein Stiefel ragt aus dem Gespinst.", "A boot sticks out of the silk."]
    ],
    ertrunken: [
      ["Algen in den Rippen. Der See gibt nichts zurück.", "Weed through the ribs. The lake gives nothing back."],
      ["„Der Steg war morsch.“", "“The pier was rotten.”"]
    ]
  };
  const WHO = { abenteurer: ["Eingeritzt", "Scratched"], sturz: ["Spuren", "Traces"], falle: ["Spuren", "Traces"], gefecht: ["Spuren", "Traces"], lager: ["Ein Tagebuch", "A diary"], ritual: ["Spuren", "Traces"], kokon: ["Spuren", "Traces"], ertrunken: ["Spuren", "Traces"] };

  /* ---------- Plätze finden ---------- */
  function floorSpots(lv, c) {
    const out = [], ox = c.x * CW, oy = c.y * CH;
    for (let y = oy + 1; y < oy + CH - 1; y++) for (let x = ox + 2; x < ox + CW - 2; x++) if (Z.standable(lv, x, y, 2) && Z.standable(lv, x - 1, y, 2) && Z.standable(lv, x + 1, y, 2) && lv.get(x, y + 1) !== 2) out.push([x, y]);
    return out;
  }
  const airAbove = (lv, x, y) => { let n = 0; while (n < 20 && lv.get(x, y - n - 1) === 0) n++; return n; };
  const wallSide = (lv, x, y) => (lv.get(x - 1, y) === 1 ? -1 : lv.get(x + 1, y) === 1 ? 1 : 0);
  function setup(lv) {
    list = []; lvRef = lv;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    let bh = 0; for (const ch of String(lv.biome)) bh = (bh * 31 + ch.charCodeAt(0)) >>> 0;
    const R = Z.Rng((((lv.seed || 1) * 2654435761) ^ bh) >>> 0);
    const biome = lv.biome, used = new Set();
    const near = (x, y) => (lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3) || (lv.start && Math.abs(lv.start.x - x) < 8 && Math.abs(lv.start.y - y) < 5) || list.some(s => Math.abs(s.x - x) < 10 && Math.abs(s.y - y) < 6);
    const cells = Object.keys(lv.cells).map(k => lv.cells[k]).filter(c => c !== lv.startCell);
    R.shuffle(cells);
    const want = 2 + (R() < 0.6 ? 1 : 0) + (cells.length > 12 ? 1 : 0);
    const add = (kind, x, y, extra) => { list.push(Object.assign({ kind, x, y, seed: R() * 1000, flip: R() < 0.5 ? -1 : 1, note: R.pick(NOTES[kind]), read: false }, extra || {})); };
    /* 1) Opfer einer Falle: direkt neben einer Falle */
    const traps = (lv.traps || []).filter(t => "kzpfr".includes(t.t));
    if (traps.length && R() < 0.85) {
      for (let i = 0; i < 12; i++) { const t = R.pick(traps); for (const dx of [-2, 2, -3, 3]) { const x = t.x + dx, y = t.t === "r" || t.t === "p" ? (() => { let yy = t.y; while (yy < t.y + 14 && lv.get(x, yy + 1) === 0) yy++; return yy; })() : t.y; if (Z.standable(lv, x, y, 2) && !near(x, y)) { add("falle", x, y, { trap: t.t }); i = 99; break; } } }
    }
    /* 2) Sturz: Fuß einer hohen Kante */
    for (const c of cells) {
      if (list.length >= want) break; if (used.has(c)) continue;
      const sp = floorSpots(lv, c).filter(([x, y]) => airAbove(lv, x, y) >= 9 && !near(x, y));
      if (sp.length && R() < 0.5) { const [x, y] = R.pick(sp); add("sturz", x, y); used.add(c); break; }
    }
    /* 3) die übrigen nach Gebiet */
    const kinds = ["abenteurer", "abenteurer", "gefecht", "lager"];
    if (["verlies", "schmiede", "glut", "keller"].includes(biome)) kinds.push("ritual");
    if (biome === "schlund") kinds.push("kokon", "kokon");
    if (biome === "see" || biome === "hafen") kinds.push("ertrunken", "ertrunken");
    for (const c of cells) {
      if (list.length >= want) break; if (used.has(c)) continue;
      const sp = floorSpots(lv, c).filter(([x, y]) => !near(x, y)); if (!sp.length) continue;
      const kind = c.dead && R() < 0.6 ? "gefecht" : R.pick(kinds);
      let pick = sp;
      if (kind === "abenteurer") { const w = sp.filter(([x, y]) => wallSide(lv, x, y)); if (w.length) pick = w; }
      if (kind === "kokon") { const w = sp.filter(([x, y]) => airAbove(lv, x, y) >= 5); if (!w.length) continue; pick = w; }
      const [x, y] = R.pick(pick); add(kind, x, y, { wall: wallSide(lv, x, y) }); used.add(c);
    }
    /* Beute: was der Tote zurückließ */
    for (const s of list) {
      const px = s.x * T + 8, py = (s.y + 1) * T;
      if (s.kind === "abenteurer" || s.kind === "gefecht" || s.kind === "kokon") {
        const it = Z.rollItem({ R, rar: s.kind === "gefecht" ? [20, 50, 25, 5] : [40, 40, 16, 4] });
        if (it) Z.spawnPickup("item", px + (s.flip > 0 ? 14 : -14), py - 2, { it, vx: 0, vy: 0, float: true });
      } else if (s.kind === "falle" || s.kind === "ertrunken") Z.dropGold(px, py - 6, 12 + 10 * (Z.run ? Z.run.tier : 0));
      else if (s.kind === "lager") Z.spawnPickup(R() < 0.5 ? "scroll" : "food", px + 16, py - 2, { vx: 0, vy: 0, float: true, stat: R.pick(["brut", "takt", "ueber"]), food: Z.FOOD && R.pick(Z.FOOD) });
    }
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  /* ---------- Lesen ---------- */
  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    const P = Z.player; if (!P || P.dead || Z.level !== lvRef) return;
    for (const s of list) {
      if (s.read) continue;
      const dx = s.x * T + 8 - (P.x + P.w / 2), dy = (s.y + 1) * T - (P.y + P.h);
      if (Math.abs(dx) < 30 && Math.abs(dy) < 20) { s.read = true; Z.ui.say(s.x * T + 8, s.y * T - 10, L(WHO[s.kind]), L(s.note), 4200); A.play("scroll", { vol: 0.25 }); if (Z.stats) Z.stats.spuren = (Z.stats.spuren || 0) + 1; }
    }
  };

  /* ---------- Zeichnen ---------- */
  const BONE = "#d8cfb8", BONE2 = "#a89e88";
  function bone(c, x0, y0, x1, y1, w) {
    c.strokeStyle = BONE; c.lineWidth = w || 1.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.fillStyle = BONE; for (const [x, y] of [[x0, y0], [x1, y1]]) { c.beginPath(); c.arc(x, y, (w || 1.4) * 0.75, 0, TAU); c.fill(); }
  }
  function skull(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = BONE; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.fillRect(-r * 0.55, r * 0.5, r * 1.1, r * 0.6);
    c.fillStyle = "#1a1214"; c.beginPath(); c.arc(-r * 0.38, -r * 0.05, r * 0.26, 0, TAU); c.arc(r * 0.38, -r * 0.05, r * 0.26, 0, TAU); c.fill();
    c.fillRect(-0.4, r * 0.3, 0.8, r * 0.3); for (let k = -2; k <= 2; k++) c.fillRect(k * r * 0.2 - 0.25, r * 0.75, 0.5, r * 0.35);
    c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.arc(-r * 0.3, -r * 0.45, r * 0.3, 0, TAU); c.fill();
    c.restore();
  }
  function ribs(c, x, y, w, h, rot) {
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.strokeStyle = BONE; c.lineWidth = 1; bone(c, 0, -h / 2, 0, h / 2, 1.3);
    for (let k = 0; k < 4; k++) { const yy = -h / 2 + 1.5 + k * (h - 3) / 3.5, ww = w * (1 - k * 0.08); c.strokeStyle = k % 2 ? BONE2 : BONE; c.lineWidth = 0.9; c.beginPath(); c.ellipse(0, yy + 1.2, ww / 2, 2.2, 0, Math.PI * 1.05, Math.PI * 1.95, true); c.stroke(); }
    c.restore();
  }
  function cloth(c, pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); }
  /* Skelett: sitzend an der Wand, liegend oder verdreht */
  function skeleton(c, x, gy, pose, f, s) {
    c.save(); c.translate(x, gy); c.scale(f, 1);
    if (pose === "sit") {
      cloth(c, [[-7, 0], [-6, -14], [-1, -16], [3, -12], [6, 0]], "rgba(90,40,40,.85)");
      ribs(c, -3, -9, 8, 9, -0.12);
      skull(c, -1.5, -17, 3, 0.45);
      bone(c, -3, -4, 4, -1); bone(c, 4, -1, 9, 0); bone(c, -2, -4, 3, 0); bone(c, 3, 0, 8, 0.4);
      bone(c, -5, -12, -1, -6); bone(c, -1, -6, 4, -5, 1.1);
      c.fillStyle = "#4a3a2a"; c.fillRect(-9, -9, 4, 8); c.fillStyle = "#3a2a1a"; c.fillRect(-9, -6, 4, 1); /* Rucksack */
    } else if (pose === "splat") {
      skull(c, -9, -3, 3, 1.4);
      ribs(c, -2, -3, 7, 8, 1.45);
      bone(c, 3, -3, 9, -1); bone(c, 9, -1, 13, 0); bone(c, 3, -2, 7, -5); bone(c, 7, -5, 11, -7);
      bone(c, -4, -5, -6, -9); bone(c, -6, -9, -3, -12, 1.1); bone(c, -3, -1, -6, 0); bone(c, -6, 0, -10, -0.5, 1.1);
      cloth(c, [[-6, -1], [-1, -6], [5, -4], [3, 0]], "rgba(70,50,40,.8)");
    } else {
      skull(c, -10, -3, 3, 1.57 + 0.3);
      ribs(c, -3, -3, 7, 9, 1.57);
      bone(c, 2, -3, 8, -2); bone(c, 8, -2, 13, -1); bone(c, 2, -2, 8, 0); bone(c, 8, 0, 13, 0);
      bone(c, -5, -4, -2, -8); bone(c, -2, -8, 2, -9, 1.1);
      cloth(c, [[-7, -1], [-4, -6], [3, -5], [4, 0]], "rgba(60,60,50,.75)");
    }
    c.restore();
  }
  function sword(c, x, gy, a, col) { c.save(); c.translate(x, gy); c.rotate(a); c.fillStyle = col || "#9a9aa0"; c.fillRect(-0.8, -14, 1.6, 12); c.fillStyle = "#5a4a2a"; c.fillRect(-3, -15, 6, 1.4); c.fillRect(-0.7, -19, 1.4, 4); c.restore(); }
  function arrow(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); c.strokeStyle = "#6a5030"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, 0); c.lineTo(-8, 0); c.stroke(); c.fillStyle = "#c8c0b0"; c.fillRect(-9, -1, 2, 0.8); c.fillRect(-9, 0.4, 2, 0.8); c.restore(); }
  function draw(c, t) {
    const cam = Z.cam;
    for (const s of list) {
      const x = s.x * T + 8, gy = (s.y + 1) * T;
      if (x < cam.x - 60 || x > cam.x + cam.w + 60 || gy < cam.y - 60 || gy > cam.y + cam.h + 80) continue;
      const f = s.kind === "abenteurer" && s.wall ? -s.wall : s.flip;
      switch (s.kind) {
        case "abenteurer": {
          skeleton(c, x + (s.wall ? s.wall * 4 : 0), gy, s.wall ? "sit" : "lie", f, 1);
          sword(c, x - f * 10, gy, f * 0.25);
          /* erloschene Fackel mit letztem Rauchfaden */
          c.fillStyle = "#3a2a1a"; c.fillRect(x + f * 8, gy - 2, 6 * f, 1.4); c.fillStyle = "#1a1010"; c.fillRect(x + f * 14 - (f < 0 ? 2 : 0), gy - 3, 2, 2.4);
          const u = (t * 0.4 + s.seed) % 1; c.fillStyle = "rgba(120,110,110," + 0.25 * (1 - u) + ")"; c.beginPath(); c.arc(x + f * 15 + Math.sin(u * 5) * 2, gy - 4 - u * 16, 1 + u * 3, 0, TAU); c.fill();
          break;
        }
        case "sturz": {
          skeleton(c, x, gy, "splat", s.flip, 1);
          c.strokeStyle = "#8a7050"; c.lineWidth = 0.9; c.beginPath(); for (let k = 0; k < 3; k++) c.ellipse(x + s.flip * 14, gy - 2, 5 - k, 2, 0, 0, TAU); c.stroke();
          c.beginPath(); c.moveTo(x + s.flip * 14, gy - 3); c.bezierCurveTo(x + s.flip * 18, gy - 12, x + s.flip * 10, gy - 20, x + s.flip * 16, gy - 26); c.stroke();
          c.fillStyle = "#5a5a5e"; c.beginPath(); c.arc(x - s.flip * 16, gy - 2.5, 3, Math.PI, 0); c.fill(); c.fillRect(x - s.flip * 16 - 3.5, gy - 2.5, 7, 1);
          break;
        }
        case "falle": {
          skeleton(c, x, gy, "lie", s.flip, 1);
          c.fillStyle = "#6a4a2a"; c.beginPath(); c.ellipse(x - s.flip * 12, gy - 2, 3, 2.4, 0, 0, TAU); c.fill(); c.fillStyle = "#e5c46a"; c.fillRect(x - s.flip * 12 - 4, gy - 1, 1.5, 1); c.fillRect(x - s.flip * 12 + 3, gy - 0.8, 1.5, 1);
          break;
        }
        case "gefecht": {
          for (let k = 0; k < 3; k++) { const bx = x + s.flip * (14 + k * 8), h = 8 + (k % 2) * 6; c.fillStyle = "#5a3a20"; c.fillRect(bx - 4, gy - h, 8, h); c.strokeStyle = "#3a2410"; c.lineWidth = 0.6; c.strokeRect(bx - 4, gy - h, 8, h); c.beginPath(); c.moveTo(bx - 4, gy - h); c.lineTo(bx + 4, gy); c.stroke(); arrow(c, bx - s.flip * 1, gy - h + 3, s.flip > 0 ? 0.1 : Math.PI - 0.1); }
          skeleton(c, x, gy, "sit", -s.flip, 1);
          c.fillStyle = "#6a5a4a"; c.beginPath(); c.ellipse(x - s.flip * 2, gy - 9, 4, 6, 0, 0, TAU); c.fill(); c.strokeStyle = "#a08a6a"; c.lineWidth = 0.8; c.stroke(); arrow(c, x - s.flip * 2, gy - 10, s.flip > 0 ? 0.2 : Math.PI - 0.2);
          for (let k = 0; k < 3; k++) skull(c, x - s.flip * (14 + k * 7), gy - 2, 2.2, k);
          for (let k = 0; k < 5; k++) arrow(c, x - s.flip * (8 + k * 5), gy - 1, s.flip > 0 ? -0.6 + k * 0.2 : Math.PI + 0.6 - k * 0.2);
          break;
        }
        case "lager": {
          c.fillStyle = "#5a3a2a"; c.fillRect(x - 18, gy - 2, 14, 2.5); c.fillStyle = "#7a5040"; c.fillRect(x - 18, gy - 3, 4, 2);
          for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.fillStyle = "#4a4448"; c.beginPath(); c.arc(x + 4 + Math.cos(a) * 5, gy - 1, 1.6, 0, TAU); c.fill(); }
          c.fillStyle = "#1a1414"; c.fillRect(x + 1, gy - 2, 6, 1.6); c.strokeStyle = "#2a1a14"; c.lineWidth = 1; c.beginPath(); c.moveTo(x, gy - 1); c.lineTo(x + 8, gy - 3); c.moveTo(x + 8, gy - 1); c.lineTo(x, gy - 3); c.stroke();
          const ember = 0.3 + 0.3 * Math.sin(t * 2 + s.seed); c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,110,40," + ember * 0.5 + ")"; c.beginPath(); c.arc(x + 4, gy - 2, 2, 0, TAU); c.fill(); c.restore();
          c.fillStyle = "#3a3434"; c.beginPath(); c.arc(x + 14, gy - 3, 3.4, 0, Math.PI); c.fill(); c.fillRect(x + 10.6, gy - 4, 6.8, 1);
          c.fillStyle = "#c8b890"; c.save(); c.translate(x - 4, gy - 1); c.rotate(-0.2); c.fillRect(0, -2, 6, 4); c.fillStyle = "#6a3a20"; c.fillRect(0.5, -1.2, 5, 0.5); c.fillRect(0.5, 0, 4, 0.5); c.restore();
          break;
        }
        case "ritual": {
          c.save(); c.globalAlpha = 0.6 + 0.2 * Math.sin(t * 1.5 + s.seed); c.strokeStyle = "#e8e0d0"; c.lineWidth = 0.8; c.beginPath(); c.ellipse(x, gy - 0.5, 22, 3.2, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(x, gy - 0.5, 16, 2.2, 0, 0, TAU); c.stroke(); c.restore();
          for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3, cx = x + Math.cos(a) * 20, cy = gy - 1 + Math.sin(a) * 2.6; c.fillStyle = "#e8dcc0"; c.fillRect(cx - 0.8, cy - 4, 1.6, 4); const fl = 0.7 + 0.3 * Math.sin(t * 11 + k * 2); c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,190,90," + fl + ")"; c.beginPath(); c.ellipse(cx, cy - 5.4, 0.9, 1.6 * fl, 0, 0, TAU); c.fill(); c.fillStyle = "rgba(255,150,60,.12)"; c.beginPath(); c.arc(cx, cy - 5, 6, 0, TAU); c.fill(); c.restore(); }
          c.fillStyle = "rgba(10,6,6,.75)"; c.beginPath(); c.ellipse(x, gy - 1, 10, 2.2, 0, 0, TAU); c.fill();
          skull(c, x + 2, gy - 3, 2.6, 0.3);
          c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(200,60,255," + (0.15 + 0.1 * Math.sin(t * 3)) + ")"; c.beginPath(); c.ellipse(x, gy - 2, 24, 6, 0, 0, TAU); c.fill(); c.restore();
          break;
        }
        case "kokon": {
          const hy = gy - 44, sw = Math.sin(t * 0.8 + s.seed) * 2;
          c.strokeStyle = "rgba(230,224,236,.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, hy - 40); c.lineTo(x + sw, hy); c.stroke();
          c.save(); c.translate(x + sw, hy + 12); c.rotate(sw * 0.03); c.fillStyle = "#d8d0dc"; c.beginPath(); c.ellipse(0, 0, 6, 13, 0, 0, TAU); c.fill();
          c.strokeStyle = "rgba(160,150,170,.8)"; c.lineWidth = 0.5; for (let k = -10; k < 12; k += 3) { c.beginPath(); c.moveTo(-6, k); c.quadraticCurveTo(0, k + 3, 6, k - 1); c.stroke(); }
          c.fillStyle = "#3a2a1a"; c.fillRect(-1.5, 12, 3, 4); c.fillRect(-2, 15, 4, 1.6); c.restore();
          for (let k = 0; k < 8; k++) { c.strokeStyle = "rgba(230,224,236,.25)"; c.beginPath(); c.moveTo(x + sw, hy); c.lineTo(x + Math.cos(k) * 30, hy - 30 + Math.sin(k * 2) * 10); c.stroke(); }
          break;
        }
        case "ertrunken": {
          skeleton(c, x, gy, "lie", s.flip, 1);
          c.strokeStyle = "#3a6a3a"; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); const bx = x - 8 + k * 5; c.moveTo(bx, gy); c.quadraticCurveTo(bx + Math.sin(t * 1.4 + k) * 3, gy - 6, bx + Math.sin(t + k) * 2, gy - 10 - k); c.stroke(); }
          c.strokeStyle = "#5a5450"; c.lineWidth = 1.2; c.setLineDash([2, 1]); c.beginPath(); c.moveTo(x + s.flip * 8, gy - 2); c.lineTo(x + s.flip * 20, gy - 1); c.stroke(); c.setLineDash([]);
          c.fillStyle = "#4a4440"; c.fillRect(x + s.flip * 20 - 1, gy - 8, 2, 7); c.beginPath(); c.arc(x + s.flip * 20, gy - 2, 4, 0, Math.PI); c.lineWidth = 1.4; c.strokeStyle = "#4a4440"; c.stroke();
          break;
        }
      }
    }
  }
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) { if (dwp0) dwp0.apply(this, arguments); if (Z.level === lvRef) draw(c, t); };
  Z.spuren = () => list;
})();
