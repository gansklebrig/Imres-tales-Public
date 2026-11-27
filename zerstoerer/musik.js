/* Ezekiel – The Destroyer · Musik und Klangkulisse
   Die Musik entsteht live aus echten Instrumentaufnahmen (klang/) plus prozeduralen Schichten (WebAudio):
   Streicherteppich, Pulsbass, Sub-Trommel, Rasselticks und Herzschlag – alles in Tonart und Tempo des Gebiets.

   KAMPFINTENSITÄT (0…1, geglättet): nahe wache Gegner (Elites ×2, Bosse ×3), eingesteckter und ausgeteilter
   Schaden, Kill-Ketten, wenig Leben, Prüfungskammer/Hinterhalt und Schübe anderer Module (Z.music.push).
   Daraus wird mit Hysterese eine STUFE gewählt, die nur auf Schlag- bzw. Taktgrenzen wechselt:
     0 Erkundung – Bordun, Teppich, Chor, spärliche Melodie, „Farbe“ (Harfe, Glocken …)
     1 Spannung  – leise Pauken und Zupfer, wenn Gegner wach werden oder näher kommen
     2 Kampf     – Ostinato (3+3+2), Bass, Trommeln, Sub-Trommel, ab mittlerer Intensität Blech und Ticks
     3 Elite     – zusätzlich Pulsbass in Achteln, Rasselticks in Sechzehnteln, Tremolo, Blech auf jedem Akkord
     4 Boss      – alles, Pulsbass galoppiert, Chor, Sub-Trommel auf allen Vierteln
   Aufwärts: Kampf auf die nächste Viertel, Elite/Boss auf den nächsten halben Takt; abwärts nur auf die Eins.
   Stinger: Kampfbeginn, Ruhe, Elite-Sichtung, Kill-Ketten-Stufen, seltene Beute, Herausforderung geschafft,
   Boss/Bossphase/Sieg, Tod, Tagebuchseite, Truhe, Hinterhalt; Motive (z. B. „nemesis“) über Z.music.motif.
   Bei wenig Leben: Tiefpass, der mit dem Puls atmet, und ein Herzschlag im Takt. Pausenmenü: Tiefpass.
   Gebietswechsel: weiche Überblendung. Einstellung „Musikdynamik“ (aus/normal/stark) in Z.settings.musikDyn.

   ÖFFENTLICHE SCHNITTSTELLE (für andere Module):
     Z.music.intensity          geglättete Intensität 0…1 (nur lesen)
     Z.music.tier / tierName    aktuelle Stufe 0…4 / "erkundung" "spannung" "kampf" "elite" "boss"
     Z.music.push(betrag, dauer) kurzfristiger Intensitätsschub (0…1, Sekunden; klingt linear ab), gibt id zurück
     Z.music.stinger(name, o)   kampf ruhe elite kette{n} beute{rar} geschafft boss phase sieg tod seite truhe hinterhalt
     Z.music.motif(name, o)     registriertes Motiv in der Tonart des Gebiets spielen; o: { quant:"takt"|"schlag"|"sofort",
                                vol, leit: Sekunden (Melodie übernimmt das Motiv so lange), push }
     Z.music.defineMotif(name, { notes:[[Halbton, StartAchtel, LängeAchtel], …], inst:["pos","horn"], oct, vol, choir, drum })
     Z.music.key()              { root, scale, bpm, name } des laufenden Gebiets
     Z.music.setDynamics(m)     "aus" | "normal" | "stark"
     Z.music.set(id)            Gebiet setzen (wie bisher) */
