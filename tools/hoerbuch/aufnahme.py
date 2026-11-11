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

BUEHNE = re.compile(r"\*[^*]+\*")   # *hust* u. Ä.: Bühnenwörter im Skript, im Ton als Regie-Tag
def klar(s): return re.sub(r"\s+", " ", TAG.sub(" ", BUEHNE.sub(" ", s)).replace(" / ", " ")).strip()
def sprechtext(t):
    """Text für die Sprachausgabe: Verszeilen („ / “) als Zeilenumbruch, damit jede Zeile ihren Reim am Ende betont."""
    return re.sub(r"\s*/\s+", "\n", t)
def verse(t): return [v for v in klar(t.replace(" / ", " |V| ")).split(" |V| ") if v] if " / " in t else []
def vergleich(s):
    s = klar(s).replace("…", "...").replace("–", "-")
    s = re.sub(r"[„“\"»«‚‘’.,!?:;()\-/]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()
def saetze(t): return [x for x in re.split(r"(?<=[.!?…])\s+(?=(?:\[[^\]]*\]\s*)*[A-ZÄÖÜ„\"])", t.strip()) if x]

def titel_uid(kap, t): return f"{kap}-titel-" + hashlib.sha1(t.encode()).hexdigest()[:8]
TITEL_TON = {   # Tonfall der gesprochenen Überschriften
    "Tinte und Wachs": "warmly", "Stille im Gebüsch": "hushed", "Spuren im Moos": "curious", "Was keiner sagen will": "hushed",
    "Eisen und Kräuter": "serious", "Erwartete Gäste": "hushed", "Ein vertrautes Gesicht": "warmly", "Wo das Feuer schläft": "awed",
    "Möwen und Laternen": "nostalgic", "Hinter schweren Türen": "serious", "Ein Dorf hält den Atem an": "hushed", "Ein Schatten über den Zinnen": "dramatic",
    "Suppe für Wanderer": "warmly", "Eine warme Küche": "tired", "Kaltes Gestein": "serious", "Publikum": "mischievously",
    "Über dem Abgrund": "hushed", "Pilzlicht": "awed", "Am stillen Ufer": "hushed", "Was unter der Oberfläche wartet": "dramatic",
    "Stadt aus Ruß": "serious", "Kleine Lügen": "dryly", "Der Thron im Glutlicht": "solemn", "Flöten und Fläschchen": "cheerful",
    "Ärger auf dem Markt": "dramatic", "Große Leute": "warmly", "Worte wie Fels": "solemn", "Ein Tisch im Halbdunkel": "hushed",
    "Hitze von unten": "serious", "Ein Lied für den Gastgeber": "mischievously", "Ein Flüstern am Ausgang": "dryly", "Was bisher geschah": "warmly"}

def einheiten(kapitel):
    st, regie, rec, bes = J("tools/hoerbuch/struktur-de.json"), J("tools/hoerbuch/regie-de.json", {}), J("tools/hoerbuch/recycling-de.json", {}), J("tools/hoerbuch/besetzung.json")
    fehler, out = [], []
    bis = int(os.environ.get("BIS") or 0)   # nur die ersten BIS Textblöcke je Kapitel (Probelauf)
    ohne = set(filter(None, (os.environ.get("OHNE") or "").split(",")))   # Rollen, die (noch) nicht aufgenommen werden
    for kap in kapitel:
        nb = 0
        for b in st[kap]:
            if b.get("typ") == "titel":   # Abschnittsüberschrift: vom Erzähler gesprochen
                t = b["text"][3:].strip(); stimme, _ = bes["rollen"]["erzaehler"]
                tag = TITEL_TON.get(t, "warmly")
                out.append({"uid": titel_uid(kap, t), "sid": titel_uid(kap, t), "rolle": "erzaehler", "stimme": stimme, "text": f"[{tag}] {t}.", "ziel": t})
                continue
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
                            if s["rolle"] in ohne: continue
                            out.append({"uid": f"{s['id']}-n{teil['neu']}", "sid": s["id"], "rolle": s["rolle"], "stimme": stimme, "text": txt, "ziel": teil["text"]})
                else:
                    if s["rolle"] in ohne: continue
                    out.append({"uid": s["id"], "sid": s["id"], "rolle": s["rolle"], "stimme": stimme, "text": t, "ziel": s["text"]})
    return out, fehler, bes

def einstellung(e, bes):
    if e["rolle"] in bes.get("einstellung_rollen", {}): return bes["einstellung_rollen"][e["rolle"]]
    return bes["einstellung_erzaehler"] if e["rolle"] in ("erzaehler", "barradin") else bes["einstellung"]

def datei(e, bes):
    h = hashlib.sha1((e["stimme"] + "|" + bes["modell"] + "|" + json.dumps(einstellung(e, bes), sort_keys=True) + "|" + e["text"]).encode()).hexdigest()[:8]
    return f"audio/hoerbuch/seg/{e['uid']}-{h}.mp3"

def sichern(nachricht):
    pfade = [p for p in ("audio/hoerbuch", "tools/hoerbuch/qa-de.json") if os.path.exists(os.path.join(WURZEL, p))]
    subprocess.run(["git", "add", "--"] + pfade, cwd=WURZEL, check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=WURZEL).returncode == 0: return
    subprocess.run(["git", "commit", "-q", "-m", nachricht], cwd=WURZEL, check=True)
    for _ in range(4):
        if subprocess.run(["git", "pull", "--no-rebase", "-q"], cwd=WURZEL).returncode == 0 and subprocess.run(["git", "push", "-q"], cwd=WURZEL).returncode == 0: return
        time.sleep(5)
    raise SystemExit("Push fehlgeschlagen")

def dauer(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(WURZEL, f)]).strip())

