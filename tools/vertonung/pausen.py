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
SCHWELLE = 10 ** (-42 / 20)   # echte Stille
LEISE = 10 ** (-30 / 20)      # Atmer/Ausklang zählen als Pause

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

def strecke(h, i0, i1, grenze):
    best, cur = None, None
    for i in range(i0, i1):
        if h[i] < grenze:
            cur = (cur[0], i + 1) if cur else (i, i + 1)
            if best is None or cur[1] - cur[0] > best[1] - best[0]: best = cur
        else: cur = None
    return best

def stille_bei(h, n, a, b):
    """gefühlte Pause im Fenster [a,b] s → (Länge in s, Einfügepunkt in Samples) oder None.
    Länge = längste leise Strecke (Atmer zählen mit); eingefügt wird mitten in der stillsten Stelle darin."""
    i0, i1 = max(0, int(a * SR / n)), min(len(h), int(b * SR / n) + 1)
    p = strecke(h, i0, i1, LEISE)
    if not p: return None
    q = strecke(h, p[0], p[1], SCHWELLE)
    if q: at = (q[0] + q[1]) // 2
    else: at = p[0] + int(np.argmin(h[p[0]:p[1]]))
    return (p[1] - p[0]) * n / SR, at * n + n // 2
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

def bearbeiten(schluessel, datei, regie, worte, marken, ende_min, titel, naechster_anfang, trocken, einwuerfe=()):
    x = lade(datei); h, n = huelle(x)
    D = len(x) / SR
    text = klartext(regie)
    tw, zu, guete = ausrichten(text, worte)
    wunsch = {}   # Wortindex (Whisper) → Mindestpause
    def schluss(w): m_ = re.search(r"([.!?…:,;–—])[“”\"«»)]*$", w.strip()); return m_.group(1) if m_ else ""
    def finde(k_text):
        """Whisper-Wort zum Textwort k – nur wenn Wort oder Satzzeichen wirklich passen (sonst lieber keine Pause,
        damit nie mitten in ein Wort oder einen Satzfluss geschnitten wird)"""
        if k_text not in zu: return None
        j0, ziel = zu[k_text], tw[k_text][2]
        nxt = tw[k_text + 1][2] if k_text + 1 < len(tw) else ""
        sz = schluss(text[tw[k_text][0]:tw[k_text][1]])
        kand = [j for j in range(max(0, j0 - 4), min(len(worte) - 1, j0 + 5)) if norm(worte[j][0]) == ziel]
        if kand:
            gut = [j for j in kand if nxt and norm(worte[j + 1][0])[:3] == nxt[:3]] or kand
            return min(gut, key=lambda j: abs(j - j0))
        if sz:   # Name zerstückelt o. Ä.: Whisper-Wort mit demselben Satzzeichen in der Nähe
            kand = [j for j in range(max(0, j0 - 3), min(len(worte) - 1, j0 + 4)) if schluss(worte[j][0]) == sz]
            if kand: return min(kand, key=lambda j: abs(j - j0))
        return None
    def setze(k_text, s, satz=False):
        j = finde(k_text)
        if j is None or j >= len(worte) - 1: return
        if satz and schluss(worte[j][0]) not in ".!?…": return   # Whisper hört kein Satzende → Erzähler liest durch, so lassen
        wunsch[j] = max(wunsch.get(j, 0), s)
        if not schluss(text[tw[k_text][0]:tw[k_text][1]]): mitte.add(j)
    mitte = set()   # Pausen mitten im Satz (vor einer Enthüllung): nur verlängern, wo Helmut ohnehin kurz absetzt
    for k, (a, b, w) in enumerate(tw[:-1]):
        if re.search(r"[.!?…](?:[“”\"«»)])?$", text[a:b]): setze(k, SATZ_MIN, satz=True)
    fehlend = []
    for m in marken:
        s = m["nach"].strip(); p = text.find(s)
        if p < 0: fehlend.append(s); continue
        e = p + len(s)
        k = max([i for i, t in enumerate(tw) if t[1] <= e + 1], default=None)
        if k is not None: setze(k, float(m["min"]))
    einfuegen, protokoll = [], []
    # Einwürfe anderer Figuren: Clip in die Pause nach dem Ankerwort schneiden
    hinten_n = 0
    for v in h[::-1]:
        if v >= SCHWELLE: break
        hinten_n += n
    for ew in einwuerfe:
        s_ = ew["nach"].strip(); p_ = text.find(s_)
        if p_ < 0: fehlend.append("EINWURF " + s_); continue
        k = max([i for i, t in enumerate(tw) if t[1] <= p_ + len(s_) + 1], default=None)
        j = zu.get(k) if k is not None else None
        if j is None: fehlend.append("EINWURF " + s_); continue
        if j < len(worte) - 1:
            a, b = worte[j][2], worte[j + 1][1]
            st = stille_bei(h, n, min(a, b) - .25, max(a, b) + .25)
            if not st: fehlend.append("EINWURF (keine Pause) " + s_); continue
            ist, at = st; wunsch.pop(j, None)
        else:
            ist, at = 2 * hinten_n / SR, len(x) - hinten_n // 2
        z = lambda d: np.zeros(int(max(0.0, d) * SR), np.float32)
        bis, ist2 = at, ist
        if ew.get("ersetzt"):   # Zitat des Erzählers herausschneiden, die Figur spricht es selbst
            q = text.find(ew["ersetzt"].strip(), p_)
            k2 = max([i for i, t in enumerate(tw) if t[1] <= q + len(ew["ersetzt"].strip()) + 2], default=None) if q >= 0 else None
            j2 = zu.get(k2) if k2 is not None else None
            if j2 is None or j2 <= j: fehlend.append("ERSETZT " + ew["ersetzt"]); continue
            if j2 < len(worte) - 1:
                a, b = worte[j2][2], worte[j2 + 1][1]
                st2 = stille_bei(h, n, min(a, b) - .25, max(a, b) + .25)
                if not st2: fehlend.append("ERSETZT (keine Pause) " + ew["ersetzt"]); continue
                ist2, bis = st2; wunsch.pop(j2, None)
            else: ist2, bis = 2 * hinten_n / SR, len(x) - hinten_n // 2
        einfuegen.append((at, np.concatenate([z(ew.get("vor", .32) - ist / 2), ew["clip"], z(ew.get("danach", .45) - ist2 / 2)]), bis))
    for j, soll in sorted(wunsch.items()):
        a, b = worte[j][2], worte[j + 1][1]
        st = stille_bei(h, n, min(a, b) - .25, max(a, b) + .25)
        if not st: protokoll.append((j, soll, None)); continue
        ist, at = st
        if ist < .12 and soll < .75: continue      # keine echte Pause da → nicht aufreißen
        if j in mitte:
            if ist < .2: continue                      # Satz fließt → kein Loch hineinschneiden
            soll = min(soll, ist + .3)
        if ist + .03 < soll:
            einfuegen.append((at, np.zeros(int((soll - ist) * SR), np.float32), at))
            protokoll.append((j, soll, round(ist, 2)))
            if os.environ.get("PROTOKOLL"): print(f"   {schluessel} …{' '.join(w[0] for w in worte[max(0, j - 3):j + 1])} | {' '.join(w[0] for w in worte[j + 1:j + 3])}  ist {ist:.2f} → {soll:.2f}  @{at / SR:.2f}s")
    # Ende: Reststille hinten + Stille vorne im nächsten Absatz
    hinten = 0
    for v in h[::-1]:
        if v >= SCHWELLE: break
        hinten += n
    hinten /= SR
    ziel_ende = max(TITEL_MIN if titel else ABSATZ_MIN, ende_min or 0)
    plus_ende = max(0.0, ziel_ende - hinten - naechster_anfang)
    if trocken: return [(a, len(q) / SR) for a, q, _ in einfuegen], plus_ende, fehlend, guete, D
    teile, pos = [], 0
    F = int(.006 * SR); rampe = np.linspace(1, 0, F, dtype=np.float32)
    for at, stueck, bis in sorted(einfuegen, key=lambda q: q[0]):
        if at < pos: continue
        a = x[pos:at].copy(); a[-F:] *= rampe[-len(a[-F:]):] if len(a) else 1
        teile.append(a); teile.append(stueck)
        x[bis:bis + F] *= rampe[::-1][:len(x[bis:bis + F])]; pos = bis
    teile.append(x[pos:]); teile.append(np.zeros(int(plus_ende * SR), np.float32))
    schreibe(np.concatenate(teile), datei)
    return [(a, len(q) / SR) for a, q, _ in einfuegen], plus_ende, fehlend, guete, D

