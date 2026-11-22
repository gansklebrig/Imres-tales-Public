/* Ezekiel – The Destroyer · Verfluchte Gegenstände
   Wahnsinnig starke Waffen und Fähigkeiten mit einem Preis: Bis du die geforderte Zahl an Gegnern erschlagen hast,
   tötet dich jeder einzelne Treffer. Je stärker der Fluch, desto mehr Kills: 10, 20 oder 50.
   Ist der Fluch gebrochen, bleibt die Waffe so stark. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, L = v => Z.L(v);
  const { glow } = Z.draw;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const CURSE = [
    null,
    { n: 10, mul: 1.9, name: ["Verflucht", "Cursed"], extra: [] },
    { n: 20, mul: 2.7, name: ["Schwer verflucht", "Gravely cursed"], extra: ["vampirisch"] },
    { n: 50, mul: 4.0, name: ["Verdammt", "Damned"], extra: ["vampirisch", "kritisch", "flink"] }
  ];
  Z.CURSE = CURSE;

  /* Herstellen: aus jedem Fund kann ein verfluchter werden */
  Z.curseItem = function (it, lvl) {
    if (!it) return it;
    it.cursed = lvl; it.curseN = CURSE[lvl].n; it.rar = Math.max(it.rar, Math.min(3, lvl));
    const isSkill = it.type === "skill";
    for (const a of CURSE[lvl].extra) if (!it.aff.includes(a) && (!isSkill || Z.AFFIX_SKILL.includes(a))) it.aff.push(a);
    return it;
  };
  function pickLevel(tier, boost) { const r = Math.random() - (tier || 0) * 0.05 - (boost || 0); return r < 0.12 ? 3 : r < 0.42 ? 2 : 1; }
  const roll0 = Z.rollItem;
  Z.rollItem = function (o) {
    const it = roll0.apply(this, arguments); if (!it) return it;
    o = o || {};
    const tier = Z.run ? Z.run.tier : 0;
    let ch = o.cursedChest ? 1 : o.chest ? 0.1 : o.rar && o.rar[0] === 0 ? 0.08 : 0.045;
    if (Z.hasPact && Z.run && Z.run.pacts && Z.run.pacts.length) ch *= 1 + 0.2 * Z.run.pacts.length;
    if (Math.random() < ch) Z.curseItem(it, pickLevel(tier, o.cursedChest ? 0.15 : 0));
    return it;
  };
  /* Verfluchte Truhen geben immer etwas Verfluchtes */
  const drop0 = Z.dropItem;
  Z.dropItem = function (x, y, o) { return drop0.apply(this, arguments); };
  const mul0 = Z.itemMul;
  Z.itemMul = it => mul0(it) * (it && it.cursed ? CURSE[it.cursed].mul : 1);

  /* Anlegen = Fluch annehmen */
  let warned = new WeakSet();
  Z.fluchTick = function () {
    const P = Z.player; if (!P || P.dead) return;
    for (const s of ["a1", "a2", "s1", "s2"]) {
      const it = P.slots[s]; if (!it || !it.cursed || it.curseApplied) continue;
      it.curseApplied = true; P.curse = (P.curse || 0) + it.curseN;
      FX.flashScreen("#a020ff", 0.45); A.play("dark", { vol: 0.7 }); FX.addShake(5);
      FX.burst(P.x + P.w / 2, P.y + 12, 30, { col: ["#c040ff", "#3a1040", "#ff60c0"], sp: 120, up: 30, life: 0.9, size: 2.6, kind: "smoke" });
      FX.text(P.x + P.w / 2, P.y - 16, L(CURSE[it.cursed].name) + "!", "#c040ff", true);
      Z.toast && Z.toast("☠ <b>" + L(["Der Fluch greift: ", "The curse takes hold: "]) + P.curse + L([" Kills ohne einen einzigen Treffer", " kills without a single hit"]) + "</b><br><small>" + L(["Jeder Treffer bis dahin ist tödlich. Danach bleibt die Waffe so stark.", "Any hit until then is fatal. Afterwards the weapon stays this strong."]) + "</small>", 4800);
    }
    /* Herzschlag-Warnung, solange der Fluch wirkt */
    if (P.curse > 0) { P._ct = (P._ct || 0) - 1 / 120; if (P._ct <= 0) { P._ct = 1.2; Z.input.rumble && Z.input.rumble(0.08, 30); } if (Math.random() < 0.08) FX.p({ x: P.x + Math.random() * P.w, y: P.y + Math.random() * P.h, vx: 0, vy: -20, life: 0.7, size: 2, col: "#c040ff", kind: "glow", add: true }); }
  };
  /* Kartentext */
  Z.curseCardHTML = function (it) {
    if (!it || !it.cursed) return "";
    const c = CURSE[it.cursed], done = it.curseApplied && Z.player && Z.player.curse <= 0;
    return '<div class="ic-fluch">☠ <b>' + esc(L(c.name)) + "</b> · " + (done ? L(["Fluch gebrochen – volle Kraft", "Curse broken – full power"]) : L(["Schaden ×", "Damage ×"]) + c.mul.toFixed(1) + " · " + L(["bis ", "until "]) + c.n + L([" Kills tötet dich jeder Treffer", " kills, any hit kills you"])) + "</div>";
  };
  /* Verfluchte Funde leuchten violett */
  const draw0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (draw0) draw0(c, t);
    for (const p of Z.pickups) if (p.kind === "item" && p.it && p.it.cursed) {
      c.save(); c.globalCompositeOperation = "lighter"; glow(c, p.x, p.y - 8, 14 + p.it.cursed * 4 + Math.sin(t * 5) * 2, "rgba(170,40,255,.5)"); c.restore();
      if (Math.random() < 0.15) FX.p({ x: p.x + (Math.random() - 0.5) * 10, y: p.y - 6, vx: 0, vy: -24, life: 0.8, size: 1.8, col: "#c040ff", kind: "glow", add: true });
    }
  };
})();
