#!/usr/bin/env python3
"""Handverlesene Korrekturen der automatisch geholten Fotos (nach Sichtung der Kontaktbögen).
weg: Bilder entfernen (Index in bilder.json), a: Ansicht neu beschriften, haupt: dieses Bild nach vorn.
Entfernte Commons-Dateien landen zusätzlich in overrides.json (minus), damit ein neuer Lauf sie nicht wieder holt."""
import json, os, sys
HIER = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(HIER, "..", "..")
K = json.load(open(sys.argv[1], encoding="utf-8"))
meta = json.load(open(os.path.join(W, "pflanzen/bilder.json"), encoding="utf-8"))
ovp = os.path.join(HIER, "overrides.json")
ov = json.load(open(ovp, encoding="utf-8")) if os.path.exists(ovp) else {}
for aid, k in K.items():
    if aid not in meta: print("fehlt", aid); continue
    liste = meta[aid]
    for i, lab in (k.get("a") or {}).items(): liste[int(i)]["a"] = lab
    haupt = liste[k["haupt"]] if "haupt" in k else None
    weg = sorted(set(k.get("weg", [])), reverse=True)
    for i in weg:
        e = liste[i]
        ov.setdefault(aid, {}).setdefault("minus", []).append(e["titel"])
        p = os.path.join(W, "pflanzen/bilder", e["f"])
        if os.path.exists(p): os.remove(p)
        del liste[i]
    if haupt and haupt in liste:
        liste.remove(haupt); liste.insert(0, haupt)
    if liste: liste[0]["a"] = "haupt"
    meta[aid] = liste
json.dump(meta, open(os.path.join(W, "pflanzen/bilder.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
json.dump(ov, open(ovp, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
print("ok", len(K))
