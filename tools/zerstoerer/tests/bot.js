/* Einfacher Spiel-Bot für die Browser-Tests (kein Teil des Spiels): läuft zum Ausgang, kämpft mit dem nächsten Gegner,
   weicht vorgewarnten Angriffen aus und trinkt bei wenig Leben. botRun(schritte, unverwundbar) → kurzer Zustand. */
window.botRun = function (steps, god) {
  var Z = __z.Z, inp = Z.input, P = function () { return Z.player; };
  if (god) __z.god(true);
  var rollCd = 0, jumpCd = 0;
  var set = function (a, v) { inp.setTouch(a, v); };
  for (var i = 0; i < steps; i++) {
    var p = P(); if (!p) break;
    var tgt = null, bd = 1e9;
    for (var k = 0; k < Z.enemies.length; k++) { var e = Z.enemies[k]; if (e.dead || e.dummy) continue; var d = Math.hypot(e.x - p.x, (e.y - p.y) * 2); if (d < bd) { bd = d; tgt = e; } }
    ['left', 'right', 'jump', 'a1', 'a2', 'roll', 's1', 's2', 'up', 'down', 'use', 'potion'].forEach(function (a) { set(a, false); });
    if (Z.ui.modalOpen) { var b = document.querySelector('#modal button'); if (b) b.click(); }
    if (Z.ui.choiceActive) { var c = document.querySelector('#choice [data-slot="a2"],#choice [data-slot="s2"]'); if (c) c.click(); }
    if (tgt && bd < 400) {
      var dx = tgt.x + tgt.w / 2 - (p.x + p.w / 2), dy = tgt.y - p.y;
      if (Math.abs(dx) > 18) set(dx > 0 ? 'right' : 'left', true);
      if (Math.abs(dx) < 40 && Math.abs(dy) < 30) set((i % 14 < 7) ? 'a1' : 'a2', true);
      if (dy < -40 && jumpCd <= 0) { set('jump', true); jumpCd = 30; }
      if (tgt.act && tgt.act.phase === 'pre' && rollCd <= 0 && Math.abs(dx) < 60) { set('roll', true); rollCd = 40; }
      if (i % 180 === 0) set('s1', true);
      if (i % 240 === 0) set('s2', true);
    } else {
      var ex = Z.level.doors.find(function (d) { return d.kind === 'exit'; }); var dx2 = ex ? ex.x * 16 - p.x : 1;
      set(dx2 > 0 ? 'right' : 'left', true);
      if ((p.hitWall || p.vx === 0) && jumpCd <= 0) { set('jump', true); jumpCd = 20; }
      if (i % 90 < 3) set('up', true);
    }
    if (p.hp < p.hpMax * 0.35) set('potion', true);
    rollCd--; jumpCd--;
    __z.step(1); inp.endFrame();
  }
  var q = P();
  return { hp: q.hp, hpMax: q.hpMax, dead: q.dead, kills: Z.stats.kills, enemies: Z.enemies.filter(function (e) { return !e.dead; }).length, x: q.x | 0, y: q.y | 0, boss: Z.boss ? (Z.boss.hp | 0) + '/' + (Z.boss.hpMax | 0) : null };
};
