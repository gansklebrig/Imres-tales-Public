/* Ezekiel – The Destroyer · Welt
   Gebiete (Biome), ihr Netz aus Wegen, Raumvorlagen und der Generator, der daraus jedes Mal eine neue Karte baut.
   Kachelcodes: 0 Luft, 1 Fels, 2 Steg (von unten durchlässig), 3 Stacheln, 4 Leiter, 5 Gefahrenflüssigkeit,
   6 seichtes Wasser, 7 rissige Wand (zerschlagbar), 8 Treppe (wie Steg) */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE;
  const CW = 24, CH = 14; /* Raumgröße in Kacheln */
  Z.CW = CW; Z.CH = CH;

  /* ======================= GEBIETE ======================= */
  /* flow: down = tiefer hinab, through = hindurch, up = höher hinauf, flat = Arena/Handgebaut */
  const BIOMES = (Z.BIOMES = {
    torhof: {
      tier: 0, open: "arch", flow: "through", grid: [4, 2], out: true, name: ["Der Torhof", "The Gate Yard"],
      sub: ["Mondlicht über der Feste der Fäden", "Moonlight over the Keep of Threads"],
      sky: ["#120c1c", "#3a2234", "#5e3442"], wall: "#2b2427", brick: "#1d181b",
      tile: { base: "#4a4044", light: "#7a6a62", dark: "#231c20", det: "#5e5250", top: "moss", topCol: "#4f6b34" }, plat: "#6b4a30",
      dark: 0.42, ambCol: "#3a2a4a", bg: "castle", weather: ["dust", "leaves", "fireflies"], hazard: "spikes",
      props: { torch: 3, banner: 2, barrel: 2, crate: 2, cart: 1, hay: 1, statue: 1, window: 2, chain: 1, weapons: 1 },
      foes: { goblin: 5, goblinBogen: 3, goblinSchlaeger: 1, robe: 3, ratte: 2, wolf: 2 }, density: 0.85,
      exits: ["keller", "hallen", "wehrgang"], amb: { loops: [["amb/a_nacht.mp3", 0.5], ["amb/a_hof.mp3", 0.25], ["amb/a_wind1.mp3", 0.18]], one: [["e_eule_", 4, 9], ["e_kraehe_", 16, 14], ["n_kette_", 4, 20]] },
      music: "torhof", story: ["Die Zugbrücke ist unten. Niemand hält Wache. Natürlich nicht.", "The drawbridge is down. No one keeps watch. Of course not."]
    },
    keller: {
      tier: 1, open: "vault", flow: "down", grid: [3, 4], name: ["Die Keller", "The Cellars"], sub: ["Fässer, Ratten und ein Geruch, über den niemand spricht", "Barrels, rats and a smell nobody talks about"],
      sky: ["#0e0b0c", "#1a1414", "#251c1a"], wall: "#2a221e", brick: "#1a1512",
      tile: { base: "#4e4238", light: "#76644e", dark: "#201a16", det: "#5c4e40", top: "drip", topCol: "#3d4a30" }, plat: "#5e4028",
      dark: 0.62, ambCol: "#3a2a1a", bg: "cellar", weather: ["dust", "drip"], hazard: "spikes",
      props: { barrel: 4, crate: 3, torch: 2, shelf: 2, web: 2, pot: 3, sack: 2, bones: 1, candle: 2 },
      foes: { ratte: 4, robe: 3, robeArmbrust: 2, phiole: 2, kerkerwache: 1, skelett: 2, goblinBombe: 1 }, density: 1,
      exits: ["verlies", "hafen"], amb: { loops: [["amb/a_tropfstein.mp3", 0.5], ["amb/a_grabesdroehnen.mp3", 0.15]], one: [["n_ratte_", 6, 8], ["e_kette_", 4, 22], ["n_tropfen_", 1, 6]] },
      music: "keller", story: ["Unter der Feste lagert mehr als Wein.", "Beneath the keep there is more than wine."]
    },
    hallen: {
      tier: 1, open: "arch", flow: "through", grid: [6, 2], name: ["Die Burghallen", "The Great Halls"], sub: ["Teppiche, Kerzen und zu viele Rote Roben", "Carpets, candles and too many Red Robes"],
      sky: ["#140a0c", "#2a1214", "#3a1a18"], wall: "#3a2420", brick: "#28160f",
      tile: { base: "#5a443e", light: "#8a6c58", dark: "#24161a", det: "#6e5448", top: "carpet", topCol: "#8a1f24" }, plat: "#6e4a2c",
      dark: 0.38, ambCol: "#5a2a1a", bg: "halls", weather: ["dust", "embers"], hazard: "spikes",
      props: { candelabra: 3, banner: 4, painting: 3, torch: 2, statue: 2, column: 2, armor: 2, table: 2, window: 2, chandelier: 2 },
      foes: { robe: 4, robeTrunk: 2, adept: 2, ruestung: 2, robeSchlaeger: 1, drowWache: 1 }, density: 1,
      exits: ["verlies", "hafen", "glocken"], amb: { loops: [["amb/a_halle.mp3", 0.45], ["amb/a_feuer1.mp3", 0.2]], one: [["e_raunen_", 3, 16], ["n_stuhl_", 2, 22], ["e_glocke_", 3, 40]] },
      music: "hallen", story: ["Jemand hat für Gäste gedeckt. Für viele Gäste.", "Someone has set the table for guests. Many guests."]
    },
    wehrgang: {
      tier: 1, open: "arch", flow: "up", grid: [3, 4], out: true, name: ["Der Wehrgang", "The Ramparts"], sub: ["Wind, Zinnen und Bogenschützen mit zu viel Zeit", "Wind, battlements and archers with too much time"],
      sky: ["#0e0a18", "#2a1a30", "#6a3a3a"], wall: "#2e2830", brick: "#1e1a20",
      tile: { base: "#56504e", light: "#8a807a", dark: "#25202a", det: "#6a6260", top: "moss", topCol: "#4a5a3a" }, plat: "#6a4a30",
      dark: 0.35, ambCol: "#3a2a4a", bg: "ramparts", weather: ["wind", "leaves", "dust"], hazard: "spikes",
      props: { banner: 4, torch: 2, crate: 1, weapons: 2, brazier: 2, rope: 2, crenel: 3 },
      foes: { goblinBogen: 3, stirge: 3, soeldner: 3, drowSchuetze: 2, goblin: 2, wolfsreiter: 1 }, density: 0.95,
      exits: ["hafen", "glocken"], amb: { loops: [["amb/a_heulwind.mp3", 0.45], ["amb/a_wind1.mp3", 0.3]], one: [["e_kraehe_", 16, 9], ["n_windstoss_", 1, 12], ["e_fernglocken_", 2, 30]] },
      music: "wehrgang", story: ["Oben pfeift der Wind. Und manchmal ein Pfeil.", "Up top the wind whistles. Sometimes an arrow does."]
    },
    verlies: {
      tier: 2, open: "vault", flow: "down", grid: [3, 5], name: ["Das Verlies", "The Dungeon"], sub: ["Ketten, Zellen und die Geiseln der Spinne", "Chains, cells and the Spider's hostages"],
      sky: ["#0a0c0a", "#121612", "#1a1e18"], wall: "#232620", brick: "#151813",
      tile: { base: "#3e4238", light: "#646a56", dark: "#171a14", det: "#4c5244", top: "slime", topCol: "#4f6a2a" }, plat: "#4e3a28",
      dark: 0.7, ambCol: "#2a3a1a", bg: "dungeon", weather: ["drip", "dust", "fog"], hazard: "spikes",
      props: { chain: 4, cage: 3, torch: 2, bones: 3, skull: 2, web: 2, bars: 3, rack: 1 },
      foes: { skelett: 3, skelBogen: 2, kerkerwache: 2, ratte: 2, zombie: 2, phiole: 1, folterknecht: 1 }, density: 1.05,
      exits: ["labor"], amb: { loops: [["amb/a_tropfstein.mp3", 0.4], ["amb/a_grabesdroehnen.mp3", 0.3], ["amb/a_fluestern.mp3", 0.12]], one: [["n_kette_", 4, 7], ["n_stoehnen_", 8, 14], ["e_stoehnen_", 4, 20]] },
      music: "verlies", story: ["Hinter jeder Tür ein Stöhnen. Hinter manchen ein Lachen.", "Behind every door a groan. Behind some, a laugh."]
    },
    hafen: {
      tier: 2, open: "arch", flow: "through", grid: [6, 2], out: true, name: ["Der Hafen", "The Harbour"], sub: ["Stege, Taue, Möwen – und Fischaugen im Wasser", "Piers, ropes, gulls – and fish eyes in the water"],
      sky: ["#0c0a14", "#24162a", "#4a2a38"], wall: "#2c2620", brick: "#1c1812",
      tile: { base: "#4a4038", light: "#7a6a56", dark: "#201a16", det: "#5a4e40", top: "wood", topCol: "#6a4e30" }, plat: "#7a5634",
      dark: 0.4, ambCol: "#2a2a3a", bg: "harbour", weather: ["drizzle", "fog", "gulls"], hazard: "water",
      props: { barrel: 3, crate: 3, rope: 3, net: 2, anchor: 1, lantern: 3, mast: 1, sack: 2 },
      foes: { kuotoa: 4, kuotoaSpeer: 2, soeldner: 2, goblinBombe: 2, ratte: 1, robeArmbrust: 1 }, density: 1,
      exits: ["erzpriesterin"], amb: { loops: [["amb/a_hafen.mp3", 0.4], ["amb/a_wellen1.mp3", 0.4]], one: [["e_moewe_", 10, 9], ["n_knarren_", 8, 7], ["e_platsch_", 4, 12]] },
      music: "hafen", story: ["Der Hafen der Feste. Die Stege sind nass. Nicht nur vom Regen.", "The keep's harbour. The piers are wet. Not only from rain."]
    },
    glocken: {
      tier: 2, open: "arch", flow: "up", grid: [3, 5], name: ["Der Glockenturm", "The Bell Tower"], sub: ["Zahnräder, Seile und ein Wachturm in den Sternen", "Gears, ropes and a watchtower among the stars"],
      sky: ["#0c0a14", "#1c1426", "#2c1e2a"], wall: "#2e2622", brick: "#1e1814",
      tile: { base: "#544640", light: "#86705e", dark: "#231a18", det: "#665448", top: "none", topCol: "#000" }, plat: "#7a5432",
      dark: 0.5, ambCol: "#3a2a2a", bg: "belltower", weather: ["dust", "feathers"], hazard: "spikes",
      props: { gear: 4, rope: 3, bell: 2, torch: 2, window: 3, crate: 1, beam: 3 },
      foes: { stirge: 3, goblinBogen: 2, soeldner: 2, drowSchuetze: 2, drowWache: 2, wolf: 1 }, density: 1,
      exits: ["wachturm"], amb: { loops: [["amb/a_uhr.mp3", 0.35], ["amb/a_ruinenwind.mp3", 0.3]], one: [["e_glocke_", 3, 28], ["n_knarren_", 8, 9], ["n_fledermaus_", 8, 12]] },
      music: "glocken", story: ["Ganz oben schlägt die Glocke. Nur hat sie keinen Klöppel mehr.", "At the very top the bell tolls. Only it has no clapper anymore."]
    },
    schlund: {
      tier: 4, open: "cave", flow: "down", grid: [3, 5], name: ["Der Spinnenschlund", "The Spider Chasm"], sub: ["Netze dick wie Taue, Pilzlicht und Kokons", "Webs thick as ropes, mushroom light and cocoons"],
      sky: ["#0c0812", "#1a1024", "#2a1838"], wall: "#221a28", brick: "#150f1a",
      tile: { base: "#3e3446", light: "#6a5a72", dark: "#160f1a", det: "#4e4258", top: "web", topCol: "#c8c0d0" }, plat: "#d8d0dc",
      dark: 0.72, ambCol: "#3a1a4a", bg: "chasm", weather: ["spores", "dust"], hazard: "spikes", webPlat: true,
      props: { web: 5, mushroom: 5, cocoon: 3, bones: 2, crystal: 1, skull: 1 },
      foes: { riesenspinne: 3, netzspinne: 3, ettercap: 2, spinnchen: 3, schatten: 1, brutsack: 1 }, density: 1.05,
      warden: "wraith", exits: ["see", "glut"],
      amb: { loops: [["amb/a_tropfstein.mp3", 0.3], ["amb/a_fluestern.mp3", 0.2], ["amb/a_geisterhauch.mp3", 0.15]], one: [["e_spinne_", 4, 6], ["e_insekt_", 6, 10], ["n_zischen_", 4, 14]] },
      music: "schlund", story: ["Unter der Feste reißt der Fels auf. Und die Fäden führen nach unten.", "Beneath the keep the rock splits open. And the threads lead down."]
    },
    schmiede: {
      tier: 4, open: "vault", flow: "through", grid: [6, 2], name: ["Die Runenschmiede", "The Rune Forge"], sub: ["Glühende Runen, Ambosse und Rüstungen ohne Träger", "Glowing runes, anvils and armour with no one inside"],
      sky: ["#120a06", "#24140a", "#3a1e0c"], wall: "#2e2420", brick: "#1e1612",
      tile: { base: "#4a4040", light: "#7a6a60", dark: "#1e1818", det: "#c88a2a", top: "rune", topCol: "#e5a43a" }, plat: "#5a4a3a",
      dark: 0.55, ambCol: "#5a3010", bg: "forge", weather: ["embers", "sparks"], hazard: "lava",
      props: { anvil: 3, forge: 2, rune: 4, chain: 2, armor: 2, weapons: 2, pipe: 2, brazier: 2 },
      foes: { ruestung: 3, runenfunke: 3, runenwaechter: 1, duergar: 2, duergarArmbrust: 2, schmiedegeist: 1 }, density: 1,
      warden: "schmiedewaechter", exits: ["see", "glut", "sturm"],
      amb: { loops: [["amb/a_esse.mp3", 0.35], ["amb/a_feuer1.mp3", 0.25], ["amb/a_grabesdroehnen.mp3", 0.15]], one: [["n_hammer_", 7, 3], ["e_blasebalg_", 2, 9], ["e_erz_", 6, 12]] },
      music: "schmiede", story: ["Die Schmiede singt noch. Leise. In einer Sprache aus Funken.", "The forge still sings. Quietly. In a language of sparks."]
    },
    zinnen: {
      tier: 4, open: "arch", flow: "up", grid: [3, 5], out: true, name: ["Die Zinnen", "The Spires"], sub: ["Über den Wolken kreisen Dämonen", "Above the clouds, demons circle"],
      sky: ["#1a0a10", "#5a1e20", "#c0582a"], wall: "#3a2a2a", brick: "#2a1c1c",
      tile: { base: "#5e4c48", light: "#9a7a6a", dark: "#2a1c1c", det: "#6e5a52", top: "ash", topCol: "#8a7a70" }, plat: "#6a4a32",
      dark: 0.3, ambCol: "#6a2a1a", bg: "spires", weather: ["ash", "wind", "embers"], hazard: "spikes",
      props: { banner: 3, gargoyle: 3, brazier: 2, chain: 2, crenel: 3, bones: 1 },
      foes: { mane: 3, stirge: 3, harpyie: 2, nadelBlight: 2, zweigBlight: 2, drowSchuetze: 1 }, density: 1,
      warden: "chasme", exits: ["glut", "sturm"],
      amb: { loops: [["amb/a_heulwind.mp3", 0.5], ["amb/a_feuer1.mp3", 0.12]], one: [["e_kraehe_", 16, 7], ["n_fledermaus_", 8, 10], ["e_fernschrei_", 1, 25]] },
      music: "zinnen", story: ["Der Himmel brennt. Jemand hat ihn angezündet.", "The sky is burning. Someone set it alight."]
    },
    see: {
      tier: 5, open: "cave", flow: "down", grid: [3, 5], name: ["Der schwarze See", "The Black Lake"], sub: ["Ruinen der Kuo-Toa, bleiche Rochen, und etwas atmet unter Wasser", "Kuo-toa ruins, pale rays, and something breathes underwater"],
      sky: ["#06100c", "#0c1c16", "#14281e"], wall: "#1c2a24", brick: "#111c17",
      tile: { base: "#34463c", light: "#5c7a62", dark: "#0e1a14", det: "#c87a8a", top: "algae", topCol: "#3a6a3a" }, plat: "#5a4a34",
      dark: 0.7, ambCol: "#1a3a2a", bg: "lake", weather: ["bubbles", "drip", "fog"], hazard: "water",
      props: { coral: 3, shell: 3, net: 2, bones: 2, statueKuo: 1, mushroom: 2, lantern: 2 },
      foes: { kuotoa: 3, kuotoaSpeer: 2, peitscher: 2, rochen: 3, ertrunkener: 2, krabbe: 2 }, density: 1.05,
      warden: "ilvaraW", exits: ["demogorgon"],
      amb: { loops: [["amb/a_unterwasser.mp3", 0.25], ["amb/a_wellen1.mp3", 0.3], ["amb/a_tropfstein.mp3", 0.25]], one: [["e_blubb_", 4, 6], ["e_platsch_", 4, 10], ["e_seeungeheuer_", 2, 30]] },
      music: "see", story: ["Das Wasser ist still. Zu still für einen See, der atmet.", "The water is still. Too still for a lake that breathes."]
    },
    glut: {
      tier: 5, open: "cave", flow: "through", grid: [6, 2], name: ["Die Glutgassen", "The Ember Alleys"], sub: ["Ruß, Schwefel und grünes Feuer wie in Gracklstugh", "Soot, sulphur and green fire like in Gracklstugh"],
      sky: ["#140806", "#2a0e08", "#4a1a0a"], wall: "#2e1e1a", brick: "#1e120e",
      tile: { base: "#4a3a34", light: "#7a5a46", dark: "#1a100c", det: "#ff7a2a", top: "soot", topCol: "#2a2220" }, plat: "#4a3a2e",
      dark: 0.5, ambCol: "#6a2a0a", bg: "embercity", weather: ["embers", "ash", "smoke"], hazard: "lava",
      props: { brazier: 3, forge: 2, chain: 2, greenfire: 3, crate: 2, pipe: 2, statueDuergar: 1, lantern: 2 },
      foes: { duergar: 3, duergarArmbrust: 2, feuerschlucker: 2, glutling: 3, bewahrer: 2, magmaHund: 1 }, density: 1.05,
      warden: "riese", exits: ["themberchaud"],
      amb: { loops: [["amb/a_esse.mp3", 0.35], ["amb/a_markt.mp3", 0.12], ["amb/a_feuer1.mp3", 0.3]], one: [["n_hammer_", 7, 4], ["e_zischen_", 2, 8], ["e_grollen_", 2, 14]] },
      music: "glut", story: ["Hier hämmert es Tag und Nacht. Wenn es hier Tage gäbe.", "Hammering day and night. If there were days down here."]
    },
    sturm: {
      tier: 5, open: "arch", flow: "up", grid: [3, 5], out: true, name: ["Die Sturmspitze", "The Storm Spire"], sub: ["Donnerbaums Turm, Giftnebel und Blitze", "Thundertree's tower, poison mist and lightning"],
      sky: ["#081008", "#14241a", "#2a3a22"], wall: "#2a2a22", brick: "#1a1a14",
      tile: { base: "#4a4a3e", light: "#7a7a62", dark: "#1a1a12", det: "#5a5a48", top: "moss", topCol: "#4a6a2a" }, plat: "#5a4a2e",
      dark: 0.45, ambCol: "#2a4a1a", bg: "storm", weather: ["rain", "lightning", "fog"], hazard: "spikes",
      props: { vine: 4, bones: 2, banner: 2, crenel: 2, torch: 1, gargoyle: 2, rope: 1 },
      foes: { zombie: 3, zombieBlaeh: 2, zweigBlight: 3, nadelBlight: 2, rankenBlight: 1, stirge: 2 }, density: 1.05,
      warden: "vrock", exits: ["venomfang"],
      amb: { loops: [["amb/a_gewitter1.mp3", 0.45], ["amb/a_regen1.mp3", 0.3]], one: [["n_donner_", 8, 11], ["e_kraehe_", 16, 12], ["n_stoehnen_", 8, 18]] },
      music: "sturm", story: ["Der Regen schmeckt nach Gift. Ganz oben schläft etwas Grünes.", "The rain tastes of poison. At the very top, something green sleeps."]
    }
  });
  /* Arenen der Bosse (handgebaut) */
  const ARENAS = (Z.ARENAS = {
    labor: { tier: 3, boss: "glasstab", name: ["Glasstabs Labor", "Glasstaff's Laboratory"], base: "verlies", exits: ["schlund", "schmiede"], music: "boss1", w: 46, h: 18, kind: "lab" },
    erzpriesterin: { tier: 3, boss: "erzpriesterin", name: ["Der Tempelsteg", "The Temple Pier"], base: "hafen", exits: ["schlund", "schmiede", "zinnen"], music: "boss1", w: 48, h: 18, kind: "pier" },
    wachturm: { tier: 3, boss: "bugbear", name: ["Der Wachturm", "The Watchtower"], base: "glocken", exits: ["schmiede", "zinnen"], music: "boss1", w: 46, h: 18, kind: "tower" },
    demogorgon: { tier: 6, boss: "demogorgon", final: "tiefe", name: ["Das Herz des Sees", "The Heart of the Lake"], base: "see", exits: [], music: "final", w: 56, h: 20, kind: "lakeboss" },
    themberchaud: { tier: 6, boss: "themberchaud", final: "glut", name: ["Der Hort im Glutlicht", "The Hoard in Emberlight"], base: "glut", exits: [], music: "final", w: 56, h: 20, kind: "hoard" },
    venomfang: { tier: 6, boss: "venomfang", final: "himmel", name: ["Die Turmspitze", "The Tower Top"], base: "sturm", exits: [], music: "final", w: 56, h: 20, kind: "towertop" }
  });
  Z.areaName = id => { const b = BIOMES[id] || ARENAS[id]; return b ? b.name[Z.settings.lang === "en" ? 1 : 0] : id; };
  Z.areaTier = id => (BIOMES[id] || ARENAS[id] || {}).tier;
  /* Weg-Symbole für die Ausgangstüren */
  Z.exitDir = (from, to) => {
    const b = BIOMES[to], a = ARENAS[to];
    if (a) return "boss";
    if (!b) return "through";
    return b.flow === "down" ? "down" : b.flow === "up" ? "up" : "through";
  };

  /* ======================= RAUMVORLAGEN ======================= */
  /* 24×14. Öffnungen: links/rechts Zeilen 8–11, oben/unten Spalten 10–13.
     Zeichen: # Fels  . Luft  - Steg  H Leiter  ^ Stacheln  ~ Gefahr  X rissige Wand  ? zufällig Fels
     E Bodengegner  F Fluggegner  T Schatz  S Schriftrolle/Altar  b Kiste/Fass  w Fensterstelle */
  const TPL = [
    { n: "halle", r: [
      "##########....##########",
      "#......................#",
      "#..........w...........#",
      "#......................#",
      "#..-----........-----..#",
      "#......................#",
      "#......................#",
      "#.........----.........#",
      "...........F............",
      "........................",
      "........................",
      "...E..##.....b..##..E...",
      "########################",
      "########################"] },
    { n: "grube", r: [
      "##########....##########",
      "#......................#",
      "#......w..........w....#",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#.....----....----.....#",
      "........................",
      "........................",
      "..E..................E..",
      "#####..............#####",
      "#####^^^^^^^^^^^^^^#####",
      "########################"] },
    { n: "treppe", r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#..................E...#",
      "#................######.",
      "#.............F.....#...",
      "#................--.#..#",
      "#...........###.....#..#",
      "...........##...........",
      ".........###............",
      "...E...###.........b....",
      ".....###................",
      "########################",
      "########################"] },
    { n: "schacht", r: [
      "##########....##########",
      "###.......................".slice(0, 24),
      "###.....----....----..##",
      "##....................##",
      "##..F.................##",
      "##......-----.........##",
      "##..............----..##",
      "##....................##",
      "......----..............",
      "........................",
      "..E..............E......",
      "####......b.........####",
      "#####----#....#----#####",
      "##########....##########"] },
    { n: "kreuzung", r: [
      "##########....##########",
      "#......................#",
      "#.....w..........w.....#",
      "#...######....######...#",
      "#...#..T.#....#....#...#",
      "#...#....#....#..E.#...#",
      "#...#--###....###--#...#",
      "#......................#",
      "..........F.............",
      "........................",
      ".....E..........E.......",
      "####...b...........#####",
      "#####......##......#####",
      "##########....##########"] },
    { n: "galerie", r: [
      "########################",
      "#......................#",
      "#..w.....w......w...w..#",
      "#......................#",
      "#.E..............E.....#",
      "##########----##########",
      "#......................#",
      "#..........F...........#",
      "........................",
      "........................",
      "...E....b........E......",
      "####.....#....#.....####",
      "#########......#########",
      "##########....##########"] },
    { n: "kammer", dead: true, r: [
      "########################",
      "##########??############",
      "#######..........#######",
      "######............######",
      "#####..............#####",
      "####.......T........####",
      "###......#####.......###",
      "##....................##",
      "......................##",
      "......................##",
      "....b.....E..........S##",
      "......####......########",
      "########################",
      "########################"] },
    { n: "stufen", r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#.......w......w.......#",
      "#......................#",
      "#..F...................#",
      "#..................---.#",
      "#......---.............#",
      "...................####.",
      "..............E...#####.",
      "............######......",
      "...E....#####...........",
      "########################",
      "########################"] },
    { n: "balkone", r: [
      "##########....##########",
      "#.E....................#",
      "#####-----.....-----####",
      "#......................#",
      "#..............F.......#",
      "#....E.................#",
      "#########.....----######",
      "#......................#",
      "........................",
      "...........F............",
      ".....E........b.....E...",
      "##.....####....####...##",
      "########################",
      "########################"] },
    { n: "bruecke", r: [
      "##########....##########",
      "#......................#",
      "#....w.............w...#",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E...................E.",
      "######---.------.---####",
      "######~~~~~~~~~~~~~~####",
      "########################"] },
    { n: "fallgrube", r: [
      "########################",
      "#......................#",
      "#....w..........w......#",
      "#......................#",
      "#.E....................#",
      "######.................#",
      "#....#.......F.........#",
      "#....###...............#",
      "...........E...........#",
      "........######.........#",
      "......................##",
      "####....b.........######",
      "#######---....---#######",
      "##########....##########"] },
    { n: "aufstieg", r: [
      "##########....##########",
      "#......................#",
      "#..................E...#",
      "#.............#######..#",
      "#......................#",
      "#..F.....----..........#",
      "#......................#",
      "#..---..........----...#",
      "......................##",
      "......................##",
      "...E......b.........####",
      "####..............######",
      "########################",
      "########################"] },
    { n: "saeulen", r: [
      "##########....##########",
      "#......................#",
      "#.w...#..........#...w.#",
      "#.....#..........#.....#",
      "#.....#...F......#.....#",
      "#.....#..........#.....#",
      "#....###---..---###....#",
      "#......................#",
      "........................",
      "........................",
      "....E.....b.....E.......",
      "###..##..........##..###",
      "########################",
      "########################"] },
    { n: "doppelstock", r: [
      "##########....##########",
      "#......................#",
      "#..E..............T....#",
      "#..H.......F.......H...#",
      "#..H...............H...#",
      "####################H###",
      "#..H...............H...#",
      "#..H...............H...#",
      "...H..........E....H....",
      "...H...............H....",
      "...H.......b.......H....",
      "####.................###",
      "########################",
      "########################"] },
    { n: "nische", r: [
      "########################",
      "#......................#",
      "#..XXX.................#",
      "#..XTX.......F.........#",
      "#..XXX.................#",
      "#.......-----..........#",
      "#..............----....#",
      "#......................#",
      "........................",
      "........................",
      "...E..............E.....",
      "#####...b....##.....####",
      "#######.....#####.######",
      "##########....##########"] },
    { n: "bogengang", r: [
      "##########....##########",
      "#......................#",
      "#..######......######..#",
      "#..#....#......#....#..#",
      "#..#.w..#..F...#.w..#..#",
      "#......................#",
      "#......................#",
      "#....----......----....#",
      "........................",
      "........................",
      "..E.......b........E....",
      "##....##........##....##",
      "########################",
      "########################"] },
    { n: "tiefe", r: [
      "##########....##########",
      "#......................#",
      "#..----..........----..#",
      "#......................#",
      "#.......F..............#",
      "#..........----........#",
      "##....................##",
      "###..---........---..###",
      "........................",
      "........................",
      "..E..................E..",
      "#####......b.......#####",
      "######----#....#----####",
      "##########....##########"] },
    { n: "fass", r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#....w........w........#",
      "#......................#",
      "#..b...................#",
      "#####---.......F.......#",
      "#............---------##",
      "........................",
      "........................",
      ".....E....bb.....E.....b",
      "#######..........#######",
      "########################",
      "########################"] },
    { n: "turmkammer", dead: true, r: [
      "##########....##########",
      "####................####",
      "###..................###",
      "##........T...........##",
      "##.....########.......##",
      "##....................##",
      "##..b..............S..##",
      "########----------######",
      "##....................##",
      "##....................##",
      "##.........E..........##",
      "##....................##",
      "########################",
      "########################"] },
    { n: "brunnen", dead: true, r: [
      "########################",
      "########################",
      "#########......#########",
      "#######...........######",
      "#####.....T.........####",
      "####..######..........##",
      "###....................#",
      "##.....................#",
      "........................",
      "........................",
      "..b....E......S.........",
      "###....######.......####",
      "########################",
      "########################"] },
    /* ---------- Parcours-Räume: Abgründe (A), bröckelnde Stege (c), Fähre (m), Fallen: p Pendel, f Flammendüse, k Stachelfalle, r Steinschlag, j Sprungfeder, z Säge, < > Pfeilfalle ---------- */
    { n: "abgrund", pk: true, r: [
      "########################",
      "#.....r..........r.....#",
      "#......................#",
      "#...w............w.....#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E......--....--...E...",
      "#####..............#####",
      "#####AAAAAAAAAAAAAA#####",
      "#####AAAAAAAAAAAAAA#####"] },
    { n: "broeckelbruecke", pk: true, r: [
      "########################",
      "#......................#",
      "#...w..........w.......#",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#.........-----........#",
      "........................",
      "........................",
      "..E..................E..",
      "####cccc..cccc..ccc#####",
      "####AAAAAAAAAAAAAAA#####",
      "####AAAAAAAAAAAAAAA#####"] },
    { n: "pendelgang", pk: true, r: [
      "########################",
      "#......p......p......#.#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E.....................",
      "#####..####..####..#####",
      "#####AA####AA####AA#####",
      "#####AA####AA####AA#####"] },
    { n: "flammenflur", pk: true, r: [
      "########################",
      "#......................#",
      "#..w.......F.......w...#",
      "#......................#",
      "#.....------..------...#",
      "#......................#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E..f....f.k..f....E...",
      "########################",
      "########################",
      "########################"] },
    { n: "pfeilgang", pk: true, r: [
      "########################",
      "#......................#",
      "#...........r..........#",
      "#......................#",
      "#..-----.......-----...#",
      "#......................#",
      "#..............E.......#",
      "#.....#####....#####...#",
      "......#####>...#####....",
      "......#####....#####....",
      "..E...#####k..k#####.E..",
      "######################..",
      "######################AA",
      "######################AA"] },
    { n: "faehre", pk: true, r: [
      "########################",
      "#......................#",
      "#...w......F.......w...#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E..................E..",
      "####mmmmmmmmmmmmmmmm####",
      "####AAAAAAAAAAAAAAAA####",
      "####AAAAAAAAAAAAAAAA####"] },
    { n: "saegewerk", pk: true, r: [
      "########################",
      "#......................#",
      "#..r.......r.......r...#",
      "#......................#",
      "#......................#",
      "#.......-----..........#",
      "#......................#",
      "#..............F.......#",
      "........................",
      "........................",
      "..E..zzzzzzzzzzzzzz..E..",
      "########################",
      "########################",
      "########################"] },
    { n: "springgrube", pk: true, r: [
      "########################",
      "#......................#",
      "#.......F..............#",
      "#......................#",
      "#.........######.......#",
      "#.........#....#.......#",
      "#..............#.......#",
      "#......................#",
      "........................",
      "........................",
      "..E..j.......j......E...",
      "###.###.....###.....####",
      "###A###AAAAA###AAAAA####",
      "###A###AAAAA###AAAAA####"] },
    { n: "steinschlag", pk: true, r: [
      "########################",
      "#..r....r....r....r....#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E..................E..",
      "######c###cc###c########",
      "######A###AA###A########",
      "######A###AA###A########"] },
    { n: "inselsprung", pk: true, r: [
      "########################",
      "#......................#",
      "#..w..........w........#",
      "#..........--..........#",
      "#......................#",
      "#......--.......--.....#",
      "#......................#",
      "#..E...................#",
      "........................",
      "........................",
      "..E.......cc....--......",
      "####..##......##....####",
      "####AA##AAAAAA##AAAA####",
      "####AA##AAAAAA##AAAA####"] },
    { n: "kletterschacht", pk: true, r: [
      "##########....##########",
      "#....r...........r.....#",
      "#......................#",
      "#..--......cc......--..#",
      "#......................#",
      "#......--......--......#",
      "#..j................j..#",
      "#####..............#####",
      "........cc....cc........",
      "........................",
      "..E..................E..",
      "####..--........--..####",
      "####................####",
      "##########....##########"] },
    { n: "sprossenturm", pk: true, r: [
      "##########....##########",
      "#.........p............#",
      "#..------.......-----..#",
      "#......................#",
      "#..........c...........#",
      "#....--.........--.....#",
      "#......................#",
      "#.F...........cc.....F.#",
      "..........--............",
      "........................",
      "..E....k.........k...E..",
      "#######--######--#######",
      "#######..######..#######",
      "##########....##########"] },
  ];
  /* Prüfen und Öffnungen bestimmen */
  TPL.forEach(t => {
    t.r = t.r.map(row => (row.length < CW ? row + "#".repeat(CW - row.length) : row.slice(0, CW)));
    const open = (r, c) => !"#?A".includes(t.r[r][c]);
    t.L = [8, 9, 10].every(r => open(r, 0));
    t.R = [8, 9, 10].every(r => open(r, CW - 1));
    t.U = [10, 11, 12, 13].every(c => open(0, c));
    t.D = [10, 11, 12, 13].every(c => open(CH - 1, c));
  });
  Z.TPL = TPL;

  /* ======================= GENERATOR ======================= */
  function mirrorRows(rows) { return rows.map(r => r.split("").reverse().join("")); }

  /* Erzeugt den Pfad durch das Raumraster je nach Richtung des Gebiets */
  function makePath(R, gw, gh, flow) {
    const path = [];
    if (flow === "through") {
      let x = 0, y = R.int(0, gh - 1); path.push([x, y]);
      while (x < gw - 1) {
        if (gh > 1 && R.chance(0.3)) { const ny = U.clamp(y + (R.chance(0.5) ? 1 : -1), 0, gh - 1); if (ny !== y && !path.some(p => p[0] === x && p[1] === ny)) { y = ny; path.push([x, y]); continue; } }
        x++; path.push([x, y]);
      }
    } else {
      const down = flow === "down";
      let y = down ? 0 : gh - 1, x = R.int(0, gw - 1); path.push([x, y]);
      const end = down ? gh - 1 : 0;
      while (y !== end) {
        const steps = R.int(0, 2);
        let dir = R.chance(0.5) ? 1 : -1;
        for (let s = 0; s < steps; s++) {
          let nx = x + dir; if (nx < 0 || nx >= gw) { dir = -dir; nx = x + dir; }
          if (nx < 0 || nx >= gw || path.some(p => p[0] === nx && p[1] === y)) break;
          x = nx; path.push([x, y]);
        }
        y += down ? 1 : -1; path.push([x, y]);
      }
      /* letzter Raum: etwas seitlich gehen, damit der Ausgangsraum Platz hat */
      if (R.chance(0.5)) { const nx = x + (x < gw / 2 ? 1 : -1); if (nx >= 0 && nx < gw) { x = nx; path.push([x, y]); } }
    }
    return path;
  }

  /* Baut eine Karte für ein Gebiet. Gibt {w,h,tiles,spawns,...} in Kacheln zurück. */
  Z.genLevel = function (biomeId, seed, opts) {
    opts = opts || {};
    for (let attempt = 0; attempt < 40; attempt++) {
      const lv = tryGen(biomeId, (seed + attempt * 7919) >>> 0, opts);
      if (lv && validate(lv)) { lv.attempts = attempt + 1; return lv; }
    }
    return tryGen(biomeId, seed, opts);
  };

  function tryGen(biomeId, seed, opts) {
    const B = BIOMES[biomeId], R = Z.Rng(seed);
    const [gw, gh] = B.grid;
    const path = makePath(R, gw, gh, B.flow);
    const key = (x, y) => x + "," + y;
    const cells = {}; /* key -> {x,y,need:{L,R,U,D}, kind:'path'|'side'|'secret', tpl} */
    const conn = (a, b, secret) => {
      const [ax, ay] = a, [bx, by] = b, A = cells[key(ax, ay)], Bc = cells[key(bx, by)];
      if (bx === ax + 1) { A.need.R = secret || true; Bc.need.L = secret || true; }
      if (bx === ax - 1) { A.need.L = secret || true; Bc.need.R = secret || true; }
      if (by === ay + 1) { A.need.D = secret || true; Bc.need.U = secret || true; }
      if (by === ay - 1) { A.need.U = secret || true; Bc.need.D = secret || true; }
    };
    path.forEach(([x, y], i) => { cells[key(x, y)] = { x, y, need: {}, kind: "path", idx: i }; });
    for (let i = 1; i < path.length; i++) conn(path[i - 1], path[i]);
    /* Seitenräume: freie Zellen neben dem Pfad, manche geheim hinter rissigen Wänden */
    const free = [];
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (!cells[key(x, y)]) free.push([x, y]);
    R.shuffle(free);
    let sides = 0;
    const maxSides = Math.max(2, Math.round(free.length * 0.6));
    for (let pass = 0; pass < 3; pass++)
      for (const [x, y] of free) {
        if (cells[key(x, y)] || sides >= maxSides) continue;
        const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => cells[key(a, b)]);
        if (!nb.length) continue;
        const to = R.pick(nb);
        cells[key(x, y)] = { x, y, need: {}, kind: "side" };
        const secret = R.chance(0.28) ? "X" : false;
        if (secret) cells[key(x, y)].kind = "secret";
        conn([x, y], to, secret);
        /* gelegentlich eine zweite Verbindung: Rundwege */
        const nb2 = nb.filter(n => n !== to);
        if (nb2.length && R.chance(0.35)) conn([x, y], R.pick(nb2));
        sides++;
      }
    /* Kachelraster */
    const W = gw * CW, H = gh * CH;
    const tiles = new Uint8Array(W * H).fill(1);
    const marks = [];
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : tiles[y * W + x]);
    const startCell = cells[key(path[0][0], path[0][1])], endCell = cells[key(path[path.length - 1][0], path[path.length - 1][1])];
    for (const k in cells) {
      const c = cells[k], n = c.need;
      /* passende Vorlage: muss alle benötigten Öffnungen haben; Sackgassen bevorzugt für Seitenräume */
      const candidates = [];
      TPL.forEach(t => {
        for (const mir of [false, true]) {
          const L = mir ? t.R : t.L, Rr = mir ? t.L : t.R;
          if (n.L && !L) continue; if (n.R && !Rr) continue; if (n.U && !t.U) continue; if (n.D && !t.D) continue;
          let w = 1;
          if (c.kind !== "path" && t.dead) w = 4;
          if (c.kind === "path" && t.dead) w = 0.15;
          if (t.pk) w *= (c.kind === "path" ? (B.parcours != null ? B.parcours : 9) : 1) * (t.U || t.D ? 0.45 : 1);
          /* weniger überflüssige Öffnungen = natürlicher */
          const extra = (L && !n.L) + (Rr && !n.R) + (t.U && !n.U) + (t.D && !n.D);
          w /= 1 + extra * 0.25;
          candidates.push({ t, mir, w });
        }
      });
      let sum = 0; candidates.forEach(c2 => (sum += c2.w));
      let pick = R() * sum, chosen = candidates[0];
      for (const c2 of candidates) { pick -= c2.w; if (pick <= 0) { chosen = c2; break; } }
      c.tpl = chosen.t.n; c.dead = !!chosen.t.dead;
      const rows = chosen.mir ? mirrorRows(chosen.t.r) : chosen.t.r;
      const ox = c.x * CW, oy = c.y * CH;
      for (let r = 0; r < CH; r++)
        for (let q = 0; q < CW; q++) {
          const ch = rows[r][q];
          let v = 0;
          if (ch === "#") v = 1; else if (ch === "-") v = 2; else if (ch === "^") v = 3; else if (ch === "H") v = 4; else if (ch === "~") v = B.hazard === "water" ? 6 : B.hazard === "lava" ? 5 : 3;
          else if (ch === "X") v = 7; else if (ch === "?") v = R.chance(0.5) ? 1 : 0;
          else if (ch === "A") v = 9; else if (ch === "c") v = 10; else if (ch === "m") v = 11;
          set(ox + q, oy + r, v);
          if ("ETSFbwpfkrjz<>m".includes(ch)) marks.push({ t: ch === "<" || ch === ">" ? (chosen.mir ? (ch === "<" ? ">" : "<") : ch) : ch, x: ox + q, y: oy + r, cell: c });
        }
      /* nicht benötigte Öffnungen verschließen, geheime Öffnungen mit rissiger Wand */
      const seal = (side, val) => {
        if (side === "L") for (let r = 8; r <= 10; r++) set(ox, oy + r, val);
        if (side === "R") for (let r = 8; r <= 10; r++) set(ox + CW - 1, oy + r, val);
        if (side === "U") for (let q = 10; q <= 13; q++) set(ox + q, oy, val);
        if (side === "D") for (let q = 10; q <= 13; q++) { set(ox + q, oy + CH - 1, val); set(ox + q, oy + CH - 2, val === 1 ? 1 : 0); }
      };
      for (const s of ["L", "R", "U", "D"]) {
        const has = s === "L" ? (chosen.mir ? chosen.t.R : chosen.t.L) : s === "R" ? (chosen.mir ? chosen.t.L : chosen.t.R) : chosen.t[s];
        if (!n[s] && has) seal(s, 1);
        else if (n[s] === "X") seal(s, 7);
      }
    }
    /* Außengebiete: oberste Raumreihe ohne Decke, damit der Himmel zu sehen ist */
    if (B.out) for (let x = 1; x < W - 1; x++) for (let y = 1; y <= 2; y++) if (get(x, y) === 1 && get(x, y + 1) !== 0 || y === 1) { if (get(x, 3) === 0 || y === 1) set(x, y, 0); }
    /* Außenrand immer Fels */
    for (let x = 0; x < W; x++) { set(x, 0, 1); set(x, H - 1, 1); }
    for (let y = 0; y < H; y++) { set(0, y, 1); set(W - 1, y, 1); }
    /* senkrechte Verbindungen: Leitern einziehen, damit man auch wieder hinaufkommt */
    for (const k in cells) {
      const c = cells[k];
      if (c.need.U && c.need.U !== "X") {
        const col = c.x * CW + 11;
        /* im oberen Raum durch dessen Boden */
        set(col, c.y * CH - 1, 4); set(col, c.y * CH - 2, 4);
        for (let r = c.y * CH; r < c.y * CH + CH; r++) { const v = get(col, r); if (v === 0 || v === 2) set(col, r, 4); else break; }
      }
    }
    /* senkrechte Geheimgänge: rissige Wand im Boden darf nicht über Leere hängen */
    /* Treppen und Leitern in Seitenräumen bleiben wie sie sind. Schwebende Einzelkacheln entfernen. */
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (get(x, y) === 1 && get(x - 1, y) === 0 && get(x + 1, y) === 0 && get(x, y - 1) === 0 && get(x, y + 1) === 0) set(x, y, 0);
    }
    /* Parcours: Gruben in lange Böden schlagen (nicht im Start-/Zielraum, nicht in Leiter-/Türspalten) */
    carvePits({ get, set, cells, startCell, endCell }, R, B);
    /* Gruben, unter denen ein Raum liegt, werden zu Schächten nach unten – mit Leiter zum Wiederhochklettern */
    if (!ABYSS[biomeId]) voidToShafts({ get, set, cells, W, H }, R);
    /* Stacheln brauchen Boden */
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) if (get(x, y) === 3 && get(x, y + 1) !== 1) set(x, y + 1, 1);
    const lv = { biome: biomeId, seed, W, H, tiles, marks, cells, path, gw, gh, startCell, endCell, flow: B.flow, out: !!B.out };
    lv.get = get; lv.set = set;
    placeSpecial(lv, R, B, opts);
    return lv;
  }

  function carvePits(lv, R, B) {
    const g = lv.get, chance = B.pits != null ? B.pits : 0.9;
    for (const k in lv.cells) {
      const c = lv.cells[k];
      if (c === lv.startCell || c === lv.endCell || c.kind === "secret" || !R.chance(c.kind === "path" ? chance : chance * 0.4)) continue;
      const ox = c.x * CW, oy = c.y * CH, runs = [];
      for (let r = oy + 4; r <= oy + CH - 2; r++) {
        let x0 = -1;
        for (let x = ox + 2; x <= ox + CW - 3; x++) {
          const ok = g(x, r) === 1 && g(x, r - 1) === 0 && g(x, r - 2) === 0 && (g(x, r - 3) === 0 || g(x, r - 3) === 2) && g(x, r + 1) === 1;
          if (ok && x0 < 0) x0 = x;
          if ((!ok || x === ox + CW - 3) && x0 >= 0) { const x1 = ok ? x : x - 1; if (x1 - x0 + 1 >= 6) runs.push([x0, x1, r]); x0 = -1; }
        }
      }
      if (!runs.length) continue;
      const nPits = R.chance(0.55) ? 2 : 1;
      for (let n = 0; n < nPits && runs.length; n++) {
        const [x0, x1, r] = runs.splice(R.int(0, runs.length - 1), 1)[0];
        const gl = Math.min(R.int(2, 4), x1 - x0 - 3);
        if (gl < 2) continue;
        const vert = c.need.U || c.need.D, opts = [];
        for (let gx = x0 + 2; gx + gl <= x1 - 1; gx++) { let bad = false; if (vert) for (let x = gx - 1; x <= gx + gl; x++) { const rel = x - ox; if (rel >= 8 && rel <= 15) bad = true; } if (!bad) opts.push(gx); }
        if (!opts.length) continue;
        const gx = opts[R.int(0, opts.length - 1)];
        for (let x = gx; x < gx + gl; x++) for (let y = r; y <= Math.min(r + 2, oy + CH - 1); y++) { if (g(x, y) === 1) lv.set(x, y, 9); else break; }
        /* manchmal ein bröckelnder Steg über der Grube */
        if (gl >= 3 && R.chance(0.3)) for (let x = gx; x < gx + gl; x++) lv.set(x, r, 10);
      }
    }
  }
  const ABYSS = { schlund: 1, glut: 1, sturm: 1, zinnen: 1 };
  function voidToShafts(lv, R) {
    const g = lv.get, done = new Set();
    for (let y = 1; y < lv.H - 1; y++) for (let x = 1; x < lv.W - 1; x++) {
      if (g(x, y) !== 9 || g(x, y - 1) === 9 || done.has(x + "," + y)) continue;
      /* Lauf der Grube in dieser Zeile */
      let x1 = x; while (g(x1 + 1, y) === 9) x1++;
      for (let q = x; q <= x1; q++) done.add(q + "," + y);
      const cy = Math.floor(y / CH), cxl = Math.floor(x / CW);
      const below = lv.cells[cxl + "," + (cy + 1)];
      if (!below) continue;
      /* Grube und Fels darunter bis in den unteren Raum öffnen */
      let ok = true; const bottoms = [];
      for (let q = x; q <= x1; q++) {
        let yy = y; while (g(q, yy) === 9) { lv.set(q, yy, 0); yy++; }
        let n = 0; while (n < 7 && (g(q, yy) === 1 || g(q, yy) === 7)) { lv.set(q, yy, 0); yy++; n++; }
        if (n >= 7) ok = false;
        let fy = yy; while (fy < lv.H - 1 && g(q, fy + 1) !== 1 && g(q, fy + 1) !== 2 && g(q, fy + 1) !== 8 && fy - y < 40) fy++;
        bottoms.push(fy);
      }
      /* Leiter in der Mitte des Schachts vom unteren Boden bis zur Grubenkante */
      const lx = Math.round((x + x1) / 2), bot = bottoms[lx - x];
      for (let yy = bot; yy >= y; yy--) { const v = g(lx, yy); if (v === 0 || v === 2) lv.set(lx, yy, 4); else if (v !== 4) break; }
      if (!ok) for (let q = x; q <= x1; q++) lv.set(q, y, 9);
    }
  }
  /* Fallen auf normale Räume streuen – je Gebiet passend */
  const TRAPKINDS = { torhof: "kr", keller: "kr<", hallen: "pk<", wehrgang: "pk<", verlies: "kf<", hafen: "zkj", glocken: "pkr", schlund: "rfk", schmiede: "zfk", zinnen: "pkj", see: "rkj", glut: "fkz", sturm: "pkr" };
  function sprinkleTraps(lv, R, B, avoid) {
    const kinds = TRAPKINDS[lv.biome]; if (!kinds) return; lv.traps = lv.traps || [];
    const g = lv.get, solid = v => v === 1 || v === 7, taken = [];
    const free = (x, y) => !avoid(x, y) && !taken.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - y) < 3) && !(lv.traps || []).some(t => Math.abs(t.x - x) < 3 && Math.abs(t.y - y) < 3);
    const add = (t, x, y) => { (lv.traps = lv.traps || []).push({ t, x, y }); taken.push([x, y]); };
    for (const k in lv.cells) {
      const c = lv.cells[k];
      if (c === lv.startCell || c.kind === "secret" || !R.chance(c.kind === "path" ? 0.75 : 0.35)) continue;
      const ox = c.x * CW, oy = c.y * CH, want = R.chance(0.4) ? 2 : 1;
      for (let n = 0, tries = 0; n < want && tries < 30; tries++) {
        const kind = kinds[R.int(0, kinds.length - 1)], x = ox + R.int(2, CW - 3), y = oy + R.int(2, CH - 2);
        if (!free(x, y)) continue;
        if ((kind === "k" || kind === "f" || kind === "j") && standable(lv, x, y, 3) && standable(lv, x - 1, y, 2) && standable(lv, x + 1, y, 2) && g(x, y + 1) === 1) { add(kind, x, y); n++; }
        else if (kind === "z" && standable(lv, x, y, 3)) { let x1 = x; while (x1 - x < 7 && standable(lv, x1 + 1, y, 3) && g(x1 + 1, y + 1) === 1) x1++; if (x1 - x >= 4) { for (let q = x; q <= x1; q++) lv.traps.push({ t: "z", x: q, y }); taken.push([x, y]); n++; } }
        else if (kind === "r" && g(x, y) === 0 && solid(g(x, y - 1))) { let d = 0; while (d < 9 && g(x, y + d + 1) === 0) d++; if (d >= 4 && d < 9) { add("r", x, y); n++; } }
        else if (kind === "p" && g(x, y) === 0 && solid(g(x, y - 1))) { let d = 0; while (d < 12 && g(x, y + d + 1) === 0) d++; if (d >= 7) { add("p", x, y); n++; } }
        else if (kind === "<" && standable(lv, x, y, 3)) {
          for (const dir of [1, -1]) { if (!solid(g(x - dir, y - 1))) continue; let run = 0; while (run < 8 && g(x + dir * (run + 1), y - 1) === 0) run++; if (run >= 6) { add(dir > 0 ? ">" : "<", x, y - 1); n++; break; } }
        }
      }
    }
  }
  /* Standplätze finden: Luft mit festem Boden darunter und Kopffreiheit */
  function standable(lv, x, y, head) {
    const g = lv.get, below = g(x, y + 1);
    if (g(x, y) !== 0) return false;
    for (let i = 1; i < (head || 2); i++) if (g(x, y - i) !== 0) return false;
    return below === 1 || below === 2 || below === 8;
  }
  Z.standable = standable;
  function spotsIn(lv, cell, head, wide) {
    const out = [], ox = cell.x * CW, oy = cell.y * CH;
    for (let y = oy + 1; y < oy + CH - 1; y++)
      for (let x = ox + 1; x < ox + CW - 1; x++) {
        if (!standable(lv, x, y, head)) continue;
        if (wide && !(standable(lv, x - 1, y, head) && standable(lv, x + 1, y, head))) continue;
        out.push([x, y]);
      }
    return out;
  }

  function placeSpecial(lv, R, B, opts) {
    lv.spawns = []; lv.loot = []; lv.props = []; lv.doors = []; lv.decor = [];
    /* Start: im ersten Raum ein Platz für die Eingangstür */
    let sp = spotsIn(lv, lv.startCell, 3, true);
    if (!sp.length) sp = spotsIn(lv, lv.startCell, 2, false);
    sp.sort((a, b) => Math.abs(a[0] - (lv.startCell.x * CW + 12)) - Math.abs(b[0] - (lv.startCell.x * CW + 12)));
    const st = sp[0] || [lv.startCell.x * CW + 12, lv.startCell.y * CH + 10];
    lv.start = { x: st[0], y: st[1] };
    lv.doors.push({ kind: "entry", x: st[0], y: st[1] });
    /* Ausgänge: im letzten Raum, möglichst weit auseinander */
    const exits = opts.exits || B.exits || [];
    let ep = spotsIn(lv, lv.endCell, 3, true).filter(p => Math.abs(p[0] - st[0]) + Math.abs(p[1] - st[1]) > 6);
    if (ep.length < exits.length) ep = ep.concat(spotsIn(lv, lv.endCell, 3, false));
    if (ep.length < exits.length) {
      /* Notfall: Boden im Ausgangsraum ebnen und Platz schaffen */
      const oy = lv.endCell.y * CH, ox = lv.endCell.x * CW;
      for (let x = ox + 2; x < ox + CW - 2; x++) { for (let y = oy + 8; y <= oy + 11; y++) lv.set(x, y, 0); lv.set(x, oy + 12, 1); }
      ep = spotsIn(lv, lv.endCell, 3, true);
    }
    const chosen = [];
    R.shuffle(ep);
    for (const p of ep) { if (chosen.length >= exits.length) break; if (chosen.every(q => Math.abs(q[0] - p[0]) >= 4 || Math.abs(q[1] - p[1]) >= 3)) chosen.push(p); }
    chosen.sort((a, b) => a[0] - b[0]);
    exits.forEach((to, i) => { const p = chosen[i] || chosen[0] || [lv.endCell.x * CW + 12, lv.endCell.y * CH + 11]; lv.doors.push({ kind: "exit", to, x: p[0], y: p[1] }); });
    if (B.warden) lv.warden = { id: B.warden, cell: lv.endCell };
    /* Markierungen auswerten */
    const startPx = lv.start.x, startPy = lv.start.y;
    const nearStart = (x, y) => Math.abs(x - startPx) < 12 && Math.abs(y - startPy) < 7;
    const nearDoor = (x, y) => lv.doors.some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 3);
    const dens = B.density || 1;
    let scrolls = 0;
    for (const m of lv.marks) {
      if (m.t === "E" && !nearStart(m.x, m.y) && R.chance(0.62 * dens)) lv.spawns.push({ x: m.x, y: m.y, fly: false });
      if (m.t === "F" && !nearStart(m.x, m.y) && R.chance(0.5 * dens)) lv.spawns.push({ x: m.x, y: m.y, fly: true });
      if (m.t === "T") lv.loot.push({ kind: m.cell.kind !== "path" || R.chance(0.4) ? "chest" : "item", x: m.x, y: m.y, side: m.cell.kind });
      if (m.t === "S" && scrolls < 3 && R.chance(0.65)) { lv.loot.push({ kind: "scroll", x: m.x, y: m.y }); scrolls++; }
      if (m.t === "b" && !nearDoor(m.x, m.y)) lv.props.push({ kind: "breakable", x: m.x, y: m.y });
      if (m.t === "w") lv.decor.push({ kind: "window", x: m.x, y: m.y });
      if ("pfkrjz<>m".includes(m.t)) (lv.traps = lv.traps || []).push({ t: m.t, x: m.x, y: m.y });
    }
    /* Fallen über die Karte verteilen, nicht direkt an Start und Türen */
    sprinkleTraps(lv, R, B, (x, y) => nearStart(x, y) || nearDoor(x, y) || lv.doors.some(d => Math.abs(d.x - x) < 5 && Math.abs(d.y - y) < 4));
    /* zusätzliche Gegner auf zufälligen Bodenplätzen, damit jede Karte gut gefüllt ist */
    const allSpots = [];
    for (const k in lv.cells) spotsIn(lv, lv.cells[k], 2, false).forEach(p => allSpots.push(p));
    R.shuffle(allSpots);
    const want = Math.round(Object.keys(lv.cells).length * 2.6 * dens);
    for (const p of allSpots) {
      if (lv.spawns.length >= want) break;
      if (nearStart(p[0], p[1]) || nearDoor(p[0], p[1])) continue;
      if (lv.spawns.some(s => Math.abs(s.x - p[0]) < 4 && Math.abs(s.y - p[1]) < 3)) continue;
      lv.spawns.push({ x: p[0], y: p[1], fly: R.chance(0.15) });
    }
    /* mindestens eine Schriftrolle und zwei Waffenfunde pro Gebiet */
    const freeSpots = allSpots.filter(p => !nearStart(p[0], p[1]) && !nearDoor(p[0], p[1]) && !lv.loot.some(l => Math.abs(l.x - p[0]) < 3 && l.y === p[1]));
    while (scrolls < 2 && freeSpots.length) { const p = freeSpots.pop(); lv.loot.push({ kind: "scroll", x: p[0], y: p[1] }); scrolls++; }
    let items = lv.loot.filter(l => l.kind === "item").length;
    while (items < 2 && freeSpots.length) { const p = freeSpots.pop(); lv.loot.push({ kind: "item", x: p[0], y: p[1] }); items++; }
    if (R.chance(0.35) && freeSpots.length) { const p = freeSpots.pop(); lv.loot.push({ kind: "cursed", x: p[0], y: p[1] }); }
    if (R.chance(0.5) && freeSpots.length) { const p = freeSpots.pop(); lv.loot.push({ kind: "food", x: p[0], y: p[1] }); }
    /* Dekoration: Requisiten an Wänden und auf Böden */
    decorate(lv, R, B);
  }

  function decorate(lv, R, B) {
    const g = lv.get, props = B.props || {};
    const keys = Object.keys(props);
    const wallSpots = [], floorSpots = [], ceilSpots = [];
    for (let y = 2; y < lv.H - 2; y++)
      for (let x = 2; x < lv.W - 2; x++) {
        if (g(x, y) !== 0) continue;
        if (g(x, y + 1) === 1 && g(x, y - 1) === 0 && g(x, y - 2) === 0) floorSpots.push([x, y]);
        if (g(x, y - 1) === 1 && g(x, y + 1) === 0 && g(x, y + 2) === 0) ceilSpots.push([x, y]);
        if (g(x, y + 1) === 0 && g(x, y - 1) === 0 && g(x, y + 2) === 0 && g(x, y - 2) === 0 && g(x - 1, y) === 0 && g(x + 1, y) === 0) wallSpots.push([x, y]);
      }
    R.shuffle(wallSpots); R.shuffle(floorSpots); R.shuffle(ceilSpots);
    const taken = new Set(), tk = (x, y) => x + "," + y;
    const free = (x, y, r) => { for (let i = -r; i <= r; i++) if (taken.has(tk(x + i, y))) return false; return true; };
    const add = (kind, x, y, r) => { lv.decor.push({ kind, x, y, s: R() }); for (let i = -(r || 1); i <= (r || 1); i++) taken.add(tk(x + i, y)); };
    const ceilKinds = ["chain", "cage", "chandelier", "web", "rope", "gear", "bell", "cocoon", "lantern", "vine", "net", "beam"];
    const floorKinds = ["barrel", "crate", "bones", "skull", "pot", "sack", "statue", "armor", "table", "anvil", "forge", "mushroom", "coral", "shell", "hay", "cart", "brazier", "candelabra", "anchor", "statueKuo", "statueDuergar", "greenfire", "weapons", "rack", "crystal", "gargoyle", "mast", "candle"];
    const wallKinds = ["torch", "banner", "painting", "window", "rune", "pipe", "column", "bars", "crenel", "shelf"];
    const pickKind = list => { const o = {}; keys.forEach(k => { if (list.includes(k)) o[k] = props[k]; }); return Object.keys(o).length ? R.weighted(o) : null; };
    const nWall = Math.round(lv.W * lv.H / 70), nFloor = Math.round(lv.W * lv.H / 95), nCeil = Math.round(lv.W * lv.H / 120);
    let i = 0;
    for (const [x, y] of wallSpots) { if (i >= nWall) break; const k = pickKind(wallKinds); if (!k) break; if (!free(x, y, 3)) continue; add(k, x, y, 3); i++; }
    i = 0;
    for (const [x, y] of floorSpots) { if (i >= nFloor) break; const k = pickKind(floorKinds); if (!k) break; if (!free(x, y, 2)) continue; if (lv.doors.some(d => Math.abs(d.x - x) < 3 && d.y === y)) continue; add(k, x, y, 2); i++; }
    i = 0;
    for (const [x, y] of ceilSpots) { if (i >= nCeil) break; const k = pickKind(ceilKinds); if (!k) break; if (!free(x, y, 2)) continue; add(k, x, y, 2); i++; }
    /* Lichtquellen: Fackeln & Co. zählen als Licht */
    lv.lights = lv.decor.filter(d => ["torch", "brazier", "candelabra", "chandelier", "lantern", "forge", "greenfire", "mushroom", "rune", "crystal", "candle", "window"].includes(d.kind));
  }

  /* ======================= ERREICHBARKEIT ======================= */
  /* grobe Prüfung: Von der Startposition aus müssen alle Ausgänge erreichbar sein (Laufen, Fallen, Springen bis 6 Kacheln, Leitern). */
  function validate(lv) {
    /* Abgrund zählt als unbetretbar, bröckelnde Stege und Fährstrecken wie Stege */
    const g0 = lv.get, g = (x, y) => { const v = g0(x, y); return v === 9 ? 99 : v === 10 || v === 11 ? 2 : v; }, W = lv.W, H = lv.H;
    const passable = v => v === 0 || v === 2 || v === 4 || v === 6 || v === 8;
    const canStand = (x, y) => passable(g(x, y)) && g(x, y) !== 2 && passable(g(x, y - 1)) && (g(x, y + 1) === 1 || g(x, y + 1) === 2 || g(x, y + 1) === 7 || g(x, y + 1) === 3 || g(x, y + 1) === 5 || g(x, y + 1) === 4 || g(x, y) === 4);
    const seen = new Uint8Array(W * H), q = [];
    const push = (x, y) => { if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; const i = y * W + x; if (seen[i]) return; if (!canStand(x, y)) return; seen[i] = 1; q.push([x, y]); };
    push(lv.start.x, lv.start.y);
    const fall = (x, y) => { let yy = y; while (yy < H - 1 && passable(g(x, yy + 1)) && g(x, yy + 1) !== 2 && g(x, yy + 1) !== 4) yy++; return yy; };
    while (q.length) {
      const [x, y] = q.pop();
      /* Leiter */
      if (g(x, y) === 4 || g(x, y - 1) === 4) { let yy = y; while (g(x, yy - 1) === 4 || (g(x, yy) === 4 && passable(g(x, yy - 1)))) { yy--; push(x, yy); if (yy < 1) break; } }
      if (g(x, y + 1) === 4) { let yy = y + 1; while (g(x, yy) === 4) { push(x, yy); yy++; } push(x, fall(x, yy - 1)); }
      /* Laufen und Fallen */
      for (const d of [-1, 1]) {
        const nx = x + d;
        if (!passable(g(nx, y)) || !passable(g(nx, y - 1))) continue;
        if (canStand(nx, y)) push(nx, y);
        else { const fy = fall(nx, y); for (let dx = 0; dx <= 3; dx++) { const fx = nx + d * dx; if (canStand(fx, fy)) push(fx, fy); const fy2 = fall(fx, y); if (passable(g(fx, y)) && canStand(fx, fy2)) push(fx, fy2); } }
      }
      /* Durch Stege fallen */
      if (g(x, y + 1) === 2) push(x, fall(x, y + 1));
      /* Springen: Ziele bis 6 hoch / 5 weit, wenn der Kopfraum frei ist */
      for (let dy = 1; dy <= 6; dy++) {
        if (!passable(g(x, y - dy - 1)) && g(x, y - dy - 1) !== 2) break;
        const maxDx = dy <= 3 ? 6 : dy <= 5 ? 4 : 2;
        for (let dx = -maxDx; dx <= maxDx; dx++) {
          const tx = x + dx, ty = y - dy;
          if (!canStand(tx, ty)) continue;
          /* waagrechter Weg in Zielhöhe frei? */
          let ok = true; const s = U.sign(dx);
          for (let k = 0; k !== dx; k += s) if (!passable(g(x + k, ty - 1)) && g(x + k, ty - 1) !== 2) { ok = false; break; }
          if (ok) push(tx, ty);
        }
      }
      /* weite Sprünge auf gleicher Höhe / nach unten */
      for (let dx = -7; dx <= 7; dx++) for (let dy = 0; dy <= 4; dy++) { const tx = x + dx, ty = y + dy; if (canStand(tx, ty)) { let ok = true; const s = U.sign(dx); for (let k = s; k !== dx; k += s) if (!passable(g(x + k, y - 1)) || !passable(g(x + k, y - 2))) { ok = false; break; } if (ok) push(tx, ty); } }
    }
    lv.reach = seen;
    for (const d of lv.doors) if (d.kind === "exit" && !seen[d.y * W + d.x]) return false;
    return true;
  }
  Z.validateLevel = validate;

  /* ======================= HANDGEBAUTE KARTEN ======================= */
  /* Lager vor der Feste (Startbereich), Zwischenhalt und die Bossarenen */
  function fromRows(rows, extra) {
    const H = rows.length, W = Math.max(...rows.map(r => r.length));
    const tiles = new Uint8Array(W * H);
    const marks = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < W; x++) {
        const ch = row[x] || "#";
        let v = 0;
        if (ch === "#") v = 1; else if (ch === "-") v = 2; else if (ch === "^") v = 3; else if (ch === "H") v = 4; else if (ch === "~") v = 5; else if (ch === "w") v = 6; else if (ch === "=") v = 8;
        tiles[y * W + x] = v;
        if (/[A-Za-z0-9@!$%&*+]/.test(ch) && !"Hw".includes(ch)) marks.push({ t: ch, x, y });
      }
    });
    const lv = Object.assign({ W, H, tiles, marks, cells: {}, doors: [], loot: [], props: [], decor: [], spawns: [], lights: [] }, extra || {});
    lv.get = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : tiles[y * W + x]);
    lv.set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = v; };
    return lv;
  }
  Z.fromRows = fromRows;

  Z.genHub = function () {
    /* P Spieler, A Amboss/Schmiede (Nundro), B Bestiarium/Fundbuch (Barradin), C Schädelaltar, D Tor in die Feste, F Lagerfeuer,
       R Rex, E Echo, G Friedrich, Y Trainingspuppe, N Schwarzes Brett/Rückblick */
    const rows = [
      "....................................................................",
      "#..................................................................#",
      "#..................................................................#",
      "#..................................................................#",
      "#..................................................................#",
      "#..................................................................#",
      "#..................................................................#",
      "#..................................................................#",
      "#........................................-------...................#",
      "#..................................................................#",
      "#..................................................................#",
      "#.......Y.......A.........B....G...F..E......R.....C.......P.....D.#",
      "####################################################################",
      "####################################################################"
    ];
    const lv = fromRows(rows, { biome: "lager", hub: true, out: true });
    for (const m of lv.marks) {
      if (m.t === "P") lv.start = { x: m.x, y: m.y };
      else if (m.t === "D") lv.doors.push({ kind: "gate", x: m.x, y: m.y });
      else lv.props.push({ kind: "npc", id: m.t, x: m.x, y: m.y });
    }
    lv.decor.push({ kind: "tent", x: 30, y: 11 }, { kind: "tent", x: 22, y: 11, s: 0.6 }, { kind: "cart", x: 12, y: 11 }, { kind: "barrel", x: 18, y: 11 }, { kind: "crate", x: 19, y: 11 },
      { kind: "torch", x: 64, y: 8 }, { kind: "torch", x: 60, y: 8 }, { kind: "banner", x: 66, y: 6 }, { kind: "weapons", x: 14, y: 11 }, { kind: "lantern", x: 43, y: 9 });
    lv.lights = [{ kind: "campfire", x: 35, y: 11 }, { kind: "forge", x: 16, y: 11 }, { kind: "torch", x: 64, y: 8 }, { kind: "torch", x: 60, y: 8 }, { kind: "lantern", x: 43, y: 9 }];
    return lv;
  };

  Z.genPassage = function (fromBiome, toArea) {
    /* Zwischenhalt: Brunnen (K), Händler (M), Segensaltar (S), Ablage für Seelensplitter (A), Tür weiter (D) */
    const rows = [
      "##########################################",
      "##########################################",
      "####....................................##",
      "###......................................#",
      "##.......................................#",
      "##.......................................#",
      "#........................................#",
      "#........................................#",
      "#........................................#",
      "#...P......K.......M.........S.......D...#",
      "##########################################",
      "##########################################"
    ];
    const lv = fromRows(rows, { biome: "passage", passage: true, from: fromBiome, to: toArea });
    for (const m of lv.marks) {
      if (m.t === "P") lv.start = { x: m.x, y: m.y };
      else if (m.t === "D") lv.doors.push({ kind: "exit", to: toArea, x: m.x, y: m.y });
      else lv.props.push({ kind: "station", id: m.t, x: m.x, y: m.y });
    }
    lv.doors.push({ kind: "entry", x: lv.start.x, y: lv.start.y });
    lv.decor.push({ kind: "torch", x: 8, y: 6 }, { kind: "torch", x: 24, y: 6 }, { kind: "torch", x: 34, y: 6 }, { kind: "banner", x: 16, y: 4 }, { kind: "chain", x: 20, y: 2 }, { kind: "barrel", x: 22, y: 9 }, { kind: "crate", x: 23, y: 9 });
    lv.lights = [{ kind: "torch", x: 8, y: 6 }, { kind: "torch", x: 24, y: 6 }, { kind: "torch", x: 34, y: 6 }, { kind: "fountain", x: 11, y: 9 }, { kind: "altar", x: 29, y: 9 }];
    return lv;
  };

  Z.genArena = function (id) {
    const A = ARENAS[id];
    let rows;
    switch (A.kind) {
      case "lab": rows = [
        "##############################################",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#.......------.................------........#",
        "#............................................#",
        "#............................................#",
        "#..................--------..................#",
        "#............................................#",
        "#............................................#",
        "#....------......................------......#",
        "#............................................#",
        "#............................................#",
        "#..P.................................B....D..#",
        "##############################################",
        "##############################################"]; break;
      case "pier": rows = [
        "################################################",
        "#..............................................#",
        "#..............................................#",
        "#..............................................#",
        "#..............................................#",
        "#..............................................#",
        "#..............................................#",
        "#..........-----..............-----............#",
        "#..............................................#",
        "#..............................................#",
        "#.....-----...........------.........-----.....#",
        "#..............................................#",
        "#..............................................#",
        "#..............................................#",
        "#..P.................................B......D..#",
        "######################==########==##############",
        "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
        "################################################"]; break;
      case "tower": rows = [
        "##############################################",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#.........-----..............-----...........#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#...--...............----..............--....#",
        "#............................................#",
        "#............................................#",
        "#............................................#",
        "#..P..............................B.......D..#",
        "##############################################",
        "##############################################"]; break;
      case "lakeboss": rows = [
        "########################################################",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#.........------......................------...........#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#....------..........--------...........------.........#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#..P....................B..............................#",
        "########################################################",
        "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
        "########################################################"]; break;
      case "hoard": rows = [
        "########################################################",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#.......------........................------...........#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#..................---------...........................#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#..P...................B...............................#",
        "##############~~~~###################~~~~###############",
        "########################################################",
        "########################################################"]; break;
      default: rows = [ /* towertop */
        "........................................................",
        "........................................................",
        "........................................................",
        "........................................................",
        "........................................................",
        "........................................................",
        "........................................................",
        "........................................................",
        "#.........-----.........................-----..........#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#...----.............--------..................----....#",
        "#......................................................#",
        "#......................................................#",
        "#......................................................#",
        "#..P...................B...............................#",
        "########################################################",
        "########################################################",
        "########################################################"];
    }
    const lv = fromRows(rows, { biome: A.base, arena: id, out: A.kind === "towertop" || A.kind === "pier", bossId: A.boss });
    for (const m of lv.marks) {
      if (m.t === "P") lv.start = { x: m.x, y: m.y };
      if (m.t === "B") lv.bossSpot = { x: m.x, y: m.y };
      if (m.t === "D") lv.exitSpot = { x: m.x, y: m.y };
    }
    lv.doors.push({ kind: "entry", x: lv.start.x, y: lv.start.y });
    const ex = A.exits || [];
    const spots = [[lv.W - 4, lv.H - 3 - (A.kind === "pier" ? 1 : 0) - (["lakeboss", "hoard", "towertop"].includes(A.kind) ? 1 : 0)]];
    const base = lv.exitSpot || { x: lv.W - 5, y: spots[0][1] };
    ex.forEach((to, i) => lv.doors.push({ kind: "exit", to, x: base.x - i * 5, y: base.y, locked: true }));
    const B = BIOMES[A.base];
    const R = Z.Rng(id.length * 977 + 13);
    decorate(lv, R, B);
    lv.decor = lv.decor.filter(d => d.y < lv.H - 3 || !["barrel", "crate", "pot", "sack"].includes(d.kind));
    return lv;
  };
})();
