#!/usr/bin/env python3
"""Fotos für Friedrichs Waldbuch holen (läuft im GitHub-Ablauf pflanzen-fotos.yml).

Für jede Art aus arten.json werden frei lizenzierte Fotos von Wikimedia Commons gesucht
(Kategorie der Art + Unterkategorien wie „leaves“, „bark“, „fruits“ + Bilder des deutschen
Wikipedia-Artikels), nach Ansicht sortiert (Wuchs, Blatt, Rinde, Blüte, Frucht, Knospe,
Unterseite, Schnitt, Spur …), verkleinert und als WebP unter pflanzen/bilder/ abgelegt.
pflanzen/bilder.json enthält zu jedem Bild Urheber, Lizenz und Quelle.

Bereits geholte Arten werden übersprungen – außer sie stehen in neu.txt.
overrides.json: {"id": {"cat": "Category:…", "plus": ["Datei.jpg"], "minus": ["Datei.jpg"]}}
"""
import html, io, json, math, os, re, sys, time, urllib.parse, urllib.request

UA = "ImresTalesWaldbuch/1.0 (https://imrestales.de; GitHub Actions) python-urllib"
API = "https://commons.wikimedia.org/w/api.php"
WAPI = "https://de.wikipedia.org/w/api.php"
HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.abspath(os.path.join(HIER, "..", ".."))
ZIEL = os.path.join(WURZEL, "pflanzen", "bilder")
META = os.path.join(WURZEL, "pflanzen", "bilder.json")
os.makedirs(ZIEL, exist_ok=True)

from PIL import Image  # noqa: E402