ROLLEN_FX = {   # Klang je Figur (ffmpeg-Filter)
    "themberchaud": "asetrate=44100*0.86,aresample=44100,atempo=1.163,aecho=0.8:0.7:70|130:0.3|0.18,lowpass=f=9000",
    "horga": "asetrate=44100*0.95,aresample=44100,atempo=1.053,aecho=0.8:0.6:55|95:0.22|0.12",
    "drow": "aecho=0.8:0.55:45|80:0.18|0.1",
    "gefangener": "aecho=0.8:0.6:28|50:0.25|0.15,highpass=f=180",
    "ploop": "vibrato=f=7:d=0.12,aecho=0.8:0.5:35:0.15",
    "goblin": "asetrate=44100*1.04,aresample=44100,atempo=0.962",
}
ROLLEN_DB = {}
def filtern(x, fx):
    roh = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", fx + ",apad=pad_dur=0.4", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(roh, dtype=np.float32).copy()

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
    ew_alle = {}
    ewp = os.path.join(WURZEL, "tools/vertonung/einwuerfe-de.json"); ewm = os.path.join(WURZEL, "audio/chronik/de/stimmen/manifest.json")
    if os.path.exists(ewp) and os.path.exists(ewm) and "--ohne-einwuerfe" not in sys.argv:
        clips = json.load(open(ewm))
        for ew in json.load(open(ewp))["einwuerfe"]:
            if ew.get("aus") or ew["id"] not in clips: continue
            c = lade(os.path.join(WURZEL, clips[ew["id"]]))
            fx = ROLLEN_FX.get(ew["rolle"])
            if fx: c = filtern(c, fx)
            c = c[np.argmax(np.abs(c) > 10 ** (-45 / 20)):]; c = c[: len(c) - np.argmax(np.abs(c[::-1]) > 10 ** (-45 / 20))]
            ew_alle.setdefault(ew["absatz"], []).append(dict(ew, clip=(c * 10 ** (ew.get("db", ROLLEN_DB.get(ew["rolle"], 0)) / 20)).astype(np.float32)))
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
        if not trocken: shutil.copy2(quelle, datei)    # immer vom Original aus
        nxt = folge[n + 1][1] if n + 1 < len(folge) else None
        na = vorne_stille(os.path.join(orig, os.path.relpath(nxt["datei"], "audio/chronik/de"))) if nxt and os.path.exists(os.path.join(orig, os.path.relpath(nxt["datei"], "audio/chronik/de"))) else (vorne_stille(os.path.join(WURZEL, nxt["datei"])) if nxt else 0)
        m = marken.get(sch, {})
        r = rk.get(kap, {}).get(str(e["i"]), {}).get("regie", "")
        ein, plus, fehl, guete, D = bearbeiten(sch, quelle if trocken else datei, r, zeiten.get(rel, []), m.get("marken", []), m.get("ende"), e.get("titel"), na, trocken, ew_alle.get(sch, []))
        bericht["eingefuegt"] += len(ein); bericht["sekunden"] += sum(d for _, d in ein) + plus
        bericht["fehlend"] += [(sch, f) for f in fehl]
        print(f"{sch:8s} {D:6.1f}s  Übereinstimmung {guete:.2f}  +{len(ein)} Pausen (+{sum(d for _, d in ein):.1f}s)  Ende +{plus:.2f}s" + (f"  FEHLT: {fehl}" if fehl else ""))
    print(json.dumps(bericht, ensure_ascii=False, indent=1))

if __name__ == "__main__": main()
