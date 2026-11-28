#!/usr/bin/env python3
"""Startet alle Browser-Tests nacheinander und fasst zusammen. Ausgang 0 = alles grün.

Aufruf:  python3 tools/zerstoerer/tests/alle.py              (alle Browser-Tests)
         python3 tools/zerstoerer/tests/alle.py gesamt online  (nur diese)
         python3 tools/zerstoerer/tests/alle.py --schnell      (vorher auch schnell.py)
Läuft unter ZS_PORT schon ein Server, wird er benutzt, sonst startet alle.py einen eigenen (python -m http.server im Repo).
Für die Online-Tests startet alle.py peer-server.js auf ZS_PEER_PORT (braucht das npm-Paket „peer“, siehe LIESMICH.md);
fehlt es, werden die Online-Tests als FEHLER gemeldet (ZS_OHNE_ONLINE=1 überspringt sie stattdessen)."""
import os
import socket
import subprocess
import sys
import time

sys.dont_write_bytecode = True
HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.abspath(os.path.join(HIER, "..", "..", ".."))
sys.path.insert(0, HIER)
from gemeinsam import PORT, PEER_PORT  # noqa: E402

TESTS = ["gesamt", "haken", "werkzeuge", "spielstaende", "ablauf", "rollen", "online", "online_schrein"]
ONLINE = {"online", "online_schrein"}
ZEIT = int(os.environ.get("ZS_TEST_ZEIT", "300"))


def offen(port):
    try:
        with socket.create_connection(("127.0.0.1", port), 1):
            return True
    except OSError:
        return False


def warte_port(port, s=15):
    t = time.time()
    while time.time() - t < s:
        if offen(port):
            return True
        time.sleep(0.2)
    return False


args = [a for a in sys.argv[1:] if not a.startswith("--")]
wahl = args or TESTS
if os.environ.get("ZS_OHNE_ONLINE"):
    wahl = [t for t in wahl if t not in ONLINE]
unbekannt = [t for t in wahl if t not in TESTS]
if unbekannt:
    sys.exit("Unbekannte Tests: %s (vorhanden: %s)" % (", ".join(unbekannt), ", ".join(TESTS)))
prozesse = []
ergebnis = []
try:
    if "--schnell" in sys.argv:
        r = subprocess.run([sys.executable, os.path.join(HIER, "schnell.py")])
        ergebnis.append(("schnell", r.returncode == 0, 0))
    if not offen(PORT):
        prozesse.append(subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"], cwd=WURZEL,
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
        if not warte_port(PORT):
            sys.exit("Statischer Server auf Port %d startet nicht." % PORT)
    print("Spiel: http://127.0.0.1:%d/zerstoerer.html" % PORT, flush=True)
    peer_ok = True
    if any(t in ONLINE for t in wahl) and not offen(PEER_PORT):
        prozesse.append(subprocess.Popen(["node", os.path.join(HIER, "peer-server.js"), str(PEER_PORT)]))
        peer_ok = warte_port(PEER_PORT)
        if not peer_ok:
            print("PeerJS-Vermittler startet nicht (npm-Paket „peer“ fehlt? ZS_PEER_MODUL setzen).", flush=True)
    for t in wahl:
        print("\n════ %s ════" % t, flush=True)
        if t in ONLINE and not peer_ok:
            ergebnis.append((t, False, 0)); continue
        t0 = time.time()
        try:
            r = subprocess.run([sys.executable, os.path.join(HIER, "t_%s.py" % t)], cwd=os.getcwd(), timeout=ZEIT)
            ok = r.returncode == 0
        except subprocess.TimeoutExpired:
            print("FEHLER  Zeitüberschreitung (%d s)" % ZEIT, flush=True); ok = False
        ergebnis.append((t, ok, time.time() - t0))
finally:
    for p in prozesse:
        p.terminate()
print("\n════ Zusammenfassung ════")
for t, ok, s in ergebnis:
    print("%s %-16s %4.0f s" % ("OK    " if ok else "FEHLER", t, s))
gut = sum(1 for _, ok, _ in ergebnis if ok)
print("ERGEBNIS %d / %d Testdateien grün" % (gut, len(ergebnis)))
sys.exit(0 if ergebnis and gut == len(ergebnis) else 1)
