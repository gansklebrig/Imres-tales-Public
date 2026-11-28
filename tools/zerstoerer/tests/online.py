"""Helfer für die Online-Tests: zwei Seiten (Gastgeber H, Gast G) über den lokalen PeerJS-Vermittler (peer-server.js)."""
from gemeinsam import PEER_PORT, URL, warte

INIT = "window.__zsNet={peer:{host:'127.0.0.1',port:%d,path:'/',secure:false},ice:[]};" % PEER_PORT


def seite(T, b, kurz):
    pg = T.seite(b, kurz, 960, 600, init=INIT)
    pg.goto(URL); pg.wait_for_function("window.Z && Z.ui && window.__z", timeout=30000); pg.wait_for_timeout(1200)
    return pg


def verbinden(T, H, G, held="E"):
    H.click("#t-online"); H.wait_for_timeout(300); H.click("[data-zso=host]")
    if not T.check("Gastgeber öffnet Raum", warte(H, "Z.online.S.st==='wait'")): return None
    code = H.evaluate("Z.online.S.code")
    G.click("#t-online"); G.wait_for_timeout(300); G.click("[data-zso=join]"); G.wait_for_timeout(200)
    G.fill("#zso-code", code); G.click("[data-zso=hero][data-h=%s]" % held); G.click("[data-zso=go]")
    ok = warte(G, "Z.online.S.st==='lobby'") and warte(H, "Z.online.S.st==='lobby'")
    if not T.check("Beide in der Vorhalle", ok): return None
    G.click("[data-zso=ready]")
    if not T.check("Gast bereit", warte(H, "Z.online.S.gReady")): return None
    H.click("[data-zso=start]")
    ok = warte(H, "Z.online.S.st==='play' && !!Z.level && !!Z.koop.p2") and warte(G, "Z.online.S.st==='play' && !!Z.level && !!Z.koop.p2")
    return code if T.check("Spiel läuft bei beiden", ok, code) else None


TUER = """(() => { const d = Z.level.doors.filter(d => d.kind === 'exit')[0]; Z.run.doorsOpen = true; for (const x of Z.level.doors) x.locked = false;
  __z.tele(d.x * 16 + 2, (d.y + 1) * 16 - 28); Z.player.vy = 0; Z.input.setTouch('use', true); __z.step(1); Z.input.endFrame(); Z.input.setTouch('use', false); })()"""
