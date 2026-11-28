#!/usr/bin/env python3
"""Prüft die Update-Dateiliste des PC-Programms (zerstoerer/dateien.json) – ohne sie zu ändern.

1. Die frisch berechnete Liste (tools/zerstoerer/sammeln.py) darf gegenüber der Liste im Repo nicht sprunghaft wachsen
   (Standard: höchstens 40 neue Dateien; ZS_MANIFEST_PLUS ändert die Grenze). Typischer Grund für einen Sprung: eine
   Zeichenkette oder ein Kommentar im Spielcode, die wie der Anfang vieler Ton-Dateinamen aussieht.
2. Keine Dateien aus dem Wurzelordner außer zerstoerer.html, tonregler.js, favicon.svg (nicht altcss.js, Service Worker,
   Web-Manifest, Icons …) – weder in der Repo-Liste noch in der frischen.
3. Jeder Pfad muss die Regeln des Programms erfüllen (desktop-zerstoerer/inhalt.js: ERLAUBT_ORT, erlaubte Endungen, keine
   versteckten/seltsamen Namen) – geprüft mit relGueltig() aus inhalt.js selbst.
4. Jede Datei der Repo-Liste existiert (Größe stimmt nicht zwingend – die Liste wird nach dem Push vom Bot erneuert).
Ausgang 0 = in Ordnung, 1 = Fehler.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True
WURZEL = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
sys.path.insert(0, os.path.join(WURZEL, "tools", "zerstoerer"))
import sammeln  # noqa: E402

WURZEL_ERLAUBT = {"zerstoerer.html", "tonregler.js", "favicon.svg"}
PLUS = int(os.environ.get("ZS_MANIFEST_PLUS", "40"))

fehler = []
repo = json.load(open(os.path.join(WURZEL, "zerstoerer", "dateien.json"), encoding="utf-8"))["dateien"]
frisch = sammeln.liste()
neu = sorted(set(frisch) - set(repo))
weg = sorted(set(repo) - set(frisch))
print("Dateiliste: Repo %d, frisch %d (neu %d, weg %d)" % (len(repo), len(frisch), len(neu), len(weg)))
for p in neu[:15]:
    print("  neu:", p)
if len(frisch) > len(repo) + PLUS:
    fehler.append("Die Dateiliste wächst sprunghaft um %d Dateien (Grenze %d) – Kommentar/Zeichenkette mit Ton-Namen im Spielcode?" % (len(frisch) - len(repo), PLUS))
for name, liste in (("Repo", repo), ("frisch", frisch)):
    w = sorted(p for p in liste if "/" not in p and p not in WURZEL_ERLAUBT)
    if w:
        fehler.append("%s-Liste enthält Wurzeldateien, die nicht ins PC-Paket gehören: %s" % (name, ", ".join(w)))
# Regeln des Programms selbst anwenden
alle = sorted(set(repo) | set(frisch))
js = ("const I=require(%s);let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const l=JSON.parse(s).filter(p=>!I.relGueltig(p));"
      "console.log(JSON.stringify(l));});") % json.dumps(os.path.join(WURZEL, "desktop-zerstoerer", "inhalt.js"))
r = subprocess.run(["node", "-e", js], input=json.dumps(alle), capture_output=True, text=True)
if r.returncode != 0:
    fehler.append("inhalt.js ließ sich nicht prüfen: " + r.stderr[:300])
else:
    ungueltig = json.loads(r.stdout)
    if ungueltig:
        fehler.append("Pfade, die das PC-Programm ablehnen würde (ERLAUBT_ORT/Endung/Name): " + ", ".join(ungueltig[:10]))
fehlt = [p for p in repo if not os.path.isfile(os.path.join(WURZEL, p))]
if fehlt:
    fehler.append("In der Repo-Liste, aber nicht vorhanden: " + ", ".join(fehlt[:10]))
for f in fehler:
    print("FEHLER  " + f)
print("Dateiliste in Ordnung." if not fehler else "Dateiliste: %d Fehler." % len(fehler))
sys.exit(1 if fehler else 0)
