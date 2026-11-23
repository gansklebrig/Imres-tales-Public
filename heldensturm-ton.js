/* Heldensturm: schnelle Ton-Schalter (Musik / Geräusche) oben in der Leiste neben „Pause“.
   Hängt an der Website-Hülle von heldensturm.html und greift nicht ins Spiel ein: Ein Klick stellt den
   passenden Lautstärke-Regler des Spiels (wie im Pause-Menü) auf 0 bzw. auf den vorherigen Wert zurück. */
(function () {
  "use strict";
  if (!window.TonRegler) return;
  const SKEY = "imres-heldensturm-v1", VOR = "imres-heldensturm-ton-vor";
  const lesen = k => { try { return JSON.parse(localStorage.getItem(k) || "null") || {}; } catch (_) { return {}; } };
  const pegel = (s, k, alt) => typeof s[k] === "number" ? s[k] : (s[alt] === false ? 0 : .6);
  const stand = () => { const s = lesen(SKEY); return { musik: pegel(s, "volMus", "music") > 0, effekte: pegel(s, "volSfx", "sound") > 0 }; };
  /* Den Regler des Spiels bedienen: ein unsichtbarer Regler mit data-vol löst dieselbe Verarbeitung aus wie im Menü */
  function regler(k, wert) {
    const r = document.createElement("input");
    r.type = "range"; r.min = "0"; r.max = "100"; r.step = "5"; r.hidden = true; r.dataset.vol = k; r.value = String(Math.round(wert * 100));
    document.body.appendChild(r);
    r.dispatchEvent(new Event("input", { bubbles: true }));
    r.remove();
    const sichtbar = document.querySelector('#scr [data-vol="' + k + '"]'); if (sichtbar) sichtbar.value = r.value;
  }
  TonRegler.anmelden("heldensturm", {
    aendern: (art, an) => {
      const k = art === "musik" ? "volMus" : "volSfx", vor = lesen(VOR), jetzt = pegel(lesen(SKEY), k, art === "musik" ? "music" : "sound");
      if (an) regler(k, vor[k] > 0 ? vor[k] : .6);
      else { if (jetzt > 0) { vor[k] = jetzt; try { localStorage.setItem(VOR, JSON.stringify(vor)); } catch (_) {} } regler(k, 0); }
    }
  });
  TonRegler.sync("heldensturm", stand());
  document.addEventListener("input", e => { if (e.isTrusted && e.target.closest && e.target.closest("[data-vol]")) setTimeout(() => TonRegler.sync("heldensturm", stand()), 50); });
  const leiste = document.querySelector("#hud .hbtns");
  if (leiste) {
    const k = TonRegler.knoepfe("heldensturm"); k.classList.add("hs-ton");
    leiste.insertBefore(k, leiste.querySelector('[data-act="open-pause"]'));
  }
  const css = document.createElement("style");
  css.textContent = ".hbtns .hs-ton{gap:6px}.hbtns .hs-ton button{height:42px;width:42px;border-radius:8px;border:1px solid var(--line);background:rgba(37,29,41,.92);color:inherit}.hbtns .hs-ton button:hover,.hbtns .hs-ton button:focus-visible{background:rgba(60,46,64,.95);color:inherit}@media (max-width:560px){.hbtns .hs-ton button{width:36px;height:38px}}";
  document.head.appendChild(css);
})();
