/* Ezekiel – The Destroyer · W56 Atmo: Atmosphäre jenseits der Kulissen (nur Darstellung und Klang, keine Spielwerte)
   1) Barradins Chronik: beim ersten (und zweiten) Betreten eines Gebiets eine kurze Erzählzeile des Barden in Ich-Form,
      klein unten mittig über der Waffenleiste, erst wenn die Kapitelseite umgeblättert ist und kein wacher Gegner nahe ist. Gemerkt im eigenen
      Speicherschlüssel (zählt nur gezeigte Zeilen, nie Spielfortschritt).
   2) Ezekiel spricht kaum: seltene Ein-Wort-Sätze über seinem Kopf (Bosssieg, knapp überlebt, mehrere Gegner auf einmal wach,
      Arena betreten, lange Stille). Gemeinsame Sperrzeit, nie über einer laufenden Bossvorwarnung.
   3) Gegnerrufe: selten (Sperrzeit 16 s, Chance je Alarm), kurze Rufe in Drow-, Duergar-, Kuo-Toa-, Goblin- und Roben-Färbung.
   4) Klang: synthetische ferne Geräusche je Gebiet über den Kulissen-Bus (Amboss in Gracklstugh/Schmiede, Bojenglocke am Hafen,
      Krabbeln im Schlund, fernes Kichern in Buppidos Stollen, Herzschlag am schwarzen See und im Herz des Sees).
      Nur in Ruhe (kein wacher Gegner nahe), leise, nach dem Effekte-/Kulissen-Regler.
   5) Figurenleben: Atemwölkchen in kalten, feuchten Gebieten, Tropfen nach dem Wasser, Hitzedampf in den Glutgebieten.
   Abschalten: Z.settings.cineOff (Filmmomente aus) schaltet 1–3 ab; Grafikstufe 0 (Handheld) schaltet nur 5 ab (Worte kosten nichts); Klang folgt Ton.
   Online-Koop: alles wird nur lokal gezeichnet bzw. gespielt (nichts davon wird übertragen) – beim Gast also genau einmal,
   aus seinem eigenen Bild. Gegnerrufe und „Mehr Gäste.“ nur beim Gastgeber/Einzelspiel (der Gast sieht Schnappschüsse). Zufall nur über Math.random (nie Z.R – der Spielzufall bleibt unberührt). Farbregel: kein Blau. */
