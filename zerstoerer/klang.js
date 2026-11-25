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
    const ps = n > 200000 ? 5 : 1; /* lange Schleifen: Spitze grob abtasten (sonst Millisekunden-Spitze im Spiel) */
    for (let i = 0; i < n; i += ps) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > pk) pk = v; }
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
  function emit(e, list, far, warn) {
    if (!list || !list.length || !e) return;
    const [v0, pan] = posMix(e.x + e.w / 2, e.y + e.h / 2, far); if (v0 < 0.03) return;
    const big = Math.pow(e.size || 1, -0.3) * (e.elite ? 0.94 : 1);
    for (const it of list) {
      const l = GR[it[0]]; if (!l) continue;
      shot(l[(Math.random() * l.length) | 0], { vol: it[1] * v0 * (e.elite ? 1.15 : 1), rate: (it[2] || 1) * big, pan, delay: it[3] || 0, dur: it[4], verb: 0.5, tag: "kv" + it[0], must: !!warn });
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
        case "pre": if (V.pre && a) emit(e, V.pre[a.k], undefined, true); return false; /* R19: Ausholen = Warnklang, immer durch */
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
  /* ======================= RUNDE 2: UNTERGRUND, ÜBERGÄNGE, TREFFER =======================
     Schritte und Landungen: kern.js leitet "step", "stepWood" und "land" an A.hook weiter; hier wird der Untergrund unter
     Ezekiels Füßen bestimmt (Kachel unter den Füßen, Wasser an den Füßen, Raumfunktion, Gebiet, Regen) und passend
     geklungen: stein, holz, nass, metall (Gitterstege in Schmiede/Glut), gras (Moos im Freien), kies (Asche/Ruß),
     teppich (Hallen, Durchgang), knochen (Gebeinhaus, Beutelager, Brutkammer). Landen: je Untergrund, mit Fallhöhe lauter
     und dumpfer, ab mittlerer Höhe ein Aufprall. Klettern: Sprossen-Knarzen alle ~14 px (im Sturm Ranken-Rascheln). */
  const STEPS = {
    stein: RA("n_steinschritte_", 8).concat(RA("g_stein_", 5)), holz: RA("n_holzschritte_", 24).concat(RA("g_holz_", 5)), nass: RA("g_nass_", 3),
    gras: RA("g_gras_", 5).concat(RA("n_laubschritt_", 9)), kies: RA("n_kies_", 8).concat(RA("e_kies_", 2)), teppich: RA("n_erdschritte_", 17),
    metall: RA("n_steinschritte_", 8), knochen: RA("n_steinschritte_", 8)
  };
  /* Zusatzschicht je Untergrund: [Liste, Lautstärke, Rate, Dauer, Wahrscheinlichkeit] */
  const STEPL = { metall: [RA("g_metallhieb_", 7), 0.09, 2.4, 0.12, 1], knochen: [RA("g_untot_", 6).concat([AM("n_knochen_1")]), 0.12, 1.5, 0.25, 0.5], nass: [RA("n_platsch_", 10), 0.1, 1.5, 0.3, 0.55] };
  const STEPV = { stein: 1, holz: 1, nass: 1.15, gras: 1.05, kies: 0.85, teppich: 0.75, metall: 1, knochen: 1 };
  const OUT_BIOME = { torhof: 1, wehrgang: 1, sturm: 1, zinnen: 1 };
  KL.untergrund = () => {
    const P = Z.player, lv = Z.level; if (!P || !lv || !lv.get) return "stein";
    const T = Z.TILE || 16, tx = Math.floor((P.x + P.w / 2) / T), tyIn = Math.floor((P.y + P.h - 3) / T), tyB = Math.floor((P.y + P.h + 2) / T);
    const vin = lv.get(tx, tyIn), vb = lv.get(tx, tyB), bi = lv.biome, top = (Z.biome && Z.biome.tile && Z.biome.tile.top) || "";
    if (vin === 6 || vb === 6) return "nass";
    if (vb === 2 || vb === 8 || vb === 4) return bi === "schmiede" || bi === "glut" ? "metall" : "holz";
    if (lv.hub) return "gras";
    if (lv.passage) return "teppich";
    const r = Z.raumTypAt && Z.raumTypAt(tx, tyIn), fn = r && r.id;
    if (fn === "gebeinhaus" || fn === "beutelager" || fn === "brutkammer") return "knochen";
    if (fn === "taverne" || fn === "bootsschuppen" || fn === "stall" || fn === "schuppen" || fn === "kaserne" || fn === "taubenschlag") return "holz";
    if (top === "carpet" || fn === "bibliothek" || fn === "schlafgemach") return "teppich";
    if (top === "wood") return "holz";
    if (top === "ash" || top === "soot") return "kies";
    if (top === "moss" && OUT_BIOME[bi]) { const wt = Z.wetter && Z.wetter(); return wt && (wt.mood === "regen" || wt.mood === "gewitter") && Math.random() < 0.35 ? "nass" : "gras"; }
    if ((top === "drip" || top === "slime" || top === "algae") && Math.random() < 0.18) return "nass";
    return "stein";
  };
  function stepSound(kind, vol, rate, land) {
    const l = STEPS[kind] || STEPS.stein, path = l[(Math.random() * l.length) | 0];
    shot(path, { vol: vol * (STEPV[kind] || 1), rate, verb: 0.35, gap: 0.06, tag: "sch" });
    const L2 = STEPL[kind];
    if (L2 && Math.random() < (land ? 1 : L2[4])) shot(L2[0][(Math.random() * L2[0].length) | 0], { vol: L2[1] * (land ? 2 : 1) * Math.min(1.5, vol / 0.22), rate: L2[2] * rate, dur: L2[3] * (land ? 1.6 : 1), verb: 0.4, gap: 0.05, tag: "schL" });
  }
  KL.stats.schritte = {};
  if (A) A.hook = Object.assign(A.hook || {}, {
    step: o => { const k = KL.untergrund(); KL.stats.schritte[k] = (KL.stats.schritte[k] || 0) + 1; stepSound(k, o.vol != null ? o.vol : 0.22, o.rate || 1); return true; },
    stepWood: o => { const k = KL.untergrund(), k2 = k === "metall" ? "metall" : k === "nass" ? "nass" : "holz"; KL.stats.schritte[k2] = (KL.stats.schritte[k2] || 0) + 1; stepSound(k2, o.vol != null ? o.vol : 0.22, o.rate || 1); return true; },
    land: o => {
      const k = KL.untergrund(), h = clamp(o.vol != null ? o.vol : 0.5, 0.2, 1);
      KL.stats.schritte["land_" + k] = (KL.stats.schritte["land_" + k] || 0) + 1;
      stepSound(k, 0.3 + 0.45 * h, (o.rate || 1) * (1.02 - 0.22 * h), true);
      if (h > 0.45) shot(KS("fx_im_impactsoft_heavy_00" + [0, 1, 3][(Math.random() * 3) | 0]), { vol: 0.12 + 0.35 * (h - 0.45), rate: 0.8, verb: 0.3, gap: 0.08, tag: "aufprall" });
      if (k === "nass") shot(RA("n_platsch_", 10)[(Math.random() * 10) | 0], { vol: 0.15 + 0.3 * h, rate: 1.05 - 0.2 * h, verb: 0.4, gap: 0.08 });
      return true;
    }
  });
  /* Klettern an Leitern (im Sturm: Ranken) */
  const CL = { acc: 0, side: 0, offT: 9, stats: {} }; KL.leiter = CL;
  /* R20 Leiter (W16, kampf.js – nur beobachtet: P.climbing, P.vy, P.act): Greifen (Leder + Holzklopfen), Sprossen im Takt der Strecke
     (aufwärts heller als abwärts), Absprung (Abdruck-Knarzen + Luftzug), Fallenlassen (kurzes Rutschen), oben/unten Austreten (leiser Tritt),
     Angriff von der Leiter (die Sprosse ächzt unter dem Schwung). Ranken (Sturm) mit Laub statt Holz. */
  function climbTick(dt) {
    const P = Z.player; if (!P) return;
    const ranke = Z.level && Z.level.biome === "sturm", px = P.x + P.w / 2, py = P.y + P.h / 2;
    const holz = () => pk(ranke ? RA("n_laubschritt_", 9) : RA("n_holzschritte_", 24));
    if (P.climbing && !CL.on) { CL.on = true; CL.stats = CL.stats || {}; CL.stats.greifen = (CL.stats.greifen || 0) + 1;
      shot(pk(RA("g_leder_", 6)), { vol: 0.12, rate: 1.2, verb: 0.2, gap: 0.1, tag: "lgr1" }); shot(holz(), { vol: 0.12, rate: 1.5, verb: 0.3, gap: 0.1, tag: "lgr2", delay: 0.03 }); }
    else if (!P.climbing && CL.on) { CL.on = false; CL.offT = 0;
      if (P.vy < -60) { CL.stats.absprung = (CL.stats.absprung || 0) + 1; shot(pk(RA("g_knarren_", 5)), { vol: 0.08, rate: 1.3, verb: 0.3, gap: 0.2, tag: "lab" }); shot(holz(), { vol: 0.1, rate: 1.6, verb: 0.2, gap: 0.1, tag: "lab2" }); }
      else if (P.onGround) { CL.stats.austreten = (CL.stats.austreten || 0) + 1; shot(holz(), { vol: 0.08, rate: 1.1, verb: 0.2, gap: 0.1, tag: "lau" }); }
      else { CL.stats.loslassen = (CL.stats.loslassen || 0) + 1; shot(pk(RA("g_leder_", 6)), { vol: 0.08, rate: 0.9, verb: 0.2, gap: 0.1, tag: "llo" }); } }
    CL.offT = (CL.offT || 0) + dt;
    /* Angriff von der Leiter (oder gleich nach dem Absprung) */
    if (P.act && P.act !== CL.act && (P.climbing || CL.offT < 0.3)) { CL.stats.angriff = (CL.stats.angriff || 0) + 1; shot(pk(RA("g_knarren_", 5)), { vol: 0.1, rate: 1.1, verb: 0.3, gap: 0.2, tag: "lat" }); }
    CL.act = P.act;
    if (!P.climbing) { CL.last = P.y; return; }
    const dy = Math.abs(P.y - (CL.last == null ? P.y : CL.last)), up = P.y < (CL.last == null ? P.y : CL.last); CL.last = P.y; CL.acc += dy;
    if (CL.acc < 14) return; CL.acc = 0; CL.side = 1 - CL.side;
    const l = ranke ? RA("n_laubschritt_", 9) : RA("n_holzschritte_", 24);
    shot(l[(Math.random() * l.length) | 0], { vol: ranke ? 0.12 : 0.1, rate: (ranke ? 1.25 : 1.35) * (up ? 1.04 : 0.94), pan: CL.side ? 0.15 : -0.15, verb: 0.3, gap: 0.05, tag: "klettern" });
    if (!ranke && Math.random() < 0.3) shot(RA("g_knarren_", 5)[(Math.random() * 5) | 0], { vol: 0.05, rate: 1.4, verb: 0.3, gap: 0.3, tag: "kn" });
  }

  /* ---------- Übergänge: Torhaus, Schacht, Belohnungsnische ----------
     Torhaus (Gebietsausgang, lv.doors kind "exit"): Wind zieht durch das Tor (lauter, je näher), beim ersten Herantreten
     rasselt die Fallgitter-Kette und das Gitter knarrt. Schacht: offene, enge Säule unter Ezekiel (≥ 6 Kacheln tief,
     Wände links und rechts) oder Raum-Vorlage „…schacht“ → Luftzug von unten (dumpfer Wind, mit der Tiefe lauter).
     Belohnungsnische (Z.erkundung().rewards, ungeöffnet, nicht geheim): beim Näherkommen ein leiser Schrein-Klang aus
     Handglocken und Chor in der Tonart, alle 7–11 s wieder, solange man nah ist. Handheld: Wind ja (eine Schleife je Art),
     „minimal“: kein Wind, nur das Fallgitter. */
  const TR = { wind: null, zug: null, doors: new Set(), nT: 0, near: null, t: 0, zugF: 0, torF: 0, scanT: 0, stats: { tor: 0, schacht: 0, nische: 0 } };
  KL.uebergang = TR; KL.schacht = () => shaftDepth(); KL._schritt = (k, v, r, land) => stepSound(k, v, r || 1, land); /* Prüfhilfen */
  function windSlot(file, lp, hp) {
    const c = A.ctx, s = { g: c.createGain(), src: null, f: null, file };
    s.g.gain.value = 0;
    let last = s.g;
    if (lp) { s.f = c.createBiquadFilter(); s.f.type = "lowpass"; s.f.frequency.value = lp; s.f.Q.value = 0.7; s.f.connect(s.g); }
    s.g.connect(roomBus() || A.amb);
    A.load(AM(file)).then(b => { if (!b || s.dead) return; const src = c.createBufferSource(); src.buffer = b; src.loop = true; src.playbackRate.value = hp || 1; src.connect(s.f || s.g); src.start(0, Math.random() * Math.max(0, b.duration - 1)); s.src = src; s.norm = normOf(AM(file), -32); });
    return s;
  }
  function windLevel(slotKey, file, lp, rate, level) {
    let s = TR[slotKey];
    if (level > 0.01 && !s) s = TR[slotKey] = windSlot(file, lp, rate);
    if (!s) return;
    const now = A.ctx.currentTime; s.g.gain.setTargetAtTime(level * (s.norm || 1), now, level > 0.01 ? 0.6 : 1.2);
    if (level <= 0.01) { s.idle = (s.idle || 0) + 1; if (s.idle > 40) { s.dead = true; TR[slotKey] = null; setTimeout(() => { try { s.src && s.src.stop(); s.g.disconnect(); } catch (_) {} }, 4000); } }
    else s.idle = 0;
  }
  /* R14 Geheimnis-Hinweise (erkundung.js, W13 R10): Luftzug an unentdeckter Rissfläche – leises Pfeifen aus Rauschen durch einen
     schmalen Bandpass, gestimmt auf die Quinte der Tonart (drei Oktaven über dem Grundton), darunter ein weicher Lufthauch;
     hörbar ab ~7 Kacheln, lauter je näher, mit Böen; im Kampf leiser, im Lager/Arena/„minimal“ nie. Ort und Seite aus Z.geheimRisse(). */
  const RISS = { slot: null, f: 0, x: 0, scanT: 0, gT: 0, stats: { luftzug: 0, hohl: 0, ratte: 0 } };
  KL.riss = RISS;
  function rissSlot() {
    const c = A.ctx; if (!noiseB || noiseB.sampleRate !== c.sampleRate) mkNoise();
    if (!RISS.white || RISS.white.sampleRate !== c.sampleRate) { const wb = RISS.white = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = wb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = { src: c.createBufferSource(), srcW: c.createBufferSource(), bp: c.createBiquadFilter(), lp: c.createBiquadFilter(), gw: c.createGain(), ga: c.createGain(), g: c.createGain(), pn: c.createStereoPanner ? c.createStereoPanner() : null };
    s.src.buffer = noiseB; s.src.loop = true; s.srcW.buffer = RISS.white; s.srcW.loop = true;
    s.bp.type = "bandpass"; s.bp.Q.value = 16; s.lp.type = "bandpass"; s.lp.frequency.value = 520; s.lp.Q.value = 0.9;
    s.gw.gain.value = 1; s.ga.gain.value = 0.5; s.g.gain.value = 0;
    s.srcW.connect(s.bp); s.bp.connect(s.gw); s.gw.connect(s.g); s.src.connect(s.lp); s.lp.connect(s.ga); s.ga.connect(s.g);
    if (s.pn) { s.g.connect(s.pn); s.pn.connect(roomBus() || A.amb); } else s.g.connect(roomBus() || A.amb);
    s.src.start(0, Math.random() * 1.5); s.srcW.start(0, Math.random() * 1.5); return s;
  }
  function rissTick(dt, lv, P) {
    const now = A.ctx.currentTime;
    RISS.scanT -= dt;
    if (RISS.scanT <= 0) {
      RISS.scanT = gq().lean ? 0.5 : 0.25;
      let best = 1e9, bx = 0;
      if (!lv.hub && !lv.arena && Z.geheimRisse) {
        const px = P.x + P.w / 2, py = P.y + P.h / 2, T = Z.TILE || 16;
        for (const h of Z.geheimRisse()) for (const f of h.faces) { const d = Math.hypot(f.x * T + 8 + f.dx * 8 - px, (f.y * T + 8 - py) * 1.2) / T; if (d < best) { best = d; bx = f.x * T + 8; } }
      }
      const kampf = (M.tier || 0) >= 2 ? 0.35 : 1;
      RISS.f = best < 7 ? Math.pow(1 - best / 7, 1.4) * kampf : 0; RISS.x = bx; RISS.d = best;
      if (RISS.f > 0.02) RISS.stats.luftzug++;
    }
    let s = RISS.slot;
    if (RISS.f > 0.02 && !s) {
      s = RISS.slot = rissSlot();
      const hz = 440 * Math.pow(2, ((ton(4, (M.prof ? M.prof.root : 50)) + 36) - 69) / 12); s.hz = Math.min(2400, Math.max(900, hz));
      s.bp.frequency.value = s.hz;
    }
    if (!s) return;
    /* Böen: alle 1,2–3 s neues Ziel (60–100 %), Tonhöhe schwankt leicht mit */
    if ((RISS.gT -= dt) <= 0) { RISS.gT = 1.2 + Math.random() * 1.8; s.gust = 0.6 + Math.random() * 0.4; s.bp.frequency.setTargetAtTime(s.hz * (0.985 + s.gust * 0.025), now, 0.5); }
    const lvl = RISS.f * 0.16 * (s.gust || 0.8);
    s.g.gain.setTargetAtTime(lvl, now, RISS.f > 0.02 ? 0.5 : 0.8);
    if (s.pn) { const dx = RISS.x - (Z.cam ? Z.cam.x + Z.cam.w / 2 : P.x); s.pn.pan.setTargetAtTime(clamp(dx / 260, -0.7, 0.7), now, 0.3); }
    if (RISS.f <= 0.02) { s.idle = (s.idle || 0) + dt; if (s.idle > 6) { RISS.slot = null; const o = s; o.g.gain.setTargetAtTime(0, now, 0.2); setTimeout(() => { try { o.src.stop(); o.srcW.stop(); o.g.disconnect(); } catch (_) {} }, 1500); } }
    else s.idle = 0;
  }
  /* Klang-Hook aus erkundung.js: hohler „Tock“ bei Treffer an fester Wand neben dem Riss (Holzklopfen, tief, mit spätem
     dumpfem Nachhall aus dem Hohlraum), Ratte verschwindet im Riss (Fiepen + Rieseln) */
  Z.geheimKlang = (k, x, y) => {
    try {
      if (!A.ok || Z.quiet) return;
      if (k === "hohl") {
        RISS.stats.hohl++;
        wshot(pk([KS("fx_fo_wooden_02"), KS("fx_im_impactplank_medium_002")]), x, y, { vol: 0.7, rate: 0.62, verb: 0.15, gap: 0.05, tag: "hohl1" });
        wshot(KS("fx_fo_wooden_02"), x, y, { vol: 0.3, rate: 0.48, delay: 0.085, verb: 0.7, gap: 0.05, tag: "hohl2" });
        tone({ x: x - 4, y: y - 4, w: 8, h: 8 }, "timpt", ton(0, (M.prof ? M.prof.root : 50)) - 12, A.ctx.currentTime + 0.01, 0.12, 1, 0.5);
      } else if (k === "ratte") {
        RISS.stats.ratte++;
        A.play("rat", { vol: 0.22, x, rate: 1.15 });
        wshot(pk(RA("n_kies_", 8)), x, y, { vol: 0.1, rate: 1.4, delay: 0.12, verb: 0.3, gap: 0.1, tag: "ratk" });
      }
    } catch (_) {}
  };
  function shaftDepth() {
    const P = Z.player, lv = Z.level, T = Z.TILE || 16; if (!P || !lv || !lv.get) return 0;
    const tx = Math.floor((P.x + P.w / 2) / T), ty0 = Math.floor((P.y + P.h + 1) / T);
    const free = v => v === 0 || v === 4 || v === 10 || v === 12, solid = v => v === 1 || v === 7;
    let d = 0, narrow = 0;
    for (let k = 0; k < 22; k++) {
      const v = lv.get(tx, ty0 + k); if (!free(v)) break; d++;
      let l = 0, r = 0; for (let j = 1; j <= 4; j++) { if (!l && solid(lv.get(tx - j, ty0 + k))) l = 1; if (!r && solid(lv.get(tx + j, ty0 + k))) r = 1; }
      if (l && r) narrow++;
    }
    let f = d >= 6 && narrow >= d * 0.6 ? clamp((d - 5) / 10, 0.15, 1) : 0;
    const CW = Z.CW || 24, CH = Z.CH || 14, c = lv.cells && lv.cells[Math.floor(tx / CW) + "," + Math.floor(Math.floor((P.y + P.h / 2) / T) / CH)];
    if (c && c.tpl && /schacht/.test(c.tpl)) f = Math.max(f, d >= 3 ? 0.55 : 0.3);
    return f;
  }
  function shrine(r) {
    if (!M.note || !M.raster) return;
    const rs = M.raster(0.04), b = rs.beat, bus = roomBus();
    const notes = [0, 2, 4].concat(r.q >= 2 ? [7] : []);
    notes.forEach((d, i) => M.note("hglo", ton(d) + 36, rs.t + i * b, 0.04 - i * 0.004, b * 6, bus));
    M.note("ooh", ton(0) + 12, rs.t, 0.025, b * 10, bus); M.note("ooh", ton(4) + 12, rs.t + b * 0.5, 0.018, b * 10, bus);
    TR.stats.nische++;
  }
  function transitTick(dt) {
    const P = Z.player, lv = Z.level; if (!P || !lv || !net) return;
    const q = gq(), now = A.ctx.currentTime;
    /* Torhaus */
    let best = 1e9, bd = null;
    for (const d of lv.doors || []) {
      if (d.kind !== "exit") continue;
      const dx = d.x * 16 + 8 - (P.x + P.w / 2), dy = (d.y + 1) * 16 - (P.y + P.h), dist = Math.hypot(dx, dy * 1.4);
      if (dist < best) { best = dist; bd = d; }
    }
    const torF = bd && !lv.hub ? clamp(1 - best / 150, 0, 1) : 0;
    TR.torF = torF;
    if (bd && best < 110 && !TR.doors.has(bd)) {
      TR.doors.add(bd); TR.stats.tor++;
      const pan = clamp((bd.x * 16 + 8 - (P.x + P.w / 2)) / 200, -0.8, 0.8);
      shot(RA("n_kette_", 4)[(Math.random() * 4) | 0], { vol: 0.2, rate: 0.72, pan, verb: 0.6, gap: 0.5 });
      shot(RA("n_knarren_", 22)[(Math.random() * 22) | 0], { vol: 0.16, rate: 0.6, pan, delay: 0.35, verb: 0.6, gap: 0.5 });
      shot(RA("e_tor_", 4)[(Math.random() * 4) | 0], { vol: 0.08, rate: 0.8, pan, delay: 0.7, verb: 0.7, gap: 0.5, dur: 1.6 });
    }
    if (!q.mini) {
      windLevel("wind", "a_wind_n1", 2600, 1, torF * 0.7);
      TR.scanT -= dt; if (TR.scanT <= 0) { TR.scanT = q.lean ? 0.5 : 0.25; TR.zugF = lv.hub || lv.arena ? 0 : shaftDepth(); if (TR.zugF > 0.1) TR.stats.schacht++; }
      windLevel("zug", "a_heulwind", 700, 0.8, TR.zugF * 0.8);
      rissTick(dt, lv, P);
    }
    quTick(dt, lv, P);
    /* Belohnungsnischen */
    const S = Z.erkundung && Z.erkundung(); if (!S || !S.rewards || S.lv !== lv || q.mini || (M.tier || 0) >= 2) return;
    let near = null, nd = 1e9;
    for (const r of S.rewards) { if (r.open || r.secret) continue; const d = Math.hypot(r.x - (P.x + P.w / 2), (r.y - (P.y + P.h)) * 1.3); if (d < nd) { nd = d; near = r; } }
    if (near && nd < 110) {
      if (TR.near !== near) { TR.near = near; TR.nT = 0.2; }
      TR.nT -= dt; if (TR.nT <= 0) { TR.nT = rnd(7, 11); shrine(near); }
    } else TR.near = null;
  }

  /* Treffer: Schicht je Waffenart (aus dem Symbol der Waffe) und Element (Status-Wirkung), Krit mit hellem Ton in der
     Tonart, dumpfem Schlag und kurzem Zurücknehmen der Musik. Aufruf aus kampf.js (Z.hitEnemy). */
  const WART = { dagger: "klinge", rapier: "klinge", scimitar: "klinge", sickles: "klinge", scythe: "klinge", knives: "klinge", claw: "klinge",
    hammer: "wucht", club: "wucht", anchor: "wucht", stonefist: "wucht", fist: "wucht", axe: "axt", spear: "stich", staff: "wucht", whip: "peitsche",
    bow: "pfeil", arrows: "pfeil", xbow: "pfeil", bolt: "pfeil", shield: "schild", goldshield: "schild", thornshield: "schild" };
  const WSND = {
    klinge: [RK("fx_rd_blade_0", [1, 2, 3]), 0.16, 1.15, 0.25], wucht: [RK("fx_im_impactpunch_heavy_00", [0, 1, 2, 3]), 0.26, 0.75, 0.4],
    axt: [RK("fx_wn_", ["axt", "beil"]), 0.2, 1, 0.4], stich: [RK("fx_0_speer_", [1, 2, 3, 4]), 0.18, 1.05, 0.3], peitsche: [[AM("n_peitsche_1")], 0.16, 1.2, 0.3],
    pfeil: [RK("fx_0_pfeil_holz_", [1, 2, 3, 4]), 0.16, 1, 0.3], schild: [RK("fx_0_schild_metall_", [1, 2, 3]), 0.14, 0.9, 0.3]
  };
  const ESND = { burn: [GR.zisch, 0.14, 1.4, 0.35], poison: [GR.schleim, 0.14, 1.2, 0.3], stun: [GR.zap, 0.1, 1.6, 0.25], bleed: [RK("fx_0_fleisch_stich_", [1, 2, 3]), 0.12, 1.2, 0.3],
    root: [RK("fx_wn_", ["ranken", "dornen_1"]), 0.12, 1.2, 0.4], slow: [RA("n_eis_", 9), 0.12, 1.3, 0.3], frost: [RA("n_eis_", 9), 0.14, 1.2, 0.35] };
  KL.treffer = (e, o) => {
    try {
      if (!A.ok || !e || !o || o.dot || Z.quiet) return;
      if (o.src === "helfer") { HL.hitT = A.ctx.currentTime; HL.stats.treffer++; } /* R15: Helfer-Dolch statt „slash“ (Hook unten) */
      const [v0, pan] = posMix(e.x + e.w / 2, e.y + e.h / 2); if (v0 < 0.05) return;
      if (o.src === "helfer") { shot(pk(RK("fx_0_fleisch_stich_", [1, 2, 3])), { vol: 0.13 * v0, rate: 1.35, pan, verb: 0.3, gap: 0.05, tag: "hlf1" }); shot(pk(RK("fx_rd_blade_0", [1, 2, 3])), { vol: 0.08 * v0, rate: 1.6, pan, verb: 0.25, gap: 0.05, tag: "hlf2" }); return; }
      const wd = o.it && Z.WEAPONS && Z.WEAPONS[o.it.id], art = wd ? WART[wd.icon] : o.src === "ranged" ? "pfeil" : null;
      /* R13: Trefferdichte – bei Dauerfeuer (Wurfmesser, Mehrfachtreffer, 8–12 Treffer/s am Boss) werden die Schichten leiser
         (Faktor ~1/√(Rate/4), mindestens 0,45), Krit-Glocken höchstens alle 0,3 s voll, die Musik duckt höchstens alle 0,5 s */
      const now = A.ctx.currentTime, TD = KL.tdichte || (KL.tdichte = { r: 0, t: now, krit: -9, duck: -9 });
      TD.r = TD.r * Math.exp(-(now - TD.t) / 0.6) + 1; TD.t = now;
      const df = Math.max(0.45, Math.min(1, 1 / Math.sqrt(Math.max(1, TD.r * (1 / 0.6) / 4))));
      const pl = (l, opt) => shot(l[0][(Math.random() * l[0].length) | 0], Object.assign({ vol: l[1] * v0 * df, rate: l[2], pan, dur: l[3], verb: 0.35, gap: 0.04 }, opt));
      if (art && WSND[art]) pl(WSND[art], { tag: "wa" });
      if (o.eff) for (const k in o.eff) if (o.eff[k] && ESND[k]) { pl(ESND[k], { tag: "el" + k }); break; }
      if (o.crit) {
        const t = now + 0.005, voll = now - TD.krit >= 0.3;
        if (voll) { TD.krit = now; tone(e, "glock", ton(0) + 36, t, 0.22 * df, 1.2, 0.5); tone(e, "glock", ton(4) + 36, t + 0.05, 0.12 * df, 1.2, 0.5);
          shot(KS("fx_im_impactpunch_heavy_00" + [0, 1, 2][(Math.random() * 3) | 0]), { vol: 0.3 * v0 * df, rate: 0.7, pan, verb: 0.3, gap: 0.06, tag: "krit" }); }
        else tone(e, "glock", ton(4) + 36, t, 0.06, 0.8, 0.4);
        if (now - TD.duck >= 0.5) { TD.duck = now; M.duck && M.duck(0.18, 0.25); }
      }
      KL.stats.treffer = (KL.stats.treffer || 0) + 1;
    } catch (err) { if (!KL.err4) { KL.err4 = 1; console.error(err); } }
  };
  /* Gestimmter Geisterchor (Geistorgel in wunder.js): Akkordfolge i–VI–iv–i in der Tonart, Chorstimmen überlappend
     neu angeschlagen, solange das Wunder dauert (sec), über die Kulisse */
  KL.chor = (sec, vol) => {
    try {
      if (!A.ok || !M.note || !M.raster || gq().mini) return;
      const r = M.raster(0.05), b = r.beat, bus = roomBus(), v = vol || 0.04, prog = [0, 5, 3, 0], len = b * 8;
      const n = Math.max(1, Math.min(16, Math.round((sec || 16) / len)));
      for (let i = 0; i < n; i++) {
        const st = prog[Math.floor(i / 2) % 4], t = r.t + i * len, k = Math.min(1, (i + 1) / 2) * Math.min(1, (n - i) / 2);
        M.note("ooh", ton(st) + 12, t, v * k, len * 1.35, bus); M.note("aah", ton(st + 2) + 12, t + 0.03, v * 0.8 * k, len * 1.35, bus); M.note("ooh", ton(st + 4) + 12, t + 0.06, v * 0.7 * k, len * 1.35, bus);
      }
    } catch (_) {}
  };

  /* Funkeln für Wunder (wunder.js): n leise Töne in der Tonart der Musik, im Sechzehntelraster, über die Kulisse.
     o: inst (cel, harfe, glock …), okt (Halbtöne über dem Grundton), stufen ([Leiterstufen] zufällig oder "auf" = Arpeggio
     aufwärts), vol, len (Achtel), abstand (Sechzehntel). Höchstens alle 0,3 s; nicht auf „minimal“. */
  KL.funkeln = (n, o) => {
    try {
      o = o || {}; const q = gq();
      if (!A.ok || !M.note || !M.raster || q.mini || Z.quiet) return;
      const now = A.ctx.currentTime; if (now - (KL.funkT || 0) < 0.3) return; KL.funkT = now;
      const r = M.raster(0.03), b = r.beat, inst = o.inst || "cel", up = o.stufen === "auf", st = Array.isArray(o.stufen) ? o.stufen : [0, 2, 4, 7];
      for (let i = 0; i < (n || 1); i++) {
        const d = up ? [0, 2, 4, 7, 9, 11, 14][i % 7] : st[(Math.random() * st.length) | 0];
        M.note(inst, ton(d) + (o.okt != null ? o.okt : 36), r.t + i * b * 0.5 * (o.abstand || 1), (o.vol || 0.04) * (1 - i * 0.06), b * (o.len || 3), roomBus() || undefined);
      }
    } catch (e) { /* still */ }
  };
  /* Prüfstand (test/w12_klang): Klangnetz für einen neuen AudioContext neu aufbauen */
  KL._reset = () => { LATER.length = 0; RISS.slot = null; TR.wind = TR.zug = TR.quelle = null; TR.doors = new Set(); net = null; RM.bus = null; RM.slot = null; RM.cur = RM.pend = null; RM.force = null; W.lv = null; DR.upTo = -1e9; DR.until = 0; KV.lastIdle = 0; };
  KL._alle = () => { const l = []; for (const g in GR) l.push(...GR[g]); for (const id in RK2) { const d = RK2[id]; if (d.loop) l.push(AM(d.loop[0])); for (const o of d.one || []) for (let i = 1; i <= o[1]; i++) l.push(AM(o[0] + i)); } return l; };
  KL.raumJetzt = () => ({ raum: RM.cur, groesse: KL.raumGroesse || 1, hall: KL.R, loop: RM.slot && RM.slot.name });
  /* Prüfhilfe: Raum erzwingen (ohne Kachelposition) */
  KL.raumTest = (id) => { setRoom(id, null); RM.pend = id; RM.pendT = 0; RM.force = id; };

  /* ---------- Beobachter ---------- */

  /* ======================= SONDERRÄUME UND ZERSTÖRUNG (W13) =======================
     Beobachtet die Daten aus welt.js/erkundung.js (lv.specials, Z._kraene(), lv.gates, lv.wuchtSet, lv.morsch) – keine Aufrufe in fremden Dateien nötig:
       Kran       – Kette rasselt und Holz knarzt während der Fahrt, Ruck beim Anfahren, Anschlag oben (hell, Holz) und unten (dumpf, schwer)
       Flutkammer – Wasser rauscht, solange die Kammer voll ist; Hebel → Ablaufen: Gurgeln, Strudel schwillt an und versiegt;
                    wer hineinfällt („Zu tief“), platscht laut (Z.flutSicher wird dazu umhüllt)
       Brücke     – Wind pfeift im Spalt (Schleife nach Abstand), gelegentlich bröckelt es
       Wucht-Riss – leichter Treffer: Knirschen im Stein; Wuchtschlag/Explosion: Einsturz mit Steinlawine, Splittern und Staubrauschen
                    (Z.hitProps wird beim ersten Takt als äußerste Hülle umwickelt)
       Morscher Boden – Bersten: splitterndes Holz, Poltern der Bohlen, Staub */
  const SR = { lv: null, kr: [], flut: [], br: [], wT: 4, splT: 0, hooked: false, morsch: null, stats: { kran: 0, anschlag: 0, flutAb: 0, platsch: 0, broeckeln: 0, knirschen: 0, einsturz: 0, bersten: 0 } };
  KL.sonder = SR;
  function wshot(path, x, y, o) {
    const [v, pan] = posMix(x, y, o && o.far); if (v < 0.03) return null;
    return shot(path, Object.assign({}, o, { vol: (o && o.vol != null ? o.vol : 0.3) * v, pan }));
  }
  const pk = l => l[(Math.random() * l.length) | 0];
  const SRS = {
    kette: RA("n_kette_", 4).concat(RA("g_kette_", 3)), knarz: RA("n_knarren_", 22), ruck: [KS("fx_ka_creak2")].concat(RA("e_riemen_", 2)),
    obenH: [KS("fx_im_impactplank_medium_002"), KS("fx_fo_wooden_02")], untenH: [KS("fx_im_impactplate_heavy_001"), KS("fx_im_impactmetal_heavy_000")],
    blubb: RA("e_blubb_", 4).concat(RA("n_blubb_", 3)), platsch: RA("n_platsch_", 10).concat(RA("e_platsch_", 4)),
    kies: RA("n_kies_", 8), steinschlag: RA("g_steinschlag_", 4).concat(RA("n_steinschlag_", 5)), knirsch: RK("fx_0_stein_treffer_", [1, 2, 3, 4]),
    bruch: [KS("fx_br_bfh1_rock_breaking_01"), KS("fx_br_bfh1_rock_breaking_02")], lawine: [KS("fx_br_bfh1_rock_falling_04")],
    holz: RA("g_holzbruch_", 7).concat(RA("n_holzbruch_", 3)), poltern: RA("e_holzpoltern_", 7), planke: [KS("fx_im_impactplank_medium_002")]
  };
  /* Staubwolke: gefiltertes Rauschen, das aufbraust und mit sinkendem Tiefpass verweht (ein Puffer, je Einsatz zwei Knoten + Filter) */
  let noiseB = null;
  function mkNoise() { const c = A.ctx; noiseB = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noiseB.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { b = b * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = b * 6; } }
  function dustNoise(x, y, vol, len) {
    const [v, pan] = posMix(x, y, 1.2); if (v < 0.03 || !A.ok) return;
    const c = A.ctx; if (!noiseB || noiseB.sampleRate !== c.sampleRate) mkNoise();
    const t = c.currentTime + 0.02, L = len || 1.6, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), pn = c.createStereoPanner ? c.createStereoPanner() : null;
    s.buffer = noiseB; s.loop = true; f.type = "lowpass"; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(260, t + L);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.08); g.gain.setTargetAtTime(0, t + 0.25, L / 3.5);
    s.connect(f); f.connect(g); if (pn) { pn.pan.value = pan; g.connect(pn); pn.connect(A.sfx); } else g.connect(A.sfx);
    s.start(t); s.stop(t + L + 0.6); s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); pn && pn.disconnect(); } catch (_) {} };
  }
  function sonderLevel(lv) {
    SR.lv = lv; SR.kr = []; SR.flut = []; SR.br = []; SR.morsch = (lv.morsch || []).map(m => !!m.broken);
    A.stopLoop && A.stopLoop("sr_flut", 0.5); A.stopLoop && A.stopLoop("sr_wind", 0.5); SR.flutV = SR.windV = 0; SR.flutCur = null; SR.windOn = false;
    const T = Z.TILE;
    for (const o of lv.specials || []) {
      if (o.k === "flut") { const g = (lv.gates || [])[o.gate]; SR.flut.push({ o, g, x: (o.x0 + o.x1 + 1) / 2 * T, y: (o.top + 2) * T, open: !!(g && g.open), drainT: 0 }); }
      if (o.k === "bruecke") SR.br.push({ x: o.x * T + T, y: o.y0 * T + 1.5 * T, t: 4 + Math.random() * 8 });
    }
    const l = [];
    if ((lv.specials || []).length) l.push(...SRS.kette, ...SRS.knarz.slice(0, 8), ...SRS.ruck, ...SRS.obenH, ...SRS.untenH, ...SRS.blubb, ...SRS.platsch.slice(0, 6), ...SRS.kies, ...SRS.steinschlag, AM("a_bach_n1"), AM("a_wildwasser"), AM("a_ruinenwind"), AM("a_heulwind"));
    if ((lv.wucht || []).length) l.push(...SRS.knirsch, ...SRS.bruch, ...SRS.lawine, ...SRS.steinschlag, ...SRS.kies);
    if ((lv.morsch || []).length) l.push(...SRS.holz, ...SRS.poltern, ...SRS.planke);
    l.push(AM("a_klangschale"), AM("e_windstoss_1"), KS("gong"));
    { const ts = new Set(); for (const k in lv.cells || {}) { const t = tplBase(lv.cells[k].tpl); if (TPLK[t]) ts.add(t); } for (const t of ts) l.push(AM(TPLK[t].loop)); if (ts.size) l.push(...SRS.poltern, ...SRS.kette, ...SRS.knarz.slice(0, 8), ...SRS.ruck, ...SRS.planke, AM("e_glocke_1"), AM("e_glocke_2"), AM("e_glocke_3"));
      if ((lv.rollers || []).length || (lv.swings || []).length || (lv.tides || []).length) l.push(...BWS.swing, ...BWS.kerze.slice(0, 8), AM("a_wellen2"), ...SRS.blubb, ...SRS.holz);
      if (ts.has("zisterne")) for (let i = 1; i <= 23; i++) l.push(AM("n_tropfen_" + i)); if (ts.has("uhrwerk")) l.push(KS("clave1"), KS("clave2"));
      for (const [inst, o] of [["cel", 3], ["glock", 3], ["rgl", 1]]) for (const st of [0, 2, 4, 7]) { const pr = taktTon(inst, st, o); if (pr) l.push(pr.path); } }
    preload(l);
  }
  function hookOnce() {
    if (SR.hooked) return; SR.hooked = true;
    /* „Zu tief“: wer in die volle Flutkammer fällt */
    const fs0 = Z.flutSicher;
    if (fs0) Z.flutSicher = function (P) {
      const r = fs0.apply(this, arguments);
      try { if (r && A.ok && A.ctx.currentTime - SR.splT > 0.8) { SR.splT = A.ctx.currentTime; SR.stats.platsch++; const x = P.x + P.w / 2, y = P.y + P.h;
        wshot(pk(SRS.platsch), x, y, { vol: 0.55, rate: 0.75, verb: 0.5, gap: 0 }); wshot(pk(SRS.platsch), x, y, { vol: 0.35, rate: 1.1, delay: 0.09, gap: 0, tag: "p2" });
        for (let i = 0; i < 3; i++) wshot(pk(SRS.blubb), x, y, { vol: 0.16, rate: 0.8 + Math.random() * 0.4, delay: 0.3 + i * 0.22, gap: 0, tag: "pb" + i }); } } catch (_) {}
      return r;
    };
    /* Wucht-Risse: Knirschen bei leichtem Treffer, Einsturz beim Brechen */
    const hp0 = Z.hitProps;
    Z.hitProps = function (r, dmg, act) {
      const lv = Z.level, T = Z.TILE; let before = null;
      if (r && lv && lv.wuchtSet && lv.wuchtSet.size) {
        before = [];
        for (let ty = Math.floor(r.y / T); ty <= Math.floor((r.y + r.h) / T); ty++) for (let tx = Math.floor(r.x / T); tx <= Math.floor((r.x + r.w) / T); tx++) if (lv.wuchtSet.has(ty * lv.W + tx) && lv.get(tx, ty) === 7) before.push([tx, ty]);
      }
      const res = hp0 ? hp0.apply(this, arguments) : undefined;
      if (before && before.length) try { crackSound(lv, before); } catch (_) {}
      return res;
    };
  }
  function crackSound(lv, tiles) {
    const T = Z.TILE, gone = tiles.filter(([x, y]) => lv.get(x, y) !== 7 || !lv.wuchtSet.has(y * lv.W + x));
    let sx = 0, sy = 0; for (const [x, y] of (gone.length ? gone : tiles)) { sx += x; sy += y; } const n = gone.length || tiles.length, x = (sx / n + 0.5) * T, y = (sy / n + 0.5) * T;
    if (!gone.length) { /* Riss-Knirschen: Stein knirscht, ein paar Krümel rieseln */
      if (A.ctx.currentTime - (SR.knT || 0) < 0.12) return; SR.knT = A.ctx.currentTime; SR.stats.knirschen++;
      wshot(pk(SRS.knirsch), x, y, { vol: 0.32, rate: 0.62 + Math.random() * 0.12, gap: 0, tag: "kn" });
      wshot(pk(SRS.kies), x, y, { vol: 0.12, rate: 1.2, delay: 0.08, gap: 0, tag: "knk" });
      return;
    }
    /* Einsturz: Bruch, Lawine, nachpolternde Brocken, Staubrauschen – größer bei mehr Kacheln */
    if (A.ctx.currentTime - (SR.esT || 0) < 0.25) return; SR.esT = A.ctx.currentTime; SR.stats.einsturz++;
    const k = clamp(gone.length / 6, 0.5, 1.4) * 0.75; /* R9 Mischung: Einsturz lag 4–7 dB über der Ruhe davor */
    wshot(pk(SRS.bruch), x, y, { vol: 0.55 * k, rate: 0.85, verb: 0.55, gap: 0, tag: "es" });
    wshot(pk(SRS.lawine), x, y, { vol: 0.45 * k, rate: 0.9, delay: 0.12, gap: 0, tag: "esl" });
    const nB = Math.round(2 + 3 * k); for (let i = 0; i < nB; i++) wshot(pk(SRS.steinschlag), x + (Math.random() - 0.5) * 30, y, { vol: (0.3 - i * 0.04) * k, rate: 0.8 + Math.random() * 0.4, delay: 0.25 + i * (0.12 + Math.random() * 0.12), gap: 0, tag: "esb" + i });
    for (let i = 0; i < 3; i++) wshot(pk(SRS.kies), x, y, { vol: 0.14, rate: 1 + Math.random() * 0.3, delay: 0.7 + i * 0.35, gap: 0, tag: "esk" + i });
    dustNoise(x, y, 0.14 * k, 1.8);
  }
  function sonderTick(dt) {
    const lv = Z.level; if (!lv) return;
    if (lv !== SR.lv) sonderLevel(lv);
    hookOnce();
    const cam = Z.cam; if (!cam) return;
    const cx = cam.x + cam.w / 2, cy = cam.y + cam.h / 2;
    /* --- Kräne --- */
    for (const m of (Z._kraene ? Z._kraene() : [])) {
      const st = m._kl || (m._kl = { mv: !(m.pause > 0), t: 0 }), mv = !(m.pause > 0), x = m.x + m.w / 2, y = m.y;
      if (Math.abs(x - cx) > cam.w * 1.3 || Math.abs(y - cy) > cam.h * 1.5) { st.mv = mv; continue; }
      if (mv && !st.mv) { SR.stats.kran++; wshot(pk(SRS.ruck), x, y - 30, { vol: 0.28, rate: 0.8, gap: 0, tag: "kr" }); wshot(pk(SRS.kette), x, y - 40, { vol: 0.3, rate: 0.85, gap: 0, tag: "krk" }); }
      if (!mv && st.mv) { SR.stats.anschlag++; const oben = Math.abs(m.y - m.y0) < Math.abs(m.y - m.y1);
        wshot(pk(oben ? SRS.obenH : SRS.untenH), x, y, { vol: oben ? 0.34 : 0.5, rate: oben ? 1.05 : 0.7, verb: 0.45, gap: 0, tag: "ka" });
        wshot(pk(SRS.kette), x, y - 40, { vol: 0.22, rate: 1.1, delay: 0.06, gap: 0, tag: "kak" }); if (!oben) dustNoise(x, y, 0.05, 0.9); }
      if (mv) { st.t -= dt; if (st.t <= 0) { st.t = 0.3 + Math.random() * 0.18; wshot(pk(SRS.kette), x, y - 40, { vol: 0.1 + Math.random() * 0.05, rate: (m.dir < 0 ? 1.05 : 0.9) + Math.random() * 0.1, gap: 0, tag: "km", verb: 0.3 });
        if (Math.random() < 0.22) wshot(pk(SRS.knarz), x, y - 20, { vol: 0.11, rate: 0.8 + Math.random() * 0.3, gap: 0, tag: "kz" }); } }
      st.mv = mv;
    }
    /* --- Flutkammern --- */
    let fV = 0, fX = 0, fY = 0;
    for (const f of SR.flut) {
      const open = !!(f.g && f.g.open);
      if (open && !f.open) { /* Hebel gezogen: Gurgeln, Strudel schwillt an und versiegt */
        SR.stats.flutAb++; f.drainT = 4.5;
        for (let i = 0; i < 7; i++) wshot(pk(SRS.blubb), f.x + (Math.random() - 0.5) * 50, f.y + 20, { vol: 0.26 - i * 0.02, rate: 0.55 + Math.random() * 0.35, delay: 0.2 + i * 0.45 + Math.random() * 0.2, gap: 0, tag: "fb" + i, far: 1.4 });
      }
      f.open = open;
      if (f.drainT > 0) { f.drainT -= dt; }
      const [v] = posMix(f.x, f.y, 1.3);
      const want = f.drainT > 0 ? 0.5 * Math.min(1, (4.5 - f.drainT) / 0.8) * Math.min(1, f.drainT / 2.2) : open ? 0 : 0.2;
      if (want * v > fV) { fV = want * v; fX = f.x; fY = f.y; SR.flutPath = f.drainT > 0 ? AM("a_wildwasser") : AM("a_bach_n1"); }
    }
    if (A.loop && (fV > 0.01 || SR.flutV > 0.01)) {
      if (fV > 0.01 && SR.flutCur !== SR.flutPath) { SR.flutCur = SR.flutPath; A.loop("sr_flut", SR.flutPath, 0); }
      SR.flutV = fV; A.loopVol("sr_flut", fV * (normOf(SR.flutPath, -32) || 0.5), 0.4);
    }
    /* --- Brücken: Wind im Spalt (nächste Brücke), gelegentliches Bröckeln --- */
    let wV = 0;
    for (const b of SR.br) {
      const [v] = posMix(b.x, b.y, 1.1); wV = Math.max(wV, v);
      b.t -= dt; if (b.t <= 0) { b.t = 6 + Math.random() * 9; if (v > 0.15) { SR.stats.broeckeln++; wshot(pk(SRS.steinschlag), b.x, b.y, { vol: 0.13, rate: 1.1 + Math.random() * 0.3, gap: 0, tag: "bb" }); for (let i = 0; i < 2; i++) wshot(pk(SRS.kies), b.x, b.y + 10, { vol: 0.08, rate: 1.2, delay: 0.15 + i * 0.3, gap: 0, tag: "bk" + i }); } }
    }
    if (A.loop && (wV > 0.01 || SR.windV > 0.01)) {
      const path = AM("a_ruinenwind"); if (wV > 0.01 && !SR.windOn) { SR.windOn = true; A.loop("sr_wind", path, 0); }
      SR.windV = wV; A.loopVol("sr_wind", wV * 0.6 * (normOf(path, -32) || 0.5), 0.6);
    }
    /* --- morsche Böden: Bersten --- */
    const ms = lv.morsch || [];
    if (SR.morsch) for (let i = 0; i < ms.length; i++) if (ms[i].broken && !SR.morsch[i]) {
      SR.morsch[i] = true; SR.stats.bersten++; const T = Z.TILE, m = ms[i], x = (m.x0 + m.x1 + 1) / 2 * T, y = m.y * T;
      wshot(pk(SRS.holz), x, y, { vol: 0.55, rate: 0.85, gap: 0, tag: "mb" }); wshot(pk(SRS.holz), x + 10, y, { vol: 0.4, rate: 1.1, delay: 0.07, gap: 0, tag: "mb2" });
      wshot(pk(SRS.planke), x, y, { vol: 0.4, rate: 0.7, delay: 0.03, gap: 0, tag: "mp" });
      for (let k = 0; k < 4; k++) wshot(pk(SRS.poltern), x + (Math.random() - 0.5) * 40, y + 30, { vol: 0.25 - k * 0.04, rate: 0.85 + Math.random() * 0.3, delay: 0.3 + k * 0.18 + Math.random() * 0.1, gap: 0, tag: "mpo" + k });
      dustNoise(x, y, 0.07, 1.2);
    }
  }
  /* ======================= GEBIETSVORLAGEN (W13 R6, welt.js: lv.cells[k].tpl) =======================
     Raumklang je Vorlage, solange Ezekiel in der Zelle steht (Schleife, weich überblendet) plus seltene Einzelgeräusche;
     die Fähren-Plattformen („m“) dieser Räume klingen nach ihrer Rolle:
       fasslager    – Tropfen und Kellerluft; die Plattformen rumpeln wie rollende Fässer, dumpfer Anschlag an der Wende
       foerderband  – Mühlwerk als Grundrauschen; die Plattformen klappern im Takt (Kettenglieder), Ruck an der Wende
       glockenstuhl – Wind im Turm, Balken knarzen, ganz selten summt eine Glocke leise mit
       stelzensteg  – Wellen unter den Bohlen, Pfähle knarren */
  const TPLK = {
    fasslager: { loop: "a_tropfstein", v: 0.45, one: () => pk(SRS.poltern), ov: 0.08, orate: 0.6, every: 7, mv: "fass" },
    foerderband: { loop: "a_muehle", v: 0.5, one: () => pk(SRS.kette), ov: 0.07, orate: 0.7, every: 5, mv: "band" },
    glockenstuhl: { loop: "a_ruinenwind", v: 0.32, one: () => Math.random() < 0.2 ? AM("e_glocke_" + (1 + ((Math.random() * 3) | 0))) : pk(SRS.knarz), ov: 0.06, orate: 0.8, every: 6 },
    stelzensteg: { loop: "a_wellen1", v: 0.42, one: () => pk(SRS.knarz), ov: 0.07, orate: 1.1, every: 6 },
    /* v=72: Zisterne (Tropfen, jeder vierte als leiser Celesta-Ton in der Tonart), Uhrwerk (Ticken im Takt der Musik) */
    zisterne: { loop: "a_tropfstein_n1", v: 0.4, one: () => AM("n_tropfen_" + (1 + ((Math.random() * 23) | 0))), ov: 0.09, orate: 1, every: 1.4, ton: "cel" },
    uhrwerk: { loop: "a_muehle", v: 0.18, one: () => pk(SRS.kette), ov: 0.05, orate: 1.8, every: 7, takt: "uhr" }
  };
  /* Takt-Ereignisse je Vorlage (auf dem Achtelraster der Musik, M.raster): Uhrwerk tickt auf den Vierteln (Tick/Tack), schlägt
     alle zwei Takte eine Glocke in der Tonart; Förderband rattert in Achteln (betont auf den Vierteln), solange eine Plattform fährt;
     Glockenstuhl läutet ab und zu auf der Eins eine Röhrenglocke auf Grundton oder Quinte */
  TPLK.foerderband.takt = "band"; TPLK.glockenstuhl.takt = "glocke";
  function taktTon(inst, stufe, okt) { const p = M.prof; return M.probe && M.probe(inst, M.ton(stufe, (p ? p.root : 50) + 12 * okt)); }
  function taktTick(d, bandOn) {
    const r = M.raster && M.raster(0.12); if (!r) return;
    /* nach Zeit fortschreiben (monoton, nie ein Schritt doppelt); Schrittnummer für Betonungen aus dem Raster */
    const b = r.beat;
    if (TV.lastT == null || r.t - TV.lastT > 4 * b || TV.lastT - r.t > 8 * b) TV.lastT = r.t - b;
    while (TV.lastT + b * 0.5 < r.t) {
      TV.lastT += b; const st = r.step - Math.round((r.t - TV.lastT) / b), dl = Math.max(0, TV.lastT - A.ctx.currentTime);
      if (d.takt === "uhr" && st % 2 === 0) { shot(KS(st % 4 ? "clave2" : "clave1"), { vol: 0.075, rate: st % 4 ? 1.9 : 2.4, pan: st % 4 ? 0.25 : -0.25, delay: dl, vary: 0, verb: 0.3, gap: 0, tag: "uhr" }); TV.stats.tick = (TV.stats.tick || 0) + 1; }
      if (d.takt === "uhr" && st % 16 === 0) { const pr = taktTon("glock", 0, 3); if (pr) shot(pr.path, { vol: 0.05, rate: pr.rate, delay: dl, vary: 0, verb: 0.7, gap: 0, tag: "uhrg" }); }
      if (d.takt === "band" && bandOn) { shot(pk(SRS.kette), { vol: st % 2 ? 0.035 : 0.06, rate: (st % 2 ? 1.9 : 1.55) + Math.random() * 0.1, pan: rnd(-0.3, 0.3), delay: dl, vary: 0, verb: 0.25, gap: 0, tag: "band" + (st % 2) }); TV.stats.band++; }
      if (d.takt === "glocke" && st % 8 === 0 && TV.lastT - (TV.ringT == null ? -1e9 : TV.ringT) >= 24 * b && Math.random() < 0.3) { TV.ringT = TV.lastT; const pr = taktTon("rgl", Math.random() < 0.5 ? 0 : 4, 1); if (pr) { shot(pr.path, { vol: 0.06, rate: pr.rate, delay: dl, vary: 0, verb: 0.8, pan: rnd(-0.4, 0.4), gap: 0, tag: "gst" }); TV.stats.laeuten = (TV.stats.laeuten || 0) + 1; } }
    }
  }
  const tplBase = t => (t ? t.replace(/_(o|u|ou)$/, "") : t);
  const TV = { cur: null, v: 0, t: 3, stats: { raum: {}, fass: 0, band: 0 } };
  KL.vorlagen = TV;
  function tplAt(x, y) { const lv = Z.level, T = Z.TILE, CW = Z.CW || 24, CH = Z.CH || 14; const c = lv && lv.cells && lv.cells[Math.floor(x / T / CW) + "," + Math.floor(y / T / CH)]; return c ? tplBase(c.tpl) : null; }
  function tplTick(dt) {
    const P = Z.player, lv = Z.level; if (!P || !lv || !lv.cells) return;
    const id = tplAt(P.x + P.w / 2, P.y + P.h / 2), d = TPLK[id];
    if (d && TV.cur !== id) { TV.cur = id; A.loop("rv_tpl", AM(d.loop), 0); TV.stats.raum[id] = (TV.stats.raum[id] || 0) + 1; }
    const want = d ? d.v : 0;
    if (TV.cur && (want > 0 || TV.v > 0)) { TV.v = want; A.loopVol("rv_tpl", want * (normOf(AM(TPLK[TV.cur].loop), -32) || 0.5), want ? 1.2 : 0.8); if (!want) TV.cur = null; }
    if (d) { TV.t -= dt; if (TV.t <= 0) { TV.t = d.every * rnd(0.6, 1.5); shot(d.one(), { vol: d.ov, rate: d.orate * rnd(0.9, 1.1), pan: rnd(-0.7, 0.7), verb: 0.5, gap: d.ton ? 0 : 0.3, tag: "tpl" });
      if (d.ton && Math.random() < 0.25) { const pr = taktTon(d.ton, [0, 2, 4, 7][(Math.random() * 4) | 0], 3); if (pr) shot(pr.path, { vol: 0.035, rate: pr.rate, vary: 0, verb: 0.85, pan: rnd(-0.6, 0.6), delay: 0.02, gap: 0, tag: "zton" }); } } }
    let bandOn = false;
    for (const m of Z.parcoursMovers || []) if (!(m.pause > 0) && onCam(m.x, m.y, 40) && (m._tpl === undefined ? (m._tpl = tplAt(m.x + m.w / 2, m.y - 4)) : m._tpl) === "foerderband") bandOn = true;
    if (d && d.takt) taktTick(d, bandOn);
    /* Plattformen */
    for (const m of Z.parcoursMovers || []) {
      const x = m.x + m.w / 2, y = m.y; if (!onCam(x, y, 80)) continue;
      const k = TPLK[m._tpl === undefined ? (m._tpl = tplAt(x, y - 4)) : m._tpl]; if (!k || !k.mv) continue;
      const s0 = m._kv || (m._kv = { t: 0, mv: !(m.pause > 0) }), mv = !(m.pause > 0);
      if (!mv && s0.mv) wshot(k.mv === "fass" ? SRS.planke[0] : pk(SRS.ruck), x, y, { vol: k.mv === "fass" ? 0.22 : 0.16, rate: k.mv === "fass" ? 0.6 : 0.9, gap: 0, tag: "mvw" });
      if (mv) { s0.t -= dt; if (s0.t <= 0) {
        if (k.mv === "band") { s0.t = 1; } /* Rattern im Takt: taktTick */
        else { s0.t = 0.38 + Math.random() * 0.2; TV.stats.fass++; wshot(pk(SRS.poltern), x, y, { vol: 0.07, rate: 0.5 + Math.random() * 0.15, gap: 0, tag: "mvf", verb: 0.3 }); } } }
      s0.mv = mv;
    }
  }

  /* ======================= BEWEGLICHES (W13 R7, erkundung.js: S.rollers, S.swings, S.tides) =======================
     Fass-Rutsche: 0,9 s Vorwarnung (Balken knarzt, Rumpeln schwillt in drei Stößen an), Fass fällt heraus (dumpfer Holzschlag),
       rollt mit Dopplertönung (heller, wenn es auf die Bildmitte zurollt, dunkler, wenn es sich entfernt) und zerbricht am Ende.
     Kronleuchter: Kette klirrt an den Umkehrpunkten, Luftzug („Whoosh“) beim Durchschwingen nach Geschwindigkeit, Kerzen knistern
       leise und flackern hörbar stärker, je schneller er schwingt.
     Gezeiten: Wasser als Schleife, deren Pegel dem Wasserstand folgt (anschwellend beim Steigen, abklingend beim Fallen),
       Blasen vor dem Steigen, Gurgeln beim Ablaufen. */
  const BW = { stats: { warn: 0, fass: 0, roll: 0, prall: 0, kette: 0, whoosh: 0, kerze: 0, gezeit: 0 }, tideV: 0, tideOn: false };
  KL.beweglich = BW;
  const BWS = { swing: [KS("fx_rp_swing"), KS("fx_rp_swing2")], kerze: RA("n_feuerknistern_", 18) };
  function bewegTick(dt) {
    const S = Z.erkundung && Z.erkundung(); if (!S || S.lv !== Z.level) return;
    const cam = Z.cam, cx = cam ? cam.x + cam.w / 2 : 0;
    /* --- Fässer --- */
    for (const ro of S.rollers || []) {
      const k = ro._kl || (ro._kl = { warn: false, seen: new Map(), t: 0 });
      if (ro.warn && !k.warn) { BW.stats.warn++; wshot(pk(SRS.knarz), ro.x, ro.y - 10, { vol: 0.16, rate: 0.75, gap: 0, tag: "rw" });
        for (let i = 0; i < 3; i++) wshot(pk(SRS.poltern), ro.x, ro.y - 10, { vol: 0.08 + i * 0.05, rate: 0.5 + i * 0.05, delay: 0.1 + i * 0.25, gap: 0, tag: "rwp" + i }); }
      k.warn = ro.warn;
      const now = new Set(ro.barrels);
      for (const b of ro.barrels) if (!k.seen.has(b)) { BW.stats.fass++; wshot(SRS.planke[0], b.x, b.y, { vol: 0.3, rate: 0.6, gap: 0, tag: "rf" }); k.seen.set(b, { t: 0.15, x: b.x, y: b.y }); }
      for (const [b, st] of k.seen) {
        if (!now.has(b)) { k.seen.delete(b); if (onCam(st.x, st.y, 60)) { BW.stats.prall++; wshot(pk(SRS.holz), st.x, st.y, { vol: 0.32, rate: 0.75, gap: 0, tag: "rp" }); wshot(pk(SRS.poltern), st.x, st.y, { vol: 0.2, rate: 0.6, delay: 0.08, gap: 0, tag: "rp2" }); } continue; }
        st.x = b.x; st.y = b.y; st.t -= dt;
        if (st.t <= 0 && onCam(b.x, b.y, 80) && b.vy === 0) {
          st.t = 0.2 + Math.random() * 0.06; BW.stats.roll++;
          const toward = Math.sign(cx - b.x) === Math.sign(b.vx), dop = toward ? 1.14 : 0.88; /* Dopplertönung */
          wshot(pk(SRS.poltern), b.x, b.y, { vol: 0.1, rate: 0.55 * dop + Math.random() * 0.05, gap: 0, tag: "rr", verb: 0.25 });
        }
      }
    }
    /* --- Kronleuchter --- */
    for (const s2 of S.swings || []) {
      const hx = s2.ax + Math.sin(s2.th) * s2.L, hy = s2.ay + Math.cos(s2.th) * s2.L; if (!onCam(hx, hy, 60)) { s2._kl = null; continue; }
      const k = s2._kl || (s2._kl = { om: s2.om, th: s2.th, kt: 1 }), sp = Math.abs(s2.om);
      if (Math.sign(s2.om) !== Math.sign(k.om) && Math.abs(k.om) > 0.25) { BW.stats.kette++; wshot(pk(SRS.kette), s2.ax, s2.ay + 10, { vol: 0.08 + Math.min(0.1, Math.abs(s2.th) * 0.1), rate: 1.25 + Math.random() * 0.15, gap: 0, tag: "kk" }); }
      if (Math.sign(s2.th) !== Math.sign(k.th) && sp > 1.2) { BW.stats.whoosh++; wshot(pk(BWS.swing), hx, hy, { vol: Math.min(0.32, 0.08 + sp * 0.06), rate: 0.7 + Math.min(0.4, sp * 0.08), gap: 0, tag: "kw", verb: 0.4 }); }
      k.kt -= dt * (1 + sp * 0.8);
      if (k.kt <= 0) { k.kt = 1.2 + Math.random() * 1.6; BW.stats.kerze++; wshot(pk(BWS.kerze), hx, hy, { vol: 0.05 + Math.min(0.08, sp * 0.03), rate: 1.2 + sp * 0.1, gap: 0, tag: "kz2", verb: 0.3 }); }
      k.om = s2.om; k.th = s2.th;
    }
    /* --- Gezeiten (nächste Kammer im Bild) --- */
    let tv = 0, tx = 0, ty = 0;
    const T = Z.TILE, CW = Z.CW || 24, CH = Z.CH || 14;
    for (const o of S.tides || []) {
      const [ccx, ccy] = o.td.cell.split(",").map(Number), x = (ccx + 0.5) * CW * T, y = (ccy + 0.7) * CH * T;
      const [v] = posMix(x, y, 1.1); if (v < 0.03) continue;
      const ph = o.ph, lvl = ph < 4.5 ? 0.25 : ph < 6 ? 0.25 + (ph - 4.5) / 1.5 * 0.35 : ph < 7.5 ? 0.6 + (ph - 6) / 1.5 * 0.4 : ph < 13 ? 1 - (ph - 7.5) / 5.5 * 0.25 : ph < 14.5 ? 0.75 - (ph - 13) / 1.5 * 0.5 : 0.25;
      if (v * lvl > tv) { tv = v * lvl; tx = x; ty = y; }
      const k = o._kl || (o._kl = { ph }), cross = (a) => k.ph < a && ph >= a;
      if (cross(4.6) || cross(5.2) || cross(5.7)) { BW.stats.gezeit++; wshot(pk(SRS.blubb), x, y, { vol: 0.14, rate: 0.6 + Math.random() * 0.3, gap: 0, tag: "gb", far: 1.2 }); }
      if (cross(13.1) || cross(13.6) || cross(14.1)) { BW.stats.gezeit++; wshot(pk(SRS.blubb), x, y, { vol: 0.18, rate: 0.45 + Math.random() * 0.2, gap: 0, tag: "gg", far: 1.2 }); }
      k.ph = ph;
    }
    if (tv > 0.01 || BW.tideV > 0.01) {
      const path = AM("a_wellen2"); if (!BW.tideOn) { BW.tideOn = true; A.loop("bw_tide", path, 0); }
      BW.tideV = tv; A.loopVol("bw_tide", tv * 0.55 * (normOf(path, -32) || 0.5), 0.5);
    }
  }

  /* ======================= RÜCKWEG-TOR (W14, rueckweg.js) =======================
     Beobachtet Z.rueckweg.zustand(): solange das Tor offen ist, ein leiser Schimmer am Tor (Klangschale als Schleife nach Abstand,
     dazu ab und zu ein Celesta-Funke in der Tonart der Musik); erlischt die Gnade, sinken drei Glockentöne herab und ein tiefer,
     weicher Gong verklingt; beim Durchgang zurück eine kurze Blende (Musik geduckt, alles kurz gedämpft, ein Windhauch). */
  const RW = { st: null, t: 0, v: 0, on: false, stats: { schimmer: 0, schliessen: 0, blende: 0 } };
  KL.rueckweg = RW;
  function rwTone(stufe, okt) { const pr = M.probe && M.probe(okt === 2 ? "glock" : "cel", M.ton(stufe, (M.prof ? M.prof.root : 50) + 12 * (okt || 2))); return pr; }
  function rueckTick(dt) {
    const R0 = Z.rueckweg && Z.rueckweg.zustand ? Z.rueckweg.zustand() : null, b = R0 && R0.back;
    const st = b ? b.st : null, gate = (Z.interacts || []).find(o => o && o.rueck);
    const gx = gate ? gate.x : null, gy = gate ? gate.y - 20 : null;
    const open = st === "open" || st === "opening";
    /* Schimmer */
    let want = 0;
    if (open && gate) { const [v] = posMix(gx, gy, 0.9); want = v * (st === "opening" ? 0.5 : 1); }
    if (want > 0.01 || RW.v > 0.01) {
      const path = AM("a_klangschale"); if (!RW.on) { RW.on = true; A.loop("rw_schimmer", path, 0); RW.stats.schimmer++; }
      RW.v = want; A.loopVol("rw_schimmer", want * 0.5 * (normOf(path, -32) || 0.5), want > 0.01 ? 0.8 : 0.35);
    } else if (RW.on && !open) { RW.on = false; A.stopLoop("rw_schimmer", 0.6); }
    if (open && gate && want > 0.05) { RW.t -= dt; if (RW.t <= 0) { RW.t = 1.3 + Math.random() * 1.6; const pr = rwTone([0, 2, 4, 7, 9][(Math.random() * 5) | 0], 3); if (pr) wshot(pr.path, gx + (Math.random() - 0.5) * 20, gy, { vol: 0.06, rate: pr.rate, vary: 0, verb: 0.85, gap: 0, tag: "rws" }); } }
    /* R17 Tor öffnet sich: warmes Aufgehen – Handglocken Grundton/Terz/Quinte nacheinander, darunter leiser Chor (Grundton+Quinte),
       langsam anschwellend; nur wenn man es hört (Tor nah genug) */
    if (st === "opening" && RW.st !== "opening" && gate) {
      const [v] = posMix(gx, gy, 1.1);
      if (v > 0.05) { RW.stats.oeffnen = (RW.stats.oeffnen || 0) + 1; const r = M.prof ? M.prof.root : 50;
        [0, 2, 4].forEach((d, i) => { const pr = M.probe && M.probe("hglo", M.ton(d, r + 24)); if (pr) wshot(pr.path, gx, gy, { vol: 0.07 + i * 0.01, rate: pr.rate, vary: 0, verb: 0.8, delay: 0.15 + i * 0.28, gap: 0, tag: "rwo" + i, far: 1.1 }); });
        if (!gq().lean && M.note) [0, 4].forEach((d, i) => M.note("ooh", M.ton(d, r + 12), A.ctx.currentTime + 0.2 + i * 0.05, 0.035, 2.6, roomBus() || undefined)); }
    }
    /* Gnade erlischt */
    if (st === "closing" && RW.st !== "closing" && gate) {
      RW.stats.schliessen++;
      [7, 4, 0].forEach((d, i) => { const pr = rwTone(d, 2); if (pr) wshot(pr.path, gx, gy, { vol: 0.09 - i * 0.015, rate: pr.rate, vary: 0, verb: 0.8, delay: 0.1 + i * 0.22, gap: 0, tag: "rwc" + i }); });
      /* Aufschlag und Rückprall des Fallgitters: siehe A.hook.chain (genau auf den Zeitpunkt der Grafik) */
    }
    /* Durchgang zurück: kurze Blende */
    if (st === "going" && RW.st !== "going") {
      RW.stats.blende++;
      M.duck && M.duck(0.6, 0.9);
      A.muffle && A.muffle(700);
      later(0.56, () => { if (!(Z.ui && Z.ui.modalOpen) && !(Z.player && Z.player.dead)) A.muffle && A.muffle(20000); }); /* R17: Audio-Uhr statt setTimeout */
      shot(AM("e_windstoss_1"), { vol: 0.22, rate: 1.15, verb: 0.6, gap: 0, tag: "rwb" });
      /* R17 warmer Durchgang: Harfe abwärts in den Grundton (heimkehren), eine Handglocke klingt auf der anderen Seite nach */
      [7, 4, 2, 0].forEach((d, i) => tuned("harfe", d, 1, 0.07 - i * 0.008, 0.05 + i * 0.07, "rwh" + i));
      { const pr = M.probe && M.probe("hglo", M.ton(0, (M.prof ? M.prof.root : 50) + 24)); if (pr) shot(pr.path, { vol: 0.06, rate: pr.rate, vary: 0, verb: 0.9, delay: 0.62, gap: 0, tag: "rwg" }); }
    }
    RW.st = st;
  }
  /* ======================= R11: STIMMEN, MENÜ-KLÄNGE, TOR-AUFSCHLAG =======================
     Lager-Figuren „sprechen“ beim Erscheinen ihrer Sprechblase (Z.ui.say wird beim ersten Takt umhüllt): kurze Silbenfolge aus
     einem Oszillator durch zwei Formantfilter (Vokale a e i o u), Tonhöhe auf Tönen der laufenden Tonart, Satzmelodie fallend
     (Frage: steigend). Je Figur eigene Lage, Klangfarbe, Silbentempo. Leise (Effekte-Bus), höchstens ~1,3 s, eine Stimme zugleich.
     Menü: „ui“ (Klave) und „uiOk“ werden über A.hook zu leisen Kalimba-/Glockentönen in der Tonart der Musik – Wählen geht die
     Tonleiter auf und ab, Öffnen steigt (Grund→Quinte), Zurück fällt, Bestätigen klingt Grundton+Quinte; Fehler bleibt die
     dumpfe Klave. Kauf: Münzen + leiser Glockenton; Ambossschlag im Menü etwas leiser. Fehlt ein Ton noch im Speicher, erklingt
     das Original. */
  const VOICE = {
    Edda: { d: 4, o: 1, w: "sawtooth", fs: 1.18, syl: 0.085, br: 0.25, k: 0.8 }, Quirin: { d: 2, o: 1, w: "square", fs: 1.3, syl: 0.075, br: 0, k: 0.5 },
    Sigrun: { d: 2, o: 1, w: "triangle", fs: 1.12, syl: 0.11, br: 0.5, k: 0.86 }, Wendel: { d: 0, o: -1, w: "sawtooth", fs: 0.82, syl: 0.12, br: 0.1, det: 9, k: 0.94 },
    Jori: { d: 4, o: 0, w: "sawtooth", fs: 1.05, syl: 0.07, br: 0, k: 1.12 }, Barradin: { d: 0, o: 0, w: "sawtooth", fs: 0.92, syl: 0.1, br: 0, sing: 1, k: 0.87 },
    Alwin: { d: 2, o: -1, w: "triangle", fs: 0.95, syl: 0.13, br: 0.2, k: 6.1 }, Lotte: { d: 7, o: 0, w: "square", fs: 1.22, syl: 0.065, br: 0, k: 1.03 },
    Mira: { d: 4, o: 1, w: "sine", fs: 1.15, syl: 0.12, br: 0.4, k: 1.2 },
    /* die Gefährten aus der Kampagne (Lager-Figuren in ui.js) */
    Friedrich: { d: 2, o: -1, w: "sawtooth", fs: 0.9, syl: 0.1, br: 0.15, k: 1.3 }, Echo: { d: 4, o: 1, w: "square", fs: 1.25, syl: 0.07, br: 0.1, k: 0.58 },
    Nundro: { d: 0, o: -1, w: "triangle", fs: 0.85, syl: 0.14, br: 0.3, k: 4.9 }, Rex: { bark: 1 },
    /* R15: befreiter Kundschafter (abenteuer.js, Z.helferAktiv) – heller, schneller Sprecher */
    Kundschafter: { d: 3, o: 0, w: "sawtooth", fs: 1.1, syl: 0.075, br: 0.2, k: 1 }
  };
  const VOW = [[750, 1200], [500, 1800], [300, 2300], [450, 850], [320, 750]];
  const VS = { cur: null, stats: { laute: 0, menue: 0, tor: 0 } };
  KL.stimmen = VS;
  const hzM = m => 440 * Math.pow(2, (m - 69) / 12);
  function babble(who, txt) {
    if (!A.ok || Z.quiet) return;
    const v = VOICE[who]; if (!v) return; /* nur bekannte Sprecher (Notizen, Gerüchte, Schilder bleiben stumm) */
    if (v.bark) { A.play("bark", { vol: 0.3, gap: 0.5 }); VS.stats.laute++; return; }
    const c = A.ctx, t0 = c.currentTime + 0.03, root = (M.prof ? M.prof.root : 50) + 12 * v.o;
    if (VS.cur) { try { VS.cur.g.gain.cancelScheduledValues(t0); VS.cur.g.gain.setTargetAtTime(0, t0, 0.02); VS.cur.o.stop(t0 + 0.1); } catch (_) {} }
    const n = clamp(Math.round(String(txt).length / 8), 3, gq().lean ? 7 : 10), q = /\?\s*$/.test(txt);
    const o = c.createOscillator(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain(), out = c.createGain();
    o.type = v.w; if (v.det) o.detune.value = v.det;
    f1.type = f2.type = "bandpass"; f1.Q.value = 5; f2.Q.value = 7; o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.gain.value = 0;
    const pan = c.createStereoPanner ? c.createStereoPanner() : null; out.gain.value = ({ sawtooth: 8, square: 6, triangle: 5, sine: 2.6 }[v.w] || 4) * (v.k || 1); /* Formantfilter (schmale Bandpässe) schlucken ~18 dB: Ausgleich je Wellenform, k je Figur gemessen → alle um −31 dB RMS */ g.connect(out); if (pan) { pan.pan.value = rnd(-0.25, 0.25); out.connect(pan); pan.connect(A.sfx); } else out.connect(A.sfx);
    let t = t0, deg0 = v.d;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1, d = v.sing ? deg0 + [0, 2, 4, 2, 1, 0, -1, 0][i % 8] : deg0 + (last ? (q ? 2 : -2) : ((Math.random() * 3) | 0) - 1);
      const f = hzM(M.ton ? M.ton(d, root) : root + d), L = v.syl * rnd(0.8, 1.3) * (last ? 1.6 : 1), [a, b] = VOW[(Math.random() * VOW.length) | 0];
      o.frequency.setValueAtTime(f, t); if (last) o.frequency.linearRampToValueAtTime(f * (q ? 1.12 : 0.9), t + L);
      f1.frequency.setValueAtTime(a * v.fs, t); f2.frequency.setValueAtTime(b * v.fs, t);
      const vol = 0.09 * (1 - v.br * 0.4) * rnd(0.8, 1.1);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.setValueAtTime(vol * 0.85, t + L * 0.7); g.gain.linearRampToValueAtTime(0, t + L);
      t += L + rnd(0.02, 0.06) + (Math.random() < 0.15 ? 0.12 : 0);
    }
    o.start(t0); o.stop(t + 0.05); VS.cur = { o, g };
    o.onended = () => { try { o.disconnect(); f1.disconnect(); f2.disconnect(); g.disconnect(); out.disconnect(); pan && pan.disconnect(); } catch (_) {} if (VS.cur && VS.cur.o === o) VS.cur = null; };
    VS.stats.laute++;
  }
  function hookStimmen() {
    if (VS.hooked || !Z.ui || !Z.ui.say) return; VS.hooked = true;
    const s0 = Z.ui.say;
    Z.ui.say = function (wx, wy, who, txt, ms) { const r = s0.apply(this, arguments); try { if (who) babble(who, txt || ""); } catch (_) {} return r; };
    /* R15 Gebietsvariante (abenteuer.js, Z.gebietVariante(): fallen/brut/gold): Ankündigung über Z.ui.notify (key „variante“) → Akzent */
    const n0 = Z.ui.notify;
    if (n0) Z.ui.notify = function (text, o) { const r = n0.apply(this, arguments); try { if (o && o.key === "variante") varAkzent(); } catch (_) {} return r; };
  }
  /* Brut: tiefes Grollen (Paukenwirbel + Taiko + Pauke auf Grundton und kleiner Sexte darunter);
     Gold: Glocken-Glissando aufwärts in der Tonart + Münzen; Fallen: Metallklicken und Kettenrasseln, darunter Grundton + kleine Sekunde */
  const VA = { stats: { brut: 0, gold: 0, fallen: 0 } }; KL.variante = VA;
  function varAkzent() {
    const v = Z.gebietVariante && Z.gebietVariante(); if (!v || !A.ok || Z.quiet) return;
    VA.stats[v.id] = (VA.stats[v.id] || 0) + 1;
    const r = M.prof ? M.prof.root : 50;
    if (v.id === "brut") {
      shot(KS("timproll"), { vol: 0.16, rate: 0.85, verb: 0.5, gap: 0, tag: "va1" });
      shot(KS("taiko_36"), { vol: 0.3, rate: 0.85, delay: 0.55, verb: 0.5, gap: 0, tag: "va2" });
      tuned("timpt", 0, -1, 0.2, 0.55, "va3"); tuned("timpt", 5, -2, 0.14, 0.95, "va4");
    } else if (v.id === "gold") {
      for (let i = 0; i < 7; i++) tuned("glock", i, 3, 0.05 + i * 0.004, i * 0.06, "vag" + i);
      shot(pk(RA("n_muenzen_", 4)), { vol: 0.16, rate: 1.1, delay: 0.3, verb: 0.3, gap: 0, tag: "vam" });
      tuned("glock", 7, 3, 0.07, 0.48, "vag7");
    } else if (v.id === "fallen") {
      [0, 0.11, 0.19].forEach((d, i) => shot(AM("e_riegel_" + (1 + i)), { vol: 0.2, rate: 1.3 + i * 0.1, delay: d, verb: 0.35, gap: 0, tag: "vaf" + i }));
      shot(pk(RA("n_kette_", 4)), { vol: 0.16, rate: 1.2, delay: 0.3, verb: 0.4, gap: 0, tag: "vak" });
      [0, 1].forEach((st, j) => { const pr = M.probe && M.probe("pizz", ton(0, r) + st); if (pr && A.buf[pr.path]) shot(pr.path, { vol: 0.08, rate: pr.rate, vary: 0, delay: 0.5 + j * 0.02, gap: 0, verb: 0.3, tag: "vap" + j, must: true }); });
    }
  }
  /* Menü-Töne in der Tonart (Kalimba eine bzw. zwei Oktaven über dem Grundton) */
  let uiDeg = 0;
  function tuned(inst, d, okt, vol, delay, tag) {
    const r = (M.prof ? M.prof.root : 50) + 12 * okt, pr = M.probe && M.ton ? M.probe(inst, M.ton(d, r)) : null;
    if (!pr || !A.buf[pr.path]) { if (pr && A.buf[pr.path] === undefined) A.load(pr.path); return false; }
    shot(pr.path, { vol, rate: pr.rate, vary: 0, verb: 0.25, delay: delay || 0, gap: 0, tag: tag || "ui", must: true }); return true;
  }
  /* R13/R15 Hebelrätsel (abenteuer.js, Z.abEvents ev.k "raetsel": seq, prog, fails, resetT, levers[].down, done) – erkannt an
     Zustandsänderungen, nicht an Aufruf-Parametern: je Hebel/Ereignis gemerkter Stand (l._kd gesehen unten, ev._kf Fehlversuche,
     ev._klZ Rücksprünge, ev._klDone gelöst). Die Aufrufe chain/rock/holy von raetselPull/-Tick werden nur dann still ersetzt,
     wenn genau in diesem Moment eine passende Änderung vorliegt (Hook); ändern sich Klangnamen in abenteuer.js, holt KL.tick
     die Änderung nach (raeTick) – dann klingt der alte Klang mit, aber nichts fehlt.
     Richtig: Klick + Kalimba-Ton je Fortschritt eine Stufe höher (0-2-4-5-7); falsch: dumpfer Schlag mit kleiner Sekunde;
     zurück: Ratschen + fallende Töne; gelöst: Riegel klickt, Arpeggio aufwärts und Glocke. */
  const RAE = { stats: { richtig: 0, falsch: 0, zurueck: 0, geloest: 0, nachgeholt: 0 } }; KL.raetsel = RAE;
  const raeEvs = () => (Z.abEvents || []).filter(e => e && e.k === "raetsel" && Array.isArray(e.levers));
  const RAE_ST = [0, 2, 4, 5, 7, 9];
  function raeClick(x, y, rate, vol, delay, tag) { wshot(AM("e_riegel_" + (1 + ((Math.random() * 4) | 0))), x, y, { vol, rate, delay: delay || 0, gap: 0, tag, verb: 0.35 }); }
  /* neuer gezogener Hebel (unten, noch nicht gesehen); richtig, wenn er der nächste in seq ist – vor dem Hochzählen (Hook)
     bzw. danach am gestiegenen prog (Nachholen) */
  function raeNeu() { for (const ev of raeEvs()) { if (ev.done && ev._klDone) continue; const i = ev.levers.findIndex(l => l.down && !l._kd); if (i >= 0) return [ev, i]; } return null; }
  function raePullKlang(ev, i, richtig, k) {
    const lv = ev.levers[i]; lv._kd = true;
    if (richtig) {
      RAE.stats.richtig++; ev._kp = k + 1;
      raeClick(lv.x, lv.y, 1.35, 0.32, 0, "rae1");
      tuned("kal", RAE_ST[Math.min(k, 5)], 2, 0.13, 0.04, "rae" + k); tuned("glock", RAE_ST[Math.min(k, 5)], 3, 0.04, 0.06, "raeg" + k);
    } else raeClick(lv.x, lv.y, 0.9, 0.3, 0, "rae1"); /* falsch: Hebel rastet, Schlag folgt */
  }
  function raePull() {
    const f = raeNeu(); if (!f) return false; const [ev, i] = f;
    if (ev.done && ev.prog >= ev.levers.length && (ev._kp || 0) < ev.prog) { raePullKlang(ev, i, true, ev.prog - 1); return true; } /* letzter Hebel, falls done vorher gesetzt */
    if (ev.resetT > 0 && ev.fails > (ev._kf || 0)) { raePullKlang(ev, i, false); return true; }
    const richtig = ev.seq[ev.prog] === i || ev.prog > (ev._kp || 0);
    raePullKlang(ev, i, richtig, ev.seq[ev.prog] === i ? ev.prog : ev.prog - 1); return true;
  }
  function raeFalschKlang(ev) {
    ev._kf = ev.fails; RAE.stats.falsch++;
    const lv = ev.levers.find(l => l.down) || ev.levers[0];
    wshot(KS("fx_im_impactmetal_heavy_000"), lv.x, lv.y, { vol: 0.22, rate: 0.55, gap: 0, tag: "raef", verb: 0.4 });
    const r0 = (M.prof ? M.prof.root : 50) - 12; /* Grundton und kleine Sekunde darüber, tief – „daneben“ */
    [0, 1].forEach((st, j) => { const pr = M.probe && M.probe("hornst", ton(0, r0) + st); if (pr && A.buf[pr.path]) shot(pr.path, { vol: 0.08, rate: pr.rate, vary: 0, delay: 0.03 + j * 0.01, gap: 0, verb: 0.3, tag: "raef" + j, must: true }); });
  }
  function raeFalsch() { const ev = raeEvs().find(e => e.fails > (e._kf || 0)); if (!ev) return false; raeFalschKlang(ev); return true; }
  /* Rücksprung: Hebel waren als unten gesehen, jetzt alle oben, Rätsel offen */
  function raeZurueckKlang(ev) {
    ev._klZ = ev.fails; RAE.stats.zurueck++; ev._kp = 0;
    ev.levers.forEach((l, j) => { l._kd = false; raeClick(l.x, l.y, 1.1 + j * 0.08, 0.2, j * 0.06, "raez" + j); });
    [4, 2, 0].forEach((d, j) => tuned("kal", d, 1, 0.07, 0.05 + j * 0.09, "raezt" + j));
  }
  function raeZurueck() {
    const ev = raeEvs().find(e => !e.done && e.levers.some(l => l._kd) && e.levers.every(l => !l.down)); if (!ev) return false;
    raeZurueckKlang(ev); return true;
  }
  function raeGeloestKlang(ev) {
    ev._klDone = true; RAE.stats.geloest++;
    raeClick(ev.x, ev.y, 0.8, 0.5, 0.12, "raer1"); raeClick(ev.x, ev.y, 1.25, 0.32, 0.3, "raer2");
    [0, 2, 4, 7].forEach((d, j) => tuned("kal", d, 2, 0.12, 0.42 + j * 0.08, "raea" + j));
    tuned("glock", 0, 3, 0.1, 0.78, "raeb"); tuned("glock", 4, 3, 0.07, 0.84, "raec");
  }
  function raeGeloest() { const ev = raeEvs().find(e => e.done && !e._klDone); if (!ev) return false; raeGeloestKlang(ev); return true; }
  /* Nachholen im Takt: was kein Hook abgefangen hat (z. B. andere Klangnamen in abenteuer.js) */
  function raeTick() {
    for (const ev of raeEvs()) {
      if (ev._klInit !== true) { ev._klInit = true; ev._kf = ev.fails || 0; ev._kp = ev.prog || 0; ev._klZ = ev.fails || 0; ev.levers.forEach(l => { l._kd = !!l.down; }); if (ev.done) ev._klDone = true; continue; }
      let n = 0;
      ev.levers.forEach((l, i) => { if (l.down && !l._kd) { n++; raePullKlang(ev, i, ev.prog > (ev._kp || 0) && !(ev.fails > (ev._kf || 0)), Math.max(0, ev.prog - 1)); } });
      if (ev.fails > (ev._kf || 0)) { n++; raeFalschKlang(ev); }
      if (!ev.done && ev.levers.some(l => l._kd) && ev.levers.every(l => !l.down)) { n++; raeZurueckKlang(ev); }
      if (ev.done && !ev._klDone) { n++; raeGeloestKlang(ev); }
      if (n) RAE.stats.nachgeholt += n;
    }
  }
  /* R14 Heilquelle (abenteuer.js HEILQUELLE, Z.abEvents ev.k "quelle", ev.done = versiegt) – nur beobachtet:
     Raumklang: Rinnsal-Schleife nahe einer aktiven Quelle (ab ~10 Kacheln, lauter je näher; im Kampf leiser).
     quelleNimm spielt „splash“ 0,7 mit x der Quelle, danach Heilung bzw. +1 Trank: an dieser Stelle (Hook) eigene Klänge –
     Trinken: Schöpfen + Schlucke + aufsteigender Kalimba-Ton; Füllen: Flasche + Glucksen mit steigender Tonhöhe + Korken + Glocke;
     danach Versiegen: Rinnsal blendet aus, letzte Tropfen werden langsamer, fallende Töne 4-2-0. */
  const QU = { stats: { trinken: 0, fuellen: 0, versiegt: 0, nah: 0 }, pre: null }; KL.quelle = QU;
  const quEvs = () => (Z.abEvents || []).filter(e => e && e.k === "quelle");
  function quTick(dt, lv, P) {
    if (lv.hub) { windLevel("quelle", "a_rinnsal", 5200, 1, 0); return; }
    const T = Z.TILE || 16, px = P.x + P.w / 2, py = P.y + P.h; let best = 1e9;
    for (const ev of quEvs()) { if (ev.done) continue; const d = Math.hypot(ev.x - px, (ev.y - py) * 1.3) / T; if (d < best) best = d; }
    if (best < 30 && QU.pre !== lv) { QU.pre = lv; preload(RA("n_trinken_", 16).concat(RA("n_blubb_", 3), RA("n_tropfen_", 23).slice(0, 8), [KS("fx_rp_bottle"), KS("fx_wn_trank")])); }
    const f = best < 10 ? Math.pow(1 - best / 10, 1.3) * ((M.tier || 0) >= 2 ? 0.45 : 1) : 0;
    if (f > 0.02) QU.stats.nah++;
    windLevel("quelle", "a_rinnsal", 5200, 1, gq().mini ? 0 : f * 1.1);
  }
  function quKlang(ev, art) {
    const x = ev.x, y = ev.y - 10, r = M.prof ? M.prof.root : 50;
    if (art === "trinken") {
      QU.stats.trinken++;
      wshot(pk(RA("n_platsch_", 10)), x, y, { vol: 0.16, rate: 1.35, verb: 0.3, gap: 0, tag: "qu1" });
      wshot(pk(RA("n_trinken_", 16)), x, y, { vol: 0.42, delay: 0.18, verb: 0.2, gap: 0, tag: "qu2" });
      [0, 2, 4].forEach((d, i) => tuned("kal", d, 2, 0.08, 0.45 + i * 0.11, "qut" + i));
    } else {
      QU.stats.fuellen++;
      wshot(KS("fx_rp_bottle"), x, y, { vol: 0.32, rate: 1.05, verb: 0.25, gap: 0, tag: "qu1" });
      [1, 1.22, 1.5].forEach((rt, i) => wshot(pk(RA("n_blubb_", 3)), x, y, { vol: 0.2, rate: rt, delay: 0.15 + i * 0.17, verb: 0.3, gap: 0, tag: "qub" + i }));
      wshot(KS("fx_wn_trank"), x, y, { vol: 0.22, rate: 1.3, delay: 0.72, verb: 0.2, gap: 0, tag: "quk" });
      tuned("glock", 4, 3, 0.07, 0.8, "qug");
    }
    /* Versiegen */
    QU.stats.versiegt++;
    [0.0, 0.35, 0.8, 1.4].forEach((d, i) => wshot(pk(RA("n_tropfen_", 23)), x, y, { vol: 0.14 - i * 0.025, rate: 1.1 - i * 0.06, delay: 1.0 + d, verb: 0.6, gap: 0, tag: "qud" + i }));
    [4, 2, 0].forEach((d, i) => tuned("kal", d, 1, 0.05 - i * 0.008, 1.1 + i * 0.3, "quv" + i));
  }
  /* R15 Variante „Einsturzgefahr“ (abenteuer.js varTick, Z.brockenListe(): {x, y0, yF, t, fall}) – nach Zustand:
     neuer Brocken = 1,1-s-Vorwarnung: Knirschen in der Decke, Kies rieselt dichter werdend, Staub; Losbrechen (fall) = trockenes Brechen
     statt „rock“; Brocken verschwindet aus der Liste = Aufschlag (Felsbruch + Steinschlag + tiefer Plattenschlag + Staubwolke) statt
     „hitHeavy“. Hooks rock/hitHeavy greifen nur, wenn genau dann ein beobachteter Brocken losbricht bzw. aufschlägt; sonst holt der Takt nach. */
  const BK = { live: new Set(), stats: { warn: 0, fall: 0, aufschlag: 0, nachgeholt: 0 } }; KL.einsturz = BK;
  const bkListe = () => (Z.brockenListe ? Z.brockenListe() : null) || [];
  function bkWarn(b) {
    BK.stats.warn++; const x = b.x, y = b.y0 + 4;
    wshot(pk(SRS.knirsch), x, y, { vol: 0.2, rate: 0.55, verb: 0.5, gap: 0, tag: "bkw1", far: 1.3, must: true });
    wshot(pk(SRS.knirsch), x, y, { vol: 0.16, rate: 0.5, delay: 0.45, verb: 0.5, gap: 0, tag: "bkw2", far: 1.3, must: true });
    [0.1, 0.35, 0.55, 0.72, 0.85, 0.95].forEach((d, i) => wshot(pk(SRS.kies), x, y, { vol: 0.06 + i * 0.02, rate: 1.1 + Math.random() * 0.2, delay: d, verb: 0.4, gap: 0, tag: "bkk" + i, far: 1.3 }));
    dustNoise(x, y, 0.05, 1.1);
  }
  function bkFallKlang(b) { b._kf = true; BK.stats.fall++; wshot(pk(SRS.bruch), b.x, b.y0, { vol: 0.24, rate: 1.15, verb: 0.4, gap: 0, tag: "bkf", far: 1.3 }); }
  function bkAufschlag(b) {
    BK.live.delete(b); BK.stats.aufschlag++; const x = b.x, y = b.yF - 4;
    wshot(pk(SRS.bruch), x, y, { vol: 0.42, rate: 0.75, verb: 0.45, gap: 0, tag: "bka1", far: 1.4 });
    wshot(pk(SRS.steinschlag), x, y, { vol: 0.3, rate: 0.9, delay: 0.04, verb: 0.4, gap: 0, tag: "bka2", far: 1.4 });
    wshot(KS("fx_im_impactplate_heavy_001"), x, y, { vol: 0.3, rate: 0.55, verb: 0.3, gap: 0, tag: "bka3", far: 1.4 });
    [0.18, 0.4].forEach((d, i) => wshot(pk(SRS.kies), x, y, { vol: 0.12 - i * 0.04, rate: 1, delay: d, verb: 0.4, gap: 0, tag: "bkn" + i }));
    dustNoise(x, y, 0.1, 1.6);
  }
  function bkFall() { const b = [...BK.live].find(b => b.fall && !b._kf); if (!b) return false; bkFallKlang(b); return true; }
  const bkLanded = b => b.fall && b.y + 10 >= b.yF; /* aus der Liste genommen, weil aufgeschlagen (nicht durch Gebietswechsel/Leeren) */
  function bkImpact() { const l = bkListe(), b = [...BK.live].find(b => !l.includes(b) && bkLanded(b)); if (!b) return false; bkAufschlag(b); return true; }
  function bkTick() {
    const l = bkListe();
    if (BK.lv !== Z.level) { BK.lv = Z.level; BK.live.clear(); }
    for (const b of l) if (!BK.live.has(b)) { BK.live.add(b); if (!b.fall && b.t < 0.4) bkWarn(b); else b._kf = b.fall; }
    for (const b of BK.live) { if (b.fall && !b._kf) { BK.stats.nachgeholt++; bkFallKlang(b); } if (!l.includes(b)) { if (bkLanded(b)) { BK.stats.nachgeholt++; bkAufschlag(b); } else BK.live.delete(b); } }
  }
  /* R17 Spielgefühl: Perfektes Ausweichen (Z.stats.dodges steigt, kampf.js spielt dann „parry“ leise) – Luftzug-Wisch und zwei Harfentöne
     aufwärts; Parade (P.parryT > 0 im selben Moment) – heller Zweiklang (Grundton+Quinte, Glocke) über dem Metall, darunter ein Paukenschlag,
     die Musik weicht kurz (gefühlte Zeitlupe). Letzter Gegner im Kampf besiegt – kurzer Ausklang (Harfe abwärts zum Grundton, Chor) und
     schnellerer Rückweg in die Ruhe (M.raumFrei). Alles in der Tonart, leise; Handheld: ohne Chor. */
  const FG = { dodges: -1, stats: { ausweichen: 0, parade: 0, raumFrei: 0 }, nah: 0, kills: 0 }; KL.gefuehl = FG;
  function whoosh(vol, len) {
    if (!A.ok) return; const c = A.ctx; if (!noiseB || noiseB.sampleRate !== c.sampleRate) mkNoise();
    const t = c.currentTime + 0.005, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = RISS.white || noiseB; s.loop = true; f.type = "bandpass"; f.Q.value = 1.6; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(3800, t + len * 0.6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + len * 0.3); g.gain.linearRampToValueAtTime(0, t + len);
    s.connect(f); f.connect(g); g.connect(A.sfx); s.start(t); s.stop(t + len + 0.05); s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
  }
  function fgParry() {
    const P = Z.player, st = Z.stats || {}; if (!P) return false;
    if (FG.dodges < 0) FG.dodges = st.dodges || 0;
    if ((st.dodges || 0) > FG.dodges) { FG.dodges = st.dodges; FG.stats.ausweichen++; whoosh(0.05, 0.28); tuned("harfe", 4, 2, 0.06, 0.03, "fgd1"); tuned("harfe", 7, 2, 0.05, 0.1, "fgd2"); return false; }
    if (P.parryT > 0) {
      FG.stats.parade++;
      tuned("glock", 0, 3, 0.09, 0.01, "fgp1"); tuned("glock", 4, 3, 0.06, 0.02, "fgp2");
      if (M.probe) { const pr = M.probe("timpt", ton(0, (M.prof ? M.prof.root : 50) - 12)); if (pr && A.buf[pr.path]) shot(pr.path, { vol: 0.12, rate: pr.rate, vary: 0, gap: 0.1, verb: 0.3, tag: "fgp3", must: true }); }
      M.duck && M.duck(0.3, 0.35);
    }
    return false;
  }
  function fgTick() {
    const P = Z.player; if (!P || P.dead || !Z.level || Z.level.hub) { FG.nah = 0; return; }
    let n = 0; for (const e of Z.enemies || []) if (!e.dead && !e.hidden && e.aware && !e.ally && Math.abs(e.x - P.x) < 460 && Math.abs(e.y - P.y) < 260) n++;
    const k = (Z.stats && Z.stats.kills) || 0;
    if (FG.nah > 0 && n === 0 && k > FG.kills && (M.tier || 0) >= 2 && !(Z.boss && !Z.bossDefeated)) {
      FG.stats.raumFrei++; M.raumFrei = A.ctx.currentTime;
      [7, 4, 2, 0].forEach((d, i) => tuned("harfe", d, 1, 0.07 - i * 0.008, 0.35 + i * 0.1, "fgr" + i));
      if (!gq().lean) [0, 4].forEach((d, i) => tuned("ooh", d, 1, 0.035, 0.75 + i * 0.02, "fgc" + i));
    }
    if (n > 0 && M.raumFrei) M.raumFrei = 0; /* neue Gegner: kein schneller Ausstieg */
    FG.nah = n; FG.kills = k;
  }
  /* R18 Gittertor-Abkürzung (erkundung.js pullLever, Z.erkundung().levers[].pulled, g.vert = Falltür, g.flut = Flutgitter) – nach Zustand:
     Hebel rastet (tiefer Riegel), Kettenwinde läuft an (Kettenglieder immer schneller), Gitter hebt sich knirschend (Staub, Knarren),
     oben rastet es ein (Metallschlag; Falltür: Holzschlag), dann leise Kalimba 1-3-5 „Weg frei“. Hooks chain/door ersetzen den alten Klang
     nur im selben Moment; sonst Nachholen im Takt. Flutgitter behält sein Wasser (splash). */
  const GT = { stats: { hebel: 0, nachgeholt: 0 }, t: -9 }; KL.gittertor = GT;
  const gtLevers = () => { const S = Z.erkundung && Z.erkundung(); return (S && S.levers) || []; };
  function gtKlang(o) {
    o._kl = true; GT.stats.hebel++; GT.t = A.ctx.currentTime;
    const x = o.x, y = o.y - 10, g = o.g || {}, gx = g.tiles && g.tiles.length ? g.tiles[0][0] * (Z.TILE || 16) + 8 : x, gy = g.tiles && g.tiles.length ? g.tiles[0][1] * (Z.TILE || 16) : y;
    wshot(AM("e_riegel_" + (1 + ((Math.random() * 4) | 0))), x, y, { vol: 0.35, rate: 0.7, verb: 0.3, gap: 0, tag: "gt1" });
    [0.18, 0.36, 0.52, 0.66, 0.78, 0.88, 0.96].forEach((d, i) => wshot(pk(SRS.kette), gx, gy, { vol: 0.1 + i * 0.012, rate: 0.85 + i * 0.05, delay: d, verb: 0.4, gap: 0, tag: "gtk" + i, far: 1.4 }));
    wshot(pk(SRS.knarz), gx, gy, { vol: 0.16, rate: 0.7, delay: 0.3, verb: 0.5, gap: 0, tag: "gtn", far: 1.4 });
    dustNoise(gx, gy, 0.05, 1.2);
    if (g.vert) wshot(KS("fx_im_impactplank_medium_002"), gx, gy, { vol: 0.32, rate: 0.75, delay: 1.05, verb: 0.4, gap: 0, tag: "gte", far: 1.4 });
    else wshot(KS("fx_im_impactmetal_heavy_003"), gx, gy, { vol: 0.24, rate: 0.85, delay: 1.05, verb: 0.5, gap: 0, tag: "gte", far: 1.4 });
    if (!g.flut) [0, 2, 4].forEach((d, i) => tuned("kal", d, 2, 0.07, 1.25 + i * 0.1, "gtw" + i));
  }
  function gtJetzt() { const o = gtLevers().find(o => o.pulled && !o._kl && o._klInit); if (!o) return false; gtKlang(o); return true; }
  function gtTick() {
    for (const o of gtLevers()) if (!o._klInit) { o._klInit = true; if (o.pulled) o._kl = true; }
    const o = gtLevers().find(o => o.pulled && !o._kl); if (o) { GT.stats.nachgeholt++; gtKlang(o); }
  }
  /* R18 Fallschacht-Abkürzung (welt.js lv.abkuerzungen [{x, y0, y1}], 2 Kacheln breit): wer hinabfällt, hört die Luft vorbeiziehen
     (fallender Wisch, tiefer werdend) – einmal je Sturz; die Landung macht der normale Aufprall */
  const FS = { in: false, stats: { sturz: 0 } }; KL.fallschacht = FS;
  function fsTick() {
    const P = Z.player, lv = Z.level; if (!P || !lv || !lv.abkuerzungen || !lv.abkuerzungen.length) { FS.in = false; return; }
    const T = Z.TILE || 16, tx = Math.floor((P.x + P.w / 2) / T), ty = Math.floor((P.y + P.h / 2) / T);
    const drin = lv.abkuerzungen.some(a => tx >= a.x && tx <= a.x + 1 && ty > a.y0 && ty < a.y1);
    if (drin && !FS.in && P.vy > 60) {
      FS.stats.sturz++; if (!A.ok) return; const c = A.ctx; if (!noiseB || noiseB.sampleRate !== c.sampleRate) mkNoise();
      const t = c.currentTime + 0.01, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = RISS.white || noiseB; s.loop = true; f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.9);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 0.95);
      s.connect(f); f.connect(g); g.connect(A.sfx); s.start(t); s.stop(t + 1); s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
    }
    FS.in = drin;
  }
  /* R20 Runen (runen.js – nur beobachtet): Bewegungs-Rune gefunden (Z.run.moveRunes / Z.meta.runen.frei neu, dabei spielt runen.js „rune“+„holy“)
     bzw. Runenstein in den Gürtel (P.runeBelt neu, „rune“+„gem“) → feierlicher Klang je Art statt des allgemeinen: Chor-Grund (Grundton+Quinte)
     und Glockenkrone, dazu die Farbe der Rune – Kralle: Kratzen + Harfe aufwärts; Schatten: Schattenwisch + tiefer Moll-Chor; Schwingen:
     Windstoß + Okarina 1-5-8-9; Erde: Grollen + Pauke; Kette: Kettenrasseln + Glocken 1-5-8; Nebel: Luft + Glas 8-5. Gürtel-Runen: Familie
     bestimmt das Instrument (Glut Marimba, Seuche Pizzicato, Sturm Celesta, sonst Kalimba). Nebel-Rolle (Nebelrune): weicher Lufthauch mit
     Glas-Schimmer statt „dark“; Durchgleiten eines Nebelgitters: hohles Wehen und zwei Glastöne. */
  const RU = { mr: null, belt: null, t: -9, gitter: false, stats: { rune: 0, guertel: 0, nebelrolle: 0, gitter: 0 } }; KL.runen = RU;
  const ruMoveSet = () => { const m = Z.meta && Z.meta.runen, r = Z.run && Z.run.moveRunes; return Object.keys(Object.assign({}, (m && m.frei) || {}, r || {})).sort().join(","); };
  function ruFeier(farbe, extra) {
    const now = A.ctx.currentTime; RU.t = now; const r = M.prof ? M.prof.root : 50;
    if (M.note && !gq().mini) [0, 4].forEach((d, i) => M.note("ooh", M.ton(d, r + 12), now + 0.05 + i * 0.03, 0.04, 2.8, roomBus() || undefined));
    extra && extra(now, r);
    [[7, 3, 0.07, 0.65], [9, 3, 0.05, 0.8], [12, 3, 0.06, 0.95]].forEach(([d, o, v, t], i) => tuned(farbe || "glock", d, o, v, t, "ruk" + i));
    M.duck && M.duck(0.25, 1.2);
  }
  const RUMOVE = {
    kralle: () => { shot(pk(RK("fx_0_schild_metall_", [1, 2])), { vol: 0.08, rate: 1.6, gap: 0, tag: "rux" }); [0, 2, 4].forEach((d, i) => tuned("harfe", d, 2, 0.08, 0.1 + i * 0.08, "rum" + i)); },
    schatten: () => { whoosh(0.05, 0.5); [0, 2].forEach((d, i) => tuned("ooh", d, 0, 0.06, 0.1 + i * 0.25, "rum" + i)); },
    schwingen: () => { shot(AM("e_windstoss_1"), { vol: 0.16, rate: 1.1, gap: 0, tag: "rux", verb: 0.6 }); [0, 4, 7, 8].forEach((d, i) => tuned("oka", d, 2, 0.07, 0.15 + i * 0.12, "rum" + i)); },
    erde: () => { dustNoise(Z.player ? Z.player.x : 0, Z.player ? Z.player.y : 0, 0.07, 1.2); tuned("timpt", 0, -1, 0.2, 0.05, "rum0"); shot(KS("taiko_36"), { vol: 0.2, rate: 0.9, gap: 0, tag: "rux", delay: 0.3 }); },
    kette: () => { shot(pk(SRS.kette), { vol: 0.16, rate: 1.2, gap: 0, tag: "rux" }); [0, 4, 7].forEach((d, i) => tuned("glock", d, 2, 0.06, 0.15 + i * 0.1, "rum" + i)); },
    nebel: () => { whoosh(0.04, 0.8); [7, 4].forEach((d, i) => tuned("glas", d, 3, 0.05, 0.2 + i * 0.2, "rum" + i)); }
  };
  const RUFAM = { feuer: "mar", gift: "pizz", sturm: "cel" };
  function ruRune() {
    const P = Z.player; if (!P || !A.ok) return false;
    const ms = ruMoveSet(); if (RU.mr == null) RU.mr = ms;
    if (ms !== RU.mr) {
      const neu = ms.split(",").filter(k => k && !RU.mr.split(",").includes(k)); RU.mr = ms;
      if (neu.length) { RU.stats.rune++; const k = neu[0]; ruFeier("glock", RUMOVE[k] || null); return true; }
    }
    const belt = (P.runeBelt || []).join(","); if (RU.belt == null) RU.belt = belt;
    if (belt !== RU.belt) { const old = RU.belt.split(","); RU.belt = belt; const neu = (P.runeBelt || []).find(k => !old.includes(k));
      if (neu) { RU.stats.guertel++; const fam = Z.RUNES && Z.RUNES[neu] && Z.RUNES[neu].fam, inst = RUFAM[fam] || "kal";
        ruFeier(inst === "pizz" ? "glock" : "hglo", () => [0, 2, 4, 7].forEach((d, i) => tuned(inst, d, 2, 0.08, 0.05 + i * 0.09, "rug" + i))); return true; } }
    return false;
  }
  function ruTick() {
    const P = Z.player; if (!P) return;
    if (RU.mr == null) RU.mr = ruMoveSet(); if (RU.belt == null) RU.belt = (P.runeBelt || []).join(",");
    ruRune(); /* Nachholen, falls kein „rune“-Aufruf kam */
    /* Nebelgitter durchgleiten */
    const G = Z.runen && Z.runen.level && Z.runen.level(), T = Z.TILE || 16;
    let drin = false;
    if (G && G.grate && G.lv === Z.level && G.nGrate) { const tx = Math.floor((P.x + P.w / 2) / T), ty = Math.floor((P.y + P.h / 2) / T); drin = !!G.grate[ty * G.lv.W + tx]; }
    if (drin && !RU.gitter) { RU.stats.gitter++; const c = A.ctx; if (!noiseB || noiseB.sampleRate !== c.sampleRate) mkNoise();
      const t = c.currentTime + 0.005, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = noiseB; s.loop = true; f.type = "bandpass"; f.Q.value = 3; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.15); g.gain.linearRampToValueAtTime(0, t + 0.6);
      s.connect(f); f.connect(g); g.connect(A.sfx); s.start(t); s.stop(t + 0.65); s.onended = () => { try { s.disconnect(); f.disconnect(); g.disconnect(); } catch (_) {} };
      [4, 9].forEach((d, i) => tuned("glas", d, 3, 0.05, 0.08 + i * 0.12, "rug" + i)); }
    RU.gitter = drin;
  }
  function ruNebelRolle() {
    const P = Z.player; if (!P || !(P.rollT > 0) || !(Z.hasMoveRune && Z.hasMoveRune("nebel"))) return false;
    RU.stats.nebelrolle++; whoosh(0.045, 0.45); tuned("glas", 4, 3, 0.035, 0.05, "run"); return true;
  }
  /* R15 Befreiter Kundschafter (abenteuer.js, Z.helferAktiv()): beim Losgehen ein kurzer Ruf, beim Abschied ein Gruß (Formant-Laute
     wie die Lager-Figuren), Treffer als leichter Dolchstich (KL.treffer, src "helfer") statt des alten „slash“ (Hook nur direkt danach). */
  const HL = { an: false, lv: null, hitT: -9, stats: { ruf: 0, abschied: 0, treffer: 0 } }; KL.helfer = HL;
  function hlTick() {
    const an = !!(Z.helferAktiv && Z.helferAktiv()), P = Z.player;
    if (an && !HL.an) { HL.lv = Z.level; HL.stats.ruf++; babble("Kundschafter", "Ich hab noch eine Rechnung offen!"); shot(pk([KS("fx_rp_sword_unsheathe4"), KS("fx_rp_sword_unsheathe5")]), { vol: 0.12, rate: 1.4, verb: 0.3, gap: 0.3, tag: "hlfz", delay: 0.5 }); }
    if (!an && HL.an && P && !P.dead && Z.level === HL.lv) { HL.stats.abschied++; babble("Kundschafter", "Viel Glück, Gehörnter!"); }
    HL.an = an;
  }
  /* R15 Fundstelle „Überreste eines Abenteurers“ (abenteuer.js, Z.abEvents ev.k "fund", ev.done = durchsucht) – nach Zustand:
     Lederrascheln (Rucksack), Knochen klappern leise, verstreute Münzen, dazu ein leiser melancholischer Harfenton in der Tonart
     (Moll-Sexte → Quinte, darunter Grundton). Hook „coin“ ersetzt den alten Münzklang nur, wenn gerade eine Fundstelle durchsucht
     wurde; sonst holt KL.tick es nach. */
  const FU = { stats: { fund: 0, nachgeholt: 0 } }; KL.fund = FU;
  const fuEvs = () => (Z.abEvents || []).filter(e => e && e.k === "fund");
  function fuKlang(ev) {
    FU.stats.fund++; const x = ev.x, y = ev.y - 6;
    wshot(pk(RA("g_leder_", 6)), x, y, { vol: 0.32, rate: 0.95, verb: 0.25, gap: 0, tag: "fu1" });
    wshot(pk(RA("g_leder_", 6)), x, y, { vol: 0.22, rate: 1.1, delay: 0.22, verb: 0.25, gap: 0, tag: "fu2" });
    wshot(AM("n_knochen_1"), x, y, { vol: 0.12, rate: 1.2, delay: 0.12, verb: 0.4, gap: 0, tag: "fu3" });
    [0.38, 0.5, 0.66].forEach((d, i) => wshot(pk(RA("n_muenzen_", 4)), x, y, { vol: 0.2 - i * 0.04, rate: 1 + i * 0.05, delay: d, verb: 0.3, gap: 0, tag: "fum" + i }));
    [[5, 0.55, 0.07], [4, 0.95, 0.06]].forEach(([d, t, v], i) => tuned("harfe", d, 1, v, t, "fuh" + i));
    tuned("harfe", 0, 0, 0.05, 1.35, "fuh2");
  }
  function fundJetzt() { const ev = fuEvs().find(e => e.done && !e._kl && e._klInit); if (!ev) return false; ev._kl = true; fuKlang(ev); return true; }
  function fuTick() {
    const fe = fuEvs(); if (fe.length && FU.pre !== Z.level) { FU.pre = Z.level; preload(RA("g_leder_", 6).concat(RA("n_muenzen_", 4), [AM("n_knochen_1")])); }
    for (const ev of fe) if (!ev._klInit) { ev._klInit = true; if (ev.done) ev._kl = true; }
    const ev = fuEvs().find(e => e.done && !e._kl); if (ev) { ev._kl = true; FU.stats.nachgeholt++; fuKlang(ev); }
  }
  /* Quelle versiegt (ev.done neu): Trinken oder Füllen am Spielerzustand – Hook „splash“ (Mikrotask, nach quelleNimm) oder Nachholen im Takt */
  function quNeu() { return quEvs().find(e => e.done && !e._kl && e._klInit); }
  function quSplash() {
    const ev = quNeu(); if (!ev) return false;
    ev._kl = true; const P = Z.player, pot0 = P ? P.potions : 0, hp0 = P ? P.hp : 0;
    Promise.resolve().then(() => { try { quKlang(ev, P && P.potions > pot0 && !(P.hp > hp0) ? "fuellen" : "trinken"); } catch (_) {} });
    return true;
  }
  function quStateTick(P) {
    for (const ev of quEvs()) { if (!ev._klInit) { ev._klInit = true; if (ev.done) ev._kl = true; } }
    const ev = quNeu();
    if (ev) { ev._kl = true; QU.stats.nachgeholt = (QU.stats.nachgeholt || 0) + 1; quKlang(ev, P && QU.pot != null && P.potions > QU.pot ? "fuellen" : "trinken"); }
    if (P) QU.pot = P.potions;
  }
  if (A) A.hook = Object.assign(A.hook || {}, {
    splash: o => quSplash(),
    parry: o => fgParry(),
    rune: o => ruRune(),
    gem: o => !!(A.ctx && A.ctx.currentTime - RU.t < 0.02), /* R20: Gürtel-Rune – „gem“ im selben Moment ersetzt */
    dark: o => !!(o && o.rate === 1.6 && ruNebelRolle()),
    door: o => !!(A.ctx && A.ctx.currentTime - GT.t < 0.02), /* R18: Tür-Klang des Gittertor-Hebels (gleicher Moment) */
    slash: o => !!(A.ctx && A.ctx.currentTime - HL.hitT < 0.03),
    rock: o => raeFalsch() || bkFall(),
    hitHeavy: o => bkImpact(),
    ui: o => {
      const r = o.rate || 1; VS.stats.menue++;
      if (r <= 0.55) return false;                                                                  /* Fehler: dumpfe Klave bleibt */
      if (r >= 1.4) { uiDeg = (uiDeg + (Math.random() < 0.7 ? 1 : -1) + 7) % 7; return tuned("kal", uiDeg, 2, 0.07); } /* Wählen */
      if (r < 0.75) return tuned("kal", 4, 2, 0.1) && (tuned("kal", 0, 2, 0.09, 0.07, "ui2"), true);   /* Zurück: fällt */
      return tuned("kal", 0, 2, 0.1) && (tuned("kal", 4, 2, 0.09, 0.07, "ui2"), true);                 /* Öffnen/Klick: steigt */
    },
    uiOk: o => { VS.stats.menue++; return tuned("glock", 0, 3, 0.16) && (tuned("glock", 4, 3, 0.12, 0.06, "ok2"), true); },
    coin: o => { if (fundJetzt()) return true; if (Z.ui && Z.ui.modalOpen) { tuned("glock", 2, 3, 0.05, 0.08, "kauf"); } return false; },
    anvil: o => { if (Z.ui && Z.ui.modalOpen && !o._m) { A.play("anvil", Object.assign({}, o, { vol: (o.vol || 1) * 0.7, _m: 1, noHook: true })); return true; } return false; },
    /* Rückweg-Tor erlischt (rueckweg.js spielt genau dann „chain“ 0,28/0,9 mit x): Aufschlag des Fallgitters nach 0,56 s, Rückprall nach 0,73 s – wie die Grafik */
    chain: o => {
      if (raePull() || raeZurueck() || gtJetzt()) return true; /* R15: nach Zustand statt Parametern; R18 Gittertor */
      if (o && o.vol === 0.28 && o.rate === 0.9 && o.x != null && Z.rueckweg) { VS.stats.tor++; const y = Z.player ? Z.player.y : 0;
        wshot(KS("fx_im_impactmetal_heavy_000"), o.x, y, { vol: 0.42, rate: 0.75, delay: 0.56, gap: 0, tag: "rwa", verb: 0.5 });
        wshot(KS("fx_im_impactmetal_heavy_003"), o.x, y, { vol: 0.16, rate: 1.1, delay: 0.73, gap: 0, tag: "rwr", verb: 0.4 });
        setTimeout(() => dustNoise(o.x, y, 0.06, 0.8), 560); }
      return false;
    }
  });
  /* ======================= R12: ERFOLGE, TRAUER, ABSPANN =======================
     Erfolg: abenteuer.js grant() trägt den Erfolg in Z.meta.ach ein und spielt gleich danach „holy“ – an genau dieser Stelle
     (A.hook.holy, neuer Eintrag in Z.meta.ach) erklingt stattdessen die Fanfare in der Tonart (musik.js Stinger „erfolg“).
     Kategorie: Feld kat/cat/k der Erfolgs-Daten, sonst aus Kennung und Text geraten; „gross“ bei Feld selten/schwer/gross,
     Belohnung Held, oder Text mit Boss/Ende/ohne Treffer. Trauer: nach dem Todes-Stinger (3,2 s) Musik „trauer“ (Tonart des
     Lagers); Abspann: Z.ui.ending wird umhüllt → Musik „abspann“. */
  const ER = { n: -1, stats: { fanfare: 0, kat: {} } };
  KL.erfolge = ER;
  (Z._slotSwap = Z._slotSwap || []).push(() => { ER.n = -1; }); /* W19 Slots: Erfolgszähler des neuen Spielstands neu aufnehmen (keine falsche Fanfare) */
  function achKat(a) {
    if (["tempo", "technik", "nohit", "erkundung", "bosse", "sammeln", "kurios", "geschichte"].includes(a.kat)) return a.kat; /* abenteuer.js enrich(): a.kat */
    const k = a.kat || a.cat || a.k; if (k) { const m = String(k).toLowerCase(); for (const c of ["tempo", "technik", "nohit", "erkundung", "bosse"]) if (m.startsWith(c.slice(0, 4))) return c; if (/kampf|tech/.test(m)) return "technik"; if (/hit|treffer/.test(m)) return "nohit"; if (/boss/.test(m)) return "bosse"; if (/erkund|entdeck/.test(m)) return "erkundung"; }
    const txt = (a.id + " " + JSON.stringify(a.n || "") + " " + JSON.stringify(a.d || "")).toLowerCase();
    if (/ohne (schaden|treffer)|no.?hit|without (taking )?(damage|a hit)/.test(txt)) return "nohit";
    if (/boss|w[aä]chter|warden|demogorgon|endboss|final/.test(txt)) return "bosse";
    if (/sekunden|minuten|schnell|zeit|tempo|speed|fast|seconds|minutes/.test(txt)) return "tempo";
    if (/parade|parry|ausweich|dodge|kombo|combo|krit|crit|sturz|technik/.test(txt)) return "technik";
    if (/geheim|secret|karte|map|spur|trace|befrei|free|erkund|explor|seite|page|kammer|chamber/.test(txt)) return "erkundung";
    return "sonst";
  }
  function achGross(a) {
    if (a.selten === true || (a.siegel && a.siegel.stufe === "blut")) return true; /* abenteuer.js: selten / Siegel-Stufe „blut“ */
    if (a.selten === false && a.siegel) return false;
    if (a.selten || a.schwer || a.gross || a.rare || a.hard) return true;
    if (a.r && a.r.hero) return true;
    const txt = (a.id + " " + JSON.stringify(a.n || "") + " " + JSON.stringify(a.d || "")).toLowerCase();
    return /alle enden|all endings|endboss|demogorgon|ohne (schaden|treffer)|without taking damage|5 sch[aä]del|five skulls/.test(txt);
  }
  if (A) A.hook = Object.assign(A.hook || {}, {
    holy: o => {
      if (raeGeloest()) return true;
      if (A.ctx && A.ctx.currentTime - RU.t < 0.02) return true; /* R20: „holy“ der Bewegungs-Rune im selben Moment ersetzt */
      const m = Z.meta && Z.meta.ach; if (!m || !Z.ACH) return false;
      const ids = Object.keys(m); if (ER.n < 0) { ER.n = ids.length; return false; }
      if (ids.length <= ER.n) { ER.n = ids.length; return false; }
      ER.n = ids.length;
      const newest = ids.reduce((a, b) => (m[b] > m[a] ? b : a)), a = Z.ACH.find(x => x.id === newest);
      if (!a || !M.stinger || !M.out) return false;
      const kat = achKat(a), gross = achGross(a); ER.stats.fanfare++; ER.stats.kat[kat] = (ER.stats.kat[kat] || 0) + 1; ER.last = { id: a.id, kat, gross };
      const now = A.ctx.currentTime, kurz = !gross && ER.lastT != null && now - ER.lastT < 5 && now >= ER.lastT; /* R13: Häufung → Nachschlag */
      ER.serie = kurz ? (ER.serie || 0) + 1 : 0; ER.lastT = now; if (kurz) ER.stats.kurz = (ER.stats.kurz || 0) + 1;
      const eo = { kat, gross, stufe: a.siegel && a.siegel.stufe, titel: !!(a.r && a.r.titel), kurz, n: ER.serie };
      /* R14: kommt der Erfolg mit dem Sieg-Stinger (Boss-/Wächtertod), erst nach dessen Schlussakkord – sonst gingen auf Handheld
         die Fanfaren-Noten an der Stimmengrenze verloren und beides verschwimmt */
      const sg = M.lastSting && M.lastSting.sieg, wait = sg && now - sg < 3.4 && now >= sg ? sg + 3.4 - now : 0;
      if (wait > 0) { ER.stats.nachSieg = (ER.stats.nachSieg || 0) + 1; later(wait, () => M.stinger("erfolg", eo)); } else M.stinger("erfolg", eo); ER.last.stufe = a.siegel && a.siegel.stufe; ER.last.titel = !!(a.r && a.r.titel); ER.last.kurz = kurz; return true;
    }
  });
  function hookEnde() {
    if (ER.endHooked || !Z.ui || !Z.ui.ending) return; ER.endHooked = true;
    const e0 = Z.ui.ending;
    Z.ui.ending = function () { const r = e0.apply(this, arguments); try { if (M.set) { M.set("abspann"); ER.abspann = (ER.abspann || 0) + 1; } } catch (_) {} return r; };
  }
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
    TR.doors = new Set(); TR.near = null; TR.zugF = 0;
    RM.slot = null; RM.cur = RM.pend = null; RM.pendT = 0; RM.timers = []; RM.sizes = {}; RM.force = null; RM.cell = null; DR.upTo = -1e9; DR.until = 0;
  }
  /* R13: Nachläufer (Trauer nach dem Tod, Rückkehr nach dem Wächtersieg) auf der Audio-Uhr statt setTimeout –
     gleicher Abstand zum Stinger auch bei ruckelndem Bild, im Prüfstand und während Fenstern (läuft vor der Pausenprüfung) */
  const LATER = [];
  function later(s, fn) { LATER.push([A.ctx.currentTime + s, fn]); }
  KL.tick = (dt) => {
    if (!A.ok || !M.out) return;
    if (LATER.length) { const now = A.ctx.currentTime; for (let i = LATER.length - 1; i >= 0; i--) if (now >= LATER[i][0]) { const f = LATER.splice(i, 1)[0][1]; try { f(); } catch (_) {} } }
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
      if (!lv.arena && !lv.hub && !lv.passage) later(4.5, () => { if (Z.level === l0 && M.prof && M.prof.boss) M.set(l0.biome); });
    }
    W.won = !!Z.bossDefeated;
    /* Tod */
    const dead = !!(P && P.dead);
    if (dead && !W.dead) { M.stinger("tod"); const lv0 = lv; later(3.2, () => { if (Z.player && Z.player.dead && Z.level === lv0 && M.set) { M.set("trauer"); ER.trauer = (ER.trauer || 0) + 1; } }); }
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
    if (!KL.wPre) { KL.wPre = 1; preload([1, 2, 3, 4].map(i => AM("n_fuchs_" + i)).concat([KS("fx_ka_creak2")])); }
    /* Raumkulisse und Gegnerstimmen */
    try { roomTick(dt); observe(dt); climbTick(dt); transitTick(dt); } catch (e) { if (!KL.err3) { KL.err3 = 1; console.error(e); } }
    try { sonderTick(dt); } catch (e) { if (!KL.err7) { KL.err7 = 1; console.error(e); } }
    try { raeTick(); quStateTick(P); fuTick(); hlTick(); bkTick(); fgTick(); gtTick(); fsTick(); ruTick(); } catch (e) { if (!KL.err9) { KL.err9 = 1; console.error(e); } } /* R15: Rätsel/Quelle nach Zustand */
    try { rueckTick(dt); } catch (e) { if (!KL.err8) { KL.err8 = 1; console.error(e); } }
    try { tplTick(dt); } catch (e) { if (!KL.err9) { KL.err9 = 1; console.error(e); } }
    try { bewegTick(dt); } catch (e) { if (!KL.err10) { KL.err10 = 1; console.error(e); } }
    try { hookEnde(); if (ER.n < 0 && Z.meta && Z.meta.ach) ER.n = Object.keys(Z.meta.ach).length; } catch (e) { if (!KL.err12) { KL.err12 = 1; console.error(e); } }
    try { hookStimmen(); if (!VS.pre && M.prof) { VS.pre = M.prof.root; for (const [i, o] of [["kal", 2], ["glock", 3]]) for (let d = 0; d < 7; d++) { const pr = M.probe(i, M.ton(d, M.prof.root + 12 * o)); if (pr) A.load(pr.path); } } else if (M.prof && VS.pre !== M.prof.root) VS.pre = null; } catch (e) { if (!KL.err11) { KL.err11 = 1; console.error(e); } }
    /* Effekte-Dichte reiten (kern.js A.ride): ab 4 gleichzeitigen Effekten sachte zurück, bei 10+ etwa −4 dB; schnell runter, langsam wieder hoch */
    if (A.ride) { const n = A.live || 0, tgt = clamp(1 - 0.065 * (n - 3), 0.62, 1); KL.ride = tgt; A.ride.gain.setTargetAtTime(tgt, A.ctx.currentTime, tgt < A.ride.gain.value ? 0.12 : 1.1); }
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
    /* R18 Karte auf/zu (ui.js toggleMap setzt Z.ui.mapPing; kein eigener Klang): leises Papierrascheln, öffnend ein Kalimbaton hinauf, schließend hinab */
    try { const mp = (Z.ui && Z.ui.mapPing) || 0; if (KL.mapPing === undefined) KL.mapPing = mp;
      else if (mp !== KL.mapPing) { KL.mapPing = mp; KL.karteOffen = !KL.karteOffen; if (A.ok && !Z.quiet) {
        shot(AM("e_papier_" + (1 + ((Math.random() * 3) | 0))), { vol: 0.12, rate: KL.karteOffen ? 1.1 : 0.95, verb: 0.15, gap: 0.2, tag: "karte", must: true });
        tuned("kal", KL.karteOffen ? 4 : 2, 2, 0.05, 0.06, "karte2"); KL.stats.karte = (KL.stats.karte || 0) + 1; } } } catch (_) {}
    klAcc += dt || 0;
    if (!(Z.gq && Z.gq.lean) || klAcc >= 0.1) { const d = klAcc; klAcc = 0; try { KL.tick(d); } catch (e) { if (!KL.err) { KL.err = 1; console.error(e); } } }
    return r;
  };
})();
