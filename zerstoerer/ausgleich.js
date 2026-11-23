/* Ezekiel – The Destroyer · Kampfausgleich
   Gegner sind tödlich – also muss Ezekiel es auch sein: Die meisten Gegner fallen nach 2–3 Nahkampftreffern.
   Fernkampf bleibt etwas schwächer, damit Abstand nicht alles löst.
   Je tiefer man in die Feste vordringt, desto schwerer lassen sich Angriffe abwehren:
   Das Paradefenster schrumpft und durch den Block dringt mehr Schaden. */
(function () {
  "use strict";
  const Z = window.Z;
  /* + Ausgleich für die Waffenstufen (+0 … +5, je +15 %): in der Tiefe erwartet man +2 … +4 – Gegner bleiben bei 2–3 Treffern */
  Z.BAL.enemyHp = t => (1 + 0.55 * t) * (1 + 0.07 * t);
  const MUL = { melee: 1.4, dive: 1.4, parry: 1.2, ranged: 0.92, skill: 1.1 };
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    if (o && !o.dot && !o.fx && MUL[o.src]) dmg *= MUL[o.src];
    else if (o && !o.src && !o.dot && !o.fx) dmg *= 1.25;
    return hit0.call(this, e, dmg, o);
  };
  if (Z.WEAPONS.bogen) Z.WEAPONS.bogen.shoot.dmgFull = 27;
  /* Tiefe: 0 im Torhof, steigt mit jeder Gebietsstufe */
  const depth = () => (Z.run ? (Z.run.tier || 0) + (Z.run.skulls || 0) * 0.5 : 0);
  Z.parryScale = () => 1 / (1 + 0.14 * depth());
  Z.blockLeak = () => Math.min(0.35, 0.07 * depth());
  Z.ENEMY_GRAV = 1850;
})();
