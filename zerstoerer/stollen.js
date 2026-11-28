/* Ezekiel – The Destroyer · W49 Kapitel: Buppidos Stollen (Sitzung „Das Ei des Drachen“)
   Unter Gracklstugh suchen die Helden das gestohlene Drachenei. Unter den Glutgassen liegen Tunnel mit leuchtenden
   Erzadern und Glühpilzen, eine Höhle voller Leichenberge und der Altar des kichernden Mörders Buppido.
   Das Gebiet selbst steht in welt.js (BIOMES.stollen, hinten angehängt), hier kommt alles dazu:
   · Gegner: Leichenskelett (liegt als Knochenhaufen zwischen den Toten und steht auf, wenn man nahe kommt),
             Duergar-Alchemist (wirft Säure- und Feuerphiolen), Duergar-Axtkämpfer (schwer, stürmt an)
   · Wächter: Buppido – flink, Dolche, Bärenfallen, verschwindet kichernd und taucht hinter einem auf, ruft Skelette
             („Wollt ihr meinen Altar sehen?“). Am Ende erstarrt er durch Barradins Zauber.
   · Pilze: Schrumpfpilz (violett) – 12 s daumenklein: niedrige Gänge passieren, schwerer zu treffen, weniger Schaden
            (genommen und ausgeteilt); Wachspilz (bernstein) – 12 s groß: mehr Schaden, kein Rückstoß, etwas verwundbarer.
   · Niedrige Gänge: in den Fels geschlagene Kriechgänge (eine Kachel hoch) zu kleinen Nischen mit Beute.
   · Kulisse: Erzadern (Grün-/Türkis- und Violettleuchten, kein Blau), Glühpilze, Leichenberge, Buppidos Altar
             mit dem abgetrennten Arm und Ring, danach der Geist eines Tiefengnoms: „Bringt mich heim.“
   Fundbuch: eigene Kunde-Zeilen für die neuen Gegner und Buppido.
   Nur Gastgeber/Einzelspieler steuern Pilze, Fallen und Erwachen; Grafik schlicht auf Stufe 0. Prüfhilfe: Z.stollen49. */
