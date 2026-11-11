# Lieder schreiben für „Barden Beats“ (imrestales.de)

Die Bühne der Website ist eine Fantasy-Tavernenband im Browser (Laute, Harfe, Drehleier, Flöten, Trommeln …), die zu
Stimmungen einer D&D-Runde spielt. Bisher erfindet sie die meisten Stücke nach Regeln neu, nur wenige sind ausgeschrieben.
Jetzt soll **jede Stimmung ein richtiges Sortiment ausgeschriebener Stücke** bekommen – so viele, dass man sehr lange
zuhören muss, bis eines wiederkommt.

Der Auftraggeber wünscht sich: **so passend wie möglich zur Stimmung, gleichzeitig wohlklingend und am besten ein bisschen
catchy.** Bei düsteren Stimmungen sind Disharmonien erwünscht – aber im Rahmen.

## Was du abgibst

Eine Datei `/root/work/lieder/teil-<GRUPPE>.js` (Gruppe steht in deinem Auftrag) mit

```js
module.exports = {
  rast: [ stück, stück, … ],
  kamin: [ … ],
};
```

Prüfe sie mit `node /root/work/lieder/pruefen.js /root/work/lieder/teil-<GRUPPE>.js` – **0 Fehler sind Pflicht**,
Hinweise (·) möglichst wenige (jeder Hinweis ist eine musikalische Warnung; einzelne bewusste Ausnahmen sind ok).
Ein Beispiel liegt in `/root/work/lieder/beispiel.js`. Ändere keine anderen Dateien.

## Format eines Stücks

```js
{ titel: "Glut unter den Sternen",      // deutscher, stimmungsvoller Titel, jeder Titel nur einmal
  modus: "mixolydisch",                 // dorisch | mixolydisch | aeolisch | phrygisch | ionisch | lydisch
  takt: 12,                             // weglassen = 16 Schritte (4/4). 12 = Dreier (Walzer 3/4 oder Jig)
  tempo: 76,                            // optional (BPM), sonst das Tempo der Stimmung
  schlag: "walzer",                     // Schlagwerk-Vorlage, siehe unten
  bass: { i: "orgel", s: "halbe", r: "viertel", b: "orgel", h: "viertel" },   // oder ein Wort für alle Teile
  instrument: "harfe",                  // optional – weglassen = die Band wählt passend zur Stimmung (gut für Abwechslung!)
  band: { trommel: "bodhran", floete: "floete", ketten: "rassel" },          // optional, ebenso
  swing: 0, bordun: 0,                  // optional: swing 1 = punktiert/geswingt, bordun 1 = Liegeton (Drehleier/Dudelsack-Gefühl)
  intro:   ["000", "0...4...7..."],                  // 1 Takt
  strophe: [[akk, mel], [akk, mel], [akk, mel], [akk, mel]],    // 4 Takte
  refrain: [[akk, mel], [akk, mel], [akk, mel], [akk, mel]],    // 4 Takte – der Ohrwurm
  bruecke: [[akk, mel, zweit], [akk, mel, zweit]],              // 2 Takte – Kontrast
  refrain2: [ … 4 Takte … ],            // optional: abgewandelter letzter Refrain
  schluss: [akk, mel, zweit?]           // optional: ersetzt den allerletzten Takt (Kadenz)
}
```

**Ablauf beim Spielen:** Intro → Strophe → Refrain → Strophe → Refrain → Brücke → Refrain (mit Terzstimme, oder `refrain2`) mit `schluss`.
Danach spielt es das Ganze noch einmal, dann kommt ein anderes Stück.

### Akkorde `akk`
Eine Ziffer **pro Schlag** (16er-Takt: 4 Ziffern, 12er-Takt: 3 Ziffern), Ziffer = Stufe der Tonleiter, auf der der Dreiklang
steht (0 = Grundakkord, 3 = Subdominante, 4 = Dominante …). Beispiel `"0044"` = zwei Schläge Tonika, zwei Schläge Stufe 4.
Die Dreiklänge sind leitereigen, also z. B. in aeolisch: 0 Moll, 1 vermindert, 2 Dur, 3 Moll, 4 Moll, 5 Dur, 6 Dur.
Der Bass wird automatisch aus den Akkorden gebaut (Muster `bass`).

### Melodie `mel`
16 (bzw. 12) Zeichen, eines je Sechzehntel-Schritt. Zeichen = **Tonleiterstufe** über dem Grundton:
`0` Grundton, `1`…`6` die Stufen darüber, `7` Oktave, `8`…`d` zweite Oktave, `e` Doppeloktave. `.` = kein neuer Ton
(der vorige klingt weiter/aus). Tiefer als `0` geht nicht. Guter Bereich für Melodien: `2` bis `b`, Refrain gern etwas höher.
Ein Schritt = Sechzehntel: `"4.4.7.4."` sind Achtel, `"7...9..."` Viertel, `"c......."` eine halbe Note.
Betonte Schritte sind 0, 4, 8, 12 (bei 12: 0, 4, 8; beim Jig gruppiere in 3er: 0, 3, 6, 9 mit Betonung 0 und 6).

