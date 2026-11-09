#!/usr/bin/env python3
"""Hörbuch zusammensetzen: aus den Einzelaufnahmen je Website-Absatz eine Datei mit gesetzten Pausen.

  python3 tools/hoerbuch/montage.py [KAPITEL …]      # Standard: vorab I

Je Block:
  * jede Aufnahme an Anfang/Ende von Stille befreit (Lachen am Ende bleibt, geschnitten wird nur echte Stille)
  * Erzähler: Satzenden bekommen mindestens SATZ Sekunden Pause (Whisper-Wortzeiten aus qa-de.json)
  * zwischen den Segmenten genau die Pause aus der Regie (p), bei recycelten Teilen TEIL Sekunden
Ergebnis: audio/chronik/de/<kap>/<NNN>-<hash>.mp3 und audio/chronik/de/manifest.json (für den Vorlese-Player).
Überschriften kommen aus den bisherigen Aufnahmen (gleicher Titel = gleiche Datei).
"""
import hashlib, json, os, re, subprocess, sys
import numpy as np
WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(WURZEL, "tools/hoerbuch"))
import aufnahme as A
SR = 44100
SATZ, ABSATZ_MIN, TEIL = .45, .0, .5
STILLE_DB = -48

def J(p, std=None):
    p = os.path.join(WURZEL, p)
    return json.load(open(p)) if os.path.exists(p) else std

def lade(f):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", os.path.join(WURZEL, f), "-ac", "1", "-ar", str(SR), "-f", "f32le", "pipe:1"])
    return np.frombuffer(raw, dtype=np.float32).copy()

def schneide_stille(x):
    """Anfang/Ende bis zur ersten Stelle über der Schwelle (10 ms Fenster), mit kleinem Polster."""
    w = int(.01 * SR); n = len(x) // w
    if n == 0: return x, 0
    e = np.sqrt(np.mean(x[:n * w].reshape(n, w) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(e)
    laut = np.where(db > STILLE_DB)[0]
    if len(laut) == 0: return x, 0
    a = max(0, laut[0] * w - int(.03 * SR)); b = min(len(x), (laut[-1] + 1) * w + int(.12 * SR))
    y = x[a:b].copy()
    f = int(.008 * SR); y[:f] *= np.linspace(0, 1, f); y[-int(.03 * SR):] *= np.linspace(1, 0, int(.03 * SR))
    return y, a / SR

def satzpausen(x, woerter, versatz):
    """Nach Wörtern mit Satzende-Zeichen die Pause bis SATZ verlängern (Einfügen in der Stille nach dem Wort).
    Gibt (audio, [(zeitpunkt_im_original, eingefügte_sekunden), …]) zurück."""
    ein = []
    if not woerter: return x, ein
    teile, pos = [], 0
    for k in range(len(woerter) - 1):
        w, a, b = woerter[k]
        if not re.search(r"[.!?…]$", w): continue
        naechst = woerter[k + 1][1]
        luecke = naechst - b
        if luecke >= SATZ or luecke < 0: continue
        schnitt = int((b - versatz + min(.05, luecke / 2)) * SR)
        if schnitt <= pos or schnitt >= len(x): continue
        teile.append(x[pos:schnitt]); teile.append(np.zeros(int((SATZ - luecke) * SR), np.float32)); pos = schnitt
        ein.append((schnitt / SR, SATZ - luecke))
    teile.append(x[pos:])
    return np.concatenate(teile), ein

def stille(s): return np.zeros(int(max(0, s) * SR), np.float32)

def block_audio(b, regie, rec, qa, bes):
    E = {e["uid"]: e for e in A.einheiten_alle}
    stuecke, marken, t = [], [], 0.0
    def an(y):
        nonlocal t
        stuecke.append(y); t += len(y) / SR
    for k, s in enumerate(b["segmente"]):
        p = float((regie.get(s["id"]) or {}).get("p", 0) or 0)
        if k == 0: p = max(p, ABSATZ_MIN)
        an(stille(p if k else min(p, 2.5)))
        teile = rec.get(s["id"]) or [{"neu": None}]
        for j, teil in enumerate(teile):
            if j: an(stille(TEIL))
            if teil.get("alt"):
                f = teil["alt"]
            else:
                uid = s["id"] if teil.get("neu") is None else f"{s['id']}-n{teil['neu']}"
                f = A.datei(E[uid], bes)
            x = lade(f); x, versatz = schneide_stille(x)
            ws = (qa.get(f) or {}).get("woerter") or []
            ein = []
            if s["rolle"] == "erzaehler": x, ein = satzpausen(x, ws, versatz)
            for w, a, b2 in ws:
                d = sum(e for z, e in ein if z <= a - versatz)
                marken.append([w, round(t + a - versatz + d, 3), round(t + b2 - versatz + d, 3)])
            an(x)
    return np.concatenate(stuecke), marken

def schreibe(x, ziel):
    os.makedirs(os.path.dirname(os.path.join(WURZEL, ziel)), exist_ok=True)
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                    "-c:a", "libmp3lame", "-b:a", "128k", os.path.join(WURZEL, ziel)], input=pcm, check=True)

