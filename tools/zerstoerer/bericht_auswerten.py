#!/usr/bin/env python3
"""Wertet Spielberichte von „Ezekiel – The Destroyer“ aus (W31).

Tester exportieren im Spiel unter Einstellungen → „Spielbericht exportieren“ (oder im Lauf-Rückblick) eine JSON-Datei
(Format „zerstoerer-bericht/1“) und schicken sie von Hand. Dieses Werkzeug führt beliebig viele solcher Dateien zusammen
(doppelte Läufe – derselbe Bericht zweimal exportiert – zählen nur einmal) und erzeugt eine Übersicht für das Balancing:

  · Überblick: Dateien, Läufe, Versionen, Geräte, Helden, Härte, Siege/Tode, Spielzeit
  · Todesorte (Gebiet) und Todesursachen (Gegnerart, Boss, Falle, Absturz …)
  · schwierigste Gegner (Tode, eingesteckter Schaden je Lauf) und Bosse (Begegnungen, Siegquote, Dauer, Tode)
  · Waffen-Siegquoten (getragen am Laufende) mit Schadensanteil und Schmiedestufe
  · Dauer je Gebiet (Median, 90-%-Wert), Paraden/Rollen/Tränke
  · Ausreißer: sehr lange/kurze Läufe, Gebiete mit extremer Dauer, Tode mit vollen Tränken, Schadensspitzen

Aufruf:
  python3 tools/zerstoerer/bericht_auswerten.py bericht1.json [bericht2.json …]             → Markdown auf stdout
  python3 tools/zerstoerer/bericht_auswerten.py *.json --md uebersicht.md --html uebersicht.html
  Optionen: --version 138 (nur diese Spielversion), --ohne-gnade (Läufe mit Barmherzigkeit weglassen),
            --spiel <pfad zu zerstoerer/> (Namen der Gegner/Waffen/Gebiete; Standard: neben diesem Werkzeug)
Nur Standardbibliothek. Liest auch in die Zwischenablage kopierte Berichte (gleiches Format, als .json/.txt gespeichert).
"""
import argparse
import glob
import hashlib
import html
import json
import os
import re
import statistics
import sys
from collections import Counter, defaultdict

sys.dont_write_bytecode = True

# ---------------------------------------------------------------- Namen aus den Spieldateien (optional)
def namen_laden(spiel):
    out = {}
    if not spiel or not os.path.isdir(spiel):
        return out
    key_re = re.compile(r'^\s{2,8}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\{')
    nam_re = re.compile(r'\b(?:n|name)\s*:\s*\[\s*"([^"]+)"')
    for f in sorted(glob.glob(os.path.join(spiel, "*.js"))):
        cur, cur_n = None, 0
        try:
            lines = open(f, encoding="utf-8").read().splitlines()
        except OSError:
            continue
        for ln in lines:
            m = key_re.match(ln)
            if m:
                cur, cur_n = m.group(1), 0
            if cur and cur_n < 6:
                mn = nam_re.search(ln)
                if mn and cur not in out:
                    out[cur] = mn.group(1)
                    cur = None
                cur_n += 1
    return out

NAMEN = {}
SONDER = {"x:sturz": "Absturz", "x:falle": "Fallen", "x:umgebung": "Umgebung", "x:unbekannt": "unbekannt", "faeuste": "Fäuste"}

def nm(k):
    if not k:
        return "–"
    if k in SONDER:
        return SONDER[k]
    t, _, i = k.partition(":") if ":" in k else ("", "", k)
    base = NAMEN.get(i, i)
    return ("Boss " + base) if t == "b" else base

# ---------------------------------------------------------------- Einlesen
def lesen(pfad):
    txt = open(pfad, encoding="utf-8-sig").read().strip()
    try:
        j = json.loads(txt)
    except json.JSONDecodeError:
        a, b = txt.find("{"), txt.rfind("}")
        j = json.loads(txt[a:b + 1])
    if isinstance(j, list):
        return {"format": "?", "laeufe": j}
    if not isinstance(j, dict) or "laeufe" not in j:
        raise ValueError("kein Spielbericht (Feld „laeufe“ fehlt)")
    return j

def lauf_id(x):
    return hashlib.sha1(json.dumps([x.get("datum"), x.get("nr"), x.get("dauer"), x.get("ende"), x.get("erreicht"), x.get("kills")], sort_keys=True).encode()).hexdigest()[:16]

