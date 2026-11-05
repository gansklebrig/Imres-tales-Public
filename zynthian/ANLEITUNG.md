# Imres Tales auf dem Zynthian V5 / V5.1

Damit laufen die **Klangwelten** und **Barradins Bühne** (Musik + Kulisse) direkt auf dem Zynthian – ohne Laptop, ohne Internet, bedient mit den Tasten und Drehreglern des Geräts. Der Ton kommt aus den normalen Ausgängen des Zynthian.

Der normale Zynthian bleibt dabei unverändert. Du schaltest einfach zwischen **Zynthian** und **Imres-Bühne** hin und her.

---

## 1. Einrichten (einmalig, ca. 15 Minuten)

Du brauchst: den Zynthian im Netzwerk (LAN-Kabel oder WLAN) und einen Rechner im selben Netz.

1. **Mit dem Zynthian verbinden.** Am Rechner ein Terminal öffnen (Windows: „PowerShell“, Mac: „Terminal“) und eintippen:
   ```
   ssh root@zynthian.local
   ```
   Passwort: **raspberry** (falls du es nicht geändert hast). Die Frage nach dem „fingerprint“ mit `yes` beantworten.

2. **Installieren.** Diese eine Zeile einfügen und Enter drücken:
   ```
   curl -sL https://raw.githubusercontent.com/gansklebrig/Imres-tales-Public/main/zynthian/install.sh | bash
   ```
   Das lädt Chromium und die Seite (ca. 250 MB) herunter. Am Ende steht **„Fertig!“**.

3. **Ausprobieren:**
   ```
   imres-modus imres
   ```
   Nach ein paar Sekunden erscheint die Bühne auf dem Bildschirm.

> Beim V5 wird das Bild automatisch richtig gedreht. Steht es trotzdem falsch oder trifft der Touch daneben: in `/zynthian/zynthian-my-data/imres/einstellungen.sh` eine Zeile `IMRES_DREHEN=normal` (oder `inverted`) bzw. `IMRES_TOUCH_DREHEN=normal` (oder `inverted`) eintragen und `imres-modus imres` neu ausführen.

---

## 1b. Das Pult auf dem Gerät (neu)

Der Bildschirm zeigt ein eigenes Pult für 800 × 480 – nichts scrollt, alles liegt auf Tasten und Reglern:

