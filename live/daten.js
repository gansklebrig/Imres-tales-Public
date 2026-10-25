/* Klangwelten Live – Daten der Klangwelten (aus ambient.html übernommen) und die Liste aller Dateien für den Offline-Speicher.
   Wird von der App (index.html) und vom Service Worker (sw.js) geladen. */
(function (wurzel) {
  "use strict";
  const LAUTHEIT = {"a_feuer1":.0315,"a_feuer2":.0164,"a_feuer3":.0183,"a_grillen":.129,"a_nacht":.144,"a_voegel1":.0601,"a_voegel2":.0565,"a_laub":.0853,"a_bach1":.0405,"a_bach2":.0505,
    "a_wasserfall":.1828,"a_wind1":.0818,"a_wind2":.0963,"a_regen1":.0387,"a_regen2":.0462,"a_waldregen":.0248,"a_starkregen":.043,"a_zelt":.0196,"a_gewitter1":.0441,"a_gewitter2":.0412,
    "a_wellen1":.0623,"a_wellen2":.0559,"a_boot":.0343,"a_tropfen1":.0089,"a_tropfen2":.0249,"a_unterwasser":.1387,"a_kochen":.0825,"a_blubbern":.0647,"@gemurmel":.16,
    "a_baumwind":.0829, "a_bienen":.143, "a_dschungel":.048, "a_fensterregen":.1195, "a_fluss":.0479, "a_gaeste":.0478, "a_gesang":.1534, "a_grillen2":.0479, "a_halle":.0474, "a_heulwind":.0772, "a_klangschale":.1555, "a_kochen2":.0477, "a_lagerfeuer":.0243, "a_laubregen":.0434, "a_leichtregen":.0482, "a_segel":.0394, "a_starkregen2":.0724, "a_tropfen3":.0474, "a_uhr":.0428, "a_wasserfall2":.0588, "a_wellen3":.0476, "a_zelt2":.0459};
  const reihe = (p, n) => Array.from({ length: n }, (_, i) => p + (i + 1));
  const EV = {
    krug: { f: ["fx_fo_glass_02", "fx_fo_glass_03", "fx_fo_dishes_01", "fx_fo_dishes_03", "fx_fo2_sfx100v2_glass_02", "fx_fo_pot_01"] },
    stuhl: { f: ["fx_mw_wood_squeak_01", "fx_mw_wood_squeak_02", "fx_fo_wooden_02"] },
    knarren: { f: ["fx_ka_creak1", "fx_ka_creak2", "fx_ka_creak3"] },
    schritte: { f: ["fx_ka_footstep00", "fx_ka_footstep01", "fx_ka_footstep02", "fx_ka_footstep03", "fx_ka_footstep04"], folge: [3, 6, .4, .48] },
    holzschritte: { f: ["fx_im_footstep_wood_001", "fx_im_footstep_wood_002", "fx_im_footstep_wood_003"], folge: [3, 6, .45, .55] },
    muenzen: { f: ["fx_ka_handlecoins", "fx_rd_item_coins_04", "fx_rp_coin2"] },
    tuer: { f: ["fx_ka_dooropen_1", "fx_ka_dooropen_2", "fx_rp_door"] },
    donner: { f: ["fx_fo2_sfx100v2_thunder_01"].concat(reihe("e_donner_", 4)), tempo: [.8, 1.05] },
    heulen: { f: reihe("e_heulen_", 1), tempo: [.5, .62] },
    glocke: { f: reihe("e_glocke_", 4), tempo: [.8, 1] }, gong: { f: reihe("e_gong_", 2), tempo: [.85, 1] },
    kette: { f: reihe("e_kette_", 4) }, stein: { f: reihe("e_stein_", 6) }, platsch: { f: reihe("e_platsch_", 4) }, blubb: { f: reihe("e_blubb_", 4) },
    insekt: { f: reihe("e_insekt_", 4) }, buch: { f: reihe("e_buch_", 6) }, papier: { f: reihe("e_papier_", 3) },
    hammer: { f: reihe("e_hammer_", 6).concat(["amboss"]), folge: [3, 7, .55, .75] }, metall: { f: reihe("e_metall_", 3) },
    stoehnen: { f: reihe("e_stoehnen_", 4), tempo: [.75, .95] }, schleim: { f: reihe("e_schleim_", 3) }, monster: { f: reihe("e_monster_", 3), tempo: [.6, .8] },
    blasebalg: { f: reihe("e_blasebalg_", 2) }, ast: { f: reihe("e_ast_", 4) }, kies: { f: reihe("e_kies_", 2), folge: [3, 6, .5, .6] },
    laubschritt: { f: reihe("e_laubschritt_", 2), folge: [3, 6, .5, .62] }, riegel: { f: reihe("e_riegel_", 4) }, hund: { f: reihe("e_hund_", 2).concat(reihe("e_bellen_", 5)) },
    tuch: { f: reihe("e_tuch_", 3) }, zischen: { f: reihe("e_zischen_", 2) },
    frosch: { f: reihe("e_frosch_", 8), tempo: [.82, 1.12], folge: [1, 3, .45, .9] },
    chor: { f: ["stimme_57", "stimme_60", "stimme_63"], tempo: [.66, .9], lang: 1 },
    klangschale: { f: ["a_klangschale"], tempo: [.98, 1.02] },
    eule: { f: reihe("e_eule_", 2), tempo: [.88, 1.05] }, moewe: { f: reihe("e_moewe_", 10) }, specht: { f: reihe("e_specht_", 4) },
    vogel: { f: reihe("e_vogel_", 10), tempo: [.92, 1.08] }, kraehe: { f: reihe("e_kraehe_", 7) }, wolf: { f: reihe("e_wolf_", 4), tempo: [.9, 1.03] },
    wal: { f: reihe("e_wal_", 3), tempo: [.8, 1] }, pferd: { f: ["e_pferd_1"], tempo: [.9, 1.06] }, katze: { f: reihe("e_katze_", 4) }, ruder: { f: reihe("e_ruder_", 3) },
    lachen: { s: "lachen" }, fledermaus: { s: "fledermaus" }
  };
  /* ---------- Die Klangwelten ----------
     betten: [Quelle, Stärke, Name, { tief: Tiefpass }]; ereignisse: [Art, [min, max] Sekunden, Stärke, Anteil „aus der Ferne“] */
  const W = de => de;
  const WELTEN = [
    { id: "taverne", sym: "🍺", name: W("Taverne", "Tavern"), text: W("Kaminfeuer, volle Gaststube, Krüge, knarrende Dielen und eine schnurrende Katze", "Hearth fire, a full common room, tankards, creaking floorboards and a purring cat"), raum: .7,
      betten: [["a_feuer1", .55, W("Kaminfeuer", "Hearth")], ["a_gaeste", .8, W("Stimmengewirr", "Chatter"), { tief: 3800 }]],
      ereignisse: [["krug", [2.5, 8], .55, .2], ["stuhl", [8, 20], .4, .3], ["knarren", [10, 25], .35, .3], ["holzschritte", [9, 22], .35, .4], ["muenzen", [20, 45], .35, .4], ["tuer", [45, 100], .3, .5], ["katze", [50, 120], .28, .1], ["hund", [70, 160], .25, 1]] },
    { id: "lagerfeuer", sym: "🔥", name: W("Lagerfeuer", "Campfire"), text: W("Knisterndes Feuer unter Sternen, Grillen, ferne Eulen und Wölfe", "Crackling fire under the stars, crickets, distant owls and wolves"), raum: 1.2,
      betten: [["a_feuer2", 1, W("Feuer", "Fire")], ["a_grillen", .45, W("Grillen", "Crickets")], ["a_nacht", .35, W("Nacht", "Night")], ["a_wind1", .15, W("Wind", "Wind"), { tief: 900 }], ["a_lagerfeuer", .45, W("Holzscheite", "Logs")], ["a_grillen2", .22, W("Grillenwiese", "Cricket meadow")]],
      ereignisse: [["eule", [25, 60], .4, .6], ["heulen", [70, 160], .3, 1], ["wolf", [90, 200], .3, 1], ["ast", [15, 35], .35, .5], ["laubschritt", [40, 90], .3, .8]] },
    { id: "waldtag", sym: "🌲", name: W("Wald am Tag", "Forest by day"), text: W("Vogelgesang, Wind in den Kronen, Specht, Krähen und ein Bach", "Birdsong, wind in the treetops, woodpecker, crows and a brook"), raum: 1,
      betten: [["a_voegel1", .8, W("Vögel", "Birds")], ["a_voegel2", .55, W("Baumkronen", "Treetops")], ["a_laub", .3, W("Laub", "Leaves")], ["a_bach1", .25, W("Bach", "Brook")], ["a_wind1", .14, W("Wind", "Wind"), { tief: 1400 }], ["a_baumwind", .3, W("Rauschende Bäume", "Rustling trees")], ["a_bienen", .08, W("Bienen", "Bees"), { tief: 3000 }]],
      ereignisse: [["specht", [25, 60], .35, .6], ["vogel", [6, 16], .35, .5], ["kraehe", [40, 100], .25, .8], ["ast", [20, 45], .3, .6], ["laubschritt", [35, 80], .3, .7]] },
    { id: "waldnacht", sym: "🌙", name: W("Wald bei Nacht", "Forest at night"), text: W("Grillen, raunende Bäume, Eulen und Wölfe in der Ferne", "Crickets, murmuring trees, owls and distant wolves"), raum: 1.3,
      betten: [["a_nacht", .9, W("Nacht", "Night")], ["a_grillen", .55, W("Grillen", "Crickets")], ["a_wind2", .22, W("Wind", "Wind"), { tief: 1200 }], ["a_baumwind", .25, W("Raunende Bäume", "Murmuring trees"), { tief: 1600 }], ["a_grillen2", .3, W("Grillenwiese", "Cricket meadow")]],
      ereignisse: [["eule", [15, 40], .45, .5], ["heulen", [45, 110], .35, 1], ["wolf", [60, 150], .3, 1], ["ast", [12, 30], .35, .6], ["fledermaus", [30, 70], .25, .5]] },
    { id: "regen", sym: "🌧", name: W("Regen unterwegs", "Rain on the road"), text: W("Regen auf Blättern, Pfützen, ein Reiter, ferner Donner", "Rain on leaves, puddles, a rider, distant thunder"), raum: 1,
      betten: [["a_waldregen", 1, W("Waldregen", "Forest rain")], ["a_regen1", .45, W("Regen", "Rain")], ["a_wind1", .2, W("Wind", "Wind"), { tief: 1000 }], ["a_laubregen", .5, W("Regen auf Laub", "Rain on leaves")], ["a_leichtregen", .3, W("Nieselregen", "Drizzle")]],
      ereignisse: [["donner", [50, 130], .35, 1], ["platsch", [14, 35], .25, .5], ["pferd", [70, 160], .3, .8], ["kraehe", [60, 140], .2, 1]] },
    { id: "zelt", sym: "⛺", name: W("Zelt im Regen", "Tent in the rain"), text: W("Tropfen auf der Zeltplane, draußen Böen und Donner", "Drops on canvas, gusts and thunder outside"), raum: .4,
      betten: [["a_zelt", 1, W("Zeltplane", "Canvas")], ["a_regen2", .3, W("Regen", "Rain"), { tief: 1800 }], ["a_wind1", .2, W("Wind", "Wind"), { tief: 700 }], ["a_zelt2", .55, W("Plane", "Tarp")], ["a_heulwind", .12, W("Böen", "Gusts"), { tief: 600 }]],
      ereignisse: [["donner", [60, 150], .3, 1], ["tuch", [25, 60], .25, .2]] },
    { id: "gewitter", sym: "⛈", name: W("Gewitter", "Thunderstorm"), text: W("Prasselnder Regen, heulender Sturm und rollender Donner", "Pouring rain, howling gale and rolling thunder"), raum: 1.5,
      betten: [["a_gewitter1", 1, W("Gewitter", "Storm")], ["a_gewitter2", .5, W("Unwetter", "Tempest")], ["a_starkregen", .45, W("Starkregen", "Downpour")], ["a_wind2", .4, W("Sturmwind", "Gale")], ["a_starkregen2", .4, W("Wolkenbruch", "Cloudburst")], ["a_heulwind", .35, W("Heulender Sturm", "Howling gale")]],
      ereignisse: [["donner", [14, 40], .55, .5], ["donner", [25, 70], .4, 1]] },
    { id: "hoehle", sym: "💧", name: W("Höhle", "Cave"), text: W("Tropfsteine, Hall, Höhlenwind, bröckelnder Stein", "Dripstones, echoes, cave wind, crumbling stone"), raum: 4,
      betten: [["a_tropfen1", 1, W("Tropfen", "Drips")], ["a_tropfen2", .45, W("Rinnsal", "Trickle")], ["a_wind1", .22, W("Luftzug", "Draught"), { tief: 380 }], ["a_tropfen3", .45, W("Tropfsteine", "Dripstones"), { schleife: true }], ["a_heulwind", .12, W("Höhlenwind", "Cave wind"), { tief: 400 }]],
      ereignisse: [["stein", [20, 50], .35, .6], ["platsch", [12, 30], .25, .6], ["fledermaus", [30, 80], .2, .5]] },
    { id: "unterreich", sym: "🕸", name: W("Unterreich", "Underdark"), text: W("Endlose Tiefe, fremde Laute, Schleim, Stein und ferner Wind", "Endless depths, alien sounds, slime, stone and distant wind"), raum: 5,
      betten: [["a_tropfen1", .7, W("Tropfen", "Drips")], ["a_unterwasser", .35, W("Tiefe", "Depths"), { tief: 500 }], ["a_bach2", .18, W("Ferner Fluss", "Distant river"), { tief: 600 }], ["a_tropfen3", .3, W("Tropfsteine", "Dripstones"), { schleife: true }], ["a_heulwind", .14, W("Ferner Wind", "Distant wind"), { tief: 300 }]],
      ereignisse: [["monster", [30, 75], .3, 1], ["schleim", [20, 50], .3, .6], ["stein", [25, 60], .3, .7], ["stoehnen", [60, 140], .2, 1], ["kette", [70, 150], .2, 1]] },
    { id: "kerker", sym: "⛓", name: W("Kerker", "Dungeon"), text: W("Klirrende Ketten, ferne Klagen, Zugluft, schwere Riegel, ein Wachhund", "Rattling chains, distant moans, draughts, heavy bolts, a guard dog"), raum: 2.5,
      betten: [["a_tropfen2", .6, W("Tropfen", "Drips")], ["a_wind1", .25, W("Luftzug", "Draught"), { tief: 450 }], ["a_tropfen3", .35, W("Pfützen", "Puddles"), { schleife: true }], ["a_heulwind", .14, W("Zugluft", "Cold draught"), { tief: 500 }]],
      ereignisse: [["kette", [10, 25], .4, .5], ["stoehnen", [25, 60], .3, .8], ["riegel", [35, 80], .35, .6], ["kies", [30, 70], .3, .7], ["tuer", [70, 150], .25, .8], ["hund", [80, 180], .22, 1]] },
    { id: "kueste", sym: "🌊", name: W("Küste", "Coast"), text: W("Brandung, Uferwellen, Wind und Möwen", "Surf, lapping waves, wind and gulls"), raum: 1,
      betten: [["a_wellen1", 1, W("Brandung", "Surf")], ["a_wellen2", .55, W("Wellen", "Waves")], ["a_wind2", .3, W("Wind", "Wind")], ["a_wellen3", .55, W("Uferwellen", "Lapping waves")]],
      ereignisse: [["moewe", [8, 22], .4, .5], ["glocke", [60, 140], .2, 1]] },
    { id: "schiff", sym: "⛵", name: W("An Deck", "On deck"), text: W("Knarzende Planken, Wellen gegen den Rumpf, Takelage im Wind", "Creaking planks, waves on the hull, rigging in the wind"), raum: .8,
      betten: [["a_boot", 1, W("Planken", "Planks")], ["a_wellen2", .7, W("Wellen", "Waves")], ["a_wind1", .4, W("Wind", "Wind")], ["a_segel", .55, W("Takelage", "Rigging")]],
      ereignisse: [["knarren", [8, 20], .4, .3], ["moewe", [15, 40], .3, .6], ["tuch", [10, 25], .35, .3], ["glocke", [50, 120], .25, .6], ["holzschritte", [25, 60], .3, .5]] },
    { id: "fluss", sym: "🏞", name: W("Wasserfall", "Waterfall"), text: W("Rauschendes Wasser, Gischt, Frösche und Vögel am Ufer, ein Ruderboot", "Rushing water, spray, frogs and birds on the bank, a rowing boat"), raum: 1.2,
      betten: [["a_wasserfall", .9, W("Wasserfall", "Waterfall")], ["a_bach2", .55, W("Fluss", "River")], ["a_voegel2", .28, W("Vögel", "Birds")], ["a_wasserfall2", .4, W("Gischt", "Spray")], ["a_fluss", .35, W("Strömung", "Current")]],
      ereignisse: [["vogel", [10, 25], .3, .6], ["platsch", [20, 45], .25, .5], ["specht", [40, 100], .2, .8], ["frosch", [25, 60], .25, .8], ["ruder", [60, 150], .3, .6]] },
    { id: "schmiede", sym: "⚒", name: W("Schmiede", "Forge"), text: W("Esse, glühende Kohlen, Hammer auf Amboss, Blasebalg und zischender Stahl", "Hearth, glowing coals, hammer on anvil, bellows and hissing steel"), raum: .9,
      betten: [["a_feuer1", .75, W("Esse", "Hearth")], ["a_feuer3", .35, W("Glut", "Embers")], ["a_lagerfeuer", .3, W("Kohlen", "Coals")]],
      ereignisse: [["hammer", [6, 14], .55, .1], ["blasebalg", [12, 28], .35, .2], ["zischen", [20, 45], .3, .2], ["metall", [15, 35], .3, .3]] },
    { id: "labor", sym: "⚗", name: W("Alchemistenstube", "Alchemist's study"), text: W("Brodelnde Kessel, siedender Sud, blubbernde Phiolen, klirrendes Glas", "Bubbling cauldrons, simmering brew, gurgling vials, clinking glass"), raum: .9,
      betten: [["a_kochen", .7, W("Kessel", "Cauldron")], ["a_blubbern", .45, W("Phiolen", "Vials")], ["a_feuer3", .35, W("Feuer", "Fire")], ["a_kochen2", .35, W("Sud", "Brew")]],
      ereignisse: [["krug", [8, 20], .35, .2], ["blubb", [5, 14], .35, .3], ["buch", [20, 45], .3, .3], ["zischen", [25, 60], .25, .3]] },
    { id: "bibliothek", sym: "📚", name: W("Bibliothek", "Library"), text: W("Stille, Kaminglut, Standuhr, Regen am Fenster, blätternde Seiten, eine Katze", "Silence, embers, a clock, rain at the window, turning pages, a cat"), raum: 1.8,
      betten: [["a_feuer3", .7, W("Kamin", "Hearth")], ["a_wind2", .25, W("Wind am Fenster", "Wind at the window"), { tief: 600 }], ["a_uhr", .18, W("Standuhr", "Clock"), { takt: 2.0005 }], ["a_fensterregen", .14, W("Regen am Fenster", "Rain at the window"), { tief: 2500 }]],
      ereignisse: [["buch", [8, 20], .35, .3], ["papier", [12, 30], .3, .3], ["knarren", [25, 60], .25, .6], ["holzschritte", [30, 70], .25, .7], ["katze", [50, 120], .28, .2]] },
    { id: "tempel", sym: "⛪", name: W("Tempel", "Temple"), text: W("Weite Halle, Mönchsgesang, Klangschale, Glocken und Gong", "Vast hall, chanting monks, singing bowl, bells and gong"), raum: 5,
      betten: [["a_wind1", .35, W("Luftzug", "Draught"), { tief: 500 }], ["a_wind2", .2, W("Weite", "Vastness"), { tief: 300 }], ["a_feuer3", .3, W("Kerzen", "Candles"), { tief: 2000 }], ["a_gesang", .2, W("Mönchsgesang", "Chanting"), { tief: 3000 }], ["a_halle", .22, W("Halle", "Hall"), { tief: 1800 }]],
      ereignisse: [["klangschale", [25, 50], .04, 0], ["chor", [14, 34], .3, .7], ["glocke", [20, 50], .4, .5], ["gong", [50, 120], .35, .5], ["kies", [25, 60], .3, .6], ["tuch", [30, 70], .25, .5]] },
    { id: "sumpf", sym: "🐸", name: W("Sumpf", "Swamp"), text: W("Blubbernder Morast, quakende Frösche, sirrende Insekten, Krähen im Nebel", "Bubbling mire, croaking frogs, whirring insects, crows in the mist"), raum: 1.2,
      betten: [["a_blubbern", .4, W("Morast", "Mire")], ["a_grillen", .4, W("Grillen", "Crickets")], ["a_nacht", .4, W("Nacht", "Night")], ["a_tropfen2", .3, W("Tropfen", "Drips")], ["a_dschungel", .22, W("Insektenchor", "Insect chorus")]],
      ereignisse: [["frosch", [3, 9], .45, .5], ["insekt", [6, 16], .3, .4], ["platsch", [15, 35], .3, .6], ["blubb", [8, 20], .3, .5], ["eule", [50, 120], .25, 1], ["kraehe", [40, 100], .22, .9]] },
    { id: "unterwasser", sym: "🫧", name: W("Unter Wasser", "Underwater"), text: W("Gedämpfte Tiefe, aufsteigende Blasen, ferner Walgesang", "Muffled depths, rising bubbles, distant whale song"), raum: 2,
      betten: [["a_unterwasser", 1, W("Tiefe", "Depths")], ["a_blubbern", .3, W("Blasen", "Bubbles"), { tief: 1500 }]],
      ereignisse: [["blubb", [5, 14], .3, .5], ["wal", [35, 90], .3, .8], ["monster", [70, 160], .15, 1]] }
  ];


  /* Pfad einer Aufnahme, gesehen aus dem Ordner /live/ */
  const quelle = n => n === "amboss" || n.startsWith("fx_") || n.startsWith("stimme_") ? "../klang/" + n + ".mp3" : "../amb/" + n + ".mp3";
  function dateien() {
    const s = new Set();
    WELTEN.forEach(w => { w.betten.forEach(b => { if (!b[0].startsWith("@")) s.add(b[0]); }); w.ereignisse.forEach(e => (EV[e[0]].f || []).forEach(n => s.add(n))); });
    return Array.from(s).map(quelle);
  }
  const SCHALE = ["./", "./index.html", "./daten.js", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png", "../klangwerk.js"];
  /* Name des Offline-Speichers – nur hier festgelegt (App und Service Worker lesen ihn von hier).
     Muss nicht hochgezählt werden: geänderte und weggefallene Dateien erkennt die App selbst. */
  const CACHE = "klangwelten-live-v1";
  wurzel.KLANG = { LAUTHEIT, EV, WELTEN, quelle, dateien, SCHALE, CACHE };
})(typeof self !== "undefined" ? self : this);
