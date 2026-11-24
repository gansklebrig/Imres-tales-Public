/* Ezekiel – The Destroyer · Gegner
   Jeder Gegner hat eigene Angriffe mit Ausholen (Vorwarnung), Treffer und Erholung. Datengetrieben, Verhalten über "ai". */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  /* Klang (klang.js): eigene Stimmen der W10-Arten; true = ersetzt den Standardklang */
  const KG = (e, ev, a) => !!(Z.klang && Z.klang.gegner && Z.klang.gegner(e, ev, a));
  Z.enemies = [];
  const HP = 30, DMG = 10;

  /* Angriffsarten: hit, lunge, shoot, lob, leap, slam, charge, summon, teleport, mark, explode, grab, spray, dive, beam, web, heal, shield, pull, volley */
  const E = (Z.ENEMIES = {
    /* ---------------- Goblins ---------------- */
    goblin: { n: ["Goblin", "Goblin"], shape: "goblin", c: "#6f9a3a", t: "#5a3a22", w: 10, h: 16, hp: 1, dmg: 0.9, spd: 95, ai: "skirmish", sight: 170, gold: 4, snd: "goblin",
      atks: [{ k: "lunge", r: [0, 34], pre: 0.32, act: 0.12, post: 0.3, cd: 0.6, box: [0, -14, 20, 12], lunge: 220, sfx: "stab" },
             { k: "hit", r: [0, 22], pre: 0.22, act: 0.08, post: 0.25, cd: 0.5, box: [0, -14, 16, 12], sfx: "swing", w: 0.6 }] },
    goblinBogen: { n: ["Goblin-Bogenschütze", "Goblin Archer"], shape: "goblin", c: "#86a24a", t: "#3e4a22", bow: 1, w: 10, h: 16, hp: 0.75, dmg: 0.8, spd: 80, ai: "ranged", keep: [90, 190], sight: 240, gold: 5, snd: "goblin",
      atks: [{ k: "shoot", proj: "e_pfeil", r: [40, 240], pre: 0.55, act: 0.05, post: 0.35, cd: 1.1, sfx: "bow", aimLine: true },
             { k: "shoot", proj: "e_pfeil", n: 3, gap: 0.12, r: [60, 220], pre: 0.7, act: 0.3, post: 0.5, cd: 2.2, sfx: "bow", w: 0.4, aimLine: true }] },
    goblinSchlaeger: { n: ["Goblin-Schläger", "Goblin Brute"], shape: "goblin", c: "#527d2c", t: "#2a2014", club: 1, size: 1.45, w: 15, h: 22, hp: 3.2, dmg: 1.6, spd: 60, ai: "walker", heavy: true, poise: 0.3, sight: 170, gold: 10, snd: "goblin",
      atks: [{ k: "slam", r: [0, 38], pre: 0.7, act: 0.12, post: 0.55, cd: 0.9, box: [-4, -30, 40, 30], armor: true, wave: true, sfx: "swingHeavy", hitSfx: "hitHeavy", glyph: "!!" },
             { k: "hit", r: [0, 30], pre: 0.45, act: 0.1, post: 0.4, cd: 0.6, box: [0, -26, 32, 24], armor: true, sfx: "swingHeavy", w: 0.8 }] },
    goblinBombe: { n: ["Goblin-Bombenleger", "Goblin Bomber"], shape: "goblin", c: "#7a8a3a", t: "#6a3a2a", bomb: 1, w: 10, h: 16, hp: 0.8, dmg: 1.3, spd: 85, ai: "ranged", keep: [80, 170], sight: 220, gold: 6, snd: "goblin",
      atks: [{ k: "lob", proj: "e_bombe", r: [30, 210], pre: 0.6, act: 0.05, post: 0.5, cd: 1.6, sfx: "swing" }] },
    wolf: { n: ["Wolf", "Wolf"], shape: "wolf", c: "#6a6660", t: "#34302c", w: 20, h: 12, hp: 0.85, dmg: 0.9, spd: 175, ai: "pack", sight: 220, gold: 2, snd: "wolf",
      atks: [{ k: "leap", r: [30, 110], pre: 0.38, act: 0.4, post: 0.35, cd: 1, box: [0, -12, 22, 12], jump: [260, -230], sfx: "bite" },
             { k: "hit", r: [0, 26], pre: 0.2, act: 0.08, post: 0.25, cd: 0.4, box: [0, -10, 18, 10], sfx: "bite", w: 0.8 }] },
    wolfsreiter: { n: ["Wolfsreiter", "Wolf Rider"], shape: "wolfrider", c: "#5d8a2a", t: "#5a5048", w: 22, h: 22, hp: 2, dmg: 1.3, spd: 160, ai: "charger", sight: 260, gold: 12, snd: "wolf", heavy: true,
      atks: [{ k: "charge", r: [40, 260], pre: 0.6, act: 1.0, post: 0.6, cd: 2, box: [0, -20, 26, 20], spd: 330, armor: true, sfx: "wolf", glyph: "!!" },
             { k: "hit", r: [0, 30], pre: 0.3, act: 0.1, post: 0.3, cd: 0.6, box: [0, -22, 26, 16], sfx: "slash" }] },
    ratte: { n: ["Riesenratte", "Giant Rat"], shape: "rat", c: "#5a4a40", t: "#c89a8a", w: 12, h: 8, hp: 0.45, dmg: 0.55, spd: 150, ai: "swarm", sight: 160, gold: 1, snd: "rat", group: [2, 4],
      atks: [{ k: "leap", r: [10, 60], pre: 0.25, act: 0.35, post: 0.3, cd: 0.6, box: [0, -8, 14, 8], jump: [200, -150], sfx: "bite" }] },
    /* ---------------- Rote Roben ---------------- */
    robe: { n: ["Rote Robe", "Red Robe"], shape: "human", c: "#9a2424", t: "#5a1414", skin: "#d9b08c", hood: 1, sword: 1, w: 11, h: 22, hp: 1.15, dmg: 1, spd: 90, ai: "walker", sight: 190, gold: 6,
      atks: [{ k: "hit", r: [0, 30], pre: 0.36, act: 0.1, post: 0.3, cd: 0.6, box: [0, -22, 28, 20], sfx: "slash" },
             { k: "combo", r: [0, 30], pre: 0.42, act: 0.1, post: 0.4, cd: 1.2, box: [0, -22, 30, 20], n: 2, gap: 0.24, sfx: "slash", w: 0.6 }] },
    robeArmbrust: { n: ["Armbrustschütze der Roben", "Robe Crossbowman"], shape: "human", c: "#8a2020", t: "#3a2a20", skin: "#c99c76", hood: 1, xbow: 1, w: 11, h: 22, hp: 0.85, dmg: 1.1, spd: 75, ai: "ranged", keep: [100, 220], sight: 260, gold: 7,
      atks: [{ k: "shoot", proj: "e_bolzen", r: [50, 280], pre: 0.85, act: 0.05, post: 0.5, cd: 1.6, sfx: "xbow", aimLine: true, lockAim: 0.25 }] },
    robeTrunk: { n: ["Betrunkene Robe", "Drunken Robe"], shape: "human", c: "#a83030", t: "#5a1414", skin: "#e8a090", hood: 1, bottle: 1, w: 11, h: 22, hp: 1.2, dmg: 1.1, spd: 80, ai: "drunk", sight: 170, gold: 8,
      atks: [{ k: "lob", proj: "e_phiole", r: [40, 160], pre: 0.5, act: 0.05, post: 0.5, cd: 1.6, sfx: "swing" },
             { k: "lunge", r: [0, 40], pre: 0.4, act: 0.2, post: 0.6, cd: 1, box: [0, -20, 22, 18], lunge: 200, sfx: "punch" }] },
    robeSchlaeger: { n: ["Schläger der Roben", "Robe Thug"], shape: "human", c: "#7a1a1a", t: "#4a3a2a", skin: "#c48a64", mace: 1, size: 1.4, w: 15, h: 28, hp: 3.4, dmg: 1.6, spd: 62, ai: "walker", heavy: true, poise: 0.3, sight: 180, gold: 14,
      atks: [{ k: "hit", r: [0, 38], pre: 0.62, act: 0.12, post: 0.5, cd: 0.8, box: [-4, -34, 40, 34], armor: true, sfx: "swingHeavy", hitSfx: "hitHeavy", glyph: "!!" },
             { k: "grab", r: [0, 22], pre: 0.5, act: 0.15, post: 0.7, cd: 3, box: [0, -26, 20, 24], sfx: "chain", glyph: "!!", unblockable: true, w: 0.5 }] },
    adept: { n: ["Adept der Roben", "Robe Adept"], shape: "human", c: "#b02a3a", t: "#e5b454", skin: "#d9b08c", hat: 1, staff: 1, w: 11, h: 22, hp: 0.9, dmg: 1.1, spd: 70, ai: "caster", keep: [90, 200], sight: 240, gold: 9,
      atks: [{ k: "shoot", proj: "e_feuerball", r: [30, 260], pre: 0.6, act: 0.05, post: 0.4, cd: 1.5, sfx: "fire", glow: "#ff8a3a" },
             { k: "teleport", r: [0, 60], pre: 0.35, act: 0.05, post: 0.2, cd: 3, sfx: "magic", w: 1.4 },
             { k: "mark", r: [40, 220], pre: 0.5, act: 0.05, post: 0.6, cd: 4, warn: 0.9, hz: "zone", hw: 34, hh: 40, sfx: "fireBig", col: "#ff8a3a", w: 0.6 }] },
    phiole: { n: ["Phiolenwesen", "Vial Creature"], shape: "blob", c: "#7ac0a0", t: "#3a7a6a", w: 12, h: 10, hp: 0.9, dmg: 2.4, spd: 105, ai: "exploder", sight: 170, gold: 4, noBlock: true,
      atks: [{ k: "explode", r: [0, 22], pre: 0.6, act: 0.05, post: 0, cd: 0, rad: 38, sfx: "glass", glyph: "!!", splash: "poison" }] },
    /* ---------------- Kerker & Verlies ---------------- */
    kerkerwache: { n: ["Kerkerwache", "Jail Guard"], shape: "human", c: "#5a4a40", t: "#4a4a52", skin: "#c48a64", helm: 1, shield: 1, sword: 1, w: 12, h: 23, hp: 1.8, dmg: 1.1, spd: 70, ai: "shielder", front: true, sight: 180, gold: 9, metal: true,
      atks: [{ k: "lunge", r: [0, 34], pre: 0.4, act: 0.12, post: 0.55, cd: 0.8, box: [0, -22, 26, 20], lunge: 160, sfx: "block", hitSfx: "hitMetal" },
             { k: "hit", r: [0, 28], pre: 0.5, act: 0.1, post: 0.6, cd: 1, box: [0, -22, 28, 22], sfx: "slash", w: 0.7 }] },
    folterknecht: { n: ["Folterknecht", "Torturer"], shape: "human", c: "#3a2a24", t: "#2a2020", skin: "#b07a5a", hood: 1, chain: 1, size: 1.35, w: 15, h: 28, hp: 3, dmg: 1.4, spd: 58, ai: "walker", heavy: true, poise: 0.3, sight: 190, gold: 15,
      atks: [{ k: "pull", r: [40, 150], pre: 0.6, act: 0.3, post: 0.5, cd: 2.6, sfx: "chain", glyph: "!!" },
             { k: "hit", r: [0, 42], pre: 0.55, act: 0.14, post: 0.5, cd: 0.8, box: [-6, -30, 48, 30], armor: true, sfx: "chain", hitSfx: "hitHeavy", eff: { bleed: 1 } }] },
    skelett: { n: ["Skelett", "Skeleton"], shape: "skel", c: "#e8e2d0", t: "#9a9384", sword: 1, w: 11, h: 22, hp: 1, dmg: 1, spd: 82, ai: "walker", sight: 190, gold: 3, undead: true, revive: true,
      atks: [{ k: "hit", r: [0, 30], pre: 0.38, act: 0.1, post: 0.35, cd: 0.6, box: [0, -22, 28, 22], sfx: "slash" },
             { k: "lunge", r: [20, 50], pre: 0.5, act: 0.15, post: 0.5, cd: 1.2, box: [0, -22, 24, 20], lunge: 240, sfx: "slash", w: 0.5 }] },
    skelBogen: { n: ["Skelett-Bogenschütze", "Skeleton Archer"], shape: "skel", c: "#e8e2d0", t: "#6b5040", bow: 1, w: 11, h: 22, hp: 0.75, dmg: 0.95, spd: 70, ai: "ranged", keep: [100, 220], sight: 250, gold: 4, undead: true,
      atks: [{ k: "shoot", proj: "e_pfeil", r: [50, 260], pre: 0.6, act: 0.05, post: 0.4, cd: 1.2, sfx: "bow", aimLine: true },
             { k: "volley", proj: "e_pfeil", r: [80, 240], pre: 0.8, act: 0.05, post: 0.6, cd: 3, n: 5, sfx: "bow", w: 0.4 }] },
    zombie: { n: ["Zombie", "Zombie"], shape: "zombie", c: "#5a6a4a", t: "#3a3226", skin: "#8a9a7a", w: 12, h: 23, hp: 1.5, dmg: 1.15, spd: 45, ai: "walker", sight: 160, gold: 3, undead: true,
      atks: [{ k: "grab", r: [0, 24], pre: 0.65, act: 0.15, post: 0.6, cd: 2, box: [0, -22, 20, 20], sfx: "undead", glyph: "!!", unblockable: true },
             { k: "hit", r: [0, 26], pre: 0.5, act: 0.1, post: 0.5, cd: 0.8, box: [0, -22, 24, 18], sfx: "claw", w: 1.2 }] },
    zombieBlaeh: { n: ["Aufgedunsener Zombie", "Bloated Zombie"], shape: "bloat", c: "#7a8a5a", t: "#4a5a34", w: 18, h: 22, hp: 1.6, dmg: 2.5, spd: 40, ai: "exploder", sight: 150, gold: 4, undead: true, heavy: true,
      atks: [{ k: "explode", r: [0, 28], pre: 0.8, act: 0.05, post: 0, cd: 0, rad: 46, sfx: "slime", glyph: "!!", splash: "poison" }] },
    /* ---------------- Hallen ---------------- */
    ruestung: { n: ["Belebte Rüstung", "Animated Armour"], shape: "armor", c: "#7a7e88", t: "#c88a2a", w: 13, h: 25, hp: 2, dmg: 1.2, spd: 72, ai: "walker", armor: 0.25, metal: true, heavy: true, poise: 0.28, sight: 180, gold: 8, immune: ["bleed", "poison"],
      atks: [{ k: "combo", r: [0, 34], pre: 0.5, act: 0.1, post: 0.5, cd: 0.8, box: [-2, -26, 34, 26], n: 3, gap: 0.26, sfx: "slash", hitSfx: "hitMetal" },
             { k: "charge", r: [60, 200], pre: 0.7, act: 0.6, post: 0.8, cd: 2.5, box: [0, -24, 22, 24], spd: 260, armor: true, sfx: "hitMetal", glyph: "!!", w: 0.5 }] },
    drowWache: { n: ["Drow-Wache", "Drow Guard"], shape: "human", c: "#2a2236", t: "#4a3a5a", skin: "#4a3e5e", hair: "#eeeeff", scim: 1, w: 11, h: 22, hp: 1.4, dmg: 1.15, spd: 115, ai: "duelist", sight: 210, gold: 10,
      atks: [{ k: "lunge", r: [20, 80], pre: 0.32, act: 0.18, post: 0.4, cd: 0.9, box: [-6, -22, 30, 20], lunge: 340, sfx: "slash" },
             { k: "combo", r: [0, 30], pre: 0.3, act: 0.08, post: 0.4, cd: 0.9, box: [0, -22, 26, 20], n: 3, gap: 0.16, sfx: "slash" },
             { k: "teleport", r: [0, 220], pre: 0.3, act: 0.05, post: 0.1, cd: 4, behind: true, sfx: "shadow", w: 0.5 }] },
    drowSchuetze: { n: ["Drow-Späher", "Drow Scout"], shape: "human", c: "#2a2236", t: "#1a1420", skin: "#4a3e5e", hair: "#eeeeff", xbow: 1, w: 11, h: 22, hp: 0.9, dmg: 1, spd: 95, ai: "ranged", keep: [110, 230], sight: 260, gold: 9,
      atks: [{ k: "shoot", proj: "e_bolzen", r: [60, 280], pre: 0.6, act: 0.05, post: 0.4, cd: 1.3, sfx: "xbow", eff: { poison: 1 }, aimLine: true },
             { k: "teleport", r: [0, 70], pre: 0.25, act: 0.05, post: 0.2, cd: 3.5, sfx: "shadow", w: 1.2 }] },
    soeldner: { n: ["Söldner", "Mercenary"], shape: "human", c: "#4a4e56", t: "#2a2a30", skin: "#d9b08c", helm: 1, spear: 1, w: 12, h: 23, hp: 1.4, dmg: 1.15, spd: 88, ai: "walker", sight: 200, gold: 9, metal: true,
      atks: [{ k: "lunge", r: [20, 56], pre: 0.45, act: 0.12, post: 0.45, cd: 0.8, box: [0, -20, 44, 10], lunge: 150, sfx: "spear" },
             { k: "hit", r: [0, 40], pre: 0.4, act: 0.12, post: 0.4, cd: 0.7, box: [-10, -28, 50, 22], sfx: "slash", w: 0.6 }] },
    /* ---------------- Flieger ---------------- */
    stirge: { n: ["Stirge", "Stirge"], shape: "stirge", c: "#6a3a3a", t: "#c05050", w: 12, h: 10, hp: 0.5, dmg: 0.75, spd: 120, ai: "flyer", fly: true, sight: 220, gold: 2, snd: "bat",
      atks: [{ k: "dive", r: [0, 150], pre: 0.5, act: 0.6, post: 0.5, cd: 1, box: [-2, -10, 14, 10], spd: 300, sfx: "bat", eff: { bleed: 1 } }] },
    harpyie: { n: ["Harpyie", "Harpy"], shape: "harpy", c: "#5a4a3a", t: "#c8a070", skin: "#c09080", w: 14, h: 16, hp: 1.1, dmg: 1, spd: 110, ai: "flyer", fly: true, sight: 240, gold: 7,
      atks: [{ k: "shoot", proj: "e_feder", n: 3, spread: 0.3, r: [40, 220], pre: 0.5, act: 0.05, post: 0.5, cd: 1.5, sfx: "bat" },
             { k: "dive", r: [0, 140], pre: 0.55, act: 0.6, post: 0.5, cd: 1.4, box: [-2, -14, 18, 14], spd: 280, sfx: "claw" },
             { k: "shoot", proj: "e_schall", r: [0, 160], pre: 0.7, act: 0.05, post: 0.6, cd: 4, sfx: "roar", eff: { stun: 0.4 }, w: 0.4 }] },
    mane: { n: ["Mane", "Mane"], shape: "mane", c: "#7a3a4a", t: "#ff8a5a", w: 11, h: 13, hp: 0.7, dmg: 1, spd: 100, ai: "skirmish", sight: 180, gold: 2, demon: true, group: [2, 3],
      atks: [{ k: "hit", r: [0, 22], pre: 0.3, act: 0.08, post: 0.3, cd: 0.5, box: [0, -12, 18, 12], sfx: "claw" },
             { k: "leap", r: [30, 90], pre: 0.35, act: 0.4, post: 0.35, cd: 1.2, box: [0, -12, 16, 12], jump: [220, -260], sfx: "claw" }], death: "gas" },
    /* ---------------- Wasser ---------------- */
    kuotoa: { n: ["Kuo-Toa", "Kuo-toa"], shape: "kuotoa", c: "#2a5a52", t: "#e0909a", w: 12, h: 21, hp: 1.2, dmg: 1, spd: 85, ai: "walker", sight: 190, gold: 6,
      atks: [{ k: "hit", r: [0, 36], pre: 0.4, act: 0.12, post: 0.4, cd: 0.7, box: [0, -18, 34, 14], sfx: "spear" },
             { k: "web", proj: "e_netz", r: [40, 160], pre: 0.55, act: 0.05, post: 0.4, cd: 3, sfx: "swing", w: 0.5 }] },
    kuotoaSpeer: { n: ["Kuo-Toa-Speerwerfer", "Kuo-toa Spearthrower"], shape: "kuotoa", c: "#24504a", t: "#e5b454", spear: 1, w: 12, h: 21, hp: 0.9, dmg: 1.1, spd: 80, ai: "ranged", keep: [90, 200], sight: 240, gold: 7,
      atks: [{ k: "shoot", proj: "e_bolzen", r: [50, 240], pre: 0.7, act: 0.05, post: 0.5, cd: 1.5, sfx: "spear", aimLine: true }] },
    peitscher: { n: ["Kuo-Toa-Peitscher", "Kuo-toa Whip"], shape: "kuotoa", c: "#2a5a52", t: "#e5b454", staff: 1, size: 1.15, w: 13, h: 24, hp: 1.5, dmg: 1.2, spd: 70, ai: "caster", keep: [80, 180], sight: 240, gold: 12,
      atks: [{ k: "mark", r: [30, 240], pre: 0.5, act: 0.05, post: 0.5, cd: 2.4, warn: 0.8, hz: "strike", hw: 22, sfx: "zap", col: "rgba(255,240,150,1)" },
             { k: "heal", r: [0, 300], pre: 0.6, act: 0.05, post: 0.5, cd: 6, sfx: "magic", w: 0.8 }] },
    rochen: { n: ["Bleicher Rochen", "Pale Ray"], shape: "ray", c: "#d8d8d0", t: "#a8a8a0", w: 22, h: 10, hp: 0.9, dmg: 1, spd: 130, ai: "flyer", fly: true, sight: 260, gold: 4,
      atks: [{ k: "dive", r: [0, 180], pre: 0.6, act: 0.8, post: 0.4, cd: 1.3, box: [-6, -10, 30, 10], spd: 320, sfx: "magic" },
             { k: "shoot", proj: "e_blase", r: [40, 200], pre: 0.5, act: 0.05, post: 0.5, cd: 2.4, sfx: "slime", w: 0.6 }] },
    ertrunkener: { n: ["Ertrunkener", "Drowned One"], shape: "zombie", c: "#3a5a4a", t: "#2a3a30", skin: "#7a9a8a", wet: 1, w: 12, h: 23, hp: 1.6, dmg: 1.1, spd: 55, ai: "walker", sight: 170, gold: 4, undead: true,
      atks: [{ k: "lob", proj: "e_gift", r: [40, 150], pre: 0.6, act: 0.05, post: 0.5, cd: 2.2, sfx: "slime" },
             { k: "hit", r: [0, 28], pre: 0.45, act: 0.1, post: 0.5, cd: 0.8, box: [0, -22, 26, 20], sfx: "claw", eff: { slow: 1.5 } }] },
    krabbe: { n: ["Riesenkrabbe", "Giant Crab"], shape: "crab", c: "#a04a3a", t: "#e08a6a", w: 20, h: 12, hp: 1.8, dmg: 1.1, spd: 90, ai: "walker", armor: 0.35, front: false, sight: 160, gold: 6, heavy: true,
      atks: [{ k: "combo", r: [0, 28], pre: 0.4, act: 0.08, post: 0.5, cd: 0.9, box: [0, -12, 24, 12], n: 2, gap: 0.2, sfx: "claw" },
             { k: "charge", r: [50, 160], pre: 0.5, act: 0.6, post: 0.6, cd: 2.4, box: [0, -12, 22, 12], spd: 240, sfx: "claw", w: 0.6, sideways: true }] },
    /* ---------------- Spinnenschlund ---------------- */
    riesenspinne: { n: ["Riesenspinne", "Giant Spider"], shape: "spider", c: "#3a3326", t: "#1d1912", w: 20, h: 12, hp: 1.3, dmg: 1.1, spd: 140, ai: "ceiling", sight: 200, gold: 6, snd: "insect",
      atks: [{ k: "leap", r: [30, 130], pre: 0.4, act: 0.45, post: 0.4, cd: 1.1, box: [0, -12, 22, 12], jump: [280, -220], sfx: "bite", eff: { poison: 1 } },
             { k: "hit", r: [0, 26], pre: 0.25, act: 0.08, post: 0.3, cd: 0.5, box: [0, -12, 20, 12], sfx: "bite", eff: { poison: 1 } }] },
    netzspinne: { n: ["Netzspinne", "Web Spider"], shape: "spider", c: "#4a4050", t: "#2a2030", w: 18, h: 11, hp: 0.9, dmg: 0.8, spd: 100, ai: "ranged", keep: [90, 190], sight: 230, gold: 6, snd: "insect",
      atks: [{ k: "web", proj: "e_netz", r: [40, 220], pre: 0.5, act: 0.05, post: 0.4, cd: 1.6, sfx: "web" },
             { k: "shoot", proj: "e_nadel", n: 3, spread: 0.25, r: [40, 200], pre: 0.5, act: 0.05, post: 0.4, cd: 1.6, sfx: "insect", eff: { poison: 1 } }] },
    spinnchen: { n: ["Spinnenjunges", "Spiderling"], shape: "spider", c: "#4a3a30", t: "#2a2018", size: 0.55, w: 10, h: 7, hp: 0.3, dmg: 0.5, spd: 170, ai: "swarm", sight: 180, gold: 0, group: [3, 5],
      atks: [{ k: "leap", r: [10, 60], pre: 0.2, act: 0.3, post: 0.25, cd: 0.5, box: [0, -7, 12, 7], jump: [220, -160], sfx: "bite", eff: { poison: 1 } }] },
    ettercap: { n: ["Ettercap", "Ettercap"], shape: "ettercap", c: "#4a3a4a", t: "#ececf4", w: 13, h: 22, hp: 1.6, dmg: 1.2, spd: 80, ai: "walker", sight: 210, gold: 9,
      atks: [{ k: "pull", r: [50, 170], pre: 0.55, act: 0.3, post: 0.5, cd: 3, sfx: "web", glyph: "!!", web: true },
             { k: "combo", r: [0, 30], pre: 0.35, act: 0.08, post: 0.4, cd: 0.8, box: [0, -20, 26, 18], n: 2, gap: 0.18, sfx: "claw", eff: { poison: 1 } }] },
    schatten: { n: ["Schatten", "Shadow"], shape: "wraith", c: "#1a1424", t: "#9a6aff", w: 13, h: 22, hp: 1.1, dmg: 1.2, spd: 75, ai: "phase", fly: true, ghost: true, sight: 230, gold: 6, undead: true, immune: ["poison", "bleed"],
      atks: [{ k: "dive", r: [0, 120], pre: 0.6, act: 0.5, post: 0.5, cd: 1.4, box: [-2, -22, 18, 22], spd: 240, sfx: "shadow", eff: { weak: 2 } },
             { k: "shoot", proj: "e_kugel", r: [60, 220], pre: 0.6, act: 0.05, post: 0.5, cd: 2.4, sfx: "dark", w: 0.6 }] },
    brutsack: { n: ["Brutsack", "Brood Sac"], shape: "sac", c: "#c8c0b8", t: "#8a6a7a", w: 16, h: 18, hp: 1.6, dmg: 0, spd: 0, ai: "turret", sight: 200, gold: 4, noBlock: true,
      atks: [{ k: "summon", r: [0, 260], pre: 0.8, act: 0.05, post: 0.5, cd: 4, spawn: ["spinnchen", "spinnchen"], max: 5, sfx: "slime" }], death: "spiders" },
    /* ---------------- Runenschmiede ---------------- */
    runenfunke: { n: ["Runenfunke", "Rune Spark"], shape: "wisp", c: "#ffb040", t: "#fff0c0", w: 10, h: 10, hp: 0.6, dmg: 0.9, spd: 70, ai: "flyer", fly: true, keep: [80, 160], sight: 240, gold: 4, metal: false,
      atks: [{ k: "shoot", proj: "e_funke", n: 3, gap: 0.18, r: [30, 240], pre: 0.6, act: 0.4, post: 0.5, cd: 1.8, sfx: "rune" }] },
    runenwaechter: { n: ["Runenwächter", "Rune Warden"], shape: "golem", c: "#5a6070", t: "#ffb040", size: 1.5, w: 20, h: 32, hp: 4, dmg: 1.6, spd: 50, ai: "walker", armor: 0.3, metal: true, heavy: true, poise: 0.4, sight: 200, gold: 18, immune: ["bleed", "poison"],
      atks: [{ k: "slam", r: [0, 44], pre: 0.8, act: 0.12, post: 0.7, cd: 1, box: [-10, -36, 54, 36], armor: true, wave: true, sfx: "quake", hitSfx: "hitHeavy", glyph: "!!" },
             { k: "beam", r: [40, 260], pre: 0.9, act: 0.4, post: 0.6, cd: 3.5, sfx: "rune", col: "rgba(255,170,60,.85)", w: 0.7 }] },
    duergar: { n: ["Duergar", "Duergar"], shape: "duergar", c: "#4a4246", t: "#ff6a2a", skin: "#7a7a82", w: 12, h: 19, hp: 1.6, dmg: 1.15, spd: 80, ai: "walker", sight: 200, gold: 10, metal: true,
      atks: [{ k: "grow", r: [0, 200], pre: 0.7, act: 0.05, post: 0.3, cd: 0.8 /* W9: vorher 99 – nach dem Wachsen griff der Duergar ~100 s lang nicht mehr an (once verhindert ohnehin ein zweites Wachsen) */, sfx: "roar", once: true, w: 2 },
             { k: "hit", r: [0, 32], pre: 0.45, act: 0.1, post: 0.45, cd: 0.7, box: [-2, -20, 32, 20], sfx: "axe", hitSfx: "hitMetal" },
             { k: "invis", r: [60, 220], pre: 0.4, act: 0.05, post: 0.1, cd: 6, sfx: "shadow", w: 0.4 }] },
    duergarArmbrust: { n: ["Duergar-Armbrustschütze", "Duergar Crossbowman"], shape: "duergar", c: "#4a4248", t: "#c8501a", skin: "#7a7a82", xbow: 1, w: 12, h: 19, hp: 1.1, dmg: 1.1, spd: 70, ai: "ranged", keep: [100, 220], sight: 260, gold: 10, metal: true,
      atks: [{ k: "shoot", proj: "e_bolzen", r: [50, 280], pre: 0.7, act: 0.05, post: 0.4, cd: 1.4, sfx: "xbow", aimLine: true, eff: { burn: 1 } }] },
    schmiedegeist: { n: ["Schmiedegeist", "Forge Spirit"], shape: "wraith", c: "#4a2a1a", t: "#ff8a2a", w: 13, h: 22, hp: 1.4, dmg: 1.2, spd: 80, ai: "phase", fly: true, ghost: true, sight: 230, gold: 8, immune: ["burn", "poison", "bleed"],
      atks: [{ k: "spray", r: [0, 70], pre: 0.6, act: 0.6, post: 0.5, cd: 2.2, len: 70, sfx: "fireBig", col: "rgba(255,150,50,.6)", eff: { burn: 1 } },
             { k: "teleport", r: [0, 200], pre: 0.3, act: 0.05, post: 0.2, cd: 3, sfx: "fire", w: 0.6 }] },
    /* ---------------- Zinnen & Sturm ---------------- */
    zweigBlight: { n: ["Zweig-Blight", "Twig Blight"], shape: "blight", c: "#6a5232", t: "#ff3030", w: 10, h: 18, hp: 0.8, dmg: 0.9, spd: 140, ai: "skirmish", sight: 180, gold: 3, group: [2, 3],
      atks: [{ k: "combo", r: [0, 24], pre: 0.25, act: 0.06, post: 0.3, cd: 0.5, box: [0, -16, 20, 14], n: 2, gap: 0.12, sfx: "claw" }] },
    nadelBlight: { n: ["Nadel-Blight", "Needle Blight"], shape: "blight", c: "#4a5a2a", t: "#ff3030", needle: 1, w: 11, h: 20, hp: 0.95, dmg: 0.9, spd: 75, ai: "ranged", keep: [80, 180], sight: 230, gold: 5,
      atks: [{ k: "shoot", proj: "e_nadel", n: 5, spread: 0.5, r: [30, 200], pre: 0.6, act: 0.05, post: 0.5, cd: 1.6, sfx: "insect" }] },
    rankenBlight: { n: ["Ranken-Blight", "Vine Blight"], shape: "blight", c: "#3a5a2a", t: "#ff3030", vine: 1, size: 1.5, w: 16, h: 28, hp: 3.2, dmg: 1.4, spd: 55, ai: "walker", heavy: true, poise: 0.3, sight: 200, gold: 14,
      atks: [{ k: "mark", r: [30, 220], pre: 0.6, act: 0.05, post: 0.5, cd: 2.4, warn: 0.75, hz: "zone", hw: 26, hh: 30, sfx: "roots", col: "#5a8a30", eff: { root: 1.2 } },
             { k: "hit", r: [0, 40], pre: 0.55, act: 0.12, post: 0.5, cd: 0.8, box: [-4, -30, 44, 30], armor: true, sfx: "whip", hitSfx: "hitHeavy" },
             { k: "summon", r: [0, 200], pre: 0.7, act: 0.05, post: 0.4, cd: 7, spawn: ["zweigBlight"], max: 3, sfx: "roots", w: 0.5 }] },
    /* ---------------- Glutgassen ---------------- */
    feuerschlucker: { n: ["Feuerschlucker", "Fire-Eater"], shape: "human", c: "#8a2a1a", t: "#e5b454", skin: "#8a8a92", bald: 1, w: 12, h: 22, hp: 1.4, dmg: 1.1, spd: 85, ai: "walker", sight: 200, gold: 10, immune: ["burn"],
      atks: [{ k: "spray", r: [0, 80], pre: 0.55, act: 0.7, post: 0.5, cd: 1.8, len: 80, sfx: "fireBig", col: "rgba(255,150,50,.6)", eff: { burn: 1 } },
             { k: "lob", proj: "e_glut", n: 2, r: [60, 200], pre: 0.5, act: 0.05, post: 0.5, cd: 2.2, sfx: "fire" }] },
    glutling: { n: ["Glutling", "Emberling"], shape: "blob", c: "#ff6a1a", t: "#ffd27a", glow: true, w: 14, h: 12, hp: 1.1, dmg: 1, spd: 90, ai: "jumper", sight: 180, gold: 3, immune: ["burn"], split: "glutlingKlein", noBlock: true,
      atks: [{ k: "leap", r: [20, 120], pre: 0.35, act: 0.5, post: 0.3, cd: 0.9, box: [-2, -12, 18, 12], jump: [200, -300], sfx: "slime", eff: { burn: 1 }, landFire: true }] },
    glutlingKlein: { n: ["Glutfunke", "Ember Spark"], shape: "blob", c: "#ff8a2a", t: "#ffe0a0", glow: true, size: 0.6, w: 8, h: 7, hp: 0.35, dmg: 0.6, spd: 120, ai: "jumper", sight: 180, gold: 0, immune: ["burn"], noBlock: true,
      atks: [{ k: "leap", r: [10, 90], pre: 0.25, act: 0.4, post: 0.25, cd: 0.6, box: [-2, -8, 12, 8], jump: [200, -240], sfx: "slime", eff: { burn: 1 } }] },
    bewahrer: { n: ["Bewahrer der Flamme", "Keeper of the Flame"], shape: "human", c: "#8a1a1a", t: "#e5b454", skin: "#5a4a4a", hood: 1, staff: 1, glowStaff: "#ff8a3a", w: 11, h: 22, hp: 1.2, dmg: 1.2, spd: 70, ai: "caster", keep: [90, 210], sight: 250, gold: 12, immune: ["burn"],
      atks: [{ k: "mark", r: [30, 240], pre: 0.45, act: 0.05, post: 0.5, cd: 2.2, warn: 0.85, hz: "column", hw: 24, hh: 120, life: 0.6, sfx: "fireBig", col: "rgba(255,140,40,.8)", eff: { burn: 1 } },
             { k: "shield", r: [0, 300], pre: 0.6, act: 0.05, post: 0.4, cd: 7, sfx: "magic", w: 0.8 },
             { k: "teleport", r: [0, 60], pre: 0.3, act: 0.05, post: 0.2, cd: 4, sfx: "fire", w: 1 }] },
    magmaHund: { n: ["Magmahund", "Magma Hound"], shape: "wolf", c: "#3a2420", t: "#ff6a1a", glow: true, w: 20, h: 13, hp: 1.3, dmg: 1.1, spd: 180, ai: "pack", sight: 230, gold: 6, immune: ["burn"],
      atks: [{ k: "leap", r: [30, 120], pre: 0.35, act: 0.4, post: 0.35, cd: 1, box: [0, -12, 22, 12], jump: [280, -220], sfx: "bite", eff: { burn: 1 } },
             { k: "spray", r: [0, 60], pre: 0.5, act: 0.5, post: 0.4, cd: 2.5, len: 60, sfx: "fire", col: "rgba(255,150,50,.6)", eff: { burn: 1 }, w: 0.6 }] }
  });

  /* ======================= W10: NEUE GEGNERARTEN =======================
     Je Gebiet 1–2 neue Arten mit eigener Gestalt, 2–3 Angriffen und einer Rolle im Zusammenspiel:
     Trommler stärkt die Gruppe, Schildträger deckt Schützen, Laternenträger macht Dunkelheit hell und ruft laut,
     Grimlocks sind blind und hören umso besser, Glockengeister alarmieren den ganzen Raum, Mimiken und Wasserspeier
     tarnen sich, Myconiden heilen, Drider spannen Fäden, Rostmonster lassen Waffen rosten, Säureschnecken ziehen Spuren …
     kkDone: kampfkunst.js hängt keine Standard-Angriffe an (die Angriffe sind hier bewusst gesetzt). */
  const NM = (de, en) => [de, en];
  Object.assign(E, {
    /* Torhof */
    goblinTrommler: { n: NM("Goblin-Trommler", "Goblin Drummer"), shape: "drummer", c: "#6a9a3a", t: "#8a3a22", w: 12, h: 17, hp: 1.3, dmg: 0.85, spd: 70, ai: "support", keep: [60, 150], sight: 190, gold: 8, snd: "goblin", callR: 320, role: "support", kkDone: true, chain: 0.2,
      atks: [{ k: "drum", r: [0, 400], pre: 0.55, act: 0.6, post: 0.3, cd: 0.8, own: 6, sfx: "hitHeavy", name: NM("Kriegstrommel", "War Drum"), w: 1.6 },
             { k: "slam", r: [0, 34], pre: 0.6, act: 0.1, post: 0.5, cd: 1.8, box: [-4, -16, 34, 16], wave: true, sfx: "swingHeavy", hitSfx: "hitHeavy", name: NM("Paukenschlag", "Drum Slam") },
             { k: "hit", r: [0, 24], pre: 0.35, act: 0.08, post: 0.35, cd: 0.8, box: [0, -14, 18, 12], sfx: "punch", w: 0.6 }] },
    goblinSchild: { n: NM("Goblin-Schildträger", "Goblin Shieldbearer"), shape: "schildgoblin", c: "#5e8a30", t: "#4a3a22", w: 12, h: 17, hp: 1.6, dmg: 0.9, spd: 78, ai: "guard", front: true, poise: 0.35, sight: 180, gold: 8, snd: "goblin", role: "tank", kkDone: true, chain: 0.25,
      atks: [{ k: "lunge", r: [0, 40], pre: 0.45, act: 0.15, post: 0.45, cd: 1.4, box: [0, -16, 22, 16], lunge: 200, kb: 260, sfx: "block", hitSfx: "hitHeavy", name: NM("Schildstoß", "Shield Bash") },
             { k: "hit", r: [0, 26], pre: 0.35, act: 0.08, post: 0.4, cd: 0.9, box: [0, -9, 24, 9], sfx: "stab" },
             { k: "brace", r: [0, 120], pre: 0.3, act: 1.4, post: 0.3, cd: 0.6, own: 6, sfx: "block", name: NM("Schildwall", "Shield Wall"), w: 0.5 }] },
    /* Keller */
    laternentraeger: { n: NM("Kobold-Laternenträger", "Kobold Lanternbearer"), shape: "kobold", c: "#8a4a2a", t: "#e5b454", w: 10, h: 15, hp: 0.95, dmg: 0.8, spd: 88, ai: "ranged", keep: [60, 140], sight: 230, gold: 6, lantern: true, callR: 340, role: "alarm", kkDone: true, chain: 0.2,
      atks: [{ k: "hit", r: [0, 26], pre: 0.38, act: 0.1, post: 0.4, cd: 1, box: [0, -16, 22, 14], eff: { burn: 1 }, sfx: "swing" },
             { k: "lob", proj: "e_glut", r: [40, 170], pre: 0.6, act: 0.05, post: 0.5, cd: 1.4, own: 2.6, sfx: "glass", name: NM("Lampenöl", "Lamp Oil") },
             { k: "flare", r: [0, 400], pre: 0.45, act: 0.05, post: 0.3, cd: 0.8, own: 12, sfx: "fire", name: NM("Licht hoch!", "Lights up!"), w: 0.8 }] },
    gallertwuerfel: { n: NM("Gallertwürfel", "Gelatinous Cube"), shape: "cube", c: "#8ac07a", t: "#c8e8a0", w: 22, h: 22, hp: 3.2, dmg: 1.2, spd: 32, ai: "walker", heavy: true, poise: 0.5, blind: true, ears: 1.2, sight: 90, gold: 16, immune: ["poison", "bleed"], noBlock: true, role: "tank", kkDone: true, chain: 0, blood: "#c8e8a0",
      atks: [{ k: "grab", r: [0, 24], pre: 0.75, act: 0.15, post: 0.7, cd: 1.2, own: 3.5, box: [-4, -22, 30, 22], unblockable: true, glyph: "!!", sfx: "slime", name: NM("Verschlingen", "Engulf") },
             { k: "hit", r: [0, 34], pre: 0.55, act: 0.12, post: 0.5, cd: 1.2, box: [0, -18, 36, 14], sfx: "slime", eff: { poison: 1 }, name: NM("Scheinfuß", "Pseudopod") }] },
    /* Hallen */
    mimik: { n: NM("Mimik", "Mimic"), shape: "mimic", c: "#7a5030", t: "#c8a040", w: 18, h: 14, hp: 2.2, dmg: 1.25, spd: 95, ai: "walker", heavy: true, poise: 0.35, disguise: true, noSleep: true, sight: 150, gold: 26, role: "hinterhalt", kkDone: true, chain: 0.3,
      atks: [{ k: "grab", r: [0, 26], pre: 0.5, act: 0.15, post: 0.6, cd: 1, own: 3, box: [0, -14, 26, 14], unblockable: true, glyph: "!!", sfx: "bite", name: NM("Zuschnappen", "Snap Shut") },
             { k: "pull", r: [40, 150], pre: 0.55, act: 0.35, post: 0.5, cd: 1, own: 4, sfx: "slime", glyph: "!!", tongue: true, name: NM("Klebzunge", "Sticky Tongue") },
             { k: "leap", r: [40, 120], pre: 0.4, act: 0.5, post: 0.4, cd: 1.6, box: [0, -14, 24, 14], jump: [240, -280], sfx: "bite" }] },
    /* Wehrgang */
    kenku: { n: NM("Kenku", "Kenku"), shape: "kenku", c: "#2a2228", t: "#c8a040", w: 11, h: 20, hp: 1.05, dmg: 1, spd: 118, ai: "skirmish", sight: 230, gold: 8, crow: true, callR: 300, role: "plänkler", kkDone: true, chain: 0.35,
      atks: [{ k: "shoot", proj: "e_nadel", n: 2, gap: 0.12, r: [50, 200], pre: 0.5, act: 0.05, post: 0.4, cd: 1.8, sfx: "throwK", aimLine: true, name: NM("Wurfpfeile", "Darts") },
             { k: "combo", r: [0, 28], pre: 0.35, act: 0.08, post: 0.4, cd: 1, box: [0, -18, 24, 16], n: 2, gap: 0.16, sfx: "slash" },
             { k: "evade", r: [0, 40], pre: 0.12, act: 0.35, post: 0.15, cd: 0.4, own: 3.5, w: 0.8 }] },
    /* Verlies */
    grimlock: { n: NM("Grimlock", "Grimlock"), shape: "grimlock", c: "#8a8a80", t: "#5a5048", w: 12, h: 21, hp: 1.5, dmg: 1.2, spd: 95, ai: "walker", blind: true, ears: 1.6, sight: 70, gold: 7, role: "jäger", kkDone: true, chain: 0.35,
      atks: [{ k: "combo", r: [0, 30], pre: 0.42, act: 0.1, post: 0.45, cd: 1, box: [0, -20, 28, 20], n: 2, gap: 0.24, sfx: "swingHeavy", hitSfx: "hitHeavy" },
             { k: "leap", r: [40, 130], pre: 0.45, act: 0.5, post: 0.45, cd: 2.2, box: [0, -18, 24, 18], jump: [280, -240], sfx: "claw", name: NM("Witterung", "Scent Pounce") },
             { k: "lob", proj: "e_stein", r: [70, 200], pre: 0.6, act: 0.05, post: 0.5, cd: 3.5, dmg: 0.7, sfx: "swing", w: 0.5, name: NM("Steinwurf", "Rock Throw") }] },
    ghul: { n: NM("Ghul", "Ghoul"), shape: "ghoul", c: "#6a7a5a", t: "#c8c0a0", w: 11, h: 20, hp: 1.3, dmg: 1.05, spd: 122, ai: "pack", sight: 200, gold: 7, undead: true, role: "jäger", kkDone: true, chain: 0.4,
      atks: [{ k: "combo", r: [0, 26], pre: 0.32, act: 0.08, post: 0.35, cd: 0.9, box: [0, -16, 22, 14], n: 3, gap: 0.15, sfx: "claw", eff: { slow: 0.8 } },
             { k: "leap", r: [40, 140], pre: 0.5, act: 0.5, post: 0.5, cd: 3, box: [0, -16, 24, 16], jump: [300, -230], sfx: "undead", eff: { stun: 0.45 }, glyph: "!!", name: NM("Lähmender Sprung", "Paralysing Pounce") }] },
    /* Hafen */
    schmuggler: { n: NM("Hafenschmuggler", "Harbour Smuggler"), shape: "human", c: "#5a3a2a", t: "#2a2420", skin: "#c89a76", tricorn: 1, scim: 1, netBag: 1, w: 11, h: 22, hp: 1.2, dmg: 1.05, spd: 98, ai: "duelist", sight: 200, gold: 12, role: "kontrolle", kkDone: true, chain: 0.35,
      atks: [{ k: "web", proj: "e_netz", r: [40, 180], pre: 0.55, act: 0.05, post: 0.4, cd: 0.9, own: 4, sfx: "swing", name: NM("Fangnetz", "Catch Net") },
             { k: "lunge", r: [16, 72], pre: 0.4, act: 0.16, post: 0.45, cd: 0.9, box: [-4, -22, 30, 20], lunge: 300, sfx: "slash", name: NM("Enterhieb", "Boarding Slash") },
             { k: "smoke", r: [0, 50], pre: 0.25, act: 0.05, post: 0.2, cd: 0.6, own: 7, sfx: "poison", name: NM("Rauchtopf", "Smoke Pot"), w: 0.7 }] },
    /* Glockenturm */
    glockengeist: { n: NM("Glockengeist", "Bell Wraith"), shape: "bellghost", c: "#d8d0c0", t: "#c8962a", w: 14, h: 18, fly: true, ghost: true, ai: "flyer", keep: [90, 170], hp: 1.05, dmg: 0.9, spd: 80, sight: 260, gold: 9, undead: true, immune: ["poison", "bleed"], callR: 440, callWall: true, bell: true, role: "alarm", kkDone: true, chain: 0.2,
      atks: [{ k: "toll", r: [0, 70], pre: 0.8, act: 0.1, post: 0.6, cd: 1, own: 3.2, rad: 62, kb: 300, sfx: "bell", name: NM("Glockenschlag", "Bell Toll") },
             { k: "shoot", proj: "e_schall", r: [60, 240], pre: 0.6, act: 0.05, post: 0.5, cd: 2.6, sfx: "undead", eff: { stun: 0.3 }, name: NM("Klageton", "Wail") }] },
    /* Spinnenschlund */
    myconid: { n: NM("Myconid-Sporenträger", "Myconid Sporebearer"), shape: "myconid", c: "#c8b8a0", t: "#a0506a", w: 13, h: 22, hp: 1.6, dmg: 0.9, spd: 55, ai: "support", keep: [60, 150], sight: 170, gold: 7, immune: ["poison"], death: "gas", role: "heiler", kkDone: true, chain: 0.2,
      atks: [{ k: "spores", r: [0, 100], pre: 0.6, act: 0.05, post: 0.5, cd: 1, own: 3.5, sfx: "poison", name: NM("Sporenwolke", "Spore Cloud") },
             { k: "heal", r: [0, 300], pre: 0.7, act: 0.05, post: 0.5, cd: 0.8, own: 7, amt: 0.2, sfx: "magic", name: NM("Verbundsporen", "Rapport Spores") },
             { k: "hit", r: [0, 28], pre: 0.5, act: 0.1, post: 0.5, cd: 1.2, box: [0, -20, 28, 20], sfx: "punch" }] },
    drider: { n: NM("Drider", "Drider"), shape: "drider", c: "#2a2236", t: "#4a3a5a", skin: "#4a3e5e", hair: "#eeeeff", w: 24, h: 26, hp: 3, dmg: 1.2, spd: 90, ai: "ranged", keep: [80, 180], sight: 240, gold: 18, heavy: true, poise: 0.35, snd: "insect", role: "kontrolle", kkDone: true, chain: 0.3,
      atks: [{ k: "thread", r: [30, 220], pre: 0.6, act: 0.05, post: 0.4, cd: 1, own: 4.5, sfx: "web", name: NM("Fadennetz", "Thread Snare") },
             { k: "shoot", proj: "e_bolzen", n: 3, spread: 0.18, r: [50, 240], pre: 0.65, act: 0.05, post: 0.5, cd: 2.2, sfx: "xbow", eff: { poison: 1 } },
             { k: "combo", r: [0, 34], pre: 0.45, act: 0.1, post: 0.45, cd: 1.1, box: [-6, -14, 40, 14], n: 2, gap: 0.2, sfx: "stab", eff: { poison: 1 } }] },
    /* Runenschmiede */
    rostmonster: { n: NM("Rostmonster", "Rust Monster"), shape: "rustmonster", c: "#a85a2a", t: "#d8a060", w: 20, h: 14, hp: 1.8, dmg: 0.9, spd: 120, ai: "charger", sight: 200, gold: 10, snd: "insect", role: "störer", kkDone: true, chain: 0.3,
      atks: [{ k: "hit", r: [0, 30], pre: 0.42, act: 0.12, post: 0.4, cd: 1, box: [0, -14, 30, 12], sfx: "insect", rust: 4, name: NM("Rostfühler", "Rusting Touch") },
             { k: "charge", r: [60, 200], pre: 0.55, act: 0.7, post: 0.5, cd: 3, box: [0, -14, 22, 14], spd: 300, sfx: "insect" }] },
    /* Zinnen */
    quasit: { n: NM("Quasit", "Quasit"), shape: "quasit", c: "#4a6a2a", t: "#ff8a3a", w: 10, h: 12, fly: true, ai: "flyer", keep: [50, 110], hp: 0.8, dmg: 0.95, spd: 125, demon: true, sight: 220, gold: 6, role: "flieger", kkDone: true, chain: 0.3,
      atks: [{ k: "invis", r: [60, 240], pre: 0.3, act: 0.05, post: 0.1, cd: 0.6, own: 5, sfx: "shadow", w: 0.6 },
             { k: "dive", r: [0, 140], pre: 0.5, act: 0.55, post: 0.45, cd: 1.5, box: [-2, -12, 16, 12], spd: 300, sfx: "claw", eff: { poison: 1 }, name: NM("Giftstachel", "Venom Sting") }] },
    gargoyle: { n: NM("Wasserspeier", "Gargoyle"), shape: "gargoyle", c: "#7a7068", t: "#ff8a3a", w: 16, h: 20, ai: "flyer", keep: [40, 90], hp: 2, armor: 0.3, dmg: 1.2, spd: 105, disguise: true, noSleep: true, heavy: true, sight: 160, gold: 12, immune: ["bleed", "poison"], metal: false, role: "hinterhalt", kkDone: true, chain: 0.3,
      atks: [{ k: "dive", r: [0, 150], pre: 0.55, act: 0.6, post: 0.5, cd: 1.6, box: [-2, -18, 20, 18], spd: 300, sfx: "rock", name: NM("Steinsturz", "Stone Plunge") },
             { k: "hit", r: [0, 28], pre: 0.45, act: 0.1, post: 0.45, cd: 1, box: [0, -18, 24, 16], sfx: "claw" }] },
    /* Schwarzer See */
    grindylow: { n: NM("Grindylow", "Grindylow"), shape: "grindylow", c: "#3a6a4a", t: "#c8d070", w: 14, h: 16, hp: 1.15, dmg: 1, spd: 85, ai: "walker", sight: 190, gold: 6, role: "kontrolle", kkDone: true, chain: 0.3,
      atks: [{ k: "pull", r: [40, 140], pre: 0.55, act: 0.4, post: 0.45, cd: 1, own: 3.5, sfx: "splash", glyph: "!!", tentacle: true, name: NM("Tentakelzug", "Tentacle Drag") },
             { k: "grab", r: [0, 22], pre: 0.55, act: 0.15, post: 0.6, cd: 1.2, own: 3.5, box: [0, -14, 22, 14], unblockable: true, glyph: "!!", sfx: "slime", name: NM("Umschlingen", "Entangle") },
             { k: "combo", r: [0, 24], pre: 0.35, act: 0.08, post: 0.4, cd: 1, box: [0, -14, 20, 12], n: 2, gap: 0.16, sfx: "bite" }] },
    /* Glutgassen */
    glutfledermaus: { n: NM("Glutfledermaus", "Ember Bat"), shape: "firebat", c: "#3a1a14", t: "#ff8a2a", w: 9, h: 7, fly: true, ai: "flyer", keep: [30, 70], hp: 0.4, dmg: 0.55, spd: 140, group: [3, 4], immune: ["burn"], glow: true, sight: 210, gold: 1, snd: "bat", role: "schwarm", kkDone: true, chain: 0.1,
      atks: [{ k: "dive", r: [0, 140], pre: 0.45, act: 0.55, post: 0.4, cd: 2.2, box: [-2, -8, 12, 8], spd: 290, sfx: "bat", swarmDive: true }] },
    salamander: { n: NM("Salamander", "Salamander"), shape: "salamander", c: "#a83a1a", t: "#ffb040", w: 14, h: 22, hp: 1.6, dmg: 1.15, spd: 85, ai: "walker", immune: ["burn"], glow: true, sight: 200, gold: 11, fireTrail: true, role: "nahkampf", kkDone: true, chain: 0.35,
      atks: [{ k: "lunge", r: [10, 56], pre: 0.45, act: 0.15, post: 0.45, cd: 1.3, box: [0, -18, 40, 10], lunge: 180, sfx: "spear" },
             { k: "hit", r: [0, 30], pre: 0.5, act: 0.12, post: 0.45, cd: 1.6, box: [-30, -8, 60, 10], sfx: "whip", name: NM("Schwanzfeger", "Tail Sweep") }] },
    /* Sturmspitze */
    saeureschnecke: { n: NM("Säureschnecke", "Acid Slug"), shape: "slug", c: "#8aa040", t: "#7a5a3a", w: 22, h: 16, hp: 2.8, dmg: 1.1, spd: 28, ai: "walker", heavy: true, poise: 0.5, armor: 0.15, immune: ["poison"], sight: 150, gold: 10, acidTrail: true, role: "tank", kkDone: true, chain: 0, blood: "#b8d060",
      atks: [{ k: "lob", proj: "e_gift", r: [40, 170], pre: 0.6, act: 0.05, post: 0.5, cd: 1.2, own: 2.4, sfx: "slime", name: NM("Säurespucke", "Acid Spit") },
             { k: "shell", r: [0, 60], pre: 0.25, act: 1.6, post: 0.3, cd: 0.6, own: 7, sfx: "rock", w: 0.7, name: NM("Ins Haus", "Withdraw") },
             { k: "hit", r: [0, 30], pre: 0.5, act: 0.12, post: 0.5, cd: 1.2, box: [0, -14, 30, 14], sfx: "slime", eff: { poison: 1 } }] },
    sturmMephit: { n: NM("Sturm-Mephit", "Storm Mephit"), shape: "mephit", c: "#6a7a62", t: "#f0f0b0", w: 11, h: 13, fly: true, ai: "flyer", keep: [70, 140], hp: 0.8, dmg: 0.9, spd: 110, sight: 230, gold: 6, role: "flieger", kkDone: true, chain: 0.2,
      atks: [{ k: "gust", r: [0, 110], pre: 0.6, act: 0.1, post: 0.5, cd: 1, own: 3.2, sfx: "swing", name: NM("Sturmböe", "Gale") },
             { k: "mark", hz: "strike", r: [40, 240], pre: 0.5, act: 0.05, post: 0.5, cd: 2.8, warn: 0.8, hw: 20, sfx: "zap", col: "rgba(255,245,180,1)", name: NM("Blitz", "Lightning") }] }
  });
  /* Wasserspeier: nach dem Erwachen fliegt er (eigene Def., nicht im Bestiarium) */
  const GARG_FLY = Object.assign({}, E.gargoyle, { fly: true, disguise: false });
  /* W10: Abwechslung für eintönige Arten – je eine zusätzliche Spielart */
  E.ratte.fetch = true; /* Ratten fliehen zu ahnungslosen Kameraden und holen Hilfe */
  E.stirge.atks[0].latch = true; /* Stirges saugen sich fest – Rollen oder Treffer lösen sie */
  E.phiole.atks.push({ k: "lob", proj: "e_gift", r: [60, 150], pre: 0.6, act: 0.05, post: 0.5, cd: 3, dmg: 0.4, sfx: "slime", name: NM("Spritzer", "Splash"), w: 0.6 });
  E.zombieBlaeh.atks.push({ k: "spray", len: 46, col: "rgba(150,190,60,.6)", eff: { poison: 1 }, r: [20, 60], pre: 0.7, act: 0.6, post: 0.6, cd: 4, sfx: "slime", name: NM("Rülpser", "Belch"), w: 0.7 });
  E.brutsack.atks.push({ k: "spray", len: 40, col: "rgba(200,190,170,.55)", eff: { poison: 1 }, r: [0, 40], pre: 0.7, act: 0.5, post: 0.6, cd: 3.5, sfx: "slime", name: NM("Platzen", "Burst Spray"), w: 1.2 });
  E.glutling.atks.push({ k: "lob", proj: "e_glut", r: [50, 150], pre: 0.6, act: 0.05, post: 0.5, cd: 3, dmg: 0.6, sfx: "fire", name: NM("Glutspucke", "Ember Spit"), w: 0.5 });

  /* Elite-Eigenschaften */
  const ELITE = { schnell: ["Flink", "Swift"], beschwoerer: ["Rufer", "Caller"], gepanzert: ["Gepanzert", "Armoured"], wuetend: ["Wütend", "Furious"], teleport: ["Schattenhaft", "Shadowy"] };

  /* ======================= ERZEUGEN ======================= */
  Z.spawnEnemy = function (id, x, y, o) {
    const d = E[id] || (Z.BOSSDEF && Z.BOSSDEF[id]); if (!d) return null;
    o = o || {};
    const run = Z.run || { tier: 0, skulls: 0 };
    const tier = o.tier != null ? o.tier : run.tier;
    const size = d.size || 1;
    const e = {
      id, def: d, x: x - (d.w || 12) / 2, y: y - (d.h || 20), w: d.w || 12, h: d.h || 20, vx: 0, vy: 0, face: Z.R() < 0.5 ? -1 : 1,
      hp: 0, hpMax: 0, state: "idle", t: 0, cd: 0.6 + Z.R() * 0.8, act: null, aware: false, st: {}, flash: 0, onGround: false, patrol: Z.R() * 2, anim: Z.R() * 10,
      elite: false, size, tier, home: { x, y }, lostT: 0, dotBase: 3 + tier * 2.5, uses: {}, spawnT: 0.35, noPlat: false
    };
    let hp = HP * (d.hp || 1) * Z.BAL.enemyHp(tier) * Z.BAL.skullHp(run.skulls || 0);
    e.dmgMul = DMG * (d.dmg || 1) * Z.BAL.enemyDmg(tier) * Z.BAL.skullDmg(run.skulls || 0);
    if (o.elite) {
      e.elite = Z.R.pick(Object.keys(ELITE));
      hp *= 4.6 /* W9: 3,4 → 3,8 (Elites fielen in 0,4–7 s); 3. Runde → 4,2 (K6: 1–6 s); 4. Runde → 4,6 (K7: 0,6–6,6 s) */; e.dmgMul *= 1.3; e.size *= 1.18; e.w = Math.round(e.w * 1.18); e.h = Math.round(e.h * 1.18); e.x = x - e.w / 2; e.y = y - e.h;
      if (e.elite === "gepanzert") e.armorUp = 0;
    }
    if (d.boss) hp = HP * d.hp * Z.BAL.enemyHp(tier) * Z.BAL.skullHp(run.skulls || 0) * (Z.BAL.bossHp ? Z.BAL.bossHp(tier, id) : 1); /* W6: bossHp aus ausgleich.js */
    e.hp = e.hpMax = Math.round(hp);
    e.ghost = !!d.ghost;
    if (d.fly) { e.baseY = e.y; }
    if (d.ai === "ceiling") {
      /* an die Decke hängen */
      for (let yy = e.y; yy > e.y - 200; yy -= 4) if (W.solidAt(x, yy - 2)) { e.y = yy; e.ceil = true; break; }
    }
    Z.enemies.push(e);
    if (d.init) d.init(e);
    if (d.disguise) { e.disguise = true; e.revealed = false; } /* W10: Mimik / Wasserspeier */
    return e;
  };

  /* ======================= UPDATE ======================= */
  Z.updateEnemies = function (dt) {
    const P = Z.player;
    /* W8: Sichtfaktor (Dunkelheit/Nebel) einmal je Bild, Lärm verarbeiten */
    PM = sightMul();
    if (P) w10Frame(dt, P);
    if (P) playerNoise(P, dt);
    if (noiseQ.length) hearAll();
    const lean = !!(Z.gq && Z.gq.lean);
    for (let i = Z.enemies.length - 1; i >= 0; i--) {
      const e = Z.enemies[i];
      if (e.dead) { e.deadT += dt; if (e.deadT > (e.def.boss ? 99 : 0.6)) Z.enemies.splice(i, 1); continue; }
      /* Schutz: ungültige Position (NaN aus Rückstoß/Teilung durch 0) auf den letzten gültigen Stand zurücksetzen */
      if (!isFinite(e.x) || !isFinite(e.y)) {
        if (!Z._nanWarn) { Z._nanWarn = 1; console.warn("Gegner mit ungültiger Position zurückgesetzt:", e.id); }
        if (e._okx != null) { e.x = e._okx; e.y = e._oky; } else { e.dead = true; e.deadT = 99; continue; }
        e.vx = 0; e.vy = 0;
      } else { if (!isFinite(e.vx)) e.vx = 0; if (!isFinite(e.vy)) e.vy = 0; e._okx = e.x; e._oky = e.y; }
      /* weit weg: schlafen lassen (Leistung) */
      const far = Math.abs(e.x - P.x) > 520 || Math.abs(e.y - P.y) > 360;
      /* Handheld: auch wache Gegner ruhen, wenn sie weit außerhalb des Bildes sind (über 1,5 Bildbreiten) – wie in Dead Cells */
      e._rest = far && !e.def.boss && (!e.aware || (lean && (Math.abs(e.x - P.x) > 760 || Math.abs(e.y - P.y) > 480)));
      if (e._rest) continue;
      e.anim += dt; e.flash = Math.max(0, e.flash - dt); e.spawnT = Math.max(0, e.spawnT - dt);
      if (e.invuln > 0) e.invuln -= dt;
      if (e.broken > 0) { e.broken -= dt; if (e.broken <= 0) e.guard = 0; }
      if (e.armorUp > 0) e.armorUp -= dt;
      if (e.hidden > 0) e.hidden -= dt; if (e.pile > 0) e.pile -= dt;
      Z.statusTick(e, dt, false);
      if (e.dead) continue;
      if (e.def.boss && e.def.update) { e.def.update(e, dt, P); continue; }
      think(e, dt, P);
    }
    /* Trennung, damit sich Gegner nicht stapeln */
    for (let i = 0; i < Z.enemies.length; i++) {
      const a = Z.enemies[i]; if (a.dead || a.def.fly || a.def.boss || a._rest) continue;
      for (let j = i + 1; j < Z.enemies.length; j++) {
        const b = Z.enemies[j]; if (b.dead || b.def.fly || b.def.boss || b._rest) continue;
        if (Math.abs(a.y - b.y) > 10) continue;
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2), min = (a.w + b.w) * 0.42;
        if (Math.abs(dx) < min) { const push = (min - Math.abs(dx)) * 0.5 * (U.sign(dx) || 1); if (!a.act) a.x -= push * 0.5; if (!b.act) b.x += push * 0.5; }
      }
    }
  };

  /* ======================= WAHRNEHMUNG (W8) =======================
     Zustände: schlafend (leben.js) → ruhig/patrouillierend → misstrauisch („?“: hat etwas gehört oder kurz gesehen, sucht
     die Stelle ab und beruhigt sich nach einigen Sekunden) → alarmiert (e.aware, „!“). Nur Alarmierte greifen an und
     verfolgen. Sehen nur mit Sichtlinie über das Kachelraster; Sichtweite je Art, nach vorn weit, nach hinten kurz;
     Finsternis/Dunkelheit und Nebel verkürzen sie, Ducken auch. Ganz nah (≈2,5 Kacheln) bemerkt jeder etwas.
     Hören: Kampflärm, Explosionen, zerschlagene Ausstattung, Fallen, harte Landungen (Z.noise; Geräusche mit Ort
     über A.play) – im Radius, durch Wände gedämpft. Wer selbst entdeckt, ruft nach kurzer Verzögerung (Ruf-Ring):
     Verbündete mit Sichtlinie werden alarmiert, hinter Wänden nur misstrauisch. Alarm-Situationen (Hinterhalt,
     Prüfung, Ereignisse, Mini-Bosse, Beschworene, Bossarenen) bleiben alarmiert.
     Leistung: Sichtprüfung je Gegner etwa 8× pro Sekunde (versetzt), ruhende und schlafende Gegner werden nicht geprüft. */
  const NEAR = 40, LOSE_T = 4, SUS_T = 5, PERC_DT = 0.12;
  let PM = 1;
  function sightMul() {
    let m = 1;
    if (Z.darkness > 0) m *= 0.55;
    const wt = Z.wetter && Z.wetter(); if (wt && wt.mood === "nebel") m *= 0.75;
    if (Z.hasPact && Z.hasPact("finster")) m *= 0.9;
    return m;
  }
  Z.enemySightMul = () => PM;
  const locked = e => !!(e.alarmLock || e.ambush || e.trial || e.nmEvent || e.nm || e.nmHunter || e.master || e.def.boss);
  /* 0 = nichts, 1 = gespürt (ganz nah ohne Sicht), 2 = gesehen; setzt e._los (Sichtlinie zum Spieler, für Angriffe) */
  function perceive(e, P) {
    const ex = e.x + e.w / 2, pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
    const dx = pcx - ex, dy = pcy - (e.y + e.h / 2), dist = Math.hypot(dx, dy);
    if (dist > 560) { e._los = false; return 0; }
    const los = W.los(ex, e.y + 4, pcx, P.y + 6) || W.los(ex, e.y + e.h / 2, pcx, pcy);
    e._los = los;
    if (P.dead || P.invis > 0) return 0;
    if (dist < NEAR) return los ? 2 : 1;
    const d = e.def;
    if (d.blind) { /* W10: blind (Grimlock, Gallertwürfel) – „sieht“ nur Nahes und Lautes, Dunkelheit egal */
      if (!los && dist > 60) return 0;
      const loud = (!P.crouch && Math.abs(P.vx) > 120) || (P.act && P.act.phase === "act") || P.rollT > 0;
      return dist <= (e.aware ? (loud ? 260 : 120) : (loud ? 150 : 60)) * (d.ears || 1) ? 2 : 0;
    }
    if (!los) return 0;
    let range = (d.sight || 180) * (LIT ? Math.max(PM, 1) * 1.25 : PM); /* W10: im Laternenlicht hilft die Dunkelheit nicht */
    if (e.aware) range *= 1.7;
    else {
      const sus = e.sus > 0, front = dx * (e.face || 1) > -8;
      range *= front ? (e.watch ? 1.25 : 1) * (sus ? 1.2 : 1) : (sus ? 0.6 : 0.35);
      if (P.crouch && !LIT) range *= 0.7;
      if (!d.fly && Math.abs(dy) > (sus ? 140 : 90)) return 0;
    }
    return dist <= range ? 2 : 0;
  }
  function suspect(e, x, y, t) {
    if (!e || e.dead || e.aware || e.sleep || e.def.boss) return;
    const fresh = !(e.sus > 0);
    e.sus = Math.max(e.sus || 0, t || SUS_T); e.susX = x; e.susY = y; e.susStill = 0;
    if (fresh) { e.qPop = 0; const s = U.sign(x - (e.x + e.w / 2)); if (s) e.face = s; }
    if (fresh && e.def.crow) { /* W10: Kenku krächzt „Wer da?“ mit fremder Stimme – Nachbarn werden auch misstrauisch */
      crowCall(e, 0.35); FX.text(e.x + e.w / 2, e.y - 10, L(["„Wer da?“", "\"Who's there?\""]), "#e8d8b0");
      for (const o of Z.enemies) if (o !== e && !o.dead && !o.aware && !o.sleep && !o.disguise && !o.def.boss && Math.abs(o.x - e.x) < 200 && Math.abs(o.y - e.y) < 80) suspect(o, x, y, t);
    }
  }
  function alarm(e, how) {
    if (!e || e.dead) return;
    if (e.sleep) { if (Z.leben && Z.leben.wake) Z.leben.wake(e, how === "noise"); else e.sleep = false; }
    if (e.aware) return;
    e.aware = true; e.sus = 0; e.lostSight = 0;
    e.alertT = how === "call" ? 0.25 + Z.R() * 0.2 : how === "noise" ? 0.35 : 0.5;
    const P = Z.player; if (P) { const s = U.sign(P.x - e.x); if (s) e.face = s; }
    if (!KG(e, "alarm") && e.def.snd && Z.R() < 0.6) A.play(e.def.snd, { x: e.x, y: e.y, vol: 0.4 });
  }
  Z.enemyAlarm = alarm; Z.enemySuspect = suspect;
  /* Ruf: Verbündete mit Sichtlinie werden (leicht verzögert) alarmiert, gedämpft hinter Wänden nur misstrauisch */
  function shout(e) {
    const CR = e.def.callR || 230;
    if (e.def.bell) { if (!KG(e, "glocke")) { A.play("bell", { x: e.x, y: e.y, vol: 0.6, rate: 0.9 }); A.play("bell", { x: e.x, y: e.y, vol: 0.45, rate: 0.9, delay: 0.5, gap: 0 }); } FX.ring(e.x + e.w / 2, e.y + e.h / 2, 60, "#e8c070", 0.7, 2); FX.ring(e.x + e.w / 2, e.y + e.h / 2, 110, "#c8962a", 0.9, 1.5); }
    if (e.def.crow) crowCall(e, 0.55);
    if (e.def.lantern) { FX.ring(e.x + e.w / 2, e.y + e.h / 2, 50, "#ffd27a", 0.5, 2); }
    const ex = e.x + e.w / 2, ey = e.y + 6, P = Z.player;
    const lx = e.lkx != null ? e.lkx : P ? P.x + P.w / 2 : ex, ly = e.lky != null ? e.lky : P ? P.y + P.h : e.y + e.h;
    let n = 0;
    for (const o of Z.enemies) {
      if (o === e || o.dead || o.aware || o.def.boss || o._rest || o.pendAl > 0 || o.disguise) continue;
      const ox = o.x + o.w / 2, oy = o.y + 6, d = Math.hypot(ox - ex, (oy - ey) * 1.3);
      if (d > CR) continue;
      if (d < 60 || e.def.callWall || W.los(ex, ey, ox, oy)) { o.pendAl = 0.22 + Z.R() * 0.35; o.called = true; n++; }
      else if (d < 160 && !o.sleep) suspect(o, lx, ly, SUS_T);
    }
    if (n) {
      FX.ring(ex, e.y + 2, 30, "#ffb070", 0.45, 2); FX.ring(ex, e.y + 2, 18, "#ff8a5a", 0.3, 1.5);
      FX.text(ex, e.y - 14, L(["Alarm!", "Alarm!"]), "#ff8a6a");
      A.play(e.def.undead ? "undead" : "monster", { vol: 0.3, x: e.x, rate: 0.85 });
    }
  }
  /* ---------- Lärm ---------- */
  const NOISE = { explode: 340, quake: 260, hitHeavy: 210, crit: 200, hitMetal: 180, hitFlesh: 160, hitBone: 160, block: 140, parry: 170, glass: 210, crate: 210, "break": 210,
    rock: 170, swingHeavy: 120, slash: 90, swing: 80, whip: 100, punch: 110, chain: 130, arrowHit: 110, fireBig: 150, horn: 320, gong: 400, door: 170, roar: 200 };
  const noiseQ = [];
  /* Z.noise(x, y, Radius, {alarm}) – auch für andere Module (Fallen, Ereignisse) */
  Z.noise = (x, y, r, o) => {
    if (!(r > 0) || !isFinite(x) || !isFinite(y)) return;
    for (const n of noiseQ) if (Math.abs(n.x - x) < 24 && Math.abs(n.y - y) < 24) { n.r = Math.max(n.r, r); n.alarm = n.alarm || !!(o && o.alarm); return; }
    if (noiseQ.length < 10) noiseQ.push({ x, y, r, alarm: !!(o && o.alarm) });
  };
  { const play0 = A.play;
    if (play0 && !play0.__laerm) {
      const pw = function (name, o) {
        const r = NOISE[name];
        if (r && o && o.x != null && Z.player) { const P = Z.player, v = o.vol == null ? 1 : o.vol; Z.noise(o.x, o.y != null ? o.y : P.y + P.h / 2, r * U.clamp(0.55 + v * 0.6, 0.6, 1.15)); }
        return play0.apply(this, arguments);
      };
      pw.__laerm = true; A.play = pw;
    } }
  function hearAll() {
    for (const n of noiseQ) {
      for (const e of Z.enemies) {
        if (e.dead || e.aware || e._rest || e.def.boss || e.spawnT > 0 || e.disguise) continue;
        const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = Math.hypot(ex - n.x, (ey - n.y) * 1.25) / (e.def.ears || 1);
        if (d > n.r) continue;
        const clear = W.los(n.x, n.y - 3, ex, e.y + 4) || W.los(n.x, n.y - 3, ex, ey);
        if (!clear && d * 2.2 > n.r) continue; /* durch Wände gedämpft */
        if (e.sleep) { if (n.r >= 200 && d < n.r * 0.6 && Z.leben && Z.leben.wake) Z.leben.wake(e, false); continue; }
        if ((n.alarm || n.r >= 300) && clear && d < n.r * 0.5) { alarm(e, "noise"); e.lkx = n.x; e.lky = n.y; continue; }
        suspect(e, n.x, n.y, SUS_T);
      }
    }
    noiseQ.length = 0;
  }
  /* Ezekiels eigener Lärm: Rennen (nicht geduckt) und harte Landungen */
  let stepT = 0;
  function playerNoise(P, dt) {
    if (!P || P.dead) return;
    if (P.justLanded && P.landV > 430) Z.noise(P.x + P.w / 2, P.y + P.h, U.clamp((P.landV - 300) * 0.45, 60, 170));
    stepT -= dt;
    if (stepT <= 0) { stepT = 0.3; if (P.onGround && !P.crouch && Math.abs(P.vx) > 150) Z.noise(P.x + P.w / 2, P.y + P.h - 4, 58); }
  }
  /* je Gegner und Bild: Wahrnehmung, Misstrauen, Ruf, Spur verlieren */
  function senses(e, dt, P) {
    const d = e.def;
    if (e.sleep || e.disguise) { e._los = false; return false; }
    e.seeT = (e.seeT == null ? Z.R() * PERC_DT : e.seeT) - dt;
    if (e.seeT <= 0) { e.seeT = PERC_DT + Z.R() * 0.04; e._pv = perceive(e, P); }
    const pv = e.lostT > 0 ? 0 : e._pv || 0, sees = pv === 2;
    if (e.lostT > 0) e.lostT -= dt;
    if (sees) { e.lkx = P.x + P.w / 2; e.lky = P.y + P.h; e.lostSight = 0; }
    /* Ruf-Alarm von einem Kameraden */
    if (e.pendAl > 0) { e.pendAl -= dt; if (e.pendAl <= 0 && !e.aware) { alarm(e, "call"); FX.text(e.x + e.w / 2, e.y - 10, "?!", "#e8c890"); } }
    if (!e.aware) {
      if (sees) alarm(e, "sight");
      else if (pv === 1) suspect(e, P.x + P.w / 2, P.y + P.h, SUS_T);
    } else if (!sees) {
      e.lostSight = (e.lostSight || 0) + dt;
      if (!locked(e) && (e.lostSight > LOSE_T || P.invis > 0 || e.lostT > 0)) {
        e.aware = false; e.alertT = 0; e.called = false; e._wasAware = false; e.surprised = false; /* beruhigt sich → kann wieder überrumpelt werden */
        suspect(e, e.lkx != null ? e.lkx : P.x + P.w / 2, e.lky != null ? e.lky : P.y + P.h, SUS_T);
      }
    }
    /* frisch alarmiert (egal wodurch: gesehen, getroffen, Hinterhalt) → einmal rufen; Gerufene rufen nicht weiter */
    if (e.aware && !e._wasAware) {
      e.sus = 0; if (e.watch) e.watch = false;
      if (!e.called && !d.boss && !e.master) { e.callT = 0.3 + Z.R() * 0.2; }
      e.called = true; /* leben.js-Ruf (ohne Sichtlinie) übernehmen wir hier */
      if (e.lkx == null) { e.lkx = P.x + P.w / 2; e.lky = P.y + P.h; }
    }
    e._wasAware = e.aware;
    if (e.callT > 0) { e.callT -= dt; if (e.callT <= 0 && e.aware) shout(e); }
    return sees;
  }
  /* Misstrauisch: zur gehörten/gesehenen Stelle gehen, umsehen, nach einer Weile beruhigen */
  function search(e, dt) {
    const d = e.def;
    e.sus -= dt; e.qPop = (e.qPop || 0) + dt;
    if (e.sus <= 0) { e.sus = 0; e.pDir = 0; e.patrol = 0.8 + Z.R(); return false; }
    const dx = e.susX - (e.x + e.w / 2);
    if (d.fly) {
      e.vx = U.approach(e.vx, U.clamp(dx / 40, -1, 1) * d.spd * 0.45, 300 * dt);
      e.vy = U.approach(e.vy, U.clamp((e.susY - 34 - (e.y + e.h / 2)) / 40, -1, 1) * d.spd * 0.3, 300 * dt);
      if (Math.abs(dx) > 6) e.face = U.sign(dx);
      const ob = e.ghost; if (d.ai === "phase") e.ghost = true; e.noPlat = true; Z.moveBody(e, dt); e.ghost = ob;
      return true;
    }
    if (d.ai === "turret" || e.ceil || e.watch || d.spd === 0) {
      if (Math.abs(dx) > 6) e.face = U.sign(dx);
      if (!e.ceil) { e.vx = U.approach(e.vx, 0, 900 * dt); e.vy += (Z.ENEMY_GRAV || 1400) * dt; Z.moveBody(e, dt); }
      return true;
    }
    let dir = 0;
    if (Math.abs(dx) > 14 && e.susStill < 0.7) {
      dir = U.sign(dx); const x0 = e.x;
      moveToward(e, dt, dir, 0.6); e.face = dir;
      if (Math.abs(e.x - x0) < 0.2) e.susStill += dt; else e.susStill = 0;
    } else {
      /* angekommen (oder kommt nicht weiter): umsehen */
      e.susStill = Math.max(e.susStill, 0.7);
      e.lookT = (e.lookT || 0) - dt; if (e.lookT <= 0) { e.lookT = 0.8 + Z.R() * 0.6; e.face = -(e.face || 1); }
      moveToward(e, dt, 0, 0);
    }
    return true;
  }

  function think(e, dt, P) {
    const d = e.def;
    const st = e.st;
    if (e.disguise) { disguiseTick(e, dt, P); return; }
    if (e.latchT > 0 && latchTick(e, dt, P)) return;
    /* Rückstoß-Phase */
    if (e.kbT > 0) {
      e.kbT -= dt;
      if (!d.fly) e.vy += (Z.ENEMY_GRAV || 1400) * dt;
      e.vx *= Math.pow(0.02, dt);
      if (d.fly) { e.vy *= Math.pow(0.02, dt); }
      Z.moveBody(e, dt);
      if (e.wallSlam > 0) { e.wallSlam -= dt; if (e.hitWall) { e.wallSlam = 0; FX.addShake(5); A.play("hitHeavy", { x: e.x }); FX.burst(e.x + e.w / 2, e.y + e.h / 2, 12, { col: Z.dustCol || "#8a7a70", sp: 120, life: 0.4, size: 3, kind: "shard", g: 400 }); Z.hitEnemy(e, Z.dmgOf(P, null, 30), { crit: true, src: "wall" }); if (Z.metaLvl("riesenkeule") >= 3) Z.addStatus(e, "stun", 2); } }
      return;
    }
    if (st.stun > 0 || e.stagger > 0) {
      if (e.stagger > 0) e.stagger -= dt;
      if (!d.fly) { e.vy += (Z.ENEMY_GRAV || 1400) * dt; e.vx = U.approach(e.vx, 0, 800 * dt); } else { e.vx *= 0.9; e.vy = U.approach(e.vy, d.fly && st.stun > 0 ? 60 : 0, 300 * dt); }
      Z.moveBody(e, dt);
      return;
    }
    /* Wahrnehmung (W8: siehe senses) */
    senses(e, dt, P);
    if (e.alertT > 0) e.alertT -= dt;
    e.cd -= dt;
    if (e.ocd) for (const k in e.ocd) e.ocd[k] -= dt; /* W10: eigene Abklingzeiten einzelner Fähigkeiten */
    const tgt = e.decoy && !e.decoy.dead ? { x: e.decoy.x, y: e.decoy.y, w: e.decoy.w, h: e.decoy.h } : P;
    const dx = tgt.x + tgt.w / 2 - (e.x + e.w / 2), dy = (tgt.y + tgt.h) - (e.y + e.h), adx = Math.abs(dx);
    /* laufender Angriff */
    if (e.act) { runAct(e, dt, P, tgt); return; }
    /* Decken-Spinne */
    if (e.ceil) {
      if (e.aware && adx < 60 && dy > 0) { e.ceil = false; e.vy = 50; A.play("insect", { x: e.x, vol: 0.5 }); }
      else { e.vx = 0; e.vy = 0; return; }
    }
    /* Angst */
    if (st.fear > 0) { moveToward(e, dt, -U.sign(dx), 1.1); return; }
    if (!e.aware || e.alertT > 0) { idle(e, dt); return; }
    if (st.root > 0) { e.vx = 0; if (!d.fly) { e.vy += (Z.ENEMY_GRAV || 1400) * dt; Z.moveBody(e, dt); } faceTo(e, dx); tryAttack(e, dx, dy, adx, P, true); return; }
    faceTo(e, dx);
    /* Angriff auswählen */
    if (d.fetch && fetchHelp(e, dt, P)) return;
    if (tryAttack(e, dx, dy, adx, P)) return;
    if (stuckBelow(e, dt, P, dx, dy, adx)) return;
    /* Bewegung je nach Verhalten */
    const ai = d.ai;
    if (d.fly) { flyMove(e, dt, tgt, dx, dy); return; }
    let dir = 0, spd = 1;
    switch (ai) {
      case "walker": case "shielder": case "charger": dir = adx > 22 ? U.sign(dx) : 0; break;
      case "skirmish": { e.sk = (e.sk || 0) - dt; if (e.sk <= 0) { e.sk = 0.6 + Z.R() * 0.8; e.skDir = adx < 30 ? -U.sign(dx) : Z.R() < 0.75 ? U.sign(dx) : -U.sign(dx); } dir = e.skDir; spd = 1.05; if (e.onGround && Z.R() < dt * 0.8) e.vy = -260; break; }
      case "pack": { const off = (e.id.length + (e.x | 0)) % 2 ? 40 : -40; dir = adx > 30 ? U.sign(dx + (adx > 80 ? off : 0)) : 0; break; }
      case "swarm": dir = adx > 8 ? U.sign(dx) : 0; spd = 1; if (e.onGround && Z.R() < dt * 1.2) e.vy = -200; break;
      case "ranged": case "caster": { const [mn, mx] = d.keep || [90, 200]; if (adx < mn) dir = -U.sign(dx); else if (adx > mx) dir = U.sign(dx); else dir = 0; spd = adx < mn ? 1.1 : 0.8; break; }
      case "duelist": { if (adx > 90) dir = U.sign(dx); else if (adx < 40) dir = -U.sign(dx); else dir = (Math.sin(e.anim * 2) > 0 ? 1 : -1); spd = 0.9; break; }
      case "drunk": { dir = Math.sin(e.anim * 1.7) > -0.3 ? U.sign(dx) : -U.sign(dx); spd = 0.7 + Math.sin(e.anim * 3.1) * 0.4; break; }
      case "exploder": dir = U.sign(dx); spd = 1.15; break;
      case "jumper": dir = !e.onGround && Math.abs(e.vx) > 20 ? U.sign(e.vx) : 0; if (e.onGround) { e.hopT = (e.hopT || 0) - dt; if (e.hopT <= 0) { e.hopT = 0.6 + Z.R() * 0.5; e.vy = -220; e.vx = U.sign(dx) * d.spd; } } break;
      case "turret": dir = 0; break;
      case "support": { const r = supportMove(e, dx, adx); dir = r[0]; spd = r[1]; break; }
      case "guard": dir = guardMove(e, dx, adx, P); spd = 1; break;
    }
    moveToward(e, dt, dir, spd);
  }
  function faceTo(e, dx) { if (Math.abs(dx) > 4) e.face = U.sign(dx); }
  function idle(e, dt) {
    const d = e.def;
    if (e.sus > 0 && !e.aware && search(e, dt)) return;
    if (d.fly) { e.vx = Math.sin(e.anim * 0.8) * 20; e.vy = Math.cos(e.anim * 1.3) * 12; Z.moveBody(e, dt); return; }
    if (d.ai === "turret") { e.vx = 0; e.vy += (Z.ENEMY_GRAV || 1400) * dt; Z.moveBody(e, dt); return; }
    e.patrol -= dt;
    if (e.patrol <= 0) { e.patrol = 1.5 + Z.R() * 2.5; e.pDir = Z.R() < 0.4 ? 0 : Z.R() < 0.5 ? -1 : 1; if (e.pDir) e.face = e.pDir; /* W8: schaut, wohin es geht */ }
    moveToward(e, dt, e.pDir || 0, 0.35);
    if (e.pDir) e.face = e.pDir;
  }
  /* Laufen mit Kantenprüfung */
  function moveToward(e, dt, dir, spd) {
    const d = e.def;
    if (d.ai === "turret" || d.spd === 0) dir = 0;
    if (e.st.slow > 0) spd *= 0.55;
    if (e.elite === "schnell") spd *= 1.35;
    if (e.rageT > 0) spd *= 1.22;
    if (dir && e.onGround) {
      /* nicht über Kanten laufen (außer kleine Stufen) und nicht in Gefahren */
      const ahead = dir > 0 ? e.x + e.w + 2 : e.x - 2, tx = Math.floor(ahead / T), ty = Math.floor((e.y + e.h + 2) / T);
      let ground = false;
      for (let k = 0; k < 3; k++) { const v = W.tile(tx, ty + k); if (W.solidT(v) || W.isPlat(tx, ty + k)) { ground = true; break; } if ([3, 5, 6, 9].includes(v)) break; }
      const hazard = [3, 5, 6, 9].includes(W.tile(tx, ty)) || [3, 5, 6, 9].includes(W.tile(tx, ty - 1));
      if (!ground || hazard) { dir = 0; if (!e.aware) e.pDir = -(e.pDir || 1); }
      /* Lücke: wenn dahinter Boden auf gleicher Höhe liegt und der Spieler dort ist, hinüberspringen */
      if (!ground && e.aware && !hazard && e.def.ai !== "turret" && !(e.jT > 0)) {
        const P = Z.player;
        if (P && U.sign(P.x - e.x) === dir) for (let g = 2; g <= 5; g++) { const gx = tx + dir * g; if ((W.solidT(W.tile(gx, ty)) || W.isPlat(gx, ty)) && !W.solidT(W.tile(gx, ty - 1)) && !W.solidT(W.tile(gx, ty - 2))) { e.vy = -340; e.vx = dir * Math.max(d.spd * 1.6, 120 + g * 22); e.jT = 0.9; Z.moveBody(e, dt); return; } }
      }
      /* kleine Wand: hochspringen, wenn der Spieler oben ist */
      if (dir && W.solidT(W.tile(tx, Math.floor((e.y + e.h - 4) / T))) && !W.solidT(W.tile(tx, Math.floor((e.y + e.h - 20) / T))) && e.aware) e.vy = -300;
    }
    e.vx = U.approach(e.vx, dir * d.spd * spd, 1400 * dt);
    e.vy += (Z.ENEMY_GRAV || 1400) * dt; if (e.vy > 620) e.vy = 620;
    if (e.jT > 0) e.jT -= dt;
    if (e.aware && e.onGround && d.ai !== "turret" && d.ai !== "jumper" && !(e.jT > 0)) climbOrDrop(e);
    if (e.dropT > 0) { e.dropT -= dt; e.noPlat = true; }
    Z.moveBody(e, dt);
    if (e.hitWall && !e.aware) e.pDir = -e.hitWall;
    if (dir) e.face = e.st.fear > 0 ? dir : e.face;
  }
  /* Dem Spieler nach oben auf Stege und Absätze folgen, nach unten durch Stege fallen */
  function climbOrDrop(e) {
    const P = Z.player; if (!P || P.dead) return;
    const ex = e.x + e.w / 2, ey = e.y + e.h, px = P.x + P.w / 2, py = P.y + P.h, dx = px - ex, dy = py - ey;
    if (dy < -24 && Math.abs(dx) < 120 && P.onGround) {
      const tx0 = Math.floor(ex / T), ty0 = Math.floor((ey - 1) / T);
      for (let up = 2; up <= 5; up++) for (const off of [0, 1, -1, 2, -2, 3, -3]) {
        const tx = tx0 + off * (U.sign(dx) || 1), ty = ty0 - up;
        const stand = (W.solidT(W.tile(tx, ty + 1)) || W.isPlat(tx, ty + 1)) && !W.solidT(W.tile(tx, ty)) && !W.solidT(W.tile(tx, ty - 1));
        if (!stand) continue;
        let clear = true; for (let k = 1; k <= up + 1; k++) if (W.solidT(W.tile(tx0, ty0 - k))) { clear = false; break; }
        if (!clear) continue;
        const h = (up + 0.6) * T, g = Z.ENEMY_GRAV || 1400;
        e.vy = -Math.sqrt(2 * g * h); e.vx = ((tx + 0.5) * T - ex) / (2 * h / Math.sqrt(2 * g * h)) ; e.jT = 1.1;
        e.face = U.sign(dx) || e.face; return;
      }
      e.jT = 0.6;
    } else if (dy > 24 && Math.abs(dx) < 90 && e.onPlat) { e.dropT = 0.25; e.jT = 0.6; }
  }
  function flyMove(e, dt, tgt, dx, dy) {
    const d = e.def, [mn, mx] = d.keep || [40, 90];
    const want = Math.hypot(dx, dy);
    let ax = 0, ay = 0;
    const hx = tgt.x + tgt.w / 2 - Math.sign(dx || 1) * U.lerp(mn, mx, 0.5) - (e.x + e.w / 2), hy = tgt.y - 40 + Math.sin(e.anim * 2) * 16 - (e.y + e.h / 2);
    ax = U.clamp(hx * 3, -d.spd, d.spd); ay = U.clamp(hy * 3, -d.spd, d.spd);
    if (d.ai === "phase") { ax = U.clamp(dx * 2, -d.spd, d.spd); ay = U.clamp((dy - 20) * 2, -d.spd, d.spd); }
    e.vx = U.approach(e.vx, ax, 500 * dt); e.vy = U.approach(e.vy, ay, 500 * dt);
    const ob = e.ghost; if (d.ai === "phase") e.ghost = true;
    e.noPlat = true; Z.moveBody(e, dt); e.ghost = ob;
  }

  /* ======================= ANGRIFFE ======================= */
  function tryAttack(e, dx, dy, adx, P, rooted) {
    if (e.cd > 0 || e.spawnT > 0) return false;
    const d = e.def;
    const opts = [];
    for (const a of d.atks || []) {
      if (a.once && e.uses[a.k]) continue;
      if (a.own && e.ocd && e.ocd[a.k] > 0) continue;
      if (rooted && ["lunge", "leap", "charge", "dive", "teleport"].includes(a.k)) continue;
      if (adx < a.r[0] || adx > a.r[1]) continue;
      const maxDy = a.dy != null ? a.dy : a.k === "leap" ? 90 : a.k === "dive" ? 200 : ["shoot", "lob", "mark", "summon", "heal", "shield", "teleport", "grow", "invis", "beam", "volley", "web", "pull", "drum", "flare", "brace", "shell", "smoke", "spores", "thread", "toll", "gust"].includes(a.k) ? 160 : 28;
      if (Math.abs(dy) > maxDy && !(d.fly && a.k !== "hit")) continue;
      if (a.k === "summon" && countMinions(e) >= (a.max || 4)) continue;
      if (a.k === "heal" && !Z.enemies.some(o => !o.dead && o !== e && !o.def.boss && o.hp < o.hpMax * 0.7 && U.dist(o.x, o.y, e.x, e.y) < 260)) continue;
      /* W8: kein Angriff ohne Sichtlinie (gecacht aus der Wahrnehmung) – außer Beschwören/Heilen/Schild/Wachsen/Unsichtbar */
      if (!NOLOS[a.k] && !hasLos(e, P)) continue;
      opts.push(a);
    }
    if (!opts.length) return false;
    let sum = 0; opts.forEach(a => (sum += a.w || 1));
    let r = Z.R() * sum, pick = opts[0];
    for (const a of opts) { r -= a.w || 1; if (r <= 0) { pick = a; break; } }
    startAct(e, pick, P);
    return true;
  }
  const NOLOS = { summon: 1, heal: 1, shield: 1, grow: 1, invis: 1, drum: 1, brace: 1, shell: 1, smoke: 1, evade: 1 };
  /* W9 (Abuse-Bot „sichere Stelle“): Wer hoch über reinen Nahkämpfern steht, die nicht hinaufkommen, und von dort schießt, war
     in ~1/4 der Fälle völlig ungefährdet. Jetzt: steht ein wacher Nahkämpfer 1,6 s ratlos darunter (Spieler ≥ 2,5 Kacheln höher,
     in Sicht), hebt er einen Stein auf und wirft (lesbares Ausholen 0,55 s, 55 % Schaden, nicht parierbar wie alle Steine),
     danach alle ~2,6 s. Gegner mit eigenem Fernkampf, Flieger, Türme und Bosse bleiben unverändert. */
  const ROCK = { k: "lob", proj: "e_stein", r: [0, 240], pre: 0.55, act: 0.05, post: 0.4, cd: 2.6, dy: 400, sfx: "swing", name: ["Steinwurf", "Rock Throw"] };
  const RANGED_K = { shoot: 1, lob: 1, volley: 1, beam: 1, mark: 1, web: 1, pull: 1, teleport: 1, dive: 1 };
  function stuckBelow(e, dt, P, dx, dy, adx) {
    const d = e.def;
    if (d.fly || d.boss || d.ai === "turret" || e.ceil || e.master || !P || P.dead) return false;
    if (e._rangedK == null) e._rangedK = (d.atks || []).some(a => RANGED_K[a.k]);
    if (e._rangedK) return false;
    const stuck = e.onGround && dy < -40 && adx < 190 && P.onGround && hasLos(e, P) && Math.abs(e.vx) < 40;
    e.unrT = stuck ? (e.unrT || 0) + dt : Math.max(0, (e.unrT || 0) - dt * 2);
    if (e.unrT < 1.6 || e.cd > 0 || e.spawnT > 0) return false;
    startAct(e, ROCK, P); e.act.dmgMul = 0.55; e.act.fast = 1; e.act.feint = false;
    FX.text(e.x + e.w / 2, e.y - 10, "!", "#ffb070");
    return true;
  }
  function hasLos(e, P) {
    if (e._los == null || e.seeT == null) e._los = W.los(e.x + e.w / 2, e.y + 4, P.x + P.w / 2, P.y + 6) || W.los(e.x + e.w / 2, e.y + e.h / 2, P.x + P.w / 2, P.y + P.h / 2);
    return e._los;
  }
  const d0 = e => e.def || {};
  function countMinions(e) { return Z.enemies.filter(o => !o.dead && o.master === e).length; }
  function startAct(e, a, P) {
    const fast = e.elite === "wuetend" ? 0.75 : 1;
    const tier = Z.run ? Z.run.tier || 0 : 0;
    /* je tiefer, desto schneller holen Gegner aus – und manche täuschen an */
    e.act = { a, phase: "pre", t: 0, n: 0, hit: false, fast: Math.min(fast * Math.max(0.72, 1 - 0.05 * tier), a.pre ? Math.max(1, 0.3 / a.pre) * fast : fast), armor: a.armor || e.elite === "gepanzert" };
    if (tier >= 2 && !d0(e).boss && a.box && Z.R() < 0.06 + 0.035 * tier && !e.fainted) { e.act.feint = true; e.fainted = 1; } else e.fainted = 0;
    e.uses[a.k] = (e.uses[a.k] || 0) + 1;
    if (a.k === "shoot" || a.k === "lob" || a.k === "web" || a.k === "volley") e.act.aim = { x: P.x + P.w / 2, y: P.y + 12 };
    if (a.k === "mark" || a.k === "thread") e.act.aim = { x: P.x + P.w / 2, y: Z.groundY(P.x + P.w / 2, P.y + P.h) };
    if (a.swarmDive) for (const o of Z.enemies) if (o !== e && o.id === e.id && !o.dead && !o.act && Math.abs(o.x - e.x) < 140) o.cd = Math.max(o.cd, 0.45 + Z.R() * 0.5); /* W10: Schwarm stürzt nacheinander, nicht gleichzeitig */
    if (e.elite === "gepanzert" && Z.R() < 0.4) e.armorUp = 1.5;
  }
  Z.cancelEnemyAct = e => { if (e.act && !e.act.armor) { e.act = null; e.cd = 0.5; } };
  Z.staggerEnemy = (e, t) => { if (e.act && e.act.armor) return; if (e.act) { e.act = null; e.cd = Math.max(e.cd, 0.35); } e.stagger = t; };

  function runAct(e, dt, P, tgt) {
    const ac = e.act, a = ac.a, d = e.def;
    if (ac.pf == null) teleInit(e, ac, a);
    ac.t += dt / (ac.phase === "pre" ? ac.pf : ac.fast);
    const dx = tgt.x + tgt.w / 2 - (e.x + e.w / 2);
    /* Bewegung während des Angriffs */
    if (!d.fly) e.vy += (Z.ENEMY_GRAV || 1400) * dt;
    if (ac.phase === "pre") {
      if (a.track !== false && ac.t < a.pre * 0.6 && Math.abs(dx) > 6) e.face = U.sign(dx);
      if (!d.fly) e.vx = U.approach(e.vx, 0, 900 * dt);
      else { e.vx *= 0.9; e.vy *= 0.9; }
      if (ac.aim && !(a.lockAim && ac.t > a.pre - a.lockAim)) { ac.aim.x = U.lerp(ac.aim.x, P.x + P.w / 2, Math.min(1, dt * 6)); ac.aim.y = U.lerp(ac.aim.y, P.y + 12, Math.min(1, dt * 6)); if (a.k === "mark") ac.aim.y = Z.groundY(ac.aim.x, P.y + P.h); }
      if (ac.feint && ac.t >= a.pre * 0.7) { e.act = null; e.cd = 0.12 + Z.R() * 0.15; e.vx = -e.face * 60; return; }
      if (ac.t >= a.pre) { ac.phase = "act"; ac.t = 0; onActStart(e, a, P, tgt); }
    } else if (ac.phase === "act") {
      onActTick(e, a, P, dt, tgt);
      if (ac.t >= a.act + (a.n && a.gap && !["shoot"].includes(a.k) ? (a.n - 1) * a.gap : 0) + (a.k === "shoot" && a.gap ? (a.n - 1) * a.gap : 0)) { ac.phase = "post"; ac.t = 0; onActEnd(e, a, P); }
    } else {
      if (!d.fly) e.vx = U.approach(e.vx, 0, 900 * dt); else { e.vx *= 0.92; e.vy *= 0.92; }
      if (ac.t >= a.post) { if (a.own) (e.ocd || (e.ocd = {}))[a.k] = a.own * (0.85 + Z.R() * 0.3); e.act = null; e.cd = (a.once ? Math.min(a.cd || 0.6, 1.2) /* W9: Einmal-Fähigkeiten (Wachsen, Wolfsgeheul …) legten den Gegner sonst 7–100 s still */ : (a.cd || 0.6)) * (0.75 + Z.R() * 0.5) * (e.elite === "wuetend" ? 0.6 : 1) * (e.rageT > 0 ? 0.75 : 1); }
    }
    e.noPlat = !!d.fly;
    if (d.ai === "phase") { const g = e.ghost; e.ghost = true; Z.moveBody(e, dt); e.ghost = g; } else Z.moveBody(e, dt);
  }
  function hitbox(e, box) {
    const [bx, by, bw, bh] = box.map(v => v * (e.size || 1));
    const cx = e.x + e.w / 2, fy = e.y + e.h;
    return e.face > 0 ? { x: cx + bx, y: fy + by, w: bw, h: bh } : { x: cx - bx - bw, y: fy + by, w: bw, h: bh };
  }
  function dmgP(e, mul) { return e.dmgMul * (mul || 1) * (e.st.weak > 0 ? 0.6 : 1) * (e.rageT > 0 ? 1.15 : 1); }
  function meleeCheck(e, a, P, mul) {
    if (!P || P.dead) return;
    const r = hitbox(e, a.box);
    if (U.overlap(r, P) && Z.meleeLos(e, P, r)) { const hp0 = P.hp; Z.hurtPlayer(dmgP(e, mul || a.dmg), { x: e.x + e.w / 2, kb: a.kb || 170, attacker: e, melee: true, unblockable: a.unblockable, parryable: !a.unblockable, eff: a.eff }); e.act && (e.act.hit = true); if (a.hitSfx) A.play(a.hitSfx, { x: e.x, vol: 0.5 });
      if (P.hp < hp0) { if (a.rust) rustPlayer(P, a.rust); if (a.latch && !e.latchT) startLatch(e, P); } }
    for (const al of Z.allies) if (al.kind === "illusion" && U.overlap(r, al)) al.t += 1;
  }
  function onActStart(e, a, P, tgt) {
    const d = e.def, cx = e.x + e.w / 2, cy = e.y + e.h * 0.4;
    if (a.sfx) A.play(a.sfx, { x: e.x, y: e.y, vol: 0.55 });
    KG(e, "act", a);
    switch (a.k) {
      case "hit": case "combo": meleeCheck(e, a, P); e.vx = e.face * 40; break;
      case "lunge": e.vx = e.face * (a.lunge || 200); break;
      case "shoot": if (!a.gap) fire(e, a, P); break;
      case "volley": for (let i = 0; i < (a.n || 5); i++) { const tx = e.act.aim.x + (i - (a.n - 1) / 2) * 26; Z.aimProj(a.proj, cx, cy, tx, Z.groundY(tx, P.y + P.h) - 2, { dmg: dmgP(e, 0.8) }).g = 400; } break;
      case "lob": for (let i = 0; i < (a.n || 1); i++) Z.aimProj(a.proj, cx, cy - 4, e.act.aim.x + (i ? (Z.R() - 0.5) * 60 : 0), e.act.aim.y + 6, { dmg: dmgP(e, e.act.dmgMul || 1) }); break;
      case "web": Z.aimProj(a.proj, cx, cy, e.act.aim.x, e.act.aim.y, { dmg: 0 }); break;
      case "leap": { const [vx, vy] = a.jump || [240, -220]; const dist = Math.abs(tgt.x - e.x); e.vx = e.face * Math.min(vx, dist * 2.2 + 60); e.vy = vy; e.onGround = false; break; }
      case "slam": meleeCheck(e, a, P); FX.addShake(4); FX.burst(cx + e.face * 18, e.y + e.h, 12, { col: Z.dustCol || "#8a7a70", sp: 120, ang: -Math.PI / 2, spread: 2.6, life: 0.5, size: 3, kind: "smoke" });
        if (a.wave) for (const s of [-1, 1]) Z.spawnProj("e_welle", cx + s * 16, e.y + e.h - 6, s, { dmg: dmgP(e, 0.7) });
        break;
      case "charge": e.act.chargeDir = e.face; break;
      case "summon": for (const id of a.spawn || []) { const m = Z.spawnEnemy(id, cx + (Z.R() - 0.5) * 30, e.y + e.h - 2); if (m) { m.master = e; m.aware = true; m.spawnT = 0.4; FX.burst(m.x + m.w / 2, m.y + m.h / 2, 8, { col: "#a99a8b", sp: 60, life: 0.4, size: 3, kind: "smoke" }); } } break;
      case "teleport": teleport(e, a, P); break;
      case "mark": {
        const n = a.n || 1;
        for (let i = 0; i < n; i++) { const x = e.act.aim.x + (i - (n - 1) / 2) * (a.hw + 6); Z.spawnHazard({ kind: a.hz, x, y: Z.groundY(x, e.act.aim.y - 4), w: a.hw, hgt: a.hh || (a.hz === "strike" ? 260 : 30), warn: a.warn, life: a.life || 0.3, dmg: dmgP(e, 1.1), owner: "e", col: a.col, warnCol: a.col && a.col.startsWith("rgba") ? "#ff3a2a" : a.col, eff: a.eff, unblockable: a.hz !== "strike" }); }
        break;
      }
      case "explode": {
        Z.explode(cx, e.y + e.h / 2, a.rad, dmgP(e), "e");
        if (a.splash === "poison") Z.spawnHazard({ kind: "poisonpool", x: cx, y: e.y + e.h, w: 50, life: 4, dmg: dmgP(e, 0.15), owner: "e", eff: { poison: 1 } });
        e.noLoot = false; Z.killEnemy(e, { self: true }); break;
      }
      case "grab": {
        const r = hitbox(e, a.box);
        if (P && U.overlap(r, P) && P.iframe <= 0 && !P.dead && Z.meleeLos(e, P, r)) { e.act.grab = true; P.grabbed = e; P.grabT = 0; P.mash = 0; FX.text(P.x + P.w / 2, P.y - 10, L(["Gepackt! Rütteln!", "Grabbed! Mash!"]), "#ffb070"); }
        break;
      }
      case "spray": Z.spawnHazard({ kind: "breath", x: cx + e.face * 6, y: e.y + e.h * 0.35, w: a.len || 70, dir: e.face, life: a.act, dmg: dmgP(e, 0.45), owner: "e", eff: a.eff, col: a.col }); break;
      case "dive": { const t = P; const ang = Math.atan2(t.y + 10 - cy, t.x + t.w / 2 - cx); e.act.dv = [Math.cos(ang) * (a.spd || 280), Math.sin(ang) * (a.spd || 280)]; break; }
      case "beam": { /* W8: Strahl endet an der ersten Wand */
        const by = e.y + e.h * 0.5 + 6 - 5, bty = Math.floor(by / T); let len = 280;
        for (let q = 6; q < 280; q += 4) if (W.solidT(W.tile(Math.floor((cx + e.face * q) / T), bty))) { len = Math.max(10, q); break; }
        Z.spawnHazard({ kind: "zone", x: cx + e.face * len / 2, y: e.y + e.h * 0.5 + 6, w: len, hgt: 10, warn: 0, active: a.act, life: a.act, dmg: dmgP(e, 1.2), owner: "e", col: a.col }); FX.addShake(2); break; }
      case "pull": {
        if (P && W.los(cx, cy, P.x + P.w / 2, P.y + 10)) { e.act.pull = true; e.act.tether = true; FX.text(P.x + P.w / 2, P.y - 8, L(["Gezogen!", "Pulled!"]), "#eee8f0"); }
        break;
      }
      case "heal": for (const o of Z.enemies) if (!o.dead && !o.def.boss && U.dist(o.x, o.y, e.x, e.y) < 260) { o.hp = Math.min(o.hpMax, o.hp + o.hpMax * ((a.amt || 0.3) + (a.amt && e.elite ? 0.1 : 0)) * (o.nmMini ? 0.2 : 1) /* W9: Bosse nie, Mini-Bosse nur 1/5 (Myconid heilte Mini-Bosse alle 7 s um 20 %) */); FX.burst(o.x + o.w / 2, o.y + o.h / 2, 8, { col: "#9ad04a", sp: 40, up: 30, life: 0.6, size: 2, kind: "glow", add: true }); } break;
      case "shield": for (const o of Z.enemies) if (!o.dead && U.dist(o.x, o.y, e.x, e.y) < 220) { o.armorUp = 4; FX.ring(o.x + o.w / 2, o.y + o.h / 2, 16, "#ffd27a", 0.4, 2); } break;
      case "grow": e.size *= 1.45; e.w = Math.round(e.w * 1.3); e.h = Math.round(e.h * 1.45); e.y -= e.h * 0.31; e.dmgMul *= 1.35; e.hp += e.hpMax * 0.3; e.hpMax *= 1.3; Z.unstick(e); FX.ring(cx, e.y + e.h / 2, 30, "#ff6a2a", 0.4, 3); break;
      case "drum": drum(e); break;
      case "flare": flare(e, P); break;
      case "brace": e.armorUp = Math.max(e.armorUp || 0, a.act + 0.15); FX.ring(cx, cy, 16, "#e8d8b0", 0.35, 2);
        if (e.elite) for (const o of Z.enemies) if (o !== e && !o.dead && !o.def.boss && Math.abs(o.x - e.x) < 56 && Math.abs(o.y - e.y) < 30) { o.armorUp = Math.max(o.armorUp || 0, a.act); FX.ring(o.x + o.w / 2, o.y + o.h / 2, 12, "#e8d8b0", 0.35, 1.5); } /* Elite-Schildträger: Schildwall deckt die Nachbarn */
        break;
      case "shell": e.armorUp = Math.max(e.armorUp || 0, a.act + 0.1); FX.burst(cx, e.y + e.h - 4, 8, { col: [d.blood || "#b8d060", "#7a5a3a"], sp: 60, life: 0.4, size: 2, kind: "shard", g: 300 }); break;
      case "evade": e.vx = -e.face * 230; e.vy = -260; e.onGround = false; e.invuln = 0.25; FX.burst(cx, e.y + e.h, 6, { col: Z.dustCol || "#8a7a70", sp: 60, life: 0.3, size: 2, kind: "smoke" }); if (d.crow) FX.burst(cx, cy, 6, { col: ["#1a1418", "#3a3038"], sp: 70, life: 0.6, size: 2, kind: "shard", g: 80 }); break;
      case "smoke": FX.burst(cx, cy, 22, { col: ["#8a8a80", "#6a6a62", "#a8a49a"], sp: 70, life: 1.1, size: 6, kind: "smoke", g: -15, drag: 0.92 }); e.vx = -e.face * 260; e.vy = -230; e.onGround = false; e.invuln = 0.3; e.hidden = 1.1; Z.noise(cx, cy, 120); break;
      case "toll": toll(e, a, P); break;
      case "spores": { const x = cx + e.face * 34; Z.spawnHazard({ kind: "poisoncloud", x, y: Z.groundY(x, e.y + e.h - 4), w: 56, life: 3, dmg: dmgP(e, 0.15), owner: "e", eff: { poison: 1 } }); FX.burst(cx + e.face * 8, e.y + 6, 16, { col: ["#c8a0b0", "#e0d0c0", "#a0506a"], sp: 70, ang: e.face > 0 ? -0.4 : Math.PI + 0.4, spread: 1.4, life: 0.9, size: 3, kind: "smoke", g: -10 }); break; }
      case "thread": { const am = e.act.aim || { x: P.x + P.w / 2, y: Z.groundY(P.x + P.w / 2, P.y + P.h) }; addStrip(am.x, am.y, e); if (e.elite) { const x2 = am.x + (am.x > cx ? 72 : -72), g2 = Z.groundY(x2, am.y - 4); if (Math.abs(g2 - am.y) < 20) addStrip(x2, g2, null); } break; } /* Elite-Drider: zwei Fadennetze */
      case "gust": gust(e, a, P); break;
      case "invis": e.hidden = 2.2; FX.burst(cx, cy, 10, { col: "#4a4246", sp: 60, life: 0.5, size: 4, kind: "smoke" }); break;
    }
  }
  function fire(e, a, P) {
    const cx = e.x + e.w / 2 + e.face * 6, cy = e.y + e.h * 0.35;
    const n = a.n && !a.gap ? a.n : 1;
    for (let i = 0; i < n; i++) {
      const p = Z.aimProj(a.proj, cx, cy, e.act.aim.x, e.act.aim.y, { dmg: dmgP(e), eff: a.eff });
      if (a.spread && n > 1) { const ang = Math.atan2(p.vy, p.vx) + (i - (n - 1) / 2) * a.spread / (n - 1) * 2; const sp = Math.hypot(p.vx, p.vy); p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; }
    }
  }
  function onActTick(e, a, P, dt, tgt) {
    const ac = e.act;
    if (a.k === "hit" && !ac.hit && ac.t < a.act) meleeCheck(e, a, P);
    if (a.k === "combo") {
      const step = Math.floor(ac.t / a.gap);
      if (step > ac.n && step < (a.n || 2)) { ac.n = step; ac.hit = false; A.play(a.sfx || "slash", { x: e.x, vol: 0.5 }); e.vx = e.face * 70; }
      if (!ac.hit && ac.t - ac.n * a.gap < a.act) meleeCheck(e, a, P);
    }
    if (a.k === "shoot" && a.gap) { const step = Math.floor(ac.t / a.gap); if (step >= ac.n && ac.n < (a.n || 1)) { ac.n++; e.act.aim = { x: P.x + P.w / 2, y: P.y + 12 }; fire(e, a, P); if (ac.n > 1) A.play(a.sfx, { x: e.x, vol: 0.4 }); } }
    if (a.k === "lunge" || a.k === "leap") { if (!ac.hit) meleeCheck(e, a, P); if (a.k === "lunge") e.vx = e.face * a.lunge * U.clamp(1 - ac.t / a.act, 0.2, 1); if (a.k === "leap" && e.onGround && ac.t > 0.1) { ac.t = a.act; if (a.landFire) Z.spawnHazard({ kind: "fire", x: e.x + e.w / 2, y: e.y + e.h, w: 24, life: 1.5, dmg: dmgP(e, 0.2), owner: "e" }); } }
    if (a.k === "charge") {
      e.vx = ac.chargeDir * (a.spd || 300);
      if (!ac.hit) meleeCheck(e, a, P);
      if (Math.random() < dt * 30) FX.p({ x: e.x + e.w / 2 - ac.chargeDir * 8, y: e.y + e.h, vx: -ac.chargeDir * 40, vy: -20, life: 0.4, size: 3, col: Z.dustCol || "#8a7a70", kind: "smoke" });
      if (e.hitWall) { ac.t = a.act; FX.addShake(4); A.play("hitHeavy", { x: e.x }); Z.addStatus(e, "stun", 1.2); FX.burst(e.x + e.w / 2 + ac.chargeDir * 8, e.y + e.h / 2, 10, { col: "#ffe0a0", sp: 100, life: 0.3, size: 2, kind: "spark", add: true }); }
      /* nicht in Abgründe rennen */
      const ahead = ac.chargeDir > 0 ? e.x + e.w + 3 : e.x - 3;
      if (e.onGround && !W.groundBelow(ahead, e.y + e.h - 2, 40)) { ac.t = a.act; e.vx = 0; }
    }
    if (a.k === "dive" && ac.dv) { e.vx = ac.dv[0]; e.vy = ac.dv[1]; ac.dv[1] += 200 * dt; if (!ac.hit) meleeCheck(e, a, P); if (e.hitWall || (e.onGround && ac.t > 0.1)) ac.t = a.act; }
    if (a.k === "grab" && ac.grab && P.grabbed === e) {
      P.vx = 0; P.vy = 0; P.x = e.x + e.w / 2 + e.face * 8 - P.w / 2; P.y = e.y + e.h - P.h;
      P.grabT += dt;
      if (Z.input.pressed.jump || Z.input.pressed.roll || Z.input.pressed.a1 || Z.input.pressed.a2 || Z.input.pressed.left || Z.input.pressed.right) P.mash++;
      if (P.grabT > 0.4 * (P.mash + 1)) { /* Schaden in Abständen */ }
      if (Math.floor(P.grabT / 0.5) > (ac.dmgTicks || 0)) { ac.dmgTicks = Math.floor(P.grabT / 0.5); P.iframe = 0; Z.hurtPlayer(dmgP(e, 0.55), { x: e.x + e.w / 2, kb: 0, unblockable: true, force: true }); P.hurtT = 0; }
      if (P.mash >= 6 || P.grabT > 1.8 || P.dead) { P.grabbed = null; P.vx = -e.face * 200; P.vy = -150; P.iframe = 0.5; ac.t = a.act; Z.addStatus(e, "stun", P.mash >= 6 ? 0.8 : 0); }
      else ac.t = Math.min(ac.t, a.act - 0.01);
    }
    if (a.k === "pull" && ac.pull && P && !P.dead) {
      const pdx = e.x + e.w / 2 - (P.x + P.w / 2);
      if (Math.abs(pdx) > 24 && P.iframe <= 0) { P.vx = U.sign(pdx) * 260; P.vy = Math.min(P.vy, -40); P.hurtT = 0.05; }
    }
  }
  function onActEnd(e, a, P) {
    if (a.k === "grab" && P && P.grabbed === e) P.grabbed = null;
    if (a.k === "pull") e.act.tether = false;
    if (a.k === "dive") { e.vx *= 0.3; e.vy = -80; }
  }
  function teleport(e, a, P) {
    const ox = e.x + e.w / 2, oy = e.y + e.h / 2;
    FX.burst(ox, oy, 14, { col: e.def.t || "#c890ff", sp: 80, life: 0.4, size: 3, kind: "smoke" });
    for (let tries = 0; tries < 16; tries++) {
      let tx;
      if (a.behind) tx = P.x + P.w / 2 - P.face * 34;
      else { const [mn, mx] = e.def.keep || [90, 180]; tx = P.x + P.w / 2 + (Z.R() < 0.5 ? -1 : 1) * U.lerp(mn, mx, Z.R()); }
      const gy = W.groundBelow(tx, P.y - 30, 120);
      if (gy == null) continue;
      const nx = tx - e.w / 2, ny = gy - e.h;
      const b = { x: nx, y: ny, w: e.w, h: e.h };
      let blocked = false;
      for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 1) / T); ty++) for (let txx = Math.floor(b.x / T); txx <= Math.floor((b.x + b.w - 1) / T); txx++) if (W.solidT(W.tile(txx, ty)) || [3, 5, 6, 9].includes(W.tile(txx, ty))) blocked = true;
      if (blocked) continue;
      e.x = nx; e.y = e.def.fly ? ny - 30 : ny; e.vx = 0; e.vy = 0;
      if (a.behind) e.face = U.sign(P.x - e.x) || 1;
      FX.burst(e.x + e.w / 2, e.y + e.h / 2, 14, { col: e.def.t || "#c890ff", sp: 80, life: 0.4, size: 3, kind: "smoke" });
      return;
    }
  }

  /* ======================= W10: ZUSAMMENSPIEL, VORWARNUNG, NEUE FÄHIGKEITEN ======================= */
  let LIT = false; /* steht Ezekiel im Licht einer Laterne? (je Bild) */
  const STRIPS = (Z.webStrips = []); /* Fadennetze der Drider am Boden */
  /* je Bild: Laternenlicht, Kriegstakt, Spuren (Feuer/Säure), Fäden, Rost */
  function w10Frame(dt, P) {
    LIT = false;
    const px = P.x + P.w / 2, py = P.y + P.h / 2;
    for (const e of Z.enemies) {
      if (e.dead) continue;
      if (e.rageT > 0) e.rageT -= dt;
      if (e.flareT > 0) e.flareT -= dt;
      const d = e.def;
      if (d.lantern && !e._rest && !LIT) { const lx = e.x + e.w / 2, ly = e.y + e.h * 0.4, R = e.flareT > 0 ? 220 : 120; if (Math.abs(lx - px) < R && Math.abs(ly - py) < R * 0.8 && Math.hypot(lx - px, ly - py) < R && W.los(lx, ly, px, py)) LIT = true; }
      if ((d.fireTrail || d.acidTrail) && e.aware && e.onGround && !e._rest && Math.abs(e.vx) > 14) {
        e.trailW = (e.trailW || 0) - dt;
        if (e.trailW <= 0) {
          e.trailW = d.fireTrail ? 0.7 : 0.9;
          if (d.fireTrail) Z.spawnHazard({ kind: "fire", x: e.x + e.w / 2 - e.face * 6, y: e.y + e.h, w: 16, life: 1.3, dmg: dmgP(e, 0.07), owner: "e" });
          else Z.spawnHazard({ kind: "poisonpool", x: e.x + e.w / 2 - e.face * 8, y: e.y + e.h, w: 22, life: 3.5, dmg: dmgP(e, 0.05), owner: "e", eff: { poison: 1 } });
        }
      }
    }
    if (P.rustT > 0) { P.rustT -= dt; if (Math.random() < dt * 6) FX.p({ x: px + P.face * 8, y: P.y + 10, vx: 0, vy: 30, life: 0.5, size: 1.4, col: Math.random() < 0.5 ? "#a85a2a" : "#7a3a1a", kind: "shard", g: 200 }); }
    /* Fäden: bremsen, wer hineintritt; ein Hieb (Spieler-Nahkampf) zerschneidet sie */
    for (let i = STRIPS.length - 1; i >= 0; i--) {
      const s = STRIPS[i]; s.t += dt;
      if (s.t > s.life) { STRIPS.splice(i, 1); continue; }
      if (P.dead) continue;
      const on = P.x + P.w > s.x - s.w / 2 && P.x < s.x + s.w / 2 && P.y + P.h > s.y - 10 && P.y + P.h < s.y + 6;
      if (on && s.t > 0.15) { Z.addStatus(P, "slow", 0.3, true); if (!s.told) { s.told = true; FX.text(px, P.y - 8, L(["Klebrige Fäden!", "Sticky threads!"]), "#eee8f0"); A.play("web", { x: s.x, vol: 0.4 }); } }
      if (P.act && P.act.type === "melee" && P.act.phase === "act" && Math.abs(px + P.face * 14 - s.x) < s.w / 2 + 10 && Math.abs(P.y + P.h - s.y) < 26) {
        STRIPS.splice(i, 1); FX.burst(s.x, s.y - 3, 10, { col: ["#eee8f0", "#c8c0d0"], sp: 80, life: 0.4, size: 1.4, kind: "shard", g: 200 }); A.play("web", { x: s.x, vol: 0.4, rate: 1.4 });
      }
    }
  }
  function addStrip(x, y, e) {
    if (!isFinite(x) || !isFinite(y)) return;
    if (STRIPS.length >= 4) STRIPS.shift();
    STRIPS.push({ x, y, w: 64, t: 0, life: 6.5, seed: Math.random() * 10 });
    FX.burst(x, y - 4, 12, { col: ["#eee8f0", "#d8d0dc"], sp: 70, life: 0.5, size: 1.3, kind: "shard", g: 100 });
    if (e) { const cx = e.x + e.w / 2; FX.burst(cx, e.y + e.h * 0.5, 6, { col: "#eee8f0", sp: 50, life: 0.3, size: 1.2, kind: "spark" }); }
  }
  /* Rost: Nahkampfwaffe richtet einige Sekunden 30 % weniger Schaden an */
  function rustPlayer(P, t) {
    if (!(P.rustT > 0)) FX.text(P.x + P.w / 2, P.y - 12, L(["Rost! Waffe stumpf", "Rust! Blade dulled"]), "#d88a4a", true);
    P.rustT = Math.max(P.rustT || 0, t); A.play("hitMetal", { vol: 0.35, rate: 0.6 });
  }
  { const hit0 = Z.hitEnemy;
    Z.hitEnemy = function (e, dmg, o) {
      const P = Z.player;
      if (P && P.rustT > 0 && o && o.src === "melee" && !o.dot) dmg *= 0.7;
      if (e && e.latchT > 0 && !(o && o.dot)) { e.latchT = 0; e.cd = Math.max(e.cd || 0, 1.2); e.vy = -140; e.vx = (P && e.x > P.x ? 1 : -1) * 120; }
      return hit0.apply(this, [e, dmg, o].concat([].slice.call(arguments, 3)));
    }; }
  function crowCall(e, vol) { A.play("amb/e_kraehe_" + (1 + ((Z.R() * 16) | 0)) + ".mp3", { x: e.x, y: e.y, vol, rate: 1.1, gap: 0.3 }); }
  /* Getarnt (Mimik als Truhe, Wasserspeier als Statue): regungslos, bis man zu nah kommt, sie trifft oder sie gerufen werden */
  function disguiseTick(e, dt, P) {
    const d = e.def, ex = e.x + e.w / 2, px = P.x + P.w / 2, garg = e.id === "gargoyle";
    const near = !P.dead && Math.abs(px - ex) < (garg ? 64 : 30) && Math.abs((P.y + P.h) - (e.y + e.h)) < (garg ? 90 : 34) && W.los(ex, e.y + 4, px, P.y + 6);
    if (e.hp < e.hpMax || e.aware || near || e.nm || e.nmHunter || e.nmEvent || e.master) { reveal(e, P); return; } /* Nemesis/Diener tarnen sich nicht */
    e.sus = 0; e.vx = 0;
    if (!e.ceil) { e.vy += (Z.ENEMY_GRAV || 1400) * dt; Z.moveBody(e, dt); }
  }
  function reveal(e, P) {
    e.disguise = false; e.revealed = true;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.id === "gargoyle") { e.def = GARG_FLY; e.baseY = e.y; e.vy = -200; e.onGround = false; FX.burst(cx, cy, 16, { col: ["#7a7068", "#9a9088", "#5a524c"], sp: 110, life: 0.6, size: 2.4, kind: "shard", g: 500 }); A.play("rock", { x: e.x, vol: 0.6 }); A.play("roar", { x: e.x, vol: 0.4, rate: 1.4 }); }
    else { FX.burst(cx, cy, 12, { col: ["#c8a040", "#7a5030", "#e8d8b0"], sp: 100, life: 0.5, size: 2, kind: "shard", g: 400 }); A.play("bite", { x: e.x, vol: 0.7, rate: 0.8 }); A.play("monster", { x: e.x, vol: 0.4, rate: 0.7 }); }
    FX.text(cx, e.y - 12, L(e.id === "gargoyle" ? ["Die Statue lebt!", "The statue lives!"] : ["Eine Mimik!", "A mimic!"]), "#ffb070", true);
    e.aware = true; e.sus = 0; e.lostSight = 0; e.alertT = 0.2; e.cd = 0.25; e.called = false; e._wasAware = false;
    if (P) { const s = U.sign(P.x - e.x); if (s) e.face = s; }
  }
  /* Stirge saugt sich fest */
  function startLatch(e, P) {
    if (P.dead || !e.def.fly) return;
    e.latchT = 1.6; e.latchTick = 0.45; if (e.act) { e.act = null; e.cd = 1.2; }
    FX.text(P.x + P.w / 2, P.y - 10, L(["Blutsauger! Abrollen!", "Bloodsucker! Roll!"]), "#ff8a7a");
  }
  function latchTick(e, dt, P) {
    if (P.dead || P.rollT > 0 || e.kbT > 0 || (e.st.stun > 0) || e.frozenT > 0) { e.latchT = 0; e.vy = -140; e.vx = -(P.face || 1) * 120; e.cd = Math.max(e.cd, 1.2); return false; }
    e.latchT -= dt; e.x = P.x + P.w / 2 - e.w / 2 - (P.face || 1) * 5; e.y = P.y + 1; e.vx = 0; e.vy = 0; e.face = P.face || 1;
    e.latchTick -= dt;
    if (e.latchTick <= 0) { e.latchTick = 0.5; P.iframe = 0; const h0 = P.hp; Z.hurtPlayer(dmgP(e, 0.3), { x: e.x + e.w / 2, kb: 0, unblockable: true, force: true }); P.hurtT = 0; if (P.hp < h0) e.hp = Math.min(e.hpMax, e.hp + (h0 - P.hp) * 0.6); }
    if (e.latchT <= 0) { e.vy = -140; e.vx = -(P.face || 1) * 100; e.cd = Math.max(e.cd, 1.2); }
    return true;
  }
  /* Ratte holt Hilfe: läuft zum nächsten ahnungslosen Kameraden und quiekt ihn wach */
  function fetchHelp(e, dt, P) {
    if (e.fetchDone || e.master || e.ambush || e.trial) return false;
    if (!e.fetchO) {
      e.fetchDone = true;
      if (Z.R() > 0.6) return false;
      let best = null, bd = 320;
      for (const o of Z.enemies) { if (o.dead || o.aware || o.def.fetch || o.def.boss || o.disguise || o._rest || Math.abs(o.y - e.y) > 50) continue; const dd = Math.abs(o.x - e.x); if (dd > 50 && dd < bd && W.los(e.x + e.w / 2, e.y + 2, o.x + o.w / 2, o.y + o.h - 4)) { bd = dd; best = o; } }
      if (!best) return false;
      for (const r of Z.enemies) if (r !== e && r.def.fetch && Math.abs(r.x - e.x) < 90) r.fetchDone = true;
      e.fetchDone = false; e.fetchO = best; e.fetchT = 4;
      FX.text(e.x + e.w / 2, e.y - 8, L(["Quiek!", "Squeak!"]), "#e8d8c0"); A.play("rat", { x: e.x, vol: 0.6, rate: 1.3 });
    }
    const o = e.fetchO; e.fetchT -= dt;
    if (!o || o.dead || o.aware || e.fetchT <= 0) { e.fetchDone = true; e.fetchO = null; return false; }
    const ddx = o.x + o.w / 2 - (e.x + e.w / 2);
    if (Math.abs(ddx) < 26) {
      alarm(o, "call"); o.lkx = P.x + P.w / 2; o.lky = P.y + P.h; FX.text(o.x + o.w / 2, o.y - 10, "?!", "#e8c890"); A.play("rat", { x: e.x, vol: 0.6, rate: 1.5 });
      e.fetchDone = true; e.fetchO = null; return false;
    }
    moveToward(e, dt, U.sign(ddx), 1.3); e.face = U.sign(ddx) || e.face;
    return true;
  }
  /* Unterstützer (Trommler, Myconid): hält sich hinter dem nächsten kämpfenden Verbündeten, sonst auf Abstand */
  function supportMove(e, dx, adx) {
    const ex = e.x + e.w / 2, P = Z.player;
    let buddy = null, bd = 260;
    for (const o of Z.enemies) { if (o === e || o.dead || !o.aware || o.def.boss || o.def.role === "support" || o.def.role === "heiler" || o.def.fly || Math.abs(o.y - e.y) > 40) continue; const dd = Math.abs(o.x + o.w / 2 - ex); if (dd < bd) { bd = dd; buddy = o; } }
    if (buddy && P) {
      const bx = buddy.x + buddy.w / 2, side = U.sign(bx - (P.x + P.w / 2)) || 1, want = bx + side * 42, ddx = want - ex;
      if (Math.abs(ddx) > 10) return [U.sign(ddx), Math.abs(ddx) > 60 ? 1 : 0.6];
      return [0, 0];
    }
    /* allein: auf Nahkampf-/Sporenreichweite heran */
    return adx > (e.def.role === "heiler" ? 64 : 22) ? [U.sign(dx), 0.85] : [0, 0];
  }
  /* Schildträger: stellt sich zwischen Ezekiel und den nächsten Schützen/Zauberer; Schild immer nach vorn */
  function guardMove(e, dx, adx, P) {
    const ex = e.x + e.w / 2, px = P.x + P.w / 2;
    let ward = null, bd = 200;
    for (const o of Z.enemies) { if (o === e || o.dead || !o.aware || o.def.fly || (o.def.ai !== "ranged" && o.def.ai !== "caster" && o.def.role !== "support" && o.def.role !== "heiler") || Math.abs(o.y - e.y) > 40) continue; const dd = Math.abs(o.x + o.w / 2 - ex); if (dd < bd) { bd = dd; ward = o; } }
    if (ward) {
      const wx = ward.x + ward.w / 2, side = U.sign(px - wx) || 1;
      const want = Math.abs(px - wx) > 70 ? wx + side * 34 : px - side * 22, ddx = want - ex;
      e.face = U.sign(dx) || e.face;
      return Math.abs(ddx) > 8 ? U.sign(ddx) : 0;
    }
    return adx > 22 ? U.sign(dx) : 0;
  }
  /* ---------- Einheitliche Vorwarnsprache ----------
     Klasse 1 (leicht, parierbar): gelbes „!“, warmes Glühen, heller Klingen-Ton.
     Klasse 2 (schwer: Panzerung/Wucht/Ansturm/Stampfer): oranges „!!“, dunkler Klingen-Ton.
     Klasse 3 (nicht blockbar: Packen, Ziehen, Verschlingen): rotes „!!“, hoher Glockenton.
     Mindest-Ausholzeit (wirkt auch nach Tiefen-Beschleunigung und wütenden Eliten): 0,30 / 0,50 / 0,55 s,
     Fernangriffe/Flächen 0,40 s, Kleinstgetier im Schwarm 0,22 s. */
  const TG0 = { teleport: 1, summon: 1, heal: 1, shield: 1, grow: 1, invis: 1, drum: 1, flare: 1, brace: 1, evade: 1, smoke: 1, shell: 1 };
  const AREA = { shoot: 1, lob: 1, volley: 1, web: 1, mark: 1, beam: 1, spray: 1, thread: 1, spores: 1, gust: 1 };
  const MINPRE = [0, 0.3, 0.5, 0.55];
  function tgOf(a) {
    if (!a) return 0;
    if (a._tg != null) return a._tg;
    let tg;
    if (TG0[a.k]) tg = 0;
    else if (a.unblockable || a.k === "grab" || a.k === "pull") tg = 3;
    else if (a.armor || a.glyph === "!!" || a.k === "slam" || a.k === "charge" || a.k === "toll" || (a.dmg || 1) >= 1.3) tg = 2;
    else tg = 1;
    try { a._tg = tg; } catch (err) { /* eingefrorene Def */ }
    return tg;
  }
  Z.enemyTg = tgOf;
  function teleInit(e, ac, a) {
    const d = e.def, tg = tgOf(a);
    let min = tg === 0 || d.boss ? 0 : AREA[a.k] ? 0.4 : MINPRE[tg];
    if (a.counter) min = 0.36;
    if (tg === 1 && d.group && (d.hp || 1) < 0.6) min = 0.22;
    ac.fast = ac.fast || 1;
    ac.pf = a.pre > 0 ? Math.max(ac.fast, min / a.pre) : ac.fast;
    if (tg && !d.boss && !(e.hidden > 0) && Z.cam) {
      const cm = Z.cam;
      if (e.x > cm.x - 30 && e.x < cm.x + cm.w + 30 && e.y > cm.y - 30 && e.y < cm.y + cm.h + 30) {
        if (tg === 3) A.play("bell", { x: e.x, y: e.y, vol: 0.2, rate: 2.2, tag: "tg3", gap: 0.12, verb: 0.2 });
        else A.play("unsheathe", { x: e.x, y: e.y, vol: tg === 2 ? 0.3 : 0.15, rate: tg === 2 ? 0.7 : 1.45, tag: "tg" + tg, gap: 0.08, verb: 0.2 });
      }
    }
    KG(e, "pre", a);
  }
  /* Kriegstrommel: Verbündete ringsum werden schneller und schlagen härter zu, Schlafende wachen auf */
  function drum(e) {
    const R = e.elite ? 300 : 220, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    for (const o of Z.enemies) {
      if (o.dead || o.def.boss || o.disguise) continue;
      const dd = Math.hypot(o.x + o.w / 2 - cx, (o.y + o.h / 2 - cy) * 1.3); if (dd > R) continue;
      o.rageT = e.elite ? 7 : 5;
      if (o.sleep && Z.leben && Z.leben.wake) Z.leben.wake(o, true);
    }
    Z.noise(cx, cy, 300, { alarm: true });
    if (!KG(e, "trommel")) { A.play("hitHeavy", { x: e.x, vol: 0.55, rate: 0.55, gap: 0 }); A.play("hitHeavy", { x: e.x, vol: 0.5, rate: 0.6, delay: 0.18, gap: 0 }); A.play("goblin", { x: e.x, vol: 0.4 }); }
    FX.ring(cx, cy, 40, "#ffb060", 0.5, 2.5); FX.ring(cx, cy, R * 0.6, "#ff8a3a", 0.8, 1.5); FX.addShake(2);
  }
  /* Laternenträger: „Licht hoch!“ – heller Lichtkreis, Unsichtbarkeit verpufft, alle mit Sicht zur Laterne sind alarmiert */
  function flare(e, P) {
    const cx = e.x + e.w / 2, cy = e.y + e.h * 0.4;
    e.flareT = e.elite ? 7 : 4;
    FX.ring(cx, cy, 70, "#ffd27a", 0.6, 3); FX.ring(cx, cy, 140, "#ffb050", 0.9, 1.5);
    FX.burst(cx, cy, 16, { col: ["#ffe8a0", "#ffd27a"], sp: 110, life: 0.6, size: 2, kind: "glow", add: true });
    if (P && P.invis > 0 && Math.hypot(P.x - cx, P.y - cy) < 180) { P.invis = 0; FX.text(P.x + P.w / 2, P.y - 12, L(["Entdeckt!", "Spotted!"]), "#ffd27a", true); }
    for (const o of Z.enemies) {
      if (o === e || o.dead || o.aware || o.def.boss || o.disguise) continue;
      const dd = Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy);
      if (dd < 300 && W.los(cx, cy, o.x + o.w / 2, o.y + 4)) { o.pendAl = 0.2 + Z.R() * 0.3; o.called = true; }
      else if (dd < 400) suspect(o, P ? P.x + P.w / 2 : cx, P ? P.y + P.h : cy, SUS_T);
    }
  }
  /* Glockenschlag: Schallring um den Geist – wer drinsteht, wird weggeschleudert und kurz betäubt; der Klang alarmiert den Raum */
  function toll(e, a, P) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2, R = (a.rad || 60) * (e.elite ? 1.3 : 1);
    FX.ring(cx, cy, R, "#f0d890", 0.35, 3); FX.ring(cx, cy, R * 0.6, "#c8962a", 0.25, 2); FX.addShake(3);
    if (!KG(e, "toll")) A.play("gong", { x: e.x, vol: 0.45, rate: 1.6 });
    Z.noise(cx, cy, 320, { alarm: true });
    if (P && !P.dead) {
      const px = P.x + P.w / 2, py = P.y + P.h / 2;
      if (Math.hypot(px - cx, py - cy) < R + 6 && W.los(cx, cy, px, py)) Z.hurtPlayer(dmgP(e, 1), { x: cx, kb: a.kb || 280, kbUp: 220, attacker: e, parryable: false, eff: { stun: 0.25 } });
    }
  }
  /* Sturmböe: stößt Ezekiel weg – über Abgründen nur schwach (keine unfairen Stürze) */
  function gust(e, a, P) {
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    for (let i = 0; i < 12; i++) FX.p({ x: cx + e.face * (6 + Math.random() * 20), y: cy + (Math.random() - 0.5) * 24, vx: e.face * (220 + Math.random() * 120), vy: (Math.random() - 0.5) * 30, life: 0.45, size: 1.4, col: "#e8f0d8", kind: "spark" });
    A.play("swing", { x: e.x, vol: 0.6, rate: 0.55 });
    if (!P || P.dead) return;
    const px = P.x + P.w / 2, ddx = px - cx;
    if (U.sign(ddx) !== e.face && Math.abs(ddx) > 10) return;
    if (Math.abs(ddx) > (a.r ? a.r[1] : 110) + 12 || Math.abs(P.y + P.h / 2 - cy) > 70 || !W.los(cx, cy, px, P.y + P.h / 2)) return;
    const dir = e.face;
    const safe = W.groundBelow(px + dir * 56, P.y + P.h - 4, 140) != null && W.groundBelow(px + dir * 28, P.y + P.h - 4, 140) != null;
    Z.hurtPlayer(dmgP(e, 0.35), { x: cx, kb: safe ? 320 : 130, kbUp: safe ? 170 : 90, attacker: e, parryable: false });
  }
  /* ---------- Trupps: Gruppen mit Rollen statt Zufall ----------
     welt.js BIOMES[id].squads: Listen von Arten (erste = Anführer). Je Ebene 2–4 Trupps; ein Trupp ersetzt einen
     Einzelgegner und nimmt (Größe−2) andere Einzelgegner weg (Gesamtzahl steigt nur um 1 je Trupp).
     Ab Tiefe 2 ist der Anführer manchmal ein Elite. Aufruf aus hinterhalt.js nach dem Laden (vor Schlaf/Wachen). */
  Z.formSquads = function (lv) {
    if (!lv || lv.hub || lv.arena || lv.passage || !Z.run) return;
    const B = Z.BIOMES && Z.BIOMES[lv.biome]; if (!B || !B.squads || !B.squads.length) return;
    const R = Z.Rng(((lv.seed || 7) * 92821 + 4049) >>> 0), tier = Z.run.tier || 0, P = Z.player;
    const singles = Z.enemies.filter(e => !e.dead && !e.def.boss && !e.def.fly && !e.def.group && !e.elite && !e.master && !e.thief && !e.nm && !e.trial && !e.ambush && e.def.ai !== "turret" && !e.disguise && Z.ENEMIES[e.id] && e.onGround !== undefined && (!P || Math.abs(e.x - P.x) > 220));
    if (singles.length < 6) return;
    R.shuffle(singles);
    let want = Math.min(2 + Math.floor(tier / 2) - (Z.gq && Z.gq.mini ? 1 : 0), Math.floor(singles.length / 5)), made = 0;
    const used = new Set(), kill = new Set();
    for (const s of singles) {
      if (made >= want) break;
      if (used.has(s) || s.dead) continue;
      const list = B.squads[Math.floor(R() * B.squads.length)].filter(id => Z.ENEMIES[id]);
      if (Z.gq && Z.gq.lean && list.length > 3) list.length = 3; /* Handheld: Trupps höchstens zu dritt */
      if (list.length < 2) continue;
      const x0 = s.x + s.w / 2, y0 = s.y + s.h;
      /* Plätze auf demselben Boden links/rechts suchen */
      const spots = [];
      for (const off of [0, 22, -22, 44, -44, 66, -66, 88, -88]) {
        if (spots.length >= list.length) break;
        const x = x0 + off, gy = W.groundBelow(x, y0 - 10, 24);
        if (gy == null || Math.abs(gy - y0) > 8) continue;
        const tx = Math.floor(x / T), ty = Math.floor((gy - 4) / T);
        if (W.solidT(W.tile(tx, ty)) || W.solidT(W.tile(tx, ty - 1)) || [3, 5, 6, 9].includes(W.tile(tx, ty + 1)) || [3, 5, 6, 9].includes(W.tile(tx, ty))) continue;
        spots.push([x, gy]);
      }
      if (spots.length < list.length) continue;
      used.add(s); kill.add(s);
      /* Ausgleich: andere Einzelgegner fallen weg */
      let drop = list.length - 2;
      for (const o of singles) { if (drop <= 0) break; if (used.has(o) || o.dead || Math.abs(o.x - s.x) < 200) continue; used.add(o); kill.add(o); drop--; }
      const lead = tier >= 2 && R() < 0.3;
      list.forEach((id, i) => {
        const [x, y] = spots[i], d = Z.ENEMIES[id];
        const e = Z.spawnEnemy(id, x, y - (d.fly ? 20 : 0), { elite: lead && i === 0 && !d.group });
        if (!e) return; e.spawnT = 0; e.squad = made + 1; e.face = i % 2 ? -1 : 1; Z.unstick && Z.unstick(e);
      });
      made++;
    }
    for (let i = Z.enemies.length - 1; i >= 0; i--) if (kill.has(Z.enemies[i])) Z.enemies.splice(i, 1);
    lv.squadsMade = made;
  };

  /* ======================= TOD & BEUTE ======================= */
  Z.killEnemy = function (e, o) {
    if (e.dead) return;
    o = o || {};
    const d = e.def, P = Z.player;
    /* Skelette setzen sich wieder zusammen, wenn sie nicht zertrümmert werden */
    if (d.revive && !e.revived && !o.heavy && !o.crit && Z.R() < 0.5 && !o.self) {
      e.revived = true; e.hp = Math.round(e.hpMax * 0.5); e.pile = 2.2; Z.addStatus(e, "stun", 2.2);
      A.play("hitBone", { x: e.x, vol: 0.6 }); FX.text(e.x + e.w / 2, e.y - 10, L(["Klapper …", "Rattle…"]), "#e8e2d0"); return;
    }
    e.dead = true; e.deadT = 0; e.act = null; e.hidden = 0;
    if (P && P.grabbed === e) P.grabbed = null;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    /* Zerfall in Asche und Glut statt Blut */
    FX.burst(cx, cy, 18 + Math.round(e.w), { col: [d.c || "#6a5a50", d.t || "#3a3030", "#2a2020"], sp: 90, life: 0.8, size: 2.5, kind: "smoke", g: -30, drag: 0.94 });
    FX.burst(cx, cy, 10, { col: ["#ff8a5a", "#ffd27a"], sp: 120, life: 0.5, size: 1.6, kind: "spark", add: true });
    if (!KG(e, "tod")) A.play(d.undead ? "undead" : d.snd || "die", { x: e.x, vol: 0.45 });
    if (!o.self) FX.stop(0.04);
    if (d.death === "gas") Z.spawnHazard({ kind: "poisoncloud", x: cx, y: e.y + e.h, w: 40, life: 2.5, dmg: e.dmgMul * 0.15, owner: "e", eff: { poison: 1 } });
    if (d.death === "spiders") for (let i = 0; i < 3; i++) { const m = Z.spawnEnemy("spinnchen", cx + (i - 1) * 8, e.y + e.h); if (m) { m.aware = true; m.vy = -200; m.vx = (i - 1) * 80; } }
    if (d.split) for (const s of [-1, 1]) { const m = Z.spawnEnemy(d.split, cx + s * 6, e.y + e.h); if (m) { m.aware = true; m.vy = -220; m.vx = s * 120; } }
    if (P && P.st && P.st.burn !== undefined && ["a1", "a2"].some(s => P.slots[s] && P.slots[s].id === "glutaxt") && Z.metaLvl("glutaxt") >= 3 && e.st.burn > 0) Z.explode(cx, cy, 36, Z.dmgOf(P, null, 14), "p");
    if (e.elite === "beschwoerer") for (let i = 0; i < 2; i++) { const m = Z.spawnEnemy(e.id === "brutsack" ? "spinnchen" : e.id, cx + (i - 0.5) * 20, e.y + e.h); if (m) m.aware = true; }
    if (d.boss) return; /* Bosse kümmern sich selbst */
    if (e.master || o.self && !d.gold) { /* beschworene Wesen geben wenig */ }
    if (P && !o.self) { /* Selbstzerstörung (Bombengoblin) und aufgelöste Diener des Bosses zählen nicht als Kill */
      P.kills++;
      Z.stats.kills = (Z.stats.kills || 0) + 1;
      Z.meta && (Z.meta.seen = Z.meta.seen || {}, Z.meta.seen[e.id] = (Z.meta.seen[e.id] || 0) + 1);
      if (Z.has("blutdurst")) Z.healPlayer(P.hpMax * 0.03);
      if (Z.has("kopfgeld")) { P.bounty = Math.min(5, P.bounty + 1); P.bountyT = 6; }
      if (P.curse > 0) { P.curse--; if (P.curse === 0) { FX.text(P.x + P.w / 2, P.y - 14, L(["Fluch gebrochen!", "Curse lifted!"]), "#c040ff", true); A.play("holy"); } }
      for (const s of ["a1", "a2"]) { const it = P.slots[s]; if (it) { const wd = Z.WEAPONS[it.id]; if (wd.killHeal && P.act && P.act.slot === s) Z.healPlayer(P.hpMax * wd.killHeal); if (it.id === "dawnbringer" && Z.metaLvl("dawnbringer") >= 3 && P.act && P.act.slot === s) Z.healPlayer(P.hpMax * 0.03); } }
    }
    if (e.master) return;
    const run = Z.run || { tier: 0 };
    Z.dropGold(cx, cy, (d.gold || 3) * Z.BAL.goldMul(run.tier) * (e.elite ? 4 : 1) * (0.7 + Z.R() * 0.6));
    const shardCh = e.elite ? 1 : 0.32;
    if (Z.R() < shardCh) Z.dropShards(cx, cy, (e.elite ? 12 : 1 + Math.round(run.tier * 0.6)) * (1 + 0.2 * (run.skulls || 0)));
    if (e.elite || Z.R() < 0.035) Z.dropItem(cx, e.y + e.h, { elite: !!e.elite });
    else if (d.disguise && e.id === "mimik" && Z.R() < 0.45) Z.dropItem(cx, e.y + e.h, {}); /* W10: eine Mimik schluckt gern Schätze */
    if (Z.R() < 0.025) Z.spawnPickup("food", cx, e.y + e.h, { food: Z.R.pick(Z.FOOD), drop: true });
  };

  /* Elite markieren (Aura) – wird beim Erzeugen der Karte vergeben */
  Z.ELITE = ELITE;
})();
