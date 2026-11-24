/* Ezekiel – The Destroyer · Hinterhalte
   Manche Räume sind Fallen ganz anderer Art: Kaum ist Ezekiel mittendrin, schließen sich
   Runenbarrieren vor allen Ausgängen, und Gegner treten in Wellen aus den Schatten.
   Erst wenn alle besiegt sind, öffnen sich die Barrieren – und eine Truhe erscheint. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH, L = v => Z.L(v), A = Z.audio, FX = Z.fx;
  let amb = null;
  function setup(lv) {
    amb = null;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells || !Z.run) return;
    const R = Z.Rng(((lv.seed || 3) * 40503 + 17) >>> 0);
    if (R() > 0.45 + 0.05 * (Z.run.tier || 0)) return;
    const cells = Object.keys(lv.cells).map(k => lv.cells[k]).filter(c => c !== lv.startCell && c !== lv.endCell && c.kind !== "secret" && !(lv.doors || []).some(d => d.kind === "exit" && Math.floor(d.x / CW) === c.x && Math.floor(d.y / CH) === c.y));
    R.shuffle(cells);
    for (const c of cells) {
      const ox = c.x * CW, oy = c.y * CH, spots = [];
      /* nur Plätze, die der Spieler auch erreichen kann (sonst stünden Gegner unerreichbar in Nischen) */
      for (let y = oy + 2; y < oy + CH - 1; y++) for (let x = ox + 3; x < ox + CW - 3; x++) if (Z.standable(lv, x, y, 2) && (!lv.reach || lv.reach[y * lv.W + x])) spots.push([x, y]);
      if (spots.length < 14) continue;
      const pool = [...new Set(Z.enemies.filter(e => !e.dead && e.def && !e.def.boss && !e.thief && Z.ENEMIES[e.id]).map(e => e.id))];
      amb = { c, ox, oy, spots, pool: pool.length ? pool : ["goblin"], state: "wait", wave: 0, waves: 2 + (Z.run.tier >= 3 ? 1 : 0), sealed: [], t: 0, mine: [] };
      return;
    }
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { if (amb && amb.state === "fight") unseal(true); const r = load0.apply(this, arguments); try { if (Z.formSquads) Z.formSquads(Z.level); /* W10: Trupps mit Rollen */ } catch (e) { console.error(e); } try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  const solid = v => v === 1 || v === 7 || v === 12;
  function seal() {
    const lv = Z.level, P = Z.player, { ox, oy } = amb;
    const border = [];
    for (let y = oy; y < oy + CH; y++) { border.push([ox, y]); border.push([ox + CW - 1, y]); }
    for (let x = ox + 1; x < ox + CW - 1; x++) { border.push([x, oy]); border.push([x, oy + CH - 1]); }
    const ptx = Math.floor((P.x + P.w / 2) / T), pty = Math.floor((P.y + P.h / 2) / T);
    for (const [x, y] of border) { const v = lv.get(x, y); if (solid(v) || v === 9) continue; if (Math.abs(x - ptx) < 3 && Math.abs(y - pty) < 3) return false; }
    for (const [x, y] of border) { const v = lv.get(x, y); if (solid(v) || v === 9) continue; amb.sealed.push([x, y, v]); lv.set(x, y, 1); }
    Z.dirtyTiles && Z.dirtyTiles();
    return true;
  }
  function unseal(silent) {
    const lv = Z.level; if (!amb) return;
    for (const [x, y, v] of amb.sealed) lv.set(x, y, v);
    if (amb.sealed.length && !silent) { A.play("door", { vol: 0.7 }); for (const [x, y] of amb.sealed) FX.burst(x * T + 8, y * T + 8, 3, { col: ["#ff4a3a", "#ffb060"], sp: 60, life: 0.5, size: 2, kind: "spark", add: true }); }
    amb.sealed = []; Z.dirtyTiles && Z.dirtyTiles();
  }
  /* Spielzeit-Planer (pausiert mit dem Spiel, wird beim Gebietswechsel geleert) */
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : window.setTimeout(fn, ms));
  function spawnWave() {
    if (!amb || amb.state !== "fight" || !Z.run || amb.wave >= amb.waves) return;
    amb.pending = false;
    const P = Z.player, lv = Z.level, tier = Z.run.tier || 0;
    const n = 3 + Math.min(4, tier) + amb.wave;
    const far = amb.spots.filter(([x, y]) => Math.abs(x * T - P.x) > 70);
    for (let i = 0; i < n; i++) {
      const [x, y] = Z.R.pick(far.length ? far : amb.spots);
      const id = Z.R.pick(amb.pool);
      later(() => {
        if (!amb || amb.state !== "fight" || Z.level !== lv) return;
        const e = Z.spawnEnemy(id, x * T + 8, (y + 1) * T, { elite: amb.wave === amb.waves - 1 && i === 0 && tier >= 1 });
        if (!e) return; e.aware = true; e.ambush = true; amb.mine.push(e);
        FX.burst(x * T + 8, (y + 1) * T - 10, 18, { col: ["#1a1018", "#3a2040", "#6a2a4a"], sp: 70, life: 0.7, size: 4, kind: "smoke", g: -20 });
        FX.ring(x * T + 8, (y + 1) * T - 2, 16, "#c03a5a", 0.4, 2);
      }, i * 260);
    }
    amb.wave++;
  }
  const tick0 = Z.ebenenTick;
  const takt = Z.bildTakt ? Z.bildTakt() : (d => d);
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    /* Buchhaltung des Hinterhalts (Auslösen, Wellen, Siegel): auf Handheld einmal pro Bild mit aufgesparter Zeit */
    dt = takt(dt); if (!dt) return;
    const P = Z.player; if (!amb || !P || P.dead) return;
    const { ox, oy } = amb;
    const inside = P.x > (ox + 3) * T && P.x < (ox + CW - 3) * T && P.y > (oy + 1) * T && P.y < (oy + CH - 1) * T;
    if (amb.state === "wait" && inside && P.onGround) {
      if (!seal()) return;
      amb.state = "fight"; amb.t = 0;
      A.play("gong", { vol: 0.7 }); A.play("roar", { vol: 0.35 }); FX.flashScreen("#6a1020", 0.35); FX.addShake(5);
      Z.toast && Z.toast("<b>" + L(["Hinterhalt!", "Ambush!"]) + "</b><br><small>" + L(["Die Ausgänge sind versiegelt. Überlebe.", "The exits are sealed. Survive."]) + "</small>", 2600);
      Z.music && Z.music.set && Z.music.set("boss1");
      const me = amb; later(() => { if (amb === me) spawnWave(); }, 600);
    } else if (amb.state === "fight") {
      amb.t += dt;
      /* Gegner, die aus dem Raum gefallen oder verschwunden sind, zählen nach kurzer Zeit nicht mehr (sonst bliebe das Siegel hängen) */
      const inRoom = e => e.x + e.w > ox * T && e.x < (ox + CW) * T && e.y + e.h > oy * T - T && e.y < (oy + CH) * T;
      for (const e of amb.mine) { if (!e.dead && !inRoom(e)) e._ambOut = (e._ambOut || 0) + dt; else e._ambOut = 0; }
      let alive = amb.mine.filter(e => !e.dead && Z.enemies.includes(e) && !(e._ambOut > 4));
      for (const e of alive) e.aware = true;
      /* Fortschritt: solange Gegner fallen, läuft der Kampf; stehen Restgegner >15 s untätig/unerreichbar herum, öffnet sich der Raum */
      if (amb.nAlive !== alive.length) { amb.nAlive = alive.length; amb.prog = amb.t; }
      if (alive.length && amb.wave >= amb.waves && amb.t - (amb.prog || 0) > 15) alive = [];
      if (!alive.length && amb.t > 3.2) {
        if (amb.wave < amb.waves && !amb.pending) { amb.pending = true; amb.t = 0; amb.mine = []; FX.text(P.x + P.w / 2, P.y - 20, L(["Noch mehr!", "More!"]), "#ff6a5a", true); A.play("horn", { vol: 0.4 }); const me = amb; later(() => { if (amb === me) spawnWave(); }, 700); }
        else { amb.state = "done"; unseal(); A.play("holy", { vol: 0.6 }); FX.flashScreen("#ffe0a0", 0.25);
          const cx = (ox + CW / 2) * T; const sp = amb.spots.slice().sort((a, b) => Math.abs(a[0] * T - cx) - Math.abs(b[0] * T - cx))[0];
          if (sp) { Z.spawnPickup("chest", sp[0] * T + 8, (sp[1] + 1) * T, { vx: 0, vy: 0 }); FX.burst(sp[0] * T + 8, (sp[1] + 1) * T - 8, 30, { col: ["#ffd27a", "#fff0c0"], sp: 120, up: 60, life: 0.8, size: 2, kind: "spark", add: true }); }
          Z.toast && Z.toast("<b>" + L(["Hinterhalt überstanden", "Ambush survived"]) + "</b>", 2000);
          Z.music && Z.music.set && Z.music.set(Z.level.biome);
          if (Z.stats) Z.stats.ambushes = (Z.stats.ambushes || 0) + 1;
        }
      }
      if (amb.t > 60 && amb.state === "fight") { amb.state = "done"; unseal(); Z.music && Z.music.set && Z.music.set(Z.level.biome); }
    }
  };
  /* Runenbarrieren zeichnen */
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    if (!amb || !amb.sealed.length) return;
    c.save(); c.globalCompositeOperation = "lighter";
    for (const [x, y] of amb.sealed) {
      const px = x * T, py = y * T, f = 0.6 + 0.4 * Math.sin(t * 6 + x + y);
      c.fillStyle = "rgba(200,30,60," + 0.35 * f + ")"; c.fillRect(px, py, T, T);
      c.strokeStyle = "rgba(255,120,100," + 0.8 * f + ")"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 4, py + 3); c.lineTo(px + 8, py + 13); c.lineTo(px + 12, py + 3); c.moveTo(px + 5, py + 8); c.lineTo(px + 11, py + 8); c.stroke();
      if (Math.random() < 0.04) FX.p({ x: px + Math.random() * T, y: py + Math.random() * T, vx: 0, vy: -20, life: 0.6, size: 1.5, col: "#ff6a5a", kind: "glow", add: true });
    }
    c.restore();
  };
  Z.ambush = () => amb;
})();
