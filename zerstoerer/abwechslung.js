/* Ezekiel – The Destroyer · W38 Abwechslung (abwechslung.js)
   Mehr Unterschied zwischen zwei Läufen – ohne neue Pflichten:
   1) GEBIETSLAGEN: Ab Stufe I trägt ein Gebiet bei gut jedem dritten Besuch eine „Lage“, die Gegnermix oder Beute verändert
      und ein kleines Ziel stellt. Sie steht auf der Kapitelseite, kommt als Meldung und steht im Pausenmenü.
      Abgrenzung: Die Gebietsvarianten (abenteuer.js W13: Fallengänge, Unruhige Brut, Finster, Einsturz, Goldader) bleiben unberührt –
      ein Gebiet mit Variante bekommt keine Lage.
        · Besetzt          – Truppen aus einem Nachbargebiet (Stufe −2 … +1) ersetzen etwa die Hälfte der Einzelgegner (Wimpel über dem
                             Kopf). Alle Eindringlinge vertrieben → Kriegskasse (Truhe + Gold).
        · Der Zahlmeister  – ein zäher Gegner (Leben ×2,4) mit Soldkasse: jeder Treffer lässt Münzen springen (bis 45 %), beim Fall
                             der Rest und meist ein Fundstück (Münze über dem Kopf).
        · Die Gezeichneten – drei Gegner (Leben ×1,5) tragen das Fadenzeichen; alle drei erschlagen → ihr Hort (Truhe + Glut).
        · Vergrabener Schatz – ein gemaltes Kreuz mit Spaten in einem fernen Seitenraum; Benutzen = Graben → Truhe, Gold, Glut.
                             Das Pausenmenü gibt eine grobe Richtung.
        · Seelenflut       – Gegner +15 % Leben, dafür zerfallen Seelen zu 30 % in Splitter (blasser Randschleier ab Stufe 1).
      Auswahl je Gebiet fest aus dem Karten-Seed, nie zweimal dieselbe Lage hintereinander, nie im Torhof, nie im Bossrausch.
      Rückweg-Gnade (rueckweg.js) setzt den Gebietszustand ohne Z.loadArea wieder ein – die Lage hängt am Level-Objekt (lv.w38),
      Belohnungen sind einmalig (Flags dort), Gegner/Interaktionen reisen im Schnappschuss mit → kein Pendeln, kein Neuwürfeln.
   2) TAGESPRÜFUNG: Sonnenstein im Lager (rechts vom Kriegshorn). Jeden Tag dieselbe Feste für alle: fester Seed, feste
      Ausrüstung, zwei Tagesgesetze (Glaskanone, Goldfieber, Dürre, Blutrausch, Eilbote; oder ein Gesetz, das jedem Gebiet ab Stufe I
      eine Lage vorschreibt: Fremde Heere, Schatzsucher, Große Jagd, Zahltag). Punkte = Gebiete, Bosse, Kills, Gold, Ziele, Sieg. Beste Wertung je Tag lokal (Z.meta.w38tag,
      14 Tage Verlauf). Wertung erst am Laufende (Tod/Sieg/Abbruch über Z.backToCamp) → Neuladen bringt nichts.
   Online-Koop: Lagen/Wertung rechnet nur der Gastgeber; Markierungen (e.w38*) reisen mit den Gegner-Schnappschüssen.
   Grafik: Stufe 0 schlichte Formen ohne Schein/Partikel, Schleier aus. Kein Blau. Prüfhilfe: Z.abw.force(k), Z.abw.state(). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.abw) return;
  const T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v), TAU = Math.PI * 2;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lo = () => !!(Z.gq && (Z.gq.level === 0 || Z.gq.lean));
  const gast = () => { const s = Z.online && Z.online.S; return !!(s && s.role === "guest" && s.playing); };
  const later = (fn, ms) => (Z.bossLater ? Z.bossLater(fn, ms) : setTimeout(fn, ms));
  const tierOf = () => (Z.run && Z.run.tier) || 0;
  const goldMul = () => (Z.BAL && Z.BAL.goldMul ? Z.BAL.goldMul(tierOf()) : 1);
  const note = (html, o) => { try { return Z.ui && Z.ui.notify ? Z.ui.notify(html, o) : Z.toast && Z.toast(html); } catch (e) { console.error(e); } };
  const CHANCE = 0.38; /* mit Gebietsvarianten (18 %) zusammen ~50 % der Gebiete ab Stufe I besonders */

  /* ======================= 1. GEBIETSLAGEN ======================= */
  const LAGEN = {
    besetzt: { w: 3, min: 1, icon: "⚑", art: "gefahr", n: ["Besetzt", "Occupied"],
      d: v => ["Truppen aus " + v + " haben sich hier eingenistet. Vertreibe alle Eindringlinge – ihre Kriegskasse gehört dir.", "Troops from " + String(v).replace(/^The /, "the ") + " have dug in here. Drive out every intruder and their war chest is yours."] },
    zahlmeister: { w: 2, min: 1, icon: "◉", art: "gold", n: ["Der Zahlmeister", "The Paymaster"],
      d: () => ["Ein Zahlmeister der Fäden trägt die Soldkasse. Jeder Treffer lässt Münzen springen.", "A paymaster of the Threads carries the payroll. Every hit sends coins flying."] },
    gezeichnet: { w: 3, min: 1, icon: "✠", art: "gefahr", n: ["Die Gezeichneten", "The Marked"],
      d: () => ["Drei Gegner tragen das Fadenzeichen. Erschlage alle drei – ihr Hort öffnet sich.", "Three foes bear the mark of the Threads. Slay all three and their hoard opens."] },
    schatz: { w: 2, min: 1, icon: "✕", art: "gold", n: ["Vergrabener Schatz", "Buried Treasure"],
      d: () => ["Ein Schmuggler hat hier seine Beute vergraben. Halte Ausschau nach einem Kreuz im Boden – und grabe.", "A smuggler buried his loot here. Look for a cross on the ground – and dig."] },
    seelenflut: { w: 2, min: 2, icon: "✧", art: "magie", n: ["Seelenflut", "Soul Tide"],
      d: () => ["Die Gegner sind zäher (+15 % Leben), doch ihre Seelen zerfallen oft zu Splittern.", "Foes are tougher (+15% health), but their souls often shatter into shards."] }
  };
  const BAD_AI = new Set(["turret", "ceiling"]);
  const BAD_ID = new Set(["mimik", "brutsack", "puppe", "spinnchen"]);
  const okFoe = id => { const d = Z.ENEMIES && Z.ENEMIES[id]; return !!d && !d.boss && !d.group && !d.disguise && !BAD_AI.has(d.ai) && !BAD_ID.has(id); };

  function donorFor(id, R) {
    const B = Z.BIOMES[id], t = (B && B.tier) || 0, out = [];
    for (const k in Z.BIOMES) {
      const b = Z.BIOMES[k]; if (k === id || !b || !b.foes) continue;
      const bt = b.tier || 0; if (bt > t + 1 || bt < t - 2) continue;
      if (Object.keys(b.foes).filter(okFoe).length < 3) continue;
      out.push(k);
    }
    return out.length ? R.pick(out.sort()) : null;
  }
  function roll(id, seed) {
    const run = Z.run, B = Z.BIOMES[id];
    if (!run || !B || run.rausch || run.w21rausch || FORCE === false) return null;
    const tier = B.tier || 0; if (tier < 1) return null;
    if (run._var && run._var.area === id && !FORCE) return null;
    if (!FORCE && !run.w38tag && Z.einstieg && Z.einstieg.neu()) return null; /* W38 Einstieg: im ersten Lauf noch keine Lagen */ /* Gebietsvariante (abenteuer.js) hat Vorrang – nie beides */
    const R = Z.Rng((((seed >>> 0) ^ 0x5bd1e995) + 3803) >>> 0);
    const tag = run.w38tag;
    let k = FORCE || (tag && tag.lage) || null;
    if (!k) {
      if (R() > CHANCE) return null;
      const pool = {}; for (const key in LAGEN) if (tier >= LAGEN[key].min) pool[key] = LAGEN[key].w;
      if (run.w38last && pool[run.w38last] && Object.keys(pool).length > 1) delete pool[run.w38last];
      k = R.weighted(pool);
    }
    if (!LAGEN[k]) return null;
    const lg = { k, seed: seed >>> 0 };
    if (k === "besetzt") {
      lg.von = donorFor(id, R);
      if (!lg.von) { lg.k = "gezeichnet"; delete lg.von; }
    }
    return lg;
  }
  let FORCE = null; /* Prüfhilfe: Lage für das nächste Gebiet erzwingen (false = keine) */

  /* Seed-Fenster: von der Kartenerzeugung bis zum Ende von Z.loadArea (setupLevel spawnt die Gegner dazwischen) */
  let WIN = null;
  const gen0 = Z.genLevel;
  Z.genLevel = function (id, seed) {
    const lv = gen0.apply(this, arguments);
    try {
      WIN = null;
      if (lv && !lv.hub && !lv.passage && !lv.arena && !gast()) {
        const lg = roll(id, seed);
        if (lg) {
          lv.w38 = lg; Z.run.w38last = lg.k; FORCE = null;
          const R = Z.Rng((lg.seed ^ 0x2545f491) >>> 0), pool = { g: {}, f: {} };
          if (lg.von) for (const k in Z.BIOMES[lg.von].foes) if (okFoe(k)) (Z.ENEMIES[k].fly ? pool.f : pool.g)[k] = Z.BIOMES[lg.von].foes[k];
          WIN = { lv, lg, R, pool, extra: 3, home: id };
        }
      }
    } catch (e) { console.error("W38 Abwechslung", e); }
    return lv;
  };
  const onlyElite = o => !o || Object.keys(o).every(k => k === "elite");
  const sp0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    const W = WIN; let inv = false;
    try {
      if (W && Z.level === W.lv && Z.biome && Z.biome.foes && Z.biome.foes[id] != null && onlyElite(o) && okFoe(id)) {
        const d = Z.ENEMIES[id];
        if (W.lg.k === "besetzt" && W.R() < 0.5) {
          const pl = d.fly && Object.keys(W.pool.f).length ? W.pool.f : W.pool.g;
          if (Object.keys(pl).length) { id = W.R.weighted(pl); inv = true; }
        }
      }
    } catch (e) { console.error("W38 Abwechslung", e); }
    const e = sp0.call(this, id, x, y, o);
    try {
      if (e) {
        if (inv) e.w38inv = 1;
        const lg = Z.level && Z.level.w38;
        if (lg && !e.def.boss && !gast()) {
          if (lg.k === "seelenflut") { e.hp = Math.round(e.hp * 1.15); e.hpMax = Math.round(e.hpMax * 1.15); }
        }
      }
    } catch (err) { console.error("W38 Abwechslung", err); }
    return e;
  };

  /* nach dem Laden: Zahlmeister / Gezeichnete bestimmen, ansagen */
  function candidates(lv) {
    const st = lv.start ? { x: lv.start.x * T, y: lv.start.y * T } : { x: 0, y: 0 };
    return Z.enemies.filter(e => !e.dead && e.def && !e.def.boss && !e.elite && !e.nm && !e.thief && !e.master && !e.dummy && !e.def.group && !e.disguise && !BAD_AI.has(e.def.ai) && Z.ENEMIES[e.id] && !e.w38)
      .map(e => ({ e, d: Math.hypot(e.x - st.x, e.y - st.y) })).filter(o => o.d > 18 * T).sort((a, b) => a.d - b.d);
  }
  function postSetup(lv) {
    const lg = lv && lv.w38; if (!lg || lg.ready) return;
    lg.ready = true;
    const R = Z.Rng((lg.seed ^ 0x68e31da4) >>> 0);
    if (lg.k === "besetzt") lg.inv = Z.enemies.filter(e => e.w38inv && !e.dead).length;
    if (lg.k === "schatz" && !placeTreasure(lv, lg, R)) lg.k = "gezeichnet";
    if (lg.k === "zahlmeister") {
      const c = candidates(lv).filter(o => !o.e.def.fly);
      const pick = c.length ? c[Math.floor(c.length * (0.45 + R() * 0.5))] || c[c.length - 1] : null;
      if (pick) { const e = pick.e; e.w38 = "zahl"; e.hp = e.hpMax = Math.round(e.hpMax * 2.4); lg.kasse = Math.round(70 * goldMul()); lg.spritz = 0; }
      else lg.k = "gezeichnet";
    }
    if (lg.k === "gezeichnet") {
      const c = candidates(lv); const n = Math.min(3, c.length);
      lg.need = n; lg.got = 0;
      if (n) for (let i = 0; i < n; i++) { const o = c[Math.min(c.length - 1, Math.floor((i + 0.5 + (R() - 0.5) * 0.6) * c.length / n))]; if (o && !o.e.w38) { o.e.w38 = "mark"; o.e.hp = o.e.hpMax = Math.round(o.e.hpMax * 1.5); } }
      lg.need = Z.enemies.filter(e => e.w38 === "mark").length;
      if (!lg.need) { lv.w38 = null; return; }
    }
    mirror(lv);
    later(() => { if (Z.level === lv && lv.w38 === lg && Z.player && !Z.player.dead) announce(lg); }, 900);
  }
  /* Vergrabener Schatz: Platz in einem fernen Seitenraum, erreichbar, Stehplatz */
  function placeTreasure(lv, lg, R) {
    if (!lv.cells || !Z.standable) return false;
    const CWc = Z.CW, CHc = Z.CH, st = lv.start || { x: 0, y: 0 };
    const exitCells = new Set((lv.doors || []).filter(d => d.kind === "exit").map(d => Math.floor(d.x / CWc) + "," + Math.floor(d.y / CHc)));
    const busyCells = new Set((lv.feats || []).filter(f => f && f.cell && (f.t === "trial" || f.t === "lock" || f.t === "shrine")).map(f => f.cell)); /* W38 Abwechslung: nicht in Prüfungskammer/Schatzkammer/Schrein */
    const cells = Object.keys(lv.cells).map(k => lv.cells[k]).filter(c => c && c !== lv.startCell && c !== lv.endCell && c.kind !== "secret" && !exitCells.has(c.x + "," + c.y) && !busyCells.has(c.x + "," + c.y));
    const scored = cells.map(c => ({ c, d: Math.hypot(c.x * CWc + CWc / 2 - st.x, c.y * CHc + CHc / 2 - st.y) + (c.kind === "side" ? 30 : 0) + (c.depth || 0) * 6 })).sort((a, b) => b.d - a.d);
    for (const o of scored.slice(0, 8).concat(scored.slice(8))) {
      const ox = o.c.x * CWc, oy = o.c.y * CHc, spots = [];
      for (let y = oy + 2; y < oy + CHc - 1; y++) for (let x = ox + 3; x < ox + CWc - 3; x++) if (Z.standable(lv, x, y, 2) && (!lv.reach || lv.reach[y * lv.W + x])) spots.push([x, y]);
      if (spots.length < 4) continue;
      const [x, y] = spots[Math.floor(R() * spots.length)];
      const wx = x * T + 8, wy = (y + 1) * T;
      lg.sx = wx; lg.sy = wy;
      const it = { x: wx, y: wy, r: 18, h: 30, w38: "schatz", ok: () => !!(Z.level === lv && lv.w38 === lg && !lg.paid), label: () => L(["Graben", "Dig"]), use: () => { try { dig(lv, lg); } catch (e) { console.error("W38 Abwechslung", e); } } };
      (Z.interacts = Z.interacts || []).push(it);
      return true;
    }
    return false;
  }
  function dig(lv, lg) {
    if (lg.paid || lg.digT) return;
    lg.digT = 1;
    const P = Z.player; if (P) { P.vx = 0; }
    A.play("rock", { x: lg.sx, vol: 0.45, rate: 1.3 });
    if (!lo()) FX.burst(lg.sx, lg.sy - 2, 14, { col: ["#6a5040", "#4a3a2e", "#8a7060"], sp: 90, life: 0.7, size: 2, kind: "dot", g: 300 });
    later(() => {
      if (Z.level !== lv || lg.paid) return;
      lg.paid = true; lg.digT = 0; mirror(lv);
      A.play("crate", { x: lg.sx, vol: 0.5 }); A.play("coin", { x: lg.sx, vol: 0.6 });
      chest(lg.sx, lg.sy); Z.dropGold(lg.sx, lg.sy - 8, 25 * goldMul()); glut(lg.sx + 12, lg.sy, 1);
      if (!lo()) FX.burst(lg.sx, lg.sy - 6, 20, { col: ["#ffd27a", "#e5b454"], sp: 130, life: 0.8, size: 1.8, kind: "spark", add: true, g: 160 });
      note("<b>✕ " + esc(L(["Schatz gehoben", "Treasure unearthed"])) + "</b>", { prio: 2, art: "gold", key: "w38lohn" });
      win({ x: lg.sx }); bonus(200);
    }, 650);
  }
  function richtung(lg) {
    const P = Z.player; if (!P || lg.sx == null) return "";
    const dx = lg.sx - (P.x + P.w / 2), dy = lg.sy - (P.y + P.h), d = Math.round(Math.hypot(dx, dy) / T);
    if (d < 3) return L(["direkt hier", "right here"]);
    const h = Math.abs(dx) > T * 3 ? (dx < 0 ? L(["links", "left"]) : L(["rechts", "right"])) : "", v = Math.abs(dy) > T * 3 ? (dy < 0 ? L(["oben", "up"]) : L(["unten", "down"])) : "";
    return L(["Gefühl: ", "Hunch: "]) + [h, v].filter(Boolean).join(L([" und ", " and "])) + " · ~" + d + L([" Schritte", " steps"]);
  }
  /* W38 Abwechslung (Online): Lage als einfache Level-Felder spiegeln – online.js überträgt sie mit jedem Schnappschuss (lvPrims) */
  const gastAnn = new Set();
  function mirror(lv) {
    const lg = lv && lv.w38; if (!lg || gast()) return;
    lv.w38k = lg.k; lv.w38id = lg.seed >>> 0; lv.w38paid = !!lg.paid; lv.w38got = lg.got | 0; lv.w38need = lg.need | 0;
    if (lg.von) lv.w38von = lg.von;
    if (lg.sx != null) { lv.w38sx = Math.round(lg.sx); lv.w38sy = Math.round(lg.sy); }
  }
  function lgOf(lv) {
    if (!lv) return null; if (lv.w38) return lv.w38;
    if (!gast() || !lv.w38k || !LAGEN[lv.w38k]) return null;
    return { k: lv.w38k, paid: !!lv.w38paid, got: lv.w38got | 0, need: lv.w38need | 0, von: Z.BIOMES[lv.w38von] ? lv.w38von : undefined, sx: lv.w38sx, sy: lv.w38sy, gast: true };
  }
  const name = lg => L(LAGEN[lg.k].n);
  const desc = lg => L(LAGEN[lg.k].d(lg.von ? Z.areaName(lg.von) : ""));
  function announce(lg) {
    const D = LAGEN[lg.k];
    note("<b>" + esc(D.icon + " " + L(["Lage: ", "Situation: "]) + name(lg)) + "</b><br><small>" + esc(desc(lg)) + "</small>", { prio: 2, art: D.art, dauer: 6500, key: "w38lage" });
    try { Z.music && Z.music.push && Z.music.push(0.25, 2); } catch (_) {}
    A && A.play && A.play(lg.k === "zahlmeister" ? "coin" : lg.k === "seelenflut" ? "dark" : lg.k === "schatz" ? "scroll" : "horn", { vol: 0.32 });
  }
  /* Kapitelseite (uebergang.js pageInfo, eine Hakenzeile) */
  function pageLines(lv) {
    const lg = lv && lv.w38; if (!lg || !LAGEN[lg.k]) return undefined;
    return [LAGEN[lg.k].icon + " " + L(["Lage: ", "Situation: "]) + name(lg) + (lg.von ? " · " + Z.areaName(lg.von) : "")];
  }

  /* Belohnungen */
  function spot(x, y) { try { const s = Z.freeSpot ? Z.freeSpot(x, y, 16, 14, { r: 30 }) : null; if (s) return s; } catch (_) {} return { x, y }; }
  function chest(x, y) { const s = spot(x, y); Z.spawnPickup("chest", s.x, s.y, { vx: 0, vy: -60 }); FX.ring && FX.ring(s.x, s.y - 8, 30, "#ffd27a", 0.4, 3); }
  function glut(x, y, n) { if (Z.spawnReward) Z.spawnReward("glut", x, y, { n, drop: true }); }
  function onKill(e, o) {
    const lv = Z.level, lg = lv && lv.w38, P = Z.player;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2, fy = e.y + e.h;
    if (tag() && tag().rules.includes("blut") && P && !P.dead && !o.self && !e.master) Z.healPlayer && Z.healPlayer(P.hpMax * 0.02);
    if (!lg || e.def.boss) return;
    if (lg.k === "besetzt" && e.w38inv && !lg.paid) {
      const left = Z.enemies.filter(x => x !== e && x.w38inv && !x.dead).length;
      if (!left) {
        lg.paid = true; chest(cx, fy); Z.dropGold(cx, cy - 6, 30 * goldMul());
        note("<b>⚑ " + esc(L(["Eindringlinge vertrieben", "Intruders driven out"])) + "</b><br><small>" + esc(L(["Ihre Kriegskasse liegt offen.", "Their war chest lies open."])) + "</small>", { prio: 2, art: "gold", key: "w38lohn" });
        win(e); bonus(200);
      } else if (left <= 2 || left % 5 === 0) note(esc(L(["Eindringlinge übrig: ", "Intruders left: "]) + left), { prio: 1, art: "gefahr", key: "w38rest", dauer: 2200 });
    }
    if (e.w38 === "zahl" && !lg.paid) {
      lg.paid = true;
      Z.dropGold(cx, cy - 6, Math.max(10, lg.kasse - (lg.spritz || 0)));
      if (Z.R() < 0.65) Z.dropItem(cx, fy, { elite: true });
      if (!lo()) FX.burst(cx, cy, 26, { col: ["#ffd27a", "#e5b454", "#fff0b0"], sp: 170, life: 0.9, size: 2, kind: "spark", add: true, g: 120 });
      A.play("coin", { x: cx, vol: 0.7 }); A.play("gem", { x: cx, vol: 0.4 });
      note("<b>◉ " + esc(L(["Die Soldkasse ist dein", "The payroll is yours"])) + "</b>", { prio: 2, art: "gold", key: "w38lohn" });
      win(e); bonus(250);
    }
    if (e.w38 === "mark" && !lg.paid) {
      lg.got = (lg.got || 0) + 1;
      if (!lo()) FX.ring && FX.ring(cx, cy, 26, "#c0302a", 0.35, 3);
      A.play("chain", { x: cx, vol: 0.45, rate: 1.2 });
      if (lg.got >= lg.need) {
        lg.paid = true; chest(cx, fy); glut(cx + 10, fy, 1);
        note("<b>✠ " + esc(L(["Alle Gezeichneten gefallen", "All the marked have fallen"])) + "</b><br><small>" + esc(L(["Ihr Hort öffnet sich.", "Their hoard opens."])) + "</small>", { prio: 2, art: "gold", key: "w38lohn" });
        win(e); bonus(250);
      } else note("✠ " + esc(L(["Gezeichnete: ", "Marked: "]) + lg.got + "/" + lg.need), { prio: 1, art: "gefahr", key: "w38rest", dauer: 2500 });
    }
    if (lg.k === "seelenflut" && !e.master && !o.self && Z.R() < 0.3) {
      Z.dropShards(cx, cy, 1 + Math.round(tierOf() * 0.5));
      if (!lo()) FX.burst(cx, cy, 8, { col: ["#f0e0c0", "#e8b0e0"], sp: 40, life: 1.1, size: 1.6, kind: "spark", add: true, g: -60 });
    }
  }
  function win(e) {
    try { Z.music && Z.music.stinger && Z.music.stinger("geschafft"); } catch (_) {}
    A.play("holy", { x: e.x, vol: 0.4 });
    FX.addShake && FX.addShake(2);
  }
  const k0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = !e || e.dead;
    const r = k0.apply(this, arguments);
    try { if (!was && e && e.dead && !gast() && Z.run) { onKill(e, o || {}); mirror(Z.level); } } catch (err) { console.error("W38 Abwechslung", err); }
    return r;
  };
  const h0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    if (typeof dmg === "number" && dmg > 0 && tag() && tag().rules.includes("glas") && e && !e.dead && o.src !== "trap" && o.src !== "enemy" && o.src !== "self") dmg *= 1.35;
    const res = h0.call(this, e, dmg, o);
    try {
      if (res > 0 && e && e.w38 === "zahl" && !e.dead && Z.level && Z.level.w38 && !gast()) {
        const lg = Z.level.w38, cap = lg.kasse * 0.45;
        if ((lg.spritz || 0) < cap) { const n = Math.max(1, Math.round(lg.kasse * 0.05)); lg.spritz = (lg.spritz || 0) + n; Z.dropGold(e.x + e.w / 2, e.y + 4, n); A.play("coin", { x: e.x, vol: 0.3, rate: 1.1 + Math.random() * 0.2 }); }
      }
    } catch (err) { console.error("W38 Abwechslung", err); }
    return res;
  };
  const dg0 = Z.dropGold;
  Z.dropGold = function (x, y, n) {
    if (typeof n === "number") {
      const lg = Z.level && !Z.level.hub && Z.level.w38;
      if (tag() && tag().rules.includes("gold")) n *= 2;
    }
    return dg0.call(this, x, y, n);
  };

  /* ======================= 2. TAGESPRÜFUNG ======================= */
  const GESETZE = {
    glas: { n: ["Glaskanone", "Glass Cannon"], d: ["+35 % Schaden, aber nur 70 % Leben.", "+35% damage, but only 70% health."] },
    gold: { n: ["Goldfieber", "Gold Fever"], d: ["Doppeltes Gold – die Feste schlägt 15 % härter zu.", "Double gold – the keep hits 15% harder."] },
    durst: { n: ["Dürre", "Drought"], d: ["Nur ein Heiltrank, dafür +25 % Leben.", "Only one potion, but +25% health."] },
    blut: { n: ["Blutrausch", "Bloodlust"], d: ["Jeder Kill heilt 2 % – eingesteckter Schaden +20 %.", "Every kill heals 2% – damage taken +20%."] },
    eile: { n: ["Eilbote", "Courier"], d: ["Jedes Gebiet unter 2 Minuten: +300 Punkte.", "Each area under 2 minutes: +300 points."] },
    besetzt: { lage: "besetzt", n: ["Fremde Heere", "Foreign Armies"], d: ["Jedes Gebiet ab Stufe I ist besetzt.", "Every area from tier I is occupied."] },
    schatz: { lage: "schatz", n: ["Schatzsucher", "Treasure Hunter"], d: ["In jedem Gebiet ab Stufe I liegt ein Schatz vergraben.", "Treasure lies buried in every area from tier I."] },
    gezeichnet: { lage: "gezeichnet", n: ["Große Jagd", "Great Hunt"], d: ["In jedem Gebiet ab Stufe I warten Gezeichnete.", "Marked foes wait in every area from tier I."] },
    zahlmeister: { lage: "zahlmeister", n: ["Zahltag", "Payday"], d: ["In jedem Gebiet ab Stufe I geht ein Zahlmeister um.", "A paymaster roams every area from tier I."] }
  };
  const KITS = [
    ["kurzschwert", "jagdbogen", "sprengphiole", "baerenfalle"], ["hellebarde", "turmschild", "kristall", "kraeuter"],
    ["schattendolch", "wurfmesser", "rauchbombe", "blendgranate"], ["kurzschwert", "turmschild", "baerenfalle", "sprengphiole"],
    ["hellebarde", "jagdbogen", "kraeuter", "rauchbombe"], ["schattendolch", "turmschild", "blendgranate", "kristall"]
  ];
  const kitOk = k => !!(Z.WEAPONS[k[0]] && Z.WEAPONS[k[1]] && Z.SKILLS && Z.SKILLS[k[2]] && Z.SKILLS[k[3]]);
  function dayKey(dt) { const d = dt || new Date(); const p = n => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function heute(key) {
    const d = key || dayKey(), seed = hash("imres-tag-" + d), R = Z.Rng(seed ^ 0x9e3779b9);
    const plain = ["glas", "gold", "durst", "blut", "eile"], lagen = ["besetzt", "schatz", "gezeichnet", "zahlmeister"];
    const rules = [];
    if (R() < 0.6) { rules.push(R.pick(lagen)); rules.push(R.pick(plain)); }
    else { const a = R.shuffle(plain.slice()); rules.push(a[0], a[1]); }
    const kits = KITS.filter(kitOk), kit = kits.length ? kits[Math.floor(R() * kits.length)] : null;
    return { d, seed: (seed ^ 0x51ed27) >>> 0, rules, kit, lage: (rules.map(r => GESETZE[r].lage).find(Boolean)) || null };
  }
  const tag = () => (Z.run && Z.run.w38tag) || null;
  function TM() {
    const m = Z.meta; let t = m.w38tag;
    if (!t || typeof t !== "object" || Array.isArray(t)) t = m.w38tag = {};
    if (!Array.isArray(t.hist)) t.hist = [];
    if (typeof t.d !== "string") t.d = ""; t.best = +t.best || 0; t.n = +t.n || 0;
    return t;
  }
  function punkte(run, sieg) {
    const tg = run && run.w38tag; if (!tg) return 0;
    const areas = (run.route || []).filter(id => Z.BIOMES[id] || Z.ARENAS[id]).length;
    const bosses = (run.bossesBeaten || []).length, kills = (Z.stats && Z.stats.kills) || 0, gold = (Z.stats && Z.stats.gold) || 0;
    let p = 120 * Math.max(0, areas - 1) + 400 * bosses + 3 * kills + Math.floor(gold / 4) + (tg.bonus || 0);
    if (sieg) p += 2500;
    return Math.max(0, Math.round(p));
  }
  function bonus(n) { const tg = tag(); if (tg) tg.bonus = (tg.bonus || 0) + n; }
  function los() {
    if (!Z.level || !Z.level.hub || gast() || (Z.bossrausch && Z.bossrausch.aktiv && Z.bossrausch.aktiv())) return false;
    const day = heute();
    if (Z.ui && Z.ui.modalOpen) Z.ui.close();
    Z.newRun();
    const run = Z.run; if (!run) return false;
    run.seed = day.seed;
    run.w38tag = { d: day.d, rules: day.rules.slice(), lage: day.lage, bonus: 0, areaT: 0, fertig: false };
    const P = Z.player;
    if (day.kit && Z.makeItem) { const mk = (id, n) => Z.makeItem(id, 0, 1, Z.Rng(day.seed + n * 131)); P.slots.a1 = mk(day.kit[0], 1); P.slots.a2 = mk(day.kit[1], 2); P.slots.s1 = mk(day.kit[2], 3); P.slots.s2 = mk(day.kit[3], 4); }
    Z.recalcPlayer(); applyPots(); P.hp = P.hpMax;
    const t = TM(); if (t.d !== day.d) { if (t.d && t.best) pushHist(t); t.d = day.d; t.best = 0; t.n = 0; } t.n++; Z.saveMeta();
    A.play("gong", { vol: 0.5 });
    Z.ui.fade(() => { Z.loadArea("torhof"); });
    return true;
  }
  function pushHist(t) { t.hist = t.hist.filter(h => Array.isArray(h) && h[0] !== t.d); t.hist.unshift([t.d, t.best, t.n]); t.hist = t.hist.slice(0, 14); }
  /* W38 Endspiel: Abschlussmeldung über setTimeout – Z.bossLater verfällt mit dem Lauf (Z.run → null), die Meldung kam im Lager nie an */
  function finish(sieg) {
    const run = Z.run, tg = run && run.w38tag; if (!tg || tg.fertig) return;
    tg.fertig = true;
    const p = punkte(run, sieg), t = TM();
    if (t.d !== tg.d) { if (t.d && t.best) pushHist(t); t.d = tg.d; t.best = 0; t.n = Math.max(1, t.n); }
    const neu = p > t.best; if (neu) t.best = p;
    t.last = { d: tg.d, p, sieg: !!sieg, gebiet: run.area, kills: (Z.stats && Z.stats.kills) || 0 };
    pushHist(t); try { Z.saveMeta(); } catch (_) {}
    setTimeout(() => note("<b>☀ " + esc(L(["Tagesprüfung: ", "Daily trial: "]) + p + L([" Punkte", " points"])) + "</b><br><small>" + esc(neu ? L(["Neue Tagesbestleistung!", "New best for today!"]) : L(["Heute bisher bestes: ", "Today's best so far: "]) + t.best) + "</small>", { prio: 2, art: "gold", dauer: 7000, key: "w38tag" }), 2200);
  }
  const btc0 = Z.backToCamp;
  Z.backToCamp = function () { try { if (tag()) finish(!!Z.run.w38sieg); } catch (e) { console.error("W38 Abwechslung", e); } return btc0.apply(this, arguments); };
  /* Regeln am Spieler */
  const rc0 = Z.recalcPlayer;
  Z.recalcPlayer = function () {
    const r = rc0.apply(this, arguments);
    try {
      const tg = tag(), P = Z.player;
      if (tg && P) {
        let k = 1; if (tg.rules.includes("glas")) k *= 0.7; if (tg.rules.includes("durst")) k *= 1.25;
        if (k !== 1) { P.hpMax = Math.max(1, Math.round(P.hpMax * k)); if (P.hp > P.hpMax) P.hp = P.hpMax; }
      }
    } catch (e) { console.error("W38 Abwechslung", e); }
    return r;
  };
  function applyPots() { const tg = tag(), P = Z.player; if (tg && P && tg.rules.includes("durst")) { P.potMax = 1; if (P.potions > 1) P.potions = 1; } }
  const hu0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const tg = tag();
    if (tg && typeof dmg === "number" && dmg > 0) { if (tg.rules.includes("gold")) dmg *= 1.15; if (tg.rules.includes("blut")) dmg *= 1.2; }
    return hu0.call(this, dmg, o);
  };

  /* Gebietswechsel: Lage-Nachbereitung, Eilbote */
  const la0 = Z.loadArea;
  Z.loadArea = function (id) {
    const tg = tag(), prev = Z.level;
    try { if (Z.ui && Z.ui.notifyDrop) for (const k of ["w38lage", "w38rest", "w38stand"]) Z.ui.notifyDrop(k); } catch (_) {} /* W38 Abwechslung: alte Lagen-Meldung nicht ins nächste Gebiet tragen */
    if (tg && tg.rules.includes("eile") && prev && !prev.hub && !prev.passage && id === "passage" && Z.player && !Z.player.dead) {
      if (tg.areaT > 0 && tg.areaT < 120) { bonus(300); later(() => note("☀ " + esc(L(["Eilbote: +300 Punkte", "Courier: +300 points"])), { prio: 1, art: "gold", key: "w38eile" }), 1500); }
    }
    let r;
    try { r = la0.apply(this, arguments); } finally { WIN = null; }
    try {
      const lv = Z.level;
      if (tag()) { tag().areaT = 0; applyPots(); }
      if (lv && lv.w38 && !gast()) postSetup(lv);
      if (lv && lv.passage && tag()) later(() => { if (tag() && Z.level === lv) note("☀ " + esc(L(["Tagesprüfung: ", "Daily trial: "]) + punkte(Z.run, false) + L([" Punkte bisher", " points so far"])), { prio: 1, art: "gold", key: "w38stand", dauer: 3500 }); }, 2600);
      if (lv && lv.hub) placeStone(lv);
    } catch (e) { console.error("W38 Abwechslung", e); }
    return r;
  };
  const tk0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tk0) tk0.apply(this, arguments);
    const tg = tag(); if (tg && Z.level && !Z.level.passage && !Z.level.hub && Z.player && !Z.player.dead) tg.areaT += dt || 0;
    if (stoneFx > 0) stoneFx -= dt || 0;
  };

  /* Sonnenstein im Lager */
  let stone = null, stoneFx = 0;
  function placeStone(lv) {
    stone = null;
    if (!lv || !lv.hub) return;
    if (Z.einstieg && Z.einstieg.neu()) return; /* W38 Einstieg: Sonnenstein erst nach dem ersten Lauf */
    const base = lv.lcore && Number.isFinite(lv.lcore.stone) ? lv.lcore.stone : (lv.start ? lv.start.x - 12 : 40);
    const x = (base - 18.5) * T + 8, y = 12 * T; /* W38 Endspiel: vorher base + 8 – lag auf Jori (Schmiedelehrling); jetzt zwischen Zelt und Friedrichs Trophäe */
    stone = { lv, x, y };
    (Z.interacts = Z.interacts || []).push({ x, y, r: 14, h: 34, w38: "stein", label: () => L(["Sonnenstein · Tagesprüfung", "Sunstone · daily trial"]), use: () => { try { menu(); } catch (e) { console.error("W38 Abwechslung", e); } } });
  }
  function menu() {
    if (!Z.ui) return;
    const day = heute(), t = TM(), today = t.d === day.d;
    let h = "<h2>☀ " + esc(L(["Tagesprüfung", "Daily Trial"])) + "<small>" + esc(L(["Sonnenstein · ", "Sunstone · "]) + day.d) + "</small></h2>";
    h += '<p class="w38-unter">' + esc(L(["Heute dieselbe Feste für alle: gleiche Karten, gleiche Ausrüstung, zwei Tagesgesetze. Splitter und Funde zählen wie sonst – gewertet wird am Ende des Laufs.", "The same keep for everyone today: same maps, same gear, two laws of the day. Shards and finds count as usual – the score is taken when the run ends."])) + "</p>";
    h += '<ul class="w38-ges">' + day.rules.map(r => "<li><b>" + esc(L(GESETZE[r].n)) + "</b> – " + esc(L(GESETZE[r].d)) + "</li>").join("") + "</ul>";
    if (day.kit) h += '<p class="w38-kit">' + esc(L(["Ausrüstung: ", "Gear: "])) + day.kit.map(id => { const d = Z.WEAPONS[id] || Z.SKILLS[id]; return "<b>" + esc(d ? L(d.n) : id) + "</b>"; }).join(" · ") + "</p>";
    h += '<p class="w38-best">' + esc(L(["Heute: ", "Today: "])) + (today && t.best ? "<b>" + t.best + "</b> " + esc(L(["Punkte", "points"])) : "–") + (today && t.n ? " · " + esc(L(["Versuche ", "attempts "]) + t.n) : "") + "</p>";
    const hist = t.hist.filter(x => Array.isArray(x) && x[0] !== day.d).slice(0, 6);
    if (hist.length) h += '<p class="w38-hist">' + hist.map(x => "<span>" + esc(String(x[0]).slice(5)) + " <b>" + (x[1] | 0) + "</b></span>").join("") + "</p>";
    const busy = Z.bossrausch && Z.bossrausch.aktiv && Z.bossrausch.aktiv();
    h += '<div class="knoepfe"><button data-act="w38Los" autofocus' + (busy || gast() ? " disabled" : "") + ">☀ " + esc(L(["Antreten", "Begin"])) + '</button><button data-act="close">' + esc(L(["Zurück", "Back"])) + "</button></div>";
    stoneFx = 1.2;
    Z.ui.open(h, { cls: "schmal w38box" });
  }
  function wireUI() {
    if (!Z.ui || !Z.ui.actions || !Z.ui.ending) return setTimeout(wireUI, 60);
    Z.ui.actions.w38Los = () => { try { return los(); } catch (e) { console.error("W38 Abwechslung", e); } }; /* W38: Knopf-Aktion abgesichert */
    const end0 = Z.ui.ending;
    Z.ui.ending = function () { if (Z.run && Z.run.w38tag) Z.run.w38sieg = true; return end0.apply(this, arguments); };
    if (typeof Z.ui.pause === "function" && !Z.ui.pause._w38) {
      const p0 = Z.ui.pause;
      Z.ui.pause = function () {
        const r = p0.apply(this, arguments);
        try {
          const lv = Z.level, lg = lgOf(lv), tg = tag(), box = document.querySelector("#modal .knoepfe.senk") || document.querySelector("#modal .knoepfe");
          if (box && (lg || tg) && !document.querySelector("#modal .w38-pause")) {
            const p = document.createElement("p"); p.className = "w38-pause";
            let s = "";
            if (lg && LAGEN[lg.k]) s += "<b>" + esc(LAGEN[lg.k].icon + " " + name(lg)) + "</b> – " + esc(desc(lg)) + (lg.k === "gezeichnet" ? " (" + (lg.got | 0) + "/" + lg.need + ")" : lg.k === "schatz" && !lg.paid ? " (" + esc(richtung(lg)) + ")" : lg.k === "besetzt" && !lg.paid && !lg.gast ? " (" + Z.enemies.filter(e => e.w38inv && !e.dead).length + ")" : "") + (lg.paid ? " ✓" : "");
            if (tg) s += (s ? "<br>" : "") + "<b>☀ " + esc(L(["Tagesprüfung", "Daily trial"])) + "</b> – " + esc(tg.rules.map(r => L(GESETZE[r].n)).join(" · ")) + " · " + punkte(Z.run, false) + " " + esc(L(["Punkte", "points"]));
            p.innerHTML = s; box.parentNode.insertBefore(p, box);
          }
        } catch (e) { console.error("W38 Abwechslung", e); }
        return r;
      };
      Z.ui.pause._w38 = true;
    }
  }
  wireUI();

  /* ======================= 3. ZEICHNEN ======================= */
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (wp0) wp0.apply(this, arguments);
    try { if (stone && Z.level === stone.lv && Z.level.hub) drawStone(c, stone.x, stone.y, t); } catch (e) { if (!dErr) { dErr = 1; console.error(e); } }
    try { const lg = lgOf(Z.level); if (lg && lg.k === "schatz" && lg.sx != null && !lg.paid) drawX(c, lg.sx, lg.sy, t, lg); } catch (e) { if (!dErr) { dErr = 1; console.error(e); } }
  };
  let dErr = 0;
  function drawStone(c, x, y, t) {
    const cam = Z.cam; if (cam && (x < cam.x - 40 || x > cam.x + cam.w + 40)) return;
    const today = TM().d === dayKey() && TM().best > 0, L0 = lo();
    c.save();
    c.globalAlpha = 0.3; c.fillStyle = "#000"; c.beginPath(); c.ellipse(x, y + 0.5, 10, 2, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    /* Sockel und Stele */
    c.fillStyle = "#3a302a"; c.fillRect(x - 9, y - 4, 18, 4);
    c.fillStyle = "#4e443c"; c.beginPath(); c.moveTo(x - 7, y - 4); c.lineTo(x - 6, y - 26); c.quadraticCurveTo(x, y - 33, x + 6, y - 26); c.lineTo(x + 7, y - 4); c.closePath(); c.fill();
    c.fillStyle = "#62564a"; c.beginPath(); c.moveTo(x - 6, y - 4); c.lineTo(x - 5.2, y - 25.5); c.quadraticCurveTo(x - 2, y - 30, x - 1, y - 30.5); c.lineTo(x - 2, y - 4); c.closePath(); c.fill();
    c.strokeStyle = "#2a221c"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + 3, y - 12); c.lineTo(x + 5, y - 9); c.moveTo(x - 4, y - 8); c.lineTo(x - 2.5, y - 6); c.stroke();
    /* Moos */
    c.fillStyle = "#4f5a2c"; c.fillRect(x - 7, y - 6, 4, 2); c.fillRect(x + 4, y - 5, 3, 1.5);
    /* Sonnenscheibe aus Bronze mit Strahlen */
    const cy = y - 20, pulse = L0 ? 0 : Math.sin(t * 1.6) * 0.5 + 0.5;
    c.strokeStyle = "#c8902a"; c.lineWidth = 0.9;
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + (L0 ? 0 : t * 0.15); c.beginPath(); c.moveTo(x + Math.cos(a) * 4.2, cy + Math.sin(a) * 4.2); c.lineTo(x + Math.cos(a) * 6.4, cy + Math.sin(a) * 6.4); c.stroke(); }
    c.fillStyle = "#e5b454"; c.beginPath(); c.arc(x, cy, 3.6, 0, TAU); c.fill();
    c.fillStyle = "#8a5a1a"; c.beginPath(); c.arc(x + 0.8, cy + 0.6, 2, 0, TAU); c.fill();
    c.fillStyle = "#ffe9a8"; c.beginPath(); c.arc(x - 1, cy - 1, 1, 0, TAU); c.fill();
    /* Kerben (Versuche heute) */
    const n = Math.min(6, TM().d === dayKey() ? TM().n | 0 : 0);
    c.fillStyle = "#2a221c"; for (let i = 0; i < n; i++) c.fillRect(x - 4.5 + i * 1.7, y - 11, 0.8, 3);
    if (!L0) {
      c.globalCompositeOperation = "lighter";
      Z.draw && Z.draw.glow && Z.draw.glow(c, x, cy, 9 + pulse * 3 + (stoneFx > 0 ? stoneFx * 6 : 0), today ? "rgba(255,190,90,.34)" : "rgba(255,150,70,.22)");
    }
    c.restore();
  }
  function drawX(c, x, y, t, lg) {
    const cam = Z.cam; if (cam && (x < cam.x - 30 || x > cam.x + cam.w + 30 || y < cam.y - 30 || y > cam.y + cam.h + 30)) return;
    const L0 = lo();
    c.save(); c.translate(x, y); c.scale(1.3, 1.3); c.translate(-x, -y);
    /* aufgewühlte Erde, gemaltes Kreuz, Spaten */
    c.fillStyle = "#3a2a20"; c.beginPath(); c.ellipse(x, y - 0.5, 9, 2.2, 0, 0, TAU); c.fill();
    c.fillStyle = "#5a4030"; for (let i = -3; i <= 3; i++) c.fillRect(x + i * 2.4 - 0.6, y - 1.6 - (i & 1), 1.3, 1.1);
    c.strokeStyle = "#1a0a06"; c.lineWidth = 2.6; c.lineCap = "round";
    c.beginPath(); c.moveTo(x - 4.5, y - 3.2); c.lineTo(x + 4.5, y + 0.4); c.moveTo(x + 4.5, y - 3.2); c.lineTo(x - 4.5, y + 0.4); c.stroke();
    c.strokeStyle = "#b02a1e"; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(x - 4.5, y - 3.2); c.lineTo(x + 4.5, y + 0.4); c.moveTo(x + 4.5, y - 3.2); c.lineTo(x - 4.5, y + 0.4); c.stroke();
    if (lg.digT) { c.fillStyle = "#6a5040"; c.beginPath(); c.ellipse(x, y - 1, 6, 2.6, 0, 0, TAU); c.fill(); }
    c.save(); c.translate(x + 9, y); c.rotate(0.25);
    c.fillStyle = "#4a3020"; c.fillRect(-0.7, -16, 1.4, 12); c.fillRect(-2.2, -17, 4.4, 1.4);
    c.fillStyle = "#8a8078"; c.beginPath(); c.moveTo(-2.6, -4.5); c.lineTo(2.6, -4.5); c.lineTo(2, 0.5); c.lineTo(0, 1.8); c.lineTo(-2, 0.5); c.closePath(); c.fill();
    c.restore();
    if (!L0) {
      const k = (Math.sin(t * 2.3) + 1) / 2;
      c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y - 2, 6 + k * 3, "rgba(255,200,100," + (0.12 + k * 0.14).toFixed(3) + ")");
      if (Math.random() < 0.03) FX.burst && FX.burst(x + (Math.random() - 0.5) * 10, y - 2, 1, { col: ["#ffe9a8"], sp: 12, life: 0.7, size: 1.1, kind: "spark", add: true, g: -30 });
    }
    c.restore();
  }
  /* Markierungen über Gegnern und Lage-Schleier (nach dem Licht, damit lesbar) */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, Wd, Hd, t) {
    if (al0) al0.apply(this, arguments);
    try { drawMarks(c, cam, Wd, Hd, t); } catch (e) { if (!dErr2) { dErr2 = 1; console.error(e); } }
  };
  let dErr2 = 0;
  function drawMarks(c, cam, Wd, Hd, t) {
    const lv = Z.level; if (!lv || lv.hub || !cam) return;
    const L0 = lo(), S = (Z.gfx && Z.gfx.scale) || 2;
    const lg = lgOf(lv);
    if (lg && lg.gast && !lv._w38ann && Z.player && !(Z.ui && Z.ui.verdeckt)) { lv._w38ann = true; const aid = lv.w38k + ":" + (lv.w38id || 0); if (!gastAnn.has(aid)) { if (gastAnn.size > 40) gastAnn.clear(); gastAnn.add(aid); setTimeout(() => { if (Z.level === lv) announce(lg); }, 600); } } /* W38 QA: nach Rückweg-Tor bekommt der Gast ein neues Level-Objekt – Ansage nur einmal je Lage */ /* Gast: Spielzeit-Zeitgeber laufen dort nicht */ /* Online-Gast: Ansage, sobald die Lage im Schnappschuss ankommt */
    /* Schleier: Fluchnebel (Rand glutrot), Seelenflut (Rand blass rosé) – ab Stufe 1 */
    if (lg && !L0 && lg.k === "seelenflut" && Wd && Hd) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      const k = false, a = 0.13 + Math.sin(t * 0.7) * 0.03;
      const g = c.createRadialGradient(Wd / 2, Hd / 2, Math.min(Wd, Hd) * 0.38, Wd / 2, Hd / 2, Math.max(Wd, Hd) * 0.72);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, k ? "rgba(120,14,20," + a.toFixed(3) + ")" : "rgba(150,90,130," + a.toFixed(3) + ")");
      c.fillStyle = g; c.fillRect(0, 0, Wd, Hd); c.restore();
    }
    let any = false;
    for (const e of Z.enemies) if ((e.w38 || e.w38inv) && !e.dead) { any = true; break; }
    if (!any) return;
    c.save(); c.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    for (const e of Z.enemies) {
      if (e.dead || !(e.w38 || e.w38inv)) continue;
      if (e.x < cam.x - 40 || e.x > cam.x + cam.w + 40 || e.y < cam.y - 60 || e.y > cam.y + cam.h + 40) continue;
      if (e.intro > 0 || e.hidden > 0.5) continue;
      const x = e.x + e.w / 2, y = e.y - 7 + (L0 ? 0 : Math.sin(t * 3 + e.x * 0.05) * 1.2);
      if (e.w38 === "mark") sigil(c, x, y, t, L0);
      else if (e.w38 === "zahl") coin(c, x, y, t, L0, e);
      else if (e.w38inv) pennant(c, x, y + 2, t, L0);
    }
    c.restore();
  }
  function sigil(c, x, y, t, L0) {
    c.save(); c.translate(x, y);
    if (!L0) { c.globalCompositeOperation = "lighter"; Z.draw.glow(c, 0, 0, 8 + Math.sin(t * 4) * 1.5, "rgba(220,40,30,.35)"); c.globalCompositeOperation = "source-over"; c.rotate(t * 0.8); }
    c.strokeStyle = "#1a0606"; c.lineWidth = 2.4; c.beginPath(); c.arc(0, 0, 3.6, 0, TAU); c.moveTo(-4.6, 0); c.lineTo(4.6, 0); c.moveTo(0, -4.6); c.lineTo(0, 4.6); c.stroke();
    c.strokeStyle = "#e0402e"; c.lineWidth = 1.1; c.beginPath(); c.arc(0, 0, 3.6, 0, TAU); c.moveTo(-4.6, 0); c.lineTo(4.6, 0); c.moveTo(0, -4.6); c.lineTo(0, 4.6); c.stroke();
    c.restore();
  }
  function coin(c, x, y, t, L0, e) {
    c.save(); c.translate(x, y);
    const sx = L0 ? 1 : Math.abs(Math.cos(t * 2.4)) * 0.8 + 0.2;
    if (!L0) { c.globalCompositeOperation = "lighter"; Z.draw.glow(c, 0, 0, 8, "rgba(255,200,90,.35)"); c.globalCompositeOperation = "source-over"; }
    c.fillStyle = "#3a2408"; c.beginPath(); c.ellipse(0, 0, 4.2 * sx + 0.6, 4.8, 0, 0, TAU); c.fill();
    c.fillStyle = "#e5b454"; c.beginPath(); c.ellipse(0, 0, 3.6 * sx, 4.2, 0, 0, TAU); c.fill();
    c.fillStyle = "#fff0b0"; c.fillRect(-0.5 * sx, -2.4, 1 * sx, 4.8);
    c.restore();
    if (!L0 && Math.random() < 0.06) FX.burst && FX.burst(x + (Math.random() - 0.5) * e.w, e.y + e.h * 0.4, 1, { col: ["#ffd27a"], sp: 20, life: 0.6, size: 1.2, kind: "spark", add: true, g: 60 });
  }
  function pennant(c, x, y, t, L0) {
    const sw = L0 ? 0 : Math.sin(t * 3 + x) * 0.8;
    c.save();
    c.fillStyle = "#2a1a10"; c.fillRect(x - 0.6, y - 7, 1.2, 7);
    c.fillStyle = "#b8862a"; c.beginPath(); c.moveTo(x + 0.6, y - 7); c.lineTo(x + 5.5 + sw, y - 5.5); c.lineTo(x + 0.6, y - 3.8); c.closePath(); c.fill();
    c.restore();
  }

  /* ======================= 4. STIL ======================= */
  const css = document.createElement("style");
  css.textContent = [
    ".w38-unter{color:#c8b090}.w38-ges{margin:6px 0 8px 18px;padding:0;color:#f0dcb0}.w38-ges b{color:#ffd27a}",
    ".w38-kit{color:#d8c8a8}.w38-kit b{color:#e8d8b8}.w38-best{color:#d8c8a8}.w38-best b{color:#ffd27a;font-size:1.15em}",
    ".w38-hist{display:flex;flex-wrap:wrap;gap:4px 8px}.w38-hist span{background:rgba(200,144,42,.12);border:1px solid rgba(200,144,42,.4);border-radius:10px;padding:1px 9px;font-size:var(--fs-s,13px);color:#e8d8b8}.w38-hist b{color:#ffd27a}",
    ".w38-pause{margin:6px 0 8px;padding:5px 9px;border-left:3px solid #a0241a;background:rgba(60,14,10,.35);color:#e8d8b8;font-size:var(--fs-s,13px);line-height:1.4}.w38-pause b{color:#ffd27a}",
    ".handheld .w38-ges{margin:3px 0 4px 14px}.handheld .w38-unter{font-size:12px}"
  ].join("\n");
  document.head.appendChild(css);

  Z.abw = {
    LAGEN, GESETZE, heute, punkte: () => punkte(Z.run, false), pageLines, los, menu,
    force: k => { FORCE = k === undefined ? null : k; },
    state: () => { const lv = Z.level, lg = lv && lv.w38; return { lage: lg ? Object.assign({}, lg) : null, marks: Z.enemies.filter(e => e.w38 && !e.dead).map(e => [e.id, e.w38, e.hp]), inv: Z.enemies.filter(e => e.w38inv && !e.dead).length, tag: tag() ? Object.assign({}, tag()) : null, meta: Z.meta.w38tag || null }; }
  };
})();
