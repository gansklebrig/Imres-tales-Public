/* Heldensturm – Barradin erzählt
   Ein Erzähler für heldensturm.html: Barradin (gesprochen von „Helmut“, ElevenLabs eleven_v3) erzählt beim Betreten
   eines Orts, kündigt Bosse und Wächter an und kommentiert das Geschehen. Nur Deutsch.

   Texte:      tools/vertonung/heldensturm-de.json  {"ziel": …, "zeilen": {id: "Text mit [Regie-Tags]"}}
               (für die Untertitel werden die Tags entfernt)
   Aufnahmen:  audio/heldensturm/de/manifest.json   {id: "audio/heldensturm/de/<datei>.mp3"}
               Fehlt das Manifest oder eine Zeile, bleibt Barradin stumm – der Untertitel erscheint trotzdem.

   Das Spiel meldet Ereignisse über HSErzaehler.ereignis(art, daten) – die Haken stehen in heldensturm.html
   im Abschnitt „Erzähler-Haken“ – und stellt window.HSErzHost bereit: zustand() und duck(f).

   Warteschlange: Erzählungen (Ort, Stufe, Boss, Wächter, Kampagnenende) haben Vorrang vor Kommentaren. Nie zwei Zeilen
   übereinander. Kommentare höchstens alle 25–40 s; was gerade nicht passt, wird verworfen statt gestaut. Boss-Auftritt
   und Tod dürfen einen laufenden Kommentar abbrechen. Während Barradin spricht, werden Musik und Geräusche sanft abgesenkt.
   Pausiert mit dem Spiel (Menüs, verdeckter Tab), verstummt im Hauptmenü.
   Einstellungen (localStorage „imres-hs-erzaehler“): Erzähler an / nur Erzählungen / aus, Lautstärke – erscheinen im
   vorhandenen Einstellungsmenü direkt unter Musik und Geräuschen. */
