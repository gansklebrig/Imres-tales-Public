/* Ezekiel – The Destroyer · Ergebnis teilen (W39 Teilen)
   Knopf „Teilen“ im Todes-/Endfenster und im Lauf-Rückblick (auch nach der Tagesprüfung und bei neuem Tiefe-Bestwert):
   Ergebniskarte als Bild (Leinwand im Stil der Kapitelseiten) + kurzer Text.
   Wege: Web Share API mit Datei (Handy) · sonst Bild herunterladen + Text kopieren · PC-Programm: Text über __zsPC.speichern,
   Bild in die Zwischenablage (das Programm speichert nur Text/JSON).
   Tagesprüfung: Vergleichscode „ZT1-…“ – ein Freund fügt ihn am Sonnenstein ein und sieht „Dein Wert vs. Freund“ für denselben Tag
   (nur Anzeige, keine Rangliste; Eingaben streng geprüft). Vorschau über Z.leinwandURL (Brave/Firefox-Schutz).
   Farben: Pergament, Tinte, Glut, Gold – kein Blau. Prüfhilfe: Z.teilen. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z) return;
  const L = v => (Z.L ? Z.L(v) : v[0]);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const HELD = { Z: "Ezekiel", G: "Friedrich", B: "Barradin", E: "Echo" };
  const istHeld = h => typeof h === "string" && Object.prototype.hasOwnProperty.call(HELD, h);
  const FD = "'IM Fell English SC','Palatino Linotype',Georgia,serif", FB = "'Alegreya Sans','Trebuchet MS',sans-serif", FI = "'IM Fell English','Palatino Linotype',Georgia,serif";
  const pc = () => !!window.__zsPC;
  const fmtZeit = s => { s = Math.max(0, Math.round(s || 0)); const m = Math.floor(s / 60), x = s % 60; return m + ":" + (x < 10 ? "0" : "") + x; };
  const heute = () => { const d = new Date(), p = n => (n < 10 ? "0" : "") + n; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); };
  const datumTxt = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ""); return m ? (L(["de", "en"]) === "de" ? m[3] + "." + m[2] + "." + m[1] : m[1] + "-" + m[2] + "-" + m[3]) : ""; };
  const name = id => { if (id === "passage") return L(["Durchgang", "Passage"]); try { if (Z.areaName) return Z.areaName(id); } catch (_) {} return id || ""; };
  const bossName = b => (Z.BOSSDEF && Z.BOSSDEF[b] && Z.BOSSDEF[b].n ? L(Z.BOSSDEF[b].n) : b);

  /* ---------- Ergebnis zusammentragen (beim Tod/Ende, solange Z.run noch da ist) ---------- */
  let letzt = null;
  function sammle(kind) {
    const run = Z.run; if (!run) return null;
    const st = Z.stats || {}, tg = run.w38tag, tf = run.w38tiefe, m = Z.meta || {};
    const d = {
      art: "lauf", kind: kind || "tod", held: istHeld(run.hero) ? HELD[run.hero] : "Ezekiel", heldId: istHeld(run.hero) ? run.hero : "Z",
      gebiet: run.area === "passage" && (run.route || []).length ? run.route[run.route.length - 1] : run.area, imDurchgang: run.area === "passage", stufe: run.tier | 0, gebiete: (run.route || []).length, zeit: run.time || 0, kills: st.kills | 0,
      bosse: (run.bossesBeaten || []).slice(0, 6), datum: heute(), gnade: !!run.gnade,
      hilfen: Array.isArray(run.hilfen) ? run.hilfen.slice(0, 6) : [] /* W39 Zugang: faire Kennzeichnung */
    };
    if (tg) {
      const t = m.w38tag || {}, last = t.last && t.last.d === tg.d ? t.last : null;
      d.art = "tag"; d.tag = tg.d; d.gesetze = (tg.rules || []).slice(0, 4);
      d.punkte = last ? last.p | 0 : (Z.abw && Z.abw.punkte ? Z.abw.punkte() | 0 : 0); d.best = t.d === tg.d ? t.best | 0 : d.punkte;
    } else if (tf) {
      const tm = m.w38tiefe || {};
      d.tiefe = tf.maxN | 0; d.tiefeBest = tm.best | 0;
      if (tf.maxN > 0 && tf.maxN >= (tm.best | 0) && (tm.bestT || 0) >= (tf.t0 || 0)) d.art = "tiefe"; /* in diesem Lauf neuer Bestwert */
    }
    return d;
  }

  /* ---------- Karte zeichnen ---------- */
  function karte(d) {
    const W = 1200, H = 630, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), lo = !!(Z.gq && Z.gq.level === 0);
    /* Pergament mit dunklem Rand (Kapitelseite) */
    const g = c.createRadialGradient(W * 0.45, H * 0.45, 80, W * 0.5, H * 0.5, W * 0.75);
    g.addColorStop(0, "#efe0bf"); g.addColorStop(0.7, "#dcc497"); g.addColorStop(1, "#a7865a");
    c.fillStyle = "#1a0e10"; c.fillRect(0, 0, W, H);
    c.fillStyle = g; c.fillRect(18, 18, W - 36, H - 36);
    if (!lo) { c.globalAlpha = 0.07; for (let i = 0; i < 900; i++) { c.fillStyle = i % 2 ? "#5a3a1a" : "#fff6dc"; c.fillRect((i * 7919) % W, (i * 104729) % H, 2, 2); } c.globalAlpha = 1; }
    c.strokeStyle = "#5a2a14"; c.lineWidth = 3; c.strokeRect(34, 34, W - 68, H - 68);
    c.strokeStyle = "rgba(90,42,20,.45)"; c.lineWidth = 1; c.strokeRect(42, 42, W - 84, H - 84);
    for (const [x, y] of [[34, 34], [W - 34, 34], [34, H - 34], [W - 34, H - 34]]) { c.fillStyle = "#8a2a14"; c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); }
    /* Figur links */
    c.save(); c.translate(250, 470); c.scale(7, 7);
    try {
      if (d.heldId === "Z" && Z.drawPlayer && Z.newPlayer) { const P = Z.newPlayer(); P.x = -P.w / 2; P.y = -P.h; P.onGround = true; P.face = 1; Z.drawPlayer(c, P, 0.4); }
      else if (Z.drawNPC) Z.drawNPC(c, d.heldId, 0, 0, 0.4, 1);
    } catch (_) {}
    c.restore();
    c.fillStyle = "rgba(60,20,10,.18)"; c.beginPath(); c.ellipse(250, 474, 90, 12, 0, 0, Math.PI * 2); c.fill();
    /* Text rechts */
    const X = 470; let y = 112;
    c.fillStyle = "#3a1408"; c.textBaseline = "alphabetic";
    c.font = "40px " + FD; c.fillText("Glut und Asche", X, y); y += 44;
    c.font = "italic 26px " + FI; c.fillStyle = "#7a2a10";
    const kopf = d.art === "tag" ? "☀ " + L(["Tagesprüfung", "Daily Trial"]) + " · " + datumTxt(d.tag)
      : d.art === "tiefe" ? "⬇ " + L(["Neuer Tiefe-Bestwert", "New depth record"])
      : d.kind === "sieg" ? L(["Die Feste ist gefallen", "The keep has fallen"]) : L(["Ein Lauf in der Feste der Fäden", "A run in the Keep of Threads"]);
    c.fillText(kopf, X, y); y += 22;
    c.strokeStyle = "rgba(90,42,20,.5)"; c.beginPath(); c.moveTo(X, y); c.lineTo(W - 80, y); c.stroke(); y += 50;
    const zeile = (lab, wert, gross) => { c.font = "600 22px " + FB; c.fillStyle = "#6a4022"; c.fillText(lab, X, y); c.font = /^[\d:·.\s]+$/.test(wert) ? (gross ? "700 50px " : "600 30px ") + FB : (gross ? "48px " : "32px ") + FD; /* Ziffern klar lesbar (1 ≠ I) */ c.fillStyle = gross ? "#8a2008" : "#2a1408"; c.fillText(wert, X + 230, y + (gross ? 6 : 2)); y += gross ? 62 : 46; };
    if (d.art === "tag") { zeile(L(["Punkte", "Points"]), String(d.punkte | 0), true); if (d.best > d.punkte) zeile(L(["Tagesbestes", "Day best"]), String(d.best)); }
    if (d.art === "tiefe") zeile(L(["Tiefe", "Depth"]), String(d.tiefe), true);
    zeile(L(["Held", "Hero"]), d.held);
    zeile(L(["Erreicht", "Reached"]), name(d.gebiet) + (d.imDurchgang ? " · " + L(["Durchgang", "passage"]) : "") + (d.tiefe && d.art !== "tiefe" ? " · " + L(["Tiefe ", "Depth "]) + d.tiefe : ""));
    zeile(L(["Zeit · Kills", "Time · Kills"]), fmtZeit(d.zeit) + " · " + (d.kills | 0));
    if (d.bosse && d.bosse.length) { c.font = "600 22px " + FB; c.fillStyle = "#6a4022"; c.fillText(L(["Bosse", "Bosses"]), X, y); c.font = "24px " + FI; c.fillStyle = "#2a1408"; c.fillText(d.bosse.map(bossName).join(" · ").slice(0, 60), X + 230, y); y += 40; }
    if (d.gesetze && d.gesetze.length && Z.abw && Z.abw.GESETZE) { c.font = "600 22px " + FB; c.fillStyle = "#6a4022"; c.fillText(L(["Tagesgesetze", "Daily laws"]), X, y); c.font = "24px " + FI; c.fillStyle = "#2a1408"; c.fillText(d.gesetze.filter(k => Z.abw.GESETZE[k]).map(k => L(Z.abw.GESETZE[k].n)).join(" · ").slice(0, 60), X + 230, y); y += 40; }
    /* Fuß */
    const hl = d.hilfen && d.hilfen.length && Z.hilfen ? Z.hilfen.hilfeText(d.hilfen) : "";
    c.font = "600 20px " + FB; c.fillStyle = "#6a4022"; c.fillText(datumTxt(d.datum) + (d.gnade ? " · " + L(["mit Barmherzigkeit", "with mercy"]) : "") + (hl ? " · ✚ " + hl : ""), X, H - 62);
    c.textAlign = "right"; c.font = "26px " + FD; c.fillStyle = "#8a2a14"; c.fillText("imrestales.de", W - 70, H - 60); c.textAlign = "left";
    return cv;
  }
  function text(d) {
    const tl = d.art === "tag" ? L(["☀ Tagesprüfung ", "☀ Daily trial "]) + datumTxt(d.tag) + ": " + (d.punkte | 0) + L([" Punkte", " points"])
      : d.art === "tiefe" ? L(["⬇ Neuer Tiefe-Bestwert: ", "⬇ New depth record: "]) + d.tiefe
      : (d.kind === "sieg" ? L(["Die Feste ist gefallen! ", "The keep has fallen! "]) : "") + L(["Erreicht: ", "Reached: "]) + name(d.gebiet);
    let t = "Glut und Asche · " + tl + " · " + d.held + " · " + fmtZeit(d.zeit) + " · " + (d.kills | 0) + " Kills";
    if (d.hilfen && d.hilfen.length && Z.hilfen) t += " · ✚ " + Z.hilfen.hilfeText(d.hilfen);
    if (d.art === "tag") t += "\n" + L(["Vergleich am Sonnenstein: ", "Compare at the Sunstone: "]) + code(d);
    return t + "\nimrestales.de";
  }

  /* ---------- Vergleichscode (Tagesprüfung) ---------- */
  const okDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
  const pruef = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return (h % 46656).toString(36).padStart(3, "0"); }; /* nur gegen Tippfehler */
  function code(d) {
    const o = { d: d.tag, p: d.punkte | 0, h: istHeld(d.heldId) ? d.heldId : "Z", k: Math.min(999999, d.kills | 0), z: Math.min(359999, Math.round(d.zeit || 0)), a: d.hilfen && d.hilfen.length ? 1 : 0 };
    const body = b64u(JSON.stringify(o)); return "ZT1-" + body + "-" + pruef(body);
  }
  function lies(s) {
    if (typeof s !== "string") return null; s = s.trim(); if (s.length > 240) return null;
    const m = /(?:^|\s)ZT1-([A-Za-z0-9_-]{8,200})-([0-9a-z]{3})(?:\s|$)/.exec(s); if (!m || pruef(m[1]) !== m[2]) return null;
    let o; try { o = JSON.parse(unb64u(m[1])); } catch (_) { return null; }
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const r = { d: okDay(o.d) ? o.d : null, p: int(o.p, 0, 10000000), h: istHeld(o.h) ? o.h : null, k: int(o.k, 0, 999999), z: int(o.z, 0, 359999), a: o.a === undefined ? 0 : int(o.a, 0, 1) };
    if (!r.d || r.p == null || !r.h || r.k == null || r.z == null || r.a == null) return null;
    return r;
  }
  function vergleich(f) {
    const t = (Z.meta && Z.meta.w38tag) || {}; let mein = null, meinH = false;
    if (t.d === f.d) { mein = t.best | 0; meinH = !!t.bestH; } else if (Array.isArray(t.hist)) { const h = t.hist.find(x => Array.isArray(x) && x[0] === f.d); if (h) { mein = h[1] | 0; meinH = !!h[3]; } } /* W40 Balance: eigene ✚-Markierung */
    let h = "<h2>☀ " + esc(L(["Vergleich", "Comparison"])) + "<small>" + esc(L(["Tagesprüfung ", "Daily trial "]) + datumTxt(f.d)) + "</small></h2>";
    h += '<table class="zt-vgl"><tr><th></th><th>' + esc(L(["Du", "You"])) + "</th><th>" + esc(L(["Freund", "Friend"])) + "</th></tr>";
    h += "<tr><td>" + esc(L(["Punkte", "Points"])) + "</td><td>" + (mein == null ? "–" : mein + (meinH ? " ✚" : "")) + "</td><td>" + f.p + (f.a ? " ✚" : "") + "</td></tr>";
    h += "<tr><td>" + esc(L(["Held", "Hero"])) + "</td><td></td><td>" + esc(HELD[f.h]) + "</td></tr><tr><td>" + esc(L(["Zeit · Kills", "Time · Kills"])) + "</td><td></td><td>" + fmtZeit(f.z) + " · " + f.k + "</td></tr></table>";
    h += '<p class="hinweis">' + esc(mein == null ? L(["Du hast diesen Tag noch nicht gespielt.", "You haven't played this day yet."]) : mein > f.p ? L(["Du liegst vorn.", "You're ahead."]) : mein < f.p ? L(["Dein Freund liegt vorn.", "Your friend is ahead."]) : L(["Gleichstand.", "A tie."])) + "</p>";
    if (f.a) h += '<p class="hinweis">✚ ' + esc(L(["Dein Freund hat mit Spielhilfen gespielt.", "Your friend played with assists."])) + "</p>";
    h += '<div class="knoepfe"><button data-act="close" autofocus>' + esc(L(["Schließen", "Close"])) + "</button></div>";
    Z.ui.open(h, { cls: "schmal" });
  }
  function codeFenster() {
    const h = "<h2>☀ " + esc(L(["Code eines Freundes", "A friend's code"])) + '</h2><p class="hinweis">' + esc(L(["Den Vergleichscode aus der Nachricht hier einfügen (beginnt mit ZT1-).", "Paste the comparison code from the message here (starts with ZT1-)."])) + '</p><textarea class="zt-ein" rows="3" maxlength="400" aria-label="Code"></textarea><p class="zt-fehl" hidden></p><div class="knoepfe"><button data-act="ztPruef" autofocus>' + esc(L(["Vergleichen", "Compare"])) + '</button><button data-act="close">' + esc(L(["Zurück", "Back"])) + "</button></div>";
    Z.ui.open(h, { cls: "schmal" });
  }

  /* ---------- Teilen-Feld: klappt im offenen Fenster auf (Todes-/Endfenster bleiben, „Zurück ins Lager“ geht weiter) ---------- */
  let cur = null;
  function fenster(d) {
    if (!d) return; cur = { d, cv: karte(d) };
    const url = Z.leinwandURL ? Z.leinwandURL(cur.cv, "image/png") : cur.cv.toDataURL("image/png");
    let h = "<h3>" + esc(L(["Ergebnis teilen", "Share result"])) + '</h3><img class="zt-bild" alt="' + esc(L(["Ergebniskarte", "Result card"])) + '" src="' + url + '">';
    h += '<p class="zt-text">' + esc(text(d)).replace(/\n/g, "<br>") + "</p>";
    const kann = !pc() && navigator.canShare && window.File;
    h += '<div class="knoepfe">' + (kann ? '<button data-act="ztShare" autofocus>📤 ' + esc(L(["Teilen …", "Share …"])) + "</button>" : "") +
      (pc() ? '<button data-act="ztPC"' + (kann ? "" : " autofocus") + ">💾 " + esc(window.__zsPC && typeof window.__zsPC.speichernBild === "function" ? L(["Bild speichern + Text kopieren", "Save image + copy text"]) : L(["Text speichern + Bild kopieren", "Save text + copy image"])) + "</button>" : '<button data-act="ztLaden"' + (kann ? "" : " autofocus") + ">⬇ " + esc(L(["Bild laden + Text kopieren", "Download image + copy text"])) + "</button>") +
      (d.art === "tag" ? '<button data-act="ztCode">' + esc(L(["Vergleichscode kopieren", "Copy comparison code"])) + "</button>" : "") +
      '<button data-act="ztZurueck">' + esc(L(["Zuklappen", "Collapse"])) + "</button></div>";
    const m = document.getElementById("modal"), k = m && !m.hidden ? m.querySelector('[data-act="ztOpen"]') : null, anker = k ? k.closest(".knoepfe") : null;
    const alt = m && m.querySelector(".zt-box"); if (alt) alt.remove();
    if (anker) {
      const box = document.createElement("div"); box.className = "zt-box"; box.innerHTML = h; anker.parentNode.insertBefore(box, anker.nextSibling);
      const f = box.querySelector("[autofocus]") || box.querySelector("button"); if (f) f.focus({ preventScroll: false });
      try { box.scrollIntoView({ block: "nearest" }); } catch (_) {}
    } else Z.ui.open('<div class="zt-box">' + h + "</div>", { cls: "schmal" });
  }
  const blob = () => new Promise(r => { try { cur.cv.toBlob(b => r(b), "image/png"); } catch (_) { r(null); } });
  const dateiName = () => "ezekiel-" + (cur.d.art === "tag" ? "tag-" + cur.d.tag : cur.d.datum) + ".png";
  async function kopiere(t) { try { await navigator.clipboard.writeText(t); return true; } catch (_) { try { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (__) { return false; } } }
  const toast = (t, ms) => { if (Z.ui && Z.ui.toast) Z.ui.toast(t, ms || 2600); else if (Z.toast) Z.toast(t, ms || 2600); };
  function wire() {
    const u = Z.ui; if (!u || !u.actions || !u.open || !u.deathScreen) return setTimeout(wire, 60);
    const a = u.actions;
    a.ztOpen = () => { const d = letzt || sammle(); if (d) fenster(d); };
    a.ztZurueck = () => { const b = document.querySelector("#modal .zt-box"); if (b && document.querySelector('#modal [data-act="ztOpen"]')) { b.remove(); const k = document.querySelector('#modal [data-act="ztOpen"]'); if (k) k.focus(); } else u.close(); };
    a.ztShare = async () => {
      const b = await blob(); const t = text(cur.d);
      try { const f = new File([b], dateiName(), { type: "image/png" }); if (b && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: t, title: "Glut und Asche" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
      a.ztLaden();
    };
    a.ztLaden = async () => {
      const b = await blob();
      if (b) { const url = URL.createObjectURL(b), l = document.createElement("a"); l.href = url; l.download = dateiName(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
      const ok = await kopiere(text(cur.d)); toast((b ? L(["Bild geladen", "Image downloaded"]) + " · " : "") + (ok ? L(["Text kopiert", "Text copied"]) : L(["Text bitte von Hand kopieren", "Please copy the text by hand"])));
    };
    a.ztPC = async () => {
      const PC = window.__zsPC;
      if (PC && typeof PC.speichernBild === "function") { /* W39 Teilen: PNG über den Speichern-Dialog des Programms */
        try {
          const b = await blob(); const r = b ? await PC.speichernBild(dateiName(), await b.arrayBuffer()) : null;
          if (r && r.abbruch) return;
          const ok = await kopiere(text(cur.d));
          if (r && r.ok) { toast(L(["Bild gespeichert", "Image saved"]) + (ok ? " · " + L(["Text kopiert", "text copied"]) : ""), 3600); return; }
        } catch (_) {}
      }
      let bildOk = false;
      try { const b = await blob(); if (b && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) { await navigator.clipboard.write([new window.ClipboardItem({ "image/png": b })]); bildOk = true; } } catch (_) {}
      try { const r = await window.__zsPC.speichern(dateiName().replace(/\.png$/, ".txt"), text(cur.d)); if (r && r.ok) { toast(L(["Gespeichert", "Saved"]) + (bildOk ? " · " + L(["Bild in der Zwischenablage", "image on the clipboard"]) : ""), 3200); return; } if (r && r.abbruch) return; } catch (_) {}
      toast(bildOk ? L(["Bild in der Zwischenablage", "Image on the clipboard"]) : L(["Speichern nicht möglich", "Saving not possible"]));
    };
    a.ztCode = async () => { const ok = await kopiere(code(cur.d)); toast(ok ? L(["Vergleichscode kopiert", "Comparison code copied"]) : code(cur.d), 4000); };
    a.ztCodeEin = () => { u.onClose = null; codeFenster(); };
    a.ztPruef = () => {
      const ta = document.querySelector("#modal .zt-ein"), f = lies(ta ? ta.value : "");
      if (!f) { const e = document.querySelector("#modal .zt-fehl"); if (e) { e.hidden = false; e.textContent = L(["Das ist kein gültiger Vergleichscode.", "That is not a valid comparison code."]); } return; }
      vergleich(f);
    };
    /* Todes-/Endfenster: Ergebnis festhalten, Knopf einsetzen */
    for (const k of ["deathScreen", "ending"]) {
      const f0 = u[k]; if (!f0 || f0._zt) continue;
      const w = function (o) { try { letzt = sammle(k === "ending" ? "sieg" : o && o.abort ? "abbruch" : "tod"); } catch (e) { console.error("teilen", e); } const r = f0.apply(this, arguments); setTimeout(knopf, 0); return r; };
      w._zt = true; Object.keys(f0).forEach(x => { w[x] = f0[x]; }); u[k] = w;
    }
    /* Rückblick und Sonnenstein: Knöpfe einsetzen */
    const o0 = u.open;
    u.open = function (html, opts) {
      const r = o0.apply(this, arguments);
      try {
        if (opts && /rb21box/.test(opts.cls || "")) knopf();
        const m = document.getElementById("modal");
        if (m && typeof html === "string" && /Sonnenstein · |Sunstone · /.test(html) && !m.querySelector('[data-act="ztCodeEin"]')) {
          const k = m.querySelector(".knoepfe"); if (k) { const b = document.createElement("button"); b.dataset.act = "ztCodeEin"; b.textContent = "⇄ " + L(["Mit Freund vergleichen", "Compare with a friend"]); k.appendChild(b); }
        }
      } catch (e) { console.error("teilen", e); }
      return r;
    };
    Object.keys(o0).forEach(x => { u.open[x] = o0[x]; });
  }
  function knopf() {
    if (!letzt) return;
    const m = document.getElementById("modal"); if (!m || m.hidden || m.querySelector('[data-act="ztOpen"]')) return;
    if (!m.querySelector('[data-act="toCamp"]') && !m.querySelector(".rb21box")) return;
    const k = m.querySelector(".knoepfe"); if (!k) return;
    const b = document.createElement("button"); b.dataset.act = "ztOpen";
    b.textContent = "📤 " + (letzt.art === "tag" ? L(["Tagesergebnis teilen", "Share daily result"]) : letzt.art === "tiefe" ? L(["Tiefe-Bestwert teilen", "Share depth record"]) : L(["Teilen", "Share"]));
    k.appendChild(b);
  }
  setTimeout(wire, 0);
  Z.teilen = { sammle, karte, text, code, lies, vergleich, fenster, letzt: () => letzt, setLetzt: d => { letzt = d; } };

  const st = document.createElement("style");
  st.textContent = ".zt-box .zt-bild{display:block;width:100%;max-width:560px;margin:6px auto;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.45)}.zt-box .zt-text{font-size:.9em;color:#d8c8b0;margin:6px 0}" +
    ".zt-ein{width:100%;box-sizing:border-box;background:#1a1214;color:#ffd27a;border:1px solid #6a4a3a;border-radius:6px;font:14px ui-monospace,monospace;padding:6px}.zt-fehl{color:#ff9a6a}" +
    ".zt-vgl{margin:6px auto;border-collapse:collapse}.zt-vgl td,.zt-vgl th{padding:4px 12px;text-align:left}.zt-vgl th{color:#e5b454}";
  document.head.appendChild(st);
})();
