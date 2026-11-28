"""Gesamtprobe: Titel → Lager → Lauf, mehrere Gebiete laden, laufen, zeichnen; Pausenmenü. Keine Seitenfehler."""
import sys
from playwright.sync_api import sync_playwright
from gemeinsam import Pruefung, zum_lager, lauf_starten, browser_starten

GEBIETE = sys.argv[1:] or ["torhof", "keller", "hallen", "wehrgang", "glocken", "labor"]
T = Pruefung("gesamt")
with sync_playwright() as p:
    b = browser_starten(p)
    pg = T.seite(b, "g")
    zum_lager(pg)
    T.check("Lager geladen", pg.evaluate("Z.level && Z.level.id") == "lager", pg.evaluate("Z.level && Z.level.id"))
    lauf_starten(pg)
    T.check("Lauf gestartet", pg.evaluate("!!Z.run && Z.level.id !== 'lager'"), pg.evaluate("Z.level.id"))
    pg.evaluate("Z.setGfx && Z.setGfx('preset','2')")
    for a in GEBIETE:
        if a != pg.evaluate("Z.level.id"):
            pg.evaluate("a => Z.loadArea(a)", a); pg.wait_for_timeout(900)
        pg.evaluate("Z.ui.close(); var bn = document.getElementById('banner'); if (bn) bn.style.display = 'none'; Z.player.iframe = 1e9; Z.player.hp = 1e9; Z.enemies.length = 0")
        ok = pg.evaluate("""() => { const lv = Z.level, T = Z.TILE, sp = [];
            for (let y = 2; y < lv.H - 2; y++) for (let x = 2; x < lv.W - 2; x++) if (Z.standable(lv, x, y, 2)) sp.push([x, y]);
            if (!sp.length) return false; const s = sp[(sp.length * 0.37) | 0], P = Z.player;
            P.x = s[0] * T; P.y = (s[1] + 1) * T - P.h; P.vy = 0; Z.cam.snap(P.x, P.y); return true; }""")
        pg.keyboard.press("Space"); pg.wait_for_timeout(300); pg.keyboard.press("Space"); pg.wait_for_timeout(1200)
        st = pg.evaluate("[Z.level.id, !!Z.player, isFinite(Z.player.x) && isFinite(Z.player.y)]")
        T.check("Gebiet %s geladen und gespielt" % a, ok and st[0] == a and st[1] and st[2], st)
    knoepfe = pg.evaluate("(Z.ui.pause(), [...document.querySelectorAll('#modal button')].map(b => b.textContent).join(' | '))")
    T.check("Pausenmenü mit Knöpfen", "toTitle" in pg.evaluate("[...document.querySelectorAll('#modal [data-act]')].map(b => b.dataset.act).join(' ')") and len(knoepfe) > 40, knoepfe[:120])
    # Bild wirklich gezeichnet (Canvas nicht einfarbig)
    bunt = pg.evaluate("""() => { const c = document.querySelector('canvas'); if (!c) return 0; const g = document.createElement('canvas'); g.width = 64; g.height = 36;
        const x = g.getContext('2d'); x.drawImage(c, 0, 0, 64, 36); const d = x.getImageData(0, 0, 64, 36).data, s = new Set();
        for (let i = 0; i < d.length; i += 16) s.add(d[i] >> 4 << 8 | d[i + 1] >> 4 << 4 | d[i + 2] >> 4); return s.size; }""")
    T.check("Spielbild gezeichnet (viele Farben)", bunt > 20, bunt)
    T.keine_seitenfehler()
    b.close()
T.ende()