(function () {
  'use strict';
  if (window.HSErzaehler) return;

  const PFAD_TEXTE = 'tools/vertonung/heldensturm-de.json';
  const PFAD_MANIFEST = 'audio/heldensturm/de/manifest.json';
  const BILD = 'barradin-frei.webp';
  const KEY = 'imres-hs-erzaehler';
  const HELDEN = ['barradin', 'friedrich', 'echo', 'ezekiel'];
  const DUCK = 0.42;                 // Musik/Geräusche während Barradin spricht (Anteil)
  const KOM_PAUSE = [25, 40];        // Sekunden zwischen zwei Kommentaren
  const NACH_ERZ = 6;                // nach einer Erzählung so lange keine Kommentare

  const EN = (() => { try { return localStorage.getItem('imres-lang') === 'en'; } catch (e) { return false; } })();
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- Einstellungen ---------- */
  const EIN = (() => {
    const s = ls.get(KEY, {}) || {};
    const modus = ['an', 'erz', 'aus'].includes(s.modus) ? s.modus : 'an';
    const vol = typeof s.vol === 'number' && isFinite(s.vol) ? Math.min(1, Math.max(0, s.vol)) : 0.4;
    return { modus, vol };
  })();
  const einSichern = () => ls.set(KEY, EIN);
  const GEHOERT = ls.get(KEY + '-gehoert', {}) || {};         // id → wie oft schon gehört (Erzählungen)
  let NIEDERLAGE = !!ls.get(KEY + '-niederlage', false);       // letzter Lauf endete mit einer Niederlage

  /* ---------- Texte & Aufnahmen ---------- */
  let TEXTE = null, MANI = {}, laden = null;
  function ladenStarten() {
    if (laden || EN) return laden;
    const j = u => fetch(u, { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject(r.status));
    laden = Promise.all([
      j(PFAD_TEXTE).then(d => { TEXTE = d && d.zeilen && typeof d.zeilen === 'object' ? d.zeilen : {}; }).catch(() => { TEXTE = {}; }),
      j(PFAD_MANIFEST).then(d => { MANI = d && typeof d === 'object' ? d : {}; }).catch(() => { MANI = {}; })
    ]);
    return laden;
  }
  const hat = id => !!(TEXTE && typeof TEXTE[id] === 'string' && TEXTE[id].trim());
  const ohneTags = t => String(t).replace(/\[[^\]]*\]/g, ' ').replace(/\s+([,.!?:;…])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  const url = id => { const u = MANI && MANI[id]; return typeof u === 'string' && /\.mp3$/i.test(u) && !/^[a-z]+:|^\/\//i.test(u) ? u : null; };

  /* Zufallsauswahl ohne direkte Wiederholung: Familie „tod“ = tod_1, tod_2 …; mit Held zusätzlich tod_<held>_1 … */
  const ZULETZT = {};
  function familie(f, held) {
    if (!TEXTE) return [];
    const re = new RegExp('^' + f + '_(\\d+)$'), reH = held ? new RegExp('^' + f + '_' + held + '_(\\d+)$') : null;
    return Object.keys(TEXTE).filter(k => (re.test(k) || (reH && reH.test(k))) && hat(k));
  }
  function waehle(f, held) {
    const L = familie(f, held); if (!L.length) return null;
    const z = ZULETZT[f] || (ZULETZT[f] = []);
    const sperre = L.length >= 5 ? 2 : L.length >= 2 ? 1 : 0;
    const frei = L.filter(k => z.slice(-sperre).indexOf(k) < 0 || !sperre);
    const id = frei[Math.floor(Math.random() * frei.length)] || L[0];
    z.push(id); if (z.length > 4) z.shift();
    return id;
  }

  /* ---------- Ereignisarten ----------
     kat: erz = Erzählung (auch bei „nur Erzählungen“), kom = Kommentar
     prio: höher gewinnt; warte: so lange (s) darf eine Zeile auf ihren Einsatz warten, sonst verfällt sie
     vor: darf einen laufenden, niedrigeren Beitrag abbrechen; frei: ignoriert die Kommentar-Pause */
  const ART = {
    ort: { kat: 'erz', prio: 3, warte: 30 },
    stufe: { kat: 'erz', prio: 2, warte: 12 },
    boss: { kat: 'erz', prio: 4, warte: 4, vor: 1 },
    bosssieg: { kat: 'erz', prio: 3, warte: 15 },
    waechter: { kat: 'erz', prio: 2, warte: 4 },
    kampagne: { kat: 'erz', prio: 5, warte: 60 },
    start: { kat: 'kom', prio: 3, warte: 10, frei: 1 },
    tod: { kat: 'kom', prio: 4, warte: 6, vor: 1, frei: 1 },
    sieg: { kat: 'kom', prio: 3, warte: 8, frei: 1 },
    kom: { kat: 'kom', prio: 1, warte: 2.5 }
  };
  /* Wiederholungen von Erzählungen: die ersten zwei Male immer, danach nur noch manchmal */
  function erzChance(id, art) {
    const n = GEHOERT[id] || 0;
    if (art === 'kampagne' || n < 2) return 1;
    return art === 'boss' || art === 'bosssieg' ? 0.5 : 0.3;
  }

  /* ---------- Zustand ---------- */
  const API = { test: false };
  let uhr = 0;                 // Spielzeit des Erzählers (läuft nicht, solange pausiert)
  let komFrei = 0;             // ab dieser uhr sind Kommentare wieder erlaubt
  let cur = null;              // läuft gerade
  let Q = [];                  // Warteschlange
  let seq = 0, ducked = false, vorZustand = '', diesmal = new Set();
  const poll = { low: true, horde: true, idle: true, eingabe: 0 };
  const host = () => window.HSErzHost || null;
  function zustand() { try { const h = host(); return h && h.zustand ? h.zustand() : null; } catch (e) { return null; } }
  function duck(f) { try { const h = host(); if (h && h.duck) h.duck(f); } catch (e) {} }
  const aktiv = () => !EN && EIN.modus !== 'aus';
  const entsperrt = () => { try { if (navigator.userActivation) return navigator.userActivation.hasBeenActive; } catch (e) {} return geklickt; };
  let geklickt = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, () => { geklickt = true; }, { passive: true, capture: true }));
  function pausiert(z) { z = z || zustand(); return !z || z.st === 'title' || !!z.pause || document.hidden; }

  /* ---------- Vorladen (nur die nächsten wahrscheinlichen Zeilen) ---------- */
  const VORRAT = new Map();
  function vorladen(id) {
    const u = url(id); if (!u || VORRAT.has(u)) return;
    try {
      const a = new Audio(); a.preload = 'auto'; a.src = u; VORRAT.set(u, a);
      while (VORRAT.size > 5) { const k = VORRAT.keys().next().value; if (cur && cur.audio === VORRAT.get(k)) break; VORRAT.delete(k); }
    } catch (e) {}
  }

  /* ---------- Warteschlange ---------- */
  function einreihen(id, artName, extra) {
    if (!id || !hat(id)) return false;
    const art = ART[artName] || ART.kom;
    if (art.kat === 'kom' && EIN.modus === 'erz') return false;
    const it = Object.assign({ id, art: artName, kat: art.kat, prio: art.prio, warte: art.warte, vor: !!art.vor, frei: !!art.frei, t: uhr, n: seq++ }, extra || {});
    if (it.kat === 'kom' && !it.frei) {
      // unwichtige Kommentare: nur wenn gerade nichts läuft oder wartet und die Pause um ist
      if (cur || Q.length || uhr < komFrei) return false;
    }
    if (cur && it.vor && cur.prio < it.prio) { stoppen(cur, true); }
    // gleiche Zeile nicht doppelt anstellen
    if ((cur && cur.id === id) || Q.some(q => q.id === id)) return false;
    Q.push(it); Q.sort((a, b) => b.prio - a.prio || a.n - b.n);
    if (Q.length > 4) Q.length = 4;
    pumpe();
    return true;
  }
  function pumpe() {
    if (cur || !Q.length) return;
    const z = zustand(); if (pausiert(z)) return;
    Q = Q.filter(q => uhr - q.t <= q.warte);
    const it = Q.shift(); if (!it) return;
    abspielen(it);
  }
  function abspielen(it) {
    cur = it; ladenStarten();
    const text = ohneTags(TEXTE[it.id]);
    const breite = (utBauen().getBoundingClientRect().width || 600);
    it.text = text; it.teile = teilen(text, breite < 330 ? 95 : breite < 460 ? 120 : 150);
    it.dauer = Math.min(30, Math.max(3.2, 1.6 + text.length * 0.062));   // Lesezeit, falls ohne Ton
    it.rest = it.dauer; it.lauf = 0;
    if (it.kat === 'erz') { GEHOERT[it.id] = (GEHOERT[it.id] || 0) + 1; ls.set(KEY + '-gehoert', GEHOERT); diesmal.add(it.id); }
    const u = url(it.id);
    if (u && EIN.vol > 0 && entsperrt()) {
      try {
        const a = VORRAT.get(u) || new Audio(u);
        VORRAT.delete(u);
        a.preload = 'auto'; a.volume = EIN.vol;
        try { a.currentTime = 0; } catch (e) {}
        it.audio = a;
        a.onended = () => { if (cur === it) fertig(it); };
        a.onerror = () => { if (cur === it && it.audio === a) { it.audio = null; it.rest = it.dauer; duck(1); ducked = false; } };
        const p = a.play();
        if (p && p.catch) p.catch(() => { if (cur === it && it.audio === a) { it.audio = null; duck(1); ducked = false; } });
        duck(DUCK); ducked = true;
      } catch (e) { it.audio = null; }
    }
    unterZeigen(it);
  }
  function stoppen(it, schnell) {
    if (!it) return;
    const a = it.audio; it.audio = null;
    if (a) {
      if (schnell) { let v = a.volume; const iv = setInterval(() => { v -= 0.15; if (v <= 0) { clearInterval(iv); try { a.pause(); } catch (e) {} } else a.volume = Math.max(0, v); }, 30); }
      else try { a.pause(); } catch (e) {}
    }
    fertig(it, true);
  }
  function fertig(it, abgebrochen) {
    if (cur !== it) return;
    cur = null;
    if (it.audio) { try { it.audio.onended = it.audio.onerror = null; } catch (e) {} }
    unterVerbergen();
    if (ducked) { duck(1); ducked = false; }
    if (it.kat === 'kom') komFrei = Math.max(komFrei, uhr + rnd(KOM_PAUSE[0], KOM_PAUSE[1]));
    else komFrei = Math.max(komFrei, uhr + NACH_ERZ);
    setTimeout(pumpe, abgebrochen ? 150 : 450);
  }
  function allesStopp() {
    Q = [];
    if (cur) stoppen(cur);
    unterVerbergen(true);
  }

  /* ---------- Ereignisse aus dem Spiel ---------- */
  function ereignis(k, d) {
    d = d || {};
    try {
      if (!aktiv()) return;
      const z = zustand();
      if (z && (z.gast || (z.bot && !API.test))) return;
      if (!TEXTE) { ladenStarten().then(() => ereignis(k, d)); return; }
      const held = HELDEN.includes(d.held) ? d.held : (z && HELDEN.includes(z.held) ? z.held : '');
      switch (k) {
        case 'start': {
          Q = []; if (cur) stoppen(cur); komFrei = 0;
          poll.low = poll.horde = poll.idle = true;
          const m = d.modus || 'kampagne';
          let id = null;
          if (m === 'taeglich') id = waehle('taegliche');
          else if (m === 'abstieg' || m === 'bossrausch') id = waehle('start_' + m);
          else if (NIEDERLAGE && Math.random() < 0.7) id = waehle('rueckkehr');
          if (!id && held) id = waehle('start_' + held);
          NIEDERLAGE = false; ls.set(KEY + '-niederlage', false);
          einreihen(id, 'start');
          break;
        }
        case 'stufe': {
          // Vorladen: Wächter/Boss dieser Stufe und die nächste Erzählung
          if (d.boss) vorladen('boss_' + d.boss + '_auftritt'); else if (d.guard) vorladen('waechter_' + d.guard);
          if (d.next && d.next.ort !== undefined) vorladen(d.next.si ? 'stufe_' + d.next.ort + '_' + d.next.si : 'ort_' + d.next.ort + '_intro');
          if ((d.modus || 'kampagne') !== 'kampagne') break;
          const id = d.si ? 'stufe_' + d.ort + '_' + d.si : 'ort_' + d.ort + '_intro';
          if (!hat(id) || Math.random() > erzChance(id, 'stufe') * (diesmal.has(id) ? 0.5 : 1)) break;
          einreihen(id, d.si ? 'stufe' : 'ort');
          break;
        }
        case 'boss': {
          const id = 'boss_' + d.id + '_auftritt';
          vorladen('boss_' + d.id + '_sieg');
          if (hat(id) && Math.random() <= erzChance(id, 'boss')) einreihen(id, 'boss');
          break;
        }
        case 'bosssieg': {
          const id = 'boss_' + d.id + '_sieg';
          if (hat(id) && Math.random() <= erzChance(id, 'bosssieg')) einreihen(id, 'bosssieg');
          break;
        }
        case 'waechter': {
          const id = 'waechter_' + d.id;
          if (hat(id) && Math.random() <= erzChance(id, 'waechter')) einreihen(id, 'waechter');
          break;
        }
        case 'ende': {
          if (d.sieg && (d.modus || 'kampagne') === 'kampagne' && d.letzte) { Q = []; einreihen('sieg_kampagne', 'kampagne'); break; }
          if (d.sieg) { einreihen(waehle('sieg_modus'), 'sieg'); break; }
          NIEDERLAGE = true; ls.set(KEY + '-niederlage', true);
          Q = Q.filter(q => q.kat === 'erz' && q.prio >= 4);
          einreihen(d.zeit ? waehle('zeit') : waehle('tod', held), 'tod');
          break;
        }
        case 'levelup': if ((d.level || 0) >= 2 && Math.random() < 0.5) einreihen(waehle('levelup', held), 'kom'); break;
        case 'karte': {
          if (Math.random() > 0.85) break;
          const fam = d.id === 'a_gold' && familie('karte_gold').length ? 'karte_gold' : d.r === 'l' ? 'karte_legendaer' : d.r === 'e' ? 'karte_episch' : 'karte_selten';
          einreihen(waehle(fam), 'kom');
          break;
        }
        case 'truhe': if (Math.random() < (d.mimic ? 0.9 : 0.4)) einreihen(waehle(d.mimic ? 'mimic' : 'truhe'), 'kom'); break;
        case 'serie': if (Math.random() < 0.8) einreihen(waehle('serie'), 'kom'); break;
        default: break;
      }
    } catch (e) { if (API.test) console.warn('Erzähler', e); }
  }

  /* ---------- Takt: Pause, Abspielen ohne Ton, Beobachtungen ---------- */
  let letzt = performance.now(), tick = 0;
  function takt() {
    const jetzt = performance.now(), dt = Math.min(1, (jetzt - letzt) / 1000); letzt = jetzt;
    const z = zustand(); if (!z) return;
    if (z.st === 'title' && vorZustand && vorZustand !== 'title') allesStopp();
    vorZustand = z.st;
    if (!aktiv()) { if (cur || Q.length) allesStopp(); return; }
    const p = pausiert(z);
    if (cur) {
      if (p) {
        if (!cur.pz) { cur.pz = 1; if (cur.audio) try { cur.audio.pause(); } catch (e) {} if (ducked) { duck(1); ducked = false; } unterPause(true); }
        return;
      }
      if (cur.pz) {
        cur.pz = 0; unterPause(false);
        if (cur.audio) { const pr = cur.audio.play(); if (pr && pr.catch) pr.catch(() => {}); duck(DUCK); ducked = true; }
      }
    }
    if (p) return;
    uhr += dt;
    if (cur) {
      cur.lauf += dt;
      if ((tick = (tick + 1) % 3) === 0) platzieren();
      if (cur.audio) {
        const a = cur.audio, d = isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
        unterFortschritt(d ? a.currentTime / d : Math.min(1, cur.lauf / cur.dauer));
        if (cur.lauf > Math.max(45, d + 4)) fertig(cur);         // Sicherheitsnetz
      } else {
        cur.rest -= dt; unterFortschritt(1 - cur.rest / cur.dauer);
        if (cur.rest <= 0) fertig(cur);
      }
    } else if (Q.length) pumpe();

    // Beobachtungen im Spiel
    if (z.bot && !API.test || z.gast || z.st !== 'play') return;
    // bleibt „scharf“, solange der Kommentar nur wegen einer laufenden Zeile/Abklingzeit nicht passte
    const frei = () => !cur && !Q.length && uhr >= komFrei;
    if (z.hp < 0.25 && !z.down && poll.low) { if (frei()) { poll.low = false; if (Math.random() < 0.85) einreihen(waehle('wenig_leben'), 'kom'); } }
    else if (z.hp > 0.6) poll.low = true;
    if (z.gegner >= 40 && poll.horde) { if (frei()) { poll.horde = false; if (Math.random() < 0.7) einreihen(waehle('horde'), 'kom'); } }
    else if (z.gegner < 15) poll.horde = true;
    if (z.eingabe) {
      if (z.eingabe !== poll.eingabe) { poll.eingabe = z.eingabe; poll.idle = true; }
      else if (poll.idle && performance.now() - z.eingabe > 55000 && frei()) { poll.idle = false; einreihen(waehle('nichtstun'), 'kom'); }
    }
  }
  setInterval(takt, 200);
  document.addEventListener('visibilitychange', takt);

  /* Untertitel in Häppchen: lange Erzählungen satzweise, passend zum Fortschritt der Aufnahme */
  function teilen(t, max) {
    max = max || 150;
    const S = t.match(/[^.!?…]+(?:[.!?…]+[“"»]?|$)\s*/g) || [t];
    const out = []; let b = '';
    for (const s of S) { if ((b + s).length > max && b) { out.push(b.trim()); b = s; } else b += s; }
    if (b.trim()) out.push(b.trim());
    let sum = 0; const tot = out.reduce((a, s) => a + s.length, 0) || 1;
    return out.map(s => { const o = { s, ab: sum / tot }; sum += s.length; return o; });
  }

  /* ---------- Untertitel ---------- */
  let UT = null, utZeile = null, utTeil = -1, utHide = 0;
  function css() {
    if (document.getElementById('erzCss')) return;
    const st = document.createElement('style'); st.id = 'erzCss';
    st.textContent = `
.erzSub{position:fixed;z-index:31;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);transform:translate(-50%,10px);width:min(640px,calc(100vw - 600px));min-width:340px;
 display:flex;gap:12px;align-items:center;padding:10px 16px 10px 10px;border-radius:14px;pointer-events:none;opacity:0;transition:opacity .35s ease,transform .35s ease;
 background:linear-gradient(180deg,rgba(28,20,26,.9),rgba(16,11,15,.9));border:1px solid rgba(229,180,84,.42);box-shadow:0 6px 24px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,230,180,.06);
 color:#f0e6d4;font-family:"Alegreya Sans",system-ui,sans-serif}
.erzSub.an{opacity:1;transform:translate(-50%,0)}
.erzSub.oben{top:calc(env(safe-area-inset-top,0px) + 10px)!important;bottom:auto!important}
.erzSub.pz{opacity:0!important}
.erzSub .erzBild{flex:0 0 auto;width:46px;height:46px;border-radius:50%;overflow:hidden;position:relative;border:2px solid #e5b454;background:#2a1d14;box-shadow:0 0 0 2px rgba(0,0,0,.4)}
.erzSub .erzBild img{position:absolute;width:190%;left:-45%;top:-4%;display:block}
.erzSub .erzBild b{position:absolute;inset:0;display:none;align-items:center;justify-content:center;color:#e5b454;font-size:24px}
.erzSub .erzBild.leer img{display:none}.erzSub .erzBild.leer b{display:flex}
.erzSub .erzNote{position:absolute;right:-4px;bottom:-4px;width:18px;height:18px;border-radius:50%;background:#7a2a3a;color:#ffe6b0;font-size:11px;display:flex;align-items:center;justify-content:center;border:1px solid #e5b454}
.erzSub.spricht .erzNote{animation:erzWipp 1.1s ease-in-out infinite}
@keyframes erzWipp{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-3px) rotate(8deg)}}
.erzSub .erzTxt{min-width:0;flex:1}
.erzSub .erzWer{font-family:"IM Fell English SC",Georgia,serif;color:#e5b454;font-size:13px;letter-spacing:.06em;line-height:1;margin-bottom:3px}
.erzSub .erzWer span{color:#a99a8b;font-family:"Alegreya Sans",system-ui,sans-serif;letter-spacing:0;font-size:12px}
.erzSub .erzZeile{font-size:17px;line-height:1.34;font-weight:500;text-shadow:0 1px 2px rgba(0,0,0,.7);transition:opacity .25s}
.erzSub .erzZeile.wechsel{opacity:.15}
@media (max-width:1000px){.erzSub{left:max(10px,env(safe-area-inset-left,0px));right:calc(max(14px,env(safe-area-inset-right,0px)) + 342px);width:auto;min-width:0;transform:translateY(10px)}
 .erzSub.an{transform:none}.erzSub .erzZeile{font-size:15px}}
@media (max-width:620px){.erzSub{right:max(10px,env(safe-area-inset-right,0px));bottom:calc(env(safe-area-inset-bottom,0px) + 196px);padding:8px 12px 8px 8px;gap:9px}
 .erzSub .erzBild{width:38px;height:38px}.erzSub .erzZeile{font-size:14.5px}}
@media (max-height:520px) and (min-width:621px){.erzSub{bottom:10px;padding:7px 12px 7px 7px;gap:9px}.erzSub .erzBild{width:36px;height:36px}.erzSub .erzZeile{font-size:14px;line-height:1.28}.erzSub .erzWer{font-size:11px}}
@media (prefers-reduced-motion:reduce){.erzSub,.erzSub .erzZeile{transition:none}.erzSub.spricht .erzNote{animation:none}}
html.ultra .erzSub{box-shadow:none;background:rgba(16,11,15,.92)}
.erzRow .erzChips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.erzRow .erzChips .btn{min-width:0}`;
    document.head.appendChild(st);
  }
  function utBauen() {
    if (UT && UT.isConnected) return UT;
    css();
    UT = document.createElement('div'); UT.className = 'erzSub'; UT.setAttribute('aria-live', 'polite'); UT.setAttribute('role', 'status');
    UT.innerHTML = `<div class="erzBild"><img alt="" src="${BILD}" decoding="async"><b aria-hidden="true">♪</b><span class="erzNote" aria-hidden="true">♪</span></div><div class="erzTxt"><div class="erzWer">Barradin <span>erzählt</span></div><div class="erzZeile"></div></div>`;
    const img = UT.querySelector('img'); img.onerror = () => img.parentNode.classList.add('leer');
    utZeile = UT.querySelector('.erzZeile');
    document.body.appendChild(UT);
    return UT;
  }
  function unterZeigen(it) {
    const el = utBauen(); clearTimeout(utHide);
    utTeil = -1; unterFortschritt(0);
    el.querySelector('.erzWer span').textContent = it.kat === 'erz' ? 'erzählt' : 'meint';
    el.classList.toggle('spricht', !!it.audio);
    el.classList.remove('pz');
    requestAnimationFrame(() => { el.classList.add('an'); platzieren(); });
  }
  function unterFortschritt(f) {
    if (!cur || !utZeile || !cur.teile) return;
    let i = 0; for (let k = 0; k < cur.teile.length; k++) if (f + 0.02 >= cur.teile[k].ab) i = k;
    if (i === utTeil) return;
    const erst = utTeil < 0; utTeil = i;
    if (erst) { utZeile.textContent = cur.teile[i].s; return; }
    utZeile.classList.add('wechsel');
    setTimeout(() => { if (cur && cur.teile[i]) utZeile.textContent = cur.teile[i].s; utZeile.classList.remove('wechsel'); }, 180);
  }
  function unterPause(an) { if (UT) UT.classList.toggle('pz', an); }
  /* In Menüs (Stufen-Intro, Ende …): nie über Knöpfen – dann lieber oben am Rand */
  function platzieren() {
    if (!UT || !UT.classList.contains('an')) return;
    const scr = document.getElementById('scr');
    if (!scr || scr.hidden) { UT.classList.remove('oben'); return; }
    const B = [...scr.querySelectorAll('button')].map(b => b.getBoundingClientRect()).filter(r => r.width && r.height && r.bottom > 0 && r.top < innerHeight);
    const treffer = oben => { UT.classList.toggle('oben', oben); const u = UT.getBoundingClientRect(); return B.filter(r => r.left < u.right && u.left < r.right && r.top < u.bottom && u.top < r.bottom).length; };
    const unten = treffer(false); if (!unten) return;
    if (treffer(true) > unten) UT.classList.remove('oben');
  }
  function unterVerbergen() {
    if (!UT) return;
    UT.classList.remove('an', 'spricht', 'pz');
  }

  /* ---------- Einstellungen im vorhandenen Menü (unter Musik/Geräusche) ---------- */
  const MODI = [['an', 'An'], ['erz', 'Nur Erzählungen'], ['aus', 'Aus']];
  function zeileHtml() {
    const v = Math.round(EIN.vol * 100);
    return `<div><div class="t">Erzähler<small data-erz-vl>${EIN.modus === 'aus' ? 'aus' : v + '%'}</small></div>` +
      `<div class="d">Barradin erzählt die Geschichte und kommentiert das Geschehen. „Nur Erzählungen“: Orte, Bosse und Wächter, keine Kommentare.</div>` +
      `<input type="range" min="0" max="100" step="5" value="${v}" data-erzvol aria-label="Lautstärke des Erzählers">` +
      `<div class="erzChips">${MODI.map(([k, n]) => `<button class="btn small ${EIN.modus === k ? 'gold' : ''}" data-erzmodus="${k}" aria-pressed="${EIN.modus === k}">${n}</button>`).join('')}</div></div>`;
  }
  function einbauen() {
    if (EN) return;
    const el = document.getElementById('sndOpts');            // Zeile „Big Band / Klangkulisse …“ unter Musik und Geräuschen
    if (!el || !el.parentNode) return;
    const n = el.nextElementSibling;
    if (n && n.classList.contains('erzRow')) return;
    css();
    const row = document.createElement('div'); row.className = 'up vol erzRow'; row.innerHTML = zeileHtml();
    el.parentNode.insertBefore(row, el.nextSibling);
  }
  /* an Ort und Stelle aktualisieren (kein Neuaufbau – Fokus und Controller-Auswahl bleiben erhalten) */
  function zeilenAuffrischen() {
    const v = Math.round(EIN.vol * 100);
    for (const r of document.querySelectorAll('.erzRow')) {
      const l = r.querySelector('[data-erz-vl]'); if (l) l.textContent = EIN.modus === 'aus' ? 'aus' : v + '%';
      const s = r.querySelector('[data-erzvol]'); if (s && document.activeElement !== s && +s.value !== v) s.value = v;
      for (const b of r.querySelectorAll('[data-erzmodus]')) { const on = b.dataset.erzmodus === EIN.modus; b.classList.toggle('gold', on); b.setAttribute('aria-pressed', on); }
    }
  }
  let einPlan = 0;
  try {
    new MutationObserver(() => { if (einPlan) return; einPlan = requestAnimationFrame(() => { einPlan = 0; einbauen(); }); })
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-erzmodus]'); if (!b) return;
    EIN.modus = b.dataset.erzmodus; einSichern(); geklickt = true;
    if (EIN.modus === 'aus') allesStopp(); else ladenStarten();
    if (EIN.modus === 'erz') { Q = Q.filter(q => q.kat === 'erz'); if (cur && cur.kat === 'kom') stoppen(cur, true); }
    zeilenAuffrischen();
  });
  document.addEventListener('input', ev => {
    const r = ev.target && ev.target.closest && ev.target.closest('[data-erzvol]'); if (!r) return;
    EIN.vol = Math.min(1, Math.max(0, (+r.value || 0) / 100)); einSichern();
    if (cur && cur.audio) cur.audio.volume = EIN.vol;
    zeilenAuffrischen();
  });

  /* ---------- Schnittstelle ---------- */
  Object.defineProperty(API, 'einstellungen', { get() { return { modus: EIN.modus, vol: EIN.vol }; } });
  Object.assign(API, {
    ereignis,
    setzen(o) { if (o && ['an', 'erz', 'aus'].includes(o.modus)) EIN.modus = o.modus; if (o && typeof o.vol === 'number') EIN.vol = Math.min(1, Math.max(0, o.vol)); einSichern(); zeilenAuffrischen(); if (EIN.modus === 'aus') allesStopp(); },
    status() { return { aktiv: aktiv(), uhr: +uhr.toFixed(2), komFrei: +komFrei.toFixed(2), cur: cur ? { id: cur.id, art: cur.art, ton: !!cur.audio, pause: !!cur.pz } : null, Q: Q.map(q => q.id), texte: TEXTE ? Object.keys(TEXTE).length : 0, ton: Object.keys(MANI || {}).length, ducked }; },
    laden: ladenStarten,
    _: { einreihen, waehle, familie, ohneTags, teilen, allesStopp, takt, set uhr(v) { uhr = v; }, get uhr() { return uhr; }, set komFrei(v) { komFrei = v; } }
  });
  window.HSErzaehler = API;
  if (!EN) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(ladenStarten, 1500)); else setTimeout(ladenStarten, 1500); }
})();
