# Prüfwerkzeuge für Heldensturm (ohne Bildschirm)

Startet das PC-Programm unsichtbar (xvfb) mit Fernsteuerung und wertet das laufende Spiel aus.

- `start.sh` – Programm aus `desktop/` starten (vorher `python3 tools/android/sammeln.py desktop/spiel`, `cd desktop && npm ci`)
- `cdp.js '<js>' [bild.png]` – Ausdruck im Spiel auswerten, optional Bildschirmfoto
- `ana.js` – Karten-Analyse `__ana(7)`: Umweg-Taschen (Sackgassen/Rundwege) je Stufe; mit `window.__anaMal=1` als Bild (`bild.js <stufe> <datei>`)
- `m3.js` (REP = Wiederholungen je Stufe) + `sum.js` – alle 35 Stufen messen und zusammenfassen

Nützlich im Spiel: `__hs.start('barradin',0)`, `__hs.stage(i)`, `__hs.step(n,dt)` (Logik ohne Bild), `__hs.bot(true)`.
