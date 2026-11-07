#!/usr/bin/env python3
"""Objektive Prüfung von Audiodateien: Länge, Lautheit, Spitzen, Bandbreite, Grundrauschen, Tieftonanteil, Clipping.
Aufruf: analyse.py datei [datei ...]  -> Tabelle; mit --json Ausgabe als JSON"""
import sys, json, subprocess, numpy as np

SR = 22050 * 2


def lade(p, sr=SR):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32)


def analyse(p):
    x = lade(p)
    if len(x) < SR // 10:
        return {"datei": p, "fehler": "leer"}
    dauer = len(x) / SR
    peak = float(np.max(np.abs(x)))
    rms = float(np.sqrt(np.mean(x ** 2)))
    clip = int(np.sum(np.abs(x) > 0.999))
    # Kurzzeitpegel 100 ms
    n = SR // 10
    k = len(x) // n
    fr = x[: k * n].reshape(k, n)
    st = 20 * np.log10(np.sqrt(np.mean(fr ** 2, axis=1)) + 1e-9)
    boden = float(np.percentile(st, 10))
    hoch = float(np.percentile(st, 95))
    # Spektrum (Welch-artig)
    seg = 4096
    m = len(x) // seg
    if m < 1:
        seg = 1024; m = max(1, len(x) // seg)
    w = np.hanning(seg)
    S = np.zeros(seg // 2 + 1)
    for i in range(min(m, 400)):
        j = i * (len(x) // seg // min(m, 400)) * seg if m > 400 else i * seg
        S += np.abs(np.fft.rfft(x[j:j + seg] * w)) ** 2
    f = np.fft.rfftfreq(seg, 1 / SR)
    Sd = 10 * np.log10(S + 1e-20)
    ref = np.max(Sd[(f > 100) & (f < 8000)])
    # Bandbreite: höchste Frequenz, über der das Spektrum dauerhaft 60 dB unter dem Maximum liegt
    ober = f[Sd > ref - 60]
    bw = float(ober.max()) if len(ober) else 0.0
    tot = S[f > 20].sum()
    tief = float(S[(f > 20) & (f < 150)].sum() / tot)
    schwer = float((S * f).sum() / S.sum())
    # Rauschcharakter in den leisesten 10 %: Spektrum der leisesten Fenster
    return {"datei": p.split("/")[-1], "dauer": round(dauer, 1), "peak_db": round(20 * np.log10(peak + 1e-9), 1),
            "rms_db": round(20 * np.log10(rms + 1e-9), 1), "boden_db": round(boden, 1), "hoch_db": round(hoch, 1),
            "dynamik": round(hoch - boden, 1), "bandbreite": int(bw), "tief_anteil": round(tief, 3),
            "schwerpunkt": int(schwer), "clip": clip}


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    res = [analyse(a) for a in args]
    if "--json" in sys.argv:
        print(json.dumps(res, ensure_ascii=False))
    else:
        print(f"{'datei':<34}{'dauer':>7}{'peak':>7}{'rms':>7}{'boden':>7}{'hoch':>7}{'dyn':>6}{'bw':>7}{'tief':>7}{'schw':>6}{'clip':>6}")
        for r in res:
            if "fehler" in r:
                print(r); continue
            print(f"{r['datei'][:33]:<34}{r['dauer']:>7}{r['peak_db']:>7}{r['rms_db']:>7}{r['boden_db']:>7}{r['hoch_db']:>7}{r['dynamik']:>6}{r['bandbreite']:>7}{r['tief_anteil']:>7}{r['schwerpunkt']:>6}{r['clip']:>6}")
