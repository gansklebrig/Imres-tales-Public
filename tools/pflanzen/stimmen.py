#!/usr/bin/env python3
"""Tierstimmen für Friedrichs Waldbuch holen (läuft im GitHub-Ablauf waldbuch-stimmen.yml).

Für jedes Tier aus SUCHE werden frei lizenzierte Tonaufnahmen auf Wikimedia Commons gesucht
(Volltextsuche nach dem wissenschaftlichen Namen + Ruf-Stichwort, nur Audiodateien), die beste
nach Titel/Beschreibung bewertet, mit ffmpeg auf höchstens 18 Sekunden gekürzt, in der Lautheit
angeglichen und als MP3 unter pflanzen/stimmen/<id>.mp3 abgelegt.
pflanzen/stimmen.json enthält zu jeder Aufnahme Urheber, Lizenz, Quelle und eine Beschreibung.

Bereits geholte Tiere werden übersprungen – außer sie stehen in stimmen-neu.txt.
"""
import html, json, os, re, subprocess, sys, tempfile, time, urllib.parse, urllib.request

UA = "ImresTalesWaldbuch/1.0 (https://imrestales.de; GitHub Actions) python-urllib"
API = "https://commons.wikimedia.org/w/api.php"
HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.abspath(os.path.join(HIER, "..", ".."))
ZIEL = os.path.join(WURZEL, "pflanzen", "stimmen")
META = os.path.join(WURZEL, "pflanzen", "stimmen.json")
NEU = os.path.join(HIER, "stimmen-neu.txt")
os.makedirs(ZIEL, exist_ok=True)

# id: (wissenschaftlicher Name, was zu hören sein soll (de), Suchwörter, gute Stichwörter im Titel)
SUCHE = {
    "reh": ("Capreolus capreolus", "Schreckbellen", ["Capreolus capreolus", "roe deer bark", "Reh bellt", "roe deer call"], ["roe deer", "reh"], ["bark", "bell", "alarm", "call", "ruf", "schreck"]),
    "rothirsch": ("Cervus elaphus", "Röhren in der Brunft", ["Cervus elaphus", "red deer roar", "Hirsch röhrt"], ["red deer", "hirsch", "rothirsch"], ["roar", "rut", "röhr", "roehr", "brunft", "bell", "call"]),
    "wildschwein": ("Sus scrofa", "Grunzen", ["Sus scrofa", "wild boar grunt", "Wildschwein"], ["wild boar", "wildschwein"], ["grunt", "grunz", "call"]),
    "gaemse": ("Rupicapra rupicapra", "Warnpfiff", ["Rupicapra rupicapra", "chamois", "Gämse"], ["chamois", "gämse", "gemse"], ["whistle", "pfiff", "alarm", "call"]),
    "fuchs": ("Vulpes vulpes", "Bellen und Keckern", ["Vulpes vulpes", "red fox bark"], ["red fox", "fuchs"], ["bark", "bell", "scream", "call", "vocal"]),
    "dachs": ("Meles meles", "Grunzen und Keckern", ["Meles meles", "European badger"], ["european badger", "dachs"], ["call", "grunt", "vocal", "sound"]),
    "feldhase": ("Lepus europaeus", "Klagen", ["Lepus europaeus", "European hare", "brown hare"], ["european hare", "brown hare", "feldhase"], ["call", "sound", "scream"]),
    "eichhoernchen": ("Sciurus vulgaris", "Schimpfen", ["Sciurus vulgaris", "Eurasian red squirrel", "Eichhörnchen"], ["eurasian red squirrel", "eichhörnchen"], ["call", "alarm", "chatter", "scold", "sound"]),
    "baummarder": ("Martes martes", "Keckern", ["Martes martes", "pine marten", "Baummarder"], ["pine marten", "baummarder"], ["call", "sound", "vocal"]),
    "luchs": ("Lynx lynx", "Ranzruf", ["Lynx lynx", "Eurasian lynx", "Luchs"], ["eurasian lynx", "luchs"], ["call", "mating", "sound", "vocal"]),
    "wolf": ("Canis lupus", "Heulen", ["Canis lupus howl", "wolf howl", "wolves howling", "Wolfsgeheul"], ["wolf howl", "wolves howl", "wolf howling", "wolfsgeheul", "heulen"], ["howl", "heul", "call"]),
    "biber": ("Castor fiber", "Fiepen und Nagen", ["Castor fiber", "Eurasian beaver", "Biber"], ["eurasian beaver", "biber"], ["call", "sound", "kit", "vocal"]),
    "fischotter": ("Lutra lutra", "Pfeifen", ["Lutra lutra", "Eurasian otter", "Fischotter"], ["eurasian otter", "fischotter"], ["call", "whistle", "sound", "vocal"]),
    "igel": ("Erinaceus europaeus", "Schnaufen", ["Erinaceus europaeus", "hedgehog", "Igel"], ["hedgehog", "hegehog", "igel"], ["sound", "snuff", "huff", "call", "sleep"]),
    "murmeltier": ("Marmota marmota", "Warnpfiff", ["Marmota marmota", "Alpine marmot", "Murmeltier"], ["alpine marmot", "murmeltier"], ["whistle", "pfiff", "alarm", "call"]),
    "waschbaer": ("Procyon lotor", "Keckern und Fauchen", ["Procyon lotor", "raccoon", "Waschbär"], ["raccoon", "waschbär"], ["call", "sound", "vocal"]),
    "buntspecht": ("Dendrocopos major", "Trommeln", ["Dendrocopos major drumming", "Dendrocopos major"], ["great spotted woodpecker", "buntspecht"], ["drum", "trommel", "call", "song"]),
    "waldkauz": ("Strix aluco", "Revierruf „Hu-huhuhuu“", ["Strix aluco"], ["tawny owl", "waldkauz"], ["song", "call", "hoot", "ruf", "territorial"]),
}
FREI = re.compile(r"^(cc0|public domain|pd|cc[ -]by(-sa)?( \d\.\d)?|cc[ -]by(-sa)?[ -]\d\.\d.*|gfdl.*|attribution.*|copyrighted free use)", re.I)
SCHLECHT = ["spectrogram", "sonagram", "sonogram", "playback", "imitation", "imitat", "lecture", "vortrag", "interview", "song by", "music", "musik",
            "remix", "ringtone", "captive", "zoo", "orchestra", "festival", "carnaval", "fundación", "congress", "rep. ", "speech", "tamiasciurus", "american", "fennec", "pet ", "haustier", "domestic", "hausschwein", "dog", "hund", "pronunciation", "aussprache"]


