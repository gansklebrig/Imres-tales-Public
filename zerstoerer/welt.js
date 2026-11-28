/* Ezekiel – The Destroyer · Welt
   Gebiete (Biome), ihr Netz aus Wegen, Raumvorlagen und der Generator, der daraus jedes Mal eine neue Karte baut.
   Große Karten: 2–3× so viele Räume wie früher, der Hauptweg zum Ausgang nur ~1,5× so lang; der Rest sind Nebenzweige
   (Türme, Keller, Flügel, Schleifen, Abkürzungen) mit Belohnungen – geplant in plan(), zum Leben erweckt in erkundung.js.
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
      foes: { goblin: 4, goblinBogen: 3, goblinSchlaeger: 1, robe: 3, ratte: 2, wolf: 2, goblinTrommler: 1, goblinSchild: 1 }, density: 0.85,
      squads: [["goblinSchild", "goblinBogen", "goblinBogen"], ["goblinTrommler", "goblin", "goblin", "goblinSchlaeger"], ["wolf", "wolf", "goblinBogen"]], /* W10 */
      exits: ["keller", "hallen", "wehrgang"], amb: { loops: [["amb/a_nacht.mp3", 0.5], ["amb/a_hof.mp3", 0.25], ["amb/a_wind1.mp3", 0.18]], one: [["e_eule_", 4, 9], ["e_kraehe_", 16, 14], ["n_kette_", 4, 20]] },
      music: "torhof", story: ["Die Zugbrücke ist unten. Niemand hält Wache. Natürlich nicht.", "The drawbridge is down. No one keeps watch. Of course not."]
    },
    keller: {
      tier: 1, open: "vault", flow: "down", grid: [3, 4], name: ["Die Keller", "The Cellars"], sub: ["Fässer, Ratten und ein Geruch, über den niemand spricht", "Barrels, rats and a smell nobody talks about"],
      sky: ["#0e0b0c", "#1a1414", "#251c1a"], wall: "#2a221e", brick: "#1a1512",
      tile: { base: "#4e4238", light: "#76644e", dark: "#201a16", det: "#5c4e40", top: "drip", topCol: "#3d4a30" }, plat: "#5e4028",
      dark: 0.62, ambCol: "#3a2a1a", bg: "cellar", weather: ["dust", "drip"], hazard: "spikes",
      props: { barrel: 4, crate: 3, torch: 2, shelf: 2, web: 2, pot: 3, sack: 2, bones: 1, candle: 2 },
      foes: { ratte: 4, robe: 3, robeArmbrust: 2, phiole: 2, kerkerwache: 1, skelett: 2, goblinBombe: 1, laternentraeger: 2, gallertwuerfel: 1 }, density: 1,
      squads: [["laternentraeger", "robe", "robeArmbrust"], ["gallertwuerfel", "robeArmbrust"], ["robe", "robe", "phiole"], ["laternentraeger", "skelett", "skelett"]], /* W10 */
      exits: ["verlies", "hafen"], amb: { loops: [["amb/a_tropfstein.mp3", 0.5], ["amb/a_grabesdroehnen.mp3", 0.15]], one: [["n_ratte_", 6, 8], ["e_kette_", 4, 22], ["n_tropfen_", 1, 6]] },
      music: "keller", story: ["Unter der Feste lagert mehr als Wein.", "Beneath the keep there is more than wine."]
    },
    hallen: {
      tier: 1, open: "arch", flow: "through", grid: [6, 2], name: ["Die Burghallen", "The Great Halls"], sub: ["Teppiche, Kerzen und zu viele Rote Roben", "Carpets, candles and too many Red Robes"],
      sky: ["#140a0c", "#2a1214", "#3a1a18"], wall: "#3a2420", brick: "#28160f",
      tile: { base: "#5a443e", light: "#8a6c58", dark: "#24161a", det: "#6e5448", top: "carpet", topCol: "#8a1f24" }, plat: "#6e4a2c",
      dark: 0.38, ambCol: "#5a2a1a", bg: "halls", weather: ["dust", "embers"], hazard: "spikes",
      props: { candelabra: 3, banner: 4, painting: 3, torch: 2, statue: 2, column: 2, armor: 2, table: 2, window: 2, chandelier: 2 },
      foes: { robe: 4, robeTrunk: 2, adept: 2, ruestung: 2, robeSchlaeger: 1, drowWache: 1, mimik: 1, goblinTrommler: 1 }, density: 1,
      squads: [["robeSchlaeger", "adept", "robe"], ["ruestung", "ruestung", "adept"], ["robeTrunk", "robeTrunk", "robe"], ["goblinTrommler", "robe", "robe", "robeArmbrust"]], /* W10 */
      exits: ["verlies", "hafen", "glocken"], amb: { loops: [["amb/a_halle.mp3", 0.45], ["amb/a_feuer1.mp3", 0.2]], one: [["e_raunen_", 3, 16], ["n_stuhl_", 2, 22], ["e_glocke_", 3, 40]] },
      music: "hallen", story: ["Jemand hat für Gäste gedeckt. Für viele Gäste.", "Someone has set the table for guests. Many guests."]
    },
    wehrgang: {
      tier: 1, open: "arch", flow: "up", grid: [3, 4], out: true, name: ["Der Wehrgang", "The Ramparts"], sub: ["Wind, Zinnen und Bogenschützen mit zu viel Zeit", "Wind, battlements and archers with too much time"],
      sky: ["#0e0a18", "#2a1a30", "#6a3a3a"], wall: "#2e2830", brick: "#1e1a20",
      tile: { base: "#56504e", light: "#8a807a", dark: "#25202a", det: "#6a6260", top: "moss", topCol: "#4a5a3a" }, plat: "#6a4a30",
      dark: 0.35, ambCol: "#3a2a4a", bg: "ramparts", weather: ["wind", "leaves", "dust"], hazard: "spikes",
      props: { banner: 4, torch: 2, crate: 1, weapons: 2, brazier: 2, rope: 2, crenel: 3 },
      foes: { goblinBogen: 3, stirge: 3, soeldner: 3, drowSchuetze: 2, goblin: 2, wolfsreiter: 1, kenku: 2, goblinSchild: 1 }, density: 0.95,
      squads: [["goblinSchild", "goblinBogen", "drowSchuetze"], ["kenku", "kenku", "soeldner"], ["wolfsreiter", "goblin", "goblin"]], /* W10 */
      exits: ["hafen", "glocken"], amb: { loops: [["amb/a_heulwind.mp3", 0.45], ["amb/a_wind1.mp3", 0.3]], one: [["e_kraehe_", 16, 9], ["n_windstoss_", 1, 12], ["e_fernglocken_", 2, 30]] },
      music: "wehrgang", story: ["Oben pfeift der Wind. Und manchmal ein Pfeil.", "Up top the wind whistles. Sometimes an arrow does."]
    },
    verlies: {
      tier: 2, open: "vault", flow: "down", grid: [3, 5], name: ["Das Verlies", "The Dungeon"], sub: ["Ketten, Zellen und die Geiseln der Spinne", "Chains, cells and the Spider's hostages"],
      sky: ["#0a0c0a", "#121612", "#1a1e18"], wall: "#232620", brick: "#151813",
      tile: { base: "#3e4238", light: "#646a56", dark: "#171a14", det: "#4c5244", top: "slime", topCol: "#4f6a2a" }, plat: "#4e3a28",
      dark: 0.7, ambCol: "#2a3a1a", bg: "dungeon", weather: ["drip", "dust", "fog"], hazard: "spikes",
      props: { chain: 4, cage: 3, torch: 2, bones: 3, skull: 2, web: 2, bars: 3, rack: 1 },
      foes: { skelett: 3, skelBogen: 2, kerkerwache: 2, ratte: 2, zombie: 2, phiole: 1, folterknecht: 1, grimlock: 2, ghul: 2, laternentraeger: 1 }, density: 1.05,
      squads: [["grimlock", "grimlock", "ghul"], ["kerkerwache", "skelBogen", "skelBogen"], ["folterknecht", "zombie", "zombie"], ["laternentraeger", "kerkerwache", "skelett"]], /* W10 */
      exits: ["labor"], amb: { loops: [["amb/a_tropfstein.mp3", 0.4], ["amb/a_grabesdroehnen.mp3", 0.3], ["amb/a_fluestern.mp3", 0.12]], one: [["n_kette_", 4, 7], ["n_stoehnen_", 8, 14], ["e_stoehnen_", 4, 20]] },
      music: "verlies", story: ["Hinter jeder Tür ein Stöhnen. Hinter manchen ein Lachen.", "Behind every door a groan. Behind some, a laugh."]
    },
    hafen: {
      tier: 2, open: "arch", flow: "through", grid: [6, 2], out: true, name: ["Der Hafen", "The Harbour"], sub: ["Stege, Taue, Möwen – und Fischaugen im Wasser", "Piers, ropes, gulls – and fish eyes in the water"],
      sky: ["#0c0a14", "#24162a", "#4a2a38"], wall: "#2c2620", brick: "#1c1812",
      tile: { base: "#4a4038", light: "#7a6a56", dark: "#201a16", det: "#5a4e40", top: "wood", topCol: "#6a4e30" }, plat: "#7a5634",
      dark: 0.4, ambCol: "#2a2a3a", bg: "harbour", weather: ["drizzle", "fog", "gulls"], hazard: "water",
      props: { barrel: 3, crate: 3, rope: 3, net: 2, anchor: 1, lantern: 3, mast: 1, sack: 2 },
      foes: { kuotoa: 4, kuotoaSpeer: 2, soeldner: 2, goblinBombe: 2, ratte: 1, robeArmbrust: 1, schmuggler: 2, grindylow: 1 }, density: 1, pits: 0.45,
      squads: [["schmuggler", "schmuggler", "kuotoaSpeer"], ["kuotoa", "kuotoa", "grindylow"], ["soeldner", "robeArmbrust", "goblinBombe"]], /* W10 */ /* weniger Löcher: der Hafen war schwerer als sein Boss */
      exits: ["erzpriesterin"], amb: { loops: [["amb/a_hafen.mp3", 0.4], ["amb/a_wellen1.mp3", 0.4]], one: [["e_moewe_", 10, 9], ["n_knarren_", 8, 7], ["e_platsch_", 4, 12]] },
      music: "hafen", story: ["Der Hafen der Feste. Die Stege sind nass. Nicht nur vom Regen.", "The keep's harbour. The piers are wet. Not only from rain."]
    },
    glocken: {
      tier: 2, open: "arch", flow: "up", grid: [3, 5], name: ["Der Glockenturm", "The Bell Tower"], sub: ["Zahnräder, Seile und ein Wachturm in den Sternen", "Gears, ropes and a watchtower among the stars"],
      sky: ["#0c0a14", "#1c1426", "#2c1e2a"], wall: "#2e2622", brick: "#1e1814",
      tile: { base: "#544640", light: "#86705e", dark: "#231a18", det: "#665448", top: "none", topCol: "#000" }, plat: "#7a5432",
      dark: 0.5, ambCol: "#3a2a2a", bg: "belltower", weather: ["dust", "feathers"], hazard: "spikes",
      props: { gear: 4, rope: 3, bell: 2, torch: 2, window: 3, crate: 1, beam: 3 },
      foes: { stirge: 3, goblinBogen: 2, soeldner: 2, drowSchuetze: 2, drowWache: 2, wolf: 1, glockengeist: 1, kenku: 1 }, density: 1,
      squads: [["drowWache", "drowSchuetze", "drowSchuetze"], ["kenku", "kenku", "goblinBogen"], ["soeldner", "soeldner", "drowSchuetze"]], /* W10 */
      exits: ["wachturm"], amb: { loops: [["amb/a_uhr.mp3", 0.35], ["amb/a_ruinenwind.mp3", 0.3]], one: [["e_glocke_", 3, 28], ["n_knarren_", 8, 9], ["n_fledermaus_", 8, 12]] },
      music: "glocken", story: ["Ganz oben schlägt die Glocke. Nur hat sie keinen Klöppel mehr.", "At the very top the bell tolls. Only it has no clapper anymore."]
    },
    schlund: {
      tier: 4, open: "cave", flow: "down", grid: [3, 5], name: ["Der Spinnenschlund", "The Spider Chasm"], sub: ["Netze dick wie Taue, Pilzlicht und Kokons", "Webs thick as ropes, mushroom light and cocoons"],
      sky: ["#0c0812", "#1a1024", "#2a1838"], wall: "#221a28", brick: "#150f1a",
      tile: { base: "#3e3446", light: "#6a5a72", dark: "#160f1a", det: "#4e4258", top: "web", topCol: "#c8c0d0" }, plat: "#d8d0dc",
      dark: 0.72, ambCol: "#3a1a4a", bg: "chasm", weather: ["spores", "dust"], hazard: "spikes", webPlat: true,
      props: { web: 5, mushroom: 5, cocoon: 3, bones: 2, crystal: 1, skull: 1 },
      foes: { riesenspinne: 2.5, netzspinne: 2.5, ettercap: 2.5, spinnchen: 0.85, schatten: 1, brutsack: 1, myconid: 2.2, drider: 1.2, stirge: 0.7 }, density: 1.05, /* W38 Gegner: Gewichte (vorher 3,3,2,3,1,1,2,1); Stirge hinten angehängt – Schatten war der einzige Flieger (21 % aller Gegner) */
      squads: [["drider", "netzspinne"], ["myconid", "riesenspinne", "ettercap"], ["ettercap", "netzspinne", "riesenspinne"]], /* W10 */
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
      foes: { ruestung: 1.6, runenfunke: 1.5, runenwaechter: 1.5, duergar: 1.6, duergarArmbrust: 0.5, schmiedegeist: 1.8, rostmonster: 1.4 }, density: 1, /* W38 Gegner: Gewichte (vorher 3,3,1,2,2,1,1) */
      squads: [["ruestung", "duergarArmbrust", "duergarArmbrust"], ["rostmonster", "duergar", "duergarArmbrust"], ["runenwaechter", "duergarArmbrust"]], /* W10 */
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
      foes: { mane: 0.5, stirge: 2.5, harpyie: 2.2, nadelBlight: 2.2, zweigBlight: 0.35, drowSchuetze: 1.6, quasit: 2.2, gargoyle: 1.2 }, density: 1, /* W38 Gegner: Gewichte (vorher 3,3,2,2,2,1,2,1) – Manen-/Zweigschwärme 64 % */
      squads: [["nadelBlight", "zweigBlight", "zweigBlight"], ["drowSchuetze", "mane", "mane"]], /* W10 */
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
      foes: { kuotoa: 3, kuotoaSpeer: 2, peitscher: 2, rochen: 3, ertrunkener: 2, krabbe: 2, grindylow: 2, myconid: 1 }, density: 1.05,
      squads: [["peitscher", "kuotoa", "kuotoa"], ["grindylow", "ertrunkener", "krabbe"], ["myconid", "kuotoaSpeer", "kuotoa"]], /* W10 */
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
      foes: { duergar: 2.2, duergarArmbrust: 2, feuerschlucker: 2.3, glutling: 2.2, bewahrer: 2.3, magmaHund: 1.7, salamander: 1.8 }, density: 1.05, /* W38 Gegner: Gewichte (vorher 3,2,2,3,2,1,2) */
      squads: [["bewahrer", "duergar", "duergar"], ["salamander", "feuerschlucker", "glutling"], ["duergarArmbrust", "duergarArmbrust", "magmaHund"], ["feuerschlucker", "glutfledermaus", "glutfledermaus", "glutfledermaus"], ["duergar", "glutfledermaus", "glutfledermaus", "glutfledermaus"]], /* W10: Glutfledermäuse nur als Schwarm im Trupp (die Gassen haben keine Flieger-Plätze für sie allein) */
      warden: "riese", exits: ["themberchaud", "stollen"], /* W49 Kapitel: Abstieg in Buppidos Stollen */
      amb: { loops: [["amb/a_esse.mp3", 0.35], ["amb/a_markt.mp3", 0.12], ["amb/a_feuer1.mp3", 0.3]], one: [["n_hammer_", 7, 4], ["e_zischen_", 2, 8], ["e_grollen_", 2, 14]] },
      music: "glut", story: ["Hier hämmert es Tag und Nacht. Wenn es hier Tage gäbe.", "Hammering day and night. If there were days down here."]
    },
    sturm: {
      tier: 5, open: "arch", flow: "up", grid: [3, 5], out: true, name: ["Die Sturmspitze", "The Storm Spire"], sub: ["Donnerbaums Turm, Giftnebel und Blitze", "Thundertree's tower, poison mist and lightning"],
      sky: ["#081008", "#14241a", "#2a3a22"], wall: "#2a2a22", brick: "#1a1a14",
      tile: { base: "#4a4a3e", light: "#7a7a62", dark: "#1a1a12", det: "#5a5a48", top: "moss", topCol: "#4a6a2a" }, plat: "#5a4a2e",
      dark: 0.45, ambCol: "#2a4a1a", bg: "storm", weather: ["rain", "lightning", "fog"], hazard: "spikes",
      props: { vine: 4, bones: 2, banner: 2, crenel: 2, torch: 1, gargoyle: 2, rope: 1 },
      foes: { zombie: 2.4, zombieBlaeh: 2, zweigBlight: 1.1, nadelBlight: 2, rankenBlight: 2, stirge: 2, saeureschnecke: 2.2, sturmMephit: 2 }, density: 1.05, /* W38 Gegner: Gewichte (vorher 3,2,3,2,1,2,2,2) */
      squads: [["saeureschnecke", "nadelBlight", "nadelBlight"], ["rankenBlight", "zweigBlight", "zweigBlight"], ["zombieBlaeh", "zombie", "zombie"]], /* W10 */
      warden: "vrock", exits: ["venomfang"],
      amb: { loops: [["amb/a_gewitter1.mp3", 0.45], ["amb/a_regen1.mp3", 0.3]], one: [["n_donner_", 8, 11], ["e_kraehe_", 16, 12], ["n_stoehnen_", 8, 18]] },
      music: "sturm", story: ["Der Regen schmeckt nach Gift. Ganz oben schläft etwas Grünes.", "The rain tastes of poison. At the very top, something green sleeps."]
    },
    /* ---- W49 Kapitel: Buppidos Stollen (Sitzung „Das Ei des Drachen“) – Tunnel unter Gracklstugh mit leuchtenden Erzadern,
       Glühpilzen, Leichenbergen; Gegner, Wächter Buppido, Schrumpf-/Wachspilze und Kulisse in stollen.js ---- */
    stollen: {
      tier: 5, open: "cave", flow: "down", grid: [3, 5], name: ["Buppidos Stollen", "Buppido's Tunnels"], sub: ["Erzadern, Glühpilze und Berge von Toten unter Gracklstugh", "Ore veins, glowing mushrooms and mountains of the dead beneath Gracklstugh"],
      sky: ["#0a0810", "#160e1c", "#21142a"], wall: "#221c26", brick: "#15111a",
      tile: { base: "#3c3640", light: "#68606c", dark: "#151018", det: "#6ae0a8", top: "drip", topCol: "#3a5a48" }, plat: "#4e4034",
      dark: 0.7, ambCol: "#2a1a3a", bg: "chasm", weather: ["spores", "drip", "dust"], hazard: "spikes",
      props: { mushroom: 5, bones: 4, skull: 3, crystal: 3, chain: 1, lantern: 1, candle: 2, pot: 1 },
      foes: { leichenskelett: 2.6, skelett: 1, duergarAlchemist: 2.2, duergarAxt: 1.6, duergar: 1.2, ghul: 1.2, myconid: 0.8, ratte: 0.8 }, density: 1.05,
      squads: [["duergarAxt", "duergarAlchemist", "duergar"], ["duergarAlchemist", "duergarAlchemist", "duergarAxt"], ["ghul", "leichenskelett", "leichenskelett"]],
      warden: "buppido", exits: ["themberchaud"],
      amb: { loops: [["amb/a_tropfstein.mp3", 0.4], ["amb/a_grabesdroehnen.mp3", 0.25], ["amb/a_fluestern.mp3", 0.15]], one: [["n_tropfen_", 1, 6], ["n_ratte_", 6, 10], ["n_stoehnen_", 8, 16]] },
      music: "stollen", story: ["Unter den Glutgassen kichert jemand. Und es riecht nach sehr vielen Toten.", "Beneath the Ember Alleys someone is giggling. And it smells of a great many dead."]
    } /* ---- Ende W49 Kapitel ---- */
  });
  /* Arenen der Bosse (handgebaut) */
  const ARENAS = (Z.ARENAS = {
    labor: { tier: 3, boss: "glasstab", name: ["Glasstabs Labor", "Glasstaff's Laboratory"], base: "verlies", exits: ["schlund", "schmiede"], music: "boss1", w: 46, h: 18, kind: "lab" },
    erzpriesterin: { tier: 3, boss: "erzpriesterin", name: ["Der Tempelsteg", "The Temple Pier"], base: "hafen", exits: ["schlund", "schmiede", "zinnen"], music: "boss1", w: 48, h: 18, kind: "pier" },
    wachturm: { tier: 3, boss: "bugbear", name: ["Der Wachturm", "The Watchtower"], base: "glocken", exits: ["schmiede", "zinnen"], music: "boss1", w: 46, h: 18, kind: "tower" },
    demogorgon: { tier: 6, boss: "demogorgon", final: "tiefe", name: ["Das Herz des Sees", "The Heart of the Lake"], base: "see", exits: [], music: "final", w: 44, h: 20, kind: "lakeboss" },
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
      "..........----..........",
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
      "........................",
      "..............E.........",
      "............######......",
      "...E....################",
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
      "######--------------####",
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
      "###H###############H####", /* W13: beide Leitern gehen durch den Zwischenboden (vorher versetzt: rechte Leiter brach ab) */
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
      "#......................#",
      "#......................#",
      "#.....------..------...#",
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
      "#######--#....#--#######",
      "#######..#....#..#######",
      "##########....##########"] },
    /* ---------- W13 R6: Gebietsvorlagen (bio: nur dort) – eigenes Spielgefühl je Gebiet, siehe /home/claude/test/w13_karte/r6/neue_tpl.py ---------- */
    { n: "fasslager", bio: ["keller", "hafen"], pk: true, r: [
      "########################",
      "#......................#",
      "#o.bb.....w.......bb...#",
      "####..............##...#",
      "#......----..----......#",
      "#..........F...........#",
      "#.b..................b.#",
      "#.##..--........--..##.#",
      "........................",
      "........................",
      "..E...................E.",
      "########################",
      "########################",
      "########################"] },
    { n: "weinregal", bio: ["keller"], r: [
      "##########....##########",
      "#......................#",
      "#ob.b.b...........b.b..#",
      "#-----........H...-----#",
      "#.............H........#",
      "#.....b.b.....H..b.....#",
      "#....-----....H.-----..#",
      "#.............H........#",
      "..............H.........",
      "..............H.........",
      "..E...b.b.....H....E....",
      "########################",
      "########################",
      "########################"] },
    { n: "zisterne", bio: ["keller", "verlies"], pk: true, r: [ /* W43 Gezeiten: Beckenmauern (Spalte 4/19, 2 über dem Wasser) halten die Flut – vorher lief sie über die Gehwege */
      "########################",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#...----........----...#",
      "#......................#",
      "#..........--..........#",
      "#......................#",
      "........................",
      "....#..............#....",
      "..E.#..............#.E..",
      "#####qq#qqq#qqq#qqq#####",
      "#####qq#qqq#qqq#qqq#####",
      "########################"] },
    { n: "zweigalerie", bio: ["hallen"], r: [
      "##########....##########",
      "#......................#",
      "#..w......L.......w....#",
      "#......................#",
      "#.E..................E.#",
      "#------...--..--...----#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "...E.....b....b.....E...",
      "########################",
      "########################",
      "########################"] },
    { n: "thronsaal", bio: ["hallen", "torhof"], r: [
      "########################",
      "#......................#",
      "#...w......T.......w...#",
      "#.........###..........#",
      "#.........#.#..........#",
      "#..##.............##...#",
      "#..##.....F.......##...#",
      "#..##..----..----.##...#",
      "...##.............##....",
      "...##.............##....",
      "..E##......E......##.E..",
      "#####..##.....##..######",
      "########################",
      "########################"] },
    { n: "bankett", bio: ["hallen", "keller"], r: [
      "########################",
      "#......................#",
      "#....w.....L.....w.....#",
      "#......................#",
      "#......................#",
      "#.....F................#",
      "#......................#",
      "#......................#",
      "........................",
      "...b................b...",
      "..E.----------------..E.",
      "########################",
      "########################",
      "########################"] },
    { n: "zellengang", bio: ["verlies"], r: [
      "########################",
      "#.#..#..#..#..#..#..#..#",
      "#.#.E#..#.T#..#.E#..#..#",
      "#.#--#..#--#..#--#..#..#",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#...---..........---...#",
      "........................",
      "........................",
      "..E...........k......E..",
      "########################",
      "########################",
      "########################"] },
    { n: "folterkeller", bio: ["verlies", "schmiede"], pk: true, r: [
      "##########....##########",
      "#......................#",
      "#..p..............p....#",
      "#......................#",
      "#......----..----......#",
      "#......................#",
      "#......................#",
      "#..--..............--..#",
      "........................",
      "........................",
      "..E......zzzzzz......E..",
      "########################",
      "########################",
      "########################"] },
    { n: "wagenhof", bio: ["torhof"], r: [
      "########################",
      "#......................#",
      "#......w.........w.....#",
      "#......................#",
      "#.........----.........#",
      "#......................#",
      "#...bb.............bb..#",
      "#..----...........----.#",
      "........................",
      "........................",
      "..E..bb....bbb....bb.E..",
      "########################",
      "########################",
      "########################"] },
    { n: "zugbruecke", bio: ["torhof", "wehrgang"], pk: true, r: [
      "########################",
      "#......................#",
      "#....w.............w...#",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E..................E..",
      "####mmmmmmmmmmmmmmmm####",
      "####^^^^^^^^^^^^^^^^####",
      "########################"] },
    { n: "schiessscharten", bio: ["wehrgang", "zinnen"], pk: true, r: [
      "########################",
      "#......................#",
      "#..w.......w........w..#",
      "#......................#",
      "#......................#",
      "#####..............#####",
      "#####>............<#####",
      "#####..............#####",
      "........................",
      "........................",
      "..E.......--.........E..",
      "########################",
      "########################",
      "########################"] },
    { n: "zinnenpfad", bio: ["wehrgang", "zinnen", "sturm"], r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#.....----.....----....#",
      "#......................#",
      "#..----.....F.....----.#",
      "#......................#",
      "#.......----..----.....#",
      "........................",
      "........................",
      "..E.##....##..##....##E.",
      "######..####..####..####",
      "######..####..####..####",
      "########################"] },
    { n: "wachturmtreppe", bio: ["wehrgang", "glocken", "sturm"], r: [
      "##########....##########",
      "#..........H...........#",
      "#..........H.......w...#",
      "#.....-----H----.......#",
      "#..........H...........#",
      "#..E.......H...........#",
      "#.....-----H-----......#",
      "#..........H...........#",
      "...........H............",
      "...........H............",
      "..E........H.........E..",
      "########...H...#########",
      "##########.H..##########",
      "##########....##########"] },
    { n: "windkante", bio: ["zinnen", "sturm"], pk: true, r: [
      "########################",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......................#",
      "#......cc....cc........#",
      "#......................#",
      "........................",
      "........................",
      "..E..................E..",
      "#####cc###cccc###cc#####",
      "#####AA###AAAA###AA#####",
      "#####AA###AAAA###AA#####"] },
    { n: "truemmerfeld", bio: ["sturm", "torhof"], r: [
      "########################",
      "#......................#",
      "#...........w..........#",
      "#......................#",
      "#......##..............#",
      "#.....####.....##......#",
      "#..............##......#",
      "#..##.....---......##..#",
      "...##..............##...",
      "........................",
      "..E....b.##....b.....E..",
      "########################",
      "########################",
      "########################"] },
    { n: "kai", bio: ["hafen", "see"], pk: true, r: [
      "########################",
      "#......................#",
      "#...w..............w...#",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#......----..----......#",
      "........................",
      "........................",
      "..E.bb................E.",
      "######mmmmmmmmmmmm######",
      "######~~~~~~~~~~~~######",
      "########################"] },
    { n: "stelzensteg", bio: ["hafen", "see"], r: [ /* W43 Gezeiten: Beckenrand (Spalte 4/19, 1 über dem Gehweg) hält 2 Reihen Flut */
      "########################",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#....---.......---.....#",
      "#......................#",
      "#........---...........#",
      "........................",
      "........................",
      "..E.#..............#E...",
      "#####-.--.--.--.--.#####",
      "#####qqqqqqqqqqqqqq#####",
      "########################"] },
    { n: "korallengrotte", bio: ["see", "schlund"], r: [
      "########################",
      "###....##......##....###",
      "##......................",
      "#.........F.............",
      "#....##........##.....##",
      "#...####..----.####...##",
      "#......................#",
      "#..--..............--..#",
      "........................",
      "........................",
      "..E......##..##......E..",
      "###....######.#....#####",
      "#######~~~~~~~~~########",
      "########################"] },
    { n: "tempelstufen", bio: ["see", "glut"], r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#.........####.........#",
      "#.......########.......#",
      "#......................#",
      "#.....##########.......#",
      "#....############......#",
      "........................",
      "........................",
      "..E..................E..",
      "########################",
      "########################",
      "########################"] },
    { n: "glockenstuhl", bio: ["glocken"], r: [
      "##########....##########",
      "#......................#",
      "#....p.....H......p....#",
      "#..........H...........#",
      "#..-----...H...-----...#",
      "#..........H...........#",
      "#.......---H---........#",
      "#..........H...........#",
      "...........H............",
      "...........H............",
      "..E........H.........E..",
      "########################",
      "########################",
      "########################"] },
    { n: "uhrwerk", bio: ["glocken", "schmiede"], pk: true, r: [
      "########################",
      "#......................#",
      "#...w..............w...#",
      "#......................#",
      "#....--..........--....#",
      "#......................#",
      "#........mmmmmmm.......#",
      "#......................#",
      "........................",
      "........................",
      "..E......zzzzzz......E..",
      "########################",
      "########################",
      "########################"] },
    { n: "spinnennetz", bio: ["schlund"], pk: true, r: [
      "########################",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#...---....---....---..#",
      "#......................#",
      "#......---.....---.....#",
      "........................",
      "........................",
      "..E..................E..",
      "####....----....----####",
      "####AAAAAAAAAAAAAAAA####",
      "####AAAAAAAAAAAAAAAA####"] },
    { n: "tropfsteinhoehle", bio: ["schlund", "keller"], r: [
      "########################",
      "##.#..#.##...#..##.#..##",
      "#..#....#.....#...#....#",
      "#.......F..............#",
      "#......................#",
      "#.....###......###.....#",
      "#....#####....#####....#",
      "#......................#",
      "........................",
      "........................",
      "..E......##..##......E..",
      "#####.#######.##.#######",
      "########################",
      "########################"] },
    { n: "foerderband", bio: ["schmiede"], pk: true, r: [
      "########################",
      "#......................#",
      "#....r........r........#",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E..................E..",
      "####mmmmmmmmmmmmmmmm####",
      "####~~~~~~~~~~~~~~~~####",
      "########################"] },
    { n: "schlackerinne", bio: ["schmiede", "glut"], pk: true, r: [
      "########################",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......----....----....#",
      "#......................#",
      "#..--..............--..#",
      "........................",
      "........................",
      "..E..##..........##..E..",
      "########~~~##~~~########",
      "########~~~##~~~########",
      "########################"] },
    { n: "ambosshalle", bio: ["schmiede"], r: [
      "########################",
      "#......................#",
      "#...w......p.......w...#",
      "#......................#",
      "#......................#",
      "#..---............---..#",
      "#......................#",
      "#.......##....##.......#",
      "........##....##........",
      "........................",
      "..E..b.........b.....E..",
      "########################",
      "########################",
      "########################"] },
    { n: "lavafluss", bio: ["glut"], pk: true, r: [
      "########################",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......................#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "..E..................E..",
      "####~~~###~~~###~~~#####",
      "####~~~###~~~###~~~#####",
      "########################"] },
    { n: "zisterne_o", bio: ["keller", "verlies"], pk: true, r: [
      "##########....##########",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#...----........----...#",
      "#......................#",
      "#..........--..........#",
      "#......................#",
      "........................",
      "....#..............#....",
      "..E.#..............#.E..",
      "#####qq#qqq#qqq#qqq#####",
      "#####qq#qqq#qqq#qqq#####",
      "########################"] },
    { n: "zweigalerie_u", bio: ["hallen"], r: [
      "##########....##########",
      "#......................#",
      "#..w......L.......w....#",
      "#......................#",
      "#.E..................E.#",
      "#------...--..--...----#",
      "#......................#",
      "#......................#",
      "........................",
      "........................",
      "...E.....b....b.....E...",
      "##########....##########",
      "##########....##########",
      "##########....##########"] },
    { n: "zellengang_u", bio: ["verlies"], r: [
      "########################",
      "#.#..#..#..#..#..#..#..#",
      "#.#.E#..#.T#..#.E#..#..#",
      "#.#--#..#--#..#--#..#..#",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#...---..........---...#",
      "........................",
      "........................",
      "..E...........k......E..",
      "##########....##########",
      "##########....##########",
      "##########....##########"] },
    { n: "wagenhof_o", bio: ["torhof"], r: [
      "##########....##########",
      "#......................#",
      "#......w.........w.....#",
      "#......................#",
      "#.........----.........#",
      "#......................#",
      "#...bb.............bb..#",
      "#..----...........----.#",
      "........................",
      "........................",
      "..E..bb....bbb....bb.E..",
      "########################",
      "########################",
      "########################"] },
    { n: "schiessscharten_o", bio: ["wehrgang", "zinnen"], pk: true, r: [
      "##########....##########",
      "#......................#",
      "#..w.......w........w..#",
      "#......................#",
      "#......................#",
      "#####..............#####",
      "#####>............<#####",
      "#####..............#####",
      "........................",
      "........................",
      "..E.......--.........E..",
      "########################",
      "########################",
      "########################"] },
    { n: "truemmerfeld_o", bio: ["sturm", "torhof"], r: [
      "##########....##########",
      "#......................#",
      "#...........w..........#",
      "#......................#",
      "#......##..............#",
      "#.....####.....##......#",
      "#..............##......#",
      "#..##.....---......##..#",
      "...##..............##...",
      "........................",
      "..E....b.##....b.....E..",
      "########################",
      "########################",
      "########################"] },
    { n: "stelzensteg_o", bio: ["hafen", "see"], r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#....---.......---.....#",
      "#......................#",
      "#........---...........#",
      "........................",
      "........................",
      "..E.#..............#E...",
      "#####-.--.--.--.--.#####",
      "#####qqqqqqqqqqqqqq#####",
      "########################"] },
    { n: "korallengrotte_o", bio: ["see", "schlund"], r: [
      "##########....##########",
      "###....##......##....###",
      "##......................",
      "#.........F.............",
      "#....##........##.....##",
      "#...####..----.####...##",
      "#......................#",
      "#..--..............--..#",
      "........................",
      "........................",
      "..E......##..##......E..",
      "###....######.#....#####",
      "#######~~~~~~~~~########",
      "########################"] },
    { n: "tempelstufen_u", bio: ["see", "glut"], r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#.........####.........#",
      "#.......########.......#",
      "#......................#",
      "#.....##########.......#",
      "#....############......#",
      "........................",
      "........................",
      "..E..................E..",
      "##########....##########",
      "##########....##########",
      "##########....##########"] },
    { n: "glockenstuhl_u", bio: ["glocken"], r: [
      "##########....##########",
      "#......................#",
      "#....p.....H......p....#",
      "#..........H...........#",
      "#..-----...H...-----...#",
      "#..........H...........#",
      "#.......---H---........#",
      "#..........H...........#",
      "...........H............",
      "...........H............",
      "..E........H.........E..",
      "##########....##########",
      "##########....##########",
      "##########....##########"] },
    { n: "spinnennetz_o", bio: ["schlund"], pk: true, r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#.........F............#",
      "#......................#",
      "#...---....---....---..#",
      "#......................#",
      "#......---.....---.....#",
      "........................",
      "........................",
      "..E..................E..",
      "####....----....----####",
      "####AAAAAAAAAAAAAAAA####",
      "####AAAAAAAAAAAAAAAA####"] },
    { n: "schlackerinne_o", bio: ["schmiede", "glut"], pk: true, r: [
      "##########....##########",
      "#......................#",
      "#......................#",
      "#..........F...........#",
      "#......................#",
      "#......----....----....#",
      "#......................#",
      "#..--..............--..#",
      "........................",
      "........................",
      "..E..##..........##..E..",
      "########~~~##~~~########",
      "########~~~##~~~########",
      "########################"] },
    { n: "ambosshalle_u", bio: ["schmiede"], r: [
      "########################",
      "#......................#",
      "#...w......p.......w...#",
      "#......................#",
      "#......................#",
      "#..---............---..#",
      "#......................#",
      "#.......##....##.......#",
      "........##....##........",
      "........................",
      "..E..b.........b.....E..",
      "##########....##########",
      "##########....##########",
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

  /* ======================= GRÖSSERE KARTEN =======================
     Jedes Gebiet hat jetzt 2–3× so viele Räume wie früher, der Hauptweg zum Ausgang ist aber nur etwa 1,5× so lang.
     Der Rest sind Nebenzweige: Türme nach oben, Keller nach unten, Seitenflügel und Schleifen zurück zum Hauptweg.
     Jede Sackgasse endet in einer Belohnung oder einer Abkürzung (siehe plan() unten und erkundung.js).
     grid: Raster in Räumen · fill: Anteil der freien Rasterzellen, die zu Nebenräumen werden · arm: längster Zweig
     wig: Neigung des Hauptwegs zu Stockwerkswechseln · lat: seitliche Schritte je Stockwerk (Tiefen/Höhen) */
  const LAYOUT = (Z.LAYOUT = {
    torhof: { grid: [6, 3], fill: 0.62, arm: 2, wig: 0.2, len: 6, gentle: true, ex: [0.9, 1.1] }, /* sanfter Einstieg: kleiner, kurze Zweige */
    keller: { grid: [5, 6], fill: 0.8, arm: 4, lat: 2 },
    hallen: { grid: [8, 4], fill: 0.8, arm: 4, wig: 0.25, len: 7 },
    wehrgang: { grid: [5, 6], fill: 0.8, arm: 4, lat: 2, ex: [0.4, 0.7] },
    verlies: { grid: [6, 7], fill: 0.8, arm: 4, lat: 2 },
    hafen: { grid: [9, 4], fill: 0.8, arm: 4, wig: 0.3 }, /* nur ein Ausgang: der Hauptweg führt durchs ganze Gebiet */
    glocken: { grid: [6, 7], fill: 0.8, arm: 4, lat: 2 },
    schlund: { grid: [6, 6], fill: 0.82, arm: 4, lat: 1 },
    schmiede: { grid: [8, 4], fill: 0.82, arm: 4, wig: 0.25, len: 7 },
    zinnen: { grid: [6, 6], fill: 0.82, arm: 4, lat: 1, ex: [0.55, 0.85] },
    see: { grid: [6, 7], fill: 0.85, arm: 5, lat: 2 },
    glut: { grid: [9, 4], fill: 0.85, arm: 5, wig: 0.3 },
    sturm: { grid: [6, 7], fill: 0.85, arm: 5, lat: 2 },
    stollen: { grid: [6, 6], fill: 0.84, arm: 4, lat: 1 } /* W49 Kapitel */
  });
  for (const id in LAYOUT) if (BIOMES[id]) { BIOMES[id].grid0 = BIOMES[id].grid; BIOMES[id].grid = LAYOUT[id].grid; }

  /* ======================= SCHLEIFEN =======================
     Das Schloss soll sich wie ein Gebäude anfühlen, durch das man streifen kann – nicht wie ein Baum aus Sackgassen.
     Benachbarte Räume, die im Wegenetz weit auseinander liegen, bekommen einen Durchgang: nebeneinander eine Tür bzw.
     ein Durchbruch, übereinander ein Treppenhaus mit Leiter. Bevorzugt werden die Enden langer Zweige und Räume, von
     denen der Weg zurück zum Hauptweg ein großer Umweg wäre. Ein Teil der Sackgassen bleibt (kurz, mit Lohn: Truhe,
     Schrein, Prüfung, Runenkammer); Hauptweg-Räume werden nicht untereinander kurzgeschlossen, Wege nach vorn auf den
     Hauptweg bleiben Gittertore mit Hebel (wie in growBranches). */
  function addLoops(R, cells, gw, gh, lay, conn, key) {
    const D4 = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
    const live = () => Object.keys(cells).map(k => cells[k]).filter(c => c.kind !== "secret");
    const nbs = c => { const out = []; for (const s2 in D4) { const v = c.need[s2]; if (!v || v === "X") continue; const o = cells[key(c.x + D4[s2][0], c.y + D4[s2][1])]; if (o && o.kind !== "secret") out.push(o); } return out; };
    const bfs = a => { const d = new Map([[a, 0]]), q = [a]; for (let h = 0; h < q.length; h++) { const c = q[h]; for (const o of nbs(c)) if (!d.has(o)) { d.set(o, d.get(c) + 1); q.push(o); } } return d; };
    const isLeaf = c => c.kind !== "path" && nbs(c).length === 1;
    /* Länge der Sackgasse, an deren Ende c liegt */
    const armLen = c => { let n = 1, prev = c, cur = nbs(c)[0]; while (cur && cur.kind !== "path" && nbs(cur).length === 2 && n < 30) { const nx = nbs(cur).find(o => o !== prev); prev = cur; cur = nx; n++; } return n; };
    /* W13: Räume auf einem Rundweg zählen (Brücken im Raumgraphen, Tarjan) – Schleifen werden nach Gewinn gewählt:
       wie viele Räume danach auf einem Rundweg liegen. So wird aus einem langen Zweig eine Runde, und am Ende bleibt
       höchstens eine kurze Belohnungs-Nische (ein Raum) statt eines langen Sackgassen-Schlauchs. */
    const onCycle = () => {
      const cs = live(), disc = new Map(), low = new Map(), br = new Set(); let tm = 0;
      const ek = (u, v) => (u.x * 97 + u.y < v.x * 97 + v.y ? key(u.x, u.y) + "|" + key(v.x, v.y) : key(v.x, v.y) + "|" + key(u.x, u.y));
      const dfs = (u, pe) => {
        disc.set(u, tm); low.set(u, tm); tm++;
        for (const v of nbs(u)) {
          if (!disc.has(v)) { dfs(v, u); low.set(u, Math.min(low.get(u), low.get(v))); if (low.get(v) > disc.get(u)) br.add(ek(u, v)); }
          else if (v !== pe) low.set(u, Math.min(low.get(u), disc.get(v)));
        }
      };
      for (const c of cs) if (!disc.has(c)) dfs(c, null);
      let n = 0; for (const c of cs) if (nbs(c).some(v => !br.has(ek(c, v)))) n++;
      return n;
    };
    /* Länge des Hauptwegs über offene Durchgänge (Gittertore zählen nicht – die öffnet man erst von der Zweigseite) */
    const pathCs = Object.keys(cells).map(k => cells[k]).filter(c => c.kind === "path").sort((p, q) => p.idx - q.idx);
    const st0 = pathCs[0], en0 = pathCs[pathCs.length - 1];
    const openDist = () => { const d = new Map([[st0, 0]]), q = [st0]; for (let h = 0; h < q.length; h++) { const c = q[h]; for (const s2 in D4) { if (c.need[s2] !== true) continue; const o = cells[key(c.x + D4[s2][0], c.y + D4[s2][1])]; if (o && !d.has(o)) { d.set(o, d.get(c) + 1); q.push(o); } } } return d.get(en0); };
    const len0 = openDist();
    const all0 = live(), leaves0 = all0.filter(isLeaf).length;
    /* lohnende Sackgassen behalten (dort liegen Truhen, Schrein, Prüfung, Schatzkammer) – aber keine langen Schläuche */
    const keepLeaves = Math.max(3, Math.ceil(leaves0 * (lay.gentle ? 0.75 : 0.62)));
    const want = Math.max(1, Math.round(all0.length * (lay.gentle ? 0.12 : 0.25)));
    let made = 0;
    for (let round = 0; round < want * 3 && made < want; round++) {
      const cs = live(), leaves = cs.filter(isLeaf).length, cand = [], base = onCycle();
      for (const a of cs) {
        const da = bfs(a);
        for (const s2 of ["R", "D"]) {
          const b = cells[key(a.x + D4[s2][0], a.y + D4[s2][1])];
          if (!b || b.kind === "secret" || a.need[s2]) continue;
          /* zwei Hauptweg-Räume, die im Weg weit auseinander liegen: Gittertor als Abkürzung zurück (Hebel im späteren
             Raum; senkrecht nur, wenn der spätere oben liegt – dann eine Falltür in seinem Boden) */
          let gate = false;
          if (a.kind === "path" && b.kind === "path") {
            const hi = a.idx > b.idx ? a : b, lo = hi === a ? b : a;
            if (hi.idx - lo.idx < 3 || lo.gate || hi.gate || (s2 === "D" && hi !== a)) continue;
            gate = "pp";
          }
          const d = da.get(b); if (d != null && d < 3) continue; /* schon nah verbunden: kein Gewinn */
          const la = isLeaf(a), lb = isLeaf(b);
          if ((la || lb) && leaves <= keepLeaves && !(la && lb)) continue; /* genug lohnende Sackgassen behalten */
          if ((la && armLen(a) < 2) || (lb && armLen(b) < 2)) continue; /* kurze Sackgassen (ein Raum) bleiben: dort liegt der Lohn */
          /* Hauptweg-Anschluss: nach vorn nur waagrecht als Gittertor (Zweigseite öffnet), nach hinten offen */
          const side = gate ? null : a.kind === "path" ? b : b.kind === "path" ? a : null, pc = side ? (side === a ? b : a) : null;
          if (side) {
            const ri = side.root ? side.root.idx : 0;
            /* nach vorn: waagrecht ein Gittertor, senkrecht eine Falltür im Boden des Zweigraums darüber */
            if (pc.idx > ri + 1) { if ((s2 === "D" && a !== side) || pc.gate) continue; gate = true; }
          }
          /* Gewinn: Räume, die danach auf einem Rundweg liegen; offene Schleifen dürfen den Hauptweg nicht abkürzen */
          const o2 = { R: "L", D: "U" }[s2], va = a.need[s2], vb = b.need[o2];
          a.need[s2] = gate ? "G" : true; b.need[o2] = gate ? "G" : true;
          const gain = onCycle() - base, len1 = gate ? len0 : openDist();
          if (va === undefined) delete a.need[s2]; else a.need[s2] = va;
          if (vb === undefined) delete b.need[o2]; else b.need[o2] = vb;
          if (len0 != null && len1 != null && len1 < len0 - 1) continue;
          let w = 0.6 + Math.max(0, gain) * 1.1 + (d == null ? 6 : Math.min(8, d)) * 0.25;
          if (la) w += 1 + armLen(a) * 0.5; if (lb) w += 1 + armLen(b) * 0.5;
          if ((la || lb) && gain < 3) w *= 0.5; /* lieber den vorletzten Raum anschließen: die Nische mit Lohn bleibt */
          if (s2 === "D") w *= 0.6; /* Treppenhäuser etwas seltener als Türen */
          /* Räume mit nur waagrechten Durchgängen (links + rechts) bleiben möglichst so: dort passen die Parcours-Räume (Fähre, Sägewerk …) */
          if (s2 === "D" && [a, b].some(c => c.need.L && c.need.R && !c.need.U && !c.need.D)) w *= 0.3;
          if (gate) w *= 0.5;
          cand.push({ a, b, s2, gate, w: w * w });
        }
      }
      if (!cand.length) break;
      let sum = 0; cand.forEach(c => (sum += c.w)); let pk = R() * sum, ch = cand[0]; for (const c of cand) { pk -= c.w; if (pk <= 0) { ch = c; break; } }
      if (ch.gate) { const br = ch.gate === "pp" ? (ch.a.idx > ch.b.idx ? ch.a : ch.b) : ch.a.kind === "path" ? ch.b : ch.a; conn([ch.a.x, ch.a.y], [ch.b.x, ch.b.y], "G"); br.gate = true; }
      else conn([ch.a.x, ch.a.y], [ch.b.x, ch.b.y]);
      ch.a.loop = ch.b.loop = true; made++;
    }
  }

  /* Erzeugt den Hauptweg durch das Raumraster je nach Richtung des Gebiets */
  function makePath(R, gw, gh, flow, lay) {
    const path = [], has = (x, y) => path.some(p => p[0] === x && p[1] === y);
    lay = lay || {};
    if (flow === "through") {
      /* Start auf mittlerer Höhe, damit über und unter dem Hauptweg Platz für Türme und Keller bleibt */
      let x = lay.gentle ? 0 : R.int(0, 1), y = gh > 2 ? R.int(1, gh - 2) : R.int(0, gh - 1); path.push([x, y]);
      const wig = lay.wig != null ? lay.wig : 0.3, len = lay.len || gw;
      /* der Hauptweg endet nach len Räumen – der Rest des Rasters gehört den Nebenzweigen */
      while (x < gw - 1 && path.length < len) {
        if (gh > 1 && R.chance(wig)) {
          /* am Rand eher zur Mitte zurück */
          let dy = R.chance(0.5) ? 1 : -1; if (y + dy < 0 || y + dy >= gh || (gh > 2 && (y + dy === 0 || y + dy === gh - 1) && R.chance(0.6))) dy = -dy;
          const ny = U.clamp(y + dy, 0, gh - 1);
          if (ny !== y && !has(x, ny)) { y = ny; path.push([x, y]); continue; }
        }
        x++; path.push([x, y]);
      }
    } else {
      const down = flow === "down", lat = lay.lat != null ? lay.lat : 2;
      let y = down ? 0 : gh - 1, x = R.int(0, gw - 1); path.push([x, y]);
      const end = down ? gh - 1 : 0;
      while (y !== end) {
        const steps = R.int(0, lat);
        let dir = R.chance(0.5) ? 1 : -1;
        /* bei breiten Rastern lieber zur Mitte zurück */
        if (gw >= 5 && (x <= 0 || x >= gw - 1)) dir = x <= 0 ? 1 : -1;
        for (let s = 0; s < steps; s++) {
          let nx = x + dir; if (nx < 0 || nx >= gw) { dir = -dir; nx = x + dir; }
          if (nx < 0 || nx >= gw || has(nx, y)) break;
          x = nx; path.push([x, y]);
        }
        y += down ? 1 : -1; path.push([x, y]);
      }
      /* letzter Raum: etwas seitlich gehen, damit der Ausgangsraum Platz hat */
      if (R.chance(0.5)) { const nx = x + (x < gw / 2 ? 1 : -1); if (nx >= 0 && nx < gw) { x = nx; path.push([x, y]); } }
    }
    return path;
  }

  /* Nebenzweige wachsen lassen: vom Hauptweg (oder einem Zweig) aus Ketten von Räumen in freie Rasterzellen –
     senkrecht bevorzugt (Türme, Keller), sonst seitlich (Flügel). Am Ende eines Zweigs manchmal eine Schleife
     zurück: zu einem anderen Zweig offen, zum späteren Hauptweg als Gittertor, das sich nur von der Zweigseite
     per Hebel öffnen lässt (Abkürzung). Danach ein paar geheime Kammern hinter rissigen Wänden. */
  function growBranches(R, cells, gw, gh, lay, conn, key, tier) {
    const inb = (x, y) => x >= 0 && y >= 0 && x < gw && y < gh;
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const freeNb = c => N4.map(([dx, dy]) => [c.x + dx, c.y + dy]).filter(([x, y]) => inb(x, y) && !cells[key(x, y)]);
    let nFree = 0; for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (!cells[key(x, y)]) nFree++;
    const nSecret = Math.min(3, Math.max(1, Math.round(nFree * 0.08)));
    const target = Math.max(2, Math.round(nFree * (lay.fill != null ? lay.fill : 0.8)) - nSecret);
    /* W13 R23 (Nutzerwunsch: weniger lange Sackgassen-Wege): Zweige um einen Raum kürzer (mind. 2) – gleiche Füllung, also mehr, aber kürzere Zweige */
    const maxArm = Z.armKuerzer !== true ? (lay.arm || 4) : Math.max(2, (lay.arm || 4) - 1); /* R23: kürzere Zweige vorerst aus (mehr Sackgassen 108→148) – mit Z.armKuerzer = true einschaltbar */
    let added = 0, armId = 0, guard = 0;
    while (added < target && guard++ < 400) {
      const anchors = [];
      for (const k in cells) {
        const c = cells[k]; if (c.kind === "secret") continue;
        const fn = freeNb(c); if (!fn.length) continue;
        /* lieber vom Hauptweg abzweigen, tiefe Zweige nur selten weiter verlängern */
        anchors.push({ c, fn, w: c.kind === "path" ? 3 : 1.4 / (1 + c.depth * (Z.flacheZweige === true ? 1.6 : 0.6)) * (Z.armKuerzer === true && !lay.gentle && c.depth >= 2 ? 0.35 : 1) }); /* R23: Ketten ab Tiefe 2 seltener verlängern */ /* W13 R22: Z.flacheZweige (nur Versuch, aus): brachte kaum kürzere Rückwege und 2 Torhof-Karten mit Ausgang nur per Maximalsprung */
      }
      if (!anchors.length) break;
      let sum = 0; anchors.forEach(a => (sum += a.w));
      let pk = R() * sum, a = anchors[0]; for (const a2 of anchors) { pk -= a2.w; if (pk <= 0) { a = a2; break; } }
      /* erste Richtung: senkrecht bevorzugt */
      const dirs = a.fn.map(([x, y]) => ({ x, y, w: y !== a.c.y ? 1.8 : 1 }));
      let s2 = 0; dirs.forEach(d => (s2 += d.w)); let pd = R() * s2, d0 = dirs[0]; for (const d of dirs) { pd -= d.w; if (pd <= 0) { d0 = d; break; } }
      let dx = d0.x - a.c.x, dy = d0.y - a.c.y, cur = a.c;
      const len = Math.min(target - added, R.int(1, maxArm)), arm = [];
      const root = a.c.kind === "path" ? a.c : a.c.root;
      for (let st = 0; st < len; st++) {
        let nx = cur.x + dx, ny = cur.y + dy;
        if (!inb(nx, ny) || cells[key(nx, ny)]) {
          const fn = freeNb(cur); if (!fn.length) break;
          const [fx, fy] = R.pick(fn); dx = fx - cur.x; dy = fy - cur.y; nx = fx; ny = fy;
        }
        const c = { x: nx, y: ny, need: {}, kind: "side", depth: cur.depth + 1, arm: armId, root, parent: cur };
        cells[key(nx, ny)] = c; conn([cur.x, cur.y], [nx, ny]); arm.push(c); cur = c; added++;
        /* Türme und Keller laufen meist gerade weiter, Flügel biegen öfter ab */
        if (R.chance(dy ? 0.25 : 0.4)) { const fn = freeNb(cur); if (fn.length) { const [fx, fy] = R.pick(fn); dx = fx - cur.x; dy = fy - cur.y; } }
      }
      if (arm.length) {
        const end = arm[arm.length - 1];
        const nbs = N4.map(([ex, ey]) => cells[key(end.x + ex, end.y + ey)]).filter(o => o && o !== end.parent && o.arm !== armId && o.kind !== "secret");
        const cand = nbs.filter(o => o.kind !== "path" || Math.abs(o.idx - root.idx) >= 3);
        let made = false;
        if (cand.length && R.chance(0.5)) {
          const o = R.pick(cand);
          /* Abkürzung nach vorn auf den Hauptweg: Gittertor (waagrecht), sonst offene Schleife */
          if (o.kind === "path" && o.idx > root.idx && (o.y === end.y || o.y === end.y + 1)) { conn([end.x, end.y], [o.x, o.y], "G"); end.gate = true; made = true; }
          else if (o.kind !== "path" || o.idx < root.idx) { conn([end.x, end.y], [o.x, o.y]); made = true; }
        }
        /* W13 R21: lange Zweige (≥ 3 Räume), deren Ende NEBEN oder ÜBER einem späteren Hauptweg-Raum liegt, bekommen immer ein Gittertor
           mit Hebel auf der Zweigseite – eine Einbahn-Tür zurück auf den Hauptweg (ohne zusätzliche Zufallszüge: übrige Karte bleibt gleich) */
        if (!made && Z.mehrTore !== false && (end.depth || 0) >= 3) {
          /* W13 R22 (Nutzerwunsch: wenige Sackgassen): Vorrang 1) späterer Hauptweg daneben/darunter → Gittertor, 2) Hauptweg darüber →
             Falltür mit Leiter, die sich vom Zweig aus öffnet, 3) früherer Hauptweg oder ein anderer Zweig → offene Schleife */
          const o = nbs.find(q => q.kind === "path" && q.idx >= root.idx && (q.y === end.y || q.y === end.y + 1));
          const oben = !o && nbs.find(q => q.kind === "path" && q.idx >= root.idx && q.y === end.y - 1);
          const offen = !o && !oben && (nbs.find(q => q.kind === "path") || nbs.find(q => q.kind === "side" && q.root && q.root.idx >= root.idx));
          if (o) { conn([end.x, end.y], [o.x, o.y], "G"); end.gate = true; }
          else if (oben) { conn([end.x, end.y], [oben.x, oben.y], "G"); end.gate = true; end.gateUnten = true; }
          else if (offen) conn([end.x, end.y], [offen.x, offen.y]);
        }
      }
      armId++;
    }
    /* W13 R22: zweiter Durchgang, wenn alle Zweige stehen – jetzt sind die Nachbarn bekannt (beim Wachsen fehlten sie noch in 2 von 3 Fällen).
       Tiefe Zweigenden (≥ 3 Nebenräume) ohne zweiten Ausgang bekommen einen Rückweg nach vorn: Gittertor zum späteren Hauptweg (daneben/darunter
       bzw. Falltür hinauf), sonst eine offene Verbindung zu einem Nachbarzweig, der näher am Hauptweg liegt. */
    if (Z.mehrTore !== false) {
      const offenN = c => ["L", "R", "U", "D"].filter(s2 => c.need[s2]).length;
      const kidsOf = new Map(); for (const k in cells) { const c = cells[k]; if (c.parent) { if (!kidsOf.has(c.parent)) kidsOf.set(c.parent, []); kidsOf.get(c.parent).push(c); } }
      for (const k in cells) {
        const end = cells[k]; if (end.kind !== "side" || (end.depth || 0) < 3 || offenN(end) >= 2 || (kidsOf.get(end) || []).some(q => q.kind === "side")) continue;
        const root = end.root; if (!root) continue;
        const nbs = N4.map(([ex, ey]) => cells[key(end.x + ex, end.y + ey)]).filter(o => o && o !== end.parent && o.kind !== "secret");
        const o = nbs.find(q => q.kind === "path" && q.idx >= root.idx && (q.y === end.y || q.y === end.y + 1));
        const oben = !o && nbs.find(q => q.kind === "path" && q.idx >= root.idx && q.y === end.y - 1);
        const nah = !o && !oben && nbs.filter(q => q.kind === "side" && q.root && q.root.idx >= root.idx && (q.depth || 0) < end.depth - 1).sort((a, b) => (a.depth || 0) - (b.depth || 0))[0];
        if (o) { conn([end.x, end.y], [o.x, o.y], "G"); end.gate = true; }
        else if (oben) { conn([end.x, end.y], [oben.x, oben.y], "G"); end.gate = true; end.gateUnten = true; }
        else if (nah) conn([end.x, end.y], [nah.x, nah.y]);
      }
    }
    /* Schleifen und Durchbrüche (siehe addLoops) – vor den Geheimkammern, damit diese hinter rissigen Wänden bleiben */
    addLoops(R, cells, gw, gh, lay, conn, key);
    /* geheime Kammern: an Zweigen (oder selten am Hauptweg) hinter rissigen Wänden */
    const spots = [];
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      if (cells[key(x, y)]) continue;
      /* nur waagrecht angebunden: senkrechte Geheimgänge hätten keine Leiter (hinein oder heraus käme man nicht) */
      const nb = [[1, 0], [-1, 0]].map(([ex, ey]) => cells[key(x + ex, y + ey)]).filter(o => o && o.kind !== "secret");
      if (nb.length) spots.push([x, y, nb]);
    }
    R.shuffle(spots);
    let ns = 0;
    for (const [x, y, nb] of spots) {
      if (ns >= nSecret) break;
      const side = nb.filter(o => o.kind === "side"), to = side.length && R.chance(0.8) ? R.pick(side) : R.pick(nb);
      const c = { x, y, need: {}, kind: "secret", depth: to.depth + 1, arm: to.arm != null ? to.arm : -1, root: to.kind === "path" ? to : to.root, parent: to };
      cells[key(x, y)] = c; conn([x, y], [to.x, to.y], "X"); ns++;
    }
  }

  /* ======================= RÄUME MIT FUNKTION =======================
     Das Schloss soll wie ein bewohntes Gebäude wirken: Räume bekommen eine erkennbare Funktion (Wachstube, Weinkeller,
     Bankettsaal, Bibliothek, Kapelle, Zellenblock …), logisch angeordnet (Wachstube am Eingang, Küche neben dem
     Speisesaal, Kapelle und Gemächer oben, Lager und Ställe unten). Die Ausstattung richtet sich danach (ausstattung.js),
     beim ersten Betreten erscheint dezent der Raumname, die Karte zeigt ein Zeichen (ebenen.js).
     Felder: n Name [de,en] · m höchstens so viele · lage: start (nah am Eingang), oben, unten, weit (großer Boden),
     ende (Sackgasse), neben: [Typ…] (direkt verbunden) · col Kartenfarbe (kein Blau) · ico Zeichen auf der großen Karte.
     Hindernis-Parcoursräume bekommen keine Funktion (dort hängt man nicht den Braten auf). */
  const RF = (n, en, m, lage, col, ico, neben) => ({ n: [n, en], m, lage: lage || "", col, ico, neben: neben || [] });
  const ROOMFN = (Z.ROOMFN = {
    torhof: { wachstube: RF("Wachstube", "Guardroom", 1, "start", "#c8a060", "W"), stall: RF("Stall", "Stable", 2, "unten weit", "#a08050", "S"),
      unterstand: RF("Schmiede-Unterstand", "Smithy shed", 1, "", "#d0804a", "A", ["stall"]), uebungsplatz: RF("Übungsplatz", "Training yard", 1, "weit", "#b0a070", "Ü"),
      schuppen: RF("Vorratsschuppen", "Storage shed", 1, "ende", "#9a8060", "V") },
    keller: { kueche: RF("Küche", "Kitchen", 1, "oben weit", "#d08a4a", "K"), weinkeller: RF("Weinkeller", "Wine cellar", 2, "unten", "#a0404a", "W"),
      vorratskammer: RF("Vorratskammer", "Pantry", 2, "", "#b09060", "V", ["kueche"]), gesindestube: RF("Gesindestube", "Servants' hall", 1, "", "#b07a50", "G", ["kueche"]),
      brunnenkammer: RF("Brunnenkammer", "Well chamber", 1, "ende", "#8a8a70", "B") },
    hallen: { bankettsaal: RF("Bankettsaal", "Banquet hall", 2, "weit", "#d0a040", "B"), anrichte: RF("Anrichte", "Serving room", 1, "", "#c08a4a", "A", ["bankettsaal"]),
      bibliothek: RF("Bibliothek", "Library", 2, "", "#a07a50", "L"), kapelle: RF("Kapelle", "Chapel", 1, "oben", "#e0c070", "K"),
      ahnengalerie: RF("Ahnengalerie", "Ancestral gallery", 1, "weit", "#c09070", "G"), schlafgemach: RF("Schlafgemach", "Bedchamber", 2, "oben ende", "#b06070", "S"),
      ruestkammer: RF("Rüstkammer", "Armoury", 1, "start", "#a09890", "R") },
    wehrgang: { wachstube: RF("Wachstube", "Guardroom", 2, "start", "#c8a060", "W"), ruestkammer: RF("Rüstkammer", "Armoury", 1, "", "#a09890", "R", ["wachstube"]),
      geschuetzstand: RF("Geschützstand", "Gun platform", 2, "oben", "#a08070", "G"), kaserne: RF("Kaserne", "Barracks", 1, "weit", "#b08a60", "K"),
      schuetzenstand: RF("Schützenstand", "Archers' post", 1, "oben", "#b09a60", "S") },
    verlies: { waerterstube: RF("Wärterstube", "Warden's room", 2, "start", "#c8a060", "W"), zellenblock: RF("Zellenblock", "Cell block", 3, "", "#8a7a60", "Z", ["waerterstube"]),
      folterkammer: RF("Folterkammer", "Torture chamber", 2, "unten", "#b04040", "F"), gebeinhaus: RF("Gebeinhaus", "Ossuary", 1, "unten ende", "#c8c0a8", "G") },
    hafen: { lagerhaus: RF("Lagerhaus", "Warehouse", 2, "weit", "#b09060", "L"), bootsschuppen: RF("Bootsschuppen", "Boathouse", 1, "unten weit", "#8a7050", "B"),
      taverne: RF("Taverne", "Tavern", 1, "", "#d08a4a", "T"), fischerkate: RF("Fischerkate", "Fisher's hut", 2, "", "#a0a070", "F", ["bootsschuppen"]),
      zollstube: RF("Zollstube", "Customs office", 1, "start", "#c8a060", "Z") },
    glocken: { glockenstube: RF("Glockenstube", "Bell chamber", 2, "oben", "#d0a040", "G"), uhrwerk: RF("Uhrwerk", "Clockwork", 2, "", "#b09060", "U", ["glockenstube"]),
      uhrmacher: RF("Uhrmacherwerkstatt", "Clockmaker's workshop", 1, "", "#c08a50", "W"), taubenschlag: RF("Taubenschlag", "Dovecote", 1, "oben ende", "#c8c0a8", "T"),
      seilkammer: RF("Seilkammer", "Rope room", 1, "unten", "#a08060", "S") },
    schlund: { brutkammer: RF("Brutkammer", "Brood chamber", 2, "unten", "#c8b8c8", "B"), beutelager: RF("Beutelager", "Larder of prey", 2, "ende", "#a89080", "L"),
      pilzgrotte: RF("Pilzgrotte", "Mushroom grotto", 2, "", "#c890a0", "P"), kristallhoehle: RF("Kristallhöhle", "Crystal cave", 1, "", "#c8a0e0", "K") },
    schmiede: { essenhalle: RF("Essenhalle", "Forge hall", 1, "weit", "#e08040", "E"), giesserei: RF("Gießerei", "Foundry", 1, "", "#d06030", "G", ["essenhalle"]),
      erzlager: RF("Erzlager", "Ore store", 2, "unten", "#a08070", "L", ["giesserei"]), waffenkammer: RF("Waffenkammer", "Weapon store", 1, "ende", "#b0a090", "W"),
      runenkammer: RF("Runenkammer", "Rune chamber", 1, "oben", "#c890ff", "R") },
    zinnen: { geschuetzstand: RF("Geschützstand", "Gun platform", 2, "oben", "#a08070", "G"), wehrturm: RF("Wehrturm", "Defence tower", 2, "", "#b09a70", "T"),
      speiergalerie: RF("Speiergalerie", "Gargoyle gallery", 1, "weit", "#c0a890", "S") },
    see: { tempel: RF("Versunkener Tempel", "Sunken temple", 1, "unten weit", "#c87a8a", "T"), opferstaette: RF("Opferstätte", "Offering place", 1, "ende", "#d08a6a", "O", ["tempel"]),
      wrackhalde: RF("Wrackhalde", "Wreck heap", 2, "", "#a08a60", "W"), korallengarten: RF("Korallengarten", "Coral garden", 2, "", "#e08a8a", "K") },
    glut: { giesserei: RF("Gießerei", "Foundry", 2, "weit", "#d06030", "G"), erzlager: RF("Erzlager", "Ore store", 2, "", "#a08070", "L", ["giesserei"]),
      schrein: RF("Duergar-Schrein", "Duergar shrine", 1, "ende", "#a8e060", "S"), schlackehalde: RF("Schlackehalde", "Slag heap", 1, "unten", "#7a5a4a", "H") },
    sturm: { kapelle: RF("Verfallene Kapelle", "Ruined chapel", 1, "oben", "#c8c090", "K"), giftgarten: RF("Giftgarten", "Poison garden", 2, "", "#a0c050", "G"),
      wachstube: RF("Verlassene Wachstube", "Abandoned guardroom", 1, "start", "#c8a060", "W"), truemmerhalle: RF("Trümmerhalle", "Rubble hall", 2, "weit", "#a09080", "T") }
  });
  /* Sonderräume aus plan()/Geheimnissen tragen ihren eigenen Namen */
  const ROOMSPEC = (Z.ROOMSPEC = { geheim: RF("Geheimkammer", "Secret chamber", 0, "", "#c890ff", "?"), schatz: RF("Schatzkammer", "Treasury", 0, "", "#ffd27a", "$"),
    grube: RF("Grubenkeller", "Pit cellar", 0, "", "#a08a70", "▾") });
  function assignRooms(lv) {
    if (!lv || !lv.cells) return;
    const defs = ROOMFN[lv.biome]; lv.roomFns = {};
    const R = Z.Rng(((lv.seed || 1) ^ 0x7ac3) >>> 0), cells = lv.cells, key = (x, y) => x + "," + y, gh = lv.gh || 1;
    const pk = new Set(TPL.filter(t => t.pk).map(t => t.n));
    const lock = new Set((lv.feats || []).filter(f => f.t === "lock").map(f => f.cell));
    const D4 = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
    const nbs = c => { const o = []; for (const s2 in D4) { const v = c.need[s2]; if (!v || v === "X") continue; const n = cells[key(c.x + D4[s2][0], c.y + D4[s2][1])]; if (n) o.push(n); } return o; };
    const free = [];
    for (const k in cells) {
      const c = cells[k]; delete c.fn;
      if (c.kind === "secret") { c.fn = "geheim"; continue; }
      if (lock.has(k)) { c.fn = "schatz"; continue; }
      if (c.pit) { c.fn = "grube"; continue; }
      if (pk.has(c.tpl) || c === lv.endCell && lv.warden) continue;
      c._sp = spotsIn(lv, c, 3, false).length; free.push(c);
    }
    if (!defs) return;
    const used = new Map();
    const score = (c, id) => {
      const d = defs[id], L = d.lage; let s = R() * 0.6;
      if (L.includes("start")) s += Math.max(0, 3 - (c.dist != null ? c.dist : 3)) * 1.6 - (c === lv.startCell ? 0.5 : 0);
      if (L.includes("oben")) s += (1 - c.y / Math.max(1, gh - 1)) * 3;
      if (L.includes("unten")) s += (c.y / Math.max(1, gh - 1)) * 3;
      if (L.includes("weit")) s += Math.min(3, (c._sp || 0) / 14);
      if (L.includes("ende")) s += nbs(c).length <= 1 ? 2 : -0.5;
      for (const o of nbs(c)) if (o.fn && d.neben.includes(o.fn)) s += 2.5;
      if ((c._sp || 0) < 6) s -= 3; /* zu wenig Boden für Möbel */
      /* Partnerräume (Küche, Bankettsaal, Essenhalle …) lieber dort, wo verbundene freie Nachbarn Platz für ihre Nebenräume lassen */
      if (partner.has(id)) s += Math.min(3, nbs(c).filter(o => !o.fn && free.includes(o) && (o._sp || 0) >= 6).length) * 0.9;
      return s;
    };
    const partner = new Set(); for (const id in defs) for (const q of defs[id].neben) partner.add(q);
    /* jede Raumart einmal, dann zweite Runde für die Mehrfach-Arten; Nachbar-Regeln greifen, weil Partner früher stehen */
    /* große Karten: von jeder Mehrfach-Art entsprechend mehr (wie ein größeres Gebäude) */
    const ids = Object.keys(defs), maxAssign = Math.ceil(free.length * 0.75), mul = Math.max(1, free.length / 12);
    const cap = id => defs[id].m > 1 ? Math.round(defs[id].m * mul) : 1;
    let n = 0;
    for (let round = 0; round < 6 && n < maxAssign; round++) {
      for (const id of ids) {
        if ((used.get(id) || 0) >= cap(id) || (round > 0 && (used.get(id) || 0) > round) || n >= maxAssign) continue;
        let best = null, bs = -1e9;
        /* Nebenräume (Vorratskammer, Anrichte, Gießerei …) zuerst direkt neben einem Partner; ab der zweiten Runde nur noch dort */
        const nb = defs[id].neben, adj = nb.length ? free.filter(c => !c.fn && nbs(c).some(o => o.fn && nb.includes(o.fn))) : [];
        const pool = adj.length ? adj : nb.length && round > 0 ? [] : free;
        for (const c of pool) { if (c.fn) continue; const v = score(c, id); if (v > bs) { bs = v; best = c; } }
        if (!best || bs < -1) continue;
        best.fn = id; used.set(id, (used.get(id) || 0) + 1); n++;
      }
    }
    for (const k in cells) { const c = cells[k]; delete c._sp; if (c.fn) lv.roomFns[k] = c.fn; }
  }
  Z.assignRooms = assignRooms;
  Z.roomFnDef = (biome, id) => (ROOMFN[biome] && ROOMFN[biome][id]) || ROOMSPEC[id] || null;
  /* ÖFFENTLICHE ABFRAGE (für Grafik, Wandschmuck, Licht, Klang …):
     Z.raumTyp(cx, cy)        → Raumtyp der Rasterzelle (Zellkoordinaten, je 24×14 Kacheln) oder null
     Z.raumTypAt(tx, ty)      → dasselbe für eine Kachelposition
     Rückgabe: { id, name: [de, en], col, ico, lage, neben, cell }  (id z. B. "kueche", "bibliothek", "zellenblock",
     Sonderräume "geheim", "schatz", "grube"). Das Feld liegt auch direkt an der Zelle: Z.level.cells["cx,cy"].fn;
     lv.roomFns = { "cx,cy": id }. Schlüsselstücke der Ausstattung tragen in Z.ausstattung() das Feld key: true. */
  Z.raumTyp = Z.raumZelle = (cx, cy) => {
    const lv = Z.level, c = lv && lv.cells && lv.cells[cx + "," + cy]; if (!c || !c.fn) return null;
    const d = Z.roomFnDef(lv.biome, c.fn); if (!d) return null;
    return { id: c.fn, name: d.n, col: d.col, ico: d.ico, lage: d.lage, neben: d.neben, cell: c };
  };
  Z.raumTypAt = (tx, ty) => Z.raumZelle(Math.floor(tx / CW), Math.floor(ty / CH));

  /* Baut eine Karte für ein Gebiet. Gibt {w,h,tiles,spawns,...} in Kacheln zurück. */
  Z.genLevel = function (biomeId, seed, opts) {
    opts = opts || {};
    let best = null, bs = 1e9;
    for (let attempt = 0; attempt < 40; attempt++) {
      const lv = tryGen(biomeId, (seed + attempt * 7919) >>> 0, opts);
      if (lv && validate(lv)) { lv.attempts = attempt + 1; if (Z.run) { const u = (Z.run._tplUse = Z.run._tplUse || {}); for (const k in lv.cells) { const t = lv.cells[k].tpl; if (t) u[t] = (u[t] || 0) + 1; } } if (!Z.noEase) ease(lv); settle(lv); plan(lv); specials(lv); if (!Z.noRuneGates) runeGates(lv); cracks(lv); tides(lv); if (!Z.noFaehrAbsatz) faehrLeitern(lv); if (!Z.noAbkuerzung) abkuerzungen(lv); unwall(lv); tideRecheck(lv); /* W43 Gezeiten */ assignRooms(lv); if (attempt < 30 && !Z.noEase && !comfyAusgaenge(lv)) continue; /* W13 R23: Ausgang nur per Maximalsprung → nächster Versuch */
        if (attempt < 30 && !Z.noFaehrPruef && !faehrSicher(lv)) continue; /* W13 R25: Fährstrecke von unten nicht betretbar – sonst Grube ohne Ausweg → nächster Versuch */ return lv; }
      /* Notfall: die beste Karte merken (alle Ausgänge erreichbar, möglichst wenige Festsitz-Stellen) */
      const sc = lv && lv.stuck ? lv.stuck.length : 1e8;
      if (lv && sc < bs) { bs = sc; best = lv; }
    }
    if (best) { settle(best); plan(best); unwall(best); assignRooms(best); return best; }
    return tryGen(biomeId, seed, opts);
  };

  /* ======================= ERKUNDUNG: Belohnungen in den Nebenzweigen =======================
     Nach der Prüfung (lv.reach steht fest): jeder Sackgasse eine Belohnung – je tiefer bzw. weiter vom Hauptweg,
     desto besser. Dazu eine verschlossene Schatzkammer mit Schlüssel aus einem anderen Zweig, eine Prüfungskammer
     (Wellen → Truhe), ein Schrein, ein Elite-Wächter vor dem besten Schatz, Hebel für die Gittertore (Abkürzungen)
     und Lichter an den Zweigmündungen. Alles als Daten in lv.rewards / lv.feats; erkundung.js erweckt es zum Leben. */
  function plan(lv) {
    if (!lv.reach || !lv.cells) return;
    const B = BIOMES[lv.biome] || {}, lay = LAYOUT[lv.biome] || {}, tier = B.tier || 0, gentle = !!lay.gentle;
    const R = Z.Rng(((lv.seed || 1) ^ 0x51ed) >>> 0), W = lv.W, cells = lv.cells, key = (x, y) => x + "," + y;
    lv.rewards = []; lv.feats = []; lv.secretsList = [];
    const all = Object.keys(cells).map(k => cells[k]);
    const exitCells = new Set(lv.doors.filter(d => d.kind === "exit").map(d => key(Math.floor(d.x / CW), Math.floor(d.y / CH))));
    const conns = c => ["L", "R", "U", "D"].filter(s => c.need[s] && c.need[s] !== "G");
    const r0 = lv.reach, b0 = lv.back, s0 = lv.stuck;
    /* Geheimkammern: Erreichbarkeit innerhalb der Kammer, sobald die rissige Wand zerschlagen ist
       (kleine Prüfung nur über diesen einen Raum, vom ersten Stehplatz hinter der Wand aus) */
    const subReach = new Map();
    const reachIn = c => {
      const k = key(c.x, c.y); if (subReach.has(k)) return subReach.get(k);
      const ox = c.x * CW, oy = c.y * CH, inBox = (x, y) => x >= ox && y >= oy && x < ox + CW && y < oy + CH;
      const g0 = lv.get, sub = { W: lv.W, H: lv.H, doors: [], get: (x, y) => { if (!inBox(x, y)) return 1; const v = g0(x, y); return v === 7 ? 0 : v; } };
      /* Einstieg: von den rissigen Kacheln aus durch Luft bis zum ersten Stehplatz */
      const seen = new Set(), q = [];
      for (let y = oy; y < oy + CH; y++) for (let x = ox; x < ox + CW; x++) if (g0(x, y) === 7) { q.push([x, y]); seen.add(x + "," + y); }
      let st = null;
      while (q.length && !st) {
        const [x, y] = q.shift();
        const v = sub.get(x, y), b = sub.get(x, y + 1);
        if ((v === 0 || v === 4) && sub.get(x, y - 1) !== 1 && (b === 1 || b === 2 || b === 8 || b === 4) && !(x === ox || x === ox + CW - 1 || y === oy)) { st = { x, y }; break; }
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const nx = x + dx, ny = y + dy, kk = nx + "," + ny; if (!inBox(nx, ny) || seen.has(kk)) continue; const w = sub.get(nx, ny); if (w === 1) continue; seen.add(kk); q.push([nx, ny]); }
      }
      let res = null;
      if (st) { sub.start = st; validate(sub); res = sub.reach; }
      subReach.set(k, res); return res;
    };
    /* Beute aus Vorlagen in Geheimkammern: liegt sie auch mit zerschlagener Wand unerreichbar, auf einen erreichbaren Platz der Kammer */
    for (const c of all) {
      if (c.kind !== "secret") continue;
      const rx = reachIn(c), inC = l => Math.floor(l.x / CW) === c.x && Math.floor(l.y / CH) === c.y;
      const ok = (x, y) => rx && (rx[y * W + x] || rx[y * W + x - 1] || rx[y * W + x + 1]);
      const sp = rx ? spotsIn(lv, c, 2, false).filter(([x, y]) => rx[y * W + x]) : [];
      lv.loot = lv.loot.filter(l => {
        if (!inC(l) || ok(l.x, l.y)) return true;
        const p = sp.find(([x, y]) => !lv.loot.some(o => o !== l && Math.abs(o.x - x) < 3 && o.y === y));
        if (!p) return false;
        l.x = p[0]; l.y = p[1]; return true;
      });
    }
    const used = [];
    const okSpot = (x, y) => !lv.doors.some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 3) && !used.some(([a, b]) => Math.abs(a - x) < 3 && Math.abs(b - y) < 2) &&
      !lv.loot.some(l => Math.abs(l.x - x) < 2 && l.y === y) && Math.abs(x - lv.start.x) + Math.abs(y - lv.start.y) > 6;
    const spotsOf = (c, head, wide) => { const rx = c.kind === "secret" ? reachIn(c) : null; return spotsIn(lv, c, head || 2, wide).filter(([x, y]) => okSpot(x, y) && (c.kind !== "secret" || (rx && rx[y * W + x]))); };
    /* Platz möglichst tief im Raum (weg von der Seite, über die man hereinkommt) */
    const deepSpot = (c, sp) => {
      if (!sp || !sp.length) return null;
      const cs = conns(c), ox = c.x * CW, oy = c.y * CH;
      const score = ([x, y]) => { let v = 0; for (const s2 of cs) v += s2 === "L" ? x - ox : s2 === "R" ? ox + CW - x : s2 === "U" ? y - oy : oy + CH - y; return v + R() * 6; };
      return sp.slice().sort((a, b) => score(b) - score(a))[0];
    };
    const take = p => { if (p) used.push(p); return p; };
    /* Wert eines Raums: Tiefe im Zweig, Geheimnis, Höhe/Tiefe gegenüber dem Hauptweg */
    const value = c => (c.depth || 0) + (c.kind === "secret" ? 1.5 : 0) + (c.root ? Math.abs(c.y - c.root.y) * 0.4 : 0) + R() * 0.3;
    all.forEach(c => (c.val = value(c)));
    const leaves = all.filter(c => c !== lv.startCell && c.kind !== "path" && !exitCells.has(key(c.x, c.y)) && conns(c).length <= 1).sort((a, b) => b.val - a.val);
    const role = new Map();
    /* --- Abkürzungen: Hebel auf der Zweigseite der Gittertore --- */
    (lv.gates || []).forEach((g, i) => {
      if (g.flut) return; /* Flutkammer (specials): Hebel gesetzt */
      const c = cells[g.branch]; if (!c) return;
      const gx = g.vert ? g.x + 1.5 : g.side < 0 ? g.x : g.x + 1;
      const sp = spotsOf(c, 2, false).filter(([x, y]) => g.vert ? Math.abs(x - gx) >= 3 && Math.abs(x - gx) <= 9 && (g.unten ? y > g.y0 + 2 && y <= g.y0 + 10 : y >= g.y0 - 6 && y < g.y0) : Math.abs(x - gx) <= 9 && Math.abs(x - gx) >= 2 && y >= g.y0 - 3 && y <= g.y0 + 4).sort((a, b) => Math.abs(a[0] - gx) - Math.abs(b[0] - gx));
      if (!sp.length) return;
      /* offen geprüft: auch mit offenem Tor darf niemand irgendwo feststecken */
      const old = g.tiles.map(([x, y]) => lv.get(x, y)); g.tiles.forEach(([x, y, v]) => lv.set(x, y, v || 0));
      const fine = validate(lv);
      g.tiles.forEach(([x, y], j) => lv.set(x, y, old[j])); lv.reach = r0; lv.back = b0; lv.stuck = s0;
      if (!fine) return;
      const p = take(sp[0]); lv.feats.push({ t: "lever", x: p[0], y: p[1], gate: i }); g.lever = true;
      lv.secretsList.push({ k: "gate", i }); role.set(c, "lever");
    });
    /* --- verschlossene Schatzkammer + Schlüssel --- */
    if (leaves.length >= 3 && R() < (gentle ? 0.45 : 0.85)) {
      const vc = leaves.filter(c => c.kind === "side" && !role.has(c) && (c.depth || 0) >= (gentle ? 1 : 2) && conns(c).length === 1 && "LR".includes(conns(c)[0]) && c.need[conns(c)[0]] === true && !(lv.out && c.y === 0));
      for (const v of vc.slice(0, 2)) {
        const side = conns(v)[0], x = side === "L" ? v.x * CW : v.x * CW + CW - 1, y0 = v.y * CH + 8;
        let ok = true; for (let y = y0; y <= y0 + 2; y++) if (lv.get(x, y) !== 0) ok = false;
        if (!ok) continue;
        const inner = spotsOf(v, 2, false).filter(([sx]) => Math.abs(sx - x) > 2);
        if (inner.length < 2) continue;
        const keyC = leaves.find(c => c !== v && !role.has(c) && c.kind === "side" && c.root !== v.root && spotsOf(c, 2, false).length) || leaves.find(c => c !== v && !role.has(c) && c.kind === "side" && Math.abs(c.x - v.x) + Math.abs(c.y - v.y) >= 2 && spotsOf(c, 2, false).length);
        if (!keyC) break;
        /* dicht? Außer der Tür darf der Rand der Kammer nirgends offen sein (keine Schächte, kein Himmel) –
           dann kann das Zumachen einer Sackgasse ohne Ausgang keinen anderen Weg abschneiden */
        const ox = v.x * CW, oy = v.y * CH, sol = (xx, yy) => { const t = lv.get(xx, yy); return t === 1 || t === 7; };
        let tight = true;
        for (let xx = ox; xx < ox + CW && tight; xx++) if (!sol(xx, oy) || !sol(xx, oy + CH - 1)) tight = false;
        for (let yy = oy; yy < oy + CH && tight; yy++) { const door = yy >= y0 && yy <= y0 + 2; if ((!(door && x === ox) && !sol(ox, yy)) || (!(door && x !== ox) && !sol(ox + CW - 1, yy))) tight = false; }
        if (!tight) continue;
        for (let y = y0; y <= y0 + 2; y++) lv.set(x, y, 1);
        role.set(v, "vault"); role.set(keyC, "key");
        const kp = take(deepSpot(keyC, spotsOf(keyC, 2, false)));
        lv.feats.push({ t: "key", x: kp[0], y: kp[1], id: 0 });
        lv.feats.push({ t: "lock", x, y0, side, cell: key(v.x, v.y), id: 0 });
        /* Schatz der Kammer: Waffe, Schmiedeglut, Gold – ab Stufe 2 auch eine Schriftrolle */
        const tre = ["waffe", "glut", "gold"]; if (tier >= 3 || R() < 0.25) tre.push("rolle"); /* Schriftrollen sparsam: Karten sind größer geworden */
        R.shuffle(inner);
        tre.forEach((k, i) => { const p = inner.find(([a, b]) => okSpot(a, b)); if (p) { take(p); lv.rewards.push({ kind: k, x: p[0], y: p[1], tier: 3, cell: key(v.x, v.y), vault: true }); } });
        lv.secretsList.push({ k: "vault", cell: key(v.x, v.y) });
        break;
      }
    }
    /* --- Prüfungskammer --- */
    if (R() < (gentle ? 0.35 : 0.7)) {
      for (const c of leaves) {
        if (role.has(c) || c.kind !== "side" || (c.depth || 0) < 1) continue;
        const sp = spotsIn(lv, c, 2, false).filter(([x, y]) => lv.reach[y * W + x]);
        if (sp.length < 16) continue;
        const ax = c.x * CW + CW / 2, p = take(sp.slice().sort((a, b) => Math.abs(a[0] - ax) - Math.abs(b[0] - ax))[0]);
        role.set(c, "trial");
        lv.feats.push({ t: "trial", x: p[0], y: p[1], cell: key(c.x, c.y), waves: gentle ? 1 : 2 + (tier >= 4 ? 1 : 0), reward: tier >= 2 && R() < 0.5 ? ["glut", "rolle"] : ["glut", "waffe"] });
        lv.secretsList.push({ k: "trial", cell: key(c.x, c.y) });
        break;
      }
    }
    /* --- Schrein (Segen) und Heilquelle --- */
    const mid = leaves.filter(c => !role.has(c));
    if (mid.length && R() < 0.8) {
      const c = mid[Math.min(mid.length - 1, Math.floor(mid.length * 0.4 + R() * mid.length * 0.3))];
      const p = take(deepSpot(c, spotsOf(c, 3, true)) || deepSpot(c, spotsOf(c, 2, false)));
      if (p) { role.set(c, "shrine"); lv.feats.push({ t: "shrine", x: p[0], y: p[1], kind: R() < 0.6 ? "segen" : "heil" }); }
    }
    /* --- übrige Sackgassen und Geheimkammern: Belohnung nach Rang --- */
    const rest = leaves.filter(c => !role.has(c) || role.get(c) === "lever");
    let nRolle = 0, nWaffe = 0;
    rest.forEach((c, i) => {
      const f = rest.length > 1 ? i / (rest.length - 1) : 0, sec = c.kind === "secret";
      let k;
      if (role.get(c) === "lever") k = R() < 0.5 ? "gold" : "heil"; /* Abkürzung ist schon Lohn genug */
      else if (f < 0.28 || sec) { k = R() < 0.5 ? "rolle" : "waffe"; if (k === "rolle" && nRolle >= (gentle ? 0 : 1)) k = "waffe"; if (k === "waffe" && nWaffe >= 2) k = "glut"; }
      else if (f < 0.62) k = R() < 0.65 ? "glut" : "segen";
      else k = R() < 0.6 ? "gold" : "heil";
      if (k === "rolle") nRolle++; if (k === "waffe") nWaffe++;
      const p = take(deepSpot(c, spotsOf(c, 2, false)));
      if (!p) return;
      lv.rewards.push({ kind: k, x: p[0], y: p[1], tier: f < 0.28 || sec ? 2 : f < 0.62 ? 1 : 0, cell: key(c.x, c.y), secret: sec });
      if (!role.has(c)) role.set(c, "reward");
      /* tiefe, wertvolle Schätze manchmal mit etwas Gold dazu */
      if ((c.depth || 0) >= 3 || sec) { const p2 = take(deepSpot(c, spotsOf(c, 2, false))); if (p2) lv.rewards.push({ kind: "gold", x: p2[0], y: p2[1], tier: 1, cell: key(c.x, c.y), secret: sec }); }
    });
    /* tiefe Zwischenräume (keine Sackgasse) bekommen ab und zu etwas Gold */
    all.forEach(c => { if (c.kind === "side" && !role.has(c) && (c.depth || 0) >= 2 && R() < 0.35) { const p = take(deepSpot(c, spotsOf(c, 2, false))); if (p) lv.rewards.push({ kind: "gold", x: p[0], y: p[1], tier: 0, cell: key(c.x, c.y) }); } });
    /* --- Elite-Wächter vor dem besten offenen Schatz (nicht im Torhof) --- */
    if (!gentle && tier >= 1) {
      const best = lv.rewards.filter(r => !r.vault && r.tier >= 2 && !r.secret).sort((a, b) => cells[b.cell].val - cells[a.cell].val)[0];
      if (best) { const c = cells[best.cell], sp = spotsOf(c, 2, false).filter(([x, y]) => Math.abs(x - best.x) >= 3 && Math.abs(x - best.x) <= 8 && Math.abs(y - best.y) <= 3); if (sp.length) lv.feats.push({ t: "guard", x: sp[0][0], y: sp[0][1], cell: best.cell }); }
    }
    /* --- Glutamboss (schmiede.js): an einer Kreuzung der Nebenzweige, sonst kurz vor dem Ausgang --- */
    if (R() < 0.75) {
      const wide = c => spotsOf(c, 3, true).filter(([x, y]) => Z.standable(lv, x + 1, y, 3) && Z.standable(lv, x + 2, y, 3));
      const junc = all.filter(c => c.kind === "side" && !role.has(c) && conns(c).length >= 3 && c.depth <= 2).sort((a, b) => a.depth - b.depth || b.dist - a.dist);
      let p = null;
      for (const c of junc) { const sp = wide(c); if (sp.length) { p = sp[Math.floor(R() * sp.length)]; break; } }
      if (!p) {
        const d = lv.doors.find(q => q.kind === "exit"), ec = d && cells[key(Math.floor(d.x / CW), Math.floor(d.y / CH))];
        if (ec) { const sp = wide(ec).filter(([x, y]) => Math.abs(x - d.x) >= 5 && Math.abs(x - d.x) <= 12 && Math.abs(y - d.y) <= 2); if (sp.length) p = sp[0]; }
      }
      if (p) { take(p); lv.feats.push({ t: "anvil", x: p[0], y: p[1] }); }
    }
    /* --- Geheimkammern zählen --- */
    all.forEach(c => { if (c.kind === "secret") lv.secretsList.push({ k: "secret", cell: key(c.x, c.y) }); });
    lv.secretsTotal = lv.secretsList.length;
    /* --- Lichter an den Zweigmündungen: je wertvoller der Zweig, desto heller --- */
    const best = new Map();
    for (const c of all) { if (c.kind === "path" || c.kind === "secret") continue; let a = c; while (a.parent && a.parent.kind !== "path") a = a.parent; const v = c.val + (role.has(c) && role.get(c) !== "reward" ? 1.5 : 0); if (!best.has(a) || best.get(a) < v) best.set(a, v); }
    for (const [a, v] of best) {
      const p = a.parent; if (!p) continue;
      let x, y;
      if (p.y === a.y) { x = Math.max(p.x, a.x) * CW + (a.x > p.x ? -2 : 1); y = a.y * CH + 7; }
      else { x = a.x * CW + 11; y = Math.max(p.y, a.y) * CH + (a.y < p.y ? 1 : -3); }
      lv.feats.push({ t: "mouth", x, y, v: +v.toFixed(2), up: a.y < p.y ? 1 : a.y > p.y ? -1 : 0 });
    }
  }
  Z.planLevel = plan;

  /* ======================= RUNENGESPERRTE ZWEIGE (Bewegungs-Runen, runen.js) =======================
     Nach plan(): ein bis drei Sackgassen werden zu Runenkammern, die nur mit einer bestimmten Bewegungs-Rune erreichbar
     sind – sichtbar angedeutet (Kratzspuren, Ösen, Aufwind, rissiger Boden, Nebelgitter, Schattenspalt), mit besonders
     guter Beute. Je nach Lage der Sackgasse:
       über dem Elternraum (Eingang unten)  → Schacht: kralle (Wände) | kette (Ösen) | schwingen (Aufwind)
       unter dem Elternraum (Eingang oben)  → erde: der Boden über dem Abstieg wird rissig (nur der Bodenstampfer bricht ihn)
       seitlich (Eingang links/rechts)      → nebel: Gitter im Durchgang | schatten: eine Kachel hoher Spalt
     Jede Kammer wird doppelt geprüft: ohne Runen bleibt alles bisher Erreichbare (Hauptweg, Ausgänge, übrige Zweige)
     erreichbar und niemand sitzt fest, die Beute der Kammer aber nicht; mit der Rune ist die Beute erreichbar und es gibt
     keinen Festsitz-Platz. Ergebnis: lv.runeGates [{kind, cell, side, tiles:[[x,y,danach]], rings, updraft, loot}],
     lv.rings, lv.updrafts; zusätzlich manchmal ein Runensockel (Belohnung „bewegung“) in einem offenen Zweig. */
  const RUNE_SHAFT = [
    "########################",
    "###...........##########",
    "###...........##########",
    "###.$..$......##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########",
    "##########....##########"
  ];
  Z.RUNE_ABIL = { kralle: { wall: 1 }, kette: {}, schwingen: { glide: 1, jump3: 1 }, erde: {}, nebel: {}, schatten: { dash: 1 } };
  function runeGates(lv) {
    if (!lv.reach || !lv.cells || !lv.rewards) return;
    const B = BIOMES[lv.biome] || {}, lay = LAYOUT[lv.biome] || {}, gentle = !!lay.gentle;
    const R = Z.Rng(((lv.seed || 1) ^ 0x7a3b1) >>> 0), W = lv.W, key = (x, y) => x + "," + y, cells = lv.cells;
    lv.runeGates = []; lv.rings = []; lv.updrafts = [];
    const exitCells = new Set(lv.doors.filter(d => d.kind === "exit" || d.kind === "entry").map(d => key(Math.floor(d.x / CW), Math.floor(d.y / CH))));
    const inC = (c, x, y) => Math.floor(x / CW) === c.x && Math.floor(y / CH) === c.y;
    const busy = c => (lv.feats || []).some(f => f.t !== "mouth" && f.t !== "shrine" && (f.cell === key(c.x, c.y) || (f.x != null && f.y != null && inC(c, f.x, f.y)) || (f.y0 != null && inC(c, f.x, f.y0))));
    const sides = c => ["L", "R", "U", "D"].filter(s2 => c.need[s2]);
    const cand = [];
    for (const k in cells) {
      const c = cells[k];
      if (c.kind !== "side" || c === lv.startCell || c === lv.endCell || exitCells.has(k) || (lv.warden && lv.warden.cell === c)) continue;
      const sd = sides(c); if (sd.length !== 1 || c.need[sd[0]] !== true) continue;
      if (busy(c)) continue;
      if (lv.out && c.y === 0) continue; /* oberste Reihe unter freiem Himmel: von oben offen */
      cand.push({ c, side: sd[0], v: (c.val || 0) + R() * 0.8 });
    }
    cand.sort((a, b) => b.v - a.v);
    let want = gentle ? (R() < 0.6 ? 1 : 0) : 1 + (R() < 0.6 ? 1 : 0) + (cand.length >= 7 && R() < 0.35 ? 1 : 0);
    const used = new Set();
    const snapshot = () => ({ reach: lv.reach, back: lv.back, stuck: lv.stuck });
    const restoreV = sn => { lv.reach = sn.reach; lv.back = sn.back; lv.stuck = sn.stuck; };
    /* lv.reach stammt aus der Prüfung vor plan() (die Schatzkammer war da noch offen): frisch rechnen als Vergleichsbasis,
       am Ende aber den alten Stand behalten und nur um die Runenkammern verkleinern – sonst ändert sich für andere Module nichts */
    const stale = snapshot();
    validate(lv); const fresh0 = lv.reach;
    for (const cd of cand) {
      if (lv.runeGates.length >= want) break;
      const c = cd.c, side = cd.side, ck = key(c.x, c.y), ox = c.x * CW, oy = c.y * CH;
      /* Reihenfolge gewichtet (seltener gelingende Arten zuerst), im selben Gebiet möglichst verschiedene */
      const wts = { kralle: 1.3, kette: 1, schwingen: 1, erde: 1, nebel: 0.8, schatten: 1.5 };
      const kinds = (side === "D" ? ["kralle", "kette", "schwingen"] : side === "U" ? ["erde"] : ["nebel", "schatten"]).map(k2 => ({ k2, w: R() * wts[k2] + (used.has(k2) ? -2 : 0) })).sort((a, b) => b.w - a.w).map(o => o.k2);
      for (const kind of kinds) {
        const g = tryRuneGate(lv, c, side, kind, R, lv.reach);
        if (g) { lv.runeGates.push(g); used.add(kind); break; }
      }
    }
    /* Endstand ohne Runen (lv.reach u. a. für Gegner, Spuren, Fallen): alter Stand minus Runenkammern */
    if (!lv.runeGates.length) restoreV(stale);
    else {
      validate(lv);
      const fin = lv.reach, out = new Uint8Array(stale.reach);
      for (let i = 0; i < out.length; i++) if (fresh0[i] && !fin[i]) out[i] = 0;
      for (const gt of lv.runeGates) { const [gx, gy] = gt.cell.split(",").map(Number); for (let y = gy * CH; y < gy * CH + CH; y++) for (let x = gx * CW; x < gx * CW + CW; x++) out[y * W + x] = 0; }
      lv.reach = out;
    }
    /* Gegenprobe mit allen Runen und offenen Sperren (nur Statistik) */
    if (lv.runeGates.length) {
      const open = []; for (const gt of lv.runeGates) for (const [x, y, v] of gt.tiles) { open.push([x, y, lv.get(x, y)]); lv.set(x, y, v); }
      const sn = snapshot();
      lv.runeAllOk = validate(lv, { wall: 1, glide: 1, jump3: 1, dash: 1, rings: lv.rings, updrafts: lv.updrafts });
      lv.runeAllStuck = (lv.stuck || []).length; { const g2 = (x, y) => lv.get(x, y); lv.runeAllStuckStand = (lv.stuck || []).filter(i => { const x = i % W, y = (i / W) | 0, b2 = g2(x, y + 1); return b2 === 1 || b2 === 2 || b2 === 7 || b2 === 8 || b2 === 4 || g2(x, y) === 4; }).length; } if (Z._rgWhy && !lv.runeAllOk) Z._rgAll = (Z._rgAll || []).concat([{ b: lv.biome, seed: lv.seed, stuck: lv.stuck.slice(0, 40), W }]);
      restoreV(sn); for (const [x, y, v] of open) lv.set(x, y, v);
    }
    /* Runensockel: in einem offenen, wertvollen Zweig wartet manchmal eine Bewegungs-Rune */
    const pRate = gentle ? 0.35 : 0.28 + (lv.runeGates.length ? 0.12 : 0);
    if (R() < pRate) {
      const gated = new Set(lv.runeGates.map(gt => gt.cell));
      const rw = lv.rewards.filter(r => !r.vault && !gated.has(r.cell) && r.tier >= 1 && lv.reach[r.y * W + r.x]).sort((a, b) => (cells[b.cell] ? cells[b.cell].val : 0) - (cells[a.cell] ? cells[a.cell].val : 0));
      if (rw.length) { const r = rw[0]; r.kind = "bewegung"; r.tier = 3; lv.runeAltar = { x: r.x, y: r.y, cell: r.cell }; }
    }
    /* Schatzkammern (vault): manchmal liegt ein Runenstein (Spielweise-Rune für den Runengürtel) zwischen den Schätzen */
    const vaults = lv.rewards.filter(r => r.vault && r.kind !== "schluessel");
    if (vaults.length >= 2 && R() < 0.45) vaults[Math.floor(R() * vaults.length)].kind = "runenstein";
    lv.secretsTotal = (lv.secretsList || []).length;
  }
  function tryRuneGate(lv, c, side, kind, R, r0) {
    const W = lv.W, H = lv.H, ck = c.x + "," + c.y, ox = c.x * CW, oy = c.y * CH;
    const inCell = (x, y) => x >= ox && x < ox + CW && y >= oy && y < oy + CH;
    const changed = []; /* [x, y, alt] zum Zurücksetzen */
    const setT = (x, y, v) => { changed.push([x, y, lv.get(x, y)]); lv.set(x, y, v); };
    const undo = () => { for (let i = changed.length - 1; i >= 0; i--) lv.set(changed[i][0], changed[i][1], changed[i][2]); };
    const g0 = { reach: lv.reach, back: lv.back, stuck: lv.stuck };
    const back = why => { if (Z._rgWhy) Z._rgWhy.push(kind + ":" + side + ":" + why); undo(); lv.reach = g0.reach; lv.back = g0.back; lv.stuck = g0.stuck; return null; };
    const gate = { kind, cell: ck, side, tiles: [], rings: [], updraft: null, loot: [] };
    const free = new Set(); /* Plätze, die ohne Rune nicht mehr erreichbar sein dürfen (Kammer, entfernte Leiter) */
    let spots = null;
    if (side === "D") {
      /* Schacht: Kammer neu bauen, Leiter darunter entfernen */
      const rows = R() < 0.5 ? RUNE_SHAFT : mirrorRows(RUNE_SHAFT);
      spots = [];
      for (let r = 0; r < CH; r++) for (let q = 0; q < CW; q++) { const ch = rows[r][q]; setT(ox + q, oy + r, ch === "#" ? 1 : 0); if (ch === "$") spots.push([ox + q, oy + r]); }
      const col = ox + 11; let lb = oy + CH - 1;
      /* W13: nur bis zum Boden des Elternraums – dessen Leiter nach unten (in den Raum darunter) bleibt, sonst wäre
         der Elternraum selbst nur noch mit der Rune erreichbar */
      for (let y = oy + CH; y < H - 1 && y < oy + 2 * CH - 2 && lv.get(col, y) === 4; y++) { setT(col, y, 0); free.add(y * W + col); lb = y; }
      if (lb - oy - CH > (kind === "kralle" ? 15 : 30)) return back("lang"); /* Schacht höchstens einen Raum tief hinab – sonst wird das Klettern zäh */
      if (kind === "kette") {
        for (let ry = oy + 2, i = 0; ry <= lb - 3; ry += 4, i++) {
          const cols = i % 2 ? [ox + 12, ox + 11, ox + 13, ox + 10] : [ox + 11, ox + 12, ox + 10, ox + 13];
          const rx = cols.find(x => lv.get(x, ry) === 0 && lv.get(x, ry + 1) === 0 && lv.get(x, ry - 1) !== 4);
          if (rx != null) gate.rings.push({ x: rx, y: ry });
        }
        if (gate.rings.length < 2) return back("oesen");
      }
      if (kind === "schwingen") gate.updraft = { x0: ox + 10, x1: ox + 13, y0: oy + 1, y1: lb };
      if (kind === "kralle") {
        /* die Schachtwände ragen als Kamin in den Elternraum, bis drei Kacheln über dessen Boden (darunter frei zum Durchgehen) */
        for (const wx of [ox + 9, ox + 14]) for (let y = oy + CH; y <= lb - 3; y++) { const v = lv.get(wx, y); if (v === 1 || v === 7) continue; if (v !== 0) break; setT(wx, y, 1); gate.tiles.length; (gate.walls = gate.walls || []).push([wx, y]); }
      }
      gate.lb = lb;
    } else if (side === "U") {
      /* rissiger Boden über dem Abstieg im Elternraum */
      const py = oy - 1;
      for (let q = 10; q <= 13; q++) {
        const x = ox + q;
        for (const y of [py, py - 1]) {
          const v = lv.get(x, y);
          if (v === 1 || v === 7) continue;
          if (y === py - 1 && !((lv.get(ox + 9, y) === 1) && (lv.get(ox + 14, y) === 1))) continue;
          gate.tiles.push([x, y, v]); setT(x, y, 1);
        }
      }
      if (!gate.tiles.length) return back("keinboden");
      for (const [x, y] of gate.tiles) free.add(y * W + x);
    } else {
      const bx = side === "L" ? ox : ox + CW - 1, dir = side === "L" ? 1 : -1;
      for (let y = oy + 8; y <= oy + 10; y++) if (lv.get(bx, y) !== 0) return back("tuer");
      if (kind === "nebel") {
        for (let y = oy + 8; y <= oy + 10; y++) { gate.tiles.push([bx, y, 0]); setT(bx, y, 1); }
      } else {
        /* Schattenspalt: vier Spalten im Eingangsgang, nur die unterste Reihe bleibt frei */
        let j0 = -1;
        for (let s0 = 0; s0 <= 6 && j0 < 0; s0++) {
          let ok = true;
          for (let j = 0; j < s0 + 4 && ok; j++) { const x = bx + dir * j; for (let y = oy + 8; y <= oy + 10; y++) if (lv.get(x, y) !== 0) ok = false; }
          for (let j = s0; j < s0 + 4 && ok; j++) if (lv.get(bx + dir * j, oy + 11) !== 1) ok = false;
          if (ok) j0 = s0;
        }
        if (j0 < 0) return back("spalt");
        /* W7: hinter dem Spalt (in der Kammer) muss fester Boden kommen – sonst trägt der Schattensprint einen direkt in einen
           Abgrund, auf bröckelnde Stege oder eine Fährstrecke und man landet wieder vor dem Spalt („Rune geht nicht“). */
        for (let j = j0 + 4; j <= j0 + 6; j++) {
          const x = bx + dir * j; let y = oy + 11; while (y < oy + 16 && (lv.get(x, y) === 0 || lv.get(x, y) === 6)) y++;
          const f = lv.get(x, y); if (!(f === 1 || f === 7 || f === 2 || f === 8 || f === 4)) return back("spaltboden");
        }
        for (let j = j0; j < j0 + 4; j++) {
          const x = bx + dir * j; let top = oy + 7; while (top > oy && lv.get(x, top) !== 1 && lv.get(x, top) !== 7) top--;
          if (lv.get(x, top) !== 1 && lv.get(x, top) !== 7) return back("spaltdecke");
          for (let y = top + 1; y <= oy + 9; y++) { setT(x, y, 1); gate.tiles.push([x, y, 1]); }
        }
        gate.slit = { x0: Math.min(bx + dir * j0, bx + dir * (j0 + 3)), x1: Math.max(bx + dir * j0, bx + dir * (j0 + 3)), y: oy + 10 };
      }
    }
    for (let y = oy; y < oy + CH; y++) for (let x = ox; x < ox + CW; x++) free.add(y * W + x);
    /* Schatzplätze der Kammer */
    const rws = lv.rewards.filter(r => r.cell === ck);
    let tre = spots ? spots : rws.map(r => [r.x, r.y]);
    /* ein Schrein in der Kammer zählt als Schatz (Segen hinter der Sperre) */
    const shrines = (lv.feats || []).filter(f => f.t === "shrine" && inCell(f.x, f.y));
    if (side === "D" && shrines.length) return back("schrein");
    for (const f of shrines) tre.push([f.x, f.y]);
    const noTre = !tre.length;
    /* 1) ohne Runen: alles Bisherige außerhalb der Kammer bleibt erreichbar, kein Festsitz, Schatz unerreichbar */
    if (!validate(lv)) return back("ohne:ungueltig");
    /* Verlust außerhalb der Kammer: nur unwichtige Simse (keine Türen, Beute, Stationen) und nur wenige Plätze */
    let lost = 0; for (let i = 0; i < W * H; i++) if (r0[i] && !lv.reach[i] && !free.has(i)) lost++;
    if (lost > 60) return back("ohne:verlust");
    /* W13: kein anderer Raum darf ganz verloren gehen (Raumgraph: sonst unerreichbarer Raum ohne Rune) */
    if (lost) {
      const had = new Set(), has = new Set();
      for (let i = 0; i < W * H; i++) { if (!r0[i] && !lv.reach[i]) continue; const k2 = Math.floor((i % W) / CW) + "," + Math.floor(((i / W) | 0) / CH); if (k2 === ck) continue; if (r0[i]) had.add(k2); if (lv.reach[i]) has.add(k2); }
      for (const k2 of had) if (!has.has(k2) && lv.cells[k2] && lv.cells[k2].kind !== "secret") return back("ohne:raum");
    }
    if (lost) {
      const keyPts = [];
      for (const d of lv.doors) keyPts.push([d.x, d.y, "door"]);
      for (const l of lv.loot) keyPts.push([l.x, l.y, "loot"]);
      for (const r of lv.rewards) if (r.cell !== ck) keyPts.push([r.x, r.y, "rw"]);
      for (const f of lv.feats || []) if (f.t !== "mouth" && f.t !== "lock" && f.x != null && f.y != null) keyPts.push([f.x, f.y, f.t]);
      const was = (x, y) => r0[y * W + x] || r0[y * W + x - 1] || r0[y * W + x + 1], now = (x, y) => lv.reach[y * W + x] || lv.reach[y * W + x - 1] || lv.reach[y * W + x + 1];
      const kp = keyPts.find(([x, y]) => !inCell(x, y) && was(x, y) && !now(x, y));
      if (kp) { if (Z._rgWhy) Z._rgWhy.push("  pt " + kp.join(",") + " cell " + Math.floor(kp[0] / CW) + "," + Math.floor(kp[1] / CH) + " gate " + ck + " lost " + lost); return back("ohne:verlustwichtig"); }
    }
    const near = (rc, x, y) => rc[y * W + x] || rc[y * W + x - 1] || rc[y * W + x + 1];
    if (tre.some(([x, y]) => near(lv.reach, x, y))) return back("ohne:schatzoffen");
    const reachNo = lv.reach;
    /* 2) mit der Rune: Sperre offen, Schatz erreichbar, nirgends Festsitz */
    const opened = gate.tiles.map(([x, y]) => [x, y, lv.get(x, y)]);
    for (const [x, y, v] of gate.tiles) lv.set(x, y, v);
    const ab = Object.assign({}, Z.RUNE_ABIL[kind], { rings: gate.rings, updrafts: gate.updraft ? [gate.updraft] : [] });
    const okAb = validate(lv, ab), reachAb = lv.reach;
    if (noTre && okAb) {
      /* Sackgasse ohne Belohnung: der tiefste mit Rune erreichbare, ohne Rune unerreichbare Platz der Kammer */
      const sp = spotsIn(lv, c, 2, false).filter(([x, y]) => reachAb[y * W + x] && !near(reachNo, x, y));
      const cx = side === "L" ? ox + CW : side === "R" ? ox : ox + CW / 2;
      sp.sort((a, b) => Math.abs(b[0] - cx) - Math.abs(a[0] - cx));
      if (sp.length) { tre = [sp[0]]; lv.rewards.push({ kind: "glut", x: sp[0][0], y: sp[0][1], tier: 3, cell: ck }); rws.push(lv.rewards[lv.rewards.length - 1]); }
    }
    let okT = okAb && tre.length && tre.every(([x, y]) => near(reachAb, x, y));
    /* weitere Stehplätze für Beute (nur in der Kammer, mit Rune erreichbar) */
    let extra = [];
    if (okT) extra = spotsIn(lv, c, 2, false).filter(([x, y]) => reachAb[y * W + x] && !tre.some(([a, b]) => Math.abs(a - x) < 3 && Math.abs(b - y) < 2));
    for (const [x, y, v] of opened) lv.set(x, y, v);
    if (!okT) { if (noTre && rws.length) lv.rewards = lv.rewards.filter(r => r !== rws[0]); return back(okAb ? "mit:schatzzu" : "mit:ungueltig"); }
    if (!validate(lv)) return back("ende");
    /* Kammer ausräumen bzw. aufwerten */
    const inCk = o => inCell(o.x, o.y);
    lv.spawns = lv.spawns.filter(o => !inCk(o));
    if (side === "D") {
      lv.loot = lv.loot.filter(o => !inCk(o)); lv.traps = (lv.traps || []).filter(o => !inCk(o)); lv.decor = lv.decor.filter(o => !inCk(o));
      lv.props = lv.props.filter(o => !inCk(o)); lv.lights = (lv.lights || []).filter(o => !inCk(o)); c.tpl = "runenschacht"; c.dead = true;
      lv.rewards = lv.rewards.filter(r => r.cell !== ck);
      const best = R() < 0.5 ? "waffe" : "glut";
      spots.forEach(([x, y], i) => lv.rewards.push({ kind: i === 0 ? "runenstein" : best, x, y, tier: 3, cell: ck, rune: kind }));
      gate.loot = spots.slice();
    } else {
      for (const r of rws) { r.tier = 3; r.rune = kind; if (r.kind === "gold" || r.kind === "heil") r.kind = R() < 0.5 ? "glut" : "waffe"; }
      const sp = extra.sort((a, b) => b[1] - a[1])[0];
      if (sp) lv.rewards.push({ kind: "runenstein", x: sp[0], y: sp[1], tier: 3, cell: ck, rune: kind });
      else if (rws[0]) rws[0].kind = "runenstein";
      gate.loot = lv.rewards.filter(r => r.cell === ck).map(r => [r.x, r.y]);
    }
    lv.rings.push(...gate.rings); if (gate.updraft) lv.updrafts.push(gate.updraft);
    (lv.secretsList = lv.secretsList || []).push({ k: "rune", cell: ck, kind });
    gate.changed = changed.length;
    return gate;
  }
  Z._runeGates = runeGates; /* für Tests */

  /* Nach der Prüfung: Beute, die nur auf unerreichbaren Simsen läge, auf erreichbare Plätze im selben Raum legen;
     Bodengegner an unerreichbaren Stellen weglassen (Geheimräume hinter rissigen Wänden bleiben, wie sie sind) */
  function settle(lv) {
    if (!lv.reach) return;
    const W = lv.W, R = Z.Rng(((lv.seed || 1) ^ 0x2f17) >>> 0);
    const near = (x, y) => lv.reach[y * W + x] || lv.reach[y * W + x - 1] || lv.reach[y * W + x + 1];
    const cellOf = (x, y) => lv.cells[Math.floor(x / CW) + "," + Math.floor(y / CH)];
    const secret = (x, y) => { const c = cellOf(x, y); return c && c.kind === "secret"; };
    const taken = l2 => lv.loot.some(o => o !== l2 && Math.abs(o.x - l2.x) < 3 && o.y === l2.y);
    for (const l of lv.loot) {
      if (near(l.x, l.y) || secret(l.x, l.y)) continue;
      const c = cellOf(l.x, l.y), cand = [];
      for (let y = 1; y < lv.H - 1; y++) for (let x = 1; x < W - 1; x++) if (lv.reach[y * W + x] && standable(lv, x, y, 2) && (!c || cellOf(x, y) === c) && Math.abs(x - lv.start.x) + Math.abs(y - lv.start.y) > 8) cand.push([x, y]);
      R.shuffle(cand);
      for (const [x, y] of cand) { const ox = l.x, oy = l.y; l.x = x; l.y = y; if (!taken(l)) break; l.x = ox; l.y = oy; }
    }
    lv.spawns = lv.spawns.filter(s2 => s2.fly || near(s2.x, s2.y) || secret(s2.x, s2.y));
  }
  /* W13: Nach plan()/runeGates() können Kacheln zugehen (Tür der Schatzkammer, Runentore). Was dann in festem Fels
     läge – Beute, Lohn, Schlüssel, Hebel, Gegner, Fallen – rückt auf den nächsten freien Stehplatz im selben Raum
     (Gegner und Fallen fallen notfalls weg). Laufzeit-Schutz zusätzlich: Z.freeSpot (platz.js). */
  function unwall(lv) {
    const g = lv.get, W = lv.W, solid = (x, y) => { const v = g(x, y); return v === 1 || v === 7 || (v === 6 && lv.flood && lv.flood.has(y * W + x)); };
    const near = (x, y, avoid) => {
      const cx = Math.floor(x / CW), cy = Math.floor(y / CH);
      let best = null, bd = 1e9;
      for (let yy = cy * CH + 1; yy < cy * CH + CH - 1; yy++) for (let xx = cx * CW + 1; xx < cx * CW + CW - 1; xx++) {
        const d = Math.abs(xx - x) + Math.abs(yy - y) * 1.5; if (d >= bd || !standable(lv, xx, yy, 2)) continue;
        if (avoid && avoid(xx, yy)) continue;
        best = [xx, yy]; bd = d;
      }
      return best;
    };
    const busy = (self, list) => (xx, yy) => list.some(o => o !== self && Math.abs(o.x - xx) < 2 && o.y === yy);
    const moveAll = list => list.filter(o => {
      if (o.x == null || !solid(Math.floor(o.x), Math.floor(o.y))) return true;
      const p = near(o.x, o.y, busy(o, list)); if (!p) return false;
      o.x = p[0]; o.y = p[1]; o.moved = 1; return true;
    });
    lv.loot = moveAll(lv.loot || []);
    lv.rewards = moveAll(lv.rewards || []);
    if (lv.feats) lv.feats = lv.feats.filter(f => f.t === "lock" || f.t === "mouth" || f.x == null || !solid(f.x, f.y) || (() => { const p = near(f.x, f.y); if (!p) return f.t !== "key" && f.t !== "lever"; f.x = p[0]; f.y = p[1]; return true; })());
    lv.spawns = (lv.spawns || []).filter(s2 => !solid(Math.floor(s2.x), Math.floor(s2.y)));
    if (lv.traps) lv.traps = lv.traps.filter(t => !solid(t.x, t.y));
  }
  Z._unwall = unwall;
  /* ======================= W13 R4: SONDERRÄUME (nur auf Schleifen-Kanten) =======================
     Selten (≈ 40 % der Karten passender Gebiete) wird eine Verbindung zwischen zwei Räumen, die auf einem Rundweg liegt,
     zu etwas Besonderem – der Rundweg ist dann der (kurze) Umweg, es entsteht keine Sackgasse:
       bruecke (Wehrgang, Zinnen, Sturm): eingestürzter Übergang – Trümmer versperren den Durchgang
       flut (Hafen, See): überflutete Kammer – der Durchgang steht unter Wasser; ein Hebel daneben lässt es ablaufen
                          (Gittertor-Mechanik: lv.gates mit flut:true, Kacheln 6 → 0). Ins Wasser zu fallen kostet nichts,
                          man steht wieder an der letzten sicheren Stelle (Z.flutSicher, erkundung.js).
       kran (Schmiede, Glut): Kranplattform neben einer Leiter, fährt zwischen zwei Etagen auf und ab (erkundung.js).
     Beide Räume behalten mindestens zwei andere Ausgänge, kein Raum geht verloren, die bequeme Erreichbarkeit bleibt.
     Prüfschalter: Z.specialForce = true (immer, wenn möglich) / false (nie). Ergebnis: lv.specials, lv.flood. */
  const SPECIAL = (Z.SPECIAL = { wehrgang: "bruecke", zinnen: "bruecke", sturm: "bruecke", hafen: "flut", see: "flut", schmiede: "kran", glut: "kran" });
  /* W13 R20: Abkürzungen am Ende langer Nebenketten. Messung (r20): 200 Kettenenden mit ≥ 3 Nebenräumen auf 52 Karten; 52 grenzen an einen
     Hauptweg-Raum, 20 davon liegen direkt DARÜBER. Dort wird ein Fallschacht (2 breit) vom Kettenende in den Hauptweg-Raum gegraben: Der Rückweg
     schrumpft auf einen Sprung hinab. Geprüft wie die Sonderräume: alle Räume bleiben (bequem) erreichbar, kein Festsitzen, keine Türen/Fallen/Funde
     im Schacht. Der Schacht ist höher als ein bequemer Sprung – also eine Einbahn-Abkürzung nach unten. */
  /* W13 R24 (Leiter-Agent, Torhof-Seed 448840687): Leiter endet direkt unter einer Fährstrecke (Kachel 11 – für die Physik Luft, nur die Fähre
     trägt). Von der Leiterspitze kommt man nicht auf die Fähre (Kopf steckt im Wagen) → Grube ohne Ausweg. Der Prüfer hält 11 für einen Steg und
     merkt das nicht. Lösung: über jeder solchen Leiterspitze ein fester Absatz (3 Kacheln Steg 2) in der Fährstrecke – von dort steigt man auf die
     vorbeikommende Fähre wie von jedem Steg. */
  /* W13 R25: Prüfung mit Fährstrecke (11) als fester Kachel: trägt von oben (die Fähre kommt immer wieder), lässt aber niemanden von unten
     hindurch (der Wagen ist dann im Weg). Muss überall erreichbar/rückkehrbar bleiben – sonst entsteht ein „nur per Fähre“-Festsitzen. */
  function faehrSicher(lv) {
    /* Wer durch eine leere Fährstrecke fällt (Wagen gerade woanders), landet darunter. Von jedem solchen Landeplatz muss ein Ausgang erreichbar
       sein, wenn die Strecke als fester Block zählt (von unten kommt man nicht durch den Wagen, von oben trägt er). */
    const W = lv.W, H = lv.H, g = lv.get, lands = new Set();
    const solid = v => v === 1 || v === 7 || v === 12;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (g(x, y) !== 11) continue;
      const gef = v => v === 3 || v === 5 || v === 6 || v === 9; /* Stacheln, Lava, Wasser, Abgrund: setzen auf den letzten sicheren Platz zurück */
      let yy = y + 1; while (yy < H - 1 && !solid(g(x, yy + 1)) && g(x, yy + 1) !== 2 && g(x, yy + 1) !== 8 && g(x, yy + 1) !== 4 && g(x, yy + 1) !== 10 && !gef(g(x, yy + 1)) && !gef(g(x, yy))) yy++;
      if (gef(g(x, yy + 1)) || gef(g(x, yy))) continue;
      if (yy > y) lands.add(yy * W + x);
    }
    if (!lands.size) return true;
    const get1 = (x, y) => { const v = g(x, y); return v === 11 ? 1 : v; };
    const exits = (lv.doors || []).filter(d => d.kind === "exit");
    let n = 0;
    for (const i of lands) {
      if (n++ > 40) break;
      const f = { W, H, get: get1, start: { x: i % W, y: (i / W) | 0 }, doors: [], cells: lv.cells };
      validate(f);
      if (!f.reach) continue;
      if (!exits.some(d => f.reach[d.y * W + d.x] || f.reach[d.y * W + d.x - 1] || f.reach[d.y * W + d.x + 1])) { if (Z.faehrStat) { Z.faehrStat.fehl++; (Z.faehrStat.bsp = Z.faehrStat.bsp || []).push([lv.biome, i % W, (i / W) | 0]); } return false; }
    }
    if (Z.faehrStat) Z.faehrStat.ok++;
    return true;
  }
  function faehrLeitern(lv) {
    const W = lv.W, H = lv.H, g = lv.get; lv.faehrAbsatz = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (g(x, y) !== 11 || g(x, y + 1) !== 4) continue;
      for (const xx of [x - 1, x, x + 1]) if (g(xx, y) === 11 || g(xx, y) === 0) lv.set(xx, y, 2);
      lv.faehrAbsatz.push([x, y]);
    }
  }
  function abkuerzungen(lv) {
    if (!lv.cells || lv.hub || lv.arena || lv.passage) return;
    const W = lv.W, g = lv.get, cells = Object.keys(lv.cells).map(k => lv.cells[k]), key = (x, y) => x + "," + y;
    const kids = new Map(); for (const c of cells) if (c.parent) { if (!kids.has(c.parent)) kids.set(c.parent, []); kids.get(c.parent).push(c); }
    const tiefe = c => { let d = 0, x = c; while (x && x.kind === "side") { d++; x = x.parent; } return d; };
    const roomsOf = rc => { const s2 = new Set(); for (let i = 0; i < rc.length; i++) if (rc[i]) s2.add(Math.floor((i % W) / CW) + "," + Math.floor(((i / W) | 0) / CH)); return s2; };
    const comfyRooms = () => { const c = { W, H: lv.H, get: g, start: lv.start, doors: lv.doors, cells: lv.cells }; validate(c, null, true); return roomsOf(c.reach); };
    if (!validate(lv)) return;
    const full0 = roomsOf(lv.reach), comfy0 = comfyRooms();
    const keepOk = () => { if (!validate(lv)) return false; const f1 = roomsOf(lv.reach); for (const k of full0) if (!f1.has(k)) return false; const c1 = comfyRooms(); for (const k of comfy0) if (!c1.has(k)) return false; return true; };
    const nahDing = (x, y0, y1) => (lv.doors || []).some(d => Math.abs(d.x - x) < 4 && d.y >= y0 - 3 && d.y <= y1 + 3) || (lv.traps || []).some(t => Math.abs(t.x - x) < 3 && t.y >= y0 - 2 && t.y <= y1 + 2) ||
      (lv.rewards || []).some(r => Math.abs(r.x - x) < 3 && r.y >= y0 - 2 && r.y <= y1 + 2) || (lv.feats || []).some(f => Math.abs(f.x - x) < 3 && (f.y != null ? f.y : f.y0) >= y0 - 2 && (f.y != null ? f.y : f.y0) <= y1 + 2);
    lv.abkuerzungen = [];
    for (const c of cells) {
      if (c.kind !== "side" || (kids.get(c) || []).some(k => k.kind === "side") || tiefe(c) < 3) continue;
      const unten = lv.cells[key(c.x, c.y + 1)]; if (!unten || unten.kind !== "path") continue;
      if (c.need.D || unten.need.U) continue; /* schon verbunden (Leiter/Rundweg) – keine Abkürzung nötig */
      let wurzel = c; while (wurzel && wurzel.kind === "side") wurzel = wurzel.parent;
      if (!wurzel || (unten.dist || 0) < (wurzel.dist || 0)) continue; /* nur wenn man damit VORAN kommt (nicht hinter die Abzweigung zurück) */
      const fr = (c.y + 1) * CH - 1; /* untere Randreihe des Kettenendes */
      for (let x = c.x * CW + 3; x < c.x * CW + CW - 4; x++) {
        /* oben: Stehplatz auf dem Boden des Kettenendes; darunter nur Fels (1) bis zur Luft im Hauptweg-Raum */
        let yf = -1; for (let y = fr - 1; y > c.y * CH; y--) if (g(x, y) === 0 && g(x + 1, y) === 0 && g(x, y + 1) === 1 && g(x + 1, y + 1) === 1) { yf = y; break; }
        if (yf < 0) continue;
        let y = yf + 1, ok = true; while (y < (c.y + 1) * CH + CH - 2 && (g(x, y) !== 0 || g(x + 1, y) !== 0)) { if (!((g(x, y) === 1 || g(x, y) === 0) && (g(x + 1, y) === 1 || g(x + 1, y) === 0))) { ok = false; break; } y++; }
        if (!ok || y >= (c.y + 1) * CH + CH - 2 || y - yf - 1 < 2 || y - yf - 1 > 6) continue;
        if (Math.floor(y / CH) !== c.y + 1) continue; /* Luft muss im Hauptweg-Raum liegen */
        /* W13 R22 (Balance-Meldung): von unten nicht hochspringbar – Fallhöhe bis zum Boden darunter mindestens 7 Kacheln */
        { let gy = y; while (gy < lv.H - 2 && g(x, gy + 1) === 0 && g(x + 1, gy + 1) === 0) gy++; if (gy - yf < 7) continue; }
        if (nahDing(x, yf, y + 6)) continue;
        const ch = []; for (let yy = yf + 1; yy < y; yy++) for (const xx of [x, x + 1]) if (g(xx, yy) !== 0) { ch.push([xx, yy, g(xx, yy)]); lv.set(xx, yy, 0); }
        if (keepOk()) { lv.abkuerzungen.push({ x, y0: yf, y1: y, cell: key(c.x, c.y), to: key(unten.x, unten.y) }); break; }
        for (let i = ch.length - 1; i >= 0; i--) lv.set(ch[i][0], ch[i][1], ch[i][2]); validate(lv);
      }
    }
    validate(lv);
  }
  function specials(lv) {
    lv.specials = []; const kind = SPECIAL[lv.biome]; if (!kind || !lv.cells) return;
    const R = Z.Rng(((lv.seed || 1) ^ 0x5bec1) >>> 0);
    if (Z.specialForce === false || (Z.specialForce !== true && R() > 0.4)) return;
    const W = lv.W, H = lv.H, g = lv.get, cells = lv.cells, key = (x, y) => x + "," + y;
    const D4 = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] }, OPP = { L: "R", R: "L", U: "D", D: "U" };
    const open = v => v === true || v === "P";
    const deg = c => ["L", "R", "U", "D"].filter(s2 => open(c.need[s2])).length;
    const fixed = new Set(lv.doors.map(d => key(Math.floor(d.x / CW), Math.floor(d.y / CH))));
    if (lv.warden && lv.warden.cell) fixed.add(key(lv.warden.cell.x, lv.warden.cell.y));
    for (const rg of lv.runeGates || []) fixed.add(rg.cell);
    for (const f of lv.feats || []) if (f.t === "lock" || f.t === "trial") fixed.add(f.cell);
    const roomsOf = rc => { const s2 = new Set(); for (let i = 0; i < rc.length; i++) if (rc[i]) s2.add(Math.floor((i % W) / CW) + "," + Math.floor(((i / W) | 0) / CH)); return s2; };
    const comfyRooms = () => { const c = { W, H, get: g, start: lv.start, doors: lv.doors, cells }; validate(c, null, true); return roomsOf(c.reach); };
    const full0 = roomsOf(lv.reach), comfy0 = comfyRooms();
    /* Umweg im Raumgraphen ohne die Kante a–b */
    const detour = (a, b) => { const d = new Map([[a, 0]]), q = [a]; for (let h = 0; h < q.length; h++) { const c = q[h]; for (const s2 in D4) { if (!open(c.need[s2])) continue; const o = cells[key(c.x + D4[s2][0], c.y + D4[s2][1])]; if (!o || d.has(o) || (c === a && o === b)) continue; d.set(o, d.get(c) + 1); q.push(o); } } return d.get(b); };
    const cand = [];
    for (const k in cells) {
      const a = cells[k]; if (a.kind === "secret" || fixed.has(k)) continue;
      const s2 = kind === "kran" ? "D" : "R", b = cells[key(a.x + D4[s2][0], a.y + D4[s2][1])];
      if (!b || b.kind === "secret" || fixed.has(key(b.x, b.y)) || a.need[s2] !== true) continue;
      if (kind !== "kran") { if (deg(a) < 3 || deg(b) < 3) continue; const dt = detour(a, b); if (dt == null || dt > 6) continue; }
      cand.push({ a, b, s2 });
    }
    R.shuffle(cand);
    const keepOk = () => { if (!validate(lv)) return false; const f1 = roomsOf(lv.reach); for (const k of full0) if (!f1.has(k)) return false; const c1 = comfyRooms(); for (const k of comfy0) if (!c1.has(k)) return false; return true; };
    for (const { a, b, s2 } of cand.slice(0, 10)) {
      const ch = []; const setT = (x, y, v) => { ch.push([x, y, g(x, y)]); lv.set(x, y, v); };
      const undo = () => { for (let i = ch.length - 1; i >= 0; i--) lv.set(ch[i][0], ch[i][1], ch[i][2]); };
      if (kind === "bruecke") {
        const x = (a.x + 1) * CW - 1, y0 = a.y * CH + 8; let ok = true;
        for (let y = y0; y <= y0 + 2; y++) if (g(x, y) !== 0 || g(x + 1, y) !== 0) ok = false;
        if (!ok) continue;
        for (let y = y0; y <= y0 + 2; y++) { setT(x, y, 1); setT(x + 1, y, 1); }
        const na = a.need.R, nb = b.need.L; delete a.need.R; delete b.need.L;
        if (!keepOk()) { undo(); a.need.R = na; b.need.L = nb; validate(lv); continue; }
        lv.specials.push({ k: "bruecke", x, y0, a: key(a.x, a.y), b: key(b.x, b.y) });
        break;
      }
      if (kind === "flut") {
        if ([a, b].some(c => /^(zisterne|stelzensteg)/.test(c.tpl || ""))) continue; /* W43 Gezeiten: die Beckenmauer würde sonst zur Kammerwand – Wasser stünde als Wand neben dem Becken */
        const bx = (a.x + 1) * CW, top = a.y * CH + 7, bot = a.y * CH + CH - 1, x0 = bx - 5, x1 = bx + 4;
        let ok = true; const wt = [];
        for (let x = x0; x <= x1 && ok; x++) {
          let y = bot; while (y >= top && g(x, y) !== 0) { const v = g(x, y); if (v !== 1 && v !== 7) { ok = false; break; } y--; }
          if (!ok) break;
          /* Wasser von unten bis zur Oberfläche: jede Spalte braucht festen Grund innerhalb der Kammer */
          if (y === bot && g(x, bot + 1) !== 1) { ok = false; break; }
          for (let yy = y; yy >= top; yy--) { const v = g(x, yy); if (v === 0) wt.push([x, yy]); else if (v !== 1 && v !== 7) { ok = false; break; } }
        }
        if (!ok || !wt.length) continue;
        for (const [x, y] of wt) setT(x, y, 6);
        if (g(bx, a.y * CH + 9) !== 6 || g(bx - 1, a.y * CH + 9) !== 6) { undo(); continue; }
        lv.flood = new Set(wt.map(([x, y]) => y * W + x));
        if (!keepOk()) { undo(); lv.flood = null; validate(lv); continue; }
        /* Hebel: erreichbarer Stehplatz in einem der beiden Räume, nicht im Wasser, 3+ Kacheln vom Becken */
        const sp = [a, b].flatMap(c => spotsIn(lv, c, 2, false)).filter(([x, y]) => lv.reach[y * W + x] && (x < x0 - 2 || x > x1 + 2) && !lv.doors.some(d => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 3) && !(lv.feats || []).some(f => f.x != null && Math.abs(f.x - x) < 3 && Math.abs(f.y - y) < 2));
        sp.sort((p, q) => Math.abs(p[0] - bx) - Math.abs(q[0] - bx));
        /* abgelassen geprüft: auch ohne Wasser sitzt niemand fest */
        for (const [x, y] of wt) lv.set(x, y, 0); const fineOpen = validate(lv); for (const [x, y] of wt) lv.set(x, y, 6); validate(lv);
        if (!sp.length || !fineOpen) { undo(); lv.flood = null; validate(lv); continue; }
        const gi = (lv.gates = lv.gates || []).length;
        lv.gates.push({ flut: true, x: bx - 1, y0: a.y * CH + 8, tiles: wt.map(([x, y]) => [x, y, 0]), branch: key(a.x, a.y), other: key(b.x, b.y), side: 0, open: false, lever: true });
        (lv.feats = lv.feats || []).push({ t: "lever", x: sp[0][0], y: sp[0][1], gate: gi, flut: true });
        /* was jetzt im Wasser stünde: Gegner und Fallen weg, Beute rückt (unwall) */
        lv.spawns = lv.spawns.filter(o => !lv.flood.has(Math.floor(o.y) * W + Math.floor(o.x)));
        if (lv.traps) lv.traps = lv.traps.filter(o => !lv.flood.has(o.y * W + o.x));
        lv.specials.push({ k: "flut", x0, x1, top, bot, gate: gi, a: key(a.x, a.y), b: key(b.x, b.y) });
        (lv.secretsList = lv.secretsList || []).push({ k: "gate", i: gi }); lv.secretsTotal = lv.secretsList.length; /* der Hebel zählt wie die Abkürzungs-Hebel */
        break;
      }
      if (kind === "kran") {
        /* Plattform in den Spalten 12–13 neben der Leiter (Spalte 11) – fährt von Boden des oberen Raums bis zum Boden darunter */
        const xs = a.x * CW + 12, fr = (a.y + 1) * CH - 2;
        if (g(a.x * CW + 9, fr) !== 1 || g(a.x * CW + 14, fr) !== 1) continue;
        let r = fr, ok = true; while (r < H - 1 && g(xs, r) === 0 && g(xs + 1, r) === 0) r++;
        if (!(g(xs, r) === 1 && g(xs + 1, r) === 1) || r - fr < 6) ok = false;
        for (let y = fr - 3; y < fr && ok; y++) if (g(xs, y) !== 0 || g(xs + 1, y) !== 0) ok = false; /* Kopfraum oben */
        if (!ok) continue;
        lv.specials.push({ k: "kran", x: xs * T, w: 2 * T, yTop: fr * T, yBot: r * T, a: key(a.x, a.y), b: key(b.x, b.y) });
        break;
      }
    }
  }
  Z._specials = specials;
  /* ======================= W13 R5: ZERSTÖRBARE UMGEBUNG („The Destroyer“) =======================
     Wucht-Risse: rissiges Mauerwerk (Kachel 7), das nur starke Treffer zerschlagen – Wucht-Schläge der Kombos (heavy/spin),
     Schildstoß, Sturzangriff/Stampfer, Explosionen (erkundung.js filtert leichte Treffer heraus):
       wand    – Abkürzung zwischen zwei benachbarten Räumen, die im Raumgraph weit auseinander liegen (≥ 4 Räume Umweg)
       versteck– kleine Kammer in dickem Fels hinter einer rissigen Wand (seitlich) oder unter einem rissigen Boden, mit Lohn
     Morsche Böden: dünne Steinsimse (eine Kachel dick, Luft darunter), die als Holzbohlen gezeichnet werden und unter einer
     schweren Landung (Sturz ≥ 4 Kacheln oder Sturzangriff) wegbrechen – Abkürzung nach unten, unten ist schon erreichbar.
     Jedes Stück wird geprüft: geschlossen ändert sich nichts (7 und 1 sind fest), geöffnet – einzeln und alle zusammen –
     sitzt niemand fest und alle Ausgänge bleiben erreichbar. Nie auf dem Hauptweg nötig (geschlossen = alter Zustand).
     Ergebnis: lv.wucht [{k, tiles:[[x,y]], cell, ...}], lv.wuchtSet (Kachel-Indizes), lv.morsch [{x0, x1, y, cell}].
     Prüfschalter: Z.noCracks = true (keine), Z.crackForce = true (so viele wie möglich, für Tests). */
  function cracks(lv) {
    lv.wucht = []; lv.morsch = []; lv.wuchtSet = new Set();
    if (Z.noCracks || !lv.cells || !lv.reach) return;
    const R = Z.Rng(((lv.seed || 1) ^ 0xc7ac4) >>> 0), force = !!Z.crackForce;
    const W = lv.W, H = lv.H, g = lv.get, cells = lv.cells, key = (x, y) => x + "," + y;
    const cellAt = (x, y) => cells[key(Math.floor(x / CW), Math.floor(y / CH))];
    const fixed = new Set();
    for (const rg of lv.runeGates || []) fixed.add(rg.cell);
    for (const f of lv.feats || []) if (f.t === "lock" || f.t === "trial") fixed.add(f.cell);
    if (lv.warden && lv.warden.cell) fixed.add(key(lv.warden.cell.x, lv.warden.cell.y));
    const okCell = c => c && c.kind !== "secret" && !fixed.has(key(c.x, c.y)) && !c.pit;
    const busy = (x, y) => lv.doors.some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 4) || (lv.feats || []).some(f => f.x != null && Math.abs(f.x - x) < 3 && Math.abs(f.y - y) < 3) ||
      (lv.rewards || []).some(o => Math.abs(o.x - x) < 2 && Math.abs(o.y - y) < 2) || (lv.flood && lv.flood.has(y * W + x));
    /* alle bisher geöffneten zusammen + das neue: kein Festsitz, Ausgänge erreichbar */
    const opened = []; /* [x, y, Wert geöffnet, Wert geschlossen] */
    const testOpen = extra => {
      const all = opened.concat(extra);
      for (const [x, y, vo] of all) lv.set(x, y, vo);
      const okAll = validate(lv);
      for (const [x, y, , vc] of all) lv.set(x, y, vc);
      if (!okAll) { validate(lv); return false; }
      for (const [x, y, vo] of extra) lv.set(x, y, vo);
      const okOne = validate(lv);
      for (const [x, y, , vc] of extra) lv.set(x, y, vc);
      validate(lv); return okOne;
    };
    const nWand = force ? 3 : R() < 0.55 ? 1 : R() < 0.5 ? 2 : 0, nVers = force ? 2 : R() < 0.6 ? 1 : 0, nMorsch = force ? 2 : R() < 0.55 ? 1 : 0;
    /* --- Abkürzungswände --- */
    if (nWand) {
      const open = v => v === true || v === "P";
      const dist = (a, b) => { const D4 = [["L", -1, 0], ["R", 1, 0], ["U", 0, -1], ["D", 0, 1]], d = new Map([[a, 0]]), q = [a]; for (let h = 0; h < q.length; h++) { const c = q[h]; if (c === b) return d.get(c); for (const [s2, dx, dy] of D4) { if (!open(c.need[s2])) continue; const o = cells[key(c.x + dx, c.y + dy)]; if (o && !d.has(o)) { d.set(o, d.get(c) + 1); q.push(o); } } } return 99; };
      const cand = [];
      for (const k in cells) {
        const a = cells[k], b = cells[key(a.x + 1, a.y)];
        if (!okCell(a) || !okCell(b) || a.need.R) continue;
        const dd = dist(a, b); if (dd < 4) continue;
        /* Tunnelhöhe 3 auf irgendeiner Bodenhöhe, auf der beide Räume einen Boden an der Trennwand haben – die kürzeste */
        const bx = (a.x + 1) * CW; let best = null;
        for (let y0 = a.y * CH + 2; y0 <= a.y * CH + CH - 5; y0++) {
          const solidCol = x => g(x, y0) === 1 && g(x, y0 + 1) === 1 && g(x, y0 + 2) === 1;
          const airCol = x => [0, 1, 2].every(i => g(x, y0 + i) === 0);
          let lx = bx - 1; while (lx > bx - 9 && solidCol(lx)) lx--;
          let rx = bx; while (rx < bx + 8 && solidCol(rx)) rx++;
          if (lx === bx - 1 && rx === bx) continue;
          if (!airCol(lx) || !airCol(rx) || rx - lx - 1 > 10) continue;
          let ok = g(lx, y0 + 3) === 1 && g(rx, y0 + 3) === 1 && lv.reach[(y0 + 2) * W + lx] && lv.reach[(y0 + 2) * W + rx];
          for (let x = lx + 1; x < rx && ok; x++) if (g(x, y0 + 3) !== 1 || g(x, y0 - 1) !== 1) ok = false;
          if (!ok || busy(lx, y0 + 2) || busy(rx, y0 + 2)) continue;
          if (!best || rx - lx < best.rx - best.lx) best = { lx, rx, y0 };
        }
        if (!best) continue;
        const { lx, rx, y0 } = best;
        cand.push({ a, b, lx, rx, y0, w: dd + R() * 2 });
      }
      /* dazu: bestehende Türen auf Rundwegen, die zugemauert werden (Umweg 3–8 Räume, beide Räume behalten ≥ 2 Ausgänge) –
         zerschlagen öffnet die Abkürzung wieder; ohne Zerschlagen bleibt alles erreichbar (geprüft) */
      const deg = c => ["L", "R", "U", "D"].filter(s2 => open(c.need[s2])).length;
      for (const k in cells) {
        const a = cells[k], b = cells[key(a.x + 1, a.y)];
        if (!okCell(a) || !okCell(b) || a.need.R !== true || deg(a) < 3 || deg(b) < 3) continue;
        const bx = (a.x + 1) * CW, y0 = a.y * CH + 8;
        if (![0, 1, 2].every(i => g(bx - 1, y0 + i) === 0 && g(bx, y0 + i) === 0) || g(bx - 1, y0 + 3) !== 1 || g(bx, y0 + 3) !== 1) continue;
        a.need.R = undefined; const dd = dist(a, b); a.need.R = true;
        if (dd < 3 || dd > 8) continue;
        cand.push({ a, b, lx: bx - 2, rx: bx + 1, y0, w: dd + R() * 2, tuer: true });
      }
      const rooms = () => { const s2 = new Set(); for (let i = 0; i < lv.reach.length; i++) if (lv.reach[i]) s2.add(Math.floor((i % W) / CW) + "," + Math.floor(((i / W) | 0) / CH)); return s2; };
      const comfyR = () => { const c = { W, H, get: g, start: lv.start, doors: lv.doors, cells }; validate(c, null, true); const s2 = new Set(); for (let i = 0; i < c.reach.length; i++) if (c.reach[i]) s2.add(Math.floor((i % W) / CW) + "," + Math.floor(((i / W) | 0) / CH)); return s2; };
      const rooms0 = rooms(), comfy0 = comfyR();
      cand.sort((p, q) => q.w - p.w);
      for (const c of cand) {
        if (lv.wucht.filter(o => o.k === "wand").length >= nWand) break;
        if (lv.wucht.some(o => o.k === "wand" && (o.a === key(c.a.x, c.a.y) || o.b === key(c.b.x, c.b.y)))) continue;
        const tiles = []; for (let x = c.lx + 1; x < c.rx; x++) for (let y = c.y0; y <= c.y0 + 2; y++) tiles.push([x, y, 0, 7]);
        if (c.tuer) {
          /* zumauern und prüfen: kein Raum verloren, bequem erreichbar wie zuvor */
          for (const [x, y] of tiles) lv.set(x, y, 7);
          let ok = validate(lv); if (ok) { const r1 = rooms(); for (const k of rooms0) if (!r1.has(k)) ok = false; }
          if (ok) { const c1 = comfyR(); for (const k of comfy0) if (!c1.has(k)) ok = false; }
          if (!ok) { for (const [x, y] of tiles) lv.set(x, y, 0); validate(lv); continue; }
          delete c.a.need.R; delete c.b.need.L;
        }
        if (!testOpen(tiles)) { if (c.tuer) { for (const [x, y] of tiles) lv.set(x, y, 0); c.a.need.R = true; c.b.need.L = true; validate(lv); } continue; }
        for (const [x, y] of tiles) { lv.set(x, y, 7); lv.wuchtSet.add(y * W + x); } opened.push(...tiles);
        lv.wucht.push({ k: "wand", tuer: !!c.tuer, tiles: tiles.map(([x, y]) => [x, y]), a: key(c.a.x, c.a.y), b: key(c.b.x, c.b.y), cell: key(c.a.x, c.a.y) });
      }
    }
    /* --- Verstecke: seitlich in dicken Fels (3 hoch) oder unter dem Boden (2 tief) --- */
    if (nVers) {
      const cand = [];
      for (let y = 2; y < H - 3; y++) for (let x = 2; x < W - 2; x++) {
        if (!lv.reach[y * W + x] || !standable(lv, x, y, 3) || g(x, y + 1) !== 1) continue;
        const c = cellAt(x, y); if (!okCell(c) || c === lv.startCell || busy(x, y)) continue;
        const inC = (xx, yy) => xx > 0 && xx < W - 1 && yy > 0 && yy < H - 1 && !(cellAt(xx, yy) && cellAt(xx, yy).kind === "secret");
        for (const d of [-1, 1]) {
          /* seitlich: Riss bei x+d, Kammer x+2d..x+3d, Spalten x+d..x+4d in den Zeilen y-3..y+1 fest (Kammer rundum Fels) */
          let ok = true;
          for (let i = 1; i <= 4 && ok; i++) { const xx = x + d * i; if (!inC(xx, y - 3) || !inC(xx, y + 1)) ok = false; for (let yy = y - 3; yy <= y + 1 && ok; yy++) if (g(xx, yy) !== 1) ok = false; }
          if (ok) cand.push({ k: "seite", x, y, d });
        }
        /* unten: Boden x-1..x+1 in Zeile y+1 rissig, Kammer y+2..y+3, ringsum fest */
        let ok = true;
        for (let xx = x - 2; xx <= x + 2 && ok; xx++) for (let yy = y + 1; yy <= y + 4 && ok; yy++) if (g(xx, yy) !== 1 || !inC(xx, yy)) ok = false;
        for (let xx = x - 1; xx <= x + 1 && ok; xx++) if (!standable(lv, xx, y, 3)) ok = false;
        if (ok) cand.push({ k: "boden", x, y });
      }
      R.shuffle(cand);
      for (const c of cand) {
        if (lv.wucht.filter(o => o.k === "versteck").length >= nVers) break;
        if (lv.wucht.some(o => Math.abs((o.x || 0) - c.x) < 30 && Math.abs((o.y || 0) - c.y) < 14)) continue;
        const crack = [], pocket = []; let spot;
        if (c.k === "seite") {
          for (let yy = c.y - 2; yy <= c.y; yy++) crack.push([c.x + c.d, yy, 0, 1]);
          for (let i = 2; i <= 3; i++) for (let yy = c.y - 2; yy <= c.y; yy++) pocket.push([c.x + c.d * i, yy]);
          spot = [c.x + c.d * 2, c.y];
        } else {
          for (let xx = c.x - 1; xx <= c.x + 1; xx++) crack.push([xx, c.y + 1, 0, 1]);
          for (let xx = c.x - 1; xx <= c.x + 1; xx++) for (let yy = c.y + 2; yy <= c.y + 3; yy++) pocket.push([xx, yy]);
          spot = [c.x, c.y + 3];
        }
        for (const [x, y] of pocket) lv.set(x, y, 0);
        if (!testOpen(crack)) { for (const [x, y] of pocket) lv.set(x, y, 1); validate(lv); continue; }
        for (const [x, y] of crack) { lv.set(x, y, 7); lv.wuchtSet.add(y * W + x); } opened.push(...crack);
        const cell = cellAt(c.x, c.y), r = R();
        lv.rewards.push({ kind: r < 0.55 ? "gold" : r < 0.82 ? "glut" : "heil", x: spot[0], y: spot[1], tier: 1, cell: key(cell.x, cell.y), versteck: true });
        lv.wucht.push({ k: "versteck", art: c.k, tiles: crack.map(([x, y]) => [x, y]), x: c.x, y: c.y, cell: key(cell.x, cell.y) });
      }
    }
    /* --- morsche Böden: dünne Simse über erreichbarem Raum, mit 4 Kacheln Luft darüber (Sprung + Sturzangriff geht immer) --- */
    if (nMorsch) {
      const cand = [];
      for (let y = 3; y < H - 4; y++) for (let x = 2; x < W - 4; x++) {
        let ok = true;
        for (let xx = x; xx < x + 3 && ok; xx++) if (g(xx, y) !== 1 || g(xx, y - 1) !== 0 || g(xx, y - 2) !== 0 || g(xx, y - 3) !== 0 || g(xx, y - 4) !== 0 || g(xx, y + 1) !== 0 || !lv.reach[(y - 1) * W + xx] || lv.wuchtSet.has(y * W + xx)) ok = false;
        if (!ok) continue;
        const c = cellAt(x, y); if (!okCell(c) || cellAt(x + 2, y) !== c || busy(x + 1, y - 1)) continue;
        /* darunter: in höchstens 9 Kacheln fester Boden, und dort ist man schon */
        for (let xx = x; xx < x + 3 && ok; xx++) { let yy = y + 1; while (yy < H - 1 && yy - y < 10 && (g(xx, yy) === 0)) yy++; const v = g(xx, yy); if (!(v === 1 || v === 2) || yy - y >= 10 || !lv.reach[(yy - 1) * W + xx]) ok = false; }
        if (ok) cand.push({ x, y });
      }
      R.shuffle(cand);
      for (const c of cand) {
        if (lv.morsch.length >= nMorsch) break;
        if (lv.morsch.some(o => Math.abs(o.x0 - c.x) < 24 && Math.abs(o.y - c.y) < 14)) continue;
        const tiles = [[c.x, c.y, 0, 1], [c.x + 1, c.y, 0, 1], [c.x + 2, c.y, 0, 1]];
        if (!testOpen(tiles)) continue;
        opened.push(...tiles);
        const cl = cellAt(c.x, c.y);
        lv.morsch.push({ x0: c.x, x1: c.x + 2, y: c.y, cell: key(cl.x, cl.y) });
      }
    }
    validate(lv);
  }
  Z._cracks = cracks;
  /* ======================= W13 R7: GEZEITEN (Zisterne, Stelzensteg) =======================
     Das Vorlagen-Wasser (q) ist „sicher“ wie die Flutkammer (lv.flood: kein Schaden, zurück an einen trockenen Platz).
     Darüber steigt das Wasser in einem langsamen Zyklus um bis zu 2 Reihen (erkundung.js: Ebbe 6 s, steigen 2 s, Flut 5 s,
     fallen 2 s; Vorwarnung: Gurgeln + Blasen). Die Flut ändert keine Kacheln (das kostete je Wechsel eine Neuberechnung der
     Grafik): erkundung.js zeichnet das Wasser darüber und setzt wer hineingerät sicher zurück. Der Prüfer kennt nur die Ebbe –
     die Flut ist reines Weg-Timing.
     lv.tides: [{cell, rows: [[x, y, stufe]], safe: [[x, y]]}] (stufe 1 = erste Reihe über dem Wasser, 2 = zweite). */
  /* W43 Gezeiten: Flutbereich per Flutfüllung statt „alle Luft in 2 Reihen über dem Becken“. Das Wasser steigt auf Stufe L
     (Oberfläche yw - L) und füllt nur Kacheln, die von der Wasserfläche aus seitlich/unten verbunden sind und unter dieser Höhe
     liegen. Fände es dabei einen Weg ins Freie (aus der Beckenbreite xa..xb oder dem Raum hinaus, nach unten in Luft oder in
     einen Abgrund), läuft es dort über – die höchste Stufe ohne Ausweg ist die Flut (0–2). Die Ausweg-Stellen der nächsten
     Stufe sind die Überlaufkanten: Dort zeichnet effekte.js bei voller Flut ein Rinnsal über den Rand bis zum Boden darunter.
     Rückgabe: {lmax, rows: [[x, y, stufe]], over: [{x0, x, y, dx, y1}], inlet: [x, y, dx] | null, drain: [x, y] | null}. */
  const tideBlock = v => v === 1 || v === 7 || v === 12;
  function tideFill(lv, c, ts) {
    const W = lv.W, g = lv.get, yw = Math.min(...ts.map(t => t[1])), xa = Math.min(...ts.map(t => t[0])), xb = Math.max(...ts.map(t => t[0]));
    const rx0 = c.x * CW, rx1 = rx0 + CW - 1, ry0 = c.y * CH;
    const fill = L => {
      const reg = new Map(), leaks = [], st = [];
      for (const [x, y] of ts) if (y === yw && !tideBlock(g(x, y - 1)) && g(x, y - 1) !== 6) { const i = (y - 1) * W + x; if (!reg.has(i)) { reg.set(i, [x, y - 1]); st.push([x, y - 1]); } }
      while (st.length) {
        const [x, y] = st.pop();
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy; if (ny < yw - L) continue;
          const v = g(nx, ny); if (tideBlock(v)) continue;
          if (ny >= yw) { if (v === 6) continue; leaks.push({ x: nx, y: ny, fx: x, dx: 0 }); continue; } /* nach unten in Luft: läuft aus */
          if (nx < xa || nx > xb || nx < rx0 || nx > rx1 || ny < ry0 || v === 9) { leaks.push({ x: nx, y: ny, fx: x, dx }); continue; }
          const i = ny * W + nx; if (reg.has(i) || v === 6) continue;
          reg.set(i, [nx, ny]); st.push([nx, ny]);
        }
      }
      return { reg, leaks };
    };
    let lmax = 0, rows = [], over = [];
    for (let L = 1; L <= 3; L++) {
      const f = fill(L);
      if (f.leaks.length || L === 3) {
        /* Überlaufkanten: seitliche Auswege dieser Stufe, höchstens eine je Seite */
        for (const lk of f.leaks) {
          if (!lk.dx || over.some(o => o.dx === lk.dx)) continue;
          /* über die Mauerkrone (x0 …) bis zur ersten Spalte ohne Boden darunter, dort hinab bis zum nächsten Boden (y1) */
          let fx = lk.x, k = 0; while (k < 4 && tideBlock(g(fx, lk.y + 1)) && !tideBlock(g(fx + lk.dx, lk.y))) { fx += lk.dx; k++; }
          if (tideBlock(g(fx, lk.y + 1)) || tideBlock(g(fx, lk.y))) continue;
          let y1 = lk.y; while (y1 < lv.H - 1 && !tideBlock(g(fx, y1 + 1)) && g(fx, y1 + 1) !== 6 && g(fx, y1 + 1) !== 2 && y1 - lk.y < 30) y1++;
          over.push({ x0: lk.x, x: fx, y: lk.y, dx: lk.dx, y1 });
        }
        break;
      }
      lmax = L; rows = [...f.reg.values()].map(([x, y]) => [x, y, yw - y]);
    }
    if (!lmax) return { lmax: 0, rows: [], over: [], yw, xa, xb };
    /* Zulauf (Rohr in der Beckenwand, knapp über der Ebbe-Linie) und Ablauf (Strudel) auf der anderen Seite */
    const s1 = rows.filter(r => r[2] === 1), side = (dx) => { for (const [x, y] of dx > 0 ? s1.slice().sort((a, b) => a[0] - b[0]) : s1.slice().sort((a, b) => b[0] - a[0])) if (tideBlock(g(x - dx, y))) return [x - dx, y, dx]; return null; };
    const inlet = side(1) || side(-1);
    let drain = null; if (inlet) { const far = s1.slice().sort((a, b) => inlet[2] > 0 ? b[0] - a[0] : a[0] - b[0]).find(r => g(r[0], r[1] + 1) === 6); if (far) drain = [far[0] - inlet[2], far[1] + 1]; }
    return { lmax, rows, over, inlet, drain, yw, xa, xb };
  }
  Z._tideFill = tideFill;
  function tides(lv) {
    lv.tides = [];
    const q = lv.qTiles || []; if (!q.length) return;
    const W = lv.W;
    lv.flood = lv.flood || new Set(); for (const i of q) lv.flood.add(i);
    const byCell = new Map();
    for (const i of q) { const x = i % W, y = (i / W) | 0, k = Math.floor(x / CW) + "," + Math.floor(y / CH); if (!byCell.has(k)) byCell.set(k, []); byCell.get(k).push([x, y]); }
    for (const [k, ts] of byCell) {
      const c = lv.cells[k]; if (!c || !/^(zisterne|stelzensteg)/.test(c.tpl || "")) continue;
      /* W43 Gezeiten: nur so hoch, wie das Becken hält (Stege/Steine ragen heraus, das Wasser steht drumherum) */
      const tf = tideFill(lv, c, ts), rows = tf.rows, { yw, xa, xb } = tf;
      if (!rows.length) continue;
      const tideSet = new Set(rows.map(([x, y]) => y * W + x));
      /* trockene Plätze im Raum (für das Zurücksetzen bei Flut): erreichbar, nicht unter/neben steigendem Wasser */
      const safe = spotsIn(lv, c, 2, false).filter(([x, y]) => lv.reach && lv.reach[y * W + x] && !tideSet.has(y * W + x) && !tideSet.has((y + 1) * W + x) && !tideSet.has((y - 1) * W + x));
      if (!safe.length) continue;
      /* was bei Flut unter Wasser stünde: Bodengegner weg, Beute/Lohn auf einen trockenen Platz */
      const wet = (x, y) => tideSet.has(Math.floor(y) * W + Math.floor(x)) || tideSet.has((Math.floor(y) + 1) * W + Math.floor(x));
      lv.spawns = lv.spawns.filter(o => o.fly || !wet(o.x, o.y));
      let si = 0; for (const o of (lv.loot || []).concat(lv.rewards || [])) if (wet(o.x, o.y)) { const p2 = safe[si++ % safe.length]; o.x = p2[0]; o.y = p2[1]; }
      /* W43 Gezeiten: Boden-Deko (Fass, Topf, Kohlebecken …) nicht in den Flutbereich stellen – sie stünde bei Flut im Wasser */
      if (lv.tides.length < 2) { const floorWet = d => tideSet.has(d.y * W + d.x) && (tideBlock(lv.get(d.x, d.y + 1)) || lv.get(d.x, d.y + 1) === 2); if (lv.decor) lv.decor = lv.decor.filter(d => !floorWet(d)); if (lv.lights) lv.lights = lv.lights.filter(d => !floorWet(d)); }
      if (lv.tides.length < 2) lv.tides.push({ cell: k, rows, safe, xa, xb, yw, lmax: tf.lmax, over: tf.over, inlet: tf.inlet, drain: tf.drain, ts }); /* höchstens 2 je Karte (das Wasser ohne Gezeiten bleibt) */
    }
  }
  /* W43 Gezeiten: Nach den späteren Umbauten (Fähr-Absätze, Abkürzungsschächte) noch einmal füllen – hält das Becken
     jetzt weniger, schrumpft die Flut mit (nie mehr Kacheln als vorher, die Gegner-/Beute-Verschiebung bleibt gültig). */
  function tideRecheck(lv) {
    if (!lv.tides || !lv.tides.length) return;
    lv.tides = lv.tides.filter(td => {
      const c = lv.cells[td.cell]; if (!c) return false;
      const tf = tideFill(lv, c, td.ts), old = new Set(td.rows.map(r => r[1] * lv.W + r[0]));
      if (tf.rows.length === td.rows.length && tf.rows.every(r => old.has(r[1] * lv.W + r[0]))) { td.over = tf.over; td.inlet = tf.inlet; td.drain = tf.drain; return true; }
      if (!tf.lmax || tf.rows.some(r => !old.has(r[1] * lv.W + r[0]))) return false; /* neue Luft im Becken: lieber keine Gezeiten */
      td.rows = tf.rows; td.lmax = tf.lmax; td.over = tf.over; td.inlet = tf.inlet; td.drain = tf.drain; return true;
    });
  }
  Z._tideRecheck = tideRecheck;
  Z._tides = tides;
  /* W13 Runde 2: BEQUEME WEGE. Der Prüfer rechnet mit Maximalsprüngen (6 hoch, 7 weit); für echte Spieler (und Handheld)
     ist das grenzwertig. Jede Stelle, die nur mit einem solchen Sprung erreichbar ist, bekommt einen Zwischensteg
     (3 Kacheln Brett, von unten durchspringbar) etwa in der Mitte des Sprungs – solange danach weiterhin niemand
     feststecken kann. Messung danach: validate(lv, null, true) = höchstens 4 hoch / 5 weit. */
  function comfyAusgaenge(lv) { const c = { W: lv.W, H: lv.H, get: lv.get, start: lv.start, doors: lv.doors, cells: lv.cells }; validate(c, null, true); return lv.doors.filter(d => d.kind === "exit").every(d => c.reach[d.y * lv.W + d.x]); }
  function ease(lv) {
    const W = lv.W, H = lv.H, g = lv.get, tried = new Set();
    const busy = (x, y) => lv.doors.some(d => Math.abs(d.x - x) < 2 && Math.abs(d.y - y) < 2) || /* W13 R7: Stege dürfen nah an Türen (Zugang zur Tür) */ (lv.loot || []).some(o => Math.abs(o.x - x) < 2 && Math.abs(o.y - y) < 2) ||
      (!forceT && (lv.traps || []).some(o => Math.abs(o.x - x) < 2 && Math.abs(o.y - y) < 2)) || (lv.spawns || []).some(o => Math.abs(o.x - x) < 1 && Math.abs(o.y - y) < 2);
    const secretAt = (x, y) => { const c = lv.cells[Math.floor(x / CW) + "," + Math.floor(y / CH)]; return !c || c.kind === "secret"; };
    const okPlank = (x0, x1, row) => {
      if (row < 2 || row >= H - 1) return false;
      for (let x = x0; x <= x1; x++) {
        if (x < 1 || x >= W - 1 || g(x, row) !== 0 || g(x, row - 1) !== 0 || g(x, row - 2) !== 0 || secretAt(x, row) || busy(x, row - 1)) return false;
        if (g(x, row + 1) === 4 || g(x, row - 3) === 4) return false; /* nicht in Leiterschächte */
      }
      return true;
    };
    lv.eased = []; let forceT = false; /* W13 R7: für Ausgänge dürfen Fallen dem Steg weichen */
    /* W13 R7: Ausgänge zuerst – solange eine Tür nur per Maximalsprung erreichbar ist, die Kante wählen, die ihr am nächsten führt
       (vorher konnte das Steg-Budget an anderer Stelle aufgebraucht sein: 1 von 390 Karten); dafür etwas mehr Budget */
    const exitsP = lv.doors.filter(d => d.kind === "exit");
    /* W39 Leistung: Reichweite (bequem) und Kantengraph gelten bis zum nächsten gesetzten Steg – ohne neuen Steg ist die Karte
       unverändert (Versuchsstege werden zurückgenommen), nach einem Steg liefern die Prüfungen des Erfolgsfalls genau diese Werte */
    let rcC = null, edC = null;
    for (let it = 0; it < 40 && lv.eased.length < 20; it++) { /* W13 R23: mehr Budget, solange ein Ausgang nur per Maximalsprung erreichbar ist (mehr, kürzere Zweige) */
      if (!rcC) { const c = { W, H, get: g, start: lv.start, doors: lv.doors, cells: lv.cells }; validate(c, null, true); rcC = c.reach; }
      if (!edC) { const f = { W, H, get: g, start: lv.start, doors: lv.doors, cells: lv.cells, _wantEdges: true }; validate(f); edC = f._edges; }
      const rc = rcC, [ea, eb] = edC;
      const openEx = exitsP.filter(d => !rc[d.y * W + d.x]);
      if (!openEx.length && (lv.eased.length >= 10 || it >= 16)) break; /* wie bisher; nur für Türen mehr Budget */
      if (!openEx.length && lv.eased.length >= 13) break;
      if (openEx.length && it >= 24 && lv.eased.length >= 13 && it >= 36) break;
      let pick = -1, bd = 1e9; forceT = openEx.length > 0;
      for (let k = 0; k < ea.length; k++) {
        if (!rc[ea[k]] || rc[eb[k]] || tried.has(ea[k] + ">" + eb[k])) continue;
        if (!openEx.length) { pick = k; break; }
        const bx2 = eb[k] % W, by2 = (eb[k] / W) | 0; let d = 1e9; for (const e of openEx) d = Math.min(d, Math.abs(e.x - bx2) + Math.abs(e.y - by2) * 1.5);
        if (d < bd) { bd = d; pick = k; }
      }
      if (pick < 0) break;
      const A = ea[pick], Bt = eb[pick]; tried.add(A + ">" + Bt);
      const ax = A % W, ay = (A / W) | 0, bx = Bt % W, by = (Bt / W) | 0, dy = ay - by, dx = bx - ax;
      const hs = dy > 0 ? [Math.ceil(dy / 2), Math.floor(dy / 2), Math.ceil(dy / 2) + 1].filter(h => h >= 0 && h <= 4) : [0, 1, -1];
      let done = false;
      for (const h of hs) {
        for (const off of [0, -1, 1, -2, 2]) {
          const mx = ax + Math.round(dx / 2) + off, row = ay - h + 1;
          if (!okPlank(mx - 1, mx + 1, row)) continue;
          for (let x = mx - 1; x <= mx + 1; x++) lv.set(x, row, 2);
          const c2 = { W, H, get: g, start: lv.start, doors: lv.doors, cells: lv.cells }; validate(c2, null, true);
          const we0 = lv._wantEdges, ed0 = lv._edges; lv._wantEdges = true; /* W39 Leistung: Kanten des neuen Stands gleich mitnehmen */
          const okV = c2.reach[Bt] && validate(lv), edN = lv._edges; if (we0 === undefined) delete lv._wantEdges; else lv._wantEdges = we0; if (ed0 === undefined) delete lv._edges; else lv._edges = ed0;
          if (okV) { rcC = c2.reach; edC = edN; lv.eased.push([mx - 1, mx + 1, row]); done = true; if (forceT && lv.traps) lv.traps = lv.traps.filter(o => !(o.x >= mx - 2 && o.x <= mx + 2 && Math.abs(o.y - (row - 1)) < 2)); break; }
          for (let x = mx - 1; x <= mx + 1; x++) lv.set(x, row, 0);
        }
        if (done) break;
      }
    }
    validate(lv); /* lv.reach/back/stuck wieder zum endgültigen Stand */
  }
  Z._ease = ease;
  Z._tryGen = (b, s, o) => tryGen(b, s, o || {}); /* für Tests */
  const FERRY_BOOST = 1.75;
  const TPL_BIO_W = 2.2, TPL_REP = 1.2, TPL_RUN = 0.12; /* W13 R6: Gewicht der Gebietsvorlagen, Dämpfung je Wiederholung in einer Karte */
  function tryGen(biomeId, seed, opts) {
    const B = BIOMES[biomeId], R = Z.Rng(seed);
    const [gw, gh] = B.grid;
    const lay = LAYOUT[biomeId] || {};
    const path = makePath(R, gw, gh, B.flow, lay);
    const key = (x, y) => x + "," + y;
    const cells = {}; /* key -> {x,y,need:{L,R,U,D}, kind:'path'|'side'|'secret', depth, tpl}; need-Werte: true, "X" rissige Wand, "G" Gittertor (Abkürzung) */
    const conn = (a, b, secret) => {
      const [ax, ay] = a, [bx, by] = b, A = cells[key(ax, ay)], Bc = cells[key(bx, by)];
      if (bx === ax + 1) { A.need.R = secret || true; Bc.need.L = secret || true; }
      if (bx === ax - 1) { A.need.L = secret || true; Bc.need.R = secret || true; }
      if (by === ay + 1) { A.need.D = secret || true; Bc.need.U = secret || true; }
      if (by === ay - 1) { A.need.U = secret || true; Bc.need.D = secret || true; }
    };
    path.forEach(([x, y], i) => { cells[key(x, y)] = { x, y, need: {}, kind: "path", idx: i, depth: 0 }; });
    for (let i = 1; i < path.length; i++) conn(path[i - 1], path[i]);
    /* Nebenzweige, Schleifen, Abkürzungen und Geheimkammern */
    growBranches(R, cells, gw, gh, lay, conn, key, B.tier || 0);
    /* Entfernung jedes Raums vom Start in Räumen (offene Verbindungen; rissige Wände und Gittertore zählen nicht) */
    {
      const st = cells[key(path[0][0], path[0][1])], q = [st]; st.dist = 0;
      const D4 = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
      while (q.length) { const c = q.shift(); for (const s2 in D4) { if (c.need[s2] !== true) continue; const o = cells[key(c.x + D4[s2][0], c.y + D4[s2][1])]; if (o && o.dist == null) { o.dist = c.dist + 1; q.push(o); } } }
      for (const k in cells) if (cells[k].dist == null) cells[k].dist = (cells[k].parent && cells[k].parent.dist != null ? cells[k].parent.dist + 1 : 99);
    }
    /* Kachelraster */
    const W = gw * CW, H = gh * CH;
    const tiles = new Uint8Array(W * H).fill(1);
    const marks = [];
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = v; };
    const get = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : tiles[y * W + x]);
    const startCell = cells[key(path[0][0], path[0][1])], endCell = cells[key(path[path.length - 1][0], path[path.length - 1][1])];
    const tplUse = {}; /* W13 R6: Zählung je Karte (Wiederholungsdämpfung) */
    const qTiles = []; /* W13 R7: Wasser aus Vorlagen (q) */
    const runUse = Z.run && Z.run._tplUse ? Z.run._tplUse : null;
    for (const k in cells) {
      const c = cells[k], n = c.need;
      const leaf = c.kind !== "path" && ["L", "R", "U", "D"].filter(s2 => n[s2]).length === 1;
      /* passende Vorlage: muss alle benötigten Öffnungen haben; Sackgassen bevorzugt für Seitenräume */
      const candidates = [];
      TPL.forEach(t => {
        if (t.bio && !t.bio.includes(biomeId)) return; /* W13 R6: Gebietsvorlagen nur in ihren Gebieten */
        for (const mir of [false, true]) {
          const L = mir ? t.R : t.L, Rr = mir ? t.L : t.R;
          if (n.L && !L) continue; if (n.R && !Rr) continue; if (n.U && !t.U) continue; if (n.D && !t.D) continue;
          let w = 1;
          if (c.kind !== "path" && t.dead) w = 4;
          if (c.kind === "path" && t.dead) w = 0.15;
          /* Belohnungsräume am Ende eines Zweigs: lieber Kammern als Hindernisparcours */
          if (leaf && t.pk) w *= 0.35;
          if (leaf && t.dead) w *= 1.5;
          /* Startraum: ruhiger Boden – keine Parcours-/Gefahrenräume direkt am Eingang */
          if (c === startCell && (t.pk || t.n === "bruecke" || t.n === "grube")) w *= 0.02;
          if (t.pk) w *= (c.kind === "path" ? (B.parcours != null ? B.parcours : 9) : 1) * (t.U || t.D ? 0.45 : 1);
          /* W13 Runde 2: mehr Rundwege heißen weniger Räume mit nur links/rechts – Fähre und Sägewerk (beliebt) passen nur dort;
             etwas stärker gewichten, damit sie so oft vorkommen wie vor den Rundwegen (≈ 60 je 100 Karten) */
          if (t.n === "faehre" || t.n === "saegewerk") w *= FERRY_BOOST;
          /* W13 R6: Gebietsvorlagen bevorzugt; schon oft benutzte Vorlagen werden seltener (weniger Wiederholungsgefühl) */
          if (t.bio) w *= TPL_BIO_W;
          const nu = tplUse[t.n] || 0; if (nu) w /= 1 + nu * TPL_REP;
          const ru = runUse && runUse[t.n] || 0; if (ru) w /= 1 + ru * TPL_RUN; /* … und über den Lauf (frühere Gebiete) */
          /* weniger überflüssige Öffnungen = natürlicher */
          const extra = (L && !n.L) + (Rr && !n.R) + (t.U && !n.U) + (t.D && !n.D);
          w /= 1 + extra * 0.25;
          candidates.push({ t, mir, w });
        }
      });
      let sum = 0; candidates.forEach(c2 => (sum += c2.w));
      let pick = R() * sum, chosen = candidates[0];
      for (const c2 of candidates) { pick -= c2.w; if (pick <= 0) { chosen = c2; break; } }
      c.tpl = chosen.t.n; c.dead = !!chosen.t.dead; tplUse[chosen.t.n] = (tplUse[chosen.t.n] || 0) + 1;
      const rows = chosen.mir ? mirrorRows(chosen.t.r) : chosen.t.r;
      const ox = c.x * CW, oy = c.y * CH;
      for (let r = 0; r < CH; r++)
        for (let q = 0; q < CW; q++) {
          const ch = rows[r][q];
          let v = 0;
          if (ch === "#") v = 1; else if (ch === "-") v = 2; else if (ch === "^") v = 3; else if (ch === "H") v = 4; else if (ch === "~") v = B.hazard === "water" ? 6 : B.hazard === "lava" ? 5 : 3;
          else if (ch === "X") v = 7; else if (ch === "?") v = R.chance(0.5) ? 1 : 0;
          else if (ch === "A") v = 9; else if (ch === "c") v = 10; else if (ch === "m") v = 11; else if (ch === "q") { v = 6; qTiles.push((oy + r) * W + ox + q); } /* W13 R7: echtes Wasser (Gezeiten, sicher) */
          set(ox + q, oy + r, v);
          if ("ETSFbwpfkrjz<>moL".includes(ch)) marks.push({ t: ch === "<" || ch === ">" ? (chosen.mir ? (ch === "<" ? ">" : "<") : ch) : ch, x: ox + q, y: oy + r, cell: c });
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
        else if (n[s] === "G") seal(s, 1); /* Gittertor: bleibt zu, bis der Hebel auf der Zweigseite gezogen wird */
      }
    }
    /* Gittertore (Abkürzungen) merken: waagrecht beide Randspalten der Verbindung (Zeilen 8–10),
       senkrecht eine Falltür im Boden des oberen Zweigraums (Spalten 10–13) */
    const gates = [];
    for (const k in cells) {
      const c = cells[k];
      if (c.need.R === "G") {
        const o = cells[key(c.x + 1, c.y)]; if (!o) continue;
        const br = c.gate ? c : o, x = (c.x + 1) * CW - 1, y0 = c.y * CH + 8, tiles = [];
        for (let y = y0; y <= y0 + 2; y++) tiles.push([x, y], [x + 1, y]);
        gates.push({ x, y0, tiles, branch: key(br.x, br.y), other: key(br === c ? o.x : c.x, br === c ? o.y : c.y), side: br === c ? -1 : 1, open: false });
      }
      if (c.need.D === "G") {
        const o = cells[key(c.x, c.y + 1)]; if (!o) continue;
        const x = c.x * CW + 10, y0 = (c.y + 1) * CH - 2, tiles = [];
        /* W13: geöffnet wird die Falltür zum Treppenhaus – in Spalte 11 eine Leiter (dritter Wert = Kachel nach dem Öffnen),
           darunter hängt schon die Leiter im Hauptweg-Raum: man kommt also auch wieder hinauf (kein Einweg) */
        for (let q = 0; q < 4; q++) tiles.push([x + q, y0, q === 1 ? 4 : 0], [x + q, y0 + 1, q === 1 ? 4 : 0], [x + q, y0 + 2, q === 1 ? 4 : 0]);
        /* W13 R22: liegt der Zweig UNTEN (o.gateUnten), öffnet der Hebel im unteren Raum die Falltür – die Leiter führt dann hinauf */
        if (o.gateUnten) gates.push({ x, y0, tiles, vert: true, unten: true, branch: key(o.x, o.y), other: key(c.x, c.y), side: 0, open: false });
        else gates.push({ x, y0, tiles, vert: true, branch: key(c.x, c.y), other: key(o.x, o.y), side: 0, open: false });
      }
    }
    /* Außengebiete: oberste Raumreihe ohne Decke, damit der Himmel zu sehen ist */
    /* (Geheimräume behalten ihre Decke – sonst fiele man von oben hinein und säße hinter rissigen Wänden fest) */
    if (B.out) for (let x = 1; x < W - 1; x++) for (let y = 1; y <= 2; y++) if (!(cells[Math.floor(x / CW) + ",0"] && cells[Math.floor(x / CW) + ",0"].kind === "secret") && (get(x, y) === 1 && get(x, y + 1) !== 0 || y === 1)) { if (get(x, 3) === 0 || y === 1) set(x, y, 0); }
    /* Außenrand immer Fels */
    for (let x = 0; x < W; x++) { set(x, 0, 1); set(x, H - 1, 1); }
    for (let y = 0; y < H; y++) { set(0, y, 1); set(W - 1, y, 1); }
    /* senkrechte Verbindungen: Leitern einziehen, damit man auch wieder hinaufkommt */
    for (const k in cells) {
      const c = cells[k];
      if (c.need.U && c.need.U !== "X" && c.need.U !== "G") {
        const col = c.x * CW + 11;
        /* im oberen Raum durch dessen Boden */
        set(col, c.y * CH - 1, 4); set(col, c.y * CH - 2, 4);
        for (let r = c.y * CH; r < c.y * CH + CH; r++) { const v = get(col, r); if (v === 0 || v === 2) set(col, r, 4); else break; }
      }
    }
    /* W13: unter einer Falltür (Gittertor senkrecht) hängt die Leiter schon im unteren Raum bis zum Boden */
    for (const k in cells) {
      const c = cells[k];
      if (c.need.U !== "G") continue;
      const col = c.x * CW + 11;
      for (let r = c.y * CH + 1; r < c.y * CH + CH; r++) { const v = get(col, r); if (v === 0 || v === 2) set(col, r, 4); else break; }
    }
    /* senkrechte Geheimgänge: rissige Wand im Boden darf nicht über Leere hängen */
    /* Treppen und Leitern in Seitenräumen bleiben wie sie sind. Schwebende Einzelkacheln entfernen. */
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (get(x, y) === 1 && get(x - 1, y) === 0 && get(x + 1, y) === 0 && get(x, y - 1) === 0 && get(x, y + 1) === 0) set(x, y, 0);
    }
    /* Parcours: Gruben in lange Böden schlagen (nicht im Start-/Zielraum, nicht in Leiter-/Türspalten) */
    const carved = new Set();
    carvePits({ get, set, cells, startCell, endCell, W, carved }, R, B);
    /* Löcher im Boden: im Schloss führt jedes in die Etage darunter (Schacht, notfalls ein Grubenkeller im leeren
       Raster darunter) – sonst wird es eine sichtbare Bodenfalle. Echte Abgründe nur noch in Schlund und Zinnen. */
    const pitLog = resolvePits({ get, set, cells, W, H, gw, gh, carved, biome: biomeId, startCell }, R, B);
    /* Stacheln brauchen Boden */
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) if (get(x, y) === 3 && get(x, y + 1) !== 1) set(x, y + 1, 1);
    const lv = { biome: biomeId, seed, W, H, tiles, marks, cells, path, gw, gh, startCell, endCell, flow: B.flow, out: !!B.out, gates, pitLog, qTiles };
    lv.get = get; lv.set = set;
    placeSpecial(lv, R, B, opts);
    return lv;
  }

  function carvePits(lv, R, B) {
    const g = lv.get, chance = B.pits != null ? B.pits : 0.9;
    for (const k in lv.cells) {
      const c = lv.cells[k];
      if (c === lv.startCell || c === lv.endCell || c.kind === "secret" || /^(fasslager|weinregal|zisterne|stelzensteg)/.test(c.tpl || "") || !R.chance(c.kind === "path" ? chance : chance * 0.4)) continue; /* W13 R7: Fassrinne und Gezeitenbecken ohne Gruben */
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
        for (let x = gx; x < gx + gl; x++) for (let y = r; y <= Math.min(r + 2, oy + CH - 1); y++) { if (g(x, y) === 1) { lv.set(x, y, 9); if (lv.carved) lv.carved.add(y * lv.W + x); } else break; }
        /* manchmal ein bröckelnder Steg über der Grube */
        if (gl >= 3 && R.chance(0.3)) for (let x = gx; x < gx + gl; x++) lv.set(x, r, 10);
      }
    }
  }
  /* Echte Abgründe (Kachel 9) nur noch, wo sie hingehören: Felsspalten im Spinnenschlund und der Blick hinab über den Wolken
     an den Zinnen. Überall sonst (Schloss, Turm, See, Glutgassen) gilt: ein Loch im Boden führt in die Etage darunter –
     oder es ist sichtbar eine Bodenfalle (Stachelgrube, Lavarinne, Wasserbecken), sodass Schaden einen Grund hat. */
  const ABYSS = (Z.ABYSS = { schlund: 1, zinnen: 1 });
  const PIT_TRAP = (Z.PIT_TRAP = { schmiede: 5, glut: 5, hafen: 6, see: 6 }); /* sonst Stacheln (3) */
  const PIT_LAVA_ONLY = {}; /* (früher Glutgassen: nur Lavarinnen – zu viel Gefahrenschaden; jetzt auch dort Schächte) */
  const PIT_DROP = 9; /* Fallschaden ab 12 Kacheln (ebenen.js): Schächte bleiben mit Luft für einen Sprung darunter, sonst ein Zwischenpodest */
  function resolvePits(lv, R, B) {
    const g = lv.get, W = lv.W, H = lv.H, id = lv.biome, cells = lv.cells;
    const log = [];
    if (ABYSS[id]) return log;
    const trapTile = PIT_TRAP[id] || 3, gentle = !(B.tier || 0);
    /* Gruben ganz unten reichen bis in den Kartenrand: der bleibt Fels */
    for (let x = 0; x < W; x++) for (const y of [0, H - 1]) if (g(x, y) === 9) lv.set(x, y, 1);
    for (let y = 0; y < H; y++) for (const x of [0, W - 1]) if (g(x, y) === 9) lv.set(x, y, 1);
    const cellAt = (x, y) => cells[Math.floor(x / CW) + "," + Math.floor(y / CH)];
    const rockV = v => v === 1 || v === 7;
    /* Zusammenhängende Löcher sammeln */
    const done = new Uint8Array(W * H), comps = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (g(x, y) !== 9 || done[y * W + x]) continue;
      const q = [[x, y]], tiles = []; done[y * W + x] = 1;
      while (q.length) {
        const [a, b] = q.pop(); tiles.push([a, b]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = a + dx, ny = b + dy; if (nx < 1 || ny < 1 || nx >= W - 1 || ny >= H - 1 || done[ny * W + nx] || g(nx, ny) !== 9) continue; done[ny * W + nx] = 1; q.push([nx, ny]); }
      }
      comps.push(tiles);
    }
    /* Fall wie im Prüfer: bis die nächste Kachel nicht mehr Luft ist; Rückgabe Stehzeile oder -1 bei Gefahr darunter */
    let lastHaz = 0;
    const fallTo = (x, y) => { let yy = y; while (yy < H - 2 && g(x, yy + 1) === 0) yy++; const v = g(x, yy + 1); if (v === 1 || v === 2 || v === 4 || v === 7 || v === 8 || v === 10 || v === 11) return yy; /* auch bröckelnde Stege und Fährstrecken */ lastHaz = v * 100 + ((yy + 1) % CH); return -1; };
    /* von unten nach oben: tiefere Löcher sind schon aufgelöst, wenn ein Schacht darüber in sie hineinführt */
    comps.sort((a, b) => Math.min(...b.map(p => p[1])) - Math.min(...a.map(p => p[1])));
    for (const tiles of comps) {
      const cols = new Map();
      for (const [x, y] of tiles) { const c = cols.get(x); if (!c) cols.set(x, [y, y]); else { c[0] = Math.min(c[0], y); c[1] = Math.max(c[1], y); } }
      const xs = [...cols.keys()].sort((a, b) => a - b), x0 = xs[0], x1 = xs[xs.length - 1];
      const top = Math.min(...xs.map(x => cols.get(x)[0])), bot = Math.max(...xs.map(x => cols.get(x)[1]));
      const crumble = xs.some(x => g(x, cols.get(x)[0] - 1) === 10);
      /* Stehzeile neben dem Loch: höchste Bodenkante links oder rechts davon (Parcoursräume haben Luft über der Grube) */
      let stand = (crumble ? top - 1 : top) - 1;
      for (const sx of [x0 - 1, x1 + 1]) for (let y = top - 1; y >= top - 5; y--) if (g(sx, y) === 0 && rockV(g(sx, y + 1))) { stand = Math.min(stand, y); break; }
      const carvedPit = tiles.every(([x, y]) => lv.carved && lv.carved.has(y * W + x));
      const up = cellAt(x0, top);
      const undo = [], setU = (x, y, v) => { undo.push([x, y, g(x, y)]); lv.set(x, y, v); };
      const rollback = () => { for (let k = undo.length - 1; k >= 0; k--) lv.set(undo[k][0], undo[k][1], undo[k][2]); undo.length = 0; };
      const rec = { x0, x1, y: top, w: xs.length, cell: up ? up.x + "," + up.y : null, carved: carvedPit };
      /* Leiter in der Mitte, freie Spalten bekommen bei zu tiefem Fall ein Zwischenpodest (Steg) */
      const finishShaft = () => {
        const lx = xs[(xs.length - 1) >> 1], lb = fallTo(lx, top);
        if (lb < 0) return false;
        for (let yy = lb; yy >= top; yy--) { const v = g(lx, yy); if (v === 0 || v === 2) setU(lx, yy, 4); else if (v !== 4) break; }
        const free = xs.filter(x => x !== lx);
        let s = stand, maxD = 0;
        for (let k = 0; k < 8 && free.length; k++) {
          let D = 0, bad = false;
          for (const x of free) {
            /* ein bröckelnder Steg über dem Loch zählt nicht (er bricht weg), ebenso das eben gesetzte Podest (man lässt sich durchfallen) */
            const s1 = g(x, s + 1) === 10 || (k && g(x, s + 1) === 2) ? s + 1 : s, L = fallTo(x, s1);
            if (L < 0) { bad = true; break; } D = Math.max(D, L - s);
          }
          if (bad) return false;
          if (!k) maxD = D;
          rec.rest = D;
          if (D <= PIT_DROP) break;
          /* Podest möglichst in der Mitte, sonst etwas höher, wo der Schacht frei ist */
          let p = s + 1 + Math.min(PIT_DROP, Math.ceil(D / 2));
          const okRow = y => free.every(x => g(x, y) === 0 || g(x, y) === 4) && free.some(x => g(x, y) === 0);
          while (p > s + 3 && !okRow(p)) p--;
          if (!okRow(p)) break;
          for (const x of free) if (g(x, p) === 0) setU(x, p, 2);
          rec.podest = (rec.podest || 0) + 1; s = p - 1;
        }
        rec.drop = Math.max(maxD, lb - stand); return true;
      };
      if (!PIT_LAVA_ONLY[id]) {
        /* 1) Schacht: Loch und Fels darunter öffnen, bis ein Raum kommt (nicht in Geheimräume, nicht durch den Kartenrand) */
        let ok = true;
        for (const x of xs) {
          let yy = cols.get(x)[0];
          while (g(x, yy) === 9) { setU(x, yy, 0); yy++; }
          let n = 0;
          while (rockV(g(x, yy))) { const c = cellAt(x, yy); if (n >= 12 || yy >= H - 2 || (c && c.kind === "secret")) { ok = false; rec.why = yy >= H - 2 ? "rand" : c && c.kind === "secret" ? "geheim" : "dick"; break; } setU(x, yy, 0); yy++; n++; }
          if (!ok) break;
          const v = g(x, yy), c = cellAt(x, yy);
          if (!(v === 0 || v === 2 || v === 4 || v === 8 || v === 10 || v === 11) || !c || c.kind === "secret") { ok = false; rec.why = !c ? "leer" : c.kind === "secret" ? "geheim" : "ziel" + v; break; }
        }
        if (ok && finishShaft()) { rec.how = "schacht"; log.push(rec); continue; }
        if (ok) rec.why = "gefahr" + lastHaz;
        rollback();
        /* 2) Grubenkeller: leerer Rasterplatz darunter → eine kleine Kammer mit Leiter zurück (wird zur Sackgasse mit Lohn) */
        const cx = Math.floor(x0 / CW), cy = Math.floor(top / CH) + 1;
        if (up && Math.floor(x1 / CW) === cx && cy < lv.gh && !cells[cx + "," + cy] && up.kind !== "secret") {
          const ox = cx * CW, oy = cy * CH;
          const Ls = U.clamp(stand + PIT_DROP, oy + 5, oy + 10), t0 = Math.max(oy + 1, Ls - 5);
          const mid = Math.round((x0 + x1) / 2), half = R.int(6, 8);
          const a = U.clamp(Math.min(x0 - 2, mid - half), ox + 2, ox + CW - 3), b = U.clamp(Math.max(x1 + 2, mid + half), ox + 2, ox + CW - 3);
          for (const x of xs) for (let yy = cols.get(x)[0]; yy < t0; yy++) setU(x, yy, 0);
          for (let yy = t0; yy <= Ls; yy++) for (let x = a; x <= b; x++) setU(x, yy, 0);
          /* abgerundete Ecken und eine Nische, damit es nicht wie ein Kasten aussieht */
          for (const [x, y] of [[a, t0], [b, t0], [a, t0 + 1], [b, t0 + 1]]) if (!xs.includes(x)) setU(x, y, 1);
          if (R.chance(0.5)) { const nx = R.chance(0.5) ? a - 1 : b + 1; if (nx > ox + 1 && nx < ox + CW - 2) for (let yy = Ls - 2; yy <= Ls; yy++) setU(nx, yy, 0); }
          if (finishShaft()) {
            const nc = { x: cx, y: cy, need: { U: "P" }, kind: "side", depth: (up.depth || 0) + 1, dist: (up.dist != null ? up.dist : 0) + 1, root: up.root || (up.kind === "path" ? up : null), tpl: "grubenkeller", dead: true, pit: true };
            if (!nc.root) delete nc.root;
            cells[cx + "," + cy] = nc; up.need.D = up.need.D || "P";
            rec.how = "keller"; log.push(rec); continue;
          }
          rollback();
        }
      }
      /* 3) kein Weg nach unten: gefräste Gruben im Torhof (und mit etwas Glück auch sonst) einfach zuschütten,
            sonst sichtbare Bodenfalle – flach, mit Fels darunter */
      if (carvedPit && !PIT_LAVA_ONLY[id] && (gentle || !R.chance(Math.min(0.8, 0.2 + trapDens(B) * 0.6)))) {
        for (const [x, y] of tiles) lv.set(x, y, 1);
        if (crumble) for (const x of xs) if (g(x, top - 1) === 10) lv.set(x, top - 1, 1);
        rec.how = "zu"; log.push(rec); continue;
      }
      /* Fairness: Gruben gleich hinter einem Raumdurchgang (Randspalten) und im Torhof werden harmlose Mulden;
         Wasserbecken (Hafen, See) nur jedes zweite Mal, auf dem Hauptweg höchstens jedes dritte Mal eine Falle */
      const rel0 = x0 - Math.floor(x0 / CW) * CW, rel1 = x1 - Math.floor(x0 / CW) * CW;
      const atEdge = rel0 < 3 || rel1 > CW - 4;
      const onPath = up && up.kind === "path";
      if (gentle || atEdge || (trapTile === 6 && R.chance(0.5)) || (onPath && carvedPit) || (onPath && R.chance(0.35))) {
        /* Torhof: eine harmlose Mulde (eine Kachel tief) statt Stacheln – man steigt einfach wieder heraus */
        for (const x of xs) { const [t, b] = cols.get(x); for (let yy = t; yy <= b; yy++) lv.set(x, yy, 1); if (!crumble) lv.set(x, t, 0); else lv.set(x, t - 1, 0); }
        rec.how = "mulde"; log.push(rec); continue;
      }
      for (const x of xs) {
        const [t, b] = cols.get(x), deep = b > t && !crumble;
        for (let yy = t; yy <= b; yy++) lv.set(x, yy, 1);
        const ty = deep ? t + 1 : t;
        if (deep) lv.set(x, t, 0);
        lv.set(x, ty, trapTile); (rec.trapTiles = rec.trapTiles || []).push(ty * W + x);
        if (trapTile !== 3 && deep) lv.set(x, t, trapTile === 6 ? 6 : 0); /* Becken: Wasser bis zum Rand, Lava etwas tiefer */
        if (!rockV(g(x, ty + 1))) lv.set(x, ty + 1, 1);
      }
      rec.how = trapTile === 3 ? "stacheln" : trapTile === 5 ? "lava" : "wasser"; log.push(rec);
    }
    return log;
  }
  /* Fallen auf normale Räume streuen – je Gebiet passend */
  /* Jedes Gebiet hat sein eigenes Fallensystem (Mechanik und Zeichnung in fallen.js). Liste = Ziehgewicht (Mehrfachnennung);
     alte Zeichen (k r p f z < j) sind die Grundfallen aus parcours.js, die dort je Gebiet eingefärbt werden. */
  const TRAPKINDS = {
    torhof: "baerenfalle baerenfalle ziegel ziegel fallgitter k",
    keller: "gaerfass gaerfass rollfass rattenloch rattenloch k r",
    hallen: "kronleuchter kronleuchter ruestung ruestung gobelin gobelin k",
    wehrgang: "pechnase pechnase balliste balliste boee k p",
    verlies: "folterrad folterrad bodenluke bodenluke morgenstern morgenstern k <",
    hafen: "kranhaken kranhaken tentakel tentakel netz netz j k",
    glocken: "glocke glocke gewicht gewicht zahnrad zahnrad k",
    schlund: "netzfalle netzfalle eiersack eiersack giftspinne giftspinne f",
    schmiede: "hammer hammer funkenregen funkenregen runenstrahl runenstrahl f z",
    zinnen: "blitzableiter blitzableiter zinnenbruch zinnenbruch boee p j",
    see: "algen algen gassaeule gassaeule seeschlange seeschlange j",
    glut: "lavafontaene lavafontaene feuerspeier feuerspeier glutkessel glutkessel f z",
    sturm: "blitz blitz hagel hagel boee p k"
  };
  /* Platzierungsart je neuer Falle: boden (Bodenplatz), tor (Boden mit Decke 3–6 darüber), decke (hängt, freier Fall 3–9),
     pendel (Fallhöhe ≥ 7), wand (aus einer Seitenwand, Lauf ≥ 6), spann (Bodenlauf ≥ 5), luft (weiter Bodenlauf, viel Kopfraum, kein Abgrund) */
  const TRAPPLACE = {
    baerenfalle: "boden", fallgitter: "tor", ziegel: "decke", gaerfass: "boden", rollfass: "spann", rattenloch: "wand",
    kronleuchter: "decke", ruestung: "boden", gobelin: "wand", pechnase: "decke", balliste: "wand", boee: "luft",
    folterrad: "boden", bodenluke: "boden", morgenstern: "decke", kranhaken: "pendel", tentakel: "boden", netz: "decke",
    glocke: "pendel", gewicht: "decke", zahnrad: "spann", netzfalle: "boden", eiersack: "decke", giftspinne: "decke",
    hammer: "decke", funkenregen: "decke", runenstrahl: "wand", blitzableiter: "boden", zinnenbruch: "decke",
    algen: "boden", gassaeule: "boden", seeschlange: "boden", lavafontaene: "boden", feuerspeier: "wand", glutkessel: "decke",
    blitz: "luft", hagel: "luft",
    k: "boden", f: "boden", j: "boden", r: "decke", p: "pendel", z: "spann", "<": "wand"
  };
  Z.TRAPKINDS = TRAPKINDS; Z.TRAPPLACE = TRAPPLACE;
  const trapKeep = {};
  /* Fallendichte: im Torhof (Stufe 0) nur ein Hauch, danach steigt sie mit der Tiefe; Totenkopf-Schädel und der Pakt „Fallensteller“ legen nach */
  function trapDens(B) {
    const sk = Z.run ? Z.run.skulls || 0 : 0, t = B.tier || 0;
    let d = t === 0 ? 0.2 : 0.26 + 0.11 * t;
    d += 0.09 * sk;
    if (Z.hasPact && Z.hasPact("fallen")) d *= 2;
    return Math.min(1.8, d);
  }
  Z.trapDens = trapDens;
  function sprinkleTraps(lv, R, B, avoid) {
    const list = (TRAPKINDS[lv.biome] || "").split(" ").filter(Boolean); if (!list.length) return; lv.traps = lv.traps || [];
    /* W13 R17: Gebietsvariante „Fallengänge“ (abenteuer.js Z.fallenFaktor): eigener Faktor, engere Abstände und mehr Versuche je Raum */
    const vf = (Z.fallenFaktor && Z.fallenFaktor()) || 1;
    const g = lv.get, solid = v => v === 1 || v === 7, taken = [], dens = Math.min(vf > 1 ? 3.2 : 1.8, trapDens(B) * vf), tier = B.tier || 0, gap = vf > 1 ? 4 : 5;
    const st = lv.start || { x: -99, y: -99 };
    /* im ersten Gebiet: die ersten Schritte bleiben frei, Fallen erst ein gutes Stück hinter dem Eingang */
    const farFromStart = (x, y) => tier > 0 || Math.abs(x - st.x) + Math.abs(y - st.y) > 26;
    const free = (x, y) => !avoid(x, y) && farFromStart(x, y) && !taken.some(([a, b]) => Math.abs(a - x) < gap && Math.abs(b - y) < 3) && !(lv.traps || []).some(t => Math.abs(t.x - x) < gap - 1 && Math.abs(t.y - y) < 3);
    const add = (t, x, y, o) => { lv.traps.push(Object.assign({ t, x, y }, o || {})); taken.push([x, y]); };
    const floorAt = (x, y) => { for (let yy = y; yy < y + 10 && yy < lv.H - 1; yy++) if (standable(lv, x, yy, 3)) return yy; return -1; };
    const ceilAt = (x, y) => { for (let yy = y; yy > y - 10 && yy > 0; yy--) if (g(x, yy) === 0 && solid(g(x, yy - 1))) return yy; return -1; };
    const dropOf = (x, y, max) => { let d = 0; while (d < max && g(x, y + d + 1) === 0) d++; return d; };
    const noVoid = (x0, x1, y) => { for (let x = x0 - 3; x <= x1 + 3; x++) for (let yy = y; yy <= y + 3; yy++) { const v = g(x, yy); if (v === 9 || v === 5 || v === 6) return false; } return true; };
    /* keine Kombi-Fallen: Bodenfallen nicht direkt neben Gruben, Schachtöffnungen, Stacheln oder Flüssigkeit */
    const pitNear = (x0, x1, fy) => { for (let x = x0 - 2; x <= x1 + 2; x++) { const v = g(x, fy + 1), w = g(x, fy); if (v === 0 || v === 3 || v === 5 || v === 6 || v === 9 || w === 3 || w === 5 || w === 6) return true; } return false; };
    const runOf = (x, y, max) => { let x1 = x; while (x1 - x < max && standable(lv, x1 + 1, y, 3) && g(x1 + 1, y + 1) === 1) x1++; return x1; };
    function tryPlace(kind, x, y) {
      const pl = TRAPPLACE[kind] || "boden";
      if (pl === "boden") {
        const fy = floorAt(x, y); if (fy < 0 || !free(x, fy)) return false;
        if (!(standable(lv, x, fy, 3) && standable(lv, x - 1, fy, 3) && standable(lv, x + 1, fy, 3) && g(x, fy + 1) === 1 && g(x - 1, fy + 1) !== 9 && g(x + 1, fy + 1) !== 9)) return false;
        if (pitNear(x, x, fy)) return false;
        add(kind, x, fy); return true;
      }
      if (pl === "tor") {
        const fy = floorAt(x, y); if (fy < 0 || !free(x, fy)) return false;
        if (!(standable(lv, x - 1, fy, 3) && standable(lv, x + 1, fy, 3) && g(x, fy + 1) === 1) || pitNear(x, x, fy)) return false;
        let h = 0; while (h < 10 && g(x, fy - h - 1) === 0) h++;
        if (h < 2 || h > 9 || !solid(g(x, fy - h - 1))) return false; /* auch unter höheren Bögen (Torhof hat hohe Räume) */
        add(kind, x, fy, { h: h + 1 }); return true;
      }
      if (pl === "decke" || pl === "pendel") {
        const cy = ceilAt(x, y); if (cy < 0) return false;
        const d = dropOf(x, cy, 13), fy = cy + d;
        if (pl === "decke" ? d < 3 || d > 9 : d < 7) return false;
        if (kind === "kronleuchter" && d < 5) return false;
        if (kind === "hammer" && d > 6) return false;
        if (!standable(lv, x, fy, 2) || !free(x, fy) || !free(x, cy)) return false;
        add(kind, x, cy, { d }); return true;
      }
      if (pl === "wand") {
        let fy = floorAt(x, y); if (fy < 0) return false;
        /* am Boden entlang bis zur nächsten Wand gehen – dort sitzt die Falle */
        for (let s = 0, dd = x < (Math.floor(x / CW) * CW + CW / 2) ? -1 : 1; s < 12 && standable(lv, x + dd, fy, 2); s++) x += dd;
        if (!free(x, fy)) return false;
        for (const dir of [1, -1]) {
          if (!solid(g(x - dir, fy - 1)) || !solid(g(x - dir, fy))) continue;
          let run = 0; while (run < 9 && g(x + dir * (run + 1), fy - 1) === 0) run++;
          if (run >= 6) { if (kind === "<") add(dir > 0 ? ">" : "<", x, fy - 1); else add(kind, x, fy, { dir, run }); return true; }
        }
        return false;
      }
      if (pl === "spann" || pl === "luft") {
        const fy = floorAt(x, y); if (fy < 0 || !free(x, fy)) return false;
        while (standable(lv, x - 1, fy, 3) && g(x - 1, fy + 1) === 1 && x > Math.floor(x / CW) * CW + 1 && pl === "luft") x--;
        const x1 = runOf(x, fy, pl === "luft" ? 9 : 7), need = pl === "luft" ? 5 : 4;
        if (x1 - x < need || pitNear(x, x1, fy)) return false;
        if (pl === "luft") { for (let q = x; q <= x1; q++) for (let h = 1; h <= 3; h++) if (g(q, fy - h) !== 0 && g(q, fy - h) !== 4) return false; if (kind === "boee" && !noVoid(x, x1, fy)) return false; }
        if (kind === "z") { for (let q = x; q <= x1; q++) lv.traps.push({ t: "z", x: q, y: fy }); taken.push([x, fy]); return true; }
        add(kind, x, fy, { x1 }); return true;
      }
      return false;
    }
    for (const k in lv.cells) {
      const c = lv.cells[k];
      if (c === lv.startCell || c.kind === "secret") continue;
      /* Wahrscheinlichkeit je Raum; über 1 hinaus (Schädel, Pakt) gibt es mehr Fallen pro Raum */
      const p = (c.kind === "path" ? 0.8 : 0.4) * dens;
      let want = 0; for (let q = p; q > 0; q -= 1) if (R.chance(Math.min(1, q))) want++;
      if (want && tier > 0 && R.chance(0.3)) want++;
      const ox = c.x * CW, oy = c.y * CH;
      for (let n = 0, tries = 0; n < want && tries < 40 * vf; tries++) {
        const kind = list[R.int(0, list.length - 1)], x = ox + R.int(2, CW - 3), y = oy + R.int(1, CH - 3);
        if (tryPlace(kind, x, y)) n++;
      }
    }
    /* Torhof: zwei, drei harmlose Lehrstücke (Bärenfalle, Dachziegel) gibt es immer – weit hinter dem Eingang, auf dem Hauptweg */
    if (!tier) {
      const path = Object.keys(lv.cells).map(k => lv.cells[k]).filter(c => c.kind === "path" && c !== lv.startCell);
      let have = lv.traps.filter(t => t.t === "baerenfalle" || t.t === "ziegel").length;
      for (let tries = 0; have < 2 && tries < 80 && path.length; tries++) {
        const c = path[R.int(0, path.length - 1)], kind = have ? "ziegel" : "baerenfalle";
        if (tryPlace(kind, c.x * CW + R.int(2, CW - 3), c.y * CH + R.int(1, CH - 3))) have++;
      }
    }
  }
  /* Standplätze finden: Luft mit festem Boden darunter und Kopffreiheit */
  function standable(lv, x, y, head) {
    const g = lv.get, below = g(x, y + 1);
    if (g(x, y) !== 0) return false;
    for (let i = 1; i < (head || 2); i++) if (g(x, y - i) !== 0) return false;
    if (!(below === 1 || below === 2 || below === 8)) return false;
    /* nach der Prüfung: nur Plätze, die der Spieler erreichen kann (oder in Geheimräumen hinter rissigen Wänden) –
       so landen Truhen, Seiten, Spuren und Gegner nie auf unerreichbaren Simsen */
    if (lv.reach && lv.W && !lv.reach[y * lv.W + x]) { const c = lv.cells && lv.cells[Math.floor(x / CW) + "," + Math.floor(y / CH)]; if (!c || c.kind !== "secret") return false; }
    return true;
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
    for (const k in trapKeep) delete trapKeep[k];
    lv.spawns = []; lv.loot = []; lv.props = []; lv.doors = []; lv.decor = [];
    /* Start: im ersten Raum ein Platz für die Eingangstür */
    let sp = spotsIn(lv, lv.startCell, 3, true);
    if (!sp.length) sp = spotsIn(lv, lv.startCell, 2, false);
    sp.sort((a, b) => Math.abs(a[0] - (lv.startCell.x * CW + 12)) - Math.abs(b[0] - (lv.startCell.x * CW + 12)));
    const st = sp[0] || [lv.startCell.x * CW + 12, lv.startCell.y * CH + 10];
    lv.start = { x: st[0], y: st[1] };
    lv.doors.push({ kind: "entry", x: st[0], y: st[1] });
    /* Ausgänge über das ganze Gebiet verteilt – dort, wo sie hinführen:
       Wege in die Tiefe (Keller, Verlies, Schlund, See …) liegen unten, Wege nach oben (Wehrgang, Turm, Zinnen …) oben,
       alles andere auf mittlerer Höhe und möglichst weit vom Eingang. */
    const exits = opts.exits || B.exits || [];
    const VDIR = { keller: 1, verlies: 1, schlund: 1, see: 1, hafen: 0.6, labor: 1, glut: 0.5, demogorgon: 1, themberchaud: 0.5,
      wehrgang: -1, glocken: -1, zinnen: -1, sturm: -1, wachturm: -1, venomfang: -1, erzpriesterin: 0.3, hallen: 0, schmiede: 0, stollen: 1 /* W49 Kapitel */ };
    const gh = lv.gh, sc = lv.startCell;
    const cellsAll = Object.keys(lv.cells).map(k => lv.cells[k]).filter(c => c.kind !== "secret");
    const used = [], chosen = [];
    const Ls = lv.path ? lv.path.length - 1 : 4, exW = (LAYOUT[lv.biome] || {}).ex || [0.8, 1], exLo = exW[0], exHi = exW[1];
    const order = exits.map((to, i) => ({ to, i, v: VDIR[to] != null ? VDIR[to] : 0 })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    /* W13: Gebietsübergänge logisch an der Kante – nach oben in einem Raum, über dem nichts mehr liegt (oberste Zelle
       seiner Spalte), nach unten in der untersten Zelle der Spalte, waagrecht am linken/rechten Ende einer Raumreihe
       (bei Durchgangsgebieten am Ende, weg vom Eingang). Notfalls an einer Außenwand in der passenden Kartenhälfte. */
    const colMin = {}, colMax = {}, rowMin = {}, rowMax = {};
    for (const c of cellsAll) {
      colMin[c.x] = Math.min(colMin[c.x] != null ? colMin[c.x] : 99, c.y); colMax[c.x] = Math.max(colMax[c.x] != null ? colMax[c.x] : -1, c.y);
      rowMin[c.y] = Math.min(rowMin[c.y] != null ? rowMin[c.y] : 99, c.x); rowMax[c.y] = Math.max(rowMax[c.y] != null ? rowMax[c.y] : -1, c.x);
    }
    const edgeOf = (c, v) => {
      const ry = gh > 1 ? c.y / (gh - 1) : 0.5, sideL = c.x === rowMin[c.y], sideR = c.x === rowMax[c.y];
      /* Seite: bei Durchgangsgebieten nur die dem Eingang abgewandte */
      const far = B.flow === "through" ? (sc.x <= lv.gw / 2 ? sideR : sideL) : sideL || sideR;
      if (v < -0.4) return c.y === colMin[c.x] ? { s: 2, w: 0 } : far && ry <= 0.5 ? { s: 1, w: sideL ? -1 : 1 } : { s: 0 };
      if (v > 0.4) return c.y === colMax[c.x] ? { s: 2, w: 0 } : far && ry >= 0.5 ? { s: 1, w: sideL ? -1 : 1 } : { s: 0 };
      /* waagrecht in einem Durchgangsgebiet: die Tür zumindest an die Wand in Laufrichtung (weg vom Eingang) */
      return far ? { s: 2, w: sideL ? -1 : 1 } : { s: 0, w: B.flow === "through" ? (sc.x <= lv.gw / 2 ? 1 : -1) : 0 };
    };
    for (const ex of order) {
      let best = null, bs = -1e9;
      for (const c of cellsAll) {
        if (c === sc && cellsAll.length > 2) continue;
        const ry = gh > 1 ? c.y / (gh - 1) : 0.5;
        const want = ex.v > 0 ? 1 : ex.v < 0 ? 0 : 0.5;
        let sc2 = -Math.abs(ry - want) * 10 * (Math.abs(ex.v) || 0.6);
        /* Weglänge: der Ausgang liegt gegen Ende des Hauptwegs – nicht hinter dem längsten Nebenzweig
           (größere Karten heißen mehr zu erkunden, aber nicht endlos weit bis zur Tür) */
        const dd = c.dist != null ? c.dist : Math.abs(c.x - sc.x) + Math.abs(c.y - sc.y);
        sc2 -= Math.max(0, Ls * exLo - dd) * 3 + Math.max(0, dd - (Ls * exHi + 1 + chosen.length * 1.5)) * 2.6 + (c.depth || 0) * 1.4;
        /* Ausgänge nicht gleich neben dem Eingang (sonst ist das Gebiet in Sekunden durchquert) */
        if (Math.abs(c.x - sc.x) + Math.abs(c.y - sc.y) < 2) sc2 -= 20;
        for (const u of used) sc2 -= Math.max(0, 4 - (Math.abs(c.x - u.x) + Math.abs(c.y - u.y))) * 3;
        if (used.includes(c)) sc2 -= 50;
        if (c === lv.endCell) sc2 += 2.5;
        /* W13 R19 (Balance-Meldung): in Wächtergebieten liegen alle Ausgänge im Wächterraum (= endCell) – sonst stand man vor
           verschlossenen Türen und musste den Wächter woanders suchen (Zinnen/Schmiede/Glut: bis 10 von 12 Karten) */
        if (B.warden) sc2 += c === lv.endCell ? 100 : -100;
        if (c.kind === "path") sc2 += 1.2;
        /* Kante zählt voll nur bei passender Weglänge – sonst rückte der Ausgang zu nah an den Eingang (Balance) */
        const ed = edgeOf(c, ex.v); sc2 += ed.s * (exits.length === 1 ? (dd >= Ls * exLo && dd <= Ls * exHi ? 3.2 : 0.3) : dd >= Ls * exLo - 0.5 && dd <= Ls * exHi + 1 ? 1.4 : 0.3); /* nur ein Ausgang (Glut, Hafen …): Kante zählt mehr */
        sc2 += R() * 0.5;
        let spots = spotsIn(lv, c, 3, true); if (!spots.length) spots = spotsIn(lv, c, 3, false);
        spots = spots.filter(p => !chosen.some(q => Math.abs(q[0] - p[0]) < 4 && Math.abs(q[1] - p[1]) < 3) && Math.abs(p[0] - st[0]) + Math.abs(p[1] - st[1]) > 14);
        if (!spots.length) continue;
        if (sc2 > bs) { bs = sc2; best = { c, spots, ed }; }
      }
      let p;
      if (best) {
        /* Platz im Raum: nach oben möglichst hoch, nach unten möglichst tief, an der Außenwand möglichst nah an ihr
           (aber nicht in den Durchgang zum Nachbarraum: Randspalten bleiben frei) */
        const ox = best.c.x * CW, wx = best.ed.w > 0 ? ox + CW - 4 : best.ed.w < 0 ? ox + 3 : ox + 12;
        const yk = a => (ex.v > 0.4 ? -a[1] : ex.v < -0.4 ? a[1] : 0) * 3;
        const sp2 = best.spots.filter(a => a[0] > ox + 2 && a[0] < ox + CW - 3);
        const sp3 = (sp2.length ? sp2 : best.spots).slice().sort((a, b) => yk(a) + Math.abs(a[0] - wx) - (yk(b) + Math.abs(b[0] - wx)));
        p = sp3[Math.min(sp3.length - 1, R.int(0, Math.min(2, sp3.length - 1)))]; used.push(best.c);
      } else {
        const oy = lv.endCell.y * CH, ox = lv.endCell.x * CW;
        for (let x = ox + 2; x < ox + CW - 2; x++) { for (let y = oy + 8; y <= oy + 11; y++) lv.set(x, y, 0); lv.set(x, oy + 12, 1); }
        const e2 = spotsIn(lv, lv.endCell, 3, true).filter(p2 => !chosen.some(q => Math.abs(q[0] - p2[0]) < 4 && Math.abs(q[1] - p2[1]) < 3));
        p = e2[0] || [ox + 6 + chosen.length * 5, oy + 11];
      }
      chosen.push(p);
      ex.p = p;
    }
    order.sort((a, b) => a.i - b.i).forEach(ex => lv.doors.push({ kind: "exit", to: ex.to, x: ex.p[0], y: ex.p[1], dir: ex.v > 0.4 ? "down" : ex.v < -0.4 ? "up" : "mid" }));
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
      /* W13 R7: Fassrutsche (rollende Fässer) und Kronleuchter zum Schwingen (erkundung.js) */
      if (m.t === "o" && (lv.rollers || []).length < 2) (lv.rollers = lv.rollers || []).push({ x: m.x, y: m.y, cell: m.cell.x + "," + m.cell.y, dir: m.x - m.cell.x * CW < CW / 2 ? 1 : -1 });
      if (m.t === "L" && (lv.swings || []).length < 2) (lv.swings = lv.swings || []).push({ x: m.x, y: m.y, cell: m.cell.x + "," + m.cell.y });
      if ("pfkrjz<>m".includes(m.t)) {
        /* keine Falle direkt am Eingang (Federn und Fähren bleiben – sie gehören zum Weg) */
        if ("fkrz<>".includes(m.t) && Math.abs(m.x - startPx) < 9 && Math.abs(m.y - startPy) < 6) continue;
        if (m.t === "p" && Math.abs(m.x - startPx) < 15 && Math.abs(m.y - startPy) < 12) continue; /* Pendel schwingen weit */
        /* Fallen nehmen über den Lauf zu: im Torhof wenige, in der Tiefe alle (Federn und Fähren bleiben immer) */
        if (!"jm".includes(m.t)) { if (!(B.tier || 0) && "pfz<>".includes(m.t)) continue; /* Torhof: sanfter Einstieg – nur gut sichtbare, langsame Fallen */ const k = (m.cell ? m.cell.x + "," + m.cell.y : "") + m.t; trapKeep[k] = trapKeep[k] != null ? trapKeep[k] : R() < Math.min(1, trapDens(B) * 0.85); if (!trapKeep[k]) continue; }
        (lv.traps = lv.traps || []).push({ t: m.t, x: m.x, y: m.y });
      }
    }
    /* Fallen über die Karte verteilen, nicht direkt an Start und Türen */
    sprinkleTraps(lv, R, B, (x, y) => nearStart(x, y) || nearDoor(x, y) || lv.doors.some(d => Math.abs(d.x - x) < 5 && Math.abs(d.y - y) < 4));
    /* zusätzliche Gegner auf zufälligen Bodenplätzen, damit jede Karte gut gefüllt ist */
    const allSpots = [];
    for (const k in lv.cells) spotsIn(lv, lv.cells[k], 2, false).forEach(p => allSpots.push(p));
    R.shuffle(allSpots);
    /* Hauptweg wie gehabt gut gefüllt, Nebenzweige etwas lichter (dort warten Wächter und Prüfungen) */
    let nPath = 0, nSide = 0; for (const k in lv.cells) { if (lv.cells[k].kind === "path") nPath++; else nSide++; }
    const want = Math.round((nPath * 2.6 + nSide * 1.7) * dens);
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
  /* Prüfung auf dem Kachelgitter (Sprungweiten passend zur Spielerphysik: Einfachsprung ~3,5 Kacheln, Doppelsprung ~6,4,
     Kantengriff): (1) alle Ausgänge sind vom Start aus erreichbar, (2) von jedem erreichbaren Platz führt ein Weg
     zurück zu einem Ausgang – keine Gruben oder Kammern ohne Rückweg. Wege müssen frei sein: kein Springen durch Böden,
     kein Stehen auf Lava, Wasser, Stacheln oder über dem Abgrund. Ergebnis: lv.reach, lv.stuck.
     ab (optional, Bewegungs-Runen aus runen.js): { wall: Wandrutschen/Wandsprung, jump3: dritter Sprung, glide: Gleiten,
     dash: Schattensprint (weiter, flach durch Schattenspalten), rings: [{x,y}] Ösen für den Enterhaken, updrafts:
     [{x0,x1,y0,y1}] Aufwindschächte (nur mit glide) }. Nebelgitter und rissige Böden öffnet der Aufrufer über die Kacheln.
     Zwischenknoten (an der Wand, an der Öse, oben im Aufwind) sind keine Stehplätze; sie gehören nur zur Runen-Prüfung.
     Ohne ab läuft die Prüfung genau wie bisher. */
  function validate(lv, ab, comfy) {
    /* W13: comfy = „bequeme“ Reichweite für echte Spieler/Handheld: höchstens 4 hoch (5/4/3 weit), waagrecht 5 weit */
    const UPN = comfy ? 4 : 6, WIDE = comfy ? 5 : 7;
    /* Abgrund zählt als unbetretbar, bröckelnde Stege und Fährstrecken wie Stege */
    const W = lv.W, H = lv.H, N = W * H;
    /* Kacheln einmal vorab umsetzen (schneller als je Abfrage über lv.get – die großen Karten haben 2–3× so viele Plätze) */
    const gm = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = lv.get(x, y); gm[y * W + x] = v === 9 ? 99 : v === 10 || v === 11 ? 2 : v === 12 ? 0 : v; }
    const g = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : gm[y * W + x]);
    const passable = v => v === 0 || v === 2 || v === 4 || v === 8;
    const air = v => passable(v) || v === 6 || v === 5 || v === 3 || v === 99; /* Körper kann hindurch (Gefahr, aber kein Hindernis) */
    const canStand0 = (x, y) => passable(g(x, y)) && g(x, y) !== 2 && g(x, y) !== 8 && passable(g(x, y - 1)) && (g(x, y + 1) === 1 || g(x, y + 1) === 2 || g(x, y + 1) === 7 || g(x, y + 1) === 8 || g(x, y + 1) === 4 || g(x, y) === 4);
    const csA = new Uint8Array(N); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (canStand0(x, y)) csA[y * W + x] = 1;
    const canStand = (x, y) => x >= 0 && y >= 0 && x < W && y < H && csA[y * W + x] === 1;
    const seen = new Uint8Array(N), q = [], ea = [], eb = [];
    let from = -1;
    const push = (x, y) => { if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; const i = y * W + x; if (!canStand(x, y)) return; if (from >= 0 && from !== i) { ea.push(from); eb.push(i); } if (seen[i]) return; seen[i] = 1; q.push(i); };
    /* freier Körperplatz (2 Kacheln hoch) */
    const body = (x, y) => air(g(x, y)) && air(g(x, y - 1));
    /* Fallen: bis zum ersten Halt; Gefahren (Abgrund, Flüssigkeit) beenden den Fall ohne Halt */
    const fall = (x, y) => { let yy = y; while (yy < H - 1 && passable(g(x, yy + 1)) && g(x, yy + 1) !== 2 && g(x, yy + 1) !== 8 && g(x, yy + 1) !== 4) yy++; return yy; };
    const colFree = (x, ya, yb) => { for (let y = ya; y <= yb; y++) if (!air(g(x, y))) return false; return true; };
    const RA = ab ? runeMoves(ab, { W, H, g, passable, air, canStand, push, seen, q, fall, colFree, body, setFrom: v => (from = v), edge: (a, b) => { ea.push(a); eb.push(b); } }) : null;
    push(lv.start.x, lv.start.y);
    while (q.length) {
      const i = q.pop(), x = i % W, y = (i / W) | 0; from = i;
      const virt = RA ? !canStand(x, y) : false;
      if (RA) RA.node(x, y, virt, i);
      if (virt) continue;
      /* Leiter hinauf / hinunter */
      if (g(x, y) === 4 || g(x, y - 1) === 4) { let yy = y; while (g(x, yy - 1) === 4 || (g(x, yy) === 4 && passable(g(x, yy - 1)))) { yy--; push(x, yy); if (yy < 1) break; } }
      if (g(x, y + 1) === 4) { let yy = y + 1; while (g(x, yy) === 4) { push(x, yy); yy++; } push(x, fall(x, yy - 1)); }
      if (g(x, y) === 4 && g(x, y + 1) === 4) { let yy = y + 1; while (g(x, yy) === 4) { push(x, yy); yy++; } push(x, fall(x, yy - 1)); }
      /* Laufen und von Kanten fallen (mit etwas Steuerung in der Luft, aber nicht durch Wände) */
      for (let d = -1; d <= 1; d += 2) { /* W39 Leistung: ohne Array je Knoten */
        const nx = x + d;
        if (!passable(g(nx, y)) || !passable(g(nx, y - 1))) continue;
        if (canStand(nx, y)) { push(nx, y); continue; }
        for (let dx = 0; dx <= 3; dx++) {
          const fx = nx + d * dx;
          if (dx && !body(fx, y)) break;
          const fy = fall(fx, y);
          /* seitliches Abdriften braucht etwas Fallhöhe */
          if (dx >= 2 && fy - y < dx + 1) continue;
          if (canStand(fx, fy)) push(fx, fy);
        }
      }
      /* Durch Stege fallen */
      if (g(x, y + 1) === 2 || g(x, y + 1) === 8) push(x, fall(x, y + 1));
      /* Springen nach oben: Kopfraum über dem Startplatz frei, dann waagrecht in Zielhöhe (Füße und Kopf frei) */
      for (let dy = 1; dy <= UPN; dy++) {
        if (!passable(g(x, y - dy - 1)) && g(x, y - dy - 1) !== 2) break;
        const maxDx = comfy ? (dy <= 2 ? 5 : dy <= 3 ? 4 : 3) : dy <= 2 ? 6 : dy <= 3 ? 5 : dy <= 5 ? 4 : 2;
        for (let dx = -maxDx; dx <= maxDx; dx++) {
          const tx = x + dx, ty = y - dy;
          if (!canStand(tx, ty)) continue;
          let ok = true; const s = dx > 0 ? 1 : dx < 0 ? -1 : 0;
          for (let k = s; k !== dx; k += s) { const a = g(x + k, ty - 1), b = g(x + k, ty); if ((!air(a) && a !== 2) || (!air(b) && b !== 2)) { ok = false; break; } }
          if (ok) push(tx, ty);
        }
      }
      /* weite Sprünge auf gleicher Höhe / nach unten: über die Lücke in Kopfhöhe, dann senkrecht hinab */
      for (let dx = -WIDE; dx <= WIDE; dx++) {
        if (!dx) continue;
        const s = dx > 0 ? 1 : -1; let ok = true;
        for (let k = s; k !== dx + s; k += s) if (!air(g(x + k, y - 1)) || !air(g(x + k, y - 2)) && Math.abs(k) > 1) { ok = false; break; }
        if (!ok) continue;
        const tx = x + dx;
        for (let dy = 0; dy <= 4; dy++) { const ty = y + dy; if (!colFree(tx, y - 1, ty)) break; if (canStand(tx, ty)) { push(tx, ty); break; } }
      }
    }
    from = -1;
    lv.reach = seen;
    if (lv._wantEdges) lv._edges = [ea, eb]; /* Kartengraph-Analyse (Tests): Kachelkanten mitgeben */
    const exits = lv.doors.filter(d => d.kind === "exit");
    for (const d of exits) if (!seen[d.y * W + d.x]) return false;
    /* Rückweg: rückwärts von den Ausgängen über dieselben Kanten */
    const head = new Int32Array(N).fill(-1), nxt = new Int32Array(ea.length);
    for (let k = 0; k < ea.length; k++) { nxt[k] = head[eb[k]]; head[eb[k]] = k; }
    const back = new Uint8Array(N), bq = [];
    for (const d of exits) { const id = d.y * W + d.x; if (!back[id]) { back[id] = 1; bq.push(id); } }
    while (bq.length) { const id = bq.pop(); for (let e = head[id]; e >= 0; e = nxt[e]) { const p = ea[e]; if (!back[p]) { back[p] = 1; bq.push(p); } } }
    lv.back = back; lv.stuck = [];
    for (let k = 0; k < N; k++) if (seen[k] && !back[k] && (!ab || canStand(k % W, (k / W) | 0))) lv.stuck.push(k); /* mit Runen: nur echte Stehplätze (Zwischenknoten sind Modell, kein Ort) */
    if (exits.length && lv.stuck.length) return false;
    /* Wächter: Ausgänge bleiben zu, bis er besiegt ist – sein Raum muss erreichbar sein und man muss von überall
       (auch nach einem Sturz aus dem Kampfraum) wieder hineinkommen */
    if (lv.warden && lv.warden.cell) {
      const c = lv.warden.cell, wb = new Uint8Array(N), wq = [];
      for (let y = c.y * CH + 1; y < c.y * CH + CH - 1; y++) for (let x = c.x * CW + 1; x < c.x * CW + CW - 1; x++) { const id = y * W + x; if (seen[id]) { wb[id] = 1; wq.push(id); } }
      if (wq.length < 6) return false;
      while (wq.length) { const id = wq.pop(); for (let e = head[id]; e >= 0; e = nxt[e]) { const p = ea[e]; if (!wb[p]) { wb[p] = 1; wq.push(p); } } }
      for (let k = 0; k < N; k++) if (seen[k] && !wb[k] && (!ab || canStand(k % W, (k / W) | 0))) { lv.stuck.push(k); }
      if (lv.stuck.length) return false;
    }
    return true;
  }
  Z.validateLevel = validate;

  /* ---------- Bewegungs-Runen im Prüfer ----------
     Zusätzliche Kanten je Knoten. Bewusst vorsichtig (lieber zu wenig als zu viel): was der Prüfer mit einer Rune für
     erreichbar hält, muss im Spiel sicher gehen. Reichweiten gemessen in /home/claude/test/w4_runen (Sprung ~6,7 Kacheln,
     Dritter Sprung +2,4, Schattensprint ~7,5 Kacheln waagrecht, Ösen-Reichweite 7 Kacheln). */
  const RING_R = 6.5;
  function runeMoves(ab, k) {
    const { W, H, g, passable, air, canStand, push, seen, q, fall, colFree } = k;
    const solid = v => v === 1 || v === 7;
    const bodyP = (x, y) => passable(g(x, y)) && passable(g(x, y - 1));
    let cur = -1;
    /* Zwischenknoten: kein Stehplatz, aber freier Körperplatz */
    let curStand = false;
    const pushV = (x, y, back) => {
      if (x < 1 || y < 2 || x >= W - 1 || y >= H - 1) return;
      if (canStand(x, y)) { push(x, y); return; }
      if (!bodyP(x, y)) return;
      const i = y * W + x; if (cur >= 0 && cur !== i) { k.edge(cur, i); if (back && curStand) k.edge(i, cur); }
      if (seen[i]) return; seen[i] = 1; q.push(i);
    };
    const wallAt = (x, y) => solid(g(x, y));
    const clingAt = (x, y) => ab.wall && bodyP(x, y) && (wallAt(x - 1, y) || wallAt(x - 1, y - 1) || wallAt(x + 1, y) || wallAt(x + 1, y - 1));
    const rings = ab.rings || [], ringSet = new Set(rings.map(r => r.x + "," + (r.y + 1)));
    const ups = ab.glide ? ab.updrafts || [] : [];
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d * 4); for (let s = 1; s < n; s++) { const t = s / n; if (!passable(g(Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t)))) return false; } return true; };
    /* Sprung nach oben ab (x, y) bis Höhe d1 (wie der Grundprüfer, mit größerer Reichweite/Klammerzielen) */
    const upJ = (x, y, d0, d1, extra) => {
      for (let dy = 1; dy <= d1; dy++) {
        if (!passable(g(x, y - dy - 1)) && g(x, y - dy - 1) !== 2) break;
        if (dy < d0) continue;
        const maxDx = (dy <= 2 ? 6 : dy <= 3 ? 5 : dy <= 5 ? 4 : 2) + (extra || 0);
        for (let dx = -maxDx; dx <= maxDx; dx++) {
          const tx = x + dx, ty = y - dy, st = canStand(tx, ty);
          if (!st && !(clingAt(tx, ty) && dy <= 5 && Math.abs(dx) <= 4)) continue;
          let ok = true; const s = Math.sign(dx);
          for (let j = s; j !== dx; j += s) { const a = g(x + j, ty - 1), b = g(x + j, ty); if ((!air(a) && a !== 2) || (!air(b) && b !== 2)) { ok = false; break; } }
          if (ok) (st ? push(tx, ty) : pushV(tx, ty, true)); /* zur Wand gesprungen: zurückfallen (mit Luftsteuerung) geht immer */
        }
      }
    };
    /* weite Sprünge auf gleicher Höhe oder abwärts: über die Lücke in Kopfhöhe, dann hinab */
    const wideJ = (x, y, dx0, dx1, dyMax) => {
      for (const s of [-1, 1]) {
        for (let j = 1; j <= dx1; j++) {
          if (!air(g(x + s * j, y - 1)) || (!air(g(x + s * j, y - 2)) && j > 1)) break;
          if (j < dx0) continue;
          const tx = x + s * j;
          for (let dy = 0; dy <= dyMax; dy++) { const ty = y + dy; if (!colFree(tx, y - 1, ty)) break; if (canStand(tx, ty)) { push(tx, ty); break; } }
        }
      }
    };
    /* Gleiten: weit hinab, Weite wächst mit der Fallhöhe */
    const glideJ = (x, y) => {
      for (const s of [-1, 1]) {
        for (let j = 1; j <= 16; j++) {
          if (!air(g(x + s * j, y - 1)) || (!air(g(x + s * j, y - 2)) && j > 1)) break;
          const tx = x + s * j;
          for (let dy = 0; dy <= 9; dy++) { const ty = y + dy; if (j > Math.min(16, 9 + 2 * dy)) continue; if (!colFree(tx, y - 1, ty)) break; if (canStand(tx, ty)) { push(tx, ty); break; } }
        }
      }
    };
    /* Schattenspalt: flach (eine Kachel hoch) bis 7 Kacheln weit */
    const slitJ = (x, y) => {
      for (const s of [-1, 1]) for (let j = 1; j <= 7; j++) { const tx = x + s * j; if (!passable(g(tx, y)) || g(tx, y) === 4) break; if (canStand(tx, ty0(tx, y))) { if (j > 1) push(tx, ty0(tx, y)); break; } }
    };
    const ty0 = (x, y) => y;
    const ringsFrom = (x, y) => {
      for (const r of rings) {
        const cx = x + 0.5, cy = y + 0.13, rx = r.x + 0.5, ry = r.y + 0.5;
        if (Math.hypot(rx - cx, ry - cy) > RING_R || (r.x === x && r.y + 1 === y)) continue;
        if (!los(cx, cy - 0.4, rx, ry)) continue;
        pushV(r.x, r.y + 1);
      }
    };
    const updraftFrom = (x, y) => {
      for (const u of ups) {
        if (x < u.x0 || x > u.x1) continue;
        const inside = y >= u.y0 && y <= u.y1 + 1, below = y > u.y1 && y - u.y1 <= 5 && colFree(x, u.y1, y - 1);
        if ((inside || below) && !(y === u.y0 + 1)) pushV(x, u.y0 + 1);
      }
    };
    return {
      node(x, y, virt, i) {
        cur = i; curStand = !virt; k.setFrom(i);
        if (!virt) {
          if (ab.jump3) upJ(x, y, 7, 8, 0);
          if (ab.dash) { wideJ(x, y, 8, 11, 4); upJ(x, y, 1, 3, 4); slitJ(x, y); }
          if (ab.glide) glideJ(x, y);
          if (ab.wall) for (const d of [-1, 1]) if (wallAt(x + d, y - 1) || wallAt(x + d, y - 2)) { pushV(x, y - 1, true); break; }
          if (ab.wall) upJ(x, y, 1, 5, 0);
        } else {
          /* Zwischenknoten: Fallen ist immer möglich */
          push(x, fall(x, y));
          const cling = clingAt(x, y), ring = ringSet.has(x + "," + y);
          let top = false; for (const u of ups) if (x >= u.x0 && x <= u.x1 && y === u.y0 + 1) top = true;
          if (cling) {
            if (clingAt(x, y - 1)) pushV(x, y - 1);
            if (bodyP(x, y + 1)) pushV(x, y + 1);
            upJ(x, y, 1, 6, 0); wideJ(x, y, 1, 7, 4);
          }
          if (ring) { upJ(x, y, 1, 4, 0); wideJ(x, y, 1, 6, 4); if (ab.glide) glideJ(x, y); }
          if (top) { upJ(x, y, 1, 3, 2); wideJ(x, y, 1, 9, 6); }
          if (ab.jump3 && (cling || ring || top)) upJ(x, y, 1, 3, 0);
          if (ab.dash && (cling || ring || top)) wideJ(x, y, 1, 11, 4);
        }
        if (rings.length) ringsFrom(x, y);
        if (ups.length) updraftFrom(x, y);
        cur = -1;
      }
    };
  }

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
       R Rex, E Echo, G Friedrich, Y Trainingspuppe, N Schwarzes Brett/Rückblick
       Das Lager wächst (lager.js liefert Z.hubPlan()): ext zusätzliche Spalten im Westen für die Plätze der Geretteten,
       terrace = zweite Ebene (Holzgalerie mit Leitern) über dem Westteil. Der Kern (Feuer, Ständer, Tor) bleibt gleich,
       verschiebt sich nur um lv.ox nach rechts – der Weg von der Ankunft zum Tor bleibt kurz. */
    const plan = (Z.hubPlan && Z.hubPlan()) || {};
    const ox = Math.max(0, Math.min(80, plan.ext | 0));
    const core = [
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
    /* Westteil voranstellen: Wand ganz links, die alte Westwand des Kerns wird zu offenem Boden */
    const rows = core.map((r, y) => {
      if (!ox) return r;
      const solid = y >= core.length - 2, top = y === 0;
      const west = solid ? "#".repeat(ox) : top ? ".".repeat(ox) : "#" + ".".repeat(ox - 1);
      return west + (solid || top ? r : "." + r.slice(1));
    });
    /* zweite Ebene: durchlässige Holzgalerie in Zeile 6 (Stand auf Zeile 5) mit Leitern an beiden Enden */
    const terr = plan.terrace && ox >= 20 ? { x0: 2, x1: ox - 3, y: 6 } : null;
    if (terr) {
      const set = (x, y, ch) => { rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1); };
      for (let x = terr.x0; x <= terr.x1; x++) set(x, terr.y, "-");
      terr.ladders = [terr.x0 + 1, terr.x1 - 1];
      for (const lx of terr.ladders) for (let y = terr.y; y <= 11; y++) set(lx, y, "H");
    }
    const lv = fromRows(rows, { biome: "lager", hub: true, out: true });
    lv.ox = ox; lv.terrace = terr; lv.plan = plan;
    for (const m of lv.marks) {
      if (m.t === "P") lv.start = { x: m.x, y: m.y };
      else if (m.t === "D") lv.doors.push({ kind: "gate", x: m.x, y: m.y });
      else lv.props.push({ kind: "npc", id: m.t, x: m.x, y: m.y });
    }
    const X = x => x + ox;
    lv.decor.push({ kind: "tent", x: X(30), y: 11 }, { kind: "tent", x: X(22), y: 11, s: 0.6 }, { kind: "cart", x: X(12), y: 11 }, { kind: "barrel", x: X(18), y: 11 }, { kind: "crate", x: X(19), y: 11 },
      { kind: "torch", x: X(64), y: 8 }, { kind: "torch", x: X(60), y: 8 }, { kind: "banner", x: X(66), y: 6 }, { kind: "weapons", x: X(14), y: 11 }, { kind: "lantern", x: X(43), y: 9 });
    lv.lights = [{ kind: "campfire", x: X(35), y: 11 }, { kind: "forge", x: X(16), y: 11 }, { kind: "torch", x: X(64), y: 8 }, { kind: "torch", x: X(60), y: 8 }, { kind: "lantern", x: X(43), y: 9 }];
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
      case "lakeboss": rows = [ /* Herz des Sees: schmale Steininsel vor dem schwarzen See (Demogorgon ragt dahinter auf, demogorgon.js) */
        "############################################",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#......-----....................-----......#",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#...-----.........--------.........-----...#",
        "#..........................................#",
        "#..........................................#",
        "#..........................................#",
        "#..P.................B.....................#",
        "############################################",
        "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
        "############################################"]; break;
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
