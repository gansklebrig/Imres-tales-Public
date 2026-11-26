/* Ezekiel – The Destroyer · Lerntipps (W31)
   Sanfter Einstieg: Aus den letzten Läufen (Spielbericht, bericht.js) erkennt das Spiel, woran jemand scheitert –
   wiederholt durch Fernkämpfer, Fallen, Absturz, denselben Boss; nie pariert/gerollt; mit vollen Tränken gestorben;
   Waffe nie geschärft; Runen nie genutzt – und gibt dazu EINMAL einen freundlichen Tipp im Lager, gesprochen von einer
   passenden Lagerfigur in deren Ton, mit der Taste aus der aktuellen Belegung (W20: Tastatur, Controller oder Touch).
   Bei Parade/Rolle: kleine Übung an der Trainingspuppe (sie holt sichtbar aus, drei Treffer abwehren = bestanden).
   Nicht nervig: nur im Lager, nie im Kampf oder in Fenstern, höchstens ein Tipp je Rückkehr, danach mindestens zwei Läufe
   Pause, jeder Tipp nur einmal je Spielstand; abschaltbar (Einstellungen → Komfort & Barrierefreiheit → Lerntipps,
   Z.settings.lerntipps). Doppelt nichts mit den Lernschildern (schilder.js) – die erklären Tasten, hier geht es um Muster.
   Speicher: Z.meta.w31tips = { done:{id:Lauf}, last:Lauf, uebung:null|"parade"|"rolle" } (je Spielstand). Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, L = v => Z.L(v), inp = Z.input, FX = Z.fx, A = Z.audio;
  const T = () => Z.TILE || 16;
  const MIN_LAEUFE_PAUSE = 2;

  function TM() {
    const m = Z.meta || (Z.meta = {});
    let s = m.w31tips; if (!s || typeof s !== "object" || Array.isArray(s)) s = m.w31tips = {};
    if (!s.done || typeof s.done !== "object") s.done = {};
    if (typeof s.last !== "number") s.last = -99;
    return s;
  }
  const an = () => !Z.settings || Z.settings.lerntipps !== false;

  /* Taste aus der aktuellen Belegung */
  function taste(a) {
    try {
      if (inp.device === "pad") return inp.padButtonName(inp.padOf ? inp.padOf(a) : inp.pad[a]);
      if ((Z.ui && Z.ui.touchOn) || inp.device === "touch") return L({ roll: ["Rollen-Knopf", "roll button"], potion: ["Trank-Knopf", "potion button"], a1: ["Angriffsknopf 1", "attack button 1"], a2: ["Angriffsknopf 2", "attack button 2"], jump: ["Sprung-Knopf", "jump button"], use: ["Hand-Knopf", "hand button"] }[a] || [a, a]);
      return inp.label(a);
    } catch (_) { return a; }
  }
  const K = a => "[" + taste(a) + "]";
  const name = k => (Z.rueckblick && Z.rueckblick.srcName ? Z.rueckblick.srcName(k) : k);
  const isRanged = id => { const d = Z.ENEMIES && Z.ENEMIES[id], at = (d && d.atks) || []; return !!(d && (d.ai === "ranged" || (at.length && at.filter(a => a.proj || a.k === "shoot" || a.k === "lob").length / at.length >= 0.5))); };
  const schildSlot = () => { const P = Z.player; if (!P) return null; for (const s of ["a1", "a2"]) { const it = P.slots[s], d = it && Z.WEAPONS[it.id]; if (d && d.kind === "shield") return s; } return null; };

  /* ---------- Muster in den letzten Läufen ---------- */
  function analyse() {
    const all = Z.bericht ? Z.bericht.laeufe() : [], last = all.slice(-6), tode = last.filter(x => x.ende === "tod").slice(-4);
    const ur = x => (x.tod && x.tod.ursache) || "";
    const n = all.length, M = Z.meta || {};
    const bossTode = {}; for (const x of tode) if (ur(x).startsWith("b:")) bossTode[ur(x)] = (bossTode[ur(x)] | 0) + 1;
    const boss = Object.entries(bossTode).sort((a, b) => b[1] - a[1])[0];
    const r3 = all.slice(-3);
    return {
      n, last, tode,
      fern: tode.filter(x => ur(x).startsWith("e:") && isRanged(ur(x).slice(2))).length,
      falle: tode.filter(x => ur(x) === "x:falle").length + (last.filter(x => x.schaden && x.schaden.ein > 0 && (x.schaden.einJe["x:falle"] || 0) / x.schaden.ein > 0.35).length >= 3 ? 1 : 0),
      sturz: tode.filter(x => ur(x) === "x:sturz").length + (last.filter(x => (x.abstuerze | 0) >= 3).length >= 2 ? 1 : 0),
      boss: boss && boss[1] >= 2 ? boss[0] : null,
      volleFlaschen: tode.filter(x => x.traenke && x.traenke.uebrig > 0).length,
      nieRolle: r3.length >= 3 && r3.every(x => (x.rollen | 0) <= 2 && (x.dauer || 0) > 45),
      nieParade: r3.length >= 3 && r3.every(x => (x.paraden | 0) === 0) && all.slice(-6).some(x => (x.waffen || []).some(w => Z.WEAPONS[w.id] && Z.WEAPONS[w.id].kind === "shield")),
      nieGeschaerft: n >= 5 && !Object.keys(M.wlvl || {}).some(k => (M.wlvl[k] | 0) > 0) && (M.shards | 0) >= 60,
      nieRunen: n >= 6 && all.slice(-6).every(x => !(x.runen || []).length && !(x.waffen || []).some(w => (w.runen || []).length))
    };
  }

  /* ---------- Tipps: Wer sagt was (im Ton der Figur) ---------- */
  const TIPPS = [
    { id: "boss", fig: "B", prio: 9, ok: a => !!a.boss,
      txt: a => { const b = name(a.boss); return [b + " hat dich schon wieder erwischt? Hör hin: Jeder Großangriff hat ein Vorspiel – ein Ausholen, ein Leuchten, ein Brüllen. Zähl mit, und bei der letzten Note: " + K("roll") + ". Eine Ballade lebt vom Rhythmus. Du auch.",
        b + " got you again? Listen: every big attack has an intro – a wind-up, a glow, a roar. Count along, and on the last note: " + K("roll") + ". A ballad lives on rhythm. So do you."]; } },
    { id: "fern", fig: "G", prio: 8, ok: a => a.fern >= 2,
      txt: () => ["Die Schützen zielen dahin, wo du gerade bist – nicht dahin, wo du gleich bist. Roll durch die Pfeile (" + K("roll") + " macht dich kurz unverwundbar) oder lauf nah ran; ein Schild fängt Pfeile, und eine Parade schickt sie zurück.",
        "Archers aim where you are – not where you're about to be. Roll through the arrows (" + K("roll") + " makes you briefly invulnerable) or close in fast; a shield catches arrows, and a parry sends them back."] },
    { id: "falle", fig: "E", prio: 7, ok: a => a.falle >= 2,
      txt: () => ["Fallen sind ehrlich, Ezekiel. Sie klicken, knarren oder zittern, bevor sie zuschnappen. Bleib kurz stehen, wenn's klickt – dann drüber oder vorbei. Und wenn du schon reintrittst: wenigstens das Gold vorher einsammeln.",
        "Traps are honest, Ezekiel. They click, creak or tremble before they snap. Stop for a moment when it clicks – then jump over or past. And if you must step in one: grab the gold first."] },
    { id: "sturz", fig: "E", prio: 7, ok: a => a.sturz >= 2,
      txt: () => ["Du fällst öfter als meine Laune. Tipp: " + K("jump") + " in der Luft noch einmal drücken gibt dir einen zweiten Sprung, und an Kanten hältst du dich von selbst fest. Erst schauen (" + K("down") + " gedrückt halten), dann springen.",
        "You fall more often than my mood. Tip: press " + K("jump") + " again in the air for a second jump, and you grab ledges by yourself. Look first (hold " + K("down") + "), then jump."] },
    { id: "trank", fig: "E", prio: 6, ok: a => a.volleFlaschen >= 2,
      txt: () => ["Du stirbst mit vollen Flaschen. Weißt du, was die kosten? Trink! " + K("potion") + " – am besten, wenn gerade niemand auf dich einschlägt. Im nächsten Gebiet werden sie ohnehin wieder aufgefüllt.",
        "You die with full flasks. Do you know what those cost? Drink! " + K("potion") + " – best when nobody is hitting you right now. They refill in the next area anyway."] },
    { id: "parade", fig: "G", prio: 5, uebung: "parade", ok: a => a.nieParade,
      txt: () => { const s = schildSlot(); return ["Dein Schild ist kein Hut. Heb ihn mit " + K(s || "a2") + " kurz bevor der Schlag ankommt – zu früh hält er nur, im richtigen Moment pariert er, betäubt den Gegner und wirft Pfeile zurück. Die Puppe holt für dich aus, probier's dreimal.",
        "Your shield isn't a hat. Raise it with " + K(s || "a2") + " just before the blow lands – too early it only blocks, at the right moment it parries, stuns and reflects arrows. The dummy will swing for you, try it three times."]; } },
    { id: "rolle", fig: "G", prio: 5, uebung: "rolle", ok: a => a.nieRolle,
      txt: () => ["Die Rolle, Ezekiel. " + K("roll") + ". Mitten durch den Schlag – solange du rollst, trifft dich nichts. Die Puppe holt gleich aus: Roll durch, wenn das „!“ erscheint. Dreimal.",
        "The roll, Ezekiel. " + K("roll") + ". Right through the blow – while you roll, nothing hits you. The dummy will swing: roll through when the '!' appears. Three times."] },
    { id: "schaerfen", fig: "A", prio: 4, ok: a => a.nieGeschaerft,
      txt: () => ["Du trägst Splitter spazieren. Bring sie her. Jede Waffe, die du einmal getragen hast, schärfe ich am Amboss – und sie bleibt geschärft, Lauf für Lauf. " + K("use") + " bei mir.",
        "You're taking shards for a walk. Bring them here. Any weapon you've carried once, I sharpen at the anvil – and it stays sharp, run after run. " + K("use") + " at my forge."] },
    { id: "runen", fig: "A", prio: 3, ok: a => a.nieRunen,
      txt: () => ["Runen. Die leuchtenden Steine, die du liegen lässt. Leg sie in den Gürtel oder lass sie bei Stufe zwei und vier in den Stahl schlagen – dann tut eine Waffe Dinge, die sie vorher nicht konnte. Brand, Gift, Blitz. Wähl gut.",
        "Runes. The glowing stones you keep leaving behind. Put them in your belt or have them struck into the steel at level two and four – then a weapon does things it couldn't before. Fire, poison, lightning. Choose well."] }
  ];
  const FIGNAME = { B: "Barradin", G: "Friedrich", E: "Echo", A: "Nundro" };

  /* ---------- Auswahl und Auftritt ---------- */
  let plan = null; /* { tipp, t } */
  function waehlen() {
    if (!an() || !Z.bericht) return null;
    const S = TM(), n = Z.bericht.laeufe().length;
    if (n - S.last < MIN_LAEUFE_PAUSE) return null;
    const a = analyse();
    const c = TIPPS.filter(t => !S.done[t.id]).filter(t => { try { return t.ok(a); } catch (_) { return false; } }).sort((x, y) => y.prio - x.prio)[0];
    return c ? { tipp: c, a } : null;
  }
  function figurPos(id) { const lv = Z.level; const p = lv && lv.props && lv.props.find(q => q.id === id); return p ? [p.x * T() + 8, p.y * T() - 24] : null; }
  function ruhig() {
    const P = Z.player, lv = Z.level;
    if (!lv || !lv.hub || !P || P.dead || Z.paused || (Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive))) return false;
    if (Z.enemies && Z.enemies.some(e => !e.dead && !e.dummy && e.aware)) return false;
    return true;
  }
  /* Schritt 1: die Figur winkt (Zeichen über dem Kopf + kurze Meldung); Schritt 2: in der Nähe spricht sie den Tipp.
     Wer das Lager verlässt, ohne hinzugehen, bekommt den Tipp beim nächsten Mal – verbraucht wird er erst beim Sprechen. */
  function winken(w) {
    const t = w.tipp; if (!figurPos(t.fig)) return false;
    wink = { w, t: 0 };
    try { Z.ui.notify && Z.ui.notify("💡 <b>" + FIGNAME[t.fig] + "</b> " + L(["hat einen Tipp für dich – geh kurz hin.", "has a tip for you – walk over."]), { prio: 1, art: "gold", dauer: 3600 }); } catch (_) {}
    return true;
  }
  let wink = null;
  function zeigen(w) {
    const S = TM(), t = w.tipp, pos = figurPos(t.fig), txt = L(t.txt(w.a));
    if (!pos) return false;
    S.done[t.id] = Z.bericht.laeufe().length; S.last = S.done[t.id];
    if (t.uebung && Z.enemies && Z.enemies.some(e => e.dummy)) S.uebung = t.uebung;
    try { Z.saveMeta && Z.saveMeta(); } catch (_) {}
    Z.ui.say(pos[0], pos[1], FIGNAME[t.fig], "💡 " + txt, 12000);
    if (S.uebung) try { Z.ui.notify && Z.ui.notify("💡 " + L(["Übung an der Trainingspuppe wartet", "Practice waiting at the training dummy"]), { prio: 1, art: "gold", dauer: 3600 }); } catch (_) {}
    letzter = { id: t.id, txt, fig: t.fig };
    return true;
  }
  let letzter = null;
  const la0 = Z.loadArea;
  Z.loadArea = function (id) {
    const r = la0.apply(this, arguments);
    try { plan = null; wink = null; uebung.st = null; if (Z.level && Z.level.hub) { const w = waehlen(); if (w) plan = { w, t: 6.8 }; } } catch (e) { console.error("lerntipps", e); }
    return r;
  };

  /* ---------- Übung an der Trainingspuppe ---------- */
  const uebung = { st: null, t: 0, ok: 0, cd: 1.5, sym: 0 };
  function puppe() { return Z.enemies ? Z.enemies.find(e => e.dummy && !e.dead) : null; }
  function uebTick(dt) {
    const S = TM(), art = S.uebung, P = Z.player, d = puppe();
    if (!art || !d || !P || !ruhig()) { uebung.st = null; return; }
    const dx = P.x + P.w / 2 - (d.x + d.w / 2), nah = Math.abs(dx) < 72 && Math.abs(P.y + P.h - (d.y + d.h)) < 30;
    if (!uebung.st) { if (!nah) return; uebung.cd -= dt; if (uebung.cd > 0) return; uebung.st = "aus"; uebung.t = 0; A && A.play && A.play("swing", { vol: 0.3, rate: 0.8 }); return; }
    uebung.t += dt;
    if (uebung.st === "aus" && uebung.t >= 0.75) {
      /* Schlag landet jetzt: Rolle (Unverwundbarkeit der Rolle) oder Parade (Paradefenster) gefragt */
      const roll = P.rollT > 0 || P.dodgeT > 0, par = P.parryT > 0, block = P.act && P.act.type === "shield";
      let ok = false, msg;
      if (!nah) msg = null;
      else if (art === "rolle") { ok = roll; msg = ok ? L(["Durchgerollt!", "Rolled through!"]) : L(["Jetzt rollen – beim „!“", "Roll now – on the '!'"]); }
      else { ok = par; msg = ok ? L(["Pariert!", "Parried!"]) : block ? L(["Geblockt – etwas später heben", "Blocked – raise a bit later"]) : L(["Schild kurz vor dem Schlag heben", "Raise the shield just before the hit"]); }
      if (msg) { FX.text(P.x + P.w / 2, P.y - 14, msg, ok ? "#ffd27a" : "#ff9a6a", ok); A && A.play && A.play(ok ? "parry" : "ui", { vol: ok ? 0.5 : 0.3, rate: ok ? 1 : 0.7 }); }
      if (nah && !ok) { P.vx = Math.sign(dx || 1) * 120; } /* harmloser Schubs statt Schaden */
      if (ok) uebung.ok++;
      uebung.st = "nach"; uebung.t = 0;
      if (uebung.ok >= 3) {
        S.uebung = null; uebung.ok = 0; try { Z.saveMeta && Z.saveMeta(); } catch (_) {}
        Z.ui.toast("✦ " + L(["Übung bestanden – genau so in der Feste!", "Practice passed – do exactly that in the keep!"]), 2600);
        FX.burst && FX.burst(P.x + P.w / 2, P.y + 6, 16, { col: ["#ffd27a", "#fff"], sp: 90, up: 40, life: 0.6, size: 2, kind: "glow", add: true });
      }
    } else if (uebung.st === "nach" && uebung.t > 0.4) { uebung.st = null; uebung.cd = 1.1 + Math.random() * 0.8; }
  }
  /* Zeichnen: „!“ über der Puppe beim Ausholen, Schwungbogen beim Schlag */
  function winkDraw(c, cam, t) {
    if (!wink || !cam) return; const pos = figurPos(wink.w.tipp.fig); if (!pos) return;
    const FXs = Z.fx, S = Z.gfx.scale || 1, ox = Math.round((-cam.x + (FXs.shakeX || 0)) * S) / S, oy = Math.round((-cam.y + (FXs.shakeY || 0)) * S) / S;
    const x = pos[0], y = pos[1] - 10 + Math.sin(t * 4) * 2;
    c.save(); c.setTransform(S, 0, 0, S, ox * S, oy * S); c.globalAlpha = 1;
    c.fillStyle = "#120a06"; c.beginPath(); c.arc(x, y, 7.6, 0, 6.283); c.moveTo(x - 3, y + 6); c.lineTo(x, y + 11); c.lineTo(x + 3, y + 6); c.fill();
    c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(x, y, 6, 0, 6.283); c.fill();
    c.fillStyle = "#2a1810"; for (const dx of [-2.6, 0, 2.6]) { c.beginPath(); c.arc(x + dx, y, 1.05, 0, 6.283); c.fill(); }
    c.restore();
  }
  function uebDraw(c, cam) {
    const d = puppe(); if (!uebung.st || !d || !cam) return;
    const FXs = Z.fx, S = Z.gfx.scale || 1, ox = Math.round((-cam.x + (FXs.shakeX || 0)) * S) / S, oy = Math.round((-cam.y + (FXs.shakeY || 0)) * S) / S;
    const x = d.x + d.w / 2, y = d.y;
    c.save(); c.setTransform(S, 0, 0, S, ox * S, oy * S);
    if (uebung.st === "aus") {
      const k = uebung.t / 0.75, s = 6 + 3 * k;
      c.globalAlpha = 1; c.fillStyle = "#120a06"; c.beginPath(); c.arc(x, y - 14, s + 1.6, 0, 6.283); c.fill();
      c.fillStyle = k > 0.66 ? "#ff5a3a" : "#ffd84a"; c.beginPath(); c.arc(x, y - 14, s, 0, 6.283); c.fill();
      c.fillStyle = "#120a06"; c.fillRect(x - 1.1, y - 14 - s * 0.6, 2.2, s * 0.8); c.fillRect(x - 1.1, y - 14 + s * 0.35, 2.2, 2.2);
    } else if (uebung.st === "nach" && uebung.t < 0.18) {
      c.globalAlpha = 1 - uebung.t / 0.18; c.strokeStyle = "#ffd27a"; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y + d.h / 2, 30, -1.2, 1.2); c.stroke(); c.beginPath(); c.arc(x, y + d.h / 2, 30, Math.PI - 1.2, Math.PI + 1.2); c.stroke();
    }
    c.restore();
  }
  {
    const al0 = Z.drawAfterLight;
    Z.drawAfterLight = function (c, cam) { if (al0) al0.apply(this, arguments); try { if (Z.level && Z.level.hub) { uebDraw(c, cam); winkDraw(c, cam, (Z.gfx && Z.gfx.time) || 0); } } catch (e) { console.error(e); } };
  }

  /* ---------- pro Schritt (nur im Lager) ---------- */
  const lt0 = Z.lagerTick;
  Z.lagerTick = function (dt) {
    if (lt0) lt0.apply(this, arguments);
    try {
      const lv = Z.level; if (!lv || !lv.hub) return;
      if (plan) { if (ruhig()) plan.t -= dt; if (plan.t <= 0) { const w = plan.w; plan = null; if (an()) winken(w); } }
      if (wink) {
        wink.t += dt; const P = Z.player, pos = figurPos(wink.w.tipp.fig);
        if (!an() || !pos) wink = null;
        else if (P && ruhig() && Math.abs(P.x + P.w / 2 - pos[0]) < 150 && Math.abs(P.y - pos[1]) < 90) { const w = wink.w; wink = null; zeigen(w); }
      }
      uebTick(dt);
    } catch (e) { console.error("lerntipps", e); }
  };

  Z.lerntipps = {
    TIPPS, analyse, waehlen, meta: TM, letzter: () => letzter, uebung: () => ({ art: TM().uebung || null, st: uebung.st, ok: uebung.ok, t: uebung.t }),
    /* für Tests und „Tipps zurücksetzen“ */
    zuruecksetzen: () => { const S = TM(); S.done = {}; S.last = -99; S.uebung = null; try { Z.saveMeta && Z.saveMeta(); } catch (_) {} },
    jetzt: () => { const w = waehlen(); if (w) return zeigen(w) ? w.tipp.id : null; return null; },
    wartet: () => (wink ? wink.w.tipp.id : plan ? "plan:" + plan.w.tipp.id + "@" + plan.t.toFixed(1) : null), figurPos
  };
})();
