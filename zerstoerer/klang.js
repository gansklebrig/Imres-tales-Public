/* Ezekiel – The Destroyer · Raumklang und musikalische Akzente
   1. Raumklang je Gebiet: große Hallen bekommen einen langen, dunklen Hall (eigene Impulsantwort),
      Keller und Grüfte einen Tropfhall (Rückkopplungs-Echo) samt prozedural erzeugten Wassertropfen,
      Freiflächen bleiben trocken. Die Sende-Anteile hängen hinter den Lautstärkereglern (Effekte, Kulisse, Musik).
   2. Ereignisse aus dem Spiel werden beobachtet (ohne andere Dateien anzufassen) und lösen Stinger der Musik aus:
      Tagebuchseite, Truhe, Bossauftritt, Bossphase, Bosssieg, Tod, Killketten (Stufen 3/5/8/12/20),
      Elite-Sichtung, seltene/legendäre Beute, geschaffte Herausforderung oder Prüfung. */
(function () {
  "use strict";
  const Z = window.Z, A = Z.audio, M = Z.music;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* Raumtypen: verb = allgemeiner Hall von Z.audio, hall = großer Hall, echo = Tropfhall, drip = Tropfen je Sekunde */
  const RAUM = {
    frei:   { verb: 0.1, hall: 0, echo: 0, delay: 0.3, fb: 0.2, drip: 0 },
    lager:  { verb: 0.07, hall: 0, echo: 0, delay: 0.3, fb: 0.2, drip: 0 },
    halle:  { verb: 0.2, hall: 0.6, echo: 0, delay: 0.3, fb: 0.2, drip: 0 },
    turm:   { verb: 0.2, hall: 0.45, echo: 0.12, delay: 0.46, fb: 0.3, drip: 0 },
    esse:   { verb: 0.18, hall: 0.3, echo: 0.06, delay: 0.19, fb: 0.25, drip: 0 },
    keller: { verb: 0.26, hall: 0.12, echo: 0.34, delay: 0.27, fb: 0.38, drip: 0.35 },
    gang:   { verb: 0.24, hall: 0.05, echo: 0.22, delay: 0.21, fb: 0.3, drip: 0.15 },
    gruft:  { verb: 0.28, hall: 0.32, echo: 0.4, delay: 0.43, fb: 0.44, drip: 0.25 }
  };
  const BIOME_RAUM = { torhof: "frei", wehrgang: "frei", zinnen: "frei", sturm: "frei", hafen: "frei", hallen: "halle", glocken: "turm", schmiede: "esse", glut: "esse", keller: "keller", verlies: "keller", schlund: "gruft", see: "gruft", lager: "lager", passage: "gang" };
  const ARENA_RAUM = { lab: "keller", pier: "frei", tower: "turm", lakeboss: "gruft", hoard: "halle", towertop: "frei" };

  const KL = (Z.klang = { raum: null, drips: 0, stats: { drips: 0 } });
  let net = null;

  /* Impulsantwort für große Hallen: Vorverzögerung, frühe Reflexionen, dann ein Rauschschweif,
     der mit der Zeit dunkler wird (Luft und Stein schlucken die Höhen) */
  function hallIR(c, sec) {
    const sr = c.sampleRate, len = Math.floor(sr * sec), pre = Math.floor(sr * 0.028), ir = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch); let lp = 0;
      for (let i = pre; i < len; i++) {
        const x = (i - pre) / (len - pre), k = 0.55 + 0.42 * x; /* Dämpfung nimmt zu */
        lp = lp * k + (Math.random() * 2 - 1) * (1 - k);
        d[i] = lp * Math.pow(1 - x, 2.4) * 2.2;
      }
      for (let r = 0; r < 7; r++) { const at = pre + Math.floor(sr * (0.012 + r * 0.017 + Math.random() * 0.01)); if (at < len) d[at] += (Math.random() < 0.5 ? -1 : 1) * (0.5 - r * 0.05); }
    }
    return ir;
  }
  function build() {
    if (net || !A.ok) return net;
    const c = A.ctx; net = {};
    /* großer Hall */
    /* Handheld: kurzer Hall; „minimal“: ohne zweite Faltung (stummer, nicht angeschlossener Knoten wird nicht gerechnet) */
    const q = Z.gq || {};
    if (q.mini) { net.hall = c.createGain(); net.hall.gain.value = 0; net.noHall = true; }
    else { net.hall = c.createConvolver(); net.hall.buffer = hallIR(c, q.lean ? 1.8 : 4.2); }
    net.hallOut = c.createGain(); net.hallOut.gain.value = 0.5; if (!net.noHall) { net.hall.connect(net.hallOut); net.hallOut.connect(A.master); }
    /* Tropfhall: Verzögerung mit gefilterter Rückkopplung, leicht nach rechts versetzt, zweite Linie links */
    net.dl = c.createDelay(1.5); net.dl.delayTime.value = 0.27;
    net.dl2 = c.createDelay(1.5); net.dl2.delayTime.value = 0.27 * 1.5;
    net.fbLp = c.createBiquadFilter(); net.fbLp.type = "lowpass"; net.fbLp.frequency.value = 2400;
    net.fbHp = c.createBiquadFilter(); net.fbHp.type = "highpass"; net.fbHp.frequency.value = 220;
    net.fb = c.createGain(); net.fb.gain.value = 0.35;
    net.dl.connect(net.fbLp); net.fbLp.connect(net.fbHp); net.fbHp.connect(net.fb); net.fb.connect(net.dl);
    net.echoOut = c.createGain(); net.echoOut.gain.value = 0.55;
    const pr = c.createStereoPanner ? c.createStereoPanner() : null, pl = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pr && pl) { pr.pan.value = 0.45; pl.pan.value = -0.45; net.fbHp.connect(pr); pr.connect(net.echoOut); net.fbHp.connect(net.dl2); net.dl2.connect(pl); pl.connect(net.echoOut); }
    else net.fbHp.connect(net.echoOut);
    net.echoOut.connect(A.master);
    /* Sende-Wege hinter den Lautstärkereglern */
    const send = (from, to) => { const g = c.createGain(); g.gain.value = 0; from.connect(g); g.connect(to); return g; };
    net.sH = { sfx: send(A.sfx, net.hall), amb: send(A.amb, net.hall), mus: send(A.mus, net.hall) };
    net.sE = { sfx: send(A.sfx, net.dl), amb: send(A.amb, net.dl), mus: send(A.mus, net.dl) };
    /* eigener Bus für die erzeugten Tropfen (hängt an der Kulissen-Lautstärke) */
    net.drip = c.createGain(); net.drip.gain.value = 1; net.drip.connect(A.amb);
    return net;
  }
  /* Raum anwenden: alle Werte gleiten weich hinüber */
  KL.setRaum = (name, ov) => {
    if (!build()) return;
    const R = ov || RAUM[name] || RAUM.frei, c = A.ctx, now = c.currentTime, tc = ov && ov.tc || 0.6;
    KL.raum = name; KL.R = R;
    A.setVerb(R.verb);
    net.sH.sfx.gain.setTargetAtTime(R.hall * 0.45, now, tc); net.sH.amb.gain.setTargetAtTime(R.hall * 0.5, now, tc); net.sH.mus.gain.setTargetAtTime(R.hall * 0.4, now, tc);
    net.sE.sfx.gain.setTargetAtTime(R.echo * 0.3, now, tc); net.sE.amb.gain.setTargetAtTime(R.echo, now, tc); net.sE.mus.gain.setTargetAtTime(R.echo * 0.1, now, tc);
    net.dl.delayTime.setTargetAtTime(R.delay, now, 0.3); net.dl2.delayTime.setTargetAtTime(R.delay * 1.5, now, 0.3);
    net.fb.gain.setTargetAtTime(R.fb, now, tc);
  };
  function raumFor(lv) {
    if (!lv) return "frei";
    if (lv.hub) return "lager";
    if (lv.passage) return "gang";
    if (lv.arena && Z.ARENAS && Z.ARENAS[lv.arena]) return ARENA_RAUM[Z.ARENAS[lv.arena].kind] || BIOME_RAUM[lv.biome] || "frei";
    return BIOME_RAUM[lv.biome] || "frei";
  }

  /* Wassertropfen: Sinus mit schnell steigender Tonhöhe („Plink“), läuft durch den Tropfhall */
  function drip() {
    const c = A.ctx, t = c.currentTime + 0.01, f = 900 + Math.random() * 1500;
    const o = c.createOscillator(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null;
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.6 + Math.random() * 0.6), t + 0.045);
    const v = 0.05 + Math.random() * 0.06;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.11);
    o.connect(g); let last = g;
    if (p) { p.pan.value = (Math.random() - 0.5) * 1.6; g.connect(p); last = p; }
    last.connect(net.drip);
    KL.drips++; KL.stats.drips++;
    o.onended = () => { KL.drips--; try { o.disconnect(); g.disconnect(); p && p.disconnect(); } catch (_) {} };
    o.start(t); o.stop(t + 0.14);
    /* manchmal ein zweiter, kleinerer Tropfen hinterher */
    if (Math.random() < 0.25) setTimeout(() => { if (A.ok && KL.R && KL.R.drip && !Z.paused) drip(); }, 180 + Math.random() * 300);
  }

  /* ======================= GEMEINSAME HELFER ======================= */
  const AM = n => "amb/" + n + ".mp3", KS = n => "klang/" + n + ".mp3";
  const rnd = (a, b) => a + Math.random() * (b - a);
  const RA = (pre, n, a) => { const o = []; for (let i = a || 1; i <= n; i++) o.push(AM(pre + i)); return o; };
  const RK = (pre, list) => list.map(s => KS(pre + s));
  const gq = () => Z.gq || {};
  /* Lautheitsausgleich: jede Aufnahme wird beim ersten Gebrauch vermessen (Effektivwert) und auf etwa −20 dB (Einzelgeräusch)
     bzw. −32 dB (Raumschleife) gebracht – so passen die Lautstärken der Tabellen unabhängig von der Quelle zusammen */
  const NORM = {};
  function normOf(path, target) {
    const key = path + "|" + target; if (NORM[key] != null) return NORM[key];
    const b = A.buf[path]; if (!b) return null;
    const d = b.getChannelData(0), n = d.length, st = Math.max(1, Math.floor(n / 30000)); let s = 0, k = 0, pk = 1e-4;
    for (let i = 0; i < n; i += st) { s += d[i] * d[i]; k++; }
    for (let i = 0; i < n; i++) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > pk) pk = v; }
    const db = 10 * Math.log10(s / Math.max(1, k) + 1e-10);
    /* nie mehr anheben, als die Spitze verträgt (lang ausklingende Glocken haben wenig Effektivwert, aber einen harten Anschlag) */
    return (NORM[key] = clamp(Math.min(Math.pow(10, (target - db) / 20), 0.7 / pk), 0.25, 4));
  }
  /* Einzelgeräusch ohne Weltposition (löst keinen Lärm für die Gegner aus): vol, rate, pan, delay (s), verb, bus, dur, vary */
  function shot(path, o) {
    if (!A.ok || !path) return null;
    const b = A.buf[path]; if (!b) { if (b === undefined) A.load(path); return null; }
    const g = normOf(path, -20), d = o.delay > 0 ? o.delay : 0;
    KL.stats.shots = (KL.stats.shots || 0) + 1;
    return A.play(path, { vol: (o.vol || 0.3) * g, rate: o.rate || 1, pan: o.pan || 0, delay: d, verb: o.verb == null ? 0.5 : o.verb, bus: o.bus, dur: o.dur, vary: o.vary, gap: o.gap != null ? o.gap : 0.05, tag: o.tag || "", must: o.must });
  }
  /* Stereo und Lautstärke aus der Weltposition (wie Z.audio.play), far > 1 = trägt weiter */
  function posMix(x, y, far) {
    const c = Z.cam; if (!c) return [1, 0];
    const dx = x - (c.x + c.w / 2), dy = y - (c.y + c.h / 2);
    return [clamp(1.25 - Math.hypot(dx, dy) / (c.w * 0.85 * (far || 1)), 0, 1), clamp(dx / (c.w * 0.6), -0.9, 0.9)];
  }
  const preload = l => { for (const p of l) if (A.buf[p] === undefined) A.load(p); };

  /* ======================= GEGNERSTIMMEN =======================
     Die 20 Arten der W10-Erweiterung bekommen eigene Laute, Bewegungs-, Angriffs- und Todesgeräusche aus vorhandenen
     Aufnahmen (amb/, klang/). Aufruf aus gegner.js über Z.klang.gegner(e, ereignis, angriff):
       "alarm" (wird wach) · "pre" (holt aus) · "act" (Angriff) · "tod" · "trommel" (Kriegstrommel) · "toll" (Glockenschlag)
       · "glocke" (Alarmruf des Glockengeists). Rückgabe true = eigener Klang ersetzt den bisherigen.
     Bewegung, Lautäußerungen in Ruhe und im Kampf und das Knarzen einer getarnten Mimik beobachtet klang.js selbst.
     Musikalisch: der Goblin-Trommler spielt sein Muster im Takt der laufenden Musik (Achtelraster aus musik.js), die Pauke
     auf Grundton und Quinte der Tonart; im Kampf trommelt der nächste Trommler leise ein Ostinato mit. Der Glockengeist
     läutet Röhrenglocken auf Grundton und Quinte (Alarm auf das Achtelraster gesetzt), summt in Ruhe Handglocken-Töne. */
  const GR = {
    goblin: RA("e_goblin_", 4), ghul: RA("e_ghul_", 5), knurr: RA("e_knurren_", 7), grunz: RA("e_grunzen_", 9), schnueff: [AM("e_schnueffeln_1")],
    kaefer: RA("e_kaefer_", 13), spinne: RA("e_spinne_", 6), fluegel: RA("e_fluegelschlag_", 3), zisch: RA("e_zischen_", 2).concat(RA("n_zischen_", 5)),
    brutzel: RA("e_brutzeln_", 2), spuck: RA("e_spucken_", 3), blubb: RA("e_blubb_", 4).concat(RK("fx_rp_", ["bubble", "bubble2", "bubble3"])),
    schleim: RA("g_schleim_", 10).concat(RA("e_schleim_", 3)), platsch: RA("n_platsch_", 10), daemon: RA("e_daemon_", 4), feuerwesen: RA("e_feuerwesen_", 2),
    kraehe: RA("e_kraehe_", 16), lachen: RA("n_lachen_boese_", 9), schlange: RA("e_schlange_", 4), wind: [AM("e_windstoss_1"), AM("n_windstoss_1")],
    tuch: RA("e_tuch_", 3), kette: RA("n_kette_", 4), laterne: RA("g_kette_", 3), holz: RA("g_holzbruch_", 7), truhe: RA("g_truhe_", 3),
    knarr: RK("fx_ka_creak", [1, 2, 3]), holzschlag: RK("fx_mw_wood_", ["hit_03", "hit_05", "hit_08", "slam_02"]), muenz: RA("n_muenzen_", 4),
    stein: RA("g_steinschlag_", 4).concat(RA("n_steinschlag_", 5)), steinbruch: RK("fx_br_bfh1_rock_", ["breaking_01", "breaking_02", "falling_04"]),
    glas: RA("g_glasbruch_", 4), feuer: RA("n_feuerknistern_", 18), erz: RK("fx_0_erz_", [1, 2, 3, 4, 5, 6]), ruest: RA("g_ruestung_", 3),
    schild: RK("fx_0_schild_holz_", [1, 2, 3, 4, 5, 6]), greif: RA("e_greif_", 2), ruf: RA("e_kampfruf_", 43), donner: RA("n_donner_", 22), zap: [KS("fx_wn_blitz")],
    untot: RA("g_untot_", 23, 7), geist: RA("e_geisterheulen_", 5), essen: RA("e_essen_", 4), peitsche: [AM("n_peitsche_1")], bat: RA("n_fledermaus_", 8),
    fee: [KS("fx_wn_feenfeuer")], magie: RA("g_zauber_", 4)
  };
  /* je Art: alarm/tod/idle (wach)/ruhe (ahnungslos)/tell (getarnt, Spieler nah): [Gruppe, Lautstärke, Rate, Verzögerung, Dauer]
     pre/act: je Angriffsart; move: Schritt-/Flügelgeräusch alle stride Pixel bzw. moveT Sekunden (Flieger) */
  const VOX = {
    goblinTrommler: { alarm: [["goblin", 0.42, 1]], alarmFn: e => drumRoll(e), act: { slam: [["holzschlag", 0.35, 0.7]] },
      idle: [["goblin", 0.2, 1.05]], tod: [["goblin", 0.45, 0.85], ["holzschlag", 0.35, 0.6, 0.12]] },
    goblinSchild: { alarm: [["goblin", 0.4, 0.95], ["schild", 0.25, 1, 0.1]], act: { brace: [["schild", 0.42, 0.8], ["ruest", 0.25, 1, 0.05]], lunge: [["schild", 0.4, 0.9]] },
      move: [["ruest", 0.07, 1.25]], stride: 70, idle: [["goblin", 0.18, 0.95]], tod: [["goblin", 0.45, 0.8], ["schild", 0.32, 0.7, 0.1]] },
    laternentraeger: { alarm: [["goblin", 0.32, 1.45]], act: { lob: [["glas", 0.12, 1.6]] }, actFn: (e, a) => a.k === "flare" && signal(e),
      move: [["laterne", 0.06, 1.7]], stride: 46, idle: [["goblin", 0.16, 1.55]], tod: [["goblin", 0.42, 1.6], ["glas", 0.35, 1.1, 0.06]] },
    gallertwuerfel: { alarm: [["blubb", 0.42, 0.55]], pre: { grab: [["blubb", 0.28, 0.7]] }, act: { grab: [["schleim", 0.5, 0.6], ["blubb", 0.35, 0.5, 0.15]], hit: [["schleim", 0.35, 0.8]] },
      move: [["schleim", 0.12, 0.55]], stride: 34, idle: [["blubb", 0.16, 0.6]], ruhe: [["blubb", 0.1, 0.6]], tod: [["platsch", 0.5, 0.6], ["schleim", 0.45, 0.5, 0.08], ["blubb", 0.3, 0.45, 0.2]] },
    mimik: { act: { grab: [["truhe", 0.5, 1.25]], pull: [["spuck", 0.42, 0.7], ["schleim", 0.3, 0.9, 0.1]], leap: [["holzschlag", 0.3, 0.9]] },
      tell: [["knarr", 0.2, 0.7]], idle: [["knarr", 0.14, 0.6]], tod: [["holz", 0.5, 0.9], ["muenz", 0.35, 1, 0.15], ["knarr", 0.3, 0.6, 0.05]] },
    kenku: { act: { evade: [["fluegel", 0.35, 1.3]] }, idle: [["kraehe", 0.14, 1.3]], tod: [["kraehe", 0.45, 0.8], ["fluegel", 0.3, 1.1, 0.05]] },
    grimlock: { alarm: [["knurr", 0.4, 1.1], ["grunz", 0.3, 1, 0.25]], pre: { leap: [["schnueff", 0.35, 1]] }, act: { leap: [["knurr", 0.35, 1.2]], lob: [["grunz", 0.3, 1.1]] },
      idle: [["grunz", 0.22, 1.05]], ruhe: [["schnueff", 0.2, 1]], tod: [["grunz", 0.45, 0.8], ["knurr", 0.3, 0.7, 0.1]] },
    ghul: { alarm: [["ghul", 0.45, 1]], act: { leap: [["ghul", 0.45, 1.15]], combo: [["knurr", 0.18, 1.3]] }, idle: [["ghul", 0.22, 0.95]], ruhe: [["essen", 0.14, 0.8]],
      tod: [["ghul", 0.45, 0.75], ["untot", 0.3, 1, 0.1]] },
    schmuggler: { alarm: [["ruf", 0.34, 1.05]], act: { web: [["tuch", 0.45, 0.9]], smoke: [["glas", 0.3, 1.3], ["zisch", 0.35, 0.8, 0.05]], lunge: [["ruf", 0.22, 1.1]] } },
    glockengeist: { act: { shoot: [["geist", 0.3, 1.1]] }, pre: { toll: [["magie", 0.12, 0.7]] }, idleFn: e => bellHum(e), ruheFn: e => bellHum(e, 0.6), todFn: e => bellCrack(e),
      tod: [["geist", 0.35, 0.9], ["glas", 0.25, 0.7, 0.05]] },
    myconid: { alarm: [["zisch", 0.22, 0.5]], act: { spores: [["zisch", 0.35, 0.5], ["blubb", 0.2, 1.4, 0.05]] }, actFn: (e, a) => a.k === "heal" && arpeggio(e),
      move: [["schleim", 0.06, 1.45]], stride: 50, idle: [["blubb", 0.1, 1.5]], tod: [["zisch", 0.45, 0.45], ["platsch", 0.3, 1.2, 0.05]] },
    drider: { alarm: [["spinne", 0.4, 0.8], ["schlange", 0.3, 0.8, 0.15]], act: { thread: [["spinne", 0.3, 1]], combo: [["schlange", 0.22, 1.1]] },
      move: [["spinne", 0.11, 1.3]], stride: 55, idle: [["spinne", 0.18, 0.85]], tod: [["spinne", 0.45, 0.6], ["schlange", 0.35, 0.6, 0.1]] },
    rostmonster: { alarm: [["kaefer", 0.42, 0.8]], act: { hit: [["erz", 0.35, 0.7]], charge: [["kaefer", 0.35, 0.9]] }, move: [["kaefer", 0.1, 1.2]], stride: 45,
      idle: [["kaefer", 0.16, 0.9]], tod: [["kaefer", 0.42, 0.6], ["erz", 0.3, 0.6, 0.08]] },
    quasit: { alarm: [["lachen", 0.3, 1.6]], act: { invis: [["lachen", 0.22, 1.8]], dive: [["fluegel", 0.3, 1.7]] }, move: [["fluegel", 0.07, 1.9]], moveT: 1.2,
      idle: [["lachen", 0.15, 1.7]], tod: [["daemon", 0.35, 1.6, 0, 1.1], ["zisch", 0.3, 1.2, 0.05]] },
    gargoyle: { act: { dive: [["fluegel", 0.4, 0.6], ["wind", 0.22, 1.2]], hit: [["stein", 0.25, 1.3]] }, move: [["fluegel", 0.13, 0.6]], moveT: 0.9,
      idle: [["greif", 0.16, 0.6]], tod: [["stein", 0.55, 0.9], ["steinbruch", 0.4, 0.8, 0.08]] },
    grindylow: { alarm: [["blubb", 0.35, 0.8], ["platsch", 0.25, 1.1, 0.1]], act: { pull: [["platsch", 0.4, 0.8], ["peitsche", 0.3, 0.7]], grab: [["schleim", 0.4, 0.8]] },
      move: [["platsch", 0.07, 1.4]], stride: 60, idle: [["blubb", 0.18, 0.9]], tod: [["platsch", 0.45, 0.7], ["blubb", 0.35, 0.6, 0.1]] },
    glutfledermaus: { act: { dive: [["feuer", 0.25, 1.3]] }, move: [["feuer", 0.06, 1.4]], moveT: 1.4, tod: [["bat", 0.35, 1.1], ["zisch", 0.3, 1.5, 0.03], ["feuer", 0.25, 1]] },
    salamander: { alarm: [["schlange", 0.4, 0.85]], act: { lunge: [["zisch", 0.25, 1.1]], hit: [["feuer", 0.3, 1]] }, move: [["feuer", 0.08, 1]], stride: 50,
      idle: [["schlange", 0.18, 0.9]], tod: [["zisch", 0.45, 0.7], ["feuerwesen", 0.3, 1, 0.05, 1.2]] },
    saeureschnecke: { alarm: [["schleim", 0.35, 0.6]], act: { lob: [["spuck", 0.45, 0.75], ["brutzel", 0.22, 1, 0.3, 1]], shell: [["stein", 0.25, 0.7]], hit: [["brutzel", 0.2, 1.1, 0, 0.8]] },
      move: [["schleim", 0.08, 0.5]], stride: 26, idle: [["blubb", 0.12, 0.5]], tod: [["platsch", 0.5, 0.55], ["brutzel", 0.35, 0.9, 0.1, 1.2]] },
    sturmMephit: { alarm: [["wind", 0.3, 1.4, 0, 1.2], ["lachen", 0.22, 1.9, 0.1]], pre: { mark: [["zap", 0.16, 1.7]] }, act: { gust: [["wind", 0.45, 1.1, 0, 1.4]] },
      move: [["wind", 0.05, 1.8, 0, 0.8]], moveT: 1.6, idle: [["zap", 0.08, 2.1]], tod: [["zap", 0.35, 1.1], ["donner", 0.2, 1.5, 0.05]] }
  };
  KL.VOX = VOX;
  const KV = (KL.vox = { lastIdle: 0, n: {} });
  /* eine Liste von Geräuschen an der Stelle des Gegners */
  function emit(e, list, far) {
    if (!list || !list.length || !e) return;
    const [v0, pan] = posMix(e.x + e.w / 2, e.y + e.h / 2, far); if (v0 < 0.03) return;
    const big = Math.pow(e.size || 1, -0.3) * (e.elite ? 0.94 : 1);
    for (const it of list) {
      const l = GR[it[0]]; if (!l) continue;
      shot(l[(Math.random() * l.length) | 0], { vol: it[1] * v0 * (e.elite ? 1.15 : 1), rate: (it[2] || 1) * big, pan, delay: it[3] || 0, dur: it[4], verb: 0.5, tag: "kv" + it[0] });
    }
  }
  /* gestimmter Ton aus einer Instrument-Aufnahme in der Tonart der Musik, am Ort des Gegners (absolute Zeit t) */
  function tone(e, inst, midi, t, vol, far, verb) {
    const pr = M.probe && M.probe(inst, midi); if (!pr) return;
    const [v0, pan] = e ? posMix(e.x + e.w / 2, e.y + e.h / 2, far) : [1, 0]; if (v0 < 0.03) return;
    shot(pr.path, { vol: vol * v0, rate: pr.rate, pan, delay: t - A.ctx.currentTime, vary: 0, verb: verb == null ? 0.6 : verb, gap: 0, tag: "t" + t.toFixed(3) });
  }
  function hitAt(e, name, t, vol, rate, far) {
    const path = KS(name); const [v0, pan] = e ? posMix(e.x + e.w / 2, e.y + e.h / 2, far) : [1, 0]; if (v0 < 0.03) return;
    shot(path, { vol: vol * v0, rate: rate || 1, pan, delay: t - A.ctx.currentTime, vary: 0.02, verb: 0.35, gap: 0, tag: "d" + t.toFixed(3) });
  }
  const ton = (st, base) => (M.ton ? M.ton(st, base) : (M.key ? M.key().root : 48) + [0, 2, 3, 5, 7, 8, 10][st % 7]);

  /* ---------- Goblin-Trommler ---------- */
  /* Kriegstrommel (1 Takt, 8 Achtel ab dem nächsten Rasterpunkt; die Betonung fällt immer auf die Eins der Musik):
     P = Pauke auf Grundton (P0) bzw. Quinte (P4) der Tonart, T = Taikos. [Klang, Lautstärke, Versatz in Achteln] */
  const PHRASE = [[["P0", 0.6], ["taiko_36", 0.32]], [["taiko_48", 0.12]], [["taiko_48", 0.32]], [["taiko_48", 0.22]],
    [["P4", 0.5], ["taiko_42", 0.28]], [], [["taiko_42", 0.36]], [["taiko_48", 0.24], ["taiko_48", 0.32, 0.5]]];
  const OSTI = [[["P0", 0.2]], [], [], [["taiko_48", 0.09]], [["P4", 0.15]], [], [["taiko_42", 0.1]], [["taiko_48", 0.07]]];
  const DR = { upTo: -1e9, until: 0 };
  function drumNote(e, what, t, vol) {
    if (what === "P0") tone(e, "timpt", ton(0) - 12, t, vol, 1.6, 0.4);
    else if (what === "P4") tone(e, "timpt", ton(4) - 12, t, vol, 1.6, 0.4);
    else hitAt(e, what, t, vol, 1, 1.6);
  }
  function drumPhrase(e) {
    const r = M.raster && M.raster(0.03); if (!r) return false;
    const busy = DR.until > A.ctx.currentTime, k = e.elite ? 1.2 : 1;
    for (let i = 0; i < 8; i++) {
      const s = r.step + i, st = ((s % 8) + 8) % 8, t = r.t + i * r.beat;
      for (const [w, v, off] of PHRASE[st]) { if (busy && w[0] !== "P") continue; drumNote(e, w, t + (off || 0) * r.beat, v * k); }
    }
    DR.until = Math.max(DR.until, r.t + 8 * r.beat); DR.upTo = Math.max(DR.upTo, r.step + 7);
    emit(e, [["goblin", 0.38, 1.05]]);
    KV.n.trommel = (KV.n.trommel || 0) + 1;
    return true;
  }
  /* Alarm: kurzer Wirbel auf die nächsten Sechzehntel, Pauke auf den nächsten Schlag */
  function drumRoll(e) {
    const r = M.raster && M.raster(0.03); if (!r) return;
    for (let i = 0; i < 3; i++) hitAt(e, "taiko_48", r.t + i * r.beat * 0.5, 0.14 + i * 0.07, 1, 1.4);
    const s2 = r.step + 2 + (((r.step + 2) % 2) ? 1 : 0);
    drumNote(e, "P0", r.t + (s2 - r.step) * r.beat, 0.4);
  }
  /* im Kampf: der nächste wache Trommler spielt leise mit (nicht auf „minimal“, auf Handheld nur Eins und Drei) */
  function drumOstinato(e) {
    if (!e || gq().mini || !M.prof || (M.tier || 0) < 2) { DR.upTo = -1e9; return; }
    const r = M.raster(0.04); if (!r) return;
    if (DR.upTo > r.step + 16) DR.upTo = -1e9;
    const horizon = A.ctx.currentTime + 0.3, lean = gq().lean;
    for (let s = Math.max(r.step, DR.upTo + 1); ; s++) {
      const t = r.t + (s - r.step) * r.beat; if (t > horizon) break;
      DR.upTo = s; if (t < DR.until) continue;
      const st = ((s % 8) + 8) % 8; if (lean && st % 4) continue;
      for (const [w, v] of OSTI[st]) drumNote(e, w, t, v);
    }
  }

  /* ---------- Glockengeist ---------- */
  /* Glockenschlag (Angriff): tiefe Röhrenglocke auf dem Grundton, Quinte darunter, Pauke für die Wucht – sofort */
  function bellToll(e) {
    const t = A.ctx.currentTime + 0.01, k = e.elite ? 1.15 : 1;
    tone(e, "rgl", ton(0) + 24, t, 0.75 * k, 1.8, 0.9); tone(e, "rgl", ton(4) + 12, t + 0.012, 0.36 * k, 1.8, 0.9);
    tone(e, "timpt", ton(0) - 12, t, 0.4 * k, 1.5, 0.5);
    KV.n.toll = (KV.n.toll || 0) + 1;
    return true;
  }
  /* Alarmruf: „Ding – dong – (dong)“ auf das Achtelraster, Grundton oben, Quinte darunter; trägt weit */
  function bellAlarm(e) {
    const r = M.raster && M.raster(0.02); if (!r) return false;
    const t0 = r.t + (r.step % 2 ? r.beat : 0), b = r.beat;
    tone(e, "rgl", ton(0) + 24, t0, 0.5, 2.4, 0.9); tone(e, "rgl", ton(4) + 12, t0 + 2 * b, 0.46, 2.4, 0.9); tone(e, "rgl", ton(4) + 12, t0 + 4 * b, 0.2, 2.4, 0.9);
    KV.n.glocke = (KV.n.glocke || 0) + 1;
    return true;
  }
  /* in Ruhe: ein leiser Handglockenton aus dem Dreiklang, auf den nächsten Schlag */
  function bellHum(e, k) {
    const r = M.raster && M.raster(0.05); if (!r) return;
    const t = r.t + (r.step % 2 ? r.beat : 0), st = [0, 2, 4][(Math.random() * 3) | 0];
    tone(e, "hglo", ton(st) + 24, t, 0.13 * (k || 1), 1.3, 0.9);
  }
  /* Tod: die Glocke zerspringt – verstimmter Schlag, Klirren */
  function bellCrack(e) { const t = A.ctx.currentTime + 0.01; tone(e, "rgl", ton(0) + 23.4, t, 0.45, 1.6, 0.9); tone(e, "rgl", ton(0) + 24.6, t + 0.02, 0.3, 1.6, 0.9); }
  /* Laternenträger „Licht hoch!“: zwei helle Handglocken (Grundton, Quinte), Feenfeuer-Zischen */
  function signal(e) { const t = A.ctx.currentTime + 0.01; tone(e, "hglo", ton(0) + 36, t, 0.26, 1.6, 0.6); tone(e, "hglo", ton(4) + 36, t + 0.09, 0.22, 1.6, 0.6); emit(e, [["fee", 0.3, 1.2]]); }
  /* Myconid-Heilsporen: Kalimba-Arpeggio im Dreiklang, im Achtelraster */
  function arpeggio(e) { const r = M.raster && M.raster(0.03); if (!r) return; [0, 2, 4, 7].forEach((st, i) => tone(e, "kal", ton(st) + 12, r.t + i * r.beat * 0.5, 0.2 - i * 0.03, 1.2, 0.7)); }

  /* Aufruf aus gegner.js */
  KL.gegner = (e, ev, a) => {
    try {
      if (!A.ok || !e || !e.def || Z.quiet) return false;
      const V = VOX[e.id]; if (!V) return false;
      KV.n[ev] = (KV.n[ev] || 0) + 1;
      switch (ev) {
        case "alarm": emit(e, V.alarm); if (V.alarmFn) V.alarmFn(e); return !!(V.alarm || V.alarmFn);
        case "pre": if (V.pre && a) emit(e, V.pre[a.k]); return false;
        case "act": if (V.act && a) emit(e, V.act[a.k]); if (V.actFn && a) V.actFn(e, a); return false;
        case "tod": emit(e, V.tod); if (V.todFn) V.todFn(e); return !!V.tod;
        case "trommel": return drumPhrase(e);
        case "toll": return bellToll(e);
        case "glocke": return bellAlarm(e);
      }
    } catch (err) { if (!KL.err2) { KL.err2 = 1; console.error(err); } }
    return false;
  };
  /* Beobachter: Bewegung, Laute in Ruhe und im Kampf, getarnte Mimik, Kampf-Ostinato des Trommlers */
  function observe(dt) {
    const P = Z.player; if (!P || !Z.cam || !Z.enemies) return;
    const q = gq(), now = A.ctx.currentTime, slow = q.lean ? 1.5 : 1;
    let drummer = null, dBest = 1e9;
    for (const e of Z.enemies) {
      const V = VOX[e.id]; if (!V || e.dead || e.spawnT > 0 || e.ally) continue;
      if (!PRE.has(e.id)) preloadVox(e.id);
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      if (!onCam(cx, cy, 30)) continue;
      const k = e._kl || (e._kl = { it: rnd(1.5, 4), mv: rnd(0, 20) });
      const d = Math.hypot(cx - P.x - P.w / 2, cy - P.y - P.h / 2);
      if (e.disguise) {
        if (V.tell && d < 110) { k.it -= dt; if (k.it <= 0) { k.it = rnd(4, 8); if (Math.random() < 0.55) emit(e, V.tell); } }
        continue;
      }
      if (e.sleep || e.hidden > 0) continue;
      if (V.move && !q.mini) {
        if (V.moveT) { k.mv += dt * (Math.hypot(e.vx || 0, e.vy || 0) > 25 ? 1 : 0.35); if (k.mv >= V.moveT * slow) { k.mv = rnd(-0.2, 0.1); emit(e, V.move); } }
        else if (e.onGround !== false) { k.mv += Math.abs(e.vx || 0) * dt; if (k.mv >= V.stride * slow) { k.mv = 0; emit(e, V.move); } }
      }
      k.it -= dt;
      if (k.it <= 0) {
        k.it = (e.aware ? rnd(4, 8) : rnd(7, 13)) * slow;
        if (!(e.act && e.act.phase) && now - KV.lastIdle > 0.8) {
          const fn = e.aware ? V.idleFn : V.ruheFn, list = e.aware ? V.idle : V.ruhe;
          if (fn) { KV.lastIdle = now; fn(e); } else if (list) { KV.lastIdle = now; emit(e, list); }
        }
      }
      if (e.id === "goblinTrommler" && e.aware && d < dBest) { dBest = d; drummer = e; }
    }
    drumOstinato(drummer);
  }
  /* Aufnahmen einer Art vorladen, sobald sie zum ersten Mal auftaucht */
  const PRE = new Set();
  function preloadVox(id) {
    const V = VOX[id]; if (!V || PRE.has(id)) return; PRE.add(id);
    const groups = new Set();
    for (const key of ["alarm", "idle", "ruhe", "tell", "tod", "move"]) for (const it of V[key] || []) groups.add(it[0]);
    for (const key of ["pre", "act"]) for (const k in V[key] || {}) for (const it of V[key][k]) groups.add(it[0]);
    for (const g of groups) if (GR[g]) preload(GR[g].slice(0, 6));
    if (id === "goblinTrommler") preload(["taiko_36", "taiko_42", "taiko_48", "timpt_36", "timpt_39", "timpt_42", "timpt_45", "timpt_48", "timpt_51", "timpt_54", "timpt_57"].map(KS));
    if (id === "glockengeist" || id === "laternentraeger") preload(["60", "63", "66", "69", "72", "75", "78"].map(n => KS("rgl_" + n)).concat([60, 64, 68, 72, 76, 80, 84, 88, 92, 96].map(n => KS("hglo_" + n))));
    if (id === "myconid") preload([60, 63, 66, 69, 72, 75, 78, 81].map(n => KS("kal_" + n)));
  }

  /* ======================= RAUMKULISSEN =======================
     Jede Raumfunktion (welt.js: Z.raumTypAt) hat eine leise eigene Kulisse: eine Schleife (über eine eigene, weich
     überblendete Spur, optional gedämpft durch einen Tiefpass – z. B. Gemurmel hinter der Tavernenwand), vereinzelte Geräusche
     und manchmal etwas Musikalisches in der Tonart (Chor in der Kapelle, nachschwingende Glocken in der Glockenstube …).
     Dazu ein Raumhall nach Art (holz, klein, stein, halle, kirche, turm, wasser, esse) und Größe (zusammenhängende Zellen
     gleicher Funktion, Anteil freier Kacheln). Wechsel erst, wenn Ezekiel ~0,4 s im neuen Raum steht.
     Alles läuft über die Kulissen-Lautstärke und tritt im Kampf wie die übrige Kulisse zurück.
     Handheld: eine Schleife, seltener Einzelgeräusche; „minimal“: keine Schleife, nur seltene Einzelgeräusche. */
  const HALL = {
    holz:   { verb: 0.07, hall: 0.03, echo: 0, delay: 0.12, fb: 0.12, drip: 0 },
    klein:  { verb: 0.13, hall: 0.08, echo: 0.04, delay: 0.14, fb: 0.15, drip: 0 },
    stein:  { verb: 0.24, hall: 0.14, echo: 0.3, delay: 0.23, fb: 0.36, drip: 0.22 },
    halle:  { verb: 0.2, hall: 0.55, echo: 0.04, delay: 0.3, fb: 0.2, drip: 0 },
    kirche: { verb: 0.22, hall: 0.85, echo: 0.08, delay: 0.38, fb: 0.26, drip: 0 },
    turm:   { verb: 0.2, hall: 0.5, echo: 0.16, delay: 0.46, fb: 0.32, drip: 0 },
    wasser: { verb: 0.28, hall: 0.5, echo: 0.42, delay: 0.43, fb: 0.46, drip: 0.4 },
    esse:   { verb: 0.17, hall: 0.3, echo: 0.06, delay: 0.19, fb: 0.25, drip: 0 },
    frei:   { verb: 0.1, hall: 0.02, echo: 0, delay: 0.3, fb: 0.2, drip: 0 }
  };
  /* loop: [Datei, Lautstärke (1 = Normalpegel −32 dB), Tiefpass Hz] · one: [[Präfix, Anzahl, alle s, Lautstärke, Rate]] · fn: Musikalisches */
  const RK2 = {
    kueche:        { hall: "klein", loop: ["a_kochen2", 0.9], one: [["e_geschirr_", 6, 5, 0.2], ["n_geschirr_", 1, 11, 0.16], ["e_brutzeln_", 2, 9, 0.12], ["e_blubb_", 4, 7, 0.1, 1.2]] },
    weinkeller:    { hall: "stein", one: [["n_tropfen_", 23, 5, 0.14], ["n_einschenken_", 20, 18, 0.1], ["n_knarren_", 22, 14, 0.1, 0.8]] },
    vorratskammer: { hall: "klein", one: [["e_kiste_", 3, 12, 0.12], ["n_ratte_", 6, 15, 0.1, 1.2], ["n_knarren_", 22, 16, 0.08]] },
    gesindestube:  { hall: "holz", loop: ["a_gaeste", 0.55, 900], one: [["e_husten_", 3, 16, 0.1], ["n_stuhl_", 2, 14, 0.12]] },
    brunnenkammer: { hall: "wasser", loop: ["a_brunnen", 0.5, 2200], one: [["n_tropfen_", 23, 4, 0.14]] },
    bankettsaal:   { hall: "halle", one: [["e_geschirr_", 6, 10, 0.12], ["n_stuhl_", 2, 16, 0.1], ["e_raunen_", 3, 20, 0.08]] },
    anrichte:      { hall: "klein", one: [["e_geschirr_", 6, 6, 0.16], ["n_einschenken_", 20, 14, 0.12]] },
    bibliothek:    { hall: "holz", loop: ["a_uhr", 0.75], one: [["e_papier_", 3, 6, 0.2], ["g_buch_", 5, 9, 0.16], ["e_buch_", 6, 11, 0.14], ["e_schreibfeder_", 3, 17, 0.1]] },
    kapelle:       { hall: "kirche", one: [["e_raunen_", 3, 22, 0.06], ["n_stuhl_", 2, 30, 0.05]], fn: "chor" },
    ahnengalerie:  { hall: "halle", one: [["e_raunen_", 3, 16, 0.07], ["n_knarren_", 22, 12, 0.08]] },
    schlafgemach:  { hall: "holz", loop: ["a_lagerfeuer", 0.4, 2500], one: [["e_tuch_", 3, 14, 0.1], ["n_knarren_", 22, 18, 0.08]] },
    ruestkammer:   { hall: "klein", one: [["g_kettenhemd_", 5, 10, 0.12], ["g_ruestung_", 3, 14, 0.1], ["n_schwertziehen_", 4, 24, 0.06]] },
    wachstube:     { hall: "klein", loop: ["a_lagerfeuer", 0.35, 2500], one: [["e_husten_", 3, 14, 0.1], ["n_stuhl_", 2, 12, 0.1], ["g_schluessel_", 5, 16, 0.1]] },
    stall:         { hall: "holz", one: [["n_wiehern_", 11, 16, 0.1], ["n_schnauben_", 1, 9, 0.12], ["e_hufe_", 6, 11, 0.1]] },
    unterstand:    { hall: "holz", one: [["n_hammer_", 7, 7, 0.12], ["e_blasebalg_", 2, 13, 0.1]] },
    uebungsplatz:  { hall: "frei", one: [["n_hieb_", 4, 12, 0.08], ["n_klingen_", 24, 15, 0.06]] },
    schuppen:      { hall: "holz", one: [["e_holzpoltern_", 7, 14, 0.1], ["n_knarren_", 22, 12, 0.08]] },
    kaserne:       { hall: "holz", one: [["n_schnarchen_", 14, 7, 0.08], ["e_husten_", 3, 15, 0.08], ["n_knarren_", 22, 13, 0.08]] },
    geschuetzstand:{ hall: "frei", one: [["n_knarren_", 22, 9, 0.12, 0.8], ["e_riemen_", 2, 14, 0.1]] },
    schuetzenstand:{ hall: "frei", one: [["n_knarren_", 22, 11, 0.1], ["e_windstoss_", 1, 16, 0.08]] },
    waerterstube:  { hall: "klein", loop: ["a_lagerfeuer", 0.35, 2500], one: [["g_schluessel_", 5, 10, 0.12], ["n_einschenken_", 20, 20, 0.08], ["e_husten_", 3, 16, 0.08]] },
    zellenblock:   { hall: "stein", one: [["n_kette_", 4, 6, 0.16, 0.9], ["e_kette_", 4, 9, 0.12], ["n_tropfen_", 23, 3.5, 0.13], ["n_stoehnen_", 15, 16, 0.06, 0.9], ["e_riegel_", 4, 20, 0.08]] },
    folterkammer:  { hall: "stein", loop: ["a_feuer2", 0.6, 3000], one: [["n_kette_", 4, 8, 0.14, 0.8], ["n_stoehnen_", 15, 14, 0.06, 0.85], ["e_blasebalg_", 2, 18, 0.06]] },
    gebeinhaus:    { hall: "stein", loop: ["a_fluestern", 0.5], one: [["n_knochen_", 1, 12, 0.1], ["n_tropfen_", 23, 6, 0.1]] },
    lagerhaus:     { hall: "halle", one: [["n_knarren_", 22, 8, 0.12], ["e_kiste_", 3, 12, 0.1], ["e_rumpf_", 2, 22, 0.06]] },
    bootsschuppen: { hall: "holz", loop: ["a_wellen1", 0.45, 1400], one: [["e_ruder_", 3, 14, 0.08], ["n_knarren_", 22, 9, 0.12], ["e_platsch_", 4, 12, 0.08]] },
    taverne:       { hall: "holz", loop: ["a_gaeste", 0.9, 1300], one: [["n_einschenken_", 20, 7, 0.14], ["e_stubenlachen_", 4, 12, 0.1], ["n_trinken_", 16, 10, 0.1], ["n_stuhl_", 2, 11, 0.1]] },
    fischerkate:   { hall: "holz", loop: ["a_lagerfeuer", 0.35, 2200], one: [["e_moewe_", 10, 14, 0.06, 1], ["n_knarren_", 22, 12, 0.08]] },
    zollstube:     { hall: "holz", one: [["e_schreibfeder_", 3, 9, 0.14], ["n_muenzen_", 4, 12, 0.1], ["e_papier_", 3, 10, 0.14]] },
    glockenstube:  { hall: "turm", one: [["n_knarren_", 22, 13, 0.08, 0.7]], fn: "glocken" },
    uhrwerk:       { hall: "turm", loop: ["a_uhr", 1.1], one: [["n_klopfen_", 13, 9, 0.08, 0.8], ["e_werkzeug_", 5, 18, 0.06]], fn: "uhr" },
    uhrmacher:     { hall: "holz", loop: ["a_uhr", 0.8], one: [["e_werkzeug_", 5, 9, 0.12], ["n_klopfen_", 13, 11, 0.08, 1.4]] },
    taubenschlag:  { hall: "holz", one: [["e_fluegelschlag_", 3, 7, 0.12, 1.3], ["e_vogel_", 35, 11, 0.06, 0.7]] },
    seilkammer:    { hall: "klein", one: [["n_knarren_", 22, 6, 0.14, 0.7], ["e_riemen_", 2, 11, 0.1]] },
    brutkammer:    { hall: "stein", one: [["e_spinne_", 6, 6, 0.12], ["e_insekt_", 6, 9, 0.1], ["e_blubb_", 4, 12, 0.08, 0.7]] },
    beutelager:    { hall: "stein", loop: ["a_fliegenschwarm", 0.45], one: [["n_fliegen_", 3, 9, 0.08]] },
    pilzgrotte:    { hall: "wasser", one: [["e_blubb_", 4, 9, 0.08, 1.3], ["n_zischen_", 5, 14, 0.05, 0.5]], fn: "pilz" },
    kristallhoehle:{ hall: "kirche", one: [["n_tropfen_", 23, 5, 0.12]], fn: "kristall" },
    essenhalle:    { hall: "esse", one: [["e_blasebalg_", 2, 10, 0.12], ["n_zischen_", 5, 12, 0.08]], fn: "amboss" },
    giesserei:     { hall: "esse", loop: ["a_blubbern", 0.6, 1800], one: [["e_zischen_", 2, 5, 0.14], ["n_zischen_", 5, 7, 0.12], ["e_brutzeln_", 2, 9, 0.12]] },
    erzlager:      { hall: "stein", one: [["e_erz_", 6, 9, 0.12], ["g_steinschlag_", 4, 18, 0.06]] },
    waffenkammer:  { hall: "klein", one: [["n_schwertziehen_", 4, 14, 0.08], ["g_kettenhemd_", 5, 11, 0.1], ["n_metall_", 2, 15, 0.08]] },
    runenkammer:   { hall: "turm", loop: ["a_klangschale", 0.45], fn: "runen" },
    wehrturm:      { hall: "turm", one: [["n_knarren_", 22, 10, 0.1], ["e_windstoss_", 1, 14, 0.08]] },
    speiergalerie: { hall: "halle", one: [["e_steintor_", 4, 18, 0.05, 0.7], ["e_windstoss_", 1, 12, 0.08]] },
    tempel:        { hall: "wasser", loop: ["a_gesang", 0.55, 700], one: [["n_tropfen_", 23, 4, 0.14], ["e_blubb_", 4, 11, 0.08, 0.7]], fn: "tempel" },
    opferstaette:  { hall: "wasser", loop: ["a_klangschale", 0.35, 1200], one: [["e_blubb_", 4, 8, 0.1], ["n_tropfen_", 23, 5, 0.1]] },
    wrackhalde:    { hall: "wasser", one: [["e_rumpf_", 2, 11, 0.1, 0.8], ["n_knarren_", 22, 8, 0.1, 0.8], ["e_platsch_", 4, 12, 0.08]] },
    korallengarten:{ hall: "wasser", one: [["e_blubb_", 4, 6, 0.1, 1.1]], fn: "koralle" },
    schrein:       { hall: "kirche", loop: ["a_klangschale", 0.3], one: [["e_hoehlengesang_", 4, 22, 0.06, 0.85]] },
    schlackehalde: { hall: "stein", one: [["e_grollen_", 2, 16, 0.08], ["g_steinschlag_", 4, 12, 0.07], ["n_zischen_", 5, 10, 0.08]] },
    giftgarten:    { hall: "frei", one: [["e_blubb_", 4, 7, 0.1, 0.8], ["n_fliegen_", 3, 10, 0.08], ["n_zischen_", 5, 14, 0.06]] },
    truemmerhalle: { hall: "halle", one: [["e_stein_", 6, 12, 0.08], ["g_steinschlag_", 4, 16, 0.06], ["e_windstoss_", 1, 14, 0.06]] },
    geheim:        { hall: "stein", loop: ["a_fluestern", 0.35], one: [["n_tropfen_", 23, 7, 0.1]] },
    schatz:        { hall: "klein", one: [["n_muenzen_", 4, 14, 0.06]], fn: "schatz" },
    grube:         { hall: "stein", one: [["n_tropfen_", 23, 4, 0.12], ["n_steinschlag_", 5, 18, 0.05]] }
  };
  KL.RAEUME = RK2;
  const RM = (KL.zimmer = { cur: null, pend: null, pendT: 0, slot: null, timers: [], fnT: 0, cell: null, sizes: {}, stats: { wechsel: 0, one: 0, fn: 0 } });
  function roomBus() {
    if (RM.bus || !net) return RM.bus;
    RM.bus = A.ctx.createGain(); RM.bus.gain.value = 1; RM.bus.connect(A.amb);
    return RM.bus;
  }
  /* Raumgröße: zusammenhängende Zellen gleicher Funktion und Anteil freier Kacheln → Faktor 0,7…1,35 */
  function roomSize(cell) {
    const lv = Z.level; if (!lv || !cell) return 1;
    const key = cell.x + "," + cell.y; if (RM.sizes[key]) return RM.sizes[key];
    const cells = lv.cells || {}, seen = new Set([key]), stack = [cell];
    while (stack.length && seen.size < 8) {
      const c = stack.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = (c.x + dx) + "," + (c.y + dy), n = cells[k];
        if (n && !seen.has(k) && n.fn === cell.fn) { seen.add(k); stack.push(n); }
      }
    }
    const CW = Z.CW || 24, CH = Z.CH || 14; let free = 0, all = 0;
    if (lv.get) for (let ty = cell.y * CH; ty < (cell.y + 1) * CH; ty += 2) for (let tx = cell.x * CW; tx < (cell.x + 1) * CW; tx += 2) { const v = lv.get(tx, ty); all++; if (v !== 1 && v !== 7) free++; }
    const open = all ? free / all : 0.5, f = clamp(0.72 + 0.16 * (seen.size - 1) + 0.5 * (open - 0.45), 0.7, 1.35);
    for (const k of seen) RM.sizes[k] = f;
    return f;
  }
  function fadeSlot(s, t) {
    if (!s) return;
    const now = A.ctx.currentTime; s.g.gain.cancelScheduledValues(now); s.g.gain.setTargetAtTime(0, now, t || 0.9);
    setTimeout(() => { try { s.src && s.src.stop(); s.g.disconnect(); s.f && s.f.disconnect(); } catch (_) {} }, 6000);
  }
  function startLoop(def) {
    const [name, vol, lp] = def, path = AM(name), c = A.ctx;
    const s = { g: c.createGain(), f: null, src: null, name };
    s.g.gain.value = 0;
    if (lp) { s.f = c.createBiquadFilter(); s.f.type = "lowpass"; s.f.frequency.value = lp; s.f.Q.value = 0.5; s.f.connect(s.g); }
    s.g.connect(roomBus());
    A.load(path).then(b => {
      if (!b || RM.slot !== s) return;
      const src = c.createBufferSource(); src.buffer = b; src.loop = true; src.connect(s.f || s.g);
      src.start(0, Math.random() * Math.max(0, b.duration - 1)); s.src = src;
      s.g.gain.setTargetAtTime(vol * normOf(path, -32), c.currentTime, 1.3);
    });
    return s;
  }
  /* Raum wechseln (null = kein besonderer Raum: zurück zum Gebietshall) */
  function setRoom(id, cell) {
    RM.cur = id; RM.cell = cell; RM.stats.wechsel++;
    const def = id && RK2[id], q = gq();
    fadeSlot(RM.slot, 0.9); RM.slot = null;
    if (def && def.loop && !q.mini) RM.slot = startLoop(def.loop);
    RM.timers = def && def.one ? def.one.map(o => ({ o, t: rnd(1, o[2] * 0.7) })) : [];
    RM.fnT = rnd(2, 5);
    /* Hall: Art des Raums, skaliert nach Größe; ohne Raum der Hall des Gebiets */
    if (def && def.hall && HALL[def.hall] && W.lv && !W.lv.arena) {
      const H = HALL[def.hall], f = roomSize(cell);
      KL.setRaum(KL.raum, { verb: H.verb * (0.85 + 0.15 * f), hall: H.hall * f, echo: H.echo * (0.8 + 0.2 * f), delay: H.delay * (0.8 + 0.2 * f), fb: Math.min(0.55, H.fb * (0.9 + 0.1 * f)), drip: H.drip, tc: 1 });
      KL.raumGroesse = f;
    } else if (W.lv) KL.setRaum(raumFor(W.lv), RAUM[raumFor(W.lv)] && Object.assign({ tc: 1 }, RAUM[raumFor(W.lv)]));
    if (def) { const l = []; if (def.loop) l.push(AM(def.loop[0])); for (const o of def.one || []) l.push(AM(o[0] + (1 + ((Math.random() * o[1]) | 0)))); preload(l); }
  }
  /* Musikalisches je Raum (leise, nur in Ruhe – im Kampf schweigt es) */
  function roomFn(fn) {
    const r = M.raster && M.raster(0.05); if (!r || !M.note) return;
    const b = r.beat, bus = roomBus(), bar = r.t + (((8 - (r.step % 8)) % 8) * b);
    RM.stats.fn++;
    if (fn === "chor") { /* leiser Chor in der Kapelle: Dreiklang, lang gehalten, schwillt im Kirchenhall */
      const st = [0, 3, 5][(Math.random() * 3) | 0];
      [0, 2, 4].forEach((d, i) => M.note(i === 1 ? "aah" : "ooh", ton(st + d) + 12, bar + i * 0.04, 0.045 - i * 0.006, b * 14, bus));
      return rnd(10, 16);
    }
    if (fn === "glocken") { /* die Glocken schwingen nach: zwei sehr leise Töne, die sich überlagern */
      M.note("rgl", ton(0) + 24, bar, 0.04, b * 12, bus); M.note("rgl", ton(4) + 12, bar + b * 3, 0.028, b * 12, bus);
      if (Math.random() < 0.4) M.note("hglo", ton(2) + 36, bar + b * 6, 0.02, b * 8, bus);
      return rnd(8, 13);
    }
    if (fn === "uhr") { if (Math.random() < 0.5) M.note("glock", ton(0) + 36, bar, 0.025, b * 4, bus); return rnd(14, 22); }
    if (fn === "kristall") { [0, 4].forEach((d, i) => M.note("glas", ton(d) + 24 + i * 0, bar + i * b * 2, 0.03, b * 6, bus)); return rnd(7, 12); }
    if (fn === "pilz") { M.note("kal", ton([0, 2, 4, 6][(Math.random() * 4) | 0]) + 24, r.t, 0.03, b * 3, bus); return rnd(5, 10); }
    if (fn === "koralle") { M.note("hglo", ton([0, 2, 4][(Math.random() * 3) | 0]) + 24, r.t, 0.022, b * 6, bus); return rnd(8, 13); }
    if (fn === "runen") { M.note("glock", ton([0, 4][(Math.random() * 2) | 0]) + 36, bar, 0.02, b * 6, bus); return rnd(9, 15); }
    if (fn === "schatz") { M.note("cel", ton(4) + 36, r.t, 0.02, b * 2, bus); M.note("cel", ton(0) + 48, r.t + b * 0.5, 0.016, b * 3, bus); return rnd(9, 14); }
    if (fn === "tempel") { M.note("ooh", ton(0), bar, 0.035, b * 16, bus); return rnd(14, 20); }
    if (fn === "amboss") { /* fernes Hämmern im Takt */ M.hit && [0, 2].forEach(i => M.hit("amboss", bar + i * 4 * b, 0.045, 1.0 + i * 0.02, bus)); return rnd(8, 14); }
    return 10;
  }
  function roomTick(dt) {
    const lv = Z.level, P = Z.player;
    let id = null, cell = null;
    if (RM.force) { id = RM.force; cell = RM.cell; }
    else if (lv && P && !lv.hub && !lv.arena && !lv.passage && Z.raumTypAt) {
      const r = Z.raumTypAt(Math.floor((P.x + P.w / 2) / (Z.TILE || 16)), Math.floor((P.y + P.h / 2) / (Z.TILE || 16)));
      if (r && RK2[r.id]) { id = r.id; cell = r.cell; }
    }
    if (id !== RM.pend) { RM.pend = id; RM.pendT = 0; } else RM.pendT += dt;
    if (RM.pend !== RM.cur && RM.pendT >= 0.4) setRoom(RM.pend, cell);
    else if (id && RM.cur === id && cell && RM.cell !== cell) RM.cell = cell;
    if (!RM.cur) return;
    const q = gq(), calm = (M.tier || 0) < 2, slow = q.mini ? 2.2 : q.lean ? 1.5 : 1;
    for (const tm of RM.timers) {
      tm.t -= dt; if (tm.t > 0) continue;
      const [pre, n, every, vol, rate] = tm.o;
      tm.t = every * rnd(0.6, 1.5) * slow;
      if (!calm && Math.random() < 0.6) continue;
      const path = AM(pre + (1 + ((Math.random() * n) | 0)));
      shot(path, { vol, rate: rate || 1, pan: rnd(-0.75, 0.75), bus: roomBus(), verb: 0.4, vary: 0.1, gap: 0.2, tag: "rm" });
      RM.stats.one++;
    }
    const def = RK2[RM.cur];
    if (def.fn && !q.mini && calm) { RM.fnT -= dt; if (RM.fnT <= 0) RM.fnT = roomFn(def.fn) * slow || 10; }
  }
  /* Prüfstand (test/w12_klang): Klangnetz für einen neuen AudioContext neu aufbauen */
  KL._reset = () => { net = null; RM.bus = null; RM.slot = null; RM.cur = RM.pend = null; RM.force = null; W.lv = null; DR.upTo = -1e9; DR.until = 0; KV.lastIdle = 0; };
  KL._alle = () => { const l = []; for (const g in GR) l.push(...GR[g]); for (const id in RK2) { const d = RK2[id]; if (d.loop) l.push(AM(d.loop[0])); for (const o of d.one || []) for (let i = 1; i <= o[1]; i++) l.push(AM(o[0] + i)); } return l; };
  KL.raumJetzt = () => ({ raum: RM.cur, groesse: KL.raumGroesse || 1, hall: KL.R, loop: RM.slot && RM.slot.name });
  /* Prüfhilfe: Raum erzwingen (ohne Kachelposition) */
  KL.raumTest = (id) => { setRoom(id, null); RM.pend = id; RM.pendT = 0; RM.force = id; };

  /* ---------- Beobachter ---------- */
  const W = { lv: null, pages: 0, kills: 0, chain: 0, chainT: 0, boss: null, phase: 0, won: false, dead: false, seenChest: new WeakSet(), seenElite: new WeakSet(), seenLoot: new WeakSet(), chall: 0, trials: 0, dripT: 2 };
  /* liegt ein Punkt im Bild (mit etwas Rand)? */
  const onCam = (x, y, m) => { const c = Z.cam; if (!c) return true; m = m || 0; return x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m; };
  const pageCount = () => (Z.meta && Z.meta.tagebuch ? Object.keys(Z.meta.tagebuch).length : 0);
  function onLevel(lv) {
    W.lv = lv; W.pages = pageCount(); W.kills = (Z.stats && Z.stats.kills) || 0; W.chain = 0; W.chainT = 0;
    W.boss = Z.boss || null; W.phase = (Z.boss && Z.boss.phase) || 0; W.won = !!Z.bossDefeated; W.dead = !!(Z.player && Z.player.dead);
    for (const p of Z.pickups || []) { if (p.open) W.seenChest.add(p); }
    W.chall = (Z.stats && Z.stats.challenges) || 0; W.trials = (Z.stats && Z.stats.pruefungen) || 0;
    KL.setRaum(raumFor(lv));
    /* Raumkulisse zurücksetzen (neue Karte) */
    if (RM.slot) fadeSlot(RM.slot, 0.8);
    RM.slot = null; RM.cur = RM.pend = null; RM.pendT = 0; RM.timers = []; RM.sizes = {}; RM.force = null; RM.cell = null; DR.upTo = -1e9; DR.until = 0;
  }
  KL.tick = (dt) => {
    if (!A.ok || !M.out) return;
    const lv = Z.level; if (!lv) return;
    if (lv !== W.lv) onLevel(lv);
    if (Z.paused) return;
    const P = Z.player;
    /* Tagebuchseite */
    const pc = pageCount();
    if (pc > W.pages) M.stinger("seite");
    W.pages = pc;
    /* Truhen (auch verfluchte) */
    for (const p of Z.pickups || []) if ((p.kind === "chest" || p.kind === "cursed") && p.open && !W.seenChest.has(p)) { W.seenChest.add(p); M.stinger("truhe"); }
    /* Boss: Auftritt, Phasen, Sieg */
    const b = Z.boss && !Z.boss.dead && !Z.bossDefeated ? Z.boss : null;
    if (b && b !== W.boss) { W.phase = b.phase || 0; if (!(M.lastSting && M.lastSting.boss && A.ctx.currentTime - M.lastSting.boss < 4)) M.stinger("boss"); }
    if (b && (b.phase || 0) > W.phase) { W.phase = b.phase; M.stinger("phase"); }
    W.boss = b || (Z.bossDefeated ? W.boss : null);
    if (Z.bossDefeated && !W.won && Z.boss) {
      M.stinger("sieg");
      /* Wächter mitten im Gebiet besiegt: nach dem Schlussakkord zurück zur Musik des Gebiets */
      const l0 = lv;
      if (!lv.arena && !lv.hub && !lv.passage) setTimeout(() => { if (Z.level === l0 && M.prof && M.prof.boss) M.set(l0.biome); }, 4500);
    }
    W.won = !!Z.bossDefeated;
    /* Tod */
    const dead = !!(P && P.dead);
    if (dead && !W.dead) M.stinger("tod");
    W.dead = dead;
    /* Killketten: Gegner, die kurz nacheinander fallen – Intensität steigt, Stinger nur auf den Stufen */
    const k = (Z.stats && Z.stats.kills) || 0;
    if (k < W.kills) W.kills = k; /* neuer Lauf */
    if (k > W.kills) {
      const n = k - W.kills, prev = W.chain; W.kills = k;
      W.chain = W.chainT > 0 ? W.chain + n : n; W.chainT = 2.6;
      if (!dead && M.chainHit && W.chain >= 3) M.chainHit(W.chain, prev); /* Mehrfach-Kill: nur die höchste erreichte Stufe erklingt */
    }
    if (W.chainT > 0) { W.chainT -= dt; if (W.chainT <= 0) { W.chain = 0; M.chainEnd && M.chainEnd(); } }
    /* Elite gesichtet: das erste Mal im Bild und wach (oder schon recht nah) */
    if (P && !dead) for (const e of Z.enemies || []) {
      if (!e.elite || e.dead || e.ally || e.dummy || W.seenElite.has(e)) continue;
      const ex = e.x + (e.w || 0) / 2, ey = e.y + (e.h || 0) / 2;
      if (!onCam(ex, ey, -8)) continue;
      if (e.aware || Math.hypot(ex - P.x, ey - P.y) < 220) { W.seenElite.add(e); M.stinger("elite"); M.push && M.push(0.5, 5); }
    }
    /* seltene Beute: ein sehr seltener oder legendärer Gegenstand liegt neu im Bild */
    for (const p of Z.pickups || []) {
      if (p.kind !== "item" || !p.it || W.seenLoot.has(p) || !onCam(p.x, p.y, 8)) continue;
      W.seenLoot.add(p);
      if ((p.it.rar || 0) >= 2 && !p.it.cursed) M.stinger("beute", { rar: p.it.rar });
    }
    /* Herausforderung (bilanz.js) oder Prüfungskammer (erkundung.js) geschafft */
    const ch = (Z.stats && Z.stats.challenges) || 0, tr = (Z.stats && Z.stats.pruefungen) || 0;
    if ((ch > W.chall || tr > W.trials) && !dead) M.stinger("geschafft");
    W.chall = ch; W.trials = tr;
    /* Tropfen im Keller und in Grüften */
    if (KL.R && KL.R.drip > 0 && net && KL.drips < 6) {
      W.dripT -= dt;
      if (W.dripT <= 0) { W.dripT = (0.6 + Math.random() * 1.8) / KL.R.drip; drip(); }
    }
    /* Raumkulisse und Gegnerstimmen */
    try { roomTick(dt); observe(dt); } catch (e) { if (!KL.err3) { KL.err3 = 1; console.error(e); } }
  };

  /* in den Takt der Musik einhängen (läuft auch während der Pause weiter) */
  const upd0 = M.update;
  /* Handheld: Beobachter nur ~10× je Sekunde (Stinger kommen höchstens 0,1 s später),
     der Musik-Takt selbst höchstens ~20× je Sekunde (Vorlauf der Planung 0,16 s – reicht) */
  let klAcc = 0, muAcc = 0;
  M.update = function (dt) {
    let r;
    if (Z.gq && Z.gq.lean) { muAcc += dt || 0; if (muAcc >= 0.045) { r = upd0.call(this, muAcc); muAcc = 0; } }
    else r = upd0.apply(this, arguments);
    klAcc += dt || 0;
    if (!(Z.gq && Z.gq.lean) || klAcc >= 0.1) { const d = klAcc; klAcc = 0; try { KL.tick(d); } catch (e) { if (!KL.err) { KL.err = 1; console.error(e); } } }
    return r;
  };
})();
