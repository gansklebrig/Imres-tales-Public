#!/usr/bin/env python3
"""Fertig gemischte Hörspiel-Spuren je Abschnitt (Stimme + Kulisse + Effekte + Musik in EINER Datei).

Warum: Bei gesperrtem Handy drosselt der Browser Timer und Rechenzeit – das live gemischte Hörspiel
(chronik/hoerspiel.js) kommt dann ins Stolpern. Eine fertige Spur pro Abschnitt spielt das Handy wie
jede Musikdatei ab, ohne Rechenarbeit im Hintergrund. Der Player (chronik/vorlesen.js) nutzt sie,
solange das Hörspiel mit Standard-Pegeln läuft.

  python3 tools/hoerbuch/mix.py [vorab I II]
Ergebnis: audio/chronik/de/mix/<kap>-<nr>-<hash>.mp3 und audio/chronik/de/mix/manifest.json
  {"absaetze": {"I:12": {"datei": "...", "ab": 41.3, "bis": 63.0}, …}}
"""
import hashlib, json, os, re, subprocess, sys
WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ZIEL = "audio/chronik/de/mix"
TMP = os.environ.get("TMPDIR", "/tmp")
NACHLAUF = 1.4   # Sekunden Ausklang nach dem letzten Absatz einer Spur

def main():
    kapitel = sys.argv[1:] or ["vorab", "I", "II"]
    m = json.load(open(os.path.join(WURZEL, "audio/chronik/de/manifest.json")))
    mp = os.path.join(WURZEL, ZIEL, "manifest.json")
    alt = json.load(open(mp)) if os.path.exists(mp) else {"absaetze": {}}
    os.makedirs(os.path.join(WURZEL, ZIEL), exist_ok=True)
    absaetze = {k: v for k, v in alt["absaetze"].items() if k.split(":")[0] not in kapitel}
    for kap in kapitel:
        L = m["kapitel"][kap]
        gruppen, cur = [], []
        for e in L:
            if e.get("titel") and cur: gruppen.append(cur); cur = []
            cur.append(e)
        if cur: gruppen.append(cur)
        for n, g in enumerate(gruppen, 1):
            spec = ",".join(f"{kap}:{e['i']}" for e in g)
            flags = []
            if n > 1: flags.append("--ohne-thema")
            if n == len(gruppen) and kap != "vorab": flags.append("--ende")
            h = hashlib.sha1((spec + "|" + "|".join(e["datei"] for e in g) + "|" + " ".join(flags) + "|" +
                              hashlib.sha1(open(os.path.join(WURZEL, "chronik/hoerspiel-de.json"), "rb").read()).hexdigest()).encode()).hexdigest()[:10]
            datei = f"{ZIEL}/{kap}-{n:02d}-{h}.mp3"
            log = os.path.join(TMP, f"mix-{kap}-{n}.log")
            if not os.path.exists(os.path.join(WURZEL, datei)) or not os.path.exists(log):
                r = subprocess.run(["python3", "tools/vertonung/hoerspiel-werkzeug.py", "probe", os.path.join(WURZEL, datei), spec] + flags,
                                   cwd=WURZEL, capture_output=True, text=True, env=dict(os.environ, MIX_BITRATE="128k"))
                open(log, "w").write(r.stdout + r.stderr)
                if r.returncode or not os.path.exists(os.path.join(WURZEL, datei)): sys.exit(f"Fehler bei {spec}:\n{r.stdout[-800:]}{r.stderr[-800:]}")
            zeiten = [(mm.group(1), float(mm.group(2)), float(mm.group(3))) for mm in re.finditer(r"Absatz (\S+) ab\s+([\d.]+)s \(\s*([\d.]+)s\)", open(log).read())]
            # Spur-Ende kürzen: nach dem letzten Wort höchstens NACHLAUF s (sonst summiert sich mit dem Anfang der
            # nächsten Spur eine zu lange Pause zwischen den Abschnitten); das Kapitelende (Cliffhanger) bleibt ganz
            if "--ende" not in flags and zeiten:
                ende = zeiten[-1][1] + zeiten[-1][2] + NACHLAUF
                pfad = os.path.join(WURZEL, datei)
                dauer = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", pfad]))
                if dauer > ende + .3:
                    tmp = pfad + ".tmp.mp3"
                    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pfad, "-t", f"{ende:.2f}", "-af", f"afade=t=out:st={ende - 1.0:.2f}:d=1.0",
                                    "-b:a", "128k", tmp], check=True)
                    os.replace(tmp, pfad)
            for j, (key, ab, d) in enumerate(zeiten):
                bis = zeiten[j + 1][1] if j + 1 < len(zeiten) else ab + d + 30
                absaetze[key] = {"datei": datei, "ab": round(ab, 2), "bis": round(bis, 2)}
            print(kap, n, len(g), "Absätze", datei, flush=True)
        # alte Spuren des Kapitels entfernen
        genutzt = {v["datei"] for v in absaetze.values()}
        for f in os.listdir(os.path.join(WURZEL, ZIEL)):
            if f.startswith(kap + "-") and f.endswith(".mp3") and f"{ZIEL}/{f}" not in genutzt: os.remove(os.path.join(WURZEL, ZIEL, f))
    json.dump({"absaetze": absaetze}, open(mp, "w"), ensure_ascii=False, indent=0)

if __name__ == "__main__":
    main()
