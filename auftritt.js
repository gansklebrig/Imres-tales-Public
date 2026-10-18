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
      genau: p => "Treffsicherheit: " + p + " %", rekord: n => "Bisher bester Wurf hier: " + n, neuRekord: "Neuer Rekord vor diesem Publikum!",
      wurf: (w, s) => "W20: " + w + " + 7 Auftreten = " + s,
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
      genau: p => "Accuracy: " + p + " %", rekord: n => "Best roll here so far: " + n, neuRekord: "New record in front of this audience!",
      wurf: (w, s) => "d20: " + w + " + 7 Performance = " + s,
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

  /* ---------- Schwierigkeit ---------- */
  const STUFEN = {
    leicht: { tempo: 92, flug: 1.7, takte: 10, raster: 2, schelle: .25, akkord: 0 },
    mittel: { tempo: 108, flug: 1.4, takte: 12, raster: 2, schelle: .6, akkord: .1 },
    schwer: { tempo: 124, flug: 1.15, takte: 12, raster: 1, schelle: .8, akkord: .3 }
  };
  const FENSTER = { perfekt: .055, gut: .11, knapp: .16 };
  const PUNKTE = { perfekt: 100, gut: 70, knapp: 40 };
  const FARBEN = ["#b5643c", "#e0a046", "#f0d48a"];
  const ZEICHEN = ["♩", "♪", "🔔"];

  /* ---------- Noten: dorisch in D, Akkordfolge i – VII – IV – i ---------- */
  const SKALA = [0, 2, 3, 5, 7, 9, 10, 12, 14, 15];
  const FOLGE = [0, 6, 3, 0, 0, 6, 3, 4];
  const MOTIVE = [[0, 2, 4, 6, 8, 12], [0, 3, 6, 8, 10, 12], [0, 2, 4, 8, 10, 14], [0, 4, 6, 8, 12, 14]];
  function noten(stufe) {
    const st = STUFEN[stufe], schritt = 60 / st.tempo / 4, vor = 16 * schritt, liste = [];
    const motivFolge = [0, 0, 1, 0, 2, 2, 3, 1, 0, 0, 1, 3];
    for (let takt = 0; takt < st.takte; takt++) {
      const grund = FOLGE[takt % FOLGE.length], motiv = MOTIVE[motivFolge[takt % motivFolge.length]];
      const belegt = {};
      const setze = (s, spur, ton) => {
        if (st.raster === 2 && s % 2) return;
        if (!st.akkord && belegt[s] != null) return;
        if (belegt[s] === spur) return;
        belegt[s] = spur;
        liste.push({ zeit: vor + (takt * 16 + s) * schritt, spur, ton, status: null });
      };
      /* Bass auf den Schlägen, im letzten Takt eine Abschlussnote */
      [0, 8].concat(stufe === "leicht" ? [] : [4, 12]).forEach(s => { if (s === 0 || Math.random() < .7) setze(s, 0, grund); });
      /* Laute: das Motiv, Tonhöhen wandern über die Akkordtöne */
      let ton = grund + 4;
      motiv.forEach(s => { if (belegt[s] === 0 && !st.akkord) return; ton = Math.max(0, Math.min(9, ton + zufall([-2, -1, 1, 2, 0]))); setze(s, 1, ton); });
      /* Schellen auf den Nachschlägen */
      [2, 6, 10, 14].forEach(s => { if (Math.random() < st.schelle && belegt[s] == null) setze(s, 2, 0); });
    }
    liste.sort((a, b) => a.zeit - b.zeit);
    return { liste, ende: vor + st.takte * 16 * schritt + 1.2, schritt, vor };
  }

  /* ---------- Klang ---------- */
  let ctx = null, ausg = null, rausch = null;
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      const komp = ctx.createDynamicsCompressor(); komp.threshold.value = -14; komp.ratio.value = 3;
      ausg = ctx.createGain(); ausg.gain.value = .55; ausg.connect(komp); komp.connect(ctx.destination);
      rausch = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = rausch.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function zupf(f, z, laut, dauer, typ) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = typ || "triangle"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.setValueAtTime(f * 6, z); lp.frequency.exponentialRampToValueAtTime(f * 1.5, z + dauer);
    g.gain.setValueAtTime(laut, z); g.gain.exponentialRampToValueAtTime(.0008, z + dauer);
    o.connect(lp); lp.connect(g); g.connect(ausg); o.start(z); o.stop(z + dauer + .05);
  }
  function rauschen(z, typ, f, laut, dauer) {
    const r = ctx.createBufferSource(), b = ctx.createBiquadFilter(), g = ctx.createGain();
    r.buffer = rausch; b.type = typ; b.frequency.value = f;
    g.gain.setValueAtTime(laut, z); g.gain.exponentialRampToValueAtTime(.0008, z + dauer);
    r.connect(b); b.connect(g); g.connect(ausg); r.start(z, Math.random() * .5, dauer + .02);
  }
  const ton = (spur, n, z) => {
    if (spur === 0) zupf(hz(38 + SKALA[n % 7]), z, .7, .5, "triangle");
    else if (spur === 1) { zupf(hz(62 + SKALA[n]), z, .45, .7, "triangle"); zupf(hz(62 + SKALA[n]) * 2, z, .08, .3, "sine"); }
    else { rauschen(z, "highpass", 6500, .25, .15); zupf(5200 + Math.random() * 2000, z, .03, .08, "sine"); }
  };
  const daneben = z => { zupf(hz(49), z, .3, .25, "sawtooth"); rauschen(z, "lowpass", 300, .25, .08); };
  function begleitung(daten, start) {
    /* Trommel und Bordun halten den Takt, damit man ihn spürt */
    const n = Math.round((daten.ende - 1.2) / daten.schritt);
    for (let i = 0; i < n; i += 4) {
      const z = start + i * daten.schritt, betont = i % 16 === 0;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(betont ? 110 : 90, z); o.frequency.exponentialRampToValueAtTime(48, z + .15);
      g.gain.setValueAtTime(betont ? .5 : .28, z); g.gain.exponentialRampToValueAtTime(.001, z + .25);
      o.connect(g); g.connect(ausg); o.start(z); o.stop(z + .3);
      if (i < 16) rauschen(z, "bandpass", 1800, .25, .04); /* Einzähler */
    }
    const bo = ctx.createOscillator(), bg = ctx.createGain(), bl = ctx.createBiquadFilter();
    bo.type = "triangle"; bo.frequency.value = hz(38); bl.type = "lowpass"; bl.frequency.value = 400;
    bg.gain.setValueAtTime(0, start); bg.gain.linearRampToValueAtTime(.06, start + daten.vor); bg.gain.setValueAtTime(.06, start + daten.ende - 1.5); bg.gain.linearRampToValueAtTime(0, start + daten.ende);
    bo.connect(bl); bl.connect(bg); bg.connect(ausg); bo.start(start); bo.stop(start + daten.ende + .1);
    return [bo];
  }
  function publikum(gut) {
    const z = ctx.currentTime + .1;
    if (gut) {
      for (let i = 0; i < 40; i++) rauschen(z + Math.random() * 2.2, "bandpass", 1100 + Math.random() * 800, .25 + Math.random() * .3, .03);
      for (let i = 0; i < 5; i++) { const s = z + Math.random() * .4; rauschen(s, "bandpass", 700 + Math.random() * 600, .12, 2); }
    } else {
      for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) zupf(4300, z + k * .6 + i * .07, .05, .05, "sine"); /* Grillen … */
    }
  }

  /* ---------- Zustand ---------- */
  let stufe = "mittel";
  try { stufe = localStorage.getItem("imres-auftritt-stufe") || "mittel"; } catch (_) {}
  if (!STUFEN[stufe]) stufe = "mittel";
  let spiel = null, ergebnis = null;
  const rekordLesen = () => { try { return JSON.parse(localStorage.getItem("imres-auftritt-rekord") || "{}") || {}; } catch (_) { return {}; } };

  /* ---------- Oberfläche ---------- */
  function zeichnen() {
    const T = t();
    root.innerHTML =
      '<p class="label">' + T.label + "</p><h3>" + T.titel + '</h3><p class="tav-info">' + T.text + "</p>" +
      '<div class="at-stufen"><span>' + T.publikum + ":</span>" +
        Object.keys(STUFEN).map(k => '<button type="button" data-stufe="' + k + '" aria-pressed="' + (k === stufe) + '">' + T.stufen[k] + "</button>").join("") + "</div>" +
      '<div class="at-buehne"><canvas class="at-canvas" width="560" height="380" aria-label="' + esc(T.titel) + '"></canvas>' +
        '<div class="at-ergebnis" ' + (ergebnis ? "" : "hidden") + ">" + (ergebnis ? ergebnisHtml(T) : "") + "</div></div>" +
      '<p class="at-steuer">' + T.steuerung + "</p>" +
      '<div class="at-fuss"><button type="button" class="tav-knopf at-start">' + (spiel ? T.abbrechen : (ergebnis ? T.nochmal : T.start)) + "</button></div>";
    malenRuhe();
  }
  function ergebnisHtml(T) {
    const e = ergebnis;
    return '<p class="label">' + T.ergebnis + "</p>" +
      '<div class="at-w20' + (e.w20 === 20 ? " krit" : e.w20 === 1 ? " patzer" : "") + '">' + e.w20 + "</div>" +
      '<p class="at-summe">' + T.wurf(e.w20, e.summe) + "</p>" +
      '<p class="at-zitat">„' + esc(e.zitat) + "“</p>" +
      '<p class="at-werte">' + T.genau(e.prozent) + " · " + T.treffer(e.getroffen, e.gesamt) + " · " + T.beste(e.serie) + "</p>" +
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
    for (let i = 0; i < 3; i++) { g.strokeStyle = "rgba(224,160,70,.6)"; g.lineWidth = 2 * dpr; g.beginPath(); g.arc(i * bahn + bahn / 2, y, 16 * dpr, 0, Math.PI * 2); g.stroke(); }
    return y;
  }
  function malenRuhe() {
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d");
    const y = grund(g, w, h, dpr);
    if (!spiel && !ergebnis) {
      g.fillStyle = "rgba(235,226,204,.75)"; g.font = "italic " + (18 * dpr) + "px Georgia, serif"; g.textAlign = "center";
      g.fillText("🎻  " + t().stufen[stufe], w / 2, y / 2);
    }
  }
  function malen() {
    if (!spiel) return;
    const c = canvas(); if (!c) return;
    const { w, h, dpr } = maße(c), g = c.getContext("2d"), jetzt = ctx.currentTime - spiel.start;
    spiel.blitz = spiel.blitz.map(b => Math.max(0, b - .06));
    const y = grund(g, w, h, dpr, spiel.blitz), bahn = w / 3, flug = STUFEN[stufe].flug;
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
    const daten = noten(stufe);
    spiel = { daten, start: ctx.currentTime + .25, punkte: 0, serie: 0, besteSerie: 0, blitz: [0, 0, 0], urteil: null };
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
    if (!best) { daneben(ctx.currentTime); spiel.serie = 0; zeigeUrteil("daneben", spur); spiel.punkte = Math.max(0, spiel.punkte - 10); return; }
    const d = Math.abs(best.zeit - jetzt), art = d <= FENSTER.perfekt ? "perfekt" : d <= FENSTER.gut ? "gut" : "knapp";
    best.status = art; spiel.serie++; spiel.besteSerie = Math.max(spiel.besteSerie, spiel.serie);
    spiel.punkte += PUNKTE[art] * (1 + Math.min(spiel.serie, 20) * .025);
    ton(spur, best.ton, ctx.currentTime);
    zeigeUrteil(art, spur);
  }
  function beenden() {
    const T = t(), liste = spiel.daten.liste;
    const summe = liste.reduce((a, n) => a + (PUNKTE[n.status] || 0), 0), prozent = Math.round(summe / (liste.length * 100) * 100);
    const getroffen = liste.filter(n => PUNKTE[n.status]).length;
    let w20 = Math.round(1 + (prozent / 100) * 19 + (Math.random() * 4 - 2));
    w20 = Math.max(1, Math.min(20, w20));
    if (prozent >= 96 && Math.random() < .5) w20 = 20;
    if (prozent < 15) w20 = 1;
    const ges = w20 + 7;
    const stufeText = w20 === 20 ? "krit" : w20 === 1 ? "patzer" : ges <= 11 ? "schwach" : ges <= 16 ? "maessig" : ges <= 21 ? "gut" : ges <= 25 ? "stark" : "legende";
    const rek = rekordLesen(), alt = rek[stufe] || 0, neu = ges > alt;
    if (neu) { rek[stufe] = ges; try { localStorage.setItem("imres-auftritt-rekord", JSON.stringify(rek)); } catch (_) {} }
    ergebnis = { w20, summe: ges, prozent, getroffen, gesamt: liste.length, serie: spiel.besteSerie, zitat: zufall(T.stimmen[stufeText]), neu: neu && alt > 0, rekord: Math.max(alt, ges) };
    spiel = null;
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
    if (st && !spiel) { stufe = st.dataset.stufe; try { localStorage.setItem("imres-auftritt-stufe", stufe); } catch (_) {} ergebnis = null; zeichnen(); return; }
    if (e.target.closest(".at-start")) { spiel ? abbrechen() : starten(); }
  });
  window.addEventListener("resize", () => { if (!spiel) malenRuhe(); });

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
`;
  document.head.appendChild(css);

  root._zustand = () => ({ spiel, ctx }); /* für automatische Tests */
  zeichnen();
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); if (!spiel) zeichnen(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