(function () {
  "use strict";
  const Z = window.Z;
  if (!Z || Z.stollen49 || !Z.BIOMES || !Z.BIOMES.stollen || !Z.ENEMIES || !Z.BOSSDEF || !Z.bossKit) return;
  const T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, U = Z.U, L = v => Z.L(v), TAU = Math.PI * 2;
  const R = () => Z.R();
  const DR = Z.draw || {}, limb = DR.limb, circ = DR.circ, poly = DR.poly, ell = DR.ell, glow = DR.glow;
  const K = Z.bossKit, BP = Z.bossPhase || null;
  const lo = () => !!((Z.lowGfx && Z.lowGfx()) || (Z.gq && (Z.gq.level === 0 || Z.gq.lean)));
  const gast = () => { const s = Z.online && Z.online.S; return !!(s && s.role === "guest" && s.playing); };
  const errN = {};
  const safe = (tag, fn) => { try { return fn(); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W49 Kapitel", tag, e); } } };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const inStollen = () => { const lv = Z.level; return !!(lv && !lv.hub && !lv.passage && (lv.biome === "stollen" || lv.id === "stollen")); };
  /* Farben (kein Blau): Erz grün-türkis und violett, Pilze violett/bernstein, Geist bleich-grün */
  const ERZ = ["#6af0b0", "#b07aff", "#8af0a0"], ERZG = ["rgba(106,240,176,", "rgba(176,122,255,", "rgba(138,240,160,"];
  const KLEIN = { k: "klein", col: "#c07aff", cap: "#8a3ad0", glow: "rgba(192,122,255,", n: ["Schrumpfpilz", "Shrinking mushroom"] };
  const GROSS = { k: "gross", col: "#ffb84a", cap: "#c86a1a", glow: "rgba(255,184,74,", n: ["Wachspilz", "Growing mushroom"] };

  /* ======================= GEGNER ======================= */
  const E = Z.ENEMIES;
  E.leichenskelett = { n: ["Leichenskelett", "Corpse Skeleton"], shape: "skel", c: "#d6ccb4", t: "#5a4a3c", sword: 1, w: 11, h: 22, hp: 1.1, dmg: 1.05, spd: 80, ai: "walker", sight: 200, gold: 3, undead: true, w49rise: true,
    atks: [{ k: "hit", r: [0, 30], pre: 0.4, act: 0.1, post: 0.35, cd: 0.6, box: [0, -22, 28, 22], sfx: "slash" },
           { k: "lunge", r: [20, 56], pre: 0.5, act: 0.15, post: 0.5, cd: 1.3, box: [0, -22, 24, 20], lunge: 230, sfx: "slash", w: 0.5 }],
    kunde: ["Liegt als Knochenhaufen zwischen Buppidos Toten und steht auf, wenn du nahe kommst. Wer zuerst zuschlägt, zerschlägt ihn, bevor er steht.", "Lies as a heap of bones among Buppido's dead and rises when you come close. Strike first and you smash it before it stands."] };
  E.duergarAlchemist = { n: ["Duergar-Alchemist", "Duergar Alchemist"], shape: "w49alch", c: "#4a3e3a", t: "#6ae0a8", skin: "#7a7a82", w: 12, h: 19, hp: 1.2, dmg: 1.1, spd: 72, ai: "ranged", keep: [90, 200], sight: 250, gold: 12,
    atks: [{ k: "lob", proj: "e_saeure", r: [40, 200], pre: 0.6, act: 0.05, post: 0.5, cd: 1.8, sfx: "glass" },
           { k: "lob", proj: "e_phiole", r: [40, 180], pre: 0.7, act: 0.05, post: 0.5, cd: 2.6, sfx: "glass", w: 0.6 },
           { k: "hit", r: [0, 26], pre: 0.35, act: 0.08, post: 0.35, cd: 0.7, box: [0, -18, 22, 16], sfx: "swing", w: 0.5 }],
    kunde: ["Braut in Kolben und Tiegeln, was Haut zerfrisst. Wirft Säure (grüne Lache) und Feuerphiolen – Phiolen lassen sich zurückschlagen.", "Brews in flasks and crucibles what eats through skin. Throws acid (green pool) and fire vials – vials can be parried."] };
  E.duergarAxt = { n: ["Duergar-Axtkämpfer", "Duergar Axe Fighter"], shape: "duergar", c: "#3e3a3e", t: "#d8a040", skin: "#7a7a82", size: 1.3, w: 15, h: 24, hp: 2.8, dmg: 1.4, spd: 70, ai: "walker", heavy: true, poise: 0.3, sight: 210, gold: 16, metal: true,
    atks: [{ k: "hit", r: [0, 40], pre: 0.6, act: 0.12, post: 0.55, cd: 0.9, box: [-4, -26, 42, 26], armor: true, sfx: "axe", hitSfx: "hitMetal", glyph: "!!" },
           { k: "charge", r: [60, 220], pre: 0.65, act: 0.9, post: 0.6, cd: 3.5, box: [0, -24, 26, 24], spd: 300, armor: true, sfx: "roar", glyph: "!!", w: 0.6 }],
    kunde: ["Wache der Alchemisten. Schwer gepanzert, stürmt mit der Axt voran – ausweichen, dann in die Erholung schlagen.", "Guard of the alchemists. Heavily armoured, charges axe-first – dodge, then strike into the recovery."] };
  if (Z.PK && !Z.PK.e_saeure) Z.PK.e_saeure = { speed: 0, g: 600, r: 3, life: 4, col: "#6ae0a8", lob: true, spin: true, splash: "poison", parry: true };

  /* ======================= FIGUREN ======================= */
  const SH = Z.SHAPES;
  if (SH && limb) {
    SH.w49alch = function (c, e, d, k, t, mv, ph) {
      const bob = mv ? Math.abs(Math.sin(ph)) : Math.sin(t * 2) * 0.3, act = e.act;
      const thr = act && act.a && act.a.k === "lob" ? (act.phase === "pre" ? Math.min(1, act.t / (act.a.pre || 0.5)) : act.phase === "act" ? 1 : 0) : 0;
      const st = mv ? Math.sin(ph) * 2.2 : 0, ty = -bob;
      limb(c, -2, -7, -2 - st, -0.6, 3, k("#2a2424")); limb(c, 2, -7, 2 + st, -0.6, 3, k("#332c2c"));
      ell(c, -2 - st + 0.6, -0.4, 2.2, 1, k("#1a1414")); ell(c, 2 + st + 0.6, -0.4, 2.2, 1, k("#1a1414"));
      poly(c, [-5.6, -6 + ty, 5.6, -6 + ty, 6, -15 + ty, -6, -15 + ty], k(d.c));
      poly(c, [-3.6, -14 + ty, 4.6, -14 + ty, 5.2, -4 + ty, -3.8, -4 + ty], k("#6a4a2e"));
      limb(c, -3, -9 + ty, 4.6, -9.4 + ty, 0.6, k("#4a3220"));
      limb(c, -5, -14.6 + ty, 5, -7.4 + ty, 1.2, k("#3a2a1a"));
      for (let i = 0; i < 3; i++) { const fx = -3 + i * 3, fy = -13 + i * 2.2 + ty, cc = i === 1 ? "#b07aff" : "#6ae0a8"; ell(c, fx, fy, 1, 1.3, k(cc)); if (!lo() && k(cc) === cc) glow(c, fx, fy, 3, i === 1 ? "rgba(176,122,255,.45)" : "rgba(106,224,168,.45)"); }
      c.save(); c.translate(0.6, -17.6 + ty);
      ell(c, 0, 0, 3.6, 3.4, k(d.skin));
      poly(c, [-1.8, 1, 4.2, 0.6, 3.6, 4.6, 1.4, 7.4, 0.2, 5, -1.2, 3.2], k("#c8c8ce"));
      poly(c, [-3.8, -0.6, -3.2, -3.6, 0, -4.6, 3.6, -4, 4.4, -1], k("#4a4246"));
      limb(c, -3.6, -1.4, 3.6, -1.6, 0.6, k("#2a2a2a"));
      circ(c, 2.3, -1.3, 1.45, k("#2a2a2a")); circ(c, 2.3, -1.3, 0.95, k("#6ae0a8")); if (!lo()) glow(c, 2.3, -1.3, 3.2, "rgba(106,224,168,.55)");
      c.restore();
      const a = 0.9 - thr * 3.1, sx = 2.4, sy = -13.4 + ty, hx = sx + Math.cos(a) * 6, hy = sy + Math.sin(a) * 6;
      limb(c, sx - 3.4, sy + 0.4, sx - 3.4 + 1.4, sy + 5.4, 2.2, k("#3a302c"));
      limb(c, sx, sy, hx, hy, 2.4, k(d.c)); circ(c, hx, hy, 1.2, k(d.skin));
      if (!(act && act.phase === "post" && act.a && act.a.k === "lob")) {
        const fc = act && act.a && act.a.proj === "e_phiole" ? "#ff8a3a" : "#6ae0a8";
        ell(c, hx + 0.6, hy - 1.8, 1.7, 2, k(fc)); limb(c, hx + 0.6, hy - 3.6, hx + 0.6, hy - 4.8, 0.9, k("#c8c0b0"));
        if (!lo()) glow(c, hx + 0.6, hy - 1.8, 5, fc === "#ff8a3a" ? "rgba(255,138,58,.5)" : "rgba(106,224,168,.5)");
      }
    };
    /* Buppido: kleiner, krummer Derro – bleich-graue Haut, wildes weißes Haar, Glubschaugen, breites Grinsen, zwei Dolche */
    SH.w49buppido = function (c, e, d, k, t, mv, ph) {
      const gig = e.w49gig > 0 ? e.w49gig : 0, mvx = e.mv, pre = mvx && mvx.stage === "pre";
      const bob = mv ? Math.abs(Math.sin(ph * 1.2)) * 1.4 : Math.sin(t * 3) * 0.4;
      c.save(); if (gig) c.rotate(Math.sin(t * 38) * 0.05);
      const st = mv ? Math.sin(ph * 1.2) * 2.6 : 0, ty = -bob, cr = pre ? 1.2 : 0;
      limb(c, -1.8, -8 + cr, -2.4 - st, -0.5, 2.4, k("#3a2626")); limb(c, 1.8, -8 + cr, 2.4 + st, -0.5, 2.4, k("#4a3030"));
      ell(c, -2.4 - st + 0.8, -0.4, 2, 0.9, k(d.skin)); ell(c, 2.4 + st + 0.8, -0.4, 2, 0.9, k(d.skin));
      /* zerlumptes Gewand mit Fransen */
      poly(c, [-5, -7 + ty + cr, 5.4, -7 + ty + cr, 4.6, -16 + ty + cr, -4.4, -16 + ty + cr], k(d.c));
      for (let i = 0; i < 5; i++) poly(c, [-5 + i * 2.1, -7 + ty + cr, -3.9 + i * 2.1, -4.4 + ty + cr + (i % 2), -2.9 + i * 2.1, -7 + ty + cr], k("#4a2020"));
      limb(c, -4.6, -10 + ty + cr, 5, -10.4 + ty + cr, 0.9, k("#2a1a14"));
      /* Knochenkette */
      for (let i = 0; i < 4; i++) circ(c, -2.4 + i * 1.7, -14.6 + ty + cr + Math.abs(i - 1.5) * 0.6, 0.6, k("#e8e0cc"));
      /* Kopf (groß, vorgebeugt) */
      c.save(); c.translate(1.4, -19.4 + ty + cr); c.rotate(0.12 + (pre ? 0.15 : 0));
      ell(c, 0, 0, 4.4, 4, k(d.skin));
      for (let i = 0; i < 7; i++) { const a = -Math.PI * 0.95 + i * 0.32, l = 3.4 + hash(i, 3) * 2.4 + Math.sin(t * 6 + i) * 0.4; limb(c, Math.cos(a) * 3.6, Math.sin(a) * 3.4, Math.cos(a) * (3.6 + l), Math.sin(a) * (3.4 + l), 1.1, k("#ece6dc")); }
      ell(c, 1.6, -0.8, 1.5, 1.6, k("#f4e8a0")); ell(c, -1.2, -0.6, 1.2, 1.3, k("#f4e8a0"));
      circ(c, 2, -0.6, 0.6, k("#2a1a10")); circ(c, -0.9, -0.4, 0.5, k("#2a1a10"));
      if (!lo()) { glow(c, 1.6, -0.8, 3, "rgba(255,230,140,.35)"); }
      const gr = gig ? 0.6 + Math.abs(Math.sin(t * 30)) * 0.5 : 0.4;
      poly(c, [-1.8, 1.8, 3.8, 1.4, 3, 2.4 + gr, -1, 2.6 + gr], k("#3a1414"));
      for (let i = 0; i < 4; i++) poly(c, [-1.2 + i * 1.2, 1.8, -0.6 + i * 1.2, 2.6, 0 + i * 1.2, 1.7], k("#f0eadc"));
      poly(c, [-4.2, -0.6, -6, -2.2, -4.4, 1.2], k(d.skin));
      c.restore();
      /* Arme mit Dolchen */
      const sw = mvx && mvx.stage === "act" ? Math.sin(t * 24) * 0.9 : pre ? -1.4 : Math.sin(t * 2.4) * 0.2;
      const sx = 2, sy = -14 + ty + cr;
      for (const side of [-1, 1]) {
        const a = (side > 0 ? 0.5 : 1.1) + sw * side, hx = sx + (side < 0 ? -3 : 0) + Math.cos(a) * 6, hy = sy + Math.sin(a) * 6;
        limb(c, sx + (side < 0 ? -3 : 0), sy, hx, hy, 1.8, k(side > 0 ? d.skin : "#a89aa4"));
        c.save(); c.translate(hx, hy); c.rotate(a - 1.9);
        limb(c, 0, 0, 0, -1.6, 1.4, k("#3a2a1a")); poly(c, [-0.9, -1.6, 0.9, -1.6, 0, -7.2], k("#d8d4cc"));
        c.restore();
      }
      c.restore();
    };
  }

  /* ======================= WÄCHTER: BUPPIDO ======================= */
  const B = Z.BOSSDEF, cxOf = K.cxOf, feet = K.feet, dmg = K.dmg, box = K.box, melee = K.melee;
  const say = (de, en) => Z.bossSay && Z.bossSay(L([de, en]));
  const giggle = (e, big) => { e.w49gig = big ? 1.2 : 0.6; if (FX.text) FX.text(cxOf(e), e.y - 10, L(R() < 0.5 ? ["Hihihi!", "Hee-hee-hee!"] : ["Hihi …", "Hee-hee…"]), "#e8d8f0"); };
  const later = (sec, fn) => (Z.bossLater ? Z.bossLater(fn, sec * 1000) : setTimeout(fn, sec * 1000));
  const aliveB = e => e && !e.dead && !Z.bossDefeated;
  const arenaB = () => K.arena();
  const groundAt = (x, y) => { const g = W.groundBelow ? W.groundBelow(x, y, 300) : null; return g != null ? g : y; };
  const traps = [];
  function trap(e, x) {
    const P = Z.player; if (!P) return;
    const y = groundAt(x, P.y + P.h - 6);
    const o = { x, y, t: 0, life: 9, snap: 0, e,
      upd(dt) {
        this.t += dt; if (this.snap > 0) { this.snap += dt; return this.snap < 0.6; }
        const Pl = Z.player;
        if (this.t > 0.6 && Pl && !Pl.dead && Math.abs(Pl.x + Pl.w / 2 - this.x) < 9 && Math.abs(Pl.y + Pl.h - this.y) < 6) {
          this.snap = 0.01; A.play("chain", { x: this.x, vol: 0.7, rate: 1.4 }); FX.addShake && FX.addShake(3);
          Z.hurtPlayer(dmg(this.e, 0.8), { x: this.x, kb: 0, kbUp: 120, attacker: this.e, eff: { bleed: 1 } });
          safe("falle", () => Z.addStatus && Z.addStatus(Pl, "root", 0.7, true));
          FX.text(this.x, this.y - 22, L(["Bärenfalle!", "Bear trap!"]), "#ffd27a");
        }
        return this.t < this.life && !Z.bossDefeated;
      },
      draw(c) {
        const k = Math.min(1, this.t / 0.4), cl = this.snap > 0, arm = this.t > 0.6;
        c.save(); c.globalAlpha = k * (this.t > this.life - 0.5 ? (this.life - this.t) * 2 : 1);
        c.fillStyle = "#3a3434"; c.fillRect(this.x - 7, this.y - 1.6, 14, 1.6);
        c.strokeStyle = arm ? "#c8c0b0" : "#8a827a"; c.lineWidth = 1.1; c.beginPath();
        for (let i = -3; i <= 3; i++) { const xx = this.x + i * 2; c.moveTo(xx, this.y - 1.6); c.lineTo(xx + (cl ? 0 : i * 0.3), this.y - (cl ? 6 : 4)); }
        c.stroke();
        if (!arm) { c.fillStyle = "rgba(255,90,40,.8)"; c.fillRect(this.x - 1, this.y - 7, 2, 2); }
        c.restore();
      } };
    if (BP && BP.addObj) { BP.addObj(o); traps.push(o); }
  }
  function riseSkel(e, x) {
    const a = arenaB(); x = U.clamp(x, a.x0 + 20, a.x1 - 20);
    const s = Z.spawnEnemy("leichenskelett", x, groundAt(x, a.floor - 40), { tier: e.tier, noRise: true });
    if (!s) return;
    s.master = e; s.aware = true; s.pile = 1.1; s.st.stun = 1.1; s.spawnT = 0;
    if (!lo()) FX.burst(x, groundAt(x, a.floor - 40) - 4, 10, { col: ["#d8d0bc", "#6af0b0"], sp: 60, life: 0.5, size: 2, kind: "smoke" });
  }
  B.buppido = Object.assign({ boss: true, poise: 99, heavy: true, sight: 999, atks: [], update: K.brain }, {
    n: ["Buppido", "Buppido"], title: ["Der kichernde Mörder von Gracklstugh", "The Giggling Murderer of Gracklstugh"], shape: "w49buppido",
    c: "#5a2a2a", t: "#d8d4cc", skin: "#b8a8b4", w: 12, h: 24, size: 1.15, hp: 34, dmg: 1.2, spd: 95, idleT: 0.5,
    intro: ["Zwischen den Leichenbergen kichert jemand. „Hihi … Besuch! Wollt ihr meinen Altar sehen?“", "Someone giggles between the mountains of dead. \"Hee-hee… visitors! Would you like to see my altar?\""],
    outro: ["Buppido erstarrt mitten im Kichern – Barradins Zauber hält ihn fest wie eine Statue. Hinter dem Altar flüstert ein Geist: „Bringt mich heim … nach Blingdenstone.“", "Buppido freezes mid-giggle – Barradin's spell holds him like a statue. Behind the altar a ghost whispers: \"Take me home… to Blingdenstone.\""],
    kunde: ["Er hat die Helden freundlich durch Gracklstugh geführt. Darunter hat er gesammelt: Tote, Arme, Ringe. Er kichert, wenn er zusticht.", "He kindly guided the heroes through Gracklstugh. Beneath it, he collected: the dead, arms, rings. He giggles when he stabs."],
    move: (e, P, dt) => { K.face(e, P); const want = P.x + P.w / 2 + (cxOf(e) < P.x ? -70 : 70); K.walkTo(e, dt, want, 95); if (e.w49gig > 0) e.w49gig -= dt; },
    moves: {
      dolchwurf: { name: ["Dolchfächer", "Dagger Fan"], pre: 0.55, dur: 0.4, post: 0.5, sfx: "swing", range: [40, 999],
        act: (e, P) => { const n = e.rage ? 5 : 3; for (let i = 0; i < n; i++) later(i * 0.09, () => { if (aliveB(e)) Z.aimProj("e_dolch", cxOf(e) + e.face * 6, e.y + 10, P.x + P.w / 2 + (i - (n - 1) / 2) * 30, P.y + P.h * 0.5, { dmg: dmg(e, 0.65), speed: 300 }); }); } },
      stich: { name: ["Huschen und Zustechen", "Scurry and Stab"], pre: 0.4, dur: 0.38, post: 0.6, sfx: "stab", range: [0, 150],
        start: (e) => { FX.text(cxOf(e), e.y - 12, L(["Er huscht los!", "He scurries!"]), "#ffd27a"); },
        act: (e, P, m) => { m.dir = e.face; },
        tick: (e, P, dt, m) => { e.vx = m.dir * 400; if (!m.hit) m.hit = melee(e, box(e, -4, -22, 28, 22), 1.05); if (e.hitWall) e.vx = 0; },
        end: (e) => { e.vx *= 0.2; if (R() < 0.6) giggle(e); } },
      falle: { name: ["Bärenfallen", "Bear Traps"], pre: 0.5, dur: 0.25, post: 0.45, sfx: "chain", w: 0.8,
        cond: () => traps.filter(o => o.t < o.life && !(o.snap > 0.5)).length < 4,
        act: (e, P) => { const n = e.rage ? 3 : 2, px = P.x + P.w / 2; for (let i = 0; i < n; i++) trap(e, px + (i - (n - 1) / 2) * 40 + (R() - 0.5) * 16); say("Hihi, pass auf, wo du hintrittst!", "Hee-hee, watch your step!"); } },
      kichern: { name: ["Kichern im Dunkeln", "Giggling in the Dark"], pre: 0.45, dur: 1.0, post: 0.6, sfx: "shadow",
        start: (e) => giggle(e, true),
        act: (e, P, m) => { e.hidden = 0.85; if (!lo()) FX.burst(cxOf(e), e.y + 12, 14, { col: ["#2a1a2a", "#b07aff"], sp: 70, life: 0.5, size: 3, kind: "smoke" }); },
        tick: (e, P, dt, m) => {
          e.vx = 0;
          if (m.t > 0.5 && !m.tp) { m.tp = true; const a = arenaB(); const nx = U.clamp(P.x + P.w / 2 - P.face * 30, a.x0 + 12, a.x1 - 12); e.x = nx - e.w / 2; e.y = P.y + P.h - e.h - 2; if (Z.unstick) Z.unstick(e); e.face = P.x + P.w / 2 > cxOf(e) ? 1 : -1; e.hidden = 0; FX.text(P.x + P.w / 2, P.y - 16, L(["Hinter dir!", "Behind you!"]), "#ff8a5a", true); }
          if (m.t > 0.82 && !m.hit) { m.hit = true; melee(e, box(e, -6, -22, 30, 22), 1.15); }
        } },
      altar: { name: ["Wollt ihr meinen Altar sehen?", "Would You Like to See My Altar?"], pre: 0.8, dur: 0.3, post: 0.6, sfx: "monster", w: 0.7,
        cond: e => Z.enemies.filter(o => o.master === e && !o.dead).length < 3,
        act: (e, P) => { say("Meine Freunde wollen ihn auch sehen! Steht auf, steht auf!", "My friends want to see it too! Get up, get up!"); const n = Math.min(e.rage ? 3 : 2, 4 - Z.enemies.filter(o => o.master === e && !o.dead).length); for (let i = 0; i < n; i++) riseSkel(e, P.x + P.w / 2 + (i % 2 ? 1 : -1) * (60 + i * 30)); giggle(e, true); } },
      wirbel: { name: ["Messerwirbel", "Knife Whirl"], pre: 0.6, dur: 1.2, post: 0.75, sfx: "slash", range: [0, 200],
        start: (e) => FX.text(cxOf(e), e.y - 12, L(["Drei Stiche – rollen!", "Three stabs – roll!"]), "#ffd27a", true),
        tick: (e, P, dt, m) => { const k = Math.floor(m.t / 0.4); if (k !== m.k) { m.k = k; m.hit = false; e.face = P.x + P.w / 2 > cxOf(e) ? 1 : -1; m.dir = e.face; } const ph = m.t - k * 0.4; e.vx = ph < 0.22 ? m.dir * 380 : 0; if (ph < 0.22 && !m.hit) m.hit = melee(e, box(e, -4, -22, 28, 22), 0.85); } }
    },
    phases: [
      { at: 1, name: ["Der freundliche Führer", "The Friendly Guide"], moves: ["dolchwurf", "stich", "falle"] },
      { at: 0.66, name: ["Wollt ihr meinen Altar sehen?", "Would You Like to See My Altar?"], quote: ["„Hihihi! Alle wollen meinen Altar sehen. Keiner geht wieder!“", "\"Hee-hee-hee! Everyone wants to see my altar. Nobody leaves!\""], aura: "#b07aff", tempo: 1.12,
        moves: ["dolchwurf", "stich", "falle", "kichern", "altar"], enter: e => { e.nextMv = "altar"; } },
      { at: 0.33, name: ["Kichern im Dunkeln", "Giggling in the Dark"], quote: ["„Nicht weglaufen! Ich hab doch noch so viele Messer!“", "\"Don't run! I still have so many knives!\""], aura: "#6af0b0", tempo: 1.28,
        moves: ["dolchwurf", "stich", "falle", "kichern", "altar", "wirbel"], enter: e => { e.rage = true; e.nextMv = "wirbel"; } }
    ]
  });
  /* Phasenmaschine aus bossphasen.js (Phasennamen, Zitate, Übergänge) – wie bei den übrigen Wächtern */
  if (BP && BP.phased) { B.buppido.update = BP.phased; B.buppido.phx = true; }

  /* ======================= GENERATOR: niedrige Gänge ======================= */
  /* Kriechgang eine Kachel hoch durch massiven Fels, am Ende eine Nische (4×3) mit Beute; nur durch Schrumpfen erreichbar. */
  function carve(lv, seed) {
    const g = lv.get, out = [], Wd = lv.W, Hd = lv.H, LEN = 6;
    const solid = (x, y) => x > 1 && y > 1 && x < Wd - 2 && y < Hd - 2 && g(x, y) === 1;
    const cand = [];
    for (const key in lv.cells) {
      const c = lv.cells[key]; if (c === lv.startCell || (lv.warden && lv.warden.cell === c)) continue;
      for (let y = c.y * Z.CH + 2; y < c.y * Z.CH + Z.CH - 1; y++) for (let x = c.x * Z.CW + 1; x < c.x * Z.CW + Z.CW - 1; x++) {
        if (g(x, y) !== 0 || g(x, y - 1) !== 0 || g(x, y + 1) !== 1) continue;
        for (const d of [-1, 1]) {
          let ok = true;
          for (let i = 1; i <= LEN + 5 && ok; i++) { const xx = x + d * i; const y0 = i <= LEN ? y - 1 : y - 3; for (let yy = y0; yy <= y + 1 && ok; yy++) if (!solid(xx, yy)) ok = false; }
          if (ok) cand.push({ x, y, d, h: hash(x * 7 + seed, y * 13) });
        }
      }
    }
    cand.sort((a, b) => a.h - b.h);
    for (const c of cand) {
      if (out.length >= 2) break;
      if (out.some(o => Math.abs(o.x - c.x) < 30 && Math.abs(o.y - c.y) < 16)) continue;
      let ok = true; for (let i = 1; i <= LEN + 5 && ok; i++) { const xx = c.x + c.d * i; const y0 = i <= LEN ? c.y - 1 : c.y - 3; for (let yy = y0; yy <= c.y + 1 && ok; yy++) if (g(xx, yy) !== 1) ok = false; }
      if (!ok) continue;
      for (let i = 1; i <= LEN; i++) lv.set(c.x + c.d * i, c.y, 0);
      for (let i = LEN + 1; i <= LEN + 4; i++) for (let yy = c.y - 2; yy <= c.y; yy++) lv.set(c.x + c.d * i, yy, 0);
      out.push({ x: c.x, y: c.y, d: c.d, len: LEN, px: c.x + c.d * (LEN + 2.5), got: false, hint: false });
    }
    return out;
  }
  const gl0 = Z.genLevel;
  if (gl0) Z.genLevel = function (id, seed) {
    const lv = gl0.apply(this, arguments);
    safe("gen", () => { if (lv && (id === "stollen" || lv.biome === "stollen") && lv.cells && lv.get && lv.set) lv.w49tun = carve(lv, (seed >>> 0) % 9973); });
    return lv;
  };

  /* ======================= AUFBAU JE EBENE ======================= */
  const H0 = Z.PC ? Z.PC.H : 28, HC0 = Z.PC ? Z.PC.HC : 17, HS = 13, HCS = 10;
  let S = null; /* { lv, shrooms, veins, piles, caps, altar, ghost, said } */
  function spots(lv, Rr, n, minD, pred) {
    const out = [], keys = Object.keys(lv.cells);
    for (let tries = 0; tries < n * 60 && out.length < n; tries++) {
      const c = lv.cells[keys[Math.floor(Rr() * keys.length)]]; if (!c) continue;
      const x = c.x * Z.CW + 2 + Math.floor(Rr() * (Z.CW - 4)), y = c.y * Z.CH + 2 + Math.floor(Rr() * (Z.CH - 3));
      if (!Z.standable(lv, x, y, 2)) continue;
      if (pred && !pred(x, y, c)) continue;
      if (out.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < minD)) continue;
      out.push({ x, y, c });
    }
    return out;
  }
  function setup(lv) {
    S = null;
    if (!lv || !inStollen() || !lv.cells || !lv.get) return;
    const Rr = Z.Rng(((lv.seed || 7) * 48271 + 49) >>> 0), g = lv.get;
    S = { lv, shrooms: [], veins: [], piles: [], caps: [], altar: null, ghost: null, said: {}, boss: false };
    const st = lv.start || { x: 0, y: 0 };
    const farStart = (x, y) => Math.abs(x - st.x) + Math.abs(y - st.y) > 10;
    for (const s of spots(lv, Rr, 4, 22, farStart)) S.shrooms.push({ x: s.x * T + 8, y: (s.y + 1) * T, m: KLEIN, cd: 0 });
    for (const s of spots(lv, Rr, 3, 22, farStart)) S.shrooms.push({ x: s.x * T + 8, y: (s.y + 1) * T, m: GROSS, cd: 0 });
    /* zu jedem niedrigen Gang ein Schrumpfpilz in der Nähe */
    for (const tn of lv.w49tun || []) {
      let best = null;
      for (let i = 3; i < 16 && !best; i++) { const x = tn.x - tn.d * i; if (Z.standable(lv, x, tn.y, 2)) best = x; }
      if (best == null) best = tn.x;
      S.shrooms.push({ x: best * T + 8, y: (tn.y + 1) * T, m: KLEIN, cd: 0, tun: true });
      /* und einer in der Nische, damit man wieder hinauskommt */
      S.shrooms.push({ x: (tn.px + tn.d * 1.2) * T, y: (tn.y + 1) * T, m: KLEIN, cd: 0, tun: true });
    }
    /* Kulisse: Erzadern an Felskanten, Glühpilze, Leichenberge */
    for (const key in lv.cells) {
      const c = lv.cells[key], x0 = c.x * Z.CW, y0 = c.y * Z.CH;
      for (let y = y0; y < y0 + Z.CH; y++) for (let x = x0; x < x0 + Z.CW; x++) {
        const v = g(x, y), h = hash(x, y);
        if (v === 1 && (g(x - 1, y) === 0 || g(x + 1, y) === 0 || g(x, y + 1) === 0) && h < 0.085 && S.veins.length < 420) S.veins.push({ x, y, k: h < 0.05 ? 0 : h < 0.07 ? 1 : 2, a: hash(y, x) * TAU, l: 5 + hash(x + 3, y) * 9, s: hash(x, y + 5) });
        if (Z.standable(lv, x, y, 2) && h > 0.94 && S.caps.length < 200) S.caps.push({ x: x * T + 3 + hash(x, 9) * 10, y: (y + 1) * T, n: 2 + Math.floor(hash(y, 9) * 3), v: hash(x, y + 2) < 0.6 ? 0 : 1 });
      }
    }
    for (const s of spots(lv, Rr, 9, 14, (x, y, c) => farStart(x, y) && Z.standable(lv, x - 1, y, 2) && Z.standable(lv, x + 1, y, 2) && !(lv.warden && lv.warden.cell === c))) S.piles.push({ x: s.x * T + 8, y: (s.y + 1) * T, w: 34 + Rr() * 18, s: Rr() });
    /* Buppidos Altar im Wächterraum */
    if (lv.warden && lv.warden.cell) {
      const wc = lv.warden.cell, sp = spots({ cells: { a: wc }, get: g }, Rr, 1, 0, (x, y) => Z.standable(lv, x - 1, y, 2) && Z.standable(lv, x + 1, y, 2));
      const p = sp[0] || spots(lv, Rr, 1, 0)[0];
      if (p) S.altar = { x: p.x * T + 8, y: (p.y + 1) * T };
    }
  }
  /* Leichenskelette schlafen als Knochenhaufen, bis jemand nahe kommt */
  const se0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    const e = se0.apply(this, arguments);
    safe("spawn", () => { if (e && e.def && e.def.w49rise && !(o && o.noRise) && inStollen() && !gast()) { e.w49dorm = true; e.pile = 999; e.st.stun = 999; e.spawnT = 0; } });
    return e;
  };
  function wake(e, quiet) {
    e.w49dorm = false; e.pile = 1.1; e.st.stun = 1.1; e.aware = true;
    if (!lo()) FX.burst(e.x + e.w / 2, e.y + e.h - 3, 8, { col: ["#d8d0bc", "#8a7a6a"], sp: 50, life: 0.4, size: 1.6, kind: "dot" });
    A.play("shadow", { x: e.x, vol: 0.35, rate: 0.7 });
    if (!quiet && S && !S.said.rise) { S.said.rise = true; FX.text(e.x + e.w / 2, e.y - 14, L(["Die Toten erheben sich!", "The dead are rising!"]), "#e8e0cc", true); }
  }

  /* ======================= SCHRUMPFEN UND WACHSEN ======================= */
  const PC = Z.PC;
  const bodyFree = (x, y, w, h) => { for (let ty = Math.floor(y / T); ty <= Math.floor((y + h - 0.5) / T); ty++) for (let tx = Math.floor((x + 0.5) / T); tx <= Math.floor((x + w - 0.5) / T); tx++) if (W.solidT(W.tile(tx, ty))) return false; return true; };
  function setSmall(P, on) {
    if (!PC) return;
    if (on) { if (P.h > HS) { P.y += P.h - HS; P.h = HS; } P.crouch = false; return true; }
    if (P.h < H0 && !bodyFree(P.x, P.y + P.h - H0, P.w, H0)) return false;
    if (P.h !== H0) { P.y += P.h - H0; P.h = H0; } P.crouch = false; return true;
  }
  function reset(P) { if (PC) { PC.H = H0; PC.HC = HC0; } if (P) { if (P.h < H0 && P.w49sz && P.w49sz.k === "klein") { P.y += P.h - H0; P.h = H0; } P.w49sz = null; } }
  function eat(P, s) {
    if (P.shadowForm) return;
    const m = s.m;
    if (m.k === "klein") { if (!(P.w49sz && P.w49sz.k === "klein")) setSmall(P, true); }
    else if (P.w49sz && P.w49sz.k === "klein") { if (!setSmall(P, false)) return; }
    s.cd = 20;
    P.w49sz = { k: m.k, t: 12, max: 12 };
    A.play("gem", { x: s.x, vol: 0.6, rate: m.k === "klein" ? 1.6 : 0.7 }); A.play("magic", { x: s.x, vol: 0.4, rate: m.k === "klein" ? 1.4 : 0.8 });
    if (!lo()) FX.burst(s.x, s.y - 6, 18, { col: [m.col, "#fff0d8"], sp: 90, life: 0.6, size: 2, kind: "spark", add: true });
    FX.text(P.x + P.w / 2, P.y - 14, L(m.k === "klein" ? ["Klein wie ein Daumen!", "Small as a thumb!"] : ["Groß wie ein Oger!", "Big as an ogre!"]), m.col, true);
    if (Z.meta && !(Z.meta.w49pilz || {})[m.k]) {
      Z.meta.w49pilz = Z.meta.w49pilz || {}; Z.meta.w49pilz[m.k] = 1; if (Z.saveMeta) Z.saveMeta();
      if (Z.ui && Z.ui.notify) Z.ui.notify("<b>" + esc(L(m.n)) + "</b><br><small>" + esc(L(m.k === "klein" ? ["12 Sekunden klein: durch niedrige Gänge kriechen, schwerer zu treffen – du nimmst und verteilst weniger Schaden.", "Small for 12 seconds: crawl through low passages, harder to hit – you take and deal less damage."] : ["12 Sekunden groß: mehr Schaden, kein Rückstoß – aber du bist auch ein größeres Ziel.", "Big for 12 seconds: more damage, no knockback – but you are a bigger target too."])) + "</small>", { prio: 2, art: "gold", icon: "🍄", dauer: 4200 });
    }
  }
  function tickSize(P, dt) {
    const z = P.w49sz; if (!z) return;
    z.t -= dt;
    if (z.t <= 0) {
      if (z.k === "klein") { if (!setSmall(P, false)) { z.t = 0.25; if (S && !S.said.eng) { S.said.eng = true; FX.text(P.x + P.w / 2, P.y - 12, L(["Zu eng zum Wachsen!", "Too tight to grow!"]), "#e8d8f0"); } return; } }
      P.w49sz = null; A.play("magic", { vol: 0.35, rate: 1 });
    }
  }
  const hit0 = Z.hitEnemy;
  if (hit0) Z.hitEnemy = function (e, d, o) {
    const P = Z.player, z = P && P.w49sz;
    if (z && typeof d === "number" && d > 0 && !(o && o.dot) && e && !(e.def && e.def.dummy)) d *= z.k === "klein" ? 0.65 : 1.5;
    return hit0.call(this, e, d, o);
  };
  const hurt0 = Z.hurtPlayer;
  if (hurt0) Z.hurtPlayer = function (d, o) {
    const P = Z.player, z = P && P.w49sz;
    if (z && typeof d === "number" && d > 0 && !(o && o.force)) {
      d *= z.k === "klein" ? 0.6 : 1.15;
      if (z.k === "gross") o = Object.assign({}, o || {}, { kb: 0, kbUp: 0 });
    }
    return hurt0.call(this, d, o);
  };
  const dp0 = Z.drawPlayer;
  if (dp0) Z.drawPlayer = function (c, P, time) {
    const z = P && P === Z.player && P.w49sz;
    if (!z) return dp0.apply(this, arguments);
    const s = z.k === "klein" ? HS / H0 : 1.3, cx = P.x + P.w / 2, fy = P.y + P.h;
    let r;
    if (z.k === "klein") { /* die Figur zeichnet sich in voller Höhe über den Füßen – vorübergehend volle Höhe, dann verkleinert */
      const h = P.h, y = P.y, cr = P.crouch; P.y = fy - (cr ? HC0 : H0); P.h = cr ? HC0 : H0;
      c.save(); c.translate(cx, fy); c.scale(s, s); c.translate(-cx, -fy);
      try { r = dp0.apply(this, arguments); } finally { c.restore(); P.h = h; P.y = y; }
    } else { c.save(); c.translate(cx, fy); c.scale(s, s); c.translate(-cx, -fy); try { r = dp0.apply(this, arguments); } finally { c.restore(); } }
    return r;
  };

  /* ======================= JE BILD ======================= */
  /* Die Körpermaße (Z.PC.H/HC, für Ducken und Aufstehen) gelten nur während der Bewegung des geschrumpften Helden –
     Spieler 2 im Koop und alles andere sieht die normalen Werte. */
  const up0 = Z.updatePlayer;
  if (up0) Z.updatePlayer = function (P, dt) {
    const small = !!(PC && P && P.w49sz && P.w49sz.k === "klein");
    if (small) { PC.H = HS; PC.HC = HCS; }
    let r;
    try { r = up0.apply(this, arguments); } finally { if (small) { PC.H = H0; PC.HC = HC0; } }
    if (P && P === Z.player) safe("tick", () => tick(P, dt));
    return r;
  };
  function tick(P, dt) {
    if (P.dead) { if (P.w49sz) reset(P); return; }
    tickSize(P, dt);
    /* hat etwas anderes (Rücksetzen nach Sturz o. Ä.) die volle Höhe gesetzt, bleibt der Held trotzdem klein */
    if (P.w49sz && P.w49sz.k === "klein" && P.h > HS && !P.shadowForm) { P.y += P.h - HS; P.h = HS; P.crouch = false; }
    if (!S || S.lv !== Z.level || gast()) return;
    const px = P.x + P.w / 2, py = P.y + P.h;
    for (const s of S.shrooms) {
      if (s.cd > 0) { s.cd -= dt; continue; }
      if (Math.abs(px - s.x) < 10 && Math.abs(py - s.y) < 10) eat(P, s);
    }
    for (const e of Z.enemies) {
      if (!e.w49dorm || e.dead) continue;
      const dx = Math.abs(e.x + e.w / 2 - px), dy = Math.abs(e.y + e.h - py);
      if ((dx < 110 && dy < 60) || e.hp < e.hpMax) wake(e); else { e.pile = 999; e.st.stun = 999; }
    }
    for (const tn of S.lv.w49tun || []) {
      const mx = (tn.x + tn.d * 0.5) * T + 8, my = (tn.y + 1) * T;
      if (!tn.hint && Math.abs(px - mx) < 40 && Math.abs(py - my) < 20 && !(P.w49sz && P.w49sz.k === "klein")) { tn.hint = true; FX.text(mx, my - 30, L(["Zu niedrig – ein Schrumpfpilz hilft!", "Too low – a shrinking mushroom helps!"]), "#e0c8ff", true); }
      if (!tn.got && Math.abs(px - tn.px * T) < 26 && Math.abs(py - my) < 30) {
        tn.got = true; A.play("chest", { vol: 0.6 });
        safe("beute", () => { Z.spawnReward("glut", tn.px * T, my, { n: 3, drop: true }); if (R() < 0.5) Z.spawnReward("rolle", tn.px * T, my, { drop: true }); else Z.spawnReward("heil", tn.px * T, my, { drop: true }); if (Z.dropGold) Z.dropGold(tn.px * T, my - 8, 25); });
        FX.text(tn.px * T, my - 24, L(["Eine versteckte Nische!", "A hidden niche!"]), "#ffd27a", true);
      }
    }
    if (Z.boss && Z.boss.id === "buppido") S.boss = Z.boss;
    if (S.boss && (Z.bossDefeated || S.boss.dead) && !S.ghost && S.altar) {
      S.ghost = { t: 0 }; later(1.6, () => { if (Z.ui && Z.ui.notify) Z.ui.notify("<b>" + esc(L(["Der Geist eines Tiefengnoms", "The ghost of a deep gnome"])) + "</b><br><small>" + esc(L(["„Mein Arm … mein Ring … Bringt mich heim. Nach Blingdenstone.“", "\"My arm… my ring… Take me home. To Blingdenstone.\""])) + "</small>", { prio: 2, art: "gold", icon: "👻", dauer: 5200 }); });
    }
    if (S.ghost) {
      const G = S.ghost; G.t += dt;
      /* der Geist flüstert (als schwebender Text über allem, höchstens dreimal, nur wenn man in der Nähe ist) */
      if (G.t > (G.next || 1) && (G.n || 0) < 3 && Math.abs(px - S.altar.x) < 260 && Math.abs(py - S.altar.y) < 160) { G.n = (G.n || 0) + 1; G.next = G.t + 4.5; FX.text(S.altar.x, S.altar.y - 54, L(["„Bringt mich heim.“", "\"Take me home.\""]), "#c8f0d0", true); }
    }
  }
  const la0 = Z.loadArea;
  Z.loadArea = function () {
    safe("reset", () => reset(Z.player));
    traps.length = 0;
    const r = la0.apply(this, arguments);
    safe("setup", () => setup(Z.level));
    return r;
  };

  /* ======================= ZEICHNEN ======================= */
  function onScreen(x, y, m) { const c = Z.cam; if (!c) return true; return x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m; }
  function drawVein(c, v, t, low) {
    const x = v.x * T, y = v.y * T, col = ERZ[v.k], g = ERZG[v.k];
    const pulse = 0.55 + 0.45 * Math.sin(t * (0.8 + v.s) + v.s * 9);
    const cx = x + 8, cy = y + 8, dx = Math.cos(v.a), dy = Math.sin(v.a), l = v.l * 0.5;
    c.strokeStyle = col; c.globalAlpha = 0.6 + pulse * 0.35; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx - dx * l, cy - dy * l); c.lineTo(cx - dx * l * 0.3 + dy * 2.2, cy - dy * l * 0.3 - dx * 2.2); c.lineTo(cx + dx * l * 0.3 - dy * 1.6, cy + dy * l * 0.3 + dx * 1.6); c.lineTo(cx + dx * l, cy + dy * l); c.stroke();
    c.fillStyle = col; c.fillRect(cx - 1.2, cy - 1.2, 2.4, 2.4); c.fillRect(cx + dx * l * 0.7 - 0.7, cy + dy * l * 0.7 - 0.7, 1.4, 1.4); c.fillRect(cx - dx * l * 0.6 + dy * 2 - 0.6, cy - dy * l * 0.6 - dx * 2 - 0.6, 1.2, 1.2);
    c.globalAlpha = 1;
    if (!low) glow(c, cx, cy, 9 + pulse * 4, g + (0.16 + pulse * 0.12).toFixed(2) + ")");
  }
  function drawCaps(c, p, t, low) {
    for (let i = 0; i < p.n; i++) {
      const x = p.x + i * 3.4 - p.n * 1.4, h = 2.4 + hash(i, p.x | 0) * 3, col = p.v ? "#b07aff" : "#8af0a0";
      c.fillStyle = "#c8c0b0"; c.fillRect(x - 0.4, p.y - h, 0.8, h);
      ell(c, x, p.y - h, 1.8, 1, col);
      if (!low) glow(c, x, p.y - h, 6, p.v ? "rgba(176,122,255,.32)" : "rgba(138,240,160,.32)", 0.7 + 0.3 * Math.sin(t * 2 + i + p.x));
    }
  }
  function drawPile(c, p, t) {
    const x = p.x, y = p.y, w = p.w;
    c.fillStyle = "#2e2628"; c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x - w * 0.3, y - 13, x, y - 15 - p.s * 4); c.quadraticCurveTo(x + w * 0.3, y - 12, x + w / 2, y); c.closePath(); c.fill();
    const rag = ["#5a4a40", "#4a4038", "#6a4e3c", "#463a3a"];
    for (let i = 0; i < 7; i++) { const a = hash(i, x | 0), bx = x - w * 0.38 + a * w * 0.76, by = y - 3 - hash(x | 0, i) * 9; ell(c, bx, by, 4 + a * 3, 2.2, rag[i % 4], (a - 0.5) * 0.8); }
    for (let i = 0; i < 4; i++) { const a = hash(i + 7, x | 0), bx = x - w * 0.3 + a * w * 0.6, by = y - 5 - hash(x | 0, i + 3) * 8; circ(c, bx, by, 1.9, "#d8d0bc"); c.fillStyle = "#1a1414"; c.fillRect(bx - 1, by - 0.4, 0.8, 0.8); c.fillRect(bx + 0.3, by - 0.4, 0.8, 0.8); }
    c.strokeStyle = "#cfc6b0"; c.lineWidth = 1;
    for (let i = 0; i < 3; i++) { const a = hash(i + 11, x | 0), bx = x - w * 0.3 + a * w * 0.6, by = y - 6 - a * 6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (a - 0.5) * 10, by - 5 - a * 4); c.stroke(); }
  }
  function drawAltar(c, a, t, low) {
    const x = a.x, y = a.y;
    c.fillStyle = "#2a2226"; c.fillRect(x - 16, y - 12, 32, 12); c.fillStyle = "#3a3036"; c.fillRect(x - 18, y - 14, 36, 3);
    c.fillStyle = "#4a1e1e"; c.fillRect(x - 12, y - 11, 24, 2);
    /* abgetrennter Arm mit Ring */
    c.strokeStyle = "#a89a9e"; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 9, y - 15.5); c.lineTo(x + 5, y - 16.5); c.stroke();
    circ(c, x + 6.5, y - 16.6, 1.6, "#a89a9e"); circ(c, x + 4.4, y - 16.4, 0.9, "#ffd27a");
    if (!low) glow(c, x + 4.4, y - 16.4, 6, "rgba(255,210,122,.45)", 0.6 + 0.4 * Math.sin(t * 3));
    for (const s of [-1, 1]) { const cx = x + s * 14; c.fillStyle = "#e8dcc0"; c.fillRect(cx - 1, y - 20, 2, 6); circ(c, cx, y - 21.4 - Math.sin(t * 9 + s) * 0.4, 1.3, "#ffb04a"); circ(c, cx, y - 21, 0.6, "#fff0c8"); if (!low) glow(c, cx, y - 21, 7, "rgba(255,176,74,.45)"); }
    if (S.ghost) {
      const k = Math.min(1, S.ghost.t / 1.5), gx = x + Math.sin(S.ghost.t * 1.3) * 6, gy = y - 34 - Math.sin(S.ghost.t * 2) * 3;
      c.save(); c.globalAlpha = 0.55 * k;
      ell(c, gx, gy, 5, 7, "#c8f0d0"); poly(c, [gx - 5, gy + 2, gx + 5, gy + 2, gx + 3, gy + 14, gx, gy + 10, gx - 3, gy + 14], "#b8e8c4");
      circ(c, gx - 1.8, gy - 1.6, 0.9, "#1a2a20"); circ(c, gx + 1.8, gy - 1.6, 0.9, "#1a2a20"); ell(c, gx, gy - 7, 3, 1.4, "#a8d8b4");
      if (!low) glow(c, gx, gy, 20, "rgba(170,240,190,.35)");
      c.restore();
    }
  }
  function drawShroom(c, s, t, low) {
    const m = s.m, k = s.cd > 0 ? (s.cd > 18 ? 0 : 0.25) : 1, big = m.k === "gross";
    const x = s.x, y = s.y, bob = Math.sin(t * 2.4 + x) * 0.6, h = big ? 9 : 7, r = big ? 6 : 5;
    c.save(); c.globalAlpha = k;
    c.fillStyle = "#e8dcc8"; c.fillRect(x - 1.2, y - h, 2.4, h);
    c.fillStyle = m.cap; c.beginPath(); c.ellipse(x, y - h + bob, r, r * 0.7, 0, Math.PI, 0); c.fill();
    c.fillStyle = m.col; for (let i = 0; i < 3; i++) circ(c, x - r * 0.5 + i * r * 0.5, y - h - r * 0.35 + bob, 0.9, m.col);
    c.restore();
    if (!low && s.cd <= 0) { glow(c, x, y - h, 14, m.glow + "0.42)", 0.7 + 0.3 * Math.sin(t * 3 + x)); if (Math.random() < 0.06) FX.p({ x: x + (Math.random() - 0.5) * 8, y: y - h, vx: 0, vy: -14, life: 0.9, size: 1.2, col: m.col, kind: "glow", add: true }); }
  }
  function drawTunnels(c, lv, t, low) {
    for (const tn of lv.w49tun || []) {
      const mx = (tn.x + tn.d * 1) * T + (tn.d > 0 ? 0 : T), my = (tn.y + 1) * T;
      if (!onScreen(mx, my, 120)) continue;
      c.fillStyle = "#5a4430"; c.fillRect(mx - 1.5, my - T - 2, 3, T + 2); c.fillRect(mx - 5, my - T - 3, 10, 2.4);
      c.fillStyle = "rgba(10,6,12,.55)"; c.fillRect(Math.min(mx, mx + tn.d * tn.len * T), my - T, tn.len * T, T);
      if (!low) for (let i = 0; i < 3; i++) glow(c, mx + tn.d * (i + 1) * 20, my - 8, 5, "rgba(138,240,160,.35)", 0.5 + 0.5 * Math.sin(t * 3 + i));
      if (!tn.got) { const nx = tn.px * T, ny = my - 8; c.fillStyle = "#6a4a26"; c.fillRect(nx - 6, ny - 2, 12, 8); c.fillStyle = "#ffd27a"; c.fillRect(nx - 1, ny + 1, 2, 2); if (!low) glow(c, nx, ny, 12, "rgba(255,210,122,.35)"); }
    }
  }
  function drawSizeRing(c, P, t) {
    const z = P.w49sz; if (!z || P.dead) return;
    const m = z.k === "klein" ? KLEIN : GROSS, cx = P.x + P.w / 2, top = P.y - (z.k === "klein" ? 6 : 14);
    c.save(); c.strokeStyle = m.col; c.lineWidth = 1.4; c.globalAlpha = 0.85; c.beginPath(); c.arc(cx, top, 3.2, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, z.t / z.max)); c.stroke(); c.restore();
  }
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    const r = wp0 ? wp0.apply(this, arguments) : undefined;
    safe("draw", () => {
      if (!S || S.lv !== Z.level) { if (Z.player && Z.player.w49sz) drawSizeRing(c, Z.player, t); return; }
      const low = lo();
      c.save();
      for (const v of S.veins) if (onScreen(v.x * T, v.y * T, 30)) drawVein(c, v, t, low);
      for (const p of S.piles) if (onScreen(p.x, p.y, 60)) drawPile(c, p, t);
      for (const p of S.caps) if (onScreen(p.x, p.y, 30)) drawCaps(c, p, t, low);
      if (S.altar && onScreen(S.altar.x, S.altar.y, 80)) drawAltar(c, S.altar, t, low);
      drawTunnels(c, S.lv, t, low);
      for (const s of S.shrooms) if (onScreen(s.x, s.y, 40)) drawShroom(c, s, t, low);
      c.restore();
      if (Z.player) drawSizeRing(c, Z.player, t);
    });
    return r;
  };

  /* ======================= FUNDBUCH: Kunde ======================= */
  function wireCodex() {
    const ui = Z.ui; if (!ui || !ui.codex) return setTimeout(wireCodex, 120);
    if (ui.codex._w49) return;
    const c0 = ui.codex;
    ui.codex = function () {
      const r = c0.apply(this, arguments);
      safe("codex", () => {
        const M = Z.meta || {};
        document.querySelectorAll('#modal .ico.vieh[data-gegner], #modal .ico.vieh[data-boss]').forEach(el => {
          const id = el.dataset.gegner || el.dataset.boss, d = el.dataset.boss ? Z.BOSSDEF[id] : Z.ENEMIES[id];
          if (!d || !d.kunde || el.dataset.k !== "1") return;
          const box2 = el.parentNode && el.parentNode.querySelector("div"); if (!box2 || box2.querySelector(".w49-kunde")) return;
          box2.insertAdjacentHTML("beforeend", '<small class="w49-kunde">' + esc(L(d.kunde)) + "</small>");
        });
        void M;
      });
      return r;
    };
    ui.codex._w49 = true;
  }
  wireCodex();
  const css = document.createElement("style");
  css.textContent = "small.w49-kunde{display:block;color:#d8c8e0;font-style:italic;opacity:.92;margin-top:2px}";
  document.head.appendChild(css);

  Z.stollen49 = {
    state: () => S,
    eat: k => { const P = Z.player; if (P) eat(P, { x: P.x + P.w / 2, y: P.y + P.h, m: k === "gross" ? GROSS : KLEIN, cd: 0 }); return P && P.w49sz; },
    reset: () => reset(Z.player),
    tunnels: () => (Z.level && Z.level.w49tun) || [],
    wake: () => { for (const e of Z.enemies) if (e.w49dorm) wake(e, true); }
  };
})();
