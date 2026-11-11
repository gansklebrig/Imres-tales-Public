#!/usr/bin/env python3
"""Bestehende Hörbuch-Aufnahmen bei einer neuen Skriptfassung wiederverwenden.

Für jedes Erzähler-Segment, das es so noch nicht gab, werden Satzläufe gesucht, die wortgleich schon
aufgenommen sind (in der vorigen Fassung), und an den Whisper-Wortgrenzen aus der bestehenden Aufnahme
ausgeschnitten. Nur der Rest wird neu aufgenommen. Gleiche Stimme, gleiche Einstellungen → nahtlos.

  ALT_STRUKTUR=… ALT_REGIE=… ALT_RECYCLING=… python3 tools/hoerbuch/wiederverwenden.py [--schneiden]

Quellen: alle aktuell benutzten Aufnahmen der vorigen Fassung (vollständige Segmente, neu aufgenommene
Teile und schon recycelte Stücke), sofern die Hörprüfung bestanden ist und Wortzeiten vorliegen.
Ergebnis: Einträge in tools/hoerbuch/recycling-de.json für die neuen Segmente; bestehende Einträge
unveränderter Segmente bleiben erhalten.
Regeln wie recycling.py: ganze Sätze, Lauf ≥ 60 Zeichen, Lücken dazwischen ≥ 50 Zeichen, Satzzeichen gleich.
"""
import json, os, subprocess, sys
WURZEL = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(WURZEL, "tools/hoerbuch"))
import recycling as R
import aufnahme as A

def J(p): return json.load(open(p if os.path.isabs(p) else os.path.join(WURZEL, p)))

def quellen():
    """Aktuell benutzte Dateien der vorigen Fassung mit Text und Wortzeiten."""
    alt_st, alt_regie, alt_rec = J(os.environ["ALT_STRUKTUR"]), J(os.environ["ALT_REGIE"]), J(os.environ["ALT_RECYCLING"])
    qa = J("tools/hoerbuch/qa-de.json")
    orig = A.J
    def J2(p, std=None):
        return {"tools/hoerbuch/struktur-de.json": alt_st, "tools/hoerbuch/regie-de.json": alt_regie,
                "tools/hoerbuch/recycling-de.json": alt_rec}.get(p) or orig(p, std)
    A.J = J2
    try: E, fehler, bes = A.einheiten(["vorab", "I", "II"])
    finally: A.J = orig
    out = []
    for e in E:
        if e["rolle"] not in ("erzaehler",) or "-titel-" in e["uid"]: continue
        f = A.datei(e, bes); q = qa.get(f)
        if q and q.get("ok") and q.get("woerter") and os.path.exists(os.path.join(WURZEL, f)):
            out.append({"datei": f, "norm": R.norm(e["ziel"]), "woerter": q["woerter"]})
    for teile in alt_rec.values():
        for t in teile:
            f = t.get("alt"); q = qa.get(f) if f else None
            if q and q.get("ok") and q.get("woerter") and os.path.exists(os.path.join(WURZEL, f)):
                out.append({"datei": f, "norm": R.norm(t["text"]), "woerter": q["woerter"]})
    return out

def plan():
    st = J("tools/hoerbuch/struktur-de.json"); alt_ids = {s["id"] for k in ("vorab", "I", "II") for b in J(os.environ["ALT_STRUKTUR"])[k]
                                                         if b.get("typ", "text") == "text" for s in b["segmente"]}
    Q = quellen(); erg, gespart = {}, 0
    for kap in ("vorab", "I", "II"):
        for b in st[kap]:
            if b.get("typ", "text") != "text": continue
            for s in b["segmente"]:
                if s["rolle"] != "erzaehler" or s["id"] in alt_ids: continue
                S = R.saetze(s["text"]); n = len(S); laeufe = []; i = 0
                while i < n:
                    gef = None
                    for j in range(n, i, -1):
                        lauf = " ".join(S[i:j])
                        if len(lauf) < 60: break
                        nl = R.norm(lauf)
                        for q in Q:
                            if nl in q["norm"]:
                                t = R.zeiten(lauf, q)
                                if t: gef = (j, q, t, lauf); break
                        if gef: break
                    if gef: laeufe.append((i,) + gef); i = gef[0]
                    else: i += 1
                if not laeufe: continue
                ok = []
                for L in laeufe:
                    if ok and 0 < len(" ".join(S[ok[-1][1]:L[0]])) < 50: continue
                    ok.append(L)
                if ok and ok[-1][1] < n and len(" ".join(S[ok[-1][1]:])) < 50 and len(ok) > 1: ok.pop()
                if ok and ok[0][0] > 0 and len(" ".join(S[:ok[0][0]])) < 50 and len(ok) > 1: ok.pop(0)
                # kurze Reste am Rand eines einzelnen Laufs: lieber ganz neu aufnehmen als 20 Zeichen ansetzen
                if len(ok) == 1:
                    i0, j0 = ok[0][0], ok[0][1]
                    vor, nach = " ".join(S[:i0]), " ".join(S[j0:])
                    if (vor and len(vor) < 50) or (nach and len(nach) < 50): continue
                teile, pos, nn = [], 0, 0
                for (i0, j0, q, t, lauf) in ok:
                    if i0 > pos: teile.append({"neu": nn, "text": " ".join(S[pos:i0])}); nn += 1
                    teile.append({"alt": None, "quelle": q["datei"], "von": round(t[0], 3), "bis": round(t[1], 3), "text": lauf})
                    gespart += len(lauf); pos = j0
                if pos < n: teile.append({"neu": nn, "text": " ".join(S[pos:])})
                erg[s["id"]] = teile
    return erg, gespart

def main():
    erg, gespart = plan()
    rec = J(os.environ["ALT_RECYCLING"])
    st = J("tools/hoerbuch/struktur-de.json")
    ids = {s["id"] for k in ("vorab", "I", "II") for b in st[k] if b.get("typ", "text") == "text" for s in b["segmente"]}
    rec = {k: v for k, v in rec.items() if k in ids}   # nur noch benutzte Segmente
    if "--schneiden" in sys.argv:
        ziel = os.path.join(WURZEL, "audio/hoerbuch/alt"); os.makedirs(ziel, exist_ok=True)
        for sid, teile in erg.items():
            k = 0
            for t in teile:
                if "quelle" not in t: continue
                k += 1; datei = f"audio/hoerbuch/alt/{sid}-w{k}.mp3"
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t["von"]), "-to", str(t["bis"]), "-i", os.path.join(WURZEL, t["quelle"]),
                                "-af", "afade=t=in:d=0.015,areverse,afade=t=in:d=0.1,areverse", "-ar", "44100", "-b:a", "160k",
                                os.path.join(WURZEL, datei)], check=True)
                t["alt"] = datei; t.pop("quelle")
        rec.update(erg)
        json.dump(rec, open(os.path.join(WURZEL, "tools/hoerbuch/recycling-de.json"), "w"), ensure_ascii=False, indent=1)
    print(len(erg), "neue Segmente mit Wiederverwendung, gespart", gespart, "Zeichen")

if __name__ == "__main__":
    main()
