/* =====================================================================
   BARRADINS GOLDENE KEHLE – Gesangsspiel in der Taverne
   ---------------------------------------------------------------------
   Notenblöcke ziehen von rechts nach links, das Mikrofon hört zu:
   Die Tonhöhe wird direkt im Browser erkannt (McLeod-Verfahren, NSDF),
   nichts wird hochgeladen. Die Aufnahme zum Anhören bleibt nur im
   Arbeitsspeicher und ist nach dem Neuladen weg.
   - Oktave egal: Wer eine Oktave tiefer oder höher singt, trifft trotzdem.
   - Stimme einmessen → Lieder rutschen automatisch in die eigene Lage.
   - Tournee (10 Bühnen), Spott-Duelle, Liederbuch (+ Melodie von der Bühne),
     Übungsraum (Einsingen, Ton halten, Echos Ruf, Sprünge, Bordun, Atem),
     tägliches Einsingen, Stimmgabel mit Bordun, Stimmbuch mit Verlauf.
   - Publikum, das mitgeht (Rosen, Münzen – oder Heringe), Bardische
     Inspiration (W6 rettet eine Zeile), Schnörkel-Noten (Vibrato = Bonus),
     Atemzeichen, Aufnahme anhören, Verzögerung messen, Bestenliste.
   Lieder: kehle-lieder.js · Duelle: kehle-duelle.js
   ===================================================================== */