def pct(a, b):
    return (100.0 * a / b) if b else 0.0

def q(vals, p):
    if not vals:
        return 0
    v = sorted(vals)
    k = (len(v) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(v) - 1)
    return v[lo] + (v[hi] - v[lo]) * (k - lo)

def mmss(s):
    s = int(round(s or 0))
    return f"{s // 60}:{s % 60:02d}"

# ---------------------------------------------------------------- Auswertung
def auswerten(dateien, version=None, ohne_gnade=False):
    laeufe, gesehen, quellen = [], set(), []
    for d in dateien:
        try:
            j = lesen(d)
        except Exception as e:  # noqa: BLE001
            print(f"⚠ {d}: {e}", file=sys.stderr)
            continue
        n0 = 0
        for x in j.get("laeufe", []):
            if not isinstance(x, dict):
                continue
            if version and str(x.get("version")) != str(version):
                continue
            if ohne_gnade and x.get("gnade"):
                continue
            i = lauf_id(x)
            if i in gesehen:
                continue
            gesehen.add(i)
            x["_datei"] = os.path.basename(d)
            laeufe.append(x)
            n0 += 1
        quellen.append((os.path.basename(d), j.get("version", "?"), j.get("geraet", "?"), n0, j.get("format", "?")))
    R = {"quellen": quellen, "n": len(laeufe)}
    if not laeufe:
        return R
    tode = [x for x in laeufe if x.get("ende") == "tod"]
    siege = [x for x in laeufe if x.get("ende") == "sieg"]
    R["ueberblick"] = {
        "laeufe": len(laeufe), "siege": len(siege), "tode": len(tode), "abbrueche": len(laeufe) - len(siege) - len(tode),
        "spielzeit_h": sum(float(x.get("dauer") or 0) for x in laeufe) / 3600,
        "versionen": Counter(str(x.get("version")) for x in laeufe).most_common(),
        "geraete": Counter(x.get("geraet", "?") + (" (PC-Programm)" if x.get("pc") else "") for x in laeufe).most_common(),
        "helden": Counter(NAMEN.get({"Z": "Z", "G": "G", "B": "B", "E": "E"}.get(x.get("held"), x.get("held")), x.get("held")) for x in laeufe).most_common(),
        "haerte": Counter(int(x.get("haerte") or 0) for x in laeufe).most_common(),
        "gnade": sum(1 for x in laeufe if x.get("gnade")),
        "median_dauer": statistics.median([float(x.get("dauer") or 0) for x in laeufe]),
    }
    # Todesorte / -ursachen
    R["todesorte"] = Counter((x.get("tod") or {}).get("gebiet") or x.get("erreicht") for x in tode).most_common()
    R["ursachen"] = Counter((x.get("tod") or {}).get("ursache") or "x:unbekannt" for x in tode).most_common()
    # Gegner: Tode, Schaden je Lauf (nur Läufe, in denen er Schaden machte)
    geg = defaultdict(lambda: {"tode": 0, "schaden": 0.0, "laeufe": 0, "kills": 0})
    for x in laeufe:
        for k, v in ((x.get("schaden") or {}).get("einJe") or {}).items():
            if k.startswith("e:") or k.startswith("x:"):
                geg[k]["schaden"] += v
                geg[k]["laeufe"] += 1
        for k, v in (x.get("killsJe") or {}).items():
            geg["e:" + k]["kills"] += v
    for x in tode:
        u = (x.get("tod") or {}).get("ursache") or ""
        if u.startswith("e:") or u.startswith("x:"):
            geg[u]["tode"] += 1
    R["gegner"] = sorted(((k, v) for k, v in geg.items() if v["tode"] or v["schaden"]), key=lambda kv: (-kv[1]["tode"], -kv[1]["schaden"]))
    # Bosse
    bo = defaultdict(lambda: {"begegnungen": 0, "siege": 0, "tode": 0, "dauer_sieg": [], "dauer": [], "rest": []})
    for x in laeufe:
        for b in x.get("bosse") or []:
            o = bo[b.get("id", "?")]
            o["begegnungen"] += 1
            o["dauer"].append(float(b.get("dauer") or 0))
            if b.get("ergebnis") == "sieg":
                o["siege"] += 1
                o["dauer_sieg"].append(float(b.get("dauer") or 0))
            else:
                o["rest"].append(float(b.get("restLeben") or 0))
    for x in tode:
        u = (x.get("tod") or {}).get("ursache") or ""
        if u.startswith("b:"):
            bo[u[2:]]["tode"] += 1
    R["bosse"] = sorted(bo.items(), key=lambda kv: (pct(kv[1]["siege"], kv[1]["begegnungen"]) if kv[1]["begegnungen"] else 101, -kv[1]["tode"]))
    # Waffen
    wf = defaultdict(lambda: {"laeufe": 0, "siege": 0, "stufe": [], "anteil": [], "tiefe": []})
    for x in laeufe:
        aus = float((x.get("schaden") or {}).get("aus") or 0)
        ausJe = (x.get("schaden") or {}).get("ausJe") or {}
        for w in x.get("waffen") or []:
            o = wf[w.get("id", "?")]
            o["laeufe"] += 1
            o["siege"] += 1 if x.get("ende") == "sieg" else 0
            o["stufe"].append(int(w.get("stufe") or 0))
            o["tiefe"].append(int(x.get("stufe") or 0))
            if aus > 0:
                o["anteil"].append(100.0 * float(ausJe.get(w.get("id"), 0)) / aus)
    R["waffen"] = sorted(wf.items(), key=lambda kv: -kv[1]["laeufe"])
    # Gebiete
    ge = defaultdict(list)
    for x in laeufe:
        for r in x.get("route") or []:
            if r.get("dauer") is not None and float(r["dauer"]) >= 0:
                ge[r.get("g", "?")].append(float(r["dauer"]))
    R["gebiete"] = sorted(ge.items(), key=lambda kv: -statistics.median(kv[1]))
    # Technik
    R["technik"] = {
        "paraden_je_lauf": statistics.mean([int(x.get("paraden") or 0) for x in laeufe]),
        "rollen_je_lauf": statistics.mean([int(x.get("rollen") or 0) for x in laeufe]),
        "ausweichen_je_lauf": statistics.mean([int(x.get("ausweichen") or 0) for x in laeufe]),
        "traenke_je_lauf": statistics.mean([int((x.get("traenke") or {}).get("getrunken") or 0) for x in laeufe]),
        "tode_volle_traenke": sum(1 for x in tode if int((x.get("traenke") or {}).get("uebrig") or 0) > 0),
        "nie_pariert": sum(1 for x in laeufe if not x.get("paraden")),
    }
    # Ausreißer
    au = []
    dauern = [float(x.get("dauer") or 0) for x in laeufe]
    hi, lo = q(dauern, 0.95), q(dauern, 0.05)
    for x in laeufe:
        d = float(x.get("dauer") or 0)
        if len(laeufe) >= 8 and d > hi and d > 1.5 * statistics.median(dauern):
            au.append(("Lauf sehr lang", f"{mmss(d)} bis {nm(x.get('erreicht'))} ({x.get('ende')}, {x['_datei']} #{x.get('nr')})"))
        if x.get("ende") == "tod" and d < 60:
            au.append(("früher Tod", f"nach {mmss(d)} in {nm(x.get('erreicht'))} durch {nm((x.get('tod') or {}).get('ursache'))} ({x['_datei']} #{x.get('nr')})"))
        ein = float((x.get("schaden") or {}).get("ein") or 0)
        for k, v in ((x.get("schaden") or {}).get("einJe") or {}).items():
            if ein > 150 and v / ein > 0.6:
                au.append(("Schadensspitze", f"{nm(k)}: {v / ein * 100:.0f} % des Schadens in einem Lauf ({x['_datei']} #{x.get('nr')})"))
    for g, v in ge.items():
        if len(v) >= 4:
            med = statistics.median(v)
            for d in v:
                if med > 0 and d > 3 * med and d > 120:
                    au.append(("Gebiet extrem lang", f"{nm(g)}: {mmss(d)} (Median {mmss(med)})"))
    R["ausreisser"] = au[:40]
    return R

