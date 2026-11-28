/* Ezekiel – The Destroyer · W32 Online: Koop über das Internet (zwei Geräte)
   Baut auf W27 Koop (koop.js) auf: Der Gastgeber spielt ganz normal, Spieler 2 ist der entfernte Mitspieler – seine Eingaben kommen
   übers Netz (Z.koop.setInputSource). Nur beim Gastgeber läuft die Spielwelt („host-autoritativ“).

   Netz ohne eigenen Server:
   - WebRTC-Datenkanäle direkt von Gerät zu Gerät: „r“ zuverlässig/geordnet (Ereignisse, Gebiete, Lobby), „u“ ohne Neuversand und
     ungeordnet (Schnappschüsse, Eingaben – ein verlorenes Paket ersetzt das nächste).
   - Vermittlung (a) über den freien PeerJS-Vermittler (0.peerjs.com, MIT-Lizenz, Bibliothek liegt lokal in zerstoerer/lib) mit
     6-stelligem Raum-Code; (b) ganz ohne Dritte: Angebot/Antwort als Text zum Kopieren (oder Link mit #zs=…, der Teil nach # geht nie
     an einen Server). STUN: öffentliche Server (Cloudflare, Google) – sie sehen nur die öffentliche Adresse. Kein TURN (Weiterleitung):
     scheitert die direkte Verbindung (strenges/symmetrisches NAT), gibt es eine klare Meldung mit Tipps.
   Protokoll (JSON, jede Nachricht { t: … }):
     Gast → Gastgeber: hello, ready, i (Eingaben mit Folgenummern, die letzten 4 Bilder gebündelt, ~60 Hz), ping/pong, pz (Pause), req, bye
     Gastgeber → Gast: welcome, lobby, start/area (Gebiet per Seed + Prüfsumme; bei Abweichung Kacheln), s (Schnappschuss ~20 Hz,
     Delta gegen den zuletzt bestätigten Stand), td (Kachel-Änderungen), tiles, credit, ping/pong, bye
   Sicherheit: nur Datenkanäle; empfangene Daten werden nie ausgeführt; Größe, Typen, Feldnamen, Zahlen und Listenlängen werden geprüft;
   Verweise auf Spieldaten nur über eine feste Liste (Z.ENEMIES, Z.WEAPONS …). Der Gastgeber nimmt vom Gast nur Tasten-Bits an.
   Fortschritt: Der Gastgeber spielt in seinem Spielstand. Der Gast spielt in einer Kopie seines Spielstands (nichts wird gespeichert) und
   bekommt am Ende eine maßvolle Gutschrift (Seelensplitter, gedeckelt je Minute und Sitzung) in seinen aktiven Spielstand. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.online) return;
  const L = v => (Z.L ? Z.L(v) : Array.isArray(v) ? v[0] : v);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const now = () => performance.now();

  /* ======================= KONSTANTEN ======================= */
  const PROTO = 1, PFX = "imres-zs-", ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", CODE_N = 6;
  const LIB = "zerstoerer/lib/peerjs.min.js", LIB_SRI = "sha384-nlUQ8ZqCbvStErob+biJNzSgltf6urV3VGqhfIfzhmg9RXmpeRm76ELw0pYnKlTR";
  const MAXIN = 262144;          /* größte angenommene Nachricht (Zeichen) */
  const MAXU = 15000;            /* größer → über den zuverlässigen Kanal */
  const SNAP_MS = 50;            /* 20 Schnappschüsse/s */
  const INTERP = 100;            /* Puffer der Zwischenbilder beim Gast (ms) */
  const HIST = 48;               /* gemerkte Stände für Deltas */
  const T_CONNECT = 15000, T_LOST = 9000, T_GIVEUP = 45000;
  const ACT = ["left", "right", "up", "down", "jump", "roll", "a1", "a2", "s1", "s2", "use", "potion"];
  const LISTS = { E: "enemies", J: "projs", H: "hazards", A: "allies", K: "pickups", L: "propsLive", B: "bolts", S: "stuck", G: "gadgets" };
  const SKIP = new Set(["home", "uses", "patrol", "hits", "cape", "capeA", "firstHit", "lastSafe", "buf", "w9", "dotBase", "lostT", "seeT", "lostSight", "sus", "lkx", "lky", "alarmCd", "called", "peakY", "coyote", "jumpBuf", "safeT", "stepT", "mutS"]);
  const BADKEY = new Set(["__proto__", "constructor", "prototype"]);
  const LERP = new Set(["x", "y", "anim", "t", "run", "life"]);
  const KEYRX = /^[A-Za-z$][\w$]{0,31}$/;

  const S = {
    role: null, st: "", msg: "", link: null, peer: null, code: "", manual: null,
    hero: "G", gHero: "G", gName: "", hReady: false, gReady: false, playing: false,
    lastRx: 0, rtt: 0, pingT: 0, lostAt: 0, kind: "", route: "",
    /* Gastgeber */ hist: new Map(), seq: 0, ack: -1, ids: new WeakMap(), nid: 1, ev: [], evId: 0, lastIn: -1, held: {}, gPaused: false, sendT: 0, area: 0, tShadow: null, tT: 0, inRate: 0, inRateT: 0, credit: null,
    /* Gast */ states: new Map(), buf: [], applied: -1, iSeq: 0, iHist: [], off: null, live: new Map(), evSeen: new Set(), metaReal: null, slot: null, gotCredit: 0, creditShown: 0, t0: 0, areaN: -1, levelOk: true,
    stats: { rx: 0, tx: 0, bad: 0, snaps: 0, bytes: 0 }, sim: null
  };
  const O = (Z.online = { S, PROTO });

  /* ======================= HILFEN: PRÜFEN ======================= */
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
  const num = (v, lo, hi, d) => (typeof v === "number" && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
  const int = (v, lo, hi, d) => (Number.isInteger(v) && v >= lo && v <= hi ? v : d);
  const txt = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, "").slice(0, n) : "");
  const okId = v => typeof v === "string" && /^[a-z][a-z0-9_]{0,31}$/i.test(v);
  const heroOk = h => (h === "E" ? "E" : "G");
  const own = (o, k) => !!o && typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);

  /* ======================= KONFIGURATION ======================= */
  /* Nur für Tests (Playwright) über window.__zsNet änderbar – absichtlich NICHT über die Adresse (ein Link darf nie einen fremden Vermittler setzen) */
  function cfg() {
    const o = window.__zsNet || {};
    const ice = Array.isArray(o.ice) ? o.ice : [{ urls: "stun:stun.cloudflare.com:3478" }, { urls: "stun:stun.l.google.com:19302" }];
    return { ice, peer: Object.assign({ debug: 0, config: { iceServers: ice } }, o.peer || {}) };
  }
  function loadLib() {
    if (typeof window.Peer === "function") return Promise.resolve();
    return new Promise((ok, no) => {
      const s = document.createElement("script"); s.src = LIB; s.integrity = LIB_SRI; s.crossOrigin = "anonymous";
      s.onload = () => (typeof window.Peer === "function" ? ok() : no(new Error("lib")));
      s.onerror = () => no(new Error("lib")); document.head.appendChild(s);
    });
  }
  function newCode() { const a = new Uint32Array(CODE_N); crypto.getRandomValues(a); let s = ""; for (const v of a) s += ABC[v % ABC.length]; return s; }
  const normCode = c => String(c || "").toUpperCase().replace(/O/g, "0").replace(/I/g, "1").replace(/[^A-Z0-9]/g, "").split("").filter(ch => ABC.includes(ch)).join("").slice(0, CODE_N);

  /* ======================= VERBINDUNG (LINK) ======================= */
  /* einheitliche Hülle: sendR (zuverlässig), sendU (verlustfreundlich), close; onmsg/onclose setzt die Sitzung */
  function mkLink(pc, chR, sendRaw, chU) {
    const ln = { pc, chR, chU, open: false, closed: false, onmsg: null, onclose: null, lastR: 0 };
    const recv = d => {
      if (typeof d !== "string" || d.length > MAXIN) { S.stats.bad++; return; }
      let m; try { m = JSON.parse(d); } catch (e) { S.stats.bad++; return; }
      if (!isObj(m) || typeof m.t !== "string" || m.t.length > 8) { S.stats.bad++; return; }
      S.stats.rx++; S.lastRx = now(); ln.rx = (ln.rx | 0) + 1; /* W39 Robust: je Leitung zählen */
      if (ln.onmsg) try { ln.onmsg(m); } catch (e) { S.stats.bad++; console.warn("W32 online msg", m.t, e); }
    };
    ln.recv = recv;
    if (chU) chU.onmessage = e => recv(e.data);
    const delayed = (fn, ordered) => {
      const sm = S.sim; if (!sm) return fn();
      let at = now() + Math.max(0, sm.lat + (Math.random() * 2 - 1) * sm.jit);
      if (ordered) { at = Math.max(at, ln.lastR + 1); ln.lastR = at; }
      setTimeout(fn, at - now());
    };
    ln.sendR = m => { if (ln.closed) return; const s = JSON.stringify(m); S.stats.tx++; S.stats.bytes += s.length; delayed(() => { try { if (!ln.closed) sendRaw(s); } catch (e) { } }, true); };
    ln.sendU = m => {
      if (ln.closed) return; const s = JSON.stringify(m);
      if (!chU || chU.readyState !== "open" || s.length > MAXU || chU.bufferedAmount > 262144) return ln.sendR(m);
      S.stats.tx++; S.stats.bytes += s.length;
      if (S.sim && Math.random() < S.sim.loss) return;
      delayed(() => { try { if (chU.readyState === "open") chU.send(s); } catch (e) { } }, false);
    };
    ln.close = () => { if (ln.closed) return; ln.closed = true; try { chU && chU.close(); } catch (e) { } try { ln._close && ln._close(); } catch (e) { } try { pc && pc.close(); } catch (e) { } };
    if (pc) pc.addEventListener("iceconnectionstatechange", () => { if (pc.iceConnectionState === "failed") { ln.iceFailed = true; if (!ln.open) fail("nat"); } });
    return ln;
  }
  const mkU = pc => { try { return pc.createDataChannel("zsu", { negotiated: true, id: 77, ordered: false, maxRetransmits: 0 }); } catch (e) { return null; } };

  /* --- PeerJS (Raum-Code) --- */
  function peerErr(e) {
    const t = e && e.type;
    return t === "peer-unavailable" ? L(["Kein Raum mit diesem Code gefunden. Code prüfen – oder der Raum wurde geschlossen.", "No room with this code. Check the code – or the room was closed."])
      : t === "unavailable-id" ? L(["Dieser Code ist gerade vergeben – bitte neu versuchen.", "This code is taken – please try again."])
        : t === "network" || t === "server-error" || t === "socket-error" || t === "socket-closed" ? L(["Vermittlungsdienst nicht erreichbar. Internet prüfen – oder „Ohne Vermittler“ nutzen.", "Matchmaking service unreachable. Check your internet – or use “Without a broker”."])
          : t === "browser-incompatible" ? L(["Dieser Browser kann keine direkten Verbindungen (WebRTC).", "This browser can't do direct connections (WebRTC)."])
            : L(["Verbindung fehlgeschlagen.", "Connection failed."]);
  }
  function peerLink(conn) {
    const pc = conn.peerConnection, chU = mkU(pc);
    const ln = mkLink(pc, conn.dataChannel, s => conn.send(s), chU);
    conn.on("data", d => ln.recv(d));
    conn.on("close", () => gone(ln));
    conn.on("error", () => gone(ln));
    ln._close = () => conn.close();
    return ln;
  }
  function hostRoom(tries) {
    tries = tries || 0;
    setSt("opening", L(["Raum wird eröffnet …", "Opening room …"]));
    loadLib().then(() => {
      const code = newCode(), pr = new window.Peer(PFX + code, cfg().peer);
      S.peer = pr; S.code = code; S.kind = "peer";
      const to = setTimeout(() => { if (S.st === "opening" && S.peer === pr) { try { pr.destroy(); } catch (e) { } fail("broker"); } }, T_CONNECT);
      pr.on("open", () => { clearTimeout(to); if (S.peer !== pr) return; setSt("wait", ""); });
      pr.on("error", e => { if (S.peer !== pr) return; if (e.type === "unavailable-id" && tries < 4) { try { pr.destroy(); } catch (x) { } return hostRoom(tries + 1); } if (e.type === "peer-unavailable") return; if (S.st === "opening" || S.st === "wait") { clearTimeout(to); fail("broker", peerErr(e)); } });
      pr.on("disconnected", () => { if (S.peer === pr && !pr.destroyed && S.role === "host") setTimeout(() => { try { if (!pr.destroyed) pr.reconnect(); } catch (e) { } }, 2000); });
      pr.on("connection", conn => {
        /* nur EIN Mitspieler; ein bekannter Gast darf nach Abbruch wieder herein */
        conn.on("open", () => {
          /* W39 Robust: Sitzung inzwischen beendet (Titel/Spielstandwechsel; der Vermittler wird erst 300 ms später geschlossen) – ein
             Wiederverbindungsversuch des Gastes setzte sonst den Gastgeber ohne Rolle zurück in die Lobby */
          if (S.peer !== pr || S.role !== "host") { try { conn.close(); } catch (e) { } return; }
          const ln = peerLink(conn);
          if (!S.playing && !(S.link && S.link.open && !S.link.closed && S.st !== "lost")) return attach(ln);
          /* schon verbunden: nur derselbe Gast (Kennung aus „welcome“) darf die Leitung ersetzen – z. B. nach kurzem Netzausfall */
          /* W39 Robust: nur ein „hello“ entscheidet. Eingaben/Pings des wiederverbundenen Gastes kommen über den unzuverlässigen Kanal
             oft VOR dem „hello“ an – vorher galt schon das als fremd („Der Raum ist schon voll.“, Sitzung beendet nach Netzwacklern) */
          ln.onmsg = m => { if (!m || m.t !== "hello") return; if (S.gTok && m.tok === S.gTok) { attach(ln); hostMsg(m); } else { ln.sendR({ t: "bye", why: "voll" }); setTimeout(() => ln.close(), 300); } };
        });
      });
    }).catch(() => fail("lib"));
  }
  function joinRoom(code) {
    code = normCode(code); if (code.length !== CODE_N) return fail("code", L(["Der Code hat 6 Zeichen.", "The code has 6 characters."]));
    S.code = code; S.kind = "peer";
    /* W34 Online: nach Neuladen der Gast-Seite (gleicher Tab, gleicher Raum) die Kennung wiederverwenden – sonst „Raum voll“ bis zum Abbruch beim Gastgeber */
    try { const t = JSON.parse(sessionStorage.getItem("imres-zs-tok") || "null"); S.tok = t && t.c === code && typeof t.t === "string" ? txt(t.t, 24) : ""; } catch (e) { S.tok = ""; }
    setSt("connecting", L(["Verbinde mit Raum ", "Connecting to room "]) + code + " …");
    loadLib().then(() => {
      const pr = S.peer && !S.peer.destroyed ? S.peer : new window.Peer(cfg().peer); S.peer = pr;
      const to = setTimeout(() => { if ((S.st === "connecting") && S.peer === pr) fail("timeout"); }, T_CONNECT);
      const go = () => {
        const conn = pr.connect(PFX + code, { reliable: true, serialization: "raw", label: "zs" });
        conn.on("open", () => { clearTimeout(to); const ln = peerLink(conn); attach(ln); });
        conn.on("error", () => { });
      };
      if (pr.open) go(); else pr.on("open", go);
      pr.on("error", e => { if (S.peer !== pr) return; if (S.st === "connecting") { clearTimeout(to); fail("broker", peerErr(e)); } });
    }).catch(() => fail("lib"));
  }

  /* --- Ohne Vermittler: Angebot/Antwort als Text --- */
  const b64u = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = s => { const b = atob(s.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  async function pipe(u8, Ctor, kind, max) {
    const st = new Blob([u8]).stream().pipeThrough(new Ctor(kind)); const rd = st.getReader(); const parts = []; let n = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; if (n > max) { try { rd.cancel(); } catch (e) { } throw new Error("gross"); } parts.push(value); }
    const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
  }
  async function pack(obj, plain) {
    const raw = new TextEncoder().encode(JSON.stringify(obj));
    if (typeof CompressionStream === "function" && !plain) try { /* W33 Online: plain = Antwort ungepackt, wenn das Angebot ungepackt kam (alter Browser beim Gastgeber) */ return "ZS1z" + b64u(await pipe(raw, CompressionStream, "deflate-raw", 200000)); } catch (e) { }
    return "ZS1r" + b64u(raw);
  }
  async function unpack(s) {
    s = String(s || "").trim(); const m = /#zs=([A-Za-z0-9_\-]+)/.exec(s); if (m) s = "ZS1z" + m[1].replace(/^ZS1z/, "");
    s = s.replace(/\s+/g, "");
    if (s.length > 40000 || !/^ZS1[zr][A-Za-z0-9_\-]+$/.test(s)) throw new Error("fmt");
    let u = unb64u(s.slice(4));
    if (s[3] === "z") { if (typeof DecompressionStream !== "function") throw new Error("alt"); try { u = await pipe(u, DecompressionStream, "deflate-raw", 60000); } catch (e) { throw new Error(e && e.message === "gross" ? "fmt" : "alt"); } } /* W33 Online: alter Browser kann gepackte Texte nicht lesen → eigene Meldung */
    const o = JSON.parse(new TextDecoder().decode(u));
    if (!isObj(o) || (o.t !== "o" && o.t !== "a") || typeof o.s !== "string" || o.s.length > 50000 || !/^v=0\r?\n/.test(o.s)) throw new Error("fmt");
    return o;
  }
  function iceDone(pc, ms) { return new Promise(ok => { if (pc.iceGatheringState === "complete") return ok(); const t = setTimeout(ok, ms); pc.addEventListener("icegatheringstatechange", () => { if (pc.iceGatheringState === "complete") { clearTimeout(t); ok(); } }); }); }
  function manualPc() {
    const pc = new RTCPeerConnection({ iceServers: cfg().ice });
    const chR = pc.createDataChannel("zsr", { negotiated: true, id: 76, ordered: true });
    const chU = mkU(pc);
    const ln = mkLink(pc, chR, s => chR.send(s), chU);
    chR.onmessage = e => ln.recv(e.data);
    chR.onopen = () => attach(ln);
    chR.onclose = () => gone(ln);
    return { pc, ln };
  }
  async function manualHost() {
    S.kind = "manual"; setSt("opening", L(["Angebot wird erstellt …", "Creating offer …"]));
    const { pc } = manualPc(); S.manual = { pc };
    await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc, 5000);
    S.manual.offer = await pack({ t: "o", s: pc.localDescription.sdp });
    setSt("mwait", "");
  }
  async function manualAccept(ans) {
    const o = await unpack(ans); if (o.t !== "a") throw new Error("fmt");
    await S.manual.pc.setRemoteDescription({ type: "answer", sdp: o.s });
    setSt("connecting", L(["Verbinde direkt …", "Connecting directly …"]));
    setTimeout(() => { if (S.st === "connecting") fail(S.manual && S.manual.pc.iceConnectionState === "failed" ? "nat" : "timeout"); }, T_CONNECT);
  }
  async function manualGuest(offer) {
    S.kind = "manual";
    const o = await unpack(offer); if (o.t !== "o") throw new Error("fmt");
    const { pc } = manualPc(); S.manual = { pc };
    await pc.setRemoteDescription({ type: "offer", sdp: o.s });
    await pc.setLocalDescription(await pc.createAnswer()); await iceDone(pc, 5000);
    S.manual.answer = await pack({ t: "a", s: pc.localDescription.sdp }, /^\s*ZS1r/.test(String(offer || ""))); /* W33 Online */
    setSt("manswer", "");
    setTimeout(() => { if (S.st === "manswer" || S.st === "connecting") fail(pc.iceConnectionState === "failed" ? "nat" : "timeout"); }, 120000);
  }

  /* ======================= SITZUNG ======================= */
  function setSt(st, msg) { S.st = st; S.msg = msg || ""; redraw(); }
  function fail(kind, msg) {
    const M = {
      nat: L(["Keine direkte Verbindung möglich. Wahrscheinlich blockiert ein strenges NAT oder eine Firewall (Mobilfunk, Firmen-, Uni- oder Hotel-WLAN). Tipps: beide ins selbe WLAN, ein anderes Netz oder einen Handy-Hotspot versuchen. Einen Weiterleitungsserver (TURN) nutzt das Spiel aus Datenschutzgründen nicht.", "No direct connection possible. A strict NAT or firewall is probably in the way (mobile data, company/campus/hotel Wi-Fi). Tips: join the same Wi-Fi, try another network or a phone hotspot. The game uses no relay server (TURN) for privacy reasons."]),
      timeout: L(["Zeitüberschreitung – keine Antwort vom anderen Gerät.", "Timed out – no answer from the other device."]),
      lib: L(["Der Online-Baustein konnte nicht geladen werden (offline oder sehr alter Browser?). „Ohne Vermittler (Text kopieren)“ geht trotzdem.", "The online module could not be loaded (offline or a very old browser?). “Without a broker (copy text)” still works."]), /* W33 Online: Ausweg nennen */
      alt: L(["Dieser Browser kann den gepackten Text nicht lesen (zu alt). Ausweg: Browser aktualisieren – oder tauscht die Rollen, dann erstellt dieses Gerät das Angebot.", "This browser can't read the packed text (too old). Fix: update the browser – or swap roles so this device creates the offer."]), /* W33 Online */
      broker: L(["Vermittlungsdienst nicht erreichbar. Internet prüfen – oder „Ohne Vermittler“ nutzen.", "Matchmaking service unreachable. Check your internet – or use “Without a broker”."]),
      fmt: L(["Der eingefügte Text ist kein gültiges Angebot/keine gültige Antwort.", "The pasted text is not a valid offer/answer."])
    };
    S.lastFail = kind;
    /* vor dem Spiel: Sitzung ganz aufräumen, damit man direkt neu versuchen kann */
    if (!S.playing) { try { S.link && S.link.close(); } catch (e) { } try { S.peer && S.peer.destroy(); } catch (e) { } try { S.manual && S.manual.pc && S.manual.pc.close(); } catch (e) { } S.link = null; S.peer = null; S.manual = null; S.role = null; clearInterval(pingI); }
    setSt("err", msg || M[kind] || L(["Verbindung fehlgeschlagen.", "Connection failed."]));
  }
  function attach(ln) {
    const old = S.link; if (old && old !== ln && !old.closed) old.close();
    S.link = ln; ln.open = true; S.lastRx = now();
    ln.onmsg = S.role === "host" ? hostMsg : guestMsg;
    if (S.role === "guest") { ln.sendR({ t: "hello", v: PROTO, ver: String(Z.VERSION || ""), name: txt(S.gName, 16), hero: S.hero, re: S.playing ? 1 : 0, tok: S.tok || "" }); }
    if (S.role === "guest" && S.st === "lost") { S.reAt = now(); ln.rx = 0; } /* W39 Robust: Wiederverbindung prüfen (pingLoop) */
    if (S.st === "lost") { setSt(S.playing ? "play" : "lobby", ""); Z.toast && Z.toast(L(["Verbindung wieder da.", "Connection restored."])); }
    else if (S.role === "host") setSt(S.playing ? "play" : "lobby", "");
    pingLoop();
  }
  function gone(ln) {
    if (ln !== S.link || ln.closed && S.st === "") return;
    if (S.st === "end" || S.st === "") return;
    if (!ln.closed) ln.close();
    lost();
  }
  function lost() {
    if (S.st === "lost" || !S.role) return;
    /* W33 Online: Gast war länger weg, als der Gastgeber wartet (Gerät/Tab eingefroren) → die Sitzung ist drüben sicher beendet: sofort sauberes Ende statt 45 s „getrennt“ */
    if (S.role === "guest" && S.lastRx && now() - S.lastRx > T_LOST + T_GIVEUP) return endSession(L(["Zu lange keine Verbindung – der Gastgeber hat das Spiel inzwischen beendet.", "No connection for too long – the host has ended the game by now."]));
    S.unav = 0;
    S.held = {}; S.tap = 0; /* W34 Online: gehaltene Gast-Tasten nicht „kleben“ lassen, solange die Leitung weg ist */
    S.lostAt = now(); setSt("lost", "");
    Z.toast && Z.toast(L(["Verbindung unterbrochen – versuche wieder zu verbinden …", "Connection lost – trying to reconnect …"]));
    if (S.role === "guest" && S.kind === "peer") retry(0);
  }
  function retry(n) {
    if (S.st !== "lost" || S.role !== "guest") return;
    if (now() - S.lostAt > T_GIVEUP) return endSession(L(["Die Verbindung ist abgerissen.", "The connection dropped."]));
    try {
      if (!S.peer || S.peer.destroyed) S.peer = new window.Peer(cfg().peer);
      const pr = S.peer;
      /* W33 Online: Raum gibt es nicht mehr (zweimal hintereinander „peer-unavailable“) → Gastgeber hat beendet: sofort sauberes Ende */
      if (!pr._zsU) { pr._zsU = 1; pr.on("error", e => { if (e && e.type === "peer-unavailable" && S.st === "lost" && S.role === "guest" && ++S.unav >= 2) endSession(L(["Der Raum besteht nicht mehr – der Gastgeber hat das Spiel beendet.", "The room is gone – the host has ended the game."])); }); }
      const go = () => { const c = pr.connect(PFX + S.code, { reliable: true, serialization: "raw", label: "zs" }); c.on("open", () => { if (S.st === "lost") attach(peerLink(c)); else c.close(); }); };
      if (pr.disconnected && !pr.destroyed) { try { pr.reconnect(); } catch (e) { } }
      if (pr.open) go(); else pr.once("open", go);
    } catch (e) { }
    setTimeout(() => retry(n + 1), 3000);
  }
  let pingI = 0;
  function pingLoop() {
    clearInterval(pingI);
    pingI = setInterval(() => {
      const ln = S.link; if (!S.role) return clearInterval(pingI);
      if (ln && ln.open && !ln.closed) ln.sendR({ t: "ping", c: Math.round(now()) });
      if (S.st !== "lost" && S.st !== "end" && S.lastRx && now() - S.lastRx > T_LOST && (S.st === "play" || S.st === "lobby")) lost();
      /* W39 Robust: Gast in den ersten 12 s nach einer Wiederverbindung – 3 s Funkstille heißt, die neue Leitung ist drüben schon wieder
         weg (t_drop: Gastgeber „lost“, Gast stand bis T_LOST = 9 s „verbunden“ auf toter Leitung) → gleich neu versuchen */
      if (S.role === "guest" && S.reAt && S.st === "play") { if (now() - S.reAt > 12000) S.reAt = 0; else if (now() - S.lastRx > 3000) { S.reAt = 0; const l = S.link; try { if (l && !l.closed) l.close(); } catch (e) { } if (S.st !== "lost") lost(); } }
      if (S.st === "lost" && now() - S.lostAt > T_GIVEUP) endSession(L(["Die Verbindung ist abgerissen.", "The connection dropped."]));
      if (S.role === "host" && S.playing) sendCredit();
      /* Wächter beim Gast: kommt 3 s lang kein brauchbarer Schnappschuss an (fehlender Bezugsstand o. Ä.), vollen Stand anfordern */
      if (S.role === "guest" && S.playing && S.st === "play" && !S.fading && ln && ln.open && now() - (S.lastSnapAt || 0) > 3000) ln.sendR({ t: "req", w: "full" });
      chip();
    }, 1000);
  }
  function onPing(m) { if (S.link) S.link.sendR({ t: "pong", c: num(m.c, 0, 1e12, 0) }); }
  function onPong(m) { const c = num(m.c, 0, 1e12, -1); if (c < 0) return; const r = now() - c; if (r >= 0 && r < 30000) { if (S.rtt && r > S.rtt * 3 + 400 && (S.rttOut = (S.rttOut | 0) + 1) <= 3) return; S.rttOut = 0; S.rtt = S.rtt ? S.rtt * 0.7 + r * 0.3 : r; } } /* W34 Online: einzelne Ausreißer (Gebiet lädt, Seite hängt kurz) nicht als Ping anzeigen – erst ab dem 4. Mal in Folge */

  function endSession(why, quiet) {
    const was = S.role, playing = S.playing;
    try { if (S.link && !S.link.closed) { S.link.sendR({ t: "bye", why: "" }); const l = S.link; setTimeout(() => l.close(), 250); } } catch (e) { }
    if (S.link) S.link.onmsg = null; /* W33 Online: das „bye“ der Gegenseite darf die eigene Endmeldung nicht überschreiben (Gast verlässt → sah „Der Gastgeber hat das Spiel beendet“) */
    S.link = null;
    try { S.peer && setTimeout(((p) => () => { try { p.destroy(); } catch (e) { } })(S.peer), 300); } catch (e) { }
    S.peer = null; S.manual = null; clearInterval(pingI);
    if (was === "host") hostStop();
    if (was === "guest") guestStop(playing);
    S.role = null; S.playing = false; S.hReady = S.gReady = false; S.code = "";
    setSt(quiet ? "" : "end", why || "");
    chip();
  }
  O.end = endSession;
  O.areaChanged = () => { if (S.role === "host" && S.playing && S.link) sendArea(); }; /* W39 Robust: Gebiet ohne Z.loadArea gewechselt (Rückweg-Tor) */

  /* ======================= WERTE KODIEREN (Gastgeber) ======================= */
  let REG = null;
  function reg() {
    if (REG) return REG;
    const m = new Map(), back = new Map();
    for (const k of Object.keys(Z)) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(k)) continue; const t = Z[k];
      if (!t || typeof t !== "object") continue;
      back.set(k, t);
      for (const kk of Object.keys(t)) { const v = t[kk]; if (v && typeof v === "object" && !m.has(v)) m.set(v, k + "." + kk); }
    }
    REG = { m, get(tok) { const i = tok.indexOf("."); if (i < 1) return undefined; const t = back.get(tok.slice(0, i)), k = tok.slice(i + 1); return t && !BADKEY.has(k) && Object.prototype.hasOwnProperty.call(t, k) ? t[k] : undefined; } };
    return REG;
  }
  const NOPE = {};
  let refOf = null; /* Objekt → "@E12" (Gastgeber, je Schnappschuss) */
  const isPic = v => !!v && typeof v === "object" && ((typeof HTMLCanvasElement !== "undefined" && v instanceof HTMLCanvasElement) || (typeof OffscreenCanvas !== "undefined" && v instanceof OffscreenCanvas) || (typeof ImageBitmap !== "undefined" && v instanceof ImageBitmap) || (typeof HTMLImageElement !== "undefined" && v instanceof HTMLImageElement)); /* W33 Online */
  function enc(v, d) {
    const t = typeof v;
    if (t === "number") return isFinite(v) ? Math.round(v * 100) / 100 : 0;
    if (t === "string") return v.length > 300 ? NOPE : (v[0] === "$" || v[0] === "@" || v[0] === "~") ? "~" + v : v;
    if (t === "boolean" || v === null) return v;
    if (t !== "object") return NOPE;
    const r = refOf && refOf(v); if (r) return r;
    const tok = reg().m.get(v); if (tok) return "$" + tok;
    if (d > 3 || v instanceof Set || v instanceof Map || v instanceof WeakSet || ArrayBuffer.isView(v) || (typeof Element !== "undefined" && v instanceof Element) || (typeof CanvasGradient !== "undefined" && v instanceof CanvasGradient) || (typeof CanvasPattern !== "undefined" && v instanceof CanvasPattern) || (typeof HTMLCanvasElement !== "undefined" && v instanceof HTMLCanvasElement)) return NOPE;
    if (Array.isArray(v)) { const a = []; for (let i = 0; i < v.length && i < 64; i++) { if (isPic(v[i])) return NOPE; const x = enc(v[i], d + 1); a.push(x === NOPE ? null : x); } return a; }
    const o = {}; const pro = Object.getPrototypeOf(v);
    if (pro && pro !== Object.prototype) { const pt = reg().m.get(pro); if (pt) o.$p = pt; else if (pro.constructor !== Object) return NOPE; }
    let n = 0;
    for (const k in v) { if (!Object.prototype.hasOwnProperty.call(v, k) || !KEYRX.test(k) || k === "$p") continue; if (isPic(v[k])) return NOPE; /* W33 Online: Objekt mit Bild (z. B. Requisiten-Stumpf/-Geist {cv,l,t,w,h}) ganz weglassen – ohne cv rief der Gast drawImage(undefined) → TypeError */ const x = enc(v[k], d + 1); if (x !== NOPE && x !== undefined) { o[k] = x; if (++n > 48) break; } }
    return o;
  }
  function encEnt(o, isP) {
    const r = {};
    for (const k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k) || k[0] === "_" || SKIP.has(k) || !KEYRX.test(k)) continue;
      const v = o[k]; if (v === undefined || typeof v === "function") continue;
      const x = enc(v, 1); if (x !== NOPE) r[k] = x;
    }
    return r;
  }

  /* ======================= GASTGEBER ======================= */
  const K = () => Z.koop;
  let hooksH = false;
  function hostInstall() {
    if (hooksH) return; hooksH = true;
    /* Klang & Effekte mitschreiben (der Gast spielt sie selbst ab) */
    const A = Z.audio, FX = Z.fx;
    /* W33 Online: Schwebetexte in der Sprache des GASTS – der Gastgeber merkt sich zu jedem übersetzten Text das Sprachpaar (Z.L-Hülle) */
    const LX = new Map(), L0 = Z.L;
    if (typeof L0 === "function") Z.L = function (v) { const r = L0.apply(this, arguments); if (S.role === "host" && S.playing && Array.isArray(v) && typeof r === "string" && r.length < 80 && typeof v[0] === "string" && typeof v[1] === "string" && !LX.has(r)) { LX.set(r, [v[0].slice(0, 80), v[1].slice(0, 80)]); if (LX.size > 300) LX.delete(LX.keys().next().value); } return r; };
    const rec = (k, args) => { if (S.role !== "host" || !S.playing || S.ev.length > 120) return; const a = []; for (const x of args) { const e = enc(x, 2); a.push(e === NOPE ? null : e); } if (k === "t") { a.length = Math.min(a.length, 5); const p = typeof args[2] === "string" && LX.get(args[2]); if (p) { while (a.length < 5) a.push(null); const ep = enc(p, 2); if (ep !== NOPE) a.push(ep); } } /* W33 Online */ S.ev.push([++S.evId, k].concat(a)); };
    const wrap = (obj, name, k) => { const f = obj[name]; if (typeof f !== "function") return; obj[name] = function () { rec(k, arguments); return f.apply(this, arguments); }; obj[name]._zs = f; };
    wrap(A, "play", "a"); wrap(FX, "burst", "b"); wrap(FX, "text", "t"); wrap(FX, "ring", "r"); wrap(FX, "flashScreen", "f"); wrap(FX, "addShake", "k");
    /* Gebietswechsel melden */
    const la = Z.loadArea;
    Z.loadArea = function (id, opts) { const r = la.apply(this, arguments); try { if (S.role === "host" && S.playing) sendArea(); } catch (e) { console.warn("W32 area", e); } return r; };
    /* eigener Pausenzustand: ein offenes Fenster beim Gastgeber hält das Spiel nur an, wenn auch der Gast pausiert */
    let real = !!Z.paused;
    Object.defineProperty(Z, "paused", {
      configurable: true, enumerable: true,
      get() { if (real && S.role === "host" && S.playing && S.st === "play" && !S.gPaused && Z.ui && Z.ui.modalOpen && Z.player && !Z.player.dead) return false; return real; },
      set(v) { real = !!v; }
    });
    /* Ezekiel steht still, solange beim Gastgeber ein Fenster offen ist (Tasten gehören dann dem Menü) */
    const up = Z.updatePlayer;
    Z.updatePlayer = function (P) {
      if (S.role === "host" && S.playing && Z.ui && Z.ui.modalOpen && P === Z.player) { const inp = Z.input, h = Object.assign({}, inp.held), p = Object.assign({}, inp.pressed); for (const a in inp.held) inp.held[a] = false; for (const a in inp.pressed) inp.pressed[a] = false; try { return up.apply(this, arguments); } finally { Object.assign(inp.held, h); Object.assign(inp.pressed, p); } }
      return up.apply(this, arguments);
    };
    /* Spieler 2 über das Netz: Händler/Gespräche öffnen Fenster beim Gastgeber – das bleibt dem Gastgeber vorbehalten */
    /* W32 Online: Boss-Auftritt/-Fall (uebergang.js) auch beim Gast zeigen – der Gast bekommt nur den Verweis auf den Boss */
    for (const [fn, t] of [["bossIntro", "bi"], ["bossDown", "bd"]]) { const f = Z.ui[fn]; if (typeof f !== "function") continue; Z.ui[fn] = function (e) { try { if (S.role === "host" && S.playing && S.link && e && typeof e === "object") { let id = S.ids.get(e); if (!id) { id = S.nid++; S.ids.set(e, id); } S.link.sendR({ t: t, k: "E" + id, n: S.area }); } } catch (x) { } return f.apply(this, arguments); }; }
    /* W32 Online: Wandlungsschrein (mutationen.js) – öffnet Spieler 2 über das Netz den Schrein, erscheint die Wahl beim GAST;
       der Gastgeber prüft die Antwort (nur angebotene Gabe, nur eigene zum Ersetzen) und trägt sie ein */
    if (Z.mut && Z.mut.oeffne) { const mo = Z.mut.oeffne; Z.mut.oeffne = function (Pw) { const k = K(); if (S.role === "host" && S.playing && S.link && k && Pw && Pw === k.p2 && k.src && k.src.kind === "net") return mutAnGast(Pw); return mo.apply(this, arguments); }; }
    if (Z._koopInteract) { const ki = Z._koopInteract; Z._koopInteract = function (tg) { if (S.role === "host" && S.playing && Z.koop && Z.koop.src && Z.koop.src.kind === "net" && tg && ((tg.type === "station" && !(tg.s && tg.s.id === "K")) || tg.type === "npc")) { if (tg.type === "npc" && npcGast(tg)) return; if (S.link) S.link.sendR({ t: "note", k: "station" }); return; } if (S.role === "host" && S.playing && S.link && Z.koop && Z.koop.src && Z.koop.src.kind === "net" && tg && tg.type === "obj" && tg.o && tg.o.anvil && Z.schmiede && Z.schmiede.p2Waffe()) return ambossAnGast(tg.o.anvil); /* W39 P2: Amboss für den Gast */ /* W39 P2: Brunnen darf auch der Gast nutzen; Gespräche siehe npcGast */ return ki.apply(this, arguments); }; }
    /* Schnappschüsse nach jedem Bild */
    const loop = () => { requestAnimationFrame(loop); try { hostFrame(); } catch (e) { console.warn("W32 host", e); } };
    requestAnimationFrame(loop);
    setInterval(() => { if (document.hidden) try { hostFrame(); } catch (e) { } }, 100);
  }
  function hostStart() {
    hostInstall();
    S.playing = true; S.hist.clear(); S.seq = 0; S.ack = -1; S.lastIn = -1; S.held = {}; S.gPaused = false; S.ev.length = 0;
    S.credit = { t0: now(), sh0: Z.meta ? Z.meta.shards | 0 : 0, bosses: [], kills0: 0, kills: 0 };
    const go = () => {
      const k = K();
      if (k && k.joinRemote) { k.joinRemote(S.gHero); k.setInputSource(() => (now() - (S.inAt || 0) > 900 ? {} : S.held)); } /* W34 Online: > 0,9 s keine Eingabe (Funkloch, Hänger) → nichts gehalten */
      sendArea();
      setSt("play", "");
    };
    if (!Z.level) { Z.ui.startGame(); setTimeout(go, 50); } else go();
  }
  function hostStop() {
    const k = K();
    try { if (k) { k.setInputSource(null); if (k.p2 && k.src && k.src.kind === "net") k.leave(L(["Der Online-Mitspieler hat das Spiel verlassen.", "The online player left."])); } } catch (e) { }
    S.playing = false; S.gPaused = false;
  }
  function tileHash(lv) { let h = 2166136261 >>> 0; const t = lv.tiles; for (let i = 0; i < t.length; i++) { h ^= t[i]; h = Math.imul(h, 16777619) >>> 0; } return (h ^ lv.W * 31 ^ lv.H) >>> 0; }
  function runInfo() {
    const r = Z.run; if (!r) return null;
    return { seed: r.seed >>> 0, route: (r.route || []).slice(0, 64).filter(okId), tier: r.tier | 0, skulls: r.skulls | 0, area: r.area, doorsOpen: !!r.doorsOpen, fromHub: !!r.fromHub, firstWeaponGiven: !!r.firstWeaponGiven, bossesBeaten: (r.bossesBeaten || []).filter(okId).slice(0, 32), w38tn: r.w38tiefe ? (r.w38tiefe.load || r.w38tiefe.n) | 0 : 0 }; /* W38 Online: Tiefe für Kapitelseite/Pause des Gasts */
  }
  function sendArea() {
    const lv = Z.level; if (!lv || !S.link) return;
    S.area++; S.hist.clear(); S.ack = -1; S.tShadow = lv.tiles ? lv.tiles.slice() : null;
    const opts = lv.passage ? { from: Z._zsFrom || (Z.run && Z.run.route && Z.run.route[Z.run.route.length - 1]), to: null } : null;
    const m = { t: "area", n: S.area, id: lv.id, run: runInfo(), hash: tileHash(lv), W: lv.W, H: lv.H, doors: (lv.doors || []).map(d => ({ x: d.x, y: d.y, to: d.to, kind: d.kind, locked: !!d.locked })), lvp: lvPrims(lv) };
    if (lv.passage) m.pass = passInfo(lv);
    S.link.sendR(m);
  }
  function passInfo(lv) { const d = (lv.doors || []).find(x => x.kind === "exit") || (lv.doors || [])[0]; const r = Z.run && Z.run.route; return { from: r ? r[r.length - 1] : null, to: d ? d.to : null }; }
  function lvPrims(lv) { const o = {}; for (const k in lv) { const v = lv[k]; if (k[0] === "_" || !KEYRX.test(k)) continue; if (typeof v === "boolean" || (typeof v === "number" && isFinite(v)) || (typeof v === "string" && v.length < 64)) o[k] = v; } return o; }
  function hostMsg(m) {
    switch (m.t) {
      case "hello": {
        if (m.v !== PROTO) { S.link.sendR({ t: "bye", why: "ver" }); return; }
        S.gHero = heroOk(m.hero); S.gName = txt(m.name, 16); /* W33 Online: kein fest deutsches „Gast“ – die Lobby setzt L(["Gast","Guest"]) ein */
        if (!S.gTok || m.tok !== S.gTok) S.gTok = newCode() + newCode();
        S.lastIn = -1; S.held = {}; S.tap = 0; /* W34 Online: neu geladene Gast-Seite zählt ihre Eingaben wieder ab 1 */
        S.link.sendR({ t: "welcome", v: PROTO, hero: S.gHero, playing: S.playing ? 1 : 0, tok: S.gTok });
        if (S.playing) { sendArea(); setSt("play", ""); } else { setSt("lobby", ""); lobbyCast(); }
        return;
      }
      case "hero": if (!S.playing) { S.gHero = heroOk(m.hero); S.gReady = false; lobbyCast(); redraw(); } return;
      case "ready": S.gReady = !!m.r; lobbyCast(); redraw(); return;
      case "i": return hostInput(m);
      case "pz": S.gPaused = !!m.p; return;
      case "ping": return onPing(m);
      case "pong": return onPong(m);
      case "req": if (m.w === "full") { S.ack = -1; S.hist.clear(); return; } if (m.w === "tiles" && Z.level && Z.level.tiles && int(m.n, 0, 1e9, -1) === S.area) S.link.sendR({ t: "tiles", n: S.area, d: b64u(Z.level.tiles) }); return;
      case "mutw": return mutAntwort(m);
      case "ambw": return ambossAntwort(m); /* W39 P2 */
      case "w38begw": if (Z.begegnung && Z.begegnung.netHost) Z.begegnung.netHost(m); return; /* W38 Begegnung: Wahl des Gasts – Gastgeber prüft */
      case "bye": return endSession(L(["Der Mitspieler hat das Spiel verlassen.", "The other player left."]));
    }
  }
  /* W39 P2: spricht der Online-Gast eine Lagerfigur an, sagt sie ihren Satz bei beiden (Sprechblase beim Gastgeber und beim Gast).
     Fenster, die den Spielstand ändern (Schmiede, Fundbuch, Schädel, Geschichte), gehören zum Spielstand des Gastgebers und öffnen sich
     nicht – der Gast bekommt dazu einen kurzen Hinweis. */
  const NPCN = { B: "Barradin", G: "Friedrich", E: "Echo", A: "Nundro", R: "Rex", C: "" };
  function npcGast(tg) {
    const id = tg.s && tg.s.id, lv = Z.level; if (typeof id !== "string" || !lv || !lv.hub || !S.link) return false;
    const lines = Z.CAMP_TALK && Z.CAMP_TALK[id], s = (lv.props || []).find(q => q.id === id);
    if (lines && lines.length && s) {
      const pair = Z.R.pick(lines); const de = txt(Array.isArray(pair) ? pair[0] : pair, 400), en = txt(Array.isArray(pair) ? pair[1] : pair, 400);
      try { Z.ui.say(s.x * Z.TILE + 8, s.y * Z.TILE - 22, NPCN[id] || "", L([de, en]), 4600); } catch (e) { }
      S.link.sendR({ t: "say", id, de, en });
    }
    if (id === "R") try { Z.audio.play("bark"); } catch (e) { }
    if (id === "A" || id === "B" || id === "C" || id === "F") S.link.sendR({ t: "note", k: "meta" });
    return true;
  }
  /* W39 P2 online: Glutamboss – Spieler 2 (Gast) schmiedet seine Waffe. Der Gastgeber schickt Stand und Kosten, der Gast wählt
     „Aufwerten“ oder „Fertig“, der Gastgeber prüft (gleicher Amboss/Gebiet, Schläge übrig, Waffe unverändert, Gold/Glut reichen) und rechnet. */
  function ambossAnGast(a) {
    const SM = Z.schmiede, it = SM && SM.p2Waffe(), P = Z.player; if (!it || !P || !S.link) return;
    if (a.used >= a.charges) { S.link.sendR({ t: "note", k: "amboss" }); return; }
    const c = SM.kosten(it);
    S.ambOffen = { a, lv: Z.level, it, plus: it.plus | 0 };
    S.link.sendR({ t: "amb", w: it.id, rar: it.rar | 0, plus: it.plus | 0, max: SM.MAXP, gold: c.gold | 0, glut: c.glut | 0, hg: P.gold | 0, hgl: P.glut | 0, left: a.charges - a.used });
  }
  function ambossAntwort(m) {
    const o = S.ambOffen, SM = Z.schmiede; S.ambOffen = null;
    if (!o || !SM || o.lv !== Z.level || m.ok !== true) return;
    const it = SM.p2Waffe(); if (it !== o.it || (it.plus | 0) !== o.plus) return; /* Waffe oder Stufe hat sich inzwischen geändert */
    if (SM.schlagP2(o.a) && o.a.used < o.a.charges && (it.plus | 0) < SM.MAXP) ambossAnGast(o.a); else if (S.link) S.link.sendR({ t: "ambz" });
  }
  function mutAnGast(P) {
    const lv = Z.level, M = Z.mut; if (!lv || !lv._mut || lv._mut.wahl[1]) return;
    lv._mut.angebot = lv._mut.angebot || {}; const ang = lv._mut.angebot[1] || (lv._mut.angebot[1] = M.angebot(P));
    S.mutOffen = { lv, ang: ang.slice() };
    S.link.sendR({ t: "mut", ang: ang.slice(0, 6), akt: M.of(P).slice(0, 6), max: M.MAX || 3 });
  }
  function mutAntwort(m) {
    const o = S.mutOffen, k = K(), P = k && k.p2, M = Z.mut; S.mutOffen = null;
    if (!o || !P || !M || o.lv !== Z.level || !Z.level._mut || Z.level._mut.wahl[1]) return;
    if (m.id === "-") { Z.level._mut.wahl[1] = "-"; return; }
    if (typeof m.id !== "string" || o.ang.indexOf(m.id) < 0) return;
    const alt = typeof m.alt === "string" && M.of(P).indexOf(m.alt) >= 0 ? m.alt : null;
    if (M.of(P).length >= (M.MAX || 3) && !alt) return;
    if (alt) M.weg(P, alt);
    if (M.gib(P, m.id)) { Z.level._mut.wahl[1] = m.id; try { Z.audio.play("holy", { vol: 0.5 }); } catch (e) { } }
  }
  function hostInput(m) {
    /* Grenze: höchstens ~150 Eingabe-Nachrichten je Sekunde, nur Bits, Folgenummern steigend */
    const t = now(); if (t - S.inRateT > 1000) { S.inRateT = t; S.inRate = 0; } if (++S.inRate > 150) return;
    const ack = int(m.a, -1, 1e9, -1); if (ack > S.ack && S.hist.has(ack)) S.ack = ack;
    if (!Array.isArray(m.k) || m.k.length > 8) return;
    let best = null;
    for (const e of m.k) { if (!Array.isArray(e) || e.length !== 2) continue; const q = int(e[0], 0, 1e9, -1), b = int(e[1], 0, 0xfff, -1); if (q <= S.lastIn || b < 0) continue; if (!best || q > best[0]) best = [q, b]; if (q > S.lastIn) { /* kurze Tipps zwischen zwei Paketen nicht verlieren */ for (let i = 0; i < ACT.length; i++) if (b & (1 << i)) S.tap = (S.tap | 0) | (1 << i); } }
    if (!best) return;
    S.lastIn = best[0]; S.inAt = now(); /* W34 Online */
    const h = {}; for (let i = 0; i < ACT.length; i++) h[ACT[i]] = !!(best[1] & (1 << i)) || !!((S.tap | 0) & (1 << i));
    S.tap = 0; S.held = h;
  }
  function lobbyCast() { if (S.link) S.link.sendR({ t: "lobby", gh: S.gHero, hr: S.hReady ? 1 : 0, gr: S.gReady ? 1 : 0 }); }
  /* --- Schnappschuss --- */
  function hostFrame() {
    if (S.role !== "host" || !S.playing || !S.link || S.st !== "play" || !Z.level) return;
    const t = now(); if (t - S.sendT < SNAP_MS - 4) return; S.sendT = t;
    const lv = Z.level, P = Z.player, k = K();
    /* Verweise zwischen Objekten (Ziel, Besitzer, Boss …) */
    const refs = new Map();
    for (const c in LISTS) { const a = Z[LISTS[c]]; if (!Array.isArray(a)) continue; for (const o of a) if (o && typeof o === "object") { let id = S.ids.get(o); if (!id) { id = S.nid++; S.ids.set(o, id); } refs.set(o, "@" + c + id); } }
    if (P) refs.set(P, "@P1");
    if (k && k.p2) refs.set(k.p2, "@P2");
    refOf = o => refs.get(o);
    const cur = new Map(), str = new Map();
    const add = (key, f) => { cur.set(key, f); const s = {}; for (const x in f) s[x] = typeof f[x] === "object" && f[x] !== null ? JSON.stringify(f[x]) : f[x]; str.set(key, s); };
    try {
      /* nur, was in der Nähe eines Spielers ist (plus Boss) */
      const near = o => { if (o === Z.boss) return true; const ox = o.x || 0, oy = o.y || 0; for (const q of [P, k && k.p2]) if (q && Math.abs(ox - q.x) < 760 && Math.abs(oy - q.y) < 480) return true; return false; };
      for (const c in LISTS) { const a = Z[LISTS[c]]; if (!Array.isArray(a)) continue; let n = 0; for (const o of a) { if (!o || typeof o !== "object" || !near(o)) continue; if (++n > 260) break; add(refs.get(o).slice(1), encEnt(o)); } }
      if (P) add("P1", encEnt(P, true));
      if (k && k.p2 && k.serialize) { const s = k.serialize(); if (s) { const f = {}; for (const x in s) { if (!KEYRX.test(x)) continue; const e = enc(s[x], 1); if (e !== NOPE) f[x] = e; } add("P2", f); } }
      const run = Z.run;
      add("g", { boss: Z.boss ? (refs.get(Z.boss) || null) : null, bd: !!Z.bossDefeated, dk: num(Z.darkness, -9, 99, 0), dO: run ? !!run.doorsOpen : true, rt: run ? Math.round(run.time * 10) / 10 : 0, lk: (lv.doors || []).map(d => (d.locked ? 1 : 0)).join(""), lvp: lvPrims(lv), gold: P ? P.gold | 0 : 0, shards: P ? P.shards | 0 : 0, hpz: P ? [Math.round(P.hp), Math.round(P.hpMax)] : null, wd: !!lv.wardenSpawned });
    } finally { refOf = null; }
    /* Delta gegen den zuletzt bestätigten Stand */
    const seq = ++S.seq, base = S.ack >= 0 && S.hist.has(S.ack) && seq - S.ack < HIST ? S.ack : -1, bs = base >= 0 ? S.hist.get(base) : null;
    const e = {};
    for (const [key, f] of cur) {
      const s = str.get(key), b = bs && bs.get(key);
      if (!b) { e[key] = f; continue; }
      let d = null;
      for (const x in s) if (b[x] !== s[x]) (d || (d = {}))[x] = f[x];
      for (const x in b) if (!(x in s)) (d || (d = {}))[x] = "$u";
      if (d) e[key] = d;
    }
    if (bs) for (const key of bs.keys()) if (!cur.has(key)) e[key] = 0;
    S.hist.set(seq, str); for (const q of S.hist.keys()) if (q < seq - HIST) S.hist.delete(q);
    const ev = S.ev.splice(0, S.ev.length); S.evLast = (S.evLast || []).concat(ev).slice(-40);
    const msg = { t: "s", q: seq, b: base, n: S.area, tm: Math.round(t), e, ev: S.evLast.slice(-Math.min(40, ev.length + 12)), ia: S.lastIn, hp: S.gPaused ? 1 : 0, hm: Z.ui && Z.ui.modalOpen ? 1 : 0, hv: document.hidden ? 1 : 0 /* W33 Online: Gastgeber-Tab im Hintergrund → Welt steht, Gast bekommt Hinweis */ };
    S.link.sendU(msg);
    /* Kachel-Änderungen (Tore, zerstörbare Wände …) */
    if (lv.tiles && S.tShadow && S.tShadow.length === lv.tiles.length && t - S.tT > 250) {
      S.tT = t; const d = []; const a = lv.tiles, sh = S.tShadow;
      for (let i = 0; i < a.length; i++) if (a[i] !== sh[i]) { d.push(i, a[i]); sh[i] = a[i]; if (d.length > 4000) break; }
      if (d.length > 4000) S.link.sendR({ t: "tiles", n: S.area, d: b64u(lv.tiles) }); else if (d.length) S.link.sendR({ t: "td", n: S.area, d });
    }
  }
  function sendCredit() {
    const c = S.credit; if (!c || !S.link) return;
    const P = Z.player, banked = Z.meta ? Math.max(0, (Z.meta.shards | 0) - c.sh0) : 0, carry = P ? P.shards | 0 : 0;
    const bosses = (Z.run && Z.run.bossesBeaten || []).filter(okId); for (const b of bosses) if (!c.bosses.includes(b)) c.bosses.push(b);
    S.link.sendR({ t: "credit", sh: Math.min(1e6, banked + carry), bo: c.bosses.slice(0, 24) });
  }

  /* ======================= GAST ======================= */
  let hooksG = false, allowLoad = false;
  const G = () => S.role === "guest" && S.playing;
  function guestInstall() {
    if (hooksG) return; hooksG = true;
    /* Spielwelt läuft nur beim Gastgeber: beim Gast sind die Weltschritte leer */
    for (const n of ["updatePlayer", "updateEnemies", "updateProjs", "updateHazards", "updateAllies", "updateGadgets", "updateParcours", "updatePickups", "bilanzTick", "kampfTick", "abenteuerTick", "fluchTick", "ebenenTick", "lagerTick", "hurtPlayer", "healPlayer", "onPlayerDeath", "startRun", "backToCamp", "dropGold", "dropItem", "dropShards", "onChestOpen"]) {
      const f = Z[n]; if (typeof f !== "function") continue;
      Z[n] = function () { if (G()) return; return f.apply(this, arguments); };
    }
    const sm = Z.saveMeta; Z.saveMeta = function () { if (S.role === "guest" && S.metaReal) return; return sm.apply(this, arguments); };
    O._saveReal = () => sm.call(Z);
    const la = Z.loadArea; Z.loadArea = function () { if (G() && !allowLoad) return; return la.apply(this, arguments); };
    O._load = (id, opts) => { allowLoad = true; try { return la.call(Z, id, opts); } finally { allowLoad = false; } };
    /* Eingaben einsammeln und Schnappschüsse einspielen – einmal je Bild, vor der (leeren) Spiellogik */
    const uf = Z.ui.frame;
    Z.ui.frame = function (dt) { if (G()) try { guestFrame(dt); } catch (e) { console.warn("W32 gast", e); } return uf.apply(this, arguments); };
    setInterval(() => { if (G() && document.hidden) try { guestFrame(0.1); } catch (e) { } }, 100);
  }
  function guestStart() {
    guestInstall();
    if (!S.metaReal) {
      /* der eigene Spielstand bleibt unberührt: gespielt wird mit einer Kopie */
      S.metaReal = Z.meta; try { Z.meta = JSON.parse(JSON.stringify(Z.meta)); } catch (e) { Z.meta = Object.assign({}, Z.meta); }
    }
    S.playing = true; S.states.clear(); S.buf.length = 0; S.applied = -1; S.live.clear(); S.evSeen.clear(); S.t0 = now(); S.off = null; S.gotCredit = 0; S.creditShown = 0; S.szene = null; /* W34 Online: zweite Sitzung ohne Neuladen – Gutschrift-Hinweis wieder ab 0 */
    const t = document.getElementById("title"); if (t) t.hidden = true;
    document.body.classList.add("zso-gast"); /* Ezekiels Fähigkeitenleiste/Hinweise gehören dem Gastgeber – beim Gast ausblenden */
    if (Z.ui.modalOpen) Z.ui.close();
  }
  function guestStop(wasPlaying) {
    document.body.classList.remove("zso-gast");
    if (S.metaReal) {
      const real = S.metaReal; S.metaReal = null; Z.meta = real;
      const g = Math.max(0, S.gotCredit | 0);
      if (g > 0) { real.shards = (real.shards | 0) + g; }
      real.online = real.online || { runden: 0, splitter: 0 }; real.online.runden = (real.online.runden | 0) + (wasPlaying ? 1 : 0); real.online.splitter = (real.online.splitter | 0) + g;
      try { O._saveReal(); } catch (e) { }
      S.lastCredit = g;
    }
    if (wasPlaying) {
      const k = K(); try { if (k && k.p2) { k.p2 = null; k.rex = null; } } catch (e) { }
      S.playing = false;
      if (!S.toTitle) try { Z.player = Z.newPlayer(); O._load("lager"); } catch (e) { console.warn(e); }
      S.toTitle = false;
    }
  }
  function guestMsg(m) {
    switch (m.t) {
      case "welcome": if (m.v !== PROTO) return endSession(L(["Unterschiedliche Spielversion – bitte beide die Seite neu laden.", "Different game versions – please both reload."])); S.gHero = heroOk(m.hero); S.tok = txt(m.tok, 24); try { sessionStorage.setItem("imres-zs-tok", JSON.stringify({ c: S.code, t: S.tok })); } catch (e) { } /* W34 Online */ if (!m.playing) setSt("lobby", ""); return;
      case "lobby": S.gHero = heroOk(m.gh); S.hReady = !!m.hr; S.gReady = !!m.gr; redraw(); return;
      case "area": return guestArea(m);
      case "s": return guestSnap(m);
      case "td": return guestTiles(m, false);
      case "tiles": return guestTiles(m, true);
      case "credit": return guestCredit(m);
      case "ping": return onPing(m);
      case "pong": return onPong(m);
      case "mut": return mutFenster(m);
      case "amb": return ambFenster(m); /* W39 P2 */
      case "w38beg": if (Z.begegnung && Z.begegnung.netGast) Z.begegnung.netGast(m); return; /* W38 Begegnung: Angebot an den Gast */
      case "ambz": if (S.ambW) { S.ambW = null; Z.ui.close(); } return;
      case "say": { /* W39 P2: Satz einer Lagerfigur beim Gast (nur bekannte Figur im eigenen Lager, Text gekürzt und entschärft) */
        if (typeof m.id !== "string" || !/^[A-Z]$/.test(m.id) || !Z.level || !Z.level.hub) return;
        const s = (Z.level.props || []).find(q => q.id === m.id); if (!s || !Z.ui || !Z.ui.say) return;
        const de = txt(m.de, 400), en = txt(m.en, 400); if (!de && !en) return;
        Z.ui.say(s.x * Z.TILE + 8, s.y * Z.TILE - 22, NPCN[m.id] || "", L([de || en, en || de]), 4600); return;
      }
      case "bi": case "bd": if (typeof m.k === "string" && /^E\d{1,9}$/.test(m.k) && int(m.n, 0, 1e9, -1) === S.areaN) S.szene = { t: m.t, k: m.k, at: now() }; return;
      case "note": if (m.k === "amboss") { Z.toast && Z.toast(L(["Die Glut im Amboss ist erloschen.", "The anvil\u2019s embers have gone cold."])); return; } if (m.k === "meta") { Z.toast && Z.toast(L(["Schmiede, Fundbuch und Schädel gehören zum Spielstand des Gastgebers.", "The forge, ledger and skulls belong to the host’s save."])); return; } if (m.k === "station") Z.toast && Z.toast(L(["Gespräche und Lager-Stationen übernimmt der Gastgeber – Händlerware im Durchgang und den Brunnen kannst du selbst nutzen.", "The host handles talks and camp stations – you can buy passage wares and use the fountain yourself."])); return;
      case "bye": return endSession(m.why === "voll" ? L(["Der Raum ist schon voll.", "The room is full."]) : m.why === "ver" ? L(["Unterschiedliche Spielversion – bitte beide die Seite neu laden.", "Different game versions – please both reload."]) : L(["Der Gastgeber hat das Spiel beendet.", "The host ended the game."]));
    }
  }
  function guestArea(m) {
    const id = m.id; if (!okId(id)) return;
    if (!(id === "lager" || id === "passage" || own(Z.BIOMES, id) || own(Z.ARENAS, id))) return;
    if (!S.playing) guestStart();
    S.areaN = int(m.n, 0, 1e9, 0);
    const r = isObj(m.run) ? m.run : null;
    if (id !== "lager" && r) {
      const run = Z.run && Z.run.seed === (r.seed >>> 0) ? Z.run : { t0: now(), time: 0, shardsBank: 0 };
      Object.assign(run, { seed: num(r.seed, 0, 4294967295, 1) >>> 0, route: Array.isArray(r.route) ? r.route.filter(okId).slice(0, 64) : [id], tier: int(r.tier, 0, 99, 0), skulls: int(r.skulls, 0, 9, 0), area: id, doorsOpen: !!r.doorsOpen, fromHub: !!r.fromHub, firstWeaponGiven: !!r.firstWeaponGiven, bossesBeaten: Array.isArray(r.bossesBeaten) ? r.bossesBeaten.filter(okId) : [], w38tn: int(r.w38tn, 0, 999, 0) /* W38 Online */ });
      Z.run = run; Z.stats = Z.stats || { kills: 0, gold: 0, parries: 0, secrets: 0 };
    }
    if (!Z.player) Z.player = Z.newPlayer();
    const opts = id === "passage" && isObj(m.pass) ? { from: own(Z.BIOMES, m.pass.from) || own(Z.ARENAS, m.pass.from) ? m.pass.from : "torhof", to: own(Z.BIOMES, m.pass.to) || own(Z.ARENAS, m.pass.to) ? m.pass.to : "keller" } : undefined;
    const doLoad = () => {
      try { O._load(id, opts); } catch (e) { console.warn("W32 gebiet", e); }
      const lv = Z.level; if (!lv) return;
      for (const c in LISTS) { const a = Z[LISTS[c]]; if (Array.isArray(a)) a.length = 0; }
      S.live.clear(); S.buf = S.buf.filter(b => b.n === S.areaN);
      lv.bossPending = false; lv.warden = false; Z.boss = null;
      if (Array.isArray(m.doors) && lv.doors && m.doors.length === lv.doors.length) m.doors.forEach((d, i) => { if (isObj(d)) lv.doors[i].locked = !!d.locked; });
      S.levelOk = lv.W === m.W && lv.H === m.H && tileHash(lv) === (m.hash >>> 0);
      if (!S.levelOk && S.link) S.link.sendR({ t: "req", w: "tiles", n: S.areaN });
      if (S.st !== "play") setSt("play", "");
      chip();
    };
    /* immer nur das NEUESTE Gebiet laden; eine laufende Überblendung wird nicht doppelt gestartet (Sicherung nach 1,5 s) */
    S.pendLoad = doLoad;
    if (S.fading) return;
    const run1 = () => { if (!S.fading) return; S.fading = false; const f = S.pendLoad; S.pendLoad = null; if (f) f(); };
    S.fading = true; setTimeout(run1, 1500);
    if (Z.ui && Z.ui.fade && Z.level && !document.hidden) { try { Z.ui.fade(run1); } catch (e) { run1(); } } else run1();
  }
  /* Wandlungsschrein beim Gast: eigene Wahl (Daten nur aus der eigenen Gaben-Liste), Antwort an den Gastgeber */
  function ambFenster(m) {
    const d = typeof m.w === "string" && okId(m.w) && Z.itemDef ? Z.itemDef({ id: m.w, type: "weapon" }) : null; if (!d) return;
    const plus = int(m.plus, 0, 9, 0), max = int(m.max, 1, 9, 5), gold = int(m.gold, 0, 1e7, 0), glut = int(m.glut, 0, 99, 0), hg = int(m.hg, 0, 1e9, 0), hgl = int(m.hgl, 0, 999, 0), left = int(m.left, 0, 9, 0);
    S.ambW = { w: m.w };
    const kann = plus < max && left > 0 && hg >= gold && hgl >= glut;
    const name = L(d.n) + (plus ? " +" + plus : "");
    Z.ui.open('<div class="glutamboss zso-amb"><h2>' + esc(L(["Glutamboss", "Ember Anvil"])) + ' <span class="bank"><span class="gld">' + hg + ' ●</span> <span class="glt">' + hgl + " ✦</span></span></h2>" +
      '<p class="hinweis">' + esc(L(["Deine Waffe – gemeinsamer Beutel, ", "Your weapon – shared purse, "]) + left + L([" Schläge übrig. +15 % Schaden je Stufe.", " strikes left. +15% damage per level."])) + "</p>" +
      "<p><b>" + esc(name) + "</b></p>" + (plus >= max ? '<p class="meister">' + esc(L(["Meisterstück.", "Masterwork."])) + "</p>" : "") +
      '<div class="knoepfe">' + (plus < max ? '<button data-zso="ambja"' + (kann ? " autofocus" : " disabled") + ">" + esc(L(["Aufwerten auf +", "Upgrade to +"]) + (plus + 1)) + " <small>· " + gold + " ● · " + glut + " ✦</small></button>" : "") +
      '<button data-zso="ambnein"' + (kann ? "" : " autofocus") + ">" + esc(L(["Fertig", "Done"])) + "</button></div></div>", { cls: "schmal", force: true });
  }
  function mutFenster(m) {
    const M = Z.mut; if (!M || !Array.isArray(m.ang)) return;
    const by = id => (typeof id === "string" ? M.liste.find(g => g.id === id) : null);
    const ang = m.ang.filter(by).slice(0, 6), akt = (Array.isArray(m.akt) ? m.akt : []).filter(by).slice(0, 6);
    if (!ang.length) return;
    S.mutW = { ang, akt, voll: akt.length >= int(m.max, 1, 9, 3), neu: null };
    mutZeichne();
  }
  function mutKarte(g, i, act) { const f = Z.mut.FAM[g.f] || {}; return '<button class="mut-karte" style="--fc:' + esc(f.col || "#ffd27a") + '" data-zso="' + act + '" data-h="' + esc(g.id) + '"' + (i === 0 ? " autofocus" : "") + '><span class="mut-ico">' + (f.ico || "") + "</span><b>" + esc(L(g.n)) + '</b><span class="mut-fam">' + esc(L(f.n || "")) + "</span><small>" + esc(L(g.d)) + "</small></button>"; }
  function mutZeichne() {
    const w = S.mutW, M = Z.mut; if (!w) return; const by = id => M.liste.find(g => g.id === id);
    const html = w.neu
      ? "<h2>" + esc(L(["Welche Gabe weicht?", "Which gift gives way?"])) + '</h2><div class="mut-reihe">' + w.akt.map((id, i) => mutKarte(by(id), i, "mutalt")).join("") + '</div><div class="knoepfe"><button data-zso="mutback">' + esc(L(["Zurück", "Back"])) + "</button></div>"
      : "<h2>" + esc(L(["Wandlungsschrein", "Shrine of Change"])) + '</h2><p class="hinweis">' + esc(L(["Wähle eine Gabe für deine Figur. Höchstens drei wirken zugleich" + (w.voll ? " – deine Gaben sind voll, du ersetzt danach eine." : "."), "Choose a gift for your hero. At most three work at once" + (w.voll ? " – yours are full, you will replace one next." : ".")])) + '</p><div class="mut-reihe">' + w.ang.map((id, i) => mutKarte(by(id), i, "mutnimm")).join("") + "</div>" + (w.akt.length ? '<p class="mut-aktiv">' + esc(L(["Aktiv: ", "Active: "]) + w.akt.map(id => L(by(id).n)).join(" · ")) + "</p>" : "") + '<div class="knoepfe"><button data-zso="mutskip">' + esc(L(["Nichts nehmen", "Take nothing"])) + "</button></div>";
    Z.ui.open('<div class="mutwahl zso-mut">' + html + "</div>", { cls: "breit", force: true });
  }
  function mutSende(id, alt) { const w = S.mutW; S.mutW = null; if (S.link) S.link.sendR({ t: "mutw", id, alt: alt || null }); Z.ui.close(); if (id !== "-") { const g = Z.mut.liste.find(x => x.id === id); if (g) Z.toast && Z.toast(L(["Gabe gewählt: ", "Gift chosen: "]) + "<b>" + esc(L(g.n)) + "</b>"); } }
  function guestTiles(m, full) {
    const lv = Z.level; if (!lv || !lv.tiles || int(m.n, 0, 1e9, -1) !== S.areaN) return;
    if (full) {
      if (typeof m.d !== "string" || m.d.length > 400000) return;
      let u; try { u = unb64u(m.d); } catch (e) { return; }
      if (u.length !== lv.tiles.length) return;
      lv.tiles.set(u); S.levelOk = true;
      try { Z.gfx.chunks && Z.gfx.chunks.clear(); Z.gfx.buildLayers && Z.gfx.buildLayers(); Z.dirtyTiles && Z.dirtyTiles(); } catch (e) { }
      return;
    }
    if (!Array.isArray(m.d) || m.d.length > 8000) return;
    for (let i = 0; i + 1 < m.d.length; i += 2) { const ix = int(m.d[i], 0, lv.tiles.length - 1, -1), v = int(m.d[i + 1], 0, 255, -1); if (ix < 0 || v < 0) continue; lv.tiles[ix] = v; try { Z.dirtyTiles && Z.dirtyTiles(ix % lv.W, (ix / lv.W) | 0); } catch (e) { } }
  }
  function guestCredit(m) {
    /* Gutschrift: die Hälfte der gemeinsam erbeuteten Seelensplitter, je besiegtem Boss 25 – gedeckelt (60 + 12 je Minute, höchstens 800 je Sitzung).
       Der Gast rechnet selbst und deckelt selbst – ein manipulierter Gastgeber kann nicht mehr gutschreiben. */
    const sh = num(m.sh, 0, 1e6, 0), bo = Array.isArray(m.bo) ? m.bo.filter(okId).slice(0, 12) : [];
    const mins = (now() - S.t0) / 60000;
    const want = Math.floor(sh * 0.5) + bo.length * 25, cap = Math.min(800, Math.floor(60 + 12 * mins));
    const g = Math.max(S.gotCredit, Math.min(want, cap));
    if (g > S.gotCredit) { S.gotCredit = g; if (g - S.creditShown >= 25) { S.creditShown = g; Z.toast && Z.toast(L(["Gutschrift für deinen Spielstand: ", "Credit for your save: "]) + g + L([" Seelensplitter", " soul shards"])); } }
  }
  /* --- Schnappschüsse --- */
  function guestSnap(m) {
    if (!S.playing || int(m.n, 0, 1e9, -1) !== S.areaN) return;
    const q = int(m.q, 0, 1e9, -1), b = int(m.b, -1, 1e9, -2); if (q < 0 || b < -1 || q <= S.applied - HIST) return;
    if (S.states.has(q)) return;
    if (!isObj(m.e)) return;
    let full;
    if (b === -1) full = new Map();
    else { const bs = S.states.get(b); if (!bs) return; full = new Map(); for (const [k, f] of bs) full.set(k, f); }
    let cnt = 0;
    for (const key in m.e) {
      if (++cnt > 2000) break;
      if (!/^(P1|P2|g|[EJHAKLBSG]\d{1,9})$/.test(key)) continue;
      const d = m.e[key];
      if (d === 0) { full.delete(key); continue; }
      if (!isObj(d)) continue;
      const old = full.get(key); const f = old ? Object.assign({}, old) : {};
      for (const x in d) { if (!KEYRX.test(x) || BADKEY.has(x)) continue; if (d[x] === "$u") delete f[x]; else f[x] = d[x]; }
      full.set(key, f);
    }
    S.states.set(q, full); for (const k of S.states.keys()) if (k < q - HIST) S.states.delete(k);
    if (q > S.applied) S.applied = q;
    /* Uhr des Gastgebers schätzen (kleinster Versatz = geringste Verzögerung) */
    const tm = num(m.tm, 0, 1e12, 0), off = now() - tm;
    if (S.off == null || off < S.off) S.off = off; else S.off += 0.05; /* langsam nachziehen, falls Uhren driften oder die Leitung langsamer wird */
    S.buf.push({ q, tm, full, n: S.areaN }); S.buf.sort((x, y) => x.tm - y.tm); while (S.buf.length > 40) S.buf.shift();
    S.hostPaused = !!m.hm && !!m.hp;
    /* W33 Online: Gastgeber hat das Spiel im Hintergrund (Tab/App gewechselt) – dort steht die Welt; Hinweis statt stummem Stillstand */
    { const aw = !!m.hv; if (aw && !S.hostAway) { Z.toast && Z.toast(L(["Der Gastgeber hat das Spiel gerade im Hintergrund – es geht weiter, sobald er zurück ist.", "The host has the game in the background – it continues once they're back."])); } if (aw !== !!S.hostAway) { S.hostAway = aw; chip(); } }
    S.stats.snaps++; S.lastSnapAt = now();
    if (Array.isArray(m.ev)) for (const ev of m.ev.slice(0, 60)) playEv(ev);
    if (Number.isInteger(m.ia)) S.iAck = m.ia;
  }
  function playEv(ev) {
    if (!Array.isArray(ev) || ev.length < 2 || ev.length > 8) return;
    const id = int(ev[0], 0, 1e12, -1); if (id < 0 || S.evSeen.has(id)) return;
    S.evSeen.add(id); if (S.evSeen.size > 600) { const it = S.evSeen.values(); for (let i = 0; i < 300; i++) S.evSeen.delete(it.next().value); }
    const a = ev.slice(2).map(x => dec(x, 0, null));
    const FX = Z.fx, A = Z.audio, orig = f => (f && f._zs) || f;
    try {
      switch (ev[1]) {
        case "a": if (typeof a[0] === "string" && a[0].length < 40) orig(A.play).call(A, a[0], isObj(a[1]) ? a[1] : undefined); break;
        case "b": if (typeof a[0] === "number" && typeof a[1] === "number") orig(FX.burst).call(FX, a[0], a[1], Math.min(60, num(a[2], 0, 60, 8)), isObj(a[3]) ? a[3] : {}); break;
        case "t": if (typeof a[0] === "number" && typeof a[1] === "number") orig(FX.text).call(FX, a[0], a[1], txt(String(Array.isArray(a[5]) && a[5].length === 2 && typeof a[5][0] === "string" && typeof a[5][1] === "string" ? L(a[5]) : a[2] == null ? "" : a[2]), 60) /* W33 Online: Sprachpaar */, typeof a[3] === "string" ? a[3].slice(0, 30) : "#fff", !!a[4]); break;
        case "r": if (typeof a[0] === "number" && typeof a[1] === "number") orig(FX.ring).apply(FX, a.slice(0, 6).map(x => (typeof x === "number" || typeof x === "string" ? x : 0))); break;
        case "f": orig(FX.flashScreen).call(FX, typeof a[0] === "string" ? a[0].slice(0, 30) : "#fff", num(a[1], 0, 1, 0.3)); break;
        case "k": orig(FX.addShake).call(FX, num(a[0], 0, 30, 1)); break;
      }
    } catch (e) { }
  }
  /* empfangene Werte zurückverwandeln: nur einfache Daten, Spieldaten-Verweise aus der festen Liste, Objekt-Verweise über die eigene Tabelle */
  function dec(v, d, res) {
    if (typeof v === "string") {
      if (v[0] === "$") { if (v === "$u") return undefined; return reg().get(v.slice(1)); }
      if (v[0] === "@") return res ? res(v.slice(1)) : null;
      if (v[0] === "~") return v.slice(1);
      return v.length > 300 ? v.slice(0, 300) : v;
    }
    if (typeof v === "number") return isFinite(v) ? v : 0;
    if (v === null || typeof v === "boolean") return v;
    if (typeof v !== "object" || d > 4) return null;
    if (Array.isArray(v)) return v.slice(0, 64).map(x => dec(x, d + 1, res));
    let o;
    if (typeof v.$p === "string") { const p = reg().get(v.$p); o = p && typeof p === "object" ? Object.create(p) : {}; } else o = {};
    let n = 0;
    for (const k in v) { if (k === "$p" || !KEYRX.test(k) || BADKEY.has(k)) continue; if (++n > 64) break; o[k] = dec(v[k], d + 1, res); }
    return o;
  }
  function guestFrame(dt) {
    sendInput();
    const t = now();
    if (S.st === "play" && Z.level && !S.fading && S.buf.length && S.off != null) applyInterp(t);
    if (Z.boss && Z.boss.hp <= 0) Z.bossDefeated = true;
    /* der Gast pausiert für sich – meldet es aber (beide pausiert → Spiel steht) */
    const pz = !!(Z.ui && Z.ui.modalOpen);
    if (pz !== S.sentPz && S.link) { S.sentPz = pz; S.link.sendR({ t: "pz", p: pz ? 1 : 0 }); }
  }
  function sendInput() {
    const inp = Z.input; if (!S.link || !inp) return;
    let b = 0;
    const menu = !!(Z.ui && (Z.ui.modalOpen || Z.ui.choiceActive));
    if (!menu) for (let i = 0; i < ACT.length; i++) if (inp.held[ACT[i]] || inp.pressed[ACT[i]]) b |= 1 << i;
    /* lokale Spiellogik darf nichts benutzen (Türen, Händler …) – das macht der Gastgeber */
    inp.pressed.use = false; inp.pressed.up = false; if (inp.pressed.gear) { inp.pressed.gear = false; }
    const q = ++S.iSeq; S.iHist.push([q, b]); if (S.iHist.length > 4) S.iHist.shift();
    S.link.sendU({ t: "i", a: S.applied, k: S.iHist.slice() });
  }
  function frameAt(tm) {
    const B = S.buf; let a = null, b = null;
    for (let i = 0; i < B.length; i++) { if (B[i].tm <= tm) a = B[i]; else { b = B[i]; break; } }
    if (!a) return { a: b, b, k: 0 }; if (!b) return { a, b: a, k: 0 };
    return { a, b, k: Math.max(0, Math.min(1, (tm - a.tm) / Math.max(1, b.tm - a.tm))) };
  }
  function applyInterp(t) {
    const hostNow = t - S.off, fr = frameAt(hostNow - INTERP), newest = S.buf[S.buf.length - 1];
    if (!fr.b) return;
    const A = fr.a.full, B = fr.b.full, k = fr.k, lv = Z.level;
    /* 1) Objekte anlegen/finden */
    const live = S.live, want = new Map();
    for (const key of B.keys()) { if (key === "g" || key === "P1" || key === "P2") continue; let o = live.get(key); if (!o) { o = {}; live.set(key, o); } want.set(key, o); }
    for (const key of [...live.keys()]) if (!want.has(key)) live.delete(key);
    const res = r => (r === "P1" ? Z.player : r === "P2" ? (K() && K().p2) || null : live.get(r) || null);
    const setF = (o, f, fa, key) => {
      if (o.__zsQ !== fr.b.q) {
        for (const x in f) { if (BADKEY.has(x)) continue; o[x] = dec(f[x], 0, res); }
        for (const x in o) if (x !== "__zsQ" && !(x in f) && !SKIP.has(x) && x[0] !== "_" && typeof o[x] !== "function" && key !== "P1") delete o[x];
        o.__zsQ = fr.b.q;
      }
      if (fa && k < 1) for (const x of LERP) { const va = fa[x], vb = f[x]; if (typeof va === "number" && typeof vb === "number" && Math.abs(vb - va) < 160) o[x] = va + (vb - va) * k; }
    };
    for (const [key, o] of want) setF(o, B.get(key), A.get(key), key);
    for (const c in LISTS) { const arr = Z[LISTS[c]]; if (!Array.isArray(arr)) continue; arr.length = 0; }
    for (const [key, o] of want) { const arr = Z[LISTS[key[0]]]; if (Array.isArray(arr)) arr.push(o); }
    for (const o of Z.enemies) { if (!o.st || typeof o.st !== "object") o.st = {}; if (!o.def || typeof o.def !== "object") o.def = (own(Z.ENEMIES, o.id) && Z.ENEMIES[o.id]) || (own(Z.BOSSDEF, o.id) && Z.BOSSDEF[o.id]) || {}; }
    /* W34 Online: Demogorgon-Arme rechnen mit Float32Array-Ketten (p/v/o), die nicht übertragen werden (enc lässt Typed Arrays aus) →
       beim Gast „Demogorgon-Bild“-Fehler, Arme fehlten. Je Boss und Arm eine eigene Kette anlegen und über die Schnappschüsse behalten. */
    if (!S.armC || S.armC.size > 40) S.armC = new Map();
    for (const [key, o] of want) {
      const arms = key[0] === "E" && o.dg && typeof o.dg === "object" && Array.isArray(o.dg.arms) ? o.dg.arms : null; if (!arms) continue;
      let ca = S.armC.get(key); if (!ca) S.armC.set(key, (ca = []));
      arms.forEach((a, i) => {
        if (!a || typeof a !== "object" || a.p instanceof Float32Array) return; const n = int(a.n, 2, 64, 0); if (!n) return;
        let c = ca[i]; if (!c || c.p.length !== n * 2) c = ca[i] = { p: new Float32Array(n * 2), v: new Float32Array(n * 2), o: new Float32Array(n * 2), seen: false };
        a.p = c.p; a.v = c.v; a.o = c.o; a.init = c.seen; c.seen = true;
      });
    }
    /* 2) Spieler 1 (Ezekiel des Gastgebers) */
    const P = Z.player, fP = B.get("P1");
    if (P && fP) setF(P, fP, A.get("P1"), "P1");
    if (P) { if (!P.slots || typeof P.slots !== "object") P.slots = { a1: null, a2: null, s1: null, s2: null }; if (!P.stats || typeof P.stats !== "object") P.stats = { brut: 0, takt: 0, ueber: 0 }; if (!Array.isArray(P.bless)) P.bless = []; if (!P.st || typeof P.st !== "object") P.st = {}; if (!P.anim || typeof P.anim !== "object") P.anim = { t: 0, run: 0, land: 0, blink: 0, swing: 0 }; if (!P.cd || typeof P.cd !== "object") P.cd = {}; }
    /* 3) Spieler 2 (der Gast selbst): neuester Stand, mit Geschwindigkeit leicht vorausgerechnet – fühlt sich direkter an */
    const kk = K(), fN = newest.full.get("P2");
    if (kk && kk.apply && fN) {
      const s = dec(fN, 0, null); if (isObj(s)) {
        if (typeof s.ch === "string") s.ch = heroOk(s.ch);
        const ahead = Math.min(0.12, (S.rtt || 80) / 2000 + 0.03);
        const prev = kk.p2 ? { x: kk.p2.x, y: kk.p2.y } : null;
        const first = !kk.p2, t0 = Z.toast; if (first) Z.toast = () => { }; /* Beitritts-Hinweis von koop.js („Start lange halten …“) gilt am Gerät, nicht online */
        try { kk.apply(s); } catch (e) { console.warn("W32 p2", e); } finally { if (first) Z.toast = t0; }
        const p2 = kk.p2;
        if (p2 && typeof s.vx === "number" && typeof s.vy === "number" && !s.down) {
          p2.x += s.vx * ahead; p2.y += Math.max(-300, Math.min(300, s.vy)) * ahead * 0.5;
          if (prev && Math.hypot(p2.x - prev.x, p2.y - prev.y) < 40) { p2.x = prev.x + (p2.x - prev.x) * 0.5; p2.y = prev.y + (p2.y - prev.y) * 0.5; }
        }
      }
    } else if (kk && kk.p2 && !fN) { kk.p2 = null; kk.rex = null; }
    /* Lauf vorbei (beide gefallen): der Gastgeber entscheidet im Todesfenster, der Gast bekommt einen Hinweis */
    const bothDown = !!(P && P.dead && kk && kk.p2 && kk.p2.down);
    if (bothDown && !S.endNote) { S.endNote = true; Z.toast && Z.toast(L(["Beide gefallen – der Gastgeber führt euch zurück ins Lager.", "Both fallen – the host leads you back to camp."])); } else if (!bothDown) S.endNote = false;
    /* Boss-Auftritt/-Fall: sobald der Boss beim Gast existiert, dieselbe Szene zeigen (höchstens 4 s warten) */
    if (S.szene) { const sz = S.szene, o = live.get(sz.k); if (o && o.def) { S.szene = null; try { (sz.t === "bi" ? Z.ui.bossIntro : Z.ui.bossDown).call(Z.ui, o); } catch (e) { console.warn("W32 szene", e); } } else if (now() - sz.at > 4000) S.szene = null; }
    /* 4) Weltzustand */
    const g = B.get("g");
    if (g) {
      const bd = dec(g.boss, 0, res); Z.boss = bd && typeof bd === "object" ? bd : null; Z.bossDefeated = !!g.bd; Z.darkness = num(g.dk, -9, 99, 0);
      if (Z.run) { Z.run.doorsOpen = !!g.dO; if (typeof g.rt === "number") Z.run.time = g.rt; }
      if (typeof g.lk === "string" && lv.doors && g.lk.length === lv.doors.length) for (let i = 0; i < lv.doors.length; i++) lv.doors[i].locked = g.lk[i] === "1";
      if (isObj(g.lvp)) for (const x in g.lvp) { if (!KEYRX.test(x) || BADKEY.has(x) || x === "id" || x === "W" || x === "H" || x === "seed" || x === "warden" || x === "bossPending") continue; const v = g.lvp[x]; if (typeof v !== "object" && typeof lv[x] !== "function" && typeof lv[x] !== "object") lv[x] = v; }
    }
  }

  /* ======================= OBERFLÄCHE ======================= */
  let ui = { scr: "menu", entry: "", manualIn: "" };
  O.open = keep => { if (!Z.ui || !Z.ui.open) return; if (window.RTCPeerConnection == null) { Z.ui.confirm(L(["Online spielen", "Play online"]), L(["Dieser Browser kann keine direkten Verbindungen (WebRTC). Online-Koop geht mit einem aktuellen Firefox, Chrome, Edge oder Safari – allein spielen geht hier weiter.", "This browser can't do direct connections (WebRTC). Online co-op works in a current Firefox, Chrome, Edge or Safari – solo play still works here."]), "OK", () => { }); return; } /* W33 Online: Ausweg nennen */ if (!S.role && keep !== true) ui.scr = "menu"; draw(true); };
  function heroCard(id, sel, who) {
    const ch = Z.koop && Z.koop.CH && Z.koop.CH[id];
    const n = id === "Z" ? "Ezekiel" : ch ? ch.n : id === "E" ? "Echo" : "Friedrich";
    const sub = id === "Z" ? L(["Gastgeber", "Host"]) : ch ? L(ch.sub) : "";
    return '<div class="zso-karte' + (sel ? " an" : "") + '"><canvas width="96" height="96" data-zsf="' + id + '"></canvas><b>' + esc(n) + "</b><small>" + esc(sub) + "</small>" + (who ? '<em>' + esc(who) + "</em>" : "") + "</div>";
  }
  const PRIV = () => '<p class="zso-klein">' + L(["Datenschutz: Die Spieldaten gehen direkt von Gerät zu Gerät (WebRTC, verschlüsselt). Der Vermittler (PeerJS, 0.peerjs.com) sieht nur den Raum-Code und die technischen Verbindungsdaten (u. a. IP-Adressen); die STUN-Server (Cloudflare, Google) sehen nur eure öffentliche Adresse. Der Mitspieler sieht eure IP-Adresse. „Ohne Vermittler“ kommt ganz ohne Vermittler aus.", "Privacy: game data goes directly between devices (WebRTC, encrypted). The broker (PeerJS, 0.peerjs.com) only sees the room code and technical connection data (incl. IP addresses); the STUN servers (Cloudflare, Google) only see your public address. The other player sees your IP address. “Without a broker” needs no broker at all."]) + "</p>";
  function stLine() {
    const ping = S.rtt ? Math.round(S.rtt) + " ms" : "–";
    const m = { opening: S.msg, wait: L(["Warte auf Mitspieler …", "Waiting for the other player …"]), connecting: S.msg, lobby: L(["Verbunden", "Connected"]) + " · Ping " + ping, play: L(["Im Spiel", "In game"]) + " · Ping " + ping, lost: L(["Verbindung unterbrochen – versuche es weiter …", "Connection lost – still trying …"]), err: S.msg, end: S.msg, mwait: L(["Angebot bereit – an den Mitspieler schicken.", "Offer ready – send it to the other player."]), manswer: L(["Antwort bereit – an den Gastgeber zurückschicken.", "Answer ready – send it back to the host."]) }[S.st] || "";
    return '<p class="zso-st zso-' + esc(S.st || "idle") + '" role="status">' + esc(m) + "</p>";
  }
  function link() { const u = location.href.split("#")[0].split("?")[0]; return u + "#raum=" + S.code; }
  function body() {
    const h = [];
    h.push("<h2>" + esc(L(["Online spielen", "Play online"])) + '<span class="zso-tag">' + esc(L(["Koop zu zweit", "2-player co-op"])) + "</span></h2>");
    if (!S.role || S.st === "err" || S.st === "end") {
      if (S.st === "err" || S.st === "end") h.push(stLine());
      if (S.st === "end" && S.lastCredit) h.push('<p class="zso-gut">' + esc(L(["Gutschrift für deinen Spielstand: +", "Credit for your save: +"]) + S.lastCredit + L([" Seelensplitter", " soul shards"])) + "</p>");
      if (ui.scr === "join") {
        h.push("<p>" + esc(L(["Raum-Code des Gastgebers eingeben:", "Enter the host's room code:"])) + '</p><input class="zso-code" id="zso-code" maxlength="6" autocomplete="off" spellcheck="false" value="' + esc(ui.entry) + '" aria-label="Code">');
        h.push('<div class="zso-tasten">' + ABC.split("").map((c, i) => '<button data-zso="k" data-c="' + c + '"' + (i === 0 && ui.entry.length < CODE_N ? " autofocus" : "") + ">" + c + "</button>").join("") + '<button data-zso="k" data-c="<" aria-label="' + esc(L(["Löschen", "Delete"])) + '">⌫</button></div>');
        h.push('<p class="zso-wahl">' + esc(L(["Deine Figur:", "Your hero:"])) + "</p>" + '<div class="zso-karten">' + heroCard("G", S.hero === "G") + heroCard("E", S.hero === "E") + "</div>");
        h.push('<div class="knoepfe"><button data-zso="hero" data-h="G">Friedrich</button><button data-zso="hero" data-h="E">Echo</button></div>');
        h.push('<div class="knoepfe"><button data-zso="go"' + (ui.entry.length >= CODE_N ? " autofocus" : "") + ">" + esc(L(["Beitreten", "Join"])) + '</button><button data-zso="back">' + esc(L(["Zurück", "Back"])) + "</button></div>");
      } else if (ui.scr === "manual") {
        h.push("<p>" + esc(L(["Ohne Vermittler: Der Gastgeber erstellt ein Angebot und schickt den Text (Messenger, E-Mail …). Der Gast fügt ihn ein und schickt die Antwort zurück.", "Without a broker: the host creates an offer and sends the text (messenger, e-mail …). The guest pastes it and sends the answer back."])) + "</p>");
        h.push('<div class="knoepfe"><button data-zso="mhost" autofocus>' + esc(L(["Angebot erstellen (Gastgeber)", "Create offer (host)"])) + "</button></div>");
        h.push('<textarea id="zso-min" rows="3" placeholder="' + esc(L(["Angebot hier einfügen (Gast)", "Paste offer here (guest)"])) + '">' + esc(ui.manualIn) + "</textarea>");
        h.push('<div class="knoepfe"><button data-zso="mguest">' + esc(L(["Angebot annehmen (Gast)", "Accept offer (guest)"])) + '</button><button data-zso="back">' + esc(L(["Zurück", "Back"])) + "</button></div>");
      } else {
        h.push("<p>" + esc(L(["Spielt zu zweit über das Internet: Der Gastgeber spielt Ezekiel in seinem Spielstand, der Gast steigt als Friedrich oder Echo ein. Bosse und Gegner werden zu zweit zäher.", "Play together over the internet: the host plays Ezekiel in their save, the guest joins as Friedrich or Echo. Bosses and foes get tougher for two."])) + "</p>");
        h.push('<div class="knoepfe senk"><button data-zso="host" autofocus>' + esc(L(["Raum erstellen", "Create room"])) + '</button><button data-zso="join">' + esc(L(["Raum beitreten", "Join room"])) + '</button><button data-zso="manual">' + esc(L(["Ohne Vermittler (Text kopieren)", "Without a broker (copy text)"])) + '</button><button data-zso="close">' + esc(L(["Zurück", "Back"])) + "</button></div>");
      }
      h.push(PRIV());
      return h.join("");
    }
    h.push(stLine());
    if (S.role === "host" && S.kind === "peer" && S.code && S.st !== "opening") {
      h.push('<div class="zso-raum"><span>' + esc(L(["Raum-Code", "Room code"])) + '</span><b class="zso-gross" id="zso-raumcode">' + esc(S.code.slice(0, 3) + " " + S.code.slice(3)) + "</b></div>");
      h.push('<div class="knoepfe"><button data-zso="copy">' + esc(L(["Code kopieren", "Copy code"])) + '</button><button data-zso="copyl">' + esc(L(["Als Link teilen", "Share as link"])) + "</button></div>");
    }
    if (S.kind === "manual" && S.st === "mwait" && S.manual) {
      h.push('<p>' + esc(L(["1. Diesen Text an den Mitspieler schicken:", "1. Send this text to the other player:"])) + '</p><textarea readonly rows="3" id="zso-mout">' + esc(S.manual.offer) + '</textarea><div class="knoepfe"><button data-zso="mcopy">' + esc(L(["Kopieren", "Copy"])) + "</button></div>");
      h.push('<p>' + esc(L(["2. Seine Antwort hier einfügen:", "2. Paste their answer here:"])) + '</p><textarea rows="3" id="zso-mans"></textarea><div class="knoepfe"><button data-zso="mans">' + esc(L(["Verbinden", "Connect"])) + "</button></div>");
    }
    if (S.kind === "manual" && S.st === "manswer" && S.manual) h.push('<p>' + esc(L(["Diese Antwort an den Gastgeber zurückschicken – die Verbindung steht, sobald er sie einfügt:", "Send this answer back to the host – you're connected as soon as they paste it:"])) + '</p><textarea readonly rows="3" id="zso-mout">' + esc(S.manual.answer) + '</textarea><div class="knoepfe"><button data-zso="mcopy">' + esc(L(["Kopieren", "Copy"])) + "</button></div>");
    if (S.st === "lobby" || S.st === "play" || S.st === "lost") {
      h.push('<div class="zso-karten">' + heroCard("Z", false, (S.role === "host" ? L(["Du", "You"]) : L(["Gastgeber", "Host"])) + (S.hReady ? " ✔" : "")) + heroCard(S.gHero, true, (S.role === "guest" ? L(["Du", "You"]) : (S.gName || L(["Gast", "Guest"]))) + (S.gReady ? " ✔" : "")) + "</div>");
      if (S.st === "lobby") {
        if (S.role === "guest") h.push('<div class="knoepfe"><button data-zso="hero" data-h="G">Friedrich</button><button data-zso="hero" data-h="E">Echo</button><button data-zso="ready" autofocus>' + esc(S.gReady ? L(["Doch nicht bereit", "Not ready"]) : L(["Bereit!", "Ready!"])) + "</button></div>");
        else h.push('<div class="knoepfe"><button data-zso="start" ' + (S.gReady ? "autofocus" : "disabled") + ">" + esc(S.gReady ? L(["Los geht's!", "Let's go!"]) : L(["Warte, bis der Gast bereit ist …", "Waiting for the guest to be ready …"])) + "</button></div>");
        h.push('<p class="zso-klein">' + esc(L(["Verbindungstest: ", "Connection test: "]) + (S.rtt ? Math.round(S.rtt) + " ms" + (S.rtt < 80 ? L([" – sehr gut", " – very good"]) : S.rtt < 160 ? L([" – gut", " – good"]) : L([" – spürbare Verzögerung", " – noticeable delay"])) : "…") + (S.path ? " · " + S.path : "")) + "</p>");
      }
    }
    h.push('<div class="knoepfe">' + (S.st === "play" ? '<button data-zso="close" autofocus>' + esc(L(["Weiterspielen", "Resume"])) + "</button>" : "") + '<button data-zso="leave" class="gefahr">' + esc(S.role === "host" ? L(["Raum schließen", "Close room"]) : L(["Verlassen", "Leave"])) + "</button>" + (S.st !== "play" ? '<button data-zso="close">' + esc(L(["Ausblenden", "Hide"])) + "</button>" : "") + "</div>");
    return h.join("");
  }
  let isOpen = false;
  function draw(force) {
    const md = document.getElementById("modal");
    if (!force && !(isOpen && Z.ui.modalOpen && md && md.querySelector(".zso"))) return;
    const keep = md && md.querySelector("#zso-min"); if (keep) ui.manualIn = keep.value;
    const ce = md && md.querySelector("#zso-code"); if (ce) ui.entry = normCode(ce.value);
    const foc = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.zso + (document.activeElement.dataset.c || document.activeElement.dataset.h || "") : null;
    Z.ui.open('<div class="zso">' + body() + "</div>", { cls: "schmal zso-box", force: true, onClose: () => { isOpen = false; } });
    isOpen = true;
    const m = document.getElementById("modal");
    for (const cv of m.querySelectorAll("canvas[data-zsf]")) portrait(cv, cv.dataset.zsf);
    if (foc) { const b = [...m.querySelectorAll("[data-zso]")].find(x => x.dataset.zso + (x.dataset.c || x.dataset.h || "") === foc); if (b) setTimeout(() => b.focus({ preventScroll: true }), 40); }
    const ci = m.querySelector("#zso-code"); if (ci) ci.addEventListener("input", () => { ci.value = normCode(ci.value); ui.entry = ci.value; });
    /* Tippen in Code-/Textfeldern: die Menü-Steuerung (W/A/S/D/E/J, Leertaste) darf die Buchstaben nicht schlucken; Enter = Beitreten */
    for (const f of m.querySelectorAll("#zso-code,textarea")) f.addEventListener("keydown", e => {
      if (e.code === "Tab" || e.code === "Escape") return;
      e.stopPropagation();
      if (e.code === "Enter" && f.id === "zso-code") { e.preventDefault(); const g = m.querySelector('[data-zso="go"]'); if (g) g.click(); }
    });
  }
  function redraw() { try { if (isOpen) draw(false); chip(); } catch (e) { } }
  function portrait(cv, id) {
    const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height);
    try {
      const t = performance.now() / 1000;
      if (id === "Z") { if (Z.drawPlayer) { const P = Z.newPlayer(); P.x = 0; P.y = 0; P.onGround = true; P.face = 1; c.save(); c.translate(48, 86); c.scale(2.6, 2.6); c.translate(-P.w / 2, -P.h); Z.drawPlayer(c, P, t); c.restore(); } else if (Z.drawNPC) { c.save(); c.translate(48, 86); c.scale(2.6, 2.6); Z.drawNPC(c, "Z", 0, 0, t, 1); c.restore(); } return; }
      const k = Z.koop; if (k && k.drawBody) { const P = Z.newPlayer(); Object.assign(P, { koop: true, ch: id, w: 12, h: 28, x: 0, y: 0, onGround: true, face: 1, anim: { t: 0, run: 0, land: 0, blink: 0, swing: 0 }, cd: {}, cdMax: {} }); c.save(); c.translate(48, 88); c.scale(2.5, 2.5); k.drawBody(c, P, t, id); c.restore(); }
      else if (Z.drawNPC) { c.save(); c.translate(48, 86); c.scale(2.6, 2.6); Z.drawNPC(c, id, 0, 0, t, 1); c.restore(); }
    } catch (e) { }
  }
  const copy = s => { try { navigator.clipboard.writeText(s).then(() => Z.toast && Z.toast(L(["Kopiert.", "Copied."])), () => { }); } catch (e) { } };
  document.addEventListener("click", e => {
    const b = e.target && e.target.closest && e.target.closest("[data-zso]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.zso;
    try { Z.audio && Z.audio.play && Z.audio.play("ui", { vol: 0.3 }); } catch (x) { }
    if (a === "host") { S.role = "host"; S.hReady = true; S.gReady = false; hostRoom(0); draw(true); }
    else if (a === "join") { ui.scr = "join"; S.st = ""; draw(true); }
    else if (a === "manual") { ui.scr = "manual"; S.st = ""; draw(true); }
    else if (a === "back") { ui.scr = "menu"; S.st = ""; draw(true); }
    else if (a === "k") { const ci = document.getElementById("zso-code"); let v = ci ? ci.value : ui.entry; v = b.dataset.c === "<" ? v.slice(0, -1) : normCode(v + b.dataset.c); ui.entry = v; if (ci) ci.value = v; if (v.length === CODE_N) { const g = document.querySelector('[data-zso="go"]'); if (g) g.focus(); } }
    else if (a === "hero") { S.hero = heroOk(b.dataset.h); if (S.role === "guest" && S.link) { S.gHero = S.hero; S.gReady = false; S.link.sendR({ t: "hero", hero: S.hero }); } draw(true); }
    else if (a === "go") { const ci = document.getElementById("zso-code"); const c = normCode(ci ? ci.value : ui.entry); S.role = "guest"; S.gHero = S.hero; joinRoom(c); draw(true); }
    else if (a === "ready") { S.gReady = !S.gReady; if (S.link) S.link.sendR({ t: "ready", r: S.gReady ? 1 : 0 }); draw(true); }
    else if (a === "start") { if (S.role === "host" && S.gReady && S.link) { Z.ui.close(); hostStart(); } }
    else if (a === "copy") copy(S.code);
    else if (a === "copyl") { const u = link(); if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) navigator.share({ title: "Ezekiel – The Destroyer", url: u }).catch(() => copy(u)); else copy(u); }
    else if (a === "mcopy") { const t = document.getElementById("zso-mout"); if (t) copy(t.value); }
    else if (a === "mhost") { S.role = "host"; S.hReady = true; manualHost().catch(() => fail("fmt")); }
    else if (a === "mguest") { const t = document.getElementById("zso-min"); S.role = "guest"; S.gHero = S.hero; manualGuest(t ? t.value : "").catch(e => { S.role = null; fail(e && e.message === "alt" ? "alt" : "fmt"); }); } /* W33 Online: alt */
    else if (a === "mans") { const t = document.getElementById("zso-mans"); manualAccept(t ? t.value : "").catch(e => fail(e && e.message === "alt" ? "alt" : "fmt")); } /* W33 Online: alt */
    else if (a === "leave") { endSession(L(["Online-Spiel beendet.", "Online game ended."])); draw(true); }
    else if (a === "close") { Z.ui.close(); }
    else if (a === "mutnimm" && S.mutW) { const id = b.dataset.h; if (S.mutW.ang.indexOf(id) < 0) return; if (S.mutW.voll) { S.mutW.neu = id; mutZeichne(); } else mutSende(id, null); }
    else if (a === "mutalt" && S.mutW && S.mutW.neu) { const alt = b.dataset.h; if (S.mutW.akt.indexOf(alt) >= 0) mutSende(S.mutW.neu, alt); }
    else if (a === "mutback" && S.mutW) { S.mutW.neu = null; mutZeichne(); }
    else if (a === "mutskip" && S.mutW) mutSende("-", null);
    else if (a === "ambja" && S.ambW) { S.ambW = null; if (S.link) S.link.sendR({ t: "ambw", ok: true }); Z.ui.close(); } /* W39 P2 */
    else if (a === "ambnein" && S.ambW) { S.ambW = null; if (S.link) S.link.sendR({ t: "ambw", ok: false }); Z.ui.close(); }
  }, true);

  /* Statusanzeige im Spiel (eigener HUD-Streifen: Rolle, Ping, eigene Lebenspunkte beim Gast) */
  let chipEl = null;
  function chip() {
    if (!S.role || !S.playing) { if (chipEl) chipEl.hidden = true; return; }
    if (!chipEl) { chipEl = document.createElement("div"); chipEl.id = "zso-chip"; chipEl.setAttribute("role", "status"); document.body.appendChild(chipEl); }
    let p2 = Z.koop && Z.koop.p2;
    { const kh = document.getElementById("koop-hl"); if (kh && kh.offsetParent !== null && kh.getBoundingClientRect().width > 0) p2 = null; } /* W34 Online: Leben steht schon in der P2-Leiste – Streifen kurz halten */
    const ping = S.rtt ? Math.round(S.rtt) + " ms" : "…";
    const lostT = S.st === "lost" ? Math.max(0, Math.ceil((T_GIVEUP - (now() - S.lostAt)) / 1000)) : 0;
    chipEl.className = S.st === "lost" ? "weg" : S.rtt > 160 ? "lahm" : "";
    chipEl.innerHTML = "<b>" + esc(L(["Online", "Online"])) + "</b> " + (innerWidth < 560 ? "" : esc(S.role === "host" ? L(["Gastgeber", "Host"]) : L(["Gast", "Guest"])) + " · ") /* W34 Online: schmal → kurz */ + esc(ping) +
      (S.role === "guest" && p2 ? " · " + esc((Z.koop.CH && Z.koop.CH[p2.ch] ? Z.koop.CH[p2.ch].n : "")) + " ❤ " + Math.max(0, Math.round(p2.hp)) + "/" + Math.round(p2.hpMax) : "") +
      (S.st === "lost" ? " · " + esc(L(["getrennt – ", "disconnected – "])) + lostT + " s" : "") + (S.role === "host" && S.gPaused ? " · " + esc(L(["Gast pausiert", "guest paused"])) : "") + (S.role === "guest" && S.hostPaused ? " · " + esc(L(["Pause", "paused"])) : "") + (S.role === "guest" && S.hostAway && S.st === "play" ? " · " + esc(L(["Gastgeber im Hintergrund", "host away"])) : "") /* W33 Online */;
    chipEl.hidden = false;
    chipPlace();
  }
  /* W34 Online: Streifen nicht über HUD-Teile legen (Lebensleiste, P2-Leiste, Karte, Knöpfe – v. a. Handy hoch/klein):
     oben mittig beginnen und unter verdeckte Elemente rutschen (Rechteck-Vergleich mit den sichtbaren HUD-Teilen) */
  function chipPlace() {
    const c = chipEl; if (!c || c.hidden) return;
    const W = innerWidth, H = innerHeight, big = W * H * 0.3, rs = [];
    for (const e of document.querySelectorAll("#hud > *, #hud > * > *, #koop-hl, #touch button, #w31-padhinweis")) {
      if (e.offsetParent === null && getComputedStyle(e).position !== "fixed") continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.width * r.height > big || r.bottom <= 0 || r.top >= H) continue;
      const s = getComputedStyle(e); if (s.visibility === "hidden" || +s.opacity < 0.05) continue;
      rs.push(r);
    }
    const hit = () => { const b = c.getBoundingClientRect(); let lo = 0, ri = 0; for (const r of rs) if (Math.min(b.right, r.right) - Math.max(b.left, r.left) > 2 && Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top) > 2) { lo = Math.max(lo, r.bottom); ri = Math.max(ri, r.right); } return lo ? { lo, ri } : null; };
    const at = (x, y) => { c.style.top = y + "px"; if (x == null) { c.style.left = ""; c.style.transform = ""; } else { c.style.left = x + "px"; c.style.transform = "none"; } };
    let y = 6; at(null, y);
    for (let n = 0; n < 8; n++) {
      const h = hit(); if (!h) return;
      /* erst rechts neben die verdeckten Teile (gleiche Höhe), sonst darunter */
      const w = c.getBoundingClientRect().width, x = Math.ceil(h.ri + 8);
      if (x + w < W - 6) { at(x, y); if (!hit()) return; }
      y = Math.ceil(h.lo + 4); if (y > H * 0.5) break; at(null, y);
    }
    at(null, 6); /* kein freier Platz oben: wie bisher */
  }

  /* W32 Online: Aussehen (warme Töne, kein Blau) */
  { const st = document.createElement("style"); st.textContent =
    ".zso h2{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.zso .zso-tag{font-size:.7em;color:#c8a878;font-weight:600}" +
    ".zso .zso-st{margin:6px 0;padding:6px 10px;border-radius:6px;background:rgba(255,210,122,.08);border-left:3px solid #ffd27a}" +
    ".zso .zso-err,.zso .zso-lost{border-left-color:#ff6a4a;background:rgba(255,90,60,.1)}.zso .zso-play,.zso .zso-lobby{border-left-color:#9ad070}" +
    ".zso .zso-raum{display:flex;flex-direction:column;align-items:center;margin:8px 0}.zso .zso-raum span{font-size:.85em;color:#c8b8a8}" +
    ".zso .zso-gross{font:800 2.4rem/1.1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.14em;color:#ffd27a;user-select:all}" +
    ".zso .zso-karten{display:flex;gap:12px;justify-content:center;margin:8px 0}.zso .zso-karte{display:flex;flex-direction:column;align-items:center;width:140px;padding:6px;border-radius:8px;border:2px solid rgba(200,180,150,.25);opacity:.85}" +
    ".zso .zso-karte.an{border-color:#ffd27a;opacity:1;box-shadow:0 0 12px rgba(255,210,122,.3)}.zso .zso-karte small{font-size:.75em;color:#c8b8a8;text-align:center}.zso .zso-karte em{font-style:normal;color:#9ad070;font-size:.85em}" +
    ".zso .zso-code{font:800 1.8rem ui-monospace,Menlo,Consolas,monospace;letter-spacing:.3em;text-transform:uppercase;width:9.5em;text-align:center;background:#1a1214;color:#ffd27a;border:2px solid #6a4a3a;border-radius:6px;padding:4px}" +
    ".zso .zso-tasten{display:grid;grid-template-columns:repeat(11,1fr);gap:3px;margin:8px 0}.zso .zso-tasten button{padding:4px 0;min-width:0;font-family:ui-monospace,monospace}" +
    ".zso textarea{width:100%;box-sizing:border-box;background:#1a1214;color:#e8dcc0;border:1px solid #6a4a3a;border-radius:6px;font:12px ui-monospace,monospace;word-break:break-all}" +
    ".zso .zso-klein{font-size:.78em;color:#a99a8b;line-height:1.35}.zso .zso-gut{color:#9ad070;font-weight:700}" +
    "#zso-chip{position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:35;padding:3px 10px;border-radius:12px;background:rgba(20,12,14,.72);color:#e8dcc0;font:600 12px system-ui,sans-serif;pointer-events:none;border:1px solid rgba(255,210,122,.35);max-width:calc(100vw - 16px);box-sizing:border-box;text-align:center}" + /* W34 Online: max-width */
    "body.zso-gast #hud .hb,body.zso-gast #prompt{display:none!important}#zso-chip b{color:#ffd27a}#zso-chip.lahm{border-color:#e8a040}#zso-chip.weg{border-color:#ff6a4a;color:#ffb0a0}";
    document.head.appendChild(st); }

  /* ======================= EINSTIEG: Titelbild, Pausemenü, Link ======================= */
  function hookTitle() {
    const st = Z.ui && Z.ui.showTitle; if (!st || st._zs) return;
    const w = function () { if (S.role && S.playing) { S.toTitle = true; try { endSession(L(["Online-Spiel beendet.", "Online game ended."]), true); } catch (e) { } } const r = st.apply(this, arguments); try { addTitleBtn(); } catch (e) { } return r; }; w._zs = true; Z.ui.showTitle = w;
    addTitleBtn();
  }
  function addTitleBtn() {
    const t = document.getElementById("title"); if (!t || t.querySelector("#t-online")) return;
    const box = t.querySelector(".tbtn"), after = t.querySelector("#t-slots") || t.querySelector("#t-play"); if (!box || !after) return;
    const b = document.createElement("button"); b.id = "t-online"; b.textContent = L(["Online spielen", "Play online"]);
    b.onclick = () => { try { Z.audio.init && Z.audio.init(); } catch (e) { } O.open(); };
    after.insertAdjacentElement("afterend", b);
  }
  if (Z.ui) {
    hookTitle(); setTimeout(hookTitle, 0); setTimeout(addTitleBtn, 500);
    const kp = Z.koopPauseHTML;
    Z.koopPauseHTML = function () { let h = ""; try { h = kp ? kp.apply(this, arguments) : ""; } catch (e) { } if (Z.level && Z.level.hub && !S.role || S.role) h += '<button data-zso="open">' + esc(S.role ? L(["Online-Spiel", "Online game"]) : L(["Online spielen", "Play online"])) + "</button>"; return h; };
    document.addEventListener("click", e => { const b = e.target && e.target.closest && e.target.closest('[data-zso="open"]'); if (!b) return; e.preventDefault(); e.stopPropagation(); Z.ui.close(); setTimeout(O.open, 60); }, true);
  }
  /* Einladungslink: …/zerstoerer.html#raum=ABC234 (oder #zs=… für „Ohne Vermittler“) – der Teil nach # geht nie an einen Server */
  function fromHash() {
    const h = location.hash || ""; let m = /raum=([A-Za-z0-9]{6})/i.exec(h);
    if (m) { ui.scr = "join"; ui.entry = normCode(m[1]); setTimeout(() => { if (!Z.level) O.open(true); }, 900); return; }
    m = /zs=([A-Za-z0-9_\-]{20,})/.exec(h);
    if (m) { ui.scr = "manual"; ui.manualIn = "ZS1z" + m[1]; setTimeout(() => { if (!Z.level) O.open(true); }, 900); }
  }
  fromHash();
  /* W33 Online: Einladungslink in einen schon offenen Spiel-Tab eingefügt (nur der Teil nach # ändert sich → kein Neuladen) */
  window.addEventListener("hashchange", () => { if (!S.role && !Z.level) fromHash(); });
  O.test = { reg, enc, dec, tileHash, normCode, pack, unpack, newCode, S, sim: o => (S.sim = o || null) };
})();
