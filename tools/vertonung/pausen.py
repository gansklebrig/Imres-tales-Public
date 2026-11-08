"""Pausen-Regie fürs Hörbuch: verlängert Stille an Stellen, die „sacken“ müssen – ohne neu einzusprechen.

Eingaben:
  tools/vertonung/zeitmarken-de.json   Wortzeiten (Whisper, Workflow zeitmarken.yml)
  tools/vertonung/pausen-de.json       Marken {"I:1": {"marken": [{"nach": "...", "min": 0.8}], "ende": 1.2}}
  tools/vertonung/regie-de.json        gesprochener Text
Die Originalaufnahmen werden beim ersten Lauf nach $ORIGINAL (Standard: ../chronik-original-de) kopiert
(alternativ aus der Git-Geschichte holen),
damit der Lauf wiederholbar ist. Aufruf:  python3 tools/vertonung/pausen.py [--trocken] [--nur I:1,I:2]
"""
import difflib, json, os, re, shutil, subprocess, sys
import numpy as np

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SR = 44100
SATZ_MIN = 0.42      # Grundpause nach jedem Satzende (. ! ? …)
DOPPEL_MIN = 0.30    # nach Doppelpunkt / Gedankenstrich
ABSATZ_MIN = 0.85    # Stille zwischen zwei Absätzen (Ende dieses + Anfang des nächsten)
TITEL_MIN = 1.0      # nach einer Überschrift
SCHWELLE = 10 ** (-42 / 20)

TAG = re.compile(r"\[[^\]]*\]")
def klartext(r): return re.sub(r"\s+", " ", TAG.sub(" ", r)).strip()
def norm(w): return re.sub(r"[^a-zäöüß0-9]", "", w.lower())

def lade(datei):
    roh = subprocess.run(["ffmpeg", "-v", "error", "-i", datei, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(roh, dtype=np.float32).copy()

def schreibe(x, datei):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "128k", "-ar", str(SR), "-ac", "1", datei],
                   input=x.astype(np.float32).tobytes(), check=True)

def huelle(x, f=0.01):
    n = int(f * SR); m = len(x) // n
    return np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1) + 1e-12), n

def stille_bei(h, n, a, b):
    """längste stille Strecke (in Samples) im Fenster [a,b] Sekunden → (start, ende) oder None"""
    i0, i1 = max(0, int(a * SR / n)), min(len(h), int(b * SR / n) + 1)
    best, cur = None, None
    for i in range(i0, i1):
        if h[i] < SCHWELLE:
            cur = (cur[0], i + 1) if cur else (i, i + 1)
            if best is None or cur[1] - cur[0] > best[1] - best[0]: best = cur
        else: cur = None
    return (best[0] * n, best[1] * n) if best else None

def ausrichten(text, worte):
    """Textwörter → Index des passenden Whisper-Worts"""
    tw = [(m.start(), m.end(), norm(m.group())) for m in re.finditer(r"\S+", text)]
    tw = [t for t in tw if t[2]]
    ww = [norm(w[0]) for w in worte]
    sm = difflib.SequenceMatcher(None, [t[2] for t in tw], ww, autojunk=False)
    zu = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n): zu[a + k] = b + k
    # Lücken: proportional zwischen Nachbarn füllen
    for k in range(len(tw)):
        if k in zu: continue
        l = max([j for j in zu if j < k], default=None); r = min([j for j in zu if j > k], default=None)
        if l is not None and r is not None and r > l: zu[k] = zu[l] + round((k - l) * (zu[r] - zu[l]) / (r - l))
        elif l is not None: zu[k] = min(len(ww) - 1, zu[l] + (k - l))
        elif r is not None: zu[k] = max(0, zu[r] - (r - k))
    return tw, zu, sm.ratio()