# ---------------------------------------------------------------- Ausgabe
def tabellen(R):
    """Liefert eine Liste (Überschrift, Kopfzeile, Zeilen, Hinweis)."""
    T = []
    U = R["ueberblick"]
    T.append(("Überblick", ["Wert", ""], [
        ["Dateien", str(len(R["quellen"]))], ["Läufe", str(U["laeufe"])],
        ["Siege / Tode / Abbrüche", f'{U["siege"]} / {U["tode"]} / {U["abbrueche"]}  (Siegquote {pct(U["siege"], U["laeufe"]):.1f} %)'],
        ["Spielzeit gesamt", f'{U["spielzeit_h"]:.1f} h · Median je Lauf {mmss(U["median_dauer"])}'],
        ["Versionen", ", ".join(f"v{k} ×{v}" for k, v in U["versionen"])],
        ["Geräte", ", ".join(f"{k} ×{v}" for k, v in U["geraete"])],
        ["Helden", ", ".join(f"{k} ×{v}" for k, v in U["helden"])],
        ["Härte", ", ".join(f"{k} ×{v}" for k, v in sorted(U["haerte"]))],
        ["mit Barmherzigkeit", str(U["gnade"])]], ""))
    nt = max(1, U["tode"])
    T.append(("Todesorte", ["Gebiet", "Tode", "Anteil"], [[nm(k), str(v), f"{pct(v, nt):.0f} %"] for k, v in R["todesorte"]], ""))
    T.append(("Todesursachen", ["Ursache", "Tode", "Anteil"], [[nm(k), str(v), f"{pct(v, nt):.0f} %"] for k, v in R["ursachen"][:20]], ""))
    T.append(("Schwierigste Gegner & Gefahren", ["Gegner/Gefahr", "Tode", "Schaden gesamt", "Ø Schaden je Lauf mit Treffer", "Kills"],
              [[nm(k), str(v["tode"]), f'{v["schaden"]:.0f}', f'{v["schaden"] / max(1, v["laeufe"]):.0f}', str(v["kills"])] for k, v in R["gegner"][:25]],
              "Sortiert nach verursachten Toden, dann Schaden."))
    T.append(("Bosse", ["Boss", "Begegnungen", "Siege", "Siegquote", "Ø Dauer Sieg", "Ø Dauer", "Tode durch Boss", "Ø Restleben bei Niederlage"],
              [[nm("b:" + k), str(v["begegnungen"]), str(v["siege"]), f'{pct(v["siege"], v["begegnungen"]):.0f} %' if v["begegnungen"] else "–",
                mmss(statistics.mean(v["dauer_sieg"])) if v["dauer_sieg"] else "–", mmss(statistics.mean(v["dauer"])) if v["dauer"] else "–", str(v["tode"]),
                f'{statistics.mean(v["rest"]) * 100:.0f} %' if v["rest"] else "–"] for k, v in R["bosse"]],
              "Schwerste zuerst (niedrigste Siegquote)."))
    T.append(("Waffen (getragen am Laufende)", ["Waffe", "Läufe", "Siege", "Siegquote", "Ø Schmiedestufe", "Ø Schadensanteil", "Ø erreichte Stufe"],
              [[nm(k), str(v["laeufe"]), str(v["siege"]), f'{pct(v["siege"], v["laeufe"]):.0f} %', f'{statistics.mean(v["stufe"]):.1f}',
                f'{statistics.mean(v["anteil"]):.0f} %' if v["anteil"] else "–", f'{statistics.mean(v["tiefe"]):.1f}'] for k, v in R["waffen"][:30]], ""))
    T.append(("Dauer je Gebiet", ["Gebiet", "Besuche", "Median", "90 %", "Max"],
              [[nm(k), str(len(v)), mmss(statistics.median(v)), mmss(q(v, 0.9)), mmss(max(v))] for k, v in R["gebiete"]], ""))
    t = R["technik"]
    T.append(("Technik", ["Wert", ""], [["Ø Paraden je Lauf", f'{t["paraden_je_lauf"]:.1f}'], ["Ø Rollen je Lauf", f'{t["rollen_je_lauf"]:.1f}'],
              ["Ø perfektes Ausweichen je Lauf", f'{t["ausweichen_je_lauf"]:.1f}'], ["Ø Tränke je Lauf", f'{t["traenke_je_lauf"]:.1f}'],
              ["Tode mit vollen/übrigen Tränken", str(t["tode_volle_traenke"])], ["Läufe ohne Parade", str(t["nie_pariert"])]], ""))
    T.append(("Ausreißer", ["Art", "Beschreibung"], [[a, b] for a, b in R["ausreisser"]] or [["–", "keine auffälligen Werte"]], ""))
    T = [(t, k, z or [["–"] + [""] * (len(k) - 1)], hw) for t, k, z, hw in T]
    T.append(("Quellen", ["Datei", "Version", "Gerät", "neue Läufe", "Format"], [[a, str(b), str(c), str(d), str(e)] for a, b, c, d, e in R["quellen"]], ""))
    return T

