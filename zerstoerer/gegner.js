/* Ezekiel – The Destroyer · Gegner
   Jeder Gegner hat eigene Angriffe mit Ausholen (Vorwarnung), Treffer und Erholung. Datengetrieben, Verhalten über "ai". */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
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
      atks: [{ k: "grow", r: [0, 200], pre: 0.7, act: 0.05, post: 0.3, cd: 99, sfx: "roar", once: true, w: 2 },
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
      hp *= 3.4; e.dmgMul *= 1.3; e.size *= 1.18; e.w = Math.round(e.w * 1.18); e.h = Math.round(e.h * 1.18); e.x = x - e.w / 2; e.y = y - e.h;
      if (e.elite === "gepanzert") e.armorUp = 0;
    }
    if (d.boss) hp = HP * d.hp * Z.BAL.enemyHp(tier) * Z.BAL.skullHp(run.skulls || 0);
    e.hp = e.hpMax = Math.round(hp);
    e.ghost = !!d.ghost;
    if (d.fly) { e.baseY = e.y; }
    if (d.ai === "ceiling") {
      /* an die Decke hängen */
      for (let yy = e.y; yy > e.y - 200; yy -= 4) if (W.solidAt(x, yy - 2)) { e.y = yy; e.ceil = true; break; }
    }
    Z.enemies.push(e);
    if (d.init) d.init(e);
    return e;
  };

  /* ======================= UPDATE ======================= */
  Z.updateEnemies = function (dt) {
    const P = Z.player;
    for (let i = Z.enemies.length - 1; i >= 0; i--) {
      const e = Z.enemies[i];
      if (e.dead) { e.deadT += dt; if (e.deadT > (e.def.boss ? 99 : 0.6)) Z.enemies.splice(i, 1); continue; }
      /* weit weg: schlafen lassen (Leistung) */
      const far = Math.abs(e.x - P.x) > 520 || Math.abs(e.y - P.y) > 360;
      if (far && !e.def.boss && !e.aware) continue;
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
      const a = Z.enemies[i]; if (a.dead || a.def.fly || a.def.boss) continue;
      for (let j = i + 1; j < Z.enemies.length; j++) {
        const b = Z.enemies[j]; if (b.dead || b.def.fly || b.def.boss) continue;
        if (Math.abs(a.y - b.y) > 10) continue;
        const dx = (b.x + b.w / 2) - (a.x + a.w / 2), min = (a.w + b.w) * 0.42;
        if (Math.abs(dx) < min) { const push = (min - Math.abs(dx)) * 0.5 * (U.sign(dx) || 1); if (!a.act) a.x -= push * 0.5; if (!b.act) b.x += push * 0.5; }
      }
    }
  };

  function canSee(e, P) {
    if (!P || P.dead) return false;
    if (P.invis > 0) return false;
    const dx = P.x + P.w / 2 - (e.x + e.w / 2), dy = P.y + P.h / 2 - (e.y + e.h / 2);
    const d = Math.hypot(dx, dy);
    const sight = e.def.sight || 180;
    if (d > sight * (e.aware ? 1.7 : 1)) return false;
    if (!e.aware && Math.abs(dy) > 90) return false;
    return W.los(e.x + e.w / 2, e.y + 4, P.x + P.w / 2, P.y + 8);
  }

  function think(e, dt, P) {
    const d = e.def;
    const st = e.st;
    /* Rückstoß-Phase */
    if (e.kbT > 0) {
      e.kbT -= dt;
      if (!d.fly) e.vy += 1400 * dt;
      e.vx *= Math.pow(0.02, dt);
      if (d.fly) { e.vy *= Math.pow(0.02, dt); }
      Z.moveBody(e, dt);
      if (e.wallSlam > 0) { e.wallSlam -= dt; if (e.hitWall) { e.wallSlam = 0; FX.addShake(5); A.play("hitHeavy", { x: e.x }); FX.burst(e.x + e.w / 2, e.y + e.h / 2, 12, { col: Z.dustCol || "#8a7a70", sp: 120, life: 0.4, size: 3, kind: "shard", g: 400 }); Z.hitEnemy(e, Z.dmgOf(P, null, 30), { crit: true, src: "wall" }); if (Z.metaLvl("riesenkeule") >= 3) Z.addStatus(e, "stun", 2); } }
      return;
    }
    if (st.stun > 0 || e.stagger > 0) {
      if (e.stagger > 0) e.stagger -= dt;
      if (!d.fly) { e.vy += 1400 * dt; e.vx = U.approach(e.vx, 0, 800 * dt); } else { e.vx *= 0.9; e.vy = U.approach(e.vy, d.fly && st.stun > 0 ? 60 : 0, 300 * dt); }
      Z.moveBody(e, dt);
      return;
    }
    /* Wahrnehmung */
    const sees = canSee(e, P) && !(e.lostT > 0);
    if (e.lostT > 0) e.lostT -= dt;
    if (sees && !e.aware) {
      e.aware = true; e.alertT = 0.5;
      if (d.snd && Z.R() < 0.6) A.play(d.snd, { x: e.x, y: e.y, vol: 0.4 });
      /* Gruppe mitreißen */
      for (const o of Z.enemies) if (o !== e && !o.aware && !o.dead && U.dist(o.x, o.y, e.x, e.y) < 110) { o.aware = true; o.alertT = 0.5 + Z.R() * 0.3; }
    }
    if (e.aware && !sees) { e.forget = (e.forget || 0) + dt; if (e.forget > 5 || P.invis > 0) { e.aware = false; e.forget = 0; } } else e.forget = 0;
    if (e.alertT > 0) e.alertT -= dt;
    e.cd -= dt;
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
    if (st.root > 0) { e.vx = 0; if (!d.fly) { e.vy += 1400 * dt; Z.moveBody(e, dt); } faceTo(e, dx); tryAttack(e, dx, dy, adx, P, true); return; }
    faceTo(e, dx);
    /* Angriff auswählen */
    if (tryAttack(e, dx, dy, adx, P)) return;
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
      case "jumper": dir = 0; if (e.onGround) { e.hopT = (e.hopT || 0) - dt; if (e.hopT <= 0) { e.hopT = 0.6 + Z.R() * 0.5; e.vy = -220; e.vx = U.sign(dx) * d.spd; } } break;
      case "turret": dir = 0; break;
    }
    moveToward(e, dt, dir, spd);
  }
  function faceTo(e, dx) { if (Math.abs(dx) > 4) e.face = U.sign(dx); }
  function idle(e, dt) {
    const d = e.def;
    if (d.fly) { e.vx = Math.sin(e.anim * 0.8) * 20; e.vy = Math.cos(e.anim * 1.3) * 12; Z.moveBody(e, dt); return; }
    if (d.ai === "turret") { e.vx = 0; e.vy += 1400 * dt; Z.moveBody(e, dt); return; }
    e.patrol -= dt;
    if (e.patrol <= 0) { e.patrol = 1.5 + Z.R() * 2.5; e.pDir = Z.R() < 0.4 ? 0 : Z.R() < 0.5 ? -1 : 1; }
    moveToward(e, dt, e.pDir || 0, 0.35);
  }
  /* Laufen mit Kantenprüfung */
  function moveToward(e, dt, dir, spd) {
    const d = e.def;
    if (d.ai === "turret" || d.spd === 0) dir = 0;
    if (e.st.slow > 0) spd *= 0.55;
    if (e.elite === "schnell") spd *= 1.35;
    if (dir && e.onGround) {
      /* nicht über Kanten laufen (außer kleine Stufen) und nicht in Gefahren */
      const ahead = dir > 0 ? e.x + e.w + 2 : e.x - 2, tx = Math.floor(ahead / T), ty = Math.floor((e.y + e.h + 2) / T);
      let ground = false;
      for (let k = 0; k < 3; k++) { const v = W.tile(tx, ty + k); if (W.solidT(v) || W.isPlat(tx, ty + k)) { ground = true; break; } if ([3, 5, 6, 9].includes(v)) break; }
      const hazard = [3, 5, 6, 9].includes(W.tile(tx, ty)) || [3, 5, 6, 9].includes(W.tile(tx, ty - 1));
      if (!ground || hazard) { dir = 0; if (!e.aware) e.pDir = -(e.pDir || 1); }
      /* kleine Wand: hochspringen, wenn der Spieler oben ist */
      if (dir && W.solidT(W.tile(tx, Math.floor((e.y + e.h - 4) / T))) && !W.solidT(W.tile(tx, Math.floor((e.y + e.h - 20) / T))) && e.aware) e.vy = -300;
    }
    e.vx = U.approach(e.vx, dir * d.spd * spd, 1400 * dt);
    e.vy += 1400 * dt; if (e.vy > 500) e.vy = 500;
    Z.moveBody(e, dt);
    if (e.hitWall && !e.aware) e.pDir = -e.hitWall;
    if (dir) e.face = e.st.fear > 0 ? dir : e.face;
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
      if (rooted && ["lunge", "leap", "charge", "dive", "teleport"].includes(a.k)) continue;
      if (adx < a.r[0] || adx > a.r[1]) continue;
      const maxDy = a.k === "leap" ? 90 : a.k === "dive" ? 200 : ["shoot", "lob", "mark", "summon", "heal", "shield", "teleport", "grow", "invis", "beam", "volley", "web", "pull"].includes(a.k) ? 160 : 28;
      if (Math.abs(dy) > maxDy && !(d.fly && a.k !== "hit")) continue;
      if (a.k === "summon" && countMinions(e) >= (a.max || 4)) continue;
      if (a.k === "heal" && !Z.enemies.some(o => !o.dead && o !== e && o.hp < o.hpMax * 0.7 && U.dist(o.x, o.y, e.x, e.y) < 260)) continue;
      if ((a.k === "shoot" || a.k === "lob" || a.k === "web" || a.k === "pull" || a.k === "beam") && !W.los(e.x + e.w / 2, e.y + 6, P.x + P.w / 2, P.y + 10)) continue;
      opts.push(a);
    }
    if (!opts.length) return false;
    let sum = 0; opts.forEach(a => (sum += a.w || 1));
    let r = Z.R() * sum, pick = opts[0];
    for (const a of opts) { r -= a.w || 1; if (r <= 0) { pick = a; break; } }
    startAct(e, pick, P);
    return true;
  }
  function countMinions(e) { return Z.enemies.filter(o => !o.dead && o.master === e).length; }
  function startAct(e, a, P) {
    const fast = e.elite === "wuetend" ? 0.75 : 1;
    e.act = { a, phase: "pre", t: 0, n: 0, hit: false, fast, armor: a.armor || e.elite === "gepanzert" };
    e.uses[a.k] = (e.uses[a.k] || 0) + 1;
    if (a.k === "shoot" || a.k === "lob" || a.k === "web" || a.k === "volley") e.act.aim = { x: P.x + P.w / 2, y: P.y + 12 };
    if (a.k === "mark") e.act.aim = { x: P.x + P.w / 2, y: Z.groundY(P.x + P.w / 2, P.y + P.h) };
    if (e.elite === "gepanzert" && Z.R() < 0.4) e.armorUp = 1.5;
  }
  Z.cancelEnemyAct = e => { if (e.act && !e.act.armor) { e.act = null; e.cd = 0.5; } };
  Z.staggerEnemy = (e, t) => { if (e.act && e.act.armor) return; if (e.act) { e.act = null; e.cd = Math.max(e.cd, 0.35); } e.stagger = t; };

  function runAct(e, dt, P, tgt) {
    const ac = e.act, a = ac.a, d = e.def;
    ac.t += dt / ac.fast;
    const dx = tgt.x + tgt.w / 2 - (e.x + e.w / 2);
    /* Bewegung während des Angriffs */
    if (!d.fly) e.vy += 1400 * dt;
    if (ac.phase === "pre") {
      if (a.track !== false && ac.t < a.pre * 0.6 && Math.abs(dx) > 6) e.face = U.sign(dx);
      if (!d.fly) e.vx = U.approach(e.vx, 0, 900 * dt);
      else { e.vx *= 0.9; e.vy *= 0.9; }
      if (ac.aim && !(a.lockAim && ac.t > a.pre - a.lockAim)) { ac.aim.x = U.lerp(ac.aim.x, P.x + P.w / 2, Math.min(1, dt * 6)); ac.aim.y = U.lerp(ac.aim.y, P.y + 12, Math.min(1, dt * 6)); if (a.k === "mark") ac.aim.y = Z.groundY(ac.aim.x, P.y + P.h); }
      if (ac.t >= a.pre) { ac.phase = "act"; ac.t = 0; onActStart(e, a, P, tgt); }
    } else if (ac.phase === "act") {
      onActTick(e, a, P, dt, tgt);
      if (ac.t >= a.act + (a.n && a.gap && !["shoot"].includes(a.k) ? (a.n - 1) * a.gap : 0) + (a.k === "shoot" && a.gap ? (a.n - 1) * a.gap : 0)) { ac.phase = "post"; ac.t = 0; onActEnd(e, a, P); }
    } else {
      if (!d.fly) e.vx = U.approach(e.vx, 0, 900 * dt); else { e.vx *= 0.92; e.vy *= 0.92; }
      if (ac.t >= a.post) { e.act = null; e.cd = (a.cd || 0.6) * (0.75 + Z.R() * 0.5) * (e.elite === "wuetend" ? 0.6 : 1); }
    }
    e.noPlat = !!d.fly;
    if (d.ai === "phase") { const g = e.ghost; e.ghost = true; Z.moveBody(e, dt); e.ghost = g; } else Z.moveBody(e, dt);
  }
  function hitbox(e, box) {
    const [bx, by, bw, bh] = box.map(v => v * (e.size || 1));
    const cx = e.x + e.w / 2, fy = e.y + e.h;
    return e.face > 0 ? { x: cx + bx, y: fy + by, w: bw, h: bh } : { x: cx - bx - bw, y: fy + by, w: bw, h: bh };
  }
  function dmgP(e, mul) { return e.dmgMul * (mul || 1) * (e.st.weak > 0 ? 0.6 : 1); }
  function meleeCheck(e, a, P, mul) {
    if (!P || P.dead) return;
    const r = hitbox(e, a.box);
    if (U.overlap(r, P)) { Z.hurtPlayer(dmgP(e, mul || a.dmg), { x: e.x + e.w / 2, kb: a.kb || 170, attacker: e, melee: true, unblockable: a.unblockable, parryable: !a.unblockable, eff: a.eff }); e.act.hit = true; if (a.hitSfx) A.play(a.hitSfx, { x: e.x, vol: 0.5 }); }
    for (const al of Z.allies) if (al.kind === "illusion" && U.overlap(r, al)) al.t += 1;
  }
  function onActStart(e, a, P, tgt) {
    const d = e.def, cx = e.x + e.w / 2, cy = e.y + e.h * 0.4;
    if (a.sfx) A.play(a.sfx, { x: e.x, y: e.y, vol: 0.55 });
    switch (a.k) {
      case "hit": case "combo": meleeCheck(e, a, P); e.vx = e.face * 40; break;
      case "lunge": e.vx = e.face * (a.lunge || 200); break;
      case "shoot": if (!a.gap) fire(e, a, P); break;
      case "volley": for (let i = 0; i < (a.n || 5); i++) { const tx = e.act.aim.x + (i - (a.n - 1) / 2) * 26; Z.aimProj(a.proj, cx, cy, tx, Z.groundY(tx, P.y + P.h) - 2, { dmg: dmgP(e, 0.8) }).g = 400; } break;
      case "lob": for (let i = 0; i < (a.n || 1); i++) Z.aimProj(a.proj, cx, cy - 4, e.act.aim.x + (i ? (Z.R() - 0.5) * 60 : 0), e.act.aim.y + 6, { dmg: dmgP(e) }); break;
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
        if (P && U.overlap(r, P) && P.iframe <= 0 && !P.dead) { e.act.grab = true; P.grabbed = e; P.grabT = 0; P.mash = 0; FX.text(P.x + P.w / 2, P.y - 10, L(["Gepackt! Rütteln!", "Grabbed! Mash!"]), "#ffb070"); }
        break;
      }
      case "spray": Z.spawnHazard({ kind: "breath", x: cx + e.face * 6, y: e.y + e.h * 0.35, w: a.len || 70, dir: e.face, life: a.act, dmg: dmgP(e, 0.45), owner: "e", eff: a.eff, col: a.col }); break;
      case "dive": { const t = P; const ang = Math.atan2(t.y + 10 - cy, t.x + t.w / 2 - cx); e.act.dv = [Math.cos(ang) * (a.spd || 280), Math.sin(ang) * (a.spd || 280)]; break; }
      case "beam": Z.spawnHazard({ kind: "zone", x: cx + e.face * 140, y: e.y + e.h * 0.5 + 6, w: 280, hgt: 10, warn: 0, active: a.act, life: a.act, dmg: dmgP(e, 1.2), owner: "e", col: a.col }); FX.addShake(2); break;
      case "pull": {
        if (P && W.los(cx, cy, P.x + P.w / 2, P.y + 10)) { e.act.pull = true; e.act.tether = true; FX.text(P.x + P.w / 2, P.y - 8, L(["Gezogen!", "Pulled!"]), "#eee8f0"); }
        break;
      }
      case "heal": for (const o of Z.enemies) if (!o.dead && U.dist(o.x, o.y, e.x, e.y) < 260) { o.hp = Math.min(o.hpMax, o.hp + o.hpMax * 0.3); FX.burst(o.x + o.w / 2, o.y + o.h / 2, 8, { col: "#9ad04a", sp: 40, up: 30, life: 0.6, size: 2, kind: "glow", add: true }); } break;
      case "shield": for (const o of Z.enemies) if (!o.dead && U.dist(o.x, o.y, e.x, e.y) < 220) { o.armorUp = 4; FX.ring(o.x + o.w / 2, o.y + o.h / 2, 16, "#ffd27a", 0.4, 2); } break;
      case "grow": e.size *= 1.45; e.w = Math.round(e.w * 1.3); e.h = Math.round(e.h * 1.45); e.y -= e.h * 0.31; e.dmgMul *= 1.35; e.hp += e.hpMax * 0.3; e.hpMax *= 1.3; Z.unstick(e); FX.ring(cx, e.y + e.h / 2, 30, "#ff6a2a", 0.4, 3); break;
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
    A.play(d.undead ? "undead" : d.snd || "die", { x: e.x, vol: 0.45 });
    if (!o.self) FX.stop(0.04);
    if (d.death === "gas") Z.spawnHazard({ kind: "poisoncloud", x: cx, y: e.y + e.h, w: 40, life: 2.5, dmg: e.dmgMul * 0.15, owner: "e", eff: { poison: 1 } });
    if (d.death === "spiders") for (let i = 0; i < 3; i++) { const m = Z.spawnEnemy("spinnchen", cx + (i - 1) * 8, e.y + e.h); if (m) { m.aware = true; m.vy = -200; m.vx = (i - 1) * 80; } }
    if (d.split) for (const s of [-1, 1]) { const m = Z.spawnEnemy(d.split, cx + s * 6, e.y + e.h); if (m) { m.aware = true; m.vy = -220; m.vx = s * 120; } }
    if (P && P.st && P.st.burn !== undefined && ["a1", "a2"].some(s => P.slots[s] && P.slots[s].id === "glutaxt") && Z.metaLvl("glutaxt") >= 3 && e.st.burn > 0) Z.explode(cx, cy, 36, Z.dmgOf(P, null, 14), "p");
    if (e.elite === "beschwoerer") for (let i = 0; i < 2; i++) { const m = Z.spawnEnemy(e.id === "brutsack" ? "spinnchen" : e.id, cx + (i - 0.5) * 20, e.y + e.h); if (m) m.aware = true; }
    if (d.boss) return; /* Bosse kümmern sich selbst */
    if (e.master || o.self && !d.gold) { /* beschworene Wesen geben wenig */ }
    if (P) {
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
    if (Z.R() < 0.025) Z.spawnPickup("food", cx, e.y + e.h, { food: Z.R.pick(Z.FOOD), drop: true });
  };

  /* Elite markieren (Aura) – wird beim Erzeugen der Karte vergeben */
  Z.ELITE = ELITE;
})();
