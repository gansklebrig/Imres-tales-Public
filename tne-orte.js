/* =====================================================================
   TALES NEVER END – Spielorte
   ---------------------------------------------------------------------
   Wo die Runde gerade spielt: im Wohnzimmer, in der WG-Küche, im
   Hobbykeller, im Hinterzimmer des Spieleladens … oder auf einem Ausflug
   (Hütte im Wald, Burg-Herberge, Convention, Zug, Zeltlager, Bootshaus).
   Jeder Ort hat
   · einen eigenen Raumklang (Grundteppich + zufällige echte Geräusche),
   · einen eigenen Tisch (Fläche, Licht, Kleinkram, sanfte Bewegung),
   · ein eigenes Szenenbild für Karten, die „am Tisch“ spielen,
   · eigene Leute und eine Nebengeschichte (Karten in tne-karten-12.js).
   Schnittstelle: window.TNE_ORTE (Daten) und window.TNE_ORTSBILD (Grafik).
   Ohne Blau.
   ===================================================================== */
(function () {
  "use strict";
  const f1 = n => Math.round(n * 10) / 10;

  /* ---------------------------------------------------------------------
     ORTE
     art: heim (fester Spielort, Umzug möglich) · treff (fester Spielort
     außer Haus) · ausflug (eine Sonder-Session, danach geht es zurück)
     klang.bett:     [[datei, lautstärke, {tp, hp, nacht, tag, wetter}]]
     klang.zufall:   [[datei, lautstärke, gewicht, {fern, nacht, tag, wetter, flag}]]
     klang.abstand:  Sekunden zwischen zwei Zufallsgeräuschen [min, max]
     --------------------------------------------------------------------- */
  const ORTE = {
    wohnzimmer: {
      name: "Wohnzimmer", ic: "🛋️", art: "heim", gastgeber: true,
      wo: "im Wohnzimmer bei {wirt}", kurz: "Wohnzimmer",
      text: "Das Wohnzimmer von {wirt}: ein ausgezogener Esstisch, ein Sofa voller Kissen, ein Regal mit Brettspielen und eine Stehlampe, die genau richtig warm leuchtet. Die Wanduhr tickt. Die Nachbarin unten hat feine Ohren.",
      tisch: { flaeche: "eiche", licht: "lampe", deko: ["teekanne", "fernbedienung", "pflanze", "untersetzer"] },
      klang: {
        bett: [["a_uhr", .13, { tp: 5000 }], ["o_raum", .22, {}], ["a_fensterregen", .32, { wetter: "regen" }], ["a_fensterregen", .38, { wetter: "gewitter" }], ["o_strasse", .1, { tp: 1200, wetter: "klar" }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["fx_ca_dice_shake", .4, 2], ["n_stuhl", .35, 3], ["e_stubenlachen", .3, 3], ["n_einschenken", .4, 2], ["e_teeaufguss", .35, 2], ["e_papier", .35, 2], ["e_buch", .3, 2], ["e_schreibfeder", .3, 1.5], ["fx_ka_creak", .25, 1.5], ["n_husten", .2, .6], ["e_hund", .1, .6, { fern: true }], ["o_tram", .15, 1, { fern: true }], ["e_donner", .35, 3, { wetter: "gewitter", fern: true }], ["o_klingel", .35, .4], ["n_klopfen", .25, .5, { fern: true }], ["e_essen", .3, 1], ["o_bleistift", .3, 1.2], ["o_lachen", .3, 2], ["o_seite", .3, 1.5], ["o_stuhl", .2, 1], ["o_aufgiessen", .3, 1], ["o_schnurren", .2, .8, { flag: "katze" }]],
        abstand: [6, 16]
      }
    },
    wgkueche: {
      name: "WG-Küche", ic: "🍳", art: "heim", gastgeber: true,
      wo: "in der WG-Küche bei {wirt}", kurz: "WG-Küche",
      text: "Die WG-Küche von {wirt}: ein Tisch mit Wachstuch, sechs Stühle, die nicht zusammenpassen, ein Kühlschrank voller beschrifteter Fächer und ein Putzplan, an den sich niemand hält. Irgendwer kocht immer gerade Nudeln.",
      tisch: { flaeche: "wachstuch", licht: "haengelampe", deko: ["topf", "mate", "kuehlschrankzettel", "salzstreuer"] },
      klang: {
        bett: [["o_kuehlschrank", .2, {}], ["o_raum", .14, {}], ["a_kochen2", .06, { tag: true }], ["a_fensterregen", .26, { wetter: "regen" }], ["a_fensterregen", .3, { wetter: "gewitter" }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["e_geschirr", .3, 3], ["n_geschirr", .3, 2], ["e_brutzeln", .25, 1.2], ["fx_rp_bottle", .35, 2], ["o_flasche", .4, 2], ["n_einschenken", .35, 1.5], ["n_tuerauf", .25, 1.5, { fern: true }], ["n_tuerzu", .25, 1.5, { fern: true }], ["n_holzschritte", .2, 1.5, { fern: true }], ["o_wasserkocher", .3, 1.2], ["fx_fo_pot", .25, 1], ["e_stubenlachen", .3, 2.5], ["e_essen", .3, 1.5], ["e_essen", .3, 1], ["o_bleistift", .3, 1.2], ["n_klopfen", .25, .6], ["e_donner", .3, 3, { wetter: "gewitter", fern: true }], ["o_lachen", .3, 2], ["o_mikrowelle", .25, 1, { fern: true }], ["o_besteck", .25, 1.5], ["o_kaffee", .2, .6, { fern: true }], ["o_pfeifkessel", .15, .4, { fern: true }]],
        abstand: [5, 13]
      }
    },
    keller: {
      name: "Hobbykeller", ic: "🕯️", art: "heim", gastgeber: true,
      wo: "im Hobbykeller bei {wirt}", kurz: "Hobbykeller",
      text: "Der Hobbykeller von {wirt}: ein Fenster knapp unter der Decke, eine Glühbirne an einem Kabel, ein alter Tisch aus dem Gartenhaus, eine Tischtennisplatte als Ablage und Regale voller Minis. Die Heizungsrohre knacken. Hinter dem Heizungsraum gibt es eine Tür, die immer abgeschlossen ist.",
      tisch: { flaeche: "altholz", licht: "gluehbirne", deko: ["werkzeugkiste", "minis", "farbtoepfe", "verlaengerung"] },
      klang: {
        bett: [["o_heizung", .2, {}], ["o_raum", .18, { tp: 3000 }], ["o_fensterregen", .1, { wetter: "regen", tp: 1500 }], ["o_fensterregen", .12, { wetter: "gewitter", tp: 1500 }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["fx_ka_creak", .25, 2], ["n_holzschritte", .25, 2, { fern: true }], ["n_tuerzu", .25, 1, { fern: true }], ["e_metall", .12, 1.5, { fern: true }], ["e_metall", .1, 1.5, { fern: true }], ["fx_rp_bottle", .35, 2], ["o_flasche", .35, 1.5], ["e_stubenlachen", .3, 2], ["e_holzpoltern", .18, .8, { fern: true }], ["o_waschmaschine", .18, .7, { fern: true }], ["o_bleistift", .3, 1], ["n_ratte", .08, .25, { fern: true }], ["o_lachen", .28, 1.5], ["o_seite", .28, 1], ["o_kellertuer", .14, .25, { fern: true }]],
        abstand: [7, 17]
      }
    },
    dachboden: {
      name: "Dachgeschoss", ic: "🏚️", art: "heim", gastgeber: true,
      wo: "unterm Dach bei {wirt}", kurz: "Dachgeschoss",
      text: "Die Dachwohnung von {wirt}: schräge Wände, an denen sich jeder einmal den Kopf stößt, ein Dachfenster genau über dem Tisch, alte Dielen und eine Lichterkette, die seit Weihnachten 2019 hängt. Wenn es regnet, hört man jeden Tropfen.",
      tisch: { flaeche: "dielen", licht: "lichterkette", deko: ["kissen", "teekanne", "buecherstapel", "lichterkette"] },
      klang: {
        bett: [["o_raum", .16, {}], ["a_wind_n3", .07, { tp: 1800 }], ["a_fensterregen", .42, { wetter: "regen" }], ["a_fensterregen", .45, { wetter: "gewitter" }], ["a_leichtregen_n2", .12, { wetter: "regen", tp: 2500 }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["fx_ka_creak", .3, 3], ["fx_mw_wood_squeak", .2, 1.5], ["n_stuhl", .3, 2], ["e_stubenlachen", .3, 2.5], ["e_teeaufguss", .3, 1.5], ["e_papier", .3, 1.5], ["e_kraehe", .08, 1, { fern: true, tag: true }], ["e_eule", .08, 1, { fern: true, nacht: true }], ["e_glocke", .1, .6, { fern: true }], ["e_donner", .45, 3, { wetter: "gewitter", fern: true }], ["o_seite", .3, 1.2], ["o_lachen", .28, 2], ["o_aufgiessen", .3, 1], ["o_stuhl", .2, .8]],
        abstand: [6, 15]
      }
    },
    laden: {
      name: "Spieleladen", ic: "🎲", art: "treff",
      wo: "im Hinterzimmer vom „Würfelturm“", kurz: "Spieleladen",
      text: "Das Hinterzimmer vom „Würfelturm“, dem kleinen Spieleladen in der Altstadt: zwei Klapptische mit grünem Filz, Regale bis unter die Decke, ein Plakat von einer Convention aus den Neunzigern. Vorne bimmelt die Ladentür. Herr Brettschneider sagt, ihr dürft bleiben, solange ihr wollt. Er sagt es ein bisschen zu oft.",
      tisch: { flaeche: "filz", licht: "neon", deko: ["preisschild", "folie", "kasse", "spielschachtel"] },
      klang: {
        bett: [["o_raum", .14, {}], ["a_gaeste_n1", .06, { tp: 1500 }], ["o_kuehlschrank", .06, { tp: 2500 }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["fx_ca_dice_shake", .4, 2], ["n_glocklein", .3, 2.5, { fern: true }], ["fx_ka_handlecoins", .25, 1.5, { fern: true }], ["e_kiste", .25, 1.5, { fern: true }], ["e_papier", .3, 2], ["n_holzschritte", .2, 1.5, { fern: true }], ["e_raunen", .15, 1, { fern: true }], ["e_stubenlachen", .3, 2], ["o_flasche", .3, 1.2], ["o_tram", .12, 1, { fern: true }], ["o_ladenklingel", .22, 2, { fern: true }], ["o_lachen", .25, 1.5], ["o_seite", .25, 1]],
        abstand: [6, 15]
      }
    },
    kneipe: {
      name: "Kneipe", ic: "🍺", art: "treff",
      wo: "im Nebenzimmer vom „Krummen Würfel“", kurz: "Kneipe",
      text: "Das Nebenzimmer vom „Krummen Würfel“: dunkles Holz, Bierdeckel, ein Kachelofen und ein Hirschgeweih, das jemand „Gerold“ getauft hat. Nebenan sitzt der Stammtisch, im Fernsehen läuft Fußball. Wirtin Doris bringt das Bier, bevor man es bestellt.",
      tisch: { flaeche: "kneipe", licht: "pendel", deko: ["bierdeckel", "bierglas", "salzstangen", "aschenbecher"] },
      klang: {
        bett: [["a_gaeste", .17, { tp: 3200 }], ["o_kneipe", .2, { tp: 4000 }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["n_einschenken", .35, 2.5], ["n_trinken", .25, 1.5], ["fx_fo_glass", .3, 2], ["e_geschirr", .25, 1.5, { fern: true }], ["e_stubenlachen", .3, 2], ["n_lachen", .25, 1.5, { fern: true }], ["e_jubel", .14, 1, { fern: true }], ["e_raunen", .15, 1.2, { fern: true }], ["n_tuerauf", .2, 1, { fern: true }], ["fx_rp_bottle", .3, 1.2], ["n_ruelpser", .2, .3, { fern: true }], ["o_lachen", .25, 2, { fern: true }], ["o_besteck", .2, 1.2, { fern: true }]],
        abstand: [4, 11]
      }
    },
    laube: {
      name: "Schrebergarten", ic: "🌻", art: "treff",
      wo: "in der Laube im Schrebergarten", kurz: "Schrebergarten",
      text: "Parzelle 47 im Kleingartenverein „Gute Hoffnung“: eine Laube mit Vordach, ein Gartentisch mit karierter Decke, ein Grill, Tomaten, ein Teich mit genau einem Frosch und ein Windspiel. Um 22 Uhr ist Ruhezeit. Theoretisch.",
      tisch: { flaeche: "picknick", licht: "laterne", deko: ["blumentopf", "grillzange", "mueckenspray", "limo"], laub: true },
      klang: {
        bett: [["a_sommerwiese_n1", .16, { tag: true }], ["a_voegel_n4", .1, { tag: true }], ["a_grillen", .2, { nacht: true }], ["o_verandaregen", .26, { wetter: "regen" }], ["o_verandaregen", .3, { wetter: "gewitter" }]],
        zufall: [["fx_ca_dice_throw", .45, 4], ["n_windspiel", .22, 2], ["e_vogel", .15, 2, { tag: true }], ["e_insekt", .2, 1.5], ["n_bienen", .12, 1, { tag: true }], ["e_brutzeln", .2, 1.2], ["fx_rp_bottle", .3, 1.5], ["e_frosch", .15, 1.5, { nacht: true }], ["e_specht", .1, .6, { fern: true, tag: true }], ["e_hund", .1, .8, { fern: true }], ["e_stubenlachen", .3, 2], ["e_laub", .2, 1], ["e_eule", .1, .8, { fern: true, nacht: true }], ["o_muecke", .14, 1.2, { nacht: true }], ["o_windspiel", .18, 1.2], ["o_lachen", .28, 1.5]],
        abstand: [5, 13]
      }
    },
    huette: {
      name: "Hütte im Wald", ic: "🌲", art: "ausflug",
      wo: "in der Hütte im Wald", kurz: "Hütte im Wald",
      text: "Ein ganzes Wochenende in einer Holzhütte, zwei Stunden hinter dem letzten Supermarkt. Ein Kaminofen, ein schwerer Holztisch, Hirschgeweihe, Spinnweben, kein Netz. Draußen rauscht der Wald. Die Hütte gehört dem Onkel von {wirt}, der „Grüße an den Ofen“ ausrichten lässt.",
      tisch: { flaeche: "rustikal", licht: "kamin", deko: ["holzscheite", "petroleumlampe", "thermoskanne", "tannenzapfen"] },
      klang: {
        bett: [["a_feuer2", .22, { tp: 6000 }], ["a_wind_n2", .1, { tp: 2000 }], ["a_waldregen_n1", .2, { wetter: "regen", tp: 3000 }], ["a_schneesturm_n1", .1, { wetter: "schnee", tp: 1500 }]],
        zufall: [["fx_ca_dice_throw", .45, 4], ["n_feuerknistern", .3, 3], ["fx_ka_creak", .25, 2], ["e_holzpoltern", .2, 1.2], ["e_eule", .12, 2, { fern: true, nacht: true }], ["e_ast", .12, 1.2, { fern: true }], ["n_fuchs", .1, .8, { fern: true, nacht: true }], ["e_hirsch", .08, .6, { fern: true }], ["e_teeaufguss", .3, 1.2], ["e_stubenlachen", .3, 2], ["e_tuerknarren", .2, .8], ["e_specht", .1, .8, { fern: true, tag: true }], ["o_pfeifkessel", .2, .8], ["o_lachen", .28, 1.5]],
        abstand: [6, 15]
      }
    },
    burg: {
      name: "Burg-Herberge", ic: "🏰", art: "ausflug",
      wo: "in der Burg-Jugendherberge", kurz: "Burg-Herberge",
      text: "Eine Jugendherberge in einer echten Burg: Steinwände, ein Rittersaal mit Eichentisch, Fackelhalter (mit LED-Fackeln), ein Brunnen im Hof und ein Burgwart namens Herr Eisenhut, der von einem Gespenst erzählt, sobald er jemanden sieht. Nachtruhe ab 22 Uhr. Für euch gilt das angeblich nicht.",
      tisch: { flaeche: "eichentafel", licht: "fackel", deko: ["kerzenleuchter", "zinnbecher", "herbergsschild", "schluesselbund"] },
      klang: {
        bett: [["a_halle", .16, { tp: 4000 }], ["a_ruinenwind", .08, { tp: 1800 }], ["a_regen_n2", .12, { wetter: "regen", tp: 2000 }]],
        zufall: [["fx_ca_dice_throw", .5, 4], ["e_tuerknarren", .25, 2], ["n_steinschritte", .2, 2, { fern: true }], ["e_kraehe", .1, 1, { fern: true, tag: true }], ["e_glocke", .15, 1, { fern: true }], ["n_fackel", .2, 1.2], ["e_stubenlachen", .3, 2], ["e_kette", .1, .6, { fern: true }], ["e_geisterfluestern", .06, .4, { fern: true, nacht: true }], ["e_eule", .1, 1, { fern: true, nacht: true }], ["o_lachen", .25, 1.5]],
        abstand: [6, 15]
      }
    },
    con: {
      name: "Convention", ic: "🎪", art: "ausflug",
      wo: "auf der Rollenspiel-Convention", kurz: "Convention",
      text: "Die „Würfelzeit“, eine Rollenspiel-Convention in einer Messehalle: hundert Tische, Händlerstände, Kostüme, Kaffee aus Pappbechern und Durchsagen, die niemand versteht. Euer Tisch hat eine Nummer, und am Nachbartisch wird sehr laut ein Drache besiegt.",
      tisch: { flaeche: "klapptisch", licht: "halle", deko: ["namensschild", "programmheft", "pappbecher", "tischnummer"] },
      klang: {
        bett: [["o_messe", .22, { tp: 4500 }], ["a_gaeste_n1", .1, { tp: 3000 }]],
        zufall: [["fx_ca_dice_throw", .45, 5], ["fx_ca_dice_shake", .3, 2], ["e_jubel", .14, 2, { fern: true }], ["n_applaus", .14, 1.2, { fern: true }], ["o_durchsage", .2, 1, { fern: true, max: 10 }], ["e_raunen", .14, 1.5, { fern: true }], ["e_stubenlachen", .3, 2], ["n_lachen", .2, 1.5, { fern: true }], ["e_papier", .25, 1.5], ["e_kampfruf", .1, .8, { fern: true }], ["o_lachen", .2, 2, { fern: true }], ["o_kaffee", .15, .8, { fern: true }]],
        abstand: [4, 10]
      }
    },
    zug: {
      name: "Im Zug", ic: "🚆", art: "ausflug",
      wo: "im Zug", kurz: "Im Zug",
      text: "Sechs Stunden Zugfahrt, ein Vierertisch, zwei Plätze auf der anderen Seite des Gangs. Die Würfel rollen im Deckel einer Brotdose, weil sie sonst bei jeder Kurve unter die Sitze fliegen. Draußen zieht das Land vorbei. Die Schaffnerin schaut schon zum dritten Mal.",
      tisch: { flaeche: "zugtisch", licht: "zug", deko: ["brotdose", "fahrkarte", "kaffeebecher", "kekse"] },
      klang: {
        bett: [["o_zug", .3, {}]],
        zufall: [["fx_ca_dice_shake", .4, 3], ["fx_ca_dice_throw", .35, 2], ["o_zugdurchsage", .2, 1.2, { fern: true, max: 13 }], ["o_kaffee", .2, .8, { fern: true }], ["e_stubenlachen", .25, 2], ["e_papier", .25, 1.5], ["fx_rp_bottle", .25, 1], ["e_essen", .25, 1.2], ["n_husten", .15, .6, { fern: true }], ["o_lachen", .2, 1.2]],
        abstand: [6, 15]
      }
    },
    zelt: {
      name: "Zeltlager", ic: "⛺", art: "ausflug",
      wo: "im Zeltlager", kurz: "Zeltlager",
      text: "Ein langes Wochenende auf einer Zeltwiese am Waldrand: ein Pavillon, ein Campingtisch, ein Lagerfeuer, Isomatten und eine Gaslaterne, um die drei Motten kreisen. Vom Festival auf der anderen Seite der Wiese wummert ein Bass herüber.",
      tisch: { flaeche: "camping", licht: "gaslaterne", deko: ["gaskocher", "taschenlampe", "marshmallows", "isomatte"], laub: true },
      klang: {
        bett: [["a_lagerfeuer", .2, { tp: 6000 }], ["a_grillen_n2", .16, { nacht: true }], ["a_voegel_n6", .1, { tag: true }], ["a_zelt", .3, { wetter: "regen" }], ["o_festival", .07, { tp: 300, nacht: true }]],
        zufall: [["fx_ca_dice_throw", .4, 4], ["n_feuerknistern", .3, 3], ["e_eule", .12, 1.5, { fern: true, nacht: true }], ["fx_rp_bottle", .3, 1.5], ["e_frosch", .12, 1, { fern: true, nacht: true }], ["e_stubenlachen", .3, 2], ["n_ast", .2, 1.2], ["e_tuch", .25, 1.2], ["e_insekt", .2, 1.2], ["e_hund", .08, .6, { fern: true }], ["o_jubelfern", .1, .6, { fern: true, nacht: true }], ["o_muecke", .14, 1.2], ["o_lachen", .28, 1.5]],
        abstand: [5, 13]
      }
    },
    see: {
      name: "Bootshaus am See", ic: "🛶", art: "ausflug",
      wo: "im Bootshaus am See", kurz: "Bootshaus",
      text: "Das alte Bootshaus vom Ruderverein, direkt am See: ein Steg, zwei umgedrehte Ruderboote, Netze an der Wand und ein langer Tisch auf den Planken. Durch die Ritzen sieht man das Wasser glitzern. Die Mücken haben euch schon gefunden.",
      tisch: { flaeche: "steg", licht: "laterne", deko: ["seil", "rettungsring", "limo", "angel"] },
      klang: {
        bett: [["a_wellen_n1", .16, { tp: 3000 }], ["a_schilf", .1, {}], ["a_grillen_n1", .14, { nacht: true }], ["a_leichtregen_n3", .2, { wetter: "regen" }]],
        zufall: [["fx_ca_dice_throw", .45, 4], ["n_platsch", .15, 1.5, { fern: true }], ["e_frosch", .15, 2, { nacht: true }], ["e_ente", .14, 1.5, { tag: true, fern: true }], ["e_ruder", .15, 1, { fern: true }], ["fx_ka_creak", .25, 1.5], ["e_insekt", .2, 1.5], ["e_vogel", .1, 1, { tag: true, fern: true }], ["e_stubenlachen", .3, 2], ["fx_rp_bottle", .3, 1.2], ["n_welle", .2, 1], ["o_muecke", .16, 1.8], ["o_lachen", .28, 1.5]],
        abstand: [5, 13]
      }
    }
  };
  const HEIME = ["wohnzimmer", "wgkueche", "keller", "dachboden"];
  const TREFFS = ["laden", "kneipe", "laube"];
  const AUSFLUEGE = ["huette", "burg", "con", "zug", "zelt", "see"];

  /* =====================================================================
     SZENENBILDER (oben auf der Karte, viewBox 0 0 400 130)
     r = Zufall, z = Tageszeit (tag/abend/nacht), id = eindeutige Vorsilbe
     ===================================================================== */
  const dunkler = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f)))); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); };
  const nachtHimmel = (r, n) => Array.from({ length: n }, () => `<circle cx="${f1(r() * 400)}" cy="${f1(r() * 60)}" r="${f1(.4 + r() * .9)}" fill="#fff6dc" opacity="${f1(.4 + r() * .5)}"/>`).join("");
  const fenster = (x, y, w, h, z, r, id, rahmen) => {
    const himmel = z === "nacht" ? ["#2a1d2a", "#47304a"] : z === "abend" ? ["#f0a868", "#a8506a"] : ["#f6dca8", "#e9c49a"];
    let s = `<defs><linearGradient id="${id}fh${x}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${himmel[0]}"/><stop offset="1" stop-color="${himmel[1]}"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}fh${x})"/>`;
    if (z === "nacht") for (let i = 0; i < 6; i++) s += `<circle cx="${f1(x + r() * w)}" cy="${f1(y + r() * h * .6)}" r=".9" fill="#fff6dc" opacity=".7"/>`;
    return s + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${rahmen || "#6b4a2c"}" stroke-width="5"/><path d="M${x + w / 2} ${y} v${h} M${x} ${y + h / 2} h${w}" stroke="${rahmen || "#6b4a2c"}" stroke-width="3"/>`;
  };
  const leute = (r, n, y, x0, x1) => { let s = ""; for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + .5) / n + (r() - .5) * 10, c = ["#a83a32", "#5f7a3a", "#7d4e8a", "#c58a2c", "#6b4a2c", "#9c3d5a"][Math.floor(r() * 6)]; s += `<path d="M${f1(x - 13)} ${y + 30} Q${f1(x)} ${y - 4} ${f1(x + 13)} ${y + 30}Z" fill="${c}"/><circle cx="${f1(x)}" cy="${y - 8}" r="9" fill="${["#f1d3a8", "#d9a77c", "#a8704a", "#e9bf98"][Math.floor(r() * 4)]}"/><path d="M${f1(x - 9)} ${y - 10} Q${f1(x)} ${y - 22} ${f1(x + 9)} ${y - 10}" fill="${["#2b1d12", "#6e4527", "#c99a5a", "#8a8279", "#b8452c"][Math.floor(r() * 5)]}"/>`; } return s; };
  const tischkante = (y, farbe) => `<rect y="${y}" width="400" height="${130 - y}" fill="${farbe}"/><rect y="${y}" width="400" height="4" fill="${dunkler(farbe, 1.2)}"/>`;
  const wuerfelchen = (r, y) => { let s = ""; for (let i = 0; i < 4; i++) { const x = 40 + r() * 320; s += `<path d="M${f1(x)} ${y} l6 -3.5 l6 3.5 v7 l-6 3.5 l-6 -3.5Z" fill="${["#efe0c0", "#a83a32", "#c58a2c", "#5f7a3a"][i]}" stroke="#2b1d12" stroke-width=".8"/>`; } return s; };
  const lampenGlut = (id, farbe) => `<radialGradient id="${id}lg"><stop offset="0" stop-color="${farbe || "#ffd27a"}" stop-opacity=".6"/><stop offset="1" stop-color="${farbe || "#ffd27a"}" stop-opacity="0"/></radialGradient>`;

  const SZENEN = {
    o_wohnzimmer(r, z, id) {
      let s = `<defs>${lampenGlut(id)}</defs><rect width="400" height="130" fill="#d9bf98"/>`;
      for (let x = 0; x < 400; x += 22) s += `<rect x="${x}" y="0" width="11" height="100" fill="#cfb088" opacity=".45"/>`;
      s += fenster(36, 16, 74, 60, z, r, id);
      if (z === "nacht") s += `<path d="M36 16 l74 60" stroke="#fff" stroke-width=".6" opacity=".25"/>`;
      s += `<path d="M30 12 h86" stroke="#7a2418" stroke-width="4"/><path d="M30 12 q-4 40 6 70 h8 q-8 -30 -4 -70Z M116 12 q4 40 -6 70 h-8 q8 -30 4 -70Z" fill="#a83a32"/>`;
      // Regal mit Brettspielen
      s += `<rect x="262" y="8" width="104" height="92" fill="#6b4a2c"/>`;
      for (let j = 0; j < 3; j++) { s += `<rect x="262" y="${34 + j * 28}" width="104" height="4" fill="#4a3220"/>`; let x = 266; while (x < 356) { const w = 14 + r() * 12, h = 8 + r() * 5, c = ["#a83a32", "#c58a2c", "#5f7a3a", "#7d4e8a", "#e8b14e", "#9c3d5a"][Math.floor(r() * 6)]; if (r() < .5) { for (let k = 0; k < 2; k++) s += `<rect x="${f1(x)}" y="${f1(34 + j * 28 - h * (k + 1))}" width="${f1(w)}" height="${f1(h - .6)}" fill="${k ? dunkler(c, .85) : c}"/>`; } else s += `<rect x="${f1(x)}" y="${f1(34 + j * 28 - 18)}" width="${f1(w * .45)}" height="18" fill="${c}"/>`; x += w + 2; } }
      // Wanduhr
      s += `<circle cx="196" cy="26" r="13" fill="#efe6d0" stroke="#5c3d24" stroke-width="3"/><path d="M196 26 v-8 M196 26 l6 3" stroke="#2b1d12" stroke-width="1.6" stroke-linecap="round"/>`;
      // Stehlampe + Sofa
      s += `<path d="M150 100 V30" stroke="#2b1d12" stroke-width="2.5"/><path d="M138 30 h24 l-5 -14 h-14Z" fill="#e8b14e"/><circle cx="150" cy="36" r="40" fill="url(#${id}lg)"/>`;
      s += `<rect x="168" y="70" width="86" height="30" rx="8" fill="#7d4e8a"/><rect x="164" y="62" width="94" height="14" rx="7" fill="#8e5bb5" opacity=".9"/><rect x="176" y="66" width="22" height="14" rx="4" fill="#e8b14e" transform="rotate(-10 187 73)"/>`;
      s += tischkante(100, "#9c6a3a") + wuerfelchen(r, 112);
      s += `<rect x="${f1(150 + r() * 60)}" y="105" width="38" height="20" rx="2" fill="#fffdf4" transform="rotate(-5 200 112)"/><circle cx="330" cy="114" r="9" fill="#a83a32"/><circle cx="330" cy="114" r="6" fill="#5c2a14"/>`;
      return s;
    },
    o_wgkueche(r, z, id) {
      let s = `<defs>${lampenGlut(id)}</defs><rect width="400" height="130" fill="#e9dcc0"/>`;
      for (let y = 40; y < 100; y += 12) for (let x = (y / 12 % 2) * 6; x < 400; x += 12) s += `<rect x="${x}" y="${y}" width="11" height="11" fill="#efe6d4" stroke="#d6c6a6" stroke-width=".6"/>`;
      // Hängeschränke
      s += `<rect x="0" y="0" width="400" height="36" fill="#c58a2c"/>`; for (let x = 4; x < 400; x += 66) s += `<rect x="${x}" y="3" width="60" height="30" fill="#d9a04a" stroke="#8a5a10"/><circle cx="${x + 54}" cy="28" r="1.8" fill="#5c3d24"/>`;
      // Kühlschrank mit Zetteln
      s += `<rect x="318" y="10" width="62" height="90" rx="4" fill="#efe9dc" stroke="#9a8f80" stroke-width="2"/><path d="M318 44 h62" stroke="#9a8f80" stroke-width="2"/><rect x="372" y="20" width="3" height="16" fill="#9a8f80"/><rect x="372" y="52" width="3" height="22" fill="#9a8f80"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="${f1(324 + r() * 40)}" y="${f1(48 + r() * 40)}" width="10" height="12" fill="${["#ffe9a0", "#ff9a7a", "#c9e08a", "#fff6dc"][i % 4]}" transform="rotate(${f1((r() - .5) * 20)} 340 60)"/>`;
      // Herd mit Topf + Dampf
      s += `<rect x="40" y="62" width="70" height="38" fill="#8a8279"/><rect x="40" y="58" width="70" height="6" fill="#5a524a"/><path d="M56 58 v-14 h34 v14" fill="#a83a32"/><path d="M62 40 q-6 -10 2 -18 M74 38 q-6 -12 2 -20 M84 40 q-4 -8 2 -14" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55"/>`;
      // Putzplan
      s += `<rect x="150" y="44" width="46" height="40" fill="#fffdf4" stroke="#cdbb94"/><text x="173" y="54" font-size="6.5" text-anchor="middle" fill="#a83a32" font-weight="800">PUTZPLAN</text>`; for (let i = 0; i < 4; i++) s += `<path d="M156 ${62 + i * 6} h34" stroke="#8a7a62" stroke-width=".8"/><path d="M186 ${60 + i * 6} l3 3" stroke="#a83a32" stroke-width="1" opacity="${i % 3 ? 0 : 1}"/>`;
      // Hängelampe
      s += `<path d="M250 0 v40" stroke="#2b1d12" stroke-width="1.6"/><path d="M236 52 q14 -16 28 0Z" fill="#a83a32"/><circle cx="250" cy="58" r="44" fill="url(#${id}lg)"/>`;
      s += `<rect y="100" width="400" height="30" fill="#e8d8c0"/>`;
      for (let x = 0; x < 400; x += 16) for (let y = 100; y < 130; y += 16) if ((x / 16 + y / 16) % 2 < 1) s += `<rect x="${x}" y="${y}" width="16" height="16" fill="#c0442f" opacity=".75"/>`;
      s += `<rect y="100" width="400" height="3" fill="#a83a32" opacity=".6"/>` + wuerfelchen(r, 114) + `<rect x="${f1(200 + r() * 80)}" y="104" width="9" height="20" rx="2" fill="#c58a2c"/><rect x="${f1(120 + r() * 40)}" y="108" width="7" height="16" rx="2" fill="#5f7a3a"/>`;
      return s;
    },
    o_keller(r, z, id) {
      let s = `<defs>${lampenGlut(id, "#ffe9b0")}</defs><rect width="400" height="130" fill="#6e665c"/>`;
      for (let y = 0; y < 100; y += 14) for (let x = -(y / 14 % 2) * 16; x < 400; x += 32) s += `<rect x="${x + 1}" y="${y + 1}" width="30" height="12" fill="${dunkler("#8a8279", .8 + r() * .3)}"/>`;
      // Kellerfenster oben
      s += `<rect x="40" y="4" width="70" height="20" fill="${z === "nacht" ? "#1f1820" : "#9c8a6a"}" stroke="#4a3e36" stroke-width="3"/>`; if (z !== "nacht") s += `<path d="M44 24 q6 -10 12 0 M60 24 q5 -8 10 0" stroke="#5f7a3a" stroke-width="2" fill="none"/>`;
      // Rohre
      s += `<path d="M0 34 H400" stroke="#9a8f80" stroke-width="7"/><path d="M0 34 H400" stroke="#c9c0b0" stroke-width="2" opacity=".5"/><path d="M130 34 V100 M300 34 V100" stroke="#8a8279" stroke-width="6"/><rect x="296" y="56" width="12" height="8" fill="#a83a32"/>`;
      // Regal mit Minis und Farben
      s += `<rect x="150" y="40" width="120" height="4" fill="#4a3220"/><rect x="150" y="70" width="120" height="4" fill="#4a3220"/>`;
      for (let i = 0; i < 14; i++) s += `<path d="M${156 + i * 8} 40 v-6 a3 3 0 0 1 3 -3 a3 3 0 0 1 3 3 v6Z" fill="${["#8a8279", "#a83a32", "#5f7a3a", "#c58a2c", "#7d4e8a"][i % 5]}"/>`;
      for (let i = 0; i < 9; i++) s += `<rect x="${156 + i * 12}" y="60" width="8" height="10" fill="${["#a83a32", "#e8b14e", "#5f7a3a", "#efe0c0", "#7d4e8a", "#c46a8a"][i % 6]}"/><rect x="${156 + i * 12}" y="58" width="8" height="3" fill="#2b2622"/>`;
      // Die verschlossene Tür
      s += `<rect x="330" y="30" width="44" height="70" fill="#4a3220" stroke="#2b1a0e" stroke-width="3"/><circle cx="366" cy="66" r="2.5" fill="#c58a2c"/><rect x="340" y="44" width="24" height="10" fill="#efe0c0" opacity=".8"/><text x="352" y="51.5" font-size="5" text-anchor="middle" fill="#a83a32" font-weight="800">PRIVAT</text>`;
      // Glühbirne
      s += `<path d="M232 0 v20" stroke="#2b1d12" stroke-width="1.2"/><circle cx="232" cy="25" r="5" fill="#fff3cf"/><circle cx="232" cy="25" r="48" fill="url(#${id}lg)"/>`;
      s += tischkante(100, "#7a6450") + wuerfelchen(r, 112) + `<rect x="${f1(60 + r() * 40)}" y="106" width="30" height="16" fill="#a83a32"/><rect x="${f1(64 + r() * 40)}" y="110" width="20" height="4" fill="#e8b14e"/>`;
      return s;
    },
    o_dachboden(r, z, id) {
      let s = `<defs>${lampenGlut(id)}</defs><rect width="400" height="130" fill="#d8c09a"/>`;
      s += `<path d="M0 0 L120 0 L0 70Z" fill="#b8956a"/><path d="M400 0 L280 0 L400 70Z" fill="#b8956a"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${i * 22} 0 L0 ${i * 13}" stroke="#8a6a44" stroke-width="2" opacity=".5"/><path d="M${400 - i * 22} 0 L400 ${i * 13}" stroke="#8a6a44" stroke-width="2" opacity=".5"/>`;
      // Dachfenster mit Regen oder Sternen
      s += `<path d="M160 6 L240 6 L250 52 L150 52Z" fill="${z === "nacht" ? "#2a1d2a" : z === "abend" ? "#c46a5a" : "#e9c49a"}" stroke="#6b4a2c" stroke-width="4"/>`;
      if (z === "nacht") s += nachtHimmel(r, 0) + `<circle cx="214" cy="20" r="4" fill="#f6ecd3"/>`;
      for (let i = 0; i < 9; i++) { const x = 160 + r() * 80, y = 10 + r() * 36; s += `<path d="M${f1(x)} ${f1(y)} q1 4 0 6" stroke="#fff6dc" stroke-width="1" opacity=".55"/>`; }
      // Lichterkette
      let d = "M0 30"; for (let x = 0; x <= 400; x += 40) d += ` Q${x + 20} ${42 + (x / 40 % 2) * 4} ${x + 40} 30`; s += `<path d="${d}" stroke="#2b1d12" stroke-width="1" fill="none"/>`;
      for (let x = 20; x < 400; x += 20) s += `<circle cx="${x}" cy="${f1(37 + Math.sin(x / 40 * Math.PI) * 3)}" r="2.6" fill="${["#ffd27a", "#ff9a5a", "#ffe9a0"][x / 20 % 3]}"/><circle cx="${x}" cy="${f1(37 + Math.sin(x / 40 * Math.PI) * 3)}" r="7" fill="#ffd27a" opacity=".18"/>`;
      // Bücherstapel, Sitzsack
      s += `<ellipse cx="70" cy="96" rx="40" ry="18" fill="#a83a32"/><ellipse cx="66" cy="88" rx="24" ry="10" fill="#c0442f"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="${330 - (i % 2) * 3}" y="${92 - i * 7}" width="44" height="6" fill="${["#5f7a3a", "#7a2418", "#c58a2c", "#5c3d24", "#7d4e8a", "#efe0c0"][i]}"/>`;
      s += tischkante(100, "#a8875a");
      for (let x = 0; x < 400; x += 36) s += `<path d="M${x} 100 v30" stroke="#7a5233" stroke-width="1.2" opacity=".6"/>`;
      s += wuerfelchen(r, 112) + `<circle cx="${f1(120 + r() * 160)}" cy="115" r="8" fill="#efe6d0"/><circle cx="${f1(120 + r() * 160)}" cy="115" r="5" fill="#8a4a1a" opacity=".7"/>`;
      return s;
    },
    o_laden(r, z, id) {
      let s = `<rect width="400" height="130" fill="#cdbb94"/>`;
      // Regale voller Spiele
      for (let reg = 0; reg < 3; reg++) { const x0 = reg * 140 + 6; s += `<rect x="${x0}" y="0" width="124" height="100" fill="#6b4a2c"/>`; for (let j = 0; j < 4; j++) { s += `<rect x="${x0}" y="${24 + j * 24}" width="124" height="3" fill="#4a3220"/>`; let x = x0 + 3; while (x < x0 + 118) { const w = 10 + r() * 16, h = 10 + r() * 10; s += `<rect x="${f1(x)}" y="${f1(24 + j * 24 - h)}" width="${f1(w)}" height="${f1(h)}" fill="${["#a83a32", "#c58a2c", "#5f7a3a", "#7d4e8a", "#e8b14e", "#9c3d5a", "#efe0c0", "#5c3d24"][Math.floor(r() * 8)]}"/>`; x += w + 1.5; } } }
      // Plakat
      s += `<rect x="146" y="6" width="40" height="54" fill="#efe0c0" transform="rotate(4 166 33)"/><text x="166" y="22" font-size="6" text-anchor="middle" fill="#a83a32" font-weight="800" transform="rotate(4 166 33)">CON '96</text><path d="M152 40 l14 -12 l14 12Z" fill="#5f7a3a" transform="rotate(4 166 33)"/>`;
      // Neonröhre
      s += `<rect x="60" y="0" width="280" height="5" fill="#fff8e0"/><rect x="40" y="0" width="320" height="26" fill="#fff8e0" opacity=".12"/>`;
      s += `<rect y="100" width="400" height="30" fill="#3f5424"/><rect y="100" width="400" height="3" fill="#2b3a18"/>`;
      for (let i = 0; i < 40; i++) s += `<circle cx="${f1(r() * 400)}" cy="${f1(104 + r() * 24)}" r=".7" fill="#5f7a3a" opacity=".6"/>`;
      s += wuerfelchen(r, 114) + `<rect x="${f1(250 + r() * 50)}" y="104" width="44" height="22" fill="#e8b14e"/><text x="${f1(272 + r() * 0)}" y="118" font-size="7" fill="#7a2418" font-weight="800"></text>`;
      return s;
    },
    o_kneipe(r, z, id) {
      let s = `<defs>${lampenGlut(id, "#ffb648")}</defs><rect width="400" height="130" fill="#4a2f1b"/>`;
      for (let x = 0; x < 400; x += 30) s += `<rect x="${x}" y="40" width="29" height="60" fill="${dunkler("#5c3d24", .9 + r() * .25)}"/>`;
      s += `<rect y="36" width="400" height="6" fill="#2b1a0e"/>`;
      // Geweih „Gerold“
      s += `<path d="M196 20 q-20 -14 -26 -2 M196 20 q-12 -18 -6 -18 M204 20 q20 -14 26 -2 M204 20 q12 -18 6 -18" stroke="#e9dcc0" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="200" cy="26" rx="10" ry="7" fill="#6b4a2c"/>`;
      // Kachelofen
      s += `<rect x="20" y="28" width="60" height="72" fill="#8e4a2a"/>`; for (let y = 32; y < 100; y += 12) for (let x = 22; x < 78; x += 14) s += `<rect x="${x}" y="${y}" width="12" height="10" rx="1.5" fill="#a85a32" stroke="#6b3418" stroke-width=".8"/>`;
      // Fernseher mit Fußball
      s += `<rect x="300" y="10" width="72" height="44" rx="3" fill="#1a1410"/><rect x="304" y="14" width="64" height="36" fill="${"#5f7a3a"}"/><path d="M336 14 v36" stroke="#efe0c0" stroke-width=".8" opacity=".6"/><circle cx="336" cy="32" r="7" fill="none" stroke="#efe0c0" stroke-width=".8" opacity=".6"/><circle cx="${f1(316 + r() * 40)}" cy="${f1(22 + r() * 20)}" r="1.6" fill="#fff"/>`;
      // Hängelampen
      for (let i = 0; i < 3; i++) { const x = 120 + i * 80; s += `<path d="M${x} 0 v18" stroke="#2b1d12"/><path d="M${x - 10} 26 q10 -12 20 0Z" fill="#3f5424"/><circle cx="${x}" cy="30" r="36" fill="url(#${id}lg)"/>`; }
      s += tischkante(100, "#3a2414");
      for (let i = 0; i < 5; i++) { const x = 30 + i * 80 + r() * 20; s += `<circle cx="${f1(x)}" cy="116" r="9" fill="#efe0c0"/><circle cx="${f1(x)}" cy="116" r="7" fill="none" stroke="#a83a32" stroke-width="1"/>`; if (i % 2) s += `<rect x="${f1(x - 5)}" y="96" width="10" height="20" rx="2" fill="#e8b14e" opacity=".9"/><rect x="${f1(x - 5)}" y="94" width="10" height="5" rx="1.5" fill="#fff6dc"/>`; }
      s += wuerfelchen(r, 120);
      return s;
    },
    o_laube(r, z, id) {
      const nacht = z === "nacht";
      let s = `<defs>${lampenGlut(id)}</defs><rect width="400" height="130" fill="${nacht ? "#2a2230" : z === "abend" ? "#f0b070" : "#f2dcae"}"/>`;
      if (nacht) s += nachtHimmel(r, 30);
      // Hecke + Laube
      s += `<path d="M0 70 Q40 50 80 66 Q120 48 160 64 Q200 50 240 66 Q280 52 320 64 Q360 50 400 66 V100 H0Z" fill="${nacht ? "#2b3020" : "#5f7a3a"}"/>`;
      s += `<path d="M230 100 V40 L290 18 L350 40 V100Z" fill="${nacht ? "#4a3220" : "#9c6a3a"}"/><path d="M222 42 L290 12 L358 42" stroke="#5c2a14" stroke-width="7" fill="none"/><rect x="262" y="54" width="26" height="22" fill="${nacht ? "#ffd27a" : "#f6dca8"}" stroke="#5c3d24" stroke-width="2"/><rect x="300" y="60" width="22" height="40" fill="#5c3d24"/>`;
      // Sonnenblumen, Gartenzwerg, Windspiel
      for (let i = 0; i < 4; i++) { const x = 30 + i * 30 + r() * 10; s += `<path d="M${f1(x)} 100 V${f1(50 + r() * 10)}" stroke="#4f6b2c" stroke-width="2.5"/><circle cx="${f1(x)}" cy="${f1(50 + r() * 6)}" r="8" fill="#e8b14e"/><circle cx="${f1(x)}" cy="${f1(50 + r() * 6)}" r="3.5" fill="#5c3d24"/>`; }
      s += `<path d="M180 100 l8 -22 l8 22Z" fill="#a83a32"/><circle cx="188" cy="84" r="5" fill="#f1d3a8"/><path d="M184 88 q4 6 8 0" fill="#efe9dc"/>`;
      s += `<path d="M350 44 v12" stroke="#2b1d12"/>` + [0, 1, 2, 3].map(i => `<rect x="${344 + i * 4}" y="56" width="2" height="${10 + i * 3}" fill="#c9b48a"/>`).join("");
      // Lichterkette / Laterne
      s += `<path d="M0 22 Q100 40 230 34" stroke="#2b1d12" stroke-width="1" fill="none"/>`; for (let i = 1; i < 10; i++) s += `<circle cx="${i * 23}" cy="${f1(22 + Math.sin(i / 10 * Math.PI) * 14)}" r="2.4" fill="${nacht ? "#ffd27a" : "#efe0c0"}"/>${nacht ? `<circle cx="${i * 23}" cy="${f1(22 + Math.sin(i / 10 * Math.PI) * 14)}" r="8" fill="#ffd27a" opacity=".2"/>` : ""}`;
      // Karierte Tischdecke
      s += `<rect y="100" width="400" height="30" fill="#efe6d4"/>`; for (let x = 0; x < 400; x += 14) s += `<rect x="${x}" y="100" width="7" height="30" fill="#c0442f" opacity=".45"/>`; for (let y = 100; y < 130; y += 14) s += `<rect x="0" y="${y}" width="400" height="7" fill="#c0442f" opacity=".45"/>`;
      s += wuerfelchen(r, 114) + `<rect x="${f1(220 + r() * 60)}" y="102" width="8" height="22" rx="3" fill="#e8b14e" opacity=".9"/>`;
      return s;
    },
    o_huette(r, z, id) {
      let s = `<defs>${lampenGlut(id, "#ff9a3a")}</defs><rect width="400" height="130" fill="#6b4a2c"/>`;
      for (let y = 0; y < 100; y += 13) s += `<rect x="0" y="${y}" width="400" height="12" rx="6" fill="${dunkler("#8a5a30", .85 + r() * .25)}"/><path d="M0 ${y + 11} H400" stroke="#3a2414" stroke-width="1.5" opacity=".6"/>`;
      // Fenster in den Wald
      s += `<rect x="40" y="16" width="70" height="56" fill="${z === "nacht" ? "#1f1a22" : "#d9c49a"}"/>`;
      for (let i = 0; i < 6; i++) { const x = 42 + i * 12 + r() * 4; s += `<path d="M${f1(x - 7)} 72 L${f1(x)} ${f1(34 + r() * 12)} L${f1(x + 7)} 72Z" fill="${z === "nacht" ? "#14110f" : "#3f5424"}"/>`; }
      if (z === "nacht") s += `<circle cx="96" cy="26" r="4" fill="#f6ecd3"/>`;
      s += `<rect x="40" y="16" width="70" height="56" fill="none" stroke="#3a2414" stroke-width="5"/><path d="M75 16 v56 M40 44 h70" stroke="#3a2414" stroke-width="3"/>`;
      // Geweih + Kaminofen
      s += `<path d="M200 22 q-16 -12 -20 0 M200 22 q-8 -14 -4 -16 M208 22 q16 -12 20 0 M208 22 q8 -14 4 -16" stroke="#e9dcc0" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="204" cy="26" rx="8" ry="5" fill="#4a3220"/>`;
      s += `<rect x="300" y="0" width="14" height="40" fill="#2b2622"/><rect x="280" y="40" width="54" height="60" rx="4" fill="#2b2622"/><rect x="290" y="54" width="34" height="28" rx="3" fill="#1a1008"/><circle cx="307" cy="70" r="40" fill="url(#${id}lg)"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="M${296 + i * 7} 80 Q${300 + i * 7} ${f1(60 - r() * 6)} ${303 + i * 7} 80Z" fill="${["#ff7a3a", "#ffb648", "#ffd27a", "#e0442a"][i]}"/>`;
      // Holzstapel
      for (let i = 0; i < 8; i++) s += `<circle cx="${350 + (i % 4) * 11}" cy="${94 - Math.floor(i / 4) * 10}" r="5" fill="#9c6a3a" stroke="#5c3d24" stroke-width="1.5"/>`;
      s += tischkante(100, "#5c3d24"); for (let x = 0; x < 400; x += 50) s += `<path d="M${x} 104 q20 6 40 0" stroke="#3a2414" stroke-width="1" fill="none" opacity=".6"/>`;
      s += wuerfelchen(r, 114) + `<rect x="${f1(150 + r() * 60)}" y="100" width="12" height="22" rx="2" fill="#a83a32"/><rect x="${f1(150 + r() * 60)}" y="98" width="12" height="4" fill="#8a8279"/>`;
      return s;
    },
    o_burg(r, z, id) {
      let s = `<defs>${lampenGlut(id, "#ffb648")}</defs><rect width="400" height="130" fill="#5a524a"/>`;
      for (let y = 0; y < 100; y += 16) for (let x = -(y / 16 % 2) * 20; x < 400; x += 40) s += `<rect x="${x + 1}" y="${y + 1}" width="38" height="14" rx="2" fill="${dunkler("#7a7268", .8 + r() * .3)}"/>`;
      // Spitzbogenfenster
      s += `<path d="M180 80 V36 Q200 6 220 36 V80Z" fill="${z === "nacht" ? "#2a1d2a" : z === "abend" ? "#e89a6a" : "#f2d9a8"}" stroke="#3b342e" stroke-width="5"/><path d="M200 16 V80 M180 50 H220" stroke="#3b342e" stroke-width="2.5"/>`;
      if (z === "nacht") s += `<circle cx="210" cy="34" r="3.5" fill="#f6ecd3"/>`;
      // Wappen + Fackeln
      for (const x of [60, 340]) s += `<rect x="${x - 2}" y="44" width="4" height="16" fill="#4a3220"/><path d="M${x} 30 q7 8 0 14 q-7 -6 0 -14Z" fill="#ffb648"/><circle cx="${x}" cy="38" r="34" fill="url(#${id}lg)"/>`;
      s += `<path d="M110 20 h40 v30 q-20 18 -40 0Z" fill="#a83a32" stroke="#e8b14e" stroke-width="2"/><path d="M130 24 v26 M112 36 h36" stroke="#e8b14e" stroke-width="3"/>`;
      s += `<path d="M250 20 h40 v30 q-20 18 -40 0Z" fill="#5f7a3a" stroke="#e8b14e" stroke-width="2"/><circle cx="270" cy="36" r="7" fill="#e8b14e"/>`;
      // Rüstung
      s += `<g transform="translate(360 64)"><circle cy="-14" r="8" fill="#8a8279"/><rect x="-9" y="-6" width="18" height="24" rx="4" fill="#9a8f80"/><path d="M-9 18 l-3 18 M9 18 l3 18" stroke="#8a8279" stroke-width="5"/><path d="M-5 -16 h10" stroke="#2b2622" stroke-width="2"/></g>`;
      s += tischkante(100, "#5c3d24");
      s += `<g transform="translate(${f1(100 + r() * 40)} 102)"><path d="M0 0 v-18 M-8 -18 h16" stroke="#c58a2c" stroke-width="2"/><rect x="-1.5" y="-28" width="3" height="10" fill="#efe6d0"/><path d="M0 -34 q3 3 0 6 q-3 -3 0 -6" fill="#ffb648"/></g>` + wuerfelchen(r, 114) + `<path d="M300 104 h14 l-2 18 h-10Z" fill="#9a8f80"/>`;
      return s;
    },
    o_con(r, z, id) {
      let s = `<rect width="400" height="130" fill="#cfc3ad"/>`;
      // Hallendecke mit Trägern
      s += `<rect width="400" height="28" fill="#8a8279"/>`; for (let x = 0; x < 400; x += 40) s += `<path d="M${x} 0 L${x + 20} 28 L${x + 40} 0" stroke="#6e6458" stroke-width="2" fill="none"/>`;
      for (let x = 30; x < 400; x += 90) s += `<rect x="${x}" y="28" width="40" height="3" fill="#fff8e0"/><path d="M${x} 31 L${x - 20} 100 H${x + 60} L${x + 40} 31Z" fill="#fff8e0" opacity=".08"/>`;
      // Banner der Con + Stände
      s += `<path d="M120 34 h160 v20 l-80 8 l-80 -8Z" fill="#a83a32"/><text x="200" y="49" font-size="11" text-anchor="middle" fill="#efe0c0" font-family="serif" font-weight="800" letter-spacing="1.5">WÜRFELZEIT</text>`;
      for (let i = 0; i < 4; i++) { const x = 10 + i * 100; s += `<rect x="${x}" y="66" width="80" height="26" fill="${["#c58a2c", "#5f7a3a", "#7d4e8a", "#9c3d5a"][i]}" opacity=".8"/><rect x="${x}" y="62" width="80" height="6" fill="${dunkler(["#c58a2c", "#5f7a3a", "#7d4e8a", "#9c3d5a"][i], .7)}"/>`; }
      s += leute(r, 9, 82, 0, 400);
      // Tischnummer
      s += tischkante(104, "#d9cdb0");
      s += `<g transform="translate(${f1(310 + r() * 30)} 106)"><path d="M0 18 L10 0 L20 18Z" fill="#efe0c0" stroke="#8a7a62"/><text x="10" y="15" font-size="7" text-anchor="middle" fill="#a83a32" font-weight="800">${17 + Math.floor(r() * 60)}</text></g>` + wuerfelchen(r, 116) + `<rect x="${f1(150 + r() * 60)}" y="106" width="22" height="16" rx="2" fill="#efe0c0" stroke="#a83a32"/>`;
      return s;
    },
    o_zug(r, z, id) {
      const nacht = z === "nacht";
      let s = `<rect width="400" height="130" fill="#8a8279"/>`;
      // zwei Fenster mit vorbeiziehender Landschaft
      for (const x0 of [20, 210]) {
        s += `<rect x="${x0}" y="10" width="170" height="74" rx="10" fill="${nacht ? "#241c26" : z === "abend" ? "#f0a868" : "#efdcb0"}"/>`;
        s += `<g clip-path="url(#${id}c${x0})"><defs><clipPath id="${id}c${x0}"><rect x="${x0}" y="10" width="170" height="74" rx="10"/></clipPath></defs>`;
        if (nacht) s += `<circle cx="${x0 + 140}" cy="26" r="5" fill="#f6ecd3"/>` + Array.from({ length: 6 }, () => `<circle cx="${f1(x0 + r() * 170)}" cy="${f1(66 + r() * 10)}" r="1.4" fill="#ffd27a"/>`).join("");
        let d = `M${x0} 84 L${x0} 60`; for (let x = 0; x <= 170; x += 17) d += ` Q${x0 + x + 8} ${f1(48 + r() * 14)} ${x0 + x + 17} ${f1(56 + r() * 8)}`; s += `<path d="${d} L${x0 + 170} 84Z" fill="${nacht ? "#1a161a" : "#7fa64a"}"/>`;
        for (let i = 0; i < 4; i++) s += `<path d="M${f1(x0 + r() * 170)} 84 l0 -14" stroke="${nacht ? "#14110f" : "#3f5424"}" stroke-width="5" stroke-linecap="round"/>`;
        s += `<path d="M${x0} 10 l40 74 M${x0 + 30} 10 l40 74" stroke="#fff" stroke-width="6" opacity=".08"/></g>`;
        s += `<rect x="${x0}" y="10" width="170" height="74" rx="10" fill="none" stroke="#5a524a" stroke-width="5"/>`;
      }
      // Sitzlehnen
      s += `<rect x="0" y="70" width="30" height="34" rx="8" fill="#a83a32"/><rect x="370" y="70" width="30" height="34" rx="8" fill="#a83a32"/><rect x="180" y="70" width="40" height="34" rx="8" fill="#8e2a20"/>`;
      s += tischkante(98, "#b0a898") + wuerfelchen(r, 112);
      s += `<rect x="${f1(80 + r() * 40)}" y="102" width="56" height="22" rx="6" fill="#5f7a3a"/><rect x="${f1(84 + r() * 40)}" y="106" width="48" height="14" rx="4" fill="#efe0c0" opacity=".4"/><rect x="${f1(250 + r() * 50)}" y="104" width="34" height="18" fill="#fffdf4"/><text x="${f1(268 + r() * 0)}" y="0" font-size="1"></text>`;
      return s;
    },
    o_zelt(r, z, id) {
      const nacht = z !== "tag";
      let s = `<defs>${lampenGlut(id, "#ffb648")}</defs><rect width="400" height="130" fill="${nacht ? "#241c26" : "#f2dcae"}"/>`;
      if (nacht) s += nachtHimmel(r, 40);
      s += `<path d="M0 74 Q100 58 200 70 Q300 60 400 72 V130 H0Z" fill="${nacht ? "#2b3020" : "#7fa64a"}"/>`;
      for (let i = 0; i < 10; i++) { const x = r() * 400; s += `<path d="M${f1(x - 8)} 70 L${f1(x)} ${f1(40 + r() * 14)} L${f1(x + 8)} 70Z" fill="${nacht ? "#14110f" : "#3f5424"}"/>`; }
      // Zelte
      s += `<path d="M20 100 L70 46 L120 100Z" fill="#c58a2c"/><path d="M70 46 L70 100" stroke="#8a5a10" stroke-width="2"/><path d="M58 100 L70 72 L82 100Z" fill="#5c3d24"/>`;
      s += `<path d="M300 100 L340 58 L380 100Z" fill="#5f7a3a"/><path d="M330 100 L340 78 L350 100Z" fill="#2b3020"/>`;
      // Festivalbühne in der Ferne
      s += `<rect x="190" y="50" width="60" height="22" fill="#2b2622"/><path d="M186 50 h68 l-6 -8 h-56Z" fill="#3e3630"/>` + (nacht ? `<path d="M200 50 L180 20 M220 50 L224 14 M240 50 L262 18" stroke="#ffd27a" stroke-width="3" opacity=".35"/>` : "");
      // Lagerfeuer + Laterne
      s += `<circle cx="160" cy="102" r="40" fill="url(#${id}lg)"/>`; for (let i = 0; i < 4; i++) s += `<path d="M${150 + i * 6} 104 Q${153 + i * 6} ${f1(86 - r() * 8)} ${156 + i * 6} 104Z" fill="${["#ff7a3a", "#ffb648", "#ffd27a", "#e0442a"][i]}"/>`;
      s += `<path d="M144 106 l32 -6 M146 100 l30 8" stroke="#5c3d24" stroke-width="4" stroke-linecap="round"/>`;
      s += tischkante(108, "#c9c0b0"); for (let x = 0; x < 400; x += 20) s += `<rect x="${x}" y="108" width="10" height="22" fill="#a83a32" opacity=".22"/>`;
      s += wuerfelchen(r, 118);
      return s;
    },
    o_see(r, z, id) {
      const nacht = z === "nacht", abend = z === "abend";
      let s = `<defs>${lampenGlut(id)}</defs><rect width="400" height="130" fill="${nacht ? "#241c26" : abend ? "#f0a868" : "#f2dcae"}"/>`;
      if (nacht) s += nachtHimmel(r, 30);
      // Hügel am anderen Ufer
      s += `<path d="M0 54 Q80 30 160 48 Q240 34 320 50 Q360 42 400 50 V70 H0Z" fill="${nacht ? "#1a161a" : "#6f8f3a"}"/>`;
      // Wasser (warm, golden im Licht)
      s += `<rect y="66" width="400" height="34" fill="${nacht ? "#2b2430" : abend ? "#d0844a" : "#b8a070"}"/>`;
      for (let i = 0; i < 18; i++) s += `<path d="M${f1(r() * 400)} ${f1(70 + r() * 26)} h${f1(8 + r() * 20)}" stroke="${nacht ? "#f6ecd3" : "#fff3cf"}" stroke-width="1.4" opacity="${f1(.25 + r() * .4)}"/>`;
      if (!nacht) s += `<circle cx="${abend ? 300 : 80}" cy="${abend ? 50 : 22}" r="${abend ? 16 : 11}" fill="#fff3cf"/>`; else s += `<circle cx="320" cy="24" r="8" fill="#f6ecd3"/><path d="M314 74 h12 M316 80 h8 M318 86 h4" stroke="#f6ecd3" stroke-width="1.6" opacity=".6"/>`;
      // Schilf + Boot
      for (let i = 0; i < 12; i++) { const x = (i < 6 ? 0 : 330) + r() * 70; s += `<path d="M${f1(x)} 100 q${f1((r() - .5) * 6)} -20 ${f1((r() - .5) * 10)} -34" stroke="${nacht ? "#2b3020" : "#4f6b2c"}" stroke-width="2" fill="none"/>`; }
      s += `<path d="M140 80 Q170 92 210 80 L204 88 Q170 96 146 88Z" fill="#8a5a30"/>`;
      // Steg / Planken
      s += `<rect y="100" width="400" height="30" fill="#9c7a52"/>`; for (let x = 0; x < 400; x += 26) s += `<rect x="${x + 24}" y="100" width="2" height="30" fill="#3a2414" opacity=".7"/>`;
      s += `<rect x="${f1(40 + r() * 30)}" y="102" width="10" height="22" rx="3" fill="#e8b14e" opacity=".9"/><circle cx="${f1(330 + r() * 30)}" cy="114" r="11" fill="none" stroke="#c0442f" stroke-width="5"/>` + wuerfelchen(r, 112);
      return s;
    }
  };

  /* =====================================================================
     DER TISCH JE ORT (von oben)
     ===================================================================== */
  const FLAECHE = {
    // [Grundfarbe, Brettbreite, Maserung, Fugen]
    holz: null,
    eiche: { farbe: "#9c6a3a", brett: 90, mas: "#5c3d24", fuge: "#4a2f1b" },
    altholz: { farbe: "#7a6450", brett: 70, mas: "#3b2a1a", fuge: "#2b1d12", flecken: "#4a3e36" },
    dielen: { farbe: "#a8875a", brett: 60, mas: "#6b4a2c", fuge: "#4a3220" },
    rustikal: { farbe: "#6b4a2c", brett: 140, mas: "#2b1a0e", fuge: "#1a1008", aeste: true },
    eichentafel: { farbe: "#5c3d24", brett: 160, mas: "#2b1a0e", fuge: "#1a1008", aeste: true },
    kneipe: { farbe: "#3a2414", brett: 110, mas: "#1a1008", fuge: "#140b06", lack: true },
    steg: { farbe: "#9c7a52", brett: 46, mas: "#5c3d24", fuge: "#1a1410", ritzen: true },
    wachstuch: { muster: "karo", farbe: "#efe6d4", karo: "#c0442f", groesse: 46 },
    picknick: { muster: "karo", farbe: "#f4ecdc", karo: "#a83a32", groesse: 60, holzRand: "#8a5a30" },
    filz: { muster: "filz", farbe: "#3f5424", rand: "#2b1a0e" },
    klapptisch: { muster: "kunststoff", farbe: "#d9cdb0", kante: "#9a8f80" },
    zugtisch: { muster: "kunststoff", farbe: "#b0a898", kante: "#6e6458", fenster: true },
    camping: { muster: "streifen", farbe: "#c9c0b0", streifen: "#a83a32" }
  };
  function flaeche(W, H, r, id, art) {
    const F = FLAECHE[art];
    if (!F) return null;   // altes dunkles Holz zeichnet die Grafik selbst
    let s = `<defs><radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient></defs>`;
    if (F.muster === "karo") {
      s += `<rect width="${W}" height="${H}" fill="${F.holzRand || F.farbe}"/>`;
      const g = F.groesse, x0 = F.holzRand ? 30 : 0;
      s += `<rect x="${x0}" y="${x0}" width="${W - 2 * x0}" height="${H - 2 * x0}" fill="${F.farbe}"/>`;
      for (let x = x0; x < W - x0; x += g) s += `<rect x="${x}" y="${x0}" width="${g / 2}" height="${H - 2 * x0}" fill="${F.karo}" opacity=".38"/>`;
      for (let y = x0; y < H - x0; y += g) s += `<rect x="${x0}" y="${y}" width="${W - 2 * x0}" height="${g / 2}" fill="${F.karo}" opacity=".38"/>`;
      for (let i = 0; i < 8; i++) s += `<path d="M${f1(r() * W)} ${f1(r() * H)} q${f1(40 + r() * 60)} ${f1((r() - .5) * 30)} ${f1(90 + r() * 80)} ${f1((r() - .5) * 20)}" stroke="#fff" stroke-width="${f1(3 + r() * 5)}" opacity=".12" fill="none"/>`;
      if (F.holzRand) s += `<path d="M${x0} ${x0} h${W - 2 * x0} v${H - 2 * x0} h${-(W - 2 * x0)}Z" fill="none" stroke="${F.karo}" stroke-width="2" stroke-dasharray="4 4" opacity=".5"/>`;
      return s;
    }
    if (F.muster === "filz") {
      s += `<rect width="${W}" height="${H}" fill="${F.farbe}"/>`;
      for (let i = 0; i < 600; i++) s += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(.6 + r() * 1.3)}" fill="${r() < .5 ? "#4f6b2c" : "#2b3a18"}" opacity=".5"/>`;
      s += `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="${F.rand}" stroke-width="12" opacity=".6"/>`;
      return s;
    }
    if (F.muster === "kunststoff") {
      s += `<rect width="${W}" height="${H}" fill="${F.farbe}"/>`;
      for (let i = 0; i < 260; i++) s += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(.5 + r())}" fill="${dunkler(F.farbe, .8)}" opacity=".45"/>`;
      s += `<path d="M${f1(W / 2)} 0 V${H}" stroke="${F.kante}" stroke-width="3" opacity=".5"/>`;
      for (let i = 0; i < 5; i++) s += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(30 + r() * 30)}" fill="none" stroke="#8a5a30" stroke-width="2.5" opacity=".1"/>`;
      return s;
    }
    if (F.muster === "streifen") {
      s += `<rect width="${W}" height="${H}" fill="${F.farbe}"/>`;
      for (let x = 0; x < W; x += 34) s += `<rect x="${x}" y="0" width="17" height="${H}" fill="${F.streifen}" opacity=".18"/><path d="M${x + 33} 0 V${H}" stroke="#6e6458" stroke-width="1.5" opacity=".5"/>`;
      return s;
    }
    // Holzarten
    s += `<rect width="${W}" height="${H}" fill="${F.farbe}"/>`;
    for (let x = 0; x < W; x += F.brett) {
      s += `<rect x="${x}" y="0" width="${F.brett - 3}" height="${H}" fill="${dunkler(F.farbe, .84 + r() * .3)}" opacity=".6"/><rect x="${x + F.brett - 3}" y="0" width="${F.ritzen ? 5 : 3}" height="${H}" fill="${F.fuge}" opacity="${F.ritzen ? 1 : .7}"/>`;
      if (F.ritzen) for (let y = 0; y < H; y += 40 + r() * 60) s += `<rect x="${x + F.brett - 3}" y="${f1(y)}" width="5" height="${f1(4 + r() * 14)}" fill="#e8b14e" opacity="${f1(.12 + r() * .25)}"/>`;
      for (let j = 0; j < 6; j++) { const gx = x + 6 + r() * (F.brett - 12); let d = `M${f1(gx)} 0`; for (let y = 0; y < H; y += 60) d += ` Q${f1(gx + (r() - .5) * 14)} ${y + 30} ${f1(gx + (r() - .5) * 6)} ${y + 60}`; s += `<path d="${d}" stroke="${F.mas}" stroke-width="${f1(.6 + r() * 1.2)}" fill="none" opacity="${f1(.15 + r() * .2)}"/>`; }
      if (F.aeste && r() < .7) { const ax = x + 20 + r() * (F.brett - 40), ay = r() * H; s += `<ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="9" ry="14" fill="${F.mas}" opacity=".5"/><ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="16" ry="24" fill="none" stroke="${F.mas}" stroke-width="1.2" opacity=".3"/>`; }
      if (!F.ritzen && r() < .4) { const ax = x + 14 + r() * (F.brett - 28), ay = r() * H; s += `<ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="6" ry="9" fill="${F.mas}" opacity=".35"/>`; }
    }
    if (F.flecken) for (let i = 0; i < 6; i++) s += `<circle cx="${f1(r() * W)}" cy="${f1(r() * H)}" r="${f1(14 + r() * 30)}" fill="${F.flecken}" opacity=".18"/>`;
    if (F.lack) { s += `<rect width="${W}" height="${H}" fill="#fff" opacity=".03"/>`; for (let i = 0; i < 4; i++) s += `<path d="M${f1(r() * W)} ${f1(r() * H)} l${f1(120 + r() * 200)} ${f1(-40 - r() * 60)}" stroke="#fff6dc" stroke-width="${f1(8 + r() * 16)}" opacity=".035" stroke-linecap="round"/>`; }
    return s;
  }

  /* Kleinkram je Ort (Zeichnungen in Ursprungslage, Größe ~100 px) */
  const DEKO = {
    teekanne: () => `<ellipse rx="34" ry="30" fill="#efe6d0" stroke="#a8977a" stroke-width="2"/><circle r="10" fill="#d9cdb0"/><circle r="4" fill="#a83a32"/><path d="M30 -6 q20 -4 26 -16" stroke="#efe6d0" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M-30 -14 q-16 14 0 28" stroke="#efe6d0" stroke-width="6" fill="none"/><path d="M-12 -24 q12 -6 24 0" stroke="#a83a32" stroke-width="2" fill="none" opacity=".6"/>`,
    fernbedienung: () => `<rect x="-12" y="-44" width="24" height="88" rx="10" fill="#2b2622"/><circle cy="-30" r="4" fill="#a83a32"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${-6 + (i % 3) * 6}" cy="${-12 + Math.floor(i / 3) * 9}" r="2.2" fill="#8a8279"/>`).join("")}`,
    pflanze: () => `<circle r="26" fill="#a85a32"/><circle r="22" fill="#5c3d24"/>${Array.from({ length: 9 }, (_, i) => { const a = i / 9 * 6.283; return `<ellipse cx="${f1(Math.cos(a) * 26)}" cy="${f1(Math.sin(a) * 26)}" rx="22" ry="9" transform="rotate(${f1(a * 57.3)} ${f1(Math.cos(a) * 26)} ${f1(Math.sin(a) * 26)})" fill="${i % 2 ? "#5f7a3a" : "#7fa64a"}"/>`; }).join("")}<circle r="8" fill="#4f6b2c"/>`,
    untersetzer: () => `<circle r="22" fill="#c9b48a" stroke="#8a7a62" stroke-width="2"/><circle r="22" fill="none" stroke="#8a7a62" stroke-dasharray="2 3" stroke-width="5" opacity=".4"/>`,
    topf: () => `<circle r="44" fill="#8a8279"/><circle r="38" fill="#6e6458"/><circle r="36" fill="#e8b14e"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${f1(Math.cos(i) * 24)} ${f1(Math.sin(i * 1.7) * 24)} q8 ${i % 2 ? 6 : -6} 16 0" stroke="#f2c25a" stroke-width="3" fill="none"/>`).join("")}<path d="M44 0 h26" stroke="#2b2622" stroke-width="8" stroke-linecap="round"/><path d="M-20 -46 q-8 -10 0 -20 M0 -48 q-8 -10 0 -22" stroke="#fff" stroke-width="3" opacity=".35" fill="none"/>`,
    mate: () => `<circle r="16" fill="#c58a2c" opacity=".55"/><circle r="12" fill="#8a5a10"/><circle r="7" fill="#efe0c0"/><path d="M-16 0 a16 16 0 0 1 32 0" fill="none" stroke="#fff6dc" stroke-width="2" opacity=".5"/>`,
    kuehlschrankzettel: () => `<rect x="-40" y="-30" width="80" height="60" fill="#ffe9a0"/><path d="M-30 -14 h56 M-30 -2 h44 M-30 10 h50" stroke="#a83a32" stroke-width="2"/><text x="0" y="-20" font-size="10" text-anchor="middle" fill="#a83a32" font-weight="800">MEINS!!</text>`,
    salzstreuer: () => `<circle r="12" fill="#efe9dc" stroke="#9a8f80" stroke-width="2"/><circle r="2" fill="#9a8f80"/><circle cx="28" r="12" fill="#5c3d24"/><circle cx="28" r="2" fill="#2b1d12"/>`,
    werkzeugkiste: () => `<rect x="-60" y="-34" width="120" height="68" rx="4" fill="#a83a32" stroke="#5a1a14" stroke-width="3"/><rect x="-20" y="-44" width="40" height="12" rx="3" fill="none" stroke="#2b2622" stroke-width="5"/><rect x="-50" y="-6" width="100" height="6" fill="#5a1a14" opacity=".5"/>`,
    minis: () => Array.from({ length: 6 }, (_, i) => `<g transform="translate(${-36 + (i % 3) * 30} ${-14 + Math.floor(i / 3) * 30})"><circle r="11" fill="#2f2a26"/><circle r="8" fill="${["#8a8279", "#efe9dc", "#a83a32", "#5f7a3a", "#c58a2c", "#7d4e8a"][i]}"/><circle cy="-2" r="4" fill="${dunkler(["#8a8279", "#efe9dc", "#a83a32", "#5f7a3a", "#c58a2c", "#7d4e8a"][i], 1.2)}"/></g>`).join(""),
    farbtoepfe: () => Array.from({ length: 5 }, (_, i) => `<g transform="translate(${-40 + i * 20} ${(i % 2) * 14})"><circle r="9" fill="#2b2622"/><circle r="6" fill="${["#a83a32", "#e8b14e", "#5f7a3a", "#efe0c0", "#c46a8a"][i]}"/></g>`).join("") + `<path d="M-20 30 l60 -6" stroke="#c58a2c" stroke-width="4" stroke-linecap="round"/><path d="M40 24 l6 -1" stroke="#a83a32" stroke-width="4"/>`,
    verlaengerung: () => `<rect x="-50" y="-14" width="100" height="28" rx="6" fill="#efe9dc" stroke="#9a8f80" stroke-width="2"/>${[-30, 0, 30].map(x => `<circle cx="${x}" r="8" fill="#d9cdb0"/><circle cx="${x - 3}" r="1.6" fill="#2b2622"/><circle cx="${x + 3}" r="1.6" fill="#2b2622"/>`).join("")}<path d="M50 0 q40 10 60 -30" stroke="#2b2622" stroke-width="5" fill="none"/>`,
    kissen: () => `<rect x="-40" y="-40" width="80" height="80" rx="20" fill="#c46a8a" transform="rotate(12)"/><path d="M-20 -20 L20 20 M20 -20 L-20 20" stroke="#9c3d5a" stroke-width="3" opacity=".5" transform="rotate(12)"/>`,
    buecherstapel: () => Array.from({ length: 4 }, (_, i) => `<rect x="-46" y="-30" width="92" height="60" rx="3" fill="${["#5f7a3a", "#7a2418", "#c58a2c", "#5c3d24"][i]}" stroke="#2b1d12" stroke-width="1.5" transform="translate(${i * 4} ${-i * 5}) rotate(${(i % 2 ? 1 : -1) * 6})"/>`).join(""),
    lichterkette: () => { let s = `<path d="M-90 0 Q-45 30 0 0 T90 0" stroke="#2b1d12" stroke-width="2" fill="none"/>`; for (let i = 0; i < 9; i++) { const x = -90 + i * 22.5, y = Math.sin(i / 8 * Math.PI * 2) * -10 + 8; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="5" fill="${["#ffd27a", "#ff9a5a", "#ffe9a0"][i % 3]}" class="funkel" style="animation-delay:${f1(i * .37)}s"/><circle cx="${f1(x)}" cy="${f1(y)}" r="16" fill="#ffd27a" opacity=".15"/>`; } return s; },
    preisschild: () => `<path d="M-30 -16 h48 l14 16 l-14 16 h-48Z" fill="#efe0c0" stroke="#a83a32" stroke-width="2"/><circle cx="10" r="3" fill="#a83a32"/><text x="-12" y="5" font-size="13" text-anchor="middle" fill="#a83a32" font-weight="800">4,99</text>`,
    folie: () => `<rect x="-36" y="-36" width="72" height="72" fill="#fff" opacity=".18" stroke="#fff" stroke-width="1.5"/><path d="M-30 -30 l60 20 M-30 0 l60 20" stroke="#fff" stroke-width="3" opacity=".25"/>`,
    kasse: () => `<rect x="-56" y="-30" width="112" height="60" rx="5" fill="#e8b14e" stroke="#8a5a10" stroke-width="2"/><text y="8" font-size="14" text-anchor="middle" fill="#7a2418" font-weight="800">KASSE</text><text y="22" font-size="8" text-anchor="middle" fill="#7a2418">nur Bares</text>`,
    spielschachtel: () => `<rect x="-60" y="-46" width="120" height="92" rx="4" fill="#7d4e8a" stroke="#2b1d12" stroke-width="2"/><rect x="-48" y="-36" width="96" height="30" rx="3" fill="#e8b14e"/><text y="-16" font-size="13" text-anchor="middle" fill="#5a1a14" font-weight="800" font-family="serif">DUNGEON</text><path d="M-40 10 l20 -16 l20 16 l20 -24 l20 24Z" fill="#5a2d4a"/>`,
    bierdeckel: () => `<circle r="24" fill="#efe0c0"/><circle r="20" fill="none" stroke="#a83a32" stroke-width="2"/><path d="M-12 -4 h4 M-12 2 h4 M-12 8 h4 M-4 -4 h4 M-4 2 h4" stroke="#2b1d12" stroke-width="2"/><text y="-8" font-size="7" text-anchor="middle" fill="#a83a32" font-weight="800">KRUMMER WÜRFEL</text>`,
    bierglas: () => `<circle r="22" fill="#e8b14e" opacity=".85"/><circle r="22" fill="none" stroke="#fff6dc" stroke-width="3"/><circle r="15" fill="#fff6dc" opacity=".8"/><ellipse cx="-6" cy="-6" rx="5" ry="3" fill="#fff" opacity=".7"/>`,
    salzstangen: () => `<rect x="-24" y="-30" width="48" height="60" rx="4" fill="#5c3d24"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${-18 + i * 4.5} -20 l${(i % 3 - 1) * 8} -36" stroke="#c58a2c" stroke-width="3" stroke-linecap="round"/>`).join("")}`,
    aschenbecher: () => `<circle r="26" fill="#8a8279"/><circle r="20" fill="#5a524a"/><text y="6" font-size="14" text-anchor="middle" fill="#e8b14e">🌼</text>`,
    blumentopf: () => `<circle r="24" fill="#a85a32"/><circle r="20" fill="#5c3d24"/>${Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.283; return `<circle cx="${f1(Math.cos(a) * 10)}" cy="${f1(Math.sin(a) * 10)}" r="9" fill="#e8b14e"/>`; }).join("")}<circle r="6" fill="#5c3d24"/>`,
    grillzange: () => `<path d="M-60 -4 L50 -8 M-60 4 L50 8" stroke="#8a8279" stroke-width="4" stroke-linecap="round"/><rect x="-80" y="-8" width="24" height="16" rx="4" fill="#5c3d24"/>`,
    mueckenspray: () => `<rect x="-12" y="-36" width="24" height="72" rx="6" fill="#5f7a3a"/><rect x="-8" y="-44" width="16" height="10" rx="2" fill="#efe9dc"/><text y="6" font-size="9" text-anchor="middle" fill="#efe0c0" font-weight="800" transform="rotate(-90)">MÜCKE WEG</text>`,
    limo: () => `<circle r="14" fill="#efe0c0"/><circle r="10" fill="#e8b14e"/><circle r="5" fill="#fff6dc" opacity=".6"/><circle cx="34" cy="10" r="14" fill="#efe0c0"/><circle cx="34" cy="10" r="10" fill="#c0442f" opacity=".8"/>`,
    holzscheite: () => Array.from({ length: 3 }, (_, i) => `<g transform="translate(0 ${i * 18 - 18}) rotate(${(i - 1) * 8})"><rect x="-60" y="-8" width="120" height="16" rx="8" fill="#8a5a30"/><circle cx="60" r="8" fill="#c58a2c"/><circle cx="60" r="4" fill="none" stroke="#8a5a10"/></g>`).join(""),
    petroleumlampe: () => `<circle r="26" fill="#5c3d24"/><circle r="18" fill="#fff6dc" opacity=".9"/><circle r="70" fill="url(#glut)" class="flacker"/><circle r="5" fill="#ffd27a"/>`,
    thermoskanne: () => `<circle r="22" fill="#a83a32"/><circle r="16" fill="#2b2622"/><circle r="10" fill="#5c2a14"/><path d="M22 0 h12" stroke="#2b2622" stroke-width="6"/>`,
    tannenzapfen: () => `<ellipse rx="14" ry="22" fill="#6b4a2c"/>${Array.from({ length: 8 }, (_, i) => `<path d="M-10 ${-16 + i * 4} q10 4 20 0" stroke="#3a2414" stroke-width="1.6" fill="none"/>`).join("")}<ellipse cx="32" cy="10" rx="12" ry="18" fill="#6b4a2c" transform="rotate(30 32 10)"/>`,
    kerzenleuchter: () => `<circle r="30" fill="#c58a2c"/><circle r="24" fill="#8a5a10"/>${[-14, 0, 14].map(x => `<circle cx="${x}" r="6" fill="#efe6d0"/><circle cx="${x}" r="3" fill="#ffd27a" class="flacker"/>`).join("")}<circle r="70" fill="url(#glut)" class="flacker"/>`,
    zinnbecher: () => `<circle r="20" fill="#9a8f80"/><circle r="16" fill="#6e6458"/><circle r="14" fill="#8a4a1a" opacity=".7"/><path d="M20 -6 h10 v12 h-10" stroke="#9a8f80" stroke-width="4" fill="none"/>`,
    herbergsschild: () => `<rect x="-60" y="-26" width="120" height="52" rx="3" fill="#efe0c0" stroke="#5c3d24" stroke-width="2"/><text y="-8" font-size="9" text-anchor="middle" fill="#5c3d24" font-weight="800">HAUSORDNUNG</text><path d="M-48 4 h96 M-48 12 h80" stroke="#8a7a62" stroke-width="1.5"/><text y="22" font-size="7" text-anchor="middle" fill="#a83a32">Nachtruhe 22 Uhr</text>`,
    schluesselbund: () => `<circle r="14" fill="none" stroke="#c58a2c" stroke-width="3"/><path d="M8 10 l34 20 M38 26 l4 -6 M30 22 l4 -6" stroke="#c58a2c" stroke-width="5" stroke-linecap="round"/><path d="M-6 12 l-12 40 M-20 46 l-6 -2" stroke="#8a8279" stroke-width="5" stroke-linecap="round"/>`,
    namensschild: () => `<rect x="-46" y="-30" width="92" height="60" rx="4" fill="#fffdf4" stroke="#a83a32" stroke-width="2"/><rect x="-46" y="-30" width="92" height="16" fill="#a83a32"/><text y="-18" font-size="8" text-anchor="middle" fill="#efe0c0" font-weight="800">HALLO, ICH BIN</text><text y="12" font-size="15" text-anchor="middle" fill="#2b1d12" font-family="cursive">SL</text><path d="M-6 -30 v-26 M6 -30 v-26" stroke="#c58a2c" stroke-width="3"/>`,
    programmheft: () => `<rect x="-44" y="-60" width="88" height="120" rx="2" fill="#e8b14e"/><rect x="-36" y="-50" width="72" height="30" fill="#a83a32"/><text y="-31" font-size="10" text-anchor="middle" fill="#efe0c0" font-weight="800">PROGRAMM</text>${Array.from({ length: 6 }, (_, i) => `<path d="M-34 ${-8 + i * 10} h${50 + (i * 7) % 18}" stroke="#5c3d24" stroke-width="2"/>`).join("")}`,
    pappbecher: () => `<circle r="20" fill="#efe6d0"/><circle r="16" fill="#5c2a14"/><circle r="16" fill="#8a4a1a" opacity=".5"/><path d="M-20 0 a20 20 0 0 0 40 0" fill="none" stroke="#a83a32" stroke-width="4" opacity=".7"/>`,
    tischnummer: () => `<path d="M-30 20 L0 -26 L30 20Z" fill="#efe0c0" stroke="#8a7a62" stroke-width="2"/><text y="12" font-size="18" text-anchor="middle" fill="#a83a32" font-weight="800">42</text>`,
    brotdose: () => `<rect x="-60" y="-40" width="120" height="80" rx="16" fill="#5f7a3a"/><rect x="-52" y="-32" width="104" height="64" rx="12" fill="#efe0c0" opacity=".35"/><text y="6" font-size="11" text-anchor="middle" fill="#2b3a18" font-weight="800">WÜRFELARENA</text>`,
    fahrkarte: () => `<rect x="-50" y="-26" width="100" height="52" rx="3" fill="#fffdf4" stroke="#cdbb94"/><rect x="-50" y="-26" width="100" height="12" fill="#a83a32"/><path d="M-40 0 h60 M-40 10 h40" stroke="#8a7a62" stroke-width="2"/><text x="30" y="14" font-size="9" fill="#a83a32" font-weight="800">2. Kl</text>`,
    kaffeebecher: () => `<circle r="20" fill="#efe9dc"/><circle r="16" fill="#5c2a14"/><path d="M-8 -6 q8 -6 16 0" stroke="#efe0c0" stroke-width="1.5" fill="none" opacity=".5"/><rect x="-8" y="-24" width="16" height="6" rx="2" fill="#a83a32"/>`,
    kekse: () => Array.from({ length: 5 }, (_, i) => `<circle cx="${-30 + i * 15}" cy="${(i % 2) * 10}" r="12" fill="#c58a2c" stroke="#8a5a10"/><circle cx="${-33 + i * 15}" cy="${(i % 2) * 10 - 3}" r="2" fill="#5c2a14"/><circle cx="${-27 + i * 15}" cy="${(i % 2) * 10 + 3}" r="2" fill="#5c2a14"/>`).join(""),
    gaskocher: () => `<circle r="34" fill="#8a8279"/><circle r="26" fill="#5a524a"/>${Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.283; return `<path d="M${f1(Math.cos(a) * 10)} ${f1(Math.sin(a) * 10)} L${f1(Math.cos(a) * 30)} ${f1(Math.sin(a) * 30)}" stroke="#2b2622" stroke-width="4"/>`; }).join("")}<circle r="8" fill="#ff9a3a" opacity=".7"/>`,
    taschenlampe: () => `<rect x="-50" y="-10" width="80" height="20" rx="6" fill="#2b2622"/><path d="M30 -14 h14 v28 h-14Z" fill="#8a8279"/><path d="M44 -14 L140 -50 L140 50 L44 14Z" fill="#fff6dc" opacity=".14"/>`,
    marshmallows: () => `<rect x="-40" y="-30" width="80" height="60" rx="10" fill="#fff" opacity=".7"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${-30 + (i % 3) * 20}" y="${-18 + Math.floor(i / 3) * 20}" width="14" height="14" rx="5" fill="${i % 2 ? "#f6dce0" : "#fffdf4"}"/>`).join("")}`,
    isomatte: () => `<rect x="-90" y="-30" width="180" height="60" rx="30" fill="#c0442f"/><path d="M-60 -30 v60 M-30 -30 v60 M0 -30 v60 M30 -30 v60 M60 -30 v60" stroke="#8e2a20" stroke-width="2" opacity=".6"/>`,
    seil: () => { let s = ""; for (let i = 0; i < 4; i++) s += `<circle r="${12 + i * 9}" fill="none" stroke="#c9a87a" stroke-width="6"/>`; return s + `<path d="M48 0 q30 10 40 40" stroke="#c9a87a" stroke-width="6" fill="none"/>`; },
    rettungsring: () => `<circle r="40" fill="none" stroke="#efe6d4" stroke-width="18"/>${[0, 1, 2, 3].map(i => `<path d="M${f1(Math.cos(i * 1.571) * 40)} ${f1(Math.sin(i * 1.571) * 40)}" stroke="#c0442f" stroke-width="20" stroke-dasharray="1 0"/>`).join("")}<circle r="40" fill="none" stroke="#c0442f" stroke-width="18" stroke-dasharray="20 43"/>`,
    angel: () => `<path d="M-100 20 L100 -20" stroke="#5c3d24" stroke-width="5" stroke-linecap="round"/><circle cx="-60" cy="12" r="10" fill="#8a8279"/><path d="M100 -20 q20 30 -10 60" stroke="#efe0c0" stroke-width="1" fill="none"/>`
  };

  /* Licht je Ort: ein Lichtfleck + Farbton über dem ganzen Tisch */
  const LICHT = {
    lampe: { farbe: "#ffcf7a", staerke: .22, x: .5, y: .38, r: .62, ton: null },
    haengelampe: { farbe: "#ffe0a0", staerke: .25, x: .5, y: .3, r: .55, ton: null },
    gluehbirne: { farbe: "#fff0c0", staerke: .3, x: .5, y: .4, r: .5, ton: "#1a1410", tonA: .18, schwingt: true },
    lichterkette: { farbe: "#ffc060", staerke: .16, x: .5, y: .45, r: .7, ton: null, kette: true },
    neon: { farbe: "#fff8e0", staerke: .16, x: .5, y: .3, r: .9, ton: "#e8f0c8", tonA: .05, flackern: true },
    pendel: { farbe: "#ffb648", staerke: .26, x: .5, y: .42, r: .5, ton: "#1a0e08", tonA: .2 },
    laterne: { farbe: "#ffc870", staerke: .22, x: .5, y: .4, r: .6, ton: null, motten: true },
    kamin: { farbe: "#ff8a3a", staerke: .26, x: .1, y: .6, r: .9, ton: "#1a0e08", tonA: .12, flackern: true },
    fackel: { farbe: "#ff9a3a", staerke: .24, x: .5, y: .45, r: .6, ton: "#1a0e08", tonA: .16, flackern: true },
    halle: { farbe: "#fff8e8", staerke: .12, x: .5, y: .5, r: 1, ton: "#fff6e0", tonA: .04 },
    zug: { farbe: "#fff3d0", staerke: .14, x: .5, y: .2, r: .9, ton: null, vorbei: true },
    gaslaterne: { farbe: "#ffd27a", staerke: .26, x: .5, y: .4, r: .55, ton: "#14100c", tonA: .22, motten: true }
  };

  function tischOrt(W, H, r, id, def, zustand) {
    // liefert {flaeche, deko:[[art,fx,fy,sk,rot]], licht} – fx/fy relativ zur freien Fläche
    const T = def.tisch || {};
    // Abenddämmerung über dem Tisch: helle Flächen (Wachstuch, Kunststoff, Decke) werden stärker abgedunkelt
    const F = FLAECHE[T.flaeche] || {}, hell = ["karo", "kunststoff", "streifen"].includes(F.muster);
    const zeit = zustand && zustand.zeit, dunkel = (hell ? { tag: .16, abend: .4, nacht: .52 } : { tag: .04, abend: .14, nacht: .3 })[zeit || "abend"];
    return { flaeche: flaeche(W, H, r, id, T.flaeche), licht: LICHT[T.licht] || null, deko: T.deko || [], laub: !!T.laub, art: T.flaeche, dunkel };
  }
  function lichtSchicht(W, H, id, L, z, dunkel) {
    let s = dunkel ? `<rect width="${W}" height="${H}" fill="#140c06" opacity="${dunkel}"/>` : "";
    if (!L) return s;
    const nacht = z && z.zeit === "nacht";
    s += `<defs><radialGradient id="${id}ol" cx="${L.x}" cy="${L.y}" r="${L.r}"><stop offset="0" stop-color="${L.farbe}" stop-opacity="${f1(L.staerke * (nacht ? 1.5 : 1.2) * 100) / 100}"/><stop offset="1" stop-color="${L.farbe}" stop-opacity="0"/></radialGradient></defs>`;
    if (L.ton) s += `<rect width="${W}" height="${H}" fill="${L.ton}" opacity="${L.tonA}"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#${id}ol)"${L.flackern ? ' class="flacker"' : ""}${L.schwingt ? ' class="schwingt"' : ""}/>`;
    if (L.vorbei) s += `<g class="zuglicht"><rect x="-40%" y="0" width="${f1(W * .18)}" height="${H}" fill="#fff6dc" opacity=".07" transform="skewX(-18)"/><rect x="-80%" y="0" width="${f1(W * .08)}" height="${H}" fill="#fff6dc" opacity=".05" transform="skewX(-18)"/></g>`;
    if (L.motten) for (let i = 0; i < 3; i++) s += `<g class="motte" style="--mx:${f1(W * L.x)}px;--my:${f1(H * L.y)}px;animation-delay:-${i * 1.7}s;animation-duration:${f1(4.5 + i * 1.3)}s"><ellipse rx="4" ry="2.4" fill="#e9dcc0" opacity=".75"/></g>`;
    return s;
  }
  function wetterSchicht(W, H, id, z, def) {
    if (!z) return "";
    let s = "";
    const drinnen = def.art !== "ausflug" || ["huette", "burg", "con", "zug"].includes(def.k);
    if ((z.wetter === "regen" || z.wetter === "gewitter") && drinnen) {
      // Licht durchs verregnete Fenster: helles Feld mit wandernden Tropfenschatten
      s += `<g class="fensterlicht" opacity=".5"><rect x="${f1(W * .62)}" y="${f1(H * .05)}" width="${f1(W * .3)}" height="${f1(H * .42)}" fill="#efe6d0" opacity=".06" transform="skewX(-12)"/>`;
      for (let i = 0; i < 14; i++) s += `<rect class="tropfspur" x="${f1(W * (.6 + (i * .021) % .3))}" y="${f1(H * .05)}" width="2" height="${f1(14 + (i * 7) % 20)}" rx="1" fill="#2b1d12" opacity=".14" style="animation-delay:-${f1(i * .53)}s;animation-duration:${f1(2.4 + (i % 4) * .6)}s"/>`;
      s += `</g>`;
      if (z.wetter === "gewitter") s += `<rect width="${W}" height="${H}" fill="#fff6e8" class="wetterleuchten" opacity="0"/>`;
    }
    if (z.wetter === "schnee" && drinnen) {
      s += `<g opacity=".45">`; for (let i = 0; i < 16; i++) s += `<circle class="flocke" cx="${f1(W * (.62 + (i * .019) % .28))}" cy="${f1(H * .05)}" r="${f1(1.6 + (i % 3))}" fill="#2b1d12" opacity=".12" style="animation-delay:-${f1(i * .7)}s;animation-duration:${f1(5 + (i % 5))}s"/>`; s += `</g>`;
    }
    if (z.wetter === "regen" && !drinnen) { for (let i = 0; i < 18; i++) s += `<circle class="regenring" cx="${f1((i * 97) % W)}" cy="${f1((i * 61) % H)}" r="3" fill="none" stroke="#fff6dc" stroke-width="1" style="animation-delay:-${f1(i * .31)}s"/>`; }
    return s;
  }
  function laubSchicht(W, H, z) {
    let s = "";
    const farben = ["#c4652c", "#e8b14e", "#7fa64a", "#9c4a1a"];
    for (let i = 0; i < 6; i++) s += `<g class="laubflug" style="--ly:${f1(H * (.1 + i * .14))}px;animation-delay:-${f1(i * 3.1)}s;animation-duration:${f1(14 + i * 2.3)}s"><ellipse rx="9" ry="4" fill="${farben[i % 4]}" opacity=".8"/><path d="M-9 0 H9" stroke="#000" stroke-opacity=".2"/></g>`;
    return s;
  }


  /* Ankunft: die erste Karte einer Session an einem neuen Ort (zwei Wahlen) */
  const ANKUNFT = {
    wohnzimmer: [["Erst mal Tee", "t-4 s+3 alle+4", "{wirt} kocht Tee, alle verteilen sich auf Sofa und Stühle, und die Katze bekommt den besten Platz. Gemütlich."], ["Direkt an den Tisch", "t+5 l+2", "Schuhe aus, Würfel raus, los. {wirt} hat sogar Untersetzer verteilt."]],
    wgkueche: [["Zusammen kochen", "s+5 t-6 alle+5", "Ihr kocht zusammen einen Riesentopf Nudeln. Der Abend beginnt mit vollen Bäuchen und Tomatensoße auf einem Charakterbogen."], ["Pizza bestellen", "t+4 s+2", "Pizza ist bestellt, das Wachstuch ist abgewischt, die Mitbewohner sind informiert. Halbwegs."]],
    keller: [["Licht und Musik", "s+4 l+2 t-3", "{wirt} schaltet die Lichterkette an und drückt Play auf der Kellerbox. Plötzlich ist es fast gemütlich da unten."], ["Kellerstimmung nutzen", "l+5 s+2", "Glühbirne, Betonwände, Heizungsrohre – die perfekte Kulisse für ein Verlies. Du musst fast nichts beschreiben."]],
    dachboden: [["Dachfenster auf", "s+3 t+2", "Frische Luft, das Rauschen der Stadt, ein Stern über dem Tisch. Bis der erste Windstoß den Charakterbogen erwischt."], ["Kerzen an", "l+3 s+3 t-2", "Kerzen auf jedem Balken, die Lichterkette glimmt. Unterm Dach fühlt sich jede Szene an wie eine Geistergeschichte."]],
    laden: [["Herrn Brettschneider grüßen", "alle+3 t-3 l+2", "Herr Brettschneider erzählt zehn Minuten von einer Lieferung Würfel, die „bald“ kommt. Dann dürft ihr nach hinten."], ["Schnell nach hinten", "t+5", "Ihr winkt nur kurz und verschwindet im Hinterzimmer. Vorne bimmelt die Ladentür, hinten fallen die ersten Würfel."]],
    kneipe: [["Erst mal eine Runde", "s+6 t-4 alle+3", "Doris stellt ungefragt fünf Bier und eine Apfelschorle auf den Tisch. „Geht aufs Haus. Das erste.“"], ["Gleich anfangen", "t+5 l+2", "Ihr verzieht euch ins Nebenzimmer, bevor der Stammtisch nach euren Würfeln fragen kann."]],
    laube: [["Grill anwerfen", "s+5 t-5 alle+4", "Würstchen, Grillkäse, Maiskolben. Der Rauch zieht in Richtung Parzelle 48. Von dort kommt ein Blick über die Hecke."], ["Gleich ins Abenteuer", "t+4 s+2", "Decke auf den Gartentisch, Laterne an, los. Ein Igel schaut kurz vorbei und geht wieder."]],
    huette: [["Ofen einheizen", "s+4 l+4 t-5 alle+4", "Bis der Kaminofen brennt, dauert es eine halbe Stunde und drei Zeitungen. Dann ist es so gemütlich, dass niemand mehr aufstehen will."], ["Sofort Abenteuer", "t+6 s+2 alle-1", "Rucksäcke in die Ecke, Würfel auf den Tisch. Die Hütte ist kalt, aber die Geschichte heizt ein."]],
    burg: [["Burgführung", "l+6 s+3 t-6", "Herr Eisenhut führt euch durch alle Säle und erzählt von der „Weißen Frau“. Als ihr euch an die Eichentafel setzt, schauen alle zweimal über die Schulter."], ["Rittersaal sofort", "t+5 m+3", "Ihr besetzt die Eichentafel im Rittersaal. {name} setzt sich auf den Stuhl mit der höchsten Lehne und sagt: „Mein Thron.“"]],
    con: [["Erst über die Con schlendern", "s+5 t-5 alle+3", "Ihr kauft Würfel, die ihr nicht braucht, bewundert Kostüme und bekommt einen Stapel Flyer. Dann findet ihr endlich Tisch Nummer 42."], ["Direkt an den Tisch", "t+5 l+2", "Tisch 42, Schild aufgestellt, Spielleiterschirm aufgebaut. Ein paar Leute bleiben stehen und schauen zu. Kein Druck."]],
    zug: [["Würfelarena bauen", "l+3 s+4 t-2", "Aus einer Brotdose wird eine Würfelarena. Der erste Wurf landet trotzdem bei einem Herrn auf dem Nachbarsitz. Er gibt den Würfel zurück und sagt: „Nat 20. Glückwunsch.“"], ["Leise spielen", "l+4 t+2 s-2", "Ihr spielt im Flüsterton. Das macht jede Szene unfreiwillig spannend, sogar den Einkauf im Dorfladen."]],
    zelt: [["Lagerfeuer zuerst", "s+5 l+3 t-5 alle+4", "Stockbrot, Funken, Gitarre. Als du mit „Es war eine dunkle Nacht …“ anfängst, ist sie es wirklich."], ["Unter den Pavillon", "t+4 s+2", "Gaslaterne an, Campingtisch aufgeklappt, eine Isomatte als Ablage. Drei Motten spielen mit."]],
    see: [["Erst mal schwimmen", "s+6 t-6 alle+4", "Alle springen vom Steg. Als ihr am Tisch sitzt, tropfen die Charakterbögen, und die Laune ist bestens."], ["Gleich am Steg spielen", "t+4 l+2", "Laterne an, Mückenspray reihum, los. Unter euch gluckert der See, und irgendwo ruft eine Ente sehr bestimmt."]]
  };
  for (const k in ORTE) { ORTE[k].k = k; ORTE[k].ankunft = ANKUNFT[k]; }

  /* Nebengeschichten je Ort: Titel und Anzahl der Kapitel (Karten in tne-karten-12.js) */
  const STORY = {
    wohnzimmer: { titel: "Frau Brösel von unten", kapitel: 6 },
    wgkueche: { titel: "Jannik und das Joghurt", kapitel: 6 },
    keller: { titel: "Die Tür hinter dem Heizungsraum", kapitel: 7 },
    dachboden: { titel: "Die Tauben vom Nachbardach", kapitel: 5 },
    laden: { titel: "Der letzte Würfelturm", kapitel: 7 },
    kneipe: { titel: "Stammtisch gegen Spieltisch", kapitel: 6 },
    laube: { titel: "Die verschwundenen Gartenzwerge", kapitel: 7 },
    huette: { titel: "Etwas schleicht ums Haus", kapitel: 5 },
    burg: { titel: "Die Weiße Frau", kapitel: 5 },
    con: { titel: "Tisch 42", kapitel: 5 },
    zug: { titel: "Die Schaffnerin", kapitel: 4 },
    zelt: { titel: "Das Nachbarzelt", kapitel: 4 },
    see: { titel: "Das Ding im See", kapitel: 5 }
  };
  for (const k in ORTE) ORTE[k].story = STORY[k];

  /* Leute an den Orten: Aussehen für das Porträt */
  const LEUTE = {
    "Frau Brösel": { haut: 0, haar: 8, frisur: "dutt", hemd: 3, brille: true },
    "Jannik": { haut: 2, haar: 1, frisur: "wellig", hemd: 6, bart: "stoppel" },
    "Herr Kalkbrenner": { haut: 1, haar: 7, frisur: "glatze", hemd: 5, bart: "voll" },
    "Gerd": { haut: 3, haar: 8, frisur: "lang", hemd: 4, brille: true, bart: "voll" },
    "Herr Brettschneider": { haut: 1, haar: 7, frisur: "seite", hemd: 2, brille: true },
    "Doris": { haut: 2, haar: 6, frisur: "locken", hemd: 0 },
    "Stammtisch-Ewald": { haut: 4, haar: 8, frisur: "kurz", hemd: 9, bart: "voll" },
    "Herr Kowalczyk": { haut: 0, haar: 7, frisur: "kurz", hemd: 10, brille: true },
    "Ludwig": { haut: 5, haar: 0, frisur: "locken", hemd: 7 },
    "Onkel Arnulf": { haut: 2, haar: 8, frisur: "kurz", hemd: 0, bart: "voll" },
    "Herr Eisenhut": { haut: 1, haar: 8, frisur: "seite", hemd: 4, brille: true },
    "Moderatorin Sanne": { haut: 6, haar: 0, frisur: "rasta", hemd: 11 },
    "Schaffnerin Ilse": { haut: 3, haar: 3, frisur: "bob", hemd: 0 },
    "Festival-Kai": { haut: 2, haar: 5, frisur: "irokese", hemd: 6 },
    "Bademeister Holger": { haut: 4, haar: 7, frisur: "glatze", hemd: 0, bart: "stoppel" }
  };

  window.TNE_ORTE = { ORTE, HEIME, TREFFS, AUSFLUEGE, LEUTE };
  window.TNE_ORTSBILD = { SZENEN, tischOrt, DEKO, lichtSchicht, wetterSchicht, laubSchicht, FLAECHE };
})();
