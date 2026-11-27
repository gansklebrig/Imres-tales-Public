/* Ezekiel – The Destroyer · Mutationen (W29 Mutationen)
   Nach jedem abgeschlossenen Gebiet wächst im Durchgang ein Wandlungsschrein: 1 von 3 passiven Gaben wählen, höchstens 3 zugleich
   (bei mehr eine ersetzen). Abgrenzung zu den bestehenden Systemen:
     · Segen (daten.js Z.BLESS, Altar im Durchgang): pauschale Kampfwerte (Schaden/Abwehr/Heilung) – bleiben unangetastet.
     · Pakte: freiwillige Erschwernisse gegen Beute · Runen: Gravuren an EINER Waffe · Schriftrollen: Wertepunkte.
   Mutationen sind dagegen BEDINGTE AUSLÖSER, die eine Spielweise belohnen (Hinrichten, Fernkampf auf Abstand, Kontrolle,
   Fähigkeitenketten, Bewegung, Beute) – sie verändern, WIE man kämpft, nicht nur wie stark. Angebot gewichtet nach den
   getragenen Waffen/Fähigkeiten/Werten, mit Abwechslung (zuletzt Gesehenes seltener, drei verschiedene Familien).
   Speicherung: je Spieler P.mut (Koop W27: jede Figur ihre eigenen Gaben), Spiegel für Rückblick Z.run.mut = { p1: [ids] };
   Freischaltungen nur lesend aus Z.meta (Erfolge, Härte-Siege, Bossrausch) – je Spielstand. Kein Blau.
   Prüfhilfe: Z.mut (liste, gib(P,id), weg(P,id), angebot(P), of(P), oeffne()). */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, FX = Z.fx, A = Z.audio, L = v => Z.L(v);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const MAXM = 3;
  const FAM = {
    glas: { n: ["Glaskanone", "Glass Cannon"], col: "#e05a3a", ico: "✦" },
    tank: { n: ["Bollwerk", "Bulwark"], col: "#c8a060", ico: "⛨" },
    cc: { n: ["Kontrolle", "Control"], col: "#9a7ac0", ico: "⌁" },
    fern: { n: ["Fernkampf", "Ranged"], col: "#8ab04a", ico: "➶" },
    skill: { n: ["Fähigkeiten", "Skills"], col: "#d89a3a", ico: "✺" },
    beweg: { n: ["Bewegung", "Movement"], col: "#e0c060", ico: "➹" },
    beute: { n: ["Beute", "Loot"], col: "#e8b43a", ico: "●" }
  };
  const M0 = () => Z.meta || {};
  const achOk = id => !!(M0().ach && M0().ach[id]);
  const hSiege = n => { const s = (M0().haerte && M0().haerte.siege) || {}; for (const k in s) if (+k >= n && s[k] > 0) return true; return false; };
  /* Gaben: id, Familie, Name, Wirkung (mit Zahlen), Freischaltung (optional) */
  const G = [
    { id: "henker", f: "glas", n: ["Henker", "Executioner"], d: ["+60 % Schaden gegen Gegner unter 30 % Leben (Bosse +30 %).", "+60% damage to enemies below 30% health (bosses +30%)."] },
    { id: "ruhm", f: "glas", n: ["Ruhmeskette", "Glory Chain"], d: ["Jeder Treffer +3 % Schaden (bis +30 %). Ein erlittener Treffer löscht die Kette.", "Each hit +3% damage (up to +30%). Taking a hit breaks the chain."] },
    { id: "ueberladung", f: "glas", n: ["Überladung", "Overload"], d: ["Jeder 4. Nahkampftreffer explodiert: 60 % Schaden an Gegnern daneben.", "Every 4th melee hit explodes: 60% damage to enemies next to it."] },
    { id: "blutzoll", f: "glas", n: ["Blutzoll", "Blood Toll"], d: ["Jeder Kill in diesem Gebiet +1 % Schaden (bis +30 %).", "Each kill in this area +1% damage (up to +30%)."] },
    { id: "wutstau", f: "glas", n: ["Wutstau", "Pent-up Rage"], d: ["Erlittener Schaden ×3 wird gespeichert und mit dem nächsten Treffer entladen (höchstens +150 %).", "Damage taken ×3 is stored and unleashed with your next hit (at most +150%)."], lock: () => hSiege(1), lockTxt: ["Ein Ende auf Härte I erreichen", "Reach an ending on Hardness I"] },
    { id: "panzerhaut", f: "tank", n: ["Panzerhaut", "Armoured Hide"], d: ["Nach 2,5 s ohne Treffer bildet sich ein Schild über 12 % deines Lebens (bricht er, 8 s Pause).", "After 2.5 s without being hit, a shield worth 12% of your health forms (if it breaks, 8 s pause)."] },
    { id: "gegenstoss", f: "tank", n: ["Gegenstoß", "Riposte Surge"], d: ["Nach einer Parade oder einem Block: nächster Treffer +100 % und betäubt 0,5 s.", "After a parry or block: next hit +100% and stuns for 0.5 s."] },
    { id: "zaeh", f: "tank", n: ["Zähes Fleisch", "Tough Flesh"], d: ["+25 % maximales Leben.", "+25% maximum health."] },
    { id: "letzterstand", f: "tank", n: ["Letzter Stand", "Last Stand"], d: ["Unter 25 % Leben: 40 % weniger erlittener Schaden.", "Below 25% health: 40% less damage taken."], lock: () => achOk("zaeh"), lockTxt: ["Erfolg „Unverwüstlich“ (10-mal gefallen)", "Achievement 'Relentless' (fallen 10 times)"] },
    { id: "eisengriff", f: "cc", n: ["Eisengriff", "Iron Grip"], d: ["Treffer auf betäubte oder gefesselte Gegner verlängern das um 0,4 s (bis +1,2 s).", "Hits on stunned or rooted enemies extend it by 0.4 s (up to +1.2 s)."] },
    { id: "frostbiss", f: "cc", n: ["Frostbiss", "Frostbite"], d: ["Jeder 3. Treffer auf denselben Gegner verlangsamt ihn 2 s (−45 % Tempo).", "Every 3rd hit on the same enemy slows it for 2 s (−45% speed)."] },
    { id: "kettenstoss", f: "cc", n: ["Kettenstoß", "Chain Shove"], d: ["+50 % Rückstoß; Gegner im Rückstoß nehmen +40 % Schaden.", "+50% knockback; enemies being knocked back take +40% damage."] },
    { id: "schrecken", f: "cc", n: ["Schrecken", "Dread"], d: ["Jeder Kill lässt Gegner im Umkreis (120 px) 1,5 s fliehen.", "Each kill makes enemies nearby (120 px) flee for 1.5 s."], lock: () => hSiege(3), lockTxt: ["Ein Ende auf Härte III erreichen", "Reach an ending on Hardness III"] },
    { id: "scharfschuetze", f: "fern", n: ["Scharfschütze", "Marksman"], d: ["Fernkampftreffer aus mehr als 7 Schritt (110 px): +35 % Schaden.", "Ranged hits from more than 7 paces (110 px): +35% damage."] },
    { id: "querschlaeger", f: "fern", n: ["Querschläger", "Ricochet"], d: ["Jeder 4. Fernkampftreffer springt auf einen zweiten Gegner (120 px, 50 % Schaden).", "Every 4th ranged hit jumps to a second enemy (120 px, 50% damage)."] },
    { id: "markierung", f: "fern", n: ["Markierung", "Mark"], d: ["Fernkampftreffer markieren 4 s; dein nächster Nahkampftreffer auf ein markiertes Ziel +40 %.", "Ranged hits mark for 4 s; your next melee hit on a marked target +40%."] },
    { id: "koecher", f: "fern", n: ["Voller Köcher", "Full Quiver"], d: ["Ein Kill mit einer Fernwaffe: die nächsten 3 Fernkampftreffer +30 %.", "A kill with a ranged weapon: your next 3 ranged hits +30%."] },
    { id: "resonanz", f: "skill", n: ["Resonanz", "Resonance"], d: ["Jede Fähigkeit senkt die Restladezeit der anderen um 25 %.", "Each skill cuts the other skill's remaining cooldown by 25%."] },
    { id: "runenhunger", f: "skill", n: ["Runenhunger", "Rune Hunger"], d: ["+6 % Schaden je Rune auf deinen Waffen (bis +30 %).", "+6% damage per rune on your weapons (up to +30%)."] },
    { id: "echo", f: "skill", n: ["Widerhall", "Echo"], d: ["Fähigkeitentreffer schlagen mit 25 % Chance nach 0,4 s noch einmal zu (50 % Schaden).", "Skill hits have a 25% chance to strike again after 0.4 s (50% damage)."], lock: () => !!(M0().bossrausch && (M0().bossrausch.siege | 0) >= 1), lockTxt: ["Einen Bossrausch bestehen", "Complete a Boss Rush"] },
    { id: "kraftquell", f: "skill", n: ["Kraftquell", "Wellspring"], d: ["Jeder Kill senkt die Ladezeit deiner Fähigkeiten um 1 s.", "Each kill cuts your skills' cooldown by 1 s."] },
    { id: "rollschnitt", f: "beweg", n: ["Rollschnitt", "Roll Cut"], d: ["Rollst du durch einen Gegner, erleidet er 40 % eines Waffentreffers (einmal je Rolle und Gegner).", "Rolling through an enemy deals 40% of a weapon hit (once per roll and enemy)."], lock: () => achOk("ausweichen"), lockTxt: ["Erfolg „Unberührbar“ (20 perfekte Ausweichrollen in einem Durchgang)", "Achievement 'Untouchable' (20 perfect dodges in one run)"] },
    { id: "luftjaeger", f: "beweg", n: ["Luftjäger", "Sky Hunter"], d: ["Treffer, während du in der Luft bist: +30 % Schaden.", "Hits while you are airborne: +30% damage."] },
    { id: "schwung", f: "beweg", n: ["Schwung", "Momentum"], d: ["Nach 0,7 s ununterbrochenem Laufen: nächster Treffer +40 %.", "After 0.7 s of running: next hit +40%."] },
    { id: "windlaeufer", f: "beweg", n: ["Windläufer", "Windrunner"], d: ["Nach einem Doppelsprung 2 s lang +25 % Schaden.", "After a double jump: +25% damage for 2 s."] },
    { id: "ausweichkunst", f: "beweg", n: ["Haarscharf", "Hairbreadth"], d: ["Ein perfektes Ausweichen lädt deine Fähigkeiten um 2 s auf.", "A perfect dodge recharges your skills by 2 s."] },
    { id: "zinsen", f: "beute", n: ["Zinsen", "Interest"], d: ["Beim Betreten eines Gebiets +8 % deines Golds (höchstens 120).", "On entering an area +8% of your gold (at most 120)."] },
    { id: "beutejaeger", f: "beute", n: ["Beutejäger", "Spoil Hunter"], d: ["Elites lassen zusätzlich Gold fallen und mit 25 % Chance Schmiedeglut.", "Elites drop extra gold and, with a 25% chance, a forge ember."] },
    { id: "gluecksfund", f: "beute", n: ["Glücksfund", "Lucky Find"], d: ["Gegner lassen mit 6 % Chance einen Heilschluck fallen.", "Enemies have a 6% chance to drop a healing sip."] },
    { id: "goldrausch", f: "beute", n: ["Goldrausch", "Gold Rush"], d: ["Jede aufgesammelte Münzladung +1,5 % Schaden für 8 s (bis +18 %).", "Every coin pickup +1.5% damage for 8 s (up to +18%)."], lock: () => achOk("gold"), lockTxt: ["Erfolg „Echos Liebling“ (1000 Gold in einem Durchgang)", "Achievement 'Echo's Darling' (1,000 gold in one run)"] }
  ];
  const BY = {}; for (const g of G) BY[g.id] = g;
  const offen = g => !g.lock || g.lock();

  /* ---------- Spieler-Zustand ---------- */
  const players = () => { if (Array.isArray(Z.players) && Z.players.length) return Z.players.filter(Boolean); const o = Z.player ? [Z.player] : []; if (Z.koop && Z.koop.p2) o.push(Z.koop.p2); return o; }; /* W27 Koop: Spieler 2 = Z.koop.p2 */
  const of = P => (P && (P.mut || (P.mut = []))) || [];
  const st = P => P.mutS || (P.mutS = {});
  const hat = (P, id) => !!(P && P.mut && P.mut.indexOf(id) >= 0);
  function spiegel() { if (!Z.run) return; const o = {}; players().forEach((P, i) => { o["p" + (i + 1)] = of(P).slice(); }); Z.run.mut = o; }
  function gib(P, id, ersetze) {
    if (!P || !BY[id]) return false; const m = of(P);
    if (m.indexOf(id) >= 0) return false;
    if (ersetze) { const i = m.indexOf(ersetze); if (i >= 0) m.splice(i, 1); }
    if (m.length >= MAXM) return false;
    m.push(id); if (id === "zaeh") Z.recalcPlayer && Z.recalcPlayer();
    Z.stats && ((Z.stats.mutWahl = Z.stats.mutWahl || {})[id] = 1); spiegel(); hud(true); return true;
  }
  function weg(P, id) { const m = of(P), i = m.indexOf(id); if (i < 0) return false; m.splice(i, 1); if (id === "zaeh") Z.recalcPlayer && Z.recalcPlayer(); spiegel(); hud(true); return true; }
  function reset(P) { if (!P) return; P.mut = []; P.mutS = {}; }

  /* ---------- Angebot: gewichtet nach Ausrüstung, drei Familien, Abwechslung ---------- */
  function gewichte(P) {
    const w = { glas: 1, tank: 1, cc: 1, fern: 0.7, skill: 0.6, beweg: 1, beute: 0.9 };
    const sl = P.slots || {};
    for (const s of ["a1", "a2"]) { const it = sl[s], d = it && Z.itemDef(it); if (!d) continue;
      const tg = (d.tags || []).join(" ").toLowerCase();
      if (d.kind === "ranged") w.fern += 2.4; else if (d.kind === "shield") { w.tank += 1.8; w.cc += 0.6; } else { w.glas += 0.8; w.beweg += 0.6; w.cc += 0.3; }
      if (/kontrolle|frost|festhalten|wucht/.test(tg)) w.cc += 1.2;
      if (/panzer|parade|dornen/.test(tg)) w.tank += 1;
      if (/schnell|meuchler|kritisch|glaskanone/.test(tg)) w.glas += 0.8;
      if (/reichweite|abstand|fernkampf|präzision/.test(tg)) w.fern += 0.6;
      if ((it.runes || []).length) w.skill += 0.3 * it.runes.length; }
    if (sl.s1 || sl.s2) w.skill += 1.6 + (sl.s1 && sl.s2 ? 0.8 : 0);
    const s2 = P.stats || {}; w.tank += 0.25 * (s2.ueber || 0); w.beweg += 0.2 * (s2.takt || 0); w.glas += 0.2 * (s2.brut || 0);
    return w;
  }
  function angebot(P) {
    const besitz = of(P), seen = (Z.run && Z.run.mutSeen) || [];
    const pool = G.filter(g => offen(g) && besitz.indexOf(g.id) < 0);
    const w = gewichte(P), fams = Object.keys(FAM).filter(f => pool.some(g => g.f === f)), out = [];
    while (out.length < 3 && fams.length) {
      let sum = 0; for (const f of fams) sum += w[f]; let r = Z.R() * sum, pick = fams[0];
      for (const f of fams) { r -= w[f]; if (r <= 0) { pick = f; break; } }
      fams.splice(fams.indexOf(pick), 1);
      const cand = pool.filter(g => g.f === pick); let s2 = 0; const cw = cand.map(g => { const v = (seen.indexOf(g.id) >= 0 ? 0.35 : 1) * (g.id === "runenhunger" ? 0.4 + 0.5 * runen(P) : 1); s2 += v; return v; });
      let r2 = Z.R() * s2, gp = cand[0]; for (let i = 0; i < cand.length; i++) { r2 -= cw[i]; if (r2 <= 0) { gp = cand[i]; break; } }
      out.push(gp.id);
    }
    if (Z.run) Z.run.mutSeen = out.slice();
    return out;
  }
  const runen = P => ["a1", "a2"].reduce((n, s) => n + (((P.slots || {})[s] || {}).runes || []).length, 0);

  /* Messzähler (Prüfstand/Bilanz): Grundschaden, Schaden mit Gaben, Zusatztreffer, verhinderter Schaden, Kontrollsekunden, Ladezeit, Gold, Heilfunde */
  const MS = { base: 0, mut: 0, extra: 0, verh: 0, ctrl: 0, cd: 0, gold: 0, heil: 0 };
  const xhit = (ctx, q, d, o) => { const h = q.hp; hit0.call(ctx, q, d, o); MS.extra += Math.max(0, h - Math.max(0, q.hp)); };
  /* ---------- Wirkungen ---------- */
  const now = () => (Z.player && Z.player.time) || (Z.run && Z.run.time) || 0;
  const pcx = P => P.x + P.w / 2;
  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    const koop = o.src === "koop" && Z.koop && Z.koop.p2, P = koop ? Z.koop.p2 : Z.player; /* Koop: Treffer von Spieler 2 nutzen SEINE Gaben */
    const srcOrig = o.src; if (koop) o = Object.assign({}, o, { src: o.ranged || o.proj ? "ranged" : "melee" });
    if (!P || !P.mut || !P.mut.length || !e || e.dummy && !o.mutTest || typeof dmg !== "number" || o.mut || o.self || o.dot || !(o.src === "melee" || o.src === "ranged" || o.src === "skill" || (o.it && P.slots && (o.it === P.slots.s1 || o.it === P.slots.s2)))) return hit0.apply(this, arguments);
    const S = st(P); let m = 1; const t = now(), boss = !!(e.def && e.def.boss), skl = src0 => src0 === "skill" || (src0 === "ranged" && !o.it) /* Bomben/Phiolen/Türme fliegen ohne Waffe */ || !!(o.it && P.slots && (o.it === P.slots.s1 || o.it === P.slots.s2)), src = skl(o.src) ? "skill" : o.src;
    if (hat(P, "henker") && e.hp < e.hpMax * 0.3) m *= boss ? 1.3 : 1.6;
    if (hat(P, "ruhm")) m *= 1 + 0.03 * (S.ruhm || 0);
    if (hat(P, "blutzoll")) m *= 1 + 0.01 * Math.min(30, S.zoll || 0);
    if (hat(P, "gegenstoss") && S.konter) { m *= 2; S.konter = 0; Z.addStatus(e, "stun", 0.5); MS.ctrl += 0.5; }
    if (hat(P, "kettenstoss")) { if (e.kbT > 0) m *= 1.4; if (o.kb) o = Object.assign({}, o, { kb: o.kb * 1.5 }); }
    if (hat(P, "scharfschuetze") && src === "ranged" && Math.abs(pcx(P) - (e.x + e.w / 2)) > 110) m *= 1.35;
    if (hat(P, "markierung")) { if (src === "ranged") e._mutMark = t + 4; else if (src === "melee" && e._mutMark > t) { m *= 1.4; e._mutMark = 0; } }
    if (hat(P, "koecher") && src === "ranged" && S.koecher > 0) { m *= 1.3; S.koecher--; }
    if (hat(P, "runenhunger")) m *= 1 + Math.min(0.3, 0.06 * runen(P));
    if (hat(P, "luftjaeger") && !P.onGround && !P.climbing) m *= 1.3;
    if (hat(P, "schwung") && S.schwung) { m *= 1.4; S.schwung = 0; S.runT = 0; }
    if (hat(P, "windlaeufer") && S.wind > t) m *= 1.25;
    if (hat(P, "goldrausch") && S.gold > 0) m *= 1 + 0.015 * Math.min(12, S.gold);
    let add = 0;
    if (hat(P, "wutstau") && S.wut > 0) { add = Math.min(S.wut, dmg * 1.5); S.wut = 0; }
    /* Deckel: alle Mutationen zusammen höchstens ×2,0 auf einen Treffer (+ Wutstau höchstens bis ×2,5) – Stapeln mit Segen/Runen bleibt im Rahmen */
    m = Math.min(m, 2); const d2 = Math.min(dmg * m + add, dmg * 2.5); MS.base += dmg; MS.mut += d2;
    const hp0 = e.hp, r = hit0.call(this, e, d2, Object.assign({}, o, { mutM: m, src: srcOrig }));
    if (e.hp < hp0) {
      e._mutSrc = src;
      if (hat(P, "ruhm") && t - (S.ruhmT || -9) > 0.12) { S.ruhm = Math.min(10, (S.ruhm || 0) + 1); S.ruhmT = t; }
      if (hat(P, "eisengriff") && ((e.st.stun || 0) > 0 || (e.st.root || 0) > 0)) { e._mutGrip = (e.st.stun > 0 || e.st.root > 0) ? (e._mutGrip || 0) : 0; if ((e._mutGrip || 0) < 1.2) { const k = e.st.stun > 0 ? "stun" : "root"; e.st[k] += boss ? 0.15 : 0.4; MS.ctrl += boss ? 0.15 : 0.4; e._mutGrip = (e._mutGrip || 0) + 0.4; } }
      if (hat(P, "frostbiss")) { e._mutFrost = (e._mutFrost || 0) + 1; if (e._mutFrost % 3 === 0) { Z.addStatus(e, "slow", 2); MS.ctrl += 2 * 0.45; FX.text(e.x + e.w / 2, e.y - 6, L(["Frost!", "Frost!"]), "#c8d0d8"); } }
      if (hat(P, "ueberladung") && src === "melee") { S.ul = (S.ul || 0) + 1; if (S.ul % 4 === 0) {
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2; FX.ring(cx, cy, 48, "#ff8a3a", 0.35, 3); FX.burst(cx, cy, 14, { col: ["#ff8a3a", "#ffd27a"], sp: 120, life: 0.4, size: 2.4, kind: "spark", add: true }); A.play("explode", { vol: 0.35 });
        for (const q of Z.enemies) if (q !== e && !q.dead && !q.dummy && Math.hypot(q.x + q.w / 2 - cx, q.y + q.h / 2 - cy) < 48 + q.w / 2) xhit(this, q, dmg * 0.6, { src: "melee", mut: true, kb: 60 }); } }
      if (hat(P, "querschlaeger") && src === "ranged") { S.qs = (S.qs || 0) + 1; if (S.qs % 4 === 0) { let b = null, bd = 120; for (const q of Z.enemies) { if (q === e || q.dead || q.dummy) continue; const dd = Math.hypot(q.x - e.x, q.y - e.y); if (dd < bd) { bd = dd; b = q; } }
        if (b) { FX.beam ? FX.beam(e.x + e.w / 2, e.y + e.h / 2, b.x + b.w / 2, b.y + b.h / 2, "#8ab04a") : FX.burst(b.x + b.w / 2, b.y + b.h / 2, 8, { col: "#8ab04a", sp: 80, life: 0.3, size: 2, kind: "spark", add: true }); xhit(this, b, dmg * 0.5, { src: "ranged", mut: true, kb: 20 }); } } }
      if (hat(P, "echo") && src === "skill" && Z.R() < 0.25) (S.echoQ = S.echoQ || []).push({ e, d: dmg * 0.5, t: t + 0.4 });
    }
    return r;
  };
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (d, o) {
    const P = Z.player;
    if (!P || !P.mut || !P.mut.length || typeof d !== "number" || d <= 0) return hurt0.apply(this, arguments);
    const S = st(P), hp0 = P.hp;
    const d0 = d; if (hat(P, "letzterstand") && P.hp < P.hpMax * 0.25) d *= 0.6;
    if (hat(P, "panzerhaut") && S.schild > 0 && !(o && o.force && o.fall)) { const a = Math.min(S.schild, d); S.schild -= a; d -= a; if (S.schild <= 0) { S.schildPause = now() + 8; FX.text(pcx(P), P.y - 14, L(["Schild bricht", "Shield breaks"]), "#c8a060"); } S.ruheT = 0; if (d <= 0) { MS.verh += d0; FX.ring(pcx(P), P.y + 12, 18, "#c8a060", 0.25, 2); return; } }
    MS.verh += d0 - d;
    const r = hurt0.call(this, d, o);
    const lost = hp0 - P.hp;
    if (lost > 0) { S.ruheT = 0; if (hat(P, "ruhm")) S.ruhm = 0; if (hat(P, "wutstau")) S.wut = Math.min((S.wut || 0) + lost * 3, 400); }
    return r;
  };
  /* Gegenstoß: Parade oder Block über den Schild-Haken (kampf.js ruft Z.shieldHook("parry"|"block", P, o, dmg)) */
  const sh0 = Z.shieldHook;
  Z.shieldHook = function (k, P, o, dd) { try { if ((k === "parry" || k === "block") && P && hat(P, "gegenstoss")) st(P).konter = 1; } catch (_) {} return sh0 ? sh0.apply(this, arguments) : undefined; };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && !e.dead && !e.dummy;
    const r = kill0.apply(this, arguments);
    try {
      const P = Z.player; if (!was || !P || !P.mut || !P.mut.length) return r;
      const S = st(P), cx = e.x + e.w / 2, cy = e.y + e.h / 2, tier = (Z.run && Z.run.tier) || 0;
      if (hat(P, "blutzoll")) S.zoll = (S.zoll || 0) + 1;
      if (hat(P, "kraftquell")) for (const k of ["s1", "s2"]) if (P.cd && P.cd[k] > 0) { MS.cd += Math.min(1, P.cd[k]); P.cd[k] = Math.max(0, P.cd[k] - 1); }
      if (hat(P, "koecher") && e._mutSrc === "ranged") S.koecher = 3;
      if (hat(P, "schrecken")) for (const q of Z.enemies) if (q !== e && !q.dead && !(q.def && q.def.boss) && Math.hypot(q.x + q.w / 2 - cx, q.y + q.h / 2 - cy) < 120) { MS.ctrl += 1.5 - Math.max(0, q.st.fear || 0); q.st.fear = Math.max(q.st.fear || 0, 1.5); }
      if (hat(P, "beutejaeger") && e.elite) { if (Z.spawnPickup) for (let i = 0; i < 3; i++) { Z.spawnPickup("gold", cx, cy, { n: 4 + 2 * tier, vx: (Z.R() - 0.5) * 160, vy: -180 }); MS.gold += 4 + 2 * tier; } if (Z.R() < 0.25 && Z.spawnReward) Z.spawnReward("glut", cx, cy, { n: 1 }); }
      if (hat(P, "gluecksfund") && !(e.def && e.def.boss) && Z.R() < 0.06 && Z.spawnReward) { Z.spawnReward("heil", cx, cy, { drop: true }); MS.heil++; }
    } catch (err) { console.error("mutationen", err); }
    return r;
  };
  if (Z.recalcPlayer) { const rc0 = Z.recalcPlayer; Z.recalcPlayer = function () { const r = rc0.apply(this, arguments); const P = Z.player; if (P && hat(P, "zaeh")) { const ratio = P.hp / P.hpMax; P.hpMax = Math.round(P.hpMax * 1.25); P.hp = Math.max(1, Math.round(P.hpMax * ratio)); } return r; }; }

  /* jeder Rechenschritt: Zeitgeber, Bewegungs-Auslöser, Gold, Widerhall */
  const up0 = Z.updatePickups;
  Z.updatePickups = function (dt) {
    const r = up0.apply(this, arguments);
    try {
      for (const P of players()) {
        if (!P.mut || !P.mut.length || P.dead) { if (P) P._mutG = P.gold; continue; }
        const S = st(P), t = now();
        if (hat(P, "panzerhaut")) { S.ruheT = (S.ruheT || 0) + dt; if (!(S.schild > 0) && S.ruheT >= 2.5 && !(S.schildPause > t)) { S.schild = Math.round(P.hpMax * 0.12); FX.ring(pcx(P), P.y + 12, 16, "#c8a060", 0.3, 2); } }
        if (hat(P, "schwung")) { if (P.onGround && Math.abs(P.vx) > 100 && !P.act) { S.runT = (S.runT || 0) + dt; if (S.runT >= 0.7 && !S.schwung) { S.schwung = 1; FX.burst(pcx(P), P.y + P.h, 6, { col: "#e0c060", sp: 50, life: 0.3, size: 2, kind: "spark", add: true }); } } else if (!P.act) S.runT = 0; }
        if (hat(P, "windlaeufer")) { if (P.onGround || P.climbing) S.aj = P.airJumps; else { if (S.aj != null && P.airJumps < S.aj) { S.wind = t + 2; FX.ring(pcx(P), P.y + P.h, 14, "#e0c060", 0.25, 2); } S.aj = P.airJumps; } }
        if (hat(P, "ausweichkunst")) { const ad = (P.st && P.st.adrenalin) || 0; if (ad > 0 && !(S.adr > 0)) for (const k of ["s1", "s2"]) if (P.cd && P.cd[k] > 0) { MS.cd += Math.min(2, P.cd[k]); P.cd[k] = Math.max(0, P.cd[k] - 2); } S.adr = ad; }
        if (hat(P, "resonanz") && P.cd) { for (const k of ["s1", "s2"]) { const o2 = k === "s1" ? "s2" : "s1", prev = (S.cdPrev || {})[k] || 0; if (P.cd[k] > prev + 0.5 && P.cd[o2] > 0) { MS.cd += P.cd[o2] * 0.25; P.cd[o2] *= 0.75; } } S.cdPrev = { s1: P.cd.s1 || 0, s2: P.cd.s2 || 0 }; }
        if (hat(P, "goldrausch")) { if (P._mutG != null && P.gold > P._mutG) { S.gold = Math.min(12, (S.gold || 0) + 1); S.goldT = t + 8; } if (S.goldT && t > S.goldT) { S.gold = 0; S.goldT = 0; } }
        P._mutG = P.gold;
        if (hat(P, "rollschnitt") && P.rollT > 0) { S.rollHit = S.rollHit || new Set(); for (const e of Z.enemies) if (!e.dead && !e.dummy && !S.rollHit.has(e) && U.overlap(P, e)) { S.rollHit.add(e); const it = P.slots && P.slots.a1, base = 14 * (it ? Z.itemMul(it) : 1); xhit(Z, e, base * 0.4 * 2.2, { src: "melee", mut: true, kb: 40, dir: P.face }); FX.smear && FX.smear({ x: pcx(P), y: P.y + 14, dir: P.face, r: 16, a0: -0.4, a1: 0.4, th: 4 }); } } else if (S.rollHit) S.rollHit = null;
        if (S.echoQ && S.echoQ.length) { for (let i = S.echoQ.length - 1; i >= 0; i--) { const q = S.echoQ[i]; if (t >= q.t) { S.echoQ.splice(i, 1); if (!q.e.dead) { FX.ring(q.e.x + q.e.w / 2, q.e.y + q.e.h / 2, 16, "#d89a3a", 0.25, 2); xhit(Z, q.e, q.d, { src: "skill", mut: true, kb: 10 }); } } } }
      }
    } catch (err) { console.error("mutationen", err); }
    return r;
  };

  /* ---------- Gebiete: Zinsen, Blutzoll zurücksetzen, Schrein im Durchgang, Lager ---------- */
  const la0 = Z.loadArea;
  Z.loadArea = function (id, opts) {
    const from = Z.level && Z.level.id, fromNorm = Z.level && !Z.level.hub && !Z.level.passage && !Z.level.arena;
    const r = la0.apply(this, arguments);
    try {
      const lv = Z.level;
      if (lv && lv.hub) { for (const P of players()) reset(P); spiegel(); }
      for (const P of players()) { const S = st(P); S.zoll = 0; S.ruhm = 0; }
      if (lv && !lv.hub && !lv.passage && !lv.arena) for (const P of players()) if (hat(P, "zinsen") && P.gold > 0) { const g = Math.min(120, Math.round(P.gold * 0.08)); if (g > 0) { P.gold += g; MS.gold += g; FX.text(pcx(P), P.y - 16, "+" + g + " ● " + L(["Zinsen", "interest"]), "#e8b43a", true); } }
      if (lv && lv.passage && (fromNorm || (opts && opts.from && opts.from !== "lager")) && Z.run) schrein(lv);
      hud(true);
    } catch (err) { console.error("mutationen", err); }
    return r;
  };
  function schrein(lv) {
    const tx = 8, ty = lv.start ? lv.start.y : 9, x = tx * T + 8, y = (ty + 1) * T;
    lv._mut = { x, y, wahl: {}, t: 0 };
    (Z.interacts = Z.interacts || []).push({ x, y, r: 24, h: 40, mutSchrein: true, label: () => L(["Wandlungsschrein · Gabe wählen", "Shrine of Change · choose a gift"]) + (lv._mut.wahl[pIdx(Z.player)] ? " · " + L(["gewählt", "chosen"]) : ""), ok: () => !lv._mut.wahl[pIdx(Z.player)], use: () => oeffne() });
  }
  const pIdx = P => Math.max(0, players().indexOf(P));

  /* ---------- Wahlfenster: drei Karten, bei vollem Beutel eine ersetzen ---------- */
  let ctx = null;
  function karte(id, i, opts) {
    const g = BY[id], f = FAM[g.f], cls = opts && opts.cls ? " " + opts.cls : "";
    return '<button class="mut-karte' + cls + '" style="--fc:' + f.col + '" data-act="' + (opts && opts.act || "mutNimm") + '" data-arg="' + id + '" data-key="' + (i + 1) + '"' + (i === 0 ? " autofocus" : "") + ">" +
      '<span class="mut-ico">' + f.ico + "</span><b>" + esc(L(g.n)) + '</b><span class="mut-fam">' + esc(L(f.n)) + "</span><small>" + esc(L(g.d)) + "</small>" + (opts && opts.foot ? '<em>' + esc(opts.foot) + "</em>" : "") + "</button>";
  }
  function oeffne(Pw) {
    const P = Pw || Z.player, lv = Z.level; /* Koop (W27): oeffne(spieler) – jede Figur wählt einmal je Durchgang */ if (!P || !lv || !lv._mut || lv._mut.wahl[pIdx(P)]) return;
    const k = pIdx(P); lv._mut.angebot = lv._mut.angebot || {}; const ang = lv._mut.angebot[k] || (lv._mut.angebot[k] = angebot(P));
    ctx = { P, lv, ang, nimm: null };
    const voll = of(P).length >= MAXM;
    Z.ui.open('<div class="mutwahl"><h2>' + esc(L(["Wandlungsschrein", "Shrine of Change"])) + '</h2><p class="hinweis">' + esc(L(["Wähle eine Gabe. Höchstens drei wirken zugleich" + (voll ? " – deine Gaben sind voll, du ersetzt danach eine." : "."), "Choose a gift. At most three work at once" + (voll ? " – yours are full, you will replace one next." : ".")])) + "</p>" +
      '<div class="mut-reihe">' + ang.map((id, i) => karte(id, i)).join("") + "</div>" + aktivHTML(P) +
      '<div class="knoepfe"><button data-act="mutSkip">' + esc(L(["Nichts nehmen", "Take nothing"])) + "</button></div></div>", { cls: "breit" });
    A.play("rune", { vol: 0.5 });
  }
  function aktivHTML(P) { const m = of(P); return m.length ? '<p class="mut-aktiv">' + esc(L(["Aktiv: ", "Active: "])) + m.map(id => '<span style="color:' + FAM[BY[id].f].col + '">' + FAM[BY[id].f].ico + " " + esc(L(BY[id].n)) + "</span>").join(" · ") + "</p>" : ""; }
  Z.ui.actions.mutNimm = id => {
    const c = ctx; if (!c || c.ang.indexOf(id) < 0) return;
    if (of(c.P).length >= MAXM) { c.nimm = id; ersetzen(); return; }
    fertig(id, null);
  };
  function ersetzen() {
    const c = ctx, P = c.P, neu = BY[c.nimm];
    Z.ui.open('<div class="mutwahl"><h2>' + esc(L(["Welche Gabe weicht?", "Which gift gives way?"])) + '</h2><p class="hinweis">' + esc(L(["Neu: ", "New: "])) + esc(L(neu.n)) + " – " + esc(L(neu.d)) + "</p>" +
      '<div class="mut-reihe">' + of(P).map((id, i) => karte(id, i, { act: "mutErsetze", cls: "alt", foot: L(["ersetzen", "replace"]) })).join("") + "</div>" +
      '<div class="knoepfe"><button data-act="mutZurueck">' + esc(L(["Zurück", "Back"])) + "</button></div></div>", { cls: "breit" });
  }
  Z.ui.actions.mutErsetze = alt => { const c = ctx; if (!c || !c.nimm) return; fertig(c.nimm, alt); };
  Z.ui.actions.mutZurueck = () => { if (ctx) { const P = ctx.P; ctx.nimm = null; Z.ui.close(); oeffne(P); } }; /* W29 Mutationen: Koop – Zurück bleibt bei der wählenden Figur */
  Z.ui.actions.mutSkip = () => { const c = ctx; if (c) c.lv._mut.wahl[pIdx(c.P)] = "-"; ctx = null; Z.ui.close(); };
  function fertig(id, alt) {
    const c = ctx; if (!c) return;
    if (alt) weg(c.P, alt);
    gib(c.P, id);
    c.lv._mut.wahl[pIdx(c.P)] = id; ctx = null; Z.ui.close();
    const g = BY[id]; A.play("holy", { vol: 0.5 }); FX.burst(pcx(c.P), c.P.y + 10, 18, { col: [FAM[g.f].col, "#fff0c0"], sp: 90, up: 50, life: 0.7, size: 2, kind: "glow", add: true });
    Z.toast && Z.toast(FAM[g.f].ico + " <b>" + esc(L(g.n)) + "</b><small>" + esc(L(g.d)) + "</small>", 3200);
  }

  /* ---------- Zeichnen: Schrein im Durchgang ---------- */
  const wp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (wp0) wp0.apply(this, arguments);
    try {
      const lv = Z.level, s = lv && lv._mut; if (!s) return;
      const x = s.x, y = s.y, done = !!s.wahl[pIdx(Z.player)], tt = t || 0;
      c.save();
      c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(x, y, 14, 3, 0, 0, Math.PI * 2); c.fill();
      /* knorriger Wurzelstock mit Steinschale */
      c.fillStyle = "#4a3428"; c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x - 9, y - 12, x - 4, y - 18); c.lineTo(x + 4, y - 18); c.quadraticCurveTo(x + 9, y - 12, x + 12, y); c.closePath(); c.fill();
      c.strokeStyle = "#2a1c16"; c.lineWidth = 1; for (const dx of [-6, 0, 5]) { c.beginPath(); c.moveTo(x + dx, y); c.quadraticCurveTo(x + dx * 0.4, y - 9, x + dx * 0.2, y - 17); c.stroke(); }
      c.fillStyle = "#5e5250"; c.fillRect(x - 11, y - 21, 22, 4); c.fillStyle = "#3a3030"; c.fillRect(x - 9, y - 19, 18, 2);
      /* drei Samen: Glut, Gold, Violett – erlöschen nach der Wahl */
      const cols = ["#e05a3a", "#e8b43a", "#9a7ac0"];
      for (let i = 0; i < 3; i++) { const sx = x - 6 + i * 6, sy = y - 25 + Math.sin(tt * 2 + i * 2.1) * 1.6, col = done ? "#5a4a40" : cols[i];
        if (!done && Z.draw && Z.draw.glow) { c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, sx, sy, 7 + Math.sin(tt * 3 + i) * 1.2, i === 0 ? "rgba(224,90,58,.45)" : i === 1 ? "rgba(232,180,58,.45)" : "rgba(154,122,192,.45)"); c.restore(); }
        c.fillStyle = col; c.beginPath(); c.arc(sx, sy, 2.4, 0, Math.PI * 2); c.fill(); }
      c.restore();
    } catch (err) { /* still */ }
  };

  /* ---------- HUD: aktive Gaben unter den Segen ---------- */
  let hudKey = "";
  function hud(force) {
    const box = document.getElementById("bless"); if (!box || !box.parentNode) return;
    let el = document.getElementById("mutbar"); if (!el) { el = document.createElement("div"); el.id = "mutbar"; box.parentNode.insertBefore(el, box.nextSibling); }
    const P = Z.player, m = P && P.mut ? P.mut : [], k = m.join("|") + (Z.settings && Z.settings.lang);
    if (!force && k === hudKey) return; hudKey = k;
    el.innerHTML = m.map(id => { const g = BY[id], f = FAM[g.f]; return '<span class="mut-hud" style="--fc:' + f.col + '" title="' + esc(L(g.n)) + " – " + esc(L(g.d)) + '">' + f.ico + " " + esc(L(g.n)) + "</span>"; }).join("");
    el.hidden = !m.length;
  }
  setInterval(() => { try { hud(false); } catch (_) {} }, 700);

  /* ---------- Lager: Übersicht und Freischaltungen ---------- */
  function liste() {
    const fams = Object.keys(FAM);
    let h = '<div class="mutwahl mutliste"><h2>' + esc(L(["Gaben der Wandlung", "Gifts of Change"])) + '</h2><p class="hinweis">' + esc(L(["Nach jedem Gebiet wächst im Durchgang ein Wandlungsschrein: 1 von 3 Gaben, höchstens drei zugleich. Gesperrte Gaben zeigen, wie man sie freischaltet.", "After every area a Shrine of Change grows in the passage: 1 of 3 gifts, at most three at once. Locked gifts show how to unlock them."])) + "</p>";
    for (const f of fams) {
      h += '<h4 style="color:' + FAM[f].col + '">' + FAM[f].ico + " " + esc(L(FAM[f].n)) + '</h4><div class="mut-reihe klein">';
      for (const g of G.filter(q => q.f === f)) { const ok = offen(g); h += '<div class="mut-karte klein' + (ok ? "" : " zu") + '" style="--fc:' + FAM[f].col + '"><b>' + esc(L(g.n)) + "</b><small>" + esc(ok ? L(g.d) : "🔒 " + L(g.lockTxt)) + "</small></div>"; }
      h += "</div>";
    }
    return h + '<div class="knoepfe"><button data-act="close" autofocus>' + esc(L(["Fertig", "Done"])) + "</button></div></div>";
  }
  function installLager() {
    if (!Z.lager || !Z.lager.station) return false;
    Z.lager.station("mutationen", {
      n: ["Wandlungsbaum", "Tree of Change"],
      label: () => { const n = G.filter(offen).length; return L(["Wandlungsbaum · Gaben ", "Tree of Change · gifts "]) + n + "/" + G.length; },
      use: () => Z.ui.open(liste(), { cls: "breit" }),
      draw: (c, x, y, t) => {
        c.save(); c.fillStyle = "#4a3428"; c.fillRect(x - 2, y - 26, 4, 26); c.fillStyle = "#3a2a20"; c.fillRect(x - 6, y - 2, 12, 2);
        const cols = ["#e05a3a", "#c8a060", "#9a7ac0", "#8ab04a", "#d89a3a", "#e0c060", "#e8b43a"];
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42, r = 13, bx = x + Math.cos(a) * r, by = y - 24 + Math.sin(a) * r * 0.8; c.strokeStyle = "#4a3428"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y - 22); c.lineTo(bx, by); c.stroke();
          c.fillStyle = cols[i]; c.beginPath(); c.arc(bx, by + Math.sin((t || 0) * 2 + i) * 0.8, 2.2, 0, Math.PI * 2); c.fill(); }
        c.restore();
      }
    });
    return true;
  }
  if (!installLager()) window.addEventListener("load", installLager);

  /* ---------- Gestaltung ---------- */
  const css = document.createElement("style");
  css.textContent = [
    ".mutwahl .mut-reihe{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:8px 0}",
    ".mutwahl .mut-karte{flex:1 1 30%;min-width:170px;max-width:240px;text-align:left;display:flex;flex-direction:column;gap:3px;padding:10px 11px;border:1px solid var(--fc);border-top:4px solid var(--fc);background:linear-gradient(180deg,rgba(60,30,22,.95),rgba(26,16,14,.95));color:#efe2c8;border-radius:4px}",
    ".mutwahl .mut-karte .mut-ico{font-size:22px;color:var(--fc);line-height:1}.mutwahl .mut-karte b{color:var(--fc);font-size:15px}",
    ".mutwahl .mut-karte .mut-fam{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.75}.mutwahl .mut-karte small{font-size:12.5px;line-height:1.35}",
    ".mutwahl .mut-karte em{font-style:normal;color:var(--fc);font-size:11px;margin-top:2px}",
    ".mutwahl .mut-karte:focus,.mutwahl .mut-karte:hover{outline:2px solid var(--fc);background:linear-gradient(180deg,rgba(90,40,26,.98),rgba(36,20,16,.98))}",
    ".mutwahl .mut-karte.klein{min-width:150px;max-width:200px;flex:1 1 22%;padding:6px 8px}.mutwahl .mut-karte.zu{opacity:.55;filter:grayscale(.6)}",
    ".mutwahl .mut-aktiv{font-size:12.5px;text-align:center;opacity:.9}",
    "#mutbar{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}#mutbar .mut-hud{font-size:11px;padding:1px 5px;border:1px solid var(--fc);color:var(--fc);background:rgba(20,12,10,.7);border-radius:3px;white-space:nowrap}",
    "@media (max-width:700px){.mutwahl .mut-karte{min-width:46%;padding:8px}.mutwahl .mut-karte small{font-size:12px}#mutbar .mut-hud{font-size:10px}}"
  ].join("\n");
  document.head.appendChild(css);

  Z.mut = { mess: () => Object.assign({}, MS), messReset: () => { for (const k in MS) MS[k] = 0; }, liste: G, FAM, gib, weg, of, angebot, oeffne, hat, reset, offen: id => !!BY[id] && offen(BY[id]), MAX: MAXM };
})();