- **Modi (MENU → F1 Modus):** 🎻 **Bühnen-Pult** (Seiten 🎵 Stimmung · 🌲 Ort · ⚡ Momente) · 🌿 **Klangwelten** (eigene Seiten: Klangwelten · Szenen · Geräusche nach Gruppen wie „Türen & Truhen“ · Einschläge) · 🥁 **Beat-Builder** (alle Regler und Spuren der Webseite). CTRL/ZS3 blättern nur innerhalb des Modus – nichts wechselt mehr aus Versehen.
- **Oben:** die Seiten des Modus (wechseln mit **CTRL**, zurück mit **ZS3**, oder antippen) und was gerade läuft.
- **Mitte:** 8 Kacheln – **F1–F4** obere Reihe, **ALT + F1–F4** untere Reihe. Orange = läuft, gestrichelt/blinkend = kommt am Taktende. **◀ ▶** blättert weiter, **ALT + ▲ ▼** springt zur nächsten Gruppe (z. B. Wetter, Effekte, Szenen, Geräusche).
- **Rechts:** was die vier Drehregler gerade tun – direkt neben dem echten Knopf. Drücken: siehe kleine Schrift. **MIXER** schaltet auf Reglerbank B (Tempo, Hall, Effekte, Echos Hall).
- **Unten:** PLAY Musik · STOP alles aus · PAD ⚡ Etwas passiert · REC 🤫 Stille · TEMPO 🎲 Neu besetzen.
- **MENU:** Spielabend, Optionen, Tastenbelegung, System (dort auch **⬇ Imres aktualisieren** – ohne Terminal).
- **Effekte (Bank FX, MIXER zweimal):** 🎛 Filter (links Tiefpass, rechts Hochpass, Mitte offen) · 〰 Resonanz · 🔁 Delay (im Tempo) · 🔥 Drive. Weitere: ↻ Rückkopplung, ⏱ Delay-Länge. Sie liegen hinter allem – Musik, Kulisse und Effekte. Regler drücken = neutral.
- **Effekt wechseln:** einen Regler **gedrückt halten und drehen** legt einen anderen Effekt darauf – auf der FX-Bank alle: Filter, Resonanz, Delay, Rückkopplung, Delay-Länge, Drive, 👾 Bitcrusher, 📉 Sample-Rate, ✂ Trance-Gate, 🔔 Ringmodulator, 🌀 Flanger, 〽 Wobble. Bleibt gespeichert.
- **⟳ Regler-Loop:** **ALT + Regler drücken**, dann drehen – die Bewegung wird 2 Takte lang (einstellbar im MENU: 1/2/4/8) aufgenommen und danach im Takt wiederholt (⟳ am Regler). Wieder drehen nimmt neu auf, nochmal ALT + Regler drücken stoppt den Loop.
- **Zum Halten:** ALT + STOP = Filter zu · ALT + ZS3 = Echo-Wurf · ALT + CTRL = Stotter 1/16 · ALT + PLAY = alle Effekte zurück. Belegbar außerdem: ⏪ Rückwärts, ⏏ Tape-Stop, 👾 Bitcrush voll, Hochpass.
- **💤 Bühnenbild:** Nach 10 Sekunden ohne Eingabe spielt die Band auf dem Bildschirm – mit dem Hintergrund des Ortes (Wald, Taverne …), oben Stimmung, Ort und Tempo, unten die Geräusche des Ortes mit kleinem Bild. Irgendeine Taste, ein Regler oder ein Tipper holt das Pult zurück (diese erste Eingabe löst nichts aus). Im Ruhebild lodern die Tasten wie ein Spektrum in 4 Balken (Bass links … Höhen rechts, Glut → Gold → Weiß). Einstellen unter MENU: „Bühnenbild nach: 10 s / 30 s / 60 s / nie“ und „Bühnenbild hinter dem Pult“ (Standard aus – kostet Rechenzeit).
- **💡 Tastenlicht (MENU):** Helligkeit der Tasten 15 / 30 / 50 / 75 / 100 %. In Menüs leuchten die Wahltasten gold, SEL warmweiß, BACK kupfer, der Rest glimmt wie Glut.
- **🥁 Beats (5. Seite im Bühnen-Pult) – die Mini-TR-8S:** alle Spuren der Bühne als Step-Sequencer (16 Schritte): Trommel, Ketten, Klopfen, Schelle, Bass, Melodie, Flöte, Rex. ◀ ▶ Schritt, ▲ ▼ Spur, SEL oder F1–F4 setzen (F1–F4 = die vier Schritte der aktuellen Vierergruppe, ALT + F1–F4 springt zur Gruppe), Regler 3 = Tonhöhe, Regler 2 drücken = Spur stumm. **PAD** spielt die gewählte Spur sofort (Fingerdrumming), mit **REC** an wird dabei der nächste Schritt gesetzt (Live-Aufnahme im Takt). ALT + ◀ ▶ verschiebt die Spur, ALT + ▲ kopiert, ALT + ▼ fügt ein, ALT + SEL leert. Sobald du etwas änderst, läuft der Teil als 🔁 Loop (Regler 4 drücken: Loop aus, drehen: anderen Teil). Effekte darauf über MIXER → FX.
  **Hüllkurve:** auf der Beats-Seite **MIXER** → Bank B: Attack (einschwingen), Decay (kürzen/ausklingen), Lautstärke der Spur, Variation (Zufall). Gilt für die gewählte Spur, bleibt gespeichert – auch für die Stimmungen. ◢◣ an der Spur = Hüllkurve aktiv; Regler drücken setzt zurück.
  **Variationen 1–4** (= Teile A–D): **ALT + F1–F4** wechselt – sauber auf der nächsten Eins (blinkt bis dahin). **CTRL halten + F1–F4** kopiert das ganze Pattern in Variation 1–4, **ZS3 halten + F1–F4** nur die gewählte Spur. Oben rechts „Var 1 2 3 4“ zum Antippen; lila umrandet = belegt.
