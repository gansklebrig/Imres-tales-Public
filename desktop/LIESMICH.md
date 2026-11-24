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
- Updates: prüft beim Start die Releases und bietet den Download an; Spielstände bleiben erhalten
- Spielstände: im Programm-Speicher (Windows `%APPDATA%\Heldensturm`, Linux `~/.config/Heldensturm`), getrennt vom Browser
- Tasten: F11 / Alt+Enter Vollbild · Strg+R neu laden · Strg+Umschalt+I Entwicklerwerkzeuge · Strg+Q beenden
- Startschalter: `--fenster` (kein Vollbild) · `--ohne-gpu` (Notfall) · `--ohne-update`
- Nicht signiert: Windows zeigt beim ersten Start „Der Computer wurde geschützt“ → „Weitere Informationen“ → „Trotzdem ausführen“

Lokal ausprobieren: `python3 tools/android/sammeln.py desktop/spiel && cd desktop && npm ci && npm start`