(function () {
  "use strict";
  const root = document.getElementById("kehle");
  if (!root) return;
  const DATEN = window.KEHLE_LIEDER || { lieder: [], weg: [] };
  const DUELLE = window.KEHLE_DUELLE || [];
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let zufallsquelle = Math.random;
  const zufall = l => l[Math.floor(zufallsquelle() * l.length)];
  const klemm = (v, a, b) => Math.max(a, Math.min(b, v));
  const lies = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const json = k => { try { const v = JSON.parse(lies(k) || "null"); return v && typeof v === "object" ? v : null; } catch (_) { return null; } };
  const ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heute = (d) => { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  /* kleiner Würfelbecher mit Startwert (für das tägliche Einsingen: jeden Tag gleich) */
  function becher(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* =================================================================
     TEXTE
     ================================================================= */
  const TX = {
    de: {
      label: "Gesangsspiel", titel: "Barradins goldene Kehle",
      text: "Sing mit Barradin! Die Notenblöcke ziehen vorbei, dein Mikrofon hört zu – triff die Töne, und das Publikum liegt dir zu Füßen. Am besten mit Kopfhörern.",
      menueKopf: "🎙 Bühne frei, Barde!",
      menue: { tournee: "▶ Die Tournee", duelle: "⚔ Spott-Duelle", lieder: "🎵 Liederbuch", uebungen: "🎯 Übungsraum", taeglich: "☀ Tägliches Einsingen", gabel: "🎚 Stimmgabel", buch: "📖 Stimmbuch", einst: "⚙ Einstellungen", einmessen: "🎙 Stimme einmessen" },
      tourneeInfo: (s, r) => "★ " + s + "/" + (DATEN.weg.length * 3) + " · " + r,
      duellInfo: (g, n) => g + " von " + n + " besiegt",
      taeglichInfo: (s, fertig) => (fertig ? "✔ Heute erledigt" : "3 Minuten") + (s ? " · 🔥 " + s + (s === 1 ? " Tag" : " Tage") : ""),
      stimme: (a, b) => "Deine Stimme: " + a + " bis " + b,
      nichtGemessen: "Deine Stimme ist noch nicht eingemessen – dauert eine halbe Minute.",
      privat: "Deine Stimme wird nur hier auf deinem Gerät ausgewertet. Nichts wird hochgeladen; die Aufnahme zum Anhören verschwindet beim Neuladen.",
      kopfTipp: "🎧 Mit Kopfhörern hört das Mikrofon nur dich – nicht die Musik.",
      zurueck: "← Zurück", menueKnopf: "☰ Menü", lieder: n => n + " Lieder",
      grade: { leicht: "🍺 Leicht", mittel: "👑 Mittel", schwer: "🐉 Schwer" },
      raenge: ["Kneipensänger", "Hafenbarde", "Schlossbarde", "Hofsänger", "Drachenbezwinger", "Goldene Kehle"],
      tourneeTitel: "Die Tournee", tourneeText: "Vom Hafen in Neverwinter bis vor Themberchauds Goldberg – jede Bühne ein Kapitel unserer Kampagne. Ab einem Stern geht's weiter.",
      gesperrt: "🔒 Erst die Bühne davor schaffen",
      duelleTitel: "Spott-Duelle", duelleText: "Der Gegner singt seine Drohung, du antwortest. Jede gut gesungene Zeile kostet ihn Lebenspunkte – jede Drohung kostet dich Fassung. Wer zuerst einknickt, verliert.",
      besiegt: "🏆 besiegt", offen: "noch offen",
      liederTitel: "Liederbuch", liederText: "Alle Lieder zum freien Singen. Je mehr Noten (♪), desto anspruchsvoller.",
      buehnenLied: t => "🪕 Von der Bühne: „" + t + "“", buehnenInfo: "Die Melodie, die gerade auf Barradins Bühne eingestellt ist – zum Mitsingen auf „la“.",
      bestwert: p => "Bestwert " + p + " %",
      uebTitel: "Übungsraum", uebText: "Kurze Übungen, passend zu deinem Stimmumfang.",
      ueb: {
        tonleiter: ["Einsingen", "Tonleiter rauf und runter – Do, Re, Mi … jedes Mal einen Ton höher."],
        halten: ["Ton halten", "Sechs lange Töne auf „Oh“. Ruhig atmen, gerade halten, nicht wackeln."],
        echo: ["Echos Ruf", "Echo spielt auf der Flöte vor, du singst nach – ganz ohne Führstimme."],
        spruenge: ["Sprünge", "Terz, Quinte, Oktave: Töne sauber treffen, auch wenn sie weit weg liegen."],
        bordun: ["Über dem Bordun", "Ein tiefer Dauerton wie ein Didgeridoo – du singst Quinte, Terz, Oktave dazu und hörst, wie die Töne einrasten."],
        atem: ["Langer Atem", "Einen Ton so lange halten, wie die Luft reicht. Das Stimmbuch merkt sich deinen besten Wert."],
        taeglich: ["Tägliches Einsingen", "Jeden Tag eine neue Mischung aus allen Übungen, etwa drei Minuten."],
        gabel: ["Stimmgabel", "Zeigt live, welchen Ton du singst – mit Bordun auch das Intervall dazu."]
      },
      silben: { tonleiter: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si", "Do"], halten: "Oh", echo: "Lu", spruenge: "La", vor: "♪", la: "la" },
      intervalle: ["Grundton", "kl. Sekunde", "Sekunde", "kl. Terz", "Terz", "Quarte", "Tritonus", "Quinte", "kl. Sexte", "Sexte", "kl. Septime", "Septime", "Oktave"],
      echoZeile: "♪ Echo spielt vor …",
      vorher: { ort: "Bühne", publikum: "Publikum", sg: sg => "Schwierigkeitsgrad " + sg, tonart: "Tonlage", auto: "angepasst", fuehr: "Führstimme",
        fuehrAus: "Ohne Kopfhörer bleibt die Führstimme aus – sonst hört das Mikrofon den Chor statt dich.", los: "▶ Los!", laedt: "🎻 Instrumente werden gestimmt …",
        messen: "Erst Stimme einmessen", messenTipp: "Tipp: Miss zuerst deine Stimme ein – dann liegen die Lieder genau in deiner Lage.", deutsch: "",
        grundton: "Grundton", leiter: "Tonleiter", dur: "Dur", moll: "Moll", gegner: "Gegner", schnoerkel: "✦ = Schnörkel-Note: Mit schönem Vibrato gibt's Bonuspunkte." },
      spiel: { pause: "Pause", pausiert: "Pausiert", weiter: "▶ Weiter", neu: "↻ Von vorn", aufhoeren: "Aufhören", leise: "Ich höre dich nicht – näher ans Mikrofon?",
        urteil: { perfekt: "Meisterhaft!", gut: "Gut!", knapp: "Knapp …", daneben: "Daneben!" }, serie: n => n + "× in Folge!", schnoerkel: "✦ Schnörkel!",
        insp: "Bardische Inspiration", inspWurf: (w, p) => "🎲 " + w + " – Inspiration! +" + p + " %", inspLeer: "Erst eine Zeile singen …",
        stopp: "■ Stopp", wiedergabe: "🎧 Wiedergabe" },
      duell: { fassung: "Barradin", runde: n => "Runde " + n, ko: "K.O.!", einknick: "Barradin verliert die Fassung …", gegnerLeben: "Lebenspunkte",
        sieg: "Sieg!", pleite: "Niederlage", rest: (n, h) => n + " hat noch " + h + " Lebenspunkte.", deutsch: "" },
      erg: { punkte: "Punkte", getroffen: (a, b) => a + " von " + b + " Tönen getroffen", rekord: "Neuer Bestwert!", bisher: p => "Bisher bester Wert: " + p + " %",
        wurf: (w, b, s, sg) => "Auftrittswurf: W20 " + w + " + " + b + " Kehle = " + s + (sg ? " gegen SG " + sg : ""), krit: "Natürliche 20!", patzer: "Natürliche 1 …",
        nochmal: "↻ Nochmal", naechste: "▶ Nächste Bühne", tournee: "Zur Tournee", duelle: "Zu den Duellen", neuFrei: "Neue Bühne freigespielt!", zuTief: c => "Du lagst im Schnitt " + c + " Cent zu tief.",
        zuHoch: c => "Du lagst im Schnitt " + c + " Cent zu hoch.", mittig: "Im Schnitt fast genau auf dem Ton – stark!", stumm: "Ich habe kaum etwas gehört. Ist das Mikrofon an?",
        anhoeren: "🎧 Anhören", schnoerkel: n => "✦ " + n + (n === 1 ? " Schnörkel" : " Schnörkel"), strähne: n => "🔥 " + n + (n === 1 ? " Tag" : " Tage") + " in Folge eingesungen!" },
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
      gabel: { titel: "Stimmgabel", leer: "Sing einen Ton …", vorspielen: "🔔 Ton vorspielen", hz: f => f + " Hz", cent: c => (c > 0 ? "+" : "") + c + " Cent", genau: "genau!", tief: "zu tief", hoch: "zu hoch",
        bordunAn: "🎵 Bordun an", bordunAus: "🎵 Bordun aus", bordunTipp: "Mit Bordun am besten Kopfhörer – sonst hört das Mikrofon den Dauerton." },
      atem: { titel: "Langer Atem", bereit: "Tief einatmen – und dann einen bequemen Ton auf „Ooo“ halten, so lange es geht.", laeuft: "Halten …", fertig: s => "Geschafft: " + s + " Sekunden!",
        ruhig: c => "Ruhe im Ton: ±" + c + " Cent", rekord: "Neuer Rekord!", bester: s => "Bester Wert: " + s + " s", nochmal: "↻ Nochmal" },
      latenz: { titel: "Verzögerung messen", text: "Setz die Kopfhörer auf, mit denen du singst. Gleich hörst du acht Klicks – sing bei jedem Klick ganz kurz „Ta!“, genau im Takt.",
        los: "▶ Messen", hoeren: "Erst zuhören …", mit: (n, m) => "„Ta!“ – " + n + " / " + m, fertig: ms => "Gemessen: " + ms + " ms", zuWenig: "Zu wenig erkannt – sing ruhig etwas lauter und noch einmal.",
        uebernehmen: "✔ Übernehmen", nochmal: "↻ Nochmal" },
      buch: { titel: "Stimmbuch", umfang: "Stimmumfang", keinUmfang: "noch nicht eingemessen", auftritte: "Letzte Auftritte", keine: "Noch keine Auftritte – auf geht's!",
        verlauf: "Deine Treffsicherheit (letzte 30 Tage)", verlaufLeer: "Sing an ein paar Tagen, dann siehst du hier deine Kurve.", atem: s => "Längster Atem: " + s + " s", streak: n => "Einsingen: 🔥 " + n + (n === 1 ? " Tag" : " Tage") + " in Folge",
        tendenz: "Wo du danebenliegst", zuWenig: "Sing noch ein paar Lieder, dann sehe ich mehr.", ton: (n, c) => n + ": " + (Math.abs(c) < 8 ? "fast genau" : Math.abs(c) + " Cent " + (c < 0 ? "zu tief" : "zu hoch")),
        schnitt: c => "Insgesamt: " + (Math.abs(c) < 8 ? "fast genau auf dem Ton" : "im Schnitt " + Math.abs(c) + " Cent " + (c < 0 ? "zu tief" : "zu hoch")), loeschen: "Stimmbuch leeren" },
      einst: { titel: "Einstellungen", grad: "Schwierigkeit", kopf: "Kopfhörer", kopfJa: "🎧 Ja", kopfNein: "🔈 Nein", kopfInfo: "Ohne Kopfhörer schaltet das Spiel die Echo-Unterdrückung des Browsers ein und spielt leiser.",
        fuehr: "Führstimme", an: "An", aus: "Aus", aufnahme: "Aufnahme zum Anhören", publikum: "Publikum",
        laut: "Lautstärke der Musik", versatz: "Verzögerung ausgleichen", versatzInfo: "Mit Bluetooth-Kopfhörern kommt die Musik später an. Am einfachsten automatisch messen.", messen: "🎯 Automatisch messen", ms: v => v + " ms" },
      liste: { titel: "🏆 Bestenliste", leer: "Noch niemand – sei die erste Legende!", nurHier: "Server nicht erreichbar – nur auf diesem Gerät.", eintragen: "🏆 Eintragen", sendet: "Wird eingetragen …",
        eingetragen: p => "Eingetragen – Platz " + p + "!", eingetragenOhne: "Eingetragen!", fehler: "Eintrag hat nicht geklappt – bitte später nochmal.", spalten: ["#", "Name", "%", "Wurf"] },
      mikro: { titel: "Barradin braucht dein Mikrofon", text: "Damit das Spiel hört, welchen Ton du singst, fragt dein Browser gleich nach dem Mikrofon. Ausgewertet wird nur auf deinem Gerät – nichts wird hochgeladen.",
        knopf: "🎙 Mikrofon erlauben", verweigert: "Das Mikrofon ist blockiert. Erlaube es in den Seiteneinstellungen deines Browsers (Schloss-Symbol neben der Adresse) und versuch es noch einmal.",
        fehlt: "Dieser Browser kann hier leider nicht aufs Mikrofon zugreifen.", belegt: "Das Mikrofon wird gerade von einer anderen App benutzt." },
      tonNamen: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B", "H"]
    },
    en: {
      label: "Singing game", titel: "Barradin's Golden Throat",
      text: "Sing with Barradin! The note blocks scroll by and your microphone listens – hit the notes and the crowd is yours. Best with headphones.",
      menueKopf: "🎙 The stage is yours, bard!",
      menue: { tournee: "▶ The Tour", duelle: "⚔ Mockery duels", lieder: "🎵 Songbook", uebungen: "🎯 Practice room", taeglich: "☀ Daily warm-up", gabel: "🎚 Tuning fork", buch: "📖 Voice book", einst: "⚙ Settings", einmessen: "🎙 Measure my voice" },
      tourneeInfo: (s, r) => "★ " + s + "/" + (DATEN.weg.length * 3) + " · " + r,
      duellInfo: (g, n) => g + " of " + n + " defeated",
      taeglichInfo: (s, fertig) => (fertig ? "✔ Done today" : "3 minutes") + (s ? " · 🔥 " + s + (s === 1 ? " day" : " days") : ""),
      stimme: (a, b) => "Your voice: " + a + " to " + b,
      nichtGemessen: "Your voice hasn't been measured yet – takes half a minute.",
      privat: "Your voice is analysed only here on your device. Nothing is uploaded; the playback recording disappears when you reload.",
      kopfTipp: "🎧 With headphones the microphone hears only you – not the music.",
      zurueck: "← Back", menueKnopf: "☰ Menu", lieder: n => n + " songs",
      grade: { leicht: "🍺 Easy", mittel: "👑 Medium", schwer: "🐉 Hard" },
      raenge: ["Pub singer", "Harbour bard", "Castle bard", "Court singer", "Dragon tamer", "Golden Throat"],
      tourneeTitel: "The Tour", tourneeText: "From the harbour of Neverwinter to Themberchaud's mountain of gold – every stage a chapter of our campaign. One star unlocks the next.",
      gesperrt: "🔒 Clear the stage before first",
      duelleTitel: "Mockery duels", duelleText: "The foe sings his threat, you answer. Every well-sung line costs him hit points – every threat costs you composure. Whoever cracks first loses. (Duel lyrics are German.)",
      besiegt: "🏆 defeated", offen: "still open",
      liederTitel: "Songbook", liederText: "Every song for free singing. More notes (♪) means harder.",
      buehnenLied: t => "🪕 From the stage: „" + t + "“", buehnenInfo: "The melody currently set up on Barradin's stage – sing along on „la“.",
      bestwert: p => "Best " + p + " %",
      uebTitel: "Practice room", uebText: "Short exercises that fit your vocal range.",
      ueb: {
        tonleiter: ["Warm-up", "Scale up and down – do, re, mi … one step higher each time."],
        halten: ["Hold the note", "Six long notes on „oh“. Breathe calmly, keep it steady, no wobbling."],
        echo: ["Echo's call", "Echo plays a phrase on his flute, you sing it back – no guide voice."],
        spruenge: ["Leaps", "Third, fifth, octave: hit notes cleanly even when they're far apart."],
        bordun: ["Over the drone", "A low sustained tone like a didgeridoo – you sing fifth, third, octave above it and hear the notes lock in."],
        atem: ["Long breath", "Hold one note as long as your air lasts. The voice book remembers your best."],
        taeglich: ["Daily warm-up", "A new mix of every exercise each day, about three minutes."],
        gabel: ["Tuning fork", "Shows live which note you're singing – with the drone, the interval too."]
      },
      silben: { tonleiter: ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do"], halten: "Oh", echo: "Lu", spruenge: "La", vor: "♪", la: "la" },
      intervalle: ["Root", "minor 2nd", "2nd", "minor 3rd", "3rd", "4th", "tritone", "5th", "minor 6th", "6th", "minor 7th", "7th", "octave"],
      echoZeile: "♪ Echo plays first …",
      vorher: { ort: "Stage", publikum: "Audience", sg: sg => "Difficulty class " + sg, tonart: "Key", auto: "adjusted", fuehr: "Guide voice",
        fuehrAus: "Without headphones the guide voice stays off – otherwise the microphone hears the choir instead of you.", los: "▶ Go!", laedt: "🎻 Tuning the instruments …",
        messen: "Measure my voice first", messenTipp: "Tip: measure your voice first – then the songs sit right in your range.", deutsch: "Lyrics in German – singing along on „la“ counts too.",
        grundton: "Root", leiter: "Scale", dur: "Major", moll: "Minor", gegner: "Foe", schnoerkel: "✦ = flourish note: sing it with a nice vibrato for bonus points." },
      spiel: { pause: "Pause", pausiert: "Paused", weiter: "▶ Continue", neu: "↻ Restart", aufhoeren: "Stop", leise: "I can't hear you – closer to the mic?",
        urteil: { perfekt: "Masterful!", gut: "Good!", knapp: "Close …", daneben: "Missed!" }, serie: n => n + " in a row!", schnoerkel: "✦ Flourish!",
        insp: "Bardic Inspiration", inspWurf: (w, p) => "🎲 " + w + " – Inspiration! +" + p + " %", inspLeer: "Sing a line first …",
        stopp: "■ Stop", wiedergabe: "🎧 Playback" },
      duell: { fassung: "Barradin", runde: n => "Round " + n, ko: "K.O.!", einknick: "Barradin loses his composure …", gegnerLeben: "Hit points",
        sieg: "Victory!", pleite: "Defeat", rest: (n, h) => n + " still has " + h + " hit points.", deutsch: "Duel lyrics are German – singing on „la“ counts too." },
      erg: { punkte: "Points", getroffen: (a, b) => a + " of " + b + " notes hit", rekord: "New best!", bisher: p => "Previous best: " + p + " %",
        wurf: (w, b, s, sg) => "Performance check: d20 " + w + " + " + b + " throat = " + s + (sg ? " vs DC " + sg : ""), krit: "Natural 20!", patzer: "Natural 1 …",
        nochmal: "↻ Again", naechste: "▶ Next stage", tournee: "To the tour", duelle: "To the duels", neuFrei: "New stage unlocked!", zuTief: c => "On average you were " + c + " cents flat.",
        zuHoch: c => "On average you were " + c + " cents sharp.", mittig: "On average almost spot on – great!", stumm: "I barely heard anything. Is the microphone on?",
        anhoeren: "🎧 Listen back", schnoerkel: n => "✦ " + n + (n === 1 ? " flourish" : " flourishes"), strähne: n => "🔥 " + n + (n === 1 ? " day" : " days") + " of warm-ups in a row!" },
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
      gabel: { titel: "Tuning fork", leer: "Sing a note …", vorspielen: "🔔 Play the note", hz: f => f + " Hz", cent: c => (c > 0 ? "+" : "") + c + " cents", genau: "spot on!", tief: "flat", hoch: "sharp",
        bordunAn: "🎵 Drone on", bordunAus: "🎵 Drone off", bordunTipp: "Use headphones with the drone – otherwise the microphone hears the drone." },
      atem: { titel: "Long breath", bereit: "Breathe in deeply – then hold a comfortable note on „ooh“ as long as you can.", laeuft: "Hold …", fertig: s => "Done: " + s + " seconds!",
        ruhig: c => "Steadiness: ±" + c + " cents", rekord: "New record!", bester: s => "Best: " + s + " s", nochmal: "↻ Again" },
      latenz: { titel: "Measure latency", text: "Put on the headphones you sing with. You'll hear eight clicks – sing a short „ta!“ on every click, right in time.",
        los: "▶ Measure", hoeren: "Listen first …", mit: (n, m) => "„Ta!“ – " + n + " / " + m, fertig: ms => "Measured: " + ms + " ms", zuWenig: "Too little detected – sing a bit louder and try again.",
        uebernehmen: "✔ Use this", nochmal: "↻ Again" },
      buch: { titel: "Voice book", umfang: "Vocal range", keinUmfang: "not measured yet", auftritte: "Recent performances", keine: "No performances yet – off you go!",
        verlauf: "Your accuracy (last 30 days)", verlaufLeer: "Sing on a few days and your curve appears here.", atem: s => "Longest breath: " + s + " s", streak: n => "Warm-ups: 🔥 " + n + (n === 1 ? " day" : " days") + " in a row",
        tendenz: "Where you drift", zuWenig: "Sing a few more songs, then I'll see more.", ton: (n, c) => n + ": " + (Math.abs(c) < 8 ? "almost spot on" : Math.abs(c) + " cents " + (c < 0 ? "flat" : "sharp")),
        schnitt: c => "Overall: " + (Math.abs(c) < 8 ? "almost spot on" : "on average " + Math.abs(c) + " cents " + (c < 0 ? "flat" : "sharp")), loeschen: "Clear voice book" },
      einst: { titel: "Settings", grad: "Difficulty", kopf: "Headphones", kopfJa: "🎧 Yes", kopfNein: "🔈 No", kopfInfo: "Without headphones the game turns on the browser's echo cancellation and plays more quietly.",
        fuehr: "Guide voice", an: "On", aus: "Off", aufnahme: "Recording for playback", publikum: "Audience",
        laut: "Music volume", versatz: "Latency compensation", versatzInfo: "With Bluetooth headphones the music arrives later. Easiest: measure it automatically.", messen: "🎯 Measure automatically", ms: v => v + " ms" },
      liste: { titel: "🏆 Leaderboard", leer: "Nobody yet – be the first legend!", nurHier: "Server unreachable – only on this device.", eintragen: "🏆 Submit", sendet: "Submitting …",
        eingetragen: p => "Submitted – rank " + p + "!", eingetragenOhne: "Submitted!", fehler: "Didn't work – please try again later.", spalten: ["#", "Name", "%", "Roll"] },
      mikro: { titel: "Barradin needs your microphone", text: "So the game can hear which note you sing, your browser will ask for the microphone. Everything is analysed on your device – nothing is uploaded.",
        knopf: "🎙 Allow microphone", verweigert: "The microphone is blocked. Allow it in your browser's site settings (lock icon next to the address) and try again.",
        fehlt: "This browser can't access the microphone here.", belegt: "The microphone is being used by another app." },
      tonNamen: ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
    }
  };
  const T = () => TX[sprache()];

  /* =================================================================
     EINSTELLUNGEN UND SPEICHER
     ================================================================= */
  const K = { einst: "imres-kehle-einst", weg: "imres-kehle-weg", rekorde: "imres-kehle-rekorde", buch: "imres-kehle-buch", duelle: "imres-kehle-duelle", liste: "imres-kehle-liste" };
  const E = Object.assign({ grad: "mittel", kopf: true, fuehr: true, laut: .8, versatz: 0, tief: null, hoch: null, boden: null, trans: {}, aufnahme: true, publikum: true, bordunTon: null, bordunModus: "moll" }, json(K.einst) || {});
  if (!E.trans || typeof E.trans !== "object") E.trans = {};
  if (!["leicht", "mittel", "schwer"].includes(E.grad)) E.grad = "mittel";
  const einstSpeichern = () => schreib(K.einst, JSON.stringify(E));
  const TOL = { leicht: 75, mittel: 50, schwer: 30 };
  const gemessen = () => typeof E.tief === "number" && typeof E.hoch === "number" && E.hoch > E.tief;
  function wegLesen() { const w = json(K.weg) || {}; return { frei: w.frei | 0, sterne: Array.isArray(w.sterne) ? w.sterne.map(x => klemm(x | 0, 0, 3)) : [] }; }
  const wegSchreiben = w => schreib(K.weg, JSON.stringify(w));
  const rekorde = () => json(K.rekorde) || {};
  const duellStand = () => json(K.duelle) || {};
  function buchLesen() {
    const b = json(K.buch) || {};
    return { toene: b.toene && typeof b.toene === "object" ? b.toene : {}, verlauf: Array.isArray(b.verlauf) ? b.verlauf : [],
      tage: b.tage && typeof b.tage === "object" ? b.tage : {}, einsingen: Array.isArray(b.einsingen) ? b.einsingen : [], atem: +b.atem || 0 };
  }
  const buchSchreiben = b => schreib(K.buch, JSON.stringify(b));
  function straehne(b) {
    const tage = new Set(b.einsingen); let n = 0; const d = new Date();
    if (!tage.has(heute(d))) d.setDate(d.getDate() - 1);
    while (tage.has(heute(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

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
  /* eine Zeile (Muster + Töne + Text) an Stelle b einsetzen; gibt neues b zurück */
  function zeileSetzen(st, b, melodie, text, extra) {
    const [mName, toeneStr] = String(melodie || "").split(":");
    const muster = MUSTER[(mName || "").trim()] || [];
    const toene = (toeneStr || "").trim().split(/\s+/);
    const silben = silbenAus(text);
    const z = Object.assign({ noten: [], b0: b }, extra || {});
    let k = 0;
    muster.forEach(d => {
      if (d < 0) { b += -d; return; }
      const s = silben[k] || { t: "", ende: true };
      st.noten.push(Object.assign({ b, d, s: stufe(toene[k] || "1", st.modus), silbe: s.t, ende: s.ende, zeile: st.zeilen.length }, extra && extra.vor ? { vor: true, instr: extra.instr } : {}));
      z.noten.push(st.noten.length - 1); k++; b += d;
    });
    z.b1 = b; st.zeilen.push(z);
    return b;
  }
  /* Ein Lied aus kehle-lieder.js in eine Notenliste verwandeln (englische Fassung, wenn vorhanden) */
  function liedBauen(lied) {
    const takt = lied.takt || 4, intro = INTRO_TAKTE * takt;
    const en = sprache() === "en" && Array.isArray(lied.folgeEn);
    const st = { id: lied.id, titel: lied.titel[sprache()] || lied.titel.de, takt, bpm: lied.bpm, modus: lied.modus, stil: lied.stil, grund: 60, noten: [], zeilen: [], intro, lied: true, deutsch: sprache() === "en" && !en };
    let b = intro;
    (en ? lied.folgeEn : lied.folge).forEach(([teil, texte]) => {
      const mel = lied.teile[teil] || [];
      texte.forEach((text, i) => { b = zeileSetzen(st, b, mel[i], text); });
    });
    st.ende = b;
    return fertigBauen(st);
  }
  /* Ein Spott-Duell: Gegner singt (Vorspiel-Noten), Barradin antwortet */
  function duellBauen(d) {
    const takt = d.takt || 4, intro = INTRO_TAKTE * takt;
    const st = { id: "d-" + d.id, titel: (d.name[sprache()] || d.name.de) + " ⚔", takt, bpm: d.bpm, modus: d.modus, stil: d.stil, grund: 60, noten: [], zeilen: [], intro, duell: d, deutsch: sprache() === "en" };
    let b = intro;
    d.runden.forEach(([gegner, barradin], r) => {
      gegner.forEach((text, i) => { b = zeileSetzen(st, b, d.teile.G[i], text, { vor: true, gegner: true, runde: r, instr: d.instr[i % d.instr.length] }); });
      barradin.forEach((text, i) => { b = zeileSetzen(st, b, d.teile.B[i], text, { runde: r }); });
    });
    st.ende = b;
    return fertigBauen(st);
  }
  /* Die Melodie, die gerade auf Barradins Bühne (Lautenwerk) eingestellt ist */
  const LW_MODI = { dorisch: [0, 2, 3, 5, 7, 9, 10], mixolydisch: [0, 2, 4, 5, 7, 9, 10], aeolisch: [0, 2, 3, 5, 7, 8, 10], phrygisch: [0, 1, 3, 5, 7, 8, 10], ionisch: [0, 2, 4, 5, 7, 9, 11], lydisch: [0, 2, 4, 6, 7, 9, 11] };
  function buehnenDaten() {
    const s = json("imres-lautenwerk2");
    if (!s || !s.teile || typeof s.teile !== "object") return null;
    const ablauf = String(s.ablauf || "A").split("").filter(p => s.teile[p] && Array.isArray(s.teile[p].melodie));
    if (!ablauf.some(p => s.teile[p].melodie.some(v => v >= 0))) return null;
    return { s, ablauf, titel: String(s.titel || (sprache() === "en" ? "Own song" : "Eigenes Lied")).slice(0, 50) };
  }
  function buehnenLiedBauen() {
    const bd = buehnenDaten(); if (!bd) return null;
    const { s, ablauf } = bd, L = s.takt === 12 ? 12 : 16, takt = L === 12 ? 3 : 4;
    const sk = LW_MODI[s.modus] || LW_MODI.ionisch, sMoll = ["dorisch", "aeolisch", "phrygisch"].includes(s.modus);
    const stv = z => sk[z % 7] + 12 * Math.floor(z / 7);
    const st = { id: "buehne-" + hash(JSON.stringify(ablauf.map(p => s.teile[p].melodie))).toString(36), titel: bd.titel, takt, bpm: klemm(+s.tempo || 100, 50, 180), modus: sMoll ? "moll" : "dur",
      stil: "ballade", grund: 62 + (s.transpose | 0), noten: [], zeilen: [], intro: INTRO_TAKTE * takt, buehne: true };
    let b = st.intro, runden = 0;
    const silbe = T().silben.la;
    do {
      ablauf.forEach(p => {
        const mel = s.teile[p].melodie, z = { noten: [], b0: b };
        for (let i = 0; i < L; i++) {
          const v = mel[i]; if (!(v >= 0)) continue;
          let len = 1; while (len < 4 && i + len < L && !(mel[i + len] >= 0)) len++;
          st.noten.push({ b: b + i / 4, d: Math.max(.25, len / 4), s: stv(v), silbe, ende: true, zeile: st.zeilen.length });
          z.noten.push(st.noten.length - 1);
        }
        b += L / 4; z.b1 = b;
        if (z.noten.length) st.zeilen.push(z);
      });
      runden++;
    } while ((b - st.intro) / takt < 8 && runden < 4);
    st.ende = b;
    return st.noten.length ? fertigBauen(st) : null;
  }
  function fertigBauen(st) {
    st.spb = 60 / st.bpm;
    st.takte = Math.ceil(st.ende / st.takt) + 1; /* + ein Schlusstakt */
    st.ende = st.takte * st.takt;
    st.noten.forEach((n, i) => { n.i = i; });
    const sing = st.noten.filter(n => !n.vor);
    const summe = sing.reduce((a, n) => a + n.d, 0) || 1;
    sing.forEach(n => { n.gewicht = 10000 * n.d / summe; });
    /* Schnörkel-Noten: lange Schlusstöne einer Zeile in Liedern und Duellen */
    if (st.lied || st.duell) st.zeilen.forEach(z => { if (z.vor || !z.noten.length) return; const n = st.noten[z.noten[z.noten.length - 1]]; if (n.d * st.spb >= .9) n.schnoerkel = true; });
    st.min = Math.min(...st.noten.map(n => n.s)); st.max = Math.max(...st.noten.map(n => n.s));
    st.akkorde = st.stil === "bordun" ? [] : harmonisieren(st);
    return st;
  }

  /* Akkorde je Takt: passend zur Melodie (Viterbi über die Takte) */
  const KANDIDATEN = {
    dur: [{ r: 0, q: "d", p: .35 }, { r: 2, q: "m", p: 0 }, { r: 4, q: "m", p: -.25 }, { r: 5, q: "d", p: .2 }, { r: 7, q: "d", p: .25, sept: true }, { r: 9, q: "m", p: .1 }],
    moll: [{ r: 0, q: "m", p: .35 }, { r: 3, q: "d", p: .1 }, { r: 5, q: "m", p: .2 }, { r: 7, q: "d", p: .25, sept: true }, { r: 8, q: "d", p: .15 }, { r: 10, q: "d", p: .1 }, { r: 7, q: "m", p: -.3 }]
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
    const phrase = new Set(st.zeilen.map(z => Math.floor((z.noten.length ? st.noten[z.noten[z.noten.length - 1]].b : z.b0) / L)));
    const kosten = proTakt.map((liste, t) => K2.map(k => {
      let w = k.p;
      liste.forEach(x => { const lage = x.start === 0 ? 1.6 : Number.isInteger(x.start) ? 1.1 : .6; w += x.d * (x.eigen ? lage : .8) * passt(k, x.s); });
      if (phrase.has(t) && liste.length && k.r === 0) { const letzte = liste[liste.length - 1]; if ([0, 3, 4, 7].includes(((letzte.s % 12) + 12) % 12)) w += .7; }
      return w;
    }));
    const best = [], vorg = [];
    for (let t = 0; t < n; t++) {
      best[t] = []; vorg[t] = [];
      K2.forEach((k, j) => {
        let lokal = kosten[t][j];
        if (!proTakt[t].length) lokal = j === 0 ? .5 : -.2;
        if (t === n - 1) lokal = j === 0 ? 5 : -5;
        if (t === 0) { best[t][j] = lokal + (j === 0 ? 1 : 0); vorg[t][j] = -1; return; }
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
    return weg.map(k => ({ r: k.r, q: k.q, sept: !!k.sept }));
  }

  /* Übungen passend zum Stimmumfang erzeugen (Töne in Halbtönen über „grund“) */
  function bereich() { const lo = gemessen() ? E.tief : 50, hi = gemessen() ? E.hoch : 64; return { lo, hi, spanne: Math.max(5, hi - lo) }; }
  function uebungTeil(st, art, b, rnd) {
    const tx = T(), { spanne } = bereich();
    const zeile = () => { const z = { noten: [], b0: b }; st.zeilen.push(z); return z; };
    const note = (z, s, d, silbe, vor) => { st.noten.push({ b, d, s, silbe, ende: true, zeile: st.zeilen.length - 1, vor: !!vor, instr: vor ? "fl" : undefined }); z.noten.push(st.noten.length - 1); b += d; };
    const auffuellen = extra => { b += ((4 - (b % 4)) % 4) + (extra || 0); };
    const kurz = st.uebung === "taeglich";
    if (art === "tonleiter") {
      const leiter = [0, 2, 4, 5, 7, 9, 11, 12], hoch = spanne >= 13 ? 8 : spanne >= 8 ? 5 : 4;
      const runden = kurz ? 1 : spanne >= 16 ? 3 : spanne >= 14 ? 2 : 1;
      for (let r = 0; r < runden; r++) {
        const off = r * 2, auf = leiter.slice(0, hoch), silben = tx.silben.tonleiter;
        let z = zeile(); z.b0 = b; auf.forEach((s, i) => note(z, s + off, i === auf.length - 1 ? 2 : 1, silben[i])); z.b1 = b; auffuellen();
        z = zeile(); z.b0 = b; auf.slice().reverse().forEach((s, i) => note(z, s + off, i === auf.length - 1 ? 3 : 1, silben[auf.length - 1 - i])); z.b1 = b; auffuellen(4);
      }
    } else if (art === "halten") {
      const folge = (kurz ? [0, 4, 7] : [0, 2, 4, 5, 7, 4]).map(s => Math.min(s, spanne - 1));
      folge.forEach(s => { const z = zeile(); note(z, s, 4, tx.silben.halten); z.b1 = b; b += 4; });
    } else if (art === "echo") {
      const penta = [0, 2, 4, 7, 9, 12].filter(s => s <= spanne);
      const anzahl = kurz ? 2 : 6;
      for (let r = 0; r < anzahl; r++) {
        const laenge = kurz ? 4 : r < 2 ? 3 : r < 4 ? 4 : 5;
        const phrase = []; let idx = Math.floor(rnd() * Math.min(3, penta.length));
        for (let i = 0; i < laenge; i++) { phrase.push(penta[idx]); idx = klemm(idx + [-2, -1, 1, 1, 2][Math.floor(rnd() * 5)], 0, penta.length - 1); }
        const daue = phrase.map((_, i) => i === laenge - 1 ? 2 : laenge === 5 && i % 2 ? .5 : 1);
        const gesamt = daue.reduce((a, x) => a + x, 0), takte = Math.ceil(gesamt / 4);
        let z = zeile(); z.vor = true; phrase.forEach((s, i) => note(z, s, daue[i], tx.silben.vor, true)); z.b1 = b; b += takte * 4 - gesamt;
        z = zeile(); phrase.forEach((s, i) => note(z, s, daue[i], tx.silben.echo)); z.b1 = b; b += takte * 4 - gesamt;
      }
    } else if (art === "spruenge") {
      const okt = spanne >= 12 ? 12 : 7;
      let figuren = [[0, 4, 7, okt, 7, 4, 0], [0, 7, 0, 5, 0, 4], [0, 9, 7, 4, 5, 2, 0], [0, okt, 7, 9, 4, 5, 0]];
      if (kurz) figuren = [figuren[Math.floor(rnd() * 2)], figuren[2 + Math.floor(rnd() * 2)]];
      figuren.forEach(f => { const z = zeile(); f.forEach((s, i) => note(z, Math.min(s, spanne), i === f.length - 1 ? 2 : 1, tx.silben.spruenge)); z.b1 = b; auffuellen(4); });
    }
    return b;
  }
  function uebungBauen(art) {
    const tx = T(), { lo, spanne } = bereich();
    const grund = lo + Math.min(2, Math.max(0, spanne - 12));
    const st = { id: "u-" + art, titel: tx.ueb[art][0], modus: "dur", grund, noten: [], zeilen: [], fest: true, uebung: art, takt: 4, bpm: 88, stil: "ballade" };
    let b = INTRO_TAKTE * 4; st.intro = b;
    if (art === "taeglich") {
      const tag = heute(); const rnd = becher(hash(tag));
      Object.assign(st, { bpm: 84, stil: "harfe" });
      b = uebungTeil(st, "tonleiter", b, rnd); b = uebungTeil(st, "halten", b, rnd); b = uebungTeil(st, "echo", b, rnd); b = uebungTeil(st, "spruenge", b, rnd);
    } else if (art === "bordun") {
      /* Bordun: Grundton frei wählbar (z. B. die Tonart der Handpan), Dur oder Moll */
      const g0 = typeof E.bordunTon === "number" ? E.bordunTon : grund;
      Object.assign(st, { grund: g0, modus: E.bordunModus === "dur" ? "dur" : "moll", bpm: 66, stil: "bordun", bordun: true });
      const terz = st.modus === "dur" ? 4 : 3, sexte = st.modus === "dur" ? 9 : 8, okt = spanne >= 12 ? 12 : 7;
      const folge = [0, 7, okt, terz, 7, 5, sexte, 2, terz, 0];
      folge.forEach(s => { const z = { noten: [], b0: b }; st.zeilen.push(z); st.noten.push({ b, d: 4, s, silbe: tx.intervalle[s] || tx.intervalle[12], ende: true, zeile: st.zeilen.length - 1 }); z.noten.push(st.noten.length - 1); b += 4; z.b1 = b; b += 2; });
      b += (4 - (b % 4)) % 4;
    } else {
      Object.assign(st, art === "halten" ? { bpm: 72, stil: "hymne" } : art === "echo" ? { bpm: 96, stil: "harfe", ohneFuehrung: true } : art === "spruenge" ? { bpm: 80 } : { bpm: 92 });
      b = uebungTeil(st, art, b, Math.random);
    }
    st.ende = b;
    return fertigBauen(st);
  }

  const tonName = m => { const r = Math.round(m); return T().tonNamen[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1); };
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
  let ctx = null, ausgang = null;
  const KARTE = {
    gitarre: [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84],
    kb: [28, 30, 31, 34, 36, 38, 40, 42, 44, 45, 49, 52, 56, 59],
    harfe: [28, 31, 35, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 95, 98, 101],
    fl: [60, 64, 69, 72, 76, 81, 84, 88, 93, 96],
    ooh: [48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78],
    fag: [34, 37, 41, 45, 46, 48, 55, 60, 63, 68, 69, 72],
    pos: [34, 37, 39, 41, 46, 50, 53, 60, 61, 63, 65],
    tuba: [34, 39, 41, 46, 50, 53, 58],
    oboe: [58, 62, 65, 70, 74, 77, 82, 86, 89],
    orgel: [36, 42, 48, 54, 60, 66, 72, 78, 84],
    vc: [36, 40, 43, 47, 50, 53, 57, 60, 64, 67, 71, 74, 77]
  };
  /* Lage, in der ein Instrument gut klingt (Töne werden oktaviert, bis sie passen) */
  const LAGE = { fag: [40, 62], pos: [40, 62], tuba: [33, 52], oboe: [62, 84], fl: [64, 88] };
  const inLage = (g, m) => { const l = LAGE[g]; if (!l) return m; while (m < l[0]) m += 12; while (m > l[1]) m -= 12; return m; };
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
  const WEICH = { ooh: 1, fl: 1, orgel: 1, vc: 1, fag: 1, pos: 1, tuba: 1, oboe: 1 };
  function spielen(g, m, z, laut, dauer, ziel, ein) {
    const name = probeName(g, m), b = puffer.get(name), out = ziel || ausgang;
    if (!b) return ersatz(g, m, z, laut, dauer, out, ein);
    const src = ctx.createBufferSource(), gn = ctx.createGain();
    src.buffer = b; if (KARTE[g]) src.playbackRate.value = Math.pow(2, (m - naechste(g, m)) / 12);
    const lang = (b.duration - b._start) / src.playbackRate.value;
    const d = Math.min(lang, dauer || lang), aus = Math.min(ein ? ein : .25, d * .4);
    const a = ein || (WEICH[g] ? .05 : .004);
    gn.gain.setValueAtTime(0, z); gn.gain.linearRampToValueAtTime(laut, z + a);
    if (d < lang || ein) { gn.gain.setValueAtTime(laut, Math.max(z + a, z + d - aus)); gn.gain.linearRampToValueAtTime(0, z + d); }
    src.connect(gn); gn.connect(out); src.start(z, b._start); src.stop(z + d + .05);
  }
  /* Ersatzklang: gezupft (Dreieck mit Abklingen) oder gesungen/geblasen (Sinus mit Vibrato) */
  function ersatz(g, m, z, laut, dauer, out, ein) {
    if (/^(bodh|holz)/.test(g)) {
      const o = ctx.createOscillator(), gn = ctx.createGain(), hoch = g.startsWith("holz");
      o.frequency.setValueAtTime(hoch ? 900 : 120, z); o.frequency.exponentialRampToValueAtTime(hoch ? 700 : 55, z + .1);
      gn.gain.setValueAtTime(laut * .8, z); gn.gain.exponentialRampToValueAtTime(.001, z + (hoch ? .06 : .25));
      o.connect(gn); gn.connect(out); o.start(z); o.stop(z + .3); return;
    }
    const f = 440 * Math.pow(2, (m - 69) / 12), o = ctx.createOscillator(), gn = ctx.createGain();
    const weich = !!WEICH[g], d = dauer || 1, a = ein || .06;
    o.type = weich ? (g === "orgel" || g === "tuba" || g === "fag" ? "sawtooth" : "sine") : "triangle"; o.frequency.value = f;
    let ziel = out;
    if (o.type === "sawtooth") { const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(2400, f * 5); lp.connect(out); ziel = lp; laut *= .5; }
    gn.gain.setValueAtTime(0, z);
    if (weich) { gn.gain.linearRampToValueAtTime(laut * .6, z + a); gn.gain.setValueAtTime(laut * .6, z + Math.max(a + .01, d - a)); gn.gain.linearRampToValueAtTime(0, z + d); }
    else { gn.gain.linearRampToValueAtTime(laut * .7, z + .005); gn.gain.exponentialRampToValueAtTime(.001, z + Math.min(2, d + .6)); }
    o.connect(gn); gn.connect(ziel); o.start(z); o.stop(z + d + .7);
  }
  /* Bordun: Orgel und Cello im Wechsel mit weichen Überblendungen – klingt durchgehend */
  function bordunEreignisse(add, g0, von, bis) {
    for (let z = von; z < bis; z += 2.4) {
      add(z, "orgel", lage(g0, 36) , .3, 3.4, .8);
      add(z + 1.2, "vc", lage(g0, 36), .22, 3.4, .9);
      add(z, "orgel", lage(g0 + 7, 43), .12, 3.4, .8);
    }
  }
  const lage = (s, von) => { let m = s; while (m < von) m += 12; while (m >= von + 12) m -= 12; return m; };

  /* Begleitung: Ereignisliste { z (Sekunden ab Liedbeginn), g (Instrument), m, laut, dauer } */
  function begleitung(st, schieb, o) {
    o = o || {};
    const ev = [], L = st.takt, spb = st.spb, g0 = st.grund + schieb;
    const add = (b, g, m, laut, dauerSchlaege) => ev.push({ z: b * spb, g, m, laut, dauer: dauerSchlaege ? dauerSchlaege * spb : 0 });
    for (let b = 0; b < st.intro; b++) add(b, b % L === 0 ? "holz2" : "holz1", 0, b % L === 0 ? .45 : .3);
    if (st.stil === "bordun") bordunEreignisse((z, g, m, laut, dauer, ein) => ev.push({ z, g, m, laut, dauer, ein }), g0, 0, st.ende * spb);
    const schnell = st.bpm >= 140;
    st.akkorde.forEach((a, t) => {
      const b0 = t * L, letzter = t === st.akkorde.length - 1;
      const r = g0 + a.r, terz = a.q === "d" ? 4 : 3;
      const bass = lage(r, 36), akk = [lage(r, 52), lage(r + terz, 52), lage(r + 7, 52)].sort((x, y) => x - y);
      const tief = lage(r, 40), hoch = [lage(r, 55), lage(r + terz, 55), lage(r + 7, 55), lage(r, 55) + 12];
      const leise = b0 < st.intro ? .7 : 1;
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
        default: {
          add(b0, "kb", bass, .45 * leise, L === 4 ? 2 : L); if (L === 4) add(b0 + 2, "kb", lage(r + 7, 36), .36 * leise, 2);
          const muster = L === 4 ? [0, 1, 2, 3, 2, 1, 2, 1] : [0, 1, 2, 3, 2, 1];
          muster.forEach((i, k) => add(b0 + k / 2, "gitarre", hoch[i], (k === 0 ? .2 : .14) * leise, 1));
        }
      }
    });
    /* Führstimme (Chor), Echos Flöte, Stimme des Gegners */
    const fuehr = !o.ohneFuehrung && E.kopf && E.fuehr && !st.ohneFuehrung;
    st.noten.forEach(n => {
      const m = g0 + n.s;
      if (n.vor) { const g = n.instr || "fl"; add(n.b, g, inLage(g, m), g === "fl" ? .32 : .42, n.d * .95); }
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
    if (testStimme) { mic = { test: true, verlauf: [], boden: .004, pegel: 0 }; return true; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("fehlt");
    audio();
    /* Mit Kopfhörern: rohes Signal. Ohne: Echo-Unterdrückung des Browsers, damit die Musik nicht mitgewertet wird. */
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: !E.kopf, noiseSuppression: false, autoGainControl: false } });
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0;
    const stumm = ctx.createGain(); stumm.gain.value = 0;
    src.connect(an); an.connect(stumm); stumm.connect(ctx.destination);
    const N = an.fftSize >> 1;
    mic = { stream, src, an, stumm, kopf: E.kopf, buf: new Float32Array(an.fftSize), x: new Float32Array(N), nsdf: new Float32Array(N), boden: typeof E.boden === "number" ? E.boden : .004, verlauf: [], pegel: 0 };
    stream.getTracks().forEach(t => t.addEventListener("ended", () => { if (mic && mic.stream === stream) { micAus(); if (S && !S.pause && !S.wiedergabe) pausieren(); } }));
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
    if (mic.test) { const m = testStimme(); mic.pegel = m == null ? 0 : .3; return { m, rms: mic.pegel }; }
    const { an, buf, x, nsdf } = mic;
    an.getFloatTimeDomainData(buf);
    const N = x.length; let summe = 0;
    for (let i = 0; i < N; i++) { const v = (buf[2 * i] + buf[2 * i + 1]) * .5; x[i] = v; summe += v * v; }
    const rms = Math.sqrt(summe / N);
    mic.pegel = mic.pegel * .7 + rms * .3;
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
    return glaetten(69 + 12 * Math.log2(f / 440), rms);
  }
  /* kleine Glättung: einzelne Ausreißer (Oktavsprünge) gegen den Median der letzten Werte prüfen */
  function glaetten(m, rms) {
    const v = mic.verlauf; v.push(m); if (v.length > 4) v.shift();
    if (m == null) return { m: null, rms };
    const da = v.filter(x => x != null);
    if (da.length >= 3) { const s = da.slice(-3).sort((x, y) => x - y); const med = s[1]; if (Math.abs(m - med) > 7) return { m: med, rms }; return { m: m * .65 + med * .35, rms }; }
    return { m, rms };
  }
  const falte = (m, ziel) => m + 12 * Math.round((ziel - m) / 12);

  /* ---------- Aufnahme zum Anhören (bleibt im Arbeitsspeicher) ---------- */
  function aufnahmeStarten() {
    if (!E.aufnahme || !mic || !mic.stream || !window.MediaRecorder) return null;
    const typ = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"].find(x => { try { return MediaRecorder.isTypeSupported(x); } catch (_) { return false; } });
    let rec; try { rec = new MediaRecorder(mic.stream, typ ? { mimeType: typ } : undefined); } catch (_) { return null; }
    const a = { rec, teile: [], start: null };
    rec.ondataavailable = e => { if (e.data && e.data.size) a.teile.push(e.data); };
    rec.onstart = () => { if (S) a.start = hoerZeit(); };
    try { rec.start(1000); } catch (_) { return null; }
    return a;
  }
  function aufnahmeBeenden(a) {
    return new Promise(res => {
      if (!a || a.rec.state === "inactive") { res(a && a.teile.length ? new Blob(a.teile, { type: a.rec.mimeType }) : null); return; }
      a.rec.onstop = () => res(a.teile.length ? new Blob(a.teile, { type: a.rec.mimeType }) : null);
      try { a.rec.stop(); } catch (_) { res(null); }
    });
  }

  /* =================================================================
     PUBLIKUM
     ================================================================= */
  /* Wer sitzt wo im Publikum? (Tournee-Bühnen der Reihe nach) */
  const PUBLIKUM_WEG = [
    ["matrose", "matrose", "zwerg", "matrose", "mensch", "matrose"], ["goblin", "goblin", "goblin", "goblin", "goblin", "goblin", "goblin"],
    ["robe", "robe", "robe", "robe", "robe"], ["drache_gruen"], ["drow", "drow", "drow", "drow"], ["kuotoa", "kuotoa", "kuotoa", "kuotoa", "kuotoa"],
    ["friedrich", "echo", "rex", "ezekiel"], ["zwerg", "zwerg", "koenig", "zwerg", "zwerg"], ["zwerg", "riese", "rex", "zwerg"], ["drache_rot"]
  ];
  const STILL_PUBLIKUM = { 5: true }; /* beim Klagelied wird nicht geworfen */
  function publikumFuer(st) {
    if (st.uebung) return { leute: ["rex_liegt"], still: true };
    if (st.duell) return { leute: ["friedrich", "echo", "rex", "ezekiel"], still: false, gruppe: true };
    if (station != null && PUBLIKUM_WEG[station]) return { leute: PUBLIKUM_WEG[station], still: !!STILL_PUBLIKUM[station] };
    if (st.id === "ploop") return { leute: ["kuotoa", "kuotoa", "mensch", "kuotoa"], still: true };
    return { leute: ["mensch", "zwerg", "mensch", "goblin", "zwerg", "mensch"], still: false };
  }
  const SIL = "rgba(9,7,12,.94)", RAND = "rgba(224,160,70,.38)";
  function figur(typ, x, y, h, t, laune, i) {
    const wipp = ruhig ? 0 : Math.sin(t * (2 + (i % 3) * .4) + i * 1.7) * h * .04 * (.3 + laune);
    const hops = !ruhig && laune > .85 ? Math.max(0, Math.sin(t * 7 + i)) * h * .12 : 0;
    y -= wipp + hops;
    g.fillStyle = SIL; g.strokeStyle = RAND; g.lineWidth = 1.2;
    const kopf = (cx, cy, r) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke(); };
    const koerper = (w, hh) => { rundRect(x - w / 2, y - hh, w, hh + 4, w * .35); g.fill(); g.stroke(); };
    const r = h * .17;
    switch (typ) {
      case "goblin": {
        koerper(h * .34, h * .45); kopf(x, y - h * .55, r * .95);
        g.beginPath(); g.moveTo(x - r * .8, y - h * .58); g.lineTo(x - r * 2.1, y - h * .7); g.lineTo(x - r * .6, y - h * .5); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(x + r * .8, y - h * .58); g.lineTo(x + r * 2.1, y - h * .7); g.lineTo(x + r * .6, y - h * .5); g.fill(); g.stroke();
        g.fillStyle = "rgba(255,210,90," + (.4 + .5 * laune) + ")"; g.fillRect(x - r * .45, y - h * .58, 2, 2); g.fillRect(x + r * .3, y - h * .58, 2, 2);
        break;
      }
      case "zwerg": case "koenig": {
        koerper(h * .46, h * .48); kopf(x, y - h * .6, r);
        g.beginPath(); g.moveTo(x - r * .9, y - h * .58); g.lineTo(x, y - h * .25); g.lineTo(x + r * .9, y - h * .58); g.fill(); g.stroke();
        if (typ === "koenig") { g.fillStyle = "rgba(255,210,122,.85)"; g.beginPath(); g.moveTo(x - r, y - h * .72); g.lineTo(x - r * .6, y - h * .9); g.lineTo(x - r * .2, y - h * .76); g.lineTo(x + r * .2, y - h * .92); g.lineTo(x + r * .6, y - h * .76); g.lineTo(x + r, y - h * .9); g.lineTo(x + r, y - h * .72); g.closePath(); g.fill(); }
        break;
      }
      case "matrose": {
        koerper(h * .38, h * .55); kopf(x, y - h * .68, r);
        g.fillRect(x - r * 1.2, y - h * .8, r * 2.4, r * .45); g.beginPath(); g.arc(x, y - h * .8, r * .8, Math.PI, 0); g.fill();
        break;
      }
      case "robe": case "drow": {
        g.beginPath(); g.moveTo(x - h * .24, y + 4); g.lineTo(x - h * .14, y - h * .55); g.quadraticCurveTo(x, y - h * .95, x + h * .14, y - h * .55); g.lineTo(x + h * .24, y + 4); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = typ === "robe" ? "rgba(190,40,40,.75)" : "rgba(200,170,255,.7)"; g.fillRect(x - r * .5, y - h * .66, 2.5, 2); g.fillRect(x + r * .3, y - h * .66, 2.5, 2);
        if (typ === "robe") { g.strokeStyle = "rgba(170,40,40,.6)"; g.beginPath(); g.moveTo(x - h * .2, y - h * .1); g.lineTo(x + h * .2, y - h * .1); g.stroke(); }
        break;
      }
      case "kuotoa": {
        koerper(h * .4, h * .5);
        g.beginPath(); g.ellipse(x, y - h * .63, r * 1.05, r * 1.3, 0, 0, 7); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(x - r * .3, y - h * .82); g.lineTo(x, y - h * 1.0); g.lineTo(x + r * .4, y - h * .8); g.fill(); g.stroke();
        g.fillStyle = "rgba(140,230,220,.6)"; g.beginPath(); g.arc(x - r * .5, y - h * .66, 2, 0, 7); g.arc(x + r * .5, y - h * .66, 2, 0, 7); g.fill();
        /* Laternchen im Takt */
        g.fillStyle = "rgba(140,230,220," + (.25 + .3 * Math.abs(Math.sin(t * 1.3 + i))) + ")"; g.beginPath(); g.arc(x + h * .26, y - h * .32, 3, 0, 7); g.fill();
        break;
      }
      case "mensch": {
        koerper(h * .38, h * .55); kopf(x, y - h * .68, r);
        if (i % 2) { g.fillStyle = "rgba(224,160,70,.5)"; g.fillRect(x + h * .17, y - h * .45 - (laune > .7 ? h * .15 : 0), h * .08, h * .12); }
        break;
      }
      case "friedrich": {
        koerper(h * .4, h * .58); kopf(x, y - h * .7, r);
        g.beginPath(); g.moveTo(x - r * 1.1, y - h * .72); g.quadraticCurveTo(x, y - h * 1.05, x + r * 1.1, y - h * .72); g.fill(); g.stroke();
        g.strokeStyle = "rgba(224,160,70,.6)"; g.beginPath(); g.arc(x - h * .28, y - h * .4, h * .3, -1.2, 1.2); g.stroke();
        break;
      }
      case "echo": {
        g.beginPath(); g.moveTo(x - h * .22, y + 4); g.lineTo(x - h * .14, y - h * .55); g.lineTo(x + h * .14, y - h * .55); g.lineTo(x + h * .22, y + 4); g.closePath(); g.fill(); g.stroke();
        kopf(x, y - h * .68, r);
        g.strokeStyle = "rgba(235,226,204,.55)"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x - r * .6, y - h * .78); g.quadraticCurveTo(x - r * 1.8, y - h * .95, x - r * 1.2, y - h * 1.08); g.stroke();
        g.beginPath(); g.moveTo(x + r * .6, y - h * .78); g.quadraticCurveTo(x + r * 1.8, y - h * .95, x + r * 1.2, y - h * 1.08); g.stroke();
        break;
      }
      case "ezekiel": {
        g.beginPath(); g.moveTo(x - h * .24, y + 4); g.lineTo(x - h * .16, y - h * .6); g.quadraticCurveTo(x, y - h * 1.0, x + h * .16, y - h * .6); g.lineTo(x + h * .24, y + 4); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = "rgba(255,70,60," + (.5 + .4 * laune) + ")"; g.fillRect(x - r * .5, y - h * .7, 3, 2); g.fillRect(x + r * .25, y - h * .7, 3, 2);
        break;
      }
      case "rex": case "rex_liegt": {
        const liegt = typ === "rex_liegt" && laune < .8;
        g.beginPath(); g.ellipse(x, y - h * (liegt ? .12 : .22), h * .3, h * (liegt ? .12 : .16), 0, 0, 7); g.fill(); g.stroke();
        kopf(x + h * .27, y - h * (liegt ? .18 : .42), r * .85);
        g.beginPath(); g.moveTo(x + h * .22, y - h * (liegt ? .25 : .5)); g.lineTo(x + h * .2, y - h * (liegt ? .32 : .66)); g.lineTo(x + h * .3, y - h * (liegt ? .27 : .55)); g.fill();
        if (!liegt) { g.strokeStyle = SIL; g.lineWidth = 3; g.beginPath(); g.moveTo(x - h * .28, y - h * .25); g.lineTo(x - h * .42, y - h * (.35 + .1 * Math.sin(t * 10 * laune))); g.stroke(); }
        else { g.fillStyle = "rgba(235,226,204,.4)"; g.font = Math.round(h * .22) + "px Georgia"; g.fillText("z", x + h * .4, y - h * (.5 + .1 * Math.sin(t))); }
        break;
      }
      case "riese": {
        koerper(h * .62, h * .9); kopf(x, y - h * 1.05, r * 1.25);
        break;
      }
      case "drache_gruen": case "drache_rot": {
        /* ein großer Kopf, der von rechts über die Bühne lugt */
        const gr = typ === "drache_gruen" ? "120,200,110" : "255,120,70";
        const kx = cw * .82, ky = y - h * .55 - (ruhig ? 0 : Math.sin(t * .8) * 4);
        g.beginPath(); g.moveTo(cw + 20, y + 4); g.quadraticCurveTo(cw * .9, y - h * .2, kx + h * .3, ky + h * .2);
        g.lineTo(kx - h * 1.1, ky + h * .05); g.quadraticCurveTo(kx - h * 1.25, ky - h * .2, kx - h * .9, ky - h * .35); g.lineTo(kx + h * .2, ky - h * .5);
        g.lineTo(kx + h * .45, ky - h * 1.0); g.lineTo(kx + h * .55, ky - h * .45); g.quadraticCurveTo(cw * .98, ky - h * .2, cw + 20, y - h * .6); g.closePath(); g.fill(); g.stroke();
        const glut = .35 + .55 * laune;
        g.fillStyle = "rgba(" + gr + "," + glut.toFixed(2) + ")"; g.shadowColor = "rgba(" + gr + ",1)"; g.shadowBlur = 10 * glut;
        g.beginPath(); g.ellipse(kx - h * .25, ky - h * .2, h * .09, h * .04, -.2, 0, 7); g.fill(); g.shadowBlur = 0;
        if (laune < .35 && !ruhig) { g.fillStyle = "rgba(160,160,150," + (.15 + .1 * Math.sin(t * 3)) + ")"; g.beginPath(); g.arc(kx - h * 1.15, ky - h * .1 - (t * 20 % 30), h * .12, 0, 7); g.fill(); }
        break;
      }
    }
  }
  /* Was das Publikum wirft: Rosen und Münzen bei Glanzleistungen, Heringe und Tomaten bei Patzern */
  function werfen(art, anzahl) {
    if (!S || !S.pub || S.pub.still || ruhig || !E.publikum || S.wiedergabe) return;
    const n = S.pub.leute.length;
    for (let k = 0; k < anzahl; k++) {
      const i = Math.floor(Math.random() * n);
      const typ = art === "gut" ? (Math.random() < .6 ? "rose" : "muenze") : (Math.random() < .55 ? "tomate" : "hering");
      S.wuerfe.push({ typ, i, t0: performance.now() / 1000, dauer: .9 + Math.random() * .3, zx: .2 + Math.random() * .55, zy: .45 + Math.random() * .35, dreh: Math.random() * 6 });
    }
  }
  function wurfMalen(w, x, y, a) {
    g.save(); g.translate(x, y); g.rotate(w.dreh + a * 8); g.globalAlpha = a < 1 ? 1 : klemm(2 - a, 0, 1);
    if (w.typ === "rose") { g.strokeStyle = "#5c9a4a"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 12); g.stroke(); g.fillStyle = "#e0405a"; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); g.fillStyle = "#ff7a8a"; g.beginPath(); g.arc(-1, -1, 2, 0, 7); g.fill(); }
    else if (w.typ === "muenze") { g.fillStyle = "#ffd27a"; g.beginPath(); g.ellipse(0, 0, 5, 5 * Math.abs(Math.cos(a * 9)) + 1, 0, 0, 7); g.fill(); }
    else if (w.typ === "tomate") { g.fillStyle = "#d8402e"; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); g.fillStyle = "#4f8a3a"; g.fillRect(-2, -7, 4, 3); }
    else { g.fillStyle = "#b8c4cc"; g.beginPath(); g.ellipse(0, 0, 10, 4, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(9, 0); g.lineTo(15, -4); g.lineTo(15, 4); g.closePath(); g.fill(); g.fillStyle = "#222"; g.fillRect(-7, -1.5, 1.5, 1.5); }
    g.restore();
  }

  /* =================================================================
     DAS SPIEL
     ================================================================= */
  let S = null, raf = 0, takt = 0;
  let ansicht = "menue", station = null, gewaehlt = null, einmess = null, gabel = null, ergebnis = null, meldung = "", atem = null, latenz = null;

  function hoerZeit() {
    if (!S) return 0;
    return ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0) - S.t0;
  }
  function vorbereitenNoten(st, schieb) {
    st.noten.forEach(n => { n.z0 = n.b * st.spb; n.z1 = (n.b + n.d) * st.spb; n.zeit = 0; n.stimme = 0; n.treffer = 0; n.perfekt = 0; n.abw = 0; n.abwZ = 0; n.wert = null; n.m = st.grund + schieb + n.s; n.proben = n.schnoerkel ? [] : null; n.geschnoerkelt = false; });
    st.zeilen.forEach(z => { z.z0 = z.noten.length ? st.noten[z.noten[0]].z0 : z.b0 * st.spb; z.z1 = z.noten.length ? st.noten[z.noten[z.noten.length - 1]].z1 : z.z0; z.wert = null; z.schaden = 0; });
  }
  function starten(st) {
    audio();
    if (S) abbrechen(true);
    const schieb = verschiebung(st);
    const ev = begleitung(st, schieb);
    const bus = ctx.createGain(); bus.gain.value = E.kopf ? 1 : .55; bus.connect(ausgang);
    S = { st, schieb, ev, ei: 0, t0: ctx.currentTime + .25, pause: false, tol: TOL[E.grad], ni: 0, spur: [], spurAll: [], letzteTv: null, punkte: 0, bonus: 0, urteil: null, serie: 0, besteSerie: 0,
      tonStatistik: {}, stumm: 0, gehoert: 0, funken: [], zeileJetzt: -1, ende: st.ende * st.spb, bus, wuerfe: [], laune: .5, insp: 1, letzteZeile: null, schnoerkel: 0, pub: publikumFuer(st) };
    vorbereitenNoten(st, schieb);
    if (st.duell) S.duell = { leben: 100, fassung: 100, max: 100, proZeile: 100 / (st.zeilen.filter(z => !z.vor).length * .62), runde: 0, ende: null, rundenWert: [], blitz: [] };
    const ms = st.noten.map(n => n.m);
    let lo = Math.min(...ms) - 3, hi = Math.max(...ms) + 3;
    if (hi - lo < 14) { const mit = (hi + lo) / 2; lo = mit - 7; hi = mit + 7; }
    S.lo = lo; S.hi = hi; S.mitte = (Math.min(...ms) + Math.max(...ms)) / 2;
    S.aufnahme = aufnahmeStarten();
    ansicht = "spiel"; zeigen();
    planen();
    if (!takt) takt = setInterval(() => { if (S && !S.pause) planen(); }, 100);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(rahmen);
  }
  function planen() {
    if (!S || !ctx) return;
    const jetzt = ctx.currentTime - S.t0, bis = Math.min(jetzt + 1.2, S.ende + .2);
    while (S.ei < S.ev.length && S.ev[S.ei].z < bis) {
      const e = S.ev[S.ei++];
      if (e.z < jetzt - .05) continue;
      spielen(e.g, e.m, S.t0 + e.z, e.laut, e.dauer, S.bus, e.ein);
    }
  }
  function pausieren() {
    if (!S || S.pause) return;
    if (S.wiedergabe) { wiedergabeEnde(); return; }
    S.pause = true;
    if (S.aufnahme && S.aufnahme.rec.state === "recording") try { S.aufnahme.rec.pause(); } catch (_) {}
    if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
    ansicht = "pause"; zeigen();
  }
  function fortsetzen() {
    if (!S) return;
    S.pause = false; S.letzteTv = null;
    if (S.aufnahme && S.aufnahme.rec.state === "paused") try { S.aufnahme.rec.resume(); } catch (_) {}
    audio();
    ansicht = "spiel"; zeigen();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(rahmen);
  }
  function abbrechen(still) {
    if (!S) return;
    const bus = S.bus;
    try { bus.gain.setTargetAtTime(0, ctx.currentTime, .05); setTimeout(() => { try { bus.disconnect(); } catch (_) {} }, 400); } catch (_) {}
    if (S.quelle) try { S.quelle.stop(); } catch (_) {}
    if (S.aufnahme && S.aufnahme.rec.state !== "inactive") try { S.aufnahme.rec.stop(); } catch (_) {}
    S = null; cancelAnimationFrame(raf);
    if (takt) { clearInterval(takt); takt = 0; }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    if (!still) micAus();
  }

  function rahmen() {
    if (!S) return;
    raf = requestAnimationFrame(rahmen);
    if (root.offsetParent === null || document.hidden) { pausieren(); return; }
    if (S.pause) return;
    planen();
    const t = hoerZeit();
    if (S.wiedergabe) {
      if (t > S.ende + .3) { wiedergabeEnde(); return; }
      const tv = t;
      let i = S.spurIdx || 0; const all = S.spurAll;
      while (i < all.length && all[i].t <= tv) i++;
      S.spurIdx = i; let j = i; while (j > 0 && all[j - 1].t > tv - 3) j--;
      S.spur = all.slice(j, i);
      const last = S.spur[S.spur.length - 1];
      S.gefaltet = last && last.m != null && tv - last.t < .1 ? last.m : null; S.ok = !!(last && last.ok);
      S.aktiv = null; for (let k = 0; k < S.st.noten.length; k++) { const n = S.st.noten[k]; if (n.z0 <= tv && tv < n.z1) { S.aktiv = n; break; } if (n.z0 > tv) break; }
      S.abw = null;
      zeichnen(t, tv); textAktualisieren(tv); hudAktualisieren(t);
      return;
    }
    const e = erkennen();
    const tv = t - E.versatz / 1000 - .05;
    werten(e, tv);
    if (t > S.ende + .3) { fertig(); return; }
    zeichnen(t, tv);
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
      /* geglättete Tonhöhe (≈ 0,12 s): Vibrato schadet der Wertung nicht, es zählt die Mitte des Tons */
      if (S.glatt == null || Math.abs(gefaltet - S.glatt) > 1) S.glatt = gefaltet; else S.glatt += (gefaltet - S.glatt) * Math.min(1, dt / .12);
      if (aktiv) {
        const roh = (gefaltet - aktiv.m) * 100;
        abw = (S.glatt - aktiv.m) * 100;
        ok = Math.abs(abw) <= S.tol;
        if (!aktiv.vor) {
          aktiv.stimme += dt;
          if (ok) { aktiv.treffer += dt; if (Math.abs(abw) <= S.tol / 2) aktiv.perfekt += dt; }
          if (Math.abs(abw) < 300) { aktiv.abw += abw * dt; aktiv.abwZ += dt; }
          if (aktiv.proben && Math.abs(roh) < 250) aktiv.proben.push(tv, roh);
        }
      }
      const p = { t: tv, m: gefaltet, ok: ok && !!aktiv && !aktiv.vor };
      S.spur.push(p); S.spurAll.push(p);
    } else { S.glatt = null; const p = { t: tv, m: null }; S.spur.push(p); S.spurAll.push(p); }
    if (aktiv && !aktiv.vor) aktiv.zeit += dt;
    while (S.spur.length && S.spur[0].t < tv - 3) S.spur.shift();
    S.aktiv = aktiv; S.abw = abw; S.ok = ok; S.gefaltet = gefaltet;
    if (ok && aktiv && !aktiv.vor && !ruhig && Math.abs(abw) <= S.tol / 2 && Math.random() < .35) S.funken.push({ t: tv, m: aktiv.m, vx: Math.random() * 40 - 10, vy: -Math.random() * 60 - 20, leben: .7 });
    /* Laune des Publikums gleitet zum Ergebnis der letzten Zeilen */
    const ziel2 = S.letzteZeile ? S.letzteZeile.wert : .5;
    S.laune += (ziel2 - S.laune) * Math.min(1, dt * 1.5);
  }
  /* Vibrato erkennen: Schwingung von 3,5–9 Hz und 10–120 Cent um einen stabilen Ton */
  function vibrato(n) {
    const p = n.proben; if (!p || p.length < 40) return false;
    const ab = n.z0 + (n.z1 - n.z0) * .25;
    const ts = [], cs = [];
    for (let i = 0; i < p.length; i += 2) if (p[i] >= ab) { ts.push(p[i]); cs.push(p[i + 1]); }
    if (ts.length < 24) return false;
    const dauer = ts[ts.length - 1] - ts[0]; if (dauer < .45) return false;
    /* linearen Trend abziehen */
    const mt = ts.reduce((a, b) => a + b, 0) / ts.length, mc = cs.reduce((a, b) => a + b, 0) / cs.length;
    let sxy = 0, sxx = 0; ts.forEach((t, i) => { sxy += (t - mt) * (cs[i] - mc); sxx += (t - mt) * (t - mt); });
    const k = sxx ? sxy / sxx : 0;
    const r = cs.map((c, i) => c - mc - k * (ts[i] - mt));
    let wechsel = 0, zeichen = 0;
    r.forEach(v => { if (v > 4 && zeichen <= 0) { if (zeichen < 0) wechsel++; zeichen = 1; } else if (v < -4 && zeichen >= 0) { if (zeichen > 0) wechsel++; zeichen = -1; } });
    const rate = wechsel / 2 / dauer;
    const sort = r.slice().sort((a, b) => a - b), tiefe = (sort[Math.floor(sort.length * .9)] - sort[Math.floor(sort.length * .1)]) / 2;
    return rate >= 3.5 && rate <= 9 && tiefe >= 10 && tiefe <= 120 && Math.abs(mc) <= S.tol * 1.2;
  }
  function abschliessen(n) {
    if (n.wert != null) return;
    if (n.vor) { n.wert = 1; vorZeileFertig(n); return; }
    const dauer = n.z1 - n.z0;
    n.wert = klemm((n.treffer + n.perfekt * .25) / (dauer * .78), 0, 1);
    S.punkte += n.wert * n.gewicht;
    if (n.abwZ > .05) {
      const kl = ((Math.round(n.m) % 12) + 12) % 12, ts = S.tonStatistik[kl] || (S.tonStatistik[kl] = { a: 0, z: 0 });
      ts.a += n.abw; ts.z += n.abwZ;
    }
    if (n.schnoerkel && n.wert >= .5 && vibrato(n)) {
      n.geschnoerkelt = true; S.schnoerkel++; S.bonus += n.gewicht * .5;
      S.urteilSchnoerkel = performance.now() + 1400;
      if (!ruhig) for (let i = 0; i < 18; i++) S.funken.push({ t: S.letzteTv, m: n.m, vx: Math.random() * 120 - 60, vy: -Math.random() * 90 - 10, leben: 1 });
    }
    n.proben = null;
    const z = S.st.zeilen[n.zeile];
    if (z && z.noten[z.noten.length - 1] === n.i && !z.vor) zeileFertig(z);
  }
  function zeileFertig(z) {
    let s = 0, g2 = 0; z.noten.forEach(i => { const x = S.st.noten[i]; s += x.wert * x.d; g2 += x.d; });
    z.wert = g2 ? s / g2 : 0;
    S.letzteZeile = z;
    const U = T().spiel.urteil;
    const art = z.wert >= .9 ? "perfekt" : z.wert >= .7 ? "gut" : z.wert >= .45 ? "knapp" : "daneben";
    if (z.wert >= .7) S.serie++; else S.serie = 0;
    S.besteSerie = Math.max(S.besteSerie, S.serie);
    S.urteil = { text: U[art] + (S.serie >= 3 ? " · " + T().spiel.serie(S.serie) : ""), art, bis: performance.now() + 1600 };
    if (art === "perfekt") werfen("gut", 3); else if (art === "gut" && Math.random() < .5) werfen("gut", 1); else if (art === "daneben") werfen("schlecht", 1 + (Math.random() < .4 ? 1 : 0));
    if (S.duell) duellTreffer(z);
  }
  /* ---------- Duell ---------- */
  function duellTreffer(z) {
    const D = S.duell; if (D.ende) return;
    const dmg = Math.round(z.wert * D.proZeile * (z.wert >= .9 ? 1.4 : 1));
    z.schaden = dmg; D.leben = Math.max(0, D.leben - dmg);
    (D.rundenWert[z.runde] = D.rundenWert[z.runde] || []).push(z.wert);
    if (dmg > 0) D.blitz.push({ wer: "gegner", text: "−" + dmg, bis: performance.now() + 1200 });
    if (D.leben <= 0) duellEnde("sieg", z);
    duellAnzeigen();
  }
  function vorZeileFertig(n) {
    if (!S.duell || S.duell.ende) return;
    const z = S.st.zeilen[n.zeile];
    if (!z || !z.gegner || z.noten[z.noten.length - 1] !== n.i) return;
    /* nur nach der zweiten Gegnerzeile einer Runde zuschlagen */
    const naechste = S.st.zeilen[n.zeile + 1];
    if (naechste && naechste.gegner) return;
    const D = S.duell, vor = D.rundenWert[z.runde - 1];
    const schnitt = vor && vor.length ? vor.reduce((a, b) => a + b, 0) / vor.length : .5;
    const dmg = Math.round(S.st.duell.schaden * klemm(1.15 - schnitt, .2, 1.15) * (E.grad === "leicht" ? .8 : E.grad === "schwer" ? 1.15 : 1));
    D.fassung = Math.max(0, D.fassung - dmg);
    D.blitz.push({ wer: "barradin", text: "−" + dmg, bis: performance.now() + 1200 });
    if (D.fassung <= 0) duellEnde("pleite", z);
    duellAnzeigen();
  }
  function duellEnde(art, z) {
    const D = S.duell; D.ende = art;
    S.ende = Math.min(S.ende, z.z1 + 1.6);
    S.urteil = { text: art === "sieg" ? "⚔ " + T().duell.ko : T().duell.einknick, art: art === "sieg" ? "perfekt" : "daneben", bis: performance.now() + 2500 };
    /* Musik ausklingen lassen, Schlussakkord */
    const z0 = S.t0 + z.z1 + .1;
    try { S.bus.gain.setTargetAtTime(0, z0, .25); } catch (_) {}
    const g0 = S.st.grund + S.schieb;
    if (art === "sieg") { werfen("gut", 6); [0, 4, 7, 12].forEach((s, i) => spielen("harfe", lage(g0 + s, 55), z0 + .3 + i * .06, .3, 2, ausgang)); }
    else [0, 3, 6].forEach((s, i) => spielen("pos", inLage("pos", g0 + s - 12), z0 + .3 + i * .25, .35, .6, ausgang));
  }
  /* ---------- Bardische Inspiration ---------- */
  function inspirieren() {
    if (!S || S.pause || S.wiedergabe || S.insp <= 0) return;
    const z = S.letzteZeile;
    if (!z || z.wert >= .99) { S.urteil = { text: T().spiel.inspLeer, art: "knapp", bis: performance.now() + 1200 }; return; }
    S.insp--;
    const w = 1 + Math.floor(Math.random() * 6), plus = w * .08;
    const vorher = z.wert;
    z.noten.forEach(i => { const n = S.st.noten[i]; const neu = Math.min(1, n.wert + plus); S.punkte += (neu - n.wert) * n.gewicht; n.wert = neu; });
    let s = 0, g2 = 0; z.noten.forEach(i => { const x = S.st.noten[i]; s += x.wert * x.d; g2 += x.d; }); z.wert = g2 ? s / g2 : 0;
    S.urteil = { text: T().spiel.inspWurf(w, Math.round((z.wert - vorher) * 100)), art: "perfekt", bis: performance.now() + 2000 };
    werfen("gut", 2);
    if (S.duell && !S.duell.ende && !z.vor) {
      const D = S.duell, neu = Math.round(z.wert * D.proZeile * (z.wert >= .9 ? 1.4 : 1)), plusDmg = Math.max(0, neu - z.schaden);
      z.schaden = neu; D.leben = Math.max(0, D.leben - plusDmg);
      const rw = D.rundenWert[z.runde]; if (rw && rw.length) rw[rw.length - 1] = z.wert;
      if (plusDmg) D.blitz.push({ wer: "gegner", text: "−" + plusDmg, bis: performance.now() + 1200 });
      if (D.leben <= 0) duellEnde("sieg", z);
      duellAnzeigen();
    }
    if (!ruhig) { const k = 1 + w; for (let i = 0; i < 6 * k; i++) S.funken.push({ t: S.letzteTv, m: S.st.noten[z.noten[z.noten.length - 1]].m, vx: Math.random() * 160 - 140, vy: -Math.random() * 80, leben: .9 }); }
    hudKnoepfe();
  }

  /* ---------- Zeichnen ---------- */
  const FARBE = { gold: "#ffd27a", gruen: "#9fe08f", orange: "#e8a24a", glut: "rgba(224,160,70,", tuerkis: "#5fd6b8", rot: "#e0605a", pergament: "#ebe2cc" };
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
    r = Math.max(0, Math.min(r, h / 2, w / 2));
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
  function zeichnen(t, tv) {
    if (!g) return;
    messen();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    hintergrund();
    const st = S.st, oben = S.duell ? 84 : 48, pubH = E.publikum && S.pub ? Math.round(klemm(ch * .13, 40, 72)) : 0, unten = 10 + pubH, x0 = Math.round(cw * .24);
    const pxs = (cw - x0) / 4.4;
    const X = z => x0 + (z - t) * pxs;
    const zeile = (ch - oben - unten) / (S.hi - S.lo);
    const Y = m => oben + (S.hi - m) * zeile;
    /* Tonlinien */
    g.font = "10px system-ui, sans-serif"; g.textBaseline = "middle";
    const grundKl = ((st.grund + S.schieb) % 12 + 12) % 12;
    for (let m = Math.ceil(S.lo); m <= S.hi; m++) {
      const grund = (((m % 12) + 12) % 12) === grundKl;
      g.fillStyle = grund ? "rgba(224,160,70,.16)" : "rgba(235,226,204,.045)";
      g.fillRect(0, Math.round(Y(m)), cw, 1);
      if (grund) { g.fillStyle = "rgba(224,160,70,.55)"; g.fillText(tonName(m), 4, Y(m) - 7); }
    }
    /* Taktstriche */
    const L = st.takt;
    for (let b = Math.ceil((t - 2) / st.spb / L) * L; b * st.spb < t + 5; b += L) {
      const x = X(b * st.spb); if (x < 0 || x > cw) continue;
      g.fillStyle = "rgba(235,226,204,.05)"; g.fillRect(Math.round(x), oben - 6, 1, ch - oben - unten + 6);
    }
    /* Atemzeichen zwischen den Zeilen */
    g.font = "bold 20px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "alphabetic";
    for (let k = 0; k < st.zeilen.length - 1; k++) {
      const z = st.zeilen[k], n = st.zeilen[k + 1]; if (z.vor || !z.noten.length) continue;
      const luecke = n.z0 - z.z1; if (luecke < .2) continue;
      const x = X(z.z1 + Math.min(luecke / 2, .35)); if (x < -10 || x > cw + 10) continue;
      g.fillStyle = "rgba(95,214,184,.55)"; g.fillText("’", x, oben + 4);
    }
    g.textAlign = "left";
    /* Noten */
    const h = Math.max(7, Math.min(22, zeile * .92));
    for (let k = Math.max(0, S.ni - 14); k < st.noten.length; k++) {
      const n = st.noten[k];
      const xa = X(n.z0), xe = X(n.z1);
      if (xe < -10) continue; if (xa > cw + 10) break;
      const y = Y(n.m) - h / 2, w = Math.max(4, xe - xa - 2);
      if (n.vor) {
        const farbe = n.instr && n.instr !== "fl" ? "224,96,90" : "95,214,184";
        g.setLineDash([5, 4]); g.strokeStyle = "rgb(" + farbe + ")"; g.lineWidth = 1.5; rundRect(xa, y, w, h, h / 2.4);
        g.fillStyle = "rgba(" + farbe + "," + (tv >= n.z0 && tv < n.z1 ? .4 : .16) + ")"; g.fill(); g.stroke(); g.setLineDash([]);
        continue;
      }
      const vorbei = n.wert != null, laeuft = !vorbei && tv >= n.z0;
      let fuell = FARBE.glut + ".22)", rand = FARBE.glut + ".85)";
      if (vorbei) { const w2 = n.wert; fuell = w2 >= .85 ? "rgba(255,210,122,.75)" : w2 >= .5 ? "rgba(159,224,143,.55)" : w2 >= .15 ? "rgba(232,162,74,.35)" : "rgba(208,106,90,.22)"; rand = w2 >= .85 ? FARBE.gold : w2 >= .5 ? FARBE.gruen : w2 >= .15 ? FARBE.orange : "rgba(208,106,90,.6)"; }
      if (n.geschnoerkelt) { g.shadowColor = FARBE.gold; g.shadowBlur = 14; }
      rundRect(xa, y, w, h, h / 2.4); g.fillStyle = fuell; g.fill(); g.lineWidth = laeuft ? 2 : 1.2; g.strokeStyle = rand; g.stroke(); g.shadowBlur = 0;
      if (laeuft) {
        const anteil = klemm((tv - n.z0) / (n.z1 - n.z0), 0, 1), quote = n.zeit > 0 ? n.treffer / n.zeit : 0;
        g.save(); rundRect(xa, y, w, h, h / 2.4); g.clip();
        g.fillStyle = quote >= .6 ? "rgba(255,210,122,.75)" : quote >= .3 ? "rgba(159,224,143,.5)" : "rgba(235,226,204,.12)";
        g.fillRect(xa, y, w * anteil, h); g.restore();
      }
      if (n.schnoerkel) {
        const sx = xe - 4, sy = y - 4, p = ruhig ? 1 : .75 + .25 * Math.sin(t * 6);
        g.fillStyle = n.geschnoerkelt ? FARBE.gold : "rgba(255,210,122," + (.55 * p).toFixed(2) + ")"; g.font = "bold 13px Georgia, serif"; g.textAlign = "center"; g.fillText("✦", sx, sy); g.textAlign = "left";
        if (laeuft && !ruhig) { g.strokeStyle = "rgba(255,210,122,.35)"; g.lineWidth = 1.2; g.beginPath(); for (let q = 0; q <= 20; q++) { const xx = xa + w * q / 20, yy = y - 9 + Math.sin(q * 1.6 + t * 8) * 2.2; q ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
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
    S.funken = S.funken.filter(f => tv - f.t < f.leben && tv >= f.t - .05);
    S.funken.forEach(f => { const a = (tv - f.t); g.fillStyle = "rgba(255,210,122," + (1 - a / f.leben).toFixed(2) + ")"; g.beginPath(); g.arc(x0 + f.vx * a, Y(f.m) + f.vy * a + 60 * a * a, 2, 0, 7); g.fill(); });
    /* Lauflinie */
    const lg = g.createLinearGradient(0, oben, 0, ch - unten);
    lg.addColorStop(0, "rgba(224,160,70,0)"); lg.addColorStop(.5, "rgba(224,160,70,.55)"); lg.addColorStop(1, "rgba(224,160,70,0)");
    g.fillStyle = lg; g.fillRect(x0 - 1, oben - 8, 2, ch - oben - unten + 8);
    /* Stimme jetzt */
    if (S.gefaltet != null) {
      const y = Y(klemm(S.gefaltet, S.lo, S.hi));
      g.shadowColor = S.ok ? FARBE.gruen : "rgba(235,226,204,.6)"; g.shadowBlur = 14;
      g.fillStyle = S.ok ? FARBE.gruen : FARBE.pergament; g.beginPath(); g.arc(x0, y, 7, 0, 7); g.fill(); g.shadowBlur = 0;
      if (S.aktiv && !S.aktiv.vor && !S.ok && S.abw != null) {
        g.fillStyle = FARBE.orange; g.beginPath();
        if (S.abw < 0) { g.moveTo(x0 + 12, y - 4); g.lineTo(x0 + 18, y - 12); g.lineTo(x0 + 24, y - 4); } else { g.moveTo(x0 + 12, y + 4); g.lineTo(x0 + 18, y + 12); g.lineTo(x0 + 24, y + 4); }
        g.fill();
      }
    }
    /* Publikum */
    if (pubH) {
      const yb = ch - 2, pg = g.createLinearGradient(0, ch - pubH - 16, 0, ch);
      pg.addColorStop(0, "rgba(14,10,18,0)"); pg.addColorStop(1, "rgba(14,10,18,.85)");
      g.fillStyle = pg; g.fillRect(0, ch - pubH - 16, cw, pubH + 16);
      const leute = S.pub.leute, n = leute.length, laune = klemm(S.laune, 0, 1), zeit = performance.now() / 1000;
      if (leute.length === 1 && /^drache/.test(leute[0])) figur(leute[0], 0, yb, pubH * 1.5, zeit, laune, 0);
      else leute.forEach((typ, i) => { const fx = cw * (.06 + .88 * (i + .5) / n) + ((i * 37) % 11) - 5; figur(typ, fx, yb, pubH * (.86 + ((i * 13) % 5) * .05), zeit, laune, i); });
      /* Würfe */
      const jetzt = performance.now() / 1000;
      S.wuerfe = S.wuerfe.filter(w => jetzt - w.t0 < w.dauer * 2.2);
      S.wuerfe.forEach(w => {
        const a = (jetzt - w.t0) / w.dauer, fx = cw * (.06 + .88 * (w.i + .5) / Math.max(1, n));
        const sx = leute.length === 1 ? cw * .78 : fx, sy = ch - pubH * .7;
        const zx = cw * w.zx, zy = oben + (ch - oben - unten) * w.zy;
        const k = Math.min(1, a), x = sx + (zx - sx) * k, y = sy + (zy - sy) * k - Math.sin(Math.PI * k) * (ch * .25);
        wurfMalen(w, x, y, a);
      });
    }
    /* Einzählen */
    const introSek = st.intro * st.spb;
    if (t < introSek && !S.wiedergabe) {
      const rest = Math.ceil((introSek - t) / st.spb);
      if (rest <= 4 && rest > 0) {
        g.fillStyle = "rgba(255,210,122," + (.35 + .5 * (1 - ((introSek - t) / st.spb) % 1)).toFixed(2) + ")";
        g.font = "700 " + Math.round(Math.min(64, ch * .22)) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(String(rest), cw / 2, ch * .5); g.textAlign = "left";
      }
    }
    /* Urteil */
    const jetztMs = performance.now();
    const text = S.urteilSchnoerkel && jetztMs < S.urteilSchnoerkel ? { text: T().spiel.schnoerkel, art: "perfekt", bis: S.urteilSchnoerkel } : S.urteil;
    if (text && jetztMs < text.bis) {
      const a = klemm((text.bis - jetztMs) / 600, 0, 1);
      const farbe = { perfekt: "255,210,122", gut: "159,224,143", knapp: "232,162,74", daneben: "208,106,90" }[text.art];
      g.fillStyle = "rgba(" + farbe + "," + a.toFixed(2) + ")"; g.font = "700 " + (cw < 420 ? 17 : 21) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.fillText(text.text, cw * .6, oben + 24); g.textAlign = "left";
    }
    if (!S.wiedergabe && t > introSek + 4 && S.stumm > 6 && S.stumm / Math.max(1, S.gehoert) > .9 && !(S.aktiv && S.aktiv.vor)) {
      g.fillStyle = "rgba(235,226,204,.7)"; g.font = "13px system-ui, sans-serif"; g.textAlign = "center"; g.fillText(T().spiel.leise, cw * .6, ch - unten - 12); g.textAlign = "left";
    }
  }
  /* Ruhebild hinter den Menüs */
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
      textJetzt.innerHTML = zeileHtml(z); textDann.innerHTML = n ? zeileHtml(n) : "&nbsp;";
      textJetzt.classList.toggle("gegner", !!(z && z.gegner));
      S.silbenEl = Array.from(textJetzt.querySelectorAll("[data-n]"));
    }
    (S.silbenEl || []).forEach(el => {
      const n = st.noten[+el.dataset.n];
      const zustand = n.vor ? (tv >= n.z0 ? "dran" : "") : n.wert != null ? (n.wert >= .5 ? "gut" : "mies") : tv >= n.z0 ? "dran" : "";
      if (el.dataset.z !== zustand) { el.dataset.z = zustand; el.className = zustand; }
    });
  }
  function zeileHtml(z) {
    if (!z) return "&nbsp;";
    if (z.vor && !z.gegner) return '<span class="kh-vor">' + esc(T().echoZeile) + "</span>";
    const inhalt = z.noten.map(i => { const n = S.st.noten[i]; return '<span data-n="' + i + '">' + esc(n.silbe) + "</span>" + (n.ende ? " " : ""); }).join("");
    return z.gegner ? '<span class="kh-gegner-zeile">' + esc(S.st.duell.name[sprache()] || S.st.duell.name.de) + ": </span>" + inhalt : inhalt;
  }
  function hudAktualisieren(t) {
    const p = Math.round(S.punkte + S.bonus);
    if (hudPunkte._w !== p) { hudPunkte._w = p; hudPunkte.textContent = p.toLocaleString(sprache() === "en" ? "en-GB" : "de-DE"); }
    hudBalken.style.transform = "scaleX(" + klemm(t / S.ende, 0, 1).toFixed(3) + ")";
    const pg = mic && !S.wiedergabe ? klemm(mic.pegel / .12, 0, 1) : 0;
    hudPegel.style.transform = "scaleY(" + pg.toFixed(2) + ")";
    const ins = $(".kh-insp"), bereit = !!S.letzteZeile && S.insp > 0;
    if (ins && ins._b !== bereit) { ins._b = bereit; ins.classList.toggle("bereit", bereit); }
    if (S.duell && S.duell.blitz.length) duellBlitz();
  }
  function hudKnoepfe() {
    const ins = $(".kh-insp");
    ins.hidden = !S || !!S.wiedergabe;
    if (S) { ins.disabled = S.insp <= 0; ins.querySelector("b").textContent = S.insp; ins.setAttribute("aria-label", T().spiel.insp + " (" + S.insp + ")"); ins.title = T().spiel.insp; }
    $(".kh-pause").hidden = !!(S && S.wiedergabe);
    const sp = $(".kh-stopp"); sp.hidden = !(S && S.wiedergabe); sp.textContent = T().spiel.stopp;
  }
  function duellAnzeigen() {
    const el = $(".kh-duell");
    if (!S || !S.duell) { el.hidden = true; return; }
    el.hidden = false;
    const D = S.duell, d = S.st.duell, L = sprache();
    if (!el._gebaut || el._id !== d.id) {
      el._gebaut = true; el._id = d.id;
      el.innerHTML = '<div class="kh-d-seite b"><span class="kh-d-name">' + esc(T().duell.fassung) + '</span><span class="kh-d-balken"><i></i></span><em class="kh-d-blitz"></em></div>' +
        '<div class="kh-d-seite g"><span class="kh-d-name">' + esc(d.name[L] || d.name.de) + '</span><span class="kh-d-balken"><i></i></span><em class="kh-d-blitz"></em></div>' +
        (d.bild ? '<img class="kh-d-bild" src="' + esc(d.bild) + '" alt="">' : '<span class="kh-d-bild sym">' + esc(d.symbol || "⚔") + "</span>");
    }
    el.querySelector(".b i").style.transform = "scaleX(" + (D.fassung / 100).toFixed(3) + ")";
    el.querySelector(".g i").style.transform = "scaleX(" + (D.leben / 100).toFixed(3) + ")";
    el.classList.toggle("knapp", D.fassung < 30);
  }
  function duellBlitz() {
    const D = S.duell, jetzt = performance.now();
    D.blitz = D.blitz.filter(b => b.bis > jetzt);
    ["barradin", "gegner"].forEach(wer => {
      const el = $(".kh-duell ." + (wer === "barradin" ? "b" : "g") + " .kh-d-blitz"); if (!el) return;
      const b = D.blitz.filter(x => x.wer === wer).pop();
      const txt = b ? b.text : "";
      if (el.textContent !== txt) { el.textContent = txt; el.classList.remove("an"); void el.offsetWidth; if (txt) el.classList.add("an"); }
    });
  }

  /* ---------- Ende eines Auftritts ---------- */
  function fertig() {
    const st = S.st, D = S.duell;
    st.noten.forEach(n => abschliessen(n));
    const sing = st.noten.filter(n => !n.vor && !(D && D.ende && n.z1 > S.ende));
    /* Im Duell nach K.O. zählen nur die gesungenen Zeilen */
    let pct;
    if (D && D.ende) { const gw = sing.reduce((a, n) => a + n.gewicht, 0) || 1; pct = Math.round(sing.reduce((a, n) => a + n.wert * n.gewicht, 0) / gw * 100); }
    else pct = Math.round(S.punkte / 100);
    const getroffen = sing.filter(n => n.wert >= .5).length;
    let a = 0, z = 0; sing.forEach(n => { a += n.abw; z += n.abwZ; });
    const tendenz = z > .5 ? Math.round(a / z) : null;
    const stummAnteil = S.gehoert > 3 ? S.stumm / S.gehoert : 0;
    const rek = rekorde(), alt = rek[st.id] | 0, neu = pct > alt;
    if (neu) { rek[st.id] = pct; schreib(K.rekorde, JSON.stringify(rek)); }
    /* Stimmbuch: Tonstatistik, Verlauf, Tageswerte, Einsing-Strähne */
    const buch = buchLesen(), tag = heute();
    Object.keys(S.tonStatistik).forEach(kl => { const s = S.tonStatistik[kl], b = buch.toene[kl] || (buch.toene[kl] = { a: 0, z: 0 }); b.a += s.a; b.z += s.z; });
    buch.verlauf.unshift({ id: st.id, p: pct, d: Date.now(), g: E.grad, t: st.buehne ? st.titel : undefined }); buch.verlauf = buch.verlauf.slice(0, 12);
    if (!stummAnteil || stummAnteil < .8) { const tw = buch.tage[tag] || [0, 0]; buch.tage[tag] = [tw[0] + pct, tw[1] + 1]; }
    const tageAlt = Object.keys(buch.tage).sort(); while (tageAlt.length > 60) delete buch.tage[tageAlt.shift()];
    let strähneNeu = 0;
    if (st.uebung === "taeglich" && stummAnteil < .8 && !buch.einsingen.includes(tag)) { buch.einsingen.push(tag); buch.einsingen = buch.einsingen.slice(-120); strähneNeu = straehne(buch); }
    buchSchreiben(buch);
    /* Auftrittswurf (für Tournee und Bestenliste) */
    const roh = 1 + Math.floor(Math.random() * 20), bonusW = Math.floor(pct / 10);
    let wurf = null, frei = false, duell = null;
    if (station != null && !D) {
      const w = wegLesen(), stufe = DATEN.weg[station], sterne = pct >= 85 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
      w.sterne[station] = Math.max(w.sterne[station] | 0, sterne);
      if (sterne > 0 && w.frei <= station && station < DATEN.weg.length - 1) { w.frei = station + 1; frei = true; }
      wegSchreiben(w);
      wurf = { roh, bonus: bonusW, summe: roh + bonusW, sg: stufe.sg, sterne, geschafft: roh === 20 || (roh !== 1 && roh + bonusW >= stufe.sg && sterne > 0) };
    } else if (st.lied || st.duell) wurf = { roh, bonus: bonusW, summe: roh + bonusW, sg: 0, frei: true };
    if (D) {
      const sieg = D.ende === "sieg";
      duell = { sieg, leben: D.leben, fassung: D.fassung, d: st.duell };
      if (sieg) { const ds = duellStand(); ds[st.duell.id] = Math.max(ds[st.duell.id] | 0, pct || 1); schreib(K.duelle, JSON.stringify(ds)); }
    }
    const wiedergabe = { st, schieb: S.schieb, spurAll: S.spurAll, ende: S.ende, punkte: S.punkte, bonus: S.bonus, pub: S.pub, duell: D ? { leben: D.leben, fassung: D.fassung } : null };
    ergebnis = { st, pct, punkte: Math.round(S.punkte + S.bonus), getroffen, gesamt: sing.length, tendenz, neu, alt, wurf, frei, stumm: stummAnteil > .8, besteSerie: S.besteSerie, station, duell,
      schnoerkel: S.schnoerkel, strähne: strähneNeu, wiedergabe, aufnahme: null, aufnahmeLaedt: !!S.aufnahme, liste: null };
    const aufn = S.aufnahme; S.aufnahme = null;
    if (aufn) {
      const startZ = aufn.start;
      aufnahmeBeenden(aufn).then(blob => {
        const erg = ergebnis; if (!erg || erg.wiedergabe.st !== st) return;
        erg.aufnahmeLaedt = false; erg.aufnahme = blob ? { blob, start: startZ == null ? 0 : startZ } : null;
        if (ansicht === "ergebnis") { const k = panel.querySelector(".kh-anhoeren"); if (k) { k.disabled = !erg.aufnahme; if (!erg.aufnahme) k.hidden = true; } }
      });
    }
    abbrechen();
    ansicht = "ergebnis"; zeigen();
    if (wurf && (st.lied || station != null)) listeLaden();
  }

  /* ---------- Wiedergabe: eigene Aufnahme + Begleitung, die Notenbahn läuft mit ---------- */
  async function wiedergabeStarten() {
    const erg = ergebnis; if (!erg || !erg.aufnahme) return;
    audio();
    let buf;
    try { const ab = await erg.aufnahme.blob.arrayBuffer(); buf = await new Promise((res, rej) => { const x = ctx.decodeAudioData(ab, res, rej); if (x && x.catch) x.catch(rej); }); }
    catch (_) { return; }
    const W = erg.wiedergabe, st = W.st;
    const ev = begleitung(st, W.schieb, { ohneFuehrung: true }).map(e => Object.assign({}, e, { laut: e.laut * .6 }));
    const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(ausgang);
    S = { st, schieb: W.schieb, ev, ei: 0, t0: ctx.currentTime + .3, pause: false, wiedergabe: true, spur: [], spurAll: W.spurAll, spurIdx: 0, punkte: W.punkte, bonus: W.bonus, ende: W.ende, bus,
      funken: [], wuerfe: [], laune: .6, insp: 0, letzteZeile: null, zeileJetzt: -1, pub: W.pub, tol: TOL[E.grad], stumm: 0, gehoert: 0, ni: 0 };
    const ms = st.noten.map(n => n.m);
    let lo = Math.min(...ms) - 3, hi = Math.max(...ms) + 3;
    if (hi - lo < 14) { const mit = (hi + lo) / 2; lo = mit - 7; hi = mit + 7; }
    S.lo = lo; S.hi = hi;
    if (W.duell && st.duell) { S.duell = { leben: W.duell.leben, fassung: W.duell.fassung, blitz: [], rundenWert: [] }; }
    const q = ctx.createBufferSource(), qg = ctx.createGain(); q.buffer = buf; qg.gain.value = 1.4; q.connect(qg); qg.connect(bus);
    const versatz = (erg.aufnahme.start || 0) - E.versatz / 1000;
    const out = ctx.outputLatency || 0;
    if (versatz >= 0) q.start(S.t0 + versatz + out); else q.start(S.t0 + out, -versatz);
    S.quelle = q;
    ansicht = "spiel"; zeigen();
    planen();
    if (!takt) takt = setInterval(() => { if (S && !S.pause) planen(); }, 100);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(rahmen);
  }
  function wiedergabeEnde() {
    if (!S || !S.wiedergabe) return;
    abbrechen(true);
    ansicht = "ergebnis"; zeigen();
    if (ergebnis && ergebnis.liste) listeNeu();
  }

  /* =================================================================
     BESTENLISTE (gemeinsam über Supabase – dieselbe Tabelle wie Barradins Auftritt, eigene Stufen „kehle-…“)
     ================================================================= */
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  function server(pfad, body) {
    const h = { apikey: SERVER.key, "Content-Type": "application/json" };
    const opt = body === undefined ? { headers: h, cache: "no-store" } : { method: "POST", headers: h, body: JSON.stringify(body) };
    const ab = window.AbortController ? new AbortController() : null, uhr = ab && setTimeout(() => ab.abort(), 10000);
    if (ab) opt.signal = ab.signal;
    return fetch(SERVER.url + pfad, opt)
      .then(r => r.ok ? (r.status === 204 ? null : r.json()) : Promise.reject(r.status))
      .finally(() => clearTimeout(uhr));
  }
  const listenStufe = () => "kehle-" + E.grad;
  const zahl = v => { const n = Number(v); return isFinite(n) ? n : 0; };
  const sauber = l => (Array.isArray(l) ? l : []).filter(e => e && typeof e === "object").map(e => ({ name: String(e.name || "").slice(0, 20), prozent: zahl(e.prozent), wurf: zahl(e.wurf), serie: zahl(e.serie), erstellt: String(e.erstellt || "") }));
  const lokalListe = () => json(K.liste) || {};
  function listeLaden() {
    const erg = ergebnis; if (!erg) return;
    const id = erg.st.id, schl = listenStufe() + "|" + id;
    erg.liste = { laedt: true, eintraege: [], server: null, schl };
    listeNeu();
    server("/rest/v1/auftritt_bestenliste?select=name,prozent,wurf,serie,erstellt&stufe=eq." + encodeURIComponent(listenStufe()) + "&lied=eq." + encodeURIComponent(id) + "&order=prozent.desc,serie.desc,erstellt.asc&limit=10")
      .then(l => { if (ergebnis !== erg) return; erg.liste = { eintraege: sauber(l), server: true, schl }; })
      .catch(() => { if (ergebnis !== erg) return; erg.liste = { eintraege: sauber(lokalListe()[schl]).sort((a, b) => b.prozent - a.prozent).slice(0, 10), server: false, schl }; })
      .then(listeNeu);
  }
  function listeHtml() {
    const erg = ergebnis, L = erg && erg.liste, tx = T().liste;
    if (!L) return "";
    if (L.laedt) return '<p class="kh-klein">…</p>';
    const KZ = window.ImresKuerzel;
    let html = "<h5>" + esc(tx.titel) + " · " + esc(T().grade[E.grad]) + "</h5>";
    html += L.eintraege.length ? '<table class="kh-tabelle"><thead><tr>' + tx.spalten.map(s => "<th>" + esc(s) + "</th>").join("") + "</tr></thead><tbody>" +
      L.eintraege.map((e, i) => "<tr" + (erg.meinEintrag && e.erstellt === erg.meinEintrag ? ' class="mein"' : "") + "><td>" + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + "</td><td>" + esc(e.name) + "</td><td>" + e.prozent + "</td><td>" + e.wurf + "</td></tr>").join("") + "</tbody></table>"
      : '<p class="kh-klein">' + esc(tx.leer) + "</p>";
    if (L.server === false) html += '<p class="kh-klein">' + esc(tx.nurHier) + "</p>";
    if (erg.eingetragen) html += '<p class="kh-neu">' + esc(erg.eingetragen) + "</p>";
    else if (erg.pct > 0 && KZ) html += '<div class="kh-eintrag">' + KZ.feld({ klasse: "kh-name", aus: erg.sendet }) + '<button type="button" class="tav-knopf" data-tun="eintragen"' + (erg.sendet ? " disabled" : "") + ">" + esc(erg.sendet ? tx.sendet : tx.eintragen) + "</button></div>" +
      (erg.fehler ? '<p class="kh-klein kh-hinweis">' + esc(erg.fehler) + "</p>" : "");
    return html;
  }
  function listeNeu() { const el = panel.querySelector(".kh-liste-box"); if (el && ansicht === "ergebnis") el.innerHTML = listeHtml(); }
  function eintragen() {
    const erg = ergebnis, KZ = window.ImresKuerzel; if (!erg || !erg.liste || erg.sendet || erg.eingetragen || !KZ) return;
    const feld = panel.querySelector(".kh-name"), name = KZ.wert(feld); if (!name) { if (feld) feld.focus(); return; }
    const tx = T().liste, schl = erg.liste.schl;
    const e = { name, prozent: klemm(erg.pct, 0, 1000), wurf: klemm(erg.wurf ? erg.wurf.summe : 1, 1, 30), serie: klemm(erg.besteSerie, 0, 100000), erstellt: new Date().toISOString() };
    const lok = lokalListe(); lok[schl] = sauber(lok[schl]).concat([e]).sort((a, b) => b.prozent - a.prozent).slice(0, 10); schreib(K.liste, JSON.stringify(lok));
    erg.sendet = true; erg.fehler = ""; listeNeu();
    server("/rest/v1/rpc/auftritt_eintragen", { p_name: e.name, p_stufe: listenStufe(), p_lied: erg.st.id, p_prozent: e.prozent, p_wurf: e.wurf, p_serie: e.serie })
      .then(() => server("/rest/v1/auftritt_bestenliste?select=name,prozent,wurf,serie,erstellt&stufe=eq." + encodeURIComponent(listenStufe()) + "&lied=eq." + encodeURIComponent(erg.st.id) + "&order=prozent.desc,serie.desc,erstellt.asc&limit=10"))
      .then(l => {
        erg.liste = { eintraege: sauber(l), server: true, schl }; erg.sendet = false;
        const platz = erg.liste.eintraege.findIndex(x => x.name === e.name && x.prozent === e.prozent) + 1;
        if (platz) erg.meinEintrag = erg.liste.eintraege[platz - 1].erstellt;
        erg.eingetragen = platz ? tx.eingetragen(platz) : tx.eingetragenOhne; listeNeu();
      })
      .catch(() => { erg.sendet = false; erg.fehler = tx.fehler; listeNeu(); });
  }

  /* =================================================================
     EINMESSEN, STIMMGABEL MIT BORDUN, ATEM, VERZÖGERUNG
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
  function einmessAnzeige() { if (ansicht === "einmessen") zeigen(); }
  function einmessLive(e) {
    const el = panel.querySelector(".kh-mess"); if (!el) return;
    const em = einmess;
    el.querySelector(".kh-m-ton").textContent = em.aktuell != null && e.m != null ? tonName(em.aktuell) : "–";
    el.querySelector(".kh-m-ring i").style.transform = "scaleX(" + klemm(em.halten / 50, 0, 1).toFixed(2) + ")";
    el.querySelector(".kh-m-info").textContent = e.m == null ? T().einmessen.nichts : em.halten > 5 ? T().einmessen.halten : "";
  }
  /* Bordun für die Stimmgabel: läuft durchgehend, bis man ihn ausschaltet */
  let bordun = null;
  function bordunStarten(m) {
    audio(); bordunStoppen();
    const bus = ctx.createGain(); bus.gain.value = E.kopf ? .9 : .5; bus.connect(ausgang);
    bordun = { m, bus, bis: ctx.currentTime + .05 };
    ["orgel_" + naechste("orgel", lage(m, 36)), "vc_" + naechste("vc", lage(m, 36)), "orgel_" + naechste("orgel", lage(m + 7, 43))].forEach(probeLaden);
    const weiter = () => {
      if (!bordun) return;
      const ende = ctx.currentTime + 3;
      if (bordun.bis < ende) {
        const von = bordun.bis, b = bordun;
        bordunEreignisse((z, g2, mm, laut, dauer, ein) => spielen(g2, mm, von + z, laut, dauer, b.bus, ein), m, 0, 2.4);
        bordun.bis = von + 2.4;
      }
    };
    weiter(); bordun.uhr = setInterval(weiter, 400);
  }
  function bordunStoppen() {
    if (!bordun) return;
    clearInterval(bordun.uhr);
    const b = bordun.bus; try { b.gain.setTargetAtTime(0, ctx.currentTime, .3); setTimeout(() => { try { b.disconnect(); } catch (_) {} }, 1500); } catch (_) {}
    bordun = null;
  }
  const bordunGrund = () => typeof E.bordunTon === "number" ? E.bordunTon : (gemessen() ? E.tief + 2 : 50);
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
    if (e.m == null) { gabel.leer = (gabel.leer | 0) + 1; if (gabel.leer > 25) { el.classList.add("leer"); el.querySelector(".kh-g-ton").textContent = "–"; el.querySelector(".kh-g-info").textContent = tx.leer; el.querySelector(".kh-g-iv").textContent = ""; } return; }
    gabel.leer = 0; el.classList.remove("leer");
    gabel.werte.push(e.m); if (gabel.werte.length > 6) gabel.werte.shift();
    const m = gabel.werte.reduce((a, b) => a + b, 0) / gabel.werte.length;
    /* mit Bordun: Abstand zum Grundton statt zur nächsten Taste */
    let r = Math.round(m), c = Math.round((m - r) * 100), iv = "";
    if (bordun) { const rel = m - bordun.m, oktaven = Math.floor(rel / 12), rest = rel - 12 * oktaven, st = Math.round(rest); c = Math.round((rest - st) * 100); iv = T().intervalle[st % 13] || ""; r = bordun.m + 12 * oktaven + st; }
    gabel.letzte = r;
    el.querySelector(".kh-g-ton").textContent = tonName(r);
    el.querySelector(".kh-g-iv").textContent = iv;
    el.querySelector(".kh-g-zeiger").style.transform = "translateX(" + klemm(c, -50, 50) + "%)";
    el.querySelector(".kh-g-info").textContent = tx.cent(c) + " · " + (Math.abs(c) <= 10 ? tx.genau : c < 0 ? tx.tief : tx.hoch) + " · " + tx.hz(Math.round(440 * Math.pow(2, (m - 69) / 12)));
    el.dataset.genau = Math.abs(c) <= 10 ? "1" : "0";
  }
  /* Langer Atem: Zeit läuft, solange der Ton klingt (kurze Aussetzer bis 0,35 s sind erlaubt) */
  function atemStarten() {
    atem = { zustand: "bereit", start: 0, letzte: 0, werte: [], dauer: 0, best: buchLesen().atem };
    ansicht = "atem"; zeigen();
    mikroDann(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(atemRahmen); });
  }
  function atemRahmen() {
    if (ansicht !== "atem" || !atem) return;
    raf = requestAnimationFrame(atemRahmen);
    if (root.offsetParent === null || document.hidden) return;
    const e = erkennen(), jetzt = performance.now() / 1000, A = atem;
    const el = panel.querySelector(".kh-atem"); if (!el) return;
    if (A.zustand === "fertig") return;
    if (e.m != null) {
      if (A.zustand === "bereit") { A.zustand = "laeuft"; A.start = jetzt; A.werte = []; el.querySelector(".kh-a-info").textContent = T().atem.laeuft; }
      A.letzte = jetzt; A.werte.push(e.m);
    }
    if (A.zustand === "laeuft") {
      if (jetzt - A.letzte > .35) {
        A.zustand = "fertig"; A.dauer = Math.round((A.letzte - A.start) * 10) / 10;
        const s = A.werte.slice(Math.floor(A.werte.length * .1)).sort((a, b) => a - b), med = s[Math.floor(s.length / 2)] || 0;
        const abw = s.map(x => Math.abs(x - med) * 100).sort((a, b) => a - b); A.ruhe = Math.round(abw[Math.floor(abw.length * .8)] || 0);
        const b = buchLesen(); A.neu = A.dauer > b.atem; if (A.neu) { b.atem = A.dauer; buchSchreiben(b); }
        A.best = Math.max(A.best, A.dauer);
        zeigen(); return;
      }
      const d = jetzt - A.start;
      el.querySelector(".kh-a-zeit").textContent = d.toFixed(1) + " s";
      el.querySelector(".kh-a-ring i").style.transform = "scaleX(" + klemm(d / Math.max(10, A.best || 20), 0, 1).toFixed(3) + ")";
    }
  }
  /* Verzögerung messen: acht Klicks, bei jedem „Ta!“ singen; der Median der Abstände ist der Versatz */
  function latenzStarten() {
    audio();
    latenz = { zustand: "laeuft", klicks: [], einsaetze: [], laut: false, still: 0, wert: null };
    ansicht = "latenz"; zeigen();
    mikroDann(() => {
      const spb = 60 / 90, t0 = ctx.currentTime + .4;
      latenz.t0 = t0; latenz.ende = t0 + 12 * spb + 1;
      probeLaden("holz1"); probeLaden("holz2");
      for (let i = 0; i < 12; i++) { spielen(i < 4 ? "holz1" : "holz2", 0, t0 + i * spb, i < 4 ? .35 : .55, 0, ausgang); if (i >= 4) latenz.klicks.push(i * spb); }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(latenzRahmen);
    });
  }
  function latenzRahmen() {
    if (ansicht !== "latenz" || !latenz || latenz.zustand !== "laeuft") return;
    raf = requestAnimationFrame(latenzRahmen);
    const e = erkennen(), L2 = latenz;
    const t = ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0) - L2.t0;
    const schwelle = Math.max(.02, (mic ? mic.boden : .004) * 5);
    if (e.rms > schwelle && !L2.laut && L2.still > 4) { L2.laut = true; L2.einsaetze.push(t); }
    if (e.rms < schwelle * .6) { L2.laut = false; L2.still++; } else if (!L2.laut) L2.still = 0; else L2.still = 0;
    const n = L2.klicks.filter(k => k < t).length;
    const info = panel.querySelector(".kh-l-info"); if (info) info.textContent = n ? T().latenz.mit(n, L2.klicks.length) : T().latenz.hoeren;
    if (ctx.currentTime > L2.ende) {
      const abst = [];
      L2.klicks.forEach(k => { const e2 = L2.einsaetze.filter(x => x > k - .2 && x < k + .45).sort((a, b) => Math.abs(a - k) - Math.abs(b - k))[0]; if (e2 != null) abst.push(e2 - k); });
      L2.zustand = "fertig";
      if (abst.length >= 4) { abst.sort((a, b) => a - b); const med = abst[Math.floor(abst.length / 2)]; L2.wert = klemm(Math.round(med * 100) * 10, -150, 350); }
      micAus(); zeigen();
    }
  }

  /* Mikrofon holen – beim ersten Mal mit Erklärung */
  let mikroWartet = null;
  function mikroDann(weiter) {
    if (mic && !mic.test && mic.kopf !== E.kopf) micAus(); /* Kopfhörer-Einstellung geändert → Mikrofon neu öffnen */
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
        '<button type="button" class="kh-insp" data-tun="insp"><span aria-hidden="true">🎲</span><b>1</b></button>' +
        '<button type="button" class="kh-pause" data-tun="pause"></button><button type="button" class="kh-stopp" data-tun="stopp" hidden></button><span class="kh-fort" aria-hidden="true"><i></i></span></div>' +
      '<div class="kh-duell" hidden></div>' +
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
  const schalter = (tun, an, aus) => '<div class="kh-wahl"><button type="button" role="switch" aria-checked="' + !!an + '" data-tun="' + tun + '"' + (aus ? " disabled" : "") + ">" + esc(an && !aus ? T().einst.an : T().einst.aus) + "</button></div>";

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
    if (S) $(".kh-hud-titel").textContent = (S.wiedergabe ? tx.spiel.wiedergabe + " · " : "") + S.st.titel;
    hudKnoepfe();
    duellAnzeigen(); if (!spielt && ansicht !== "pause") $(".kh-duell").hidden = true;
    if (!spielt) panel.innerHTML = '<div class="kh-karte">' + (ANSICHT[ansicht] || ANSICHT.menue)() + "</div>";
    panel.scrollTop = 0;
    if (!S) { cancelAnimationFrame(ruheRaf); requestAnimationFrame(ruhebild); }
  }

  const ANSICHT = {
    menue() {
      const tx = T(), w = wegLesen(), summe = w.sterne.reduce((a, b) => a + b, 0), b = buchLesen(), ds = duellStand();
      const besiegt = DUELLE.filter(d => ds[d.id]).length;
      return '<h4 class="kh-kopf">' + esc(tx.menueKopf) + "</h4>" +
        '<p class="kh-klein' + (gemessen() ? "" : " kh-hinweis") + '">' + esc(umfangText()) + "</p>" +
        '<div class="kh-raster">' +
          '<button type="button" class="kh-gross haupt" data-tun="tournee"><b>' + esc(tx.menue.tournee) + "</b><small>" + esc(tx.tourneeInfo(summe, rangVon(summe))) + "</small></button>" +
          '<button type="button" class="kh-gross rot" data-tun="duelle"><b>' + esc(tx.menue.duelle) + "</b><small>" + esc(tx.duellInfo(besiegt, DUELLE.length)) + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="lieder"><b>' + esc(tx.menue.lieder) + "</b><small>" + esc(tx.lieder(DATEN.lieder.length)) + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="uebung" data-wert="taeglich"><b>' + esc(tx.menue.taeglich) + "</b><small>" + esc(tx.taeglichInfo(straehne(b), b.einsingen.includes(heute()))) + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="uebungen"><b>' + esc(tx.menue.uebungen) + "</b><small>" + esc(tx.uebText) + "</small></button>" +
          '<button type="button" class="kh-gross" data-tun="einmessen"><b>' + esc(tx.menue.einmessen) + "</b><small>" + esc(gemessen() ? tonName(E.tief) + " – " + tonName(E.hoch) : "30 s") + "</small></button>" +
        "</div>" +
        '<div class="kh-reihe">' + knopf("gabel", esc(tx.menue.gabel)) + knopf("buch", esc(tx.menue.buch)) + knopf("einst", esc(tx.menue.einst)) + "</div>" +
        '<p class="kh-klein">' + esc(tx.kopfTipp) + '</p><p class="kh-klein kh-privat">🔒 ' + esc(tx.privat) + "</p>";
    },
    tournee() {
      const tx = T(), w = wegLesen(), summe = w.sterne.reduce((a, b) => a + b, 0), L = sprache();
      return '<h4 class="kh-kopf">' + esc(tx.tourneeTitel) + " <small>· " + esc(rangVon(summe)) + "</small></h4>" +
        '<p class="kh-klein">' + esc(tx.tourneeText) + "</p>" +
        '<ol class="kh-liste">' + DATEN.weg.map((s, i) => {
          const lied = DATEN.lieder.find(l => l.id === s.lied), offen = i <= w.frei, txt = s[L] || s.de;
          return '<li><button type="button" class="kh-eintrag' + (offen ? "" : " zu") + '" data-tun="station" data-wert="' + i + '"' + (offen ? "" : " disabled") + ">" +
            '<span class="kh-nr">' + (i + 1) + '</span><span class="kh-was"><b>' + esc(txt.ort) + "</b><small>" + esc(offen ? "„" + (lied ? lied.titel[L] || lied.titel.de : "") + "“" : tx.gesperrt) + "</small></span>" +
            sterneHtml(w.sterne[i] | 0) + "</button></li>";
        }).join("") + "</ol>" + '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    duelle() {
      const tx = T(), ds = duellStand(), L = sprache();
      return '<h4 class="kh-kopf">' + esc(tx.duelleTitel) + '</h4><p class="kh-klein">' + esc(tx.duelleText) + "</p>" +
        '<ul class="kh-liste">' + DUELLE.map(d => '<li><button type="button" class="kh-eintrag" data-tun="duell" data-wert="' + esc(d.id) + '">' +
          (d.bild ? '<img class="kh-portrait" src="' + esc(d.bild) + '" alt="" loading="lazy">' : '<span class="kh-portrait sym">' + esc(d.symbol || "⚔") + "</span>") +
          '<span class="kh-was"><b>' + esc(d.name[L] || d.name.de) + "</b><small>" + esc((d[L] || d.de).ort) + "</small></span>" +
          '<span class="kh-status">' + esc(ds[d.id] ? tx.besiegt : tx.offen) + "</span></button></li>").join("") + "</ul>" +
        '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    lieder() {
      const tx = T(), rek = rekorde(), L = sprache(), bd = buehnenDaten();
      return '<h4 class="kh-kopf">' + esc(tx.liederTitel) + '</h4><p class="kh-klein">' + esc(tx.liederText) + "</p>" +
        '<ul class="kh-liste">' + DATEN.lieder.map(l => '<li><button type="button" class="kh-eintrag" data-tun="lied" data-wert="' + esc(l.id) + '">' +
          '<span class="kh-was"><b>' + esc(l.titel[L] || l.titel.de) + "</b><small>" + "♪".repeat(l.grad || 1) + (rek[l.id] ? " · " + esc(tx.bestwert(rek[l.id])) : "") + "</small></span></button></li>").join("") +
          (bd ? '<li><button type="button" class="kh-eintrag buehne" data-tun="buehnenlied"><span class="kh-was"><b>' + esc(tx.buehnenLied(bd.titel)) + "</b><small>" + esc(tx.buehnenInfo) + "</small></span></button></li>" : "") + "</ul>" +
        '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    uebungen() {
      const tx = T(), rek = rekorde(), b = buchLesen();
      const info = k => k === "atem" && b.atem ? " · " + T().atem.bester(b.atem) : rek["u-" + k] ? " · " + tx.bestwert(rek["u-" + k]) : "";
      return '<h4 class="kh-kopf">' + esc(tx.uebTitel) + '</h4><p class="kh-klein">' + esc(tx.uebText) + (gemessen() ? "" : " " + esc(tx.vorher.messenTipp)) + "</p>" +
        '<ul class="kh-liste">' + ["taeglich", "tonleiter", "halten", "echo", "spruenge", "bordun", "atem", "gabel"].map(k => '<li><button type="button" class="kh-eintrag" data-tun="' + (k === "gabel" ? "gabel" : k === "atem" ? "atem" : "uebung") + '" data-wert="' + k + '">' +
          '<span class="kh-was"><b>' + esc(tx.ueb[k][0]) + "</b><small>" + esc(tx.ueb[k][1] + info(k)) + "</small></span></button></li>").join("") + "</ul>" +
        '<div class="kh-reihe">' + knopf("menue", esc(tx.zurueck)) + "</div>";
    },
    vorher() {
      const tx = T(), V = tx.vorher, st = gewaehlt.st, L = sprache();
      let kopf = "";
      if (station != null) {
        const s = DATEN.weg[station], txt = s[L] || s.de;
        kopf = '<p class="label">' + esc(V.ort) + " " + (station + 1) + '</p><h4 class="kh-kopf">' + esc(txt.ort) + "</h4>" +
          '<p class="kh-klein"><b>' + esc(V.publikum) + ":</b> " + esc(txt.publikum) + " · " + esc(V.sg(s.sg)) + '</p><p class="kh-zitat">„' + esc(txt.intro) + "“</p>";
      } else if (st.duell) {
        const d = st.duell, txt = d[L] || d.de;
        kopf = '<div class="kh-gegner-kopf">' + (d.bild ? '<img class="kh-portrait gross" src="' + esc(d.bild) + '" alt="">' : '<span class="kh-portrait gross sym">' + esc(d.symbol || "⚔") + "</span>") +
          '<div><p class="label">⚔ ' + esc(tx.menue.duelle.replace(/^\W+/, "")) + '</p><h4 class="kh-kopf">' + esc(d.name[L] || d.name.de) + '</h4><p class="kh-klein">' + esc(txt.ort) + "</p></div></div>" +
          '<p class="kh-zitat">„' + esc(txt.intro) + "“</p>" + (st.deutsch ? '<p class="kh-klein">' + esc(tx.duell.deutsch) + "</p>" : "");
      }
      const schieb = verschiebung(st), eigen = E.trans[st.id] | 0;
      return kopf + (st.duell ? "" : '<h4 class="kh-lied">' + esc(st.titel) + "</h4>") +
        (st.lied && st.deutsch && V.deutsch ? '<p class="kh-klein">' + esc(V.deutsch) + "</p>" : "") +
        (st.uebung ? '<p class="kh-klein">' + esc(tx.ueb[st.uebung][1]) + "</p>" : "") +
        (gemessen() ? "" : '<p class="kh-klein kh-hinweis">' + esc(V.messenTipp) + "</p>") +
        '<div class="kh-zeile2"><span>' + esc(tx.einst.grad) + "</span>" + gradKnoepfe() + "</div>" +
        (st.bordun ? '<div class="kh-zeile2"><span>' + esc(V.grundton) + '</span><div class="kh-wahl"><button type="button" data-tun="bordunTon" data-wert="-1" aria-label="−">−</button><output>' + esc(tonName(st.grund)) +
            '</output><button type="button" data-tun="bordunTon" data-wert="1" aria-label="+">+</button></div></div>' +
          '<div class="kh-zeile2"><span>' + esc(V.leiter) + '</span><div class="kh-wahl" role="radiogroup">' + ["dur", "moll"].map(k => '<button type="button" role="radio" aria-checked="' + (st.modus === k) + '" data-tun="bordunModus" data-wert="' + k + '">' + esc(V[k]) + "</button>").join("") + "</div></div>" : "") +
        (st.fest ? "" : '<div class="kh-zeile2"><span>' + esc(V.tonart) + '</span><div class="kh-wahl"><button type="button" data-tun="trans" data-wert="-1" aria-label="−">−</button><output>' +
          esc(tonName(st.grund + schieb)) + (eigen ? " (" + (eigen > 0 ? "+" : "") + eigen + ")" : " · " + esc(V.auto)) + '</output><button type="button" data-tun="trans" data-wert="1" aria-label="+">+</button></div></div>') +
        (st.ohneFuehrung ? "" : '<div class="kh-zeile2"><span>' + esc(V.fuehr) + "</span>" + (E.kopf ? schalter("fuehr", E.fuehr) : '<small class="kh-klein">' + esc(V.fuehrAus) + "</small>") + "</div>") +
        (st.lied || st.duell ? '<p class="kh-klein">' + esc(V.schnoerkel) + "</p>" : "") +
        '<p class="kh-klein kh-laden" aria-live="polite"></p>' +
        '<div class="kh-reihe">' + knopf("los", esc(V.los), "haupt") + (gemessen() ? "" : knopf("einmessen", esc(V.messen))) +
          knopf(station != null ? "tournee" : st.duell ? "duelle" : st.uebung ? "uebungen" : "lieder", esc(tx.zurueck)) + "</div>";
    },
    pause() {
      const tx = T().spiel;
      return '<h4 class="kh-kopf">⏸ ' + esc(tx.pausiert) + "</h4>" + '<div class="kh-reihe senk">' + knopf("weiter", esc(tx.weiter), "haupt") + knopf("neu", esc(tx.neu)) + knopf("aufhoeren", esc(tx.aufhoeren)) + "</div>";
    },
    ergebnis() {
      const tx = T(), E2 = tx.erg, r = ergebnis, L = sprache();
      const stufe = r.pct >= 95 ? 5 : r.pct >= 85 ? 4 : r.pct >= 70 ? 3 : r.pct >= 50 ? 2 : r.pct >= 30 ? 1 : 0;
      let html = "";
      if (r.duell) {
        const d = r.duell.d, txt = d[L] || d.de;
        html += '<div class="kh-gegner-kopf">' + (d.bild ? '<img class="kh-portrait gross" src="' + esc(d.bild) + '" alt="">' : '<span class="kh-portrait gross sym">' + esc(d.symbol || "⚔") + "</span>") +
          '<div><h4 class="kh-kopf ' + (r.duell.sieg ? "sieg" : "pleite") + '">' + esc(r.duell.sieg ? tx.duell.sieg : tx.duell.pleite) + '</h4><p class="kh-klein">' + esc(d.name[L] || d.name.de) + "</p></div></div>" +
          '<p class="kh-zitat">„' + esc(r.duell.sieg ? txt.sieg : txt.pleite) + "“</p>" + (!r.duell.sieg && r.duell.leben > 0 ? '<p class="kh-klein">' + esc(tx.duell.rest(d.name[L] || d.name.de, r.duell.leben)) + "</p>" : "");
      } else html += '<h4 class="kh-lied">' + esc(r.st.titel) + "</h4>";
      html += '<div class="kh-pct"><b>' + r.pct + "<small>%</small></b><span>" + r.punkte.toLocaleString(L === "en" ? "en-GB" : "de-DE") + " " + esc(E2.punkte) + (r.schnoerkel ? " · " + esc(E2.schnoerkel(r.schnoerkel)) : "") + "</span></div>" +
        (r.wurf && r.wurf.sterne != null ? sterneHtml(r.wurf.sterne) : "") +
        '<p class="kh-klein">' + esc(E2.getroffen(r.getroffen, r.gesamt)) + (r.besteSerie >= 2 ? " · " + esc(tx.spiel.serie(r.besteSerie)) : "") + "</p>" +
        (r.strähne ? '<p class="kh-neu">' + esc(E2.strähne(r.strähne)) + "</p>" : "") +
        (r.neu && r.alt ? '<p class="kh-neu">🏆 ' + esc(E2.rekord) + "</p>" : r.alt && !r.neu ? '<p class="kh-klein">' + esc(E2.bisher(r.alt)) + "</p>" : "") +
        (r.stumm ? '<p class="kh-klein kh-hinweis">' + esc(E2.stumm) + "</p>" : r.tendenz == null ? "" : '<p class="kh-klein">' + esc(Math.abs(r.tendenz) < 10 ? E2.mittig : r.tendenz < 0 ? E2.zuTief(-r.tendenz) : E2.zuHoch(r.tendenz)) + "</p>");
      if (r.wurf && r.station != null && !r.duell) {
        const s = DATEN.weg[r.station], txt = s[L] || s.de, w = r.wurf;
        html += '<div class="kh-wurf"><span class="kh-w20' + (w.roh === 20 ? " krit" : w.roh === 1 ? " patzer" : "") + '">' + w.roh + "</span><span>" + esc(E2.wurf(w.roh, w.bonus, w.summe, w.sg)) + (w.roh === 20 ? " " + esc(E2.krit) : w.roh === 1 ? " " + esc(E2.patzer) : "") + "</span></div>" +
          '<p class="kh-zitat">„' + esc(w.geschafft ? txt.sieg : txt.pleite) + "“</p>" + (r.frei ? '<p class="kh-neu">✨ ' + esc(E2.neuFrei) + "</p>" : "");
      } else if (!r.duell) html += '<p class="kh-zitat">„' + esc(zufall(tx.stimmen[stufe])) + "“</p>";
      const weiter = r.wurf && r.station != null && !r.duell && r.station < DATEN.weg.length - 1 && wegLesen().frei > r.station;
      html += '<div class="kh-reihe">' + (weiter ? knopf("station", esc(E2.naechste), "haupt", ' data-wert="' + (r.station + 1) + '"') : "") +
        knopf("nochmal", esc(E2.nochmal), weiter ? "" : "haupt") +
        (r.aufnahme || r.aufnahmeLaedt ? knopf("anhoeren", esc(E2.anhoeren), "kh-anhoeren", r.aufnahme ? "" : " disabled") : "") +
        (r.station != null ? knopf("tournee", esc(E2.tournee)) : r.duell ? knopf("duelle", esc(E2.duelle)) : "") + knopf("menue", esc(tx.menueKnopf)) + "</div>" +
        '<div class="kh-liste-box">' + listeHtml() + "</div>";
      return html;
    },
    einmessen() {
      const tx = T().einmessen, em = einmess || {};
      if (em.schritt === "fertig") {
        const n = Math.round(em.hoch) - Math.round(em.tief);
        return '<h4 class="kh-kopf">🎙 ' + esc(tx.titel) + '</h4><p class="kh-gross-ton">' + esc(tonName(em.tief)) + " – " + esc(tonName(em.hoch)) + "</p>" +
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
        '<div class="kh-gabel leer"><span class="kh-g-ton">–</span><span class="kh-g-iv"></span><span class="kh-g-skala"><i class="kh-g-zeiger"></i></span><span class="kh-klein kh-g-info">' + esc(tx.leer) + "</span></div>" +
        '<div class="kh-zeile2"><span>' + esc(bordun ? tx.bordunAn : tx.bordunAus).replace(/^🎵 /, "🎵 ") + '</span><div class="kh-wahl"><button type="button" role="switch" aria-checked="' + !!bordun + '" data-tun="bordunSchalter">' + esc(bordun ? T().einst.an : T().einst.aus) + "</button>" +
          '<button type="button" data-tun="gabelTon" data-wert="-1" aria-label="−">−</button><output>' + esc(tonName(bordunGrund())) + '</output><button type="button" data-tun="gabelTon" data-wert="1" aria-label="+">+</button></div></div>' +
        (E.kopf ? "" : '<p class="kh-klein">' + esc(tx.bordunTipp) + "</p>") +
        '<div class="kh-reihe">' + knopf("vorspielen", esc(tx.vorspielen)) + knopf("menue", esc(T().zurueck)) + "</div>";
    },
    atem() {
      const tx = T().atem, A = atem || {};
      if (A.zustand === "fertig") {
        return '<h4 class="kh-kopf">🌬 ' + esc(tx.titel) + '</h4><p class="kh-gross-ton">' + A.dauer.toFixed(1) + " s</p>" +
          '<p class="kh-klein">' + esc(tx.fertig(A.dauer.toFixed(1))) + " · " + esc(tx.ruhig(A.ruhe)) + "</p>" + (A.neu ? '<p class="kh-neu">🏆 ' + esc(tx.rekord) + "</p>" : '<p class="kh-klein">' + esc(tx.bester(A.best.toFixed(1))) + "</p>") +
          '<div class="kh-reihe">' + knopf("atem", esc(tx.nochmal), "haupt") + knopf("uebungen", esc(T().zurueck)) + "</div>";
      }
      return '<h4 class="kh-kopf">🌬 ' + esc(tx.titel) + "</h4>" +
        '<div class="kh-atem"><span class="kh-gross-ton kh-a-zeit">0.0 s</span><span class="kh-m-ring kh-a-ring"><i></i></span><span class="kh-klein kh-a-info">' + esc(tx.bereit) + "</span>" +
        (A.best ? '<span class="kh-klein">' + esc(tx.bester(A.best.toFixed(1))) + "</span>" : "") + "</div>" +
        '<div class="kh-reihe">' + knopf("uebungen", esc(T().zurueck)) + "</div>";
    },
    latenz() {
      const tx = T().latenz, L2 = latenz || {};
      if (L2.zustand === "fertig") {
        return '<h4 class="kh-kopf">🎯 ' + esc(tx.titel) + "</h4>" + (L2.wert != null ? '<p class="kh-gross-ton">' + L2.wert + " ms</p>" + '<p class="kh-klein">' + esc(tx.fertig(L2.wert)) + "</p>" : '<p class="kh-klein kh-hinweis">' + esc(tx.zuWenig) + "</p>") +
          '<div class="kh-reihe">' + (L2.wert != null ? knopf("latenzOk", esc(tx.uebernehmen), "haupt") : "") + knopf("latenz", esc(tx.nochmal)) + knopf("einst", esc(T().zurueck)) + "</div>";
      }
      return '<h4 class="kh-kopf">🎯 ' + esc(tx.titel) + '</h4><p class="kh-klein">' + esc(tx.text) + '</p><p class="kh-gross-ton kh-l-info">' + esc(tx.hoeren) + "</p>" +
        '<div class="kh-reihe">' + knopf("einst", esc(T().zurueck)) + "</div>";
    },
    buch() {
      const tx = T().buch, b = buchLesen(), L = sprache();
      const toene = Object.keys(b.toene).map(k => ({ k: +k, c: Math.round(b.toene[k].a / Math.max(1e-6, b.toene[k].z)), z: b.toene[k].z })).filter(x => x.z > 2).sort((a, c) => Math.abs(c.c) - Math.abs(a.c));
      let ga = 0, gz = 0; Object.values(b.toene).forEach(x => { ga += x.a; gz += x.z; });
      const name = v => { if (v.t) return v.t; const id = v.id; const l = DATEN.lieder.find(x => x.id === id); if (l) return l.titel[L] || l.titel.de; if (/^d-/.test(id)) { const d = DUELLE.find(x => "d-" + x.id === id); if (d) return "⚔ " + (d.name[L] || d.name.de); } const u = id.replace(/^u-/, ""); return T().ueb[u] ? T().ueb[u][0] : id; };
      /* Verlaufskurve der letzten 30 Tage */
      const tage = []; const d = new Date(); d.setDate(d.getDate() - 29);
      for (let i = 0; i < 30; i++) { const k = heute(d), w = b.tage[k]; tage.push(w && w[1] ? w[0] / w[1] : null); d.setDate(d.getDate() + 1); }
      const punkte = tage.map((v, i) => v == null ? null : [6 + i * (288 / 29), 74 - v * .66]).filter(Boolean);
      const kurve = punkte.length >= 2 ? '<svg class="kh-kurve" viewBox="0 0 300 80" role="img" aria-label="' + esc(tx.verlauf) + '"><line x1="0" x2="300" y1="74" y2="74"/><line x1="0" x2="300" y1="41" y2="41" class="mitte"/><line x1="0" x2="300" y1="8" y2="8"/>' +
        '<polyline points="' + punkte.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") + '"/>' + punkte.map(p => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.5"/>').join("") +
        '<text x="298" y="12" text-anchor="end">100 %</text><text x="298" y="45" text-anchor="end">50 %</text></svg>' : '<p class="kh-klein">' + esc(tx.verlaufLeer) + "</p>";
      const s = straehne(b);
      return '<h4 class="kh-kopf">📖 ' + esc(tx.titel) + "</h4>" +
        '<p class="kh-klein"><b>' + esc(tx.umfang) + ":</b> " + esc(gemessen() ? tonName(E.tief) + " – " + tonName(E.hoch) + " (" + (E.hoch - E.tief) + ")" : tx.keinUmfang) + "</p>" +
        (b.atem ? '<p class="kh-klein">🌬 ' + esc(tx.atem(b.atem.toFixed(1))) + "</p>" : "") + (s ? '<p class="kh-klein">' + esc(tx.streak(s)) + "</p>" : "") +
        "<h5>" + esc(tx.verlauf) + "</h5>" + kurve +
        "<h5>" + esc(tx.tendenz) + "</h5>" + (toene.length ? '<p class="kh-klein">' + esc(tx.schnitt(Math.round(ga / Math.max(1e-6, gz)))) + '</p><ul class="kh-balken">' + toene.slice(0, 8).map(x => "<li><span>" + esc(tx.ton(T().tonNamen[x.k], x.c)) + '</span><i><b style="left:' + (50 + Math.min(0, klemm(x.c, -50, 50))) + "%;width:" + Math.abs(klemm(x.c, -50, 50)) + '%"></b></i></li>').join("") + "</ul>" : '<p class="kh-klein">' + esc(tx.zuWenig) + "</p>") +
        "<h5>" + esc(tx.auftritte) + "</h5>" + (b.verlauf.length ? '<ul class="kh-verlauf">' + b.verlauf.map(v => "<li><span>" + esc(name(v)) + "</span><b>" + (v.p | 0) + " %</b></li>").join("") + "</ul>" : '<p class="kh-klein">' + esc(tx.keine) + "</p>") +
        '<div class="kh-reihe">' + knopf("menue", esc(T().zurueck)) + knopf("buchLeeren", esc(tx.loeschen)) + "</div>";
    },
    einst() {
      const tx = T().einst;
      return '<h4 class="kh-kopf">⚙ ' + esc(tx.titel) + "</h4>" +
        '<div class="kh-zeile2"><span>' + esc(tx.grad) + "</span>" + gradKnoepfe() + "</div>" +
        '<div class="kh-zeile2"><span>' + esc(tx.kopf) + '</span><div class="kh-wahl"><button type="button" role="radio" aria-checked="' + E.kopf + '" data-tun="kopf" data-wert="1">' + esc(tx.kopfJa) + '</button><button type="button" role="radio" aria-checked="' + !E.kopf + '" data-tun="kopf" data-wert="0">' + esc(tx.kopfNein) + "</button></div></div>" +
        (E.kopf ? "" : '<p class="kh-klein">' + esc(tx.kopfInfo) + "</p>") +
        '<div class="kh-zeile2"><span>' + esc(tx.fuehr) + "</span>" + schalter("fuehr", E.fuehr && E.kopf, !E.kopf) + "</div>" +
        '<div class="kh-zeile2"><span>' + esc(tx.publikum) + "</span>" + schalter("publikum", E.publikum) + "</div>" +
        '<div class="kh-zeile2"><span>' + esc(tx.aufnahme) + "</span>" + schalter("aufnahme", E.aufnahme, !window.MediaRecorder) + "</div>" +
        '<label class="kh-zeile2"><span>' + esc(tx.laut) + '</span><input type="range" min="0" max="1" step="0.05" value="' + E.laut + '" data-regler="laut"></label>' +
        '<label class="kh-zeile2"><span>' + esc(tx.versatz) + ' <output class="kh-ms">' + esc(tx.ms(E.versatz)) + '</output></span><input type="range" min="-150" max="350" step="10" value="' + E.versatz + '" data-regler="versatz"></label>' +
        '<p class="kh-klein">' + esc(tx.versatzInfo) + "</p>" +
        '<div class="kh-reihe">' + knopf("latenz", esc(tx.messen)) + knopf("einmessen", esc(T().menue.einmessen)) + knopf("menue", esc(T().zurueck), "haupt") + "</div>";
    },
    mikro() {
      const tx = T().mikro;
      return '<h4 class="kh-kopf">🎙 ' + esc(tx.titel) + "</h4><p>" + esc(tx.text) + "</p>" + (meldung ? '<p class="kh-klein kh-hinweis">' + esc(meldung) + "</p>" : "") +
        '<div class="kh-reihe">' + knopf("mikroOk", esc(tx.knopf), "haupt") + knopf("mikroZurueck", esc(T().zurueck)) + "</div>";
    }
  };

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
  /* ein Stück frisch bauen (nach „Nochmal“ oder „Von vorn“) */
  function neuBauen(st) {
    if (st.uebung) return uebungBauen(st.uebung);
    if (st.duell) return duellBauen(st.duell);
    if (st.buehne) return buehnenLiedBauen() || st;
    return liedBauen(DATEN.lieder.find(x => x.id === st.id));
  }
  function nebenlaeufigeStoppen() { if (ansicht === "gabel") bordunStoppen(); if (ansicht === "gabel" || ansicht === "atem" || ansicht === "latenz" || ansicht === "einmessen") { cancelAnimationFrame(raf); micAus(); } }
  root.addEventListener("click", ev => {
    const b = ev.target.closest("[data-tun]"); if (!b || !root.contains(b) || b.disabled) return;
    const tun = b.dataset.tun, wert = b.dataset.wert;
    audio();
    const wechsel = v => { nebenlaeufigeStoppen(); ansicht = v; zeigen(); };
    switch (tun) {
      case "menue": abbrechen(); micAus(); station = null; wechsel("menue"); break;
      case "tournee": abbrechen(); micAus(); station = null; wechsel("tournee"); break;
      case "duelle": abbrechen(); micAus(); station = null; wechsel("duelle"); break;
      case "lieder": micAus(); station = null; wechsel("lieder"); break;
      case "uebungen": micAus(); station = null; wechsel("uebungen"); break;
      case "buch": wechsel("buch"); break;
      case "einst": wechsel("einst"); break;
      case "station": { const i = +wert, s = DATEN.weg[i], l = s && DATEN.lieder.find(x => x.id === s.lied); if (!l) break; station = i; vorbereiten(liedBauen(l)); break; }
      case "lied": { const l = DATEN.lieder.find(x => x.id === wert); if (!l) break; station = null; vorbereiten(liedBauen(l)); break; }
      case "duell": { const d = DUELLE.find(x => x.id === wert); if (!d) break; station = null; vorbereiten(duellBauen(d)); break; }
      case "buehnenlied": { const st = buehnenLiedBauen(); if (st) { station = null; vorbereiten(st); } break; }
      case "uebung": nebenlaeufigeStoppen(); station = null; vorbereiten(uebungBauen(wert)); break;
      case "atem": nebenlaeufigeStoppen(); atemStarten(); break;
      case "grad": E.grad = wert; einstSpeichern(); if (ansicht === "vorher") neuZeichnenVorher(); else zeigen(); break;
      case "trans": { const st = gewaehlt.st; E.trans[st.id] = klemm((E.trans[st.id] | 0) + (+wert), -12, 12); einstSpeichern(); gewaehlt.bereit = false; vorbereiten(st); break; }
      case "bordunTon": { E.bordunTon = klemm(gewaehlt.st.grund + (+wert), 36, 72); einstSpeichern(); vorbereiten(uebungBauen("bordun")); break; }
      case "bordunModus": E.bordunModus = wert; einstSpeichern(); vorbereiten(uebungBauen("bordun")); break;
      case "fuehr": E.fuehr = !E.fuehr; einstSpeichern(); if (ansicht === "vorher") neuZeichnenVorher(); else zeigen(); break;
      case "publikum": E.publikum = !E.publikum; einstSpeichern(); zeigen(); break;
      case "aufnahme": E.aufnahme = !E.aufnahme; einstSpeichern(); zeigen(); break;
      case "kopf": E.kopf = wert === "1"; einstSpeichern(); micAus(); zeigen(); break;
      case "los": { const st = gewaehlt && gewaehlt.st; if (!st) break; mikroDann(() => starten(st)); break; }
      case "pause": pausieren(); break;
      case "weiter": fortsetzen(); break;
      case "insp": inspirieren(); break;
      case "stopp": wiedergabeEnde(); break;
      case "neu": { const st = S && S.st; abbrechen(true); if (st) starten(neuBauen(st)); break; }
      case "aufhoeren": abbrechen(); wechsel(station != null ? "tournee" : "menue"); break;
      case "nochmal": { const st = ergebnis && ergebnis.st; if (!st) break; const frisch = neuBauen(st); mikroDann(() => starten(frisch)); break; }
      case "anhoeren": wiedergabeStarten(); break;
      case "eintragen": eintragen(); break;
      case "einmessen": { const woher = ansicht === "einmessen" && einmess ? einmess.woher : ansicht; abbrechen(); nebenlaeufigeStoppen(); einmessenStarten(woher); break; }
      case "messenOk": {
        const woher = einmess ? einmess.woher : "menue";
        if (einmess && einmess.tief != null) { E.tief = Math.round(einmess.tief); E.hoch = Math.round(einmess.hoch); einstSpeichern(); }
        einmess = null;
        if (woher === "vorher" && gewaehlt) vorbereiten(neuBauen(gewaehlt.st));
        else { ansicht = woher === "einst" ? "einst" : "menue"; zeigen(); }
        break;
      }
      case "gabel": nebenlaeufigeStoppen(); gabelStarten(); break;
      case "bordunSchalter": if (bordun) bordunStoppen(); else bordunStarten(bordunGrund()); zeigen(); break;
      case "gabelTon": { E.bordunTon = klemm(bordunGrund() + (+wert), 36, 72); einstSpeichern(); if (bordun) bordunStarten(E.bordunTon); zeigen(); break; }
      case "vorspielen": if (gabel) { const m = bordun ? bordun.m + 12 : gabel.letzte != null ? gabel.letzte : 57; probeLaden(probeName("harfe", m)).then(() => spielen("harfe", m, ctx.currentTime + .02, .35, 1.6, ausgang)); } break;
      case "latenz": nebenlaeufigeStoppen(); latenzStarten(); break;
      case "latenzOk": if (latenz && latenz.wert != null) { E.versatz = latenz.wert; einstSpeichern(); } wechsel("einst"); break;
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
  root.addEventListener("keydown", ev => { if (ev.key === "Enter" && ev.target.closest && ev.target.closest(".kh-name")) { ev.preventDefault(); eintragen(); } });
  /* Tastatur: Leertaste/Esc = Pause/Weiter, I = Inspiration */
  document.addEventListener("keydown", ev => {
    if (!S || root.offsetParent === null) return;
    if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) return;
    if (ev.key === " " || ev.key === "Escape" || ev.key === "p" || ev.key === "P") { ev.preventDefault(); if (S.wiedergabe) wiedergabeEnde(); else if (S.pause) fortsetzen(); else pausieren(); }
    if ((ev.key === "i" || ev.key === "I") && !S.pause) { ev.preventDefault(); inspirieren(); }
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (S) pausieren(); else if (["gabel", "einmessen", "atem", "latenz"].includes(ansicht)) { nebenlaeufigeStoppen(); ansicht = "menue"; zeigen(); } } });
  window.addEventListener("resize", () => { if (!S) requestAnimationFrame(ruhebild); });
  new MutationObserver(() => { if (!S) zeigen(); else $(".kh-pause").setAttribute("aria-label", T().spiel.pause); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  /* Spielesaal: beim Wechsel zu einem anderen Spiel alles anhalten und das Mikrofon freigeben */
  root._stoppen = () => {
    if (S) abbrechen(); nebenlaeufigeStoppen(); bordunStoppen(); micAus(); cancelAnimationFrame(raf);
    if (["spiel", "pause", "einmessen", "gabel", "mikro", "atem", "latenz"].includes(ansicht)) { ansicht = "menue"; zeigen(); }
  };
  /* Für Tests und Vorschaubilder: eine künstliche Stimme einspeisen */
  root._test = {
    stimme(fn) { testStimme = fn; micAus(); },
    zustand: () => ({ ansicht, S, ergebnis, atem, latenz, bordun }),
    lied: id => { const l = DATEN.lieder.find(x => x.id === id); return l ? liedBauen(l) : null; },
    duell: id => { const d = DUELLE.find(x => x.id === id); return d ? duellBauen(d) : null; },
    buehne: () => buehnenLiedBauen(),
    uebung: a => uebungBauen(a),
    starten: st => starten(st), ansicht: a => { ansicht = a; zeigen(); }, inspirieren, vibrato
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
.kh-kopf.sieg { color: #ffd27a; } .kh-kopf.pleite { color: #e07a6a; }
.kh-lied { font-family: var(--name); font-weight: 400; font-size: 1.3rem; color: #ffd27a; }
.kh-karte h5 { margin: .4rem 0 0; font-size: .78rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ember); font-weight: 600; }
.kh-klein { font-size: .86rem; color: var(--ash); line-height: 1.45; }
.kh-hinweis { color: #ffd27a; }
.kh-privat { font-size: .78rem; }
.kh-zitat { font-family: var(--name); font-style: italic; font-size: 1.02rem; line-height: 1.45; color: var(--vellum); border-left: 2px solid var(--ember); padding-left: .7rem; }
.kh-raster { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
.kh-gross { display: grid; gap: .2rem; align-content: start; text-align: left; padding: .75rem .85rem; border: 1px solid var(--line); background: rgba(224,160,70,.06); color: var(--vellum); font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
.kh-gross b { font-weight: 600; font-size: .98rem; }
.kh-gross small { font-size: .78rem; color: var(--ash); line-height: 1.35; }
.kh-gross.haupt { grid-column: 1 / -1; border-color: var(--ember); background: linear-gradient(135deg, rgba(224,160,70,.2), rgba(224,160,70,.05)); }
.kh-gross.haupt b { color: #ffd27a; font-size: 1.08rem; }
.kh-gross.rot { border-color: rgba(224,96,90,.55); background: linear-gradient(135deg, rgba(224,96,90,.16), rgba(224,96,90,.03)); }
.kh-gross.rot b { color: #ff9a8a; }
.kh-gross:hover, .kh-gross:focus-visible, .kh-eintrag:hover:not(:disabled), .kh-eintrag:focus-visible { border-color: var(--ember); background: rgba(224,160,70,.14); }
.kh-reihe { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; }
.kh-reihe.senk { flex-direction: column; align-items: stretch; max-width: 260px; margin: 0 auto; width: 100%; }
.kh-reihe .tav-knopf { touch-action: manipulation; }
.kh-reihe .tav-knopf.haupt, .kh-karte .tav-knopf.haupt { background: var(--ember); color: var(--night); }
.kh-reihe .tav-knopf:disabled { opacity: .45; cursor: progress; }
.kh-reihe .tav-knopf[hidden] { display: none; }
.kh-liste { list-style: none; margin: 0; padding: 0; display: grid; gap: .35rem; }
.kh-eintrag { width: 100%; display: flex; align-items: center; gap: .7rem; text-align: left; padding: .55rem .7rem; border: 1px solid var(--line); background: rgba(255,255,255,.02); color: var(--vellum); font: inherit; cursor: pointer; touch-action: manipulation; }
.kh-eintrag.zu { opacity: .5; cursor: default; }
.kh-eintrag.buehne { border-style: dashed; }
.kh-nr { flex: none; width: 1.8rem; height: 1.8rem; display: grid; place-items: center; border: 1px solid var(--ember); color: var(--ember); font-family: var(--display); font-size: .95rem; border-radius: 50%; }
.kh-was { flex: 1; display: grid; gap: .1rem; min-width: 0; }
.kh-was b { font-weight: 600; font-size: .95rem; }
.kh-was small { font-size: .78rem; color: var(--ash); }
.kh-status { flex: none; font-size: .78rem; color: var(--ash); }
.kh-portrait { flex: none; width: 2.6rem; height: 2.6rem; border-radius: 50%; object-fit: cover; object-position: 50% 20%; border: 1px solid rgba(224,96,90,.6); background: #1d1418; }
.kh-portrait.sym { display: grid; place-items: center; font-size: 1.4rem; }
.kh-portrait.gross { width: 4.2rem; height: 4.2rem; }
.kh-portrait.gross.sym { font-size: 2.2rem; }
.kh-gegner-kopf { display: flex; gap: .8rem; align-items: center; }
.kh-gegner-kopf > div { display: grid; gap: .15rem; } .kh-gegner-kopf p { margin: 0; }
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
.kh-wahl output { min-width: 4.5rem; text-align: center; font-size: .86rem; color: #ffd27a; }
.kh-pct { display: grid; justify-items: center; gap: .1rem; }
.kh-pct b { font-family: var(--display); font-weight: 400; font-size: clamp(2.6rem, 10vw, 3.6rem); line-height: 1; color: #ffd27a; text-shadow: 0 0 24px rgba(255,210,122,.35); }
.kh-pct b small { font-size: .45em; }
.kh-pct span { font-size: .85rem; color: var(--ash); text-align: center; }
.kh-neu { color: #9fe08f; font-weight: 600; font-size: .92rem; }
.kh-wurf { display: flex; align-items: center; gap: .7rem; font-size: .88rem; color: var(--vellum); }
.kh-w20 { flex: none; width: 3.2rem; height: 3.2rem; display: grid; place-items: center; font-family: var(--display); font-size: 1.5rem; color: var(--night); background: var(--ember); clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); animation: khRoll .9s cubic-bezier(.3,1.4,.5,1); }
.kh-w20.krit { background: #ffd27a; } .kh-w20.patzer { background: var(--blood); color: var(--vellum); }
@keyframes khRoll { from { transform: rotate(-540deg) scale(.3); } }
.kh-hud { position: absolute; z-index: 2; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: .5rem; padding: .45rem .6rem .55rem; background: linear-gradient(180deg, rgba(14,11,18,.9), rgba(14,11,18,0)); pointer-events: none; }
.kh-hud[hidden] { display: none; }
.kehle.hat-voll.kh-spielt:not(.tav-voll) .kh-hud { padding-right: 3.6rem; }
.kh-hud-titel { flex: 1; min-width: 0; font-family: var(--name); font-weight: 400; font-size: .98rem; color: var(--vellum); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kh-hud-punkte { font-family: var(--display); font-size: 1.15rem; color: #ffd27a; font-variant-numeric: tabular-nums; min-width: 3.5rem; text-align: right; }
.kh-pause, .kh-stopp, .kh-insp { pointer-events: auto; height: 2.1rem; min-width: 2.1rem; display: grid; place-items: center; border: 1px solid var(--line); background: rgba(9,8,15,.6); color: var(--ember); font: inherit; font-size: .95rem; cursor: pointer; touch-action: manipulation; padding: 0 .35rem; }
.kh-pause[hidden], .kh-stopp[hidden], .kh-insp[hidden] { display: none; }
.kh-insp { display: inline-flex; gap: .2rem; align-items: center; opacity: .5; }
.kh-insp b { font-size: .75rem; color: #ffd27a; }
.kh-insp.bereit { opacity: 1; border-color: #ffd27a; box-shadow: 0 0 10px rgba(255,210,122,.35); animation: khPuls 1.6s ease-in-out infinite; }
.kh-insp:disabled { opacity: .25; animation: none; box-shadow: none; }
@keyframes khPuls { 50% { box-shadow: 0 0 18px rgba(255,210,122,.6); } }
.kh-fort { position: absolute; left: .6rem; right: .6rem; bottom: .25rem; height: 2px; background: rgba(235,226,204,.1); }
.kh-fort i { display: block; height: 100%; background: var(--ember); transform-origin: 0 50%; transform: scaleX(0); }
.kh-pegel { width: 5px; height: 1.3rem; background: rgba(235,226,204,.1); display: flex; align-items: flex-end; }
.kh-pegel i { display: block; width: 100%; height: 100%; background: #9fe08f; transform-origin: 50% 100%; transform: scaleY(0); }
.kh-duell { position: absolute; z-index: 2; left: .6rem; right: .6rem; top: 2.85rem; display: grid; grid-template-columns: 1fr 1fr auto; gap: .6rem; align-items: center; pointer-events: none; }
.kh-duell[hidden] { display: none; }
.kh-d-seite { position: relative; display: grid; gap: .15rem; }
.kh-d-name { font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; color: var(--ash); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kh-d-balken { height: 8px; border: 1px solid rgba(235,226,204,.25); background: rgba(0,0,0,.5); }
.kh-d-balken i { display: block; height: 100%; transform-origin: 0 50%; transition: transform .4s ease; }
.kh-d-seite.b i { background: linear-gradient(90deg, #e0a046, #ffd27a); }
.kh-d-seite.g i { background: linear-gradient(90deg, #a83a32, #e0605a); }
.kh-duell.knapp .kh-d-seite.b i { background: #d0503a; }
.kh-d-blitz { position: absolute; right: 0; top: -.2rem; font-style: normal; font-weight: 700; font-size: .9rem; color: #ff9a8a; opacity: 0; }
.kh-d-seite.b .kh-d-blitz { color: #ffb38a; }
.kh-d-blitz.an { animation: khBlitz 1.2s ease-out; }
@keyframes khBlitz { 0% { opacity: 1; transform: translateY(4px) scale(1.3); } 70% { opacity: 1; } 100% { opacity: 0; transform: translateY(-10px); } }
.kh-d-bild { width: 2.4rem; height: 2.4rem; border-radius: 50%; object-fit: cover; object-position: 50% 20%; border: 1px solid rgba(224,96,90,.7); background: #1d1418; }
.kh-d-bild.sym { display: grid; place-items: center; font-size: 1.3rem; }
.kh-text { max-width: 980px; margin: .55rem auto 0; text-align: center; min-height: 3.6em; }
.kh-text[hidden] { display: none; }
.kh-zeile { margin: 0; line-height: 1.35; }
.kh-zeile.jetzt { font-family: var(--name); font-size: clamp(1.15rem, 4.2vw, 1.55rem); color: rgba(235,226,204,.55); }
.kh-zeile.jetzt.gegner { color: rgba(224,130,120,.6); font-style: italic; }
.kh-zeile.dann { font-size: clamp(.85rem, 3vw, 1rem); color: rgba(235,226,204,.35); margin-top: .15rem; }
.kh-zeile span { transition: color .12s; }
.kh-zeile.jetzt span.dran { color: #fff3d6; text-shadow: 0 0 12px rgba(255,210,122,.6); }
.kh-zeile.jetzt.gegner span.dran { color: #ffb3a8; text-shadow: 0 0 12px rgba(224,96,90,.6); }
.kh-zeile.jetzt span.gut { color: #ffd27a; }
.kh-zeile.jetzt span.mies { color: #c98b7f; }
.kh-gegner-zeile { font-size: .75em; letter-spacing: .06em; text-transform: uppercase; color: rgba(224,96,90,.8); font-style: normal; }
.kh-vor { color: #5fd6b8; font-style: italic; }
.kh-schritte { margin: 0; padding-left: 1.2rem; display: grid; gap: .35rem; font-size: .9rem; color: var(--ash); }
.kh-schritte li.jetzt { color: #ffd27a; font-weight: 600; }
.kh-schritte li.fertig { color: #9fe08f; }
.kh-mess, .kh-gabel, .kh-atem { display: grid; justify-items: center; gap: .5rem; padding: .6rem 0; }
.kh-gross-ton, .kh-g-ton { font-family: var(--display); font-size: clamp(2.6rem, 12vw, 4rem); line-height: 1; color: #ffd27a; text-align: center; }
.kh-g-iv { font-family: var(--name); font-size: 1.1rem; color: #5fd6b8; min-height: 1.3em; }
.kh-m-ring { width: min(260px, 80%); height: 8px; border: 1px solid var(--line); background: rgba(0,0,0,.4); }
.kh-m-ring i { display: block; height: 100%; background: linear-gradient(90deg, #9fe08f, #ffd27a); transform-origin: 0 50%; transform: scaleX(0); transition: transform .1s; }
.kh-g-skala { position: relative; width: min(320px, 90%); height: 34px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, transparent 49.5%, rgba(159,224,143,.6) 49.5%, rgba(159,224,143,.6) 50.5%, transparent 50.5%), linear-gradient(90deg, rgba(208,106,90,.12), rgba(159,224,143,.18) 40%, rgba(159,224,143,.18) 60%, rgba(208,106,90,.12)); }
.kh-g-zeiger { position: absolute; left: calc(50% - 2px); top: 0; width: 4px; height: 100%; background: #ffd27a; transition: transform .08s linear; display: block; }
.kh-gabel[data-genau="1"] .kh-g-ton { color: #9fe08f; }
.kh-gabel.leer .kh-g-zeiger { opacity: .2; }
.kh-l-info { font-size: clamp(1.6rem, 7vw, 2.4rem); }
.kh-balken, .kh-verlauf { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; font-size: .85rem; }
.kh-balken li { display: grid; grid-template-columns: 1fr 120px; align-items: center; gap: .6rem; }
.kh-balken i { position: relative; height: 8px; background: rgba(235,226,204,.08); }
.kh-balken i::before { content: ""; position: absolute; left: 50%; top: -2px; width: 1px; height: 12px; background: rgba(235,226,204,.4); }
.kh-balken i b { position: absolute; top: 0; height: 100%; background: #e8a24a; }
.kh-verlauf li { display: flex; justify-content: space-between; gap: .5rem; border-bottom: 1px solid rgba(224,160,70,.1); padding-bottom: .2rem; }
.kh-verlauf b { color: #ffd27a; font-weight: 600; }
.kh-kurve { width: 100%; height: auto; max-height: 110px; }
.kh-kurve line { stroke: rgba(235,226,204,.12); stroke-width: 1; }
.kh-kurve line.mitte { stroke-dasharray: 3 4; }
.kh-kurve polyline { fill: none; stroke: #e0a046; stroke-width: 2; stroke-linejoin: round; }
.kh-kurve circle { fill: #ffd27a; }
.kh-kurve text { fill: rgba(235,226,204,.4); font-size: 9px; font-family: system-ui, sans-serif; }
.kh-tabelle { width: 100%; border-collapse: collapse; font-size: .84rem; }
.kh-tabelle th { text-align: left; font-weight: 600; color: var(--ash); font-size: .74rem; padding: .2rem .3rem; border-bottom: 1px solid var(--line); }
.kh-tabelle td { padding: .25rem .3rem; border-bottom: 1px solid rgba(224,160,70,.08); }
.kh-tabelle tr.mein td { color: #ffd27a; }
.kh-eintrag { flex-wrap: nowrap; }
.kh-liste-box .kh-eintrag, .kh-karte .kh-eintrag-box { display: flex; }
.kh-liste-box > .kh-eintrag { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; border: 0; padding: 0; background: none; cursor: default; }
@media (max-width: 520px) {
  .kh-raster { grid-template-columns: 1fr; }
  .kh-buehne { height: clamp(380px, 118vw, 560px); }
  .kh-zeile2 { font-size: .84rem; }
  .kh-duell { top: 2.75rem; gap: .4rem; }
}
`;
  document.head.appendChild(css);

  zeigen();
})();
