/* Glut und Asche · W52 Fairness – Treffer, die sich unfair anfühlen
   Gemessen (Treffer-Protokoll über Bot-Läufe in allen 14 Gebieten und an allen 15 Bossen, Skripte im Testordner w52_fair):
   · Treffer in den letzten 0,08 s der Rolle (Rolle 0,3 s, Unverwundbarkeit nur 0,22 s) – größter Posten in den Gebieten.
   · Schüsse von Gegnern außerhalb des Bildes – Fernangriffe beginnen jetzt erst im Bild (gegner.js, Ausschnitt hier: Z.fairSicht).
   · Zwangsschaden der Umgebung (Wasser, Lava, Gas, Abgrund) direkt nach einem Gegner-Treffer (Rückstoß ins Wasser) – Stapel.
   · Ursache oft nicht erkennbar (Geschoss, Fläche, Falle, Boss-Effekt ohne Angreifer) – jetzt kurze Quelle-Anzeige beim Treffer
     und „Getötet von …“ im Todesfenster.
   Alles über Z.haken (bleibt außen, wirkt je Aufruf einmal). Kein Blau. Prüfhilfe: Z.fair. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || !Z.haken || Z.fair) return;
  const H = Z.haken, FX = Z.fx || Z.FX;
  const L = v => (Z.L ? Z.L(v) : v[0]);
  const S = () => Z.settings || {};
  const F = Z.fair = { takt: 0, camTakt: -99, letzter: null, letzterT: -99, rolleT0: -99, stapel: 0, rolleSchutz: 0, quellen: 0 };

  /* ---------- Spieltakt (Z.updateEnemies läuft in jedem Teilschritt) ---------- */
  let zeit = 0;
  H.vor("updateEnemies", "w52takt", function (a) {
    F.takt++; zeit += +a[0] || 0;
    rolleVerlaengern(Z.player);
  });

  /* ---------- Sichtausschnitt für Fernangriffe ---------- */
  function camWrap() {
    const cm = Z.cam; if (!cm || typeof cm.update !== "function" || cm.update._w52) return;
    const u0 = cm.update;
    const u = function () { F.camTakt = F.takt; return u0.apply(this, arguments); };
    u._w52 = true; cm.update = u;
  }
  camWrap();
  /* echte Kamera, wenn sie frisch ist (Einzelspiel, lokaler Koop – gemeinsames Bild); sonst (Testläufe ohne Bild, Online-Gast mit
     eigenem Bild) ein gleich großer Ausschnitt um das Ziel, an den Gebietsrand geklemmt wie die Kamera selbst */
  Z.fairSicht = function (x, y, P, rand) {
    const cm = Z.cam; if (!cm || !(cm.w > 0) || !P) return true;
    camWrap();
    const R = rand || 0, online = !!(Z.online && Z.online.S && Z.online.S.playing);
    let bx = cm.x, by = cm.y;
    if (online || F.takt - F.camTakt > 3) {
      const ox = cm.x, oy = cm.y;
      cm.x = P.x + P.w / 2 - cm.w / 2; cm.y = P.y + P.h / 2 - 10 - cm.h / 2;
      try { if (cm.clamp) cm.clamp(); } catch (err) { /* ohne Grenzen */ }
      bx = cm.x; by = cm.y; cm.x = ox; cm.y = oy;
    }
    return x > bx + R && x < bx + cm.w - R && y > by + R && y < by + cm.h - R;
  };

  /* ---------- Rolle: ganze Rolle unverwundbar (statt 0,22 von 0,3 s) ---------- */
  /* Gemessen (Nachtrag): der Schutz endete 0,08 s vor dem Ende der sichtbaren Rolle. Wer bei einem Angriff zweimal kurz hintereinander
     rollt (zweiter Druck während der Rolle → gepuffert, Abstand 0,42 s), bekam mit der ersten Ausnahme (< 0,45 s = alter Schutz) beim
     zweiten Mal wieder nur 0,22 s – das war der Großteil der „Treffer in der Rolle“.
     Jetzt: die ersten zwei Rollen einer Kette sind ganz geschützt (Schutz = sichtbare Rolle); ab der dritten Rolle ohne Pause
     (jeweils < 0,45 s nach Beginn der vorigen) gilt wieder der alte Schutz (0,22 s) – Dauerrollen bleibt so lückenhaft wie bisher.
     Zustand je Spielfigur (lokaler Koop: zweite Figur eigenständig). Umgebungsschaden prüft die Unverwundbarkeit wie bisher. */
  const KETTE = 0.45, KETTE_MAX = 2;
  function rolleVerlaengern(P) {
    if (!P || P.dead || F.rolleAus) return; /* F.rolleAus: nur für Vergleichstests (alter Schutz) */
    const r = P.rollT || 0, alt = P._w52rAlt || 0;
    if (r > alt + 0.05) { /* neue Rolle */
      const t0 = P._w52rT0 != null && P._w52rT0 <= zeit ? P._w52rT0 : -99;
      P._w52kette = zeit - t0 < KETTE ? (P._w52kette || 1) + 1 : 1;
      P._w52rT0 = zeit; F.rolleOk = P._w52kette <= KETTE_MAX; F.kette = P._w52kette;
    }
    P._w52rAlt = r;
    if (r > 0 && P._w52kette <= KETTE_MAX && (P.iframe || 0) < r) P.iframe = r;
  }

  /* ---------- Quelle eines Treffers ---------- */
  const PNAME = {
    e_pfeil: ["Pfeil", "Arrow"], e_bolzen: ["Bolzen", "Bolt"], e_nadel: ["Wurfnadel", "Needle"], e_stein: ["Stein", "Rock"], e_glut: ["Glut", "Ember"],
    e_scherbe: ["Scherbe", "Shard"], e_welle: ["Druckwelle", "Shockwave"], e_dolch: ["Dolch", "Dagger"], e_zahn: ["Goldmünze", "Gold coin"],
    e_feuerball: ["Feuerball", "Fireball"], e_kugel: ["Knochenkugel", "Bone orb"], e_blase: ["Blase", "Bubble"], e_phiole: ["Phiole", "Vial"],
    e_schall: ["Schallwelle", "Sound wave"], e_feder: ["Feder", "Feather"]
  };
  const HNAME = {
    fire: ["Feuer", "Fire"], poisonpool: ["Giftlache", "Poison pool"], poisoncloud: ["Giftwolke", "Poison cloud"], lava: ["Lava", "Lava"],
    rockspike: ["Felsstachel", "Rock spike"], roots: ["Wurzeln", "Roots"], strike: ["Einschlag", "Strike"], column: ["Säule", "Pillar"],
    zone: ["Bodenschlag", "Ground strike"], breath: ["Atem", "Breath"]
  };
  function nameGegner(e) {
    if (!e) return "";
    const B = Z.BOSSDEF && Z.BOSSDEF[e.id], D = Z.ENEMIES && Z.ENEMIES[e.id];
    const n = (B && B.n) || (D && D.n) || (e.def && e.def.n);
    return n ? L(n) : String(e.id || "");
  }
  function nameAngriff(e) {
    if (!e) return "";
    if (e.act && e.act.a && e.act.a.name) return L(e.act.a.name);
    if (e.mv && e.mv.id) { const s = String(e.mv.id); return s.charAt(0).toUpperCase() + s.slice(1); }
    return "";
  }
  function nahe(x, y) {
    let best = null, bd = 90;
    for (const e of Z.enemies || []) {
      if (e.dead) continue;
      const d = Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) - Math.max(e.w, e.h) / 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  H.nach("spawnProj", "w52quelle", function (p, a) {
    if (!p || p.owner !== "e" || p._w52s) return;
    const e = nahe(a[1], a[2]);
    p._w52s = e ? { n: nameGegner(e), a: nameAngriff(e) } : (Z.boss && !Z.boss.dead ? { n: nameGegner(Z.boss), a: nameAngriff(Z.boss) } : { n: "", a: "" });
  });
  H.nach("spawnHazard", "w52quelle", function (h, a) {
    if (!h || h.owner === "p" || h._w52s) return;
    const o = a[0] || {}, e = nahe(o.x || 0, (o.y || 0) - 12);
    const b = Z.boss && !Z.boss.dead ? Z.boss : null;
    h._w52s = e ? { n: nameGegner(e), a: nameAngriff(e) } : b ? { n: nameGegner(b), a: nameAngriff(b) } : { n: "", a: "" };
  });
  function quelle(o, P) {
    o = o || {};
    if (o.attacker) {
      const e = o.attacker, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      return { n: nameGegner(e), a: nameAngriff(e), zeigen: !Z.fairSicht(cx, cy, P, -6) };
    }
    let p = o.proj || null;
    if (!p) for (const q of Z.projs || []) if (q.owner === "e" && q.hits && q.hits.has(P) && !q._w52g) { p = q; break; }
    if (p) { p._w52g = 1; const s = p._w52s || {}; return { n: s.n || "", a: L(PNAME[p.kind] || ["Geschoss", "Projectile"]), zeigen: true }; }
    for (const h of Z.hazards || []) {
      if (h.owner === "p" || !h.hits || !h.hits.has(P) || h._w52g || Math.abs(h.x - (P.x + P.w / 2)) > (h.w || 40) + 30) continue;
      h._w52g = 1; const s = h._w52s || {}; return { n: s.n || "", a: L(HNAME[h.kind] || ["Fläche", "Area"]), zeigen: true };
    }
    if (o.fall) return { n: "", a: L(["Absturz", "Fall"]), zeigen: false };
    if (o.spike) return { n: "", a: L(["Stacheln", "Spikes"]), zeigen: true };
    if (o.trap) return { n: "", a: L(["Falle", "Trap"]), zeigen: true };
    if (o.hazard) return { n: "", a: L(["Gefahr der Umgebung", "Environmental hazard"]), zeigen: true };
    const b = Z.boss && !Z.boss.dead && !Z.bossDefeated ? Z.boss : null;
    if (b) return { n: nameGegner(b), a: nameAngriff(b), zeigen: true };
    return { n: "", a: L(["Unbekannt", "Unknown"]), zeigen: false };
  }
  F.text = q => (q ? (q.n && q.a ? q.n + " · " + q.a : q.n || q.a || "") : "");

  /* ---------- Treffer ---------- */
  let zeigeT = -99, zeigeTxt = "";
  H.aussen("hurtPlayer", "w52fair", function (a, weiter) {
    const P = Z.player; if (!P || P.dead) return weiter(a);
    const o = a[1] || {};
    rolleVerlaengern(P);
    /* Stapel: Zwangsschaden der Umgebung (Wasser/Lava/Gas/Abgrund – Rücksetzen bleibt) kurz nach einem Treffer zählt nicht doppelt */
    if (o.force && o.hazard && zeit - F.letzterT < 0.5 && zeit >= F.letzterT) { F.stapel++; return false; }
    const hp0 = P.hp;
    const r = weiter(a);
    if (P.hp < hp0) {
      F.letzterT = zeit;
      try {
        const q = quelle(o, P); F.letzter = q; F.quellen++;
        if (Z.run) Z.run._w52tod = { n: q.n, a: q.a };
        let t = q.n || q.a || ""; /* kurz halten (dezent): nur der Name; voller Text „Gegner · Angriff“ im Todesfenster */
        if (t.length > 24) t = t.slice(0, 23) + "…";
        if (q.zeigen && t && S().trefferQuelle !== false && FX && FX.text && !(t === zeigeTxt && zeit - zeigeT < 1.2)) {
          zeigeT = zeit; zeigeTxt = t;
          FX.text(P.x + P.w / 2, P.y - 20, t, "#e8c49a", false);
        }
      } catch (err) { /* Anzeige darf nie den Treffer stören */ }
    }
    return r;
  });
  H.nach("loadArea", "w52fair", function () { F.letzterT = -99; zeit = 0; const P = Z.player; if (P) { P._w52rT0 = null; P._w52kette = 0; } });

  /* ---------- Todesfenster: „Getötet von …“ ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
  function zeile() {
    const d = Z.run && Z.run._w52tod; if (!d || !(d.n || d.a)) return;
    const box = document.querySelector("#modal .mbox"); if (!box || box.querySelector(".w52-tod")) return;
    const p = document.createElement("p"); p.className = "w52-tod";
    p.style.cssText = "margin:.2em 0 .6em;color:#e8c49a;font-size:.92em;opacity:.95";
    p.innerHTML = esc(L(["Getötet von: ", "Killed by: "])) + "<b style=\"color:#ffb070\">" + esc(d.n || d.a) + "</b>" + (d.n && d.a ? " – " + esc(d.a) : "");
    const ref = box.querySelector(".unter") || box.querySelector("h2");
    if (ref && ref.parentNode) ref.parentNode.insertBefore(p, ref.nextSibling); else box.insertBefore(p, box.firstChild);
  }
  function wireTod() {
    if (!Z.ui || typeof Z.ui.deathScreen !== "function") return setTimeout(wireTod, 60);
    const ds0 = Z.ui.deathScreen;
    Z.ui.deathScreen = function (o) {
      const r = ds0.apply(this, arguments);
      if (!(o && o.abort)) try { zeile(); setTimeout(zeile, 0); } catch (err) { /* nur Anzeige */ }
      return r;
    };
  }
  if (document.readyState === "complete") setTimeout(wireTod, 0); else window.addEventListener("load", () => setTimeout(wireTod, 0));
  H.vor("newRun", "w52fair", function () { F.letzter = null; });
  H.pruefen();
})();
