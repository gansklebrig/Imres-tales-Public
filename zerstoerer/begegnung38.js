/* Ezekiel – The Destroyer · W38 Begegnung: drei seltene Begegnungen in Läufen (nur angehängt)
   Bestand: Händlerin, Verfluchter Schrein, Wunschbrunnen, Barradins Wette, Gefangener im Käfig (→ Helfer), Goldgoblin,
   Zeitrennen, Heilquelle, Hebelrätsel, Runen (abenteuer.js); Nemesis (nemesis.js); Wunder (wunder.js, nur Anblick).
   Neu – je eine kleine Entscheidung oder Mini-Aufgabe, passend zum Unterreich der Kampagne:
   1) Verletzter Svirfneblin („Tiefgnom“): Händler aus Blingdenstone, von Drow-Pfeilen getroffen. Entscheidung:
      Heiltrank geben (er revanchiert sich mit seinem besten Stück) · 60 Gold für Verband (Seelensplitter) · weitergehen.
   2) Myconid-Kreis: ein Pilzältester bittet um drei verstreute Leuchtsporen (45 s). Gelingt es: volle Heilung,
      +1 Trank (bis zum Höchstwert) und Splitter. Scheitern kostet nichts, der Kreis verstummt.
   3) Schattenspiegel: ein schwarzer Spiegel in einem Seitenraum. Wer ihn berührt, ruft Ezekiels Schatten hervor –
      seine Gestalt, seine Waffe, zäher als ein Söldner (mit Fernwaffe schießt er, mit Schild fängt er Treffer von vorn ab).
      Wer ihn besiegt, bekommt eine Elite-Beute und Splitter.
   Seltenheit: höchstens eine Begegnung je Gebiet, nicht im Lager/Durchgang/Arena, nicht im ersten Gebiet eines Laufs;
   Grundchance 9 % je Gebiet, „Mitleid“ nach 6 Gebieten ohne. Jede einmal pro Auftauchen (missbrauchsfest: kein
   Wiederholen über Rückweg, Lohn nur einmal, Schatten zählt nur durch Sieg). Online: Zustand als kurzes Gebietsfeld
   (lv.w38beg), der Gast zeichnet daraus. Koop: Lohn fällt als Beute, beide können aufheben. Alle Grafikstufen.
   Prüfhilfe: Z.begegnung.force("gnom"|"pilz"|"spiegel"). Schalter Z.gfx.off.w38beg. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.begegnung) return;
  const T = Z.TILE, U = Z.U, FX = Z.fx, A = Z.audio, L = v => Z.L(v), inp = Z.input;
  const { limb, circ, poly, ell, glow } = Z.draw;
  const esc = s => (Z.U && Z.U.esc ? Z.U.esc(s) : String(s));
  const off = () => !!(Z.gfx && Z.gfx.off && Z.gfx.off.w38beg);
  const errN = {};
  const safe = (tag, fn) => { try { return fn(); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W38 Begegnung", tag, e); } } };
  const M = () => (Z.meta.w38beg = Z.meta.w38beg || { seen: {}, done: {}, since: 0 });
  const NAME = { gnom: ["Verletzter Tiefgnom", "Wounded Deep Gnome"], pilz: ["Myconid-Kreis", "Myconid Circle"], spiegel: ["Schattenspiegel", "Shadow Mirror"] };
  let ev = null;
  const gast = () => { const s = Z.online && Z.online.S; return !!(s && s.role === "guest" && s.playing); };

  /* ---------- Platz finden ---------- */
  function spot(lv, minD, maxD, side) {
    const st = lv.start || { x: 2, y: 2 };
    for (let i = 0; i < 500; i++) {
      const x = 3 + ((Math.random() * (lv.W - 6)) | 0), y = 3 + ((Math.random() * (lv.H - 6)) | 0);
      if (!Z.standable(lv, x, y, 3) || !Z.standable(lv, x - 1, y, 3) || !Z.standable(lv, x + 1, y, 3)) continue;
      const d = Math.abs(x - st.x) + Math.abs(y - st.y); if (d < minD || (maxD && d > maxD)) continue;
      if ((lv.doors || []).some(o => Math.abs(o.x - x) < 4 && Math.abs(o.y - y) < 4)) continue;
      if ((Z.abEvents || []).some(o => Math.abs(o.x - (x * T + 8)) < 80 && Math.abs(o.y - (y + 1) * T) < 60)) continue;
      if (side && lv.cells) { const c = lv.cells[Math.floor(x / Z.CW) + "," + Math.floor(y / Z.CH)]; if (c && c.kind !== "side" && c.kind !== "secret" && i < 350) continue; }
      return { x, y };
    }
    return null;
  }
  function near(o, d, Pq) { const P = Pq || Z.player; return !!(P && !P.dead && !P.down && Math.abs(P.x + P.w / 2 - o.x) < (d || 24) && Math.abs(P.y + P.h - o.y) < 28); }
  const K = () => Z.koop;
  const spieler = () => [Z.player, K() && K().p2].filter(P => P && !P.dead && !P.down);
  const netP2 = P => { const k = K(); return !!(k && P && P === k.p2 && k.src && k.src.kind === "net"); };

  /* ---------- Einrichten beim Gebietswechsel ---------- */
  function setup(lv, force) {
    ev = null;
    if (!lv || lv.hub || lv.arena || lv.passage || !Z.run || gast()) { if (lv) lv.w38beg = ""; return; }
    const seen = Z.run.w38begIds = Z.run.w38begIds || {};
    if ((lv.w38begDone || seen[lv.id]) && !force) { lv.w38beg = ""; return; } /* Rückweg/erneuter Besuch: einmal pro Gebiet und Lauf */
    seen[lv.id] = 1;
    const m = M(); m.since = (m.since || 0) + 1;
    const first = lv.id === "torhof"; /* erstes Gebiet eines Laufs */
    let k = force || null;
    if (!k) {
      if (first || off()) { lv.w38beg = ""; return; }
      const ch = Z.begegnungChance != null ? Z.begegnungChance : 0.09;
      if (!(Math.random() < ch || m.since >= 6)) { lv.w38beg = ""; return; }
      const pool = ["gnom", "pilz", "spiegel"].filter(x => x !== m.last);
      k = pool[(Math.random() * pool.length) | 0];
    }
    const p = spot(lv, k === "spiegel" ? 24 : 16, 0, k === "spiegel"); if (!p) { lv.w38beg = ""; return; }
    m.since = 0; m.last = k;
    ev = { k, x: p.x * T + 8, y: (p.y + 1) * T, st: "warte", t: 0, lv };
    if (k === "pilz") ev.sporen = [];
    lv.w38begDone = true; sync();
    if (!m.seen[k]) { m.seen[k] = 1; try { Z.saveMeta(); } catch (_) {} }
  }
  /* Gebietsfeld für den Online-Gast: "art|x|y|zustand|t" (kurz, < 64 Zeichen) */
  function sync() {
    const lv = ev && ev.lv; if (!lv) return;
    let s = ev.k + "|" + Math.round(ev.x) + "|" + Math.round(ev.y) + "|" + ev.st + "|" + Math.max(0, Math.ceil(ev.left || 0));
    if (ev.k === "pilz" && ev.st === "lauf") s += "|" + ev.sporen.map(o => o.got ? "" : Math.round(o.x / T) + "." + Math.round(o.y / T)).join(";");
    lv.w38beg = s.slice(0, 63);
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); safe("setup", () => setup(Z.level)); return r; };

  /* ---------- Lohn ---------- */
  function lohnText(t) { Z.toast && Z.toast(t, 3400); }
  function done(st) { ev.st = st; ev.t = 0; M().done[ev.k] = (M().done[ev.k] || 0) + (st === "dank" || st === "frei" ? 1 : 0); if (Z.run) Z.run.events = (Z.run.events || 0) + 1; try { Z.saveMeta(); } catch (_) {} sync(); }

  /* 1) Tiefgnom: Wahl im Fenster */
  function gnomFenster(o) {
    const P = Z.player, pot = o ? !!o.pot : P.potions > 0, gold = o ? !!o.gold : (P.gold || 0) >= 60, pf = o ? "w38gnomGast" : "w38gnom";
    const b = (act, lab, sub, dis) => '<button class="wahl" data-act="' + act + '"' + (dis ? " disabled" : "") + "><b>" + esc(lab) + "</b><small>" + esc(sub) + "</small></button>";
    Z.ui.open("<h2>" + L(["Ein verletzter Tiefgnom", "A wounded deep gnome"]) + "</h2>" +
      "<p><i>" + L(["„Drow-Pfeile. Zwei Stück. Ich bin Nebbelfin aus Blingdenstone, und ich handle mit allem außer meinem Leben.“", "\"Drow arrows. Two of them. I'm Nebbelfin of Blingdenstone, and I trade in everything except my life.\""]) + "</i></p>" +
      '<div class="wahlen">' +
      b(pf + "Trank", L(["Heiltrank geben", "Give a healing potion"]), pot ? L(["Er gibt dir sein bestes Stück dafür.", "He gives you his finest piece for it."]) : L(["Du hast keinen Trank.", "You have no potion."]), !pot) +
      b(pf + "Gold", L(["60 Gold für Verband", "60 gold for bandages"]), gold ? L(["Er zahlt in Seelensplittern zurück.", "He repays you in soul shards."]) : L(["Zu wenig Gold.", "Not enough gold."]), !gold) +
      b(pf + "Geh", L(["Weitergehen", "Walk on"]), L(["Er wird es schon schaffen. Vielleicht.", "He'll make it. Probably."]), false) +
      "</div>", { cls: "breit" });
  }
  const act = () => Z.ui && Z.ui.actions;
  /* Wahl am Gnom – lokal aus dem Fenster oder online geprüft vom Gastgeber (wahl() prüft alles selbst) */
  function wahl(w) {
    const Q = Z.player; if (!ev || ev.k !== "gnom" || ev.st !== "warte" || !Q) return false;
    if (w === "trank") { if (!(Q.potions > 0)) return false; Q.potions--;
      A.play("potion", { vol: 0.6 }); A.play("coin", { vol: 0.5 }); Z.dropItem(ev.x, ev.y - 6, { boss: true });
      FX.burst(ev.x, ev.y - 10, 14, { col: ["#ffd27a", "#c8c0b8"], sp: 90, up: 50, life: 0.6, size: 2, kind: "spark", add: true });
      lohnText(L(["Nebbelfin: „Ein Leben für ein Leben. Das hier hätte ich niemandem sonst gegeben.“", "Nebbelfin: \"A life for a life. I wouldn't have given this to anyone else.\""])); done("dank"); return true; }
    if (w === "gold") { if ((Q.gold || 0) < 60) return false; Q.gold -= 60;
      A.play("coin", { vol: 0.6 }); Z.dropShards(ev.x, ev.y - 8, 45);
      lohnText(L(["Nebbelfin: „Gutes Tuch. Hier – Splitter aus der Tiefe, die mag dein Schmied.“", "Nebbelfin: \"Good cloth. Here – shards from the deep, your smith will like them.\""])); done("dank"); return true; }
    if (w === "geh") { lohnText(L(["Nebbelfin murmelt etwas über Goliaths und Herzen aus Stein.", "Nebbelfin mutters something about goliaths and hearts of stone."])); done("weg"); return true; }
    return false;
  }
  function wire() {
    const a = act(); if (!a) return setTimeout(wire, 100);
    a.w38gnomTrank = () => { Z.ui.close(); wahl("trank"); };
    a.w38gnomGold = () => { Z.ui.close(); wahl("gold"); };
    a.w38gnomGeh = () => { Z.ui.close(); wahl("geh"); };
    /* Online-Gast: seine Wahl geht an den Gastgeber, der prüft */
    const sende = w => () => { Z.ui.close(); const S = Z.online && Z.online.S; if (S && S.link && gast()) S.link.sendR({ t: "w38begw", w }); };
    a.w38gnomGastTrank = sende("trank"); a.w38gnomGastGold = sende("gold"); a.w38gnomGastGeh = sende("geh");
  }
  wire();

  /* 2) Pilzkreis: drei Sporen in der Nähe verteilen */
  function pilzStart() {
    const lv = ev.lv, P = Z.player, out = [];
    for (let i = 0; i < 400 && out.length < 3; i++) {
      const x = Math.floor(ev.x / T) + ((Math.random() * 40) | 0) - 20, y = Math.floor(ev.y / T) - 1 + ((Math.random() * 16) | 0) - 8;
      if (x < 2 || y < 2 || x > lv.W - 3 || y > lv.H - 3 || !Z.standable(lv, x, y, 2)) continue;
      if (Math.abs(x * T + 8 - ev.x) < 64 || out.some(o => Math.abs(o.x - (x * T + 8)) < 48)) continue;
      out.push({ x: x * T + 8, y: y * T + 4, got: false });
    }
    if (out.length < 3) { lohnText(L(["Der Älteste schweigt – die Sporen sind schon verweht.", "The elder falls silent – the spores have already drifted away."])); done("weg"); return; }
    ev.sporen = out; ev.st = "lauf"; ev.left = 45; A.play("magic", { vol: 0.5, rate: 0.8 });
    lohnText(L(["Myconid-Ältester (in deinem Kopf): „Drei Leuchtsporen. Vor dem Welken. Bring sie in den Kreis zurück.“", "Myconid elder (inside your head): \"Three glowing spores. Before the wilting. Bring them back to the circle.\""]));
    sync();
  }
  function pilzTick(dt) {
    const P = Z.player; if (!P) return;
    for (const Pq of spieler()) for (const o of ev.sporen) if (!o.got && Math.abs(Pq.x + Pq.w / 2 - o.x) < 14 && Math.abs(Pq.y + Pq.h / 2 - o.y) < 22) { /* Spieler 2 sammelt mit */
      o.got = true; A.play("gem", { vol: 0.5, rate: 1.3 }); FX.burst(o.x, o.y, 10, { col: ["#e8ff9a", "#a0e050"], sp: 60, life: 0.5, size: 1.8, kind: "glow", add: true });
      const n = ev.sporen.filter(q => q.got).length; FX.text(o.x, o.y - 10, n + "/3", "#d8f080", true); sync();
    }
    ev.left -= dt; if (Math.ceil(ev.left) !== Math.ceil(ev.left + dt)) sync();
    const alle = ev.sporen.every(o => o.got);
    if (alle && spieler().some(Pq => near(ev, 40, Pq))) {
      P.hp = P.hpMax; P.potions = Math.min(P.potMax || 0, (P.potions || 0) + 1); Z.dropShards(ev.x, ev.y - 8, 30);
      A.play("heal", { vol: 0.7 }); FX.ring(ev.x, ev.y - 10, 40, "#c8f070", 0.6, 3); FX.burst(ev.x, ev.y - 10, 26, { col: ["#e8ff9a", "#a0e050", "#fff"], sp: 90, up: 70, life: 0.9, size: 2, kind: "glow", add: true });
      lohnText(L(["Der Kreis summt. Deine Wunden schließen sich, und eine Flasche füllt sich mit leuchtendem Saft.", "The circle hums. Your wounds close, and a flask fills with glowing sap."])); done("dank");
    } else if (ev.left <= 0) { ev.sporen.forEach(o => (o.got = true)); lohnText(L(["Die Sporen welken. Der Kreis verstummt – ohne Groll.", "The spores wilt. The circle falls silent – without grudge."])); done("weg"); }
  }

  /* 3) Schattenspiegel: Ezekiels Schatten tritt heraus */
  function spiegelStart(Pw) {
    const P = Pw || Z.player, tier = (Z.run && Z.run.tier) || 1;
    const e = Z.spawnEnemy("soeldner", ev.x + (P.x < ev.x ? 18 : -18), ev.y, { tier });
    if (!e) { done("weg"); return; }
    e.w38schatten = 1; e.hpMax = e.hp = Math.round(e.hpMax * 2.4); e.dmgMul = (e.dmgMul || 1) * 1.2; e.aware = true; e.spawnT = 0; e.noLoot = true;
    e.w38w = (P.slots && P.slots.a1 && P.slots.a1.id) || "faeuste";
    ev.e = e; ev.st = "lauf"; A.play("dark", { vol: 0.7 }); A.play("shadow", { vol: 0.5 });
    FX.burst(ev.x, ev.y - 14, 24, { col: ["#2a1a2e", "#6a3a7a", "#c03a5a"], sp: 110, life: 0.6, size: 3, kind: "smoke" });
    if (FX.addShake) FX.addShake(3);
    FX.text(ev.x, ev.y - 34, L(["Dein Schatten!", "Your shadow!"]), "#c890ff", true); sync();
  }
  function spiegelTick() {
    const e = ev.e; if (!e) return;
    if (e.dead) {
      Z.dropItem(e.x + e.w / 2, e.y, { elite: true }); Z.dropShards(e.x + e.w / 2, e.y, 35);
      A.play("holy", { vol: 0.5, rate: 0.8 }); FX.burst(e.x + e.w / 2, e.y + e.h / 2, 22, { col: ["#2a1a2e", "#c890ff"], sp: 120, life: 0.7, size: 2.4, kind: "smoke" });
      lohnText(L(["Der Spiegel zerspringt. Was darin war, gehört jetzt dir.", "The mirror shatters. Whatever was inside is yours now."])); done("frei");
    } else if (ev.lv !== Z.level) done("weg");
  }

  /* Auslösen durch Ezekiel oder Spieler 2 (koop.js p2Use ruft Z.begegnung.p2Use) */
  function ausloesen(P) {
    if (ev.k === "gnom") { if (netP2(P)) anGast(); else gnomFenster(); }
    else if (ev.k === "pilz") pilzStart(); else spiegelStart(P);
  }
  function p2Use(P) {
    if (!ev || ev.lv !== Z.level || ev.st !== "warte" || gast() || !near(ev, 26, P) || (Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive))) return false;
    ausloesen(P); return true;
  }
  /* Online: Angebot an den Gast → Fenster beim Gast → Antwort prüft der Gastgeber (wie Wandlungsschrein/Amboss) */
  let offen = null;
  function anGast() {
    const S = Z.online && Z.online.S, Q = Z.player; if (!S || !S.link || !Q) return;
    offen = { lv: Z.level, ev, t: performance.now() };
    S.link.sendR({ t: "w38beg", k: "gnom", pot: Q.potions > 0, gold: (Q.gold | 0) >= 60 });
    FX.text(ev.x, ev.y - 30, L(["Spieler 2 verhandelt …", "Player 2 is bargaining …"]), "#c8b8a8");
  }
  function netGast(m) { /* beim Gast */
    if (!gast() || !m || m.k !== "gnom" || !Z.ui || Z.ui.modalOpen) return;
    gnomFenster({ pot: m.pot === true, gold: m.gold === true });
  }
  function netHost(m) { /* beim Gastgeber */
    const o = offen; offen = null;
    if (!o || !m || typeof m.w !== "string" || o.lv !== Z.level || o.ev !== ev || performance.now() - o.t > 120000) return;
    if (["trank", "gold", "geh"].indexOf(m.w) < 0) return;
    wahl(m.w);
  }

  /* ---------- Takt ---------- */
  const ue0 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    const r = ue0.apply(this, arguments);
    safe("takt", () => {
      if (!ev || ev.lv !== Z.level || gast()) return;
      ev.t += dt;
      const use = inp.pressed.use && !Z.interactTarget && !(Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive));
      if (ev.st === "warte" && near(ev, 26) && use) {
        inp.consume && inp.consume("use");
        ausloesen(Z.player);
      } else if (ev.st === "lauf") { if (ev.k === "pilz") pilzTick(dt); else if (ev.k === "spiegel") spiegelTick(); }
    });
    return r;
  };
  /* Rückweg: Zustand bleibt am Gebiet (lv.w38begDone) – keine zweite Begegnung im selben Gebiet */

  /* ---------- Zeichnen (Weltkoordinaten) ---------- */
  function parse(lv) {
    if (ev && ev.lv === lv) return ev;
    const s = lv && lv.w38beg; if (!s || typeof s !== "string") return null;
    const f = s.split("|"); if (f.length < 4) return null;
    const o = { k: f[0], x: +f[1], y: +f[2], st: f[3], left: +f[4] || 0, sporen: [] };
    if (f[5]) for (const q of f[5].split(";")) if (q) { const [a, b] = q.split("."); o.sporen.push({ x: +a * T + 8, y: +b * T + 4, got: false }); }
    return o;
  }
  function drawGnom(c, x, y, t, st) {
    c.save(); c.translate(x, y);
    c.save(); c.globalAlpha *= 0.3; ell(c, 0, 0.5, 8, 1.4, "#000"); c.restore();
    const sit = st === "warte";
    if (sit) { /* sitzt an die Wand gelehnt, Bein ausgestreckt */
      limb(c, -2, -3, 6, -1, 2.2, "#5a4a3c"); ell(c, 7, -0.8, 1.8, 1, "#2a1e16");
      poly(c, [-6, 0, 2, 0, 1.5, -11, -5, -11], "#6a5644"); limb(c, -3, -6, 3, -4, 1, "#8a2a24"); /* Verband/Wunde */
      circ(c, -2, -14, 4, "#8a8c90"); ell(c, 1.6, -14.4, 1.4, 1, "#9a9ca0"); circ(c, -0.6, -15, 0.7, "#2a2020"); circ(c, 1.8, -15, 0.7, "#2a2020");
      limb(c, -5, -15, -7.5, -17, 1, "#8a8c90"); limb(c, 1, -15.5, 3.5, -17.5, 1, "#8a8c90");
      poly(c, [7, -6, 10, -6, 10, -2, 7, -2], "#7a5a34"); limb(c, 8.5, -6, 8.5, -8, 0.6, "#c8a060"); /* Bündel */
      limb(c, 4, -8, 9, -12, 0.6, "#3a2a1a"); poly(c, [9, -12, 10.4, -13.6, 9.8, -11.4], "#d8d0c8"); /* steckender Pfeil */
    } else { /* steht, winkt */
      limb(c, -1.5, -7, -1.5, 0, 2, "#5a4a3c"); limb(c, 1.5, -7, 1.8, 0, 2, "#5a4a3c");
      poly(c, [-4, -6, 4, -6, 3.5, -15, -3.5, -15], "#6a5644"); limb(c, 3, -13, 6, -17 + Math.sin(t * 6) * 1.5, 1.2, "#8a8c90");
      circ(c, 0, -18, 4, "#8a8c90"); circ(c, 1.4, -18.6, 0.7, "#2a2020"); limb(c, -3.5, -19, -6, -21, 1, "#8a8c90");
    }
    c.restore();
  }
  function drawPilz(c, x, y, t, st) {
    c.save(); c.translate(x, y);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, rx = Math.cos(a) * 22, ry = Math.sin(a) * 3; ell(c, rx, ry, 3, 2, "#c8b8a0"); ell(c, rx, ry - 1.4, 3.4, 1.6, "#a0506a"); }
    limb(c, -1.5, -10, -2, 0, 3, "#d8ccb4"); limb(c, 1.5, -10, 2, 0, 3, "#d8ccb4");
    poly(c, [-4, -8, 4, -8, 3, -20, -3, -20], "#e0d4bc");
    limb(c, -3, -16, -7, -10 + Math.sin(t * 1.4) * 1, 1.4, "#d8ccb4"); limb(c, 3, -16, 7, -10 - Math.sin(t * 1.4) * 1, 1.4, "#d8ccb4");
    ell(c, 0, -22, 11, 5.5, "#a0506a"); ell(c, 0, -23.5, 9, 3.4, "#c06a84");
    for (const [a, b] of [[-5, -24], [3, -25], [6, -22], [-2, -21]]) circ(c, a, b, 1, "#f0d8e0");
    circ(c, -1.6, -17, 0.8, "#2a1a20"); circ(c, 1.6, -17, 0.8, "#2a1a20");
    if (st !== "weg") glow(c, 0, -20, 16 + pulse * 6, "rgba(200,240,110," + (0.25 + 0.2 * pulse).toFixed(2) + ")");
    c.restore();
  }
  function drawSpore(c, o, t) {
    const b = Math.sin(t * 3 + o.x) * 2;
    glow(c, o.x, o.y + b, 10, "rgba(220,255,140,.55)"); circ(c, o.x, o.y + b, 2.2, "#e8ff9a"); circ(c, o.x - 0.6, o.y + b - 0.6, 0.8, "#ffffff");
    if (Z.addLight) Z.addLight(o.x, o.y, 40, "#d8f080", 0.4);
  }
  function drawSpiegel(c, x, y, t, st) {
    c.save(); c.translate(x, y);
    c.save(); c.globalAlpha *= 0.3; ell(c, 0, 0.5, 11, 1.6, "#000"); c.restore();
    limb(c, -9, 0, -7, -4, 2, "#3a2a2a"); limb(c, 9, 0, 7, -4, 2, "#3a2a2a");
    ell(c, 0, -20, 10, 18, "#4a3a30"); ell(c, 0, -20, 8.4, 16.2, "#7a6040");
    if (st === "frei") { /* zersprungen */
      ell(c, 0, -20, 7.6, 15.4, "#1a1216"); c.strokeStyle = "#c8c0d0"; c.lineWidth = 0.6;
      c.beginPath(); c.moveTo(-5, -32); c.lineTo(1, -20); c.lineTo(-3, -8); c.moveTo(1, -20); c.lineTo(6, -24); c.stroke();
    } else {
      ell(c, 0, -20, 7.6, 15.4, "#120c12");
      const w = 0.5 + 0.5 * Math.sin(t * 1.7);
      c.save(); c.globalAlpha *= 0.55 + 0.25 * w; poly(c, [-3, -6, 3, -6, 3.4, -18, 2.4, -26, -2.4, -26, -3.4, -18], "#2a1a2e"); circ(c, 0, -29, 3.2, "#2a1a2e"); c.restore();
      circ(c, -1.2, -29.4, 0.6, "#ff4a5a"); circ(c, 1.2, -29.4, 0.6, "#ff4a5a");
      glow(c, 0, -20, 14, "rgba(150,70,170," + (0.2 + 0.15 * w).toFixed(2) + ")");
    }
    for (let i = -1; i <= 1; i += 2) circ(c, i * 7.6, -34, 1.2, "#c8a060");
    c.restore();
  }
  function label(c, o, txt) {
    if (o.st !== "warte" || !spieler().some(Pq => near(o, 60, Pq))) return; /* auch Spieler 2 / Online-Gast sieht den Hinweis */
    const k = inp.label ? inp.label("use") : ""; const s = (k ? "[" + k + "] " : "✋ ") + txt;
    c.save(); c.font = "700 7px 'Alegreya Sans',sans-serif"; c.textAlign = "center";
    const w = c.measureText(s).width + 8, y0 = o.y - (o.k === "pilz" ? 36 : o.k === "gnom" ? 26 : 46); /* Gnom sitzt: Schild knapp über ihm, nicht im Ortsnamen */
    c.fillStyle = "rgba(20,8,10,.78)"; c.fillRect(o.x - w / 2, y0 - 7, w, 10); c.fillStyle = "#ffd27a"; c.fillText(s, o.x, y0); c.restore();
  }
  const dp0 = Z.drawProjs;
  Z.drawProjs = function (c) {
    if (dp0) dp0.apply(this, arguments);
    safe("bild", () => {
      const o = parse(Z.level); if (!o) return;
      const t = (Z.gfx && Z.gfx.time) || 0, cam = Z.cam;
      if (cam && (o.x < cam.x - 200 || o.x > cam.x + cam.w + 200) && !(o.k === "pilz" && o.st === "lauf")) return;
      if (o.k === "gnom") { if (o.st !== "weg" || o.t < 3) drawGnom(c, o.x, o.y, t, o.st); label(c, o, L(["Sprechen", "Talk"])); }
      else if (o.k === "pilz") {
        drawPilz(c, o.x, o.y, t, o.st); label(c, o, L(["Zuhören", "Listen"]));
        if (o.st === "lauf") { for (const q of o.sporen) if (!q.got) drawSpore(c, q, t);
          c.save(); c.font = "700 8px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "#d8f080"; c.fillText(Math.max(0, Math.ceil(o.left)) + " s", o.x, o.y - 32); c.restore(); }
      } else if (o.k === "spiegel") { drawSpiegel(c, o.x, o.y, t, o.st); label(c, o, L(["Berühren", "Touch"])); }
      if (Z.addLight && o.k !== "pilz") Z.addLight(o.x, o.y - 16, 50, o.k === "spiegel" ? "#a060c0" : "#ffcf8a", 0.3);
    });
  };
  /* Schatten: Ezekiels Gestalt dunkel nachzeichnen (statt des Söldners) */
  const de0 = Z.drawEnemy;
  Z.drawEnemy = function (c, e, time) {
    if (!e || !e.w38schatten || !Z.player || !Z.drawPlayer) return de0.apply(this, arguments);
    let ok = false;
    safe("schatten", () => {
      const P0 = Z.player, px = Object.create(P0);
      Object.assign(px, { x: e.x + (e.w - P0.w) / 2, y: e.y + e.h - P0.h, face: e.face || (P0.x > e.x ? 1 : -1), vx: e.vx || 0, vy: e.vy || 0, onGround: true, act: null, rollT: 0, hurtT: e.hurtT || 0, iframe: 0, invis: 0, dead: false, climbing: false, crouch: false, plunge: false, wrath: 0, koopDown: false, anim: Object.assign({}, P0.anim || {}), w38glut: 0, w38lad: 0, w38hook: null, w38pull: null });
      const it = Z.WEAPONS[e.w38w] ? { id: e.w38w, aff: [], runes: [] } : null;
      px.slots = { a1: it ? Object.assign({}, P0.slots && P0.slots.a1, it) : null, a2: null, s1: null, s2: null };
      c.save(); c.filter = "brightness(0.3) saturate(0.35)"; Z.drawPlayer(c, px, time); c.restore(); /* dunkel, aber vor dunklem Grund noch lesbar */
      const cx = e.x + e.w / 2, hy = e.y + 6, f = px.face;
      circ(c, cx + f * 2, hy, 0.9, "#ff4a5a"); circ(c, cx + f * 4.2, hy, 0.9, "#ff4a5a");
      if (!off()) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, cx, e.y + e.h / 2, 20, "rgba(150,70,170,.38)"); c.restore(); }
      ok = true;
    });
    if (!ok) return de0.apply(this, arguments);
  };

  /* Schatten-Verhalten nach Ezekiels Waffe (dezent): Fernwaffe → schießt mit Vorwarnung aus der Distanz, Schild → blockt
     Treffer von vorn ab (−40 %), solange er nicht selbst angreift. Nahkampf: Söldner-Verhalten wie gehabt. */
  const schattenArt = e => { const d = Z.WEAPONS[e.w38w]; return d ? d.kind : "melee"; };
  const ue1 = Z.updateEnemies;
  Z.updateEnemies = function (dt) {
    const r = ue1.apply(this, arguments);
    safe("schattenKI", () => {
      if (gast()) return;
      if (!Z.hitEnemy._w38s && Z.enemies.some(e => e.w38schatten && !e.dead)) wrapHit();
      for (const e of Z.enemies) {
        if (!e.w38schatten || e.dead || schattenArt(e) !== "ranged") continue;
        const P = Z.player; if (!P || P.dead) continue;
        e.w38cd = (e.w38cd == null ? 1.2 : e.w38cd) - dt;
        const cx = e.x + e.w / 2, cy = e.y + 10, dx = P.x + P.w / 2 - cx, ad = Math.abs(dx);
        if (e.w38cd <= 0.35 && e.w38cd + dt > 0.35 && ad > 50 && ad < 280) FX.text(cx, e.y - 8, "!", "#c890ff"); /* Vorwarnung */
        if (e.w38cd <= 0) {
          e.w38cd = 1.7 + Math.random() * 0.6;
          if (ad > 50 && ad < 280 && !(e.st && (e.st.stun > 0 || e.st.root > 0)) && (!Z.world.los || Z.world.los(cx, cy, P.x + P.w / 2, P.y + 12))) {
            e.face = dx > 0 ? 1 : -1;
            Z.aimProj("e_pfeil", cx + e.face * 6, cy, P.x + P.w / 2, P.y + 12, { dmg: (e.dmgMul || 10) * 0.8 });
            A.play("bow", { vol: 0.4, rate: 0.85 });
          }
        }
      }
    });
    return r;
  };
  /* außen anhängen – manche Module setzen Z.hitEnemy erst später neu; darum im Takt prüfen und ggf. erneut umhüllen */
  function wrapHit() {
    const he0 = Z.hitEnemy; if (!he0 || he0._w38s) return;
    const f = function (e, dmg, o) {
    if (e && e.w38schatten && !e.dead && typeof dmg === "number" && schattenArt(e) === "shield" && !e.act && !(o && (o.dot || o.fx))) {
      const dir = (o && o.dir) || (Z.player ? U.sign(e.x - Z.player.x) : 0);
      if (dir && (e.face || 1) === -dir) { dmg *= 0.6; safe("block", () => { A.play("block", { vol: 0.4, rate: 0.9 }); FX.burst(e.x + e.w / 2 - dir * 6, e.y + 12, 5, { col: ["#c890ff", "#e8e0d8"], sp: 70, life: 0.2, size: 1.4, kind: "spark", add: true }); }); }
    }
    const args = Array.prototype.slice.call(arguments); args[1] = dmg; /* strict: arguments folgt dmg nicht */
    return he0.apply(this, args);
    };
    f._w38s = true; Z.hitEnemy = f;
  }
  wrapHit();

  /* Prüfhilfe */
  Z.begegnung = { force: k => { setup(Z.level, k); return ev && { k: ev.k, x: ev.x, y: ev.y }; }, ev: () => ev, NAME, p2Use, netGast, netHost };
})();
