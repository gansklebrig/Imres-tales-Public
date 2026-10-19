/* =====================================================================
   FRIEDRICHS JAGD – Bogenspiel in der Taverne
   Nachts auf der Lichtung: Goblins, Banditen und Kreaturen aus dem
   Bestiarium ziehen vorbei (Goblins & Banditen sind selbst gemalt).
   Ziehen & loslassen spannt den Bogen (wie eine Schleuder). Rex bellt,
   bevor etwas auftaucht. Nach jeder Welle wählt man eine Gabe
   (Doppelschuss, Feuerpfeile, Rex packt zu …). Welle 4: Bugbear-Anführer,
   Welle 10: Demogorgon. Danach geht die Nacht endlos weiter.
   Drei Schwierigkeitsstufen, Pause-Knopf, Bonusziele (Hase, Blatt im Wind)
   und eine gemeinsame Bestenliste (Supabase-Tabelle jagd_bestenliste).
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("waldlauf");
  if (!root) return;

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mischen = l => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };

  /* ---------- Texte ---------- */
  const TX = {
    de: {
      label: "Waldläufer-Probe", titel: "Friedrichs Jagd",
      text: "Nachts auf der Lichtung schleichen Goblins, Banditen und die Kreaturen aus dem Bestiarium ums Lager. Spann den Bogen und halte sie fern – und hör auf Rex: Er wittert sie zuerst.",
      steuerung: "Irgendwo ins Bild tippen, zurückziehen, zielen, loslassen. Je weiter du ziehst, desto kräftiger der Schuss.",
      start: "▶ Auf die Jagd", weiter: "▶ Weiter", nochmal: "↻ Neue Jagd", beenden: "Jagd beenden",
      pause: "Kurze Rast", pauseText: "Die Jagd wartet auf dich.",
      welle: n => "Welle " + n, serie: n => "Serie ×" + n,
      wellen: ["Goblins auf der Straße", "Banditen im Hinterhalt", "Die Goblinhöhle", "Der Wachturm", "Etwas raschelt im Unterholz", "Das verlassene Dorf", "Schwingen über den Wipfeln", "Ein Summen in der Luft", "Die Pforten des Unterreichs", "Der Dämonenfürst"],
      endlos: "Die Nacht wird länger",
      wuff: "Wuff!", grr: "Grrr!", entkommen: "Entkommen!", doppel: "Doppeltreffer!", dreifach: "Dreifachtreffer!",
      bossFaellt: { demogorgon: "Demogorgon fällt!", anfuehrer: "Der Anführer fällt!" },
      bossRuft: { demogorgon: "Demogorgon brüllt!", anfuehrer: "Ein Bugbear-Anführer!" },
      bonus: { hase: "Fliehender Hase", blatt: "Blatt im Wind" }, bonusDa: { hase: "Ein Hase! Schnell!", blatt: "Ein Blatt im Wind …" },
      stufenTitel: "Schwierigkeit", stufen: { lehrling: "🌱 Lehrling", waldlaeufer: "🏹 Waldläufer", legende: "🐉 Legende" },
      stufenText: { lehrling: "Langsamere Gegner, 7 Leben.", waldlaeufer: "Die Jagd, wie Friedrich sie kennt. 5 Leben.", legende: "Schnell, gnadenlos, 4 Leben." },
      pauseKnopf: "Pause",
      bestenliste: "🏆 Bestenliste", nurHier: "Noch nur auf diesem Gerät gespeichert.", leer: "Noch niemand – sei die erste Legende!",
      eintragen: "🏆 Eintragen", deinName: "Dein Name", eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!",
      spalten: ["#", "Name", "Punkte", "Welle"],
      rast: "Rast am Lagerfeuer", rastText: "Wähle eine Gabe für die nächste Welle.",
      bossSieg: "Demogorgon ist besiegt! Die Nacht ist aber noch nicht vorbei …",
      stufe: (a, b) => "Stufe " + a + "/" + b,
      gaben: {
        mehrfach: [["Doppelschuss", "Zwei Pfeile auf einmal."], ["Dreifachschuss", "Drei Pfeile im Fächer."]],
        feuer: [["Feuerpfeile", "Treffer setzen alles in der Nähe in Brand."], ["Glutpfeile", "Größere Flammen, doppelter Schaden."]],
        zug: [["Schneller Zug", "Der Bogen ist schneller wieder gespannt."]],
        durchschlag: [["Durchschlag", "Pfeile fliegen durch einen Gegner hindurch."], ["Großer Durchschlag", "Pfeile durchbohren zwei Gegner."]],
        rex: [["Rex packt zu", "Rex stürzt sich auf Gegner am Boden und hält sie fest."], ["Bissiger Rex", "Rex packt öfter und fester zu."]],
        adler: [["Adlerauge", "Die Flugbahn ist viel weiter zu sehen."]],
        echo: [["Echos Ranken", "Wurzeln aus dem Boden bremsen alle Gegner."]],
        rast: [["Rast am Feuer", "+2 Leben fürs Lager."]],
        barradin: [["Barradins Inspiration", "Ein Lied im Ohr: Serien bringen doppelt so viele Punkte."]]
      },
      ende: "Das Lager ist gefallen", endeText: "Die Kreaturen haben das Feuer erreicht.",
      punkte: "Punkte", wert: { welle: "Welle", erlegt: "Erlegt", genau: "Treffsicherheit", bonus: "Bonusziele" },
      bossJa: "besiegt ✓", bossNein: "–",
      rekord: (n, st) => "Dein Rekord (" + st + "): " + n + " Punkte", neuRekord: "Neuer Rekord!",
      ton: ["🔊 Ton an", "🔈 Ton aus"],
      spruch: {
        schwach: ["Der Wald war heute lauter als mein Bogen. Morgen wieder.", "Rex hat mehr erwischt als ich. Sagt es nicht weiter.", "Manchmal ist es klüger, das Lager zu räumen. Heute war so ein Tag."],
        mittel: ["Ordentliche Jagd. Kaum ein Pfeil verschwendet. Fast.", "Das Lager hat lange gehalten. Mehr verlange ich nicht.", "Ich hätte zuerst mit ihnen reden sollen. Aber sie wollten nicht reden."],
        gut: ["Ein Pfeil, ein Gegner. So hat man es mich gelehrt.", "Der Wald ist wieder still. So mag ich ihn.", "Gute Arbeit, Rex. Du bekommst den größten Knochen."],
        boss: ["Demogorgon liegt. Und diesmal musste ich ihn nicht einmal boxen.", "Erzählt Barradin nichts davon, sonst singt er drei Tage lang.", "Zwei Köpfe, ein Pfeil zu viel. Ruhe in Frieden, Dämonenfürst."],
        legende: ["Die Bäume flüstern meinen Namen. Oder ist das Echo?", "Selbst Ezekiel hat genickt. Einmal.", "Imre blättert hektisch in seinem Monsterhandbuch. Ihm gehen die Gegner aus."]
      }
    },
    en: {
      label: "Ranger check", titel: "Friedrich's Hunt",
      text: "At night in the clearing, goblins, bandits and the creatures of the bestiary creep around the camp. Draw your bow and keep them away – and listen to Rex: he smells them first.",
      steuerung: "Touch anywhere in the picture, pull back, aim, let go. The further you pull, the stronger the shot.",
      start: "▶ Begin the hunt", weiter: "▶ Continue", nochmal: "↻ New hunt", beenden: "End the hunt",
      pause: "A short rest", pauseText: "The hunt is waiting for you.",
      welle: n => "Wave " + n, serie: n => "Streak ×" + n,
      wellen: ["Goblins on the road", "Bandits lying in ambush", "The goblin cave", "The watchtower", "Something rustles in the undergrowth", "The abandoned village", "Wings above the treetops", "A buzzing in the air", "The gates of the Underdark", "The Demon Prince"],
      endlos: "The night grows longer",
      wuff: "Woof!", grr: "Grrr!", entkommen: "Escaped!", doppel: "Double hit!", dreifach: "Triple hit!",
      bossFaellt: { demogorgon: "Demogorgon falls!", anfuehrer: "The leader falls!" },
      bossRuft: { demogorgon: "Demogorgon roars!", anfuehrer: "A bugbear leader!" },
      bonus: { hase: "Fleeing hare", blatt: "Leaf in the wind" }, bonusDa: { hase: "A hare! Quick!", blatt: "A leaf in the wind …" },
      stufenTitel: "Difficulty", stufen: { lehrling: "🌱 Apprentice", waldlaeufer: "🏹 Ranger", legende: "🐉 Legend" },
      stufenText: { lehrling: "Slower enemies, 7 lives.", waldlaeufer: "The hunt as Friedrich knows it. 5 lives.", legende: "Fast, merciless, 4 lives." },
      pauseKnopf: "Pause",
      bestenliste: "🏆 Leaderboard", nurHier: "Only saved on this device for now.", leer: "Nobody yet – be the first legend!",
      eintragen: "🏆 Submit", deinName: "Your name", eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!",
      spalten: ["#", "Name", "Points", "Wave"],
      rast: "Rest at the campfire", rastText: "Choose a gift for the next wave.",
      bossSieg: "Demogorgon is defeated! But the night isn't over yet …",
      stufe: (a, b) => "Level " + a + "/" + b,
      gaben: {
        mehrfach: [["Double shot", "Two arrows at once."], ["Triple shot", "Three arrows in a fan."]],
        feuer: [["Fire arrows", "Hits set everything nearby ablaze."], ["Ember arrows", "Bigger flames, double damage."]],
        zug: [["Quick draw", "The bow is drawn again faster."]],
        durchschlag: [["Piercing", "Arrows fly through one enemy."], ["Great piercing", "Arrows pierce two enemies."]],
        rex: [["Rex bites", "Rex pounces on enemies on the ground and holds them."], ["Fierce Rex", "Rex bites more often and harder."]],
        adler: [["Eagle eye", "You see much more of the flight path."]],
        echo: [["Echo's vines", "Roots from the ground slow all enemies."]],
        rast: [["Rest by the fire", "+2 lives for the camp."]],
        barradin: [["Barradin's inspiration", "A song in your ear: streaks score twice as much."]]
      },
      ende: "The camp has fallen", endeText: "The creatures have reached the fire.",
      punkte: "points", wert: { welle: "Wave", erlegt: "Slain", genau: "Accuracy", bonus: "Bonus targets" },
      bossJa: "defeated ✓", bossNein: "–",
      rekord: (n, st) => "Your record (" + st + "): " + n + " points", neuRekord: "New record!",
      ton: ["🔊 Sound on", "🔈 Sound off"],
      spruch: {
        schwach: ["The forest was louder than my bow today. Tomorrow again.", "Rex caught more than I did. Don't tell anyone.", "Sometimes it's wiser to break camp. Today was such a day."],
        mittel: ["A decent hunt. Hardly an arrow wasted. Almost.", "The camp held for a long time. I ask for no more.", "I should have talked to them first. But they didn't want to talk."],
        gut: ["One arrow, one enemy. That's how I was taught.", "The forest is quiet again. That's how I like it.", "Good work, Rex. You get the biggest bone."],
        boss: ["Demogorgon lies still. And this time I didn't even have to punch him.", "Don't tell Barradin, or he'll sing about it for three days.", "Two heads, one arrow too many. Rest in peace, Demon Prince."],
        legende: ["The trees whisper my name. Or is that Echo?", "Even Ezekiel nodded. Once.", "Imre is frantically leafing through his monster manual. He's running out of enemies."]
      }
    }
  };
  const t = () => TX[sprache()];

  /* ---------- Welt ---------- */
  const W = 400, H = 500, G = 520;
  const SCHULTER = { x: 200, y: 446 };
  const BAHNEN = [{ y: 300, s: 0.58 }, { y: 352, s: 0.78 }, { y: 410, s: 0.98 }];
  const REX_HEIM = { x: 350, y: 486 };
  const FONT_D = '"IM Fell English SC", "Palatino Linotype", Georgia, serif';
  const FONT_H = 'Caveat, "Segoe Print", cursive';

  const ARTEN = {
    goblin:     { malen: "goblin", hoehe: 54, hp: 1, tempo: 62, punkte: 8, art: "boden", blick: -1, hell: 1, splitter: ["#5d6e35", "#8a9b4c", "#3b2a1b"] },
    bandit:     { malen: "bandit", hoehe: 86, hp: 2, tempo: 42, punkte: 15, art: "boden", blick: -1, hell: 1, splitter: ["#7a2f26", "#6b4a30", "#2a2622"] },
    blight:     { bild: "blight-frei.webp", quelle: [400, 0, 700, 605], hoehe: 60, hp: 1, tempo: 52, punkte: 10, art: "boden", blick: 1, hell: 1.9, splitter: ["#3b4a3a", "#6f8a5a", "#2a2f26"] },
    bugbear:    { bild: "bugbear-frei.webp", hoehe: 92, hp: 3, tempo: 33, punkte: 30, art: "boden", blick: -1, splitter: ["#9b3a2f", "#a8783e", "#5a4430"] },
    vrock:      { bild: "vrock-frei.webp", hoehe: 80, hp: 2, tempo: 62, punkte: 20, art: "flug", blick: 1, hell: 1.35, splitter: ["#a89f8f", "#6a6256", "#3a352f"] },
    chasme:     { bild: "chasme-frei.webp", hoehe: 64, hp: 1, tempo: 100, punkte: 25, art: "flug", blick: 1, splitter: ["#c4564a", "#2b3550", "#9b3a2f"] },
    demogorgon: { bild: "demogorgon.webp", hoehe: 196, hp: 28, tempo: 15, punkte: 400, art: "boss", blick: -1, verlust: 3, glut: "rgba(196,86,74,.55)", splitter: ["#e0a046", "#9b3a2f", "#c98a3a"] },
    anfuehrer:  { sprite: "bugbear", hoehe: 140, hp: 12, tempo: 21, punkte: 150, art: "boss", mini: true, blick: -1, verlust: 2, glut: "rgba(224,160,70,.5)", splitter: ["#9b3a2f", "#a8783e", "#e0a046"] },
    hase:       { malen: "hase", hoehe: 34, hp: 1, tempo: 165, punkte: 60, art: "bonus", blick: -1, hell: 1, splitter: ["#8a6a4a", "#ebe2cc", "#5a4430"] },
    blatt:      { malen: "blatt", hoehe: 30, hp: 1, tempo: 0, punkte: 90, art: "bonus", blick: -1, hell: 1, splitter: ["#e0a046", "#ffcf7a", "#c4564a"] }
  };
  const STUFEN = {
    lehrling:    { tempo: 0.75, leben: 7, abstand: 1.35 },
    waldlaeufer: { tempo: 1, leben: 5, abstand: 1 },
    legende:     { tempo: 1.22, leben: 4, abstand: 0.82 }
  };
  let stufeWahl = STUFEN[lies("imres-waldlauf-stufe", "")] ? lies("imres-waldlauf-stufe", "") : "waldlaeufer";

  const GABEN = { mehrfach: 2, feuer: 2, zug: 3, durchschlag: 2, rex: 2, adler: 1, echo: 2, rast: 99, barradin: 1 };
  const GABE_SYM = { mehrfach: "🏹", feuer: "🔥", zug: "⚡", durchschlag: "🎯", rex: "🐕", adler: "🦅", echo: "🌿", rast: "🍖", barradin: "🎶" };

  /* ---------- Bilder ---------- */
  const SPRITES = {};
  let rexBild = null;
  function laden(src, cb) { const i = new Image(); i.decoding = "async"; i.onload = () => cb(i); i.src = src; }
  function vorbereiten(img, q, maxH, hell, ohneRand) {
    const [sx, sy, sw, sh] = q || [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height];
    const f = Math.min(1, maxH / sh), w = Math.max(1, Math.round(sw * f)), h = Math.max(1, Math.round(sh * f));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d");
    x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    if (hell !== 1) try { // etwas aufhellen, damit sie sich vom nächtlichen Gebüsch abheben
      const d = x.getImageData(0, 0, w, h), px = d.data;
      for (let i = 0; i < px.length; i += 4) { px[i] = Math.min(255, px[i] * hell + 14); px[i + 1] = Math.min(255, px[i + 1] * hell + 12); px[i + 2] = Math.min(255, px[i + 2] * hell + 8); }
      x.putImageData(d, 0, 0);
    } catch (_) {}
    x.globalCompositeOperation = "destination-in";
    const fe = ohneRand ? 0.001 : 0.08;
    let g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(fe, "#000"); g.addColorStop(1 - fe, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(fe, "#000"); g.addColorStop(1 - fe, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const s = document.createElement("canvas"); s.width = w; s.height = h;
    const y = s.getContext("2d"); y.translate(w, 0); y.scale(-1, 1); y.drawImage(c, 0, 0);
    return { normal: c, gespiegelt: s, verh: w / h };
  }
  function bilderLaden() {
    Object.keys(ARTEN).forEach(k => {
      const a = ARTEN[k];
      if (a.sprite) return;
      if (a.malen) { const c = MALER[a.malen](); SPRITES[k] = vorbereiten(c, null, 260, 1, true); return; }
      laden(a.bild, img => { SPRITES[k] = vorbereiten(img, a.quelle, k === "demogorgon" ? 440 : 260, a.hell || 1.15); });
    });
    laden("rex-guckt.webp", img => { rexBild = img; });
  }


  /* ---------- Goblin & Bandit: selbst gemalt (es gibt kein Bild auf der Seite) ---------- */
  function malGrund(bw, bh) {
    const c = document.createElement("canvas"); c.width = bw * 2; c.height = bh * 2;
    const x = c.getContext("2d"); x.scale(2, 2); x.lineJoin = "round"; x.lineCap = "round";
    return [c, x];
  }
  function oval(x, cx, cy, rx, ry) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
  const MALER = {
    goblin() {
      const [c, x] = malGrund(150, 150);
      // Beine
      x.lineWidth = 9;
      x.strokeStyle = "#2b2219"; x.beginPath(); x.moveTo(84, 108); x.lineTo(94, 127); x.lineTo(90, 144); x.stroke();
      x.strokeStyle = "#3a2d20"; x.beginPath(); x.moveTo(70, 108); x.lineTo(60, 126); x.lineTo(62, 144); x.stroke();
      x.fillStyle = "#4d5c2a"; oval(x, 86, 146, 9, 4); oval(x, 57, 146, 9, 4);
      // hinterer Arm
      x.strokeStyle = "#4d5c2a"; x.lineWidth = 6; x.beginPath(); x.moveTo(92, 74); x.lineTo(104, 92); x.lineTo(100, 104); x.stroke();
      // Körper (gebückt, zerlumpter Kittel)
      let g = x.createLinearGradient(52, 62, 100, 116); g.addColorStop(0, "#7a5a37"); g.addColorStop(1, "#3b2a1b");
      x.fillStyle = g;
      x.beginPath(); x.moveTo(56, 72); x.quadraticCurveTo(46, 96, 56, 112);
      x.lineTo(62, 118); x.lineTo(68, 111); x.lineTo(75, 119); x.lineTo(82, 111); x.lineTo(89, 118); x.lineTo(97, 110);
      x.quadraticCurveTo(105, 86, 92, 66); x.quadraticCurveTo(74, 56, 56, 72); x.fill();
      x.strokeStyle = "#1e1712"; x.lineWidth = 3; x.beginPath(); x.moveTo(52, 98); x.quadraticCurveTo(76, 104, 100, 96); x.stroke();
      x.fillStyle = "#a8783e"; x.fillRect(70, 97, 6, 5);
      // Ohren
      x.fillStyle = "#6b7d3e";
      x.beginPath(); x.moveTo(62, 44); x.lineTo(104, 22); x.lineTo(68, 58); x.closePath(); x.fill();
      x.fillStyle = "#3f4b22"; x.beginPath(); x.moveTo(68, 46); x.lineTo(96, 28); x.lineTo(70, 54); x.closePath(); x.fill();
      x.fillStyle = "#5d6e35"; x.beginPath(); x.moveTo(50, 36); x.lineTo(66, 10); x.lineTo(60, 40); x.closePath(); x.fill();
      // Kopf
      g = x.createRadialGradient(46, 44, 4, 52, 52, 26); g.addColorStop(0, "#9aac56"); g.addColorStop(1, "#4d5c2a");
      x.fillStyle = g; oval(x, 52, 52, 22, 19);
      // Nase
      x.fillStyle = "#7d8f43"; x.beginPath(); x.moveTo(34, 49); x.lineTo(16, 61); x.lineTo(36, 61); x.closePath(); x.fill();
      // Brauen & Augen
      x.strokeStyle = "#2a3115"; x.lineWidth = 3; x.beginPath(); x.moveTo(33, 41); x.lineTo(50, 45); x.stroke();
      x.save(); x.shadowColor = "#ffd34d"; x.shadowBlur = 8; x.fillStyle = "#ffd34d"; oval(x, 42, 49, 5, 3.2); x.restore();
      x.fillStyle = "#1a1408"; oval(x, 41, 49, 1.2, 2.6);
      // Maul mit Zähnen
      x.strokeStyle = "#2a1c12"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(30, 66); x.quadraticCurveTo(40, 70, 50, 66); x.stroke();
      x.fillStyle = "#efe6cf";
      x.beginPath(); x.moveTo(34, 66); x.lineTo(36, 61); x.lineTo(38, 67); x.fill();
      x.beginPath(); x.moveTo(44, 67); x.lineTo(46, 62); x.lineTo(48, 66); x.fill();
      // vorderer Arm mit Krummsäbel
      x.strokeStyle = "#5d6e35"; x.lineWidth = 7; x.beginPath(); x.moveTo(62, 74); x.lineTo(46, 88); x.lineTo(34, 78); x.stroke();
      x.strokeStyle = "#5a4430"; x.lineWidth = 4; x.beginPath(); x.moveTo(36, 82); x.lineTo(30, 72); x.stroke();
      x.strokeStyle = "#3a2d20"; x.lineWidth = 3; x.beginPath(); x.moveTo(25, 77); x.lineTo(39, 69); x.stroke();
      g = x.createLinearGradient(10, 20, 32, 70); g.addColorStop(0, "#d6d2c4"); g.addColorStop(1, "#7f7a6c");
      x.fillStyle = g;
      x.beginPath(); x.moveTo(29, 72); x.quadraticCurveTo(10, 56, 8, 22); x.quadraticCurveTo(24, 44, 34, 70); x.closePath(); x.fill();
      x.strokeStyle = "rgba(155,58,47,.7)"; x.lineWidth = 1; x.beginPath(); x.moveTo(12, 40); x.lineTo(14, 46); x.stroke();
      return c;
    },
    bandit() {
      const [c, x] = malGrund(120, 200);
      // Umhang hinten
      x.fillStyle = "#24211d";
      x.beginPath(); x.moveTo(60, 56); x.quadraticCurveTo(104, 110, 100, 176); x.lineTo(90, 170); x.lineTo(82, 178); x.lineTo(72, 140); x.closePath(); x.fill();
      // Beine & Stiefel
      x.lineWidth = 11;
      x.strokeStyle = "#2c2826"; x.beginPath(); x.moveTo(70, 126); x.lineTo(78, 158); x.lineTo(78, 180); x.stroke();
      x.strokeStyle = "#35302d"; x.beginPath(); x.moveTo(56, 126); x.lineTo(48, 158); x.lineTo(46, 180); x.stroke();
      x.strokeStyle = "#1c1611"; x.lineWidth = 12;
      x.beginPath(); x.moveTo(78, 176); x.lineTo(78, 194); x.lineTo(68, 196); x.stroke();
      x.beginPath(); x.moveTo(46, 176); x.lineTo(46, 194); x.lineTo(36, 196); x.stroke();
      // Lederwams
      let g = x.createLinearGradient(40, 60, 84, 132); g.addColorStop(0, "#7a5638"); g.addColorStop(1, "#3e2a1b");
      x.fillStyle = g;
      x.beginPath(); x.moveTo(44, 62); x.lineTo(78, 62); x.quadraticCurveTo(86, 96, 84, 134); x.lineTo(40, 134); x.quadraticCurveTo(38, 96, 44, 62); x.fill();
      x.strokeStyle = "#2a1c12"; x.lineWidth = 4; x.beginPath(); x.moveTo(46, 66); x.lineTo(80, 108); x.stroke();
      x.fillStyle = "#1e1712"; x.fillRect(40, 110, 45, 7);
      x.fillStyle = "#c9a35a"; x.fillRect(58, 110, 7, 7);
      x.fillStyle = "#3b2a1b"; x.fillRect(74, 117, 8, 12); // Beutel
      // hinterer Arm mit Dolch
      x.strokeStyle = "#4a3424"; x.lineWidth = 8; x.beginPath(); x.moveTo(76, 70); x.lineTo(86, 96); x.lineTo(84, 116); x.stroke();
      x.strokeStyle = "#bdb9ad"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(84, 118); x.lineTo(90, 134); x.stroke();
      // Kapuze & Gesicht
      x.fillStyle = "#2a2622";
      x.beginPath(); x.moveTo(38, 66); x.quadraticCurveTo(34, 22, 60, 16); x.quadraticCurveTo(84, 18, 82, 50); x.quadraticCurveTo(82, 62, 78, 68); x.closePath(); x.fill();
      x.fillStyle = "#7d5d47"; oval(x, 54, 44, 10, 12);
      x.fillStyle = "rgba(20,16,14,.55)"; oval(x, 56, 36, 12, 6);
      x.fillStyle = "#ebe2cc"; oval(x, 48, 42, 2, 1.4);
      x.strokeStyle = "#1e1712"; x.lineWidth = 2; x.beginPath(); x.moveTo(44, 38); x.lineTo(53, 40); x.stroke();
      // rotes Tuch vor Mund und Nase
      x.fillStyle = "#7a2f26";
      x.beginPath(); x.moveTo(42, 46); x.lineTo(66, 46); x.lineTo(64, 60); x.lineTo(56, 66); x.lineTo(44, 58); x.closePath(); x.fill();
      x.fillStyle = "#9b3a2f"; x.beginPath(); x.moveTo(64, 50); x.lineTo(74, 58); x.lineTo(66, 60); x.closePath(); x.fill();
      x.strokeStyle = "rgba(224,160,70,.25)"; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(60, 16); x.quadraticCurveTo(84, 18, 82, 50); x.stroke();
      // vorderer Arm mit Kurzschwert
      x.strokeStyle = "#5e4230"; x.lineWidth = 9; x.beginPath(); x.moveTo(48, 70); x.lineTo(34, 94); x.lineTo(24, 98); x.stroke();
      x.fillStyle = "#7d5d47"; oval(x, 22, 98, 4.5, 4.5);
      x.strokeStyle = "#3a2d20"; x.lineWidth = 3; x.beginPath(); x.moveTo(14, 94); x.lineTo(28, 102); x.stroke();
      g = x.createLinearGradient(4, 50, 22, 96); g.addColorStop(0, "#e2ded2"); g.addColorStop(1, "#8a8577");
      x.strokeStyle = g; x.lineWidth = 4.5; x.beginPath(); x.moveTo(21, 97); x.lineTo(5, 54); x.stroke();
      return c;
    },
    hase() {
      const [c, x] = malGrund(130, 90);
      // Hinterlauf (gestreckt, im Sprung)
      x.fillStyle = "#6b4f35";
      x.beginPath(); x.moveTo(84, 54); x.quadraticCurveTo(118, 62, 126, 80); x.lineTo(112, 80); x.quadraticCurveTo(98, 70, 80, 66); x.closePath(); x.fill();
      // Körper
      let g = x.createLinearGradient(40, 30, 100, 80); g.addColorStop(0, "#a8835c"); g.addColorStop(1, "#5e4530");
      x.fillStyle = g; x.beginPath(); x.ellipse(70, 54, 34, 20, -0.12, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#d8cbb0"; x.beginPath(); x.ellipse(64, 66, 20, 7, -0.1, 0, Math.PI * 2); x.fill();
      // Blume (weißer Schwanz)
      x.fillStyle = "#f1e7cf"; oval(x, 104, 46, 7, 6.5);
      // Vorderläufe
      x.strokeStyle = "#7a5b3e"; x.lineWidth = 5;
      x.beginPath(); x.moveTo(44, 62); x.lineTo(24, 74); x.stroke();
      x.beginPath(); x.moveTo(50, 66); x.lineTo(34, 82); x.stroke();
      // Kopf
      x.fillStyle = "#9a7650"; oval(x, 34, 40, 15, 12);
      x.fillStyle = "#b08c64"; oval(x, 24, 44, 7, 6);
      // Ohren
      x.fillStyle = "#8a6a4a";
      x.beginPath(); x.ellipse(52, 18, 5.5, 20, 1.15, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#6b4f35";
      x.beginPath(); x.ellipse(48, 22, 5, 18, 0.95, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#2a1c12"; x.beginPath(); x.ellipse(60, 12, 3, 5, 1.15, 0, Math.PI * 2); x.fill();
      // Auge & Nase
      x.fillStyle = "#1a1210"; oval(x, 30, 37, 2.6, 2.6);
      x.fillStyle = "#ebe2cc"; oval(x, 29.2, 36.2, 0.8, 0.8);
      x.fillStyle = "#3a2420"; oval(x, 18, 44, 2, 1.6);
      x.strokeStyle = "rgba(235,226,204,.5)"; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(20, 46); x.lineTo(8, 44); x.moveTo(20, 47); x.lineTo(9, 50); x.stroke();
      return c;
    },
    blatt() {
      const [c, x] = malGrund(80, 80);
      x.translate(40, 42);
      x.save(); x.shadowColor = "rgba(224,160,70,.9)"; x.shadowBlur = 10;
      const g = x.createLinearGradient(-30, -30, 30, 30); g.addColorStop(0, "#ffcf7a"); g.addColorStop(0.55, "#e0a046"); g.addColorStop(1, "#b5502f");
      x.fillStyle = g;
      // Ahornblatt aus fünf Lappen
      x.beginPath();
      const pkt = [[0, -32], [7, -16], [24, -22], [18, -6], [32, 2], [14, 8], [18, 24], [3, 14], [0, 26], [-3, 14], [-18, 24], [-14, 8], [-32, 2], [-18, -6], [-24, -22], [-7, -16]];
      pkt.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py));
      x.closePath(); x.fill(); x.restore();
      x.strokeStyle = "rgba(122,47,38,.65)"; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(0, 34); x.lineTo(0, -26); x.moveTo(0, 6); x.lineTo(26, -2); x.moveTo(0, 6); x.lineTo(-26, -2); x.moveTo(0, 0); x.lineTo(18, -18); x.moveTo(0, 0); x.lineTo(-18, -18); x.stroke();
      return c;
    }
  };

  /* ---------- Klang (eigene Synthese, keine Dateien) ---------- */
  let ac = null, rauschen = null, tonAn = lies("imres-waldlauf-ton", "1") === "1";
  function audio() {
    if (!tonAn) return null;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; } }
    if (ac.state === "suspended") ac.resume();
    if (!rauschen) {
      rauschen = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
      const d = rauschen.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function huelle(a, ziel, start, spitze, dauer) {
    const g = a.createGain(); g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(spitze, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    g.connect(ziel); return g;
  }
  function ton(typ, f1, f2, dauer, laut, verz, filt) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const o = a.createOscillator(); o.type = typ;
    o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dauer);
    let ziel = huelle(a, a.destination, t0, laut, dauer);
    if (filt) { const b = a.createBiquadFilter(); b.type = filt[0]; b.frequency.value = filt[1]; b.Q.value = filt[2] || 1; b.connect(ziel); ziel = b; }
    o.connect(ziel); o.start(t0); o.stop(t0 + dauer + 0.05);
  }
  function knistern(dauer, laut, typ, freq, verz) {
    const a = audio(); if (!a) return;
    const t0 = a.currentTime + (verz || 0);
    const q = a.createBufferSource(); q.buffer = rauschen;
    const b = a.createBiquadFilter(); b.type = typ; b.frequency.value = freq;
    q.connect(b); b.connect(huelle(a, a.destination, t0, laut, dauer));
    q.start(t0, Math.random() * 0.5); q.stop(t0 + dauer + 0.05);
  }
  const KLANG = {
    sehne: p => { ton("triangle", 200 + p * 90, 70, 0.2, 0.2); knistern(0.09, 0.07, "highpass", 2500); },
    treffer: () => { knistern(0.09, 0.28, "lowpass", 900); ton("sine", 150, 55, 0.12, 0.25); },
    feuer: () => knistern(0.35, 0.16, "bandpass", 1400),
    tod: () => ton("triangle", 420, 140, 0.25, 0.08),
    bellen: () => { ton("sawtooth", 560, 280, 0.09, 0.13, 0, ["bandpass", 900, 2]); ton("sawtooth", 600, 300, 0.1, 0.13, 0.15, ["bandpass", 900, 2]); },
    knurren: () => ton("sawtooth", 110, 90, 0.5, 0.09, 0, ["lowpass", 500, 1]),
    entkommen: () => ton("sine", 320, 110, 0.45, 0.14),
    gabe: () => [523, 659, 784, 1046].forEach((f, i) => ton("triangle", f, f, 0.18, 0.12, i * 0.09)),
    bruellen: () => { knistern(1.2, 0.3, "lowpass", 320); ton("sawtooth", 72, 40, 1.2, 0.22, 0, ["lowpass", 400, 1]); },
    glocke: treffer => (treffer ? [880, 1175, 1568] : [1175, 1568]).forEach((f, i) => ton("sine", f, f, 0.3, 0.07, i * 0.07)),
    ende: () => [392, 330, 262, 196].forEach((f, i) => ton("triangle", f, f * 0.98, 0.35, 0.12, i * 0.22))
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | spiel | wahl | pause | ende
  let S = null;
  function neuesSpiel() {
    S = {
      stufe: stufeWahl, maxLeben: STUFEN[stufeWahl].leben,
      welle: 0, leben: STUFEN[stufeWahl].leben, punkte: 0, combo: 0, besteCombo: 0, erlegt: 0, bonus: 0, bonusT: 10, salven: 0, salvenTreffer: 0, bossBesiegt: false,
      gaben: { mehrfach: 0, feuer: 0, zug: 0, durchschlag: 0, rex: 0, adler: 0, echo: 0, rast: 0, barradin: 0 },
      pfeile: [], gegner: [], teilchen: [], texte: [], blasen: [],
      warte: [], abstand: 1.5, spawnT: 0, gebellt: false, bossWelle: false, bossRufT: 0, eskorteT: 0, eskorte2T: 0,
      banner: null, abkuehl: 0, vorgemerkt: null, beben: 0, endeT: 0, welleFertigT: -1,
      rex: { zustand: "wartet", x: REX_HEIM.x, y: REX_HEIM.y, ziel: null, t: 0, cd: 4, hops: 0 },
      salveId: 0, salvenOffen: {}
    };
  }

  function welleBauen(n) {
    const l = [], add = (typ, k) => { for (let i = 0; i < k; i++) l.push(typ); };
    let abstand = 1.5;
    if (n === 1) { add("goblin", 8); abstand = 1.7; }
    else if (n === 2) { add("goblin", 7); add("bandit", 4); abstand = 1.55; }
    else if (n === 3) { add("goblin", 11); add("bandit", 3); abstand = 1.3; }
    else if (n === 4) return { liste: ["goblin", "anfuehrer"], abstand: 2.5, boss: true };
    else if (n === 5) { add("blight", 9); add("goblin", 2); abstand = 1.45; }
    else if (n === 6) { add("blight", 6); add("goblin", 4); add("bandit", 3); add("bugbear", 2); abstand = 1.35; }
    else if (n === 7) { add("vrock", 5); add("blight", 4); add("bandit", 2); abstand = 1.35; }
    else if (n === 8) { add("chasme", 5); add("vrock", 3); add("bugbear", 2); add("blight", 3); abstand = 1.25; }
    else if (n === 9) { add("goblin", 4); add("bandit", 3); add("blight", 4); add("vrock", 3); add("bugbear", 3); add("chasme", 4); abstand = 1.1; }
    else if (n === 10) return { liste: ["demogorgon"], abstand: 0, boss: true };
    else {
      const k = n - 10;
      add("goblin", 3 + k); add("bandit", 2 + Math.ceil(k / 2)); add("blight", 4 + k); add("vrock", 3 + k); add("bugbear", 2 + Math.ceil(k / 2)); add("chasme", 3 + k);
      abstand = Math.max(0.55, 1.05 - 0.05 * k);
      mischen(l);
      if (k % 4 === 0) { l.splice(Math.floor(l.length / 2), 0, "demogorgon"); return { liste: l, abstand, boss: true }; }
      if (k % 4 === 2) { l.splice(Math.floor(l.length / 2), 0, "anfuehrer"); return { liste: l, abstand, boss: true }; }
      return { liste: l, abstand };
    }
    const erste = [l[0], l[0]];
    return { liste: erste.concat(mischen(l.slice(2))), abstand };
  }

  function welleStarten(n) {
    S.welle = n;
    const w = welleBauen(n);
    S.warte = w.liste.map(typ => ({ typ, dir: Math.random() < 0.5 ? 1 : -1 }));
    S.abstand = w.abstand * STUFEN[S.stufe].abstand; S.bossWelle = !!w.boss;
    S.gegner = S.gegner.filter(e => e.a.art !== "bonus"); S.bonusT = 6 + Math.random() * 8;
    S.spawnT = 2.2; S.gebellt = false; S.welleFertigT = -1;
    S.eskorteT = 5; S.eskorte2T = 9;
    const tx = t();
    S.banner = { titel: tx.welle(n), unter: n <= 10 ? tx.wellen[n - 1] : tx.endlos, t: 0, dauer: 2.2 };
    zustand = "spiel";
    schleierZu();
  }

  function tempoFaktor() { return STUFEN[S.stufe].tempo * Math.pow(0.85, S.gaben.echo) * (1 + 0.06 * Math.max(0, S.welle - 10)); }

  function spawnen(e) {
    const a = ARTEN[e.typ], sp = SPRITES[a.sprite || e.typ];
    const verh = sp ? sp.verh : 0.8;
    let y, s, bahn = -1;
    if (a.art === "boden" || e.typ === "hase") { bahn = e.typ === "hase" ? 1 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3); y = BAHNEN[bahn].y; s = BAHNEN[bahn].s; }
    else if (a.art === "flug") { y = 120 + Math.random() * 150; s = 0.72 + (y - 120) / 150 * 0.28; }
    else if (e.typ === "blatt") { y = 60; s = 1; }
    else { bahn = 1; y = BAHNEN[1].y + 10; s = 1; }
    const h = a.hoehe * s, w = h * verh;
    const extra = S.welle > 10 ? Math.floor((S.welle - 10) / 3) : 0;
    const hp = a.art === "boss" ? a.hp + (a.mini ? 4 : 10) * extra : a.hp + (a.hp > 1 && a.art !== "bonus" ? extra : 0);
    const startX = e.typ === "blatt" ? 70 + Math.random() * 260 : e.dir === 1 ? -w / 2 : W + w / 2;
    S.gegner.push({
      typ: e.typ, a, sp: a.sprite || e.typ, x: startX, basisX: startX, y, basisY: y, s, h, w, dir: e.dir, bahn,
      hp, maxHp: hp, t: 0, phase: Math.random() * 6, tempo: a.tempo * (0.9 + Math.random() * 0.2),
      tot: 0, blitz: 0, gehalten: false, getroffenVon: {}
    });
    if (a.art === "boss") { KLANG.bruellen(); S.beben = a.mini ? 0.4 : 0.7; S.bossRufT = 4; S.eskorteT = 3; S.eskorte2T = 7; textAuf(W / 2, 200, t().bossRuft[e.typ], a.mini ? "#e0a046" : "#c4564a", 26, 1.6); }
    if (a.art === "bonus") { textAuf(W / 2, 92, t().bonusDa[e.typ], "#ebe2cc", 19, 1.6); KLANG.glocke(); if (e.typ === "hase") S.rex.hops = 0.35; }
  }

  /* ---------- Schießen ---------- */
  let zielen = null;
  function zielVektor() {
    if (!zielen) return null;
    const dx = zielen.sx - zielen.x, dy = zielen.sy - zielen.y;
    const len = Math.hypot(dx, dy);
    if (len < 12) return null;
    let ang = Math.atan2(dy, dx);
    if (ang > -0.1 && ang <= Math.PI / 2) ang = -0.1;
    else if (ang > Math.PI / 2 || ang < -Math.PI + 0.1) ang = -Math.PI + 0.1;
    const p = Math.max(0.18, Math.min(1, len / 110));
    return { ang, p, v: 330 + p * 500 };
  }
  function bogenPunkt(ang) { return { x: SCHULTER.x + Math.cos(ang) * 30, y: SCHULTER.y - 4 + Math.sin(ang) * 30 }; }

  function schiessen(z) {
    const n = 1 + S.gaben.mehrfach;
    const id = ++S.salveId;
    S.salvenOffen[id] = { offen: n, treffer: 0, kills: 0 };
    S.salven++;
    for (let i = 0; i < n; i++) {
      const ang = z.ang + (i - (n - 1) / 2) * 0.075;
      const b = bogenPunkt(z.ang);
      S.pfeile.push({ x: b.x, y: b.y, vx: Math.cos(ang) * z.v, vy: Math.sin(ang) * z.v, salve: id, durch: S.gaben.durchschlag, getroffen: [], feuer: S.gaben.feuer, t: 0 });
    }
    S.abkuehl = 0.55 * Math.pow(0.78, S.gaben.zug);
    KLANG.sehne(z.p);
  }

  function salveSchliessen(id) {
    const v = S.salvenOffen[id]; if (!v) return;
    v.offen--;
    if (v.offen > 0) return;
    delete S.salvenOffen[id];
    if (v.treffer > 0) { S.salvenTreffer++; S.combo++; S.besteCombo = Math.max(S.besteCombo, S.combo); }
    else S.combo = 0;
    if (v.kills >= 2) {
      const bonus = 15 * v.kills;
      S.punkte += bonus;
      textAuf(W / 2, 250, (v.kills >= 3 ? t().dreifach : t().doppel) + " +" + bonus, "#e0a046", 22, 1.3);
    }
  }

  function schaden(e, dmg, pfeil, salve) {
    if (e.tot) return false;
    e.hp -= dmg; e.blitz = 0.12;
    if (salve) salve.treffer++;
    if (e.hp <= 0) {
      e.tot = 0.001;
      const mult = 1 + Math.min(S.combo, 20) * 0.1 * (S.gaben.barradin ? 2 : 1);
      const p = Math.round(e.a.punkte * mult);
      S.punkte += p;
      const m = mitte(e);
      if (e.a.art === "bonus") {
        S.bonus++;
        textAuf(m.x, m.y - 14, t().bonus[e.typ] + " +" + p, "#ffcf7a", 20, 1.4);
        glut(m.x, m.y, ruhig ? 8 : 24); KLANG.glocke(true);
        return true;
      }
      S.erlegt++;
      if (salve) salve.kills++;
      textAuf(m.x, m.y - 10, "+" + p, "#ebe2cc", e.a.art === "boss" ? 30 : 18, 0.9);
      funken(m.x, m.y, e.a.splitter, e.a.art === "boss" ? (e.a.mini ? 40 : 70) : 16);
      KLANG.tod();
      if (e.a.art === "boss") {
        if (!e.a.mini) S.bossBesiegt = true;
        S.beben = e.a.mini ? 0.6 : 1; KLANG.bruellen();
        textAuf(W / 2, 180, t().bossFaellt[e.typ], "#e0a046", 30, 2.2);
      }
      return true;
    }
    return false;
  }
  function mitte(e) { return { x: e.x, y: e.y - e.h * (e.a.art === "boss" ? 0.55 : 0.5) }; }
  function radius(e) { return Math.min(e.w, e.h) * (e.a.art === "boss" ? 0.4 : e.a.art === "bonus" ? 0.5 : 0.38) + (e.a.art === "bonus" ? 7 : 3); }

  /* ---------- Teilchen & Texte ---------- */
  function funken(x, y, farben, n) {
    if (ruhig) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 160;
      S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, leben: 0.5 + Math.random() * 0.6, max: 1.1, farbe: zufall(farben), gr: 1.5 + Math.random() * 2.5, schwer: 1 });
    }
  }
  function glut(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 90;
      S.teilchen.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, leben: 0.4 + Math.random() * 0.5, max: 0.9, farbe: zufall(["#e0a046", "#ffcf7a", "#c4564a"]), gr: 2 + Math.random() * 3, schwer: -0.3, leuchten: true });
    }
  }
  function textAuf(x, y, text, farbe, gr, dauer) { S.texte.push({ x, y, text, farbe, gr, t: 0, dauer: dauer || 1 }); }

  /* ---------- Rex ---------- */
  function rexUpdate(dt) {
    const r = S.rex;
    r.hops = Math.max(0, r.hops - dt);
    const lvl = S.gaben.rex;
    if (r.zustand === "wartet") {
      r.x += (REX_HEIM.x - r.x) * Math.min(1, dt * 6); r.y += (REX_HEIM.y - r.y) * Math.min(1, dt * 6);
      if (!lvl) return;
      r.cd -= dt;
      if (r.cd <= 0) {
        let best = null, bd = 1e9;
        S.gegner.forEach(e => {
          if (e.tot || e.gehalten || e.a.art !== "boden" || e.x < 30 || e.x > W - 30) return;
          const d = Math.hypot(e.x - r.x, e.y - r.y); if (d < bd) { bd = d; best = e; }
        });
        if (best) { r.ziel = best; r.zustand = "rennt"; best.gehalten = true; KLANG.knurren(); }
        else r.cd = 0.5;
      }
    } else if (r.zustand === "rennt") {
      const e = r.ziel;
      if (!e || e.tot) { r.zustand = "zurueck"; return; }
      const zx = e.x, zy = e.y - e.h * 0.25, d = Math.hypot(zx - r.x, zy - r.y), v = 460 * dt;
      if (d <= v + 4) { r.zustand = "haelt"; r.t = lvl > 1 ? 1.6 : 2.2; textAuf(zx, zy - e.h * 0.6, t().grr, "#e0a046", 20, 0.9); }
      else { r.x += (zx - r.x) / d * v; r.y += (zy - r.y) / d * v; }
    } else if (r.zustand === "haelt") {
      const e = r.ziel;
      if (!e || e.tot) { r.zustand = "zurueck"; return; }
      r.x = e.x + Math.sin(performance.now() / 50) * 2; r.y = e.y - e.h * 0.25;
      r.t -= dt;
      if (r.t <= 0) {
        e.gehalten = false;
        const m = mitte(e);
        funken(m.x, m.y, e.a.splitter, 8);
        KLANG.treffer();
        schaden(e, lvl > 1 ? 3 : 1, null, null);
        r.zustand = "zurueck";
      }
    } else if (r.zustand === "zurueck") {
      const d = Math.hypot(REX_HEIM.x - r.x, REX_HEIM.y - r.y), v = 420 * dt;
      if (d <= v + 2) { r.zustand = "wartet"; r.cd = lvl > 1 ? 4.5 : 7.5; r.ziel = null; }
      else { r.x += (REX_HEIM.x - r.x) / d * v; r.y += (REX_HEIM.y - r.y) / d * v; }
    }
  }

  /* ---------- Update ---------- */
  function update(dt) {
    if (S.banner) { S.banner.t += dt; if (S.banner.t > S.banner.dauer) S.banner = null; }
    S.beben = Math.max(0, S.beben - dt);
    S.abkuehl = Math.max(0, S.abkuehl - dt);
    if (S.vorgemerkt && S.abkuehl <= 0) { schiessen(S.vorgemerkt); S.vorgemerkt = null; }

    // Gegner erscheinen – Rex bellt vorher
    if (S.warte.length) {
      S.spawnT -= dt;
      if (!S.gebellt && S.spawnT <= 0.9) {
        S.gebellt = true;
        const n = S.warte[0], a = ARTEN[n.typ];
        const by = a.art === "flug" ? 170 : a.art === "boss" ? 280 : 330;
        S.blasen.push({ x: n.dir === 1 ? 38 : W - 38, y: by, t: 0, dauer: 1.1, dir: n.dir, gross: a.art === "boss" });
        S.rex.hops = 0.35;
        KLANG.bellen();
      }
      if (S.spawnT <= 0) {
        spawnen(S.warte.shift());
        S.spawnT = S.abstand * (0.75 + Math.random() * 0.5); S.gebellt = false;
      }
    }

    // Bosse rufen Verstärkung
    const boss = S.gegner.find(e => e.a.art === "boss" && !e.tot);
    if (boss) {
      S.eskorteT -= dt; S.eskorte2T -= dt;
      const mini = boss.a.mini, ruf = typ => { S.warte.unshift({ typ, dir: Math.random() < 0.5 ? 1 : -1 }); S.spawnT = Math.min(S.spawnT, 1); S.gebellt = false; };
      if (S.eskorteT <= 0) { S.eskorteT = (mini ? 3.4 : 3.8) / STUFEN[S.stufe].tempo; ruf(mini ? "goblin" : zufall(["blight", "blight", "goblin"])); }
      if (S.eskorte2T <= 0) { S.eskorte2T = 7 / STUFEN[S.stufe].tempo; ruf(mini ? "bandit" : S.welle > 10 ? zufall(["chasme", "vrock", "bandit"]) : "chasme"); }
      S.bossRufT -= dt;
      if (S.bossRufT <= 0) { S.bossRufT = 9; S.beben = mini ? 0.3 : 0.5; KLANG.bruellen(); }
    }

    // Bonusziele: ein fliehender Hase oder ein Blatt im Wind
    if (S.warte.length || S.gegner.some(e => e.a.art !== "bonus")) {
      S.bonusT -= dt;
      if (S.bonusT <= 0 && !S.gegner.some(e => e.a.art === "bonus")) {
        S.bonusT = 13 + Math.random() * 9;
        spawnen({ typ: Math.random() < 0.55 ? "hase" : "blatt", dir: Math.random() < 0.5 ? 1 : -1 });
      }
    }

    const tf = tempoFaktor();
    S.gegner.forEach(e => {
      e.t += dt; e.blitz = Math.max(0, e.blitz - dt);
      if (e.tot) { e.tot += dt; return; }
      if (e.typ === "blatt") {
        e.y += 34 * dt; e.x = e.basisX + Math.sin(e.t * 1.7 + e.phase) * 42;
        if (e.y > BAHNEN[0].y - 6) e.weg = true;
        return;
      }
      if (!e.gehalten) e.x += e.dir * e.tempo * (e.a.art === "bonus" ? 1 : tf) * dt;
      if (e.typ === "hase") e.y = e.basisY - Math.abs(Math.sin(e.t * 10 + e.phase)) * 10 * e.s;
      else if (e.a.art === "boden") e.y = e.basisY + Math.sin(e.t * 9 + e.phase) * 1.4 * e.s;
      else if (e.typ === "vrock") e.y = e.basisY + Math.sin(e.t * 2.1 + e.phase) * 28 * e.s;
      else if (e.typ === "chasme") e.y = e.basisY + Math.sin(e.t * 5.2 + e.phase) * 34 * e.s + Math.sin(e.t * 1.3) * 18;
      else e.y = e.basisY + Math.sin(e.t * 1.6) * 3;
      if ((e.dir === 1 && e.x - e.w / 2 > W) || (e.dir === -1 && e.x + e.w / 2 < 0)) {
        e.weg = true;
        if (e.a.art === "bonus") return;
        const verlust = e.a.verlust || 1;
        S.leben = Math.max(0, S.leben - verlust); S.combo = 0; S.beben = Math.max(S.beben, 0.35);
        textAuf(e.dir === 1 ? W - 60 : 60, Math.min(e.y - e.h / 2, 420), t().entkommen, "#c4564a", 18, 1.1);
        KLANG.entkommen();
        if (S.rex.ziel === e) { S.rex.zustand = "zurueck"; }
      }
    });
    S.gegner = S.gegner.filter(e => !e.weg && !(e.tot && e.tot > 0.5));

    // Pfeile mit Unterschritten
    S.pfeile.forEach(p => {
      const schritte = 3;
      for (let k = 0; k < schritte && !p.weg; k++) {
        const d = dt / schritte;
        p.vy += G * d; p.x += p.vx * d; p.y += p.vy * d; p.t += d;
        for (const e of S.gegner) {
          if (e.tot || p.getroffen.includes(e)) continue;
          const m = mitte(e), r = radius(e);
          if ((p.x - m.x) ** 2 + (p.y - m.y) ** 2 < r * r) {
            p.getroffen.push(e);
            const salve = S.salvenOffen[p.salve];
            KLANG.treffer();
            funken(p.x, p.y, e.a.splitter, 6);
            schaden(e, p.feuer > 1 ? 2 : 1, p, salve);
            if (p.feuer) {
              const rad = p.feuer > 1 ? 60 : 40;
              glut(p.x, p.y, ruhig ? 6 : 18); KLANG.feuer();
              S.gegner.forEach(o => {
                if (o === e || o.tot) return;
                const om = mitte(o);
                if (Math.hypot(om.x - p.x, om.y - p.y) < rad + radius(o) * 0.5) schaden(o, 1, null, salve);
              });
            }
            if (p.durch > 0) p.durch--; else { p.weg = true; }
            break;
          }
        }
        if (p.y > H + 20 || p.x < -40 || p.x > W + 40 || p.y < -400) p.weg = true;
      }
      if (p.feuer && !ruhig && Math.random() < 0.6) S.teilchen.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: -20, leben: 0.3, max: 0.3, farbe: "#e0a046", gr: 2, schwer: -0.2, leuchten: true });
    });
    S.pfeile.filter(p => p.weg).forEach(p => salveSchliessen(p.salve));
    S.pfeile = S.pfeile.filter(p => !p.weg);

    rexUpdate(dt);

    S.teilchen.forEach(q => { q.leben -= dt; q.vy += 300 * q.schwer * dt; q.x += q.vx * dt; q.y += q.vy * dt; });
    S.teilchen = S.teilchen.filter(q => q.leben > 0);
    S.texte.forEach(x => { x.t += dt; x.y -= 22 * dt; });
    S.texte = S.texte.filter(x => x.t < x.dauer);
    S.blasen.forEach(b => b.t += dt);
    S.blasen = S.blasen.filter(b => b.t < b.dauer);

    if (S.leben <= 0) { S.endeT += dt; if (S.endeT > 0.9) spielEnde(); return; }

    if (!S.warte.length && !S.gegner.some(e => e.a.art !== "bonus") && S.welleFertigT < 0) S.welleFertigT = 0;
    if (S.welleFertigT >= 0) { S.welleFertigT += dt; if (S.welleFertigT > 1.1 && !S.pfeile.length) gabenZeigen(); }
  }

  /* ---------- Zeichnen ---------- */
  const leinwand = document.createElement("canvas");
  const ctx = leinwand.getContext("2d");
  let skala = 1, hgBild = null, buschBilder = [], gluehwuermchen = [];

  function lcg(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function tanne(c, x, basis, h, farbe) {
    c.fillStyle = farbe;
    c.fillRect(x - h * 0.03, basis - h * 0.15, h * 0.06, h * 0.15);
    for (let i = 0; i < 4; i++) {
      const oben = basis - h + i * h * 0.2, unten = basis - h * 0.12 - (3 - i) * h * 0.17 + h * 0.05, br = h * (0.14 + i * 0.075);
      c.beginPath(); c.moveTo(x, oben); c.lineTo(x - br, unten); c.lineTo(x + br, unten); c.closePath(); c.fill();
    }
  }
  function hintergrundBauen() {
    const f = 2, c = document.createElement("canvas"); c.width = W * f; c.height = H * f;
    const x = c.getContext("2d"); x.scale(f, f);
    const r = lcg(7);
    let g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#09080f"); g.addColorStop(0.45, "#141320"); g.addColorStop(0.62, "#1b2220"); g.addColorStop(1, "#0d110d");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { x.fillStyle = "rgba(235,226,204," + (0.15 + r() * 0.55) + ")"; x.fillRect(r() * W, r() * 230, r() < 0.15 ? 1.6 : 1, r() < 0.15 ? 1.6 : 1); }
    g = x.createRadialGradient(305, 72, 10, 305, 72, 120);
    g.addColorStop(0, "rgba(235,226,204,.22)"); g.addColorStop(1, "rgba(235,226,204,0)");
    x.fillStyle = g; x.fillRect(0, 0, W, 260);
    x.fillStyle = "#ebe2cc"; x.beginPath(); x.arc(305, 72, 21, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(168,159,143,.35)"; x.beginPath(); x.arc(298, 66, 5, 0, 7); x.arc(312, 79, 3.5, 0, 7); x.fill();
    for (let i = 0; i < 26; i++) tanne(x, -10 + i * 17 + r() * 8, 296, 70 + r() * 70, "#182019");
    g = x.createLinearGradient(0, 255, 0, 320);
    g.addColorStop(0, "rgba(168,159,143,0)"); g.addColorStop(0.6, "rgba(168,159,143,.13)"); g.addColorStop(1, "rgba(168,159,143,0)");
    x.fillStyle = g; x.fillRect(0, 255, W, 65);
    x.fillStyle = "#161d16"; x.fillRect(0, 294, W, H - 294);
    for (let i = 0; i < 9; i++) tanne(x, r() < 0.5 ? r() * 70 : W - r() * 70, 300 + r() * 30, 150 + r() * 90, "#111611");
    tanne(x, -6, 470, 360, "#0b0f0b"); tanne(x, W + 8, 470, 380, "#0b0f0b");
    hgBild = c;
    buschBilder = BAHNEN.map((b, i) => {
      const k = document.createElement("canvas"); k.width = W * f; k.height = H * f;
      const y = k.getContext("2d"); y.scale(f, f);
      const ende = i < 2 ? BAHNEN[i + 1].y - 18 * BAHNEN[i + 1].s : H;
      const farbe = ["#172117", "#121a12", "#0e140e"][i], rand = ["rgba(111,138,90,.22)", "rgba(111,138,90,.2)", "rgba(111,138,90,.16)"][i];
      y.fillStyle = farbe;
      y.fillRect(0, b.y + 2 * b.s, W, ende - b.y);
      const blobs = [];
      for (let xx = -14; xx < W + 20; xx += (16 + r() * 18) * b.s) blobs.push([xx, b.y + 6 * b.s, (11 + r() * 9) * b.s]);
      blobs.forEach(([bx, by, br]) => { y.beginPath(); y.arc(bx, by, br, 0, Math.PI * 2); y.fill(); });
      y.strokeStyle = rand; y.lineWidth = 1.2;
      blobs.forEach(([bx, by, br]) => { y.beginPath(); y.arc(bx, by, br, Math.PI * 1.15, Math.PI * 1.85); y.stroke(); });
      return k;
    });
    gluehwuermchen = Array.from({ length: 16 }, () => ({ x: Math.random() * W, y: 180 + Math.random() * 260, p: Math.random() * 6, v: 0.4 + Math.random() * 0.8 }));
  }

  function gegnerZeichnen(e) {
    const sp = SPRITES[e.sp];
    let alpha = 1, dy = 0, dreh = 0;
    if (e.tot) { const k = e.tot / 0.5; alpha = 1 - k; dy = k * 18; dreh = e.dir * k * 0.5; }
    if (e.a.art === "boden" && e.t < 0.35) dy += (1 - e.t / 0.35) * e.h * 0.6;
    const wackel = e.gehalten ? Math.sin(e.t * 40) * 2 : 0;
    ctx.save();
    ctx.globalAlpha = alpha * (e.blitz > 0 ? 0.55 : 1);
    ctx.translate(e.x + wackel, e.y + dy);
    if (e.typ === "blatt") { ctx.translate(0, -e.h / 2); ctx.rotate(Math.sin(e.t * 2.3 + e.phase) * 0.9); ctx.translate(0, e.h / 2); }
    if (dreh) ctx.rotate(dreh);
    if (e.typ === "vrock" || e.typ === "chasme") ctx.rotate(Math.sin(e.t * 3 + e.phase) * 0.06);
    if (sp) {
      const img = (e.dir === e.a.blick) ? sp.normal : sp.gespiegelt;
      ctx.shadowColor = e.a.glut || (e.a.art === "bonus" ? "rgba(255,207,122,.8)" : "rgba(235,226,204,.38)"); ctx.shadowBlur = e.a.art === "boss" ? 18 : e.a.art === "bonus" ? 14 : 9;
      ctx.drawImage(img, -e.w / 2, -e.h, e.w, e.h);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = e.a.splitter[0]; ctx.beginPath(); ctx.ellipse(0, -e.h / 2, e.w / 2.4, e.h / 2.2, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (!e.tot && e.maxHp > 1) {
      const bw = e.a.art === "boss" ? 120 : Math.max(26, e.w * 0.55), bx = e.x - bw / 2, by = e.y - e.h - 8;
      ctx.fillStyle = "rgba(16,14,21,.75)"; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
      ctx.fillStyle = e.a.art === "boss" && !e.a.mini ? "#c4564a" : "#e0a046"; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3);
    }
  }

  function friedrichZeichnen(z) {
    const ang = z ? z.ang : -Math.PI / 2 + Math.sin(performance.now() / 1400) * 0.05;
    const p = z ? z.p : 0;
    const sx = SCHULTER.x, sy = SCHULTER.y;
    ctx.fillStyle = "#0a0d0a";
    ctx.beginPath(); ctx.ellipse(200, H + 14, 120, 48, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(sx + 12, sy - 6); ctx.rotate(0.35);
    ctx.fillStyle = "#3a2c1e"; ctx.fillRect(-4, -4, 8, 34);
    ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 2.5, -4); ctx.lineTo(i * 3, -12); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = "#1f2a1d";
    ctx.beginPath(); ctx.moveTo(sx - 18, sy); ctx.quadraticCurveTo(sx - 34, sy + 30, sx - 30, H + 2); ctx.lineTo(sx + 30, H + 2); ctx.quadraticCurveTo(sx + 34, sy + 30, sx + 18, sy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(224,160,70,.35)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx + 18, sy); ctx.quadraticCurveTo(sx + 34, sy + 30, sx + 30, H); ctx.stroke();
    ctx.fillStyle = "#243022";
    ctx.beginPath(); ctx.moveTo(sx - 13, sy - 4); ctx.quadraticCurveTo(sx - 14, sy - 26, sx, sy - 30); ctx.quadraticCurveTo(sx + 14, sy - 26, sx + 13, sy - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(224,160,70,.3)"; ctx.beginPath(); ctx.moveTo(sx, sy - 30); ctx.quadraticCurveTo(sx + 14, sy - 26, sx + 13, sy - 4); ctx.stroke();
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const b = bogenPunkt(ang);
    ctx.strokeStyle = "#1f2a1d"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(b.x, b.y); ctx.stroke();
    const t1 = { x: b.x + px * 27 - dx * 9, y: b.y + py * 27 - dy * 9 }, t2 = { x: b.x - px * 27 - dx * 9, y: b.y - py * 27 - dy * 9 };
    const nock = { x: b.x - dx * (8 + p * 18), y: b.y - dy * (8 + p * 18) };
    ctx.strokeStyle = "rgba(235,226,204,.75)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(nock.x, nock.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
    ctx.strokeStyle = "#8a6a44"; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.quadraticCurveTo(b.x + dx * 9, b.y + dy * 9, t2.x, t2.y); ctx.stroke();
    if (S && S.abkuehl <= 0 && zustand === "spiel") {
      const spitze = { x: nock.x + dx * 44, y: nock.y + dy * 44 };
      pfeilZeichnen(nock.x, nock.y, spitze.x, spitze.y, S.gaben.feuer);
    } else if (S && zustand === "spiel") {
      const k = 1 - S.abkuehl / (0.55 * Math.pow(0.78, S.gaben.zug));
      ctx.strokeStyle = "rgba(224,160,70,.6)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy - 16, 22, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
    }
    ctx.lineCap = "butt";
  }

  function pfeilZeichnen(x1, y1, x2, y2, feuer) {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = "#c9b28a"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = feuer ? "#ffcf7a" : "#d8d0bd";
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(ang);
    if (feuer) { ctx.shadowColor = "#e0a046"; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-4, -3.2); ctx.lineTo(-4, 3.2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
    ctx.fillStyle = "#9b3a2f";
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-2, -4); ctx.lineTo(0, 0); ctx.lineTo(-2, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function flugbahnZeichnen(z) {
    const b = bogenPunkt(z.ang);
    let x = b.x, y = b.y, vx = Math.cos(z.ang) * z.v, vy = Math.sin(z.ang) * z.v;
    const dauer = S.gaben.adler ? 0.85 : 0.3, schritt = 0.028;
    for (let tt = 0; tt < dauer; tt += schritt) {
      vy += G * schritt; x += vx * schritt; y += vy * schritt;
      if (y < -10 || x < -10 || x > W + 10) break;
      ctx.fillStyle = "rgba(224,160,70," + (0.75 * (1 - tt / dauer)).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function rexZeichnen() {
    const r = S ? S.rex : { x: REX_HEIM.x, y: REX_HEIM.y, hops: 0, zustand: "wartet" };
    const gr = r.zustand === "wartet" ? 50 : 40;
    const hop = r.hops > 0 ? Math.sin(r.hops / 0.35 * Math.PI) * 10 : 0;
    const lauf = (r.zustand === "rennt" || r.zustand === "zurueck") ? Math.abs(Math.sin(performance.now() / 70)) * 6 : 0;
    if (rexBild) ctx.drawImage(rexBild, r.x - gr / 2, r.y - gr / 2 - hop - lauf, gr, gr);
    else { ctx.fillStyle = "#6a4a2e"; ctx.beginPath(); ctx.arc(r.x, r.y - hop, gr / 2.4, 0, 7); ctx.fill(); }
  }

  function blaseZeichnen(b) {
    const k = b.t / b.dauer, a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
    const txt = t().wuff + (b.gross ? "!!" : "");
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = "600 " + (b.gross ? 24 : 20) + "px " + FONT_H;
    const tw = ctx.measureText(txt).width + 16, th = b.gross ? 32 : 28;
    const x = Math.max(4, Math.min(W - tw - 4, b.x - tw / 2)), y = b.y - th / 2 + Math.sin(b.t * 20) * 1.5;
    ctx.fillStyle = "rgba(241,231,207,.95)"; ctx.strokeStyle = "#e0a046"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(x, y, tw, th); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2a2118"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(txt, x + tw / 2, y + th / 2 + 1);
    ctx.fillStyle = "#e0a046"; ctx.font = "16px " + FONT_D;
    ctx.fillText(b.dir === 1 ? "◂" : "▸", b.dir === 1 ? x + tw + 9 : x - 9, y + th / 2);
    ctx.restore();
  }

  function hudZeichnen() {
    const tx = t();
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(9,8,15,.55)"; ctx.fillRect(0, 0, W, 34);
    ctx.font = "15px " + FONT_D; ctx.fillStyle = "#a89f8f"; ctx.textAlign = "left";
    ctx.fillText(tx.welle(S.welle), 10, 10);
    ctx.textAlign = "center"; ctx.fillStyle = "#e0a046"; ctx.font = "22px " + FONT_D;
    ctx.fillText(String(S.punkte), W / 2, 6);
    ctx.textAlign = "right"; ctx.font = "16px " + FONT_D;
    let hs = ""; for (let i = 0; i < S.maxLeben; i++) hs += i < S.leben ? "♥" : "♡";
    ctx.font = (S.maxLeben > 5 ? 14 : 16) + "px " + FONT_D;
    ctx.fillStyle = S.leben <= 1 ? "#c4564a" : "#e0a046"; ctx.fillText(hs, W - 10, 9);
    if (S.combo >= 2) {
      ctx.textAlign = "center"; ctx.font = "600 18px " + FONT_H; ctx.fillStyle = "#ebe2cc";
      ctx.fillText(tx.serie(S.combo), W / 2, 37);
    }
    const g = Object.keys(S.gaben).filter(k => k !== "rast" && S.gaben[k] > 0);
    ctx.textAlign = "left"; ctx.font = "13px sans-serif"; ctx.globalAlpha = 0.8;
    g.forEach((k, i) => ctx.fillText(GABE_SYM[k] + (S.gaben[k] > 1 ? S.gaben[k] : ""), 8 + i * 30, 40));
    ctx.globalAlpha = 1;
  }

  function bannerZeichnen() {
    const b = S.banner; if (!b) return;
    const k = b.t / b.dauer, a = k < 0.15 ? k / 0.15 : k > 0.75 ? (1 - k) / 0.25 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(9,8,15,.5)"; ctx.fillRect(0, 186, W, 74);
    ctx.fillStyle = "#e0a046"; ctx.font = "34px " + FONT_D; ctx.fillText(b.titel, W / 2, 212);
    ctx.fillStyle = "#ebe2cc"; ctx.font = "600 21px " + FONT_H; ctx.fillText(b.unter, W / 2, 242);
    ctx.restore();
  }

  function zeichnen(jetzt) {
    if (!hgBild) return;
    ctx.setTransform(skala, 0, 0, skala, 0, 0);
    ctx.save();
    if (S && S.beben > 0 && !ruhig) ctx.translate((Math.random() - 0.5) * 8 * S.beben, (Math.random() - 0.5) * 8 * S.beben);
    ctx.drawImage(hgBild, 0, 0, W, H);
    gluehwuermchen.forEach(f => {
      const x = f.x + Math.sin(jetzt / 1000 * f.v + f.p) * 18, y = f.y + Math.cos(jetzt / 1300 * f.v + f.p) * 10;
      const a = 0.35 + 0.35 * Math.sin(jetzt / 400 * f.v + f.p);
      ctx.fillStyle = "rgba(224,190,110," + Math.max(0, a).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    });
    const gg = S ? S.gegner : [];
    for (let i = 0; i < 3; i++) {
      gg.forEach(e => { if (e.bahn === i) gegnerZeichnen(e); });
      ctx.drawImage(buschBilder[i], 0, 0, W, H);
    }
    gg.forEach(e => { if (e.bahn < 0) gegnerZeichnen(e); });
    if (S) {
      S.pfeile.forEach(p => {
        const sp = Math.hypot(p.vx, p.vy) || 1;
        pfeilZeichnen(p.x - p.vx / sp * 30, p.y - p.vy / sp * 30, p.x, p.y, p.feuer);
      });
      S.teilchen.forEach(q => {
        ctx.globalAlpha = Math.max(0, q.leben / q.max);
        ctx.fillStyle = q.farbe;
        if (q.leuchten) { ctx.beginPath(); ctx.arc(q.x, q.y, q.gr, 0, 7); ctx.fill(); }
        else ctx.fillRect(q.x - q.gr / 2, q.y - q.gr / 2, q.gr, q.gr);
      });
      ctx.globalAlpha = 1;
    }
    const z = zustand === "spiel" ? zielVektor() : null;
    if (z) flugbahnZeichnen(z);
    friedrichZeichnen(z);
    rexZeichnen();
    if (S) {
      S.blasen.forEach(blaseZeichnen);
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      S.texte.forEach(x => {
        ctx.globalAlpha = Math.max(0, 1 - x.t / x.dauer);
        ctx.font = (x.gr > 20 ? "" : "600 ") + x.gr + "px " + (x.gr > 20 ? FONT_D : FONT_H);
        ctx.fillStyle = "rgba(9,8,15,.6)"; ctx.fillText(x.text, x.x + 1, x.y + 1);
        ctx.fillStyle = x.farbe; ctx.fillText(x.text, x.x, x.y);
      });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (S && zustand !== "start") hudZeichnen();
    if (S && zustand === "spiel") bannerZeichnen();
  }

  /* ---------- Schleife ---------- */
  let sichtbar = false, letzte = 0, rafId = 0;
  function schleife(jetzt) {
    rafId = 0;
    const dt = Math.min(0.033, (jetzt - (letzte || jetzt)) / 1000);
    letzte = jetzt;
    if (zustand === "spiel" && S) update(dt);
    else if (S && (zustand === "wahl" || zustand === "ende")) {
      S.teilchen.forEach(q => { q.leben -= dt; q.vy += 300 * q.schwer * dt; q.x += q.vx * dt; q.y += q.vy * dt; });
      S.teilchen = S.teilchen.filter(q => q.leben > 0);
    }
    zeichnen(jetzt);
    if (sichtbar && !document.hidden && zustand !== "pause") rafId = requestAnimationFrame(schleife);
  }
  function anwerfen() { if (!rafId && sichtbar && !document.hidden) { letzte = 0; rafId = requestAnimationFrame(schleife); } }

  /* ---------- DOM & Overlays ---------- */
  let buehne, schleier, tafel, fussRekord, tonKnopf, pauseKnopf, listeEl;
  const rekordKey = st => "imres-waldlauf-rekord-" + st;
  (function altenRekordUebernehmen() { const alt = lies("imres-waldlauf-rekord", ""); if (alt && !lies(rekordKey("waldlaeufer"), "")) schreib(rekordKey("waldlaeufer"), alt); })();
  const aktuelleStufe = () => (S && zustand !== "start" ? S.stufe : stufeWahl);

  function aufbauen() {
    const tx = t();
    root.innerHTML =
      '<p class="label" id="wl-label">' + esc(tx.label) + '</p>' +
      '<h3 id="wl-titel">' + esc(tx.titel) + '</h3>' +
      '<p class="tav-info" id="wl-text">' + esc(tx.text) + '</p>' +
      '<p class="wl-steuerung" id="wl-steuerung">' + esc(tx.steuerung) + '</p>' +
      '<div class="wl-buehne"><button type="button" class="wl-pause" aria-label="Pause"><span aria-hidden="true">❚❚</span></button><div class="wl-schleier"><div class="wl-tafel"></div></div></div>' +
      '<div class="wl-fuss"><span class="wl-rekord"></span><button type="button" class="wl-ton"></button></div>' +
      '<div class="wl-liste" aria-live="polite"></div>';
    buehne = root.querySelector(".wl-buehne");
    buehne.insertBefore(leinwand, buehne.firstChild);
    leinwand.setAttribute("aria-label", tx.titel);
    schleier = root.querySelector(".wl-schleier");
    tafel = root.querySelector(".wl-tafel");
    fussRekord = root.querySelector(".wl-rekord");
    tonKnopf = root.querySelector(".wl-ton");
    pauseKnopf = root.querySelector(".wl-pause");
    listeEl = root.querySelector(".wl-liste");
    tonKnopf.addEventListener("click", () => { tonAn = !tonAn; schreib("imres-waldlauf-ton", tonAn ? "1" : "0"); fussSetzen(); if (tonAn) KLANG.bellen(); });
    pauseKnopf.addEventListener("click", pausieren);
    tafel.addEventListener("click", tafelKlick);
    tafel.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.closest(".wl-name")) { e.preventDefault(); eintragen(); } });
    fussSetzen();
  }
  function fussSetzen() {
    const tx = t(), st = aktuelleStufe(), r = parseInt(lies(rekordKey(st), "0"), 10);
    fussRekord.textContent = r ? tx.rekord(r, tx.stufen[st]) : "";
    tonKnopf.textContent = tonAn ? tx.ton[0] : tx.ton[1];
    tonKnopf.setAttribute("aria-pressed", String(tonAn));
    pauseKnopf.setAttribute("aria-label", tx.pauseKnopf);
  }
  function texteSetzen() {
    const tx = t();
    root.querySelector("#wl-label").textContent = tx.label;
    root.querySelector("#wl-titel").textContent = tx.titel;
    root.querySelector("#wl-text").textContent = tx.text;
    root.querySelector("#wl-steuerung").textContent = tx.steuerung;
    leinwand.setAttribute("aria-label", tx.titel);
    fussSetzen(); listeNeu();
    if (zustand === "start") startZeigen();
    else if (zustand === "pause") pauseZeigen();
    else if (zustand === "wahl") gabenZeigen(true);
    else if (zustand === "ende") spielEnde(true);
  }

  function schleierAuf(html) { tafel.innerHTML = html; schleier.hidden = false; buehne.classList.remove("laeuft"); }
  function schleierZu() { schleier.hidden = true; buehne.classList.add("laeuft"); }

  function stufenHtml(tx) {
    return '<div class="wl-stufen" role="radiogroup" aria-label="' + esc(tx.stufenTitel) + '">' +
      Object.keys(STUFEN).map(k => '<button type="button" role="radio" data-stufe="' + k + '" aria-checked="' + (k === stufeWahl) + '">' + esc(tx.stufen[k]) + '</button>').join("") +
      '</div><p class="wl-stufen-text">' + esc(tx.stufenText[stufeWahl]) + '</p>';
  }
  function startZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.titel) + '</h4>' + stufenHtml(tx) +
      '<button type="button" class="tav-knopf wl-haupt" data-tun="start">' + esc(tx.start) + '</button>');
  }
  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p><button type="button" class="tav-knopf wl-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>' +
      '<button type="button" class="wl-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>');
  }

  let angebot = [];
  function gabenZeigen(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "wahl"; zielen = null; S.vorgemerkt = null;
      S.gegner = S.gegner.filter(e => e.a.art !== "bonus");
      const moegl = Object.keys(GABEN).filter(k => k === "rast" ? S.leben < S.maxLeben : S.gaben[k] < GABEN[k]);
      const ohneRast = moegl.filter(k => k !== "rast");
      const rastRein = moegl.includes("rast") && (S.leben <= 2 || Math.random() < 0.35);
      angebot = mischen(ohneRast).slice(0, rastRein ? 2 : 3);
      if (rastRein) angebot.push("rast");
      if (!angebot.length) angebot = ["rast"];
      KLANG.gabe();
    }
    const dreh = [-1.2, 0.8, -0.5];
    const karten = angebot.map((k, i) => {
      const lvl = S.gaben[k], stufen = tx.gaben[k], [name, text] = stufen[Math.min(lvl, stufen.length - 1)];
      const stufe = GABEN[k] > 1 && GABEN[k] < 99 ? '<span class="stufe">' + esc(tx.stufe(lvl + 1, GABEN[k])) + '</span>' : "";
      return '<button type="button" class="wl-gabe" data-gabe="' + k + '" style="--dreh:' + dreh[i] + 'deg"><span class="sym" aria-hidden="true">' + GABE_SYM[k] + '</span><span class="wl-gabe-text"><strong>' + esc(name) + stufe + '</strong><small>' + esc(text) + '</small></span></button>';
    }).join("");
    const nachBoss = S.bossBesiegt && S.welle === 10;
    schleierAuf('<h4>' + esc(tx.rast) + '</h4>' + (nachBoss ? '<p class="wl-spruch">' + esc(tx.bossSieg) + '</p>' : '<p>' + esc(tx.rastText) + '</p>') +
      '<div class="wl-gaben">' + karten + '</div>' +
      (S.welle >= 3 ? '<button type="button" class="wl-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>' : ""));
  }

  function spielEnde(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "ende"; zielen = null;
      KLANG.ende();
      const alt = parseInt(lies(rekordKey(S.stufe), "0"), 10);
      S.neuerRekord = S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib(rekordKey(S.stufe), String(S.punkte));
      S.altRekord = alt;
      S.genau = S.salven ? Math.round(S.salvenTreffer / S.salven * 100) : 0;
      S.spruchStufe = S.welle >= 14 ? "legende" : S.bossBesiegt ? "boss" : S.welle >= 6 ? "gut" : S.welle >= 3 ? "mittel" : "schwach";
      S.spruchIdx = Math.floor(Math.random() * 3);
      S.eingetragen = ""; S.sendet = false;
    }
    const spruch = tx.spruch[S.spruchStufe][S.spruchIdx];
    const freiwillig = S.leben > 0;
    schleierAuf(
      '<h4>' + esc(freiwillig ? tx.titel : tx.ende) + '</h4>' +
      '<p class="wl-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + ' · ' + esc(tx.stufen[S.stufe]) + '</span></p>' +
      (S.neuerRekord && S.altRekord ? '<p class="wl-neu">' + esc(tx.neuRekord) + '</p>' : "") +
      '<dl class="wl-werte">' +
      '<dt>' + esc(tx.wert.welle) + '</dt><dd>' + S.welle + '</dd>' +
      '<dt>' + esc(tx.wert.erlegt) + '</dt><dd>' + S.erlegt + '</dd>' +
      '<dt>' + esc(tx.wert.genau) + '</dt><dd>' + S.genau + ' %</dd>' +
      '<dt>' + esc(tx.wert.bonus) + '</dt><dd>' + S.bonus + '</dd>' +
      '</dl>' +
      '<p class="wl-spruch">„' + esc(spruch) + '“ <span>– Friedrich</span></p>' +
      eintragHtml(tx) +
      '<button type="button" class="tav-knopf wl-haupt" data-tun="neu">' + esc(tx.nochmal) + '</button>');
    fussSetzen(); listeNeu();
  }

  function tafelKlick(e) {
    const st = e.target.closest("[data-stufe]");
    if (st && zustand === "start") {
      stufeWahl = st.dataset.stufe; schreib("imres-waldlauf-stufe", stufeWahl);
      startZeigen(); fussSetzen(); bestenLaden(stufeWahl);
      return;
    }
    const g = e.target.closest("[data-gabe]");
    if (g && zustand === "wahl") {
      const k = g.dataset.gabe;
      if (k === "rast") S.leben = Math.min(S.maxLeben, S.leben + 2); else S.gaben[k]++;
      if (k === "rex") S.rex.cd = 1.5;
      audio();
      welleStarten(S.welle + 1);
      anwerfen();
      return;
    }
    if (e.target.closest(".wl-eintragen")) { eintragen(); return; }
    const b = e.target.closest("[data-tun]"); if (!b) return;
    const tun = b.dataset.tun;
    audio();
    if (tun === "start") { neuesSpiel(); welleStarten(1); fussSetzen(); listeNeu(); anwerfen(); }
    else if (tun === "neu") { zustand = "start"; S = null; startZeigen(); fussSetzen(); bestenLaden(stufeWahl); zeichnen(performance.now()); }
    else if (tun === "weiter") { zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "beenden") spielEnde();
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause"; zielen = null; S.vorgemerkt = null;
    pauseZeigen();
  }
  document.addEventListener("keydown", e => {
    if (zustand !== "spiel" || !sichtbar) return;
    if (e.key === "Escape" || e.key === "p" || e.key === "P") { e.preventDefault(); pausieren(); }
  });

  /* ---------- Bestenliste: gemeinsam über Supabase (wie beim Auftritt), sonst auf diesem Gerät ---------- */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    return fetch(SERVER.url + pfad, body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) })
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status));
  }
  const besten = {}, serverOk = {}; let meinEintrag = null;
  const lokalLesen = () => { try { return JSON.parse(localStorage.getItem("imres-waldlauf-liste") || "{}") || {}; } catch (_) { return {}; } };
  const sortieren = l => l.sort((a, b) => b.punkte - a.punkte || b.welle - a.welle || String(a.erstellt).localeCompare(String(b.erstellt)));
  function bestenLaden(st) {
    return server("/rest/v1/jagd_bestenliste?select=name,punkte,welle,genauigkeit,erstellt&stufe=eq." + st + "&order=punkte.desc,welle.desc,erstellt.asc&limit=10")
      .then(l => { besten[st] = Array.isArray(l) ? l : []; serverOk[st] = true; })
      .catch(() => { serverOk[st] = false; besten[st] = sortieren(lokalLesen()[st] || []).slice(0, 10); })
      .then(listeNeu);
  }
  function listeNeu() {
    if (!listeEl) return;
    const T = t(), st = aktuelleStufe(), l = besten[st];
    if (!l) { listeEl.innerHTML = ""; return; }
    listeEl.innerHTML = '<h4>' + T.bestenliste + " · " + esc(T.stufen[st]) + "</h4>" +
      (l.length ? "<table><thead><tr>" + T.spalten.map(x => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>" +
        l.map((e, i) => "<tr" + (meinEintrag && e.erstellt === meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.punkte + "</td><td>" + e.welle + "</td></tr>").join("") +
        "</tbody></table>" : '<p class="wl-leer">' + esc(T.leer) + "</p>") +
      (serverOk[st] === false ? '<p class="wl-leer">' + esc(T.nurHier) + "</p>" : "");
  }
  function eintragHtml(T) {
    if (!S || S.punkte <= 0) return "";
    if (S.eingetragen) return '<p class="wl-eingetragen">' + esc(S.eingetragen) + "</p>";
    const name = lies("imres-waldlauf-name", "") || lies("imres-auftritt-name", "");
    return '<div class="wl-eintrag"><input type="text" class="wl-name" maxlength="24" autocomplete="nickname" placeholder="' + esc(T.deinName) + '" value="' + esc(name) + '">' +
      '<button type="button" class="tav-knopf wl-eintragen"' + (S.sendet ? " disabled" : "") + ">" + esc(T.eintragen) + "</button></div>";
  }
  function eintragen() {
    if (!S || zustand !== "ende" || S.eingetragen || S.sendet) return;
    const feld = tafel.querySelector(".wl-name"), name = feld ? feld.value.trim().slice(0, 24) : "";
    if (!name) { if (feld) feld.focus(); return; }
    schreib("imres-waldlauf-name", name);
    const T = t(), st = S.stufe, spiel = S;
    const e = { name, punkte: S.punkte, welle: S.welle, genauigkeit: S.genau, erstellt: new Date().toISOString() };
    const lok = lokalLesen(); lok[st] = sortieren((lok[st] || []).concat([e])).slice(0, 10);
    schreib("imres-waldlauf-liste", JSON.stringify(lok));
    spiel.sendet = true;
    server("/rest/v1/rpc/jagd_eintragen", { p_name: name, p_stufe: st, p_punkte: e.punkte, p_welle: e.welle, p_genauigkeit: e.genauigkeit })
      .catch(() => {}).then(() => bestenLaden(st)).then(() => {
        spiel.sendet = false;
        const l = besten[st] || [];
        const platz = l.findIndex(x => x.name === name && x.punkte === e.punkte && x.welle === e.welle) + 1;
        if (platz) meinEintrag = l[platz - 1].erstellt;
        spiel.eingetragen = platz ? T.eingetragen(platz) : T.eingetragenOhne;
        if (S === spiel && zustand === "ende") spielEnde(true); else listeNeu();
      });
  }

  /* ---------- Eingabe ---------- */
  function punkt(ev) {
    const r = leinwand.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
  }
  leinwand.addEventListener("pointerdown", ev => {
    if (zustand !== "spiel") return;
    ev.preventDefault();
    try { leinwand.setPointerCapture(ev.pointerId); } catch (_) {}
    const p = punkt(ev);
    zielen = { id: ev.pointerId, sx: p.x, sy: p.y, x: p.x, y: p.y };
    audio();
  });
  leinwand.addEventListener("pointermove", ev => {
    if (!zielen || ev.pointerId !== zielen.id) return;
    const p = punkt(ev); zielen.x = p.x; zielen.y = p.y;
  });
  function loslassen(ev, abbrechen) {
    if (!zielen || ev.pointerId !== zielen.id) return;
    const z = abbrechen ? null : zielVektor();
    zielen = null;
    if (z && zustand === "spiel") { if (S.abkuehl <= 0) schiessen(z); else S.vorgemerkt = z; }
  }
  leinwand.addEventListener("pointerup", ev => loslassen(ev, false));
  leinwand.addEventListener("pointercancel", ev => loslassen(ev, true));
  leinwand.addEventListener("contextmenu", ev => ev.preventDefault());

  /* ---------- Größe ---------- */
  function groesse() {
    const r = leinwand.getBoundingClientRect(); if (!r.width) return;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    leinwand.width = Math.round(r.width * dpr); leinwand.height = Math.round(r.height * dpr);
    skala = leinwand.width / W;
    zeichnen(performance.now());
  }

  /* ---------- Stil ---------- */
  const css = document.createElement("style");
  css.textContent = `
.waldlauf .wl-steuerung { font-size: .86rem; color: var(--ash); font-style: italic; }
.wl-buehne { position: relative; width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; aspect-ratio: 4 / 5; border: 1px solid var(--line); background: #0b0a12; overflow: hidden; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; box-shadow: 0 14px 30px rgba(0,0,0,.45); }
.wl-buehne canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; touch-action: pan-y; cursor: crosshair; -webkit-tap-highlight-color: transparent; }
.wl-buehne.laeuft canvas { touch-action: none; }
.wl-schleier { position: absolute; inset: 0; display: grid; place-items: center; padding: clamp(.7rem, 3vw, 1.4rem); background: rgba(9,8,15,.68); text-align: center; overflow-y: auto; }
.wl-schleier[hidden] { display: none; }
.wl-tafel { display: grid; gap: .55rem; justify-items: center; width: 100%; max-width: 30rem; }
.wl-tafel h4 { font-family: var(--name); font-weight: 400; font-size: clamp(1.45rem, 5.5vw, 2rem); line-height: 1.05; color: var(--vellum); }
.wl-tafel p { color: var(--ash); font-size: .92rem; margin: 0; }
.wl-tafel .tav-knopf { justify-self: center; }
.wl-tafel .wl-haupt { font-size: 1rem; padding: .55rem 1.3rem; background: color-mix(in srgb, var(--ember) 14%, transparent); }
.wl-tafel .wl-gross { font-family: var(--display); font-size: clamp(2.2rem, 9vw, 3rem); color: var(--ember) !important; line-height: 1; }
.wl-gross span { font-size: .4em; color: var(--ash); }
.wl-tafel .wl-neu { font-family: var(--hand); font-size: 1.35rem; color: var(--vellum) !important; }
.wl-werte { display: grid; grid-template-columns: auto auto; gap: .15rem 1.1rem; font-size: .88rem; margin: 0; text-align: left; }
.wl-werte dt { color: var(--ash); } .wl-werte dd { margin: 0; color: var(--vellum); font-weight: 600; text-align: right; }
.wl-tafel .wl-spruch { font-family: var(--hand); font-size: 1.25rem; line-height: 1.15; color: var(--ember) !important; }
.wl-spruch span { font-family: var(--body); font-size: .8rem; color: var(--ash); white-space: nowrap; }
.wl-gaben { display: grid; gap: .6rem; width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.wl-gabe { display: grid; gap: .3rem; justify-items: center; align-content: start; padding: .75rem .5rem .7rem; border: 0; cursor: pointer; font: inherit; text-align: center;
  background: linear-gradient(172deg, #f1e7cf, #ddcca8); color: #2a2118; box-shadow: 0 8px 18px rgba(0,0,0,.45);
  transform: rotate(var(--dreh, 0deg)); transition: transform .2s, box-shadow .2s; -webkit-tap-highlight-color: transparent; }
.wl-gabe:hover, .wl-gabe:focus-visible { transform: translateY(-3px) rotate(var(--dreh, 0deg)); box-shadow: 0 0 0 2px var(--ember), 0 12px 24px rgba(0,0,0,.5); outline: none; }
.wl-gabe .sym { font-size: 1.7rem; line-height: 1; }
.wl-gabe-text { display: grid; gap: .15rem; }
.wl-gabe strong { font-family: var(--name); font-weight: 400; font-size: 1.05rem; line-height: 1.1; color: #1d1610; }
.wl-gabe .stufe { display: block; font-family: var(--body); font-size: .66rem; letter-spacing: .06em; text-transform: uppercase; color: var(--blood); }
.wl-gabe small { font-size: .8rem; line-height: 1.25; color: #5a4a36; }
@media (max-width: 480px) {
  .wl-gaben { grid-template-columns: 1fr; gap: .45rem; }
  .wl-gabe { grid-template-columns: auto 1fr; justify-items: start; align-items: center; text-align: left; gap: .6rem; padding: .4rem .7rem; }
  .wl-gabe .sym { font-size: 1.35rem; }
  .wl-gabe strong { font-size: .98rem; }
  .wl-gabe .stufe { display: inline; margin-left: .35rem; }
  .wl-gabe small { font-size: .76rem; line-height: 1.2; }
  .wl-tafel { gap: .4rem; }
  .wl-tafel h4 { font-size: 1.35rem; }
  .wl-tafel p { font-size: .85rem; }
  .wl-tafel .wl-gross { font-size: 2.1rem; }
  .wl-werte { font-size: .78rem; gap: 0 .6rem; grid-template-columns: auto auto auto auto; }
  .wl-tafel .wl-spruch { font-size: 1.1rem; }
  .wl-tafel .wl-haupt { padding: .4rem 1.1rem; font-size: .95rem; }
}
.wl-leise { background: none; border: 0; color: var(--ash); font: inherit; font-size: .85rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: .2rem; }
.wl-pause { position: absolute; top: 9%; right: 8px; z-index: 2; display: none; width: 2.3rem; height: 2.3rem; padding: 0; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.55); color: var(--vellum); font-size: .8rem; letter-spacing: -.1em; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.wl-pause:hover, .wl-pause:focus-visible { border-color: var(--ember); color: var(--ember); }
.wl-buehne.laeuft .wl-pause { display: grid; place-items: center; }
.wl-stufen { display: flex; flex-wrap: wrap; justify-content: center; gap: .3rem; }
.wl-stufen button { border: 1px solid var(--line); background: rgba(9,8,15,.4); color: var(--vellum); font: inherit; font-size: .82rem; padding: .38rem .55rem; white-space: nowrap; cursor: pointer; }
.wl-stufen button[aria-checked="true"] { border-color: var(--ember); background: rgba(224,160,70,.18); color: var(--ember); }
.wl-tafel .wl-stufen-text { font-style: italic; font-size: .85rem; min-height: 1.3em; }
.wl-eintrag { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem; }
.wl-name { background: rgba(0,0,0,.35); border: 1px solid var(--line); color: var(--vellum); font: inherit; font-size: .9rem; padding: .4rem .6rem; width: 10.5rem; min-width: 0; }
.wl-eintrag .tav-knopf { font-size: .88rem; padding: .4rem .8rem; }
.wl-tafel .wl-eingetragen { color: var(--ember); }
.wl-liste { width: 100%; max-width: min(100%, calc(76vh * .8)); justify-self: center; }
.wl-liste:empty { display: none; }
.wl-liste h4 { font-family: var(--display); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ember); margin: .2rem 0 .4rem; font-weight: 400; }
.wl-liste table { width: 100%; border-collapse: collapse; font-size: .88rem; }
.wl-liste th { text-align: left; font-weight: normal; color: var(--ash); font-size: .75rem; border-bottom: 1px solid var(--line); padding: .25rem .4rem; }
.wl-liste td { padding: .3rem .4rem; border-bottom: 1px solid rgba(235,226,204,.06); }
.wl-liste td:nth-child(3), .wl-liste th:nth-child(3), .wl-liste td:nth-child(4), .wl-liste th:nth-child(4) { text-align: right; }
.wl-liste tr.mein td { color: var(--ember); }
.wl-leer { color: var(--ash); font-size: .85rem; font-style: italic; margin: .3rem 0 0; }
.wl-fuss { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; font-size: .88rem; color: var(--ash); }
.wl-ton { background: none; border: 1px solid var(--line); color: var(--ash); font: inherit; font-size: .84rem; padding: .3rem .75rem; cursor: pointer; }
.wl-ton:hover { color: var(--vellum); border-color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .wl-gabe { transition: none; } }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  aufbauen();
  bestenLaden(stufeWahl);
  bilderLaden();
  hintergrundBauen();
  startZeigen();
  if (window.ResizeObserver) new ResizeObserver(groesse).observe(buehne); else window.addEventListener("resize", groesse);
  groesse();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => zeichnen(performance.now()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(eintraege => {
      sichtbar = eintraege[0].isIntersecting;
      if (sichtbar) anwerfen(); else pausieren();
    }, { threshold: 0.15 }).observe(buehne);
  } else { sichtbar = true; anwerfen(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) pausieren(); else anwerfen(); });
  let letzteSprache = sprache();
  new MutationObserver(() => { if (sprache() === letzteSprache) return; letzteSprache = sprache(); texteSetzen(); zeichnen(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
