#!/usr/bin/env python3
"""Vertonung der Chronik mit ElevenLabs (läuft in GitHub Actions, Schlüssel aus dem Secret ELEVENLABS_API_KEY).

Modi:
  proben  – kurze Hörproben mit mehreren passenden Erzählstimmen → audio/proben/
  chronik – jeden Absatz der Chronik vertonen → audio/chronik/<sprache>/<kapitel>/NNN-<hash>.mp3 + manifest.json
            Schon vorhandene Absätze (gleicher Text, gleiche Stimme) werden übersprungen – nur Neues kostet Credits.
"""
import hashlib, json, os, re, subprocess, sys, time, urllib.request, urllib.error, urllib.parse

API = "https://api.elevenlabs.io"
KEY = os.environ.get("ELEVENLABS_API_KEY", "").strip()
WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELL = os.environ.get("MODELL") or "eleven_multilingual_v2"
EINSTELLUNG = json.loads(os.environ.get("EINSTELLUNG") or "null") or {"stability": 0.5, "similarity_boost": 0.88, "style": 0.25, "use_speaker_boost": True, "speed": 0.93}
NACHBEARBEITEN = (os.environ.get("NACHBEARBEITEN") or "1") == "1"
# Klang: Rumpeln weg, etwas Wärme unten, Zischlaute zähmen, gleichmäßige Lautstärke (Hörbuch-Pegel)
FILTER = "highpass=f=70,equalizer=f=170:t=q:w=1.1:g=2.2,equalizer=f=3200:t=q:w=1.6:g=-1.2,deesser=i=0.35,acompressor=threshold=-20dB:ratio=2.2:attack=15:release=180,loudnorm=I=-18:TP=-1.5:LRA=9"

def veredeln(mp3):
    if not NACHBEARBEITEN: return mp3
    try:
        r = subprocess.run(["ffmpeg", "-v", "error", "-f", "mp3", "-i", "pipe:0", "-af", FILTER, "-ar", "44100", "-b:a", "128k", "-f", "mp3", "pipe:1"], input=mp3, capture_output=True, check=True)
        return r.stdout or mp3
    except Exception as e:
        print("Nachbearbeitung übersprungen:", e); return mp3

def anfrage(pfad, daten=None, methode=None, roh=False):
    url = API + pfad
    body = json.dumps(daten).encode() if daten is not None else None
    req = urllib.request.Request(url, data=body, method=methode or ("POST" if body else "GET"))
    req.add_header("xi-api-key", KEY)
    if body: req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "audio/mpeg" if roh else "application/json")
    for versuch in range(5):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                inhalt = r.read()
                return inhalt if roh else json.loads(inhalt or b"{}")
        except urllib.error.HTTPError as e:
            text = e.read().decode("utf-8", "replace")[:400]
            if e.code in (429, 500, 502, 503) and versuch < 4:
                time.sleep(4 * (versuch + 1)); continue
            raise SystemExit(f"Fehler {e.code} bei {pfad}: {text}")

def rest():
    try:
        s = anfrage("/v1/user/subscription")
        return s.get("character_limit", 0) - s.get("character_count", 0), s
    except SystemExit as e:
        print("Kontostand nicht lesbar:", e); return None, {}

def sauber(t):
    t = re.sub(r"^#+\s*", "", t)            # Zwischenüberschrift
    t = re.sub(r"[*_`]+", "", t)            # Markdown-Betonung
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"<[^>]+>", "", t)
    return re.sub(r"\s+", " ", t).strip()

def tts(stimme, text, vorher="", nachher="", modell=None, einstellung=None):
    modell = modell or MODELL
    daten = {"text": text, "model_id": modell, "voice_settings": einstellung or EINSTELLUNG}
    if modell != "eleven_v3":
        if vorher: daten["previous_text"] = vorher[-600:]
        if nachher: daten["next_text"] = nachher[:300]
    return veredeln(anfrage(f"/v1/text-to-speech/{stimme}?output_format=mp3_44100_128", daten, roh=True))

def chronik_laden(sprache):
    out = subprocess.check_output(["node", os.path.join(WURZEL, "tools/vertonung/export.js"), sprache])
    return json.loads(out)

def git_sichern(nachricht):
    subprocess.run(["git", "add", "audio"], cwd=WURZEL, check=True)
    if subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=WURZEL).returncode == 0: return
    subprocess.run(["git", "commit", "-q", "-m", nachricht], cwd=WURZEL, check=True)
    for _ in range(4):
        if subprocess.run(["git", "pull", "--no-rebase", "-q"], cwd=WURZEL).returncode == 0 and \
           subprocess.run(["git", "push", "-q"], cwd=WURZEL).returncode == 0: return
        time.sleep(5)
    raise SystemExit("Push fehlgeschlagen")

