/* Imres Tales – Sprachsteuerung (offline)
   Taste gedrückt halten (Standard F9), ein Stichwort sagen („Bach“, „Taverne“, „Gewitter“ …), loslassen – die passende Kulisse,
   Welt, Szene oder das Geräusch startet. Die Erkennung läuft vollständig im Browser (Vosk, kleines deutsches Modell):
   kein Ton verlässt den Rechner. Das Modell (≈ 46 MB) wird beim ersten Einschalten geladen und danach vom Browser zwischengespeichert.
   Mit dem kleinen Windows-Helfer „Imres-Taste“ wirkt die Taste auch, wenn ein anderes Fenster vorne ist (Verbindung über ws://127.0.0.1:47321).

   Einbindung: ImresSprache.einrichten({ ort: Element, befehle: () => [{ p: ["bach", "fluss"], text: "Zusatz Bach", tun() {} }, …], ducken: an => {} })
   – ducken (freiwillig): solange zugehört wird, die eigene Musik leiser stellen, damit das Mikrofon nicht die Lautsprecher hört.

   Genauigkeit: das kleine Modell kennt nur die Wörter seines Wortschatzes (wortschatz.gz, ≈ 220 000 Wörter). Ein unbekanntes Wort
   in der Grammatik wird von Vosk stillschweigend verworfen – „Unterreich“, „Zwergenmine“ oder „Feenwald“ konnten so nie erkannt werden
   und landeten auf ähnlich klingenden Stichwörtern. Darum wird jedes unbekannte Wort in bekannte Teile zerlegt („unter reich“,
   „zwergen mine“, „feen wald“); was sich nicht zerlegen lässt, fällt aus der Grammatik, statt falsche Treffer zu erzeugen. */
