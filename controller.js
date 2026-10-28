/* =====================================================================
   CONTROLLER – Xbox-Controller (und andere Standard-Gamepads) für die Seite
   ---------------------------------------------------------------------
   Zwei Betriebsarten:
   1. Spiel: Läuft gerade eines der Tavernenspiele, bekommt es die Eingaben
      (Friedrichs Jagd, Ezekiels lange Nacht, Echos Hort, Barradins Auftritt).
      Die Spiele stellen dafür root._pad bereit (siehe Ende der Spieldateien).
   2. Menü: Sonst bewegt Steuerkreuz/linker Stick den Fokus über Knöpfe und
      Links (auch in Dialogen und Spielmenüs), A bestätigt, B geht zurück,
      rechter Stick scrollt, ☰ setzt ein pausiertes Spiel fort.
   Heldensturm hat eine eigene Controller-Steuerung (heldensturm.html).
   Belegung (Xbox): A 0 · B 1 · X 2 · Y 3 · LB 4 · RB 5 · LT 6 · RT 7 · Ansicht 8 · Menü 9 ·
   L3 10 · R3 11 · ↑ 12 · ↓ 13 · ← 14 · → 15
   ===================================================================== */
(function () {
  "use strict";
  if (!navigator.getGamepads) return;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const TX = {
    de: {
      verbunden: "🎮 Controller verbunden – Steuerkreuz wählt, A bestätigt, B zurück",
      getrennt: "🎮 Controller getrennt",
      ton: "Tipp: Für Ton einmal kurz auf die Seite klicken oder tippen.",
      hilfe: {
        waldlauf: "Stick: zielen · A / RT: schießen · ☰ Pause",
        diebesnacht: "Linker Stick: gehen · Rechter Stick: Ziel · A: dorthin / handeln · X Münze · Y Zorn · RB Rauch · B abbrechen · ☰ Pause",
        echohort: "Stick: Zeiger · Steuerkreuz: von Platz zu Platz · A: tippen · X: pflanzen/verstärken · LB / RB: Knöpfe unten · Y: nächste Welle · ☰ Pause",
        echohortRaub: "A: Echo flattert · ☰ Pause",
        auftritt: "X · A · B (oder ◀ ▼ ▶): Bass · Laute · Flöte – bei Schweif gedrückt halten · ☰ Pause",
        charme: "▲ ▼: Spruch wählen · A: würfeln · B: vorspulen · X / Y / RB: Echo · Rex · Flöte · ☰ Klang"
      }
    },
    en: {
      verbunden: "🎮 Controller connected – D-pad selects, A confirms, B goes back",
      getrennt: "🎮 Controller disconnected",
      ton: "Tip: click or tap the page once to enable sound.",
      hilfe: {
        waldlauf: "Stick: aim · A / RT: shoot · ☰ pause",
        diebesnacht: "Left stick: walk · Right stick: target · A: go there / act · X coin · Y fury · RB smoke · B cancel · ☰ pause",
        echohort: "Stick: pointer · D-pad: spot to spot · A: tap · X: plant/upgrade · LB / RB: buttons below · Y: next wave · ☰ pause",
        echohortRaub: "A: Echo flutters · ☰ pause",
        auftritt: "X · A · B (or ◀ ▼ ▶): bass · lute · flute – hold for tails · ☰ pause",
        charme: "▲ ▼: pick a line · A: roll · B: skip · X / Y / RB: Echo · Rex · flute · ☰ sound"
      }
    }
  };
  const t = () => TX[sprache()];
  const KN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, ANSICHT: 8, MENUE: 9, L3: 10, R3: 11, HOCH: 12, RUNTER: 13, LINKS: 14, RECHTS: 15 };
  const TOT = 0.22; /* tote Zone der Sticks */

  /* ---------- Eingabe lesen ---------- */
  let vorher = [], jetzt = [], achsen = [0, 0, 0, 0], laeuft = false, letzteZeit = 0, padIndex = null;
  function padHolen() {
    const alle = navigator.getGamepads ? Array.from(navigator.getGamepads() || []) : [];
    if (padIndex != null && alle[padIndex] && alle[padIndex].connected) return alle[padIndex];
    const p = alle.find(g => g && g.connected);
    padIndex = p ? p.index : null;
    return p || null;
  }
  const wert = b => (b == null ? 0 : typeof b === "object" ? (b.pressed ? Math.max(b.value || 0, .6) : b.value || 0) : b);
  const gedrueckt = n => (jetzt[n] || 0) > .45;
  const neu = n => gedrueckt(n) && !((vorher[n] || 0) > .45);
  const los = n => !gedrueckt(n) && (vorher[n] || 0) > .45;
  const irgendeinNeu = l => l.some(neu);
  function stick(i) {
    let x = achsen[i * 2] || 0, y = achsen[i * 2 + 1] || 0;
    const m = Math.hypot(x, y);
    if (m < TOT) return { x: 0, y: 0, m: 0 };
    const k = Math.min(1, (m - TOT) / (1 - TOT)) / m;
    return { x: x * k, y: y * k, m: Math.min(1, (m - TOT) / (1 - TOT)) };
  }
  const steuerkreuz = () => ({ x: (gedrueckt(KN.RECHTS) ? 1 : 0) - (gedrueckt(KN.LINKS) ? 1 : 0), y: (gedrueckt(KN.RUNTER) ? 1 : 0) - (gedrueckt(KN.HOCH) ? 1 : 0) });

  /* ---------- Hilfsmittel ---------- */
  const sichtbar = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden" && !el.closest("[hidden]");
  function taste(key, art, ziel) {
    const code = key === " " ? "Space" : key === "Escape" ? "Escape" : key === "Enter" ? "Enter" : "Key" + key.toUpperCase();
    (ziel || document).dispatchEvent(new KeyboardEvent(art || "keydown", { key, code, bubbles: true, cancelable: true }));
  }
  /* Hinweis unten (wie die anderen kleinen Meldungen der Seite) */
  let hinweisEl = null, hinweisUhr = 0;
  function hinweis(text, dauer) {
    if (!hinweisEl) { hinweisEl = document.createElement("div"); hinweisEl.className = "pad-hinweis"; hinweisEl.setAttribute("role", "status"); document.body.appendChild(hinweisEl); }
    hinweisEl.textContent = text; hinweisEl.classList.add("da");
    clearTimeout(hinweisUhr); hinweisUhr = setTimeout(() => hinweisEl.classList.remove("da"), dauer || 3500);
  }

  /* ---------- Zeiger über einer Spielfläche ---------- */
  const zeiger = document.createElement("div"); zeiger.className = "pad-zeiger"; zeiger.hidden = true;
  document.body.appendChild(zeiger);
  /* p in Spielkoordinaten (W × H) → Bildschirm */
  function zeigerSetzen(leinwand, W, H, p) {
    if (!p || !leinwand) { zeiger.hidden = true; return; }
    const r = leinwand.getBoundingClientRect();
    zeiger.style.left = (r.left + p.x / W * r.width) + "px"; zeiger.style.top = (r.top + p.y / H * r.height) + "px";
    zeiger.hidden = false;
  }

  /* ---------- Spiele ---------- */
  const imBild = el => { if (!sichtbar(el)) return false; const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < innerHeight - 40; };
  const pad = id => { const el = document.getElementById(id); return el && el._pad ? { el, z: el._pad } : null; };
  let hilfeGezeigt = {};
  function hilfeEinmal(key) { if (hilfeGezeigt[key]) return; hilfeGezeigt[key] = true; hinweis(t().hilfe[key], 6500); }

  const SPIELE = [
    /* Barradins Auftritt: drei Spuren wie A · S · D */
    { id: "auftritt",
      faengt: ({ z }) => z.spielt(),
      start({ z }) { z.anzeige(["X", "A", "B"]); },
      ende() { ["a", "s", "d"].forEach(k => taste(k, "keyup", window)); }, /* nichts bleibt „gedrückt“ hängen */
      frame({ z }) {
        if (z.pausiert()) { if (irgendeinNeu([KN.A, KN.B, KN.MENUE])) z.weiter(); return; }
        if (neu(KN.MENUE)) { z.pause(); return; }
        if (!z.laeuft()) return;
        hilfeEinmal("auftritt");
        [[KN.X, KN.LINKS, KN.LB, KN.LT], [KN.A, KN.RUNTER], [KN.B, KN.RECHTS, KN.RB, KN.RT]].forEach((tasten, spur) => {
          const k = "asd"[spur];
          if (tasten.some(neu)) taste(k, "keydown", window);
          if (tasten.some(los) && !tasten.some(gedrueckt)) taste(k, "keyup", window);
        });
      } },
    /* Würfel auf Verführen: Steuerkreuz wählt den Spruch, A würfelt, B spult vor, X/Y/RB sind die Joker */
    { id: "charme-karte",
      faengt: ({ z }) => z.aktiv(),
      start({ z }) { z.wahl(0); },
      ende({ z }) { z.wahl(-1); },
      frame(s) {
        const { z } = s;
        hilfeEinmal("charme");
        const a = stick(0), sy = Math.abs(a.y) > .6 ? Math.sign(a.y) : 0;
        if (neu(KN.HOCH) || (sy < 0 && s.sy !== sy)) z.bewegen(-1);
        if (neu(KN.RUNTER) || (sy > 0 && s.sy !== sy)) z.bewegen(1);
        s.sy = sy;
        if (neu(KN.A)) z.ok();
        if (neu(KN.B)) z.skip();
        if (neu(KN.X)) z.joker("echo");
        if (neu(KN.Y)) z.joker("rex");
        if (neu(KN.RB)) z.joker("floete");
        if (neu(KN.MENUE)) z.regler();
        if (neu(KN.ANSICHT)) { const k = s.el.querySelector(".tav-voll-knopf"); if (k) k.click(); }
      } },
    /* Friedrichs Jagd: Fadenkreuz mit dem Stick, A oder RT schießt (gedrückt halten = Dauerfeuer) */
    { id: "waldlauf",
      faengt: ({ z }) => z.zustand() === "spiel",
      start(s) { s.kreuz = s.z.kreuzPos(); },
      frame(s, dt) {
        const { z } = s;
        if (neu(KN.MENUE)) { z.pause(); return; }
        hilfeEinmal("waldlauf");
        const a = stick(0), b = stick(1), d = steuerkreuz();
        /* sanft beschleunigen: leicht gekippt = fein zielen, voll gekippt = schnell schwenken */
        const v = 330 * dt, ka = a.m ? Math.pow(a.m, 1.7) / a.m : 0, kb = b.m ? Math.pow(b.m, 1.7) / b.m * .45 : 0;
        s.kreuz.x += (a.x * ka + b.x * kb + d.x * .45) * v;
        s.kreuz.y += (a.y * ka + b.y * kb + d.y * .45) * v;
        s.kreuz.x = Math.max(4, Math.min(z.W - 4, s.kreuz.x)); s.kreuz.y = Math.max(4, Math.min(z.H - 4, s.kreuz.y));
        z.kreuz(s.kreuz.x, s.kreuz.y, gedrueckt(KN.A) || gedrueckt(KN.RT) || gedrueckt(KN.RB));
      },
      ende({ z }) { z.aus(); } },
    /* Ezekiels lange Nacht: linker Stick geht, rechter Stick führt den Zielzeiger */
    { id: "diebesnacht", zeiger: true,
      faengt: ({ z }) => z.zustand() === "spiel",
      start(s) { const h = s.z.held(); s.ziel = h ? { x: h.x, y: h.y - s.z.C * 1.5 } : { x: s.z.W / 2, y: s.z.H / 2 }; s.richtung = { x: 0, y: -1 }; s.gehT = 0; s.zielRuhig = 9; },
      frame(s, dt) {
        const { z } = s, C = z.C;
        if (neu(KN.MENUE)) { z.pause(); return; }
        hilfeEinmal("diebesnacht");
        if (neu(KN.B)) z.abbrechen();
        if (neu(KN.X)) z.muenze();
        if (neu(KN.Y)) z.zorn();
        if (neu(KN.RB) || neu(KN.LB)) z.rauch();
        if (z.schloss()) { if (irgendeinNeu([KN.A, KN.RT])) z.knacken(); zeiger.hidden = true; return; }
        /* gehen: Feld neben Ezekiel in Stickrichtung antippen */
        const a = stick(0), d = steuerkreuz(), h = z.held();
        let gx = a.m > .45 ? a.x : d.x, gy = a.m > .45 ? a.y : d.y;
        s.gehT -= dt;
        if (h && (gx || gy) && !z.zielt()) {
          const w = Math.atan2(gy, gx), dx = Math.round(Math.cos(w)), dy = Math.round(Math.sin(w));
          s.richtung = { x: dx, y: dy };
          const fx = Math.floor(h.x / C) + dx, fy = Math.floor((h.y - z.OY) / C) + dy, key = fx + "," + fy;
          if (key !== s.letztesFeld || s.gehT <= 0) { s.letztesFeld = key; s.gehT = .32; z.tippen({ x: (fx + .5) * C, y: z.OY + (fy + .5) * C }); }
        } else s.letztesFeld = null;
        /* Zielzeiger: rechter Stick; ruht er, folgt er Ezekiel (eineinhalb Felder voraus) */
        const b = stick(1);
        if (b.m) { s.ziel.x += b.x * 420 * dt * Math.pow(b.m, .6); s.ziel.y += b.y * 420 * dt * Math.pow(b.m, .6); s.zielRuhig = 0; }
        else s.zielRuhig += dt;
        if (s.zielRuhig > 1.2 && h && !z.zielt()) {
          const zx = h.x + s.richtung.x * C * 1.5, zy = h.y + s.richtung.y * C * 1.5, f = Math.min(1, dt * 10);
          s.ziel.x += (zx - s.ziel.x) * f; s.ziel.y += (zy - s.ziel.y) * f;
        }
        s.ziel.x = Math.max(2, Math.min(z.W - 2, s.ziel.x)); s.ziel.y = Math.max(z.OY + 2, Math.min(z.FUSS_Y - 2, s.ziel.y));
        if (irgendeinNeu([KN.A, KN.RT])) z.tippen({ x: s.ziel.x, y: s.ziel.y });
        zeigerSetzen(z.leinwand, z.W, z.H, s.ziel);
        zeiger.classList.toggle("muenze", z.zielt());
      },
      ende() { zeiger.hidden = true; } },
    /* Echos Hort: Raubzug mit A, Abwehr mit Zeiger; LB/RB springen durch die Knöpfe der Leiste */
    { id: "echohort", zeiger: true,
      faengt: ({ z }) => z.zustand() === "spiel",
      start(s) { s.p = { x: s.z.W / 2, y: s.z.LEISTE * .55 }; s.knopf = -1; },
      frame(s, dt) {
        const { z } = s;
        if (neu(KN.MENUE)) { z.pause(); return; }
        if (z.phase() === "raub") {
          hilfeEinmal("echohortRaub"); zeiger.hidden = true;
          if (irgendeinNeu([KN.A, KN.B, KN.X, KN.Y, KN.RT, KN.RUNTER])) taste(" ");
          return;
        }
        hilfeEinmal("echohort");
        const a = stick(0), b = stick(1), v = 380 * dt;
        if (a.m || b.m) { s.p.x += (a.x * Math.pow(a.m, .6) + b.x * .5) * v; s.p.y += (a.y * Math.pow(a.m, .6) + b.y * .5) * v; s.knopf = -1; }
        const kn = z.knoepfe().slice().sort((p, q) => (Math.round(p.y / 20) - Math.round(q.y / 20)) || p.x - q.x);
        /* Steuerkreuz: springt zum nächsten Pflanzplatz oder Knopf in dieser Richtung */
        const d = { x: neu(KN.RECHTS) - neu(KN.LINKS), y: neu(KN.RUNTER) - neu(KN.HOCH) };
        if (d.x || d.y) {
          const ziele = z.plaetze().concat(kn.map(k => ({ x: k.x + k.w / 2, y: k.y + k.h / 2 })));
          let best = null, bw = Infinity;
          ziele.forEach(q => {
            const vx = q.x - s.p.x, vy = q.y - s.p.y, entlang = vx * d.x + vy * d.y, quer = Math.abs(vx * d.y - vy * d.x);
            if (entlang <= 6 || quer > entlang * 2.5) return;
            const w = entlang + quer * 2; if (w < bw) { bw = w; best = q; }
          });
          if (best) { s.p = { x: best.x, y: best.y }; s.knopf = -1; }
        }
        /* X: pflanzen bzw. verstärken (wie ein Doppeltipp) */
        if (neu(KN.X) && s.p.y < z.LEISTE) { z.druck({ x: s.p.x, y: s.p.y }); z.druck({ x: s.p.x, y: s.p.y }); }
        if (kn.length && (neu(KN.RB) || neu(KN.LB))) {
          s.knopf = (s.knopf < 0 ? (neu(KN.RB) ? 0 : kn.length - 1) : (s.knopf + (neu(KN.RB) ? 1 : -1) + kn.length) % kn.length);
          const k = kn[s.knopf]; s.p = { x: k.x + k.w / 2, y: k.y + k.h / 2 };
        }
        if (neu(KN.Y)) { const k = kn.find(x => x.id === "jetzt"); if (k) z.druck({ x: k.x + k.w / 2, y: k.y + k.h / 2 }); }
        s.p.x = Math.max(2, Math.min(z.W - 2, s.p.x)); s.p.y = Math.max(2, Math.min(z.H - 2, s.p.y));
        if (irgendeinNeu([KN.A, KN.RT])) z.druck({ x: s.p.x, y: s.p.y });
        zeigerSetzen(z.leinwand, z.W, z.H, s.p);
      },
      ende() { zeiger.hidden = true; } }
  ];
  let aktiv = null, zuletztGespielt = null; /* { def, el, z, ... } */
  const SPIEL_IDS = ["waldlauf", "diebesnacht", "echohort", "auftritt"];
  function spielSuchen() {
    for (const def of SPIELE) {
      const s = pad(def.id);
      if (s && imBild(s.el) && def.faengt(s)) return Object.assign(s, { def });
    }
    return null;
  }

  /* ---------- Menü: Fokus mit Steuerkreuz bewegen ---------- */
  const FOKUSIERBAR = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
  function bereich() {
    const dlg = Array.from(document.querySelectorAll("dialog[open]")).pop();
    if (dlg) return dlg;
    const voll = document.fullscreenElement || document.querySelector(".tav-karte.tav-voll.ersatz");
    if (voll) return voll;
    /* ein offenes Spielmenü (Start, Pause, Ende) im Blick hat Vorrang */
    /* das Menü (Start, Pause, Ende) des Spiels, das gerade gespielt wurde oder allein angezeigt wird, hat Vorrang */
    const spielEl = zuletztGespielt && imBild(zuletztGespielt) ? zuletztGespielt : SPIEL_IDS.includes(location.hash.slice(1)) ? document.getElementById(location.hash.slice(1)) : null;
    const schleier = spielEl && spielEl.querySelector(".wl-schleier, .dn-schleier, .eh-schleier");
    if (schleier && !schleier.hidden && imBild(schleier)) return schleier;
    const blatt = document.querySelector(".hl-blatt.offen");
    if (blatt) return blatt;
    return document.body;
  }
  function kandidaten(raum) {
    return Array.from(raum.querySelectorAll(FOKUSIERBAR)).filter(el => !el.disabled && !el.classList.contains("kz-pfeil") && sichtbar(el) && !el.closest(".pad-hinweis") && !(el.closest("dialog:not([open])"))
      && (raum !== document.body || !el.closest("dialog")) && el.getBoundingClientRect().width > 0);
  }
  const mitte = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  function ersterIn(raum) {
    /* ein allein angezeigtes Spiel: dessen Hauptknopf zuerst */
    if (raum === document.body && SPIEL_IDS.includes(location.hash.slice(1))) {
      const sp = document.getElementById(location.hash.slice(1)), k = sp && kandidaten(sp);
      if (k && k.length) return k.find(el => el.matches(".at-start, .wl-haupt, .dn-haupt, .eh-haupt") && imBild(el)) || k.find(imBild) || k[0];
    }
    const l = kandidaten(raum); if (!l.length) return null;
    const haupt = l.find(el => el.matches(".sd-los, .wl-haupt, .dn-haupt, .eh-haupt, .tav-knopf.haupt, [autofocus]") && imBild(el));
    if (haupt) return haupt;
    /* oben links im sichtbaren Inhalt anfangen – Kopfzeile, Fuß und Handyleiste nur, wenn sonst nichts da ist */
    const rand = el => el.closest(".top, footer, .handyleiste");
    const sichtbare = l.filter(imBild), inhalt = sichtbare.filter(el => !rand(el));
    const wahl = (inhalt.length ? inhalt : sichtbare).slice().sort((p, q) => { const a = p.getBoundingClientRect(), b = q.getBoundingClientRect(); return (Math.round(a.top / 24) - Math.round(b.top / 24)) || a.left - b.left; });
    return wahl[0] || l[0];
  }
  function fokus(el) {
    if (!el) return;
    document.documentElement.classList.add("pad-nav");
    try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); }
    const r = el.getBoundingClientRect(), oben = 70, unten = innerHeight - (document.querySelector(".handyleiste") && sichtbar(document.querySelector(".handyleiste")) ? 80 : 20);
    if (r.top < oben || r.bottom > unten) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function bewegen(dx, dy) {
    const raum = bereich(), akt = document.activeElement;
    if (!akt || akt === document.body || !raum.contains(akt) || !document.documentElement.classList.contains("pad-nav")) { fokus(ersterIn(raum)); return; }
    const a = mitte(akt.getBoundingClientRect());
    let best = null, bw = Infinity;
    kandidaten(raum).forEach(el => {
      if (el === akt) return;
      const m = mitte(el.getBoundingClientRect()), vx = m.x - a.x, vy = m.y - a.y;
      const entlang = vx * dx + vy * dy, quer = Math.abs(vx * dy - vy * dx);
      if (entlang <= 4) return;
      if (quer > entlang * 2.2) return; /* nur ungefähr in der Richtung */
      const w = entlang + quer * 2.2;
      if (w < bw) { bw = w; best = el; }
    });
    if (best) fokus(best);
    else if (dy) window.scrollBy({ top: dy * innerHeight * .35, behavior: "smooth" });
  }
  function zurueck() {
    const dlg = Array.from(document.querySelectorAll("dialog[open]")).pop();
    if (dlg) { const zu = dlg.querySelector(".qd-close, [data-zu], button[value='cancel']"); if (zu) zu.click(); else dlg.close(); return; }
    const blatt = document.querySelector(".hl-blatt.offen"); if (blatt) { const zu = blatt.querySelector(".hl-zu"); if (zu) zu.click(); return; }
    const akt = document.activeElement;
    if (akt && /INPUT|TEXTAREA|SELECT/.test(akt.tagName)) { akt.blur(); return; }
    /* Vollbild eines Spiels verlassen */
    if (document.fullscreenElement) { const k = document.fullscreenElement.querySelector(".tav-voll-knopf"); if (k) k.click(); else document.exitFullscreen().catch(() => {}); return; }
    const ersatz = document.querySelector(".tav-karte.tav-voll.ersatz .tav-voll-knopf"); if (ersatz) { ersatz.click(); return; }
    /* Spielmenü mit „Zurück“-Knopf? */
    const raum = bereich();
    /* im Pausenmenü eines Spiels heißt „zurück“: weiterspielen */
    if (raum !== document.body) { const w = raum.querySelector('[data-tun="weiter"]'); if (w && sichtbar(w)) { w.click(); return; } }
    if (raum !== document.body) { const zk = raum.querySelector('[data-tun="zumStart"], [data-tun="zurueck"], [data-tun="schatzZurueck"], [data-tun="einstZurueck"]'); if (zk && sichtbar(zk)) { zk.click(); return; } }
    /* sonst: eine Seite zurück (aus einem Spiel in die Taverne, aus einem Bereich zur Startseite) */
    if (location.hash && location.hash !== "#start") history.back();
  }
  let wiederholT = 0, letzteRichtung = "";
  let letzterRaum = null;
  function menueFrame(dt, benutzt) {
    /* neues Menü/Fenster aufgegangen (z. B. Pause, Spielende, Dialog)? Dann gleich den Hauptknopf wählen */
    const raum = bereich(), akt0 = document.activeElement;
    if (raum !== document.body && (raum !== letzterRaum || !akt0 || akt0 === document.body || !raum.contains(akt0)) && document.documentElement.classList.contains("pad-an")) {
      const el = ersterIn(raum); if (el && !(akt0 && raum.contains(akt0) && akt0 !== document.body)) fokus(el);
    }
    letzterRaum = raum;
    const d = steuerkreuz(), a = stick(0);
    let dx = d.x, dy = d.y;
    if (!dx && !dy && a.m > .5) { if (Math.abs(a.x) > Math.abs(a.y)) dx = Math.sign(a.x); else dy = Math.sign(a.y); }
    const r = dx + "," + dy;
    /* im Kürzel-Feld (Bestenliste): ▲/▼ blättert den Buchstaben statt weiterzuspringen */
    const kzFeld = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("kz-feld");
    const schritt = () => { if (kzFeld && dy && !dx) taste(dy < 0 ? "ArrowUp" : "ArrowDown", "keydown", document.activeElement); else bewegen(dx, dy); };
    if (dx || dy) {
      if (r !== letzteRichtung) { wiederholT = .38; schritt(); }
      else { wiederholT -= dt; if (wiederholT <= 0) { wiederholT = .13; schritt(); } }
    }
    letzteRichtung = (dx || dy) ? r : "";
    /* rechter Stick scrollt (im Spielmenü dessen Fläche, sonst die Seite) */
    const b = stick(1);
    if (b.m) {
      const raum = bereich(), ziel = raum !== document.body && raum.scrollHeight > raum.clientHeight + 4 ? raum : null;
      const dyPx = b.y * 900 * dt * b.m;
      if (ziel) ziel.scrollTop += dyPx; else window.scrollBy(0, dyPx);
    }
    if (neu(KN.A)) {
      const akt = document.activeElement;
      if (!document.documentElement.classList.contains("pad-nav") || !akt || akt === document.body) fokus(ersterIn(bereich()));
      else if (akt.tagName === "SELECT") { akt.selectedIndex = (akt.selectedIndex + 1) % akt.options.length; akt.dispatchEvent(new Event("change", { bubbles: true })); }
      else if (/INPUT|TEXTAREA/.test(akt.tagName) && !/checkbox|radio|range|button|submit/.test(akt.type)) {
        /* im Namensfeld: A schickt ab (wie Enter) */
        akt.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
      }
      else akt.click();
    }
    if (neu(KN.B)) zurueck();
    /* Schieberegler: links/rechts verändert den Wert, wenn einer fokussiert ist */
    const akt = document.activeElement;
    if (akt && akt.type === "range" && (neu(KN.LB) || neu(KN.RB))) { const st = parseFloat(akt.step) || 1; akt.value = parseFloat(akt.value) + (neu(KN.RB) ? st : -st); akt.dispatchEvent(new Event("input", { bubbles: true })); akt.dispatchEvent(new Event("change", { bubbles: true })); }
    /* ☰ setzt ein pausiertes Spiel fort */
    if (neu(KN.MENUE)) {
      const w = Array.from(document.querySelectorAll('[data-tun="weiter"], [data-tun="fortsetzen"]')).find(el => sichtbar(el) && imBild(el));
      if (w) w.click();
      else { const at = pad("auftritt"); if (at && at.z.pausiert()) at.z.weiter(); }
    }
    /* Ansicht-Taste: Vollbild des Spiels im Blick an/aus */
    if (neu(KN.ANSICHT)) {
      const k = Array.from(document.querySelectorAll(".tav-voll-knopf")).find(el => sichtbar(el) && imBild(el));
      if (k) k.click();
    }
  }

  /* Spielfläche ganz ins Bild holen (nicht halb unter der Kopfzeile) */
  function spielInsBild(el) {
    const c = el.querySelector("canvas") || el, r = c.getBoundingClientRect(), kopf = 64;
    if (r.top < kopf || r.bottom > innerHeight - 8) {
      const ziel = r.height + kopf + 8 > innerHeight ? r.top - kopf : r.top - (innerHeight - r.height) / 2;
      window.scrollBy({ top: ziel, behavior: "smooth" });
    }
  }
  /* ---------- Hauptschleife ---------- */
  function schleife(zeit) {
    const p = padHolen();
    if (!p) { laeuft = false; if (aktiv && aktiv.def.ende) aktiv.def.ende(aktiv); aktiv = null; zeiger.hidden = true; return; }
    const dt = Math.min(.05, letzteZeit ? (zeit - letzteZeit) / 1000 : .016); letzteZeit = zeit;
    vorher = jetzt; jetzt = Array.from(p.buttons || [], wert); achsen = Array.from(p.axes || []);
    const benutzt = jetzt.some(v => v > .45) || achsen.some(v => Math.abs(v) > .5);
    if (benutzt) document.documentElement.classList.add("pad-an");
    /* Spiel oder Menü? */
    const s = spielSuchen();
    if (!s || !aktiv || s.el !== aktiv.el) {
      if (aktiv && aktiv.def.ende) aktiv.def.ende(aktiv);
      aktiv = s;
      if (aktiv) { zuletztGespielt = aktiv.el; document.documentElement.classList.remove("pad-nav"); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); if (aktiv.def.start) aktiv.def.start(aktiv); spielInsBild(aktiv.el); }
    }
    try {
      if (aktiv) aktiv.def.frame(aktiv, dt);
      else menueFrame(dt, benutzt);
    } catch (e) { console.error(e); }
    if (benutzt && navigator.userActivation && !navigator.userActivation.hasBeenActive && !tonHinweis) { tonHinweis = true; setTimeout(() => hinweis(t().ton, 5000), 3800); }
    requestAnimationFrame(schleife);
  }
  let tonHinweis = false;
  function starten() { if (laeuft) return; laeuft = true; letzteZeit = 0; requestAnimationFrame(schleife); }
  window.addEventListener("gamepadconnected", e => {
    padIndex = e.gamepad.index; hinweis(t().verbunden, 4500); hilfeGezeigt = {};
    const at = pad("auftritt"); if (at) at.z.anzeige(["X", "A", "B"]);
    starten();
  });
  window.addEventListener("gamepaddisconnected", () => {
    if (!padHolen()) { hinweis(t().getrennt, 2500); document.documentElement.classList.remove("pad-an", "pad-nav"); const at = pad("auftritt"); if (at) at.z.anzeige(["A", "S", "D"]); }
  });
  /* schon verbunden (z. B. nach dem Neuladen)? */
  if (padHolen()) starten();
  /* Maus oder Finger übernimmt: Fokusrahmen weg */
  window.addEventListener("pointerdown", e => { if (e.isTrusted) document.documentElement.classList.remove("pad-nav"); }, true);
  window.addEventListener("pointermove", e => { if (e.isTrusted && e.pointerType === "mouse" && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) document.documentElement.classList.remove("pad-nav"); }, true);
  /* nachgeladene Spiele (Taverne) bekommen die Tastenbeschriftung, falls schon ein Controller dran ist */
  document.addEventListener("imres:nachgeladen", () => { if (padHolen()) { const at = pad("auftritt"); if (at) at.z.anzeige(["X", "A", "B"]); } });

  const css = document.createElement("style");
  css.textContent = `
html.pad-nav :focus { outline: 3px solid var(--ember, #e0a046) !important; outline-offset: 3px; box-shadow: 0 0 0 7px rgba(224,160,70,.28) !important; }
html.pad-nav .tav-kachel:focus, html.pad-nav .kachel:focus { transform: translateY(-3px); }
.pad-zeiger { position: fixed; z-index: 2500; width: 34px; height: 34px; margin: -17px 0 0 -17px; pointer-events: none; border-radius: 50%;
  border: 2px solid #ffd27a; box-shadow: 0 0 0 2px rgba(0,0,0,.55), 0 0 14px rgba(255,210,122,.7); }
.pad-zeiger::before, .pad-zeiger::after { content: ""; position: absolute; left: 50%; top: 50%; background: #ffd27a; transform: translate(-50%, -50%); }
.pad-zeiger::before { width: 2px; height: 12px; } .pad-zeiger::after { width: 12px; height: 2px; }
.pad-zeiger.muenze { border-color: #ffcf7a; border-style: dashed; }
.pad-zeiger[hidden] { display: none; }
.pad-hinweis { position: fixed; left: 50%; bottom: calc(1.2rem + env(safe-area-inset-bottom, 0px)); z-index: 2600; transform: translate(-50%, 16px); opacity: 0;
  transition: opacity .3s, transform .3s; max-width: min(36rem, calc(100vw - 32px)); padding: .55rem 1rem; text-align: center; pointer-events: none;
  background: rgba(20,16,26,.95); border: 1px solid var(--ember, #e0a046); color: var(--vellum, #ebe2cc); font-size: .9rem; line-height: 1.35; box-shadow: 0 12px 30px rgba(0,0,0,.55); }
.pad-hinweis.da { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 760px) { .pad-hinweis { bottom: calc(76px + env(safe-area-inset-bottom, 0px)); } }
@media (prefers-reduced-motion: reduce) { .pad-hinweis { transition: none; } }
`;
  document.head.appendChild(css);
  window.ImresPad = { aktiv: () => aktiv && aktiv.def.id };
})();
