#!/usr/bin/env python3
"""Hörbuch-Skript (skript-de.md) → Struktur (struktur-de.json) und Lesetext für inhalt.js.

Ein Absatz der Website = ein „Block“: ein Erzählabsatz mit den Repliken, die direkt folgen.
Kurze Überleitungen („Gundren sah ihn starr an:“) bleiben im Block, damit der Wortwechsel
in einer Aufnahme ohne Lücke zwischen zwei Dateien läuft.

  python3 tools/hoerbuch/struktur.py            # struktur-de.json schreiben
  python3 tools/hoerbuch/struktur.py --inhalt   # zusätzlich Kapitel I/II + Vorwort in inhalt.js ersetzen
"""
import hashlib, json, os, re, subprocess, sys

WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HIER = os.path.join(WURZEL, "tools/hoerbuch")

# Rolle im Skript → Rolle in der Produktion (Stimme siehe besetzung.json)
ROLLEN = {
    "Barradin": "barradin", "Friedrich": "friedrich", "Echo": "echo", "Ezekiel": "ezekiel",
    "Gundren": "gundren", "Nundro": "nundro", "Glasstab": "glasstab", "Ilvara": "ilvara", "Nezna": "nezna",
    "Harbin": "harbin", "Dolgrimson": "dolgrimson", "Fagas": "fagas", "Kardal": "kardal", "Horga": "horga",
    "Hgraam": "hgraam", "Riese": "riese", "Rasender Riese": "riese", "Gartokkar": "gartokkar",
    "Themberchaud": "themberchaud", "Venomfang": "venomfang", "Zilda": "zilda", "Ploopploopeen": "ploop",
    "Goblin": "goblin", "Schurke": "schlaeger", "Wache": "schlaeger", "Bewahrer": "schlaeger",
    "Wirt": "dorf", "Alter Mann": "dorf", "Händler": "dorf", "Goldschmied": "dorf",
    "Frau": "frau", "Junge": "junge", "Erzpriesterin": "erzpriesterin", "Gefangener": "gefangener", "Stimme": "fluestern",
}

GESEHEN = {}
def sid(kap, rolle, text):
    """Stabile ID aus Rolle und Text; Wiederholungen derselben Zeile bekommen -2, -3 …"""
    i = kap + "-" + hashlib.sha1((rolle + "|" + text).encode()).hexdigest()[:8]
    GESEHEN[i] = GESEHEN.get(i, 0) + 1
    return i if GESEHEN[i] == 1 else f"{i}-{GESEHEN[i]}"

def lesen():
    t = open(os.path.join(HIER, "skript-de.md")).read()
    teile = [p.strip() for p in t.split("\n\n") if p.strip()]
    kap, aus, block, hinweise = "vorab", {"vorab": [], "I": [], "II": []}, None, []
    letzte = None   # "erz" | "rede"
    def schliessen():
        nonlocal block
        if block and block["segmente"]: aus[kap].append(block)
        block = None
    for p in teile:
        if p.startswith("# "):
            schliessen()
            if "Kapitel II" in p: kap = "II"
            continue
        if p.startswith("### "):
            schliessen()
            titel = p[4:].strip()
            if titel == "Vorwort": continue
            if kap == "vorab": kap = "I"
            aus[kap].append({"typ": "titel", "text": "## " + titel})
            letzte = None; continue
        m = re.match(r"^\*\((.*)\)\*$", p, re.S)
        if m:
            hinweise.append(re.sub(r"^Geräusch:\s*", "", m.group(1)).strip()); continue
        m = re.match(r"^\*\*([^*]+):\*\* (.*)$", p, re.S)
        if m:
            name, text = m.group(1).strip(), m.group(2).strip()
            rolle = ROLLEN[name]
            text = re.sub(r'^[„"]|["“]$', "", text).strip()
            if block is None: block = {"typ": "text", "segmente": []}
            seg = {"id": sid(kap, rolle, text), "rolle": rolle, "figur": name, "text": text}
            if hinweise: seg["geraeusch"] = hinweise; hinweise = []
            block["segmente"].append(seg); letzte = "rede"; continue
        # Erzähler
        kurz = len(p) <= 160 and p.rstrip().endswith(":")
        if block is None or not (letzte == "rede" and kurz) or sum(len(s["text"]) for s in block["segmente"]) > 1800:
            schliessen(); block = {"typ": "text", "segmente": []}
        seg = {"id": sid(kap, "erzaehler", p), "rolle": "erzaehler", "figur": "Erzähler", "text": p}
        if hinweise: seg["geraeusch"] = hinweise; hinweise = []
        block["segmente"].append(seg); letzte = "erz"
    schliessen()
    return aus

def lesetext(block):
    """Erzähler als Prosa, Figuren als wörtliche Rede; Sprecherwechsel ohne Überleitung → neue Zeile."""
    out = ""
    for s in block["segmente"]:
        if s["rolle"] == "erzaehler":
            out += ("<br>" if out else "") + s["text"]
        else:
            rede = "„" + s["text"] + "“"
            out += (" " if out.rstrip().endswith(":") else ("<br>" if out else "")) + rede
    return out

