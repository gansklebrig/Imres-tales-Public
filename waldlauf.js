/* =====================================================================
   FRIEDRICHS JAGD – Bogenspiel in der Taverne
   Nachts auf der Lichtung: Goblins, Banditen und Kreaturen aus dem
   Bestiarium ziehen vorbei (Goblins & Banditen sind selbst gemalt).
   Ziehen & loslassen spannt den Bogen (wie eine Schleuder). Rex bellt,
   bevor etwas auftaucht. Nach jeder Welle wählt man eine Gabe
   (Doppelschuss, Feuerpfeile, Rex packt zu …). Welle 6: Demogorgon.
   Danach geht die Nacht endlos weiter, bis das Lager fällt.
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
      wellen: ["Goblins auf der Straße", "Banditen im Hinterhalt", "Etwas raschelt im Unterholz", "Schwingen und schwere Schritte", "Ein Summen in der Luft", "Der Dämonenfürst"],
      endlos: "Die Nacht wird länger",
      wuff: "Wuff!", grr: "Grrr!", entkommen: "Entkommen!", doppel: "Doppeltreffer!", dreifach: "Dreifachtreffer!",
      bossFaellt: "Demogorgon fällt!", bossRuft: "Demogorgon brüllt!",
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
      punkte: "Punkte", wert: { welle: "Welle erreicht", erlegt: "Kreaturen erlegt", genau: "Treffsicherheit", serie: "Beste Serie", boss: "Demogorgon" },
      bossJa: "besiegt ✓", bossNein: "–",
      rekord: n => "Bester Jagdzug hier: " + n + " Punkte", neuRekord: "Neuer Rekord!",
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
      wellen: ["Goblins on the road", "Bandits lying in ambush", "Something rustles in the undergrowth", "Wings and heavy footsteps", "A buzzing in the air", "The Demon Prince"],
      endlos: "The night grows longer",
      wuff: "Woof!", grr: "Grrr!", entkommen: "Escaped!", doppel: "Double hit!", dreifach: "Triple hit!",
      bossFaellt: "Demogorgon falls!", bossRuft: "Demogorgon roars!",
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
      punkte: "points", wert: { welle: "Wave reached", erlegt: "Creatures slain", genau: "Accuracy", serie: "Best streak", boss: "Demogorgon" },
      bossJa: "defeated ✓", bossNein: "–",
      rekord: n => "Best hunt here: " + n + " points", neuRekord: "New record!",
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
    demogorgon: { bild: "demogorgon.webp", hoehe: 196, hp: 28, tempo: 15, punkte: 400, art: "boss", blick: -1, splitter: ["#e0a046", "#9b3a2f", "#c98a3a"] }
  };

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
    ende: () => [392, 330, 262, 196].forEach((f, i) => ton("triangle", f, f * 0.98, 0.35, 0.12, i * 0.22))
  };

  /* ---------- Spielzustand ---------- */
  let zustand = "start"; // start | spiel | wahl | pause | ende
  let S = null;
  function neuesSpiel() {
    S = {
      welle: 0, leben: 5, punkte: 0, combo: 0, besteCombo: 0, erlegt: 0, salven: 0, salvenTreffer: 0, bossBesiegt: false,
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
    if (n === 1) { add("goblin", 9); abstand = 1.55; }
    else if (n === 2) { add("goblin", 7); add("bandit", 5); abstand = 1.4; }
    else if (n === 3) { add("blight", 7); add("goblin", 4); add("bandit", 2); abstand = 1.3; }
    else if (n === 4) { add("vrock", 4); add("bugbear", 3); add("goblin", 4); add("blight", 3); abstand = 1.2; }
    else if (n === 5) { add("chasme", 5); add("vrock", 3); add("bugbear", 2); add("bandit", 3); add("blight", 3); abstand = 1.1; }
    else if (n === 6) return { liste: ["demogorgon"], abstand: 0, boss: true };
    else {
      const k = n - 6;
      add("goblin", 3 + k); add("bandit", 2 + Math.ceil(k / 2)); add("blight", 4 + k); add("vrock", 3 + k); add("bugbear", 2 + Math.ceil(k / 2)); add("chasme", 3 + k);
      abstand = Math.max(0.55, 1.05 - 0.06 * k);
      mischen(l);
      if (k % 3 === 0) { l.splice(Math.floor(l.length / 2), 0, "demogorgon"); return { liste: l, abstand, boss: true }; }
      return { liste: l, abstand };
    }
    const erste = [l[0], l[0]];
    return { liste: erste.concat(mischen(l.slice(2))), abstand };
  }

  function welleStarten(n) {
    S.welle = n;
    const w = welleBauen(n);
    S.warte = w.liste.map(typ => ({ typ, dir: Math.random() < 0.5 ? 1 : -1 }));
    S.abstand = w.abstand; S.bossWelle = !!w.boss;
    S.spawnT = 2.2; S.gebellt = false; S.welleFertigT = -1;
    S.eskorteT = 5; S.eskorte2T = 9;
    const tx = t();
    S.banner = { titel: tx.welle(n), unter: n <= 6 ? tx.wellen[n - 1] : tx.endlos, t: 0, dauer: 2.2 };
    zustand = "spiel";
    schleierZu();
  }

  function tempoFaktor() { return Math.pow(0.85, S.gaben.echo) * (1 + 0.07 * Math.max(0, S.welle - 6)); }

  function spawnen(e) {
    const a = ARTEN[e.typ], sp = SPRITES[e.typ];
    const verh = sp ? sp.verh : 0.8;
    let y, s, bahn = -1;
    if (a.art === "boden") { bahn = Math.floor(Math.random() * 3); y = BAHNEN[bahn].y; s = BAHNEN[bahn].s; }
    else if (a.art === "flug") { y = 120 + Math.random() * 150; s = 0.72 + (y - 120) / 150 * 0.28; }
    else { bahn = 1; y = BAHNEN[1].y + 10; s = 1; }
    const h = a.hoehe * s, w = h * verh;
    const extra = S.welle > 6 ? Math.floor((S.welle - 6) / 3) : 0;
    const hp = a.art === "boss" ? a.hp + 10 * extra : a.hp + (a.hp > 1 ? extra : 0);
    S.gegner.push({
      typ: e.typ, a, x: e.dir === 1 ? -w / 2 : W + w / 2, y, basisY: y, s, h, w, dir: e.dir, bahn,
      hp, maxHp: hp, t: 0, phase: Math.random() * 6, tempo: a.tempo * (0.9 + Math.random() * 0.2),
      tot: 0, blitz: 0, gehalten: false, getroffenVon: {}
    });
    if (a.art === "boss") { KLANG.bruellen(); S.beben = 0.7; S.bossRufT = 4; textAuf(W / 2, 200, t().bossRuft, "#c4564a", 26, 1.6); }
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
      S.punkte += p; S.erlegt++;
      if (salve) salve.kills++;
      const m = mitte(e);
      textAuf(m.x, m.y - 10, "+" + p, "#ebe2cc", e.a.art === "boss" ? 30 : 18, 0.9);
      funken(m.x, m.y, e.a.splitter, e.a.art === "boss" ? 70 : 16);
      KLANG.tod();
      if (e.a.art === "boss") { S.bossBesiegt = true; S.beben = 1; KLANG.bruellen(); textAuf(W / 2, 180, t().bossFaellt, "#e0a046", 30, 2.2); }
      return true;
    }
    return false;
  }
  function mitte(e) { return { x: e.x, y: e.y - e.h * (e.a.art === "boss" ? 0.55 : 0.5) }; }
  function radius(e) { return Math.min(e.w, e.h) * (e.a.art === "boss" ? 0.4 : 0.38) + 3; }

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

    // Demogorgon ruft Verstärkung
    const boss = S.gegner.find(e => e.a.art === "boss" && !e.tot);
    if (boss) {
      S.eskorteT -= dt; S.eskorte2T -= dt;
      if (S.eskorteT <= 0) { S.eskorteT = 3.8; S.warte.unshift({ typ: zufall(["blight", "blight", "goblin"]), dir: Math.random() < 0.5 ? 1 : -1 }); S.spawnT = Math.min(S.spawnT, 1); S.gebellt = false; }
      if (S.eskorte2T <= 0) { S.eskorte2T = 7; S.warte.unshift({ typ: S.welle > 6 ? zufall(["chasme", "vrock", "bandit"]) : "chasme", dir: Math.random() < 0.5 ? 1 : -1 }); S.spawnT = Math.min(S.spawnT, 1); S.gebellt = false; }
      S.bossRufT -= dt;
      if (S.bossRufT <= 0) { S.bossRufT = 9; S.beben = 0.5; KLANG.bruellen(); }
    }

    const tf = tempoFaktor();
    S.gegner.forEach(e => {
      e.t += dt; e.blitz = Math.max(0, e.blitz - dt);
      if (e.tot) { e.tot += dt; return; }
      if (!e.gehalten) e.x += e.dir * e.tempo * tf * dt;
      if (e.a.art === "boden") e.y = e.basisY + Math.sin(e.t * 9 + e.phase) * 1.4 * e.s;
      else if (e.typ === "vrock") e.y = e.basisY + Math.sin(e.t * 2.1 + e.phase) * 28 * e.s;
      else if (e.typ === "chasme") e.y = e.basisY + Math.sin(e.t * 5.2 + e.phase) * 34 * e.s + Math.sin(e.t * 1.3) * 18;
      else e.y = e.basisY + Math.sin(e.t * 1.6) * 3;
      if ((e.dir === 1 && e.x - e.w / 2 > W) || (e.dir === -1 && e.x + e.w / 2 < 0)) {
        e.weg = true;
        const verlust = e.a.art === "boss" ? 3 : 1;
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

    if (!S.warte.length && !S.gegner.length && S.welleFertigT < 0) S.welleFertigT = 0;
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
    const sp = SPRITES[e.typ];
    let alpha = 1, dy = 0, dreh = 0;
    if (e.tot) { const k = e.tot / 0.5; alpha = 1 - k; dy = k * 18; dreh = e.dir * k * 0.5; }
    if (e.a.art === "boden" && e.t < 0.35) dy += (1 - e.t / 0.35) * e.h * 0.6;
    const wackel = e.gehalten ? Math.sin(e.t * 40) * 2 : 0;
    ctx.save();
    ctx.globalAlpha = alpha * (e.blitz > 0 ? 0.55 : 1);
    ctx.translate(e.x + wackel, e.y + dy);
    if (dreh) ctx.rotate(dreh);
    if (e.typ === "vrock" || e.typ === "chasme") ctx.rotate(Math.sin(e.t * 3 + e.phase) * 0.06);
    if (sp) {
      const img = (e.dir === e.a.blick) ? sp.normal : sp.gespiegelt;
      ctx.shadowColor = e.a.art === "boss" ? "rgba(196,86,74,.55)" : "rgba(235,226,204,.38)"; ctx.shadowBlur = e.a.art === "boss" ? 18 : 9;
      ctx.drawImage(img, -e.w / 2, -e.h, e.w, e.h);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = e.a.splitter[0]; ctx.beginPath(); ctx.ellipse(0, -e.h / 2, e.w / 2.4, e.h / 2.2, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (!e.tot && e.maxHp > 1) {
      const bw = e.a.art === "boss" ? 120 : Math.max(26, e.w * 0.55), bx = e.x - bw / 2, by = e.y - e.h - 8;
      ctx.fillStyle = "rgba(16,14,21,.75)"; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
      ctx.fillStyle = e.a.art === "boss" ? "#c4564a" : "#e0a046"; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 3);
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
    let hs = ""; for (let i = 0; i < 5; i++) hs += i < S.leben ? "♥" : "♡";
    ctx.fillStyle = S.leben <= 1 ? "#c4564a" : "#e0a046"; ctx.fillText(hs, W - 10, 9);
    if (S.leben > 5) { ctx.font = "12px " + FONT_D; ctx.fillText("+" + (S.leben - 5), W - 10, 25); }
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
    if (S) bannerZeichnen();
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
  let buehne, schleier, tafel, fussRekord, tonKnopf;
  function aufbauen() {
    const tx = t();
    root.innerHTML =
      '<p class="label" id="wl-label">' + esc(tx.label) + '</p>' +
      '<h3 id="wl-titel">' + esc(tx.titel) + '</h3>' +
      '<p class="tav-info" id="wl-text">' + esc(tx.text) + '</p>' +
      '<p class="wl-steuerung" id="wl-steuerung">' + esc(tx.steuerung) + '</p>' +
      '<div class="wl-buehne"><div class="wl-schleier"><div class="wl-tafel"></div></div></div>' +
      '<div class="wl-fuss"><span class="wl-rekord"></span><button type="button" class="wl-ton"></button></div>';
    buehne = root.querySelector(".wl-buehne");
    buehne.insertBefore(leinwand, buehne.firstChild);
    leinwand.setAttribute("aria-label", tx.titel);
    schleier = root.querySelector(".wl-schleier");
    tafel = root.querySelector(".wl-tafel");
    fussRekord = root.querySelector(".wl-rekord");
    tonKnopf = root.querySelector(".wl-ton");
    tonKnopf.addEventListener("click", () => { tonAn = !tonAn; schreib("imres-waldlauf-ton", tonAn ? "1" : "0"); fussSetzen(); if (tonAn) KLANG.bellen(); });
    tafel.addEventListener("click", tafelKlick);
    fussSetzen();
  }
  function fussSetzen() {
    const tx = t(), r = parseInt(lies("imres-waldlauf-rekord", "0"), 10);
    fussRekord.textContent = r ? tx.rekord(r) : "";
    tonKnopf.textContent = tonAn ? tx.ton[0] : tx.ton[1];
    tonKnopf.setAttribute("aria-pressed", String(tonAn));
  }
  function texteSetzen() {
    const tx = t();
    root.querySelector("#wl-label").textContent = tx.label;
    root.querySelector("#wl-titel").textContent = tx.titel;
    root.querySelector("#wl-text").textContent = tx.text;
    root.querySelector("#wl-steuerung").textContent = tx.steuerung;
    leinwand.setAttribute("aria-label", tx.titel);
    fussSetzen();
    if (zustand === "start") startZeigen();
    else if (zustand === "pause") pauseZeigen();
    else if (zustand === "wahl") gabenZeigen(true);
    else if (zustand === "ende") spielEnde(true);
  }

  function schleierAuf(html) { tafel.innerHTML = html; schleier.hidden = false; buehne.classList.remove("laeuft"); }
  function schleierZu() { schleier.hidden = true; buehne.classList.add("laeuft"); }

  function startZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.titel) + '</h4><p>' + esc(tx.steuerung) + '</p><button type="button" class="tav-knopf wl-haupt" data-tun="start">' + esc(tx.start) + '</button>');
  }
  function pauseZeigen() {
    const tx = t();
    schleierAuf('<h4>' + esc(tx.pause) + '</h4><p>' + esc(tx.pauseText) + '</p><button type="button" class="tav-knopf wl-haupt" data-tun="weiter">' + esc(tx.weiter) + '</button>');
  }

  let angebot = [];
  function gabenZeigen(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "wahl"; zielen = null; S.vorgemerkt = null;
      const moegl = Object.keys(GABEN).filter(k => k === "rast" ? S.leben < 5 : S.gaben[k] < GABEN[k]);
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
    const nachBoss = S.bossBesiegt && S.welle === 6;
    schleierAuf('<h4>' + esc(tx.rast) + '</h4>' + (nachBoss ? '<p class="wl-spruch">' + esc(tx.bossSieg) + '</p>' : '<p>' + esc(tx.rastText) + '</p>') +
      '<div class="wl-gaben">' + karten + '</div>' +
      (S.welle >= 6 ? '<button type="button" class="wl-leise" data-tun="beenden">' + esc(tx.beenden) + '</button>' : ""));
  }

  let letzterSpruch = "";
  function spielEnde(nurNeuZeichnen) {
    const tx = t();
    if (!nurNeuZeichnen) {
      zustand = "ende"; zielen = null;
      KLANG.ende();
      const alt = parseInt(lies("imres-waldlauf-rekord", "0"), 10);
      S.neuerRekord = S.punkte > alt && S.punkte > 0;
      if (S.neuerRekord) schreib("imres-waldlauf-rekord", String(S.punkte));
      S.altRekord = alt;
      const stufe = S.welle >= 10 ? "legende" : S.bossBesiegt ? "boss" : S.welle >= 4 ? "gut" : S.welle >= 2 ? "mittel" : "schwach";
      S.spruchStufe = stufe; S.spruchIdx = Math.floor(Math.random() * 3);
    }
    letzterSpruch = tx.spruch[S.spruchStufe][S.spruchIdx];
    const genau = S.salven ? Math.round(S.salvenTreffer / S.salven * 100) : 0;
    const freiwillig = S.leben > 0;
    schleierAuf(
      '<h4>' + esc(freiwillig ? tx.titel : tx.ende) + '</h4>' +
      '<p class="wl-gross">' + S.punkte + ' <span>' + esc(tx.punkte) + '</span></p>' +
      (S.neuerRekord && S.altRekord ? '<p class="wl-neu">' + esc(tx.neuRekord) + '</p>' : "") +
      '<dl class="wl-werte">' +
      '<dt>' + esc(tx.wert.welle) + '</dt><dd>' + S.welle + '</dd>' +
      '<dt>' + esc(tx.wert.erlegt) + '</dt><dd>' + S.erlegt + '</dd>' +
      '<dt>' + esc(tx.wert.genau) + '</dt><dd>' + genau + ' %</dd>' +
      '<dt>' + esc(tx.wert.serie) + '</dt><dd>' + S.besteCombo + '</dd>' +
      '<dt>' + esc(tx.wert.boss) + '</dt><dd>' + esc(S.bossBesiegt ? tx.bossJa : tx.bossNein) + '</dd>' +
      '</dl>' +
      '<p class="wl-spruch">„' + esc(letzterSpruch) + '“ <span>– Friedrich</span></p>' +
      '<button type="button" class="tav-knopf wl-haupt" data-tun="start">' + esc(tx.nochmal) + '</button>');
    fussSetzen();
  }

  function tafelKlick(e) {
    const g = e.target.closest("[data-gabe]");
    if (g && zustand === "wahl") {
      const k = g.dataset.gabe;
      if (k === "rast") S.leben = Math.min(5, S.leben + 2); else S.gaben[k]++;
      if (k === "rex") S.rex.cd = 1.5;
      audio();
      welleStarten(S.welle + 1);
      anwerfen();
      return;
    }
    const b = e.target.closest("[data-tun]"); if (!b) return;
    const tun = b.dataset.tun;
    audio();
    if (tun === "start") { neuesSpiel(); welleStarten(1); anwerfen(); }
    else if (tun === "weiter") { zustand = "spiel"; schleierZu(); anwerfen(); }
    else if (tun === "beenden") spielEnde();
  }

  function pausieren() {
    if (zustand !== "spiel") return;
    zustand = "pause"; zielen = null; S.vorgemerkt = null;
    pauseZeigen();
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
.wl-fuss { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; font-size: .88rem; color: var(--ash); }
.wl-ton { background: none; border: 1px solid var(--line); color: var(--ash); font: inherit; font-size: .84rem; padding: .3rem .75rem; cursor: pointer; }
.wl-ton:hover { color: var(--vellum); border-color: var(--ember); }
@media (prefers-reduced-motion: reduce) { .wl-gabe { transition: none; } }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  aufbauen();
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
