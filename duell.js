/* =====================================================================
   DUELL – Online-Duell zu zweit für die Tavernenspiele
   ---------------------------------------------------------------------
   Gemeinsame Grundlage für Bestiarium-Memory (extras.js) und Barradins
   Auftritt (auftritt.js): Raum eröffnen oder beitreten, Link teilen,
   wer ist da, wer ist weg, Uhrenabgleich – über Supabase Realtime
   (Broadcast, öffentlicher Kanal je Raum) und einen schlichten WebSocket,
   genau wie das Mitlauschen im Lautenwerk.

   window.ImresDuell
     .registrieren(spiel, { kartenId, titel(), hinweis(), beginnen(s), beenden(s), geste() })
     .oeffnen(spiel)              Duell-Fenster öffnen
     .sitzung(spiel)              laufende Sitzung oder null
     .bilanz(spiel, "sieg" | "niederlage" | "remis")
   Sitzung s: s.host, s.name, s.partner { id, name, weg }, s.senden(typ, daten),
     s.on(typ, fn), s.status(fn) – Arten: "partner" { neu }, "partnerWeg" { absichtlich },
     "verbindung" { ok, wieder } –, s.uhr() → Promise { versatz, rtt } (Partneruhr − eigene Uhr),
     s.jetzt(), s.leiste() (Statusleiste fürs Spiel), s.verlassen().
   Alles Empfangene ist fremd: Typen und Größen prüfen, Namen nur escaped zeigen.

   Für Tests: ?duell-test=ws://localhost:PORT (nur localhost) oder window.IMRES_DUELL_SERVER
   lenkt nur den Duell-Kanal auf einen anderen Realtime-Server; ?duell-uhr=MS verstellt
   dann zusätzlich die Duell-Uhr (Uhrenabgleich prüfen).
   ===================================================================== */