(function () {
  "use strict";
  if (window.ImresSprache) return;
  const BASIS = (() => { const s = document.currentScript && document.currentScript.src; return s ? s.replace(/sprache\.js.*$/, "") : "sprache/"; })();
  const MODELL = BASIS + "vosk-model-small-de-0.15.tar.gz", BIBLIOTHEK = BASIS + "vosk.js", WORTSCHATZ = BASIS + "wortschatz.gz", HELFER = "ws://127.0.0.1:47321";
  const EN = (() => { try { return localStorage.getItem("imres-lang") === "en"; } catch (_) { return false; } })();
  const W = (de, en) => EN ? en : de;
  const SPEICHER = "imres-sprache";
  let E = { an: false, taste: "F9" };
  try { E = Object.assign(E, JSON.parse(localStorage.getItem(SPEICHER) || "{}") || {}); } catch (_) {}
  /* nach dem Neuladen immer aus: das Sprachmodell (≈ 50 MB) wird nur geladen, wenn man die Sprachsteuerung selbst einschaltet */
  E.an = false;
  const merken = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(E)); } catch (_) {} };

  /* Tastennamen zum Anzeigen */
  const tastenName = c => ({ ControlRight: W("Strg rechts", "Right Ctrl"), ControlLeft: W("Strg links", "Left Ctrl"), AltRight: "Alt Gr", ShiftRight: W("Umschalt rechts", "Right Shift"),
    Pause: "Pause", ScrollLock: W("Rollen", "Scroll Lock"), Insert: W("Einfg", "Insert"), Home: "Pos1", End: W("Ende", "End"), PageUp: W("Bild ↑", "Page Up"), PageDown: W("Bild ↓", "Page Down"),
    Backquote: "^", ContextMenu: W("Menü-Taste", "Menu key"), NumpadEnter: W("Enter (Ziffernblock)", "Numpad Enter") }[c] || c.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Numpad/, W("Ziffernblock ", "Numpad ")));

  let st = null; /* { ort, befehle } */
  let modell = null, modellLaedt = null, erkenner = null, grammatik = "", karte = null, wortschatz = null, gesprochen = null;
  let mikro = null; /* { strom, ctx, knoten, vorlauf: [] } */
  let sammel = [];
  let hoert = false, nachlauf = 0, wartet = null, helfer = null, helferOk = false, helferTimer = 0, tasteWaehlen = false, letzte = "", zustand = "";

  /* ---------- Anzeige ---------- */
  const css = `
.is-box{border:1px solid rgba(224,160,70,.35);border-radius:12px;padding:.6rem .75rem;margin:.5rem 0;display:grid;gap:.45rem;font-size:.92rem}
.is-zeile{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem}
.is-box button{border:1px solid rgba(224,160,70,.45);background:none;color:inherit;font:inherit;border-radius:1rem;padding:.3rem .8rem;cursor:pointer}
.is-box button[aria-pressed="true"]{background:rgba(224,160,70,.22);border-color:#e0a046}
.is-box button.warte{border-style:dashed}
.is-stand{opacity:.8;font-size:.85rem}
.is-liste{max-height:14rem;overflow:auto;font-size:.82rem;opacity:.85;columns:2;column-gap:1rem;margin:0;padding-left:1rem}
.is-liste li{break-inside:avoid}
.is-hinweis{position:fixed;left:50%;top:1rem;transform:translateX(-50%);z-index:200;background:rgba(20,16,24,.94);color:#f3e7cf;border:1px solid #e0a046;border-radius:1.4rem;
  padding:.55rem 1.1rem;font:500 1rem/1.3 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.45);pointer-events:none;transition:opacity .3s;opacity:0;max-width:90vw;text-align:center}
.is-hinweis.da{opacity:1}
.is-hinweis.hoert{border-color:#c0392b}
.is-hinweis.hoert::before{content:"";display:inline-block;width:.65rem;height:.65rem;border-radius:50%;background:#e74c3c;margin-right:.5rem;vertical-align:middle;animation:is-puls 1s ease-in-out infinite}
@keyframes is-puls{50%{opacity:.25}}`;
  let hinweis = null, hinweisT = 0;
  function zeige(text, hoeren, dauer) {
    if (!hinweis) { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); hinweis = document.createElement("div"); hinweis.className = "is-hinweis"; hinweis.setAttribute("aria-live", "polite"); document.body.appendChild(hinweis); }
    hinweis.textContent = text; hinweis.classList.add("da"); hinweis.classList.toggle("hoert", !!hoeren);
    clearTimeout(hinweisT); if (!hoeren) hinweisT = setTimeout(() => hinweis.classList.remove("da"), dauer || 2600);
  }
  function zeichnen() {
    if (!st || !st.ort) return;
    if (!document.getElementById("is-css")) { const s = document.createElement("style"); s.id = "is-css"; s.textContent = css; document.head.appendChild(s); }
    const helferText = !E.an ? "" : helferOk ? W("🟢 Helfer verbunden – die Taste wirkt auch in anderen Fenstern", "🟢 Helper connected – the key also works in other windows")
      : W("Ohne Helfer wirkt die Taste nur, solange diese Seite vorne ist.", "Without the helper, the key only works while this page is in front.");
    st.ort.innerHTML = '<div class="is-box">' +
      '<div class="is-zeile"><button type="button" data-is="an" aria-pressed="' + E.an + '">🎙 ' + (E.an ? W("Sprachsteuerung an", "Voice control on") : W("Sprachsteuerung aus", "Voice control off")) + "</button>" +
      (E.an ? '<button type="button" data-is="taste"' + (tasteWaehlen ? ' class="warte"' : "") + ">⌨ " + (tasteWaehlen ? W("Neue Taste drücken … (Esc: abbrechen)", "Press the new key … (Esc: cancel)") : W("Taste: ", "Key: ") + tastenName(E.taste)) + "</button>" +
        '<button type="button" data-is="liste">' + W("Stichwörter", "Keywords") + "</button>" : "") + "</div>" +
      '<div class="is-stand">' + (E.an ? (zustand || "") + (letzte ? " · " + letzte : "") : W("Taste gedrückt halten, ein Stichwort sagen, loslassen – erkannt wird offline auf diesem Rechner. Beim ersten Einschalten wird ein Sprachmodell (≈ 46 MB) geladen.",
        "Hold the key, say a keyword, release – recognition runs offline on this computer. The first time, a speech model (≈ 46 MB) is loaded.")) + "</div>" +
      (E.an ? '<div class="is-stand">' + helferText + ' <a href="' + BASIS + 'helfer.html" target="_blank" rel="noopener">' + W("Windows-Helfer „Imres-Taste“", "Windows helper “Imres-Taste”") + "</a></div>" : "") +
      (st.listeAuf && E.an ? '<ul class="is-liste">' + befehlsListe().map(([p, t]) => "<li><b>" + p + "</b> – " + t + "</li>").join("") + "</ul>" : "") +
      "</div>";
  }
  function stand(t) { zustand = t; zeichnen(); }

  /* ---------- Befehle → Grammatik ---------- */
  const norm = s => String(s).toLowerCase().replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️‍]/gu, "").replace(/[^a-zäöüß0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  /* Wörter, die das Modell nicht kennt und die sich nicht sinnvoll zerlegen lassen: gleich klingende bekannte Wörter */
  const ERSATZ = { "20": "zwanzig", niesel: "nieselregen", "rülpser": "rülpsen", schnurrende: "schnurrend", brodelnder: "brodelnde", "gerüstete": "gerüsteten",
    zzz: "schnarchen", ooooh: "oh", oooh: "oh", sakura: "kirschblüte", tss: "", wah: "", psst: "pst", shanty: "shantys", drunken: "", sailor: "seemann" };
  const zerlegtSpeicher = new Map();
  function zerlegen(w) {
    if (!wortschatz || wortschatz.has(w)) return w;
    if (w in ERSATZ) return ERSATZ[w] && (wortschatz.has(ERSATZ[w].split(" ")[0]) ? ERSATZ[w] : null);
    if (zerlegtSpeicher.has(w)) return zerlegtSpeicher.get(w);
    /* in möglichst wenige bekannte Teile (je mindestens zwei Buchstaben) zerlegen – klingt hintereinander gesprochen genauso */
    const n = w.length, best = new Array(n + 1).fill(null); best[n] = [];
    for (let i = n - 1; i >= 0; i--) for (let j = n; j >= i + 2; j--) {
      if (!best[j] || !wortschatz.has(w.slice(i, j))) continue;
      const c = [w.slice(i, j)].concat(best[j]); if (!best[i] || c.length < best[i].length) best[i] = c;
    }
    const r = best[0] && best[0].length <= 4 ? best[0].join(" ") : null;
    zerlegtSpeicher.set(w, r); return r;
  }
  /* Schreibweise → was der Erkenner liefern kann (null: nicht sprechbar) */
  function sprechform(k) {
    const teile = [];
    for (const w of k.split(" ")) { const z = zerlegen(w); if (z === null) return null; if (z) teile.push(z); }
    return teile.join(" ") || null;
  }
  function karteBauen() {
    karte = new Map(); gesprochen = new Map();
    (st.befehle() || []).forEach(b => (b.p || []).forEach(p => { const k = norm(p), g = k && sprechform(k); if (g && !karte.has(g)) { karte.set(g, b); gesprochen.set(g, k); } }));
    const g = JSON.stringify([...karte.keys()].concat(["[unk]"]));
    if (g !== grammatik) { grammatik = g; if (erkenner) { try { erkenner.remove(); } catch (_) {} erkenner = null; } }
  }
  function befehlsListe() {
    if (!karte) karteBauen();
    const nach = new Map();
    karte.forEach((b, p) => { if (!nach.has(b)) nach.set(b, []); nach.get(b).push(gesprochen.get(p) || p); });
    return [...nach.entries()].map(([b, ps]) => [ps.slice(0, 3).join(" / "), b.text]);
  }

  /* ---------- Modell und Mikrofon ---------- */
  function skriptLaden(src) { return new Promise((res, rej) => { if (window.Vosk) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function modellHolen() {
    if (modell) return Promise.resolve(modell);
    if (modellLaedt) return modellLaedt;
    stand(W("⏳ Sprachmodell wird geladen …", "⏳ Loading speech model …"));
    modellLaedt = Promise.all([skriptLaden(BIBLIOTHEK).then(() => window.Vosk.createModel(MODELL, -1)), wortschatzHolen()]).then(([m]) => { modell = m; karte = null; stand(W("✅ Bereit – ", "✅ Ready – ") + W("Taste ", "key ") + tastenName(E.taste) + W(" halten und sprechen", " hold and speak")); return m; })
      .catch(e => { modellLaedt = null; stand(W("⚠ Sprachmodell konnte nicht geladen werden.", "⚠ Could not load the speech model.")); throw e; });
    return modellLaedt;
  }
  /* Wortschatz des Modells (gzip; manche Server entpacken schon selbst – dann liegt gleich Text an) */
  async function wortschatzHolen() {
    if (wortschatz) return;
    try {
      const roh = new Uint8Array(await (await fetch(WORTSCHATZ)).arrayBuffer());
      let text;
      if (roh[0] === 0x1f && roh[1] === 0x8b && window.DecompressionStream) text = await new Response(new Blob([roh]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
      else text = new TextDecoder().decode(roh);
      const s = new Set(text.split("\n")); if (s.size > 1000) wortschatz = s;
    } catch (_) { /* ohne Wortschatz geht es weiter wie bisher */ }
  }
  let geduckt = false;
  function ducken(an) { if (an === geduckt || !st || typeof st.ducken !== "function") return; geduckt = an; try { st.ducken(an); } catch (_) {} }
  async function mikroHolen() {
    if (mikro) return mikro;
    const strom = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }, video: false });
    const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
    const quelle = ctx.createMediaStreamSource(strom), knoten = ctx.createScriptProcessor(4096, 1, 1), still = ctx.createGain(); still.gain.value = 0;
    const m = { strom, ctx, knoten, vorlauf: [] };
    knoten.onaudioprocess = e => {
      const d = e.inputBuffer.getChannelData(0).slice(0);
      if (hoert || nachlauf > 0) { if (erkenner) erkenner.acceptWaveformFloat(d, ctx.sampleRate); if (!hoert && --nachlauf === 0) abschliessen(); }
      else { m.vorlauf.push(d); while (m.vorlauf.length > Math.ceil(ctx.sampleRate * .45 / 4096)) m.vorlauf.shift(); }
    };
    quelle.connect(knoten); knoten.connect(still); still.connect(ctx.destination);
    mikro = m; return m;
  }
  function mikroAus() { if (!mikro) return; try { mikro.strom.getTracks().forEach(t => t.stop()); mikro.ctx.close(); } catch (_) {} mikro = null; }
  function erkennerHolen() {
    if (!karte) karteBauen();
    if (!erkenner && modell && mikro) {
      erkenner = new modell.KaldiRecognizer(mikro.ctx.sampleRate, grammatik); erkenner.setWords(true);
      /* Vosk meldet ein Ergebnis auch zwischendurch, sobald eine Sprechpause erkannt wird – alles sammeln */
      erkenner.on("result", m => { if (m && m.result) sammel.push(m.result); if (wartet) { const w = wartet; wartet = null; w(); } });
    }
    return erkenner;
  }

  /* ---------- Drücken / Loslassen ---------- */
  async function druck() {
    if (!E.an || hoert) return;
    try { await modellHolen(); await mikroHolen(); } catch (_) { zeige(W("⚠ Mikrofon oder Sprachmodell nicht verfügbar", "⚠ Microphone or speech model unavailable")); return; }
    if (mikro.ctx.state === "suspended") { try { await mikro.ctx.resume(); } catch (_) {} }
    karteBauen(); if (!erkennerHolen()) return;
    hoert = true; nachlauf = 0; sammel = []; ducken(true);
    /* die letzte knappe halbe Sekunde vor dem Drücken mitnehmen – oft beginnt man schon beim Drücken zu sprechen */
    mikro.vorlauf.forEach(d => erkenner.acceptWaveformFloat(d, mikro.ctx.sampleRate)); mikro.vorlauf = [];
    zeige(W("Hört zu …", "Listening …"), true);
  }
  function los() {
    if (!hoert) return;
    hoert = false;
    /* noch gut eine Viertelsekunde weiter zuhören, damit das Wortende nicht abgeschnitten wird */
    nachlauf = Math.max(1, Math.round(mikro.ctx.sampleRate * .3 / 4096));
  }
  function abschliessen() {
    if (!erkenner) { ducken(false); return; }
    const fertig = () => { clearTimeout(zeit); wartet = null; const alle = sammel; sammel = []; ducken(false);
      auswerten({ text: alle.map(r => r.text || "").join(" "), result: [].concat(...alle.map(r => r.result || [])) }); };
    const zeit = setTimeout(fertig, 2000);
    wartet = fertig;
    try { erkenner.retrieveFinalResult(); } catch (_) {}
  }
  function auswerten(r) {
    const woerter = (r && r.result) || [], text = norm(((r && r.text) || "").replace(/\[unk\]/g, " "));
    if (!text) { zeige(W("? Nicht verstanden", "? Not understood")); return; }
    /* längste bekannte Wendung im Erkannten finden */
    let treffer = null;
    [...karte.keys()].sort((a, b) => b.length - a.length).some(p => { if ((" " + text + " ").includes(" " + p + " ")) { treffer = p; return true; } return false; });
    if (!treffer) { zeige(W("? „", "? “") + text + W("“ – kein Stichwort", "” – not a keyword")); return; }
    const teile = treffer.split(" "), conf = woerter.filter(w => teile.includes(w.word)).map(w => w.conf), sicher = conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : 1;
    /* weitere Stichwort-Wörter neben dem Treffer heißen meist: das Modell hat in Geräusch oder Musik etwas hineingehört – nur bei hoher Sicherheit ausführen */
    const uebrig = text.split(" ").filter(w => w && !teile.includes(w)).length;
    const zeigeWort = gesprochen.get(treffer) || treffer;
    if (sicher < .7 || (uebrig && sicher < .9)) { zeige(W("? Unsicher: „", "? Unsure: “") + zeigeWort + W("“ – bitte nochmal", "” – please repeat")); return; }
    const b = karte.get(treffer);
    letzte = "🎙 " + zeigeWort + " → " + b.text;
    zeige("✓ " + zeigeWort + " → " + b.text);
    try { b.tun(); } catch (e) { console.warn(e); }
    zeichnen();
  }

  /* ---------- Tastatur auf der Seite ---------- */
  document.addEventListener("keydown", e => {
    if (tasteWaehlen) {
      e.preventDefault(); e.stopPropagation();
      if (e.code !== "Escape") { E.taste = e.code; merken(); helferTaste(); }
      tasteWaehlen = false; stand(zustand); return;
    }
    if (!E.an || e.code !== E.taste) return;
    const t = e.target, tippt = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) && /^(Key|Digit|Space)/.test(e.code);
    if (tippt) return;
    e.preventDefault();
    if (!e.repeat) druck();
  }, true);
  document.addEventListener("keyup", e => { if (E.an && e.code === E.taste) { e.preventDefault(); los(); } }, true);
  window.addEventListener("blur", () => { /* Fenster verlassen, während die Taste gehalten wird: ohne Helfer kommt das Loslassen nie an */ if (hoert && !helferOk) los(); });

  /* ---------- Windows-Helfer: meldet Drücken und Loslassen auch aus anderen Fenstern ---------- */
  function helferTaste() { if (helfer && helfer.readyState === 1) helfer.send(JSON.stringify({ art: "taste", code: E.taste })); }
  function helferVerbinden() {
    clearTimeout(helferTimer);
    if (!E.an || (helfer && helfer.readyState <= 1)) return;
    let w; try { w = new WebSocket(HELFER); } catch (_) { helferTimer = setTimeout(helferVerbinden, 8000); return; }
    helfer = w;
    w.onopen = () => { helferOk = true; helferTaste(); zeichnen(); };
    w.onmessage = e => {
      let d; try { d = JSON.parse(e.data); } catch (_) { return; }
      if (d.art === "druck") druck(); else if (d.art === "los") los();
      /* Taste wurde im Helfer-Fenster geändert: übernehmen */
      else if (d.art === "taste" && d.code && d.code !== E.taste) { E.taste = d.code; merken(); stand(zustand); }
    };
    w.onclose = () => { const war = helferOk; helferOk = false; helfer = null; if (war) { if (hoert) los(); zeichnen(); } helferTimer = setTimeout(helferVerbinden, 5000); };
    w.onerror = () => {};
  }

  /* ---------- Bedienfeld ---------- */
  document.addEventListener("click", e => {
    const k = e.target.closest && e.target.closest("[data-is]"); if (!k || !st || !st.ort || !st.ort.contains(k)) return;
    const a = k.dataset.is;
    if (a === "an") {
      E.an = !E.an; merken();
      if (E.an) { modellHolen().catch(() => {}); mikroHolen().catch(() => stand(W("⚠ Kein Zugriff aufs Mikrofon – bitte im Browser erlauben.", "⚠ No microphone access – please allow it in the browser."))); helferVerbinden(); }
      else { mikroAus(); if (helfer) try { helfer.close(); } catch (_) {} clearTimeout(helferTimer); }
      zeichnen();
    } else if (a === "taste") { tasteWaehlen = !tasteWaehlen; zeichnen(); }
    else if (a === "liste") { st.listeAuf = !st.listeAuf; zeichnen(); }
  });

  window.ImresSprache = {
    einrichten(o) {
      st = { ort: o.ort, befehle: o.befehle, ducken: o.ducken, listeAuf: false };
      karte = null; zeichnen();
      /* hier wird nichts geladen – erst der Knopf „Sprachsteuerung“ holt Bibliothek und Modell */
    },
    /* wenn sich die Seite neu zeichnet: neuen Platz fürs Bedienfeld setzen, Stichwörter neu einlesen */
    ort(el) { if (st) { st.ort = el; zeichnen(); } },
    neu() { karte = null; },
    get an() { return E.an; }
  };
})();
