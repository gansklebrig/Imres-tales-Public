/* Ezekiel – The Destroyer · W28 Lager: Die Lagerwelt wächst mit
   - Jahreszeiten: Mit dem Fortschritt (Läufe, Trophäen, Enden, abgeschlossene Auftragsketten) zieht das Jahr übers Lager:
     Spätherbst → Winter (Schnee, warm-weiß) → Frühling → Sommer → Herbst → Winter … Je Besuch eigenes Wetter der Jahreszeit
     (Laubfall, Nebel, Schneefall, Blüten, Nieselregen, Glühwürmchen). Boden, Dächer der Welt und Licht färben sich mit.
   - Trophäen: Jeder besiegte Boss/Wächter hinterlässt eine eigene gemalte Trophäe an passender Stelle
     (Bugbear-Schädel bei Friedrich, Drachenzahn bei Echo, Drachenschädel an der Schmiede …) mit Tafel beim Nähertreten.
   - Das Feuer wächst mit der Lagerstufe (Steinkreis → Sitzbalken → hohe Flammen und Funkenflug).
   - Spuren der Auftragsketten (auftraege.js): Friedrichs Jagdtrophäe, Echos Garten, Barradins Balladen-Banner,
     Nundros zweiter Amboss, Eddas große Karte, Rex' Hütte.
   Alles ab Grafikstufe 1 aufwendig (Partikel, Schein); Stufe 0 / Handheld billig (wenige Flocken, kein Schein, vorgemalte Bilder).
   Speicher: Z.meta.lagerwelt (je Spielstand: zuletzt gesehene Jahreszeit, gesehene Trophäen/Spuren). Farben: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, L = v => Z.L(v), A = Z.audio, FX = Z.fx;
  const { limb, circ, poly, ell, glow } = Z.draw;
  const TAU = Math.PI * 2;
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const M = () => Z.meta;
  const ui = () => Z.ui || {};
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ======================= SPEICHER ======================= */
  function LW() {
    const m = M(); let s = m.lagerwelt;
    if (!s || typeof s !== "object" || Array.isArray(s)) s = m.lagerwelt = {};
    if (typeof s.season !== "string") s.season = "";
    if (!s.troph || typeof s.troph !== "object" || Array.isArray(s.troph)) s.troph = {};
    if (!s.spur || typeof s.spur !== "object" || Array.isArray(s.spur)) s.spur = {};
    return s;
  }

  /* ======================= JAHRESZEITEN ======================= */
  const SEASONS = {
    spaetherbst: { n: ["Spätherbst", "Late autumn"], d: ["Die letzten Blätter fallen. Am Feuer rückt man zusammen.", "The last leaves fall. By the fire, people move closer."], wx: [["laub", 3], ["nebel", 2], ["klar", 1]], tint: "rgba(190,110,60,.06)" },
    winter: { n: ["Winter", "Winter"], d: ["Schnee liegt auf den Zelten. Rex frisst ihn.", "Snow lies on the tents. Rex eats it."], wx: [["schnee", 3], ["flocken", 2], ["frost", 1]], tint: "rgba(255,236,222,.07)" },
    fruehling: { n: ["Frühling", "Spring"], d: ["Echo summt. Zwischen den Steinen wächst Grün.", "Echo hums. Green grows between the stones."], wx: [["blueten", 3], ["niesel", 2], ["klar", 1]], tint: "rgba(255,190,210,.05)" },
    sommer: { n: ["Sommer", "Summer"], d: ["Warme Nächte. Glühwürmchen tanzen um Barradins Bühne.", "Warm nights. Fireflies dance around Barradin's stage."], wx: [["gluehen", 3], ["klar", 2], ["schwuel", 1]], tint: "rgba(255,190,110,.05)" },
    herbst: { n: ["Herbst", "Autumn"], d: ["Wind zerrt an den Bannern. Laub in jeder Ritze.", "Wind tugs at the banners. Leaves in every crack."], wx: [["laub", 2], ["sturm", 2], ["nebel", 1]], tint: "rgba(200,120,50,.06)" }
  };
  const ORDER0 = ["spaetherbst", "winter", "fruehling", "sommer", "herbst"], CYCLE = ["winter", "fruehling", "sommer", "herbst"];
  const AT = [0, 4, 12, 22, 34], STEP = 10;
  const WXN = { laub: ["Laubfall", "Falling leaves"], nebel: ["Nebel über dem Lager", "Fog over the camp"], klar: null, schnee: ["Schneefall", "Snowfall"], flocken: ["Leiser Schnee", "Soft snow"], frost: ["Klirrender Frost", "Biting frost"],
    blueten: ["Blütenwind", "Blossom wind"], niesel: ["Nieselregen", "Drizzle"], gluehen: ["Glühwürmchen", "Fireflies"], schwuel: ["Schwüle Nacht", "Sultry night"], sturm: ["Herbststurm", "Autumn gale"] };
  function trophyIds() { return Object.keys(Z.BOSSDEF || {}).filter(id => id !== "nezna" && !Z.BOSSDEF[id].minion); }
  const won = id => !!((M().bosses || {})[id] && M().bosses[id].won > 0);
  function chainsDone() { const C = Z.auftr && Z.auftr.CHAINS; return C ? Object.keys(C).filter(k => Z.auftr.chainDone(k)) : []; }
  function score() { const m = M(); return (m.runs || 0) + 2 * trophyIds().filter(won).length + 3 * Object.keys(m.endings || {}).length + 2 * chainsDone().length; }
  function seasonOf(sc) {
    let i = 0; for (let k = 0; k < AT.length; k++) if (sc >= AT[k]) i = k;
    if (sc < AT[AT.length - 1] + STEP) return ORDER0[i];
    return CYCLE[Math.floor((sc - AT[AT.length - 1]) / STEP) % CYCLE.length];
  }
  let force = null;
  const season = () => force || seasonOf(score());
  function weatherOf(se, seed) {
    const wx = SEASONS[se].wx, tot = wx.reduce((a, b) => a + b[1], 0); let r = hash(seed, 77) * tot;
    for (const [k, w] of wx) { if ((r -= w) < 0) return k; } return wx[0][0];
  }

  /* ======================= LAGERBESUCH ======================= */
  let W = null; /* { lv, se, wx, surf:[{x0,x1,y}], parts:[], troph:[], spur:[], t } */
  function setup(lv) {
    const s = LW(), se = season(), visits = (M().lager && M().lager.visits) | 0;
    const wx = forceWx || weatherOf(se, visits * 13 + (M().runs || 0));
    W = { lv, se, wx, surf: surfaces(lv), parts: [], troph: [], spur: [], t: 0, gust: 0, plaqueA: {} };
    placeTrophies(lv); placeSpuren(lv);
    const neu = s.season !== se, first = !s.season;
    s.season = se;
    const newT = W.troph.filter(o => !s.troph[o.id]), newS = W.spur.filter(o => !s.spur[o.id]);
    for (const o of W.troph) s.troph[o.id] = 1; for (const o of W.spur) s.spur[o.id] = 1;
    try { Z.saveMeta && Z.saveMeta(); } catch (_) {}
    const u = ui();
    setTimeout(() => {
      if (!W || W.lv !== lv || Z.level !== lv) return;
      if (neu && !first && u.banner) u.banner(L(["Im Lager wird es ", "At camp it turns "]) + L(SEASONS[se].n), L(SEASONS[se].d), 4200);
      const nt = newT.length ? newT.map(o => L(TROPHY[o.id].who)).filter(Boolean) : [];
      if (newT.length && u.notify) { try { u.notify("🏆 <b>" + (newT.length === 1 ? esc(L(TROPHY[newT[0].id].hung)) : L(["Neue Trophäen im Lager: ", "New trophies at camp: "]) + newT.length) + "</b><br><small>" + L(["Tritt näher, um die Tafel zu lesen.", "Step closer to read the plaque."]) + "</small>", { prio: 2, art: "gold", dauer: 4200 }); } catch (_) {} }
      if (newS.length && u.notify) { try { u.notify("🏕 <b>" + esc(L(SPUR[newS[0].id].n)) + "</b><br><small>" + esc(L(SPUR[newS[0].id].d)) + "</small>", { prio: 2, art: "gold", dauer: 4600 }); } catch (_) {} }
      void nt;
    }, neu ? 4600 : 2600);
  }
  /* Oberflächen: Kacheloberkanten (fest oder Steg), auf denen Schnee, Laub und Blumen liegen */
  function surfaces(lv) {
    const out = [], solid = g => g === 1 || g === 7, plat = g => g === 2;
    for (let y = 2; y < lv.H; y++) {
      let run = null;
      for (let x = 0; x < lv.W; x++) {
        const g = lv.get(x, y), up = lv.get(x, y - 1);
        const ok = (solid(g) || plat(g)) && !solid(up) && !plat(up);
        if (ok) { if (!run) run = { x0: x, x1: x, y, plat: plat(g) }; else run.x1 = x; }
        else if (run) { out.push(run); run = null; }
      }
      if (run) out.push(run);
    }
    return out;
  }
  const propX = (lv, id) => { const p = (lv.props || []).find(q => q.id === id); return p ? p.x + 0.5 : null; };
  const G0 = () => 12 * T;
  /* Pfosten des Trophäenbalkens (lager.js lcore.beam): darunter liegt der Waffenständer – dort nur erhöht (lift) anbringen */
  const postX = (lv, i) => (lv.lcore && lv.lcore.beam ? (i ? lv.lcore.beam[1] - 0.4 : lv.lcore.beam[0] + 0.2) : propX(lv, "C") + 3 + i * 4);

  /* ======================= TROPHÄEN ======================= */
  /* at(lv) → Kachel-x; who: wer sie aufgehängt hat; hung: Meldung; Bild: draw(c) mit Ursprung unten Mitte (Boden), Größe w×h */
  const TROPHY = {
    bugbear: { at: lv => propX(lv, "G") - 2.2, w: 26, h: 44, who: ["Friedrich", "Friedrich"], hung: ["Friedrich hat den Schädel des Bugbears aufgehängt.", "Friedrich has hung up the Bugbear's skull."], draw: drawBugbear },
    venomfang: { at: lv => propX(lv, "Y") + 4.4, w: 30, h: 20, who: ["Echo", "Echo"], hung: ["Echo bewacht jetzt Venomfangs Giftzahn. Und verlangt Eintritt.", "Echo now guards Venomfang's fang. And charges admission."], draw: drawVenom },
    themberchaud: { at: lv => propX(lv, "A") + 2.6, w: 44, h: 22, who: ["Nundro", "Nundro"], hung: ["Themberchauds Schädel liegt jetzt an Nundros Schmiede. Er wärmt seine Füße daran.", "Themberchaud's skull now lies by Nundro's forge. He warms his feet on it."], draw: drawThember },
    schmiedewaechter: { at: lv => propX(lv, "A") - 2, w: 22, h: 30, who: ["Nundro", "Nundro"], hung: ["Der Runenhammer des Schmiedewächters lehnt an Nundros Amboss.", "The Forge Warden's rune hammer leans against Nundro's anvil."], draw: drawHammer },
    glasstab: { at: lv => propX(lv, "Y") + 2.2, w: 16, h: 40, who: ["Quirin", "Quirin"], hung: ["Der Glasstab steht jetzt neben der Trainingspuppe. Quirin will ihn untersuchen.", "The glass staff now stands beside the training dummy. Quirin wants to study it."], draw: drawGlass },
    erzpriesterin: { at: lv => propX(lv, "C") + 1.4, w: 20, h: 40, who: ["Sigrun", "Sigrun"], hung: ["Die Maske der falschen Erzpriesterin hängt am Schädelaltar.", "The false archpriestess's mask hangs at the skull altar."], draw: drawMask },
    wraith: { at: lv => (lv.lcore ? lv.lcore.stone + 2.3 : propX(lv, "E") + 4), w: 24, h: 46, who: ["Alwin", "Alwin"], hung: ["Im Käfig am Gedenkstein flackert, was vom Wraith übrig ist.", "In the cage by the memorial stone flickers what remains of the Wraith."], draw: drawWraith },
    chasme: { at: lv => postX(lv, 0), lift: 42, w: 32, h: 34, who: ["Lotte", "Lotte"], hung: ["Die Flügel der Chasme sind neben die Steckbriefe genagelt.", "The Chasme's wings are nailed up beside the wanted posters."], draw: drawWings },
    ilvaraW: { at: lv => postX(lv, 1), lift: 40, w: 20, h: 40, who: ["Mira", "Mira"], hung: ["Ilvaras Banner weht verkehrt herum – als Zeichen, dass sie fiel.", "Ilvara's banner flies upside down – a sign that she fell."], draw: drawDrow },
    riese: { at: lv => propX(lv, "Y") - 5, w: 30, h: 34, who: ["Friedrich", "Friedrich"], hung: ["Die Keule des rasenden Riesen lehnt am Trophäenbalken. Keiner kann sie heben.", "The raging giant's club leans against the trophy beam. Nobody can lift it."], draw: drawClub },
    vrock: { at: lv => propX(lv, "B") - 2.2, w: 20, h: 46, who: ["Barradin", "Barradin"], hung: ["Barradin trägt jetzt eine Vrock-Feder am Hut. Den Rest hat er an einen Pfahl gesteckt.", "Barradin now wears a vrock feather in his hat. The rest he stuck on a pole."], draw: drawVrock },
    demogorgon: { at: lv => propX(lv, "Y") - 2.4, w: 28, h: 52, who: ["Sigrun", "Sigrun"], hung: ["Ein Totem aus Demogorgons Masken steht am Rand des Lagers. Sigrun hat es mit Runen gebunden.", "A totem of Demogorgon's masks stands at the edge of camp. Sigrun has bound it with runes."], draw: drawDemo },
    weberin: { at: lv => (lv.lcore && lv.lcore.beam ? (lv.lcore.beam[0] + lv.lcore.beam[1]) / 2 + 2.6 : propX(lv, "C") + 4), lift: 34, w: 24, h: 50, who: ["Mira", "Mira"], hung: ["Mira hat den Kokon der Weberin aufgehängt. Leer. Endlich leer.", "Mira has hung up the Weaver's cocoon. Empty. Finally empty."], draw: drawWeberin }
  };
  function placeTrophies(lv) {
    const list = [];
    for (const id of trophyIds()) {
      if (!won(id) || !TROPHY[id]) continue;
      let x = null; try { x = TROPHY[id].at(lv); } catch (_) {}
      if (x == null || !isFinite(x)) continue;
      const D = TROPHY[id], lift = D.liftF ? D.liftF(lv) : D.lift || 0;
      list.push({ id, x: x * T, y: G0() - lift, lift });
    }
    /* nicht übereinander: am Boden von links nach rechts mindestens 26 px Abstand (erhöhte hängen frei) */
    const gr = list.filter(o => !o.lift).sort((a, b) => a.x - b.x);
    for (let i = 1; i < gr.length; i++) if (gr[i].x - gr[i - 1].x < 26) gr[i].x = gr[i - 1].x + 26;
    W.troph = list;
  }
  /* Bild-Zwischenspeicher je Trophäe/Spur (k = Auflösung: Handheld 2, sonst 3) */
  const SPR = new Map();
  (Z._cachesNeu = Z._cachesNeu || []).push(() => SPR.clear());
  function sprite(key, w, h, fn) {
    const k = lo() ? 2 : 3, id = key + "@" + k; let s = SPR.get(id); if (s) return s;
    const cv = document.createElement("canvas"); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k);
    const c = cv.getContext("2d"); c.scale(k, k); c.translate(w / 2, h);
    try { fn(c, w, h); } catch (err) { console.error(err); }
    s = { cv, w, h }; if (SPR.size > 80) SPR.clear(); SPR.set(id, s); return s;
  }
  const put = (c, s, x, y) => c.drawImage(s.cv, x - s.w / 2, y - s.h, s.w, s.h);
  /* --- gemalte Trophäen (Ursprung: unten Mitte) --- */
  function post(c, x, h, col) { c.fillStyle = col || "#4a3220"; c.fillRect(x - 1.3, -h, 2.6, h); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + 0.4, -h, 0.9, h); }
  function drawBugbear(c) {
    post(c, 0, 40); limb(c, -9, -36, 9, -36, 1.6, "#5e3c24");
    /* Fell */ poly(c, [-9, -36, 9, -36, 8, -22, 4, -18, -4, -19, -8, -23], "#6a4a2a"); for (let i = 0; i < 6; i++) limb(c, -8 + i * 3.2, -22, -8.6 + i * 3.2, -17 - (i % 2) * 2, 1, "#5a3a20");
    /* Schädel */ ell(c, 0, -30, 6.5, 5.6, "#e8dcc8"); poly(c, [-5, -27, 5, -27, 4, -22, -4, -22], "#d8ccb4");
    ell(c, -2.6, -30.5, 1.7, 1.5, "#2a1a14"); ell(c, 2.6, -30.5, 1.7, 1.5, "#2a1a14"); poly(c, [-0.8, -27.6, 0.8, -27.6, 0, -26], "#3a2a20");
    for (let i = -3; i <= 3; i += 1.5) { c.fillStyle = "#f4ecdc"; c.fillRect(i - 0.5, -23.6, 1, 1.6); }
    poly(c, [-6, -33, -9, -38, -5, -35], "#c8b898"); poly(c, [6, -33, 9, -38, 5, -35], "#c8b898");
    /* Morgenstern an der Kette */ limb(c, 7, -36, 9, -14, 0.5, "#6a6460"); circ(c, 9, -12, 3, "#5a5450"); for (let a = 0; a < 6; a++) limb(c, 9, -12, 9 + Math.cos(a) * 4.6, -12 + Math.sin(a) * 4.6, 0.8, "#8a8480");
    c.fillStyle = "#3a2418"; c.fillRect(-12, -1.6, 24, 1.6);
  }
  function drawVenom(c) {
    poly(c, [-14, 0, -11, -6, -3, -8, 6, -7, 13, -3, 14, 0], "#5a5250"); poly(c, [-14, 0, -11, -6, -3, -8, -2, 0], "#4a4442");
    /* Zahn */ c.fillStyle = "#efe6d0"; c.beginPath(); c.moveTo(-6, -7); c.quadraticCurveTo(-4, -20, 8, -19); c.quadraticCurveTo(0, -16, 0, -7); c.fill();
    c.fillStyle = "#c8bca0"; c.beginPath(); c.moveTo(-2, -7); c.quadraticCurveTo(-1, -14, 7, -18.6); c.quadraticCurveTo(0, -15, 0, -7); c.fill();
    c.fillStyle = "#6a9a3a"; c.beginPath(); c.moveTo(5, -18.4); c.lineTo(8.4, -19.2); c.lineTo(6, -17); c.fill();
    /* Schuppen */ for (let i = 0; i < 5; i++) { const x = -10 + i * 5, y = -2 - (i % 2) * 2; poly(c, [x, y, x + 2.4, y - 2.4, x + 4.8, y, x + 2.4, y + 1.6], i % 2 ? "#3a6a2a" : "#5a8a3a"); }
    circ(c, 9, -1.4, 1, "#9ad04a");
  }
  function drawThember(c) {
    /* langer Drachenschädel am Boden */
    poly(c, [-21, 0, -20, -8, -12, -14, 0, -15, 10, -12, 20, -6, 22, -2, 20, 0], "#d8c8b0");
    poly(c, [-21, 0, -20, -8, -12, -14, -10, -10, -14, -4, -12, 0], "#b8a890");
    poly(c, [4, -6, 20, -5, 22, -2, 20, 0, 4, 0], "#c8b8a0");
    for (let i = 0; i < 6; i++) { c.fillStyle = "#f0e8d8"; c.beginPath(); c.moveTo(6 + i * 2.4, -5); c.lineTo(7 + i * 2.4, -2.4); c.lineTo(8 + i * 2.4, -5); c.fill(); }
    ell(c, -2, -9.5, 3.4, 2.4, "#2a1410"); circ(c, -2, -9.5, 1.2, "#ff7a2a");
    /* Hörner */ c.fillStyle = "#a89070"; c.beginPath(); c.moveTo(-10, -13); c.quadraticCurveTo(-18, -24, -24, -20); c.quadraticCurveTo(-18, -20, -13, -10); c.fill();
    c.beginPath(); c.moveTo(-4, -14.6); c.quadraticCurveTo(-8, -26, -14, -25); c.quadraticCurveTo(-8, -22, -7, -13); c.fill();
    for (let i = 0; i < 4; i++) poly(c, [-16 + i * 9, 0, -14 + i * 9, -3, -12 + i * 9, 0], "#a0301a");
  }
  function drawHammer(c) {
    poly(c, [-10, 0, -10, -6, 6, -6, 6, 0], "#5a5450"); c.fillStyle = "#6e6862"; c.fillRect(-10, -6, 16, 1.4);
    limb(c, -4, -5, 6, -27, 2, "#4a3a2e");
    poly(c, [1, -24, 11, -29, 14, -22, 4, -17], "#6a6460"); poly(c, [1, -24, 4, -17, 3, -16, 0, -23], "#4a4440");
    c.fillStyle = "#ff8a3a"; c.fillRect(6, -24.6, 1, 3); c.fillRect(8.4, -25.4, 1, 3.4); limb(c, 5.5, -21.4, 9.6, -23.2, 0.6, "#ffb060");
  }
  function drawGlass(c) {
    poly(c, [-6, 0, -4, -3, 4, -3, 6, 0], "#4a3220"); limb(c, 0, -3, 0, -32, 1.4, "#8a7a6a");
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5, r = 6 + (i % 2) * 2; poly(c, [0, -32, Math.cos(a - 0.15) * r, -32 + Math.sin(a - 0.15) * r, Math.cos(a) * (r + 2), -32 + Math.sin(a) * (r + 2), Math.cos(a + 0.15) * r, -32 + Math.sin(a + 0.15) * r], i % 2 ? "rgba(232,208,240,.85)" : "rgba(255,220,235,.8)"); }
    circ(c, 0, -32, 2.2, "#f4e4f0"); circ(c, -0.6, -32.6, 0.8, "#fff");
    poly(c, [-5, -1, -3, -2.5, -2, -0.5], "rgba(232,208,240,.8)"); poly(c, [3, -0.6, 4.6, -2.4, 5.4, -0.4], "rgba(255,220,235,.8)");
  }
  function drawMask(c) {
    post(c, 0, 38, "#3a2418");
    /* rote Bänder */ for (let i = 0; i < 3; i++) limb(c, -3 + i * 3, -33, -5 + i * 3.6, -16 + (i % 2) * 3, 0.9, i === 1 ? "#c8402a" : "#8a1a1a");
    /* goldene Maske, gesprungen */ ell(c, 0, -30, 7, 8.4, "#e5b454"); ell(c, -1.4, -31, 5, 6.6, "#f0c870");
    ell(c, -2.6, -31, 1.8, 1.2, "#2a1408"); ell(c, 2.6, -31, 1.8, 1.2, "#2a1408"); limb(c, -2, -26, 2, -26, 0.8, "#8a5a1a");
    c.strokeStyle = "#5a3408"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(1, -38); c.lineTo(2.4, -33); c.lineTo(0.4, -29); c.lineTo(2, -24); c.stroke();
    poly(c, [-5, -37, 0, -42, 5, -37], "#c8902a");
  }
  function drawWraith(c) {
    /* krummer Galgen */ post(c, -6, 44); limb(c, -6, -44, 6, -42, 1.6, "#4a3220"); limb(c, 6, -42, 6, -38, 0.5, "#6a6460");
    /* Käfig */ c.strokeStyle = "#5a5450"; c.lineWidth = 0.7; for (let i = -1; i <= 1; i += 0.5) { c.beginPath(); c.moveTo(6 + i * 4, -36); c.quadraticCurveTo(6 + i * 5.4, -28, 6 + i * 4, -20); c.stroke(); }
    ell(c, 6, -36.4, 4.4, 1.4, "#4a4440"); ell(c, 6, -19.6, 4.4, 1.4, "#4a4440");
    /* Geisterlicht */ ell(c, 6, -28, 2.6, 4.4, "rgba(240,220,240,.75)"); ell(c, 6, -29, 1.4, 2.4, "#fff8f4"); circ(c, 5.2, -29.6, 0.5, "#3a1a3a"); circ(c, 6.8, -29.6, 0.5, "#3a1a3a");
  }
  function drawWings(c) {
    /* Rahmen */ c.fillStyle = "#4a3220"; c.fillRect(-15, -32, 30, 2); c.fillRect(-15, -32, 2, 32); c.fillRect(13, -32, 2, 32);
    const wing = (s) => { c.save(); c.scale(s, 1); c.fillStyle = "rgba(200,150,80,.55)"; c.beginPath(); c.moveTo(0, -24); c.quadraticCurveTo(10, -32, 13, -20); c.quadraticCurveTo(10, -10, 2, -16); c.closePath(); c.fill();
      c.strokeStyle = "rgba(90,50,20,.8)"; c.lineWidth = 0.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0.6, -22 + i); c.quadraticCurveTo(6, -26 + i * 2.6, 12 - i * 1.6, -21 + i * 2.6); c.stroke(); } c.restore(); };
    wing(1); wing(-1); ell(c, 0, -20, 1.6, 4.6, "#3a2a1a"); circ(c, 0, -26, 1.8, "#4a2a1a"); circ(c, -0.8, -26.4, 0.7, "#c03a2a"); circ(c, 0.8, -26.4, 0.7, "#c03a2a");
    for (const x of [-12, 12]) circ(c, x, -24, 0.7, "#8a8480");
  }
  function drawDrow(c) {
    /* am Pfosten befestigt: Querholz, Banner kopfüber, darüber die eingerollte Peitsche */
    limb(c, -9, -38, 9, -38, 1.2, "#2a1a1a"); c.fillStyle = "#6a6460"; c.fillRect(-9.6, -39.4, 1.6, 2.8);
    poly(c, [-6, -37, 6, -37, 6, -14, 0, -18, -6, -14], "#3a1a3a"); poly(c, [-6, -37, -3, -37, -3, -16, -6, -14], "#2a102a");
    c.fillStyle = "#c03a5a"; c.fillRect(-6, -37, 12, 0.8);
    circ(c, 0, -27, 2, "#c03a5a"); for (let i = 0; i < 4; i++) { limb(c, 0, -27, -3.4 + (i % 2) * 6.8, -30 + i * 2, 0.5, "#c03a5a"); }
    c.strokeStyle = "#4a2a3a"; c.lineWidth = 0.9; c.beginPath(); c.arc(7, -34, 2.6, 0, TAU); c.stroke(); c.beginPath(); c.arc(7, -34, 1.4, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(9.4, -33); c.quadraticCurveTo(10, -26, 8, -20); c.stroke(); c.fillStyle = "#6a3a4a"; c.fillRect(5.6, -38, 2.6, 2);
  }
  function drawClub(c) {
    poly(c, [-14, 0, -12, -7, -2, -9, 6, -5, 8, 0], "#5a5250");
    c.save(); c.translate(4, -6); c.rotate(-0.55); poly(c, [-2.6, 0, 2.6, 0, 6, -28, -6, -28], "#6a4a2e"); poly(c, [-2.6, 0, 0, 0, -1, -28, -6, -28], "#5a3a22");
    for (const y of [-9, -19]) { c.fillStyle = "#6a6460"; c.fillRect(-5, y, 10.4, 2); }
    for (const [x, y] of [[-5, -24], [5, -22], [-5.4, -14], [5, -12]]) poly(c, [x, y, x + Math.sign(x) * 3, y - 1, x, y - 2], "#8a8480");
    c.restore();
  }
  function drawVrock(c) {
    post(c, 0, 40, "#3a2418");
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32; c.save(); c.translate(0, -38); c.rotate(a + Math.PI / 2); poly(c, [-1.6, 0, 0, -11 - (i % 2) * 2, 1.6, 0], i % 2 ? "#4a3a3a" : "#6a5450"); c.restore(); }
    /* Geierschädel */ ell(c, 0, -36, 3.4, 3, "#d8ccb8"); poly(c, [2.4, -37, 7, -35.4, 3, -34], "#8a2a2a"); circ(c, -0.6, -36.6, 0.9, "#2a1410");
    for (let i = 0; i < 3; i++) limb(c, -1, -26 + i * 4, 3, -24 + i * 4, 0.8, "#8a2a2a");
  }
  function drawDemo(c) {
    post(c, 0, 50, "#3a2430"); c.fillStyle = "#2a1a24"; c.fillRect(-4, -50, 8, 3);
    const mask = (y, col, sh) => { ell(c, 0, y, 7, 6, col); ell(c, 0, y + 2.6, 4.6, 3, sh); circ(c, -2.6, y - 1.4, 1.3, "#ffb060"); circ(c, 2.6, y - 1.4, 1.3, "#ffb060"); c.fillStyle = "#1a0a14"; c.fillRect(-2.4, y + 2, 4.8, 1.2); for (let i = -2; i <= 2; i += 1.3) poly(c, [i, y + 2, i + 0.6, y + 3.6, i + 1.2, y + 2], "#f0e0d0"); };
    mask(-41, "#7a3a5a", "#5a2a44"); mask(-27, "#a04a6a", "#7a3a52");
    /* Tentakel */ c.strokeStyle = "#6a2a4a"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-1, -18); c.bezierCurveTo(-9, -14, 8, -9, -2, -3); c.stroke(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(1, -20); c.bezierCurveTo(8, -16, -6, -10, 4, -2); c.stroke();
    /* Runen */ c.fillStyle = "#e5b454"; c.fillRect(-0.4, -14, 0.8, 3); c.fillRect(-1.6, -13, 3.2, 0.7);
  }
  function drawWeberin(c) {
    /* hängt an einem Seidenfaden vom Trophäenbalken: leerer Kokon, Netzreste */
    limb(c, 0, -50, 0, -41, 0.5, "#e8e0d8");
    c.strokeStyle = "rgba(232,224,216,.5)"; c.lineWidth = 0.35; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, -48); c.lineTo(-9 + i * 6, -40 + (i % 2) * 3); c.stroke(); }
    ell(c, 0, -28, 5, 11, "#e8e0d8"); ell(c, 1.4, -27, 3, 9, "#d8d0c8"); for (let i = 0; i < 7; i++) limb(c, -4.6, -36 + i * 2.6, 4.6, -34 + i * 2.6, 0.4, "#c8c0b8");
    c.fillStyle = "#2a1420"; c.beginPath(); c.ellipse(0, -22, 1.6, 3, 0, 0, TAU); c.fill(); /* aufgerissen, leer */
    poly(c, [-1.6, -32, 0, -35, 1.6, -32, 0, -29], "#c03a5a");
    limb(c, -2, -17.4, -3, -12, 0.4, "rgba(232,224,216,.7)"); limb(c, 2, -17.4, 3.4, -13, 0.4, "rgba(232,224,216,.7)");
  }

  /* ======================= SPUREN DER AUFTRAGSKETTEN ======================= */
  const SPUR = {
    jagd: { n: ["Friedrichs Jagdtrophäe", "Friedrich's hunting trophy"], d: ["Ein Geweih und ein Wolfsfell zieren jetzt Friedrichs Platz.", "Antlers and a wolf pelt now adorn Friedrich's spot."], at: lv => propX(lv, "G") + 1.6, w: 30, h: 46, draw: drawJagd },
    garten: { n: ["Echos Garten", "Echo's garden"], d: ["Zwischen Feuer und Gedenkstein blüht ein kleines Beet. Gießen kostet nichts. Noch.", "A little bed blooms between the fire and the memorial stone. Watering is free. For now."], at: lv => propX(lv, "E"), w: 34, h: 24, draw: drawGarten, live: liveGarten },
    ballade: { n: ["Barradins Balladen-Banner", "Barradin's ballad banner"], d: ["Über Barradin hängt ein Banner mit der Ballade vom Zerstörer. Alle vier Strophen.", "Above Barradin hangs a banner with the Ballad of the Destroyer. All four verses."], at: lv => propX(lv, "B"), w: 30, h: 56, draw: drawBallade, live: liveBallade },
    amboss: { n: ["Nundros zweiter Amboss", "Nundro's second anvil"], d: ["Neben der Schmiede glüht ein zweiter Amboss – deiner.", "Beside the forge glows a second anvil – yours."], at: lv => propX(lv, "A") + 5.6, w: 26, h: 22, draw: drawAmboss, live: liveAmboss },
    wege: { n: ["Eddas große Karte", "Edda's great map"], d: ["Eine riesige Karte der Feste steht auf einer Staffelei. Fast ohne weiße Flecken.", "A huge map of the keep stands on an easel. Almost without blank spots."], at: lv => { const p = (lv.plots || []).find(q => q.id === "edda"); return p ? p.x0 + 2.2 : propX(lv, "Y") - 7.4; }, w: 32, h: 40, draw: drawKarte },
    rudel: { n: ["Rex' Hütte", "Rex's kennel"], d: ["Wendel hat Rex eine Hütte gebaut. Er schläft davor, die Nase zum Tor.", "Wendel has built Rex a kennel. He sleeps in front of it, nose towards the gate."], at: lv => propX(lv, "R"), w: 26, h: 24, draw: drawHuette }
  };
  function placeSpuren(lv) {
    for (const k of chainsDone()) { const S = SPUR[k]; if (!S) continue; let x = null; try { x = S.at(lv); } catch (_) {} if (x == null || !isFinite(x)) continue; W.spur.push({ id: k, x: x * T, y: G0() }); }
  }
  function drawJagd(c) {
    post(c, -10, 40); post(c, 10, 40); limb(c, -11, -38, 11, -38, 1.6, "#5e3c24"); limb(c, -11, -18, 11, -18, 1.2, "#5e3c24");
    /* Wolfsfell */ poly(c, [-9, -37, 9, -37, 10, -26, 6, -19, 0, -21, -6, -19, -10, -26], "#8a7a6a"); poly(c, [-9, -37, 0, -37, 0, -21, -6, -19, -10, -26], "#7a6a5a");
    poly(c, [-3, -37, 0, -41, 3, -37], "#6a5a4a"); circ(c, -1.4, -35, 0.6, "#2a1a10"); circ(c, 1.4, -35, 0.6, "#2a1a10");
    /* Geweih oben */ const ant = s => { c.save(); c.scale(s, 1); limb(c, 1, -40, 6, -46, 1, "#c8b898"); limb(c, 6, -46, 12, -45, 0.8, "#c8b898"); limb(c, 4, -43.4, 5, -48, 0.7, "#c8b898"); limb(c, 8, -45.6, 9, -49, 0.7, "#c8b898"); c.restore(); };
    c.save(); c.translate(0, 4); ant(1); ant(-1); ell(c, 0, -40, 2.4, 1.6, "#a08868"); c.restore();
    /* Pfeile im Köcher */ c.fillStyle = "#6a4a2a"; c.fillRect(6, -16, 4, 12); for (let i = 0; i < 3; i++) { limb(c, 7 + i, -16, 7 + i, -21, 0.4, "#c8b080"); poly(c, [6.4 + i, -21, 7 + i, -23, 7.6 + i, -21], "#c8402a"); }
  }
  function drawGarten(c) {
    /* Hochbeet */ c.fillStyle = "#5e3c24"; c.fillRect(-16, -6, 32, 6); c.fillStyle = "#7a5232"; c.fillRect(-16, -6, 32, 1); c.fillStyle = "#3a2418"; c.fillRect(-15, -5, 30, 1.6);
    for (let i = 0; i < 9; i++) { const x = -14 + i * 3.4, h = 6 + hash(i, 3) * 8; limb(c, x, -6, x + (hash(i, 5) - 0.5) * 2, -6 - h, 0.6, "#5a8a3a"); ell(c, x + 1, -8 - h * 0.6, 1.6, 0.8, "#6a9a3a"); }
    const fl = ["#e8a0c0", "#ffd27a", "#f0e8d8", "#e06a4a", "#c890d8"];
    for (let i = 0; i < 6; i++) { const x = -13 + i * 5, y = -12 - hash(i, 9) * 6; for (let a = 0; a < 5; a++) circ(c, x + Math.cos(a * 1.256) * 1.2, y + Math.sin(a * 1.256) * 1.2, 0.9, fl[i % fl.length]); circ(c, x, y, 0.6, "#c8902a"); }
    /* Leuchtpilze */ for (const [x, s] of [[-18, 1], [17, 0.8]]) { limb(c, x, 0, x, -3 * s, 0.7, "#e8dcc8"); ell(c, x, -3.4 * s, 2.2 * s, 1.2 * s, "#d0e070"); }
    /* Gießkanne */ poly(c, [10, -6, 15, -6, 14, -10, 11, -10], "#8a8480"); limb(c, 15, -8, 18, -11, 0.6, "#8a8480");
  }
  function liveGarten(c, x, y, t) { if (lo()) return; c.save(); c.globalCompositeOperation = "lighter"; for (const [dx, s] of [[-18, 1], [17, 0.8]]) glow(c, x + dx, y - 3.4 * s, 5 + Math.sin(t * 2 + dx) * 1, "rgba(210,230,110,.4)"); c.restore(); }
  function drawBallade(c) {
    post(c, -13, 54); post(c, 13, 54); limb(c, -14, -52, 14, -52, 1.4, "#5e3c24");
    poly(c, [-12, -51, 12, -51, 12, -22, 0, -18, -12, -22], "#7a2a6a"); poly(c, [-12, -51, -9, -51, -9, -21, -12, -22], "#5a1a4a");
    c.fillStyle = "#e5b454"; c.fillRect(-12, -51, 24, 1.4); c.fillRect(-12, -23.6, 24, 1);
    /* Laute und Notenzeilen */ ell(c, 0, -40, 4, 4.6, "#c8902a"); ell(c, 0, -40, 1.4, 1.4, "#3a1408"); limb(c, 0, -44, 0, -50, 1, "#8a5a1a");
    for (let i = 0; i < 4; i++) { c.fillStyle = "rgba(255,226,170,.75)"; c.fillRect(-9, -33 + i * 2.4, 18, 0.4); circ(c, -6 + i * 4, -33.4 + (i % 2) * 1.2 + i * 2.4, 0.7, "#ffe0a0"); }
  }
  function liveBallade(c, x, y, t) {
    /* Lampions zwischen den Pfosten */
    const cols = ["#ff8a5a", "#ffd27a", "#e8a0c0", "#ff6a3a"];
    for (let i = 0; i < 4; i++) { const lx = x - 9 + i * 6, ly = y - 56 + Math.sin(t * 1.4 + i) * 0.8 + (i === 1 || i === 2 ? 2 : 0);
      if (!lo()) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, lx, ly, 6, cols[i], 0.35); c.restore(); }
      ell(c, lx, ly, 1.8, 2.2, cols[i]); c.fillStyle = "#3a2418"; c.fillRect(lx - 0.8, ly - 2.8, 1.6, 0.8); }
  }
  function drawAmboss(c) {
    poly(c, [-6, 0, -4, -7, 4, -7, 6, 0], "#4a3a30");
    poly(c, [-11, -7, 11, -7, 13, -11, 6, -12, -8, -12, -13, -10], "#4a4440"); poly(c, [-11, -7, 11, -7, 11, -8.4, -11, -8.4], "#3a3430");
    c.fillStyle = "#7a7470"; c.fillRect(-8, -12, 14, 1);
    c.fillStyle = "#ff8a3a"; for (const x of [-5, -1, 3]) c.fillRect(x, -10.4, 1.2, 1.6);
    poly(c, [8, -16, 12, -14, 10, -12, 7, -13], "#c86a2a");
  }
  function liveAmboss(c, x, y, t) {
    const a = 0.5 + 0.5 * Math.sin(t * 3);
    if (!lo()) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, x, y - 10, 10 + a * 3, "rgba(255,130,50,.4)"); c.restore();
      if (Math.random() < 0.05 && FX && FX.p) FX.p({ x: x + (Math.random() - 0.5) * 10, y: y - 12, vx: (Math.random() - 0.5) * 30, vy: -50 - Math.random() * 40, life: 0.6, size: 1.2, col: "#ffb060", kind: "spark", add: true, g: 120 }); }
  }
  function drawKarte(c) {
    limb(c, -10, 0, -4, -38, 1.2, "#5e3c24"); limb(c, 10, 0, 4, -38, 1.2, "#5e3c24"); limb(c, 0, 0, 0, -30, 1, "#4a3220");
    poly(c, [-14, -36, 14, -36, 14, -14, -14, -14], "#d8c090"); poly(c, [-14, -36, 14, -36, 14, -34, -14, -34], "#c8a870");
    c.strokeStyle = "#6a3a1a"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-11, -18); c.lineTo(-6, -24); c.lineTo(-1, -21); c.lineTo(4, -29); c.lineTo(10, -26); c.stroke();
    for (const [x, y] of [[-6, -24], [4, -29], [10, -26]]) { c.fillStyle = "#8a1a14"; c.fillRect(x - 1, y - 1, 2, 2); }
    c.fillStyle = "rgba(106,58,26,.4)"; for (let i = 0; i < 5; i++) c.fillRect(-12 + i * 5, -32 + (i % 2) * 2, 3, 2);
    c.fillStyle = "#c8902a"; c.beginPath(); c.arc(10, -18, 2.4, 0, TAU); c.fill(); limb(c, 10, -20, 10, -16, 0.4, "#5a3a1a"); limb(c, 8, -18, 12, -18, 0.4, "#5a3a1a");
  }
  function drawHuette(c) {
    poly(c, [-11, 0, -11, -12, 11, -12, 11, 0], "#7a5232"); poly(c, [-13, -11, 0, -22, 13, -11], "#5e3c24"); poly(c, [-13, -11, 0, -22, 0, -19, -10, -11], "#4a3220");
    for (let i = 0; i < 3; i++) { c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(-11, -9 + i * 3.4, 22, 0.5); }
    c.fillStyle = "#1a1008"; c.beginPath(); c.moveTo(-5, 0); c.lineTo(-5, -6); c.arc(0, -6, 5, Math.PI, 0); c.lineTo(5, 0); c.fill();
    c.fillStyle = "#e5b454"; c.font = "700 3.4px 'IM Fell English SC',serif"; c.textAlign = "center"; c.fillText("REX", 0, -13.4);
    /* Knochen und Napf */ ell(c, 9, -1, 3, 1.2, "#8a4a2a"); limb(c, -15, -1, -10, -1, 0.9, "#efe6d0"); circ(c, -15, -1.6, 0.8, "#efe6d0"); circ(c, -10, -1.6, 0.8, "#efe6d0");
  }

  /* ======================= FEUER WÄCHST MIT ======================= */
  function drawFireRing(c, t) {
    const lv = W.lv, fx = propX(lv, "F"); if (fx == null) return;
    const st = Z.lager && Z.lager.stage ? Z.lager.stage() : 0, x = fx * T, y = G0();
    if (st >= 2) for (const s of [-1, 1]) { /* Sitzbalken */ const bx = x + s * 17; ell(c, bx, y - 2.4, 6.5, 2.4, "#5e3c24"); ell(c, bx, y - 3.4, 6, 1.4, "#7a5232"); circ(c, bx + s * 6, y - 2.6, 2, "#8a6a4a"); circ(c, bx + s * 6, y - 2.6, 1.1, "#6a4a2a"); }
    if (st >= 1) for (let i = 0; i < 7; i++) { const a = (i / 6) * Math.PI, sx = x + Math.cos(a) * 9.5, sy = y - 1 - Math.sin(a) * 0.4; ell(c, sx, sy, 2.4, 1.6, i % 2 ? "#6e6664" : "#5a5250"); }
  }
  function drawFireLive(c, t) {
    const lv = W.lv, fx = propX(lv, "F"); if (fx == null) return;
    const st = Z.lager && Z.lager.stage ? Z.lager.stage() : 0; if (st < 3) return;
    const x = fx * T, y = G0() - 2;
    if (Z.flame) { Z.flame(c, x - 4, y, 0.55, "#ff8a2a"); Z.flame(c, x + 4, y, 0.5, "#ffb04a"); if (st >= 4) Z.flame(c, x, y - 2, 0.75, "#ffd27a"); }
    if (!lo() && FX && FX.p && Math.random() < 0.12 + st * 0.03) FX.p({ x: x + (Math.random() - 0.5) * 8, y: y - 10, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 50, life: 1.2, size: 1, col: Math.random() < 0.5 ? "#ffd27a" : "#ff8a3a", kind: "spark", add: true, g: -10 });
  }

  /* ======================= BODEN, WETTER, LICHT ======================= */
  const vis = (cam, x0, x1) => x1 > cam.x - 30 && x0 < cam.x + cam.w + 30;
  function drawGround(c, cam, t, front) {
    const se = W.se, low = lo();
    if ((se === "winter") !== !!front) return; /* Schnee liegt vor Gras und Füßen (vordere Ebene), Laub und Blumen dahinter */
    for (const s of W.surf) {
      const xa = s.x0 * T, xb = (s.x1 + 1) * T, y = s.y * T; if (!vis(cam, xa, xb) || y < cam.y - 20 || y > cam.y + cam.h + 30) continue;
      const tx0 = Math.max(s.x0, Math.floor((cam.x - 30) / T)), tx1 = Math.min(s.x1, Math.ceil((cam.x + cam.w + 30) / T));
      if (se === "winter") {
        const deep = W.wx === "schnee" ? 1.25 : W.wx === "frost" ? 0.7 : 1;
        const xs = Math.max(xa, tx0 * T), xe = Math.min(xb, (tx1 + 1) * T);
        c.fillStyle = "#e2d6cc"; c.fillRect(xs, y - 1.6, xe - xs, 3.2); c.fillStyle = "#f6eee4"; c.fillRect(xs, y - 1.6, xe - xs, 1.2);
        for (let tx = tx0; tx <= tx1; tx++) { const h = (2.4 + hash(tx, s.y) * 3) * deep, x = tx * T;
          c.fillStyle = "#f6eee4"; c.beginPath(); c.moveTo(x, y + 0.4); c.quadraticCurveTo(x + 5, y - h - 0.6, x + 8, y - h * 0.8); c.quadraticCurveTo(x + 12, y - h * 0.6 - hash(tx, 2), x + T, y + 0.4); c.fill();
          if (!low && hash(tx, s.y + 9) < 0.22) { c.fillStyle = "rgba(255,248,240,.9)"; c.fillRect(x + hash(tx, 4) * 12, y - h * 0.7, 0.9, 0.9); }
          if (!s.plat && hash(tx, 31) < 0.12) { ell(c, x + 8, y - 1.6, 4, 2.2 * deep + 0.6, "#efe6dc"); } }
        if (W.wx === "frost" && !low) for (let tx = tx0; tx <= tx1; tx++) if (hash(tx, 61) < 0.3) { const x = tx * T + hash(tx, 62) * 14; c.fillStyle = "rgba(255,250,245,.8)"; c.fillRect(x, y - 3 - hash(tx, 63) * 2, 0.7, 0.7); }
      } else if (se === "spaetherbst" || se === "herbst") {
        const cols = ["#c8602a", "#a0401a", "#d8902a", "#7a4a2a", "#b85a2a"], n = se === "herbst" ? 4 : 3;
        for (let tx = tx0; tx <= tx1; tx++) for (let i = 0; i < (low ? 1 : n); i++) { const r = hash(tx * 7 + i, s.y); if (r > 0.75) continue; const x = tx * T + hash(tx, i + 11) * T; ell(c, x, y - 0.6, 1.5, 0.7, cols[(tx + i) % cols.length]); }
        if (!low && se === "spaetherbst") for (let tx = tx0; tx <= tx1; tx++) if (!s.plat && hash(tx, 41) < 0.08) { const x = tx * T + 6; ell(c, x, y - 1.2, 4.6, 2, "#8a4a2a"); ell(c, x - 1, y - 2, 3, 1.2, "#b8602a"); }
      } else if (se === "fruehling" || se === "sommer") {
        const fl = se === "fruehling" ? ["#e8a0c0", "#f0e8d8", "#ffd27a", "#d890c8"] : ["#ffd27a", "#e06a4a", "#f0e8d8", "#c8902a"];
        for (let tx = tx0; tx <= tx1; tx++) {
          if (s.plat) continue;
          for (let i = 0; i < (low ? 1 : 3); i++) { const x = tx * T + hash(tx, i + 21) * T, h = (se === "sommer" ? 4 : 2.6) + hash(tx, i + 31) * 3; limb(c, x, y, x + (hash(tx, i) - 0.5) * 2 + Math.sin(t * 1.3 + x * 0.1) * (low ? 0 : 0.5), y - h, 0.5, se === "sommer" ? "#6a8a2a" : "#5a9a3a"); }
          if (hash(tx, 51) < (se === "fruehling" ? 0.45 : 0.3)) { const x = tx * T + hash(tx, 52) * T, h = 3 + hash(tx, 53) * 2.4; limb(c, x, y, x, y - h, 0.4, "#4a7a2a"); circ(c, x, y - h, 1, fl[tx % fl.length]); circ(c, x, y - h, 0.4, "#c8902a"); }
          if (se === "sommer" && !low && hash(tx, 71) < 0.06) { const x = tx * T + 4; limb(c, x, y, x, y - 2.4, 0.8, "#e8dcc8"); ell(c, x, y - 2.6, 2, 1, "#c8402a"); circ(c, x - 0.6, y - 2.9, 0.3, "#fff"); }
        }
      }
    }
  }
  /* Partikel: Flocken, Laub, Blüten, Regen, Glühwürmchen – in Weltkoordinaten rund um die Kamera */
  function wxKind() { const w = W.wx; return w === "schnee" || w === "flocken" ? "flocke" : w === "laub" || w === "sturm" ? "blatt" : w === "blueten" ? "bluete" : w === "niesel" ? "regen" : w === "gluehen" || w === "schwuel" ? "gluehen" : w === "nebel" ? "nebel" : w === "frost" ? "funkel" : null; }
  function partCount(k) { const low = lo(); const base = { flocke: W.wx === "schnee" ? 90 : 45, blatt: W.wx === "sturm" ? 40 : 24, bluete: 30, regen: 70, gluehen: 22, nebel: 6, funkel: 16 }[k] || 0; return low ? Math.min(14, Math.round(base * 0.2)) : base; }
  function spawn(cam, k, anywhere) {
    const x = cam.x - 40 + Math.random() * (cam.w + 80), y = anywhere ? cam.y - 20 + Math.random() * (cam.h + 40) : cam.y - 16 - Math.random() * 30;
    const p = { k, x, y, vx: 0, vy: 0, r: Math.random(), ph: Math.random() * TAU, life: 0 };
    if (k === "flocke") { p.vy = 14 + Math.random() * 16; p.s = 0.6 + Math.random() * 1.1; }
    else if (k === "blatt") { p.vy = 16 + Math.random() * 14; p.s = 1 + Math.random() * 0.6; p.col = ["#c8602a", "#a0401a", "#d8902a", "#7a4a2a"][(Math.random() * 4) | 0]; }
    else if (k === "bluete") { p.vy = 10 + Math.random() * 10; p.s = 0.7 + Math.random() * 0.5; p.col = Math.random() < 0.6 ? "#f0b0c8" : "#f8e8ec"; }
    else if (k === "regen") { p.vy = 160 + Math.random() * 60; p.s = 1; }
    else if (k === "gluehen") { p.y = cam.y + cam.h * (0.45 + Math.random() * 0.5); p.s = 1; }
    else if (k === "nebel") { p.y = G0() - 6 - Math.random() * 20; p.s = 30 + Math.random() * 30; p.vx = 4 + Math.random() * 6; }
    else if (k === "funkel") { p.y = cam.y + Math.random() * cam.h; p.s = 1; }
    return p;
  }
  function wxTick(dt) {
    const cam = Z.cam; if (!cam) return;
    const k = wxKind(); if (!k) { W.parts.length = 0; return; }
    const want = partCount(k);
    while (W.parts.length < want) W.parts.push(spawn(cam, k, true));
    if (W.parts.length > want) W.parts.length = want;
    W.gust = W.wx === "sturm" ? 30 + Math.sin(W.t * 0.7) * 25 : W.wx === "laub" ? 8 + Math.sin(W.t * 0.5) * 6 : 0;
    for (let i = 0; i < W.parts.length; i++) {
      const p = W.parts[i]; p.life += dt;
      if (p.k === "flocke") { p.x += (Math.sin(W.t * 1.2 + p.ph) * 8 + W.gust * 0.3) * dt; p.y += p.vy * dt; }
      else if (p.k === "blatt" || p.k === "bluete") { p.x += (Math.sin(W.t * 1.6 + p.ph) * 14 + W.gust) * dt; p.y += p.vy * dt * (0.7 + 0.3 * Math.sin(W.t * 2 + p.ph)); }
      else if (p.k === "regen") { p.x += 12 * dt; p.y += p.vy * dt; }
      else if (p.k === "gluehen") { p.x += Math.sin(W.t * 0.8 + p.ph) * 10 * dt; p.y += Math.cos(W.t * 0.6 + p.ph * 2) * 6 * dt; }
      else if (p.k === "nebel") { p.x += p.vx * dt; }
      const out = p.y > G0() + 4 || p.x < cam.x - 60 || p.x > cam.x + cam.w + 60 || p.y > cam.y + cam.h + 40 || (p.k === "gluehen" && p.life > 14) || (p.k === "funkel" && p.life > 3);
      if (out) W.parts[i] = spawn(cam, k, p.k === "gluehen" || p.k === "nebel" || p.k === "funkel");
    }
  }
  function drawParts(c, t) {
    const low = lo();
    for (const p of W.parts) {
      if (p.k === "flocke") { c.fillStyle = "rgba(255,246,236,.9)"; if (low) c.fillRect(p.x, p.y, p.s * 1.4, p.s * 1.4); else circ(c, p.x, p.y, p.s, "rgba(255,246,236,.9)"); }
      else if (p.k === "blatt" || p.k === "bluete") { c.save(); c.translate(p.x, p.y); c.rotate(W.t * 2 + p.ph); ell(c, 0, 0, 1.6 * p.s, 0.7 * p.s, p.col); c.restore(); }
      else if (p.k === "regen") { c.strokeStyle = "rgba(220,205,195,.35)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - 1.2, p.y - 6); c.stroke(); }
      else if (p.k === "gluehen") { const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2.4 + p.ph)); if (!low) glow(c, p.x, p.y, 5, "rgba(220,240,110,.55)", a); circ(c, p.x, p.y, 0.7, "rgba(240,250,170," + a.toFixed(2) + ")"); }
      else if (p.k === "nebel") { if (!low) glow(c, p.x, p.y, p.s, "rgba(200,185,180,.10)"); }
      else if (p.k === "funkel") { const a = Math.sin(Math.min(1, p.life / 3) * Math.PI); c.fillStyle = "rgba(255,250,240," + (a * 0.8).toFixed(2) + ")"; c.fillRect(p.x, p.y, 0.8, 0.8); }
    }
  }
  function drawTint(c, cam) { const tint = SEASONS[W.se].tint; if (!tint || lo()) return; c.fillStyle = tint; c.fillRect(cam.x - 2, cam.y - 2, cam.w + 4, cam.h + 4); }

  /* ======================= TAFEL BEIM NÄHERTRETEN ======================= */
  function drawPlaques(c, t) {
    const P = Z.player; if (!P) return;
    const px = P.x + P.w / 2, py = P.y + P.h;
    const near = (o, r) => Math.abs(px - o.x) < r && Math.abs(py - (o.y + (o.lift || 0))) < 40;
    const show = (key, x, y, l1, l2) => {
      const a = W.plaqueA[key] = Math.min(1, (W.plaqueA[key] || 0) + 0.12);
      c.save(); c.globalAlpha = a; c.font = "700 5.2px 'IM Fell English SC',serif";
      const w = Math.max(c.measureText(l1).width, (c.font = "600 3.8px 'Alegreya Sans',sans-serif", c.measureText(l2).width)) + 8, h = 13;
      const bx = x - w / 2, by = y - h;
      limb(c, x - w * 0.3, by, x - w * 0.3 - 1, by - 3, 0.4, "#3a2418"); limb(c, x + w * 0.3, by, x + w * 0.3 + 1, by - 3, 0.4, "#3a2418");
      c.fillStyle = "#3a2418"; c.fillRect(bx - 0.8, by - 0.8, w + 1.6, h + 1.6); c.fillStyle = "#7a5232"; c.fillRect(bx, by, w, h); c.fillStyle = "#8a6240"; c.fillRect(bx, by, w, 1);
      c.textAlign = "center"; c.fillStyle = "#ffe0a0"; c.font = "700 5.2px 'IM Fell English SC',serif"; c.fillText(l1, x, by + 6);
      c.fillStyle = "#e8d8c0"; c.font = "600 3.8px 'Alegreya Sans',sans-serif"; c.fillText(l2, x, by + 11); c.restore();
    };
    for (const o of W.troph) {
      const key = "t:" + o.id, D = TROPHY[o.id];
      if (near(o, 22)) { const b = (M().bosses || {})[o.id] || {}; show(key, o.x, o.y - Math.max(D.h, 40) - 16, L(Z.BOSSDEF[o.id].n), L(["Besiegt: ", "Defeated: "]) + (b.won || 0) + "× · " + L(["aufgehängt von ", "hung by "]) + L(D.who)); }
      else W.plaqueA[key] = 0;
    }
    for (const o of W.spur) {
      const key = "s:" + o.id, D = SPUR[o.id];
      if (near(o, 20)) show(key, o.x, o.y - Math.max(D.h, 40) - 16, L(D.n), L(Z.auftr && Z.auftr.CHAINS[o.id] ? Z.auftr.CHAINS[o.id].n : ["", ""]));
      else W.plaqueA[key] = 0;
    }
  }

  /* ======================= EINHÄNGEN ======================= */
  let drawErr = 0;
  const oops = err => { if (!drawErr) { drawErr = 1; console.error(err); } };
  const la0 = Z.loadArea;
  Z.loadArea = function () {
    const r = la0.apply(this, arguments);
    try { const lv = Z.level; if (lv && lv.hub) setup(lv); else W = null; } catch (err) { console.error(err); }
    return r;
  };
  const lt0 = Z.lagerTick;
  Z.lagerTick = function (dt) {
    const r = lt0 ? lt0.apply(this, arguments) : undefined;
    try { if (W && Z.level === W.lv) { W.t += dt; wxTick(dt); } } catch (err) { oops(err); }
    return r;
  };
  const mid0 = Z.drawMidLife;
  Z.drawMidLife = function (c, cam, t) {
    const r = mid0 ? mid0.apply(this, arguments) : undefined;
    try {
      if (W && Z.level === W.lv && cam) {
        drawGround(c, cam, t); drawFireRing(c, t);
        for (const o of W.troph) { const D = TROPHY[o.id]; if (vis(cam, o.x - D.w, o.x + D.w)) put(c, sprite("tr:" + o.id, D.w, D.h, D.draw), o.x, o.y); }
        for (const o of W.spur) { const D = SPUR[o.id]; if (vis(cam, o.x - D.w, o.x + D.w)) { put(c, sprite("sp:" + o.id, D.w, D.h, D.draw), o.x, o.y); if (D.live) D.live(c, o.x, o.y, t); } }
        if (!lo()) for (const o of W.troph) if (vis(cam, o.x - 20, o.x + 20)) trophyLive(c, o, t);
      }
    } catch (err) { oops(err); }
    return r;
  };
  function trophyLive(c, o, t) {
    c.save(); c.globalCompositeOperation = "lighter";
    if (o.id === "wraith") glow(c, o.x + 6, o.y - 28, 9 + Math.sin(t * 3) * 1.5, "rgba(240,215,240,.45)");
    else if (o.id === "themberchaud") glow(c, o.x - 2, o.y - 9.5, 5 + Math.sin(t * 2) * 1, "rgba(255,120,40,.5)");
    else if (o.id === "schmiedewaechter") glow(c, o.x + 7, o.y - 23, 5 + Math.sin(t * 2.6) * 1, "rgba(255,140,60,.45)");
    else if (o.id === "glasstab") glow(c, o.x, o.y - 32, 7 + Math.sin(t * 1.8) * 1.4, "rgba(245,215,240,.4)");
    else if (o.id === "demogorgon") { glow(c, o.x - 2.6, o.y - 42.4, 3, "rgba(255,170,80,.5)"); glow(c, o.x + 2.6, o.y - 42.4, 3, "rgba(255,170,80,.5)"); }
    else if (o.id === "venomfang") glow(c, o.x + 9, o.y - 1.4, 3 + Math.sin(t * 4) * 0.6, "rgba(160,220,80,.45)");
    c.restore();
  }
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    const r = wp0 ? wp0.apply(this, arguments) : undefined;
    try { if (W && Z.level === W.lv && Z.cam) { drawFireLive(c, t); drawGround(c, Z.cam, t, true); drawParts(c, t); drawTint(c, Z.cam); drawPlaques(c, t); } } catch (err) { oops(err); }
    return r;
  };
  if (Z.slots && Z.slots.onSwap) Z.slots.onSwap(() => { W = null; });

  /* ======================= SCHNITTSTELLE / TESTS ======================= */
  let forceWx = null;
  Z.lagerwelt = {
    SEASONS, TROPHY, SPUR, season, score, seasonOf, state: () => W,
    /* Test: Jahreszeit/Wetter erzwingen (null = normal) und das Lager neu aufbauen */
    force: (se, wx) => { force = se && SEASONS[se] ? se : null; forceWx = wx || null; if (Z.level && Z.level.hub) setup(Z.level); return season(); },
    /* Auftrag abgeholt: Funken über dem Bewohner (auftraege.js) */
    feier: g => {
      if (!W || !Z.level || !Z.level.hub || !FX) return;
      const G = Z.AUFTR_GIVER && Z.AUFTR_GIVER[g]; if (!G) return;
      let x = null, y = G0();
      if (G.npc) x = propX(Z.level, G.npc) * T; else if (Z.lager && Z.lager._camp) { const cc = Z.lager._camp(), o = cc && cc.res.find(q => q.id === G.res); if (o) { x = o.x; y = o.y; } }
      if (x == null) return;
      if (FX.burst) FX.burst(x, y - 30, lo() ? 8 : 22, { col: ["#ffd27a", "#ff8a3a", "#fff0c0"], sp: 90, life: 0.9, size: 1.6, kind: "spark", add: true, g: 60 });
      if (W.spur.length < chainsDone().length) { W.spur = []; placeSpuren(Z.level); const s = LW(); for (const o of W.spur) s.spur[o.id] = 1; }
    }
  };
})();
