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
  /* immer Musik & Ort – die anderen Bereiche gibt es klein über den Knopf oben */
  let modus = SEITE === "welten" ? "welten" : "buehne";
  if (!MODI[modus] || MODI[modus].seite !== SEITE) modus = SEITE === "welten" ? "welten" : "buehne";
  const ADRESSE = { buehne: "/index.html?bb=2#buehne", welten: "/ambient.html?bb=2" };

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.bb-app { position: fixed; inset: 0; z-index: 2147482500; display: flex; flex-direction: column; background:
  radial-gradient(120% 70% at 50% -10%, rgba(224,160,70,.16), transparent 60%), radial-gradient(90% 60% at 100% 110%, rgba(176,58,72,.14), transparent 60%), #120e18;
  color: #ebe2cc; font: 16px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; user-select: none; overflow: hidden; }
.bb-app[hidden] { display: none; }
html.bb-offen, html.bb-offen body { overflow: hidden !important; }
.bb-app * { box-sizing: border-box; }
.bb-app button { font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; }
.bb-kopf { display: flex; align-items: center; gap: 8px; padding: max(10px, env(safe-area-inset-top)) 14px 8px; }
.bb-titel { flex: 1; font: 700 19px/1.1 Georgia, "Times New Roman", serif; color: #f2cf6a; letter-spacing: .02em; }
.bb-titel small { display: block; font: 500 12px system-ui, sans-serif; color: #a89f8f; letter-spacing: 0; margin-top: 2px; }
.bb-chip[data-bb="wahl"] { min-width: 44px; min-height: 40px; padding: 6px 12px; font-size: 18px !important; }
.bb-chip { border: 1px solid rgba(224,160,70,.45); background: rgba(235,226,204,.06); border-radius: 999px; padding: 7px 12px; font-size: 14px !important; white-space: nowrap; }
.bb-chip.mehr { border-color: rgba(235,226,204,.25); color: #c9bfae; }
.bb-inhalt { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; padding: 4px 14px 18px; display: flex; flex-direction: column; gap: 12px; }
.bb-inhalt > * { flex: none; }
.bb-leiste { flex: none; display: flex; gap: 10px; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(224,160,70,.25); background: rgba(18,14,24,.97); box-shadow: 0 -8px 24px rgba(0,0,0,.45); }
.bb-leiste[hidden] { display: none; }
.bb-laut { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.bb-laut .nm { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #c9bfae; padding: 0 4px; white-space: nowrap; }
.bb-laut .nm b { color: #f2cf6a; font-variant-numeric: tabular-nums; }
.bb-laut .reihe { display: flex; align-items: center; gap: 6px; }
.bb-laut .pm { flex: none; width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(224,160,70,.45); background: rgba(235,226,204,.07); font-size: 22px !important; font-weight: 700 !important; line-height: 1 !important; padding: 0; }
.bb-laut .pm:active { background: rgba(224,160,70,.3); }
.bb-balken { position: relative; flex: 1; min-width: 0; height: 40px; border-radius: 12px; background: rgba(235,226,204,.1); overflow: hidden; touch-action: none; cursor: pointer; }
.bb-balken i { position: absolute; left: 0; top: 0; bottom: 0; width: var(--p, 50%); background: linear-gradient(90deg, #a8701e, #f2cf6a); border-radius: 12px 0 0 12px; }
.bb-balken.allein { touch-action: none; }
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
.bb-oben { display: flex; gap: 12px; align-items: center; }
.bb-seite { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.bb-oben .bb-play { min-height: 64px; border-radius: 18px; flex-direction: column; gap: 3px; font-size: 19px !important; padding: 8px 6px; }
.bb-oben .bb-play .ic { font-size: 20px; }
.bb-oben .bb-play small { font: 600 11.5px/1.2 system-ui, sans-serif; opacity: .8; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bb-klein { min-height: 40px; border-radius: 12px; border: 1px solid rgba(176,58,72,.6); background: linear-gradient(135deg, rgba(176,58,72,.3), rgba(224,160,70,.12)); font-weight: 700 !important; font-size: 14px !important; }
.bb-uhr-box { flex: none; width: 176px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.bb-uhr { position: relative; width: 172px; height: 172px; border-radius: 50%; touch-action: none; cursor: pointer;
  background: radial-gradient(circle at 50% 50%, #2a2030 0 38%, transparent 39%), conic-gradient(rgba(242,207,106,.6), rgba(200,50,60,.6) 25%, rgba(110,80,140,.65) 50%, rgba(63,174,116,.55) 75%, rgba(242,207,106,.6));
  box-shadow: inset 0 0 0 2px rgba(224,160,70,.55), inset 0 0 0 7px rgba(18,14,24,.55), 0 4px 14px rgba(0,0,0,.45); }
.bb-uhr .e { position: absolute; font-size: 28px; line-height: 1; transform: translate(-50%, -50%); pointer-events: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.7)); }
.bb-uhr .zeiger { position: absolute; left: 50%; top: 50%; width: 7px; height: 56px; margin-left: -3.5px; border-radius: 3px; background: linear-gradient(#fff3c4, #e0a046);
  transform-origin: 50% 0; transform: rotate(var(--w, 180deg)); box-shadow: 0 0 8px rgba(242,207,106,.7); pointer-events: none; transition: transform .35s cubic-bezier(.3,1.4,.5,1); }
.bb-uhr .zeiger.mitte { height: 0; }
.bb-uhr .nabe { position: absolute; left: 50%; top: 50%; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; background: #f2cf6a; box-shadow: 0 0 0 3px #241a26; pointer-events: none; }
.bb-uhr-box .wort { font: 700 14px/1.1 system-ui, sans-serif; color: #f2cf6a; text-align: center; min-height: 1.1em; }
.bb-auto { border-radius: 999px; padding: 3px 9px; font-size: 11.5px !important; font-weight: 700 !important; border: 1px solid rgba(235,226,204,.25); background: rgba(235,226,204,.06); color: #c9bfae; }
.bb-auto.an { border-color: #6fd6a0; background: rgba(63,174,116,.22); color: #c8f2da; }
.bb-ab { display: flex; align-items: baseline; justify-content: space-between; margin: 4px 2px -4px; }
.bb-ab h3 { margin: 0; font: 700 13px system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #a89f8f; }
.bb-ab button { border: 0; background: none; color: #e0a046; font-size: 14px !important; font-weight: 600 !important; padding: 4px 2px; }
.bb-kacheln { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.bb-kachel { position: relative; min-height: 70px; padding: 10px 12px; border-radius: 16px; text-align: left; border: 1px solid rgba(235,226,204,.14);
  background: rgba(235,226,204,.05); display: flex; align-items: center; gap: 10px; font-weight: 650 !important; font-size: 15.5px !important; line-height: 1.15 !important; overflow: hidden; }
.bb-kachel .sym { font-size: 24px; flex: none; } .bb-kachel > span:last-child { min-width: 0; hyphens: auto; -webkit-hyphens: auto; overflow-wrap: break-word; }
.bb-kachel.an { border-color: #f2cf6a; background: linear-gradient(135deg, rgba(242,207,106,.28), rgba(200,138,32,.12)); box-shadow: 0 0 18px rgba(242,207,106,.22); }
.bb-kachel.gleich::after { content: "${W("gleich", "next")}"; position: absolute; right: 8px; top: 6px; font-size: 10.5px; font-weight: 700; color: #1d140a; background: #e0a046; border-radius: 6px; padding: 1px 5px; animation: bbpuls 1s ease-in-out infinite; }
@keyframes bbpuls { 50% { opacity: .45; } }
.bb-mini { display: flex; gap: 10px; padding: 8px 12px; border-radius: 14px; background: rgba(235,226,204,.04); border: 1px solid rgba(235,226,204,.1); }
.bb-mini label { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0; font: 700 11.5px/1.2 system-ui, sans-serif; color: #c9bfae; }
.bb-mini label span { gap: 4px; white-space: nowrap; } .bb-mini output { overflow: hidden; text-overflow: ellipsis; }
.bb-mini label span { display: flex; justify-content: space-between; } .bb-mini output { color: #f2cf6a; }
.bb-mini input[type=range] { height: 26px; }
.bb-chips { display: flex; gap: 6px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; }
.bb-chips::-webkit-scrollbar { display: none; }
.bb-chips button { flex: none; border-radius: 999px; border: 1px solid rgba(224,160,70,.35); background: rgba(235,226,204,.05); padding: 7px 11px; font-size: 13.5px !important; font-weight: 600 !important; white-space: nowrap; position: relative; }
.bb-chips button.an { border-color: #f2cf6a; background: linear-gradient(135deg, rgba(242,207,106,.32), rgba(200,138,32,.14)); }
.bb-chips button.gleich { border-color: #e0a046; animation: bbpuls 1s ease-in-out infinite; }
.bb-kacheln.ort { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.bb-kacheln.ort .bb-kachel { min-height: 62px; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 4px; padding: 8px 4px; font-size: 13.5px !important; border-color: rgba(63,174,116,.3); background: rgba(63,174,116,.07); }
.bb-kacheln.ort .bb-kachel .sym { font-size: 26px; }
.bb-kacheln.ort .bb-kachel.an { border-color: #6fd6a0; background: linear-gradient(135deg, rgba(63,174,116,.45), rgba(63,174,116,.18)); box-shadow: 0 0 16px rgba(63,174,116,.3); }
.bb-orte { display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 6px; scrollbar-width: none; scroll-snap-type: x proximity; }
.bb-orte::-webkit-scrollbar { display: none; }
.bb-orte button { flex: none; scroll-snap-align: start; border-radius: 999px; border: 1px solid rgba(63,174,116,.45); background: rgba(63,174,116,.1); padding: 10px 14px; font-size: 15px !important; font-weight: 600 !important; white-space: nowrap; }
.bb-orte button.an { background: linear-gradient(135deg, rgba(63,174,116,.45), rgba(63,174,116,.2)); border-color: #6fd6a0; }
.bb-regler { display: flex; flex-direction: column; gap: 14px; padding: 14px; border-radius: 18px; background: rgba(235,226,204,.04); border: 1px solid rgba(235,226,204,.1); }
.bb-regler label { display: grid; grid-template-columns: 8.4em 1fr 2.4em; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; }
.bb-regler output { text-align: right; color: #c9bfae; font-variant-numeric: tabular-nums; font-size: 14px; }
.bb-app input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 34px; background: transparent; margin: 0; }
.bb-app input[type=range]::-webkit-slider-runnable-track { height: 10px; border-radius: 5px; background: linear-gradient(90deg, #c88a20 var(--p, 50%), rgba(235,226,204,.14) var(--p, 50%)); }
.bb-app input[type=range]::-moz-range-track { height: 10px; border-radius: 5px; background: rgba(235,226,204,.14); }
.bb-app input[type=range]::-moz-range-progress { height: 10px; border-radius: 5px; background: #c88a20; }
.bb-app input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; margin-top: -10px; border-radius: 50%; background: #f2cf6a; border: 3px solid #241a26; box-shadow: 0 2px 8px rgba(0,0,0,.5); }
.bb-app input[type=range]::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; background: #f2cf6a; border: 3px solid #241a26; }
.bb-toast { position: fixed; left: 50%; bottom: calc(118px + env(safe-area-inset-bottom)); transform: translateX(-50%) translateY(10px); z-index: 2147482600; max-width: 90vw; padding: 11px 18px; border-radius: 14px;
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
  const bb = document.createElement("div"); bb.className = "bb-app"; bb.hidden = true; bb.setAttribute("role", "dialog"); bb.lang = EN ? "en" : "de"; bb.setAttribute("aria-label", "Barden Beats");
  bb.innerHTML = '<div class="bb-kopf"><div class="bb-titel">Barden Beats<small></small></div><button type="button" class="bb-chip" data-bb="wahl"></button><button type="button" class="bb-chip mehr" data-bb="mehr">' + W("Mehr …", "More …") + '</button></div><div class="bb-inhalt"></div><div class="bb-leiste" hidden></div>';
  document.body.appendChild(bb);
  const leiste = $(".bb-leiste", bb), inhalt = $(".bb-inhalt", bb), unterTitel = $(".bb-titel small", bb), wahlChip = $('[data-bb="wahl"]', bb);
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
      const LIEB = ["rast", "kampf", "spannung", "reise", "zwerge"];
      const st = LIEB.filter(k => l.st.includes(k)).concat(l.st.filter(k => !LIEB.includes(k)));
      return { lieb: LIEB.filter(k => l.st.includes(k)).length,
        st: st.map(k => { const [s, n] = teile(name(nm.st, k)); return { k, n: n || k, s: s || symSt(k) || "🎵" }; }),
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
    ansicht = "wahl"; leiste.hidden = true;
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
  const kacheln = (liste, seite, art, aktiv, gleich, mehrArt) => {
    const pro = mehrArt ? PRO_SEITE - 1 : PRO_SEITE, n = Math.max(1, Math.ceil(liste.length / pro)), s = ((seite % n) + n) % n;
    const mehr = mehrArt && n > 1 ? '<button type="button" class="bb-kachel bb-weiter" data-bbmehr="' + mehrArt + '"><span class="sym">' + (s === n - 1 ? "↺" : "➕") + "</span><span>" + (s === n - 1 ? W("Zurück zum Anfang", "Back to start") : W("Weitere Stimmungen", "More moods") + " <small>" + (s + 1) + "/" + n + "</small>") + "</span></button>" : "";
    return liste.slice(s * pro, s * pro + pro).map(x => '<button type="button" class="bb-kachel' + (x.k === aktiv ? " an" : "") + (x.k === gleich && x.k !== aktiv ? " gleich" : "") + '" data-bb' + art + '="' + esc(x.k) + '"><span class="sym">' + esc(x.s) + "</span><span>" + esc(x.n) + "</span></button>").join("") + mehr;
  };
  const abschnitt = (titel, mehrArt, gesamt) => '<div class="bb-ab"><h3>' + titel + "</h3>" + (gesamt > PRO_SEITE ? '<button type="button" data-bbmehr="' + mehrArt + '">' + W("andere ›", "more ›") + "</button>" : "") + "</div>";
  let raumV = 0, raumName = "";
  const RAUM_KURZ = { stube: W("Stube", "Room"), taverne: W("Taverne", "Tavern"), kapelle: W("Kapelle", "Chapel"), palast: W("Saal", "Hall"), hoehle: W("Höhle", "Cave") };
  const raumText = () => Math.abs(raumV) < .08 ? W("passend", "matching") : raumV < 0 ? (raumV < -.9 ? W("trocken", "dry") : W("trockener", "drier")) : (RAUM_KURZ[raumName] || W("hallig", "echoing"));
  function raumSetzen(v) {
    raumV = v; const p = P(); if (!p || !p.raumOrt) return;
    try { const r = p.raumOrt(v); raumName = r.raum; } catch (_) {}
    const o = $('[data-bbregler="raum"]', bb); if (o) { const out = o.parentNode.querySelector("output"); if (out) out.textContent = raumText(); }
  }
  const mini = (id, name, wert, lo, hi) => '<label><span>' + name + "<output>" + Math.round((wert - lo) / (hi - lo) * 100) + '</output></span><input type="range" data-bbregler="' + id + '" min="' + lo + '" max="' + hi + '" step="1" value="' + wert + '" style="--p:' + Math.round((wert - lo) / (hi - lo) * 100) + '%"></label>';
  const regler = (id, name, wert, lo, hi) => '<label><span>' + name + '</span><input type="range" data-bbregler="' + id + '" min="' + lo + '" max="' + hi + '" step="1" value="' + wert + '" style="--p:' + Math.round((wert - lo) / (hi - lo) * 100) + '%"><output>' + Math.round((wert - lo) / (hi - lo) * 100) + "</output></label>";
  function spielZeichnen() {
    ansicht = "spiel"; wahlChip.hidden = false;
    wahlChip.textContent = modus === "buehne" ? "☰" : MODI[modus].sym + " ▾"; wahlChip.title = W("Andere Bereiche: nur Musik, nur Ort, Klangwelten", "Other modes"); wahlChip.style.borderColor = MODI[modus].farbe;
    let h = "";
    if (SEITE === "welten") {
      const l = welten(); if (!l.length) { inhalt.innerHTML = '<p class="bb-laden">' + W("Klangwelten werden geladen …", "Loading soundscapes …") + "</p>"; setTimeout(spielZeichnen, 500); return; }
      const an = weltAn();
      unterTitel.textContent = an ? "🌿 " + (l.find(x => x.k === an) || {}).n : W("Wähle eine Welt", "Pick a world");
      h += playKnopf(!!an);
      h += '<div class="bb-zeile"><button type="button" class="bb-blitz" data-bb="blitz">⚡ ' + W("Geräusch", "Sound") + '</button><button type="button" class="bb-ueber" data-bb="ueber">🎲 ' + W("Überrasch mich", "Surprise me") + "</button></div>";
      h += abschnitt("🌿 " + W("Welten", "Worlds"), "w", l.length) + '<div class="bb-kacheln">' + kacheln(l, seiteW, "welt", an) + "</div>";
      leisteZeichnen([["gesamt", "🔊 " + W("Lautstärke", "Volume"), weltRegler("#gesamt") ?? 70],
        $('[data-regler="spannung"]') ? ["wspannung", "😨 " + W("Spannung", "Tension"), weltRegler('[data-regler="spannung"]') ?? 0] : null]);
      inhaltSetzen(h); return;
    }
    const L = listen(), z = Z();
    if (!L || !z) { inhalt.innerHTML = '<p class="bb-laden">🎻 ' + W("Die Gefährten stimmen ihre Instrumente …", "The companions are tuning up …") + "</p>"; setTimeout(spielZeichnen, 400); return; }
    const stN = (L.st.find(x => x.k === z.stimmung) || {}).n, kulN = (L.kul.find(x => x.k === z.kulisse || (x.k === "wald" && z.kulisse === "waldnacht")) || {}).n;
    unterTitel.textContent = modus === "klang" ? (z.kulLaeuft && kulN ? "🌲 " + kulN : W("Wähle einen Ort", "Pick a place")) :
      (z.laeuft && stN ? "🎵 " + stN + (modus === "buehne" && z.kulLaeuft && kulN ? " · 🌲 " + kulN : "") : W("Wähle eine Stimmung", "Pick a mood"));
    if (modus === "klang") h += playKnopf(z.kulLaeuft);
    else h += '<div class="bb-oben">' + uhrHtml() + '<div class="bb-seite">' + playKnopf(z.laeuft, z.laeuft && stN ? (L.st.find(x => x.k === z.stimmung) || {}).s + " " + (z.lied ? "„" + z.lied + "“" : stN) : W("Dreh die Uhr", "Turn the dial")) +
      (modus === "buehne" ? '<button type="button" class="bb-klein" data-bb="blitz">⚡ ' + W("Etwas passiert", "Something happens") + "</button>" : "") +
      '<button type="button" class="bb-auto' + (autoAn ? " an" : "") + '" data-bb="auto">🤖 Auto ' + (autoAn ? W("an", "on") : W("aus", "off")) + "</button></div></div>";
    /* kleine Zusatzregler: wie viel los ist (Musik) und Spannung (Ort) */
    h += '<div class="bb-mini">' + (modus !== "klang" ? mini("int", "🔥 " + W("Wie viel los", "How busy"), Math.round(z.intensitaet ?? 5), 0, 10) : "") +
      (modus !== "musik" ? mini("spann", "😨 " + W("Spannung", "Tension"), Math.round((z.spannung || 0) * 100), 0, 100) : "") +
      '<label><span>🏛 ' + W("Raum", "Room") + "<output>" + esc(raumText()) + '</output></span><input type="range" data-bbregler="raum" min="-100" max="100" step="5" value="' + Math.round(raumV * 100) + '" style="--p:' + Math.round((raumV + 1) * 50) + '%"></label></div>';
    if (modus === "klang") h += '<div class="bb-zeile"><button type="button" class="bb-blitz" data-bb="blitz">⚡ ' + W("Etwas passiert", "Something happens") + '</button><button type="button" class="bb-ueber" data-bb="ueber">🎲 ' + W("Überrasch mich", "Surprise me") + "</button></div>";
    const kulAktiv = z.kulLaeuft ? (z.kulisse === "waldnacht" ? "wald" : z.kulisse) : null;
    if (modus === "klang") {
      h += abschnitt("🌲 " + W("Orte", "Places"), "kul", L.kul.length) + '<div class="bb-kacheln">' + kacheln(L.kul, seiteKul, "kul", kulAktiv) + "</div>";
    } else {
      if (modus === "musik") h += '<div class="bb-ab"><h3>🎵 ' + (seiteSt % Math.ceil(L.st.length / (PRO_SEITE - 1)) === 0 ? W("Vorschläge", "Suggestions") : W("Stimmungen", "Moods")) + '</h3></div><div class="bb-kacheln">' + kacheln(L.st, seiteSt, "st", z.laeuft ? z.stimmung : null, z.naechste, "st") + "</div>";
      else {
        h += '<div class="bb-ab"><h3>🎵 ' + W("Stimmung", "Mood") + '</h3></div><div class="bb-chips">' + L.st.map(x => '<button type="button" data-bbst="' + esc(x.k) + '" class="' + (z.laeuft && x.k === z.stimmung ? "an" : x.k === z.naechste ? "gleich" : "") + '">' + esc(x.s) + " " + esc(x.n) + "</button>").join("") + "</div>";
        h += '<div class="bb-ab"><h3>🌲 ' + W("Ort", "Place") + '</h3></div><div class="bb-kacheln ort">' + L.kul.map(x => '<button type="button" class="bb-kachel' + (x.k === kulAktiv ? " an" : "") + '" data-bbkul="' + esc(x.k) + '"><span class="sym">' + esc(x.s) + "</span><span>" + esc(x.n) + "</span></button>").join("") + "</div>";
      }
    }
    leisteZeichnen([modus !== "klang" ? ["master", "🎵 " + W("Musik", "Music"), Math.round((z.master ?? 8) * 10)] : null,
      modus !== "musik" ? ["kulvol", "🌲 " + W("Hintergrund", "Backdrop"), Math.round((z.kulisseVol ?? 5) * 10)] : null]);
    inhaltSetzen(h);
  }
  function inhaltSetzen(h) {
    const scroll = inhalt.scrollTop, quer = {}; [".bb-orte", ".bb-chips"].forEach(c => { const e = $(c, inhalt); if (e) quer[c] = e.scrollLeft; });
    inhalt.innerHTML = h; inhalt.scrollTop = scroll; Object.keys(quer).forEach(c => { const e = $(c, inhalt); if (e) e.scrollLeft = quer[c]; });
  }
  /* unten: zwei Lautstärken nebeneinander, mit − / + (5 %) und zum Antippen oder Ziehen */
  const WERTE = {};
  function leisteZeichnen(l) {
    l = l.filter(Boolean); leiste.hidden = !l.length;
    leiste.innerHTML = l.map(([id, name, v]) => { WERTE[id] = v; return '<div class="bb-laut" data-bblaut="' + id + '"><div class="nm"><span>' + name + "</span><b>" + Math.round(v) + ' %</b></div><div class="reihe">' +
      '<button type="button" class="pm" data-bbpm="-5" aria-label="leiser">−</button><div class="bb-balken" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(v) + '" style="--p:' + v + '%"><i></i></div>' +
      '<button type="button" class="pm" data-bbpm="5" aria-label="lauter">+</button></div></div>'; }).join("");
  }
  function lautSetzen(id, v) {
    v = Math.max(0, Math.min(100, Math.round(v))); WERTE[id] = v; reglerAktiv = Date.now();
    const box = $('[data-bblaut="' + id + '"]', leiste); if (box) { $(".bb-balken", box).style.setProperty("--p", v + "%"); $(".bb-balken", box).setAttribute("aria-valuenow", v); $(".nm b", box).textContent = v + " %"; }
    if (id === "master" || id === "kulvol") pultRegler(id, v / 10);
    else if (id === "gesamt") weltRegler("#gesamt", v);
    else if (id === "wspannung") weltRegler('[data-regler="spannung"]', v);
  }
  /* − / +: tippen = 5 %, gedrückt halten = weiterlaufen */
  let halten = 0;
  leiste.addEventListener("pointerdown", e => {
    const pm = e.target.closest("[data-bbpm]"), box = e.target.closest("[data-bblaut]"); if (!box) return;
    const id = box.dataset.bblaut;
    if (pm) {
      e.preventDefault(); const d = +pm.dataset.bbpm; lautSetzen(id, (WERTE[id] || 0) + d);
      clearInterval(halten); const t0 = Date.now();
      halten = setInterval(() => { if (Date.now() - t0 > 400) lautSetzen(id, (WERTE[id] || 0) + d); }, 110);
      const los = () => { clearInterval(halten); removeEventListener("pointerup", los); removeEventListener("pointercancel", los); };
      addEventListener("pointerup", los); addEventListener("pointercancel", los); return;
    }
    const balken = e.target.closest(".bb-balken"); if (!balken) return;
    e.preventDefault(); balken.setPointerCapture && balken.setPointerCapture(e.pointerId);
    const stell = ev => { const r = balken.getBoundingClientRect(); lautSetzen(id, (ev.clientX - r.left) / r.width * 100); };
    stell(e);
    const zieh = ev => stell(ev), los = () => { balken.removeEventListener("pointermove", zieh); balken.removeEventListener("pointerup", los); balken.removeEventListener("pointercancel", los); };
    balken.addEventListener("pointermove", zieh); balken.addEventListener("pointerup", los); balken.addEventListener("pointercancel", los);
  });
  const playKnopf = (laeuft, unter) => '<button type="button" class="bb-play' + (laeuft ? " laeuft" : "") + '" data-bb="play"><span><span class="ic">' + (laeuft ? "■" : "▶") + "</span> " + (laeuft ? W("Anhalten", "Stop") : W("Spielen", "Play")) + "</span>" + (unter ? "<small>" + esc(unter) + "</small>" : "") + "</button>";

  /* ---------- Stimmungs-Regler: fröhlich (oben) · wild (rechts) · traurig (unten) · verwundert (links) ---------- */
  const MOOD = {
    dorffest: [.2, 1], trinklied: [.05, .9], marktplatz: [-.15, .7], shanty: [.35, .68], auenland: [-.38, .76], sieg: [.52, .82],
    heldenlied: [.56, .45], hof: [-.22, .46], reise: [.12, .36], reiter: [.62, .3], zwerge: [.36, .16], rast: [0, .14], kamin: [-.2, .02],
    verfolgung: [.82, .06], kampf: [.96, -.06], boss: [.86, -.42], spannung: [.42, -.34],
    heimweh: [.12, -.6], letztesgefecht: [.58, -.62], kriegstrommeln: [.92, -.24], gaukler: [-.55, .62], sternenhimmel: [-.88, -.14],
    elben: [-.9, .18], fey: [-.8, .5], unterreich: [-.6, -.34], grusel: [-.42, -.6], ruinen: [-.62, -.62], pilger: [-.24, -.62], klage: [0, -.95]
  };
  const POLE = { o: ["😄", W("fröhlich", "happy")], r: ["😠", W("wild", "fierce")], u: ["😢", W("traurig", "sad")], l: ["😮", W("verwundert", "wondrous")] };
  let mood = (() => { try { const m = JSON.parse(lies("imres-bb-mood", "null")); return Array.isArray(m) && m.length === 2 ? m : null; } catch (_) { return null; } })();
  let autoAn = lies("imres-bb-auto", "1") === "1", autoNaechst = 0, autoZuletzt = [], padZieht = false;
  const moodName = ([x, y]) => {
    const r = Math.hypot(x, y); if (r < .22) return W("ausgeglichen", "balanced");
    const w = Math.atan2(y, x) * 180 / Math.PI, pol = w >= 45 && w < 135 ? "o" : w >= -45 && w < 45 ? "r" : w >= -135 && w < -45 ? "u" : "l";
    const nb = { o: w < 90 ? "r" : "l", r: w > 0 ? "o" : "u", u: w > -90 ? "r" : "l", l: w > 0 ? "o" : "u" }[pol];
    const ab = Math.abs(((w - { o: 90, r: 0, u: -90, l: 180 }[pol]) + 540) % 360 - 180);
    return ab > 25 ? POLE[pol][1] + "–" + POLE[nb][1] : POLE[pol][1];
  };
  const moodListe = (L, [x, y]) => L.st.filter(o => MOOD[o.k]).map(o => ({ ...o, d: Math.hypot(MOOD[o.k][0] - x, MOOD[o.k][1] - y) })).sort((a, b) => a.d - b.d);
  const autoPlanen = () => { autoNaechst = Date.now() + (110 + Math.random() * 100) * 1000; };
  function weich(P) { try { if (P && P.naechsterWechsel) P.naechsterWechsel("fliessend"); } catch (_) {} }
  /* Punkt gesetzt: die passendste Stimmung spielt – läuft schon Musik, gleitet sie fließend hinüber */
  function moodAnwenden() {
    const L = listen(), z = Z(); if (!L || !z || !mood) return;
    const l = moodListe(L, mood); if (!l.length) return;
    const best = l[0], jetzt = l.find(o => o.k === z.stimmung);
    autoPlanen();
    if (z.laeuft && (z.stimmung === best.k || z.naechste === best.k || (jetzt && jetzt.d - best.d < .12))) return;
    if (z.laeuft) weich(P());
    autoZuletzt.unshift(best.k); autoZuletzt.length = Math.min(3, autoZuletzt.length);
    stimmungWaehlen(best.k, true);
  }
  /* Autopilot: alle paar Minuten eine andere Stimmung aus der Nähe des Punktes – immer fließend */
  setInterval(() => {
    if (!autoAn || !mood || SEITE !== "buehne" || modus === "klang" || !autoNaechst || Date.now() < autoNaechst) return;
    const L = listen(), z = Z(); if (!L || !z || !z.laeuft) return;
    autoPlanen();
    const l = moodListe(L, mood).filter(o => o.k !== z.stimmung); if (!l.length) return;
    let pool = l.filter(o => o.d <= l[0].d + .38 && !autoZuletzt.includes(o.k)); if (pool.length < 2) pool = l.slice(0, 3);
    const k = zufall(pool).k; weich(P()); autoZuletzt.unshift(k); autoZuletzt.length = Math.min(3, autoZuletzt.length);
    stimmungWaehlen(k, true); zeige("🤖 " + W("Gleich: ", "Next: ") + (L.st.find(o => o.k === k) || {}).s + " " + (L.st.find(o => o.k === k) || {}).n);
  }, 1000);
  /* Stimmungs-Uhr: tippen oder drehen – der Zeiger rastet in 8 Richtungen ein, in der Mitte = ausgeglichen */
  const RICHT = [[0, 1], [.71, .71], [1, 0], [.71, -.71], [0, -1], [-.71, -.71], [-1, 0], [-.71, .71]];
  const uhrWinkel = m => m && Math.hypot(m[0], m[1]) > .2 ? (Math.atan2(m[0], m[1]) * 180 / Math.PI + 180) : null; /* Zeiger zeigt nach unten bei 0° → +180 */
  function uhrHtml() {
    const w = uhrWinkel(mood), e = (em, x, y) => '<span class="e" style="left:' + (50 + x * 37) + "%;top:" + (50 - y * 37) + '%">' + em + "</span>";
    return '<div class="bb-uhr-box"><div class="bb-uhr" data-bbuhr role="slider" aria-label="' + W("Stimmung", "Mood") + '">' + e("😄", 0, 1) + e("😠", 1, 0) + e("😢", 0, -1) + e("😮", -1, 0) +
      '<span class="zeiger' + (w == null ? " mitte" : "") + '" style="--w:' + (w == null ? 180 : w) + 'deg"></span><span class="nabe"></span></div>' +
      '<div class="wort">' + (mood ? moodName(mood) : W("Stimmung?", "Mood?")) + "</div></div>";
  }
  bb.addEventListener("pointerdown", e => {
    const uhr = e.target.closest("[data-bbuhr]"); if (!uhr) return;
    e.preventDefault(); padZieht = true; try { uhr.setPointerCapture(e.pointerId); } catch (_) {}
    const stell = ev => {
      const r = uhr.getBoundingClientRect(), dx = (ev.clientX - r.left) / r.width * 2 - 1, dy = 1 - (ev.clientY - r.top) / r.height * 2;
      if (Math.hypot(dx, dy) < .33) mood = [0, 0];
      else { const i = (Math.round(Math.atan2(dx, dy) / (Math.PI / 4)) + 8) % 8; mood = [RICHT[i][0] * .8, RICHT[i][1] * .8]; }
      reglerAktiv = Date.now();
      const w = uhrWinkel(mood), z = $(".zeiger", uhr); z.classList.toggle("mitte", w == null); if (w != null) z.style.setProperty("--w", w + "deg");
      const wort = $(".bb-uhr-box .wort", bb); if (wort) wort.textContent = moodName(mood);
    };
    stell(e);
    const zieh = ev => stell(ev), los = () => {
      uhr.removeEventListener("pointermove", zieh); uhr.removeEventListener("pointerup", los); uhr.removeEventListener("pointercancel", los);
      padZieht = false; schreib("imres-bb-mood", JSON.stringify(mood)); moodAnwenden(); setTimeout(spielZeichnen, 250);
    };
    uhr.addEventListener("pointermove", zieh); uhr.addEventListener("pointerup", los); uhr.addEventListener("pointercancel", los);
  });

  /* ---------- Aktionen ---------- */
  const zufall = l => l[Math.floor(Math.random() * l.length)];
  let zuletztSt = null; /* in dieser Ansicht zuletzt gewählt – ▶ setzt dort fort, sonst beim ersten Vorschlag */
  function stimmungWaehlen(k, vomRegler) {
    zuletztSt = k;
    if (!vomRegler && MOOD[k]) { mood = MOOD[k].slice(); schreib("imres-bb-mood", JSON.stringify(mood)); }
    if (!vomRegler) autoPlanen();
    pultKlick("data-vorlage", k);
    if (modus === "musik") setTimeout(() => { const z = Z(); if (z && z.kulLaeuft) pultKlick("data-kulisse", "keine"); }, 60);
  }
  function ortWaehlen(k) {
    if (modus === "klang") { const z = Z(); if (z && z.laeuft) musikSpielen(); }
    pultKlick("data-kulisse", k);
    /* neuer Ort: der Raumklang springt zurück auf „passend“ */
    setTimeout(() => raumSetzen(0), 60);
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
      else if (z.laeuft) musikSpielen(); else { if (mood && !zuletztSt) { const b = moodListe(L, mood)[0]; stimmungWaehlen(b ? b.k : L.st[0].k, true); autoPlanen(); } else stimmungWaehlen(zuletztSt || L.st[0].k); if (!(Z() || {}).laeuft) musikSpielen(); }
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
    if (a.dataset.bb === "auto") { autoAn = !autoAn; schreib("imres-bb-auto", autoAn ? "1" : "0"); if (autoAn) autoPlanen(); zeige(autoAn ? "🤖 " + W("Auto: wechselt alle paar Minuten fließend zu einer passenden Stimmung", "Auto: drifts to a matching mood every few minutes") : "🤖 " + W("Auto aus", "Auto off")); spielZeichnen(); return; }
    aktion(a.dataset.bb);
  });
  let reglerAktiv = 0;
  bb.addEventListener("input", e => {
    const r = e.target.closest("[data-bbregler]"); if (!r) return;
    reglerAktiv = Date.now();
    const v = +r.value, lo = +r.min, hi = +r.max, pz = Math.round((v - lo) / (hi - lo) * 100); r.style.setProperty("--p", pz + "%"); const o = r.nextElementSibling || r.parentNode.querySelector("output"); if (o) o.textContent = pz;
    const id = r.dataset.bbregler;
    if (id === "master" || id === "kulvol") pultRegler(id, v);
    else if (id === "gesamt") weltRegler("#gesamt", v);
    else if (id === "wspannung") weltRegler('[data-regler="spannung"]', v);
    else if (id === "int") pultRegler("intensitaet", v);
    else if (id === "spann") pultLeben("spannung", v);
    else if (id === "raum") { r.style.setProperty("--p", Math.round((v + 100) / 2) + "%"); raumSetzen(v / 100); }
  });
  function pultLeben(art, v) {
    const root = $("#lautenwerk"); if (!root) return;
    let el = $$('[data-leben="' + art + '"]', root).find(x => x.tagName === "INPUT"), temp = false;
    if (!el) { el = document.createElement("input"); el.type = "range"; el.min = "0"; el.max = "100"; el.setAttribute("data-leben", art); el.hidden = true; root.appendChild(el); temp = true; }
    el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    if (temp) el.remove();
  }
  /* regelmäßig nachziehen, was gerade läuft (nicht während jemand schiebt) */
  let merk = "";
  setInterval(() => {
    if (bb.hidden || ansicht !== "spiel" || padZieht || Date.now() - reglerAktiv < 1500) return;
    const z = Z(), s = SEITE === "welten" ? String(weltAn()) + welten().length : z ? [z.laeuft, z.stimmung, z.naechste, z.kulisse, z.kulLaeuft, z.master, z.kulisseVol, z.lied, z.intensitaet, Math.round((z.spannung || 0) * 20)].join("|") : "";
    if (s !== merk) { merk = s; spielZeichnen(); }
  }, 600);

  /* ---------- Öffnen / Schließen ---------- */
  /* Browser-Verlauf: die einfache Ansicht ist ein eigener Eintrag – „Zurück“ schließt sie (bzw. geht zur vorigen Seite) */
  const istBB = st => !!(st && st.bardenbeats);
  function oeffnen(direkt, ausVerlauf) {
    bb.hidden = false; document.documentElement.classList.add("bb-offen"); schreib("imres-bb", "1");
    if (!ausVerlauf) {
      try {
        const st = Object.assign({}, history.state || {}, { bardenbeats: 1 });
        if (/[?&]bb=/.test(location.search)) history.replaceState(st, "", location.href); /* kam über imrestales.de/Bardenbeats */
        else if (!istBB(history.state)) history.pushState(st, "", location.href);
      } catch (_) {}
    }
    spielZeichnen();
  }
  function zu() { bb.hidden = true; document.documentElement.classList.remove("bb-offen"); schreib("imres-bb", "0"); }
  function schliessen() {
    zu();
    try { const u = new URL(location.href); u.searchParams.delete("bb"); const st = Object.assign({}, history.state || {}); delete st.bardenbeats; history.replaceState(st, "", u.pathname + (u.search || "") + u.hash); } catch (_) {}
    const ziel = SEITE === "buehne" ? $("#lautenwerk") : null; if (ziel) ziel.scrollIntoView({ block: "start" });
  }
  /* Zurück/Vor im Browser oder ein Sprung über das Menü der Seite: nur offen bleiben, solange der Eintrag dazugehört */
  const verlauf = () => {
    const soll = istBB(history.state) || (/[?&]bb=/.test(location.search) && !history.state);
    if (!soll && !bb.hidden) zu();
    else if (soll && bb.hidden) oeffnen(true, true);
  };
  addEventListener("popstate", verlauf); addEventListener("hashchange", () => setTimeout(verlauf, 0));
  window.__bardenbeats = { oeffnen, schliessen, autoJetzt() { autoNaechst = 1; } };
  const q = new URLSearchParams(location.search).get("bb");
  if (q != null) oeffnen(q === "2"); else if (window.__bbJetzt) oeffnen();
})();
