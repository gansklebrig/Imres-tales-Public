"""Online-Koop, Runde 2: Wandlungsschrein im Durchgang für den Gast, manipulierte Antwort, Boss-Auftritt beim Gast."""
from playwright.sync_api import sync_playwright
from gemeinsam import Pruefung, browser_starten, warte
from online import seite, verbinden, TUER

T = Pruefung("online_schrein")
with sync_playwright() as p:
    b = browser_starten(p)
    H = seite(T, b, "H"); G = seite(T, b, "G")
    if not verbinden(T, H, G, "E"):
        T.ende()
    ev = lambda pg, js: pg.evaluate(js)
    ev(H, "Z.meta.tut=true; Z.startRun()"); warte(H, "Z.level.id!=='lager'", 15000); warte(G, "Z.level.id!=='lager'", 15000); G.wait_for_timeout(1000)
    ev(H, TUER)
    T.check("Durchgang beim Gastgeber", warte(H, "!!Z.level.passage", 10000)); T.check("Durchgang beim Gast", warte(G, "!!Z.level.passage", 10000))
    G.wait_for_timeout(1200)
    hasS = ev(H, "!!(Z.level._mut)"); T.check("Schrein im Durchgang", hasS)
    if hasS:
        ev(H, "Z.ui.modalOpen&&Z.ui.close(); const m=Z.level._mut, P=Z.koop.p2; P.x=m.x-P.w/2; P.y=m.y-P.h; P.vx=P.vy=0")
        G.wait_for_timeout(400); G.keyboard.down("KeyE"); G.wait_for_timeout(250); G.keyboard.up("KeyE")
        okg = warte(G, "!!document.querySelector('#modal .zso-mut')", 6000)
        T.check("Schrein-Fenster erscheint beim Gast", okg)
        T.check("… nicht beim Gastgeber", not ev(H, "!!document.querySelector('#modal .mutwahl')"))
        if okg:
            gid = ev(G, "document.querySelector('#modal [data-zso=mutnimm]').dataset.h")
            G.click("#modal [data-zso=mutnimm]")
            T.check("Wahl beim Gastgeber eingetragen", warte(H, "Z.koop.p2.mut&&Z.koop.p2.mut.indexOf('%s')>=0" % gid, 5000), gid)
            T.check("Schrein für Spieler 2 verbraucht", ev(H, "Z.level._mut.wahl[1]") == gid)
            T.check("Fenster beim Gast zu", warte(G, "!Z.ui.modalOpen", 3000))
            G.keyboard.down("KeyE"); G.wait_for_timeout(250); G.keyboard.up("KeyE"); G.wait_for_timeout(1200)
            T.check("Kein zweites Angebot", not ev(G, "!!document.querySelector('#modal .zso-mut')"))
    ev(G, "Z.online.S.link.sendR({t:'mutw',id:'gibtsnicht'})"); G.wait_for_timeout(500)
    ev(H, "Z.ui.modalOpen&&Z.ui.close(); __z.area('labor')"); T.check("Arena beim Gast", warte(G, "Z.level.id==='labor'", 10000))
    G.wait_for_timeout(800); ev(H, "__z.god(true); Z.player.x=20*16;")
    T.check("Boss erscheint beim Gastgeber", warte(H, "!!Z.boss", 10000))
    T.check("Boss-Auftritt/Namensband beim Gast", warte(G, "document.body.classList.contains('bossplatte') || (document.getElementById('bossname')||{}).textContent.length>0", 8000))
    G.wait_for_timeout(5700)
    T.check("Nach dem Auftritt frische Schnappschüsse beim Gast", ev(G, "performance.now()-Z.online.S.lastSnapAt<1500") and ev(G, "Z.online.S.st") == "play")
    ev(H, "Z.boss.hp=0"); T.check("Boss-Fall beim Gast", warte(G, "Z.bossDefeated", 8000))
    G.wait_for_timeout(2500)
    T.check("Gast weiter verbunden", ev(G, "Z.online.S.st") == "play" and ev(H, "Z.online.S.st") == "play")
    T.keine_seitenfehler()
    b.close()
T.ende()
