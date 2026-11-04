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
| PAD | ⚡ Etwas passiert |
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

Einfach per USB-MIDI anschließen – wird automatisch erkannt.

- **MIDI-Clock** → die Bühne spielt im Tempo der Drum-Machine (abschaltbar: MENU lang → System → „MIDI-Takt folgen“).
- **Start / Stop** → Musik startet und stoppt mit.
- **Noten 36–39** (C1–D#1, auch 40–43) → wie F1–F4.
- **CC 20–23** → wie die Drehregler 1–4 der aktuellen Bank.
- **Program Change** → Stimmung (bzw. Klangwelt) Nummer *n*.

---

## 6. Fernbedienung am Handy

Handy ins selbe WLAN, dann im Browser öffnen:

**http://zynthian.local:8790**

Dort gibt es alle Tasten, die Drehregler (+/−) und die System-Knöpfe – auch **„Imres-Bühne starten“**, wenn gerade der normale Zynthian läuft.

---

## 7. Zwischen Zynthian und Imres wechseln

- **Zur Imres-Bühne:** Fernbedienung am Handy → „Imres-Bühne starten“ · oder per SSH `imres-modus imres`
- **Zurück zum Zynthian:** MENU lang halten → System → „Zurück zum Zynthian“ · oder `imres-modus zynthian`
- **Immer mit der Imres-Bühne starten:** `imres-modus start-imres` (rückgängig: `imres-modus start-zynthian`)

## 8. Aktualisieren

Mit Internet: Fernbedienung → „Imres aktualisieren“ · oder per SSH `imres-modus aktualisieren`. Danach lädt die Seite von selbst neu.

---

## Wenn etwas nicht geht

- **Kein Ton:** Läuft der Zynthian-Ton sonst? Die Bühne nutzt JACK (wie der Zynthian). Einmal `imres-modus zynthian`, dann wieder `imres-modus imres`.
- **Tasten reagieren nicht:** `journalctl -u imres-buehne -n 50` zeigt, was los ist. Die Fernbedienung am Handy funktioniert trotzdem.
- **Ruckelt / knackt:** Im Pult weniger Spuren gleichzeitig laufen lassen. Der Raspberry Pi 5 ist schnell, aber Chromium mit vielen Instrumenten + Kulisse ist viel Arbeit.
- **Alles rückgängig machen:**
  ```
  systemctl disable --now imres-bruecke imres-start; rm -r /etc/systemd/system/imres-* /etc/systemd/system/zynthian.service.d/imres.conf; systemctl daemon-reload
  ```
