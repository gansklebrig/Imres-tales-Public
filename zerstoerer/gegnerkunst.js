/* Ezekiel – The Destroyer · Gegnerkunst
   Jede Gegnerart bekommt eine eigene Spezialtechnik mit Namen, der beim Ausholen über dem Kopf erscheint –
   so lernt man die Muster lesen: Messerwurf, Rundumschlag, Feuerkreis, Knochenhagel, Schattenschritt,
   Netzfalle, Runenstrahl, Lavasprung …
   Dazu neue Elite-Arten mit eigener Aura: giftig, eisig, explosiv – und sichtbare Auren für alle Eliten. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, L = v => Z.L(v), U = Z.U;
  const TAU = Math.PI * 2;
  const N = (de, en) => [de, en];
  /* Baukasten */
  const throwK = (proj, name, o) => Object.assign({ k: "shoot", proj, r: [50, 190], pre: 0.5, act: 0.1, post: 0.35, cd: 2.4, w: 0.7, sfx: "swing", name }, o || {});
  const spin = (h, w, name, o) => Object.assign({ k: "combo", n: 3, gap: 0.2, r: [0, 34], pre: 0.55, act: 0.08, post: 0.55, cd: 3, box: [-w - 14, -h, w * 2 + 28, h], armor: true, glyph: "!!", sfx: "swingHeavy", name, w: 0.6 }, o || {});
  const fireRing = (name, o) => Object.assign({ k: "mark", hz: "column", n: 3, hw: 16, warn: 0.75, life: 1.1, r: [40, 220], pre: 0.6, act: 0.2, post: 0.5, cd: 4.5, sfx: "fire", name, w: 0.6 }, o || {});
  const step = (name, o) => Object.assign({ k: "teleport", behind: true, r: [40, 200], pre: 0.4, act: 0.1, post: 0.25, cd: 5, sfx: "shadow", name, w: 0.5 }, o || {});
  const SIG = {
    goblin: [throwK("e_nadel", N("Messerwurf", "Knife Toss"), { n: 2, gap: 0.14 })],
    goblinBogen: [throwK("e_pfeil", N("Feuerpfeil", "Fire Arrow"), { eff: { burn: 2 }, pre: 0.7, r: [60, 240], cd: 3 }), { k: "volley", proj: "e_pfeil", n: 5, r: [80, 240], pre: 0.85, act: 0.1, post: 0.5, cd: 5, sfx: "bow", name: N("Pfeilregen", "Arrow Rain"), w: 0.5 }],
    goblinSchlaeger: [spin(18, 12, N("Rundumschlag", "Whirl Smash"))],
    goblinBombe: [{ k: "lob", proj: "e_bombe", n: 3, r: [60, 200], pre: 0.7, act: 0.1, post: 0.6, cd: 5, sfx: "swing", name: N("Bombenhagel", "Bomb Barrage"), w: 0.5 }],
    wolf: [{ k: "shield", r: [0, 260], pre: 0.6, act: 0.1, post: 0.3, cd: 9, once: true, sfx: "bark", name: N("Rudelheulen", "Pack Howl"), w: 0.6 }],
    wolfsreiter: [{ k: "charge", r: [60, 220], pre: 0.6, act: 0.9, post: 0.5, cd: 4, box: [0, -22, 26, 22], spd: 330, armor: true, glyph: "!!", sfx: "roar", hitSfx: "hitHeavy", kb: 300, name: N("Sturmritt", "Charging Ride"), w: 0.6 }],
    robe: [fireRing(N("Feuerkreis", "Ring of Fire"))],
    robeArmbrust: [throwK("e_bolzen", N("Bolzensalve", "Bolt Salvo"), { n: 3, gap: 0.12, r: [60, 240], pre: 0.7, cd: 3.5 })],
    robeTrunk: [{ k: "lob", proj: "e_phiole", n: 2, r: [50, 180], pre: 0.6, act: 0.1, post: 0.5, cd: 4, sfx: "glass", name: N("Trankwurf", "Potion Toss"), w: 0.6 }],
    robeSchlaeger: [spin(20, 12, N("Kreuzhieb", "Cross Cleave"), { n: 2, gap: 0.3 })],
    adept: [{ k: "volley", proj: "e_glut", n: 6, r: [60, 220], pre: 0.85, act: 0.1, post: 0.5, cd: 5, sfx: "fire", name: N("Glutregen", "Ember Rain"), w: 0.6 }],
    kerkerwache: [{ k: "pull", r: [40, 160], pre: 0.6, act: 0.45, post: 0.4, cd: 5, sfx: "chain", name: N("Kettenzug", "Chain Pull"), w: 0.5 }],
    folterknecht: [{ k: "slam", r: [0, 50], pre: 0.85, act: 0.12, post: 0.7, cd: 4, box: [-10, -30, 60, 32], armor: true, wave: true, glyph: "!!", sfx: "swingHeavy", hitSfx: "hitHeavy", name: N("Hammerschlag", "Hammer Blow"), w: 0.6 }],
    skelett: [{ k: "lob", proj: "e_kugel", n: 3, r: [50, 190], pre: 0.6, act: 0.1, post: 0.45, cd: 3.5, sfx: "hitBone", name: N("Knochenhagel", "Bone Hail"), w: 0.6 }],
    skelBogen: [throwK("e_pfeil", N("Dreifachschuss", "Triple Shot"), { n: 3, spread: 0.25, r: [60, 240], pre: 0.75, cd: 3.2 })],
    zombie: [{ k: "spray", len: 54, col: "#7a9a3a", eff: { poison: 1 }, r: [0, 50], pre: 0.7, act: 0.8, post: 0.5, cd: 4, sfx: "slime", name: N("Würgen", "Retch"), w: 0.6 }],
    ruestung: [{ k: "charge", r: [70, 220], pre: 0.7, act: 0.9, post: 0.6, cd: 4.5, box: [0, -26, 22, 26], spd: 310, armor: true, glyph: "!!", sfx: "hitMetal", hitSfx: "hitHeavy", kb: 330, name: N("Ansturm", "Onslaught"), w: 0.6 }],
    drowWache: [step(N("Schattenschritt", "Shadow Step"))],
    drowSchuetze: [throwK("e_bolzen", N("Giftbolzen", "Venom Bolt"), { eff: { poison: 1 }, r: [60, 240], pre: 0.6 })],
    soeldner: [spin(20, 10, N("Klingensturm", "Blade Storm"), { n: 4, gap: 0.17, armor: false })],
    harpyie: [{ k: "volley", proj: "e_feder", n: 5, r: [40, 220], pre: 0.7, act: 0.1, post: 0.45, cd: 4, sfx: "swing", name: N("Federsturm", "Feather Storm"), w: 0.7 }],
    mane: [spin(16, 10, N("Krallenwirbel", "Claw Whirl"), { n: 3, gap: 0.16, armor: false })],
    kuotoa: [throwK("e_pfeil", N("Speerwurf", "Spear Throw"), { r: [60, 220], pre: 0.6 })],
    kuotoaSpeer: [{ k: "lunge", r: [0, 60], pre: 0.55, act: 0.2, post: 0.45, cd: 3, lunge: 340, box: [0, -18, 36, 12], kb: 260, sfx: "stab", name: N("Fischstoß", "Fish Thrust"), w: 0.6 }],
    ertrunkener: [{ k: "grab", r: [0, 22], pre: 0.6, act: 0.15, post: 0.6, cd: 4, box: [0, -22, 20, 20], unblockable: true, glyph: "!!", sfx: "splash", name: N("Würgegriff", "Drowning Grip"), w: 0.4 }],
    krabbe: [{ k: "grab", r: [0, 22], pre: 0.55, act: 0.15, post: 0.6, cd: 4, box: [0, -16, 22, 16], unblockable: true, glyph: "!!", sfx: "claw", name: N("Scherenzange", "Pincer Grip"), w: 0.4 }],
    riesenspinne: [{ k: "web", proj: "e_netz", r: [40, 200], pre: 0.55, act: 0.1, post: 0.4, cd: 4, sfx: "web", name: N("Netzfalle", "Web Snare"), w: 0.6 }, { k: "leap", r: [50, 160], pre: 0.5, act: 0.7, post: 0.45, cd: 3.5, box: [-2, -16, 30, 16], jump: [300, -330], sfx: "insect", name: N("Lauersprung", "Pounce"), w: 0.5 }],
    netzspinne: [{ k: "volley", proj: "e_netz", n: 3, r: [50, 200], pre: 0.7, act: 0.1, post: 0.5, cd: 5, sfx: "web", name: N("Netzregen", "Web Rain"), w: 0.5 }],
    ettercap: [{ k: "lob", proj: "e_gift", n: 3, r: [40, 180], pre: 0.6, act: 0.1, post: 0.5, cd: 4, sfx: "slime", name: N("Giftspucke", "Venom Spit"), w: 0.6 }],
    schatten: [step(N("Schattenschritt", "Shadow Step"), { cd: 4 }), spin(18, 10, N("Seelenschnitt", "Soul Cut"), { n: 2, gap: 0.22, armor: false })],
    runenwaechter: [{ k: "beam", r: [40, 260], pre: 0.95, act: 0.6, post: 0.6, cd: 5, col: "#ffb040", glyph: "!!", sfx: "zap", name: N("Runenstrahl", "Rune Beam"), w: 0.5 }],
    duergar: [{ k: "invis", r: [40, 220], pre: 0.3, act: 0.1, post: 0.2, cd: 7, sfx: "shadow", name: N("Verblassen", "Fade"), w: 0.4 }],
    duergarArmbrust: [throwK("e_bolzen", N("Bolzensalve", "Bolt Salvo"), { n: 3, gap: 0.12, r: [60, 240], pre: 0.7, cd: 3.5 })],
    schmiedegeist: [{ k: "spray", len: 70, col: "#ff8a3a", eff: { burn: 2 }, r: [0, 60], pre: 0.7, act: 0.7, post: 0.5, cd: 4, sfx: "fire", name: N("Glutstoß", "Ember Blast"), w: 0.6 }],
    zweigBlight: [{ k: "mark", hz: "zone", n: 2, hw: 22, warn: 0.7, life: 0.5, r: [30, 200], pre: 0.6, act: 0.2, post: 0.5, cd: 4.5, sfx: "roots", name: N("Dornenwurzeln", "Thorn Roots"), w: 0.6 }],
    nadelBlight: [throwK("e_nadel", N("Nadelsalve", "Needle Volley"), { n: 4, gap: 0.08, r: [50, 220] })],
    rankenBlight: [{ k: "pull", r: [40, 180], pre: 0.6, act: 0.45, post: 0.4, cd: 5, sfx: "roots", name: N("Rankenzug", "Vine Pull"), w: 0.5 }],
    feuerschlucker: [{ k: "spray", len: 80, col: "#ff6a1a", eff: { burn: 2 }, r: [0, 70], pre: 0.6, act: 0.8, post: 0.5, cd: 4, sfx: "fireBig", name: N("Feuerspeien", "Fire Breath"), w: 0.7 }],
    magmaHund: [{ k: "leap", r: [60, 170], pre: 0.5, act: 0.7, post: 0.5, cd: 3.5, box: [-2, -16, 30, 16], jump: [280, -320], landFire: true, sfx: "fire", name: N("Lavasprung", "Lava Leap"), w: 0.6 }],
    bewahrer: [{ k: "beam", r: [40, 240], pre: 0.9, act: 0.5, post: 0.6, cd: 5, col: "#c8ff8a", glyph: "!!", sfx: "zap", name: N("Bannstrahl", "Binding Beam"), w: 0.5 }]
  };
  for (const id in SIG) {
    const d = Z.ENEMIES[id]; if (!d || d.sigDone) continue; d.sigDone = true; d.atks = d.atks || [];
    for (const a of SIG[id]) {
      if (a.box && d.h && a.k !== "grab") { const sz = (d.h || 18) / 18; a.box = a.box.map((v, i) => i === 1 || i === 3 ? v * Math.max(0.8, sz) : v); }
      a.w = Math.max(a.w || 1, 1.1);
      d.atks.push(a);
    }
  }

  /* ---------- Neue Eliten ---------- */
  Z.ELITE.giftig = ["Giftig", "Venomous"];
  Z.ELITE.eisig = ["Eisig", "Frostbound"];
  Z.ELITE.explosiv = ["Explosiv", "Volatile"];
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player, before = P ? P.hp : 0;
    const r = hurt0.apply(this, arguments);
    const at = o && o.attacker;
    if (P && at && P.hp < before) {
      if (at.elite === "giftig") Z.addStatus(P, "poison", 2, true);
      if (at.elite === "eisig") { Z.addStatus(P, "slow", 1.6, true); FX.burst(P.x + P.w / 2, P.y + P.h / 2, 10, { col: ["#e8f4f0", "#c8e0d8"], sp: 80, life: 0.5, size: 2, kind: "shard", g: 300 }); }
    }
    return r;
  };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && e.dead;
    const r = kill0.apply(this, arguments);
    if (e && !was && e.dead && e.elite === "explosiv") {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      FX.text(cx, e.y - 12, L(["Gleich knallt's!", "About to blow!"]), "#ff8a3a", true); A.play("fire", { vol: 0.5, x: cx });
      /* Zünder läuft in Spielzeit (Pause, Gebietswechsel und Tod halten ihn an bzw. löschen ihn) */
      bombs.push({ x: cx, y: cy, t: 0, dmg: e.dmgMul * 1.6 });
    }
    return r;
  };
  let bombs = [];
  /* giftige Eliten hinterlassen Pfützen */
  const tick0 = Z.ebenenTick;
  /* Eliten-Liste: neu nur bei neuem Bild oder geänderter Gegnerzahl (statt 50–90 Gegner je Teilschritt durchzusehen) */
  let elit = [], eKey = "";
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    const key = Z.bildNr + ":" + Z.enemies.length;
    if (key !== eKey || !(Z.gq && Z.gq.lean) || Z.bildTaktCull === false) { eKey = key; elit = Z.enemies.filter(e => e.elite); }
    for (const e of elit) {
      if (e.dead || !e.elite) continue;
      if (e.elite === "giftig" && e.onGround && Math.abs(e.vx) > 30) { e.trailT = (e.trailT || 0) - dt; if (e.trailT <= 0) { e.trailT = 0.7; Z.spawnHazard({ kind: "poisonpool", x: e.x + e.w / 2, y: e.y + e.h, w: 18, life: 3, dmg: e.dmgMul * 0.08, owner: "e", eff: { poison: 1 } }); } }
    }
    for (let i = bombs.length - 1; i >= 0; i--) { const b = bombs[i]; b.t += dt; if (b.t >= 0.9) { bombs.splice(i, 1); if (Z.level) Z.explode(b.x, b.y, 52, b.dmg, "e"); } }
  };

  /* ---------- Zeichnen: Namen der Techniken, Elite-Auren ---------- */
  /* W41 Leistung: „?“-Blase und Technik-Namen als fertige Bildchen (Schrift zeichnen ist auf schwachen Geräten teuer; bei
     vollen Kämpfen standen hier je Bild Dutzende fillText/measureText). Auflösung = aktueller Bildmaßstab (scharf wie vorher);
     solange die Schrift noch lädt, wird wie bisher direkt gezeichnet (sonst bliebe die Ersatzschrift im Bildchen). */
  const fontsOk = () => !document.fonts || document.fonts.status === "loaded";
  const W41 = { q: {}, lab: new Map() };
  function qSpr(ps) {
    let cv = W41.q[ps]; if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = Math.ceil(10 * ps); cv.height = Math.ceil(11 * ps);
    const g = cv.getContext("2d"); g.setTransform(ps, 0, 0, ps, 5 * ps, 10 * ps);
    g.fillStyle = "rgba(20,14,12,.8)"; g.beginPath(); g.ellipse(0, -4, 4.2, 4.6, 0, 0, TAU); g.fill();
    g.fillStyle = "#f4ead8"; g.beginPath(); g.ellipse(0, -4, 3.4, 3.8, 0, 0, TAU); g.fill();
    g.fillStyle = "#b8742a"; g.font = "700 6px 'Alegreya Sans',sans-serif"; g.textAlign = "center"; g.fillText("?", 0, -1.8);
    return (W41.q[ps] = cv);
  }
  function labSpr(c, s, col, ps) {
    const key = ps + "|" + col + "|" + s; let o = W41.lab.get(key); if (o) return o;
    if (W41.lab.size > 160) W41.lab.clear();
    c.font = "italic 700 7px 'Alegreya Sans',sans-serif"; const w = c.measureText(s).width + 8;
    const cv = document.createElement("canvas"); cv.width = Math.ceil(w * ps); cv.height = Math.ceil(9 * ps);
    const g = cv.getContext("2d"); g.setTransform(ps, 0, 0, ps, (w / 2) * ps, 7 * ps);
    g.fillStyle = "rgba(20,8,10,.75)"; g.fillRect(-w / 2, -7, w, 9);
    g.font = "italic 700 7px 'Alegreya Sans',sans-serif"; g.textAlign = "center"; g.fillStyle = col; g.fillText(s, 0, 0);
    o = { cv, w }; W41.lab.set(key, o); return o;
  }
  let w41ps = 0;
  function qBubble(c, x, y, age, left) {
    const pop = age < 0.18 ? 0.4 + 0.6 * (age / 0.18) : 1, a = Math.min(1, left / 0.5);
    if (w41ps > 0) { /* W41 Leistung */
      const a0 = c.globalAlpha, yy = y - (age < 0.18 ? (1 - age / 0.18) * 3 : 0) + Math.sin(age * 5) * 0.4;
      c.globalAlpha = a; c.drawImage(qSpr(w41ps), x - 5 * pop, yy - 10 * pop, 10 * pop, 11 * pop); c.globalAlpha = a0; return;
    }
    c.save(); c.globalAlpha = a; c.translate(x, y - (age < 0.18 ? (1 - age / 0.18) * 3 : 0) + Math.sin(age * 5) * 0.4); c.scale(pop, pop);
    c.fillStyle = "rgba(20,14,12,.8)"; c.beginPath(); c.ellipse(0, -4, 4.2, 4.6, 0, 0, TAU); c.fill();
    c.fillStyle = "#f4ead8"; c.beginPath(); c.ellipse(0, -4, 3.4, 3.8, 0, 0, TAU); c.fill();
    c.fillStyle = "#b8742a"; c.font = "700 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillText("?", 0, -1.8);
    c.restore();
  }
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp0) dp0.apply(this, arguments);
    const t = Z.gfx.time || 0, cam = Z.cam;
    c.save();
    { const m = c.getTransform(); w41ps = !Z.w41aus && fontsOk() && !m.b && !m.c && m.a > 0 ? Math.min(8, Math.ceil(m.a * 2) / 2) : 0; } /* W41 Leistung */
    for (const e of Z.enemies) {
      if (e.dead || e.x < cam.x - 60 || e.x > cam.x + cam.w + 60 || e.y < cam.y - 60 || e.y > cam.y + cam.h + 60) continue;
      const cx = e.x + e.w / 2, fy = e.y + e.h, cy = e.y + e.h / 2;
      const ac = e.act;
      if (ac && ac.a && ac.a.name && ac.phase !== "post" && !(e.hidden > 0)) {
        const u = ac.phase === "pre" ? Math.min(1, ac.t / 0.15) : 1;
        c.globalAlpha = u;
        if (w41ps > 0) { const lb = labSpr(c, L(ac.a.name), ac.a.unblockable ? "#ff6a8a" : "#ffcf8a", w41ps), y = e.y - (e.elite ? 22 : 14); c.drawImage(lb.cv, cx - lb.w / 2, y - 7, lb.w, 9); c.globalAlpha = 1; } else { /* W41 Leistung: Bildchen statt Schrift */
        c.font = "italic 700 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
        const s = L(ac.a.name), w = c.measureText(s).width + 8, y = e.y - (e.elite ? 22 : 14);
        c.fillStyle = "rgba(20,8,10,.75)"; c.fillRect(cx - w / 2, y - 7, w, 9);
        c.fillStyle = ac.a.unblockable ? "#ff6a8a" : "#ffcf8a"; c.fillText(s, cx, y);
        c.globalAlpha = 1; }
      }
      /* W8: misstrauisch – kleines „?“ über dem Kopf (hat etwas gehört/gesehen, sucht) */
      if (e.sus > 0 && !e.aware && !e.sleep && !e.disguise && !(e.hidden > 0)) qBubble(c, cx + (e.face || 1) * e.w * 0.3, e.y - 3, e.qPop || 0, e.sus);
      /* W10: Kriegstakt (Trommler) – kleine Glutnoten steigen auf; Laternenlicht */
      if (e.rageT > 0 && !e.disguise) { const ph = (t * 1.4 + e.anim * 0.3) % 1; c.globalAlpha = Math.min(1, e.rageT) * (1 - ph) * 0.8; c.drawImage(noteSpr(), cx + Math.sin(ph * 6 + e.anim) * e.w * 0.5 - 3, e.y - 9 - ph * 12, 6, 8); c.globalAlpha = 1; } /* Handheld: Note als fertiges Bildchen statt Schrift je Gegner und Bild */
      if (e.def.lantern && !(e.hidden > 0)) lanternPool(c, e, t);
      if (!e.elite || e.disguise) continue;
      c.save(); c.globalCompositeOperation = "lighter";
      switch (e.elite) {
        case "schnell": for (let k = 0; k < 3; k++) { c.globalAlpha = 0.25; c.strokeStyle = "#e8f0e0"; c.lineWidth = 0.8; const yy = e.y + e.h * (0.25 + k * 0.25) + Math.sin(t * 9 + k) * 1.5, len = 8 + Math.abs(e.vx) * 0.06; c.beginPath(); c.moveTo(cx - Math.sign(e.vx || e.face) * (e.w * 0.6), yy); c.lineTo(cx - Math.sign(e.vx || e.face) * (e.w * 0.6 + len), yy); c.stroke(); } break;
        case "beschwoerer": { c.globalAlpha = 0.55; c.strokeStyle = "#c070ff"; c.lineWidth = 1; c.save(); c.translate(cx, fy); c.scale(1, 0.3); c.rotate(t); c.beginPath(); c.arc(0, 0, e.w + 6, 0, TAU); c.stroke(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * (e.w + 6), Math.sin(a) * (e.w + 6)); c.lineTo(Math.cos(a + TAU * 2 / 5) * (e.w + 6), Math.sin(a + TAU * 2 / 5) * (e.w + 6)); c.stroke(); } c.restore(); break; }
        case "gepanzert": { c.globalAlpha = 0.3 + 0.15 * Math.sin(t * 3); c.strokeStyle = "#e8d8b0"; c.lineWidth = 0.8; const r = Math.max(e.w, e.h) * 0.7; c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * TAU + t * 0.4; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 1.1; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); break; }
        case "wuetend": { for (let k = 0; k < 4; k++) { const ph = (t * 1.6 + k / 4) % 1; c.globalAlpha = (1 - ph) * 0.5; c.fillStyle = "#ff4a2a"; c.beginPath(); c.ellipse(cx + Math.sin(k * 3 + t * 4) * e.w * 0.4, fy - ph * e.h * 1.2, 2.5 * (1 - ph) + 0.5, 4 * (1 - ph) + 1, 0, 0, TAU); c.fill(); } break; }
        case "teleport": if (Math.random() < 0.3) FX.p({ x: cx + (Math.random() - 0.5) * e.w, y: fy - Math.random() * e.h, vx: 0, vy: -15, life: 0.6, size: 3, col: "#2a1830", kind: "smoke" }); break;
        case "giftig": { c.globalAlpha = 0.35; const g = c.createRadialGradient(cx, cy, 0, cx, cy, e.h); g.addColorStop(0, "rgba(140,220,60,.5)"); g.addColorStop(1, "rgba(80,160,30,0)"); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, e.h, 0, TAU); c.fill(); if (Math.random() < 0.15) FX.p({ x: cx + (Math.random() - 0.5) * e.w, y: e.y, vx: 0, vy: -20, life: 0.8, size: 2, col: "#9ad04a", kind: "bubble" }); break; }
        case "eisig": { c.globalAlpha = 0.5; c.fillStyle = "#e8f6f0"; for (let k = 0; k < 6; k++) { const a = t * 1.2 + k / 6 * TAU, r = e.w * 0.9; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.5; c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-0.5, -2.5, 1, 5); c.fillRect(-2.5, -0.5, 5, 1); c.restore(); } break; }
        case "explosiv": { const p = 0.5 + 0.5 * Math.sin(t * (6 + (1 - e.hp / e.hpMax) * 10)); c.globalAlpha = 0.25 + p * 0.3; const g = c.createRadialGradient(cx, cy, 0, cx, cy, e.h * 0.9); g.addColorStop(0, "rgba(255,170,60,.7)"); g.addColorStop(1, "rgba(255,80,20,0)"); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, e.h * 0.9, 0, TAU); c.fill(); break; }
      }
      c.restore();
    }
    /* W10: Fadennetze der Drider */
    if (Z.webStrips) for (const st of Z.webStrips) {
      const a = Math.min(1, st.t / 0.15) * Math.min(1, (st.life - st.t) / 0.6), x0 = st.x - st.w / 2;
      c.globalAlpha = 0.75 * a; c.strokeStyle = "#eee8f0"; c.lineWidth = 0.6; c.beginPath();
      for (let i = 0; i < 7; i++) { const y = st.y - 1 - (i % 3) * 3; c.moveTo(x0 + i * 2, y); c.quadraticCurveTo(st.x + Math.sin(st.seed + i) * 8, y - 3 - (i % 2) * 2, x0 + st.w - i * 2, y + (i % 2 ? -1 : 0)); }
      for (let i = 0; i <= 6; i++) { const x = x0 + i * st.w / 6; c.moveTo(x, st.y); c.lineTo(x + Math.sin(st.seed * 3 + i) * 3, st.y - 8); }
      c.stroke(); c.globalAlpha = 1;
    }
    /* W10: Rost an Ezekiels Waffe */
    { const P = Z.player; if (P && P.rustT > 0 && !P.dead) { c.globalAlpha = Math.min(1, P.rustT) * 0.85; c.fillStyle = "#c86a2a"; c.font = "700 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillText(L(["Rost", "Rust"]), P.x + P.w / 2, P.y - 6); c.globalAlpha = 1; } }
    /* Zündende Explosiv-Leichen */
    for (const b of bombs) { const u = Math.min(1, b.t / 0.9); c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(255,120,40," + (0.4 + 0.6 * Math.abs(Math.sin(u * 20))) + ")"; c.lineWidth = 1.5; c.beginPath(); c.arc(b.x, b.y, 52 * u, 0, TAU); c.stroke(); c.fillStyle = "rgba(255,140,60," + 0.15 * u + ")"; c.beginPath(); c.arc(b.x, b.y, 52, 0, TAU); c.fill(); c.restore(); }
    c.restore();
  };
  const load0 = Z.loadArea;
  Z.loadArea = function () { bombs = []; if (Z.webStrips) Z.webStrips.length = 0; if (Z.player) Z.player.rustT = 0; return load0.apply(this, arguments); };
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "gegnerkunst", load: () => { bombs = []; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */
  let noteCv = null;
  function noteSpr() {
    if (noteCv) return noteCv;
    noteCv = document.createElement("canvas"); noteCv.width = 24; noteCv.height = 32; const g = noteCv.getContext("2d");
    g.fillStyle = "#ffb060"; g.beginPath(); g.ellipse(8, 25, 6, 4.5, -0.4, 0, Math.PI * 2); g.fill(); g.fillRect(12, 4, 3, 21); g.beginPath(); g.moveTo(12, 4); g.quadraticCurveTo(22, 8, 20, 16); g.quadraticCurveTo(19, 10, 14, 10); g.fill();
    return noteCv;
  }
  /* Lichtkreis einer Laterne (Handheld: ein vorgefertigter Lichtfleck statt Verlauf je Bild) */
  let poolSpr = null;
  function lanternPool(c, e, t) {
    if (!poolSpr) { poolSpr = document.createElement("canvas"); poolSpr.width = poolSpr.height = 64; const g = poolSpr.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,205,120,.32)"); gr.addColorStop(0.6, "rgba(255,180,90,.12)"); gr.addColorStop(1, "rgba(255,170,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const r = (e.flareT > 0 ? 110 : 60) * (0.96 + 0.04 * Math.sin(t * 9 + e.anim)), x = e.x + e.w / 2 + e.face * 8, y = e.y + e.h * 0.35;
    if (Z.addLight) Z.addLight(x, y, r * 1.4, "#ffd8a0", e.flareT > 0 ? 0.6 : 0.42); /* echtes Licht gegen die Dunkelheit */
    if (Z.addLight && Z.gq && Z.gq.lean) return; /* Stufe 0: das Licht reicht, kein zusätzlicher Lichtfleck */
    c.save(); c.globalCompositeOperation = "lighter"; c.drawImage(poolSpr, x - r, y - r, r * 2, r * 2); c.restore();
  }
})();
