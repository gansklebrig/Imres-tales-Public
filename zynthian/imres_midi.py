# -*- coding: utf-8 -*-
"""
MIDI für die Imres-Brücke
* MidiEin: hört alle MIDI-Eingänge über aseqdump mit (Clock, Start/Stop, Noten, Regler, Programmwechsel)
* MidiTakt: sendet als Master Clock/Start/Stop über den ALSA-Sequencer (eigener Port „Imres Takt“)
Beides geht über den ALSA-Sequencer und stört den Zynthian nicht.
"""
import ctypes
import re
import subprocess
import threading
import time

AUSSCHLUSS = re.compile(r"through|imres|midi through|pipewire|a2j|jack|zynmidi|zynthian|zynseq|zynsmf|ttymidi|ctrlr", re.I)


def ports(richtung):
    """richtung 'i' = Geräte, von denen wir lesen (aseqdump -l), 'o' = Geräte, an die wir senden (aconnect -o)"""
    try:
        if richtung == "i":
            r = subprocess.run(["aseqdump", "-l"], capture_output=True, text=True, timeout=5)
            erg = []
            for zeile in r.stdout.splitlines()[1:]:
                m = re.match(r"\s*(\d+):(\d+)\s+(.*?)\s{2,}(.*)$", zeile)
                if not m:
                    continue
                c = int(m.group(1))
                if c in (0, 14) or AUSSCHLUSS.search(m.group(3) + " " + m.group(4)):
                    continue
                erg.append("%d:%s" % (c, m.group(2)))
            return erg
        r = subprocess.run(["aconnect", "-o"], capture_output=True, text=True, timeout=5)
        erg, client, cname = [], None, ""
        for zeile in r.stdout.splitlines():
            m = re.match(r"client (\d+): '([^']*)'", zeile)
            if m:
                client, cname = int(m.group(1)), m.group(2)
                continue
            m = re.match(r"\s+(\d+) '([^']*)'", zeile)
            if m and client is not None and client not in (0, 14) and not AUSSCHLUSS.search(cname + " " + m.group(2)):
                erg.append("%d:%s" % (client, m.group(1)))
        return erg
    except Exception:
        return []


