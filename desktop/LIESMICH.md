# Heldensturm als Programm für Windows und Linux

Schlanke Chromium-Hülle (Electron), die das ganze Spiel offline aus dem Programmordner liefert –
mit Grafikkarte, voller Bildwiederholrate und echtem Vollbild. Die Browser-Fassung bleibt unverändert.

- Bauen: `.github/workflows/heldensturm-pc.yml` – bei jeder Änderung an Heldensturm, Release `heldensturm-pc-1.N`
  mit `Heldensturm-Setup.exe` (Windows) und `Heldensturm.AppImage` (Linux). „Latest“ bleibt die Android-App.
- Dateien: dieselbe Liste wie die Android-App (`tools/android/sammeln.py desktop/spiel`)
- Adresse im Programm: `heldensturm://spiel/heldensturm.html` (`main.js` liefert die Dateien, auch Teilabrufe für Ton/Video)
- Brücke zum Spiel: `window.__hsPC` (`preload.js`) – Version, Vollbild, Updates, Beenden.
  Das Spiel erkennt daran das Programm (kein Service Worker, Menüpunkte „Nach Updates suchen“ und „Beenden“,
  Grafik-Automatik beginnt bei „Legendär“).
- Grafikkarte: starke Karte erzwingen, Treiber-Sperrliste aus, Rastern auf der Grafikkarte (Schalter oben in `main.js`)
- Updates (beim Start und alle 3 Stunden, still im Hintergrund; Spielstände bleiben erhalten):
  - **Spiel-Updates ohne Neuinstallation:** Jedes Release enthält `spiel-manifest.json` (Prüfsummen aller Spieldateien, erzeugt von `manifest.py`).
    Das Programm lädt nur geänderte Dateien von `raw.githubusercontent.com/…/<commit>/<pfad>`, prüft jede per SHA-256 und legt sie in
    `userData/spiel-neu` ab; beim nächsten Start wird daraus `userData/spiel-aktuell` (wird vor dem Programmordner ausgeliefert).
    Im Spiel erscheint nur kurz „Update geladen“. Programmdatei, Verknüpfung und Tastenkürzel bleiben unberührt.
  - **Programm-Updates** (nur wenn sich die Hülle – main.js, preload.js, Abhängigkeiten – geändert hat): Windows lädt die Setup-Datei,
    prüft sie gegen `SHA256SUMS.txt` und spielt sie beim Beenden still ein (`/S --updated`); Linux ersetzt die AppImage-Datei unter demselben Namen.
  - **Desktop-Verknüpfung** nur bei der allerersten Installation (`build/installer.nsh`), danach nie wieder angefasst.
  - Releases ohne Manifest (ältere Fassungen): wie früher Download im Browser.
- Spielstände: im Programm-Speicher (Windows `%APPDATA%\Heldensturm`, Linux `~/.config/Heldensturm`), getrennt vom Browser
- Tasten: F11 / Alt+Enter Vollbild · Strg+R neu laden · Strg+Umschalt+I Entwicklerwerkzeuge · Strg+Q beenden
- Startschalter: `--fenster` (kein Vollbild) · `--ohne-gpu` (Notfall) · `--ohne-update`
- Nicht signiert: Windows zeigt beim ersten Start „Der Computer wurde geschützt“ → „Weitere Informationen“ → „Trotzdem ausführen“

Lokal ausprobieren: `python3 tools/android/sammeln.py desktop/spiel && cd desktop && npm ci && npm start`
