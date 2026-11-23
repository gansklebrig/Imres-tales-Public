/* =====================================================================
   FRIEDRICHS WALDBUCH – Mehr: Fundbuch, Ausflug, Sammelalbum, Abzeichen,
   Meisterprüfung der Doppelgänger, „Mit allen Sinnen“, Tierstimmen,
   Eselsbrücken und „Heute im Wald“.
   ---------------------------------------------------------------------
   Nutzt window.WB (waldbuch.js). Eigene Fotos liegen nur auf diesem Gerät
   (IndexedDB „waldbuch-fotos“), alles andere im localStorage-Stand.
   Seiten: #/fundbuch · #/ausflug · #/album
   ===================================================================== */
(function () {
  "use strict";
  const W = window.WB; if (!W) return;
  const { ART, ARTEN, KAPITEL, MONATE, esc, toast } = W;
  const S = W.STAND;
  const $ = s => document.querySelector(s);
  const MERK = window.WB_MERK || {}, UNT = window.WB_UNTERSCHIED || {};
  const heute = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const tagVon = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const datumText = t => new Date(t).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const KAPNAME = {}; KAPITEL.forEach(k => KAPNAME[k.k] = k);
  const giftig = a => a.ess === "giftig" || a.ess === "toedlich";
  const essbar = a => a.ess === "essbar" || a.ess === "bedingt";
  const paarKey = (a, b) => [a.id || a, b.id || b].sort().join("|");
  const mischen = l => { const x = l.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  const zufallSeed = seed => { let s = 0; for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  S.funde = S.funde || {}; S.log = S.log || {}; S.paare = S.paare || {}; S.ausfluege = S.ausfluege || [];
  S.selten = S.selten || {}; S.ziele = S.ziele || {}; S.abzeichen = S.abzeichen || {}; S.stimmenRichtig = S.stimmenRichtig || 0;

  /* ---------- Tagesbuch (für „Heute im Wald“ und Serien) ---------- */
  function log(art, ok) {
    const d = heute(), L = S.log[d] || (S.log[d] = { k: 0, r: 0, f: 0 });
    if (art === "karte") { L.k++; if (ok) L.r++; }
    if (art === "fund") L.f++;
    const tage = Object.keys(S.log).sort(); if (tage.length > 120) tage.slice(0, tage.length - 120).forEach(t => delete S.log[t]);
    W.speichern();
  }
  function serieTage() {
    let n = 0; const d = new Date();
    if (!S.log[heute()]) d.setDate(d.getDate() - 1); /* heute noch nichts – die Serie von gestern zählt noch */
    for (;;) { const k = tagVon(d); if (S.log[k] && (S.log[k].k || S.log[k].f)) { n++; d.setDate(d.getDate() - 1); } else break; }
    return n;
  }

  /* ---------- Eigene Fotos (IndexedDB) ---------- */
  const DB = (() => {
    let p = null;
    const auf = () => p || (p = new Promise((ok, nein) => {
      if (!("indexedDB" in window)) return nein(new Error("kein IndexedDB"));
      const r = indexedDB.open("waldbuch-fotos", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("fotos");
      r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error);
    }));
    const tun = (modus, f) => auf().then(db => new Promise((ok, nein) => { const tx = db.transaction("fotos", modus); const st = tx.objectStore("fotos"); const r = f(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => nein(tx.error); }));
    return {
      setz: (k, blob) => tun("readwrite", st => st.put(blob, k)),
      hol: k => tun("readonly", st => st.get(k)),
      weg: k => tun("readwrite", st => st.delete(k)),
      alle: () => tun("readonly", st => st.getAllKeys())
    };
  })();
  const urlCache = {};
  async function fotoUrl(k) {
    if (urlCache[k]) return urlCache[k];
    try { const b = await DB.hol(k); if (!b) return null; return (urlCache[k] = URL.createObjectURL(b)); } catch (e) { return null; }
  }
  async function verkleinern(datei, max) {
    let bild;
    try { bild = await createImageBitmap(datei, { imageOrientation: "from-image" }); }
    catch (e) { bild = await new Promise((ok, nein) => { const i = new Image(); i.onload = () => ok(i); i.onerror = nein; i.src = URL.createObjectURL(datei); }); }
    const w = bild.width, h = bild.height, f = Math.min(1, max / Math.max(w, h));
    const c = document.createElement("canvas"); c.width = Math.round(w * f); c.height = Math.round(h * f);
    c.getContext("2d").drawImage(bild, 0, 0, c.width, c.height);
    return new Promise(ok => c.toBlob(ok, "image/jpeg", .82));
  }
  /* Fotos in einem Container nachladen: <img data-foto="key"> */
  function fotosEinsetzen(box) {
    (box || document).querySelectorAll("img[data-foto]").forEach(async img => { const u = await fotoUrl(img.dataset.foto); if (u) img.src = u; else img.closest(".eigen-foto") && img.closest(".eigen-foto").classList.add("leer"); });
  }

  /* ---------- Funde ---------- */
  const funde = id => S.funde[id] || [];
  const alleFunde = () => { const l = []; for (const id in S.funde) for (const f of S.funde[id]) if (ART[id]) l.push(Object.assign({ id }, f)); return l.sort((a, b) => b.t - a.t); };
  const draussen = id => funde(id).length > 0;
  const gelernt = id => (S.kiste[id] || 0) >= 3;
  function fundMarke(a) {
    const f = funde(a.id);
    if (f.length) return '<span class="gefunden eigen" title="Selbst draußen gefunden">' + (f.some(x => x.foto) ? "📷" : "✓") + "</span>";
    return S.gefunden[a.id] ? '<span class="gefunden" title="Mit Rex erschnüffelt">✓</span>' : "";
  }
  function fundSpeichern(id, daten, blob) {
    const f = { t: daten.t || Date.now(), ort: (daten.ort || "").slice(0, 80), notiz: (daten.notiz || "").slice(0, 400) };
    if (daten.lat != null) { f.lat = daten.lat; f.lon = daten.lon; }
    if (daten.ausflug) f.ausflug = daten.ausflug;
    const k = id + "-" + f.t;
    const fertig = () => { (S.funde[id] = S.funde[id] || []).push(f); log("fund"); W.speichern(); pruefeAbzeichen(); return f; };
    if (!blob) return Promise.resolve(fertig());
    return DB.setz(k, blob).then(() => { f.foto = k; return fertig(); }).catch(() => { toast("Foto konnte nicht gespeichert werden – Fund ohne Foto eingetragen."); return fertig(); });
  }
  function fundLoeschen(id, t) {
    const l = funde(id), i = l.findIndex(f => f.t === t); if (i < 0) return;
    if (l[i].foto) DB.weg(l[i].foto).catch(() => {});
    l.splice(i, 1); if (!l.length) delete S.funde[id];
    W.speichern();
  }

  /* Dialog: Fund eintragen (Foto, Datum, Ort, Notiz) */
  function fundDialog(id, vorgabe, fertig) {
    const a = ART[id]; if (!a) return;
    vorgabe = vorgabe || {};
    const d = document.createElement("div"); d.className = "lupe fund-dialog"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Fund eintragen");
    const jetzt = new Date(); const dat = jetzt.getFullYear() + "-" + String(jetzt.getMonth() + 1).padStart(2, "0") + "-" + String(jetzt.getDate()).padStart(2, "0");
    d.innerHTML = '<form class="fund-blatt"><h2 class="hand">' + esc(a.de) + ' gefunden!</h2><p class="leise">Klebe deinen Fund ins Buch. Das Foto bleibt nur auf diesem Gerät.</p>' +
      '<label class="foto-wahl"><input type="file" accept="image/*" capture="environment" hidden><span class="foto-vorschau">' + (W.hauptbild(id) ? '<img src="' + W.hauptbild(id) + '" alt="" class="platzhalter">' : "") + '<b>📷 Foto machen oder wählen</b></span></label>' +
      '<div class="fund-felder"><label>Wann?<input type="date" name="datum" value="' + dat + '" max="' + dat + '"></label>' +
      '<label>Wo? <span class="leise">(z. B. „Isarauen bei Pullach“)</span><input type="text" name="ort" maxlength="80" value="' + esc(vorgabe.ort || "") + '" placeholder="Ort, Weg, Wald …"></label>' +
      '<button type="button" class="knopf klein hell" id="fund-gps">📍 Standort grob merken</button><span class="leise" id="fund-gps-text"></span>' +
      '<label>Notiz<textarea name="notiz" maxlength="400" placeholder="Wie es roch, wie viele es waren, wer dabei war …"></textarea></label></div>' +
      '<div class="reihe"><button class="knopf" type="submit">✓ Ins Fundbuch kleben</button><button class="knopf hell" type="button" data-zu>Abbrechen</button></div></form>';
    let blob = null, gps = null;
    const zu = () => { d.remove(); document.removeEventListener("keydown", taste); };
    const taste = e => { if (e.key === "Escape") zu(); };
    document.addEventListener("keydown", taste);
    d.addEventListener("click", e => { if (e.target === d || e.target.hasAttribute("data-zu")) zu(); });
    const inp = d.querySelector("input[type=file]");
    inp.addEventListener("change", async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const v = d.querySelector(".foto-vorschau"); v.classList.add("laedt");
      try { blob = await verkleinern(f, 1600); v.innerHTML = '<img src="' + URL.createObjectURL(blob) + '" alt="Dein Foto"><b>📷 anderes Foto</b>'; v.classList.add("hat"); }
      catch (e) { toast("Das Foto ließ sich nicht lesen."); }
      v.classList.remove("laedt");
    });
    d.querySelector("#fund-gps").addEventListener("click", () => {
      const t = d.querySelector("#fund-gps-text");
      if (!navigator.geolocation) { t.textContent = "Dein Gerät kann keinen Standort liefern."; return; }
      t.textContent = "Suche …";
      navigator.geolocation.getCurrentPosition(p => { gps = { lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 }; t.textContent = "Gemerkt (auf etwa 1 km gerundet)."; }, () => { t.textContent = "Kein Standort – macht nichts."; }, { timeout: 12000, maximumAge: 600000 });
    });
    d.querySelector("form").addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.target), datum = fd.get("datum");
      let t = Date.now(); if (datum && datum !== dat) { const x = new Date(datum + "T12:00:00"); if (!isNaN(x)) t = x.getTime(); }
      const neu = !draussen(id);
      await fundSpeichern(id, { t, ort: fd.get("ort"), notiz: fd.get("notiz"), lat: gps && gps.lat, lon: gps && gps.lon, ausflug: vorgabe.ausflug }, blob);
      zu();
      stempel(neu ? "Neu im Fundbuch!" : "Wieder gefunden!", a.de);
      if (fertig) fertig();
    });
    document.body.appendChild(d);
    setTimeout(() => d.querySelector(".foto-wahl b").focus && d.querySelector("input[name=ort]").focus(), 50);
  }
  /* großer Stempel quer übers Bild */
  function stempel(oben, unten) {
    const s = document.createElement("div"); s.className = "stempel-gross"; s.setAttribute("aria-live", "polite");
    s.innerHTML = "<span>" + esc(oben) + "</span><b>" + esc(unten) + "</b>";
    document.body.appendChild(s); setTimeout(() => s.remove(), 2200);
    if (S.ton) W.Ton.kurz("e_vogel_" + (1 + Math.floor(Math.random() * 8)), .5);
  }

  /* ---------- Eselsbrücke & Unterschied ---------- */
  function merkHtml(a, klein) {
    const m = MERK[a.id]; if (!m) return "";
    return klein ? '<p class="merk-klein"><b>Eselsbrücke:</b> ' + esc(m) + "</p>" : '<div class="eselsbruecke"><span class="eb-titel">Friedrichs Eselsbrücke</span>' + esc(m) + "</div>";
  }
  function unterschiedePaare(a) {
    return (a.v || "").split(",").map(x => x.trim()).filter(v => ART[v] && UNT[paarKey(a.id, v)]).map(v => ART[v]);
  }
  function unterschiedHtml(a, b) {
    const p = UNT[paarKey(a, b)]; if (!p) return "";
    const gefahr = giftig(a) || giftig(b);
    return '<div class="unterschied' + (a.ess === "toedlich" || b.ess === "toedlich" ? " tod" : "") + '"><div class="u-kopf"><span class="u-paar">' + W.bildHtml(a.id, "mini") + '<b>' + esc(a.de) + "</b></span><span class=\"u-oder\">oder</span><span class=\"u-paar\">" + W.bildHtml(b.id, "mini") + "<b>" + esc(b.de) + '</b></span></div><p class="u-frage">' + (gefahr ? "☠ " : "") + "Woran erkenne ich den Unterschied?</p><ol>" + p.map(x => "<li>" + esc(x) + "</li>").join("") + '</ol><p class="leise u-fuss">Auch nur ein Zweifel? Dann stehen lassen.</p></div>';
  }

  /* ---------- Artseite ergänzen ---------- */
  function art(a) {
    const oben = $("#mehr-oben"), fundBox = $("#mehr-fund"), unt = $("#mehr-unterschied");
    if (oben) oben.innerHTML = merkHtml(a);
    if (unt) {
      const paare = unterschiedePaare(a);
      unt.innerHTML = paare.length ? '<h3 class="hand">' + (giftig(a) ? "Nicht verwechseln – so unterscheidest du sie" : "Woran erkenne ich den Unterschied?") + "</h3>" + paare.map(b => unterschiedHtml(a, b)).join("") : "";
    }
    if (fundBox) zeichneFundBox(a, fundBox);
  }
  function zeichneFundBox(a, box) {
    const l = funde(a.id).slice().sort((x, y) => y.t - x.t);
    const tier = a.kap === "tier";
    box.innerHTML = '<div class="fundbox"><div class="fb-kopf"><b class="hand">Mein Fundbuch</b>' + (l.length ? '<span class="leise">' + l.length + "× gefunden</span>" : "") + "</div>" +
      (l.length ? '<div class="eigen-fotos">' + l.map(f => '<figure class="eigen-foto' + (f.foto ? "" : " ohne") + '">' + (f.foto ? '<img data-foto="' + esc(f.foto) + '" alt="Dein Foto von ' + esc(a.de) + '">' : '<span class="nur-haken">✓</span>') + "<figcaption>" + esc(datumText(f.t)) + (f.ort ? "<br>" + esc(f.ort) : "") + (f.notiz ? "<br><i>" + esc(f.notiz) + "</i>" : "") + '<button class="fb-weg" data-t="' + f.t + '" aria-label="Fund löschen" title="Fund löschen">✕</button></figcaption></figure>').join("") + "</div>"
        : '<p class="leise">' + (tier ? "Ein Trittsiegel, Losung oder das Tier selbst gesehen?" : "Draußen entdeckt?") + " Kleb es hier ein – mit Foto, Datum und Ort.</p>") +
      '<button class="knopf" id="fund-neu">📷 ' + (l.length ? "Wieder gefunden" : "Gefunden! Eintragen") + "</button></div>";
    fotosEinsetzen(box);
    box.querySelector("#fund-neu").addEventListener("click", () => fundDialog(a.id, {}, () => zeichneFundBox(a, box)));
    box.querySelectorAll(".fb-weg").forEach(b => b.addEventListener("click", () => { if (confirm("Diesen Fund wirklich aus dem Fundbuch nehmen?")) { fundLoeschen(a.id, +b.dataset.t); zeichneFundBox(a, box); } }));
    box.querySelectorAll(".eigen-foto img").forEach(img => img.addEventListener("click", () => fotoGross(img.src, a.de)));
  }
  function fotoGross(src, titel) {
    if (!src || src.endsWith("/")) return;
    W.bildLupe([{ src, titel, asp: "Dein eigenes Foto" }], 0);
  }

  /* ---------- Fundbuch-Seite ---------- */
  function fundbuchSeite() {
    const l = alleFunde(), arten = Object.keys(S.funde).filter(id => ART[id]).length, fotos = l.filter(f => f.foto).length;
    const tage = {}; l.forEach(f => (tage[tagVon(f.t)] = tage[tagVon(f.t)] || []).push(f));
    W.seite('<h2 class="hand">Mein Fundbuch</h2><div class="notiz">Das hier ist dein Teil des Buches. Alles, was du draußen findest, klebst du hier ein – mit Foto, Ort und ein paar Worten. In ein paar Jahren blätterst du darin und weißt noch genau, wo die Morcheln standen.<span class="unterschrift">– Friedrich</span></div>' +
      '<div class="zahlen"><span><b>' + l.length + "</b>Funde</span><span><b>" + arten + "</b>von " + ARTEN.length + " Arten</span><span><b>" + fotos + "</b>eigene Fotos</span><span><b>" + S.ausfluege.length + "</b>Ausflüge</span></div>" +
      '<div class="neu-fund"><label for="fund-suche" class="hand">Neuen Fund eintragen:</label><div class="fund-suche-zeile"><input id="fund-suche" type="search" list="fund-arten" placeholder="Name eintippen, z. B. Bärlauch" autocomplete="off"><datalist id="fund-arten">' + ARTEN.map(a => '<option value="' + esc(a.de) + '">').join("") + '</datalist><button class="knopf" id="fund-los">📷 Eintragen</button></div><p class="leise">Du weißt nicht, was es ist? <a href="#/bestimmen">Erst bestimmen →</a></p></div>' +
      (l.length ? Object.keys(tage).sort().reverse().map(t => '<h3 class="hand">' + esc(datumText(tage[t][0].t)) + '</h3><div class="fund-reihe">' + tage[t].map(f => { const a = ART[f.id]; return '<a class="fund-karte" href="#/art/' + f.id + '"><div class="bild">' + (f.foto ? '<span class="eigen-foto"><img data-foto="' + esc(f.foto) + '" alt=""></span>' : W.bildHtml(f.id)) + '</div><div class="name">' + esc(a.de) + "</div>" + (f.ort ? '<div class="ort">📍 ' + esc(f.ort) + "</div>" : "") + (f.notiz ? '<div class="notizchen">' + esc(f.notiz) + "</div>" : "") + "</a>"; }).join("") + "</div>").join("")
        : '<p class="leise" style="margin-top:1.4rem">Noch leer. Nimm das Buch auf deinen nächsten Spaziergang mit – oder starte einen <a href="#/ausflug">Ausflug</a>.</p>') +
      '<h3 class="hand">Sichern & umziehen</h3><p class="leise">Deine Fotos liegen nur auf diesem Gerät. Mit einer Sicherung nimmst du das Fundbuch auf ein neues Handy mit.</p><div class="reihe"><button class="knopf hell klein" id="fb-export">💾 Fundbuch sichern</button><label class="knopf hell klein">📂 Sicherung einlesen<input type="file" accept="application/json,.json" id="fb-import" hidden></label></div>');
    fotosEinsetzen($("#seite"));
    const los = () => { const v = $("#fund-suche").value.trim().toLowerCase(); const a = ARTEN.find(x => x.de.toLowerCase() === v) || ARTEN.find(x => x.de.toLowerCase().includes(v) && v.length > 2); if (!a) { toast("Diese Art steht nicht im Buch."); return; } fundDialog(a.id, {}, fundbuchSeite); };
    $("#fund-los").addEventListener("click", los);
    $("#fund-suche").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); los(); } });
    $("#fb-export").addEventListener("click", exportieren);
    $("#fb-import").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (f) importieren(f); });
  }
  async function exportieren() {
    toast("Sicherung wird gepackt …");
    const fotos = {};
    for (const f of alleFunde()) if (f.foto) { try { const b = await DB.hol(f.foto); if (b) fotos[f.foto] = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); }); } catch (e) { /* egal */ } }
    const daten = { waldbuch: 1, zeit: Date.now(), stand: { funde: S.funde, ausfluege: S.ausfluege, kiste: S.kiste, paare: S.paare, selten: S.selten, ziele: S.ziele, punkte: S.punkte, expeditionen: S.expeditionen, gefunden: S.gefunden, abzeichen: S.abzeichen, log: S.log, stimmenRichtig: S.stimmenRichtig }, fotos };
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(daten)], { type: "application/json" })); a.download = "waldbuch-fundbuch-" + heute() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  }
  async function importieren(datei) {
    try {
      const d = JSON.parse(await datei.text()); if (!d || !d.waldbuch || !d.stand) throw 0;
      const st = d.stand;
      for (const id in st.funde || {}) { const da = new Set(funde(id).map(f => f.t)); for (const f of st.funde[id]) if (!da.has(f.t)) (S.funde[id] = S.funde[id] || []).push(f); }
      for (const k in d.fotos || {}) { const b = await (await fetch(d.fotos[k])).blob(); await DB.setz(k, b); }
      ["kiste", "paare", "selten", "ziele", "gefunden", "abzeichen", "log"].forEach(k => { S[k] = Object.assign({}, st[k] || {}, S[k] || {}); });
      for (const id in st.kiste || {}) S.kiste[id] = Math.max(S.kiste[id] || 0, st.kiste[id]);
      S.punkte = Math.max(S.punkte || 0, st.punkte || 0); S.expeditionen = Math.max(S.expeditionen || 0, st.expeditionen || 0); S.stimmenRichtig = Math.max(S.stimmenRichtig || 0, st.stimmenRichtig || 0);
      const zeiten = new Set(S.ausfluege.map(x => x.t)); (st.ausfluege || []).forEach(x => { if (!zeiten.has(x.t)) S.ausfluege.push(x); });
      W.speichern(); toast("Sicherung eingelesen!"); fundbuchSeite();
    } catch (e) { toast("Diese Datei ist keine Waldbuch-Sicherung."); }
  }

  /* ---------- Ausflug ---------- */
  const RAEUME = [
    { k: "laubwald", name: "Laub- & Mischwald", em: "🌳", tags: ["o:laubwald", "o:mischwald", "o:buche", "o:buchenwald", "o:eiche", "o:schatten", "o:laub", "o:esche"] },
    { k: "nadelwald", name: "Nadelwald", em: "🌲", tags: ["o:nadelwald", "o:fichte", "o:kiefer", "o:sauer", "o:moos"] },
    { k: "waldrand", name: "Waldrand, Hecke & Lichtung", em: "🌿", tags: ["o:waldrand", "o:hecke", "o:lichtung", "o:kahlschlag", "o:holunder"] },
    { k: "wiese", name: "Wiese, Feldweg & Acker", em: "🌼", tags: ["o:wiese", "o:weg", "o:acker", "o:brache", "o:boeschung", "o:bahndamm", "o:weide", "o:trocken"] },
    { k: "wasser", name: "Bach, Fluss & Auwald", em: "💧", tags: ["o:auwald", "o:wasser", "o:feucht", "o:fluss", "o:bach", "o:quelle", "o:graben", "o:kies"] },
    { k: "berg", name: "Berge & Almen", em: "⛰", tags: ["o:berg", "o:alm", "o:fels", "o:kalk", "o:schlucht", "o:baumgrenze"] },
    { k: "moor", name: "Moor & Heide", em: "🪵", tags: ["o:moor", "o:heide", "o:birke", "o:sand"] },
    { k: "stadt", name: "Park, Garten & Dorf", em: "🏡", tags: ["o:stadt", "o:garten", "o:dorf", "o:park", "o:friedhof", "o:mauer", "o:biergarten"] }
  ];
  const tagsVon = a => (a.tags || "").split(/\s+/);
  function jetztSichtbar(a, m) {
    if (a.kap === "pilz") return a.fr.includes(m);
    if (a.kap === "tier" || a.kap === "baum" || a.kap === "farn") return true;
    if (a.kap === "strauch") return true;
    return a.bl.includes(m) || a.fr.includes(m) || a.er.includes(m);
  }
  function hinweis(a, m) {
    if (a.kap === "tier") return a.spur ? "Spur, Losung oder Fraßspuren suchen" : "Augen und Ohren offen halten";
    if (a.kap === "pilz") return "Fruchtkörper erscheinen jetzt";
    const b = a.bl.includes(m), f = a.fr.includes(m), e = a.er.includes(m) && essbar(a);
    if (b) return "blüht gerade";
    if (f) return giftig(a) ? "trägt jetzt Früchte – nicht naschen!" : "trägt jetzt Früchte";
    if (e) return "Sammelzeit – nur sicher Bestimmtes";
    if ([12, 1, 2].includes(m) && (a.kap === "baum" || a.kap === "strauch")) return "im Winter an Rinde und Knospen erkennen";
    return a.kap === "baum" || a.kap === "strauch" ? "an Blatt und Rinde erkennen" : "an den Blättern erkennen";
  }
  function poolRaum(r, m) { return ARTEN.filter(a => tagsVon(a).some(t => r.tags.includes(t)) && jetztSichtbar(a, m)); }
  function listeBauen(r, m) {
    const pool = mischen(poolRaum(r, m));
    const jetzt = a => a.kap === "pilz" || a.bl.includes(m) || a.fr.includes(m);
    pool.sort((x, y) => (jetzt(y) - jetzt(x)) || (draussen(x.id) - draussen(y.id)));
    const kontingent = { baum: 3, strauch: 2, beere: 2, kraut: 3, blume: 2, farn: 1, pilz: 2, tier: 2 }, n = {}, aus = [];
    for (const a of pool) { if (aus.length >= 12) break; if ((n[a.kap] || 0) < kontingent[a.kap]) { n[a.kap] = (n[a.kap] || 0) + 1; aus.push(a.id); } }
    for (const a of pool) { if (aus.length >= 12) break; if (!aus.includes(a.id)) aus.push(a.id); }
    return aus;
  }
  let ausflugRaum = null, ausflugMonat = W.heuteMonat;
  function ausflugSeite() {
    const A = S.ausflug;
    if (A && A.liste) return ausflugLaeuft();
    W.seite('<h2 class="hand">Auf einen Ausflug</h2><div class="notiz">Sag mir, wohin du gehst, und ich schreibe dir einen Zettel: zwölf Dinge, die du dort jetzt finden kannst. Hak ab, was du siehst. Was du nicht findest, findest du beim nächsten Mal.<span class="unterschrift">– Friedrich</span></div>' +
      '<p class="hand" style="font-size:1.4rem;margin:.6rem 0 .2rem">Wann?</p><div class="chips jetzt-monate" role="group" aria-label="Monat">' + MONATE.map((n, i) => '<button class="chip" data-m="' + (i + 1) + '" aria-pressed="' + (i + 1 === ausflugMonat) + '">' + n.slice(0, 3) + "</button>").join("") + "</div>" +
      '<p class="hand" style="font-size:1.4rem;margin:.6rem 0 .2rem">Wohin?</p><div class="raeume">' + RAEUME.map(r => { const n = poolRaum(r, ausflugMonat).length; return '<button class="raum" data-r="' + r.k + '"' + (n < 6 ? " disabled" : "") + '><span class="raum-em">' + r.em + "</span><b>" + esc(r.name) + '</b><span class="leise">' + n + " Arten jetzt möglich</span></button>"; }).join("") + "</div>" +
      (S.ausfluege.length ? '<h3 class="hand">Frühere Ausflüge</h3><ul class="ausflug-liste">' + S.ausfluege.slice(-8).reverse().map(x => { const r = RAEUME.find(y => y.k === x.r) || { name: x.r, em: "🥾" }; return "<li>" + r.em + " <b>" + esc(r.name) + "</b> · " + esc(datumText(x.t)) + " · " + x.ids.length + " von " + x.liste.length + " gefunden</li>"; }).join("") + "</ul>" : ""));
    $("#seite").querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { ausflugMonat = +b.dataset.m; ausflugSeite(); }));
    $("#seite").querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => {
      const r = RAEUME.find(x => x.k === b.dataset.r);
      S.ausflug = { r: r.k, m: ausflugMonat, t: Date.now(), liste: listeBauen(r, ausflugMonat), ids: [] }; W.speichern();
      if (S.ton) W.Ton.kurz("e_schnueffeln_1", .6);
      ausflugLaeuft();
    }));
  }
  function ausflugLaeuft() {
    const A = S.ausflug, r = RAEUME.find(x => x.k === A.r), m = A.m;
    const erledigt = A.ids.length, gesamt = A.liste.length, pz = Math.round(erledigt / gesamt * 100);
    const mehr = poolRaum(r, m).filter(a => !A.liste.includes(a.id));
    const zeile = id => { const a = ART[id], ok = A.ids.includes(id); return '<li class="zettel-zeile' + (ok ? " ok" : "") + '"><button class="haken" data-h="' + id + '" aria-pressed="' + ok + '" aria-label="' + esc(a.de) + (ok ? " gefunden" : " abhaken") + '">' + (ok ? "✓" : "") + '</button><a class="z-bild" href="#/art/' + id + '">' + W.bildHtml(id, "mini") + '</a><div class="z-text"><a href="#/art/' + id + '" class="z-name">' + esc(a.de) + '</a><span class="z-hinweis">' + esc(hinweis(a, m)) + (giftig(a) ? ' <span class="ess-schild ' + a.ess + '" style="font-size:.66rem">' + (a.ess === "toedlich" ? "tödlich" : "giftig") + "</span>" : "") + '</span>' + (MERK[id] ? '<details><summary>Woran erkenne ich es?</summary>' + esc(MERK[id]) + "</details>" : "") + '</div><button class="foto-knopf" data-f="' + id + '" aria-label="Foto machen">📷</button></li>'; };
    W.seite('<div class="ausflug-kopf"><div><p class="leise" style="margin:0">' + r.em + " Ausflug · " + MONATE[m - 1] + '</p><h2 class="hand" style="margin:.1rem 0">' + esc(r.name) + '</h2></div><div class="ring" style="--p:' + pz + '"><b>' + erledigt + "</b>/" + gesamt + "</div></div>" +
      '<p class="leise">Hak ab, was du siehst – mit 📷 klebst du gleich ein Foto ins Fundbuch. Läuft auch ohne Netz, wenn du das Buch <a href="#/offline">offline mitgenommen</a> hast.</p>' +
      '<ul class="zettel">' + A.liste.map(zeile).join("") + "</ul>" +
      (mehr.length ? '<details class="mehr-arten"><summary class="hand">Noch ' + mehr.length + " Arten, die hier jetzt vorkommen</summary><ul class=\"zettel\">" + mehr.map(a => zeile(a.id)).join("") + "</ul></details>" : "") +
      '<div class="reihe"><button class="knopf" id="ausflug-ende">🏁 Ausflug beenden</button><button class="knopf hell klein" id="ausflug-neu">Anderen Zettel schreiben</button></div>');
    const s = $("#seite");
    s.querySelectorAll("[data-h]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.h, i = A.ids.indexOf(id);
      if (i >= 0) { A.ids.splice(i, 1); const l = funde(id), j = l.findIndex(f => f.ausflug === A.t && !f.foto); if (j >= 0) fundLoeschen(id, l[j].t); W.speichern(); ausflugLaeuft(); return; }
      if (!A.liste.includes(id)) A.liste.push(id);
      A.ids.push(id); fundSpeichern(id, { ort: r.name, ausflug: A.t }); W.speichern();
      if (S.ton) W.Ton.kurz("e_vogel_" + (1 + Math.floor(Math.random() * 8)), .45);
      ausflugLaeuft();
      if (A.ids.length === A.liste.length) stempel("Zettel voll!", "Alles gefunden");
    }));
    s.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => {
      const id = b.dataset.f;
      fundDialog(id, { ort: r.name, ausflug: A.t }, () => { if (!A.ids.includes(id)) A.ids.push(id); if (!A.liste.includes(id)) A.liste.push(id); W.speichern(); ausflugLaeuft(); });
    }));
    s.querySelector("#ausflug-ende").addEventListener("click", ausflugEnde);
    s.querySelector("#ausflug-neu").addEventListener("click", () => { if (!A.ids.length || confirm("Den Zettel wegwerfen? Deine Funde bleiben im Fundbuch.")) { delete S.ausflug; W.speichern(); ausflugSeite(); } });
  }
  function ausflugEnde() {
    const A = S.ausflug; if (!A) return;
    const r = RAEUME.find(x => x.k === A.r);
    S.ausfluege.push({ r: A.r, m: A.m, t: A.t, ende: Date.now(), liste: A.liste.slice(0, 40), ids: A.ids.slice() });
    delete S.ausflug; W.speichern(); pruefeAbzeichen();
    const n = A.ids.length, g = A.liste.length;
    const lob = n === 0 ? "Heute hat sich der Wald versteckt. Das passiert. Morgen ist er wieder da." : n >= g ? "Alles gefunden! Ich schreibe dir einen schwereren Zettel." : n >= g / 2 ? "Mehr als die Hälfte – du hast gute Augen." : "Ein guter Anfang. Jede Art, die du einmal gefunden hast, findest du wieder.";
    W.seite('<h2 class="hand">Zurück vom Ausflug</h2><div class="ring gross" style="--p:' + Math.round(n / g * 100) + '"><b>' + n + "</b>/" + g + '</div><div class="notiz">' + esc(lob) + '<span class="unterschrift">– Friedrich</span></div>' +
      (n ? '<h3 class="hand">Gefunden in ' + esc(r.name) + '</h3><div class="verw">' + A.ids.map(id => '<a href="#/art/' + id + '">' + W.bildHtml(id, "mini") + esc(ART[id].de) + "</a>").join("") + "</div>" : "") +
      '<div class="reihe"><a class="knopf" href="#/fundbuch">📷 Zum Fundbuch</a><a class="knopf hell" href="#/album">📒 Sammelalbum</a><a class="knopf hell" href="#/ausflug">🥾 Neuer Ausflug</a></div>');
  }

  /* ---------- Sammelalbum & Abzeichen ---------- */
  const KAP_ABZ = { baum: ["🌳", "Baumflüsterer"], strauch: ["🌿", "Heckenkenner"], beere: ["🫐", "Beerenkönig"], kraut: ["🌱", "Kräuterkundig"], blume: ["🌸", "Blumenfreund"], farn: ["🍃", "Moosmeister"], pilz: ["🍄", "Pilzkenner"], tier: ["🐾", "Spurenleser"] };
  function gefahrPaare() {
    const out = [], g = new Set();
    for (const a of ARTEN) for (const v of (a.v || "").split(",").map(x => x.trim()).filter(x => ART[x])) {
      const b = ART[v], k = paarKey(a, b); if (g.has(k)) continue; g.add(k);
      if ((giftig(a) || giftig(b)) && (essbar(a) || essbar(b))) out.push({ k, a: essbar(a) ? a : b, b: essbar(a) ? b : a, tod: a.ess === "toedlich" || b.ess === "toedlich" });
    }
    return out.sort((x, y) => (y.tod - x.tod));
  }
  function abzeichenListe() {
    const fundArten = Object.keys(S.funde).filter(id => ART[id]).length, fundFotos = alleFunde().filter(f => f.foto).length;
    const paare = gefahrPaare(), gemeistert = paare.filter(p => S.paare[p.k] && S.paare[p.k].m).length;
    const jz = new Set(S.ausfluege.map(x => ({ 12: "w", 1: "w", 2: "w", 3: "f", 4: "f", 5: "f", 6: "s", 7: "s", 8: "s", 9: "h", 10: "h", 11: "h" })[x.m]));
    const l = [
      ["erster", "🌱", "Erster Fund", "Den ersten Fund ins Buch geklebt.", fundArten >= 1, Math.min(1, fundArten)],
      ["fotograf", "📷", "Fotograf", "10 Funde mit eigenem Foto.", fundFotos >= 10, fundFotos / 10],
      ["sammler", "🧺", "Sammler", "25 verschiedene Arten draußen gefunden.", fundArten >= 25, fundArten / 25],
      ["waldlaeufer", "🥾", "Waldläufer", "75 verschiedene Arten draußen gefunden.", fundArten >= 75, fundArten / 75],
      ["ausfluegler", "🗺", "Ausflügler", "5 Ausflüge gemacht.", S.ausfluege.length >= 5, S.ausfluege.length / 5],
      ["jahreszeiten", "🍂", "Vier Jahreszeiten", "In jeder Jahreszeit auf Ausflug gewesen.", jz.size >= 4, jz.size / 4],
      ["pruefling", "🔍", "Prüfling", "Das erste Doppelgänger-Paar gemeistert.", gemeistert >= 1, Math.min(1, gemeistert)],
      ["doppelmeister", "☠", "Doppelgänger-Meister", "Alle " + paare.length + " gefährlichen Paare gemeistert.", gemeistert >= paare.length, gemeistert / paare.length],
      ["dranbleiber", "🔥", "Dranbleiber", "7 Tage hintereinander gelernt oder gefunden.", (S.abzeichen.dranbleiber || serieTage() >= 7), serieTage() / 7],
      ["ohren", "👂", "Ohrenspitzer", "10 Tierstimmen richtig erkannt.", S.stimmenRichtig >= 10, S.stimmenRichtig / 10],
      ["faehrte", "⭐", "Fährtensucher", "Alle seltenen Funde mit Rex entdeckt.", Object.keys(S.selten).length >= SELTEN_ZAHL, Object.keys(S.selten).length / SELTEN_ZAHL]
    ];
    KAPITEL.forEach(k => { const arten = ARTEN.filter(a => a.kap === k.k), n = arten.filter(a => gelernt(a.id) || draussen(a.id)).length; l.push(["kap-" + k.k, KAP_ABZ[k.k][0], KAP_ABZ[k.k][1], "Alle " + arten.length + " Arten aus „" + k.name + "“ gelernt oder gefunden.", n >= arten.length, n / arten.length]); });
    return l;
  }
  function pruefeAbzeichen() {
    const neu = [];
    for (const [id, , name, , ok] of abzeichenListe()) if (ok && !S.abzeichen[id]) { S.abzeichen[id] = Date.now(); neu.push(name); }
    if (neu.length) { W.speichern(); setTimeout(() => stempel("Neues Abzeichen", neu[0]), 600); }
  }
  function albumSeite() {
    const ab = abzeichenListe();
    const stufe = a => draussen(a.id) ? 3 : gelernt(a.id) || S.gefunden[a.id] ? 2 : S.gelesen[a.id] ? 1 : 0;
    const gesamt = { 0: 0, 1: 0, 2: 0, 3: 0 }; ARTEN.forEach(a => gesamt[stufe(a)]++);
    W.seite('<h2 class="hand">Das Sammelalbum</h2><p>Jede Art hat hier einen Platz. Gelesen wird sie blass eingeklebt, gelernt in Farbe – und wer sie draußen selbst gefunden hat, bekommt Friedrichs goldenen Stempel drauf.</p>' +
      '<div class="album-legende"><span><i class="st0"></i>' + gesamt[0] + " unbekannt</span><span><i class=\"st1\"></i>" + gesamt[1] + " gelesen</span><span><i class=\"st2\"></i>" + gesamt[2] + " gelernt</span><span><i class=\"st3\"></i>" + gesamt[3] + " draußen gefunden</span></div>" +
      '<h3 class="hand">Abzeichen <span class="leise">(' + ab.filter(x => x[4]).length + " von " + ab.length + ")</span></h3><div class=\"abzeichen\">" + ab.map(([id, em, name, txt, ok, p]) => '<div class="abz' + (ok ? " ok" : "") + '" title="' + esc(txt) + '"><span class="abz-em">' + em + "</span><b>" + esc(name) + "</b><small>" + esc(txt) + "</small>" + (ok ? "" : '<i class="abz-balken"><i style="width:' + Math.round(Math.min(1, p || 0) * 100) + '%"></i></i>') + "</div>").join("") + "</div>" +
      KAPITEL.map(k => { const arten = ARTEN.filter(a => a.kap === k.k), n3 = arten.filter(a => stufe(a) === 3).length, n2 = arten.filter(a => stufe(a) >= 2).length;
        return '<h3 class="hand" style="color:var(--rinde)">' + esc(k.name) + ' <span class="leise">' + n3 + " gefunden · " + n2 + " von " + arten.length + ' gelernt</span></h3><div class="album-balken" style="--f:' + k.farbe + '"><i class="b2" style="width:' + Math.round(n2 / arten.length * 100) + '%"></i><i class="b3" style="width:' + Math.round(n3 / arten.length * 100) + '%"></i></div><div class="album">' +
          arten.map(a => { const s = stufe(a), f = funde(a.id).find(x => x.foto); return '<a class="slot st' + s + '" href="#/art/' + a.id + '" title="' + esc(a.de) + '">' + (s === 0 ? '<span class="frage">?</span>' : f ? '<span class="eigen-foto"><img data-foto="' + esc(f.foto) + '" alt=""></span>' : W.bildHtml(a.id)) + '<span class="slot-name">' + (s === 0 ? "???" : esc(a.de)) + "</span>" + (s === 3 ? '<span class="gold">★</span>' : "") + "</a>"; }).join("") + "</div>"; }).join(""));
    fotosEinsetzen($("#seite"));
  }

  /* ---------- Meisterprüfung der Doppelgänger ---------- */
  function paarStempel(a, b) { const p = S.paare[paarKey(a, b)]; return p && p.m ? '<span class="stempel-klein" title="Gemeistert">gemeistert</span>' : p && p.s ? '<span class="serie-punkte">' + "●".repeat(p.s) + "○".repeat(3 - p.s) + "</span>" : ""; }
  function paarExtra(a, b) { return unterschiedHtml(a, b); }
  function doppel() {
    const box = $("#mehr-pruefung"); if (!box) return;
    const paare = gefahrPaare().filter(p => W.bilderVon(p.a.id).length && W.bilderVon(p.b.id).length);
    const gm = paare.filter(p => S.paare[p.k] && S.paare[p.k].m).length;
    box.innerHTML = '<div class="pruefung-start"><div><b class="hand" style="font-size:1.7rem;color:var(--beere)">Meisterprüfung</b><p style="margin:.2rem 0">Ein Paar gilt als gemeistert, wenn du es <b>dreimal hintereinander</b> richtig auseinanderhältst – mit wechselnden Fotos. Ein Fehler, und die Serie beginnt von vorn.</p><p class="leise">' + gm + " von " + paare.length + ' Paaren gemeistert</p></div><button class="knopf" id="pruef-los">☠ Prüfung starten</button></div><div id="pruef-feld"></div>';
    box.querySelector("#pruef-los").addEventListener("click", () => { box.querySelector(".pruefung-start").hidden = true; pruefRunde(paare); });
  }
  function pruefRunde(paare) {
    const feld = $("#pruef-feld"); if (!feld) return;
    const offen = paare.filter(p => !(S.paare[p.k] && S.paare[p.k].m));
    const kand = offen.length ? offen : paare;
    const p = kand[Math.floor(Math.random() * Math.min(kand.length, 6))];
    const ziel = Math.random() < .5 ? p.a : p.b, anderes = ziel === p.a ? p.b : p.a;
    const fotos = W.bilderVon(ziel.id).filter(b => b.a !== "spur"), foto = fotos[Math.floor(Math.random() * fotos.length)] || W.bilderVon(ziel.id)[0];
    const st = S.paare[p.k] || { s: 0 };
    const opts = mischen([ziel, anderes]);
    feld.innerHTML = '<div class="karte-lern pruef"><div class="frage">Welches von beiden ist das?</div>' + W.fotoKarussell(ziel.id, false, W.bilderVon(ziel.id).indexOf(foto)) + '<p class="leise" style="text-align:center;margin:.3rem 0">Serie: <span class="serie-punkte">' + "●".repeat(st.s || 0) + "○".repeat(3 - (st.s || 0)) + '</span></p><div class="antworten">' + opts.map((x, i) => '<button data-i="' + i + '">' + esc(x.de) + "</button>").join("") + '</div><div class="erklaerung" id="pruef-erkl"></div></div>';
    let fertig = false;
    feld.querySelectorAll(".antworten button").forEach(b => b.addEventListener("click", () => {
      if (fertig) return; fertig = true;
      const gew = opts[+b.dataset.i], ok = gew === ziel;
      feld.querySelectorAll(".antworten button").forEach((x, j) => x.classList.add(opts[j] === ziel ? "richtig" : opts[j] === gew ? "falsch" : "x"));
      const e = S.paare[p.k] = S.paare[p.k] || { s: 0 };
      if (ok) { e.s = Math.min(3, (e.s || 0) + 1); if (e.s >= 3 && !e.m) e.m = Date.now(); } else { e.s = 0; }
      log("karte", ok); W.speichern(); pruefeAbzeichen();
      if (S.ton) W.Ton.kurz(ok ? "e_vogel_3" : "e_kraehe_2", .5);
      const meister = ok && e.m && e.s === 3 && Date.now() - e.m < 4000;
      if (meister) stempel("Gemeistert!", p.a.de + " / " + p.b.de);
      feld.querySelector("#pruef-erkl").innerHTML = (ok ? '<b class="hand" style="font-size:1.5rem;color:var(--moos)">Richtig!</b> ' : '<b class="hand" style="font-size:1.5rem;color:var(--beere)">Das war ' + esc(ziel.de) + ".</b> Die Serie beginnt von vorn. ") +
        unterschiedHtml(p.a, p.b) + '<div class="reihe"><button class="knopf klein" id="pruef-weiter">Nächstes Bild →</button><button class="knopf klein hell" id="pruef-stopp">Prüfung beenden</button></div>';
      feld.querySelector("#pruef-weiter").addEventListener("click", () => pruefRunde(paare));
      feld.querySelector("#pruef-stopp").addEventListener("click", () => W.route());
    }));
  }

  /* ---------- Fragen: Mit allen Sinnen & Wer ruft da? ---------- */
  const SINN = [
    ["nase", "👃", "Friedrich riecht daran", /\b(riech\w*|duft\w*|geruch\w*|stinkt|stinkend|aroma\w*)\b/i],
    ["hand", "✋", "Friedrich fühlt", /\b(behaart\w*|samtig\w*|klebrig\w*|rau|raue\w*|weich\w*|stachel\w*|brenn\w*|filzig\w*|ledrig\w*|wollig\w*|schleimig\w*|gummi\w*|fühlt\w*|schmierig\w*|zäh\w*)\b/i],
    ["zunge", "👅", "Friedrich kostet (nur bei sicheren Arten!)", /\b(schmeckt|schmecken|geschmack\w*|bitter\w*|scharf\w*|süßlich|säuerlich|sauer|mild\w*|würzig\w*)\b/i],
    ["ohr", "👂", "Friedrich lauscht", /\b(ruf\w*|laut\w*|bellt|bellen|röhr\w*|pfeif\w*|pfiff\w*|trommel\w*|schnauf\w*|knurr\w*|fiep\w*|heul\w*|keckert|keckern|grunz\w*|zirp\w*)\b/i]
  ];
  const sinnCache = {};
  const rxEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /* Kosten nur bei sicher essbaren Arten ohne giftigen Doppelgänger; Fühlen nie bei tödlichen Arten. */
  const kostbar = a => a.ess === "essbar" && a.kap !== "pilz" && !(a.v || "").split(",").some(v => ART[v.trim()] && /giftig|toedlich/.test(ART[v.trim()].ess));
  function sinnHinweise(a) {
    if (sinnCache[a.id]) return sinnCache[a.id];
    const felder = ["b", "r", "blt", "f", "kn", "wu"];
    const namen = [a.de, a.wiss, ...a.de.split(/[\s\-()]+/).filter(w => w.length > 3)].filter(Boolean).sort((x, y) => y.length - x.length);
    const out = [];
    for (const k of felder.concat(kostbar(a) ? ["ku"] : [])) {
      if (!a[k]) continue;
      for (const satz of String(a[k]).split(/(?<=[.!?])\s+/)) {
        if (satz.length < 20 || satz.length > 220) continue;
        for (const [sinn, em, titel, re] of SINN) {
          const m = re.exec(satz); if (!m) continue;
          if (satz.length < (sinn === "ohr" ? 20 : 32)) continue;
          if (sinn === "zunge" && !kostbar(a)) continue;
          if (sinn !== "zunge" && k === "ku") continue;
          if (sinn === "hand" && a.ess === "toedlich") continue;
          if (sinn === "ohr" && a.kap !== "tier") continue;
          let t = satz; namen.forEach(w => { t = t.replace(new RegExp(rxEsc(w), "gi"), "…"); });
          out.push({ sinn, em, titel, text: t, wort: m[1].toLowerCase().slice(0, 5) }); break;
        }
      }
    }
    return (sinnCache[a.id] = out);
  }
  /* Falsche Antworten dürfen nicht dasselbe Sinnesmerkmal beschrieben haben. */
  function sinnFalsche(a, wort) {
    const txt = x => ["b", "r", "blt", "f", "kn", "wu", "ku", "k"].map(k => x[k] || "").join(" ").toLowerCase();
    const gut = W.falsche(a, 12, true).filter(x => !txt(x).includes(wort));
    return gut.slice(0, 3);
  }
  const STIMMEN = {}; let stimmenGeladen = false;
  fetch("pflanzen/stimmen.json").then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { Object.assign(STIMMEN, j || {}); stimmenGeladen = true; if (/^#\/(lernen|art\/)/.test(location.hash)) W.route(); });
  const stimmeVon = id => STIMMEN[id] ? "pflanzen/stimmen/" + STIMMEN[id].f : null;
  function frage(modus, a) {
    if (modus === "sinne") {
      const h = sinnHinweise(a); if (!h.length) return null;
      const x = h[Math.floor(Math.random() * h.length)];
      const fa = sinnFalsche(a, x.wort); if (fa.length < 3) return null;
      const ant = mischen([a].concat(fa));
      return { a, modus, sinn: x.em, frage: x.em + " " + x.titel + ": „" + x.text + "“", antworten: ant, richtig: ant.indexOf(a), erkl: a.de + " – " + a.k };
    }
    if (modus === "stimme") {
      const u = stimmeVon(a.id); if (!u) return null;
      const andere = mischen(ARTEN.filter(x => x.kap === "tier" && x !== a && stimmeVon(x.id))).slice(0, 3);
      if (andere.length < 2) return null;
      const ant = mischen([a].concat(andere));
      return { a, modus, ton: u, frage: "👂 Wer ruft da?", antworten: ant, richtig: ant.indexOf(a), erkl: a.de + ": " + (STIMMEN[a.id].was || "") + ". " + (a.kn || "") };
    }
    return null;
  }
  function poolFilter(modus) {
    if (modus === "sinne") return a => sinnHinweise(a).length > 0;
    if (modus === "stimme") return a => !!stimmeVon(a.id);
    return null;
  }
  function tonKnopf(f) {
    if (!f.ton) return "";
    const s = STIMMEN[f.a.id] || {};
    return '<div class="ton-frage"><button class="ton-play" data-ton="' + esc(f.ton) + '" aria-label="Aufnahme abspielen"><span>▶</span></button><div class="ton-welle" aria-hidden="true">' + Array.from({ length: 24 }, (_, i) => '<i style="--h:' + (20 + Math.round(Math.abs(Math.sin(i * 1.7 + f.a.id.length)) * 70)) + '%"></i>').join("") + '</div></div><p class="leise ton-quelle">Aufnahme: ' + esc(s.autor || "") + (s.lizenz ? ", " + esc(s.lizenz) : "") + (s.quelle ? ' · <a href="' + esc(s.quelle) + '" target="_blank" rel="noopener">Quelle</a>' : "") + "</p>";
  }
  let tonEl = null;
  function tonVerdrahten(box) {
    (box || document).querySelectorAll("[data-ton]").forEach(b => b.addEventListener("click", () => {
      if (tonEl && !tonEl.paused && tonEl.dataset.u === b.dataset.ton) { tonEl.pause(); b.classList.remove("spielt"); return; }
      if (tonEl) tonEl.pause();
      tonEl = new Audio(b.dataset.ton); tonEl.dataset.u = b.dataset.ton; tonEl.volume = .9;
      b.classList.add("spielt"); const w = b.parentNode.querySelector(".ton-welle"); if (w) w.classList.add("an");
      tonEl.addEventListener("ended", () => { b.classList.remove("spielt"); if (w) w.classList.remove("an"); });
      tonEl.play().catch(() => { b.classList.remove("spielt"); toast("Aufnahme lässt sich gerade nicht abspielen."); });
    }));
  }
  function stimmeErkannt(ok) { if (ok) { S.stimmenRichtig = (S.stimmenRichtig || 0) + 1; W.speichern(); pruefeAbzeichen(); } }
  /* Tierseite: Stimme anhören */
  function stimmeHtml(a) {
    const u = stimmeVon(a.id); if (!u) return "";
    const s = STIMMEN[a.id];
    return '<h3 class="hand">So klingt ' + esc(a.de.split(" ").pop()) + '</h3><div class="ton-frage"><button class="ton-play" data-ton="' + esc(u) + '" aria-label="Stimme abspielen"><span>▶</span></button><div class="ton-welle" aria-hidden="true">' + Array.from({ length: 24 }, (_, i) => '<i style="--h:' + (20 + Math.round(Math.abs(Math.sin(i * 1.3 + a.id.length)) * 70)) + '%"></i>').join("") + '</div><span class="ton-was">' + esc(s.was || "") + '</span></div><p class="leise ton-quelle">Aufnahme: ' + esc(s.autor || "") + ", " + esc(s.lizenz || "") + ' · <a href="' + esc(s.quelle || "#") + '" target="_blank" rel="noopener">Wikimedia Commons</a></p>';
  }

  /* ---------- Heute im Wald (Deckblatt) ---------- */
  function deck() {
    const box = $("#mehr-heute"); if (!box) return;
    const m = W.heuteMonat, r = zufallSeed(heute());
    const saison = ARTEN.filter(a => a.kap !== "tier" && W.bilderVon(a.id).length && (a.kap === "pilz" ? a.fr : a.bl.concat(a.fr, a.er)).includes(m));
    const sortiert = saison.map(a => [a, r() + (draussen(a.id) ? 1 : 0)]).sort((x, y) => x[1] - y[1]).map(x => x[0]);
    const drei = sortiert.slice(0, 3);
    const gestern = new Date(); gestern.setDate(gestern.getDate() - 1);
    const H = S.log[heute()] || { k: 0, r: 0, f: 0 }, G = S.log[tagVon(gestern)] || null, serie = serieTage();
    const grund = a => a.kap === "pilz" ? (giftig(a) ? "Giftpilz – kennenlernen!" : "Pilzzeit") : a.bl.includes(m) ? "blüht jetzt" : a.fr.includes(m) ? (giftig(a) ? "giftige Früchte" : "Früchte reif") : "Sammelzeit";
    box.innerHTML = '<div class="heute-wald"><div class="hw-kopf"><h3 class="hand">Heute im Wald</h3><span class="leise">' + new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) + "</span></div>" +
      '<div class="hw-arten">' + drei.map(a => '<a class="hw-art" href="#/art/' + a.id + '">' + W.bildHtml(a.id) + '<span class="hw-grund">' + esc(grund(a)) + '</span><b>' + esc(a.de) + "</b>" + (MERK[a.id] ? "<small>" + esc(MERK[a.id].length > 110 ? MERK[a.id].slice(0, 108).replace(/\s\S*$/, "") + " …" : MERK[a.id]) + "</small>" : "") + "</a>").join("") + "</div>" +
      '<div class="hw-stand"><span>' + (serie ? "🔥 <b>" + serie + "</b> " + (serie === 1 ? "Tag" : "Tage") + " in Folge" : "🔥 Heute eine Serie starten") + "</span><span>Heute: <b>" + H.k + "</b> Karten" + (H.k ? " (" + H.r + " richtig)" : "") + (H.f ? " · <b>" + H.f + "</b> Funde" : "") + "</span>" + (G ? "<span>Gestern: " + G.k + " Karten" + (G.k ? ", " + G.r + " richtig" : "") + (G.f ? ", " + G.f + " Funde" : "") + "</span>" : "") + "</div>" +
      '<div class="reihe" style="margin-bottom:0"><a class="knopf klein" href="#/ausflug">🥾 Ausflug starten</a><a class="knopf klein hell" href="#/lernen">🧠 Fünf Karten lernen</a><a class="knopf klein hell" href="#/album">📒 Sammelalbum</a></div></div>';
  }

  /* ---------- Rex' Spürnase: seltene Funde & Fährtenkarten ---------- */
  const SELTEN = { isar: "fischotter", berg: "edelweiss", bayerwald: "luchs", hecke: "wildbirne", buche: "frauenschuh", moor: "baerlapp" };
  const SELTEN_ZAHL = Object.keys(SELTEN).length;
  const SELTEN_TEXT = {
    fischotter: "Am Ufer, zwischen zwei Steinen: ein nasser Kopf, zwei schwarze Augen – und weg. Ein Fischotter! Den sieht man in Bayern fast nie.",
    edelweiss: "Rex hält an einer Felskante. Da unten, wo man nicht hinkommt: ein Stern aus weißer Wolle. Edelweiß. Nur anschauen.",
    luchs: "Pinselohren im Unterholz. Ein Luchs schaut euch an, ganz ruhig, dann ist er nicht mehr da. Rex zittert vor Aufregung.",
    wildbirne: "Ein dorniger, knorriger Baum mitten in der Hecke, voller winziger Birnchen – eine echte Wildbirne. Davon gibt es nur noch wenige.",
    frauenschuh: "Rex schnüffelt an einem gelben Pantoffel mit braunen Bändern: Frauenschuh! Die prächtigste Orchidee Europas. Wir sagen es niemandem.",
    baerlapp: "Eine grüne Schnur kriecht über das Moos, oben gelbe Keulen: Keulen-Bärlapp, älter als die Dinosaurier und streng geschützt."
  };
  function spielEnde(g, sterne, Z) {
    S.ziele[g.k] = S.ziele[g.k] || [];
    if (Z.ziel && !S.ziele[g.k].includes(Z.ziel.id) && Z.richtig >= Z.stationen / 2) S.ziele[g.k].push(Z.ziel.id);
    let selten = null;
    const id = SELTEN[g.k];
    if (id && ART[id] && sterne === 3 && (!S.selten[g.k] || Math.random() < .25)) { selten = { id, neu: !S.selten[g.k] }; S.selten[g.k] = S.selten[g.k] || Date.now(); S.punkte = (S.punkte || 0) + 40; }
    W.speichern(); pruefeAbzeichen();
    if (!selten) return "";
    const a = ART[id];
    return '<div class="selten-karte"><span class="sk-band">' + (selten.neu ? "✨ Seltener Fund!" : "✨ Wieder entdeckt!") + '</span><div class="sk-bild">' + W.bildHtml(id) + '</div><b class="hand">' + esc(a.de) + "</b><p>" + esc(SELTEN_TEXT[id] || a.k) + '</p><span class="leise">+40 Punkte · ' + Object.keys(S.selten).length + " von " + SELTEN_ZAHL + " seltenen Funden</span></div>";
  }
  function gebietInfo(g) {
    const tiere = ARTEN.filter(a => a.kap === "tier" && a.spur && tagsVon(a).some(t => g.tags.includes(t)));
    const n = (S.ziele[g.k] || []).filter(id => tiere.some(t => t.id === id)).length;
    return '<span class="gebiet-info">🐾 ' + n + "/" + tiere.length + " Fährten" + (S.selten[g.k] ? " · ✨ " + esc(ART[SELTEN[g.k]].de) : " · ✨ ?") + "</span>";
  }
  function faehrtenkarten() {
    const tiere = ARTEN.filter(a => a.kap === "tier" && a.spur);
    const alle = new Set(Object.values(S.ziele).flat());
    return '<h3 class="hand">Fährtenkarten <span class="leise">(' + tiere.filter(t => alle.has(t.id)).length + " von " + tiere.length + ')</span></h3><p class="leise">Jedes Tier, dessen Fährte du bis zum Ende folgst, bekommt eine Karte. Seltene Funde gibt es nur bei drei Sternen.</p><div class="faehrten">' +
      tiere.map(t => alle.has(t.id) ? '<a class="faehrte ok" href="#/art/' + t.id + '"><div class="bild">' + W.bildHtml(t.id) + '</div><div class="spur-mini">' + W.spurSvg(t.spur) + "</div><b>" + esc(t.de) + "</b></a>" : '<div class="faehrte"><div class="bild leer">?</div><div class="spur-mini">' + W.spurSvg(t.spur) + "</div><b>Wessen Spur?</b></div>").join("") + "</div>" +
      '<h3 class="hand">Seltene Funde</h3><div class="faehrten">' + Object.entries(SELTEN).map(([g, id]) => S.selten[g] ? '<a class="faehrte ok gold" href="#/art/' + id + '"><div class="bild">' + W.bildHtml(id) + "</div><b>" + esc(ART[id].de) + "</b></a>" : '<div class="faehrte"><div class="bild leer">✨</div><b>noch verborgen</b></div>').join("") + "</div>";
  }

  /* ---------- Fortschritt beim Lernen ---------- */
  function karteBeantwortet(f, ok) { log("karte", ok); if (f && f.modus === "stimme") stimmeErkannt(ok); pruefeAbzeichen(); }

  window.WB_MEHR = {
    seiten: { fundbuch: fundbuchSeite, ausflug: ausflugSeite, album: albumSeite },
    art, deck, doppel, paarStempel, paarExtra, frage, poolFilter, tonKnopf, tonVerdrahten, stimmeHtml, merkHtml, fundMarke,
    karteBeantwortet, spielEnde, gebietInfo, faehrtenkarten, fundDialog, stimmeVon, sinnHinweise, get stimmenDa() { return Object.keys(STIMMEN).length; }, get stimmenGeladen() { return stimmenGeladen; },
    stimmenUrls: () => Object.values(STIMMEN).map(s => "pflanzen/stimmen/" + s.f)
  };
})();
