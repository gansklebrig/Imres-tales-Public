#!/usr/bin/env python3
"""Aufbereitung für Imres Tales: Teppiche (nahtlose Mono-Schleifen) und Einzelereignisse.
Wird als Modul benutzt (import proc)."""
import subprocess, numpy as np, os, glob, json, re

SR = 44100
AMB = "/home/claude/imres-tales-public/amb"


def lade(p, ab=0, dauer=None):
    cmd = ["ffmpeg", "-v", "error"]
    if ab:
        cmd += ["-ss", str(ab)]
    cmd += ["-i", p]
    if dauer:
        cmd += ["-t", str(dauer)]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, dtype=np.float32).copy()


def filter_(x, hp=None, lp=None):
    """Hoch-/Tiefpass über ffmpeg (biquad 2. Ordnung, zweimal)"""
    if not hp and not lp:
        return x
    af = []
    if hp:
        af += [f"highpass=f={hp}", f"highpass=f={hp}"]
    if lp:
        af += [f"lowpass=f={lp}", f"lowpass=f={lp}"]
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", ",".join(af),
                        "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def aktiv_rms_db(x):
    """RMS (dB) über die aktiven 50-ms-Fenster (innerhalb 30 dB unter dem lautesten)"""
    n = SR // 20
    k = max(1, len(x) // n)
    fr = x[: k * n].reshape(k, n) if len(x) >= n else x.reshape(1, -1)
    e = np.mean(fr ** 2, axis=1) + 1e-12
    edb = 10 * np.log10(e)
    m = edb > edb.max() - 30
    return float(10 * np.log10(np.mean(e[m])))


def schreibe_mp3(x, ziel, kbps):
    x = np.clip(x, -1, 1).astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", f"{kbps}k", "-ar", str(SR), "-ac", "1", "-map_metadata", "-1", ziel],
                   input=x.tobytes(), check=True)


def begrenze(x, ceil_db=-1.0):
    """weicher Spitzenbegrenzer: skaliert so, dass die Spitze bei ceil liegt, falls darüber"""
    c = 10 ** (ceil_db / 20)
    p = np.max(np.abs(x)) + 1e-12
    if p > c:
        # sanfte Kompression nur der Spitzen (tanh-Knie ab 0.7*c)
        k = 0.7 * c
        y = x.copy()
        a = np.abs(y) > k
        y[a] = np.sign(y[a]) * (k + (c - k) * np.tanh((np.abs(y[a]) - k) / (c - k)))
        return y
    return x


def ereignis(quelle, ab, dauer, ziel, ziel_db, hp=60, lp=None, ein=0.004, aus=0.15, kbps=80, tempo=None):
    """Einzelereignis: Ausschnitt, Filter, Stille vorn/hinten weg, Blenden, Pegel auf ziel_db (aktiver RMS), MP3"""
    x = lade(quelle, max(0, ab - 0.2), dauer + 0.4)
    x = filter_(x, hp, lp)
    x = x[int(0.2 * SR): int(0.2 * SR) + int(dauer * SR)] if ab >= 0.2 else x[int(ab * SR):int((ab + dauer) * SR)]
    # Stille vorn/hinten weg (Schwelle 40 dB unter Spitze, 20-ms-Fenster)
    n = SR // 50
    k = len(x) // n
    edb = 10 * np.log10(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1) + 1e-12)
    an = np.where(edb > edb.max() - 40)[0]
    s = max(0, (an[0] - 1) * n); e = min(len(x), (an[-1] + 3) * n)
    x = x[s:e].copy()
    ne = int(ein * SR); na = int(aus * SR)
    x[:ne] *= np.linspace(0, 1, ne)
    x[-na:] *= np.linspace(1, 0, na) ** 1.5
    g = 10 ** ((ziel_db - aktiv_rms_db(x)) / 20)
    x = x * g
    x = begrenze(x, -1.5)
    norm = 1.0
    for _ in range(6):
        schreibe_mp3(x * norm, ziel, kbps) if norm != 1.0 else schreibe_mp3(x, ziel, kbps)
        pk = 20 * np.log10(np.max(np.abs(lade(ziel))) + 1e-12)
        if pk <= -0.8:
            break
        norm *= 10 ** ((-1.0 - pk) / 20)
    return {"dauer": round(len(x) / SR, 2), "gain_db": round(20 * np.log10(g * norm), 1), "norm": round(1 / norm, 2)}


def schleife(quelle, ab, laenge, ziel, ziel_db, ueber=4.0, hp=40, lp=None, kbps=96):
    """nahtlose Schleife: Ausschnitt laenge+ueber, das Ende wird über den Anfang geblendet (gleichleistungs-Blende)"""
    x = lade(quelle, ab, laenge + ueber + 0.5)
    x = filter_(x, hp, lp)[: int((laenge + ueber) * SR)]
    L = int(laenge * SR); U = int(ueber * SR)
    if len(x) < L + U:
        raise ValueError(f"zu kurz: {quelle} {len(x)/SR:.1f}s")
    t = np.linspace(0, np.pi / 2, U)
    kopf = x[:U] * np.sin(t) + x[L:L + U] * np.cos(t)
    y = np.concatenate([kopf, x[U:L]])
    rms = np.sqrt(np.mean(y ** 2))
    g = 10 ** ((ziel_db - 20 * np.log10(rms + 1e-12)) / 20)
    y = begrenze(y * g, -1.5)
    for _ in range(6):
        schreibe_mp3(y, ziel, kbps)
        pk = 20 * np.log10(np.max(np.abs(lade(ziel))) + 1e-12)
        if pk <= -0.8:
            break
        y = y * 10 ** ((-1.0 - pk) / 20)
    return {"dauer": round(len(y) / SR, 1), "rms": round(float(np.sqrt(np.mean(y ** 2))), 4)}


def naht(p):
    """Pegelsprung an der Naht: RMS der letzten vs. ersten 0,5 s (dB) und Sprung der Abtastwerte"""
    x = lade(p)
    n = SR // 20
    a = 20 * np.log10(np.sqrt(np.mean(x[-n:] ** 2)) + 1e-12)
    b = 20 * np.log10(np.sqrt(np.mean(x[:n] ** 2)) + 1e-12)
    return round(a - b, 2), round(float(abs(x[-1] - x[0])), 4)


def regionen(quelle, ab=0, dauer=None, hp=150, schwelle=12, luecke=0.35, minlen=0.15, maxlen=8):
    """aktive Abschnitte finden (über Grundrauschen + schwelle dB)"""
    x = filter_(lade(quelle, ab, dauer), hp)
    n = SR // 50
    k = len(x) // n
    edb = 10 * np.log10(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1) + 1e-12)
    boden = np.percentile(edb, 20)
    akt = edb > boden + schwelle
    reg = []; i = 0
    while i < k:
        if akt[i]:
            j = i
            while j < k and (akt[j] or (np.any(akt[j:j + int(luecke * 50)]) and j - i < maxlen * 50)):
                j += 1
            if (j - i) / 50 >= minlen:
                reg.append((round(ab + i / 50, 2), round((j - i) / 50, 2), round(float(edb[i:j].max() - boden), 1)))
            i = j
        else:
            i += 1
    return reg