### Zweite Stimme (Echo, z. B. Flöte) – drittes Feld, optional
`"echo"` = antwortet in den Lücken (Standard in der Strophe), `"lang"` = lange Harmonietöne (Standard im Refrain),
`"terz"` = parallel eine Terz darunter (Standard im letzten Refrain), `"fern"` = vereinzelte ferne Töne, `""` = schweigt,
oder eine eigene 16er-Zeile wie die Melodie (gern tiefer, z. B. `0`–`7`, als Gegenmelodie oder Arpeggio – wirkt in der Brücke toll).

### `schlag` – Vorlagen fürs Schlagwerk
`keiner` · `ruhig` (kaum) · `sanft` · `tanz` (Taverne) · `marsch` · `treibend` · `schleichend` (düster, sparsam) ·
`walzer` (12er) · `jig` (12er) · `kampf` · `boss` · `verfolgung` (gehetzt) · `spannung` (tickend) · `reiter` (Galopp) · `sieg` (Fanfare) · `markt` (orientalisch-lebhaft)

### `bass` – Muster
`orgel` (ein Ton je Takt, liegend) · `halbe` · `viertel` · `puls` (Achtel) · `galopp` (punktiert-treibend).
Rollen: `i` Intro, `s` Strophe, `r` Refrain-Aufbau, `b` Brücke, `h` Höhepunkt (Refrain).

### Instrumente (optional – lieber oft weglassen, dann wechselt die Besetzung von selbst)
instrument: laute, harfe, mandoline, fidel, drehleier, schalmei, dudelsack, glocken, illusion (Zauberklang), hackbrett, cembalo,
akkordeon, sitar, handpan, psalter, zither, balafon
band.trommel: trommel, pauke, bodhran, tamburin, stoecke, taiko, marsch, bongos, conga, darbuka
band.floete: floete, panfloete, okarina, gesang, horn, klarinette, oboe, blockfloete, piccolo, pfeife, shakuhachi, englischhorn, oohchor, bratsche
band.ketten: ketten, klatschen, schnipsen, rassel, stampfen, loeffel, krug, rahmentrommel, kriegstrommel, schellen, triangel, schlitztrommel, windspiel
Wenn du `band` angibst, gib alle drei an.

## Wie es gut klingt (bitte ernst nehmen)

- **Ohrwurm-Bauplan:** ein kurzes, rhythmisch markantes Motiv (2–4 Töne) – wiederholen, versetzt wiederholen (Sequenz), beantworten.
  Refrain-Takt 1 und 3 beginnen gleich, Takt 2 und 4 antworten unterschiedlich (Takt 4 schließt). Wie ein Volkslied oder ein Spiele-Thema.
- **Betonte Schritte auf Akkordtöne** (Stufe c, c+2, c+4 des Akkords), dazwischen schrittweise Bewegung, ab und zu ein Sprung
  (Quarte/Quinte) als Höhepunkt, danach schrittweise zurück. Durchgangs- und Wechseltöne auf unbetonten Schritten.
- **Kontrast:** Strophe ruhiger/tiefer, Refrain höher, breitere Notenwerte oder dichter – je nach Stimmung. Brücke: andere Akkorde
  (z. B. 5, 3, 1 statt 0/4), gern lange Töne in der Melodie und eine bewegte eigene Zweitstimme.
- **Kadenzen:** Phrasen enden auf Akkordtönen; der Schluss geht meist über 3 oder 4 (bzw. 6 in aeolisch/dorisch) zurück auf 0 und endet auf 0/7/e.
- **Rhythmus mit Charakter:** punktierte Figuren (`7..9`), Synkopen (`.7.7..9.`), Auftakte am Taktende, Pausen zum Atmen.
  Nicht jeder Takt gleich dicht.
- **Abwechslung innerhalb einer Stimmung:** verschiedene Modi (aus der Liste der Stimmung), verschiedene Tempi (±8 BPM um das
  Stimmungstempo), Schlag- und Bassvorlagen variieren, mal 12er, mal 16er (wo die Stimmung beides verträgt), unterschiedliche
  Akkordfolgen (nicht immer 0-4-0-4!), unterschiedliche Tonlagen und Formen der Melodie. Jedes Stück soll eine eigene Idee haben.
  Gib in einem Kommentar über jedem Stück in einem Satz die Idee an (z. B. `// Seemannsruf: Quarte hinauf, Antwort im Echo`).