# ---------------------------------------------------------------- Proben
def proben(sprache):
    D = chronik_laden(sprache)
    kap = D["kapitel"][0]["absaetze"]
    text = " ".join(sauber(a) for a in kap[1:4] if not a.startswith("#"))
    text = text[:520].rsplit(".", 1)[0] + "."
    kandidaten = []
    # 1) eigene/Standard-Stimmen im Konto, die nach Erzähler klingen
    eigene = anfrage("/v1/voices").get("voices", [])
    wunsch = ["George", "Brian", "Bill", "Daniel", "Callum"]
    for name in wunsch:
        v = next((x for x in eigene if x.get("name", "").split(" ")[0] == name), None)
        if v: kandidaten.append({"name": v["name"], "id": v["voice_id"], "quelle": "Standard", "info": (v.get("labels") or {})})
    # 2) deutsche Erzählstimmen aus der Stimmen-Bibliothek
    q = urllib.parse.urlencode({"page_size": 12, "language": sprache, "gender": "male", "use_cases": "narrative_story", "sort": "trending"})
    try:
        biblio = anfrage("/v1/shared-voices?" + q).get("voices", [])
    except SystemExit as e:
        print("Bibliothek nicht erreichbar:", e); biblio = []
    for v in biblio:
        if len([k for k in kandidaten if k["quelle"] == "Bibliothek"]) >= 4: break
        alter = (v.get("age") or "").lower()
        if alter == "young": continue
        try:
            neu = anfrage(f"/v1/voices/add/{v['public_owner_id']}/{v['voice_id']}", {"new_name": "Erzähler " + v.get("name", "")[:30]})
            vid = neu.get("voice_id", v["voice_id"])
        except SystemExit as e:
            print("Konnte Stimme nicht übernehmen:", v.get("name"), e); continue
        kandidaten.append({"name": v.get("name"), "id": vid, "quelle": "Bibliothek", "info": {"beschreibung": (v.get("description") or "")[:200], "akzent": v.get("accent"), "alter": v.get("age")}})
    os.makedirs(os.path.join(WURZEL, "audio/proben"), exist_ok=True)
    liste = []
    for i, k in enumerate(kandidaten[:8]):
        mp3 = tts(k["id"], text)
        datei = f"audio/proben/{i+1:02d}-{re.sub(r'[^a-z0-9]+', '-', k['name'].lower()).strip('-')}.mp3"
        open(os.path.join(WURZEL, datei), "wb").write(mp3)
        liste.append(dict(k, datei=datei)); print("Probe:", k["name"], k["id"], k["quelle"])
    json.dump({"text": text, "modell": MODELL, "proben": liste}, open(os.path.join(WURZEL, "audio/proben/proben.json"), "w"), ensure_ascii=False, indent=1)
    git_sichern("Vertonung: Hörproben für die Erzählstimme")

# ---------------------------------------------------------------- Feinschliff: eine Stimme, mehrere Einstellungen
VARIANTEN = [
    ("a-ruhig-warm", "eleven_multilingual_v2", {"stability": 0.62, "similarity_boost": 0.88, "style": 0.12, "use_speaker_boost": True, "speed": 0.94}),
    ("b-erzaehler", "eleven_multilingual_v2", {"stability": 0.5, "similarity_boost": 0.9, "style": 0.28, "use_speaker_boost": True, "speed": 0.92}),
    ("c-lebendig", "eleven_multilingual_v2", {"stability": 0.38, "similarity_boost": 0.82, "style": 0.42, "use_speaker_boost": True, "speed": 0.97}),
    ("d-v3-ausdruck", "eleven_v3", {"stability": 0.5, "similarity_boost": 0.85, "style": 0.3, "use_speaker_boost": True}),
]
def feinschliff(sprache, stimme):
    D = chronik_laden(sprache)
    kap = D["kapitel"][0]["absaetze"]
    text = " ".join(sauber(a) for a in kap[1:4] if not a.startswith("#"))
    text = text[:520].rsplit(".", 1)[0] + "."
    os.makedirs(os.path.join(WURZEL, "audio/proben"), exist_ok=True)
    for name, modell, einst in VARIANTEN:
        try:
            mp3 = tts(stimme, text, modell=modell, einstellung=einst)
        except SystemExit as e:
            print("Variante", name, "fehlgeschlagen:", e); continue
        open(os.path.join(WURZEL, f"audio/proben/fein-{name}.mp3"), "wb").write(mp3); print("Variante:", name)
    global NACHBEARBEITEN
    NACHBEARBEITEN = False
    open(os.path.join(WURZEL, "audio/proben/fein-b-erzaehler-roh.mp3"), "wb").write(tts(stimme, text, modell=VARIANTEN[1][1], einstellung=VARIANTEN[1][2]))
    git_sichern("Vertonung: Feinschliff-Proben")

