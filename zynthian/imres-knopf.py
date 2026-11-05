#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Imres-Knopf: ein kleiner Knopf „♫“ in einer Ecke der normalen Zynthian-Oberfläche.
kurz halten (0,8 s) oder doppelt tippen → die Imres-Bühne startet (wie „imres-modus imres“).

Läuft nur, solange die Zynthian-Oberfläche läuft (imres-knopf.service, PartOf=zynthian.service).
Ecke einstellen in /zynthian/zynthian-my-data/imres/einstellungen.sh:
  IMRES_KNOPF=ro   (rechts oben, Standard) · lo · ru · lu · aus
"""
import json
import os
import re
import sys
import time
import urllib.request

EINST = "/zynthian/zynthian-my-data/imres/einstellungen.sh"
BRUECKE = os.environ.get("IMRES_BRUECKE", "http://127.0.0.1:8790")
HALTEN_MS = 800
GROESSE = 60


def einstellung(name, standard):
    try:
        with open(EINST, encoding="utf-8") as f:
            for zeile in f:
                m = re.match(r"\s*(?:export\s+)?" + name + r"=[\"']?([^\"'#\s]*)", zeile)
                if m:
                    return m.group(1)
    except OSError:
        pass
    return os.environ.get(name, standard)


def imres_starten():
    try:
        req = urllib.request.Request(BRUECKE + "/zyn/system", data=json.dumps({"aktion": "imres"}).encode("utf-8"),
                                     headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(req, timeout=3).read()
    except Exception as e:
        print("Brücke nicht erreichbar:", e)
        os.system("setsid /usr/local/bin/imres-modus imres >/dev/null 2>&1 &")


def main():
    ecke = einstellung("IMRES_KNOPF", "ro").lower()
    if ecke in ("aus", "off", "0", "nein"):
        print("Imres-Knopf ist ausgeschaltet (IMRES_KNOPF=aus)")
        while True:
            time.sleep(3600)
    import tkinter as tk
    # warten, bis die Zynthian-Oberfläche (X) da ist
    root = None
    for _ in range(120):
        try:
            root = tk.Tk()
            break
        except Exception:
            time.sleep(1)
    if root is None:
        sys.exit(1)
    root.overrideredirect(True)
    try:
        root.attributes("-topmost", True)
    except Exception:
        pass
    sw, sh = root.winfo_screenwidth(), root.winfo_screenheight()
    x = 0 if ecke.startswith("l") else sw - GROESSE
    y = sh - GROESSE if ecke.endswith("u") else 0
    root.geometry("%dx%d+%d+%d" % (GROESSE, GROESSE, x, y))
    print("Imres-Knopf bereit: Ecke %s, Bildschirm %dx%d, Position %d,%d" % (ecke, sw, sh, x, y), flush=True)
    root.configure(bg="#120e18")
    c = tk.Canvas(root, width=GROESSE, height=GROESSE, bg="#120e18", highlightthickness=0, bd=0)
    c.pack()
    rand = c.create_rectangle(1, 1, GROESSE - 2, GROESSE - 2, outline="#e0a046", width=2)
    fuell = c.create_rectangle(2, GROESSE - 2, GROESSE - 2, GROESSE - 2, outline="", fill="#7a5418")
    c.create_text(GROESSE // 2, GROESSE // 2 - 1, text="♫", font=("DejaVu Sans", 28, "bold"), fill="#e0a046")
    zustand = {"seit": None, "ausgeloest": False, "letzter_tipp": 0}

    def ausloesen(wie):
        if zustand["ausgeloest"]:
            return
        zustand["ausgeloest"] = True
        print("Imres-Knopf ausgelöst (%s)" % wie, flush=True)
        c.itemconfigure(rand, outline="#50ff70")
        c.coords(fuell, 2, 2, GROESSE - 2, GROESSE - 2)
        root.update_idletasks()
        imres_starten()

    def ticken():
        if zustand["seit"] is not None and not zustand["ausgeloest"]:
            anteil = min(1.0, (time.monotonic() - zustand["seit"]) * 1000 / HALTEN_MS)
            c.coords(fuell, 2, GROESSE - 2 - (GROESSE - 4) * anteil, GROESSE - 2, GROESSE - 2)
            if anteil >= 1.0:
                ausloesen("gehalten")
        root.after(40, ticken)

    def druck(_e):
        jetzt = time.monotonic()
        print("Imres-Knopf berührt", flush=True)
        c.itemconfigure(rand, outline="#fff0c0")
        if jetzt - zustand["letzter_tipp"] < 0.6:   # Doppeltipp geht auch
            ausloesen("Doppeltipp")
            return
        zustand["letzter_tipp"] = jetzt
        zustand["seit"] = jetzt

    def los(_e):
        zustand["seit"] = None
        if not zustand["ausgeloest"]:
            c.coords(fuell, 2, GROESSE - 2, GROESSE - 2, GROESSE - 2)
            c.itemconfigure(rand, outline="#e0a046")

    def obenhalten():
        try:
            root.lift()
            root.attributes("-topmost", True)
        except Exception:
            pass
        root.after(1500, obenhalten)

    for w in (c, root):
        w.bind("<ButtonPress-1>", druck)
        w.bind("<ButtonRelease-1>", los)
    ticken()
    obenhalten()
    root.mainloop()


if __name__ == "__main__":
    main()
