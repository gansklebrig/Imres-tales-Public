/* Ezekiel – The Destroyer · W38 Meta: Zielbuch, Sammel-Meilensteine und Lagerwege (ziele.js)
   Befund (Spielstände „mittel“ ~8 Läufe und „weit“ Meta_21, Desktop + Handy quer): Fortschritt ist über viele Stellen verteilt
   (Erfolge im Startfenster, Fundbuch/Bestiarium bei Barradin, Tagebuch und Aufträge im Pausenmenü, Gaben am Wandlungsbaum,
   Runen an der Stele, Härte am Altar …) – nirgends steht „wo stehe ich, was ist als Nächstes dran“. Das Lager ist ~5 Bildschirme
   lang, sechs Bewohner tragen „neu!“, man muss sie ablaufen.
   1) ZIELBUCH (Pausenmenü „🎯 Ziele“, überall – Tastatur/Pad/Touch über das Pausenmenü):
      · „Als Nächstes“: die vier Erfolge, die am nächsten dran sind (Fortschritt x/y, Lohn: Umhang/Titel) + fehlende Helden.
      · „Sammlung“: 13 Fortschrittsbalken (Erfolge, Fundbuch, Bestiarium, Bosse, Tagebuch, Bewegungsrunen, Umhänge, Helden,
        Enden, Härte, Gaben, Wunder, Lagerbewohner); antippen öffnet die passende Ansicht, wo es eine gibt.
   2) SAMMEL-MEILENSTEINE: Je Sammlung bei 25 / 50 / 75 / 100 % einmalig Seelensplitter (15 / 25 / 35 / 50 ◆; kleine Sammlungen
      unter 8 Einträgen und Gaben nur bei 100 %: 50 ◆). Abholen nur im Lager (nicht im Bossrausch, nicht als Online-Gast), Knopf
      „Abholen“ im Zielbuch; beim Betreten des Lagers ein leiser Hinweis, wenn etwas bereitliegt. Speicher: Z.meta.w38ziele.got
      (neuer Schlüssel, Einträge „<sammlung>:<prozent>“ – nichts wird umnummeriert). Vorsichtig bemessen: ganzes Spiel ≈ 1 500 ◆.
   2b) LAUF-RÜCKBLICK: Zeile „🎯 Sammlung: Fundbuch +3 · Bestiarium +2 …“, nächster Meilenstein mit Rest und ggf. „Meilensteine bereit“.
   3) LAGERWEGE (nur im Lager, Abschnitt im Zielbuch): alle Stationen und Bewohner von links nach rechts, „neu!“/🎁 zuerst
      markiert; „Hingehen“ blendet kurz ab und stellt Ezekiel neben die Station.
   Kein Blau. Marker „W38 Meta“. Prüfhilfe: Z.ziele.stand(), Z.ziele.open(), Z.ziele.offen(). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.ziele) return;
  const T = Z.TILE, A = Z.audio, L = v => Z.L(v);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const M = () => Z.meta || {};
  const n0 = o => (o && typeof o === "object" ? Object.keys(o).length : 0);
  const gast = () => { const s = Z.online && Z.online.S; return !!(s && s.role === "guest" && s.playing); };
  const rausch = () => !!(Z.bossrausch && Z.bossrausch.aktiv && Z.bossrausch.aktiv());
  const act = () => (Z.ui && Z.ui.actions) || {};

  /* ======================= SAMMLUNGEN ======================= */
  const keysIn = (o, pool) => Object.keys(o || {}).filter(k => pool && Object.prototype.hasOwnProperty.call(pool, k) && o[k]);
  const SAM = [
    { id: "erfolge", n: ["Erfolge", "Achievements"], ico: "🏆", get: () => { const all = (Z.ACH || []).map(a => a.id); const m = M().ach || {}; return [all.filter(id => m[id]).length, all.length]; }, open: () => act().abAchTab && act().abAchTab((Z.ACH && Z.ACH[0] && Z.ACH[0].c) || "tempo") },
    { id: "fund", n: ["Fundbuch", "Ledger"], ico: "📜", get: () => { const pool = Object.assign({}, Z.WEAPONS, Z.SKILLS), ids = Object.keys(pool).filter(k => pool[k] && pool[k].find); const f = M().found || {}; return [ids.filter(k => f[k]).length, ids.length]; }, open: () => Z.ui.codex && Z.ui.codex(0) },
    { id: "bestien", n: ["Bestiarium", "Bestiary"], ico: "🐾", get: () => { const ids = Object.keys(Z.ENEMIES || {}).filter(k => k !== "puppe" && k !== "glutlingKlein"); const s = M().seen || {}; return [ids.filter(k => s[k]).length, ids.length]; }, open: () => Z.ui.codex && Z.ui.codex(2) },
    { id: "bosse", n: ["Bosse & Wächter besiegt", "Bosses & wardens beaten"], ico: "☠", get: () => { const ids = Object.keys(Z.BOSSDEF || {}).filter(k => k !== "nezna"); const b = M().bosses || {}; return [ids.filter(k => b[k] && b[k].won > 0).length, ids.length]; }, open: () => Z.ui.codex && Z.ui.codex(3) },
    { id: "tagebuch", n: ["Miras Tagebuch", "Mira's Diary"], ico: "✒", get: () => [Z.tagebuch ? Z.tagebuch.count() : n0(M().tagebuch), Z.tagebuch ? Z.tagebuch.pages.length : 13], open: () => act().tbBuch && act().tbBuch() },
    { id: "runen", n: ["Bewegungsrunen", "Movement runes"], ico: "ᚱ", get: () => [keysIn((M().runen || {}).frei, Z.MOVE_RUNES).length, n0(Z.MOVE_RUNES)] },
    { id: "umhang", n: ["Umhänge", "Capes"], ico: "🧣", get: () => [keysIn(M().capes, Z.CAPES).length, n0(Z.CAPES)] },
    { id: "helden", n: ["Helden", "Heroes"], ico: "⚔", get: () => [["Z", "G", "B", "E"].filter(k => (M().heroes || {})[k]).length, 4] },
    { id: "enden", n: ["Enden", "Endings"], ico: "✦", get: () => [["tiefe", "glut", "himmel", "alle"].filter(k => (M().endings || {})[k]).length, 4], open: () => Z.ui.codex && Z.ui.codex(4) },
    { id: "haerte", n: ["Härtegrade", "Hardness levels"], ico: "◈", get: () => [Math.max(0, Math.min(5, ((M().haerte || {}).max | 0))), 5] },
    { id: "gaben", klein: true /* 25 von 30 sind von Anfang an offen – nur 100 % zählt */, n: ["Gaben (Wandlungsbaum)", "Gifts (tree of change)"], ico: "❦", get: () => { const g = (Z.mut && Z.mut.liste) || []; return [g.filter(x => Z.mut.offen(x.id)).length, g.length]; } },
    { id: "wunder", n: ["Wunder gesehen", "Wonders seen"], ico: "✧", get: () => [Z.wunder ? Z.wunder.seen() : 0, Z.wunder ? Z.wunder.count() : 0] },
    { id: "bewohner", n: ["Lagerbewohner", "Camp residents"], ico: "⛺", get: () => [Z.lager ? Z.lager.residents().length : 0, Z.lager && Z.lager.RES ? n0(Z.lager.RES) : 0] }
  ];
  function stand() {
    return SAM.map(s => { let v = [0, 0]; try { v = s.get() || [0, 0]; } catch (e) { } const [a, b] = [Math.max(0, v[0] | 0), Math.max(0, v[1] | 0)]; return { s, a: Math.min(a, b), b }; }).filter(x => x.b > 0);
  }
  /* Meilensteine */
  const STUFEN = [[25, 15], [50, 25], [75, 35], [100, 50]];
  function ZM() { const m = M(); let z = m.w38ziele; if (!z || typeof z !== "object" || Array.isArray(z)) z = m.w38ziele = {}; if (!z.got || typeof z.got !== "object" || Array.isArray(z.got)) z.got = {}; return z; }
  function stufenOf(x) { return x.b >= 8 && !x.s.klein ? STUFEN : [[100, 50]]; }
  function kurz(l) { const by = {}; for (const o of l) if (!by[o.x.s.id] || by[o.x.s.id].p < o.p) by[o.x.s.id] = o; return Object.keys(by).map(k => L(by[k].x.s.n) + " " + by[k].p + " %").join(" · "); }
  function offen() {
    const got = ZM().got, out = [];
    for (const x of stand()) for (const [p, r] of stufenOf(x)) { const key = x.s.id + ":" + p; if (!got[key] && x.a * 100 >= p * x.b) out.push({ key, x, p, r }); }
    return out;
  }
  const darfAbholen = () => !!(Z.level && Z.level.hub && !rausch() && !gast());
  function abholen() {
    if (!darfAbholen()) return 0;
    const l = offen(); if (!l.length) return 0;
    let sum = 0; const got = ZM().got;
    for (const o of l) { got[o.key] = Date.now(); sum += o.r; }
    M().shards = (M().shards | 0) + sum; Z.saveMeta();
    try { A.play("gem", { vol: 0.5 }); A.play("holy", { vol: 0.35 }); Z.music && Z.music.stinger && Z.music.stinger("beute"); } catch (_) {}
    if (Z.ui && Z.ui.notify) Z.ui.notify("<b>🎯 " + L(["Meilensteine: +", "Milestones: +"]) + sum + " ◆</b><br><small>" + esc(kurz(l)) + "</small>", { prio: 2, art: "gold", key: "w38ziele" });
    return sum;
  }

  /* ======================= ALS NÄCHSTES ======================= */
  function naechste() {
    const m = M().ach || {}, out = [];
    for (const a of Z.ACH || []) {
      if (m[a.id] || !a.p) continue;
      let p = null; try { p = a.p(); } catch (_) {}
      if (!p || !(p[1] > 0)) continue;
      const f = Math.max(0, Math.min(1, p[0] / p[1])); if (f <= 0 || f >= 1) continue;
      out.push({ a, cur: Math.floor(Math.min(p[0], p[1])), max: p[1], f });
    }
    out.sort((x, y) => y.f - x.f);
    return out.slice(0, 4);
  }
  function lohnTxt(r) {
    if (!r) return "";
    if (r.cape && Z.CAPES && Z.CAPES[r.cape]) return L(["Umhang „", "Cape '"]) + L(Z.CAPES[r.cape].n) + L(["“", "'"]);
    if (r.titel) return L(["Titel „", "Title '"]) + L(r.titel) + L(["“", "'"]);
    if (r.hero) return L(["Held", "Hero"]);
    return "";
  }

  /* ======================= LAGERWEGE ======================= */
  function stationen() {
    const lv = Z.level; if (!lv || !lv.hub) return [];
    const out = [];
    for (const o of Z.interacts || []) {
      if (!o || o.rueck || o.off || (o.ok && !o.ok()) || !isFinite(o.x)) continue;
      let lab = ""; try { lab = String(o.label ? o.label() : ""); } catch (_) {}
      lab = lab.replace(/<[^>]*>/g, "").trim(); if (!lab) continue;
      if (/^(Schnellweg|Shortcut)/.test(lab) || /^Bauplatz|^Building plot/.test(lab)) continue;
      const neu = /neu!|new!|🎁|!$/.test(lab);
      out.push({ o, lab: lab.replace(/\s*·\s*(neu!|new!)/g, ""), neu });
    }
    /* Bewohner ohne eigene Interaktion (Barradin, Echo, Friedrich, Nundro …): Requisiten mit Namen */
    const NPC = { B: "Barradin", E: "Echo", G: "Friedrich", A: "Nundro" };
    for (const p of lv.props || []) if (NPC[p.id] && !out.some(s => Math.abs(s.o.x - (p.x * T + 8)) < 24)) out.push({ o: { x: p.x * T + 8, y: (p.y + 1) * T }, lab: NPC[p.id], neu: false, npc: true });
    out.sort((a, b) => (b.neu - a.neu) || (a.o.x - b.o.x));
    return out;
  }
  function hingehen(i) {
    const l = stationen(), s = l[+i]; if (!s || !Z.player || !Z.level || !Z.level.hub) return;
    Z.ui.close();
    Z.ui.fade(() => {
      const P = Z.player; if (!P || !Z.level || !Z.level.hub) return;
      const dx = P.x + P.w / 2 < s.o.x ? -16 : 16;
      let x = s.o.x + dx - P.w / 2, y = (s.o.y || 12 * T) - P.h - 1;
      try { if (Z.freeSpot) { const f = Z.freeSpot(s.o.x + dx, s.o.y || 12 * T, P.w, P.h, { r: 40 }); if (f && isFinite(f.x)) { x = f.x - P.w / 2; y = f.y - P.h - 1; } } } catch (_) {}
      P.x = x; P.y = y; P.vx = 0; P.vy = 0; P.face = dx < 0 ? 1 : -1; P.lastSafe = { x: P.x, y: P.y };
      if (Z.cam && Z.cam.snap) Z.cam.snap(P.x + P.w / 2, P.y);
      try { A.play("door", { vol: 0.25, rate: 1.3 }); } catch (_) {}
    });
  }

  /* ======================= FENSTER ======================= */
  const bar = (a, b) => '<i class="zl-bar"><i style="width:' + (b ? Math.round(a / b * 100) : 0) + '%"></i></i>';
  function open() {
    if (!Z.ui || !Z.ui.open) return;
    const st = stand(), off = offen(), sumOff = off.reduce((s, o) => s + o.r, 0), nx = naechste(), hub = !!(Z.level && Z.level.hub);
    let h = "<h2>🎯 " + esc(L(["Ziele", "Goals"])) + "<small>" + esc(L(["Was als Nächstes dran ist", "What's next"])) + "</small></h2>";
    if (sumOff) h += '<div class="zl-lohn"><b>' + esc(L(["Meilensteine erreicht: +", "Milestones reached: +"]) + sumOff + " ◆") + "</b><small>" + esc(kurz(off)) + "</small>" +
      (darfAbholen() ? '<button data-act="zlAbholen" autofocus>' + esc(L(["Abholen", "Collect"])) + "</button>" : "<em>" + esc(L(["Abholen im Lager", "Collect at camp"])) + "</em>") + "</div>";
    if (nx.length) {
      h += "<h3>" + esc(L(["Als Nächstes", "Up next"])) + '</h3><div class="zl-naechst">';
      for (const x of nx) h += '<div class="zl-n"><b>' + esc(L(x.a.n)) + "</b><small>" + esc(L(x.a.d)) + "</small>" + bar(x.cur, x.max) + '<span class="zl-z">' + x.cur + " / " + x.max + (lohnTxt(x.a.r) ? " · " + esc(lohnTxt(x.a.r)) : "") + "</span></div>";
      h += "</div>";
    }
    h += "<h3>" + esc(L(["Sammlung", "Collection"])) + ' <small class="hinweis">' + esc(L(["je 25 / 50 / 75 / 100 %: Seelensplitter", "at 25 / 50 / 75 / 100%: soul shards"])) + '</small></h3><div class="zl-sam">';
    st.forEach((x, i) => {
      const nextSt = stufenOf(x).find(([p]) => !ZM().got[x.s.id + ":" + p] && x.a * 100 < p * x.b);
      const readyL = off.filter(o => o.x.s.id === x.s.id), ready = readyL.length > 0;
      const tag = x.s.open ? "button" : "div";
      h += "<" + tag + ' class="zl-s' + (ready ? " bereit" : "") + (x.a >= x.b ? " voll" : "") + '"' + (x.s.open ? ' data-act="zlOpen" data-arg="' + i + '"' : "") + '><i class="zl-ico">' + esc(x.s.ico) + "</i><b>" + esc(L(x.s.n)) + '</b><span class="zl-z">' + x.a + " / " + x.b + "</span>" + bar(x.a, x.b) +
        "<small>" + (ready ? "◆ " + esc(L(["bereit: +", "ready: +"]) + readyL.reduce((q, o) => q + o.r, 0) + " ◆") + (nextSt ? " · " : "") : "") + (x.a >= x.b ? (ready ? "" : "✓ " + esc(L(["vollständig", "complete"]))) : nextSt ? esc(L(["nächster Meilenstein: ", "next milestone: "]) + Math.ceil(nextSt[0] * x.b / 100) + " (+" + nextSt[1] + " ◆)") : "") + "</small></" + tag + ">";
    });
    h += "</div>";
    if (hub) {
      const l = stationen();
      if (l.length) {
        h += "<h3>" + esc(L(["Im Lager", "In camp"])) + ' <small class="hinweis">' + esc(L(["Hingehen bringt dich direkt hin", "Go takes you straight there"])) + '</small></h3><div class="zl-weg">';
        l.forEach((s, i) => { h += '<button data-act="zlGeh" data-arg="' + i + '"' + (s.neu ? ' class="neu"' : "") + ">" + (s.neu ? '<i class="zl-neu">!</i>' : "") + esc(s.lab) + "</button>"; });
        h += "</div>";
      }
    }
    h += '<div class="knoepfe"><button data-act="close"' + (sumOff && darfAbholen() ? "" : " autofocus") + ">" + esc(L(["Schließen", "Close"])) + "</button></div>";
    Z.ui.open(h, { cls: "breit zlbox" });
  }

  /* ======================= VERKABELUNG ======================= */
  function wire() {
    const ui = Z.ui; if (!ui || !ui.actions || typeof ui.pause !== "function") return setTimeout(wire, 60);
    ui.actions.zlOpenBuch = () => { ui.close(); setTimeout(open, 30); };
    ui.actions.zlAbholen = () => { abholen(); ui.close(); setTimeout(open, 30); };
    ui.actions.zlGeh = i => hingehen(i);
    ui.actions.zlOpen = i => { const x = stand()[+i]; if (!x || !x.s.open) return; ui.close(); setTimeout(() => { try { x.s.open(); } catch (e) { console.error("W38 Meta", e); } }, 30); };
    if (!ui.pause._w38z) {
      const p0 = ui.pause;
      ui.pause = function () {
        const r = p0.apply(this, arguments);
        try {
          const k = document.querySelector("#modal .pausenmenue .knoepfe") || document.querySelector("#modal .knoepfe.senk");
          if (k && !k.querySelector('[data-act="zlOpenBuch"]')) {
            const b = document.createElement("button"); b.dataset.act = "zlOpenBuch";
            const n = offen().length;
            b.textContent = "🎯 " + L(["Ziele", "Goals"]) + (n ? " ◆" : "");
            k.insertBefore(b, k.children[1] || null);
          }
        } catch (e) { console.error("W38 Meta", e); }
        return r;
      };
      ui.pause._w38z = true;
    }
  }
  wire();
  /* Lauf-Rückblick: was dieser Lauf zur Sammlung beigetragen hat + nächster Meilenstein (rueckblick.js, Fenster .rb21box) */
  let snap0 = null;
  const nr0 = Z.newRun;
  Z.newRun = function () { const r = nr0.apply(this, arguments); try { snap0 = rausch() ? null : { seed: Z.run && Z.run.seed, st: stand().map(x => [x.s.id, x.a]) }; } catch (e) { snap0 = null; } return r; };
  function laufZeile() {
    if (!snap0 || rausch() || gast()) return "";
    const before = {}; for (const [id, a] of snap0.st) before[id] = a;
    const now = stand(), plus = now.filter(x => before[x.s.id] != null && x.a > before[x.s.id]);
    /* nächster erreichbarer Meilenstein: kleinster Rest */
    let best = null;
    for (const x of now) { if (x.s.klein) continue; const st = stufenOf(x).find(([p]) => !ZM().got[x.s.id + ":" + p] && x.a * 100 < p * x.b); if (!st) continue; const need = Math.ceil(st[0] * x.b / 100), rest = need - x.a; if (rest > 0 && (!best || rest / x.b < best.rest / best.x.b)) best = { x, need, rest, r: st[1] }; }
    const off = offen(), sum = off.reduce((q, o) => q + o.r, 0);
    if (!plus.length && !best && !sum) return "";
    let h = '<div class="rb21-ziel"><span>🎯 ' + esc(L(["Sammlung", "Collection"])) + "</span>";
    h += plus.length ? plus.map(x => "<i>" + esc(x.s.ico + " " + L(x.s.n)) + " <b>+" + (x.a - before[x.s.id]) + "</b></i>").join("") : "<i>" + esc(L(["diesmal nichts Neues", "nothing new this time"])) + "</i>";
    if (best) h += '<em>' + esc(L(["Als Nächstes: ", "Next: "]) + L(best.x.s.n) + " " + best.x.a + "/" + best.need + L([" – noch ", " – "]) + best.rest + L(["", " to go"]) + " (+" + best.r + " ◆)") + "</em>";
    if (sum) h += '<em class="bereit">' + esc(L(["◆ Meilensteine bereit: +", "◆ Milestones ready: +"]) + sum + L([" – im Lager unter Pause → Ziele", " – at camp via Pause → Goals"])) + "</em>";
    return h + "</div>";
  }
  function wireOpen() {
    const ui = Z.ui; if (!ui || !ui.open) return setTimeout(wireOpen, 60);
    if (ui.open._w38z) return;
    const o0 = ui.open;
    ui.open = function (html, opts) {
      const r = o0.apply(this, arguments);
      try {
        if (opts && typeof opts.cls === "string" && opts.cls.indexOf("rb21box") >= 0) {
          const m = document.getElementById("modal"), neu = m && m.querySelector(".rb21-neu");
          const z = laufZeile();
          if (neu && z && !m.querySelector(".rb21-ziel")) neu.insertAdjacentHTML("afterend", z);
        }
      } catch (e) { console.error("W38 Meta", e); }
      return r;
    };
    ui.open._w38z = true;
  }
  wireOpen();

  /* leiser Hinweis beim Betreten des Lagers, wenn Meilensteine bereitliegen (je Lagerbesuch einmal) */
  const la0 = Z.loadArea;
  Z.loadArea = function () {
    const r = la0.apply(this, arguments);
    try {
      const lv = Z.level;
      if (lv && lv.hub && !rausch() && !gast()) {
        const l = offen();
        if (l.length) setTimeout(() => { if (Z.level !== lv || !Z.ui || !Z.ui.notify) return; Z.ui.notify("<b>🎯 " + L(["Meilensteine bereit: +", "Milestones ready: +"]) + l.reduce((s, o) => s + o.r, 0) + " ◆</b><br><small>" + L(["Pause → Ziele → Abholen", "Pause → Goals → Collect"]) + "</small>", { prio: 1, art: "gold", key: "w38zielhinweis", dauer: 6000 }); }, 4200);
      }
    } catch (e) { console.error("W38 Meta", e); }
    return r;
  };

  const css = document.createElement("style");
  css.textContent = [
    ".zlbox h3{margin:12px 0 6px}",
    ".zl-lohn{display:grid;grid-template-columns:1fr auto;align-items:center;gap:2px 12px;background:linear-gradient(90deg,rgba(200,144,42,.22),rgba(60,30,10,.25));border:1px solid rgba(229,180,84,.55);border-radius:8px;padding:8px 12px;margin:4px 0 6px}",
    ".zl-lohn b{color:#ffd27a}.zl-lohn small{grid-column:1;color:#d8c8a8}.zl-lohn button,.zl-lohn em{grid-row:1/span 2;grid-column:2}.zl-lohn em{color:#c8b090;font-size:var(--fs-s,13px)}",
    ".zl-naechst{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px}",
    ".zl-n{background:rgba(40,24,18,.6);border:1px solid #5e4a3c;border-radius:6px;padding:6px 10px;display:flex;flex-direction:column;gap:2px}.zl-n b{color:#f0dcb0}.zl-n small{color:#c8b090;font-size:var(--fs-s,13px)}",
    ".zl-bar{display:block;height:6px;border-radius:3px;background:rgba(0,0,0,.45);overflow:hidden;margin:3px 0 1px}.zl-bar>i{display:block;height:100%;background:linear-gradient(90deg,#a0241a,#e5b454)}",
    ".zl-z{color:#e5b454;font-size:var(--fs-s,13px);font-variant-numeric:tabular-nums}",
    ".zl-sam{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px}",
    ".zl-s{display:grid;grid-template-columns:auto 1fr auto;column-gap:8px;align-items:center;text-align:left;background:linear-gradient(#3a2a24,#241915);border:1px solid #5e4a3c;border-radius:6px;padding:6px 10px;color:#f0e0c0;font:inherit}",
    "button.zl-s{cursor:pointer}button.zl-s:hover,button.zl-s:focus{border-color:var(--gold,#e5b454);background:linear-gradient(#4a3428,#2a1c16)}",
    ".zl-s .zl-ico{font-style:normal;color:#e5b454;font-size:18px;grid-row:span 3}.zl-s b{color:#f0dcb0;font-size:var(--fs-s,13px)}.zl-s .zl-bar{grid-column:2/span 2}.zl-s small{grid-column:2/span 2;color:#a89878;font-size:11px}",
    ".zl-s.bereit{border-color:#e5b454;box-shadow:0 0 0 1px rgba(229,180,84,.35),0 0 12px rgba(229,180,84,.25)}.zl-s.voll .zl-bar>i{background:linear-gradient(90deg,#c8902a,#ffe9a8)}",
    ".zl-weg{display:flex;flex-wrap:wrap;gap:5px}.zl-weg button{background:linear-gradient(#3a2a24,#241915);border:1px solid #5e4a3c;border-radius:14px;color:#f0e0c0;padding:4px 12px;font:inherit;font-size:var(--fs-s,13px);cursor:pointer}",
    ".zl-weg button.neu{border-color:#e5b454;color:#ffd27a}.zl-weg button:hover,.zl-weg button:focus{border-color:var(--gold,#e5b454);background:linear-gradient(#4a3428,#2a1c16)}.zl-neu{font-style:normal;color:#1a0a06;background:#e5b454;border-radius:8px;padding:0 5px;margin-right:6px;font-weight:800}",
    ".rb21-ziel{display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;margin:6px 0;font-size:var(--fs-s,13px)}.rb21-ziel>span{color:#c8b090;margin-right:4px}",
    ".rb21-ziel i{font-style:normal;background:rgba(200,144,42,.14);border:1px solid rgba(200,144,42,.45);border-radius:10px;padding:1px 8px;color:#f0dcb0}.rb21-ziel i b{color:#ffd27a}",
    ".rb21-ziel em{flex-basis:100%;font-style:normal;color:#d8c8a8}.rb21-ziel em.bereit{color:#ffd27a}",
    ".handheld .zl-sam{grid-template-columns:1fr 1fr;gap:4px}.handheld .zl-naechst{grid-template-columns:1fr 1fr}.handheld .zl-s{padding:3px 6px}.handheld .zl-n small{display:none}"
  ].join("\n");
  document.head.appendChild(css);

  Z.ziele = { stand: () => stand().map(x => [x.s.id, x.a, x.b]), offen: () => offen().map(o => [o.key, o.r]), naechste: () => naechste().map(x => [x.a.id, x.cur, x.max]), open, abholen, stationen: () => stationen().map(s => [Math.round(s.o.x / T), s.lab, s.neu]), hingehen };
})();