(function () {
  "use strict";
  const Z = window.Z; if (!Z || Z.atmo56) return;
  const L = v => (Z.L ? Z.L(v) : v[0]);
  const rnd = () => Math.random();
  const pick = a => a[(Math.random() * a.length) | 0];
  const errN = {};
  const safe = (tag, fn) => { try { return fn(); } catch (e) { if (!errN[tag]) { errN[tag] = 1; console.error("W56 Atmo", tag, e); } } };
  const S = () => Z.settings || {};
  const cineOn = () => !S().cineOff;
  const low = () => !!(Z.gq && Z.gq.level === 0);
  const gast = () => { const o = Z.online && Z.online.S; return !!(o && o.role === "guest" && o.playing); };
  const online = () => !!(Z.online && Z.online.S && Z.online.S.playing);
  const AT = (Z.atmo56 = { stats: { chronik: 0, ezekiel: 0, rufe: 0, klang: 0, atem: 0, tropfen: 0, dampf: 0 }, log: [] });

  /* ======================= 1. BARRADINS CHRONIK ======================= */
  const CHRONIK = {
    torhof: [["Hier begann es. Ich hatte ein Lied über einen heldenhaften Einbruch vorbereitet. Ezekiel ging einfach durchs offene Tor.", "This is where it began. I'd prepared a song about a heroic break-in. Ezekiel just walked through the open gate."],
      ["Wieder der Torhof. Ich habe beschlossen, dass das Tor beim zweiten Mal heldenhafter aussieht.", "The gate yard again. I've decided the gate looks more heroic the second time."]],
    keller: [["Für die Chronik: Der Wein war sauer, die Ratten waren groß, und Ezekiel hat beides nicht kommentiert.", "For the chronicle: the wine was sour, the rats were big, and Ezekiel commented on neither."],
      ["Ich habe ein Fass angezapft. Es hat zurückgezapft. Ich erzähle das nicht weiter.", "I tapped a barrel. It tapped back. I won't tell that one again."]],
    hallen: [["Eine Tafel für hundert Gäste. Ezekiel hat sich nicht gesetzt. Die Gäste auch nicht mehr lange.", "A table for a hundred guests. Ezekiel didn't sit down. Neither did the guests, not for long."],
      ["Die Roten Roben haben Kerzen nachgestellt. Rücksichtsvoll. Man sieht, wohin man schlägt.", "The Red Robes lit fresh candles. Considerate. You can see where you're swinging."]],
    wehrgang: [["Ich reime „Zinnen“ auf „entrinnen“. Ezekiel reimt gar nicht. Er geht einfach weiter.", "I rhyme 'ramparts' with 'dark hearts'. Ezekiel doesn't rhyme at all. He just keeps walking."],
      ["Der Wind hier oben hat mir die Laute verstimmt. Und die Pfeile meine Laune.", "The wind up here put my lute out of tune. The arrows did the same to my mood."]],
    verlies: [["Für die Chronik: Ich war nie in einer dieser Zellen. Fast nie. Einmal. Kurz.", "For the chronicle: I was never in one of these cells. Almost never. Once. Briefly."],
      ["Ezekiel kennt diese Ketten. Er sieht sie an, als schulde sie ihm etwas.", "Ezekiel knows these chains. He looks at them as if they owe him something."]],
    hafen: [["Der Hafen roch nach Fisch. Die Fische rochen nach Kuo-Toa. Ich habe aufgehört zu atmen und weitergesungen.", "The harbour smelled of fish. The fish smelled of kuo-toa. I stopped breathing and kept singing."],
      ["Irgendwo läutet eine Bojenglocke. Niemand weiß, für wen. Ich vermute: für uns.", "Somewhere a buoy bell rings. Nobody knows for whom. I suspect: for us."]],
    glocken: [["Hundert Stufen. Ich habe jede einzeln besungen. Ezekiel hat mich irgendwann getragen.", "A hundred steps. I sang of every single one. At some point Ezekiel carried me."],
      ["Der Glockenturm tickt. Ich zähle mit. Ezekiel zählt Gegner.", "The bell tower ticks. I count along. Ezekiel counts enemies."]],
    schlund: [["Spinnen. Viele Spinnen. Ich überspringe diese Strophe – Friedrich kennt sie auswendig, Rex auch.", "Spiders. Many spiders. I'll skip this verse – Friedrich knows it by heart, so does Rex."],
      ["Echo meint, die Netze singen, wenn man sie zupft. Ich habe es probiert. Sie haben zurückgezupft.", "Echo says the webs sing when you pluck them. I tried it. They plucked back."]],
    schmiede: [["Die Duergar schmieden hier Runen. Ich fragte, ob sie auch Lauten stimmen. Sie haben nicht gelacht.", "The duergar forge runes here. I asked if they also tune lutes. They didn't laugh."],
      ["Jeder Amboss hier hat einen eigenen Ton. Zusammen ergeben sie kein Lied. Nur Kopfweh.", "Every anvil here has its own note. Together they make no song. Just a headache."]],
    zinnen: [["Über uns kreisten Dämonen. Ich habe gewunken. Ein Fehler, den ich hier für die Nachwelt festhalte.", "Demons circled above us. I waved. A mistake I record here for posterity."],
      ["Der Himmel brennt immer noch. Ich habe aufgehört, mich darüber zu wundern.", "The sky is still burning. I've stopped being surprised by it."]],
    see: [["Echo sagt, der See atmet. Ich sage, der See schnarcht. Wir hatten beide recht, und keiner wollte baden.", "Echo says the lake breathes. I say the lake snores. We were both right, and nobody wanted a swim."],
      ["Unter dem Wasser schlägt etwas. Langsam. Ich habe meine Laute leiser gestimmt.", "Something beats beneath the water. Slowly. I tuned my lute down."]],
    glut: [["Gracklstugh, die Stadt der Klingen. Jeder Hammerschlag ein Takt. Ich hätte mitgetrommelt, wären nicht alle Trommler Duergar.", "Gracklstugh, the City of Blades. Every hammer blow a beat. I'd have drummed along, if all the drummers weren't duergar."],
      ["Das Feuer hier ist grün. Ezekiel hat es angesehen und „Hm.“ gesagt. Ich halte das für Bewunderung.", "The fire here is green. Ezekiel looked at it and said 'Hm.' I take that as admiration."]],
    sturm: [["Donnerbaum. Die Bäume wollten uns fressen, der Himmel uns erschlagen. Ein gewöhnlicher Dienstag für Ezekiel.", "Thundertree. The trees wanted to eat us, the sky wanted to strike us down. An ordinary Tuesday for Ezekiel."],
      ["Ich schreibe diese Zeile im Regen. Falls sie verwischt ist: Es war heldenhaft.", "I write this line in the rain. If it's smudged: it was heroic."]],
    stollen: [["Buppido lud uns freundlich in seine Stollen ein. Merke: Wer freundlich in Stollen einlädt, hat Gründe.", "Buppido kindly invited us into his tunnels. Note: whoever kindly invites you into tunnels has reasons."],
      ["Von irgendwo kichert es. Ich hoffe, es ist ein Echo. Ich fürchte, es ist keins.", "Something giggles somewhere. I hope it's an echo. I fear it isn't."]]
  };
  const KEY = "zs-w56-atmo";
  let mem = null;
  function memLoad() { if (mem) return mem; try { mem = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (_) { mem = {}; } if (!mem.c || typeof mem.c !== "object") mem.c = {}; return mem; }
  function memSave() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (_) {} }
  let box = null, pending = null, shown = null;
  function ensureBox() {
    if (box && box.isConnected) return box;
    const st = document.createElement("style");
    st.textContent = "#w56-chronik{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 19vh);transform:translate(-50%,-6px);max-width:min(560px,82vw);" +
      "padding:7px 16px 8px;pointer-events:none;z-index:9;opacity:0;transition:opacity .9s ease,transform .9s ease;text-align:center;" +
      "font:italic 500 calc(15px * var(--ui,1)) 'Alegreya','Alegreya Sans',Georgia,serif;line-height:1.35;color:#f0e2c4;" +
      "background:linear-gradient(90deg,rgba(24,14,10,0),rgba(24,14,10,.78) 14%,rgba(24,14,10,.78) 86%,rgba(24,14,10,0));" +
      "text-shadow:0 1px 2px #000,0 0 8px rgba(0,0,0,.6)}" +
      "#w56-chronik.an{opacity:1;transform:translate(-50%,0)}" +
      "#w56-chronik b{display:block;font:normal 700 calc(10.5px * var(--ui,1)) 'Alegreya Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#d9a45a;margin-top:3px;font-style:normal}" +
      "#w56-chronik b::before,#w56-chronik b::after{content:'';display:inline-block;width:22px;height:1px;background:#8a5a2a;vertical-align:middle;margin:0 7px}" +
      "body.bosskampf #w56-chronik{display:none}";
    document.head.appendChild(st);
    box = document.createElement("div"); box.id = "w56-chronik"; box.setAttribute("aria-live", "polite"); box.hidden = true;
    document.body.appendChild(box);
    return box;
  }
  function chronikPlan(lv) {
    pending = null; hideChronik(true);
    if (!lv || lv.hub || lv.arena || lv.passage) return;
    const b = lv.biome || lv.id, lines = CHRONIK[b]; if (!lines) return;
    const m = memLoad(), n = m.c[b] | 0; if (n >= lines.length) return;
    pending = { b, i: n, txt: lines[n], t: 0, lv };
  }
  function calmNear(r) {
    const P = Z.player; if (!P) return false;
    for (const e of Z.enemies || []) if (!e.dead && e.aware && Math.abs(e.x - P.x) < r && Math.abs(e.y - P.y) < r * 0.7) return false;
    return true;
  }
  function bookBusy() { try { const s = Z.uebergang && Z.uebergang.state && Z.uebergang.state(); return !!(s && (s.book || s.pan != null || s.climax != null || s.plate)); } catch (_) { return false; } }
  function hideChronik(now) { if (!box || !shown) return; box.classList.remove("an"); const b = box; shown = null; if (now) b.hidden = true; else setTimeout(() => { if (!shown) b.hidden = true; }, 950); }
  function chronikTick(dt) {
    if (shown) {
      shown.t += dt;
      if (shown.t > shown.life || !Z.level || Z.level !== shown.lv || (Z.ui && Z.ui.modalOpen) || !cineOn()) hideChronik(false);
      return;
    }
    if (!pending) return;
    if (!cineOn() || !Z.level || Z.level !== pending.lv) { pending = null; return; }
    if (Z.paused || (Z.ui && Z.ui.modalOpen) || bookBusy() || document.body.classList.contains("bosskampf") || document.body.classList.contains("banner-an")) return;
    pending.t += dt;
    if (pending.t < 1.2) return;                   /* erst ankommen (und Gebietsbanner abwarten) */
    if (pending.t > 40) { pending = null; return; } /* Kampf ohne Pause: dieses Mal nicht */
    if (!calmNear(230)) return;
    const p = pending; pending = null;
    const el = ensureBox();
    el.innerHTML = "„" + esc(L(p.txt)) + "“<b>" + esc(L(["Barradins Chronik", "Barradin's Chronicle"])) + "</b>";
    el.hidden = false; void el.offsetWidth; el.classList.add("an");
    shown = { t: 0, life: Math.min(9.5, 4.2 + L(p.txt).length * 0.045), lv: p.lv };
    const m = memLoad(); m.c[p.b] = (m.c[p.b] | 0) + 1; memSave();
    AT.stats.chronik++; AT.log.push(["chronik", p.b, p.i]);
    safe("chronikKlang", () => zither());
  }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ======================= 2./3. WORTE ÜBER KÖPFEN ======================= */
  const WORTE = []; /* { ent, txt, t, life, col, ez } */
  function sagen(ent, txt, o) {
    o = o || {};
    for (let i = WORTE.length - 1; i >= 0; i--) if (WORTE[i].ent === ent) WORTE.splice(i, 1);
    WORTE.push({ ent, txt: String(txt), t: 0, life: o.life || 2.2, col: o.col || "#f0e2c4", ez: !!o.ez });
    if (WORTE.length > 5) WORTE.shift();
  }
  function warnungAktiv() {
    /* nie über einer Vorwarnung: Boss holt aus / Gegner hinter dir / Bodenwarnung nahe */
    const P = Z.player; if (!P) return true;
    if (Z.boss && !Z.bossDefeated && Z.boss.act) return true;
    for (const h of Z.hazards || []) if (h && h.warn && Math.abs(h.x - P.x) < 160) return true;
    return false;
  }
  function drawWorte(c) {
    if (!WORTE.length) return;
    c.save(); c.textAlign = "center"; c.textBaseline = "alphabetic";
    for (const w of WORTE) {
      const e = w.ent; if (!e || e.gone) continue;
      const k = Math.min(1, w.t / 0.18, (w.life - w.t) / 0.45); if (k <= 0) continue;
      const x = e.x + e.w / 2, y = e.y - (w.ez ? 12 : 17) - Math.min(1, w.t / 0.25) * 3;
      c.globalAlpha = k;
      c.font = (w.ez ? "italic 700 7.4px " : "italic 600 6.4px ") + "'Alegreya','Alegreya Sans',Georgia,serif";
      c.lineWidth = 2.4; c.strokeStyle = "rgba(14,8,6,.92)"; c.strokeText(w.txt, x, y);
      c.fillStyle = w.col; c.fillText(w.txt, x, y);
    }
    c.restore(); c.globalAlpha = 1;
  }
  function worteTick(dt) {
    for (let i = WORTE.length - 1; i >= 0; i--) { const w = WORTE[i]; w.t += dt; if (w.t > w.life || !w.ent || w.ent.dead) WORTE.splice(i, 1); }
  }

  /* Ezekiel: wenige Worte, selten */
  const EZ = {
    sieg: [["Zu spät.", "Too late."], ["Hm.", "Hm."], ["Weiter.", "Onward."]],
    knapp: [["Noch nicht.", "Not yet."], ["Hm.", "Hm."]],
    gaeste: [["Mehr Gäste.", "More guests."], ["Hm. Viele.", "Hm. Many."]],
    arena: [["Hm.", "Hm."], ["Endlich.", "Finally."]],
    still: [["…", "…"], ["Hm.", "Hm."]]
  };
  const ez = { cd: 6, last: "", idleT: 0, hp: null, bossWas: null, alertT: 0, alertN: 0, arenaT: -1, lv: null };
  function ezSag(kind, force) {
    if (!cineOn() || !Z.player || !Z.level || Z.level.hub) return false;
    if (!force && (ez.cd > 0 || warnungAktiv())) return false;
    const P = Z.player; if (P.dead || P.hp <= 0) return false;
    let t = pick(EZ[kind]); if (L(t) === ez.last && EZ[kind].length > 1) t = pick(EZ[kind]);
    ez.last = L(t); ez.cd = 28 + rnd() * 14;
    sagen(P, L(t), { ez: true, life: 2.1, col: "#f4d9a8" });
    AT.stats.ezekiel++; AT.log.push(["ezekiel", kind]);
    return true;
  }
  function ezTick(dt) {
    const P = Z.player, lv = Z.level; if (!P || !lv) return;
    if (ez.lv !== lv) { ez.lv = lv; ez.hp = null; ez.bossWas = null; ez.alertN = 0; ez.arenaT = lv.arena ? 2.6 : -1; ez.idleT = 0; }
    ez.cd = Math.max(0, ez.cd - dt);
    /* Bosssieg */
    const bd = !!(Z.boss && Z.bossDefeated);
    if (ez.bossWas === false && bd) { ez.cd = 0; setTimeout(() => safe("ezSieg", () => ezSag("sieg", true)), 1400); }
    ez.bossWas = Z.boss ? bd : null;
    /* knapp überlebt: Treffer bringt unter 18 % */
    if (P.hpMax > 0 && ez.hp != null && P.hp < ez.hp && P.hp > 0 && P.hp / P.hpMax < 0.18 && ez.hp / P.hpMax >= 0.18 && rnd() < 0.6) ezSag("knapp");
    ez.hp = P.hp;
    /* Arena betreten */
    if (ez.arenaT > 0) { ez.arenaT -= dt; if (ez.arenaT <= 0 && rnd() < 0.7) ezSag("arena", false); }
    /* viele auf einmal wach (in alarmTick gezählt) */
    if (ez.alertT > 0) { ez.alertT -= dt; if (ez.alertT <= 0) { if (ez.alertN >= 3 && rnd() < 0.55) ezSag("gaeste"); ez.alertN = 0; } }
    /* lange Stille */
    const still = Math.abs(P.vx || 0) < 4 && !P.act && P.onGround !== false;
    ez.idleT = still && calmNear(260) ? ez.idleT + dt : 0;
    if (ez.idleT > 14) { ez.idleT = -30; if (rnd() < 0.5) ezSag("still"); }
  }

  /* Gegnerrufe nach Volk (Präfix der Gegner-Kennung) */
  const RUFE = [
    [/^drow|^drider/, [["Iblith!", "Iblith!"], ["Für Lolth!", "For Lolth!"], ["Oberflächenbrut!", "Surface filth!"], ["Ssussun … nein. Dunkel!", "Ssussun … no. Darkness!"]], "#e8c8e0"],
    [/^duergar/, [["Für Laduguer!", "For Laduguer!"], ["Ein Gehörnter! Holt die Ketten!", "A horned one! Fetch the chains!"], ["Graues Eisen!", "Grey iron!"], ["Der zahlt Zoll!", "He pays the toll!"]], "#d8c8a8"],
    [/^kuotoa|^peitscher/, [["Blibdoolpoolp!", "Blibdoolpoolp!"], ["Trockenhaut!", "Dry-skin!"], ["Zur Mutter mit ihm!", "Take him to the Mother!"]], "#c8d8a8"],
    [/^goblin|^wolfsreiter/, [["Hornkopf!", "Hornhead!"], ["Meins! Meins!", "Mine! Mine!"], ["Der Große! Lauf!", "The big one! Run!"]], "#d8d0a0"],
    [/^robe|^adept/, [["Für den Roten Zauberer!", "For the Red Wizard!"], ["Eindringling!", "Intruder!"], ["Ruft den Meister!", "Call the master!"]], "#f0c0a8"],
    [/^schmuggler|^soeldner/, [["Hey! Kein Zutritt!", "Hey! No entry!"], ["Das kostet extra.", "That costs extra."]], "#e0d0b8"],
    [/^leichenskelett|^ghul/, [["… Gast … für … Buppido …", "… guest … for … Buppido …"]], "#d8d0c0"]
  ];
  const ruf = { cd: 8 };
  const seen = new WeakSet();
  function alarmTick(dt) {
    ruf.cd = Math.max(0, ruf.cd - dt);
    const P = Z.player; if (!P || !Z.level || Z.level.hub) return;
    /* Online-Gast: Gegner kommen als Schnappschüsse (Objekte können neu entstehen) – dort keine Rufe, kein „Mehr Gäste.“ */
    if (gast()) return;
    for (const e of Z.enemies || []) {
      if (!e || e.dead || !e.aware || seen.has(e)) continue;
      seen.add(e);
      if (!e.def || e.def.boss || e.dummy) continue;
      if (Math.abs(e.x - P.x) > 300 || Math.abs(e.y - P.y) > 180) continue;
      ez.alertN++; if (ez.alertT <= 0) ez.alertT = 1.4;
      if (!cineOn() || ruf.cd > 0 || rnd() > 0.22 || warnungAktiv()) continue;
      const id = String(e.id || ""), r = RUFE.find(x => x[0].test(id)); if (!r) continue;
      ruf.cd = 16 + rnd() * 10;
      sagen(e, L(pick(r[1])), { col: r[2], life: 1.9 });
      AT.stats.rufe++; AT.log.push(["ruf", id]);
    }
  }

  /* ======================= 4. KLANG ======================= */
  const A = Z.audio;
  function bus() { return A && A.ok && A.ctx && A.amb ? A.amb : null; }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function out(pan, vol) {
    const c = A.ctx, g = c.createGain(); g.gain.value = vol;
    let n = g;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; }
    n.connect(bus());
    try { if (A.verbA) { const v = c.createGain(); v.gain.value = 0.6; g.connect(v); v.connect(A.verbA); } } catch (_) {}
    return g;
  }
  function tone(o) { /* {f, f2, type, a, d, peak, at, dst, lp} */
    const c = A.ctx, t = c.currentTime + (o.at || 0), os = c.createOscillator(), g = c.createGain();
    os.type = o.type || "sine"; os.frequency.setValueAtTime(o.f, t); if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.a || 0.01) + (o.d || 0.3));
    env(g, t, o.a || 0.005, o.peak || 0.3, o.d || 0.3);
    let n = os; if (o.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; os.connect(f); n = f; }
    n.connect(g); g.connect(o.dst); os.start(t); os.stop(t + (o.a || 0.005) + (o.d || 0.3) + 0.05);
  }
  let noiseBuf = null;
  function noise(o) {
    const c = A.ctx;
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate | 0, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = c.currentTime + (o.at || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; f.type = o.ft || "bandpass"; f.frequency.value = o.f || 2000; f.Q.value = o.q || 4;
    env(g, t, o.a || 0.002, o.peak || 0.2, o.d || 0.04);
    s.connect(f); f.connect(g); g.connect(o.dst); s.start(t, Math.random() * 0.5); s.stop(t + (o.a || 0.002) + (o.d || 0.04) + 0.05);
  }
  const FERN = {
    /* fernes Ambossklingen: zwei unharmonische Teiltöne, 2–3 Schläge */
    amboss: (dst) => { const n = 2 + (rnd() < 0.5 ? 1 : 0), f = 820 + rnd() * 260; for (let i = 0; i < n; i++) { const at = i * (0.42 + rnd() * 0.08); tone({ f, type: "sine", d: 0.9, peak: 0.22, at, dst }); tone({ f: f * 2.76, type: "sine", d: 0.35, peak: 0.08, at, dst }); noise({ f: 3200, q: 1.5, d: 0.03, peak: 0.12, at, dst }); } },
    /* Bojenglocke: tiefer, schwebender Glockenton */
    boje: (dst) => { const f = 196 + (rnd() < 0.5 ? 0 : 24); tone({ f, d: 3.2, peak: 0.26, dst }); tone({ f: f * 2.4, d: 1.6, peak: 0.08, dst }); tone({ f: f * 1.003, d: 3, peak: 0.12, dst }); },
    /* Krabbeln: schnelle, leise Klicks */
    krabbeln: (dst) => { const n = 9 + ((rnd() * 8) | 0); let at = 0; for (let i = 0; i < n; i++) { at += 0.028 + rnd() * 0.05; noise({ f: 2600 + rnd() * 2400, q: 6, d: 0.012, peak: 0.16, at, dst }); } },
    /* fernes Kichern: drei, vier gezwitscherte Silben mit Formant */
    kichern: (dst) => { const n = 3 + ((rnd() * 3) | 0), f0 = 380 + rnd() * 120; for (let i = 0; i < n; i++) tone({ f: f0 * (1 + i * 0.06), f2: f0 * (1.25 + i * 0.06), type: "triangle", a: 0.015, d: 0.09, peak: 0.12, at: i * 0.13, lp: 1800, dst }); },
    /* Tropfen in großer Höhle */
    tropfen: (dst) => { tone({ f: 900 + rnd() * 500, f2: 1900 + rnd() * 600, d: 0.12, peak: 0.18, dst }); },
    /* fernes Grollen (Stein setzt sich) */
    grollen: (dst) => { noise({ ft: "lowpass", f: 140, q: 0.7, a: 0.4, d: 1.8, peak: 0.35, dst }); }
  };
  const FERN_JE = {
    glut: [["amboss", 9, 16]], schmiede: [["amboss", 11, 20], ["grollen", 40, 30]],
    hafen: [["boje", 22, 18]], schlund: [["krabbeln", 12, 14], ["tropfen", 9, 10]],
    stollen: [["kichern", 26, 22], ["tropfen", 10, 10], ["grollen", 35, 25]],
    see: [["tropfen", 8, 8]], verlies: [["grollen", 30, 30]], keller: [["tropfen", 14, 12]]
  };
  const kl = { next: {}, lv: null, beat: 0, beatOn: false };
  function klangTick(dt) {
    const lv = Z.level, b = bus(); if (!lv || !b || Z.paused || lv.hub || A.ctx.state !== "running") return;
    if (kl.lv !== lv) { kl.lv = lv; kl.next = {}; kl.beat = 2; }
    if (A.fxAn && !A.fxAn()) return;
    const calm = calmNear(320);
    const list = FERN_JE[lv.biome] || [];
    for (const [k, base, jit] of list) {
      if (kl.next[k] == null) kl.next[k] = base * 0.4 + rnd() * jit;
      kl.next[k] -= dt;
      if (kl.next[k] > 0) continue;
      kl.next[k] = base + rnd() * jit;
      if (!calm) continue;
      safe("fern", () => { FERN[k](out(rnd() * 1.6 - 0.8, 0.45)); AT.stats.klang++; AT.log.push(["klang", k]); });
    }
    /* Herzschlag: im Herz des Sees deutlich (schneller, wenn Demogorgon wütet), am schwarzen See tief unten ganz leise */
    let hv = 0, bpm = 46;
    if (lv.id === "demogorgon" || (lv.arena && lv.biome === "see" && Z.boss)) { hv = 0.5; if (Z.boss && Z.boss.hpMax > 0) bpm = 48 + 26 * (1 - Math.max(0, Z.boss.hp) / Z.boss.hpMax); if (Z.bossDefeated) hv = 0; }
    else if (lv.biome === "see" && !lv.arena && Z.player && lv.h) { const tiefe = Z.player.y / (lv.h * (Z.TILE || 16)); hv = tiefe > 0.55 ? 0.22 * Math.min(1, (tiefe - 0.55) / 0.3) : 0; }
    if (hv > 0.01) {
      kl.beat -= dt;
      if (kl.beat <= 0) {
        kl.beat = 60 / bpm;
        safe("herz", () => { const d = out(0, hv); tone({ f: 58, f2: 40, d: 0.22, peak: 0.6, dst: d }); tone({ f: 52, f2: 36, d: 0.26, peak: 0.42, at: 0.24, dst: d }); });
        AT.stats.herz = (AT.stats.herz | 0) + 1;
      }
    }
  }
  /* Chronik-Zupfer: zwei leise Zithertöne (Quinte) */
  function zither() {
    const b = bus(); if (!b || A.ctx.state !== "running") return;
    const d = out(0, 0.35), f = 293.7;
    tone({ f, type: "triangle", d: 1.2, peak: 0.18, lp: 2400, dst: d }); tone({ f: f * 1.5, type: "triangle", d: 1.4, peak: 0.14, at: 0.16, lp: 2400, dst: d });
  }

  /* ======================= 5. FIGURENLEBEN ======================= */
  const KALT = { see: 1, hafen: 1, wehrgang: 0.8, glocken: 0.6, keller: 0.5, verlies: 0.6, sturm: 0.7, torhof: 0.4 };
  const HEISS = { glut: 1, schmiede: 0.8 };
  const fl = { atem: 1, nass: 0, tropf: 0, dampf: 2 };
  function lebenTick(dt) {
    const P = Z.player, lv = Z.level, FX = Z.fx; if (!P || !lv || lv.hub || low() || !FX || Z.paused || P.dead) return;
    const b = lv.biome, cx = P.x + P.w / 2, face = P.face || 1;
    /* Wasser: Füße oder Mitte im Wasser → 5 s nass */
    const W = Z.world, T = Z.TILE || 16;
    if (W && W.tile) { const tx = Math.floor(cx / T), ty = Math.floor((P.y + P.h - 2) / T); if (W.tile(tx, ty) === 6 || W.tile(tx, ty + 1) === 6 && (P.vy || 0) > 0) fl.nass = 5; }
    if (fl.nass > 0) {
      fl.nass -= dt; fl.tropf -= dt;
      if (fl.tropf <= 0) { fl.tropf = 0.12 + rnd() * 0.22; FX.p({ x: P.x + 2 + rnd() * (P.w - 4), y: P.y + P.h * (0.35 + rnd() * 0.4), vx: (P.vx || 0) * 0.2, vy: 10, g: 420, life: 0.6, size: 1.4, col: "rgba(200,220,200,.75)", kind: "drop", collide: true }); AT.stats.tropfen++; }
    }
    /* Atem in der Kälte (nicht unter Wasser/nass gerade erst raus) */
    const k = KALT[b] || 0;
    if (k > 0) {
      fl.atem -= dt * (Math.abs(P.vx || 0) > 40 ? 1.6 : 1);
      if (fl.atem <= 0) {
        fl.atem = 2.4 + rnd() * 1.6;
        if (rnd() < k) { const hx = cx + face * (P.w * 0.34), hy = P.y + 7; for (let i = 0; i < 3; i++) FX.p({ x: hx + face * i, y: hy + rnd(), vx: face * (12 + rnd() * 10) + (P.vx || 0) * 0.3, vy: -4 - rnd() * 4, life: 0.9 + rnd() * 0.5, size: 1.6 + rnd(), col: "rgba(236,230,220,.5)", kind: "smoke", drag: 0.94 }); AT.stats.atem++; }
      }
    }
    /* Hitze: Dampf und Funkenstaub steigt von den Schultern */
    const h = HEISS[b] || 0;
    if (h > 0) {
      fl.dampf -= dt;
      if (fl.dampf <= 0) { fl.dampf = 0.5 + rnd() * 0.9; if (rnd() < h) { FX.p({ x: P.x + rnd() * P.w, y: P.y + 4, vx: (rnd() - 0.5) * 6, vy: -16 - rnd() * 8, life: 1.2, size: 1.8, col: "rgba(210,190,170,.32)", kind: "smoke", drag: 0.95 }); if (rnd() < 0.35) FX.p({ x: P.x + rnd() * P.w, y: P.y + 6, vx: (rnd() - 0.5) * 8, vy: -24, life: 0.8, size: 1, col: "#ffb060", kind: "ember", add: true }); AT.stats.dampf++; } }
    }
  }

  /* ======================= EINHÄNGEN ======================= */
  const FXo = Z.fx;
  if (FXo && typeof FXo.update === "function") {
    const up0 = FXo.update;
    FXo.update = function (dt) {
      const r = up0.apply(this, arguments);
      const d = Math.min(0.05, Math.max(0, +dt || 0));
      safe("chronik", () => chronikTick(d)); safe("worte", () => worteTick(d)); safe("ez", () => ezTick(d));
      safe("alarm", () => alarmTick(d)); safe("klang", () => klangTick(d)); safe("leben", () => lebenTick(d));
      return r;
    };
  }
  if (FXo && typeof FXo.draw === "function") {
    const dr0 = FXo.draw;
    FXo.draw = function (c, front) { const r = dr0.apply(this, arguments); if (front) safe("zeichnen", () => drawWorte(c)); return r; };
  }
  const neu = () => safe("plan", () => { chronikPlan(Z.level); WORTE.length = 0; });
  if (Z.haken) Z.haken.nach("loadArea", "w56atmo", neu);
  else if (typeof Z.loadArea === "function") { const la0 = Z.loadArea; Z.loadArea = function () { const r = la0.apply(this, arguments); neu(); return r; }; }
  /* Online-Gast: Gebiete kommen über das Netz (kein loadArea) – Gebietswechsel am Takt erkennen */
  let lvSeen = null;
  setInterval(() => { if (Z.level !== lvSeen) { const war = lvSeen; lvSeen = Z.level; if (war !== null && (!pending || pending.lv !== Z.level) && (!shown || shown.lv !== Z.level) && online()) neu(); } }, 500);

  /* Prüfhilfen */
  AT.sagen = (txt) => { if (Z.player) sagen(Z.player, txt, { ez: true }); };
  AT.ez = kind => ezSag(kind, true);
  AT.worte = () => WORTE.map(w => ({ txt: w.txt, ez: w.ez, t: +w.t.toFixed(2) }));
  AT.chronik = () => ({ pending: pending ? { b: pending.b, i: pending.i, t: +pending.t.toFixed(2) } : null, shown: shown ? { t: +shown.t.toFixed(2), txt: box && box.textContent } : null, mem: memLoad().c });
  AT.fern = k => { const b = bus(); if (!b || !FERN[k]) return false; FERN[k](out(0, 0.45)); return true; };
  AT.rufFrei = () => { ruf.cd = 0; };
  AT.reset = () => { mem = { c: {} }; memSave(); };
  AT.texte = { CHRONIK, EZ, RUFE };
})();