class MidiEin(threading.Thread):
    """ruft melden(ereignis) für jedes Ereignis auf"""

    def __init__(self, melden):
        super().__init__(daemon=True)
        self.melden = melden

    def run(self):
        try:
            subprocess.run(["aseqdump", "-l"], capture_output=True, timeout=5)
        except Exception:
            print("aseqdump fehlt – kein MIDI-Eingang")
            return
        while True:
            p = ports("i")
            if not p:
                time.sleep(5)
                continue
            print("MIDI-Eingänge:", ", ".join(p))
            try:
                befehl = ["aseqdump", "-p", ",".join(p)]
                try:
                    subprocess.run(["stdbuf", "--version"], capture_output=True, timeout=2)
                    befehl = ["stdbuf", "-oL"] + befehl
                except Exception:
                    pass
                proc = subprocess.Popen(befehl, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
            except Exception:
                time.sleep(5)
                continue
            self.lesen(proc, p)
            time.sleep(1)

    def lesen(self, proc, p):
        takte, letzte_bpm, letzte_sendung, uhr, laeuft = [], 0.0, 0.0, 0, False
        start = time.monotonic()
        for zeile in proc.stdout:
            z = zeile.strip()
            if z.endswith("Clock") or " Clock " in z:
                t = time.monotonic()
                takte.append(t)
                if len(takte) > 97:
                    takte.pop(0)
                uhr += 1
                # jedes Viertel (24 Clocks) ein Schlag – für das Einrasten von Band und Kulisse
                if uhr % 24 == 0:
                    bpm = 0.0
                    if len(takte) >= 25:
                        d = (takte[-1] - takte[0]) / (len(takte) - 1)
                        bpm = 60 / (d * 24) if d > 0 else 0.0
                    self.melden({"typ": "midi", "art": "puls", "n": uhr // 24 if laeuft else None, "bpm": round(bpm, 2)})
                    # Tempo: bei Änderung sofort, sonst alle 2 s zur Erinnerung
                    if 30 <= bpm <= 300 and (abs(bpm - letzte_bpm) >= 0.5 or t - letzte_sendung > 2):
                        letzte_bpm, letzte_sendung = bpm, t
                        self.melden({"typ": "midi", "art": "tempo", "bpm": round(bpm, 1)})
            elif " Start" in z:
                uhr, laeuft = -1, True   # die erste Clock nach Start ist Schlag 0
                takte.clear()
                self.melden({"typ": "midi", "art": "start"})
            elif " Continue" in z:
                laeuft = True
                self.melden({"typ": "midi", "art": "weiter"})
            elif " Stop" in z:
                laeuft = False
                self.melden({"typ": "midi", "art": "stop"})
            elif "Song position" in z:
                m = re.search(r"value (\d+)", z)
                if m:
                    uhr = int(m.group(1)) * 6 - 1
            else:
                m = re.search(r"Note on\s+(\d+), note (\d+), velocity (\d+)", z)
                if m and int(m.group(3)) > 0:
                    self.melden({"typ": "midi", "art": "note", "kanal": int(m.group(1)) + 1, "note": int(m.group(2)), "wert": int(m.group(3))})
                else:
                    m = re.search(r"Control change\s+(\d+), controller (\d+), value (\d+)", z)
                    if m:
                        self.melden({"typ": "midi", "art": "cc", "kanal": int(m.group(1)) + 1, "cc": int(m.group(2)), "wert": int(m.group(3))})
                    else:
                        m = re.search(r"Program change\s+(\d+), program (\d+)", z)
                        if m:
                            self.melden({"typ": "midi", "art": "programm", "kanal": int(m.group(1)) + 1, "programm": int(m.group(2))})
            # neue Geräte: die Liste ab und zu erneut prüfen
            if time.monotonic() - start > 20:
                start = time.monotonic()
                if set(ports("i")) != set(p):
                    proc.kill()
                    break


# ---------------------------------------------------------------------------------------------------------
# Master: Clock senden über den ALSA-Sequencer (libasound, per ctypes)
# ---------------------------------------------------------------------------------------------------------
class _Ereignis(ctypes.Structure):
    # snd_seq_event_t (28 Byte)
    _fields_ = [("type", ctypes.c_ubyte), ("flags", ctypes.c_ubyte), ("tag", ctypes.c_ubyte), ("queue", ctypes.c_ubyte),
                ("tick", ctypes.c_uint), ("nsec", ctypes.c_uint),
                ("src_client", ctypes.c_ubyte), ("src_port", ctypes.c_ubyte), ("dst_client", ctypes.c_ubyte), ("dst_port", ctypes.c_ubyte),
                ("data", ctypes.c_ubyte * 12)]


CLOCK, START, WEITER, STOP = 36, 30, 31, 32


class MidiTakt(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.an = False          # Master eingeschaltet
        self.laeuft = False
        self.bpm = 120.0
        self.naechster = 0.0     # Zeit des nächsten Clock-Ticks
        self.tick = 0
        self.start_bei = None    # Start ausstehend: zu dieser Zeit Start + erster Tick
        self.lock = threading.Lock()
        self.seq = None
        self.port = 0
        self.verbunden = set()
        self.zuletzt_verbunden = 0
        try:
            self.lib = ctypes.CDLL("libasound.so.2")
            seq = ctypes.c_void_p()
            if self.lib.snd_seq_open(ctypes.byref(seq), b"default", 1, 0) < 0:
                raise OSError("snd_seq_open")
            self.seq = seq
            self.lib.snd_seq_set_client_name(self.seq, b"Imres Takt")
            self.port = self.lib.snd_seq_create_simple_port(self.seq, b"Takt", 1 | 32, 2 | (1 << 20))
            self.client = self.lib.snd_seq_client_id(self.seq)
        except Exception as e:
            print("MIDI-Ausgang nicht verfügbar:", e)
            self.seq = None

    def senden(self, art):
        if not self.seq:
            return
        e = _Ereignis()
        e.type, e.flags, e.queue = art, 0, 253          # SND_SEQ_QUEUE_DIRECT
        e.src_port, e.dst_client, e.dst_port = self.port, 254, 253   # an alle Abonnenten
        try:
            self.lib.snd_seq_event_output_direct(self.seq, ctypes.byref(e))
        except Exception:
            pass

    def verbinden(self):
        """den eigenen Port mit allen MIDI-Ausgängen (Geräten) verbinden"""
        if not self.seq or time.monotonic() - self.zuletzt_verbunden < 8:
            return
        self.zuletzt_verbunden = time.monotonic()
        for ziel in ports("o"):
            if ziel in self.verbunden:
                continue
            try:
                r = subprocess.run(["aconnect", "%d:%d" % (self.client, self.port), ziel], capture_output=True, timeout=3)
                if r.returncode == 0 or b"already" in r.stderr:
                    self.verbunden.add(ziel)
            except Exception:
                pass

    def abgleich(self, bpm, laeuft, bis_schlag_ms, versatz_ms=0):
        """von der Seite: Tempo, ob die Musik läuft, und wann der nächste Schlag zu hören ist"""
        with self.lock:
            if bpm and 20 <= bpm <= 300:
                self.bpm = float(bpm)
            jetzt = time.monotonic()
            if not self.an:
                self.laeuft = False
                return
            if laeuft and not self.laeuft and bis_schlag_ms is not None:
                # Start: Start-Befehl und erster Tick genau auf dem ersten Schlag
                self.start_bei = jetzt + max(0.0, (bis_schlag_ms - versatz_ms) / 1000)
                self.naechster = self.start_bei
                self.tick = 0
                self.laeuft = True
                return
            if not laeuft and self.laeuft:
                self.laeuft = False
                self.start_bei = None
                self.senden(STOP)
                return
            if laeuft and bis_schlag_ms is not None and self.start_bei is None:
                per = 60 / self.bpm / 24
                soll = jetzt + (bis_schlag_ms - versatz_ms) / 1000
                r = (24 - self.tick % 24) % 24
                unser = self.naechster + r * per
                fehler = soll - unser
                viertel = per * 24
                fehler = (fehler + viertel / 2) % viertel - viertel / 2
                self.naechster += fehler if abs(fehler) > 0.06 else fehler * 0.3

    def run(self):
        while True:
            with self.lock:
                aktiv = self.an and self.laeuft
                ziel = self.naechster
            if not aktiv or not self.seq:
                time.sleep(0.01)
                continue
            self.verbinden()
            warte = ziel - time.monotonic()
            if warte > 0.002:
                time.sleep(min(warte - 0.0015, 0.01))
                continue
            while time.monotonic() < ziel:
                pass
            with self.lock:
                if self.start_bei is not None:
                    self.senden(START)
                    self.start_bei = None
                self.senden(CLOCK)
                self.tick += 1
                self.naechster += 60 / self.bpm / 24
                # weit hinterher (z. B. nach einer Pause): nicht nachholen
                if time.monotonic() - self.naechster > 0.2:
                    self.naechster = time.monotonic()


# ---------------------------------------------------------------------------------------------------------
# Begleitung: Noten an Synths (Zynthian-Ketten über JACK, externe Geräte über ALSA)
# ---------------------------------------------------------------------------------------------------------
NOTE_AN, NOTE_AUS, REGLER, PROGRAMM = 6, 7, 10, 11


class MidiNoten(threading.Thread):
    """nimmt Noten mit Verzögerung entgegen und spielt sie pünktlich über einen eigenen ALSA-Port „Imres Begleitung“"""

    def __init__(self):
        super().__init__(daemon=True)
        import heapq
        self.heapq = heapq
        self.plan = []
        self.nr = 0
        self.lock = threading.Condition()
        self.seq = None
        self.verbunden = set()
        self.zuletzt = 0
        self.aktiv_bis = 0
        try:
            self.lib = ctypes.CDLL("libasound.so.2")
            seq = ctypes.c_void_p()
            if self.lib.snd_seq_open(ctypes.byref(seq), b"default", 1, 0) < 0:
                raise OSError("snd_seq_open")
            self.seq = seq
            self.lib.snd_seq_set_client_name(self.seq, b"Imres Begleitung")
            self.port = self.lib.snd_seq_create_simple_port(self.seq, b"Begleitung", 1 | 32, 2 | (1 << 20))
            self.client = self.lib.snd_seq_client_id(self.seq)
        except Exception as e:
            print("Begleitung: MIDI-Ausgang nicht verfügbar:", e, flush=True)
            self.seq = None

    def senden(self, typ, kanal, a, b=0):
        if not self.seq:
            return
        e = _Ereignis()
        e.type, e.flags, e.queue = typ, 0, 253
        e.src_port, e.dst_client, e.dst_port = self.port, 254, 253
        k = max(0, min(15, int(kanal)))
        if typ in (NOTE_AN, NOTE_AUS):
            e.data[0], e.data[1], e.data[2] = k, max(0, min(127, int(a))), max(0, min(127, int(b)))
        else:  # snd_seq_ev_ctrl: channel, unused[3], param (uint), value (int)
            e.data[0] = k
            ctypes.memmove(ctypes.addressof(e.data) + 4, ctypes.byref(ctypes.c_uint(int(a))), 4)
            ctypes.memmove(ctypes.addressof(e.data) + 8, ctypes.byref(ctypes.c_int(int(b))), 4)
        try:
            self.lib.snd_seq_event_output_direct(self.seq, ctypes.byref(e))
        except Exception:
            pass

    def planen(self, liste):
        """liste: [{"k": Kanal 0–15, "n": Note, "v": Stärke (0 = aus), "in": ms ab jetzt, "cc"/"pc": optional}]"""
        jetzt = time.monotonic()
        with self.lock:
            for x in liste[:256]:
                try:
                    t = jetzt + max(0.0, min(5000.0, float(x.get("in", 0)))) / 1000
                    self.nr += 1
                    self.heapq.heappush(self.plan, (t, self.nr, x))
                except (TypeError, ValueError):
                    pass
            self.aktiv_bis = jetzt + 30
            self.lock.notify()

    def alle_aus(self):
        with self.lock:
            self.plan = []
        for k in range(16):
            self.senden(REGLER, k, 123, 0)

    def verbinden(self):
        """mit externen MIDI-Geräten (ALSA) und – wenn vorhanden – dem MIDI-Eingang des Zynthian (JACK) verbinden"""
        if not self.seq or time.monotonic() - self.zuletzt < 8:
            return
        self.zuletzt = time.monotonic()
        for ziel in ports("o"):
            if ziel in self.verbunden:
                continue
            try:
                r = subprocess.run(["aconnect", "%d:%d" % (self.client, self.port), ziel], capture_output=True, timeout=3)
                if r.returncode == 0 or b"already" in r.stderr:
                    self.verbunden.add(ziel)
            except Exception:
                pass
        try:
            r = subprocess.run(["jack_lsp", "-t"], capture_output=True, text=True, timeout=3)
            zeilen = r.stdout.splitlines()
            alle = [zeilen[i].strip() for i in range(len(zeilen)) if i + 1 < len(zeilen) and "midi" in zeilen[i + 1]]
            quelle = next((p for p in alle if "Imres Begleitung" in p and "capture" in p), None)
            if quelle:
                ziele = [p for p in alle if p.startswith("ZynMidiRouter:") and p.endswith("_in") and "dev" not in p]
                bevorzugt = [p for p in ("ZynMidiRouter:main_in", "ZynMidiRouter:net_in", "ZynMidiRouter:seq_in") if p in ziele]
                for ziel in (bevorzugt[:1] or ziele[:1]):
                    if ("jack", ziel) not in self.verbunden:
                        subprocess.run(["jack_connect", quelle, ziel], capture_output=True, timeout=3)
                        self.verbunden.add(("jack", ziel))
        except Exception:
            pass

    def run(self):
        while True:
            with self.lock:
                if not self.plan:
                    self.lock.wait(timeout=1)
                    naechst = None
                else:
                    naechst = self.plan[0][0]
            if time.monotonic() < self.aktiv_bis:
                self.verbinden()
            if naechst is None:
                continue
            warte = naechst - time.monotonic()
            if warte > 0.002:
                time.sleep(min(warte - 0.001, 0.01))
                continue
            with self.lock:
                if not self.plan or self.plan[0][0] > time.monotonic() + 0.002:
                    continue
                _, _, x = self.heapq.heappop(self.plan)
            k = x.get("k", 0)
            if "pc" in x:
                self.senden(PROGRAMM, k, 0, x["pc"])
            elif "cc" in x:
                self.senden(REGLER, k, x["cc"], x.get("w", 0))
            elif x.get("v", 0) > 0:
                self.senden(NOTE_AN, k, x.get("n", 60), x["v"])
            else:
                self.senden(NOTE_AUS, k, x.get("n", 60), 0)
