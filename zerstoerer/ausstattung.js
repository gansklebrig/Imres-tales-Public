/* Ezekiel – The Destroyer · Ausstattung und Bilderbuch-Vordergrund
   Räume, die bewohnt wirken: Tische mit Kerzen und Essen, Bücherregale, Rüstungsständer, Porträts besiegter Feinde,
   Wandteppiche, Fassregale, Weinflaschen, Säcke, Folterbänke, Strohlager, Strichlisten an der Wand, Netze und Anker,
   Zahnräder, Ambosse, Schleifsteine, Eiersäcke, Muschelhaufen, Kohlenkarren …
   Dazu ein gemalter Vordergrund je Gebiet: efeuumrankte Säulen, Laternen an Ketten, Vorhänge, Zahnräder, Schilf, Netze. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH, L = v => Z.L(v);
  const TAU = Math.PI * 2;
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const SETS = {
    torhof: { floor: ["karren", "heu", "waffenstaender", "faesser", "kisten", "brunnen"], wall: ["schild", "schild", "laterne"] },
    wehrgang: { floor: ["heu", "faesser", "waffenstaender", "kanonenkugeln", "kisten"], wall: ["schild", "laterne"] },
    zinnen: { floor: ["kanonenkugeln", "faesser", "statue"], wall: ["schild", "laterne"] },
    sturm: { floor: ["truemmer", "statue", "kanonenkugeln"], wall: ["laterne", "schild"] },
    keller: { floor: ["fassregal", "saecke", "kaese", "faesser", "kisten"], wall: ["flaschenregal", "wuerste", "spinnweben"] },
    hallen: { floor: ["tafel", "ruestung", "buecherregal", "teppich", "stuehle", "tafel"], wall: ["portraet", "portraet", "wandteppich", "geweih"] },
    verlies: { floor: ["streckbank", "stroh", "eimer", "knochen"], wall: ["fesseln", "strichliste", "fesseln"] },
    hafen: { floor: ["netze", "anker", "tauwerk", "fischkorb", "kisten"], wall: ["rettungsring", "netzwand"] },
    glocken: { floor: ["zahnradkiste", "kleineglocke", "kisten"], wall: ["zahnrad", "zahnrad", "seilrolle"] },
    schmiede: { floor: ["amboss", "schleifstein", "runensteine", "waffenstaender"], wall: ["zangen", "runentafel"] },
    schlund: { floor: ["eiersack", "pilze", "knochen", "eiersack"], wall: ["spinnweben", "spinnweben"] },
    see: { floor: ["muscheln", "goetze", "schilf", "saeulenstumpf"], wall: ["algen"] },
    glut: { floor: ["kohlenkarren", "kohlebecken", "kisten"], wall: ["ketten", "laterne"] }
  };
  let props = [], lvRef = null;
  function setup(lv) {
    props = []; lvRef = lv;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    const set = SETS[lv.biome]; if (!set) return;
    const R = Z.Rng(((lv.seed || 4) * 9301 + 49297) >>> 0);
    const taken = (x, y, w) => props.some(p => Math.abs(p.x - x) < (w + p.w) / 2 + 1 && Math.abs(p.y - y) < 3)
      || (lv.doors || []).some(d => Math.abs(d.x - x) < 3 + w / 2 && Math.abs(d.y - y) < 3)
      || (lv.traps || []).some(t => Math.abs(t.x - x) < 2 + w / 2 && Math.abs(t.y - y) < 2)
      || (lv.decor || []).some(d => Math.abs(d.x - x) < 1 + w / 2 && Math.abs(d.y - y) < 2)
      || (Z.spuren ? Z.spuren() : []).some(s => Math.abs(s.x - x) < 4 + w / 2 && Math.abs(s.y - y) < 3)
      || (lv.start && Math.abs(lv.start.x - x) < 3 && Math.abs(lv.start.y - y) < 3);
    const sky = (x, y) => Z.gfx.sky && Z.gfx.sky[y * lv.W + x];
    for (const k in lv.cells) {
      const c = lv.cells[k], ox = c.x * CW, oy = c.y * CH;
      /* Boden */
      let n = 1 + (R() < 0.6 ? 1 : 0) + (R() < 0.3 ? 1 : 0);
      for (let tries = 0; tries < 60 && n > 0; tries++) {
        const kind = R.pick(set.floor), w = WIDTH[kind] || 2;
        const x = ox + 2 + R.int(0, CW - 5), y = oy + 1 + R.int(0, CH - 3);
        let ok = true; for (let i = -Math.floor(w / 2); i <= Math.floor(w / 2); i++) if (!Z.standable(lv, x + i, y, 3) || lv.get(x + i, y + 1) === 2) { ok = false; break; }
        if (!ok || taken(x, y, w)) continue;
        props.push({ kind, x, y, w, s: R(), f: R() < 0.5 ? -1 : 1 }); n--;
      }
      /* Wand */
      let m = 1 + (R() < 0.5 ? 1 : 0);
      for (let tries = 0; tries < 60 && m > 0; tries++) {
        const kind = R.pick(set.wall), x = ox + 2 + R.int(0, CW - 5), y = oy + 2 + R.int(0, CH - 5);
        let ok = true; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = lv.get(x + dx, y + dy); if (v !== 0 || sky(x + dx, y + dy)) ok = false; }
        if (kind === "spinnweben") { /* in eine obere Ecke */ ok = lv.get(x, y) === 0 && (lv.get(x, y - 1) === 1) && (lv.get(x - 1, y) === 1 || lv.get(x + 1, y) === 1); }
        if (!ok || props.some(p => p.wall && Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 3) || (lv.decor || []).some(d => Math.abs(d.x - x) < 2 && Math.abs(d.y - y) < 2)) continue;
        props.push({ kind, x, y, w: 2, s: R(), f: lv.get(x - 1, y) === 1 ? 1 : -1, wall: true, face: R() < 0.5 ? 0 : 1 + (R() * 5 | 0) }); m--;
      }
    }
  }
  const WIDTH = { karren: 3, heu: 2, waffenstaender: 2, faesser: 2, kisten: 2, brunnen: 3, kanonenkugeln: 1, truemmer: 2, statue: 1, fassregal: 3, saecke: 2, kaese: 1, tafel: 4, ruestung: 1, buecherregal: 3, teppich: 4, stuehle: 2, streckbank: 3, stroh: 2, eimer: 1, knochen: 1, netze: 2, anker: 1, tauwerk: 1, fischkorb: 1, zahnradkiste: 2, kleineglocke: 1, amboss: 2, schleifstein: 2, runensteine: 2, eiersack: 1, pilze: 1, muscheln: 1, goetze: 1, schilf: 2, saeulenstumpf: 1, kohlenkarren: 3, kohlebecken: 1 };
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  /* ---------- Malen ---------- */
  const wood = (c, x, y, w, h, col) => { c.fillStyle = col || "#5a3a22"; c.fillRect(x, y, w, h); c.fillStyle = "rgba(0,0,0,.25)"; for (let k = 3; k < w; k += 4) c.fillRect(x + k, y, 0.5, h); c.fillStyle = "rgba(255,230,190,.08)"; c.fillRect(x, y, w, 0.8); };
  const ell = (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };
  function flame(c, x, y, s, t, ph) { const f = 0.8 + 0.2 * Math.sin(t * 13 + ph) * Math.sin(t * 7 + ph * 2); c.save(); c.globalCompositeOperation = "lighter"; ell(c, x, y - 1.6 * s * f, 0.9 * s, 1.8 * s * f, "rgba(255,190,90,.9)"); ell(c, x, y - 1 * s, 0.45 * s, 0.9 * s, "rgba(255,250,220,.9)"); const g = c.createRadialGradient(x, y - 2, 0, x, y - 2, 10 * s); g.addColorStop(0, "rgba(255,170,80,.25)"); g.addColorStop(1, "rgba(255,150,60,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y - 2, 10 * s, 0, TAU); c.fill(); c.restore(); }
  const FACES = ["#6f9a3a", "#d8d0bc", "#8a6a9a", "#c8a080", "#5a7a6a", "#b85a3a"];
  function draw(c, p, t) {
    const x = p.x * T + 8, gy = (p.y + 1) * T, f = p.f, s = p.s;
    switch (p.kind) {
      case "karren": wood(c, x - 20, gy - 12, 34, 7, "#6a4428"); c.fillStyle = "#4a3018"; c.fillRect(x + 12 * f, gy - 10, 14 * f, 1.5); for (const wx of [x - 14, x + 6]) { c.strokeStyle = "#3a2414"; c.lineWidth = 1.6; c.beginPath(); c.arc(wx, gy - 5, 5, 0, TAU); c.stroke(); c.lineWidth = 0.6; for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI; c.beginPath(); c.moveTo(wx + Math.cos(a) * 5, gy - 5 + Math.sin(a) * 5); c.lineTo(wx - Math.cos(a) * 5, gy - 5 - Math.sin(a) * 5); c.stroke(); } } ell(c, x - 6, gy - 13, 9, 3, "#c8a84a"); break;
      case "heu": ell(c, x, gy - 6, 12, 7, "#b8984a"); c.fillStyle = "#d8b860"; for (let k = 0; k < 14; k++) c.fillRect(x - 10 + hash(k, s) * 20, gy - 12 + hash(s, k) * 10, 3, 0.6); c.strokeStyle = "#6a4a20"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 11, gy - 7); c.lineTo(x + 11, gy - 7); c.stroke(); c.fillStyle = "#4a3a20"; c.fillRect(x + 8 * f, gy - 20, 1, 20); c.fillRect(x + 8 * f - 3, gy - 21, 6, 1); break;
      case "waffenstaender": wood(c, x - 10, gy - 18, 20, 2); wood(c, x - 9, gy - 18, 2, 18); wood(c, x + 7, gy - 18, 2, 18); for (let k = 0; k < 4; k++) { const wx = x - 6 + k * 4; c.fillStyle = "#9a9aa0"; c.fillRect(wx, gy - 24 + (k % 2) * 3, 1.2, 22); c.fillStyle = "#5a4a2a"; c.fillRect(wx - 1, gy - 6, 3, 1); if (k === 1) { c.fillStyle = "#b0b0b8"; c.beginPath(); c.moveTo(wx - 2, gy - 22); c.lineTo(wx + 0.6, gy - 27); c.lineTo(wx + 3, gy - 22); c.fill(); } } break;
      case "faesser": for (const [dx, dy, r] of [[-6, 0, 6], [6, 0, 6], [0, -11, 6]]) { ell(c, x + dx, gy - 6 + dy, r * 0.85, r, "#6a4428"); c.strokeStyle = "#3a2410"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + dx - r * 0.8, gy - 9 + dy); c.lineTo(x + dx + r * 0.8, gy - 9 + dy); c.moveTo(x + dx - r * 0.8, gy - 3 + dy); c.lineTo(x + dx + r * 0.8, gy - 3 + dy); c.stroke(); } break;
      case "kisten": wood(c, x - 10, gy - 10, 11, 10, "#7a5432"); wood(c, x + 1, gy - 8, 9, 8, "#6a4428"); wood(c, x - 6, gy - 18, 8, 8, "#80583a"); c.strokeStyle = "#3a2414"; c.lineWidth = 0.6; c.strokeRect(x - 10, gy - 10, 11, 10); c.beginPath(); c.moveTo(x - 10, gy - 10); c.lineTo(x + 1, gy); c.stroke(); c.strokeRect(x - 6, gy - 18, 8, 8); break;
      case "brunnen": c.fillStyle = "#5a5058"; c.fillRect(x - 14, gy - 10, 28, 10); c.fillStyle = "#3a3438"; for (let k = 0; k < 4; k++) c.fillRect(x - 14 + k * 7, gy - 10, 0.6, 10); c.fillRect(x - 14, gy - 5, 28, 0.6); wood(c, x - 13, gy - 30, 2, 20); wood(c, x + 11, gy - 30, 2, 20); c.fillStyle = "#6a2a24"; c.beginPath(); c.moveTo(x - 17, gy - 29); c.lineTo(x, gy - 38); c.lineTo(x + 17, gy - 29); c.fill(); c.strokeStyle = "#8a7050"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, gy - 28); c.lineTo(x, gy - 16); c.stroke(); c.fillStyle = "#5a3a22"; c.fillRect(x - 2.5, gy - 17, 5, 4); break;
      case "kanonenkugeln": for (const [dx, dy] of [[-4, 0], [0, 0], [4, 0], [-2, -3.6], [2, -3.6], [0, -7]]) { ell(c, x + dx, gy - 2.2 + dy, 2.2, 2.2, "#3a3a40"); c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(x + dx - 1, gy - 3.4 + dy, 0.8, 0.8); } break;
      case "truemmer": c.fillStyle = "#6a6068"; c.beginPath(); c.moveTo(x - 14, gy); c.lineTo(x - 10, gy - 7); c.lineTo(x - 2, gy - 5); c.lineTo(x + 3, gy - 10); c.lineTo(x + 12, gy - 4); c.lineTo(x + 14, gy); c.fill(); c.fillStyle = "#4a4048"; c.fillRect(x - 6, gy - 3, 5, 3); c.fillRect(x + 5, gy - 2, 4, 2); break;
      case "statue": c.fillStyle = "#7a7480"; c.fillRect(x - 6, gy - 6, 12, 6); c.beginPath(); c.moveTo(x - 4, gy - 6); c.lineTo(x - 3, gy - 26); c.lineTo(x + 3, gy - 26); c.lineTo(x + 4, gy - 6); c.fill(); c.beginPath(); c.arc(x, gy - 29, 3, 0, TAU); c.fill(); c.fillRect(x + 3 * f, gy - 36, 1, 32); c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(x - 3, gy - 25, 1.5, 18); if (s > 0.5) { c.fillStyle = "#3a4a2a"; for (let k = 0; k < 8; k++) ell(c, x - 3 + hash(k, s) * 6, gy - 8 - hash(s, k) * 16, 1.2, 1, "#3a5a2a"); } break;
      case "fassregal": wood(c, x - 22, gy - 34, 2, 34); wood(c, x + 20, gy - 34, 2, 34); for (let r = 0; r < 3; r++) { wood(c, x - 22, gy - 12 - r * 11, 44, 1.5); for (let k = 0; k < 4; k++) { const bx = x - 15 + k * 10, by = gy - 6 - r * 11; ell(c, bx, by, 4.5, 4.5, "#6a4428"); c.strokeStyle = "#3a2410"; c.lineWidth = 0.6; c.beginPath(); c.arc(bx, by, 3.2, 0, TAU); c.stroke(); ell(c, bx, by, 0.8, 0.8, "#1a0e08"); } } break;
      case "saecke": for (const [dx, sc] of [[-6, 1], [5, 0.9], [0, 0.8]]) { const yy = dx === 0 ? gy - 9 : gy; c.fillStyle = "#b8a080"; c.beginPath(); c.moveTo(x + dx - 6 * sc, yy); c.quadraticCurveTo(x + dx - 7 * sc, yy - 10 * sc, x + dx - 2 * sc, yy - 12 * sc); c.lineTo(x + dx + 2 * sc, yy - 12 * sc); c.quadraticCurveTo(x + dx + 7 * sc, yy - 10 * sc, x + dx + 6 * sc, yy); c.fill(); c.fillStyle = "#8a7050"; c.fillRect(x + dx - 2 * sc, yy - 12 * sc, 4 * sc, 1.2); } break;
      case "kaese": ell(c, x, gy - 3, 6, 3, "#e8c060"); c.fillStyle = "#c8a040"; c.fillRect(x - 6, gy - 3, 12, 3); ell(c, x, gy - 3, 6, 2, "#f0d070"); c.fillStyle = "#c89a30"; c.beginPath(); c.moveTo(x, gy - 3); c.lineTo(x + 6, gy - 4); c.lineTo(x + 5, gy - 1.5); c.fill(); break;
      case "tafel": {
        wood(c, x - 26, gy - 12, 52, 3, "#6a4026"); wood(c, x - 24, gy - 9, 2.5, 9); wood(c, x + 22, gy - 9, 2.5, 9);
        c.fillStyle = "#e8dcc8"; c.fillRect(x - 24, gy - 13, 48, 1.2); c.fillStyle = "#c8b8a0"; c.fillRect(x - 24, gy - 12, 48, 3);
        for (let k = 0; k < 3; k++) { const cx = x - 16 + k * 16; c.fillStyle = "#c8a84a"; c.fillRect(cx - 0.6, gy - 19, 1.2, 6); c.fillRect(cx - 2, gy - 14, 4, 1); c.fillStyle = "#e8dcc0"; c.fillRect(cx - 0.6, gy - 22, 1.2, 3); flame(c, cx, gy - 22, 0.8, t, k + s * 9); }
        ell(c, x - 8, gy - 14, 4, 1.4, "#b8b0a8"); ell(c, x - 8, gy - 15.5, 3, 2, "#a0542a"); ell(c, x + 8, gy - 14.5, 3, 1.6, "#9a2a3a"); c.fillStyle = "#3a5a2a"; c.fillRect(x + 18, gy - 18, 2, 5); c.fillStyle = "#c8a84a"; c.fillRect(x - 21, gy - 17, 2, 4); break;
      }
      case "ruestung": c.fillStyle = "#3a3438"; c.fillRect(x - 5, gy - 2, 10, 2); c.fillStyle = "#8a8a92"; c.fillRect(x - 3, gy - 14, 2.4, 12); c.fillRect(x + 0.6, gy - 14, 2.4, 12); c.beginPath(); c.moveTo(x - 6, gy - 26); c.lineTo(x + 6, gy - 26); c.lineTo(x + 4, gy - 14); c.lineTo(x - 4, gy - 14); c.fill(); c.beginPath(); c.arc(x, gy - 29, 3.6, 0, TAU); c.fill(); c.fillStyle = "#1a1418"; c.fillRect(x - 2.5, gy - 30, 5, 1); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(x - 5, gy - 25, 1.2, 10); c.fillStyle = "#7a1a20"; c.fillRect(x - 0.5, gy - 36, 1, 4); c.fillStyle = "#9a9aa4"; c.fillRect(x + 7 * f, gy - 36, 1.2, 34); c.beginPath(); c.moveTo(x + 7 * f - 2, gy - 34); c.lineTo(x + 7.6 * f, gy - 40); c.lineTo(x + 7 * f + 3, gy - 34); c.fill(); break;
      case "buecherregal": wood(c, x - 18, gy - 40, 36, 40, "#4a2e1a"); for (let r = 0; r < 4; r++) { c.fillStyle = "#2a1a10"; c.fillRect(x - 16, gy - 38 + r * 10, 32, 8); let bx = x - 16; while (bx < x + 15) { const bw = 1.6 + hash(bx, r + s) * 2.4, bh = 5 + hash(r, bx) * 3; c.fillStyle = ["#7a2a2a", "#2a4a3a", "#6a5a2a", "#4a2a5a", "#8a6a3a"][(hash(bx * 3, r) * 5) | 0]; c.fillRect(bx, gy - 30 + r * 10 - bh, bw, bh); c.fillStyle = "rgba(255,230,160,.3)"; c.fillRect(bx, gy - 30 + r * 10 - bh + 1, bw, 0.5); bx += bw + 0.3; } } break;
      case "teppich": c.fillStyle = "#7a1a20"; c.fillRect(x - 28, gy - 1.4, 56, 1.6); c.fillStyle = "#c8a040"; for (let k = -26; k < 26; k += 4) c.fillRect(x + k, gy - 1.2, 1.5, 0.6); c.fillStyle = "#5a1014"; c.fillRect(x - 28, gy, 56, 0.6); break;
      case "stuehle": for (const dx of [-6, 6]) { wood(c, x + dx - 3, gy - 7, 6, 1.5, "#5a3a22"); wood(c, x + dx - 3, gy - 7, 1, 7, "#4a2e1a"); wood(c, x + dx + 2, gy - 7, 1, 7, "#4a2e1a"); wood(c, x + dx + (dx < 0 ? -3 : 2), gy - 15, 1.2, 9, "#4a2e1a"); } break;
      case "streckbank": wood(c, x - 20, gy - 10, 40, 3, "#5a3a22"); for (const dx of [-18, 16]) wood(c, x + dx, gy - 10, 2.5, 10, "#4a2e1a"); for (const dx of [-20, 20]) { c.strokeStyle = "#3a2a1a"; c.lineWidth = 1.2; c.beginPath(); c.arc(x + dx, gy - 11, 3, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x + dx - 3, gy - 11); c.lineTo(x + dx + 3, gy - 11); c.moveTo(x + dx, gy - 14); c.lineTo(x + dx, gy - 8); c.stroke(); } c.strokeStyle = "#8a7050"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 17, gy - 11); c.lineTo(x + 17, gy - 11); c.stroke(); break;
      case "stroh": c.fillStyle = "#9a8040"; c.beginPath(); c.moveTo(x - 12, gy); c.quadraticCurveTo(x, gy - 7, x + 12, gy); c.fill(); c.strokeStyle = "#c8a860"; c.lineWidth = 0.5; for (let k = 0; k < 12; k++) { const a = hash(k, s) * Math.PI; c.beginPath(); c.moveTo(x - 9 + k * 1.6, gy - 1); c.lineTo(x - 9 + k * 1.6 + Math.cos(a) * 4, gy - 2 - Math.sin(a) * 4); c.stroke(); } break;
      case "eimer": c.fillStyle = "#5a4a3a"; c.beginPath(); c.moveTo(x - 4, gy - 8); c.lineTo(x + 4, gy - 8); c.lineTo(x + 3, gy); c.lineTo(x - 3, gy); c.fill(); c.strokeStyle = "#3a3430"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 4, gy - 6); c.lineTo(x + 4, gy - 6); c.moveTo(x - 3.5, gy - 2); c.lineTo(x + 3.5, gy - 2); c.stroke(); c.beginPath(); c.arc(x, gy - 8, 4, Math.PI, 0); c.stroke(); break;
      case "knochen": c.strokeStyle = "#d8cfb8"; c.lineWidth = 1.2; c.lineCap = "round"; for (let k = 0; k < 3; k++) { const a = hash(k, s) * Math.PI, l = 4 + hash(s, k) * 3, bx = x - 4 + k * 4; c.beginPath(); c.moveTo(bx - Math.cos(a) * l, gy - 1 - Math.sin(a) * 0.5); c.lineTo(bx + Math.cos(a) * l, gy - 1); c.stroke(); } ell(c, x + 6 * f, gy - 2.5, 2.4, 2.2, "#d8cfb8"); c.fillStyle = "#1a1214"; c.fillRect(x + 6 * f - 1.2, gy - 3, 0.9, 0.9); c.fillRect(x + 6 * f + 0.4, gy - 3, 0.9, 0.9); break;
      case "netze": c.fillStyle = "#5a4a3a"; c.beginPath(); c.moveTo(x - 12, gy); c.quadraticCurveTo(x - 4, gy - 9, x + 4, gy - 6); c.quadraticCurveTo(x + 12, gy - 4, x + 12, gy); c.fill(); c.strokeStyle = "rgba(200,180,140,.6)"; c.lineWidth = 0.4; for (let k = -10; k < 12; k += 2.5) { c.beginPath(); c.moveTo(x + k, gy); c.lineTo(x + k + 3, gy - 6); c.stroke(); } ell(c, x + 8, gy - 5, 1.6, 1.6, "#c89a40"); break;
      case "anker": c.strokeStyle = "#4a4440"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, gy - 22); c.lineTo(x, gy - 3); c.stroke(); c.beginPath(); c.arc(x, gy - 9, 8, 0.2, Math.PI - 0.2); c.stroke(); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 5, gy - 18); c.lineTo(x + 5, gy - 18); c.stroke(); c.beginPath(); c.arc(x, gy - 24, 2, 0, TAU); c.stroke(); break;
      case "tauwerk": c.strokeStyle = "#a08050"; c.lineWidth = 1; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x, gy - 2 - k * 1.6, 6 - k * 0.6, 2, 0, 0, TAU); c.stroke(); } break;
      case "fischkorb": c.fillStyle = "#7a5a30"; c.beginPath(); c.moveTo(x - 6, gy - 7); c.lineTo(x + 6, gy - 7); c.lineTo(x + 5, gy); c.lineTo(x - 5, gy); c.fill(); c.strokeStyle = "#4a3418"; c.lineWidth = 0.4; for (let k = -5; k <= 5; k += 2) { c.beginPath(); c.moveTo(x + k, gy - 7); c.lineTo(x + k * 0.85, gy); c.stroke(); } for (let k = 0; k < 3; k++) { c.fillStyle = "#a8b0a0"; c.beginPath(); c.ellipse(x - 3 + k * 3, gy - 8, 3, 1.2, -0.3 + k * 0.3, 0, TAU); c.fill(); } break;
      case "zahnradkiste": wood(c, x - 10, gy - 9, 20, 9, "#6a4428"); for (let k = 0; k < 3; k++) { const gx = x - 6 + k * 6, gr = 2.5 + k % 2; c.fillStyle = "#8a6a3a"; c.beginPath(); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; c.lineTo(gx + Math.cos(a) * gr * 1.3, gy - 10 + Math.sin(a) * gr * 1.3); c.lineTo(gx + Math.cos(a + 0.4) * gr, gy - 10 + Math.sin(a + 0.4) * gr); } c.fill(); } break;
      case "kleineglocke": c.fillStyle = "#3a2a1a"; c.fillRect(x - 7, gy - 22, 14, 2); c.fillRect(x - 7, gy - 22, 2, 22); c.fillRect(x + 5, gy - 22, 2, 22); { const a = Math.sin(t * 1.2 + s * 9) * 0.15; c.save(); c.translate(x, gy - 20); c.rotate(a); c.fillStyle = "#a07a30"; c.beginPath(); c.moveTo(-2.5, 1); c.quadraticCurveTo(-3, 8, -5.5, 10); c.lineTo(5.5, 10); c.quadraticCurveTo(3, 8, 2.5, 1); c.fill(); c.fillStyle = "rgba(255,230,160,.3)"; c.fillRect(-2, 2, 1, 7); c.restore(); } break;
      case "amboss": c.fillStyle = "#4a4040"; c.fillRect(x - 5, gy - 6, 10, 6); c.fillStyle = "#5a5254"; c.beginPath(); c.moveTo(x - 12, gy - 11); c.lineTo(x + 9, gy - 11); c.lineTo(x + 14, gy - 9); c.lineTo(x + 6, gy - 7); c.lineTo(x - 8, gy - 7); c.fill(); c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(x - 11, gy - 11, 19, 0.8); c.fillStyle = "#7a7070"; c.fillRect(x + 2, gy - 14, 1.2, 3); c.fillRect(x - 1, gy - 15, 7, 1.6); if (Math.random() < 0.01) Z.fx.burst(x, gy - 11, 4, { col: ["#ffb040", "#fff0c0"], sp: 60, life: 0.3, size: 1, kind: "spark", add: true }); break;
      case "schleifstein": wood(c, x - 10, gy - 8, 2, 8); wood(c, x + 8, gy - 8, 2, 8); { const a = t * 2; c.fillStyle = "#8a8070"; c.beginPath(); c.arc(x, gy - 10, 6, 0, TAU); c.fill(); c.strokeStyle = "#5a5048"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, gy - 10); c.lineTo(x + Math.cos(a) * 6, gy - 10 + Math.sin(a) * 6); c.stroke(); } c.fillStyle = "#4a3a2a"; c.fillRect(x + 6, gy - 11, 6, 1); break;
      case "runensteine": for (let k = 0; k < 3; k++) { const rx = x - 7 + k * 7, h = 8 + (k % 2) * 4; c.fillStyle = "#5a5060"; c.beginPath(); c.moveTo(rx - 3, gy); c.lineTo(rx - 2.4, gy - h); c.lineTo(rx + 2.4, gy - h - 1); c.lineTo(rx + 3, gy); c.fill(); const glow = 0.5 + 0.5 * Math.sin(t * 2 + k * 2 + s * 9); c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,170,60," + glow + ")"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(rx - 1, gy - h + 2); c.lineTo(rx + 1, gy - h + 5); c.lineTo(rx - 1, gy - h + 7); c.stroke(); c.restore(); } break;
      case "eiersack": { const pul = 1 + Math.sin(t * 2 + s * 7) * 0.04; ell(c, x, gy - 7 * pul, 6 * pul, 7 * pul, "#d8d0c0"); c.fillStyle = "rgba(160,150,140,.6)"; for (let k = 0; k < 5; k++) ell(c, x - 3 + hash(k, s) * 6, gy - 10 + hash(s, k) * 8, 1.4, 1.4, "rgba(120,110,100,.5)"); c.strokeStyle = "rgba(230,224,236,.5)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x, gy - 14); c.lineTo(x - 4, gy - 30); c.moveTo(x, gy - 14); c.lineTo(x + 6, gy - 28); c.stroke(); break; }
      case "pilze": for (let k = 0; k < 3; k++) { const px = x - 4 + k * 4, h = 4 + k * 2; c.fillStyle = "#d8c8d0"; c.fillRect(px - 0.5, gy - h, 1, h); ell(c, px, gy - h, 2.5 + k * 0.5, 1.4, k === 1 ? "#c86ad0" : "#8a4ac0"); c.save(); c.globalCompositeOperation = "lighter"; ell(c, px, gy - h, 5, 3, "rgba(200,120,255,.15)"); c.restore(); } break;
      case "muscheln": for (let k = 0; k < 6; k++) { const mx = x - 6 + hash(k, s) * 12, my = gy - 1 - hash(s, k) * 3; c.fillStyle = k % 2 ? "#d8c8b8" : "#b8a8a0"; c.beginPath(); c.arc(mx, my, 1.8, Math.PI, 0); c.fill(); } break;
      case "goetze": c.fillStyle = "#4a6a5a"; c.fillRect(x - 4, gy - 4, 8, 4); c.beginPath(); c.moveTo(x - 4, gy - 4); c.quadraticCurveTo(x - 6, gy - 16, x, gy - 20); c.quadraticCurveTo(x + 6, gy - 16, x + 4, gy - 4); c.fill(); ell(c, x - 2, gy - 15, 1.4, 1.8, "#c8ff8a"); ell(c, x + 2, gy - 15, 1.4, 1.8, "#c8ff8a"); c.fillStyle = "#2a3a30"; c.fillRect(x - 3, gy - 11, 6, 1); break;
      case "schilf": c.strokeStyle = "#4a6a3a"; c.lineWidth = 0.8; for (let k = 0; k < 9; k++) { const rx = x - 10 + k * 2.4, h = 10 + hash(k, s) * 12, sw = Math.sin(t * 1.3 + k) * 1.5; c.beginPath(); c.moveTo(rx, gy); c.quadraticCurveTo(rx + sw * 0.5, gy - h * 0.5, rx + sw, gy - h); c.stroke(); if (k % 3 === 0) ell(c, rx + sw, gy - h, 0.9, 2.4, "#6a4a2a"); } break;
      case "saeulenstumpf": c.fillStyle = "#5a6a64"; c.fillRect(x - 5, gy - 14, 10, 14); c.fillStyle = "#4a5a54"; for (let k = -3; k <= 3; k += 3) c.fillRect(x + k, gy - 14, 0.8, 14); c.beginPath(); c.moveTo(x - 6, gy - 14); c.lineTo(x - 2, gy - 18); c.lineTo(x + 2, gy - 15); c.lineTo(x + 6, gy - 17); c.lineTo(x + 6, gy - 14); c.fill(); c.fillStyle = "#3a5a3a"; c.fillRect(x - 5, gy - 6, 10, 1.4); break;
      case "kohlenkarren": wood(c, x - 14, gy - 10, 28, 7, "#3a3434"); ell(c, x - 8, gy - 3, 3, 3, "#2a2424"); ell(c, x + 8, gy - 3, 3, 3, "#2a2424"); for (let k = 0; k < 10; k++) ell(c, x - 11 + hash(k, s) * 22, gy - 11 - hash(s, k) * 3, 1.6, 1.4, "#1a1616"); c.save(); c.globalCompositeOperation = "lighter"; for (let k = 0; k < 3; k++) ell(c, x - 6 + k * 6, gy - 11, 1.2, 0.8, "rgba(255,110,40," + (0.4 + 0.3 * Math.sin(t * 3 + k)) + ")"); c.restore(); break;
      case "kohlebecken": c.fillStyle = "#3a3434"; c.beginPath(); c.moveTo(x - 6, gy - 10); c.lineTo(x + 6, gy - 10); c.lineTo(x + 3, gy - 5); c.lineTo(x - 3, gy - 5); c.fill(); c.fillRect(x - 0.8, gy - 5, 1.6, 5); c.fillRect(x - 4, gy - 1, 8, 1); flame(c, x, gy - 10, 1.6, t, s * 9); break;
      /* Wand */
      case "schild": { const cols = ["#7a1a20", "#2a4a3a", "#c8a040", "#3a2a5a"], col = cols[(s * 4) | 0]; c.fillStyle = col; c.beginPath(); c.moveTo(x - 6, gy - 22); c.lineTo(x + 6, gy - 22); c.lineTo(x + 6, gy - 15); c.quadraticCurveTo(x, gy - 8, x - 6, gy - 15); c.closePath(); c.fill(); c.strokeStyle = "#c8b080"; c.lineWidth = 0.8; c.stroke(); c.fillStyle = "#e8d8a0"; c.fillRect(x - 0.6, gy - 21, 1.2, 9); c.fillRect(x - 4, gy - 18, 8, 1.2); for (const a of [-0.7, 0.7]) { c.save(); c.translate(x, gy - 18); c.rotate(a); c.fillStyle = "#9a9aa0"; c.fillRect(-0.6, -14, 1.2, 22); c.restore(); } break; }
      case "laterne": { const sw = Math.sin(t * 1.1 + s * 9) * 1.2; c.strokeStyle = "#2a2420"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, gy - 30); c.lineTo(x + sw, gy - 20); c.stroke(); c.fillStyle = "#3a3028"; c.fillRect(x + sw - 3, gy - 20, 6, 8); c.fillStyle = "#ffcf7a"; c.fillRect(x + sw - 2, gy - 19, 4, 6); flame(c, x + sw, gy - 14, 1.2, t, s * 9); break; }
      case "flaschenregal": wood(c, x - 14, gy - 22, 28, 1.5); wood(c, x - 14, gy - 12, 28, 1.5); for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { const bx = x - 12 + k * 4.6, by = gy - 23 + r * 10; c.fillStyle = ["#2a4a2a", "#5a1a2a", "#3a2a1a"][(hash(k, r + s) * 3) | 0]; c.fillRect(bx, by - 6, 2.6, 6); c.fillRect(bx + 0.8, by - 8.5, 1, 2.5); c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(bx + 0.3, by - 5.5, 0.5, 4); } break;
      case "wuerste": c.strokeStyle = "#3a2a1a"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 12, gy - 28); c.lineTo(x + 12, gy - 28); c.stroke(); for (let k = 0; k < 5; k++) { const wx = x - 10 + k * 5, sw = Math.sin(t * 0.9 + k) * 0.8; c.beginPath(); c.moveTo(wx, gy - 28); c.lineTo(wx + sw, gy - 24); c.stroke(); c.fillStyle = k % 2 ? "#8a3a2a" : "#a0542a"; c.beginPath(); c.ellipse(wx + sw, gy - 19, 1.6, 5, sw * 0.1, 0, TAU); c.fill(); } break;
      case "spinnweben": { const d = p.f; c.strokeStyle = "rgba(220,214,230,.45)"; c.lineWidth = 0.4; const ax = (d > 0 ? p.x * T : p.x * T + 16), ay = p.y * T; for (let k = 0; k < 6; k++) { const a = k / 5 * Math.PI / 2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + d * Math.cos(a) * 22, ay + Math.sin(a) * 22); c.stroke(); } for (let r = 5; r < 22; r += 5) { c.beginPath(); for (let k = 0; k <= 5; k++) { const a = k / 5 * Math.PI / 2; const px = ax + d * Math.cos(a) * r, py = ay + Math.sin(a) * r; k ? c.quadraticCurveTo(ax + d * Math.cos(a - 0.15) * r * 0.85, ay + Math.sin(a - 0.15) * r * 0.85, px, py) : c.moveTo(px, py); } c.stroke(); } break; }
      case "portraet": {
        const w = 16, h = 20, px = x - w / 2, py = gy - 32;
        c.fillStyle = "#8a6a2a"; c.fillRect(px - 2, py - 2, w + 4, h + 4); c.fillStyle = "#c8a040"; c.fillRect(px - 1, py - 1, w + 2, 0.8); c.fillStyle = "#2a1e1a"; c.fillRect(px, py, w, h);
        const fc = FACES[p.face % FACES.length]; c.fillStyle = "#3a2a3a"; c.beginPath(); c.moveTo(px + 2, py + h); c.quadraticCurveTo(px + w / 2, py + h - 9, px + w - 2, py + h); c.fill();
        ell(c, px + w / 2, py + 8, 4, 5, fc); c.fillStyle = "#1a1014"; c.fillRect(px + w / 2 - 2, py + 7, 1, 1); c.fillRect(px + w / 2 + 1, py + 7, 1, 1);
        if (p.face === 1) { c.fillStyle = "#4a3a2a"; c.beginPath(); c.moveTo(px + w / 2 - 4, py + 6); c.lineTo(px + w / 2, py + 1); c.lineTo(px + w / 2 + 4, py + 6); c.fill(); }
        if (p.face === 4) { c.fillStyle = "#c8c0b0"; c.fillRect(px + w / 2 - 4, py + 3, 8, 2); }
        c.strokeStyle = "#1a1014"; c.lineWidth = 0.5; c.beginPath(); c.arc(px + w / 2, py + 10, 1.5, 0.2, Math.PI - 0.2); c.stroke(); /* lächelt */
        c.fillStyle = "rgba(255,240,200,.08)"; c.fillRect(px, py, w, h / 2); break;
      }
      case "wandteppich": { const w = 18, h = 28, px = x - w / 2, py = gy - 36, sw = Math.sin(t * 0.7 + s * 5) * 0.6; c.fillStyle = "#3a2a1a"; c.fillRect(px - 2, py - 1, w + 4, 1.6); c.fillStyle = "#5a1a24"; c.beginPath(); c.moveTo(px, py); c.lineTo(px + w, py); c.lineTo(px + w + sw, py + h); c.lineTo(px + sw, py + h); c.fill(); c.fillStyle = "#c8a040"; c.fillRect(px + 2, py + 2, w - 4, 0.8); c.fillRect(px + 2 + sw * 0.8, py + h - 3, w - 4, 0.8); c.strokeStyle = "#c8a040"; c.lineWidth = 0.7; c.beginPath(); c.arc(px + w / 2 + sw * 0.4, py + h * 0.45, 4, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(px + w / 2 + sw * 0.4, py + h * 0.3); c.lineTo(px + w / 2 + sw * 0.4, py + h * 0.62); c.stroke(); for (let k = 0; k < 5; k++) { c.fillStyle = "#c8a040"; c.fillRect(px + 1 + k * 4 + sw, py + h, 0.8, 2.5); } break; }
      case "geweih": wood(c, x - 4, gy - 24, 8, 5, "#5a3a22"); c.strokeStyle = "#d8c8a8"; c.lineWidth = 1; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * 2, gy - 24); c.quadraticCurveTo(x + d * 8, gy - 28, x + d * 10, gy - 36); c.stroke(); c.beginPath(); c.moveTo(x + d * 6, gy - 28); c.lineTo(x + d * 4, gy - 33); c.moveTo(x + d * 8, gy - 31); c.lineTo(x + d * 12, gy - 33); c.stroke(); } break;
      case "fesseln": c.fillStyle = "#3a3434"; c.fillRect(x - 6, gy - 30, 3, 3); c.fillRect(x + 3, gy - 30, 3, 3); c.strokeStyle = "#5a5450"; c.lineWidth = 0.7; c.setLineDash([1.5, 1]); for (const dx of [-4.5, 4.5]) { const sw = Math.sin(t * 0.8 + dx) * 0.6; c.beginPath(); c.moveTo(x + dx, gy - 27); c.lineTo(x + dx + sw, gy - 18); c.stroke(); } c.setLineDash([]); for (const dx of [-4.5, 4.5]) { c.beginPath(); c.arc(x + dx, gy - 16.5, 1.6, 0, TAU); c.stroke(); } break;
      case "strichliste": c.strokeStyle = "rgba(220,210,190,.55)"; c.lineWidth = 0.6; const n = 7 + ((s * 20) | 0); for (let k = 0; k < n; k++) { const gx = x - 10 + (k % 15) * 1.5 + Math.floor((k % 15) / 5) * 1.5, gy2 = gy - 28 + Math.floor(k / 15) * 8; if (k % 5 === 4) { c.beginPath(); c.moveTo(gx - 6.5, gy2 + 4); c.lineTo(gx, gy2); c.stroke(); } else { c.beginPath(); c.moveTo(gx, gy2); c.lineTo(gx, gy2 + 5); c.stroke(); } } break;
      case "rettungsring": c.strokeStyle = "#c8c0b0"; c.lineWidth = 2.4; c.beginPath(); c.arc(x, gy - 24, 5, 0, TAU); c.stroke(); c.strokeStyle = "#a83030"; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x, gy - 24, 5, k * Math.PI / 2, k * Math.PI / 2 + 0.5); c.stroke(); } break;
      case "netzwand": c.strokeStyle = "rgba(180,160,120,.6)"; c.lineWidth = 0.4; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x - 12 + k * 4, gy - 36); c.quadraticCurveTo(x - 12 + k * 4 + 2, gy - 26, x - 12 + k * 4 + 1, gy - 16); c.stroke(); } for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x - 12, gy - 34 + k * 4); c.quadraticCurveTo(x, gy - 32 + k * 4 + 2, x + 10, gy - 34 + k * 4); c.stroke(); } ell(c, x - 6, gy - 22, 1.6, 1.6, "#c89a40"); ell(c, x + 4, gy - 30, 1.6, 1.6, "#c89a40"); break;
      case "zahnrad": { const r = 6 + s * 6, a = t * (s > 0.5 ? 0.4 : -0.5); c.save(); c.translate(x, gy - 26); c.rotate(a); c.fillStyle = "#6a5030"; c.beginPath(); for (let q = 0; q < 12; q++) { const b = q / 12 * TAU; c.lineTo(Math.cos(b) * r, Math.sin(b) * r); c.lineTo(Math.cos(b) * (r + 2), Math.sin(b) * (r + 2)); c.lineTo(Math.cos(b + 0.26) * (r + 2), Math.sin(b + 0.26) * (r + 2)); c.lineTo(Math.cos(b + 0.26) * r, Math.sin(b + 0.26) * r); } c.fill(); ell(c, 0, 0, r * 0.35, r * 0.35, "#3a2a1a"); c.restore(); break; }
      case "seilrolle": c.fillStyle = "#4a3a2a"; ell(c, x, gy - 30, 4, 4, "#4a3a2a"); c.strokeStyle = "#a08050"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 4, gy - 30); c.lineTo(x - 4, gy - 8); c.moveTo(x + 4, gy - 30); c.lineTo(x + 4 + Math.sin(t) * 0.8, gy - 12); c.stroke(); c.fillStyle = "#5a4a3a"; c.fillRect(x + 2, gy - 12, 4, 3); break;
      case "zangen": c.strokeStyle = "#4a4448"; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const zx = x - 6 + k * 6; c.beginPath(); c.moveTo(zx - 1, gy - 30); c.lineTo(zx + 1, gy - 16); c.moveTo(zx + 1, gy - 30); c.lineTo(zx - 1, gy - 16); c.stroke(); } wood(c, x - 10, gy - 31, 20, 1.5, "#4a3020"); break;
      case "runentafel": { c.fillStyle = "#4a4250"; c.fillRect(x - 8, gy - 34, 16, 18); const g = 0.5 + 0.5 * Math.sin(t * 1.6 + s * 9); c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,170,60," + g + ")"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 4, gy - 31); c.lineTo(x, gy - 25); c.lineTo(x + 4, gy - 31); c.moveTo(x - 4, gy - 22); c.lineTo(x + 4, gy - 22); c.moveTo(x, gy - 25); c.lineTo(x, gy - 19); c.stroke(); c.restore(); break; }
      case "algen": c.strokeStyle = "#3a6a4a"; c.lineWidth = 1; for (let k = 0; k < 5; k++) { const ax = x - 8 + k * 4, sw = Math.sin(t * 0.9 + k) * 2; c.beginPath(); c.moveTo(ax, gy - 36); c.quadraticCurveTo(ax + sw, gy - 28, ax - sw * 0.5, gy - 18 - k); c.stroke(); } break;
      case "ketten": c.strokeStyle = "#4a4440"; c.lineWidth = 1.2; c.setLineDash([2, 1]); for (const dx of [-5, 5]) { const sw = Math.sin(t * 0.7 + dx) * 1.5; c.beginPath(); c.moveTo(x + dx, gy - 36); c.quadraticCurveTo(x + dx + sw, gy - 26, x + dx + sw * 1.5, gy - 16); c.stroke(); } c.setLineDash([]); break;
    }
  }
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (Z.level === lvRef && props.length) {
      const cam = Z.cam;
      c.save();
      for (const p of props) { const x = p.x * T; if (x < cam.x - 60 || x > cam.x + cam.w + 60 || p.y * T < cam.y - 60 || p.y * T > cam.y + cam.h + 60) continue; draw(c, p, t); }
      c.restore();
    }
    if (dwp0) dwp0.apply(this, arguments);
  };

  /* ---------- Gemalter Vordergrund ---------- */
  const FGK = { castle: ["saeule", "laterne", "ast"], ramparts: ["saeule", "banner", "laterne"], spires: ["bogen", "banner"], storm: ["bogen", "kraehe"], halls: ["vorhang", "kronleuchter", "saeule"], cellar: ["fass", "spinnwebe", "saeule"], dungeon: ["gitter", "kette", "kaefig"], harbour: ["tau", "netz", "mast"], belltower: ["zahnrad", "seil"], forge: ["kette", "esse"], chasm: ["netzfaden", "pilz", "zapfen"], lake: ["schilf", "wurzel", "zapfen"], embercity: ["schlot", "laterne"] };
  const spriteCache = new Map();
  function sprite(kind, seed) {
    const key = kind + ((seed * 4) | 0); if (spriteCache.has(key)) return spriteCache.get(key);
    const W = 160, H = 260, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
    const col = "#0a0608", rim = "rgba(255,200,150,.12)", R = Z.Rng((seed * 1e6) >>> 0);
    c.fillStyle = col; c.strokeStyle = col;
    switch (kind) {
      case "saeule": { const w = 44; c.fillRect(W / 2 - w / 2, 30, w, H); c.fillRect(W / 2 - w / 2 - 8, 18, w + 16, 14); c.fillRect(W / 2 - w / 2 - 12, 10, w + 24, 8); for (let k = 0; k < 4; k++) { c.fillStyle = "rgba(255,255,255,.03)"; c.fillRect(W / 2 - w / 2 + 6 + k * 10, 34, 3, H); } c.fillStyle = rim; c.fillRect(W / 2 - w / 2, 30, 2, H); c.fillStyle = "#0e140c"; for (let i = 0; i < 90; i++) { const y = 40 + R() * 200, x = W / 2 - w / 2 + Math.sin(y * 0.05) * w * 0.4 + w / 2 + (R() - 0.5) * 16; c.beginPath(); c.ellipse(x, y, 4 + R() * 4, 2.5 + R() * 2, R() * 3, 0, TAU); c.fill(); } break; }
      case "laterne": { c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, 120); c.stroke(); c.fillRect(W / 2 - 10, 118, 20, 4); c.beginPath(); c.moveTo(W / 2 - 9, 122); c.lineTo(W / 2 + 9, 122); c.lineTo(W / 2 + 7, 150); c.lineTo(W / 2 - 7, 150); c.fill(); c.fillStyle = "#ffb050"; c.fillRect(W / 2 - 5, 126, 10, 20); c.fillStyle = col; c.fillRect(W / 2 - 0.8, 126, 1.6, 20); c.fillRect(W / 2 - 5, 135, 10, 1.4); c.beginPath(); c.moveTo(W / 2 - 11, 118); c.lineTo(W / 2, 108); c.lineTo(W / 2 + 11, 118); c.fill(); break; }
      case "ast": { c.lineWidth = 10; c.lineCap = "round"; c.beginPath(); c.moveTo(-10, 20); c.quadraticCurveTo(60, 40, 140, 90); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(70, 50); c.quadraticCurveTo(90, 80, 80, 120); c.stroke(); c.beginPath(); c.moveTo(110, 72); c.quadraticCurveTo(140, 70, 155, 50); c.stroke(); for (let i = 0; i < 140; i++) { const t = R(), x = -10 + t * 160 + (R() - 0.5) * 30, y = 20 + t * 70 + (R() - 0.5) * 40; c.beginPath(); c.ellipse(x, y, 5 + R() * 4, 2 + R() * 2, R() * 3, 0, TAU); c.fill(); } break; }
      case "banner": { c.fillRect(W / 2 - 2, 0, 4, H); c.fillRect(W / 2 - 30, 20, 60, 4); c.beginPath(); c.moveTo(W / 2 - 26, 24); c.lineTo(W / 2 + 26, 24); c.lineTo(W / 2 + 26, 150); c.lineTo(W / 2, 130); c.lineTo(W / 2 - 26, 150); c.fill(); c.fillStyle = "rgba(120,20,20,.35)"; c.fillRect(W / 2 - 24, 26, 48, 100); break; }
      case "bogen": { c.fillRect(0, 0, 30, H); c.fillRect(W - 30, 0, 30, H); c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, 60); c.arc(W / 2, 60, W / 2 - 30, 0, Math.PI, true); c.lineTo(0, 60); c.fill(); for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(255,255,255,.04)"; c.fillRect(2, 20 + i * 40, 26, 1); } c.fillStyle = rim; c.fillRect(30, 60, 1.5, H); break; }
      case "kraehe": { c.fillRect(0, 120, W, 12); c.beginPath(); c.ellipse(70, 108, 12, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(82, 98, 6, 0, TAU); c.fill(); c.beginPath(); c.moveTo(87, 97); c.lineTo(96, 100); c.lineTo(87, 101); c.fill(); c.beginPath(); c.moveTo(58, 106); c.lineTo(44, 112); c.lineTo(58, 112); c.fill(); c.fillRect(68, 114, 1.5, 7); c.fillRect(74, 114, 1.5, 7); break; }
      case "vorhang": { const g = c.createLinearGradient(0, 0, W, 0); for (let k = 0; k <= 8; k++) g.addColorStop(k / 8, k % 2 ? "#120608" : "#1e0a0e"); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.quadraticCurveTo(W * 0.7, H * 0.5, W * 0.85, H); c.lineTo(0, H); c.fill(); c.fillStyle = "#3a2a10"; c.fillRect(W * 0.5, H * 0.45, 30, 4); c.beginPath(); c.arc(W * 0.5 + 30, H * 0.47, 5, 0, TAU); c.fill(); c.fillRect(W * 0.5 + 28, H * 0.47, 4, 18); break; }
      case "kronleuchter": { c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, 80); c.stroke(); c.beginPath(); c.ellipse(W / 2, 90, 60, 10, 0, 0, Math.PI); c.lineWidth = 5; c.stroke(); for (let k = 0; k < 7; k++) { const x = W / 2 - 54 + k * 18; c.fillRect(x - 2, 86, 4, 6); c.fillStyle = "#e8dcc0"; c.fillRect(x - 1.5, 76, 3, 10); c.fillStyle = "#ffcf7a"; c.beginPath(); c.ellipse(x, 72, 2, 4, 0, 0, TAU); c.fill(); c.fillStyle = col; } break; }
      case "fass": { for (const [x, y, r] of [[50, H - 40, 34], [110, H - 40, 34], [80, H - 100, 34]]) { c.beginPath(); c.ellipse(x, y, r * 0.85, r, 0, 0, TAU); c.fill(); c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r * 0.6, r * 0.7, 0, 0, TAU); c.stroke(); } break; }
      case "spinnwebe": { c.strokeStyle = "rgba(220,214,230,.22)"; c.lineWidth = 0.8; for (let k = 0; k < 9; k++) { const a = k / 8 * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); c.stroke(); } for (let r = 15; r < 150; r += 15) { c.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI / 2; k ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); } break; }
      case "gitter": { for (let x = 40; x < W - 40; x += 16) c.fillRect(x, H * 0.45, 5, H); c.fillRect(30, H * 0.45, W - 60, 6); c.fillStyle = rim; for (let x = 40; x < W - 40; x += 16) c.fillRect(x, H * 0.45, 1, H); break; }
      case "kette": { c.lineWidth = 5; for (let y = 0; y < 220; y += 14) { c.beginPath(); c.ellipse(W / 2 + Math.sin(y * 0.02) * 4, y, 5, 8, (y / 14) % 2 ? 0 : Math.PI / 2, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(W / 2 - 14, 226); c.quadraticCurveTo(W / 2, 250, W / 2 + 14, 226); c.lineWidth = 6; c.stroke(); break; }
      case "kaefig": { c.lineWidth = 2; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(W / 2, 60); c.stroke(); c.lineWidth = 4; c.beginPath(); c.ellipse(W / 2, 120, 40, 60, 0, 0, TAU); c.stroke(); c.lineWidth = 3; for (let k = -30; k <= 30; k += 10) { c.beginPath(); c.moveTo(W / 2 + k, 66); c.lineTo(W / 2 + k, 176); c.stroke(); } c.beginPath(); c.arc(W / 2, 150, 7, 0, TAU); c.fill(); c.fillRect(W / 2 - 1, 156, 2, 16); break; }
      case "tau": { c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(W / 2, 140, W, 30); c.stroke(); c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(30 + k * 30, 60 + k * 10); c.lineTo(32 + k * 30, 150 + k * 15); c.stroke(); } break; }
      case "netz": { c.strokeStyle = col; c.lineWidth = 1.4; for (let k = 0; k < 12; k++) { c.beginPath(); c.moveTo(k * 14, 0); c.quadraticCurveTo(k * 14 + 20, 120, k * 14 - 10, 220); c.stroke(); } for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(0, k * 16); c.quadraticCurveTo(80, k * 16 + 20, 160, k * 16 - 6); c.stroke(); } break; }
      case "mast": { c.fillRect(W / 2 - 6, 0, 12, H); c.fillRect(0, 40, W, 5); c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2, 0); c.lineTo(0, H); c.moveTo(W / 2, 0); c.lineTo(W, H); c.stroke(); break; }
      case "zahnrad": { const r = 70; c.beginPath(); for (let q = 0; q < 18; q++) { const a = q / 18 * TAU; c.lineTo(W / 2 + Math.cos(a) * r, 130 + Math.sin(a) * r); c.lineTo(W / 2 + Math.cos(a) * (r + 10), 130 + Math.sin(a) * (r + 10)); c.lineTo(W / 2 + Math.cos(a + 0.17) * (r + 10), 130 + Math.sin(a + 0.17) * (r + 10)); c.lineTo(W / 2 + Math.cos(a + 0.17) * r, 130 + Math.sin(a + 0.17) * r); } c.fill(); c.globalCompositeOperation = "destination-out"; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 40, 130 + Math.sin(a) * 40, 16, 0, TAU); c.fill(); } c.globalCompositeOperation = "source-over"; break; }
      case "seil": { c.lineWidth = 3; c.beginPath(); c.moveTo(W * 0.3, 0); c.lineTo(W * 0.32, H); c.moveTo(W * 0.7, 0); c.lineTo(W * 0.66, H * 0.8); c.stroke(); c.fillRect(W * 0.62, H * 0.8, 16, 20); break; }
      case "esse": { c.fillRect(20, 60, 120, H); c.fillRect(50, 0, 60, 60); c.fillStyle = "#ff6a1a"; c.beginPath(); c.arc(80, H - 40, 30, Math.PI, 0); c.fill(); c.fillStyle = "#ffb050"; c.beginPath(); c.arc(80, H - 34, 18, Math.PI, 0); c.fill(); break; }
      case "netzfaden": { c.strokeStyle = "rgba(220,214,230,.28)"; c.lineWidth = 1; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(R() * W, 0); c.quadraticCurveTo(R() * W, H * 0.5, R() * W, H); c.stroke(); } break; }
      case "pilz": { for (let k = 0; k < 3; k++) { const x = 30 + k * 50, h = 80 + R() * 100; c.fillRect(x - 5, H - h, 10, h); c.beginPath(); c.ellipse(x, H - h, 30, 14, 0, Math.PI, 0); c.fill(); c.fillStyle = "rgba(200,120,255,.25)"; c.beginPath(); c.ellipse(x, H - h - 2, 26, 3, 0, 0, TAU); c.fill(); c.fillStyle = col; } break; }
      case "zapfen": { for (let k = 0; k < 4; k++) { const x = 20 + k * 40, w = 14 + R() * 16, h = 80 + R() * 140; c.beginPath(); c.moveTo(x - w, 0); c.lineTo(x + w, 0); c.lineTo(x, h); c.fill(); } break; }
      case "schilf": { c.lineWidth = 3; for (let k = 0; k < 14; k++) { const x = k * 12, h = 120 + R() * 120; c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + 10, H - h * 0.5, x + 18, H - h); c.stroke(); if (k % 3 === 0) { c.beginPath(); c.ellipse(x + 18, H - h, 3, 12, 0.3, 0, TAU); c.fill(); } } break; }
      case "wurzel": { c.lineWidth = 6; c.lineCap = "round"; for (let k = 0; k < 5; k++) { c.beginPath(); const x = 20 + k * 30; c.moveTo(x, 0); c.bezierCurveTo(x + 20, 60, x - 20, 120, x + (R() - 0.5) * 40, 160 + R() * 60); c.stroke(); c.lineWidth = 3; } break; }
      case "schlot": { c.fillRect(40, 40, 50, H); c.fillRect(34, 30, 62, 12); c.fillStyle = "#ffb050"; for (let k = 0; k < 3; k++) c.fillRect(56, 80 + k * 50, 14, 20); break; }
    }
    spriteCache.set(key, cv); return cv;
  }
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    const B = Z.biome || {}, lv = Z.level; if (!lv || lv.hub || lv.arena || lv.passage) return;
    if (Z.gq && Z.gq.level === 0) return;
    const kinds = FGK[B.bg]; if (!kinds) return;
    const S = Z.gfx.scale || 1, f = 1.5, span = 520, sx = cam.x * f;
    const i0 = Math.floor(sx / span) - 1, i1 = Math.floor((sx + cam.w * 1.2) / span) + 1;
    c.save(); c.setTransform(S, 0, 0, S, 0, 0);
    for (let i = i0; i <= i1; i++) {
      const r = hash(i * 3.1, (lv.seed || 3) % 97); if (r < 0.62) continue;
      const kind = kinds[(hash(i, 7.7) * kinds.length) | 0];
      const spr = sprite(kind, hash(i, 1.3));
      const x = i * span + r * 200 - sx, top = ["laterne", "kronleuchter", "kette", "kaefig", "zapfen", "netzfaden", "wurzel", "spinnwebe", "ast", "tau", "zahnrad", "seil", "banner"].includes(kind);
      const sc = cam.h / 300 * (0.9 + hash(i, 4.4) * 0.4);
      const w = spr.width * sc, h = spr.height * sc;
      const y = top ? -h * 0.15 : cam.h - h * 0.85;
      /* zur Bildmitte hin durchscheinend, damit der Vordergrund nie das Spiel verdeckt */
      const mid = Math.abs(x + w / 2 - cam.w / 2) / (cam.w * 0.5);
      c.globalAlpha = Math.max(0.28, Math.min(1, (mid - 0.15) / 0.55));
      if (kind === "spinnwebe" && hash(i, 9.9) > 0.5) { c.save(); c.translate(x + w, y); c.scale(-1, 1); c.drawImage(spr, 0, 0, w, h); c.restore(); }
      else c.drawImage(spr, x, y, w, h);
      /* Lichter in Laternen und Kronleuchtern flackern */
      if (kind === "laterne" || kind === "kronleuchter" || kind === "esse" || kind === "schlot") {
        const lx = x + w / 2, ly = y + (kind === "laterne" ? 136 : kind === "kronleuchter" ? 72 : kind === "esse" ? 220 : 100) * sc, fl = 0.75 + 0.25 * Math.sin(t * 9 + i) * Math.sin(t * 5.3 + i * 2);
        c.globalAlpha = 1; c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(lx, ly, 0, lx, ly, 70 * sc); g.addColorStop(0, "rgba(255,180,90," + 0.35 * fl + ")"); g.addColorStop(1, "rgba(255,150,60,0)"); c.fillStyle = g; c.beginPath(); c.arc(lx, ly, 70 * sc, 0, TAU); c.fill(); c.restore();
      }
      c.globalAlpha = 1;
    }
    c.restore();
  };
  Z.ausstattung = () => props;
})();
