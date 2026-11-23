/* Ezekiel – The Destroyer · Erkundung
   Die Karten sind 2–3× so groß wie früher, der Hauptweg zum Ausgang aber nur etwa 1,5× so lang. Was abseits liegt,
   plant welt.js (lv.rewards, lv.feats, lv.gates, lv.secretsList); hier wird es lebendig:
   - Fundstücke am Ende der Nebenzweige (Gold, Schmiedeglut, Schriftrollen, Waffen, Heilung, Segen) – je tiefer, desto
     besser. Sie öffnen sich bei Berührung und geben ihren Inhalt über Z.spawnReward (schmiede.js) frei.
   - Verschlossene Schatzkammer: der Schlüssel liegt in einem anderen Zweig.
   - Prüfungskammer: am Altar beginnen, Ausgänge schließen sich, Wellen besiegen → Belohnung.
   - Schreine (Segen bzw. Heilquelle), Elite-Wächter vor dem besten Schatz.
   - Abkürzungen: Gittertore/Falltüren, die sich nur per Hebel von der Zweigseite öffnen.
   - Orientierung: Laternen an den Zweigmündungen (heller = lohnender), Wegweiser-Pfeil zum nächsten Ausgang am
     Bildrand, Ausgänge von Anfang an auf der Minikarte, „Geheimnisse x/y“ beim Finden und vor dem Ausgang.
   Farben: Gold, Glut, Rot, Violett, Grün – kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, CW = Z.CW, CH = Z.CH, FX = Z.fx, A = Z.audio, L = v => Z.L(v);
  const TAU = Math.PI * 2;
  const ui = () => Z.ui || {};
  const toast = (h, ms) => { if (Z.toast) Z.toast(h, ms); };
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : window.setTimeout(fn, ms));
  let S = null; /* Zustand des aktuellen Gebiets */

  /* ======================= Belohnung ausschütten ======================= */
  const tierNow = () => (Z.run ? Z.run.tier || 0 : 0);
  function give(kind, x, y, q) {
    /* q: Güte 0 … 3 (Tiefe des Zweigs) */
    q = q || 0;
    const t = tierNow(), R = Z.R;
    if (Z.spawnReward) {
      switch (kind) {
        case "gold": return Z.spawnReward("gold", x, y, { n: 26 + q * 22 });
        case "glut": return Z.spawnReward("glut", x, y, { n: q >= 3 ? 2 : 1 });
        case "waffe": return Z.spawnReward("waffe", x, y, { drop: true, rar: q >= 3 ? [8, 40, 40, 12] : q >= 2 ? [20, 45, 28, 7] : [35, 45, 16, 4], plus: q >= 3 && R() < 0.5 ? 1 : 0 });
        case "rolle": return Z.spawnReward("rolle", x, y, { drop: true });
        case "heil": return Z.spawnReward("heil", x, y, { drop: true, big: q >= 1 });
        case "segen": return Z.spawnReward("segen", x, y - 4, {});
        case "schluessel": return Z.spawnReward("schluessel", x, y, {});
      }
    }
    /* Rückfall ohne schmiede.js */
    switch (kind) {
      case "gold": Z.dropGold(x, y - 6, (26 + q * 22) * (Z.BAL ? Z.BAL.goldMul(t) : 1)); return null;
      case "glut": Z.dropShards && Z.dropShards(x, y - 6, 4 + q * 3); return null;
      case "waffe": { const it = Z.rollItem && Z.rollItem({ R: Z.Rng((Math.random() * 1e9) >>> 0), kind: "weapon", rar: q >= 2 ? [20, 45, 28, 7] : [35, 45, 16, 4] }); return it ? Z.spawnPickup("item", x, y, { it, drop: true, vy: -180, vx: 0 }) : null; }
      case "rolle": return Z.spawnPickup("scroll", x, y, { vx: 0, vy: -160, stat: R.pick(["brut", "takt", "ueber"]) });
      case "heil": case "segen": { const P = Z.player; if (P) { Z.healPlayer(P.hpMax * (kind === "segen" ? 0.5 : 0.35)); P.potions = Math.min(P.potMax || 2, (P.potions || 0) + 1); } A.play("heal"); return null; }
      case "schluessel": keysOwn++; return null;
    }
    return null;
  }
  let keysOwn = 0; /* nur ohne schmiede.js */
  const hasKey = () => (Z.hasKey ? Z.hasKey() : keysOwn > 0);
  const useKey = () => { if (Z.useKey) return Z.useKey(); if (keysOwn > 0) { keysOwn--; return true; } return false; };

  /* ======================= Geheimnisse ======================= */
  function found(id, what) {
    if (!S || S.found.has(id)) return;
    S.found.add(id);
    const n = S.found.size, tot = S.total;
    if (Z.stats) Z.stats.geheimnisse = (Z.stats.geheimnisse || 0) + 1;
    if (Z.meta) { Z.meta.geheimnisse = (Z.meta.geheimnisse || 0) + 1; }
    A.play("holy", { vol: 0.45 });
    toast("<b>" + L(["Geheimnis entdeckt", "Secret found"]) + "</b> · " + n + "/" + tot + (what ? "<br><small>" + what + "</small>" : ""), 2600);
  }

  /* ======================= Aufbau je Gebiet ======================= */
  function setup(lv) {
    S = null;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells || !lv.feats) return;
    const R = Z.Rng(((lv.seed || 5) * 7919 + 101) >>> 0);
    S = { lv, t: 0, found: new Set(), total: lv.secretsTotal || 0, rewards: [], keys: [], locks: [], levers: [], shrines: [], mouths: [], trial: null, exitTip: false, lockTip: 0, cellsIn: new Set() };
    const secretCells = new Set((lv.secretsList || []).filter(s => s.k === "secret").map(s => s.cell));
    S.secretCells = secretCells;
    /* Fundstücke */
    for (const r of lv.rewards || []) S.rewards.push({ kind: r.kind, x: r.x * T + 8, y: (r.y + 1) * T, q: r.tier || 0, cell: r.cell, vault: !!r.vault, open: false, t: R() * 9, secret: !!r.secret });
    for (const f of lv.feats) {
      const px = f.x * T + 8, py = (f.y + 1) * T;
      if (f.t === "key") S.keys.push({ x: px, y: py, got: false, t: R() * 9 });
      else if (f.t === "lock") {
        const o = { f, x: f.x * T + 8, y: (f.y0 + 3) * T, open: false };
        S.locks.push(o);
        (Z.interacts = Z.interacts || []).push({ x: o.x + (f.side === "L" ? -14 : 14), y: o.y, r: 34, h: 40, ok: () => !o.open,
          label: () => hasKey() ? L(["Aufschließen", "Unlock"]) : L(["Verschlossen", "Locked"]),
          use: () => openLock(o) });
      } else if (f.t === "lever") {
        const g = (lv.gates || [])[f.gate]; if (!g) continue;
        const o = { f, g, x: px, y: py, pulled: false, a: 0 };
        S.levers.push(o);
        (Z.interacts = Z.interacts || []).push({ x: px, y: py, r: 26, h: 34, ok: () => !o.pulled, label: () => L(["Hebel ziehen", "Pull lever"]), use: () => pullLever(o) });
      } else if (f.t === "shrine") {
        const o = { kind: f.kind, x: px, y: py, used: false, t: R() * 9 };
        S.shrines.push(o);
        (Z.interacts = Z.interacts || []).push({ x: px, y: py, r: 28, h: 40, ok: () => !o.used, label: () => o.kind === "segen" ? L(["Schrein: Segen empfangen", "Shrine: receive a blessing"]) : L(["Heilquelle: trinken", "Healing spring: drink"]), use: () => useShrine(o) });
      } else if (f.t === "trial") {
        const [cx, cy] = f.cell.split(",").map(Number);
        const o = { f, x: px, y: py, cx, cy, ox: cx * CW, oy: cy * CH, state: "idle", wave: 0, waves: f.waves || 2, mine: [], sealed: [], t: 0, reward: f.reward || ["glut"] };
        S.trial = o;
        (Z.interacts = Z.interacts || []).push({ x: px, y: py, r: 28, h: 40, ok: () => o.state === "idle", label: () => L(["Prüfung beginnen", "Begin the trial"]), use: () => startTrial(o) });
      } else if (f.t === "guard") spawnGuard(lv, f, R);
      else if (f.t === "anvil") { if (Z.placeAnvilTile) Z.placeAnvilTile(f.x, f.y); }
      else if (f.t === "mouth") S.mouths.push({ x: px, y: f.y * T + 4, v: f.v || 1, up: f.up || 0, t: R() * 9 });
    }
    /* Ausgänge von Anfang an auf der Karte (klein: sobald sie im Kartenausschnitt liegen) */
    if (Z.explored) for (const d of lv.doors) if (d.kind === "exit") for (let y = d.y - 2; y <= d.y + 1; y++) for (let x = d.x - 2; x <= d.x + 2; x++) if (x >= 0 && y >= 0 && x < lv.W && y < lv.H) Z.explored[y * lv.W + x] = 1;
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { if (S && S.trial && S.trial.state === "fight") unsealTrial(S.trial, true); const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  function spawnGuard(lv, f, R) {
    const B = Z.BIOMES[lv.biome]; if (!B || !Z.spawnEnemy) return;
    const ids = Object.keys(B.foes).filter(k => Z.ENEMIES[k] && !Z.ENEMIES[k].fly && !Z.ENEMIES[k].group && Z.ENEMIES[k].ai !== "turret");
    if (!ids.length) return;
    /* der zäheste Bodengegner des Gebiets */
    ids.sort((a, b) => (Z.ENEMIES[b].hp || 0) - (Z.ENEMIES[a].hp || 0));
    const id = ids[Math.min(ids.length - 1, R() < 0.6 ? 0 : 1)];
    const e = Z.spawnEnemy(id, f.x * T + 8, (f.y + 1) * T, { elite: true });
    if (e) { e.guard = true; e.spawnT = 0; }
  }

  /* ======================= Aktionen ======================= */
  function openReward(r) {
    r.open = true; r.t = 0;
    const sfx = r.kind === "gold" ? "coin" : r.kind === "waffe" ? "chest" : r.kind === "rolle" ? "scroll" : r.kind === "glut" ? "chest" : "holy";
    A.play(sfx, { vol: 0.7 }); A.play("chain", { vol: 0.15, rate: 1.6 });
    FX.burst(r.x, r.y - 10, 18 + r.q * 6, { col: COL[r.kind] ? [COL[r.kind][0], "#fff0c0"] : ["#ffd27a"], sp: 110, up: 60, life: 0.7, size: 2, kind: "spark", add: true });
    give(r.kind, r.x, r.y - 2, r.q);
    if (r.vault) S.rewards.filter(o => o.vault && !o.open && Math.abs(o.x - r.x) < CW * T).forEach(o => { if (o !== r) { o.open = true; give(o.kind, o.x, o.y - 2, o.q); } });
  }
  function openLock(o) {
    if (o.open) return;
    if (!hasKey()) {
      A.play("chain", { vol: 0.5 });
      toast("<b>" + L(["Verschlossene Kammer", "Locked chamber"]) + "</b><br><small>" + L(["Der Schlüssel liegt irgendwo in einem anderen Zweig dieses Gebiets.", "The key lies somewhere in another branch of this area."]) + "</small>", 3000);
      return;
    }
    if (!useKey()) return;
    o.open = true; const lv = Z.level, f = o.f;
    for (let y = f.y0; y <= f.y0 + 2; y++) lv.set(f.x, y, 0);
    Z.dirtyTiles && Z.dirtyTiles(f.x, f.y0 + 1);
    A.play("door", { vol: 0.8 }); A.play("holy", { vol: 0.3 }); FX.addShake(3);
    FX.burst(o.x, (f.y0 + 1.5) * T, 24, { col: ["#ffd27a", "#c08a3a", "#fff0c0"], sp: 100, life: 0.7, size: 2, kind: "spark", add: true });
    found("vault", L(["Die Schatzkammer ist offen.", "The treasure chamber is open."]));
  }
  function pullLever(o) {
    if (o.pulled) return;
    o.pulled = true; const lv = Z.level, g = o.g;
    for (const [x, y] of g.tiles) lv.set(x, y, 0);
    g.open = true; Z.dirtyTiles && Z.dirtyTiles(g.tiles[0][0], g.tiles[0][1]);
    A.play("chain", { vol: 0.8, rate: 0.8 }); A.play("door", { vol: 0.6, rate: 0.7 }); FX.addShake(4);
    for (const [x, y] of g.tiles) FX.burst(x * T + 8, y * T + 8, 3, { col: [Z.dustCol || "#8a7a70"], sp: 50, life: 0.6, size: 3, kind: "smoke" });
    found("gate" + o.f.gate, g.vert ? L(["Eine Falltür führt zurück zum Hauptweg.", "A trapdoor leads back to the main path."]) : L(["Das Gittertor ist offen – eine Abkürzung.", "The portcullis is open – a shortcut."]));
  }
  function useShrine(o) {
    if (o.used) return;
    o.used = true; A.play("holy", { vol: 0.7 });
    FX.burst(o.x, o.y - 20, 30, { col: o.kind === "segen" ? ["#ffd27a", "#fff0c0", "#ff9a5a"] : ["#ff6a6a", "#ffc0a0"], sp: 90, up: 70, life: 0.9, size: 2, kind: "glow", add: true });
    if (o.kind === "segen") { give("segen", o.x, o.y - 6, 2); if (!Z.spawnReward) toast(L(["Der Schrein stärkt dich.", "The shrine strengthens you."]), 2000); }
    else {
      const P = Z.player; if (P) { Z.healPlayer(P.hpMax * 0.5); P.potions = Math.min(P.potMax || 2, (P.potions || 0) + 1); }
      A.play("potion", { vol: 0.5 }); FX.text(o.x, o.y - 30, L(["Geheilt · +1 Trank", "Healed · +1 potion"]), "#ffb0a0", true);
    }
  }

  /* ======================= Prüfungskammer ======================= */
  const solid = v => v === 1 || v === 7 || v === 12;
  function sealTrial(o) {
    const lv = Z.level, { ox, oy } = o;
    for (let y = oy; y < oy + CH; y++) for (const x of [ox, ox + CW - 1]) { const v = lv.get(x, y); if (!solid(v) && v !== 9) { o.sealed.push([x, y, v]); lv.set(x, y, 1); } }
    for (let x = ox + 1; x < ox + CW - 1; x++) for (const y of [oy, oy + CH - 1]) { const v = lv.get(x, y); if (!solid(v) && v !== 9) { o.sealed.push([x, y, v]); lv.set(x, y, 1); } }
    Z.dirtyTiles && Z.dirtyTiles();
  }
  function unsealTrial(o, silent) {
    const lv = Z.level;
    for (const [x, y, v] of o.sealed) lv.set(x, y, v);
    if (o.sealed.length && !silent) { A.play("door", { vol: 0.7 }); for (const [x, y] of o.sealed) if (Math.random() < 0.4) FX.burst(x * T + 8, y * T + 8, 2, { col: ["#ffd27a", "#ff9a5a"], sp: 50, life: 0.5, size: 2, kind: "spark", add: true }); }
    o.sealed = []; Z.dirtyTiles && Z.dirtyTiles();
  }
  function trialSpots(o) {
    const lv = Z.level, out = [];
    for (let y = o.oy + 2; y < o.oy + CH - 1; y++) for (let x = o.ox + 2; x < o.ox + CW - 2; x++) if (Z.standable(lv, x, y, 2) && (!lv.reach || lv.reach[y * lv.W + x])) out.push([x, y]);
    return out;
  }
  function startTrial(o) {
    if (o.state !== "idle") return;
    if (Z.ambush && Z.ambush() && Z.ambush().state === "fight") { toast(L(["Nicht jetzt.", "Not now."])); return; }
    const P = Z.player;
    const inside = P.x > (o.ox + 1) * T && P.x + P.w < (o.ox + CW - 1) * T && P.y > o.oy * T && P.y + P.h < (o.oy + CH) * T;
    if (!inside) return;
    o.spots = trialSpots(o); if (o.spots.length < 4) { o.state = "done"; return; }
    const B = Z.BIOMES[Z.level.biome] || {};
    o.pool = Object.keys(B.foes || {}).filter(k => Z.ENEMIES[k] && !Z.ENEMIES[k].group && Z.ENEMIES[k].ai !== "turret");
    if (!o.pool.length) o.pool = ["goblin"];
    o.state = "fight"; o.t = 0; o.wave = 0; sealTrial(o);
    A.play("gong", { vol: 0.7 }); FX.flashScreen && FX.flashScreen("#6a3a10", 0.3); FX.addShake(4);
    toast("<b>" + L(["Prüfung", "Trial"]) + "</b><br><small>" + L(["Besiege alle Wellen. Dann gehört der Schatz dir.", "Defeat every wave. Then the treasure is yours."]) + "</small>", 2600);
    Z.music && Z.music.set && Z.music.set("boss1");
    later(() => spawnWave(o), 700);
  }
  function spawnWave(o) {
    if (!S || S.trial !== o || o.state !== "fight") return;
    o.pending = false;
    const P = Z.player, tier = tierNow(), n = 2 + Math.min(4, tier) + o.wave + (o.waves === 1 ? 1 : 0);
    const far = o.spots.filter(([x]) => Math.abs(x * T - P.x) > 64);
    for (let i = 0; i < n; i++) {
      const [x, y] = Z.R.pick(far.length ? far : o.spots), id = Z.R.pick(o.pool), lv = Z.level;
      later(() => {
        if (!S || S.trial !== o || o.state !== "fight" || Z.level !== lv) return;
        const e = Z.spawnEnemy(id, x * T + 8, (y + 1) * T - (Z.ENEMIES[id].fly ? 20 : 0), { elite: o.wave === o.waves && i === 0 && tier >= 1 });
        if (!e) return; e.aware = true; e.trial = true; o.mine.push(e);
        FX.burst(x * T + 8, (y + 1) * T - 10, 16, { col: ["#2a1a10", "#6a3a10", "#c07a2a"], sp: 70, life: 0.7, size: 4, kind: "smoke", g: -20 });
        FX.ring && FX.ring(x * T + 8, (y + 1) * T - 2, 16, "#e0a040", 0.4, 2);
      }, i * 280);
    }
    o.wave++;
  }
  function trialTick(o, dt) {
    if (o.state !== "fight") return;
    o.t += dt;
    const { ox, oy } = o, P = Z.player;
    const inRoom = e => e.x + e.w > ox * T && e.x < (ox + CW) * T && e.y + e.h > oy * T - T && e.y < (oy + CH) * T;
    for (const e of o.mine) { if (!e.dead && !inRoom(e)) e._trOut = (e._trOut || 0) + dt; else e._trOut = 0; }
    let alive = o.mine.filter(e => !e.dead && Z.enemies.includes(e) && !(e._trOut > 4));
    alive.forEach(e => (e.aware = true));
    if (o.nAlive !== alive.length) { o.nAlive = alive.length; o.prog = o.t; }
    /* Stillstand (Gegner hängt fest oder versteckt sich): erst zweimal in die Kammermitte zurückholen, erst danach zählt die Welle als geschafft */
    if (alive.length && o.t - (o.prog || 0) > 15) {
      o.fetch = (o.fetch || 0) + 1; o.prog = o.t;
      if (o.fetch <= 2 && o.spots && o.spots.length) for (const e of alive) { const [x, y] = Z.R.pick(o.spots); e.x = x * T + 8 - e.w / 2; e.y = (y + 1) * T - e.h - (e.def.fly ? 20 : 0); e.vx = e.vy = 0; e._trOut = 0; FX.burst(e.x + e.w / 2, e.y + e.h - 6, 12, { col: ["#2a1a10", "#6a3a10", "#c07a2a"], sp: 60, life: 0.6, size: 3, kind: "smoke", g: -20 }); }
      else if (o.wave >= o.waves) alive = [];
    }
    if (!alive.length && o.t > 3) {
      if (o.wave < o.waves && !o.pending) { o.pending = true; o.t = 0; o.prog = 0; o.fetch = 0; o.mine = []; FX.text(P.x + P.w / 2, P.y - 20, L(["Nächste Welle!", "Next wave!"]), "#ffb060", true); A.play("horn", { vol: 0.4 }); later(() => spawnWave(o), 800); }
      else if (o.wave >= o.waves) winTrial(o);
    }
    if (o.t > 75) winTrial(o, true);
  }
  function winTrial(o, timeout) {
    o.state = "done"; unsealTrial(o);
    Z.music && Z.music.set && Z.music.set(Z.level.biome);
    if (timeout) return;
    A.play("holy", { vol: 0.7 }); FX.flashScreen && FX.flashScreen("#ffe0a0", 0.25);
    o.reward.forEach((k, i) => give(k, o.x + (i - (o.reward.length - 1) / 2) * 18, o.y - 2, 3));
    give("gold", o.x, o.y - 2, 2);
    FX.burst(o.x, o.y - 10, 36, { col: ["#ffd27a", "#fff0c0", "#ff9a5a"], sp: 130, up: 70, life: 0.9, size: 2, kind: "spark", add: true });
    found("trial", L(["Prüfung bestanden.", "Trial passed."]));
    if (Z.stats) Z.stats.pruefungen = (Z.stats.pruefungen || 0) + 1;
  }

  /* ======================= Ablauf ======================= */
  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    const P = Z.player; if (!S || !P || P.dead || Z.level !== S.lv) return;
    S.t += dt;
    const px = P.x + P.w / 2, py = P.y + P.h;
    for (const r of S.rewards) { r.t += dt; if (!r.open && Math.abs(r.x - px) < 15 && Math.abs(r.y - py) < 22) openReward(r); }
    for (const k of S.keys) {
      k.t += dt;
      if (!k.got && Math.abs(k.x - px) < 16 && Math.abs(k.y - 8 - py) < 26) {
        k.got = true; give("schluessel", k.x, k.y - 4, 0);
        A.play("chain", { vol: 0.6, rate: 1.5 }); FX.burst(k.x, k.y - 14, 18, { col: ["#ffd27a", "#fff0c0"], sp: 90, life: 0.6, size: 2, kind: "spark", add: true });
        toast("<b>" + L(["Schlüssel gefunden", "Key found"]) + "</b><br><small>" + L(["Irgendwo in diesem Gebiet wartet eine verschlossene Kammer.", "Somewhere in this area a locked chamber waits."]) + "</small>", 3200);
      }
    }
    for (const o of S.levers) if (o.pulled && o.a < 1) o.a = Math.min(1, o.a + dt * 4);
    for (const s of S.shrines) s.t += dt;
    if (S.trial) trialTick(S.trial, dt);
    /* Geheimkammern: gefunden, sobald man drinsteht */
    const ck = Math.floor(px / T / CW) + "," + Math.floor((P.y + P.h / 2) / T / CH);
    if (S.secretCells.has(ck)) found("secret:" + ck, L(["Eine verborgene Kammer.", "A hidden chamber."]));
    /* vor dem Ausgang: Bilanz der Geheimnisse */
    if (!S.exitTip && S.total > 0) for (const d of S.lv.doors) if (d.kind === "exit" && Math.abs(d.x * T + 8 - px) < 70 && Math.abs((d.y + 1) * T - py) < 40) {
      S.exitTip = true;
      const n = S.found.size, rest = S.rewards.filter(r => !r.open).length;
      toast("<b>" + L(["Geheimnisse dieses Gebiets", "Secrets of this area"]) + ": " + n + "/" + S.total + "</b>" + (rest ? "<br><small>" + L(["Noch ", "Still "]) + rest + L([" Fundstücke abseits des Weges.", " finds off the beaten path."]) + "</small>" : ""), 3400);
      break;
    }
  };

  /* ======================= Zeichnen ======================= */
  const COL = { gold: ["#ffd27a", "#c08a2a"], glut: ["#ff8a2a", "#ffd080"], waffe: ["#e8dcc8", "#ffd27a"], rolle: ["#f0e0b0", "#c04040"], heil: ["#ff5a5a", "#ffc0a0"], segen: ["#ffe9a0", "#ff9a5a"] };
  function drawReward(c, r, t) {
    const x = r.x, y = r.y, k = r.kind, s = 1 + r.q * 0.08, bob = Math.sin(t * 2 + r.t) * 1.2;
    /* Sockel */
    c.fillStyle = "#3a3030"; c.fillRect(x - 8 * s, y - 4, 16 * s, 4); c.fillStyle = "#5a4a44"; c.fillRect(x - 7 * s, y - 5, 14 * s, 1.5);
    if (r.open) { c.fillStyle = "rgba(255,210,122,.12)"; c.fillRect(x - 6, y - 6, 12, 1); return; }
    c.save(); c.translate(x, y - 6 + (k === "gold" ? 0 : bob));
    if (k === "gold") { for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? "#ffd27a" : "#c8942a"; c.beginPath(); c.ellipse(-5 + (i % 4) * 3.4, -1 - Math.floor(i / 4) * 2.4, 2.6, 1.3, 0, 0, TAU); c.fill(); } }
    else if (k === "glut") { c.fillStyle = "#2a1a14"; c.fillRect(-5, -4, 10, 4); const f = 0.7 + 0.3 * Math.sin(t * 7 + r.t); c.fillStyle = "rgba(255,138,42," + f + ")"; c.beginPath(); c.moveTo(-3, -4); c.lineTo(0, -10 - 2 * f); c.lineTo(3, -4); c.fill(); c.fillStyle = "#ffd080"; c.fillRect(-1, -7, 2, 3); }
    else if (k === "waffe") { c.fillStyle = "#5a4a44"; c.fillRect(-4, -3, 8, 3); c.fillStyle = "#d8d0c8"; c.fillRect(-0.8, -16, 1.6, 13); c.fillStyle = "#ffd27a"; c.fillRect(-3.5, -16, 7, 1.6); c.fillStyle = "#6a3a2a"; c.fillRect(-0.8, -20, 1.6, 4); }
    else if (k === "rolle") { c.fillStyle = "#4a3426"; c.fillRect(-1, -8, 2, 8); c.fillStyle = "#f0e0b0"; c.fillRect(-6, -12, 12, 5); c.fillStyle = "#c8b080"; c.fillRect(-6, -12, 1.5, 5); c.fillRect(4.5, -12, 1.5, 5); c.fillStyle = "#c04040"; c.fillRect(-1, -10, 2, 2); }
    else if (k === "heil") { c.fillStyle = "#ff5a5a"; c.beginPath(); c.arc(0, -5, 4, 0, TAU); c.fill(); c.fillStyle = "#e8dcc8"; c.fillRect(-1.2, -11, 2.4, 3); c.fillStyle = "rgba(255,230,220,.6)"; c.fillRect(-2, -7, 1.2, 1.2); }
    else { c.fillStyle = "#ffe9a0"; c.fillRect(-1.2, -10, 2.4, 9); const f = 0.6 + 0.4 * Math.sin(t * 9 + r.t); c.fillStyle = "rgba(255,170,90," + f + ")"; c.beginPath(); c.ellipse(0, -12, 1.6, 2.6 + f, 0, 0, TAU); c.fill(); }
    c.restore();
    /* Glanz: kleine Funken, häufiger bei wertvollen Funden */
    if (Math.random() < 0.04 + r.q * 0.03) FX.p && FX.p({ x: x + (Math.random() - 0.5) * 14, y: y - 6 - Math.random() * 12, vx: 0, vy: -14, life: 0.8, size: 1.3, col: COL[k] ? COL[k][0] : "#ffd27a", kind: "glow", add: true });
  }
  function drawKey(c, k, t) {
    if (k.got) return;
    const y = k.y - 14 + Math.sin(t * 2.4 + k.t) * 2.5;
    c.save(); c.translate(k.x, y); c.rotate(Math.sin(t * 1.3 + k.t) * 0.25);
    c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(-4, 0, 3.2, 0, TAU); c.fill(); c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(-4, 0, 1.4, 0, TAU); c.fill();
    c.fillStyle = "#ffd27a"; c.fillRect(-1, -0.9, 8, 1.8); c.fillRect(4, 0.9, 1.4, 2.4); c.fillRect(6, 0.9, 1.2, 1.8);
    c.restore();
    if (Math.random() < 0.08) FX.p && FX.p({ x: k.x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 8, vx: 0, vy: -10, life: 0.7, size: 1.2, col: "#ffe9a0", kind: "glow", add: true });
  }
  function drawLock(c, o, t) {
    if (o.open) return;
    const f = o.f, x = f.x * T, y = f.y0 * T, h = 3 * T;
    c.fillStyle = "#2a2226"; c.fillRect(x, y, T, h);
    c.fillStyle = "#4a4048"; for (let i = 0; i < 3; i++) c.fillRect(x + 1, y + 2 + i * 16, T - 2, 2);
    c.fillStyle = "#5a5058"; c.fillRect(x + 2, y, 2, h); c.fillRect(x + T - 4, y, 2, h);
    const g = 0.7 + 0.3 * Math.sin(t * 3);
    c.fillStyle = "#c8942a"; c.fillRect(x + 4, y + h / 2 - 5, 8, 9); c.fillStyle = "rgba(255,210,122," + g + ")"; c.fillRect(x + 5, y + h / 2 - 4, 6, 1);
    c.fillStyle = "#2a1a10"; c.fillRect(x + 7, y + h / 2 - 1, 2, 4);
  }
  function drawGate(c, g, t) {
    if (g.open) return;
    if (g.vert) {
      const x = g.x * T, y = (g.y0 + 2) * T;
      c.fillStyle = "#2e2622"; c.fillRect(x, y - 2, 4 * T, 4);
      c.fillStyle = "#5a5058"; for (let i = 0; i <= 8; i++) c.fillRect(x + i * 8 - 1, y - 3, 2, 6);
      c.fillStyle = "#6a4a30"; c.fillRect(x + 2, y + 2, 4 * T - 4, 2);
      return;
    }
    const x = g.x * T, y = g.y0 * T, w = 2 * T, h = 3 * T;
    c.fillStyle = "rgba(20,14,16,.55)"; c.fillRect(x, y, w, h);
    c.fillStyle = "#5a5058"; for (let i = 0; i <= 4; i++) c.fillRect(x + 1 + i * 7.5, y, 2, h);
    for (let j = 0; j < 4; j++) c.fillRect(x, y + 3 + j * 13, w, 2);
    c.fillStyle = "#7a7078"; for (let i = 0; i <= 4; i++) c.fillRect(x + 1 + i * 7.5, y + h - 3, 2, 3);
  }
  function drawLever(c, o, t) {
    const x = o.x, y = o.y, a = (o.pulled ? 1 : 0) * 0 + o.a;
    c.fillStyle = "#3a3030"; c.fillRect(x - 6, y - 4, 12, 4);
    c.save(); c.translate(x, y - 3); c.rotate(-0.7 + a * 1.4);
    c.fillStyle = "#6a4a30"; c.fillRect(-1, -13, 2.4, 13); c.fillStyle = o.pulled ? "#8a7a70" : "#d0503a"; c.beginPath(); c.arc(0.2, -13, 2.6, 0, TAU); c.fill();
    c.restore();
    if (!o.pulled && Math.random() < 0.03) FX.p && FX.p({ x: x, y: y - 16, vx: 0, vy: -10, life: 0.6, size: 1.2, col: "#ff9a5a", kind: "glow", add: true });
  }
  function drawShrine(c, o, t) {
    const x = o.x, y = o.y, segen = o.kind === "segen";
    c.fillStyle = "#4a4040"; c.fillRect(x - 9, y - 5, 18, 5); c.fillStyle = "#5e5250"; c.fillRect(x - 6, y - 22, 12, 17);
    c.fillStyle = "#3a3030"; c.fillRect(x - 8, y - 24, 16, 3);
    if (segen) { c.fillStyle = o.used ? "#6a5a50" : "#ffd27a"; c.fillRect(x - 1, y - 19, 2, 9); c.fillRect(x - 4, y - 16, 8, 2); }
    else { c.fillStyle = o.used ? "#5a4040" : "#c03a3a"; c.beginPath(); c.ellipse(x, y - 13, 4, 2, 0, 0, TAU); c.fill(); if (!o.used) { c.fillStyle = "#ff8a7a"; c.fillRect(x - 0.6, y - 20, 1.2, 6); } }
    if (!o.used && Math.random() < 0.08) FX.p && FX.p({ x: x + (Math.random() - 0.5) * 10, y: y - 22 - Math.random() * 6, vx: 0, vy: -16, life: 0.8, size: 1.4, col: segen ? "#ffe9a0" : "#ff8a7a", kind: "glow", add: true });
  }
  function drawTrial(c, o, t) {
    const x = o.x, y = o.y, live = o.state !== "done";
    c.fillStyle = "#3a2e2a"; c.fillRect(x - 8, y - 6, 16, 6); c.fillRect(x - 5, y - 12, 10, 6);
    c.fillStyle = "#e8dcc8"; c.beginPath(); c.arc(x, y - 15, 3, 0, TAU); c.fill(); c.fillStyle = "#2a1a14"; c.fillRect(x - 1.8, y - 16, 1.3, 1.3); c.fillRect(x + 0.5, y - 16, 1.3, 1.3);
    if (live) { const f = 0.6 + 0.4 * Math.sin(t * 6); c.fillStyle = "rgba(255,140,50," + f + ")"; c.beginPath(); c.moveTo(x - 7, y - 12); c.lineTo(x - 5, y - 18 - f * 3); c.lineTo(x - 3, y - 12); c.moveTo(x + 3, y - 12); c.lineTo(x + 5, y - 18 - f * 3); c.lineTo(x + 7, y - 12); c.fill(); }
    if (o.sealed.length) {
      c.save(); c.globalCompositeOperation = "lighter";
      for (const [sx, sy] of o.sealed) { const f = 0.6 + 0.4 * Math.sin(t * 6 + sx + sy); c.fillStyle = "rgba(220,120,30," + 0.32 * f + ")"; c.fillRect(sx * T, sy * T, T, T); c.strokeStyle = "rgba(255,200,110," + 0.7 * f + ")"; c.lineWidth = 1; c.strokeRect(sx * T + 3, sy * T + 3, T - 6, T - 6); }
      c.restore();
    }
  }
  function drawMouth(c, m, t) {
    /* kleine Laterne an der Zweigmündung – je lohnender der Zweig, desto heller */
    const x = m.x, y = m.y, f = 0.75 + 0.25 * Math.sin(t * 3 + m.t);
    c.fillStyle = "#2a2020"; c.fillRect(x - 0.5, y - 8, 1, 6);
    c.fillStyle = "#3a2e26"; c.fillRect(x - 3, y - 2, 6, 7); c.fillStyle = "rgba(255,190,90," + (0.55 + 0.4 * f) + ")"; c.fillRect(x - 2, y - 1, 4, 5);
    c.fillStyle = "#3a2e26"; c.fillRect(x - 3.5, y - 3, 7, 1.5);
    if (m.up) { c.fillStyle = "rgba(255,210,122," + 0.5 * f + ")"; const ay = y + 9; c.beginPath(); c.moveTo(x - 3, ay + (m.up > 0 ? 3 : 0)); c.lineTo(x, ay + (m.up > 0 ? 0 : 3)); c.lineTo(x + 3, ay + (m.up > 0 ? 3 : 0)); c.fill(); }
  }
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0.apply(this, arguments);
    if (!S || Z.level !== S.lv) return;
    const cam = Z.cam, vx0 = cam.x - 40, vx1 = cam.x + cam.w + 40, vy0 = cam.y - 60, vy1 = cam.y + cam.h + 60;
    const vis = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    for (const m of S.mouths) if (vis(m.x, m.y)) drawMouth(c, m, t);
    for (const g of S.lv.gates || []) if (g.lever && vis(g.x * T, g.y0 * T)) drawGate(c, g, t);
    for (const o of S.locks) if (vis(o.x, o.y)) drawLock(c, o, t);
    for (const o of S.levers) if (vis(o.x, o.y)) drawLever(c, o, t);
    for (const o of S.shrines) if (vis(o.x, o.y)) drawShrine(c, o, t);
    if (S.trial && vis(S.trial.x, S.trial.y)) drawTrial(c, S.trial, t);
    for (const r of S.rewards) if (vis(r.x, r.y)) drawReward(c, r, t);
    for (const k of S.keys) if (vis(k.x, k.y)) drawKey(c, k, t);
  };
  /* Licht: Fundstücke, Schreine und Laternen leuchten durch die Dunkelheit (alle Grafikstufen) */
  const le0 = Z.lightExtra;
  Z.lightExtra = function (hole) {
    if (le0) le0(hole);
    if (!S || Z.level !== S.lv) return;
    const cam = Z.cam, vis = (x, y) => x > cam.x - 80 && x < cam.x + cam.w + 80 && y > cam.y - 80 && y < cam.y + cam.h + 80;
    const tt = performance.now() / 1000;
    for (const m of S.mouths) if (vis(m.x, m.y)) hole(m.x, m.y + 2, 26 + Math.min(3, m.v) * 6, 0.5 + 0.06 * Math.sin(tt * 3 + m.t), "#ffb060");
    for (const r of S.rewards) if (!r.open && vis(r.x, r.y)) hole(r.x, r.y - 8, 22 + r.q * 6, 0.42 + 0.08 * Math.sin(tt * 2 + r.t), COL[r.kind] ? COL[r.kind][0] : "#ffd27a");
    for (const k of S.keys) if (!k.got && vis(k.x, k.y)) hole(k.x, k.y - 14, 30, 0.55, "#ffd27a");
    for (const o of S.shrines) if (!o.used && vis(o.x, o.y)) hole(o.x, o.y - 16, 34, 0.5, o.kind === "segen" ? "#ffe0a0" : "#ff7a6a");
    if (S.trial && S.trial.state !== "done" && vis(S.trial.x, S.trial.y)) hole(S.trial.x, S.trial.y - 14, 34, 0.5, "#ff9a40");
  };

  /* ======================= Wegweiser am Bildrand ======================= */
  /* Ein dezenter goldener Pfeil zeigt zum nächsten Ausgang, solange er nicht im Bild ist; mit Schlüssel in der Tasche
     ein violetter zur verschlossenen Kammer. Erscheint erst nach ein paar Sekunden – erst einmal schauen. */
  function arrow(c, cam, tx, ty, col, a, t) {
    const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2, dx = tx - cx, dy = ty - cy;
    if (Math.abs(dx) < cam.w / 2 - 20 && Math.abs(dy) < cam.h / 2 - 20) return;
    const ang = Math.atan2(dy, dx), m = 26, kx = (cam.w / 2 - m) / Math.max(1e-3, Math.abs(Math.cos(ang))), ky = (cam.h / 2 - m) / Math.max(1e-3, Math.abs(Math.sin(ang)));
    const r = Math.min(kx, ky), px = cx + Math.cos(ang) * r, py = Math.min(cy + Math.sin(ang) * r, cy + cam.h / 2 - 48); /* unten Platz für die Fertigkeitsleiste */
    c.save(); c.translate(px, py); c.rotate(ang); c.globalAlpha = a * (0.75 + 0.25 * Math.sin(t * 3));
    c.fillStyle = "rgba(20,12,10,.6)"; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -8); c.lineTo(-2, 0); c.lineTo(-6, 8); c.closePath(); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(8, 0); c.lineTo(-5, -6); c.lineTo(-2, 0); c.lineTo(-5, 6); c.closePath(); c.fill();
    c.restore();
  }
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) {
    if (al0) al0.apply(this, arguments);
    if (!S || Z.level !== S.lv || S.t < 6 || (Z.settings && Z.settings.wegweiser === false)) return;
    const P = Z.player; if (!P || P.dead) return;
    const px = P.x + P.w / 2, py = P.y + P.h / 2;
    let best = null, bd = 1e9;
    for (const d of S.lv.doors) if (d.kind === "exit") { const dd = Math.hypot(d.x * T + 8 - px, (d.y + 0.5) * T - py); if (dd < bd) { bd = dd; best = d; } }
    if (best) arrow(c, cam, best.x * T + 8, (best.y + 0.5) * T, "#ffd27a", Math.min(0.85, (S.t - 6) / 4), t);
    if (hasKey()) for (const o of S.locks) if (!o.open) arrow(c, cam, o.x, (o.f.y0 + 1.5) * T, "#c88aff", 0.8, t);
  };

  Z.erkundung = () => S;
})();
