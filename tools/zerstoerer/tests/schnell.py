#!/usr/bin/env python3
"""Schnelltests ohne Browser (wenige Sekunden):
  1. node --check für alle zerstoerer/*.js (Syntax)
  2. ES2019-Prüfung (tools/zerstoerer/es2019check.js, acorn) – alte Handheld-Browser; fehlt acorn, ist das ein FEHLER
     (lokal: ACORN_PFAD=<ordner mit node_modules/acorn> setzen)
  3. Update-Dateiliste (manifest_pruefen.py)
  4. Update-Logik des PC-Programms (desktop-zerstoerer: node --test test/inhalt.test.js)
Ausgang 0 = alles grün."""
import glob
import os
import subprocess
import sys

sys.dont_write_bytecode = True
HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.abspath(os.path.join(HIER, "..", "..", ".."))
ergebnis = []


def schritt(name, befehl, cwd=WURZEL, muss=None):
    print("── " + name, flush=True)
    r = subprocess.run(befehl, cwd=cwd, capture_output=True, text=True)
    aus = (r.stdout + r.stderr).strip()
    ok = r.returncode == 0 and (muss is None or muss in aus)
    if aus:
        zeilen = aus.splitlines()
        print("\n".join(zeilen if not ok else zeilen[-4:]))
    print(("OK      " if ok else "FEHLER  ") + name, flush=True)
    ergebnis.append((name, ok))


dateien = sorted(glob.glob(os.path.join(WURZEL, "zerstoerer", "*.js")))
kaputt = []
for f in dateien:
    r = subprocess.run(["node", "--check", f], capture_output=True, text=True)
    if r.returncode != 0:
        kaputt.append(os.path.basename(f) + ": " + (r.stderr.strip().splitlines() or ["?"])[-1])
print("── node --check (%d Dateien)" % len(dateien))
for k in kaputt:
    print("  " + k)
print(("OK      " if not kaputt else "FEHLER  ") + "Syntax (node --check)")
ergebnis.append(("Syntax", not kaputt))
schritt("ES2019 (alte Browser)", ["node", "tools/zerstoerer/es2019check.js"], muss="als ES2019 geprüft")
schritt("Update-Dateiliste", [sys.executable, os.path.join(HIER, "manifest_pruefen.py")])
schritt("Update-Logik PC-Programm", ["node", "--test", "test/inhalt.test.js"], cwd=os.path.join(WURZEL, "desktop-zerstoerer"))
gut = sum(1 for _, ok in ergebnis if ok)
print("ERGEBNIS %d / %d  (schnell)" % (gut, len(ergebnis)))
sys.exit(0 if gut == len(ergebnis) else 1)
