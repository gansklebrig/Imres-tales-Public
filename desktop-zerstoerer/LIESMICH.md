# Ezekiel – The Destroyer als Programm für Windows und Linux

Schlanke Chromium-Hülle (Electron), die das Spiel offline aus dem Programmordner liefert – mit Grafikkarte, voller
Bildwiederholrate und echtem Vollbild. Die Browser-Fassung bleibt unverändert. Aufbau wie die Heldensturm-Hülle (`desktop/`).

## Herunterladen
Release-Seite: <https://github.com/gansklebrig/Imres-tales-Public/releases/tag/zerstoerer-pc>
- **Windows:** `Zerstoerer-Setup.exe` ausführen (installiert ohne Fragen für den eigenen Benutzer, legt Desktop- und Startmenü-Verknüpfung an).
  Nicht signiert: beim ersten Mal „Der Computer wurde geschützt“ → „Weitere Informationen“ → „Trotzdem ausführen“.
- **Linux:** `Zerstoerer.AppImage` herunterladen, `chmod +x Zerstoerer.AppImage`, starten.
- Im Browser zeigt das Titelmenü des Spiels am PC (Windows/Linux) dezent „⤓ Als Programm für Windows/Linux“.

## Updates – ohne Neuinstallation
**Spiel-Updates (der Normalfall):** Jede Änderung am Spiel auf `main` erneuert `zerstoerer/dateien.json`
(Workflow `zerstoerer-manifest.yml`, Skript `tools/zerstoerer/manifest.py`: Pfad, SHA-256, Größe, `stand` = `?v=`-Nummer).
Das Programm holt beim Start (und über Pause → „Nach Updates suchen“) diese Liste von `https://imrestales.de/zerstoerer/dateien.json`,
lädt **nur geänderte/neue Dateien**, prüft jede Prüfsumme und legt sie in einen neuen Ordner im Programmspeicher.
Erst wenn alles stimmt, wird umgeschaltet (atomar). Dann erscheint unten rechts „Update geladen – beim nächsten Start aktiv“
mit „Jetzt neu laden“ (Spielstand bleibt; ein laufender Lauf endet wie beim Beenden). Offline oder bei Fehlern geht es still mit dem
bisherigen Stand weiter. Ausgeliefert wird zuerst aus dem Update-Ordner, sonst aus den mitgelieferten Dateien. Logik: `inhalt.js`.

**Programm-Updates (selten, nur wenn sich die Hülle ändert):** `electron-updater` liest `latest.yml` / `latest-linux.yml`
aus dem festen Release `zerstoerer-pc` (`…/releases/download/zerstoerer-pc/`), lädt im Hintergrund und installiert beim Beenden
(oder sofort über „Jetzt neu starten“):
- Windows: NSIS, `oneClick`, `perMachine: false` → still an Ort und Stelle (`%LOCALAPPDATA%\Programs\zerstoerer`).
  **Verknüpfungen bleiben:** electron-builder schreibt bei der Installation `KeepShortcuts=true` in die Registry; bei einem Update
  ruft der neue Installer den alten Deinstaller mit `--keep-shortcuts` auf (Verknüpfungen werden nicht gelöscht) und legt sie
  selbst nicht neu an (`createDesktopShortcut: true`, nicht `"always"`; geprüft in den Vorlagen von app-builder-lib 26.18:
  `installSection.nsh`, `include/installer.nsh` `addDesktopLink`, `uninstaller.nsh`). Eine vom Nutzer gelöschte Desktop-Verknüpfung
  kommt deshalb auch nicht zurück. An die Taskleiste angeheftete Verknüpfungen zeigen auf denselben Pfad und bleiben gültig.
  `appId`, `productName` und `executableName` dürfen sich deshalb **nie** ändern.
- Linux: die AppImage ersetzt sich selbst unter demselben Pfad (Dateiname ohne Versionsnummer).
- Ein Programm-Update bringt ein neueres mitgeliefertes Spiel mit; ältere Spiel-Update-Ordner werden dann verworfen und
  die Liste wird neu verglichen.

## Bauen
- Workflow `.github/workflows/zerstoerer-pc.yml`: nur bei Änderungen an `desktop-zerstoerer/**`, `tools/zerstoerer/**` oder von Hand.
  Ergebnis in Release `zerstoerer-pc` (fester Tag, Dateien ersetzt) und `zerstoerer-pc-1.N` (versioniert, die letzten 3 bleiben),
  jeweils mit `SHA256SUMS.txt`. Keines wird „Latest“ (das bleibt die Heldensturm-Android-App).
- Dateien: `tools/zerstoerer/sammeln.py desktop-zerstoerer/spiel` – zerstoerer.html, zerstoerer/**, tonregler.js, favicon.svg,
  schriften/** und alle Aufnahmen aus klang/ und amb/, deren Namen im Spielcode vorkommen (≈ 2 500 Dateien, ≈ 86 MB).
- Lokal: `python3 tools/zerstoerer/sammeln.py && cd desktop-zerstoerer && npm ci && npm test && npm start`
  bzw. `npx electron-builder --linux --publish never`.

## Im Programm
- Adresse: `zerstoerer://spiel/zerstoerer.html` (eigenes Schema; Spielstände im Programmspeicher, getrennt vom Browser:
  Windows `%APPDATA%\Zerstoerer`, Linux `~/.config/Zerstoerer`; Update-Ordner darin unter `inhalt/`).
- Brücke `window.__zsPC` (`preload.js`): Version, Vollbild, Updates, Neu laden, Beenden, Hinweise. Daran erkennt das Spiel das Programm:
  Grafik-Automatik startet bei „Ultra“ (schaltet bei Ruckeln wie gewohnt herunter), Pausemenü mit „Nach Updates suchen“ und „Beenden“,
  Vollbild-Knopf/F schalten das Fenster-Vollbild (Änderungen im Spiel: `zerstoerer/ui.js`, `zerstoerer/grafik.js`, markiert „W18 PC“).
  Einen Service Worker hat der Zerstörer nicht.
- Tasten: F11 / Alt+Enter Vollbild · Strg+R neu laden · Strg+Umschalt+I Entwicklerwerkzeuge (nur mit `--entwickler`) · Strg+Q beenden
- Startschalter: `--fenster` (kein Vollbild) · `--ohne-gpu` (Notfall) · `--ohne-update` · `--entwickler`
- „Zur Taverne“ und andere Verweise öffnen den normalen Browser.

Sicherheit: siehe `SICHERHEIT.md`.