- **🎬 Set (4. Seite im Bühnen-Pult):** ➕ speichert den jetzigen Klang als Song (Stimmung, Ort, Wetter/Zusätze, alle Regler, Effekte, Spielabend). Kachel antippen bzw. F-Taste = Song laden. 1,5 s halten: überschreiben, verschieben, löschen. „nächster/voriger Song im Set“ lässt sich auf Tasten legen.
- **⏱ Tap-Tempo:** TEMPO im Takt tippen – ab dem 4. Tippen wird das Tempo gesetzt, weiteres Tippen verfeinert es. Neu besetzen liegt jetzt auf ALT + TEMPO. Läuft die TR-8S als Taktgeber (Slave), bleibt deren Tempo.
- **🤖 Autopilot (MENU):** ruhig (Stimmung alle 4–7 min, Momente alle 2–3 min) oder lebendig (2–4 min / ~1 min); Spannung atmet leicht mit. Bevorzugt deine ★-Stimmungen. Wechselst du selbst, wartet er wieder. In den Klangwelten startet er Szenen und Geräusche.
- **⚙ Auslastung:** vorne in der Statuszeile – grün unter 60 %, gold bis 85 %, rot darüber; 🌡 ab 70 °C, ⚠ bei Rucklern der Oberfläche.
- **🎹 Synth-Begleitung (MENU):** Imres spielt seine Akkorde als MIDI mit – Kanal 1 Fläche, 2 Bass, 3 Glocken/Arpeggio, 4 Bordun (Grundton + Quinte der Handpan-Tonart). Mit „Klänge je Stimmung wechseln“ schaltet er General-MIDI-Programme passend zur Stimmung um (Ensembles: Tavernen-Kapelle, Abenteuer-Orchester, Schlacht-Blech, Mystik-Chor, Lagerfeuer & Elben). Im Zynthian: „Zusammen mit Zynthian“, Ketten auf Kanal 1–4 (z. B. FluidSynth mit GM-Soundfont), „Imres Begleitung“ als MIDI-Eingang aktivieren. Externe USB-Synths bekommen die Noten automatisch.
- **🔊 Bluetooth & 📶 WLAN (MENU → 🛠 Einstellungen):** Bluetooth-Lautsprecher suchen, koppeln und verbinden – der Ton von Imres läuft dann über die Box (beim ersten Mal wird Bluetooth-Audio einmalig installiert, braucht Internet; ca. 0,2 s Verzögerung, also nicht für den Takt mit der TR-8S). „Zurück zu den Zynthian-Ausgängen“ schaltet zurück. WLAN: Netze suchen, antippen, Passwort mit der Bildschirmtastatur (Finger oder Pfeile + SEL) eingeben.
- **★ Favoriten:** eine Kachel 1,5 Sekunden halten (Taste oder Finger) – sie steht dann auf ihrer Seite ganz vorne. Nochmal halten nimmt sie wieder raus.
- **ALT + ◀ ▶** wechselt die Seite, **ALT + ▲ ▼** springt zur nächsten Gruppe (z. B. Wetter, Effekte, Szenen).
- **Farben:** Jede Taste leuchtet in der Farbe dessen, was sie tut – dieselbe Farbe wie auf dem Bildschirm (Punkt in der Fußleiste, Seitenfarbe auf F1–F4, Bankfarbe auf MIXER und am Reglerfeld). CTRL leuchtet in der Farbe der nächsten Seite, ZS3 in der der vorigen. Hell = läuft gerade, gedimmt = bereit, blinkend = kommt am Taktende.
- **🎛 Belegung ändern (MENU):** jeden Drehregler (je Seite, Bank B, Bank FX) und die Tasten PLAY, STOP, PAD, REC, TEMPO, ZS3, CTRL (auch mit ALT) frei belegen. ◀ ▶ oder SEL ändert, „Standard wiederherstellen“ setzt zurück. Die Belegung bleibt gespeichert.
- **BACK 2 Sekunden halten:** zurück zur normalen Zynthian-Oberfläche.
- **Vom Zynthian zu Imres:** in der Zynthian-Oberfläche oben rechts den kleinen **♫**-Knopf 1 Sekunde halten. Andere Ecke oder aus: in `einstellungen.sh` `IMRES_KNOPF=lo` (links oben), `ru`, `lu` oder `aus`.

Die alte Ansicht (die Webseite) gibt es weiter: MENU → „Alte Ansicht“, zurück mit MENU → „Neues Pult“.