def inhalt_lesen():
    js = subprocess.check_output(["node", "-e", "global.window={};eval(require('fs').readFileSync('inhalt.js','utf8'));process.stdout.write(JSON.stringify(window.INHALT))"], cwd=WURZEL)
    return json.loads(js)

def woerter(s): return set(w for w in re.findall(r"[a-zäöüß]{4,}", re.sub(r"<[^>]+>", "", s).lower()))

def bilder_einsetzen(neu, alt_abs):
    """Bilder aus dem alten Kapitel an die passende Stelle im neuen setzen (nach dem ähnlichsten Absatz im selben Abschnitt)."""
    abschnitt, vor = None, None
    plaetze = []   # (abschnitt, vorheriger Text, bildzeile)
    for a in alt_abs:
        if a.startswith("## "): abschnitt = a[3:].strip(); vor = None; continue
        if a.startswith("!"): plaetze.append((abschnitt, vor, a)); continue
        vor = a
    # neue Abschnitte indizieren
    erg = list(neu)
    for abschnitt, vor, bild in plaetze:
        start = next(i for i, e in enumerate(erg) if e.get("typ") == "titel" and e["text"][3:].strip() == abschnitt)
        ende = next((i for i in range(start + 1, len(erg)) if erg[i].get("typ") == "titel"), len(erg))
        if vor is None: pos = start + 1
        else:
            wv = woerter(" ".join(re.sub(r"<[^>]+>", " ", vor).split()[-25:])); best, pos = -1, ende
            for i in range(start + 1, ende):
                if erg[i].get("typ") != "text": continue
                w = woerter(lesetext(erg[i])); sc = len(wv & w) / (len(wv) + 1)
                if sc >= best: best, pos = sc, i + 1
            while pos < ende and erg[pos].get("typ") == "bild": pos += 1
        erg.insert(pos, {"typ": "bild", "text": bild})
    # Reihenfolge der Bilder je Abschnitt wie im Original
    reihen = [p[2] for p in plaetze]
    pos = [i for i, e in enumerate(erg) if e.get("typ") == "bild"]
    abschn = []
    for i in pos:
        t = next(erg[j]["text"] for j in range(i, -1, -1) if erg[j].get("typ") == "titel"); abschn.append(t)
    for t in set(abschn):
        ps = [i for i, a in zip(pos, abschn) if a == t]
        bs = sorted((erg[i]["text"] for i in ps), key=reihen.index)
        for i, b in zip(ps, bs): erg[i] = {"typ": "bild", "text": b}
    return erg

def main():
    aus = lesen()
    I = inhalt_lesen()
    for k in I["kapitel"]:
        if k["nummer"] in ("I", "II"):
            aus[k["nummer"]] = bilder_einsetzen(aus[k["nummer"]], k["absaetze"])
    json.dump(aus, open(os.path.join(HIER, "struktur-de.json"), "w"), ensure_ascii=False, indent=1)
    n = {k: sum(1 for e in v if e.get("typ") == "text") for k, v in aus.items() if k != "vorab"}
    segs = [s for k in ("I", "II") for e in aus[k] if e.get("typ") == "text" for s in e["segmente"]] + [s for b in aus["vorab"] for s in b["segmente"]]
    print("Blöcke", n, "Segmente", len(segs), "Zeichen", sum(len(s["text"]) for s in segs))
    if "--inhalt" in sys.argv:
        quelle = open(os.path.join(WURZEL, "inhalt.js")).read()
        for nr in ("I", "II"):
            absaetze = [e["text"] if e["typ"] != "text" else lesetext(e) for e in aus[nr]]
            # Array „absaetze“ des Kapitels ersetzen
            m = re.search(r'nummer:\s*"%s",' % nr, quelle)
            a0 = quelle.index("absaetze: [", m.end()); a1 = a0 + len("absaetze: [")
            tiefe, i = 1, a1
            while tiefe:
                c = quelle[i]
                if c == '"':
                    i += 1
                    while quelle[i] != '"': i += 2 if quelle[i] == "\\" else 1
                elif c == "[": tiefe += 1
                elif c == "]": tiefe -= 1
                i += 1
            neu = "absaetze: [\n" + ",\n".join("        " + json.dumps(a, ensure_ascii=False) for a in absaetze) + "\n      ]"
            quelle = quelle[:a0] + neu + quelle[i:]
        vorw = lesetext(aus["vorab"][0])
        m = re.search(r'(erzaehler:\s*\{[^}]*?text:\s*)"((?:[^"\\]|\\.)*)"', quelle, re.S)
        quelle = quelle[:m.start(2) - 1] + json.dumps(vorw, ensure_ascii=False) + quelle[m.end(2) + 1:]
        open(os.path.join(WURZEL, "inhalt.js"), "w").write(quelle)
        print("inhalt.js aktualisiert")

if __name__ == "__main__":
    main()
