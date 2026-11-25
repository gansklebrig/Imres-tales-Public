/* Ezekiel – The Destroyer · Spielablauf
   Lager → Torhof → Gebiete nach Wahl → Durchgänge → Wächter und Bosse → eines von drei Enden.
   Meta-Fortschritt: Seelensplitter, Schmiede-Stufen, Fundglück, Schädel (Schwierigkeit), Fundbuch. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, W = Z.world, L = v => Z.L(v), inp = Z.input;

  /* ======================= META-SPEICHER ======================= */
  /* W19 Slots: zentrale Speicher-Schicht mit drei Spielständen.
     Spielfortschritt (alles in Z.meta: Splitter, Schmiede, Fundbuch, Erfolge, Runen, Lager-Stufen, Bestzeiten, Nemesis, Tagebuch …)
     liegt je Spielstand unter „imres-zerstoerer-s<n>-v1“. Einstellungen (Grafik, Ton, Tasten, Sprache) bleiben global (kern.js).
     „imres-zerstoerer-v1“ (altes Einzel-Format) bleibt ein Spiegel des aktiven Spielstands – der Spielesaal (spielesaal.js) und
     ältere Programmstände lesen ihn weiter. Migration: der alte Stand wird beim ersten Start Spielstand 1 (plus Sicherungskopie). */
  const KEY = "imres-zerstoerer-v1";
  const SKEY = n => "imres-zerstoerer-s" + n + "-v1", AKT = "imres-zerstoerer-slot", MIG = "imres-zerstoerer-slotmig", BAK = "imres-zerstoerer-v1-vorW19";
  const WEG = n => "imres-zerstoerer-s" + n + "-weg"; /* letzter gelöschter/überschriebener Stand je Platz (Rettungsanker) */
  const NSLOT = 3;
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return localStorage.getItem(k) === v; } catch (_) { return false; } },
    del: k => { try { localStorage.removeItem(k); } catch (_) {} }
  };
  const META0 = () => ({ v: 1, shards: 0, wlvl: {}, luck: {}, found: {}, up: { trank: 0, zaeh: 0, klingen: 0, haendler: 0 }, skulls: 0, skullSel: 0, endings: {}, runs: 0, wins: 0, best: { time: 0, kills: 0 }, seen: {}, bosses: {}, intro: false, tut: false, forge: {} });
  /* gegen kaputte Speicherstände absichern: Objektfelder nur als Objekt, Zahlen nur endlich */
  function parseMeta(raw) {
    let s = null; try { s = JSON.parse(raw || "null"); } catch (_) { s = null; }
    const m = META0();
    if (!s || s.v !== 1) return m;
    for (const k in s) {
      const v = s[k], d = m[k];
      if (d && typeof d === "object") { if (v && typeof v === "object" && !Array.isArray(v)) m[k] = Object.assign(d, v); }
      else if (typeof d === "number") { if (Number.isFinite(v)) m[k] = v; }
      else if (typeof d === "boolean") m[k] = !!v;
      else if (v !== null && v !== undefined) m[k] = v;
    }
    return m;
  }
  /* Migration (einmalig): alter Einzel-Stand → Spielstand 1; erst wenn die Kopie nachweislich geschrieben ist, gilt sie als erledigt */
  if (!ls.get(MIG)) {
    const old = ls.get(KEY);
    let ok = true;
    if (old) {
      if (!ls.get(BAK)) ls.set(BAK, old);
      if (!ls.get(SKEY(1))) ok = ls.set(SKEY(1), old);
    }
    if (ok) { ls.set(MIG, "1"); if (!ls.get(AKT)) ls.set(AKT, "1"); }
  }
  let slot = Math.max(1, Math.min(NSLOT, parseInt(ls.get(AKT), 10) || 1));
  { const raw = ls.get(SKEY(slot)); if (raw && !/^\s*\{/.test(raw)) ls.set(SKEY(slot) + "-kaputt", raw); }
  Z.meta = parseMeta(ls.get(SKEY(slot)) || (ls.get(MIG) ? null : ls.get(KEY)));
  Z.saveMeta = () => {
    if (!Z.meta) return;
    Z.meta.zuletzt = Date.now();
    const s = JSON.stringify(Z.meta);
    ls.set(SKEY(slot), s); ls.set(KEY, s);
  };
  /* Fortschritt ja/nein, Kurzübersicht je Platz (Titelbild, Spielstand-Auswahl) */
  const hasProgress = m => !!(m && ((m.runs | 0) > 0 || m.intro || (m.shards | 0) > 0 || (m.wins | 0) > 0));
  function areaOf(m) {
    /* höchstes erreichtes Gebiet: mitgeschrieben (meta.gebiet) – ältere Stände: aus den getroffenen Wächtern/Bossen abgeleitet */
    let best = null;
    const take = (id, tier) => { if (id && Number.isFinite(tier) && (!best || tier > best.tier)) best = { id, tier }; };
    if (m.gebiet && typeof m.gebiet === "object") take(m.gebiet.id, m.gebiet.tier);
    const B = Z.BIOMES || {}, AR = Z.ARENAS || {};
    for (const b in m.bosses || {}) {
      for (const id in B) if (B[id].warden === b) take(id, B[id].tier);
      for (const id in AR) if (AR[id].boss === b) take(id, AR[id].tier);
    }
    if (!best && (m.runs | 0) > 0) take("torhof", 0);
    if (!best) return null;
    const d = B[best.id] || AR[best.id];
    return { id: best.id, tier: best.tier, name: d && d.name ? d.name : [best.id, best.id] };
  }
  const swapHooks = (Z._slotSwap = Z._slotSwap || []); /* früher geladene Module (klang.js) melden sich hier an */
  Z.slots = {
    N: NSLOT,
    active: () => slot,
    key: SKEY,
    raw: n => ls.get(SKEY(n)),
    meta: n => (n === slot ? Z.meta : parseMeta(ls.get(SKEY(n)))),
    has: n => hasProgress(Z.slots.meta(n)),
    info(n) {
      const m = Z.slots.meta(n), on = hasProgress(m);
      return { n, leer: !on, runs: m.runs | 0, wins: m.wins | 0, enden: Object.keys(m.endings || {}).filter(k => m.endings[k]).length, gebiet: on ? areaOf(m) : null, zeit: Math.max(0, +m.spielzeit || 0), zuletzt: +m.zuletzt || 0, aktiv: n === slot };
    },
    /* zuletzt benutzter Platz mit Fortschritt (für „Weiterspielen“) – bevorzugt der aktive */
    last() {
      if (Z.slots.has(slot)) return slot;
      let b = 0, bt = -1;
      for (let n = 1; n <= NSLOT; n++) { const i = Z.slots.info(n); if (!i.leer && i.zuletzt > bt) { bt = i.zuletzt; b = n; } }
      return b || 0;
    },
    onSwap: fn => { if (typeof fn === "function") swapHooks.push(fn); },
    /* Platz wechseln (nur vom Titelbild aus): Z.meta tauschen und Module ihre Meta-Felder neu anlegen lassen */
    use(n, frisch) {
      n = Math.max(1, Math.min(NSLOT, n | 0));
      if (n !== slot && Z.level && hasProgress(Z.meta)) Z.saveMeta();
      slot = n; ls.set(AKT, String(n));
      Z.meta = frisch ? META0() : parseMeta(ls.get(SKEY(n)));
      const raw = ls.get(SKEY(n)); if (raw && !frisch) ls.set(KEY, raw); else ls.del(KEY);
      for (const fn of swapHooks) { try { fn(n); } catch (e) { console.error(e); } }
      return Z.meta;
    },
    /* Neues Spiel auf Platz n (überschreibt – vorher Sicherung unter -weg) */
    neu(n) {
      const raw = ls.get(SKEY(n)); if (raw && hasProgress(parseMeta(raw))) ls.set(WEG(n), raw);
      ls.del(SKEY(n));
      return Z.slots.use(n, true);
    },
    loeschen(n) {
      const raw = ls.get(SKEY(n)); if (raw && hasProgress(parseMeta(raw))) ls.set(WEG(n), raw);
      ls.del(SKEY(n));
      if (n === slot) { Z.meta = META0(); ls.del(KEY); for (const fn of swapHooks) { try { fn(n); } catch (e) { console.error(e); } } }
    },
    kopieren(a, b) {
      if (a === b) return false;
      if (a === slot && Z.level && Z.meta) Z.saveMeta(); /* auf dem Titelbild ist der Speicher schon aktuell */
      const src = ls.get(SKEY(a)); if (!src) return false;
      const raw = ls.get(SKEY(b)); if (raw && hasProgress(parseMeta(raw))) ls.set(WEG(b), raw);
      if (!ls.set(SKEY(b), src)) return false;
      if (b === slot) Z.slots.use(b);
      return true;
    },
    areaOf, parse: parseMeta, fresh: META0
  };
  /* Spielzeit je Spielstand (nur solange ein Gebiet läuft, sichtbar und nicht pausiert) */
  setInterval(() => { if (Z.level && !Z.paused && !document.hidden && Z.meta) Z.meta.spielzeit = (+Z.meta.spielzeit || 0) + 5; }, 5000);
  addEventListener("pagehide", () => { if (Z.level && Z.meta) Z.saveMeta(); });

  /* Sondergebiete für die Darstellung */
  const HUB_B = { flow: "flat", out: true, name: ["Das Lager vor der Feste", "The Camp before the Keep"], sky: ["#1a1020", "#4a2434", "#8a4a3a"], wall: "#2a2224", brick: "#1a1416", tile: { base: "#3e3a30", light: "#6a5e44", dark: "#1e1a14", det: "#4a4a30", top: "moss", topCol: "#4a5a2a" }, plat: "#6a4a30", dark: 0.32, ambCol: "#4a2a2a", bg: "camp", weather: ["fireflies", "leaves"], props: {}, amb: { loops: [["amb/a_lagerfeuer.mp3", 0.5], ["amb/a_nacht.mp3", 0.35]], one: [["e_eule_", 4, 14]] } };
  const PASS_B = { flow: "flat", name: ["Durchgang", "Passage"], sky: ["#140c0c", "#24160e", "#2e1c12"], wall: "#3a2a22", brick: "#261a14", tile: { base: "#5a4a3a", light: "#8a7058", dark: "#221a14", det: "#6a5440", top: "carpet", topCol: "#6a1a1a" }, plat: "#6e4a2c", dark: 0.35, ambCol: "#5a3a1a", bg: "passage", weather: ["dust", "embers"], props: {}, amb: { loops: [["amb/a_feuer1.mp3", 0.3], ["amb/a_halle.mp3", 0.2]], one: [] } };

  /* Lager: Ankunftspunkt links vom Waffenständer, damit der Weg zum Tor an der Start-Ausrüstung vorbeiführt */
  Z.interacts = [];
  const hub0 = Z.genHub;
  Z.genHub = function () { const lv = hub0.apply(this, arguments); if (lv && lv.start) lv.start = { x: Math.min(lv.start.x, 53 + (lv.ox || 0)), y: lv.start.y }; return lv; };

  /* ======================= ZUSATZ-GEGNER: Trainingspuppe ======================= */
  Z.ENEMIES.puppe = { n: ["Trainingspuppe", "Training Dummy"], shape: "dummy", w: 14, h: 30, hp: 40, dmg: 0, spd: 0, ai: "turret", sight: 0, gold: 0, noBlock: true, heavy: true, atks: [], poise: 99 };

  /* ======================= BEUTE ======================= */
  function areaKey() { return Z.run ? Z.run.area : ""; }
  function weightOf(id, def, tier, src) {
    if (!def.find) return 0;
    if ((def.tier || 0) > tier + 1) return 0;
    if (def.only && !def.only.includes(areaKey()) && !(src && def.only.includes(src))) return 0;
    if (def.legendaryOnly && src !== "wraith") return 0;
    return Z.FIND[def.find].w * (1 + 0.7 * ((Z.meta.luck && Z.meta.luck[id]) || 0));
  }
  Z.rollItem = function (o) {
    o = o || {};
    const R = o.R || Z.R, tier = o.tier != null ? o.tier : Z.run.tier;
    const skill = o.kind ? o.kind === "skill" : R() < 0.3;
    const pool = skill ? Z.SKILLS : Z.WEAPONS;
    const w = {};
    for (const id in pool) { if (o.filter && !o.filter(id, pool[id])) continue; const x = weightOf(id, pool[id], tier, o.src); if (x > 0) w[id] = x; }
    if (!Object.keys(w).length) return null;
    const id = R.weighted(w);
    const rw = o.rar || [70, 24, 5, 1];
    const sk = Z.run ? Z.run.skulls : 0;
    const rr = R.weighted({ 0: rw[0] / (1 + sk * 0.2), 1: rw[1], 2: rw[2] * (1 + sk * 0.25), 3: rw[3] * (1 + sk * 0.3) });
    return Z.makeItem(id, Math.max(tier, 0) + (o.bonusTier || 0), +rr, R);
  };
  Z.dropItem = function (x, y, o) {
    o = o || {};
    const it = Z.rollItem({ rar: o.boss ? [0, 30, 50, 20] : o.elite ? [20, 45, 28, 7] : o.chest ? [35, 45, 16, 4] : [70, 24, 5, 1], src: o.src, kind: o.kind, chest: o.chest, cursedChest: o.cursedChest });
    if (!it) return;
    Z.spawnPickup("item", x, y, { it, drop: true, vy: -200, vx: (Math.random() - 0.5) * 80 });
  };

  /* ======================= LAUF ======================= */
  Z.run = null;
  Z.newRun = function () {
    const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    Z.run = { seed, area: "torhof", tier: 0, skulls: Z.meta.skullSel || 0, route: ["torhof"], doorsOpen: true, t0: performance.now(), time: 0, shardsBank: 0, bossesBeaten: [], firstWeaponGiven: false };
    Z.stats = { kills: 0, gold: 0, parries: 0, secrets: 0 };
    /* Ausrüstung aus dem Lager mitnehmen: was man am Waffenständer aufgehoben hat, trägt man in die Feste */
    const prevP = Z.player, keep = Z.level && Z.level.hub && prevP && prevP.slots ? { a1: prevP.slots.a1, a2: prevP.slots.a2, s1: prevP.slots.s1, s2: prevP.slots.s2 } : null;
    const P = (Z.player = Z.newPlayer());
    /* auch Fähigkeiten, die man im Lager bekommen hat (Lottes Ware), wandern mit */
    if (keep) { P.slots.a1 = keep.a1 || null; P.slots.a2 = keep.a2 || null; if (keep.s1) P.slots.s1 = keep.s1; if (keep.s2) P.slots.s2 = keep.s2; }
    Z.run.fromHub = !!keep;
    P.potMax = P.potions = 2 + (Z.meta.up.trank || 0);
    Z.recalcPlayer(); P.hp = P.hpMax;
    Z.meta.runs++; Z.saveMeta();
  };

  /* Gebiet laden */
  Z.loadArea = function (id, opts) {
    opts = opts || {};
    Z.enemies.length = 0; Z.projs.length = 0; Z.hazards.length = 0; Z.allies.length = 0; Z.pickups.length = 0; Z.propsLive.length = 0; Z.stuck.length = 0; Z.bolts.length = 0; if (Z.gadgets) Z.gadgets.length = 0; if (Z.player) { Z.player.grapple = null; Z.player.shieldOut = null; }
    FX.parts.length = 0; FX.texts.length = 0; Z.darkness = 0; Z.boss = null; Z.bossDefeated = false;
    Z.interacts = []; /* frei platzierte Dinge mit Benutzen-Taste (Glutamboss, Segensorb …) */
    let lv, B;
    if (id === "lager") { lv = Z.genHub(); B = HUB_B; Z.run = null; }
    else if (id === "passage") { lv = Z.genPassage(opts.from, opts.to); B = PASS_B; }
    else if (Z.ARENAS[id]) { lv = Z.genArena(id); B = Z.BIOMES[Z.ARENAS[id].base]; }
    else { const rr = Z.Rng(Z.run.seed + id.length * 7919 + Z.run.route.length * 131); lv = Z.genLevel(id, (rr() * 4294967296) >>> 0); B = Z.BIOMES[id]; }
    lv.id = id;
    W.lv = lv; Z.level = lv; Z.biome = B;
    if (Z.run) { Z.run.area = id; if (Z.BIOMES[id]) Z.run.tier = Z.BIOMES[id].tier; if (Z.ARENAS[id]) Z.run.tier = Z.ARENAS[id].tier; }
    /* W19 Slots: höchstes erreichtes Gebiet für die Spielstand-Übersicht */
    { const d = Z.BIOMES[id] || Z.ARENAS[id], g = Z.meta.gebiet; if (d && Number.isFinite(d.tier) && (!g || typeof g !== "object" || !(g.tier >= d.tier))) Z.meta.gebiet = { id, tier: d.tier }; }
    Z.gfx.setLevel(lv, B);
    /* Spieler */
    const P = Z.player || (Z.player = Z.newPlayer());
    P.x = lv.start.x * T + T / 2 - P.w / 2; P.y = (lv.start.y + 1) * T - P.h; P.vx = 0; P.vy = 0; P.peakY = null; P._wasAir = false; P._voidT = null; P.cape = null; P.act = null; P.ledge = null; P.climbing = false; P.rollT = 0; P.lastSafe = { x: P.x, y: P.y }; P.rexUsed = false; P.grabbed = null; P.dead = false; P.plunge = false; P.diveStyle = null; P.diveLock = false; P.diveRecPend = false; P.diveRec = 0;
    P.face = 1;
    Z.cam.bounds = { x: 0, y: 0, w: lv.W * T, h: lv.H * T }; Z.cam.lock = null;
    Z.cam.snap(P.x + P.w / 2, P.y);
    /* Erkundung für die Karte */
    Z.explored = new Uint8Array(lv.W * lv.H);
    /* Inhalt */
    const R = Z.Rng((lv.seed || 99) + 1234);
    if (lv.hub) setupHub(lv);
    else if (lv.passage) setupPassage(lv);
    else if (lv.arena) setupArena(lv, R);
    else setupLevel(lv, B, R);
    /* Ton */
    Z.ambience.set(B, !!lv.arena);
    Z.music.set(lv.hub ? "lager" : lv.passage ? "passage" : lv.arena ? Z.ARENAS[id].music : id);
    Z.ui && Z.ui.onArea(id, B, lv);
    Z.saveMeta();
  };

  function setupLevel(lv, B, R) {
    const run = Z.run;
    run.doorsOpen = !lv.warden;
    if (lv.warden) for (const d of lv.doors) if (d.kind === "exit") d.locked = true;
    /* Gegner */
    const ground = {}, fly = {};
    for (const k in B.foes) { const d = Z.ENEMIES[k]; if (!d) continue; (d.fly ? fly : ground)[k] = B.foes[k]; }
    let eliteBudget = run.tier === 0 ? 1 : 2 + Math.floor(run.tier / 2);
    const spawns = lv.spawns.slice(); R.shuffle(spawns);
    for (const s of spawns) {
      const useFly = s.fly && Object.keys(fly).length;
      const id = R.weighted(useFly ? fly : ground);
      const d = Z.ENEMIES[id];
      const elite = eliteBudget > 0 && R() < 0.06 && !d.group && d.ai !== "turret";
      if (elite) eliteBudget--;
      const n = d.group ? R.int(d.group[0], d.group[1]) : 1;
      for (let i = 0; i < n; i++) { const e = Z.spawnEnemy(id, s.x * T + 8 + (i - (n - 1) / 2) * 12, s.y * T + 16 - (d.fly ? 20 : 0), { elite }); if (e) { e.spawnT = 0; if (Z.world && Z.world.solidAt && (Z.world.solidAt(e.x + e.w / 2, e.y + e.h / 2) || Z.world.solidAt(e.x + e.w / 2, e.y + e.h - 2))) { e.x = s.x * T + 8 - e.w / 2; Z.unstick && Z.unstick(e); } } }
    }
    /* Beute */
    for (const l of lv.loot) {
      const x = l.x * T + 8, y = l.y * T + 16;
      if (l.kind === "chest") Z.spawnPickup("chest", x, y, { vx: 0, vy: 0 });
      else if (l.kind === "cursed") Z.spawnPickup("cursed", x, y, { vx: 0, vy: 0 });
      else if (l.kind === "scroll") Z.spawnPickup("scroll", x, y, { vx: 0, vy: 0, float: true, stat: R.pick(["brut", "takt", "ueber"]) });
      else if (l.kind === "food") Z.spawnPickup("food", x, y, { vx: 0, vy: 0, food: R.pick(Z.FOOD) });
      else { const it = Z.rollItem({ R, rar: l.side !== "path" ? [40, 40, 16, 4] : [60, 30, 8, 2] }); if (it) Z.spawnPickup("item", x, y, { it, vx: 0, vy: 0, float: true }); }
    }
    /* Erste Waffe: man beginnt mit nichts, findet aber gleich am Anfang etwas zum Zuschlagen */
    if (lv.biome === "torhof" && !run.firstWeaponGiven) {
      run.firstWeaponGiven = true;
      const it = Z.rollItem({ R, kind: "weapon", rar: [0, 100, 0, 0], filter: (id, d) => d.kind === "melee" && (d.tier || 0) === 0 });
      const sp = lv.start; let gx = sp.x + 4, gy = sp.y;
      for (let dx = 3; dx < 9; dx++) if (Z.standable(lv, sp.x + dx, sp.y)) { gx = sp.x + dx; break; }
      if (it) Z.spawnPickup("item", gx * T + 8, gy * T + 16, { it, vx: 0, vy: 0, float: true, altar: true });
    }
    for (const p of lv.props) if (p.kind === "breakable") Z.propsLive.push({ kind: "breakable", style: R.pick(["crate", "barrel", "pot"]), x: p.x * T + 1, y: p.y * T + 2, w: 14, h: 14, hp: 1 });
  }
  function setupPassage(lv) {
    /* Seelensplitter werden hier sicher ins Lager geschickt */
    const P = Z.player;
    if (P.shards > 0) { Z.meta.shards += P.shards; Z.run.shardsBank += P.shards; Z.toast(L(["Nundros Rabe trägt ", "Nundro's raven carries "]) + P.shards + L([" Seelensplitter ins Lager.", " soul shards to the camp."])); P.shards = 0; }
    lv.shop = [Z.rollItem({ kind: "weapon", rar: [40, 40, 17, 3] }), Z.rollItem({ kind: "weapon", rar: [40, 40, 17, 3] }), Z.rollItem({ kind: "skill", rar: [40, 40, 17, 3] })].filter(Boolean);
    lv.blessOffer = Z.R.shuffle(Object.keys(Z.BLESS).filter(b => !P.bless.includes(b))).slice(0, 3);
    lv.blessTaken = false; lv.fountainUsed = false;
    Z.run.doorsOpen = true;
  }
  function setupHub(lv) {
    const P = Z.player;
    P.slots = { a1: null, a2: null, s1: null, s2: null }; P.bless = []; P.stats = { brut: 0, takt: 0, ueber: 0 }; P.gold = 0; P.shards = 0; P.curse = 0; P.wrath = 0; P.st = {};
    P.potMax = P.potions = 2 + (Z.meta.up.trank || 0);
    Z.recalcPlayer(); P.hp = P.hpMax;
    for (const p of lv.props) if (p.id === "Y") { const e = Z.spawnEnemy("puppe", p.x * T + 8, (p.y + 1) * T, { tier: 0 }); e.dummy = true; e.hp = e.hpMax = 99999; }
    Z.allies.push({ kind: "campRex", x: (45 + (lv.ox || 0)) * T, y: 11 * T + 3, w: 16, h: 13, face: -1, t: 0, life: 1e9, run: 0, state: "sit", st: 0 });
    /* Start-Ausrüstung liegt am Waffenständer vor dem Tor – mit den echten Aufhebe-Tasten nehmen (schmiede.js) */
    if (Z.setupRack) Z.setupRack(lv);
  }
  function setupArena(lv, R) {
    const A2 = Z.ARENAS[lv.arena];
    Z.run.doorsOpen = false;
    lv.bossPending = true;
    for (const p of lv.props) if (p.kind === "breakable") Z.propsLive.push({ kind: "breakable", style: "barrel", x: p.x * T + 1, y: p.y * T + 2, w: 14, h: 14, hp: 1 });
  }

  /* ======================= WÄCHTER UND BOSSE ======================= */
  function checkWarden() {
    const lv = Z.level, P = Z.player;
    if (!lv.warden || lv.wardenSpawned) return;
    const c = lv.warden.cell, x0 = c.x * Z.CW * T, y0 = c.y * Z.CH * T;
    if (P.x > x0 && P.x < x0 + Z.CW * T && P.y > y0 && P.y < y0 + Z.CH * T) {
      lv.wardenSpawned = true;
      const sp = lv.doors.find(d => d.kind === "exit") || { x: c.x * Z.CW + 12, y: c.y * Z.CH + 10 };
      const bx = (P.x < sp.x * T ? sp.x * T + 40 : sp.x * T - 40);
      startBoss(lv.warden.id, U.clamp(bx, x0 + 40, x0 + Z.CW * T - 40), (sp.y + 1) * T - 2, true);
      Z.cam.lock = { x: x0 + Z.CW * T / 2, y: y0 + Z.CH * T / 2 + 20, k: 0.55 };
    }
  }
  function startBoss(id, x, y, warden) {
    const e = Z.spawnBoss(id, x, y);
    if (!e) return;
    Z.boss = e; e.warden = warden;
    Z.run.doorsOpen = false;
    Z.ui.bossIntro(e);
    Z.music.set(warden ? "boss1" : Z.ARENAS[Z.level.arena] ? Z.ARENAS[Z.level.arena].music : "boss1");
    A.play("gong", { vol: 0.7 }); A.play("roar", { vol: 0.6, delay: 0.4 });
    Z.meta.bosses[id] = Z.meta.bosses[id] || { seen: 0, won: 0 }; Z.meta.bosses[id].seen++;
  }
  function bossUpdate(dt) {
    const lv = Z.level, P = Z.player;
    if (lv.arena && lv.bossPending && P.x > 8 * T) {
      lv.bossPending = false;
      startBoss(lv.bossId, lv.bossSpot.x * T + 8, (lv.bossSpot.y + 1) * T - 2, false);
    }
    const b = Z.boss;
    if (!b) return;
    /* Nezna flieht, wenn der Bugbear fällt */
    if (b.partner && !b.partner.dead && b.hp <= 0) { const n = b.partner; n.dead = true; n.deadT = 0; FX.burst(n.x + n.w / 2, n.y + 10, 20, { col: ["#3a2a4a", "#b080ff"], sp: 90, life: 0.6, size: 3, kind: "smoke" }); A.play("bat"); FX.text(n.x + n.w / 2, n.y - 10, L(["Nezna flieht als Fledermaus!", "Nezna flees as a bat!"]), "#b080ff", true); }
    if (b.partner && b.partner.hp <= 0 && !b.partner.dead) { b.partner.dead = true; b.partner.deadT = 0; }
    if (b.hp <= 0 && !Z.bossDefeated) bossDefeated(b);
  }
  function bossDefeated(b) {
    Z.bossDefeated = true; b.dead = true; b.deadT = 0;
    for (const e of Z.enemies) if (e.master === b && !e.dead) Z.killEnemy(e, { self: true });
    FX.slowmo(0.25, 1.2); FX.flashScreen("#fff2d0", 0.5); FX.addShake(12); A.play("roar", { vol: 0.8 }); A.play("gong", { vol: 0.6, delay: 0.5 });
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    FX.burst(cx, cy, 80, { col: [b.def.c || "#6a5a50", b.def.t || "#ffd27a", "#ffd27a"], sp: 220, life: 1.2, size: 3, kind: "spark", add: true });
    FX.burst(cx, cy, 40, { col: ["#3a3030", "#5a4a40"], sp: 120, life: 1.8, size: 7, kind: "smoke", g: -20 });
    if (b.def.noKill) { b.dead = false; b.sleep = true; b.hp = 1; b.invuln = 999; b.def.update = (e, dt) => { e.vx = 0; e.vy += 1400 * dt; Z.moveBody(e, dt); if (Math.random() < dt * 0.5) Z.audio.play("amb/n_schnarchen_" + (1 + (Math.random() * 5 | 0)) + ".mp3", { vol: 0.4 }); }; }
    Z.meta.bosses[b.id] = Z.meta.bosses[b.id] || { seen: 1, won: 0 }; Z.meta.bosses[b.id].won++;
    Z.run.bossesBeaten.push(b.id);
    /* Beute */
    const run = Z.run;
    Z.dropGold(cx, cy, 60 * Z.BAL.goldMul(run.tier));
    Z.dropShards(cx, cy, (b.warden ? 18 : 30) * (1 + 0.25 * run.skulls));
    (Z.bossLater || setTimeout)(() => {
      Z.dropItem(cx, b.y + b.h - 4, { boss: true, src: b.id });
      if (b.def.drop === "dawnbringer" && (!Z.meta.found.dawnbringer || Z.R() < 0.4)) { const it = Z.makeItem("dawnbringer", run.tier + 1, 3); Z.spawnPickup("item", cx + 20, b.y + b.h - 4, { it, drop: true, vy: -260 }); }
      else if (!b.warden) Z.dropItem(cx, b.y + b.h - 4, { boss: true, src: b.id });
      Z.spawnPickup("food", cx - 20, b.y + b.h - 4, { food: Z.FOOD[3], drop: true });
    }, 900);
    Z.onBossDown && Z.onBossDown(b);
    Z.ui.bossDown(b);
    run.doorsOpen = true; Z.cam.lock = null;
    Z.music.target = 0;
    const A2 = Z.ARENAS[Z.level.arena];
    /* Endboss: kurz unverwundbar, damit Nachzügler-Geschosse den Sieg nicht in einen Tod verwandeln */
    if (A2 && A2.final) { const P = Z.player; if (P) P.iframe = Math.max(P.iframe, 5); const aid = Z.level.arena; setTimeout(() => { if (Z.player && !Z.player.dead && Z.level && Z.level.arena === aid) Z.ui.ending(A2.final); }, 4200); }
    Z.saveMeta();
  }

  /* ======================= INTERAKTION ======================= */
  Z.interactTarget = null;
  function findInteract() {
    const P = Z.player, lv = Z.level; if (!P || P.dead) return null;
    const px = P.x + P.w / 2, py = P.y + P.h;
    let best = null, bd = 22;
    const consider = (o, x, y, r) => { const d = Math.abs(x - px) + Math.abs(y - py) * 0.6; if (d < (r || bd) && d < bd + (r ? r - 22 : 0)) { bd = d; best = o; } };
    for (const p of Z.pickups) if (["item", "scroll", "chest", "cursed", "food"].includes(p.kind) && !p.open) consider({ type: "pickup", p }, p.x, p.y, 24);
    for (const d of lv.doors) if (d.kind === "exit" || d.kind === "gate") consider({ type: "door", d }, d.x * T + 8, (d.y + 1) * T, 26);
    for (const s of lv.props) if (s.kind === "npc" || s.kind === "station") consider({ type: s.kind, s }, s.x * T + 8, (s.y + 1) * T, 28);
    for (const o of Z.interacts || []) if (!o.off && (!o.ok || o.ok())) consider({ type: "obj", o }, o.x, o.y, o.r || 26);
    return best;
  }
  function interact(o) {
    const P = Z.player, lv = Z.level;
    if (Z.rueckweg) Z.rueckweg.benutzt(o); /* W14: jede Benutzung beendet die Rückweg-Gnade (rueckweg.js) */
    if (o.type === "pickup") {
      const p = o.p;
      if (p.kind === "item") return Z.ui.offerItem(p);
      if (p.kind === "scroll") { Z.pickups.splice(Z.pickups.indexOf(p), 1); A.play("scroll"); return Z.ui.scrollChoice(); }
      if (p.kind === "food") { Z.pickups.splice(Z.pickups.indexOf(p), 1); const f = p.food || Z.FOOD[0]; Z.healPlayer(P.hpMax * f.heal); A.play("potion", { vol: 0.5 }); FX.text(P.x + P.w / 2, P.y - 14, L(f.n), "#e8c890"); return; }
      if (p.kind === "chest") { p.open = true; A.play("chest"); Z.vib && Z.vib("chest"); /* W20 Steuerung */ FX.burst(p.x, p.y - 8, 20, { col: ["#ffd27a", "#fff0c0"], sp: 120, up: 60, life: 0.6, size: 2, kind: "spark", add: true }); Z.dropGold(p.x, p.y - 10, 25 * Z.BAL.goldMul(Z.run.tier)); Z.dropItem(p.x, p.y - 10, { chest: true }); Z.onChestOpen && Z.onChestOpen(p, false); if (Z.R() < 0.3) Z.spawnPickup("food", p.x, p.y - 10, { food: Z.R.pick(Z.FOOD), drop: true }); return; }
      if (p.kind === "cursed") {
        const open = it => {
          p.open = true; A.play("chest"); Z.vib && Z.vib("chest"); /* W20 Steuerung */ FX.burst(p.x, p.y - 8, 24, { col: ["#c040ff", "#ff9af0"], sp: 120, up: 60, life: 0.7, size: 2, kind: "spark", add: true });
          Z.dropGold(p.x, p.y - 10, 80 * Z.BAL.goldMul(Z.run.tier)); Z.dropItem(p.x, p.y - 10, { elite: true }); Z.dropShards(p.x, p.y, 10); Z.onChestOpen && Z.onChestOpen(p, true);
          return it ? Z.spawnPickup("item", p.x + 10, p.y - 10, { it, drop: true, vy: -200, vx: 30 }) : null;
        };
        if (Z.ui.cursedChest) return Z.ui.cursedChest(p, open);
        return Z.ui.confirm(L(["Verfluchte Truhe", "Cursed Chest"]), L(["Darin liegt eine verfluchte Waffe. Erst wer sie anlegt, trägt den Fluch.", "A cursed weapon lies within. Only equipping it brings the curse."]), L(["Öffnen", "Open"]), () => open(Z.rollItem({ rar: [35, 45, 16, 4], chest: true, cursedChest: true })));
      }
    }
    if (o.type === "door") {
      const d = o.d;
      if (d.kind === "gate") return Z.ui.startRunConfirm();
      if (d.locked && !Z.run.doorsOpen) { Z.toast(L(["Verriegelt. Erst der Wächter.", "Locked. The warden first."])); A.play("chain"); return; }
      if (!Z.run.doorsOpen) { Z.toast(L(["Der Weg ist versperrt, solange der Wächter lebt.", "The way is barred while the warden lives."])); A.play("chain"); return; }
      return goThrough(d.to, d);
    }
    if (o.type === "obj") return o.o.use();
    if (o.type === "npc") return Z.ui.npc(o.s.id);
    if (o.type === "station") return Z.ui.station(o.s.id);
  }
  let doorBusy = 0; /* keine zweite Tür-Eingabe während der Überblendung (sonst doppeltes Laden, Rückweg-Gnade weg) */
  function goThrough(to, d) {
    if (doorBusy && performance.now() - doorBusy < 3000) return; /* Sicherung: nach 3 s wieder frei */
    const lv = Z.level, P = Z.player, RW = Z.rueckweg;
    /* W14 Rückweg-Gnade: nach dem Zurückgehen führt dieselbe Tür wieder in das gemerkte Folgegebiet (gleicher Zustand, kein neues Laden) */
    if (RW && d && RW.vor(d)) return;
    const pos = P ? { x: P.x, y: P.y, face: P.face } : null;
    A.play("door", { vol: 0.7 });
    doorBusy = performance.now();
    Z.ui.fade(() => {
      doorBusy = 0;
      let snap = null; try { snap = RW && d && Z.level === lv ? RW.capture(d, pos) : null; } catch (e) { console.error(e); }
      if (lv.passage) { Z.run.route.push(to); Z.loadArea(to); }
      else { Z.loadArea("passage", { from: lv.id, to }); }
      if (snap) try { RW.arrive(snap); } catch (e) { console.error(e); }
    });
  }
  Z.startRun = function () {
    Z.newRun();
    Z.ui.fade(() => { Z.loadArea("torhof"); if (!Z.meta.tut) Z.ui.tutorial(); });
  };
  const RETURN = [["B", ["Du lebst. Gut. Die Ballade wäre so kurz gewesen.", "You're alive. Good. The ballad would have been so short."]], ["E", ["Ich hab schon dein Gold gezählt. Es war keins.", "I already counted your gold. There wasn't any."]], ["G", ["Rex hat die ganze Zeit zum Tor gestarrt.", "Rex stared at the gate the whole time."]], ["B", ["Wieder da? Ich nenne das Kapitel „Noch nicht“.", "Back again? I'm calling this chapter 'Not yet'."]], ["A", ["Bring mir die Splitter. Dann schärfe ich, was du gefunden hast.", "Bring me the shards. Then I'll sharpen what you've found."]], ["G", ["Die Rolle, Ezekiel. Immer die Rolle.", "The roll, Ezekiel. Always the roll."]]];
  Z.backToCamp = function () {
    Z.ui.fade(() => {
      Z.player = Z.newPlayer(); Z.loadArea("lager");
      setTimeout(() => { const [id, txt] = Z.R.pick(RETURN); const s = Z.level.props.find(p => p.id === id); if (s && Z.level.hub) Z.ui.say(s.x * T + 8, s.y * T - 22, { B: "Barradin", E: "Echo", G: "Friedrich", A: "Nundro" }[id], L(txt), 4800); }, 1400);
    });
  };

  /* ======================= TOD ======================= */
  Z.onPlayerDeath = function (o) {
    const P = Z.player; if (P.dead) return;
    P.dead = true; P.deadAt = Z.gfx.time; P.act = null;
    FX.slowmo(0.2, 1.4); FX.flashScreen("#400000", 0.6); A.play("die", { vol: 0.6 }); A.muffle(900);
    Z.music.target = 0;
    const run = Z.run;
    if (run) {
      run.time = (performance.now() - run.t0) / 1000;
      if (!run.gnade) Z.meta.best.kills = Math.max(Z.meta.best.kills, Z.stats.kills || 0); /* W9: Barmherzigkeit wertet keine Rekorde */
    }
    Z.saveMeta();
    setTimeout(() => { A.muffle(20000); Z.ui.deathScreen(o); }, 1600);
  };

  /* ======================= HAUPTSCHLEIFE ======================= */
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d", { alpha: false, desynchronized: true }) || cv.getContext("2d");
  let VW = 0, VH = 0, dpr = 1;
  function resize() {
    const q = Z.gq || {};
    dpr = Math.min(window.devicePixelRatio || 1, q.level === 3 ? 3 : 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    /* begrenze die Pixelzahl auf sehr großen Bildschirmen (je nach Grafikstufe) */
    const maxPix = q.maxPix || 1600 * 940; if (cw * ch * dpr * dpr > maxPix) dpr = Math.sqrt(maxPix / (cw * ch));
    dpr *= q.res || 1; dpr = Math.max(0.35, dpr);
    VW = cv.width = Math.round(cw * dpr); VH = cv.height = Math.round(ch * dpr);
    cv.style.width = cw + "px"; cv.style.height = ch + "px";
    /* sichtbarer Weltausschnitt: ~250 Einheiten hoch im Querformat */
    const S = Math.min(VW / 400, VH / 250);
    Z.gfx.scale = S; Z.gfx.bs = Math.min(S, 3);
    Z.cam.w = VW / S; Z.cam.h = VH / S;
    if (Z.level) { Z.gfx.chunks.clear(); Z.gfx.buildLayers(); Z.cam.clamp(); }
  }
  addEventListener("resize", resize); Z.resize = resize; resize();

  let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0;
  const STEP = 1 / 120;
  Z.paused = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (Z.frameGate && !Z.frameGate(now)) return;
    let dt = Math.min(0.05, (now - last) / 1000); last = now;
    Z.gfxAutoTick && Z.gfxAutoTick(dt, !!(Z.level && !Z.paused));
    fpsT += dt; fpsN++; if (fpsT > 1) { Z.fps = fpsN; fpsN = 0; fpsT = 0; }
    inp.pollPad();
    if (Z.ui) Z.ui.frame(dt);
    if (Z.level && !Z.paused) {
      let sdt = dt * (FX.slow > 0 ? FX.slow : 1) * (Z.ui && Z.ui.choiceActive ? 0.12 : 1);
      if (FX.hitstop > 0) { FX.hitstop -= dt; sdt = 0; }
      /* Bildgenau rechnen: so viele gleich lange Teilschritte (≤ 1/120 s), wie das Bild dauert –
         ergibt auf 60-, 90-, 120- und 144-Hz-Schirmen gleich weiche Bewegung ohne Ruckeln. */
      let first = true;
      if (sdt > 0) {
        /* Handheld (Stufe 0): Teilschritte ≤ 1/60 s – halbiert die Rechenlast; moveBody unterteilt ohnehin in ≤ 5-px-Schritte */
        const st = Z.gq && Z.gq.lean ? STEP * 2 : STEP;
        const n = Math.min(8, Math.max(1, Math.ceil(sdt / st - 0.01))), h = sdt / n;
        for (let i = 0; i < n; i++) { tick(h, first); first = false; }
        inp.endFrame();
      }
      FX.update(dt);
      Z.cam.update(dt, Z.player);
      Z.gfx.weather(dt);
      Z.music.update(dt); Z.ambience.update(dt);
    } else { inp.endFrame(); if (Z.music) Z.music.update(dt); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (Z.level) Z.gfx.render(ctx, VW, VH, Z.paused ? 0 : dt);
    else { ctx.fillStyle = "#0c080c"; ctx.fillRect(0, 0, VW, VH); }
    Z._work = (Z._work || 0) + performance.now() - now; Z._workN = (Z._workN || 0) + 1; /* Rechenzeit je Bild für die Grafik-Automatik */
  }
  /* W14: „Oben“ betritt Türen nur außerhalb des Kampfs – sonst würde ein Aufwärtsschlag/-schuss am Ausgang aus Versehen hindurchführen
     (die Benutzen-Taste geht immer) */
  function upDoorOk(P) {
    if (P.act || P.hurtT > 0 || inp.held.a1 || inp.held.a2 || inp.held.s1 || inp.held.s2) return false;
    if (P.buf) for (const k in P.buf) if (P.buf[k] > 0) return false;
    for (const e of Z.enemies) if (!e.dead && e.aware && !e.dummy && Math.abs(e.x - P.x) < 180 && Math.abs(e.y - P.y) < 120) return false;
    return true;
  }
  function tick(dt, first) {
    const P = Z.player, lv = Z.level;
    if (!first) { for (const k in inp.pressed) inp.pressed[k] = false; }
    /* Interaktion */
    Z.interactTarget = findInteract();
    if (inp.pressed.use && Z.interactTarget && !P.dead && !(Z.ui && Z.ui.choiceActive)) { inp.consume("use"); interact(Z.interactTarget); }
    if (inp.pressed.up && Z.interactTarget && (Z.interactTarget.type === "door" || (Z.interactTarget.type === "obj" && Z.interactTarget.o.tor)) && upDoorOk(P) && P.onGround && !P.climbing && !W.isLadder(Math.floor((P.x + P.w / 2) / T), Math.floor((P.y + P.h - 4) / T))) { interact(Z.interactTarget); }
    Z.updatePlayer(P, dt);
    Z.capeUpdate(P, dt);
    Z.updateEnemies(dt);
    Z.updateProjs(dt);
    Z.updateHazards(dt);
    Z.updateAllies(dt);
    Z.updateGadgets && Z.updateGadgets(dt);
    Z.updateParcours && Z.updateParcours(dt);
    Z.prachtTick && Z.prachtTick(dt);
    Z.bilanzTick && Z.bilanzTick(dt);
    Z.kampfTick && Z.kampfTick(dt);
    Z.abenteuerTick && Z.abenteuerTick(dt);
    Z.fluchTick && Z.fluchTick(dt);
    Z.ebenenTick && Z.ebenenTick(dt);
    updateCampRex(dt);
    Z.lagerTick && Z.lagerTick(dt);
    Z.updatePickups(dt);
    if (Z.darkness > 0) Z.darkness -= dt;
    if (lv.warden) checkWarden();
    bossUpdate(dt);
    /* Trainingspuppe heilt sich */
    for (const e of Z.enemies) if (e.dummy) { e.lastHp = e.lastHp || e.hp; if (e.hp < e.lastHp) { e.dpsAcc = (e.dpsAcc || 0) + (e.lastHp - e.hp); e.wob = 0.3; } e.lastHp = e.hp; e.dpsT = (e.dpsT || 0) + dt; if (e.wob > 0) e.wob -= dt; if (e.dpsT > 2.5) { if (e.dpsAcc > 0) FX.text(e.x + e.w / 2, e.y - 20, Math.round(e.dpsAcc / 2.5) + " " + L(["Schaden/s", "dmg/s"]), "#ffd27a", true); e.dpsAcc = 0; e.dpsT = 0; e.hp = e.hpMax; } e.dead = false; e.st = {}; }
    /* Intensität für die Musik */
    let near = 0;
    for (const e of Z.enemies) if (!e.dead && e.aware && Math.abs(e.x - P.x) < 300 && Math.abs(e.y - P.y) < 200) near += e.elite ? 2 : 1;
    Z.music.target = Z.boss && !Z.bossDefeated ? 1 : Math.min(1, near / 4);
    /* Erkundung */
    if (Z.explored) { const tx = Math.floor((P.x + P.w / 2) / T), ty = Math.floor((P.y + P.h / 2) / T); for (let y = ty - 7; y <= ty + 7; y++) for (let x = tx - 12; x <= tx + 12; x++) if (x >= 0 && y >= 0 && x < lv.W && y < lv.H) Z.explored[y * lv.W + x] = 1; }
    /* Zeit */
    if (Z.run && !P.dead) Z.run.time += dt;
    /* Abstürze in den Abgrund unterhalb der Karte */
    if (P.y > lv.H * T + 40 && !P.dead) { P.x = P.lastSafe.x; P.y = P.lastSafe.y; P.vx = P.vy = 0; Z.hurtPlayer(Math.round(P.hpMax * 0.15), { force: true, unblockable: true, kb: 0, hazard: true, fall: true }); }
  }
  /* Rex im Lager: läuft herum, holt Stöckchen, setzt sich zu Ezekiel */
  function updateCampRex(dt) {
    for (const a of Z.allies) {
      if (a.kind !== "campRex") continue;
      a.t += dt; a.st -= dt;
      /* lager.js übernimmt Rex kurz (Kunststücke bei Wendel) */
      if (a.lock > 0) { a.lock -= dt; continue; }
      const P = Z.player;
      if (a.st <= 0) { a.st = 2 + Math.random() * 4; a.state = Math.random() < 0.5 ? "sit" : "wander"; const ox = (Z.level && Z.level.ox) || 0; a.tx = (Math.max(4, 20 + ox - Math.min(ox, 30) * Math.random()) + Math.random() * 40) * T; if (Math.abs(P.x - a.x) < 200 && Math.random() < 0.4) { a.state = "follow"; } }
      let tx = a.state === "follow" ? P.x - P.face * 20 : a.state === "wander" ? a.tx : a.x;
      const d = tx - a.x; a.face = Math.abs(d) > 4 ? U.sign(d) : a.face;
      a.vx = a.state !== "sit" && Math.abs(d) > 10 ? U.sign(d) * 110 : 0; a.vy = (a.vy || 0) + 1400 * dt;
      Z.moveBody(a, dt); a.run = (a.run || 0) + Math.abs(a.vx) * dt / 12;
      if (Math.random() < dt * 0.05) A.play("bark", { x: a.x, vol: 0.3 });
    }
  }
  /* Zeichnen von Rex im Lager und zerbrechlichen Dingen */
  Z.drawWorldProps = function (c, t) {
    for (const p of Z.propsLive) {
      if (p.dead || p.kind !== "breakable") continue;
      const sh = p.shake > 0 ? (p.shake -= 0.016, Math.sin(t * 60) * 1.2) : 0;
      const x = p.x + 7 + sh, y = p.y + 14;
      if (p.style === "crate") { c.fillStyle = "#6a4a2a"; c.fillRect(x - 7, y - 13, 14, 13); c.strokeStyle = "#4a3018"; c.lineWidth = 1; c.strokeRect(x - 6.5, y - 12.5, 13, 12); c.beginPath(); c.moveTo(x - 6, y - 12); c.lineTo(x + 6, y - 1); c.stroke(); }
      else if (p.style === "barrel") { Z.draw.ell(c, x, y - 7, 6, 7.5, "#5a3a22"); c.fillStyle = "#3a2a1a"; c.fillRect(x - 6, y - 11, 12, 1.4); c.fillRect(x - 6, y - 4, 12, 1.4); }
      else { Z.draw.ell(c, x, y - 5, 5, 5.5, "#8a5a3a"); c.fillStyle = "#6a4028"; c.fillRect(x - 3, y - 12, 6, 2); }
    }
    for (const a of Z.allies) if (a.kind === "campRex") { if (a.drawFn) a.drawFn(c, a, t); else Z.drawRex(c, a.x + a.w / 2, a.y + a.h, a.face, t, a.run, a.vx === 0); }
    const lv = Z.level;
    /* Lager-Figuren und Stationen */
    for (const s of lv.props) {
      const x = s.x * T + 8, y = (s.y + 1) * T;
      if (s.kind === "npc") {
        if (s.id === "F") { /* Lagerfeuer */ c.fillStyle = "#3a2a1a"; c.fillRect(x - 9, y - 3, 18, 3); Z.flame(c, x, y - 3, 2.2, "#ff8a2a"); Z.flame(c, x - 4, y - 3, 1.2, "#ff6a1a"); Z.flame(c, x + 4, y - 3, 1.3, "#ffa040"); if (Math.random() < 0.3) FX.p({ x: x + (Math.random() - 0.5) * 10, y: y - 10, vx: (Math.random() - 0.5) * 20, vy: -50, life: 1.2, size: 1.4, col: "#ffb060", kind: "spark", add: true }); continue; }
        if (s.id === "C") { /* Schädelaltar */ c.fillStyle = "#2a2226"; c.fillRect(x - 10, y - 14, 20, 14); c.fillStyle = "#3a3036"; c.fillRect(x - 12, y - 16, 24, 3); for (let i = 0; i < 5; i++) { const lit = i < (Z.meta.skullSel || 0); Z.draw.circ(c, x - 8 + i * 4, y - 19, 1.8, lit ? "#ffd8c0" : "#6a6060"); if (lit) Z.draw.glow(c, x - 8 + i * 4, y - 19, 6, "rgba(255,90,60,.5)"); } continue; }
        if (s.id === "Y" || s.id === "R") continue;
        if (s.id === "A") { c.fillStyle = "#3a3a40"; c.fillRect(x + 6, y - 7, 6, 7); c.fillRect(x + 2, y - 11, 14, 4); Z.flame(c, x - 14, y - 6, 1.2, "#ff8a2a"); c.fillStyle = "#2e2622"; c.fillRect(x - 22, y - 12, 16, 12); c.fillStyle = "#ff8a2a"; c.fillRect(x - 19, y - 8, 10, 3); }
        if (s.id === "B") { c.fillStyle = "#4a3020"; c.fillRect(x + 8, y - 8, 10, 8); c.fillStyle = "#c8a878"; c.fillRect(x + 9, y - 10, 8, 2); }
        Z.drawNPC(c, s.id, x, y, t, s.id === "E" ? -1 : s.id === "A" ? -1 : 1);
      } else if (s.kind === "station") {
        if (s.id === "K") { /* Brunnen */ c.fillStyle = "#4a4448"; c.fillRect(x - 12, y - 8, 24, 8); c.fillRect(x - 2, y - 22, 4, 14); Z.draw.ell(c, x, y - 22, 8, 2.5, "#5a545a"); const used = lv.fountainUsed; c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = used ? "rgba(120,120,140,.3)" : "rgba(255,110,110,.7)"; for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i / 6) % 1; c.fillRect(x - 6 + ph * 12 * (i % 2 ? 1 : -1) * 0.5, y - 22 + ph * 14, 1.2, 2); } c.fillStyle = used ? "rgba(100,100,120,.3)" : "rgba(220,60,70,.6)"; c.fillRect(x - 11, y - 7, 22, 3); c.restore(); }
        if (s.id === "M") { /* Händler */ c.fillStyle = "#5a3a22"; c.fillRect(x - 16, y - 12, 32, 12); c.fillStyle = "#7a1a1a"; c.beginPath(); c.moveTo(x - 20, y - 26); c.lineTo(x + 20, y - 26); c.lineTo(x + 16, y - 20); c.lineTo(x - 16, y - 20); c.fill(); c.fillStyle = "#3a2a1a"; c.fillRect(x - 16, y - 26, 2, 14); c.fillRect(x + 14, y - 26, 2, 14); Z.drawNPC(c, "A", x + 2, y - 10, t, -1); for (let i = 0; i < 3; i++) { const it = lv.shop && lv.shop[i]; if (it && !it.sold) Z.drawIcon(c, Z.itemDef(it).icon, x - 10 + i * 10, y - 14, 8, Z.itemDef(it).col); } }
        if (s.id === "S") { /* Segensaltar */ c.fillStyle = "#3a3036"; c.fillRect(x - 9, y - 16, 18, 16); c.fillStyle = "#4a4048"; c.fillRect(x - 11, y - 18, 22, 3); if (!lv.blessTaken) { Z.draw.glow(c, x, y - 26, 20 + Math.sin(t * 3) * 3, "rgba(255,90,60,.55)"); Z.draw.circ(c, x, y - 26, 3, "#ffb090"); } }
      }
    }
  };

  /* Testzugang */
  window.__z = {
    Z, start: () => Z.startRun(), area: id => { if (!Z.run) Z.newRun(); Z.loadArea(id); }, god: v => (Z.godMode = v !== false),
    give: (id, rar) => { const it = Z.makeItem(id, Z.run ? Z.run.tier : 0, rar || 1); const P = Z.player; if (it.type === "skill") P.slots[P.slots.s1 ? "s2" : "s1"] = it; else P.slots[P.slots.a1 ? "a2" : "a1"] = it; Z.meta.found[id] = true; },
    tele: (x, y) => { Z.player.x = x; Z.player.y = y; }, step: n => { for (let i = 0; i < n; i++) tick(STEP, i === 0); }
  };
  /* Start */
  requestAnimationFrame(frame);
})();
