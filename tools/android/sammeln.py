#!/usr/bin/env python3
"""Stellt alle Dateien zusammen, die Heldensturm offline braucht, und kopiert sie nach
android/app/src/main/assets/spiel/ (für die Android-App).

Grundlage ist dieselbe Liste wie für das Offline-Speichern im Browser (heldensturm-sw.js),
dazu die Sprachaufnahmen, die Erzählertexte und die Porträts.

Aufruf:  python3 tools/android/sammeln.py [ziel]
"""
import glob
import json
import os
import re
import shutil
import sys

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ZIEL = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(WURZEL, 'android/app/src/main/assets/spiel'))

DAZU = [
    'heldensturm-erzaehler.js',
    'tools/vertonung/heldensturm-de.json',
    'inhalt.js',
    'kuerzel.js',
    'audio/heldensturm/**/*',
    'klang/*.mp3',
    'heldensturm-clips/*',
    'schriften/*',
    '*-frei.webp',
]


def liste():
    t = open(os.path.join(WURZEL, 'heldensturm-sw.js'), encoding='utf-8').read()
    m = re.search(r'const L=(\{.*?\});\n', t, re.S)
    if not m:
        sys.exit('Dateiliste in heldensturm-sw.js nicht gefunden')
    L = json.loads(m.group(1))
    alle = [p.split('?')[0] for p in L['kern'] + L['daten']]
    # Geräusche, die das Spiel direkt beim Namen ruft (amb/g_troll_1 …): alle Varianten mitnehmen
    html = open(os.path.join(WURZEL, 'heldensturm.html'), encoding='utf-8').read()
    vorsilben = set(re.findall(r"amb/([a-z][a-z0-9_]*)", html))
    if os.path.isdir(os.path.join(WURZEL, 'amb')):
        for f in os.listdir(os.path.join(WURZEL, 'amb')):
            if any(f.startswith(v) for v in vorsilben):
                alle.append('amb/' + f)
    for muster in DAZU:
        for p in glob.glob(os.path.join(WURZEL, muster), recursive=True):
            if os.path.isfile(p):
                alle.append(os.path.relpath(p, WURZEL))
    return sorted(set(alle))


def main():
    if os.path.isdir(ZIEL):
        shutil.rmtree(ZIEL)
    fehlt, n, groesse = [], 0, 0
    for rel in liste():
        q = os.path.join(WURZEL, rel)
        if not os.path.isfile(q):
            fehlt.append(rel)
            continue
        z = os.path.join(ZIEL, rel)
        os.makedirs(os.path.dirname(z), exist_ok=True)
        shutil.copyfile(q, z)
        n += 1
        groesse += os.path.getsize(q)
    print(f'{n} Dateien, {groesse / 1e6:.1f} MB nach {ZIEL}')
    if fehlt:
        print(f'{len(fehlt)} Dateien fehlen, z. B.:', ', '.join(fehlt[:10]))
    if not os.path.isfile(os.path.join(ZIEL, 'heldensturm.html')):
        sys.exit('heldensturm.html fehlt')


if __name__ == '__main__':
    main()
