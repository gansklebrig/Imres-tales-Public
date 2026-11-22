/* Ezekiel – The Destroyer · Wetter und Lichtereignisse
   Jeder Besuch eines Gebiets hat seine eigene Stimmung:
   draußen klare Mondnacht, Nieselregen, Platzregen mit Pfützen und Spritzern, Gewitter mit Blitzen,
   die die Türme am Horizont aufleuchten lassen, rollende Nebelbänke, Sturmböen voller Laub;
   drinnen Erdstöße, bei denen Staub von der Decke rieselt, Glockenschläge, ein kalter Luftzug,
   der alle Kerzen flackern lässt, Leuchtalgenblüte im See, Sporenstürme im Schlund, Glutregen in der Schmiede.
   Dazu Licht: Mondlicht bricht in Strahlen durch die Wolken, Wetterleuchten in der Ferne. */
(function () {
  "use strict";
  const Z = window.Z, FX = Z.fx, A = Z.audio, L = v => Z.L(v), T = Z.TILE;
  const TAU = Math.PI * 2;
  const MOODS = {
    torhof: [["klar", 3], ["niesel", 2], ["regen", 2], ["gewitter", 1], ["nebel", 2], ["boeen", 1]],
    wehrgang: [["klar", 2], ["regen", 2], ["gewitter", 2], ["boeen", 3], ["nebel", 1]],
    hafen: [["niesel", 3], ["regen", 2], ["gewitter", 1], ["nebel", 3]],
    zinnen: [["klar", 2], ["boeen", 3], ["gewitter", 2], ["nebel", 1]],
    sturm: [["gewitter", 4], ["regen", 2], ["boeen", 2]],
    keller: [["still", 2], ["beben", 2], ["zug", 2]],
    hallen: [["still", 2], ["zug", 3], ["beben", 1]],
    verlies: [["still", 2], ["beben", 2], ["zug", 1]],
    glocken: [["glocke", 4], ["zug", 1], ["beben", 1]],
    schmiede: [["glutregen", 3], ["beben", 2], ["still", 1]],
    glut: [["glutregen", 3], ["beben", 1], ["still", 1]],
    see: [["algen", 3], ["still", 1], ["beben", 1]],
    schlund: [["sporen", 3], ["still", 1], ["beben", 1]]
  };
  const NAMES = {
    klar: ["Klare Mondnacht", "Clear moonlit night"], niesel: ["Nieselregen", "Drizzle"], regen: ["Platzregen", "Downpour"], gewitter: ["Ein Gewitter zieht auf", "A storm is coming"],
    nebel: ["Nebelbänke", "Fog banks"], boeen: ["Sturmböen", "Gusts"], still: null, beben: ["Die Mauern beben", "The walls tremble"], zug: ["Ein kalter Luftzug", "A cold draught"],
    glocke: ["Die Glocken schlagen", "The bells are tolling"], glutregen: ["Glutregen", "Ember rain"], algen: ["Leuchtalgenblüte", "Glowing bloom"], sporen: ["Sporensturm", "Spore storm"]
  };
  let W = null; /* aktuelles Wetter */
  const baseWeather = new Map();
  function setup(lv) {
    const B = Z.biome; W = null;
    if (!lv || !B || lv.hub) return;
    if (!baseWeather.has(B)) baseWeather.set(B, (B.weather || []).slice());
    B.weather = baseWeather.get(B).slice();
    const list = MOODS[lv.biome]; if (!list) return;
    let sum = 0; for (const [, w] of list) sum += w;
    let r = Math.random() * sum, mood = list[0][0];
    for (const [m, w] of list) { r -= w; if (r <= 0) { mood = m; break; } }
    W = { mood, t: 0, ev: 6 + Math.random() * 8, bolts: [], fogs: [], shafts: [], dim: 0, splash: 0 };
    const add = k => { if (!B.weather.includes(k)) B.weather.push(k); };
    if (mood === "niesel") add("drizzle");
    if (mood === "regen" || mood === "gewitter") add("rain");
    if (mood === "boeen") { add("wind"); add("leaves"); }
    if (mood === "nebel" || mood === "gewitter") for (let i = 0; i < 4; i++) W.fogs.push({ x: Math.random(), y: 0.55 + Math.random() * 0.4, s: 0.6 + Math.random() * 0.8, v: (Math.random() < 0.5 ? -1 : 1) * (0.004 + Math.random() * 0.01) });
    if (mood === "glutregen") add("embers");
    if (mood === "algen") add("fireflies");
    if (mood === "sporen") add("spores");
    const nm = NAMES[mood]; if (nm) setTimeout(() => { if (W && W.mood === mood) Z.toast && Z.toast("<small>" + L(nm) + "</small>", 1800); }, 1900);
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  /* ---------- Ereignisse ---------- */
  function lightning() {
    const cam = Z.cam;
    Z.flashLight = 0.95; FX.flashScreen("#e8e0ff", 0.18);
    A.play("thunder", { vol: 0.55, delay: 0.25 + Math.random() * 0.6 });
    const x = cam.x + cam.w * (0.1 + Math.random() * 0.8);
    const pts = [[x, cam.y - 10]]; let yy = cam.y - 10, xx = x;
    while (yy < cam.y + cam.h * (0.45 + Math.random() * 0.3)) { yy += 10 + Math.random() * 18; xx += (Math.random() - 0.5) * 26; pts.push([xx, yy]); }
    const branch = []; const bi = 2 + (Math.random() * (pts.length - 3) | 0); let bx = pts[bi][0], by = pts[bi][1]; branch.push([bx, by]); for (let k = 0; k < 4; k++) { bx += (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12); by += 10 + Math.random() * 10; branch.push([bx, by]); }
    W.bolts.push({ pts, branch, t: 0, life: 0.35, px: cam.x, py: cam.y });
  }
  function quake() {
    FX.addShake(5); A.play("quake", { vol: 0.5 }); Z.input.rumble && Z.input.rumble(0.3, 400);
    const cam = Z.cam, lv = Z.level;
    for (let i = 0; i < 40; i++) {
      const x = cam.x + Math.random() * cam.w, tx = Math.floor(x / T);
      for (let ty = Math.floor(cam.y / T); ty < Math.floor((cam.y + cam.h) / T); ty++) {
        const v = lv.get(tx, ty), below = lv.get(tx, ty + 1);
        if ((v === 1 || v === 7) && below === 0) { FX.p({ x, y: (ty + 1) * T, vx: (Math.random() - 0.5) * 10, vy: 20 + Math.random() * 40, g: 300, life: 1.4, size: 1 + Math.random() * 1.5, col: Z.dustCol || "#8a7a70", kind: Math.random() < 0.3 ? "shard" : "dot" }); break; }
      }
    }
    for (const e of Z.enemies) if (!e.dead && e.sleep && Math.random() < 0.3 && Z.leben) Z.leben.wake(e, false);
  }
  function bell() {
    A.play("gong", { vol: 0.45, rate: 0.6 + Math.random() * 0.2 }); A.play("bell", { vol: 0.35, delay: 0.1 });
    const P = Z.player; if (P) for (let k = 0; k < 3; k++) setTimeout(() => FX.ring(P.x + P.w / 2, P.y, 60 + k * 50, "rgba(255,220,150,.5)", 0.9, 1), k * 180);
    FX.addShake(1.5);
  }
  function draught() { A.play("roar", { vol: 0.12, rate: 0.5 }); W.dim = 2.2; Z.windX = 40; }

  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    if (!W || !Z.level) return;
    W.t += dt; W.ev -= dt;
    const m = W.mood;
    if (W.ev <= 0) {
      if (m === "gewitter") { W.ev = 4 + Math.random() * 8; lightning(); }
      else if (m === "regen" || m === "boeen") { W.ev = 14 + Math.random() * 14; if (Math.random() < 0.4) { Z.flashLight = 0.4; A.play("thunder", { vol: 0.2, delay: 0.8 }); } }
      else if (m === "klar") { W.ev = 12 + Math.random() * 12; W.shafts.push({ t: 0, life: 7, x: Math.random(), a: -0.35 - Math.random() * 0.3, n: 3 + (Math.random() * 3 | 0) }); }
      else if (m === "beben") { W.ev = 18 + Math.random() * 20; quake(); }
      else if (m === "glocke") { W.ev = 20 + Math.random() * 16; bell(); }
      else if (m === "zug") { W.ev = 16 + Math.random() * 14; draught(); }
      else if (m === "algen") { W.ev = 10; for (let i = 0; i < 30; i++) { const cam = Z.cam; FX.p({ x: cam.x + Math.random() * cam.w, y: cam.y + cam.h * (0.5 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 8, vy: -6 - Math.random() * 8, life: 6, size: 2, col: Math.random() < 0.5 ? "#8affc0" : "#c0ff8a", kind: "glow", add: true }); } }
      else W.ev = 20;
    }
    if (W.dim > 0) { W.dim -= dt; if (W.dim <= 0) Z.windX = 0; }
    for (const b of W.bolts) b.t += dt; W.bolts = W.bolts.filter(b => b.t < b.life);
    for (const s of W.shafts) s.t += dt; W.shafts = W.shafts.filter(s => s.t < s.life);
    for (const f of W.fogs) f.x = (f.x + f.v * dt + 1.5) % 1.5 - 0.25;
    /* Regen: Spritzer auf Böden unter freiem Himmel */
    if ((m === "regen" || m === "gewitter" || m === "niesel") && Z.gfx.sky && (!Z.gq || Z.gq.level >= 1)) {
      const lv = Z.level, cam = Z.cam, n = (m === "niesel" ? 10 : 40) * dt;
      W.splash += n;
      while (W.splash > 1) {
        W.splash--;
        const x = cam.x + Math.random() * cam.w, tx = Math.floor(x / T);
        for (let ty = Math.max(0, Math.floor(cam.y / T)); ty < Math.floor((cam.y + cam.h) / T) + 1; ty++) {
          const v = lv.get(tx, ty + 1);
          if (lv.get(tx, ty) === 0 && (v === 1 || v === 2 || v === 7) && Z.gfx.sky[ty * lv.W + tx]) {
            const gy = (ty + 1) * T;
            for (let k = 0; k < 3; k++) FX.p({ x, y: gy - 1, vx: (Math.random() - 0.5) * 50, vy: -40 - Math.random() * 50, g: 500, life: 0.3, size: 0.9, col: "rgba(200,210,220,.7)", kind: "dot" });
            break;
          }
        }
      }
    }
  };

  /* ---------- Zeichnen ---------- */
  /* Blitze in der Ferne, vor der Bilderbuch-Kulisse */
  const life0 = Z.drawBackLife;
  Z.drawBackLife = function (c, cam, t, B, oy, LH) {
    if (life0) life0.apply(this, arguments);
    if (!W) return;
    for (const b of W.bolts) {
      const u = b.t / b.life, a = u < 0.15 ? 1 : (1 - u) * (Math.sin(b.t * 60) > 0 ? 1 : 0.5);
      c.save(); c.translate(cam.x - b.px, cam.y - b.py); c.globalCompositeOperation = "lighter"; c.lineJoin = "round";
      for (const [lw, al, col] of [[7, 0.18, "#c8b0ff"], [3, 0.6, "#e8e0ff"], [1.2, 1, "#ffffff"]]) {
        c.globalAlpha = a * al; c.strokeStyle = col; c.lineWidth = lw;
        for (const pts of [b.pts, b.branch]) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
      }
      /* der ganze Himmel leuchtet kurz auf */
      c.globalAlpha = a * 0.22; c.fillStyle = "#d8d0ff"; c.fillRect(b.px, b.py, cam.w, cam.h);
      c.restore();
    }
    if (W.mood === "gewitter" && Math.random() < 0.004) { W.bolts.push({ pts: [[cam.x + Math.random() * cam.w, cam.y + cam.h * 0.3], [cam.x + Math.random() * cam.w, cam.y + cam.h * 0.33]], branch: [], t: 0, life: 0.2, px: cam.x, py: cam.y }); }
  };
  /* Nebelbänke, Mondlichtstrahlen, gedimmtes Licht */
  const al0 = Z.drawAfterLight;
  Z.drawAfterLight = function (c, cam, W2, H2, t) {
    if (al0) al0.apply(this, arguments);
    if (!W) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    for (const f of W.fogs) {
      const x = f.x * W2 * 1.4 - W2 * 0.2, y = f.y * H2, w = W2 * 0.7 * f.s, h = H2 * 0.22 * f.s;
      const g = c.createRadialGradient(x, y, 0, x, y, w * 0.5); g.addColorStop(0, "rgba(170,160,180,.22)"); g.addColorStop(1, "rgba(170,160,180,0)");
      c.save(); c.translate(x, y); c.scale(1, h / w); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, w * 0.5, 0, TAU); c.fill(); c.restore();
    }
    for (const s of W.shafts) {
      const u = s.t / s.life, a = Math.sin(u * Math.PI) * 0.16;
      c.globalCompositeOperation = "lighter";
      for (let k = 0; k < s.n; k++) {
        const x0 = (s.x + k * 0.09) * W2, w = 30 + k * 14;
        const g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, "rgba(220,215,240," + a + ")"); g.addColorStop(1, "rgba(220,215,240,0)");
        c.fillStyle = g; c.beginPath(); c.moveTo(x0, -10); c.lineTo(x0 + w, -10); c.lineTo(x0 + w + H2 * Math.tan(-s.a), H2); c.lineTo(x0 + H2 * Math.tan(-s.a) - w * 0.5, H2); c.closePath(); c.fill();
      }
      c.globalCompositeOperation = "source-over";
    }
    if (W.dim > 0) { const a = Math.min(1, W.dim / 0.6) * 0.3 * (0.6 + 0.4 * Math.sin(t * 23)); c.fillStyle = "rgba(4,2,8," + a + ")"; c.fillRect(0, 0, W2, H2); }
    if (W.mood === "regen" || W.mood === "gewitter") { c.fillStyle = "rgba(40,40,60,.08)"; c.fillRect(0, 0, W2, H2); }
    c.restore();
  };
  Z.wetter = () => W;
  Z.wetterForce = m => { if (!W) return; W.mood = m; W.ev = 0.1; };
})();
