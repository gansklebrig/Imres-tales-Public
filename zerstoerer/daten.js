/* Ezekiel – The Destroyer · Daten
   Waffen, Fähigkeiten, Segen, Eigenschaften (Affixe), Seltenheiten und Werte. Texte immer [deutsch, englisch]. */
(function () {
  "use strict";
  const Z = window.Z;
  Z.L = v => (Array.isArray(v) ? v[Z.settings.lang === "en" ? 1 : 0] : v);

  /* Werte (Statistiken): Brutalität, Taktik, Überleben. Bewusst ohne Blau. */
  Z.STATS = {
    brut: { n: ["Brutalität", "Brutality"], col: "#e0545a", d: ["+12 % Schaden mit roten Waffen", "+12% damage with red weapons"] },
    takt: { n: ["Taktik", "Tactics"], col: "#b77cff", d: ["+12 % Schaden mit violetten Waffen und Fähigkeiten", "+12% damage with purple weapons and skills"] },
    ueber: { n: ["Überleben", "Survival"], col: "#7fd36a", d: ["+12 % Schaden mit grünen Waffen, mehr Leben", "+12% damage with green weapons, more health"] }
  };
  Z.RARITY = [
    { n: ["Gewöhnlich", "Common"], col: "#c4bcae", aff: 0 },
    { n: ["Selten", "Rare"], col: "#7fd36a", aff: 1 },
    { n: ["Episch", "Epic"], col: "#bf7dff", aff: 2 },
    { n: ["Legendär", "Legendary"], col: "#ff8d2e", aff: 3 }
  ];
  /* Fundhäufigkeit der Waffen (Grundgewicht) */
  Z.FIND = { haeufig: { w: 10, n: ["häufig", "common"] }, selten: { w: 5, n: ["selten", "uncommon"] }, rar: { w: 2.2, n: ["sehr selten", "rare"] }, legende: { w: 0.7, n: ["legendär", "legendary"] } };

  /* ======================= WAFFEN =======================
     kind: melee | ranged | shield. stat: Hauptwert. find: Fundhäufigkeit. tier: frühestes Gebiet. only: nur in bestimmten Gebieten/Bossen.
     combo: Schläge mit pre (Ausholen), act (Treffer aktiv), post (Erholung), dmg, box [x,y,w,h] relativ (x nach vorn), lunge, kb.
     tags: Spielstil-Schlagwörter für das Fundbuch. */
  const W = (Z.WEAPONS = {
    faeuste: {
      n: ["Bloße Fäuste", "Bare Fists"], kind: "melee", stat: "brut", find: null, icon: "fist", col: "#d8b49a",
      d: ["Ein Goliath braucht eigentlich keine Waffe. Eigentlich.", "A goliath doesn't really need a weapon. Really."],
      combo: [
        { pre: 0.05, act: 0.07, post: 0.1, dmg: 6, box: [4, -22, 18, 14], lunge: 40, kb: 50, sw: "punch", smear: { r: 14, a0: -0.6, a1: 0.4, th: 4 } },
        { pre: 0.05, act: 0.07, post: 0.1, dmg: 6, box: [4, -22, 18, 14], lunge: 40, kb: 50, sw: "punch", smear: { r: 14, a0: 0.5, a1: -0.5, th: 4 } },
        { pre: 0.1, act: 0.09, post: 0.22, dmg: 11, box: [2, -26, 22, 20], lunge: 90, kb: 190, kbUp: 120, sw: "punch", heavy: true, smear: { r: 18, a0: 1.2, a1: -1.2, th: 6 } }
      ], tags: ["start"]
    },
    kurzschwert: {
      n: ["Rostiges Kurzschwert", "Rusty Shortsword"], kind: "melee", stat: "brut", find: null, tier: 0, icon: "dagger", col: "#c8c0b4",
      d: ["Ein schlichtes Schwert aus der Rüstkammer. Drei ehrliche Hiebe, nichts Besonderes – aber besser als Fäuste.", "A plain sword from the armoury. Three honest strikes, nothing special – but better than fists."],
      combo: [
        { pre: 0.06, act: 0.07, post: 0.1, dmg: 8, box: [0, -26, 26, 22], lunge: 50, kb: 50, sw: "slash", smear: { r: 22, a0: -1.5, a1: 0.9, th: 6 } },
        { pre: 0.06, act: 0.07, post: 0.1, dmg: 8, box: [0, -26, 26, 22], lunge: 50, kb: 50, sw: "slash", smear: { r: 22, a0: 1.2, a1: -1.3, th: 6 } },
        { pre: 0.1, act: 0.1, post: 0.24, dmg: 14, box: [0, -30, 30, 26], lunge: 90, kb: 150, kbUp: 60, sw: "slash", heavy: true, smear: { r: 26, a0: -2.2, a1: 1.4, th: 8 } }
      ], tags: ["start"]
    },
    holzschild: {
      n: ["Beschlagenes Holzschild", "Studded Wooden Shield"], kind: "shield", stat: "ueber", find: null, tier: 0, icon: "shield", col: "#a88a62",
      d: ["Halten zum Blocken, im richtigen Moment gehoben pariert es. Antippen: Schildstoß. Einfach, aber verlässlich.", "Hold to block; raised at the right moment it parries. Tap: shield bash. Simple but reliable."],
      shield: { block: 0.85, parry: 0.18, bash: 12, parryStun: 1.2 }, tags: ["start"]
    },
    jagdbogen: {
      faden: true, n: ["Einfacher Jagdbogen", "Plain Hunting Bow"], kind: "ranged", stat: "takt", find: null, tier: 0, icon: "bow", col: "#b89a6a",
      d: ["Halten zum Spannen. Voll gespannte Pfeile treffen härter. Kein Zauber, nur Holz und Sehne.", "Hold to draw. Fully drawn arrows hit harder. No magic, just wood and string."],
      shoot: { charge: 0.75, minCharge: 0.12, post: 0.18, proj: "pfeil", dmg: 8, dmgFull: 24, sw: "bow" }, tags: ["start", "Faden"]
    },
    sicheln: {
      n: ["Ezekiels Sicheln", "Ezekiel's Sickles"], kind: "melee", stat: "brut", find: "haeufig", tier: 0, icon: "sickles", col: "#ff5a4e",
      d: ["Zwei Klingen, geschwungen wie Sicheln. Schnelle Viererkette; der letzte Hieb trifft kritisch und lässt bluten.", "Two blades curved like sickles. Fast four-hit chain; the last strike always crits and causes bleeding."],
      combo: [
        { pre: 0.05, act: 0.06, post: 0.08, dmg: 9, box: [0, -26, 26, 22], lunge: 60, kb: 40, sw: "slash", smear: { r: 22, a0: -1.6, a1: 0.9, th: 7 } },
        { pre: 0.04, act: 0.06, post: 0.08, dmg: 9, box: [0, -26, 26, 22], lunge: 60, kb: 40, sw: "slash", smear: { r: 22, a0: 1.2, a1: -1.3, th: 7 } },
        { pre: 0.05, act: 0.06, post: 0.09, dmg: 10, box: [0, -28, 28, 24], lunge: 70, kb: 50, sw: "slash", smear: { r: 24, a0: -1.8, a1: 1.0, th: 8 } },
        { pre: 0.09, act: 0.12, post: 0.24, dmg: 18, box: [-10, -30, 40, 30], lunge: 110, kb: 170, sw: "slash", crit: "always", heavy: true, eff: { bleed: 1 }, spin: true, smear: { r: 26, a0: -3.1, a1: 3.1, th: 9 } }
      ], tags: ["schnell", "blutung"], master: ["Meisterschaft: Der vierte Hieb wirft eine Sichel aus Glut.", "Mastery: the fourth strike throws an ember sickle."]
    },
    schattendolch: {
      n: ["Schattendolch", "Shadow Dagger"], kind: "melee", stat: "takt", find: "selten", tier: 0, icon: "dagger", col: "#bf7dff",
      d: ["Rasend schnelle Stiche. Von hinten oder gegen ahnungslose Gegner immer kritisch (×3).", "Lightning-fast stabs. Always crits (×3) from behind or against unaware enemies."],
      combo: [
        { pre: 0.03, act: 0.05, post: 0.06, dmg: 7, box: [2, -22, 24, 12], lunge: 50, kb: 20, sw: "stab", smear: { r: 20, a0: -0.2, a1: 0.15, th: 3, stab: true } },
        { pre: 0.03, act: 0.05, post: 0.06, dmg: 7, box: [2, -22, 24, 12], lunge: 50, kb: 20, sw: "stab", smear: { r: 20, a0: 0.2, a1: -0.15, th: 3, stab: true } },
        { pre: 0.06, act: 0.06, post: 0.16, dmg: 12, box: [2, -24, 28, 16], lunge: 120, kb: 90, sw: "stab", smear: { r: 24, a0: -0.1, a1: 0.1, th: 4, stab: true } }
      ], critMul: 3, crit: "backstab", tags: ["meuchler", "kritisch"], master: ["Meisterschaft: Kritische Treffer machen dich kurz unsichtbar.", "Mastery: crits briefly make you invisible."]
    },
    dawnbringer: {
      n: ["Dawnbringer", "Dawnbringer"], kind: "melee", stat: "brut", find: "legende", tier: 3, only: ["schlund", "wraith"], icon: "dawn", col: "#ffd27a", legendaryOnly: true,
      d: ["Leuchtet wie der Morgen. Doppelter Schaden gegen Untote und Dämonen; der dritte Hieb schickt eine Lichtwelle los.", "Shines like the morning. Double damage against undead and demons; the third strike sends a wave of light."],
      combo: [
        { pre: 0.08, act: 0.08, post: 0.12, dmg: 20, box: [-4, -34, 38, 34], lunge: 70, kb: 90, sw: "slash", smear: { r: 32, a0: -2.0, a1: 1.0, th: 10 } },
        { pre: 0.08, act: 0.08, post: 0.12, dmg: 20, box: [-4, -34, 38, 34], lunge: 70, kb: 90, sw: "slash", smear: { r: 32, a0: 1.4, a1: -1.6, th: 10 } },
        { pre: 0.14, act: 0.1, post: 0.28, dmg: 34, box: [-6, -40, 44, 40], lunge: 100, kb: 200, sw: "holy", heavy: true, proj: "lichtwelle", smear: { r: 36, a0: -2.6, a1: 1.3, th: 12 } }
      ], vsHoly: 2, light: 90, tags: ["licht", "gegen Untote"], master: ["Meisterschaft: Kills mit Dawnbringer heilen 3 %.", "Mastery: kills with Dawnbringer heal 3%."]
    },
    kriegshammer: {
      n: ["Duergar-Kriegshammer", "Duergar Warhammer"], kind: "melee", stat: "ueber", find: "selten", tier: 1, icon: "hammer", col: "#e5a43a",
      d: ["Langsam und gnadenlos. Der Aufschlag erzeugt Schockwellen, die betäuben. Kritisch gegen Betäubte.", "Slow and merciless. The impact creates shockwaves that stun. Crits against stunned enemies."],
      combo: [
        { pre: 0.2, act: 0.1, post: 0.24, dmg: 26, box: [-2, -34, 36, 36], lunge: 40, kb: 160, sw: "swingHeavy", hitSnd: "hitHeavy", heavy: true, eff: { stun: 0.6 }, smear: { r: 30, a0: -2.4, a1: 0.7, th: 12 } },
        { pre: 0.26, act: 0.12, post: 0.34, dmg: 40, box: [-6, -36, 44, 38], lunge: 30, kb: 220, sw: "swingHeavy", hitSnd: "hitHeavy", heavy: true, quake: true, eff: { stun: 1.1 }, smear: { r: 32, a0: -2.8, a1: 1.5, th: 14 } }
      ], crit: "stunned", critMul: 2.2, superArmor: true, tags: ["Kontrolle", "Panzer"], master: ["Meisterschaft: Schockwellen laufen doppelt so weit.", "Mastery: shockwaves travel twice as far."]
    },
    sense: {
      n: ["Sense des Schnitters", "Reaper's Scythe"], kind: "melee", stat: "brut", find: "rar", tier: 2, icon: "scythe", col: "#e0545a",
      d: ["Weite Kreisschläge vor und hinter dir. Kritisch, wenn drei oder mehr Gegner getroffen werden. Kills heilen.", "Wide circular sweeps front and back. Crits when three or more enemies are hit. Kills heal."],
      combo: [
        { pre: 0.12, act: 0.1, post: 0.16, dmg: 22, box: [-36, -36, 72, 36], lunge: 30, kb: 100, sw: "slash", smear: { r: 38, a0: -2.8, a1: 0.6, th: 9 } },
        { pre: 0.12, act: 0.12, post: 0.3, dmg: 30, box: [-40, -38, 80, 40], lunge: 30, kb: 150, sw: "slash", spin: true, heavy: true, smear: { r: 40, a0: -3.14, a1: 3.14, th: 10 } }
      ], crit: "multi", critMul: 2, killHeal: 0.03, tags: ["Gruppen", "Heilung"], master: ["Meisterschaft: Jeder Kill verlängert den nächsten Schwung.", "Mastery: each kill widens the next sweep."]
    },
    kettenpeitsche: {
      faden: true, n: ["Kettenpeitsche", "Chain Whip"], kind: "melee", stat: "takt", find: "selten", tier: 0, icon: "whip", col: "#c8a070",
      d: ["Sehr große Reichweite. Die Spitze trifft kritisch. Der dritte Schlag reißt Gegner zu dir heran.", "Huge reach. The tip crits. The third lash yanks enemies toward you."],
      combo: [
        { pre: 0.08, act: 0.06, post: 0.12, dmg: 11, box: [6, -26, 74, 12], lunge: 0, kb: 30, sw: "whip", whip: true, smear: { r: 70, a0: -0.25, a1: 0.05, th: 2 } },
        { pre: 0.08, act: 0.06, post: 0.12, dmg: 11, box: [6, -22, 74, 12], lunge: 0, kb: 30, sw: "whip", whip: true, smear: { r: 70, a0: 0.2, a1: -0.05, th: 2 } },
        { pre: 0.12, act: 0.08, post: 0.22, dmg: 15, box: [6, -28, 80, 18], lunge: 0, kb: -260, sw: "whip", whip: true, pull: true, smear: { r: 76, a0: -0.3, a1: 0.1, th: 3 } }
      ], crit: "tip", critMul: 2.2, tags: ["Reichweite", "Kontrolle", "Faden"], master: ["Meisterschaft: Herangezogene Gegner sind kurz betäubt.", "Mastery: yanked enemies are briefly stunned."]
    },
    scherenspeer: {
      n: ["Krebsscherenspeer", "Crab-Claw Spear"], kind: "melee", stat: "ueber", find: "selten", tier: 1, icon: "spear", col: "#d8706a",
      d: ["Der Speer der Kuo-Toa. Stöße durchbohren alles in einer Linie; der dritte schnappt zu und hält fest. Kritisch gegen Gegner in der Luft.", "The spear of the kuo-toa. Thrusts pierce everything in a line; the third snaps shut and holds. Crits airborne enemies."],
      combo: [
        { pre: 0.07, act: 0.07, post: 0.12, dmg: 14, box: [4, -24, 52, 10], lunge: 80, kb: 70, sw: "spear", smear: { r: 50, a0: -0.04, a1: 0.04, th: 3, stab: true } },
        { pre: 0.07, act: 0.07, post: 0.12, dmg: 14, box: [4, -24, 52, 10], lunge: 80, kb: 70, sw: "spear", smear: { r: 50, a0: 0.04, a1: -0.04, th: 3, stab: true } },
        { pre: 0.12, act: 0.08, post: 0.26, dmg: 22, box: [4, -28, 58, 16], lunge: 160, kb: 20, sw: "spear", eff: { root: 1.4 }, smear: { r: 56, a0: -0.08, a1: 0.08, th: 5, stab: true } }
      ], crit: "air", critMul: 2, pierce: true, tags: ["Reichweite", "Festhalten"], master: ["Meisterschaft: Der dritte Stoß zieht dich mit zum Ziel.", "Mastery: the third thrust carries you to the target."]
    },
    glutaxt: {
      n: ["Glutaxt", "Ember Axe"], kind: "melee", stat: "brut", find: "haeufig", tier: 1, icon: "axe", col: "#ff7a2a",
      d: ["Geschmiedet in Gracklstugh. Jeder Hieb entzündet. Kritisch gegen brennende Gegner.", "Forged in Gracklstugh. Every strike ignites. Crits against burning enemies."],
      combo: [
        { pre: 0.1, act: 0.08, post: 0.14, dmg: 15, box: [-2, -30, 32, 30], lunge: 60, kb: 90, sw: "axe", eff: { burn: 1 }, smear: { r: 28, a0: -2.2, a1: 0.9, th: 9 } },
        { pre: 0.1, act: 0.08, post: 0.14, dmg: 15, box: [-2, -30, 32, 30], lunge: 60, kb: 90, sw: "axe", eff: { burn: 1 }, smear: { r: 28, a0: 1.3, a1: -1.7, th: 9 } },
        { pre: 0.16, act: 0.1, post: 0.26, dmg: 24, box: [-4, -34, 38, 36], lunge: 80, kb: 160, sw: "axe", heavy: true, eff: { burn: 2 }, smear: { r: 32, a0: -2.8, a1: 1.2, th: 11 } }
      ], crit: "burning", critMul: 2, tags: ["Feuer"], master: ["Meisterschaft: Brennende Gegner explodieren beim Tod.", "Mastery: burning enemies explode on death."]
    },
    riesenkeule: {
      n: ["Riesenkeule", "Giant's Club"], kind: "melee", stat: "ueber", find: "rar", tier: 2, icon: "club", col: "#a08060",
      d: ["Gehörte einem Riesen, der nicht bei sich war. Gewaltiger Rückstoß – wer gegen eine Wand fliegt, nimmt doppelt Schaden.", "Belonged to a giant who wasn't himself. Huge knockback – anyone slammed into a wall takes double damage."],
      combo: [
        { pre: 0.3, act: 0.12, post: 0.36, dmg: 48, box: [-6, -40, 46, 42], lunge: 30, kb: 420, kbUp: 160, sw: "swingHeavy", hitSnd: "hitHeavy", heavy: true, wallSlam: true, smear: { r: 38, a0: -2.6, a1: 1.0, th: 16 } }
      ], superArmor: true, tags: ["Wucht", "Glaskanone"], master: ["Meisterschaft: Wandtreffer betäuben 2 Sekunden.", "Mastery: wall slams stun for 2 seconds."]
    },
    drachenzahn: {
      n: ["Venomfangs Zahn", "Venomfang's Fang"], kind: "melee", stat: "takt", find: "rar", tier: 3, only: ["zinnen", "sturm", "venomfang"], icon: "rapier", col: "#a8e050",
      d: ["Ein Rapier aus einem Drachenzahn. Jeder Stich vergiftet. Nach einer Rolle zwei Sekunden lang kritisch.", "A rapier made from a dragon's fang. Every thrust poisons. Crits for two seconds after a roll."],
      combo: [
        { pre: 0.04, act: 0.05, post: 0.07, dmg: 9, box: [2, -24, 36, 10], lunge: 70, kb: 30, sw: "stab", eff: { poison: 1 }, smear: { r: 34, a0: -0.05, a1: 0.05, th: 2, stab: true } },
        { pre: 0.04, act: 0.05, post: 0.07, dmg: 9, box: [2, -20, 36, 10], lunge: 70, kb: 30, sw: "stab", eff: { poison: 1 }, smear: { r: 34, a0: 0.05, a1: -0.05, th: 2, stab: true } },
        { pre: 0.05, act: 0.05, post: 0.07, dmg: 9, box: [2, -28, 36, 10], lunge: 70, kb: 30, sw: "stab", eff: { poison: 1 }, smear: { r: 34, a0: -0.1, a1: 0, th: 2, stab: true } },
        { pre: 0.08, act: 0.06, post: 0.2, dmg: 16, box: [2, -26, 42, 14], lunge: 150, kb: 120, sw: "stab", eff: { poison: 3 }, smear: { r: 40, a0: 0, a1: 0, th: 4, stab: true } }
      ], crit: "afterRoll", critMul: 2.2, tags: ["Gift", "Fechter"], master: ["Meisterschaft: Gift tickt doppelt so schnell.", "Mastery: poison ticks twice as fast."]
    },
    krummsaebel: {
      n: ["Ilvaras Krummsäbel", "Ilvara's Scimitars"], kind: "melee", stat: "takt", find: "rar", tier: 2, icon: "scimitar", col: "#c890ff",
      d: ["Jeder Hieb ist ein Sprint durch die Gegner hindurch. Unverwundbar während des Durchzugs.", "Every strike is a dash straight through enemies. Invulnerable during the dash."],
      combo: [
        { pre: 0.06, act: 0.12, post: 0.12, dmg: 14, box: [-20, -26, 40, 24], lunge: 330, dash: true, kb: 30, sw: "slash", smear: { r: 26, a0: -1.2, a1: 1.2, th: 6 } },
        { pre: 0.06, act: 0.12, post: 0.12, dmg: 14, box: [-20, -26, 40, 24], lunge: 330, dash: true, kb: 30, sw: "slash", smear: { r: 26, a0: 1.2, a1: -1.2, th: 6 } },
        { pre: 0.1, act: 0.14, post: 0.24, dmg: 22, box: [-24, -30, 48, 30], lunge: 360, dash: true, kb: 150, sw: "slash", eff: { bleed: 1 }, smear: { r: 30, a0: -2.6, a1: 2.6, th: 8 } }
      ], crit: "afterRoll", critMul: 1.8, tags: ["Beweglich", "Ausweichen"], master: ["Meisterschaft: Durchzüge hinterlassen eine Schattenklinge.", "Mastery: dashes leave a shadow blade behind."]
    },
    demonenklaue: {
      n: ["Chasme-Stachel", "Chasme Stinger"], kind: "melee", stat: "ueber", find: "rar", tier: 3, only: ["zinnen", "chasme", "sturm", "glut"], icon: "claw", col: "#d8c040",
      d: ["Ein Handschuh mit dem Stachel der Chasme. Jeder Treffer saugt Leben. Kritisch gegen Vergiftete.", "A gauntlet bearing the chasme's stinger. Every hit drains life. Crits against poisoned enemies."],
      combo: [
        { pre: 0.05, act: 0.06, post: 0.08, dmg: 10, box: [2, -24, 24, 16], lunge: 50, kb: 40, sw: "stab", smear: { r: 18, a0: -0.8, a1: 0.5, th: 5 } },
        { pre: 0.05, act: 0.06, post: 0.08, dmg: 10, box: [2, -24, 24, 16], lunge: 50, kb: 40, sw: "stab", smear: { r: 18, a0: 0.8, a1: -0.5, th: 5 } },
        { pre: 0.1, act: 0.08, post: 0.2, dmg: 18, box: [2, -28, 30, 22], lunge: 100, kb: 120, sw: "stab", eff: { poison: 2 }, smear: { r: 22, a0: -1.4, a1: 0.8, th: 7 } }
      ], leech: 0.04, crit: "poisoned", critMul: 2, tags: ["Lebensraub", "Panzer"], master: ["Meisterschaft: Lebensraub auch bei Fähigkeiten.", "Mastery: life drain also works with skills."]
    },
    anker: {
      n: ["Hafenanker", "Harbour Anchor"], kind: "melee", stat: "ueber", find: "selten", tier: 1, only: ["hafen", "see", "erzpriesterin", "schlund", "schmiede", "glut", "zinnen", "sturm"], icon: "anchor", col: "#9a8a7a",
      d: ["Rostig, schwer und erstaunlich treffsicher. Wirft den Anker aus und zieht alles Getroffene zu dir.", "Rusty, heavy and surprisingly accurate. Throws the anchor and drags everything it hits back to you."],
      combo: [
        { pre: 0.22, act: 0.12, post: 0.3, dmg: 30, box: [-6, -36, 40, 38], lunge: 20, kb: 200, sw: "swingHeavy", hitSnd: "hitHeavy", heavy: true, eff: { stun: 0.4 }, smear: { r: 34, a0: -2.4, a1: 1.0, th: 13 } },
        { pre: 0.2, act: 0.04, post: 0.4, dmg: 26, box: [0, 0, 0, 0], sw: "chain", proj: "anker", heavy: true }
      ], superArmor: true, tags: ["Panzer", "Heranziehen"], master: ["Meisterschaft: Der Anker kehrt zweimal zurück.", "Mastery: the anchor returns twice."]
    },
    steinfaust: {
      n: ["Steinsprecher-Fäuste", "Stonespeaker Fists"], kind: "melee", stat: "ueber", find: "selten", tier: 2, icon: "stonefist", col: "#e09040",
      d: ["Fäuste aus Granit mit einem Funken des Kristalls. Der Bodenschlag lässt Felsdornen aufsteigen, die Gegner hochschleudern.", "Granite fists with a spark of the crystal. The ground punch raises rock spikes that hurl enemies up."],
      combo: [
        { pre: 0.07, act: 0.07, post: 0.1, dmg: 13, box: [2, -24, 24, 18], lunge: 60, kb: 70, sw: "punch", hitSnd: "hitHeavy", smear: { r: 16, a0: -0.6, a1: 0.4, th: 6 } },
        { pre: 0.07, act: 0.07, post: 0.1, dmg: 13, box: [2, -24, 24, 18], lunge: 60, kb: 70, sw: "punch", hitSnd: "hitHeavy", smear: { r: 16, a0: 0.6, a1: -0.4, th: 6 } },
        { pre: 0.18, act: 0.08, post: 0.3, dmg: 22, box: [-4, -14, 28, 16], lunge: 20, kb: 60, kbUp: 280, sw: "rock", heavy: true, spikes: true, smear: { r: 20, a0: -2.4, a1: 1.6, th: 10 } }
      ], tags: ["Kontrolle", "Wucht"], master: ["Meisterschaft: Drei Reihen Felsdornen statt einer.", "Mastery: three rows of rock spikes instead of one."]
    },
    /* ---------- Fernkampf ---------- */
    bogen: {
      n: ["Ezekiels Bogen", "Ezekiel's Bow"], kind: "ranged", stat: "takt", find: "haeufig", tier: 0, icon: "bow", col: "#d8b46a",
      d: ["Halten zum Spannen. Voll gespannt durchschlägt der Pfeil alles und trifft kritisch. Wie damals beim Drachen.", "Hold to draw. Fully drawn, the arrow pierces everything and crits. Just like with the dragon."],
      shoot: { charge: 0.75, minCharge: 0.12, post: 0.16, proj: "pfeil", dmg: 10, dmgFull: 32, sw: "bow" }, tags: ["Fernkampf", "Präzision"], master: ["Meisterschaft: Volle Schüsse teilen sich in drei Pfeile.", "Mastery: full shots split into three arrows."]
    },
    armbrust: {
      n: ["Fagas' Armbrust", "Fagas' Crossbow"], kind: "ranged", stat: "takt", find: "selten", tier: 1, icon: "xbow", col: "#c8a060",
      d: ["Zielen konnte er schon immer. Durchschlagende Bolzen, kritisch auf große Entfernung. Lädt nach drei Schüssen nach.", "He could always aim. Piercing bolts, crit at long range. Reloads after three shots."],
      shoot: { pre: 0.08, post: 0.12, proj: "bolzen", dmg: 16, mag: 3, reload: 0.9, sw: "xbow" }, crit: "far", critMul: 2, tags: ["Fernkampf", "Durchschlag"], master: ["Meisterschaft: Fünf Bolzen pro Magazin.", "Mastery: five bolts per magazine."]
    },
    wurfmesser: {
      faden: true, n: ["Wurfmesser", "Throwing Knives"], kind: "ranged", stat: "brut", find: "haeufig", tier: 0, icon: "knives", col: "#d0c8c0",
      d: ["Drei Messer in schneller Folge. Jedes lässt bluten. Kritisch gegen Blutende.", "Three knives in quick succession. Each causes bleeding. Crits against bleeding enemies."],
      shoot: { pre: 0.03, post: 0.08, proj: "messer", dmg: 6, burst: 3, burstGap: 0.07, sw: "throwK" }, crit: "bleeding", critMul: 2, tags: ["start", "Fernkampf", "Blutung", "Faden"], master: ["Meisterschaft: Messer prallen einmal ab.", "Mastery: knives ricochet once."]
    },
    phiolen: {
      n: ["Glasstabs Phiolen", "Glasstaff's Vials"], kind: "ranged", stat: "takt", find: "selten", tier: 1, icon: "vial", col: "#7fd36a",
      d: ["Im Bogen geworfene Fläschchen. Sie zerspringen zu einer brennenden Lache.", "Flasks thrown in an arc. They shatter into a burning pool."],
      shoot: { pre: 0.1, post: 0.2, proj: "phiole", dmg: 14, sw: "glass" }, tags: ["Feuer", "Fläche"], master: ["Meisterschaft: Zwei Phiolen auf einmal.", "Mastery: two vials at once."]
    },
    blitzstab: {
      n: ["Peitscherstab", "Whip-Priest's Staff"], kind: "ranged", stat: "takt", find: "rar", tier: 2, only: ["hafen", "see", "erzpriesterin", "schlund", "schmiede", "glut", "zinnen", "sturm"], icon: "staff", col: "#e8e070",
      d: ["Ein Blitz springt auf bis zu vier Gegner über und betäubt kurz.", "A bolt leaps to up to four enemies and briefly stuns."],
      shoot: { pre: 0.12, post: 0.3, proj: "blitz", dmg: 18, chain: 4, sw: "zap" }, eff: { stun: 0.3 }, tags: ["Kettenblitz", "Kontrolle"], master: ["Meisterschaft: Sechs Sprünge.", "Mastery: six jumps."]
    },
    netzdruese: {
      faden: true, n: ["Ettercap-Drüse", "Ettercap Gland"], kind: "ranged", stat: "ueber", find: "selten", tier: 1, icon: "web", col: "#e8e0e8",
      d: ["Verschießt klebrige Netze. Getroffene sind gefesselt und nehmen mehr Schaden.", "Shoots sticky webs. Victims are rooted and take more damage."],
      shoot: { pre: 0.08, post: 0.2, proj: "netz", dmg: 4, sw: "web" }, eff: { root: 2.2, mark: 3 }, tags: ["Kontrolle", "Faden"], master: ["Meisterschaft: Netze kleben auch an weiteren Gegnern dahinter.", "Mastery: webs also stick to enemies behind."]
    },
    /* ---------- Schilde ---------- */
    turmschild: {
      n: ["Turmschild der Zwerge", "Dwarven Tower Shield"], kind: "shield", stat: "ueber", find: "haeufig", tier: 0, icon: "shield", col: "#a8907a",
      d: ["Halten zum Blocken. Genau im richtigen Moment gehoben: Parade – der Angreifer wird betäubt, Geschosse prallen zurück.", "Hold to block. Raised at exactly the right moment: parry – the attacker is stunned, projectiles bounce back."],
      shield: { block: 1, parry: 0.2, bash: 16, parryStun: 1.6 }, tags: ["Panzer", "Parade"], master: ["Meisterschaft: Paraden heilen 4 %.", "Mastery: parries heal 4%."]
    },
    goldschild: {
      n: ["Ploopploopeens Goldschild", "Ploopploopeen's Gold Shield"], kind: "shield", stat: "takt", find: "rar", tier: 2, only: ["hafen", "see", "erzpriesterin", "schlund", "schmiede"], icon: "goldshield", col: "#ffd27a",
      d: ["Das Brustschild des Erzpriesters. Riesiges Paradefenster; parierte Geschosse fliegen mit dreifachem Schaden zurück.", "The archpriest's breastplate. Huge parry window; parried projectiles return with triple damage."],
      shield: { block: 0.8, parry: 0.34, bash: 10, reflectMul: 3, parryStun: 1.2 }, tags: ["Parade", "Rückwurf"], master: ["Meisterschaft: Paraden machen dich 2 Sekunden unverwundbar.", "Mastery: parries make you invulnerable for 2 seconds."]
    },
    dornenschild: {
      n: ["Dornenschild", "Thorn Shield"], kind: "shield", stat: "brut", find: "selten", tier: 1, icon: "thornshield", col: "#8a6a3a",
      d: ["Aus Blight-Ranken geflochten. Wer gegen den Schild schlägt, wird von Dornen zerrissen.", "Woven from blight vines. Whoever strikes the shield is torn by thorns."],
      shield: { block: 0.85, parry: 0.16, bash: 12, thorns: 1.4, parryStun: 1.0 }, tags: ["Dornen", "Panzer"], master: ["Meisterschaft: Dornen lassen bluten.", "Mastery: thorns cause bleeding."]
    }
  });

  /* ======================= FÄHIGKEITEN ======================= */
  const S = (Z.SKILLS = {
    rex: { n: ["Rex!", "Rex!"], stat: "takt", find: "selten", cd: 22, icon: "rex", col: "#c88a4a", d: ["Rex kommt angerannt, beißt sich 12 Sekunden lang fest und markiert Gegner: Sie nehmen 25 % mehr Schaden.", "Rex comes running, bites for 12 seconds and marks enemies: they take 25% more damage."] },
    spottlied: { n: ["Barradins Spottlied", "Barradin's Mocking Song"], stat: "takt", find: "selten", cd: 16, icon: "lute", col: "#ffc24a", d: ["Eine so giftige Strophe, dass Gegner in der Nähe 6 Sekunden lang verunsichert sind: weniger Schaden, mehr Treffer.", "A verse so venomous that nearby enemies are shaken for 6 seconds: they deal less and take more damage."] },
    pfeilhagel: { n: ["Friedrichs Pfeilhagel", "Friedrich's Arrow Rain"], stat: "takt", find: "haeufig", cd: 12, icon: "arrows", col: "#8fd36b", d: ["Ein Regen aus Pfeilen vor dir.", "A rain of arrows ahead of you."] },
    echoblitz: { n: ["Echos Blitz", "Echo's Lightning"], stat: "takt", find: "selten", cd: 9, icon: "bolt", col: "#f0e060", d: ["Ein Blitz schlägt im nächsten Gegner ein und springt weiter.", "Lightning strikes the nearest enemy and leaps on."] },
    giftwolke: { n: ["Echos Giftwolke", "Echo's Poison Cloud"], stat: "takt", find: "haeufig", cd: 14, icon: "cloud", col: "#9ad04a", d: ["Eine Wolke, die alles darin vergiftet.", "A cloud that poisons everything inside."] },
    rauchbombe: { n: ["Rauchbombe", "Smoke Bomb"], stat: "brut", find: "selten", cd: 15, icon: "smoke", col: "#8a8090", d: ["3 Sekunden unsichtbar. Der nächste Angriff trifft kritisch.", "Invisible for 3 seconds. The next attack crits."] },
    baerenfalle: { n: ["Bärenfalle", "Bear Trap"], stat: "ueber", find: "haeufig", cd: 10, icon: "trap", col: "#b0a090", d: ["Wirft eine Falle aus. Wer hineintritt, sitzt 3 Sekunden fest.", "Throws a trap. Whoever steps in is stuck for 3 seconds."] },
    floete: { n: ["Flöte der Illusionen", "Flute of Illusions"], stat: "takt", find: "rar", cd: 24, icon: "flute", col: "#d890ff", d: ["Ein winziger Demogorgon erscheint und zieht 7 Sekunden lang alle Blicke auf sich.", "A tiny Demogorgon appears and draws every eye for 7 seconds."] },
    kristall: { n: ["Steinsprecher-Kristall", "Stonespeaker Crystal"], stat: "ueber", find: "selten", cd: 11, icon: "crystal", col: "#ff9a3a", d: ["Felssäulen brechen vor dir aus dem Boden und schleudern Gegner hoch.", "Rock pillars burst from the ground ahead and hurl enemies up."] },
    schattenschritt: { n: ["Schattenschritt", "Shadow Step"], stat: "brut", find: "rar", cd: 8, icon: "step", col: "#a060ff", d: ["Hinter den nächsten Gegner springen und kritisch zustechen.", "Leap behind the nearest enemy and stab for a crit."] },
    kraeuter: { n: ["Kräuterbeutel", "Herb Pouch"], stat: "ueber", find: "selten", cd: 30, icon: "herb", col: "#7fd36a", d: ["Heilt über 5 Sekunden 30 % deines Lebens.", "Heals 30% of your health over 5 seconds."] },
    kriegshorn: { n: ["Goblin-Kriegshorn", "Goblin War Horn"], stat: "ueber", find: "haeufig", cd: 18, icon: "horn", col: "#c8a060", d: ["Ein so schräger Ton, dass alles in der Nähe 2 Sekunden betäubt ist.", "A note so off-key that everything nearby is stunned for 2 seconds."] },
    sprengphiole: { n: ["Sprengphiole", "Blast Vial"], stat: "brut", find: "haeufig", cd: 7, icon: "bomb", col: "#ff6a2a", d: ["Eine Phiole, die mit lautem Knall explodiert.", "A vial that explodes with a loud bang."] },
    darkinzorn: { n: ["Darkin-Zorn", "Darkin Wrath"], stat: "brut", find: "rar", cd: 32, icon: "wrath", col: "#ff2a3a", d: ["8 Sekunden lang +60 % Schaden und Lebensraub. Die Glut unter der Rüstung bricht hervor.", "For 8 seconds: +60% damage and life drain. The ember beneath the armour breaks loose."] },
    ranken: { n: ["Ilvaras Ranken", "Ilvara's Roots"], stat: "ueber", find: "selten", cd: 13, icon: "roots", col: "#5aa040", d: ["Wurzeln brechen in einer Linie hervor und fesseln alle Gegner.", "Roots burst out in a line and bind every enemy."] },
    drachenatem: { n: ["Drachenatem", "Dragon's Breath"], stat: "takt", find: "rar", cd: 14, only: ["zinnen", "sturm", "venomfang", "glut"], icon: "breath", col: "#a8e050", d: ["Ein Kegel aus Giftatem, wie Venomfang ihn spie.", "A cone of poison breath, just as Venomfang spat it."] }
  });

  /* ======================= SEGEN (Mutationen) ======================= */
  Z.BLESS = {
    zerbrechlich: { n: ["Zerbrechlich", "Glass Cannon"], k: "glas", d: ["+50 % Schaden, aber +50 % erlittener Schaden.", "+50% damage, but +50% damage taken."] },
    ersterSchlag: { n: ["Erster Schlag", "First Strike"], k: "glas", d: ["Der erste Treffer gegen jeden Gegner macht doppelten Schaden.", "The first hit against each enemy deals double damage."] },
    darkinblut: { n: ["Darkin-Blut", "Darkin Blood"], k: "glas", d: ["Unter 50 % Leben: +40 % Schaden.", "Below 50% health: +40% damage."] },
    klingentanz: { n: ["Klingentanz", "Blade Dance"], k: "glas", d: ["Nach einer Rolle 2 Sekunden lang +40 % Schaden.", "After a roll: +40% damage for 2 seconds."] },
    kopfgeld: { n: ["Kopfgeld", "Bounty"], k: "glas", d: ["Jeder Kill: +8 % Schaden für 6 Sekunden (stapelbar bis 5).", "Each kill: +8% damage for 6 seconds (stacks up to 5)."] },
    steinhaut: { n: ["Steinhaut", "Stoneskin"], k: "tank", d: ["25 % weniger erlittener Schaden.", "25% less damage taken."] },
    dornen: { n: ["Dornen", "Thorns"], k: "tank", d: ["Nahkämpfer, die dich treffen, erleiden 60 % des Schadens selbst.", "Melee attackers who hit you take 60% of the damage themselves."] },
    bollwerk: { n: ["Bollwerk", "Bulwark"], k: "tank", d: ["Jeder Block heilt 3 % Leben.", "Every block heals 3% health."] },
    unbeugsam: { n: ["Unbeugsam", "Unyielding"], k: "tank", d: ["+30 % Leben, kein Rückstoß mehr.", "+30% health, no more knockback."] },
    nochnicht: { n: ["Noch nicht.", "Not yet."], k: "tank", d: ["Einmal pro Durchgang: Statt zu fallen stehst du mit 50 % Leben wieder auf.", "Once per run: instead of falling, you rise again with 50% health."] },
    fesselnd: { n: ["Fesselnde Klingen", "Binding Blades"], k: "cc", d: ["Betäubte oder gefesselte Gegner nehmen 60 % mehr Schaden.", "Stunned or rooted enemies take 60% more damage."] },
    langerSchatten: { n: ["Langer Schatten", "Long Shadow"], k: "cc", d: ["Betäubungen und Fesseln wirken 50 % länger.", "Stuns and roots last 50% longer."] },
    erschuetterung: { n: ["Erschütterung", "Concussion"], k: "cc", d: ["Wird ein Gegner betäubt, taumeln auch alle in seiner Nähe.", "When an enemy is stunned, everyone near it staggers too."] },
    netzweber: { n: ["Netzweber", "Web Weaver"], k: "cc", d: ["Jeder fünfte Treffer fesselt das Ziel für 1,5 Sekunden.", "Every fifth hit roots the target for 1.5 seconds."] },
    giftmeister: { n: ["Giftmeister", "Poison Master"], k: "cc", d: ["Gift, Brand und Blutung wirken doppelt so stark.", "Poison, burn and bleeding are twice as strong."] },
    blutdurst: { n: ["Blutdurst", "Bloodthirst"], k: "heil", d: ["Jeder Kill heilt 3 % Leben.", "Every kill heals 3% health."] },
    vampir: { n: ["Vampir", "Vampire"], k: "heil", d: ["2 % jedes Schadens fließen als Leben zurück.", "2% of all damage dealt flows back as health."] },
    rallye: { n: ["Gegenwehr", "Retaliation"], k: "heil", d: ["Verlorenes Leben lässt sich doppelt so lange zurückholen – und schneller.", "Lost health can be won back for twice as long – and faster."] },
    goldgier: { n: ["Echos Goldgier", "Echo's Greed"], k: "nutz", d: ["+60 % Gold. Jede Münze heilt ein wenig.", "+60% gold. Every coin heals a little."] },
    splitterjaeger: { n: ["Splitterjäger", "Shard Hunter"], k: "nutz", d: ["+60 % Seelensplitter.", "+60% soul shards."] },
    rexTreue: { n: ["Rex' Treue", "Rex's Loyalty"], k: "nutz", d: ["Fällt dein Leben unter 30 %, kommt Rex zu Hilfe (einmal pro Gebiet).", "When your health drops below 30%, Rex comes to help (once per area)."] },
    glutspur: { n: ["Glutspur", "Ember Trail"], k: "nutz", d: ["Deine Rolle hinterlässt eine brennende Spur.", "Your roll leaves a burning trail."] },
    flinkeHaende: { n: ["Flinke Hände", "Quick Hands"], k: "nutz", d: ["Fähigkeiten laden 30 % schneller.", "Skills recharge 30% faster."] },
    schattenroll: { n: ["Schattenrolle", "Shadow Roll"], k: "nutz", d: ["Zwei Rollen hintereinander möglich, die zweite macht kurz unsichtbar.", "Two rolls in a row, the second briefly makes you invisible."] }
  };
  Z.BLESS_KIND = { glas: ["Glaskanone", "Glass cannon"], tank: ["Panzer", "Tank"], cc: ["Kontrolle", "Control"], heil: ["Erholung", "Sustain"], nutz: ["Nutzen", "Utility"] };

  /* ======================= EIGENSCHAFTEN (Affixe) ======================= */
  Z.AFFIX = {
    scharf: { n: ["Scharf", "Keen"], d: ["+15 % Schaden", "+15% damage"] },
    brennend: { n: ["Brennend", "Burning"], d: ["Treffer entzünden", "Hits ignite"], eff: { burn: 1 } },
    giftig: { n: ["Giftig", "Venomous"], d: ["Treffer vergiften", "Hits poison"], eff: { poison: 1 } },
    blutig: { n: ["Blutig", "Serrated"], d: ["Treffer lassen bluten", "Hits cause bleeding"], eff: { bleed: 1 } },
    betaeubend: { n: ["Betäubend", "Stunning"], d: ["15 % Chance zu betäuben", "15% chance to stun"] },
    vampirisch: { n: ["Vampirisch", "Vampiric"], d: ["3 % Lebensraub", "3% life drain"] },
    wuchtig: { n: ["Wuchtig", "Heavy"], d: ["+60 % Rückstoß", "+60% knockback"] },
    kritisch: { n: ["Tödlich", "Deadly"], d: ["+15 % kritische Trefferchance", "+15% crit chance"] },
    flink: { n: ["Flink", "Swift"], d: ["+18 % Angriffstempo", "+18% attack speed"] },
    zornig: { n: ["Zornig", "Wrathful"], d: ["+40 % Schaden unter 50 % Leben", "+40% damage below 50% health"] },
    jagend: { n: ["Jagend", "Hunting"], d: ["+40 % gegen Elite und Bosse", "+40% vs elites and bosses"] },
    gepanzert: { n: ["Gepanzert", "Armoured"], d: ["-12 % erlittener Schaden", "-12% damage taken"] },
    splitternd: { n: ["Splitternd", "Shard-hungry"], d: ["+30 % Seelensplitter", "+30% soul shards"] },
    fesselnd: { n: ["Fesselnd", "Binding"], d: ["+40 % gegen Betäubte und Gefesselte", "+40% vs stunned and rooted"] },
    meuchelnd: { n: ["Meuchelnd", "Backstabbing"], d: ["Von hinten immer kritisch", "Always crit from behind"] }
  };
  Z.AFFIX_SKILL = ["scharf", "brennend", "giftig", "betaeubend", "kritisch", "flink", "zornig", "jagend", "splitternd"];

  /* ======================= RUNEN-GRAVUREN (schmiede.js) =======================
     Am Glutamboss bei +2 und +4 eine von drei zur Wahl. Farben bewusst ohne Blau. */
  Z.RUNES = {
    brand: { n: ["Brandrune", "Brand Rune"], col: "#ff7a2a", ico: "🔥", d: ["Jeder Treffer entzündet.", "Every hit ignites."] },
    gift: { n: ["Giftrune", "Venom Rune"], col: "#9ad04a", ico: "☣", d: ["Jeder Treffer vergiftet.", "Every hit poisons."] },
    kette: { n: ["Kettenblitz", "Chain Spark"], col: "#f0e060", ico: "ϟ", d: ["20 % Chance: Ein Blitz springt auf 3 Gegner (40 % Schaden).", "20% chance: a spark leaps to 3 enemies (40% damage)."] },
    raub: { n: ["Lebensraub", "Life Thief"], col: "#e0545a", ico: "♥", d: ["4 % des Schadens fließen als Leben zurück.", "4% of damage dealt flows back as health."] },
    wucht: { n: ["Wucht", "Impact"], col: "#d8a060", ico: "⬢", d: ["+60 % Rückstoß; schwere Treffer betäuben kurz.", "+60% knockback; heavy hits briefly stun."] },
    krit: { n: ["Henkersrune", "Executioner"], col: "#ffb040", ico: "✶", d: ["Kritische Treffer machen +50 % Schaden.", "Critical hits deal +50% damage."] },
    tempo: { n: ["Flinke Rune", "Swift Rune"], col: "#c8e070", ico: "»", d: ["+15 % Angriffstempo, Bögen spannen schneller.", "+15% attack speed, bows draw faster."], noShield: true },
    bruch: { n: ["Rüstungsbruch", "Sunder"], col: "#c890ff", ico: "⛏", d: ["Treffer reißen die Rüstung auf: +6 % Schaden je Stapel (bis 5).", "Hits tear armour: +6% damage per stack (up to 5)."] },
    jagd: { n: ["Jägerrune", "Hunter Rune"], col: "#e5b454", ico: "☩", d: ["+30 % gegen Elite-Gegner und Bosse.", "+30% vs elites and bosses."] },
    echo: { n: ["Echoschlag", "Echo Strike"], col: "#d890ff", ico: "◎", d: ["Jeder 4. Treffer hallt nach: ein zweiter Treffer mit 50 %.", "Every 4th hit echoes: a second hit for 50%."] }
  };

  /* ======================= RUNEN-FAMILIEN UND SPIELWEISE-RUNEN (runen.js) =======================
     Jede Gravur gehört zu einer Familie. Zwei bzw. drei verschiedene Runen derselben Familie (beide Hände + Runengürtel)
     schalten einen Familienbonus frei. Spielweise-Runen (mech) wirken für Ezekiel als Ganzes, solange die Waffe in der
     Hand liegt bzw. der Runenstein im Gürtel steckt. Zahlen in Z.RUNE_NUM (Texte rechnen sie mit ein). Kein Blau. */
  const RN = (Z.RUNE_NUM = {
    funkenT: 1.2, funkenR: 70, glutR: 52, glutDmg: 0.6, bluete: 10, blueteDmg: 2.2, blueteAnst: 4, schleierCd: 1.4,
    donnerN: 3, donnerR: 60, donnerStun: 0.6, pfuetzeT: 3.5, pfuetzeWeit: 0.6, rissN: 2, rissDmg: 0.45, falleMul: 2, falleKb: 1.4,
    klingeT: 1.2, klingeDmg: 0.35, schwebeT: 0.32, ladungN: 8, ladungR: 74, ladungDmg: 1.5, ladungHeil: 0.05,
    spiegelR: 84, bumerangW: 150, bumerangDmg: 0.8, guertel: 3
  });
  const pc = v => Math.round(v * 100);
  Z.RUNE_FAM = {
    feuer: { n: ["Glut", "Ember"], col: "#ff7a2a", ico: "🜂",
      b2: ["Brand brennt 50 % heißer.", "Burning deals 50% more damage."], b3: ["Deine Rolle hinterlässt eine Glutspur.", "Your roll leaves an ember trail."] },
    gift: { n: ["Seuche", "Plague"], col: "#9ad04a", ico: "☣",
      b2: ["Gift wirkt 50 % stärker.", "Poison is 50% stronger."], b3: ["Jeder Treffer legt einen Giftstapel nach.", "Every hit adds a poison stack."] },
    sturm: { n: ["Sturm", "Storm"], col: "#f0e060", ico: "ϟ",
      b2: ["Kettenblitze springen einmal mehr und betäuben kurz.", "Chain lightning leaps once more and briefly stuns."], b3: ["Gewitterherz: alle 4 s schlägt ein Blitz in einen nahen Gegner.", "Storm heart: every 4 s lightning strikes a nearby foe."] },
    faden: { n: ["Faden & Jagd", "Thread & Hunt"], col: "#ffd27a", ico: "◈",
      b2: ["Faden-Marken halten doppelt so lange, Markierte nehmen +15 % Schaden.", "Thread marks last twice as long, marked foes take +15% damage."], b3: ["Wer einen Markierten tötet, markiert die zwei nächsten Gegner.", "Killing a marked foe marks the two nearest enemies."] },
    schatten: { n: ["Schatten", "Shadow"], col: "#b77cff", ico: "☾",
      b2: ["Nach einer Rolle trifft der nächste Hieb kritisch (alle 3 s).", "After a roll your next strike crits (every 3 s)."], b3: ["Schattenklingen jagen den Gegnern nach.", "Shadow blades hunt down enemies."] },
    blut: { n: ["Blut", "Blood"], col: "#e0545a", ico: "♥",
      b2: ["Jeder Kill heilt 2 % Leben.", "Every kill heals 2% health."], b3: ["Unter 40 % Leben: +30 % Schaden, doppelter Lebensraub.", "Below 40% health: +30% damage, double life drain."] },
    bollwerk: { n: ["Bollwerk", "Bulwark"], col: "#d8a060", ico: "⬢",
      b2: ["Blocken lässt 10 % weniger Schaden durch.", "Blocking lets 10% less damage through."], b3: ["Jede Parade: 1 s unverwundbar, Fähigkeiten laden 2 s auf.", "Every parry: 1 s invulnerable, skills recharge 2 s."] }
  };
  const FAM_OF = { brand: "feuer", gift: "gift", kette: "sturm", tempo: "sturm", raub: "blut", krit: "blut", wucht: "bollwerk", bruch: "faden", jagd: "faden", echo: "schatten" };
  for (const k in FAM_OF) if (Z.RUNES[k]) Z.RUNES[k].fam = FAM_OF[k];
  Object.assign(Z.RUNES, {
    funkenflug: { mech: true, fam: "feuer", n: ["Funkenflug", "Spark Leap"], col: "#ff9a3a", ico: "✺",
      d: ["Kritische Treffer entzünden. Brennende stecken alle " + String(RN.funkenT).replace(".", ",") + " s einen Nachbarn an.", "Crits ignite. Burning foes set a neighbour alight every " + RN.funkenT + " s."] },
    glutherz: { mech: true, fam: "feuer", n: ["Glutherz", "Ember Heart"], col: "#ff6a2a", ico: "❂",
      d: ["Brennende Gegner explodieren beim Tod (" + pc(RN.glutDmg) + " % Waffenschaden, entzündet).", "Burning foes explode on death (" + pc(RN.glutDmg) + "% weapon damage, ignites)."] },
    giftbluete: { mech: true, fam: "gift", n: ["Giftblüte", "Venom Bloom"], col: "#a8e050", ico: "❀",
      d: ["Gift platzt bei " + RN.bluete + " Stapeln zu einer Blüte: großer Schaden, steckt Nachbarn mit " + RN.blueteAnst + " Stapeln an.", "Poison bursts at " + RN.bluete + " stacks into a bloom: heavy damage, infects neighbours with " + RN.blueteAnst + " stacks."] },
    giftschleier: { mech: true, fam: "gift", n: ["Giftschleier", "Venom Veil"], col: "#8ac040", ico: "≋",
      d: ["Deine Rolle hinterlässt einen Giftschleier.", "Your roll leaves a veil of poison."] },
    donnersprung: { mech: true, fam: "sturm", n: ["Donnersprung", "Thunder Leap"], col: "#f0e060", ico: "⇑",
      d: ["Jeder " + RN.donnerN + ". Sprung entlädt eine Schockwelle, die betäubt.", "Every " + RN.donnerN + "rd jump releases a stunning shockwave."] },
    gewitter: { mech: true, fam: "sturm", n: ["Gewitterpfütze", "Storm Puddle"], col: "#e8d050", ico: "☔",
      d: ["Blitztreffer hinterlassen geladene Pfützen; Kettenblitze springen über Pfützen und Wasser " + pc(RN.pfuetzeWeit) + " % weiter.", "Lightning hits leave charged puddles; chain lightning leaps " + pc(RN.pfuetzeWeit) + "% further across puddles and water."] },
    fadenriss: { mech: true, fam: "faden", n: ["Fadenriss", "Thread Rend"], col: "#ffd27a", ico: "⋔",
      d: ["Faden-Krits spalten sich: " + RN.rissN + " Splitterfäden treffen nahe Gegner (" + pc(RN.rissDmg) + " %) und markieren sie.", "Thread crits split: " + RN.rissN + " splinter threads hit nearby foes (" + pc(RN.rissDmg) + "%) and mark them."] },
    fallensteller: { mech: true, fam: "faden", n: ["Fallensteller", "Trapper"], col: "#e5b454", ico: "⊓",
      d: ["Fallen machen Gegnern doppelten Schaden; dein Rückstoß ist " + pc(RN.falleKb - 1) + " % stärker und wirft sie hinein.", "Traps deal double damage to foes; your knockback is " + pc(RN.falleKb - 1) + "% stronger and throws them in."] },
    schattenklinge: { mech: true, fam: "schatten", n: ["Schattenklinge", "Shadow Blade"], col: "#b77cff", ico: "⚔",
      d: ["Deine Rolle hinterlässt eine wirbelnde Schattenklinge.", "Your roll leaves a whirling shadow blade."] },
    schwebeklinge: { mech: true, fam: "schatten", n: ["Schwebeklinge", "Hover Blade"], col: "#c890ff", ico: "∿",
      d: ["Treffer in der Luft halten dich kurz schwebend; jeder 3. Lufttreffer in Folge ist kritisch.", "Airborne hits keep you hovering; every 3rd air hit in a row crits."] },
    darkinladung: { mech: true, fam: "blut", n: ["Darkin-Ladung", "Darkin Charge"], col: "#ff3a3a", ico: "✹",
      d: ["Kills laden Darkin-Glut (" + RN.ladungN + "). Voll entlädt der nächste Nahkampftreffer eine Nova und heilt.", "Kills charge Darkin embers (" + RN.ladungN + "). When full, your next melee hit unleashes a nova and heals."] },
    spiegelparade: { mech: true, fam: "bollwerk", needShield: true, n: ["Spiegelparade", "Mirror Parry"], col: "#e8c890", ico: "⟲",
      d: ["Paraden schleudern alle Geschosse ringsum zurück und senden eine Schildwelle.", "Parries hurl back every projectile around you and send a shield wave."] },
    schildbumerang: { mech: true, fam: "bollwerk", needShield: true, n: ["Schildbumerang", "Shield Boomerang"], col: "#d8a060", ico: "◐",
      d: ["Nach einer Parade fliegt dein Schild als Bumerang (betäubt).", "After a parry your shield flies out as a boomerang (stuns)."] }
  });

  /* ======================= BEWEGUNGS-RUNEN (runen.js) =======================
     In einem Lauf gefunden: gilt für diesen Lauf. Im Lager an der Runenstele mit Seelensplittern dauerhaft freischalten.
     gate: Art der Sperre auf den Karten (welt.js). Farben warm, kein Blau. */
  Z.MOVE_RUNES = {
    kralle: { n: ["Krallenrune", "Claw Rune"], col: "#ffb347", cost: 140, gate: ["Kratzspuren an hohen Schächten", "claw marks in tall shafts"],
      d: ["Wandrutschen und Wandsprung: Gegen eine Wand drücken bremst den Fall, Springen stößt dich ab.", "Wall slide and wall jump: press against a wall to slow your fall, jump to kick off."] },
    schatten: { n: ["Schattenrune", "Shadow Rune"], col: "#b77cff", cost: 140, gate: ["Schattenspalten", "shadow slits"],
      d: ["Die Rolle wird zum Schattensprint: weiter, in der Luft ohne Fallen, flach genug für Schattenspalten.", "Your roll becomes a shadow sprint: longer, gravity-free in the air, flat enough for shadow slits."] },
    schwingen: { n: ["Darkin-Schwingen", "Darkin Wings"], col: "#ff5a4e", cost: 200, gate: ["Aufwindschächte", "updraft shafts"],
      d: ["Dritter Sprung in der Luft. Sprung halten beim Fallen: Gleiten – Aufwinde tragen dich hinauf.", "A third jump in the air. Hold jump while falling to glide – updrafts carry you up."] },
    erde: { n: ["Erdrune", "Earth Rune"], col: "#d8a060", cost: 120, gate: ["rissige Böden", "cracked floors"],
      d: ["Dein Sturzangriff wird zum Bodenstampfer: durchschlägt rissige Böden und bebt weiter.", "Your plunge becomes a ground pound: it smashes cracked floors and shakes further."] },
    kette: { n: ["Kettenrune", "Chain Rune"], col: "#c8a070", cost: 160, gate: ["Ösen an der Decke", "rings in the ceiling"],
      d: ["Enterhaken an Ösen: In der Luft ohne Sprünge erneut springen (oder Benutzen) zieht dich zur nächsten Öse.", "Grapple to rings: jump again in the air with no jumps left (or press use) to pull yourself to the nearest ring."] },
    nebel: { n: ["Nebelrune", "Mist Rune"], col: "#e0d0d8", cost: 100, gate: ["Gitter mit Nebel", "mist-veiled grates"],
      d: ["In der Rolle wirst du zu Nebel: Du schlüpfst durch Nebelgitter, Geschosse gehen durch dich hindurch.", "While rolling you turn to mist: you slip through mist grates and projectiles pass through you."] }
  };

  /* ======================= ESSEN (Heilung aus Kisten und Fässern) ======================= */
  Z.FOOD = [
    { n: ["Pilzbraten", "Mushroom Roast"], heal: 0.25 }, { n: ["Schwarzbrot", "Black Bread"], heal: 0.15 }, { n: ["Algensaft mit Honig", "Algae Juice with Honey"], heal: 0.12 },
    { n: ["Eintopf aus Phandalin", "Phandalin Stew"], heal: 0.3 }, { n: ["Ein Stück Trockenfleisch", "A Strip of Jerky"], heal: 0.1, rex: true }, { n: ["Kaltes Hähnchen", "Cold Chicken"], heal: 0.2 }
  ];

  /* ======================= GEFÄHRTEN-NPC im Lager ======================= */
  Z.CAMP_TALK = {
    B: [["Ein Schloss voller Fäden, und du gehst allein? Ich schreibe schon mal die Ballade. Vorsichtshalber im Moll.", "A castle full of threads and you go alone? I'm already writing the ballad. In minor, just in case."],
      ["Wenn du Glasstab triffst: Grüß ihn nicht von mir.", "If you meet Glasstaff: don't say hi from me."],
      ["Das Fundbuch? Ich führe Buch über jede Waffe, die du findest. Und über jede, die du verlierst. Das zweite Buch ist dicker.", "The ledger? I keep track of every weapon you find. And every one you lose. The second book is thicker."],
      ["Ich habe ein neues Lied über dich. Es hat nur eine Zeile. Sie lautet: „…“", "I wrote a new song about you. It has one line. It goes: '…'"]],
    G: [["Die Waffen am Ständer vor dem Tor sind für dich. Zwei Hände, zwei Waffen. Probier sie an der Puppe.", "The weapons on the rack by the gate are yours. Two hands, two weapons. Try them on the dummy."],
      ["Erst mit dem Bogen markieren, dann mit der Klinge zu Ende bringen. Ein Faden, ein Schnitt.", "Mark with the bow first, then finish with the blade. One thread, one cut."],
      ["Nimm Rex nicht mit da rein. Er … ach. Er ist schon weg, oder?", "Don't take Rex in there. He… oh. He's already gone, isn't he?"],
      ["Die Bogenschützen auf dem Wehrgang zielen gut. Roll dich ab. Immer abrollen.", "The archers on the ramparts aim well. Roll. Always roll."],
      ["Wenn ein Gegner aufleuchtet, holt er aus. Dann ist der Moment für deine Rolle – oder deinen Schild.", "When an enemy flashes, it's winding up. That's the moment for your roll – or your shield."]],
    E: [["Bring Gold mit. Viel Gold. Für die Gruppenkasse.", "Bring gold. Lots of gold. For the group fund."],
      ["Die Seelensplitter? Gib sie Nundro. Ich hätte sie lieber verkauft.", "The soul shards? Give them to Nundro. I'd rather have sold them."],
      ["Kein Wind da drin. Kein Himmel. Nur Stein und Fäden. Viel Spaß.", "No wind in there. No sky. Only stone and threads. Have fun."]],
    A: [["Zeig mir, was du gefunden hast. Jede Waffe, die du einmal getragen hast, kann ich schärfen.", "Show me what you've found. Any weapon you've carried once, I can sharpen."],
      ["Finden musst du sie trotzdem selbst. Ich schmiede Glück nicht. Nur Stahl.", "You still have to find them yourself. I don't forge luck. Only steel."],
      ["Siehst du in der Feste einen glühenden Amboss: Das ist meiner. Bring Glut und Gold, dann hämmert er für dich.", "If you see a glowing anvil in the keep: that's mine. Bring embers and gold and it will hammer for you."],
      ["Bei Stufe zwei und vier frisst der Stahl eine Rune. Wähl gut – herausschlagen lässt sie sich nicht.", "At level two and four the steel swallows a rune. Choose well – you can't knock it out again."]],
    R: [["Wuff.", "Woof."], ["Rex wedelt. Er hat einen Stock gefunden. Er hält ihn für eine legendäre Waffe.", "Rex wags. He found a stick. He thinks it's a legendary weapon."]],
    C: [["Die Schädel an deinem Gürtel. Jeder einzelne macht die Feste grausamer – und die Beute besser.", "The skulls on your belt. Each one makes the keep crueller – and the loot better."]]
  };

  /* Werte für das Gleichgewicht */
  Z.BAL = {
    enemyHp: t => 1 + 0.8 * t,
    enemyDmg: t => 1 + 0.32 * t,
    itemMul: t => 1 + 0.42 * t,
    skullHp: s => 1 + 0.25 * s, /* W6: vorher 1 + 0,35s – mit der steileren Lebenskurve wurden 3 Totenköpfe zur Zähigkeitsprobe (Bot: ~10× Tode) */
    skullDmg: s => 1 + 0.22 * s,
    /* W6-Balancing: Gold je Lauf lag bei ~5500 (haupt), Aufwerten einer Waffe auf +5 kostet ~1500. Mit 1 + 0,3t blieben
       am Laufende noch 1000–3700 übrig → 1 + 0,2t (vorher 1 + 0,6t): Aufwerten + gelegentlich Händlerin, nicht alles */
    /* W9 (Kontrollläufe K1, haupt, unsterblich): Gold ein 4000–5200, ausgegeben 1500–2800, Rest 1000–3100 – Gold war nie knapp,
       begrenzt haben nur Glut und Amboss-Schläge. Jetzt 15 % weniger Gold und teureres Schmieden (schmiede.js goldCost) */
    /* W9 6. Runde (Meta-Kampagne mit Bot, 20 Läufe): erster Sieg schon nach 3 Läufen, ab Lauf 8 jeder zweite – Meta wuchs zu schnell
       (≈ 420 Splitter je Lauf). Splitter-Funde ×0,7 → erster Sieg für gute Spieler eher nach 8–15 Läufen */
    shardMul: 0.7,
    goldMul: t => 0.82 * (1 + 0.2 * t) /* W9 3. Runde: 0,85 → 0,8 (gründlich blieben 1100–5600 Gold übrig); 4. Runde Kompromiss 0,82 (gründlich sonst nur +4) */
  };
})();
