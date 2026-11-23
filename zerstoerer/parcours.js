/* Ezekiel – The Destroyer · Parcours: Abgründe, bröckelnde Stege, Fähren und Fallen
   Kacheln: 9 Abgrund (tödliche Tiefe), 10 bröckelnder Steg, 11 Fährstrecke (unsichtbar).
   Fallen aus den Raumvorlagen (lv.traps): p Pendel, f Flammendüse, k Stachelfalle, r Steinschlag, j Sprungfeder, z Säge, < > Pfeilfalle, m Fähre. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const { limb, circ, poly, ell, glow } = Z.draw;
  let traps = [], movers = [], crumbles = [], voidTops = [], voidRuns = [];
  /* Gebietsfarben der Grundfallen: Stachel im Keller rostig, in der Schmiede glühend, im Schlund aus Chitin … */
  const SKIN0 = { spike: "iron", m0: "#5a5256", m1: "#8a8286", m2: "#d8d0d4", wood: "#5a4030", fl: ["#ff6a1a", "#ffd27a", "#fff6dc"], burn: "burn", blade: ["#b8b0b4", "#f0ece8"], hot: 0 };
  const SKINS = {
    torhof: { spike: "wood", m0: "#4a3a2c", m1: "#7a5a3c", m2: "#c8a678", name: { k: ["Spitze Pfähle", "Sharpened stakes"] } },
    keller: { spike: "rust", m0: "#4a2c1e", m1: "#8a4a2a", m2: "#c8865a", blade: ["#8a6a5a", "#c8a890"], name: { k: ["Rostige Fußangeln", "Rusty caltrops"], r: ["Tropfstein", "Dripstone"], p: ["Fleischerbeil", "Butcher's cleaver"] } },
    hallen: { spike: "gold", m0: "#5a4426", m1: "#a8823a", m2: "#ffe0a0", blade: ["#c8b080", "#fff0c8"], name: { k: ["Vergoldete Dornen", "Gilded thorns"], p: ["Prunkaxt", "Ceremonial axe"] } },
    wehrgang: { spike: "iron", name: { k: ["Krähenfüße", "Caltrops"], p: ["Sturmsense", "Storm scythe"] } },
    verlies: { spike: "blood", m0: "#3a3430", m1: "#6a625a", m2: "#c8beb0", fl: ["#e04a10", "#ffa040", "#ffe8c0"], name: { k: ["Blutdornen", "Blood spikes"], f: ["Feuerrost", "Fire grate"], r: ["Kerkerstein", "Dungeon stone"] } },
    hafen: { spike: "stake", m0: "#3a3024", m1: "#6a5438", m2: "#b89a70", name: { k: ["Muschelpfähle", "Barnacle stakes"], z: ["Sägewerksblatt", "Sawmill blade"] } },
    glocken: { spike: "brass", m0: "#5a4220", m1: "#a07a34", m2: "#f0d090", blade: ["#c8a060", "#ffe8b0"], name: { k: ["Messingdorne", "Brass prongs"], p: ["Uhrpendel", "Clock pendulum"] } },
    schlund: { spike: "chitin", m0: "#2a1e26", m1: "#5a3e4a", m2: "#d8c8b8", fl: ["#8aa020", "#d8e060", "#fbffd0"], burn: "poison", name: { k: ["Chitinstachel", "Chitin spines"], f: ["Giftschlot", "Venom vent"], r: ["Kokonbrocken", "Cocoon lump"] } },
    schmiede: { spike: "hot", m0: "#3a2a24", m1: "#a8461a", m2: "#ffd27a", fl: ["#ff5a10", "#ffc060", "#fffbe8"], blade: ["#d8a070", "#fff0c0"], hot: 1, name: { k: ["Glühdorne", "Glowing spikes"], f: ["Essenstoß", "Forge blast"], z: ["Runensäge", "Rune saw"] } },
    zinnen: { spike: "stone", m0: "#4a3e3a", m1: "#8a7a70", m2: "#d0c4b8", name: { k: ["Schieferspieße", "Slate spikes"], p: ["Wetterbeil", "Weather axe"] } },
    see: { spike: "coral", m0: "#4a2a30", m1: "#a85a62", m2: "#f0c8b8", name: { k: ["Korallendorne", "Coral thorns"], r: ["Tropfstein", "Dripstone"] } },
    glut: { spike: "hot", m0: "#2a2420", m1: "#7a3a1a", m2: "#ffb060", fl: ["#3aa020", "#a8f050", "#f0ffd0"], hot: 1, name: { k: ["Schlackedorne", "Slag spikes"], f: ["Grünfeuerdüse", "Greenfire jet"], r: ["Glutschlacke", "Ember slag"], z: ["Glutsäge", "Ember saw"] } },
    sturm: { spike: "storm", m0: "#3a3438", m1: "#6a6268", m2: "#f0e8d8", name: { k: ["Sturmeisen", "Storm irons"], p: ["Blitzpendel", "Lightning pendulum"] } }
  };
  let skin = SKIN0;
  Z.trapSkin = () => skin;
  Z.traps = traps; Z.parcoursMovers = movers;

  const tier = () => (Z.run ? Z.run.tier || 0 : 0);
  /* Torhof: Fallen beißen nur leicht (sanfter Einstieg); danach mit der Tiefe härter */
  const biomeMul = () => (tier() === 0 ? 0.6 : 1);
  const dmgFrac = f => { const P = Z.player; return Math.max(1, Math.round((P ? P.hpMax : 100) * f * (1 + tier() * 0.12) * biomeMul())); };
  function ceilingAbove(tx, ty) { for (let y = ty; y > ty - 14; y--) if (W.solidT(W.tile(tx, y - 1))) return y * T; return ty * T; }
  function floorBelow(tx, ty) { for (let y = ty; y < ty + 16; y++) if (W.solidT(W.tile(tx, y + 1)) || W.isPlat(tx, y + 1)) return (y + 1) * T; return (ty + 8) * T; }

  /* ======================= AUFBAU ======================= */
  Z.setupParcours = function (lv) {
    traps.length = 0; movers.length = 0; crumbles.length = 0; voidTops.length = 0; voidRuns.length = 0;
    if (!lv) return;
    const list = (lv.traps || []).slice(), used = new Set(), key = m => m.x + "," + m.y;
    const R = Z.Rng ? Z.Rng((lv.seed || 1) ^ 0x51ab) : Math.random;
    const rnd = () => (typeof R === "function" ? R() : Math.random());
    /* Läufe gleicher Zeichen in einer Zeile zusammenfassen (Säge, Fähre) */
    const run = (m, ch) => { let x0 = m.x, x1 = m.x; while (list.some(o => o.t === ch && o.y === m.y && o.x === x0 - 1)) x0--; while (list.some(o => o.t === ch && o.y === m.y && o.x === x1 + 1)) x1++; for (let x = x0; x <= x1; x++) used.add(x + "," + m.y); return [x0, x1]; };
    /* Gebietsfallen: Vorlagen-Zeichen werden je Gebiet umgedeutet (fallen.js), neue Arten dort aufgebaut */
    const extra = Z.fallenRemap ? Z.fallenRemap(lv, list, rnd) : [];
    skin = Object.assign({}, SKIN0, SKINS[lv.biome] || SKINS[(Z.ARENAS && Z.ARENAS[lv.id] && Z.ARENAS[lv.id].base) || ""] || {});
    for (const m of list) {
      if (used.has(key(m))) continue;
      const cx = m.x * T + 8;
      switch (m.t) {
        case "p": { const ay = ceilingAbove(m.x, m.y), fl = floorBelow(m.x, m.y); const len = U.clamp(fl - ay - 17, 56, 210); traps.push({ k: "pendel", ax: cx, ay, len, amp: 0.95 + rnd() * 0.2, per: 2.2 + rnd() * 0.7, ph: rnd() * 6.28, bx: cx, by: ay + len, cd: new WeakMap() }); break; }
        case "f": traps.push({ k: "flamme", x: cx, y: floorBelow(m.x, m.y), cyc: 3, ph: rnd() * 3, cd: new WeakMap() }); break;
        case "k": traps.push({ k: "stachel", x: cx, y: floorBelow(m.x, m.y), cyc: 2.4, ph: rnd() * 2.4, up: 0, cd: new WeakMap() }); break;
        case "r": traps.push({ k: "stein", x: cx, ay: ceilingAbove(m.x, m.y), y: 0, vy: 0, st: "hang", t: 0, grow: 1, cd: new WeakMap() }); break;
        case "j": traps.push({ k: "feder", x: cx, y: floorBelow(m.x, m.y), sq: 0 }); break;
        case "<": case ">": traps.push({ k: "pfeil", x: m.x * T + (m.t === ">" ? 2 : 14), y: m.y * T + 8, dir: m.t === ">" ? 1 : -1, t: rnd() * 2.2, per: 2.2 }); break;
        case "z": { const [x0, x1] = run(m, "z"); traps.push({ k: "saege", x0: x0 * T + 10, x1: (x1 + 1) * T - 10, x: x0 * T + 10, y: floorBelow(m.x, m.y) - 3, dir: 1, sp: 95 + rnd() * 30, rot: 0, cd: new WeakMap() }); break; }
        case "m": { const [x0, x1] = run(m, "m"); movers.push({ x0: x0 * T, x1: (x1 + 1) * T, w: 48, y: m.y * T, x: x0 * T + rnd() * ((x1 - x0 + 1) * T - 48), dir: 1, sp: 62, pause: 0, dx: 0 }); break; }
      }
    }
    /* bröckelnde Stege: zusammenhängende Läufe; Abgrundkanten für Nebel */
    for (let y = 0; y < lv.H; y++) for (let x = 0; x < lv.W; x++) {
      const v = lv.get(x, y);
      if (v === 10 && lv.get(x - 1, y) !== 10) { let x1 = x; while (lv.get(x1 + 1, y) === 10) x1++; crumbles.push({ x0: x, x1, y, st: "ok", t: 0 }); }
      if (v === 9 && lv.get(x, y - 1) !== 9) { voidTops.push([x, y]); const r = voidRuns[voidRuns.length - 1]; if (r && r.y === y && r.x1 === x - 1) r.x1 = x; else voidRuns.push({ x0: x, x1: x, y }); }
    }
    if (Z.setupFallen) try { Z.setupFallen(lv, extra, rnd); } catch (e) { console.error(e); }
  };
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { Z.setupParcours(Z.level); } catch (e) { console.error(e); } return r; };

  /* ======================= TREFFER ======================= */
  function hitP(tr, frac, x, o) {
    const P = Z.player; if (!P || P.dead) return;
    Z.hurtPlayer(dmgFrac(frac), Object.assign({ x, kb: 200, kbUp: 220, parryable: false, trap: true }, o || {}));
  }
  function hitE(tr, e, dmg, o) {
    if (tr.cd.get(e) > Z.time0()) return;
    tr.cd.set(e, Z.time0() + 0.6);
    Z.hitEnemy(e, dmg, Object.assign({ src: "trap", kb: 160, kbUp: 160 }, o || {}));
  }
  let clock = 0; Z.time0 = () => clock;
  const rectP = P => ({ x: P.x, y: P.y, w: P.w, h: P.h });
  /* Trefferfläche für Fallen-Treffer (schmaler als der Körper); Plattformen und Federn nutzen weiter die echten Maße */
  const hbP = P => (Z.playerHurtBox ? Z.playerHurtBox(P) : rectP(P));
  const circRect = (cx, cy, r, b) => { const nx = U.clamp(cx, b.x, b.x + b.w), ny = U.clamp(cy, b.y, b.y + b.h); return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r; };
  /* gemeinsame Werkzeuge für die Gebietsfallen (fallen.js) */
  Z.trapApi = { dmgFrac, hitP, hitE, circRect, ceilingAbove, floorBelow, shade: (h, k) => shade(h, k), clock: () => clock, biomeMul };

  /* ======================= UPDATE ======================= */
  Z.updateParcours = function (dt) {
    clock += dt;
    const P = Z.player; if (!Z.level) return;
    const near = (x, y, d) => P && Math.abs(P.x - x) < (d || 420) && Math.abs(P.y - y) < 300;
    for (const tr of traps) {
      switch (tr.k) {
        case "pendel": {
          const a = Math.sin(clock * 6.283 / tr.per + tr.ph) * tr.amp;
          const ox = tr.bx; tr.bx = tr.ax + Math.sin(a) * tr.len; tr.by = tr.ay + Math.cos(a) * tr.len; tr.v = Math.abs(tr.bx - ox) / Math.max(dt, 1e-4);
          if (near(tr.ax, tr.ay) && Math.abs(a) < 0.15 && !tr.swoosh) { tr.swoosh = true; A.play("swingHeavy", { x: tr.bx, y: tr.by, vol: 0.35, rate: 0.7 }); } else if (Math.abs(a) > 0.3) tr.swoosh = false;
          if (P && circRect(tr.bx, tr.by, 11, hbP(P))) hitP(tr, 0.14, tr.bx);
          for (const e of Z.enemies) if (!e.dead && !e.def.boss && circRect(tr.bx, tr.by, 11, e)) hitE(tr, e, 40);
          break;
        }
        case "flamme": {
          const t = (clock + tr.ph) % tr.cyc; tr.state = t < 0.7 ? "warn" : t < 1.8 ? "fire" : "off";
          if (tr.state === "warn" && Math.random() < dt * 30 && near(tr.x, tr.y)) FX.p({ x: tr.x + (Math.random() - 0.5) * 6, y: tr.y - 2, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 30, life: 0.3, size: 1.4, col: skin.fl[1], kind: "spark", add: true });
          if (tr.state === "warn" && !tr.wsnd && near(tr.x, tr.y, 300)) { tr.wsnd = true; A.play("amb/n_zischen_" + (1 + ((Math.random() * 5) | 0)) + ".mp3", { x: tr.x, y: tr.y, vol: 0.3, gap: 0.3 }); } else if (tr.state !== "warn") tr.wsnd = false;
          if (tr.state === "fire") {
            if (!tr.on) { tr.on = true; if (near(tr.x, tr.y)) A.play("fireBig", { x: tr.x, vol: 0.35, rate: 1.2 }); }
            const r = { x: tr.x - 7, y: tr.y - 58, w: 14, h: 58 };
            const pz = skin.burn === "poison";
            if (P && U.overlap(r, hbP(P))) { hitP(tr, 0.12, tr.x, { kb: 120 }); Z.addStatus(P, pz ? "poison" : "burn", pz ? 2 : 1.5, true); }
            for (const e of Z.enemies) if (!e.dead && U.overlap(r, e)) { hitE(tr, e, 30); Z.addStatus(e, pz ? "poison" : "burn", 2); }
            if (Math.random() < dt * 70) FX.p({ x: tr.x + (Math.random() - 0.5) * 8, y: tr.y - 4, vx: (Math.random() - 0.5) * 30, vy: -170 - Math.random() * 80, life: 0.35, size: 3, col: Math.random() < 0.5 ? skin.fl[1] : skin.fl[0], kind: "glow", add: true });
          } else tr.on = false;
          break;
        }
        case "stachel": {
          const t = (clock + tr.ph) % tr.cyc, want = t < 0.95 ? 1 : t > tr.cyc - 0.35 ? 0.25 : 0;
          if (want === 1 && tr.up < 1 && near(tr.x, tr.y, 260)) A.play("chain", { x: tr.x, vol: 0.3, rate: 1.6, gap: 0.05 });
          tr.up = U.approach(tr.up, want, dt * (want === 1 ? 18 : 6));
          if (tr.up > 0.8) {
            const r = { x: tr.x - 7, y: tr.y - 10, w: 14, h: 10 };
            if (P && U.overlap(r, hbP(P))) hitP(tr, 0.12, tr.x, { kb: 60, kbUp: 300 });
            for (const e of Z.enemies) if (!e.dead && !e.def.fly && U.overlap(r, e)) hitE(tr, e, 25);
          }
          break;
        }
        case "stein": {
          tr.t += dt;
          if (tr.st === "hang") {
            tr.grow = Math.min(1, tr.grow + dt * 0.8);
            if (tr.grow >= 1 && P && Math.abs(P.x + P.w / 2 - tr.x) < 26 && P.y > tr.ay && P.y - tr.ay < 230 && W.los(tr.x, tr.ay + 6, P.x + P.w / 2, P.y)) { tr.st = "shake"; tr.t = 0; A.play("rock", { x: tr.x, vol: 0.4, rate: 1.4 }); }
          } else if (tr.st === "shake") {
            if (Math.random() < dt * 20) FX.p({ x: tr.x + (Math.random() - 0.5) * 8, y: tr.ay + 2, vx: 0, vy: 30, g: 400, life: 0.5, size: 1.4, col: Z.dustCol || "#8a7a70", kind: "shard" });
            if (tr.t > 0.42) { tr.st = "fall"; tr.y = tr.ay + 6; tr.vy = 0; }
          } else if (tr.st === "fall") {
            tr.vy = Math.min(tr.vy + 1300 * dt, 700); tr.y += tr.vy * dt;
            const b = { x: tr.x - 6, y: tr.y - 6, w: 12, h: 16 };
            if (P && U.overlap(b, hbP(P))) { hitP(tr, 0.15, tr.x, { kb: 120, kbUp: 100 }); tr.st = "gone"; tr.t = 0; shatter(tr); }
            for (const e of Z.enemies) if (!e.dead && U.overlap(b, e)) { hitE(tr, e, 50, { eff: { stun: 1 } }); tr.st = "gone"; tr.t = 0; shatter(tr); break; }
            if (tr.st === "fall" && W.solidAt(tr.x, tr.y + 10)) { tr.st = "gone"; tr.t = 0; shatter(tr); }
          } else if (tr.st === "gone" && tr.t > 5) { tr.st = "hang"; tr.grow = 0; }
          break;
        }
        case "feder": {
          tr.sq = Math.max(0, tr.sq - dt);
          const r = { x: tr.x - 8, y: tr.y - 7, w: 16, h: 8 };
          if (P && P.vy >= 0 && U.overlap(r, P) && !P.climbing) { P.vy = -680; P.onGround = false; P.airJumps = 1; P.cut = true; P.coyote = 0; tr.sq = 0.25; A.play("jump", { vol: 0.6, rate: 0.6 }); FX.burst(tr.x, tr.y - 6, 8, { col: ["#ffd27a", "#fff"], sp: 80, ang: -Math.PI / 2, spread: 1, life: 0.3, size: 1.6, kind: "spark", add: true }); Z.input.rumble(0.2, 40); }
          for (const e of Z.enemies) if (!e.dead && !e.def.boss && !e.def.fly && e.vy >= 0 && U.overlap(r, e)) { e.vy = -560; e.onGround = false; tr.sq = 0.25; }
          break;
        }
        case "pfeil": {
          if (!near(tr.x, tr.y, 360)) break;
          tr.t += dt;
          tr.warn = tr.t > tr.per - 0.4;
          if (tr.t >= tr.per) { tr.t = 0; Z.spawnProj("e_bolzen", tr.x + tr.dir * 4, tr.y, tr.dir, { dmg: dmgFrac(0.1), vy: 0, g: 0, speed: 330 }); A.play("bow", { x: tr.x, vol: 0.4, rate: 1.3 }); }
          break;
        }
        case "saege": {
          tr.x += tr.dir * tr.sp * dt; if (tr.x > tr.x1) { tr.x = tr.x1; tr.dir = -1; } if (tr.x < tr.x0) { tr.x = tr.x0; tr.dir = 1; }
          tr.rot += dt * 22 * tr.dir;
          if (Math.random() < dt * 25 && near(tr.x, tr.y)) FX.p({ x: tr.x - tr.dir * 8, y: tr.y + 2, vx: -tr.dir * (60 + Math.random() * 80), vy: -60 - Math.random() * 60, g: 500, life: 0.3, size: 1.2, col: "#ffd27a", kind: "spark", add: true });
          if (near(tr.x, tr.y, 200) && Math.random() < dt * 3) A.play("hitMetal", { x: tr.x, vol: 0.12, rate: 2, gap: 0.2 });
          if (P && circRect(tr.x, tr.y, 10, hbP(P))) hitP(tr, 0.13, tr.x, { kb: 220, kbUp: 260 });
          for (const e of Z.enemies) if (!e.dead && !e.def.fly && circRect(tr.x, tr.y, 10, e)) { hitE(tr, e, 35, { eff: { bleed: 2 } }); }
          break;
        }
      }
    }
    /* Fähren: bewegen und Spieler mitnehmen */
    for (const m of movers) {
      const ox = m.x;
      if (m.pause > 0) m.pause -= dt;
      else { m.x += m.dir * m.sp * dt; if (m.x + m.w > m.x1) { m.x = m.x1 - m.w; m.dir = -1; m.pause = 0.55; } if (m.x < m.x0) { m.x = m.x0; m.dir = 1; m.pause = 0.55; } }
      m.dx = m.x - ox;
      if (!P || P.dead) continue;
      const over = P.x + P.w > m.x + 1 && P.x < m.x + m.w - 1;
      if (P.onMover === m) {
        if (over && P.vy >= 0 && Math.abs(P.y + P.h - m.y) < 3 && !P.grapple) { P.x += m.dx; P.y = m.y - P.h; P.vy = 0; P.onGround = true; }
        else P.onMover = null;
      } else if (over && P.vy >= 0 && P.y + P.h >= m.y - 1 && P.y + P.h - P.vy * dt <= m.y + 4 && !P.dropT && !P.grapple) {
        const land = P.vy > 120; P.y = m.y - P.h; if (land) { P.anim.land = Math.min(1, P.vy / 500); A.play("stepWood", { vol: 0.5 }); } P.vy = 0; P.onGround = true; P.onMover = m; P.cut = false;
      }
    }
    /* bröckelnde Stege */
    for (const c of crumbles) {
      c.t += dt;
      if (c.st === "ok" && P && P.onGround && !P.onMover) {
        const fy = Math.floor((P.y + P.h + 1) / T);
        if (fy === c.y && P.x + P.w > c.x0 * T && P.x < (c.x1 + 1) * T) { c.st = "shake"; c.t = 0; A.play("rock", { x: P.x, vol: 0.35, rate: 1.6 }); }
      } else if (c.st === "shake" && c.t > 0.5) {
        c.st = "gone"; c.t = 0;
        for (let x = c.x0; x <= c.x1; x++) { Z.level.set(x, c.y, 0); FX.burst(x * T + 8, c.y * T + 3, 6, { col: [Z.dustCol || "#8a7a70", "#5a4a40"], sp: 50, ang: Math.PI / 2, spread: 1.6, life: 0.7, size: 2.6, kind: "shard", g: 500 }); }
        A.play("rock", { x: c.x0 * T, vol: 0.55 });
      } else if (c.st === "gone" && c.t > 3.6) {
        const r = { x: c.x0 * T, y: c.y * T - 2, w: (c.x1 - c.x0 + 1) * T, h: 8 };
        if (!P || !U.overlap(r, P)) { c.st = "ok"; c.t = 0; for (let x = c.x0; x <= c.x1; x++) Z.level.set(x, c.y, 10); }
      }
    }
    /* Gegner, die in den Abgrund stürzen */
    for (const e of Z.enemies) if (!e.dead && !e.def.fly && W.tile(Math.floor((e.x + e.w / 2) / T), Math.floor((e.y + e.h * 0.4) / T)) === 9) { e.hp = 0; Z.killEnemy && Z.killEnemy(e, { src: "fall" }); }
    /* aufsteigender Nebel aus der Tiefe */
    const cam = Z.cam, q = Z.gq && Z.gq.part != null ? Z.gq.part : 1;
    for (const [x, y] of voidTops) {
      const px = x * T, py = y * T; if (px < cam.x - 16 || px > cam.x + cam.w || py < cam.y - 16 || py > cam.y + cam.h + 16) continue;
      if (Math.random() < dt * 1.6 * q) FX.p({ x: px + Math.random() * T, y: py + 10, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 10, life: 2.2, size: 7, col: "rgba(40,30,36,.35)", kind: "smoke", drag: 1, keep: false });
    }
  };
  function shatter(tr) { FX.burst(tr.x, tr.y + 6, 12, { col: [Z.dustCol || "#8a7a70", "#6a5a50"], sp: 120, ang: -Math.PI / 2, spread: 2.6, life: 0.5, size: 2.4, kind: "shard", g: 600 }); A.play("rock", { x: tr.x, vol: 0.6 }); FX.addShake(2); }

  /* ======================= LICHT ======================= */
  const lightPrev = Z.lightExtra;
  Z.lightExtra = function (hole) {
    if (lightPrev) lightPrev(hole);
    /* Zinnen: aus den Abgründen scheint der brennende Himmel herauf */
    if (voidRuns.length && Z.level && Z.level.biome === "zinnen") { const cam = Z.cam; for (const r of voidRuns) { const px = (r.x0 + r.x1 + 1) * T / 2, py = (r.y + 1) * T; if (px > cam.x - 60 && px < cam.x + cam.w + 60 && py > cam.y - 60 && py < cam.y + cam.h + 60) hole(px, py, 20 + (r.x1 - r.x0 + 1) * 7, 0.4, "#ff7a3a"); } }
    for (const tr of traps) {
      if (tr.k === "flamme" && tr.state === "fire") hole(tr.x, tr.y - 30, 80, 0.9, skin.fl[0]);
      else if (tr.k === "flamme" && tr.state === "warn") hole(tr.x, tr.y - 4, 26, 0.5, skin.fl[0]);
      else if (tr.k === "saege") hole(tr.x, tr.y, 30, 0.45);
      else if (tr.k === "pfeil" && tr.warn) hole(tr.x, tr.y, 22, 0.6, "#ff8a3a");
      else if (tr.k === "stachel" && skin.hot) hole(tr.x, tr.y - 4, 24, 0.35 + tr.up * 0.3, "#ff7a2a");
    }
  };

  /* ======================= ZEICHNEN ======================= */
  Z.drawParcours = function (c, t) {
    const cam = Z.cam, vis = (x, y, m) => x > cam.x - (m || 60) && x < cam.x + cam.w + (m || 60) && y > cam.y - (m || 60) - 120 && y < cam.y + cam.h + (m || 60);
    const B = Z.biome || {}, plat = B.plat || "#6a5040";
    if (voidRuns.length) drawVoids(c, t, B, vis);
    /* bröckelnde Stege */
    for (const cr of crumbles) {
      if (cr.st === "gone") { if (cr.t > 3.0) { c.save(); c.globalAlpha = (cr.t - 3) / 0.6 * 0.4; for (let x = cr.x0; x <= cr.x1; x++) { c.fillStyle = plat; c.fillRect(x * T, cr.y * T, T, 5); } c.restore(); } continue; }
      const px0 = cr.x0 * T, py = cr.y * T; if (!vis(px0, py, 80)) continue;
      const sh = cr.st === "shake" ? (Math.random() - 0.5) * 2.2 * (0.5 + cr.t) : 0;
      const TL = B.tile || {}, cb = TL.base || "#7a6a5e", cl = TL.light || "#958476", cd = TL.dark || "#2a2024";
      for (let x = cr.x0; x <= cr.x1; x++) {
        const px = x * T + sh, h = (x * 7 + cr.y * 3) % 5;
        c.fillStyle = cd; c.fillRect(px, py + 1, T, 6);
        c.fillStyle = cb; c.fillRect(px + 0.5, py, T - 1, 5);
        c.fillStyle = cl; c.fillRect(px + 0.5, py, T - 1, 1.5);
        c.strokeStyle = skin.hot ? "rgba(255," + (120 + 60 * Math.sin(t * 3 + x)) + ",40,.9)" : "rgba(20,14,16,.8)"; c.lineWidth = skin.hot ? 0.9 : 0.7; c.beginPath(); c.moveTo(px + 3 + h, py); c.lineTo(px + 6 + h, py + 3); c.lineTo(px + 4 + h, py + 5); c.moveTo(px + 11, py + 1); c.lineTo(px + 13 - h * 0.4, py + 5); c.stroke();
        if (x === cr.x0 || x === cr.x1) { c.fillStyle = cd; c.fillRect(x === cr.x0 ? px : px + T - 3, py + 5, 3, 4); }
      }
      if (skin.hot && Z.gq.level !== 0) glow(c, px0 + (cr.x1 - cr.x0 + 1) * T / 2, py + 3, (cr.x1 - cr.x0 + 1) * 6, "rgba(255,110,30,.22)");
      if (cr.st === "shake" && Math.random() < 0.4) FX.p({ x: px0 + Math.random() * (cr.x1 - cr.x0 + 1) * T, y: py + 5, vx: 0, vy: 20, g: 400, life: 0.5, size: 1.2, col: "#6a5a50", kind: "shard" });
    }
    /* Fähren */
    for (const m of movers) {
      if (!vis(m.x, m.y)) continue;
      const x = Math.round(m.x * 4) / 4, y = m.y;
      c.fillStyle = "#1e1618"; c.fillRect(x + 2, y + 3, m.w - 4, 6);
      c.fillStyle = shade(plat, -0.2); c.fillRect(x, y, m.w, 6);
      c.fillStyle = plat; c.fillRect(x, y, m.w, 3);
      c.fillStyle = shade(plat, 0.25); c.fillRect(x, y, m.w, 1);
      for (let i = 1; i < 3; i++) { c.fillStyle = shade(plat, -0.45); c.fillRect(x + i * 16, y, 1, 5); }
      c.fillStyle = "#3a3034"; c.fillRect(x - 1, y + 1, 3, 6); c.fillRect(x + m.w - 2, y + 1, 3, 6);
      /* Glutrunen unten: zeigen die Fahrtrichtung */
      c.save(); c.globalCompositeOperation = "lighter"; const k = 0.5 + 0.5 * Math.sin(t * 4);
      glow(c, x + m.w / 2 + m.dir * 10, y + 8, 6 + k * 2, "rgba(255,150,60,.5)"); c.restore();
      c.fillStyle = "#ffb060"; c.fillRect(x + m.w / 2 + m.dir * 10 - 1, y + 7, 2, 2);
    }
    const lo = Z.gq && Z.gq.level === 0, S = skin;
    for (const tr of traps) {
      switch (tr.k) {
        case "pendel": {
          if (!vis(tr.ax, tr.ay + tr.len / 2, 160)) break;
          /* Kette aus Gliedern statt Strich */
          const dx = tr.bx - tr.ax, dy = tr.by - tr.ay, L0 = Math.hypot(dx, dy), n = Math.max(2, Math.floor(L0 / 5));
          c.strokeStyle = "#2a2226"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(tr.ax, tr.ay); c.lineTo(tr.bx, tr.by); c.stroke();
          if (!lo) { c.fillStyle = S.m1; for (let i = 1; i < n; i++) { const k = i / n; c.fillRect(tr.ax + dx * k - 1, tr.ay + dy * k - 1, 2, 2); } }
          /* Halterung an der Decke */
          c.fillStyle = "#2a2226"; c.fillRect(tr.ax - 5, tr.ay, 10, 3); circ(c, tr.ax, tr.ay + 3, 2.6, S.m0); circ(c, tr.ax, tr.ay + 3, 1.1, S.m2);
          const ang = Math.atan2(dy, dx);
          if (tr.v > 160 && !lo) { c.save(); c.globalAlpha = Math.min(0.3, tr.v / 1800); c.strokeStyle = S.blade[1]; c.lineWidth = 12; c.beginPath(); c.arc(tr.ax, tr.ay, tr.len, ang - 0.14, ang + 0.14); c.stroke(); c.restore(); }
          c.save(); c.translate(tr.bx, tr.by); c.rotate(ang - Math.PI / 2);
          /* Schaft, Klinge mit Schneide, Gravur */
          c.fillStyle = S.wood; c.fillRect(-2, -8, 4, 8); c.fillStyle = S.m0; c.fillRect(-3, -2, 6, 2.5);
          c.fillStyle = S.m0; c.beginPath(); c.moveTo(-13, -2); c.quadraticCurveTo(0, 17, 13, -2); c.lineTo(9, -4); c.quadraticCurveTo(0, 7, -9, -4); c.closePath(); c.fill();
          c.fillStyle = S.blade[0]; c.beginPath(); c.moveTo(-12, -1); c.quadraticCurveTo(0, 15.5, 12, -1); c.lineTo(8.5, -3); c.quadraticCurveTo(0, 7.5, -8.5, -3); c.closePath(); c.fill();
          c.fillStyle = S.blade[1]; c.beginPath(); c.moveTo(-11, 0.5); c.quadraticCurveTo(0, 15, 11, 0.5); c.quadraticCurveTo(0, 12.5, -11, 0.5); c.fill();
          if (!lo) { c.strokeStyle = "rgba(30,20,20,.35)"; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 1, 4, 0.3, Math.PI - 0.3); c.stroke(); if (S.spike === "rust") { c.fillStyle = "rgba(140,70,30,.55)"; c.fillRect(-7, 2, 3, 2); c.fillRect(4, 4, 2, 2); } }
          c.fillStyle = "rgba(140,20,20,.55)"; c.fillRect(-3, 8, 3, 2);
          c.restore(); break;
        }
        case "flamme": {
          if (!vis(tr.x, tr.y)) break;
          /* Düse: Gussrost mit Nieten, je Gebiet getönt */
          c.fillStyle = "#1e1618"; c.fillRect(tr.x - 7, tr.y - 3, 14, 3); c.fillStyle = S.m0; c.fillRect(tr.x - 6, tr.y - 4, 12, 2); c.fillStyle = S.m1; c.fillRect(tr.x - 6, tr.y - 4, 12, 0.7);
          c.fillStyle = "#120c0e"; for (let i = -1; i <= 1; i++) c.fillRect(tr.x + i * 3 - 0.6, tr.y - 4, 1.2, 1.5);
          if (tr.state === "warn") { c.fillStyle = S.fl[1]; for (let i = -1; i <= 1; i++) c.fillRect(tr.x + i * 3 - 0.6, tr.y - 4, 1.2, 1); glow(c, tr.x, tr.y - 4, 8 + Math.sin(t * 40) * 2, S.fl[0], 0.7); }
          else { c.fillStyle = "#120c0e"; c.fillRect(tr.x - 2, tr.y - 4, 4, 1); }
          if (tr.state === "fire") {
            const k = (clock + tr.ph) % tr.cyc - 0.7, hh = 58 * Math.min(1, k * 8) * (0.9 + Math.sin(t * 50) * 0.1);
            const spr = flameSpr(S.fl);
            c.save(); c.globalCompositeOperation = "lighter";
            for (let i = 0; i < (lo ? 2 : 3); i++) { const w = 20 - i * 5, sk = Math.sin(t * 28 + i * 2) * 0.12; c.save(); c.translate(tr.x, tr.y - 2); c.transform(1, 0, sk, 1, 0, 0); c.drawImage(spr, -w / 2, -hh * (1 - i * 0.12), w, hh * (1 - i * 0.12)); c.restore(); }
            c.restore();
          }
          break;
        }
        case "stachel": {
          if (!vis(tr.x, tr.y)) break;
          c.fillStyle = "#1e1618"; c.fillRect(tr.x - 8, tr.y - 2, 16, 2); c.fillStyle = S.m0; c.fillRect(tr.x - 8, tr.y - 2, 16, 0.8);
          const hh = tr.up * 10;
          if (hh > 0.5) drawSpikes(c, tr.x, tr.y - 1, hh, t, lo);
          else if (!lo) { c.fillStyle = S.m1; for (let i = 0; i < 4; i++) c.fillRect(tr.x - 6 + i * 4 - 0.5, tr.y - 2, 1, 0.8); }
          break;
        }
        case "stein": {
          if (!vis(tr.x, tr.ay, 40)) break;
          const TL = B.tile || {}, sb = TL.base || "#4a4044", sl = TL.light || "#6a6064";
          if (tr.st === "hang" || tr.st === "shake") {
            const sx = tr.st === "shake" ? (Math.random() - 0.5) * 2 : 0, g = tr.grow;
            c.fillStyle = shade(sb, -0.25); c.beginPath(); c.moveTo(tr.x - 8 * g + sx, tr.ay); c.quadraticCurveTo(tr.x - 3 * g + sx, tr.ay + 8 * g, tr.x + 1 + sx, tr.ay + 19 * g); c.quadraticCurveTo(tr.x + 4 * g + sx, tr.ay + 8 * g, tr.x + 8 * g + sx, tr.ay); c.closePath(); c.fill();
            c.fillStyle = sl; c.beginPath(); c.moveTo(tr.x - 5 * g + sx, tr.ay); c.quadraticCurveTo(tr.x - 2 * g + sx, tr.ay + 7 * g, tr.x + 1 + sx, tr.ay + 15 * g); c.lineTo(tr.x + sx, tr.ay); c.closePath(); c.fill();
            if (!lo) { c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(tr.x - 3 * g + sx, tr.ay + 2, 1, 6 * g); }
            if (S.hot) { glow(c, tr.x + 1, tr.ay + 14 * g, 6, "rgba(255,120,40,.6)"); c.fillStyle = "#ffb060"; c.fillRect(tr.x, tr.ay + 15 * g, 1.5, 3 * g); }
            /* Vorwarnung: Schatten am Boden unter dem Stein, deutlicher beim Wackeln */
            if (tr.st === "shake" || (tr.grow >= 1 && !lo)) { const fy = tr.fy || (tr.fy = floorBelow(Math.floor(tr.x / T), Math.floor(tr.ay / T) + 1)); c.save(); c.globalAlpha = tr.st === "shake" ? 0.45 : 0.14; ell(c, tr.x, fy - 0.5, 8, 2, "#000"); c.restore(); }
          } else if (tr.st === "fall") {
            c.fillStyle = shade(sb, -0.25); c.beginPath(); c.moveTo(tr.x - 8, tr.y - 6); c.quadraticCurveTo(tr.x - 3, tr.y + 2, tr.x + 1, tr.y + 12); c.quadraticCurveTo(tr.x + 4, tr.y + 2, tr.x + 8, tr.y - 6); c.closePath(); c.fill();
            c.save(); c.globalAlpha = 0.25; c.fillStyle = "#e8e0d8"; c.fillRect(tr.x - 5, tr.y - 22, 10, 14); c.restore();
          }
          break;
        }
        case "feder": {
          if (!vis(tr.x, tr.y)) break;
          const s2 = tr.sq > 0 ? 1 - Math.sin(tr.sq / 0.25 * Math.PI) * 0.5 : 1;
          c.strokeStyle = "#a89a8a"; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i <= 4; i++) { const y = tr.y - i * 1.6 * s2 - 1; c.lineTo(tr.x + (i % 2 ? 4 : -4), y); } c.stroke();
          c.fillStyle = "#c8a040"; c.fillRect(tr.x - 7, tr.y - 8 * s2 - 2, 14, 2.4); c.fillStyle = "#ffe08a"; c.fillRect(tr.x - 7, tr.y - 8 * s2 - 2, 14, 0.8);
          c.fillStyle = "#3a3034"; c.fillRect(tr.x - 6, tr.y - 1.5, 12, 1.5);
          break;
        }
        case "pfeil": {
          if (!vis(tr.x, tr.y)) break;
          const TL = B.tile || {}, bx = tr.dir > 0 ? tr.x - 2 : tr.x - 6;
          c.fillStyle = TL.dark || "#3a3236"; c.fillRect(bx, tr.y - 6, 8, 12); c.fillStyle = TL.det || "#5a5256"; c.fillRect(bx + 1, tr.y - 5, 6, 10);
          if (!lo) { c.fillStyle = TL.light || "#7a6a62"; c.fillRect(bx + 1, tr.y - 5, 6, 1); c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(bx + 1, tr.y + 4, 6, 1); }
          circ(c, tr.x + tr.dir * 2, tr.y, 2.2, "#120c0e");
          if (tr.warn) { circ(c, tr.x + tr.dir * 2, tr.y, 1.6, "#ff8a3a"); glow(c, tr.x + tr.dir * 3, tr.y, 8, "rgba(255,120,40,.7)"); }
          break;
        }
        case "saege": {
          if (!vis(tr.x, tr.y)) break;
          /* Schlitz mit Rand im Boden */
          c.fillStyle = "#0e0a0c"; c.fillRect(tr.x0 - 10, tr.y + 1.5, tr.x1 - tr.x0 + 20, 2.5); c.fillStyle = S.m0; c.fillRect(tr.x0 - 11, tr.y + 1, 2, 3); c.fillRect(tr.x1 + 9, tr.y + 1, 2, 3);
          c.save(); c.translate(tr.x, tr.y); c.rotate(tr.rot);
          c.fillStyle = S.hot ? "#c8501a" : S.blade[0]; c.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, a2 = a + 0.22; c.lineTo(Math.cos(a) * 11.5, Math.sin(a) * 11.5); c.lineTo(Math.cos(a2) * 8.5, Math.sin(a2) * 8.5); } c.closePath(); c.fill();
          circ(c, 0, 0, 8, S.hot ? "#7a3a1a" : S.m1); circ(c, 0, 0, 6.5, S.hot ? "#a84a1a" : S.blade[0]);
          if (!lo) { c.fillStyle = "#2a2226"; for (let i = 0; i < 3; i++) { const a = i * 2.094; c.beginPath(); c.arc(Math.cos(a) * 4, Math.sin(a) * 4, 1.4, 0, 6.283); c.fill(); } }
          circ(c, 0, 0, 2.4, "#2a2226"); c.fillStyle = "rgba(255,255,255,.45)"; c.fillRect(-6, -1, 12, 0.8);
          c.restore();
          if (S.hot) glow(c, tr.x, tr.y, 14, "rgba(255,110,30,.45)");
          break;
        }
      }
    }
  };
  /* Echte Abgründe (Spinnenschlund, Zinnen) deutlich als Gefahr: Licht bzw. Dunst aus der Tiefe, abgebrochene Kanten,
     im Schlund Netzfäden über dem Spalt. Verläufe einmal je Gebiet gebacken (lokal 0…2 Kacheln, per translate verschoben). */
  const VOID_COL = { zinnen: ["rgba(255,120,50,0)", "rgba(255,105,40,.42)", "#ffb070"], schlund: ["rgba(120,60,130,0)", "rgba(150,80,170,.46)", "#d8c8e8"] };
  let voidG = null, voidGK = "";
  function drawVoids(c, t, B, vis) {
    const id = (Z.level && Z.level.biome) || "", col = VOID_COL[id] || ["rgba(0,0,0,0)", "rgba(110,40,30,.3)", "#c8a090"];
    if (voidGK !== id || !voidG) { voidGK = id; voidG = c.createLinearGradient(0, 0, 0, 2 * T); voidG.addColorStop(0, col[0]); voidG.addColorStop(1, col[1]); }
    const TL = B.tile || {}, dk = TL.dark || "#1a1214", lo = Z.gq && Z.gq.level === 0;
    for (const r of voidRuns) {
      const px = r.x0 * T, w = (r.x1 - r.x0 + 1) * T, py = r.y * T;
      if (!vis(px + w / 2, py, w)) continue;
      c.save(); c.translate(0, py); c.fillStyle = voidG; c.fillRect(px, 3, w, 2 * T - 3); c.restore();
      /* abgebrochene Kante links und rechts: Zacken, die in die Tiefe hängen */
      c.fillStyle = dk;
      for (const [ex, d] of [[px, 1], [px + w, -1]]) { c.beginPath(); c.moveTo(ex, py); c.lineTo(ex + d * 4, py); c.lineTo(ex + d * 1.5, py + 7); c.lineTo(ex + d * 3, py + 9); c.lineTo(ex, py + 15); c.closePath(); c.fill(); }
      /* Warnschimmer an der Kante (pulsierend) */
      c.save(); c.globalAlpha = 0.28 + 0.14 * Math.sin(t * 2.2 + r.x0); c.fillStyle = col[2]; c.fillRect(px, py + 1, w, 1); c.restore();
      if (id === "schlund" && !lo && w <= 9 * T) {
        /* zwei, drei Netzfäden über dem Spalt */
        c.strokeStyle = "rgba(216,208,224,.45)"; c.lineWidth = 0.6; c.beginPath();
        for (let k = 0; k < 3; k++) { const y0 = py + 2 + k * 4, sag = 6 + k * 3 + Math.sin(t * 1.3 + k + r.x0) * 1.2; c.moveTo(px - 2, y0); c.quadraticCurveTo(px + w / 2, y0 + sag, px + w + 2, y0 + (k % 2 ? 2 : 0)); }
        c.stroke();
      }
    }
  }
  /* Stachelreihe je Gebiet */
  function drawSpikes(c, x0, y0, hh, t, lo) {
    const S = skin;
    for (let i = 0; i < 4; i++) {
      const x = x0 - 6 + i * 4, h = hh * (i % 2 ? 0.92 : 1);
      switch (S.spike) {
        case "wood": /* angespitzte Pfähle mit Rinde */
          c.fillStyle = S.m0; c.beginPath(); c.moveTo(x - 1.8, y0); c.lineTo(x - 1.4, y0 - h * 0.7); c.lineTo(x, y0 - h); c.lineTo(x + 1.4, y0 - h * 0.7); c.lineTo(x + 1.8, y0); c.fill();
          c.fillStyle = S.m2; c.beginPath(); c.moveTo(x - 1.2, y0 - h * 0.72); c.lineTo(x, y0 - h); c.lineTo(x + 0.4, y0 - h * 0.7); c.fill(); break;
        case "chitin": case "coral": /* gebogene organische Dornen */
          c.fillStyle = S.m1; c.beginPath(); c.moveTo(x - 2, y0); c.quadraticCurveTo(x - 1.5, y0 - h * 0.6, x + (i % 2 ? 1.5 : -1.5), y0 - h); c.quadraticCurveTo(x + 0.6, y0 - h * 0.5, x + 2, y0); c.fill();
          c.fillStyle = S.m2; c.beginPath(); c.moveTo(x - 0.8, y0 - h * 0.3); c.quadraticCurveTo(x - 0.6, y0 - h * 0.7, x + (i % 2 ? 1.5 : -1.5), y0 - h); c.lineTo(x, y0 - h * 0.35); c.fill();
          if (S.spike === "coral" && !lo) { circ(c, x - 1, y0 - h * 0.45, 0.7, "#f0d8c0"); } break;
        default: {
          const col = S.spike === "blood" ? "#5a4a44" : S.m1;
          c.fillStyle = col; c.beginPath(); c.moveTo(x - 1.7, y0); c.lineTo(x, y0 - h); c.lineTo(x + 1.7, y0); c.fill();
          c.fillStyle = S.m2; c.fillRect(x - 0.3, y0 - h, 0.6, h * 0.55);
          if (S.spike === "rust" && !lo) { c.fillStyle = "rgba(150,70,30,.7)"; c.fillRect(x - 1, y0 - h * 0.4, 1.4, h * 0.3); }
          if (S.spike === "blood") { c.fillStyle = "#8a1414"; c.fillRect(x - 0.6, y0 - h, 1.2, h * 0.3); }
          if (S.spike === "hot") { c.fillStyle = "#ffd27a"; c.fillRect(x - 0.4, y0 - h, 0.8, h * 0.4); }
          if (S.spike === "storm" && !lo && Math.random() < 0.08) { c.strokeStyle = "#fff0c0"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y0 - h); c.lineTo(x + 2, y0 - h - 2); c.lineTo(x + 1, y0 - h - 4); c.stroke(); }
        }
      }
    }
    if (S.hot) glow(c, x0, y0 - hh * 0.5, 9, "rgba(255,120,40,.45)");
  }
  /* Flammensprite: Verlauf einmal je Farbsatz gebacken (statt pro Bild) */
  const FLS = new Map();
  function flameSpr(cols) {
    const key = cols.join(); let cv = FLS.get(key); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = 32; cv.height = 128; const g = cv.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.3, cols[1]); gr.addColorStop(0.75, cols[0]); gr.addColorStop(1, cols[2]);
    g.fillStyle = gr; g.beginPath(); g.moveTo(16, 0); g.quadraticCurveTo(26, 60, 30, 124); g.quadraticCurveTo(16, 130, 2, 124); g.quadraticCurveTo(6, 60, 16, 0); g.fill();
    g.globalCompositeOperation = "source-atop"; const g2 = g.createLinearGradient(0, 0, 32, 0); g2.addColorStop(0, "rgba(0,0,0,.35)"); g2.addColorStop(0.5, "rgba(255,255,255,.25)"); g2.addColorStop(1, "rgba(0,0,0,.35)"); g.fillStyle = g2; g.fillRect(0, 0, 32, 128);
    FLS.set(key, cv); return cv;
  }
  Z.flameSpr = flameSpr;
  function shade(hex, k) {
    const n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return hex;
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
  }
})();
