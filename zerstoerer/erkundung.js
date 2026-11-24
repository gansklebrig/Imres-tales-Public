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
  /* Hinweise: über die gemeinsame Meldungs-Warteschlange (ui.js); mit Ort als kurze Zeile in der Welt */
  const toast = (h, ms, at, o) => { if (Z.ui && Z.ui.notify) Z.ui.notify(h, Object.assign({ dauer: ms }, at ? { ort: "welt", x: at.x, y: at.y } : {}, o || {})); else if (Z.toast) Z.toast(h, ms); };
  const Pat = () => { const P = Z.player; return P ? { x: P.x + P.w / 2, y: P.y - 6 } : null; };
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
        /* runen.js: Runenstein (Spielweise-Rune für den Gürtel) und Runensockel (Bewegungs-Rune) */
        case "runenstein": case "bewegung": return Z.runen ? Z.runen.give(kind, x, y, q) : Z.spawnReward("glut", x, y, { n: 2 });
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
    toast("✦ <b>" + L(["Geheimnis", "Secret"]) + " " + n + "/" + tot + "</b>" + (what ? "<small>" + what + "</small>" : ""), 2600, Pat(), { prio: 1, art: "gold" });
  }

  /* ======================= Aufbau je Gebiet ======================= */
  function setup(lv) {
    S = null;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells || !lv.feats) return;
    const R = Z.Rng(((lv.seed || 5) * 7919 + 101) >>> 0);
    S = { lv, t: 0, found: new Set(), total: lv.secretsTotal || 0, rewards: [], keys: [], locks: [], levers: [], shrines: [], mouths: [], trial: null, exitTip: false, lockTip: 0, cellsIn: new Set() };
    const secretCells = new Set((lv.secretsList || []).filter(s => s.k === "secret").map(s => s.cell));
    S.secretCells = secretCells;
    /* W13 R4 Sonderräume (welt.js specials): Kranplattformen */
    S.kraene = (lv.specials || []).filter(o => o.k === "kran").map(o => ({ x: o.x, w: o.w, y0: o.yTop, y1: o.yBot, y: o.yBot, dir: -1, sp: 54, pause: 1.2, dy: 0 }));
    /* W13 R7: rollende Fässer, Kronleuchter zum Schwingen, Gezeiten */
    S.rollers = (lv.rollers || []).map(r => ({ x: (r.x + 0.5) * T, y: (r.y + 1) * T, dir: r.dir, cx: +r.cell.split(",")[0], cy: +r.cell.split(",")[1], t: 1.5 + R() * 1.5, warn: false, barrels: [] }));
    S.swings = (lv.swings || []).map(o => { let ay = o.y; while (ay > 0 && lv.get(o.x, ay - 1) !== 1) ay--; const L0 = U.clamp((o.y - ay) * T + 3 * T, 48, 96); return { ax: (o.x + 0.5) * T, ay: ay * T, L: L0, th: 0, om: 0, cool: 0, t: R() * 9 }; });
    S.tides = (lv.tides || []).map(td => ({ td, ph: R() * 15, lvl: 0 }));
    S.specials = lv.specials || [];
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
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "erkundung", save: () => S, load: s => { S = s; } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */

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
      /* das Schild an der Tür (schilder.js) sagt schon, wo der Schlüssel liegt: dann nur ein kurzes „Verschlossen“ */
      if (Z.schilder && Z.schilder.hat("schloss")) { toast("⚷ <b>" + L(["Verschlossen", "Locked"]) + "</b>", 1600, Pat(), { prio: 3 }); return; }
      toast("⚷ <b>" + L(["Verschlossen", "Locked"]) + "</b><small>" + L(["Der Schlüssel liegt in einem anderen Zweig.", "The key lies in another branch."]) + "</small>", 3000, Pat(), { prio: 3 });
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
    for (const [x, y, v] of g.tiles) lv.set(x, y, v || 0); /* W13 (Karte): Falltüren öffnen zur Leiter */
    g.open = true; Z.dirtyTiles && Z.dirtyTiles(g.tiles[0][0], g.tiles[0][1]);
    A.play("chain", { vol: 0.8, rate: 0.8 }); A.play("door", { vol: 0.6, rate: 0.7 }); FX.addShake(4);
    for (const [x, y] of g.tiles) FX.burst(x * T + 8, y * T + 8, 3, { col: [Z.dustCol || "#8a7a70"], sp: 50, life: 0.6, size: 3, kind: "smoke" });
    if (g.flut) { for (let i = 0; i < g.tiles.length; i += 3) { const [x, y] = g.tiles[i]; FX.burst(x * T + 8, y * T + 4, 2, { col: ["#4a7a6a", "#9ac0b0"], sp: 60, ang: Math.PI / 2, spread: 1, life: 0.7, size: 2 }); } A.play("splash", { vol: 0.8 }); }
    if (g.flut) { Z.achEv && Z.achEv("flut"); found("gate" + o.f.gate, L(["Gurgelnd läuft das Wasser ab – der Durchgang ist frei.", "With a gurgle the water drains away – the passage is clear."])); return; }
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
    if (Z.ambush && Z.ambush() && Z.ambush().state === "fight") { toast(L(["Nicht jetzt.", "Not now."]), 1800, null, { prio: 3 }); return; }
    const P = Z.player;
    const inside = P.x > (o.ox + 1) * T && P.x + P.w < (o.ox + CW - 1) * T && P.y > o.oy * T && P.y + P.h < (o.oy + CH) * T;
    if (!inside) return;
    o.spots = trialSpots(o); if (o.spots.length < 4) { o.state = "done"; return; }
    const B = Z.BIOMES[Z.level.biome] || {};
    o.pool = Object.keys(B.foes || {}).filter(k => Z.ENEMIES[k] && !Z.ENEMIES[k].group && Z.ENEMIES[k].ai !== "turret");
    if (!o.pool.length) o.pool = ["goblin"];
    o.state = "fight"; o.t = 0; o.wave = 0; sealTrial(o);
    A.play("gong", { vol: 0.7 }); FX.flashScreen && FX.flashScreen("#6a3a10", 0.3); FX.addShake(4);
    /* Regeln stehen auf dem Schild am Altar (schilder.js) – sonst kurz als Meldung */
    if (!(Z.schilder && Z.schilder.hat("pruefung"))) toast("<b>" + L(["Prüfung", "Trial"]) + "</b><br><small>" + L(["Besiege alle Wellen. Dann gehört der Schatz dir.", "Defeat every wave. Then the treasure is yours."]) + "</small>", 2600, null, { prio: 2, art: "gefahr" });
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

  /* ======================= W13 R4: Sonderräume ======================= */
  /* Kranplattform: fährt zwischen zwei Etagen auf und ab (wie die Fähre, nur senkrecht) und nimmt den Spieler mit */
  Z._kraene = () => (S && S.kraene) || []; /* Tests */
  function kranTick(dt, P) {
    for (const m of S.kraene) {
      const oy = m.y;
      if (m.pause > 0) m.pause -= dt;
      else { m.y += m.dir * m.sp * dt; if (m.y <= m.y0) { m.y = m.y0; m.dir = 1; m.pause = 1.4; } if (m.y >= m.y1) { m.y = m.y1; m.dir = -1; m.pause = 1.4; } }
      m.dy = m.y - oy;
      const over = P.x + P.w > m.x + 1 && P.x < m.x + m.w - 1;
      if (P._kran === m) {
        if (over && P.vy >= Math.min(0, m.dy / dt) - 5 && P.y + P.h > oy - 3 && P.y + P.h < oy + 10 && !P.grapple && !P.climbing) { P.y = m.y - P.h; P.vy = Math.min(0, m.dy / dt); P.onGround = true; } /* aufwärts: vy mitgeben, sonst zieht die Bodenhaftung (stickDown) zurück auf den Boden darunter */
        else P._kran = null;
      } else if (over && P.vy >= 0 && P.y + P.h >= m.y - 1 && P.y + P.h - P.vy * dt - Math.max(0, m.dy) <= m.y + 4 && !P.dropT && !P.grapple && !P.climbing) {
        if (P.vy > 120) A.play("stepWood", { vol: 0.5 });
        P.y = m.y - P.h; P.vy = 0; P.onGround = true; P._kran = m; P.cut = false;
      }
    }
  }
  /* Flutkammer: ins Wasser fallen kostet nichts – man steht wieder an der letzten sicheren Stelle (kampf.js fragt hier nach) */
  let flutTip = 0;
  Z.flutSicher = function (P) {
    const lv = Z.level; if (!lv || !lv.flood) return false;
    const tx = Math.floor((P.x + P.w / 2) / T), ty = Math.floor((P.y + P.h - 3) / T);
    let hit = false; for (const yy of [ty, Math.floor((P.y + P.h * 0.5) / T)]) if (lv.flood.has(yy * lv.W + tx) && lv.get(tx, yy) === 6) hit = true;
    /* Gezeiten (W13 R7): zurück auf den nächsten trockenen Platz des Raums (nicht auf den letzten Platz, der jetzt unter Wasser steht) */
    if (hit && S && S.tides) { const k = Math.floor(tx / CW) + "," + Math.floor(ty / CH), td = S.tides.find(o => o.td.cell === k);
      if (td) { let b = null, bd = 1e9; for (const [x, y] of td.td.safe) { const d = Math.abs(x - tx) + Math.abs(y - ty) * 2; if (d < bd && lv.get(x, y) !== 6 && lv.get(x, y + 1) !== 6) { bd = d; b = [x, y]; } } if (b) P.lastSafe = { x: b[0] * T + 8 - P.w / 2, y: (b[1] + 1) * T - P.h }; } }
    if (hit && (Z.time0 ? Z.time0() : performance.now() / 1000) - flutTip > 20) { flutTip = Z.time0 ? Z.time0() : performance.now() / 1000; toast(L(["Zu tief zum Durchwaten. Irgendwo muss sich das Wasser ablassen lassen.", "Too deep to wade. There must be a way to drain it."]), 2600, { x: P.x + P.w / 2, y: P.y - 12 }, { prio: 1 }); }
    return hit;
  };
  function drawKran(c, m, t) {
    if (Z.sonderPracht && Z.sonderPracht()) return; /* effekte.js zeichnet die schöne Fassung (alle Stufen) */
    const x = m.x, w = m.w, top = m.y0 - 3 * T;
    /* Ausleger oben und Seil */
    c.fillStyle = "#3a2a20"; c.fillRect(x - 6, top - 3, w + 12, 4); c.fillRect(x + w / 2 - 2, top - 3, 4, 10);
    c.strokeStyle = "rgba(200,180,140,.8)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 4, top + 1); c.lineTo(x + 4, m.y - 2); c.moveTo(x + w - 4, top + 1); c.lineTo(x + w - 4, m.y - 2); c.stroke();
    /* Plattform */
    c.fillStyle = "#6a4a2c"; c.fillRect(x, m.y, w, 5); c.fillStyle = "#9a7a52"; c.fillRect(x, m.y, w, 1.5);
    c.fillStyle = "#4a4448"; c.fillRect(x - 1, m.y - 1, 3, 7); c.fillRect(x + w - 2, m.y - 1, 3, 7);
    /* Gegengewicht/Zahnrad am Ausleger: dreht sich mit der Fahrt */
    const a = (m.y / 9) % (Math.PI * 2); c.save(); c.translate(x + w / 2, top - 1); c.rotate(a); c.fillStyle = "#5a5058"; c.fillRect(-4, -1, 8, 2); c.fillRect(-1, -4, 2, 8); c.restore();
  }
  function drawTruemmer(c, o, t) {
    if (Z.sonderPracht && Z.sonderPracht()) return; /* effekte.js zeichnet die schöne Fassung (alle Stufen) */
    /* eingestürzter Übergang: Geröllhaufen vor der zugeschütteten Öffnung, abgebrochene Bohlen auf beiden Seiten */
    const x = o.x * T, y = (o.y0 + 3) * T;
    const R = n => { const v = Math.sin(n * 12.9898 + o.x * 78.233) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < 9; i++) { const rx = x - 18 + R(i) * 52, rr = 3 + R(i + 9) * 5; c.fillStyle = i % 3 ? "#5a524c" : "#7a6e64"; c.beginPath(); c.ellipse(rx, y - rr * 0.6, rr, rr * 0.7, R(i + 3) * 3, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = "#6a4a2c"; c.save(); c.translate(x - 22, y - 3); c.rotate(-0.35); c.fillRect(0, 0, 18, 3); c.restore();
    c.save(); c.translate(x + 40, y - 9); c.rotate(0.5); c.fillRect(0, 0, 16, 3); c.restore();
    c.fillStyle = "rgba(40,30,26,.55)"; for (let i = 0; i < 5; i++) c.fillRect(x + R(i + 20) * 30, o.y0 * T + R(i + 30) * 40, 3, 2); /* Risse im Schutt */
  }

  /* ======================= W13 R7: Raum-Mechaniken ======================= */
  /* Rollende Fässer (Fasslager, Marke „o“): alle 3,6 s rollt ein Fass aus der Rutsche, 0,9 s vorher rumpelt es und staubt.
     Draufspringen federt ab (wie ein Stampfer), seitlich getroffen kostet 7 % und das Fass zerbricht. Nur in Spielernähe. */
  const solidAt = (x, y) => { const v = Z.level.get(Math.floor(x / T), Math.floor(y / T)); return v === 1 || v === 7 || v === 12; };
  const floorAt = (x, y) => { const v = Z.level.get(Math.floor(x / T), Math.floor(y / T)); return v === 1 || v === 7 || v === 12 || v === 2 || v === 10; };
  function rollTick(dt, P) {
    for (const ro of S.rollers) {
      const near = Math.abs(ro.x - P.x) < 700 && Math.abs(ro.y - P.y) < 420;
      if (near) {
        ro.t -= dt;
        if (ro.t < 0.9 && !ro.warn) { ro.warn = true; A.play("rock", { vol: 0.35, rate: 0.55, x: ro.x }); FX.burst(ro.x, ro.y - 8, 6, { col: ["#8a7a6a", "#6a5a50"], sp: 40, life: 0.6, size: 2, g: 300 }); }
        if (ro.t <= 0) { ro.t = 3.6; ro.warn = false; ro.barrels.push({ x: ro.x, y: ro.y - 7, vx: ro.dir * 95, vy: 0, r: 7, rot: 0, life: 14 }); }
      }
      for (let i = ro.barrels.length - 1; i >= 0; i--) {
        const b = ro.barrels[i]; let gone = false;
        b.life -= dt; b.vy = Math.min(520, b.vy + 1400 * dt);
        const ny = b.y + b.vy * dt;
        if (b.vy >= 0 && floorAt(b.x, ny + b.r)) { b.y = Math.floor((ny + b.r) / T) * T - b.r; b.vy = 0; } else b.y = ny;
        const nx = b.x + b.vx * dt;
        if (solidAt(nx + Math.sign(b.vx) * b.r, b.y)) gone = true; else b.x = nx;
        b.rot += b.vx * dt / b.r;
        const v = Z.level.get(Math.floor(b.x / T), Math.floor(b.y / T));
        if (v === 3 || v === 5 || v === 6 || v === 9 || b.life <= 0 || Math.floor(b.x / T / CW) !== ro.cx || Math.floor(b.y / T / CH) !== ro.cy) gone = true;
        if (!gone && !P.dead && Math.abs(P.x + P.w / 2 - b.x) < P.w / 2 + b.r - 2 && P.y + P.h > b.y - b.r && P.y < b.y + b.r) {
          if (P.vy > 40 && P.y + P.h - (b.y - b.r) < 10) { P.vy = -330; P.onGround = false; A.play("crate", { vol: 0.4, rate: 1.3, x: b.x }); Z.achEv && Z.achEv("fass"); }
          else if (!(P.iframe > 0)) { Z.hurtPlayer(Math.round(P.hpMax * 0.07), { x: b.x, kb: 180 }); gone = true; }
        }
        if (gone) { ro.barrels.splice(i, 1); if (near) { A.play("break", { vol: 0.4, x: b.x }); FX.burst(b.x, b.y, 10, { col: ["#7a5432", "#5a3a20", "#9a7448"], sp: 120, life: 0.6, size: 2.5, kind: "shard", g: 700 }); } }
      }
    }
  }
  /* Kronleuchter (Galerie/Bankett, Marke „L“): im Sprung anspringen → man hängt daran und schwingt; links/rechts gibt Schwung,
     Springen lässt mit dem Schwung los (dazu ein kleiner Satz nach oben), runter lässt einfach los. Danach 0,5 s nicht greifbar. */
  let swingTip = false;
  function swingTick(dt, P) {
    for (const s2 of S.swings) {
      s2.t += dt; if (s2.cool > 0) s2.cool -= dt;
      const hx = s2.ax + Math.sin(s2.th) * s2.L, hy = s2.ay + Math.cos(s2.th) * s2.L;
      if (P._swing === s2) {
        const inp = Z.input;
        if (P.dead || P.climbing || P.hurtT > 0.2 || inp.pressed.jump || inp.held.down) {
          P._swing = null; s2.cool = 0.5;
          if (!P.dead && inp.pressed.jump) { P.vx = U.clamp(s2.L * s2.om * Math.cos(s2.th), -340, 340); P.vy = Math.min(-230, -s2.L * s2.om * Math.sin(s2.th) - 230); A.play("jump", { vol: 0.5 }); }
          continue;
        }
        let acc = -(1420 / s2.L) * Math.sin(s2.th);
        /* Schwung holen: Drücken in Bewegungsrichtung pumpt (wie auf einer Schaukel), dagegen bremst nicht */
        const dirI = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0); if (dirI && dirI * s2.om >= -0.05) acc += 7.5 * dirI;
        s2.om = (s2.om + acc * dt) * (1 - 0.12 * dt);
        let th = s2.th + s2.om * dt; if (Math.abs(th) > 1.25) { th = Math.sign(th) * 1.25; s2.om *= -0.4; }
        const nx = s2.ax + Math.sin(th) * s2.L, ny = s2.ay + Math.cos(th) * s2.L;
        /* Körper (unter den Händen) prallt an Wänden ab */
        if (solidAt(nx - P.w / 2 + 1, ny + 2) || solidAt(nx + P.w / 2 - 1, ny + 2) || solidAt(nx, ny + P.h - 2)) { s2.om *= -0.4; }
        else s2.th = th;
        const qx = s2.ax + Math.sin(s2.th) * s2.L, qy = s2.ay + Math.cos(s2.th) * s2.L;
        P.x = qx - P.w / 2; P.y = qy - 2; P.vx = 0; P.vy = 0; P.onGround = false; P.face = s2.om >= 0 ? 1 : -1;
        if (P.airJumps != null && P.airJumps < 1) P.airJumps = 1;
        continue;
      }
      /* ruhig hängend: leichtes Pendeln */
      if (Math.abs(s2.om) > 0.01 || Math.abs(s2.th) > 0.01) { s2.om = (s2.om - (1420 / s2.L) * Math.sin(s2.th) * dt) * (1 - 0.8 * dt); s2.th += s2.om * dt; }
      if (s2.cool <= 0 && !P._swing && !P.onGround && !P.climbing && !P.dead && Math.abs(P.x + P.w / 2 - hx) < 14 && Math.abs(P.y + 6 - hy) < 16) {
        P._swing = s2; s2.th = U.clamp(Math.atan2(P.x + P.w / 2 - s2.ax, Math.max(8, P.y - s2.ay)), -1.1, 1.1); s2.om = U.clamp(P.vx / s2.L, -3, 3);
        A.play("chain", { vol: 0.5, rate: 1.2 });
        if (!swingTip) { swingTip = true; toast(L(["Am Kronleuchter: ← → für Schwung, Springen lässt mit Schwung los.", "On the chandelier: ← → to swing, jump to let go with momentum."]), 3200, { x: hx, y: hy - 20 }, { prio: 1 }); }
      }
    }
  }
  /* Gezeiten (Zisterne/Stelzensteg): 15-s-Zyklus – Ebbe 6 s, steigen, Flut 5 s, fallen; 1,5 s vor dem Steigen gurgelt es
     und Blasen steigen auf. Wasser ist sicher (Z.flutSicher: zurück auf einen trockenen Platz, kein Schaden). */
  function tideTick(dt, P) {
    for (const o of S.tides) {
      o.ph = (o.ph + dt) % 15;
      /* Wasserhöhe über der Ebbe-Linie in Pixeln: Ebbe 0–6 s, steigen 6–8 s, Flut 8–13 s, fallen 13–15 s */
      const ph = o.ph, h = ph < 6 ? 0 : ph < 8 ? (ph - 6) / 2 * 2 * T : ph < 13 ? 2 * T : (15 - ph) / 2 * 2 * T;
      o.h = h;
      const td = o.td, [cx, cy] = td.cell.split(",").map(Number), near = Math.abs(cx * CW * T + CW * T / 2 - P.x) < 700 && Math.abs(cy * CH * T + CH * T / 2 - P.y) < 400;
      if (!near) continue;
      if (ph > 4.5 && ph - dt <= 4.5) { A.play("splash", { vol: 0.35, rate: 0.5 }); for (const [x, y, s2] of td.rows) if (s2 === 1 && Math.random() < 0.5) FX.burst(x * T + 8, (y + 1) * T, 1, { col: ["#9ac0b0", "#c8e0d0"], sp: 20, ang: -Math.PI / 2, spread: 0.4, life: 0.8, size: 1.5, g: -40 }); }
      if (h < 3 || P.dead) continue;
      /* wer im gestiegenen Wasser steht: sicher zurück auf den nächsten trockenen Platz (wie die Flutkammer, kein Schaden) */
      const feet = P.y + P.h - 3, mx = P.x + P.w / 2;
      if (mx >= td.xa * T && mx < (td.xb + 1) * T && feet > td.yw * T - h + 4 && feet < td.yw * T + 2) {
        const tx = Math.floor(mx / T), ty = Math.floor(feet / T);
        if (!td.rows.some(([x, y]) => x === tx && y === ty)) continue; /* auf einem herausragenden Steg/Stein ist es trocken */
        let b = null, bd = 1e9; for (const [x, y] of td.safe) { const d = Math.abs(x - tx) + Math.abs(y - ty) * 2; if (d < bd) { bd = d; b = [x, y]; } }
        if (!b) continue;
        A.play("splash", { vol: 0.6 }); FX.burst(mx, feet, 12, { col: ["#4a6a5a", "#8aa090"], sp: 90, ang: -Math.PI / 2, spread: 1.2, life: 0.5, g: 400, size: 2 });
        P.x = b[0] * T + 8 - P.w / 2; P.y = (b[1] + 1) * T - P.h; P.vx = P.vy = 0; P.iframe = Math.max(P.iframe || 0, 0.8); P._swing = null; Z.achEv && Z.achEv("flutNass");
        const now = S.t; if (!o.tip || now - o.tip > 20) { o.tip = now; toast(L(["Die Flut steigt – warte auf die Ebbe.", "The tide is rising – wait for low water."]), 2400, { x: P.x + P.w / 2, y: P.y - 10 }, { prio: 1 }); }
      }
    }
  }
  function drawTide(c, o, t) {
    const h = o.h || 0; if (h < 0.5) return;
    const td = o.td, top = td.yw * T - h;
    c.fillStyle = "rgba(48,96,82,.62)";
    for (const [x, y] of td.rows) { const y0 = Math.max(y * T, top), y1 = (y + 1) * T; if (y1 > y0) c.fillRect(x * T, y0, T, y1 - y0); }
    c.fillStyle = "rgba(170,215,190,.55)";
    for (let x = td.xa * T; x < (td.xb + 1) * T; x += 3) if (td.rows.some(([tx, ty]) => tx === Math.floor(x / T) && ty === Math.floor((top + 1) / T))) c.fillRect(x, top + Math.sin(x * 0.4 + t * 6) * 0.8, 2, 1);
  }
  function drawBarrels(c, ro) {
    /* Rutsche: dunkler Bogen an der Wand */
    c.fillStyle = "rgba(20,12,8,.7)"; c.beginPath(); c.arc(ro.x - ro.dir * 6, ro.y - 9, 9, Math.PI, 0); c.fill(); c.fillRect(ro.x - ro.dir * 6 - 9, ro.y - 9, 18, 9);
    if (ro.warn) { c.fillStyle = "rgba(255,190,90,.8)"; c.font = "bold 10px serif"; c.textAlign = "center"; c.fillText("!", ro.x - ro.dir * 6, ro.y - 20); }
    for (const b of ro.barrels) {
      c.save(); c.translate(b.x, b.y); c.rotate(b.rot);
      c.fillStyle = "#6a4426"; c.beginPath(); c.arc(0, 0, b.r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#3a2414"; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, b.r - 1.5, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#8a8a8a"; c.fillRect(-b.r, -1, b.r * 2, 2); c.fillRect(-1, -b.r, 2, b.r * 2);
      c.restore();
    }
  }
  function drawSwing(c, s2, t) {
    const hx = s2.ax + Math.sin(s2.th) * s2.L, hy = s2.ay + Math.cos(s2.th) * s2.L;
    c.strokeStyle = "#5a5058"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s2.ax, s2.ay); c.lineTo(hx, hy); c.stroke();
    c.fillStyle = "#c8a050"; c.fillRect(hx - 12, hy, 24, 3); c.fillRect(hx - 1.5, hy - 4, 3, 5);
    for (const dx of [-11, -4, 4, 11]) { c.fillStyle = "#f0e6c8"; c.fillRect(hx + dx - 1, hy - 5, 2, 5); const f = 0.7 + 0.3 * Math.sin(t * 9 + dx); c.fillStyle = "rgba(255,200,110," + f.toFixed(2) + ")"; c.fillRect(hx + dx - 1, hy - 8, 2, 3); }
  }

  /* ======================= W13 R5: zerstörbare Umgebung ======================= */
  /* Wucht-Risse (welt.js cracks, lv.wuchtSet): leichte Treffer prallen ab (Kachel für diesen Treffer kurz fest),
     Wucht-Schläge (heavy/spin), Schildstoß, Sturzangriff und Explosionen (ohne Angriffsobjekt) brechen sie. */
  let wuchtTip = 0, morschTip = null;
  const hpW0 = Z.hitProps;
  Z.hitProps = function (r, dmg, act) {
    const lv = Z.level;
    if (!r || !lv || !lv.wuchtSet || !lv.wuchtSet.size) return hpW0 ? hpW0.apply(this, arguments) : undefined;
    const heavy = !act || !!(act.def && (act.def.heavy || act.def.spin)) || !!act.bash;
    const tmp = [];
    for (let ty = Math.floor(r.y / T); ty <= Math.floor((r.y + r.h) / T); ty++) for (let tx = Math.floor(r.x / T); tx <= Math.floor((r.x + r.w) / T); tx++) {
      const i = ty * lv.W + tx; if (!lv.wuchtSet.has(i) || lv.get(tx, ty) !== 7) continue;
      if (heavy) { lv.wuchtSet.delete(i); Z.stats && (Z.stats.wucht = (Z.stats.wucht || 0) + 1); }
      else { lv.set(tx, ty, 1); tmp.push([tx, ty]); }
    }
    const res = hpW0 ? hpW0.apply(this, arguments) : undefined;
    for (const [x, y] of tmp) lv.set(x, y, 7);
    if (tmp.length) {
      const [x, y] = tmp[0]; A.play("rock", { vol: 0.35, rate: 1.6 }); FX.burst(x * T + 8, y * T + 8, 4, { col: [Z.tileCol || "#6a5a50", "#9a8a7a"], sp: 50, life: 0.5, size: 2, g: 500 });
      const now = S ? S.t : 0;
      if (now - wuchtTip > 25) { wuchtTip = now; toast(L(["Es bröckelt nur – ein Wuchtschlag, Schildstoß oder Sturzangriff könnte es brechen.", "It only crumbles – a heavy blow, shield bash or dive attack could break it."]), 2800, { x: x * T + 8, y: y * T - 6 }, { prio: 1 }); }
    }
    return res;
  };
  /* Morsche Böden (lv.morsch): brechen unter einer schweren Landung (Sturz ≥ 4 Kacheln oder Sturzangriff) */
  function morschTick(P) {
    const lv = S.lv;
    if (!P.onGround || P._kran) { P._mPeak = P._mPeak == null ? P.y : Math.min(P._mPeak, P.y); P._mAir = true; return; }
    const fall = P._mPeak != null ? P.y - P._mPeak : 0, wasAir = P._mAir; P._mPeak = null; P._mAir = false;
    const fy = Math.floor((P.y + P.h + 1) / T);
    for (const m of lv.morsch) {
      if (m.broken || fy !== m.y || P.x + P.w <= m.x0 * T || P.x >= (m.x1 + 1) * T) continue;
      if (wasAir && (fall >= 4 * T || (P.diveRec || 0) > 0.2)) { breakMorsch(m, P); return; }
      if (morschTip !== lv) { morschTip = lv; A.play("stepWood", { vol: 0.5, rate: 0.6 }); toast(L(["Die Bohlen knarren bedrohlich …", "The planks creak ominously…"]), 2200, { x: P.x + P.w / 2, y: P.y - 8 }, { prio: 0 }); }
    }
  }
  function breakMorsch(m, P) {
    const lv = S.lv; m.broken = true;
    for (let x = m.x0; x <= m.x1; x++) lv.set(x, m.y, 0);
    Z.dirtyTiles && Z.dirtyTiles(m.x0, m.y);
    A.play("break", { vol: 0.8 }); A.play("crate", { vol: 0.5, rate: 0.7 }); FX.addShake(4);
    FX.burst((m.x0 + 1.5) * T, m.y * T + 8, 22, { col: ["#7a5432", "#5a3a20", "#9a7448"], sp: 150, life: 0.9, size: 3, kind: "shard", g: 700, drag: 0.98 });
    if (P) { P.onGround = false; P.vy = Math.max(P.vy, 120); }
    Z.stats && (Z.stats.morsch = (Z.stats.morsch || 0) + 1);
  }
  function drawMorsch(c, m) {
    const x = m.x0 * T, y = m.y * T, w = (m.x1 - m.x0 + 1) * T;
    c.fillStyle = "#5a3e26"; c.fillRect(x - 1, y, w + 2, 7); c.fillStyle = "#7a5634"; c.fillRect(x - 1, y, w + 2, 2);
    c.fillStyle = "#3a2616"; for (let i = 1; i < 6; i++) c.fillRect(x + (w / 6) * i, y, 1, 7); /* Fugen */
    c.strokeStyle = "rgba(25,15,8,.9)"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w * 0.3, y + 1); c.lineTo(x + w * 0.42, y + 4); c.lineTo(x + w * 0.38, y + 7); c.moveTo(x + w * 0.66, y); c.lineTo(x + w * 0.6, y + 5); c.stroke(); /* Risse */
    c.fillStyle = "rgba(10,6,4,.55)"; c.fillRect(x, y + 7, w, 9); /* Hohlraum unter den Bohlen */
  }

  /* ======================= Ablauf ======================= */
  const tick0 = Z.ebenenTick;
  /* W13 R3 Handheld: Anzeige- und Buchhaltungsteile (Ziel-Hinweis, Zeitzähler der Zeichnungen, Hebel-Schwung, Geheimkammer-
     und Ausgangs-Hinweis) einmal pro Bild mit gesammelter Zeit; Aufheben von Fundstücken/Schlüsseln und die Prüfung bleiben
     je Teilschritt (sonst könnte man bei schnellem Fall an einem Fundstück vorbeirutschen). */
  const erTakt0 = Z.bildTakt ? Z.bildTakt() : null, erTakt = dt => (!erTakt0 || Z.ebenenCull === false ? dt : erTakt0(dt)); /* Prüfschalter Z.ebenenCull=false: wie vorher */
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    const P = Z.player; if (!S || !P || P.dead || Z.level !== S.lv) return;
    const px = P.x + P.w / 2, py = P.y + P.h;
    for (const r of S.rewards) if (!r.open && Math.abs(r.x - px) < 15 && Math.abs(r.y - py) < 22) openReward(r);
    for (const k of S.keys) {
      if (!k.got && Math.abs(k.x - px) < 16 && Math.abs(k.y - 8 - py) < 26) {
        k.got = true; give("schluessel", k.x, k.y - 4, 0);
        A.play("chain", { vol: 0.6, rate: 1.5 }); FX.burst(k.x, k.y - 14, 18, { col: ["#ffd27a", "#fff0c0"], sp: 90, life: 0.6, size: 2, kind: "spark", add: true });
        toast("⚷ <b>" + L(["Schlüssel", "Key"]) + "</b><small>" + L(["Irgendwo wartet eine verschlossene Kammer.", "A locked chamber waits somewhere."]) + "</small>", 3200, { x: k.x, y: k.y - 18 }, { prio: 1, art: "gold" });
      }
    }
    if (S.trial) trialTick(S.trial, dt);
    if (S.kraene.length) kranTick(dt, P);
    if (S.rollers.length) rollTick(dt, P);
    if (S.swings.length) swingTick(dt, P);
    if (S.tides.length) tideTick(dt, P);
    if (S.lv.morsch && S.lv.morsch.length) morschTick(P);
    const bt = erTakt(dt); if (!(bt > 0)) return;
    S.t += bt;
    zielTick(bt, px, py);
    for (const r of S.rewards) r.t += bt;
    for (const k of S.keys) k.t += bt;
    for (const o of S.levers) if (o.pulled && o.a < 1) o.a = Math.min(1, o.a + bt * 4);
    for (const s of S.shrines) s.t += bt;
    /* W13 R5: bröckelnder Putz an Wucht-Rissen im Bild – kleine Staubkrümel als Hinweis */
    if (S.lv.wucht && S.lv.wucht.length && (S.putzT = (S.putzT || 0) - bt) <= 0) {
      S.putzT = 0.45; const cam = Z.cam;
      for (const o of S.lv.wucht) { const tl = o.tiles.filter(([x, y]) => S.lv.get(x, y) === 7); if (!tl.length) continue; const [x, y] = tl[(Math.random() * tl.length) | 0];
        if (cam && x * T > cam.x - 16 && x * T < cam.x + cam.w + 16 && y * T > cam.y - 16 && y * T < cam.y + cam.h + 16) FX.burst(x * T + 2 + Math.random() * 12, y * T + 14, 1, { col: ["#8a7a6a", "#6a5a50"], sp: 10, ang: Math.PI / 2, spread: 0.5, life: 0.8, size: 1.5, g: 300 }); }
    }
    /* Geheimkammern: gefunden, sobald man drinsteht */
    const ck = Math.floor(px / T / CW) + "," + Math.floor((P.y + P.h / 2) / T / CH);
    if (S.secretCells.has(ck)) found("secret:" + ck, L(["Eine verborgene Kammer.", "A hidden chamber."]));
    /* vor dem Ausgang: Bilanz der Geheimnisse */
    if (!S.exitTip && S.total > 0) for (const d of S.lv.doors) if (d.kind === "exit" && Math.abs(d.x * T + 8 - px) < 70 && Math.abs((d.y + 1) * T - py) < 40) {
      S.exitTip = true;
      const n = S.found.size, rest = S.rewards.filter(r => !r.open).length;
      toast("✦ <b>" + L(["Geheimnisse hier", "Secrets here"]) + ": " + n + "/" + S.total + "</b>" + (rest ? "<small>" + L(["Noch ", "Still "]) + rest + L([" Fundstücke abseits des Weges", " finds off the beaten path"]) + "</small>" : ""), 3400, { x: d.x * T + 8, y: d.y * T - 6 }, { prio: rest ? 1 : 0, art: "gold" });
      break;
    }
  };

  /* ======================= Zeichnen ======================= */
  const COL = { gold: ["#ffd27a", "#c08a2a"], glut: ["#ff8a2a", "#ffd080"], waffe: ["#e8dcc8", "#ffd27a"], rolle: ["#f0e0b0", "#c04040"], heil: ["#ff5a5a", "#ffc0a0"], segen: ["#ffe9a0", "#ff9a5a"], runenstein: ["#ffb347", "#ff6a3a"], bewegung: ["#ff5a4e", "#ffd27a"] };
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
    else if (k === "runenstein" || k === "bewegung") { c.fillStyle = "#3a302c"; c.beginPath(); c.ellipse(0, -7, 5, 6.5, 0, 0, TAU); c.fill(); c.strokeStyle = COL[k][0]; c.lineWidth = 1; c.stroke(); c.fillStyle = COL[k][0]; c.font = "700 7px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(k === "bewegung" ? "ᛟ" : "ᚱ", 0, -6.5); }
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
    if (g.open || g.flut) return;
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
    for (const m of S.kraene || []) if (m.x > vx0 - 40 && m.x < vx1 && m.y1 > vy0 && m.y0 - 60 < vy1) drawKran(c, m, t);
    for (const o of S.specials || []) if (o.k === "bruecke" && vis(o.x * T, o.y0 * T)) drawTruemmer(c, o, t);
    for (const m of S.lv.morsch || []) if (!m.broken && vis(m.x0 * T, m.y * T)) drawMorsch(c, m);
    for (const ro of S.rollers || []) if (vis(ro.x, ro.y) || ro.barrels.length) drawBarrels(c, ro);
    for (const s2 of S.swings || []) if (vis(s2.ax, s2.ay + s2.L)) drawSwing(c, s2, t);
    for (const o of S.tides || []) if (vis(o.td.xa * T, o.td.yw * T)) drawTide(c, o, t);
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
     ein violetter zur verschlossenen Kammer. Er erscheint NICHT mehr von selbst nach Sekunden, sondern erst
     nach längerer Ziellosigkeit (kein Fortschritt zum Ausgang, nichts Neues entdeckt, kein Kampf) –
     oder auf Wunsch: Karte öffnen (M / Select) zeigt ihn für einige Sekunden. */
  const ZIELLOS = 45;
  function zielTick(dt, px, py) {
    let bd = 1e9;
    for (const d of S.lv.doors) if (d.kind === "exit") bd = Math.min(bd, Math.hypot(d.x * T + 8 - px, (d.y + 0.5) * T - py));
    if (S.zBest == null || bd < S.zBest - 64) { S.zBest = bd; S.ziellos = 0; }
    let kampf = !!Z.boss;
    if (!kampf) for (const e of Z.enemies) if (!e.dead && e.aware && !e.dummy && Math.abs(e.x - px) < 300 && Math.abs(e.y - py) < 200) { kampf = true; break; }
    if (S.found.size !== S.zFound) { S.zFound = S.found.size; S.ziellos = Math.min(S.ziellos || 0, 10); }
    if (!kampf) S.ziellos = (S.ziellos || 0) + dt;
  }
  function zeigeWeg() {
    const ping = Z.ui && Z.ui.mapPing ? (performance.now() - Z.ui.mapPing) / 1000 : 99;
    if (ping < 9) return Math.min(1, ping * 4) * Math.min(1, (9 - ping) / 1.5);
    return Math.min(0.85, Math.max(0, ((S.ziellos || 0) - ZIELLOS) / 4));
  }
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
    if (!S || Z.level !== S.lv || (Z.settings && Z.settings.wegweiser === false)) return;
    const P = Z.player; if (!P || P.dead) return;
    const wa = zeigeWeg(); if (wa <= 0.01) return;
    const px = P.x + P.w / 2, py = P.y + P.h / 2;
    let best = null, bd = 1e9;
    for (const d of S.lv.doors) if (d.kind === "exit") { const dd = Math.hypot(d.x * T + 8 - px, (d.y + 0.5) * T - py); if (dd < bd) { bd = dd; best = d; } }
    if (best) arrow(c, cam, best.x * T + 8, (best.y + 0.5) * T, "#ffd27a", wa, t);
    if (hasKey()) for (const o of S.locks) if (!o.open) arrow(c, cam, o.x, (o.f.y0 + 1.5) * T, "#c88aff", wa, t);
  };

  Z.erkundung = () => S;
})();