> Die Tabellen weiter unten beschreiben die alte Ansicht.

## 2. Die vier Modi

**MENU** kurz drücken → auswählen mit **F1–F4**:

| Taste | Modus | Was klingt |
|---|---|---|
| F1 | 🌿 **Klangwelten** | Nur Geräuschkulissen (Taverne, Wald, Kerker …), keine Musik |
| F2 | 🎻 **Bühne** | Musik **und** Kulisse zusammen – das volle Programm |
| F3 | 🌲 **Bühne: nur Kulisse** | Orte, Geräusche, Momente, Spannung – keine Musik |
| F4 | 🎵 **Bühne: nur Musik** | Stimmungen und Band – keine Kulisse |

Der zuletzt gewählte Modus bleibt beim nächsten Start erhalten.

---

## 3. Tasten

**Überall gleich**

| Taste | Wirkung |
|---|---|
| MENU | Modus wählen · **lang halten:** System (zurück zum Zynthian, Neustart, Ausschalten) |
| MIXER | Drehregler-Bank **A ↔ B** umschalten |
| ALT | gedrückt halten = zweite Belegung der anderen Tasten |
| ALT + MENU | 🎚 Optionen |
| ALT + REC | ⏺ Aufnahme an / aus |
| ALT + TEMPO | MIDI-Takt: aus → Slave → Master |
| ◀ ▲ ▼ ▶ | gelber Rahmen wandert über den Bildschirm |
| SEL | das Umrahmte antippen (bei einem Schieberegler: dann mit Drehregler 4 einstellen) |
| BACK | zurück / Menü schließen |

**Bühne**

| Taste | Wirkung |
|---|---|
| F1–F4 | Stimmung 1–4 (nur Kulisse: Ort 1–4) |
| ALT + F1–F4 | Ort 1–4 (nur Musik: Stimmung 5–8 · nur Kulisse: Moment 1–4) |
| PLAY | Musik ▶/■ (nur Kulisse: Hintergrund an/aus) |
| STOP | alles anhalten |
| PAD | ⚡ Etwas passiert · mit ALT: 🎙 Sprechen (Sprachsteuerung, braucht das Mikrofon) |
| REC | 🤫 Stille – alle halten den Atem an |
| TEMPO | 🎲 Neu besetzen – an der nächsten passenden Stelle |
| ZS3 | nächste Stimmung (mit ALT: vorige) |
| CTRL | nächster Ort (mit ALT: voriger) |

Stimmungen wechseln wie im Pult weich an der nächsten passenden Stelle im Takt.

**Klangwelten**

| Taste | Wirkung |
|---|---|
| F1–F4 | Klangwelt 1–4 · mit ALT: Einschlag 1–4 |
| ZS3 / CTRL | nächste / vorige Klangwelt |
| PLAY | Abspielen / Pause |
| STOP | alles aus |
| PAD | zufälliges Geräusch |
| REC | zufällige Szene |

Die Tasten leuchten: hell = läuft gerade, gedimmt = belegt, aus = frei.

---

## 4. Drehregler

| | Regler 1 | Regler 2 | Regler 3 | Regler 4 |
|---|---|---|---|---|
| **Bühne A** | 🎵 Musik-Lautstärke | 🌲 Hintergrund | 🔥 Wie viel los | 😨 Spannung |
| **Bühne B** | ⏱ Tempo | 🏛 Hall | 💥 Effekte | 🎐 Echos Hall |
| **Klangwelten A** | 🔊 Lautstärke | 😨 Spannung | 🎭 Geräusche | ⏳ Szenen |
| **Klangwelten B** | 🐾 Lebendigkeit | 🏛 Raumhall | 🌦 Wetter | 🎚 Grundschicht |

**Regler drücken:** Regler 1 = stumm / wieder an · Regler 2 (Bühne A) = Hintergrund an/aus · sonst zurück zur Mitte (Spannung: auf friedlich).

---

## 5. MIDI (z. B. TR-8S)

Einfach per USB-MIDI anschließen – wird automatisch erkannt (auch Geräte, die später dazukommen).

### Master oder Slave – der Schalter

**MENU → 🎚 Optionen → „MIDI-Takt“** oder schnell **ALT + TEMPO** (schaltet aus → Slave → Master):

