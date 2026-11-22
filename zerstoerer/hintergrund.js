/* Ezekiel – The Destroyer · Hintergrund-Leben
   Kleine Szenen, die zu zufälligen Momenten im Hintergrund passieren – meistens niedlich, manchmal ein kleiner Gag:
   eine Maus huscht vorbei, eine Katze jagt sie, ein Goblin stolpert in den Abgrund, ein Skelett verliert seinen Kopf …
   Jedes Gebiet hat seine eigenen Szenen. Die Figuren sind leicht abgedunkelt und kleiner: sie gehören zur Kulisse, nicht zum Kampf. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, W = Z.world, L = v => Z.L(v);
  const { limb, circ, poly, ell, glow } = Z.draw;
  const R = () => Math.random(), pick = a => a[(Math.random() * a.length) | 0];

  /* ======================= FIGUREN (Ursprung = Füße, Blick nach rechts) ======================= */
  const S = {
    maus: (c, t, m) => { const b = Math.sin(t * 30) * m; ell(c, 0, -2.4, 3.4, 2.2, "#8a7a70"); circ(c, 3, -3, 1.6, "#8a7a70"); circ(c, 2.6, -4.6, 1, "#c89a8a"); c.fillStyle = "#111"; c.fillRect(3.8, -3.4, 0.7, 0.7); limb(c, -3, -2, -7, -3 + b, 0.5, "#c89a8a"); limb(c, -1.5, -0.5, -1.5 + b, 0, 0.6, "#6a5a50"); limb(c, 1.5, -0.5, 1.5 - b, 0, 0.6, "#6a5a50"); },
    ratte: (c, t, m) => { const b = Math.sin(t * 26) * m; ell(c, 0, -3, 5, 3, "#5a4a40"); circ(c, 4.5, -3.6, 2.2, "#5a4a40"); c.fillStyle = "#ff4a3a"; c.fillRect(5.6, -4.4, 0.8, 0.8); limb(c, -5, -3, -11, -2 + b, 0.7, "#c89a8a"); limb(c, -2, -1, -2 + b * 1.5, 0, 0.8, "#3a2a20"); limb(c, 2, -1, 2 - b * 1.5, 0, 0.8, "#3a2a20"); },
    katze: (c, t, m) => { const b = Math.sin(t * 18) * m; ell(c, 0, -4.5, 5.5, 3, "#3a3036"); circ(c, 5, -7, 2.6, "#3a3036"); poly(c, [3.6, -9, 4.2, -11.5, 5.4, -9.2], "#3a3036"); poly(c, [5.6, -9.2, 6.6, -11.4, 7, -8.6], "#3a3036"); c.fillStyle = "#e8d060"; c.fillRect(5.6, -7.6, 0.9, 0.9); c.fillRect(7, -7.4, 0.8, 0.8);
      c.strokeStyle = "#3a3036"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-5, -5); c.quadraticCurveTo(-9, -8 + Math.sin(t * 4) * 2, -8, -12); c.stroke(); for (const [x, p] of [[-3, b], [-1, -b], [2.5, -b], [4, b]]) limb(c, x, -3, x + p * 1.6, 0, 1, "#2a2026"); },
    hund: (c, t, m) => { Z.drawRex(c, 0, 0, 1, t, m ? t * 10 : 0, false); },
    huhn: (c, t, m) => { const b = Math.sin(t * 24) * m; ell(c, 0, -5, 4, 3.4, "#e8e0d0"); circ(c, 3.5, -8, 2, "#e8e0d0"); poly(c, [5.2, -8.4, 7.2, -7.8, 5.2, -7.2], "#e5a43a"); poly(c, [2.6, -10, 3.4, -11.6, 4.2, -10], "#d03a3a"); c.fillStyle = "#111"; c.fillRect(4, -8.6, 0.7, 0.7); poly(c, [-4, -6, -7, -9, -6, -4], "#d8d0c0"); limb(c, -1, -2, -1 + b, 0, 0.6, "#e5a43a"); limb(c, 1, -2, 1 - b, 0, 0.6, "#e5a43a"); },
    frosch: (c, t, m) => { ell(c, 0, -2.4, 3.6, 2.4, "#5a8a3a"); circ(c, 2, -4.4, 1.3, "#5a8a3a"); circ(c, -0.6, -4.4, 1.3, "#5a8a3a"); c.fillStyle = "#111"; c.fillRect(2, -4.8, 0.7, 0.7); c.fillRect(-0.6, -4.8, 0.7, 0.7); limb(c, -3, -1, -4.5, 0, 0.9, "#4a7a2a"); limb(c, 3, -1, 4.5, 0, 0.9, "#4a7a2a"); },
    schnecke: (c, t) => { ell(c, 0, -0.8, 5, 1, "#a89a7a"); circ(c, -0.5, -3.4, 2.8, "#a0603a"); c.strokeStyle = "#e0b070"; c.lineWidth = 0.5; c.beginPath(); c.arc(-0.5, -3.4, 1.4, 0, 5); c.stroke(); limb(c, 4, -1, 5.4, -3.6 + Math.sin(t * 3) * 0.4, 0.4, "#a89a7a"); limb(c, 3.4, -1, 4.2, -3.8, 0.4, "#a89a7a"); },
    vogel: (c, t, m) => { const f = Math.sin(t * 22) * 3 * m; ell(c, 0, -3, 3, 2, "#4a3a30"); circ(c, 2.6, -4, 1.4, "#4a3a30"); poly(c, [3.8, -4.2, 5.4, -3.8, 3.8, -3.4], "#e5a43a"); poly(c, [-1, -4, -3, -6 - f, 1, -4.5], "#6a5040"); },
    taube: (c, t, m) => { const b = Math.sin(t * 20) * m; ell(c, 0, -3.4, 3.6, 2.4, "#8a8890"); circ(c, 3, -5, 1.6, "#9a98a0"); poly(c, [4.4, -5.2, 5.6, -4.8, 4.4, -4.6], "#c87a60"); c.fillStyle = "#e0d060"; c.fillRect(3.4, -5.6, 0.6, 0.6); limb(c, -0.6, -1.2, -0.6 + b, 0, 0.5, "#c86050"); limb(c, 0.8, -1.2, 0.8 - b, 0, 0.5, "#c86050"); },
    fledermaus: (c, t) => { const f = Math.sin(t * 26) * 4; ell(c, 0, 0, 2, 2.4, "#1e1418"); poly(c, [-1, -1, -7, -3 - f, -4, 1, -2, 0.5], "#2a1c22"); poly(c, [1, -1, 7, -3 - f, 4, 1, 2, 0.5], "#2a1c22"); c.fillStyle = "#ff5a3a"; c.fillRect(-0.9, -0.8, 0.6, 0.6); c.fillRect(0.4, -0.8, 0.6, 0.6); },
    motte: (c, t) => { const f = Math.abs(Math.sin(t * 30)) * 3; ell(c, 0, 0, 0.8, 1.6, "#c8b090"); ell(c, -1.6, -0.4, 1.8, 1 + f * 0.3, "#e8dcc0", -0.4); ell(c, 1.6, -0.4, 1.8, 1 + f * 0.3, "#e8dcc0", 0.4); },
    spinne: (c, t) => { ell(c, 0, 0, 2.6, 2.2, "#2a2228"); circ(c, 0, 2, 1.4, "#2a2228"); for (let i = 0; i < 4; i++) { const w = Math.sin(t * 10 + i) * 0.6; limb(c, -1.5, 0.4 + i * 0.6, -4.5, -1 + i * 1.6 + w, 0.4, "#2a2228"); limb(c, 1.5, 0.4 + i * 0.6, 4.5, -1 + i * 1.6 - w, 0.4, "#2a2228"); } c.fillStyle = "#e04040"; c.fillRect(-0.8, 2.2, 0.6, 0.5); c.fillRect(0.3, 2.2, 0.6, 0.5); },
    krabbe: (c, t, m) => { const b = Math.sin(t * 18) * m; ell(c, 0, -2, 4, 2, "#c8503a"); circ(c, -1.2, -4, 0.7, "#111"); circ(c, 1.2, -4, 0.7, "#111"); limb(c, -3.6, -2.4, -5.6, -4 + b, 1, "#c8503a"); limb(c, 3.6, -2.4, 5.6, -4 - b, 1, "#c8503a"); for (let i = -1; i <= 1; i++) { limb(c, -2 + i, -1, -4 + i, 0, 0.5, "#a8402a"); limb(c, 2 + i, -1, 4 + i, 0, 0.5, "#a8402a"); } },
    moewe: (c, t) => { const f = Math.sin(t * 9) * 4; ell(c, 0, 0, 3, 1.6, "#e8e8e8"); poly(c, [-1, -0.5, -8, -2 - f, -2, 1], "#d8d8d8"); poly(c, [1, -0.5, 8, -2 - f, 2, 1], "#d8d8d8"); poly(c, [3, -0.2, 5, 0.2, 3, 0.6], "#e5a43a"); },
    fisch: (c, t) => { ell(c, 0, 0, 4, 1.8, "#a8b8a0"); poly(c, [-3.5, 0, -6.5, -2, -6.5, 2], "#8a9a80"); c.fillStyle = "#111"; c.fillRect(2.2, -0.6, 0.6, 0.6); },
    schleim: (c, t, m) => { const s = 1 + Math.sin(t * 8) * 0.12; c.save(); c.scale(1 / s, s); ell(c, 0, -2.6, 4, 2.8, "rgba(150,210,90,.85)"); c.restore(); c.fillStyle = "#1a2a10"; c.fillRect(0.8, -3.6, 0.8, 0.8); c.fillRect(2.4, -3.6, 0.8, 0.8); },
    pilz: (c, t, m) => { const b = Math.sin(t * 6) * 1.5 * m; limb(c, 0, 0, 0, -5, 2.2, "#e8d8c0"); ell(c, b * 0.3, -6, 4.4, 2.4, "#a05aa0"); for (const x of [-2, 1]) circ(c, x + b * 0.3, -6.8, 0.7, "#f0c8f0"); c.fillStyle = "#2a1a2a"; c.fillRect(-0.9, -3.6, 0.6, 0.6); c.fillRect(0.6, -3.6, 0.6, 0.6); limb(c, -1, -3, -3.4, -4 - b, 0.7, "#e8d8c0"); limb(c, 1, -3, 3.4, -4 + b, 0.7, "#e8d8c0"); },
    goblin: (c, t, m) => { const b = Math.sin(t * 16) * m; limb(c, -1.2, -4, -1.2 + b * 1.5, 0, 1.2, "#3a2a20"); limb(c, 1.2, -4, 1.2 - b * 1.5, 0, 1.2, "#3a2a20"); ell(c, 0, -6.5, 2.8, 3, "#6a4a2a"); circ(c, 0.6, -10.5, 2.6, "#6f9a3a"); poly(c, [2.4, -11, 6, -12.4, 2.6, -10], "#6f9a3a"); poly(c, [-1.6, -11, -4.8, -12.6, -1.4, -10], "#6f9a3a"); c.fillStyle = "#ffd040"; c.fillRect(1.6, -11, 0.8, 0.8); },
    skelett: (c, t, m, o) => { const b = Math.sin(t * 12) * m; limb(c, -1.2, -5, -1.2 + b * 1.4, 0, 0.9, "#d8d0c0"); limb(c, 1.2, -5, 1.2 - b * 1.4, 0, 0.9, "#d8d0c0"); for (let i = 0; i < 3; i++) limb(c, -2, -6 - i * 1.5, 2, -6 - i * 1.5, 0.6, "#d8d0c0"); limb(c, 0, -5, 0, -10, 0.7, "#d8d0c0"); limb(c, 0, -9, 3, -6 + b, 0.7, "#d8d0c0"); if (!o || !o.headless) { circ(c, 0.4, -12, 2.4, "#e8e2d0"); c.fillStyle = "#1a1010"; c.fillRect(0.6, -12.6, 0.9, 0.9); c.fillRect(1.9, -12.4, 0.7, 0.7); } },
    kopf: c => { circ(c, 0, -2.4, 2.4, "#e8e2d0"); c.fillStyle = "#1a1010"; c.fillRect(0.2, -3, 0.9, 0.9); c.fillRect(1.5, -2.8, 0.7, 0.7); },
    duergar: (c, t, m) => { const b = Math.sin(t * 12) * m; limb(c, -1.4, -3, -1.4 + b, 0, 1.6, "#3a3030"); limb(c, 1.4, -3, 1.4 - b, 0, 1.6, "#3a3030"); ell(c, 0, -6, 3.6, 3.4, "#5a5050"); circ(c, 0.6, -10, 2.6, "#8a8078"); poly(c, [-1, -9, 3, -9, 2, -5, 0, -6], "#3a3030"); },
    kobold: (c, t, m) => { const b = Math.sin(t * 18) * m; limb(c, -1, -3, -1 + b, 0, 1, "#8a4a2a"); limb(c, 1, -3, 1 - b, 0, 1, "#8a4a2a"); ell(c, 0, -5, 2.4, 2.6, "#a05a30"); circ(c, 1, -8.4, 2.2, "#a05a30"); poly(c, [2.4, -8.6, 5, -8, 2.4, -7.6], "#a05a30"); poly(c, [-0.4, -10, -1.4, -12.4, 0.6, -10.2], "#e8e0d0"); },
    imp: (c, t) => { const f = Math.sin(t * 20) * 2; ell(c, 0, -5, 2.4, 3, "#a02a2a"); circ(c, 0.6, -9, 2, "#a02a2a"); poly(c, [-0.6, -10.4, -1.4, -12.6, 0.2, -10.6], "#2a1010"); poly(c, [1.6, -10.4, 2.4, -12.6, 2.4, -10.4], "#2a1010"); poly(c, [-1.6, -6, -6, -9 - f, -3, -4], "#7a1a1a"); },
    geist: (c, t) => { c.globalAlpha *= 0.6; c.fillStyle = "#e8e4f0"; c.beginPath(); c.moveTo(-3.5, 0); c.quadraticCurveTo(-4, -10, 0, -11); c.quadraticCurveTo(4, -10, 3.5, 0); for (let i = 0; i < 4; i++) c.lineTo(3.5 - i * 2.33 - 1.1, -1.4 + (i % 2) * 1.4 + Math.sin(t * 8 + i) * 0.5); c.fill(); c.fillStyle = "#1a1020"; c.fillRect(-1.4, -8, 0.9, 1.2); c.fillRect(0.8, -8, 0.9, 1.2); },
    eule: (c, t) => { ell(c, 0, -4, 3.4, 4, "#7a6048"); circ(c, -1.2, -6, 1.3, "#f0e0a0"); circ(c, 1.2, -6, 1.3, "#f0e0a0"); const k = Math.sin(t * 0.7) > 0.95 ? 0.2 : 1; c.fillStyle = "#111"; c.fillRect(-1.5, -6.3, 0.7, 0.7 * k); c.fillRect(0.9, -6.3, 0.7, 0.7 * k); poly(c, [-0.4, -5, 0.4, -5, 0, -4], "#e5a43a"); poly(c, [-3, -7.6, -2.2, -9, -1.6, -7.6], "#7a6048"); poly(c, [3, -7.6, 2.2, -9, 1.6, -7.6], "#7a6048"); },
    kaefer: (c, t, m) => { const b = Math.sin(t * 30) * m; ell(c, 0, -1.6, 2.6, 1.6, "#2a4a3a"); circ(c, 2.2, -1.6, 1, "#1a2a22"); for (let i = -1; i <= 1; i++) limb(c, i * 1.2, -1, i * 1.2 + b * 0.6, 0, 0.4, "#111"); },
    salamander: (c, t, m) => { const b = Math.sin(t * 14) * m; ell(c, 0, -1.4, 4, 1.4, "#e0602a"); circ(c, 4, -1.6, 1.4, "#e0602a"); limb(c, -4, -1.4, -8, -1 + b, 0.9, "#c0501a"); for (const x of [-2, 2]) limb(c, x, -1, x + b, 0, 0.6, "#c0501a"); glow(c, 0, -1.4, 6, "rgba(255,120,40,.35)"); },
    kiste: c => { c.fillStyle = "#7a5a34"; c.fillRect(-3, -6, 6, 6); c.strokeStyle = "#4a3420"; c.lineWidth = 0.6; c.strokeRect(-3, -6, 6, 6); c.beginPath(); c.moveTo(-3, -6); c.lineTo(3, 0); c.stroke(); }
  };

  /* ======================= SZENEN JE GEBIET ======================= */
  /* Arten: walk, chase, fall, spider, fly, hop, sleep, dance, skull, carry, fish, peek */
  const SC = {
    lager: [["chase", "huhn", "hund", ["Gack!", "Wuff!"]], ["walk", "katze", "♪"], ["sleep", "katze"], ["hop", "frosch"], ["fly", "motte"], ["walk", "schnecke"], ["peek", "eule"]],
    torhof: [["chase", "maus", "katze", ["Quiek!", "Miau!"]], ["walk", "taube"], ["fall", "goblin", ["Waaah!", "Huiii!"]], ["walk", "schnecke"], ["carry", "goblin"], ["fly", "vogel"], ["hop", "frosch"], ["sleep", "goblin"], ["peek", "katze"]],
    keller: [["walk", "ratte"], ["chase", "ratte", "katze", ["Fiep!", "Fauch!"]], ["spider"], ["walk", "maus", "!"], ["fly", "fledermaus"], ["skull"], ["sleep", "kobold"], ["walk", "schnecke"], ["carry", "kobold"]],
    hallen: [["walk", "maus"], ["sleep", "skelett"], ["peek", "katze"], ["skull"], ["fall", "goblin", ["Hilfääää!", "Not the face!"]], ["fly", "motte"], ["walk", "geist", "Buuh?"], ["carry", "goblin"], ["chase", "maus", "katze", ["Quiek!", "Miau!"]]],
    wehrgang: [["walk", "taube"], ["fly", "vogel"], ["fall", "goblin", ["Neiiin!", "Nooo!"]], ["sleep", "goblin"], ["carry", "goblin"], ["fly", "moewe"], ["chase", "taube", "katze", ["Gurr!", "Miau!"]]],
    verlies: [["walk", "ratte"], ["skull"], ["spider"], ["sleep", "skelett"], ["walk", "geist"], ["fly", "fledermaus"], ["fall", "skelett", ["Klapper!", "Rattle!"]], ["walk", "kaefer"]],
    hafen: [["walk", "krabbe"], ["fly", "moewe"], ["fish"], ["chase", "krabbe", "katze", ["Klack!", "Miau!"]], ["walk", "taube"], ["fall", "kobold", ["Platsch!", "Splash!"]], ["carry", "kobold"], ["sleep", "katze"]],
    glocken: [["fly", "fledermaus"], ["walk", "taube"], ["peek", "eule"], ["spider"], ["fall", "kobold", ["Dong!", "Bong!"]], ["walk", "maus"], ["fly", "motte"]],
    schlund: [["walk", "pilz"], ["dance", "pilz"], ["walk", "schleim"], ["fly", "fledermaus"], ["spider"], ["fall", "duergar", ["Verfluchter Stein!", "Blasted rock!"]], ["walk", "kaefer"], ["hop", "frosch"]],
    schmiede: [["walk", "salamander"], ["carry", "duergar"], ["fall", "duergar", ["Heiß! Heiß!", "Hot! Hot!"]], ["sleep", "duergar"], ["walk", "ratte"], ["fly", "imp"], ["walk", "kaefer"]],
    zinnen: [["fly", "vogel"], ["fly", "imp"], ["fall", "imp", ["Ich kann fliegen! …nicht.", "I can fly! …not."]], ["walk", "taube"], ["peek", "eule"], ["sleep", "goblin"], ["fly", "moewe"]],
    see: [["fish"], ["hop", "frosch"], ["walk", "schnecke"], ["walk", "krabbe"], ["fly", "motte"], ["dance", "pilz"], ["walk", "schleim"], ["fall", "kobold", ["Blubb!", "Blub!"]]],
    glut: [["walk", "salamander"], ["fly", "imp"], ["fall", "imp", ["Autsch!", "Ouch!"]], ["walk", "kaefer"], ["carry", "duergar"], ["sleep", "imp"], ["dance", "salamander"]],
    sturm: [["fly", "vogel"], ["fly", "moewe"], ["fall", "goblin", ["Der Wind!", "The wind!"]], ["walk", "geist"], ["peek", "eule"], ["fly", "fledermaus"], ["sleep", "goblin"]]
  };

  /* ======================= Umgebung abtasten ======================= */
  function floors(cam) {
    const out = [], x0 = Math.floor(cam.x / T) + 1, x1 = Math.floor((cam.x + cam.w) / T) - 1, y0 = Math.floor(cam.y / T) + 1, y1 = Math.floor((cam.y + cam.h) / T) - 1;
    for (let y = y0; y <= y1; y++) {
      let s = -1;
      for (let x = x0; x <= x1 + 1; x++) {
        const ok = x <= x1 && W.tile(x, y) === 0 && W.tile(x, y - 1) === 0 && (W.solidT(W.tile(x, y + 1)) || W.isPlat(x, y + 1));
        if (ok && s < 0) s = x;
        if (!ok && s >= 0) { if (x - s >= 6) out.push({ x0: s, x1: x - 1, y, endVoid: W.tile(x, y + 1) === 9 || W.tile(x, y + 1) === 0, startVoid: W.tile(s - 1, y + 1) === 9 || W.tile(s - 1, y + 1) === 0 }); s = -1; }
      }
    }
    return out;
  }
  function ceilings(cam) {
    const out = [], x0 = Math.floor(cam.x / T) + 2, x1 = Math.floor((cam.x + cam.w) / T) - 2, y0 = Math.floor(cam.y / T), y1 = Math.floor((cam.y + cam.h) / T) - 3;
    for (let i = 0; i < 40; i++) { const x = x0 + ((R() * (x1 - x0)) | 0), y = y0 + ((R() * (y1 - y0)) | 0); if (W.tile(x, y) === 0 && W.solidT(W.tile(x, y - 1)) && W.tile(x, y + 3) === 0) out.push({ x, y }); }
    return out;
  }
  function liquids(cam) {
    const out = [], x0 = Math.floor(cam.x / T), x1 = Math.floor((cam.x + cam.w) / T), y0 = Math.floor(cam.y / T), y1 = Math.floor((cam.y + cam.h) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const v = W.tile(x, y); if ((v === 6 || v === 5) && W.tile(x, y - 1) === 0) out.push({ x, y, lava: v === 5 }); }
    return out;
  }

  /* ======================= SZENE STARTEN ======================= */
  let ev = null, wait = 6 + R() * 6, last = 0;
  function begin(cam) {
    const lv = Z.level; if (!lv) return null;
    const key = lv.hub ? "lager" : (Z.run && Z.run.area) || lv.biome;
    const list = SC[key] || SC.torhof;
    const spec = pick(list), kind = spec[0];
    const fl = floors(cam);
    const ps = Z.player;
    const farFromP = f => !ps || Math.abs(f.y * T - ps.y) > 20 || true;
    if (kind === "spider") { const cs = ceilings(cam); if (!cs.length) return null; const p = pick(cs); return { k: "spider", x: p.x * T + 8, y0: p.y * T, len: 30 + R() * 30, t: 0, dur: 7 }; }
    if (kind === "fly") { const y = cam.y + cam.h * (0.15 + R() * 0.45), dir = R() < 0.5 ? 1 : -1; return { k: "fly", spr: spec[1], x: dir > 0 ? cam.x - 20 : cam.x + cam.w + 20, y, dir, sp: 40 + R() * 40, t: 0, dur: 16, n: spec[1] === "vogel" || spec[1] === "fledermaus" ? 1 + ((R() * 3) | 0) : 1 }; }
    if (kind === "fish") { const lq = liquids(cam); if (!lq.length) return null; const p = pick(lq); return { k: "fish", x: p.x * T + 8, y: p.y * T + 2, t: 0, dur: 1.4, lava: p.lava }; }
    if (kind === "peek") {
      const wins = (lv.decor || []).filter(d => (d.kind === "window" || d.kind === "barrel" || d.kind === "crate") && d.x * T > cam.x && d.x * T < cam.x + cam.w && d.y * T > cam.y && d.y * T < cam.y + cam.h);
      if (!wins.length) return null; const d = pick(wins); return { k: "peek", spr: spec[1], x: d.x * T + 8, y: d.y * T + (d.kind === "window" ? 10 : 2), t: 0, dur: 5 };
    }
    if (!fl.length) return null;
    const f = pick(fl.filter(farFromP));
    const len = (f.x1 - f.x0 + 1) * T, y = (f.y + 1) * T;
    if (kind === "fall") { const toEnd = f.endVoid || !f.startVoid; if (!f.endVoid && !f.startVoid) return null; const dir = f.endVoid ? 1 : -1; const xs = dir > 0 ? f.x0 * T + 6 : (f.x1 + 1) * T - 6; return { k: "fall", spr: spec[1], txt: spec[2], x: xs, y, dir, edge: dir > 0 ? (f.x1 + 1) * T : f.x0 * T, sp: 26 + R() * 14, t: 0, dur: 14, st: "walk" }; }
    const dir = R() < 0.5 ? 1 : -1, xs = dir > 0 ? f.x0 * T + 4 : (f.x1 + 1) * T - 4, xe = dir > 0 ? (f.x1 + 1) * T - 4 : f.x0 * T + 4;
    const base = { spr: spec[1], x: xs, y, dir, xs, xe, t: 0 };
    switch (kind) {
      case "walk": return Object.assign(base, { k: "walk", sp: spec[1] === "schnecke" ? 5 : spec[1] === "geist" ? 16 : 24 + R() * 18, txt: spec[2], dur: Math.min(18, len / 12), stop: R() < 0.5 ? 0.3 + R() * 0.4 : -1 });
      case "chase": return Object.assign(base, { k: "chase", spr2: spec[2], txt: spec[3], sp: 70, dur: len / 60 + 1.5 });
      case "hop": return Object.assign(base, { k: "hop", dur: Math.min(14, len / 20) });
      case "sleep": return Object.assign(base, { k: "sleep", x: f.x0 * T + len * (0.2 + R() * 0.6), dur: 9 });
      case "dance": return Object.assign(base, { k: "dance", x: f.x0 * T + len * 0.5, dur: 8 });
      case "skull": return Object.assign(base, { k: "skull", sp: 18, dur: Math.min(14, len / 16), st: "walk" });
      case "carry": return Object.assign(base, { k: "carry", sp: 20, dur: Math.min(14, len / 14), st: "walk" });
    }
    return null;
  }
  function bubble(c, x, y, txt, a) { if (!txt) return; c.save(); c.globalAlpha = a; c.font = "700 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; const w = c.measureText(txt).width + 5; c.fillStyle = "rgba(240,230,215,.9)"; c.fillRect(x - w / 2, y - 7, w, 8); poly(c, [x - 1.5, y + 1, x + 1.5, y + 1, x, y + 3], "rgba(240,230,215,.9)"); c.fillStyle = "#2a1a1a"; c.fillText(txt, x, y - 1); c.restore(); }
  const tx = v => (Array.isArray(v) ? v[Z.settings.lang === "en" ? 1 : 0] : v);
  function fig(c, spr, x, y, dir, t, moving, o) { c.save(); c.translate(x, y); c.scale(dir * 0.82, 0.82); (S[spr] || S.maus)(c, t, moving ? 1 : 0, o); c.restore(); }

  /* ======================= Zeichnen + Fortschreiten ======================= */
  function stepDraw(c, dt, t) {
    const e = ev; e.t += dt; const k = e.t;
    c.save(); c.globalAlpha = 0.9; c.filter = "none";
    switch (e.k) {
      case "walk": {
        let mv = true;
        if (e.stop > 0 && Math.abs(e.x - (e.xs + (e.xe - e.xs) * e.stop)) < 2 && !e.stopped) { e.stopped = 1.6; }
        if (e.stopped > 0) { e.stopped -= dt; mv = false; bubble(c, e.x, e.y - 16, tx(e.txt || "?"), Math.min(1, e.stopped)); if (e.stopped <= 0) e.stopped = -1; }
        if (mv) e.x += e.dir * e.sp * dt;
        if ((e.dir > 0 && e.x > e.xe) || (e.dir < 0 && e.x < e.xe)) e.t = e.dur;
        fig(c, e.spr, e.x, e.y, e.dir, t, mv, null); break;
      }
      case "chase": {
        e.x += e.dir * e.sp * dt; const x2 = e.x - e.dir * (18 + Math.sin(t * 3) * 4);
        fig(c, e.spr, e.x, e.y, e.dir, t * 1.6, true); fig(c, e.spr2, x2, e.y, e.dir, t * 1.3, true);
        if (k < 1.4) bubble(c, e.x, e.y - 12, e.txt[0], 1);
        if (k > 0.8 && k < 2) bubble(c, x2, e.y - 16, e.txt[1], 1);
        if ((e.dir > 0 && x2 > e.xe) || (e.dir < 0 && x2 < e.xe)) e.t = e.dur; break;
      }
      case "fall": {
        if (e.st === "walk") { e.x += e.dir * e.sp * dt; if ((e.dir > 0 && e.x >= e.edge - 1) || (e.dir < 0 && e.x <= e.edge + 1)) { e.st = "wobble"; e.w = 0; } fig(c, e.spr, e.x, e.y, e.dir, t, true); }
        else if (e.st === "wobble") { e.w += dt; c.save(); c.translate(e.x, e.y); c.rotate(Math.sin(e.w * 22) * 0.35 * e.dir); c.translate(-e.x, -e.y); fig(c, e.spr, e.x, e.y, e.dir, t * 3, true); c.restore(); bubble(c, e.x, e.y - 18, "!?", 1); if (e.w > 0.7) { e.st = "drop"; e.vy = -60; e.fy = e.y; e.rot = 0; } }
        else { e.vy += 500 * dt; e.fy += e.vy * dt; e.x += e.dir * 20 * dt; e.rot += dt * 8 * e.dir; c.save(); c.translate(e.x, e.fy - 6); c.rotate(e.rot); c.translate(-e.x, -e.fy + 6); fig(c, e.spr, e.x, e.fy, e.dir, t * 4, true); c.restore(); bubble(c, e.x, e.fy - 22, tx(e.txt), Math.max(0, 1 - (e.fy - e.y) / 90)); if (e.fy - e.y > 120) e.t = e.dur; }
        break;
      }
      case "spider": { const p = k < 1.5 ? k / 1.5 : k > e.dur - 1.5 ? (e.dur - k) / 1.5 : 1, y = e.y0 + e.len * p + Math.sin(t * 2) * 1.5; c.strokeStyle = "rgba(230,228,240,.5)"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(e.x, e.y0); c.lineTo(e.x, y); c.stroke(); c.save(); c.translate(e.x, y); S.spinne(c, t, 1); c.restore(); if (k > 2.5 && k < 4) bubble(c, e.x, y - 6, "♥", 1); break; }
      case "fly": { e.x += e.dir * e.sp * dt; for (let i = 0; i < e.n; i++) { const yy = e.y + Math.sin(t * 2 + i * 2) * 8 + i * 6, xx = e.x - e.dir * i * 14; c.save(); c.translate(xx, yy); c.scale(e.dir * 0.85, 0.85); (S[e.spr] || S.vogel)(c, t + i, 1); c.restore(); } const cam = Z.cam; if (e.x < cam.x - 60 || e.x > cam.x + cam.w + 60) e.t = e.dur; break; }
      case "fish": { const p = k / e.dur, x = e.x + (p - 0.5) * 24, y = e.y - Math.sin(p * Math.PI) * 26; c.save(); c.translate(x, y); c.rotate(-Math.cos(p * Math.PI) * 1.2); if (e.lava) S.salamander(c, t, 0); else S.fisch(c, t); c.restore(); if (k < 0.1 || (k > e.dur - 0.12)) Z.fx.burst(x, e.y, 3, { col: e.lava ? ["#ffb040", "#ff6a1a"] : ["#c0e0d0", "#e8f4f0"], sp: 40, ang: -Math.PI / 2, spread: 1.4, life: 0.4, size: 1.2, g: 300 }); break; }
      case "hop": { const ph = (k * 1.6) % 1; e.x += e.dir * (ph < 0.5 ? 34 : 0) * dt; const y = e.y - (ph < 0.5 ? Math.sin(ph * 2 * Math.PI) * 9 : 0); fig(c, "frosch", e.x, y, e.dir, t, false); if ((e.dir > 0 && e.x > e.xe) || (e.dir < 0 && e.x < e.xe)) e.t = e.dur; break; }
      case "sleep": { fig(c, e.spr, e.x, e.y, e.dir, 0, false); const z = (k * 0.8) % 1; c.save(); c.globalAlpha = 1 - z; c.font = "700 " + (5 + z * 4) + "px serif"; c.fillStyle = "#e8e0d0"; c.fillText("z", e.x + 4 + z * 6, e.y - 12 - z * 10); c.restore(); break; }
      case "dance": { for (let i = 0; i < 3; i++) { const x = e.x + (i - 1) * 12, y = e.y - Math.abs(Math.sin(t * 5 + i)) * 4; fig(c, e.spr, x, y, i % 2 ? -1 : 1, t * 2 + i, true); } if (Math.random() < 0.3) Z.fx.p({ x: e.x + (R() - 0.5) * 30, y: e.y - 8, vx: (R() - 0.5) * 10, vy: -16, life: 1, size: 1.4, col: e.spr === "salamander" ? "#ffb040" : "#d890ff", kind: "glow", add: true }); if (k > 1 && k < 3) bubble(c, e.x, e.y - 18, "♪ ♫", 1); break; }
      case "skull": {
        if (e.st === "walk") { e.x += e.dir * e.sp * dt; fig(c, "skelett", e.x, e.y, e.dir, t, true); if (k > 2.2) { e.st = "roll"; e.hx = e.x; e.hy = e.y - 10; e.hvy = -40; e.rot = 0; Z.audio.play("hitBone", { vol: 0.15 }); } }
        else { e.hvy += 400 * dt; e.hy = Math.min(e.y, e.hy + e.hvy * dt); if (e.hy >= e.y) e.hvy = 0; e.hx += e.dir * 34 * dt; e.rot += dt * 10 * e.dir; e.x += e.dir * 30 * dt; fig(c, "skelett", e.x, e.y, e.dir, t * 1.8, true, { headless: true }); c.save(); c.translate(e.hx, e.hy); c.rotate(e.rot); S.kopf(c); c.restore(); bubble(c, e.x, e.y - 14, Z.settings.lang === "en" ? "Wait up!" : "Warte!", k < 4.5 ? 1 : 0); if ((e.dir > 0 && e.x > e.xe) || (e.dir < 0 && e.x < e.xe)) e.t = e.dur; }
        break;
      }
      case "carry": {
        if (e.st === "walk") { e.x += e.dir * e.sp * dt; const wob = Math.sin(t * 6) * 0.08 * Math.min(1, k / 2); fig(c, e.spr, e.x, e.y, e.dir, t, true); c.save(); c.translate(e.x, e.y - 11); c.rotate(wob * 3); for (let i = 0; i < 4; i++) { c.save(); c.translate(Math.sin(t * 3 + i) * i * 0.5, -i * 5); S.kiste(c); c.restore(); } c.restore(); if (k > 3) { e.st = "drop"; e.cr = [0, 1, 2, 3].map(i => ({ x: e.x, y: e.y - 11 - i * 5, vx: (R() - 0.3) * 50 * e.dir, vy: -40 - R() * 40, r: 0 })); Z.audio.play("rock", { vol: 0.12 }); } }
        else { fig(c, e.spr, e.x, e.y, e.dir, 0, false); for (const b of e.cr) { b.vy += 500 * dt; b.y = Math.min(e.y, b.y + b.vy * dt); if (b.y >= e.y) { b.vx *= 0.8; b.vy = 0; } b.x += b.vx * dt; b.r += b.vx * dt * 0.1; c.save(); c.translate(b.x, b.y); c.rotate(b.r); S.kiste(c); c.restore(); } bubble(c, e.x, e.y - 18, Z.settings.lang === "en" ? "Oh no…" : "Ach nö …", k < 6 ? 1 : 0); }
        break;
      }
      case "peek": { const p = k < 0.6 ? k / 0.6 : k > e.dur - 0.6 ? (e.dur - k) / 0.6 : 1; c.save(); c.beginPath(); c.rect(e.x - 10, e.y - 14, 20, 14); c.clip(); fig(c, e.spr, e.x, e.y + 10 * (1 - p) + 2, 1, t, false); c.restore(); if (k > 1.5 && k < 3) bubble(c, e.x, e.y - 14, "?", 1); break; }
    }
    c.restore();
    if (e.t >= e.dur) ev = null;
  }
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    if (mid0) mid0(c, cam, t);
    const dt = Math.min(0.05, Math.max(0, t - last)); last = t;
    if (!Z.level || Z.paused || (Z.gq && Z.gq.level === 0)) return;
    if (Z.boss && !Z.bossDefeated) { ev = null; return; }
    if (!ev) { wait -= dt; if (wait <= 0) { ev = begin(cam); wait = ev ? 9 + R() * 12 : 2; } return; }
    try { stepDraw(c, dt, t); } catch (err) { ev = null; }
  };
  Z.bgEvent = () => ev; Z.bgForce = () => { wait = 0; ev = null; };
})();
