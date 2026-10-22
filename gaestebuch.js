/* =====================================================================
   GÄSTEBUCH – Besucher hinterlassen ein Wort, alle können es lesen
   ---------------------------------------------------------------------
   Steht auf der Startseite vor dem Abschlusssiegel (#gaestebuch).
   Einträge liegen bei Supabase (Tabelle „gaestebuch“, siehe
   supabase-gaestebuch.sql). Gelesen und geschrieben wird nur über die
   Funktionen gb_liste / gb_anzahl / gb_eintragen / gb_loeschen.
   - Einträge werden erst geladen, wenn man in die Nähe scrollt.
   - Wer schreibt, bekommt einen geheimen Schlüssel im Browser und kann
     den eigenen Eintrag später wieder löschen.
   - Moderation im Supabase-Dashboard: „verborgen“ = true blendet aus,
     „antwort“ erscheint als „Antwort der Runde“ unter dem Eintrag.
   ===================================================================== */
(function () {
  "use strict";
  const uebersicht = document.getElementById("uebersicht");
  if (!uebersicht) return;
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  const K_SCHLUESSEL = "imres-gb-schluessel", K_NAME = "imres-gb-name", K_MEINE = "imres-gb-meine";
  const SEITE = 20;
  const ZUERST_ = () => (window.innerWidth >= 900 ? 6 : 4);
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const merk = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  const TX = {
    de: {
      label: "Das Gästebuch", titel: "Hinterlasst uns ein Wort",
      text: "Lob, Kritik, Ideen für die Spiele oder einfach ein Gruß an die Runde – jeder Eintrag ist für alle Besucher sichtbar.",
      schreiben: "✒ Eintrag schreiben", name: "Dein Name", namePh: "z. B. Wandernde Spielfrau", thema: "Worum geht's?",
      themen: { allgemein: "Allgemein", geschichte: "Geschichte", spiele: "Spiele", buehne: "Bühne", idee: "Idee" },
      eintrag: "Dein Eintrag", eintragPh: "Was möchtest du der Runde sagen?", senden: "Ins Gästebuch schreiben", abbrechen: "Abbrechen",
      hinweis: "Dein Eintrag ist sofort für alle sichtbar. Bitte freundlich bleiben – wir behalten uns vor, Einträge zu entfernen.",
      danke: "Danke! Dein Eintrag steht im Gästebuch.", sendet: "Wird eingetragen …",
      leer: "Noch keine Einträge – schreib den ersten!", laedt: "Das Gästebuch wird aufgeschlagen …",
      aufbau: "Das Gästebuch wird gerade noch aufgebaut. Schau bald wieder vorbei!",
      fehlerLaden: "Das Gästebuch ist gerade nicht erreichbar.", nochmal: "Nochmal versuchen",
      alle: n => "Alle " + n + " Einträge lesen", mehr: "Ältere Einträge laden", weniger: "Weniger anzeigen",
      antwort: "Antwort der Runde", loeschen: "Meinen Eintrag löschen", loeschenFrage: "Eintrag wirklich löschen?", ja: "Ja, löschen", nein: "Behalten",
      zeichen: (n, m) => n + " / " + m,
      fehler: { "Name fehlt": "Bitte gib einen Namen an.", "Text zu kurz": "Schreib bitte ein paar Worte mehr.", "zu viele Links": "Bitte höchstens zwei Links.",
        "Bitte kurz warten": "Du hast gerade schon geschrieben – bitte warte ein paar Minuten.", "Bitte später nochmal": "Gerade ist viel los – bitte versuch es später nochmal.",
        "Eintrag existiert schon": "Diesen Eintrag gibt es schon.", _: "Das hat nicht geklappt. Bitte versuch es gleich nochmal." },
      zeit: { jetzt: "gerade eben", min: n => "vor " + n + " Min.", std: n => "vor " + n + " Std.", tag: n => n === 1 ? "gestern" : "vor " + n + " Tagen" }
    },
    en: {
      label: "The guestbook", titel: "Leave us a word",
      text: "Praise, critique, ideas for the games or just a greeting to the party – every entry is visible to all visitors.",
      schreiben: "✒ Write an entry", name: "Your name", namePh: "e.g. Wandering minstrel", thema: "What's it about?",
      themen: { allgemein: "General", geschichte: "Story", spiele: "Games", buehne: "Stage", idee: "Idea" },
      eintrag: "Your entry", eintragPh: "What would you like to tell the party?", senden: "Sign the guestbook", abbrechen: "Cancel",
      hinweis: "Your entry is visible to everyone right away. Please be kind – we may remove entries.",
      danke: "Thank you! Your entry is in the guestbook.", sendet: "Signing …",
      leer: "No entries yet – be the first!", laedt: "Opening the guestbook …",
      aufbau: "The guestbook is still being set up. Check back soon!",
      fehlerLaden: "The guestbook can't be reached right now.", nochmal: "Try again",
      alle: n => "Read all " + n + " entries", mehr: "Load older entries", weniger: "Show less",
      antwort: "Reply from the party", loeschen: "Delete my entry", loeschenFrage: "Really delete this entry?", ja: "Yes, delete", nein: "Keep",
      zeichen: (n, m) => n + " / " + m,
      fehler: { "Name fehlt": "Please enter a name.", "Text zu kurz": "Please write a few more words.", "zu viele Links": "Two links at most, please.",
        "Bitte kurz warten": "You just wrote – please wait a few minutes.", "Bitte später nochmal": "It's busy right now – please try again later.",
        "Eintrag existiert schon": "This entry already exists.", _: "That didn't work. Please try again in a moment." },
      zeit: { jetzt: "just now", min: n => n + " min ago", std: n => n + " h ago", tag: n => n === 1 ? "yesterday" : n + " days ago" }
    }
  };
  const t = () => TX[sprache()];
  const THEMEN = ["allgemein", "geschichte", "spiele", "buehne", "idee"];
  const THEMA_ZEICHEN = { allgemein: "✦", geschichte: "📜", spiele: "🎲", buehne: "🎵", idee: "💡" };

  /* ---------- Server ---------- */
  function rpc(fn, body) {
    return fetch(SERVER.url + "/rest/v1/rpc/" + fn, {
      method: "POST", cache: "no-store",
      headers: { apikey: SERVER.key, Authorization: "Bearer " + SERVER.key, "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    }).then(r => r.ok ? (r.status === 204 ? null : r.json()) : r.json().catch(() => ({})).then(j => Promise.reject({ status: r.status, msg: (j && (j.message || j.hint)) || "" })));
  }
  function schluessel() {
    let s = lies(K_SCHLUESSEL, "");
    if (!/^[A-Za-z0-9]{16,64}$/.test(s)) {
      const z = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", a = new Uint32Array(24);
      (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 1e9);
      s = Array.from(a, n => z[n % z.length]).join(""); merk(K_SCHLUESSEL, s);
    }
    return s;
  }
  const meine = () => { try { return JSON.parse(lies(K_MEINE, "[]")) || []; } catch (e) { return []; } };

  /* ---------- Zustand ---------- */
  let eintraege = [], anzahl = 0, zustand = "neu" /* neu | laedt | ok | aufbau | fehler */, alleOffen = false, ende = false, formOffen = false, meldung = null;

  const box = document.createElement("section");
  box.className = "gaestebuch"; box.id = "gaestebuch"; box.setAttribute("aria-labelledby", "gb-titel");
  const abschluss = uebersicht.querySelector(".start-ende");
  abschluss ? uebersicht.insertBefore(box, abschluss) : uebersicht.appendChild(box);

  function zeitText(iso) {
    const T = t().zeit, d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (!isFinite(s)) return "";
    if (s < 90) return T.jetzt;
    if (s < 3600) return T.min(Math.round(s / 60));
    if (s < 86400) return T.std(Math.round(s / 3600));
    if (s < 86400 * 14) return T.tag(Math.max(1, Math.round(s / 86400)));
    return d.toLocaleDateString(sprache() === "en" ? "en-GB" : "de-DE", { day: "numeric", month: "long", year: "numeric" });
  }
  /* Text: erst escapen, dann Absätze und (sichere) Links */
  function textHtml(s) {
    return esc(s).replace(/\b(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1" target="_blank" rel="nofollow noopener ugc">$1</a>')
      .split(/\n{2,}/).map(p => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
  }

  function eintragHtml(e, i) {
    const T = t(), meins = meine().includes(e.id);
    const thema = THEMEN.includes(e.thema) ? e.thema : "allgemein";
    return '<article class="gb-eintrag" style="--i:' + (i % 8) + ';--dreh:' + (((e.id * 37) % 7) - 3) * 0.25 + 'deg">' +
      '<header><b class="gb-name">' + esc(e.name) + '</b><span class="gb-thema t-' + thema + '">' + THEMA_ZEICHEN[thema] + " " + esc(T.themen[thema]) + "</span>" +
      '<time datetime="' + esc(e.erstellt) + '">' + esc(zeitText(e.erstellt)) + "</time></header>" +
      '<div class="gb-text">' + textHtml(e.text) + "</div>" +
      (e.antwort ? '<div class="gb-antwort"><small>' + esc(T.antwort) + "</small>" + textHtml(e.antwort) + "</div>" : "") +
      (meins ? '<button type="button" class="gb-loeschen" data-id="' + e.id + '">' + esc(T.loeschen) + "</button>" : "") +
      "</article>";
  }

  function formHtml() {
    const T = t();
    return '<form class="gb-form" novalidate>' +
      '<label class="gb-feld"><span>' + esc(T.name) + '</span><input name="name" maxlength="40" autocomplete="nickname" required placeholder="' + esc(T.namePh) + '" value="' + esc(lies(K_NAME, "")) + '"></label>' +
      '<fieldset class="gb-themen"><legend>' + esc(T.thema) + "</legend>" +
        THEMEN.map((th, i) => '<label><input type="radio" name="thema" value="' + th + '"' + (i === 0 ? " checked" : "") + "><span>" + THEMA_ZEICHEN[th] + " " + esc(T.themen[th]) + "</span></label>").join("") + "</fieldset>" +
      '<label class="gb-feld"><span>' + esc(T.eintrag) + '</span><textarea name="text" rows="4" maxlength="1000" required placeholder="' + esc(T.eintragPh) + '"></textarea><small class="gb-zaehler">' + T.zeichen(0, 1000) + "</small></label>" +
      /* Honigtopf für Bots: Menschen sehen das Feld nicht */
      '<label class="gb-topf" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<p class="gb-hinweis">' + esc(T.hinweis) + "</p>" +
      '<p class="gb-meldung" role="status" aria-live="polite"></p>' +
      '<div class="gb-knoepfe"><button type="submit" class="gb-senden">' + esc(T.senden) + '</button><button type="button" class="gb-abbrechen">' + esc(T.abbrechen) + "</button></div>" +
      "</form>";
  }

  function bauen() {
    const T = t();
    const sichtbar = alleOffen ? eintraege : eintraege.slice(0, ZUERST_());
    let liste = "";
    if (zustand === "neu" || zustand === "laedt") liste = '<p class="gb-status">' + esc(T.laedt) + "</p>";
    else if (zustand === "aufbau") liste = '<p class="gb-status">' + esc(T.aufbau) + "</p>";
    else if (zustand === "fehler") liste = '<p class="gb-status">' + esc(T.fehlerLaden) + ' <button type="button" class="gb-nochmal">' + esc(T.nochmal) + "</button></p>";
    else if (!eintraege.length) liste = '<p class="gb-status">' + esc(T.leer) + "</p>";
    else liste = '<div class="gb-liste">' + sichtbar.map(eintragHtml).join("") + "</div>";
    let mehr = "";
    if (zustand === "ok" && eintraege.length) {
      if (!alleOffen && anzahl > ZUERST_()) mehr = '<button type="button" class="gb-mehr" data-tun="alle">' + esc(T.alle(anzahl)) + "</button>";
      else if (alleOffen) mehr = (!ende ? '<button type="button" class="gb-mehr" data-tun="mehr">' + esc(T.mehr) + "</button>" : "") +
        '<button type="button" class="gb-mehr leise" data-tun="weniger">' + esc(T.weniger) + "</button>";
    }
    const kannSchreiben = zustand === "ok";
    box.innerHTML =
      '<div class="gb-kopf"><div><p class="label">' + esc(T.label) + (anzahl ? ' <span class="gb-zahl">· ' + anzahl + "</span>" : "") + '</p><h2 id="gb-titel">' + esc(T.titel) + "</h2><p class=\"gb-intro\">" + esc(T.text) + "</p></div>" +
      (kannSchreiben && !formOffen ? '<button type="button" class="gb-oeffnen">' + esc(T.schreiben) + "</button>" : "") + "</div>" +
      (meldung ? '<p class="gb-danke" role="status">' + esc(meldung) + "</p>" : "") +
      (kannSchreiben && formOffen ? formHtml() : "") +
      liste + (mehr ? '<div class="gb-mehr-reihe">' + mehr + "</div>" : "");
  }

  /* ---------- Laden ---------- */
  function laden() {
    if (zustand === "laedt") return;
    zustand = "laedt"; bauen();
    Promise.all([rpc("gb_liste", { p_anzahl: SEITE, p_vor: null }), rpc("gb_anzahl")]).then(([liste, n]) => {
      eintraege = liste || []; anzahl = typeof n === "number" ? n : eintraege.length; ende = eintraege.length < SEITE; zustand = "ok"; bauen();
    }).catch(f => { zustand = f && (f.status === 404 || /could not find|does not exist/i.test(f.msg || "")) ? "aufbau" : "fehler"; bauen(); });
  }
  function aeltere() {
    const letzte = eintraege[eintraege.length - 1]; if (!letzte) return;
    rpc("gb_liste", { p_anzahl: SEITE, p_vor: letzte.id }).then(liste => {
      liste = liste || []; eintraege = eintraege.concat(liste); ende = liste.length < SEITE; bauen();
    }).catch(() => {});
  }

  /* ---------- Bedienung ---------- */
  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("gb-oeffnen")) { formOffen = true; meldung = null; bauen(); const f = box.querySelector(box.querySelector('[name=name]').value ? "textarea" : "[name=name]"); if (f) f.focus(); return; }
    if (b.classList.contains("gb-abbrechen")) { formOffen = false; bauen(); return; }
    if (b.classList.contains("gb-nochmal")) { laden(); return; }
    if (b.dataset.tun === "alle") { alleOffen = true; bauen(); return; }
    if (b.dataset.tun === "mehr") { aeltere(); return; }
    if (b.dataset.tun === "weniger") { alleOffen = false; bauen(); box.scrollIntoView({ block: "start" }); return; }
    if (b.classList.contains("gb-loeschen")) {
      const T = t();
      if (!b.classList.contains("frage")) {
        b.classList.add("frage");
        b.outerHTML = '<span class="gb-frage">' + esc(T.loeschenFrage) + ' <button type="button" class="gb-ja" data-id="' + b.dataset.id + '">' + esc(T.ja) + '</button> <button type="button" class="gb-nein">' + esc(T.nein) + "</button></span>";
      }
      return;
    }
    if (b.classList.contains("gb-nein")) { bauen(); return; }
    if (b.classList.contains("gb-ja")) {
      const id = Number(b.dataset.id);
      rpc("gb_loeschen", { p_id: id, p_schluessel: schluessel() }).then(ok => {
        if (ok) { eintraege = eintraege.filter(x => x.id !== id); anzahl = Math.max(0, anzahl - 1); merk(K_MEINE, JSON.stringify(meine().filter(x => x !== id))); }
        bauen();
      }).catch(() => bauen());
    }
  });
  box.addEventListener("input", e => {
    const mm = box.querySelector(".gb-meldung"); if (mm && !box.querySelector(".gb-senden:disabled")) mm.textContent = "";
    if (e.target.name === "text") { const z = box.querySelector(".gb-zaehler"); if (z) z.textContent = t().zeichen(e.target.value.length, 1000); }
  });
  box.addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target, el = f.elements, T = t(), m = f.querySelector(".gb-meldung"), knopf = f.querySelector(".gb-senden");
    const name = el.name.value.trim(), text = el.text.value.trim(), thema = (f.querySelector("[name=thema]:checked") || {}).value || "allgemein";
    if (el.website.value) return; /* Bot */
    if (!name) { m.textContent = T.fehler["Name fehlt"]; el.name.focus(); return; }
    if (text.length < 3) { m.textContent = T.fehler["Text zu kurz"]; el.text.focus(); return; }
    knopf.disabled = true; m.textContent = T.sendet;
    merk(K_NAME, name);
    rpc("gb_eintragen", { p_name: name, p_text: text, p_thema: thema, p_schluessel: schluessel() }).then(id => {
      if (typeof id === "number") merk(K_MEINE, JSON.stringify(meine().concat(id).slice(-50)));
      eintraege.unshift({ id: id, name: name, text: text, thema: thema, antwort: null, erstellt: new Date().toISOString() });
      anzahl++; formOffen = false; meldung = T.danke; bauen();
      const neu = box.querySelector(".gb-eintrag"); if (neu) neu.classList.add("frisch");
    }).catch(fe => {
      knopf.disabled = false;
      const msg = (fe && fe.msg) || "";
      const k = Object.keys(T.fehler).find(x => x !== "_" && msg.indexOf(x) >= 0);
      m.textContent = T.fehler[k || "_"];
    });
  });

  /* Erst laden, wenn man in die Nähe kommt (oder direkt per #gaestebuch) */
  bauen();
  if (location.hash === "#gaestebuch" || !("IntersectionObserver" in window)) laden();
  else {
    const io = new IntersectionObserver(en => { if (en.some(x => x.isIntersecting)) { io.disconnect(); if (zustand === "neu") laden(); } }, { rootMargin: "600px 0px" });
    io.observe(box);
  }
  window.addEventListener("hashchange", () => { if (location.hash === "#gaestebuch" && zustand === "neu") laden(); });
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest('a[href="#gaestebuch"]'); if (a && zustand === "neu") laden(); });
  new MutationObserver(bauen).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.gaestebuch { margin-top: clamp(2.2rem, 6vw, 3.6rem); scroll-margin-top: 5rem; }
.gb-kopf { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem 1.5rem; margin-bottom: 1.2rem; }
.gb-kopf > div { max-width: 40rem; }
.gb-kopf h2 { font-size: clamp(1.7rem, 4.5vw, 2.4rem); line-height: 1.1; margin: .25rem 0 .45rem; }
.gb-intro { color: var(--ash); font-size: .98rem; }
.gb-zahl { color: var(--ash); letter-spacing: .1em; }
.gb-oeffnen, .gb-senden { border: 1px solid var(--ember); background: var(--ember); color: var(--night); font: inherit; font-weight: 600; font-size: .95rem;
  padding: .65rem 1.2rem; cursor: pointer; transition: transform .15s, box-shadow .15s; }
.gb-oeffnen:hover, .gb-senden:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(224,160,70,.3); }
.gb-senden:disabled { opacity: .6; cursor: wait; transform: none; box-shadow: none; }
.gb-abbrechen, .gb-mehr, .gb-nochmal { border: 1px solid var(--line); background: none; color: var(--vellum); font: inherit; font-size: .9rem; padding: .55rem 1rem; cursor: pointer; }
.gb-abbrechen:hover, .gb-mehr:hover, .gb-nochmal:hover { border-color: var(--ember); color: var(--ember); }
.gb-mehr.leise { border-color: transparent; color: var(--ash); }
.gb-danke { margin: 0 0 1rem; padding: .6rem .9rem; border-left: 3px solid var(--moss); background: rgba(111,138,90,.12); font-size: .95rem; }

