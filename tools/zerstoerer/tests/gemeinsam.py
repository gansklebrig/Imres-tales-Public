"""Gemeinsame Helfer für die Browser-Tests von „Ezekiel – The Destroyer“ (Playwright, Chromium).

Umgebungsvariablen (alle optional):
  ZS_PORT       Port des statischen Servers mit dem Repo-Inhalt (Standard 9230)
  ZS_URL        volle Adresse des Spiels (Standard http://127.0.0.1:<ZS_PORT>/zerstoerer.html)
  ZS_PEER_PORT  Port des lokalen PeerJS-Vermittlers für die Online-Tests (Standard 9431)
  ZS_BILDER     Ordner für Bildschirmfotos bei Fehlern (Standard testbilder im aktuellen Ordner)
Jeder Test endet mit Ausgang 0 (alles grün) oder 1 (mindestens eine Prüfung rot) und schreibt „ERGEBNIS a / b“.
"""
import os
import sys
import time

sys.dont_write_bytecode = True

HIER = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("ZS_PORT", "9230"))
URL = os.environ.get("ZS_URL", "http://127.0.0.1:%d/zerstoerer.html" % PORT)
PEER_PORT = int(os.environ.get("ZS_PEER_PORT", "9431"))
BILDER = os.path.abspath(os.environ.get("ZS_BILDER", "testbilder"))

# Fehler mit Ort und Stapel als Konsolenzeile (pageerror allein verliert bei manchen Fehlern den Stapel)
FEHLER_INIT = ("window.addEventListener('error', function (ev) { try { console.log('ZSFEHLER ' + (ev.message || '') + ' @ ' + "
               "(ev.filename || '') + ':' + ev.lineno + ':' + ev.colno); } catch (_) {} });"
               "window.addEventListener('unhandledrejection', function (ev) { try { console.log('ZSFEHLER (Promise) ' + "
               "(ev.reason && (ev.reason.stack || ev.reason))); } catch (_) {} });")


class Pruefung:
    """Sammelt Prüfungen; bei der ersten roten Prüfung wird (wenn möglich) ein Bildschirmfoto gemacht."""

    def __init__(self, name):
        self.name = name
        self.ergebnisse = []
        self.seiten = []      # (kürzel, Seite) für Fotos bei Fehlern
        self.fehler = []      # Seitenfehler aller Seiten
        self.t0 = time.time()

    def check(self, was, ok, info=""):
        ok = bool(ok)
        self.ergebnisse.append((was, ok))
        print(("OK      " if ok else "FEHLER  ") + was, info if info != "" else "", flush=True)
        if not ok:
            self.foto(was)
        return ok

    def foto(self, was="fehler"):
        try:
            os.makedirs(BILDER, exist_ok=True)
            n = len(self.ergebnisse)
            for kurz, pg in self.seiten:
                pg.screenshot(path=os.path.join(BILDER, "%s_%02d_%s.png" % (self.name, n, kurz)))
        except Exception as e:  # Foto ist Beiwerk
            print("  (kein Foto: %s)" % str(e)[:120])

    def seite(self, browser, kurz="s", breite=1280, hoehe=720, init=None, **ctx):
        c = browser.new_context(viewport={"width": breite, "height": hoehe}, **ctx)
        c.add_init_script(FEHLER_INIT)
        if init:
            c.add_init_script(init)
        pg = c.new_page()
        pg.on("pageerror", lambda e: self.fehler.append(kurz + " Seitenfehler: " + str(e)[:300]))
        pg.on("console", lambda m: self.fehler.append(kurz + " " + m.text[:400]) if m.text.startswith("ZSFEHLER") else None)
        self.seiten.append((kurz, pg))
        return pg

    def keine_seitenfehler(self, was="keine Seitenfehler"):
        # Doppelte Meldungen (pageerror + ZSFEHLER) zusammenfassen
        return self.check(was, not self.fehler, " | ".join(self.fehler[:5]))

    def ende(self):
        gut = sum(1 for _, ok in self.ergebnisse if ok)
        print("ERGEBNIS %d / %d  (%s, %.0f s)" % (gut, len(self.ergebnisse), self.name, time.time() - self.t0), flush=True)
        sys.exit(0 if self.ergebnisse and gut == len(self.ergebnisse) else 1)


def warte(pg, js, ms=15000):
    t = time.time()
    while time.time() - t < ms / 1000:
        if pg.evaluate(js):
            return True
        pg.wait_for_timeout(200)
    return False


def zum_lager(pg):
    """Titelbildschirm → „Spielen“ → Lager, Einführungsfenster zu."""
    pg.goto(URL)
    pg.wait_for_function("window.Z && Z.ui && window.__z", timeout=30000)
    pg.wait_for_timeout(600)
    pg.click("#t-play")
    warte(pg, "!!Z.level", 10000)
    pg.wait_for_timeout(500)
    pg.evaluate("Z.ui.modalOpen && Z.ui.close(); Z.meta.tut = true")


def lauf_starten(pg):
    pg.evaluate("Z.ui.modalOpen && Z.ui.close(); Z.meta.tut = true; __z.start()")
    warte(pg, "!!Z.run && !!Z.level && Z.level.id !== 'lager'", 10000)
    pg.wait_for_timeout(800)
    pg.evaluate("Z.ui.modalOpen && Z.ui.close()")


def bot_js():
    return open(os.path.join(HIER, "bot.js"), encoding="utf-8").read()


def browser_starten(p):
    return p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