- **Düster** (grusel, unterreich, ruinen, boss, verfolgung, spannung, letztesgefecht, kriegstrommeln, teils klage):
  phrygisch/aeolisch, der Halbton über dem Grundton (phrygisch Stufe 1), der verminderte Akkord (aeolisch 1, phrygisch 4),
  Tritonus-Reibungen, betonte Nicht-Akkordtöne, die sich auflösen, chromatisch wirkende Linien durch Moduswechsel – aber
  immer mit einer erkennbaren Melodie, die man nachsummen kann.
- Keine kopierten Melodien bekannter Stücke – alles eigene Erfindung (Anklänge an Genre-Typisches sind ok).

## Menge
**Mindestens 8 Stücke je Stimmung** deiner Gruppe (gern mehr, wenn dir gute Ideen kommen). Qualität vor Masse – lieber 8 richtig
gute als 12 beliebige.

## Die Stimmungen

| Schlüssel | Bedeutung | Modi | Tempo | Takt |
|---|---|---|---|---|
| trinklied | Fröhliches Saufen in der Taverne, Mitgröl-Refrain | mixolydisch, ionisch | 108–118 | Jig (12) oder 16 |
| dorffest | Tanz auf dem Dorfplatz, ausgelassen | mixolydisch, ionisch | 120–130 | 16 (auch Jig) |
| marktplatz | Bunter Markt, Händler, orientalischer Einschlag | dorisch, (phrygisch für Würze) | 100–110 | 16 |
| shanty | Seemannslied, Wellen, Hauruck | dorisch, aeolisch | 92–100 | Jig (12) oder 16 |
| auenland | Friedliches Dorf, grüne Hügel, Hobbit-Gefühl | ionisch, mixolydisch | 104–112 | Jig (12) oder 16 |
| sieg | Triumph nach dem Kampf, Fanfare, Jubel | ionisch, mixolydisch | 112–124 | 16 |
| heldenlied | Hymne auf die Helden, erhaben | ionisch, mixolydisch | 80–92 | 16 |
| hof | Königshof, höfischer Tanz, Pracht | ionisch, (lydisch) | 80–90 | Walzer (12) oder 16 |
| reiter | Ritt über die Ebene, Galopp | aeolisch, dorisch | 116–126 | 16 |
| reise | Aufbruch, Wanderschaft, Weite | dorisch, mixolydisch | 96–104 | 16 |
| rast | Lager am Abend, Feuer, Gemütlichkeit | mixolydisch, ionisch | 72–80 | Walzer (12) oder 16 |
| kamin | Kaminfeuer, Geschichten, warm und leicht wehmütig | aeolisch, dorisch | 68–76 | Walzer (12) oder 16 |
| pilger | Pilgerweg, Kloster, andächtig | dorisch, aeolisch | 60–68 | 16 |
| zwerge | Zwergenhallen, Schmiede, tiefe stolze Gesänge | aeolisch, dorisch | 70–80 | 16 |
| heimweh (neu) | Wanderer im Regen, Sehnsucht nach Zuhause – traurig, aber warm | aeolisch, dorisch | 64–74 | 16 oder Walzer |
| kampf | Kampf! Schnell, treibend, heroisch | aeolisch, (dorisch) | 146–158 | 16 |
| boss | Endgegner, bedrohlich, wuchtig | phrygisch, aeolisch | 148–160 | 16 |
| verfolgung | Flucht, gehetzt, Angst | phrygisch, aeolisch | 150–162 | 16 |
| spannung | Lauern, Schleichen, gleich passiert etwas | aeolisch, phrygisch | 86–96 | 16 |
| letztesgefecht (neu) | Aussichtsloser letzter Kampf, tragisch-heldenhaft | aeolisch, phrygisch, dorisch | 120–134 | 16 |
| kriegstrommeln (neu) | Ein Heer marschiert, rau, wild, Trommeln | phrygisch, aeolisch | 128–140 | 16 |
| klage | Trauer, Abschied, ein Verlust | aeolisch, dorisch | 54–62 | 16 |
| grusel | Spukhaus, Geister, Gänsehaut | phrygisch, aeolisch | 54–62 | 16 |
| unterreich | Unterirdische Dunkelheit, fremd, bedrohlich | phrygisch | 56–64 | 16 |
| ruinen | Alte Ruinen, vergessene Größe, geheimnisvoll-melancholisch | dorisch, aeolisch | 62–70 | 16 |
| elben | Elfische Pracht, uralte Wälder, schwebend | lydisch, ionisch | 60–68 | Walzer (12) oder 16 |
| fey | Feenwald, Irrlichter, verspielt-magisch | lydisch, ionisch | 108–118 | 16 oder Jig |
| gaukler (neu) | Gauklerzelt, Zauberkunststücke, staunend-verspielt | lydisch, mixolydisch, ionisch | 112–124 | 16 oder Jig |
| sternenhimmel (neu) | Nacht unter Sternen, altes Geheimnis, weit und schwebend | lydisch, ionisch, dorisch | 58–66 | Walzer (12) oder 16 |
