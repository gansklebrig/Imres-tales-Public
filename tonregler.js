/* Ton-Schalter für alle Spiele: zwei kleine Knöpfe „Musik“ und „Effekte“, jederzeit erreichbar.
   Jedes Spiel meldet sich an und sagt, was es hat:
     TonRegler.anmelden("waldlauf", { musik: false, effekte: true, alt: { effekte: true }, aendern: (art, an) => … });
   Der Zustand wird je Spiel gemerkt (localStorage "imres-ton-<spiel>"). Die Knöpfe holt sich das Spiel mit
     TonRegler.knoepfe("waldlauf")  → fertiges Element zum Einhängen (Klasse .ton-regler)
   oder lässt sie oben rechts an seine Tavernenkarte setzen: TonRegler.anKarte("waldlauf", karte).
   Abfragen: TonRegler.musik("spiel"), TonRegler.effekte("spiel"). */
(function () {
  "use strict";
  if (window.TonRegler) return;
  const SP = {};
  const sprache = () => (document.documentElement.lang || "de").slice(0, 2) === "en" ? "en" : "de";
  const TX = {
    de: { musik: ["Musik aus", "Musik an"], effekte: ["Effekte aus", "Effekte an"] },
    en: { musik: ["Mute music", "Unmute music"], effekte: ["Mute sound effects", "Unmute sound effects"] }
  };
  const lies = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  const css = document.createElement("style");
  css.textContent = `
.ton-regler { display: inline-flex; gap: .3rem; z-index: 5; }
.ton-regler button {
  display: grid; place-items: center; width: 2.2rem; height: 2.2rem; padding: 0; position: relative;
  border: 1px solid var(--line, rgba(255,255,255,.25)); background: rgba(9,8,15,.55); color: var(--ember, #f0b45a);
  font: inherit; font-size: 1rem; line-height: 1; cursor: pointer; border-radius: 0; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.ton-regler button svg { width: 1.15rem; height: 1.15rem; display: block; }
.ton-regler button:hover, .ton-regler button:focus-visible { border-color: var(--ember, #f0b45a); background: var(--ember, #f0b45a); color: var(--night, #0b0a12); }
.ton-regler button[aria-pressed="true"] { color: #b9a58c; opacity: .8; }
.ton-regler button[aria-pressed="true"]::after {
  content: ""; position: absolute; left: 22%; right: 22%; top: 50%; height: 2px; background: #e0503c; transform: rotate(-40deg); border-radius: 1px;
}
.tav-karte.hat-ton { position: relative; }
.tav-karte > .ton-regler.an-karte { position: absolute; top: .7rem; right: .7rem; }
.tav-karte.hat-voll > .ton-regler.an-karte { right: 3.2rem; }
.tav-karte.tav-voll > .ton-regler.an-karte { position: fixed; top: .6rem; right: 3.3rem; z-index: 6; }
.tav-karte.hat-ton > h3 { padding-right: 5.6rem; }
.tav-karte.hat-ton.hat-voll > h3 { padding-right: 8rem; }
@media (max-width: 480px) { .tav-karte.hat-ton > .label { padding-right: 7.6rem; } .tav-karte.hat-ton > h3 { padding-right: 0; } }
`;
  document.head.appendChild(css);

  const NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 18.5a3 3 0 1 1-2-2.83V5.2l12-2.4v12.7a3 3 0 1 1-2-2.83V7.04l-8 1.6v9.86z"/></svg>';
  const LAUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';

  function zustand(id) {
    const s = SP[id]; if (!s) return { musik: true, effekte: true };
    return s.z;
  }
  function speichern(id) { const z = SP[id].z; schreib("imres-ton-" + id, (z.musik ? "1" : "0") + (z.effekte ? "1" : "0")); }
  function beschriften(id) {
    const s = SP[id]; if (!s) return;
    const tx = TX[sprache()];
    s.elemente.forEach(el => {
      el.querySelectorAll("button[data-art]").forEach(b => {
        const art = b.dataset.art, an = s.z[art];
        b.setAttribute("aria-pressed", an ? "false" : "true");
        const l = tx[art][an ? 0 : 1];
        b.setAttribute("aria-label", l); b.title = l;
      });
    });
  }
  function setze(id, art, an) {
    const s = SP[id]; if (!s || !(art in s.z)) return;
    s.z[art] = !!an; speichern(id); beschriften(id);
    try { s.aendern && s.aendern(art, !!an); } catch (_) {}
  }
  function knoepfe(id) {
    const s = SP[id]; if (!s) return document.createElement("span");
    const el = document.createElement("div");
    el.className = "ton-regler"; el.setAttribute("role", "group"); el.setAttribute("aria-label", sprache() === "en" ? "Sound" : "Ton");
    el.innerHTML = (s.hat.musik ? '<button type="button" data-art="musik">' + NOTE + "</button>" : "") +
      (s.hat.effekte ? '<button type="button" data-art="effekte">' + LAUT + "</button>" : "");
    el.addEventListener("click", e => {
      const b = e.target.closest("button[data-art]"); if (!b) return;
      e.stopPropagation(); e.preventDefault();
      setze(id, b.dataset.art, !s.z[b.dataset.art]);
      b.blur && b.blur();
    });
    // Tasten im Spiel sollen nicht ausgelöst werden, wenn man den Knopf mit Leertaste bedient
    el.addEventListener("keydown", e => e.stopPropagation());
    el.addEventListener("pointerdown", e => e.stopPropagation());
    el.addEventListener("touchstart", e => e.stopPropagation(), { passive: true });
    s.elemente = s.elemente.filter(x => x.isConnected);
    s.elemente.push(el);
    setTimeout(() => beschriften(id), 0);
    return el;
  }
  function anmelden(id, o) {
    o = o || {};
    const hat = { musik: o.musik !== false, effekte: o.effekte !== false };
    const alt = o.alt || {};
    const g = lies("imres-ton-" + id);
    const z = {
      musik: g && g.length === 2 ? g[0] === "1" : alt.musik !== false,
      effekte: g && g.length === 2 ? g[1] === "1" : alt.effekte !== false
    };
    const vorher = SP[id];
    SP[id] = { hat, z, aendern: o.aendern, elemente: vorher ? vorher.elemente : [] };
    return { musik: z.musik, effekte: z.effekte };
  }
  /* Oben rechts an der Tavernenkarte (neben dem Vollbild-Knopf). Baut das Spiel seine Karte neu, kommt die Gruppe zurück. */
  function anKarte(id, karte) {
    if (!karte || !SP[id]) return;
    karte.classList.add("hat-ton");
    let el = karte.querySelector(":scope > .ton-regler");
    if (!el) { el = knoepfe(id); el.classList.add("an-karte"); karte.appendChild(el); }
    if (!karte.dataset.tonBeob) {
      karte.dataset.tonBeob = "1";
      new MutationObserver(() => {
        if (!karte.querySelector(":scope > .ton-regler")) { const n = knoepfe(id); n.classList.add("an-karte"); karte.appendChild(n); }
      }).observe(karte, { childList: true });
    }
  }
  new MutationObserver(() => Object.keys(SP).forEach(beschriften)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* Zustand von außen angleichen (z. B. Lautstärke-Regler im Spiel auf 0 gezogen), ohne Rückmeldung ans Spiel */
  function sync(id, z) {
    const s = SP[id]; if (!s || !z) return;
    ["musik", "effekte"].forEach(k => { if (k in z) s.z[k] = !!z[k]; });
    speichern(id); beschriften(id);
  }
  window.TonRegler = {
    anmelden, knoepfe, anKarte, setze, sync,
    musik: id => zustand(id).musik,
    effekte: id => zustand(id).effekte
  };
})();
