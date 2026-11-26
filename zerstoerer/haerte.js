/* Ezekiel – The Destroyer · Härtegrade (W9 Härte)
   Nach dem ersten Sieg (jedes der drei Enden zählt) wird die nächste Härte frei – wie „Boss Cells“.
   Die Härte IST die bestehende Schädel-Stufe (Z.run.skulls / Z.meta.skulls / Z.meta.skullSel, freigeschaltet in ui.js beim Ende):
   dort bleiben die Zahlen (Leben +25 %, Schaden +22 %, Fallen +0,09 je Stufe). Diese Datei legt je Härte kumulativ
   eigene Regeln, Belohnungen, einen Altar im Lager, Umhänge/Titel und Erfolge darauf.
   Schnittstelle (für Lauf-Rückblick/Weltkarte, W21): Z.run.haerte = { stufe, name:[de,en] } · Z.meta.haerte = { max, sel, siege:{1..5} }
   Z.haerte.stufe() · Z.haerte.def(n) · Z.haerte.wahl() (Fenster öffnen). Nichts direkt in localStorage (Z.saveMeta).
   Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const MAXH = 5;
  const H = [
    null,
    { n: ["Härte I · Unruhe", "Hardness I · Unrest"], k: ["Mehr Elitegegner, und Gäste aus tieferen Gebieten mischen sich unter die Gruppen.", "More elites, and guests from deeper areas join the groups."], col: "#c8a060" },
    { n: ["Härte II · Dürre", "Hardness II · Drought"], k: ["Heilquellen halb so oft, weniger Heilfunde.", "Healing springs half as often, fewer healing finds."], col: "#d08a3a" },
    { n: ["Härte III · Tempo", "Hardness III · Pace"], k: ["Gegner holen schneller aus und erholen sich schneller (Vorwarnung nie unter 0,3 s), Bosse drängen.", "Enemies wind up and recover faster (warning never below 0.3 s), bosses press on."], col: "#e05a3a" },
    { n: ["Härte IV · Wacht", "Hardness IV · Vigil"], k: ["Mehr Fallen; Wächter rufen bei halbem Leben Verstärkung.", "More traps; wardens call reinforcements at half health."], col: "#b0303a" },
    { n: ["Härte V · Fluch", "Hardness V · Curse"], k: ["Fluchzonen: in zwei Räumen je Gebiet trifft alles härter und Funde heilen nur halb – wer dort tötet, bekommt mehr Splitter.", "Curse zones: in two rooms per area everything hits harder and finds heal only half – kills there yield more shards."], col: "#9a3aa0" }
  ];
  const LOHN = [null, ["+10 % Splitter", "+10% shards"], ["+20 % Splitter", "+20% shards"], ["+30 % Splitter, Glut von Elites", "+30% shards, embers from elites"], ["+40 % Splitter, Glut von Elites", "+40% shards, embers from elites"], ["+50 % Splitter, Glut von Elites", "+50% shards, embers from elites"]];
  const CAPE = { 1: ["haerte1", ["Feldstein", "Fieldstone"], ["#7a6a5a", "#3a302a"]], 2: ["haerte2", ["Dürregold", "Drought Gold"], ["#c08a2a", "#5a3a0c"]], 3: ["haerte3", ["Hetzrot", "Chase Red"], ["#c0381e", "#5a1008"]],
    4: ["haerte4", ["Wachtschwarz", "Vigil Black"], ["#2a2224", "#0e0a0a"]], 5: ["haerte5", ["Fluchviolett", "Curse Violet"], ["#6a2a7a", "#2a0a30"]] };
  const TITEL = { 1: ["der Unruhige", "the Restless"], 2: ["der Durstige Wanderer", "the Thirsty Wanderer"], 3: ["der Gehetzte", "the Hunted"], 4: ["der Wachsame", "the Vigilant"], 5: ["der Verfluchte", "the Accursed"] };

  const M = () => Z.meta;
  const stufe = () => Math.max(0, Math.min(MAXH, (Z.run && Z.run.skulls) || 0));
  const ab = n => stufe() >= n;
  const normalArea = lv => lv && !lv.hub && !lv.arena && !lv.passage;
  function metaH() { const m = M(); const h = m.haerte || (m.haerte = { siege: {} }); h.max = Math.min(MAXH, m.skulls || 0); h.sel = m.skullSel || 0; h.siege = h.siege || {}; return h; }

  /* ---------- Lauf: Kennung für Rückblick/HUD ---------- */
  const nr0 = Z.newRun;
  Z.newRun = function () { const r = nr0.apply(this, arguments); try { if (Z.run) { const s = stufe(); Z.run.haerte = { stufe: s, name: s ? H[s].n : ["Härte 0", "Hardness 0"] }; } metaH(); } catch (e) { console.error("haerte", e); } return r; };

  /* ---------- H1: Elite + Gäste aus tieferen Gebieten / H3: Tempo / H4: Wächter-Verstärkung ---------- */
  function gastId(lv) {
    const t = ((Z.BIOMES[lv.biome] || {}).tier || 0) + 1, cand = Object.keys(Z.BIOMES).filter(k => (Z.BIOMES[k].tier || 0) === t && Z.BIOMES[k].foes);
    if (!cand.length) return null;
    const foes = Z.BIOMES[Z.R.pick ? Z.R.pick(cand) : cand[0]].foes, ids = Object.keys(foes).filter(id => Z.ENEMIES[id] && !Z.ENEMIES[id].boss && !Z.ENEMIES[id].fly);
    if (!ids.length) return null; let sum = 0; for (const id of ids) sum += foes[id]; let r = Z.R() * sum; for (const id of ids) { r -= foes[id]; if (r <= 0) return id; } return ids[0];
  }
  const sp0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    o = o || {};
    const lv = Z.level, def = Z.ENEMIES[id], plain = def && !def.boss && !/^mb_/.test(id) && !o.master && normalArea(lv) && !(Z.boss && !Z.bossDefeated);
    if (plain && ab(1) && !o.elite) {
      if (Z.R() < 0.12) { const g = gastId(lv); if (g) id = g; } /* Gast aus der nächsten Stufe (gleiche Anzahl Gegner) */
      if (Z.R() < 0.08) o = Object.assign({}, o, { elite: true });
    }
    const e = sp0.call(this, id, x, y, o);
    try {
      if (e && ab(3)) {
        if (e.def.boss) e.tempoBonus = (e.tempoBonus || 1) * 1.08; /* kürzere Pausen, die Vorwarnungen bleiben (bossphasen) */
        else if (e.def.atks && !e._hT) { e._hT = 1; e.def = Object.assign({}, e.def, { atks: e.def.atks.map(a => Object.assign({}, a, { pre: a.pre ? Math.max(Math.min(a.pre, 0.3), a.pre * 0.85) : a.pre, cd: a.cd ? a.cd * 0.85 : a.cd })) }); }
      }
    } catch (err) { console.error("haerte", err); }
    return e;
  };
  const ue0 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    const r = ue0.apply(this, arguments);
    try {
      const b = Z.boss;
      if (b && b.warden && !b.dead && ab(4) && !b._hAdd && b.hp < b.hpMax * 0.5 && !b.trans) {
        b._hAdd = true; const lv = Z.level, foes = (Z.BIOMES[lv.biome] || {}).foes || {}, ids = Object.keys(foes).filter(i => Z.ENEMIES[i] && !Z.ENEMIES[i].boss);
        for (const s of [-1, 1]) { const id = ids.length ? ids[(Z.R() * ids.length) | 0] : null; if (!id) break; const e = sp0(id, b.x + b.w / 2 + s * 90, b.y + b.h, { tier: (Z.run && Z.run.tier) || 0 }); if (e) { e.aware = true; e.master = b; e.spawnT = 0.6; FX.burst(e.x + e.w / 2, e.y + e.h / 2, 12, { col: ["#3a3030", "#b0303a"], sp: 70, life: 0.5, size: 3, kind: "smoke" }); } }
        FX.text(b.x + b.w / 2, b.y - 16, L(["Der Wächter ruft Verstärkung!", "The warden calls for aid!"]), "#e05a3a", true);
      }
    } catch (err) { console.error("haerte", err); }
    return r;
  };

  /* ---------- H2: Dürre ---------- */
  if (Z.QUELLE && Z.QUELLE.chance) { const qc0 = Z.QUELLE.chance; Z.QUELLE.chance = lv => qc0(lv) * (ab(2) ? 0.5 : 1); }
  const sr0 = Z.spawnReward;
  if (sr0) Z.spawnReward = function (kind) { if (kind === "heil" && ab(2) && Z.R() < 0.35) return null; return sr0.apply(this, arguments); };

  /* ---------- H4: mehr Fallen ---------- */
  const ff0 = Z.fallenFaktor;
  Z.fallenFaktor = () => ((ff0 ? ff0() : 1) || 1) * (ab(4) ? 1.25 : 1);

  /* ---------- H5: Fluchzonen ---------- */
  function fluchSetup(lv) {
    lv._fluch = null;
    if (!ab(5) || !normalArea(lv) || !lv.cells || !((Z.BIOMES[lv.biome] || {}).tier)) return; /* nicht im Torhof: H5-Messung starb 3/4 schon in Stufe 0–2 */
    const key = (x, y) => x + "," + y, ex = new Set([lv.startCell && key(lv.startCell.x, lv.startCell.y), lv.endCell && key(lv.endCell.x, lv.endCell.y), lv.warden && lv.warden.cell && key(lv.warden.cell.x, lv.warden.cell.y)].filter(Boolean));
    const cand = Object.keys(lv.cells).filter(k => lv.cells[k].kind === "path" && !ex.has(k));
    const pick = []; while (cand.length && pick.length < 2) pick.push(cand.splice((Z.R() * cand.length) | 0, 1)[0]);
    lv._fluch = new Set(pick); lv._fluchTip = false;
  }
  const inFluch = (x, y) => { const lv = Z.level; return !!(lv && lv._fluch && lv._fluch.size && lv._fluch.has(Math.floor(x / T / Z.CW) + "," + Math.floor(y / T / Z.CH))); };
  const pIn = () => { const P = Z.player; return P && inFluch(P.x + P.w / 2, P.y + P.h / 2); };
  Z.haerteInFluch = inFluch; /* W27 Koop: Fluchzonen gelten auch für Spieler 2 (koop.js) */
  const la0 = Z.loadArea;
  Z.loadArea = function () { const r = la0.apply(this, arguments); try { fluchSetup(Z.level); } catch (e) { console.error("haerte", e); } return r; };
  const hp0 = Z.hurtPlayer;
  Z.hurtPlayer = function (d, o) { if (typeof d === "number" && d > 0 && pIn()) d *= 1.25; return hp0.call(this, d, o); };
  const hl0 = Z.healPlayer;
  if (hl0) Z.healPlayer = function (n) { if (typeof n === "number" && n > 0 && pIn()) n *= 0.5; return hl0.call(this, n); };
  let fluchT = 0;
  const up0 = Z.updatePickups;
  Z.updatePickups = function (dt) {
    const r = up0.apply(this, arguments);
    try { const lv = Z.level; if (lv && lv._fluch && pIn() && !lv._fluchTip) { lv._fluchTip = true; Z.toast && Z.toast("☠ " + L(["Fluchzone: Treffer härter, Heilung halb – Kills geben mehr Splitter.", "Curse zone: hits harder, healing halved – kills give more shards."]), 3000); A.play("dark", { vol: 0.4 }); } } catch (_) {}
    return r;
  };

  /* ---------- Belohnungen ---------- */
  const ds0 = Z.dropShards;
  Z.dropShards = function (x, y, n) { const s = stufe(); if (s && typeof n === "number") n *= 1 + 0.1 * s; if (typeof n === "number" && inFluch(x, y)) n *= 1.5; return ds0.call(this, x, y, n); };
  const ke0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && !e.dead;
    const r = ke0.apply(this, arguments);
    try { if (was && e.elite && ab(3) && Z.R() < 0.04 * stufe() && Z.spawnReward) Z.spawnReward("glut", e.x + e.w / 2, e.y + e.h / 2, { n: 1 }); } catch (_) {}
    return r;
  };
  /* Sieg auf Härte n merken (alle drei Enden zählen; Barmherzigkeit zählt nicht) */
  function onEnding() {
    const run = Z.run; if (!run || run._hEnd || run.gnade || Z.player && Z.player.dead) return; run._hEnd = true;
    const s = stufe(), h = metaH(); if (!s) return;
    h.siege[s] = (h.siege[s] || 0) + 1;
    const m = M(); m.capes = m.capes || {};
    if (!m.capes[CAPE[s][0]]) { m.capes[CAPE[s][0]] = 1; Z.ui.notify && Z.ui.notify("☠ <b>" + esc(L(H[s].n)) + "</b><br><small>" + L(["Neuer Umhang: ", "New cape: "]) + esc(L(CAPE[s][1])) + "</small>", { prio: 1, art: "sieg", dauer: 3600 }); }
    Z.saveMeta();
  }
  function hookEnding() { if (!Z.ui || !Z.ui.ending || Z.ui._hEnd) return false; const e0 = Z.ui.ending; Z.ui.ending = function () { try { onEnding(); } catch (err) { console.error("haerte", err); } return e0.apply(this, arguments); }; Z.ui._hEnd = true; return true; }
  if (!hookEnding()) window.addEventListener("load", hookEnding);

  /* Umhänge und Erfolge je Härte */
  if (Z.CAPES) for (const n in CAPE) Z.CAPES[CAPE[n][0]] = { n: CAPE[n][1], c: CAPE[n][2] };
  if (Z.ACH) for (let n = 1; n <= MAXH; n++) {
    if (Z.ACH.some(a => a.id === "h_" + n)) continue;
    Z.ACH.push({ id: "h_" + n, c: "bosse", n: H[n].n, d: ["Ein Ende auf Härte " + n + " erreichen.", "Reach an ending on Hardness " + n + "."], ok: () => ((metaH().siege || {})[n] || 0) >= 1, r: { titel: TITEL[n] } });
  }

  /* ---------- Lager: Altar der Härte ---------- */
  function wahlHTML() {
    const h = metaH(), mx = h.max, sel = h.sel;
    let rows = "";
    for (let i = 0; i <= MAXH; i++) {
      const frei = i <= mx, d = H[i];
      rows += '<button class="hw-zeile' + (i === sel ? " an" : "") + '" data-act="haerteWahl" data-arg="' + i + '"' + (frei ? "" : " disabled") + ' style="--hc:' + (d ? d.col : "#c4bcae") + '">' +
        "<b>" + (i ? "☠".repeat(i) + " " + esc(L(d.n)) : esc(L(["Härte 0 · Die Feste", "Hardness 0 · The Keep"]))) + "</b>" +
        "<small>" + (i ? esc(L(d.k)) + " · " + esc(L(["Lohn: ", "Reward: "])) + esc(L(LOHN[i])) + ((h.siege[i] || 0) ? " · " + L(["Siege: ", "Wins: "]) + h.siege[i] : "") : esc(L(["Die Feste, wie du sie kennst.", "The keep as you know it."]))) +
        (frei ? "" : " · " + esc(L(["gesperrt – gewinne auf Härte " + (i - 1), "locked – win on Hardness " + (i - 1)]))) + "</small></button>";
    }
    return '<div class="haertewahl"><h2>' + esc(L(["Altar der Härte", "Altar of Hardness"])) + '</h2><p class="hinweis">' +
      esc(L(["Jede Härte gilt zusätzlich zu allen darunter: Gegner zäher und stärker (+25 % Leben, +22 % Schaden je Stufe) und die Regeln unten. Jeder Sieg öffnet die nächste.", "Each hardness adds to all below: tougher, stronger enemies (+25% health, +22% damage per level) plus the rules below. Every win opens the next."])) +
      "</p>" + rows + (mx === 0 ? '<p class="hinweis">' + esc(L(["Erreiche ein Ende, um Härte I freizuschalten.", "Reach an ending to unlock Hardness I."])) + "</p>" : "") +
      '<div class="knoepfe"><button data-act="close" autofocus>' + esc(L(["Fertig", "Done"])) + "</button></div></div>";
  }
  function wahl() { Z.ui.open(wahlHTML(), { cls: "schmal" }); }
  Z.ui.actions.haerteWahl = i => { const n = +i; if (n > metaH().max) return; M().skullSel = n; metaH(); Z.saveMeta(); A.play("bell", { vol: 0.4, rate: 0.8 + 0.06 * n }); wahl(); };
  const css = document.createElement("style");
  css.textContent = ".haertewahl .hw-zeile{display:block;width:100%;text-align:left;margin:4px 0;padding:6px 9px;border:1px solid var(--hc);background:rgba(30,18,16,.85);color:#efe2c8}" +
    ".haertewahl .hw-zeile b{color:var(--hc)}.haertewahl .hw-zeile small{display:block;opacity:.85;margin-top:2px}.haertewahl .hw-zeile.an{box-shadow:0 0 0 2px var(--hc) inset;background:rgba(70,30,20,.9)}" +
    ".haertewahl .hw-zeile:disabled{opacity:.45}";
  document.head.appendChild(css);
  function drawAltar(c, x, y, t) {
    const s = metaH().sel, col = s ? H[s].col : "#c4bcae", glow = 0.5 + 0.25 * Math.sin(t * 2.4);
    c.save();
    c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(x, y, 13, 2.6, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#3a3030"; c.fillRect(x - 10, y - 14, 20, 14); c.fillStyle = "#4e4240"; c.fillRect(x - 12, y - 17, 24, 4); c.fillStyle = "#2a2222"; c.fillRect(x - 10, y - 4, 20, 2);
    c.fillStyle = "#5e5250"; for (let i = -8; i <= 6; i += 7) c.fillRect(x + i, y - 12, 2, 7);
    /* Schädel auf dem Altar */
    c.fillStyle = "#e8dcc8"; c.beginPath(); c.arc(x, y - 22, 5, 0, Math.PI * 2); c.fill(); c.fillRect(x - 3, y - 19, 6, 3);
    c.fillStyle = "#1a1010"; c.fillRect(x - 3, y - 23, 2, 2); c.fillRect(x + 1, y - 23, 2, 2); c.fillRect(x - 1, y - 19, 1, 2); c.fillRect(x + 1, y - 19, 1, 2);
    /* Glut in den Augen je nach Wahl, kleine Schädelreihe = gewählte Härte */
    c.globalCompositeOperation = "lighter"; Z.draw && Z.draw.glow && Z.draw.glow(c, x, y - 22, 12 + 4 * glow, col.replace("#", "").length === 6 ? "rgba(" + parseInt(col.slice(1, 3), 16) + "," + parseInt(col.slice(3, 5), 16) + "," + parseInt(col.slice(5, 7), 16) + "," + (0.25 + 0.2 * glow).toFixed(2) + ")" : col);
    c.globalCompositeOperation = "source-over";
    for (let i = 0; i < s; i++) { c.fillStyle = col; c.fillRect(x - 9 + i * 4, y - 10, 2.5, 2.5); }
    c.restore();
  }
  function installAltar() {
    if (!Z.lager || !Z.lager.station) return false;
    Z.lager.station("haerte", {
      n: ["Altar der Härte", "Altar of Hardness"],
      label: () => { const h = metaH(); return L(["Altar der Härte", "Altar of Hardness"]) + " · " + (h.max ? (h.sel ? "☠".repeat(h.sel) : L(["Härte 0", "Hardness 0"])) : L(["verschlossen", "sealed"])); },
      use: () => wahl(), draw: (c, x, y, t) => drawAltar(c, x, y, t)
    });
    return true;
  }
  if (!installAltar()) window.addEventListener("load", installAltar);

  /* Fluchzonen sichtbar machen: dunkles Violett über den Räumen, aufsteigende Funken */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) {
    if (al0) al0.apply(this, arguments);
    try {
      const lv = Z.level; if (!lv || !lv._fluch || !lv._fluch.size) return;
      for (const k of lv._fluch) {
        const [cx, cy] = k.split(",").map(Number), x0 = cx * Z.CW * T, y0 = cy * Z.CH * T, w = Z.CW * T, h = Z.CH * T;
        c.save(); c.fillStyle = "rgba(60,10,60,.16)"; c.fillRect(x0, y0, w, h); c.restore();
        if (Math.random() < 0.25) FX.p({ x: x0 + Math.random() * w, y: y0 + h - 4 - Math.random() * h * 0.6, vx: 0, vy: -18, life: 1.2, size: 1.4, col: "#b05ac0", kind: "glow", add: true });
      }
    } catch (e) { /* still */ }
  };

  Z.haerte = { stufe, def: n => H[n] || null, wahl, meta: metaH, MAX: MAXH, _fluch: () => Z.level && Z.level._fluch ? [...Z.level._fluch] : [] };
})();
