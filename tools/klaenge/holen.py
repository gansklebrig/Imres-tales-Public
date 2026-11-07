#!/usr/bin/env python3
"""Klänge holen (läuft im GitHub-Actions-Ablauf klaenge-holen.yml).

modus=laden:  liste = JSON-Liste [{url, ziel, lizenz, quelle, ab?, bis?}]
              Lädt jede Datei, wandelt sie in Mono-FLAC (44,1 kHz) um (optional nur ab..bis Sekunden)
              und legt sie unter roh/<ziel>.flac ab, dazu roh/<ziel>.json mit Lizenz/Quelle.
modus=suchen: liste = JSON {"kategorien": [...], "suchen": [...], "tiefe": 1, "name": "..."}
              Fragt Wikimedia Commons nach Audiodateien (Kategorie bzw. Volltext) und schreibt
              funde/<name>.json mit Lizenz, Urheber, Beschreibung, Dauer, Größe – nichts wird geladen.
Ausgabe immer im Ordner, der als zweites Argument übergeben wird.
"""
import json, os, re, subprocess, sys, time, urllib.parse, urllib.request, html

UA = "ImresTalesKlangImport/1.0 (https://imrestales.de; GitHub Actions) python-urllib"
API = "https://commons.wikimedia.org/w/api.php"


def hole(url, versuche=6, daten=None):
    for i in range(versuche):
        try:
            req = urllib.request.Request(url, data=daten, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except Exception as e:  # noqa
            print("  Fehler", e, "– neuer Versuch", file=sys.stderr)
            time.sleep(5 * (i + 1) ** 2)
    raise RuntimeError("nicht ladbar: " + url)


def api(**p):
    p.update(format="json", formatversion="2")
    time.sleep(0.3)
    return json.loads(hole(API, daten=urllib.parse.urlencode(p).encode()))


def text(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def info(titel):
    """imageinfo für bis zu 50 Titel"""
    aus = []
    for i in range(0, len(titel), 50):
      try:
        d = api(action="query", titles="|".join(titel[i:i + 50]), prop="imageinfo|categories", cllimit="max",
                iiprop="url|size|mime|mediatype|extmetadata|metadata",
                iiextmetadatafilter="LicenseShortName|LicenseUrl|Artist|ImageDescription|Credit|UsageTerms|DateTimeOriginal")
        for pg in d.get("query", {}).get("pages", []):
            ii = (pg.get("imageinfo") or [{}])[0]
            if ii.get("mediatype") != "AUDIO" and not str(ii.get("mime", "")).startswith(("audio", "application/ogg")):
                continue
            em = ii.get("extmetadata", {})
            md = {m.get("name"): m.get("value") for m in (ii.get("metadata") or []) if isinstance(m, dict)}
            dauer = md.get("length") or md.get("playtime_seconds") or md.get("duration")
            aus.append({
                "titel": pg.get("title"), "url": ii.get("url"), "seite": ii.get("descriptionurl"),
                "mime": ii.get("mime"), "groesse": ii.get("size"),
                "dauer": round(float(dauer), 1) if isinstance(dauer, (int, float, str)) and re.match(r"^[\d.]+$", str(dauer)) else None,
                "lizenz": text(em.get("LicenseShortName", {}).get("value")),
                "lizenz_url": text(em.get("LicenseUrl", {}).get("value")),
                "urheber": text(em.get("Artist", {}).get("value"))[:200],
                "credit": text(em.get("Credit", {}).get("value"))[:200],
                "datum": text(em.get("DateTimeOriginal", {}).get("value"))[:40],
                "beschreibung": text(em.get("ImageDescription", {}).get("value"))[:400],
                "kategorien": [c["title"].replace("Category:", "") for c in pg.get("categories", [])][:25],
            })
      except Exception as e:  # noqa
        print("info", i, e, file=sys.stderr)
    return aus


def kategorie(name, tiefe, gesehen):
    if name in gesehen:
        return []
    gesehen.add(name)
    dateien, unter, weiter = [], [], {}
    while True:
        d = api(action="query", list="categorymembers", cmtitle="Category:" + name, cmtype="file|subcat", cmlimit="500", **weiter)
        for m in d.get("query", {}).get("categorymembers", []):
            (dateien if m["ns"] == 6 else unter).append(m["title"])
        if "continue" not in d:
            break
        weiter = {"cmcontinue": d["continue"]["cmcontinue"]}
    titel = list(dateien)
    if tiefe > 0:
        for u in unter[:60]:
            titel += kategorie(u.replace("Category:", ""), tiefe - 1, gesehen)
    return titel


def suchen(auftrag, ziel):
    titel, gesehen = [], set()
    for k in auftrag.get("kategorien", []):
        try:
            titel += kategorie(k, auftrag.get("tiefe", 1), gesehen)
        except Exception as e:  # noqa
            print("Kategorie", k, e, file=sys.stderr)
    for q in auftrag.get("suchen", []):
        try:
            d = api(action="query", list="search", srnamespace="6", srlimit="200", srsearch=q)
            titel += [s["title"] for s in d.get("query", {}).get("search", [])]
        except Exception as e:  # noqa
            print("Suche", q, e, file=sys.stderr)
    titel = list(dict.fromkeys(titel))
    funde = info(titel)
    os.makedirs(os.path.join(ziel, "funde"), exist_ok=True)
    with open(os.path.join(ziel, "funde", auftrag.get("name", "funde") + ".json"), "w") as f:
        json.dump(funde, f, ensure_ascii=False, indent=0)
    print(len(titel), "Titel,", len(funde), "Audiodateien")


def laden(liste, ziel):
    os.makedirs(os.path.join(ziel, "roh"), exist_ok=True)
    tmp = os.path.join(os.environ.get("RUNNER_TEMP", "/tmp"), "klang")
    os.makedirs(tmp, exist_ok=True)
    ok = 0
    for e in liste:
        name = re.sub(r"[^a-z0-9_\-]", "", e["ziel"].lower())
        aus = os.path.join(ziel, "roh", name + ".flac")
        if os.path.exists(aus):
            continue
        try:
            daten = hole(e["url"])
            ein = os.path.join(tmp, name + ".bin")
            with open(ein, "wb") as f:
                f.write(daten)
            cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
            if e.get("ab"):
                cmd += ["-ss", str(e["ab"])]
            cmd += ["-i", ein]
            if e.get("bis"):
                cmd += ["-t", str(float(e["bis"]) - float(e.get("ab") or 0))]
            cmd += ["-ac", "1", "-ar", "44100", "-sample_fmt", "s16", aus]
            subprocess.run(cmd, check=True)
            meta = dict(e)
            meta["bytes_original"] = len(daten)
            with open(os.path.join(ziel, "roh", name + ".json"), "w") as f:
                json.dump(meta, f, ensure_ascii=False, indent=1)
            ok += 1
            print("ok", name)
        except Exception as ex:  # noqa
            print("FEHLER", name, ex, file=sys.stderr)
        time.sleep(0.5)
    print(ok, "von", len(liste), "geladen")


if __name__ == "__main__":
    modus, quelle, ziel = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(quelle) as f:
        auftrag = json.load(f)
    (suchen if modus == "suchen" else laden)(auftrag, ziel)
