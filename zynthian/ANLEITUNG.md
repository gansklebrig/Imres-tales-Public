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

> Steht das Bild auf dem Kopf? In der Datei `/zynthian/zynthian-my-data/imres/einstellungen.sh` vor `IMRES_DREHEN=inverted` das `#` entfernen (z. B. mit `nano`) und neu starten.

---

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
