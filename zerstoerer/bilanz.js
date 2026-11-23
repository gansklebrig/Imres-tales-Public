/* Ezekiel – The Destroyer · Laufbilanz
   Zählt während eines Durchgangs mit: Schaden, größter Treffer, Krits, Kills je Waffe, Serien, Rollen, Sprünge, Tränke, Fähigkeiten, Fallen, Strecke …
   Am Ende (Tod, Abbruch, Sieg) zeigt Z.runStatsHTML() eine ausführliche Bilanz mit Bestwerten. */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, L = v => Z.L(v);
  const S = () => (Z.stats = Z.stats || {});
  const inc = (k, n) => { const s = S(); s[k] = (s[k] || 0) + (n == null ? 1 : n); };

  const hit0 = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {};
    const n = hit0(e, dmg, o) || 0;
    if (n > 0 && !o.dot) {
      const s = S(); inc("hits"); if (o.crit) inc("crits");
      if (n > (s.maxHit || 0)) { s.maxHit = n; s.maxHitBy = o.it ? o.it.id : o.src || ""; }
      const k = o.it ? o.it.id : o.src === "melee" ? "faeuste" : "";
      if (k) { s.dmgBy = s.dmgBy || {}; s.dmgBy[k] = (s.dmgBy[k] || 0) + n; }
    } else if (n > 0) inc("dotDmg", n);
    return n;
  };
  const kill0 = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const r = kill0.apply(this, arguments);
    /* erst zählen, wenn der Gegner wirklich liegt (Skelette setzen sich sonst wieder zusammen und würden doppelt bzw. gar nicht gezählt) */
    const was = e && e.dead && !e.deadCounted; if (was) e.deadCounted = true;
    if (was && !e.dummy) {
      const s = S(); o = o || {};
      if (e.elite) inc("elites"); if (e.def && e.def.boss) inc("bosses");
      if (o.src === "trap") inc("trapKills"); if (o.src === "fall") inc("fallKills");
      const k = o.it ? o.it.id : o.src === "melee" ? "faeuste" : o.src === "skill" ? "_skill" : "";
      if (k) { s.killsBy = s.killsBy || {}; s.killsBy[k] = (s.killsBy[k] || 0) + 1; }
      /* Serie: Kills mit höchstens 2 s Abstand */
      const now = Z.run ? Z.run.time : 0;
      s.streak = now - (s.lastKill || -9) < 2 ? (s.streak || 1) + 1 : 1; s.lastKill = now;
      if (s.streak > (s.bestStreak || 0)) s.bestStreak = s.streak;
    }
    return r;
  };
  const hurt0 = Z.hurtPlayer;
  Z.hurtPlayer = function (dmg, o) { const P = Z.player, before = P ? P.hp : 0; const r = hurt0.apply(this, arguments); if (r && P && P.hp < before) { inc("hitsTaken"); if (o && o.trap) inc("trapHits"); if (before - P.hp > (S().worstHit || 0)) S().worstHit = Math.round(before - P.hp); } return r; };

  /* je Schritt: Rollen, Sprünge, Strecke, Luftzeit, Tränke, Fähigkeiten */
  let last = null;
  Z.bilanzTick = function (dt) {
    if (Z.chTick) Z.chTick(dt);
    const P = Z.player; if (!P || !Z.run || P.dead) { last = null; return; }
    if (!last || last.P !== P) last = { P, x: P.x, roll: 0, pot: P.potions, cd: { s1: P.cd.s1, s2: P.cd.s2 }, vy: P.vy, ground: P.onGround };
    inc("dist", Math.abs(P.x - last.x)); last.x = P.x;
    if (P.rollT > 0 && last.roll <= 0) inc("rolls"); last.roll = P.rollT;
    if (P.vy < -300 && last.vy >= -300) inc("jumps"); last.vy = P.vy;
    if (!P.onGround && !P.climbing) inc("air", dt);
    if (P.potions < last.pot) inc("potions"); last.pot = P.potions;
    for (const k of ["s1", "s2"]) { if (P.cd[k] > last.cd[k] + 0.3) inc("skills"); last.cd[k] = P.cd[k]; }
    if (P.crouch) inc("crouch", dt);
  };

  /* ---------- Bilanz als HTML ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const name = id => id === "_skill" ? L(["Fähigkeiten", "Skills"]) : id === "trap" ? L(["Fallen", "Traps"]) : (Z.WEAPONS[id] || Z.SKILLS[id]) ? L((Z.WEAPONS[id] || Z.SKILLS[id]).n) : id;
  const top = o => { let b = null, v = 0; for (const k in o || {}) if (o[k] > v) { v = o[k]; b = k; } return b ? [b, v] : null; };
  const fmtT = s => { s = Math.round(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  Z.runStatsHTML = function () {
    const s = S(), P = Z.player || {}, run = Z.run || { time: 0, shardsBank: 0, route: [] }, M = Z.meta || {};
    M.rec = M.rec || {};
    const rec = (k, v) => { const nw = v > (M.rec[k] || 0) && v > 0; if (nw) M.rec[k] = v; return nw; };
    const card = (v, lab, k, sub) => '<div class="bk' + (k && rec(k, typeof v === "number" ? v : 0) ? " rekord" : "") + '"><b>' + esc(typeof v === "number" ? U.fmt(v) : v) + "</b><span>" + esc(lab) + "</span>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</div>";
    const fav = top(s.killsBy), favD = top(s.dmgBy);
    const acc = s.hits ? Math.round((s.crits || 0) / s.hits * 100) : 0;
    let h = '<div class="bilanz">';
    h += card(s.kills || 0, L(["Gegner besiegt", "Enemies slain"]), "kills", (s.elites ? s.elites + L([" Elite", " elite"]) : "") + (s.bosses ? (s.elites ? " · " : "") + s.bosses + L([" Boss", " boss"]) + (s.bosses > 1 ? L(["e", "es"]) : "") : ""));
    h += card(fmtT(run.time), L(["Zeit", "Time"]));
    h += card(Math.round(P.dmgDone || 0), L(["Schaden ausgeteilt", "Damage dealt"]), "dmg");
    h += card(Math.round(P.dmgTaken || 0), L(["Schaden erlitten", "Damage taken"]), null, s.hitsTaken ? s.hitsTaken + L([" Treffer kassiert", " hits taken"]) : "");
    h += card(s.maxHit || 0, L(["Größter Treffer", "Biggest hit"]), "maxHit", s.maxHitBy ? name(s.maxHitBy) : "");
    h += card(s.crits || 0, L(["Kritische Treffer", "Critical hits"]), null, acc ? acc + L([" % aller Treffer", "% of all hits"]) : "");
    h += card(s.bestStreak || 0, L(["Längste Kill-Serie", "Longest kill streak"]), "streak", L(["max. 2 s Abstand", "≤ 2 s apart"]));
    h += card(s.parries || 0, L(["Paraden", "Parries"]), "parries");
    h += card(s.dodges || 0, L(["Perfekt ausgewichen", "Perfect dodges"]), "dodges", (s.rolls || 0) + L([" Rollen", " rolls"]));
    h += card(s.skills || 0, L(["Fähigkeiten eingesetzt", "Skills used"]));
    h += card(s.potions || 0, L(["Heiltränke getrunken", "Potions drunk"]));
    h += card((s.trapKills || 0) + (s.fallKills || 0), L(["Gegner in Fallen & Abgründe", "Enemies into traps & chasms"]), "trapKills");
    h += card(s.falls || 0, L(["Selbst abgestürzt", "Own falls"]), null, (s.trapHits || 0) + L([" Fallentreffer", " trap hits"]));
    h += card(Math.round((s.dist || 0) / 16) + " m", L(["Strecke", "Distance"]), null, Math.round(s.air || 0) + L([" s in der Luft · ", " s airborne · "]) + (s.jumps || 0) + L([" Sprünge", " jumps"]));
    h += card(s.gold || 0, L(["Gold gesammelt", "Gold collected"]));
    h += card((run.shardsBank || 0) + (P.shards || 0), L(["Seelensplitter", "Soul shards"]));
    h += "</div>";
    if (fav || favD) h += '<p class="hinweis">' + (fav ? L(["Tödlichste Waffe: ", "Deadliest weapon: "]) + "<b>" + esc(name(fav[0])) + "</b> (" + fav[1] + L([" Kills", " kills"]) + ")" : "") + (favD ? (fav ? " · " : "") + L(["Höchster Schaden: ", "Most damage: "]) + "<b>" + esc(name(favD[0])) + "</b> (" + U.fmt(Math.round(favD[1])) + ")" : "") + "</p>";
    h += '<p class="hinweis">' + L(["Weg: ", "Route: "]) + (run.route || []).map(r => esc(Z.areaName(r))).join(" → ") + "</p>";
    if (Z.saveMeta) Z.saveMeta();
    return h;
  };

  /* ======================= HERAUSFORDERUNGEN =======================
     Je Gebiet werden 1–3 aus über 30 Herausforderungen gezogen (nur solche, die hier auch möglich sind: Truhen, Elites,
     Fallen, Geheimnisse, Abgründe, passende Ausrüstung …). Drei Arten:
       zaehl  – Zähler erreichen → sofort geschafft, Belohnung erscheint beim Spieler
       halten – Bedingung bis zum Ausgang halten → wird beim Verlassen ausgewertet; Bruch → verfehlt
       zeit   – bis zum Ausgang (bzw. Bosssieg) innerhalb eines Zeitlimits
     Belohnungen: glut, rolle, gold, segen, splitter, heil. Farben: Gold, Rot, Violett, Grün – kein Blau. */
  const R = () => Z.R();
  const st = k => (S()[k] || 0);
  const tierN = () => (Z.run ? Z.run.tier || 0 : 0);
  const slots = () => { const P = Z.player; return P ? ["a1", "a2"].map(k => P.slots[k]).filter(Boolean) : []; };
  const defs = () => slots().map(it => Z.itemDef(it)).filter(Boolean);
  const has = f => defs().some(f);
  const hasSkill = () => { const P = Z.player; return !!(P && (P.slots.s1 || P.slots.s2)); };
  const burnSrc = () => { const P = Z.player; if (!P) return false; const all = ["a1", "a2", "s1", "s2"].map(k => P.slots[k]).filter(Boolean);
    return all.some(it => ["glutaxt", "phiolen", "feuerkugel", "sprengphiole", "brandtopf", "feuerturm", "lavaschild", "pulverfass"].includes(it.id) || (it.aff || []).includes("brennend") || (it.runes || []).includes("brand")) || (P.bless || []).includes("glutspur"); };
  const pathLen = lv => { const ex = (lv.doors || []).filter(d => d.kind === "exit"); if (!ex.length || !lv.start) return 60; return Math.min.apply(null, ex.map(d => Math.abs(d.x - lv.start.x) + Math.abs(d.y - lv.start.y))); };
  const hasPits = lv => { if (!lv || !lv.get || !lv.W) return false; let n = 0; for (let x = 1; x < lv.W - 1; x++) if (lv.get(x, lv.H - 1) === 0) n++; return n >= 3; };
  const goldN = n => Math.round(n * (1 + 0.6 * tierN()));
  /* Belohnungstexte */
  const RW = { glut: ["Glut", "embers"], rolle: ["Schriftrolle", "scroll"], gold: ["Gold", "gold"], segen: ["Segen", "blessing"], splitter: ["Splitter", "shards"], heil: ["Heilung", "healing"] };
  const rwTxt = r => (r.n && r.k !== "rolle" && r.k !== "segen" && r.k !== "heil" ? "+" + r.n + " " : "") + L(RW[r.k]);
  const CH = [
    /* ---------- Kampf: Zähler ---------- */
    { id: "gemetzel", ico: "⚔", art: "zaehl", grp: "kills", n: ["Gemetzel", "Slaughter"], d: ["{n} Gegner besiegen", "Defeat {n} enemies"], need: t => 14 + 3 * t, prog: c => c.kills, rw: t => ({ k: "rolle" }) },
    { id: "kette", ico: "⛓", art: "zaehl", n: ["Kettenreaktion", "Chain Reaction"], d: ["Eine Kill-Kette von {n}", "A kill chain of {n}"], need: t => Math.min(10, 6 + Math.floor(t / 2)), prog: c => c.bestChain, rw: t => ({ k: "glut", n: 1 }) },
    { id: "luft", ico: "🜁", art: "zaehl", n: ["Luftkampf", "Air Combat"], d: ["{n} Kills in der Luft", "{n} kills while airborne"], need: t => 3 + Math.floor(t / 3), prog: c => c.airKills, rw: t => ({ k: "gold", n: goldN(60) }) },
    { id: "brand", ico: "🔥", art: "zaehl", n: ["Brandstifter", "Arsonist"], d: ["{n} brennende Gegner erledigen", "Finish {n} burning enemies"], need: t => 4 + Math.floor(t / 2), prog: c => c.burnKills, ok: () => burnSrc(), rw: t => ({ k: "glut", n: 1 }) },
    { id: "faden", ico: "◈", art: "zaehl", n: ["Markierungsjäger", "Mark Hunter"], d: ["{n} Faden-Krits (markieren, dann Nahkampf)", "{n} thread crits (mark, then melee)"], need: t => 4 + Math.floor(t / 2), prog: c => st("markCrits") - c.s0.markCrits, ok: () => has(d => d.faden) && has(d => d.kind === "melee" || d.kind === "shield"), rw: t => ({ k: "glut", n: 1 }) },
    { id: "parade", ico: "🛡", art: "zaehl", n: ["Paradenmeister", "Parry Master"], d: ["{n} Paraden", "{n} parries"], need: t => 4 + Math.floor(t / 2), prog: c => st("parries") - c.s0.parries, ok: () => has(d => d.kind === "shield"), arena: true, rw: t => ({ k: "splitter", n: 15 + 4 * t }) },
    { id: "ausweich", ico: "↯", art: "zaehl", n: ["Schattentänzer", "Shadow Dancer"], d: ["{n} perfekte Ausweichrollen", "{n} perfect dodges"], need: t => 3 + Math.floor(t / 3), prog: c => st("dodges") - c.s0.dodges, arena: true, rw: t => ({ k: "splitter", n: 12 + 4 * t }) },
    { id: "fallen", ico: "⚙", art: "zaehl", n: ["Fallenmeister", "Trap Master"], d: ["{n} Gegner durch Fallen erledigen", "Kill {n} enemies with traps"], need: t => 2 + (t >= 4 ? 1 : 0), prog: c => st("trapKills") - c.s0.trapKills, ok: () => (Z.traps || []).length >= 3, rw: t => ({ k: "glut", n: 1 }) },
    { id: "abgrund", ico: "⤓", art: "zaehl", n: ["Rückstoß", "Knockback"], d: ["{n} Gegner in den Abgrund stoßen", "Knock {n} enemies into the abyss"], need: t => 2, prog: c => st("fallKills") - c.s0.fallKills, ok: (lv) => hasPits(lv), rw: t => ({ k: "gold", n: goldN(70) }) },
    { id: "elite", ico: "☠", art: "zaehl", n: ["Elitejagd", "Elite Hunt"], d: ["Alle {n} Elite-Gegner besiegen", "Defeat all {n} elites"], d1: ["Den Elite-Gegner dieses Gebiets besiegen", "Defeat this area's elite"], need: (t, c) => c.elites0, prog: c => c.eliteKills, ok: (lv, c) => c.elites0 >= 1, rw: t => ({ k: "glut", n: 2 }) },
    { id: "blitz", ico: "⚡", art: "zaehl", grp: "kills", n: ["Schnellste Klinge", "Swiftest Blade"], d: ["{n} Kills in den ersten 30 Sekunden", "{n} kills in the first 30 seconds"], need: t => 5 + Math.floor(t / 2), prog: c => c.earlyKills, frist: 30, rw: t => ({ k: "gold", n: goldN(50) }) },
    { id: "krit", ico: "✶", art: "zaehl", n: ["Kritiker", "Critic"], d: ["{n} kritische Treffer", "{n} critical hits"], need: t => 10 + 2 * t, prog: c => st("crits") - c.s0.crits, arena: true, rw: t => ({ k: "rolle" }) },
    { id: "rund", ico: "◎", art: "zaehl", n: ["Rundumschlag", "Sweep"], d: ["Mit einem Schlag {n} Gegner treffen", "Hit {n} enemies with one swing"], need: t => 3, prog: c => c.bestSweep, ok: () => has(d => d.kind === "melee"), rw: t => ({ k: "gold", n: goldN(60) }) },
    { id: "sturz", ico: "⇣", art: "zaehl", n: ["Meteor", "Meteor"], d: ["{n} Sturzangriffe", "{n} plunge attacks"], need: t => 3, prog: c => st("dives") - c.s0.dives, rw: t => ({ k: "splitter", n: 12 + 3 * t }) },
    { id: "adrenalin", ico: "♨", art: "zaehl", n: ["Adrenalinrausch", "Adrenaline Rush"], d: ["{n} Kills mit Adrenalin (nach perfektem Ausweichen)", "{n} kills under adrenaline (after a perfect dodge)"], need: t => 3, prog: c => c.adrenKills, rw: t => ({ k: "glut", n: 1 }) },
    { id: "gabe", ico: "✧", art: "zaehl", n: ["Gabenkundig", "Gifted"], d: ["{n} Kills mit Fähigkeiten", "{n} kills with skills"], need: t => 4 + Math.floor(t / 2), prog: c => c.skillKills, ok: () => hasSkill(), rw: t => ({ k: "splitter", n: 15 + 4 * t }) },
    { id: "beid", ico: "⇄", art: "zaehl", n: ["Beidhändig", "Ambidextrous"], d: ["Je {n} Kills mit Hand 1 und Hand 2", "{n} kills each with hand 1 and hand 2"], need: t => 3 + Math.floor(t / 3), prog: c => Math.min(c.handKills.a1, c.handKills.a2), ok: () => slots().length === 2, rw: t => ({ k: "glut", n: 1 }) },
    { id: "meuchel", ico: "🗡", art: "zaehl", n: ["Meuchler", "Assassin"], d: ["{n} Treffer gegen ahnungslose Gegner", "{n} hits on unaware enemies"], need: t => 4, prog: c => c.unawareHits, rw: t => ({ k: "splitter", n: 14 + 3 * t }) },
    { id: "schlaf", ico: "☾", art: "zaehl", n: ["Leise Sohlen", "Soft Soles"], d: ["{n} schlafende Gegner überraschen", "Surprise {n} sleeping enemies"], need: (t, c) => Math.min(3, c.sleep0), prog: c => c.sleepHits, ok: (lv, c) => c.sleep0 >= 2, rw: t => ({ k: "segen" }) },
    /* ---------- Erkundung: Zähler ---------- */
    { id: "truhen", ico: "▣", art: "zaehl", n: ["Schatzsucher", "Treasure Seeker"], d: ["Alle {n} Truhen öffnen", "Open all {n} chests"], need: (t, c) => c.chests0, prog: c => c.chests, ok: (lv, c) => c.chests0 >= 2, rw: t => ({ k: "gold", n: goldN(90) }) },
    { id: "geheim", ico: "✦", art: "zaehl", n: ["Geheimnisjäger", "Secret Hunter"], d: ["{n} Geheimnisse dieses Gebiets finden", "Find {n} secrets of this area"], d1: ["Das Geheimnis dieses Gebiets finden", "Find this area's secret"], need: (t, c) => Math.min(3, c.secrets0), prog: c => c.secretsNow(), ok: (lv, c) => c.secrets0 >= 1, rw: t => ({ k: "segen" }) },
    { id: "zerstoer", ico: "✸", art: "zaehl", n: ["Zerstörer", "Destroyer"], d: ["{n} Dinge zerschlagen (Kisten, Fässer, Krüge …)", "Smash {n} things (crates, barrels, jugs…)"], need: t => 10, prog: c => st("zerbrochen") - c.s0.zerbrochen + c.propsBroken(), ok: (lv, c) => c.props0 >= 14, rw: t => ({ k: "gold", n: goldN(70) }) },
    { id: "sammler", ico: "●", art: "zaehl", n: ["Goldgräber", "Gold Digger"], d: ["{n} Gold einsammeln", "Collect {n} gold"], need: t => goldN(140), prog: c => st("gold") - c.s0.gold, rw: t => ({ k: "splitter", n: 15 + 4 * t }) },
    /* ---------- Bedingungen bis zum Ausgang ---------- */
    { id: "unberuehrt", ico: "❖", art: "halten", grp: "treffer", w: 1.6, n: ["Unberührt", "Untouched"], d: ["Ohne einen Treffer zum Ausgang", "Reach the exit without being hit"], bad: c => (Z.player.dmgTaken || 0) > c.dmg0, arena: true, rw: t => ({ k: "glut", n: t >= 4 ? 3 : 2 }) },
    { id: "zaeh", ico: "♥", art: "halten", grp: "treffer", n: ["Kratzfest", "Scratch-proof"], d: ["Höchstens {n} Treffer bis zum Ausgang", "At most {n} hits until the exit"], need: t => 3, prog: c => st("hitsTaken") - c.s0.hitsTaken, bad: c => st("hitsTaken") - c.s0.hitsTaken > c.need, arena: true, rw: t => ({ k: "gold", n: goldN(60) }) },
    { id: "nurnah", ico: "⚔", art: "halten", grp: "stil", n: ["Nur Nahkampf", "Melee Only"], d: ["Kein Fernkampf und keine Fähigkeiten bis zum Ausgang", "No ranged attacks or skills until the exit"], bad: c => c.usedRanged || c.usedSkill, ok: () => has(d => d.kind === "melee"), arena: true, rw: t => ({ k: "glut", n: 1 }) },
    { id: "nurfern", ico: "➶", art: "halten", grp: "stil", n: ["Nur Fernkampf", "Ranged Only"], d: ["Kein Nahkampftreffer bis zum Ausgang", "No melee hits until the exit"], bad: c => c.usedMelee, ok: () => has(d => d.kind === "ranged"), arena: true, rw: t => ({ k: "glut", n: 1 }) },
    { id: "einhand", ico: "☝", art: "halten", grp: "stil", n: ["Eine Hand", "One Hand"], d: ["Nur mit Hand 1 kämpfen", "Fight only with hand 1"], bad: c => c.usedA2, ok: () => slots().length === 2, rw: t => ({ k: "splitter", n: 14 + 3 * t }) },
    { id: "keinheil", ico: "⚗", art: "halten", n: ["Trocken", "Dry"], d: ["Keinen Heiltrank trinken", "Drink no healing potion"], bad: c => st("potions") > c.s0.potions, arena: true, rw: t => ({ k: "rolle" }) },
    { id: "ohnerolle", ico: "↺", art: "halten", grp: "bewegung", n: ["Standhaft", "Steadfast"], d: ["Ohne eine einzige Rolle zum Ausgang", "Reach the exit without rolling"], bad: c => st("rolls") > c.s0.rolls, rw: t => ({ k: "splitter", n: 14 + 3 * t }) },
    { id: "ohnegabe", ico: "∅", art: "halten", grp: "stil", n: ["Bescheiden", "Humble"], d: ["Keine Fähigkeit einsetzen", "Use no skill"], bad: c => st("skills") > c.s0.skills || c.usedSkill, ok: () => hasSkill(), arena: true, rw: t => ({ k: "rolle" }) },
    { id: "pazifist", ico: "☮", art: "halten", grp: "kills", n: ["Pazifist", "Pacifist"], d: ["Höchstens {n} Kills bis zum Ausgang", "At most {n} kills until the exit"], need: t => 4, prog: c => c.kills, bad: c => c.kills > c.need, rw: t => ({ k: "splitter", n: 20 + 5 * t }) },
    { id: "vital", ico: "✚", art: "halten", n: ["Bei Kräften", "In Fine Fettle"], d: ["Mit mindestens 75 % Leben am Ausgang ankommen", "Arrive at the exit with at least 75% health"], end: c => Z.player.hp >= Z.player.hpMax * 0.75, arena: true, rw: t => ({ k: "heil" }) },
    /* ---------- Zeit ---------- */
    { id: "schnell", ico: "⌛", art: "zeit", w: 1.3, n: ["Schnell durch", "In a Hurry"], d: ["Ausgang in {t} erreichen", "Reach the exit within {t}"], arenaD: ["Den Boss in {t} besiegen", "Defeat the boss within {t}"], limit: (lv, c) => (lv.arena ? 100 : Math.round(45 + pathLen(lv) * 0.6)), arena: true, rw: t => ({ k: "glut", n: 1 }), rw2: t => ({ k: "gold", n: goldN(50) }) }
  ];
  Z.CHALLENGES = CH;
  const fmtCT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  let C = null; /* aktive Herausforderungen dieses Gebiets */
  Z.chState = () => C;
  function ctxNew(lv) {
    const P = Z.player, s = S();
    const s0 = {}; for (const k of ["markCrits", "parries", "dodges", "trapKills", "fallKills", "crits", "dives", "zerbrochen", "gold", "hitsTaken", "potions", "rolls", "skills"]) s0[k] = s[k] || 0;
    const er = Z.erkundung && Z.erkundung(), sec0 = lv.secretsTotal || (er && er.lv === lv ? er.total : 0) || 0, found0 = er && er.lv === lv ? er.found.size : 0;
    const brk0 = Z.propsLive.filter(p => p.kind === "breakable" && p.dead).length;
    return {
      lv, s0, t0: Z.run ? Z.run.time || 0 : 0, dmg0: P ? P.dmgTaken || 0 : 0,
      kills: 0, airKills: 0, burnKills: 0, eliteKills: 0, adrenKills: 0, skillKills: 0, earlyKills: 0, unawareHits: 0, sleepHits: 0, bestChain: 0, bestSweep: 0, chests: 0,
      handKills: { a1: 0, a2: 0 }, usedRanged: false, usedMelee: false, usedSkill: false, usedA2: false,
      elites0: Z.enemies.filter(e => e.elite && !e.dead).length, sleep0: Z.enemies.filter(e => e.sleep && !e.dead).length,
      chests0: Z.pickups.filter(p => (p.kind === "chest" || p.kind === "cursed") && !p.open).length,
      props0: Z.propsLive.filter(p => p.kind === "breakable").length + (Z.ausstattung ? (Z.ausstattung() || []).length : 0),
      secrets0: sec0, secretsNow: () => { const e2 = Z.erkundung && Z.erkundung(); return e2 && e2.lv === lv ? e2.found.size - found0 : 0; },
      propsBroken: () => Z.propsLive.filter(p => p.kind === "breakable" && p.dead).length - brk0
    };
  }
  function pick(lv) {
    const t = tierN(), c = ctxNew(lv), arena = !!lv.arena;
    const pool = CH.filter(h => (!arena || h.arena) && (!h.ok || h.ok(lv, c)));
    let n = arena ? 1 + (R() < 0.5 ? 1 : 0) : 1 + (R() < 0.8 ? 1 : 0) + (t >= 2 && R() < 0.55 ? 1 : 0);
    const list = [], grps = new Set();
    const w = {}; for (const h of pool) w[h.id] = h.w || 1;
    while (list.length < n && Object.keys(w).length) {
      const id = Z.R.weighted(w); delete w[id];
      const h = CH.find(x => x.id === id); if (h.grp && grps.has(h.grp)) continue;
      /* nicht zwei „halten“-Bedingungen, die sich gegenseitig unmöglich machen */
      if (h.grp) grps.add(h.grp);
      const need = h.need ? Math.max(1, h.need(t, c)) : 0;
      const lim = h.limit ? h.limit(lv, c) : 0;
      list.push({ h, need, lim, state: "laeuft", shown: 0 });
    }
    c.list = list; c.need = 0;
    return c;
  }
  const textOf = (x, arena) => { const d = arena && x.h.arenaD ? x.h.arenaD : x.need === 1 && x.h.d1 ? x.h.d1 : x.h.d; return L(d).replace("{n}", x.need).replace("{t}", fmtCT(x.lim)); };
  const rwOf = x => (x.h.rw2 && R() < 0.5 ? x.h.rw2(tierN()) : x.h.rw(tierN()));
  function progOf(x) { if (!C) return 0; C.need = x.need; return x.h.prog ? x.h.prog(C) : 0; }
  /* Start: nach dem Laden (erst im nächsten Schritt – dann haben alle Module Truhen, Gegner, Geheimnisse gesetzt) */
  Z.chStart = function (lv) { C = null; pend = lv; };
  let pend = null;
  Z.chClear = () => { C = null; pend = null; };
  function begin(lv) {
    pend = null; if (!Z.run || !lv || lv.hub || lv.passage) return;
    C = pick(lv);
    for (const x of C.list) x.rw = rwOf(x);
    C.announce = 4.2; /* nach der Kapitel-Titelseite */
  }
  /* Ende: beim Verlassen ins Durchgangs-Gebiet. Liefert Ergebnisse; die Belohnung wird nach dem Laden ausgezahlt. */
  Z.chEnd = function () {
    const c = C; C = null; pend = null; if (!c) return [];
    const out = [];
    for (const x of c.list) {
      if (x.state !== "laeuft") continue;
      c.need = x.need;
      let ok = false;
      if (x.h.art === "halten") ok = !(x.h.bad && x.h.bad(c)) && (!x.h.end || x.h.end(c));
      else if (x.h.art === "zeit") ok = !c.lv.arena && (Z.run.time - c.t0) <= x.lim;
      if (ok) { x.state = "ok"; out.push(x); } else x.state = "weg";
    }
    return out;
  };
  /* Auszahlung */
  function pay(x, atPlayer) {
    const P = Z.player, r = x.rw, t = tierN(); if (!P) return;
    S().challenges = (S().challenges || 0) + 1; Z.meta.challenges = (Z.meta.challenges || 0) + 1;
    const px = P.x + P.w / 2 + P.face * 14, py = P.y + P.h;
    switch (r.k) {
      case "glut": if (atPlayer && Z.spawnReward) Z.spawnReward("glut", px, py, { n: r.n }); else { P.glut = (P.glut || 0) + r.n; S().glut = (S().glut || 0) + r.n; } break;
      case "gold": if (atPlayer) Z.dropGold(px, py - 8, r.n); else { P.gold += r.n; S().gold = (S().gold || 0) + r.n; } break;
      case "splitter": if (atPlayer) Z.dropShards(px, py - 8, r.n); else { Z.meta.shards += r.n; if (Z.run) Z.run.shardsBank += r.n; } break;
      default: if (Z.spawnReward) { const lv = Z.level, sx = atPlayer ? px : (lv.start.x + 3) * Z.TILE + 8, sy = atPlayer ? py : (lv.start.y + 1) * Z.TILE; Z.spawnReward(r.k, sx, sy, { drop: atPlayer }); }
    }
    celebrate(x);
  }
  /* ---------- Anzeige ---------- */
  const css = document.createElement("style");
  css.textContent = [
    "#hfliste{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%) translateY(-14px);z-index:13;pointer-events:none;opacity:0;transition:opacity .45s,transform .45s;min-width:min(440px,90vw);max-width:94vw;background:linear-gradient(rgba(26,16,18,.95),rgba(16,10,12,.95));border:1px solid #e5b454;border-radius:12px;padding:10px 16px 8px;box-shadow:0 10px 40px rgba(0,0,0,.6),0 0 24px rgba(229,180,84,.15);zoom:var(--hud,1)}",
    "#hfliste.an{opacity:1;transform:translateX(-50%) translateY(0)}#hfliste h4{margin:0 0 6px;font-family:var(--fd);font-weight:400;color:#e5b454;font-size:19px;text-align:center;letter-spacing:.03em}",
    "#hfliste .hz{display:grid;grid-template-columns:28px 1fr auto;gap:2px 10px;align-items:center;padding:4px 0;border-top:1px solid rgba(229,180,84,.15)}#hfliste .hi{font-size:18px;text-align:center;color:#ffd27a}#hfliste b{font-size:14px;color:#f0e6d4}#hfliste small{display:block;color:#c8b8a4;font-size:12px}#hfliste .hw{color:#ffb060;font-weight:800;font-size:12px;white-space:nowrap}",
    "#hfliste .fuss{text-align:center;color:#a99a8b;font-size:11px;margin-top:5px}#hfliste kbd,.hfp kbd{font-family:var(--fb);background:#3a2a2e;border:1px solid #5a4448;border-radius:4px;padding:0 5px;color:#e5b454;font-weight:800}",
    "#hfsieg{position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) scale(.7);z-index:14;pointer-events:none;opacity:0;text-align:center;zoom:var(--hud,1)}",
    "#hfsieg.an{animation:hfsieg 2.8s ease-out forwards}@keyframes hfsieg{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}20%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1)}}",
    "#hfsieg .k{font-size:12px;font-weight:800;letter-spacing:.2em;color:#ffd27a;text-transform:uppercase;text-shadow:0 2px 6px #000}#hfsieg .t{font-family:var(--fd);font-size:clamp(26px,4vw,44px);color:#ffe2a0;text-shadow:0 3px 14px #000,0 0 26px rgba(255,170,60,.55)}#hfsieg .r{font-weight:800;color:#ffb060;text-shadow:0 2px 6px #000;font-size:15px}",
    "#hfsieg .strahl{position:absolute;left:50%;top:50%;width:420px;height:420px;margin:-210px 0 0 -210px;background:radial-gradient(circle,rgba(255,200,110,.35),rgba(255,140,40,0) 60%);z-index:-1}",
    "#aufgabe .hf{border-color:#6a4a2a}#aufgabe .hf.ok{border-color:#7fd36a;color:#b8f0a0}#aufgabe .hf.weg{opacity:.4;text-decoration:line-through}#aufgabe .hf.knapp{border-color:#e0545a;color:#ffb0a0}",
    ".hfp{margin:6px 0 2px;text-align:left}.hfp div{display:flex;gap:8px;padding:3px 0;font-size:13px}.hfp .ok{color:#b8f0a0}.hfp .weg{opacity:.5;text-decoration:line-through}.hfp i{font-style:normal;color:#ffd27a;width:20px;text-align:center}.hfp span{flex:1}.hfp em{font-style:normal;color:#ffb060;font-weight:800}"
  ].join("\n");
  document.head.appendChild(css);
  const liste = document.createElement("div"); liste.id = "hfliste"; document.body.appendChild(liste);
  const sieg = document.createElement("div"); sieg.id = "hfsieg"; document.body.appendChild(sieg);
  let listeT = 0;
  function showList() {
    if (!C || !C.list.length) return;
    const arena = !!C.lv.arena, inp = Z.input;
    const k = inp.device === "touch" ? "II" : inp.label("pause");
    liste.innerHTML = "<h4>✦ " + L([C.list.length > 1 ? "Herausforderungen" : "Herausforderung", C.list.length > 1 ? "Challenges" : "Challenge"]) + "</h4>" +
      C.list.map(x => '<div class="hz"><span class="hi">' + x.h.ico + "</span><span><b>" + esc(L(x.h.n)) + "</b><small>" + esc(textOf(x, arena)) + '</small></span><span class="hw">' + esc(rwTxt(x.rw)) + "</span></div>").join("") +
      '<div class="fuss">' + L(["Fortschritt links oben · Liste jederzeit im Pausenmenü ", "Progress top left · list any time in the pause menu "]) + (k ? "<kbd>" + esc(k) + "</kbd>" : "") + "</div>";
    liste.classList.add("an"); listeT = 6.5;
    Z.audio.play("bell", { vol: 0.3, rate: 1.2 });
  }
  function celebrate(x) {
    sieg.innerHTML = '<div class="strahl"></div><div class="k">✦ ' + L(["Herausforderung geschafft", "Challenge complete"]) + ' ✦</div><div class="t">' + x.h.ico + " " + esc(L(x.h.n)) + '</div><div class="r">' + esc(rwTxt(x.rw)) + "</div>";
    sieg.classList.remove("an"); void sieg.offsetWidth; sieg.classList.add("an");
    Z.audio.play("holy", { vol: 0.55 }); Z.audio.play("coin", { vol: 0.4, rate: 0.8, delay: 0.15 });
    const P = Z.player; if (P && Z.fx) { Z.fx.burst(P.x + P.w / 2, P.y + 6, 30, { col: ["#ffd27a", "#ffb060", "#fff2c0"], sp: 130, up: 60, life: 0.9, size: 2.2, kind: "glow", add: true }); Z.fx.ring(P.x + P.w / 2, P.y + 14, 30, "#ffd27a", 0.4, 2); }
    Z.input.rumble && Z.input.rumble(0.3, 140);
  }
  function fail(x) {
    if (x.state !== "laeuft") return; x.state = "weg";
    Z.toast && Z.toast("✧ <b>" + L(["Verfehlt: ", "Missed: "]) + esc(L(x.h.n)) + "</b><br><small>" + L(["Die anderen Herausforderungen laufen weiter.", "The other challenges are still on."]) + "</small>", 2200);
    Z.audio.play("ui", { vol: 0.25, rate: 0.6 });
  }
  /* je Schritt: Fortschritt prüfen */
  Z.chTick = function (dt) {
    if (pend && Z.level === pend && Z.player && !Z.paused) begin(pend);
    if (!C || !Z.run || !Z.player || Z.player.dead) return;
    if (C.announce > 0) { C.announce -= dt; if (C.announce <= 0) showList(); }
    const now = Z.run.time - C.t0;
    for (const x of C.list) {
      if (x.state !== "laeuft") continue;
      C.need = x.need;
      if (x.h.art === "zaehl") {
        if (x.h.frist && now > x.h.frist && progOf(x) < x.need) { fail(x); continue; }
        if (progOf(x) >= x.need) { x.state = "ok"; pay(x, true); }
      } else if (x.h.art === "halten") { if (x.h.bad && x.h.bad(C)) fail(x); }
      else if (x.h.art === "zeit") {
        if (C.lv.arena && Z.bossDefeated) { if (now <= x.lim) { x.state = "ok"; pay(x, true); } else fail(x); }
        else if (now > x.lim) fail(x);
      }
    }
    const kc = Z.killChain && Z.killChain(); if (kc && kc.n > C.bestChain && Z.run.time - kc.last < 3) C.bestChain = kc.n;
  };
  Z.chFrame = function (dt) { if (listeT > 0) { listeT -= dt; if (listeT <= 0 || (Z.ui && Z.ui.modalOpen && listeT < 5.5)) { liste.classList.remove("an"); listeT = 0; } } };
  /* HUD-Chips (von schmiede.js eingesetzt) */
  Z.chHUD = function () {
    if (!C || !Z.run) return { html: "", key: "" };
    let html = "", key = "";
    const now = Z.run.time - C.t0, arena = !!C.lv.arena;
    for (const x of C.list) {
      C.need = x.need;
      let p = "";
      if (x.h.art === "zaehl") p = Math.min(progOf(x), x.need) + "/" + x.need;
      else if (x.h.art === "zeit") p = fmtCT(x.lim - now);
      else if (x.h.prog) p = progOf(x) + "/" + x.need;
      else p = x.state === "laeuft" ? "✓?" : "";
      if (x.h.art === "halten" && !x.h.prog) p = x.state === "laeuft" ? L(["hält", "holding"]) : "";
      const knapp = x.state === "laeuft" && x.h.art === "zeit" && x.lim - now < 15;
      html += '<span class="hf ' + (x.state === "ok" ? "ok" : x.state === "weg" ? "weg" : knapp ? "knapp" : "") + '" title="' + esc(textOf(x, arena) + " → " + rwTxt(x.rw)) + '">' + x.h.ico + " " + esc(L(x.h.n)) + (p && x.state !== "ok" ? " " + p : x.state === "ok" ? " ✓" : "") + "</span>";
      key += x.state + p + "|";
    }
    return { html, key };
  };
  /* Pausenmenü: Liste mit Fortschritt */
  function pauseHTML() {
    if (!C || !C.list.length) return "";
    const arena = !!C.lv.arena;
    return '<div class="hfp"><h3>✦ ' + L(["Herausforderungen hier", "Challenges here"]) + "</h3>" + C.list.map(x => { C.need = x.need; const pr = x.h.art === "zaehl" ? " (" + Math.min(progOf(x), x.need) + "/" + x.need + ")" : ""; return '<div class="' + (x.state === "ok" ? "ok" : x.state === "weg" ? "weg" : "") + '"><i>' + x.h.ico + "</i><span><b>" + esc(L(x.h.n)) + "</b> – " + esc(textOf(x, arena)) + pr + "</span><em>" + esc(rwTxt(x.rw)) + "</em></div>"; }).join("") + "</div>";
  }
  (function late() {
    if (!Z.ui || !Z.ui.pause || !Z.ui.actions || !Z.ui.actions.abAchP) return setTimeout(late, 60);
    const pause0 = Z.ui.pause;
    Z.ui.pause = function () { const r = pause0.apply(this, arguments); const h = pauseHTML(); const tip = document.querySelector("#modal .pausenmenue .tipp"); if (h && tip) tip.insertAdjacentHTML("afterend", h); return r; };
  })();
  /* Auszahlung nach dem Gebietswechsel (Durchgang) */
  Z.chPayLater = function (list) { for (const x of list) pay(x, false); };
  /* ---------- Ereignisse sammeln ---------- */
  const hitC = Z.hitEnemy;
  Z.hitEnemy = function (e, dmg, o) {
    o = o || {}; const P = Z.player;
    if (C && P && e && !e.dead && !o.dot) {
      const it = o.it, d = it && Z.itemDef(it);
      if (o.src === "melee") C.usedMelee = true;
      if (o.src === "skill") C.usedSkill = true;
      if (o.src === "ranged" && d && d.kind === "ranged") C.usedRanged = true;
      if (it && it === P.slots.a2) C.usedA2 = true;
      if ((o.src === "melee" || o.src === "ranged") && !e.aware && !e.dummy) C.unawareHits++;
      if (e.sleep) C.sleepHits++;
      if (o.src === "melee" && P.act) { const a = P.act; a._hf = a._hf || new Set(); a._hf.add(e); if (a._hf.size > C.bestSweep) C.bestSweep = a._hf.size; }
    }
    return hitC.apply(this, arguments);
  };
  const killC = Z.killEnemy;
  Z.killEnemy = function (e, o) {
    const was = e && !e.dead, burning = e && e.st && e.st.burn > 0;
    const r = killC.apply(this, arguments);
    if (C && was && e.dead && !e.dummy && !(e.def && e.def.boss)) {
      o = o || {}; const P = Z.player;
      C.kills++;
      if ((Z.run.time - C.t0) <= 30) C.earlyKills++;
      if (P && !P.onGround && !P.climbing) C.airKills++;
      if (burning) C.burnKills++;
      if (e.elite) C.eliteKills++;
      if (P && P.st && P.st.adrenalin > 0) C.adrenKills++;
      if (o.src === "skill") C.skillKills++;
      if (P && o.it) { if (o.it === P.slots.a1) C.handKills.a1++; else if (o.it === P.slots.a2) C.handKills.a2++; }
    }
    return r;
  };
  Z.chChest = () => { if (C) C.chests++; };
})();