def bearbeiten(schluessel, datei, regie, worte, marken, ende_min, titel, naechster_anfang, trocken):
    x = lade(datei); h, n = huelle(x)
    D = len(x) / SR
    text = klartext(regie)
    tw, zu, guete = ausrichten(text, worte)
    wunsch = {}   # Wortindex (Whisper) → Mindestpause
    def setze(k_text, s):
        if k_text not in zu: return
        j = zu[k_text]
        if j < len(worte) - 1: wunsch[j] = max(wunsch.get(j, 0), s)
    for k, (a, b, w) in enumerate(tw[:-1]):
        roh = text[a:b]
        if re.search(r"[.!?…](?:[“”\"«»)])?$", roh): setze(k, SATZ_MIN)
        elif re.search(r"[:–—]$", roh) or text[b:b + 3].strip() in ("–", "—"): setze(k, DOPPEL_MIN)
    fehlend = []
    for m in marken:
        s = m["nach"].strip(); p = text.find(s)
        if p < 0: fehlend.append(s); continue
        e = p + len(s)
        k = max([i for i, t in enumerate(tw) if t[1] <= e + 1], default=None)
        if k is not None: setze(k, float(m["min"]))
    einfuegen, protokoll = [], []
    for j, soll in sorted(wunsch.items()):
        a, b = worte[j][2], worte[j + 1][1]
        st = stille_bei(h, n, min(a, b) - .25, max(a, b) + .25)
        if not st: protokoll.append((j, soll, None)); continue
        ist = (st[1] - st[0]) / SR
        if ist + .03 < soll:
            einfuegen.append(((st[0] + st[1]) // 2, soll - ist))
            protokoll.append((j, soll, round(ist, 2)))
    # Ende: Reststille hinten + Stille vorne im nächsten Absatz
    hinten = 0
    for v in h[::-1]:
        if v >= SCHWELLE: break
        hinten += n
    hinten /= SR
    ziel_ende = max(TITEL_MIN if titel else ABSATZ_MIN, ende_min or 0)
    plus_ende = max(0.0, ziel_ende - hinten - naechster_anfang)
    if trocken: return einfuegen, plus_ende, fehlend, guete, D
    teile, pos = [], 0
    for at, dauer in sorted(einfuegen):
        teile.append(x[pos:at]); teile.append(np.zeros(int(dauer * SR), np.float32)); pos = at
    teile.append(x[pos:]); teile.append(np.zeros(int(plus_ende * SR), np.float32))
    schreibe(np.concatenate(teile), datei)
    return einfuegen, plus_ende, fehlend, guete, D

def vorne_stille(datei):
    x = lade(datei); h, n = huelle(x); c = 0
    for v in h:
        if v >= SCHWELLE: break
        c += n
    return c / SR

def main():
    trocken = "--trocken" in sys.argv
    nur = set(sys.argv[sys.argv.index("--nur") + 1].split(",")) if "--nur" in sys.argv else None
    J = lambda p: json.load(open(os.path.join(WURZEL, p)))
    manifest = J("audio/chronik/de/manifest.json"); regie = J("tools/vertonung/regie-de.json")
    zeiten = J("tools/vertonung/zeitmarken-de.json"); marken = J("tools/vertonung/pausen-de.json")
    rk = dict(regie["kapitel"]); rk["vorab"] = {"0": regie["vorab"]}
    orig = os.environ.get("ORIGINAL") or os.path.join(os.path.dirname(WURZEL), "chronik-original-de")
    folge = [(k, e) for k in ["vorab", "I", "II"] for e in manifest["kapitel"].get(k, [])]
    bericht = {"eingefuegt": 0, "sekunden": 0.0, "fehlend": []}
    for n, (kap, e) in enumerate(folge):
        sch = f"{kap}:{e['i']}"
        datei = os.path.join(WURZEL, e["datei"]); rel = e["datei"]
        quelle = os.path.join(orig, os.path.relpath(rel, "audio/chronik/de"))
        if not os.path.exists(quelle):
            os.makedirs(os.path.dirname(quelle), exist_ok=True); shutil.copy2(datei, quelle)
        if nur and sch not in nur: continue
        shutil.copy2(quelle, datei)    # immer vom Original aus
        nxt = folge[n + 1][1] if n + 1 < len(folge) else None
        na = vorne_stille(os.path.join(orig, os.path.relpath(nxt["datei"], "audio/chronik/de"))) if nxt and os.path.exists(os.path.join(orig, os.path.relpath(nxt["datei"], "audio/chronik/de"))) else (vorne_stille(os.path.join(WURZEL, nxt["datei"])) if nxt else 0)
        m = marken.get(sch, {})
        r = rk.get(kap, {}).get(str(e["i"]), {}).get("regie", "")
        ein, plus, fehl, guete, D = bearbeiten(sch, datei, r, zeiten.get(rel, []), m.get("marken", []), m.get("ende"), e.get("titel"), na, trocken)
        bericht["eingefuegt"] += len(ein); bericht["sekunden"] += sum(d for _, d in ein) + plus
        bericht["fehlend"] += [(sch, f) for f in fehl]
        print(f"{sch:8s} {D:6.1f}s  Übereinstimmung {guete:.2f}  +{len(ein)} Pausen (+{sum(d for _, d in ein):.1f}s)  Ende +{plus:.2f}s" + (f"  FEHLT: {fehl}" if fehl else ""))
    print(json.dumps(bericht, ensure_ascii=False, indent=1))

if __name__ == "__main__": main()
