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
* hört alle MIDI-Eingänge mit (Clock → Tempo und Schläge, Start/Stop, Noten, Regler, Programmwechsel) –
  auch im Zynthian-Modus, damit ein MIDI-Befehl zur Imres-Bühne umschalten kann,
* ist MIDI-Master, wenn gewünscht: sendet Clock, Start und Stop im Takt der Bühne,
* nimmt auf Wunsch alles auf, was aus den Ausgängen kommt (jack_capture),
* merkt sich die Optionen (optionen.json), die Seite, Fernbedienung und Gerät teilen.

Aufruf: imres-bruecke.py [--port 8790] [--seite /pfad/zur/seite] [--zyn /pfad/zu/diesem/ordner]
"""
import argparse
import json
import os
import queue
import re
import subprocess
import threading
import signal
import sys
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote

HIER = os.path.dirname(os.path.abspath(__file__))

ap = argparse.ArgumentParser()
ap.add_argument("--port", type=int, default=int(os.environ.get("IMRES_PORT", "8790")))
ap.add_argument("--seite", default=os.environ.get("IMRES_SEITE", os.path.join(os.path.dirname(HIER), "seite")))
ap.add_argument("--zyn", default=HIER)
ap.add_argument("--test", action="store_true", help="ohne Systembefehle (zum Ausprobieren am Rechner)")
ap.add_argument("--optionen", default=os.environ.get("IMRES_OPTIONEN", ""))
ap.add_argument("--aufnahmen", default=os.environ.get("IMRES_AUFNAHMEN", "/zynthian/zynthian-my-data/capture"))
ap.add_argument("--kein-midi", action="store_true")
ARGS = ap.parse_args()

SEITE = os.path.abspath(ARGS.seite)
ZYN = os.path.abspath(ARGS.zyn)
MODUS_BEFEHL = os.path.join(ZYN, "imres-modus")
OPT_DATEI = ARGS.optionen or os.path.join(os.path.dirname(SEITE), "optionen.json")

# ---------- Optionen (gemeinsam für Gerät, Hintergrund und Fernbedienung) ----------
OPT_STANDARD = {
    "takt": "slave",          # aus | slave (folgt der MIDI-Clock) | master (sendet Clock)
    "kulisseImTakt": True,    # Einzelgeräusche der Kulisse auf den Schlag legen
    "versatzMs": 15,          # Ausgleich der Verzögerung (Slave) bzw. Vorlauf (Master)
    "tonartAn": False, "grund": 2, "skala": "kurd",   # Tonart der Handpan (2 = D)
    "mikro": False, "mikroSpannung": True, "mikroAusweichen": True, "mikroEmpf": 50,
    "kickDucken": False, "kickKanal": 10, "kickNote": 36, "duckTiefe": 40,
    "steuerKanal": 16,        # Kanal für Noten/Regler/Umschalten (0 = alle)
    "programmWechsel": True,  # Program Change wählt Stimmung bzw. Klangwelt
    "umschaltCC": True,       # CC 119: 0–42 Zynthian · 43–85 Imres im Hintergrund · 86–127 Imres-Bühne
    "noten": True, "regler": True,
}
OPT_ERLAUBT = {
    "takt": ("aus", "slave", "master"),
    "skala": ("kurd", "celtic", "integral", "amara", "pygmy", "hijaz", "sabye", "mixo", "grundton"),
}
opt_lock = threading.Lock()


def opt_laden():
    o = dict(OPT_STANDARD)
    try:
        with open(OPT_DATEI, encoding="utf-8") as f:
            d = json.load(f)
        if isinstance(d, dict):
            o.update({k: v for k, v in d.items() if k in OPT_STANDARD})
    except Exception:
        pass
    return o


OPT = opt_laden()


def opt_setzen(neu):
    with opt_lock:
        for k, v in (neu or {}).items():
            if k not in OPT_STANDARD:
                continue
            std = OPT_STANDARD[k]
            if isinstance(std, bool):
                v = bool(v)
            elif isinstance(std, int):
                try:
                    v = int(v)
                except (TypeError, ValueError):
                    continue
            else:
                v = str(v)
                if k in OPT_ERLAUBT and v not in OPT_ERLAUBT[k]:
                    continue
            OPT[k] = v
        try:
            tmp = OPT_DATEI + ".neu"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(OPT, f, ensure_ascii=False, indent=1)
            os.replace(tmp, OPT_DATEI)
        except OSError:
            pass
        return dict(OPT)

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


# ---------- MIDI ----------
sys.path.insert(0, HIER)
try:
    import imres_midi
except Exception as e:  # pragma: no cover
    print("MIDI-Modul fehlt:", e)
    imres_midi = None
takt = None
umschalt_zuletzt = {"wert": None, "zeit": 0.0}


def midi_ereignis(e):
    senden(e)
    # MIDI-Befehl zum Umschalten (wirkt auch, wenn gerade der normale Zynthian läuft)
    if e.get("art") == "cc" and e.get("cc") == 119 and OPT.get("umschaltCC"):
        k = OPT.get("steuerKanal", 16)
        if k and e.get("kanal") != k:
            return
        w = e.get("wert", 0)
        ziel = "zynthian" if w < 43 else "hintergrund" if w < 86 else "imres"
        jetzt = time.monotonic()
        if ziel != umschalt_zuletzt["wert"] or jetzt - umschalt_zuletzt["zeit"] > 10:
            umschalt_zuletzt.update(wert=ziel, zeit=jetzt)
            if ziel != modus_jetzt():
                system_befehl(ziel)


def system_befehl(aktion):
    if ARGS.test:
        print("(Test) Systembefehl:", aktion)
        return
    # losgelöst starten: der Befehl beendet unter Umständen gerade den Dienst, der ihn ausgelöst hat
    subprocess.Popen(["setsid", MODUS_BEFEHL, aktion], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)


# ---------- Aufnahme (alles, was aus den Ausgängen kommt) ----------
aufnahme = {"proc": None, "datei": None, "seit": 0}


def aufnahme_schalten(an):
    p = aufnahme["proc"]
    if not an:
        if p and p.poll() is None:
            try:
                p.send_signal(signal.SIGINT)
                p.wait(timeout=5)
            except Exception:
                p.kill()
        aufnahme.update(proc=None, seit=0)
        return {"an": False, "datei": aufnahme["datei"]}
    if p and p.poll() is None:
        return {"an": True, "datei": aufnahme["datei"]}
    os.makedirs(ARGS.aufnahmen, exist_ok=True)
    datei = os.path.join(ARGS.aufnahmen, time.strftime("imres-%Y-%m-%d_%H-%M-%S.wav"))
    if ARGS.test:
        aufnahme.update(proc=None, datei=datei, seit=time.time())
        return {"an": True, "datei": datei, "test": True}
    befehle = [["jack_capture", "--no-stdin", "-f", "wav", "-b", "24", "-c", "2", "-p", "system:playback_1", "-p", "system:playback_2", datei],
               ["jack_capture", "-c", "2", "-p", "system:playback_1", "-p", "system:playback_2", datei]]
    for b in befehle:
        try:
            proc = subprocess.Popen(b, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(0.4)
            if proc.poll() is None:
                aufnahme.update(proc=proc, datei=datei, seit=time.time())
                return {"an": True, "datei": datei}
        except FileNotFoundError:
            break
    return {"an": False, "fehler": "jack_capture fehlt oder JACK läuft nicht"}


def aufnahme_laeuft():
    p = aufnahme["proc"]
    return bool((p and p.poll() is None) or (ARGS.test and aufnahme["seit"]))


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
        r = subprocess.run(["systemctl", "is-active", "imres-buehne", "imres-hintergrund"], capture_output=True, text=True, timeout=3)
        z = r.stdout.split()
        return "imres" if z[:1] == ["active"] else "hintergrund" if z[1:2] == ["active"] else "zynthian"
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

    def koerper(self, grenze=65536):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > grenze:
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
            return self.json_antwort({"modus": modus_jetzt(), "seite": zustand["seite"], "seitenModus": zustand["modus"], "aufnahme": aufnahme_laeuft(),
                                      "master": bool(takt and takt.seq), "optionen": dict(OPT),
                                      "text": zustand["text"], "vor": round(time.time() - zustand["zeit"], 1) if zustand["zeit"] else None})
        if p == "/zyn/optionen":
            return self.json_antwort(dict(OPT))
        if p == "/zyn/last":
            return self.json_antwort(last_messen())
        if p in ("/zyn/imres_midi.py", "/zyn/imres-bruecke.py"):
            return self.send_error(404)
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
        d = self.koerper(8 * 1024 * 1024 if p == "/zyn/sicherung" else 65536)
        if p == "/zyn/sicherung":
            return self.json_antwort(sicherung(d if isinstance(d, dict) else {}))
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
        if p == "/zyn/optionen":
            neu = opt_setzen(d if isinstance(d, dict) else {})
            if takt:
                takt.an = neu.get("takt") == "master"
            senden({"typ": "optionen", "optionen": neu})
            return self.json_antwort(neu)
        if p == "/zyn/noten":
            if noten and isinstance(d, dict):
                if d.get("alleAus"):
                    noten.alle_aus()
                liste = d.get("ev")
                if isinstance(liste, list):
                    noten.planen([x for x in liste if isinstance(x, dict)])
            return self.json_antwort({"ok": bool(noten and noten.seq)})
        if p == "/zyn/audio":
            return self.json_antwort(audio(d if isinstance(d, dict) else {}))
        if p == "/zyn/netz":
            return self.json_antwort(netz(d if isinstance(d, dict) else {}))
        if p == "/zyn/takt":
            # die Bühne meldet als MIDI-Master Tempo und Schlag
            if takt:
                try:
                    b = d.get("bisSchlag")
                    takt.abgleich(float(d.get("bpm") or 0), bool(d.get("laeuft")), float(b) if b is not None else None, float(OPT.get("versatzMs", 0)))
                except (TypeError, ValueError):
                    pass
            return self.json_antwort({"ok": True})
        if p == "/zyn/aufnahme":
            an = d.get("an")
            if an is None:
                an = not aufnahme_laeuft()
            erg = aufnahme_schalten(bool(an))
            senden({"typ": "aufnahme", "an": erg.get("an", False), "datei": os.path.basename(erg.get("datei") or "")})
            return self.json_antwort(erg)
        if p == "/zyn/system":
            aktion = str(d.get("aktion", ""))
            if aktion not in ("imres", "zynthian", "hintergrund", "neustart", "aus", "seite-neu", "aktualisieren", "start-imres", "start-zynthian", "start-hintergrund"):
                return self.json_antwort({"ok": False, "fehler": "unbekannte Aktion"}, 400)
            if aktion == "seite-neu":
                senden({"typ": "neu-laden"})
                return self.json_antwort({"ok": True})
            system_befehl(aktion)
            return self.json_antwort({"ok": True, "test": ARGS.test})
        self.send_error(404)


# ---------- Auslastung des Raspberry Pi (für die Anzeige im Pult) ----------
_last_vorher = {}


def last_messen():
    erg = {"cpu": None, "kern": None, "temp": None}
    try:
        with open("/proc/stat") as f:
            zeilen = [z.split() for z in f if z.startswith("cpu")]
        werte = []
        for z in zeilen:
            zahlen = list(map(int, z[1:9]))
            leer, gesamt = zahlen[3] + zahlen[4], sum(zahlen)
            alt = _last_vorher.get(z[0])
            _last_vorher[z[0]] = (leer, gesamt)
            if alt and gesamt > alt[1]:
                werte.append((z[0], 100.0 * (1 - (leer - alt[0]) / (gesamt - alt[1]))))
        for name, w in werte:
            if name == "cpu":
                erg["cpu"] = round(w)
        kerne = [w for name, w in werte if name != "cpu"]
        if kerne:
            erg["kern"] = round(max(kerne))
    except Exception:
        pass
    try:
        with open("/sys/class/thermal/thermal_zone0/temp") as f:
            erg["temp"] = round(int(f.read().strip()) / 1000)
    except Exception:
        pass
    return erg


noten = None


# ---------- WLAN und Bluetooth (für das Menü im Pult) ----------
AUSGANG_DATEI = os.path.normpath(os.path.join(ZYN, "..", "..", "ausgang"))  # …/imres/seite/zynthian → …/imres/ausgang
bt_install = {"laeuft": False, "meldung": ""}


def _lauf(befehl, zeit=15, eingabe=None):
    try:
        r = subprocess.run(befehl, capture_output=True, text=True, timeout=zeit, input=eingabe)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except FileNotFoundError:
        return 127, "fehlt: " + befehl[0]
    except subprocess.TimeoutExpired:
        return 124, "Zeitüberschreitung"


def _ton_neu():
    """ALSA-Weg für Chromium neu schreiben (Zynthian/JACK oder Bluetooth) und den Browser neu starten"""
    _lauf(["bash", "-c", "source '%s/ton.sh' && imres_ton_einrichten" % ZYN], 60)
    _lauf(["pkill", "-f", "imres/profil"], 5)   # kiosk.sh startet Chromium von selbst neu


def netz(d):
    if ARGS.test:
        return {"ok": False, "fehler": "Testmodus"}
    a = str(d.get("aktion", ""))
    if a == "wlan_status":
        c, t = _lauf(["nmcli", "-t", "-f", "DEVICE,TYPE,STATE,CONNECTION", "dev"], 8)
        wlan = [z.split(":") for z in t.splitlines() if ":wifi:" in z]
        _, ip = _lauf(["hostname", "-I"], 5)
        return {"ok": c == 0, "wlan": [{"dev": w[0], "status": w[2], "netz": w[3]} for w in wlan if len(w) >= 4], "ip": ip.strip(), "fehler": "" if c == 0 else t.strip()[:200]}
    if a == "wlan_liste":
        c, t = _lauf(["nmcli", "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi", "list", "--rescan", "yes"], 25)
        netze, gesehen = [], set()
        for z in t.splitlines():
            teile = re.split(r"(?<!\\):", z)
            if len(teile) < 4 or not teile[1] or teile[1] in gesehen:
                continue
            gesehen.add(teile[1])
            netze.append({"an": teile[0] == "*", "ssid": teile[1].replace("\\:", ":"), "signal": int(teile[2] or 0), "schutz": teile[3]})
        netze.sort(key=lambda x: (-x["an"], -x["signal"]))
        return {"ok": c == 0, "netze": netze[:24], "fehler": "" if c == 0 else t.strip()[:200]}
    if a == "wlan_verbinden":
        ssid, pw = str(d.get("ssid", ""))[:64], str(d.get("pw", ""))[:64]
        befehl = ["nmcli", "dev", "wifi", "connect", ssid] + (["password", pw] if pw else [])
        c, t = _lauf(befehl, 45)
        return {"ok": c == 0, "meldung": t.strip()[:240]}
    if a == "bt_liste":
        _lauf(["bluetoothctl", "power", "on"], 8)
        if d.get("suchen"):
            _lauf(["bluetoothctl", "--timeout", "10", "scan", "on"], 16)
        c, t = _lauf(["bluetoothctl", "devices"], 8)
        geraete = []
        for z in t.splitlines():
            m = re.match(r"Device ([0-9A-F:]{17}) (.*)", z.strip())
            if not m:
                continue
            _, info = _lauf(["bluetoothctl", "info", m.group(1)], 6)
            icon = (re.search(r"Icon: (\S+)", info) or [None, ""])[1]
            geraete.append({"mac": m.group(1), "name": m.group(2), "verbunden": "Connected: yes" in info, "gekoppelt": "Paired: yes" in info,
                            "audio": icon.startswith("audio") or "Audio Sink" in info or "0000110b" in info.lower()})
        geraete.sort(key=lambda x: (-x["verbunden"], -x["audio"], -x["gekoppelt"], x["name"]))
        aus = ""
        try:
            with open(AUSGANG_DATEI) as f:
                aus = f.read().strip()
        except OSError:
            pass
        return {"ok": c == 0, "geraete": geraete[:20], "ausgang": aus or "zynthian", "install": dict(bt_install), "fehler": "" if c == 0 else t.strip()[:200]}
    if a == "bt_verbinden":
        mac = str(d.get("mac", ""))
        if not re.match(r"^[0-9A-F:]{17}$", mac):
            return {"ok": False, "meldung": "ungültige Adresse"}
        if not os.path.exists("/usr/bin/bluealsa") and not os.path.exists("/usr/bin/bluealsad"):
            if not bt_install["laeuft"]:
                def inst():
                    bt_install.update(laeuft=True, meldung="Bluetooth-Audio wird installiert …")
                    c2, t2 = _lauf(["apt-get", "install", "-y", "-q", "bluez-alsa-utils"], 600)
                    if c2 != 0:
                        _lauf(["apt-get", "update", "-q"], 300)
                        c2, t2 = _lauf(["apt-get", "install", "-y", "-q", "bluez-alsa-utils"], 600)
                    _lauf(["systemctl", "enable", "--now", "bluealsa"], 30)
                    bt_install.update(laeuft=False, meldung="fertig – jetzt noch einmal verbinden" if c2 == 0 else "Installation fehlgeschlagen (Internet?)")
                threading.Thread(target=inst, daemon=True).start()
            return {"ok": False, "meldung": "Bluetooth-Audio wird erst installiert (einmalig, braucht Internet) – gleich noch einmal versuchen"}
        log = []
        for schritt in (["pair", mac], ["trust", mac], ["connect", mac]):
            c, t = _lauf(["bluetoothctl"] + schritt, 25)
            log.append(t.strip().splitlines()[-1] if t.strip() else "")
        _, info = _lauf(["bluetoothctl", "info", mac], 6)
        if "Connected: yes" not in info:
            return {"ok": False, "meldung": "Verbindung klappt nicht: " + " / ".join(x for x in log if x)[:200]}
        with open(AUSGANG_DATEI, "w") as f:
            f.write("bt:" + mac)
        _ton_neu()
        return {"ok": True, "meldung": "verbunden – der Ton läuft jetzt über Bluetooth"}
    if a == "bt_trennen":
        try:
            with open(AUSGANG_DATEI) as f:
                aus = f.read().strip()
        except OSError:
            aus = ""
        if aus.startswith("bt:"):
            _lauf(["bluetoothctl", "disconnect", aus[3:]], 15)
        try:
            os.remove(AUSGANG_DATEI)
        except OSError:
            pass
        _ton_neu()
        return {"ok": True, "meldung": "Ton wieder über die Zynthian-Ausgänge"}
    return {"ok": False, "fehler": "unbekannt"}


# ---------- Audio: Ausgänge (welche Buchsen) und Pegel der Soundkarte ----------
MONO_DATEI = os.path.normpath(os.path.join(ZYN, "..", "..", "mono"))
AUSGAENGE_DATEI = os.path.normpath(os.path.join(ZYN, "..", "..", "ausgaenge"))  # z. B. "1,2 3,4"


def _karte():
    """die Soundkarte des Zynthian (nicht HDMI)"""
    c, t = _lauf(["aplay", "-l"], 5)
    for z in t.splitlines():
        m = re.match(r"card (\d+): (\S+) \[(.*?)\]", z)
        if m and "hdmi" not in z.lower():
            return m.group(1), m.group(3)
    return "0", "?"


def _regler_lesen(karte):
    c, t = _lauf(["amixer", "-c", karte, "scontents"], 8)
    regler, akt = [], None
    for z in t.splitlines():
        m = re.match(r"Simple mixer control '(.*)',(\d+)", z)
        if m:
            akt = {"name": m.group(1), "idx": int(m.group(2)), "caps": "", "p": None, "c": None, "an": None, "aufnahme": None}
            regler.append(akt)
            continue
        if not akt:
            continue
        z = z.strip()
        if z.startswith("Capabilities:"):
            akt["caps"] = z[13:].strip()
        elif ":" in z and "[" in z:
            pct = re.search(r"\[(\d+)%\]", z)
            if " Playback " in " " + z and pct and akt["p"] is None:
                akt["p"] = int(pct.group(1))
            if " Capture " in " " + z and pct and akt["c"] is None:
                akt["c"] = int(pct.group(1))
            if "[on]" in z or "[off]" in z:
                if "Capture" in z:
                    akt["aufnahme"] = "[on]" in z
                else:
                    akt["an"] = "[on]" in z
    return [r for r in regler if r["p"] is not None or r["c"] is not None or r["an"] is not None or r["aufnahme"] is not None]


def ausgaenge_lesen():
    try:
        with open(AUSGAENGE_DATEI) as f:
            paare = f.read().split()
        return [x for x in paare if re.match(r"^\d+,\d+$", x)] or ["1,2"]
    except OSError:
        return ["1,2"]


def ausgaenge_verbinden():
    """verbindet den Ton von Imres (ALSA-JACK-Brücke) mit den gewählten Ausgangsbuchsen"""
    paare = ausgaenge_lesen()
    c, t = _lauf(["jack_lsp"], 5)
    if c != 0:
        return
    alle = t.splitlines()
    quellen = sorted(p for p in alle if re.match(r"alsa-jack\.jackP\.\d+\.\d+:out_00[01]$", p))
    ziele = [p for p in alle if p.startswith("system:playback_")]
    if not quellen:
        return
    _, verb = _lauf(["jack_lsp", "-c"], 5)   # jack_lsp nimmt nur einen Filter – darum alle Verbindungen lesen
    besteht, q = set(), None
    for z in verb.splitlines():
        if not z[:1].isspace():
            q = z.strip()
        elif q in quellen:
            besteht.add((q, z.strip()))
    for qu in quellen:
        kanal = int(qu[-1])  # 0 = links, 1 = rechts
        soll = set("system:playback_%s" % p.split(",")[kanal] for p in paare)
        for ziel in ziele:
            if ziel in soll and (qu, ziel) not in besteht:
                _lauf(["jack_connect", qu, ziel], 5)
            elif ziel not in soll and (qu, ziel) in besteht:
                _lauf(["jack_disconnect", qu, ziel], 5)


def _ausgang_schleife():
    while True:
        try:
            ausgaenge_verbinden()
        except Exception:
            pass
        time.sleep(3)


def audio(d):
    if ARGS.test:
        return {"ok": False, "fehler": "Testmodus"}
    karte, name = _karte()
    a = str(d.get("aktion", "info"))
    if a == "ausgaenge":
        paare = [x for x in (d.get("paare") or []) if re.match(r"^\d+,\d+$", str(x))] or ["1,2"]
        with open(AUSGAENGE_DATEI, "w") as f:
            f.write(" ".join(paare))
        ausgaenge_verbinden()
    elif a == "mono":
        with open(MONO_DATEI, "w") as f:
            f.write("1" if d.get("an") else "0")
        threading.Thread(target=_ton_neu, daemon=True).start()
    elif a == "regler":
        nm = str(d.get("name", ""))[:60]
        art = "capture" if d.get("art") == "c" else "playback"
        if "wert" in d:
            _lauf(["amixer", "-c", karte, "sset", nm, art, "%d%%" % max(0, min(100, int(d.get("wert", 0))))], 5)
        if d.get("schalten"):
            _lauf(["amixer", "-c", karte, "sset", nm, art if art == "capture" else "playback", "toggle"], 5)
        _lauf(["alsactl", "store"], 10)
    c, t = _lauf(["jack_lsp"], 5)
    ports = [p for p in t.splitlines() if p.startswith("system:playback_")]
    eing = [p for p in t.splitlines() if p.startswith("system:capture_")]
    return {"ok": True, "karte": name, "ausgaenge": len(ports), "eingaenge": len(eing), "paare": ausgaenge_lesen(), "regler": _regler_lesen(karte), "mono": _mono_an()}


def _mono_an():
    try:
        with open(MONO_DATEI) as f:
            return f.read().strip() == "1"
    except OSError:
        return False


SICHER_DIR = os.path.normpath(os.path.join(ZYN, "..", "..", "sicherung"))


def sicherung(d):
    """Pult-Einstellungen (Belegung, Favoriten, Sets, Mischungen …) als Datei auf der SD-Karte"""
    os.makedirs(SICHER_DIR, exist_ok=True)
    a = str(d.get("aktion", "liste"))
    if a == "speichern":
        daten = d.get("daten")
        if not isinstance(daten, dict) or not daten:
            return {"ok": False, "fehler": "leer"}
        name = "auto.json" if d.get("auto") else time.strftime("pult-%Y%m%d-%H%M%S.json")
        tmp = os.path.join(SICHER_DIR, name + ".neu")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"zeit": time.time(), "daten": daten}, f, ensure_ascii=False)
        os.replace(tmp, os.path.join(SICHER_DIR, name))
        # von Hand gesicherte: die letzten 12 behalten
        alt = sorted(x for x in os.listdir(SICHER_DIR) if x.startswith("pult-") and x.endswith(".json"))
        for x in alt[:-12]:
            try:
                os.remove(os.path.join(SICHER_DIR, x))
            except OSError:
                pass
        return {"ok": True, "name": name}
    if a == "laden":
        name = os.path.basename(str(d.get("name", "auto.json")))
        try:
            with open(os.path.join(SICHER_DIR, name), encoding="utf-8") as f:
                return {"ok": True, "name": name, **json.load(f)}
        except (OSError, ValueError):
            return {"ok": False, "fehler": "nicht gefunden"}
    liste = []
    for x in sorted(os.listdir(SICHER_DIR), reverse=True):
        if x.endswith(".json"):
            st = os.stat(os.path.join(SICHER_DIR, x))
            liste.append({"name": x, "zeit": st.st_mtime, "kb": round(st.st_size / 1024)})
    return {"ok": True, "liste": liste}


def main():
    if not os.path.isdir(SEITE):
        print("Seite nicht gefunden:", SEITE)
    global takt
    if imres_midi and not ARGS.kein_midi:
        imres_midi.MidiEin(midi_ereignis).start()
        takt = imres_midi.MidiTakt()
        takt.an = OPT.get("takt") == "master"
        takt.start()
        global noten
        try:
            noten = imres_midi.MidiNoten()
            noten.start()
        except Exception as e:
            print("Begleitung nicht verfügbar:", e)
    if not ARGS.test:
        threading.Thread(target=_ausgang_schleife, daemon=True).start()
    srv = ThreadingHTTPServer(("0.0.0.0", ARGS.port), Handler)
    srv.daemon_threads = True
    print("Imres-Brücke auf Port", ARGS.port, "– Seite:", SEITE)
    srv.serve_forever()


if __name__ == "__main__":
    main()
