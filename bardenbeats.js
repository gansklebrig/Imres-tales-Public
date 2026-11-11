/* =====================================================================
   Barden Beats – einfache Ansicht fürs Handy (imrestales.de/Bardenbeats)
   ---------------------------------------------------------------------
   Ein großer Knopf, ein paar Kacheln, zwei Regler – fürs Herzeigen.
   Steuert das volle Pult (Bühne) bzw. die Klangwelten im Hintergrund.
   ===================================================================== */
(() => {
  "use strict";
  if (window.__bardenbeats) { window.__bardenbeats.oeffnen(); return; }
  const EN = (() => { try { return localStorage.getItem("imres-lang") === "en"; } catch (_) { return false; } })();
  const W = (de, en) => EN ? en : de;
  const SEITE = /ambient\.html$/.test(location.pathname) ? "welten" : "buehne";
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  const MODI = {
    buehne: { sym: "🎻", name: W("Musik & Ort", "Music & place"), sub: W("Die Gefährten spielen, dazu klingt der Ort", "The companions play, the place sounds along"), farbe: "#e0a046", seite: "buehne" },
    musik: { sym: "🎵", name: W("Nur Musik", "Music only"), sub: W("Stimmungen der Band, ohne Geräusche", "The band's moods, no ambience"), farbe: "#d0567a", seite: "buehne" },
    klang: { sym: "🌲", name: W("Nur Ort", "Place only"), sub: W("Taverne, Wald, Höhle … ohne Musik", "Tavern, forest, cave … no music"), farbe: "#3fae74", seite: "buehne" },
    welten: { sym: "🌿", name: W("Klangwelten", "Soundscapes"), sub: W("Große Geräuschkulissen zum Eintauchen", "Big immersive soundscapes"), farbe: "#a070d0", seite: "welten" }
  };
  const REIHE = ["buehne", "musik", "klang", "welten"];
  let modus = lies("imres-bb-modus", SEITE === "welten" ? "welten" : "buehne");
  if (!MODI[modus] || MODI[modus].seite !== SEITE) modus = SEITE === "welten" ? "welten" : "buehne";
  const ADRESSE = { buehne: "/index.html?bb=2#buehne", welten: "/ambient.html?bb=2" };

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.bb { position: fixed; inset: 0; z-index: 2147482500; display: flex; flex-direction: column; background:
  radial-gradient(120% 70% at 50% -10%, rgba(224,160,70,.16), transparent 60%), radial-gradient(90% 60% at 100% 110%, rgba(176,58,72,.14), transparent 60%), #120e18;
  color: #ebe2cc; font: 16px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; user-select: none; overflow: hidden; }
.bb[hidden] { display: none; }
html.bb-offen, html.bb-offen body { overflow: hidden !important; }
.bb * { box-sizing: border-box; }
.bb button { font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; }
.bb-kopf { display: flex; align-items: center; gap: 8px; padding: max(10px, env(safe-area-inset-top)) 14px 8px; }
.bb-titel { flex: 1; font: 700 19px/1.1 Georgia, "Times New Roman", serif; color: #f2cf6a; letter-spacing: .02em; }
.bb-titel small { display: block; font: 500 12px system-ui, sans-serif; color: #a89f8f; letter-spacing: 0; margin-top: 2px; }
.bb-chip { border: 1px solid rgba(224,160,70,.45); background: rgba(235,226,204,.06); border-radius: 999px; padding: 7px 12px; font-size: 14px !important; white-space: nowrap; }
.bb-chip.mehr { border-color: rgba(235,226,204,.25); color: #c9bfae; }
.bb-inhalt { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 14px calc(16px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px; }
/* Auswahl */
.bb-wahl h2 { font: 700 24px/1.2 Georgia, serif; color: #f2cf6a; margin: 14px 2px 4px; text-align: center; }
.bb-wahl p.bb-hin { margin: 0 0 6px; text-align: center; color: #a89f8f; font-size: 14px; }
.bb-karte { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; padding: 16px; border-radius: 18px; border: 1px solid color-mix(in srgb, var(--f) 55%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--f) 22%, transparent), rgba(235,226,204,.03)); }
.bb-karte .sym { font-size: 34px; line-height: 1; filter: drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
.bb-karte b { display: block; font-size: 19px; } .bb-karte small { display: block; color: #b8ae9c; font-size: 13.5px; margin-top: 3px; }
.bb-karte.an { box-shadow: 0 0 0 2px var(--f) inset; }
/* Spielen */
.bb-play { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; min-height: 76px; border-radius: 22px; border: 0;
  background: linear-gradient(180deg, #f2cf6a, #c88a20); color: #1d140a !important; font: 800 24px/1 system-ui, sans-serif !important; box-shadow: 0 8px 24px rgba(200,138,32,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
.bb-play.laeuft { background: linear-gradient(180deg, #3a2a3a, #241a26); color: #f2cf6a !important; border: 1px solid rgba(224,160,70,.55); box-shadow: none; }
.bb-play .ic { font-size: 28px; }
.bb-zeile { display: flex; gap: 10px; }
.bb-zeile > button { flex: 1; min-height: 56px; border-radius: 16px; border: 1px solid rgba(235,226,204,.18); background: rgba(235,226,204,.06); font-weight: 700 !important; font-size: 16px !important; }
.bb-zeile .bb-ueber { border-color: rgba(160,112,208,.6); background: linear-gradient(135deg, rgba(160,112,208,.28), rgba(208,86,122,.18)); }
.bb-zeile .bb-blitz { border-color: rgba(176,58,72,.6); background: linear-gradient(135deg, rgba(176,58,72,.3), rgba(224,160,70,.12)); }
.bb-ab { display: flex; align-items: baseline; justify-content: space-between; margin: 4px 2px -4px; }
.bb-ab h3 { margin: 0; font: 700 13px system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #a89f8f; }
.bb-ab button { border: 0; background: none; color: #e0a046; font-size: 14px !important; font-weight: 600 !important; padding: 4px 2px; }
.bb-kacheln { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.bb-kachel { position: relative; min-height: 70px; padding: 10px 12px; border-radius: 16px; text-align: left; border: 1px solid rgba(235,226,204,.14);
  background: rgba(235,226,204,.05); display: flex; align-items: center; gap: 10px; font-weight: 650 !important; font-size: 15.5px !important; line-height: 1.15 !important; overflow: hidden; }
.bb-kachel .sym { font-size: 24px; flex: none; } .bb-kachel > span:last-child { min-width: 0; overflow-wrap: anywhere; }
.bb-kachel.an { border-color: #f2cf6a; background: linear-gradient(135deg, rgba(242,207,106,.28), rgba(200,138,32,.12)); box-shadow: 0 0 18px rgba(242,207,106,.22); }
.bb-kachel.gleich::after { content: "${W("gleich", "next")}"; position: absolute; right: 8px; top: 6px; font-size: 10.5px; font-weight: 700; color: #1d140a; background: #e0a046; border-radius: 6px; padding: 1px 5px; animation: bbpuls 1s ease-in-out infinite; }
@keyframes bbpuls { 50% { opacity: .45; } }
.bb-orte { display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; scroll-snap-type: x proximity; }
.bb-orte::-webkit-scrollbar { display: none; }
.bb-orte button { flex: none; scroll-snap-align: start; border-radius: 999px; border: 1px solid rgba(63,174,116,.45); background: rgba(63,174,116,.1); padding: 10px 14px; font-size: 15px !important; font-weight: 600 !important; white-space: nowrap; }
.bb-orte button.an { background: linear-gradient(135deg, rgba(63,174,116,.45), rgba(63,174,116,.2)); border-color: #6fd6a0; }
.bb-regler { display: flex; flex-direction: column; gap: 14px; padding: 14px; border-radius: 18px; background: rgba(235,226,204,.04); border: 1px solid rgba(235,226,204,.1); }
.bb-regler label { display: grid; grid-template-columns: 8.4em 1fr 2.4em; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; }
.bb-regler output { text-align: right; color: #c9bfae; font-variant-numeric: tabular-nums; font-size: 14px; }
.bb input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 34px; background: transparent; margin: 0; }
.bb input[type=range]::-webkit-slider-runnable-track { height: 10px; border-radius: 5px; background: linear-gradient(90deg, #c88a20 var(--p, 50%), rgba(235,226,204,.14) var(--p, 50%)); }
.bb input[type=range]::-moz-range-track { height: 10px; border-radius: 5px; background: rgba(235,226,204,.14); }
.bb input[type=range]::-moz-range-progress { height: 10px; border-radius: 5px; background: #c88a20; }
.bb input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; margin-top: -10px; border-radius: 50%; background: #f2cf6a; border: 3px solid #241a26; box-shadow: 0 2px 8px rgba(0,0,0,.5); }
.bb input[type=range]::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; background: #f2cf6a; border: 3px solid #241a26; }
.bb-toast { position: fixed; left: 50%; bottom: calc(24px + env(safe-area-inset-bottom)); transform: translateX(-50%) translateY(10px); z-index: 2147482600; max-width: 90vw; padding: 11px 18px; border-radius: 14px;
  background: rgba(24,18,30,.96); border: 1px solid rgba(224,160,70,.6); color: #ebe2cc; font: 600 15px/1.3 system-ui, sans-serif; text-align: center; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; box-shadow: 0 10px 30px rgba(0,0,0,.55); }
.bb-toast.an { opacity: 1; transform: translateX(-50%); }
.bb-laden { text-align: center; color: #a89f8f; padding: 40px 0; }
.bb-oeffner { display: inline-flex; align-items: center; gap: 8px; margin: 14px 0 4px; padding: 12px 18px; border-radius: 999px; border: 1px solid rgba(224,160,70,.6);
  background: linear-gradient(135deg, rgba(242,207,106,.22), rgba(200,138,32,.1)); color: #f2cf6a; font: 700 16px/1 system-ui, sans-serif; cursor: pointer; }
.bb-oeffner small { font-weight: 500; color: #c9bfae; font-size: 13px; }
@media (min-width: 700px) { .bb-inhalt { max-width: 560px; margin: 0 auto; width: 100%; } .bb-kacheln { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
`;
  document.head.appendChild(css);

  /* ---------- Gerüst ---------- */
  const bb = document.createElement("div"); bb.className = "bb"; bb.hidden = true; bb.setAttribute("role", "dialog"); bb.setAttribute("aria-label", "Barden Beats");
  bb.innerHTML = '<div class="bb-kopf"><div class="bb-titel">Barden Beats<small></small></div><button type="button" class="bb-chip" data-bb="wahl"></button><button type="button" class="bb-chip mehr" data-bb="mehr">' + W("Mehr …", "More …") + '</button></div><div class="bb-inhalt"></div>';
  document.body.appendChild(bb);
  const inhalt = $(".bb-inhalt", bb), unterTitel = $(".bb-titel small", bb), wahlChip = $('[data-bb="wahl"]', bb);
  const toast = document.createElement("div"); toast.className = "bb-toast"; document.body.appendChild(toast);
  let toastT = 0;
  const zeige = t => { toast.textContent = t; toast.classList.add("an"); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("an"), 1800); };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Pult fernsteuern (Bühne) ---------- */
  const P = () => window.ImresPult || null;
  const Z = () => { try { return P() && P().zustand; } catch (_) { return null; } };
  const sichtbar = el => !!el && el.getClientRects().length > 0;
  function pultKlick(attr, wert) {
    const root = $("#lautenwerk"); if (!root) return false;
    const echt = $$("[" + attr + '="' + wert + '"]', root).find(sichtbar) || $("[" + attr + '="' + wert + '"]', root);
    if (echt) { echt.click(); return true; }
    const b = document.createElement("button"); b.type = "button"; b.setAttribute(attr, wert); b.hidden = true; root.appendChild(b); b.click(); b.remove(); return true;
  }
  function pultRegler(feld, v) {
    const root = $("#lautenwerk"); if (!root) return;
    let el = $$('[data-feld="' + feld + '"]', root).find(x => x.tagName === "INPUT"), temp = false;
    if (!el) { el = document.createElement("input"); el.type = "range"; el.setAttribute("data-feld", feld); el.hidden = true; root.appendChild(el); temp = true; }
    el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    if (temp) el.remove();
  }
  function musikSpielen() { const r = $("#lautenwerk"); const p = r && ($$(".lw-play", r).find(sichtbar) || $(".lw-play", r)); if (p) { p.click(); return; } const b = document.createElement("button"); b.className = "lw-play"; b.hidden = true; r.appendChild(b); b.click(); b.remove(); }
  /* Namen ohne Emoji vorne, Emoji getrennt */
  const teile = txt => { const s = String(txt || "").trim(); const m = s.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*(.*)$/u); return m ? [m[1], m[2]] : ["", s]; };
  function listen() {
    const p = P(); if (!p || !p.listen) return null;
    try {
      const l = p.listen(), nm = l.namen || {};
      const name = (tab, k) => { const v = tab[k]; return typeof v === "string" ? v : v && (v.name || v.titel || v.de) || k; };
      const symSt = k => { const el = $('#lautenwerk [data-vorlage="' + k + '"]'); return el ? teile(el.textContent)[0] : ""; };
      return {
        st: l.st.map(k => { const [s, n] = teile(name(nm.st, k)); return { k, n: n || k, s: s || symSt(k) || "🎵" }; }),
        kul: l.kul.map(k => { const [s, n] = teile(name(nm.kul, k)); return { k, n: n || k, s: s || "🌲" }; })
      };
    } catch (_) { return null; }
  }

  /* ---------- Klangwelten fernsteuern ---------- */
  const welten = () => $$("[data-welt]").filter((el, i, a) => a.findIndex(x => x.dataset.welt === el.dataset.welt) === i).map(el => {
    const nmEl = el.querySelector(".nm"), symEl = el.querySelector(".sym");
    const [s, n] = teile(nmEl ? nmEl.textContent : el.textContent);
    return { k: el.dataset.welt, n: n || el.dataset.welt, s: (symEl && symEl.textContent.trim()) || s || "🌿", el };
  });
  const weltAn = () => { const a = $(".welt.an[data-welt], [data-welt].an"); return a ? a.dataset.welt : null; };
  const weltRegler = (sel, v) => { const el = $(sel); if (!el) return null; if (v != null) { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } return +el.value; };

  /* ---------- Bildschirm 1: Was soll klingen? ---------- */
  let ansicht = "wahl", seiteSt = 0, seiteKul = 0, seiteW = 0;
  function wahlZeichnen() {
    ansicht = "wahl";
    unterTitel.textContent = W("Musik für eure Runde", "Music for your table"); wahlChip.hidden = true;
    inhalt.innerHTML = '<div class="bb-wahl"><h2>' + W("Was soll klingen?", "What should play?") + '</h2><p class="bb-hin">' + W("Tippen – und los geht's.", "Tap – and off you go.") + "</p></div>" +
      REIHE.map(k => '<button type="button" class="bb-karte' + (k === modus ? " an" : "") + '" style="--f:' + MODI[k].farbe + '" data-bbmodus="' + k + '"><span class="sym">' + MODI[k].sym + "</span><span><b>" + MODI[k].name + "</b><small>" + MODI[k].sub + "</small></span></button>").join("");
  }
  function modusWaehlen(k) {
    if (!MODI[k]) return;
    modus = k; schreib("imres-bb-modus", k);
    if (MODI[k].seite !== SEITE) { schreib("imres-bb", "1"); location.href = ADRESSE[MODI[k].seite]; return; }
    const z = Z();
    if (SEITE === "buehne" && z) {
      if (k === "klang" && z.laeuft) musikSpielen();
      if (k === "musik" && z.kulLaeuft) pultKlick("data-kulisse", "keine");
    }
    spielZeichnen();
  }

  /* ---------- Bildschirm 2: Spielen ---------- */
  const PRO_SEITE = 6;
  const kacheln = (liste, seite, art, aktiv, gleich) => {
    const n = Math.max(1, Math.ceil(liste.length / PRO_SEITE)), s = ((seite % n) + n) % n;
    return liste.slice(s * PRO_SEITE, s * PRO_SEITE + PRO_SEITE).map(x => '<button type="button" class="bb-kachel' + (x.k === aktiv ? " an" : "") + (x.k === gleich && x.k !== aktiv ? " gleich" : "") + '" data-bb' + art + '="' + esc(x.k) + '"><span class="sym">' + esc(x.s) + "</span><span>" + esc(x.n) + "</span></button>").join("");
  };
  const abschnitt = (titel, mehrArt, gesamt) => '<div class="bb-ab"><h3>' + titel + "</h3>" + (gesamt > PRO_SEITE ? '<button type="button" data-bbmehr="' + mehrArt + '">' + W("andere ›", "more ›") + "</button>" : "") + "</div>";
  const regler = (id, name, wert, lo, hi) => '<label><span>' + name + '</span><input type="range" data-bbregler="' + id + '" min="' + lo + '" max="' + hi + '" step="1" value="' + wert + '" style="--p:' + Math.round((wert - lo) / (hi - lo) * 100) + '%"><output>' + Math.round((wert - lo) / (hi - lo) * 100) + "</output></label>";
  function spielZeichnen() {
    ansicht = "spiel"; wahlChip.hidden = false;
    wahlChip.textContent = MODI[modus].sym + " " + MODI[modus].name + " ▾"; wahlChip.style.borderColor = MODI[modus].farbe;
    let h = "";
    if (SEITE === "welten") {
      const l = welten(); if (!l.length) { inhalt.innerHTML = '<p class="bb-laden">' + W("Klangwelten werden geladen …", "Loading soundscapes …") + "</p>"; setTimeout(spielZeichnen, 500); return; }
      const an = weltAn();
      unterTitel.textContent = an ? "🌿 " + (l.find(x => x.k === an) || {}).n : W("Wähle eine Welt", "Pick a world");
      h += playKnopf(!!an);
      h += '<div class="bb-zeile"><button type="button" class="bb-blitz" data-bb="blitz">⚡ ' + W("Geräusch", "Sound") + '</button><button type="button" class="bb-ueber" data-bb="ueber">🎲 ' + W("Überrasch mich", "Surprise me") + "</button></div>";
      h += abschnitt("🌿 " + W("Welten", "Worlds"), "w", l.length) + '<div class="bb-kacheln">' + kacheln(l, seiteW, "welt", an) + "</div>";
      h += '<div class="bb-regler">' + regler("gesamt", "🔊 " + W("Lautstärke", "Volume"), weltRegler("#gesamt") ?? 70, 0, 100) +
        ($('[data-regler="spannung"]') ? regler("wspannung", "😨 " + W("Spannung", "Tension"), weltRegler('[data-regler="spannung"]') ?? 0, 0, 100) : "") + "</div>";
      inhalt.innerHTML = h; return;
    }
    const L = listen(), z = Z();
    if (!L || !z) { inhalt.innerHTML = '<p class="bb-laden">🎻 ' + W("Die Gefährten stimmen ihre Instrumente …", "The companions are tuning up …") + "</p>"; setTimeout(spielZeichnen, 400); return; }
    const stN = (L.st.find(x => x.k === z.stimmung) || {}).n, kulN = (L.kul.find(x => x.k === z.kulisse || (x.k === "wald" && z.kulisse === "waldnacht")) || {}).n;
    unterTitel.textContent = modus === "klang" ? (z.kulLaeuft && kulN ? "🌲 " + kulN : W("Wähle einen Ort", "Pick a place")) :
      (z.laeuft && stN ? "🎵 " + stN + (modus === "buehne" && z.kulLaeuft && kulN ? " · 🌲 " + kulN : "") : W("Wähle eine Stimmung", "Pick a mood"));
    h += playKnopf(modus === "klang" ? z.kulLaeuft : z.laeuft);
    h += '<div class="bb-zeile">' + (modus !== "musik" ? '<button type="button" class="bb-blitz" data-bb="blitz">⚡ ' + W("Etwas passiert", "Something happens") + "</button>" : "") + '<button type="button" class="bb-ueber" data-bb="ueber">🎲 ' + W("Überrasch mich", "Surprise me") + "</button></div>";
    const kulAktiv = z.kulLaeuft ? (z.kulisse === "waldnacht" ? "wald" : z.kulisse) : null;
    if (modus === "klang") {
      h += abschnitt("🌲 " + W("Orte", "Places"), "kul", L.kul.length) + '<div class="bb-kacheln">' + kacheln(L.kul, seiteKul, "kul", kulAktiv) + "</div>";
    } else {
      h += abschnitt("🎵 " + W("Stimmungen", "Moods"), "st", L.st.length) + '<div class="bb-kacheln">' + kacheln(L.st, seiteSt, "st", z.laeuft ? z.stimmung : null, z.naechste) + "</div>";
      if (modus === "buehne") h += '<div class="bb-ab"><h3>🌲 ' + W("Ort", "Place") + '</h3></div><div class="bb-orte">' + L.kul.map(x => '<button type="button" data-bbkul="' + esc(x.k) + '" class="' + (x.k === kulAktiv ? "an" : "") + '">' + esc(x.s) + " " + esc(x.n) + "</button>").join("") + "</div>";
    }
    h += '<div class="bb-regler">' + (modus !== "klang" ? regler("master", "🎵 " + W("Musik", "Music"), Math.round(z.master ?? 8), 0, 10) : "") +
      (modus !== "musik" ? regler("kulvol", "🌲 " + W("Hintergrund", "Backdrop"), Math.round(z.kulisseVol ?? 5), 0, 10) : "") + "</div>";
    const scroll = inhalt.scrollTop, orteScroll = $(".bb-orte", inhalt) ? $(".bb-orte", inhalt).scrollLeft : 0;
    inhalt.innerHTML = h; inhalt.scrollTop = scroll; const o = $(".bb-orte", inhalt); if (o) o.scrollLeft = orteScroll;
  }
  const playKnopf = laeuft => '<button type="button" class="bb-play' + (laeuft ? " laeuft" : "") + '" data-bb="play"><span class="ic">' + (laeuft ? "■" : "▶") + "</span>" + (laeuft ? W("Anhalten", "Stop") : W("Spielen", "Play")) + "</button>";

  /* ---------- Aktionen ---------- */
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  function stimmungWaehlen(k) {
    pultKlick("data-vorlage", k);
    if (modus === "musik") setTimeout(() => { const z = Z(); if (z && z.kulLaeuft) pultKlick("data-kulisse", "keine"); }, 60);
  }
  function ortWaehlen(k) {
    if (modus === "klang") { const z = Z(); if (z && z.laeuft) musikSpielen(); }
    pultKlick("data-kulisse", k);
  }
  function aktion(was) {
    if (SEITE === "welten") {
      if (was === "play") { const s = $("#spielen"); if (s) s.click(); else if (!weltAn()) { const l = welten(); if (l[0]) l[0].el.click(); } }
      else if (was === "blitz") { const l = $$("[data-ger]"); const el = zufall(l); if (el) { el.click(); zeige("⚡ " + teile(el.textContent)[1]); } }
      else if (was === "ueber") { const l = welten().filter(x => x.k !== weltAn()); const w = zufall(l); if (w) { w.el.click(); zeige("🎲 " + w.n); } }
      setTimeout(spielZeichnen, 120); return;
    }
    const z = Z() || {}, L = listen(); if (!L) return;
    if (was === "play") {
      if (modus === "klang") { if (z.kulLaeuft) pultKlick("data-aktion", "kulumschalt"); else ortWaehlen(z.kulisse && z.kulisse !== "keine" ? z.kulisse : L.kul[0].k); }
      else if (z.laeuft) musikSpielen(); else { stimmungWaehlen(z.stimmung && L.st.some(x => x.k === z.stimmung) ? z.stimmung : L.st[0].k); if (!(Z() || {}).laeuft) musikSpielen(); }
    } else if (was === "blitz") { pultKlick("data-aktion", "passiert"); zeige("⚡ " + W("Etwas passiert …", "Something happens …")); }
    else if (was === "ueber") {
      if (modus === "klang") { const o = zufall(L.kul.filter(x => x.k !== z.kulisse)); ortWaehlen(o.k); zeige("🎲 " + o.s + " " + o.n); }
      else {
        const s = zufall(L.st.slice(0, 18).filter(x => x.k !== z.stimmung)); stimmungWaehlen(s.k);
        let text = "🎲 " + s.s + " " + s.n;
        if (modus === "buehne") { const o = zufall(L.kul.slice(0, 14).filter(x => x.k !== z.kulisse)); setTimeout(() => ortWaehlen(o.k), 120); text += " · " + o.s + " " + o.n; }
        zeige(text);
      }
    }
    setTimeout(spielZeichnen, 150);
  }

  bb.addEventListener("click", e => {
    const t = e.target;
    const m = t.closest("[data-bbmodus]"); if (m) { modusWaehlen(m.dataset.bbmodus); return; }
    const st = t.closest("[data-bbst]"); if (st) { stimmungWaehlen(st.dataset.bbst); setTimeout(spielZeichnen, 150); return; }
    const ku = t.closest("[data-bbkul]"); if (ku) { ortWaehlen(ku.dataset.bbkul); setTimeout(spielZeichnen, 150); return; }
    const we = t.closest("[data-bbwelt]"); if (we) { const w = welten().find(x => x.k === we.dataset.bbwelt); if (w) w.el.click(); setTimeout(spielZeichnen, 150); return; }
    const me = t.closest("[data-bbmehr]"); if (me) { if (me.dataset.bbmehr === "st") seiteSt++; else if (me.dataset.bbmehr === "kul") seiteKul++; else seiteW++; spielZeichnen(); return; }
    const a = t.closest("[data-bb]"); if (!a) return;
    if (a.dataset.bb === "wahl") { wahlZeichnen(); return; }
    if (a.dataset.bb === "mehr") { schliessen(); return; }
    aktion(a.dataset.bb);
  });
  let reglerAktiv = 0;
  bb.addEventListener("input", e => {
    const r = e.target.closest("[data-bbregler]"); if (!r) return;
    reglerAktiv = Date.now();
    const v = +r.value, lo = +r.min, hi = +r.max; r.style.setProperty("--p", Math.round((v - lo) / (hi - lo) * 100) + "%"); r.nextElementSibling.textContent = Math.round((v - lo) / (hi - lo) * 100);
    const id = r.dataset.bbregler;
    if (id === "master" || id === "kulvol") pultRegler(id, v);
    else if (id === "gesamt") weltRegler("#gesamt", v);
    else if (id === "wspannung") weltRegler('[data-regler="spannung"]', v);
  });
  /* regelmäßig nachziehen, was gerade läuft (nicht während jemand schiebt) */
  let merk = "";
  setInterval(() => {
    if (bb.hidden || ansicht !== "spiel" || Date.now() - reglerAktiv < 1500) return;
    const z = Z(), s = SEITE === "welten" ? String(weltAn()) + welten().length : z ? [z.laeuft, z.stimmung, z.naechste, z.kulisse, z.kulLaeuft, z.master, z.kulisseVol].join("|") : "";
    if (s !== merk) { merk = s; spielZeichnen(); }
  }, 600);

  /* ---------- Öffnen / Schließen ---------- */
  function oeffnen(direkt) {
    bb.hidden = false; document.documentElement.classList.add("bb-offen"); schreib("imres-bb", "1");
    if (direkt) spielZeichnen(); else wahlZeichnen();
  }
  function schliessen() {
    bb.hidden = true; document.documentElement.classList.remove("bb-offen"); schreib("imres-bb", "0");
    try { const u = new URL(location.href); u.searchParams.delete("bb"); history.replaceState(null, "", u.pathname + (u.search || "") + u.hash); } catch (_) {}
    const ziel = SEITE === "buehne" ? $("#lautenwerk") : null; if (ziel) ziel.scrollIntoView({ block: "start" });
  }
  window.__bardenbeats = { oeffnen, schliessen };
  const q = new URLSearchParams(location.search).get("bb");
  if (q != null) oeffnen(q === "2"); else if (window.__bbJetzt) oeffnen();
})();
