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
    h += '<div class="knoepfe"><button data-act="close">' + esc(L(["Schließen", "Close"])) + "</button></div>";
    Z.ui.open(h, { cls: "breit zlbox" });
    /* W39 Touch: Fokus oben – Abholen, sonst erste Kachel bzw. erster Lagerweg, erst zuletzt „Schließen“; Ansicht beginnt oben */
    const m = document.getElementById("modal"), f = m && (m.querySelector('[data-act="zlAbholen"]') || m.querySelector('.zl-s[data-act]') || m.querySelector('[data-act="zlGeh"]') || m.querySelector('[data-act="close"]'));
    if (f) { const box = m.querySelector(".mbox"); f.focus({ preventScroll: true }); if (box) { box.scrollTop = 0; f.scrollIntoView && f.scrollIntoView({ block: "nearest" }); } }
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
      if (lv && lv.hub) try { stimmen(); } catch (e) { }
      if (lv && lv.hub && !rausch() && !gast()) {
        const l = offen();
        if (l.length) setTimeout(() => { if (Z.level !== lv || !Z.ui || !Z.ui.notify) return; Z.ui.notify("<b>🎯 " + L(["Meilensteine bereit: +", "Milestones ready: +"]) + l.reduce((s, o) => s + o.r, 0) + " ◆</b><br><small>" + L(["Pause → Ziele → Abholen", "Pause → Goals → Collect"]) + "</small>", { prio: 1, art: "gold", key: "w38zielhinweis", dauer: 6000 }); }, 4200);
      }
    } catch (e) { console.error("W38 Meta", e); }
    return r;
  };

  /* ======================= W38 Lager-Stimmen: mehr Sätze der Bewohner =======================
     Befund: je Bewohner nur 3–4 Lagersätze (Z.R.pick) – nach 10+ Läufen hört man denselben Satz ständig. Je Bewohner kommen drei
     allgemeine Sätze dazu (in der Stimme der Figur) und ab dem zweiten Lauf ein Satz zu den neuen Inhalten (Lagen, Tagesprüfung,
     Zielbuch). Nur Ergänzung der Listen in Z.lager.RES[id].idle – nichts wird ersetzt. */
  const STIMMEN = {
    edda: { a: [["Ich hab heute drei Gänge gezeichnet. Zwei davon gab es gestern noch nicht.", "I drew three corridors today. Two of them didn't exist yesterday."], ["Nimm die linke Abzweigung. Oder die rechte. Hauptsache, du kommst wieder.", "Take the left fork. Or the right. Just come back."], ["Wenn du einen Raum ohne Ausgang findest – sag Bescheid, bevor du drin bleibst.", "If you find a room with no exit, tell me before you stay in it."]],
      n: [["Ein Kreuz im Boden? Das ist nicht von mir. Graben solltest du trotzdem.", "A cross on the floor? Not mine. You should still dig."]] },
    quirin: { a: [["Das hier blubbert. Das soll es auch. Glaube ich.", "This one bubbles. It's supposed to. I think."], ["Wenn es grün raucht, lauf. Wenn es lila raucht, lauf schneller.", "If it smokes green, run. If it smokes purple, run faster."], ["Ich nenne den Trank „Mut“. Er schmeckt nach Angst.", "I call this potion 'Courage'. It tastes like fear."]],
      n: [["Seelenflut? Bring mir einen Splitter davon. Nur einen. Für die Wissenschaft.", "Soul tide? Bring me one shard of it. Just one. For science."]] },
    sigrun: { a: [["Die Runen schweigen heute. Das ist auch eine Antwort.", "The runes are silent today. That is an answer too."], ["Du gehst wieder hinein. Das wusste ich, bevor du es wusstest.", "You are going back in. I knew before you did."], ["Ein Faden reißt, ein anderer hält. So ist es immer.", "One thread snaps, another holds. It is always so."]],
      n: [["Der Sonnenstein zeigt jeden Tag dieselbe Feste. Nur du bist jeden Tag ein anderer.", "The sunstone shows the same keep every day. Only you are different each day."]] },
    wendel: { a: [["Rex hat heute zweimal geknurrt. Einmal davon war ein Kompliment.", "Rex growled twice today. Once was a compliment."], ["Bestien sind ehrlich. Sie beißen, wenn sie beißen wollen.", "Beasts are honest. They bite when they want to bite."], ["Wer ein Wolfsrudel trennt, hat schon halb gewonnen. Wer es nicht schafft – rennt.", "Split a wolf pack and you've half won. Fail – and you run."]],
      n: [["Fremde Rudel in fremden Revieren – wenn das Verlies besetzt ist, stimmt die Ordnung nicht mehr.", "Strange packs in strange territory – when the dungeon is occupied, the order is broken."]] },
    jori: { a: [["Ich hab ein Schwert geschärft. Es ist jetzt kürzer. Ist das schlimm?", "I sharpened a sword. It's shorter now. Is that bad?"], ["Nundro hat genickt. Einmal. Ich glaube, das war Lob.", "Nundro nodded. Once. I think that was praise."], ["Der Amboss ist heiß. Ich weiß das jetzt sehr genau.", "The anvil is hot. I know that very precisely now."]],
      n: [["Hast du schon ins Zielbuch geschaut? Ich hab meins verloren. Also, ich hatte nie eins.", "Have you checked your book of goals? I lost mine. Well, I never had one."]] },
    lied: { a: [["Ein Held zog aus, ein Held kam heim, mal ohne Arm, doch nie allein.", "A hero went out, a hero came back, sometimes an arm short, but never off track."], ["Applaus ist auch eine Währung. Ich nehme ihn gern im Voraus.", "Applause is a currency too. I gladly take it in advance."], ["Heute singe ich leise. Das Publikum ist bewaffnet.", "I'll sing quietly today. The audience is armed."]],
      n: [["Der Zahlmeister zahlt, die Klinge mahnt – wer ihn erwischt, ist reich und erahnt.", "The paymaster pays, the blade reminds – who catches him, riches finds."]] },
    alwin: { a: [["Kapitel einundvierzig: Ezekiel kommt zurück. Schon wieder. Ich brauche mehr Tinte.", "Chapter forty-one: Ezekiel returns. Again. I need more ink."], ["Die Bosse lesen meine Bücher nicht. Das ist ihr Fehler.", "The bosses don't read my books. That's their mistake."], ["Ein guter Bericht braucht ein Ende. Du lieferst mir ständig Anfänge.", "A good chronicle needs an ending. You keep giving me beginnings."]],
      n: [["Ich führe jetzt Buch über deine Tagesprüfungen. Der Leser liebt Wiederholungen. Behauptet der Verleger.", "I now keep a record of your daily trials. Readers love repetition. Says the publisher."]] },
    lotte: { a: [["Alles hat seinen Preis. Manches hat zwei.", "Everything has a price. Some things have two."], ["Gold riecht nicht. Echo riecht es trotzdem.", "Gold doesn't smell. Echo smells it anyway."], ["Ich verkaufe keine Hoffnung. Die ist zu schwer zu liefern.", "I don't sell hope. Too hard to deliver."]],
      n: [["Eine Kriegskasse ganz für dich allein? Wenn du teilen willst – ich habe eine Tasche frei.", "A war chest all to yourself? If you feel like sharing – I've a bag free."]] },
    mira: { a: [["Ich zeichne die Feste jeden Abend neu. Sie zeichnet mich zurück.", "I redraw the keep every evening. It draws me back."], ["Du hast meine Seiten gefunden. Lies sie nicht laut vor. Bitte.", "You found my pages. Don't read them aloud. Please."], ["Die Fäden zittern, wenn du gehst. Das ist kein schlechtes Zeichen.", "The threads tremble when you leave. That's not a bad sign."]],
      n: [["Gezeichnete tragen das Fadenzeichen. Ich kenne es. Ich trug es auch.", "The marked bear the thread sign. I know it. I wore it too."]] }
  };
  function stimmen() {
    const R = Z.lager && Z.lager.RES; if (!R) return;
    const neuOk = (M().runs | 0) >= 2;
    for (const k in STIMMEN) {
      const r = R[k]; if (!r || !Array.isArray(r.idle)) continue;
      if (!r._w38a) { r._w38a = 1; for (const x of STIMMEN[k].a) r.idle.push(x); }
      if (neuOk && !r._w38n) { r._w38n = 1; for (const x of STIMMEN[k].n) r.idle.push(x); }
    }
  }
  try { stimmen(); } catch (e) { console.error("W38 Meta", e); }

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

  /* ======================= W38 Erfolge: für Gebietslagen, Tagesprüfung, Zielbuch und neue Bossmuster =======================
     Zählung nur beim Gastgeber/Einzelspieler, an einmaligen Ereignissen festgemacht (Lage-Lohn hängt am Level-Objekt, Rückweg
     zählt nichts doppelt; Tagesprüfung wird beim Laufende genau einmal gewertet). Zustand: Z.meta.w38erf (neuer Schlüssel).
     Zustandsbasierte Erfolge (Tagesverlauf, Meilensteine, Sammlung) vergibt abenteuer.js rückwirkend von selbst (achTick). */
  function EM() { const m = M(); let e = m.w38erf; if (!e || typeof e !== "object" || Array.isArray(e)) e = m.w38erf = {}; for (const k of ["lagen", "ges"]) if (!e[k] || typeof e[k] !== "object" || Array.isArray(e[k])) e[k] = {}; for (const k of ["schatz", "marks", "zahlRein"]) e[k] = +e[k] || 0; return e; }
  const TM = () => { const t = M().w38tag; return t && typeof t === "object" ? t : {}; };
  const tagDays = () => { const t = TM(), d = new Set((Array.isArray(t.hist) ? t.hist : []).filter(h => Array.isArray(h) && h[1] > 0 || Array.isArray(h) && h[2] > 0).map(h => h[0])); if (t.d && t.last) d.add(t.d); return d.size; };
  const tagBest = () => { const t = TM(); let b = +t.best || 0; for (const h of Array.isArray(t.hist) ? t.hist : []) if (Array.isArray(h)) b = Math.max(b, +h[1] || 0); return b; };
  const LAGEN4 = ["besetzt", "zahlmeister", "gezeichnet", "schatz"];
  const GES = ["glas", "gold", "durst", "blut", "eile", "besetzt", "schatz", "gezeichnet", "zahlmeister"];
  if (Z.CAPES) Object.assign(Z.CAPES, {
    lagekarte: Z.CAPES.lagekarte || { n: ["Lagekarte", "Situation Map"], c: ["#8a6a2a", "#2a1a10"] },
    sonnenstein: Z.CAPES.sonnenstein || { n: ["Sonnenstein", "Sunstone"], c: ["#e5b454", "#8a1a14"] },
    meilenstein: Z.CAPES.meilenstein || { n: ["Meilenstein", "Milestone"], c: ["#6a5a4a", "#c8902a"] }
  });
  const ERF = [
    { id: "w38_lage1", c: "erkunden", n: ["Lagekundig", "Situation Aware"], d: ["Den Lohn einer Gebietslage einstreichen (Kriegskasse, Soldkasse, Hort oder Schatz).", "Claim the reward of an area situation (war chest, payroll, hoard or treasure)."], ok: () => Object.keys(EM().lagen).length >= 1, r: { titel: ["der Lagekundige", "the Situation-Aware"] }, motiv: "karte", stufe: "silber" },
    { id: "w38_lagen", c: "erkunden", n: ["Herr der Lagen", "Master of Situations"], d: ["Jede der vier Lagen mit Ziel einmal meistern: Besetzt, Zahlmeister, Gezeichnete, Vergrabener Schatz.", "Master each of the four goal situations once: Occupied, Paymaster, Marked, Buried Treasure."], ok: () => LAGEN4.every(k => EM().lagen[k]), p: () => [LAGEN4.filter(k => EM().lagen[k]).length, 4], r: { cape: "lagekarte" }, motiv: "krone", stufe: "gold" },
    { id: "w38_schatz10", c: "erkunden", n: ["Schatzgräber", "Treasure Digger"], d: ["10 vergrabene Schätze ausgraben (insgesamt).", "Dig up 10 buried treasures (total)."], ok: () => EM().schatz >= 10, p: () => [EM().schatz, 10], r: { titel: ["Schatzgräber", "the Digger"] }, motiv: "truhe", stufe: "silber" },
    { id: "w38_zahlrein", c: "makellos", n: ["Sauber kassiert", "Clean Collection"], d: ["Die Soldkasse eines Zahlmeisters holen, ohne in diesem Gebiet vorher getroffen worden zu sein.", "Take a paymaster's payroll without having been hit in that area."], ok: () => EM().zahlRein >= 1, r: { titel: ["der Zahlmeister", "the Paymaster"] }, motiv: "muenze", stufe: "gold" },
    { id: "w38_tag1", c: "sammeln", n: ["Sonnenaufgang", "Sunrise"], d: ["Eine Tagesprüfung bis zur Wertung spielen.", "Play a daily trial until it is scored."], ok: () => tagDays() >= 1, p: () => [Math.min(1, tagDays()), 1], r: { titel: ["Frühaufsteher", "the Early Riser"] }, motiv: "stern", stufe: "silber" },
    { id: "w38_tag7", c: "sammeln", n: ["Sieben Sonnen", "Seven Suns"], d: ["An 7 verschiedenen Tagen eine Tagesprüfung werten lassen.", "Have a daily trial scored on 7 different days."], ok: () => tagDays() >= 7, p: () => [tagDays(), 7], r: { cape: "sonnenstein" }, motiv: "sanduhr", stufe: "gold" },
    { id: "w38_tag3000", c: "sammeln", n: ["Glanzleistung", "Shining Feat"], d: ["In einer Tagesprüfung 3.000 Punkte erreichen.", "Score 3,000 points in a daily trial."], ok: () => tagBest() >= 3000, p: () => [Math.min(tagBest(), 3000), 3000], r: { titel: ["der Strahlende", "the Radiant"] }, motiv: "sieg", stufe: "gold" },
    { id: "w38_gesetze", c: "sammeln", n: ["Gesetzeskundig", "Learned in Law"], d: ["Unter jedem der neun Tagesgesetze mindestens einmal gewertet werden.", "Be scored at least once under each of the nine laws of the day."], ok: () => GES.every(g => EM().ges[g]), p: () => [GES.filter(g => EM().ges[g]).length, GES.length], r: { titel: ["Gesetzeskundig", "Learned in Law"] }, motiv: "rune", stufe: "blut", selten: true },
    { id: "w38_voll", c: "sammeln", n: ["Vollständig", "Complete"], d: ["Eine Sammlung im Zielbuch (ab 8 Einträgen) vollständig machen.", "Complete a collection in the book of goals (8 entries or more)."], ok: () => stand().some(x => x.b >= 8 && x.a >= x.b), p: () => { const l = stand().filter(x => x.b >= 8); const b = l.sort((u, v) => v.a / v.b - u.a / u.b)[0]; return b ? [b.a, b.b] : [0, 1]; }, r: { titel: ["der Gründliche", "the Thorough"] }, motiv: "stern", stufe: "gold" },
    { id: "w38_meilen10", c: "sammeln", n: ["Meilensteinsammler", "Milestone Collector"], d: ["10 Meilensteine im Zielbuch abholen.", "Collect 10 milestones in the book of goals."], ok: () => n0(ZM().got) >= 10, p: () => [n0(ZM().got), 10], r: { cape: "meilenstein" }, motiv: "truhe", stufe: "gold" },
    { id: "w38_strahl", c: "bosse", n: ["Unter dem Strahl", "Beneath the Beam"], d: ["Den Wächter der Schmiede besiegen, ohne vom Runenstrahl getroffen zu werden.", "Defeat the Forge Warden without being hit by the Rune Beam."], ok: () => false, r: { titel: ["Runenducker", "the Rune Dodger"] }, motiv: "rune", stufe: "silber" },
    { id: "w38_hort", c: "bosse", n: ["Kühler Kopf", "Cool Head"], d: ["Themberchaud besiegen, ohne in der letzten Phase („Der Hort schmilzt“) getroffen zu werden.", "Defeat Themberchaud without being hit in the final phase ('The Hoard Melts')."], ok: () => false, r: { titel: ["Hortbrecher", "Hoardbreaker"] }, motiv: "flamme", stufe: "gold", selten: true }
  ];
  for (const a of ERF) { a.kat = a.c; a.siegel = { motiv: a.motiv, stufe: a.stufe, band: true }; }
  function addErf() { if (!Z.ACH) return; for (const a of ERF) if (!Z.ACH.some(x => x.id === a.id)) Z.ACH.push(a); }
  addErf();
  /* Zählung: Lage-Lohn (einmal je Level-Objekt), Gezeichnete, saubere Soldkasse */
  const hu0 = Z.hurtPlayer;
  let bossF = null;
  Z.hurtPlayer = function (d, o) {
    const P = Z.player, hp0 = P ? P.hp : 0;
    const r = hu0.apply(this, arguments);
    try {
      if (P && P.hp < hp0 - 0.01 && !gast() && !rausch()) {
        const lv = Z.level, lg = lv && lv.w38; if (lg && lg.k === "zahlmeister" && !lg.paid) lg.w38hurt = true;
        const b = Z.boss; if (b && !b.dead && bossF && bossF.b === b) { if (b.id === "schmiedewaechter" && b.mv && b.mv.id === "strahl") bossF.strahl = true; if (b.id === "themberchaud" && (b.phase | 0) >= 3) bossF.hort = true; }
      }
    } catch (e) { console.error("W38 Erfolge", e); }
    return r;
  };
  function erfTick() {
    if (gast() || rausch() || !Z.run) return;
    const lv = Z.level, lg = lv && lv.w38, E = EM();
    if (lg) {
      if (lg.k === "gezeichnet") { const g = lg.got | 0, done = lg.w38gotZ | 0; if (g > done) { E.marks += g - done; lg.w38gotZ = g; Z.saveMeta(); } }
      if (lg.paid && !lg.w38erf) {
        lg.w38erf = true; E.lagen[lg.k] = (E.lagen[lg.k] | 0) + 1;
        if (lg.k === "schatz") E.schatz++;
        if (lg.k === "zahlmeister" && !lg.w38hurt) E.zahlRein++;
        Z.saveMeta();
      }
    }
    const b = Z.boss;
    if (b && (b.id === "schmiedewaechter" || b.id === "themberchaud") && (!bossF || bossF.b !== b)) bossF = { b, strahl: false, hort: false };
    if (bossF && bossF.b === b && (b.dead || Z.bossDefeated) && !bossF.done) {
      bossF.done = true;
      const fair = !(Z.run.gnade || (Z.run._a && Z.run._a.gnade));
      if (fair && b.id === "schmiedewaechter" && !bossF.strahl && Z.grantAch) Z.grantAch("w38_strahl");
      if (fair && b.id === "themberchaud" && !bossF.hort && Z.grantAch) Z.grantAch("w38_hort");
    }
  }
  /* Tagesgesetze beim Laufende vermerken (abwechslung.js wertet in Z.backToCamp genau einmal) */
  const btc0 = Z.backToCamp;
  Z.backToCamp = function () {
    const tg = Z.run && Z.run.w38tag;
    const r = btc0.apply(this, arguments);
    try { if (tg && tg.fertig && !tg.w38ges && !gast()) { tg.w38ges = true; const E = EM(); for (const g of tg.rules || []) if (GES.includes(g)) E.ges[g] = 1; Z.saveMeta(); } } catch (e) { console.error("W38 Erfolge", e); }
    return r;
  };
  const etk0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) { if (etk0) etk0.apply(this, arguments); try { erfTick(); } catch (e) { console.error("W38 Erfolge", e); } };

  Z.ziele = { erfolge: () => ERF.map(a => [a.id, !!(M().ach || {})[a.id]]), erfStand: () => JSON.parse(JSON.stringify(EM())), stand: () => stand().map(x => [x.s.id, x.a, x.b]), offen: () => offen().map(o => [o.key, o.r]), naechste: () => naechste().map(x => [x.a.id, x.cur, x.max]), open, abholen, stationen: () => stationen().map(s => [Math.round(s.o.x / T), s.lab, s.neu]), hingehen };
})();
