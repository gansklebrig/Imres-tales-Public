/* =====================================================================
   FRIEDRICHS WALDBUCH – Lexikon, Bestimmungshilfe, Jahreskalender, Lernkiste
   ---------------------------------------------------------------------
   Daten: waldbuch-arten-*.js (Texte) + pflanzen/bilder.json (Fotos von
   Wikimedia Commons mit Urheber/Lizenz, geholt von tools/pflanzen/holen.py).
   Seiten (Adresse nach #):  /  · /kapitel/<kap> · /art/<id> · /bestimmen
   · /jetzt · /lernen · /spiel · /nachweise · /suche/<text>
   Das Spiel „Rex' Spürnase“ steht in waldbuch-spiel.js und nutzt window.WB.
   ===================================================================== */
(function () {
  "use strict";
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lade = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const sichere = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } };
  const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const MK = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const heuteMonat = new Date().getMonth() + 1;

  const ARTEN = (window.WB_ARTEN || []).slice();
  const ART = {}; ARTEN.forEach(a => { ART[a.id] = a; a.bl = a.bl || []; a.fr = a.fr || []; a.er = a.er || []; });
  let BILDER = {};

  const KAPITEL = [
    { k: "baum", name: "Bäume", farbe: "#a9c27a", band: "rgba(127,166,74,.6)", intro: "Ohne sie gäbe es keinen Wald, und ohne Wald gäbe es mich nicht. Hier stehen die Bäume, die mir in Bayern am häufigsten begegnen – vom Biergarten bis zur Baumgrenze." },
    { k: "strauch", name: "Sträucher & Hecken", farbe: "#d9a066", band: "rgba(197,138,44,.55)", intro: "Hecken sind die Gasthäuser des Waldes: Vögel, Igel, Bienen und hungrige Waldläufer kehren hier ein. Aber nicht alles, was rot leuchtet, ist für uns gedacht." },
    { k: "beere", name: "Beeren & Wildobst", farbe: "#d77f74", band: "rgba(168,58,50,.45)", intro: "Blaue Zungen, rote Finger, volle Bäuche – und die wichtigste Lektion: Die Tollkirsche wartet zwischen den Heidelbeeren." },
    { k: "kraut", name: "Kräuter & Wildgemüse", farbe: "#c8d68f", band: "rgba(169,194,122,.65)", intro: "Was am Wegrand wächst, kann Suppe, Salat oder Tee werden. Und manches davon hat einen giftigen Zwilling. Darum stehen sie hier nebeneinander." },
    { k: "blume", name: "Blumen & Bergpflanzen", farbe: "#e2b4c8", band: "rgba(200,120,150,.45)", intro: "Zum Anschauen, nicht zum Pflücken: Viele dieser Schönheiten sind geschützt oder giftig. Manche sind beides." },
    { k: "farn", name: "Farne, Moose & Flechten", farbe: "#9fb889", band: "rgba(95,138,90,.5)", intro: "Die Alten des Waldes. Sie waren schon da, als Dinosaurier über ihre Wedel stolperten." },
    { k: "pilz", name: "Pilze", farbe: "#e0bd85", band: "rgba(185,130,74,.55)", intro: "Mein liebstes und gefährlichstes Kapitel. Ich habe die köstlichsten Pilze direkt neben ihre tödlichen Doppelgänger geklebt. Kein Pilz kommt in die Pfanne, den nicht eine Pilzberatung gesehen hat." },
    { k: "tier", name: "Tiere & Spuren", farbe: "#c9a98a", band: "rgba(92,66,41,.45)", intro: "Rex' Lieblingskapitel. Wer im Wald liest, sieht die Tiere selten – aber ihre Geschichten stehen überall im Schlamm, im Schnee und an der Rinde." }
  ];
  const KAP = {}; KAPITEL.forEach(k => KAP[k.k] = k);
  const ESS = { essbar: ["essbar", "🍴"], bedingt: ["bedingt essbar", "⚠"], kein: ["nicht zum Essen", "–"], giftig: ["giftig", "☠"], toedlich: ["tödlich giftig", "☠☠"] };
  const ASPEKT = { haupt: "Übersicht", habitus: "Wuchs", blatt: "Blatt", rinde: "Rinde", bluete: "Blüte", frucht: "Frucht", knospe: "Knospe", unterseite: "Unterseite", schnitt: "Schnitt", jung: "jung", spur: "Spur", zeichen: "Zeichen", weitere: "Ansicht" };
  const FELDER = {
    standard: [["wu", "Wuchs"], ["b", "Blatt"], ["r", "Rinde"], ["blt", "Blüte"], ["f", "Frucht"], ["kn", "Knospe & Winter"]],
    pilz: [["b", "Hut"], ["blt", "Unterseite"], ["r", "Stiel"], ["f", "Fleisch & Geruch"], ["kn", "Sporenpulver"]],
    tier: [["b", "Aussehen"], ["blt", "Trittsiegel"], ["f", "Losung & Zeichen"], ["r", "Lebensweise"], ["kn", "Laute"]]
  };
  const felderFuer = a => a.kap === "pilz" ? FELDER.pilz : a.kap === "tier" ? FELDER.tier : FELDER.standard;
  const leer = v => !v || v === "–" || v === "-";

  /* ---------- Fortschritt (Lernkiste, Funde aus dem Spiel) ---------- */
  const STAND = lade("waldbuch", { kiste: {}, gefunden: {}, gelesen: {}, ton: false, punkte: 0, expeditionen: 0 });
  const speichern = () => sichere("waldbuch", STAND);

  /* ---------- Bilder ---------- */
  function bilderVon(id) { return BILDER[id] || []; }
  function hauptbild(id) { const b = bilderVon(id); return b.length ? "pflanzen/bilder/" + b[0].f : null; }
  function bildFuer(id, aspekt) { const b = bilderVon(id); const x = b.find(e => e.a === aspekt); return x ? "pflanzen/bilder/" + x.f : null; }
  function bildHtml(id, cls) {
    const src = hauptbild(id);
    return src ? '<img src="' + src + '" alt="' + esc(ART[id] ? ART[id].de : "") + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : "") + ">" : '<div class="' + (cls || "mini") + ' keinbild" aria-hidden="true">' + doodle(ART[id] ? ART[id].kap : "kraut") + "</div>";
  }
  function doodle(kap) {
    const d = { baum: '<path d="M50 90V55M50 55C30 55 20 40 30 28C32 14 50 10 55 20C68 12 82 28 72 40C80 52 66 58 50 55Z" fill="none" stroke="#7b6a55" stroke-width="3"/>', pilz: '<path d="M20 50Q50 10 80 50Z M42 50V80H58V50" fill="none" stroke="#7b6a55" stroke-width="3"/>', tier: '<ellipse cx="50" cy="62" rx="14" ry="12" fill="#7b6a55"/><ellipse cx="32" cy="40" rx="6" ry="8" fill="#7b6a55"/><ellipse cx="45" cy="32" rx="6" ry="8" fill="#7b6a55"/><ellipse cx="58" cy="32" rx="6" ry="8" fill="#7b6a55"/><ellipse cx="70" cy="40" rx="6" ry="8" fill="#7b6a55"/>' };
    return '<svg viewBox="0 0 100 100" width="60" height="60">' + (d[kap] || '<path d="M50 90C50 60 30 50 25 30C45 30 52 45 50 60C52 40 62 22 78 20C76 42 60 52 50 70" fill="none" stroke="#7b6a55" stroke-width="3"/>') + "</svg>";
  }

  /* ---------- Spuren (gezeichnete Trittsiegel) ---------- */
  function spurSvg(typ, gross) {
    const T = (x, y, r, w, h, rot) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + h + '" transform="rotate(' + (rot || 0) + " " + x + " " + y + ')"/>';
    const huf = (x, y, s, kl) => '<g transform="translate(' + x + " " + y + ") scale(" + s + ')"><path d="M-2 -14 Q-12 -6 -9 10 Q-6 15 -2 13 Z"/><path d="M2 -14 Q12 -6 9 10 Q6 15 2 13 Z"/>' + (kl ? '<ellipse cx="-7" cy="22" rx="3" ry="2.5"/><ellipse cx="7" cy="22" rx="3" ry="2.5"/>' : "") + "</g>";
    const pfote4 = (x, y, s, rund, kralle) => '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' + (rund ? '<path d="M-10 6 Q0 -2 10 6 Q12 16 0 18 Q-12 16 -10 6Z"/>' : '<path d="M-7 4 Q0 -2 7 4 Q9 13 0 15 Q-9 13 -7 4Z"/>') + T(-11, -6, 0, 4, 5.5, -20) + T(11, -6, 0, 4, 5.5, 20) + T(-4, -14, 0, 4, 5.5) + T(4, -14, 0, 4, 5.5) + (kralle ? '<path d="M-5 -21 l1 -4 M5 -21 l-1 -4 M-13 -13 l-1 -4 M13 -13 l1 -4" stroke="#3b2a1a" stroke-width="1.6"/>' : "") + "</g>";
    const pfote5 = (x, y, s, art) => { let z = ""; for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45, r = 15; z += T(Math.sin(a) * r, -Math.cos(a) * r * .8, 0, 3.2, 4.4, a * 57); if (art === "dachs" || art === "biber") z += '<path d="M' + (Math.sin(a) * (r + 5)).toFixed(1) + " " + (-Math.cos(a) * (r + 5) * .8).toFixed(1) + " l" + (Math.sin(a) * 6).toFixed(1) + " " + (-Math.cos(a) * 6).toFixed(1) + '" stroke="#3b2a1a" stroke-width="1.6"/>'; } const ballen = art === "dachs" ? '<path d="M-14 6 Q0 -2 14 6 Q14 14 0 15 Q-14 14 -14 6Z"/>' : art === "hand" ? '<path d="M-9 4 Q0 0 9 4 Q10 16 0 18 Q-10 16 -9 4Z"/>' : '<ellipse cx="0" cy="8" rx="9" ry="7"/>'; return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')">' + ballen + z + (art === "biber" || art === "otter" ? '<path d="M-16 -6 Q0 -22 16 -6" fill="none" stroke="#3b2a1a" stroke-width="1" stroke-dasharray="2 2"/>' : "") + "</g>"; };
    let inhalt = "", w = 340, h = 160;
    switch (typ) {
      case "huf_klein": for (let i = 0; i < 4; i++) inhalt += huf(50 + i * 75, i % 2 ? 60 : 100, .9, false); break;
      case "huf_gross": for (let i = 0; i < 4; i++) inhalt += huf(50 + i * 80, i % 2 ? 55 : 105, 1.35, false); break;
      case "huf_schwein": for (let i = 0; i < 4; i++) inhalt += huf(50 + i * 72, i % 2 ? 58 : 102, 1.05, true); break;
      case "pfote4_oval": for (let i = 0; i < 4; i++) inhalt += '<g transform="rotate(90 ' + (50 + i * 78) + ' 80)">' + pfote4(50 + i * 78, 80, 1.5, false, true) + "</g>"; break;
      case "pfote4_oval_gross": for (let i = 0; i < 3; i++) inhalt += '<g transform="rotate(90 ' + (60 + i * 110) + ' 80)">' + pfote4(60 + i * 110, 80, 1.5, false, true) + "</g>"; break;
      case "pfote4_rund": for (let i = 0; i < 3; i++) inhalt += '<g transform="rotate(90 ' + (60 + i * 110) + " " + (i % 2 ? 62 : 98) + ')">' + pfote4(60 + i * 110, i % 2 ? 62 : 98, 1.5, true, false) + "</g>"; break;
      case "pfote4_murmel": inhalt += '<g transform="rotate(90 90 70)">' + pfote4(90, 70, 1.1, true, true) + '</g><g transform="rotate(90 230 95)">' + pfote5(230, 95, 1.1, "") + "</g>"; break;
      case "pfote5_dachs": for (let i = 0; i < 3; i++) inhalt += '<g transform="rotate(90 ' + (60 + i * 110) + " " + (i % 2 ? 60 : 100) + ')">' + pfote5(60 + i * 110, i % 2 ? 60 : 100, 1.4, "dachs") + "</g>"; break;
      case "pfote5_marder": for (let i = 0; i < 2; i++) { const x = 70 + i * 160; inhalt += '<g transform="rotate(90 ' + x + ' 64)">' + pfote5(x, 64, .9, "") + '</g><g transform="rotate(90 ' + (x + 30) + ' 100)">' + pfote5(x + 30, 100, .9, "") + "</g>"; } break;
      case "pfote5_biber": inhalt += '<g transform="rotate(90 90 80)">' + pfote5(90, 80, 1.8, "biber") + '</g><g transform="rotate(90 240 70)">' + pfote5(240, 70, 1, "") + '</g><path d="M10 140 Q170 120 330 140" stroke="#3b2a1a" stroke-width="10" opacity=".15" fill="none"/>'; break;
      case "pfote5_otter": for (let i = 0; i < 3; i++) inhalt += '<g transform="rotate(90 ' + (60 + i * 110) + " " + (i % 2 ? 62 : 98) + ')">' + pfote5(60 + i * 110, i % 2 ? 62 : 98, 1.15, "otter") + "</g>"; break;
      case "pfote5_igel": for (let i = 0; i < 5; i++) inhalt += '<g transform="rotate(90 ' + (40 + i * 65) + " " + (i % 2 ? 65 : 95) + ')">' + pfote5(40 + i * 65, i % 2 ? 65 : 95, .6, "hand") + "</g>"; break;
      case "pfote5_hand": for (let i = 0; i < 3; i++) inhalt += '<g transform="rotate(90 ' + (60 + i * 110) + " " + (i % 2 ? 62 : 98) + ')">' + pfote5(60 + i * 110, i % 2 ? 62 : 98, 1.2, "hand") + "</g>"; break;
      case "sprung_hase": for (let j = 0; j < 2; j++) { const x = 40 + j * 160; inhalt += '<ellipse cx="' + x + '" cy="80" rx="9" ry="7"/><ellipse cx="' + (x + 28) + '" cy="80" rx="9" ry="7"/><ellipse cx="' + (x + 70) + '" cy="60" rx="22" ry="9"/><ellipse cx="' + (x + 70) + '" cy="100" rx="22" ry="9"/>'; } break;
      case "sprung_hoernchen": for (let j = 0; j < 2; j++) { const x = 50 + j * 150; inhalt += '<ellipse cx="' + x + '" cy="68" rx="7" ry="6"/><ellipse cx="' + x + '" cy="92" rx="7" ry="6"/><ellipse cx="' + (x + 42) + '" cy="58" rx="14" ry="7"/><ellipse cx="' + (x + 42) + '" cy="102" rx="14" ry="7"/>'; } break;
      case "vogel": for (let i = 0; i < 4; i++) { const x = 50 + i * 75, y = i % 2 ? 60 : 100; inhalt += '<g transform="translate(' + x + " " + y + ') rotate(90)" stroke="#3b2a1a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M0 0 L-6 -14 M0 0 L6 -14 M0 0 L-6 12 M0 0 L6 12"/></g>'; } break;
      default: inhalt = '<text x="170" y="85" text-anchor="middle" font-family="Caveat" font-size="24" fill="#7b6a55">keine Spur gezeichnet</text>';
    }
    return '<svg viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Gezeichnete Spur" fill="#3b2a1a"><rect width="' + w + '" height="' + h + '" fill="none"/>' + inhalt + '<text x="' + (w - 6) + '" y="' + (h - 6) + '" text-anchor="end" font-family="Caveat" font-size="15" fill="#7b6a55">Laufrichtung →</text></svg>';
  }

  /* ---------- Merkmale & Suche ---------- */
  const norm = s => String(s || "").toLowerCase().replace(/ß/g, "ss").replace(/[.,;:!?()„“"']/g, " ");
  const stamm = w => w.length > 5 ? w.replace(/(ern|en|er|es|em|e|n|s)$/, "") : w;
  const FARBEN = { weiss: ["weiß", "weiss", "weißlich", "hell", "cremeweiß"], gelb: ["gelb", "gelblich", "goldgelb", "dottergelb", "zitronengelb", "schwefelgelb"], orange: ["orange", "orangerot", "aprikose"], rot: ["rot", "rötlich", "scharlach", "kirschrot", "blutrot"], rosa: ["rosa", "pink", "rosarot"], violett: ["violett", "lila", "purpur", "lilarosa"], blau: ["blau", "bläulich", "himmelblau", "dunkelblau"], gruen: ["grün", "gruen", "grünlich", "oliv", "olivgrün"], braun: ["braun", "bräunlich", "rotbraun", "haselbraun", "kastanienbraun", "hellbraun", "dunkelbraun"], grau: ["grau", "gräulich", "silbrig", "silbergrau", "aschgrau"], schwarz: ["schwarz", "schwärzlich", "dunkel"] };
  const SYN = {
    "u:lamellen": ["lamellen", "lamelle", "blättchen", "kiemen"], "u:roehren": ["röhren", "roehren", "röhrling", "schwamm", "schwammig unten"], "u:leisten": ["leisten", "leiste", "adern", "rippen unten"], "u:stacheln": ["stacheln unten", "stoppeln", "zähnchen"], "u:poren": ["poren", "löcher"], "u:keine": ["kugel", "kugelig", "bovist", "rund ohne stiel"], "u:waben": ["waben", "wabe", "löchrig"],
    "st:ring": ["ring", "manschette", "kragen"], "st:knolle": ["knolle", "knollig", "verdickt", "scheide", "volva"], "st:netz": ["netz", "netzartig"], "st:flocken": ["flocken", "flockig"], "st:schuppen": ["schuppen", "schuppig", "geschuppt"], "st:hohl": ["hohl"], "st:bauchig": ["bauchig", "dick"],
    "w:holz": ["holz", "baumstumpf", "stumpf", "stamm", "totholz", "baum", "rinde", "ast"], "w:buesche": ["büschel", "bueschel", "büschelig", "gruppe", "viele zusammen"], "w:boden": ["boden", "erde", "moos"],
    "f:nadel": ["nadel", "nadeln", "nadelbaum"], "f:gefiedert": ["gefiedert", "fiedern", "fieder"], "f:gelappt": ["gelappt", "lappen", "buchtig"], "f:handfoermig": ["handförmig", "ahornblatt"], "f:gefingert": ["gefingert", "finger"], "f:herz": ["herzförmig", "herz"], "f:lanzett": ["lanzettlich", "schmal", "länglich", "lang", "riemen"], "f:oval": ["oval", "eiförmig", "elliptisch"], "f:rund": ["rund", "rundlich", "kreisrund", "nierenförmig"], "f:dreiteilig": ["dreiteilig", "kleeblatt", "klee", "dreizählig"], "f:dreieck": ["dreieckig", "dreieck", "rautenförmig"], "f:pfeil": ["pfeilförmig", "pfeil", "spießförmig"],
    "r:gesaegt": ["gesägt", "gezackt", "zackig", "sägezahn"], "r:gezaehnt": ["gezähnt", "zähne"], "r:glatt": ["glattrandig", "ganzrandig"], "r:gewellt": ["gewellt", "wellig"],
    "s:gegen": ["gegenständig", "gegenüber", "paarweise"], "s:wechsel": ["wechselständig", "abwechselnd"], "s:quirl": ["quirl", "quirlig", "kranz"], "s:rosette": ["rosette", "am boden"],
    "x:dornen": ["dornen", "dornig", "dorn"], "x:stacheln": ["stacheln", "stachelig", "stachlig"], "x:brennhaare": ["brennt", "brennhaare", "brennen"], "x:milch": ["milch", "milchsaft", "weißer saft"], "x:duft-knoblauch": ["knoblauch", "knoblauchgeruch", "zwiebel"],
    "fr:beere-rot": ["rote beere", "rote beeren", "rote früchte"], "fr:beere-schwarz": ["schwarze beere", "schwarze beeren"], "fr:beere-blau": ["blaue beere", "blaue beeren", "blauschwarz"], "fr:beere-orange": ["orange beeren"], "fr:nuss": ["nuss", "nüsse", "eichel", "eicheln", "ecker"], "fr:zapfen": ["zapfen"], "fr:fluegel": ["flügel", "geflügelt", "propeller", "nasenzwicker"], "fr:kapsel": ["kapsel"], "fr:schote": ["schote", "hülse"], "fr:dolde": ["dolde", "dolden", "schirm"], "fr:steinfrucht": ["kirsche", "steinfrucht", "kern"], "fr:apfel": ["äpfelchen", "apfel", "birne"],
    "o:laubwald": ["laubwald", "buchenwald"], "o:buche": ["buche", "buchen"], "o:eiche": ["eiche", "eichen"], "o:nadelwald": ["nadelwald", "fichtenwald", "kiefernwald"], "o:fichte": ["fichte", "fichten"], "o:kiefer": ["kiefer", "kiefern"], "o:birke": ["birke", "birken"], "o:mischwald": ["mischwald", "wald"], "o:waldrand": ["waldrand", "lichtung"], "o:hecke": ["hecke", "hecken", "gebüsch"], "o:wiese": ["wiese", "weide", "rasen"], "o:wasser": ["wasser", "bach", "fluss", "ufer", "see", "teich"], "o:feucht": ["feucht", "nass", "sumpf", "graben"], "o:auwald": ["auwald", "aue", "isar", "donau"], "o:berg": ["berg", "alm", "alpen", "gebirge"], "o:fels": ["fels", "felsen", "stein"], "o:moor": ["moor", "hochmoor"], "o:stadt": ["stadt", "park", "garten", "dorf", "biergarten"], "o:trocken": ["trocken", "sonnig", "magerrasen", "kalk"], "o:kahlschlag": ["kahlschlag", "lichtung"],
    "sp:huf": ["huf", "hufe", "schalen", "paarhufer"], "sp:pfote4": ["vier zehen", "4 zehen", "pfote"], "sp:pfote5": ["fünf zehen", "5 zehen", "hand"], "sp:sprung": ["sprung", "sprungspur", "hoppeln"], "sp:vogel": ["vogel", "kralle"]
  };
  const MON_WORT = {}; MONATE.forEach((m, i) => MON_WORT[norm(m)] = [i + 1]);
  Object.assign(MON_WORT, { "frühling": [3, 4, 5], "fruehling": [3, 4, 5], "frühjahr": [3, 4, 5], "sommer": [6, 7, 8], "herbst": [9, 10, 11], "winter": [12, 1, 2], "jetzt": [heuteMonat], "heute": [heuteMonat] });
  const STOPP = new Set("ein eine einer eines einem einen der die das den dem des und oder mit ohne von im in am an auf unter über ist sind hat haben war wie sehr ganz etwas so aber auch noch nur ich wir er sie es man was wer wo da dort hier beim bei zum zur aus nach vor kein keine nicht statt riecht riechen pilz pflanze baum sieht aus".split(" "));
  const NEG = new Set(["statt", "kein", "keine", "keinen", "ohne", "nicht", "anstatt"]);
  // Index pro Art
  ARTEN.forEach(a => {
    a._tags = new Set((a.tags || "").split(/\s+/).filter(Boolean).map(norm));
    for (const t of [...a._tags]) { const m = t.match(/^(hf|bf):(\w+)$/); if (m) a._tags.add("farbe:" + m[2]); const n = t.match(/^fr:beere-(\w+)$/); if (n) a._tags.add("farbe:" + n[1]); }
    a._text = norm([a.de, a.wiss, a.fam, a.grp, a.k, a.wu, a.b, a.r, a.blt, a.f, a.kn, a.o, a.tags].join(" "));
    a._worte = new Set(a._text.split(/\s+/).filter(w => w.length > 2).map(stamm));
  });
  function analysiere(text) {
    const t = " " + norm(text) + " ";
    const begriffe = [];
    // Mehrwort-Synonyme zuerst
    for (const [tag, ws] of Object.entries(SYN)) for (const w of ws) if (w.includes(" ") && t.includes(" " + norm(w) + " ")) begriffe.push({ wort: w, tag });
    for (const [f, ws] of Object.entries(FARBEN)) for (const w of ws) if (new RegExp("\\b" + norm(w) + "\\w*\\b").test(t)) { begriffe.push({ wort: w, tag: "farbe:" + f }); break; }
    const monate = new Set();
    let neg = false;
    t.split(/\s+/).filter(Boolean).forEach(w => {
      if (NEG.has(w)) { neg = true; return; }
      const istNeg = neg; neg = false;
      if (istNeg) { let tg = null; for (const [x, ws] of Object.entries(SYN)) if (ws.some(y => norm(y) === w || stamm(norm(y)) === stamm(w))) { tg = x; break; } if (tg) { begriffe.forEach(b => { if (b.tag === tg) b.neg = true; }); if (!begriffe.some(b => b.tag === tg)) begriffe.push({ wort: w, tag: tg, neg: true }); } return; }
      if (STOPP.has(w) || w.length < 3) return;
      if (MON_WORT[w]) { MON_WORT[w].forEach(m => monate.add(m)); return; }
      if (Object.values(FARBEN).some(ws => ws.some(f => w.startsWith(norm(f))))) return;
      let tag = null;
      for (const [tg, ws] of Object.entries(SYN)) if (ws.some(x => !x.includes(" ") && (norm(x) === w || stamm(norm(x)) === stamm(w)))) { tag = tg; break; }
      if (!begriffe.some(b => b.wort === w)) begriffe.push({ wort: w, tag });
    });
    return { begriffe, monate: [...monate] };
  }
  function bestimme(text, chipTags, kapFilter) {
    const q = analysiere(text || "");
    const alle = q.begriffe.concat((chipTags || []).map(t => ({ wort: CHIP_NAME[t] || t, tag: t, chip: true })));
    if (!alle.length && !q.monate.length && !kapFilter) return { liste: [], q };
    const liste = [];
    for (const a of ARTEN) {
      if (kapFilter && kapFilter.length && !kapFilter.includes(a.kap) && !(kapFilter.includes("blume") && a.kap === "kraut") && !(kapFilter.includes("strauch") && a.kap === "beere")) continue;
      let punkte = 0, max = 0; const treffer = [];
      for (const b of alle) {
        const gew = b.chip ? 3 : b.tag ? 2.5 : 1.2;
        if (b.neg) { if (b.tag && a._tags.has(b.tag)) punkte -= gew; continue; }
        max += gew;
        let ok = false;
        if (b.tag && (a._tags.has(b.tag) || (b.tag.startsWith("farbe:") && a._tags.has(b.tag)))) ok = true;
        else if (b.tag && b.tag.startsWith("o:") && a._text.includes(b.tag.slice(2))) ok = true;
        else if (!b.chip && (a._worte.has(stamm(norm(b.wort))) || (b.wort.length > 4 && a._text.includes(norm(b.wort))))) ok = true;
        if (ok) { punkte += gew; treffer.push(b.wort); }
      }
      if (q.monate.length) { max += 2; const zeit = a.kap === "pilz" ? a.fr : a.bl.concat(a.fr); if (q.monate.some(m => zeit.includes(m))) { punkte += 2; treffer.push(q.monate.map(m => MONATE[m - 1]).join("/")); } }
      if (punkte > 0) liste.push({ a, quote: max ? punkte / max : 0, treffer });
    }
    liste.sort((x, y) => y.quote - x.quote || x.a.de.localeCompare(y.a.de));
    return { liste: liste.slice(0, 18), q };
  }
  const CHIPS = {
    alle: [["Was ist es?", [["kap:baum", "Baum"], ["kap:strauch", "Strauch / Hecke"], ["kap:kraut", "Kraut / Blume"], ["kap:pilz", "Pilz"], ["kap:tier", "Tierspur"]]]],
    pilz: [["Unterseite", [["u:lamellen", "Lamellen"], ["u:roehren", "Röhren (Schwamm)"], ["u:leisten", "Leisten"], ["u:stacheln", "Stacheln"], ["u:poren", "Poren"], ["u:keine", "Kugel/Bovist"], ["u:waben", "Waben"]]],
      ["Hutfarbe", [["farbe:weiss", "weiß"], ["farbe:gelb", "gelb"], ["farbe:orange", "orange"], ["farbe:rot", "rot"], ["farbe:braun", "braun"], ["farbe:grau", "grau"], ["farbe:gruen", "grünlich"], ["farbe:violett", "violett"], ["farbe:schwarz", "schwarz"]]],
      ["Stiel", [["st:ring", "Ring"], ["st:knolle", "Knolle/Scheide"], ["st:netz", "Netz"], ["st:flocken", "Flocken"], ["st:schuppen", "Schuppen"], ["st:hohl", "hohl"]]],
      ["Wo?", [["w:boden", "am Boden"], ["w:holz", "auf Holz"], ["w:buesche", "in Büscheln"], ["o:laubwald", "Laubwald"], ["o:nadelwald", "Nadelwald"], ["o:birke", "bei Birken"], ["o:wiese", "Wiese"]]]],
    pflanze: [["Blatt", [["f:nadel", "Nadeln"], ["f:gefiedert", "gefiedert"], ["f:gelappt", "gelappt"], ["f:handfoermig", "handförmig"], ["f:gefingert", "gefingert"], ["f:herz", "herzförmig"], ["f:lanzett", "schmal/lanzettlich"], ["f:oval", "oval"], ["f:rund", "rundlich"], ["f:dreiteilig", "dreiteilig/Klee"]]],
      ["Blattrand & Stellung", [["r:gesaegt", "gesägt"], ["r:glatt", "glatter Rand"], ["s:gegen", "gegenständig"], ["s:wechsel", "wechselständig"], ["s:quirl", "im Quirl"], ["s:rosette", "Rosette"]]],
      ["Blütenfarbe", [["bf:weiss", "weiß"], ["bf:gelb", "gelb"], ["bf:rosa", "rosa"], ["bf:rot", "rot"], ["bf:violett", "violett"], ["bf:blau", "blau"], ["bf:gruen", "grünlich"]]],
      ["Frucht", [["fr:beere-rot", "rote Beeren"], ["fr:beere-schwarz", "schwarze Beeren"], ["fr:beere-blau", "blaue Beeren"], ["fr:nuss", "Nuss"], ["fr:zapfen", "Zapfen"], ["fr:fluegel", "Flügelfrucht"], ["fr:kapsel", "Kapsel"], ["fr:dolde", "Dolde"], ["fr:steinfrucht", "Steinfrucht"]]],
      ["Besonderes", [["x:dornen", "Dornen"], ["x:stacheln", "Stacheln"], ["x:brennhaare", "brennt"], ["x:milch", "Milchsaft"], ["x:duft-knoblauch", "Knoblauchduft"], ["ri:weiss", "weiße Rinde"], ["ri:glatt", "glatte Rinde"]]],
      ["Wo?", [["o:laubwald", "Laubwald"], ["o:nadelwald", "Nadelwald"], ["o:waldrand", "Waldrand"], ["o:hecke", "Hecke"], ["o:wiese", "Wiese"], ["o:wasser", "am Wasser"], ["o:berg", "Berge"], ["o:moor", "Moor"], ["o:stadt", "Stadt/Dorf"]]]],
    tier: [["Spur", [["sp:huf", "Hufe (Schalen)"], ["sp:pfote4", "Pfote mit 4 Zehen"], ["sp:pfote5", "Pfote mit 5 Zehen"], ["sp:sprung", "Sprungspur"], ["sp:vogel", "Vogel"]]],
      ["Größe & Ort", [["gr:klein", "klein"], ["gr:mittel", "mittel"], ["gr:gross", "groß"], ["o:wasser", "am Wasser"], ["o:berg", "Berge"], ["o:stadt", "Stadt"]]]]
  };
  const CHIP_NAME = {}; Object.values(CHIPS).forEach(g => g.forEach(([, cs]) => cs.forEach(([t, n]) => CHIP_NAME[t] = n)));

  /* ---------- Ton ---------- */
  const Ton = (() => {
    let el = null;
    const atmo = ["a_voegel1", "a_voegel2", "a_baumwind", "a_bach1", "a_laub"];
    function an() { if (!el) { el = new Audio("amb/" + atmo[Math.floor(Math.random() * atmo.length)] + ".mp3"); el.loop = true; el.volume = .35; } el.play().catch(() => {}); }
    function aus() { if (el) el.pause(); }
    function kurz(name, vol) { try { const a = new Audio("amb/" + name + ".mp3"); a.volume = vol || .6; a.play().catch(() => {}); } catch (e) { /* egal */ } }
    return { an, aus, kurz, setz(v) { STAND.ton = v; speichern(); v ? an() : aus(); $("#ton-knopf").textContent = v ? "🔊" : "🔇"; } };
  })();
  $("#ton-knopf").addEventListener("click", () => Ton.setz(!STAND.ton));
  $("#ton-knopf").textContent = STAND.ton ? "🔊" : "🔇";
  document.addEventListener("pointerdown", function erst() { if (STAND.ton) Ton.an(); document.removeEventListener("pointerdown", erst); });

  /* ---------- Bausteine ---------- */
  function monatsBalken(a) { return '<div class="monate" aria-hidden="true">' + MK.map((m, i) => { const n = i + 1; return '<i class="' + (a.er.includes(n) ? "e" : a.fr.includes(n) ? "f" : a.bl.includes(n) ? "b" : "") + '"></i>'; }).join("") + "</div>"; }
  function marken(a) {
    let m = "";
    if (a.ess === "essbar") m += '<span class="marke ess" title="essbar">🍴</span>';
    if (a.ess === "bedingt") m += '<span class="marke ess" title="bedingt essbar">⚠🍴</span>';
    if (a.ess === "giftig") m += '<span class="marke gift" title="giftig">☠</span>';
    if (a.ess === "toedlich") m += '<span class="marke tod" title="tödlich giftig">☠</span>';
    if (a.schutz) m += '<span class="marke schutz" title="geschützt">🛡</span>';
    return '<span class="marken">' + m + "</span>";
  }
  function klebe(a) {
    const kap = KAP[a.kap] || KAPITEL[0];
    return '<a class="klebe" href="#/art/' + a.id + '" style="--band:' + kap.band + '"><div class="bild">' + bildHtml(a.id) + "</div>" + marken(a) + '<div class="name">' + esc(a.de) + '</div><div class="lat">' + esc(a.wiss) + "</div>" + monatsBalken(a) + (window.WB_MEHR ? WB_MEHR.fundMarke(a) : STAND.gefunden[a.id] ? '<span class="gefunden" title="Auf einer Spurensuche gefunden">✓</span>' : "") + "</a>";
  }
  function kalender(a) {
    const zeile = (name, arr, cls) => arr && arr.length ? '<div class="zeile"><b>' + name + "</b>" + MK.map((m, i) => '<i class="' + (arr.includes(i + 1) ? "an " + cls : "") + (i + 1 === heuteMonat ? " heute" : "") + '" title="' + MONATE[i] + '"></i>').join("") + "</div>" : "";
    const tier = a.kap === "tier", pilz = a.kap === "pilz";
    return '<div class="kalender" aria-label="Jahreskalender"><div class="zeile"><span></span>' + MK.map(m => "<span>" + m + "</span>").join("") + "</div>" +
      (tier ? zeile("Paarung", a.bl, "b") + zeile("Jungtiere", a.fr, "f") : pilz ? zeile("Fruchtkörper", a.fr, "f") + zeile("Sammelzeit", a.er, "e") : zeile("Blüte", a.bl, "b") + zeile("Frucht", a.fr, "f") + zeile("Sammelzeit", a.er, "e")) + "</div>";
  }
  function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3100); }
  const seite = html => { const s = $("#seite"); s.style.animation = "none"; void s.offsetWidth; s.style.animation = ""; s.innerHTML = html; window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" }); };

  /* ---------- Register ---------- */
  function register(aktiv) {
    const r = $("#register");
    const extra = [["", "Deckblatt", "#efe2c2"], ["bestimmen", "🔍 Bestimmen", "#f1d38f"], ["jetzt", "📅 Was wächst jetzt?", "#e9c9a0"], ["ausflug", "🥾 Ausflug", "#cfe0a8"], ["fundbuch", "📷 Fundbuch", "#f4dfa0"], ["album", "📒 Sammelalbum", "#e8c7a8"], ["doppelgaenger", "☠ Doppelgänger", "#e6a99a"], ["lernen", "🧠 Lernkiste", "#d8c0e0"], ["spiel", "🐾 Rex' Spürnase", "#f0b77c"], ["offline", "📥 Offline", "#d6cfa8"]];
    r.innerHTML = extra.slice(0, 1).map(([k, n, f]) => '<a class="reiter" href="#/' + k + '" style="background:' + f + '"' + (aktiv === k ? ' aria-current="page"' : "") + ">" + n + "</a>").join("") +
      KAPITEL.map(k => '<a class="reiter" href="#/kapitel/' + k.k + '" style="background:' + k.farbe + '"' + (aktiv === "kapitel/" + k.k ? ' aria-current="page"' : "") + ">" + k.name + "</a>").join("") +
      extra.slice(1).map(([k, n, f]) => '<a class="reiter" href="#/' + k + '" style="background:' + f + '"' + (aktiv === k ? ' aria-current="page"' : "") + ">" + n + "</a>").join("");
    const a = r.querySelector("[aria-current]"); if (a) a.scrollIntoView({ inline: "center", block: "nearest" });
  }

  /* ---------- Seiten ---------- */
  function deckblatt() {
    const jetzt = ARTEN.filter(a => (a.kap === "pilz" ? a.fr : a.bl.concat(a.er)).includes(heuteMonat)).sort(() => Math.random() - .5).slice(0, 8);
    const gefunden = Object.keys(STAND.gefunden).length;
    seite('<div class="deckblatt"><div><p class="leise" style="font-family:var(--fb);letter-spacing:.14em;text-transform:uppercase">Notizen eines Waldläufers</p><h1 class="hand">Friedrichs Waldbuch</h1><p style="font-size:1.1rem">Was der Wald mich gelehrt hat – aufgeschrieben für alle, die mit offenen Augen gehen. Mit Fotos, Jahreskalender, giftigen Doppelgängern und den Spuren, die Rex schneller findet als ich.</p>' +
      '<div class="zahlen"><span><b>' + ARTEN.length + "</b>Arten</span><span><b>" + Object.values(BILDER).reduce((s, b) => s + b.length, 0) + "</b>Fotos</span><span><b>" + KAPITEL.length + "</b>Kapitel</span><span><b>" + (window.WB_MEHR ? Object.keys(STAND.funde || {}).length : gefunden) + "</b>selbst gefunden</span></div>" +
      '<div class="reihe"><a class="knopf" href="#/ausflug">🥾 Auf einen Ausflug</a><a class="knopf" href="#/spiel">🐾 Spurensuche mit Rex</a><a class="knopf hell" href="#/bestimmen">🔍 Etwas bestimmen</a><a class="knopf hell" href="#/fundbuch">📷 Mein Fundbuch</a><a class="knopf hell" href="#/lernen">🧠 Lernkiste</a><a class="knopf hell" href="#/doppelgaenger">☠ Doppelgänger</a><a class="knopf hell" href="#/offline">📥 Offline mitnehmen</a></div></div>' +
      '<div class="bilder" aria-hidden="true"><img src="friedrich-frei.webp" alt="" style="right:18%;bottom:0;height:300px"><img src="rex-frei.webp" alt="" style="right:0;bottom:0;height:150px"></div></div>' +
      '<div class="notiz">Bevor du losziehst: Dieses Buch ist zum Lernen da. Ich habe mir Mühe gegeben, dass alles stimmt – aber ein Buch ersetzt keine Pilzberatung und keine erfahrene Hand. Wer sammelt, sammelt nur, was er sicher kennt, und nur so viel, wie er braucht. Geschützte Pflanzen bleiben stehen. Und Rex bleibt an der Leine, wenn Rehkitze im Gras liegen.<span class="unterschrift">– Friedrich</span></div><div id="mehr-heute"></div>' +
      '<h3 class="hand">Gerade im ' + MONATE[heuteMonat - 1] + '</h3><div class="gitter">' + jetzt.map(klebe).join("") + '</div><p><a href="#/jetzt">Alles, was im ' + MONATE[heuteMonat - 1] + " wächst, blüht und reift →</a></p>" +
      '<h3 class="hand">Das Register</h3><div class="modi">' + KAPITEL.map(k => '<a class="modus" href="#/kapitel/' + k.k + '"><b>' + k.name + "</b>" + ARTEN.filter(a => a.kap === k.k).length + " Arten · " + esc(k.intro.split(".")[0]) + ".</a>").join("") + "</div>");
    if (window.WB_MEHR) WB_MEHR.deck();
  }
  let kapFilter = "alle";
  function kapitel(k) {
    const K = KAP[k]; if (!K) return deckblatt();
    let liste = ARTEN.filter(a => a.kap === k);
    const filter = { alle: () => true, essbar: a => a.ess === "essbar" || a.ess === "bedingt", giftig: a => a.ess === "giftig" || a.ess === "toedlich", jetzt: a => (a.kap === "pilz" ? a.fr : a.kap === "tier" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : a.bl.concat(a.fr, a.er)).includes(heuteMonat), schutz: a => !!a.schutz };
    const gef = liste.filter(filter[kapFilter] || filter.alle);
    seite('<h2 class="hand">' + K.name + '</h2><div class="notiz" style="max-width:640px">' + esc(K.intro) + '<span class="unterschrift">– F.</span></div>' +
      (k === "pilz" ? '<div class="warnung"><b>Pilze nie nur nach Fotos oder Büchern bestimmen.</b> Lass jeden Fund von einer Pilzberatungsstelle prüfen (Pilzsachverständige der DGfM, viele Landratsämter bieten Beratung an). Bei Verdacht auf Vergiftung: Notruf <b>112</b> oder Giftnotruf München <b>089 19240</b>.</div>' : "") +
      '<div class="chips" role="group" aria-label="Filter">' + [["alle", "Alle"], ["essbar", "🍴 essbar"], ["giftig", "☠ giftig"], ["jetzt", "📅 jetzt im " + MONATE[heuteMonat - 1]], ["schutz", "🛡 geschützt"]].map(([f, n]) => '<button class="chip" data-f="' + f + '" aria-pressed="' + (kapFilter === f) + '">' + n + "</button>").join("") + "</div>" +
      '<p class="leise">' + gef.length + " von " + liste.length + ' Arten · Monatsstreifen: <span style="color:var(--ocker)">■</span> Blüte <span style="color:var(--beere)">■</span> Frucht <span style="color:var(--moos2)">■</span> Sammelzeit</p><div class="gitter">' + gef.map(klebe).join("") + "</div>");
    $("#seite").querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => { kapFilter = b.dataset.f; kapitel(k); }));
  }
  function artSeite(id) {
    const a = ART[id]; if (!a) return deckblatt();
    STAND.gelesen[id] = 1; speichern();
    const K = KAP[a.kap] || KAPITEL[0];
    const B = bilderVon(id);
    const E = ESS[a.ess] || ESS.kein;
    const nachbarn = ARTEN.filter(x => x.kap === a.kap), idx = nachbarn.indexOf(a);
    const vor = nachbarn[(idx + 1) % nachbarn.length], zur = nachbarn[(idx - 1 + nachbarn.length) % nachbarn.length];
    const verw = (a.v || "").split(",").map(s => s.trim()).filter(v => ART[v]);
    const merk = felderFuer(a).filter(([f]) => !leer(a[f])).map(([f, n]) => "<dt>" + n + "</dt><dd>" + esc(a[f]) + "</dd>").join("");
    seite('<p class="leise"><a href="#/kapitel/' + a.kap + '">' + K.name + "</a> · " + esc(a.grp) + '</p><div class="art-kopf"><h1 class="hand">' + esc(a.de) + '</h1><span class="latein">' + esc(a.wiss) + '</span></div><p style="font-size:1.1rem;margin:.3rem 0 0">' + esc(a.k) + '</p><div id="mehr-oben"></div>' +
      '<div class="art"><div class="galerie">' +
      (B.length ? '<div class="haupt" id="haupt" tabindex="0" role="button" aria-label="Foto vergrößern"><img src="pflanzen/bilder/' + B[0].f + '" alt="' + esc(a.de + " – " + (ASPEKT[B[0].a] || "")) + '" id="hauptbild"><div class="unter" id="hauptunter">' + esc(ASPEKT[B[0].a] || "Übersicht") + "</div></div>" +
        '<div class="daumen">' + B.map((b, i) => '<button data-i="' + i + '" aria-current="' + (i === 0) + '" aria-label="' + esc(ASPEKT[b.a] || "Foto") + '"><img src="pflanzen/bilder/' + b.f + '" alt="" loading="lazy"><span>' + esc(ASPEKT[b.a] || "Foto") + "</span></button>").join("") + "</div>"
        : '<div class="haupt"><div class="keinbild">Hier klebt bald ein Foto.<br>Friedrich ist noch unterwegs.</div></div>') +
      (a.kap === "tier" && a.spur ? '<h3 class="hand">So sieht die Spur aus</h3><div class="spur-bild">' + spurSvg(a.spur) + "</div>" : "") +
      (a.kap === "tier" && window.WB_MEHR ? WB_MEHR.stimmeHtml(a) : "") +
      kalender(a) +
      '</div><div><div id="mehr-fund"></div><div class="steck"><dl><dt>Familie</dt><dd>' + esc(a.fam) + "</dd><dt>Gruppe</dt><dd>" + esc(a.grp) + '</dd><dt>Küche</dt><dd><span class="ess-schild ' + a.ess + '">' + E[1] + " " + E[0] + "</span>" + (a.schutz ? ' <span class="ess-schild bedingt">🛡 geschützt</span>' : "") + "</dd>" + (leer(a.o) ? "" : "<dt>Lebensraum</dt><dd>" + esc(a.o) + "</dd>") + (leer(a.by) ? "" : "<dt>In Bayern</dt><dd>" + esc(a.by) + "</dd>") + "</dl></div>" +
      '<h3 class="hand">Woran ich sie erkenne</h3><dl class="merk">' + merk + "</dl>" +
      (leer(a.ku) ? "" : '<h3 class="hand">' + (a.kap === "tier" ? "Gut zu wissen" : "In Küche & Hausapotheke") + "</h3><p>" + esc(a.ku) + "</p>") +
      (leer(a.vo) ? "" : '<div class="warnung"><b>Vorsicht:</b> ' + esc(a.vo) + "</div>") +
      (verw.length ? '<h3 class="hand">Nicht verwechseln mit</h3><div class="verw">' + verw.map(v => '<a href="#/art/' + v + '">' + bildHtml(v, "mini") + esc(ART[v].de) + "</a>").join("") + "</div>" : "") +
      '<div id="mehr-unterschied"></div>' +
      (leer(a.n) ? "" : '<div class="notiz">' + esc(a.n) + '<span class="unterschrift">– Friedrich</span></div>') +
      (leer(a.x) ? "" : "<p><b class=\"hand\" style=\"font-size:1.3rem;color:var(--ocker)\">Wusstest du?</b> " + esc(a.x) + "</p>") +
      "</div></div>" +
      (B.length ? '<div class="nachweis"><b>Fotos:</b> ' + B.map((b, i) => (i + 1) + ". " + esc(ASPEKT[b.a] || "") + ": " + esc(b.autor) + ", <a href=\"" + esc(b.lizenzurl || b.quelle) + '" rel="noopener" target="_blank">' + esc(b.lizenz) + '</a> (<a href="' + esc(b.quelle) + '" rel="noopener" target="_blank">Wikimedia Commons</a>)').join(" · ") + "</div>" : "") +
      '<div class="weiterblaettern"><a href="#/art/' + zur.id + '">← ' + esc(zur.de) + '</a><a href="#/art/' + vor.id + '">' + esc(vor.de) + " →</a></div>");
    const zeig = i => { const b = B[i]; $("#hauptbild").src = "pflanzen/bilder/" + b.f; $("#hauptunter").textContent = ASPEKT[b.a] || "Foto"; $("#seite").querySelectorAll(".daumen button").forEach((x, j) => x.setAttribute("aria-current", j === i)); aktuellesBild = i; };
    let aktuellesBild = 0;
    $("#seite").querySelectorAll(".daumen button").forEach(btn => btn.addEventListener("click", () => zeig(+btn.dataset.i)));
    if (window.WB_MEHR) { WB_MEHR.art(a); WB_MEHR.tonVerdrahten($("#seite")); }
    const h = $("#haupt"); if (h && B.length) { const auf = () => lupe(a, B, aktuellesBild); h.addEventListener("click", auf); h.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); auf(); } }); }
  }
  function lupe(a, B, i) { bildLupe(lupenListe(a.id, true), i); }

  /* ---------- Bildlupe: Zoomen (Finger, Doppeltipp, Mausrad, +/−) und Blättern ---------- */
  function lupenListe(id, mitName) {
    return bilderVon(id).map(b => ({ src: "pflanzen/bilder/" + b.f, asp: ASPEKT[b.a] || "", titel: mitName ? ART[id].de : "", beschr: mitName ? b.beschr : "", autor: b.autor, lizenz: b.lizenz, lizenzurl: b.lizenzurl, quelle: mitName ? b.quelle : "", hd: hdUrl(b.quelle) }));
  }
  // Schärferes Original von Wikimedia Commons fürs Hineinzoomen (online); offline bleibt das eingebaute Foto.
  function hdUrl(q) {
    const m = /\/wiki\/File:(.+)$/.exec(q || ""); if (!m) return "";
    let n = m[1]; try { n = decodeURIComponent(n); } catch (e) {}
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(n) + "?width=2200";
  }
  function bildLupe(L, i) {
    if (!L.length) return;
    const vorher = document.activeElement;
    const d = document.createElement("div"); d.className = "lupe zoombar"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Bild vergrößert");
    d.innerHTML = '<div class="zoom-flaeche"><img alt="" draggable="false"></div><div class="text"></div>' +
      '<div class="zoom-knoepfe"><button class="zoom-minus" aria-label="Verkleinern">−</button><button class="zoom-eins" aria-label="Ganzes Bild">⤢</button><button class="zoom-plus" aria-label="Vergrößern">+</button></div>' +
      '<button class="zu" aria-label="Schließen">✕</button>' + (L.length > 1 ? '<button class="zur" aria-label="Vorheriges Bild">‹</button><button class="vor" aria-label="Nächstes Bild">›</button>' : "");
    const fl = d.querySelector(".zoom-flaeche"), img = fl.querySelector("img"), tx = d.querySelector(".text");
    let s = 1, x = 0, y = 0;
    const MAX = 6;
    const grenzen = () => {
      const mx = Math.max(0, (img.offsetWidth * s - fl.clientWidth) / 2), my = Math.max(0, (img.offsetHeight * s - fl.clientHeight) / 2);
      x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y));
    };
    const setz = sanft => { grenzen(); img.style.transition = sanft ? "transform .22s ease-out" : "none"; img.style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")"; d.classList.toggle("gezoomt", s > 1.01); if (s > 1.5) hdHolen(); };
    const punkt = (cx, cy) => { const r = fl.getBoundingClientRect(); return [cx - r.left - r.width / 2, cy - r.top - r.height / 2]; };
    const zoomAuf = (ns, px, py, sanft) => { ns = Math.max(1, Math.min(MAX, ns)); const ux = (px - x) / s, uy = (py - y) / s; s = ns; x = px - ux * s; y = py - uy * s; if (s === 1) { x = 0; y = 0; } setz(sanft); };
    let hdGeladen = false, nr = 0;
    const einpassen = () => {
      const nw = img.naturalWidth, nh = img.naturalHeight; if (!nw || !nh || img.dataset.hd) { if (!img.dataset.hd) return; }
      const cs = getComputedStyle(fl), aw = fl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 10, ah = fl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 10;
      const rw = +img.dataset.rw || nw, rh = +img.dataset.rh || nh, f = Math.min(aw / rw, ah / rh);
      img.style.width = Math.round(rw * f) + "px"; img.style.height = Math.round(rh * f) + "px"; setz(false);
    };
    const hdHolen = () => {
      const b = L[i]; if (hdGeladen || !b.hd || !navigator.onLine) return; hdGeladen = true;
      const meins = nr, h = new Image();
      h.onload = () => { if (meins !== nr || !h.naturalWidth) return; img.dataset.hd = "1"; img.src = h.src; d.classList.add("scharf"); };
      h.src = b.hd;
    };
    const zeig = () => {
      const b = L[i]; s = 1; x = 0; y = 0; nr++; hdGeladen = false; d.classList.remove("scharf");
      delete img.dataset.hd; delete img.dataset.rw; delete img.dataset.rh; img.style.width = img.style.height = "";
      setz(false); img.src = b.src;
      tx.innerHTML = "<b>" + esc((b.titel ? b.titel + (b.asp ? " – " : "") : "") + (b.asp || (b.titel ? "" : "Foto"))) + (L.length > 1 ? ' <small>' + (i + 1) + " / " + L.length + "</small>" : "") + "</b>" +
        (b.beschr ? esc(String(b.beschr).slice(0, 200)) + "<br>" : "") +
        (b.autor ? "Foto: " + esc(b.autor) + " · " + (b.lizenzurl ? '<a href="' + esc(b.lizenzurl) + '" target="_blank" rel="noopener">' + esc(b.lizenz) + "</a>" : esc(b.lizenz || "")) + (b.quelle ? ' · <a href="' + esc(b.quelle) + '" target="_blank" rel="noopener">Quelle</a>' : "") : "") +
        '<span class="zoom-tipp">Mit zwei Fingern oder Doppeltipp zoomen' + (L.length > 1 ? ", wischen zum Blättern" : "") + "</span>";
    };
    const blaettern = n => { if (L.length < 2) return; i = (i + n + L.length) % L.length; zeig(); };
    const zu = () => { d.remove(); document.removeEventListener("keydown", taste); window.removeEventListener("resize", groesse); if (vorher && vorher.focus) vorher.focus(); };
    const taste = e => { if (e.key === "Escape") zu(); else if (e.key === "ArrowRight") blaettern(1); else if (e.key === "ArrowLeft") blaettern(-1); else if (e.key === "+" || e.key === "=") zoomAuf(s * 1.5, 0, 0, true); else if (e.key === "-") zoomAuf(s / 1.5, 0, 0, true); };
    // Finger & Maus
    const P = new Map(); let start = null, letzterTipp = 0, bewegt = false;
    fl.addEventListener("pointerdown", e => {
      fl.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); bewegt = false;
      const pts = [...P.values()];
      if (pts.length === 1) start = { typ: 1, cx: e.clientX, cy: e.clientY, x, y, t: Date.now() };
      else if (pts.length === 2) { const [a, b] = pts; start = { typ: 2, dist: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, s, mid: punkt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), x, y }; }
    });
    fl.addEventListener("pointermove", e => {
      if (!P.has(e.pointerId) || !start) return;
      P.set(e.pointerId, [e.clientX, e.clientY]);
      const pts = [...P.values()];
      if (start.typ === 2 && pts.length >= 2) {
        const [a, b] = pts, dist = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = punkt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        const ns = Math.max(1, Math.min(MAX, start.s * dist / start.dist));
        const ux = (start.mid[0] - start.x) / start.s, uy = (start.mid[1] - start.y) / start.s;
        s = ns; x = mid[0] - ux * s; y = mid[1] - uy * s; bewegt = true; setz(false);
      } else if (start.typ === 1) {
        const dx = e.clientX - start.cx, dy = e.clientY - start.cy;
        if (Math.abs(dx) + Math.abs(dy) > 8) bewegt = true;
        if (s > 1.01) { x = start.x + dx; y = start.y + dy; setz(false); }
        else if (L.length > 1) { img.style.transition = "none"; img.style.transform = "translateX(" + dx + "px)"; }
      }
    });
    const hoch = e => {
      if (!P.has(e.pointerId)) return;
      P.delete(e.pointerId);
      if (start && start.typ === 2) { if (P.size === 1) { const [p] = [...P.values()]; start = { typ: 1, cx: p[0], cy: p[1], x, y, t: Date.now() }; bewegt = true; } else start = null; return; }
      if (!start) return;
      const dx = e.clientX - start.cx;
      if (s <= 1.01 && L.length > 1 && Math.abs(dx) > 60 && bewegt) { blaettern(dx < 0 ? 1 : -1); start = null; return; }
      if (s <= 1.01) setz(true);
      if (!bewegt) {
        const jetzt = Date.now();
        if (jetzt - letzterTipp < 320) { letzterTipp = 0; const [px, py] = punkt(e.clientX, e.clientY); zoomAuf(s > 1.01 ? 1 : 2.5, px, py, true); }
        else { letzterTipp = jetzt; if (e.target !== img && s <= 1.01) setTimeout(() => { if (letzterTipp === jetzt) zu(); }, 330); }
      }
      start = null;
    };
    fl.addEventListener("pointerup", hoch); fl.addEventListener("pointercancel", hoch);
    fl.addEventListener("wheel", e => { e.preventDefault(); const [px, py] = punkt(e.clientX, e.clientY); zoomAuf(s * (e.deltaY < 0 ? 1.25 : 0.8), px, py, false); }, { passive: false });
    d.addEventListener("click", e => {
      const k = e.target.closest("button"); if (!k) return;
      if (k.classList.contains("zu")) zu(); else if (k.classList.contains("vor")) blaettern(1); else if (k.classList.contains("zur")) blaettern(-1);
      else if (k.classList.contains("zoom-plus")) zoomAuf(s * 1.6, 0, 0, true); else if (k.classList.contains("zoom-minus")) zoomAuf(s / 1.6, 0, 0, true); else if (k.classList.contains("zoom-eins")) zoomAuf(1, 0, 0, true);
    });
    img.addEventListener("load", () => { if (!img.dataset.hd) { img.dataset.rw = img.naturalWidth; img.dataset.rh = img.naturalHeight; } einpassen(); });
    const groesse = () => einpassen(); window.addEventListener("resize", groesse);
    zeig();
    document.addEventListener("keydown", taste);
    document.body.appendChild(d);
    d.querySelector(".zu").focus({ preventScroll: true });
  }

  /* Fotostreifen im Rätsel: alle Fotos einer Art, antippen = vergrößern. Ohne Namen, damit nichts verraten wird. */
  function fotoKarussell(id, mitName, start) {
    const B = bilderVon(id); if (!B.length) return "";
    const i0 = Math.max(0, Math.min(B.length - 1, start || 0));
    return '<div class="fbild karussell" data-id="' + id + '"' + (mitName ? ' data-name="1"' : "") + ' data-i="' + i0 + '">' +
      '<div class="fb-rahmen"><img src="pflanzen/bilder/' + B[i0].f + '" alt="Rätselbild – antippen zum Vergrößern"><span class="fb-asp">' + esc(ASPEKT[B[i0].a] || "Foto") + "</span>" +
      '<button class="fb-lupe" aria-label="Vergrößern">🔍</button>' +
      (B.length > 1 ? '<button class="fb-zur" aria-label="Vorheriges Bild">‹</button><button class="fb-vor" aria-label="Nächstes Bild">›</button>' : "") + "</div>" +
      (B.length > 1 ? '<div class="fb-leiste">' + B.map((b, j) => '<button class="fb-mini' + (j === i0 ? " an" : "") + '" data-j="' + j + '" aria-label="Bild ' + (j + 1) + ": " + esc(ASPEKT[b.a] || "Foto") + '"><img src="pflanzen/bilder/' + b.f + '" alt="" loading="lazy"></button>').join("") + "</div>" : "") + "</div>";
  }
  function karussellSetzen(k, j) {
    const B = bilderVon(k.dataset.id); if (!B.length) return;
    j = (j + B.length) % B.length; k.dataset.i = j;
    k.querySelector(".fb-rahmen img").src = "pflanzen/bilder/" + B[j].f;
    k.querySelector(".fb-asp").textContent = ASPEKT[B[j].a] || "Foto";
    k.querySelectorAll(".fb-mini").forEach((m, n) => m.classList.toggle("an", n === j));
  }
  function bildwahlLupe(id) { return '<span class="bw-lupe" role="button" tabindex="0" data-zoom-id="' + id + '" aria-label="Alle Fotos vergrößern">🔍<small>' + bilderVon(id).length + "</small></span>"; }
  // Ein Zuhörer für alle Rätsel (Lernkiste, Spürnase, Prüfung)
  document.addEventListener("click", e => {
    const z = e.target.closest("[data-zoom-id]");
    if (z) { e.preventDefault(); e.stopPropagation(); bildLupe(lupenListe(z.dataset.zoomId, false), 0); return; }
    const k = e.target.closest(".karussell"); if (!k) return;
    const i = +k.dataset.i || 0;
    if (e.target.closest(".fb-vor")) karussellSetzen(k, i + 1);
    else if (e.target.closest(".fb-zur")) karussellSetzen(k, i - 1);
    else if (e.target.closest(".fb-mini")) karussellSetzen(k, +e.target.closest(".fb-mini").dataset.j);
    else if (e.target.closest(".fb-lupe") || e.target.closest(".fb-rahmen img")) bildLupe(lupenListe(k.dataset.id, !!k.dataset.name), i);
  }, true);
  document.addEventListener("keydown", e => { const z = e.target.closest && e.target.closest("[data-zoom-id]"); if (z && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); bildLupe(lupenListe(z.dataset.zoomId, false), 0); } }, true);

  /* ---------- Bestimmen ---------- */
  let bestTag = new Set(), bestText = "", bestGruppe = "pflanze";
  function bestimmenSeite() {
    const gruppen = [["pflanze", "🌿 Pflanze"], ["pilz", "🍄 Pilz"], ["tier", "🐾 Tierspur"]];
    seite('<h2 class="hand">Was hab ich da gefunden?</h2><p>Beschreib in eigenen Worten, was du siehst – Farbe, Form, Unterseite, Geruch, wo es wächst, welcher Monat ist. Oder tipp Merkmale an. Ich blättere das ganze Buch durch und lege dir die passendsten Seiten hin.</p>' +
      '<div class="warnung"><b>Das ist eine Bestimmungs<i>hilfe</i>, keine Freigabe zum Essen.</b> Gerade bei Pilzen und weißen Doldenblütlern gibt es tödliche Doppelgänger. Hol dir immer eine Zweitmeinung von Fachleuten.</div>' +
      '<div class="bestimm"><textarea id="best-text" placeholder="z. B. gelber Pilz mit Leisten statt Lamellen, riecht nach Aprikose, Fichtenwald, August" aria-label="Beschreibung">' + esc(bestText) + '</textarea>' +
      '<div class="chips" role="group" aria-label="Was ist es?">' + gruppen.map(([g, n]) => '<button class="chip" data-g="' + g + '" aria-pressed="' + (bestGruppe === g) + '">' + n + "</button>").join("") + '<button class="chip" data-reset>✕ zurücksetzen</button></div>' +
      CHIPS[bestGruppe].map(([titel, cs]) => "<fieldset><legend>" + titel + '</legend><div class="chips">' + cs.map(([t, n]) => '<button class="chip" data-t="' + t + '" aria-pressed="' + bestTag.has(t) + '">' + n + "</button>").join("") + "</div></fieldset>").join("") +
      '</div><div id="best-erg"></div>');
    const s = $("#seite");
    const los = () => {
      bestText = $("#best-text").value;
      const kapF = bestGruppe === "pilz" ? ["pilz"] : bestGruppe === "tier" ? ["tier"] : ["baum", "strauch", "beere", "kraut", "blume", "farn"];
      const { liste, q } = bestimme(bestText, [...bestTag], (bestText.trim() || bestTag.size) ? kapF : null);
      const box = $("#best-erg");
      if (!bestText.trim() && !bestTag.size) { box.innerHTML = '<p class="leise">Noch nichts beschrieben. Rex wartet geduldig.</p>'; return; }
      if (!liste.length) { box.innerHTML = '<div class="notiz">Hm. Dazu finde ich nichts in meinem Buch. Versuch es mit anderen Worten – oder es ist etwas, das ich noch nie gesehen habe!<span class="unterschrift">– F.</span></div>'; return; }
      const erkannt = q.begriffe.filter(b => b.tag).map(b => (b.neg ? "nicht " : "") + b.wort).concat([...bestTag].map(t => CHIP_NAME[t]));
      box.innerHTML = (erkannt.length ? '<p class="leise">Erkannte Merkmale: ' + erkannt.map(esc).join(", ") + (q.monate.length ? " · Zeit: " + q.monate.map(m => MONATE[m - 1]).join(", ") : "") + "</p>" : "") +
        '<ul class="treffer">' + liste.map(x => '<li>' + bildHtml(x.a.id, "mini") + '<div><a href="#/art/' + x.a.id + '">' + esc(x.a.de) + '</a> <span class="latein" style="font-size:.85rem">' + esc(x.a.wiss) + '</span> <span class="ess-schild ' + x.a.ess + '" style="font-size:.7rem">' + (ESS[x.a.ess] || ESS.kein)[0] + '</span><div class="warum">passt zu: ' + x.treffer.map(t => "<mark>" + esc(t) + "</mark>").join(" ") + (x.a.v ? " · Verwechslung: " + x.a.v.split(",").filter(v => ART[v.trim()]).map(v => esc(ART[v.trim()].de)).join(", ") : "") + '</div><div class="balkchen"><i style="width:' + Math.round(x.quote * 100) + '%"></i></div></div><div class="quote">' + Math.round(x.quote * 100) + "%<small>Treffer</small></div></li>").join("") + "</ul>";
    };
    let tim = null;
    $("#best-text").addEventListener("input", () => { clearTimeout(tim); tim = setTimeout(los, 250); });
    s.querySelectorAll("[data-t]").forEach(b => b.addEventListener("click", () => { const t = b.dataset.t; bestTag.has(t) ? bestTag.delete(t) : bestTag.add(t); b.setAttribute("aria-pressed", bestTag.has(t)); los(); }));
    s.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => { bestText = $("#best-text").value; bestGruppe = b.dataset.g; bestTag = new Set(); bestimmenSeite(); }));
    s.querySelector("[data-reset]").addEventListener("click", () => { bestText = ""; bestTag = new Set(); bestimmenSeite(); });
    los();
  }

  /* ---------- Was wächst jetzt? ---------- */
  let jetztMonat = heuteMonat;
  function jetztSeite() {
    const m = jetztMonat;
    const sammel = ARTEN.filter(a => a.er.includes(m) && (a.ess === "essbar" || a.ess === "bedingt"));
    const blueht = ARTEN.filter(a => a.kap !== "pilz" && a.kap !== "tier" && a.bl.includes(m));
    const pilze = ARTEN.filter(a => a.kap === "pilz" && a.fr.includes(m));
    const gift = ARTEN.filter(a => (a.ess === "giftig" || a.ess === "toedlich") && (a.bl.concat(a.fr)).includes(m));
    const tiere = ARTEN.filter(a => a.kap === "tier" && (a.bl.includes(m) || a.fr.includes(m)));
    const block = (titel, l, text) => l.length ? '<h3 class="hand">' + titel + ' <span class="leise">(' + l.length + ")</span></h3>" + (text ? '<p class="leise">' + text + "</p>" : "") + '<div class="gitter">' + l.map(klebe).join("") + "</div>" : "";
    seite('<h2 class="hand">Was wächst im ' + MONATE[m - 1] + "?</h2>" + '<div class="chips jetzt-monate" role="group" aria-label="Monat">' + MONATE.map((n, i) => '<button class="chip" data-m="' + (i + 1) + '" aria-pressed="' + (i + 1 === m) + '">' + n.slice(0, 3) + "</button>").join("") + "</div>" +
      block("Für Korb und Küche", sammel, "Sammelzeit für Kenner – nur was du sicher bestimmen kannst.") + block("Pilze, die jetzt erscheinen", pilze, "Immer zur Pilzberatung!") + block("Blüht gerade", blueht, "") + block("Achtung, jetzt giftig unterwegs", gift, "Diese Doppelgänger und Giftpflanzen sind jetzt zu sehen.") + block("Bei den Tieren los", tiere, "Brunft, Paarung oder Jungtiere – Abstand halten."));
    $("#seite").querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { jetztMonat = +b.dataset.m; jetztSeite(); }));
  }

  /* ---------- Lernkiste ---------- */
  function lernPool(art) {
    let p = ARTEN.filter(a => bilderVon(a.id).length);
    if (art && art !== "alle") p = p.filter(a => a.kap === art || (art === "pflanze" && !["pilz", "tier"].includes(a.kap)));
    return p;
  }
  function naechsteLernkarte(pool) {
    // Leitner: Kiste 1 oft, Kiste 5 selten
    const gew = a => [8, 5, 3, 2, 1][Math.min(4, (STAND.kiste[a.id] || 1) - 1)];
    const summe = pool.reduce((s, a) => s + gew(a), 0); let r = Math.random() * summe;
    for (const a of pool) { r -= gew(a); if (r <= 0) return a; }
    return pool[0];
  }
  function falsche(a, n, gleicheKap) {
    let kand = ARTEN.filter(x => x.id !== a.id && bilderVon(x.id).length && (!gleicheKap || x.kap === a.kap));
    const verw = (a.v || "").split(",").map(s => s.trim()).filter(v => ART[v] && bilderVon(v).length);
    const out = verw.slice(0, 1).map(v => ART[v]);
    kand = kand.filter(x => !out.includes(x)).sort(() => Math.random() - .5);
    while (out.length < n && kand.length) out.push(kand.pop());
    return out;
  }
  let lernArt = "alle", lernModus = "name";
  function lernSeite() {
    const kisten = [1, 2, 3, 4, 5].map(k => ARTEN.filter(a => (STAND.kiste[a.id] || 0) === k).length);
    const neu = ARTEN.filter(a => !STAND.kiste[a.id]).length;
    seite('<h2 class="hand">Die Lernkiste</h2><p>Jede Art wandert durch fünf Fächer: Wer richtig erkannt wird, rutscht eins weiter nach hinten und kommt seltener dran. Wer falsch ist, muss zurück ins erste Fach. So lernt man den Wald, ohne zu büffeln.</p>' +
      '<div class="kisten">' + kisten.map((n, i) => '<div class="kiste"><b>' + n + "</b>Fach " + (i + 1) + "</div>").join("") + '<div class="kiste"><b>' + neu + "</b>noch neu</div></div>" +
      '<div class="chips" role="group" aria-label="Was lernen?">' + [["alle", "Alles"], ["pflanze", "Pflanzen"], ["baum", "Bäume"], ["kraut", "Kräuter"], ["beere", "Beeren"], ["pilz", "Pilze"], ["tier", "Tiere"]].map(([k, n]) => '<button class="chip" data-a="' + k + '" aria-pressed="' + (lernArt === k) + '">' + n + "</button>").join("") + "</div>" +
      '<div class="modi">' + [["name", "Wer bin ich?", "Ein Foto – vier Namen."], ["bild", "Zeig mir …", "Ein Name – vier Fotos."], ["merkmal", "Merkmal-Rätsel", "Friedrich beschreibt, du rätst."], ["verwechslung", "Doppelgänger-Duell", "Welches ist das Richtige? Die gefährlichsten Paare."], ["monat", "Wann ist es soweit?", "Blüte, Frucht, Pilzzeit."], ["sinne", "Mit allen Sinnen", "Riechen, fühlen, lauschen – wer ist das?"]].concat(window.WB_MEHR && WB_MEHR.stimmenDa >= 4 ? [["stimme", "Wer ruft da?", "Tierstimmen erkennen."]] : []).map(([k, n, t]) => '<button class="modus" data-m="' + k + '"' + (lernModus === k ? ' style="outline:3px solid var(--ocker)"' : "") + "><b>" + n + "</b>" + t + "</button>").join("") + '</div><div id="lernfeld"></div>');
    const s = $("#seite");
    const zumFeld = () => { const f = $("#lernfeld"); if (f && window.innerWidth < 900) f.scrollIntoView({ block: "start" }); };
    s.querySelectorAll("[data-a]").forEach(b => b.addEventListener("click", () => { lernArt = b.dataset.a; lernSeite(); zumFeld(); }));
    s.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { lernModus = b.dataset.m; lernSeite(); zumFeld(); }));
    lernRunde();
  }
  function frageBauen(modus, a) {
    // gemeinsam mit dem Spiel genutzt
    if (window.WB_MEHR) { const x = WB_MEHR.frage(modus, a); if (x) return x; if (modus === "sinne" || modus === "stimme") modus = "merkmal"; }
    const f = { a, modus, antworten: [], richtig: 0, frage: "", bild: null, erkl: "" };
    if (modus === "verwechslung") {
      const v = (a.v || "").split(",").map(x => x.trim()).filter(x => ART[x] && bilderVon(x).length);
      if (!v.length) modus = "bild"; else { const b = ART[v[0]]; f.frage = "Welches ist " + a.de + "?"; f.antworten = [a, b].sort(() => Math.random() - .5); f.richtig = f.antworten.indexOf(a); f.bildwahl = true; f.erkl = a.de + ": " + (a.b || a.k) + " – " + b.de + ": " + (b.b || b.k); f.modus = modus; return f; }
    }
    if (modus === "monat") {
      const arr = a.kap === "pilz" ? a.fr : a.kap === "tier" ? a.fr : a.bl;
      if (!arr.length) modus = "name"; else {
        const was = a.kap === "pilz" ? "Wann erscheinen die Fruchtkörper von" : a.kap === "tier" ? "Wann kommen die Jungen von" : "Wann blüht";
        const mitte = arr[Math.floor(arr.length / 2)];
        const opts = [mitte]; while (opts.length < 4) { const m = 1 + Math.floor(Math.random() * 12); if (!arr.includes(m) && !opts.includes(m)) opts.push(m); }
        f.frage = was + " " + a.de + "?"; f.bild = hauptbild(a.id); f.bildId = a.id; f.bildName = true; f.antworten = opts.sort((x, y) => x - y).map(m => ({ de: MONATE[m - 1], m })); f.richtig = f.antworten.findIndex(o => o.m === mitte); f.erkl = (a.kap === "pilz" ? "Fruchtkörper: " : a.kap === "tier" ? "Jungtiere: " : "Blüte: ") + arr.map(m => MONATE[m - 1]).join(", "); f.modus = modus; return f;
      }
    }
    if (modus === "merkmal") {
      const felder = felderFuer(a).filter(([k]) => !leer(a[k]));
      const [k, n] = felder[Math.floor(Math.random() * felder.length)] || ["k", "Kurz"];
      let text = a[k]; const namen = [a.de, ...a.de.split(/[\s\-()]+/).filter(w => w.length > 3)];
      namen.forEach(w => { text = text.split(w).join("…"); });
      f.frage = "„" + n + ": " + text + "“"; f.antworten = [a].concat(falsche(a, 3, true)).sort(() => Math.random() - .5); f.richtig = f.antworten.indexOf(a); f.erkl = a.de + " – " + a.k; f.modus = modus; return f;
    }
    if (modus === "bild") { f.frage = "Zeig mir: " + a.de; f.antworten = [a].concat(falsche(a, 3, true)).sort(() => Math.random() - .5); f.richtig = f.antworten.indexOf(a); f.bildwahl = true; f.erkl = a.k; f.modus = modus; return f; }
    f.frage = "Wer bin ich?"; f.bild = hauptbild(a.id); f.bildId = a.id; f.antworten = [a].concat(falsche(a, 3, true)).sort(() => Math.random() - .5); f.richtig = f.antworten.indexOf(a); f.erkl = a.k; f.modus = "name"; return f;
  }
  function raetselBild(f) { return f.bildId ? fotoKarussell(f.bildId, !!f.bildName) : f.bild ? '<div class="fbild"><img src="' + f.bild + '" alt="Rätselbild"></div>' : ""; }
  function frageHtml(f) {
    return '<div class="karte-lern' + (f.sinn ? " sinn" : "") + '"><div class="frage">' + esc(f.frage) + "</div>" + (f.ton && window.WB_MEHR ? WB_MEHR.tonKnopf(f) : "") + raetselBild(f) +
      '<div class="antworten' + (f.bildwahl ? " bilder" : "") + '">' + f.antworten.map((x, i) => f.bildwahl ? '<button class="bildwahl" data-i="' + i + '" aria-label="Bild ' + (i + 1) + '"><img src="' + (hauptbild(x.id) || "") + '" alt="">' + bildwahlLupe(x.id) + "</button>" : '<button data-i="' + i + '">' + esc(x.de) + "</button>").join("") + '</div><div class="erklaerung" id="erkl"></div></div>';
  }
  function lernRunde() {
    const feld = $("#lernfeld"); if (!feld) return;
    const extra = window.WB_MEHR ? WB_MEHR.poolFilter(lernModus) : null;
    const pool = (lernModus === "stimme" ? ARTEN.slice() : lernPool(lernArt)).filter(a => (lernModus !== "verwechslung" || (a.v || "").split(",").some(v => ART[v.trim()] && bilderVon(v.trim()).length)) && (!extra || extra(a)));
    if (pool.length < 4) { feld.innerHTML = '<p class="leise">Für diese Auswahl sind noch nicht genug Fotos eingeklebt.</p>'; return; }
    const a = naechsteLernkarte(pool);
    const f = frageBauen(lernModus, a);
    feld.innerHTML = frageHtml(f);
    if (window.WB_MEHR) WB_MEHR.tonVerdrahten(feld);
    feld.querySelectorAll(".antworten button").forEach(b => b.addEventListener("click", () => {
      if (feld.dataset.fertig === "1") return;
      feld.dataset.fertig = "1";
      const i = +b.dataset.i, ok = i === f.richtig;
      feld.querySelectorAll(".antworten button").forEach((x, j) => x.classList.add(j === f.richtig ? "richtig" : j === i ? "falsch" : "x"));
      STAND.kiste[a.id] = ok ? Math.min(5, (STAND.kiste[a.id] || 1) + 1) : 1; speichern();
      if (window.WB_MEHR) WB_MEHR.karteBeantwortet(f, ok);
      if (STAND.ton) Ton.kurz(ok ? "e_vogel_3" : "e_kraehe_2", .5);
      $("#erkl").innerHTML = (ok ? "<b class=\"hand\" style=\"font-size:1.5rem;color:var(--moos)\">Richtig!</b> " : "<b class=\"hand\" style=\"font-size:1.5rem;color:var(--beere)\">Knapp daneben.</b> Richtig ist <a href=\"#/art/" + a.id + "\">" + esc(a.de) + "</a>. ") + esc(f.erkl).slice(0, 260) + (window.WB_MEHR ? WB_MEHR.merkHtml(a, true) : "") + ' <div class="reihe"><button class="knopf klein" id="weiter">Nächste Karte →</button><a class="knopf klein hell" href="#/art/' + a.id + '">Seite aufschlagen</a></div>';
      $("#weiter").addEventListener("click", () => { feld.dataset.fertig = "0"; lernRunde(); });
    }));
  }

  /* ---------- Doppelgänger ---------- */
  function doppelSeite() {
    const paare = [], gesehen = new Set();
    for (const a of ARTEN) for (const v of (a.v || "").split(",").map(x => x.trim()).filter(x => ART[x])) {
      const b = ART[v], key = [a.id, b.id].sort().join("|");
      if (gesehen.has(key)) continue; gesehen.add(key);
      const gefahr = ["toedlich", "giftig"].includes(a.ess) || ["toedlich", "giftig"].includes(b.ess);
      const essbar = ["essbar", "bedingt"].includes(a.ess) || ["essbar", "bedingt"].includes(b.ess);
      if (gefahr && essbar) paare.push([a.ess === "toedlich" || b.ess === "toedlich" ? 0 : 1, a.ess === "essbar" || a.ess === "bedingt" ? [a, b] : [b, a]]);
    }
    paare.sort((x, y) => x[0] - y[0]);
    const seiteA = (a) => { const F = felderFuer(a); const wichtig = F.filter(([k]) => !leer(a[k])).slice(0, 3); return '<div class="klebe" style="transform:none"><a href="#/art/' + a.id + '" style="text-decoration:none;color:inherit"><div class="bild">' + bildHtml(a.id) + "</div>" + marken(a) + '<div class="name">' + esc(a.de) + '</div><div class="lat">' + esc(a.wiss) + '</div></a><span class="ess-schild ' + a.ess + '" style="font-size:.72rem;margin:.3rem 0;display:inline-block">' + (ESS[a.ess] || ESS.kein)[0] + '</span><dl class="merk" style="font-size:.88rem">' + wichtig.map(([k, n]) => "<dt style=\"font-size:1.1rem\">" + n + "</dt><dd>" + esc(a[k]) + "</dd>").join("") + "</dl></div>"; };
    seite('<h2 class="hand">Doppelgänger</h2><div class="notiz">Hier klebe ich die Paare nebeneinander, die mir am meisten Angst machen: links das, was man sucht, rechts das, was einen ins Krankenhaus bringt. Schau dir jedes Paar lange an. Und wenn du dir einmal nicht sicher bist – stehen lassen.<span class="unterschrift">– Friedrich</span></div><div class="warnung"><b>Bei Vergiftungsverdacht:</b> Notruf 112 oder Giftnotruf München 089 19240. Pflanzen- oder Pilzreste mitnehmen.</div><div id="mehr-pruefung"></div>' +
      paare.map(([stufe, [a, b]]) => '<h3 class="hand">' + esc(a.de) + " oder " + esc(b.de) + "?" + (stufe === 0 ? ' <span class="ess-schild toedlich" style="font-size:.75rem;vertical-align:middle">lebensgefährlich</span>' : "") + (window.WB_MEHR ? " " + WB_MEHR.paarStempel(a, b) : "") + '</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start">' + seiteA(a) + seiteA(b) + "</div>" + (window.WB_MEHR ? WB_MEHR.paarExtra(a, b) : "")).join(""));
    if (window.WB_MEHR) WB_MEHR.doppel();
  }

  /* ---------- Offline ---------- */
  let installEreignis = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEreignis = e; });
  const swDa = "serviceWorker" in navigator && /^https?:$/.test(location.protocol);
  if (swDa) navigator.serviceWorker.register("waldbuch-sw.js", { scope: "./waldbuch" }).catch(() => {});
  function alleBildUrls(nurHaupt) { const u = []; for (const a of ARTEN) bilderVon(a.id).forEach((b, i) => { if (!nurHaupt || i === 0) u.push("pflanzen/bilder/" + b.f); }); if (!nurHaupt && window.WB_MEHR) u.push(...WB_MEHR.stimmenUrls()); return u; }
  async function gespeicherteBilder() { try { const c = await caches.open("waldbuch-bilder-v1"); return (await c.keys()).length; } catch (e) { return 0; } }
  let ladeLauf = null;
  async function ladeOffline(nurHaupt, aufFortschritt) {
    const c = await caches.open("waldbuch-bilder-v1");
    const urls = alleBildUrls(nurHaupt), da = new Set((await c.keys()).map(r => new URL(r.url).pathname));
    const offen = urls.filter(u => !da.has(new URL(u, location.href).pathname));
    let fertig = urls.length - offen.length, fehler = 0;
    aufFortschritt(fertig, urls.length, fehler);
    ladeLauf = { stopp: false };
    const lauf = ladeLauf;
    const arbeiter = async () => { while (offen.length && !lauf.stopp) { const u = offen.shift(); try { const r = await fetch(u, { cache: "no-cache" }); if (!r.ok) throw 0; await c.put(new URL(u, location.href).pathname, r); } catch (e) { fehler++; } fertig++; aufFortschritt(fertig, urls.length, fehler); } };
    await Promise.all([1, 2, 3, 4, 5, 6].map(arbeiter));
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* egal */ }
    return { fertig, gesamt: urls.length, fehler };
  }
  async function offlineSeite() {
    const alle = alleBildUrls(false).length, haupt = alleBildUrls(true).length;
    const da = swDa ? await gespeicherteBilder() : 0;
    let platz = "";
    try { const est = await navigator.storage.estimate(); platz = "Speicher belegt: ca. " + Math.round((est.usage || 0) / 1048576) + " MB"; } catch (e) { /* egal */ }
    seite('<h2 class="hand">Das Waldbuch mitnehmen</h2><div class="notiz">Im Wald gibt es selten Netz. Darum kannst du dir das ganze Buch aufs Handy legen: Texte, Bestimmungshilfe, Lernkiste und Rex\' Spürnase funktionieren dann ohne Internet. Die Fotos lädst du einmal herunter – danach ist alles da, auch mitten im Bayerischen Wald.<span class="unterschrift">– Friedrich</span></div>' +
      (swDa ? '<h3 class="hand">1. Fotos herunterladen</h3><p>Gespeichert: <b id="off-zahl">' + da + "</b> von " + alle + ' Fotos. <span class="leise">' + platz + '</span></p><div class="offline-fort"><i id="off-balken" style="width:' + Math.round(da / alle * 100) + '%"></i></div><p class="leise" id="off-text"></p>' +
        '<div class="reihe"><button class="knopf" data-l="alle">📥 Alle Fotos (' + alle + ', ca. 85 MB)</button><button class="knopf hell" data-l="haupt">Nur Titelbilder (' + haupt + ', ca. 18 MB)</button><button class="knopf hell klein" data-l="stopp">Anhalten</button><button class="knopf hell klein" data-l="weg">Fotos wieder löschen</button></div><p class="leise">Am besten im WLAN. Texte und Programm sind schon gespeichert, sobald du das Waldbuch einmal geöffnet hast. Fotos, die du dir online ansiehst, werden ebenfalls mitgespeichert.</p>' +
        '<h3 class="hand">2. Als App auf den Startbildschirm</h3><p>Dann öffnet sich das Waldbuch wie eine eigene App – mit Rex als Symbol.</p><div class="reihe"><button class="knopf" id="installieren">📲 Waldbuch installieren</button></div><p class="leise" id="inst-text">Falls der Knopf nichts tut: In Chrome auf Android oben rechts im Menü (⋮) „Zum Startbildschirm hinzufügen“ bzw. „App installieren“ wählen. Auf dem iPhone in Safari über „Teilen“ → „Zum Home-Bildschirm“.</p>'
        : '<div class="warnung">Dein Browser unterstützt keinen Offline-Speicher. Öffne das Waldbuch in Chrome, Firefox, Edge oder Safari über imrestales.de.</div>'));
    if (!swDa) return;
    const s = $("#seite");
    const zeig = (f, g, fe) => { const z = $("#off-zahl"); if (!z) return; $("#off-balken").style.width = Math.round(f / g * 100) + "%"; $("#off-text").textContent = f + " / " + g + (fe ? " · " + fe + " Fehler (später erneut versuchen)" : ""); };
    s.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", async () => {
      const w = b.dataset.l;
      if (w === "stopp") { if (ladeLauf) ladeLauf.stopp = true; return; }
      if (w === "weg") { await caches.delete("waldbuch-bilder-v1"); toast("Fotos gelöscht."); offlineSeite(); return; }
      s.querySelectorAll("[data-l=alle],[data-l=haupt]").forEach(x => x.disabled = true);
      const r = await ladeOffline(w === "haupt", zeig);
      $("#off-zahl") && ($("#off-zahl").textContent = await gespeicherteBilder());
      toast(r.fehler ? "Fertig – " + r.fehler + " Fotos fehlen noch." : "Fertig! Das Waldbuch ist offline bereit.");
      s.querySelectorAll("[data-l=alle],[data-l=haupt]").forEach(x => x.disabled = false);
    }));
    $("#installieren").addEventListener("click", async () => { if (installEreignis) { installEreignis.prompt(); installEreignis = null; } else $("#inst-text").style.fontWeight = "700"; });
  }

  /* ---------- Suche & Nachweise ---------- */
  function suchSeite(text) {
    const t = norm(text);
    const direkt = ARTEN.filter(a => norm(a.de).includes(t) || norm(a.wiss).includes(t));
    const { liste } = bestimme(text, [], null);
    const rest = liste.map(x => x.a).filter(a => !direkt.includes(a));
    seite('<h2 class="hand">Gesucht: „' + esc(text) + '“</h2>' + (direkt.length ? '<div class="gitter">' + direkt.map(klebe).join("") + "</div>" : '<p class="leise">Kein Name passt genau.</p>') + (rest.length ? '<h3 class="hand">Passt vielleicht auch</h3><div class="gitter">' + rest.slice(0, 12).map(klebe).join("") + "</div>" : "") + '<p><a href="#/bestimmen">Lieber nach Merkmalen bestimmen →</a></p>');
  }
  function nachweisSeite() {
    seite('<h2 class="hand">Bildnachweise</h2><p>Alle Fotos stammen von Wikimedia Commons und stehen unter freien Lizenzen. Danke an alle Fotografinnen und Fotografen! Die Bilder wurden verkleinert.</p><div class="liste-nachweis">' +
      ARTEN.filter(a => bilderVon(a.id).length).map(a => "<p><b>" + esc(a.de) + "</b><br>" + bilderVon(a.id).map(b => esc(ASPEKT[b.a] || "") + ": " + esc(b.autor) + ', <a href="' + esc(b.lizenzurl || b.quelle) + '" target="_blank" rel="noopener">' + esc(b.lizenz) + '</a>, <a href="' + esc(b.quelle) + '" target="_blank" rel="noopener">Quelle</a>').join("<br>") + "</p>").join("") + "</div>");
  }

  /* ---------- Router ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [teil, arg] = h.split("/");
    if (window.WB_SPIEL && teil !== "spiel") window.WB_SPIEL.stopp();
    if (teil === "kapitel") { register("kapitel/" + arg); kapFilter = "alle"; kapitel(arg); }
    else if (teil === "art") { const a = ART[arg]; register(a ? "kapitel/" + a.kap : ""); artSeite(arg); }
    else if (teil === "bestimmen") { register("bestimmen"); bestimmenSeite(); }
    else if (teil === "jetzt") { register("jetzt"); jetztSeite(); }
    else if (teil === "doppelgaenger") { register("doppelgaenger"); doppelSeite(); }
    else if (teil === "lernen") { register("lernen"); lernSeite(); }
    else if (teil === "spiel") { register("spiel"); if (window.WB_SPIEL) window.WB_SPIEL.start($("#seite")); }
    else if (teil === "nachweise") { register(""); nachweisSeite(); }
    else if (teil === "offline") { register("offline"); offlineSeite(); }
    else if (teil === "suche") { register(""); suchSeite(h.slice(6)); }
    else if (window.WB_MEHR && WB_MEHR.seiten[teil]) { register(teil); WB_MEHR.seiten[teil](arg); }
    else { register(""); deckblatt(); }
  }
  $("#suche-mini").addEventListener("submit", e => { e.preventDefault(); const v = $("#suchfeld").value.trim(); if (v) location.hash = "#/suche/" + encodeURIComponent(v); });
  window.addEventListener("hashchange", route);

  /* ---------- Öffentliche Schnittstelle fürs Spiel ---------- */
  window.WB = { ARTEN, ART, KAPITEL, MONATE, heuteMonat, bilderVon, hauptbild, bildFuer, bildHtml, spurSvg, frageBauen, frageHtml, falsche, bildLupe, lupenListe, fotoKarussell, raetselBild, bildwahlLupe, STAND, speichern, Ton, esc, toast, bestimme, seite, route, register };

  fetch("pflanzen/bilder.json").then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { BILDER = j || {}; route(); });
})();
