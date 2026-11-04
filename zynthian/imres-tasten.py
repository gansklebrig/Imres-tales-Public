#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Imres-Tasten: liest im Imres-Modus die 20 Tasten, die 4 Drehregler (mit Druck) und angeschlossenes MIDI
und schickt alles an die Imres-Brücke. Setzt außerdem die RGB-LEDs der Tasten so, wie die Seite es wünscht.

Läuft nur, solange der Imres-Modus aktiv ist (wird von kiosk.sh gestartet) – im Zynthian-Modus gehören
Tasten und LEDs wieder der Zynthian-Oberfläche.

Zynthian V5 / V5.1: Tasten-Nummern wie in zynthian_envars (CUSTOM_SWITCH_01 … 20), Drehregler 0 … 3.
"""
import ctypes
import json
import os
import re
import subprocess
import sys
import threading
import time
import urllib.request

BRUECKE = os.environ.get("IMRES_BRUECKE", "http://127.0.0.1:8790")
LIB = os.environ.get("ZYNCORE_LIB", "/zynthian/zyncoder/build/libzyncore.so")

# Tasten des V5 (CUSTOM_SWITCH_nn → Index nn+3) und die LED-Nummer derselben Taste
TASTEN = {1: "MENU", 2: "MIXER", 3: "CTRL", 4: "ZS3", 5: "ALT", 6: "TEMPO", 7: "PAD", 8: "F1", 9: "REC", 10: "STOP",
          11: "PLAY", 12: "F2", 13: "BACK", 14: "UP", 15: "SEL", 16: "F3", 17: "LEFT", 18: "DOWN", 19: "RIGHT", 20: "F4",
          21: "DREH1", 22: "DREH2", 23: "DREH3", 24: "DREH4"}
LED_NR = {"MENU": 0, "MIXER": 1, "CTRL": 2, "ZS3": 3, "F1": 4, "PAD": 5, "TEMPO": 6, "ALT": 7, "REC": 8, "STOP": 9,
          "PLAY": 10, "F2": 11, "F3": 12, "SEL": 13, "UP": 14, "BACK": 15, "LEFT": 16, "DOWN": 17, "RIGHT": 18, "F4": 19}
LANG_MS = int(os.environ.get("ZYNTHIAN_UI_SWITCH_LONG_MS", "2000") or 2000)
MITTEL_MS = int(os.environ.get("ZYNTHIAN_UI_SWITCH_BOLD_MS", "300") or 300)


def schicken(ereignis):
    try:
        req = urllib.request.Request(BRUECKE + "/zyn/hw", data=json.dumps(ereignis).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(req, timeout=1).read()
    except Exception:
        pass


# ---------------------------------------------------------------------------------------------------------
# Tasten und Drehregler über die zyncore-Bibliothek des Zynthian
# ---------------------------------------------------------------------------------------------------------
def hardware():
    try:
        lib = ctypes.cdll.LoadLibrary(LIB)
    except OSError as e:
        print("zyncore nicht gefunden – keine Tasten:", e)
        return
    lib.get_zynswitch.restype = ctypes.c_int
    lib.get_value_zynpot.restype = ctypes.c_int32
    if not lib.init_zyncontrol():
        print("zyncontrol ließ sich nicht starten")
        return
    try:
        npots = lib.get_num_zynpots()
    except Exception:
        npots = 4
    for i in range(npots):
        try:
            lib.setup_behaviour_zynpot(i, 0)
        except Exception:
            pass
    letzter = 27
    try:
        letzter = lib.get_last_zynswitch_index()
    except Exception:
        pass
    gedrueckt = {}
    lang_gemeldet = set()
    print("Tasten bereit:", letzter + 1, "Schalter,", npots, "Drehregler")
    while True:
        jetzt = time.monotonic()
        for idx in range(4, letzter + 1):
            name = TASTEN.get(idx - 3)
            if not name:
                continue
            d = lib.get_zynswitch(idx, 20 * 1000000)
            if d == 0:
                gedrueckt[idx] = jetzt
                schicken({"typ": "taste", "name": name, "art": "druck"})
            elif d > 0:
                ms = d / 1000
                gedrueckt.pop(idx, None)
                if idx in lang_gemeldet:
                    lang_gemeldet.discard(idx)
                    schicken({"typ": "taste", "name": name, "art": "los"})
                else:
                    schicken({"typ": "taste", "name": name, "art": "lang" if ms >= LANG_MS else "mittel" if ms >= MITTEL_MS else "kurz"})
                    schicken({"typ": "taste", "name": name, "art": "los"})
            # lange gehalten: schon während des Haltens melden
            t0 = gedrueckt.get(idx)
            if t0 is not None and idx not in lang_gemeldet and (jetzt - t0) * 1000 >= LANG_MS:
                lang_gemeldet.add(idx)
                schicken({"typ": "taste", "name": name, "art": "lang"})
        for i in range(npots):
            v = lib.get_value_zynpot(i)
            if v:
                schicken({"typ": "dreh", "nr": i, "d": int(v)})
        time.sleep(0.01)


# ---------------------------------------------------------------------------------------------------------
# LEDs (wie die Zynthian-Oberfläche: 20 WS2812 an SPI)
# ---------------------------------------------------------------------------------------------------------
def leds():
    try:
        import board
        import neopixel_spi as neopixel
        pix = neopixel.NeoPixel_SPI(board.SPI(), 20, pixel_order=neopixel.GRB, auto_write=False, frequency=6400000)
    except Exception as e:
        print("LEDs nicht verfügbar:", e)
        return
    nr = -1
    hell = float(os.environ.get("IMRES_LED_HELL", "0.6"))
    while True:
        try:
            with urllib.request.urlopen(BRUECKE + "/zyn/leds?seit=" + str(nr), timeout=5) as r:
                d = json.loads(r.read().decode("utf-8"))
            nr = d.get("nr", nr)
            for name, i in LED_NR.items():
                f = str(d.get("farben", {}).get(name, "#000000"))
                m = re.fullmatch(r"#?([0-9a-fA-F]{6})", f)
                v = int(m.group(1), 16) if m else 0
                r_, g_, b_ = (v >> 16) & 255, (v >> 8) & 255, v & 255
                pix[i] = (int(r_ * hell), int(g_ * hell), int(b_ * hell))
            pix.show()
        except Exception:
            time.sleep(1)


# ---------------------------------------------------------------------------------------------------------
# MIDI: alle Eingänge mit aseqdump mithören – Takt (Clock), Start/Stop, Noten und Regler
# ---------------------------------------------------------------------------------------------------------
def midi_ports():
    try:
        r = subprocess.run(["aseqdump", "-l"], capture_output=True, text=True, timeout=5)
    except Exception:
        return []
    ports = []
    for zeile in r.stdout.splitlines()[1:]:
        m = re.match(r"\s*(\d+):(\d+)\s+(.*?)\s{2,}(.*)$", zeile)
        if not m:
            continue
        client, port, cname, pname = int(m.group(1)), int(m.group(2)), m.group(3), m.group(4)
        if client in (0, 14) or re.search(r"through|imres|zynmidi|zynthian|jack|pipewire|a2j", cname + " " + pname, re.I):
            continue
        ports.append("%d:%d" % (client, port))
    return ports


def midi():
    try:
        subprocess.run(["aseqdump", "-l"], capture_output=True, timeout=5)
    except Exception:
        print("aseqdump fehlt – kein MIDI")
        return
    while True:
        ports = midi_ports()
        if not ports:
            time.sleep(5)
            continue
        print("MIDI-Eingänge:", ", ".join(ports))
        try:
            p = subprocess.Popen(["aseqdump", "-p", ",".join(ports)], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)
        except Exception:
            time.sleep(5)
            continue
        takte = []
        letzte_bpm = 0
        letzte_meldung = 0
        letzte_sendung = 0
        start = time.monotonic()
        for zeile in p.stdout:
            z = zeile.strip()
            if " Clock" in z or z.endswith("Clock"):
                t = time.monotonic()
                takte.append(t)
                if len(takte) > 97:
                    takte.pop(0)
                if len(takte) >= 25 and t - letzte_meldung > 0.5:
                    dauer = (takte[-1] - takte[0]) / (len(takte) - 1)
                    if dauer > 0:
                        bpm = 60 / (dauer * 24)
                        # bei Änderung sofort, sonst alle 2 s zur Erinnerung (falls die Bühne das Tempo selbst verstellt hat)
                        if 30 <= bpm <= 300 and (abs(bpm - letzte_bpm) >= 0.5 or t - letzte_sendung > 2):
                            letzte_bpm = bpm
                            letzte_sendung = t
                            schicken({"typ": "midi", "art": "tempo", "bpm": round(bpm, 1)})
                    letzte_meldung = t
                continue
            if " Start" in z or " Continue" in z:
                takte.clear()
                schicken({"typ": "midi", "art": "start"})
            elif " Stop" in z:
                takte.clear()
                schicken({"typ": "midi", "art": "stop"})
            else:
                m = re.search(r"Note on\s+(\d+), note (\d+), velocity (\d+)", z)
                if m and int(m.group(3)) > 0:
                    schicken({"typ": "midi", "art": "note", "kanal": int(m.group(1)), "note": int(m.group(2)), "wert": int(m.group(3))})
                    continue
                m = re.search(r"Control change\s+(\d+), controller (\d+), value (\d+)", z)
                if m:
                    schicken({"typ": "midi", "art": "cc", "kanal": int(m.group(1)), "cc": int(m.group(2)), "wert": int(m.group(3))})
                    continue
                m = re.search(r"Program change\s+(\d+), program (\d+)", z)
                if m:
                    schicken({"typ": "midi", "art": "programm", "kanal": int(m.group(1)), "programm": int(m.group(2))})
            # neue Geräte: nach einer Weile die Liste erneut prüfen
            if time.monotonic() - start > 30 and set(midi_ports()) != set(ports):
                p.kill()
                break
        time.sleep(1)


if __name__ == "__main__":
    teile = [threading.Thread(target=f, daemon=True) for f in (hardware, leds, midi)]
    for t in teile:
        t.start()
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        sys.exit(0)
