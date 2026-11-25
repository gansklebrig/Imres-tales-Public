# Sicherheit des PC-Programms „Ezekiel – The Destroyer“

Stand 25.11.2026. Aufbau und Härtung wie die Heldensturm-Hülle (`desktop/SICHERHEIT.md`), dazu die Spiel-Updates.

## Was das Programm kann – und was nicht
- Es zeigt nur die Spieldateien (`zerstoerer://spiel/…`, mitgeliefert oder aus dem geprüften Update-Ordner). Die Spielseite hat
  **keinen** Zugriff auf Node, das Dateisystem oder andere Programme (Sandbox, contextIsolation, kein nodeIntegration, kein webview).
- Brücke `window.__zsPC`: Version lesen, Vollbild, Grafikkarten-Info, Update-Prüfung, Neu laden, Beenden. Nur von der Spielseite im Hauptfenster.
- Kein offener Netzwerk-Port; Fernsteuer-Schalter (`--remote-debugging-port` usw.) werden im fertigen Programm verworfen.
- Die Spielseite selbst hat **kein Netz** (das Spiel braucht keins): nur `zerstoerer:`, `data:`, `blob:`. Kein http/https, kein `file://`.
- CSP: Skripte nur aus dem Spiel, keine Rahmen, keine Plugins. Rechte nur Vollbild/Zeigersperre/Zwischenablage; Downloads gesperrt.
- Verweise nach außen öffnet der normale Browser (nur http(s)/mailto).
- Electron-Fuses: kein `ELECTRON_RUN_AS_NODE`, keine NODE_OPTIONS/--inspect, Code nur aus dem geprüften app.asar.

## Spiel-Updates (inhalt.js)
- Eigene Sitzung ohne Zwischenspeicher, die **nur `https://imrestales.de`** erreichen darf; Umleitungen woandershin werden abgelehnt.
- Liste geprüft: nur erlaubte Orte (`zerstoerer.html`, `zerstoerer/`, `tonregler.js`, `favicon.svg`, `schriften/`, `klang/`, `amb/`)
  und Dateiarten, keine `..`, keine versteckten/reservierten Namen, keine Groß-/Kleinschreibungs-Dubletten, höchstens 32 MB je Datei,
  600 MB je Update, 20 000 Dateien.
- Jede Datei: Größe und SHA-256 müssen zur Liste passen. Geschrieben wird in einen neuen Ordner; erst nach vollständigem Erfolg
  Umbenennen und atomares Ersetzen von `aktuell.json`. Bei jedem Fehler bleibt der alte Stand.
- Vertrauensanker ist die Website: Wer imrestales.de bzw. das GitHub-Repo verändern kann, kann auch neue Spieldateien ausliefern –
  genau wie im Browser. Die Dateien laufen in derselben Sandbox wie im Browser (kein Zugriff auf den Rechner).

## Programm-Updates (electron-updater)
- Quelle: Release `zerstoerer-pc` im eigenen GitHub-Projekt; eigene Sitzung, nur https zu github.com/githubusercontent.com.
- electron-updater prüft die SHA-512 aus `latest.yml`. **Nicht signiert:** es gibt keine Signaturprüfung (kein `publisherName`) –
  wer das GitHub-Konto übernimmt, könnte ein manipuliertes Programm verteilen → Konto mit 2FA schützen.

## Getestet (lokal, Linux, 25.11.2026)
https/http/`file://` aus der Spielseite blockiert · Pfad-Ausbruch (`../`, kodiert, `\`) und fremder Host 403/404 · `require`/`process` fehlen ·
Debug-Port im fertigen Programm zu · `ELECTRON_RUN_AS_NODE` wirkungslos · Update: geänderte Dateien geladen, falsche Prüfsumme/Größe,
fremde Umleitung, bösartige Liste und offline → alter Stand bleibt (Node-Tests `test/inhalt.test.js` und Probelauf im Programm).
Nicht getestet: Windows-Installer und Programm-Updates gegen das echte Release (erst nach dem ersten Bau möglich).
