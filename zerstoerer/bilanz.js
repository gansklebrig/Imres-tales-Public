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
    const was = e && !e.deadCounted; if (e) e.deadCounted = true;
    const r = kill0.apply(this, arguments);
    if (was && e && !e.dummy) {
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
})();
