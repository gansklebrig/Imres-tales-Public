/* Ezekiel – The Destroyer · Lauf-Rückblick (W21)
   Nach Tod, Sieg oder Umkehr – vor der Rückkehr ins Lager (Z.backToCamp wird umhüllt) – ein schlichtes, gut lesbares Fenster:
   Dauer, erreichtes Gebiet, Route als kleine Karte (Z.weltkarte.draw), Kills, Schaden ausgeteilt/eingesteckt, größte Schadensquelle
   (Gegnerart, Boss, Falle, Absturz), beste Waffe (Schaden), Todesursache mit Bild und Namen, Gold/Splitter/Glut gesammelt,
   neue Funde/Erfolge/Gegner/Gebiete des Laufs und der Vergleich zur Bestleistung. Überspringbar (Knopf, Esc, Controller B);
   „Künftig überspringen“ schaltet ihn ab (Z.settings.rueckblick = false; wieder einschalten am Kartentisch).
   Mitschrift je Lauf: Z.run._rb (Lauf-Objekt, kein Speicher). Bestleistungen je Spielstand: Z.meta.rueckblick.rek (W19, über Z.saveMeta).
   Bossrausch-Läufe (Z.run.w21rausch, bossrausch.js) haben ihre eigene Auswertung und zeigen hier nichts.
   Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, L = v => Z.L(v), A = Z.audio;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const WK = () => Z.weltkarte || null;
  const fmt = s => (WK() ? WK().fmt(s) : Math.round(s || 0) + " s");
  const num = n => (Z.U && Z.U.fmt ? Z.U.fmt(Math.round(n || 0)) : String(Math.round(n || 0)));
  const rausch = () => !!(Z.run && Z.run.w21rausch);
  const keys = o => Object.keys(o && typeof o === "object" ? o : {});

  /* ======================= Bestleistungen (je Spielstand) ======================= */
  function MR() {
    const m = Z.meta || (Z.meta = {});
    let r = m.rueckblick; if (!r || typeof r !== "object" || Array.isArray(r)) r = m.rueckblick = {};
    if (!r.rek || typeof r.rek !== "object") r.rek = {};
    return r;
  }

  /* ======================= Mitschrift je Lauf ======================= */
  function fresh() {
    const M = Z.meta || {}, P = Z.player || {};
    return { found: keys(M.found), ach: keys(M.ach), seen: keys(M.seen), rek0: Object.assign({}, MR().rek), out: 0, outBy: {}, inn: 0, src: {}, last: null,
      glut: 0, glutL: P.glut | 0, gold: 0, goldL: P.gold | 0, spl: 0, splL: P.shards | 0, kind: null, key: null, done: false };
  }
  const RB = () => { const run = Z.run; if (!run) return null; return run._rb || (run._rb = fresh()); };

  const nr0 = Z.newRun;
  Z.newRun = function () { const r = nr0.apply(this, arguments); try { if (Z.run) Z.run._rb = fresh(); } catch (e) { console.error("rueckblick", e); } return r; };

  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    const n = hit0.apply(this, arguments);
    try {
      if (n > 0 && e && !e.dummy && Z.run && !rausch()) {
        const r = RB(); r.out += n;
        const k = o && o.it ? o.it.id : o && o.src === "melee" ? "faeuste" : null;
        if (k) r.outBy[k] = (r.outBy[k] || 0) + n;
      }
    } catch (_) {}
    return n;
  };

  function nearest(P, max) {
    let best = null, bd = max; const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
    for (const e of Z.enemies) { if (e.dead || !e.aware || e.dummy) continue; const d = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function srcKey(o) {
    o = o || {}; const P = Z.player;
    if (o.fall) return "x:sturz";
    if (o.trap || o.spike) return "x:falle";
    let e = o.attacker || (o.proj && o.proj.nmSrc) || null;
    if (!e && o.x != null) for (const h of Z.hazards) if (h.owner === "e" && h.nmSrc && Math.abs(h.x - o.x) < 1) { e = h.nmSrc; break; }
    if (!e && !o.hazard && Z.boss && !Z.boss.dead && !Z.bossDefeated) e = Z.boss;
    if (!e && !o.hazard && P) e = nearest(P, 160);
    if (!e) return o.hazard ? "x:umgebung" : "x:unbekannt";
    if (e.master && e.master.def && Z.BOSSDEF && Z.BOSSDEF[e.master.id] && !Z.ENEMIES[e.id]) e = e.master;
    return (Z.BOSSDEF && Z.BOSSDEF[e.id]) || (e.def && e.def.boss) ? "b:" + e.id : "e:" + e.id;
  }
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) {
    const P = Z.player, before = P ? P.hp : 0;
    let key = null; try { if (Z.run && P && !P.dead && !rausch()) key = srcKey(o); } catch (_) {}
    const r = hurt0.apply(this, arguments);
    try {
      if (key && P && P.hp < before) {
        const loss = before - Math.max(0, P.hp), b = RB();
        b.inn += loss; b.src[key] = (b.src[key] || 0) + loss; b.last = { key, t: Z.run.time || 0 };
      }
    } catch (_) {}
    return r;
  };
  /* Glut, Gold und Splitter: jeder Zuwachs zählt (Ausgeben/Abliefern nicht) */
  const bt0 = Z.bilanzTick;
  Z.bilanzTick = function () {
    if (bt0) bt0.apply(this, arguments);
    try {
      const P = Z.player, r = Z.run && !rausch() ? RB() : null; if (!r || !P) return;
      const g = P.glut | 0; if (g > r.glutL) r.glut += g - r.glutL; r.glutL = g;
      const o = P.gold | 0; if (o > r.goldL) r.gold += o - r.goldL; r.goldL = o;
      const s = P.shards | 0; if (s > r.splL) r.spl += s - r.splL; r.splL = s;
    } catch (_) {}
  };

  /* ---------- Laufende: Bestleistungen sofort sichern (auch wenn das Fenster nie aufgeht) ---------- */
  function tierOf(id) { const d = Z.BIOMES[id] || Z.ARENAS[id]; return d ? d.tier || 0 : 0; }
  function now(run) {
    const r = run._rb, route = (run.route || []).filter(x => Z.BIOMES[x] || Z.ARENAS[x]);
    return { gebiete: route.length, stufe: Math.max(0, ...route.map(tierOf)), kills: (Z.stats && Z.stats.kills) || 0, schaden: Math.round(r.out), zeit: run.time || 0 };
  }
  function end(kind, key) {
    const run = Z.run; if (!run || rausch()) return;
    const r = RB(); if (r.done) return; r.done = true; r.kind = kind; r.key = key || null;
    r.cause = kind === "tod" && r.last ? r.last.key : null;
    if (run.gnade) return; /* W9 Barmherzigkeit: keine Bestwerte */
    const n = now(run), k = MR().rek;
    for (const f of ["gebiete", "stufe", "kills", "schaden"]) if (n[f] > (k[f] || 0)) k[f] = n[f];
    if (kind === "sieg" && n.zeit > 0 && (!k.sieg || n.zeit < k.sieg)) k.sieg = Math.round(n.zeit);
    MR().n = (MR().n | 0) + 1;
    try { Z.saveMeta && Z.saveMeta(); } catch (_) {}
  }
  const death0 = Z.onPlayerDeath;
  Z.onPlayerDeath = function () {
    const P = Z.player, was = !P || P.dead;
    const r = death0.apply(this, arguments);
    try { if (!was && Z.player && Z.player.dead) end("tod"); } catch (e) { console.error("rueckblick", e); }
    return r;
  };
  function wireUI() {
    if (!Z.ui || !Z.ui.ending || !Z.ui.deathScreen || !Z.ui.actions) return setTimeout(wireUI, 50);
    const end0 = Z.ui.ending;
    Z.ui.ending = function (key) { const res = end0.apply(this, arguments); try { end("sieg", key); } catch (e) { console.error(e); } return res; };
    const ds0 = Z.ui.deathScreen;
    Z.ui.deathScreen = function (o) { try { if (o && o.abort) end("abbruch"); } catch (e) { console.error(e); } return ds0.apply(this, arguments); };
    Z.ui.actions.rb21Aus = () => { Z.settings.rueckblick = false; try { Z.saveSettings && Z.saveSettings(); } catch (_) {} Z.ui.close(); };
  }
  wireUI();

  /* ======================= Fenster ======================= */
  function srcName(k) {
    if (!k) return "";
    const [t, id] = k.split(":");
    if (t === "e") return Z.ENEMIES[id] ? L(Z.ENEMIES[id].n) : id;
    if (t === "b") return Z.BOSSDEF && Z.BOSSDEF[id] ? L(Z.BOSSDEF[id].n) : id;
    return L({ sturz: ["Absturz", "Fall"], falle: ["Fallen", "Traps"], umgebung: ["Gefahren der Umgebung", "Environmental hazards"], unbekannt: ["Unbekannt", "Unknown"] }[id] || ["?", "?"]);
  }
  const SYM = { sturz: "⤓", falle: "⚙", umgebung: "☁", unbekannt: "?" };
  function bildHTML(k, cls) { return '<span class="rb21-bild ' + (cls || "") + '" data-k="' + esc(k || "") + '"></span>'; }
  function fillBilder(root) {
    root.querySelectorAll(".rb21-bild[data-k]").forEach(el => {
      try {
        const [t, id] = (el.dataset.k || "").split(":");
        if (t === "e" || t === "b") {
          const d = t === "b" ? Z.BOSSDEF && Z.BOSSDEF[id] : Z.ENEMIES[id]; if (!d) return;
          const url = t === "b" && Z.bossPortraet ? Z.bossPortraet(d) : null;
          const im = document.createElement("img"); im.alt = "";
          im.src = url || (Z.gegnerBild ? Z.gegnerBild(d, { w: 96, h: 96, key: id }).toDataURL() : "");
          if (im.src) el.appendChild(im);
        } else if (t === "w") {
          const d = Z.WEAPONS[id] || Z.SKILLS[id]; if (!d || !Z.drawIcon) { el.textContent = "⚔"; return; }
          const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d"); c.scale(2, 2); Z.drawIcon(c, d.icon, 16, 17, 22, d.col); el.appendChild(cv);
        } else el.textContent = SYM[id] || "?";
      } catch (e) { console.error(e); }
    });
  }
  const kachel = (k, v, extra) => '<div class="rb21-k' + (extra ? " " + extra : "") + '"><b>' + v + "</b><span>" + esc(k) + "</span></div>";
  function build(run) {
    const r = run._rb || fresh(), P = Z.player || {}, S = Z.stats || {}, W = WK();
    const kind = r.kind || (P.dead ? "tod" : "abbruch");
    const route = (run.route || []).filter(x => Z.BIOMES[x] || Z.ARENAS[x]);
    const area = route[route.length - 1] || "torhof", M = Z.meta || {};
    const titel = L(kind === "sieg" ? ["Sieg", "Victory"] : kind === "tod" ? ["Gefallen", "Fallen"] : ["Umgekehrt", "Turned back"]);
    const hs = run.haerte && run.haerte.stufe ? " · " + L(run.haerte.name) : run.skulls ? " · " + "☠".repeat(run.skulls) : "";
    let h = '<h2 class="rb21-kopf rb21-' + kind + '">' + esc(L(["Lauf-Rückblick", "Run Recap"])) + "<small>" + esc(titel + " · " + Z.areaName(area) + hs) + "</small></h2>";
    /* Karte + Kacheln */
    const bank = run.shardsBank | 0, spl = Math.max(r.spl, bank + (P.shards | 0));
    h += '<div class="rb21-oben"><div class="rb21-karte"><canvas></canvas><p class="rb21-route">' + ["lager"].concat(route).map(x => esc(W ? W.shortName(x) : x)).join(" → ") + "</p></div>";
    h += '<div class="rb21-kacheln">' +
      kachel(L(["Dauer", "Duration"]), fmt(run.time)) +
      kachel(L(["Erreicht", "Reached"]), esc((W ? W.shortName(area) : area)) + " <small>" + L(["Stufe ", "Tier "]) + tierOf(area) + "</small>") +
      kachel(L(["Kills", "Kills"]), num(S.kills)) +
      kachel(L(["Schaden ausgeteilt", "Damage dealt"]), num(r.out)) +
      kachel(L(["Schaden eingesteckt", "Damage taken"]), num(r.inn)) +
      kachel(L(["Gold gesammelt", "Gold collected"]), num(Math.max(r.gold, S.gold || 0))) +
      kachel(L(["Splitter gesammelt", "Shards collected"]), num(spl) + (spl > bank ? " <small>" + L(["gesichert ", "kept "]) + num(bank) + "</small>" : "")) +
      kachel(L(["Glut gesammelt", "Embers collected"]), num(r.glut)) + "</div></div>";
    /* Ursachen */
    const top = o => { let b = null, v = 0; for (const k in o) if (o[k] > v) { v = o[k]; b = k; } return b ? [b, v] : null; };
    const big = top(r.src), best = top(r.outBy);
    h += '<div class="rb21-mitte">';
    if (kind === "tod") {
      const c = r.cause || (r.last && r.last.key) || null;
      h += '<div class="rb21-feld rb21-tod">' + (c ? bildHTML(c) : "") + "<div><span>" + esc(L(["Todesursache", "Cause of death"])) + "</span><b>" + esc(c ? srcName(c) : L(["Unbekannt", "Unknown"])) + "</b><small>" + esc(L(["in ", "in "]) + Z.areaName(area)) + "</small></div></div>";
    } else if (kind === "sieg") {
      const en = r.key && Z.TX && Z.TX.endings && Z.TX.endings[r.key] ? L(Z.TX.endings[r.key][0]) : L(["Ein Ende", "An ending"]);
      h += '<div class="rb21-feld rb21-sieg"><span class="rb21-bild">★</span><div><span>' + esc(L(["Ende erreicht", "Ending reached"])) + "</span><b>" + esc(en) + "</b></div></div>";
    } else h += '<div class="rb21-feld"><span class="rb21-bild">⚑</span><div><span>' + esc(L(["Lauf beendet", "Run ended"])) + "</span><b>" + esc(L(["Freiwillig umgekehrt", "Turned back by choice"])) + "</b></div></div>";
    h += '<div class="rb21-feld">' + (big ? bildHTML(big[0]) : "") + "<div><span>" + esc(L(["Größte Schadensquelle", "Biggest damage source"])) + "</span><b>" + esc(big ? srcName(big[0]) : "–") + "</b>" + (big ? "<small>" + num(big[1]) + " (" + Math.round((big[1] / Math.max(1, r.inn)) * 100) + " %)</small>" : "") + "</div></div>";
    const bd = best && (Z.WEAPONS[best[0]] || Z.SKILLS[best[0]]);
    h += '<div class="rb21-feld">' + (best ? bildHTML("w:" + best[0]) : "") + "<div><span>" + esc(L(["Beste Waffe", "Best weapon"])) + "</span><b>" + esc(bd ? L(bd.n) : "–") + "</b>" + (best ? "<small>" + num(best[1]) + " " + esc(L(["Schaden", "damage"])) + " (" + Math.round((best[1] / Math.max(1, r.out)) * 100) + " %)</small>" : "") + "</div></div></div>";
    /* Neues */
    const neu = [];
    for (const id of keys(M.found)) if (!r.found.includes(id)) { const d = Z.WEAPONS[id] || Z.SKILLS[id]; if (d) neu.push(["📜", L(d.n)]); }
    for (const id of keys(M.ach)) if (!r.ach.includes(id)) { const a = (Z.ACH || []).find(x => x.id === id); if (a) neu.push(["🏆", L(a.n)]); }
    for (const id of keys(M.seen)) if (!r.seen.includes(id)) { const d = Z.ENEMIES[id] || (Z.BOSSDEF && Z.BOSSDEF[id]); if (d && d.n) neu.push(["☠", L(d.n)]); }
    for (const id of (run._wk && run._wk.neu) || []) neu.push(["🗺", Z.areaName(id)]);
    h += '<div class="rb21-neu"><span>' + esc(L(["Neu in diesem Lauf", "New this run"])) + "</span>" + (neu.length ? neu.slice(0, 14).map(([i, n]) => "<i>" + i + " " + esc(n) + "</i>").join("") + (neu.length > 14 ? "<i>+" + (neu.length - 14) + "</i>" : "") : "<i class='leer'>" + esc(L(["nichts Neues – diesmal", "nothing new – this time"])) + "</i>") + "</div>";
    /* Vergleich zur Bestleistung */
    const n = now(run), k0 = r.rek0 || {};
    const zeile = (lab, v, b, txt, lower) => {
      const neuB = !run.gnade && (lower ? v > 0 && (!b || v < b) : v > (b || 0)) && (b || 0) > 0;
      return "<tr" + (neuB ? ' class="neu"' : "") + "><td>" + esc(lab) + "</td><td>" + txt(v) + "</td><td>" + (b ? txt(b) : "–") + "</td><td>" + (neuB ? "✦ " + esc(L(["Bestwert!", "Record!"])) : b ? (lower ? "" : Math.round((v / b) * 100) + " %") : "") + "</td></tr>";
    };
    h += '<table class="rb21-rek"><tr><th></th><th>' + esc(L(["Dieser Lauf", "This run"])) + "</th><th>" + esc(L(["Bisher bestes", "Previous best"])) + "</th><th></th></tr>" +
      zeile(L(["Gebiete", "Areas"]), n.gebiete, k0.gebiete, x => num(x)) + zeile(L(["Tiefste Stufe", "Deepest tier"]), n.stufe, k0.stufe, x => num(x)) +
      zeile(L(["Kills", "Kills"]), n.kills, k0.kills, x => num(x)) + zeile(L(["Schaden ausgeteilt", "Damage dealt"]), n.schaden, k0.schaden, x => num(x)) +
      (kind === "sieg" ? zeile(L(["Siegzeit", "Winning time"]), Math.round(n.zeit), k0.sieg, x => fmt(x), true) : "") + "</table>";
    if (run.gnade) h += '<p class="hinweis">' + esc(L(["Barmherzigkeit war an: dieser Lauf setzt keine Bestwerte.", "Mercy was on: this run sets no records."])) + "</p>";
    h += '<div class="knoepfe"><button data-act="close" autofocus>' + esc(L(["Weiter ins Lager", "On to the camp"])) + '</button><button data-act="rb21Aus">' + esc(L(["Künftig überspringen", "Skip from now on"])) + "</button></div>";
    return { html: h, route, kind };
  }
  function show(run, proceed) {
    const b = build(run);
    Z.ui.open(b.html, { cls: "rb21box", onClose: proceed });
    const root = document.querySelector("#modal .rb21box"); if (!root) return;
    fillBilder(root);
    const draw = () => {
      const wrap = root.querySelector(".rb21-karte"), cv = wrap && wrap.querySelector("canvas"); if (!cv || !WK()) return;
      const lo = Z.gq && Z.gq.level === 0, zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ui")) || 1, dpr = (lo ? 1 : Math.min(2, window.devicePixelRatio || 1)) * zoom, w = Math.max(160, wrap.clientWidth), h = Math.round(w * 0.46);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px";
      WK().draw(cv, { mini: true, route: b.route, end: b.kind });
    };
    requestAnimationFrame(draw);
    for (const ms of [60, 250]) setTimeout(() => { const bx = document.querySelector("#modal .rb21box"); if (bx) bx.scrollTop = 0; }, ms); /* Kopf sichtbar, Fokus bleibt auf „Weiter“ */
    A && A.play && A.play("scroll", { vol: 0.35 });
  }
  const back0 = Z.backToCamp;
  Z.backToCamp = function () {
    const run = Z.run, self = this, args = arguments;
    const skip = !run || rausch() || run._rbShown || !Z.level || Z.level.hub || !Z.ui || !Z.ui.open || (Z.settings && Z.settings.rueckblick === false);
    if (skip) return back0.apply(this, arguments);
    run._rbShown = true;
    try { if (!(run._rb && run._rb.done)) end(Z.player && Z.player.dead ? "tod" : "abbruch"); show(run, () => back0.apply(self, args)); }
    catch (e) { console.error("rueckblick", e); back0.apply(self, args); }
  };

  /* ======================= Stil ======================= */
  const css = document.createElement("style");
  css.textContent = [
    ".mbox.rb21box{width:min(960px,calc(97vw / var(--ui,1)))!important}",
    ".rb21-kopf.rb21-tod small{color:#ff9a84}.rb21-kopf.rb21-sieg small{color:#ffd27a}",
    ".rb21-oben{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:12px;align-items:start}",
    ".rb21-karte canvas{display:block;width:100%;border-radius:5px;box-shadow:0 4px 14px rgba(0,0,0,.5)}",
    ".rb21-route{font-size:var(--fs-s,13px);color:#c8b090;margin:5px 0 0!important;line-height:1.3}",
    ".rb21-kacheln{display:grid;grid-template-columns:1fr 1fr;gap:6px}",
    ".rb21-k{background:rgba(255,235,200,.04);border:1px solid #3a2a22;border-radius:6px;padding:5px 9px;display:flex;flex-direction:column}",
    ".rb21-k b{font-size:var(--fs-l,19px);color:#f0e0c0;line-height:1.15}.rb21-k b small{font-size:.62em;color:#c8b090;font-weight:400}.rb21-k span{font-size:var(--fs-s,13px);color:#c8b090}",
    ".rb21-mitte{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}",
    ".rb21-feld{display:flex;gap:8px;align-items:center;background:rgba(20,12,8,.5);border:1px solid #3a2a22;border-radius:6px;padding:6px 8px;min-width:0}",
    ".rb21-feld>div{display:flex;flex-direction:column;min-width:0}.rb21-feld span{font-size:var(--fs-s,13px);color:#c8b090}.rb21-feld b{color:#f0e0c0;overflow:hidden;text-overflow:ellipsis}.rb21-feld small{color:#a89070}",
    ".rb21-tod{border-color:#6a1a14;background:rgba(60,8,8,.45)}.rb21-sieg{border-color:#8a6420}",
    ".rb21-bild{flex:0 0 auto;width:52px;height:52px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#e5b454;background:radial-gradient(circle,#3a2418,#1a100c);border-radius:50%;overflow:hidden}",
    ".rb21-bild img,.rb21-bild canvas{width:100%;height:100%;object-fit:contain}",
    ".rb21-neu{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-top:10px}.rb21-neu>span{color:#c8b090;font-size:var(--fs-s,13px);margin-right:4px}",
    ".rb21-neu i{font-style:normal;background:rgba(229,180,84,.10);border:1px solid rgba(229,180,84,.3);border-radius:12px;padding:1px 9px;font-size:var(--fs-s,13px);color:#f0dcb0}.rb21-neu i.leer{opacity:.6;border-style:dashed}",
    ".rb21-rek{width:100%;border-collapse:collapse;margin-top:10px;font-size:var(--fs-s,13px)}.rb21-rek th{color:#c8b090;font-weight:400;text-align:left;padding:2px 6px}.rb21-rek td{padding:2px 6px;border-top:1px solid rgba(229,180,84,.12);color:#e8d8b8}",
    ".rb21-rek tr.neu td{color:#ffd27a}.rb21-rek td:last-child{text-align:right;color:#a89070}.rb21-rek tr.neu td:last-child{color:#ffd27a}",
    ".handheld .rb21-oben{grid-template-columns:minmax(0,.9fr) minmax(0,1fr);gap:6px}.handheld .rb21-kacheln{gap:3px}.handheld .rb21-k{padding:2px 6px}.handheld .rb21-k b{font-size:14px}.handheld .rb21-k span{font-size:10px}",
    ".handheld .rb21-mitte{gap:4px;margin-top:5px}.handheld .rb21-feld{padding:3px 5px;gap:5px}.handheld .rb21-bild{width:34px;height:34px;font-size:18px}.handheld .rb21-feld b{font-size:12px}.handheld .rb21-feld span,.handheld .rb21-feld small{font-size:10px}",
    ".handheld .rb21-neu{margin-top:5px;gap:3px}.handheld .rb21-neu i{font-size:10px;padding:0 6px}.handheld .rb21-rek{margin-top:5px;font-size:11px}.handheld .rb21-rek td,.handheld .rb21-rek th{padding:1px 4px}.handheld .mbox.rb21box{padding:10px 12px}",
    "@media (max-aspect-ratio:1/1){.rb21-oben,.rb21-mitte{grid-template-columns:1fr}}"
  ].join("\n");
  document.head.appendChild(css);

  Z.rueckblick = { show: () => { const run = Z.run; if (run) show(run, () => {}); }, data: () => (Z.run ? RB() : null), meta: MR, srcName };
})();