(function () {
  "use strict";
  const Z = window.Z, A = Z.audio;
  const K = n => "klang/" + n + ".mp3";
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = l => l[Math.floor(Math.random() * l.length)];

  /* verfügbare Tonhöhen je Instrument (MIDI-Nummern der Aufnahmen in klang/) */
  const INST = {
    vc: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], vctrem: [36, 40, 43, 50, 53, 57, 59, 60, 64, 67, 71, 74, 77],
    ooh: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78], aah: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81],
    rorg: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88],
    orgel: [36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96], eh: [52, 55, 58, 61, 64, 67, 70, 73, 76, 79],
    harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101],
    koto: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93], hpan: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    cel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108], kal: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96],
    bra: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], blech: [46, 49, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82],
    tuba: [34, 39, 41, 46, 50, 53, 58], hornst: [33, 36, 39, 43, 46, 50, 53, 57, 60, 74, 77], timpt: [36, 39, 42, 45, 48, 51, 54, 57],
    rgl: [60, 63, 66, 69, 72, 75, 78], mar: [45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96], dudel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87],
    spic: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77], pizz: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84],
    vlntrem: [55, 57, 59, 62, 69, 72, 76, 79, 83, 86], kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59],
    horn: [36, 39, 43, 46, 50, 53, 57, 60], pos: [34, 37, 39, 41, 46, 50, 53, 60, 61, 63, 65], trpst: [53, 57, 60, 63, 65, 67, 70, 74, 77, 81, 84],
    glock: [79, 84, 91, 96, 103, 108], fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96], pfeife: [72, 75, 78, 81, 84, 87, 90, 93, 96],
    shaku: [55, 58, 61, 64, 67, 70, 73, 76, 79, 82], shanai: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93],
    sitar: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], cemb: [41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89],
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], spiel: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105],
    glas: [75, 78, 86], didge: [37], oboe: [58, 62, 65, 70, 74, 77, 82, 86, 89],
    mbira: [46, 48, 50, 51, 53, 55, 56, 58, 60, 62, 63, 65, 67, 68, 70, 72, 73, 74, 75], akk: [53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 83, 86, 89],
    /* weitere Aufnahmen (VSCO 2 CE / VCSL, siehe klang/LIZENZ.txt): gestrichener Psalter, Handglocken, Volksharfe, Zither,
       Okarina, Stimme, Fagott, Klarinette, Blockflöte */
    psab: [70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90], hglo: [60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 81, 84, 86, 88, 90, 92, 94, 96],
    fharfe: [36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92],
    zit: [47, 49, 51, 54, 56, 59, 61, 63, 66, 68, 71, 73, 75, 78, 80, 83], oka: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90],
    stimme: [57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87], fag: [34, 37, 41, 45, 46, 48, 55, 60, 63, 68, 69, 72],
    klar: [50, 53, 58, 62, 65, 70, 74, 77, 82, 86, 90], bfl: [60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96]
  };
  function nearest(inst, midi) { const l = INST[inst]; let best = l[0]; for (const n of l) if (Math.abs(n - midi) < Math.abs(best - midi)) best = n; return best; }
  /* Ton in den Umfang des Instruments oktavieren, damit nichts unnatürlich weit verstimmt klingt */
  function fit(inst, midi) { const l = INST[inst]; if (!l) return midi; const lo = l[0] - 4, hi = l[l.length - 1] + 4; while (midi > hi) midi -= 12; while (midi < lo) midi += 12; return midi; }

  /* Tonleitern (Halbtonschritte) */
  const SC = { moll: [0, 2, 3, 5, 7, 8, 10], dorisch: [0, 2, 3, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], hpan: [0, 2, 3, 5, 7, 8, 10] };
  const SC_NAME = { moll: "Moll (äolisch)", dorisch: "dorisch", phryg: "phrygisch", harm: "harmonisch Moll", hpan: "Moll (Handpan)" };
  const NN = ["C", "Cis", "D", "Es", "E", "F", "Fis", "G", "As", "A", "B", "H"];
  /* R16 Registerlage: Basstöne nicht unter die Grenze (sonst 20–40 Hz – auf den meisten Lautsprechern nur Brei/Druck, kein Ton) */
  const lift = (m, floor) => { while (m < floor) m += 12; return m; };
  const deg = (scale, i, root) => { const s = SC[scale], n = s.length; const o = Math.floor(i / n); return root + s[((i % n) + n) % n] + 12 * o; };

  /* Profile je Gebiet: Grundton (MIDI), Tempo, Leiter und Besetzung der Ebenen.
     drone/pad/mel/col = Erkundung, ost/bass/brass/dr = Kampf. dr: [tief, mittel, hoch].
     pw = Wellenform des Pulsbasses, tick = Farbe der Rasselticks (Bandpass-Mitte in Hz). */
  const PROF = {
    lager:    { root: 50, bpm: 66, scale: "hpan", drone: "didge", pad: null, mel: "hpan", col: "kal", calm: true, wave: "triangle" },
    /* Titelmenü: dieselbe Tonart wie das Lager (D, Handpan-Moll), noch langsamer; gestrichener Psalter singt, Handpan tropft als Farbe */
    /* R12: Trauer nach dem Tod (in der Tonart des Lagers, damit der Weg ins Lager ohne Bruch weiterklingt) und Abspann nach dem
       Endboss (D dorisch, Choral aus Chor, Horn und Pauke – getragen statt laut) */
    trauer:   { root: 50, bpm: 50, scale: "hpan", drone: "vc", pad: "ooh", mel: "stimme", col: "hglo", calm: true, wave: "triangle", still: true },
    abspann:  { root: 50, bpm: 68, scale: "dorisch", drone: "vc", pad: "aah", mel: "horn", col: "harfe", calm: true, wave: "triangle", still: true, hymne: true },
    titel:    { root: 50, bpm: 56, scale: "hpan", drone: "vc", pad: "ooh", mel: "psab", col: "hpan", calm: true, wave: "triangle", titel: true },
    passage:  { root: 50, bpm: 60, scale: "hpan", drone: "vc", pad: "ooh", mel: "hpan", col: "glas", calm: true },
    torhof:   { root: 50, bpm: 92, scale: "dorisch", drone: "vc", pad: "ooh", mel: "eh", col: "harfe", ost: "spic", bass: "kb", brass: "hornst", dr: ["taiko_36", "timp1", "marsch1"], tick: 7000 },
    /* Keller: in der Ruhe gemütlich (Koto, Kalimba), im Kampf bedrohlich – Spiccato statt Pizzicato, b2-Akkorde, Posaunen mit kleiner Sekunde */
    keller:   { root: 45, bpm: 84, scale: "phryg", drone: "rorg", pad: "ooh", mel: "koto", col: "kal", ost: "pizz", ostC: "spic", bass: "kb", brass: "pos", dr: ["riese1", "bodh1", "rahm_1"], tick: 4800,
                acc: "drohung", progC: [[0, 1, 0, 6], [0, 1, 5, 1], [0, 6, 1, 0], [0, 0, 1, 1], [0, 5, 1, 4]] },
    hallen:   { root: 48, bpm: 96, scale: "harm", drone: "orgel", pad: "aah", mel: "bra", col: "cemb", ost: "spic", bass: "tuba", brass: "blech", dr: ["timp1", "marsch1", "snare1"], tick: 6500 },
    wehrgang: { root: 52, bpm: 104, scale: "dorisch", drone: "vc", pad: "aah", mel: "fl", col: "pfeife", ost: "spic", bass: "kb", brass: "trpst", dr: ["taiko_42", "marsch2", "snare2"], tick: 8000 },
    verlies:  { root: 43, bpm: 78, scale: "phryg", drone: "vctrem", pad: "ooh", mel: "cel", col: "spiel", ost: "pizz", bass: "kb", brass: "pos", dr: ["riese2", "bodh2", "schlitz1"], tick: 4200 },
    hafen:    { root: 50, bpm: 98, scale: "dorisch", drone: "vc", pad: "ooh", mel: "dudel", col: "gitarre", ost: "pizz", bass: "kb", brass: "hornst", dr: ["bodh1", "taiko_48", "tamb_1"], tick: 7500 },
    glocken:  { root: 47, bpm: 100, scale: "moll", drone: "rorg", pad: "aah", mel: "rgl", col: "glock", ost: "spic", bass: "tuba", brass: "blech", dr: ["timp3", "marsch1", "triangel1"], tick: 9000 },
    schlund:  { root: 44, bpm: 82, scale: "phryg", drone: "vctrem", pad: "ooh", mel: "kal", col: "shaku", ost: "pizz", bass: "kb", brass: "pos", dr: ["riese1", "taiko_36", "darb_1"], tick: 3800, pw: "square" },
    schmiede: { root: 46, bpm: 108, scale: "harm", drone: "vc", pad: "aah", mel: "mar", col: "cemb", ost: "spic", bass: "tuba", brass: "blech", dr: ["taiko_42", "riese3", "amboss"], tick: 5500 },
    zinnen:   { root: 49, bpm: 112, scale: "harm", drone: "vctrem", pad: "aah", mel: "oboe", col: "glock", ost: "spic", bass: "tuba", brass: "hornst", dr: ["taiko_36", "timp5", "snare1"], tick: 8500 },
    /* Schwarzer See: F dorisch (die große Sexte als Leuchtalgen-Licht), langsam. Gestrichener Psalter schwebt, Handglocken
       klingen wie unter Wasser (Tiefpass), Tropfen aus Celesta, Wellen in Lautstärke und Filter des Teppichs, tiefer Bordun,
       gelegentliche Walgesänge (gleitender Sinus). Kampf: Volksharfe rieselt, Trommeln gedämpft, Rauschen schwappt wie Wasser. */
    see:      { root: 41, bpm: 72, scale: "dorisch", drone: "vc", pad: "ooh", mel: "psab", col: "hglo", ost: "fharfe", bass: "kb", brass: "horn", dr: ["riese2", "bodh2", "rahm_2"],
                tick: 1300, tickQ: 0.7, tickDec: 0.09, pw: "triangle", wave: "triangle", water: 1, drLP: 900, colLP: 1500,
                progE: [[0, 5, 3, 6], [0, 2, 5, 3], [0, 6, 3, 5], [0, 3, 2, 5]], progC: [[0, 5, 6, 4], [0, 0, 5, 6], [0, 3, 6, 4]] },
    glut:     { root: 45, bpm: 114, scale: "harm", drone: "vc", pad: "aah", mel: "shanai", col: "sitar", ost: "spic", bass: "tuba", brass: "blech", dr: ["taiko_48", "riese3", "darb_2"], tick: 6000 },
    sturm:    { root: 47, bpm: 110, scale: "moll", drone: "vctrem", pad: "aah", mel: "eh", col: "harfe", ost: "spic", bass: "kb", brass: "hornst", dr: ["timp1", "taiko_36", "snare2"], tick: 9500 },
    boss1:    { root: 45, bpm: 126, scale: "harm", drone: "vctrem", pad: "aah", mel: "blech", col: "glock", ost: "spic", bass: "tuba", brass: "hornst", dr: ["taiko_36", "riese1", "snare1"], boss: true, tick: 7000 },
    final:    { root: 41, bpm: 132, scale: "harm", drone: "vctrem", pad: "aah", mel: "horn", col: "rgl", ost: "spic", bass: "tuba", brass: "blech", dr: ["riese1", "taiko_36", "snare2"], boss: true, tick: 6000 }
  };
  /* Bossmusik je Boss: eigene Tonart, Tempo, Besetzung, ein Akzent (acc, siehe ACC) und ein Leitmotiv (mot: [Halbton über
     dem Grundton, Start-Achtel, Länge]), das beim Auftritt erklingt und danach immer wieder in der Melodie auftaucht.
     p2: Änderungen ab der zweiten Phase. Arenen rufen Z.music.set("boss1"/"final"), Wächter "boss1" – welcher Boss
     gemeint ist, liest M.set aus Z.boss bzw. Z.ARENAS[Z.level.arena].boss. Unbekannte Bosse behalten boss1/final. */
  const BOSSP = {
    /* Glasstab, Alchemist der Roten Roben: Cembalo, klirrende Weingläser, nervöses Pizzicato; trinkt er die rote Phiole, übernimmt das Blech */
    glasstab: { root: 52, bpm: 120, scale: "harm", drone: "vctrem", pad: "aah", mel: "cemb", col: "glas", ost: "pizz", bass: "kb", brass: "pos", dr: ["taiko_42", "snare1", "clave1"], tick: 9000, acc: "glas",
      mot: [[0, 0, 1], [1, 1, 1], [0, 2, 1], [-1, 3, 1], [3, 4, 2], [7, 6, 2], [6, 8, 4]], p2: { mel: "blech", brass: "blech", bpm: 126 } },
    /* falsche Erzpriesterin (Kuo-toa, Dienerin Demogorgons): phrygischer Tempelgesang, Volksharfe wie Wasser, Handglocken, Darbuka */
    erzpriesterin: { root: 42, bpm: 96, scale: "phryg", drone: "rorg", pad: "ooh", mel: "stimme", col: "hglo", ost: "fharfe", bass: "kb", brass: "pos", dr: ["bodh2", "darb_1", "tamb_2"], tick: 2500, tickQ: 0.8, tickDec: 0.06, acc: "ritual", drLP: 2500,
      mot: [[0, 0, 2], [1, 2, 2], [0, 4, 2], [-2, 6, 2], [0, 8, 6]], p2: { mel: "shanai", bpm: 104 } },
    /* Bugbear und Nezna im Wachturm: Kriegstrommeln der Goblins, Horn, rohe Moll-Kraft */
    bugbear: { root: 43, bpm: 116, scale: "moll", drone: "vc", pad: "aah", mel: "hornst", col: "mar", ost: "spic", bass: "tuba", brass: "blech", dr: ["taiko_36", "taiko_48", "marsch3"], tick: 6000, acc: "kriegstrommel",
      mot: [[0, 0, 2], [0, 2, 1], [3, 3, 1], [5, 4, 2], [3, 6, 2], [0, 8, 4]], p2: { mel: "trpst", bpm: 122 } },
    /* Wraith, Hüter von Khaems Grab: E phrygisch, langsam, Shakuhachi wie Atem, Schlitztrommel, rückwärts atmende Becken, Geisterchor */
    wraith: { root: 40, bpm: 84, scale: "phryg", drone: "vctrem", pad: "ooh", mel: "shaku", col: "glas", ost: "pizz", bass: "kb", brass: "pos", dr: ["riese2", "schlitz1", "rahm_2"], tick: 3500, acc: "geist",
      mot: [[0, 0, 4], [1, 4, 2], [-1, 6, 2], [6, 8, 8]], p2: { mel: "aah", bpm: 90 } }, /* R18: Phase 2 – der Geisterchor übernimmt das Motiv */
    /* Wächter der Schmiede (Runengolem): F harmonisch Moll, Amboss auf 2 und 4, Marimba wie glühendes Metall */
    schmiedewaechter: { root: 41, bpm: 104, scale: "harm", drone: "vc", pad: "aah", mel: "blech", col: "mar", ost: "spic", bass: "tuba", brass: "hornst", dr: ["riese3", "taiko_42", "amboss"], tick: 5000, acc: "amboss",
      mot: [[0, 0, 2], [0, 2, 1], [0, 3, 1], [7, 4, 2], [8, 6, 2], [7, 8, 2], [11, 10, 2], [12, 12, 4]], p2: { mel: "trpst", bpm: 110 } }, /* R18: Phase 2 Trompeten, schneller */
    /* Chasme, der summende Dämon: Cis phrygisch, schnell; Didgeridoo als Bordun (Cis ist sein Ton), Schellen surren in Sechzehnteln */
    chasme: { root: 49, bpm: 132, scale: "phryg", drone: "didge", pad: "aah", mel: "shanai", col: "sitar", ost: "spic", bass: "kb", brass: "blech", dr: ["darb_2", "taiko_48", "schellen2"], tick: 9500, pw: "square", acc: "summen",
      mot: [[0, 0, 1], [1, 1, 1], [0, 2, 1], [1, 3, 1], [0, 4, 1], [1, 5, 1], [7, 6, 2], [6, 8, 6]], p2: { mel: "sitar", bpm: 140 } }, /* R18: Phase 2 Sitar surrt das Motiv */
    /* Ilvara, die Gestaltwandlerin (Drow-Druidin): H dorisch, Okarina, Koto, Volksharfen-Läufe – wild und elegant */
    ilvaraW: { root: 47, bpm: 108, scale: "dorisch", drone: "vc", pad: "ooh", mel: "oka", col: "koto", ost: "fharfe", bass: "kb", brass: "horn", dr: ["bodh2", "taiko_42", "rahm_1"], tick: 5000, acc: "wald",
      mot: [[0, 0, 2], [2, 2, 1], [3, 3, 1], [7, 4, 4], [9, 8, 2], [7, 10, 2], [5, 12, 4]], p2: { mel: "shaku", bpm: 114 } },
    /* der rasende Riese: E harmonisch Moll, schwer im halben Tempo, riesige Trommeln auf 1 und 3 */
    riese: { root: 40, bpm: 92, scale: "harm", drone: "vc", pad: "aah", mel: "hornst", col: "glock", ost: "spic", bass: "tuba", brass: "blech", dr: ["riese1", "riese3", "taiko_36"], tick: 4500, acc: "riese",
      mot: [[0, 0, 3], [0, 3, 1], [0, 4, 2], [1, 6, 2], [0, 8, 8]], p2: { mel: "blech", bpm: 100 } },
    /* Vrock, Geier aus dem Abyss: B harmonisch Moll, kreischende Pfeifen, Tremolo-Cluster der Geigen */
    vrock: { root: 46, bpm: 124, scale: "harm", drone: "vctrem", pad: "aah", mel: "pfeife", col: "glock", ost: "spic", bass: "kb", brass: "trpst", dr: ["timp1", "snare2", "taiko_48"], tick: 8500, acc: "kreischen",
      mot: [[12, 0, 1], [11, 1, 1], [8, 2, 2], [7, 4, 2], [1, 6, 2], [0, 8, 6]], p2: { mel: "trpst", bpm: 130 } }, /* R18: Phase 2 Trompeten kreischen mit */
    /* Demogorgon, Fürst der Dämonen, im Herz des Sees: F phrygisch, Orgel, zwei Köpfe = Tritonus-Paare; Wasser und Walgesang bleiben */
    demogorgon: { root: 41, bpm: 96, scale: "phryg", drone: "orgel", pad: "aah", mel: "horn", col: "rgl", ost: "spic", bass: "tuba", brass: "blech", dr: ["riese1", "riese2", "taiko_36"], tick: 3000, acc: "zwei", water: 0.5, drLP: 3500,
      mot: [[0, 0, 2], [6, 2, 2], [1, 4, 2], [7, 6, 2], [0, 8, 8]], p2: { mel: "aah", bpm: 102 }, p3: { mel: "blech", brass: "blech", bpm: 110, water: 0.8 } },
    /* Themberchaud, Meister der Flammen: G harmonisch Moll, majestätisch, Trompeten, Gong, knisternde Ticks */
    themberchaud: { root: 43, bpm: 100, scale: "harm", drone: "vc", pad: "aah", mel: "trpst", col: "sitar", ost: "spic", bass: "tuba", brass: "blech", dr: ["taiko_36", "timp1", "darb_2"], tick: 7000, acc: "feuer",
      mot: [[0, 0, 3], [3, 3, 1], [7, 4, 4], [8, 8, 2], [7, 10, 2], [11, 12, 2], [12, 14, 2]], p2: { bpm: 108 } },
    /* Venomfang, der grüne Drache auf der Turmspitze: A dorisch, schnell, Klarinette schleicht, chromatisch rutschendes Pizzicato */
    venomfang: { root: 45, bpm: 136, scale: "dorisch", drone: "vctrem", pad: "aah", mel: "klar", col: "glock", ost: "spic", bass: "kb", brass: "hornst", dr: ["taiko_42", "timp5", "snare1"], tick: 8000, acc: "gift",
      mot: [[0, 0, 1], [1, 1, 1], [2, 2, 1], [3, 3, 1], [7, 4, 2], [6, 6, 2], [0, 8, 6]], p2: { mel: "oboe", bpm: 142 } },
    /* die Weberin, Mutter des Schlunds (wahres Ende): Fis harmonisch Moll, Zither und Pizzicato spinnen ein Netz aus Sechzehnteln */
    weberin: { root: 42, bpm: 120, scale: "harm", drone: "vctrem", pad: "aah", mel: "oboe", col: "zit", ost: "pizz", bass: "kb", brass: "pos", dr: ["taiko_36", "riese1", "schlitz2"], tick: 7000, acc: "netz",
      mot: [[0, 0, 1], [3, 1, 1], [7, 2, 1], [6, 3, 1], [0, 4, 2], [11, 6, 2], [0, 8, 6]], p2: { mel: "aah", bpm: 126 } }
  };
  BOSSP.nezna = BOSSP.bugbear;
  const BOSS_NAME = { glasstab: "Glasstab", erzpriesterin: "Erzpriesterin", bugbear: "Bugbear & Nezna", nezna: "Bugbear & Nezna", wraith: "Wraith", schmiedewaechter: "Schmiedewächter", chasme: "Chasme",
    ilvaraW: "Ilvara", riese: "Rasender Riese", vrock: "Vrock", demogorgon: "Demogorgon", themberchaud: "Themberchaud", venomfang: "Venomfang", weberin: "Weberin" };
  /* Akkordfolgen (Stufen der Leiter, 0 = Tonika). Erkundung: zwei Takte je Akkord, Kampf: ein Takt. */
  const PROG_EXP = [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6], [0, 2, 3, 0], [0, 5, 3, 6], [0, 3, 6, 2]];
  const PROG_CMB = [[0, 0, 5, 6], [0, 5, 3, 4], [0, 6, 5, 4], [0, 3, 0, 4], [0, 1, 0, 6], [0, 5, 6, 4]];
  /* Rhythmusvorlagen für Melodiephrasen: [Achtel, Länge in Achteln] auf 16 Achteln (zwei Takte) */
  const RHY_RUHIG = [
    [[0, 2], [2, 2], [4, 4], [10, 2], [12, 4]], [[0, 3], [3, 1], [4, 4], [10, 2], [12, 4]], [[0, 4], [4, 2], [6, 2], [8, 8]],
    [[2, 2], [4, 1], [5, 1], [6, 2], [8, 6], [14, 2]], [[0, 2], [3, 1], [4, 2], [6, 2], [8, 4], [13, 3]], [[0, 6], [6, 2], [8, 6]]
  ];
  const RHY_KAMPF = [
    [[0, 1], [1, 1], [2, 2], [4, 2], [6, 2], [8, 1], [9, 1], [10, 2], [12, 3], [15, 1]], [[0, 3], [3, 3], [6, 2], [8, 3], [11, 3], [14, 2]],
    [[0, 2], [2, 1], [3, 1], [4, 4], [8, 2], [10, 1], [11, 1], [12, 4]], [[0, 1], [2, 1], [3, 2], [5, 1], [6, 2], [8, 6], [14, 1], [15, 1]]
  ];
  /* Ostinato-Muster als Akkordton-Index (0 Grundton, 1 Terz, 2 Quinte, 3 Oktave) über 8 Achtel */
  const OSTP = [[0, 0, 2, 0, 0, 2, 0, 3], [0, 3, 0, 2, 0, 3, 2, 1], [0, 0, 1, 0, 0, 2, 3, 2], [0, 2, 3, 2, 0, 2, 3, 1], [0, 0, 0, 2, 0, 0, 3, 2]];
  /* Pulsbass: Sechzehntel-Raster (16 je Takt), Wert = Lautstärke (0 = Pause). Elite treibt in Achteln mit 3+3+2-Akzent,
     Boss galoppiert (x . x x). */
  const PULS = {
    elite: [1, 0, 0.55, 0, 0.6, 0, 1, 0, 0.55, 0, 0.6, 0, 1, 0, 0.7, 0],
    boss:  [1, 0, 0.5, 0.6, 0.8, 0, 0.5, 0.6, 1, 0, 0.5, 0.6, 0.8, 0, 0.6, 0.7]
  };
  /* Lautheitsangleich je Gebiet (dB, aus Offline-Messungen: mittlerer RMS über Erkundung/Kampf/Elite auf Torhof-Niveau)
     und Dämpfung der Erkundungsebenen, wo die Ruhe-Besetzung sonst zu nah am Kampf läge */
  const TRIM = { keller: 3, verlies: 3.5, hafen: 0.8, glocken: 1.9, schlund: 2.6, schmiede: 0.8, zinnen: 0.6, see: 2.7, glut: 0.4, sturm: 0.3, hallen: 0.2, wehrgang: -0.3 };
  /* Lautheitsangleich der Bossmusik (dB, Offline-Messung auf Boss1-Niveau) */
  const BTRIM = { glasstab: 0.4, erzpriesterin: 3, bugbear: -1.2, nezna: -1.2, wraith: 2, schmiedewaechter: 1.7, chasme: 0.5, ilvaraW: 1.7, riese: 0.8, demogorgon: 2 };
  const EXQ = { hafen: 0.78, wehrgang: 0.82, sturm: 1.25, schlund: 1.12, zinnen: 1.1, glocken: 1.08 };
  /* Runde 3 (Gesamtmischung, Echtzeit-Messung über alle Gebiete): Kampfebenen je Gebiet angleichen (Faktor auf Ostinato/Trommeln/Puls),
     Kulisse je Gebiet in dB (laute Teppiche wie Nacht/Tropfstein/Gewitter lagen 4–6 dB über der Musik) */
  const CMBQ = { glocken: 0.82, sturm: 0.86, torhof: 0.88, verlies: 0.92, keller: 1.15, hafen: 1.15, hallen: 1.1, schmiede: 1.1, glut: 1.1 };
  /* Kulisse: aus dem Effektivwert der Teppich-Schleifen je Gebiet (welt.js amb.loops) gegen den Median (≈ −30 dB) berechnet, ~70 % ausgeglichen;
     Sturm kaum angehoben, weil Gewitter-Einzelgeräusche und Wetter ihn ohnehin tragen. Spanne der Teppiche vorher 13,5 dB */
  const AMBTRIM = { torhof: -5, keller: -2.5, hallen: 2.5, wehrgang: -1.5, verlies: -3, schmiede: 2, zinnen: -1, see: -2, glut: 4, sturm: 2, glocken: 2 }; /* R9: Sturm/Glocken lagen in Ruhe 4 dB unter den anderen */
  const TIER_NAME = ["erkundung", "spannung", "kampf", "elite", "boss"];
  /* Ebenenpegel je Stufe (Erkundung, Spannung, Kampf, Elite, Boss) */
  const LAY = {
    exp:  [1, 0.85, 0.55, 0.45, 0.5],
    mel:  [0.95, 0.92, 0.85, 0.8, 0.8],
    col:  [1, 0.65, 0.2, 0, 0],
    ten:  [0, 0.9, 0, 0, 0],
    cmb:  [0, 0, 0.68, 0.82, 0.85],
    dr:   [0, 0, 0.55, 0.78, 0.85],
    puls: [0, 0, 0, 0.75, 0.85],
    perc: [0, 0, 0.55, 0.8, 0.9]
  };
  /* Dynamik-Einstellung: Faktor auf die Intensität, Kampfschwelle, Pegel der Kampfebenen, Pegel der Ruheebenen im Kampf */
  const DYN = {
    aus:    { k: 0, inK: 9, cmb: 1, rest: 1 },
    normal: { k: 1, inK: 0.42, cmb: 1, rest: 1 },
    stark:  { k: 1.25, inK: 0.34, cmb: 1.12, rest: 0.8 }
  };

  const M = (Z.music = {
    prof: null, id: null, next: 0, step: 0, intensity: 0, target: 0, heat: 0, combat: false, C: 0, T: 0, calmT: 0,
    live: 0, stats: { notes: 0, skipped: 0, stingers: {}, tiers: {} }, rage: 0, ambush: false, low: 0, pausedMix: 0,
    tier: 0, want: 0, tierName: "erkundung", tierAt: 0, raw: 0, parts: {}, pushes: [], chain: 0, eliteNear: false, hold: [0, 0, 0, 0]
  });
  const dynMode = () => { const m = Z.settings && Z.settings.musikDyn; return DYN[m] ? m : "normal"; };

  /* ---------- Signalfluss ----------
     Ebenen-Busse → M.lay (Ducking unter Stingern) → M.xf (Gebietsüberblendung) → M.out (Gesamtpegel)
     → M.lp (Tiefpass: Pause, wenig Leben) → A.mus (Musiklautstärke). Stinger- und Herzschlag-Bus gehen direkt in M.out.
     Jeder Ebenen-Bus hat einen festen Hallanteil zum gemeinsamen Hall von Z.audio. */
  M.init = () => {
    if (!A.ok || M.out) return;
    const c = A.ctx;
    M.lp = c.createBiquadFilter(); M.lp.type = "lowpass"; M.lp.frequency.value = 20000; M.lp.Q.value = 0.5; M.lp.connect(A.mus);
    /* R16: Hochpass 32 Hz (Subsonik aus Pauke/Kick/Bass-Aufnahmen tiefer gestimmt), dann Tiefpass wie gehabt */
    M.hp = c.createBiquadFilter(); M.hp.type = "highpass"; M.hp.frequency.value = 38; M.hp.Q.value = 0.6; M.hp.connect(M.lp);
    /* R17: Glocke bei 100 Hz, nur im Kampf abgesenkt (Ostinato/Bass/Pauke/Bordun stapeln sich dort); M.eqKdB = Tiefe (Prüfstand) */
    M.eqK = c.createBiquadFilter(); M.eqK.type = "peaking"; M.eqK.frequency.value = 95; M.eqK.Q.value = 1.4; M.eqK.gain.value = 0; M.eqK.connect(M.hp);
    M.out = c.createGain(); M.out.gain.value = 0.62; M.out.connect(M.eqK);
    M.xf = c.createGain(); M.xf.gain.value = 1; M.xf.connect(M.out);
    M.lay = c.createGain(); M.lay.gain.value = 1; M.lay.connect(M.xf);
    const verbIn = c.createGain(); verbIn.gain.value = 1; verbIn.connect(A.verbM || A.verb); M.verbIn = verbIn; /* R19: Musik-Hall hinter dem Musikregler */
    const bus = (g, pan, verb, to) => {
      const b = c.createGain(); b.gain.value = g; let o = b;
      if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; b.connect(p); o = p; }
      o.connect(to || M.lay); if (verb) { const v = c.createGain(); v.gain.value = verb; o.connect(v); v.connect(verbIn); }
      return b;
    };
    M.busExp = bus(1, 0, 0.45);      /* Bordun, Chor */
    M.busMel = bus(1, -0.12, 0.5);   /* Melodie */
    /* Farbe und Trommeln laufen über je einen Tiefpass (offen bei 20 kHz; See: Glocken unter Wasser, gedämpfte Trommeln) */
    const lpBus = (verb) => { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 20000; f.Q.value = 0.6; f.connect(M.lay); const v = c.createGain(); v.gain.value = verb; f.connect(v); v.connect(verbIn); return f; };
    M.colF = lpBus(0.6); M.drF = lpBus(0.2);
    M.busCol = bus(1, 0.3, 0, M.colF);     /* Farbe */
    M.busTen = bus(0, 0, 0.3);       /* Spannung */
    M.cmF = c.createBiquadFilter(); M.cmF.type = "lowpass"; M.cmF.frequency.value = 20000; M.cmF.Q.value = 2.2; M.cmF.connect(M.lay); /* Filterfahrten im Kampf */
    M.busCmb = bus(0, 0.08, 0.25, M.cmF);   /* Ostinato, Bass, Blech */
    /* R16: Trommel-Aufnahmen (Taiko/Riese/Pauke) tragen den meisten Anteil unter 60 Hz – Absenkung −6 dB unter ~70 Hz,
       der Schlag (80–200 Hz) bleibt */
    M.drSh = c.createBiquadFilter(); M.drSh.type = "lowshelf"; M.drSh.frequency.value = 70; M.drSh.gain.value = -6; M.drSh.connect(M.drF);
    M.busDr = bus(0, 0, 0, M.drSh);   /* Trommeln */
    M.busPuls = bus(0, 0, 0.08);     /* prozeduraler Pulsbass */
    M.busPerc = bus(0, 0, 0.12);     /* prozedurale Sub-Trommel und Ticks */
    M.busSt = bus(1, 0, 0.55, M.out); /* Stinger */
    M.drums = M.busDr; M.bus = M.busMel; M.padBus = M.busExp; /* alte Namen */
    buildPad(); buildSynth();
  };

  /* ---------- Prozeduraler Streicherteppich ----------
     Drei Stimmen aus je zwei leicht verstimmten Sägezähnen plus Sinus-Grundton, durch einen weichen Tiefpass,
     dessen Grenzfrequenz langsam atmet. Die Stimmen gleiten bei jedem Akkordwechsel (Stimmführung: kleinste Bewegung). */
  function buildPad() {
    const c = A.ctx, P = (M.pad = { v: [], cur: null });
    const lean = !!(Z.gq && Z.gq.lean);
    P.f = c.createBiquadFilter(); P.f.type = "lowpass"; P.f.frequency.value = 700; P.f.Q.value = 0.7;
    P.g = c.createGain(); P.g.gain.value = 0; P.f.connect(P.g); P.g.connect(M.lay);
    const vs = c.createGain(); vs.gain.value = 0.6; P.g.connect(vs); vs.connect(M.verbIn);
    P.lfo = c.createOscillator(); P.lfo.frequency.value = 0.07; P.lfoG = c.createGain(); P.lfoG.gain.value = 220; P.lfo.connect(P.lfoG); P.lfoG.connect(P.f.frequency); P.lfo.start();
    for (let i = 0; i < 3; i++) {
      const g = c.createGain(); g.gain.value = 0.03; g.connect(P.f);
      const o1 = c.createOscillator(), o2 = lean ? null : c.createOscillator();
      o1.type = "sawtooth"; o1.detune.value = -7 - i; o1.frequency.value = 220; o1.connect(g); o1.start();
      /* Handheld: ein Sägezahn je Stimme statt zwei verstimmter (halbe Oszillatorlast im Audio-Thread) */
      if (o2) { o2.type = "sawtooth"; o2.detune.value = 6 + i; o2.frequency.value = 220; o2.connect(g); o2.start(); } else g.gain.value = 0.042;
      P.v.push({ g, o: o2 ? [o1, o2] : [o1], m: 57 });
    }
    /* Wellen (See): langsamer Sinus hebt und senkt Lautstärke und Filter des Teppichs und der Ruheebene; Tiefe 0 = aus */
    const W = (M.wav = {});
    W.o = c.createOscillator(); W.o.frequency.value = 0.085; W.amp = c.createGain(); W.amp.gain.value = 0; W.flt = c.createGain(); W.flt.gain.value = 0;
    W.amp2 = c.createGain(); W.amp2.gain.value = 1.4;
    W.o.connect(W.amp); W.o.connect(W.flt); W.amp.connect(P.g.gain); W.amp.connect(W.amp2); W.amp2.connect(M.busExp.gain); W.flt.connect(P.f.frequency); W.o.start();
    P.sub = c.createOscillator(); P.sub.type = "sine"; P.subG = c.createGain(); P.subG.gain.value = 0.07; P.sub.connect(P.subG); P.subG.connect(P.g); P.sub.start();
  }

  /* ---------- Prozedurale Rhythmus-Schichten ----------
     Wenige, dauerhaft laufende Knoten, deren Hüllkurven pro Schlag automatisiert werden (keine neuen Knoten je Note):
       Pulsbass   – Sägezahn + Rechteck eine Oktave tiefer, Resonanz-Tiefpass mit Filterhüllkurve
       Sub-Trommel – Sinus mit fallender Tonhöhe (120 → 44 Hz), stützt die Pauken/Taikos von unten
       Ticks      – weißes Rauschen durch einen Bandpass, kurze Hüllkurve (Rasseln/Schellen-artig, dezent)
       Herzschlag – eigener Sinus (Lub-Dub), läuft am Tiefpass vorbei, damit er bei wenig Leben klar bleibt
     Hüllkurven nur mit setTargetAtTime: der Pegel läuft stetig vom aktuellen Wert aus – keine Klicks. */
  function buildSynth() {
    const c = A.ctx, S = (M.syn = {});
    S.pf = c.createBiquadFilter(); S.pf.type = "lowpass"; S.pf.frequency.value = 220; S.pf.Q.value = 5;
    S.pg = c.createGain(); S.pg.gain.value = 0; S.pf.connect(S.pg); S.pg.connect(M.busPuls);
    S.o1 = c.createOscillator(); S.o1.type = "sawtooth"; S.o2 = c.createOscillator(); S.o2.type = "square";
    S.o2g = c.createGain(); S.o2g.gain.value = 0.55;
    S.o1.connect(S.pf); S.o2.connect(S.o2g); S.o2g.connect(S.pf); S.o1.frequency.value = 73; S.o2.frequency.value = 36.5; S.o1.start(); S.o2.start();
    S.ko = c.createOscillator(); S.ko.type = "sine"; S.ko.frequency.value = 50; S.kg = c.createGain(); S.kg.gain.value = 0;
    S.ko.connect(S.kg); S.kg.connect(M.busPerc); S.ko.start();
    const nb = c.createBuffer(1, Math.floor(c.sampleRate * 1.3), c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    S.ns = c.createBufferSource(); S.ns.buffer = nb; S.ns.loop = true;
    S.nf = c.createBiquadFilter(); S.nf.type = "bandpass"; S.nf.frequency.value = 7000; S.nf.Q.value = 1.4;
    S.ng = c.createGain(); S.ng.gain.value = 0; S.ns.connect(S.nf); S.nf.connect(S.ng);
    if (c.createStereoPanner) { S.np = c.createStereoPanner(); S.np.pan.value = 0.22; S.ng.connect(S.np); S.np.connect(M.busPerc); } else S.ng.connect(M.busPerc);
    S.ns.start();
    S.ho = c.createOscillator(); S.ho.type = "sine"; S.ho.frequency.value = 48; S.hg = c.createGain(); S.hg.gain.value = 0;
    S.ho.connect(S.hg); S.hg.connect(M.out); S.ho.start();
    /* Walgesang (See): Dreieck mit Vibrato, durch Bandpass, viel Hall; gleitet langsam zwischen Leitertönen */
    S.wo = c.createOscillator(); S.wo.type = "triangle"; S.wo.frequency.value = 110;
    S.wv = c.createOscillator(); S.wv.frequency.value = 4.2; S.wvg = c.createGain(); S.wvg.gain.value = 14; S.wv.connect(S.wvg); S.wvg.connect(S.wo.detune); S.wv.start();
    S.wf = c.createBiquadFilter(); S.wf.type = "bandpass"; S.wf.frequency.value = 600; S.wf.Q.value = 1.6;
    S.wg = c.createGain(); S.wg.gain.value = 0; S.wo.connect(S.wf); S.wf.connect(S.wg); S.wg.connect(M.busCol);
    const wvb = c.createGain(); wvb.gain.value = 0.9; S.wg.connect(wvb); wvb.connect(M.verbIn); S.wo.start();
  }
  /* ein Walruf: von Ton a nach b gleiten (MIDI), Dauer d Sekunden */
  function whale(t, a, b, d, v) {
    const S = M.syn; if (!S || !S.wo) return;
    const fa = hz(a), fb = hz(b);
    S.wo.frequency.setValueAtTime(fa, t); S.wo.frequency.exponentialRampToValueAtTime(fb, t + d * 0.75);
    S.wf.frequency.setValueAtTime(fa * 2.2, t); S.wf.frequency.exponentialRampToValueAtTime(fb * 2.2, t + d * 0.75);
    S.wg.gain.setTargetAtTime(v, t, d * 0.18); S.wg.gain.setTargetAtTime(0, t + d * 0.6, d * 0.2);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  /* ein Ton des Pulsbasses: Pegel und Filter springen weich auf und fallen ab */
  function pulse(midi, t, v, len, bright) {
    const S = M.syn; if (!S) return;
    const f = hz(lift(midi, 40)); /* R16: Unteroktave (o2) nicht unter ~41 Hz */
    S.o1.frequency.setValueAtTime(f, t); S.o2.frequency.setValueAtTime(f / 2, t);
    S.pg.gain.setTargetAtTime(v, t, 0.003); S.pg.gain.setTargetAtTime(0, t + 0.02, len * 0.32);
    const base = 140 + f * 0.8, peak = base + 500 + 1300 * bright;
    S.pf.frequency.setTargetAtTime(peak, t, 0.004); S.pf.frequency.setTargetAtTime(base, t + 0.015, len * 0.25);
  }
  /* Sub-Trommel */
  function kick(t, v) {
    const S = M.syn; if (!S) return;
    S.ko.frequency.setValueAtTime(130, t); S.ko.frequency.exponentialRampToValueAtTime(56, t + 0.12); /* R16: Ausklang 56 statt 44 Hz – Druck statt Grummeln */
    S.kg.gain.setTargetAtTime(v, t, 0.002); S.kg.gain.setTargetAtTime(0, t + 0.025, 0.085);
  }
  /* Rasseltick */
  function tick(t, v, dec) {
    const S = M.syn; if (!S) return;
    S.ng.gain.setTargetAtTime(v, t, 0.0012); S.ng.gain.setTargetAtTime(0, t + 0.004, dec || 0.022);
  }
  /* Herzschlag: Lub-Dub */
  function heart(t, v, beat) {
    const S = M.syn; if (!S) return;
    const dub = t + Math.min(0.2, beat * 0.55);
    for (const [tt, vv, f0] of [[t, v, 62], [dub, v * 0.7, 56]]) {
      S.ho.frequency.setValueAtTime(f0, tt); S.ho.frequency.exponentialRampToValueAtTime(34, tt + 0.11);
      S.hg.gain.setTargetAtTime(vv, tt, 0.004); S.hg.gain.setTargetAtTime(0, tt + 0.03, 0.05);
    }
  }

  /* Akkord auf dem Teppich setzen: Stimmen gleiten zur nächstgelegenen Lage */
  /* R16 Drehpunkt für Tonartwechsel: Dreiklang der alten Leiter, dessen Töne alle in der neuen Leiter liegen; bevorzugt nach Funktion in
     der neuen Tonart (V > IV > ii > vi > iii > I), sonst die Dominante der neuen Tonart. Gleiche Tonart: null (kein Drehpunkt nötig). */
  function pivotChord(oldP, newP, from) {
    const pc = m => ((m % 12) + 12) % 12;
    const pcs = P => { const n = (SC[P.scale] || []).length || 7; return [...Array(n).keys()].map(d => pc(deg(P.scale, d, P.root))); };
    const nP = pcs(newP), oP = pcs(oldP); if (pc(oldP.root) === pc(newP.root) && oldP.scale === newP.scale) return null;
    const nN = nP.length, fnScore = { 4: 6, 3: 5, 1: 4, 5: 3, 2: 2, 0: 1 };
    let best = null, bs = -1;
    for (let d = 0; d < oP.length; d++) {
      const tri = [0, 2, 4].map(k => deg(oldP.scale, d + k, oldP.root)); if (!tri.every(m => nP.includes(pc(m)))) continue;
      const nd = nP.indexOf(pc(tri[0])); const sc = (nN === 7 ? fnScore[nd] : 2) || 1;
      if (sc > bs && nd !== 0) { bs = sc; best = tri; }
    }
    if (!best) best = [0, 2, 4].map(k => deg(newP.scale, 4 + k, newP.root));
    /* Lage: jeden Ton so oktavieren, dass er dem entsprechenden Ton des Ausgangsakkords am nächsten liegt */
    return best.map(pc).map((q, i) => { const f = from[i] != null ? from[i] : from[0]; let m = f - pc(f) + q; if (m - f > 6) m -= 12; if (f - m > 6) m += 12; return m; }).sort((a, b) => a - b);
  }
  /* R16 Stimmführung: aus den Kandidaten den Ton nehmen, der der vorigen Lage dieser Stimme am nächsten liegt; gegen die Bezugsstimme
     (ref) keine parallele reine Quinte/Oktave (gleiches Intervall bei Bewegung beider Stimmen), wenn eine Alternative ≤ 4 Halbtöne weiter liegt */
  const VL = {};
  function vlNext(key, cand, ref) {
    if (!cand.length) return VL[key] || 0;
    const prev = VL[key], pref = VL[key + "_r"];
    const pc = m => ((m % 12) + 12) % 12, perf = (a, b) => b != null && (pc(a - b) === 7 || pc(a - b) === 0);
    const sorted = cand.slice().sort((x, y) => (prev == null ? x - y : Math.abs(x - prev) - Math.abs(y - prev)));
    let pick = sorted[0];
    if (prev != null && ref != null && pref != null && ref !== pref && pick !== prev && perf(pick, ref) && perf(prev, pref) && pc(pick - ref) === pc(prev - pref)) {
      const alt = sorted.find(m => !perf(m, ref) && Math.abs(m - prev) <= Math.abs(pick - prev) + 4); if (alt != null) { pick = alt; M.stats.vlFix = (M.stats.vlFix || 0) + 1; }
    }
    VL[key] = pick; VL[key + "_r"] = ref; return pick;
  }
  function padChord(chord, when, glide) {
    const P = M.pad, p = M.prof; if (!P) return;
    const tones = [deg(p.scale, chord, p.root), deg(p.scale, chord + 2, p.root), deg(p.scale, chord + 4, p.root)];
    let best = null, bs = 1e9;
    for (let inv = 0; inv < 3; inv++) for (let oc = -1; oc <= 0; oc++) {
      const v = tones.map((t, i) => t + (i < inv ? 12 : 0) + oc * 12).sort((a, b) => a - b);
      if (v[0] < p.root - 7 || v[2] > p.root + 16) continue;
      const s = P.cur ? v.reduce((a, t, i) => a + Math.abs(t - P.cur[i]), 0) : Math.abs(v[0] - p.root);
      if (s < bs) { bs = s; best = v; }
    }
    best = best || tones; P.cur = best;
    best.forEach((m, i) => P.v[i].o.forEach(o => o.frequency.setTargetAtTime(hz(m), when, glide)));
    P.sub.frequency.setTargetAtTime(hz(lift(deg(p.scale, chord, p.root) - 12, 36)), when, glide * 0.6);
  }

  /* ---------- Einzelnoten aus Aufnahmen ---------- */
  function playNote(inst, midi, when, vol, dur, bus, prio) {
    if (!A.ok || !M.out || !INST[inst]) return;
    /* prio -1: Schmuckstimme (Lagerfiguren, lange Flächen: Chor, Tremolo, Teppich-Noten, Quint-Bordun, Oktavverdopplungen) – zählt wie
       Satz (0), weicht aber, wenn Kernstimmen (Ostinato, Bass, Melodie, Blech-Akkorde, Trommeln) bei voller Grenze eine Stimme brauchen.
       Auf Handheld (Grenze 14) gingen im Bosskampf sonst über die Hälfte aller Noten verloren, auch Ostinato und Bass. */
    const fig = prio === -1; if (fig) prio = 0;
    if (M.live > voiceCap(prio) && !(prio === 2 && yieldVoice(false, true)) && !(!fig && yieldVoice(true))) { if (fig) { M.stats.skipFig = (M.stats.skipFig || 0) + 1; return; } M.stats.skipped++; const sb = M.stats.skipBy || (M.stats.skipBy = {}); sb[inst] = (sb[inst] || 0) + 1; if (prio === 2) M.stats.skipSt = (M.stats.skipSt || 0) + 1; return; } /* Notbremse für die Stimmenzahl (Handheld: wenige Stimmen, Audio-Thread schonen) */
    midi = fit(inst, midi);
    const n = nearest(inst, midi), path = K(inst + "_" + n), b = A.buf[path];
    if (!b) { if (b === undefined) A.load(path); return; }
    const c = A.ctx; when = Math.max(when, c.currentTime + 0.005);
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = Math.pow(2, (midi - n) / 12);
    const g = c.createGain(), att = Math.min(0.06, dur * 0.15);
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + att);
    g.gain.setValueAtTime(vol, when + dur * 0.72); g.gain.linearRampToValueAtTime(0, when + dur);
    s.connect(g); g.connect(bus || M.busMel);
    curInst = inst; track(s, g, bus === M.busSt, when + dur, fig, when); s.start(when); s.stop(when + dur + 0.05);
  }
  /* Schlagwerk / Einzelklang */
  function hit(name, when, vol, rate, bus, rev, imp) {
    if (!A.ok || !M.out) return;
    const pr = bus && bus === M.busSt ? 2 : imp ? 1 : false; /* imp: Schlag auf der Eins (Kern, Grenze „wichtig“) */
    if (M.live > voiceCap(pr) && !(pr && yieldVoice(false, pr === 2)) && !yieldVoice(true)) { M.stats.skipped++; const sb = M.stats.skipBy || (M.stats.skipBy = {}); sb["hit:" + name] = (sb["hit:" + name] || 0) + 1; return; }
    const path = K(name); let b = A.buf[path]; if (!b) { if (b === undefined) A.load(path); return; }
    if (rev) b = reversed(path, b);
    const c = A.ctx; when = Math.max(when, c.currentTime + 0.005);
    const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1;
    const g = c.createGain(); g.gain.value = vol; s.connect(g); g.connect(bus || M.busDr);
    let len = b.duration / (rate || 1);
    /* Handheld: Schlagwerk-Aufnahmen klingen 2–4 s aus und belegten so lange eine der 14 Stimmen (Bosskampf: über die Hälfte
       aller Noten verworfen). Nach 0,32 s (Schlag auf der Eins 0,75 s, Stinger 2,2 s) weich ausblenden – der hörbare Schlag bleibt, die Stimme wird frei */
    const q = Z.gq || {}, maxL = q.lean ? (pr === 2 ? 2.2 : pr ? 0.75 : q.mini ? 0.24 : 0.32) : 0;
    curInst = "hit:" + name; track(s, g, bus === M.busSt, when + Math.min(len, maxL || len)); s.start(when);
    if (maxL && len > maxL && !rev) { g.gain.setValueAtTime(vol, when + maxL - 0.3); g.gain.linearRampToValueAtTime(0, when + maxL); s.stop(when + maxL + 0.02); len = maxL; }
    return len;
  }
  /* Stimmen-Obergrenze: am PC 110, auf Handheld 14 (wichtige Noten 18), auf „minimal“ 10 (13) */
  /* prio 2 = Schluss-Stinger (Bosstod): darf über die Grenze hinaus, sonst fehlen ihm auf Handheld/Auto-Stufe 0 die Hälfte
     der Noten, weil der ausklingende Bosssatz noch alle Stimmen belegt (Ursache der 7-dB-Schwankung beim Bugbear-Tod) */
  function voiceCap(prio) { const q = Z.gq || {}; return (q.mini ? (prio ? 13 : 10) : q.lean ? (prio ? 18 : 14) : 110) + (prio === 2 ? 12 : 0); }
  /* Knoten nach dem Verklingen wieder lösen und mitzählen */
  const VOC = new Set();
  let curInst = "";
  /* Testhilfe: belegte Stimmen nach Instrument (k = Kern, f = Schmuck, s = Stinger) */
  M._voc = () => { const o = {}; for (const v of VOC) if (!v.freed) { const k = (v.st ? "s:" : v.fig ? "f:" : "k:") + v.i; o[k] = (o[k] || 0) + 1; } return o; };
  /* W39 Klang/Leistung: wie bei Z.audio.live (kern.js) können Ende-Ereignisse verloren gehen – dann blieben Stimme samt Knoten in VOC
     (Speicher) und M.live kröche Richtung Stimmengrenze (Handheld 14). Alle 64 Noten: Stimmen 2 s nach ihrem geplanten Ende austragen */
  let sweepN = 0;
  function sweepVoc() {
    const now = A.ctx.currentTime;
    for (const v of VOC) if (v.end && now > v.end + 2) { if (!v.freed) { v.freed = true; M.live--; } VOC.delete(v); M.stats.verloren = (M.stats.verloren || 0) + 1; try { v.s.disconnect(); v.g.disconnect(); } catch (_) {} }
  }
  function track(s, g, st, end, fig, when) {
    if ((++sweepN & 63) === 0) { try { sweepVoc(); } catch (_) {} }
    M.live++; M.stats.notes++;
    const v = { s, g, st, end: end || 0, fig: !!fig, i: curInst, t0: A.ctx.currentTime, w: when || 0 }; VOC.add(v);
    s.onended = () => { if (!v.freed) M.live--; VOC.delete(v); try { s.disconnect(); g.disconnect(); } catch (_) {} };
  }
  /* Stimmen des Satzes (nicht der Stinger) schnell ausblenden und beenden – für den Bosstod-Stinger */
  /* R16: Stimme ausblenden ohne Lautstärkesprung. cancelScheduledValues allein setzt eine Note, deren Hüllkurve noch in der Zukunft
     liegt (vorausgeplant bis ~0,16 s), auf den Grundwert 1 zurück – sie setzte dann ohne Einschwingen mit vielfacher Lautstärke ein
     (Spitze bis +12 dB beim Gebietswechsel). Noch nicht begonnene Noten werden gar nicht erst gestartet, klingende gehalten und geblendet. */
  function fadeVoice(v, now, delay, tau, stopIn) {
    const g = v.g.gain;
    if (v.w && v.w > now + 0.002) { try { v.s.stop(now); } catch (_) {} return; }
    if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(now); else { const cur = g.value; g.cancelScheduledValues(now); g.setValueAtTime(cur, now); }
    g.setTargetAtTime(0, now + (delay || 0), tau);
    if (stopIn != null) v.s.stop(now + stopIn);
  }
  function freeVoices(n, alle) { /* alle: auch Stinger-Stimmen (Prüfstand beim Wechsel des Audio-Kontexts) */
    const c = A.ctx, now = c.currentTime; let k = 0;
    for (const v of VOC) { if ((v.st && !alle) || v.freed) continue; v.freed = true; M.live--; try { fadeVoice(v, now, 0, 0.05, 0.3); } catch (_) {} if (++k >= n) break; }
    return k;
  }
  M.freeVoices = freeVoices;
  /* Vorrang (Stinger prio 2: Bossauftritt, Bossphase, Kampfbeginn, Hinterhalt, Sieg): ist auch die erweiterte Grenze voll,
     weicht statt der Stinger-Note die Satz-Stimme, die am frühesten ohnehin endet (kurz ausgeblendet) – so gehen auf
     Handheld (Grenze 14/18 bzw. 10/13) keine Stinger-Noten verloren und die Stimmenzahl bleibt trotzdem begrenzt */
  function yieldVoice(figOnly, alteSt) {
    let best = null;
    for (const v of VOC) if (!v.st && !v.freed && (!figOnly || v.fig) && (!best || v.end < best.end)) best = v;
    /* R14: neue Stinger-Note und kein Satz-Ton mehr frei – dann weicht der Ausklang eines älteren Stingers (≥ 1 s alt, endet am frühesten) */
    if (!best && alteSt) { const now = A.ctx.currentTime; for (const v of VOC) if (v.st && !v.freed && now - (v.t0 || 0) >= 1 && (!best || v.end < best.end)) best = v; if (best) M.stats.yieldSt = (M.stats.yieldSt || 0) + 1; }
    if (!best) return false;
    const now = A.ctx.currentTime; best.freed = true; M.live--; M.stats.yielded = (M.stats.yielded || 0) + 1;
    try { fadeVoice(best, now, 0, 0.03, 0.2); } catch (_) {}
    return true;
  }
  const revCache = {};
  function reversed(path, b) {
    if (revCache[path]) return revCache[path];
    const r = A.ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
    for (let ch = 0; ch < b.numberOfChannels; ch++) { const s = b.getChannelData(ch), d = r.getChannelData(ch); for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i]; }
    return (revCache[path] = r);
  }
  M.note = playNote; M.hit = hit;

  /* ---------- Melodie: Motive mit Abwandlungen ---------- */
  function newMotif(R, combat) {
    const rhy = (R ? R.pick : pick)(combat ? RHY_KAMPF : RHY_RUHIG);
    const r = R || Math.random;
    let d = [0, 2, 4, 7][Math.floor(r() * 4)];
    const steps = [-2, -1, -1, 1, 1, 1, 2, -3, 3, 0];
    const notes = rhy.map(([s, l], i) => {
      if (i > 0) { d += steps[Math.floor(r() * steps.length)]; d = clamp(d, -1, 9); }
      return { s, l, d };
    });
    notes[notes.length - 1].d = [0, 4, 7][Math.floor(r() * 3)];
    return notes;
  }
  /* Abwandlungen, damit nichts stumpf wiederholt wird */
  const VAR = {
    orig: m => m,
    hoch: m => m.map(n => ({ ...n, d: n.d + 2 })),
    tief: m => m.map(n => ({ ...n, d: n.d - 1 })),
    umkehr: m => m.map(n => ({ ...n, d: clamp(2 * m[0].d - n.d, -1, 9) })),
    kopf: m => { const h = m.filter(n => n.s < 8), t = newMotif(null, M.combat).filter(n => n.s >= 8); return h.concat(t); },
    frage: m => m.filter(n => n.s < 8).concat([{ s: 8, l: 6, d: m[0].d + 1 }]),
    echo: m => m.filter(n => n.s < 8).map(n => ({ ...n })).concat(m.filter(n => n.s < 8).map(n => ({ s: n.s + 8, l: n.l, d: n.d - 2, soft: 1 })))
  };
  function nextVariant() {
    const w = { orig: 3, hoch: 2, tief: 1.5, umkehr: 1.5, kopf: 2, frage: 1.5, echo: 1.5 };
    if (M.lastVar) w[M.lastVar] = 0;
    if (M.lastVar2) w[M.lastVar2] *= 0.4;
    let sum = 0; for (const k in w) sum += w[k]; let x = Math.random() * sum;
    for (const k in w) { x -= w[k]; if (x <= 0) { M.lastVar2 = M.lastVar; M.lastVar = k; return k; } }
    return "orig";
  }
  /* ---------- Ruhe-Abschnitte (Erkundung/Spannung) ----------
     Lange Läufe sollen nicht monoton werden: alle 8–16 Takte wechselt die Erkundungsmusik den Abschnitt – gleiche Tonart,
     gleiche Besetzung, aber andere Anordnung (Prinzip aus Ambient/Techno: Elemente kommen und gehen, statt neuer Themen).
       grund   – wie bisher
       atem    – Melodie schweigt, nur Bordun und Teppich; ferne Einzeltöne der Farbe (Luft holen)
       phasen  – zwei Schleifen ungleicher Länge (5 und 7 Achtel) laufen über die Akkordtöne und verschieben sich gegeneinander
       kanon   – die Farbe antwortet der Melodie einen Takt später eine Quinte höher
       orgel   – Orgelpunkt: der Bordun bleibt auf dem Grundton, die Akkorde wandern darüber
       hoch    – Melodie eine Oktave höher und leiser, schwebend
       puls    – leiser Herzpuls: weiche Sub-Trommel auf 1 und 3, gedämpfter Pulsbass auf den Offbeats, feine Ticks (nicht im Lager)
     Nach jedem Kampf beginnt die Ruhe wieder mit „grund“. Z.music.ruhe(name) erzwingt einen Abschnitt (Tests/Hörproben). */
  const RUHE = { grund: 3, atem: 1.4, phasen: 1.6, kanon: 1.4, orgel: 1.2, hoch: 1, puls: 1.5 };
  function pickRuhe(force) {
    const p = M.prof || {}, w = Object.assign({}, RUHE);
    if (p.calm) w.puls = 0;
    if (M.ruheA !== "grund") w.grund *= 2; /* zwischen zwei Abwandlungen meist zurück zum Grund */
    if (M.ruheA) w[M.ruheA] = 0; if (M.ruheB) w[M.ruheB] *= 0.3;
    let k = force;
    if (!k) { let sum = 0; for (const n in w) sum += w[n]; let x = Math.random() * sum; for (const n in w) { x -= w[n]; if (x <= 0) { k = n; break; } } k = k || "grund"; }
    M.ruheB = M.ruheA; M.ruheA = k; M.ruheBars = 0; M.ruheLen = k === "grund" ? (Math.random() < 0.5 ? 8 : 16) : 16;
    M.stats.ruhe = M.stats.ruhe || {}; M.stats.ruhe[k] = (M.stats.ruhe[k] || 0) + 1;
    M.phA = 0; M.phB = 0;
  }
  M.ruhe = name => { if (name && !RUHE[name]) return M.ruheA; if (name) { pickRuhe(name); M.ruheFix = true; } else M.ruheFix = false; return M.ruheA; };
  /* Phrasenplan: spielen oder atmen (in der Erkundung bewusst mit Pausen). Ein Leitmotiv (Z.music.motif mit leit)
     ersetzt die Melodie, solange es gilt – jede zweite Phrase, damit es nicht penetrant wird. */
  function planPhrase() {
    const calm = !M.combat;
    M.phraseN = (M.phraseN || 0) + 1;
    if (M.leit && A.ctx.currentTime < M.leit.until && M.phraseN % 2 === 1) { M.phrase = M.leit.notes; M.restRun = 0; return; }
    if (M.phraseN % (calm ? 9 : 6) === 0) M.mel = newMotif(null, !calm); /* Weiterentwicklung */
    let play;
    if (M.bossOn || M.combat) play = M.restRun >= 1 || Math.random() < 0.82;
    else if (M.restRun >= 2) play = true;
    else if (M.playRun >= 2) play = false;
    else play = Math.random() < (M.prof.calm ? 0.55 : 0.5);
    /* Ruhe-Abschnitte: „atem“ schweigt (höchstens jede vierte Phrase ein Nachklang), „phasen“ lässt den Schleifen mehr Raum */
    if (calm && !M.bossOn) { if (M.ruheA === "atem") play = M.restRun >= 3; else if (M.ruheA === "phasen" && M.playRun >= 1) play = false; }
    if (play) { M.playRun = (M.playRun || 0) + 1; M.restRun = 0; M.phrase = VAR[nextVariant()](M.mel); }
    else { M.restRun = (M.restRun || 0) + 1; M.playRun = 0; M.phrase = null; }
  }

  const i0 = bar => [2, 4, 3, 1][Math.floor(bar / 2) % 4]; /* Horn im Abspann: Terz, Quinte, Quarte, Sekunde über dem Akkordgrundton */
  /* ---------- Gebiet setzen ---------- */
  const ambushFight = () => !!(Z.ambush && Z.ambush() && Z.ambush().state === "fight");
  const trialFight = () => { const S = Z.erkundung && Z.erkundung(); return !!(S && S.trial && S.trial.state === "fight"); };
  /* welcher Boss ist gemeint? Arena → ihr Boss, sonst der lebende Boss (Wächter) */
  function bossKey(id) {
    if (id !== "boss1" && id !== "final") return id;
    const lv = Z.level; let b = null;
    if (lv && lv.arena && Z.ARENAS && Z.ARENAS[lv.arena]) b = Z.ARENAS[lv.arena].boss;
    if (!b && Z.boss && !Z.boss.dead && !Z.bossDefeated) b = Z.boss.id;
    return b && BOSSP[b] ? "b:" + b + ":" + id : id;
  }
  /* ---------- Lager: wächst mit dem Lager ----------
     Stufe (Z.lager.stage(), 0…5) macht die Besetzung reicher; jede gerettete Figur (Z.lager.residents()) bekommt eine eigene
     kleine Stimme mit Motiv. Motive in Stufen der Tonleiter über dem laufenden Akkord (passen also immer), [Stufe, Achtel, Länge].
     Z.music._lager = { stage, res:[…] } überschreibt das für Tests/Hörproben. */
  const RESV = {
    edda:   { i: "oka", o: 24, pan: -0.5, v: 0.08, n: [[0, 0, 2], [2, 2, 2], [4, 4, 3], [7, 8, 6]] },                 /* Kundschafterin: Okarina schaut in die Weite */
    quirin: { i: "mbira", o: 24, pan: 0.45, v: 0.07, n: [[4, 0, 1], [5, 1, 1], [4, 2, 1], [2, 3, 1], [4, 6, 1], [7, 7, 1], [4, 10, 2]] }, /* Alchemist: es blubbert */
    sigrun: { i: "hglo", o: 24, pan: -0.25, v: 0.07, n: [[0, 0, 6], [4, 6, 6], [7, 12, 4]] },                         /* Runenleserin: Handglocken */
    wendel: { i: "fag", o: 0, pan: 0.3, v: 0.09, n: [[0, 0, 3], [-1, 4, 2], [0, 6, 2], [2, 8, 6]] },                   /* Bestienmeister: Fagott brummt */
    jori:   { hit: "amboss", pan: 0.6, v: 0.045, pat: [0, 3, 6, 8, 11, 14] },                                           /* Schmiedelehrling: leises Ambossklingen */
    lied:   { i: "zit", o: 12, pan: -0.6, v: 0.08, n: [[0, 0, 1], [2, 1, 1], [4, 2, 1], [7, 3, 3], [4, 8, 1], [2, 9, 1], [0, 10, 4]] }, /* Barradin: Zither */
    alwin:  { i: "klar", o: 12, pan: 0.15, v: 0.07, n: [[4, 0, 3], [3, 4, 2], [2, 6, 2], [1, 8, 4], [0, 12, 4]] },     /* Chronist: Klarinette erzählt */
    lotte:  { i: "akk", o: 12, pan: 0.5, v: 0.05, chord: true, n: [[0, 2, 1], [0, 6, 1], [0, 10, 1], [0, 14, 1]] },     /* Händlerin: Akkordeon auf den Offbeats */
    mira:   { i: "stimme", o: 12, pan: 0, v: 0.07, n: [[7, 0, 4], [5, 4, 4], [4, 8, 8]] }                               /* Mira: eine Stimme seufzt */
  };
  function lagerInfo() {
    const o = M._lager; if (o) return { stage: o.stage | 0, res: (o.res || []).filter(id => RESV[id]) };
    const L = Z.lager; let stage = 0, res = [];
    try { stage = L && L.stage ? L.stage() | 0 : 0; res = L && L.residents ? L.residents().filter(id => RESV[id]) : []; } catch (_) {}
    return { stage, res };
  }
  function lagerProf(base) {
    const I = lagerInfo(), p = Object.assign({}, base, { lager: true, lst: I.stage, lres: I.res, rk: 0 });
    if (I.stage >= 1) p.pad = "ooh";   /* ab „Feuerstellen“: Chor-Teppich */
    return p;
  }
  function lagerPreload(p) {
    for (const id of p.lres) { const r = RESV[id]; if (r.hit) { A.load(K(r.hit)); continue; } (INST[r.i] || []).forEach(n => { if (Math.abs(n - (p.root + r.o + 5)) < 16) A.load(K(r.i + "_" + n)); }); }
    if (p.lst >= 2) (INST.kb || []).forEach(n => { if (Math.abs(n - (p.root - 12)) < 10) A.load(K("kb_" + n)); });
    if (p.lst >= 3) ["rahm_1", "rahm_2"].forEach(n => A.load(K(n)));
    if (p.lst >= 4) (INST.psab || []).forEach(n => { if (n < p.root + 40) A.load(K("psab_" + n)); });
  }
  /* je Schritt im Lager: Stufen-Schichten und die Stimmen der Bewohner */
  function lagerStep(p, t, st, bar, ph, beat, chord, tone, chordStart, hum) {
    if (st === 0 && bar % 8 === 0) { const I = lagerInfo(); p.lst = I.stage; p.lres = I.res; } /* im Lager gekauft/eingezogen: beim nächsten 8-Takt-Abschnitt hörbar */
    const S = p.lst;
    if (S >= 2 && st === 0) playNote("kb", tone(0, p.root - 12), t, 0.12, beat * 3, M.busExp, -1);                       /* Hütten: warmer Bass auf der Eins */
    if (S >= 3) { if (st === 0) hit("rahm_1", t, 0.16, 0.9, M.busCol); else if (st === 5) hit("rahm_2", t, 0.09, 1, M.busCol); } /* Palisade: Rahmentrommel, Herzschlag */
    const ln = !!(Z.gq && Z.gq.lean); /* Handheld: lange Flächen kürzer und eine Stimme weniger (Stimmengrenze 14) */
    if (S >= 4 && st === 0 && bar % 4 === 0) { playNote("psab", tone(2, p.root + 24), t, 0.04, beat * (ln ? 14 : 24), M.busCol, -1); if (!ln) playNote("psab", tone(0, p.root + 24), t + beat * 2, 0.035, beat * 22, M.busCol, -1); } /* Banner: Psalter schimmert */
    if (S >= 5 && chordStart && bar % 4 === 0) for (const i of ln ? [0, 2] : [0, 1, 2]) playNote("aah", tone(i, p.root + 12), t, 0.04, beat * (ln ? 18 : 30), M.busExp, -1); /* Feste: Chor öffnet sich */
    /* Bewohner: zu Beginn jeder Phrase ist einer dran (der Reihe nach); in Atempausen der Handpan voll, sonst manchmal leise dazu */
    /* R19: volles Lager (ab 4 Bewohnern, Stufe ≥ 3) – auch in der Mitte der Phrase antwortet ein zweiter Bewohner (Ruf und Antwort),
       und beim Mitspielen über der Melodie öfter (50 % statt 35 %); sonst käme jeder nur alle paar Minuten dran */
    const voll = p.lres.length >= 4 && S >= 3;
    if ((ph === 0 || (voll && ph === 8)) && p.lres.length) {
      const id = p.lres[p.rk % p.lres.length], r = RESV[id], solo = !M.phrase;
      if (!solo && Math.random() > (voll ? 0.5 : 0.35)) { p.rk++; return; }
      /* Handheld: reicht die Stimmengrenze nicht für das ganze Motiv (plus 2 Stimmen Luft für den Satz), wird die Figur
         auf die nächste Phrase zurückgestellt – sie kommt dann als Nächste dran, statt dass Satz- oder Motivnoten verloren gehen */
      const need = r.hit ? 0 : r.n.length * (r.chord ? 3 : 1);
      if (need && M.live + need > voiceCap(0)) { M.stats.lagerZurueck = (M.stats.lagerZurueck || 0) + 1; return; }
      p.rk++;
      const vk = solo ? 1 : 0.55; M.stats.lagerStimme = M.stats.lagerStimme || {}; M.stats.lagerStimme[id] = (M.stats.lagerStimme[id] || 0) + 1;
      if (r.hit) { for (const s0 of r.pat) hit(r.hit, t + s0 * beat + rnd(-0.004, 0.006), r.v * vk * (s0 % 8 === 0 ? 1.3 : 1), 1.02 + rnd(-0.02, 0.02), M.busCol); return; }
      for (const [d, s0, l] of r.n) {
        const at = t + s0 * beat + rnd(-0.004, 0.008);
        if (r.chord) { for (const i of [0, 1, 2]) playNote(r.i, tone(i, p.root + r.o), at, r.v * vk, beat * l * 0.9, M.busCol, -1); }
        else playNote(r.i, deg(p.scale, chord + d, p.root + r.o), at, r.v * vk, beat * l * 1.3 + 0.1, M.busCol, -1);
      }
    }
  }
  function profFor(key) {
    if (key === "lager") return lagerProf(PROF.lager);
    if (key.startsWith("b:")) { const [, b, base] = key.split(":"); return Object.assign({}, PROF[base], BOSSP[b], { boss: true, bossId: b, base }); }
    return PROF[key] || PROF.torhof;
  }
  M.set = (id0) => {
    M.init(); if (!A.ok) return;
    const id = bossKey(id0);
    if (M.id === id) return;
    /* Hinterhalt und Prüfungskammer: Tonart des Gebiets behalten, nur in den vollen Kampf gehen */
    if (id0 === "boss1" && M.prof && !M.prof.boss && ambushFight()) { M.ambush = true; M.stinger("hinterhalt"); return; }
    if (id0 === "boss1" && M.prof && !M.prof.boss && trialFight()) { M.trialOn = true; M.push(0.8, 3); return; }
    const prevBoss = M.prof && M.prof.boss, sameLevel = M.levelRef && M.levelRef === Z.level, hadProf = !!M.prof, oldP = M.prof, oldStep = M.step || 0, oldNext = M.next || 0, oldBeat = M.beat || 0.3;
    const prof = profFor(id);
    M.id = id; M.prof = prof; M.levelRef = Z.level; M.ambush = false; M.p2 = false; M.p3 = false; M.rueck = false;
    M.trim = Math.pow(10, ((prof.bossId ? BTRIM[prof.bossId] : TRIM[id]) || 0) / 20); M.exq = EXQ[id] || 1; M.cmq = CMBQ[id] || 1;
    const now = A.ctx.currentTime;
    /* Boss tritt mitten im Gebiet auf: Rückwärts-Becken atmet ein, dann setzt alles auf einmal ein */
    let start = now + 0.35;
    if (prof.boss && sameLevel && !prevBoss) { start = now + 1.6; M.bossLead = start; }
    /* Gebietswechsel als musikalische Brücke statt Schnitt (R10): die schon gespielten Noten des alten Gebiets klingen bis zum
       Ende des laufenden Takts aus (höchstens ~2 s, mindestens 0,9 s), darüber hält ein leiser Chor den Grundakkord der alten
       Tonart; ein Rückwärts-Becken atmet auf die Eins, auf der das neue Gebiet einsetzt. Kein Abbruch, keine Pause. */
    if ((!sameLevel || prof.still) && hadProf && M.xf) {
      const toBar = (8 - (oldStep % 8)) % 8, endBar = Math.max(now, oldNext) + toBar * oldBeat;
      start = clamp(endBar, now + 0.9, now + 2.0);
      M.xf.gain.cancelScheduledValues(now); M.xf.gain.setTargetAtTime(1, now, 0.2);
      const tau = Math.max(0.2, (start - now) / 3);
      for (const v of VOC) if (!v.st && !v.freed) { try { fadeVoice(v, now, 0.15, tau); } catch (_) {} }
      if (oldP && !oldP.boss) {
        const r = oldP.root, ch = [deg(oldP.scale, 0, r + 12), deg(oldP.scale, 2, r + 12), deg(oldP.scale, 4, r + 12)];
        /* R16 Drehpunkt-Akkord: erst der Grundakkord der alten Tonart, dann (zweite Hälfte der Brücke) ein Akkord, der in beiden Tonarten
           vorkommt und in der neuen möglichst Dominante/Subdominante ist – oder, wenn es keinen gibt, die Dominante der neuen Tonart;
           jeder Ton auf kürzestem Weg (Stimmführung), die neue Tonika setzt dann auf der Eins ein */
        const pv = pivotChord(oldP, prof, ch), mid = now + Math.max(0.45, (start - now) * 0.5);
        ch.forEach((m, i) => playNote(oldP.pad || "ooh", m, now + 0.02 + i * 0.03, 0.05, (pv ? mid - now + 0.25 : (start - now) + 1.4), M.busSt, 1));
        if (pv) { pv.forEach((m, i) => playNote(oldP.pad || "ooh", m, mid + i * 0.02, 0.05, (start - mid) + 1.2, M.busSt, 1)); M.stats.pivot = (M.stats.pivot || 0) + 1; M.lastPivot = pv.slice(); }
      }
      swell(start, 0.09);
      M.stats.bruecke = (M.stats.bruecke || 0) + 1; M.bridge = { from: oldP && (oldP.bossId || oldP.root), start: +start.toFixed(2), now: +now.toFixed(2) };
    }
    M.next = start; M.step = 0; M.phraseN = 0; M.playRun = 0; M.restRun = 1; M.lastVar = M.lastVar2 = null;
    const R = Z.Rng(id.length * 131 + id.charCodeAt(0) * 7 + id.charCodeAt(id.length - 1));
    M.mel = newMotif(R, !!prof.boss); M.phrase = null;
    if (prevBoss && !prof.boss) M.leit = null;
    M.progE = R.pick(prof.progE || PROG_EXP); M.progC = R.pick(prof.progC || PROG_CMB); M.ost = R.pick(OSTP);
    M.combat = !!(prof.boss && Z.boss && !Z.bossDefeated); M.calmT = 0; M.rage = 0;
    if (!sameLevel) {
      M.C = M.combat ? 1 : 0; M.intensity = Math.min(M.intensity, 0.2); M.heat = 0; M.pushes.length = 0; M.leit = null;
      M.tier = M.want = M.combat ? 4 : 0; M.hold = [0, 0, 0, 0]; M.tierName = TIER_NAME[M.tier]; M.bossBarN = 0; /* R13: Name mitziehen (blieb sonst auf „kampf“ stehen) */
    }
    if (M.pad) M.pad.cur = null;
    for (const k in VL) delete VL[k]; /* R16: neue Tonart – Stimmführung neu beginnen */
    if (M.pad) {
      M.pad.g.gain.setTargetAtTime(prof.calm ? 0.45 : 0.36, start, 1.5);
      /* im Lager weicher (Dreieck), sonst Streicher-Säge */
      const wv = prof.wave || "sawtooth"; M.pad.v.forEach(v => v.o.forEach(o => { if (o.type !== wv) o.type = wv; }));
    }
    if (M.syn) {
      const pw = prof.pw || "sawtooth"; if (M.syn.o1.type !== pw) M.syn.o1.type = pw;
      M.syn.nf.frequency.setTargetAtTime(prof.tick || 7000, now, 0.2); M.syn.nf.Q.setTargetAtTime(prof.tickQ || 1.4, now, 0.2);
    }
    /* Klangfarbe des Gebiets: gedämpfte Trommeln, Farbe unter Wasser, Wellen im Teppich */
    if (M.drF) M.drF.frequency.setTargetAtTime(prof.drLP || 20000, now, 0.3);
    if (M.colF) M.colF.frequency.setTargetAtTime(prof.colLP || 20000, now, 0.3);
    if (M.wav) { M.wav.amp.gain.setTargetAtTime(prof.water ? 0.15 * prof.water : 0, now, 1); M.wav.flt.gain.setTargetAtTime(prof.water ? 380 * prof.water : 0, now, 1); }
    M.whaleT = 2;
    if (prof.lager) lagerPreload(prof);
    if (!sameLevel && !M.ruheFix) { M.ruheA = null; M.ruheB = null; pickRuhe("grund"); }
    preload(prof);
    if (prof.boss && sameLevel && !prevBoss) M.stinger("boss");
  };
  function preload(p) {
    const near = (inst, c, r) => INST[inst] && INST[inst].forEach(n => { if (Math.abs(n - c) < r) A.load(K(inst + "_" + n)); });
    near(p.drone, p.root - 12, 20); if (p.pad) near(p.pad, p.root + 12, 16); near(p.mel, p.root + 12, 22); near(p.col, p.root + 19, 22);
    if (p.ost) { near(p.ost, p.root - 4, 20); near(p.bass, p.root - 18, 16); near(p.brass, p.root + 4, 18); near("vlntrem", p.root + 24, 14); near("aah", p.root + 12, 14); near("trpst", p.root + 12, 14); }
    if (p.ostC) near(p.ostC, p.root - 4, 20);
    near("timpt", p.root - 12, 10); near("pizz", p.root - 6, 14); near("glock", p.root + 36, 14); near("cel", p.root + 24, 12);
    (p.dr || []).forEach(d => A.load(K(d)));
    ["crash", "timproll", "beckenroll", "glock_91", "glock_96", "gong"].forEach(n => A.load(K(n)));
  }
  M.stop = () => { M.id = null; M.prof = null; if (M.pad && A.ctx) M.pad.g.gain.setTargetAtTime(0, A.ctx.currentTime, 0.8); };
  M.key = () => { const p = M.prof || PROF.torhof; return { root: p.root, scale: p.scale, bpm: p.bpm, name: NN[p.root % 12] + " " + SC_NAME[p.scale], boss: p.bossId ? BOSS_NAME[p.bossId] : null }; };
  /* Helfer für klang.js (Gegnerstimmen, Raumkulissen): Leiterton der laufenden Tonart (Stufe 0 = Grundton, 4 = Quinte),
     passende Aufnahme eines Instruments samt Abspielrate, nächster Achtel-Rasterpunkt samt Achtel-Nummer (für Muster im Takt) */
  M.ton = (stufe, basis) => { const p = M.prof || PROF.torhof; return deg(p.scale, stufe, basis != null ? basis : p.root); };
  M.probe = (inst, midi) => { if (!INST[inst]) return null; midi = fit(inst, midi); const n = nearest(inst, midi); return { path: K(inst + "_" + n), rate: Math.pow(2, (midi - n) / 12), midi }; };
  M.raster = (ahead) => {
    if (!A.ctx) return null;
    const now = A.ctx.currentTime + (ahead == null ? 0.03 : ahead), p = M.prof || PROF.torhof;
    if (!M.prof || !M.beat || M.next < now - 1) { const b = 60 / p.bpm / 2, s = Math.ceil(now / b); return { t: s * b, step: s, beat: b }; }
    const b = M.beat, j = Math.ceil((now - M.next) / b - 1e-6);
    return { t: M.next + j * b, step: M.step + j, beat: b };
  };

  /* ---------- Schübe anderer Module ---------- */
  let pushId = 0;
  M.push = (amount, dur) => {
    amount = clamp(+amount || 0, 0, 1); dur = Math.max(0.2, +dur || 4);
    const id = ++pushId; M.pushes.push({ id, a: amount, t: dur, d: dur });
    if (M.pushes.length > 16) M.pushes.shift();
    return id;
  };
  function pushSum(dt) {
    let s = 0;
    for (let i = M.pushes.length - 1; i >= 0; i--) {
      const q = M.pushes[i]; q.t -= dt;
      if (q.t <= 0) { M.pushes.splice(i, 1); continue; }
      s = Math.max(s, q.a * Math.min(1, (q.t / q.d) * 1.6)); /* erst halten, dann linear abklingen */
    }
    return s;
  }

  /* ---------- Lage im Spiel → Intensität (Rohwert) ---------- */
  const dealtMap = new WeakMap();
  function gameIntensity(dt) {
    const P = Z.player, lv = Z.level, parts = M.parts;
    if (!P || !lv || P.dead) { M.heat = 0; M.eliteNear = false; M.miniNear = false; for (const k in parts) parts[k] = 0; return 0; }
    let s = 0, n = 0, elite = false, trial = false, dealt = 0, miniNear = false;
    for (const e of Z.enemies || []) {
      if (e.dead) continue;
      /* ausgeteilter Schaden (Anteil am Leben der Gegner) */
      const h0 = dealtMap.get(e); if (h0 != null && e.hp < h0 && e.hpMax > 0) dealt += (h0 - e.hp) / e.hpMax; dealtMap.set(e, e.hp);
      if (!e.aware || e.dummy || e.ally || e.sleep) continue;
      const dx = Math.abs(e.x - P.x), dy = Math.abs(e.y - P.y); if (dx > 420 || dy > 260) continue;
      const near = clamp(1.2 - Math.hypot(dx, dy * 1.3) / 380, 0.15, 1);
      /* Mini-Bosse (nemesis.js) und Nemesis zählen wie starke Elites */
      const mini = !!(e.nmMini || e.nm);
      s += near * (e.elite ? 2 : 1) * (mini ? 2.5 : 1) * (e.def && e.def.boss ? 3 : 1); n++;
      if ((e.elite || mini) && near > 0.3) elite = true;
      if (mini && near > 0.3) miniNear = true;
      if (e.trial) trial = true;
    }
    /* Hitze: Treffer einstecken und Gegner fällen hält die Kampfmusik kurz am Leben */
    if (M.lastHp != null && P.hp < M.lastHp - 0.5 && P.hpMax) M.heat = Math.max(M.heat, Math.min(0.85, 0.5 + 1.6 * (M.lastHp - P.hp) / P.hpMax));
    M.lastHp = P.hp;
    if (n && dealt > 0) M.heat = Math.max(M.heat, Math.min(0.6, M.heat + dealt * 0.35));
    const k = (Z.stats && Z.stats.kills) || 0;
    if (M.lastKills != null && k > M.lastKills && n > 0) M.heat = Math.max(M.heat, 0.5);
    M.lastKills = k;
    M.heat = Math.max(0, M.heat - dt * 0.08);
    const lowHp = n && P.hpMax ? clamp((0.35 - P.hp / P.hpMax) / 0.2, 0, 1) : 0;
    parts.foes = Math.min(1, s / 4.5); parts.heat = n ? M.heat : M.heat * 0.6; parts.push = pushSum(dt);
    parts.spiel = (M.target || 0) * 0.8; parts.elite = elite ? 0.62 : 0; parts.trial = trial ? 0.55 : 0;
    parts.chain = M.chain >= 3 ? Math.min(0.3, M.chain * 0.03) : 0; parts.low = lowHp * 0.12;
    let I = Math.max(parts.foes, parts.heat, parts.push, parts.spiel, parts.elite, parts.trial) + parts.chain + parts.low;
    if (lv.hub) I = Math.min(I, 0.3);
    if (M.trialOn && !trialFight()) M.trialOn = false;
    if (M.trialOn) { trial = true; parts.trial = 0.7; I = Math.max(I, 0.7); }
    if (miniNear) { parts.elite = 0.85; I = Math.max(I, 0.85); }
    M.eliteNear = elite; M.trial = trial; M.miniNear = miniNear;
    if (Z.boss && !Z.bossDefeated && !Z.boss.dead) I = 1;
    M.ambush = ambushFight();
    if (M.ambush) I = Math.max(I, 0.9);
    return clamp(I, 0, 1);
  }

  /* ---------- Stufenwahl mit Hysterese (wird erst auf Schlag-/Taktgrenzen übernommen) ---------- */
  function chooseTier(I, dt) {
    const p = M.prof, D = DYN[dynMode()], H = M.hold;
    if (M.bossOn) return 4;
    if (p.calm || D.k === 0) return 0;
    let w = M.want === 4 ? (I > 0.42 ? 2 : 0) : M.want;
    const fight = M.ambush || M.trial;
    /* R18: Raum frei (letzter Gegner besiegt, klang.js) – die Nachwirkung der Kills (Hitze/Schub) zieht nicht mehr in den Kampf zurück */
    const frei = M.raumFrei && A.ctx && A.ctx.currentTime - M.raumFrei < 20;
    /* hinauf */
    if ((I >= D.inK && !frei) || fight) w = Math.max(w, 2); else if (I >= 0.12 && !frei) w = Math.max(w, 1);
    if ((M.eliteNear && I >= 0.45) || I >= 0.93 || M.ambush) w = Math.max(w, 3);
    /* hinunter – jeweils erst nach einer Haltezeit */
    if (w === 3) { if (!M.eliteNear && !M.ambush && I < 0.62) { H[3] += dt; if (H[3] > 2.5) { w = 2; H[3] = 0; } } else H[3] = 0; }
    /* R17: letzter Gegner im Kampf besiegt (klang.js setzt M.raumFrei) – nach 1,2 statt 3,5 s zurück in die Ruhe (frei: oben) */
    if (w === 2) { if (!fight && (I < 0.2 || frei)) { H[2] += dt; if (H[2] > (frei ? 1.2 : 3.5)) { w = I > 0.08 ? 1 : 0; H[2] = 0; } } else H[2] = 0; }
    if (w === 1) { if (I < 0.06 || frei) { H[1] += dt; if (H[1] > (frei ? 2.5 : 2)) { w = 0; H[1] = 0; } } else H[1] = 0; }
    return w;
  }
  /* Stufe übernehmen (auf dem Taktgeber, Zeitpunkt t) */
  function commitTier(w, t) {
    const old = M.tier; if (w === old) return;
    M.tier = w; M.tierName = TIER_NAME[w]; M.tierAt = t; M.combat = w >= 2;
    if (w >= 2 && old < 2 && !M.ruheFix && M.ruheA !== "grund") pickRuhe("grund");
    if (w >= 2 && old < 2 && !M.kampfFix) { M.kampfA = "voll"; M.kampfBars = 0; } /* nach dem Kampf beginnt die Ruhe wieder beim Grund */
    M.stats.tiers[M.tierName] = (M.stats.tiers[M.tierName] || 0) + 1;
    (M.log = M.log || []).push({ t: +t.toFixed(3), st: M.step % 8, von: TIER_NAME[old], zu: TIER_NAME[w] }); if (M.log.length > 24) M.log.shift();
    if (w >= 2 && old < 2 && w !== 4) M.stinger("kampf", { at: t });
    else if (w === 3 && old === 2) { /* Elite: Becken und Pauke auf den Einsatz */ hit("crash", t, 0.1, 1.05, M.busSt); if (M.prof.dr) hit(M.prof.dr[0], t, 0.55, 0.92, M.busSt); }
    else if (w < 2 && old >= 2 && !(Z.player && Z.player.dead) && !(M.lastSting && M.lastSting.sieg && A.ctx.currentTime - M.lastSting.sieg < 15)) M.stinger("ruhe", { at: t });
  }

  /* ---------- Hauptschleife: Zustände, Mischung, Taktgeber ---------- */
  /* Titelmenü: Ton braucht eine erste Eingabe (Autoplay-Regeln) – die erste Taste/Berührung auf dem Titelbild startet die Titelmusik;
     wird das Titelbild wieder gezeigt (Lauf aufgegeben), kehrt sie zurück. Das Lager übernimmt beim Start mit der üblichen Überblendung. */
  const titleOn = () => { const el = document.getElementById("title"); return !!(el && !el.hidden); };
  const startTitle = () => { if (!titleOn() || !A.init) return; A.init(); if (A.ok && M.id !== "titel") M.set("titel"); };
  addEventListener("pointerdown", startTitle, true); addEventListener("keydown", startTitle, true);
  M.update = (dt) => {
    if (A.ok && titleOn() && M.id !== "titel") M.set("titel");
    if (!A.ok || !M.prof || !M.out) return;
    hookSettings();
    const p = M.prof, c = A.ctx, now = c.currentTime, D = DYN[dynMode()];
    dt = Math.min(dt || 0, 0.1);
    const paused = !!(Z.paused && Z.ui && Z.ui.modalOpen) && !(M.prof && M.prof.still); /* Trauer/Abspann laufen unter ihrem Fenster ungedämpft weiter */
    if (!paused) M.raw = gameIntensity(dt);
    /* Tod: keine Abtreppung über Kampf/Spannung – Intensität sofort weg, der Tod-Stinger trägt den Übergang */
    const dead = !!(Z.player && Z.player.dead);
    if (dead && !M.wasDead) { M.intensity = 0; M.heat = 0; M.pushes.length = 0; M.hold = [0, 0, 0, 0]; M.want = 0; }
    M.wasDead = dead;
    /* Bossmusik zählt nur, solange ein Boss lebt (oder sein Einsatz gerade eingeleitet wird);
       in der Arena vor dem Auftritt bleibt es bei Spannung, nach dem Sieg wird es ruhig */
    M.bossOn = !!(p.boss && ((Z.boss && !Z.bossDefeated && !Z.boss.dead) || (M.bossLead && now < M.bossLead + 1)));
    /* Boss gefallen: nicht über Elite/Kampf abtreppen, sondern nach dem Siegesakkord direkt zur Ruhe */
    if (M.wasBoss && !M.bossOn && (Z.bossDefeated || (Z.boss && Z.boss.dead))) { M.intensity = Math.min(M.intensity, 0.1); M.heat = 0; M.pushes.length = 0; M.want = 0; M.hold = [0, 0, 0, 0]; M.rage = 0; }
    M.wasBoss = M.bossOn;
    const wait = p.boss && !M.bossOn && Z.level && Z.level.arena && !Z.bossDefeated;
    const goal = clamp(Math.max((M.raw || 0) * (D.k || (M.bossOn ? 1 : 0)), wait ? 0.32 : 0), 0, 1);
    /* Glättung: schnell hinauf, langsam hinab */
    if (!paused) M.intensity += (goal - M.intensity) * Math.min(1, dt * (goal > M.intensity ? 2.2 : 0.5));
    const I = M.bossOn ? Math.max(0.75, M.intensity) : M.intensity;
    M.goal = goal;
    if (!paused) M.want = chooseTier(I, dt);
    if (p.calm && M.tier) { M.tier = M.want = 0; M.combat = false; M.tierName = TIER_NAME[0]; }
    /* weiche Hilfsgröße für Teppich und Kulisse */
    const cT = M.tier >= 2 ? 1 : 0;
    M.C += (cT - M.C) * Math.min(1, dt * (cT > M.C ? 2.5 : 0.35));
    const tension = p.calm ? 0 : clamp((I - 0.1) / 0.32, 0, 1);
    M.T = M.tier === 1 ? tension : 0;
    /* Ebenen nach Stufe: hinauf schnell (der Einsatz sitzt auf der Taktgrenze, weil vorher keine Noten dieser Ebene
       geplant werden), hinab langsam ausklingend */
    /* Runde 9 (Gesamtmischung über einen Lauf): Ruhe→Kampf sprang die Musik um 6–10 dB – Kampfebenen −2 dB, Ruheebenen +1 dB;
       Breakdown fiel 7–9 dB unter „voll“ – im Breakdown tritt der Teppich (Bordun/Chor) hervor */
    const tr = M.tier, pm = paused ? 0.35 : 1, rest = tr >= 2 ? D.rest : (M.exq || 1) * 1.12, cm = D.cmb * (M.cmq || 1) * 0.8;
    const brkMix = tr >= 2 && tr < 4 && M.kampfA === "breakdown" && (M.kampfBars || 0) < 6 ? 1.7 : 1;
    const up = now - M.tierAt < 1.5 && M.tierAt > 0, set = (node, v) => {
      const cur = node.gain.value; node.gain.setTargetAtTime(v, now, v > cur + 0.02 ? (up ? 0.05 : 0.25) : 0.8);
    };
    set(M.busExp, LAY.exp[tr] * rest * brkMix);
    set(M.busMel, LAY.mel[tr] * (tr >= 2 ? 1 : (M.exq || 1)));
    set(M.busCol, LAY.col[tr] * rest);
    set(M.busTen, LAY.ten[tr] * (0.4 + 0.6 * M.T) * pm);
    set(M.busCmb, LAY.cmb[tr] * (0.85 + 0.2 * I) * pm * cm);
    set(M.busDr, LAY.dr[tr] * (0.7 + 0.35 * I) * pm * cm);
    /* Ruhe-Abschnitt „puls“ braucht Pulsbass- und Schlag-Bus auch in der Erkundung (weich ein- und ausgeblendet) */
    /* Halftime während der Zeitlupe (mindestens einen halben Takt), Bossphase und Wut */
    const fx = Z.fx; if (fx && fx.slow > 0 && fx.slowT > 0) M.halfUntil = now + Math.max(fx.slowT, (M.beat || 0.3) * 4);
    M.half = M.tier >= 2 && M.tier < 4 && now < (M.halfUntil || 0);
    const bz = Z.boss && !Z.boss.dead && !Z.bossDefeated ? Z.boss : null; M.bossPh = bz ? bz.phase | 0 : 0; M.wut = !!(bz && bz.rage);
    if (M.wut) M.rage = Math.max(M.rage, 0.4);
    const rP = tr <= 1 && M.ruheA === "puls" ? 1 : 0; M.rP = (M.rP || 0) + (rP - (M.rP || 0)) * Math.min(1, dt * 0.8);
    set(M.busPuls, LAY.puls[tr] * pm * cm + 0.55 * M.rP * pm * (M.exq || 1) + (tr === 2 && M.kampfA === "treiben" ? 0.7 * pm * cm : 0));
    set(M.busPerc, LAY.perc[tr] * pm * cm + 0.5 * M.rP * pm * (M.exq || 1));
    /* Teppich: im Kampf heller und lauter, bei wenig Leben dunkel */
    const P = Z.player, lowHp = P && !P.dead && Z.level && !Z.level.hub && P.hpMax ? clamp((0.32 - P.hp / P.hpMax) / 0.22, 0, 1) : 0;
    M.low += (lowHp - M.low) * Math.min(1, dt * 1.5);
    if (M.pad) M.pad.f.frequency.setTargetAtTime((600 + 1500 * M.C * I + 300 * tension) * (1 - 0.45 * M.low), now, 0.5);
    /* Pause: dumpf und leiser; wenig Leben: Tiefpass, der mit dem Puls atmet */
    M.pausedMix += ((paused ? 1 : 0) - M.pausedMix) * Math.min(1, dt * 4);
    const beatPh = (now * (p.bpm / 60)) % 1, pls = M.low > 0.05 ? Math.exp(-beatPh * 6) : 0;
    let cut = 20000 * Math.pow(0.08, M.low * 0.9) * (1 + pls * M.low * 0.8);
    cut = Math.min(cut, paused ? 900 : 20000);
    M.lp.frequency.setTargetAtTime(cut, now, paused ? 0.15 : 0.08);
    /* Boss: jede Phase etwas lauter (+0,8 dB), Wut +0,4 dB – Steigerung, die Begrenzer und Kompressor nicht ausreizt */
    const bossUp = M.bossOn ? (1 + 0.1 * (M.bossPh || 0)) * (M.wut ? 1.05 : 1) : 1;
    /* R15 Dichte-Ausgleich (Desktop, keine Stimmengrenze): klingen mehr als 30 Musikstimmen (Boss Phase 3 + Wut + Stinger: bis 75),
       wird der Satz weich um √(30/Stimmen) zurückgenommen (höchstens auf 0,6, ~1 s geglättet) – Handheld (≤ 30) unberührt */
    const dz = clamp(Math.sqrt(30 / Math.max(30, M.live || 0)), 0.6, 1); M.dichteG = (M.dichteG || 1) + (dz - (M.dichteG || 1)) * Math.min(1, dt * 1.2);
    if (M.eqK) M.eqK.gain.setTargetAtTime((M.tier || 0) >= 2 ? (M.eqKdB != null ? M.eqKdB : -3) : 0, now, 0.8);
    M.out.gain.setTargetAtTime(0.62 * (M.trim || 1) * bossUp * (paused ? 0.6 : 1) * (1 - 0.15 * M.low) * M.dichteG, now, 0.2);
    /* Wut der Bossphase klingt langsam ab, bleibt aber, solange der Boss lebt */
    if (M.rage > 0 && !(Z.boss && !Z.bossDefeated)) M.rage = Math.max(0, M.rage - dt * 0.2);

    /* Taktgeber: Achtel, 8 je Takt, Phrase = 2 Takte, Akkordfolge = 4 Akkorde */
    const tempo = p.bpm * (p.calm ? 1 : 1 + 0.05 * M.C + 0.02 * (M.tier >= 3 ? 1 : 0) + 0.03 * M.rage);
    const beat = (M.beat = 60 / tempo / 2);
    if (M.next < now - 0.25) { M.next = now + 0.05; } /* nach einem Hänger (Tab im Hintergrund) nicht alles nachholen */
    let guard = 0;
    while (M.next < now + 0.16 && guard++ < 16) { scheduleStep(M.next, beat, I); M.step++; M.next += beat; }
  };

  /* ---------- Akzente je Gebiet/Boss (nur in Kampf, Elite, Boss) ---------- */
  const ACC = {
    /* Keller im Kampf: Posaunen-Stoß mit kleiner Sekunde, tiefes Geigen-Tremolo im Halbtonabstand, Pauke auf der Drei */
    drohung: ({ p, t, st, bar, beat, tr, tone, chordStart }) => {
      if (chordStart) { playNote("pos", tone(0, p.root - 12), t, 0.12, beat * 2.5, M.busCmb); playNote("pos", tone(0, p.root - 12) + 1, t + 0.01, 0.08, beat * 2, M.busCmb); }
      if (st === 0 && bar % 2 === 0) { playNote("vctrem", p.root - 12, t, 0.09, beat * 16, M.busCmb); playNote("vctrem", p.root - 11, t, 0.06, beat * 16, M.busCmb); }
      if (st === 4) playNote("timpt", tone(0, p.root - 12), t, 0.22 + 0.08 * (tr - 2), beat * 2, M.busCmb);
    },
    glas: ({ p, t, st, beat, tone, chordStart }) => {
      if (st % 2 === 1 && Math.random() < 0.45) playNote("glas", tone(Math.floor(Math.random() * 3), p.root + 24), t, 0.06, beat * 3, M.busCol);
      if (chordStart) for (let i = 0; i < 6; i++) playNote("cemb", tone(i % 4, p.root + 12 * (1 + Math.floor(i / 4))), t + i * beat * 0.5, 0.07, beat, M.busCmb);
    },
    ritual: ({ p, t, st, bar, beat, tone }) => {
      if (st === 0 && bar % 2 === 0) [0, 2].forEach(i => playNote("ooh", tone(i, p.root), t, 0.08, beat * 16, M.busCmb));
      if (st === 4) playNote("hglo", tone(bar % 2 ? 2 : 0, p.root + 24), t, 0.07, beat * 6, M.busCol);
    },
    kriegstrommel: ({ p, t, st, I }) => {
      const a = st === 0 || st === 3 || st === 6; if (p.dr && (a || !(Z.gq && Z.gq.lean)) && !(Z.gq && Z.gq.mini && st === 6 && M.tier >= 4)) hit(p.dr[1], t, a ? 0.42 : 0.16 + 0.1 * I, a ? 1 : 1.12); /* Handheld: nur die Akzente (Geisternoten belegten Stimmen) */
    },
    geist: ({ p, t, st, bar, beat, tone }) => {
      if (st === 0 && bar % 4 === 3) swell(t + beat * 8, 0.12);
      if (st === 0 && bar % 2 === 0) { playNote("ooh", tone(0, p.root + 12), t, 0.07, beat * 14, M.busCmb); playNote("ooh", tone(0, p.root + 13), t, 0.04, beat * 14, M.busCmb); }
    },
    amboss: ({ t, st }) => { if (st === 2 || st === 6) hit("amboss", t, 0.16, 1 + rnd(-0.02, 0.02), M.busDr); },
    summen: ({ p, t, st, bar, beat }) => {
      tick(t + beat / 2, 0.035, 0.012);
      if (st === 0 && bar % 2 === 0) hit("didgefx_" + (1 + Math.floor(Math.random() * 10)), t, 0.35, Math.pow(2, ((p.root - 37) % 12) / 12), M.busCmb);
    },
    wald: ({ p, t, beat, tone, chordStart }) => {
      if (chordStart) for (let i = 0; i < 6; i++) playNote("fharfe", tone(i % 4, p.root + 12 * Math.floor(i / 4)), t + i * beat * 0.5, 0.09 - i * 0.008, beat * 3, M.busCmb);
    },
    riese: ({ p, t, st }) => { if (st === 0 || st === 4) { hit(st ? "riese3" : "riese1", t, 0.5, 0.9); kick(t, 0.7); } },
    kreischen: ({ p, t, st, bar, beat }) => {
      if (st === 0 && bar % 2 === 1) { playNote("vlntrem", p.root + 24, t, 0.05, beat * 6, M.busCmb); playNote("vlntrem", p.root + 25, t, 0.05, beat * 6, M.busCmb); }
    },
    zwei: ({ p, t, st, bar, beat, tone }) => {
      if (st === 0 && bar % 2 === 0) { playNote("orgel", tone(0, p.root - 12), t, 0.08, beat * 15, M.busCmb); playNote("orgel", tone(0, p.root - 12) + 6, t, 0.06, beat * 15, M.busCmb); }
    },
    feuer: ({ p, t, st, bar }) => {
      if (st === 0 && bar % 4 === 0) hit("gong", t, 0.12, 0.9, M.busCmb);
      if (Math.random() < 0.35) tick(t + rnd(0, 0.1), 0.03, 0.008);
    },
    gift: ({ p, t, st, beat }) => { if (st >= 4) playNote("pizz", p.root + 12 - (st - 4), t, 0.09, beat * 0.8, M.busCmb); },
    netz: ({ p, t, st, beat, tone }) => {
      for (let k = 0; k < 2; k++) playNote(p.col, tone((st * 2 + k) % 4, p.root + 24), t + k * beat * 0.5, 0.045, beat * 0.8, M.busCol);
    }
  };
  function scheduleStep(t, beat, I) {
    const p = M.prof, st = M.step % 8, bar = Math.floor(M.step / 8), ph = M.step % 16;
    /* Stufenwechsel nur auf Grenzen: Kampf auf jede Viertel, Elite/Boss auf halbe Takte, abwärts auf die Eins */
    if (M.want !== M.tier) {
      /* R16: zurück in die Ruhe nur auf den Beginn einer Zwei-Takt-Phrase (vorher: jede Eins) */
      const raum = M.raumFrei && A.ctx.currentTime - M.raumFrei < 20; /* R18: nach dem letzten Gegner auf die nächste Eins */
      const w = M.want, ok = w > M.tier ? (w <= 2 ? st % 2 === 0 : st % 4 === 0) : (st === 0 && (w >= 2 || M.tier < 2 || bar % 2 === 0 || raum));
      const vorher = M.tier;
      if (ok) commitTier(w, t);
      /* R16 harmonischer Anschluss: beim Einstieg in den Kampf die Kampf-Akkordfolge so drehen, dass sie mit dem gerade klingenden
         Akkord weitergeht (statt mitten im Takt auf einen fremden Akkord zu springen); ebenso zurück in die Ruhe */
      if (ok && (vorher < 2) !== (w < 2) && M.chord != null) {
        const pr = w >= 2 ? M.progC : M.progE, k = pr ? pr.indexOf(M.chord) : -1;
        if (k >= 0) { const at = w >= 2 ? bar % 4 : Math.floor(bar / 2) % 4, sh = (k - at + 4) % 4, rot = pr.map((_, i) => pr[(i + sh) % 4]); if (w >= 2) M.progC = rot; else M.progE = rot; M.stats.anschluss = (M.stats.anschluss || 0) + 1; }
      }
    }
    const tr = M.tier, combat = tr >= 2;
    /* Harmonie: Erkundung zwei Takte je Akkord, Kampf einer */
    const slow = !combat;
    const prog = combat ? M.progC : M.progE;
    const ci = slow ? Math.floor(bar / 2) % 4 : bar % 4;
    const chord = prog[ci];
    const chordStart = st === 0 && (!slow || bar % 2 === 0);
    if (st === 0 && bar % 8 === 0 && M.step > 0) {
      /* neue Akkordfolge alle 8 Takte, nie dieselbe zweimal */
      const pool = combat ? (p.progC || PROG_CMB) : (p.progE || PROG_EXP); let np; do { np = pick(pool); } while (np === prog && pool.length > 1);
      if (combat) M.progC = np; else M.progE = np;
      if (Math.random() < 0.5) M.ost = pick(OSTP);
      if (!combat && !M.ruheFix) { M.ruheBars = (M.ruheBars || 0) + 8; if (!M.ruheA || M.ruheBars >= M.ruheLen) pickRuhe(); }
    }
    /* Kampf-Abschnitte: Takte zählen, alle 8 Takte neu wählen; Kette/Adrenalin sofort treiben, Breakdown bei vielen Gegnern in den Aufbau */
    if (st === 0 && combat && tr < 4 && M.step > 0) {
      M.kampfBars = (M.kampfBars || 0) + 1;
      if (!M.kampfFix) {
        if (M.kampfBars >= 8) pickKampf();
        else if (M.kampfA !== "treiben" && ((M.chain || 0) >= 6 || (Z.player && Z.player.st && Z.player.st.adrenalin > 0))) pickKampf("treiben");
        else if (M.kampfA === "breakdown" && M.kampfBars < 6 && kampfNah() >= 3) M.kampfBars = 6;
      }
    }
    M.chord = chord;
    const tone = (i, base) => deg(p.scale, chord + [0, 2, 4, 7][i], base);
    if (chordStart) padChord(chord, t, slow ? 0.6 : 0.18);
    if (ph === 0) planPhrase();
    const hum = () => t + rnd(-0.006, 0.01);
    const RA = !combat ? (M.ruheA || "grund") : "grund", lean = !!(Z.gq && Z.gq.lean);

    /* --- Herzschlag bei wenig Leben: im Takt, langsame Musik auf Vierteln, schnelle auf Halben --- */
    if (M.low > 0.08 && !(Z.player && Z.player.dead)) {
      const every = p.bpm < 100 ? 2 : 4;
      if (st % every === 0) heart(t, 0.22 + 0.3 * M.low, beat);
    }

    /* --- Erkundung --- */
    /* Bordun: jeden Takt neu angestoßen und überlappend, damit die kurzen Aufnahmen keine Lücken lassen */
    if (st === 0) {
      const len = beat * 8 * 1.45, re = chordStart ? 1 : 0.75;
      if (p.drone === "didge") playNote("didge", p.root - 12, t, 0.32 * re, len, M.busExp); /* Didgeridoo bleibt als Orgelpunkt auf dem Grundton */
      else if (RA === "orgel") { playNote(p.drone, p.root - 12, t, 0.27, len, M.busExp); playNote(p.drone, deg(p.scale, 4, p.root - 12), t, 0.12, len, M.busExp); } /* Orgelpunkt: Grundton und Quinte bleiben liegen */
      else {
        /* R16: tiefe Tonarten (Bordun unter C2 ≈ 65 Hz: Keller, Verlies, Schlund, See …) – Bordun −3 dB, sonst überdeckt er 60–120 Hz */
        const bs = tone(0, p.root - 12), dk = bs < 36 ? 0.7 : 1; playNote(p.drone, bs, t, 0.25 * re * dk, len, M.busExp);
        /* R16 Stimmführung: zweite Bordunstimme nicht stur auf der Quinte (Quintparallelen bei jedem Akkordwechsel), sondern
           der nächstgelegene Akkordton (Terz oder Quinte) zur vorigen Lage; liegende Töne bleiben liegen */
        if (I > 0.25 || p.calm) { const d2 = vlNext("dr2", [tone(1, p.root - 12), tone(2, p.root - 12)].filter(m => m > bs), bs); playNote(p.drone, d2, t, 0.12 * re * dk, len, M.busExp, -1); }
        else VL.dr2 = null;
      }
    }
    if (p.pad && st === 0) {
      const len = beat * 8 * 1.35;
      /* R16: zwei Flächenstimmen mit Stimmführung (nächster Akkordton, Gegenbewegung bevorzugt) statt Terz+Quinte parallel */
      const cand = [0, 1, 2].flatMap(i => [tone(i, p.root + 12), tone(i, p.root)]).filter(m => m >= p.root + 5 && m <= p.root + 24);
      const a1 = vlNext("pd1", cand, null), a2 = vlNext("pd2", cand.filter(m => Math.abs(m - a1) >= 3), a1);
      playNote(p.pad, Math.max(a1, a2), t, 0.09 + I * 0.04, len, M.busExp, -1);
      playNote(p.pad, Math.min(a1, a2), t, 0.07 + I * 0.04, len, M.busExp, -1);
    }
    /* Farbe: gebrochener Akkord bei Akkordwechseln, sonst seltene Einzeltöne in den Atempausen */
    if (p.col && tr <= 1 && RA === "phasen") {
      /* zwei Schleifen: 5 Achtel (Akkordtöne aufwärts) und 7 Achtel (eine Oktave höher, abwärts) – sie treffen sich erst nach 35 Achteln wieder */
      if (M.step % 5 === 0) { playNote(p.col, tone(M.phA % 4, p.root + 12), hum(), 0.085, beat * 5, M.busCol); M.phA++; }
      if (!lean && M.step % 7 === 3) { playNote(p.col, tone(3 - (M.phB % 3), p.root + 24), hum(), 0.05, beat * 6, M.busCol); M.phB++; }
    } else if (p.col && tr <= 1 && RA === "atem") {
      if (st === 0 && bar % 2 === 1 && Math.random() < 0.7) playNote(p.col, tone(pick([2, 3]), p.root + 24), hum(), 0.06, beat * 10, M.busCol);
    } else if (p.col && tr <= 1) {
      if (chordStart && Math.random() < 0.35) { const upw = Math.random() < 0.6; for (let i = 0; i < 4; i++) playNote(p.col, tone(upw ? i : 3 - i, p.root + 12), t + i * beat * 0.5, 0.11 - i * 0.012, beat * 4, M.busCol); }
      else if (!M.phrase && (st === 2 || st === 5) && Math.random() < 0.18) playNote(p.col, deg(p.scale, pick([0, 2, 4, 7, 9]) + chord, p.root + 19), hum(), 0.08, beat * 5, M.busCol);
    }
    if (p.lager && tr <= 1) lagerStep(p, t, st, bar, ph, beat, chord, tone, chordStart, hum);
    /* Abspann: Choral – Chor hält den Akkord, Horn singt eine Quint-Linie, Pauke auf jeder zweiten Eins, ab Takt 9 Glocken */
    if (p.hymne) {
      if (chordStart) { for (const i of [0, 1, 2]) playNote("aah", tone(i, p.root + 12), t, 0.07, beat * 15, M.busExp, -1); playNote("horn", deg(p.scale, chord + i0(bar), p.root), t, 0.1, beat * 7, M.busMel, 1); }
      if (st === 0 && bar % 2 === 0) playNote("timpt", tone(0, p.root - 12), t, 0.16, beat * 4, M.busExp);
      if (st === 0 && bar >= 8 && bar % 4 === 0) [0, 4, 7].forEach((d, k) => playNote("glock", deg(p.scale, chord + d, p.root + 36), t + k * beat, 0.05, beat * 6, M.busCol, -1));
    }
    /* Melodie (Leitmotiv-Noten tragen „semi“: Halbtöne über dem Grundton, auch chromatisch) */
    if (M.phrase) {
      for (const n of M.phrase) if (n.s === ph) {
        const calm = !combat;
        const vol = (calm ? 0.24 : 0.2 + 0.04 * I) * (n.soft ? 0.55 : 1) * (n.s % 4 === 0 ? 1 : 0.85);
        let midi;
        if (n.semi != null) midi = p.root + 12 + n.semi;
        else {
          let d = n.d;
          if (n.s % 4 === 0) { /* betonte Zeit: auf einen Akkordton ziehen */
            const ct = [chord, chord + 2, chord + 4, chord + 7, chord - 3, chord - 5];
            let best = d, bd = 99; for (const x of ct) for (const o of [-7, 0, 7]) { const y = x + o; if (Math.abs(y - d) < bd) { bd = Math.abs(y - d); best = y; } }
            if (bd <= 1) d = best;
          }
          midi = deg(p.scale, d, p.root + 12);
        }
        if (RA === "hoch" && calm) { midi += 12; }
        playNote(p.mel, midi, hum(), vol * (RA === "hoch" && calm ? 0.72 : 1), beat * n.l * (calm ? 1.6 : 1.1) + 0.1, M.busMel);
        /* Kanon: die Farbe antwortet einen Takt später eine Quinte höher (nicht auf weichen Echo-Noten) */
        if (RA === "kanon" && calm && p.col && !n.soft) {
          const m2 = n.semi != null ? midi + 7 : deg(p.scale, n.d + 4, p.root + 12);
          playNote(p.col, m2, t + beat * 8, vol * 0.42, beat * n.l * 1.4 + 0.1, M.busCol);
        }
        /* höchste Stufen: Blech verdoppelt die Melodie eine Oktave tiefer */
        if (combat && (tr >= 3 || I > 0.8 || M.rage > 0.3) && n.s % 2 === 0 && p.brass) playNote(p.brass, midi - 12, t, 0.1, beat * n.l, M.busCmb, -1);
      }
    }

    /* --- Ruhe-Abschnitt „puls“: weicher Herzpuls (Sub-Trommel 1 und 3, Pulsbass auf den Offbeats, feine Ticks) --- */
    if (RA === "puls" && tr <= 1 && !p.calm) {
      if (st === 0 || st === 4) kick(t, st === 0 ? 0.42 : 0.3);
      if (st % 2 === 1) pulse(tone(0, p.root - 24) + (st === 7 && bar % 2 ? 7 : 0), t, 0.09, beat * 0.9, 0.12 + 0.1 * Math.sin(M.step * 0.07));
      if (!lean && st % 2 === 1) tick(t + beat / 2, 0.022, 0.03);
    }
    /* --- Spannung (Gegner wach, aber noch kein Kampf) --- */
    if (tr === 1) {
      if (st === 0 || st === 4) playNote("timpt", tone(st === 0 ? 0 : 2, p.root - 12), t, 0.2 + 0.1 * M.T, beat * 3, M.busTen);
      if (M.T > 0.45 && (st === 0 || st === 3 || st === 6)) playNote("pizz", tone(st === 6 ? 2 : 0, p.root - 12), hum(), 0.16, beat * 1.5, M.busTen);
    }

    /* --- Kampf, Elite, Boss --- */
    /* --- Wasser (See, Demogorgon): Tropfen aus Celesta und seltene Walrufe, in jeder Stufe --- */
    if (p.water) {
      if (tr <= 1 && Math.random() < 0.09) playNote("cel", deg(p.scale, chord + pick([0, 2, 4, 7, 9, 11]), p.root + 36), t + beat * 0.5 * Math.floor(Math.random() * 2), 0.045, beat * 6, M.busCol);
      if (st === 0 && (M.whaleT = (M.whaleT || 0) - 1) <= 0 && (tr <= 1 || Math.random() < 0.3)) {
        M.whaleT = 10 + Math.floor(Math.random() * 10);
        const a = deg(p.scale, pick([4, 5, 7]), p.root + 12), b = deg(p.scale, pick([0, 2, 9]), p.root + 12);
        whale(t, a, b, beat * 8 * rnd(1.3, 2), 0.05 * p.water);
        M.stats.whale = (M.stats.whale || 0) + 1;
      }
    }

    /* --- Kampf, Elite, Boss --- */
    if (p.ost && combat) {
      const hi3 = tr >= 3, acc = st === 0 || st === 3 || st === 6; /* 3+3+2 */
      const oi = M.ost[st], ost = p.ostC || p.ost;
      /* Kampf-Abschnitte (pickKampf): voll · wechsel (Backbeat 2+4, Ostinato eine Oktave höher, Filter wandert) · breakdown (6 Takte
         ausgedünnt und gefiltert, 2 Takte Aufbau mit öffnendem Filter, Ticks 8tel→16tel, Wirbel) · treiben (Kick auf allen Vierteln,
         16tel-Ticks, Pulsbass). Halftime während der Zeitlupe (Schlag auf 1 und 3). Tom-Fill, wenn eine Elite einsetzt.
         Boss: Phase 2 Spiccato-16tel + Bassverdopplung, Phase 3 tiefer Chor-Orgelpunkt + Fill alle 2 Takte; Wut: Blech-Cluster
         (Grundton + kleine Sekunde), Posaunen-Stöße, Wirbel alle 4 Takte. */
      /* R14: lange Wächter-/Bosskämpfe (Stufe 4: 1–2 min ohne Phasenwechsel) – alle 24 Takte 4 Takte „wechsel“ (Backbeat,
         Ostinato oktaviert, Filter wandert) als Zwischenspiel, damit der Satz nicht 2 Minuten gleich kreist */
      const boss = tr === 4;
      if (boss && st === 0 && M.bossBarAt !== t) { M.bossBarAt = t; M.bossBarN = (M.bossBarN || 0) + 1; } else if (!boss) M.bossBarN = 0;
      const bZw = boss && M.bossBarN % 24 >= 17 && M.bossBarN % 24 <= 20;
      if (bZw && st === 0 && M.bossBarN % 24 === 17) M.stats.bossZw = (M.stats.bossZw || 0) + 1;
      const KA = boss ? (bZw ? "wechsel" : "voll") : (M.kampfA || "voll"), kB = M.kampfBars || 0;
      const brk = KA === "breakdown" && kB < 6, build = KA === "breakdown" && kB >= 6, drv = KA === "treiben", alt = KA === "wechsel";
      const half = !!M.half, bph = boss ? M.bossPh || 0 : 0, wut = boss && !!M.wut;
      const fill = !boss && M.want === 3 && M.tier === 2 && st % 4 >= 2;
      cmFilter(p, t, beat, brk, build, kB, st, bar, half, alt);
      if (st === 0 && M.kampfNeu) { M.kampfNeu = false; hit("crash", t, 0.16, 1); }
      /* Kernnoten auf der Eins (Ostinato, Bass, Blech-Akkord, tiefe Trommel) mit Vorrang 1: auf Handheld Grenze 18 statt 14 */
      const one = st === 0 ? 1 : undefined;
      if (!(half && st % 2) && !(brk && !acc)) playNote(ost, tone(oi, alt ? p.root : p.root - 12), t, ((acc ? 0.22 : 0.14) + 0.04 * I) * (brk ? 0.85 : 1), beat * (half ? 1.9 : 0.95), M.busCmb, one);
      if ((I > 0.7 || hi3 || drv) && acc && !brk && !half) playNote(ost, tone(oi, alt ? p.root + 12 : p.root), t, 0.1, beat * 0.9, M.busCmb, -1);
      if (st === 0 || (!brk && !half && (I > 0.65 || hi3 || drv) && (st === 3 || st === 6))) playNote(p.bass, lift(tone(0, p.root - 24), 30), t, st === 0 ? 0.3 : 0.2, beat * (st === 0 ? 3 : 2.2), M.busCmb, one);
      if (chordStart && p.brass && !brk && (I > 0.55 || hi3 || drv)) for (const i of (Z.gq && Z.gq.mini ? [0] : Z.gq && Z.gq.lean ? [0, 2] : [0, 1, 2])) playNote(p.brass, tone(i, p.root), t + i * 0.008, 0.11, beat * 1.6, M.busCmb, one); /* Handheld: Grundton + Quinte */
      if ((hi3 || I > 0.85 || M.rage > 0) && st === 0 && !brk) for (const i of [1, 2]) playNote("vlntrem", tone(i, p.root + 24), t, 0.06 + 0.03 * M.rage, beat * 8.4, M.busCmb, -1);
      if ((tr === 4 || M.ambush || M.rage > 0) && st === 0 && bar % 2 === 0) for (const i of [0, 1, 2]) playNote("aah", tone(i, p.root + 12), t, 0.07, beat * 16, M.busCmb, -1);
      /* Boss-Phasen: jede Phase eine neue Schicht */
      /* Handheld (Grenze 14): Phasen- und Wutschichten ausgedünnt – Spiccato nur auf jeder zweiten Achtel, keine zweite Bassstimme,
         Posaune nur auf der 3, hohe Trommel nur außerhalb der Wut (die Ticks tragen die Sechzehntel); sonst gingen in Phase 2/3 ~44 % verloren */
      const ln = !!(Z.gq && Z.gq.lean), mn = !!(Z.gq && Z.gq.mini); /* „minimal“ (Grenze 10): noch eine Stufe schlanker */
      if (boss && bph >= 1 && !half && !mn && (!ln || st % 2 === 0)) playNote(ost, tone(M.ost[(st + 2) % 8], p.root + 12), t + beat / 2, 0.065 * (ln ? 1.25 : 1), beat * 0.45, M.busCmb);
      if (boss && bph >= 1 && !ln && (st === 0 || st === 4)) playNote(p.bass, tone(0, p.root - 12), t, 0.15, beat * 1.8, M.busCmb);
      if (boss && bph >= 2 && st === 0 && bar % 2 === 0) { playNote("ooh", p.root, t, 0.08, beat * 16.5, M.busCmb, -1); playNote("ooh", p.root + 7, t, 0.05, beat * 16.5, M.busCmb, -1); }
      /* Wut: eigene Farbe */
      if (wut) {
        if (st === 0) { const b = p.brass || "blech"; playNote(b, p.root + 12, t, 0.09, beat * 0.8, M.busCmb); playNote(b, p.root + 13, t + 0.01, 0.07, beat * 0.8, M.busCmb); }
        if ((st === 3 && !mn) || (st === 6 && !ln)) playNote("pos", tone(0, p.root - 12), t, 0.11, beat * 0.6, M.busCmb);
      }
      /* Trommeln (Aufnahmen) */
      const [lo, mid, hi] = p.dr || [];
      if (half) { if (lo && st === 0) hit(lo, t, 0.8, 0.94, undefined, false, true); if (mid && st === 4) hit(mid, t, 0.62, 0.9); if (st === 0) kick(t, 0.55); }
      else if (brk) { if (lo && st === 0) hit(lo, t, kB % 2 ? 0.35 : 0.5, 0.95, undefined, false, true); if (st === 0 || st === 4) kick(t, st ? 0.25 : 0.4); }
      else {
        if (lo) { if (st === 0) hit(lo, t, 0.75, 1, undefined, false, true); if ((I > 0.35 || hi3 || drv) && (alt ? st === 5 : (st === 3 || st === 6))) hit(lo, t, 0.45, 1.06); }
        if (mid) {
          if (alt) { if (st === 2 || st === 6) hit(mid, t, 0.45); }
          else if ((I > 0.5 || hi3 || drv) && st === 4) hit(mid, t, 0.5);
          const fl = (bar % 4 === 3 && (I > 0.6 || hi3)) || (build && kB === 7) || (boss && bph >= 2 && bar % 2 === 1 && !mn); /* minimal: kein Zusatz-Fill in Phase 3 */
          if (fl && st >= 5) { hit(mid, t, 0.3 + (st - 5) * 0.08, 1.15); if (!ln || st === 7) hit(mid, t + beat / 2, 0.25 + (st - 5) * 0.08, 1.2); }
          if (build && kB === 7 && st < 5) hit(mid, t, 0.1 + st * 0.04, 1.2);
          if (fill) { const k = st % 4 - 2; hit(mid, t, 0.3 + k * 0.12, 1.12); hit(mid, t + beat / 2, 0.36 + k * 0.12, 1.2); }
        }
        if (hi && (hi3 || I > 0.72 || M.rage > 0.3 || drv) && st % 2 === 1 && !(ln && (wut || bph >= 1 || mn) && st % 4 === 3) && !(mn && (wut || bph >= 1))) hit(hi, hum(), hi === "amboss" ? 0.12 : 0.22, 1 + rnd(-0.03, 0.03));
        if ((bar % 8 === 7 && st === 4 && (I > 0.6 || hi3)) || (build && kB === 7 && st === 0) || (wut && st === 0 && bar % 4 === 3)) hit("timproll", t, 0.22);
        /* Sub-Trommel: stützt die tiefe Trommel; im Boss und beim Treiben auf allen Vierteln */
        if (st === 0 || ((boss || drv) && st % 2 === 0) || ((I > 0.35 || hi3) && (st === 3 || st === 6))) kick(t, st === 0 ? 0.5 : drv ? 0.42 : 0.34);
      }
      /* Ticks: ab mittlerer Intensität Achtel, ab Elite/Treiben/Wut Sechzehntel; im Aufbau anschwellend (8tel, dann 16tel) */
      if (!half && !brk && (hi3 || I > 0.6 || drv || build || wut)) {
        const many = hi3 || drv || wut || (build && kB === 7);
        const v = (many ? 0.07 : 0.05) * (build ? 0.35 + 0.5 * ((kB - 6) * 8 + st) / 16 : 1);
        const dm = p.tickDec ? p.tickDec / 0.022 : 1;
        tick(t, (st % 2 === 0 ? v : v * 0.6) * rnd(0.85, 1.1), (st % 4 === 2 ? 0.05 : 0.022) * dm);
        if (many) tick(t + beat / 2, v * (drv ? 0.6 : 0.4) * rnd(0.8, 1.1), (drv && st % 2 === 1 ? 0.06 : 0.022) * dm);
      }
      /* Akzent des Gebiets bzw. Bosses; Mini-Boss in der Nähe: Blech und Pauke auf jedem Akkord */
      const fx = p.acc && ACC[p.acc];
      if (fx && !brk && !half) fx({ p, t, st, bar, beat, tr, I, tone, chordStart, hum });
      if (M.miniNear && tr >= 3 && !p.boss) {
        if (st === 0) { playNote("timpt", tone(0, p.root - 12), t, 0.3, beat * 3, M.busCmb); if (p.brass) [0, 1, 2].forEach(i => playNote(p.brass, tone(i, p.root), t, 0.09, beat * 3, M.busCmb)); }
        if (st === 4 && bar % 2 === 1) playNote("timpt", tone(2, p.root - 12), t, 0.22, beat * 2, M.busCmb);
      }
      /* Pulsbass ab Elite (und beim Treiben): Sechzehntelraster, Grundton des Akkords, ab und zu die Quinte */
      if ((hi3 || drv) && !half) {
        const pat = tr === 4 ? PULS.boss : PULS.elite, sixt = beat / 2;
        for (let k = 0; k < 2; k++) {
          const v = pat[st * 2 + k]; if (!v) continue;
          const midi = (st === 7 && k === 1) ? tone(2, p.root - 24) : tone(0, p.root - 24);
          pulse(midi, t + k * sixt, 0.16 * v, sixt * 1.6, v * (0.4 + 0.4 * I));
        }
      }
    }
  }
  /* Filterfahrten der Kampfebene (Ostinato/Bass/Blech) und der Trommeln */
  function cmFilter(p, t, beat, brk, build, kB, st, bar, half, alt) {
    if (!M.cmF) return;
    let f = 20000, tc = 0.25;
    if (brk) f = 1000; else if (build) { f = 650 * Math.pow(12000 / 650, ((kB - 6) * 8 + st + 1) / 16); tc = beat * 0.6; }
    else if (half) f = 1500; else if (alt) f = 2200 + 3800 * (0.5 + 0.5 * Math.sin(bar * Math.PI / 4));
    if (Math.abs(f - (M.cmFv || 0)) > 30) { M.cmFv = f; M.cmF.frequency.setTargetAtTime(f, t, tc); }
    const d = brk ? 1100 : (p.drLP || 20000);
    if (M.drF && d !== M.drFv) { M.drFv = d; M.drF.frequency.setTargetAtTime(d, t, 0.3); }
  }
  /* Kampf-Abschnitt wählen (alle 8 Takte; Kette/Adrenalin und viele Gegner greifen schon auf der nächsten Eins) */
  function kampfNah() { const P = Z.player; if (!P) return 0; let n = 0; for (const e of Z.enemies || []) if (!e.dead && e.aware && !e.ally && Math.abs(e.x - P.x) < 320 && Math.abs(e.y - P.y) < 200) n++; return n; }
  function pickKampf(force) {
    const prev = M.kampfA || "voll"; let k = force;
    if (!k) {
      const n = kampfNah(), adr = !!(Z.player && Z.player.st && Z.player.st.adrenalin > 0);
      /* Treiben nicht zweimal hintereinander (sonst bleibt es bei hoher Intensität dauernd oben) – danach Voll oder Wechsel */
      if (prev !== "treiben" && ((M.chain || 0) >= 5 || adr || (M.intensity > 0.88 && Math.random() < 0.5))) k = "treiben";
      else if (prev === "treiben") k = Math.random() < 0.5 ? "wechsel" : "voll";
      else if (n <= 1 && prev !== "breakdown" && M.intensity < 0.6) k = "breakdown";
      else if (prev === "voll") k = Math.random() < 0.55 ? "wechsel" : "voll";
      else k = prev === "breakdown" ? "voll" : Math.random() < 0.7 ? "voll" : "wechsel";
    }
    if (prev === "breakdown" && k !== "breakdown") M.kampfNeu = true; /* nach dem Aufbau: Becken auf die Eins */
    M.kampfA = k; M.kampfBars = 0; M.stats.kampf = M.stats.kampf || {}; M.stats.kampf[k] = (M.stats.kampf[k] || 0) + 1;
  }
  M.kampf = name => { if (name) { pickKampf(name); M.kampfFix = true; } else M.kampfFix = false; return M.kampfA; };

  /* ---------- Stinger und Akzente ---------- */
  /* nächster Rasterpunkt des Taktgebers (div Achtel; 0.5 = Sechzehntel), damit Stinger im Takt sitzen */
  function grid(div) {
    const now = A.ctx.currentTime + 0.03, beat = M.beat || 0.3;
    if (!M.prof || M.next < now - beat) return now;
    let t = M.next, s = M.step;
    if (div < 1) { while (t - beat * 0.5 > now) t -= beat * 0.5; return t; }
    while (t - beat > now) { t -= beat; s--; }
    while (s % div !== 0 || t < now) { t += beat; s++; }
    return t;
  }
  M.grid = grid;
  const q16 = () => grid(0.5);
  /* Rückwärts-Becken, das genau zum Zeitpunkt „at“ seinen Höhepunkt erreicht */
  function swell(at, vol) {
    const path = K("crash"), b0 = A.buf[path]; if (!b0) { if (b0 === undefined) A.load(path); return; }
    const b = reversed(path, b0), c = A.ctx, now = c.currentTime + 0.02, start = Math.max(now, at - b.duration);
    const off = start - (at - b.duration);
    const s = c.createBufferSource(); s.buffer = b; const g = c.createGain();
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + 0.3); s.connect(g); g.connect(M.busSt);
    track(s, g, true, at); s.start(start, off);
  }
  /* Ebenen unter einem Stinger kurz zurücknehmen */
  function duck(depth, at, dur) {
    if (!M.lay) return;
    const g = M.lay.gain; g.setTargetAtTime(1 - depth, Math.max(A.ctx.currentTime, at - 0.05), 0.05); g.setTargetAtTime(1, at + dur, 0.5);
  }
  M.duck = (depth, dur) => duck(clamp(depth, 0, 0.8), A.ctx ? A.ctx.currentTime : 0, dur || 1);
  /* bei „Dynamik aus“ entfallen die Kampf-Stinger (die Musik soll dann nicht auf den Kampf reagieren) */
  const COMBAT_ST = { kampf: 1, ruhe: 1, elite: 1, kette: 1 };
  M.stinger = (kind, o) => {
    if (!A.ok || !M.out) return;
    if (MOTIFS[kind] && !STINGERS[kind]) return M.motif(kind, o);
    if (dynMode() === "aus" && COMBAT_ST[kind]) return;
    const p = M.prof || PROF.torhof, now = A.ctx.currentTime, beat = M.beat || 60 / p.bpm / 2;
    const t = o && o.at > now ? o.at : Math.max(q16(), now + 0.03);
    M.lastSting = M.lastSting || {};
    if (kind === "erfolg") M.lastSting.erfolg = 0; /* jede Freischaltung bekommt ihre Fanfare */
    const gap = { kampf: 6, ruhe: 8, kette: 0.2, truhe: 1, seite: 2, elite: 10, beute: 1.5, geschafft: 3 }[kind] || 1.5;
    if (M.lastSting[kind] && now - M.lastSting[kind] < gap) return;
    M.lastSting[kind] = now; M.stats.stingers[kind] = (M.stats.stingers[kind] || 0) + 1;
    const ch = M.chord || 0, tn = (i, base, c2) => deg(p.scale, (c2 == null ? ch : c2) + [0, 2, 4, 7][i], base), B = M.busSt;
    const fn = STINGERS[kind]; if (fn) fn({ p, t, now, beat, ch, tn, B, o: o || {} });
  };
  /* Farbe im Schlussakkord je Boss-Akzent (siehe ACC) */
  const BOSS_END = {
    glas: (p, t) => [0, 4, 7, 12].forEach((d, i) => playNote("glas", p.root + 36 + d, t + 0.6 + i * 0.12, 0.05, 2.5, M.busSt, 2)),
    ritual: (p, t) => [0, 7, 12].forEach((d, i) => playNote("hglo", p.root + 24 + d, t + 0.6 + i * 0.3, 0.06, 3, M.busSt, 2)),
    kriegstrommel: (p, t, B, beat) => { if (p.dr) [0, 1, 2].forEach(i => hit(p.dr[1] || p.dr[0], t - beat * (3 - i) * 0.5, 0.3 + i * 0.12, 1, B)); },
    geist: (p, t) => [0, 4, 7].forEach(d => playNote("ooh", p.root + 12 + d, t + 0.6, 0.06, 4.5, M.busSt, 2)),
    amboss: (p, t) => [0, 0.5, 1].forEach((d, i) => hit("amboss", t + 0.6 + d, 0.18 - i * 0.05, 1, M.busSt)),
    feuer: (p, t) => hit("gong", t + 0.6, 0.16, 0.9, M.busSt),
    riese: (p, t) => { hit("riese1", t, 0.5, 0.85, M.busSt); kick(t, 0.8); },
    netz: (p, t) => [0, 4, 7, 12, 16].forEach((d, i) => playNote(p.col || "cel", p.root + 24 + d, t + 0.6 + i * 0.1, 0.05, 1.5, M.busSt, 2)),
    /* R18: bisher ohne eigenen Schluss – Chasme: Sitar-Triller auf der Quinte verebbt; Ilvara: Okarina ruft, Koto antwortet abwärts;
       Vrock: Pfeife stürzt in Halbtönen ab; Demogorgon: Tritonus der zwei Köpfe löst sich in die reine Quinte; Venomfang: Pizzicato rutscht chromatisch auf den Grundton */
    summen: (p, t) => { for (let i = 0; i < 8; i++) playNote("sitar", p.root + 12 + (i % 2 ? 8 : 7), t + 0.6 + i * 0.07, 0.06 - i * 0.005, 0.5, M.busSt, 2); },
    wald: (p, t) => { [7, 9, 12].forEach((d, i) => playNote("oka", p.root + 24 + d, t + 0.6 + i * 0.16, 0.06, 1.2, M.busSt, 2)); [12, 9, 7, 4, 0].forEach((d, i) => playNote("koto", p.root + 12 + d, t + 1.2 + i * 0.12, 0.06, 1.6, M.busSt, 2)); },
    kreischen: (p, t) => [12, 11, 10, 9, 8, 7].forEach((d, i) => playNote("pfeife", p.root + 24 + d, t + 0.6 + i * 0.09, 0.05 - i * 0.006, 0.6, M.busSt, 2)),
    zwei: (p, t) => { playNote("orgel", p.root, t + 0.6, 0.07, 1.6, M.busSt, 2); playNote("orgel", p.root + 6, t + 0.6, 0.06, 1.2, M.busSt, 2); playNote("orgel", p.root + 7, t + 1.7, 0.07, 2.6, M.busSt, 2); playNote("orgel", p.root + 12, t + 1.7, 0.05, 2.6, M.busSt, 2); },
    gift: (p, t) => [6, 5, 4, 3, 2, 1, 0].forEach((d, i) => playNote("pizz", p.root + 12 + d, t + 0.6 + i * 0.08, 0.09, 0.8, M.busSt, 2))
  };
  const STINGERS = {
    kampf: ({ p, t, o, beat, tn, B }) => { /* Einsatz: tiefer Schlag, Becken, Blechstoß – auf die Taktgrenze */
      const tq = o.at || grid(2);
      if (p.dr) hit(p.dr[0], tq, 0.8, 0.94, B);
      hit("crash", tq, 0.16, 0.9, B);
      if (p.brass) for (let i = 0; i < 3; i++) playNote(p.brass, tn(i, p.root), tq, 0.13, beat * 2.5, B, 2);
      playNote("pizz", tn(0, p.root - 12), tq, 0.2, beat * 2, B, 2);
      kick(tq, 0.6);
    },
    ruhe: ({ p, t, tn, B }) => { /* Kampf vorbei: Chor-Akkord auf der Tonika, Harfe fällt herab */
      for (const i of [0, 1, 2]) playNote(p.pad || "ooh", tn(i, p.root + 12, 0), t, 0.1, 4.5, B, 1);
      for (let i = 0; i < 5; i++) playNote("harfe", deg(p.scale, 9 - i * 2, p.root + 12), t + 0.2 + i * 0.16, 0.12, 2.5, B, 1);
    },
    elite: ({ p, t, beat, B }) => { /* Elite gesichtet: tiefer Schlag, Blech schwillt mit kleiner Sekunde an und löst sich in die Quinte */
      const tq = grid(2), b = p.brass || "hornst";
      if (p.dr) hit(p.dr[0], tq, 0.7, 0.86, B);
      playNote("tuba", p.root - 12, tq, 0.14, beat * 6, B, 1);
      playNote(b, p.root, tq, 0.1, beat * 3, B, 1); playNote(b, p.root + 1, tq, 0.08, beat * 2.6, B, 1);
      playNote(b, p.root + 7, tq + beat * 3, 0.11, beat * 3, B, 1);
      playNote("vlntrem", p.root + 25, tq, 0.05, beat * 5, B, 1);
      duck(0.25, tq, beat * 5);
    },
    hinterhalt: ({ p, t, B }) => { /* Falle schnappt zu: harter Stoß, dissonanter Blechcluster */
      if (p.dr) hit(p.dr[0], t, 0.9, 0.85, B);
      hit("crash", t, 0.2, 0.8, B);
      const b = p.brass || "hornst";
      playNote(b, p.root, t, 0.13, 1.2, B, 2); playNote(b, p.root + 1, t, 0.1, 1.2, B, 2); playNote(b, p.root + 6, t, 0.1, 1.2, B, 2);
      M.heat = Math.max(M.heat, 0.9);
    },
    boss: ({ p, now, beat, tn, B }) => { /* Rückwärts-Becken atmet bis zum Einsatz, Paukenwirbel darunter */
      let at = M.bossLead && M.bossLead > now + 0.3 ? M.bossLead : grid(8);
      while (at < now + 1.2) at += beat * 8;
      swell(at, 0.3);
      hit("timproll", Math.max(now + 0.02, at - 1.5), 0.25, 1, B);
      if (p.dr) hit(p.dr[0], at, 0.9, 0.9, B);
      hit("gong", at, 0.25, 0.8, B);
      for (const i of [0, 1, 2]) playNote("aah", tn(i, p.root + 12, 0), at, 0.12, 3.5, B, 2);
      kick(at, 0.7);
      if (p.mot) M.bossMotif(false, at + beat * 2, 2);
    },
    phase: ({ p, t, tn, B }) => { /* Bossphase: Paukenwirbel → Schlag, Blech eine Stufe höher, Wut steigt */
      hit("timproll", t, 0.3, 1, B);
      const tt = t + 1.0;
      if (p.dr) hit(p.dr[0], tt, 0.9, 0.88, B);
      hit("crash", tt, 0.2, 1, B);
      const b = p.brass || "blech";
      for (let i = 0; i < 3; i++) playNote(b, tn(i, p.root + 1), tt, 0.14, 2, B, 2);
      M.rage = Math.min(1, M.rage + 0.6);
      /* zweite Phase: Besetzung/Tempo des Bosses wechseln, Leitmotiv eine Oktave höher und lauter */
      if (p.boss && p.p2 && !M.p2) { M.p2 = true; M.prof = Object.assign({}, p, p.p2); preload(M.prof); }
      /* dritte Phase (Demogorgon: „Der Abgrund öffnet sich“): noch eine Besetzung/Tempostufe */
      else if (p.boss && p.p3 && M.p2 && !M.p3) { M.p3 = true; M.prof = Object.assign({}, p, p.p3); preload(M.prof); }
      /* dritte Phase ohne eigene Besetzung: Rückung um einen Halbton (nur in Moll/harmonisch Moll – dort klingt sie als Zuspitzung) */
      else if (p.boss && !p.p3 && !M.rueck && Z.boss && (Z.boss.phase | 0) >= 2 && (p.scale === "harm" || p.scale === "moll")) { M.rueck = true; M.prof = Object.assign({}, M.prof, { root: M.prof.root + 1 }); preload(M.prof); }
      if (p.mot) M.bossMotif(true, tt + 0.6, 2);
      duck(0.3, tt, 1.5);
    },
    sieg: ({ p, t: t0, B, beat }) => { /* Boss besiegt: sein Leitmotiv bricht (halbes Tempo, tief, verklingend), dann der aufgehellte Schlussakkord (Pikardie-Terz) in seiner Tonart und Besetzung */
      let t = t0;
      /* Boss-Profile sind leiser getrimmt (dichter Satz); der Schluss-Stinger soll trotzdem tragen */
      const tc = clamp(1.3 / (M.trim || 1), 1.15, 1.8);
      freeVoices(VOC.size); /* der Bosssatz verklingt ohnehin (duck): seine Stimmen freigeben, damit der Stinger vollständig erklingt */
      if (p.mot && p.mot.length) {
        const mot = p.mot.slice(0, 5), b0 = Math.min(beat, 0.3) * 1.5, end = Math.min(9, Math.max(...mot.map(n => n[1] + n[2])));
        hit("crash", t0, 0.14, 0.8, B); if (p.dr) hit(p.dr[0], t0, 0.75, 0.9, B); kick(t0, 0.6);
        /* R14 Handheld: Grenze 18+12 – ohne Oktavverdopplung, Pauke nur auf erster und letzter Note (sonst fehlten ~14 von 40 Noten) */
        const thin = !!(Z.gq && Z.gq.lean), nM = mot.filter(n => n[1] < end).length;
        mot.forEach(([s0, st, l], i) => {
          if (st >= end) return;
          const m = p.root + s0, k = 1 - i / (mot.length + 2);
          playNote(p.brass || "horn", m, t0 + st * b0, 0.22 * k * tc * (thin ? 1.1 : 1), b0 * l + 0.1, B, 2);
          if (!thin) playNote(p.mel || "vc", m + 12, t0 + st * b0, 0.1 * k * tc, b0 * l + 0.1, B, 2);
          if (!thin || i === 0 || i === nM - 1) playNote("timpt", p.root - 12, t0 + st * b0, 0.2 * k * tc, b0 * 1.5, B, 2);
        });
        playNote("vctrem", p.root - 12, t0, 0.1, end * b0, B, 2);
        if (p.dr) hit(p.dr[1] || p.dr[0], t0 + end * b0 - b0, 0.45, 0.85, B);
        t = t0 + end * b0 + b0 * 0.5;
        BOSS_END[p.acc] && BOSS_END[p.acc](p, t, B, beat);
        duck(0.55, t0, (t - t0) + 3.5);
      }
      hit("crash", t, 0.2, 1, B);
      if (p.dr) hit(p.dr[0], t, 0.8, 1, B);
      const r = p.root, maj = [r, r + 4, r + 7, r + 12];
      const b = p.brass || "blech";
      const kk = (p.mot ? 1.35 : 1) * tc; /* nach dem gebrochenen Leitmotiv trägt der Schlussakkord mehr */
      const th2 = !!(Z.gq && Z.gq.lean), majS = th2 ? [r, r + 4, r + 7] : maj; /* Handheld: Dreiklang statt Vierklang, Chor Grundton + Terz, Harfe 4 */
      [0, 0.18, 0.36].forEach((d, i) => playNote(b, maj[i], t + d, 0.13 * kk, 0.5, B, 2));
      majS.forEach(m => playNote(b, m, t + 0.6, 0.12 * kk * (th2 ? 1.1 : 1), 3.2, B, 2));
      (th2 ? [r, r + 4] : maj).forEach(m => playNote("aah", m + 12, t + 0.6, 0.08 * kk * (th2 ? 1.2 : 1), 4, B, 2));
      for (let i = 0; i < (th2 ? 4 : 6); i++) playNote("harfe", maj[i % 4] + 12 * (1 + Math.floor(i / 4)), t + 0.6 + i * 0.09, 0.1 * kk, 2.5, B, 2);
      duck(0.5, t, 3.5);
    },
    /* Erfolg freigeschaltet (R12): kurze Fanfare in der Tonart, je Kategorie gefärbt; o.gross = seltener/schwerer Erfolg → prächtiger
       (Chor, Paukenwirbel, Oktavverdopplung, Becken, länger). Kategorien: tempo, technik, nohit, erkundung, bosse, sonst */
    erfolg: ({ p, t: t0, B, o }) => {
      const t = grid(1), r = p.root + 12, k = o.kat || "sonst", gr = !!o.gross, b = 0.11;
      const up = [0, 2, 4, 7].map(d => deg(p.scale, d, r)), top = deg(p.scale, 7, r);
      const ins = { tempo: "trpst", technik: "hornst", nohit: "cel", erkundung: "harfe", bosse: "blech", sammeln: "mbira", kurios: "pizz", geschichte: "psab" }[k] || "trpst";
      /* R13: Nachschlag – kommt ein weiterer (nicht seltener) Erfolg kurz nach dem vorigen, nur zwei Töne der Kategorie und ein
         Glockenpunkt, um eine Stufe höher (o.n = wievielter in Folge): die Häufung klingt wie eine Kette statt fünfmal derselben Fanfare */
      if (o.kurz) { const sh = Math.min(3, o.n || 1); [4, 7].forEach((d, i) => playNote(ins, deg(p.scale, d + sh, r), t + i * 0.09, 0.075, 0.5, B, 2)); playNote("glock", deg(p.scale, 7 + sh, r + 12), t + 0.2, 0.05, 1.2, B, 2); if (o.titel) playNote("glock", deg(p.scale, 4 + sh, r + 24), t + 0.38, 0.04, 1.2, B, 2); return; }
      const stp = { tempo: 0.07, technik: 0.11, nohit: 0.1, erkundung: 0.06, bosse: 0.14, sammeln: 0.08, kurios: 0.09, geschichte: 0.13 }[k] || 0.1;
      up.forEach((m, i) => playNote(ins, m + (k === "nohit" ? 12 : 0), t + i * stp, 0.11 - i * 0.008, stp * 2.2, B, 2));
      const tEnd = t + 4 * stp;
      [0, 2, 4].forEach(d => playNote(k === "nohit" ? "glock" : k === "erkundung" ? "kal" : (p.brass || "hornst"), deg(p.scale, d, r + (k === "nohit" ? 24 : 0)), tEnd, 0.09, gr ? 2.6 : 1.3, B, 2));
      if (k === "tempo") for (let i = 0; i < 6; i++) tick(t + i * 0.035, 0.05, 0.015);
      if (k === "technik" && p.dr) hit(p.dr[1] || p.dr[0], tEnd, 0.4, 1.05, B);
      if (k === "erkundung") for (let i = 0; i < 5; i++) playNote("kal", deg(p.scale, i * 2, r + 12), t + i * 0.05, 0.05, 1.2, B, 2);
      if (k === "bosse") { playNote("timpt", deg(p.scale, 0, p.root - 12), tEnd, 0.22, 1.6, B, 2); if (p.dr) hit(p.dr[0], tEnd, 0.6, 0.9, B); }
      if (k === "sammeln") hit("glock_96", tEnd + 0.05, 0.05, 1, B);
      if (k === "kurios") [9, 7].forEach((d, i) => playNote("glas", deg(p.scale, d, r + 24), tEnd + 0.12 + i * 0.1, 0.05, 0.8, B, 2));
      if (k === "geschichte") [0, 4].forEach(d => playNote("ooh", deg(p.scale, d, r), tEnd, 0.06, 2.4, B, 2));
      /* Stufe Gold: Oktave obendrauf und Becken (selten/„Blut“ = gross, unten) */
      if (o.stufe === "gold" && !gr) { playNote(ins, top + 12, tEnd + 0.12, 0.07, 1.2, B, 2); hit("crash", tEnd, 0.08, 1.15, B); }
      /* Titel-Erfolge: ein Herold-Ruf aus drei Glockentönen (Oktave, Quinte, Grundton) nach dem Akkord */
      if (o.titel) [7, 4, 0].forEach((d, i) => playNote("glock", deg(p.scale, d, r + 24), tEnd + (gr ? 0.9 : 0.5) + i * 0.16, 0.07, 1.6, B, 2));
      if (gr) {
        hit("timproll", t - 0.05, 0.18, 1, B); hit("crash", tEnd, 0.16, 1, B); kick(tEnd, 0.5);
        (Z.gq && Z.gq.lean ? [0, 4] : [0, 2, 4]).forEach(d => playNote("aah", deg(p.scale, d, r), tEnd, 0.07, 3.4, B, 2)); /* Handheld: Chor zweistimmig */
        playNote(ins, top + 12, tEnd + 0.2, 0.08, 1.8, B, 2);
      }
      duck(gr ? 0.45 : 0.3, t, gr ? 2.8 : 1.5);
      void b; void t0;
    },
    tod: ({ p, t: t0, B }) => { /* tiefer Chor sinkt herab */
      /* R18 Niederlage im Bosskampf: der Boss „triumphiert“ – die ersten Töne seines Leitmotivs in seiner Melodiestimme, breit und
         eine Oktave tiefer; danach erst der Chor */
      let t = t0;
      if (p.boss && p.mot && p.mot.length) {
        const mot = p.mot.slice(0, 4), b0 = 0.24;
        mot.forEach(([s0, st, l]) => playNote(p.mel || "horn", p.root + s0, t0 + st * b0, 0.12, b0 * l + 0.3, B, 2));
        if (p.dr) hit(p.dr[0], t0, 0.5, 0.85, B);
        t = t0 + Math.min(2.2, Math.max(...mot.map(n => n[1] + n[2])) * b0) + 0.2; M.stats.bossTod = (M.stats.bossTod || 0) + 1;
      }
      [0, -2, -4].forEach((d, i) => playNote("ooh", deg(p.scale, d, p.root + 12), t + i * 0.9, 0.12, 2.4, B, 1));
      playNote("vc", p.root - 12, t, 0.2, 4, B, 1);
      hit("gong", t + 0.1, 0.18, 0.7, B);
      duck(0.6, t, 4);
    },
    seite: ({ p, t, tn, B }) => { /* Tagebuchseite: geheimnisvolles Celesta-Motiv über leisem Chor */
      const mot = [4, 2, 7, 6];
      mot.forEach((d, i) => playNote("cel", deg(p.scale, d, p.root + 24), t + i * 0.22, 0.13, 2.2, B, 1));
      playNote("ooh", tn(0, p.root + 12, 0), t, 0.08, 3.5, B, 1); playNote("ooh", tn(2, p.root + 12, 0), t, 0.06, 3.5, B, 1);
    },
    truhe: ({ p, t, B }) => { /* Truhe: Harfenglissando hinauf und ein Glockenfunkeln */
      for (let i = 0; i < 7; i++) playNote("harfe", deg(p.scale, i, p.root + 12), t + i * 0.045, 0.08 + i * 0.006, 1.6, B, 1);
      playNote("glock", deg(p.scale, 7, p.root + 24), t + 0.34, 0.09, 2, B, 1);
    },
    beute: ({ p, t, B, o }) => { /* seltene Beute: Celesta-Funkeln in Dur-Aufhellung; legendär zusätzlich Chor und leiser Gong */
      const r = p.root, legend = (o.rar || 2) >= 3, maj = [0, 4, 7, 12, 16];
      maj.forEach((s, i) => playNote("cel", r + 24 + s, t + i * 0.07, 0.1, 1.8, B, 1));
      playNote("glock", r + 36 + 7, t + 0.38, 0.08, 2.2, B, 1);
      if (legend) {
        [0, 4, 7].forEach(s => playNote("aah", r + 12 + s, t, 0.08, 3.2, B, 1));
        hit("gong", t, 0.12, 1.2, B); swell(t, 0.12);
        duck(0.3, t, 2.5);
      }
    },
    geschafft: ({ p, t, beat, B }) => { /* Herausforderung/Prüfung geschafft: kurze Fanfare 5-1-3 in Dur, Becken */
      const tq = grid(2), r = p.root + 12, b = "trpst";
      [[r - 5, 0, 0.6], [r, 1, 0.6], [r + 4, 2, 3.5]].forEach(([m, i, l]) => playNote(b, m, tq + i * beat, 0.11, beat * l, B, 1));
      [0, 4, 7].forEach(s => playNote(p.brass || "hornst", p.root + s, tq + beat * 2, 0.08, beat * 4, B, 1));
      hit("crash", tq + beat * 2, 0.1, 1.1, B);
      duck(0.3, tq, beat * 5);
    },
    kette: ({ p, t, beat, B, o }) => { /* Kill-Ketten-Stufen (3, 5, 8, 12, 20): jede Stufe ein Stück größer */
      const n = o.n || 3, lvl = n >= 20 ? 5 : n >= 12 ? 4 : n >= 8 ? 3 : n >= 5 ? 2 : 1;
      const tq = grid(1);
      playNote("glock", deg(p.scale, lvl * 2, p.root + 36), tq, 0.06 + lvl * 0.01, 1.4, B, 1);
      if (lvl >= 2) [0, 2, 4].forEach((d, i) => playNote("trpst", deg(p.scale, d + lvl - 2, p.root + 12), tq + i * beat * 0.5, 0.09, beat * (i === 2 ? 2 : 0.6), B, 1));
      if (lvl >= 3 && p.dr) hit(p.dr[0], tq, 0.55, 1, B);
      if (lvl >= 4) { hit("crash", tq + beat, 0.12, 1.05, B); playNote(p.brass || "blech", deg(p.scale, 4, p.root), tq + beat, 0.1, beat * 3, B, 1); }
      if (lvl >= 5) [0, 2, 4].forEach(d => playNote("aah", deg(p.scale, d, p.root + 12), tq + beat, 0.07, beat * 6, B, 1));
      M.heat = Math.max(M.heat, 0.5 + lvl * 0.06);
    }
  };
  M.STINGERS = Object.keys(STINGERS);
  /* Kill-Kette melden (klang.js): Intensität steigt, Stinger nur auf den Stufen */
  const CHAIN_STEPS = { 3: 1, 5: 1, 8: 1, 12: 1, 20: 1, 30: 1 };
  M.chainHit = (n, prev) => {
    M.chain = n; prev = prev == null ? n - 1 : prev;
    if (n >= 3) M.push(Math.min(0.75, 0.3 + n * 0.04), 4);
    let top = 0; for (const k in CHAIN_STEPS) if (+k > prev && +k <= n) top = Math.max(top, +k);
    if (top) M.stinger("kette", { n: top });
  };
  M.chainEnd = () => { M.chain = 0; };

  /* ---------- Motive ----------
     Halbtöne relativ zum Grundton des Gebiets (chromatisch erlaubt), Start und Länge in Achteln. */
  const MOTIFS = {
    /* Nemesis: Grundton – kleine Sekunde – zurück – hinab zur kleinen Septime – Tritonus hinauf: bedrohlich, unaufgelöst */
    nemesis: { notes: [[0, 0, 3], [1, 3, 1], [0, 4, 2], [-2, 6, 2], [6, 8, 4], [5, 12, 4]], inst: ["pos", "horn"], oct: -12, vol: 0.13, choir: true, drum: true }
  };
  M.defineMotif = (name, def) => {
    if (!name || !def || !Array.isArray(def.notes)) return false;
    MOTIFS[name] = Object.assign({ inst: ["horn"], oct: 0, vol: 0.12 }, def);
    return true;
  };
  M.motif = (name, o) => {
    const m = MOTIFS[name]; if (!m || !A.ok || !M.out) return 0;
    o = o || {};
    const p = M.prof || PROF.torhof, now = A.ctx.currentTime, beat = M.beat || 60 / p.bpm / 2;
    const q = o.quant || "takt", t = q === "sofort" ? now + 0.03 : grid(q === "schlag" ? 2 : 8);
    const vol = (o.vol != null ? o.vol : m.vol), base = p.root + (m.oct || 0), insts = [].concat(m.inst || "horn");
    M.stats.stingers["motiv:" + name] = (M.stats.stingers["motiv:" + name] || 0) + 1;
    for (const [s, st, l] of m.notes) insts.forEach((ins, k) => playNote(ins, base + s, t + st * beat, vol * (k ? 0.7 : 1), beat * l + 0.08, M.busSt, 1));
    if (m.choir) [0, 7].forEach(s => playNote("ooh", p.root + 12 + s, t, 0.06, beat * 16, M.busSt, 1));
    if (m.drum && p.dr) { hit(p.dr[0], t, 0.6, 0.85, M.busSt); kick(t, 0.5); }
    duck(0.25, t, beat * 12);
    if (o.leit) M.leit = { until: now + o.leit, notes: m.notes.filter(n => n[1] < 16).map(([s, st, l]) => ({ s: st, l, semi: s })) };
    if (o.push) M.push(o.push, 6);
    return t;
  };
  M.motifs = () => Object.keys(MOTIFS);
  /* Leitmotiv des Bosses: Blech (und das Melodie-Instrument) spielt es, danach zitiert die Melodie es eine Weile */
  M.bossMotif = (wild, at, pr) => {
    const p = M.prof; if (!p || !p.mot || !A.ok || !M.out) return 0;
    const beat = M.beat || 60 / p.bpm / 2, t = Math.max(at || 0, A.ctx.currentTime + 0.05), b = p.brass || "horn";
    for (const [s0, st, l] of p.mot) {
      const m = p.root + s0 + (wild ? 12 : 0);
      playNote(b, m, t + st * beat, wild ? 0.14 : 0.12, beat * l + 0.08, M.busSt, pr || 1);
      playNote(p.mel, m + 12, t + st * beat, 0.07, beat * l + 0.08, M.busSt, pr || 1);
    }
    if (wild) playNote("vlntrem", p.root + 24, t, 0.05, beat * 12, M.busSt, pr || 1);
    M.leit = { until: A.ctx.currentTime + 40, notes: p.mot.filter(n => n[1] < 16).map(([s0, st, l]) => ({ s: st, l, semi: s0 + (wild ? 12 : 0) })) };
    M.stats.stingers["motiv:boss"] = (M.stats.stingers["motiv:boss"] || 0) + 1;
    return t;
  };
  /* Samen-Motive für nemesis.js (ruft Z.music.motiv(seed, o) auf, bevor es selbst spielt): dieselbe Gestalt je Samen,
     aber in Tonart, Leiter und Tempo des laufenden Gebiets und auf den nächsten halben Takt gesetzt.
     o: { major, shape:[Stufen], inst, vol }. Gibt den Startzeitpunkt zurück (≠ false → nemesis.js spielt nicht selbst). */
  M.motiv = (seed, o) => {
    if (!A.ok || !M.out) return false;
    o = o || {};
    const p = M.prof || PROF.torhof, R = Z.Rng((seed >>> 0) || 7), beat = M.beat || 60 / p.bpm / 2;
    const shapes = [[0, 2, 4, 1], [0, 4, 3, 0], [4, 3, 1, 0], [0, 1, 0, -2], [0, 5, 4, 3], [0, 3, 1, -1]];
    const sh = o.shape || R.pick(shapes), rh = R.pick([[3, 1, 1, 7], [2, 2, 3, 7], [4, 1, 1, 6]]); /* Achtel, Summe 12 */
    const inst = INST[o.inst] ? o.inst : R.pick(["hornst", "pos", "hornst"]);
    const sc = o.major ? [0, 2, 4, 5, 7, 9, 11] : null;
    const dg = d => sc ? p.root + sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7) : deg(p.scale, d, p.root);
    const t0 = grid(4), vol = Math.min(0.16, o.vol || 0.14);
    let s = 0;
    sh.forEach((d, i) => {
      const t = t0 + s * beat;
      playNote(inst, dg(d) + 12, t, vol, beat * rh[i] * 1.1 + 0.08, M.busSt, 1);
      if (i === 0 || i === sh.length - 1) playNote("timpt", i ? p.root - 12 : p.root - 5, t, 0.24, beat * 3, M.busSt, 1);
      s += rh[i];
    });
    playNote("kb", p.root - 24, t0, 0.14, beat * (s + 2), M.busSt, 1);
    duck(0.25, t0, beat * s);
    M.stats.stingers["motiv:seed"] = (M.stats.stingers["motiv:seed"] || 0) + 1;
    M.heat = Math.max(M.heat || 0, 0.8);
    /* Mini-Boss/Nemesis: die Melodie zitiert das Motiv eine Weile (jede zweite Phrase) */
    M.leit = { until: A.ctx.currentTime + (o.leit || 18), notes: (() => { let q = 0; return sh.map((d, i) => { const n = { s: q, l: rh[i], semi: dg(d) - p.root }; q += rh[i]; return n; }).filter(n => n.s < 16); })() };
    return t0;
  };

  /* ---------- Einstellung „Musikdynamik“ ----------
     Wird als kleine Ergänzung in die Einstellungsseite von ui.js eingehängt (ohne ui.js zu ändern):
     nach dem Musik-Regler eine Auswahl aus / normal / stark. Gespeichert in Z.settings.musikDyn. */
  M.setDynamics = m => { if (!DYN[m]) return; Z.settings.musikDyn = m; if (Z.saveSettings) Z.saveSettings(); };
  function hookSettings() {
    const U = Z.ui; if (!U || typeof U.settings !== "function" || U.settings._musik) return;
    const orig = U.settings;
    U.settings = function () {
      const r = orig.apply(this, arguments);
      try {
        const sl = document.querySelector('#modal input[data-vol="music"]') || document.querySelector('input[data-vol="music"]');
        const lab = sl && sl.closest("label");
        if (lab && !document.querySelector("[data-musikdyn]")) {
          const de = !(Z.settings && Z.settings.lang === "en"), cur = dynMode();
          const opt = [["aus", de ? "aus" : "off"], ["normal", "normal"], ["stark", de ? "stark" : "strong"]];
          const el = document.createElement("label"); el.className = "schalter";
          el.title = de ? "Wie stark die Musik auf Kämpfe, Elites und Kill-Ketten reagiert" : "How strongly the music reacts to fights, elites and kill streaks";
          el.innerHTML = (de ? "Musikdynamik" : "Music dynamics") + ' <select data-musikdyn="1">' + opt.map(([v, n]) => '<option value="' + v + '"' + (v === cur ? " selected" : "") + ">" + n + "</option>").join("") + "</select>";
          lab.insertAdjacentElement("afterend", el);
          el.querySelector("select").onchange = e => M.setDynamics(e.target.value);
        }
      } catch (_) {}
      return r;
    };
    U.settings._musik = 1;
  }
  window.addEventListener("load", hookSettings);

  M.debug = () => ({ kampf: M.kampfA, half: M.half, bossPh: M.bossPh, wut: M.wut, ruhe: M.ruheA, id: M.id, key: M.key().name, bpm: M.prof && M.prof.bpm, tier: M.tierName, want: TIER_NAME[M.want], intensity: +M.intensity.toFixed(3), raw: +(M.raw || 0).toFixed(3), parts: Object.assign({}, M.parts), live: M.live, dyn: dynMode(), pushes: M.pushes.length });

  /* ---------- Kulisse der Bühne ---------- */
  const AMB = (Z.ambience = { biome: null, timers: [] });
  AMB.set = (B, arena) => {
    if (!A.ok) return;
    if (AMB.biome === B) return;
    AMB.biome = B; A.stopAllLoops(1.2);
    { const id = Z.level && !Z.level.hub && !Z.level.passage ? Z.level.biome : null; AMB.trim = Math.pow(10, ((id && AMBTRIM[id]) || 0) / 20); }
    if (!B || !B.amb) { AMB.timers = []; return; }
    B.amb.loops.forEach((l, i) => A.loop("amb" + i, l[0], l[1] * (arena ? 0.6 : 1), A.amb));
    AMB.timers = (B.amb.one || []).map(([pre, n, every]) => ({ pre, n, every, t: every * (0.3 + Math.random()) }));
    /* Raumklang setzt klang.js je Gebiet; ohne klang.js der alte Grundwert */
    if (!(Z.klang && Z.klang.raum)) A.setVerb(B.out ? 0.12 : 0.3);
  };
  AMB.update = (dt) => {
    if (!A.ok) return;
    /* Kulisse tritt im Kampf zurück (der Herzschlag bei wenig Leben kommt jetzt taktgenau aus der Musik) */
    const I = Math.max(M.C || 0, (M.intensity || 0) * 0.6);
    A.amb.gain.setTargetAtTime((A.fxAn && !A.fxAn() ? 0 : A.vol.amb) * (1 - 0.45 * I) * (AMB.trim || 1), A.ctx.currentTime, 0.5);
    for (const tm of AMB.timers) {
      tm.t -= dt;
      if (tm.t <= 0) { tm.t = tm.every * (0.6 + Math.random() * 0.9); const i = 1 + Math.floor(Math.random() * tm.n); const path = "amb/" + tm.pre + i + ".mp3"; if (!A.buf[path]) { A.load(path); continue; } A.play(path, { vol: 0.25 + Math.random() * 0.2, pan: (Math.random() - 0.5) * 1.6, bus: A.amb, verb: 0.8, vary: 0.1 }); }
    }
  };
})();
