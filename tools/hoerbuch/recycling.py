#!/usr/bin/env python3
"""Alte Erzähler-Aufnahmen wiederverwenden: Satzläufe, die wortgleich im neuen Skript stehen,
werden aus den Original-Aufnahmen (vor Einwürfen und Pausen-Bearbeitung) ausgeschnitten.

  ORIGINAL=…/chronik-original-de python3 tools/hoerbuch/recycling.py [--schneiden]

Ergebnis: tools/hoerbuch/recycling-de.json  {segment_id: [teil, …]}
  teil = {"alt": "audio/hoerbuch/alt/<id>-<n>.mp3", "text": "…"}   (ausgeschnitten)
       | {"neu": n}                                                (n-ter neu aufzunehmender Satzlauf)
Regeln (damit es nahtlos klingt):
  * nur ganze Sätze, Lauf mindestens 60 Zeichen, Satzzeichen müssen übereinstimmen
  * neu aufzunehmende Stücke zwischen zwei recycelten mindestens 50 Zeichen (sonst wird mit aufgenommen)
  * Schnitt an Whisper-Wortgrenzen, nur wenn Anfang und Ende sicher gefunden werden
"""
import json, os, re, subprocess, sys
WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HIER = os.path.join(WURZEL, "tools/hoerbuch")
ORIGINAL = os.environ.get("ORIGINAL", "")

def J(p): return json.load(open(os.path.join(WURZEL, p)))
TAG = re.compile(r"\[[^\]]*\]")
def klar(s): return re.sub(r"\s+", " ", TAG.sub(" ", re.sub(r"<[^>]+>", "", s))).strip()
def norm(s):
    s = klar(s).replace("…", "...").replace("–", "-").replace("—", "-")
    s = re.sub(r"[„“\"»«‚‘’]", "", s)
    return re.sub(r"\s+", " ", s).strip().lower()
def wnorm(w): return re.sub(r"[^a-zäöüß0-9]", "", w.lower())
def saetze(t): return [x for x in re.split(r"(?<=[.!?…])\s+(?=[A-ZÄÖÜ„\"])", t.strip()) if x]

def alte_absaetze():
    r, m, z = J("tools/vertonung/regie-de.json"), J("tools/hoerbuch/alt-manifest-de.json"), J("tools/hoerbuch/alt-zeitmarken-de.json")
    out = []
    for kap, liste in m["kapitel"].items():
        for e in liste:
            if e.get("titel"): continue
            text = r["vorab"]["regie"] if kap == "vorab" else r["kapitel"][kap].get(str(e["i"]), {}).get("regie")
            if not text or e["datei"] not in z: continue
            orig = os.path.join(ORIGINAL, kap, os.path.basename(e["datei"]))
            if not os.path.exists(orig): continue
            out.append({"kap": kap, "i": e["i"], "norm": norm(text), "woerter": z[e["datei"]], "orig": orig})
    return out

def zeiten(lauf, alt):
    """Start/Ende des Laufs in der alten Aufnahme über die Whisper-Wörter."""
    ziel = [wnorm(w) for w in klar(lauf).split()]; ziel = [w for w in ziel if w]
    W = [(wnorm(w), a, b) for w, a, b in alt["woerter"]]
    n = len(ziel)
    best = None
    for s in range(len(W)):
        if W[s][0] != ziel[0]: continue
        # vorwärts gierig abgleichen (kleine Abweichungen von Whisper erlauben)
        i, j, fehl = s, 0, 0
        while i < len(W) and j < n:
            if W[i][0] == ziel[j]: i += 1; j += 1
            elif j + 1 < n and W[i][0] == ziel[j + 1]: j += 1; fehl += 1
            elif i + 1 < len(W) and W[i + 1][0] == ziel[j]: i += 1; fehl += 1
            else: i += 1; j += 1; fehl += 1
            if fehl > max(2, n // 10): break
        if j >= n and fehl <= max(2, n // 10) and W[i - 1][0] == ziel[-1] and W[s + 1][0] == ziel[1]:
            if best is None or fehl < best[2]: best = (W[s][1], W[i - 1][2], fehl, s, i - 1)
    if not best: return None
    t0, t1, _, s, e = best
    # Ränder: nicht in Nachbarwörter schneiden
    vor = W[s - 1][2] if s > 0 else 0.0
    nach = W[e + 1][1] if e + 1 < len(W) else t1 + .4
    return max(vor + .03, t0 - .08), min(nach - .04, t1 + .35)

def plan():
    st = J("tools/hoerbuch/struktur-de.json"); alte = alte_absaetze()
    erg, gespart = {}, 0
    for kap in ("vorab", "I", "II"):
        bloecke = st[kap] if kap != "vorab" else st["vorab"]
        for b in bloecke:
            if b.get("typ", "text") != "text": continue
            for s in b["segmente"]:
                if s["rolle"] != "erzaehler": continue
                S = saetze(s["text"]); n = len(S)
                treffer = [None] * n   # Index des Laufs
                laeufe = []; i = 0
                while i < n:
                    gef = None
                    for j in range(n, i, -1):
                        lauf = " ".join(S[i:j])
                        if len(lauf) < 60: break
                        nl = norm(lauf)
                        for a in alte:
                            if nl in a["norm"]:
                                t = zeiten(lauf, a)
                                if t: gef = (j, a, t, lauf); break
                        if gef: break
                    if gef:
                        j, a, t, lauf = gef; laeufe.append((i, j, a, t, lauf)); i = j
                    else: i += 1
                if not laeufe: continue
                # neu aufzunehmende Lücken zwischen Läufen müssen ≥ 50 Zeichen sein
                ok = []
                for L in laeufe:
                    if ok:
                        luecke = " ".join(S[ok[-1][1]:L[0]])
                        if 0 < len(luecke) < 50: continue
                    ok.append(L)
                if ok and ok[-1][1] < n and len(" ".join(S[ok[-1][1]:])) < 50 and len(ok) > 1: ok.pop()
                if ok and ok[0][0] > 0 and len(" ".join(S[:ok[0][0]])) < 50 and len(ok) > 1: ok.pop(0)
                teile, pos, nn = [], 0, 0
                for (i0, j0, a, t, lauf) in ok:
                    if i0 > pos: teile.append({"neu": nn, "text": " ".join(S[pos:i0])}); nn += 1
                    teile.append({"alt": None, "quelle": a["orig"], "von": round(t[0], 3), "bis": round(t[1], 3), "text": lauf})
                    gespart += len(lauf); pos = j0
                if pos < n: teile.append({"neu": nn, "text": " ".join(S[pos:])})
                erg[s["id"]] = teile
    return erg, gespart

def main():
    erg, gespart = plan()
    if "--schneiden" in sys.argv:
        ziel = os.path.join(WURZEL, "audio/hoerbuch/alt"); os.makedirs(ziel, exist_ok=True)
        for sid, teile in erg.items():
            k = 0
            for t in teile:
                if "quelle" not in t: continue
                k += 1; datei = f"audio/hoerbuch/alt/{sid}-{k}.mp3"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t["von"]), "-to", str(t["bis"]), "-i", t["quelle"],
                                "-af", "afade=t=in:d=0.015,areverse,afade=t=in:d=0.1,areverse", "-ar", "44100", "-b:a", "160k",
                                os.path.join(WURZEL, datei)], check=True)
                t["alt"] = datei; t.pop("quelle")
    json.dump(erg, open(os.path.join(HIER, "recycling-de.json"), "w"), ensure_ascii=False, indent=1)
    print(len(erg), "Segmente mit Recycling, gespart", gespart, "Zeichen")

if __name__ == "__main__":
    main()
