/* Ezekiel – The Destroyer · Rückweg-Gnade (W14)
   Wer aus Versehen durch ein Ausgangstor gegangen ist, kann gleich wieder zurück – solange im neuen Gebiet
   noch nichts „passiert“ ist. Zurück heißt: genau der alte Zustand des vorherigen Gebiets (gleiche Karte,
   Erkundung, tote Gegner bleiben tot, offene Truhen offen, Beute am Boden), Ezekiel steht vor dem Tor,
   durch das er ging. Geht er danach wieder hindurch, betritt er dasselbe Folgegebiet in genau dem Zustand,
   in dem er es verlassen hat (keine neue Karte, keine zweite Betretens-Belohnung, kein zweites Ereignis).

   Ablauf
   - spiel.js goThrough(): vor dem Laden des neuen Gebiets Schnappschuss des alten (capture), danach arrive().
   - Schnappschuss = Z.level/Z.biome, Gegner, Beute, Requisiten, Steckpfeile, Verbündete, Werkzeuge,
     Benutzbares (Z.interacts), Erkundung, Bossstand, Lauf-Felder (Gebiet, Stufe, Türen, Route) und die
     Modul-Zustände über Z.rueckHooks: jedes Modul mit Gebietszustand meldet { id, save(), load(s) } an
     (je eine abgegrenzte Zeile im Modul, Kennzeichen „W14 rueckweg“).
   - Zurück: Schnappschuss des neuen (unberührten) Gebiets merken, altes wieder einsetzen – OHNE Z.loadArea,
     also ohne Betretens-Belohnungen, Ereignisse, Seiten, Statistik, Nemesis-Auftritte, Musik-Stinger.
   - Wieder vorwärts durch dasselbe Tor: gemerkten Zustand des Folgegebiets einsetzen (ebenfalls ohne loadArea).

   Gnade erlischt (Tor schließt sich), sobald im neuen Gebiet etwas passiert: Leben ändert sich (Heilung/Schaden),
   Treffer ausgeteilt, Gold/Splitter/Tränke/Ausrüstung/Segen/Werte geändert, etwas aufgehoben oder benutzt
   (Truhe, Hebel, Händler, Altar, NSC …), Kiste zerschlagen, Bosskampf/Wächter (bloßes Bemerkt- oder Angegriffenwerden ohne Schaden zählt nicht),
   Türen verriegelt, nach 25 s oder mehr als zwei Räume vom Eingang entfernt, Tod.
   Darstellung: warmes Schimmern im Eingangstor (sonst ein schlichter Torbogen am Startpunkt) + Weltschild
   „Zurück nach …“ (Z.ui.worldLabel); beim Erlöschen fällt ein Fallgitter herunter und das Licht verlischt.
   Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const TAU = Math.PI * 2;
  const GRACE_S = 25, OPEN_S = 1.4, CLOSE_S = 0.9, ROOMS = 2, ALARM_R = 220;
  const hooks = () => Z.rueckHooks || [];
  const KEEP = ["enemies", "pickups", "propsLive", "stuck", "allies", "hazards", "gadgets"]; /* bleiben, wie sie waren */
  const DROP = ["projs", "bolts"]; /* Geschosse im Flug: nicht zurückholen */
  const lean = () => !!(Z.gq && (Z.gq.lean || Z.gq.level === 0));

  let back = null; /* Gnade im aktuellen Gebiet: { snap, lv, gx, gy, door, t, st, ... } */
  let fwd = null; /* nach dem Zurückgehen: { snap (Folgegebiet), lv (aktuelles), door (Ausgangstür) } */
  let busy = false, lastEnd = "", lastCap = null;

  /* ======================= SCHNAPPSCHUSS ======================= */
  function capture(door, pos) {
    const lv = Z.level, P = Z.player, run = Z.run;
    const s = {
      lv, B: Z.biome, id: lv.id, door: door || null, pos: pos || null,
      arr: {}, interacts: (Z.interacts || []).filter(o => !o.rueck),
      explored: Z.explored, boss: Z.boss, bossDefeated: Z.bossDefeated, darkness: Z.darkness || 0,
      anvils: Z.anvils ? Z.anvils.slice() : null,
      bounds: Z.cam.bounds ? Object.assign({}, Z.cam.bounds) : null, camLock: Z.cam.lock || null,
      run: run ? { area: run.area, tier: run.tier, doorsOpen: run.doorsOpen, route: run.route.slice() } : null,
      rexUsed: P ? !!P.rexUsed : false,
      mods: []
    };
    for (const k of KEEP) if (Z[k]) s.arr[k] = Z[k].slice();
    for (const h of hooks()) { try { s.mods.push([h, h.save ? h.save() : null]); } catch (e) { console.error("rueckweg save " + h.id, e); } }
    lastCap = { id: lv.id, pick: s.arr.pickups ? s.arr.pickups.length : 0, kinds: (s.arr.pickups || []).map(p => p.kind).join(","), alive: Z.enemies.filter(e => !e.dead).length, open: Z.pickups.filter(p => p.open).length, gold: P ? P.gold : 0 }; /* Prüfhilfe */
    return s;
  }
  function setArr(a, v) { a.length = 0; if (v) for (const x of v) a.push(x); }
  function restore(s, at) {
    const P = Z.player, lv = s.lv, run = Z.run;
    /* Flüchtiges leeren (wie Z.loadArea) */
    for (const k of DROP) if (Z[k]) Z[k].length = 0;
    if (Z.webStrips) Z.webStrips.length = 0;
    FX.parts.length = 0; FX.texts.length = 0;
    /* Gebiet einsetzen */
    W.lv = lv; Z.level = lv; Z.biome = s.B;
    if (run && s.run) { run.area = s.run.area; run.tier = s.run.tier; run.doorsOpen = s.run.doorsOpen; setArr(run.route, s.run.route); }
    Z.gfx.setLevel(lv, s.B);
    for (const k of KEEP) if (Z[k] && s.arr[k]) setArr(Z[k], s.arr[k]);
    Z.interacts = s.interacts.slice();
    if (s.anvils && Z.anvils) setArr(Z.anvils, s.anvils);
    Z.explored = s.explored; Z.boss = s.boss; Z.bossDefeated = s.bossDefeated; Z.darkness = s.darkness;
    Z.cam.bounds = s.bounds ? Object.assign({}, s.bounds) : { x: 0, y: 0, w: lv.W * T, h: lv.H * T }; Z.cam.lock = s.camLock;
    /* Spieler: wie beim Betreten (Haken, Ranken, Sturz … zurücksetzen), dann an den Platz */
    if (P) {
      P.grapple = null; P.shieldOut = null; P.vx = 0; P.vy = 0; P.peakY = null; P._wasAir = false; P._voidT = null; P.cape = null; P.act = null; P.ledge = null;
      P.climbing = false; P.rollT = 0; P.grabbed = null; P.plunge = false; P.diveStyle = null; P.diveLock = false; P.diveRecPend = false; P.diveRec = 0; P.rustT = 0;
      P.rexUsed = s.rexUsed;
      P.x = at.x; P.y = at.y; if (at.face) P.face = at.face;
      P.lastSafe = { x: P.x, y: P.y };
    }
    for (const [h, v] of s.mods) { try { if (h.load) h.load(v, lv); } catch (e) { console.error("rueckweg load " + h.id, e); } }
    Z.cam.snap(P.x + P.w / 2, P.y);
    /* Ton und Oberfläche – ohne Seite, Banner, Stinger */
    try { Z.ambience.set(s.B, !!lv.arena); } catch (_) {}
    try { Z.music.set(lv.hub ? "lager" : lv.passage ? "passage" : lv.arena ? (Z.boss && !Z.bossDefeated ? "boss1" : Z.ARENAS[lv.id].music) : lv.id); } catch (_) {}
    try {
      const ui = Z.ui; ui.clearLabels && ui.clearLabels(); ui.choiceActive = null;
      for (const id of ["choice", "bubble", "card", "prompt"]) { const el = document.getElementById(id); if (el) el.hidden = true; }
    } catch (_) {}
    Z.interactTarget = null;
  }
  /* Startplatz eines Gebiets (wie Z.loadArea) */
  function startPos(lv) { const P = Z.player; return { x: lv.start.x * T + T / 2 - P.w / 2, y: (lv.start.y + 1) * T - P.h, face: 1 }; }
  /* vor dem Ausgangstor: etwas zur Seite, von der er kam, damit er nicht gleich wieder hindurchgeht */
  function besideDoor(s) {
    const P = Z.player, d = s.door, pos = s.pos;
    if (!d) return pos || startPos(s.lv);
    const cx = d.x * T + 8, fy = (d.y + 1) * T;
    const pref = pos && pos.x + P.w / 2 < cx ? -1 : pos && pos.x + P.w / 2 > cx ? 1 : (s.lv.start && s.lv.start.x * T < cx ? -1 : 1);
    const lvS = s.lv, ok = x => { const tx = Math.floor(x / T), ty = d.y; return lvS.get(tx, ty) !== 1 && lvS.get(tx, ty - 1) !== 1 && (lvS.get(tx, ty + 1) === 1 || lvS.get(tx, ty + 1) === 2 || lvS.get(tx, ty + 1) === 7); };
    for (const k of [pref, -pref]) for (const off of [20, 16, 26]) { const x = cx + k * off; if (ok(x)) return { x: x - P.w / 2, y: fy - P.h, face: -k }; }
    return pos ? { x: pos.x, y: pos.y, face: pos.face } : { x: cx - P.w / 2, y: fy - P.h, face: 1 };
  }

  /* ======================= ANKUNFT: Gnade aufbauen ======================= */
  function nameOf(s) {
    const en = Z.settings && Z.settings.lang === "en";
    if (s.lv.passage) return en ? "Back to the passage" : "Zurück in den Durchgang";
    if (s.lv.hub) return en ? "Back to the camp" : "Zurück ins Lager";
    const n = Z.areaName(s.id);
    if (en) return "Back to " + n.replace(/^The /, "the ");
    const m = /^(Der|Die|Das) (.*)$/.exec(n);
    return "Zurück " + (m ? (m[1] === "Der" ? "in den " : m[1] === "Die" ? "in die " : "ins ") + m[2] : "nach " + n);
  }
  function gatePos(lv) {
    let d = null, bd = 1e9;
    for (const q of lv.doors || []) if (q.kind === "entry") { const dd = Math.abs(q.x - lv.start.x) + Math.abs(q.y - lv.start.y); if (dd < bd) { bd = dd; d = q; } }
    if (d && bd <= 6) return { x: d.x * T + 8, y: (d.y + 1) * T, entry: true };
    return { x: lv.start.x * T + 8, y: (lv.start.y + 1) * T, entry: false };
  }
  function cellOf(x, y) { return [Math.floor(x / T / Z.CW), Math.floor(y / T / Z.CH)]; }
  function baseline() {
    const P = Z.player;
    return {
      hp: P.hp, hpMax: P.hpMax, gold: P.gold, shards: P.shards, potions: P.potions, curse: P.curse || 0, rex: !!P.rexUsed,
      bless: (P.bless || []).length, stats: JSON.stringify(P.stats || {}), slots: slotSig(P),
      pick: Z.pickups.length, open: Z.pickups.filter(p => p.open).length, props: Z.propsLive.filter(p => p.dead || p.hp <= 0).length,
      kills: (Z.stats && Z.stats.kills) || 0, doors: Z.run ? Z.run.doorsOpen : true
    };
  }
  function slotSig(P) { const s = P.slots || {}; return ["a1", "a2", "s1", "s2"].map(k => (s[k] ? s[k].uid || s[k].id : "-")).join("|"); }
  function arrive(snap) {
    const lv = Z.level, P = Z.player;
    back = null;
    if (!snap || !snap.lv || !lv || !P || lv.hub || snap.lv.hub || !Z.run) return;
    const g = gatePos(lv);
    back = { snap, lv, gx: g.x, gy: g.y, entry: g.entry, t: 0, st: "opening", closeT: 0, label: nameOf(snap), base: baseline(), cell: cellOf(P.x + P.w / 2, P.y + P.h / 2), why: "" };
    const o = { rueck: true, tor: true, x: g.x, y: g.y, r: 26, h: 40, ok: () => !!(back && back.o === o && back.st === "open"), label: () => (back ? back.label : ""), use: () => goBack() };
    back.o = o;
    (Z.interacts = Z.interacts || []).push(o);
  }
  function endGrace(why) {
    const b = back; if (!b || b.st === "closing" || b.st === "closed") return;
    lastEnd = why || "";
    b.why = why || ""; b.st = "closing"; b.closeT = 0; b.snap = null; /* Zustand des alten Gebiets freigeben */
    try { Z.ui.worldLabel("rueckweg", null); } catch (_) {}
    if (b.lv === Z.level) { A.play("chain", { vol: 0.28, rate: 0.9, x: b.gx }); } /* Aufschlag/Rückprall des Gitters (0,56/0,73 s) spielt klang.js über diesen Kettenklang */
  }

  /* ======================= ZURÜCK / WIEDER VOR ======================= */
  function goBack() {
    const b = back; if (!b || b.st !== "open" || busy || !b.snap) return;
    busy = true; b.st = "going";
    A.play("door", { vol: 0.6, rate: 0.92 });
    Z.ui.fade(() => {
      busy = false;
      try {
        const P = Z.player;
        if (!P || P.dead || Z.level !== b.lv) { back = null; return; }
        const here = capture(null, null); here.pos = startPos(here.lv);
        const snap = b.snap; back = null;
        restore(snap, besideDoor(snap));
        fwd = snap.door ? { snap: here, lv: snap.lv, door: snap.door } : null;
      } catch (e) { console.error("rueckweg", e); back = null; fwd = null; }
    });
  }
  /* aus spiel.js goThrough(): Tür d im aktuellen Gebiet – führt sie in das gemerkte Folgegebiet? */
  function vor(d) {
    if (!fwd || fwd.lv !== Z.level || fwd.door !== d || busy) return false;
    const f = fwd, P = Z.player;
    const pos = P ? { x: P.x, y: P.y, face: P.face } : null;
    busy = true;
    A.play("door", { vol: 0.7 });
    Z.ui.fade(() => {
      busy = false;
      try {
        if (!Z.player || Z.player.dead || Z.level !== f.lv) { fwd = null; return; }
        const here = capture(d, pos);
        fwd = null;
        restore(f.snap, f.snap.pos || startPos(f.snap.lv));
        if (f.snap.lv.passage) bankShards();
        arrive(here);
      } catch (e) { console.error("rueckweg", e); fwd = null; back = null; }
    });
    return true;
  }
  /* wie setupPassage: Splitter, die seit dem ersten Besuch dazukamen, trägt der Rabe ins Lager */
  function bankShards() {
    const P = Z.player;
    if (P && P.shards > 0) { Z.meta.shards += P.shards; Z.run.shardsBank += P.shards; Z.toast(L(["Nundros Rabe trägt ", "Nundro's raven carries "]) + P.shards + L([" Seelensplitter ins Lager.", " soul shards to the camp."])); P.shards = 0; Z.saveMeta(); }
  }
  /* aus spiel.js interact(): jede Benutzung im neuen Gebiet (außer dem Rückweg-Tor selbst) beendet die Gnade */
  function benutzt(o) {
    if (!back || back.st !== "open" && back.st !== "opening") return;
    if (o && o.type === "obj" && o.o && o.o.rueck) return;
    if (o && o.type === "door") return; /* geht ohnehin weiter */
    endGrace("benutzt");
  }

  /* ======================= WÄCHTER: Bedingungen ======================= */
  function check(dt) {
    const b = back; if (!b) return;
    if (b.lv !== Z.level) { if (b.st !== "going") back = null; return; }
    b.t += dt;
    if (b.st === "closing") { b.closeT += dt; if (b.closeT >= CLOSE_S) { b.st = "closed"; Z.interacts = (Z.interacts || []).filter(o => o !== b.o); } return; }
    if (b.st === "closed" || b.st === "going") return;
    if (b.st === "opening" && b.t >= OPEN_S) b.st = "open";
    /* solange das Tor aufglimmt (1,4 s), kommen noch Nachzahlungen des alten Gebiets an (Herausforderungen nach 1,1 s):
       Habe/Beute als neue Grundlinie übernehmen – nur das Leben zählt von Anfang an */
    if (b.st === "opening" && Z.player) { const hp = b.base.hp, hm = b.base.hpMax; b.base = baseline(); b.base.hp = hp; b.base.hpMax = hm; }
    const P = Z.player, B0 = b.base;
    let why = "";
    if (!P || P.dead) why = "tod";
    else if (b.t > GRACE_S) why = "zeit";
    else if (Math.abs(P.hp - B0.hp) > 0.5 || P.hpMax !== B0.hpMax) why = "leben";
    else if (P.gold !== B0.gold || P.shards !== B0.shards || P.potions !== B0.potions || (P.curse || 0) !== B0.curse || !!P.rexUsed !== B0.rex) why = "habe";
    else if ((P.bless || []).length !== B0.bless || JSON.stringify(P.stats || {}) !== B0.stats || slotSig(P) !== B0.slots) why = "ausruestung";
    else if (Z.pickups.length < B0.pick || Z.pickups.filter(p => p.open).length !== B0.open) why = "aufgehoben";
    else if (Z.propsLive.filter(p => p.dead || p.hp <= 0).length !== B0.props) why = "zerschlagen";
    else if (Z.boss || Z.cam.lock || (Z.run && Z.run.doorsOpen !== B0.doors)) why = "boss";
    else {
      /* Bemerktwerden und Ausholen schließen das Tor NICHT (Nutzerwunsch): nur Handlungen, die einen Vorteil
         brächten (Treffer, Heilung, Beute, Benutzen …) – oder erlittener Schaden (Leben ändert sich, s. o.) */
      if (b.lv.cells) { const c = cellOf(P.x + P.w / 2, P.y + P.h / 2); if (Math.max(Math.abs(c[0] - b.cell[0]), Math.abs(c[1] - b.cell[1])) > ROOMS) why = "weg"; }
      else if (!why && Math.abs(P.x + P.w / 2 - b.gx) > ROOMS * Z.CW * T) why = "weg";
    }
    if (why) endGrace(why);
  }
  /* Treffer ausgeteilt (auch ohne Tötung) */
  const hit0 = Z.hitEnemy;
  const ENV = { fall: 1, trap: 1, hazard: 1, env: 1, dot: 1 }; /* Sturz, Fallen, Umgebung: hat nicht Ezekiel getan */
  Z.hitEnemy = function (e, dmg, o) { if (back && (back.st === "open" || back.st === "opening") && e && !e.dummy && back.lv === Z.level && !(o && (ENV[o.src] || o.dot))) endGrace("treffer" + (o && o.src ? ":" + o.src : "")); return hit0.apply(this, arguments); };
  const heal0 = Z.healPlayer;
  if (heal0) Z.healPlayer = function () { const P = Z.player, h = P ? P.hp : 0; const r = heal0.apply(this, arguments); if (back && P && P.hp > h + 0.5 && back.lv === Z.level) endGrace("heilung"); return r; };
  /* jeden Rechenschritt prüfen (läuft in tick, also nicht während Pause/Fenster) */
  const up0 = Z.updatePickups;
  Z.updatePickups = function (dt) { const r = up0.apply(this, arguments); try { check(dt); } catch (e) { console.error("rueckweg", e); back = null; } return r; };

  /* Jedes echte Laden (anderes Tor, Lager, Tod, neuer Lauf) verwirft beide Schnappschüsse */
  const la0 = Z.loadArea;
  Z.loadArea = function () { back = null; fwd = null; busy = false; return la0.apply(this, arguments); };
  const nr0 = Z.newRun;
  Z.newRun = function () { back = null; fwd = null; return nr0.apply(this, arguments); };

  /* ======================= ZEICHNEN ======================= */
  /* W11 R21 (Grafik): Optik auf Pracht-Niveau – Schimmer mit aufsteigenden Hitzeschlieren im Torbogen, warme Lichtsäule
     nach oben, Glutfunken, Bodenlicht; in den letzten 5 s stottert das Licht und wird schwächer; beim Erlöschen fällt ein
     schweres Fallgitter (Nieten, Querstreben, Spitzen) mit Aufprall, Funken und Staub und BLEIBT danach sichtbar
     geschlossen. Lean: schlichtes Schimmern, einfaches Gitter. Logik unverändert (nur Zeichnen). */
  function grate(c, x, y0, y1, lo) {
    const h = y1 - y0; if (h <= 0) return;
    c.fillStyle = "rgba(0,0,0,.35)"; for (let k = -6; k <= 6; k += 4) c.fillRect(x + k + 0.2, y0 + 1, 1.8, h);
    c.fillStyle = "#3e3638"; for (let k = -6; k <= 6; k += 4) c.fillRect(x + k - 0.9, y0, 1.8, h - 2);
    for (let yy = y1 - 6; yy > y0 + 2; yy -= 9) c.fillRect(x - 8, yy, 16, 1.6);
    for (let k = -6; k <= 6; k += 4) { c.beginPath(); c.moveTo(x + k - 1.2, y1 - 2); c.lineTo(x + k, y1 + 1.2); c.lineTo(x + k + 1.2, y1 - 2); c.fill(); }
    if (!lo) { c.fillStyle = "#8a8088"; for (let k = -6; k <= 6; k += 4) c.fillRect(x + k - 0.9, y0, 0.5, h - 2); for (let yy = y1 - 6; yy > y0 + 2; yy -= 9) for (let k = -6; k <= 6; k += 4) c.fillRect(x + k - 0.4, yy + 0.3, 0.9, 0.9); }
  }
  function drawGate(c, t) {
    const b = back; if (!b || b.lv !== Z.level) return;
    const cam = Z.cam, x = b.gx, y = b.gy;
    if (x < cam.x - 60 || x > cam.x + cam.w + 60 || y < cam.y - 90 || y > cam.y + cam.h + 80) return;
    const lo = lean();
    if (b.st === "closed") { c.save(); grate(c, x, y - 38, y, lo); c.restore(); return; }
    const open = b.st === "opening" ? Math.min(1, b.t / OPEN_S) : 1;
    const close = b.st === "closing" ? Math.min(1, b.closeT / CLOSE_S) : 0;
    const left = GRACE_S - b.t, ending = (b.st === "open" || b.st === "going") && left < 5;
    const life = ending ? 0.45 + 0.55 * Math.max(0, left / 5) : 1;
    /* Stottern in den letzten 5 s: kurze Aussetzer, häufiger je näher am Ende */
    const stut = ending && !lo && Math.sin(t * (9 + (5 - left) * 4)) * Math.sin(t * 3.7) > 0.55 ? 0.45 : 1;
    const glow = open * (1 - close) * life * stut;
    c.save();
    if (!b.entry) {
      c.globalAlpha = 1 - close * 0.6;
      c.fillStyle = "#3a302a"; c.fillRect(x - 11, y - 32, 4, 32); c.fillRect(x + 7, y - 32, 4, 32);
      c.strokeStyle = "#3a302a"; c.lineWidth = 4; c.beginPath(); c.arc(x, y - 32, 9, Math.PI, 0); c.stroke();
      c.fillStyle = "rgba(20,12,8,.75)"; c.fillRect(x - 7, y - 30, 14, 30); c.beginPath(); c.arc(x, y - 30, 7, Math.PI, 0); c.fill();
      c.globalAlpha = 1;
    }
    if (glow > 0.01) {
      const fl = 0.85 + 0.15 * Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1);
      c.globalCompositeOperation = "lighter";
      const arch = () => { c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x - 8, y - 30); c.arc(x, y - 30, 8, Math.PI, 0); c.lineTo(x + 8, y); c.closePath(); };
      const g = c.createLinearGradient(0, y - 38, 0, y);
      g.addColorStop(0, "rgba(255,170,80," + (0.08 * glow).toFixed(3) + ")"); g.addColorStop(0.35, "rgba(255,170,80," + (0.32 * glow * fl).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,200,120," + (0.48 * glow * fl).toFixed(3) + ")");
      c.fillStyle = g; arch(); c.fill();
      if (!lo) {
        /* Hitzeschlieren: helle Bänder wandern im Bogen nach oben */
        c.save(); arch(); c.clip();
        for (let k = 0; k < 3; k++) { const u = (t * 0.45 + k / 3) % 1, yy = y - u * 40; c.fillStyle = "rgba(255,230,170," + (0.22 * glow * Math.sin(u * Math.PI)).toFixed(3) + ")";
          c.beginPath(); c.moveTo(x - 9, yy); c.quadraticCurveTo(x, yy - 3 + Math.sin(t * 3 + k) * 2, x + 9, yy); c.lineTo(x + 9, yy + 2.2); c.quadraticCurveTo(x, yy - 0.8, x - 9, yy + 2.2); c.fill(); }
        c.restore();
        /* Lichtsäule nach oben */
        const lg = c.createLinearGradient(0, y - 110, 0, y - 20);
        lg.addColorStop(0, "rgba(255,180,90,0)"); lg.addColorStop(1, "rgba(255,190,100," + (0.18 * glow * fl).toFixed(3) + ")");
        c.fillStyle = lg; c.beginPath(); c.moveTo(x - 7, y - 20); c.lineTo(x - 12, y - 110); c.lineTo(x + 12, y - 110); c.lineTo(x + 7, y - 20); c.closePath(); c.fill();
        const rg = c.createRadialGradient(x, y - 14, 2, x, y - 14, 38);
        rg.addColorStop(0, "rgba(255,190,110," + (0.24 * glow * fl).toFixed(3) + ")"); rg.addColorStop(1, "rgba(255,190,110,0)");
        c.fillStyle = rg; c.fillRect(x - 38, y - 52, 76, 56);
        /* Glutfunken: steigen im Tor und darüber in der Säule */
        for (let i = 0; i < 10; i++) { const ph = (t * (0.3 + (i % 3) * 0.08) + i / 10) % 1, sx = x + Math.sin(i * 2.3 + t * 1.7) * (4 + ph * 5), sy = y - 2 - ph * 70;
          c.fillStyle = "rgba(255," + (200 + (i % 3) * 18) + ",140," + (0.9 * glow * (1 - ph)).toFixed(3) + ")"; c.fillRect(sx, sy, i % 4 ? 1 : 1.6, i % 4 ? 1 : 1.6); }
      } else {
        c.fillStyle = "rgba(255,220,150," + (0.8 * glow).toFixed(3) + ")";
        for (let i = 0; i < 4; i++) { const ph = (t * 0.35 + i / 4) % 1, sx = x + Math.sin(i * 2.3 + t * 1.7) * 5; c.fillRect(sx, y - 2 - ph * 30, 1, 1); }
      }
      c.fillStyle = "rgba(255,190,110," + (0.28 * glow * fl).toFixed(3) + ")"; c.beginPath(); c.ellipse(x, y, 18, 2.4, 0, 0, TAU); c.fill();
      c.globalCompositeOperation = "source-over";
    }
    /* Schließen: schweres Fallgitter fällt (beschleunigt), prallt kurz zurück, Funken und Staub */
    if (b.st === "closing" || close > 0) {
      const u = Math.min(1, close * 1.6), fall = u < 1 ? u * u : 1, bounce = u >= 1 ? Math.max(0, Math.sin((close - 0.625) / 0.375 * Math.PI * 2)) * 2.5 * (1 - close) : 0;
      const gy = y - 38 + fall * 38 - bounce;
      c.save(); c.beginPath(); c.rect(x - 10, y - 44, 20, 46); c.clip(); grate(c, x, gy - 38, gy, lo); c.restore();
      if (u >= 1 && !b.dust) {
        b.dust = true;
        if (!lo) { FX.burst(x, y - 2, 14, { col: ["#6a5a4a", "#8a7a68"], sp: 55, up: 20, life: 0.8, size: 2.6, kind: "smoke", g: -10 }); FX.burst(x, y - 1, 10, { col: ["#ffd890", "#ff9a4a"], sp: 110, ang: -Math.PI / 2, spread: 2.2, life: 0.35, size: 1.3, kind: "spark", add: true, g: 300 }); }
        FX.addShake && FX.addShake(1.5);
      }
    }
    c.restore();
    const near = Z.interactTarget && Z.interactTarget.type === "obj" && Z.interactTarget.o === b.o;
    if ((b.st === "open" || b.st === "opening") && !near) { try { Z.ui.worldLabel("rueckweg", { x, y: y - 44, text: b.label, art: "gold", cls: "rueck", jetzt: true }); } catch (_) {} }
  }
  /* W11 R21: warmes Licht des offenen Tors in der Lichtkarte (ab Stufe 1) */
  if (Z.gfx && Z.gfx.lightGather) Z.gfx.lightGather.push(function (add) {
    const b = back; if (!b || b.lv !== Z.level || b.st === "closed" || b.st === "closing") return;
    const left = GRACE_S - b.t, k = left < 5 ? 0.45 + 0.55 * Math.max(0, left / 5) : 1;
    add(b.gx, b.gy - 16, 70, "#ffb060", 0.4 * k, 0);
  });
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) { if (al0) al0.apply(this, arguments); try { drawGate(c, t || 0); } catch (e) { console.error("rueckweg", e); } };

  /* ======================= Schnittstelle ======================= */
  Z.rueckweg = {
    capture, arrive, vor, benutzt,
    zustand: () => ({ back: back ? { st: back.st, t: +back.t.toFixed(2), label: back.label, from: back.snap ? back.snap.id : null, why: back.why } : null, fwd: fwd ? { to: fwd.snap.id, from: fwd.lv.id } : null, lastEnd }),
    letzte: () => lastCap,
    ende: why => endGrace(why || "test"),
    zurueck: () => goBack()
  };
})();
