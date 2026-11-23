/* Ezekiel – The Destroyer · Glutschmiede
   1) Start-Ausrüstung liegt im Lager am Waffenständer – aufheben mit den echten Tasten, wie später im Lauf.
   2) Waffen-Stufen +0 … +5: Schmiedeglut (neues Material) + Gold am Glutamboss. Bei +2 und +4 eine Runen-Gravur
      aus drei zur Wahl. Schmiede-Vorführung mit Hammerschlägen, Funken und Glühen (Spiel steht still).
   3) Meta: Nundros Glutschmiede (Seelensplitter) – vorgeschmiedete Startwaffen, volleres Gestell, Runenkunde …
   4) Kampf-Ideen: Faden-Markierung (Fernkampf markiert, Nahkampf vollstreckt), Adrenalin nach perfektem Ausweichen,
      Kill-Ketten mit Gold-Multiplikator, Elite-Glut, Herausforderungen je Gebiet.
   Schnittstellen für andere Module: Z.spawnReward(kind, x, y, opts), Z.hasKey(), Z.useKey(), Z.placeAnvil(x, y, opts),
   Z.placeAnvilTile(tx, ty, opts). Koordinaten in Weltpixeln, y = Bodenhöhe (Füße). Farben: Gold, Rot, Violett, Grün – kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v), inp = Z.input, ui = Z.ui;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : window.setTimeout(fn, ms));
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const F = () => (Z.meta.forge = Z.meta.forge && typeof Z.meta.forge === "object" ? Z.meta.forge : {});
  const tierNow = () => (Z.run ? Z.run.tier || 0 : 0);
  const keyHint = a => { const k = inp.device === "touch" || (ui.touchOn && inp.device !== "pad") ? "" : inp.label(a); return k ? "<kbd>" + esc(k) + "</kbd>" : ""; };
  const digitHint = n => (inp.device === "keys" && !ui.touchOn ? "<kbd>" + n + "</kbd> " : "");

  /* ======================= ZAHLEN ======================= */
  const MAXP = 5;
  const PLUS_DMG = 0.15;                     /* +15 % Schaden je Stufe (additiv): +5 = ×1,75 */
  const GLUT_COST = [1, 1, 2, 2, 3];        /* Glut für +1 … +5 (zusammen 9) */
  const RUNE_AT = [2, 4];                   /* Gravur-Wahl bei diesen Stufen */
  const goldCost = (p, tier) => Math.round((45 + 30 * p) * (1 + 0.5 * tier) * (1 - 0.15 * (F().rabatt || 0)) / 5) * 5;
  const glutMul = () => 1 + 0.25 * (F().glut || 0);
  const chainMul = n => (n >= 12 ? 2 : n >= 8 ? 1.75 : n >= 5 ? 1.5 : n >= 3 ? 1.25 : 1);
  const PLUS_COL = ["#c4bcae", "#efe0a8", "#ffd27a", "#ffa040", "#ff6a3a", "#ff4ab0"];
  Z.plusCol = p => PLUS_COL[clamp(p | 0, 0, MAXP)];
  Z.itemTitle = it => { const d = Z.itemDef(it); if (!d) return ""; return L(d.n) + (it.plus ? " +" + it.plus : ""); };
  Z.hasRune = (it, r) => !!(it && it.runes && it.runes.includes(r));
  Z.SCHMIEDE = { MAXP, PLUS_DMG, GLUT_COST, RUNE_AT, goldCost, chainMul };
  const isWeapon = it => !!(it && it.type === "weapon" && Z.WEAPONS[it.id]);

  /* ======================= STUFE IM SCHADEN ======================= */
  const mul0 = Z.itemMul;
  Z.itemMul = it => mul0(it) * (it && it.plus ? 1 + PLUS_DMG * it.plus : 1);
  const price0 = Z.itemPrice;
  Z.itemPrice = it => Math.round(price0(it) * (1 + 0.25 * (it.plus || 0) + 0.15 * ((it.runes || []).length)));

  /* Funde: tiefere Gebiete → höhere Grundstufe; Bosse +1; mit Runenkunde manchmal schon graviert */
  function pickRunes(it, n) {
    const d = Z.itemDef(it), have = it.runes || [];
    const pool = Object.keys(Z.RUNES).filter(k => !have.includes(k) && !(d && d.kind === "shield" && Z.RUNES[k].noShield));
    return Z.R.shuffle(pool).slice(0, n);
  }
  let dropCtx = null;
  function basePlus(tier, o) {
    let p = Math.floor(tier / 3); if (Z.R() < (tier % 3) * 0.25) p++;
    if (o && o.boss) p++; else if (o && o.elite && Z.R() < 0.3) p++;
    return clamp(p, 0, 3);
  }
  const roll0 = Z.rollItem;
  Z.rollItem = function (o) {
    const it = roll0.apply(this, arguments);
    if (it && it.type === "weapon" && it.plus == null && Z.run) {
      const tier = o && o.tier != null ? o.tier : tierNow();
      it.plus = basePlus(tier, dropCtx);
      const ch = 0.1 * (F().gravur || 0) + (dropCtx && dropCtx.boss ? 0.2 : 0);
      if (ch > 0 && Z.R() < ch) it.runes = pickRunes(it, 1);
    }
    return it;
  };
  const drop0 = Z.dropItem;
  Z.dropItem = function (x, y, o) { const prev = dropCtx; dropCtx = o || {}; try { return drop0.apply(this, arguments); } finally { dropCtx = prev; } };

  /* ======================= SPIELER: Glut und Schlüssel ======================= */
  const np0 = Z.newPlayer;
  Z.newPlayer = function () { const P = np0.apply(this, arguments); P.glut = 0; P.keys = 0; return P; };
  const start0 = Z.startRun;
  Z.startRun = function () {
    const r = start0.apply(this, arguments);
    const P = Z.player; if (P) { P.glut = F().beutel || 0; P.keys = 0; }
    chain.n = 0;
    return r;
  };
  Z.hasKey = () => !!(Z.player && Z.player.keys > 0);
  Z.useKey = () => { const P = Z.player; if (!P || !(P.keys > 0)) return false; P.keys--; A.play("chain", { vol: 0.5, rate: 1.3 }); return true; };

  /* ======================= BELOHNUNGEN (Schnittstelle für Karten & Nebenzweige) ======================= */
  /* kind: glut | rolle | waffe | gold | heil | segen | schluessel. x/y: Weltpixel, y = Boden. opts: { n, tier, drop, rar, plus, big } */
  Z.spawnReward = function (kind, x, y, o) {
    o = o || {};
    const tier = o.tier != null ? o.tier : tierNow();
    const fly = o.drop ? { vx: (Math.random() - 0.5) * 80, vy: -180 - Math.random() * 60 } : { vx: 0, vy: 0 };
    switch (kind) {
      case "glut": {
        const n = Math.max(1, Math.round(o.n || (1 + Math.floor(tier / 3)))), out = [];
        for (let i = 0; i < n; i++) out.push(Z.spawnPickup("glut", x + (i - (n - 1) / 2) * 6, y - 6, { n: 1, vx: (Math.random() - 0.5) * 90, vy: -150 - Math.random() * 90 }));
        return out;
      }
      case "rolle": return Z.spawnPickup("scroll", x, y, Object.assign({ float: !o.drop, stat: o.stat || Z.R.pick(["brut", "takt", "ueber"]) }, fly));
      case "waffe": {
        const it = Z.rollItem({ kind: "weapon", tier, rar: o.rar || [30, 45, 20, 5], bonusTier: o.bonusTier || 0 });
        if (!it) return null;
        if (o.plus) it.plus = clamp((it.plus || 0) + o.plus, 0, MAXP);
        return Z.spawnPickup("item", x, y, Object.assign({ it, float: !o.drop, drop: !!o.drop }, fly));
      }
      case "gold": Z.dropGold(x, y - 6, (o.n || 40) * Z.BAL.goldMul(tier)); return null;
      case "heil": return Z.spawnPickup("food", x, y, Object.assign({ food: o.big ? Z.FOOD[3] : Z.R.pick(Z.FOOD), float: !o.drop }, fly));
      case "segen": return blessOrb(x, y);
      case "schluessel": return Z.spawnPickup("key", x, y - 6, { vx: (Math.random() - 0.5) * 40, vy: -160 });
    }
    return null;
  };
  /* Segenskugel: Wahl zwischen zwei Segen, ohne Preis */
  function blessOrb(x, y) {
    const o = { x, y, r: 26, h: 34, orb: true, t: Math.random() * 9, offer: null,
      label: () => L(["Segen wählen", "Choose a blessing"]),
      use: () => {
        const P = Z.player; if (!P) return;
        if (!o.offer) o.offer = Z.R.shuffle(Object.keys(Z.BLESS).filter(b => !P.bless.includes(b))).slice(0, 2);
        orbNow = o;
        ui.open("<h2>" + L(["Segenskugel", "Orb of Blessing"]) + '</h2><p class="hinweis">' + L(["Zwei Fäden glimmen in der Kugel. Einer davon gehört dir – ohne Preis.", "Two threads glimmer in the orb. One of them is yours – free of charge."]) + '</p><div class="rollen">' +
          o.offer.map((b, i) => { const d = Z.BLESS[b]; return '<button data-act="smSegen" data-arg="' + b + '" data-key="' + (i + 1) + '" class="k-' + d.k + '"' + (i === 0 ? " autofocus" : "") + "><b>" + digitHint(i + 1) + esc(L(d.n)) + '</b><small class="art">' + esc(L(Z.BLESS_KIND[d.k])) + "</small><small>" + esc(L(d.d)) + "</small></button>"; }).join("") +
          '</div><div class="knoepfe"><button data-act="close">' + L(["Später", "Later"]) + "</button></div>", { cls: "schmal" });
      } };
    (Z.interacts = Z.interacts || []).push(o);
    return o;
  }
  let orbNow = null;
  ui.actions.smSegen = b => {
    const o = orbNow; orbNow = null; if (!o || o.off) return ui.close();
    o.off = true; FX.burst(o.x, o.y - 16, 24, { col: ["#ffd27a", "#ff8a5a", "#fff"], sp: 110, up: 40, life: 0.8, size: 2.2, kind: "glow", add: true });
    ui.actions.bless(b); /* nutzt den Segensaltar-Ablauf (inkl. Tausch, wenn schon drei) */
  };

  /* ======================= LAGER: WAFFENSTÄNDER ======================= */
  const RACK_BASE = ["kurzschwert", "holzschild", "jagdbogen", "wurfmesser"];
  const RACK_EXTRA = ["kettenpeitsche", "turmschild", "netzdruese"];
  Z.rackItem = id => { const it = Z.makeItem(id, 0, 0); it.plus = clamp(F().startplus || 0, 0, 2); return it; };
  Z.setupRack = function (lv) {
    const ids = RACK_BASE.concat(RACK_EXTRA.slice(0, clamp(F().rack || 0, 0, RACK_EXTRA.length)));
    const x0 = 55.2, x1 = 63.8, n = ids.length, gy = (lv.start.y + 1) * T;
    lv.rack = { x0: x0 * T, x1: x1 * T, y: gy, spots: [] };
    ids.forEach((id, i) => {
      const x = (x0 + (n > 1 ? (x1 - x0) * i / (n - 1) : 0)) * T;
      lv.rack.spots.push(x);
      Z.spawnPickup("item", x, gy, { it: Z.rackItem(id), vx: 0, vy: 0, float: true, rack: true });
    });
    const M = Z.meta; M.rackVisits = (M.rackVisits || 0) + 1;
  };
  /* Nach dem Aufheben im Lager: Hinweis auf die Hand-Taste; die alte Waffe wandert zurück an den Ständer */
  Z.onPlaced = function (it, slot, p, old) {
    const lv = Z.level, P = Z.player; if (!lv || !P) return;
    if (lv.hub && p && p.rack) {
      if (old) { for (let i = Z.pickups.length - 1; i >= 0; i--) { const q = Z.pickups[i]; if (q.kind === "item" && q.it === old) { q.x = p.x; q.y = p.y; q.vx = 0; q.vy = 0; q.float = true; q.rack = true; q.drop = false; break; } } }
      const hand = slot === "a1" ? L(["Hand 1", "Hand 1"]) : L(["Hand 2", "Hand 2"]);
      const k = keyHint(slot) || (inp.device === "touch" ? L(["Knopf „Waffe " + (slot === "a1" ? 1 : 2) + "“", "button 'Weapon " + (slot === "a1" ? 1 : 2) + "'"]) : "");
      const both = P.slots.a1 && P.slots.a2;
      later(() => Z.toast("<b>" + esc(Z.itemTitle(it)) + "</b> " + L(["liegt in ", "is in "]) + hand + " – " + L(["angreifen mit ", "attack with "]) + k +
        "<br><small>" + (both ? L(["Beide Hände voll. Nimmst du noch etwas, wählst du mit ", "Both hands full. Pick up another and choose with "]) + keyHint("a1") + " / " + keyHint("a2") + L([", welche Hand tauscht. Probier sie an der Puppe aus!", " which hand swaps. Try them on the dummy!"]) : L(["Eine Hand ist noch frei – nimm dir eine zweite Waffe.", "One hand is still free – take a second weapon."])) + "</small>", 4200), Z.presentItem ? 1300 : 200);
    }
  };

  /* ======================= GLUTAMBOSS ======================= */
  Z.anvils = [];
  Z.placeAnvil = function (x, y, o) {
    o = o || {};
    const a = { x, y, charges: 2 + (F().amboss ? 1 : 0), used: 0, t: Math.random() * 9 };
    Z.anvils.push(a);
    (Z.interacts = Z.interacts || []).push({ x, y, r: 30, h: 38, anvil: a,
      label: () => L(["Glutamboss", "Ember anvil"]) + (a.used >= a.charges ? L([" · erloschen", " · cold"]) : " · " + (a.charges - a.used) + L([" Schläge", " strikes"])),
      use: () => openAnvil(a) });
    return a;
  };
  Z.placeAnvilTile = (tx, ty, o) => Z.placeAnvil(tx * T + 8, (ty + 1) * T, o);

  /* Werte einer Waffe bei Stufe p (für vorher → nachher) */
  function statLines(it, p) {
    const d = Z.itemDef(it), P = Z.player, q = Object.assign({}, it, { plus: p });
    const m = Z.itemMul(q), r = v => Math.round(v * m);
    const out = [];
    if (d.combo) out.push([L(["Schaden je Hieb", "Damage per strike"]), d.combo.map(c => r(c.dmg)).join(" · ")]);
    else if (d.shoot) { const s = d.shoot; out.push([L(["Schaden", "Damage"]), s.dmgFull ? r(s.dmg) + "–" + r(s.dmgFull) : r(s.dmg) + (s.burst ? " ×" + s.burst : "")]); }
    else if (d.shield) { out.push([L(["Schildstoß", "Shield bash"]), String(r(d.shield.bash))]); out.push([L(["Konter nach Parade", "Parry riposte"]), String(r(d.shield.bash * 1.5))]); }
    out.push([L(["Kraft", "Power"]), "×" + m.toFixed(2)]);
    return out;
  }
  function costOf(it) { const p = it.plus || 0; return { gold: goldCost(p, tierNow()), glut: GLUT_COST[p] || 99 }; }

  let anvilNow = null, anim = null, raf = 0;
  function openAnvil(a) {
    const P = Z.player; if (!P) return;
    if (a.used >= a.charges) { Z.toast(L(["Die Glut im Amboss ist erloschen. Weiter vorn wartet der nächste.", "The anvil's embers have gone cold. Another waits further on."]), 2600); A.play("anvil", { vol: 0.25, rate: 0.6 }); return; }
    anvilNow = a; anim = null;
    renderAnvil();
  }
  function handRow(s) {
    const P = Z.player, it = P.slots[s];
    const head = '<div class="gb-hand"><div class="gb-kopf">' + keyHint(s) + " " + (s === "a1" ? L(["Hand 1", "Hand 1"]) : L(["Hand 2", "Hand 2"])) + "</div>";
    if (!it) return head + '<p class="hinweis">' + L(["leer", "empty"]) + "</p></div>";
    const d = Z.itemDef(it), p = it.plus || 0;
    if (!isWeapon(it)) return head + "<p>" + esc(L(d.n)) + "</p></div>";
    const name = '<b class="gb-name" style="color:' + Z.plusCol(p) + '">' + esc(Z.itemTitle(it)) + "</b>" + ((it.runes || []).length ? ' <small class="gb-runen">' + it.runes.map(k => '<span style="color:' + Z.RUNES[k].col + '">' + Z.RUNES[k].ico + " " + esc(L(Z.RUNES[k].n)) + "</span>").join(" ") + "</small>" : "");
    const pips = '<span class="gb-pips">' + Array.from({ length: MAXP }, (_, i) => '<i class="' + (i < p ? "an" : "") + '" style="--pc:' + Z.plusCol(i + 1) + '"></i>').join("") + "</span>";
    if (p >= MAXP) return head + name + pips + '<p class="meister">' + L(["Meisterstück – mehr hält der Stahl nicht aus.", "Masterwork – the steel can't take more."]) + "</p></div>";
    const now = statLines(it, p), nx = statLines(it, p + 1), c = costOf(it);
    const ok = P.gold >= c.gold && (P.glut || 0) >= c.glut;
    const rows = now.map((r, i) => "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + '</td><td class="pf">→</td><td class="neu">' + esc(nx[i][1]) + "</td></tr>").join("");
    const runeNote = RUNE_AT.includes(p + 1) ? '<p class="gb-rune">ᚱ ' + L(["Bei +" + (p + 1) + " wählst du eine Runen-Gravur (1 aus 3).", "At +" + (p + 1) + " you choose a rune engraving (1 of 3)."]) + "</p>" : "";
    return head + name + pips + '<table class="werte">' + rows + "</table>" + runeNote +
      '<button data-act="smForge" data-arg="' + s + '" data-hand="' + s + '"' + (ok ? "" : " disabled") + ">" + keyHint(s) + " " + L(["Aufwerten auf +", "Upgrade to +"]) + (p + 1) + ' <small class="kosten"><span class="' + (P.gold >= c.gold ? "" : "fehlt") + '">' + c.gold + ' ●</span> <span class="' + ((P.glut || 0) >= c.glut ? "" : "fehlt") + '">' + c.glut + " ✦</span></small></button></div>";
  }
  function renderAnvil(note) {
    const P = Z.player, a = anvilNow; if (!a) return;
    const left = a.charges - a.used;
    const html = '<div class="glutamboss"><h2>' + L(["Glutamboss", "Ember Anvil"]) + ' <span class="bank"><span class="gld">' + U.fmt(P.gold) + ' ●</span> <span class="glt">' + (P.glut || 0) + " ✦ " + L(["Glut", "Embers"]) + '</span></span></h2><canvas class="gb-bild" width="640" height="220"></canvas>' +
      '<p class="hinweis">' + (note || L(["Gold und Schmiedeglut machen den Stahl stärker: +15 % Schaden je Stufe, bis +5. Dieser Amboss hält noch ", "Gold and forge embers make steel stronger: +15% damage per level, up to +5. This anvil can take "]) + left + L([left === 1 ? " Schlag aus." : " Schläge aus.", left === 1 ? " more strike." : " more strikes."])) + "</p>" +
      '<div class="gb-haende">' + handRow("a1") + handRow("a2") + '</div><div class="knoepfe"><button data-act="close" autofocus>' + L(["Fertig", "Done"]) + "</button></div></div>";
    if (ui.modalOpen) { ui.onClose = null; ui.close(); }
    ui.open(html, { cls: "breit", onClose: () => { cancelAnimationFrame(raf); safeFinish(); anvilNow = null; anim = null; } });
    const first = document.querySelector('#modal [data-act="smForge"]:not([disabled])'); if (first) setTimeout(() => first.focus(), 30);
    startScene();
  }
  ui.actions.smForge = s => {
    const P = Z.player, a = anvilNow; if (!a || anim) return;
    const it = P.slots[s]; if (!isWeapon(it) || (it.plus || 0) >= MAXP || a.used >= a.charges) return;
    const c = costOf(it); if (P.gold < c.gold || (P.glut || 0) < c.glut) { A.play("ui", { vol: 0.3, rate: 0.6 }); return; }
    P.gold -= c.gold; P.glut -= c.glut; a.used++;
    const before = statLines(it, it.plus || 0);
    anim = { it, slot: s, t: 0, from: it.plus || 0, to: (it.plus || 0) + 1, hits: 0, before, sparks: [], done: false };
    Z.stats.upgrades = (Z.stats.upgrades || 0) + 1; ui.noEsc = true; /* während der Vorführung nicht versehentlich schließen */
    /* Fenster auf die Vorführung umstellen: Knöpfe weg, nur das Bild */
    const box = document.querySelector("#modal .glutamboss");
    if (box) { const bk = box.querySelector(".bank"); if (bk) bk.innerHTML = '<span class="gld">' + U.fmt(P.gold) + ' ●</span> <span class="glt">' + (P.glut || 0) + " ✦ " + L(["Glut", "Embers"]) + "</span>"; box.querySelector(".gb-haende").innerHTML = '<p class="gb-laeuft">' + L(["Nundros Hammer singt …", "Nundro's hammer sings…"]) + ' <small class="hinweis">(' + L(["Taste: überspringen", "any key: skip"]) + ")</small></p>"; const k = box.querySelector(".knoepfe"); if (k) k.style.visibility = "hidden"; const h = box.querySelector(".hinweis"); if (h) h.textContent = ""; }
  };
  /* Fenster wird mitten in Vorführung/Runenwahl geschlossen: nichts geht verloren (Stufe kommt, Rune wird zufällig gewählt) */
  function safeFinish() {
    const an = anim;
    if (an && !an.done) { an.done = true; an.it.plus = an.to; if (RUNE_AT.includes(an.to)) { const r = pickRunes(an.it, 1); if (r.length) { an.it.runes = (an.it.runes || []).concat(r); Z.toast && Z.toast(L(["Die Rune wählte sich selbst: ", "The rune chose itself: "]) + esc(L(Z.RUNES[r[0]].n)), 2600); } } }
    else if (runeCtx) { const c = runeCtx; runeCtx = null; c.it.runes = (c.it.runes || []).concat([c.opts[0]]); Z.toast && Z.toast(L(["Die Rune wählte sich selbst: ", "The rune chose itself: "]) + esc(L(Z.RUNES[c.opts[0]].n)), 2600); }
  }
  function finishForge() {
    const an = anim; if (!an || an.done) return; an.done = true; ui.noEsc = false;
    const it = an.it; it.plus = an.to;
    if (RUNE_AT.includes(it.plus)) return runeChoice(it, an);
    showResult(it, an);
  }
  function showResult(it, an, rune) {
    const P = Z.player, after = statLines(it, it.plus);
    const rows = an.before.map((r, i) => "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + '</td><td class="pf">→</td><td class="neu">' + esc(after[i][1]) + "</td></tr>").join("");
    const box = document.querySelector("#modal .glutamboss"); if (!box) return;
    const more = anvilNow && anvilNow.used < anvilNow.charges;
    box.querySelector(".gb-haende").innerHTML = '<div class="gb-ergebnis"><b style="color:' + Z.plusCol(it.plus) + '">' + esc(Z.itemTitle(it)) + "</b>" +
      (rune ? '<p class="gb-rune" style="color:' + Z.RUNES[rune].col + '">' + Z.RUNES[rune].ico + " " + esc(L(Z.RUNES[rune].n)) + ": " + esc(L(Z.RUNES[rune].d)) + "</p>" : "") +
      '<table class="werte">' + rows + "</table></div>";
    const k = box.querySelector(".knoepfe");
    if (k) { k.style.visibility = ""; k.innerHTML = (more ? '<button data-act="smAgain">' + L(["Weiter schmieden", "Keep forging"]) + "</button>" : "") + '<button data-act="close" autofocus>' + L(["Fertig", "Done"]) + "</button>"; setTimeout(() => { const b = k.querySelector("button"); if (b) b.focus(); }, 30); }
    const h = box.querySelector(".hinweis"); if (h) h.textContent = more ? L(["Der Amboss glüht noch.", "The anvil is still glowing."]) : L(["Die Glut im Amboss erlischt.", "The anvil's embers die down."]);
    const bank = box.querySelector(".bank"); if (bank) bank.innerHTML = '<span class="gld">' + U.fmt(P.gold) + ' ●</span> <span class="glt">' + (P.glut || 0) + " ✦ " + L(["Glut", "Embers"]) + "</span>";
    anim = null;
  }
  ui.actions.smAgain = () => renderAnvil();
  /* Runen-Gravur: eine von drei */
  let runeCtx = null;
  function runeChoice(it, an) {
    const opts = pickRunes(it, 3);
    if (!opts.length) return showResult(it, an);
    runeCtx = { it, an, opts };
    const box = document.querySelector("#modal .glutamboss"); if (!box) return;
    const d = Z.itemDef(it);
    const ex = k => ({ brand: L(["brennt 3 s", "burns for 3 s"]), gift: L(["Gift stapelt", "poison stacks"]), kette: L(["≈ " + Math.round(statLines(it, it.plus)[0][1].split(/[ ·–×]/)[0] * 0.4) + " je Sprung", "≈ " + Math.round(statLines(it, it.plus)[0][1].split(/[ ·–×]/)[0] * 0.4) + " per jump"]), raub: L(["heilt beim Zuschlagen", "heals as you strike"]), wucht: L(["wirft Gegner weit", "sends foes flying"]), krit: d.crit ? L(["passt zu deiner Krit-Bedingung", "fits your crit condition"]) : L(["für Krit-Builds", "for crit builds"]), tempo: L(["mehr Hiebe pro Sekunde", "more strikes per second"]), bruch: L(["bis +30 % auf ein Ziel", "up to +30% on one target"]), jagd: L(["für Bosse", "for bosses"]), echo: L(["jeder 4. Treffer doppelt", "every 4th hit twice"]) })[k] || "";
    box.querySelector(".gb-haende").innerHTML = '<div class="gb-runenwahl"><p><b style="color:' + Z.plusCol(it.plus) + '">' + esc(Z.itemTitle(it)) + "</b> – " + L(["der Stahl verlangt eine Rune. Wähle eine Gravur:", "the steel demands a rune. Choose an engraving:"]) + '</p><div class="rollen runen3">' +
      opts.map((k, i) => { const r = Z.RUNES[k]; return '<button data-act="smRune" data-arg="' + k + '" data-key="' + (i + 1) + '" style="--c:' + r.col + '"' + (i === 0 ? " autofocus" : "") + '><b><span class="rz">' + r.ico + "</span> " + digitHint(i + 1) + esc(L(r.n)) + "</b><small>" + esc(L(r.d)) + '</small><small class="art">' + esc(ex(k)) + "</small></button>"; }).join("") + "</div></div>";
    const k = box.querySelector(".knoepfe"); if (k) k.style.visibility = "hidden";
    setTimeout(() => { const b = box.querySelector('[data-act="smRune"]'); if (b) b.focus(); }, 30);
    A.play("rune", { vol: 0.5 });
  }
  ui.actions.smRune = k => {
    const c = runeCtx; runeCtx = null; if (!c || !Z.RUNES[k]) return;
    c.it.runes = (c.it.runes || []).concat([k]);
    A.play("magic", { vol: 0.6 }); A.play("anvil", { vol: 0.5, rate: 1.3 });
    if (scene) scene.runeFlash = { k, t: 0 };
    showResult(c.it, c.an, k);
  };

  /* ---------- Schmiede-Bild (Canvas im Fenster, läuft in Echtzeit, das Spiel steht still) ---------- */
  let scene = null;
  function startScene() {
    cancelAnimationFrame(raf);
    scene = { sparks: [], t0: performance.now(), last: performance.now(), heat: 0, runeFlash: null, shake: 0 };
    const loop = now => {
      const cv = document.querySelector("#modal .gb-bild");
      if (!cv || !cv.isConnected) { scene = null; return; }
      const dt = Math.min(0.25, (now - scene.last) / 1000); scene.last = now;
      drawScene(cv, (now - scene.t0) / 1000, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  const HIT_T = [0.35, 0.8, 1.25], ANIM_END = 1.95;
  function drawScene(cv, t, dt) {
    const c = cv.getContext("2d"), W = cv.width, H = cv.height, sc = scene;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    const an = anim;
    /* Vorführung voranschreiben */
    let hammer = -1.1, flash = 0;
    if (an && !an.done) {
      an.t += dt;
      const anyKey = inp.pressed.jump || inp.pressed.use || inp.pressed.roll || inp.pressed.a1 || inp.pressed.a2;
      if (anyKey && an.t > 0.3 && an.t < HIT_T[2]) { an.t = HIT_T[2] - 0.02; for (let i = an.hits; i < 2; i++) an.hits++; }
      for (let i = 0; i < 3; i++) {
        const ht = HIT_T[i];
        if (an.t >= ht - 0.3 && an.t < ht) hammer = -1.1 - 0.35 * Math.sin((an.t - (ht - 0.3)) / 0.3 * Math.PI) + (an.t - (ht - 0.3)) / 0.3 * 1.25;
        if (an.t >= ht && an.t < ht + 0.12) hammer = 0.15 - (an.t - ht) * 4;
        if (an.hits === i && an.t >= ht) {
          an.hits++; sc.heat = Math.min(1, sc.heat + 0.34); sc.shake = 0.18;
          A.play("anvil", { vol: 0.8, rate: 0.9 + i * 0.08 }); A.play("hitMetal", { vol: 0.35, rate: 1.2 + i * 0.1 });
          inp.rumble && inp.rumble(0.35 + i * 0.15, 80);
          const n = Z.gq && Z.gq.level === 0 ? 18 : 34;
          for (let k = 0; k < n + i * 10; k++) { const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = 120 + Math.random() * 260; sc.sparks.push({ x: W * 0.5, y: H * 0.56, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 0.5 + Math.random() * 0.6, max: 1.1, col: Math.random() < 0.3 ? "#fff3c0" : Math.random() < 0.5 ? "#ffb040" : "#ff6a2a" }); }
        }
      }
      if (an.t >= HIT_T[2] + 0.2 && !an.final) {
        an.final = true; A.play(an.to >= 4 ? "holy" : "gem", { vol: 0.6 }); A.play("fire", { vol: 0.35 });
        for (let k = 0; k < 40; k++) { const ang = Math.random() * TAU, v = 60 + Math.random() * 160; sc.sparks.push({ x: W * 0.5, y: H * 0.5, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 40, life: 0.8 + Math.random() * 0.5, max: 1.3, col: Z.plusCol(an.to) }); }
      }
      if (an.final) flash = clamp(1 - (an.t - HIT_T[2] - 0.2) / 0.6, 0, 1);
      if (an.t >= ANIM_END) finishForge();
    } else sc.heat = Math.max(0.15, sc.heat - dt * 0.25);
    const sh = sc.shake > 0 ? (sc.shake -= dt, (Math.random() - 0.5) * 6 * sc.shake / 0.18) : 0;
    c.save(); c.translate(sh, sh * 0.5);
    /* Hintergrund: warme Esse */
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#140a0a"); bg.addColorStop(1, "#2a1410"); c.fillStyle = bg; c.fillRect(-10, -10, W + 20, H + 20);
    const gl = c.createRadialGradient(W * 0.5, H * 0.62, 10, W * 0.5, H * 0.62, W * 0.45); gl.addColorStop(0, "rgba(255,120,40," + (0.25 + 0.35 * sc.heat) + ")"); gl.addColorStop(1, "rgba(255,80,20,0)"); c.fillStyle = gl; c.fillRect(0, 0, W, H);
    /* Esse links mit Flammen */
    c.fillStyle = "#2e2420"; c.fillRect(30, H * 0.48, 110, H * 0.52); c.fillStyle = "#1a1210"; c.fillRect(44, H * 0.56, 82, 40);
    for (let i = 0; i < 6; i++) { const fx = 54 + i * 13, fh = 18 + Math.sin(t * 9 + i * 1.7) * 7 + sc.heat * 10; const g = c.createLinearGradient(0, H * 0.56 + 40 - fh, 0, H * 0.56 + 40); g.addColorStop(0, "rgba(255,200,90,0)"); g.addColorStop(1, "rgba(255,110,30,.9)"); c.fillStyle = g; c.beginPath(); c.moveTo(fx - 6, H * 0.56 + 40); c.quadraticCurveTo(fx, H * 0.56 + 40 - fh * 1.4, fx + 6, H * 0.56 + 40); c.fill(); }
    /* Amboss */
    const ax = W * 0.5, ay = H * 0.62;
    c.fillStyle = "#3a2c26"; c.fillRect(ax - 34, ay + 26, 68, H - ay - 26);           /* Holzblock */
    c.fillStyle = "#2a2022"; c.fillRect(ax - 24, ay + 6, 48, 22);                       /* Fuß */
    c.fillStyle = "#4a4246"; c.beginPath(); c.moveTo(ax - 80, ay - 8); c.quadraticCurveTo(ax - 120, ay - 6, ax - 132, ay - 14); c.lineTo(ax - 80, ay + 2); c.closePath(); c.fill(); /* Horn */
    c.fillStyle = "#4a4246"; c.fillRect(ax - 80, ay - 14, 150, 22);                     /* Bahn */
    c.fillStyle = "#6e6468"; c.fillRect(ax - 80, ay - 14, 150, 4);
    const heatCol = "rgba(255," + Math.round(120 + 100 * sc.heat) + ",40," + (0.25 + 0.5 * sc.heat) + ")";
    c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = heatCol; c.fillRect(ax - 40, ay - 14, 80, 4); c.restore();
    /* Waffe auf dem Amboss, glühend */
    const it = an ? an.it : sc.showIt || null; if (an) sc.showIt = an.it;
    if (it) {
      const d = Z.itemDef(it);
      c.save(); c.translate(ax, ay - 24); if (d.kind !== "shield") c.rotate(Math.PI / 4); Z.drawIcon(c, d.icon, 0, 0, 64, d.col); c.restore();
      c.save(); c.globalCompositeOperation = "lighter"; const hg = c.createRadialGradient(ax, ay - 22, 2, ax, ay - 22, 70); hg.addColorStop(0, "rgba(255,170,60," + (0.2 + 0.55 * sc.heat) + ")"); hg.addColorStop(1, "rgba(255,90,20,0)"); c.fillStyle = hg; c.fillRect(ax - 80, ay - 90, 160, 140); c.restore();
    } else {
      /* untätig: ein Barren glüht vor sich hin */
      c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,150,60," + (0.5 + 0.2 * Math.sin(t * 3)) + ")"; c.fillRect(ax - 22, ay - 20, 44, 6); c.restore();
      if (Math.random() < 0.2) sc.sparks.push({ x: ax + (Math.random() - 0.5) * 40, y: ay - 20, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 40, life: 0.8, max: 0.8, col: "#ffb060" });
    }
    /* Hammer (dreht um einen Punkt rechts) */
    c.save(); c.translate(ax + 150, ay - 20); c.rotate(-hammer - 0.15);
    c.fillStyle = "#6a4a2a"; c.fillRect(-120, -4, 120, 8);
    c.fillStyle = "#3a3438"; c.fillRect(-140, -18, 30, 36); c.fillStyle = "#6e6468"; c.fillRect(-140, -18, 30, 5);
    c.restore();
    /* Funken */
    c.save(); c.globalCompositeOperation = "lighter";
    for (const s of sc.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 520 * dt; s.vx *= 1 - 1.2 * dt; const a = clamp(s.life / s.max, 0, 1); c.globalAlpha = a; c.strokeStyle = s.col; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); c.stroke(); }
    c.restore(); sc.sparks = sc.sparks.filter(s => s.life > 0 && s.y < H + 20);
    /* Runen-Glühen */
    if (sc.runeFlash) { const rf = sc.runeFlash; rf.t += dt; const r = Z.RUNES[rf.k], a = clamp(1 - rf.t / 1.2, 0, 1); c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = a; c.font = "700 " + Math.round(46 + rf.t * 30) + "px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = r.col; c.shadowColor = r.col; c.shadowBlur = 24; c.fillText(r.ico, ax, ay - 34 - rf.t * 20); c.restore(); if (rf.t > 1.2) sc.runeFlash = null; }
    c.restore();
    /* Abschluss-Blitz und „+N" */
    if (an && an.final) {
      const u = clamp((an.t - HIT_T[2] - 0.2) / 0.5, 0, 1);
      c.save(); c.globalAlpha = flash * 0.55; c.fillStyle = Z.plusCol(an.to); c.fillRect(0, 0, W, H); c.restore();
      c.save(); c.globalAlpha = Math.min(1, u * 2); c.font = "700 " + Math.round(40 + 18 * (1 - u)) + "px " + (getComputedStyle(document.documentElement).getPropertyValue("--fd") || "serif"); c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = Z.plusCol(an.to); c.shadowColor = "#000"; c.shadowBlur = 10; c.fillText("+" + an.to, W * 0.78, H * 0.32); c.restore();
    }
    /* Stufen-Pips über dem Amboss */
    const lv = an ? (an.final ? an.to : an.from) : -1;
    if (lv >= 0) for (let i = 0; i < MAXP; i++) { const px = W * 0.5 - 40 + i * 20, on = i < lv; c.fillStyle = on ? Z.plusCol(i + 1) : "#3a2c2c"; c.beginPath(); c.moveTo(px, 18); c.lineTo(px + 6, 24); c.lineTo(px, 30); c.lineTo(px - 6, 24); c.closePath(); c.fill(); }
  }

  /* ======================= META: Nundros Glutschmiede (Seelensplitter) ======================= */
  const UPS = {
    startplus: { max: 2, cost: [80, 220], n: ["Vorgeschmiedet", "Pre-forged"], d: ["Die Waffen am Lager-Ständer liegen mit +1 bereit (Stufe 2: +2).", "The camp rack's weapons start at +1 (level 2: +2)."] },
    rack: { max: 3, cost: [60, 130, 240], n: ["Volles Gestell", "Full rack"], d: ["Mehr Startwaffen am Ständer: Kettenpeitsche (Faden), dann Turmschild, dann Ettercap-Drüse (Faden).", "More starting weapons on the rack: chain whip (thread), then tower shield, then ettercap gland (thread)."] },
    gravur: { max: 3, cost: [70, 160, 280], n: ["Runenkunde", "Rune lore"], d: ["Gefundene Waffen tragen mit 10 / 20 / 30 % schon eine Gravur.", "Found weapons already carry an engraving 10 / 20 / 30% of the time."] },
    glut: { max: 3, cost: [50, 120, 220], n: ["Glutspürer", "Ember seeker"], d: ["+25 % Chance auf Schmiedeglut je Stufe (Elite, Truhen, Kisten).", "+25% chance for forge embers per level (elites, chests, crates)."] },
    beutel: { max: 2, cost: [90, 210], n: ["Glutbeutel", "Ember pouch"], d: ["Jeder Lauf beginnt mit 1 Schmiedeglut (Stufe 2: 2).", "Every run starts with 1 forge ember (level 2: 2)."] },
    rabatt: { max: 2, cost: [60, 150], n: ["Nundros Kniff", "Nundro's knack"], d: ["Aufwerten am Glutamboss kostet 15 % weniger Gold je Stufe.", "Upgrading at an ember anvil costs 15% less gold per level."] },
    amboss: { max: 1, cost: [180], n: ["Zäher Amboss", "Sturdy anvil"], d: ["Jeder Glutamboss hält einen Schlag mehr aus (3 statt 2).", "Every ember anvil takes one more strike (3 instead of 2)."] }
  };
  Z.FORGE_UPS = UPS;
  Z.forgeGlutHTML = function () {
    const M = Z.meta, f = F();
    let h = '<p class="hinweis">' + L(["Glut und Gold verbrauchst du in der Feste am Glutamboss. Hier, am Lagerfeuer, macht Nundro die Schmiede selbst besser – dauerhaft, mit Seelensplittern.", "Embers and gold are spent in the keep at an ember anvil. Here by the campfire Nundro improves the forge itself – permanently, with soul shards."]) + '</p><div class="liste">';
    for (const k in UPS) {
      const u = UPS[k], l = f[k] || 0, c = l < u.max ? u.cost[l] : 0;
      h += '<div class="zeile"><div><b>' + esc(L(u.n)) + " " + "●".repeat(l) + "○".repeat(u.max - l) + "</b><small>" + esc(L(u.d)) + '</small></div><div class="kauf"><button data-act="smUp" data-arg="' + k + '"' + (l >= u.max || M.shards < c ? " disabled" : "") + ">" + (l >= u.max ? L(["Meister", "Master"]) : c + "◆") + "</button></div></div>";
    }
    return h + "</div>";
  };
  ui.actions.smUp = k => {
    const M = Z.meta, f = F(), u = UPS[k]; if (!u) return; const l = f[k] || 0; if (l >= u.max || M.shards < u.cost[l]) return;
    M.shards -= u.cost[l]; f[k] = l + 1; Z.saveMeta(); A.play("anvil", { vol: 0.7 });
    /* sofort sichtbar: Gestell neu bestücken */
    if (Z.level && Z.level.hub && (k === "rack" || k === "startplus")) { for (let i = Z.pickups.length - 1; i >= 0; i--) if (Z.pickups[i].rack) Z.pickups.splice(i, 1); const P = Z.player; if (P) for (const s of ["a1", "a2"]) if (P.slots[s] && k === "startplus") P.slots[s].plus = clamp(f.startplus, 0, 2); Z.setupRack(Z.level); }
    ui.forge(3);
  };

  /* ======================= KAMPF: Runen, Faden-Markierung, Adrenalin ======================= */
  let inRune = false;
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    const P = Z.player;
    if (!e || e.dead || o.dot || !P || inRune) return hit0.call(this, e, dmg, o);
    const it = o.it, fromHand = !!(it && P.slots && (P.slots.a1 === it || P.slots.a2 === it));
    /* Faden-Markierung: Nahkampf auf markiertem Ziel trifft garantiert kritisch */
    let markUsed = false;
    if (fromHand && o.src === "melee" && e.st && e.st.hmark > 0) {
      markUsed = true;
      if (!o.crit) { const d = Z.itemDef(it); dmg *= (d && d.critMul) || 1.8; o = Object.assign({}, o, { crit: true }); } else dmg *= 1.25;
    }
    /* Runen vor dem Treffer */
    if (it && it.runes && it.runes.length) {
      if (Z.hasRune(it, "krit") && o.crit) dmg *= 1.5;
      if (Z.hasRune(it, "jagd") && (e.elite || e.def.boss)) dmg *= 1.3;
      if (Z.hasRune(it, "bruch")) { if (!(e.st.sunder > 0)) e.st.sunderN = 0; dmg *= 1 + 0.06 * (e.st.sunderN || 0); }
      if (Z.hasRune(it, "wucht") && o.kb) o = Object.assign({}, o, { kb: o.kb * 1.6 });
    }
    const r = hit0.call(this, e, dmg, o);
    if (!(r > 0)) return r;
    const ex = e.x + e.w / 2, ey = e.y + e.h * 0.4;
    if (markUsed) {
      e.st.hmark = 0; Z.stats.markCrits = (Z.stats.markCrits || 0) + 1;
      FX.text(ex, e.y - 16, L(["Faden!", "Thread!"]), "#ffd27a", true);
      FX.ring(ex, ey, 26, "#ffd27a", 0.3, 2); A.play("crit", { vol: 0.4, rate: 1.3 });
    }
    /* Faden-Waffen (daten.js: faden: true) markieren – Wurfmesser, Jagdbogen, Netzdrüse, Kettenpeitsche, Wurfschild;
       Paraden markieren nur, wenn der Schild selbst ein Faden-Stück ist. Wer eine Marke verbraucht, setzt keine neue. */
    const markIt = o.src === "parry" ? (P.act && P.act.it) : it;
    const markDef = markIt && Z.itemDef(markIt);
    if (!e.dead && !markUsed && markDef && markDef.faden && (fromHand || o.src === "parry") && o.src !== "echo") {
      if (!(e.st.hmark > 0)) { FX.ring(ex, ey, 12, "#ffd27a", 0.2, 1); Z.stats.marks = (Z.stats.marks || 0) + 1; }
      e.st.hmark = 4;
    }
    if (it && it.runes && it.runes.length) {
      inRune = true;
      try {
        if (Z.hasRune(it, "brand") && !e.dead) Z.addStatus(e, "burn", 1);
        if (Z.hasRune(it, "gift") && !e.dead) Z.addStatus(e, "poison", 1);
        if (Z.hasRune(it, "raub")) Z.healPlayer(r * 0.04);
        if (Z.hasRune(it, "bruch") && !e.dead) { e.st.sunder = 5; e.st.sunderN = Math.min(5, (e.st.sunderN || 0) + 1); }
        if (Z.hasRune(it, "wucht") && o.heavy && !e.dead) Z.addStatus(e, "stun", 0.35);
        if (Z.hasRune(it, "kette") && Z.R() < 0.2) Z.chainLightning(P, ex, ey, r * 0.4, 3, {}, null);
        if (Z.hasRune(it, "echo")) {
          it._echo = (it._echo || 0) + 1;
          if (it._echo % 4 === 0) later(() => { if (!e.dead && Z.enemies.includes(e)) { inRune = true; try { hit0(e, r * 0.5, { src: "echo", kb: 30, dir: o.dir, col: "#d890ff" }); } finally { inRune = false; } FX.ring(ex, ey, 18, "#d890ff", 0.25, 2); A.play("magic", { vol: 0.3, rate: 1.6 }); } }, 120);
        }
      } finally { inRune = false; }
    }
    return r;
  };
  Z.onPerfectDodge = function (P) {
    FX.text(P.x + P.w / 2, P.y - 22, L(["Adrenalin! +25 %", "Adrenaline! +25%"]), "#ff8a5a", true);
  };

  /* ======================= KILL-KETTEN, ELITE-GLUT, HERAUSFORDERUNGEN ======================= */
  const chain = { n: 0, last: -9 };
  let goldMulNow = 1;
  Z.killChain = () => chain;
  const gold0 = Z.dropGold;
  Z.dropGold = function (x, y, n) { return gold0.call(this, x, y, n * goldMulNow); };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    if (!e || e.dead || e.dummy || !Z.run || (e.def && e.def.boss)) return kill0.apply(this, arguments);
    const now = Z.run.time || 0;
    const n = now - chain.last < 3 ? chain.n + 1 : 1;
    goldMulNow = chainMul(n);
    let r;
    try { r = kill0.apply(this, arguments); } finally { goldMulNow = 1; }
    if (!e.dead) return r;
    chain.n = n; chain.last = now;
    if ([3, 5, 8, 12].includes(n)) { const P = Z.player; if (P) { FX.text(P.x + P.w / 2, P.y - 26, L(["Kette ", "Chain "]) + n + " · " + L(["Gold ×", "Gold ×"]) + chainMul(n).toFixed(2).replace(/0$/, "").replace(/\.$/, ""), "#ffd27a", true); A.play("coin", { vol: 0.5, rate: 0.8 + n * 0.03 }); } }
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.elite) {
      if (Z.R() < 0.6 * glutMul()) Z.spawnReward("glut", cx, cy, { n: tierNow() >= 4 && Z.R() < 0.4 ? 2 : 1 });
      if (Z.R() < 0.1) Z.spawnReward("rolle", cx, e.y + e.h, { drop: true });
    } else if (Z.R() < 0.012 * glutMul()) Z.spawnReward("glut", cx, cy, { n: 1 });
    return r;
  };
  /* Truhen und Bosse (Haken aus spiel.js) */
  Z.onChestOpen = function (p, cursed) {
    if (Z.chChest) Z.chChest();
    if (cursed) Z.spawnReward("glut", p.x, p.y - 8, { n: 1 });
    else if (Z.R() < 0.25 * glutMul()) Z.spawnReward("glut", p.x, p.y - 8, { n: 1 });
  };
  Z.onBossDown = function (b) {
    later(() => Z.spawnReward("glut", b.x + b.w / 2, b.y + b.h / 2, { n: b.warden ? 2 : 3 }), 600);
  };

  /* Herausforderungen: siehe bilanz.js (Z.chStart / Z.chEnd / Z.chHUD) */

  /* ======================= GEBIETE: Amboss platzieren, Lager-Hinweise ======================= */
  const load0 = Z.loadArea;
  Z.loadArea = function (id, opts) {
    const done = id === "passage" && Z.chEnd ? Z.chEnd() : []; if (id === "lager" && Z.chClear) Z.chClear();
    Z.anvils = [];
    const r = load0.apply(this, arguments);
    const lv = Z.level; if (!lv) return r;
    try {
      if (lv.passage) Z.placeAnvilTile(15, lv.start.y);
      else if (lv.arena && lv.start) { const tx = lv.start.x + 3; if (Z.standable(lv, tx, lv.start.y) && tx < 8) Z.placeAnvilTile(tx, lv.start.y); }
      else if (!lv.hub && Z.run && !Z.anvils.length && (Z.run.route.length % 2 === 0) && lv.start) {
        /* Rückfall: jedes zweite Gebiet ein Amboss nahe dem Eingang, falls die Karte keinen gesetzt hat */
        for (let d = 4; d < 14; d++) { let done = false; for (const s of [1, -1]) { const tx = lv.start.x + s * d; if (Z.standable(lv, tx, lv.start.y, 3) && Z.standable(lv, tx + 1, lv.start.y, 3) && !(lv.doors || []).some(q => Math.abs(q.x - tx) < 3 && Math.abs(q.y - lv.start.y) < 3)) { Z.placeAnvilTile(tx, lv.start.y); done = true; break; } } if (done) break; }
      }
      if (!lv.hub && !lv.passage && Z.run && Z.chStart) Z.chStart(lv);
      if (done.length && Z.chPayLater) later(() => { if (Z.level === lv) Z.chPayLater(done); }, 1100);
      if (lv.hub) hubHints(lv);
    } catch (err) { console.error(err); }
    return r;
  };
  function hubHints(lv) {
    const M = Z.meta;
    if ((M.rackVisits || 0) <= 3) later(() => {
      const P = Z.player; if (!Z.level || !Z.level.hub || !P || P.slots.a1 || P.slots.a2) return;
      const g = Z.level.props.find(p => p.id === "G");
      const k = inp.device === "touch" ? "✋" : inp.label("use");
      ui.say && g && ui.say(g.x * T + 8, g.y * T - 22, "Friedrich", L(["Der Waffenständer da drüben – nimm dir zwei Waffen mit. Taste „" + k + "“ zum Aufheben.", "The weapon rack over there – take two weapons. Press '" + k + "' to pick up."]), 5200);
    }, 2200);
  }

  /* ======================= ZEICHNEN ======================= */
  function drawAnvil(c, a, t) {
    const x = a.x, y = a.y, cold = a.used >= a.charges, heat = cold ? 0 : 0.6 + 0.25 * Math.sin(t * 3 + a.t);
    if (!cold) { c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y - 12, 26 + Math.sin(t * 2.3 + a.t) * 3, "rgba(255,120,40," + (0.32 * heat) + ")"); c.restore(); }
    c.fillStyle = "#3a2c24"; c.fillRect(x - 9, y - 8, 18, 8);                 /* Holzblock */
    c.fillStyle = "#2a2224"; c.fillRect(x - 5, y - 12, 10, 4);
    c.fillStyle = "#4a4246"; c.fillRect(x - 12, y - 17, 22, 5);                /* Bahn */
    c.beginPath(); c.moveTo(x - 12, y - 17); c.quadraticCurveTo(x - 18, y - 16, x - 20, y - 18); c.lineTo(x - 12, y - 13); c.closePath(); c.fill();
    c.fillStyle = "#6e6468"; c.fillRect(x - 12, y - 17, 22, 1.2);
    if (!cold) { c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,170,70," + heat + ")"; c.fillRect(x - 6, y - 18.5, 12, 1.6); c.restore(); }
    /* Kohlebecken daneben */
    c.fillStyle = "#2a2020"; c.fillRect(x + 12, y - 6, 8, 6);
    if (!cold) { Z.flame && Z.flame(c, x + 16, y - 6, 0.9, "#ff8a2a"); if (Math.random() < 0.12) FX.p({ x: x + 16 + (Math.random() - 0.5) * 4, y: y - 10, vx: (Math.random() - 0.5) * 20, vy: -50, life: 0.8, size: 1.2, col: "#ffb060", kind: "spark", add: true }); }
    /* Schläge übrig als Glutpunkte */
    for (let i = 0; i < a.charges; i++) { const on = i >= a.used; Z.draw.circ(c, x - 6 + i * 6, y - 23, 1.4, on ? "#ffb040" : "#3a2c2c"); }
  }
  function drawOrb(c, o, t) {
    if (o.off) return;
    const x = o.x, y = o.y, b = Math.sin(t * 2 + o.t) * 2;
    c.fillStyle = "#3a3036"; c.fillRect(x - 6, y - 10, 12, 10); c.fillStyle = "#4a4048"; c.fillRect(x - 8, y - 12, 16, 3);
    c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y - 22 + b, 16, "rgba(255,150,90,.55)"); c.restore();
    Z.draw.circ(c, x, y - 22 + b, 4.5, "#ffd0a0"); Z.draw.circ(c, x - 1.2, y - 23.2 + b, 1.6, "#fff6e0");
  }
  function drawRack(c, lv, t) {
    const R = lv.rack; if (!R) return;
    const x0 = R.x0 - 14, x1 = R.x1 + 14, y = R.y;
    /* Decke */
    c.fillStyle = "#5a1e1e"; c.fillRect(x0, y - 2, x1 - x0, 2);
    c.fillStyle = "#7a2a24"; c.fillRect(x0, y - 2.6, x1 - x0, 0.9);
    c.fillStyle = "#c8a060"; for (let x = x0 + 2; x < x1; x += 6) c.fillRect(x, y - 2.2, 2, 0.6);
    /* Gestell: Pfosten und Querbalken mit Haken */
    c.fillStyle = "#4a3020"; c.fillRect(x0 + 2, y - 30, 3, 28); c.fillRect(x1 - 5, y - 30, 3, 28);
    c.fillStyle = "#5e3c24"; c.fillRect(x0, y - 31, x1 - x0, 3);
    c.fillStyle = "#3a2416"; for (const sx of R.spots) c.fillRect(sx - 0.8, y - 28, 1.6, 3);
    /* kleines Kohlebecken am Ende */
    c.fillStyle = "#2a2020"; c.fillRect(x1 + 2, y - 7, 9, 7); Z.flame && Z.flame(c, x1 + 6.5, y - 7, 1, "#ff8a2a");
    c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x1 + 6.5, y - 10, 22 + Math.sin(t * 5) * 2, "rgba(255,130,50,.25)"); c.restore();
    /* Schild über dem Gestell, mit Tastenhinweis, wenn man in der Nähe ist */
    const P = Z.player; if (!P) return;
    const px = P.x + P.w / 2, near = px > x0 - 90 && px < x1 + 90 && Math.abs(P.y + P.h - y) < 50;
    if (near && !ui.choiceActive) {
      const k = inp.device === "touch" ? "✋" : inp.label("use");
      const s1 = L(["Waffenständer · zwei Hände, zwei Waffen", "Weapon rack · two hands, two weapons"]), s2 = "[" + k + "] " + L(["aufheben", "pick up"]) + (P.slots.a1 && P.slots.a2 ? " · [" + (inp.label("a1") || "1") + "]/[" + (inp.label("a2") || "2") + "] " + L(["Hand wählen", "choose hand"]) : "");
      c.save(); c.font = "700 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
      const w = Math.max(c.measureText(s1).width, c.measureText(s2).width) + 10, cx = (x0 + x1) / 2;
      c.fillStyle = "rgba(14,8,10,.82)"; c.fillRect(cx - w / 2, y - 62, w, 21); c.strokeStyle = "rgba(229,180,84,.6)"; c.lineWidth = 0.6; c.strokeRect(cx - w / 2 + 0.3, y - 61.7, w - 0.6, 20.4);
      c.fillStyle = "#e5b454"; c.fillText(s1, cx, y - 53.5); c.fillStyle = "#f0e6d4"; c.fillText(s2, cx, y - 44.5);
      /* Namen über den Waffen */
      c.font = "700 5.5px 'Alegreya Sans',sans-serif";
      for (const p of Z.pickups) if (p.rack && p.it && Math.abs(p.x - px) < 34) { c.fillStyle = "rgba(14,8,10,.7)"; const nm = Z.itemTitle(p.it), tw = c.measureText(nm).width + 4; c.fillRect(p.x - tw / 2, y - 38, tw, 7); c.fillStyle = p.it.plus ? Z.plusCol(p.it.plus) : "#e8dcc8"; c.fillText(nm, p.x, y - 32.6); }
      c.restore();
    }
  }
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) { if (wp0) wp0(c, t); const lv = Z.level; if (lv && lv.hub) drawRack(c, lv, t); };
  const dp0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dp0) dp0(c, t);
    for (const a of Z.anvils) drawAnvil(c, a, t);
    for (const o of Z.interacts || []) if (o.orb) drawOrb(c, o, t);
    /* Faden-Markierungen über Gegnern */
    for (const e of Z.enemies) if (!e.dead && e.st && e.st.hmark > 0) {
      const x = e.x + e.w / 2, y = e.y - 8, r = 3.5 + Math.sin(t * 8) * 0.6, a = Math.min(1, e.st.hmark);
      c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(t * 2); c.strokeStyle = "#ffd27a"; c.lineWidth = 0.9;
      c.beginPath(); c.moveTo(0, -r); c.lineTo(r, 0); c.lineTo(0, r); c.lineTo(-r, 0); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-r - 2, 0); c.lineTo(-r + 0.5, 0); c.moveTo(r - 0.5, 0); c.lineTo(r + 2, 0); c.stroke(); c.restore();
    }
    /* Adrenalin-Aura */
    const P = Z.player;
    if (P && P.st && P.st.adrenalin > 0 && !P.dead) { c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, P.x + P.w / 2, P.y + P.h / 2, 18 + Math.sin(t * 14) * 2, "rgba(255,110,60," + (0.22 * Math.min(1, P.st.adrenalin)) + ")"); c.restore(); if (Math.random() < 0.3) FX.p({ x: P.x + Math.random() * P.w, y: P.y + P.h, vx: 0, vy: -50, life: 0.4, size: 1.4, col: "#ff8a5a", kind: "spark", add: true }); }
  };

  /* ======================= KARTE: Runen und Stufe ======================= */
  /* Faden-Stücke aus anderen Modulen (zur Ladezeit vorhanden) */
  for (const id of ["wurfschild"]) if (Z.WEAPONS[id]) Z.WEAPONS[id].faden = true;
  Z.FADEN_TXT = ["Faden: Treffer markieren den Gegner 4 s lang (goldene Raute). Der nächste Nahkampfhieb darauf trifft garantiert kritisch.", "Thread: hits mark the enemy for 4 s (golden diamond). Your next melee strike on it is a guaranteed crit."];
  Z.cardExtraHTML = function (it) {
    let h = "";
    const d = Z.itemDef(it);
    if (d && d.faden) h += '<p class="fadeninfo"><span class="fz">◈</span> ' + esc(L(Z.FADEN_TXT)) + "</p>";
    if (it.plus) h += '<p class="plusinfo" style="color:' + Z.plusCol(it.plus) + '">' + L(["Schmiedestufe +", "Forge level +"]) + it.plus + ": +" + Math.round(PLUS_DMG * 100 * it.plus) + L([" % Schaden", "% damage"]) + "</p>";
    if (it.runes && it.runes.length) h += '<ul class="runen">' + it.runes.map(k => '<li style="color:' + Z.RUNES[k].col + '">' + Z.RUNES[k].ico + " <b>" + esc(L(Z.RUNES[k].n)) + "</b>: " + esc(L(Z.RUNES[k].d)) + "</li>").join("") + "</ul>";
    return h;
  };

  /* ======================= HUD: Glut, Schlüssel, Kette, Herausforderung ======================= */
  const css = document.createElement("style");
  css.textContent = [
    ".res .gl{color:#ffb060}.res .gl::before{content:\"✦\";color:#ff8a2a;margin-right:3px}.res .ky::before{content:\"⚷\";color:#ffd27a;margin-right:2px}",
    "#aufgabe{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;font-size:11px;font-weight:800;text-shadow:0 1px 2px #000}",
    "#aufgabe span{padding:1px 6px;border-radius:9px;background:rgba(20,12,16,.72);border:1px solid #3d2a2e}#aufgabe .ok{border-color:#7fd36a;color:#b8f0a0}#aufgabe .weg{opacity:.45;text-decoration:line-through}#aufgabe .kette{border-color:#e5b454;color:#ffd27a}",
    ".slot.geschmiedet{box-shadow:inset 0 0 12px rgba(0,0,0,.6),0 0 9px var(--plc)}.slot[data-plus]::after{content:attr(data-plus);position:absolute;right:-7px;top:-8px;font-size:10px;font-weight:800;background:#2a1e22;border:1px solid var(--plc);color:var(--plc);border-radius:6px;padding:0 4px}",
    ".fadeninfo{margin:4px 0;font-size:12px;color:#ffd27a;border-left:2px solid #e5b454;padding-left:6px}.fadeninfo .fz{font-weight:800}",
    ".ic-kopf .plus{font-weight:800}.plusinfo{margin:3px 0;font-weight:700;font-size:12px}.runen{margin:4px 0;padding-left:4px;list-style:none;font-size:12px}.runen li{margin:1px 0}",
    ".glutamboss .gb-bild{display:block;width:100%;max-width:640px;height:auto;margin:2px auto 6px;border-radius:10px;border:1px solid #4a2a20;box-shadow:0 0 30px rgba(255,110,40,.18)}",
    ".glutamboss .bank .gld{color:#e5b454}.glutamboss .bank .glt{color:#ffa040;margin-left:8px}",
    ".gb-haende{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}",
    ".gb-hand{border:1px solid #3d2a2e;border-radius:9px;padding:8px 10px;background:rgba(36,20,22,.55)}.gb-kopf{font-size:11px;color:#a99a8b;font-weight:800;margin-bottom:3px}",
    ".gb-name{font-size:16px}.gb-runen span{margin-right:6px;font-weight:700}.gb-pips{display:flex;gap:4px;margin:4px 0}.gb-pips i{width:10px;height:10px;transform:rotate(45deg);background:#3a2c2c;border:1px solid #5a4040;display:block}.gb-pips i.an{background:var(--pc);border-color:var(--pc);box-shadow:0 0 6px var(--pc)}",
    ".werte{border-collapse:collapse;margin:4px 0;font-size:12.5px;width:100%}.werte th{text-align:left;color:#a99a8b;font-weight:700;padding:1px 8px 1px 0}.werte td{padding:1px 4px;font-variant-numeric:tabular-nums}.werte .pf{color:#6a5a5a}.werte .neu{color:#ffd27a;font-weight:800}",
    ".gb-hand button{width:100%;margin-top:6px;padding:7px 10px;border-radius:8px;border:1px solid #6a4a2a;background:#3a2214;color:#f0e6d4;font-weight:800;text-align:left}.gb-hand button:focus,.gb-hand button:hover:not(:disabled){border-color:#e5b454;box-shadow:0 0 12px rgba(255,150,60,.35)}.gb-hand button:disabled{opacity:.5}",
    ".gb-hand .kosten{float:right;font-weight:800}.gb-hand .kosten .fehlt{color:#e0545a}.gb-rune{color:#c890ff;font-size:12px;margin:3px 0}.gb-laeuft{text-align:center;color:#ffb060;font-weight:800}",
    ".gb-ergebnis{text-align:center}.gb-ergebnis b{font-size:20px;font-family:var(--fd)}.gb-ergebnis .werte{max-width:420px;margin:6px auto}",
    ".runen3 button{border-color:var(--c)!important}.runen3 .rz{color:var(--c);font-size:20px}",
    ".haende{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 6px}.haende .hand{padding:4px 10px;border-radius:8px;border:1px solid #3d2a2e;background:rgba(36,20,22,.6);font-size:13px}.haende .hand.leer{border-color:#c23b3f}.haende kbd,.rollen kbd,.gb-hand kbd,.gb-kopf kbd,.kauf kbd{font-family:var(--fb);background:#3a2a2e;border:1px solid #5a4448;border-radius:4px;padding:0 5px;color:#e5b454;font-weight:800;font-size:11px}",
    ".warnung{color:#ffb090;font-weight:700;border-left:3px solid #c23b3f;padding-left:8px;margin:4px 0}",
    ".rollen .nutzen{color:#e8c890;font-size:11px}"
  ].join("\n");
  document.head.appendChild(css);
  let hudEls = null;
  function hudInit() {
    const res = document.querySelector("#hud .res"), hl = document.querySelector("#hud .hl"); if (!res || !hl) return null;
    const gl = document.createElement("span"); gl.className = "gl"; gl.id = "glut"; gl.title = L(["Schmiedeglut", "Forge embers"]);
    const ky = document.createElement("span"); ky.className = "ky"; ky.id = "keys";
    const bank = document.getElementById("bank"); res.insertBefore(gl, bank); res.insertBefore(ky, bank);
    const au = document.createElement("div"); au.id = "aufgabe"; hl.appendChild(au);
    return { gl, ky, au, key: "" };
  }
  function hudTick() {
    const P = Z.player; if (!P || !Z.level) return;
    if (!hudEls) hudEls = hudInit(); if (!hudEls) return;
    const run = !!Z.run;
    hudEls.gl.hidden = !run; hudEls.gl.textContent = P.glut || 0;
    hudEls.ky.hidden = !(P.keys > 0); hudEls.ky.textContent = P.keys || 0;
    const now = Z.run ? Z.run.time || 0 : 0;
    const ch = run && chain.n >= 2 && now - chain.last < 3 ? chain.n : 0;
    let key = "", html = "";
    if (run && Z.chHUD) { const h = Z.chHUD(); html += h.html; key += h.key; }
    if (ch) { html += '<span class="kette">⛓ ' + ch + " · ×" + chainMul(ch) + "</span>"; key += "|c" + ch; }
    if (key !== hudEls.key) { hudEls.key = key; hudEls.au.innerHTML = html; }
  }
  /* Fenster-Tasten: Ziffern 1–3 für Wahl-Knöpfe, Hand-Tasten im Glutamboss */
  addEventListener("keydown", e => {
    if (!ui.modalOpen || inp.capture || e.repeat) return;
    const m = /^Digit([1-9])$|^Numpad([1-9])$/.exec(e.code); if (!m) return;
    const b = document.querySelector('#modal [data-key="' + (m[1] || m[2]) + '"]:not([disabled])'); if (b) { e.preventDefault(); b.click(); }
  });
  const frame0 = ui.frame;
  ui.frame = function (dt) {
    if (ui.modalOpen && document.querySelector("#modal .glutamboss") && !anim) {
      for (const s of ["a1", "a2"]) if (inp.pressed[s]) { const b = document.querySelector('#modal [data-hand="' + s + '"]:not([disabled])'); if (b) { inp.consume(s); b.click(); break; } }
    }
    const r = frame0.apply(this, arguments);
    if (!ui.modalOpen) hudTick();
    if (Z.chFrame) Z.chFrame(dt);
    return r;
  };
})();
