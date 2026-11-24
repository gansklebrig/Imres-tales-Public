# Sicherheit des PC-Programms

Stand 24.11.2026. Geprüft wurde das Programm selbst (desktop/), nicht das Spiel als Ganzes.

## Was das Programm kann – und was nicht
- Es zeigt nur die mitgelieferten Spieldateien (`heldensturm://spiel/…`). Die Spielseite hat **keinen** Zugriff auf Node, das Dateisystem oder andere Programme
  (Sandbox an, contextIsolation an, nodeIntegration aus, kein webview).
- Die Brücke `window.__hsPC` kann nur: Version lesen, Vollbild schalten, Grafikkarten-Info lesen, Update-Dialog öffnen, Programm beenden.
  Aufrufe werden nur von der Spielseite im Hauptfenster angenommen.
- Es öffnet keinen Netzwerk-Port und nimmt keine Verbindungen von außen an. Fernsteuer-Schalter von Chromium (`--remote-debugging-port` usw.) werden im fertigen Programm verworfen.
- Netz nur verschlüsselt (https/wss): Bestenliste/Cloud-Stand (Supabase), Online-Mehrspieler (PeerJS), Update-Abfrage (GitHub). Kein http, kein Zugriff auf `file://`.
- Inhaltsrichtlinie (CSP): Skripte nur aus dem Programmordner – nichts wird aus dem Netz nachgeladen. Keine Rahmen, keine Plugins.
- Rechte: Vollbild, Zeigersperre, Zwischenablage schreiben. Mikrofon, Kamera, Standort, USB, Benachrichtigungen usw. sind gesperrt. Downloads sind gesperrt.
- Verweise nach außen (Taverne, Release-Seite) öffnet der normale Browser; erlaubt sind nur http(s) und mailto.
- Updates installiert das Programm **nicht selbst**: es zeigt einen Hinweis und öffnet den Download aus dem eigenen GitHub-Projekt im Browser.
- Electron-Sicherungen (Fuses): kein Missbrauch der .exe als Node-Laufzeit, keine NODE_OPTIONS/--inspect, Programmcode nur aus dem geprüften app.asar.

## Getestet (von innen, als wäre die Spielseite bösartig)
http-Abruf blockiert · `file:///etc/passwd` blockiert · Pfad-Ausbruch (`../`, kodiert, absolut) 403/404 · fremder Host 404 ·
Skript von einem CDN blockiert · `require`/`process` nicht vorhanden · Debug-Port zu · `ELECTRON_RUN_AS_NODE` wirkungslos.

## Was bleibt
- **Nicht signiert:** Windows kann die Herkunft nicht prüfen (SmartScreen-Warnung). Nur von der Release-Seite des eigenen Projekts laden;
  die SHA-256-Prüfsummen stehen im Release-Text. Wer das GitHub-Konto übernimmt, könnte eine manipulierte Fassung veröffentlichen → Konto mit 2FA schützen.
- **Electron/Chromium altern:** Sicherheitslücken im Browser-Kern werden nur durch neue Programm-Fassungen geschlossen (Electron-Version in package.json anheben, neu bauen).
- **Online-Mehrspieler:** Mitspieler schicken Spieldaten; das ist dasselbe Risiko wie im Browser und bleibt in der Sandbox.
- Bau-Werkzeuge (electron-builder) melden 6 mittlere Hinweise (minimatch, DoS beim Bauen) – nicht Teil des ausgelieferten Programms.