| Einstellung | Was passiert |
|---|---|
| **Slave** (Standard) | Die TR-8S gibt den Takt vor. Band **und** Kulisse folgen ihr: gleiches Tempo, die Schläge rasten auf ihre Viertel ein, Start/Stop der TR-8S startet und stoppt die Musik. Auch bei einem Stimmungswechsel bleibt das Tempo der TR-8S. |
| **Master** | Die Bühne gibt den Takt vor: sie sendet MIDI-Clock, Start und Stop an alle angeschlossenen Geräte. Die TR-8S muss dafür auf „MIDI-Clock extern“ (bzw. Sync Source = MIDI/USB) stehen. |
| **aus** | Kein Abgleich – Tempo stellst du am Drehregler (Bank B). |

**🎯 Kulisse im Takt:** Einzelgeräusche der Kulisse (Hammer, Glocke, Tropfen …) fallen dann auf den Schlag. Momente, die du selbst auslöst, kommen weiterhin sofort.

**⌛ Versatz:** Liegen Bühne und Drum-Machine hörbar ein klein wenig auseinander, hier ein paar Millisekunden einstellen.

### Was die übrigen MIDI-Befehle tun

Gesteuert wird über den **Steuer-Kanal** (Standard: Kanal 16, einstellbar, auch „alle“):

- **Noten 36–39** → wie F1–F4 · **Noten 40–43** → wie ALT + F1–F4
- **CC 20–23** → wie die Drehregler 1–4 der aktuellen Bank
- **CC 119** → umschalten: 0–42 nur Zynthian · 43–85 Zynthian + Imres im Hintergrund · 86–127 Imres-Bühne. **Das klappt auch, wenn gerade der normale Zynthian läuft.**
- **Program Change** (jeder Kanal) → Stimmung Nummer *n* (mit Abend-Set: dessen Stimmungen der Reihe nach) bzw. Klangwelt *n*. So kann ein Patternwechsel der TR-8S die Stimmung wechseln.

**🥁 Pumpen auf die Bassdrum:** Schickt die TR-8S ihre Noten raus (Bassdrum = Kanal 10, Note 36), duckt sich alles bei jedem Kick kurz weg – der Groove kommt durch. Kanal, Note und Tiefe sind einstellbar.

---

## 6. Tonart der Handpan

**MENU → 🎚 Optionen → „Tonart der Handpan“**: Grundton und Skala wählen (Kurd, Celtic Minor, Integral, Amara, Pygmy, Hijaz, Sabye, Mixolydisch oder „nur Grundton“). Ab dann spielt **jede** Stimmung in dieser Tonart – nichts klingt mehr schief gegen Handpan oder Didgeridoo. Beim Umstellen gleitet die laufende Musik weich in die neue Tonart.

**👂 Tonart erkennen:** Mikrofon an den Eingang des Zynthian, Knopf drücken, 8 Sekunden lang ein paar Töne quer über die Handpan spielen (den Ding mehrmals). Grundton und Skala werden dann von selbst eingestellt.

> Hijaz klingt am nächsten als Moll; die übermäßige Sekunde der Hijaz-Skala kennt die Bühne nicht.

---

## 7. Mikrofon-Eingang

**MENU → 🎚 Optionen → „Mikrofon-Eingang“** (Standard: aus). Ein Mikrofon oder Line-Signal an den Eingang des Zynthian. Dann einzeln an- und abschaltbar:

- **Spannung folgt Lautstärke** – spielt ihr lauter, wird es spannender, im Leisen friedlicher.
- **Kulisse weicht aus** – die Kulisse wird leiser, solange ihr spielt, und kommt in den Pausen zurück.
- **Empfindlichkeit** – höher, wenn das Mikrofon weiter weg ist.

### Instrumente anstecken (Handpan, Didgeridoo …)

**Klingt es verzerrt?** Zeigt die Anzeige „⚠ übersteuert schon an der Buchse“, ist das Signal vor Imres zu laut: im selben Menü den Eingangspegel der Soundkarte (🎚) senken. Der Gain in Imres kann Verzerrung von der Buchse nicht mehr wegmachen.


