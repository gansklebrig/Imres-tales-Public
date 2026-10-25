/* =====================================================================
   KÜRZEL – Bestenlisten-Namen wie am Spielautomaten: drei Buchstaben
   ---------------------------------------------------------------------
   ImresKuerzel.feld({ klasse, id })  → HTML für drei Buchstabenfelder (▲ A ▼)
   ImresKuerzel.wert(element)          → "ABC" (oder "" wenn unvollständig)
   Bedienung: tippen (springt weiter), ▲/▼ bzw. Pfeiltasten (blättern),
   ← / → (Feld wechseln), Rücktaste, Enter (Eintragen – erledigt das Spiel).
   Mit Controller: Steuerkreuz ▲/▼ blättert, ◀/▶ wechselt das Feld.
   Das zuletzt benutzte Kürzel wird für alle Spiele gemerkt.
   Außerdem: Einträge namens „Barradin“ heben sich in allen Bestenlisten als
   Referenz ab; Drei-Buchstaben-Kürzel erscheinen in Automatenschrift.
   ===================================================================== */
(function () {
  "use strict";
  if (window.ImresKuerzel) return;
  const SCHLUESSEL = "imres-kuerzel";
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const lies = k => { try { return localStorage.getItem(k) || ""; } catch (_) { return ""; } };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* Vorschlag: zuletzt benutztes Kürzel, sonst die ersten drei Buchstaben eines früheren Namens, sonst AAA */
  function vorschlag() {
    const k = lies(SCHLUESSEL).toUpperCase();
    if (/^[A-Z]{3}$/.test(k)) return k;
    const alt = ["imres-auftritt-name", "imres-waldlauf-name", "imres-diebesnacht-name", "imres-echohort-name", "imres-heldensturm-name"].map(lies).find(Boolean) || "";
    const b = alt.toUpperCase().replace(/Ä/g, "A").replace(/Ö/g, "O").replace(/Ü/g, "U").replace(/[^A-Z]/g, "");
    return (b + "AAA").slice(0, 3);
  }
  function feld(o) {
    o = o || {};
    const v = vorschlag(), de = sprache() !== "en";
    const spalte = i => '<span class="kz-spalte">' +
      '<button type="button" class="kz-pfeil" data-kz="hoch" data-i="' + i + '" tabindex="-1" aria-label="' + (de ? "Buchstabe vor" : "Next letter") + '">▲</button>' +
      '<input type="text" class="kz-feld' + (o.klasse ? " " + esc(o.klasse) : "") + '"' + (i === 0 && o.id ? ' id="' + esc(o.id) + '"' : "") +
        ' maxlength="1" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" value="' + v[i] + '" data-i="' + i + '"' +
        ' aria-label="' + (de ? "Buchstabe " : "Letter ") + (i + 1) + (de ? " von 3" : " of 3") + '"' + (o.aus ? " disabled" : "") + ">" +
      '<button type="button" class="kz-pfeil" data-kz="runter" data-i="' + i + '" tabindex="-1" aria-label="' + (de ? "Buchstabe zurück" : "Previous letter") + '">▼</button></span>';
    return '<span class="kz" role="group" aria-label="' + (de ? "Dein Kürzel – drei Buchstaben" : "Your initials – three letters") + '">' + spalte(0) + spalte(1) + spalte(2) + "</span>";
  }
  const kz = el => el && (el.classList && el.classList.contains("kz") ? el : el.closest && el.closest(".kz"));
  function wert(el) {
    const k = kz(el); if (!k) return "";
    const s = Array.from(k.querySelectorAll(".kz-feld")).map(f => f.value.toUpperCase()).join("");
    if (!/^[A-Z]{3}$/.test(s)) return "";
    try { localStorage.setItem(SCHLUESSEL, s); } catch (_) {}
    return s;
  }
  const felder = k => Array.from(k.querySelectorAll(".kz-feld"));
  function blaettern(f, d) {
    const i = Math.max(0, ABC.indexOf((f.value || "A").toUpperCase()));
    f.value = ABC[(i + d + 26) % 26];
    f.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function nachbar(f, d) {
    const l = felder(kz(f)), i = l.indexOf(f), n = l[i + d];
    if (n) { n.focus(); try { n.select(); } catch (_) {} return true; }
    return false;
  }
  document.addEventListener("click", e => {
    const p = e.target.closest && e.target.closest(".kz-pfeil"); if (!p) return;
    const f = felder(kz(p))[+p.dataset.i]; if (!f || f.disabled) return;
    blaettern(f, p.dataset.kz === "hoch" ? 1 : -1);
  });
  document.addEventListener("keydown", e => {
    const f = e.target; if (!f || !f.classList || !f.classList.contains("kz-feld")) return;
    if (e.key === "ArrowUp") { e.preventDefault(); blaettern(f, 1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); blaettern(f, -1); }
    else if (e.key === "ArrowLeft") { if (nachbar(f, -1)) e.preventDefault(); }
    else if (e.key === "ArrowRight") { if (nachbar(f, 1)) e.preventDefault(); }
    else if (e.key === "Backspace" && !f.value) { e.preventDefault(); nachbar(f, -1); }
  }, true);
  document.addEventListener("input", e => {
    const f = e.target; if (!f || !f.classList || !f.classList.contains("kz-feld")) return;
    const b = (f.value || "").toUpperCase().replace(/Ä/g, "A").replace(/Ö/g, "O").replace(/Ü/g, "U").replace(/[^A-Z]/g, "");
    f.value = b.slice(-1);
    if (f.value) nachbar(f, 1);
  });
  document.addEventListener("focusin", e => { const f = e.target; if (f && f.classList && f.classList.contains("kz-feld")) { try { f.select(); } catch (_) {} } });

  /* ---------- Bestenlisten: Barradin als Referenz, Kürzel in Automatenschrift ---------- */
  let geplant = false;
  function markieren() {
    geplant = false;
    /* nur Bestenlisten: Tabellen, deren zweite Spalte „Name“ heißt */
    const zellen = [];
    document.querySelectorAll("table").forEach(tab => {
      const th = tab.querySelectorAll("thead th")[1];
      if (th && /^name$/i.test(th.textContent.trim())) tab.querySelectorAll("tbody tr > td:nth-child(2):not([data-kz-ok])").forEach(td => zellen.push(td));
    });
    zellen.forEach(td => {
      td.setAttribute("data-kz-ok", "");
      const n = td.textContent.trim();
      if (/^barradin$/i.test(n)) { td.classList.add("kz-barradin"); const tr = td.closest("tr"); if (tr) tr.classList.add("kz-referenz"); td.title = sprache() === "en" ? "Barradin himself – the reference to beat" : "Barradin persönlich – die Referenz, die es zu schlagen gilt"; }
      else if (/^[A-Z]{3}$/.test(n)) td.classList.add("kz-code");
    });
  }
  new MutationObserver(() => { if (!geplant) { geplant = true; requestAnimationFrame(markieren); } }).observe(document.documentElement, { childList: true, subtree: true });
  markieren();

  const css = document.createElement("style");
  css.textContent = `
.kz { display: inline-flex; gap: .35rem; align-items: center; vertical-align: middle; }
.kz-spalte { display: grid; justify-items: center; gap: .1rem; }
.kz .kz-feld { width: 2.3rem; height: 2.6rem; padding: 0; text-align: center; text-transform: uppercase; caret-color: transparent;
  font: 700 1.55rem/1 ui-monospace, "Courier New", monospace; letter-spacing: 0; color: #ffd27a;
  background: rgba(0,0,0,.5); border: 1px solid rgba(224,160,70,.55); border-radius: 4px; box-shadow: inset 0 0 12px rgba(224,160,70,.12); }
.kz .kz-feld:focus { outline: none; border-color: #ffd27a; box-shadow: 0 0 0 2px rgba(255,210,122,.35), inset 0 0 12px rgba(224,160,70,.25); animation: kzBlink 1s steps(2) infinite; }
.kz .kz-feld:disabled { opacity: .55; }
@keyframes kzBlink { 50% { color: rgba(255,210,122,.35); } }
.kz-pfeil { width: 2.3rem; height: 1.25rem; padding: 0; border: 0; background: none; color: rgba(224,160,70,.75); font-size: .72rem; line-height: 1; cursor: pointer; }
.kz-pfeil:hover { color: #ffd27a; }
@media (pointer: coarse) { .kz-pfeil { height: 1.7rem; font-size: .85rem; } .kz .kz-feld { width: 2.6rem; height: 2.9rem; } }
@media (prefers-reduced-motion: reduce) { .kz-feld:focus { animation: none; } }
.kz-code { font-family: ui-monospace, "Courier New", monospace !important; font-weight: 700; letter-spacing: .14em; }
tr.kz-referenz td { background: rgba(224,160,70,.15); }
.at-eintrag, .wl-eintrag, .dn-eintrag, .eh-eintrag, #hsEintrag { align-items: center; }
tr.kz-referenz td:first-child { box-shadow: inset 3px 0 0 #e0a046; }
.kz-barradin { color: #ffd27a !important; font-weight: 700; white-space: nowrap; }
.kz-barradin::before { content: "🎻 "; }
.kz-barradin::after { content: "Referenz"; margin-left: .4em; padding: .05em .35em; font-size: .62em; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; vertical-align: .15em;
  color: #120e14; background: #e0a046; border-radius: 2px; }
html[lang="en"] .kz-barradin::after { content: "Reference"; }
`;
  document.head.appendChild(css);
  window.ImresKuerzel = { feld, wert, vorschlag };
})();
