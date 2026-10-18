/* =====================================================================
   BARRADINS AUFTRITT – Rhythmusspiel in der Taverne
   Drei Spuren (Bass, Laute, Schellen) fallen herab; im richtigen Moment
   tippen. Die Treffsicherheit wird am Ende zum Auftrittswurf (W20 + 7).
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("auftritt");
  if (!root) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];

  const TX = {
    de: {
      label: "Bühnenprobe", titel: "Barradins Auftritt",
      text: "Barradin spielt auf – und du greifst in die Saiten! Tippe die Noten, sobald sie die goldene Linie erreichen. Am Ende entscheidet dein Taktgefühl über den Auftrittswurf.",
      steuerung: "Tasten A · S · D (oder J · K · L, ← ↓ →) – auf dem Handy einfach auf die Spur tippen.",
      publikum: "Publikum",
      stufen: { leicht: "🍺 Bauern in Phandalin", mittel: "👑 Am Hof von König Horga", schwer: "🐉 Ein Drache hört zu" },
      spuren: ["Bass", "Laute", "Schellen"],
      start: "▶ Auftritt beginnen", nochmal: "↻ Noch ein Auftritt", abbrechen: "Abbrechen",
      urteil: { perfekt: "Meisterhaft!", gut: "Gut!", knapp: "Knapp …", daneben: "Daneben!" },
      serie: n => n + "er-Serie", punkte: "Punkte",
      ergebnis: "Der Auftrittswurf", treffer: (a, b) => a + " von " + b + " Noten getroffen", beste: n => "Beste Serie: " + n,
      genau: p => "Treffsicherheit: " + p + " %", fehlgriffe: n => n + " Fehlgriffe",
      tipp: "Tipp: Lieber eine Note auslassen als wild zu hämmern – jeder Fehlgriff kostet. Getroffene Noten spielen die Melodie, also hör auf das Lied!", rekord: n => "Bisher bester Wurf hier: " + n, neuRekord: "Neuer Rekord vor diesem Publikum!",
      wurf: (w, s) => "W20: " + w + " + 7 Auftreten = " + s,
      lied: "Lied", neuesLied: "🎲 Neues Lied", erfunden: "Barradin improvisiert",
      lieder: { reigen: "Tavernenreigen", bugbear: "Der Bugbear im Fass", klage: "Phandalins Klage", schmiede: "Hammer und Amboss", seemann: "Seemannsgarn", walzer: "Demogorgons Walzer" },
      erfinden: { vorlage: ["Die Ballade vom {a} {n}", "Das Lied vom {a} {n}", "Der Reigen vom {a} {n}", "Die Mär vom {a} {n}", "Die Klage vom {a} {n}"],
        adj: ["traurigen", "betrunkenen", "tanzenden", "verliebten", "singenden", "hungrigen", "verlorenen", "kichernden", "einsamen", "wütenden", "verfluchten", "goldenen"],
        nom: ["Kobold", "Zwerg", "Drachen", "Bugbear", "Wirt", "Pilz", "Hering", "Barden", "Goblin", "Oger", "Schatten", "Mond", "Krug"] },
      bestenliste: "🏆 Bestenliste", nurHier: "Noch nur auf diesem Gerät gespeichert.", leer: "Noch niemand – sei die erste Legende!",
      eintragen: "🏆 Eintragen", deinName: "Dein Name", eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!",
      spalten: ["#", "Name", "Treffer", "Wurf", "Lied"],
      stimmen: {
        patzer: ["Ich … habe gerade mit der Laute nach einer Fliege geschlagen. Und sie getroffen. Das Lied nicht.", "Eine 1. Die Laute weint. Ich weine. Der Wirt schenkt mir aus Mitleid nach."],
        schwach: ["Ein höflicher Applaus. Von einer Person. Die eigentlich nur gähnen wollte.", "Die Zuhörer starren in ihre Krüge. Vielleicht suchen sie dort Trost."],
        maessig: ["Ganz ordentlich! Ein paar Leute wippen mit. Einer klatscht sogar im Takt. Fast.", "Kein Meisterwerk, aber der Wirt schmeißt mich nicht raus. Ein Erfolg!"],
        gut: ["Die Taverne tobt! Jemand wirft mir eine Rose zu. Oder einen Hering. Egal, ich nehm's!", "Krüge werden gehoben, Füße stampfen – so muss das klingen!"],
        stark: ["Selbst der grimmige Zwerg in der Ecke summt mit. Ich bin eine Legende. Fast.", "Zugaberufe! Ich verbeuge mich dreimal. Viermal. Ach, ich verbeug mich einfach weiter."],
        legende: ["Man wird Lieder über dieses Lied singen. Und ich werde sie alle singen.", "Die Götter selbst lehnen sich vor, um besser zu hören. Echo hat Tränen in den Augen. Ezekiel … nickt. Einmal."],
        krit: ["EINE NATÜRLICHE 20! Die Kerzen flackern, die Wände beben, und Rex heult die zweite Stimme!", "Natürliche 20! Selbst Imre legt den Würfel zur Seite und applaudiert."]
      }
    },
    en: {
      label: "Stage rehearsal", titel: "Barradin's Performance",
      text: "Barradin strikes up – and you play along! Hit the notes as soon as they reach the golden line. In the end your sense of rhythm decides the performance check.",
      steuerung: "Keys A · S · D (or J · K · L, ← ↓ →) – on a phone just tap the lane.",
      publikum: "Audience",
      stufen: { leicht: "🍺 Farmers in Phandalin", mittel: "👑 At King Horga's court", schwer: "🐉 A dragon is listening" },
      spuren: ["Bass", "Lute", "Bells"],
      start: "▶ Begin performance", nochmal: "↻ Another performance", abbrechen: "Cancel",
      urteil: { perfekt: "Masterful!", gut: "Good!", knapp: "Close …", daneben: "Missed!" },
      serie: n => n + " streak", punkte: "points",
      ergebnis: "The performance check", treffer: (a, b) => a + " of " + b + " notes hit", beste: n => "Best streak: " + n,
      genau: p => "Accuracy: " + p + " %", fehlgriffe: n => n + " misplays",
      tipp: "Tip: better to skip a note than to mash – every misplay costs. The notes you hit play the melody, so listen to the song!", rekord: n => "Best roll here so far: " + n, neuRekord: "New record in front of this audience!",
      wurf: (w, s) => "d20: " + w + " + 7 Performance = " + s,
      lied: "Song", neuesLied: "🎲 New song", erfunden: "Barradin improvises",
      lieder: { reigen: "Tavern Round", bugbear: "The Bugbear in the Barrel", klage: "Phandalin's Lament", schmiede: "Hammer and Anvil", seemann: "Sailor's Yarn", walzer: "Demogorgon's Waltz" },
      erfinden: { vorlage: ["The Ballad of the {a} {n}", "The Song of the {a} {n}", "The Round of the {a} {n}", "The Tale of the {a} {n}", "The Lament of the {a} {n}"],
        adj: ["Sad", "Drunken", "Dancing", "Lovesick", "Singing", "Hungry", "Lost", "Giggling", "Lonely", "Angry", "Cursed", "Golden"],
        nom: ["Kobold", "Dwarf", "Dragon", "Bugbear", "Innkeeper", "Mushroom", "Herring", "Bard", "Goblin", "Ogre", "Shadow", "Moon", "Tankard"] },
      bestenliste: "🏆 Leaderboard", nurHier: "Only saved on this device for now.", leer: "Nobody yet – be the first legend!",
      eintragen: "🏆 Submit", deinName: "Your name", eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!",
      spalten: ["#", "Name", "Hits", "Roll", "Song"],
      stimmen: {
        patzer: ["I … just swatted a fly with my lute. Hit the fly. Not the song.", "A 1. The lute weeps. I weep. The innkeeper pours me another out of pity."],
        schwach: ["Polite applause. From one person. Who actually just wanted to yawn.", "The audience stares into their tankards. Maybe they're looking for comfort there."],
        maessig: ["Not bad! A few people tap along. One even claps in time. Almost.", "No masterpiece, but the innkeeper isn't throwing me out. A success!"],
        gut: ["The tavern goes wild! Someone throws me a rose. Or a herring. Whatever, I'll take it!", "Tankards raised, feet stomping – that's how it should sound!"],
        stark: ["Even the grumpy dwarf in the corner hums along. I'm a legend. Nearly.", "Encore! I bow three times. Four. Oh, I'll just keep bowing."],
        legende: ["They'll sing songs about this song. And I'll sing all of them.", "The gods themselves lean in to hear better. Echo has tears in his eyes. Ezekiel … nods. Once."],
        krit: ["A NATURAL 20! The candles flicker, the walls shake, and Rex howls the harmony!", "Natural 20! Even Imre puts down his dice and applauds."]
      }
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Schwierigkeit ----------
     Je Stufe: Tempo, Flugzeit der Noten (länger = mehr Abstand, besser lesbar), Liedlänge,
     Rhythmus-Motive der Laute, Bass- und Schellenschläge, ob Doppelnoten erlaubt sind. */
  const STUFEN = {
    leicht: { tempo: 80, flug: 2.4, takte: 8, motive: [[4, 8, 12], [4, 8], [4, 10, 12], [4, 6, 8, 12]], bass: [0], schelle: [], akkord: false },
    mittel: { tempo: 92, flug: 2.1, takte: 12, motive: [[2, 4, 6, 12], [4, 6, 10, 12], [2, 4, 10, 12, 14], [4, 6, 12, 14]], bass: [0, 8], schelle: [14], akkord: false },
    schwer: { tempo: 104, flug: 1.8, takte: 16, motive: [[0, 2, 4, 6, 8, 12], [0, 3, 6, 8, 10, 12], [2, 4, 6, 8, 10, 12, 14], [0, 4, 6, 8, 12, 14]], bass: [0, 8], schelle: [6, 14], akkord: true }
  };
  const FENSTER = { perfekt: .05, gut: .1, knapp: .14 };
  const PUNKTE = { perfekt: 100, gut: 75, knapp: 45 };
  const FEHLGRIFF = 50; /* Abzug je Tipp ins Leere – Hämmern lohnt sich nicht */
  const FARBEN = ["#b5643c", "#e0a046", "#f0d48a"];
  const ZEICHEN = ["♩", "♪", "🔔"];
  const TASTEN_ANZEIGE = ["A", "S", "D"];

  /* ---------- Lieder ----------
     Jedes Lied: Tonleiter, Grundton, Akkordfolge (Stufen je Takt), Tempo-Faktor, Taktart (16 = 4/4, 12 = 3/4).
     Die Melodie wird bei jedem Auftritt neu erfunden, folgt aber Akkorden und Motiven – so bleibt sie singbar. */
  const MODI = { dorisch: [0, 2, 3, 5, 7, 9, 10], ionisch: [0, 2, 4, 5, 7, 9, 11], aeolisch: [0, 2, 3, 5, 7, 8, 10],
    phrygisch: [0, 1, 3, 5, 7, 8, 10], mixolydisch: [0, 2, 4, 5, 7, 9, 10], harmonisch: [0, 2, 3, 5, 7, 8, 11] };
  const LIEDER = {
    reigen: { modus: "dorisch", grund: 62, tempo: 1, folge: [0, 6, 3, 0, 0, 6, 3, 4], takt: 16 },
    bugbear: { modus: "ionisch", grund: 60, tempo: 1.08, folge: [0, 3, 4, 0, 5, 3, 4, 4], takt: 16 },
    klage: { modus: "aeolisch", grund: 64, tempo: .85, folge: [0, 5, 2, 6, 0, 5, 3, 4], takt: 16 },
    schmiede: { modus: "phrygisch", grund: 64, tempo: 1, folge: [0, 1, 0, 6, 0, 1, 6, 0], takt: 16, bass: [0, 6, 12] },
    seemann: { modus: "mixolydisch", grund: 62, tempo: 1.05, folge: [0, 6, 0, 4, 0, 6, 3, 0], takt: 16 },
    walzer: { modus: "harmonisch", grund: 62, tempo: 1.1, folge: [0, 0, 3, 4, 0, 3, 4, 4], takt: 12 }
  };
  const FOLGEN = {
    dorisch: [[0, 6, 3, 0], [0, 3, 0, 6], [0, 6, 0, 3], [0, 4, 3, 0]], ionisch: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 4, 5, 3], [0, 3, 0, 4]],
    aeolisch: [[0, 5, 2, 6], [0, 3, 6, 0], [0, 5, 3, 4], [0, 6, 5, 6]], phrygisch: [[0, 1, 0, 6], [0, 1, 6, 0], [0, 6, 5, 1]],
    mixolydisch: [[0, 6, 3, 0], [0, 6, 0, 4], [0, 3, 6, 0]], harmonisch: [[0, 3, 4, 0], [0, 5, 3, 4], [0, 3, 0, 4]]
  };
  /* Walzer-Motive (12 Schritte je Takt) je Publikum */
  const WALZER = { leicht: [[4, 8], [4, 8, 10], [8], [4, 6, 8]], mittel: [[2, 4, 8], [4, 6, 8, 10], [2, 4, 6, 8], [4, 8, 10]],
    schwer: [[0, 2, 4, 6, 8, 10], [0, 4, 6, 8, 10], [2, 4, 6, 8, 10], [0, 3, 4, 8, 10]] };
  function liedErfinden() {
    const modus = zufall(Object.keys(MODI)), E = TX.de.erfinden;
    return { modus, grund: zufall([60, 62, 63, 64, 65]), tempo: zufall([.85, .92, 1, 1.05, 1.12]), takt: Math.random() < .25 ? 12 : 16,
      folge: zufall(FOLGEN[modus]).concat(zufall(FOLGEN[modus])), name: [Math.floor(Math.random() * E.vorlage.length), Math.floor(Math.random() * E.adj.length), Math.floor(Math.random() * E.nom.length)] };
  }
  const liedName = (l, T) => l.name ? T.erfinden.vorlage[l.name[0]].replace("{a}", T.erfinden.adj[l.name[1]]).replace("{n}", T.erfinden.nom[l.name[2]]) : T.lieder[l.key];
  const skala = modus => Array.from({ length: 11 }, (_, n) => MODI[modus][n % 7] + 12 * Math.floor(n / 7));
  const akkordToene = g => [g % 7, (g + 2) % 7, (g + 4) % 7];
  const nah = (ziel, erlaubt) => { let b = null; for (let r = 0; r <= 9; r++) if (erlaubt(r) && (b === null || Math.abs(r - ziel) < Math.abs(b - ziel))) b = r; return b; };
  let SK = skala("dorisch"), GRUND = 62;
  function noten(stufe, lied) {
    const st = STUFEN[stufe], L = lied.takt, schritt = 60 / (st.tempo * lied.tempo) / 4, vor = 16 * schritt, liste = [], akkorde = [];
    SK = skala(lied.modus); GRUND = lied.grund;
    const motive = L === 12 ? WALZER[stufe] : st.motive;
    const bassSchritte = L === 12 ? [0] : (lied.bass && stufe !== "leicht" ? lied.bass : st.bass);
    const schellen = L === 12 ? (stufe === "leicht" ? [] : stufe === "mittel" ? [10] : [4, 10]) : st.schelle;
    /* Phrasen: Motiv a, b, a, Schluss – die Kontur jedes Motivs wird einmal erfunden und dann wiederholt */
    const konturen = motive.map(m => m.map(() => zufall([-2, -1, -1, 1, 1, 2])));
    const plan = [0, 1, 0, 2, 3, 3, 0, 2];
    let ton = 4;
    for (let takt = 0; takt < st.takte; takt++) {
      const letzter = takt === st.takte - 1;
      const grund = letzter ? 0 : lied.folge[takt % lied.folge.length]; akkorde.push(grund);
      const mi = plan[takt % plan.length], motiv = motive[mi], kontur = konturen[mi];
      const belegt = {};
      const setze = (s, spur, n) => { liste.push({ zeit: vor + (takt * L + s) * schritt, spur, ton: n, status: null }); belegt[s] = (belegt[s] || 0) + 1; };
      bassSchritte.forEach(s => { if (!letzter || s === 0) setze(s, 0, grund); });
      if (letzter) { /* Schlussakkord: Laute auf dem Grundton */ setze(st.akkord ? 0 : 4, 1, 7); continue; }
      if (takt % 4 === 0) ton = 4;
      motiv.forEach((s, k) => {
        if (!st.akkord && belegt[s]) return;
        const ziel = ton + kontur[k];
        ton = s % 4 === 0 ? nah(ziel, r => akkordToene(grund).includes(r % 7)) : nah(ziel, () => true);
        setze(s, 1, ton);
      });
      schellen.forEach(s => { if ((takt % 2 === 1 || st.akkord) && (!belegt[s] || st.akkord)) setze(s, 2, 0); });
    }
    liste.sort((a, b) => a.zeit - b.zeit);
    return { liste, ende: vor + st.takte * L * schritt + 1.5, schritt, vor, akkorde, L };
  }

  /* ---------- Klang: gezupfte Saiten (Karplus-Strong) statt Piepser ---------- */
  let ctx = null, ausg = null, rausch = null;
  const saiten = new Map();
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const komp = ctx.createDynamicsCompressor(); komp.threshold.value = -16; komp.ratio.value = 2.5;
      ausg = ctx.createGain(); ausg.gain.value = .7; ausg.connect(komp); komp.connect(ctx.destination);
      rausch = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = rausch.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function saite(f, dauer, daempf) {
    const key = f.toFixed(1) + "|" + dauer;
    if (saiten.has(key)) return saiten.get(key);
    const sr = ctx.sampleRate, n = Math.round(sr * dauer), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const p = Math.max(2, Math.round(sr / f)), ring = new Float32Array(p);
    for (let j = 0; j < p; j++) ring[j] = Math.random() * 2 - 1;
    for (let k = 0; k < 2; k++) for (let j = 0; j < p; j++) ring[j] = (ring[j] + ring[(j + 1) % p]) / 2;
    let idx = 0;
    for (let j = 0; j < n; j++) { const a = ring[idx], b = ring[(idx + 1) % p]; d[j] = a; ring[idx] = (a + b) * daempf; idx = (idx + 1) % p; }
    saiten.set(key, buf); return buf;
  }
  const melHz = n => hz(GRUND + SK[n]), bassHz = n => hz(GRUND - 24 + SK[n % 7]);
  function zupfen(f, z, laut, bass) {
    const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = bass ? saite(f, 1.8, .4986) : saite(f, 1.4, .4979);
    lp.type = "lowpass"; lp.frequency.value = bass ? 1100 : 4200; lp.Q.value = .6;
    g.gain.value = laut; src.connect(lp); lp.connect(g); g.connect(ausg); src.start(z);
  }
  function rauschen(z, typ, f, laut, dauer) {
    const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = rausch; b.type = typ; b.frequency.value = f;
    g.gain.setValueAtTime(laut, z); g.gain.exponentialRampToValueAtTime(.0008, z + dauer);
    r.connect(b); b.connect(g); g.connect(ausg); r.start(z, Math.random() * .5, dauer + .02);
  }
  function schlag(z, f0, f1, laut, dauer) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, z); o.frequency.exponentialRampToValueAtTime(f1, z + dauer * .6);
    g.gain.setValueAtTime(laut, z); g.gain.exponentialRampToValueAtTime(.001, z + dauer);
    o.connect(g); g.connect(ausg); o.start(z); o.stop(z + dauer + .02);
  }
  const ton = (spur, n, z) => {
    if (spur === 0) zupfen(bassHz(n), z, 1.1, true);
    else if (spur === 1) zupfen(melHz(n), z, .8, false);
    else { rauschen(z, "highpass", 6800, .32, .18); for (let i = 0; i < 3; i++) schlag(z + i * .01, 5200 + Math.random() * 2500, 5000, .025, .1); }
  };
  /* Fehlgriff: gedämpfte, schnarrende Saite */
  const daneben = z => { rauschen(z, "bandpass", 900, .35, .05); zupfen(hz(45), z, .25, true); };
  /* Begleitung: Rahmentrommel und ein weicher Akkord-Teppich – so klingt es auch zwischen den Treffern nach Musik */
  function begleitung(daten, start) {
    const knoten = [], s = daten.schritt, L = daten.L;
    for (let i = 0; i < 4; i++) { rauschen(start + i * 4 * s, "bandpass", 2200, .35, .04); schlag(start + i * 4 * s, 900, 700, .05, .05); }
    daten.akkorde.forEach((g, takt) => {
      const z = start + daten.vor + takt * L * s, dauer = L * s;
      schlag(z, 105, 46, .55, .32);
      if (L === 12) { [4, 8].forEach(k => { rauschen(z + k * s, "bandpass", 1500, .16, .05); schlag(z + k * s, 180, 120, .12, .08); }); }
      else { schlag(z + 8 * s, 95, 46, .4, .28); rauschen(z + 4 * s, "bandpass", 1300, .12, .05); rauschen(z + 12 * s, "bandpass", 1300, .12, .05); }
      akkordToene(g).forEach((st, k) => {
        const o = ctx.createOscillator(), gg = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = "triangle"; o.frequency.value = hz(GRUND - 12 + SK[st] + (k && SK[st] < SK[g % 7] ? 12 : 0));
        lp.type = "lowpass"; lp.frequency.value = 900;
        gg.gain.setValueAtTime(0, z); gg.gain.linearRampToValueAtTime(.035, z + .25); gg.gain.setValueAtTime(.035, z + dauer - .2); gg.gain.linearRampToValueAtTime(0, z + dauer + .1);
        o.connect(lp); lp.connect(gg); gg.connect(ausg); o.start(z); o.stop(z + dauer + .15); knoten.push(o);
      });
    });
    return knoten;
  }
  function publikum(gut) {
    const z = ctx.currentTime + .1;
    if (gut) {
      for (let i = 0; i < 40; i++) rauschen(z + Math.random() * 2.2, "bandpass", 1100 + Math.random() * 800, .25 + Math.random() * .3, .03);
      for (let i = 0; i < 5; i++) { const s0 = z + Math.random() * .4; rauschen(s0, "bandpass", 700 + Math.random() * 600, .12, 2); }
    } else {
      for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) schlag(z + k * .6 + i * .07, 4300, 4300, .05, .05); /* Grillen … */
    }
  }

  /* ---------- Zustand ---------- */
  let stufe = "mittel";
  try { stufe = localStorage.getItem("imres-auftritt-stufe") || "mittel"; } catch (_) {}
  if (!STUFEN[stufe]) stufe = "mittel";
  let spiel = null, ergebnis = null, liedWahl = "reigen", erfunden = null;
  try { liedWahl = localStorage.getItem("imres-auftritt-lied") || "reigen"; } catch (_) {}
  if (!LIEDER[liedWahl] && liedWahl !== "neu") liedWahl = "reigen";
  const aktuellesLied = () => liedWahl === "neu" ? (erfunden || (erfunden = liedErfinden())) : Object.assign({ key: liedWahl }, LIEDER[liedWahl]);
  const rekordLesen = () => { try { return JSON.parse(localStorage.getItem("imres-auftritt-rekord") || "{}") || {}; } catch (_) { return {}; } };

  /* ---------- Oberfläche ---------- */
  function zeichnen() {
    const T = t();
    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.text + "</p>" +
      '<div class="at-stufen"><span>' + T.publikum + ":</span>" +
        Object.keys(STUFEN).map(k => '<button type="button" data-stufe="' + k + '" aria-pressed="' + (k === stufe) + '">' + T.stufen[k] + "</button>").join("") + "</div>" +
      '<div class="at-stufen at-lieder"><span>' + T.lied + ":</span>" +
        Object.keys(LIEDER).map(k => '<button type="button" data-lied="' + k + '" aria-pressed="' + (k === liedWahl) + '">' + T.lieder[k] + "</button>").join("") +
        '<button type="button" data-lied="neu" aria-pressed="' + (liedWahl === "neu") + '">' + T.neuesLied + "</button>" +
        (liedWahl === "neu" ? '<span class="at-erfunden">♪ ' + esc(liedName(aktuellesLied(), T)) + "</span>" : "") + "</div>" +
      '<div class="at-buehne"><canvas class="at-canvas" width="560" height="380" aria-label="' + esc(T.titel) + '"></canvas>' +
        '<div class="at-ergebnis" ' + (ergebnis ? "" : "hidden") + ">" + (ergebnis ? ergebnisHtml(T) : "") + "</div></div>" +
      '<p class="at-steuer">' + T.steuerung + "<br>" + T.tipp + "</p>" +
      '<div class="at-fuss"><button type="button" class="tav-knopf at-start">' + (spiel ? T.abbrechen : (ergebnis ? T.nochmal : T.start)) + "</button></div>" +
      (ergebnis && !spiel ? eintragHtml(T) : "") +
      '<div class="at-liste">' + listeHtml(T) + "</div>";
    malenRuhe();
  }
  function ergebnisHtml(T) {
    const e = ergebnis;
    return '<p class="label">' + T.ergebnis + "</p>" +
      '<div class="at-w20' + (e.w20 === 20 ? " krit" : e.w20 === 1 ? " patzer" : "") + '">' + e.w20 + "</div>" +
      '<p class="at-summe">' + T.wurf(e.w20, e.summe) + "</p>" +
      '<p class="at-zitat">„' + esc(e.zitat) + "“</p>" +
      '<p class="at-werte">' + T.genau(e.prozent) + " · " + T.treffer(e.getroffen, e.gesamt) + " · " + T.fehlgriffe(e.streu) + " · " + T.beste(e.serie) + "</p>" +
      '<p class="at-rekord">' + (e.neu ? T.neuRekord : T.rekord(e.rekord)) + "</p>";
  }
  const canvas = () => root.querySelector(".at-canvas");
  function maße(c) {
    const r = c.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return { w, h, dpr };
  }
  function grund(g, w, h, dpr, blitz) {
    g.clearRect(0, 0, w, h);
    const bahn = w / 3;
    for (let i = 0; i < 3; i++) {
      const x = i * bahn;
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(235,226,204,0.02)"); grad.addColorStop(1, "rgba(235,226,204,0.07)");
      g.fillStyle = grad; g.fillRect(x + 2 * dpr, 0, bahn - 4 * dpr, h);
      if (blitz && blitz[i] > 0) { g.fillStyle = "rgba(255,210,122," + (0.25 * blitz[i]) + ")"; g.fillRect(x + 2 * dpr, 0, bahn - 4 * dpr, h); }
      g.fillStyle = "rgba(235,226,204,0.5)"; g.font = (12 * dpr) + "px Georgia, serif"; g.textAlign = "center";
      g.fillText(t().spuren[i], x + bahn / 2, h - 10 * dpr);
    }
    const y = h * .82;
    g.strokeStyle = "#e0a046"; g.lineWidth = 3 * dpr; g.shadowColor = "#e0a046"; g.shadowBlur = 12 * dpr;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.shadowBlur = 0;
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = "rgba(224,160,70,.6)"; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(i * bahn + bahn / 2, y, 18 * dpr, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "rgba(235,226,204,.55)"; g.font = "bold " + (13 * dpr) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(TASTEN_ANZEIGE[i], i * bahn + bahn / 2, y + 1); g.textBaseline = "alphabetic";
    }
    return y;
  }
  function malenRuhe() {
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d");
    const y = grund(g, w, h, dpr);
    if (!spiel && !ergebnis) {
      g.fillStyle = "rgba(235,226,204,.75)"; g.font = "italic " + (18 * dpr) + "px Georgia, serif"; g.textAlign = "center";
      g.fillText("🎻  " + t().stufen[stufe], w / 2, y / 2 - 12 * dpr);
      g.fillStyle = "rgba(224,160,70,.85)"; g.font = (15 * dpr) + "px Georgia, serif";
      g.fillText("♪ " + liedName(aktuellesLied(), t()), w / 2, y / 2 + 16 * dpr);
    }
  }
  function malen() {
    if (!spiel) return;
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d"), jetzt = ctx.currentTime - spiel.start;
    spiel.blitz = spiel.blitz.map(b => Math.max(0, b - .06));
    const y = grund(g, w, h, dpr, spiel.blitz), bahn = w / 3, flug = STUFEN[stufe].flug;
    /* Taktlinien wandern mit – so sieht man den Rhythmus kommen */
    const d0 = spiel.daten, schlagDauer = 4 * d0.schritt;
    for (let k = Math.floor((jetzt - d0.vor) / schlagDauer); ; k++) {
      const zt = d0.vor + k * schlagDauer, dt = zt - jetzt;
      if (dt > flug) break; if (dt < -.1 || zt > d0.ende) continue;
      const ly = y - (dt / flug) * y;
      const takt = k % (d0.L / 4) === 0;
      g.strokeStyle = takt ? "rgba(224,160,70,.28)" : "rgba(235,226,204,.08)"; g.lineWidth = (takt ? 2 : 1) * dpr;
      g.beginPath(); g.moveTo(0, ly); g.lineTo(w, ly); g.stroke();
    }
    spiel.daten.liste.forEach(n => {
      if (n.status && n.status !== "daneben") return;
      const dt = n.zeit - jetzt; if (dt > flug || dt < -.4) return;
      const ny = y - (dt / flug) * y;
      const x = n.spur * bahn + bahn / 2, r = 17 * dpr;
      g.globalAlpha = n.status === "daneben" ? .3 : 1;
      g.fillStyle = FARBEN[n.spur]; g.shadowColor = FARBEN[n.spur]; g.shadowBlur = 10 * dpr;
      g.beginPath(); g.roundRect ? g.roundRect(x - r * 1.4, ny - r * .7, r * 2.8, r * 1.4, 7 * dpr) : g.rect(x - r * 1.4, ny - r * .7, r * 2.8, r * 1.4); g.fill();
      g.shadowBlur = 0; g.fillStyle = "#16121a"; g.font = (15 * dpr) + "px serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(ZEICHEN[n.spur], x, ny + 1); g.textBaseline = "alphabetic"; g.globalAlpha = 1;
      /* nicht getroffen → als daneben werten */
      if (!n.status && dt < -FENSTER.knapp) { n.status = "daneben"; spiel.serie = 0; zeigeUrteil("daneben", n.spur); }
    });
    g.fillStyle = "#ebe2cc"; g.textAlign = "left"; g.font = (14 * dpr) + "px Georgia, serif";
    g.fillText(Math.round(spiel.punkte) + " " + t().punkte, 10 * dpr, 22 * dpr);
    if (spiel.serie >= 5) { g.textAlign = "right"; g.fillStyle = "#e0a046"; g.fillText(t().serie(spiel.serie), w - 10 * dpr, 22 * dpr); }
    if (spiel.urteil && jetzt - spiel.urteil.zeit < .6) {
      const a = 1 - (jetzt - spiel.urteil.zeit) / .6;
      g.globalAlpha = a; g.textAlign = "center"; g.font = "bold " + (22 * dpr) + "px Georgia, serif";
      g.fillStyle = spiel.urteil.art === "daneben" ? "#c4564a" : spiel.urteil.art === "perfekt" ? "#ffd27a" : "#ebe2cc";
      g.fillText(t().urteil[spiel.urteil.art], spiel.urteil.spur * bahn + bahn / 2, y - 40 * dpr - (1 - a) * 20 * dpr); g.globalAlpha = 1;
    }
    if (jetzt > spiel.daten.ende) { beenden(); return; }
    requestAnimationFrame(malen);
  }
  function zeigeUrteil(art, spur) { spiel.urteil = { art, spur, zeit: ctx.currentTime - spiel.start }; }

  /* ---------- Spielablauf ---------- */
  function starten() {
    audio();
    ergebnis = null;
    const lied = aktuellesLied();
    const daten = noten(stufe, lied); daten.lied = lied;
    daten.liste.forEach(n => { if (n.spur === 0) saite(bassHz(n.ton), 1.8, .4986); else if (n.spur === 1) saite(melHz(n.ton), 1.4, .4979); });
    saite(hz(45), 1.8, .4986);
    spiel = { daten, start: ctx.currentTime + .35, punkte: 0, serie: 0, besteSerie: 0, streu: 0, blitz: [0, 0, 0], urteil: null };
    spiel.knoten = begleitung(daten, spiel.start);
    zeichnen();
    requestAnimationFrame(malen);
  }
  function abbrechen() {
    if (!spiel) return;
    (spiel.knoten || []).forEach(n => { try { n.stop(); } catch (_) {} });
    if (ausg) { ausg.gain.setTargetAtTime(0, ctx.currentTime, .05); setTimeout(() => { ausg.gain.value = .55; }, 400); }
    spiel = null; zeichnen();
  }
  function tippen(spur) {
    if (!spiel) return;
    const jetzt = ctx.currentTime - spiel.start;
    spiel.blitz[spur] = 1;
    let best = null;
    spiel.daten.liste.forEach(n => { if (n.spur === spur && !n.status && Math.abs(n.zeit - jetzt) <= FENSTER.knapp && (!best || Math.abs(n.zeit - jetzt) < Math.abs(best.zeit - jetzt))) best = n; });
    if (!best) { daneben(ctx.currentTime); spiel.serie = 0; spiel.streu++; zeigeUrteil("daneben", spur); spiel.punkte = Math.max(0, spiel.punkte - FEHLGRIFF); return; }
    const d = Math.abs(best.zeit - jetzt), art = d <= FENSTER.perfekt ? "perfekt" : d <= FENSTER.gut ? "gut" : "knapp";
    best.status = art; spiel.serie++; spiel.besteSerie = Math.max(spiel.besteSerie, spiel.serie);
    spiel.punkte += PUNKTE[art] * (1 + Math.min(spiel.serie, 20) * .025);
    /* zu früh getippt? Dann erklingt der Ton trotzdem genau im Takt */
    ton(spur, best.ton, Math.max(ctx.currentTime, spiel.start + best.zeit));
    zeigeUrteil(art, spur);
  }
  function beenden() {
    const T = t(), liste = spiel.daten.liste;
    const summe = liste.reduce((a, n) => a + (PUNKTE[n.status] || 0), 0) - spiel.streu * FEHLGRIFF;
    const prozent = Math.max(0, Math.round(summe / (liste.length * 100) * 100));
    const getroffen = liste.filter(n => PUNKTE[n.status]).length;
    let w20 = Math.round(1 + (prozent / 100) * 19 + (Math.random() * 2 - 1));
    w20 = Math.max(1, Math.min(20, w20));
    if (prozent >= 95 && Math.random() < .6) w20 = 20;
    if (prozent < 20) w20 = 1;
    const ges = w20 + 7;
    const stufeText = w20 === 20 ? "krit" : w20 === 1 ? "patzer" : ges <= 11 ? "schwach" : ges <= 16 ? "maessig" : ges <= 21 ? "gut" : ges <= 25 ? "stark" : "legende";
    const rek = rekordLesen(), alt = rek[stufe] || 0, neu = ges > alt;
    if (neu) { rek[stufe] = ges; try { localStorage.setItem("imres-auftritt-rekord", JSON.stringify(rek)); } catch (_) {} }
    ergebnis = { lied: spiel.daten.lied, w20, summe: ges, prozent, getroffen, gesamt: liste.length, serie: spiel.besteSerie, streu: spiel.streu, zitat: zufall(T.stimmen[stufeText]), neu: neu && alt > 0, rekord: Math.max(alt, ges) };
    spiel = null;
    if (liedWahl === "neu") erfunden = null; /* nächster Auftritt: wieder ein neues Lied */
    publikum(ges >= 17);
    zeichnen();
  }

  /* ---------- Eingaben ---------- */
  const TASTEN = { a: 0, s: 1, d: 2, j: 0, k: 1, l: 2, arrowleft: 0, arrowdown: 1, arrowright: 2 };
  window.addEventListener("keydown", e => {
    if (!spiel || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const k = TASTEN[String(e.key).toLowerCase()];
    if (k == null) return;
    e.preventDefault(); tippen(k);
  });
  root.addEventListener("pointerdown", e => {
    const c = e.target.closest(".at-canvas");
    if (!c || !spiel) return;
    e.preventDefault();
    const r = c.getBoundingClientRect();
    tippen(Math.max(0, Math.min(2, Math.floor((e.clientX - r.left) / (r.width / 3)))));
  });
  root.addEventListener("click", e => {
    const st = e.target.closest("[data-stufe]");
    if (st && !spiel) { stufe = st.dataset.stufe; try { localStorage.setItem("imres-auftritt-stufe", stufe); } catch (_) {} ergebnis = null; zeichnen(); bestenLaden(); return; }
    const ld = e.target.closest("[data-lied]");
    if (ld && !spiel) { liedWahl = ld.dataset.lied; if (liedWahl === "neu") erfunden = liedErfinden(); try { localStorage.setItem("imres-auftritt-lied", liedWahl); } catch (_) {} ergebnis = null; zeichnen(); bestenLaden(); return; }
    if (e.target.closest(".at-eintragen")) { eintragen(); return; }
    if (e.target.closest(".at-start")) { spiel ? abbrechen() : starten(); }
  });
  window.addEventListener("resize", () => { if (!spiel) malenRuhe(); });
  root.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".at-name")) { e.preventDefault(); eintragen(); } });

  /* ---------- Bestenliste: gemeinsam über Supabase, sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    return fetch(SERVER.url + pfad, body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status));
  }
  const besten = {}; let serverOk = null, meinEintrag = null;
  /* jede Liste gehört zu Publikum + Lied; alle erfundenen Lieder teilen sich eine Liste */
  const listenSchluessel = () => stufe + "|" + liedWahl;
  const liedFilter = () => liedWahl === "neu" ? "lied=like." + encodeURIComponent("neu|*") : "lied=eq." + liedWahl;
  const liedAnzeige = (feld, T) => String(feld || "").startsWith("neu|") ? String(feld).slice(4) : (T.lieder[feld] || feld);
  const lokalLesen = () => { try { return JSON.parse(localStorage.getItem("imres-auftritt-liste") || "{}") || {}; } catch (_) { return {}; } };
  const sortieren = l => l.sort((a, b) => b.prozent - a.prozent || b.serie - a.serie || String(a.erstellt).localeCompare(String(b.erstellt)));
  function bestenLaden() {
    const k = listenSchluessel();
    return server("/rest/v1/auftritt_bestenliste?select=name,lied,prozent,wurf,serie,erstellt&stufe=eq." + stufe + "&" + liedFilter() + "&order=prozent.desc,serie.desc,erstellt.asc&limit=10")
      .then(l => { besten[k] = Array.isArray(l) ? l : []; serverOk = true; })
      .catch(() => { serverOk = false; besten[k] = sortieren(lokalLesen()[k] || []).slice(0, 10); })
      .then(listeNeu);
  }
  function listeNeu() { const el = root.querySelector(".at-liste"); if (el) el.innerHTML = listeHtml(t()); }
  function listeHtml(T) {
    const l = besten[listenSchluessel()];
    if (!l) return "";
    const mitLied = liedWahl === "neu", sp = mitLied ? T.spalten : T.spalten.slice(0, 4);
    return '<h4>' + T.bestenliste + " · " + esc(T.stufen[stufe]) + " · " + esc(liedWahl === "neu" ? T.neuesLied : T.lieder[liedWahl]) + "</h4>" +
      (l.length ? '<table><thead><tr>' + sp.map(x => "<th>" + x + "</th>").join("") + "</tr></thead><tbody>" +
        l.map((e, i) => '<tr' + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.prozent + " %</td><td>" + e.wurf + "</td>" + (mitLied ? "<td>" + esc(liedAnzeige(e.lied, T)) + "</td>" : "") + "</tr>").join("") +
        "</tbody></table>" : '<p class="at-leer">' + T.leer + "</p>") +
      (serverOk === false ? '<p class="at-leer">' + T.nurHier + "</p>" : "");
  }
  function eintragHtml(T) {
    if (ergebnis.eingetragen) return '<p class="at-eingetragen">' + esc(ergebnis.eingetragen) + "</p>";
    let name = ""; try { name = localStorage.getItem("imres-auftritt-name") || ""; } catch (_) {}
    return '<div class="at-eintrag"><input type="text" class="at-name" maxlength="24" placeholder="' + esc(T.deinName) + '" value="' + esc(name) + '">' +
      '<button type="button" class="tav-knopf at-eintragen">' + T.eintragen + "</button></div>";
  }
  function eintragen() {
    if (!ergebnis || ergebnis.eingetragen || ergebnis.sendet) return;
    const feld = root.querySelector(".at-name"), name = feld ? feld.value.trim().slice(0, 24) : "";
    if (!name) { if (feld) feld.focus(); return; }
    try { localStorage.setItem("imres-auftritt-name", name); } catch (_) {}
    const T = t(), e = { name, lied: ergebnis.lied.key ? ergebnis.lied.key : "neu|" + liedName(ergebnis.lied, T).slice(0, 36), prozent: ergebnis.prozent, wurf: ergebnis.summe, serie: ergebnis.serie, erstellt: new Date().toISOString() };
    const lok = lokalLesen(), k = listenSchluessel(); lok[k] = sortieren((lok[k] || []).concat([e])).slice(0, 10);
    try { localStorage.setItem("imres-auftritt-liste", JSON.stringify(lok)); } catch (_) {}
    const erg = ergebnis, k2 = listenSchluessel(); erg.sendet = true;
    const fertig = () => {
      erg.sendet = false;
      const l = besten[k2] || [];
      const platz = l.findIndex(x => x.name === e.name && x.prozent === e.prozent && x.serie === e.serie) + 1;
      if (platz) meinEintrag = l[platz - 1].erstellt;
      erg.eingetragen = platz ? T.eingetragen(platz) : T.eingetragenOhne;
      if (ergebnis === erg && !spiel) zeichnen(); else listeNeu();
    };
    server("/rest/v1/rpc/auftritt_eintragen", { p_name: e.name, p_stufe: stufe, p_lied: e.lied, p_prozent: e.prozent, p_wurf: e.wurf, p_serie: e.serie })
      .catch(() => {}).then(bestenLaden).then(fertig);
  }

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.auftritt { grid-column: 1 / -1; }
.at-stufen { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; font-size: .85rem; color: var(--ash); }
.at-stufen button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .85rem; padding: .35rem .8rem; cursor: pointer; }
.at-stufen button[aria-pressed="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.at-buehne { position: relative; max-width: 560px; width: 100%; margin: 0 auto; }
.at-canvas { display: block; width: 100%; height: clamp(300px, 52vw, 400px); background: radial-gradient(ellipse at 50% 90%, rgba(224,160,70,.14), transparent 70%), rgba(16,14,21,.7); border: 1px solid var(--line); touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; }
.at-ergebnis { position: absolute; inset: 0; display: grid; align-content: center; justify-items: center; gap: .45rem; padding: 1rem; text-align: center; background: rgba(16,14,21,.88); border: 1px solid var(--ember); }
.at-ergebnis[hidden] { display: none; }
.at-w20 { width: 4.6rem; height: 4.6rem; display: grid; place-items: center; font-family: var(--display); font-size: 2.2rem; color: var(--night); background: var(--ember); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); animation: atroll .9s cubic-bezier(.3,1.4,.5,1); }
.at-w20.krit { background: #ffd27a; box-shadow: 0 0 30px #ffd27a; }
.at-w20.patzer { background: var(--blood); color: var(--vellum); }
@keyframes atroll { from { transform: rotate(-540deg) scale(.3); } }
.at-summe { font-family: var(--name); font-size: 1.25rem; color: var(--vellum); margin: 0; }
.at-zitat { font-style: italic; color: var(--vellum); max-width: 26rem; margin: 0; }
.at-werte, .at-rekord { font-size: .82rem; color: var(--ash); margin: 0; }
.at-rekord { color: var(--ember); }
.at-steuer { font-size: .8rem; color: var(--ash); text-align: center; margin: 0; }
.at-fuss { display: flex; justify-content: center; }
.at-erfunden { font-family: var(--hand); font-size: 1.15rem; color: var(--ember); margin-left: .3rem; }
.at-eintrag { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
.at-name { background: rgba(0,0,0,.3); border: 1px solid var(--line); color: var(--vellum); font: inherit; padding: .45rem .7rem; min-width: 0; width: 12rem; }
.at-eingetragen { text-align: center; color: var(--ember); margin: 0; }
.at-liste { max-width: 560px; width: 100%; margin: 0 auto; }
.at-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .4rem 0; }
.at-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.at-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.at-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.at-liste td:last-child { color: var(--ash); font-size: .8rem; }
.at-liste tr.mein td { color: var(--ember); }
.at-leer { font-size: .82rem; color: var(--ash); margin: .3rem 0; }
`;
  document.head.appendChild(css);

  root._zustand = () => ({ spiel, ctx }); /* für automatische Tests */
  zeichnen();
  bestenLaden();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); if (!spiel) zeichnen(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
