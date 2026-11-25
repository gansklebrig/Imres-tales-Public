/* Ezekiel – The Destroyer · Bossrausch (W21)
   Freigeschaltet, sobald mindestens 3 verschiedene Bosse/Wächter besiegt sind: Kriegshorn im Lager (neben dem Kartentisch) und
   Knopf auf der Weltkarte. Alle bisher besiegten Bosse und Wächter nacheinander (nach Stufe), jeder in seiner Arena; Wächter, die in
   der Kampagne in einem Raum ihres Gebiets kämpfen, bekommen für den Rausch eine Arena aus welt.js genArena mit dem Aussehen ihres Gebiets
   (vorübergehende Einträge Z.ARENAS["br_<gebiet>"], nach dem Rausch wieder entfernt). Boss-Verhalten und -Werte bleiben unberührt
   (bosse.js, bossphasen.js, spiel.js startBoss/bossDefeated laufen wie immer).
   Zwischen zwei Kämpfen eine Ruhe-Kammer (Durchgang ohne Händler, Brunnen und Altar): +30 % Leben, +1 Trank und eine Wahl aus
   2–3 Segen/Verbesserungen.
   Fairness: Ausrüstung nur aus festen Paketen (nach Spielfortschritt freigeschaltet), Waffenstufe = Stufe der Arena, Schriftrollen-Werte
   nach Stufe; Schmiede-Stufen, Lager-Verbesserungen, Fundglück, Pakte und Schädel zählen nicht. Beute der Bosse wird nicht ausgelegt.
   Keine Meta-Ausbeute: während des Rauschs arbeitet das Spiel auf einer Kopie von Z.meta (Sandkasten); Z.saveMeta speichert in der Zeit
   den echten Stand unverändert. Splitter, Glut, Gold, Erfolge, Nemesis, Lagerrekorde usw. aus dem Rausch verfallen mit der Kopie.
   Ins echte Z.meta.bossrausch (je Spielstand) kommen nur: Läufe, Siege, Bestzeit je Anzahl Bosse, weitester Fortschritt, letzter Rausch –
   dazu eigene Erfolge mit Umhängen/Titeln (rein kosmetisch).
   Abbrechen jederzeit: Pausenmenü „Lauf abbrechen“, Ruhe-Kammer „Rausch abbrechen“. Prüfhilfe: Z.bossrausch.
   Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, A = Z.audio, L = v => Z.L(v), FX = Z.fx;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const fmt = s => (Z.weltkarte ? Z.weltkarte.fmt(s) : Math.round(s || 0) + " s");
  const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII"];
  const MIN = 3;

  /* ======================= Bosse und Arenen ======================= */
  const KIND = { schlund: "lab", schmiede: "lab", zinnen: "tower", see: "pier", glut: "lab", sturm: "tower" };
  const ROWO = id => (Z.weltkarte && Z.weltkarte.ROW[id] != null ? Z.weltkarte.ROW[id] : 1);
  function alle() {
    const out = [];
    for (const id in Z.BIOMES) { const b = Z.BIOMES[id]; if (b.warden) out.push({ boss: b.warden, area: "br_" + id, base: id, tier: b.tier || 0, warden: true, ord: ROWO(id) }); }
    for (const id in Z.ARENAS) { const a = Z.ARENAS[id]; if (!a || a.w21 || !a.boss) continue; out.push({ boss: a.boss, area: id, base: a.base, tier: a.tier || 0, warden: false, ord: ROWO(id) }); }
    out.sort((a, b) => a.tier - b.tier || b.ord - a.ord);
    return out;
  }
  const realMeta = () => (RS ? RS.real : Z.meta) || {};
  const besiegt = () => { const B = realMeta().bosses || {}; return alle().filter(s => B[s.boss] && B[s.boss].won > 0); };
  const frei = () => besiegt().length >= MIN;
  const bossName = b => (Z.BOSSDEF && Z.BOSSDEF[b] && Z.BOSSDEF[b].n ? L(Z.BOSSDEF[b].n) : b);
  function regArenen(stages) {
    for (const s of stages) if (s.warden && Z.BIOMES[s.base]) Z.ARENAS[s.area] = { tier: s.tier, boss: s.boss, name: Z.BIOMES[s.base].name, base: s.base, exits: [], music: "boss1", w: 46, h: 18, kind: KIND[s.base] || "lab", w21: true };
  }
  function wegArenen() { for (const k of Object.keys(Z.ARENAS)) if (Z.ARENAS[k] && Z.ARENAS[k].w21) delete Z.ARENAS[k]; }

  /* ======================= Ausrüstungspakete ======================= */
  const PAKETE = [
    { id: "klinge", ab: 0, n: ["Klinge & Bogen", "Blade & Bow"], fokus: "brut", rar: 1, a1: "kurzschwert", a2: "jagdbogen", s1: "sprengphiole", s2: "baerenfalle" },
    { id: "wall", ab: 0, n: ["Schild & Hellebarde", "Shield & Halberd"], fokus: "ueber", rar: 1, a1: "hellebarde", a2: "turmschild", s1: "kristall", s2: "kraeuter" },
    { id: "schatten", ab: 5, n: ["Schatten & Messer", "Shadow & Knives"], fokus: "takt", rar: 1, a1: "schattendolch", a2: "wurfmesser", s1: "rauchbombe", s2: "blendgranate" },
    { id: "darkin", ab: 7, n: ["Darkin-Blut", "Darkin Blood"], fokus: "brut", rar: 2, a1: "sicheln", a2: "blutschild", s1: "darkinzorn", s2: "pfeilhagel" },
    { id: "donner", ab: 10, n: ["Glut & Donner", "Ember & Thunder"], fokus: "takt", rar: 2, a1: "glutaxt", a2: "blitzstab", s1: "brandtopf", s2: "donnerkeil" }
  ].filter(p => [p.a1, p.a2].every(id => Z.WEAPONS[id]) && [p.s1, p.s2].every(id => Z.SKILLS[id]));
  const itemN = id => { const d = Z.WEAPONS[id] || Z.SKILLS[id]; return d ? L(d.n) : id; };

  /* ======================= Erfolge & Umhänge (kosmetisch) ======================= */
  if (Z.CAPES) Object.assign(Z.CAPES, {
    rausch: { n: ["Bossrausch", "Boss Rush"], c: ["#a0241a", "#e5b454"] },
    rauschgold: { n: ["Trophäengold", "Trophy Gold"], c: ["#e5b454", "#5a1a0e"] }
  });
  const ACHS = [
    { id: "br_erster", c: "bosse", n: ["Rauschhaft", "Rush of Blood"], d: ["Einen Bossrausch vollständig bestehen.", "Complete a boss rush."], ok: () => false, r: { cape: "rausch" } },
    { id: "br_fuenf", c: "bosse", n: ["Fünf in einem Atemzug", "Five in One Breath"], d: ["Einen Bossrausch mit mindestens 5 Bossen bestehen.", "Complete a boss rush with at least 5 bosses."], ok: () => false, r: { titel: ["der Unermüdliche", "the Tireless"] } },
    { id: "br_schnell", c: "bosse", n: ["Rauschzeit", "Rush Hour"], d: ["Einen Bossrausch bestehen – im Schnitt unter 75 Sekunden je Boss.", "Complete a boss rush averaging under 75 seconds per boss."], ok: () => false, r: { titel: ["der Rasende Jäger", "the Racing Hunter"] } },
    { id: "br_alle", c: "bosse", n: ["Alle Fäden reißen", "Every Thread Snaps"], d: ["Einen Bossrausch mit allen Bossen und Wächtern bestehen.", "Complete a boss rush with every boss and warden."], ok: () => false, r: { cape: "rauschgold" } }
  ];
  if (Z.ACH) for (const a of ACHS) if (!Z.ACH.find(x => x.id === a.id)) Z.ACH.push(a);

  /* ======================= Zustand ======================= */
  let RS = null, inSwap = false;
  function BR(m) {
    m = m || Z.meta; let b = m.bossrausch; if (!b || typeof b !== "object" || Array.isArray(b)) b = m.bossrausch = {};
    if (!b.best || typeof b.best !== "object") b.best = {};
    return b;
  }
  function hooks() { inSwap = true; try { for (const fn of Z._slotSwap || []) { try { fn(Z.slots ? Z.slots.active() : 1); } catch (e) { console.error(e); } } } finally { inSwap = false; } }
  if (Z.slots && Z.slots.onSwap) Z.slots.onSwap(() => { if (RS && !inSwap) { Z.saveMeta = RS.origSave; RS = null; wegArenen(); hud(false); } });

  function start(pid) {
    if (RS || !Z.level || !Z.level.hub || !frei()) return false;
    const pk = PAKETE.find(p => p.id === pid) || PAKETE[0];
    if ((pk.ab || 0) > besiegt().length) return false;
    const stages = besiegt();
    if (Z.ui && Z.ui.modalOpen) Z.ui.close();
    const real = Z.meta; try { Z.saveMeta(); } catch (_) {}
    const sand = JSON.parse(JSON.stringify(real));
    sand.wlvl = {}; sand.forge = {}; sand.luck = {}; sand.up = { trank: 0, zaeh: 0, klingen: 0, haendler: 0 }; sand.skullSel = 0; sand.pactSel = [];
    sand.ach = Object.assign({}, sand.ach || {}); for (const a of Z.ACH || []) if (!sand.ach[a.id]) sand.ach[a.id] = 1; /* keine Erfolgs-Meldungen aus dem Sandkasten */
    const origSave = Z.saveMeta;
    RS = { real, sand, origSave, stages, i: 0, pk, zeit: 0, st: 0, splits: [], bonus: { brut: 0, takt: 0, ueber: 0 }, pot: 0, phase: "anreise", wait: 0, t0: Date.now(), ende: null, hudT: 0 };
    Z.saveMeta = function () { const cur = Z.meta; Z.meta = RS ? RS.real : cur; try { return origSave.apply(this, arguments); } finally { Z.meta = cur; } };
    Z.meta = sand; hooks();
    regArenen(stages);
    Z.newRun(); Z.run.w21rausch = true; Z.run.skulls = 0; Z.run.rausch = true;
    A && A.play && A.play("horn", { vol: 0.6 });
    const go = () => { try { Z.loadArea(stages[0].area); } catch (e) { console.error("bossrausch", e); abbruchStill(); } };
    if (Z.ui && Z.ui.fade) Z.ui.fade(go); else go();
    return true;
  }
  /* Sandkasten verwerfen, echten Stand zurück, Ergebnis eintragen */
  function finish(kind, still) {
    if (!RS) return null;
    const S = RS; RS = null;
    Z.saveMeta = S.origSave; Z.meta = S.real; hooks(); wegArenen(); hud(false);
    if (Z.run) Z.run.w21rausch = true;
    const N = S.stages.length, k = S.splits.length, b = BR(S.real), neu = { rekord: false, ach: [] };
    b.n = (b.n | 0) + 1;
    if (kind === "sieg") {
      b.siege = (b.siege | 0) + 1;
      const t = Math.round(S.zeit * 10) / 10;
      if (!b.best[N] || t < b.best[N]) { neu.rekord = !!b.best[N]; neu.erst = !b.best[N]; b.best[N] = t; }
    }
    b.weit = Math.max(b.weit | 0, k);
    b.last = { e: kind, k, N, t: Math.round(S.zeit * 10) / 10, pk: S.pk.id, splits: S.splits.map(s => [s.boss, Math.round(s.t * 10) / 10]) };
    S.real.spielzeit = (+S.real.spielzeit || 0) + Math.round((Date.now() - S.t0) / 1000);
    try { Z.saveMeta(); } catch (_) {}
    if (!still && kind === "sieg" && Z.grantAch) {
      const want = ["br_erster"]; if (N >= 5) want.push("br_fuenf"); if (S.zeit / Math.max(1, N) < 75) want.push("br_schnell"); if (N >= alle().length) want.push("br_alle");
      for (const id of want) if (!(S.real.ach || {})[id]) { Z.grantAch(id); neu.ach.push(id); }
    }
    return neu;
  }
  function abbruchStill() { if (RS) finish("abbruch", true); }

  /* ======================= Ablauf ======================= */
  function loadout(first) {
    const P = Z.player, pk = RS.pk, tier = (Z.run && Z.run.tier) || 0;
    const mk = (id, n) => (id ? Z.makeItem(id, tier, pk.rar, Z.Rng(7919 + n * 131 + id.length * 17)) : null);
    P.slots.a1 = mk(pk.a1, 1); P.slots.a2 = mk(pk.a2, 2); P.slots.s1 = mk(pk.s1, 3); P.slots.s2 = mk(pk.s2, 4);
    const tot = tier * 2, main = Math.ceil(tot / 2), rest = tot - main, o = ["brut", "takt", "ueber"].filter(s => s !== pk.fokus);
    P.stats = { brut: 0, takt: 0, ueber: 0 }; P.stats[pk.fokus] = main; P.stats[o[0]] = Math.ceil(rest / 2); P.stats[o[1]] = Math.floor(rest / 2);
    for (const s in RS.bonus) P.stats[s] += RS.bonus[s];
    P.potMax = 3 + RS.pot;
    Z.recalcPlayer();
    if (first) { P.hp = P.hpMax; P.potions = P.potMax; P.gold = 0; P.shards = 0; }
    P.cd = { s1: 0, s2: 0 };
  }
  function onArea(id) {
    const lv = Z.level; if (!RS || !lv) return;
    if (lv.arena) {
      const s = RS.stages[RS.i];
      loadout(RS.i === 0 && RS.phase === "anreise");
      RS.phase = "kampf"; RS.st = 0; Z.interacts = [];
      hud(true);
      if (s && s.area !== id) console.warn("bossrausch: unerwartete Arena", id, s.area);
    } else if (lv.passage) {
      lv.props = lv.props.filter(p => p.kind !== "station"); lv.shop = []; lv.blessTaken = true; lv.fountainUsed = true; lv.blessOffer = [];
      Z.interacts = []; RS.phase = "ruhe"; hud(true);
      setTimeout(() => { if (RS && Z.level === lv) ruhe(); }, 650);
    }
  }
  function weiter() {
    if (!RS) return;
    if (RS.i >= RS.stages.length) return ergebnis("sieg");
    const next = RS.stages[RS.i], from = Z.level ? Z.level.id : "";
    const go = () => { if (RS && !(Z.player && Z.player.dead)) Z.loadArea("passage", { from, to: next.area }); }; /* W26 Erstspieler: in der Überblendung gestorben → nicht mit 0 LP weiter */
    if (Z.ui && Z.ui.fade) Z.ui.fade(go); else go();
  }
  /* Ruhe-Kammer */
  function ruhe() {
    if (!RS || !Z.ui) return;
    const P = Z.player; if (!P || P.dead) return;
    if (!RS.geheilt) { RS.geheilt = Z.level; Z.healPlayer(P.hpMax * 0.3); P.potions = Math.min(P.potMax, P.potions + 1); A && A.play && A.play("potion", { vol: 0.5 }); }
    const SN = { brut: ["Brutalität", "Brutality"], takt: ["Taktik", "Tactics"], ueber: ["Überleben", "Survival"] };
    const ch = [];
    if (P.bless.length < 3 && Z.BLESS) for (const b of Z.R.shuffle(Object.keys(Z.BLESS).filter(b => !P.bless.includes(b))).slice(0, 2)) ch.push({ k: "segen|" + b, n: L(Z.BLESS[b].n), d: L(Z.BLESS[b].d), i: "✦" });
    const ups = [
      { k: "rolle|" + RS.pk.fokus, n: L(["Schriftrolle: ", "Scroll: "]) + L(SN[RS.pk.fokus]), d: L(["+2 für den Rest des Rauschs", "+2 for the rest of the rush"]), i: "📜" },
      { k: "trank", n: L(["Tiefer Trankgürtel", "Deep Potion Belt"]), d: L(["+1 Trank-Platz und sofort gefüllt", "+1 potion slot, filled at once"]), i: "⚗" },
      { k: "heil", n: L(["Lange Rast", "Long Rest"]), d: L(["weitere 40 % Leben zurück", "another 40% health back"]), i: "✚" }
    ];
    while (ch.length < 3 && ups.length) ch.push(ups.splice(ch.length === 2 ? 0 : Math.floor(Z.R() * ups.length), 1)[0]);
    const next = RS.stages[RS.i], done = RS.i, N = RS.stages.length;
    const html = "<h2>" + esc(L(["Ruhe-Kammer", "Resting Chamber"])) + "<small>" + esc(done + "/" + N + " " + L(["Bosse", "bosses"]) + " · " + fmt(RS.zeit)) + "</small></h2>" +
      '<p class="br21-unter">' + esc(L(["+30 % Leben und ein Trank. Wähle eine Gabe – dann weiter durch die Tür.", "+30% health and a potion. Pick a gift – then on through the door."])) + "</p>" +
      (next ? '<p class="br21-naechst">' + esc(L(["Als Nächstes: ", "Next: "])) + "<b>" + esc(bossName(next.boss)) + "</b> · " + esc(Z.areaName(next.area)) + " · " + L(["Stufe ", "Tier "]) + ROMAN[next.tier] + "</p>" : "") +
      '<div class="br21-wahl">' + ch.map((c, i) => '<button data-act="br21Wahl" data-arg="' + esc(c.k) + '"' + (i === 0 ? " autofocus" : "") + "><i>" + c.i + "</i><b>" + esc(c.n) + "</b><small>" + esc(c.d) + "</small></button>").join("") + "</div>" +
      '<div class="knoepfe"><button data-act="br21Weiter">' + esc(L(["Ohne Gabe weiter", "Move on without a gift"])) + '</button><button data-act="br21Ab" class="gefahr">' + esc(L(["Rausch abbrechen", "Abandon the rush"])) + "</button></div>";
    Z.ui.open(html, { cls: "schmal br21box" });
  }
  function wahl(k) {
    if (!RS) return; const P = Z.player; const [t, a] = String(k).split("|");
    if (t === "segen" && Z.BLESS && Z.BLESS[a] && P.bless.length < 3) { P.bless.push(a); Z.recalcPlayer(); }
    else if (t === "rolle" && RS.bonus[a] != null) { RS.bonus[a] += 2; P.stats[a] += 2; Z.recalcPlayer(); }
    else if (t === "trank") { RS.pot++; P.potMax++; P.potions = P.potMax; }
    else if (t === "heil") Z.healPlayer(P.hpMax * 0.4);
    A && A.play && A.play("holy", { vol: 0.5 });
    Z.ui.close();
    const next = RS.stages[RS.i];
    if (next) Z.toast("<b>" + esc(L(["Die Tür führt zu: ", "The door leads to: "]) + bossName(next.boss)) + "</b>", 2600);
  }

  /* Ergebnis (Sieg, Tod, Abbruch) */
  function ergebnis(kind) {
    if (!RS || RS.ende) return; RS.ende = kind; hud(false);
    const S = RS, N = S.stages.length, k = S.splits.length, b = BR(S.real), alt = b.best[N];
    const sieg = kind === "sieg", t = Math.round(S.zeit * 10) / 10;
    const rek = sieg && (!alt || t < alt);
    let h = '<h2 class="ende br21-kopf ' + (sieg ? "sieg" : "tod") + '">' + esc(L(sieg ? ["Bossrausch bestanden!", "Boss Rush complete!"] : kind === "tod" ? ["Im Rausch gefallen", "Fallen in the rush"] : ["Rausch abgebrochen", "Rush abandoned"])) + "</h2>";
    h += '<p class="br21-unter">' + esc(k + "/" + N + " " + L(["Bosse besiegt", "bosses beaten"]) + " · " + L(["Kampfzeit ", "fight time "]) + fmt(S.zeit) + " · " + L(S.pk.n)) + "</p>";
    h += '<table class="br21-tab"><tr><th>#</th><th>' + esc(L(["Boss", "Boss"])) + "</th><th>" + esc(L(["Arena", "Arena"])) + "</th><th>" + esc(L(["Zeit", "Time"])) + "</th></tr>";
    S.stages.forEach((s, i) => { const sp = S.splits[i]; h += "<tr" + (sp ? "" : ' class="offen"') + "><td>" + (i + 1) + "</td><td>" + esc(bossName(s.boss)) + "</td><td>" + esc(Z.areaName(s.area)) + "</td><td>" + (sp ? fmt(sp.t) : i === k && kind === "tod" ? "☠" : "–") + "</td></tr>"; });
    h += "</table>";
    h += '<p class="br21-best">' + esc(L(["Bestzeit mit ", "Best time with "]) + N + L([" Bossen: ", " bosses: "])) + "<b>" + (rek ? fmt(t) : alt ? fmt(alt) : "–") + "</b>" +
      (rek ? ' <span class="br21-neu">✦ ' + esc(L(alt ? ["Neue Bestzeit!", "New best time!"] : ["Erste Bestzeit!", "First best time!"])) + "</span>" + (alt ? " <small>(" + esc(L(["vorher ", "before "]) + fmt(alt)) + ")</small>" : "") : "") + "</p>";
    h += '<p class="hinweis">' + esc(L(["Splitter, Glut und Gold aus dem Rausch bleiben im Rausch – der Lohn sind Bestzeiten, Umhänge und Erfolge.", "Shards, embers and gold from the rush stay in the rush – the rewards are best times, capes and achievements."])) + "</p>";
    h += '<div class="knoepfe"><button data-act="br21Ende" data-arg="' + kind + '" autofocus>' + esc(L(["Zurück ins Lager", "Back to the camp"])) + "</button></div>";
    if (Z.ui.clearQueue) Z.ui.clearQueue();
    Z.ui.open(h, { cls: "br21box br21-erg", noEsc: true, force: true });
  }

  /* ======================= Takt (Spielzeit) ======================= */
  const bt0 = Z.bilanzTick;
  Z.bilanzTick = function (dt) {
    if (bt0) bt0.apply(this, arguments);
    if (!RS || !Z.run || !Z.run.w21rausch) return;
    try {
      const lv = Z.level, P = Z.player; if (!lv || !P) return;
      for (let i = Z.pickups.length - 1; i >= 0; i--) { const p = Z.pickups[i]; if (p && (p.kind === "item" || p.kind === "food" || p.kind === "scroll" || p.kind === "chest" || p.kind === "cursed")) Z.pickups.splice(i, 1); }
      if (lv.arena && RS.phase === "kampf") {
        if (!P.dead) { RS.zeit += dt; RS.st += dt; }
        if (Z.bossDefeated && !P.dead) { const s = RS.stages[RS.i]; RS.splits.push({ boss: s ? s.boss : "?", t: RS.st }); RS.i++; RS.phase = "sieg"; RS.wait = 3.4; RS.geheilt = null; }
      } else if (RS.phase === "sieg") {
        RS.wait -= dt;
        if (RS.wait <= 0 && !P.dead) { RS.phase = "weiter"; weiter(); }
      }
      RS.hudT -= dt; if (RS.hudT <= 0) { RS.hudT = 0.2; hudText(); }
    } catch (e) { console.error("bossrausch", e); }
  };

  /* ======================= Hüllen um Spielablauf ======================= */
  const load0 = Z.loadArea;
  Z.loadArea = function (id) {
    if (RS && id === "lager") abbruchStill(); /* Notbremse: zurück ins Lager beendet den Rausch immer */
    const r = load0.apply(this, arguments);
    try { const lv = Z.level; if (RS && Z.run && Z.run.w21rausch) onArea(id); else if (lv && lv.hub) placeCamp(lv); else camp = null; } catch (e) { console.error("bossrausch", e); }
    return r;
  };
  const back0 = Z.backToCamp;
  Z.backToCamp = function () { if (RS) finish(RS.ende || "abbruch", !RS.ende); return back0.apply(this, arguments); };
  function wireUI() {
    if (!Z.ui || !Z.ui.ending || !Z.ui.deathScreen || !Z.ui.actions) return setTimeout(wireUI, 50);
    const end0 = Z.ui.ending;
    Z.ui.ending = function () { if (RS) return; return end0.apply(this, arguments); }; /* Endbosse im Rausch: kein Abspann, weiter geht's */
    const ds0 = Z.ui.deathScreen;
    Z.ui.deathScreen = function (o) { if (RS) return ergebnis(o && o.abort ? "abbruch" : "tod"); return ds0.apply(this, arguments); };
    if (Z.ui.toTitle) { const tt0 = Z.ui.toTitle; Z.ui.toTitle = function () { abbruchStill(); return tt0.apply(this, arguments); }; }
    const act = Z.ui.actions;
    act.br21Menu = () => { Z.ui.close(); setTimeout(menu, 40); };
    act.br21Los = pid => start(pid);
    act.br21Wahl = k => wahl(k);
    act.br21Weiter = () => Z.ui.close();
    act.br21Ab = () => { Z.ui.close(); setTimeout(() => ergebnis("abbruch"), 30); };
    act.br21Ende = kind => { Z.ui.clearQueue && Z.ui.clearQueue(); Z.ui.close(); const neu = finish(kind || "abbruch"); Z.backToCamp(); return neu; };
  }
  wireUI();

  /* ======================= Menü am Kriegshorn ======================= */
  function menu() {
    if (!Z.ui) return;
    const st = besiegt(), n = st.length, B = BR(realMeta());
    let h = "<h2>" + esc(L(["Bossrausch", "Boss Rush"])) + "<small>" + esc(L(["Kriegshorn des Lagers", "The camp's war horn"])) + "</small></h2>";
    if (n < MIN) {
      h += "<p>" + esc(L(["Das Horn schweigt noch. Besiege mindestens drei verschiedene Bosse oder Wächter in der Feste.", "The horn is still silent. Defeat at least three different bosses or wardens in the keep."])) + "</p><p class='br21-best'><b>" + n + "/" + MIN + "</b></p>";
      h += '<div class="knoepfe"><button data-act="close" autofocus>' + esc(L(["Zurück", "Back"])) + "</button></div>";
      return Z.ui.open(h, { cls: "schmal br21box" });
    }
    h += '<p class="br21-unter">' + esc(L(["Alle besiegten Bosse und Wächter nacheinander, jeder in seiner Arena. Dazwischen eine Ruhe-Kammer. Ausrüstung nur aus festen Paketen – Schmiede, Lagerwaren und Schädel zählen hier nicht. Splitter und Glut bleiben im Rausch; der Lohn sind Bestzeiten, Umhänge und Erfolge.",
      "Every boss and warden you have beaten, one after another, each in its arena. A resting chamber in between. Gear only from fixed kits – forge, camp wares and skulls don't count here. Shards and embers stay in the rush; the rewards are best times, capes and achievements."])) + "</p>";
    h += '<p class="br21-folge">' + st.map((s, i) => "<span>" + (i + 1) + ". " + esc(bossName(s.boss)) + " <small>" + ROMAN[s.tier] + "</small></span>").join("") + "</p>";
    const best = Object.keys(B.best || {}).sort((a, b) => b - a);
    h += '<p class="br21-best">' + esc(L(["Bestzeiten: ", "Best times: "])) + (best.length ? best.map(k => "<b>" + k + " " + esc(L(["Bosse", "bosses"])) + "</b> " + fmt(B.best[k])).join(" · ") : "–") +
      (B.n ? " · " + esc(L(["Rausch-Läufe ", "Rush runs "]) + B.n + " · " + L(["bestanden ", "completed "]) + (B.siege | 0)) : "") + "</p>";
    h += "<h3>" + esc(L(["Ausrüstung wählen und los", "Choose gear and go"])) + '</h3><div class="br21-pakete">';
    PAKETE.forEach((p, i) => {
      const zu = (p.ab || 0) > n;
      h += '<button data-act="br21Los" data-arg="' + p.id + '"' + (zu ? " disabled" : "") + (i === 0 ? " autofocus" : "") + "><b>" + esc(L(p.n)) + "</b><small>" + (zu ? "🔒 " + esc(L(["ab ", "from "]) + p.ab + L([" besiegten Bossen", " beaten bosses"])) : esc([p.a1, p.a2, p.s1, p.s2].map(itemN).join(" · "))) + "</small></button>";
    });
    h += '</div><div class="knoepfe"><button data-act="close">' + esc(L(["Zurück", "Back"])) + "</button></div>";
    Z.ui.open(h, { cls: "br21box" });
  }
  /* Knopf für die Weltkarte */
  function knopf() {
    const n = besiegt().length;
    return n >= MIN ? '<button data-act="br21Menu">⚔ ' + esc(L(["Bossrausch", "Boss Rush"])) + "</button>" : '<button disabled title="' + esc(L(["Ab 3 besiegten Bossen", "From 3 beaten bosses"])) + '">🔒 ' + esc(L(["Bossrausch", "Boss Rush"])) + " " + n + "/" + MIN + "</button>";
  }

  /* ======================= Kriegshorn im Lager ======================= */
  let camp = null;
  function placeCamp(lv) {
    camp = null; if (!frei()) return;
    const base = lv.lcore && Number.isFinite(lv.lcore.stone) ? lv.lcore.stone : (lv.start ? lv.start.x - 12 : 40);
    const x = (base + 4.5) * T + 8, y = 12 * T;
    camp = { lv, x, y };
    (Z.interacts = Z.interacts || []).push({ x, y, r: 13, h: 34, w21: "horn", label: () => L(["Kriegshorn · Bossrausch", "War horn · boss rush"]), use: () => menu() });
  }
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (wp0) wp0.apply(this, arguments);
    try { const lv = Z.level; if (camp && lv && lv.hub && camp.lv === lv) drawHorn(c, camp.x, camp.y, t); } catch (e) { if (!dErr) { dErr = 1; console.error(e); } }
  };
  let dErr = 0;
  function drawHorn(c, x, y, t) {
    const cam = Z.cam; if (cam && (x < cam.x - 40 || x > cam.x + cam.w + 40)) return;
    c.save();
    c.globalAlpha = 0.25; c.fillStyle = "#000"; c.beginPath(); c.ellipse(x, y + 0.5, 7, 1.5, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.fillStyle = "#3e2816"; c.fillRect(x - 1.2, y - 30, 2.4, 30); c.fillRect(x - 7, y - 29, 14, 2); c.fillStyle = "#5a3a20"; c.fillRect(x - 1.2, y - 30, 1, 30);
    /* Wimpel */
    const sw = Math.sin(t * 2.2) * (lo() ? 0 : 1.2);
    c.fillStyle = "#8a1a14"; c.beginPath(); c.moveTo(x + 1.2, y - 30); c.lineTo(x + 9 + sw, y - 27.5); c.lineTo(x + 1.2, y - 25); c.closePath(); c.fill();
    /* Horn an zwei Schnüren */
    c.strokeStyle = "#2a1a10"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - 5.5, y - 27); c.lineTo(x - 5, y - 21); c.moveTo(x + 5.5, y - 27); c.lineTo(x + 4.5, y - 20.5); c.stroke();
    c.fillStyle = "#e8dcc0"; c.beginPath(); c.moveTo(x - 7, y - 22.5); c.quadraticCurveTo(x, y - 16, x + 7.5, y - 23.5); c.lineTo(x + 8.2, y - 19.2); c.quadraticCurveTo(x, y - 13.5, x - 7, y - 20.6); c.closePath(); c.fill();
    c.fillStyle = "#6a4a2a"; c.fillRect(x - 2.6, y - 19.6, 1.4, 3); c.fillRect(x + 2.4, y - 20, 1.4, 3);
    c.fillStyle = "#c8902a"; c.beginPath(); c.ellipse(x + 7.9, y - 21.4, 1.1, 2.3, -0.3, 0, Math.PI * 2); c.fill();
    if (!lo()) { c.globalCompositeOperation = "lighter"; Z.draw && Z.draw.glow && Z.draw.glow(c, x + 7.9, y - 21.4, 6 + Math.sin(t * 3) * 1.5, "rgba(255,120,60,.28)"); }
    c.restore();
  }

  /* ======================= Anzeige während des Rauschs ======================= */
  let hudEl = null;
  function hud(on) {
    if (!hudEl) { hudEl = document.createElement("div"); hudEl.id = "br21hud"; hudEl.hidden = true; document.body.appendChild(hudEl); }
    hudEl.hidden = !on; if (on) hudText();
  }
  function hudText() {
    if (!hudEl || !RS) return;
    const k = Math.min(RS.stages.length, RS.i + (RS.phase === "kampf" ? 1 : 0)), s = "⚔ " + L(["Bossrausch ", "Boss Rush "]) + k + "/" + RS.stages.length + " · " + fmt(RS.zeit);
    if (hudEl.textContent !== s) hudEl.textContent = s;
  }

  /* ======================= Stil ======================= */
  const css = document.createElement("style");
  css.textContent = [
    "#br21hud{position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:50%;transform:translateX(-50%);z-index:40;pointer-events:none;font-family:var(--fd);font-size:calc(17px * var(--hud,1));color:#ffd27a;background:rgba(30,10,8,.72);border:1px solid #6a2a1a;border-radius:14px;padding:3px 14px;text-shadow:0 1px 3px #000;letter-spacing:.03em}",
    "#br21hud[hidden]{display:none}",
    ".br21-unter{color:#c8b090}.br21-naechst{color:#f0dcb0}.br21-naechst b{color:#ffd27a}",
    ".br21-wahl{display:flex;flex-direction:column;gap:6px;margin-top:8px}.br21-wahl button,.br21-pakete button{display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;text-align:left;background:linear-gradient(#3a2a24,#241915);border:1px solid #5e4a3c;border-radius:6px;padding:7px 12px;color:#f0e0c0;cursor:pointer;font:inherit}",
    ".br21-wahl button i{grid-row:span 2;font-style:normal;font-size:22px;color:#e5b454}.br21-wahl button b,.br21-pakete button b{color:#ffd27a}.br21-wahl button small,.br21-pakete button small{color:#c8b090;grid-column:2}",
    ".br21-pakete{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}.br21-pakete button{grid-template-columns:1fr}.br21-pakete button small{grid-column:1}",
    ".br21-wahl button:focus,.br21-wahl button:hover,.br21-pakete button:focus,.br21-pakete button:hover:not(:disabled){border-color:var(--gold,#e5b454);background:linear-gradient(#4a3428,#2a1c16)}",
    ".br21-pakete button:disabled{opacity:.5;cursor:default}",
    ".br21-folge{display:flex;flex-wrap:wrap;gap:4px 8px}.br21-folge span{background:rgba(138,20,20,.18);border:1px solid rgba(160,40,30,.45);border-radius:10px;padding:1px 9px;font-size:var(--fs-s,13px);color:#f0dcb0}.br21-folge small{color:#c8902a}",
    ".br21-best{color:#d8c8a8}.br21-best b{color:#ffd27a}.br21-neu{color:#ffd27a;font-weight:800}",
    ".br21-tab{width:100%;border-collapse:collapse;font-size:var(--fs-s,13px);margin-top:6px}.br21-tab th{color:#c8b090;font-weight:400;text-align:left;padding:2px 6px}.br21-tab td{padding:2px 6px;border-top:1px solid rgba(229,180,84,.12);color:#e8d8b8}.br21-tab tr.offen td{opacity:.5}",
    ".br21-kopf.sieg{color:#ffd27a}.br21-kopf.tod{color:#ff9a84}",
    ".handheld .br21-wahl button{padding:4px 8px}.handheld .br21-wahl button i{font-size:16px}.handheld .br21-pakete{grid-template-columns:1fr 1fr;gap:4px}.handheld .br21-pakete button{padding:4px 8px}.handheld .br21-folge span{font-size:11px;padding:0 6px}"
  ].join("\n");
  document.head.appendChild(css);

  Z.bossrausch = {
    aktiv: () => !!RS, frei, besiegt, alle, PAKETE, start, menu, knopf, weiter: () => { if (!RS) return; const lv = Z.level; if (lv && lv.passage) { const d = lv.doors.find(x => x.kind === "exit"); if (d) { Z.ui.modalOpen && Z.ui.close(); Z.run.route.push(d.to); Z.loadArea(d.to); } } },
    zustand: () => (RS ? { i: RS.i, N: RS.stages.length, phase: RS.phase, zeit: RS.zeit, splits: RS.splits.slice(), stages: RS.stages.map(s => s.area), pk: RS.pk.id, sandbox: Z.meta === RS.sand } : null),
    abbrechen: () => { if (RS) ergebnis("abbruch"); }
  };
})();