NAMEN = ["Rex", "Echo", "Friedrich", "Ezekiel", "Gundren", "Nundro", "Barradin", "Glasstab", "Fagas", "Kardal", "Harbin", "Zilda"]
def namen_fehlen(ziel, hyp):
    """Eigennamen, die gesprochen werden sollten, aber nicht (oder als anderes Wort) zu hören sind – z. B. „Reich“ statt „Rex“."""
    hw = [re.sub(r"[^a-zäöüß]", "", w.lower()) for w in hyp.split()]
    fehlt = []
    for n in NAMEN:
        soll = len(re.findall(r"\b%s\b" % n, klar(ziel)))
        if not soll: continue
        ist = sum(1 for w in hw if difflib.SequenceMatcher(None, n.lower(), w).ratio() >= .7 or n.lower() in w)
        if ist < soll: fehlt.append(n)
    return fehlt

def pegel(f):
    """Spitzenpegel und Zahl übersteuerter Abtastwerte (Clipping) der Aufnahme."""
    import numpy as np
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", os.path.join(WURZEL, f), "-ac", "1", "-f", "f32le", "pipe:1"])
    x = np.abs(np.frombuffer(raw, dtype=np.float32))
    if not len(x): return -120.0, 0
    return round(float(20 * np.log10(x.max() + 1e-12)), 1), int((x >= .995).sum())

def reime_fehlen(ziel, hyp):
    """Bei Versen: jedes Reimwort am Zeilenende muss zu hören sein (sonst sitzt der Reim nicht)."""
    hw = [re.sub(r"[^a-zäöüß]", "", w.lower()) for w in hyp.split()]
    fehlt = []
    for v in verse(ziel):
        ws = [re.sub(r"[^a-zäöüß]", "", w.lower()) for w in v.split()]; ws = [w for w in ws if w]
        if not ws: continue
        r = ws[-1]
        if not any(difflib.SequenceMatcher(None, r, w).ratio() >= .75 for w in hw): fehlt.append(r)
    return fehlt

def pruefen(modell, f, ziel):
    seg, _ = modell.transcribe(os.path.join(WURZEL, f), language="de", word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
    woerter = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in seg for w in s.words]
    hyp = " ".join(w[0] for w in woerter)
    a, b = vergleich(ziel), vergleich(hyp)
    ratio = difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()
    verrat = [w for w in b.split() if w in VERRAT]
    d = dauer(f); erwartet = len(klar(ziel)) / 14.5 + .6
    lang = len(b) > len(a) * 1.25 + 8
    grenze = .78 if len(a) < 30 else .86
    namen = namen_fehlen(ziel, hyp)
    reime = reime_fehlen(ziel, hyp)
    spitze, clip = pegel(f)
    # Lücken mitten in der Aufnahme (abgehackte Pausen): Stille > 2,2 s zwischen zwei Wörtern
    luecken = [round(woerter[k + 1][1] - woerter[k][2], 2) for k in range(len(woerter) - 1) if woerter[k + 1][1] - woerter[k][2] > 2.2]
    # Sprache: deutsch erkannt? (englischer Einschlag/Akzent kippt die Erkennung) – nur bei genug Text verlässlich
    sprache, sicher = "de", 1.0
    if len(a) >= 40:
        _, info = modell.transcribe(os.path.join(WURZEL, f), language=None, beam_size=1, condition_on_previous_text=False)
        sprache, sicher = info.language, round(float(info.language_probability), 3)
    akzent = sprache != "de" or sicher < .6
    ok = (ratio >= grenze and not verrat and not lang and not namen and not reime and clip < 30 and not luecken and not akzent
          and erwartet * .45 < d < erwartet * 2.4 + 2)
    return {"ok": ok, "ratio": round(ratio, 3), "verrat": verrat, "namen": namen, "reime": reime, "spitze": spitze, "clip": clip,
            "luecken": luecken, "sprache": sprache, "sicher": sicher, "dauer": round(d, 2), "erwartet": round(erwartet, 2), "hyp": hyp, "woerter": woerter}

