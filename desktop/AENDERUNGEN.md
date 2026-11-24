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

**Karten**
- Seitenräume bekommen häufiger einen zweiten Durchgang (`KA2.schleife` 0,55 → 0,85)
- Paket „rundweg“: tiefe Sackgassen innerhalb eines Abschnitts bekommen einen Durchbruch, wenn der Hauptweg dadurch nicht kürzer wird
  (`__hsKA3.KA3.an=0` schaltet ab). Greift selten (etwa jede zehnte Stufe).
- Messung über alle 35 Stufen (je 3 Karten): Summe der Sackgassen-Tiefe je Stufe im Schnitt 8980 → 7570 px, Rundwege 1,4 → 1,7.
  Befund: Die meisten verbleibenden Sackgassen sind Seitenräume, die nur am selben Gang hängen – das ist die nächste Baustelle.

**Balancing / Gameplay**
- noch nichts geändert