def markdown(R):
    if not R["n"]:
        return "# Spielberichte\n\nKeine Läufe gefunden.\n"
    out = ["# Ezekiel – The Destroyer · Auswertung der Spielberichte", ""]
    for titel, kopf, zeilen, hinw in tabellen(R):
        out += [f"## {titel}", ""]
        if hinw:
            out += [f"_{hinw}_", ""]
        out.append("| " + " | ".join(kopf) + " |")
        out.append("|" + "---|" * len(kopf))
        for z in zeilen:
            out.append("| " + " | ".join(str(c).replace("|", "/") for c in z) + " |")
        out.append("")
    return "\n".join(out)

def html_seite(R):
    e = html.escape
    css = ("body{font:15px/1.45 system-ui,sans-serif;background:#1a1210;color:#f0e0c0;margin:0;padding:24px 32px;max-width:1200px}"
           "h1{color:#e5b454;font-size:24px}h2{color:#ffd27a;font-size:18px;margin-top:28px;border-bottom:1px solid #6e5530}"
           "table{border-collapse:collapse;width:100%;margin:6px 0}th,td{padding:4px 8px;border-bottom:1px solid #3a2a22;text-align:left}"
           "th{color:#c8b090;font-weight:600}tr:hover td{background:rgba(229,180,84,.07)}td:nth-child(n+2){font-variant-numeric:tabular-nums}"
           "em{color:#a89070}.bar{display:inline-block;height:9px;background:linear-gradient(90deg,#8a1f14,#e5b454);border-radius:2px;vertical-align:middle;margin-right:6px}")
    if not R["n"]:
        return f"<!DOCTYPE html><meta charset=utf-8><title>Spielberichte</title><style>{css}</style><h1>Keine Läufe gefunden</h1>"
    h = [f"<!DOCTYPE html><html lang=de><meta charset=utf-8><title>Spielberichte · Auswertung</title><style>{css}</style><body>",
         "<h1>Ezekiel – The Destroyer · Auswertung der Spielberichte</h1>"]
    for titel, kopf, zeilen, hinw in tabellen(R):
        h.append(f"<h2>{e(titel)}</h2>" + (f"<em>{e(hinw)}</em>" if hinw else ""))
        h.append("<table><tr>" + "".join(f"<th>{e(k)}</th>" for k in kopf) + "</tr>")
        mx = None
        if titel in ("Todesorte", "Todesursachen") and zeilen:
            mx = max(int(z[1]) for z in zeilen) or 1
        for z in zeilen:
            cells = []
            for i, c in enumerate(z):
                if mx and i == 1:
                    cells.append(f'<td><span class="bar" style="width:{int(120 * int(c) / mx)}px"></span>{e(str(c))}</td>')
                else:
                    cells.append(f"<td>{e(str(c))}</td>")
            h.append("<tr>" + "".join(cells) + "</tr>")
        h.append("</table>")
    h.append("</body></html>")
    return "\n".join(h)

