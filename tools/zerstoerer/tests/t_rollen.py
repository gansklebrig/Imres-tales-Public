"""Rollenwahl (Brutalität/Taktik/Überleben) mit Ausrüstungsleiste in drei Fenstergrößen."""
from playwright.sync_api import sync_playwright
from gemeinsam import Pruefung, zum_lager, browser_starten

T = Pruefung("rollen")
with sync_playwright() as p:
    b = browser_starten(p)
    for vw, vh, tag in [(1280, 720, "pc"), (412, 860, "hoch"), (640, 360, "klein")]:
        T.fehler = []
        pg = T.seite(b, tag, vw, vh)
        zum_lager(pg)
        pg.evaluate("Z.startRun()"); pg.wait_for_timeout(2500); pg.evaluate("Z.ui.modalOpen && Z.ui.close()")
        pg.evaluate("() => { const P = Z.player; P.slots.a1 = Z.makeItem('kurzschwert', 0, 1); P.slots.a2 = Z.makeItem('jagdbogen', 0, 2); P.slots.s1 = Z.makeItem('baerenfalle', 0, 0); P.slots.s2 = null; Z.ui.scrollChoice(); }")
        pg.wait_for_timeout(500)
        n = pg.evaluate("document.querySelectorAll('#modal .ausr-k').length"); T.check(tag + ": 4 Kacheln", n == 4, n)
        T.check(tag + ": Symbole gezeichnet", pg.evaluate("document.querySelectorAll('#modal .ausr-k .ico canvas').length") == 3)
        T.check(tag + ": Farbklassen", pg.evaluate("['s-brut','s-takt','s-ueber'].every(c => document.querySelector('#modal .ausr-k.' + c))"))
        T.check(tag + ": Hervorhebung erste Rolle", pg.evaluate("document.querySelector('#modal .rollenwahl').classList.contains('hl-brut')"))
        pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(200)
        pg.evaluate("document.querySelectorAll('#modal .rollen button')[1].focus()"); pg.wait_for_timeout(250)
        T.check(tag + ": Fokus Taktik hebt Taktik hervor", pg.evaluate("document.querySelector('#modal .rollenwahl').classList.contains('hl-takt') && !document.querySelector('#modal .rollenwahl').classList.contains('hl-brut')"))
        ov = pg.evaluate("() => { const m = document.querySelector('#modal .mbox').getBoundingClientRect(); return m.bottom <= innerHeight + 1 || getComputedStyle(document.querySelector('#modal .mbox')).overflowY != 'visible'; }")
        T.check(tag + ": passt oder lässt sich rollen", ov)
        pg.evaluate("document.querySelectorAll('#modal .rollen button')[2].click()"); pg.wait_for_timeout(300)
        T.check(tag + ": Wahl schließt, Wert steigt", pg.evaluate("!Z.ui.modalOpen && Z.player.stats.ueber >= 1"))
        T.keine_seitenfehler(tag + ": keine Seitenfehler")
        pg.context.close(); T.seiten = []
    b.close()
T.ende()