def hole(url, daten=None, versuche=6):
    for i in range(versuche):
        try:
            req = urllib.request.Request(url, data=daten, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:  # noqa
            print("   Fehler", e, "– neuer Versuch", file=sys.stderr)
            time.sleep(4 * (i + 1) ** 2)
    raise RuntimeError("nicht ladbar: " + url)


def api(**p):
    p.update(format="json", formatversion="2")
    time.sleep(0.3)
    return json.loads(hole(API, daten=urllib.parse.urlencode(p).encode()))


def text(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def kandidaten(id_, wiss, suchen, namen, gut):
    titel = {}
    for q in suchen:
        for zusatz in ("filetype:audio", "filemime:audio/ogg", "filemime:audio/mpeg", "filemime:audio/x-wav"):
            try:
                r = api(action="query", list="search", srsearch=q + " " + zusatz, srnamespace=6, srlimit=40)
            except Exception as e:  # noqa
                print("  Suche fehlgeschlagen", q, e, file=sys.stderr)
                continue
            for h in r.get("query", {}).get("search", []):
                titel[h["title"]] = 1
    titel = list(titel)
    if not titel:
        return []
    info = {}
    for i in range(0, len(titel), 40):
        teil = titel[i:i + 40]
        r = api(action="query", titles="|".join(teil), prop="imageinfo", iiprop="url|size|mime|extmetadata",
                iiextmetadatafilter="LicenseShortName|LicenseUrl|Artist|ImageDescription|ObjectName", iiextmetadatalanguage="de")
        for p in r.get("query", {}).get("pages", []):
            if p.get("imageinfo"):
                info[p["title"]] = p["imageinfo"][0]
    aus = []
    wl = wiss.lower()
    for t, i in info.items():
        mime = i.get("mime", "")
        if not mime.startswith("audio/") and mime not in ("application/ogg", "video/webm"):
            continue
        em = i.get("extmetadata", {})
        g = lambda k: (em.get(k) or {}).get("value", "")  # noqa
        lizenz = text(g("LicenseShortName"))
        if not FREI.match(lizenz) or "nc" in lizenz.lower().split("-") or "nd" in lizenz.lower().split("-"):
            continue
        beschr = text(g("ImageDescription"))[:400]
        such = (t + " " + beschr).lower()
        # Der volle wissenschaftliche Name oder ein eindeutiger Trivialname muss vorkommen
        if wl not in such and not any(n in t.lower() for n in namen):
            continue
        if any(s in such for s in SCHLECHT) or re.match(r"^(file|datei):[a-z]{2,3}-", t.lower()):
            continue
        punkte = 0.0
        punkte += sum(3 for w in gut if w in such)
        if "xeno-canto" in such or "xc" in t.lower():
            punkte += 1.5
        if "wild" in such or "free" in such or "nature" in such:
            punkte += 0.5
        dauer = i.get("duration") or 0
        groesse = i.get("size", 0)
        if groesse < 15000:
            continue
        aus.append({"titel": t, "url": i["url"], "mime": mime, "p": punkte, "dauer": dauer, "groesse": groesse,
                    "autor": text(g("Artist"))[:140] or "unbekannt", "lizenz": lizenz, "lizenzurl": g("LicenseUrl"),
                    "quelle": i.get("descriptionurl", ""), "beschr": beschr[:240]})
    aus.sort(key=lambda x: (-x["p"], x["groesse"]))
    return aus


def schneiden(roh, ziel):
    """Lauteste Stelle finden, 18 s drumherum ausschneiden, Lautheit angleichen, MP3 mono."""
    # Dauer und lautesten Abschnitt grob über astats je Sekunde bestimmen
    start = 0.0
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", roh],
                             capture_output=True, text=True, timeout=60).stdout.strip()
        dauer = float(out or 0)
    except Exception:  # noqa
        dauer = 0
    if dauer > 20:
        r = subprocess.run(["ffmpeg", "-v", "info", "-i", roh, "-af", "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level", "-f", "null", "-"],
                           capture_output=True, text=True, timeout=300).stderr
        werte = [float(x) for x in re.findall(r"RMS_level=(-?[\d.]+|-inf)", r) if x != "-inf"]
        if werte:
            n = len(werte)
            fenster = max(1, int(n * 16 / dauer))
            best, bi = -1e9, 0
            for k in range(0, max(1, n - fenster)):
                s = sum(werte[k:k + fenster])
                if s > best:
                    best, bi = s, k
            start = max(0.0, bi / n * dauer - 1.0)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(start), "-t", "18", "-i", roh, "-ac", "1", "-ar", "44100",
                    "-af", "highpass=f=60,loudnorm=I=-18:TP=-2:LRA=11,afade=t=in:d=0.4,afade=t=out:st=17.2:d=0.8",
                    "-b:a", "80k", ziel], check=True, timeout=300)


