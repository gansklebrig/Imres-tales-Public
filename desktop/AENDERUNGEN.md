# Änderungen auf dem Zweig claude/heldensturm-pc

Jeder Punkt lässt sich einzeln zurücknehmen (Schalter in Klammern).

## 24.11.2026
**Programm**
- Heldensturm als Programm für Windows und Linux (desktop/), Release `heldensturm-pc-1.N`
- Sicherheitsprüfung und Härtung, siehe SICHERHEIT.md

**Grafik**
- Neue Stufe „Legendär“ über „Episch“: volle Auflösung ohne Obergrenze, Licht und Lichtschatten in voller Auflösung, feinerer Bloom,
  mehr Funken (Drossel erst ab 2200 statt 650), mehr Schwebeteilchen (×2,2), Leichen bleiben 12 s (statt 5 s)
- Neue Effekte nur auf „Legendär“: Sonnenstrahlen (`__hsGLFX.k.strahlen=0` schaltet ab), Kaustik auf Teichen (`__hsGLFX.k.kaustik=0`),
  12 statt 8 Schatten werfende Lichter
- Automatik: im PC-Programm beginnt sie bei „Legendär“, im Browser wie bisher bei „Episch“
- Dächer in Dörfern und Städten neu gemalt (Paket „dach“, alle Stufen außer Minimal): Verlauf je Dachfläche, einzelne Ziegel und
  Schieferplatten, Strohlagen, First mit Firstziegeln, Giebelbretter, Moos und Ruß, Gauben mit Licht bei Nacht. Wird einmal in die
  Kartenkachel gemalt und kostet im Spiel nichts. (`__hsDACH.an=0` bringt die alten Dächer zurück)

**Karten**
- Seitenräume bekommen häufiger einen zweiten Durchgang (`KA2.schleife` 0,55 → 0,85)
- Der zweite Durchgang mündet jetzt dort in den Hauptabschnitt, wo der Fußweg vom ersten am weitesten ist (vorher zufällig –
  oft landeten beide Gänge im selben Flur). Man geht durch den Seitenraum hindurch statt hinein und wieder heraus.
- Paket „rundweg“: tiefe Sackgassen innerhalb eines Abschnitts bekommen einen Durchbruch, wenn der Hauptweg dadurch nicht kürzer wird
  (`__hsKA3.KA3.an=0` schaltet ab). Greift selten (etwa jede siebte Stufe).
- Messung über alle 35 Stufen (je 3 Karten): Umweg-Taschen je Stufe 6,1 → 5,0; ihre Tiefe zusammen 8980 → 7370 px (−18 %);
  Rundwege 1,4 → 1,8. In Wald, Höhlen und Gassen deutlich besser, in Hallen kaum Änderung.
- Befund aus den Kartenbildern: Echte Gang-Sackgassen gibt es kaum noch. Was die Messung in Hallen-Stufen noch als „Tasche“ zählt,
  sind vor allem die Ecken großer Säle abseits der kürzesten Linie – kein Umkehren nötig.

**Balancing / Gameplay**
- Wette am Lagerfeuer: Einsatz nach Level gedeckelt (klein 100 + 40 je Level, groß das 2,5-Fache). Vorher 10/25 % des gesamten Goldes –
  wer jede Stufe „ohne Heiltrank“ wettete, vermehrte sein Gold um 25 % je Stufe (über einen Lauf mehr als das Tausendfache), mit „Beides“ um 50 %.
- Bot-Läufe (tools/heldensturm-pruef/sim.js): alle 20 Äste, je 3 Läufe über die ersten 3 Stufen auf Normal.
  Zeit je Stufe 230–355 s, kein Ast fällt klar ab oder dominiert → am Frühspiel nichts geändert. Spätere Stufen stehen noch aus.