def main():
    global NAMEN
    ap = argparse.ArgumentParser(description="Spielberichte von „Ezekiel – The Destroyer“ zusammenführen und auswerten.")
    ap.add_argument("dateien", nargs="+")
    ap.add_argument("--md")
    ap.add_argument("--html")
    ap.add_argument("--version")
    ap.add_argument("--ohne-gnade", action="store_true")
    ap.add_argument("--spiel", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "zerstoerer"))
    ap.add_argument("--json", help="Rohdaten der Auswertung als JSON (für weitere Werkzeuge)")
    a = ap.parse_args()
    NAMEN = namen_laden(a.spiel)
    dateien = []
    for d in a.dateien:
        dateien += sorted(glob.glob(d)) if any(ch in d for ch in "*?[") else [d]
    R = auswerten(dateien, a.version, a.ohne_gnade)
    md = markdown(R)
    if a.md:
        open(a.md, "w", encoding="utf-8").write(md)
    if a.html:
        open(a.html, "w", encoding="utf-8").write(html_seite(R))
    if a.json:
        json.dump(R, open(a.json, "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)
    if not a.md and not a.html:
        print(md)
    else:
        print(f"{R['n']} Läufe aus {len(R['quellen'])} Dateien ausgewertet." + (f" → {a.md}" if a.md else "") + (f" → {a.html}" if a.html else ""))

if __name__ == "__main__":
    main()