def main():
    meta = json.load(open(META)) if os.path.exists(META) else {}
    neu = set()
    if os.path.exists(NEU):
        neu = {z.strip() for z in open(NEU) if z.strip() and not z.startswith("#")}
    for id_, (wiss, was, suchen, namen, gut) in SUCHE.items():
        if id_ in meta and id_ not in neu and os.path.exists(os.path.join(ZIEL, meta[id_]["f"])):
            continue
        print("•", id_, wiss)
        k = kandidaten(id_, wiss, suchen, namen, gut)
        print("  ", len(k), "Kandidaten", [x["titel"] for x in k[:4]])
        if not k and id_ in meta:  # alte (falsche) Aufnahme verwerfen
            try: os.remove(os.path.join(ZIEL, meta[id_]["f"]))
            except OSError: pass
            del meta[id_]
        for c in k[:5]:
            try:
                daten = hole(c["url"])
                with tempfile.NamedTemporaryFile(suffix=os.path.splitext(c["url"])[1] or ".ogg", delete=False) as f:
                    f.write(daten)
                    roh = f.name
                datei = id_ + ".mp3"
                schneiden(roh, os.path.join(ZIEL, datei))
                os.unlink(roh)
                meta[id_] = {"f": datei, "was": was, "titel": c["titel"].split(":", 1)[1], "autor": c["autor"], "lizenz": c["lizenz"],
                             "lizenzurl": c["lizenzurl"], "quelle": c["quelle"], "beschr": c["beschr"]}
                print("   ✓", c["titel"])
                break
            except Exception as e:  # noqa
                print("   ✗", c["titel"], e, file=sys.stderr)
        json.dump(meta, open(META, "w"), ensure_ascii=False, indent=1, sort_keys=True)
    print("fertig:", len(meta), "Stimmen")


if __name__ == "__main__":
    main()
