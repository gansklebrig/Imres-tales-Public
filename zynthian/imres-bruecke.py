#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Imres-Brücke für den Zynthian
=============================

Kleiner Webserver (nur Python-Standardbibliothek), der immer läuft – auch im normalen Zynthian-Modus:

* liefert die Seite (Klangwelten und Bühne) aus dem lokalen Ordner aus, ganz ohne Internet,
  und hängt an jede HTML-Seite das Zynthian-Steuerskript (/zyn/zyn.js) an,
* gibt Tasten-, Drehregler- und MIDI-Ereignisse per Server-Sent-Events an die Seite weiter (/zyn/ereignisse),
* nimmt die gewünschten LED-Farben der Seite entgegen (/zyn/leds) und gibt sie an imres-tasten.py weiter,
* schaltet zwischen Imres-Bühne und Zynthian um (/zyn/system),
* bietet eine Fernbedienung fürs Handy: http://zynthian.local:8790/zyn/fern

Aufruf: imres-bruecke.py [--port 8790] [--seite /pfad/zur/seite] [--zyn /pfad/zu/diesem/ordner]
"""
import argparse
import json
import os
import queue
import subprocess
import threading
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

HIER = os.path.dirname(os.path.abspath(__file__))

ap = argparse.ArgumentParser()
ap.add_argument("--port", type=int, default=int(os.environ.get("IMRES_PORT", "8790")))
ap.add_argument("--seite", default=os.environ.get("IMRES_SEITE", os.path.join(os.path.dirname(HIER), "seite")))
ap.add_argument("--zyn", default=HIER)
ap.add_argument("--test", action="store_true", help="ohne Systembefehle (zum Ausprobieren am Rechner)")
ARGS = ap.parse_args()

SEITE = os.path.abspath(ARGS.seite)
ZYN = os.path.abspath(ARGS.zyn)
MODUS_BEFEHL = os.path.join(ZYN, "imres-modus")

# ---------- Ereignisse an alle verbundenen Seiten ----------
hoerer = set()
hoerer_lock = threading.Lock()


def senden(ereignis):
    daten = json.dumps(ereignis, ensure_ascii=False)
    with hoerer_lock:
        for q in list(hoerer):
            try:
                q.put_nowait(daten)
            except queue.Full:
                pass


# ---------- LED-Zustand (die Seite schreibt, imres-tasten.py liest) ----------
leds = {"nr": 0, "farben": {}}
leds_lock = threading.Condition()

# ---------- Zustand für die Fernbedienung ----------
zustand = {"seite": None, "modus": None, "text": "", "zeit": 0}


def modus_jetzt():
    """imres oder zynthian – je nachdem, welcher Dienst läuft"""
    if ARGS.test:
        return "imres"
    try:
        r = subprocess.run(["systemctl", "is-active", "imres-buehne"], capture_output=True, text=True, timeout=3)
        return "imres" if r.stdout.strip() == "active" else "zynthian"
    except Exception:
        return "unbekannt"


class Handler(SimpleHTTPRequestHandler):
    server_version = "ImresBruecke/1"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=SEITE, **kw)

    def log_message(self, fmt, *args):
        pass  # leise

    def end_headers(self):
        pfad = urlparse(self.path).path
        if pfad.endswith((".html", ".js", ".css", ".json")) or pfad.endswith("/") or pfad.startswith("/zyn/"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    # ---- Antwort-Helfer ----
    def json_antwort(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def datei_antwort(self, pfad, typ):
        try:
            with open(pfad, "rb") as f:
                b = f.read()
        except OSError:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def koerper(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > 65536:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8") or "{}")
        except Exception:
            return {}

    # ---- GET ----
    def do_GET(self):
        u = urlparse(self.path)
        p = u.path
        if p == "/zyn/ereignisse":
            return self.ereignisse()
        if p == "/zyn/zyn.js":
            return self.datei_antwort(os.path.join(ZYN, "zyn.js"), "application/javascript; charset=utf-8")
        if p in ("/zyn/fern", "/zyn/fern.html"):
            return self.datei_antwort(os.path.join(ZYN, "fern.html"), "text/html; charset=utf-8")
        if p in ("/zyn/start", "/zyn/start.html"):
            return self.datei_antwort(os.path.join(ZYN, "start.html"), "text/html; charset=utf-8")
        if p == "/zyn/status":
            return self.json_antwort({"modus": modus_jetzt(), "seite": zustand["seite"], "seitenModus": zustand["modus"],
                                      "text": zustand["text"], "vor": round(time.time() - zustand["zeit"], 1) if zustand["zeit"] else None})
        if p == "/zyn/leds":
            # imres-tasten.py fragt hier nach – lange Abfrage: antwortet, sobald sich etwas ändert (spätestens nach 2 s)
            seit = -1
            for teil in (u.query or "").split("&"):
                if teil.startswith("seit="):
                    try:
                        seit = int(teil[5:])
                    except ValueError:
                        pass
            with leds_lock:
                if leds["nr"] == seit:
                    leds_lock.wait(timeout=2)
                return self.json_antwort(leds)
        if p == "/" or p == "":
            self.send_response(302)
            # am Gerät selbst: die Bühne; von anderswo (Handy): die Fernbedienung
            self.send_header("Location", "/zyn/start" if self.client_address[0] in ("127.0.0.1", "::1") else "/zyn/fern")
            self.end_headers()
            return
        if p.endswith(".html"):
            return self.html_mit_skript(p)
        return super().do_GET()

    def html_mit_skript(self, p):
        pfad = os.path.normpath(os.path.join(SEITE, unquote(p).lstrip("/")))
        if not pfad.startswith(SEITE) or not os.path.isfile(pfad):
            self.send_error(404)
            return
        with open(pfad, "rb") as f:
            b = f.read()
        zusatz = b'<script src="/zyn/zyn.js"></script>'
        i = b.rfind(b"</body>")
        b = b[:i] + zusatz + b[i:] if i >= 0 else b + zusatz
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def ereignisse(self):
        q = queue.Queue(maxsize=200)
        with hoerer_lock:
            hoerer.add(q)
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            self.wfile.write(b": hallo\n\n")
            self.wfile.flush()
            while True:
                try:
                    d = q.get(timeout=15)
                    self.wfile.write(("data: " + d + "\n\n").encode("utf-8"))
                except queue.Empty:
                    self.wfile.write(b": lebt\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            with hoerer_lock:
                hoerer.discard(q)

    # ---- POST ----
    def do_POST(self):
        p = urlparse(self.path).path
        d = self.koerper()
        if p == "/zyn/hw":
            # von imres-tasten.py: Tasten, Drehregler, MIDI
            if isinstance(d, dict):
                senden(d)
            return self.json_antwort({"ok": True})
        if p == "/zyn/taste":
            # Fernbedienung: wie eine echte Taste
            name = str(d.get("name", ""))[:20]
            if name:
                senden({"typ": "taste", "name": name, "art": d.get("art", "kurz"), "fern": True})
            return self.json_antwort({"ok": True})
        if p == "/zyn/dreh":
            try:
                senden({"typ": "dreh", "nr": int(d.get("nr", 0)), "d": max(-20, min(20, int(d.get("d", 0)))), "fern": True})
            except (TypeError, ValueError):
                pass
            return self.json_antwort({"ok": True})
        if p == "/zyn/leds":
            farben = d.get("farben") if isinstance(d, dict) else None
            if isinstance(farben, dict):
                with leds_lock:
                    if farben != leds["farben"]:
                        leds["farben"] = {str(k)[:12]: str(v)[:9] for k, v in farben.items()}
                        leds["nr"] += 1
                        leds_lock.notify_all()
            return self.json_antwort({"ok": True})
        if p == "/zyn/zustand":
            # die Seite meldet, was gerade läuft – für die Fernbedienung
            zustand.update({"seite": str(d.get("seite", ""))[:20], "modus": str(d.get("modus", ""))[:20], "text": str(d.get("text", ""))[:200], "zeit": time.time()})
            return self.json_antwort({"ok": True})
        if p == "/zyn/system":
            aktion = str(d.get("aktion", ""))
            if aktion not in ("imres", "zynthian", "neustart", "aus", "seite-neu", "aktualisieren"):
                return self.json_antwort({"ok": False, "fehler": "unbekannte Aktion"}, 400)
            if aktion == "seite-neu":
                senden({"typ": "neu-laden"})
                return self.json_antwort({"ok": True})
            if ARGS.test:
                return self.json_antwort({"ok": True, "test": aktion})
            # losgelöst starten: der Befehl beendet unter Umständen gerade den Dienst, der ihn ausgelöst hat
            subprocess.Popen(["setsid", MODUS_BEFEHL, aktion], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
            return self.json_antwort({"ok": True})
        self.send_error(404)


def main():
    if not os.path.isdir(SEITE):
        print("Seite nicht gefunden:", SEITE)
    srv = ThreadingHTTPServer(("0.0.0.0", ARGS.port), Handler)
    srv.daemon_threads = True
    print("Imres-Brücke auf Port", ARGS.port, "– Seite:", SEITE)
    srv.serve_forever()


if __name__ == "__main__":
    main()
