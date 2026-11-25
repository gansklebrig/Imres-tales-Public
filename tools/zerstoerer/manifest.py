#!/usr/bin/env python3
"""Schreibt zerstoerer/dateien.json – die Liste aller Spieldateien mit SHA-256 und Größe.

Das PC-Programm vergleicht diese Liste beim Start mit seinem Stand und lädt nur geänderte Dateien nach
(Spiel-Updates ohne Neuinstallation). Die Ausgabe ist deterministisch: gleiche Dateien → byte-gleiche Liste.

Aufruf:  python3 tools/zerstoerer/manifest.py            → zerstoerer/dateien.json im Repo
         python3 tools/zerstoerer/manifest.py <ordner>   → <ordner>/zerstoerer/dateien.json aus den Dateien in <ordner>
                                                          (für das mitgelieferte Spiel im Programm)
         python3 tools/zerstoerer/manifest.py --pruefen  → Fehlercode 1, wenn die Liste im Repo nicht aktuell ist
"""
import hashlib
import json
import os
import re
import sys

sys.dont_write_bytecode = True   # kein __pycache__ im Repo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sammeln  # noqa: E402

WURZEL = sammeln.WURZEL


def stand(basis):
    html = open(os.path.join(basis, 'zerstoerer.html'), encoding='utf-8').read()
    v = [int(x) for x in re.findall(r'\?v=(\d+)', html)]
    return max(v) if v else 0


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def erzeugen(basis, pfade):
    d = {}
    for rel in sorted(pfade):
        p = os.path.join(basis, rel)
        d[rel] = {'sha256': sha(p), 'groesse': os.path.getsize(p)}
    m = {'stand': stand(basis), 'dateien': d}
    return json.dumps(m, ensure_ascii=False, sort_keys=True, indent=0, separators=(',', ':')) + '\n'


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if args:
        basis = os.path.abspath(args[0])
        pfade = []
        for r, _, fs in os.walk(basis):
            for f in fs:
                rel = os.path.relpath(os.path.join(r, f), basis).replace(os.sep, '/')
                if rel != sammeln.MANIFEST:
                    pfade.append(rel)
    else:
        basis, pfade = WURZEL, sammeln.liste()
    text = erzeugen(basis, pfade)
    ziel = os.path.join(basis, sammeln.MANIFEST)
    alt = open(ziel, encoding='utf-8').read() if os.path.isfile(ziel) else None
    if '--pruefen' in sys.argv:
        if alt != text:
            sys.exit('zerstoerer/dateien.json ist nicht aktuell')
        print('aktuell')
        return
    if alt == text:
        print(f'unverändert ({len(pfade)} Dateien)')
        return
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    with open(ziel, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print(f'geschrieben: {ziel} ({len(pfade)} Dateien)')


if __name__ == '__main__':
    main()
