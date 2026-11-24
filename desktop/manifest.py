#!/usr/bin/env python3
"""Schreibt spiel-manifest.json in den gepackten Spielordner – die Grundlage für Spiel-Updates ohne Neuinstallation.

  inhalt  – fortlaufende Nummer der Spielfassung (Lauf-Nummer des Workflows, = heldensturm-pc-1.N)
  commit  – Git-Stand, von dem das Programm einzelne Dateien nachlädt (raw.githubusercontent.com/…/<commit>/<pfad>)
  huelle  – Prüfsumme über die Programm-Hülle (main.js, preload.js, Abhängigkeiten, Installer-Bausteine).
            Ändert sie sich, braucht es ein Programm-Update; sonst reichen geänderte Spieldateien.
  dateien – {pfad: [sha256, bytes]} für jede Spieldatei (Pfade wie im Repo)

Aufruf:  python3 desktop/manifest.py desktop/spiel <inhalt> <commit>
"""
import hashlib
import json
import os
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
HUELLE = ['main.js', 'preload.js', 'package-lock.json', 'build/installer.nsh', 'build/icon.png']
NAME = 'spiel-manifest.json'


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def huelle():
    h = hashlib.sha256()
    for rel in HUELLE:
        p = os.path.join(HIER, rel)
        if os.path.isfile(p):
            h.update(rel.encode() + b'\0' + open(p, 'rb').read().replace(b'\r\n', b'\n') + b'\0')
    # package.json ohne die Versionsnummer (die setzt der Workflow bei jedem Lauf neu)
    pj = json.load(open(os.path.join(HIER, 'package.json'), encoding='utf-8'))
    pj.pop('version', None)
    h.update(json.dumps(pj, sort_keys=True).encode())
    return h.hexdigest()


def main():
    ziel, inhalt, commit = os.path.abspath(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    dateien = {}
    for wurzel, _, namen in os.walk(ziel):
        for n in namen:
            p = os.path.join(wurzel, n)
            rel = os.path.relpath(p, ziel).replace(os.sep, '/')
            if rel == NAME:
                continue
            dateien[rel] = [sha(p), os.path.getsize(p)]
    m = {'v': 1, 'inhalt': inhalt, 'commit': commit, 'huelle': huelle(), 'dateien': dict(sorted(dateien.items()))}
    with open(os.path.join(ziel, NAME), 'w', encoding='utf-8') as f:
        json.dump(m, f, separators=(',', ':'))
    print(f'{NAME}: Fassung {inhalt}, {len(dateien)} Dateien, Hülle {m["huelle"][:12]}')


if __name__ == '__main__':
    main()