def hole(url, daten=None, versuche=6):
    for i in range(versuche):
        try:
            req = urllib.request.Request(url, data=daten, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except Exception as e:  # noqa
            print("   Fehler", e, "– neuer Versuch", file=sys.stderr)
            time.sleep(4 * (i + 1) ** 2)
    raise RuntimeError("nicht ladbar: " + url)


def api(base=API, **p):
    p.update(format="json", formatversion="2")
    time.sleep(0.25)
    return json.loads(hole(base, daten=urllib.parse.urlencode(p).encode()))


def text(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


KW = {
    "blatt": ["leaf", "leaves", "blatt", "blätter", "blaetter", "folium", "folia", "foliage", "needle", "nadeln", "nadel", "wedel", "frond"],
    "rinde": ["bark", "rinde", "borke", "trunk", "stamm", "cortex"],
    "bluete": ["flower", "blüte", "bluete", "blossom", "bloom", "inflorescence", "flos ", "flores", "catkin", "kätzchen", "kaetzchen", "anthesis", "blühend"],
    "frucht": ["fruit", "frucht", "früchte", "fruechte", "berry", "berries", "beere", "nut ", "nuts", "nuss", "nüsse", "seed", "samen", "cone", "zapfen", "acorn", "eichel", "buchecker", "beechnut", "hips", "hagebutte", "samara", "drupe"],
    "knospe": ["bud", "buds", "knospe", "knospen", "winter twig", "twig in winter", "zweig im winter"],
    "habitus": ["tree", "baum", "habit", "habitus", "solitary", "specimen", "wuchs", "crown", "krone", "in autumn", "im herbst", "bush", "strauch", "hedge", "plant ", "pflanze", "bestand", "colony", "kolonie", "carpet", "teppich", "meadow", "wiese"],
    "unterseite": ["gill", "lamell", "underside", "unterseite", "pore", "röhren", "roehren", "tubes", "hymeni", "spines", "stacheln", "ridges", "leisten", "unten", "below", "bottom"],
    "schnitt": ["cut", "section", "schnitt", "sliced", "bruis", "verfärb", "halbiert", "halved"],
    "jung": ["young", "jung", "juvenile", "button", "primordi"],
    "spur": ["track", "footprint", "foot print", "spur", "spuren", "fährte", "faehrte", "trittsiegel", "pawprint", "paw print", "pfotenabdruck"],
    "zeichen": ["scat", "dropping", "losung", "kot", "feces", "faeces", "dung", "latrine", "pellet", "gewölle", "fraß", "frass", "feeding", "gnaw", "nage", "dam ", "damm", "lodge", "burg", "anvil", "schmiede", "bau ", "burrow", "sett", "suhle", "wallow", "fegestelle"],
}
NEIN_TEIL = ["herbar", "verbreitung", "distribution", "briefmarke", "wappen", "coat of arms", "illustration", "zeichnung",
        "drawing", "köhler", "koehler", "thomé", "lindman", "flora von", "botanical", "botanisch", "microscop", "mikroskop",
        "micrograph", "pollen", "spore print", "cultivar", "cv.", "bonsai", "museum", "taxiderm", "präparat", "praeparat",
        "skull", "schädel", "skelett", "skeleton", "roadkill", "überfahren", "carcass", "kadaver", "trophy", "trophäe",
        "hunting", "erlegt", "×", "hybrid", "postcard", "postkarte", "painting", "gemälde", "sculpture", "statue",
        "diagram", "holzprobe", "furnier", "veneer", "timber", "furniture", "möbel", "recipe", "rezept", "getrocknet",
        "x-ray", "röntgen", "chromosom", "aquarell", "watercolor", "engraving", "lithograph", "wikidata", "verbreitungskarte"]
NEIN_WORT = ["map", "karte", "stamp", "coin", "logo", "plate", "tafel", "sem", "dead", "tot", "toter", "tote", "jagd", "hunted",
        "shot", "x", "label", "scan", "book", "page", "dish", "market", "markt", "dried", "tea", "tee", "oil", "illu", "icon",
        "symbol", "svg", "stich", "sturm", "thome"]
NEIN_RE = re.compile(r"(?<![a-zäöüß])(" + "|".join(re.escape(w) for w in NEIN_WORT) + r")(?![a-zäöüß])")


def schlecht(s):
    s = s.lower().replace("_", " ")
    return any(n in s for n in NEIN_TEIL) or bool(NEIN_RE.search(s))


def aspekte_von(s):
    s = " " + s.lower() + " "
    return {a for a, ws in KW.items() if any(w in s for w in ws)}


WUNSCH = {
    "baum": ["habitus", "blatt", "rinde", "frucht", "bluete", "knospe"],
    "strauch": ["habitus", "blatt", "bluete", "frucht", "rinde", "knospe"],
    "beere": ["habitus", "frucht", "bluete", "blatt"],
    "kraut": ["habitus", "bluete", "blatt", "frucht"],
    "blume": ["habitus", "bluete", "blatt", "frucht"],
    "farn": ["habitus", "blatt", "frucht", "bluete"],
    "pilz": ["habitus", "unterseite", "schnitt", "jung"],
    "tier": ["habitus", "spur", "zeichen"],
}
ANZAHL = {"pilz": 5, "tier": 5}


def kategorie_dateien(kat, limit=200):
    out, cont = [], {}
    while len(out) < limit:
        r = api(action="query", list="categorymembers", cmtitle=kat, cmtype="file", cmlimit=min(200, limit), **cont)
        out += [m["title"] for m in r.get("query", {}).get("categorymembers", [])]
        if "continue" not in r:
            break
        cont = {"cmcontinue": r["continue"]["cmcontinue"]}
    return out[:limit]


def unterkategorien(kat):
    r = api(action="query", list="categorymembers", cmtitle=kat, cmtype="subcat", cmlimit=80)
    return [m["title"] for m in r.get("query", {}).get("categorymembers", [])]


def wiki_bilder(titel):
    try:
        r = api(WAPI, action="query", titles="|".join(titel), redirects=1, prop="pageimages|images", piprop="name", imlimit=60)
    except Exception:  # noqa
        return None, []
    haupt, alle = None, []
    for p in r.get("query", {}).get("pages", []):
        if p.get("missing"):
            continue
        if not haupt and p.get("pageimage"):
            haupt = "File:" + p["pageimage"].replace("_", " ")
        alle += [i["title"].replace("Datei:", "File:") for i in p.get("images", [])]
        if haupt:
            break
    return haupt, alle


def infos(titel):
    out = {}
    for i in range(0, len(titel), 45):
        teil = titel[i:i + 45]
        r = api(action="query", titles="|".join(teil), prop="imageinfo", iiprop="url|size|mime|extmetadata", iiurlwidth=960,
                iiextmetadatafilter="LicenseShortName|LicenseUrl|Artist|ImageDescription|Assessments|Credit", iiextmetadatalanguage="de")
        for p in r.get("query", {}).get("pages", []):
            ii = (p.get("imageinfo") or [None])[0]
            if ii:
                out[p["title"]] = ii
    return out


FREI = re.compile(r"^(cc0|public domain|pd|cc[ -]by(-sa)?( \d\.\d)?|cc[ -]by(-sa)?[ -]\d\.\d.*|gfdl.*|attribution.*|copyrighted free use)", re.I)


def art_holen(art, ov):
    kat = ov.get("cat") or ("Category:" + art["wiss"])
    kandidaten = {}  # titel -> set(herkunfts-aspekte)

    def dazu(t, asp=(), herkunft=""):
        t = t.replace("_", " ")
        if not t.startswith("File:"):
            t = "File:" + t
        k = kandidaten.setdefault(t, {"asp": set(), "her": set()})
        k["asp"] |= set(asp)
        if herkunft:
            k["her"].add(herkunft)

    for t in kategorie_dateien(kat, 220):
        dazu(t, herkunft="kat")
    for uk in unterkategorien(kat)[:60]:
        asp = aspekte_von(uk.split(":", 1)[1])
        name = uk.lower()
        if any(w in name for w in ["cultivar", "hybrid", "×", "herbari", "illustration", "drawing", "map", "products", "wood", "dish", "food", "stamps", "in art", "people", "taxiderm", "skull", "skelet", "museum", "zoo", "captivity", "dead", "hunting"]):
            continue
        if not asp and not any(w in name for w in ["in germany", "in bavaria", "in bayern", "deutschland", "austria", "österreich", "in autumn", "in winter", "in spring", "in summer", "habitus", "forma", "subsp", "var."]):
            continue
        for t in kategorie_dateien(uk, 70):
            dazu(t, asp, "uk")
    haupt, wikiliste = wiki_bilder([art["wiss"], art["de"]])
    if haupt:
        dazu(haupt, herkunft="haupt")
    for t in wikiliste[:40]:
        dazu(t, herkunft="wiki")
    for t in ov.get("plus", []):
        dazu(t, herkunft="plus")
    minus = {("File:" + m.replace("_", " ")) if not m.startswith("File:") else m.replace("_", " ") for m in ov.get("minus", [])}

    titel = [t for t in kandidaten if t not in minus and re.search(r"\.(jpe?g|png|webp)$", t, re.I)]
    titel = [t for t in titel if "plus" in kandidaten[t]["her"] or not schlecht(t.split(":", 1)[1].rsplit(".", 1)[0])]
    ii = infos(titel)
    gut = []
    for t in titel:
        i = ii.get(t)
        if not i:
            continue
        em = i.get("extmetadata", {})
        g = lambda k: (em.get(k) or {}).get("value", "")  # noqa
        lizenz = text(g("LicenseShortName"))
        if not FREI.match(lizenz) and "plus" not in kandidaten[t]["her"]:
            continue
        w, h = i.get("width", 0), i.get("height", 0)
        if min(w, h) < 600 and "plus" not in kandidaten[t]["her"]:
            continue
        if i.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        beschr = text(g("ImageDescription"))[:400]
        if any(n in (" " + beschr.lower() + " ") for n in ["herbarium", "illustration", "drawing", "zeichnung", "map of", "verbreitungskarte", "microscop", "mikroskop", "cultivar"]) and "plus" not in kandidaten[t]["her"]:
            continue
        asp = aspekte_von(t.split(":", 1)[1]) | aspekte_von(beschr[:200]) | kandidaten[t]["asp"]
        her = kandidaten[t]["her"]
        punkte = math.log(max(1, w * h)) * 0.6
        if "haupt" in her: punkte += 6
        if "wiki" in her: punkte += 2.2
        if "plus" in her: punkte += 50
        bew = g("Assessments").lower()
        if any(x in bew for x in ["featured", "quality", "poty", "valued"]): punkte += 3.5
        if w >= h: punkte += 0.6
        if w / max(1, h) > 2.6 or h / max(1, w) > 2.2: punkte -= 4
        gut.append({"titel": t, "url": i.get("thumburl") or i["url"], "w": w, "h": h, "asp": asp, "p": punkte,
                    "autor": text(g("Artist"))[:120] or "unbekannt", "lizenz": lizenz, "lizenzurl": g("LicenseUrl"),
                    "quelle": i.get("descriptionurl", ""), "beschr": beschr[:220]})
    gut.sort(key=lambda x: -x["p"])
    wahl, genommen = [], set()
    n = ANZAHL.get(art["kap"], 6)
    # Hauptbild: Artikelbild oder bestes Wuchsbild
    erst = next((x for x in gut if "haupt" in kandidaten[x["titel"]]["her"]), None) or next((x for x in gut if "habitus" in x["asp"]), None) or (gut[0] if gut else None)
    if erst:
        erst = dict(erst); erst["aspekt"] = "haupt"; wahl.append(erst); genommen.add(erst["titel"])
    for a in WUNSCH.get(art["kap"], []):
        if len(wahl) >= n:
            break
        x = next((x for x in gut if a in x["asp"] and x["titel"] not in genommen and len(x["asp"]) <= 2), None) or \
            next((x for x in gut if a in x["asp"] and x["titel"] not in genommen), None)
        if x:
            x = dict(x); x["aspekt"] = a; wahl.append(x); genommen.add(x["titel"])
    for x in gut:
        if len(wahl) >= n:
            break
        if x["titel"] not in genommen:
            x = dict(x); x["aspekt"] = (sorted(x["asp"])[0] if x["asp"] else "weitere"); wahl.append(x); genommen.add(x["titel"])
    return wahl, len(gut)


def speichern(art, wahl):
    eintraege = []
    for k, x in enumerate(wahl, 1):
        try:
            roh = hole(x["url"])
            time.sleep(0.35)
            im = Image.open(io.BytesIO(roh)).convert("RGB")
            im.thumbnail((880, 880), Image.LANCZOS)
            name = "%s-%d.webp" % (art["id"], k)
            im.save(os.path.join(ZIEL, name), "WEBP", quality=72, method=6)
            eintraege.append({"f": name, "a": x["aspekt"], "w": im.width, "h": im.height, "autor": x["autor"], "lizenz": x["lizenz"],
                              "lizenzurl": x["lizenzurl"], "quelle": x["quelle"], "titel": x["titel"], "beschr": x["beschr"]})
        except Exception as e:  # noqa
            print("   Bild übersprungen:", x["titel"], e, file=sys.stderr)
    return eintraege


# ---------- Nachschlag: mehr Referenzfotos je Art (MODUS=mehr) ----------
# Vorhandene, von Hand gesichtete Bilder bleiben unangetastet; es kommen weitere dazu, bis jede Ansicht
# mehrfach vertreten ist (z. B. grüne Sommerblätter UND Herbstlaub, Rinde jung und alt).
ZIEL_N = {"baum": 14, "strauch": 13, "beere": 12, "kraut": 12, "blume": 12, "farn": 10, "pilz": 12, "tier": 12}
QUOTE = {
    "baum": {"habitus": 3, "blatt": 3, "rinde": 2, "frucht": 2, "bluete": 2, "knospe": 2},
    "strauch": {"habitus": 2, "blatt": 3, "bluete": 2, "frucht": 3, "rinde": 1, "knospe": 1},
    "beere": {"habitus": 2, "frucht": 4, "bluete": 3, "blatt": 3},
    "kraut": {"habitus": 3, "bluete": 3, "blatt": 3, "frucht": 1, "jung": 2},
    "blume": {"habitus": 3, "bluete": 4, "blatt": 3, "frucht": 2},
    "farn": {"habitus": 4, "blatt": 4, "frucht": 2},
    "pilz": {"habitus": 5, "unterseite": 3, "schnitt": 2, "jung": 2},
    "tier": {"habitus": 6, "spur": 3, "zeichen": 3},
}
HERBST = ["autumn", "herbst", "fall ", "fall-", "dry", "dried", "droog", " dor ", "dor blad", "withered", "welk", "dead", "winter",
          "herfst", "automne", "otoño", "autunno", "brown leaves", "laubfärbung", "fall colo", "foliage colo", "senescen"]
FREMD_UK = [" and ", " vs", "comparison", "vergleich", "confus", "lookalike", "verwechsl", "insects", "fungi on", "galls", "pests",
            "diseases", "lichens on", "parasit", "uses of", " in use", "products", "wood", "cultivated", "garden", "cultivar", "hybrid"]


def nachschlag_art(art, ov, vorhanden, alle_wiss):
    kat = ov.get("cat") or ("Category:" + art["wiss"])
    kandidaten = {}

    def dazu(t, asp=(), herkunft=""):
        t = t.replace("_", " ")
        if not t.startswith("File:"):
            t = "File:" + t
        k = kandidaten.setdefault(t, {"asp": set(), "her": set()})
        k["asp"] |= set(asp)
        k["her"].add(herkunft)

    dateien, uks = kategorie_dateien(kat, 400), unterkategorien(kat)
    if not dateien and not uks:
        # Kategorie heißt auf Commons anders (neuer/alter Artname) – passende Kategorie suchen
        for such in [art["wiss"], art["wiss"].replace(" ", "-"), art["de"]]:
            r = api(action="query", list="search", srsearch=such, srnamespace=14, srlimit=5)
            treffer = [x["title"] for x in r.get("query", {}).get("search", [])]
            gut_t = [t for t in treffer if not any(w in t.lower() for w in ["illustration", "map", "herbari", "drawing", "stamp"])]
            if gut_t:
                kat = gut_t[0]; print("   Kategorie gefunden:", kat, flush=True)
                dateien, uks = kategorie_dateien(kat, 400), unterkategorien(kat)
                if dateien or uks:
                    break
    for t in dateien:
        dazu(t, herkunft="kat")
    for uk in uks[:80]:
        name = uk.split(":", 1)[1]
        nl = " " + name.lower() + " "
        if any(w in nl for w in ["cultivar", "hybrid", "×", "herbari", "illustration", "drawing", "map", "dish", "food", "stamps", "in art",
                                  "people", "taxiderm", "skull", "skelet", "museum", "zoo", "captivity", "dead", "hunting"] + FREMD_UK):
            continue
        asp = aspekte_von(name)
        if not asp and not any(w in nl for w in ["in germany", "in bavaria", "in bayern", "deutschland", "austria", "österreich", "switzerland",
                                                   "in autumn", "in winter", "in spring", "in summer", "habitus", "forma", "subsp", "var.", "by "]):
            continue
        for t in kategorie_dateien(uk, 120):
            dazu(t, asp, "uk")
    for t in ov.get("plus", []):
        dazu(t, herkunft="plus")
    # gezielte Dateisuche, z. B. {"suche": [["Fagus sylvatica leaves", "blatt"]]}
    for such, asp in ov.get("suche", []):
        r = api(action="query", list="search", srsearch=such, srnamespace=6, srlimit=40)
        for x in r.get("query", {}).get("search", []):
            dazu(x["title"], [asp] if asp else [], "suche")
    minus = {("File:" + m.replace("_", " ")) if not m.startswith("File:") else m.replace("_", " ") for m in ov.get("minus", [])}
    schon = {e.get("titel") for e in vorhanden}
    eigen = art["wiss"].lower()
    fremd = [w for w in alle_wiss if w != eigen and not eigen.startswith(w) and not w.startswith(eigen)]
    titel = [t for t in kandidaten if t not in minus and t not in schon and re.search(r"\.(jpe?g|png|webp)$", t, re.I)]
    titel = [t for t in titel if "plus" in kandidaten[t]["her"] or not schlecht(t.split(":", 1)[1].rsplit(".", 1)[0])]
    titel = [t for t in titel if not any(f in t.lower().replace("_", " ") for f in fremd)]
    ii = infos(titel)
    gut = []
    for t in titel:
        i = ii.get(t)
        if not i:
            continue
        em = i.get("extmetadata", {})
        g = lambda k: (em.get(k) or {}).get("value", "")  # noqa
        lizenz = text(g("LicenseShortName"))
        if not FREI.match(lizenz):
            continue
        w, h = i.get("width", 0), i.get("height", 0)
        if min(w, h) < 700 or i.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        if w / max(1, h) > 2.4 or h / max(1, w) > 2.2:
            continue
        beschr = text(g("ImageDescription"))[:400]
        bl = " " + beschr.lower() + " "
        if any(n in bl for n in ["herbarium", "illustration", "drawing", "zeichnung", "map of", "verbreitungskarte", "microscop", "mikroskop", "cultivar", "zoo ", "captive"]):
            continue
        if any(f in bl for f in fremd):
            continue  # zeigt laut Beschreibung (auch) eine andere Art aus dem Buch
        name = t.split(":", 1)[1]
        asp = aspekte_von(name) | aspekte_von(beschr[:200]) | kandidaten[t]["asp"]
        punkte = math.log(max(1, w * h)) * 0.6
        bew = g("Assessments").lower()
        if any(x in bew for x in ["featured", "quality", "poty", "valued"]):
            punkte += 3.5
        if "uk" in kandidaten[t]["her"]:
            punkte += 0.8
        herbst = any(x in (" " + name.lower() + " " + bl) for x in HERBST)
        gut.append({"titel": t, "url": i.get("thumburl") or i["url"], "w": w, "h": h, "asp": asp, "p": punkte, "herbst": herbst,
                    "autor": text(g("Artist"))[:120] or "unbekannt", "lizenz": lizenz, "lizenzurl": g("LicenseUrl"),
                    "quelle": i.get("descriptionurl", ""), "beschr": beschr[:220]})
    gut.sort(key=lambda x: -x["p"])

    n_ziel = ZIEL_N.get(art["kap"], 12)
    zaehl = {}
    for e in vorhanden:
        a = "habitus" if e["a"] == "haupt" else e["a"]
        zaehl[a] = zaehl.get(a, 0) + 1
    gruen = sum(1 for e in vorhanden if e["a"] == "blatt" and not any(x in (" " + (e.get("titel", "") + " " + e.get("beschr", "")).lower() + " ") for x in HERBST))
    autoren = {}
    for e in vorhanden:
        autoren[e.get("autor")] = autoren.get(e.get("autor"), 0) + 1
    wahl, genommen = [], set()
    frei = lambda x: x["titel"] not in genommen and autoren.get(x["autor"], 0) < 3  # noqa: E731

    def nimm(x, a):
        x = dict(x); x["aspekt"] = a; wahl.append(x); genommen.add(x["titel"])
        autoren[x["autor"]] = autoren.get(x["autor"], 0) + 1
        zaehl[a] = zaehl.get(a, 0) + 1

    platz = lambda: len(vorhanden) + len(wahl) < n_ziel  # noqa: E731
    # Grüne Blätter zuerst – Herbstlaub allein reicht nicht zum Erkennen
    if art["kap"] not in ("pilz", "tier"):
        while gruen < ov.get("gruen", 2) and platz():
            x = next((x for x in gut if frei(x) and "blatt" in x["asp"] and not x["herbst"] and len(x["asp"]) <= 2), None)
            if not x:
                break
            nimm(x, "blatt"); gruen += 1
    for runde in range(4):
        for a, soll in QUOTE.get(art["kap"], {}).items():
            if not platz() or zaehl.get(a, 0) >= soll:
                continue
            x = next((x for x in gut if frei(x) and a in x["asp"] and len(x["asp"]) <= 2), None) or \
                next((x for x in gut if frei(x) and a in x["asp"]), None)
            if x:
                nimm(x, a)
    for x in gut:
        if not platz():
            break
        if frei(x):
            nimm(x, sorted(x["asp"])[0] if x["asp"] else "weitere")
    return wahl, len(gut)


def nachschlag():
    arten = json.load(open(os.path.join(HIER, "arten.json"), encoding="utf-8"))
    ovp = os.path.join(HIER, "overrides.json")
    ov = json.load(open(ovp, encoding="utf-8")) if os.path.exists(ovp) else {}
    meta = json.load(open(META, encoding="utf-8"))
    fertigp = os.path.join(HIER, "mehr-fertig.txt")
    fertig = {z.strip() for z in open(fertigp, encoding="utf-8")} if os.path.exists(fertigp) else set()
    alle_wiss = sorted({a["wiss"].lower() for a in arten})
    start = time.time()
    rest = 0
    for art in arten:
        if art["id"] in fertig or art["id"] not in meta:
            continue
        if time.time() - start > 95 * 60:
            rest += 1
            continue
        print("•", art["id"], art["wiss"], flush=True)
        vorhanden = meta[art["id"]]
        try:
            wahl, n = nachschlag_art(art, ov.get(art["id"], {}), vorhanden, alle_wiss)
        except Exception as e:  # noqa
            print("   Art fehlgeschlagen:", e, file=sys.stderr)
            rest += 1
            continue
        nr = max([int(m.group(1)) for e in vorhanden for m in [re.search(r"-(\d+)\.webp$", e["f"])] if m] or [0]) + 1
        neu = []
        for x in wahl:
            try:
                roh = hole(x["url"]); time.sleep(0.35)
                im = Image.open(io.BytesIO(roh)).convert("RGB")
                im.thumbnail((880, 880), Image.LANCZOS)
                name = "%s-%d.webp" % (art["id"], nr); nr += 1
                im.save(os.path.join(ZIEL, name), "WEBP", quality=72, method=6)
                neu.append({"f": name, "a": x["aspekt"], "w": im.width, "h": im.height, "autor": x["autor"], "lizenz": x["lizenz"],
                            "lizenzurl": x["lizenzurl"], "quelle": x["quelle"], "titel": x["titel"], "beschr": x["beschr"], "neu": 1})
            except Exception as e:  # noqa
                print("   Bild übersprungen:", x["titel"], e, file=sys.stderr)
        meta[art["id"]] = vorhanden + neu
        print("   %d Kandidaten, +%d → %d Bilder: %s" % (n, len(neu), len(meta[art["id"]]), ", ".join(e["a"] for e in neu)), flush=True)
        json.dump(meta, open(META, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
        fertig.add(art["id"])
        open(fertigp, "w", encoding="utf-8").write("\n".join(sorted(fertig)) + "\n")
    print("REST", rest)
    open(os.path.join(os.environ.get("RUNNER_TEMP", "/tmp"), "waldbuch-rest"), "w").write(str(rest))


def main():
    if os.environ.get("MODUS") == "mehr":
        return nachschlag()
    arten = json.load(open(os.path.join(HIER, "arten.json"), encoding="utf-8"))
    ov = {}
    if os.path.exists(os.path.join(HIER, "overrides.json")):
        ov = json.load(open(os.path.join(HIER, "overrides.json"), encoding="utf-8"))
    neu = set()
    if os.path.exists(os.path.join(HIER, "neu.txt")):
        neu = {z.strip() for z in open(os.path.join(HIER, "neu.txt"), encoding="utf-8") if z.strip() and not z.startswith("#")}
    meta = json.load(open(META, encoding="utf-8")) if os.path.exists(META) else {}
    start = time.time()
    for art in arten:
        if art["id"] in meta and art["id"] not in neu and "*" not in neu:
            continue
        if time.time() - start > 100 * 60:
            print("Zeit um – Rest beim nächsten Lauf")
            break
        print("•", art["id"], art["wiss"], flush=True)
        try:
            wahl, n = art_holen(art, ov.get(art["id"], {}))
        except Exception as e:  # noqa
            print("   Art fehlgeschlagen:", e, file=sys.stderr)
            continue
        for alt in [f for f in os.listdir(ZIEL) if re.match(re.escape(art["id"]) + r"-\d+\.webp$", f)]:
            os.remove(os.path.join(ZIEL, alt))
        meta[art["id"]] = speichern(art, wahl)
        print("   %d Kandidaten, %d Bilder: %s" % (n, len(meta[art["id"]]), ", ".join(e["a"] for e in meta[art["id"]])), flush=True)
        json.dump(meta, open(META, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)


if __name__ == "__main__":
    main()