def guete(q):
    """Vergleichswert zweier Takes: bestanden vor allem anderen, dann Wortlaut, wenig Mängel."""
    return (q["ok"], -len(q["namen"]) - len(q.get("reime", [])) - len(q.get("luecken", [])) - (q.get("clip", 0) >= 30), q["ratio"])

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
        daten = {"text": sprechtext(e["text"]), "model_id": "eleven_v3", "voice_settings": einstellung(e, bes), "language_code": "de"}
        try:   # Sprache erzwingen: kurze Zeilen englischsprachiger Stimmen kippen sonst ins Englische
            mp3 = vertonen.veredeln(vertonen.anfrage(f"/v1/text-to-speech/{e['stimme']}?output_format=mp3_44100_128", daten, roh=True))
        except SystemExit as ex:
            if "language" not in str(ex).lower(): raise
            mp3 = vertonen.tts(e["stimme"], sprechtext(e["text"]), modell="eleven_v3", einstellung=einstellung(e, bes))
        open(os.path.join(WURZEL, datei(e, bes)), "wb").write(mp3)
    for n, e in enumerate(fehlend, 1):
        qa.pop(datei(e, bes), None)   # neue Aufnahme → neu prüfen
        try:
            aufnehmen(e)
        except BaseException as ex:   # z. B. Guthaben aufgebraucht: Bisheriges sichern und prüfen
            print(f"Aufnahme abgebrochen bei {n}/{len(fehlend)}: {ex}", flush=True); break
        print(f"{n}/{len(fehlend)} {datei(e, bes)}", flush=True)
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
        if not os.path.exists(os.path.join(WURZEL, f)): continue
        if f in qa and qa[f].get("ok") is not None and "woerter" in qa[f]: continue
        q = pruefen(wm, f, ziel)
        versuche = 0
        pfad = os.path.join(WURZEL, f)
        while e and not q["ok"] and versuche < 3 and verbraucht + len(e["text"]) <= nachholen:
            print(f"NEU: {f} ratio={q['ratio']} namen={q['namen']} reime={q['reime']} clip={q['clip']} luecken={q['luecken']} "
                  f"sprache={q['sprache']}/{q['sicher']} dauer={q['dauer']}/{q['erwartet']}\n  hörte: {q['hyp'][:160]}", flush=True)
            bester = open(pfad, "rb").read()   # bisher besten Take aufheben – eine Neuaufnahme kann auch schlechter werden
            try: aufnehmen(e)
            except BaseException as ex: print("Neuaufnahme nicht möglich:", ex); break
            verbraucht += len(e["text"]); versuche += 1
            q2 = pruefen(wm, f, ziel)
            if guete(q2) >= guete(q): q = q2
            else: open(pfad, "wb").write(bester); print("  neuer Take schlechter – alter bleibt", flush=True)
        q["nachgeholt"] = versuche; qa[f] = q
        if not q["ok"]: print(f"WEITER AUFFÄLLIG: {f} ratio={q['ratio']} verrat={q['verrat']} hörte: {q['hyp'][:160]}", flush=True)
        if len(qa) % 50 == 0: json.dump(qa, open(os.path.join(HIER, "qa-de.json"), "w"), ensure_ascii=False)
    json.dump(qa, open(os.path.join(HIER, "qa-de.json"), "w"), ensure_ascii=False)
    schlecht = [f for f, q in qa.items() if not q["ok"]]
    print(f"Hörprüfung: {len(qa)} geprüft, {len(schlecht)} auffällig, {verbraucht} Zeichen nachgeholt")
    sichern(f"Hörbuch: Hörprüfung ({len(schlecht)} auffällig, {verbraucht} Zeichen nachgeholt)")

if __name__ == "__main__":
    main()