def main():
    kapitel = sys.argv[1:] or ["vorab", "I"]
    st, regie, rec, qa, bes = J("tools/hoerbuch/struktur-de.json"), J("tools/hoerbuch/regie-de.json"), J("tools/hoerbuch/recycling-de.json", {}), J("tools/hoerbuch/qa-de.json", {}), J("tools/hoerbuch/besetzung.json")
    A.einheiten_alle, fehler, _ = A.einheiten(["vorab", "I", "II"])
    alt = J("audio/chronik/de/manifest.json")
    altregie = J("tools/vertonung/regie-de.json")
    titel_alt = J("tools/hoerbuch/titel-de.json")   # Überschriften: bisherige Aufnahmen
    neu = {"sprache": "de", "stimme": bes["rollen"]["erzaehler"][0], "modell": bes["modell"], "kapitel": dict(alt["kapitel"])}
    zeitmarken = J("tools/vertonung/zeitmarken-de.json", {})
    for kap in kapitel:
        liste = []
        bloecke = st[kap]
        for i, b in enumerate(bloecke):
            if b.get("typ") == "titel":
                t = b["text"][3:].strip()
                if t in titel_alt: liste.append({"i": i, "datei": titel_alt[t], "titel": True})
                else: print("Titel ohne Aufnahme:", t)
                continue
            if b.get("typ") == "bild": continue
            try:
                x, mk = block_audio(b, regie, rec, qa, bes)
            except (FileNotFoundError, subprocess.CalledProcessError, KeyError) as e:
                print("fehlt:", kap, i, e); continue
            h = hashlib.sha1(x.tobytes()).hexdigest()[:10]
            ziel = f"audio/chronik/de/{kap}/{i:03d}-{h}.mp3"
            if not os.path.exists(os.path.join(WURZEL, ziel)): schreibe(x, ziel)
            liste.append({"i": i, "datei": ziel, "titel": False}); zeitmarken[ziel] = mk
        neu["kapitel"][kap] = liste
        # nicht mehr benutzte Dateien des Kapitels entfernen
        genutzt = {e["datei"] for e in liste}
        d = os.path.join(WURZEL, "audio/chronik/de", kap)
        for f in os.listdir(d):
            if f.endswith(".mp3") and f"audio/chronik/de/{kap}/{f}" not in genutzt: os.remove(os.path.join(d, f))
        print(kap, len(liste), "Dateien")
    json.dump(neu, open(os.path.join(WURZEL, "audio/chronik/de/manifest.json"), "w"), ensure_ascii=False, indent=0)
    alle = {e["datei"] for l in neu["kapitel"].values() for e in l}
    json.dump({k: v for k, v in zeitmarken.items() if k in alle}, open(os.path.join(WURZEL, "tools/vertonung/zeitmarken-de.json"), "w"), ensure_ascii=False)

if __name__ == "__main__":
    main()
