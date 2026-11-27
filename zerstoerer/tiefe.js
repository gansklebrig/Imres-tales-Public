/* Ezekiel – The Destroyer · W38 Endspiel: Die Tiefe (tiefe.js)
   Bestand geprüft: Härte I–V (haerte.js, Regeln je Stufe), Bossrausch (bossrausch.js, nur Bosse, Sandkasten, Bestzeiten),
   Tagesprüfung (abwechslung.js, fester Tages-Seed), Nemesis/Kopfgeld/Mini-Bosse (nemesis.js), Wunder, Pakte, Mutationen.
   Was fehlte: ein offenes Ende für den eigenen, im Lauf aufgebauten Charakter – „wie weit komme ich noch?“.
   DIE TIEFE: Nach einem Sieg über einen Endboss steht im Abspann „⬇ In die Tiefe“ (freigeschaltet, sobald zwei verschiedene
   Enden erreicht sind oder Härte III besiegt ist). Der Lauf geht mit derselben Ausrüstung weiter: Gebiet um Gebiet hinab
   (zufällige Gebiete, nie zweimal hintereinander dasselbe, jedes mit einer Gebietslage), dazwischen Durchgänge wie sonst
   (Händler, Segen, Brunnen, Wandlungsschrein). Je Tiefe: Gegner +16 % Leben, +10 % Schaden, mindestens auf Stufe 5;
   ab Tiefe 4 mehr Eliten. Beim Betreten jeder neuen Tiefe ab 2 schickt Nundros Rabe 6 × Tiefe Seelensplitter ins Lager.
   Ende nur durch Tod oder „Lauf aufgeben“; die erreichte Tiefe zählt sofort beim Betreten (Neuladen bringt nichts,
   Rückweg-Tor zählt nicht doppelt, weil es Z.loadArea nicht aufruft).
   Lager: „Schacht der Tiefe“ (neben dem Sonnenstein) zeigt Bestwert, Regeln und die Belohnungen. Lohn: Umhänge bei Tiefe 5
   und 10, Titel bei 15, vier Erfolge. Speicher: Z.meta.w38tiefe (neuer Schlüssel).
   Koop: Spieler 2 geht mit. Online: nur der Gastgeber kann hinabsteigen; der Gast folgt über die Gebietsnachricht (Türen
   tragen ihr Ziel mit). Bossrausch: kein Abspann, also keine Tiefe. Kein Blau. Prüfhilfe Z.tiefe.start(), Z.tiefe.state(). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.tiefe) return;
  const T = Z.TILE, A = Z.audio, FX = Z.fx, L = v => Z.L(v), TAU = Math.PI * 2;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const M = () => Z.meta || {};
  const gast = () => { const s = Z.online && Z.online.S; return !!(s && s.role === "guest" && s.playing); };
  const rausch = () => !!(Z.bossrausch && Z.bossrausch.aktiv && Z.bossrausch.aktiv());
  const lo = () => !!(Z.gq && (Z.gq.level === 0 || Z.gq.lean));
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : setTimeout(fn, ms));
  const HP_K = 0.16, DMG_K = 0.10, MINTIER = 5; /* Bot-Messung: mit +15 %/+7 % blieb Tiefe 12 zu harmlos */

  function TM() { const m = M(); let t = m.w38tiefe; if (!t || typeof t !== "object" || Array.isArray(t)) t = m.w38tiefe = {}; t.best = +t.best || 0; t.laeufe = +t.laeufe || 0; return t; }
  function frei() {
    const m = M(), e = m.endings || {}, h = m.haerte || {};
    const enden = ["tiefe", "glut", "himmel"].filter(k => e[k]).length;
    return enden >= 2 || (h.siege && (h.siege[3] || h.siege[4] || h.siege[5])) || (h.max | 0) >= 4 || TM().best > 0;
  }
  const tf = () => (Z.run && Z.run.w38tiefe) || null;
  const mul = n => ({ hp: 1 + HP_K * n, dmg: 1 + DMG_K * n });

  /* Gebietsauswahl: alle Gebiete außer Torhof, tiefere häufiger, nie dasselbe wie die letzten beiden */
  function naechstes(t) {
    const ids = Object.keys(Z.BIOMES).filter(k => k !== "torhof" && Z.BIOMES[k] && Z.BIOMES[k].foes);
    const w = {}; for (const k of ids) if (!t.hist.slice(-2).includes(k)) w[k] = 1 + (Z.BIOMES[k].tier || 0) * 0.5;
    const R = Z.Rng(((Z.run.seed >>> 0) ^ (t.n * 2654435761)) >>> 0);
    return R.weighted(w);
  }
  const LAGEN = ["besetzt", "zahlmeister", "gezeichnet", "schatz", "seelenflut"];

  function start() {
    const run = Z.run, P = Z.player;
    if (!run || !P || P.dead || gast() || rausch() || !frei() || tf()) return false;
    const t = run.w38tiefe = { n: 0, hist: [], maxN: 0, t0: Date.now() };
    t.next = naechstes(t);
    const tm = TM(); tm.laeufe++; Z.saveMeta();
    if (Z.ui && Z.ui.modalOpen) Z.ui.close();
    A.play("gong", { vol: 0.6, rate: 0.7 }); A.play("dark", { vol: 0.5 });
    /* Atem holen: Leben halb auffüllen, Tränke voll – die Tiefe beginnt nicht halbtot */
    P.hp = Math.min(P.hpMax, P.hp + P.hpMax * 0.5); P.potions = P.potMax;
    Z.run.doorsOpen = true;
    const id0 = Z.level ? Z.level.id : "glut", from = Z.ARENAS[id0] && Z.ARENAS[id0].base ? Z.ARENAS[id0].base : (Z.BIOMES[id0] ? id0 : "glut");
    Z.ui.fade(() => { Z.loadArea("passage", { from, to: t.next }); });
    return true;
  }

  /* Gebietswechsel: Tiefe zählen, Türen umbiegen, Lage erzwingen */
  const la0 = Z.loadArea;
  Z.loadArea = function (id, opts) {
    const t = tf();
    if (t && id !== "passage" && id !== "lager" && Z.BIOMES[id] && Z.abw && Z.abw.force) {
      const R = Z.Rng(((Z.run.seed >>> 0) ^ ((t.n + 1) * 40503)) >>> 0);
      Z.abw.force(LAGEN[Math.floor(R() * LAGEN.length)]);
    }
    if (t) t.load = id !== "passage" && id !== "lager" && Z.BIOMES[id] ? t.n + 1 : 0; /* Gegner beim Aufbau schon mit der neuen Tiefe */
    let r;
    try { r = la0.apply(this, arguments); } finally { if (t) t.load = 0; }
    try {
      const t2 = tf(), lv = Z.level;
      if (t2 && lv && !lv.hub) {
        if (lv.passage) { for (const d of lv.doors || []) if (d.kind === "exit") d.to = t2.next; }
        else if (Z.BIOMES[lv.id]) {
          t2.n++; lv.w38tn = t2.n; t2.hist.push(lv.id); t2.cur = lv.id; t2.next = naechstes(t2);
          for (const d of lv.doors || []) if (d.kind === "exit") d.to = t2.next;
          if (t2.n > t2.maxN) {
            t2.maxN = t2.n;
            const tm = TM(); if (t2.n > tm.best) { tm.best = t2.n; tm.bestT = Date.now(); }
            if (t2.n >= 2 && !gast()) { const s = 6 * t2.n; M().shards = (M().shards | 0) + s; if (Z.run) Z.run.shardsBank = (Z.run.shardsBank | 0) + s; }
            Z.saveMeta();
          }
          later(() => { if (Z.level === lv && Z.ui && Z.ui.notify) { const k = mul(t2.n); Z.ui.notify("<b>⬇ " + esc(L(["Tiefe ", "Depth "]) + t2.n) + "</b><br><small>" + esc(L(["Gegner +", "Foes +"]) + Math.round((k.hp - 1) * 100) + L([" % Leben, +", "% health, +"]) + Math.round((k.dmg - 1) * 100) + L([" % Schaden", "% damage"]) + (t2.n >= 2 ? L([" · Rabe: +", " · raven: +"]) + 6 * t2.n + " ◆" : "")) + "</small>", { prio: 2, art: "gefahr", key: "w38tiefe", dauer: 5000 }); } }, 1500);
        }
      }
      if (lv && lv.hub) placeSchacht(lv);
    } catch (e) { console.error("W38 Endspiel", e); }
    return r;
  };
  /* Gegner der Tiefe: mindestens Stufe 5, dazu Tiefen-Aufschlag; ab Tiefe 4 mehr Eliten */
  const sp0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    const t = tf(), nE = t ? (t.load || t.n) : 0;
    if (t && nE > 0 && Z.level && !Z.level.passage && !Z.level.hub && !gast()) {
      const d = Z.ENEMIES[id] || (Z.BOSSDEF && Z.BOSSDEF[id]);
      o = Object.assign({}, o);
      if (o.tier == null) o.tier = Math.max((Z.run && Z.run.tier) || 0, MINTIER);
      if (nE >= 4 && d && !d.boss && !o.elite && !d.group && Z.R() < Math.min(0.12, 0.02 * (nE - 3))) o.elite = true;
    }
    const e = sp0.call(this, id, x, y, o);
    try {
      if (e && t && nE > 0 && Z.level && !Z.level.passage && !Z.level.hub && !gast() && !e.w38t) {
        const k = mul(nE); e.w38t = nE;
        e.hp = Math.round(e.hp * k.hp); e.hpMax = Math.round(e.hpMax * k.hp); e.dmgMul = (e.dmgMul || 1) * k.dmg;
      }
    } catch (err) { console.error("W38 Endspiel", err); }
    return e;
  };
  /* Kapitelseite: Tiefe zusätzlich zur Lage */
  if (Z.abw && Z.abw.pageLines) {
    const pl0 = Z.abw.pageLines;
    Z.abw.pageLines = function (lv) { const r = pl0.apply(this, arguments) || []; const t = tf(); if (t && lv && Z.BIOMES[lv.id] && !lv.passage) return [L(["⬇ Tiefe ", "⬇ Depth "]) + (lv.w38tn || t.n + 1)].concat(r); return r.length ? r : undefined; };
  }

  /* ======================= Abspann-Knopf und Lager-Station ======================= */
  function wireUI() {
    const ui = Z.ui; if (!ui || !ui.ending || !ui.actions || typeof ui.pause !== "function") return setTimeout(wireUI, 60);
    ui.actions.w38Tiefe = () => start();
    ui.actions.w38Schacht = () => schachtMenu();
    const end0 = ui.ending;
    ui.ending = function () {
      const r = end0.apply(this, arguments);
      try {
        if (frei() && !gast() && !rausch() && Z.run && !tf()) {
          const k = document.querySelector("#modal .knoepfe");
          if (k && !k.querySelector('[data-act="w38Tiefe"]')) {
            const b = document.createElement("button"); b.dataset.act = "w38Tiefe"; b.className = "w38-tiefknopf";
            b.textContent = "⬇ " + L(["In die Tiefe", "Into the Depths"]);
            b.title = L(["Mit dieser Ausrüstung weiter hinab – Gebiet um Gebiet härter.", "Go deeper with this gear – each area harder."]);
            k.insertBefore(b, k.firstChild);
            const p = document.createElement("p"); p.className = "w38-tiefhinweis";
            p.textContent = L(["Die Fäden reißen nicht ganz. Unter dir öffnet sich die Tiefe – bisher erreicht: Tiefe ", "The threads don't fully snap. The depths open beneath you – best so far: depth "]) + TM().best + ".";
            /* Knopfleiste samt Hinweis unten festhalten, damit „In die Tiefe“ ohne Scrollen neben „Zurück ins Lager“ sichtbar ist */
            const bar = document.createElement("div"); bar.className = "w38-endleiste";
            k.parentNode.insertBefore(bar, k); bar.appendChild(p); bar.appendChild(k);
          }
        }
      } catch (e) { console.error("W38 Endspiel", e); }
      return r;
    };
    if (!ui.pause._w38t) {
      const p0 = ui.pause;
      ui.pause = function () {
        const r = p0.apply(this, arguments);
        try {
          const t = tf(), box = document.querySelector("#modal .knoepfe.senk") || document.querySelector("#modal .knoepfe");
          if (t && box && !document.querySelector("#modal .w38-tiefpause")) {
            const k = mul(t.n), p = document.createElement("p"); p.className = "w38-pause w38-tiefpause";
            p.innerHTML = "<b>⬇ " + esc(L(["Tiefe ", "Depth "]) + t.n) + "</b> – " + esc(L(["Gegner +", "foes +"]) + Math.round((k.hp - 1) * 100) + L([" % Leben, +", "% health, +"]) + Math.round((k.dmg - 1) * 100) + L([" % Schaden · Bestwert ", "% damage · best "]) + TM().best);
            box.parentNode.insertBefore(p, box);
          }
        } catch (e) { console.error("W38 Endspiel", e); }
        return r;
      };
      ui.pause._w38t = true;
    }
  }
  wireUI();
  /* Ende eines Tiefen-Laufs: Meldung im Lager */
  const btc0 = Z.backToCamp;
  Z.backToCamp = function () {
    const t = tf();
    if (t && !t.fertig && !gast()) {
      t.fertig = true; const tm = TM(); tm.last = { n: t.n, d: Date.now() }; try { Z.saveMeta(); } catch (_) {}
      if (t.n > 0) setTimeout(() => { /* bossLater verfällt mit dem Lauf – Meldung im Lager kam sonst nie */ if (Z.ui && Z.ui.notify) Z.ui.notify("<b>⬇ " + esc(L(["Tiefe ", "Depth "]) + t.n + L([" erreicht", " reached"])) + "</b><br><small>" + esc(L(["Bestwert: Tiefe ", "Best: depth "]) + tm.best) + "</small>", { prio: 2, art: "gold", key: "w38tiefende", dauer: 6500 }); }, 2400);
    }
    return btc0.apply(this, arguments);
  };

  let schacht = null;
  function placeSchacht(lv) {
    schacht = null;
    if (!lv || !lv.hub || !frei()) return;
    const base = lv.lcore && Number.isFinite(lv.lcore.stone) ? lv.lcore.stone : (lv.start ? lv.start.x - 12 : 40);
    const x = (base - 22.5) * T + 8, y = 12 * T;
    schacht = { lv, x, y };
    (Z.interacts = Z.interacts || []).push({ x, y, r: 16, h: 30, w38: "schacht", label: () => L(["Schacht der Tiefe", "Shaft of the Depths"]) + (TM().best ? " · " + L(["Bestwert ", "best "]) + TM().best : ""), use: () => schachtMenu() });
  }
  const LOHN = [[5, ["Umhang „Abgrundsaum“", "Cape 'Abyss Hem'"]], [10, ["Umhang „Fadenschwärze“", "Cape 'Thread Black'"]], [15, ["Titel „der Unergründliche“", "Title 'the Unfathomable'"]]];
  function schachtMenu() {
    if (!Z.ui) return;
    const tm = TM();
    let h = "<h2>⬇ " + esc(L(["Die Tiefe", "The Depths"])) + "<small>" + esc(L(["Schacht der Tiefe", "Shaft of the Depths"])) + "</small></h2>";
    h += '<p class="w38-unter">' + esc(L(["Die Tiefe öffnet sich nur hinter einem Ende: Besiege einen Endboss und wähle im Abspann „In die Tiefe“. Dann geht es mit deiner Ausrüstung weiter hinab – Gebiet um Gebiet, jedes mit einer Lage, dazwischen Durchgänge wie gewohnt.", "The depths open only beyond an ending: defeat a final boss and choose 'Into the Depths' in the epilogue. Then you go deeper with your gear – area after area, each with a situation, passages in between as usual."])) + "</p>";
    h += '<ul class="w38-ges"><li>' + esc(L(["Je Tiefe: Gegner +16 % Leben und +10 % Schaden, mindestens Stufe 5; ab Tiefe 4 mehr Eliten.", "Per depth: foes +16% health and +10% damage, at least tier 5; more elites from depth 4."])) + "</li><li>" + esc(L(["Ab Tiefe 2 bringt Nundros Rabe 6 × Tiefe Seelensplitter ins Lager.", "From depth 2, Nundro's raven carries 6 × depth soul shards to camp."])) + "</li><li>" + esc(L(["Ende nur durch Tod oder Aufgeben. Die erreichte Tiefe zählt sofort.", "Ends only by death or giving up. The depth reached counts immediately."])) + "</li></ul>";
    h += '<p class="w38-best">' + esc(L(["Bestwert: ", "Best: "])) + "<b>" + (tm.best ? L(["Tiefe ", "depth "]) + tm.best : "–") + "</b>" + (tm.laeufe ? " · " + esc(L(["Abstiege ", "descents "]) + tm.laeufe) : "") + (tm.last ? " · " + esc(L(["zuletzt Tiefe ", "last: depth "]) + tm.last.n) : "") + "</p>";
    h += '<p class="w38-hist">' + LOHN.map(([n, t]) => "<span" + (tm.best >= n ? ' class="w38-ok"' : "") + ">" + (tm.best >= n ? "✓ " : "") + esc(L(["Tiefe ", "Depth "]) + n + ": " + L(t)) + "</span>").join("") + "</p>";
    h += '<div class="knoepfe"><button data-act="close" autofocus>' + esc(L(["Zurück", "Back"])) + "</button></div>";
    Z.ui.open(h, { cls: "schmal w38box" });
  }

  /* ======================= Erfolge und Umhänge ======================= */
  if (Z.CAPES) Object.assign(Z.CAPES, {
    abgrundsaum: Z.CAPES.abgrundsaum || { n: ["Abgrundsaum", "Abyss Hem"], c: ["#2a1014", "#a0241a"] },
    fadenschwaerze: Z.CAPES.fadenschwaerze || { n: ["Fadenschwärze", "Thread Black"], c: ["#140c0c", "#e5b454"] }
  });
  const ERF = [
    { id: "w38_tiefe1", c: "geschichte", n: ["Hinab", "Down Below"], d: ["Nach einem Ende in die Tiefe steigen.", "Descend into the depths after an ending."], ok: () => TM().best >= 1, r: { titel: ["der Absteiger", "the Descender"] }, motiv: "tor", stufe: "silber" },
    { id: "w38_tiefe5", c: "geschichte", n: ["Fünf Schritte ins Dunkel", "Five Steps into Darkness"], d: ["Tiefe 5 erreichen.", "Reach depth 5."], ok: () => TM().best >= 5, p: () => [Math.min(5, TM().best), 5], r: { cape: "abgrundsaum" }, motiv: "tor", stufe: "gold" },
    { id: "w38_tiefe10", c: "geschichte", n: ["Wo die Fäden enden", "Where the Threads End"], d: ["Tiefe 10 erreichen.", "Reach depth 10."], ok: () => TM().best >= 10, p: () => [Math.min(10, TM().best), 10], r: { cape: "fadenschwaerze" }, motiv: "faden", stufe: "gold" },
    { id: "w38_tiefe15", c: "geschichte", n: ["Unergründlich", "Unfathomable"], d: ["Tiefe 15 erreichen.", "Reach depth 15."], ok: () => TM().best >= 15, p: () => [Math.min(15, TM().best), 15], r: { titel: ["der Unergründliche", "the Unfathomable"] }, motiv: "krone", stufe: "blut", selten: true }
  ];
  for (const a of ERF) { a.kat = a.c; a.siegel = { motiv: a.motiv, stufe: a.stufe, band: true }; }
  if (Z.ACH) for (const a of ERF) if (!Z.ACH.some(x => x.id === a.id)) Z.ACH.push(a);

  /* ======================= Zeichnen: Schacht im Lager ======================= */
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (wp0) wp0.apply(this, arguments);
    try { if (schacht && Z.level === schacht.lv && Z.level.hub) drawSchacht(c, schacht.x, schacht.y, t); } catch (e) { if (!dErr++) console.error("W38 Endspiel", e); }
  };
  let dErr = 0;
  function drawSchacht(c, x, y, t) {
    const cam = Z.cam; if (cam && (x < cam.x - 40 || x > cam.x + cam.w + 40)) return;
    const L0 = lo();
    c.save();
    /* Steinrand eines runden Schachts, darin Dunkel mit glimmenden Fäden, ein Kettenhaspel darüber */
    c.fillStyle = "#14090a"; c.beginPath(); c.ellipse(x, y - 2, 11, 3.2, 0, 0, TAU); c.fill();
    c.fillStyle = "#5a4a42"; for (let i = -5; i <= 5; i++) { const a = i / 5 * Math.PI * 0.5; c.fillRect(x + Math.sin(a) * 12 - 1.6, y - 4 + Math.abs(i) * 0.25, 3.2, 3.4); }
    c.fillStyle = "#3a2e28"; c.fillRect(x - 13, y - 1.2, 26, 1.4);
    c.fillStyle = "#4a3020"; c.fillRect(x - 10, y - 24, 1.6, 21); c.fillRect(x + 8.4, y - 24, 1.6, 21); c.fillRect(x - 11, y - 25, 22, 2);
    c.fillStyle = "#6a5040"; c.beginPath(); c.arc(x, y - 21, 3, 0, TAU); c.fill();
    c.strokeStyle = "#8a8078"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y - 18); c.lineTo(x + (L0 ? 0 : Math.sin(t * 1.3) * 0.6), y - 3); c.stroke();
    if (!L0) {
      c.globalCompositeOperation = "lighter";
      for (let i = 0; i < 3; i++) { const ph = t * 0.8 + i * 2.1, k = (Math.sin(ph) + 1) / 2; c.strokeStyle = "rgba(200,40,30," + (0.25 + 0.25 * k).toFixed(3) + ")"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 7 + i * 6, y - 2); c.quadraticCurveTo(x - 4 + i * 4, y - 8 - k * 6, x - 2 + i * 3, y - 14 - k * 4); c.stroke(); }
      Z.draw && Z.draw.glow && Z.draw.glow(c, x, y - 3, 10, "rgba(180,30,20,.22)");
    }
    c.restore();
  }
  const css = document.createElement("style");
  css.textContent = [
    ".w38-tiefhinweis{color:#d8c8a8;font-style:italic;text-align:center;margin:4px 0 2px;font-size:var(--fs-s,13px)}",
    "#modal .w38-endleiste{position:sticky;bottom:0;z-index:2;margin:8px -4px 0;padding:6px 4px 2px;background:linear-gradient(rgba(30,14,12,0),rgba(30,14,12,.94) 22%,rgba(30,14,12,.98))}",
    "#modal .w38-endleiste .knoepfe{margin-top:4px}",
    "#modal .w38-tiefknopf{border-color:#a0241a!important;color:#ffd27a!important}",
    ".w38-hist span.w38-ok{border-color:#e5b454;color:#ffd27a}"
  ].join("\n");
  document.head.appendChild(css);

  Z.tiefe = { start, frei, state: () => ({ tf: tf() ? JSON.parse(JSON.stringify(tf())) : null, meta: JSON.parse(JSON.stringify(TM())) }), menu: schachtMenu, mul };
})();
