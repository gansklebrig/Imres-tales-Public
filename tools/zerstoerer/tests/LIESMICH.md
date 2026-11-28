# Automatische Tests für „Ezekiel – The Destroyer“

Bei jedem Push auf `main` (und bei jedem Pull-Request) prüft GitHub das Spiel automatisch – aber nur, wenn sich etwas am
Spiel (`zerstoerer.html`, `zerstoerer/…`), am PC-Programm (`desktop-zerstoerer/…`) oder an den Werkzeugen
(`tools/zerstoerer/…`) geändert hat. Die Tests ändern nichts und veröffentlichen nichts.

## Wo sehe ich das Ergebnis?

1. Auf GitHub das Repo öffnen. Neben der letzten Commit-Nachricht (über der Dateiliste) steht ein kleines Zeichen:
   - **gelber Punkt** – die Tests laufen noch (dauert etwa 5–8 Minuten),
   - **grünes Häkchen ✓** – alles in Ordnung,
   - **rotes Kreuz ✗** – mindestens ein Test ist fehlgeschlagen.
2. Auf das Zeichen klicken → „Details“ bei **Zerstörer testen**. Alternativ oben im Repo der Reiter **Actions** →
   links **Zerstörer testen** → den obersten Lauf anklicken.
3. Im Lauf auf **testen** klicken. Die Schritte klappen auf; der rote Schritt zeigt, was schiefging. Jede Prüfung steht
   als eigene Zeile da: `OK …` oder `FEHLER …`, am Ende jeder Testdatei `ERGEBNIS a / b`.
4. Bei Fehlern gibt es unten auf der Übersichtsseite des Laufs unter **Artifacts** die Datei **testbilder** (ZIP) mit
   Bildschirmfotos des Spiels im Moment des Fehlers.

Ein rotes Kreuz verhindert nichts – die Seite wird trotzdem veröffentlicht. Es ist eine Warnung: erst nachsehen, dann
weiterarbeiten. Einen Lauf von Hand starten: Reiter **Actions** → **Zerstörer testen** → **Run workflow**.

## Was wird geprüft?

| Schritt | Datei | Was |
|---|---|---|
| Schnelltests | `schnell.py` | Syntax aller `zerstoerer/*.js` (`node --check`), ES2019 für alte Handheld-Browser (`tools/zerstoerer/es2019check.js`, z. B. kein `?.`/`??`), Update-Dateiliste (`manifest_pruefen.py`), Update-Logik des PC-Programms (`desktop-zerstoerer/test/inhalt.test.js`) |
| Browser | `t_haken.py` | Schnittstelle `Z.haken` (haken.js): Außenschichten bleiben außen und wirken genau einmal; Schattenblock, Lager-Schichten |
| Browser | `t_gesamt.py` | Titel → Lager → Lauf, sechs Gebiete laden und spielen, Pausenmenü, Bild wird gezeichnet |
| Browser | `t_werkzeuge.py` | 24 Werkzeuge und 10 Schilde in einer Testkammer |
| Browser | `t_spielstaende.py` | drei Spielstände: wechseln, kopieren, zweistufig löschen, überschreiben |
| Browser | `t_ablauf.py` | ein ganzer Lauf mit Test-Bot (`bot.js`) bis zum Ende, Tod, zurück ins Lager |
| Browser | `t_rollen.py` | Rollenwahl in drei Fenstergrößen |
| Browser | `t_online.py`, `t_online_schrein.py` | Online-Koop mit zwei Browserseiten über einen lokalen Vermittler (`peer-server.js`) |

Alle Browser-Tests melden zusätzlich jeden Seitenfehler (JavaScript-Fehler) als `FEHLER`.

## Lokal ausführen

Voraussetzungen: Python 3 mit `pip install playwright` und `python -m playwright install chromium`, Node 18+.
Für ES2019 und die Online-Tests einmalig die Werkzeuge außerhalb des Repos holen:

    npm install --no-save --prefix /tmp/zs-werkzeug acorn@8 peer@1.0.2
    export ACORN_PFAD=/tmp/zs-werkzeug ZS_PEER_MODUL=/tmp/zs-werkzeug/node_modules/peer

Dann im Repo:

    python3 tools/zerstoerer/tests/schnell.py          # Schnelltests
    python3 tools/zerstoerer/tests/alle.py              # alle Browser-Tests (startet Server selbst)
    python3 tools/zerstoerer/tests/alle.py gesamt       # nur einer

Einstellungen über Umgebungsvariablen: `ZS_PORT` (Spielserver, Standard 9230), `ZS_PEER_PORT` (Vermittler, 9431),
`ZS_BILDER` (Ordner für Fehlerfotos, Standard `testbilder`), `ZS_OHNE_ONLINE=1` (Online-Tests auslassen),
`ZS_TEST_ZEIT` (Höchstdauer je Testdatei in Sekunden, Standard 300).

Hinweis: Dateien in `tools/zerstoerer/tests/` lösen keinen Neubau des PC-Programms und keine neue Dateiliste aus.