# ---------------------------------------------------------------- Chronik
def chronik(sprache, stimme, grenze):
    D = chronik_laden(sprache)
    basis = os.path.join(WURZEL, "audio/chronik", sprache)
    os.makedirs(basis, exist_ok=True)
    mpfad = os.path.join(basis, "manifest.json")
    alt = json.load(open(mpfad)) if os.path.exists(mpfad) else {}
    manifest = {"sprache": sprache, "stimme": stimme, "modell": MODELL, "kapitel": {}}
    stuecke = []
    if D.get("vorab"): stuecke.append(("vorab", 0, D["vorab"]))
    for k in D["kapitel"]:
        for i, a in enumerate(k["absaetze"]): stuecke.append((k["nummer"], i, a))
    texte = [sauber(t) for _, _, t in stuecke]
    kosten = 0; erzeugt = 0
    stand, _ = rest(); print("Credits übrig:", stand)
    for n, ((kap, i, roh), text) in enumerate(zip(stuecke, texte)):
        if not text: continue
        h = hashlib.sha1((stimme + "|" + MODELL + "|" + text).encode()).hexdigest()[:10]
        ordner = re.sub(r"[^A-Za-z0-9]+", "", str(kap)) or "x"
        datei = f"audio/chronik/{sprache}/{ordner}/{i:03d}-{h}.mp3"
        ziel = os.path.join(WURZEL, datei)
        eintrag = {"i": i, "datei": datei, "titel": roh.startswith("#")}
        manifest["kapitel"].setdefault(str(kap), []).append(eintrag)
        if os.path.exists(ziel): continue
        if grenze and kosten + len(text) > grenze:
            print("Grenze erreicht – Rest beim nächsten Lauf."); manifest["unvollstaendig"] = True; break
        os.makedirs(os.path.dirname(ziel), exist_ok=True)
        vorher = texte[n - 1] if n else ""; nachher = texte[n + 1] if n + 1 < len(texte) else ""
        mp3 = tts(stimme, text + (" …" if roh.startswith("#") else ""), vorher, nachher)
        open(ziel, "wb").write(mp3); kosten += len(text); erzeugt += 1
        print(f"{datei}  ({len(text)} Zeichen, gesamt {kosten})")
        if erzeugt % 25 == 0:
            json.dump(manifest, open(mpfad, "w"), ensure_ascii=False, indent=1); git_sichern(f"Vertonung Chronik ({sprache}): {erzeugt} Absätze")
    # alte Dateien, die nicht mehr gebraucht werden, entfernen
    genutzt = {e["datei"] for l in manifest["kapitel"].values() for e in l}
    for wurzel, _, dateien in os.walk(basis):
        for f in dateien:
            if f.endswith(".mp3"):
                rel = os.path.relpath(os.path.join(wurzel, f), WURZEL)
                if rel not in genutzt and not manifest.get("unvollstaendig"): os.remove(os.path.join(wurzel, f))
    json.dump(manifest, open(mpfad, "w"), ensure_ascii=False, indent=1)
    git_sichern(f"Vertonung Chronik ({sprache}): {erzeugt} neue Absätze, {kosten} Zeichen")
    print("Fertig:", erzeugt, "Absätze,", kosten, "Zeichen. Credits übrig:", rest()[0])

if __name__ == "__main__":
    if not KEY: raise SystemExit("ELEVENLABS_API_KEY fehlt")
    modus = sys.argv[1] if len(sys.argv) > 1 else "proben"
    sprache = os.environ.get("SPRACHE") or "de"
    if modus == "proben": proben(sprache)
    elif modus == "feinschliff": feinschliff(sprache, os.environ.get("STIMME", "").strip())
    elif modus == "chronik":
        stimme = os.environ.get("STIMME", "").strip()
        if not stimme: raise SystemExit("STIMME (voice_id) fehlt")
        chronik(sprache, stimme, int(os.environ.get("GRENZE") or 0))
    else: raise SystemExit("Unbekannter Modus " + modus)