**MENU → 🎤 Eingänge**: Eingang 1 und 2 getrennt einschalten, je mit **Gain** (Eingangspegel) und **Lautstärke** in der Mischung. Die Pegelanzeige wird gelb bei kräftigem, rot bei zu lautem Signal – dann Gain runter.

Sobald ein Eingang an ist, gibt es mit **MIXER** zusätzlich die Reglerbänke **IN1** / **IN2**: Lautstärke, Filter, Delay (im Tempo), Hall – mit drücken+drehen auch Gain, Rückkopplung, Drive, Panorama.

Der Ton läuft durch den Browser und kommt dadurch etwas verzögert (einige Hundertstel). Für die Anlage passt das, zum direkten Abhören am Instrument eher nicht.

### 🥁 Drumpad (Beats)

Drei Wege: oben der Reiter **🥁 Beats**, **ALT + PAD** (nochmal ALT + PAD: zurück) oder **MENU → 🥁 Drumpad / Beats**. Dort spielt PAD (auch unten auf dem Bildschirm) die gewählte Spur live.

**Pads:** Oben rechts schaltet **🥁 Pads / ▦ Raster** die Ansicht um. In der Pad-Ansicht gibt es 8 große Pads – antippen spielt das Instrument sofort (F1–F4 spielen die oberen vier). Mit **⏺ Aufnahme** (oder REC) wird bei laufendem Beat alles, was du spielst, auf den nächsten Schritt gesetzt. Darunter das kleine Raster: dort siehst du, wann welches Instrument spielt (die Pads blitzen mit), und ein Tipp auf ein Feld nimmt den Schlag wieder raus.

### 🎻 Mitspieler (wie der Ensemble-Regler am Streichfett)

**MENU → 🎤 Eingänge → 🎻 Mitspieler**: Imres hört auf deine Handpan (Eingang 1 oder 2), erkennt jeden angeschlagenen Ton und lässt Bühneninstrumente denselben Ton mitspielen – passend in die eingestellte Tonart eingerastet. **MIXER → Bank MIT**:
- **Ensemble** 0 … 8: je höher, desto mehr spielen mit – Harfe → Gitarre → Streicher → Celli → Chor → Flöte → Glockenspiel → Kontrabass
- **Lautstärke**, **Empfindlichkeit** (niedrig = nur deutliche Anschläge, hoch = auch leise Töne, dafür mehr Fehlgriffe), **Oktave** (drücken+drehen: Hall)
- Auf Wunsch gehen die Töne zusätzlich **als MIDI an den Zynthian** (Kanal wählbar) – so spielen auch deine Synths mit.

Gut zu wissen: schnelle Läufe, während viele Töne lange nachklingen, erkennt es noch nicht immer sicher. Ein Mikrofon nah an der Anlage kann die Mitspieler selbst „hören“ – Tonabnehmer oder nahes Mikro sind besser.

### 🎚 Mischpult (CTRL)

**CTRL** öffnet das Mischpult: acht Regler in zwei Reihen (obere Reihe direkt, untere mit ALT), zuerst für **Musik, Hintergrund, Instrument (IN1), Effekte**. Drücken = stumm/neutral, **drücken+drehen** legt eine andere Spur auf den Regler (z. B. IN2, Hall, Gain). Auf einen Regler lassen sich auch die Lautstärken der Soundkarte legen: **🔈 Gesamt** und **🎧 Kopfhörer** – dieselben, die der Zynthian unter Admin → Audio-Pegel hat. CTRL oder BACK schließt es. (Nächste Seite geht weiter mit ALT + ▶.)

### 🎛 Spuren (ZS3)

Auf der Seite **Ort** zeigt ZS3 die Spuren des Ortes: Kulisse gesamt, jede Geräusch-Schicht einzeln (Vögel, Wind, Bach …), die Einzelgeräusche und laufende Zusätze wie Regen. Das merkt sich Imres je Ort. Auf allen anderen Seiten zeigt ZS3 die Spuren der Stimmung:

**ZS3** öffnet die Spuren der gerade laufenden Stimmung: Kulisse, jedes Instrument einzeln (Laute, Trommel, Flöte …) und auf der zweiten Seite Orchester, Kapelle, Gäste. Regler 1–4 = obere Reihe, **ALT gedrückt halten + drehen** = untere Reihe, **◀ ▶** = weitere Spuren, Regler drücken = stumm. Die Einstellung merkt sich Imres je Stimmung. ZS3 oder BACK schließt. (Vorige Seite: ALT + ◀.)

