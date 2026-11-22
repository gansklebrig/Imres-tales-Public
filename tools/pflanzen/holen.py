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


def main():
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