.gb-form { display: grid; gap: .9rem; margin: 0 0 1.6rem; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--line); border-left: 3px solid var(--ember);
  background: linear-gradient(160deg, rgba(30,24,34,.92), rgba(16,13,20,.92)); }
.gb-feld { display: grid; gap: .3rem; position: relative; }
.gb-feld > span, .gb-themen legend { font-size: .72rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--ember); }
.gb-feld input, .gb-feld textarea { width: 100%; font: inherit; font-size: 1rem; color: var(--vellum); background: rgba(0,0,0,.3); border: 1px solid var(--line); padding: .6rem .75rem; }
.gb-feld textarea { resize: vertical; min-height: 7rem; line-height: 1.5; }
.gb-feld input:focus, .gb-feld textarea:focus { outline: none; border-color: var(--ember); box-shadow: 0 0 0 2px rgba(224,160,70,.2); }
.gb-zaehler { justify-self: end; font-size: .75rem; color: var(--ash); }
.gb-themen { display: flex; flex-wrap: wrap; gap: .4rem; border: 0; margin: 0; padding: 0; }
.gb-themen legend { padding: 0; margin-bottom: .35rem; }
.gb-themen label { cursor: pointer; }
.gb-themen input { position: absolute; opacity: 0; pointer-events: none; }
.gb-themen span { display: inline-block; padding: .3rem .75rem; border: 1px solid var(--line); border-radius: 999px; font-size: .88rem; color: var(--ash); transition: all .15s; }
.gb-themen input:checked + span { border-color: var(--ember); color: var(--night); background: var(--ember); }
.gb-themen input:focus-visible + span { outline: 2px solid var(--ember); outline-offset: 2px; }
.gb-topf { position: absolute !important; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.gb-hinweis { font-size: .8rem; color: var(--ash); }
.gb-meldung { min-height: 1.2em; font-size: .9rem; color: var(--ember); }
.gb-meldung:empty { display: none; }
.gb-knoepfe { display: flex; flex-wrap: wrap; gap: .6rem; }

.gb-status { color: var(--ash); font-style: italic; padding: 1rem 0; }
.gb-liste { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); gap: clamp(1.1rem, 3vw, 1.5rem) clamp(.9rem, 2.5vw, 1.4rem); align-items: start; padding-top: 8px; }
/* Einträge als Pergamentzettel */
.gb-eintrag { display: block; position: relative; padding: 1rem 1.15rem 1.05rem; color: #2a2016; transform: rotate(var(--dreh, 0deg));
  background: radial-gradient(130% 90% at 20% 0%, #f3e8cc, #e6d6ae 70%, #d9c493); box-shadow: 0 10px 24px rgba(0,0,0,.45), inset 0 0 30px rgba(120,86,40,.18);
  animation: gbRein .45s calc(var(--i, 0) * 60ms) both; }
.gb-eintrag::before { content: ""; position: absolute; top: -7px; left: 50%; width: 13px; height: 13px; margin-left: -6px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e98a7d, #9b3a2f 60%, #5e1f18); box-shadow: 0 2px 3px rgba(0,0,0,.5); }
.gb-eintrag.frisch { animation: gbFrisch .8s both; }
@keyframes gbRein { from { opacity: 0; transform: translateY(10px) rotate(var(--dreh, 0deg)); } }
@keyframes gbFrisch { 0% { opacity: 0; transform: scale(.9) rotate(-3deg); } 60% { transform: scale(1.03) rotate(1deg); } 100% { opacity: 1; transform: rotate(var(--dreh, 0deg)); } }
.gb-eintrag header { display: flex; flex-wrap: wrap; align-items: baseline; gap: .15rem .6rem; margin-bottom: .4rem; }
.gb-name { font-family: var(--hand); font-weight: 600; font-size: 1.45rem; line-height: 1; color: #1d1610; }
.gb-thema { font-size: .68rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #7a5a2c; }
.gb-eintrag time { margin-left: auto; font-size: .75rem; color: #7a6a52; }
.gb-text { font-size: .97rem; line-height: 1.55; overflow-wrap: anywhere; }
.gb-text p + p, .gb-antwort p + p { margin-top: .5em; }
.gb-text a, .gb-antwort a { color: #8a3a12; }
.gb-antwort { margin-top: .75rem; padding: .55rem .7rem; border-left: 3px solid #9b3a2f; background: rgba(155,58,47,.08); font-size: .92rem; line-height: 1.5; }
.gb-antwort small { display: block; font-size: .66rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #9b3a2f; margin-bottom: .15rem; }
.gb-loeschen, .gb-ja, .gb-nein { margin-top: .6rem; border: 0; background: none; padding: 0; font: inherit; font-size: .78rem; color: #7a6a52; text-decoration: underline; cursor: pointer; }
.gb-ja { color: #9b3a2f; font-weight: 600; margin-left: .3rem; }
.gb-nein { margin-left: .3rem; }
.gb-frage { display: block; margin-top: .6rem; font-size: .8rem; color: #4a3a28; }
.gb-fusslink { text-decoration: none; margin-right: .6rem; }
.gb-mehr-reihe { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem; margin-top: 1.4rem; }
@media (prefers-reduced-motion: reduce) { .gb-eintrag, .gb-eintrag.frisch { animation: none; } }
`;
  document.head.appendChild(css);
  /* Link im Fuß der Seite */
  const fuss = document.querySelector("footer .fuss-recht");
  if (fuss) {
    const a = document.createElement("a"); a.className = "dank-knopf gb-fusslink"; a.href = "#gaestebuch";
    const setzen = () => { a.textContent = sprache() === "en" ? "✒ Guestbook" : "✒ Gästebuch"; };
    setzen(); fuss.insertBefore(a, fuss.querySelector(".dank-knopf"));
    new MutationObserver(setzen).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  window.ImresGaestebuch = { laden };
})();