Auch im Mischpult (CTRL) gibt es so eine zweite Reihe mit ALT.

### Ausgänge & Pegel

**MENU → 🎚 Audio: Ausgänge & Pegel**: welche Ausgangspaare Imres bespielt (1/2, 3/4 …, wenn die Soundkarte mehr hat) und alle Lautstärke-Regler der Soundkarte (◀ ▶ leiser/lauter, SEL schaltet stumm/an). Kommt aus den großen Buchsen nichts, ist dort meist ein Regler zu leise oder stumm. Mit **🔊 Testton links / rechts** lässt sich jede Seite einzeln prüfen.

---

## 8. Zusammen mit dem Zynthian

**MENU lang → System → „Zusammen mit Zynthian“** (oder Handy, oder CC 119 = 64): Die normale Zynthian-Oberfläche kommt zurück, mit allen Synths – und Imres spielt **unsichtbar im Hintergrund weiter**. Beides klingt gemeinsam aus den Ausgängen.

Bedienen kannst du Imres dann über **MIDI** (Steuer-Kanal, siehe oben) und die **Fernbedienung am Handy** – die Tasten des Geräts gehören in dieser Zeit dem Zynthian. Die Imres-Lautstärke regelst du mit CC 20 (oder am Handy), nicht im Zynthian-Mixer.

---

## 9. Aufnahme

**ALT + REC** (oder System-Menü, oder Handy): nimmt alles auf, was aus den Ausgängen kommt – Imres und Zynthian-Synths zusammen. Die Dateien liegen im Zynthian-Ordner **capture** (in der Zynthian-Weboberfläche unter „Audio/Captures“ herunterladbar). Die REC-Taste leuchtet rot, solange aufgenommen wird.

---

## 10. Fernbedienung am Handy

Handy ins selbe WLAN, dann im Browser öffnen:

**http://zynthian.local:8790**

Dort gibt es alle Tasten, die Drehregler (+/−), **alle Optionen** (Master/Slave, Tonart, Mikrofon, Pumpen …), die Aufnahme und die System-Knöpfe.

---

## 11. Zwischen Zynthian und Imres wechseln

- **Imres-Bühne (Vollbild):** Handy → „Imres-Bühne starten“ · CC 119 ≥ 86 · per SSH `imres-modus imres`
- **Zusammen:** System-Menü → „Zusammen mit Zynthian“ · CC 119 = 43–85 · `imres-modus hintergrund`
- **Nur Zynthian:** MENU lang → System → „Zurück zum Zynthian“ · CC 119 ≤ 42 · `imres-modus zynthian`
- **Was beim Einschalten startet:** System-Menü bzw. Handy → „Beim Einschalten …“ · oder `imres-modus start-imres` / `start-hintergrund` / `start-zynthian`

## 12. Aktualisieren

Mit Internet: Fernbedienung → „Imres aktualisieren“ · oder per SSH `imres-modus aktualisieren`. Danach lädt die Seite von selbst neu.

---

## Wenn etwas nicht geht

- **Kein Ton:** Läuft der Zynthian-Ton sonst? Die Bühne nutzt JACK (wie der Zynthian). Einmal `imres-modus zynthian`, dann wieder `imres-modus imres`.
- **Tasten reagieren nicht:** `journalctl -u imres-buehne -n 50` zeigt, was los ist. Die Fernbedienung am Handy funktioniert trotzdem.
- **Läuft nicht im Takt / hinkt hinterher:** Optionen → Versatz erhöhen (z. B. 30 ms). Bei der TR-8S prüfen, ob „Clock Out“ an ist.
- **Ruckelt / knackt:** Im Pult weniger Spuren gleichzeitig laufen lassen. Der Raspberry Pi 5 ist schnell, aber Chromium mit vielen Instrumenten + Kulisse ist viel Arbeit.
- **Alles rückgängig machen:**
  ```
  systemctl disable --now imres-bruecke imres-start; systemctl stop imres-hintergrund imres-buehne; rm -r /etc/systemd/system/imres-* /etc/systemd/system/zynthian.service.d/imres.conf; systemctl daemon-reload
  ```
