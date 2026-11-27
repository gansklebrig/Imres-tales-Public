/* W37 Randblick – Randwarnung für Angriffe von außerhalb des Bildes.
   Setzt ein Gegner außerhalb des sichtbaren Ausschnitts zu einem Fernangriff an (Vorwarnphase „pre“) oder fliegt ein
   feindliches Geschoss von außen auf das Bild zu, erscheint am Bildrand in Richtung des Angreifers ein kleiner warmer Pfeil
   (Bernstein = Ausholen, Glutrot = Geschoss im Anflug). Gemeinsame Kamera → gilt auch im lokalen Koop.
   Stufe 0: nur die einfache Pfeilform (kein Schein, keine Partikel). Abschaltbar: Z.gfx.off.randwarn = true.
   Einhängen über Z.drawAfterLight (nach Licht, vor Übergängen/Zoom), Zeichnung in Bildschirmkoordinaten. Kein Blau. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || !Z.gfx || Z.randblick) return;
  const RANGED = { shoot: 1, lob: 1, volley: 1, web: 1, beam: 1, pull: 1, spray: 1, thread: 1 };
  const marks = new Map(); /* Quelle (Gegner/Geschoss) → { x, y, a, on, k } */
  let lastN = 0;
  const off = () => !!(Z.gfx.off && Z.gfx.off.randwarn);
  /* Geschoss fliegt auf den Ausschnitt zu? (Abstand zum Rechteck nimmt ab) */
  function dRect(x, y, cm) {
    const dx = x < cm.x ? cm.x - x : x > cm.x + cm.w ? x - cm.x - cm.w : 0;
    const dy = y < cm.y ? cm.y - y : y > cm.y + cm.h ? y - cm.y - cm.h : 0;
    return Math.hypot(dx, dy);
  }
  function collect(cm) {
    const M = 4; /* Quelle gilt als „außen“, wenn ihr Mittelpunkt außerhalb des um 4 Einheiten verkleinerten Bildes liegt */
    const inView = (x, y) => x > cm.x + M && x < cm.x + cm.w - M && y > cm.y + M && y < cm.y + cm.h - M;
    for (const e of Z.enemies) {
      const ac = e.act;
      if (e.dead || !ac || ac.phase !== "pre" || !ac.a || !RANGED[ac.a.k] || e.hidden > 0 || e.disguise || e.dummy) continue;
      const x = e.x + e.w / 2, y = e.y + e.h * 0.4;
      if (inView(x, y) || dRect(x, y, cm) > 420) continue;
      put(e, x, y, 0);
    }
    for (const p of Z.projs) {
      if (p.owner !== "e" || p.dead) continue;
      if (inView(p.x, p.y)) { const m = marks.get(p); if (m) m.on = false; continue; }
      const d = dRect(p.x, p.y, cm); if (d > 300) continue;
      const d2 = dRect(p.x + p.vx * 0.05, p.y + p.vy * 0.05, cm);
      if (d2 >= d && !(p.k && p.k.homing)) continue;
      put(p, p.x, p.y, 1);
    }
  }
  function put(src, x, y, k) {
    let m = marks.get(src);
    if (!m) { m = { x, y, a: 0, on: true, k, seen: 0 }; marks.set(src, m); }
    m.x = x; m.y = y; m.on = true; m.k = k; m.seen = lastN;
  }
  function draw(c, cm, W, H, dt) {
    const S = Z.gfx.scale || 1, css = W / Math.max(1, window.innerWidth || W); /* Gerätepixel je CSS-Pixel */
    const lean = !Z.gq || !Z.gq.level; /* Stufe 0 (oder unbekannt): nur Form */
    const pad = 18 * css, sz = 9 * css;
    const cx = W / 2, cy = H / 2;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over";
    const t = performance.now() / 1000;
    for (const [src, m] of marks) {
      if (m.seen !== lastN) m.on = false;
      m.a += (m.on ? 1 : -1) * dt * (m.on ? 9 : 3.5);
      if (m.a <= 0) { marks.delete(src); continue; }
      if (m.a > 1) m.a = 1;
      /* Bildschirmlage der Quelle, Strahl von der Bildmitte bis zum (eingerückten) Rand */
      const sx = (m.x - cm.x) * S, sy = (m.y - cm.y) * S;
      const vx = sx - cx, vy = sy - cy; if (!vx && !vy) continue;
      const hx = cx - pad, hy = cy - pad;
      const f = Math.min(hx / Math.max(1e-3, Math.abs(vx)), hy / Math.max(1e-3, Math.abs(vy)));
      const ex = cx + vx * f, ey = cy + vy * f, ang = Math.atan2(vy, vx);
      const pulse = m.k || (Z.settings && Z.settings.blitze === "aus") ? 1 : 0.75 + 0.25 * Math.sin(t * 14); /* Blitze aus: kein Flackern */
      const al = m.a * pulse;
      const col = m.k ? "255,110,50" : "255,190,90"; /* Geschoss: Glutrot · Ausholen: Bernstein */
      if (!lean) { /* Schein (nur Stufe ≥ 1): ein weicher Kreis */
        const g = c.createRadialGradient(ex, ey, 0, ex, ey, sz * 2.4);
        g.addColorStop(0, "rgba(" + col + "," + (0.45 * al).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + col + ",0)");
        c.fillStyle = g; c.fillRect(ex - sz * 2.4, ey - sz * 2.4, sz * 4.8, sz * 4.8);
      }
      c.translate(ex, ey); c.rotate(ang);
      c.globalAlpha = al;
      c.beginPath(); c.moveTo(sz, 0); c.lineTo(-sz * 0.7, -sz * 0.8); c.lineTo(-sz * 0.3, 0); c.lineTo(-sz * 0.7, sz * 0.8); c.closePath();
      c.fillStyle = "rgb(" + col + ")"; c.fill();
      c.lineWidth = Math.max(1, css * 1.2); c.strokeStyle = "rgba(50,16,6,.9)"; c.stroke(); /* dunkler Rand: lesbar auf hellem Grund */
      c.setTransform(1, 0, 0, 1, 0, 0);
    }
    c.restore();
  }
  let lastT = 0;
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W, H, t) {
    if (al0) al0.apply(this, arguments);
    if (off()) { if (marks.size) marks.clear(); return; }
    try {
      const n = performance.now(), dt = Math.min(0.05, Math.max(0, (n - (lastT || n)) / 1000)); lastT = n;
      if (!Z.level || !Z.player || !Z.enemies || !Z.projs) return;
      if (!Z.paused) { lastN++; collect(Z.cam); } /* Pause: Pfeile bleiben stehen */
      if (marks.size) draw(c, Z.cam, W, H, Z.paused ? 0 : dt);
    } catch (e) { marks.clear(); if (Z.diag && Z.diag.caught) Z.diag.caught("randblick", e); }
  };
  /* ---------- W37 Randblick Teil 2: Bossarena hochkant ----------
     Hochkant (Handy) ist der Ausschnitt nur ~320 breit; die Arenen sind 30–56 Kacheln breit und 20 hoch – sie passen in der
     Höhe ganz hinein (dunkle Ränder oben/unten sind also Platz, kein verdeckter Inhalt), aber der Boss stand oft halb oder ganz
     außerhalb (Themberchaud 230 Einheiten neben Ezekiel). Statt Blick voraus in Laufrichtung schaut die Kamera hier zur Mitte
     zwischen Ezekiel und Boss, höchstens so weit, dass Ezekiel 44 Einheiten vom Rand bleibt. Kein Zoom (Figuren bleiben groß).
     Nur Einzelspieler, Arena ohne eigene Kamerabindung (cam.lock, z. B. Demogorgon), lebender Boss, Ausschnitt höher als breit. Abschaltbar: Z.gfx.off.arenahoch. Weicher Versatz wie
     das Kamera-Atmen (wird vor jedem Kamerarechnen wieder abgezogen → kein Gegeneinander mit der Grundkamera). */
  const cam = Z.cam, cuA = cam && cam.update;
  if (cuA) {
    let bo = 0, bs = 0;
    cam.update = function (dt, p) {
      cam.x -= bo; bo = 0;
      const r = cuA.apply(this, arguments);
      try {
        const lv = Z.level, B = Z.boss;
        let want = 0;
        if (p && p === Z.player && lv && lv.arena && !cam.lock && B && !B.dead && !Z.bossDefeated && cam.h > cam.w * 1.15 && !(Z.koop && Z.koop.p2) && !(Z.gfx.off && Z.gfx.off.arenahoch) && !p.dead) {
          const px = p.x + p.w / 2, bx = B.x + B.w / 2, lim = Math.max(0, cam.w / 2 - 44);
          const want0 = px + Math.max(-lim, Math.min(lim, (bx - px) / 2));
          want = want0 - (cam.x + cam.w / 2);
        }
        bs += (want - bs) * (1 - Math.pow(0.05, Math.min(0.1, dt || 0)));
        if (Math.abs(bs) > 0.3) { const x0 = cam.x; cam.x += bs; if (cam.clamp) cam.clamp(); bo = cam.x - x0; }
        else bs = want ? bs : 0;
      } catch (e) { bo = 0; bs = 0; }
      return r;
    };
  }
  Z.randblick = { marks, n: () => marks.size };
  if (Z.ui && Z.ui.onArea) { const oa = Z.ui.onArea; Z.ui.onArea = function () { marks.clear(); return oa.apply(this, arguments); }; }
})();
