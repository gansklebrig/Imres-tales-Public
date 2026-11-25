#!/usr/bin/env python3
"""Stellt alle Dateien zusammen, die „Ezekiel – The Destroyer“ offline braucht (für das PC-Programm).

- zerstoerer.html, zerstoerer/** (dateien.json wird für den Zielordner neu geschrieben), tonregler.js, favicon.svg, schriften/**
- Geräusche und Instrumente aus klang/ und amb/: Das Spiel baut die Namen zur Laufzeit zusammen
  ("amb/" + "a_feuer" + n + ".mp3", RK("fx_0_fleisch_stich_", [1, 2, 3]) …). Deshalb werden alle Zeichenketten aus
  zerstoerer/*.js und zerstoerer.html gesammelt; jede Aufnahme, deren Name mit einer davon beginnt, kommt mit.
  (Geprüft mit tools/zerstoerer/pruef404.py: beim Spielen keine fehlenden Dateien.)

Aufruf:  python3 tools/zerstoerer/sammeln.py [ziel]      (Standard: desktop-zerstoerer/spiel)
         python3 tools/zerstoerer/sammeln.py --liste      (nur die Liste ausgeben)
"""
import glob
import os
import re
import shutil
import sys

sys.dont_write_bytecode = True   # kein __pycache__ im Repo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

WURZEL = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
MANIFEST = 'zerstoerer/dateien.json'

FEST = ['zerstoerer.html', 'tonregler.js', 'favicon.svg']
MUSTER = ['zerstoerer/**/*', 'schriften/**/*']
TON = ['klang', 'amb']
LIZENZEN = ['klang/LIZENZ.txt']


def _rel(p):
    return os.path.relpath(p, WURZEL).replace(os.sep, '/')


def _woerter():
    """Alle kurzen Kleinbuchstaben-Zeichenketten aus dem Spielcode – Kandidaten für Namensanfänge der Aufnahmen."""
    w = set()
    quellen = sorted(glob.glob(os.path.join(WURZEL, 'zerstoerer', '*.js'))) + [os.path.join(WURZEL, 'zerstoerer.html')]
    for q in quellen:
        t = open(q, encoding='utf-8').read()
        w |= set(re.findall(r'["\'`/]([a-z][a-z0-9_]{1,40})["\'`]', t))
        w |= set(re.findall(r'(?:amb|klang)/([a-z][a-z0-9_]{1,60})', t))   # volle Pfade "amb/a_esse.mp3"
    return {x for x in w if len(x) >= 2}


def liste():
    alle = set()
    for f in FEST + LIZENZEN:
        if os.path.isfile(os.path.join(WURZEL, f)):
            alle.add(f)
    for m in MUSTER:
        for p in glob.glob(os.path.join(WURZEL, m), recursive=True):
            if os.path.isfile(p):
                alle.add(_rel(p))
    woerter = _woerter()
    for d in TON:
        ordner = os.path.join(WURZEL, d)
        if not os.path.isdir(ordner):
            continue
        for f in os.listdir(ordner):
            if f.endswith('.mp3') and any(f[:-4].startswith(w) for w in woerter):
                alle.add(d + '/' + f)
    alle.discard(MANIFEST)
    # nichts Verstecktes, keine Sicherungskopien
    return sorted(p for p in alle if not any(s.startswith('.') for s in p.split('/')) and not p.endswith('~'))


def main():
    if '--liste' in sys.argv:
        print('\n'.join(liste()))
        return
    ziel = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(WURZEL, 'desktop-zerstoerer', 'spiel'))
    if os.path.isdir(ziel):
        shutil.rmtree(ziel)
    n, groesse = 0, 0
    for rel in liste():
        q = os.path.join(WURZEL, rel)
        z = os.path.join(ziel, rel)
        os.makedirs(os.path.dirname(z), exist_ok=True)
        shutil.copyfile(q, z)
        n += 1
        groesse += os.path.getsize(q)
    # Dateiliste für die Spiel-Updates gleich mitschreiben (dieselbe Form wie zerstoerer/dateien.json im Repo)
    import manifest
    with open(os.path.join(ziel, MANIFEST), 'w', encoding='utf-8', newline='\n') as f:
        f.write(manifest.erzeugen(ziel, liste()))
    print(f'{n} Dateien, {groesse / 1e6:.1f} MB nach {ziel} (mit {MANIFEST})')
    if not os.path.isfile(os.path.join(ziel, 'zerstoerer.html')):
        sys.exit('zerstoerer.html fehlt')


if __name__ == '__main__':
    main()
