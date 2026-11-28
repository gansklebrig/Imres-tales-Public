"""Ablauf eines ganzen Laufs mit dem Test-Bot: Gebiet für Gebiet bis zum Ende (Bosse werden abgekürzt), Beute, Durchgänge
mit Stationen, dann Tod → zurück ins Lager mit Seelensplittern. Keine Seitenfehler."""
import json
from playwright.sync_api import sync_playwright
from gemeinsam import Pruefung, zum_lager, browser_starten, bot_js

T = Pruefung("ablauf")
with sync_playwright() as p:
    b = browser_starten(p)
    pg = T.seite(b, "a")
    zum_lager(pg)
    pg.evaluate(bot_js())
    pg.evaluate("Z.meta.tut = true; __z.start()"); pg.wait_for_timeout(900)
    weg, ende = [], False
    for hop in range(16):  # Zufallsweg; Durchgänge zählen mit
        info = pg.evaluate("() => ({area: Z.level.id, doors: Z.level.doors.filter(d => d.kind === 'exit').map(d => d.to), boss: !!Z.boss})")
        weg.append(info["area"])
        r = pg.evaluate("n => botRun(n, true)", 1500)
        pg.evaluate("""() => { if (Z.level.warden && !Z.level.wardenSpawned) { const d = Z.level.doors.find(x => x.kind === 'exit'); __z.tele(d.x * 16, d.y * 16 - 14); __z.step(5); Z.input.endFrame(); }
                       for (let i = 0; i < 40 && Z.boss && !Z.bossDefeated; i++) { Z.boss.hp = 0; __z.step(2); Z.input.endFrame(); } }""")
        pg.wait_for_timeout(5000 if info["boss"] or info["area"] in ("labor", "erzpriesterin", "wachturm") else 200)
        pg.evaluate("""() => { for (const p of Z.pickups.slice(0, 3)) { if (p.kind === 'item') { Z.ui.offerItem(p); if (Z.ui.choiceActive) document.querySelector('#choice [data-slot]').click(); } } }""")
        pg.evaluate("""() => { const ds = Z.level.doors.filter(d => d.kind === 'exit'); if (!ds.length) return false; const d = ds[Math.floor(Math.random() * ds.length)];
                       Z.run.doorsOpen = true; __z.tele(d.x * 16 + 2, (d.y + 1) * 16 - 28); Z.player.vy = 0; Z.input.setTouch('use', true); __z.step(1); Z.input.endFrame(); Z.input.setTouch('use', false); return d.to; }""")
        pg.wait_for_timeout(900)
        if pg.evaluate("Z.level.passage"):
            pg.evaluate("""() => { Z.ui.station('K'); Z.ui.station('S'); const b = document.querySelector('#modal [data-act=bless]'); if (b) b.click(); Z.player.gold = 5000;
                           Z.ui.station('M'); const bb = document.querySelector('#modal [data-act=buy]'); if (bb) bb.click(); Z.ui.close(); }""")
            pg.evaluate("""() => { const d = Z.level.doors.find(d => d.kind === 'exit'); __z.tele(d.x * 16 + 2, (d.y + 1) * 16 - 28); Z.input.setTouch('use', true); __z.step(1); Z.input.endFrame(); Z.input.setTouch('use', false); }""")
            pg.wait_for_timeout(900)
        print("  ", hop, info["area"], "->", pg.evaluate("Z.level.id"), json.dumps(r), flush=True)
        if pg.evaluate("!!document.querySelector('#modal:not([hidden]) .erz')"):
            ende = True; break
    T.check("Mehrere Gebiete durchlaufen", len(set(weg)) >= 4, " → ".join(weg))
    T.check("Ende des Laufs erreicht", ende)
    pg.evaluate("() => { __z.god(false); Z.player.iframe = 0; Z.hurtPlayer(99999, {force: true}); }")
    pg.wait_for_timeout(2500)
    T.check("Tod zeigt Abschlussfenster", pg.evaluate("!!document.querySelector('#modal [data-act=toCamp]')"))
    pg.evaluate("() => { const b = document.querySelector('#modal [data-act=toCamp]'); if (b) b.click(); }"); pg.wait_for_timeout(1200)
    pg.evaluate("() => { const b = document.querySelector('#modal .rb21box [data-act=close]'); if (b) b.click(); }"); pg.wait_for_timeout(2500)
    T.check("Zurück im Lager mit Seelensplittern", pg.evaluate("Z.level.id") == "lager" and pg.evaluate("Z.meta.shards") > 0, (pg.evaluate("Z.level.id"), pg.evaluate("Z.meta.shards")))
    T.keine_seitenfehler()
    b.close()
T.ende()
