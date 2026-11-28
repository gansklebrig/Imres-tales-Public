"""Z.haken (haken.js): Außenschichten bleiben außen und wirken je Aufruf genau einmal – auch wenn ein Modul später neu
einhüllt. Prüft die Schnittstelle selbst, den Schattenblock (begegnung38.js) und die Lager-Schichten (lager.js)."""
from playwright.sync_api import sync_playwright
from gemeinsam import Pruefung, zum_lager, lauf_starten, browser_starten

T = Pruefung("haken")
with sync_playwright() as p:
    b = browser_starten(p)
    pg = T.seite(b, "h")
    zum_lager(pg)
    pg.wait_for_timeout(300)
    l = pg.evaluate("Z.haken.liste()")
    namen = {x["name"]: x for x in l}
    T.check("Schattenblock als Außenschicht von hitEnemy", "w38schatten" in namen.get("hitEnemy", {}).get("schichten", []), l)
    lager = [n for n in ("newRun", "updatePlayer", "hurtPlayer", "onPlayerDeath", "hitEnemy", "spawnAlly", "onBossDown", "setupRack") if "lager" in namen.get(n, {}).get("schichten", [])]
    T.check("Lager-Schichten angemeldet (8)", len(lager) == 8, lager)
    T.check("alle Außenschichten sitzen außen", all(x["aussen"] for x in l), [x["name"] for x in l if not x["aussen"]])
    r = pg.evaluate("""() => { const out = {}; let n = 0;
      Z.__probe = function (x) { return x * 2; };
      Z.haken.aussen('__probe', 'a', function (a, weiter) { n++; a[0] += 1; return weiter(a); });
      out.eins = Z.__probe(1);                     // (1+1)*2 = 4
      const alt = Z.__probe; Z.__probe = function (x) { return alt.apply(this, arguments) + 100; };   // spätes Einhüllen
      Z.haken.pruefen(); n = 0;
      out.zwei = Z.__probe(1); out.n2 = n;         // Schicht außen, genau einmal: ((1+1)*2)+100 = 104
      Z.haken.aussen('__probe', 'a', function (a, weiter) { n++; a[0] += 2; return weiter(a); });   // gleiche id ersetzt
      n = 0; out.drei = Z.__probe(1); out.n3 = n;  // ((1+2)*2)+100 = 106
      Z.haken.nach('__probe', 'b', function (e, a) { if (out.nach === undefined) out.nach = e; });
      out.vier = Z.__probe(1);
      const innen = Z.__probe; Z.__probe = function (x) { return x > 5 ? innen(x) : innen.call(this, x) + Z.__probe(9); };  // verschachtelt: eigener Aufruf
      Z.haken.pruefen(); n = 0; out.fuenf = Z.__probe(1); out.n5 = n;
      out.liste = Z.haken.liste().find(x => x.name === '__probe');
      return out; }""")
    T.check("Schicht wirkt", r["eins"] == 4, r["eins"])
    T.check("nach spätem Einhüllen außen und genau einmal", r["zwei"] == 104 and r["n2"] == 1, (r["zwei"], r["n2"]))
    T.check("gleiche id ersetzt die Schicht", r["drei"] == 106 and r["n3"] == 1, (r["drei"], r["n3"]))
    T.check("nach() sieht das Ergebnis", r["nach"] == r["vier"] == 106, (r["nach"], r["vier"]))
    T.check("verschachtelter Aufruf durchläuft die Schichten erneut", r["fuenf"] == 106 + (11 * 2 + 100) and r["n5"] == 2, (r["fuenf"], r["n5"]))
    lauf_starten(pg)
    s = pg.evaluate("""() => { __z.god(true); Z.paused = true; const P = Z.player; Z.enemies.length = 0;
      const sh = Object.keys(Z.WEAPONS).find(k => Z.WEAPONS[k].kind === 'shield');
      const mk = s => { const e = Z.spawnEnemy('robe', P.x + 40, P.y, {}); e.hp = e.hpMax = 100000; e.face = -1; e.act = null; if (s) { e.w38schatten = true; e.w38w = sh; } return e; };
      const hit = e => { const h0 = e.hp; Z.hitEnemy(e, 100, {dir: 1}); return Math.round((h0 - e.hp) * 1000) / 1000; };
      const n = mk(false), s = mk(true), o = {};
      o.normal = hit(n); o.schatten = hit(s);
      const x = Z.hitEnemy; Z.hitEnemy = function () { return x.apply(this, arguments); };
      __z.step(2); Z.input.endFrame();
      o.normal2 = hit(n); o.schatten2 = hit(s);
      const y = Z.hitEnemy; let inner = null;
      Z.hitEnemy = function (e) { const r = y.apply(this, arguments); if (e === s && inner === null) { inner = 0; const h0 = s.hp; Z.hitEnemy(s, 100, {dir: 1}); inner = Math.round((h0 - s.hp) * 1000) / 1000; } return r; };
      __z.step(2); Z.input.endFrame();
      o.schatten3 = hit(s); o.innen = inner; return o; }""")
    T.check("Schattenschild blockt von vorn (×0,6)", abs(s["schatten"] - s["normal"] * 0.6) < 0.01, s)
    T.check("nach spätem Einhüllen weiter genau ×0,6 (kein Doppelabzug)", abs(s["schatten2"] - s["normal2"] * 0.6) < 0.01, (s["normal2"], s["schatten2"]))
    T.check("Treffer innerhalb der Kette auf denselben Schatten wird nicht erneut geblockt", s["innen"] == s["normal"] and abs(s["schatten3"] - s["normal"] * 1.6) < 0.01, (s["innen"], s["schatten3"]))
    T.keine_seitenfehler()
    b.close()
T.ende()
