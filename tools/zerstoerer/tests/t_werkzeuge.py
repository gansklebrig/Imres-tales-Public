"""Werkzeuge und Schilde in einer Testkammer: jedes Werkzeug lässt sich einsetzen, Schaden-Werkzeuge treffen,
Schilde stoßen (Tippen) und blocken (Halten)."""
from playwright.sync_api import sync_playwright
from gemeinsam import Pruefung, zum_lager, browser_starten

NEU = ["frostgranate", "brandtopf", "klebebombe", "splittergranate", "magnetbombe", "donnerkeil", "saeurephiole", "streubombe",
       "blendgranate", "schwerkraftstein", "weihwasser", "kraehenfuesse", "pulverfass", "feuerturm", "bolzenwerfer", "sprungpilz",
       "schutzrune", "sturmphiole", "enterhaken", "blinkstein", "kettenhaken", "spiegelbild", "bumerang", "messerfaecher"]
OHNE_SCHADEN = {"blendgranate", "pulverfass", "sprungpilz", "schutzrune", "spiegelbild"}   # wirken anders (Blenden, Falle, Sprung, Schutz, Ablenkung)
SCHILDE = ["fassdeckel", "spiegelschild", "frostschild", "glockenschild", "funkenschild", "blutschild", "wurfschild", "lavaschild", "panzerschild", "turmschild"]
WURF = {"wurfschild"}   # Wurfschild wird geworfen statt gehalten

T = Pruefung("werkzeuge")
with sync_playwright() as p:
    b = browser_starten(p)
    pg = T.seite(b, "w", 1100, 620)
    zum_lager(pg)
    pg.evaluate('''() => { __z.area('keller'); __z.god(true); Z.paused = true;
      const rows = ["##############################"].concat(Array.from({length: 12}, () => "#............................#")).concat(["##############################"]);
      const lv = Z.fromRows(rows, {biome: 'keller'}); lv.start = {x: 3, y: 12}; lv.doors = []; lv.id = 'test';
      Z.world.lv = lv; Z.level = lv; Z.gfx.setLevel(lv, Z.biome);
      window.arena = () => { Z.enemies.length = 0; Z.gadgets.length = 0; Z.hazards.length = 0; Z.projs.length = 0; Z.allies.length = 0;
        const P = Z.player; P.x = 5 * 16; P.y = 13 * 16 - P.h; P.face = 1; P.vx = P.vy = 0;
        for (let i = 0; i < 4; i++) Z.spawnEnemy('robe', 5 * 16 + 50 + i * 18, 13 * 16 - 22, {});
        for (const e of Z.enemies) { e.hp = e.hpMax = 500; e.def = Object.assign({}, e.def, {spd: 0}); e.aware = false; } };
    }''')
    werk = pg.evaluate("""(list) => { const P = Z.player, inp = Z.input, out = {};
      const run = (n, keys) => { for (let i = 0; i < n; i++) { (keys || []).forEach(k => inp.setTouch(k, true)); __z.step(1); inp.endFrame(); } (keys || []).forEach(k => inp.setTouch(k, false)); };
      for (const id of list) { arena(); P.slots.s1 = null; P.slots.s2 = null; __z.give(id); P.cd.s1 = 0;
        const hp0 = Z.enemies.reduce((a, e) => a + (e.dead ? 0 : e.hp), 0);
        const da = !!P.slots.s1;
        run(2, ['s1']); run(240);
        const hp1 = Z.enemies.reduce((a, e) => a + (e.dead ? 0 : e.hp), 0);
        out[id] = {da: da, dmg: Math.round(hp0 - hp1), cd: +P.cd.s1.toFixed(1), g: Z.gadgets.length}; }
      return out; }""", NEU)
    for k, v in werk.items():
        ok = v["da"] and v["cd"] > 0 and (k in OHNE_SCHADEN or v["dmg"] > 0)
        T.check("Werkzeug %s" % k, ok, v)
    schild = pg.evaluate("""(list) => { const P = Z.player, inp = Z.input, out = {};
      const run = (n, keys) => { for (let i = 0; i < n; i++) { (keys || []).forEach(k => inp.setTouch(k, true)); __z.step(1); inp.endFrame(); } (keys || []).forEach(k => inp.setTouch(k, false)); };
      for (const id of list) { arena(); Z.enemies[0].x = P.x + 24; P.slots.a1 = null; P.slots.a2 = null; __z.give(id);
        const hp0 = Z.enemies.reduce((a, e) => a + (e.dead ? 0 : e.hp), 0);
        run(3, ['a1']); run(60);
        const bash = hp0 - Z.enemies.reduce((a, e) => a + (e.dead ? 0 : e.hp), 0);
        run(40, ['a1']); const hold = P.act && P.act.type; run(30);
        out[id] = {bash: Math.round(bash), hold: hold}; }
      return out; }""", SCHILDE)
    for k, v in schild.items():
        T.check("Schild %s" % k, v["bash"] > 0 and (k in WURF or v["hold"] == "shield"), v)
    T.keine_seitenfehler()
    b.close()
T.ende()
