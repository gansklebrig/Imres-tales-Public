# Sicherheit des PC-Programms „Ezekiel – The Destroyer“

Stand 25.11.2026. Aufbau und Härtung wie die Heldensturm-Hülle (`desktop/SICHERHEIT.md`), dazu die Spiel-Updates.

## Was das Programm kann – und was nicht
- Es zeigt nur die Spieldateien (`zerstoerer://spiel/…`, mitgeliefert oder aus dem geprüften Update-Ordner). Die Spielseite hat
  **keinen** Zugriff auf Node, das Dateisystem oder andere Programme (Sandbox, contextIsolation, kein nodeIntegration, kein webview).
- Brücke `window.__zsPC`: Version lesen, Vollbild, Grafikkarten-Info, Update-Prüfung, Neu laden, Beenden, Speichern-Dialog für Bericht/Ergebniskarte (siehe unten). Nur von der Spielseite im Hauptfenster.
- Kein offener Netzwerk-Port; Fernsteuer-Schalter (`--remote-debugging-port` usw.) werden im fertigen Programm verworfen.
- Die Spielseite selbst hat **kein Netz** (das Spiel braucht keins): nur `zerstoerer:`, `data:`, `blob:`. Kein http/https, kein `file://`.
- CSP: Skripte nur aus dem Spiel, keine Rahmen, keine Plugins. Rechte nur Vollbild/Zeigersperre/Zwischenablage; Downloads gesperrt.
- Verweise nach außen öffnet der normale Browser (nur http(s)/mailto).
- Electron-Fuses: kein `ELECTRON_RUN_AS_NODE`, keine NODE_OPTIONS/--inspect, Code nur aus dem geprüften app.asar.

## Dateien speichern (W31 Spielbericht, W39 Teilen, Stand 28.11.2026)
- `__zsPC.speichern(name, text)`: Text über den Speichern-Dialog des Systems, nur `.json`/`.txt`, höchstens 5 MB.
- `__zsPC.speichernBild(name, daten)`: Ergebniskarte als PNG. Nur `ArrayBuffer`/`Uint8Array` (andere Typen → abgelehnt), 64 B bis 4 MB,
  die ersten 8 Bytes müssen die PNG-Signatur sein; Dialog nur mit Filter `.png`, gewählter Pfad muss auf `.png` enden.
  Namensvorschlag bereinigt (nur Buchstaben/Ziffern/`._-`, keine führenden Punkte), Vorschlag im Bilder-Ordner.
- In beiden Fällen bestimmt allein der Spieler im System-Dialog den Ort; die Spielseite bekommt keinen Pfad- oder Dateizugriff
  (nur `{ ok, pfad }` zur Anzeige) und kann nichts lesen. Nur von der Spielseite im Hauptfenster (`vomSpiel`).

## Online-Koop (W32 Online, Stand 26.11.2026)
- Einzige Netz-Ausnahme der Spielseite: der PeerJS-Vermittler `0.peerjs.com` – nur `https:`/`wss:`, genau dieser Host, Port 443
  (CSP `connect-src` und `webRequest`-Filter in `main.js`, Konstante `VERMITTLER`). Alles andere bleibt gesperrt.
- Die Bibliothek (`zerstoerer/lib/peerjs.min.js`, MIT) liegt im Spiel und wird mit SRI-Prüfsumme geladen – nichts aus dem Netz.
- Spieldaten fließen direkt zwischen den beiden Geräten über WebRTC-**Datenkanäle** (DTLS-verschlüsselt). Keine Kamera/Mikrofon
  (Rechte bleiben verweigert), kein TURN-Weiterleitungsserver; STUN (Cloudflare/Google) sieht nur die öffentliche Adresse.
- „Ohne Vermittler“: Angebot/Antwort als kopierter Text – dann spricht die Spielseite mit keinem Vermittler (nur STUN).
- Empfangene Nachrichten werden nie ausgeführt: nur JSON, höchstens 256 KB, Typ/Feldnamen/Zahlen/Listenlängen geprüft, `__proto__`,
  `constructor`, `prototype` verworfen; Verweise auf Spieldaten nur über eine feste Tabelle (Z.ENEMIES, Z.WEAPONS …).
- Der Gastgeber nimmt vom Gast nur Tasten-Bits (12 Aktionen) mit steigenden Folgenummern an, höchstens ~150 Nachrichten/s; Händler und
  Gespräche bleiben dem Gastgeber vorbehalten. Der Gast deckelt Gutschriften selbst (ein manipulierter Gastgeber kann nicht mehr geben).
- Der Mitspieler sieht die IP-Adresse (wie bei jedem direkten Online-Spiel); darauf weist das Spiel im Online-Fenster hin.

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
