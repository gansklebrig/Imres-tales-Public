/* Ezekiel – The Destroyer · Kampfausgleich
   Gegner sind tödlich – also muss Ezekiel es auch sein: Die meisten Gegner fallen nach 2–3 Nahkampftreffern.
   Fernkampf bleibt etwas schwächer, damit Abstand nicht alles löst.
   Je tiefer man in die Feste vordringt, desto schwerer lassen sich Angriffe abwehren:
   Das Paradefenster schrumpft und durch den Block dringt mehr Schaden. */
(function () {
  "use strict";
  const Z = window.Z;
  /* + Ausgleich für die Waffenstufen (+0 … +5, je +15 %): in der Tiefe erwartet man +2 … +4 – Gegner bleiben bei 2–3 Treffern */
  /* W6-Balancing (Bot-Messung, viele Läufe): Normalgegner fielen ab Stufe 1 schon nach 1–2 Treffern, weil zu Waffenstufe
     und Fundstufe noch Rollen (+12 % je Punkt), Segen, Gravuren und Familienboni kommen. Faktor (1 + 0,12·t) gleicht das aus
     (Torhof unverändert, Stufe 3 ×1,36, Stufe 6 ×1,72) → wieder 2–3 Treffer mit passend aufgewerteter Waffe.
     vorher: (1 + 0,55t)(1 + 0,07t) */
  Z.BAL.enemyHp = t => (1 + 0.55 * t) * (1 + 0.07 * t) * (1 + 0.12 * t);
  /* Bosse und Wächter: lagen bei 10–30 s (Bot, Standardausrüstung) – Ziel 60–120 s für Spieler. ×2,0 zusätzlich zur Kurve.
     Mini-Bosse: 2–6 s → ×3,5 (nemesis.js, MB.spawn) */
  /* Feinabgleich je Boss nach Prüfstand (kampf.py, Standardausrüstung, Bot-Zeit nach ×2,0): Ziel Bot 40–90 s (Spieler länger).
     Themberchaud (fliegt, lange Phasen) lag schon bei 120–137 s, Riese/Ilvara/Chasme bei 20–35 s. In echten Läufen (schwächere Ausrüstung) Riese/Chasme dann zu zäh → 1,3/1,2. */
  const BOSS_F = { riese: 1.3, ilvaraW: 1.6, chasme: 1.2, demogorgon: 1.3, venomfang: 1.2, themberchaud: 0.75, bugbear: 1.8 /* Kontrollläufe: Wachturm noch 20 s */ };
  /* W9 (Spielermeldung „zäh, aber zu leicht“): Grundfaktor 2,0 → 1,75. Dafür mehr Gefahr statt mehr Leben: Angriffsfenster
     (1,5-facher Schaden), Kombos, Wut unter 20 %, Anti-Cheese, Lebensraub-Deckel und Signatur-Techniken (bossphasen.js, Abschnitt 6).
     Prüfstand /home/claude/test/w9_boss (kampf.py, Stil „stark“ = Speer +5): vorher Stufe-3-Bosse 22–48 s, Wächter 13–90 s. */
  /* Totenköpfe machen Bosse nicht mehr voll zum Schwamm: nur die Wurzel des Totenkopf-Lebensfaktors (3 Köpfe ×1,32 statt ×1,75) –
     die Härte kommt über Schaden und Tempo (Demogorgon mit 3 Köpfen: Bot 443 s / 11 Tode → Ziel unter ~200 s) */
  const skullComp = () => { const s = (Z.run && Z.run.skulls) || 0, f = s > 0 && Z.BAL.skullHp ? Z.BAL.skullHp(s) : 1; return f > 1 ? 1 / Math.sqrt(f) : 1; };
  Z.BAL.bossHp = (t, id) => 1.75 * (BOSS_F[id] || 1) * skullComp();
  const MUL = { melee: 1.4, dive: 1.4, parry: 1.2, ranged: 0.92, skill: 1.1 };
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    if (o && !o.dot && !o.fx && MUL[o.src]) dmg *= MUL[o.src];
    else if (o && !o.src && !o.dot && !o.fx) dmg *= 1.25;
    return hit0.call(this, e, dmg, o);
  };
  if (Z.WEAPONS.bogen) Z.WEAPONS.bogen.shoot.dmgFull = 27;
  /* ---------- W6-Waffenausgleich (Puppe, Stufe 3, +0; Bot-Läufe) ----------
     Ausreißer nach oben: Waffen, die ihren Krit-Zustand selbst herstellen (Hammer/Morgenstern betäuben, Chasme-Stachel
     vergiftet) kritten praktisch immer. Ausreißer nach unten: Zweihänder, Mönchsstab, Anker, Steinfäuste.
     Werte vorher → nachher stehen je Zeile; DPS-Tabelle in /home/claude/test/w6_bal (waffen.py). */
  const WTUNE = (id, f) => { const d = Z.WEAPONS[id]; if (d) f(d); };
  WTUNE("kriegshammer", d => { d.critMul = 1.6; });                        /* Krit ×2,2 → ×1,6 (DPS 460 → ~340) */
  WTUNE("flegel", d => { d.critMul = 1.45; d.combo.forEach((c, i) => { c.dmg = [25, 35][i]; }); }); /* Krit ×1,8 → ×1,45, Schaden 30/42 → 25/35 (DPS 424 → ~340; Bodenwelle trifft oft mehrfach) */
  WTUNE("demonenklaue", d => { d.critMul = 1.5; });                        /* Krit ×2 → ×1,5 (DPS 483 → ~370; dazu Lebensraub) */
  WTUNE("kettenpeitsche", d => { d.critMul = 1.8; });                      /* Spitzen-Krit ×2,2 → ×1,8 (DPS 364 → ~300; Reichweite bleibt ihr Vorteil) */
  WTUNE("zweihaender", d => d.combo.forEach((c, i) => { c.dmg = [32, 32, 54][i]; }));      /* 26/26/44 → 32/32/54 */
  WTUNE("kampfstab", d => d.combo.forEach((c, i) => { c.dmg = [12, 12, 13, 13, 24][i]; })); /* 8/8/9/9/16 → 12/12/13/13/24 */
  WTUNE("anker", d => d.combo.forEach((c, i) => { c.dmg = [38, 34][i]; }));                 /* 30/26 → 38/34 */
  WTUNE("steinfaust", d => d.combo.forEach((c, i) => { c.dmg = [17, 17, 28][i]; }));        /* 13/13/22 → 17/17/28 */
  /* W9: Lebensraub wirkt gegen Bosse und Mini-Bosse gedrosselt (halbe Wirkung, höchstens ~1,2 % Leben/s; bossphasen.js Abschnitt 6) – in den Beschreibungen vermerken */
  const LSN = [" (gegen Bosse gedrosselt)", " (dampened against bosses)"];
  const addNote = d => { if (d && Array.isArray(d) && !String(d[0]).includes("Bosse")) { d[0] += LSN[0]; d[1] += LSN[1]; } };
  if (Z.BLESS && Z.BLESS.vampir) addNote(Z.BLESS.vampir.d);
  if (Z.AFFIX && Z.AFFIX.vampirisch) addNote(Z.AFFIX.vampirisch.d);
  if (Z.RUNES && Z.RUNES.raub) addNote(Z.RUNES.raub.d);
  /* Tiefe: 0 im Torhof, steigt mit jeder Gebietsstufe */
  const depth = () => (Z.run ? (Z.run.tier || 0) + (Z.run.skulls || 0) * 0.5 : 0);
  Z.parryScale = () => 1 / (1 + 0.14 * depth());
  Z.blockLeak = () => Math.min(0.35, 0.07 * depth());
  Z.ENEMY_GRAV = 1850;
})();
