#!/usr/bin/env python3
"""Hörbuch aufnehmen (läuft im Workflow hoerbuch.yml) – mit Sicherungen gegen verschwendetes Guthaben.

  KAPITEL=vorab,I GRENZE=45000 NACHHOLEN=4000 python3 tools/hoerbuch/aufnahme.py [--trocken]

1. Vorab-Prüfung (vor jedem API-Aufruf, sonst Abbruch):
   * Modell muss eleven_v3 sein (nur dieses Modell versteht Regie-Tags, alle anderen lesen sie vor)
   * jeder Tag steht in der erlaubten Liste, ein Begriff je Klammer
   * ohne Tags ist der Text wortgleich mit dem Skript
   * Gesamtkosten ≤ GRENZE
2. Aufnahme jeder fehlenden Einheit (Segment oder neu aufzunehmender Teil bei Recycling)
3. Hörprüfung mit Whisper: Wortlaut-Abgleich, verräterische Regie-Wörter, Länge.
   Durchgefallene Einheiten werden neu aufgenommen (höchstens 2×, insgesamt höchstens NACHHOLEN Zeichen).
Ergebnis: audio/hoerbuch/seg/*.mp3, tools/hoerbuch/qa-de.json (inkl. Wortzeiten für den Schnitt)
"""
import difflib, hashlib, json, os, re, subprocess, sys, time
WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(WURZEL, "tools/vertonung"))
HIER = os.path.join(WURZEL, "tools/hoerbuch")
def J(p, std=None):
    p = os.path.join(WURZEL, p)
    return json.load(open(p)) if os.path.exists(p) else std

ERLAUBT = set("""warmly softly tenderly dryly deadpan sarcastic mischievously amused proudly smug theatrical excited
enthusiastic cheerful nervous anxious scared panicked angry furious annoyed grumpy gruffly coldly menacing threatening sad
sorrowful awed serious solemn curious surprised confused tired exhausted breathless drunk bored lazy hesitant sheepish
relieved triumphant mocking nostalgic dramatic firm pompous sternly suspicious impatient reverent wistful hopeful desperate
pained whispers quietly hushed shouting slowly quickly laughs chuckles giggles snorts sighs gasps groans growls coughs
exhales sniffs gulps""".split()) | {"short pause", "pause", "long pause"}
# Wörter, die im Transkript nie auftauchen dürfen (= vorgelesene Regie)
VERRAT = (ERLAUBT - {"pause"}) | {"pause", "short", "long", "whisper", "laughing", "sigh", "tone"}
TAG = re.compile(r"\[([^\]]*)\]")

def klar(s): return re.sub(r"\s+", " ", TAG.sub(" ", s)).strip()
def vergleich(s):
    s = klar(s).replace("…", "...").replace("–", "-")
    s = re.sub(r"[„“\"»«‚‘’.,!?:;()\-]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()
def saetze(t): return [x for x in re.split(r"(?<=[.!?…])\s+(?=(?:\[[^\]]*\]\s*)*[A-ZÄÖÜ„\"])", t.strip()) if x]

def einheiten(kapitel):
    st, regie, rec, bes = J("tools/hoerbuch/struktur-de.json"), J("tools/hoerbuch/regie-de.json", {}), J("tools/hoerbuch/recycling-de.json", {}), J("tools/hoerbuch/besetzung.json")
    fehler, out = [], []
    bis = int(os.environ.get("BIS") or 0)   # nur die ersten BIS Textblöcke je Kapitel (Probelauf)
    for kap in kapitel:
        nb = 0
        for b in st[kap]:
            if b.get("typ", "text") != "text": continue
            nb += 1
            if bis and nb > bis: break
            for s in b["segmente"]:
                r = regie.get(s["id"])
                if not r: fehler.append(f"{s['id']}: keine Regie"); continue
                t = r["t"]
                if vergleich(t) != vergleich(s["text"]): fehler.append(f"{s['id']}: Wortlaut weicht ab:\n  {klar(t)}\n  {s['text']}")
                for tag in TAG.findall(t):
                    if tag.strip().lower() not in ERLAUBT or tag != tag.strip().lower(): fehler.append(f"{s['id']}: Tag nicht erlaubt: [{tag}]")
                stimme, name = bes["rollen"][s["rolle"]]
                if s["id"] in rec:
                    # Regie-Text satzweise auf die Teile verteilen
                    ts = saetze(t); k = 0; letzter = None
                    for teil in rec[s["id"]]:
                        n = len(saetze(teil["text"]))
                        stueck = ts[k:k + n]; k += n
                        for x in ts[:k]:
                            m = TAG.findall(x)
                            if m: letzter = m[-1]
                        if "neu" in teil:
                            txt = " ".join(stueck)
                            if vergleich(txt) != vergleich(teil["text"]): fehler.append(f"{s['id']}: Teilung passt nicht: {klar(txt)[:60]} / {teil['text'][:60]}")
                            if not txt.startswith("["):
                                vor = [TAG.findall(x) for x in ts[:k - n]]; vor = [y for z in vor for y in z]
                                txt = f"[{vor[-1] if vor else 'warmly'}] " + txt
                            out.append({"uid": f"{s['id']}-n{teil['neu']}", "sid": s["id"], "rolle": s["rolle"], "stimme": stimme, "text": txt, "ziel": teil["text"]})
                else:
                    out.append({"uid": s["id"], "sid": s["id"], "rolle": s["rolle"], "stimme": stimme, "text": t, "ziel": s["text"]})
    return out, fehler, bes

def datei(e, bes):
    h = hashlib.sha1((e["stimme"] + "|" + bes["modell"] + "|" + json.dumps(bes["einstellung"], sort_keys=True) + "|" + e["text"]).encode()).hexdigest()[:8]
    return f"audio/hoerbuch/seg/{e['uid']}-{h}.mp3"

def sichern(nachricht):
    subprocess.run(["git", "add", "audio/hoerbuch", "tools/hoerbuch/qa-de.json"], cwd=WURZEL, check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=WURZEL).returncode == 0: return
    subprocess.run(["git", "commit", "-q", "-m", nachricht], cwd=WURZEL, check=True)
    for _ in range(4):
        if subprocess.run(["git", "pull", "--no-rebase", "-q"], cwd=WURZEL).returncode == 0 and subprocess.run(["git", "push", "-q"], cwd=WURZEL).returncode == 0: return
        time.sleep(5)
    raise SystemExit("Push fehlgeschlagen")

def dauer(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(WURZEL, f)]).strip())

