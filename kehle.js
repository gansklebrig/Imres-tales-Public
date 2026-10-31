/* =====================================================================
   BARRADINS GOLDENE KEHLE – Gesangsspiel in der Taverne
   ---------------------------------------------------------------------
   Notenblöcke ziehen von rechts nach links, das Mikrofon hört zu:
   Die Tonhöhe wird direkt im Browser erkannt (McLeod-Verfahren, NSDF),
   nichts wird aufgenommen, gespeichert oder verschickt.
   - Oktave egal: Wer eine Oktave tiefer oder höher singt, trifft trotzdem.
   - Stimme einmessen: tiefster und höchster bequemer Ton → die Lieder
     werden automatisch in deine Lage verschoben.
   - Tournee (10 Bühnen entlang der Kampagne), Liederbuch, Übungsraum
     (Einsingen, Ton halten, Echos Ruf, Sprünge), Stimmgabel, Stimmbuch.
   - Begleitung mit echten Aufnahmen aus klang/ (Laute, Kontrabass, Harfe,
     Bodhrán, Flöte, Chor als leise Führstimme); Akkorde sucht das Spiel
     selbst passend zur Melodie.
   Lieder und Tournee-Texte: kehle-lieder.js
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("kehle");
  if (!root) return;
  const DATEN = window.KEHLE_LIEDER || { lieder: [], weg: [] };
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const lies = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const json = k => { try { const v = JSON.parse(lies(k) || "null"); return v && typeof v === "object" ? v : null; } catch (_) { return null; } };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =================================================================
     TEXTE
     ================================================================= */
  const TX = {
    de: {
      label: "Gesangsspiel", titel: "Barradins goldene Kehle",
      text: "Sing mit Barradin! Die Notenblöcke ziehen vorbei, dein Mikrofon hört zu – triff die Töne, und das Publikum liegt dir zu Füßen. Am besten mit Kopfhörern.",
      menueKopf: "🎙 Bühne frei, Barde!",
      menue: { tournee: "▶ Die Tournee", lieder: "🎵 Liederbuch", uebungen: "🎯 Übungsraum", gabel: "🎚 Stimmgabel", buch: "📖 Stimmbuch", einst: "⚙ Einstellungen", einmessen: "🎙 Stimme einmessen" },
      tourneeInfo: (s, r) => "★ " + s + "/" + (DATEN.weg.length * 3) + " · " + r,
      stimme: (a, b) => "Deine Stimme: " + a + " bis " + b,
      nichtGemessen: "Deine Stimme ist noch nicht eingemessen – dauert eine halbe Minute.",
      privat: "Deine Stimme wird nur hier auf deinem Gerät ausgewertet. Nichts wird aufgenommen, gespeichert oder gesendet.",
      kopfTipp: "🎧 Mit Kopfhörern hört das Mikrofon nur dich – nicht die Musik.",
      zurueck: "← Zurück", menueKnopf: "☰ Menü",
      grade: { leicht: "🍺 Leicht", mittel: "👑 Mittel", schwer: "🐉 Schwer" },
      gradInfo: { leicht: "großzügig (±75 Cent)", mittel: "mittel (±50 Cent)", schwer: "streng (±30 Cent)" },
      raenge: ["Kneipensänger", "Hafenbarde", "Schlossbarde", "Hofsänger", "Drachenbezwinger", "Goldene Kehle"],
      tourneeTitel: "Die Tournee", tourneeText: "Vom Hafen in Neverwinter bis vor Themberchauds Goldberg – jede Bühne ein Kapitel unserer Kampagne. Ab einem Stern geht's weiter.",
      gesperrt: "🔒 Erst die Bühne davor schaffen",
      liederTitel: "Liederbuch", liederText: "Alle Lieder zum freien Singen. Je mehr Noten (♪), desto anspruchsvoller.",
      bestwert: p => "Bestwert " + p + " %",
      uebTitel: "Übungsraum", uebText: "Kurze Übungen, passend zu deinem Stimmumfang.",
      ueb: {
        tonleiter: ["Einsingen", "Tonleiter rauf und runter – Do, Re, Mi … Dreimal, jedes Mal einen Ton höher."],
        halten: ["Ton halten", "Sechs lange Töne auf „Oh“. Ruhig atmen, gerade halten, nicht wackeln."],
        echo: ["Echos Ruf", "Echo spielt auf der Flöte vor, du singst nach – ganz ohne Führstimme."],
        spruenge: ["Sprünge", "Terz, Quinte, Oktave: Töne sauber treffen, auch wenn sie weit weg liegen."],
        gabel: ["Stimmgabel", "Zeigt live, welchen Ton du singst – und wie viele Cent du daneben liegst."]
      },
      silben: { tonleiter: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si", "Do"], halten: "Oh", echo: "Lu", spruenge: "La", vor: "♪" },
      echoZeile: "♪ Echo spielt vor …",
      vorher: { ort: "Bühne", publikum: "Publikum", sg: sg => "Schwierigkeitsgrad " + sg, tonart: "Tonlage", auto: "angepasst", fuehr: "Führstimme", fuehrInfo: "Ein leiser Chor singt die Melodie mit.",
        fuehrAus: "Ohne Kopfhörer bleibt die Führstimme aus – sonst hört das Mikrofon den Chor statt dich.", los: "▶ Los!", laedt: "🎻 Instrumente werden gestimmt …",
        messen: "Erst Stimme einmessen", ohne: "Ohne einmessen singen", messenTipp: "Tipp: Miss zuerst deine Stimme ein – dann liegen die Lieder genau in deiner Lage.", deutsch: "" },
      spiel: { pause: "Pause", pausiert: "Pausiert", weiter: "▶ Weiter", neu: "↻ Von vorn", aufhoeren: "Aufhören", zaehlen: "Gleich geht's los …", leise: "Ich höre dich nicht – näher ans Mikrofon?",
        urteil: { perfekt: "Meisterhaft!", gut: "Gut!", knapp: "Knapp …", daneben: "Daneben!" }, serie: n => n + "× in Folge!" },
      erg: { punkte: "Punkte", getroffen: (a, b) => a + " von " + b + " Tönen getroffen", genau: p => p + " % Treffsicherheit", rekord: "Neuer Bestwert!", bisher: p => "Bisher bester Wert: " + p + " %",
        wurf: (w, b, s, sg) => "Auftrittswurf: W20 " + w + " + " + b + " Kehle = " + s + " gegen SG " + sg, krit: "Natürliche 20!", patzer: "Natürliche 1 …",
        nochmal: "↻ Nochmal", naechste: "▶ Nächste Bühne", tournee: "Zur Tournee", neuFrei: "Neue Bühne freigespielt!", zuTief: c => "Du lagst im Schnitt " + c + " Cent zu tief.",
        zuHoch: c => "Du lagst im Schnitt " + c + " Cent zu hoch.", mittig: "Im Schnitt fast genau auf dem Ton – stark!", stumm: "Ich habe kaum etwas gehört. Ist das Mikrofon an?" },
      stimmen: [
        ["Das war … mutig. Rex hat sich die Ohren zugehalten. Mit beiden Pfoten.", "Ich habe Goblins sterben hören, die sauberer klangen. Und ich war dabei.", "Echo fragt, ob du Gundren kennst. Er will das Thema wechseln."],
        ["Ein paar Töne haben getroffen. Die anderen sind noch auf dem Weg.", "Das Publikum ist höflich. Sehr höflich. Verdächtig höflich.", "Friedrich sagt, es war nicht schlecht. Friedrich lügt nie. Normalerweise."],
        ["Ordentlich! Ein paar Leute wippen mit, einer summt sogar.", "Nicht schlecht! Echo hat nur einmal die Augen verdreht.", "Solide. Der Wirt schmeißt mich nicht raus – ein Erfolg!"],
        ["Die Krüge gehen hoch! Das war ein richtiger Auftritt.", "Sauber gesungen – Friedrich nickt, und Friedrich nickt selten.", "Rex heult die zweite Stimme. Das ist bei ihm ein Lob."],
        ["Meisterlich! Selbst Ezekiel hat kurz mit dem Fuß gewippt.", "Zugaberufe! Ich verbeuge mich. Einmal, zweimal … ach, dauerhaft.", "Das Publikum wirft Rosen. Und einen Hering. Ich nehme beides."],
        ["Eine goldene Kehle! Man wird Lieder über dieses Lied singen.", "Natürliche 20 in Stimme! Die Götter lehnen sich vor, um besser zu hören.", "Selbst Imre legt den Würfel zur Seite und applaudiert."]
      ],
      einmessen: { titel: "Stimme einmessen", still: "Einen Moment ganz still sein – ich höre, wie laut es bei dir ist …",
        tief: "Sing einen tiefen Ton, der sich noch bequem anfühlt – auf „Aaa“ – und halte ihn.", hoch: "Und jetzt einen hohen, bequemen Ton. Nicht quetschen!",
        halten: "Gut, halten …", fertig: (a, b, n) => "Fertig! Dein Bereich: " + a + " bis " + b + " (" + n + " Halbtöne).", zuEng: "Das liegt sehr eng beieinander – versuch's ruhig noch einmal mit mehr Abstand.",
        nochmal: "↻ Nochmal", fertigKnopf: "✔ Übernehmen", nichts: "Ich höre noch nichts – sing ruhig etwas lauter." },
      gabel: { titel: "Stimmgabel", leer: "Sing einen Ton …", vorspielen: "🔔 Ton vorspielen", hz: f => f + " Hz", cent: c => (c > 0 ? "+" : "") + c + " Cent", genau: "genau!", tief: "zu tief", hoch: "zu hoch" },
      buch: { titel: "Stimmbuch", umfang: "Stimmumfang", keinUmfang: "noch nicht eingemessen", auftritte: "Letzte Auftritte", keine: "Noch keine Auftritte – auf geht's!",
        tendenz: "Wo du danebenliegst", zuWenig: "Sing noch ein paar Lieder, dann sehe ich mehr.", ton: (n, c) => n + ": " + (Math.abs(c) < 8 ? "fast genau" : Math.abs(c) + " Cent " + (c < 0 ? "zu tief" : "zu hoch")),
        schnitt: c => "Insgesamt: " + (Math.abs(c) < 8 ? "fast genau auf dem Ton" : "im Schnitt " + Math.abs(c) + " Cent " + (c < 0 ? "zu tief" : "zu hoch")), loeschen: "Stimmbuch leeren", geloescht: "Geleert." },
      einst: { titel: "Einstellungen", grad: "Schwierigkeit", kopf: "Kopfhörer", kopfJa: "🎧 Ja", kopfNein: "🔈 Nein", fuehr: "Führstimme", an: "An", aus: "Aus",
        laut: "Lautstärke der Musik", versatz: "Verzögerung ausgleichen", versatzInfo: "Mit Bluetooth-Kopfhörern kommt die Musik später an. Liegen deine Töne immer etwas hinter den Blöcken, hier nach rechts schieben.", ms: v => v + " ms" },
      mikro: { titel: "Barradin braucht dein Mikrofon", text: "Damit das Spiel hört, welchen Ton du singst, fragt dein Browser gleich nach dem Mikrofon. Ausgewertet wird nur die Tonhöhe, direkt auf deinem Gerät – nichts wird aufgenommen oder verschickt.",
        knopf: "🎙 Mikrofon erlauben", verweigert: "Das Mikrofon ist blockiert. Erlaube es in den Seiteneinstellungen deines Browsers (Schloss-Symbol neben der Adresse) und versuch es noch einmal.",
        fehlt: "Dieser Browser kann hier leider nicht aufs Mikrofon zugreifen.", belegt: "Das Mikrofon wird gerade von einer anderen App benutzt." },
      tonNamen: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B", "H"]
    },
    en: {
      label: "Singing game", titel: "Barradin's Golden Throat",
      text: "Sing with Barradin! The note blocks scroll by and your microphone listens – hit the notes and the crowd is yours. Best with headphones.",
      menueKopf: "🎙 The stage is yours, bard!",
      menue: { tournee: "▶ The Tour", lieder: "🎵 Songbook", uebungen: "🎯 Practice room", gabel: "🎚 Tuning fork", buch: "📖 Voice book", einst: "⚙ Settings", einmessen: "🎙 Measure my voice" },
      tourneeInfo: (s, r) => "★ " + s + "/" + (DATEN.weg.length * 3) + " · " + r,
      stimme: (a, b) => "Your voice: " + a + " to " + b,
      nichtGemessen: "Your voice hasn't been measured yet – takes half a minute.",
      privat: "Your voice is analysed only here on your device. Nothing is recorded, stored or sent.",
      kopfTipp: "🎧 With headphones the microphone hears only you – not the music.",
      zurueck: "← Back", menueKnopf: "☰ Menu",
      grade: { leicht: "🍺 Easy", mittel: "👑 Medium", schwer: "🐉 Hard" },
      gradInfo: { leicht: "generous (±75 cents)", mittel: "medium (±50 cents)", schwer: "strict (±30 cents)" },
      raenge: ["Pub singer", "Harbour bard", "Castle bard", "Court singer", "Dragon tamer", "Golden Throat"],
      tourneeTitel: "The Tour", tourneeText: "From the harbour of Neverwinter to Themberchaud's mountain of gold – every stage a chapter of our campaign. One star unlocks the next.",
      gesperrt: "🔒 Clear the stage before first",
      liederTitel: "Songbook", liederText: "Every song for free singing. More notes (♪) means harder. The lyrics are German – Barradin insists. Singing along on „la“ counts too.",
      bestwert: p => "Best " + p + " %",
      uebTitel: "Practice room", uebText: "Short exercises that fit your vocal range.",
      ueb: {
        tonleiter: ["Warm-up", "Scale up and down – do, re, mi … three times, one step higher each time."],
        halten: ["Hold the note", "Six long notes on „oh“. Breathe calmly, keep it steady, no wobbling."],
        echo: ["Echo's call", "Echo plays a phrase on his flute, you sing it back – no guide voice."],
        spruenge: ["Leaps", "Third, fifth, octave: hit notes cleanly even when they're far apart."],
        gabel: ["Tuning fork", "Shows live which note you're singing – and how many cents you're off."]
      },
      silben: { tonleiter: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do"], halten: "Oh", echo: "Lu", spruenge: "La", vor: "♪" },
      echoZeile: "♪ Echo plays first …",
      vorher: { ort: "Stage", publikum: "Audience", sg: sg => "Difficulty class " + sg, tonart: "Key", auto: "adjusted", fuehr: "Guide voice", fuehrInfo: "A soft choir sings the melody along.",
        fuehrAus: "Without headphones the guide voice stays off – otherwise the microphone hears the choir instead of you.", los: "▶ Go!", laedt: "🎻 Tuning the instruments …",
        messen: "Measure my voice first", ohne: "Sing without measuring", messenTipp: "Tip: measure your voice first – then the songs sit right in your range.", deutsch: "Lyrics in German – singing along on „la“ counts too." },
      spiel: { pause: "Pause", pausiert: "Paused", weiter: "▶ Continue", neu: "↻ Restart", aufhoeren: "Stop", zaehlen: "Here we go …", leise: "I can't hear you – closer to the mic?",
        urteil: { perfekt: "Masterful!", gut: "Good!", knapp: "Close …", daneben: "Missed!" }, serie: n => n + " in a row!" },
      erg: { punkte: "Points", getroffen: (a, b) => a + " of " + b + " notes hit", genau: p => p + " % accuracy", rekord: "New best!", bisher: p => "Previous best: " + p + " %",
        wurf: (w, b, s, sg) => "Performance check: d20 " + w + " + " + b + " throat = " + s + " vs DC " + sg, krit: "Natural 20!", patzer: "Natural 1 …",
        nochmal: "↻ Again", naechste: "▶ Next stage", tournee: "To the tour", neuFrei: "New stage unlocked!", zuTief: c => "On average you were " + c + " cents flat.",
        zuHoch: c => "On average you were " + c + " cents sharp.", mittig: "On average almost spot on – great!", stumm: "I barely heard anything. Is the microphone on?" },
      stimmen: [
        ["That was … brave. Rex covered his ears. With both paws.", "I've heard goblins die more cleanly. And I was there.", "Echo asks if you know Gundren. He wants to change the subject."],
        ["A few notes landed. The others are still on their way.", "The audience is polite. Very polite. Suspiciously polite.", "Friedrich says it wasn't bad. Friedrich never lies. Usually."],
        ["Decent! A few people are tapping along, one is even humming.", "Not bad! Echo only rolled his eyes once.", "Solid. The innkeeper isn't throwing me out – a success!"],
        ["Tankards up! That was a real performance.", "Cleanly sung – Friedrich nods, and Friedrich rarely nods.", "Rex howls the harmony. From him, that's praise."],
        ["Masterful! Even Ezekiel tapped his foot for a moment.", "Encore! I bow. Once, twice … oh, permanently.", "The crowd throws roses. And a herring. I'll take both."],
        ["A golden throat! They'll sing songs about this song.", "Natural 20 on voice! The gods lean in to hear better.", "Even Imre puts down the die and applauds."]
      ],
      einmessen: { titel: "Measure your voice", still: "Stay quiet for a moment – I'm listening to how loud it is around you …",
        tief: "Sing a low note that still feels comfortable – on „aah“ – and hold it.", hoch: "Now a high, comfortable note. Don't squeeze!",
        halten: "Good, hold it …", fertig: (a, b, n) => "Done! Your range: " + a + " to " + b + " (" + n + " semitones).", zuEng: "Those are very close together – feel free to try again with more distance.",
        nochmal: "↻ Again", fertigKnopf: "✔ Use this", nichts: "I can't hear anything yet – sing a little louder." },
      gabel: { titel: "Tuning fork", leer: "Sing a note …", vorspielen: "🔔 Play the note", hz: f => f + " Hz", cent: c => (c > 0 ? "+" : "") + c + " cents", genau: "spot on!", tief: "flat", hoch: "sharp" },
      buch: { titel: "Voice book", umfang: "Vocal range", keinUmfang: "not measured yet", auftritte: "Recent performances", keine: "No performances yet – off you go!",
        tendenz: "Where you drift", zuWenig: "Sing a few more songs, then I'll see more.", ton: (n, c) => n + ": " + (Math.abs(c) < 8 ? "almost spot on" : Math.abs(c) + " cents " + (c < 0 ? "flat" : "sharp")),
        schnitt: c => "Overall: " + (Math.abs(c) < 8 ? "almost spot on" : "on average " + Math.abs(c) + " cents " + (c < 0 ? "flat" : "sharp")), loeschen: "Clear voice book", geloescht: "Cleared." },
      einst: { titel: "Settings", grad: "Difficulty", kopf: "Headphones", kopfJa: "🎧 Yes", kopfNein: "🔈 No", fuehr: "Guide voice", an: "On", aus: "Off",
        laut: "Music volume", versatz: "Latency compensation", versatzInfo: "With Bluetooth headphones the music arrives later. If your notes always trail behind the blocks, move this to the right.", ms: v => v + " ms" },
      mikro: { titel: "Barradin needs your microphone", text: "So the game can hear which note you sing, your browser will ask for the microphone. Only the pitch is analysed, right on your device – nothing is recorded or sent.",
        knopf: "🎙 Allow microphone", verweigert: "The microphone is blocked. Allow it in your browser's site settings (lock icon next to the address) and try again.",
        fehlt: "This browser can't access the microphone here.", belegt: "The microphone is being used by another app." },
      tonNamen: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
    }
  };
  const T = () => TX[sprache()];

  /* =================================================================
     EINSTELLUNGEN UND SPEICHER
     ================================================================= */
  const K = { einst: "imres-kehle-einst", weg: "imres-kehle-weg", rekorde: "imres-kehle-rekorde", buch: "imres-kehle-buch" };
  const E = Object.assign({ grad: "mittel", kopf: true, fuehr: true, laut: .8, versatz: 0, tief: null, hoch: null, boden: null, trans: {} }, json(K.einst) || {});
  if (!E.trans || typeof E.trans !== "object") E.trans = {};
  if (!["leicht", "mittel", "schwer"].includes(E.grad)) E.grad = "mittel";
  const einstSpeichern = () => schreib(K.einst, JSON.stringify(E));
  const TOL = { leicht: 75, mittel: 50, schwer: 30 };
  const gemessen = () => typeof E.tief === "number" && typeof E.hoch === "number" && E.hoch > E.tief;
  function wegLesen() { const w = json(K.weg) || {}; return { frei: w.frei | 0, sterne: Array.isArray(w.sterne) ? w.sterne.map(x => klemm(x | 0, 0, 3)) : [] }; }
  const wegSchreiben = w => schreib(K.weg, JSON.stringify(w));
  const rekorde = () => json(K.rekorde) || {};
  function buchLesen() { const b = json(K.buch) || {}; return { toene: b.toene && typeof b.toene === "object" ? b.toene : {}, verlauf: Array.isArray(b.verlauf) ? b.verlauf : [] }; }

  /* =================================================================
     MUSIK: Tonleitern, Rhythmus-Muster, Lieder bauen, Akkorde finden
     ================================================================= */
  const SKALA = { dur: [0, 2, 4, 5, 7, 9, 11], moll: [0, 2, 3, 5, 7, 8, 10] };
  /* Silbenlängen in Schlägen; negativ = Pause. Jedes Muster füllt ganze Takte. */
  const MUSTER = {
    j8: [-1, 1, 1, 1, 1, 1, 1, 1, 3, -1], j9: [-1, 1, 1, 1, 1, 1, 1, 1, 2, 1, -1], j10: [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, -1], j11: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1],
    j7f: [-1, 1, 1, 1, 1, 1, 1, 1], t7: [1, 1, 1, 1, 1, 1, 2], t8: [1, 1, 1, 1, 1, 1, 1, 1],
    w8: [-2, 1, 2, 1, 2, 1, 2, 1, 3], w9: [-2, 1, 2, 1, 2, 1, 2, 1, 2, 1], w12: [-1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3], w11: [-2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
    w8a: [-2, 1, 1, 1, 1, 1, 1, 1, 3], wt7: [2, 1, 2, 1, 2, 1, 3], wt8: [2, 1, 2, 1, 2, 1, 2, 1]
  };
  function stufe(tok, modus) {
    const m = /^([#b]?)(\d)([',]*)$/.exec(tok); if (!m) return 0;
    let s = SKALA[modus][(+m[2] - 1) % 7] + (m[1] === "#" ? 1 : m[1] === "b" ? -1 : 0);
    for (const c of m[3]) s += c === "'" ? 12 : -12;
    return s;
  }
  /* Text einer Zeile in Silben: Wörter durch Leerzeichen, Silben durch |. Satzzeichen ohne Buchstaben hängen am Wort davor. */
  function silbenAus(zeile) {
    const out = [];
    zeile.split(/\s+/).filter(Boolean).forEach(w => {
      if (!/[A-Za-zÄÖÜäöüß0-9]/.test(w)) { if (out.length) out[out.length - 1].t += " " + w; return; }
      const teile = w.split("|");
      teile.forEach((t, i) => out.push({ t, ende: i === teile.length - 1 }));
    });
    return out;
  }
  const INTRO_TAKTE = 2;
  /* Ein Lied aus kehle-lieder.js in eine Notenliste verwandeln */
  function liedBauen(lied) {
    const takt = lied.takt || 4, intro = INTRO_TAKTE * takt;
    let b = intro;
    const noten = [], zeilen = [];
    lied.folge.forEach(([teil, texte]) => {
      const mel = lied.teile[teil] || [];
      texte.forEach((text, i) => {
        const [mName, toeneStr] = String(mel[i] || "").split(":");
        const muster = MUSTER[(mName || "").trim()] || [];
        const toene = (toeneStr || "").trim().split(/\s+/);
        const silben = silbenAus(text);
        const z = { noten: [], b0: b, phrase: true };
        let k = 0;
        muster.forEach(d => {
          if (d < 0) { b += -d; return; }
          const s = silben[k] || { t: "", ende: true };
          noten.push({ b, d, s: stufe(toene[k] || "1", lied.modus), silbe: s.t, ende: s.ende, zeile: zeilen.length });
          z.noten.push(noten.length - 1); k++; b += d;
        });
        z.b1 = b; zeilen.push(z);
      });
    });
    return fertigBauen({ id: lied.id, titel: lied.titel[sprache()] || lied.titel.de, takt, bpm: lied.bpm, modus: lied.modus, stil: lied.stil, grund: 60, noten, zeilen, intro, ende: b });
  }
  function fertigBauen(st) {
    st.spb = 60 / st.bpm;
    st.takte = Math.ceil(st.ende / st.takt) + 1; /* + ein Schlusstakt */
    st.ende = st.takte * st.takt;
    const sing = st.noten.filter(n => !n.vor);
    const summe = sing.reduce((a, n) => a + n.d, 0) || 1;
    sing.forEach(n => { n.gewicht = 10000 * n.d / summe; });
    st.noten.forEach((n, i) => { n.i = i; });
    st.min = Math.min(...st.noten.map(n => n.s)); st.max = Math.max(...st.noten.map(n => n.s));
    st.akkorde = harmonisieren(st);
    return st;
  }

  /* Akkorde je Takt: passend zur Melodie (Viterbi über die Takte) */
  const KANDIDATEN = {
    dur: [{ n: "I", r: 0, q: "d", p: .35 }, { n: "ii", r: 2, q: "m", p: 0 }, { n: "iii", r: 4, q: "m", p: -.25 }, { n: "IV", r: 5, q: "d", p: .2 }, { n: "V", r: 7, q: "d", p: .25, sept: true }, { n: "vi", r: 9, q: "m", p: .1 }],
    moll: [{ n: "i", r: 0, q: "m", p: .35 }, { n: "III", r: 3, q: "d", p: .1 }, { n: "iv", r: 5, q: "m", p: .2 }, { n: "V", r: 7, q: "d", p: .25, sept: true }, { n: "VI", r: 8, q: "d", p: .15 }, { n: "VII", r: 10, q: "d", p: .1 }, { n: "v", r: 7, q: "m", p: -.3 }]
  };
  const DREIKLANG = { d: [0, 4, 7], m: [0, 3, 7] };
  function passt(kand, s) {
    const iv = ((s - kand.r) % 12 + 12) % 12;
    if (DREIKLANG[kand.q].includes(iv)) return 1;
    if (kand.sept && iv === 10) return .45;
    if (iv === 2 || iv === 9) return -.25;
    return -.9;
  }
  function harmonisieren(st) {
    const K2 = KANDIDATEN[st.modus] || KANDIDATEN.dur, n = st.takte, L = st.takt;
    const proTakt = Array.from({ length: n }, () => []);
    st.noten.forEach(no => {
      for (let t = Math.floor(no.b / L); t <= Math.floor((no.b + no.d - .001) / L) && t < n; t++) {
        const a = Math.max(no.b, t * L), e = Math.min(no.b + no.d, (t + 1) * L);
        if (e > a) proTakt[t].push({ s: no.s, d: e - a, start: a - t * L, eigen: a === no.b });
      }
    });
    /* Phrasenende: Takt, in dem eine Zeile aufhört */
    const phrase = new Set(st.zeilen.map(z => Math.floor((z.noten.length ? st.noten[z.noten[z.noten.length - 1]].b : z.b0) / L)));
    const kosten = proTakt.map((liste, t) => K2.map(k => {
      let w = k.p;
      liste.forEach(x => { const lage = x.start === 0 ? 1.6 : Number.isInteger(x.start) ? 1.1 : .6; w += x.d * (x.eigen ? lage : .8) * passt(k, x.s); });
      if (phrase.has(t) && liste.length && k.r === 0) { const letzte = liste[liste.length - 1]; if ([0, 3, 4, 7].includes(((letzte.s % 12) + 12) % 12)) w += .7; }
      return w;
    }));
    const tonika = 0;
    const best = [], vorg = [];
    for (let t = 0; t < n; t++) {
      best[t] = []; vorg[t] = [];
      K2.forEach((k, j) => {
        let lokal = kosten[t][j];
        if (!proTakt[t].length) lokal = j === tonika ? .5 : -.2; /* leere Takte: eher Tonika (Vorspiel) */
        if (t === n - 1) lokal = j === tonika ? 5 : -5; /* Schluss immer auf der Tonika */
        if (t === 0) { best[t][j] = lokal + (j === tonika ? 1 : 0); vorg[t][j] = -1; return; }
        let bw = -1e9, bi = 0;
        K2.forEach((k0, i) => {
          let w = best[t - 1][i];
          if (i === j) w += .12;
          if (k0.r === 7 && k.r === 0) w += .45;
          if ((k0.r === 5 || k0.r === 2) && k.r === 7) w += .2;
          if (k0.r === 7 && k.r === 9) w += .1;
          if (w > bw) { bw = w; bi = i; }
        });
        best[t][j] = bw + lokal; vorg[t][j] = bi;
      });
    }
    let j = 0; best[n - 1].forEach((v, i) => { if (v > best[n - 1][j]) j = i; });
    const weg = [];
    for (let t = n - 1; t >= 0; t--) { weg[t] = K2[j]; j = vorg[t][j]; }
    /* Vorspiel: Akkord des ersten Liedtakts vorwegnehmen ist unschön – Tonika */
    return weg.map(k => ({ r: k.r, q: k.q, sept: !!k.sept }));
  }

  /* Übungen passend zum Stimmumfang erzeugen (Töne in Halbtönen über „grund“) */
  function uebungBauen(art) {
    const tx = T();
    const lo = gemessen() ? E.tief : 50, hi = gemessen() ? E.hoch : 64;
    const spanne = Math.max(5, hi - lo);
    const grund = lo + Math.min(2, Math.max(0, spanne - 12));
    const st = { id: "u-" + art, titel: tx.ueb[art][0], modus: "dur", grund, noten: [], zeilen: [], fest: true, uebung: art };
    let b = 0;
    const zeile = () => { const z = { noten: [], b0: b }; st.zeilen.push(z); return z; };
    const note = (z, s, d, silbe, vor) => { st.noten.push({ b, d, s, silbe, ende: true, zeile: st.zeilen.length - 1, vor: !!vor }); z.noten.push(st.noten.length - 1); b += d; };
    const pause = d => { b += d; };
    if (art === "tonleiter") {
      Object.assign(st, { takt: 4, bpm: 92, stil: "ballade" }); b = INTRO_TAKTE * 4; st.intro = b;
      const leiter = [0, 2, 4, 5, 7, 9, 11, 12], hoch = spanne >= 13 ? 8 : spanne >= 8 ? 5 : 4;
      const runden = spanne >= 16 ? 3 : spanne >= 14 ? 2 : 1;
      for (let r = 0; r < runden; r++) {
        const off = r * 2, auf = leiter.slice(0, hoch), silben = tx.silben.tonleiter;
        let z = zeile(); auf.forEach((s, i) => note(z, s + off, i === auf.length - 1 ? 2 : 1, silben[i])); pause((4 - (b % 4)) % 4);
        z = zeile(); auf.slice().reverse().forEach((s, i) => note(z, s + off, i === auf.length - 1 ? 3 : 1, silben[auf.length - 1 - i])); pause(((4 - (b % 4)) % 4) + 4);
      }
    } else if (art === "halten") {
      Object.assign(st, { takt: 4, bpm: 72, stil: "hymne" }); b = INTRO_TAKTE * 4; st.intro = b;
      const folge = [0, 2, 4, 5, 7, 4].map(s => Math.min(s, spanne - 1));
      folge.forEach(s => { const z = zeile(); note(z, s, 4, tx.silben.halten); pause(4); });
    } else if (art === "echo") {
      Object.assign(st, { takt: 4, bpm: 96, stil: "harfe", ohneFuehrung: true }); b = INTRO_TAKTE * 4; st.intro = b;
      const penta = [0, 2, 4, 7, 9, 12].filter(s => s <= spanne);
      for (let r = 0; r < 6; r++) {
        const laenge = r < 2 ? 3 : r < 4 ? 4 : 5;
        const phrase = []; let idx = Math.floor(Math.random() * Math.min(3, penta.length));
        for (let i = 0; i < laenge; i++) { phrase.push(penta[idx]); idx = klemm(idx + zufall([-2, -1, 1, 1, 2]), 0, penta.length - 1); }
        const daue = phrase.map((_, i) => i === laenge - 1 ? 2 : laenge === 5 && i % 2 ? .5 : 1);
        const gesamt = daue.reduce((a, x) => a + x, 0), takte = Math.ceil(gesamt / 4);
        let z = zeile(); z.vor = true; phrase.forEach((s, i) => note(z, s, daue[i], tx.silben.vor, true)); pause(takte * 4 - gesamt);
        z = zeile(); phrase.forEach((s, i) => note(z, s, daue[i], tx.silben.echo)); pause(takte * 4 - gesamt);
      }
    } else {
      Object.assign(st, { takt: 4, bpm: 80, stil: "ballade" }); b = INTRO_TAKTE * 4; st.intro = b;
      const okt = spanne >= 12 ? 12 : 7;
      const figuren = [[0, 4, 7, okt === 12 ? 12 : 7, 7, 4, 0], [0, 7, 0, 5, 0, 4], [0, 9, 7, 4, 5, 2, 0], [0, okt, 7, 9, 4, 5, 0]];
      figuren.forEach(f => {
        const z = zeile();
        f.forEach((s, i) => note(z, Math.min(s, spanne), i === f.length - 1 ? 2 : 1, tx.silben.spruenge));
        pause(((4 - (b % 4)) % 4) + 4);
      });
    }
    st.ende = b;
    return fertigBauen(st);
  }

  const tonName = m => { const r = Math.round(m); return T().tonNamen[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1); };
  const tonKlasse = m => T().tonNamen[((Math.round(m) % 12) + 12) % 12];
  /* Wie weit soll ein Lied verschoben werden, damit es in der eingemessenen Lage liegt? */
  function verschiebung(st) {
    if (st.fest) return 0;
    const mitte = gemessen() ? (E.tief + E.hoch) / 2 : 57;
    const auto = Math.round(mitte - (st.grund + (st.min + st.max) / 2));
    return auto + (E.trans[st.id] | 0);
  }

  /* =================================================================
     KLANG: echte Aufnahmen aus klang/, berechneter Ersatz wenn sie fehlen
     ================================================================= */
  let ctx = null, ausgang = null, bus = null;
  const KARTE = {
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84],
    kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59],
    harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101],
    fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96],
    ooh: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78]
  };
  const basis = (() => { const sk = document.querySelector('script[src*="kehle.js"]'); return sk ? sk.src.replace(/kehle\.js.*$/, "klang/") : "klang/"; })();
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC({ latencyHint: "interactive" });
      const komp = ctx.createDynamicsCompressor(); komp.threshold.value = -14; komp.ratio.value = 3;
      ausgang = ctx.createGain(); ausgang.gain.value = E.laut * E.laut;
      ausgang.connect(komp); komp.connect(ctx.destination);
    }
    if (ctx.state === "suspended" || ctx.state === "interrupted") { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    return ctx;
  }
  const lautSetzen = () => { if (ausgang) ausgang.gain.setTargetAtTime(E.laut * E.laut, ctx.currentTime, .05); };
  const naechste = (g, m) => KARTE[g].reduce((b, x) => Math.abs(x - m) < Math.abs(b - m) ? x : b);
  const probeName = (g, m) => KARTE[g] ? g + "_" + naechste(g, m) : g;
  const puffer = new Map(), laedt = new Map();
  function probeLaden(name) {
    if (puffer.has(name)) return Promise.resolve(puffer.get(name));
    if (laedt.has(name)) return laedt.get(name);
    const c = ctx;
    const pr = fetch(basis + encodeURIComponent(name) + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(ab => new Promise((res, rej) => { const x = c.decodeAudioData(ab, res, rej); if (x && x.catch) x.catch(rej); }))
      .then(b => {
        const d = b.getChannelData(0); let mx = 0, i = 0;
        for (let k = 0; k < d.length; k += 4) mx = Math.max(mx, Math.abs(d[k]));
        while (i < d.length && Math.abs(d[i]) < mx * .02) i++;
        b._start = Math.max(0, i - b.sampleRate * .003) / b.sampleRate;
        puffer.set(name, b); return b;
      }).catch(() => { laedt.delete(name); return null; });
    laedt.set(name, pr); return pr;
  }
  function spielen(g, m, z, laut, dauer, ziel) {
    const name = probeName(g, m), b = puffer.get(name), out = ziel || bus || ausgang;
    if (!b) return ersatz(g, m, z, laut, dauer, out);
    const src = ctx.createBufferSource(), gn = ctx.createGain();
    src.buffer = b; if (KARTE[g]) src.playbackRate.value = Math.pow(2, (m - naechste(g, m)) / 12);
    const lang = (b.duration - b._start) / src.playbackRate.value;
    const d = Math.min(lang, dauer || lang), aus = Math.min(.25, d * .4);
    gn.gain.setValueAtTime(0, z); gn.gain.linearRampToValueAtTime(laut, z + (g === "ooh" || g === "fl" ? .05 : .004));
    if (d < lang) { gn.gain.setValueAtTime(laut, Math.max(z + .05, z + d - aus)); gn.gain.linearRampToValueAtTime(0, z + d); }
    src.connect(gn); gn.connect(out); src.start(z, b._start); src.stop(z + d + .05);
  }
  /* Ersatzklang: gezupft (Dreieck mit Abklingen) oder gesungen/geblasen (Sinus mit Vibrato) */
  function ersatz(g, m, z, laut, dauer, out) {
    if (g === "bodh1" || g === "bodh2" || g === "holz1" || g === "holz2") {
      const o = ctx.createOscillator(), gn = ctx.createGain(), hoch = g.startsWith("holz");
      o.frequency.setValueAtTime(hoch ? 900 : 120, z); o.frequency.exponentialRampToValueAtTime(hoch ? 700 : 55, z + .1);
      gn.gain.setValueAtTime(laut * .8, z); gn.gain.exponentialRampToValueAtTime(.001, z + (hoch ? .06 : .25));
      o.connect(gn); gn.connect(out); o.start(z); o.stop(z + .3); return;
    }
    const f = 440 * Math.pow(2, (m - 69) / 12), o = ctx.createOscillator(), gn = ctx.createGain();
    const weich = g === "ooh" || g === "fl", d = dauer || 1;
    o.type = weich ? "sine" : "triangle"; o.frequency.value = f;
    gn.gain.setValueAtTime(0, z);
    if (weich) { gn.gain.linearRampToValueAtTime(laut * .6, z + .06); gn.gain.setValueAtTime(laut * .6, z + Math.max(.07, d - .1)); gn.gain.linearRampToValueAtTime(0, z + d); }
    else { gn.gain.linearRampToValueAtTime(laut * .7, z + .005); gn.gain.exponentialRampToValueAtTime(.001, z + Math.min(2, d + .6)); }
    o.connect(gn); gn.connect(out); o.start(z); o.stop(z + d + .7);
  }

  /* Begleitung: Ereignisliste { z (Sekunden ab Liedbeginn), g (Instrument), m, laut, dauer } */
  const lage = (s, von) => { let m = s; while (m < von) m += 12; while (m >= von + 12) m -= 12; return m; };
  function begleitung(st, schieb) {
    const ev = [], L = st.takt, spb = st.spb, g0 = st.grund + schieb;
    const add = (b, g, m, laut, dauerSchlaege) => ev.push({ z: b * spb, g, m, laut, dauer: dauerSchlaege ? dauerSchlaege * spb : 0 });
    /* Einzählen: Holzblock auf jeden Schlag des Vorspiels */
    for (let b = 0; b < st.intro; b++) add(b, b % L === 0 ? "holz2" : "holz1", 0, b % L === 0 ? .45 : .3);
    const schnell = st.bpm >= 140;
    st.akkorde.forEach((a, t) => {
      const b0 = t * L, letzter = t === st.akkorde.length - 1;
      const r = g0 + a.r, terz = a.q === "d" ? 4 : 3;
      const bass = lage(r, 36), akk = [lage(r, 52), lage(r + terz, 52), lage(r + 7, 52)].sort((x, y) => x - y);
      const tief = lage(r, 40), hoch = [lage(r, 55), lage(r + terz, 55), lage(r + 7, 55), lage(r, 55) + 12];
      const vorspiel = b0 < st.intro;
      const leise = vorspiel ? .7 : 1;
      if (letzter) {
        add(b0, "kb", bass, .45, L); [0, 1, 2].forEach(i => add(b0 + i * .04 / spb, st.stil === "harfe" || st.stil === "hymne" ? "harfe" : "gitarre", akk[i], .22, L));
        add(b0, "harfe", lage(r, 64), .15, L); return;
      }
      switch (st.stil) {
        case "polka":
          if (L === 4) {
            add(b0, "kb", bass, .5 * leise, 1); add(b0 + 2, "kb", lage(r + 7, 36), .42 * leise, 1);
            [1, 3].forEach(s => akk.forEach((m, i) => add(b0 + s + i * .012 / spb, "gitarre", m, .17 * leise, .6)));
            add(b0, "bodh1", 0, .42 * leise); add(b0 + 2, "bodh2", 0, .3 * leise);
            break;
          } /* fall through: 3/4 wie Walzer */
        case "walzer":
          add(b0, "kb", bass, .5 * leise, 1);
          [1, 2].forEach(s => akk.forEach((m, i) => add(b0 + s + i * .012 / spb, "gitarre", m, .16 * leise, .8)));
          if (schnell) add(b0, "bodh2", 0, .25 * leise);
          break;
        case "marsch":
          [0, 1, 2, 3].forEach(s => add(b0 + s, "kb", s === 2 ? lage(r + 7, 36) : bass, (s === 0 ? .5 : .36) * leise, .9));
          [0, 1, 2, 3].forEach(s => akk.forEach((m, i) => add(b0 + s + i * .01 / spb, "gitarre", m, (s % 2 ? .12 : .16) * leise, .4)));
          add(b0, "bodh1", 0, .55 * leise); add(b0 + 1, "bodh2", 0, .28 * leise); add(b0 + 2, "bodh1", 0, .42 * leise); add(b0 + 3, "bodh2", 0, .28 * leise); add(b0 + 3.5, "bodh2", 0, .22 * leise);
          break;
        case "harfe":
          add(b0, "kb", bass, .3 * leise, L);
          for (let s = 0; s < L; s++) add(b0 + s, "harfe", s === 0 ? tief : hoch[[1, 2, 3, 2][s % 4]], (s === 0 ? .26 : .18) * leise, 2);
          break;
        case "hymne":
          add(b0, "kb", bass, .38 * leise, L);
          [tief, hoch[0], hoch[1], hoch[2]].forEach((m, i) => add(b0 + i * .05 / spb, "harfe", m, .22 * leise, L));
          if (L === 4) { [hoch[0], hoch[1], hoch[2]].forEach((m, i) => add(b0 + 2 + i * .05 / spb, "harfe", m, .13 * leise, 2)); add(b0, "bodh1", 0, .3 * leise); }
          break;
        default: { /* ballade: Lautenarpeggio in Achteln */
          add(b0, "kb", bass, .45 * leise, L === 4 ? 2 : L); if (L === 4) add(b0 + 2, "kb", lage(r + 7, 36), .36 * leise, 2);
          const muster = L === 4 ? [0, 1, 2, 3, 2, 1, 2, 1] : [0, 1, 2, 3, 2, 1];
          muster.forEach((i, k) => add(b0 + k / 2, "gitarre", hoch[i], (k === 0 ? .2 : .14) * leise, 1));
        }
      }
    });
    /* Führstimme (Chor) und Echos Vorspiel (Flöte) */
    const fuehr = E.kopf && E.fuehr && !st.ohneFuehrung;
    st.noten.forEach(n => {
      const m = g0 + n.s;
      if (n.vor) add(n.b, "fl", m < 60 ? m + 12 : m, .32, n.d * .95);
      else if (fuehr) add(n.b, "ooh", m, .2, n.d * .98);
    });
    ev.sort((a, b) => a.z - b.z);
    return ev;
  }
  function probenFuer(ev) {
    const namen = new Set(); ev.forEach(e => namen.add(probeName(e.g, e.m)));
    return Promise.race([Promise.all([...namen].map(probeLaden)), new Promise(r => setTimeout(r, 5000))]);
  }

  /* =================================================================
     MIKROFON UND TONHÖHE (McLeod Pitch Method)
     ================================================================= */
  let mic = null, testStimme = null;
  async function micAn() {
    if (mic) return true;
    if (testStimme) { mic = { test: true, verlauf: [], boden: .004 }; return true; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("fehlt");
    audio();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0;
    const stumm = ctx.createGain(); stumm.gain.value = 0;
    src.connect(an); an.connect(stumm); stumm.connect(ctx.destination); /* manche Browser rechnen nur, wenn der Zweig irgendwo ankommt */
    const N = an.fftSize >> 1;
    mic = { stream, src, an, stumm, buf: new Float32Array(an.fftSize), x: new Float32Array(N), nsdf: new Float32Array(N), boden: typeof E.boden === "number" ? E.boden : .004, verlauf: [], pegel: 0 };
    stream.getTracks().forEach(t => t.addEventListener("ended", () => { if (mic && mic.stream === stream) { micAus(); if (S && !S.pause) pausieren(); } }));
    return true;
  }
  function micAus() {
    if (!mic) return;
    if (mic.stream) mic.stream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
    try { mic.src && mic.src.disconnect(); mic.an && mic.an.disconnect(); mic.stumm && mic.stumm.disconnect(); } catch (_) {}
    mic = null;
  }
  function erkennen() {
    if (!mic) return { m: null, rms: 0 };
    if (mic.test) { const m = testStimme(); mic.pegel = m == null ? 0 : .3; return { m, rms: mic.pegel, klar: 1 }; }
    const { an, buf, x, nsdf } = mic;
    an.getFloatTimeDomainData(buf);
    const N = x.length; let summe = 0;
    for (let i = 0; i < N; i++) { const v = (buf[2 * i] + buf[2 * i + 1]) * .5; x[i] = v; summe += v * v; }
    const rms = Math.sqrt(summe / N);
    mic.pegel = mic.pegel * .7 + rms * .3;
    /* Rauschboden: fällt schnell, steigt nur langsam (lautes Singen hebt ihn kaum) */
    mic.boden = rms < mic.boden ? mic.boden * .8 + rms * .2 : Math.min(.03, mic.boden * 1.0015);
    const schwelle = Math.max(.005, mic.boden * 2.6);
    if (rms < schwelle) return glaetten(null, rms);
    const sr = ctx.sampleRate / 2;
    const minLag = Math.max(2, Math.floor(sr / 1100)), maxLag = Math.min(N - 2, Math.ceil(sr / 68));
    let m = 0; for (let i = 0; i < N; i++) m += x[i] * x[i]; m *= 2;
    for (let tau = 0; tau <= maxLag + 1; tau++) {
      if (tau > 0) m -= x[tau - 1] * x[tau - 1] + x[N - tau] * x[N - tau];
      let r = 0; const lim = N - tau;
      for (let i = 0; i < lim; i++) r += x[i] * x[i + tau];
      nsdf[tau] = m > 1e-9 ? 2 * r / m : 0;
    }
    let tau = 1;
    while (tau < maxLag && nsdf[tau] > 0) tau++;
    const spitzen = []; let gmax = 0;
    while (tau < maxLag) {
      if (nsdf[tau] > 0) {
        let s = tau;
        while (tau < maxLag && nsdf[tau] > 0) { if (nsdf[tau] > nsdf[s]) s = tau; tau++; }
        if (s >= minLag) { spitzen.push(s); if (nsdf[s] > gmax) gmax = nsdf[s]; }
      } else tau++;
    }
    if (!spitzen.length || gmax < .72) return glaetten(null, rms);
    const p = spitzen.find(q => nsdf[q] >= gmax * .9);
    const a = nsdf[p - 1], b = nsdf[p], c = nsdf[p + 1], d = a - 2 * b + c;
    const genau = p + (d ? (a - c) / (2 * d) : 0);
    const f = sr / genau;
    if (!(f > 60 && f < 1150)) return glaetten(null, rms);
    return glaetten(69 + 12 * Math.log2(f / 440), rms, b);
  }
  /* kleine Glättung: Median der letzten drei stimmhaften Werte, einzelne Oktavsprünge verwerfen */
  function glaetten(m, rms, klar) {
    const v = mic.verlauf; v.push(m); if (v.length > 4) v.shift();
    if (m == null) return { m: null, rms };
    const da = v.filter(x => x != null);
    if (da.length >= 3) { const s = da.slice(-3).sort((x, y) => x - y); const med = s[1]; if (Math.abs(m - med) > 7) return { m: med, rms, klar }; return { m: (m + med) / 2, rms, klar }; }
    return { m, rms, klar };
  }
  const falte = (m, ziel) => m + 12 * Math.round((ziel - m) / 12);

  /* =================================================================
     DAS SPIEL
     ================================================================= */
  let S = null, raf = 0, takt = 0;
  let ansicht = "menue", station = null, gewaehlt = null, einmess = null, gabel = null, ergebnis = null, meldung = "";

  function hoerZeit() {
    if (!S) return 0;
    return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0) - S.t0;
  }
  function starten(st) {
    audio();
    if (S) abbrechen(true);
    const schieb = verschiebung(st);
    const ev = begleitung(st, schieb);
    bus = ctx.createGain(); bus.gain.value = E.kopf ? 1 : .55; bus.connect(ausgang);
    const tol = TOL[E.grad];
    S = { st, schieb, ev, ei: 0, t0: ctx.currentTime + .25, pause: false, tol, ni: 0, spur: [], letzteTv: null, punkte: 0, zeilenWert: [], urteil: null, serie: 0, besteSerie: 0,
      bewertet: 0, tonStatistik: {}, stumm: 0, gehoert: 0, funken: [], zeileJetzt: -1, ende: st.ende * st.spb, bus };
    st.noten.forEach(n => { n.z0 = n.b * st.spb; n.z1 = (n.b + n.d) * st.spb; n.zeit = 0; n.stimme = 0; n.treffer = 0; n.perfekt = 0; n.abw = 0; n.abwZ = 0; n.wert = null; n.m = st.grund + schieb + n.s; });
    st.zeilen.forEach(z => { z.z0 = z.noten.length ? st.noten[z.noten[0]].z0 : z.b0 * st.spb; z.z1 = z.noten.length ? st.noten[z.noten[z.noten.length - 1]].z1 : z.z0; z.wert = null; });
    const ms = st.noten.map(n => n.m);
    let lo = Math.min(...ms) - 3, hi = Math.max(...ms) + 3;
    if (hi - lo < 14) { const mit = (hi + lo) / 2; lo = mit - 7; hi = mit + 7; }
    S.lo = lo; S.hi = hi; S.mitte = (Math.min(...ms) + Math.max(...ms)) / 2;
    ansicht = "spiel"; zeigen();
    planen();
    if (!takt) takt = setInterval(() => { if (S && !S.pause) planen(); }, 100);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(rahmen);
  }
  function planen() {
    if (!S || !ctx) return;
    const jetzt = ctx.currentTime - S.t0, bis = jetzt + 1.2;
    while (S.ei < S.ev.length && S.ev[S.ei].z < bis) {
      const e = S.ev[S.ei++];
      if (e.z < jetzt - .05) continue;
      spielen(e.g, e.m, S.t0 + e.z, e.laut, e.dauer, S.bus);
    }
  }
  function pausieren() {
    if (!S || S.pause) return;
    S.pause = true;
    if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
    ansicht = "pause"; zeigen();
  }
  function fortsetzen() {
    if (!S) return;
    S.pause = false; S.letzteTv = null;
    audio();
    ansicht = "spiel"; zeigen();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(rahmen);
  }
  function abbrechen(still) {
    if (!S) return;
    try { S.bus.disconnect(); } catch (_) {}
    S = null; cancelAnimationFrame(raf);
    if (takt) { clearInterval(takt); takt = 0; }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    if (!still) { micAus(); }
  }

  function rahmen() {
    if (!S) return;
    raf = requestAnimationFrame(rahmen);
    if (root.offsetParent === null || document.hidden) { pausieren(); return; }
    if (S.pause) return;
    planen();
    const t = hoerZeit();
    const e = erkennen();
    const tv = t - E.versatz / 1000 - .05;
    werten(e, tv);
    if (t > S.ende + .3) { fertig(); return; }
    zeichnen(t, tv, e);
    textAktualisieren(tv);
    hudAktualisieren(t);
  }

  function werten(e, tv) {
    const st = S.st, noten = st.noten;
    const dt = S.letzteTv == null ? 0 : klemm(tv - S.letzteTv, 0, .06);
    S.letzteTv = tv;
    if (tv > st.intro * st.spb) { S.gehoert += dt; if (e.m == null) S.stumm += dt; }
    while (S.ni < noten.length && noten[S.ni].z1 + .12 < tv) { abschliessen(noten[S.ni]); S.ni++; }
    let aktiv = null;
    for (let k = S.ni; k < noten.length && noten[k].z0 <= tv; k++) if (tv < noten[k].z1) { aktiv = noten[k]; break; }
    const ziel = aktiv ? aktiv.m : (noten[S.ni] ? noten[S.ni].m : S.mitte);
    let ok = false, gefaltet = null, abw = null;
    if (e.m != null) {
      gefaltet = falte(e.m, ziel);
      if (aktiv) {
        abw = (gefaltet - aktiv.m) * 100;
        ok = Math.abs(abw) <= S.tol;
        if (!aktiv.vor) {
          aktiv.stimme += dt;
          if (ok) { aktiv.treffer += dt; if (Math.abs(abw) <= S.tol / 2) aktiv.perfekt += dt; }
          if (Math.abs(abw) < 300) { aktiv.abw += abw * dt; aktiv.abwZ += dt; }
        }
      }
      S.spur.push({ t: tv, m: gefaltet, ok: ok && aktiv && !aktiv.vor });
    } else S.spur.push({ t: tv, m: null });
    if (aktiv && !aktiv.vor) aktiv.zeit += dt;
    while (S.spur.length && S.spur[0].t < tv - 3) S.spur.shift();
    S.aktiv = aktiv; S.abw = abw; S.ok = ok; S.gefaltet = gefaltet;
    if (ok && aktiv && !aktiv.vor && !ruhig && Math.abs(abw) <= S.tol / 2 && Math.random() < .35) S.funken.push({ t: tv, m: aktiv.m, vx: Math.random() * 40 - 10, vy: -Math.random() * 60 - 20, leben: .7 });
  }
  function abschliessen(n) {
    if (n.wert != null) return;
    if (n.vor) { n.wert = 1; return; }
    const dauer = n.z1 - n.z0;
    n.wert = klemm((n.treffer + n.perfekt * .25) / (dauer * .78), 0, 1);
    S.punkte += n.wert * n.gewicht; S.bewertet++;
    if (n.abwZ > .05) {
      const kl = ((Math.round(n.m) % 12) + 12) % 12, ts = S.tonStatistik[kl] || (S.tonStatistik[kl] = { a: 0, z: 0 });
      ts.a += n.abw; ts.z += n.abwZ;
    }
    const z = S.st.zeilen[n.zeile];
    if (z && z.noten[z.noten.length - 1] === n.i && !z.vor) {
      let s = 0, g = 0; z.noten.forEach(i => { const x = S.st.noten[i]; s += x.wert * x.d; g += x.d; });
      z.wert = g ? s / g : 0;
      const U = T().spiel.urteil;
      const art = z.wert >= .9 ? "perfekt" : z.wert >= .7 ? "gut" : z.wert >= .45 ? "knapp" : "daneben";
      if (z.wert >= .7) S.serie++; else S.serie = 0;
      S.besteSerie = Math.max(S.besteSerie, S.serie);
      S.urteil = { text: U[art] + (S.serie >= 3 ? " · " + T().spiel.serie(S.serie) : ""), art, bis: performance.now() + 1600 };
    }
  }

  /* ---------- Zeichnen ---------- */
  const FARBE = { gold: "#ffd27a", gruen: "#9fe08f", orange: "#e8a24a", rot: "#d06a5a", glut: "rgba(224,160,70,", tuerkis: "#5fd6b8", pergament: "#ebe2cc" };
  let cv = null, g = null, cw = 0, ch = 0, dpr = 1;
  function messen() {
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cw = r.width; ch = r.height;
  }
  function rundRect(x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function hintergrund() {
    const v = g.createLinearGradient(0, 0, 0, ch);
    v.addColorStop(0, "#17121d"); v.addColorStop(1, "#0e0b12");
    g.fillStyle = v; g.fillRect(0, 0, cw, ch);
    const glut = g.createRadialGradient(cw * .24, ch * .55, 10, cw * .24, ch * .55, Math.max(cw, ch) * .7);
    glut.addColorStop(0, "rgba(224,160,70,.10)"); glut.addColorStop(1, "rgba(224,160,70,0)");
    g.fillStyle = glut; g.fillRect(0, 0, cw, ch);
  }
  function zeichnen(t, tv, e) {
    if (!g) return;
    messen();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    hintergrund();
    const st = S.st, oben = 48, unten = 14, x0 = Math.round(cw * .24);
    const pxs = (cw - x0) / 4.4;
    const X = z => x0 + (z - t) * pxs;
    const span = S.hi - S.lo, zeile = (ch - oben - unten) / span;
    const Y = m => oben + (S.hi - m) * zeile;
    /* Tonlinien */
    g.font = "10px system-ui, sans-serif"; g.textBaseline = "middle";
    for (let m = Math.ceil(S.lo); m <= S.hi; m++) {
      const kl = ((m % 12) + 12) % 12, grund = kl === ((st.grund + S.schieb) % 12 + 12) % 12;
      g.fillStyle = grund ? "rgba(224,160,70,.16)" : "rgba(235,226,204,.045)";
      g.fillRect(0, Math.round(Y(m)) - (grund ? .5 : 0), cw, grund ? 1 : 1);
      if (grund) { g.fillStyle = "rgba(224,160,70,.55)"; g.fillText(tonName(m), 4, Y(m) - 7); }
    }
    /* Taktstriche */
    const L = st.takt;
    for (let b = Math.ceil((t - 2) / st.spb / L) * L; b * st.spb < t + 5; b += L) {
      const x = X(b * st.spb); if (x < 0 || x > cw) continue;
      g.fillStyle = "rgba(235,226,204,.05)"; g.fillRect(Math.round(x), oben - 6, 1, ch - oben);
    }
    /* Noten */
    const h = Math.max(7, Math.min(22, zeile * .92));
    for (let k = Math.max(0, S.ni - 12); k < st.noten.length; k++) {
      const n = st.noten[k];
      const xa = X(n.z0), xe = X(n.z1);
      if (xe < -10) continue; if (xa > cw + 10) break;
      const y = Y(n.m) - h / 2, w = Math.max(4, xe - xa - 2);
      if (n.vor) {
        g.setLineDash([5, 4]); g.strokeStyle = FARBE.tuerkis; g.lineWidth = 1.5; rundRect(xa, y, w, h, h / 2.4);
        g.fillStyle = "rgba(95,214,184,.16)"; g.fill(); g.stroke(); g.setLineDash([]);
        continue;
      }
      const vorbei = n.wert != null, laeuft = !vorbei && tv >= n.z0;
      let fuell = FARBE.glut + ".22)", rand = FARBE.glut + ".85)";
      if (vorbei) { const w2 = n.wert; fuell = w2 >= .85 ? "rgba(255,210,122,.75)" : w2 >= .5 ? "rgba(159,224,143,.55)" : w2 >= .15 ? "rgba(232,162,74,.35)" : "rgba(208,106,90,.22)"; rand = w2 >= .85 ? FARBE.gold : w2 >= .5 ? FARBE.gruen : w2 >= .15 ? FARBE.orange : "rgba(208,106,90,.6)"; }
      rundRect(xa, y, w, h, h / 2.4); g.fillStyle = fuell; g.fill(); g.lineWidth = laeuft ? 2 : 1.2; g.strokeStyle = rand; g.stroke();
      if (laeuft) {
        const anteil = klemm((tv - n.z0) / (n.z1 - n.z0), 0, 1), quote = n.zeit > 0 ? n.treffer / n.zeit : 0;
        g.save(); rundRect(xa, y, w, h, h / 2.4); g.clip();
        g.fillStyle = quote >= .6 ? "rgba(255,210,122,.75)" : quote >= .3 ? "rgba(159,224,143,.5)" : "rgba(235,226,204,.12)";
        g.fillRect(xa, y, w * anteil, h); g.restore();
      }
    }
    /* Stimmspur */
    let vorher = null;
    S.spur.forEach(p => {
      if (p.m == null) { vorher = null; return; }
      const x = X(p.t), y = Y(klemm(p.m, S.lo, S.hi));
      if (x < -4) { vorher = { x, y, p }; return; }
      if (vorher && p.t - vorher.p.t < .1) {
        g.strokeStyle = p.ok ? "rgba(159,224,143,.9)" : "rgba(235,226,204,.45)"; g.lineWidth = 3; g.lineCap = "round";
        g.beginPath(); g.moveTo(vorher.x, vorher.y); g.lineTo(x, y); g.stroke();
      }
      vorher = { x, y, p };
    });
    /* Funken */
    S.funken = S.funken.filter(f => tv - f.t < f.leben);
    S.funken.forEach(f => { const a = (tv - f.t); g.fillStyle = "rgba(255,210,122," + (1 - a / f.leben).toFixed(2) + ")"; g.beginPath(); g.arc(x0 + f.vx * a, Y(f.m) + f.vy * a + 60 * a * a, 2, 0, 7); g.fill(); });
    /* Lauflinie */
    const lg = g.createLinearGradient(0, oben, 0, ch);
    lg.addColorStop(0, "rgba(224,160,70,0)"); lg.addColorStop(.5, "rgba(224,160,70,.55)"); lg.addColorStop(1, "rgba(224,160,70,0)");
    g.fillStyle = lg; g.fillRect(x0 - 1, oben - 8, 2, ch - oben + 8);
    /* Stimme jetzt */
    if (S.gefaltet != null) {
      const y = Y(klemm(S.gefaltet, S.lo, S.hi));
      g.shadowColor = S.ok ? FARBE.gruen : "rgba(235,226,204,.6)"; g.shadowBlur = 14;
      g.fillStyle = S.ok ? FARBE.gruen : FARBE.pergament; g.beginPath(); g.arc(x0, y, 7, 0, 7); g.fill(); g.shadowBlur = 0;
      if (S.aktiv && !S.aktiv.vor && !S.ok && S.abw != null) {
        const hoch = S.abw < 0; /* zu tief → Pfeil nach oben */
        g.fillStyle = FARBE.orange; g.beginPath();
        if (hoch) { g.moveTo(x0 + 12, y - 4); g.lineTo(x0 + 18, y - 12); g.lineTo(x0 + 24, y - 4); } else { g.moveTo(x0 + 12, y + 4); g.lineTo(x0 + 18, y + 12); g.lineTo(x0 + 24, y + 4); }
        g.fill();
      }
    }
    /* Einzählen */
    const introSek = st.intro * st.spb;
    if (t < introSek) {
      const rest = Math.ceil((introSek - t) / st.spb);
      if (rest <= 4 && rest > 0) {
        g.fillStyle = "rgba(255,210,122," + (.35 + .5 * (1 - ((introSek - t) / st.spb) % 1)).toFixed(2) + ")";
        g.font = "700 " + Math.round(Math.min(64, ch * .22)) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(rest), cw / 2, ch * .55); g.textAlign = "left";
      }
    }
    /* Urteil */
    if (S.urteil && performance.now() < S.urteil.bis) {
      const a = klemm((S.urteil.bis - performance.now()) / 600, 0, 1);
      const farbe = { perfekt: "255,210,122", gut: "159,224,143", knapp: "232,162,74", daneben: "208,106,90" }[S.urteil.art];
      g.fillStyle = "rgba(" + farbe + "," + a.toFixed(2) + ")"; g.font = "700 " + (cw < 420 ? 17 : 21) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.fillText(S.urteil.text, cw * .58, oben + 24); g.textAlign = "left";
    }
    /* zu leise? */
    if (t > introSek + 4 && S.stumm > 6 && S.stumm / Math.max(1, S.gehoert) > .9 && !(S.aktiv && S.aktiv.vor)) {
      g.fillStyle = "rgba(235,226,204,.7)"; g.font = "13px system-ui, sans-serif"; g.textAlign = "center"; g.fillText(T().spiel.leise, cw * .6, ch - 22); g.textAlign = "left";
    }
  }
  /* Ruhebild hinter den Menüs: Notenlinien und treibende Töne */
  let ruheZeit = 0, ruheRaf = 0;
  function ruhebild() {
    cancelAnimationFrame(ruheRaf);
    if (!g || S) return;
    messen(); g.setTransform(dpr, 0, 0, dpr, 0, 0); hintergrund();
    ruheZeit += ruhig ? 0 : .012;
    for (let i = 0; i < 5; i++) { const y = ch * (.32 + i * .09); g.fillStyle = "rgba(224,160,70,.08)"; g.fillRect(0, y, cw, 1); }
    for (let i = 0; i < 14; i++) {
      const x = ((i * 97 + ruheZeit * 40 * (1 + i % 3 * .3)) % (cw + 80)) - 40;
      const y = ch * (.32 + ((i * 37) % 9) * .045) + Math.sin(ruheZeit + i) * 4;
      g.fillStyle = "rgba(255,210,122," + (.12 + (i % 4) * .05) + ")"; rundRect(cw - x, y, 26 + (i % 3) * 14, 8, 4); g.fill();
    }
    if (ansicht !== "spiel" && root.offsetParent !== null && !document.hidden && !ruhig) ruheRaf = requestAnimationFrame(ruhebild);
  }

  /* ---------- Liedtext unter der Bühne ---------- */
  function textAktualisieren(tv) {
    const st = S.st;
    let idx = st.zeilen.findIndex(z => z.z1 + .25 > tv);
    if (idx < 0) idx = st.zeilen.length - 1;
    if (idx !== S.zeileJetzt) {
      S.zeileJetzt = idx;
      const z = st.zeilen[idx], n = st.zeilen[idx + 1];
      textJetzt.innerHTML = zeileHtml(z); textDann.innerHTML = n ? zeileHtml(n, true) : "&nbsp;";
      S.silbenEl = Array.from(textJetzt.querySelectorAll("[data-n]"));
    }
    (S.silbenEl || []).forEach(el => {
      const n = st.noten[+el.dataset.n];
      const zustand = n.wert != null ? (n.wert >= .5 ? "gut" : "mies") : tv >= n.z0 ? "dran" : "";
      if (el.dataset.z !== zustand) { el.dataset.z = zustand; el.className = zustand; }
    });
  }
  function zeileHtml(z, blass) {
    if (!z) return "&nbsp;";
    if (z.vor) return '<span class="kh-vor">' + esc(T().echoZeile) + "</span>";
    return z.noten.map(i => { const n = S.st.noten[i]; return '<span data-n="' + i + '">' + esc(n.silbe) + "</span>" + (n.ende ? " " : ""); }).join("");
  }
  function hudAktualisieren(t) {
    const p = Math.round(S.punkte);
    if (hudPunkte._w !== p) { hudPunkte._w = p; hudPunkte.textContent = p.toLocaleString(sprache() === "en" ? "en-GB" : "de-DE"); }
    const f = klemm(t / S.ende, 0, 1);
    hudBalken.style.transform = "scaleX(" + f.toFixed(3) + ")";
    const pg = mic ? klemm(mic.pegel / .12, 0, 1) : 0;
    hudPegel.style.transform = "scaleY(" + pg.toFixed(2) + ")";
  }

  /* ---------- Ende eines Auftritts ---------- */
  function fertig() {
    const st = S.st;
    st.noten.forEach(n => abschliessen(n));
    const sing = st.noten.filter(n => !n.vor);
    const pct = Math.round(S.punkte / 100);
    const getroffen = sing.filter(n => n.wert >= .5).length;
    let a = 0, z = 0; sing.forEach(n => { a += n.abw; z += n.abwZ; });
    const tendenz = z > .5 ? Math.round(a / z) : null;
    const stummAnteil = S.gehoert > 3 ? S.stumm / S.gehoert : 0;
    /* Rekorde */
    const rek = rekorde(), alt = rek[st.id] | 0, neu = pct > alt;
    if (neu) { rek[st.id] = pct; schreib(K.rekorde, JSON.stringify(rek)); }
    /* Stimmbuch */
    const buch = buchLesen();
    Object.keys(S.tonStatistik).forEach(kl => { const s = S.tonStatistik[kl], b = buch.toene[kl] || (buch.toene[kl] = { a: 0, z: 0 }); b.a += s.a; b.z += s.z; });
    buch.verlauf.unshift({ id: st.id, p: pct, d: Date.now(), g: E.grad }); buch.verlauf = buch.verlauf.slice(0, 12);
    schreib(K.buch, JSON.stringify(buch));
    /* Tournee */
    let wurf = null, frei = false;
    if (station != null) {
      const w = wegLesen(), stufe = DATEN.weg[station], sterne = pct >= 85 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
      w.sterne[station] = Math.max(w.sterne[station] | 0, sterne);
      if (sterne > 0 && w.frei <= station && station < DATEN.weg.length - 1) { w.frei = station + 1; frei = true; }
      if (sterne > 0 && station === DATEN.weg.length - 1) w.frei = Math.max(w.frei, station);
      wegSchreiben(w);
      const roh = 1 + Math.floor(Math.random() * 20), bonus = Math.floor(pct / 10);
      wurf = { roh, bonus, summe: roh + bonus, sg: stufe.sg, sterne, geschafft: roh === 20 || (roh !== 1 && roh + bonus >= stufe.sg && sterne > 0) };
    }
    ergebnis = { st, pct, punkte: Math.round(S.punkte), getroffen, gesamt: sing.length, tendenz, neu, alt, wurf, frei, stumm: stummAnteil > .8, besteSerie: S.besteSerie, station };
    abbrechen();
    ansicht = "ergebnis"; zeigen();
  }

  /* =================================================================
     EINMESSEN UND STIMMGABEL (eigene kleine Schleifen)
     ================================================================= */
  function einmessenStarten(woher) {
    einmess = { woher: woher || "menue", schritt: "still", seit: performance.now(), werte: [], tief: null, hoch: null, boden: [], halten: 0 };
    ansicht = "einmessen"; zeigen();
    mikroDann(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(einmessRahmen); });
  }
  function einmessRahmen() {
    if (ansicht !== "einmessen" || !einmess) return;
    raf = requestAnimationFrame(einmessRahmen);
    if (root.offsetParent === null || document.hidden) return;
    const e = erkennen(), jetzt = performance.now(), em = einmess;
    if (em.schritt === "still") {
      em.boden.push(e.rms);
      if (jetzt - em.seit > 1400) { const s = em.boden.slice().sort((a, b) => a - b); const b = s[Math.floor(s.length * .6)] || .004; if (mic) mic.boden = b; E.boden = b; em.schritt = "tief"; em.seit = jetzt; einmessAnzeige(); }
      return;
    }
    if (em.schritt === "tief" || em.schritt === "hoch") {
      if (e.m != null) {
        em.werte.push(e.m); if (em.werte.length > 70) em.werte.shift();
        const letzte = em.werte.slice(-40), s = letzte.slice().sort((a, b) => a - b), med = s[Math.floor(s.length / 2)];
        const stabil = letzte.length >= 25 && letzte.filter(m => Math.abs(m - med) < 1.2).length / letzte.length > .75;
        em.aktuell = med; em.halten = stabil ? em.halten + 1 : Math.max(0, em.halten - 2);
        if (em.halten > 50) {
          em[em.schritt] = med; em.werte = []; em.halten = 0;
          if (em.schritt === "tief") { em.schritt = "hoch"; tonBestaetigen(med); }
          else { em.schritt = "fertig"; tonBestaetigen(med); if (em.tief > em.hoch) { const x = em.tief; em.tief = em.hoch; em.hoch = x; } micAus(); cancelAnimationFrame(raf); }
          em.seit = jetzt; einmessAnzeige(); return;
        }
      } else em.halten = Math.max(0, em.halten - 1);
      einmessLive(e);
    }
  }
  function tonBestaetigen(m) { audio(); spielen("harfe", Math.round(m), ctx.currentTime + .02, .3, 1.2, ausgang); }
  function gabelStarten() {
    gabel = { werte: [], letzte: null };
    ansicht = "gabel"; zeigen();
    mikroDann(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(gabelRahmen); });
  }
  function gabelRahmen() {
    if (ansicht !== "gabel" || !gabel) return;
    raf = requestAnimationFrame(gabelRahmen);
    if (root.offsetParent === null || document.hidden) return;
    const e = erkennen(), tx = T().gabel;
    const el = panel.querySelector(".kh-gabel"); if (!el) return;
    if (e.m == null) { gabel.leer = (gabel.leer | 0) + 1; if (gabel.leer > 25) { el.classList.add("leer"); el.querySelector(".kh-g-ton").textContent = "–"; el.querySelector(".kh-g-info").textContent = tx.leer; } return; }
    gabel.leer = 0; el.classList.remove("leer");
    gabel.werte.push(e.m); if (gabel.werte.length > 6) gabel.werte.shift();
    const m = gabel.werte.reduce((a, b) => a + b, 0) / gabel.werte.length, r = Math.round(m), c = Math.round((m - r) * 100);
    gabel.letzte = r;
    el.querySelector(".kh-g-ton").textContent = tonName(r);
    el.querySelector(".kh-g-zeiger").style.transform = "translateX(" + klemm(c, -50, 50) + "%)";
    el.querySelector(".kh-g-info").textContent = tx.cent(c) + " · " + (Math.abs(c) <= 10 ? tx.genau : c < 0 ? tx.tief : tx.hoch) + " · " + tx.hz(Math.round(440 * Math.pow(2, (m - 69) / 12)));
    el.dataset.genau = Math.abs(c) <= 10 ? "1" : "0";
  }

  /* Mikrofon holen – beim ersten Mal mit Erklärung */
  let mikroWartet = null;
  function mikroDann(weiter) {
    if (mic) { weiter(); return; }
    const schon = lies("imres-kehle-mikro") === "1";
    if (!schon && !testStimme) { mikroWartet = { weiter, zurueck: ansicht }; ansicht = "mikro"; meldung = ""; zeigen(); return; }
    mikroHolen(weiter);
  }
  function mikroHolen(weiter) {
    micAn().then(() => { schreib("imres-kehle-mikro", "1"); weiter(); }).catch(err => {
      const tx = T().mikro, n = err && err.name;
      meldung = n === "NotAllowedError" || n === "SecurityError" ? tx.verweigert : n === "NotReadableError" ? tx.belegt : tx.fehlt;
      mikroWartet = { weiter, zurueck: "menue" }; ansicht = "mikro"; zeigen();
    });
  }

  /* =================================================================
     ANSICHTEN
     ================================================================= */
  root.innerHTML =
    '<p class="label kh-label"></p><h3 class="kh-titel"></h3><p class="tav-info kh-info"></p>' +
    '<div class="kh-buehne">' +
      '<canvas class="kh-canvas" aria-hidden="true"></canvas>' +
      '<div class="kh-hud" hidden><b class="kh-hud-titel"></b><span class="kh-pegel" aria-hidden="true"><i></i></span><span class="kh-hud-punkte">0</span>' +
        '<button type="button" class="kh-pause" data-tun="pause"></button><span class="kh-fort" aria-hidden="true"><i></i></span></div>' +
      '<div class="kh-panel"></div>' +
    "</div>" +
    '<div class="kh-text" hidden><p class="kh-zeile jetzt"></p><p class="kh-zeile dann"></p></div>';
  const $ = s => root.querySelector(s);
  const panel = $(".kh-panel"), hud = $(".kh-hud"), textBox = $(".kh-text"), textJetzt = $(".kh-zeile.jetzt"), textDann = $(".kh-zeile.dann");
  const hudPunkte = $(".kh-hud-punkte"), hudBalken = $(".kh-fort i"), hudPegel = $(".kh-pegel i");
  cv = $(".kh-canvas"); g = cv.getContext("2d");

  const knopf = (tun, text, extra, daten) => '<button type="button" class="tav-knopf' + (extra ? " " + extra : "") + '" data-tun="' + tun + '"' + (daten || "") + ">" + text + "</button>";
  const sterneHtml = n => '<span class="kh-sterne" aria-label="' + n + '/3">' + [0, 1, 2].map(i => '<i class="' + (i < n ? "voll" : "") + '">★</i>').join("") + "</span>";
  function rangVon(sterne) { const R = T().raenge, stufen = [0, 5, 10, 16, 22, 28]; let r = 0; stufen.forEach((s, i) => { if (sterne >= s) r = i; }); return R[r]; }
  const umfangText = () => gemessen() ? T().stimme(tonName(E.tief), tonName(E.hoch)) : T().nichtGemessen;
  const gradKnoepfe = () => '<div class="kh-wahl" role="radiogroup">' + ["leicht", "mittel", "schwer"].map(k => '<button type="button" role="radio" aria-checked="' + (E.grad === k) + '" data-tun="grad" data-wert="' + k + '">' + esc(T().grade[k]) + "</button>").join("") + "</div>";

  function zeigen() {
    const tx = T();
    $(".kh-label").textContent = tx.label; $(".kh-titel").textContent = tx.titel; $(".kh-info").textContent = tx.text;
    const spielt = ansicht === "spiel";
    hud.hidden = !spielt;
    textBox.hidden = !(spielt || ansicht === "pause");
    panel.hidden = spielt;
    const vorher = root.classList.contains("kh-spielt");
    root.classList.toggle("kh-spielt", spielt || ansicht === "pause");
    if (vorher !== root.classList.contains("kh-spielt")) {
      /* Überschrift ein-/ausgeblendet: Spielesaal soll die Bühne neu vermessen, Bühne ins Bild holen */
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
        const r = $(".kh-buehne").getBoundingClientRect();
        if (spielt && (r.top < 60 || r.bottom > window.innerHeight)) {
          const kopf = document.querySelector("header, .kopfleiste, .topbar"), kh = kopf && getComputedStyle(kopf).position.match(/fixed|sticky/) ? kopf.getBoundingClientRect().height : 0;
          window.scrollTo({ top: Math.max(0, r.top + window.pageYOffset - kh - 8), behavior: "instant" });
        }
      });
    }
    $(".kh-pause").textContent = "⏸"; $(".kh-pause").setAttribute("aria-label", tx.spiel.pause);
    if (S) $(".kh-hud-titel").textContent = S.st.titel;
    if (!spielt) panel.innerHTML = '<div class="kh-karte">' + (ANSICHT[ansicht] || ANSICHT.menue)() + "</div>";
    panel.scrollTop = 0;
    if (!S) { cancelAnimationFrame(ruheRaf); requestAnimationFrame(ruhebild); }
  }

  const ANSICHT = {
    menue() {
      const tx = T(), w = wegLesen(), summe = w.sterne.reduce((a, b) => a + b, 0);
      return '<h4 class="kh-kopf">' + esc(tx.menueKopf) + "</h4>" +
        '<p class="kh-klein' + (gemessen() ? "" : " kh-hinweis") + '">' + esc(umfangText()) + "</p>" +
        '<div class="kh-raster">' +
          '<button type="button" class="kh-gross haupt" data-tun="tournee"><b>' + esc(tx.menue.tournee) + "</b><small>" + esc(tx.tourneeInfo(summe, rangVon(summe))) + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="lieder"><b>' + esc(tx.menue.lieder) + "</b><small>" + DATEN.lieder.length + (sprache() === "en" ? " songs" : " Lieder") + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="uebungen"><b>' + esc(tx.menue.uebungen) + "</b><small>" + esc(tx.uebText) + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="einmessen"><b>' + esc(tx.menue.einmessen) + "</b><small>" + esc(gemessen() ? tonName(E.tief) + " – " + tonName(E.hoch) : "30 s") + "</small></button>" +
        "</div>" +
        '<div class="kh-reihe">' + knopf("gabel", esc(tx.menue.gabel)) + knopf("buch", esc(tx.menue.buch)) + knopf("einst", esc(tx.menue.einst)) + "</div>" +
        '<p class="kh-klein">' + esc(tx.kopfTipp) + "</p><p class=\"kh-klein kh-privat\">🔒 " + esc(tx.privat) + "</p>";
    },
    tournee() {
      const tx = T(), w = wegLesen(), summe = w.sterne.reduce((a, b) => a + b, 0), L = sprache();
      return '<h4 class="kh-kopf">' + esc(tx.tourneeTitel) + ' <small>· ' + esc(rangVon(summe)) + "</small></h4>" +
        '<p class="kh-klein">' + esc(tx.tourneeText) + "</p>" +
        '<ol class="kh-liste">' + DATEN.weg.map((s, i) => {
          const lied = DATEN.lieder.find(l => l.id === s.lied), offen = i <= w.frei, txt = s[L] || s.de;
          return '<li><button type="button" class="kh-eintrag' + (offen ? "" : " zu") + '" data-tun="station" data-wert="' + i + '"' + (offen ? "" : " disabled") + ">" +
            '<span class="kh-nr">' + (i + 1) + "</span><span class=\"kh-was\"><b>" + esc(txt.ort) + "</b><small>" + esc(offen ? "„" + (lied ? lied.titel[L] || lied.titel.de : "") + "“" : tx.gesperrt) + "</small></span>" +
            sterneHtml(w.sterne[i] | 0) + "</button></li>";
        }).join("") + "</ol>" + '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    lieder() {
      const tx = T(), rek = rekorde(), L = sprache();
      return '<h4 class="kh-kopf">' + esc(tx.liederTitel) + "</h4><p class=\"kh-klein\">" + esc(tx.liederText) + "</p>" +
        '<ul class="kh-liste">' + DATEN.lieder.map(l => '<li><button type="button" class="kh-eintrag" data-tun="lied" data-wert="' + esc(l.id) + '">' +
          '<span class="kh-was"><b>' + esc(l.titel[L] || l.titel.de) + "</b><small>" + "♪".repeat(l.grad || 1) + (rek[l.id] ? " · " + esc(tx.bestwert(rek[l.id])) : "") + "</small></span></button></li>").join("") + "</ul>" +
        '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    uebungen() {
      const tx = T(), rek = rekorde();
      return '<h4 class="kh-kopf">' + esc(tx.uebTitel) + "</h4><p class=\"kh-klein\">" + esc(tx.uebText) + (gemessen() ? "" : " " + esc(tx.vorher.messenTipp)) + "</p>" +
        '<ul class="kh-liste">' + ["tonleiter", "halten", "echo", "spruenge", "gabel"].map(k => '<li><button type="button" class="kh-eintrag" data-tun="' + (k === "gabel" ? "gabel" : "uebung") + '" data-wert="' + k + '">' +
          '<span class="kh-was"><b>' + esc(tx.ueb[k][0]) + "</b><small>" + esc(tx.ueb[k][1]) + (rek["u-" + k] ? " · " + esc(tx.bestwert(rek["u-" + k])) : "") + "</small></span></button></li>").join("") + "</ul>" +
        '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    vorher() {
      const tx = T(), V = tx.vorher, st = gewaehlt.st, L = sprache();
      let kopf = "";
      if (station != null) {
        const s = DATEN.weg[station], txt = s[L] || s.de;
        kopf = '<p class="label">' + esc(V.ort) + " " + (station + 1) + "</p><h4 class=\"kh-kopf\">" + esc(txt.ort) + "</h4>" +
          '<p class="kh-klein"><b>' + esc(V.publikum) + ":</b> " + esc(txt.publikum) + " · " + esc(V.sg(s.sg)) + "</p><p class=\"kh-zitat\">„" + esc(txt.intro) + "“</p>";
      }
      const schieb = verschiebung(st), eigen = E.trans[st.id] | 0;
      return kopf + '<h4 class="kh-lied">' + esc(st.titel) + "</h4>" +
        (!st.uebung && V.deutsch ? '<p class="kh-klein">' + esc(V.deutsch) + "</p>" : "") +
        (gemessen() ? "" : '<p class="kh-klein kh-hinweis">' + esc(V.messenTipp) + "</p>") +
        '<div class="kh-zeile2"><span>' + esc(tx.einst.grad) + "</span>" + gradKnoepfe() + "</div>" +
        (st.fest ? "" : '<div class="kh-zeile2"><span>' + esc(V.tonart) + '</span><div class="kh-wahl"><button type="button" data-tun="trans" data-wert="-1" aria-label="−">−</button><output>' +
          esc(tonName(st.grund + schieb)) + (eigen ? " (" + (eigen > 0 ? "+" : "") + eigen + ")" : " · " + esc(V.auto)) + '</output><button type="button" data-tun="trans" data-wert="1" aria-label="+">+</button></div></div>') +
        (st.ohneFuehrung ? "" : '<div class="kh-zeile2"><span>' + esc(V.fuehr) + "</span>" + (E.kopf ? '<div class="kh-wahl"><button type="button" role="switch" aria-checked="' + E.fuehr + '" data-tun="fuehr">' + esc(E.fuehr ? tx.einst.an : tx.einst.aus) + "</button></div>" : '<small class="kh-klein">' + esc(V.fuehrAus) + "</small>") + "</div>") +
        '<p class="kh-klein kh-laden" aria-live="polite"></p>' +
        '<div class="kh-reihe">' + knopf("los", esc(V.los), "haupt") + (gemessen() ? "" : knopf("einmessen", esc(V.messen))) + knopf(station != null ? "tournee" : st.uebung ? "uebungen" : "lieder", esc(tx.zurueck)) + "</div>";
    },
    pause() {
      const tx = T().spiel;
      return '<h4 class="kh-kopf">⏸ ' + esc(tx.pausiert) + "</h4>" + '<div class="kh-reihe senk">' + knopf("weiter", esc(tx.weiter), "haupt") + knopf("neu", esc(tx.neu)) + knopf("aufhoeren", esc(tx.aufhoeren)) + "</div>";
    },
    ergebnis() {
      const tx = T(), E2 = tx.erg, r = ergebnis, L = sprache();
      const stufe = r.pct >= 95 ? 5 : r.pct >= 85 ? 4 : r.pct >= 70 ? 3 : r.pct >= 50 ? 2 : r.pct >= 30 ? 1 : 0;
      let html = '<h4 class="kh-lied">' + esc(r.st.titel) + "</h4>" +
        '<div class="kh-pct"><b>' + r.pct + "<small>%</small></b><span>" + r.punkte.toLocaleString(L === "en" ? "en-GB" : "de-DE") + " " + esc(E2.punkte) + "</span></div>" +
        (r.wurf ? sterneHtml(r.wurf.sterne) : "") +
        '<p class="kh-klein">' + esc(E2.getroffen(r.getroffen, r.gesamt)) + (r.besteSerie >= 2 ? " · " + esc(tx.spiel.serie(r.besteSerie)) : "") + "</p>" +
        (r.neu && r.alt ? '<p class="kh-neu">🏆 ' + esc(E2.rekord) + "</p>" : r.alt && !r.neu ? '<p class="kh-klein">' + esc(E2.bisher(r.alt)) + "</p>" : "") +
        (r.stumm ? '<p class="kh-klein kh-hinweis">' + esc(E2.stumm) + "</p>" : r.tendenz == null ? "" : '<p class="kh-klein">' + esc(Math.abs(r.tendenz) < 10 ? E2.mittig : r.tendenz < 0 ? E2.zuTief(-r.tendenz) : E2.zuHoch(r.tendenz)) + "</p>");
      if (r.wurf) {
        const s = DATEN.weg[r.station], txt = s[L] || s.de, w = r.wurf;
        html += '<div class="kh-wurf"><span class="kh-w20' + (w.roh === 20 ? " krit" : w.roh === 1 ? " patzer" : "") + '">' + w.roh + "</span><span>" + esc(E2.wurf(w.roh, w.bonus, w.summe, w.sg)) + (w.roh === 20 ? " " + esc(E2.krit) : w.roh === 1 ? " " + esc(E2.patzer) : "") + "</span></div>" +
          '<p class="kh-zitat">„' + esc(w.geschafft ? txt.sieg : txt.pleite) + "“</p>" + (r.frei ? '<p class="kh-neu">✨ ' + esc(E2.neuFrei) + "</p>" : "");
      } else html += '<p class="kh-zitat">„' + esc(zufall(tx.stimmen[stufe])) + "“</p>";
      const weiter = r.wurf && r.station < DATEN.weg.length - 1 && wegLesen().frei > r.station;
      html += '<div class="kh-reihe">' + (weiter ? knopf("station", esc(E2.naechste), "haupt", ' data-wert="' + (r.station + 1) + '"') : "") +
        knopf("nochmal", esc(E2.nochmal), weiter ? "" : "haupt") + (r.wurf ? knopf("tournee", esc(E2.tournee)) : "") + knopf("menue", esc(tx.menueKnopf)) + "</div>";
      return html;
    },
    einmessen() {
      const tx = T().einmessen, em = einmess || {};
      if (em.schritt === "fertig") {
        const n = Math.round(em.hoch) - Math.round(em.tief);
        return '<h4 class="kh-kopf">🎙 ' + esc(tx.titel) + "</h4>" + '<p class="kh-gross-ton">' + esc(tonName(em.tief)) + " – " + esc(tonName(em.hoch)) + "</p>" +
          '<p class="kh-klein">' + esc(tx.fertig(tonName(em.tief), tonName(em.hoch), n)) + "</p>" + (n < 7 ? '<p class="kh-klein kh-hinweis">' + esc(tx.zuEng) + "</p>" : "") +
          '<div class="kh-reihe">' + knopf("messenOk", esc(tx.fertigKnopf), "haupt") + knopf("einmessen", esc(tx.nochmal)) + "</div>";
      }
      return '<h4 class="kh-kopf">🎙 ' + esc(tx.titel) + "</h4>" +
        '<ol class="kh-schritte"><li class="' + (em.schritt === "still" ? "jetzt" : "fertig") + '">' + esc(tx.still) + '</li><li class="' + (em.schritt === "tief" ? "jetzt" : em.tief != null ? "fertig" : "") + '">' + esc(tx.tief) + (em.tief != null ? " ✔ " + esc(tonName(em.tief)) : "") + '</li><li class="' + (em.schritt === "hoch" ? "jetzt" : "") + '">' + esc(tx.hoch) + "</li></ol>" +
        '<div class="kh-mess"><span class="kh-gross-ton kh-m-ton">–</span><span class="kh-m-ring"><i></i></span><span class="kh-klein kh-m-info"></span></div>' +
        '<div class="kh-reihe">' + knopf("menue", esc(T().zurueck)) + "</div>";
    },
    gabel() {
      const tx = T().gabel;
      return '<h4 class="kh-kopf">🎚 ' + esc(tx.titel) + "</h4>" +
        '<div class="kh-gabel leer"><span class="kh-g-ton">–</span><span class="kh-g-skala"><i class="kh-g-zeiger"></i></span><span class="kh-klein kh-g-info">' + esc(tx.leer) + "</span></div>" +
        '<div class="kh-reihe">' + knopf("vorspielen", esc(tx.vorspielen)) + knopf("menue", esc(T().zurueck)) + "</div>";
    },
    buch() {
      const tx = T().buch, b = buchLesen(), L = sprache();
      const toene = Object.keys(b.toene).map(k => ({ k: +k, c: Math.round(b.toene[k].a / Math.max(1e-6, b.toene[k].z)), z: b.toene[k].z })).filter(x => x.z > 2).sort((a, c) => Math.abs(c.c) - Math.abs(a.c));
      let ga = 0, gz = 0; Object.values(b.toene).forEach(x => { ga += x.a; gz += x.z; });
      const name = id => { const l = DATEN.lieder.find(x => x.id === id); if (l) return l.titel[L] || l.titel.de; const u = id.replace(/^u-/, ""); return T().ueb[u] ? T().ueb[u][0] : id; };
      return '<h4 class="kh-kopf">📖 ' + esc(tx.titel) + "</h4>" +
        '<p class="kh-klein"><b>' + esc(tx.umfang) + ":</b> " + esc(gemessen() ? tonName(E.tief) + " – " + tonName(E.hoch) + " (" + (E.hoch - E.tief) + ")" : tx.keinUmfang) + "</p>" +
        "<h5>" + esc(tx.tendenz) + "</h5>" + (toene.length ? '<p class="kh-klein">' + esc(tx.schnitt(Math.round(ga / Math.max(1e-6, gz)))) + "</p><ul class=\"kh-balken\">" + toene.slice(0, 8).map(x => '<li><span>' + esc(tx.ton(T().tonNamen[x.k], x.c)) + '</span><i><b style="left:' + (50 + Math.min(0, klemm(x.c, -50, 50))) + "%;width:" + Math.abs(klemm(x.c, -50, 50)) + '%"></b></i></li>').join("") + "</ul>" : '<p class="kh-klein">' + esc(tx.zuWenig) + "</p>") +
        "<h5>" + esc(tx.auftritte) + "</h5>" + (b.verlauf.length ? '<ul class="kh-verlauf">' + b.verlauf.map(v => "<li><span>" + esc(name(v.id)) + "</span><b>" + (v.p | 0) + " %</b></li>").join("") + "</ul>" : '<p class="kh-klein">' + esc(tx.keine) + "</p>") +
        '<div class="kh-reihe">' + knopf("menue", esc(T().zurueck)) + knopf("buchLeeren", esc(tx.loeschen)) + "</div>";
    },
    einst() {
      const tx = T().einst;
      return '<h4 class="kh-kopf">⚙ ' + esc(tx.titel) + "</h4>" +
        '<div class="kh-zeile2"><span>' + esc(tx.grad) + "</span>" + gradKnoepfe() + "</div>" +
        '<div class="kh-zeile2"><span>' + esc(tx.kopf) + '</span><div class="kh-wahl"><button type="button" role="radio" aria-checked="' + E.kopf + '" data-tun="kopf" data-wert="1">' + esc(tx.kopfJa) + '</button><button type="button" role="radio" aria-checked="' + !E.kopf + '" data-tun="kopf" data-wert="0">' + esc(tx.kopfNein) + "</button></div></div>" +
        '<div class="kh-zeile2"><span>' + esc(tx.fuehr) + '</span><div class="kh-wahl"><button type="button" role="switch" aria-checked="' + E.fuehr + '" data-tun="fuehr"' + (E.kopf ? "" : " disabled") + ">" + esc(E.fuehr && E.kopf ? tx.an : tx.aus) + "</button></div></div>" +
        '<label class="kh-zeile2"><span>' + esc(tx.laut) + '</span><input type="range" min="0" max="1" step="0.05" value="' + E.laut + '" data-regler="laut"></label>' +
        '<label class="kh-zeile2"><span>' + esc(tx.versatz) + ' <output class="kh-ms">' + esc(tx.ms(E.versatz)) + '</output></span><input type="range" min="-150" max="350" step="10" value="' + E.versatz + '" data-regler="versatz"></label>' +
        '<p class="kh-klein">' + esc(tx.versatzInfo) + "</p>" +
        '<div class="kh-reihe">' + knopf("einmessen", esc(T().menue.einmessen)) + knopf("menue", esc(T().zurueck), "haupt") + "</div>";
    },
    mikro() {
      const tx = T().mikro;
      return '<h4 class="kh-kopf">🎙 ' + esc(tx.titel) + "</h4><p>" + esc(tx.text) + "</p>" + (meldung ? '<p class="kh-klein kh-hinweis">' + esc(meldung) + "</p>" : "") +
        '<div class="kh-reihe">' + knopf("mikroOk", esc(tx.knopf), "haupt") + knopf("mikroZurueck", esc(T().zurueck)) + "</div>";
    }
  };
  function einmessAnzeige() { if (ansicht === "einmessen") zeigen(); }
  function einmessLive(e) {
    const el = panel.querySelector(".kh-mess"); if (!el) return;
    const em = einmess;
    el.querySelector(".kh-m-ton").textContent = em.aktuell != null && e.m != null ? tonName(em.aktuell) : "–";
    el.querySelector(".kh-m-ring i").style.transform = "scaleX(" + klemm(em.halten / 50, 0, 1).toFixed(2) + ")";
    el.querySelector(".kh-m-info").textContent = e.m == null ? T().einmessen.nichts : em.halten > 5 ? T().einmessen.halten : "";
  }

  /* ---------- Bedienung ---------- */
  function vorbereiten(st) {
    gewaehlt = { st }; ansicht = "vorher"; zeigen();
    audio();
    const ev = begleitung(st, verschiebung(st)), lz = panel.querySelector(".kh-laden");
    const los = panel.querySelector('[data-tun="los"]');
    if (lz) lz.textContent = T().vorher.laedt;
    if (los) los.disabled = true;
    probenFuer(ev).then(() => {
      if (ansicht !== "vorher" || !gewaehlt || gewaehlt.st !== st) return;
      const l2 = panel.querySelector(".kh-laden"), b2 = panel.querySelector('[data-tun="los"]');
      if (l2) l2.textContent = ""; if (b2) b2.disabled = false;
      gewaehlt.bereit = true;
    });
  }
  function neuZeichnenVorher() {
    if (ansicht !== "vorher") return;
    zeigen();
    if (gewaehlt && gewaehlt.bereit) return;
    const lz = panel.querySelector(".kh-laden"), b2 = panel.querySelector('[data-tun="los"]');
    if (lz) lz.textContent = T().vorher.laedt; if (b2) b2.disabled = true;
  }
  root.addEventListener("click", ev => {
    const b = ev.target.closest("[data-tun]"); if (!b || !root.contains(b) || b.disabled) return;
    const tun = b.dataset.tun, wert = b.dataset.wert;
    audio();
    switch (tun) {
      case "menue": abbrechen(); micAus(); station = null; ansicht = "menue"; zeigen(); break;
      case "tournee": abbrechen(); micAus(); station = null; ansicht = "tournee"; zeigen(); break;
      case "lieder": micAus(); station = null; ansicht = "lieder"; zeigen(); break;
      case "uebungen": micAus(); station = null; ansicht = "uebungen"; zeigen(); break;
      case "buch": ansicht = "buch"; zeigen(); break;
      case "einst": ansicht = "einst"; zeigen(); break;
      case "station": { const i = +wert, s = DATEN.weg[i], l = s && DATEN.lieder.find(x => x.id === s.lied); if (!l) break; station = i; vorbereiten(liedBauen(l)); break; }
      case "lied": { const l = DATEN.lieder.find(x => x.id === wert); if (!l) break; station = null; vorbereiten(liedBauen(l)); break; }
      case "uebung": station = null; vorbereiten(uebungBauen(wert)); break;
      case "grad": E.grad = wert; einstSpeichern(); if (ansicht === "vorher") neuZeichnenVorher(); else zeigen(); break;
      case "trans": { const st = gewaehlt.st; E.trans[st.id] = klemm((E.trans[st.id] | 0) + (+wert), -12, 12); einstSpeichern(); gewaehlt.bereit = false; vorbereiten(st); break; }
      case "fuehr": E.fuehr = !E.fuehr; einstSpeichern(); if (ansicht === "vorher") neuZeichnenVorher(); else zeigen(); break;
      case "kopf": E.kopf = wert === "1"; einstSpeichern(); zeigen(); break;
      case "los": { const st = gewaehlt && gewaehlt.st; if (!st) break; mikroDann(() => starten(st)); break; }
      case "pause": pausieren(); break;
      case "weiter": fortsetzen(); break;
      case "neu": { const st = S && S.st; abbrechen(true); if (st) { const frisch = st.uebung ? uebungBauen(st.uebung) : liedBauen(DATEN.lieder.find(x => x.id === st.id)); starten(frisch); } break; }
      case "aufhoeren": abbrechen(); ansicht = station != null ? "tournee" : "menue"; zeigen(); break;
      case "nochmal": { const st = ergebnis && ergebnis.st; if (!st) break; const frisch = st.uebung ? uebungBauen(st.uebung) : liedBauen(DATEN.lieder.find(x => x.id === st.id)); mikroDann(() => starten(frisch)); break; }
      case "einmessen": { const woher = ansicht === "einmessen" && einmess ? einmess.woher : ansicht; abbrechen(); einmessenStarten(woher); break; }
      case "messenOk": {
        const woher = einmess ? einmess.woher : "menue";
        if (einmess && einmess.tief != null) { E.tief = Math.round(einmess.tief); E.hoch = Math.round(einmess.hoch); einstSpeichern(); }
        einmess = null;
        if (woher === "vorher" && gewaehlt) vorbereiten(gewaehlt.st.uebung ? uebungBauen(gewaehlt.st.uebung) : gewaehlt.st);
        else { ansicht = woher === "einst" ? "einst" : "menue"; zeigen(); }
        break;
      }
      case "gabel": gabelStarten(); break;
      case "vorspielen": if (gabel) { const m = gabel.letzte != null ? gabel.letzte : 57; spielen("harfe", m, ctx.currentTime + .02, .35, 1.6, ausgang); probeLaden(probeName("harfe", m)); } break;
      case "buchLeeren": schreib(K.buch, "{}"); zeigen(); break;
      case "mikroOk": { const w = mikroWartet; meldung = ""; if (w) mikroHolen(w.weiter); break; }
      case "mikroZurueck": { const w = mikroWartet; mikroWartet = null; meldung = ""; ansicht = w && w.zurueck && w.zurueck !== "mikro" ? w.zurueck : "menue"; zeigen(); break; }
    }
  });
  root.addEventListener("input", ev => {
    const r = ev.target.closest("[data-regler]"); if (!r) return;
    if (r.dataset.regler === "laut") { E.laut = +r.value; lautSetzen(); }
    if (r.dataset.regler === "versatz") { E.versatz = +r.value; const o = panel.querySelector(".kh-ms"); if (o) o.textContent = T().einst.ms(E.versatz); }
    einstSpeichern();
  });
  /* Tastatur: Leertaste = Pause/Weiter, Esc = Pause */
  document.addEventListener("keydown", ev => {
    if (!S || root.offsetParent === null) return;
    if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) return;
    if (ev.key === " " || ev.key === "Escape" || ev.key === "p" || ev.key === "P") { ev.preventDefault(); if (S.pause) fortsetzen(); else pausieren(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (S) pausieren(); else if (ansicht === "gabel" || ansicht === "einmessen") { /* Mikrofon freigeben */ micAus(); cancelAnimationFrame(raf); ansicht = "menue"; zeigen(); } } });
  window.addEventListener("resize", () => { if (!S) requestAnimationFrame(ruhebild); });
  new MutationObserver(() => { if (!S) zeigen(); else { $(".kh-pause").setAttribute("aria-label", T().spiel.pause); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Spielesaal: beim Wechsel zu einem anderen Spiel alles anhalten und das Mikrofon freigeben */
  root._stoppen = () => {
    if (S) abbrechen(); micAus(); cancelAnimationFrame(raf);
    if (ansicht === "spiel" || ansicht === "pause" || ansicht === "einmessen" || ansicht === "gabel" || ansicht === "mikro") { ansicht = "menue"; zeigen(); }
  };
  /* Für Tests und Vorschaubilder: eine künstliche Stimme einspeisen */
  root._test = {
    stimme(fn) { testStimme = fn; micAus(); },
    zustand: () => ({ ansicht, S, ergebnis }),
    lied: id => { const l = DATEN.lieder.find(x => x.id === id); return l ? liedBauen(l) : null; },
    uebung: a => uebungBauen(a),
    starten: st => starten(st), ansicht: a => { ansicht = a; zeigen(); }
  };

  /* =================================================================
     AUSSEHEN
     ================================================================= */
  const css = document.createElement("style");
  css.textContent = `
.kehle { grid-column: 1 / -1; }
.kh-buehne { position: relative; width: 100%; max-width: 980px; margin: 0 auto; height: clamp(360px, 60vw, 520px); border: 1px solid var(--line); background: #120e16; overflow: hidden; }
#taverne.saal-einzeln .kehle:not(.tav-voll) .kh-buehne { height: clamp(360px, var(--sh), 640px); }
.kehle.tav-voll .kh-buehne { height: max(340px, calc(100vh - 12rem)); }
@supports (height: 100dvh) { .kehle.tav-voll .kh-buehne { height: max(340px, calc(100dvh - 12rem)); } }
.kehle.kh-spielt > .label, .kehle.kh-spielt > h3, .kehle.kh-spielt > .tav-info { display: none; }
.kh-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.kh-panel { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: clamp(.8rem, 3vw, 1.6rem); background: linear-gradient(180deg, rgba(16,12,20,.86), rgba(16,12,20,.94)); }
.kh-panel[hidden] { display: none; }
.kh-karte { max-width: 560px; margin: 0 auto; display: grid; gap: .65rem; }
.kh-karte > * { margin: 0; }
.kh-kopf { font-family: var(--display); font-weight: 400; font-size: 1.35rem; color: var(--vellum); letter-spacing: .02em; }
.kh-kopf small { font-family: var(--body); font-size: .85rem; color: var(--ember); }
.kh-lied { font-family: var(--name); font-weight: 400; font-size: 1.3rem; color: #ffd27a; }
.kh-karte h5 { margin: .4rem 0 0; font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ember); font-weight: 600; }
.kh-klein { font-size: .86rem; color: var(--ash); line-height: 1.45; }
.kh-hinweis { color: #ffd27a; }
.kh-privat { font-size: .78rem; }
.kh-zitat { font-family: var(--name); font-style: italic; font-size: 1.02rem; line-height: 1.45; color: var(--vellum); border-left: 2px solid var(--ember); padding-left: .7rem; }
.kh-raster { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.kh-gross { display: grid; gap: .2rem; text-align: left; padding: .75rem .85rem; border: 1px solid var(--line); background: rgba(224,160,70,.06); color: var(--vellum); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.kh-gross b { font-weight: 600; font-size: .98rem; }
.kh-gross small { font-size: .78rem; color: var(--ash); line-height: 1.35; }
.kh-gross.haupt { grid-column: 1 / -1; border-color: var(--ember); background: linear-gradient(135deg, rgba(224,160,70,.2), rgba(224,160,70,.05)); }
.kh-gross.haupt b { color: #ffd27a; font-size: 1.08rem; }
.kh-gross:hover, .kh-gross:focus-visible, .kh-eintrag:hover:not(:disabled), .kh-eintrag:focus-visible { border-color: var(--ember); background: rgba(224,160,70,.14); }
.kh-reihe { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; }
.kh-reihe.senk { flex-direction: column; align-items: stretch; max-width: 260px; margin: 0 auto; width: 100%; }
.kh-reihe .tav-knopf { touch-action: manipulation; }
.kh-reihe .tav-knopf.haupt, .kh-karte .tav-knopf.haupt { background: var(--ember); color: var(--night); }
.kh-reihe .tav-knopf:disabled { opacity: .45; cursor: progress; }
.kh-liste { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }
.kh-eintrag { width: 100%; display: flex; align-items: center; gap: .7rem; text-align: left; padding: .55rem .7rem; border: 1px solid var(--line); background: rgba(255,255,255,.02); color: var(--vellum); font: inherit; cursor: pointer; touch-action: manipulation; }
.kh-eintrag.zu { opacity: .5; cursor: default; }
.kh-nr { flex: none; width: 1.8rem; height: 1.8rem; display: grid; place-items: center; border: 1px solid var(--ember); color: var(--ember); font-family: var(--display); font-size: .95rem; border-radius: 50%; }
.kh-was { flex: 1; display: grid; gap: .1rem; min-width: 0; }
.kh-was b { font-weight: 600; font-size: .95rem; }
.kh-was small { font-size: .78rem; color: var(--ash); }
.kh-sterne { flex: none; letter-spacing: .05em; font-size: 1rem; }
.kh-sterne i { font-style: normal; color: rgba(235,226,204,.2); }
.kh-sterne i.voll { color: #ffd27a; text-shadow: 0 0 8px rgba(255,210,122,.5); }
.kh-karte > .kh-sterne { justify-self: center; font-size: 1.6rem; }
.kh-zeile2 { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem .8rem; font-size: .88rem; color: var(--vellum); }
.kh-zeile2 input[type=range] { flex: 1 1 180px; accent-color: #e0a046; }
.kh-wahl { display: inline-flex; flex-wrap: wrap; gap: .3rem; align-items: center; }
.kh-wahl button { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .84rem; padding: .35rem .7rem; cursor: pointer; min-width: 2.2rem; touch-action: manipulation; }
.kh-wahl button[aria-checked="true"] { border-color: var(--ember); background: rgba(224,160,70,.2); color: #ffd27a; }
.kh-wahl button:disabled { opacity: .45; }
.kh-wahl output { min-width: 6.5rem; text-align: center; font-size: .86rem; color: #ffd27a; }
.kh-pct { display: grid; justify-items: center; gap: .1rem; }
.kh-pct b { font-family: var(--display); font-weight: 400; font-size: clamp(2.6rem, 10vw, 3.6rem); line-height: 1; color: #ffd27a; text-shadow: 0 0 24px rgba(255,210,122,.35); }
.kh-pct b small { font-size: .45em; }
.kh-pct span { font-size: .85rem; color: var(--ash); }
.kh-neu { color: #9fe08f; font-weight: 600; font-size: .92rem; }
.kh-wurf { display: flex; align-items: center; gap: .7rem; font-size: .88rem; color: var(--vellum); }
.kh-w20 { flex: none; width: 3.2rem; height: 3.2rem; display: grid; place-items: center; font-family: var(--display); font-size: 1.5rem; color: var(--night); background: var(--ember); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); animation: khRoll .9s cubic-bezier(.3,1.4,.5,1); }
.kh-w20.krit { background: #ffd27a; } .kh-w20.patzer { background: var(--blood); color: var(--vellum); }
@keyframes khRoll { from { transform: rotate(-540deg) scale(.3); } }
.kh-hud { position: absolute; z-index: 2; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: .6rem; padding: .45rem .6rem .55rem; background: linear-gradient(180deg, rgba(14,11,18,.9), rgba(14,11,18,0)); pointer-events: none; }
.kh-hud[hidden] { display: none; }
.kehle.hat-voll.kh-spielt:not(.tav-voll) .kh-hud { padding-right: 3.6rem; }
.kh-hud-titel { flex: 1; min-width: 0; font-family: var(--name); font-weight: 400; font-size: .98rem; color: var(--vellum); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kh-hud-punkte { font-family: var(--display); font-size: 1.15rem; color: #ffd27a; font-variant-numeric: tabular-nums; min-width: 3.5rem; text-align: right; }
.kh-pause { pointer-events: auto; width: 2.1rem; height: 2.1rem; display: grid; place-items: center; border: 1px solid var(--line); background: rgba(9,8,15,.6); color: var(--ember); font-size: .95rem; cursor: pointer; touch-action: manipulation; }
.kh-fort { position: absolute; left: .6rem; right: .6rem; bottom: .25rem; height: 2px; background: rgba(235,226,204,.1); }
.kh-fort i { display: block; height: 100%; background: var(--ember); transform-origin: 0 50%; transform: scaleX(0); }
.kh-pegel { width: 5px; height: 1.3rem; background: rgba(235,226,204,.1); display: flex; align-items: flex-end; }
.kh-pegel i { display: block; width: 100%; height: 100%; background: #9fe08f; transform-origin: 50% 100%; transform: scaleY(0); }
.kh-text { max-width: 980px; margin: .55rem auto 0; text-align: center; min-height: 3.6em; }
.kh-text[hidden] { display: none; }
.kh-zeile { margin: 0; line-height: 1.35; }
.kh-zeile.jetzt { font-family: var(--name); font-size: clamp(1.15rem, 4.2vw, 1.55rem); color: rgba(235,226,204,.55); }
.kh-zeile.dann { font-size: clamp(.85rem, 3vw, 1rem); color: rgba(235,226,204,.35); margin-top: .15rem; }
.kh-zeile span { transition: color .12s; }
.kh-zeile.jetzt span.dran { color: #fff3d6; text-shadow: 0 0 12px rgba(255,210,122,.6); }
.kh-zeile.jetzt span.gut { color: #ffd27a; }
.kh-zeile.jetzt span.mies { color: #c98b7f; }
.kh-vor { color: #5fd6b8; font-style: italic; }
.kh-schritte { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; font-size: .9rem; color: var(--ash); }
.kh-schritte li.jetzt { color: #ffd27a; font-weight: 600; }
.kh-schritte li.fertig { color: #9fe08f; }
.kh-mess, .kh-gabel { display: grid; justify-items: center; gap: .5rem; padding: .6rem 0; }
.kh-gross-ton, .kh-g-ton { font-family: var(--display); font-size: clamp(2.6rem, 12vw, 4rem); line-height: 1; color: #ffd27a; text-align: center; }
.kh-m-ring { width: min(260px, 80%); height: 8px; border: 1px solid var(--line); background: rgba(0,0,0,.4); }
.kh-m-ring i { display: block; height: 100%; background: linear-gradient(90deg, #9fe08f, #ffd27a); transform-origin: 0 50%; transform: scaleX(0); transition: transform .1s; }
.kh-g-skala { position: relative; width: min(320px, 90%); height: 34px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, transparent 49.5%, rgba(159,224,143,.6) 49.5%, rgba(159,224,143,.6) 50.5%, transparent 50.5%), linear-gradient(90deg, rgba(208,106,90,.12), rgba(159,224,143,.18) 40%, rgba(159,224,143,.18) 60%, rgba(208,106,90,.12)); }
.kh-g-zeiger { position: absolute; left: calc(50% - 2px); top: 0; width: 4px; height: 100%; background: #ffd27a; transition: transform .08s linear; display: block; }
.kh-gabel[data-genau="1"] .kh-g-ton { color: #9fe08f; }
.kh-gabel.leer .kh-g-zeiger { opacity: .2; }
.kh-balken, .kh-verlauf { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; font-size: .85rem; }
.kh-balken li { display: grid; grid-template-columns: 1fr 120px; align-items: center; gap: .6rem; }
.kh-balken i { position: relative; height: 8px; background: rgba(235,226,204,.08); }
.kh-balken i::before { content: ""; position: absolute; left: 50%; top: -2px; width: 1px; height: 12px; background: rgba(235,226,204,.4); }
.kh-balken i b { position: absolute; top: 0; height: 100%; background: #e8a24a; }
.kh-verlauf li { display: flex; justify-content: space-between; gap: .5rem; border-bottom: 1px solid rgba(224,160,70,.1); padding-bottom: .2rem; }
.kh-verlauf b { color: #ffd27a; font-weight: 600; }
@media (max-width: 520px) {
  .kh-raster { grid-template-columns: 1fr; }
  .kh-buehne { height: clamp(380px, 118vw, 560px); }
  .kh-zeile2 { font-size: .84rem; }
}
`;
  document.head.appendChild(css);

  zeigen();
})();
