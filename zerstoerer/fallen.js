/* Ezekiel – The Destroyer · Gebietsfallen
   Jedes Gebiet hat sein eigenes Fallensystem – man soll allein an den Fallen ablesen können, wo man ist.
   Platzierung: welt.js (TRAPKINDS/TRAPPLACE, sprinkleTraps) und Vorlagen-Zeichen, die hier je Gebiet umgedeutet werden.
   Jede Falle: klare Vorwarnung (Bild + Klang), fair umgehbar, trifft auch Gegner (Gegner hineinlocken!).
   Z.FALLEN_INFO: Glossar (Name, Kurzbeschreibung, Gebiet) für die Oberfläche. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v);
  const { circ, ell, glow } = Z.draw;
  const api = Z.trapApi;
  const list = [], shots = [], minis = [], pools = [], waves = [];
  Z.fallen = list;
  let clock = 0, toastCd = 0;

  /* ======================= WERKZEUGE ======================= */
  const P0 = () => { const P = Z.player; return P && !P.dead ? P : null; };
  const pcx = P => P.x + P.w / 2;
  /* Trefferfläche des Spielers (schmaler als sein Körper, beim Rollen nur unten) */
  const HB = P => (Z.playerHurtBox ? Z.playerHurtBox(P) : P);
  const vis = (x, y, m) => { const cam = Z.cam; m = m || 60; return x > cam.x - m && x < cam.x + cam.w + m && y > cam.y - m - 120 && y < cam.y + cam.h + m; };
  const near = (x, y, d) => { const P = Z.player; return !!P && Math.abs(pcx(P) - x) < (d || 420) && Math.abs(P.y + P.h / 2 - y) < 300; };
  const lo = () => !!(Z.gq && Z.gq.level === 0);
  const tier = () => (Z.run ? Z.run.tier || 0 : 0);
  const sc = n => n * (1 + tier() * 0.35);
  const amb = (b, n) => "amb/" + b + (1 + ((Math.random() * n) | 0)) + ".mp3";
  function play(name, x, y, o) { if (!near(x, y, 520)) return; A.play(name, Object.assign({ x, y }, o || {})); }
  /* Treffer am Spieler: Schaden als Anteil am Leben (über parcours.js skaliert), Status nur bei echtem Treffer */
  function hp(frac, x, o) { const P = P0(); if (!P) return false; return Z.hurtPlayer(api.dmgFrac(frac), Object.assign({ x, kb: 180, kbUp: 200, parryable: false, trap: true }, o || {})); }
  function he(tr, e, dmg, o, st) {
    if (tr.cd.get(e) > clock) return; tr.cd.set(e, clock + 0.6);
    Z.hitEnemy(e, sc(dmg), Object.assign({ src: "trap", kb: 150, kbUp: 150 }, o || {}));
    if (st) for (const k in st) Z.addStatus(e, k, st[k]);
  }
  function foes(test, fn) { for (const e of Z.enemies) if (!e.dead && !(e.def && e.def.boss) && test(e)) fn(e); }
  const box = (x, y, w, h) => ({ x, y, w, h });
  const ov = U.overlap;
  const circRect = api.circRect;
  function shove(b, dx) {
    if (!dx) return;
    const nx = b.x + dx, edge = dx > 0 ? nx + b.w : nx, tx = Math.floor((dx > 0 ? edge - 0.001 : edge) / T);
    for (let ty = Math.floor(b.y / T); ty <= Math.floor((b.y + b.h - 0.01) / T); ty++) if (W.solidT(W.tile(tx, ty))) return;
    b.x = nx;
  }
  function shadow(c, x, y, rx, a) { if (a <= 0.01) return; c.save(); c.globalAlpha = Math.min(0.6, a); ell(c, x, y - 0.5, rx, Math.max(1.2, rx * 0.2), "#000"); c.restore(); }
  function chain(c, x1, y1, x2, y2, col, hi) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), n = Math.max(1, Math.floor(len / 3.4)), a = Math.atan2(dy, dx);
    c.strokeStyle = "#1a1416"; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = x1 + dx * k, y = y1 + dy * k; if (i % 2) ell(c, x, y, 1.9, 1.1, col, a); else ell(c, x, y, 1.9, 0.6, hi, a); }
  }
  function rope(c, x1, y1, x2, y2, col) {
    c.strokeStyle = "#2a1e16"; c.lineWidth = 2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    if (lo()) return;
    c.strokeStyle = col; c.lineWidth = 1.1; c.setLineDash([1.6, 1.6]); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
  }
  function plank(c, x, y, w, h, col, dark) {
    c.fillStyle = dark || "#1e1612"; c.fillRect(x - 0.5, y - 0.5, w + 1, h + 1);
    c.fillStyle = col; c.fillRect(x, y, w, h);
    if (!lo()) { c.fillStyle = "rgba(255,230,190,.14)"; c.fillRect(x, y, w, 0.8); c.fillStyle = "rgba(0,0,0,.22)"; for (let i = 3; i < w - 1; i += 5) c.fillRect(x + i, y + h * 0.3, 2.5, 0.6); }
  }
  /* Schatten-/Sprite-Zwischenspeicher für Statisches (keine Verläufe pro Bild) */
  const SPR = new Map();
  function spr(key, w, h, fn) {
    let cv = SPR.get(key); if (cv) return cv;
    cv = document.createElement("canvas"); cv.width = w * 3; cv.height = h * 3; const g = cv.getContext("2d"); g.scale(3, 3); fn(g, w, h);
    SPR.set(key, cv); return cv;
  }
  function puff(x, y, col, n, o) { for (let i = 0; i < n; i++) FX.p(Object.assign({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, life: 1.2, size: 5, col, kind: "smoke", drag: 0.96 }, o || {})); }
  function sparks(x, y, n, cols, o) { FX.burst(x, y, n, Object.assign({ col: cols || ["#ffd27a", "#ff8a3a", "#fff"], sp: 140, life: 0.4, size: 1.5, kind: "spark", add: true, g: 300 }, o || {})); }
  const P_onFloor = (P, fy) => P.onGround && Math.abs(P.y + P.h - fy) < 4;
  const rangeTo = (x, y, dir, max) => { let d = 0; while (d < max && !W.solidAt(x + dir * (d + 4), y)) d += 4; return d; };

  /* ======================= FALLENARTEN ======================= */
  const D = {};
  const def = (k, o) => { D[k] = o; };

  /* ---------- TORHOF: wenige, langsame, gut sichtbare Fallen ---------- */
  def("baerenfalle", {
    g: "torhof", n: ["Bärenfalle", "Bear trap"], d: ["Im Gras versteckt, aber sie blitzt. Drüberspringen – oder Goblins hineinlocken.", "Hidden in the grass, but it glints. Jump over it – or lure goblins in."],
    init(tr) { tr.st = "open"; tr.t = 0; tr.o = 1; },
    upd(tr, dt, P) {
      tr.t += dt;
      const r = box(tr.x - 6, tr.y - 4, 12, 4);
      if (tr.st === "open") {
        tr.o = U.approach(tr.o, 1, dt * 3);
        if (tr.o >= 1 && Math.random() < dt * 0.8 && near(tr.x, tr.y, 260)) FX.p({ x: tr.x + (Math.random() - 0.5) * 10, y: tr.y - 3, vx: 0, vy: 0, life: 0.35, size: 3, col: "#fff6d8", kind: "glow", add: true });
        let hit = null;
        if (P && P.onGround && ov(r, box(P.x + 2, P.y + P.h - 3, P.w - 4, 3))) hit = P;
        if (!hit) foes(e => !e.def.fly && ov(r, e), e => { if (!hit) hit = e; });
        if (hit) {
          tr.st = "shut"; tr.t = 0;
          play(amb("g_falle_", 3), tr.x, tr.y, { vol: 0.8 }); play("hitMetal", tr.x, tr.y, { vol: 0.4, rate: 1.4 });
          sparks(tr.x, tr.y - 5, 8, ["#fff", "#ffe0a0"], { sp: 90 });
          FX.burst(tr.x, tr.y - 2, 6, { col: ["#4f6b34", "#6a8a40"], sp: 60, ang: -Math.PI / 2, spread: 2, life: 0.6, size: 1.5, kind: "leaf", g: 200 });
          if (hit === P) { if (hp(0.07, tr.x, { kb: 30, kbUp: 40 })) { P.vx = 0; Z.addStatus(P, "web", 0.9, true); } }
          else he(tr, hit, 30, { kb: 0, kbUp: 0 }, { root: 2.4, bleed: 1 });
        }
      } else if (tr.st === "shut") {
        tr.o = U.approach(tr.o, 0, dt * 30);
        if (tr.t > 3.6) { tr.st = "reopen"; tr.t = 0; play(amb("g_knarren_", 5), tr.x, tr.y, { vol: 0.3 }); }
      } else if (tr.st === "reopen") { tr.o = U.approach(tr.o, 1, dt * 1.6); if (tr.o >= 1) tr.st = "open"; }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y;
      /* Kette zum Pflock */
      c.strokeStyle = "#3a3236"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y - 1); c.quadraticCurveTo(x + 6, y + 0.5, x + 11, y - 1); c.stroke();
      c.fillStyle = "#4a3a2c"; c.fillRect(x + 10, y - 5, 2, 5); c.fillStyle = "#8a1f24"; c.beginPath(); c.moveTo(x + 12, y - 5); c.lineTo(x + 16, y - 4 + Math.sin(t * 3) * 0.8); c.lineTo(x + 12, y - 3); c.fill(); /* rotes Warnläppchen */
      c.fillStyle = "#2a2226"; c.fillRect(x - 7, y - 1.2, 14, 1.2);
      const ang = tr.o * (Math.PI / 2 - 0.05);
      for (const s of [-1, 1]) {
        const a = Math.PI / 2 - ang, ex = x + s * Math.sin(Math.PI / 2 - a) * 0 + s * Math.cos(a) * 0, hx = x, hy = y - 1.5;
        const tx = hx + s * Math.sin(ang) * 7, ty = hy - Math.cos(ang) * 7;
        c.strokeStyle = "#5a5256"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + s * Math.sin(ang) * 4 - Math.cos(ang) * s * 1.5, hy - Math.cos(ang) * 4 - Math.sin(ang) * 1.5, tx, ty); c.stroke();
        c.fillStyle = "#c8c0b8";
        for (let i = 1; i <= 3; i++) { const k = i / 3.4, px = hx + (tx - hx) * k, py = hy + (ty - hy) * k, nx = -Math.cos(ang) * s, ny = -Math.sin(ang); c.beginPath(); c.moveTo(px - 0.8, py); c.lineTo(px + nx * 0 + (tr.o > 0.5 ? 0 : -s * 2.2), py + (tr.o > 0.5 ? -2.2 : 0)); c.lineTo(px + 0.8, py); c.fill(); void ex; void ny; }
      }
      circ(c, x, y - 1.5, 1.4, "#3a3236");
      if (!low) for (let i = -2; i <= 2; i++) { if (!i) continue; const gx = x + i * 4.5, sw = Math.sin(t * 2 + i) * 0.8; c.strokeStyle = i % 2 ? "#4f6b34" : "#6a8a40"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(gx, y); c.quadraticCurveTo(gx + sw, y - 3, gx + sw * 2 + (i > 0 ? 1 : -1), y - 5); c.stroke(); }
      if (tr.st === "open" && tr.o >= 1) { const k = (Math.sin(t * 2.2 + tr.x) + 1) / 2; if (k > 0.85) glow(c, x - 3, y - 3, 4, "rgba(255,246,216,.8)"); }
    }
  });

  def("fallgitter", {
    g: "torhof", n: ["Fallgitter", "Portcullis"], d: ["Kette rasselt, Staub rieselt – dann kracht das Gitter herab. Warte, bis es sich hebt.", "Chain rattles, dust trickles – then the gate slams down. Wait until it rises."],
    init(tr) { tr.top = api.ceilingAbove(tr.tx, tr.ty); tr.cyc = 6.4; tr.g = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, H = tr.y - tr.top - 6;
      let want;
      if (c < 3.6) want = 0;
      else if (c < 4.6) { want = 0.04 + Math.floor((c - 3.6) * 5) * 0.012; if (!tr.w) { tr.w = true; play("chain", tr.x, tr.top, { vol: 0.5, rate: 0.8 }); } if (Math.random() < dt * 14) FX.p({ x: tr.x + (Math.random() - 0.5) * 14, y: tr.top + 4, vx: 0, vy: 30, g: 300, life: 0.7, size: 1.1, col: "#8a7a70", kind: "shard" }); }
      else if (c < 5.5) want = 1;
      else want = U.clamp(1 - (c - 5.5) / 0.9, 0, 1);
      if (c < 3.6) tr.w = false;
      const prev = tr.g;
      tr.g = want === 1 && prev < 1 ? Math.min(1, prev + dt * 9) : want;
      if (prev < 1 && tr.g >= 1) { play("hitHeavy", tr.x, tr.y, { vol: 0.6, rate: 0.7 }); play("door", tr.x, tr.y, { vol: 0.4, rate: 0.7 }); FX.addShake(2); FX.burst(tr.x, tr.y - 1, 10, { col: ["#8a7a70", "#5a4a40"], sp: 70, ang: -Math.PI / 2, spread: 2.6, life: 0.6, size: 2, kind: "smoke" }); }
      const bot = tr.top + 6 + tr.g * H, col = box(tr.x - 7, tr.top, 14, bot - tr.top);
      if (P && ov(col, P)) {
        const falling = tr.g > prev + 0.001;
        if (falling && ov(col, HB(P))) hp(0.08, tr.x, { kb: 220, kbUp: 120 });
        if (tr.g > 0.6) { const s = pcx(P) < tr.x ? -1 : 1; P.x = s < 0 ? tr.x - 7 - P.w : tr.x + 7; P.vx = 0; }
      }
      foes(e => ov(col, e) && tr.g > 0.5, e => { if (tr.g > prev + 0.001) he(tr, e, 45, null, { stun: 1 }); const s = e.x + e.w / 2 < tr.x ? -1 : 1; e.x = s < 0 ? tr.x - 7 - e.w : tr.x + 7; });
    },
    draw(c, tr, t, low) {
      const H = tr.y - tr.top - 6, bot = tr.top + 6 + tr.g * H, x = tr.x;
      /* Führungsschienen */
      c.fillStyle = "#1a1416"; c.fillRect(x - 9, tr.top, 2, tr.y - tr.top); c.fillRect(x + 7, tr.top, 2, tr.y - tr.top);
      const jit = tr.g > 0 && tr.g < 0.2 ? (Math.random() - 0.5) : 0;
      /* Gitter */
      c.fillStyle = "#3a2a1e"; for (let i = 0; i < 4; i++) c.fillRect(x - 6 + i * 3.6 + jit, tr.top, 1.8, bot - tr.top);
      c.fillStyle = "#4a4448"; for (let y = bot - 4; y > tr.top; y -= 7) c.fillRect(x - 7 + jit, y, 14, 1.6);
      if (!low) { c.fillStyle = "rgba(255,230,190,.12)"; for (let i = 0; i < 4; i++) c.fillRect(x - 6 + i * 3.6 + jit, tr.top, 0.6, bot - tr.top); }
      c.fillStyle = "#8a8286"; for (let i = 0; i < 4; i++) { const sx = x - 5.1 + i * 3.6 + jit; c.beginPath(); c.moveTo(sx - 1.1, bot); c.lineTo(sx, bot + 3); c.lineTo(sx + 1.1, bot); c.fill(); }
      /* Sturz: Balken mit Eisenbändern */
      plank(c, x - 11, tr.top, 22, 5, "#5a3e28");
      c.fillStyle = "#3a3236"; c.fillRect(x - 8, tr.top, 2, 5); c.fillRect(x + 6, tr.top, 2, 5); circ(c, x - 7, tr.top + 2.5, 0.7, "#8a8286"); circ(c, x + 7, tr.top + 2.5, 0.7, "#8a8286");
      /* Vorwarnung: Schatten am Boden */
      const c2 = (clock + tr.ph) % tr.cyc;
      if (c2 > 3.6 && c2 < 4.7) shadow(c, x, tr.y, 9, 0.3 + (c2 - 3.6) * 0.3);
    }
  });

  def("ziegel", {
    g: "torhof", n: ["Lockere Dachziegel", "Loose roof tiles"], d: ["Bei Windböen klappern sie – dann rutschen sie vom Vordach.", "They rattle in gusts – then slide off the eave."],
    init(tr) { tr.tiles = [-5, 0, 5].map(o => ({ o, st: "on", a: 1 })); tr.st = "calm"; tr.t = 0; tr.next = 3 + Math.random() * 4; },
    upd(tr, dt, P) {
      tr.t += dt;
      if (tr.st === "calm") {
        const under = P && Math.abs(pcx(P) - tr.x) < 34 && P.y > tr.ay && P.y < tr.fy;
        if (tr.t > tr.next || (under && tr.t > 1.2)) { tr.st = "warn"; tr.t = 0; play(amb("n_windstoss_", 1), tr.x, tr.ay, { vol: 0.35 }); play(amb("g_knarren_", 5), tr.x, tr.ay, { vol: 0.3, rate: 1.4 }); }
      } else if (tr.st === "warn") {
        if (Math.random() < dt * 18) FX.p({ x: tr.x - 30 + Math.random() * 10, y: tr.ay + 4 + Math.random() * 20, vx: 90 + Math.random() * 40, vy: (Math.random() - 0.3) * 20, life: 0.9, size: 2, col: Math.random() < 0.5 ? "#6a8a40" : "#8a6a30", kind: "leaf", vr: 6 });
        if (tr.t > 0.85) {
          tr.st = "drop"; tr.t = 0; let n = 0;
          for (const z of tr.tiles) if (z.st === "on" && (n < 1 || Math.random() < 0.5)) { z.st = "fall"; z.x = tr.x + z.o; z.y = tr.ay + 4; z.vx = 25 + Math.random() * 25; z.vy = 20; z.r = 0; n++; }
          play("crate", tr.x, tr.ay, { vol: 0.25, rate: 1.6 });
        }
      } else if (tr.st === "drop") {
        let any = false;
        for (const z of tr.tiles) {
          if (z.st !== "fall") continue; any = true;
          z.vy += 900 * dt; z.x += z.vx * dt; z.y += z.vy * dt; z.r += dt * 9;
          const b = box(z.x - 3, z.y - 2, 6, 4);
          if (P && ov(b, HB(P))) { hp(0.06, z.x, { kb: 100, kbUp: 80 }); z.st = "gone"; shatterTile(z); continue; }
          let hitE = null; foes(e => ov(b, e), e => { hitE = e; }); if (hitE) { he(tr, hitE, 25, null, { stun: 0.6 }); z.st = "gone"; shatterTile(z); continue; }
          if (W.solidAt(z.x, z.y + 2) || z.y > tr.fy + 4) { z.st = "gone"; shatterTile(z); }
        }
        if (!any) { tr.st = "regrow"; tr.t = 0; }
      } else if (tr.st === "regrow" && tr.t > 3.5) { for (const z of tr.tiles) if (z.st === "gone") { z.st = "on"; z.a = 0; } tr.st = "calm"; tr.t = 0; tr.next = 4 + Math.random() * 5; }
      for (const z of tr.tiles) if (z.st === "on") z.a = Math.min(1, z.a + dt);
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.ay;
      plank(c, x - 12, y, 24, 3, "#5a3e28"); c.fillStyle = "#3a2a1e"; c.fillRect(x - 11, y + 3, 2, 3); c.fillRect(x + 9, y + 3, 2, 3);
      const shake = tr.st === "warn" ? 1 : 0;
      for (const z of tr.tiles) {
        if (z.st === "on") { c.save(); c.globalAlpha = z.a; drawTile(c, x + z.o + (shake ? (Math.random() - 0.5) * 1.4 : 0), y + 4.5, shake ? (Math.random() - 0.5) * 0.3 : 0.12); c.restore(); }
        else if (z.st === "fall") drawTile(c, z.x, z.y, z.r);
      }
      if (!low) { c.fillStyle = "#4f6b34"; c.fillRect(x - 9, y + 3, 3, 1); c.fillRect(x + 4, y + 3, 2, 1); }
      if (tr.st === "warn" || tr.st === "drop") shadow(c, x + 6, tr.fy, 10, tr.st === "warn" ? 0.2 + tr.t * 0.3 : 0.4);
    }
  });
  function drawTile(c, x, y, r) {
    c.save(); c.translate(x, y); c.rotate(r);
    c.fillStyle = "#5a2a1a"; c.beginPath(); c.moveTo(-3.6, -1.8); c.quadraticCurveTo(0, -3.4, 3.6, -1.8); c.lineTo(3.2, 2); c.quadraticCurveTo(0, 0.6, -3.2, 2); c.closePath(); c.fill();
    c.fillStyle = "#a8583a"; c.beginPath(); c.moveTo(-3.2, -1.6); c.quadraticCurveTo(0, -3, 3.2, -1.6); c.lineTo(2.9, 1.2); c.quadraticCurveTo(0, 0, -2.9, 1.2); c.closePath(); c.fill();
    c.fillStyle = "#d07a50"; c.fillRect(-2.4, -2.2, 3, 0.6);
    c.restore();
  }
  function shatterTile(z) { FX.burst(z.x, z.y, 8, { col: ["#a8583a", "#d07a50", "#5a2a1a"], sp: 90, ang: -Math.PI / 2, spread: 2.4, life: 0.5, size: 1.6, kind: "shard", g: 600 }); play("crate", z.x, z.y, { vol: 0.35, rate: 1.8 }); }

  /* ---------- KELLER: Gärfässer, rollende Fässer, Ratten ---------- */
  def("gaerfass", {
    g: "keller", n: ["Gärfass", "Fermenting cask"], d: ["Die Dauben knarren, Schaum quillt – gleich platzt der Spund und saures Gas schwappt heraus.", "The staves creak, foam bubbles – then the bung pops and sour gas spills out."],
    init(tr) { tr.cyc = 6.6; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      tr.sw = c > 4 && c < 5.2 ? (c - 4) / 1.2 : c >= 5.2 ? Math.max(0, 1 - (c - 5.2) * 3) : 0;
      if (c > 4 && c < 5.2) { if (!tr.w) { tr.w = true; play(amb("g_knarren_", 5), tr.x, tr.y, { vol: 0.45, rate: 0.8 }); play(amb("n_blubb_", 3), tr.x, tr.y, { vol: 0.35 }); } if (Math.random() < dt * 12) FX.p({ x: tr.x + 4, y: tr.y - 13, vx: 10, vy: -10, life: 0.6, size: 1.6, col: "#e8e0b0", kind: "bubble" }); }
      if (c >= 5.2 && c < 6.6) {
        if (!tr.b) { tr.b = true; play("explode", tr.x, tr.y, { vol: 0.25, rate: 1.8 }); Z.lightFlash && Z.lightFlash(tr.x, tr.y - 12, 50, "#b8c040", 0.6, 0.4); play(amb("n_zischen_", 5), tr.x, tr.y, { vol: 0.5 }); FX.burst(tr.x + 4, tr.y - 13, 1, { col: "#8a6a40", sp: 160, ang: -1.2, spread: 0.4, life: 0.8, size: 2.5, kind: "shard", g: 500 }); tr.hitP = false; }
        const r = 10 + Math.min(1, (c - 5.2) * 2) * 22;
        if (Math.random() < dt * 30) FX.p({ x: tr.x + (Math.random() - 0.5) * r, y: tr.y - 8 - Math.random() * r * 0.6, vx: (Math.random() - 0.5) * 30, vy: -8, life: 1.1, size: 6, col: "rgba(168,176,64,.5)", kind: "smoke", drag: 0.95 });
        if (P && !tr.hitP && circRect(tr.x, tr.y - 10, r, HB(P))) { tr.hitP = true; hp(0.05, tr.x, { kb: 60, kbUp: 60, eff: { poison: 2 } }); }
        foes(e => circRect(tr.x, tr.y - 10, r, e), e => he(tr, e, 20, { kb: 40 }, { poison: 3 }));
      } else { tr.b = false; if (c < 4) tr.w = false; }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, s = tr.sw || 0, jx = s > 0.5 ? (Math.random() - 0.5) * s : 0;
      const bulge = 1 + s * 0.14;
      c.fillStyle = "#1a120c"; c.beginPath(); c.ellipse(x + jx, y - 8, 7.5 * bulge + 0.6, 8.6, 0, 0, 6.283); c.fill();
      c.fillStyle = "#6a4428"; c.beginPath(); c.ellipse(x + jx, y - 8, 7 * bulge, 8, 0, 0, 6.283); c.fill();
      c.fillStyle = "#1a120c"; c.fillRect(x - 7, y - 1, 14, 1);
      if (!low) { c.strokeStyle = "rgba(30,18,10,.6)"; c.lineWidth = 0.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + jx + i * 2.6, y - 15.6); c.quadraticCurveTo(x + jx + i * 2.6 * bulge * 1.1, y - 8, x + jx + i * 2.6, y - 0.4); c.stroke(); } c.fillStyle = "rgba(255,220,170,.14)"; c.fillRect(x + jx - 4, y - 14, 1.4, 12); }
      c.fillStyle = "#3a3432"; for (const hy of [-13.5, -8.5, -3]) c.fillRect(x + jx - 6.6 * bulge, y + hy, 13.2 * bulge, 1.3);
      /* Spund und Kreidezeichen */
      circ(c, x + jx + 4, y - 12.5, 1.2, tr.c > 5.2 && tr.c < 6.6 ? "#1a120c" : "#a07a4a");
      if (!low) { c.strokeStyle = "rgba(230,220,200,.6)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - 3, y - 7); c.lineTo(x - 1, y - 5); c.moveTo(x - 1, y - 7); c.lineTo(x - 3, y - 5); c.moveTo(x, y - 7); c.lineTo(x + 2, y - 5); c.moveTo(x + 2, y - 7); c.lineTo(x, y - 5); c.stroke(); }
      if (s > 0) { c.fillStyle = "#e8e0b0"; circ(c, x + jx + 4, y - 14 - s, 1 + s, "#e8e0b0"); }
      if (tr.c > 5.2 && tr.c < 6.6) { const r = 10 + Math.min(1, (tr.c - 5.2) * 2) * 22, a = 0.28 * (1 - Math.max(0, tr.c - 6.1) * 2); c.save(); c.globalAlpha = a; ell(c, x, y - 10, r, r * 0.7, "#a8b040"); ell(c, x + 3, y - 14, r * 0.6, r * 0.45, "#c8c860"); c.restore(); }
    }
  });

  def("rollfass", {
    g: "keller", n: ["Rollendes Fass", "Rolling barrel"], d: ["Der Keil klopft, das Fass wackelt – dann rollt es los. Drüberspringen!", "The wedge knocks, the barrel wobbles – then it rolls. Jump!"],
    init(tr, R) { tr.dir = R() < 0.5 ? 1 : -1; tr.st = "wait"; tr.t = R() * 2; tr.bx = 0; tr.r = 0; },
    upd(tr, dt, P) {
      tr.t += dt; const sx = tr.dir > 0 ? tr.x0 + 10 : tr.x1 - 10, ex = tr.dir > 0 ? tr.x1 - 4 : tr.x0 + 4;
      if (tr.st === "wait") { tr.bx = sx; if (tr.t > 2.4 && !tr.w) { tr.w = true; play(amb("e_holzpoltern_", 7), sx, tr.y, { vol: 0.5 }); } if (tr.t > 3.2) { tr.st = "roll"; tr.t = 0; tr.v = 40; tr.w = false; } }
      else if (tr.st === "roll") {
        tr.v = Math.min(170, tr.v + 260 * dt); tr.bx += tr.dir * tr.v * dt; tr.r += tr.dir * tr.v * dt / 7;
        if (near(tr.bx, tr.y, 300) && Math.random() < dt * 6) play(amb("e_holzpoltern_", 7), tr.bx, tr.y, { vol: 0.2, gap: 0.15, tag: "roll" });
        if (Math.random() < dt * 20) FX.p({ x: tr.bx - tr.dir * 6, y: tr.y - 1, vx: -tr.dir * 20, vy: -15, life: 0.5, size: 2, col: "#6a5a48", kind: "smoke" });
        if (P && circRect(tr.bx, tr.y - 7, 7, HB(P))) hp(0.09, tr.bx - tr.dir * 10, { kb: 240, kbUp: 220 });
        foes(e => !e.def.fly && circRect(tr.bx, tr.y - 7, 7, e), e => he(tr, e, 45, { kb: 260 }, { stun: 0.8 }));
        if ((tr.dir > 0 && tr.bx >= ex) || (tr.dir < 0 && tr.bx <= ex) || W.solidAt(tr.bx + tr.dir * 8, tr.y - 7)) {
          tr.st = "broken"; tr.t = 0; play("crate", tr.bx, tr.y, { vol: 0.6 });
          FX.burst(tr.bx, tr.y - 7, 12, { col: ["#6a4428", "#3a3432", "#8a5a34"], sp: 130, ang: -Math.PI / 2, spread: 2.6, life: 0.7, size: 2.2, kind: "shard", g: 600 });
          FX.burst(tr.bx, tr.y - 4, 10, { col: ["#6a1420", "#8a2030"], sp: 80, ang: -Math.PI / 2, spread: 2.4, life: 0.5, size: 1.6, kind: "drop", g: 500 });
        }
      } else if (tr.st === "broken" && tr.t > 1.4) { tr.st = "wait"; tr.t = 0; }
    },
    draw(c, tr, t, low) {
      const sx = tr.dir > 0 ? tr.x0 + 10 : tr.x1 - 10, rx = sx - tr.dir * 6;
      /* Gestell mit Rampe */
      c.strokeStyle = "#3a2a1e"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(rx - 4, tr.y); c.lineTo(rx, tr.y - 12); c.lineTo(rx + 4, tr.y); c.stroke();
      plank(c, Math.min(rx, sx) - 3, tr.y - 3, 12, 1.6, "#5a3e28");
      if (tr.st !== "broken") {
        const wob = tr.st === "wait" && tr.t > 2.4 ? Math.sin(t * 40) * 0.15 : 0;
        const bx = tr.st === "wait" ? sx : tr.bx, by = tr.y - 7, r = tr.r + wob;
        c.save(); c.translate(bx, by); c.rotate(r);
        circ(c, 0, 0, 7.4, "#1a120c"); circ(c, 0, 0, 6.8, "#6a4428"); c.strokeStyle = "#3a3432"; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, 5.6, 0, 6.283); c.stroke();
        if (!low) { c.strokeStyle = "rgba(30,18,10,.7)"; c.lineWidth = 0.6; for (let i = 0; i < 6; i++) { const a = i * 1.047; c.beginPath(); c.moveTo(Math.cos(a) * 1.5, Math.sin(a) * 1.5); c.lineTo(Math.cos(a) * 5, Math.sin(a) * 5); c.stroke(); } }
        circ(c, 0, 0, 1.3, "#a07a4a"); c.restore();
        if (tr.st === "wait" && tr.t > 2.4) { c.fillStyle = "#8a5a34"; c.fillRect(sx + tr.dir * 7 - 1, tr.y - 3 - Math.abs(Math.sin(t * 30)) * 1.5, 2, 3); }
      }
    }
  });

  def("rattenloch", {
    g: "keller", n: ["Rattenloch", "Rat hole"], d: ["Rote Augen im Mauerloch, Fiepen – dann wuselt ein Schwarm über den Boden.", "Red eyes in the hole, squeaking – then a swarm scurries across the floor."],
    init(tr, R) { tr.cyc = 5.5 + R() * 2; tr.len = Math.min(96, (tr.run || 6) * T * 0.8); tr.rats = Array.from({ length: 7 }, (_, i) => ({ o: R() * 0.5, y: R() * 2, sp: 0.8 + R() * 0.4, i })); },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; const sw = tr.cyc - 2.4;
      if (c > sw - 1 && c < sw && !tr.w) { tr.w = true; play("rat", tr.wx, tr.y, { vol: 0.6 }); }
      if (c < sw - 1) tr.w = false;
      if (c >= sw) {
        const k = (c - sw) / 2.4;
        if (!tr.s) { tr.s = true; play(amb("n_ratte_", 6), tr.wx, tr.y, { vol: 0.6 }); }
        const reach = Math.sin(Math.min(1, k) * Math.PI) * tr.len;
        tr.reach = reach;
        const zone = tr.dir > 0 ? box(tr.wx, tr.y - 5, reach, 5) : box(tr.wx - reach, tr.y - 5, reach, 5);
        if (reach > 6) {
          if (P && ov(zone, HB(P))) hp(0.035, tr.wx, { kb: 60, kbUp: 120, eff: { bleed: 1 } });
          foes(e => !e.def.fly && ov(zone, e) && e.def.shape !== "ratte", e => he(tr, e, 15, { kb: 20 }, { bleed: 2 }));
        }
      } else { tr.s = false; tr.reach = 0; }
    },
    draw(c, tr, t, low) {
      const x = tr.wx, y = tr.y, d = tr.dir;
      /* Loch mit ausgebrochenen Steinen */
      c.fillStyle = "#4a3e34"; c.beginPath(); c.ellipse(x + d * 1, y - 4, 6, 6, 0, Math.PI, 0); c.fill();
      c.fillStyle = "#0a0606"; c.beginPath(); c.ellipse(x + d * 1, y - 0.5, 4.6, 4.8, 0, Math.PI, 0); c.fill();
      if (!low) { c.fillStyle = "#c8a860"; for (let i = 0; i < 4; i++) c.fillRect(x + d * (3 + i * 2), y - 0.8, 2, 0.6); }
      const c0 = tr.c || 0, sw = tr.cyc - 2.4;
      if (c0 > sw - 1.2 && c0 < sw + 0.3 || Math.sin(t * 0.7 + tr.ph) > 0.97) { const k = 0.6 + Math.sin(t * 8) * 0.4; for (let i = 0; i < 3; i++) { const ex = x + d * (0.5 + i * 1.2) - 1 + i, ey = y - 2.5 - (i % 2); circ(c, ex, ey, 0.55, "#ff3a2a"); circ(c, ex + 1.1, ey, 0.55, "#ff3a2a"); if (!low) glow(c, ex + 0.5, ey, 2.5, "rgba(255,60,40," + (0.5 * k).toFixed(2) + ")"); } }
      if (tr.reach > 2) for (const r of tr.rats) {
        const p = U.clamp(tr.reach * r.sp - r.o * 20, 0, tr.len), rx = x + d * (4 + p), ry = y - 1.6 - r.y * 0.6, bob = Math.abs(Math.sin(t * 30 + r.i)) * 0.6;
        if (p <= 0) continue;
        ell(c, rx, ry - bob, 2.6, 1.4, "#4a3e3a"); circ(c, rx + d * 2.4, ry - bob - 0.3, 1.1, "#5a4e48"); circ(c, rx + d * 3.1, ry - bob - 0.5, 0.35, "#ff6050");
        c.strokeStyle = "#c88a8a"; c.lineWidth = 0.4; c.beginPath(); c.moveTo(rx - d * 2.4, ry - bob); c.quadraticCurveTo(rx - d * 4, ry - 1 + Math.sin(t * 20 + r.i), rx - d * 5.5, ry); c.stroke();
      }
    }
  });

  /* ---------- BURGHALLEN: Kronleuchter, Rüstungen, Gobelins ---------- */
  def("kronleuchter", {
    g: "hallen", n: ["Kronleuchter", "Chandelier"], d: ["Kettenglieder springen, Wachs tropft – wer darunter steht, wird erschlagen.", "Chain links snap, wax drips – whoever stands beneath gets crushed."],
    init(tr) { tr.st = "hang"; tr.t = 0; tr.cl = U.clamp((tr.fy - tr.ay) * 0.35, 14, 44); tr.y = tr.ay + tr.cl; tr.vy = 0; },
    upd(tr, dt, P) {
      tr.t += dt; const top = tr.ay + tr.cl;
      if (tr.st === "hang") {
        tr.y = top; tr.sw = Math.sin(clock * 1.3 + tr.ph) * 0.04;
        if (P && Math.abs(pcx(P) - tr.x) < 26 && P.y > tr.y && P.y < tr.fy) { tr.st = "snap"; tr.t = 0; play("chain", tr.x, tr.ay, { vol: 0.6, rate: 1.3 }); play(amb("e_kette_", 4), tr.x, tr.ay, { vol: 0.4 }); }
      } else if (tr.st === "snap") {
        tr.sw = Math.sin(clock * 22) * 0.12 * tr.t; tr.y = top + Math.floor(tr.t * 5) * 1.2;
        if (Math.random() < dt * 14) FX.p({ x: tr.x + (Math.random() - 0.5) * 18, y: tr.y + 2, vx: 0, vy: 40, g: 500, life: 0.7, size: 1.2, col: "#f0e8c8", kind: "drop" });
        if (tr.t > 0.7) { tr.st = "fall"; tr.t = 0; tr.vy = 0; play("glass", tr.x, tr.y, { vol: 0.2, rate: 1.6 }); }
      } else if (tr.st === "fall") {
        tr.vy = Math.min(tr.vy + 1100 * dt, 700); tr.y += tr.vy * dt;
        const b = box(tr.x - 13, tr.y - 4, 26, 10);
        if (P && ov(b, HB(P))) hp(0.14, tr.x, { kb: 200, kbUp: 160 });
        foes(e => ov(b, e), e => he(tr, e, 60, null, { stun: 1.2, burn: 1 }));
        if (tr.y + 6 >= tr.fy) {
          tr.y = tr.fy - 6; tr.st = "down"; tr.t = 0;
          play("glass", tr.x, tr.y, { vol: 0.7 }); play("hitHeavy", tr.x, tr.y, { vol: 0.5, rate: 0.7 }); FX.addShake(3); Z.lightFlash && Z.lightFlash(tr.x, tr.fy - 8, 80, "#ffb050", 0.8, 0.5);
          FX.burst(tr.x, tr.fy - 2, 18, { col: ["#ffd27a", "#ff8a3a", "#f0e8c8"], sp: 150, ang: -Math.PI / 2, spread: 2.8, life: 0.6, size: 2, kind: "spark", add: true, g: 500 });
          const b2 = box(tr.x - 22, tr.fy - 14, 44, 14);
          if (P && ov(b2, HB(P))) hp(0.08, tr.x, { kb: 160, kbUp: 160, eff: { burn: 1 } });
          foes(e => ov(b2, e), e => he(tr, e, 30, null, { burn: 2 }));
        }
      } else if (tr.st === "down") {
        if (tr.t < 1.6) { const b = box(tr.x - 14, tr.fy - 6, 28, 6); if (P && ov(b, HB(P))) hp(0.04, tr.x, { kb: 120, kbUp: 160, eff: { burn: 1 } }); }
        if (tr.t > 5) { tr.st = "rehang"; tr.t = 0; }
      } else if (tr.st === "rehang") { tr.y = tr.ay - 10 + Math.min(1, tr.t / 1.6) * (tr.cl + 10); if (tr.t > 1.6) { tr.st = "hang"; tr.t = 0; } }
    },
    draw(c, tr, t, low) {
      const x = tr.x;
      if (tr.st === "down") {
        const a = tr.t > 4.4 ? Math.max(0, 1 - (tr.t - 4.4) / 0.6) : 1; c.save(); c.globalAlpha = a;
        c.strokeStyle = "#2a2226"; c.lineWidth = 1.6; c.beginPath(); c.ellipse(x, tr.fy - 2, 13, 2.4, 0.1, 0, 6.283); c.stroke();
        for (let i = 0; i < 4; i++) { c.fillStyle = "#e8dcc0"; c.save(); c.translate(x - 10 + i * 7, tr.fy - 2); c.rotate(1.2 + i * 0.4); c.fillRect(-0.8, -4, 1.6, 4); c.restore(); }
        if (tr.t < 1.6) for (let i = 0; i < 3; i++) glow(c, x - 8 + i * 8, tr.fy - 3, 6 + Math.sin(t * 20 + i) * 1.5, "rgba(255,150,40,.7)");
        c.restore(); return;
      }
      const y = tr.y;
      if (tr.st !== "fall") chain(c, x, tr.ay, x + Math.sin(tr.sw || 0) * (y - tr.ay), y - 6, "#6a5a3a", "#a8823a");
      c.save(); c.translate(x, y); c.rotate(tr.sw || 0);
      /* Kerzenkranz: Reif, geschwungene Arme, Spindel */
      c.strokeStyle = "#2a2226"; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, 13, 3, 0, 0, 6.283); c.stroke();
      c.strokeStyle = "#a8823a"; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 13, 3, 0, 0, 6.283); c.stroke();
      c.strokeStyle = "#6a5a3a"; c.lineWidth = 0.8; c.beginPath(); for (const s of [-1, 1]) { c.moveTo(0, -6); c.quadraticCurveTo(s * 8, -6, s * 12, -1); } c.stroke();
      c.fillStyle = "#5a4426"; c.fillRect(-1.2, -7, 2.4, 9); circ(c, 0, 3, 1.8, "#a8823a");
      for (let i = 0; i < 5; i++) {
        const cx = -11 + i * 5.5, cy = i === 0 || i === 4 ? -1 : -2.5 + (i === 2 ? -0.5 : 0);
        c.fillStyle = "#e8dcc0"; c.fillRect(cx - 0.9, cy - 4.5, 1.8, 4.5); c.fillStyle = "#c8b890"; c.fillRect(cx + 0.3, cy - 4.5, 0.6, 4.5);
        const f = Math.sin(t * 14 + i * 2) * 0.4;
        c.fillStyle = "#ffd27a"; c.beginPath(); c.ellipse(cx + f * 0.3, cy - 6, 0.9, 1.6, 0, 0, 6.283); c.fill(); c.fillStyle = "#fff6dc"; c.fillRect(cx - 0.3, cy - 6, 0.6, 1);
        if (!low) glow(c, cx, cy - 6, 5 + f, "rgba(255,190,90,.55)");
      }
      c.restore();
      if (tr.st === "snap" || tr.st === "fall") shadow(c, x, tr.fy, 14, tr.st === "fall" ? 0.5 : 0.2 + tr.t * 0.4);
    },
    light(tr, h) { if (tr.st !== "down" || tr.t < 1.6) h(tr.x, tr.st === "down" ? tr.fy - 4 : tr.y - 4, 70, 0.7, "#ffb050"); }
  });

  def("ruestung", {
    g: "hallen", n: ["Wachende Rüstung", "Watching armour"], d: ["Hinter dem Visier glimmt es rot, die Hellebarde hebt sich – dann schlägt sie zu. Gilt auch für Gegner davor.", "Something glows red behind the visor, the halberd rises – then it strikes. Works on enemies too."],
    init(tr, R) { tr.dir = R() < 0.5 ? 1 : -1; tr.st = "idle"; tr.t = 0; tr.arm = 0; },
    upd(tr, dt, P) {
      tr.t += dt;
      const front = box(tr.dir > 0 ? tr.x : tr.x - 40, tr.y - 34, 40, 34);
      if (tr.st === "idle") {
        tr.arm = U.approach(tr.arm, 0, dt * 2);
        let trig = P && ov(front, HB(P));
        if (!trig) foes(e => ov(front, e), () => { trig = true; });
        if (trig && tr.t > 0.5) { tr.st = "raise"; tr.t = 0; play(amb("g_ruestung_", 3), tr.x, tr.y, { vol: 0.6 }); }
      } else if (tr.st === "raise") { tr.arm = Math.min(1, tr.t / 0.7); if (tr.t > 0.75) { tr.st = "swing"; tr.t = 0; play("swingHeavy", tr.x, tr.y, { vol: 0.6, rate: 0.8 }); } }
      else if (tr.st === "swing") {
        tr.arm = 1 - Math.min(1, tr.t / 0.16) * 2.1;
        if (tr.t > 0.06 && tr.t < 0.22) {
          const hit = box(tr.dir > 0 ? tr.x + 6 : tr.x - 40, tr.y - 22, 34, 22);
          if (P && ov(hit, HB(P))) hp(0.12, tr.x, { kb: 240, kbUp: 180 });
          foes(e => ov(hit, e), e => he(tr, e, 50, { kb: 220 }, { bleed: 1 }));
        }
        if (tr.t > 0.18 && !tr.clang) { tr.clang = true; play("hitMetal", tr.x + tr.dir * 26, tr.y, { vol: 0.5, rate: 0.8 }); sparks(tr.x + tr.dir * 28, tr.y - 1, 8); FX.addShake(1.5); }
        if (tr.t > 1.4) { tr.st = "idle"; tr.t = 0; tr.clang = false; }
      }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, d = tr.dir;
      const S = spr("ruestung", 20, 34, (g) => {
        g.fillStyle = "#3a3236"; g.fillRect(3, 30, 14, 4); g.fillStyle = "#5a5256"; g.fillRect(3, 30, 14, 1);
        /* Beine, Rumpf, Schultern, Helm */
        g.fillStyle = "#4a4448"; g.fillRect(6.5, 20, 3, 10); g.fillRect(10.5, 20, 3, 10);
        g.fillStyle = "#8a8286"; g.fillRect(7, 20, 2, 9); g.fillRect(11, 20, 2, 9);
        g.fillStyle = "#4a4448"; g.beginPath(); g.moveTo(5, 10); g.lineTo(15, 10); g.lineTo(14, 21); g.lineTo(6, 21); g.closePath(); g.fill();
        g.fillStyle = "#9a9296"; g.beginPath(); g.moveTo(6, 10.5); g.lineTo(14, 10.5); g.lineTo(13.2, 20); g.lineTo(6.8, 20); g.closePath(); g.fill();
        g.fillStyle = "#d8d0d4"; g.fillRect(8, 11, 1, 8);
        g.fillStyle = "#8a1f24"; g.fillRect(6, 17, 8, 2);
        g.fillStyle = "#6a6266"; g.beginPath(); g.ellipse(5, 11, 2.8, 2, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(15, 11, 2.8, 2, 0, 0, 6.283); g.fill();
        g.fillStyle = "#5a5256"; g.beginPath(); g.arc(10, 6, 3.6, Math.PI, 0); g.lineTo(13.6, 9.5); g.lineTo(6.4, 9.5); g.closePath(); g.fill();
        g.fillStyle = "#aaa2a6"; g.fillRect(7, 3.4, 1, 5);
        g.fillStyle = "#120c0e"; g.fillRect(7, 6.2, 6, 1);
        g.fillStyle = "#8a1f24"; g.beginPath(); g.moveTo(10, 2.4); g.quadraticCurveTo(14, -0.5, 16, 3); g.quadraticCurveTo(13, 1.5, 10, 3.2); g.fill();
      });
      c.save(); c.translate(x, y); if (d < 0) c.scale(-1, 1);
      c.drawImage(S, -10, -34, 20, 34);
      /* Augen im Visier */
      if (tr.st !== "idle" || tr.arm > 0.05) { c.fillStyle = "#ff3a2a"; c.fillRect(-2.2, -27.8, 1.4, 0.8); c.fillRect(0.8, -27.8, 1.4, 0.8); if (!low) glow(c, 0, -27.4, 5, "rgba(255,50,40,.6)"); }
      /* Hellebarde am Schulterpunkt */
      const a = -0.25 - tr.arm * 1.1;
      c.translate(4, -22); c.rotate(a + Math.PI / 2 * 0);
      c.strokeStyle = "#5a3e28"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 8); c.lineTo(0, -22); c.stroke();
      c.fillStyle = "#4a4448"; c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(9, -20, 10, -13); c.quadraticCurveTo(6, -14, 0, -13); c.fill();
      c.fillStyle = "#c8c0c4"; c.beginPath(); c.moveTo(1, -17.5); c.quadraticCurveTo(8.6, -19, 9.4, -13.5); c.quadraticCurveTo(6, -15, 1, -14); c.fill();
      c.fillStyle = "#8a8286"; c.beginPath(); c.moveTo(-1, -21); c.lineTo(0, -27); c.lineTo(1, -21); c.fill();
      c.restore();
      if (tr.st === "swing" && tr.t < 0.2 && !low) { c.save(); c.globalAlpha = 0.25; c.strokeStyle = "#f0e8e0"; c.lineWidth = 6; c.beginPath(); c.arc(x + d * 4, y - 22, 26, d > 0 ? -1.4 : Math.PI + 1.4, d > 0 ? 0.6 : Math.PI - 0.6, d < 0); c.stroke(); c.restore(); }
    }
  });

  def("gobelin", {
    g: "hallen", n: ["Speerwand hinter dem Gobelin", "Spear wall behind the tapestry"], d: ["Der Wandteppich beult sich, Spitzen blitzen durch – dann stoßen Speere heraus.", "The tapestry bulges, tips glint through – then spears thrust out."],
    init(tr) { tr.cyc = 4.4; tr.ext = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      if (c > 2.6 && c < 3.4 && !tr.w) { tr.w = true; play(amb("e_tuch_", 3), tr.wx, tr.y, { vol: 0.5 }); play("unsheathe", tr.wx, tr.y, { vol: 0.3 }); }
      if (c < 2.6) tr.w = false;
      tr.ext = c < 3.4 ? 0 : c < 3.55 ? (c - 3.4) / 0.15 : c < 3.95 ? 1 : Math.max(0, 1 - (c - 3.95) / 0.25);
      if (c >= 3.4 && c < 3.45 && !tr.th) { tr.th = true; play("spear", tr.wx, tr.y, { vol: 0.6 }); } if (c < 3.4) tr.th = false;
      if (tr.ext > 0.6) {
        const L0 = 14 + 30 * tr.ext, r = tr.dir > 0 ? box(tr.wx, tr.y - 28, L0, 24) : box(tr.wx - L0, tr.y - 28, L0, 24);
        if (P && ov(r, HB(P))) hp(0.11, tr.wx, { kb: 230, kbUp: 120 });
        foes(e => ov(r, e), e => he(tr, e, 40, { kb: 220 }, { bleed: 2 }));
      }
    },
    draw(c, tr, t, low) {
      const x0 = tr.wx, d = tr.dir, y0 = tr.y - 34, H = 28, Wd = 14, c0 = tr.c || 0;
      const bul = c0 > 2.6 && c0 < 3.5 ? Math.min(1, (c0 - 2.6) / 0.6) : 0;
      /* Speere hinter dem Teppich */
      if (tr.ext > 0) for (let i = 0; i < 3; i++) {
        const sy = tr.y - 8 - i * 9, tip = x0 + d * (Wd + 30 * tr.ext);
        c.strokeStyle = "#5a3e28"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0, sy); c.lineTo(tip - d * 5, sy); c.stroke();
        c.fillStyle = "#c8c0c4"; c.beginPath(); c.moveTo(tip - d * 6, sy - 1.8); c.lineTo(tip, sy); c.lineTo(tip - d * 6, sy + 1.8); c.fill();
        c.fillStyle = "#4a4448"; c.fillRect(tip - d * 7 - 0.6, sy - 1, 1.2, 2);
      }
      /* Stange mit Knäufen */
      c.fillStyle = "#a8823a"; c.fillRect(Math.min(x0, x0 + d * (Wd + 2)), y0 - 1, Wd + 2, 1.6); circ(c, x0 + d * (Wd + 2), y0 - 0.2, 1.3, "#ffe0a0");
      /* Teppich in Streifen (Beule, Wehen) */
      const n = low ? 4 : 7;
      for (let i = 0; i < n; i++) {
        const k0 = i / n, k1 = (i + 1) / n, xa = x0 + d * Wd * k0, xb = x0 + d * Wd * k1;
        const off = Math.sin(t * 1.6 + i * 0.8) * 0.4 + bul * Math.sin(k0 * Math.PI) * 2.5;
        c.fillStyle = i % 2 ? "#7a1a20" : "#6a161c"; c.fillRect(Math.min(xa, xb), y0 + off * 0.3, Math.abs(xb - xa) + 0.3, H + off);
      }
      c.fillStyle = "#c8a040"; c.fillRect(Math.min(x0, x0 + d * Wd), y0, Wd, 1.2); c.fillRect(Math.min(x0, x0 + d * Wd), y0 + H - 1.5, Wd, 1.2);
      /* Spinnenwappen in Gold */
      const mx = x0 + d * Wd / 2, my = y0 + H / 2;
      circ(c, mx, my, 2, "#c8a040"); circ(c, mx, my + 2.6, 1.3, "#c8a040");
      if (!low) { c.strokeStyle = "#c8a040"; c.lineWidth = 0.5; c.beginPath(); for (const s of [-1, 1]) for (let j = 0; j < 4; j++) { c.moveTo(mx, my); c.lineTo(mx + s * 4.5, my - 3 + j * 2); c.lineTo(mx + s * 5.5, my - 1 + j * 2.2); } c.stroke(); }
      /* Fransen */
      c.fillStyle = "#c8a040"; for (let i = 0; i < 6; i++) c.fillRect(x0 + d * (1.5 + i * 2.2) - 0.3, y0 + H, 0.6, 2 + Math.sin(t * 3 + i) * 0.4);
      if (bul > 0.3 && !low) { c.fillStyle = "#f0ece8"; for (let i = 0; i < 3; i++) c.fillRect(x0 + d * (Wd + 0.5) - 0.5, tr.y - 9 - i * 9, 1, 1); glow(c, x0 + d * Wd, tr.y - 17, 10 * bul, "rgba(255,240,210,.35)"); }
    }
  });

  /* ---------- WEHRGANG: Pechnasen, Ballisten, Böen ---------- */
  def("pechnase", {
    g: "wehrgang", n: ["Pechnase", "Machicolation"], d: ["Es blubbert, glühende Tropfen fallen – dann ergießt sich heißes Pech. Die Lache klebt.", "It bubbles, glowing drops fall – then hot pitch pours down. The puddle sticks."],
    init(tr) { tr.cyc = 5.6; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      if (c > 3.3 && c < 4.3) { if (!tr.w) { tr.w = true; play(amb("n_blubb_", 3), tr.x, tr.ay, { vol: 0.5 }); } if (Math.random() < dt * 8) FX.p({ x: tr.x + (Math.random() - 0.5) * 6, y: tr.ay + 8, vx: 0, vy: 60, g: 600, life: 0.8, size: 1.5, col: "#ff8a3a", kind: "drop", add: true, collide: true }); }
      if (c < 3.3) tr.w = false;
      if (Math.random() < dt * 2 && near(tr.x, tr.ay)) puff(tr.x, tr.ay + 4, "rgba(60,50,50,.4)", 1, { vy: -15 });
      tr.pour = c >= 4.3 && c < 5.4;
      if (tr.pour) {
        if (!tr.p) { tr.p = true; play("fire", tr.x, tr.ay, { vol: 0.4, rate: 0.7 }); play(amb("e_brutzeln_", 2), tr.x, tr.fy, { vol: 0.5 }); pools.push({ x: tr.x, y: tr.fy, w: 30, t: 0, life: 3.2, col: "#1a1210", hot: true, cd: new WeakMap() }); }
        const r = box(tr.x - 4, tr.ay + 8, 8, tr.fy - tr.ay - 8);
        if (P && ov(r, HB(P))) hp(0.1, tr.x, { kb: 140, kbUp: 120, eff: { burn: 1 } });
        foes(e => ov(r, e), e => he(tr, e, 35, null, { burn: 2, slow: 2 }));
        if (Math.random() < dt * 30) FX.p({ x: tr.x + (Math.random() - 0.5) * 10, y: tr.fy - 2, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, g: 500, life: 0.5, size: 1.4, col: Math.random() < 0.3 ? "#ff8a3a" : "#1a1210", kind: "drop" });
      } else tr.p = false;
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.ay, c0 = tr.c || 0, tilt = c0 > 3.3 && c0 < 5.4 ? Math.min(1, (c0 - 3.3) / 1) : 0;
      /* Kragsteine und Kasten */
      c.fillStyle = "#3a3438"; c.fillRect(x - 11, y, 22, 7); c.fillStyle = "#6a6266"; c.fillRect(x - 11, y, 22, 1.2);
      c.fillStyle = "#4a4448"; c.beginPath(); c.moveTo(x - 11, y + 7); c.lineTo(x - 8, y + 10); c.lineTo(x - 6, y + 7); c.fill(); c.beginPath(); c.moveTo(x + 11, y + 7); c.lineTo(x + 8, y + 10); c.lineTo(x + 6, y + 7); c.fill();
      c.fillStyle = "#0e0a0a"; c.fillRect(x - 5, y + 6, 10, 3);
      /* Kessel kippt */
      c.save(); c.translate(x, y + 5); c.rotate(-tilt * 0.6);
      c.fillStyle = "#2a2426"; c.beginPath(); c.arc(0, 0, 4.5, 0, Math.PI); c.fill(); c.fillStyle = "#5a5256"; c.fillRect(-5, -0.8, 10, 1.2);
      c.fillStyle = tilt > 0 ? "#ff8a3a" : "#3a2a20"; c.fillRect(-3.5, -1.2, 7, 0.8);
      c.restore();
      if (tilt > 0 && !low) glow(c, x, y + 8, 6 + tilt * 4, "rgba(255,130,40,.5)");
      if (tr.pour) {
        const top = y + 9, bot = tr.fy, w = 3 + Math.sin(t * 30) * 0.6;
        c.fillStyle = "#120c0a"; c.fillRect(x - w, top, w * 2, bot - top);
        c.fillStyle = "#ff8a3a"; for (let yy = top + ((t * 260) % 12); yy < bot; yy += 12) c.fillRect(x - 0.8 + Math.sin(yy * 0.3) * 1.2, yy, 1.4, 4);
        glow(c, x, bot - 4, 14, "rgba(255,120,40,.5)");
      } else if (c0 > 3.3) shadow(c, x, tr.fy, 12, 0.15 + (c0 - 3.3) * 0.25);
    },
    light(tr, h) { if (tr.pour) h(tr.x, tr.fy - 10, 50, 0.6, "#ff8a3a"); else if ((tr.c || 0) > 3.3) h(tr.x, tr.ay + 8, 26, 0.5, "#ff8a3a"); }
  });

  def("balliste", {
    g: "wehrgang", n: ["Wandballiste", "Wall ballista"], d: ["Die Winde knarrt, eine glimmende Ziellinie erscheint – dann schießt ein Bolzen quer durch den Gang. Durchbohrt Gegner.", "The winch creaks, a glowing aim line appears – then a bolt flies across. Pierces enemies."],
    init(tr) { tr.cyc = 4.8; tr.ly = tr.y - 13; tr.range = rangeTo(tr.wx, tr.ly, tr.dir, 14 * T); },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; tr.aim = c > 3.3 && c < 4.3 ? (c - 3.3) : 0;
      if (tr.aim && !tr.w) { tr.w = true; play(amb("g_knarren_", 5), tr.wx, tr.y, { vol: 0.55, rate: 0.7 }); }
      if (c < 3.3) tr.w = false;
      if (c >= 4.3 && !tr.f) {
        tr.f = true; play("xbow", tr.wx, tr.y, { vol: 0.7, rate: 0.8 }); FX.addShake(1);
        shots.push({ k: "bolzen", x: tr.wx + tr.dir * 10, y: tr.ly, vx: tr.dir * 560, vy: 0, g: 0, frac: 0.13, edmg: 55, src: tr, life: 2, hitP: false, pierce: true });
      }
      if (c < 4.3) tr.f = false;
    },
    draw(c, tr, t, low) {
      const x = tr.wx, y = tr.ly, d = tr.dir, c0 = tr.c || 0, pull = c0 < 3.3 ? Math.min(1, c0 / 3) : c0 < 4.3 ? 1 : 0;
      if (tr.aim > 0) { c.save(); c.globalAlpha = 0.15 + tr.aim * 0.5 * (0.7 + Math.sin(t * 30) * 0.3); c.strokeStyle = "#ff6a2a"; c.lineWidth = 0.8; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(x + d * 12, y); c.lineTo(x + d * tr.range, y); c.stroke(); c.setLineDash([]); c.restore(); }
      /* Schaft aus der Wand */
      plank(c, Math.min(x, x + d * 14), y - 1.5, 14, 3, "#6a4a30");
      c.fillStyle = "#3a3236"; c.fillRect(x + d * 2 - 1, y - 3, 2, 6); c.fillRect(x + d * 10 - 1, y - 2.5, 2, 5);
      /* Bogenarme */
      const bx = x + d * 11, bend = 2 + pull * 3;
      c.strokeStyle = "#4a3426"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx - d * bend, y - 9); c.quadraticCurveTo(bx + d * 1.5, y - 4, bx, y); c.quadraticCurveTo(bx + d * 1.5, y + 4, bx - d * bend, y + 9); c.stroke();
      c.fillStyle = "#8a8286"; c.fillRect(bx - d * bend - 1, y - 10, 2, 2); c.fillRect(bx - d * bend - 1, y + 8, 2, 2);
      c.strokeStyle = "#d8c8a0"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(bx - d * bend, y - 9); c.lineTo(x + d * (11 - 6 * pull), y); c.lineTo(bx - d * bend, y + 9); c.stroke();
      /* Bolzen eingelegt */
      if (c0 > 1 && c0 < 4.3) { c.fillStyle = "#5a3e28"; c.fillRect(Math.min(x + d * (11 - 6 * pull), x + d * 18), y - 0.6, Math.abs(d * (18 - 11 + 6 * pull)), 1.2); c.fillStyle = "#c8c0c4"; c.beginPath(); c.moveTo(x + d * 18, y - 1.6); c.lineTo(x + d * 21, y); c.lineTo(x + d * 18, y + 1.6); c.fill(); }
      /* Kurbel */
      c.save(); c.translate(x + d * 5, y + 4); c.rotate(c0 < 3.3 ? c0 * 6 : 0); c.strokeStyle = "#5a5256"; c.lineWidth = 0.8; c.beginPath(); c.arc(0, 0, 2.4, 0, 6.283); c.moveTo(-2.4, 0); c.lineTo(2.4, 0); c.moveTo(0, -2.4); c.lineTo(0, 2.4); c.stroke(); c.restore();
    },
    light(tr, h) { if (tr.aim > 0.4) h(tr.wx + tr.dir * 12, tr.ly, 20, 0.5, "#ff6a2a"); }
  });

  def("boee", {
    g: "wehrgang", n: ["Windböe", "Gust"], d: ["Wimpel flattern, Blätter und Asche treiben vor – dann schiebt dich der Wind. Gegner auch.", "Pennants flap, leaves and ash drift ahead – then the wind shoves you. Enemies too."],
    init(tr, R) { tr.cyc = 6.5 + R() * 2; tr.dir = R() < 0.5 ? 1 : -1; tr.str = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, g = tr.cyc - 1.9; tr.c = c;
      if (c < 0.1 && !tr.flip) { tr.flip = true; if (Math.random() < 0.5) tr.dir *= -1; } if (c > 0.2) tr.flip = false;
      const warn = c > g - 1 && c < g;
      tr.str = c >= g ? Math.min(1, (c - g) * 4) * Math.min(1, (tr.cyc - c) * 3) : warn ? 0.15 : 0;
      const biome = Z.level && Z.level.biome, col = biome === "zinnen" ? ["#8a7a70", "#5a5050"] : biome === "sturm" ? ["#d8d0c8", "#a8a098"] : ["#6a8a40", "#8a6a30"];
      if ((warn || tr.str > 0.2) && near((tr.x0 + tr.x1) / 2, tr.y, 500)) {
        if (warn && !tr.w) { tr.w = true; play(amb("n_windstoss_", 1), (tr.x0 + tr.x1) / 2, tr.y, { vol: 0.6 }); play(amb("e_windstoss_", 1), (tr.x0 + tr.x1) / 2, tr.y, { vol: 0.4 }); }
        if (Math.random() < dt * (warn ? 10 : 40)) FX.p({ x: tr.dir > 0 ? tr.x0 + Math.random() * 30 : tr.x1 - Math.random() * 30, y: tr.y - 4 - Math.random() * 56, vx: tr.dir * (120 + Math.random() * 120) * (warn ? 0.6 : 1.4), vy: (Math.random() - 0.5) * 30, life: 1, size: biome === "sturm" ? 1.2 : 2, col: col[(Math.random() * 2) | 0], kind: biome === "sturm" ? "spark" : biome === "zinnen" ? "dot" : "leaf", vr: 8, drag: 0.99 });
      }
      if (c < g - 1) tr.w = false;
      if (tr.str > 0.2) {
        const zone = box(tr.x0 - 8, tr.y - 72, tr.x1 - tr.x0 + 16, 72);
        if (P && ov(zone, P) && !P.climbing) { shove(P, tr.dir * 78 * tr.str * dt); if (!P.onGround) P.vy -= 140 * tr.str * dt; }
        foes(e => ov(zone, e), e => shove(e, tr.dir * (e.def.fly ? 120 : 60) * tr.str * dt));
      }
    },
    draw(c, tr, t, low) {
      const k = tr.str || 0, c0 = tr.c || 0, warn = c0 > tr.cyc - 2.9 && c0 < tr.cyc - 1.9;
      /* Wimpel an einer Stange: zeigt die kommende Böe */
      const px = tr.dir > 0 ? tr.x0 + 4 : tr.x1 - 4, py = tr.y;
      c.fillStyle = "#3a2a1e"; c.fillRect(px - 0.7, py - 26, 1.4, 26);
      const fl = warn ? 0.6 : k > 0.2 ? 1 : 0.15, n = 5;
      c.fillStyle = "#8a1f24"; c.beginPath(); c.moveTo(px, py - 26);
      for (let i = 1; i <= n; i++) { const xx = px + tr.dir * i * 2.4 * (0.4 + fl * 0.7), yy = py - 26 + i * (1.4 - fl) * 1.2 + Math.sin(t * (6 + fl * 14) + i) * (0.4 + fl); c.lineTo(xx, yy); }
      c.lineTo(px, py - 21); c.closePath(); c.fill();
      if (k > 0.2 && !low) {
        c.save(); c.globalAlpha = 0.22 * k; c.strokeStyle = "#f0e8e0"; c.lineWidth = 0.8;
        for (let i = 0; i < 6; i++) { const ph = ((t * 1.8 + i * 0.37) % 1), wx = tr.x0 + (tr.dir > 0 ? ph : 1 - ph) * (tr.x1 - tr.x0), wy = tr.y - 10 - (i * 11) % 60; c.beginPath(); c.moveTo(wx - tr.dir * 14, wy); c.quadraticCurveTo(wx, wy - 3, wx + tr.dir * 8, wy + 1); c.stroke(); }
        c.restore();
      }
    }
  });

  /* ---------- VERLIES: Folterrad, Bodenluke, Kettenmorgenstern ---------- */
  def("folterrad", {
    g: "verlies", n: ["Folterrad", "Torture wheel"], d: ["Es klackert schneller, die Klingen fahren aus – im Langsamlauf kommt man vorbei.", "It clicks faster, the blades extend – slip past while it turns slowly."],
    init(tr) { tr.cyc = 4.2; tr.hy = tr.y - 20; tr.rot = 0; tr.ext = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      const fast = c > 2.5 && c < 3.9; tr.ext = c < 1.9 ? 0 : c < 2.5 ? (c - 1.9) / 0.6 * 0.5 : fast ? 1 : Math.max(0, 1 - (c - 3.9) / 0.3);
      tr.rot += dt * (fast ? 9 : 1.3 + tr.ext * 3);
      if (c > 1.9 && c < 2.5 && Math.random() < dt * 10) play(amb("e_riegel_", 4), tr.x, tr.hy, { vol: 0.25, gap: 0.08, rate: 1.4 });
      if (fast && Math.random() < dt * 3) play("swing", tr.x, tr.hy, { vol: 0.3, rate: 0.7 });
      if (tr.ext > 0.6) {
        const R = 11 + tr.ext * 11;
        const hitIt = b => { const nx = U.clamp(tr.x, b.x, b.x + b.w), ny = U.clamp(tr.hy, b.y, b.y + b.h), dd = Math.hypot(tr.x - nx, tr.hy - ny); return dd < R; }; /* auch wer direkt an der Nabe klebt, wird getroffen */
        if (P && hitIt(HB(P))) hp(0.12, tr.x, { kb: 220, kbUp: 200, eff: { bleed: 1 } });
        foes(e => hitIt(e), e => he(tr, e, 40, null, { bleed: 2 }));
      }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.hy;
      c.strokeStyle = "#3a2a1e"; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 9, tr.y); c.lineTo(x, y); c.lineTo(x + 9, tr.y); c.stroke();
      c.save(); c.translate(x, y); c.rotate(tr.rot);
      const R = 11 + tr.ext * 11;
      for (let i = 0; i < 6; i++) { c.save(); c.rotate(i * 1.047); c.fillStyle = "#4a4448"; c.fillRect(8, -1, R - 8 - 3, 2); c.fillStyle = "#b8b0a8"; c.beginPath(); c.moveTo(R - 4, -2.6); c.quadraticCurveTo(R + 1, -1, R, 0.6); c.lineTo(R - 4, 1.2); c.closePath(); c.fill(); if (!low) { c.fillStyle = "#8a1414"; c.fillRect(R - 3, -1.8, 1.4, 1); } c.restore(); }
      c.strokeStyle = "#2a1e16"; c.lineWidth = 3.6; c.beginPath(); c.arc(0, 0, 9, 0, 6.283); c.stroke();
      c.strokeStyle = "#5a3e28"; c.lineWidth = 2.6; c.beginPath(); c.arc(0, 0, 9, 0, 6.283); c.stroke();
      c.strokeStyle = "#3a3236"; c.lineWidth = 0.8; c.beginPath(); c.arc(0, 0, 9, 0, 6.283); c.stroke();
      c.strokeStyle = "#4a3426"; c.lineWidth = 1.4; c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * 0.785; c.moveTo(Math.cos(a) * -8, Math.sin(a) * -8); c.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); } c.stroke();
      circ(c, 0, 0, 2.4, "#3a3236"); circ(c, 0, 0, 1, "#8a8286");
      c.restore();
      if (tr.ext > 0.9 && !low) { c.save(); c.globalAlpha = 0.18; c.strokeStyle = "#e8e0d8"; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 20, 0, 6.283); c.stroke(); c.restore(); }
    }
  });

  def("bodenluke", {
    g: "verlies", n: ["Bodenluke", "Trapdoor"], d: ["Die Bretter knarren unter dir – gleich klappt die Luke über der Stachelgrube auf. Weiter!", "The boards creak under you – then the hatch opens over a spike pit. Keep moving!"],
    init(tr) { tr.st = "zu"; tr.t = 0; tr.o = 0; },
    upd(tr, dt, P) {
      tr.t += dt; const top = box(tr.x - 12, tr.y - 3, 24, 3);
      if (tr.st === "zu") {
        let on = P && P.onGround && ov(top, box(P.x, P.y + P.h - 2, P.w, 3));
        if (!on) foes(e => !e.def.fly && ov(top, box(e.x, e.y + e.h - 2, e.w, 3)), () => { on = true; });
        if (on) { tr.st = "knarr"; tr.t = 0; play(amb("e_tuerknarren_", 4), tr.x, tr.y, { vol: 0.6, rate: 1.2 }); }
      } else if (tr.st === "knarr") { if (Math.random() < dt * 20) FX.p({ x: tr.x + (Math.random() - 0.5) * 22, y: tr.y, vx: 0, vy: 20, g: 300, life: 0.4, size: 1, col: "#5a4a3a", kind: "shard" }); if (tr.t > 0.55) { tr.st = "auf"; tr.t = 0; play("door", tr.x, tr.y, { vol: 0.5 }); play("chain", tr.x, tr.y, { vol: 0.3, rate: 1.7 }); } }
      else if (tr.st === "auf") {
        tr.o = Math.min(1, tr.o + dt * 8);
        if (tr.t < 0.5) { const pit = box(tr.x - 11, tr.y - 8, 22, 8); if (P && ov(pit, HB(P))) hp(0.12, tr.x, { kb: 120, kbUp: 320, eff: { bleed: 1 } }); foes(e => !e.def.fly && ov(pit, e), e => he(tr, e, 45, { kbUp: 260 }, { bleed: 2 })); }
        if (tr.t > 2.4) { tr.st = "schliessen"; tr.t = 0; }
      } else if (tr.st === "schliessen") { tr.o = Math.max(0, tr.o - dt * 2.5); if (tr.o <= 0) { tr.st = "zu"; tr.t = 0; play("doorClose", tr.x, tr.y, { vol: 0.3 }); } }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, sag = tr.st === "knarr" ? 0.8 : 0;
      if (tr.o > 0) {
        c.fillStyle = "#0a0606"; c.fillRect(x - 11, y - 0.5, 22, 9);
        const sp = Math.min(1, tr.o * 1.5) * (tr.st === "auf" && tr.t < 0.6 ? 1 : 0.6);
        for (let i = 0; i < 6; i++) { const sx = x - 9 + i * 3.6; c.fillStyle = "#6a625a"; c.beginPath(); c.moveTo(sx - 1.4, y + 8); c.lineTo(sx, y + 8 - 12 * sp); c.lineTo(sx + 1.4, y + 8); c.fill(); c.fillStyle = "#8a1414"; c.fillRect(sx - 0.5, y + 8 - 12 * sp, 1, 2.5 * sp); }
        /* Klappen hängen nach unten */
        for (const s of [-1, 1]) { c.save(); c.translate(x + s * 11, y); c.rotate(s * -tr.o * 1.45); plank(c, s < 0 ? 0 : -11, -1, 11, 2.2, "#5a3e28"); c.restore(); }
        return;
      }
      plank(c, x - 11, y - 1.6 + sag, 22, 2.2, "#5a3e28");
      c.fillStyle = "#1a1210"; c.fillRect(x - 0.3, y - 1.6 + sag, 0.6, 2.2);
      c.fillStyle = "#3a3236"; c.fillRect(x - 8, y - 1.6 + sag, 1.6, 2.2); c.fillRect(x + 6.4, y - 1.6 + sag, 1.6, 2.2);
      if (!low) { c.strokeStyle = "#6a6266"; c.lineWidth = 0.6; c.beginPath(); c.arc(x + 3, y - 1.6 + sag, 1.4, Math.PI, 0); c.stroke(); }
    }
  });

  def("morgenstern", {
    g: "verlies", n: ["Kettenmorgenstern", "Chained morningstar"], d: ["Die Kette klirrt, Rost rieselt – dann saust die Stachelkugel herab.", "The chain clinks, rust trickles – then the spiked ball plunges."],
    init(tr) { tr.cyc = 4.6; tr.rest = tr.ay + 16; tr.by = tr.rest; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, low = tr.fy - 8; tr.c = c;
      tr.sx = Math.sin(clock * 1.6 + tr.ph) * 2;
      if (c < 2.6) tr.by = tr.rest;
      else if (c < 3.3) { tr.by = tr.rest + (Math.random() - 0.5); if (!tr.w) { tr.w = true; play("chain", tr.x, tr.ay, { vol: 0.5, rate: 0.9 }); } if (Math.random() < dt * 12) FX.p({ x: tr.x + (Math.random() - 0.5) * 6, y: tr.rest + 6, vx: 0, vy: 30, g: 300, life: 0.7, size: 1, col: "#8a4a2a", kind: "shard" }); }
      else if (c < 3.5) { const k = (c - 3.3) / 0.2; tr.by = tr.rest + (low - tr.rest) * k * k; tr.sx = 0; }
      else if (c < 3.8) { tr.by = low; tr.sx = 0; if (!tr.imp) { tr.imp = true; play("hitHeavy", tr.x, low, { vol: 0.7 }); play("rock", tr.x, low, { vol: 0.4 }); FX.addShake(2.5); FX.burst(tr.x, tr.fy - 1, 12, { col: ["#6a5a50", "#4a3e38"], sp: 90, ang: -Math.PI / 2, spread: 2.8, life: 0.6, size: 2, kind: "smoke" }); } }
      else { tr.by = low + (tr.rest - low) * (c - 3.8) / 0.8; if (Math.random() < dt * 8) play(amb("n_kette_", 4), tr.x, tr.ay, { vol: 0.15, gap: 0.12 }); }
      if (c < 2.6) { tr.w = false; tr.imp = false; }
      if (c > 3.3 && c < 3.85) {
        if (P && circRect(tr.x, tr.by, 8, HB(P))) hp(0.15, tr.x, { kb: 200, kbUp: 180 });
        foes(e => circRect(tr.x, tr.by, 8, e), e => he(tr, e, 60, null, { stun: 1 }));
      }
    },
    draw(c, tr, t, low) {
      const x = tr.x + (tr.sx || 0), y = tr.by;
      c.fillStyle = "#2a2226"; c.fillRect(tr.x - 4, tr.ay, 8, 3); circ(c, tr.x, tr.ay + 3, 1.6, "#5a5256");
      chain(c, tr.x, tr.ay + 3, x, y - 6, "#5a524e", "#8a8286");
      c.fillStyle = "#3a3236"; for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.2; c.beginPath(); c.moveTo(x + Math.cos(a - 0.25) * 5, y + Math.sin(a - 0.25) * 5); c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); c.lineTo(x + Math.cos(a + 0.25) * 5, y + Math.sin(a + 0.25) * 5); c.fill(); }
      circ(c, x, y, 6, "#2a2426"); circ(c, x - 0.6, y - 0.6, 5.2, "#4a4448");
      if (!low) { circ(c, x - 2, y - 2, 1.6, "#8a8286"); c.fillStyle = "rgba(150,70,30,.6)"; c.fillRect(x + 1, y + 1, 2.5, 1.5); }
      const c0 = tr.c || 0; if (c0 > 2.6 && c0 < 3.5) shadow(c, tr.x, tr.fy, 9, 0.2 + (c0 - 2.6) * 0.4);
    }
  });

  /* ---------- HAFEN: Kranhaken, Tentakel, Fischernetz ---------- */
  def("kranhaken", {
    g: "hafen", n: ["Kranhaken mit Fracht", "Crane hook with cargo"], d: ["Das Tau knarrt an jedem Umkehrpunkt – die Kiste schwingt schwer durch den Gang.", "The rope creaks at every turn – the crate swings heavily through the passage."],
    init(tr, R) { tr.len = U.clamp(tr.fy - tr.ay - 20, 50, 190); tr.amp = 0.8 + R() * 0.15; tr.per = 2.8 + R() * 0.6; tr.bx = tr.x; tr.by = tr.ay + tr.len; },
    upd(tr, dt, P) {
      const a = Math.sin(clock * 6.283 / tr.per + tr.ph) * tr.amp; tr.a = a;
      tr.bx = tr.x + Math.sin(a) * tr.len; tr.by = tr.ay + Math.cos(a) * tr.len;
      if (Math.abs(a) > tr.amp * 0.96 && !tr.cr) { tr.cr = true; play(amb("n_knarren_", 22), tr.x, tr.ay, { vol: 0.35 }); } else if (Math.abs(a) < tr.amp * 0.8) tr.cr = false;
      if (P && circRect(tr.bx, tr.by + 6, 10, HB(P))) hp(0.12, tr.bx, { kb: 230, kbUp: 200 });
      foes(e => circRect(tr.bx, tr.by + 6, 10, e), e => he(tr, e, 40, { kb: 240 }));
    },
    draw(c, tr, t, low) {
      plank(c, tr.x - 10, tr.ay, 20, 4, "#5a3e28");
      circ(c, tr.x, tr.ay + 5, 3.4, "#3a2a1e"); circ(c, tr.x, tr.ay + 5, 2.4, "#7a5634"); circ(c, tr.x, tr.ay + 5, 0.8, "#2a1e16");
      rope(c, tr.x, tr.ay + 5, tr.bx, tr.by - 3, "#c8a870");
      c.save(); c.translate(tr.bx, tr.by); c.rotate(tr.a * 0.6);
      c.strokeStyle = "#4a4448"; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 2.6, -Math.PI * 0.2, Math.PI * 1.1); c.stroke();
      c.strokeStyle = "#c8a870"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 1); c.lineTo(-6, 4); c.moveTo(0, 1); c.lineTo(6, 4); c.stroke();
      plank(c, -7, 4, 14, 10, "#7a5634"); c.fillStyle = "#3a2a1e"; c.fillRect(-7, 8.5, 14, 1); if (!low) { c.strokeStyle = "rgba(30,20,10,.6)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-6, 5); c.lineTo(6, 13); c.stroke(); c.fillStyle = "#e8d8b0"; c.fillRect(-2, 10.5, 4, 2); }
      c.restore();
    }
  });

  def("tentakel", {
    g: "hafen", n: ["Tentakel im Hafenbecken", "Harbour tentacle"], d: ["Blasen und Ringe im Wasserloch – dann peitscht ein Fangarm heraus. Er packt auch Gegner.", "Bubbles and rings in the water hole – then a tentacle lashes out. It grabs enemies too."],
    init(tr) { tr.cyc = 5.4; tr.h = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      if (c > 3 && c < 4) { if (!tr.w) { tr.w = true; play(amb("n_blubb_", 3), tr.x, tr.y, { vol: 0.5 }); } if (Math.random() < dt * 10) FX.p({ x: tr.x + (Math.random() - 0.5) * 10, y: tr.y - 1, vx: 0, vy: -20, life: 0.5, size: 1.5, col: "#d8c8c0", kind: "bubble" }); }
      if (c < 3) tr.w = false;
      tr.h = c < 4 ? 0 : c < 4.3 ? (c - 4) / 0.3 : c < 5.05 ? 1 : Math.max(0, 1 - (c - 5.05) / 0.35);
      if (c >= 4 && !tr.s) { tr.s = true; play("splash", tr.x, tr.y, { vol: 0.7 }); FX.burst(tr.x, tr.y - 2, 14, { col: ["#4a2a34", "#c8b8b0"], sp: 120, ang: -Math.PI / 2, spread: 1.6, life: 0.6, size: 1.8, kind: "drop", g: 500 }); }
      if (c < 4) tr.s = false;
      tr.sw = c > 4.2 ? Math.sin((c - 4.2) * 9) : 0;
      if (tr.h > 0.5) {
        const pts = tentPts(tr);
        for (let i = 3; i < pts.length; i += 2) { const p = pts[i]; if (P && circRect(p[0], p[1], 5, HB(P))) { hp(0.11, tr.x, { kb: 220, kbUp: 220 }); break; } }
        foes(e => pts.some((p, i) => i > 2 && circRect(p[0], p[1], 5, e)), e => he(tr, e, 40, { kb: 200 }, { slow: 2 }));
      }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y;
      /* Wasserloch in den Planken */
      ell(c, x, y - 0.5, 11, 2.6, "#1a0e14"); ell(c, x, y - 0.8, 9.5, 2, "#3a1e2a");
      if (!low) { c.strokeStyle = "rgba(220,200,190,.35)"; c.lineWidth = 0.6; const r0 = (t * 6) % 8; c.beginPath(); c.ellipse(x, y - 0.8, 2 + r0, 0.5 + r0 * 0.2, 0, 0, 6.283); c.stroke(); }
      c.fillStyle = "#5a3e24"; c.fillRect(x - 13, y - 1, 3, 1.5); c.fillRect(x + 10, y - 1, 3, 1.5);
      if (tr.h <= 0) { if ((tr.c || 0) > 3.4) { circ(c, x - 1, y - 1.3, 0.9, "#d8b0a8"); } return; }
      const pts = tentPts(tr), n = pts.length;
      for (let pass = 0; pass < 2; pass++) {
        c.strokeStyle = pass ? "#7a3a4a" : "#2a1018"; c.lineCap = "round";
        for (let i = 1; i < n; i++) { c.lineWidth = (6.5 - i * 5 / n) * (pass ? 0.7 : 1); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
      }
      if (!low) for (let i = 1; i < n - 1; i += 1) { const p = pts[i]; circ(c, p[0] + 1.2, p[1], 0.8 * (1 - i / n) + 0.3, "#e8b0a8"); }
    }
  });
  function tentPts(tr) {
    const n = 10, H = 46 * tr.h, pts = [];
    for (let i = 0; i < n; i++) { const k = i / (n - 1); pts.push([tr.x + Math.sin(k * 2.2 + clock * 3) * 4 * k + tr.sw * 16 * k * k, tr.y - 1 - H * k + Math.abs(tr.sw) * 6 * k * k]); }
    return pts;
  }

  def("netz", {
    g: "hafen", n: ["Fallendes Fischernetz", "Falling fishing net"], d: ["Das Haltetau reißt Faser um Faser – dann fällt das Netz und verheddert dich.", "The rope frays strand by strand – then the net drops and tangles you."],
    init(tr) { tr.st = "oben"; tr.t = 0; tr.y = tr.ay + 6; tr.w = 6; },
    upd(tr, dt, P) {
      tr.t += dt;
      if (tr.st === "oben") { tr.y = tr.ay + 6; tr.w = 6; if (P && Math.abs(pcx(P) - tr.x) < 26 && P.y > tr.ay && P.y < tr.fy && tr.t > 1) { tr.st = "reisst"; tr.t = 0; play(amb("g_knarren_", 5), tr.x, tr.ay, { vol: 0.5, rate: 1.5 }); } }
      else if (tr.st === "reisst") { if (Math.random() < dt * 10) FX.p({ x: tr.x, y: tr.ay + 3, vx: (Math.random() - 0.5) * 30, vy: 20, g: 200, life: 0.6, size: 1, col: "#c8a870", kind: "dot" }); if (tr.t > 0.5) { tr.st = "faellt"; tr.t = 0; tr.vy = 0; play(amb("e_tuch_", 3), tr.x, tr.ay, { vol: 0.6 }); } }
      else if (tr.st === "faellt") {
        tr.vy += 700 * dt; tr.y += tr.vy * dt; tr.w = Math.min(19, tr.w + dt * 40);
        if (tr.y >= tr.fy - 3) { tr.y = tr.fy - 3; tr.st = "liegt"; tr.t = 0; tr.hit = false; }
        const b = box(tr.x - tr.w, tr.y - 4, tr.w * 2, 8);
        if (P && ov(b, HB(P)) && !tr.hit) { tr.hit = true; hp(0.03, tr.x, { kb: 0, kbUp: 0 }); Z.addStatus(P, "web", 1.6, true); }
        foes(e => ov(b, e), e => he(tr, e, 15, { kb: 0, kbUp: 0 }, { root: 2.5 }));
      } else if (tr.st === "liegt") {
        const b = box(tr.x - tr.w, tr.fy - 6, tr.w * 2, 6);
        if (P && ov(b, HB(P)) && !(P.st.web > 0.3)) Z.addStatus(P, "web", 0.8, true);
        foes(e => ov(b, e), e => Z.addStatus(e, "root", 0.5));
        if (tr.t > 3) { tr.st = "hoch"; tr.t = 0; play(amb("g_knarren_", 5), tr.x, tr.ay, { vol: 0.3 }); }
      } else if (tr.st === "hoch") { const k = Math.min(1, tr.t / 1.4); tr.y = tr.fy - 3 + (tr.ay + 6 - tr.fy + 3) * k; tr.w = 19 - 13 * k; if (k >= 1) { tr.st = "oben"; tr.t = 0; } }
    },
    draw(c, tr, t, low) {
      const x = tr.x;
      plank(c, x - 9, tr.ay, 18, 3, "#5a3e28");
      if (tr.st !== "faellt") rope(c, x, tr.ay + 3, x, tr.y - 3, "#c8a870");
      if (tr.st === "oben" || tr.st === "reisst") {
        const jx = tr.st === "reisst" ? (Math.random() - 0.5) : 0;
        ell(c, x + jx, tr.y + 2, 6, 5, "#6a5a40"); if (!low) { c.strokeStyle = "#a89070"; c.lineWidth = 0.5; c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(x + jx + i * 2.4, tr.y - 2); c.lineTo(x + jx + i * 2, tr.y + 6.5); } c.stroke(); }
        c.fillStyle = "#c8a060"; circ(c, x + jx - 3, tr.y + 5, 1.2, "#c8a060"); circ(c, x + jx + 3, tr.y + 4, 1.2, "#c8a060");
        c.fillStyle = "#3a2a1e"; c.fillRect(x + jx - 6, tr.y, 12, 1);
        if (tr.st === "reisst") shadow(c, x, tr.fy, 16, 0.25 + tr.t * 0.4);
        return;
      }
      const w = tr.w, y = tr.y, sag = tr.st === "liegt" ? 0 : 4;
      c.strokeStyle = "#a89070"; c.lineWidth = 0.6; c.beginPath();
      for (let i = -3; i <= 3; i++) { const xx = x + i * w / 3; c.moveTo(xx, y - sag + Math.abs(i) * 0.8); c.lineTo(x + (i + 1.5) * w / 3.5, y + 3); c.moveTo(xx, y - sag + Math.abs(i) * 0.8); c.lineTo(x + (i - 1.5) * w / 3.5, y + 3); }
      c.moveTo(x - w, y - sag + 2.4); c.quadraticCurveTo(x, y - sag - 1, x + w, y - sag + 2.4); c.stroke();
      for (let i = -2; i <= 2; i++) circ(c, x + i * w / 2.4, y + 2.6, 1.1, "#c8a060");
    }
  });

  /* ---------- GLOCKENTURM: Glocke, Gegengewicht, Zahnrad ---------- */
  def("glocke", {
    g: "glocken", n: ["Sturmglocke", "Storm bell"], d: ["Am Umkehrpunkt glüht der Rand – dann dröhnt sie. Die Schallwelle wirft zurück und betäubt Gegner.", "Its rim glows at the turning point – then it tolls. The sound wave knocks back and stuns enemies."],
    init(tr, R) { tr.len = U.clamp(tr.fy - tr.ay - 28, 28, 190); /* reicht auch in hohen Räumen bis auf Kopfhöhe */ tr.amp = 0.7; tr.per = 3.4 + R() * 0.4; tr.toll = 0; },
    upd(tr, dt, P) {
      const ph = clock * 6.283 / tr.per + tr.ph, a = Math.sin(ph) * tr.amp; tr.a = a;
      tr.bx = tr.x + Math.sin(a) * tr.len; tr.by = tr.ay + Math.cos(a) * tr.len;
      tr.pre = Math.sin(ph) > 0.5 ? (Math.sin(ph) - 0.5) * 2 : 0; /* Rand glüht ≈0,5 s vor dem Schlag auf */
      if (Math.sin(ph) > 0.995 && !tr.tolled) { tr.tolled = true; play("bell", tr.bx, tr.by, { vol: 0.8, rate: 0.8 }); waves.push({ x: tr.bx, y: tr.by + 6, r: 4, max: 76, t: 0, life: 0.7, src: tr, hitP: false }); FX.addShake(1.5); }
      else if (Math.sin(ph) < 0.7) tr.tolled = false;
      if (P && circRect(tr.bx, tr.by + 6, 10, HB(P))) hp(0.13, tr.bx, { kb: 230, kbUp: 200 });
      foes(e => circRect(tr.bx, tr.by + 6, 10, e), e => he(tr, e, 40, { kb: 220 }));
    },
    draw(c, tr, t, low) {
      plank(c, tr.x - 12, tr.ay, 24, 4, "#5a3e28"); c.fillStyle = "#3a3236"; c.fillRect(tr.x - 3, tr.ay + 3, 6, 3);
      c.strokeStyle = "#2a2226"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(tr.x, tr.ay + 5); c.lineTo(tr.bx, tr.by - 6); c.stroke();
      c.strokeStyle = "#5a5256"; c.lineWidth = 1; c.beginPath(); c.moveTo(tr.x, tr.ay + 5); c.lineTo(tr.bx, tr.by - 6); c.stroke();
      c.save(); c.translate(tr.bx, tr.by); c.rotate(-tr.a);
      const S = spr("glocke", 24, 22, g => {
        g.fillStyle = "#3a2a14"; g.beginPath(); g.moveTo(8, 2); g.quadraticCurveTo(5, 4, 5, 10); g.quadraticCurveTo(4, 16, 1, 19); g.lineTo(23, 19); g.quadraticCurveTo(20, 16, 19, 10); g.quadraticCurveTo(19, 4, 16, 2); g.closePath(); g.fill();
        g.fillStyle = "#a07a34"; g.beginPath(); g.moveTo(8.5, 2.8); g.quadraticCurveTo(6, 4.5, 6, 10); g.quadraticCurveTo(5, 15.5, 2.5, 18.2); g.lineTo(21.5, 18.2); g.quadraticCurveTo(19, 15.5, 18, 10); g.quadraticCurveTo(18, 4.5, 15.5, 2.8); g.closePath(); g.fill();
        g.fillStyle = "#f0d090"; g.fillRect(8, 4, 1.4, 12); g.fillStyle = "#6a4a1e"; g.fillRect(4, 15, 16, 0.9); g.fillRect(6, 6, 12, 0.7);
        g.fillStyle = "#2a1a0e"; g.beginPath(); g.ellipse(12, 19, 10.5, 2, 0, 0, 6.283); g.fill();
        g.fillStyle = "#5a4220"; g.fillRect(10, 0, 4, 3);
      });
      c.drawImage(S, -12, -8, 24, 22);
      /* Klöppel schwingt nach */
      circ(c, Math.sin(tr.a * 1.4) * 4, 11, 1.8, "#3a3236");
      c.restore();
      if (tr.pre > 0 && !low) glow(c, tr.bx, tr.by + 10, 10 * tr.pre + 4, "rgba(255,210,120,.6)");
    },
    light(tr, h) { if (tr.pre > 0) h(tr.bx, tr.by + 8, 30, 0.4, "#ffd27a"); }
  });

  def("gewicht", {
    g: "glocken", n: ["Seilzug-Gewicht", "Rope counterweight"], d: ["Die Rolle quietscht, das Gewicht ruckt zweimal – dann rauscht es herab.", "The pulley squeals, the weight jerks twice – then it plunges."],
    init(tr) { tr.cyc = 4.9; tr.top = tr.ay + 12; tr.wy = tr.top; tr.rot = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, low = tr.fy - 6; tr.c = c;
      if (c < 2.8) tr.wy = tr.top;
      else if (c < 3.6) { tr.wy = tr.top + (c > 3.0 ? 2 : 0) + (c > 3.35 ? 2 : 0); if (!tr.w) { tr.w = true; play(amb("g_knarren_", 5), tr.x, tr.ay, { vol: 0.5, rate: 1.8 }); } }
      else if (tr.wy < low && !tr.down) { tr.vy = (tr.vy || 0) + 1600 * dt; tr.wy = Math.min(low, tr.wy + tr.vy * dt); tr.rot += tr.vy * dt * 0.3; if (tr.wy >= low) { tr.down = true; play("anvil", tr.x, low, { vol: 0.6, rate: 0.7 }); play("hitHeavy", tr.x, low, { vol: 0.5 }); FX.addShake(3); FX.burst(tr.x, tr.fy - 1, 12, { col: ["#6a5a50", "#4a3e38"], sp: 90, ang: -Math.PI / 2, spread: 2.8, life: 0.6, size: 2, kind: "smoke" }); } }
      else if (c > 4.1) { tr.wy = low + (tr.top - low) * Math.min(1, (c - 4.1) / 0.8); tr.rot -= dt * 6; }
      if (c < 2.8) { tr.w = false; tr.down = false; tr.vy = 0; }
      const b = box(tr.x - 7, tr.wy - 6, 14, 12);
      if (c >= 3.6 && tr.vy > 100 && !tr.down) { if (P && ov(b, HB(P))) hp(0.14, tr.x, { kb: 200, kbUp: 150 }); foes(e => ov(b, e), e => he(tr, e, 60, null, { stun: 1.2 })); }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.wy;
      c.fillStyle = "#2a2226"; c.fillRect(x - 3, tr.ay, 6, 3);
      c.save(); c.translate(x, tr.ay + 5); c.rotate(tr.rot); circ(c, 0, 0, 4, "#3a2a1e"); circ(c, 0, 0, 3, "#a07a34"); c.strokeStyle = "#5a4220"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-3, 0); c.lineTo(3, 0); c.moveTo(0, -3); c.lineTo(0, 3); c.stroke(); c.restore();
      rope(c, x, tr.ay + 5, x, y - 6, "#c8a870");
      c.strokeStyle = "#4a4448"; c.lineWidth = 1; c.beginPath(); c.arc(x, y - 6, 1.8, Math.PI, 0); c.stroke();
      c.fillStyle = "#1a1416"; c.fillRect(x - 7.5, y - 6, 15, 12.5);
      c.fillStyle = "#3a3438"; c.fillRect(x - 7, y - 5.5, 14, 11.5); c.fillStyle = "#5a5256"; c.fillRect(x - 7, y - 5.5, 14, 1.2);
      if (!low) { c.strokeStyle = "#8a8286"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x - 3, y - 2); c.lineTo(x - 3, y + 3); c.lineTo(x + 3, y + 3); c.moveTo(x + 1, y - 2); c.lineTo(x + 1, y + 3); c.stroke(); }
      const c0 = tr.c || 0; if (c0 > 2.8 && !tr.down) shadow(c, x, tr.fy, 9, 0.2 + Math.min(1, c0 - 2.8) * 0.4);
    }
  });

  def("zahnrad", {
    g: "glocken", n: ["Rollendes Zahnrad", "Rolling cog"], d: ["Es tickt immer schneller, bevor es losrollt. Drüberspringen.", "It ticks faster and faster before it rolls. Jump over it."],
    init(tr, R) { tr.dir = R() < 0.5 ? 1 : -1; tr.cx = tr.dir > 0 ? tr.x0 + 14 : tr.x1 - 14; tr.rot = 0; tr.pause = 1.2; },
    upd(tr, dt, P) {
      const r = 13;
      if (tr.pause > 0) { tr.pause -= dt; tr.rot -= dt * 0.4 * tr.dir; if (Math.random() < dt * (4 + (1.2 - tr.pause) * 10)) play("hitMetal", tr.cx, tr.y, { vol: 0.12, rate: 2.4, gap: 0.05, tag: "tick" }); }
      else {
        tr.cx += tr.dir * 70 * dt; tr.rot += tr.dir * 70 * dt / r;
        if (Math.random() < dt * 8) play("hitMetal", tr.cx, tr.y, { vol: 0.1, rate: 2.2, gap: 0.08, tag: "tick" });
        if (tr.cx > tr.x1 - 14 || tr.cx < tr.x0 + 14) { tr.cx = U.clamp(tr.cx, tr.x0 + 14, tr.x1 - 14); tr.dir *= -1; tr.pause = 1.2; play("anvil", tr.cx, tr.y, { vol: 0.25, rate: 1.6 }); }
      }
      if (P && circRect(tr.cx, tr.y - r, r - 1, HB(P))) hp(0.12, tr.cx, { kb: 230, kbUp: 240 });
      foes(e => !e.def.fly && circRect(tr.cx, tr.y - r, r - 1, e), e => he(tr, e, 40, { kb: 220 }));
    },
    draw(c, tr, t, low) {
      c.fillStyle = "#2a2226"; c.fillRect(tr.x0 + 2, tr.y - 1.6, tr.x1 - tr.x0 - 4, 1.6); c.fillStyle = "#6a6266"; c.fillRect(tr.x0 + 2, tr.y - 1.6, tr.x1 - tr.x0 - 4, 0.5);
      if (!low) for (let x = tr.x0 + 6; x < tr.x1 - 4; x += 10) circ(c, x, tr.y - 0.8, 0.6, "#a8a0a4");
      const S = spr("zahnrad", 30, 30, g => {
        g.translate(15, 15); g.fillStyle = "#5a4220"; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.lineTo(Math.cos(a - 0.14) * 11.5, Math.sin(a - 0.14) * 11.5); g.lineTo(Math.cos(a - 0.1) * 14, Math.sin(a - 0.1) * 14); g.lineTo(Math.cos(a + 0.1) * 14, Math.sin(a + 0.1) * 14); g.lineTo(Math.cos(a + 0.14) * 11.5, Math.sin(a + 0.14) * 11.5); } g.closePath(); g.fill();
        g.fillStyle = "#a07a34"; g.beginPath(); g.arc(0, 0, 11, 0, 6.283); g.fill();
        g.fillStyle = "#5a4220"; g.beginPath(); g.arc(0, 0, 8, 0, 6.283); g.fill();
        g.fillStyle = "#a07a34"; for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * 1.571); g.fillRect(-1.3, -8, 2.6, 16); g.restore(); }
        g.fillStyle = "#c89a4a"; g.beginPath(); g.arc(0, 0, 3, 0, 6.283); g.fill(); g.fillStyle = "#2a1e10"; g.beginPath(); g.arc(0, 0, 1.2, 0, 6.283); g.fill();
        g.fillStyle = "rgba(255,240,200,.35)"; g.beginPath(); g.arc(-3, -3, 9, 3.6, 4.6); g.lineTo(0, 0); g.fill();
      });
      c.save(); c.translate(tr.cx, tr.y - 13); c.rotate(tr.rot); c.drawImage(S, -15, -15, 30, 30); c.restore();
    }
  });

  /* ---------- SPINNENSCHLUND: Klebnetze, Eiersäcke, Giftspinnen ---------- */
  def("netzfalle", {
    g: "schlund", n: ["Klebnetz", "Sticky web"], d: ["Glitzernde Tautropfen verraten es. Wer hineintritt, klebt fest – Gegner auch.", "Glittering dewdrops give it away. Step in and you stick – enemies too."],
    init(tr) { tr.st = "ganz"; tr.t = 0; tr.pull = 0; },
    upd(tr, dt, P) {
      tr.t += dt; const z = box(tr.x - 14, tr.y - 10, 28, 10);
      if (tr.st === "ganz") {
        tr.pull = U.approach(tr.pull, 0, dt * 2);
        if (P && ov(z, HB(P)) && P.onGround) { Z.addStatus(P, "web", 2.2, true); P.vx *= 0.3; tr.st = "riss"; tr.t = 0; tr.pull = 1; play(amb("e_spinne_", 6), tr.x, tr.y, { vol: 0.6 }); play("web", tr.x, tr.y, { vol: 0.6 }); FX.text(pcx(P), P.y - 6, L(["Klebt!", "Stuck!"]), "#e8e0c8"); }
        foes(e => !e.def.fly && ov(z, e) && !/spinne|spider/i.test(e.def.shape || e.def.id || ""), e => { Z.addStatus(e, "root", 2.2); tr.st = "riss"; tr.t = 0; tr.pull = 1; });
      } else if (tr.t > 3.4) { tr.st = "ganz"; tr.t = 0; }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, torn = tr.st === "riss", a = torn ? 0.35 : 0.75, near2 = near(x, y, 60) ? 1 : 0;
      c.save(); c.globalAlpha = a; c.strokeStyle = "#e8e0d8"; c.lineWidth = 0.45;
      const anchors = [[-14, -12], [-8, -15], [0, -16], [8, -15], [14, -12]];
      c.beginPath();
      for (const [ax, ay] of anchors) { c.moveTo(x + ax * 0.3, y - 1); c.quadraticCurveTo(x + ax * 0.7, y + ay * 0.4 + tr.pull * 2, x + ax, y + (torn ? ay * 0.5 : ay)); }
      for (let r = 1; r <= 3; r++) { c.moveTo(x - r * 4.2, y - 1); for (let i = 0; i < anchors.length; i++) { const [ax, ay] = anchors[i]; c.lineTo(x + ax * r / 3.4, y - 1 + ay * r / 3.6 * (torn ? 0.5 : 1)); } }
      c.stroke(); c.restore();
      /* Tautropfen glitzern */
      for (let i = 0; i < (low ? 3 : 7); i++) { const dx = ((i * 37) % 26) - 13, dy = -2 - ((i * 13) % 10), k = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.7); circ(c, x + dx, y + dy, 0.6, "#fffbe8"); if (!low && (k > 0.8 || near2)) glow(c, x + dx, y + dy, 2.5 + near2 * 1.5, "rgba(230,250,190,.7)"); }
    }
  });

  def("eiersack", {
    g: "schlund", n: ["Eiersack", "Egg sac"], d: ["Er pulsiert immer schneller und glüht – dann platzt er und Spinnlinge stürzen heraus.", "It pulses faster and glows – then bursts, spilling spiderlings."],
    init(tr) { tr.st = "haengt"; tr.t = 0; tr.hy = tr.ay + 10; tr.g = 1; },
    upd(tr, dt, P) {
      tr.t += dt;
      if (tr.st === "haengt") { tr.g = Math.min(1, tr.g + dt * 0.3); if (tr.g >= 1 && P && Math.abs(pcx(P) - tr.x) < 48 && P.y > tr.ay - 10 && P.y < tr.fy + 10) { tr.st = "pocht"; tr.t = 0; play("slime", tr.x, tr.hy, { vol: 0.5 }); } }
      else if (tr.st === "pocht") {
        if (Math.random() < dt * 6) play(amb("g_schleim_", 10), tr.x, tr.hy, { vol: 0.25, gap: 0.2 });
        if (tr.t > 1) {
          tr.st = "leer"; tr.t = 0; tr.g = 0; play("slime", tr.x, tr.hy, { vol: 0.8 }); play(amb("e_spinne_", 6), tr.x, tr.hy, { vol: 0.5 });
          FX.burst(tr.x, tr.hy + 6, 16, { col: ["#d8c8a0", "#9ab040"], sp: 110, life: 0.6, size: 1.8, kind: "drop", g: 500 });
          for (let i = 0; i < 5; i++) minis.push({ k: "spinnling", x: tr.x + (Math.random() - 0.5) * 8, y: tr.hy + 6, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 60, life: 5, t: 0, src: tr });
        }
      } else if (tr.st === "leer" && tr.t > 9) { tr.st = "haengt"; tr.t = 0; }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.hy, pul = tr.st === "pocht" ? 1 + Math.sin(t * (14 + tr.t * 20)) * 0.12 : 1 + Math.sin(t * 2.4 + tr.ph) * 0.04;
      c.strokeStyle = "rgba(232,224,216,.7)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x - 3, tr.ay); c.lineTo(x, y); c.moveTo(x + 4, tr.ay); c.lineTo(x, y); c.stroke();
      if (tr.st === "leer") { c.fillStyle = "#8a7a60"; c.beginPath(); c.moveTo(x - 3, y); c.quadraticCurveTo(x - 5, y + 5, x - 2, y + 7); c.lineTo(x, y + 4); c.lineTo(x + 2, y + 7); c.quadraticCurveTo(x + 4, y + 4, x + 3, y); c.fill(); return; }
      const g = tr.g, rx = 5 * g * pul, ry = 7 * g * pul;
      ell(c, x, y + ry, rx + 0.6, ry + 0.6, "#4a3e30"); ell(c, x, y + ry, rx, ry, "#d8c8a0");
      if (!low) { c.fillStyle = "rgba(90,70,50,.5)"; for (let i = 0; i < 5; i++) circ(c, x + Math.cos(i * 2.4) * rx * 0.5, y + ry + Math.sin(i * 2.4) * ry * 0.5, 1.1 * g, "rgba(90,70,50,.5)"); c.fillStyle = "rgba(255,255,240,.4)"; c.fillRect(x - rx * 0.5, y + ry * 0.4, 1, ry * 0.8); }
      if (tr.st === "pocht") { c.strokeStyle = "#b8d050"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x, y + 1); c.quadraticCurveTo(x - 3, y + ry, x - 1, y + ry * 1.8); c.moveTo(x, y + 1); c.quadraticCurveTo(x + 3, y + ry, x + 2, y + ry * 1.7); c.stroke(); glow(c, x, y + ry, 10 + tr.t * 6, "rgba(184,208,80,.45)"); }
    },
    light(tr, h) { if (tr.st === "pocht") h(tr.x, tr.hy + 7, 30, 0.5, "#b8d050"); }
  });

  def("giftspinne", {
    g: "schlund", n: ["Giftspinne am Faden", "Venom spider on a thread"], d: ["Rote Augen glimmen in der Höhe, der Faden zittert – dann lässt sie sich fallen und beißt.", "Red eyes glint above, the thread trembles – then it drops and bites."],
    init(tr) { tr.st = "oben"; tr.t = 0; tr.sy = tr.ay + 7; },
    upd(tr, dt, P) {
      tr.t += dt; const low = tr.fy - 14;
      if (tr.st === "oben") { tr.sy = tr.ay + 7; const trig = P && Math.abs(pcx(P) - tr.x) < 28 && P.y > tr.ay && P.y < tr.fy; let te = false; if (!trig) foes(e => Math.abs(e.x + e.w / 2 - tr.x) < 18 && e.y > tr.ay && e.y < tr.fy && !e.def.fly, () => { te = true; }); if ((trig || te) && tr.t > 1.6) { tr.st = "zittert"; tr.t = 0; play(amb("e_spinne_", 6), tr.x, tr.ay, { vol: 0.6 }); } }
      else if (tr.st === "zittert") { if (tr.t > 0.5) { tr.st = "faellt"; tr.t = 0; play("web", tr.x, tr.ay, { vol: 0.4, rate: 1.5 }); } }
      else if (tr.st === "faellt") { tr.sy = Math.min(low, tr.sy + dt * 520); if (tr.sy >= low) { tr.st = "beisst"; tr.t = 0; play("bite", tr.x, low, { vol: 0.5 }); } }
      else if (tr.st === "beisst") { if (tr.t > 0.7) { tr.st = "klettert"; tr.t = 0; } }
      else if (tr.st === "klettert") { tr.sy = Math.max(tr.ay + 7, tr.sy - dt * 110); if (tr.sy <= tr.ay + 7) { tr.st = "oben"; tr.t = 0; } }
      if (tr.st === "faellt" || tr.st === "beisst") {
        if (P && circRect(tr.x, tr.sy, 8, HB(P))) hp(0.08, tr.x, { kb: 140, kbUp: 140, eff: { poison: 2 } });
        foes(e => circRect(tr.x, tr.sy, 8, e), e => he(tr, e, 25, null, { poison: 3 }));
      }
    },
    draw(c, tr, t, low) {
      const x = tr.x + (tr.st === "zittert" ? (Math.random() - 0.5) * 1.2 : 0), y = tr.sy;
      c.strokeStyle = "rgba(232,224,216,.8)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(tr.x, tr.ay); c.lineTo(x, y - 3); c.stroke();
      const leg = tr.st === "faellt" ? 1 : Math.sin(t * (tr.st === "zittert" ? 30 : 3)) * 0.3;
      c.strokeStyle = "#1a1016"; c.lineWidth = 0.9;
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const a0 = -0.6 + i * 0.45, kx = x + s * (3 + i * 0.4), ky = y - 1 + i * 0.8; c.beginPath(); c.moveTo(x + s * 1.2, y - 1 + i * 0.6); c.lineTo(kx + s * 3, ky - 3 + leg * (i % 2 ? 1 : -1)); c.lineTo(kx + s * 5, ky + 3 + a0); c.stroke(); }
      ell(c, x, y + 3, 3.6, 4.2, "#2a1a24"); ell(c, x, y - 1.5, 2.4, 2, "#3a2430");
      c.fillStyle = "#d8a040"; c.beginPath(); c.moveTo(x - 1.2, y + 2); c.lineTo(x + 1.2, y + 2); c.lineTo(x, y + 3.4); c.lineTo(x + 1.2, y + 4.8); c.lineTo(x - 1.2, y + 4.8); c.lineTo(x, y + 3.4); c.closePath(); c.fill();
      const eg = tr.st === "oben" ? 0.6 + Math.sin(t * 2 + tr.ph) * 0.3 : 1;
      circ(c, x - 0.9, y - 2.4, 0.5, "#ff3a2a"); circ(c, x + 0.9, y - 2.4, 0.5, "#ff3a2a"); if (!low) glow(c, x, y - 2.4, 4 * eg, "rgba(255,60,40,.6)");
    }
  });

  /* ---------- RUNENSCHMIEDE: Schmiedehammer, Funkenregen, Runenstrahl ---------- */
  def("hammer", {
    g: "schmiede", n: ["Runenhammer", "Rune hammer"], d: ["Die Runen auf dem Kopf glühen auf, Dampf zischt – dann stampft der Hammer.", "The runes on its head flare, steam hisses – then the hammer stamps."],
    init(tr) { tr.cyc = 3.1; tr.hy = tr.ay + 4; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, top = tr.ay + 4, bot = tr.fy - 12; tr.c = c;
      if (c < 1.6) tr.hy = bot + (top - bot) * U.ease(c / 1.6);
      else if (c < 2.35) { tr.hy = top; if (!tr.w) { tr.w = true; play(amb("e_zischen_", 2), tr.x, top, { vol: 0.5 }); } if (Math.random() < dt * 20) puff(tr.x + (Math.random() < 0.5 ? -12 : 12), top + 6, "rgba(230,220,210,.35)", 1, { vy: -20 }); }
      else if (c < 2.45) tr.hy = top + (bot - top) * Math.pow((c - 2.35) / 0.1, 2);
      else tr.hy = bot;
      if (c < 1.6) tr.w = false;
      tr.glow = c > 1.6 && c < 2.45 ? Math.min(1, (c - 1.6) / 0.6) : c >= 2.45 ? Math.max(0, 1 - (c - 2.45) * 2) : 0;
      if (c >= 2.45 && !tr.imp) {
        tr.imp = true; Z.lightFlash && Z.lightFlash(tr.x, tr.fy - 6, 70, "#ff8a3a", 0.8, 0.3); play("anvil", tr.x, tr.fy, { vol: 0.8 }); play("hitHeavy", tr.x, tr.fy, { vol: 0.6, rate: 0.6 }); FX.addShake(3.5);
        sparks(tr.x - 11, tr.fy - 2, 10, null, { ang: Math.PI, spread: 1, sp: 200 }); sparks(tr.x + 11, tr.fy - 2, 10, null, { ang: 0, spread: 1, sp: 200 });
        const sw = box(tr.x - 28, tr.fy - 6, 56, 6); if (P && P.onGround && ov(sw, HB(P))) hp(0.05, tr.x, { kb: 160, kbUp: 220 });
        foes(e => !e.def.fly && e.onGround && ov(sw, e), e => he(tr, e, 20, null, { stun: 0.8 }));
      }
      if (c < 2.35) tr.imp = false;
      if (c >= 2.35 && c < 2.5) { const b = box(tr.x - 11, tr.hy, 22, 12); if (P && ov(b, HB(P))) hp(0.18, tr.x, { kb: 260, kbUp: 120 }); foes(e => ov(b, e), e => he(tr, e, 70, null, { stun: 1.5 })); }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.hy;
      c.fillStyle = "#2a2226"; c.fillRect(x - 14, tr.ay, 2, tr.fy - tr.ay); c.fillRect(x + 12, tr.ay, 2, tr.fy - tr.ay);
      if (!low) { c.fillStyle = "#5a5256"; c.fillRect(x - 14, tr.ay, 0.6, tr.fy - tr.ay); c.fillRect(x + 12, tr.ay, 0.6, tr.fy - tr.ay); }
      c.fillStyle = "#4a4448"; c.fillRect(x - 2, tr.ay, 4, y - tr.ay); c.fillStyle = "#8a8286"; c.fillRect(x - 1.2, tr.ay, 0.8, y - tr.ay);
      /* Amboss-Platte im Boden */
      c.fillStyle = "#1a1416"; c.fillRect(x - 13, tr.fy - 2, 26, 2); c.fillStyle = "#ff8a3a"; c.globalAlpha = 0.3 + (tr.glow || 0) * 0.5; c.fillRect(x - 11, tr.fy - 2, 22, 0.6); c.globalAlpha = 1;
      const S = spr("hammerkopf", 24, 13, g => {
        g.fillStyle = "#1a1416"; g.fillRect(0, 0, 24, 13); g.fillStyle = "#3a3438"; g.fillRect(1, 1, 22, 11); g.fillStyle = "#5a5256"; g.fillRect(1, 1, 22, 1.5); g.fillStyle = "#2a2426"; g.fillRect(1, 10, 22, 2);
        g.fillStyle = "#6a6266"; for (const rx of [3, 21]) { g.beginPath(); g.arc(rx, 4, 0.8, 0, 6.283); g.fill(); }
        g.strokeStyle = "#5a3018"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(8, 3); g.lineTo(10, 9); g.lineTo(12, 3); g.lineTo(14, 9); g.lineTo(16, 3); g.stroke();
      });
      c.drawImage(S, x - 12, y, 24, 13);
      const gl = tr.glow || 0;
      if (gl > 0) { c.strokeStyle = "rgba(255," + (140 + gl * 100 | 0) + ",60," + gl.toFixed(2) + ")"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - 4, y + 3); c.lineTo(x - 2, y + 9); c.lineTo(x, y + 3); c.lineTo(x + 2, y + 9); c.lineTo(x + 4, y + 3); c.stroke(); glow(c, x, y + 6, 8 + gl * 8, "rgba(255,140,50,.55)", gl); shadow(c, x, tr.fy, 12, gl * 0.4); }
    },
    light(tr, h) { if ((tr.glow || 0) > 0.1) h(tr.x, tr.hy + 6, 40, 0.6 * tr.glow, "#ff8a3a"); }
  });

  def("funkenregen", {
    g: "schmiede", n: ["Funkenregen aus der Esse", "Spark shower from the forge"], d: ["Der Rost über dir glüht hell auf und knistert – dann regnet es Funken.", "The grate above glows bright and crackles – then sparks rain down."],
    init(tr) { tr.cyc = 5.2; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; tr.hot = c > 3 && c < 4 ? (c - 3) : c >= 4 ? 1 : 0.15;
      if (c > 3 && c < 4) { if (!tr.w) { tr.w = true; play("fire", tr.x, tr.ay, { vol: 0.4, rate: 0.8 }); play(amb("e_blasebalg_", 2), tr.x, tr.ay, { vol: 0.5 }); } if (Math.random() < dt * 6) FX.p({ x: tr.x + (Math.random() - 0.5) * 20, y: tr.ay + 8, vx: 0, vy: 40, g: 300, life: 1.2, size: 1.2, col: "#ffb060", kind: "spark", add: true }); }
      if (c < 3) tr.w = false;
      tr.rain = c >= 4;
      if (tr.rain) {
        if (Math.random() < dt * 60) FX.p({ x: tr.x + (Math.random() - 0.5) * 40, y: tr.ay + 8, vx: (Math.random() - 0.5) * 20, vy: 160 + Math.random() * 80, g: 300, life: (tr.fy - tr.ay) / 220, size: 1.5, col: Math.random() < 0.5 ? "#ffd27a" : "#ff8a3a", kind: "spark", add: true });
        const z = box(tr.x - 20, tr.ay + 8, 40, tr.fy - tr.ay - 8);
        if (P && ov(z, HB(P))) hp(0.06, tr.x, { kb: 60, kbUp: 80, eff: { burn: 1 } });
        foes(e => ov(z, e), e => he(tr, e, 12, { kb: 0 }, { burn: 2 }));
      }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.ay, h = tr.hot || 0;
      c.fillStyle = "#3a2e2a"; c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x + 16, y); c.lineTo(x + 11, y + 8); c.lineTo(x - 11, y + 8); c.closePath(); c.fill();
      c.fillStyle = "#5a4a40"; c.fillRect(x - 16, y, 32, 1.2);
      c.fillStyle = "#1a0e0a"; c.fillRect(x - 10, y + 6, 20, 3);
      c.fillStyle = "rgb(255," + (100 + h * 120 | 0) + "," + (30 + h * 60 | 0) + ")"; c.globalAlpha = 0.3 + h * 0.7; for (let i = 0; i < 6; i++) c.fillRect(x - 9 + i * 3.4, y + 6.5, 2, 2); c.globalAlpha = 1;
      c.fillStyle = "#2a2226"; for (let i = 0; i < 7; i++) c.fillRect(x - 10 + i * 3.4, y + 6, 0.8, 3);
      glow(c, x, y + 8, 8 + h * 12, "rgba(255,130,40,.6)", 0.4 + h * 0.6);
      if (tr.c > 3 && !tr.rain) { c.save(); c.globalAlpha = 0.12 + (tr.c - 3) * 0.2; c.fillStyle = "#ff8a3a"; c.fillRect(x - 20, tr.fy - 1.5, 40, 1.5); c.restore(); }
      if (tr.rain && !low) { c.save(); c.globalAlpha = 0.08; c.fillStyle = "#ffb060"; c.fillRect(x - 20, y + 9, 40, tr.fy - y - 9); c.restore(); }
    },
    light(tr, h) { h(tr.x, tr.ay + 10, 30 + (tr.hot || 0) * 40, 0.4 + (tr.hot || 0) * 0.4, "#ff8a3a"); if (tr.rain) h(tr.x, (tr.ay + tr.fy) / 2, 50, 0.5, "#ffb060"); }
  });

  def("runenstrahl", {
    g: "schmiede", n: ["Runenstein", "Rune stone"], d: ["Drei Runen leuchten nacheinander auf – beim dritten schießt ein glühender Strahl durch den Gang.", "Three runes light up one by one – on the third a glowing beam shoots across."],
    init(tr) { tr.cyc = 4.6; tr.ly = tr.y - 14; tr.range = rangeTo(tr.wx, tr.ly, tr.dir, 12 * T); },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      tr.runes = c < 2.4 ? 0 : c < 3.5 ? 1 + Math.floor((c - 2.4) / 0.37) : 3;
      if (tr.runes !== tr.lastR) { if (tr.runes > 0 && c < 3.6) play("magic", tr.wx, tr.ly, { vol: 0.25, rate: 0.6 + tr.runes * 0.15 }); tr.lastR = tr.runes; }
      tr.beam = c >= 3.5 && c < 4.15;
      if (tr.beam) {
        if (!tr.b) { tr.b = true; play("fireBig", tr.wx, tr.ly, { vol: 0.5, rate: 1.4 }); }
        const L0 = tr.range, r = tr.dir > 0 ? box(tr.wx, tr.ly - 3, L0, 6) : box(tr.wx - L0, tr.ly - 3, L0, 6);
        if (P && ov(r, HB(P))) hp(0.12, tr.wx, { kb: 200, kbUp: 150, eff: { burn: 1 } });
        foes(e => ov(r, e), e => he(tr, e, 45, null, { burn: 2 }));
        if (Math.random() < dt * 30) FX.p({ x: tr.wx + tr.dir * Math.random() * L0, y: tr.ly + (Math.random() - 0.5) * 4, vx: 0, vy: -30, life: 0.4, size: 2, col: "#ffd27a", kind: "glow", add: true });
      } else tr.b = false;
    },
    draw(c, tr, t, low) {
      const x = tr.wx, y = tr.ly, d = tr.dir;
      c.fillStyle = "#1a1416"; c.fillRect(Math.min(x, x + d * 7), y - 9, 7, 18); c.fillStyle = "#4a4040"; c.fillRect(Math.min(x, x + d * 6), y - 8.5, 6, 17); c.fillStyle = "#6a5a50"; c.fillRect(Math.min(x, x + d * 6), y - 8.5, 6, 1);
      for (let i = 0; i < 3; i++) {
        const on = (tr.runes || 0) > i, ry = y - 5.5 + i * 5.5, rx = x + d * 3;
        c.strokeStyle = on ? "#ffd27a" : "#2a2020"; c.lineWidth = 0.8; c.beginPath();
        if (i === 0) { c.moveTo(rx - 1.2, ry - 1.5); c.lineTo(rx, ry + 1.5); c.lineTo(rx + 1.2, ry - 1.5); } else if (i === 1) { c.moveTo(rx, ry - 1.6); c.lineTo(rx, ry + 1.6); c.moveTo(rx - 1.2, ry - 0.4); c.lineTo(rx + 1.2, ry + 0.6); } else { c.moveTo(rx - 1.2, ry + 1.5); c.lineTo(rx, ry - 1.5); c.lineTo(rx + 1.2, ry + 1.5); c.moveTo(rx - 0.6, ry + 0.3); c.lineTo(rx + 0.6, ry + 0.3); }
        c.stroke(); if (on && !low) glow(c, rx, ry, 5, "rgba(255,170,60,.7)");
      }
      if ((tr.runes || 0) > 0 && !tr.beam) { c.save(); c.globalAlpha = 0.1 + tr.runes * 0.1; c.strokeStyle = "#ffb060"; c.lineWidth = 0.6; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(x + d * 6, y); c.lineTo(x + d * tr.range, y); c.stroke(); c.setLineDash([]); c.restore(); }
      if (tr.beam) {
        const L0 = tr.range, w = 2.6 + Math.sin(t * 50) * 0.6, x0 = Math.min(x, x + d * L0);
        c.save(); c.globalCompositeOperation = "lighter";
        c.fillStyle = "rgba(255,110,30,.55)"; c.fillRect(x0, y - w - 1.5, L0, (w + 1.5) * 2);
        c.fillStyle = "rgba(255,200,110,.8)"; c.fillRect(x0, y - w * 0.6, L0, w * 1.2);
        c.fillStyle = "#fffbe8"; c.fillRect(x0, y - 0.5, L0, 1);
        c.restore(); glow(c, x + d * L0, y, 10, "rgba(255,160,60,.7)");
      }
    },
    light(tr, h) { if (tr.beam) for (let k = 0; k <= tr.range; k += 40) h(tr.wx + tr.dir * k, tr.ly, 40, 0.6, "#ff9a40"); else if (tr.runes) h(tr.wx, tr.ly, 22, 0.45, "#ffb060"); }
  });

  /* ---------- ZINNEN: Blitzableiter, losbrechende Zinnen (+ Böen) ---------- */
  def("blitzableiter", {
    g: "zinnen", n: ["Blitzableiter", "Lightning rod"], d: ["Funken kriechen die Stange hinauf, der Kreis am Boden glüht – dann schlägt der Blitz ein. Raus aus dem Kreis!", "Sparks creep up the rod, the circle on the ground glows – then lightning strikes. Leave the circle!"],
    init(tr) { tr.cyc = 5.6; tr.R = 34; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; tr.ch = c > 3.6 && c < 4.7 ? (c - 3.6) / 1.1 : 0;
      if (tr.ch > 0) { if (!tr.w) { tr.w = true; play("zap", tr.x, tr.y, { vol: 0.25, rate: 0.7 }); } if (Math.random() < dt * 20) FX.p({ x: tr.x + (Math.random() - 0.5) * 2, y: tr.y - Math.random() * 30 * tr.ch, vx: (Math.random() - 0.5) * 40, vy: -20, life: 0.25, size: 1, col: "#fff0c0", kind: "spark", add: true }); }
      if (c < 3.6) tr.w = false;
      tr.dis = c >= 4.7 && c < 5.0;
      if (tr.dis && !tr.d) {
        tr.d = true; play("thunder", tr.x, tr.y, { vol: 0.8 }); play("zap", tr.x, tr.y, { vol: 0.7 }); Z.lightFlash && Z.lightFlash(tr.x, tr.y - 30, 160, "#fff0c0", 1, 0.35); FX.flashScreen("#fff6d8", 0.25); FX.addShake(3);
        tr.arcs = Array.from({ length: 4 }, () => (Math.random() - 0.5) * 2 * tr.R);
        const inR = b => Math.abs(b.x + b.w / 2 - tr.x) < tr.R && b.y + b.h > tr.y - 40 && b.y < tr.y + 2;
        if (P && inR(HB(P))) hp(0.12, tr.x, { kb: 200, kbUp: 200, eff: { slow: 1 } });
        foes(e => inR(e), e => he(tr, e, 50, null, { stun: 1.2 }));
        sparks(tr.x, tr.y - 30, 16, ["#fff6d8", "#ffd27a"], { sp: 200 });
      }
      if (c < 4.7) tr.d = false;
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, ch = tr.ch || 0;
      /* Brandkreis am Boden */
      c.save(); c.globalAlpha = 0.25 + ch * 0.6; c.strokeStyle = ch > 0 ? "#ffd27a" : "#3a2a24"; c.lineWidth = 1; c.setLineDash([3, 2]); c.beginPath(); c.ellipse(x, y - 0.5, tr.R, 2.4, 0, 0, 6.283); c.stroke(); c.setLineDash([]); c.restore();
      c.fillStyle = "#4a3e3a"; c.fillRect(x - 5, y - 4, 10, 4); c.fillStyle = "#8a7a70"; c.fillRect(x - 5, y - 4, 10, 1);
      c.fillStyle = "#2a2226"; c.fillRect(x - 0.8, y - 32, 1.6, 28); c.fillStyle = "#6a6266"; c.fillRect(x - 0.3, y - 32, 0.5, 28);
      c.fillStyle = "#a8704a"; c.beginPath(); c.moveTo(x - 1.6, y - 32); c.lineTo(x, y - 37); c.lineTo(x + 1.6, y - 32); c.fill();
      c.strokeStyle = "#4a6a3a"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 3, y - 26); c.lineTo(x + 3, y - 26); c.moveTo(x - 2, y - 22); c.lineTo(x + 2, y - 22); c.stroke();
      if (ch > 0 || Math.sin(t * 3 + tr.ph) > 0.96) glow(c, x, y - 36, 4 + ch * 10, "rgba(255,240,190,.8)");
      if (tr.dis && tr.arcs) {
        const top = Z.cam.y - 10;
        c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "#fff6d8"; c.lineWidth = 1.6;
        c.beginPath(); let px = x + (Math.random() - 0.5) * 30, py = top; c.moveTo(px, py); while (py < y - 37) { py = Math.min(y - 37, py + 10 + Math.random() * 14); px += (Math.random() - 0.5) * 12; px += (x - px) * 0.25; c.lineTo(px, py); } c.lineTo(x, y - 37); c.stroke();
        c.lineWidth = 0.9; c.strokeStyle = "#ffd27a";
        for (const ax of tr.arcs) { c.beginPath(); c.moveTo(x, y - 30); for (let k = 1; k <= 4; k++) c.lineTo(x + ax * k / 4 + (Math.random() - 0.5) * 6, y - 30 + 30 * k / 4 - Math.random() * 3); c.stroke(); }
        c.restore();
      }
    },
    light(tr, h) { if (tr.dis) h(tr.x, tr.y - 20, 110, 0.95, "#fff0c0"); else if (tr.ch) h(tr.x, tr.y - 34, 16 + tr.ch * 30, 0.6, "#fff0c0"); }
  });

  def("zinnenbruch", {
    g: "zinnen", n: ["Lose Zinne", "Loose merlon"], d: ["Risse wachsen, Kiesel rieseln – dann bricht der Zinnenblock heraus.", "Cracks spread, pebbles trickle – then the merlon breaks loose."],
    init(tr) { tr.st = "fest"; tr.t = 0; tr.by = tr.ay; tr.a = 1; },
    upd(tr, dt, P) {
      tr.t += dt;
      if (tr.st === "fest") { tr.a = Math.min(1, tr.a + dt); if (tr.a >= 1 && P && Math.abs(pcx(P) - tr.x) < 26 && P.y > tr.ay && P.y < tr.fy) { tr.st = "reisst"; tr.t = 0; play("rock", tr.x, tr.ay, { vol: 0.4, rate: 1.5 }); } }
      else if (tr.st === "reisst") { if (Math.random() < dt * 16) FX.p({ x: tr.x + (Math.random() - 0.5) * 14, y: tr.ay + 12, vx: 0, vy: 30, g: 500, life: 0.7, size: 1.3, col: "#8a7a70", kind: "shard" }); if (tr.t > 0.8) { tr.st = "faellt"; tr.t = 0; tr.vy = 0; play(amb("n_steinschlag_", 5), tr.x, tr.ay, { vol: 0.5 }); } }
      else if (tr.st === "faellt") {
        tr.vy = Math.min(700, tr.vy + 1300 * dt); tr.by += tr.vy * dt;
        const b = box(tr.x - 8, tr.by, 16, 12);
        if (P && ov(b, HB(P))) hp(0.16, tr.x, { kb: 160, kbUp: 120 });
        foes(e => ov(b, e), e => he(tr, e, 65, null, { stun: 1.5 }));
        if (tr.by + 12 >= tr.fy) { tr.st = "weg"; tr.t = 0; play("rock", tr.x, tr.fy, { vol: 0.8 }); FX.addShake(3); FX.burst(tr.x, tr.fy - 4, 16, { col: ["#8a7a70", "#5e4c48", "#d0c4b8"], sp: 150, ang: -Math.PI / 2, spread: 2.6, life: 0.6, size: 2.6, kind: "shard", g: 700 }); puff(tr.x, tr.fy - 3, "rgba(140,120,110,.4)", 5); }
      } else if (tr.st === "weg" && tr.t > 7) { tr.st = "fest"; tr.t = 0; tr.by = tr.ay; tr.a = 0; }
    },
    draw(c, tr, t, low) {
      if (tr.st === "weg") { c.fillStyle = "#2a1c1c"; c.fillRect(tr.x - 8, tr.ay, 16, 3); return; }
      const sh = tr.st === "reisst" ? (Math.random() - 0.5) * 1.2 : 0, x = tr.x + sh, y = tr.by;
      c.save(); c.globalAlpha = tr.a;
      c.fillStyle = "#2a1c1c"; c.fillRect(x - 8.5, y - 0.5, 17, 13);
      c.fillStyle = "#6e5a52"; c.fillRect(x - 8, y, 16, 12); c.fillStyle = "#9a7a6a"; c.fillRect(x - 8, y + 10, 16, 1.6);
      c.fillStyle = "#5e4c48"; c.fillRect(x - 0.4, y, 0.8, 6); c.fillRect(x - 8, y + 6, 16, 0.6);
      if (!low) { c.fillStyle = "#8a9a50"; c.fillRect(x - 6, y + 9, 3, 1); c.fillRect(x + 3, y + 3, 2, 1); }
      const k = tr.st === "reisst" ? tr.t / 0.8 : tr.st === "faellt" ? 1 : 0;
      if (k > 0) { c.strokeStyle = "#1a1010"; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 4, y + 4 * k); c.lineTo(x - 5, y + 8 * k); c.moveTo(x + 5, y); c.lineTo(x + 3, y + 5 * k); c.lineTo(x + 6, y + 10 * k); c.stroke(); }
      c.restore();
      if (tr.st !== "fest") shadow(c, tr.x, tr.fy, 11, 0.25 + k * 0.3);
    }
  });

  /* ---------- SCHWARZER SEE: Algenschlingen, Giftgassäulen, Seeschlange ---------- */
  def("algen", {
    g: "see", n: ["Leuchtalgen-Schlinge", "Glowing kelp snare"], d: ["Die Wedel neigen sich zu dir und leuchten auf – dann schlingen sie sich um die Knöchel.", "The fronds lean toward you and glow – then wrap around your ankles."],
    init(tr) { tr.st = "ruhig"; tr.t = 0; tr.lean = 0; tr.br = 0; },
    upd(tr, dt, P) {
      tr.t += dt; const dx = P ? pcx(P) - tr.x : 999;
      tr.lean = U.approach(tr.lean, P && Math.abs(dx) < 44 && Math.abs(P.y + P.h - tr.y) < 20 ? U.sign(dx) : 0, dt * 2);
      tr.br = U.approach(tr.br, Math.abs(tr.lean) > 0.3 ? 1 : 0, dt * 2);
      if (tr.st === "ruhig") {
        if (P && Math.abs(dx) < 13 && P_onFloor(P, tr.y)) { tr.st = "fasst"; tr.t = 0; play("roots", tr.x, tr.y, { vol: 0.6 }); if (hp(0.04, tr.x, { kb: 0, kbUp: 0 })) Z.addStatus(P, "web", 1.4, true); }
        foes(e => !e.def.fly && Math.abs(e.x + e.w / 2 - tr.x) < 12 && Math.abs(e.y + e.h - tr.y) < 6, e => { he(tr, e, 10, { kb: 0, kbUp: 0 }, { root: 2 }); tr.st = "fasst"; tr.t = 0; });
      } else if (tr.st === "fasst") { if (P && tr.t < 1.2 && Math.abs(dx) < 24) P.x += (tr.x - pcx(P)) * Math.min(1, dt * 3); if (tr.t > 2.6) { tr.st = "ruhig"; tr.t = 0; } }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, grab = tr.st === "fasst" && tr.t < 1.4;
      for (let i = 0; i < 6; i++) {
        const bx = x - 9 + i * 3.6, h = 12 + ((i * 7) % 5) * 2, sw = Math.sin(t * 1.6 + i) * 2 + tr.lean * 5 * (1 - Math.abs(bx - x) / 14);
        const tipx = grab ? x + (i - 2.5) * 1.2 : bx + sw, tipy = grab ? y - 9 : y - h;
        c.strokeStyle = "#2a4a2a"; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + sw * 0.3, y - h * 0.5, tipx, tipy); c.stroke();
        c.strokeStyle = "#8ab040"; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + sw * 0.3, y - h * 0.5, tipx, tipy); c.stroke();
        circ(c, tipx, tipy, 1.1, "#d0508a");
        if (!low) glow(c, tipx, tipy, 3 + tr.br * 3, "rgba(200,220,90,.5)", 0.6 + tr.br * 0.4);
      }
    },
    light(tr, h) { h(tr.x, tr.y - 10, 26 + tr.br * 16, 0.4 + tr.br * 0.2, "#b8d050"); }
  });

  def("gassaeule", {
    g: "see", n: ["Giftgas-Schlot", "Poison gas vent"], d: ["Es blubbert gelblich, Dunst steigt auf – dann schießt eine Säule giftigen Gases empor.", "Yellowish bubbling, rising haze – then a column of poison gas erupts."],
    init(tr) { tr.cyc = 6; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c;
      if (c > 3.6 && c < 4.6) { if (!tr.w) { tr.w = true; play(amb("n_blubb_", 3), tr.x, tr.y, { vol: 0.6, rate: 0.8 }); } if (Math.random() < dt * 14) FX.p({ x: tr.x + (Math.random() - 0.5) * 8, y: tr.y - 3, vx: 0, vy: -25, life: 0.6, size: 1.8, col: "#c8c870", kind: "bubble" }); }
      if (c < 3.6) tr.w = false;
      tr.er = c >= 4.6 ? Math.min(1, (c - 4.6) * 5) * Math.min(1, (tr.cyc - c) * 3) : 0;
      if (tr.er > 0) {
        if (!tr.e) { tr.e = true; play(amb("n_zischen_", 5), tr.x, tr.y, { vol: 0.7, rate: 0.7 }); }
        if (Math.random() < dt * 35) FX.p({ x: tr.x + (Math.random() - 0.5) * 10, y: tr.y - 6, vx: (Math.random() - 0.5) * 20, vy: -90 - Math.random() * 50, life: 0.9, size: 6, col: "rgba(184,190,80,.45)", kind: "smoke", drag: 0.97 });
        const r = box(tr.x - 8, tr.y - 70 * tr.er, 16, 70 * tr.er);
        if (P && ov(r, HB(P))) hp(0.05, tr.x, { kb: 40, kbUp: 180, eff: { poison: 3 } });
        foes(e => ov(r, e), e => he(tr, e, 12, { kb: 0 }, { poison: 4 }));
      } else tr.e = false;
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, c0 = tr.c || 0;
      c.fillStyle = "#1a2418"; c.beginPath(); c.moveTo(x - 9, y); c.quadraticCurveTo(x - 6, y - 5, x - 2, y - 4); c.lineTo(x + 2, y - 4); c.quadraticCurveTo(x + 6, y - 5, x + 9, y); c.fill();
      c.fillStyle = "#c8b040"; c.fillRect(x - 6, y - 3, 2, 1); c.fillRect(x + 3, y - 3.4, 3, 1); c.fillRect(x - 1, y - 4.2, 2, 0.8);
      c.fillStyle = "#0a0e08"; c.fillRect(x - 2, y - 4.2, 4, 1);
      if (c0 > 3.6 && c0 < 4.6) glow(c, x, y - 4, 6 + (c0 - 3.6) * 8, "rgba(200,200,80,.5)");
      if (tr.er > 0) {
        const H = 70 * tr.er, S = spr("gas", 16, 64, g => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(200,200,90,0)"); gr.addColorStop(0.5, "rgba(190,196,80,.45)"); gr.addColorStop(1, "rgba(220,220,120,.7)"); g.fillStyle = gr; g.beginPath(); g.moveTo(8, 0); g.quadraticCurveTo(16, 30, 12, 64); g.lineTo(4, 64); g.quadraticCurveTo(0, 30, 8, 0); g.fill(); });
        for (let i = 0; i < (low ? 1 : 2); i++) { const w = 16 + i * 6 + Math.sin(t * 8 + i) * 2; c.drawImage(S, x - w / 2 + Math.sin(t * 5 + i) * 1.5, y - H, w, H); }
      }
    },
    light(tr, h) { if (tr.er > 0) h(tr.x, tr.y - 30, 40, 0.4, "#c8c860"); }
  });

  def("seeschlange", {
    g: "see", n: ["Seeschlange", "Lake serpent"], d: ["Zwei bernsteinfarbene Augen unter der Oberfläche – dann schnellt sie hervor und beißt.", "Two amber eyes beneath the surface – then it lunges and bites."],
    init(tr, R) { tr.cyc = 6.4 + R(); tr.side = R() < 0.5 ? 1 : -1; tr.kk = 0; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, w0 = tr.cyc - 2.2; tr.c = c;
      if (c > w0 && c < w0 + 0.9) { if (!tr.w) { tr.w = true; tr.side = P && Math.abs(pcx(P) - tr.x) < 80 ? U.sign(pcx(P) - tr.x) || 1 : tr.side; play(amb("e_schlange_", 4), tr.x, tr.y, { vol: 0.7 }); } if (Math.random() < dt * 8) FX.p({ x: tr.x + (Math.random() - 0.5) * 12, y: tr.y - 1, vx: 0, vy: -15, life: 0.5, size: 1.4, col: "#c8d0a0", kind: "bubble" }); }
      if (c < w0) tr.w = false;
      const s0 = w0 + 0.9; tr.kk = c < s0 ? 0 : c < s0 + 0.8 ? Math.sin((c - s0) / 0.8 * Math.PI) : 0;
      if (c >= s0 && !tr.s) { tr.s = true; play("splash", tr.x, tr.y, { vol: 0.8 }); play("bite", tr.x, tr.y, { vol: 0.6, rate: 0.7 }); FX.burst(tr.x, tr.y - 2, 16, { col: ["#2a3a2a", "#c8d0a0"], sp: 140, ang: -Math.PI / 2, spread: 1.6, life: 0.7, size: 2, kind: "drop", g: 500 }); }
      if (c < s0) tr.s = false;
      if (tr.kk > 0.4) { const hx = tr.x + tr.side * 36 * tr.kk, hy = tr.y - 34 * tr.kk; tr.hx = hx; tr.hy = hy; if (P && circRect(hx, hy, 9, HB(P))) hp(0.15, tr.x, { kb: 240, kbUp: 220, eff: { bleed: 1 } }); foes(e => circRect(hx, hy, 9, e), e => he(tr, e, 55, null, { bleed: 2 })); }
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, c0 = tr.c || 0, w0 = tr.cyc - 2.2;
      ell(c, x, y - 0.5, 13, 2.8, "#0a100c"); ell(c, x, y - 0.8, 11, 2.1, "#16241a");
      if (!low) { c.strokeStyle = "rgba(184,208,80,.4)"; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x, y - 0.6, 13, 2.8, 0, 0, 6.283); c.stroke(); }
      if (c0 > w0 && c0 < w0 + 0.95 && tr.kk <= 0) { const e = 0.6 + Math.sin(t * 6) * 0.3; circ(c, x - 2 + tr.side, y - 1, 0.7, "#ffb030"); circ(c, x + 2 + tr.side, y - 1, 0.7, "#ffb030"); glow(c, x + tr.side, y - 1, 6, "rgba(255,170,40,.6)", e); }
      if (tr.kk > 0) {
        const hx = x + tr.side * 36 * tr.kk, hy = y - 34 * tr.kk, mx = x + tr.side * 4, my = y - 40 * tr.kk;
        for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? "#3e5236" : "#16201a"; c.lineWidth = pass ? 5 : 7.5; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y + 2); c.quadraticCurveTo(mx, my, hx - tr.side * 3, hy + 2); c.stroke(); }
        if (!low) { c.strokeStyle = "#c8b890"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + tr.side * 2, y + 2); c.quadraticCurveTo(mx + tr.side * 2.5, my + 2, hx - tr.side * 1, hy + 4); c.stroke(); c.fillStyle = "#c85a5a"; c.beginPath(); c.moveTo(mx - 2, my + 6); c.lineTo(mx - tr.side * 4, my - 1); c.lineTo(mx + 2, my + 4); c.fill(); }
        c.save(); c.translate(hx, hy); c.scale(tr.side, 1); c.rotate(0.4);
        ell(c, 0, 0, 6, 4, "#2a3a26"); c.fillStyle = "#c8b890"; c.beginPath(); c.moveTo(1, 1.5); c.lineTo(8, 3 + tr.kk * 2); c.lineTo(1, 3.5); c.fill();
        c.fillStyle = "#f0e8d8"; c.fillRect(4, 2.2, 0.8, 1.4); c.fillRect(6, 2.6, 0.8, 1.4); circ(c, 1, -1.8, 0.9, "#ffb030"); c.restore();
      }
    }
  });

  /* ---------- GLUTGASSEN: Lavafontänen, Feuerspeier, Glutkessel ---------- */
  def("lavafontaene", {
    g: "glut", n: ["Lavafontäne", "Lava fountain"], d: ["Der Spalt glüht, der Boden grollt – dann schießt Lava empor und spritzt Brocken umher.", "The crack glows, the ground rumbles – then lava shoots up, flinging blobs."],
    init(tr) { tr.cyc = 5.2; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; tr.hot = c > 3.1 && c < 4.1 ? (c - 3.1) : c >= 4.1 ? 1 : 0.2;
      if (c > 3.1 && c < 4.1) { if (!tr.w) { tr.w = true; play(amb("e_grollen_", 2), tr.x, tr.y, { vol: 0.6 }); FX.addShake(0.8); } if (Math.random() < dt * 14) FX.p({ x: tr.x + (Math.random() - 0.5) * 10, y: tr.y - 2, vx: (Math.random() - 0.5) * 20, vy: -50 - Math.random() * 40, life: 0.6, size: 1.5, col: "#ffb060", kind: "ember", add: true }); }
      if (c < 3.1) tr.w = false;
      tr.er = c >= 4.1 ? Math.min(1, (c - 4.1) * 6) * Math.min(1, (tr.cyc - c) * 4) : 0;
      if (tr.er > 0) {
        if (!tr.e) { tr.e = true; play("fireBig", tr.x, tr.y, { vol: 0.6, rate: 0.7 }); play(amb("e_brutzeln_", 2), tr.x, tr.y, { vol: 0.5 }); for (let i = 0; i < 3; i++) shots.push({ k: "lava", x: tr.x, y: tr.y - 40, vx: (Math.random() - 0.5) * 220, vy: -240 - Math.random() * 120, g: 700, frac: 0.06, edmg: 20, src: tr, life: 3, hitP: false }); }
        const r = box(tr.x - 6, tr.y - 64 * tr.er, 12, 64 * tr.er);
        if (P && ov(r, HB(P))) hp(0.12, tr.x, { kb: 120, kbUp: 260, eff: { burn: 1 } });
        foes(e => ov(r, e), e => he(tr, e, 40, null, { burn: 2 }));
      } else tr.e = false;
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.y, h = tr.hot || 0;
      c.fillStyle = "#1a0e0a"; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x - 4, y - 2.5); c.lineTo(x + 4, y - 2.5); c.lineTo(x + 10, y); c.fill();
      c.strokeStyle = "rgb(255," + (80 + h * 140 | 0) + ",30)"; c.lineWidth = 1 + h; c.beginPath(); c.moveTo(x - 8, y - 0.5); c.lineTo(x - 3, y - 1.5); c.lineTo(x, y - 0.8); c.lineTo(x + 4, y - 1.8); c.lineTo(x + 8, y - 0.4); c.stroke();
      glow(c, x, y - 2, 8 + h * 10, "rgba(255,120,30,.6)", 0.5 + h * 0.5);
      if (tr.er > 0) {
        const H = 64 * tr.er, S = Z.flameSpr ? Z.flameSpr(["#ff5a10", "#ffb040", "#fff0c0"]) : null;
        if (S) { c.save(); c.globalCompositeOperation = "lighter"; c.drawImage(S, x - 8 + Math.sin(t * 30), y - H, 16, H); if (!low) c.drawImage(S, x - 5, y - H * 0.8, 10, H * 0.8); c.restore(); }
        c.fillStyle = "#c83a10"; for (let i = 0; i < 4; i++) circ(c, x + Math.sin(t * 9 + i * 2) * 4, y - H + 2 + i * 3, 2 - i * 0.3, "#ff7020");
      }
    },
    light(tr, h) { h(tr.x, tr.y - 4 - (tr.er || 0) * 30, 30 + (tr.er || 0) * 60, 0.5 + (tr.hot || 0) * 0.3, "#ff7a2a"); }
  });

  def("feuerspeier", {
    g: "glut", n: ["Feuerspeier", "Fire-spitter"], d: ["Augen und Maul glimmen grün, Rauch quillt aus den Nüstern – dann speit der Steinkopf grünes Feuer.", "Eyes and maw glow green, smoke curls from the nostrils – then the stone head breathes green fire."],
    init(tr) { tr.cyc = 5; tr.ly = tr.y - 14; tr.range = Math.min(76, rangeTo(tr.wx, tr.ly, tr.dir, 80)); },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; tr.warn = c > 3 && c < 3.9 ? (c - 3) / 0.9 : 0;
      if (tr.warn) { if (!tr.w) { tr.w = true; play(amb("e_blasebalg_", 2), tr.wx, tr.ly, { vol: 0.6, rate: 0.8 }); } if (Math.random() < dt * 10) puff(tr.wx + tr.dir * 8, tr.ly - 3, "rgba(60,60,50,.5)", 1, { vx: tr.dir * 10 }); }
      if (c < 3) tr.w = false;
      tr.fire = c >= 3.9 ? Math.min(1, (c - 3.9) * 5) * Math.min(1, (tr.cyc - c) * 4) : 0;
      if (tr.fire > 0) {
        if (!tr.f) { tr.f = true; play("fireBig", tr.wx, tr.ly, { vol: 0.6, rate: 1.1 }); }
        const L0 = tr.range * tr.fire, r = tr.dir > 0 ? box(tr.wx + 6, tr.ly - 6, L0, 12) : box(tr.wx - 6 - L0, tr.ly - 6, L0, 12);
        if (P && ov(r, HB(P))) hp(0.1, tr.wx, { kb: 180, kbUp: 120, eff: { burn: 1 } });
        foes(e => ov(r, e), e => he(tr, e, 30, null, { burn: 2 }));
        if (Math.random() < dt * 40) FX.p({ x: tr.wx + tr.dir * (8 + Math.random() * L0), y: tr.ly + (Math.random() - 0.5) * 8, vx: tr.dir * 60, vy: -30, life: 0.4, size: 2.5, col: Math.random() < 0.5 ? "#a8f050" : "#3aa020", kind: "glow", add: true });
      } else tr.f = false;
    },
    draw(c, tr, t, low) {
      const x = tr.wx, y = tr.ly, d = tr.dir, w = tr.warn || 0, on = tr.fire > 0 ? 1 : w;
      const S = spr("speier", 16, 18, g => {
        g.fillStyle = "#1a1412"; g.beginPath(); g.moveTo(0, 1); g.lineTo(10, 3); g.quadraticCurveTo(16, 6, 15, 10); g.lineTo(9, 11); g.lineTo(14, 14); g.quadraticCurveTo(8, 18, 0, 17); g.closePath(); g.fill();
        g.fillStyle = "#4a3e38"; g.beginPath(); g.moveTo(0, 2); g.lineTo(10, 4); g.quadraticCurveTo(15, 6.5, 14, 9.5); g.lineTo(8, 10.5); g.lineTo(13, 13.5); g.quadraticCurveTo(8, 17, 0, 16); g.closePath(); g.fill();
        g.fillStyle = "#6a5a50"; g.fillRect(1, 3, 9, 1); g.fillStyle = "#2a2220"; g.beginPath(); g.moveTo(3, 2); g.lineTo(0, -1 + 2); g.lineTo(6, 2.5); g.fill();
        g.beginPath(); g.moveTo(4, 2.5); g.quadraticCurveTo(2, -2, 7, 0); g.lineTo(6, 2.8); g.fill();
        g.fillStyle = "#0a0806"; g.fillRect(8, 10.5, 6, 2.5);
        g.fillStyle = "#c8c0a8"; for (let i = 0; i < 3; i++) { g.fillRect(9 + i * 1.6, 10.5, 0.7, 1); g.fillRect(9.5 + i * 1.6, 12.3, 0.7, 0.8); }
      });
      c.save(); c.translate(x, y - 9); if (d < 0) c.scale(-1, 1); c.drawImage(S, 0, 0, 16, 18);
      circ(c, 9, 6, 0.9, on > 0 ? "#a8f050" : "#2a2220"); c.fillStyle = on > 0 ? "rgba(168,240,80," + (0.3 + on * 0.7).toFixed(2) + ")" : "#0a0806"; c.fillRect(8.5, 11, 5, 1.6);
      c.restore();
      if (on > 0 && !low) { glow(c, x + d * 9, y - 3, 4 + on * 3, "rgba(168,240,80,.7)"); glow(c, x + d * 11, y + 3, 5 + on * 5, "rgba(120,220,60,.6)"); }
      if (tr.fire > 0 && Z.flameSpr) {
        const L0 = tr.range * tr.fire, Sf = Z.flameSpr(["#3aa020", "#a8f050", "#f0ffd0"]);
        c.save(); c.globalCompositeOperation = "lighter"; c.translate(x + d * 12, y + 3); c.rotate(d > 0 ? Math.PI / 2 : -Math.PI / 2);
        c.drawImage(Sf, -7 + Math.sin(t * 30), -L0, 14, L0); if (!low) c.drawImage(Sf, -4, -L0 * 0.8, 8, L0 * 0.8);
        c.restore();
      }
    },
    light(tr, h) { if (tr.fire > 0) h(tr.wx + tr.dir * tr.range * 0.5, tr.ly + 3, 60, 0.7, "#a8f050"); else if (tr.warn) h(tr.wx + tr.dir * 10, tr.ly, 20, 0.4, "#a8f050"); }
  });

  def("glutkessel", {
    g: "glut", n: ["Schlackekessel", "Slag crucible"], d: ["Der Tiegel neigt sich zischend, der Rand glüht grün – dann gießt er glühende Schlacke aus.", "The crucible tilts hissing, its rim glowing green – then it pours glowing slag."],
    init(tr) { tr.cyc = 5.4; tr.cl = U.clamp((tr.fy - tr.ay) * 0.3, 10, 30); },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc; tr.c = c; tr.tilt = c > 3.2 && c < 4.2 ? (c - 3.2) : c >= 4.2 && c < 5.1 ? 1 : c >= 5.1 ? Math.max(0, 1 - (c - 5.1) * 3) : 0;
      if (c > 3.2 && !tr.w) { tr.w = true; play(amb("e_zischen_", 2), tr.x, tr.ay, { vol: 0.5 }); } if (c < 3.2) tr.w = false;
      tr.pour = c >= 4.2 && c < 5.1;
      if (tr.pour) {
        if (Math.random() < dt * 18) shots.push({ k: "schlacke", x: tr.x + 6, y: tr.ay + tr.cl + 6, vx: 10 + Math.random() * 20, vy: 20, g: 800, frac: 0.07, edmg: 25, src: tr, life: 2, hitP: false });
        if (!tr.p) { tr.p = true; play("fire", tr.x, tr.ay, { vol: 0.5 }); }
      } else tr.p = false;
    },
    draw(c, tr, t, low) {
      const x = tr.x, y = tr.ay + tr.cl, a = (tr.tilt || 0) * 0.7;
      chain(c, x - 5, tr.ay, x - 6, y - 2, "#4a3a30", "#7a5a44"); chain(c, x + 5, tr.ay, x + 6, y - 2, "#4a3a30", "#7a5a44");
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = "#1a1210"; c.beginPath(); c.moveTo(-8, -2); c.lineTo(8, -2); c.lineTo(6, 7); c.quadraticCurveTo(0, 10, -6, 7); c.closePath(); c.fill();
      c.fillStyle = "#3a2e28"; c.beginPath(); c.moveTo(-7, -1.4); c.lineTo(7, -1.4); c.lineTo(5.4, 6.4); c.quadraticCurveTo(0, 9, -5.4, 6.4); c.closePath(); c.fill();
      c.fillStyle = "#ff8a2a"; c.fillRect(-7, -2.4, 14, 1.2); c.fillStyle = "#fff0c0"; c.fillRect(-4, -2.2, 6, 0.5);
      c.fillStyle = "#5a4a40"; c.fillRect(-8.5, -3, 17, 1);
      c.restore();
      glow(c, x, y - 3, 8 + (tr.tilt || 0) * 6, "rgba(255,140,40,.55)");
      if ((tr.tilt || 0) > 0.2 && !low) glow(c, x + 7, y - 2, 5, "rgba(140,230,70,.6)");
      if ((tr.c || 0) > 3.2 && !tr.pour) shadow(c, x + 8, tr.fy, 8, 0.3);
    },
    light(tr, h) { h(tr.x, tr.ay + tr.cl, 36, 0.55, "#ff8a3a"); }
  });

  /* ---------- STURMSPITZE: Blitzeinschläge, Hagel (+ Böen) ---------- */
  def("blitz", {
    g: "sturm", n: ["Blitzeinschlag", "Lightning strike"], d: ["Ein glühendes Zeichen am Boden folgt dir, die Luft knistert – dann schlägt es ein. Lock Gegner hinein!", "A glowing sigil follows you, the air crackles – then it strikes. Lure enemies in!"],
    init(tr) { tr.st = "ruhe"; tr.t = 1 + Math.random() * 2; tr.tx = (tr.x0 + tr.x1) / 2; },
    upd(tr, dt, P) {
      tr.t -= dt;
      const inZone = P && pcx(P) > tr.x0 - 40 && pcx(P) < tr.x1 + 40 && Math.abs(P.y + P.h - tr.y) < 80; const gy = tr.gy || tr.y;
      if (tr.st === "ruhe" && tr.t <= 0) {
        if (inZone || Math.random() < 0.3) { tr.st = "zeichen"; tr.t = 1.1; tr.tx = inZone ? U.clamp(pcx(P), tr.x0 + 8, tr.x1 - 8) : tr.x0 + Math.random() * (tr.x1 - tr.x0); tr.gy = W.groundBelow(tr.tx, tr.y - 56, 120) || tr.y; play("zap", tr.tx, tr.y, { vol: 0.25, rate: 0.6 }); play("thunder", tr.tx, tr.y, { vol: 0.2, rate: 1.3 }); }
        else tr.t = 1;
      } else if (tr.st === "zeichen") {
        if (Math.random() < dt * 18) FX.p({ x: tr.tx + (Math.random() - 0.5) * 30, y: gy - 1, vx: 0, vy: -40 - Math.random() * 30, life: 0.35, size: 1, col: "#fff0c0", kind: "spark", add: true });
        if (tr.t <= 0) {
          tr.st = "schlag"; tr.t = 0.28; play("thunder", tr.tx, tr.y, { vol: 0.9 }); play("zap", tr.tx, tr.y, { vol: 0.7 }); Z.lightFlash && Z.lightFlash(tr.tx, tr.y - 40, 200, "#fff0c0", 1, 0.4); FX.flashScreen("#fff6d8", 0.3); FX.addShake(4);
          tr.path = []; let px = tr.tx + (Math.random() - 0.5) * 40, py = Math.min(gy - 140, Z.cam.y - 10); while (py < gy) { tr.path.push([px, py]); py += 10 + Math.random() * 14; px += (Math.random() - 0.5) * 14; px += (tr.tx - px) * 0.3; } tr.path.push([tr.tx, gy]);
          const hit = b => Math.abs(b.x + b.w / 2 - tr.tx) < 20 && b.y + b.h > gy - 60 && b.y < gy + 2;
          if (P && hit(HB(P))) hp(0.15, tr.tx, { kb: 220, kbUp: 260 });
          foes(e => hit(e), e => he(tr, e, 70, null, { stun: 1.5 }));
          sparks(tr.tx, gy - 2, 20, ["#fff6d8", "#ffd27a", "#fff"], { sp: 220, ang: -Math.PI / 2, spread: 2.6 }); puff(tr.tx, gy - 4, "rgba(60,50,50,.5)", 4);
        }
      } else if (tr.st === "schlag" && tr.t <= 0) { tr.st = "ruhe"; tr.t = 2 + Math.random() * 2; }
    },
    draw(c, tr, t, low) {
      if (tr.st === "zeichen") {
        const k = 1 - tr.t / 1.1, x = tr.tx, y = tr.gy || tr.y;
        c.save(); c.globalAlpha = 0.35 + k * 0.6; c.strokeStyle = "#ffd27a"; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y - 0.5, 18, 2.8, 0, 0, 6.283); c.stroke();
        c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * 2; c.moveTo(x + Math.cos(a) * 6, y - 0.5 + Math.sin(a) * 1); c.lineTo(x + Math.cos(a) * 16, y - 0.5 + Math.sin(a) * 2.4); } c.stroke(); c.restore();
        glow(c, x, y - 2, 10 + k * 12, "rgba(255,230,160,.5)", 0.4 + k * 0.6);
        if (!low) { c.save(); c.globalAlpha = 0.15 + k * 0.25; c.fillStyle = "#2a2028"; c.beginPath(); c.ellipse(x, Z.cam.y + 8, 40, 10, 0, 0, 6.283); c.fill(); c.restore(); }
      }
      if (tr.st === "schlag" && tr.path) {
        c.save(); c.globalCompositeOperation = "lighter";
        for (const [w, col] of [[5, "rgba(255,220,150,.35)"], [2, "#fff6d8"]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); tr.path.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
        c.restore(); glow(c, tr.tx, (tr.gy || tr.y) - 4, 30, "rgba(255,240,200,.8)");
      }
      if (tr.st === "ruhe" && !low && tr.t < 0.4) glow(c, tr.tx, tr.y - 6, 10, "rgba(255,120,40,.25)", tr.t / 0.4);
    },
    light(tr, h) { if (tr.st === "schlag") h(tr.tx, (tr.gy || tr.y) - 30, 160, 1, "#fff6d8"); else if (tr.st === "zeichen") h(tr.tx, (tr.gy || tr.y) - 4, 26, 0.5, "#ffd27a"); }
  });

  def("hagel", {
    g: "sturm", n: ["Hagelschauer", "Hailstorm"], d: ["Die Wolke verdunkelt sich, erste Körner prasseln – dann hagelt es. Unterstellen oder durchrollen.", "The cloud darkens, first pellets patter – then it hails. Take cover or roll through."],
    init(tr, R) { tr.cyc = 7 + R() * 2; },
    upd(tr, dt, P) {
      const c = (clock + tr.ph) % tr.cyc, w0 = tr.cyc - 2.8; tr.c = c;
      tr.dark = c > w0 ? Math.min(1, (c - w0) / 1) : 0;
      const cy = tr.y - 5 * T;
      if (c > w0 && c < w0 + 1) { if (!tr.w) { tr.w = true; play(amb("n_kies_", 8), (tr.x0 + tr.x1) / 2, tr.y, { vol: 0.5 }); } if (Math.random() < dt * 4) minis.push({ k: "hagel", x: tr.x0 + Math.random() * (tr.x1 - tr.x0), y: cy, vx: 10, vy: 200, life: 2, t: 0, src: tr, dmg: false }); }
      if (c < w0) tr.w = false;
      tr.on = c >= w0 + 1;
      if (tr.on) { if (Math.random() < dt * 34) minis.push({ k: "hagel", x: tr.x0 + Math.random() * (tr.x1 - tr.x0), y: cy + Math.random() * 10, vx: 20 + Math.random() * 20, vy: 280 + Math.random() * 120, life: 2, t: 0, src: tr, dmg: true }); if (Math.random() < dt * 5) play(amb("n_kies_", 8), (tr.x0 + tr.x1) / 2, tr.y, { vol: 0.3, gap: 0.2 }); }
    },
    draw(c, tr, t, low) {
      if (!(tr.dark > 0)) return;
      const cy = tr.y - 5 * T, mx = (tr.x0 + tr.x1) / 2, w = (tr.x1 - tr.x0) / 2 + 10;
      c.save(); c.globalAlpha = 0.25 + tr.dark * 0.45;
      for (let i = 0; i < (low ? 3 : 6); i++) ell(c, mx - w + i * w / 2.6 + Math.sin(t + i) * 3, cy - 4 + (i % 2) * 3, 12 + (i % 3) * 3, 6, i % 2 ? "#3a3438" : "#2a2428");
      c.restore();
      if (tr.on && !low) { c.save(); c.globalAlpha = 0.12; c.fillStyle = "#e8e0d8"; c.fillRect(tr.x0, cy, tr.x1 - tr.x0, tr.y - cy); c.restore(); }
    }
  });

  /* ======================= UMDEUTUNG DER VORLAGEN-ZEICHEN ======================= */
  /* Vorlagen legen k r p f z < > – je Gebiet werden einige davon zu den eigenen Fallen (gleiche Platzierungsart). */
  const REMAP = {
    torhof: { r: [["ziegel", 1]] },
    keller: { f: [["gaerfass", 1]], "<": [["rattenloch", 0.7]], ">": [["rattenloch", 0.7]] },
    hallen: { r: [["kronleuchter", 0.7]], f: [["ruestung", 0.7]], "<": [["gobelin", 0.8]], ">": [["gobelin", 0.8]] },
    wehrgang: { r: [["pechnase", 0.6]], "<": [["balliste", 0.8]], ">": [["balliste", 0.8]], z: [["boee", 0.6]] },
    verlies: { p: [["morgenstern", 0.6]], k: [["bodenluke", 0.35]], f: [["folterrad", 0.4]] },
    hafen: { p: [["kranhaken", 0.9]], r: [["netz", 0.6]], f: [["tentakel", 0.8]] },
    glocken: { p: [["glocke", 0.8]], r: [["gewicht", 0.7]], z: [["zahnrad", 1]] },
    schlund: { r: [["eiersack", 0.35], ["giftspinne", 0.35]], k: [["netzfalle", 0.35]] },
    schmiede: { r: [["hammer", 0.4], ["funkenregen", 0.4]], "<": [["runenstrahl", 0.8]], ">": [["runenstrahl", 0.8]] },
    zinnen: { r: [["zinnenbruch", 0.8]], k: [["blitzableiter", 0.3]] },
    see: { k: [["algen", 0.35]], f: [["gassaeule", 1]], r: [["seeschlange", 0.3]] },
    glut: { f: [["lavafontaene", 0.8]], "<": [["feuerspeier", 0.9]], ">": [["feuerspeier", 0.9]], r: [["glutkessel", 0.5]] },
    sturm: { r: [["blitz", 0.45]], k: [["blitz", 0.3]], p: [["hagel", 0.3]] }
  };
  Z.fallenRemap = function (lv, lst, rnd) {
    const extra = [], biome = lv && lv.biome, map = REMAP[biome] || {}, out = [];
    const done = new Set();
    for (const m of lst) {
      if (D[m.t]) { extra.push(m); continue; }
      if (done.has(m)) continue;
      const opts = map[m.t];
      let pick = null;
      if (opts) { let r = rnd(); for (const [k, p] of opts) { if (r < p) { pick = k; break; } r -= p; } }
      if (!pick) { out.push(m); continue; }
      const e = { t: pick, x: m.x, y: m.y, from: m.t };
      if (m.t === "<" || m.t === ">") { e.dir = m.t === ">" ? 1 : -1; e.y = m.y + 1; e.run = 7; }
      if (m.t === "z") { let x0 = m.x, x1 = m.x; while (lst.some(o => o.t === "z" && o.y === m.y && o.x === x0 - 1)) x0--; while (lst.some(o => o.t === "z" && o.y === m.y && o.x === x1 + 1)) x1++; for (const o of lst) if (o.t === "z" && o.y === m.y && o.x >= x0 && o.x <= x1) done.add(o); e.x = x0; e.x1 = x1; }
      extra.push(e);
    }
    lst.length = 0; for (const m of out) lst.push(m);
    return extra;
  };

  /* ======================= AUFBAU ======================= */
  const STICKY = { netzfalle: 1, baerenfalle: 1, algen: 1, netz: 1 };
  Z.setupFallen = function (lv, extra, rnd) {
    list.length = 0; shots.length = 0; minis.length = 0; pools.length = 0; waves.length = 0;
    if (!lv || !extra || !extra.length) return;
    const PL = Z.TRAPPLACE || {}, reach = lv.reach, W0 = lv.W;
    const st = lv.start || { x: -99, y: -99 };
    const reachNear = (x, y) => !reach || [0, -1, 1, -2, 2].some(dx => [0, -1, 1].some(dy => reach[(y + dy) * W0 + x + dx]));
    const bad = (x, y) => Math.abs(x - st.x) < 9 && Math.abs(y - st.y) < 6 || (lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3) || (lv.loot || []).some(l => Math.abs(l.x - x) < 3 && Math.abs(l.y - y) < 2);
    for (const m of extra) {
      const d = D[m.t]; if (!d) continue;
      const at = PL[m.t] || "boden";
      const tr = { k: m.t, tx: m.x, ty: m.y, ph: rnd() * 20, cd: new WeakMap(), run: m.run };
      const fy = api.floorBelow(m.x, m.y), fr = Math.round(fy / T) - 1;
      if (at === "boden" || at === "tor") { tr.x = m.x * T + 8; tr.y = fy; }
      else if (at === "decke" || at === "pendel") { tr.x = m.x * T + 8; tr.ay = api.ceilingAbove(m.x, m.y); tr.fy = fy; if (tr.fy - tr.ay < 40) continue; }
      else if (at === "wand") { tr.dir = m.dir || 1; tr.wx = tr.dir > 0 ? m.x * T : (m.x + 1) * T; tr.y = fy; tr.x = tr.wx; }
      else { tr.x0 = (m.x1 != null ? m.x : m.x - 3) * T; tr.x1 = ((m.x1 != null ? m.x1 : m.x + 3) + 1) * T; tr.y = fy; tr.x = (tr.x0 + tr.x1) / 2; }
      if (bad(m.x, fr)) continue;
      if (!reachNear(m.x, fr)) continue;
      if (list.some(o => Math.abs((o.x || 0) - tr.x) < 40 && Math.abs((o.y || o.fy || 0) - (tr.y || tr.fy)) < 40)) continue;
      /* Festhaltefallen (Netz, Bärenfalle, Algen) nie direkt an Abgrund, Stacheln oder Flüssigkeit */
      if (STICKY[m.t]) { let bad2 = false; for (let dx = -3; dx <= 3 && !bad2; dx++) for (let dy = -1; dy <= 2; dy++) { const v = lv.get(m.x + dx, fr + dy); if (v === 9 || v === 3 || v === 5 || v === 6) { bad2 = true; break; } } if (bad2) continue; }
      /* nicht direkt neben eine Grundfalle (Stacheln, Säge …): sonst Doppeltreffer, z. B. Netz + Stacheln */
      const ty0 = tr.y || tr.fy;
      if ((Z.traps || []).some(o => o.k !== "feder" && Math.abs((o.x != null ? o.x : o.ax != null ? o.ax : ((o.x0 || 0) + (o.x1 || 0)) / 2) - tr.x) < 44 && Math.abs((o.y != null ? o.y : o.fy != null ? o.fy : ty0) - ty0) < 40)) continue;
      d.init && d.init(tr, rnd);
      list.push(tr);
    }
  };

  /* Nach dem kompletten Gebietsaufbau (Ereignisse, Erkundung, Amboss stehen fest): Fallen, deren Wirkbereich
     einen Start, eine Tür, einen Amboss, die Händlerin/einen Schrein, Schlüssel, Hebel, Prüfung, Truhe oder
     Fundstück berührt, werden entfernt – dort soll man in Ruhe stehen und bedienen können. */
  Z.fallenClear = function () {
    const lv = Z.level; if (!lv || !list.length) return 0;
    const pts = [];
    const add = (x, y) => { if (isFinite(x) && isFinite(y)) pts.push([x, y]); };
    if (lv.start) add(lv.start.x * T + 8, (lv.start.y + 1) * T);
    for (const d of lv.doors || []) add(d.x * T + 8, (d.y + 1) * T);
    for (const a of Z.anvils || []) add(a.x, a.y);
    for (const e of Z.abEvents || []) if (e.k !== "dieb") add(e.x, e.y);
    const S = Z.erkundung && Z.erkundung();
    if (S) { for (const o of [].concat(S.keys, S.levers, S.locks, S.shrines, S.rewards)) if (o) add(o.x, o.y); if (S.trial) add(S.trial.x, S.trial.y); }
    for (const p of Z.pickups || []) if (p.kind !== "gold") add(p.x + (p.w || 0) / 2, p.y + (p.h || 0));
    for (const it of Z.interacts || []) add(it.x, it.y);
    const zone = tr => {
      const at = (Z.TRAPPLACE || {})[tr.k] || "boden", fy = tr.y != null && at !== "decke" && at !== "pendel" ? tr.y : tr.fy;
      if (at === "wand") { const r = Math.min(tr.range || (tr.run || 6) * T, 7 * T); return [tr.dir > 0 ? tr.wx : tr.wx - r, tr.dir > 0 ? tr.wx + r : tr.wx, fy]; }
      if (tr.x0 != null) return [tr.x0, tr.x1, fy];
      const w = at === "pendel" ? 3 * T : 22; return [tr.x - w, tr.x + w, fy];
    };
    let n = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const [a, b, fy] = zone(list[i]);
      if (pts.some(([x, y]) => x > a - 26 && x < b + 26 && Math.abs(y - fy) < 40)) { list.splice(i, 1); n++; }
    }
    return n;
  };

  /* ======================= UPDATE ======================= */
  const NAMES0 = { pendel: ["Pendelklinge", "Pendulum blade"], flamme: ["Flammendüse", "Flame jet"], stachel: ["Stachelfalle", "Spike trap"], stein: ["Steinschlag", "Falling rock"], saege: ["Bodensäge", "Floor saw"], pfeil: ["Pfeilfalle", "Arrow trap"] };
  const DESC0 = { pendel: ["Schwingt im Takt – zwischen den Schwüngen durch.", "Swings in rhythm – pass between swings."], flamme: ["Die Düse glüht auf, bevor sie feuert.", "The nozzle glows before it fires."], stachel: ["Ketten rasseln, dann stoßen Stacheln hoch.", "Chains rattle, then spikes thrust up."], stein: ["Staub rieselt, ein Schatten wächst – dann fällt er.", "Dust trickles, a shadow grows – then it falls."], saege: ["Fährt im Schlitz hin und her. Drüberspringen.", "Runs back and forth in its slot. Jump over."], pfeil: ["Das Loch glimmt kurz vor dem Schuss.", "The hole glows just before it fires."] };
  function firstContact() {
    if (toastCd > 0 || !Z.meta || !Z.toast) return;
    const m = Z.meta; m.fallenSeen = m.fallenSeen || {};
    const sk = Z.trapSkin ? Z.trapSkin() : {}, biome = Z.level && Z.level.biome;
    const tell = (key, n, d, x, y) => { if (m.fallenSeen[key] || !near(x, y, 150) || !vis(x, y, -20)) return false; m.fallenSeen[key] = 1; Z.saveMeta && Z.saveMeta(); toastCd = 6; /* Erstkontakt: steht schon ein Warnschild davor (schilder.js), reicht das */ if (Z.schilder && Z.schilder.hat("falle:" + key)) return true; /* sonst kleine Zeile direkt an der Falle statt einer Meldung oben */ if (Z.ui && Z.ui.notify) Z.ui.notify("⚠ <b>" + L(n) + "</b><small>" + L(d) + "</small>", { prio: 1, art: "gefahr", ort: "welt", x, y: y - 6, dauer: 3400 }); else Z.toast("<b>" + L(n) + "</b><br><small>" + L(d) + "</small>", 3000); return true; };
    for (const tr of list) { const d = D[tr.k]; if (d && tell(tr.k, d.n, d.d, tr.x, tr.y || tr.fy)) return; }
    const CH = { pendel: "p", flamme: "f", stachel: "k", stein: "r", saege: "z" };
    for (const tr of Z.traps || []) {
      if (!NAMES0[tr.k]) continue;
      const n = (sk.name && sk.name[CH[tr.k]]) || NAMES0[tr.k], key = tr.k + ":" + L(n);
      if (tell(key, n, DESC0[tr.k], tr.x || tr.ax, tr.y || tr.ay)) return;
    }
    void biome;
  }
  /* Für die Warnschilder (schilder.js): alle noch unbekannten Fallen dieses Gebiets mit Name, Satz und Bodenpunkt */
  Z.fallenNeu = function () {
    const m = Z.meta || {}, seen = m.fallenSeen || {}, out = [], sk = Z.trapSkin ? Z.trapSkin() : {};
    const fl = (x, y) => { try { return api.floorBelow(Math.floor(x / T), Math.floor(y / T)); } catch (_) { return y; } };
    for (const tr of list) { const d = D[tr.k]; if (!d || seen[tr.k]) continue; const x = tr.x, y = tr.y || tr.fy || (tr.ay != null ? fl(x, tr.ay + 8) : null); if (Number.isFinite(x) && Number.isFinite(y)) out.push({ key: tr.k, n: d.n, d: d.d, x, y }); }
    const CH = { pendel: "p", flamme: "f", stachel: "k", stein: "r", saege: "z" };
    for (const tr of Z.traps || []) {
      if (!NAMES0[tr.k]) continue;
      const n = (sk.name && sk.name[CH[tr.k]]) || NAMES0[tr.k], key = tr.k + ":" + L(n); if (seen[key]) continue;
      const x = tr.x != null ? tr.x : tr.ax, y = tr.k === "pendel" ? tr.ay + tr.len + 17 : tr.k === "stein" ? fl(x, tr.ay + 8) : tr.y;
      if (Number.isFinite(x) && Number.isFinite(y)) out.push({ key, n, d: DESC0[tr.k], x, y });
    }
    return out;
  };
  const up0 = Z.updateParcours;
  Z.updateParcours = function (dt) {
    if (up0) up0.apply(this, arguments);
    clock += dt; toastCd = Math.max(0, toastCd - dt);
    if (!Z.level) return;
    const P = P0();
    for (const tr of list) { const d = D[tr.k]; if (!d) continue; try { d.upd(tr, dt, P); } catch (e) { console.error(tr.k, e); tr.k = "_x"; } }
    for (let i = list.length - 1; i >= 0; i--) if (!D[list[i].k]) list.splice(i, 1);
    /* Geschosse: Ballistenbolzen, Lava- und Schlackebrocken */
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; s.life -= dt; s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      const b = box(s.x - 3, s.y - 3, 6, 6);
      if (P && !s.hitP && ov(b, HB(P))) { s.hitP = true; hp(s.frac, s.x - Math.sign(s.vx || 1) * 10, { kb: s.k === "bolzen" ? 280 : 120, kbUp: 160, eff: s.k === "bolzen" ? null : { burn: 1 } }); if (!s.pierce) s.life = 0; }
      foes(e => ov(b, e), e => { he(s.src, e, s.edmg, { kb: s.k === "bolzen" ? 260 : 80 }, s.k === "bolzen" ? { bleed: 1 } : { burn: 2 }); if (!s.pierce) s.life = 0; });
      if (s.k !== "bolzen" && Math.random() < dt * 30) FX.p({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.3, size: 2, col: "#ff8a3a", kind: "glow", add: true });
      if (W.solidAt(s.x + Math.sign(s.vx) * 4, s.y) || W.solidAt(s.x, s.y + 3)) {
        if (s.k === "bolzen") { play("arrowHit", s.x, s.y, { vol: 0.6 }); FX.burst(s.x, s.y, 8, { col: ["#8a7a70", "#5a4a40"], sp: 80, life: 0.4, size: 1.6, kind: "shard", g: 400 }); pools.push({ k: "bolzen", x: s.x, y: s.y, dir: Math.sign(s.vx), t: 0, life: 3 }); }
        else { play(amb("e_brutzeln_", 2), s.x, s.y, { vol: 0.3, gap: 0.1 }); FX.burst(s.x, s.y, 6, { col: ["#ff8a3a", "#ffd27a", "#3a1a10"], sp: 70, ang: -Math.PI / 2, spread: 2, life: 0.4, size: 1.5, kind: "spark", add: true, g: 400 }); pools.push({ x: s.x, y: Math.floor((s.y + 3) / T) * T, w: 8, t: 0, life: 1.2, col: "#3a1a10", hot: true, ember: true, cd: new WeakMap() }); }
        s.life = 0;
      }
      if (s.life <= 0) shots.splice(i, 1);
    }
    /* Kleinzeug: Spinnlinge, Hagelkörner */
    for (let i = minis.length - 1; i >= 0; i--) {
      const m = minis[i]; m.t += dt;
      if (m.k === "spinnling") {
        m.vy += 900 * dt; m.x += m.vx * dt; m.y += m.vy * dt;
        if (W.solidAt(m.x, m.y + 1) || W.isPlat(Math.floor(m.x / T), Math.floor((m.y + 1) / T))) { m.y = Math.floor((m.y + 1) / T) * T - 1; m.vy = 0; m.vx *= 0.8; if (P && Math.random() < dt * 3) { m.vy = -150 - Math.random() * 80; m.vx = U.sign(pcx(P) - m.x) * (60 + Math.random() * 50); } }
        if (W.solidAt(m.x + Math.sign(m.vx) * 2, m.y - 2)) m.vx = -m.vx * 0.5;
        if (P && ov(box(m.x - 2, m.y - 3, 4, 3), HB(P))) { hp(0.03, m.x, { kb: 60, kbUp: 80, eff: { poison: 1 } }); m.t = 99; FX.burst(m.x, m.y - 1, 5, { col: ["#9ab040", "#2a1a24"], sp: 50, life: 0.3, size: 1.2, kind: "drop", g: 300 }); }
        if (P && P.act && P.act.phase === "act" && P.act.type === "melee" && Math.abs(m.x - pcx(P)) < 30 && Math.abs(m.y - P.y - P.h / 2) < 24) m.t = 99;
      } else {
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (W.solidAt(m.x, m.y + 1) || W.isPlat(Math.floor(m.x / T), Math.floor((m.y + 1) / T))) { FX.burst(m.x, m.y, 2, { col: "#f0ece4", sp: 50, ang: -Math.PI / 2, spread: 2, life: 0.4, size: 1.2, kind: "dot", g: 500 }); m.t = 99; }
        if (m.dmg && P && ov(box(m.x - 1.5, m.y - 1.5, 3, 3), HB(P))) { hp(0.035, m.x, { kb: 30, kbUp: 30, eff: { slow: 0.8 } }); m.t = 99; }
        if (m.dmg) foes(e => ov(box(m.x - 1.5, m.y - 1.5, 3, 3), e), e => { he(m.src, e, 8, { kb: 0 }); m.t = 99; });
      }
      if (m.t > m.life) minis.splice(i, 1);
    }
    /* Lachen (Pech, Glut) und steckende Bolzen */
    for (let i = pools.length - 1; i >= 0; i--) {
      const q = pools[i]; q.t += dt; if (q.t > q.life) { pools.splice(i, 1); continue; }
      if (q.k === "bolzen") continue;
      const r = box(q.x - q.w / 2, q.y - 4, q.w, 4);
      if (P && P.onGround && ov(r, P)) { if (!q.ember) Z.addStatus(P, "slow", 0.4, true); if (q.hot && q.t < q.life * 0.6 && !(P.st.burn > 0)) Z.addStatus(P, "burn", 1, true); }
      foes(e => ov(r, e), e => { Z.addStatus(e, "slow", 1); });
      if (q.hot && Math.random() < dt * 3) FX.p({ x: q.x + (Math.random() - 0.5) * q.w, y: q.y - 1, vx: 0, vy: -20, life: 0.6, size: 1.2, col: "#ff8a3a", kind: "ember", add: true });
    }
    /* Schallwellen der Glocken */
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]; w.t += dt; w.r = 4 + (w.max - 4) * (w.t / w.life);
      if (P && !w.hitP) { const dd = Math.hypot(pcx(P) - w.x, P.y + P.h / 2 - w.y); if (Math.abs(dd - w.r) < 10) { w.hitP = true; if (hp(0.05, w.x, { kb: 260, kbUp: 160 })) Z.addStatus(P, "slow", 1.2, true); } }
      foes(e => Math.abs(Math.hypot(e.x + e.w / 2 - w.x, e.y + e.h / 2 - w.y) - w.r) < 10, e => he(w.src, e, 15, { kb: 200 }, { stun: 1 }));
      if (w.t > w.life) waves.splice(i, 1);
    }
    firstContact();
  };

  /* ======================= LICHT ======================= */
  const le0 = Z.lightExtra;
  Z.lightExtra = function (hole) {
    if (le0) le0(hole);
    for (const tr of list) { const d = D[tr.k]; if (d && d.light && vis(tr.x, tr.y || tr.fy, 120)) d.light(tr, hole); }
    for (const s of shots) if (s.k !== "bolzen") hole(s.x, s.y, 18, 0.6, "#ff8a3a");
    for (const q of pools) if (q.hot && q.t < q.life * 0.6) hole(q.x, q.y - 2, 18, 0.4, "#ff8a3a");
  };

  /* ======================= ZEICHNEN ======================= */
  const dr0 = Z.drawParcours;
  Z.drawParcours = function (c, t) {
    if (dr0) dr0.apply(this, arguments);
    const low = lo();
    for (const q of pools) {
      if (!vis(q.x, q.y)) continue;
      if (q.k === "bolzen") { c.save(); c.globalAlpha = Math.min(1, (q.life - q.t) * 2); c.fillStyle = "#5a3e28"; c.fillRect(Math.min(q.x, q.x - q.dir * 14), q.y - 0.6, 14, 1.2); c.fillStyle = "#d8c8a0"; c.fillRect(q.x - q.dir * 14 - 1, q.y - 1.6, 2, 3.2); c.restore(); continue; }
      const a = Math.min(1, (q.life - q.t) * 1.5); c.save(); c.globalAlpha = a; ell(c, q.x, q.y - 0.6, q.w / 2, 1.6, q.col); if (q.hot) { c.fillStyle = "#ff8a3a"; c.globalAlpha = a * Math.max(0, 1 - q.t / (q.life * 0.6)); ell(c, q.x, q.y - 0.8, q.w / 3, 0.8, "#ff8a3a"); } c.restore();
    }
    for (const tr of list) { if (!D[tr.k]) continue; if (!vis(tr.x, tr.y || tr.fy || tr.ay, 140) && !(tr.ay && vis(tr.x, tr.ay, 140))) continue; try { D[tr.k].draw(c, tr, t, low); } catch (e) { console.error(tr.k, e); tr.k = "_x"; } }
    for (const s of shots) {
      if (!vis(s.x, s.y)) continue;
      if (s.k === "bolzen") { const d = Math.sign(s.vx); c.fillStyle = "#5a3e28"; c.fillRect(Math.min(s.x, s.x - d * 18), s.y - 0.7, 18, 1.4); c.fillStyle = "#c8c0c4"; c.beginPath(); c.moveTo(s.x, s.y - 1.8); c.lineTo(s.x + d * 4, s.y); c.lineTo(s.x, s.y + 1.8); c.fill(); c.fillStyle = "#d8c8a0"; c.fillRect(s.x - d * 18 - 1, s.y - 2, 3, 4); if (!low) { c.save(); c.globalAlpha = 0.25; c.fillStyle = "#f0e8e0"; c.fillRect(Math.min(s.x - d * 18, s.x - d * 50), s.y - 0.5, 32, 1); c.restore(); } }
      else { circ(c, s.x, s.y, 2.6, "#c83a10"); circ(c, s.x - 0.5, s.y - 0.5, 1.6, s.k === "schlacke" ? "#ffd27a" : "#ff8a2a"); glow(c, s.x, s.y, 6, "rgba(255,120,40,.6)"); }
    }
    for (const m of minis) {
      if (!vis(m.x, m.y)) continue;
      if (m.k === "spinnling") { ell(c, m.x, m.y - 1.5, 1.8, 1.4, "#2a1a24"); c.strokeStyle = "#1a1016"; c.lineWidth = 0.5; c.beginPath(); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { c.moveTo(m.x, m.y - 1.5); c.lineTo(m.x + s * 2.8, m.y - 0.3 - i * 0.8 + Math.sin(t * 40 + i) * 0.4); } c.stroke(); circ(c, m.x + 0.6, m.y - 2.2, 0.35, "#ff3a2a"); }
      else { circ(c, m.x, m.y, 1.4, "#f0ece4"); if (!low) { c.save(); c.globalAlpha = 0.3; c.fillStyle = "#f0ece4"; c.fillRect(m.x - 0.3, m.y - 6, 0.6, 5); c.restore(); } }
    }
    for (const w of waves) { if (!vis(w.x, w.y, 100)) continue; c.save(); c.globalAlpha = 0.5 * (1 - w.t / w.life); c.strokeStyle = "#ffe0a0"; c.lineWidth = 2; c.beginPath(); c.arc(w.x, w.y, w.r, 0, 6.283); c.stroke(); c.lineWidth = 0.8; c.beginPath(); c.arc(w.x, w.y, w.r * 0.8, 0, 6.283); c.stroke(); c.restore(); }
  };

  /* ======================= GLOSSAR ======================= */
  const INFO = {};
  for (const k in D) INFO[k] = { n: D[k].n, d: D[k].d, gebiet: D[k].g };
  Z.FALLEN_INFO = INFO;
  /* Klänge der Gebietsfallen vorladen, sobald ein Gebiet steht */
  const PRE = ["g_falle_", 3, "g_knarren_", 5, "n_windstoss_", 1, "e_windstoss_", 1, "n_blubb_", 3, "n_zischen_", 5, "e_holzpoltern_", 7, "n_ratte_", 6, "e_kette_", 4, "e_tuch_", 3, "g_ruestung_", 3, "e_brutzeln_", 2, "e_riegel_", 4, "e_tuerknarren_", 4, "n_kette_", 4, "n_knarren_", 22, "e_spinne_", 6, "g_schleim_", 10, "e_zischen_", 2, "e_blasebalg_", 2, "n_steinschlag_", 5, "e_schlange_", 4, "e_grollen_", 2, "n_kies_", 8];
  const sp0 = Z.setupFallen;
  Z.setupFallen = function () { const r = sp0.apply(this, arguments); try { if (A.ok && A.load) for (let i = 0; i < PRE.length; i += 2) for (let n = 1; n <= Math.min(PRE[i + 1], 4); n++) A.load("amb/" + PRE[i] + n + ".mp3"); } catch (_) {} return r; };
})();