(function () {
  "use strict";
  if (window.ImresDuell) return;
  const SERVER = { url: "https://iszdxkwkgkksdemtqhwu.supabase.co", key: "sb_publishable_Bt3Vw5BSnLaVcTRPTS0ZsA_MeG6G2-Z" };
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lies = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  const suche = (() => { try { return new URLSearchParams(location.search); } catch (_) { return new Map(); } })();
  const TEST = (() => { const q = suche.get("duell-test"); return q && /^wss?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(q) ? q : null; })();
  const SKEW = TEST ? Math.max(-864e5, Math.min(864e5, parseFloat(suche.get("duell-uhr")) || 0)) : 0;
  const wsAdresse = () => {
    const b = typeof window.IMRES_DUELL_SERVER === "string" && /^wss?:\/\/[^\s"<>]+$/.test(window.IMRES_DUELL_SERVER) ? window.IMRES_DUELL_SERVER : TEST;
    return (b ? b.replace(/\/+$/, "") : SERVER.url.replace(/^http/, "ws")) + "/realtime/v1/websocket?apikey=" + encodeURIComponent(SERVER.key) + "&vsn=1.0.0";
  };
  const ursprung = performance.timeOrigin || (Date.now() - performance.now());
  /* gemeinsame Uhr (Millisekunden); jedes Gerät hat seine eigene – s.uhr() misst den Versatz */
  const jetzt = () => ursprung + performance.now() + SKEW;

  const TX = {
    de: {
      knopf: "⚔ Online-Duell", titel: "Online-Duell", schliessen: "Schließen",
      text: "Zwei Spieler, zwei Geräte: Eröffne einen Raum und schick den Link – oder tritt mit dem Code eines Freundes bei.",
      name: "Dein Name", namePlatz: "z. B. Barradin", eroeffnen: "Raum eröffnen", oder: "oder", code: "Raum-Code", beitreten: "Beitreten",
      codeFalsch: "Der Code hat vier Zeichen (Buchstaben und Ziffern).", nameFehlt: "Bitte gib einen Namen ein.",
      raum: "Raum", teilen: "Link teilen", kopieren: "Link kopieren", kopiert: "Link kopiert!", wartenGegner: "Warte auf Gegner …",
      wartenText: "Schick diesen Link oder den Code an deinen Gegner. Sobald er beitritt, geht es los.",
      suchen: c => "Suche Raum " + c + " …", nichtGefunden: c => "In Raum " + c + " ist noch niemand – stimmt der Code? Ich warte weiter …",
      voll: "Raum ist voll – dort spielen schon zwei.", zurueck: "Zurück", abbrechen: "Abbrechen",
      verbunden: n => "Verbunden mit " + n, verbinde: "Verbinde …", unterbrochen: "Verbindung unterbrochen – versuche erneut …",
      gegnerWeg: n => n + " hat das Spiel verlassen", gegnerWegText: "Du kannst warten, bis er zurückkommt, oder das Duell verlassen.",
      wartenWeiter: "Weiter warten", verlassen: "Duell verlassen", verlassenFrage: "Das laufende Duell verlassen?",
      duell: "Duell", gegen: "gegen", bilanz: (s, n, r) => "Deine Duelle hier: " + s + (s === 1 ? " Sieg" : " Siege") + " · " + n + (n === 1 ? " Niederlage" : " Niederlagen") + (r ? " · " + r + " unentschieden" : ""),
      teilenText: (spiel, c) => "Fordere mich heraus – " + spiel + " auf imrestales.de, Raum " + c,
      gegner: "Gegner", du: "Du"
    },
    en: {
      knopf: "⚔ Online duel", titel: "Online duel", schliessen: "Close",
      text: "Two players, two devices: open a room and send the link – or join with a friend's code.",
      name: "Your name", namePlatz: "e.g. Barradin", eroeffnen: "Open a room", oder: "or", code: "Room code", beitreten: "Join",
      codeFalsch: "The code has four characters (letters and digits).", nameFehlt: "Please enter a name.",
      raum: "Room", teilen: "Share link", kopieren: "Copy link", kopiert: "Link copied!", wartenGegner: "Waiting for an opponent …",
      wartenText: "Send this link or the code to your opponent. As soon as they join, it begins.",
      suchen: c => "Looking for room " + c + " …", nichtGefunden: c => "Nobody is in room " + c + " yet – is the code right? I'll keep waiting …",
      voll: "Room is full – two are already playing there.", zurueck: "Back", abbrechen: "Cancel",
      verbunden: n => "Connected with " + n, verbinde: "Connecting …", unterbrochen: "Connection lost – trying again …",
      gegnerWeg: n => n + " has left the game", gegnerWegText: "You can wait for them to come back or leave the duel.",
      wartenWeiter: "Keep waiting", verlassen: "Leave duel", verlassenFrage: "Leave the running duel?",
      duell: "Duel", gegen: "vs", bilanz: (s, n, r) => "Your duels here: " + s + (s === 1 ? " win" : " wins") + " · " + n + (n === 1 ? " loss" : " losses") + (r ? " · " + r + (r === 1 ? " draw" : " draws") : ""),
      teilenText: (spiel, c) => "Challenge me – " + spiel + " on imrestales.de, room " + c,
      gegner: "Opponent", du: "You"
    }
  };
  const t = () => TX[sprache()];

  /* Namen: höchstens 16 Zeichen, keine Steuerzeichen */
  const nameSauber = v => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 16);
  const nameVorschlag = () => nameSauber(lies("imres-duell-name", "") || ["imres-auftritt-name", "imres-waldlauf-name", "imres-diebesnacht-name", "imres-echohort-name"].map(k => lies(k, "")).find(Boolean) || "");
  const ZEICHEN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const neuerCode = () => { let c = ""; const z = new Uint32Array(4); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(z) : z.forEach((_, i) => { z[i] = Math.random() * 1e9; }); z.forEach(x => { c += ZEICHEN[x % ZEICHEN.length]; }); return c; };
  const codeSauber = v => String(v == null ? "" : v).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const codeOk = c => /^[A-Z0-9]{4,6}$/.test(c);
  const neueId = () => (Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 8)).slice(0, 12).padEnd(8, "0");
  const ID_RE = /^[a-z0-9]{6,16}$/;

  /* ---------- Transport: Supabase Realtime über einen schlichten WebSocket (Phoenix-Protokoll 1.0.0) ---------- */
  const MAX_NACHRICHT = 12000;
  function kanal(topic, beiNachricht, beiStatus) {
    let ws = null, ref = 0, joinRef = null, herz = null, zu = false, offen = false, versuch = 0, wartet = null, beitritt = null, herzOffen = null;
    const roh = (event, payload, tp) => {
      if (!ws || ws.readyState !== 1) return false;
      try { ws.send(JSON.stringify({ topic: tp || topic, event, payload, ref: String(++ref), join_ref: tp ? undefined : joinRef })); return true; } catch (_) { return false; }
    };
    function spaeter() { if (zu) return; clearTimeout(wartet); const ms = Math.min(8000, 700 * Math.pow(1.6, versuch++)); wartet = setTimeout(auf, ms); }
    function auf() {
      if (zu) return;
      beiStatus("verbinde");
      let dies;
      try { dies = ws = new WebSocket(wsAdresse()); } catch (_) { ws = null; beiStatus("fehler"); spaeter(); return; }
      dies.onopen = () => {
        if (ws !== dies) return;
        joinRef = String(++ref);
        dies.send(JSON.stringify({ topic, event: "phx_join", ref: joinRef, join_ref: joinRef,
          payload: { config: { broadcast: { self: false, ack: false }, presence: { key: "" }, private: false } } }));
        clearInterval(herz);
        herz = setInterval(() => {
          /* keine Antwort auf den letzten Herzschlag → Leitung tot, neu verbinden */
          if (herzOffen && Date.now() - herzOffen.zeit > 20000) { try { dies.close(); } catch (_) {} return; }
          if (roh("heartbeat", {}, "phoenix")) herzOffen = herzOffen || { ref: String(ref), zeit: Date.now() };
        }, 25000);
        clearTimeout(beitritt);
        beitritt = setTimeout(() => { if (ws === dies && !offen) { try { dies.close(); } catch (_) {} } }, 10000);
      };
      dies.onmessage = e => {
        if (ws !== dies || typeof e.data !== "string" || e.data.length > MAX_NACHRICHT) return;
        let m; try { m = JSON.parse(e.data); } catch (_) { return; }
        if (!m || typeof m !== "object") return;
        if (m.topic === "phoenix") { if (m.event === "phx_reply") herzOffen = null; return; }
        if (m.topic !== topic) return;
        if (m.event === "phx_reply" && m.ref === joinRef) {
          if (m.payload && m.payload.status === "ok") { versuch = 0; offen = true; clearTimeout(beitritt); herzOffen = null; beiStatus("offen"); }
          else { try { dies.close(); } catch (_) {} }
        } else if (m.event === "broadcast" && m.payload && typeof m.payload === "object" && typeof m.payload.event === "string") {
          beiNachricht(m.payload.event, m.payload.payload);
        } else if (m.event === "phx_error" || m.event === "phx_close") { try { dies.close(); } catch (_) {} }
      };
      dies.onclose = () => {
        if (ws !== dies) return;
        clearInterval(herz); clearTimeout(beitritt); ws = null; offen = false; herzOffen = null;
        if (!zu) { beiStatus("fehler"); spaeter(); }
      };
      dies.onerror = () => { try { dies.close(); } catch (_) {} };
    }
    auf();
    return {
      senden: (ev, d) => offen && roh("broadcast", { type: "broadcast", event: ev, payload: d }),
      offen: () => offen,
      schliessen() { zu = true; clearInterval(herz); clearTimeout(wartet); clearTimeout(beitritt); try { if (offen) roh("phx_leave", {}); if (ws) ws.close(); } catch (_) {} ws = null; offen = false; },
      /* nur für Tests: Leitung kappen, als wäre das Netz weg */
      trennen() { if (ws) { try { ws.close(); } catch (_) {} } }
    };
  }

  /* ---------- Spiele, Sitzung ---------- */
  const SPIELE = {}; /* spiel → Einstellungen */
  let aktiv = null; /* höchstens ein Duell zugleich */
  const SYSTEM = { hallo: 1, willkommen: 1, voll: 1, tschuess: 1, ping: 1, pong: 1 };

  function sitzungBauen(spiel, code, rolle, name) {
    const cfg = SPIELE[spiel];
    const s = { spiel, code, rolle, host: rolle === "host", id: neueId(), name, partner: null, verbunden: false, warVerbunden: false, voll: false, zu: false, hinweisZu: false, versatz: 0 };
    const hoerer = {}, statusHoerer = [];
    let altPartner = null, warte = null, wacht = null, leisteEl = null, uhrWarte = null, uhrNr = 0;
    const melden = (art, d) => statusHoerer.slice().forEach(f => { try { f(art, d || {}); } catch (e) { console.error(e); } });
    const topic = "realtime:imres-duell-" + spiel + "-" + code.toLowerCase();
    const roh = (typ, d, an) => k.senden("duell", { v: 1, von: s.id, an: an || undefined, typ, d: d || {} });
    const hallo = () => roh("hallo", { name: s.name, rolle: s.rolle, partner: s.partner && !s.partner.weg ? s.partner.id : null });

    function partnerLebt() {
      if (!s.partner) return;
      s.partner.zuletzt = Date.now();
      if (s.partner.weg) { s.partner.weg = false; s.hinweisZu = false; leisteNeu(); melden("partner", { neu: false, zurueck: true }); }
    }
    function partnerNeu(id, name) {
      const neu = altPartner !== id;
      altPartner = id;
      s.partner = { id, name: name || "?", zuletzt: Date.now(), weg: false };
      s.voll = false; s.hinweisZu = false;
      leisteNeu(); melden("partner", { neu });
    }
    function partnerWeg(absichtlich) {
      if (!s.partner || s.partner.weg) return;
      s.partner.weg = true; s.hinweisZu = false;
      leisteNeu(); melden("partnerWeg", { absichtlich: !!absichtlich });
    }
    function halloBekommen(von, d) {
      const name = nameSauber(d.name) || "?", sagt = typeof d.partner === "string" ? d.partner : null;
      if (s.host) {
        if (d.rolle !== "gast") return;
        if (s.partner && s.partner.id === von) {
          if (s.partner.name !== name) { s.partner.name = name; leisteNeu(); }
          partnerLebt();
          if (sagt !== s.id) roh("willkommen", { name: s.name }, von); /* Willkommen ging verloren */
        } else if (!s.partner || s.partner.weg) {
          partnerNeu(von, name);
          roh("willkommen", { name: s.name }, von);
        } else roh("voll", {}, von);
      } else {
        if (d.rolle !== "host") return;
        if (s.partner && s.partner.id === von) {
          if (sagt && sagt !== s.id) { vollGemeldet(); return; } /* der Gastgeber spielt inzwischen mit jemand anderem */
          partnerLebt();
          if (!sagt) hallo();
        } else if (!s.partner || s.partner.weg) {
          if (sagt && sagt !== s.id) { if (!s.partner) vollGemeldet(); return; }
          hallo(); /* gleich melden, damit der Gastgeber uns aufnimmt */
        }
      }
    }
    function vollGemeldet() {
      if (s.voll) return;
      s.voll = true; leisteNeu(); melden("voll", {});
    }
    function nachricht(ev, p) {
      if (s.zu || ev !== "duell" || !p || typeof p !== "object" || p.v !== 1) return;
      const von = p.von, typ = p.typ, d = p.d && typeof p.d === "object" && !Array.isArray(p.d) ? p.d : {};
      if (typeof von !== "string" || !ID_RE.test(von) || von === s.id || typeof typ !== "string" || !/^[a-z][a-z0-9_?-]{0,15}$/.test(typ)) return;
      if (p.an != null && p.an !== s.id) return;
      if (typ === "hallo") { halloBekommen(von, d); return; }
      if (typ === "willkommen") {
        if (s.host) return;
        if (s.partner && s.partner.id === von) { partnerLebt(); return; }
        if (s.partner && !s.partner.weg) return;
        partnerNeu(von, nameSauber(d.name) || "?");
        return;
      }
      if (typ === "voll") { if (!s.host && (!s.partner || s.partner.id === von)) vollGemeldet(); return; }
      if (!s.partner || von !== s.partner.id) return;
      partnerLebt();
      if (typ === "tschuess") { partnerWeg(true); return; }
      if (typ === "ping") { if (Number.isInteger(d.n)) roh("pong", { n: d.n, nr: d.nr | 0, t0: +d.t0 || 0, t1: jetzt() }, von); return; }
      if (typ === "pong") { if (uhrWarte) uhrWarte(d); return; }
      if (SYSTEM[typ]) return;
      const f = hoerer[typ]; if (!f) return;
      try { f(d); } catch (e) { console.error(e); }
    }
    function status(art) {
      if (s.zu) return;
      if (art === "offen") {
        const wieder = s.warVerbunden;
        s.verbunden = true; s.warVerbunden = true;
        if (s.partner) s.partner.zuletzt = Date.now();
        hallo(); leisteNeu(); melden("verbindung", { ok: true, wieder });
      } else if (art === "fehler") {
        const war = s.verbunden; s.verbunden = false; leisteNeu();
        if (war) melden("verbindung", { ok: false });
      }
    }
    const k = kanal(topic, nachricht, status);
    warte = setInterval(() => { if (s.verbunden && !s.voll) hallo(); }, 3000);
    wacht = setInterval(() => {
      if (!s.partner || s.partner.weg) return;
      if (!s.verbunden) { s.partner.zuletzt = Date.now(); return; } /* eigene Leitung weg – nicht dem Gegner anlasten */
      if (Date.now() - s.partner.zuletzt > 10000) partnerWeg(false);
    }, 1000);

    s.on = (typ, fn) => { hoerer[typ] = fn; };
    s.status = fn => { statusHoerer.push(fn); };
    s.senden = (typ, d) => (s.partner && !s.zu ? roh(typ, d, s.partner.id) : false);
    s.da = () => !!(s.partner && !s.partner.weg && s.verbunden);
    s.jetzt = jetzt;
    s.gegnerName = () => (s.partner ? s.partner.name : t().gegner);
    /* NTP-artig: mehrere Ping-Pong-Runden, die Probe mit der kürzesten Laufzeit gilt */
    s.uhr = (runden) => new Promise(fertig => {
      runden = runden || 8;
      const nr = ++uhrNr, proben = [];
      let n = 0, aus = null, takt = null;
      const ende = () => {
        clearInterval(takt); clearTimeout(aus); if (uhrNr === nr) uhrWarte = null;
        if (!proben.length) { fertig(null); return; }
        proben.sort((a, b) => a.rtt - b.rtt);
        s.versatz = proben[0].versatz; fertig({ versatz: proben[0].versatz, rtt: proben[0].rtt, proben: proben.length });
      };
      uhrWarte = d => {
        if ((d.nr | 0) !== nr || !Number.isInteger(d.n)) return;
        const t2 = jetzt(), t0 = +d.t0, t1 = +d.t1;
        if (!isFinite(t0) || !isFinite(t1) || t0 > t2 || t2 - t0 > 5000) return;
        proben.push({ rtt: t2 - t0, versatz: t1 - (t0 + t2) / 2 });
        if (proben.length >= runden) ende();
      };
      takt = setInterval(() => { if (n >= runden) { clearInterval(takt); return; } roh("ping", { n: n++, nr, t0: jetzt() }, s.partner && s.partner.id); }, 90);
      aus = setTimeout(ende, runden * 90 + 2500);
    });
    s.verlassen = (still) => {
      if (s.zu) return;
      roh("tschuess", {});
      s.zu = true; clearInterval(warte); clearInterval(wacht);
      setTimeout(() => k.schliessen(), 60);
      if (leisteEl) leisteEl.remove();
      if (aktiv === s) aktiv = null;
      try { cfg.beenden && cfg.beenden(s); } catch (e) { console.error(e); }
      if (!still) lobbyZu();
    };
    s._trennen = () => k.trennen();

    /* ---------- Statusleiste im Spiel ---------- */
    function leisteNeu() {
      if (!leisteEl) return;
      const T = t(), p = s.partner;
      let art = "ok", text;
      if (!s.verbunden) { art = "fehler"; text = s.warVerbunden ? T.unterbrochen : T.verbinde; }
      else if (s.voll) { art = "fehler"; text = T.voll; }
      else if (!p) { art = "warten"; text = s.host ? T.wartenGegner : T.suchen(s.code); }
      else if (p.weg) { art = "warn"; text = T.gegnerWeg(p.name); }
      else text = T.verbunden(p.name);
      const ohneGegner = !p || p.weg;
      leisteEl.className = "duell-leiste " + art;
      leisteEl.innerHTML =
        '<span class="dl-kopf">⚔ ' + esc(T.duell) + ' · <b class="dl-code">' + esc(s.code) + "</b></span>" +
        '<span class="dl-status" role="status" aria-live="polite"><i aria-hidden="true"></i>' + esc(text) + "</span>" +
        '<span class="dl-knoepfe">' + (ohneGegner && s.host && !s.voll ? '<button type="button" class="dl-teilen">' + esc(T.teilen) + "</button>" : "") +
          '<button type="button" class="dl-verlassen">' + esc(T.verlassen) + "</button></span>" +
        (p && p.weg && !s.hinweisZu ? '<div class="dl-hinweis"><p>' + esc(T.gegnerWegText) + '</p><button type="button" class="dl-warten">' + esc(T.wartenWeiter) + '</button><button type="button" class="dl-verlassen haupt">' + esc(T.verlassen) + "</button></div>" : "");
    }
    s.leiste = () => {
      if (!leisteEl) {
        leisteEl = document.createElement("div");
        leisteEl.addEventListener("click", e => {
          if (e.target.closest(".dl-verlassen")) { if (!s.partner || s.partner.weg || window.confirm(t().verlassenFrage)) s.verlassen(); return; }
          if (e.target.closest(".dl-warten")) { s.hinweisZu = true; leisteNeu(); return; }
          if (e.target.closest(".dl-teilen")) { lobbyZeigen("warten"); }
        });
        leisteNeu();
      }
      return leisteEl;
    };
    s._leisteNeu = leisteNeu;
    return s;
  }

  /* ---------- Duell-Fenster (Lobby) ---------- */
  let dlg = null, dlgSpiel = null, dlgZustand = "start", dlgFehler = "", suchUhr = null, nichtGefunden = false;
  const link = (spiel, code) => location.origin + location.pathname + "?duell=" + encodeURIComponent(code) + (TEST ? "&duell-test=" + encodeURIComponent(TEST) : "") + "#" + SPIELE[spiel].kartenId;
  function bilanzLesen(spiel) {
    let b = {}; try { b = JSON.parse(lies("imres-duell-bilanz", "{}")) || {}; } catch (_) {}
    const x = b && typeof b === "object" ? b[spiel] : null;
    return { s: Math.max(0, (x && x.s) | 0), n: Math.max(0, (x && x.n) | 0), r: Math.max(0, (x && x.r) | 0) };
  }
  function bilanz(spiel, art) {
    let b = {}; try { b = JSON.parse(lies("imres-duell-bilanz", "{}")) || {}; } catch (_) {}
    if (!b || typeof b !== "object" || Array.isArray(b)) b = {};
    const x = bilanzLesen(spiel);
    if (art === "sieg") x.s++; else if (art === "niederlage") x.n++; else if (art === "remis") x.r++; else return;
    b[spiel] = x; schreib("imres-duell-bilanz", JSON.stringify(b));
  }
  function lobbyBauen() {
    if (dlg) return;
    dlg = document.createElement("dialog");
    dlg.className = "duell-dialog";
    dlg.setAttribute("aria-labelledby", "duell-titel");
    document.body.appendChild(dlg);
    dlg.addEventListener("click", e => {
      if (e.target === dlg) { lobbyZu(); return; }
      if (e.target.closest(".dd-zu")) { lobbyZu(); return; }
      if (e.target.closest(".dd-eroeffnen")) { eroeffnen(); return; }
      if (e.target.closest(".dd-beitreten")) { beitreten(); return; }
      if (e.target.closest(".dd-kopieren")) { kopieren(); return; }
      if (e.target.closest(".dd-teilen")) { teilen(); return; }
      if (e.target.closest(".dd-abbrechen")) { if (aktiv) aktiv.verlassen(); else lobbyZu(); return; }
      if (e.target.closest(".dd-zurueck")) { dlgZustand = "start"; dlgFehler = ""; lobbyMalen(); }
    });
    dlg.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      if (e.target.closest(".dd-code")) { e.preventDefault(); beitreten(); }
      else if (e.target.closest(".dd-name") && dlgZustand === "beitreten") { e.preventDefault(); beitreten(); }
    });
    dlg.addEventListener("input", e => { const c = e.target.closest(".dd-code"); if (c) { const v = codeSauber(c.value); if (v !== c.value) c.value = v; } });
    dlg.addEventListener("close", () => { document.documentElement.classList.remove("duell-dialog-offen"); });
  }
  function lobbyMalen() {
    if (!dlg) return;
    const T = t(), cfg = SPIELE[dlgSpiel], s = aktiv && aktiv.spiel === dlgSpiel ? aktiv : null;
    const spielTitel = cfg && cfg.titel ? cfg.titel() : "";
    let innen = "";
    if (dlgZustand === "start" || dlgZustand === "beitreten") {
      const b = bilanzLesen(dlgSpiel), vorCode = dlgZustand === "beitreten" ? dlg.dataset.code || "" : "";
      innen =
        '<p class="dd-text">' + esc(T.text) + "</p>" +
        (cfg && cfg.hinweis ? '<p class="dd-hinweis">' + esc(cfg.hinweis()) + "</p>" : "") +
        '<label class="dd-feld"><span>' + esc(T.name) + '</span><input type="text" class="dd-name" maxlength="16" autocomplete="nickname" spellcheck="false" placeholder="' + esc(T.namePlatz) + '" value="' + esc(nameVorschlag()) + '"></label>' +
        (dlgZustand === "beitreten" ? "" : '<button type="button" class="dd-knopf haupt dd-eroeffnen">' + esc(T.eroeffnen) + "</button>" + '<p class="dd-oder"><span>' + esc(T.oder) + "</span></p>") +
        '<div class="dd-reihe"><label class="dd-feld"><span>' + esc(T.code) + '</span><input type="text" class="dd-code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="ABCD" value="' + esc(vorCode) + '"></label>' +
          '<button type="button" class="dd-knopf' + (dlgZustand === "beitreten" ? " haupt" : "") + ' dd-beitreten">' + esc(T.beitreten) + "</button></div>" +
        (dlgFehler ? '<p class="dd-fehler" role="alert">' + esc(dlgFehler) + "</p>" : "") +
        (b.s || b.n || b.r ? '<p class="dd-bilanz">' + esc(T.bilanz(b.s, b.n, b.r)) + "</p>" : "");
    } else if (dlgZustand === "warten" && s) {
      const l = link(dlgSpiel, s.code);
      innen =
        '<p class="dd-raum">' + esc(T.raum) + '</p><p class="dd-gross" aria-label="' + esc(T.raum + " " + s.code.split("").join(" ")) + '">' + esc(s.code) + "</p>" +
        '<input type="text" class="dd-link" readonly value="' + esc(l) + '" aria-label="Link">' +
        '<div class="dd-reihe mitte">' + (navigator.share ? '<button type="button" class="dd-knopf haupt dd-teilen">' + esc(T.teilen) + "</button>" : "") +
          '<button type="button" class="dd-knopf' + (navigator.share ? "" : " haupt") + ' dd-kopieren">' + esc(T.kopieren) + "</button></div>" +
        '<p class="dd-kopiert" role="status" aria-live="polite"></p>' +
        '<p class="dd-status"><i class="dd-kreisel" aria-hidden="true"></i>' + esc(s.partner && !s.partner.weg ? T.verbunden(s.partner.name) : s.verbunden ? T.wartenGegner : s.warVerbunden ? T.unterbrochen : T.verbinde) + "</p>" +
        '<p class="dd-text klein">' + esc(T.wartenText) + "</p>" +
        '<div class="dd-reihe mitte"><button type="button" class="dd-knopf leise dd-abbrechen">' + esc(T.abbrechen) + "</button></div>";
    } else if (dlgZustand === "suchen" && s) {
      innen =
        '<p class="dd-raum">' + esc(T.raum) + '</p><p class="dd-gross">' + esc(s.code) + "</p>" +
        '<p class="dd-status"><i class="dd-kreisel" aria-hidden="true"></i>' + esc(!s.verbunden ? (s.warVerbunden ? T.unterbrochen : T.verbinde) : nichtGefunden ? T.nichtGefunden(s.code) : T.suchen(s.code)) + "</p>" +
        '<div class="dd-reihe mitte"><button type="button" class="dd-knopf leise dd-abbrechen">' + esc(T.abbrechen) + "</button></div>";
    } else if (dlgZustand === "voll") {
      innen = '<p class="dd-fehler gross" role="alert">' + esc(T.voll) + '</p><div class="dd-reihe mitte"><button type="button" class="dd-knopf haupt dd-zurueck">' + esc(T.zurueck) + "</button></div>";
    } else { dlgZustand = "start"; lobbyMalen(); return; }
    dlg.innerHTML = '<button type="button" class="dd-zu" aria-label="' + esc(T.schliessen) + '">×</button>' +
      '<div class="dd-innen"><p class="dd-label">' + esc(spielTitel) + '</p><h3 id="duell-titel">⚔ ' + esc(T.titel) + "</h3>" + innen + "</div>";
  }
  function lobbyZeigen(zustand) {
    lobbyBauen();
    if (zustand) dlgZustand = zustand;
    if (aktiv) dlgSpiel = aktiv.spiel;
    lobbyMalen();
    if (!dlg.open) { try { dlg.showModal(); } catch (_) { dlg.setAttribute("open", ""); } }
    document.documentElement.classList.add("duell-dialog-offen");
    const f = dlg.querySelector(dlgZustand === "beitreten" ? (nameVorschlag() ? ".dd-beitreten" : ".dd-name") : dlgZustand === "start" ? ".dd-eroeffnen" : ".dd-knopf");
    if (f) { try { f.focus({ preventScroll: true }); } catch (_) {} }
  }
  function lobbyZu() {
    clearTimeout(suchUhr);
    if (dlg && dlg.open) { try { dlg.close(); } catch (_) { dlg.removeAttribute("open"); } }
    document.documentElement.classList.remove("duell-dialog-offen");
  }
  function nameAusFeld() {
    const f = dlg && dlg.querySelector(".dd-name"), n = nameSauber(f ? f.value : "");
    if (!n) { dlgFehler = t().nameFehlt; lobbyMalen(); const g = dlg.querySelector(".dd-name"); if (g) g.focus(); return ""; }
    schreib("imres-duell-name", n);
    return n;
  }
  function starten(spiel, code, rolle, name) {
    if (aktiv) aktiv.verlassen(true);
    const cfg = SPIELE[spiel];
    try { cfg.geste && cfg.geste(); } catch (_) {} /* im Klick: Ton freischalten */
    const s = aktiv = sitzungBauen(spiel, code, rolle, name);
    s.status((art) => {
      if (aktiv !== s) return;
      if (art === "voll") { s.verlassen(true); dlgSpiel = spiel; lobbyZeigen("voll"); return; }
      if (art === "partner" && dlg && dlg.open && (dlgZustand === "warten" || dlgZustand === "suchen")) { lobbyMalen(); setTimeout(() => { if (aktiv === s && s.partner && !s.partner.weg) lobbyZu(); }, 600); return; }
      if (dlg && dlg.open) lobbyMalen();
    });
    try { cfg.beginnen(s); } catch (e) { console.error(e); }
    return s;
  }
  function eroeffnen() {
    const name = nameAusFeld(); if (!name) return;
    dlgFehler = "";
    starten(dlgSpiel, neuerCode(), "host", name);
    lobbyZeigen("warten");
  }
  function beitreten() {
    const name = nameAusFeld(); if (!name) return;
    const f = dlg.querySelector(".dd-code"), code = codeSauber(f ? f.value : "");
    if (!codeOk(code)) { dlgFehler = t().codeFalsch; lobbyMalen(); const g = dlg.querySelector(".dd-code"); if (g) g.focus(); return; }
    dlgFehler = ""; nichtGefunden = false;
    const s = starten(dlgSpiel, code, "gast", name);
    lobbyZeigen("suchen");
    clearTimeout(suchUhr);
    suchUhr = setTimeout(() => { if (aktiv === s && !s.partner) { nichtGefunden = true; if (dlg.open && dlgZustand === "suchen") lobbyMalen(); } }, 8000);
  }
  function kopieren() {
    const s = aktiv; if (!s) return;
    const l = link(s.spiel, s.code), info = dlg.querySelector(".dd-kopiert");
    const ok = () => { if (info) info.textContent = t().kopiert; };
    const alt = () => { const f = dlg.querySelector(".dd-link"); if (f) { f.focus(); f.select(); try { document.execCommand("copy"); ok(); } catch (_) {} } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(l).then(ok, alt); else alt();
  }
  function teilen() {
    const s = aktiv; if (!s) return;
    const cfg = SPIELE[s.spiel], l = link(s.spiel, s.code);
    if (!navigator.share) { kopieren(); return; }
    navigator.share({ title: t().titel, text: t().teilenText(cfg.titel ? cfg.titel() : "", s.code), url: l }).catch(() => {});
  }
  function oeffnen(spiel, o) {
    if (!SPIELE[spiel]) return;
    o = o || {};
    if (aktiv && aktiv.spiel !== spiel) {
      if (aktiv.partner && !aktiv.partner.weg && !window.confirm(t().verlassenFrage)) return;
      aktiv.verlassen(true);
    }
    dlgSpiel = spiel; dlgFehler = "";
    if (aktiv && aktiv.spiel === spiel) { lobbyZeigen(aktiv.host ? "warten" : "suchen"); return; }
    lobbyBauen();
    if (o.code) { dlg.dataset.code = o.code; lobbyZeigen("beitreten"); } else lobbyZeigen("start");
  }

  /* Link mit ?duell=CODE#spiel: sobald das Spiel angemeldet ist, Beitreten anbieten (ein Tipp – der schaltet auch den Ton frei) */
  let ausLink = (() => { const c = codeSauber(suche.get("duell")); return codeOk(c) ? c : null; })();
  function linkPruefen(spiel) {
    if (!ausLink) return;
    const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (id !== SPIELE[spiel].kartenId) return;
    const code = ausLink; ausLink = null;
    try { const u = new URL(location.href); u.searchParams.delete("duell"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } catch (_) {}
    setTimeout(() => oeffnen(spiel, { code }), 300);
  }
  function registrieren(spiel, cfg) {
    if (!/^[a-z]{2,16}$/.test(spiel) || !cfg || typeof cfg.beginnen !== "function") return;
    SPIELE[spiel] = cfg;
    linkPruefen(spiel);
  }
  window.addEventListener("hashchange", () => Object.keys(SPIELE).forEach(linkPruefen));
  new MutationObserver(() => { if (dlg && dlg.open) lobbyMalen(); if (aktiv) aktiv._leisteNeu(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  window.addEventListener("pagehide", () => { if (aktiv) aktiv.verlassen(true); });

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
.duell-knopf { border: 1px solid var(--ember); background: rgba(224,160,70,.1); color: var(--ember); font: inherit; font-size: .92rem; padding: .45rem 1rem; min-height: 40px; cursor: pointer; touch-action: manipulation; }
.duell-knopf:hover, .duell-knopf:focus-visible { background: var(--ember); color: var(--night); }
.duell-dialog { width: min(27rem, calc(100vw - 24px)); max-height: calc(100vh - 24px); padding: 0; border: 1px solid var(--ember); background: linear-gradient(180deg, #1d1720, #120e14); color: var(--vellum); box-shadow: 0 30px 80px rgba(0,0,0,.75), inset 0 0 0 1px rgba(255,210,140,.05); overflow: auto; }
.duell-dialog[open] { animation: ddEin .22s ease; }
@keyframes ddEin { from { opacity: 0; transform: translateY(12px); } }
.duell-dialog::backdrop { background: rgba(6,5,10,.78); backdrop-filter: blur(3px); }
.dd-zu { position: absolute; top: .4rem; right: .4rem; width: 2.6rem; height: 2.6rem; border: 0; background: none; color: var(--ash); font-size: 1.7rem; line-height: 1; cursor: pointer; }
.dd-zu:hover { color: var(--vellum); }
.dd-innen { padding: 1.4rem clamp(1rem, 5vw, 1.6rem) 1.3rem; display: grid; gap: .75rem; }
.dd-label { margin: 0; font-family: var(--display); font-size: .74rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ember); }
.duell-dialog h3 { margin: -.3rem 2rem 0 0; font-family: var(--name); font-weight: 400; font-size: clamp(1.5rem, 6vw, 1.9rem); line-height: 1.1; color: var(--vellum); }
.dd-text { margin: 0; color: var(--vellum); font-size: .95rem; line-height: 1.45; }
.dd-text.klein { font-size: .84rem; color: var(--ash); text-align: center; }
.dd-hinweis { margin: 0; font-size: .86rem; color: #ffd27a; border-left: 2px solid var(--ember); padding-left: .6rem; }
.dd-feld { display: grid; gap: .25rem; font-size: .8rem; color: var(--ash); flex: 1 1 8rem; }
.dd-feld input, .dd-link { width: 100%; box-sizing: border-box; background: rgba(0,0,0,.35); border: 1px solid var(--line); color: var(--vellum); font: inherit; font-size: 1rem; padding: .55rem .7rem; min-height: 44px; }
.dd-feld input:focus, .dd-link:focus { outline: none; border-color: var(--ember); }
.dd-code { text-transform: uppercase; letter-spacing: .3em; font-family: var(--display) !important; }
.dd-link { font-size: .8rem; color: var(--ash); }
.dd-reihe { display: flex; flex-wrap: wrap; align-items: flex-end; gap: .5rem; }
.dd-reihe.mitte { justify-content: center; align-items: center; }
.dd-knopf { border: 1px solid var(--ember); background: none; color: var(--ember); font: inherit; font-size: .95rem; padding: .55rem 1.1rem; min-height: 44px; cursor: pointer; touch-action: manipulation; }
.dd-knopf.haupt { background: var(--ember); color: var(--night); font-weight: 600; }
.dd-knopf.leise { border-color: var(--line); color: var(--ash); }
.dd-knopf:hover, .dd-knopf:focus-visible { filter: brightness(1.12); }
.dd-oder { margin: 0; display: flex; align-items: center; gap: .6rem; color: var(--ash); font-size: .8rem; }
.dd-oder::before, .dd-oder::after { content: ""; flex: 1; border-top: 1px solid var(--line); }
.dd-fehler { margin: 0; color: #e08a7e; font-size: .88rem; }
.dd-fehler.gross { font-size: 1.05rem; text-align: center; padding: .6rem 0; }
.dd-bilanz { margin: 0; font-size: .8rem; color: var(--ash); text-align: center; }
.dd-raum { margin: 0; text-align: center; font-size: .75rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ash); }
.dd-gross { margin: -.4rem 0 0; text-align: center; font-family: var(--display); font-size: 2.8rem; letter-spacing: .3em; padding-left: .3em; color: #ffd27a; text-shadow: 0 0 22px rgba(255,190,90,.35); }
.dd-kopiert { margin: 0; min-height: 1em; text-align: center; color: var(--ember); font-size: .85rem; }
.dd-status { margin: 0; display: flex; justify-content: center; align-items: center; gap: .55rem; font-family: var(--name); font-size: 1.08rem; text-align: center; }
.dd-kreisel { flex: 0 0 auto; width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid rgba(224,160,70,.25); border-top-color: var(--ember); animation: ddDreh .9s linear infinite; }
@keyframes ddDreh { to { transform: rotate(360deg); } }
html.duell-dialog-offen { overflow: hidden; }
.duell-leiste { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .8rem; line-height: 1.3; padding: .45rem .7rem; border: 1px solid var(--line); background: rgba(16,14,21,.75); font-size: .86rem; color: var(--vellum); }
.duell-leiste .dl-kopf { font-family: var(--display); letter-spacing: .06em; color: var(--ember); }
.duell-leiste .dl-code { letter-spacing: .14em; color: #ffd27a; font-weight: 400; }
.duell-leiste .dl-status { display: inline-flex; align-items: center; gap: .4rem; flex: 1 1 10rem; min-width: 0; }
.duell-leiste .dl-status i { flex: 0 0 auto; width: .6rem; height: .6rem; border-radius: 50%; background: #8fd36b; box-shadow: 0 0 8px rgba(143,211,107,.7); }
.duell-leiste.warten .dl-status i { background: none; border: 2px solid rgba(224,160,70,.25); border-top-color: var(--ember); width: .7rem; height: .7rem; animation: ddDreh .9s linear infinite; box-shadow: none; }
.duell-leiste.warn { border-color: rgba(224,160,70,.6); }
.duell-leiste.warn .dl-status i { background: var(--ember); box-shadow: 0 0 8px rgba(224,160,70,.7); }
.duell-leiste.fehler { border-color: rgba(196,86,74,.7); }
.duell-leiste.fehler .dl-status i { background: #c4564a; box-shadow: 0 0 8px rgba(196,86,74,.8); animation: ddBlink 1s steps(2) infinite; }
@keyframes ddBlink { 50% { opacity: .3; } }
.duell-leiste .dl-knoepfe { display: flex; gap: .4rem; margin-left: auto; }
.duell-leiste button { border: 1px solid var(--line); background: none; color: var(--ash); font: inherit; font-size: .8rem; padding: .3rem .7rem; min-height: 36px; cursor: pointer; touch-action: manipulation; }
.duell-leiste button:hover, .duell-leiste button:focus-visible { color: var(--vellum); border-color: var(--ash); }
.duell-leiste button.haupt, .duell-leiste .dl-teilen { border-color: var(--ember); color: var(--ember); }
@media (max-width: 520px) { .duell-leiste .dl-status { order: 3; flex-basis: 100%; } .duell-leiste .dl-hinweis { order: 4; } }
.duell-leiste .dl-hinweis { flex-basis: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .6rem; padding-top: .35rem; border-top: 1px solid var(--line); }
.duell-leiste .dl-hinweis p { margin: 0; flex: 1 1 12rem; color: var(--ash); font-size: .82rem; }
`;
  document.head.appendChild(css);

  window.ImresDuell = { registrieren, oeffnen, sitzung: spiel => (aktiv && aktiv.spiel === spiel ? aktiv : null), bilanz, jetzt, esc, nameSauber, t,
    _test: { trennen: () => aktiv && aktiv._trennen(), aktiv: () => aktiv } };
  document.dispatchEvent(new CustomEvent("imres:duell-bereit"));
})();