def pruefen(modell, f, ziel):
    seg, _ = modell.transcribe(os.path.join(WURZEL, f), language="de", word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
    woerter = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in seg for w in s.words]
    hyp = " ".join(w[0] for w in woerter)
    a, b = vergleich(ziel), vergleich(hyp)
    ratio = difflib.SequenceMatcher(None, a, b).ratio()
    verrat = [w for w in b.split() if w in VERRAT]
    d = dauer(f); erwartet = len(klar(ziel)) / 14.5 + .6
    lang = len(b) > len(a) * 1.25 + 8
    grenze = .78 if len(a) < 30 else .86
    ok = ratio >= grenze and not verrat and not lang and erwartet * .45 < d < erwartet * 2.4 + 2
    return {"ok": ok, "ratio": round(ratio, 3), "verrat": verrat, "dauer": round(d, 2), "erwartet": round(erwartet, 2), "hyp": hyp, "woerter": woerter}

def main():
    kapitel = (os.environ.get("KAPITEL") or "vorab,I").split(",")
    grenze = int(os.environ.get("GRENZE") or 0); nachholen = int(os.environ.get("NACHHOLEN") or 0)
    E, fehler, bes = einheiten(kapitel)
    if bes["modell"] != "eleven_v3": fehler.append("Modell ist nicht eleven_v3 – Regie-Tags würden vorgelesen")
    fehlend = [e for e in E if not os.path.exists(os.path.join(WURZEL, datei(e, bes)))]
    kosten = sum(len(e["text"]) for e in fehlend)
    print(f"{len(E)} Einheiten, davon {len(fehlend)} aufzunehmen, {kosten} Zeichen (Grenze {grenze or '–'})")
    if grenze and kosten > grenze: fehler.append(f"Kosten {kosten} > Grenze {grenze}")
    if fehler:
        print("\n".join(fehler[:60])); raise SystemExit(f"Abbruch vor der Aufnahme: {len(fehler)} Probleme, kein Guthaben verbraucht.")
    if "--trocken" in sys.argv: return
    import vertonen
    from faster_whisper import WhisperModel
    os.makedirs(os.path.join(WURZEL, "audio/hoerbuch/seg"), exist_ok=True)
    qa = J("tools/hoerbuch/qa-de.json", {})
    def aufnehmen(e):
        mp3 = vertonen.tts(e["stimme"], e["text"], modell="eleven_v3", einstellung=bes["einstellung"])
        open(os.path.join(WURZEL, datei(e, bes)), "wb").write(mp3)
    for n, e in enumerate(fehlend, 1):
        aufnehmen(e); print(f"{n}/{len(fehlend)} {datei(e, bes)}", flush=True)
        if n % 40 == 0: sichern(f"Hörbuch: {n} Aufnahmen")
    sichern(f"Hörbuch: {len(fehlend)} Aufnahmen ({kosten} Zeichen)")
    # Hörprüfung (auch recycelte Stücke)
    wm = WhisperModel(os.environ.get("WHISPER") or "medium", device="cpu", compute_type="int8")
    pruef = [(datei(e, bes), e["ziel"], e) for e in E]
    for sid, teile in J("tools/hoerbuch/recycling-de.json", {}).items():
        if not any(sid.startswith(k + "-") for k in kapitel): continue
        pruef += [(t["alt"], t["text"], None) for t in teile if t.get("alt")]
    verbraucht = 0
    for f, ziel, e in pruef:
        if f in qa and qa[f].get("ok") is not None and "woerter" in qa[f]: continue
        q = pruefen(wm, f, ziel)
        versuche = 0
        while e and not q["ok"] and versuche < 2 and verbraucht + len(e["text"]) <= nachholen:
            print(f"NEU: {f} ratio={q['ratio']} verrat={q['verrat']} dauer={q['dauer']}/{q['erwartet']}\n  hörte: {q['hyp'][:160]}", flush=True)
            aufnehmen(e); verbraucht += len(e["text"]); versuche += 1
            q = pruefen(wm, f, ziel)
        q["nachgeholt"] = versuche; qa[f] = q
        if not q["ok"]: print(f"WEITER AUFFÄLLIG: {f} ratio={q['ratio']} verrat={q['verrat']} hörte: {q['hyp'][:160]}", flush=True)
        if len(qa) % 50 == 0: json.dump(qa, open(os.path.join(HIER, "qa-de.json"), "w"), ensure_ascii=False)
    json.dump(qa, open(os.path.join(HIER, "qa-de.json"), "w"), ensure_ascii=False)
    schlecht = [f for f, q in qa.items() if not q["ok"]]
    print(f"Hörprüfung: {len(qa)} geprüft, {len(schlecht)} auffällig, {verbraucht} Zeichen nachgeholt")
    sichern(f"Hörbuch: Hörprüfung ({len(schlecht)} auffällig, {verbraucht} Zeichen nachgeholt)")

if __name__ == "__main__":
    main()
