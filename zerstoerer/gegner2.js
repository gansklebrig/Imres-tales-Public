/* Ezekiel – The Destroyer · W38 Gegner: neue Elite-Eigenschaften mit eigenem Verhalten (gegner2.js)
   Bestand: 13 Gebiete mit je 7–10 Gegnerarten (welt.js B.foes), Eliten mit 8 Eigenschaften (gegner.js ELITE: Flink, Rufer,
   Gepanzert, Wütend, Schattenhaft; gegnerkunst.js: Giftig, Eisig, Explosiv), Trupps, Nemesis, Mini-Bosse, Gebietsvarianten,
   Gebietslagen (abwechslung.js). In späten Gebieten wirkten die Eliten trotzdem gleich: fast alle bisherigen Eigenschaften
   ändern Werte (Tempo, Panzer, Wut) oder hängen einen Effekt an Treffer – keine zwingt zu einer anderen Spielweise.
   Neu (hinten an Z.ELITE, fließen damit automatisch in die Elite-Auswahl aller Gegner ein):
   · Spiegelnd   – hebt alle 4–5 s für 1,3 s einen Facettenspiegel (0,5 s vorher Glitzern + Klang). Fernkampftreffer in der
                   Zeit werden als Splitter auf den Schützen zurückgeworfen. Gegenmittel: warten oder Nahkampf.
   · Schildwall  – trägt einen Turmschild nach vorn: Fernkampf und Fähigkeiten von vorn richten nur 35 % Schaden an
                   („Geblockt!“), außer während er selbst angreift. Gegenmittel: von hinten/oben, rollen, im Angriff treffen.
   · Bannwirker  – zeichnet alle ~6 s einen Bannkreis unter den Spieler: 1,0 s Runenring (Vorwarnung), dann Schaden und
                   kurz verlangsamt. Gegenmittel: aus dem Kreis laufen/rollen.
   · Sprunghaft  – setzt aus bis zu 15 Kacheln Entfernung zum Sprung an (0,5 s ducken + Landemarke am Boden), springt in
                   einem Bogen und schlägt bei der Landung auf. Nur Bodengegner. Gegenmittel: Landemarke verlassen.
   Beim ersten Zusammentreffen je Eigenschaft (je Spielstand) ein kurzer Hinweis mit Gegenmittel; im Fundbuch (Gegner-Reiter)
   eine Liste „Elite-Eigenschaften“ mit allen Eigenschaften und den neuen Gegenmitteln.
   Verhalten nur beim Gastgeber/Einzelspieler; der Online-Gast sieht die Zustände über die Gegner-Felder (e.w38m, e.w38lp).
   Grafik: Stufe 0 schlichte Formen ohne Schein. Kein Blau. Prüfhilfe Z.gegner2.spawn(id, eigenschaft). */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.gegner2 || !Z.ELITE) return;
  const T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v), TAU = Math.PI * 2, U = Z.U;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const lo = () => !!(Z.gq && (Z.gq.level === 0 || Z.gq.lean));
  const gast = () => { const s = Z.online && Z.online.S; return !!(s && s.role === "guest" && s.playing); };
  const safe = (fn, tag) => function () { try { return fn.apply(this, arguments); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W38 Gegner", tag, e); } } };
  const errN = {};

  const NEU = {
    spiegelnd: { n: ["Spiegelnd", "Mirrored"], tip: ["Spiegelnder Gegner: Während der Facettenspiegel steht, fliegen Fernkampftreffer zurück – warten oder zuschlagen.", "Mirrored foe: while the faceted mirror is up, ranged hits fly back – wait or strike in melee."] },
    schildwall: { n: ["Schildwall", "Shieldwall"], tip: ["Schildwall: Von vorn halten Pfeile und Fähigkeiten wenig aus – außer wenn er selbst zuschlägt. Von hinten oder oben angreifen.", "Shieldwall: from the front, arrows and skills barely scratch it – unless it is attacking. Strike from behind or above."] },
    bannwirker: { n: ["Bannwirker", "Warding"], tip: ["Bannwirker: Ein Runenring unter dir bedeutet einen Bann in einer Sekunde – raus aus dem Kreis!", "Warding foe: a rune ring beneath you means a ward in one second – get out of the circle!"] },
    sprunghaft: { n: ["Sprunghaft", "Bounding"], tip: ["Sprunghaft: Duckt er sich, markiert er den Landeplatz – verlass die Marke.", "Bounding foe: when it crouches, it marks its landing spot – leave the mark."] }
  };
  for (const k in NEU) if (!Z.ELITE[k]) Z.ELITE[k] = NEU[k].n;
  const MEINE = new Set(Object.keys(NEU));
  /* Sprunghaft nur für Bodengegner: Flieger/Geschütze/Decke bekommen ersatzweise eine andere neue Eigenschaft */
  const sp0 = Z.spawnEnemy;
  Z.spawnEnemy = function (id, x, y, o) {
    const e = sp0.apply(this, arguments);
    try {
      if (e && e.elite === "sprunghaft" && e.def && (e.def.fly || e.def.ai === "turret" || e.def.ai === "ceiling" || e.def.boss || e.def.disguise)) e.elite = "spiegelnd";
      if (e && MEINE.has(e.elite)) { e.w38cd = 1.5 + Z.R() * 2; e.w38m = 0; }
    } catch (err) { console.error("W38 Gegner", err); }
    return e;
  };

  /* ---------- Treffer: Spiegel und Schildwall ---------- */
  const h0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    try {
      o = o || {};
      if (e && !e.dead && typeof dmg === "number" && dmg > 0 && !gast() && (o.src === "ranged" || o.src === "skill") && !o.dot) {
        if (e.elite === "spiegelnd" && e.w38m === 2 && o.src === "ranged") {
          const cx = e.x + e.w / 2, cy = e.y + e.h * 0.45, p2 = Z.koop && Z.koop.p2; let P = Z.player; /* Koop: auf den näheren Helden zurückwerfen */
          if (p2 && !p2.dead && !p2.down && p2.x != null && (!P || P.dead || Math.abs(p2.x - cx) < Math.abs(P.x - cx))) P = p2;
          if (P && !P.dead && Z.aimProj) Z.aimProj("e_dolch", cx, cy, P.x + P.w / 2, P.y + P.h * 0.4, { dmg: Math.min(dmg * 0.35, e.dmgMul * 0.8), speed: 300 });
          FX.ring && FX.ring(cx, cy, 16, "#fff0c8", 0.25, 2); A.play("glass", { x: cx, vol: 0.5, rate: 1.4 });
          if (!lo()) FX.burst(cx, cy, 8, { col: ["#fff0c8", "#e5b454"], sp: 120, life: 0.35, size: 1.6, kind: "spark", add: true });
          FX.text(cx, e.y - 8, L(["Gespiegelt!", "Reflected!"]), "#ffe9a8");
          return 0;
        }
        if (e.elite === "schildwall") {
          const from = o.dir ? -o.dir : (Z.player ? U.sign(Z.player.x - e.x) || 1 : 1); /* Seite, von der der Treffer kommt */
          if (from === e.face && !e.act) { /* beim eigenen Angriff ist die Deckung offen */
            dmg *= 0.35; e.w38blk = 0.25; /* Bot (W38 Gegner): 20 % → Bogen 27 s statt 6 s; 35 % → s. STAND */
            const cx = e.x + e.w / 2 + e.face * (e.w / 2 + 2);
            A.play("block", { x: cx, vol: 0.45 }); if (!lo()) FX.burst(cx, e.y + e.h * 0.5, 6, { col: ["#ffd27a", "#c8a060"], sp: 100, life: 0.25, size: 1.4, kind: "spark", add: true });
            if (!e._w38blkTxt || (Z.gfx && Z.gfx.time - e._w38blkTxt > 1.2)) { e._w38blkTxt = Z.gfx ? Z.gfx.time : 0; FX.text(cx, e.y - 8, L(["Geblockt!", "Blocked!"]), "#e8d8b8"); }
          }
        }
      }
    } catch (err) { console.error("W38 Gegner", err); }
    return h0.call(this, e, dmg, o);
  };

  /* ---------- Verhalten je Bild (nur Gastgeber) ---------- */
  const LEAPS = [];
  function zone(e, x, y, w, h, warn, m, o) {
    return Z.spawnHazard(Object.assign({ kind: "zone", x, y, w, hgt: h, warn, active: 0.2, life: 0.3, dmg: e.dmgMul * m, owner: "e", col: "#ffb040", warnCol: "#c0302a" }, o || {}));
  }
  function standY(P) { return P.y + P.h; }
  const seenTip = new Set();
  function tick(dt) {
    if (!Z.level || Z.level.hub || gast()) return;
    const P = Z.player; if (!P || P.dead) return;
    for (const e of Z.enemies) {
      if (e.dead || !MEINE.has(e.elite) || e.intro > 0) continue;
      const near = Math.abs(e.x - P.x) < 420 && Math.abs(e.y - P.y) < 260;
      if (near && e.aware) tipp(e.elite);
      e.w38cd = (e.w38cd || 0) - dt;
      if (e.elite === "spiegelnd") {
        if (e.w38m === 1) { e.w38mt -= dt; if (e.w38mt <= 0) { e.w38m = 2; e.w38mt = 1.3; A.play("glass", { x: e.x, vol: 0.35, rate: 0.9 }); } }
        else if (e.w38m === 2) { e.w38mt -= dt; if (e.w38mt <= 0) { e.w38m = 0; e.w38cd = 3 + Z.R() * 1.5; } }
        else if (e.aware && near && e.w38cd <= 0) { e.w38m = 1; e.w38mt = 0.5; A.play("magic", { x: e.x, vol: 0.3, rate: 1.6 }); }
      } else if (e.elite === "bannwirker") {
        if (e.aware && near && e.w38cd <= 0 && Math.abs(e.x - P.x) < 240 && P.onGround !== false) {
          e.w38cd = 5.5 + Z.R() * 1.5; e.w38m = 1; e.w38mt = 1.0;
          const x = P.x + P.w / 2, y = standY(P);
          zone(e, x, y, 64, 34, 1.0, 0.55, { col: "rgba(200,90,220,.8)", warnCol: "#b050c0", eff: { slow: 1 }, w38bann: 1 });
          A.play("rune", { x, vol: 0.45 }); FX.text(e.x + e.w / 2, e.y - 10, L(["Bann!", "Ward!"]), "#d8a0ff");
        }
        if (e.w38m === 1) { e.w38mt -= dt; if (e.w38mt <= 0) e.w38m = 0; }
      } else if (e.elite === "sprunghaft") {
        if (e.w38lp > 0) {
          e.w38lp -= dt; e.vx = 0;
          if (e.w38lp <= 0) { const L1 = e._w38leap; if (L1) { L1.t = 0; LEAPS.push(L1); A.play("jump", { x: e.x, vol: 0.4, rate: 0.8 }); } e._w38leap = null; }
        } else if (!e.w38air && e.aware && near && e.w38cd <= 0 && e.onGround && (!e.act || Z.R() < 0.02)) {
          const dx = P.x + P.w / 2 - (e.x + e.w / 2), ady = Math.abs((P.y + P.h) - (e.y + e.h));
          if (Math.abs(dx) > 50 && Math.abs(dx) < 15 * T && ady < 4 * T) {
            const tx = P.x + P.w / 2, ty = standY(P);
            const hg = pathClear(e, tx, ty);
            if (!hg) e.w38cd = 0.6; /* nicht jedes Bild neu prüfen */
            else {
              e.w38cd = 3.2 + Z.R() * 1.2; e.w38lp = 0.5; e.face = dx > 0 ? 1 : -1;
              e._w38leap = { e, x0: e.x, y0: e.y, x1: tx - e.w / 2, y1: ty - e.h, dur: 0.75 + Math.min(0.35, Math.abs(dx) / 900), hgt: hg };
              zone(e, tx, ty, 46, 22, 0.5 + e._w38leap.dur, 0.75, { col: "rgba(255,160,60,.85)", warnCol: "#c0302a" });
              A.play("claw", { x: e.x, vol: 0.3, rate: 0.7 });
            }
          }
        }
      }
    }
    /* Sprünge kinematisch führen (Bahn vorher geprüft) */
    for (let i = LEAPS.length - 1; i >= 0; i--) {
      const s = LEAPS[i], e = s.e; s.t += dt;
      if (e.dead || Z.enemies.indexOf(e) < 0) { LEAPS.splice(i, 1); continue; }
      const u = Math.min(1, s.t / s.dur);
      e.x = s.x0 + (s.x1 - s.x0) * u; e.y = s.y0 + (s.y1 - s.y0) * u - Math.sin(u * Math.PI) * s.hgt; e.vx = 0; e.vy = 0; e.w38air = true;
      if (u >= 1) { LEAPS.splice(i, 1); e.w38air = false; e.onGround = true; FX.addShake && FX.addShake(2); A.play("land", { x: e.x, vol: 0.5, rate: 0.7 }); if (!lo()) FX.burst(e.x + e.w / 2, e.y + e.h, 12, { col: ["#8a7a6a", "#5a4a40"], sp: 90, life: 0.5, size: 2.2, kind: "smoke" }); }
    }
  }
  /* Bahn prüfen: gibt die Bogenhöhe zurück (hoch, sonst flach) oder 0, wenn Wand/Decke im Weg oder kein Boden an der Landestelle */
  function pathClear(e, tx, ty) {
    const W = Z.world; if (!W || !W.solidAt) return 46;
    if (W.solidAt(tx, ty - 4) || !W.solidAt(tx, ty + 4)) return 0;
    const x0 = e.x + e.w / 2, y0 = e.y + e.h / 2;
    for (const hgt of [46 + Math.abs(tx - x0) * 0.12, 24]) {
      let ok = true;
      for (let k = 1; k <= 8 && ok; k++) { const u = k / 9, x = x0 + (tx - x0) * u, y = y0 + (ty - e.h / 2 - y0) * u - Math.sin(u * Math.PI) * hgt; if (W.solidAt(x, y) || (k > 1 && k < 8 && W.solidAt(x, y - e.h * 0.35))) ok = false; }
      if (ok) return hgt;
    }
    return 0;
  }
  function tipp(k) {
    const m = Z.meta; if (!m || seenTip.has(k)) return; seenTip.add(k);
    const s = m.w38elite = (m.w38elite && typeof m.w38elite === "object") ? m.w38elite : {};
    if (s[k]) return; s[k] = 1; try { Z.saveMeta(); } catch (_) {}
    if (Z.ui && Z.ui.notify) Z.ui.notify("<b>" + esc(L(["Neue Elite: ", "New elite: "]) + L(NEU[k].n)) + "</b><br><small>" + esc(L(NEU[k].tip)) + "</small>", { prio: 2, art: "gefahr", key: "w38elite" + k, dauer: 6500 });
  }
  const tk0 = Z.ebenenTick;
  const tickS = safe(tick, "tick");
  Z.ebenenTick = function (dt) { if (tk0) tk0.apply(this, arguments); tickS(Math.min(0.05, dt || 0)); };
  const la0 = Z.loadArea;
  Z.loadArea = function () { LEAPS.length = 0; return la0.apply(this, arguments); };

  /* ---------- Zeichnen (nach dem Licht, damit lesbar; auch beim Online-Gast) ---------- */
  const al0 = Z.drawAfterLight;
  const drawS = safe(draw, "draw");
  Z.drawAfterLight = function (c, cam, Wd, Hd, t) { if (al0) al0.apply(this, arguments); drawS(c, cam, t); };
  function draw(c, cam, t) {
    if (!cam || !Z.level || Z.level.hub) return;
    let any = false; for (const e of Z.enemies) if (!e.dead && MEINE.has(e.elite)) { any = true; break; }
    if (!any) for (const h of Z.hazards || []) if (h.w38bann) { any = true; break; }
    if (!any) return;
    const S = (Z.gfx && Z.gfx.scale) || 2, L0 = lo();
    c.save(); c.setTransform(S, 0, 0, S, -cam.x * S, -cam.y * S);
    /* Bannkreis-Vorwarnung: Runenring, der sich bis zum Auslösen schließt */
    for (const h of Z.hazards || []) {
      if (!h.w38bann || !(h.warn && h.t < h.warn)) continue;
      const k = U.clamp(h.t / h.warn, 0, 1), rx = h.w / 2, y = h.y - 1;
      c.strokeStyle = "rgba(216,160,255," + (0.5 + 0.4 * k).toFixed(3) + ")"; c.lineWidth = 1.2;
      c.beginPath(); c.ellipse(h.x, y, rx, 4, 0, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
      const n = 6; c.fillStyle = "#ffd27a";
      for (let i = 0; i < n * k; i++) { const a = -Math.PI / 2 + i * TAU / n + (L0 ? 0 : t * 0.8); c.fillRect(h.x + Math.cos(a) * rx - 1, y + Math.sin(a) * 4 - 2.5, 2, 3); }
    }
    for (const e of Z.enemies) {
      if (e.dead || !MEINE.has(e.elite) || e.hidden > 0.5) continue;
      if (e.x < cam.x - 40 || e.x > cam.x + cam.w + 40 || e.y < cam.y - 60 || e.y > cam.y + cam.h + 40) continue;
      const cx = e.x + e.w / 2, cy = e.y + e.h * 0.5, R = Math.max(e.w, e.h) * 0.62 + 4;
      if (e.elite === "spiegelnd") {
        if (e.w38m === 1) { /* Glitzern als Vorwarnung */
          c.fillStyle = "#fff0c8"; for (let i = 0; i < 4; i++) { const a = t * 6 + i * TAU / 4; const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.8; c.fillRect(x - 0.6, y - 2, 1.2, 4); c.fillRect(x - 2, y - 0.6, 4, 1.2); }
        } else if (e.w38m === 2) { /* Facettenspiegel */
          c.strokeStyle = "rgba(255,236,190,.85)"; c.lineWidth = 1.2; c.beginPath();
          for (let i = 0; i <= 6; i++) { const a = t * 1.5 + i * TAU / 6, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.9; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
          if (!L0) { c.globalCompositeOperation = "lighter"; c.fillStyle = "rgba(255,220,150,.10)"; c.fill(); c.globalCompositeOperation = "source-over"; }
        } else { /* Ruhe: kleine Facette über dem Kopf */
          c.fillStyle = "#d8c8a8"; c.beginPath(); c.moveTo(cx, e.y - 9); c.lineTo(cx + 3, e.y - 6); c.lineTo(cx, e.y - 3); c.lineTo(cx - 3, e.y - 6); c.closePath(); c.fill();
        }
      } else if (e.elite === "schildwall") {
        const fx = cx + e.face * (e.w / 2 + 2.5), top = e.y + e.h * 0.12, hh = e.h * 0.72, bl = e.w38blk > 0 ? 1 : 0;
        if (e.w38blk > 0) e.w38blk -= 1 / 60;
        c.fillStyle = "#3a2a1c"; c.fillRect(fx - 2.8, top - 0.6, 5.6, hh + 1.2);
        c.fillStyle = bl ? "#e5b454" : "#8a6a3a"; c.fillRect(fx - 2.2, top, 4.4, hh);
        c.fillStyle = "#c8902a"; c.fillRect(fx - 2.2, top + hh * 0.45, 4.4, 1.2); c.fillRect(fx - 0.6, top + 1, 1.2, hh - 2);
      } else if (e.elite === "bannwirker") {
        const k = e.w38m === 1 ? 1 : 0.5;
        c.strokeStyle = "rgba(200,110,220," + (0.45 * k + (L0 ? 0.2 : 0)).toFixed(3) + ")"; c.lineWidth = 1;
        c.beginPath(); c.ellipse(cx, e.y + e.h, e.w * 0.9 + 4, 2.4, 0, 0, TAU); c.stroke();
        for (let i = 0; i < 3; i++) { const a = (L0 ? 0 : t * 2) + i * TAU / 3; c.fillStyle = "#d8a0ff"; c.fillRect(cx + Math.cos(a) * (e.w * 0.9 + 4) - 0.8, e.y + e.h + Math.sin(a) * 2.4 - 0.8, 1.6, 1.6); }
      } else if (e.elite === "sprunghaft") {
        if (e.w38lp > 0) { c.fillStyle = "#ffb040"; c.font = "700 9px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillText("⤴", cx, e.y - 6 - (L0 ? 0 : Math.sin(t * 20) * 1)); }
        else { c.strokeStyle = "#c8902a"; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 3, e.y - 4); c.lineTo(cx, e.y - 7); c.lineTo(cx + 3, e.y - 4); c.stroke(); }
      }
    }
    c.restore();
  }

  /* ---------- Fundbuch: Liste der Elite-Eigenschaften im Gegner-Reiter ---------- */
  const ALT = {
    schnell: ["Bewegt sich und schlägt schneller.", "Moves and strikes faster."], beschwoerer: ["Ruft beim Tod Verstärkung.", "Calls reinforcements on death."],
    gepanzert: ["Panzer wächst mit jedem Treffer.", "Armour grows with each hit."], wuetend: ["Wird bei wenig Leben rasend.", "Enrages at low health."],
    teleport: ["Springt durch Schatten.", "Leaps through shadows."], giftig: ["Hinterlässt Giftpfützen, Treffer vergiften.", "Leaves poison pools, hits poison."],
    eisig: ["Treffer verlangsamen.", "Hits slow you."], explosiv: ["Explodiert kurz nach dem Tod.", "Explodes shortly after death."]
  };
  function wireCodex() {
    const ui = Z.ui; if (!ui || !ui.codex) return setTimeout(wireCodex, 80);
    if (ui.codex._w38g) return;
    const c0 = ui.codex;
    ui.codex = function (tab) {
      const r = c0.apply(this, arguments);
      try {
        const cur = document.querySelector('#modal .reiter [data-act="codexTab"].an');
        if (cur && cur.dataset.arg === "2") {
          const list = document.querySelector("#modal .liste"); const seen = (Z.meta && Z.meta.w38elite) || {};
          if (list && !document.querySelector("#modal .w38-elitekunde")) {
            let h = '<div class="w38-elitekunde"><h3>' + esc(L(["Elite-Eigenschaften", "Elite traits"])) + "</h3>";
            for (const k in Z.ELITE) {
              const mine = NEU[k], d = mine ? (seen[k] ? L(mine.tip) : L(["Noch nicht begegnet.", "Not met yet."])) : ALT[k] ? L(ALT[k]) : "";
              h += '<div class="zeile' + (mine && !seen[k] ? " unbekannt" : "") + '"><div><b>' + esc(L(Z.ELITE[k])) + (mine ? ' <small class="w38-neu">' + esc(L(["neu", "new"])) + "</small>" : "") + "</b><small>" + esc(d) + "</small></div></div>";
            }
            list.insertAdjacentHTML("beforeend", h + "</div>");
          }
        }
      } catch (e) { console.error("W38 Gegner", e); }
      return r;
    };
    ui.codex._w38g = true;
  }
  wireCodex();
  const css = document.createElement("style");
  css.textContent = ".w38-elitekunde{grid-column:1/-1;width:100%;margin-top:10px}.w38-elitekunde h3{color:#e5b454;margin:6px 0}.w38-elitekunde small.w38-neu{display:inline-block;width:auto;vertical-align:middle;color:#ffd27a;font-size:.8em;border:1px solid rgba(229,180,84,.5);border-radius:8px;padding:0 5px;margin-left:4px}";
  document.head.appendChild(css);

  Z.gegner2 = {
    NEU,
    spawn: (id, k, dx) => { const P = Z.player; if (!P) return null; const e = Z.spawnEnemy(id || "soeldner", P.x + (dx || 120), P.y + P.h, { elite: true }); if (e) { e.elite = k || "spiegelnd"; e.w38cd = 0.5; e.w38m = 0; e.aware = true; } return e; },
    leaps: () => LEAPS.length, pfad: (e) => { const P = Z.player; return P ? pathClear(e, P.x + P.w / 2, P.y + P.h) : 0; }
  };
})();
