/* Klangwerk: rechnet Geräusche Sample für Sample aus (Stimmen, Brüllen, Metall, Holz, Donner …).
   Die Ergebnisse sind einfache Float32-Arrays; das Lautenwerk macht daraus AudioBuffer und spielt sie ab.
   Alles ist zufällig variiert, damit kein Effekt zweimal gleich klingt. */
(function (wurzel) {
  "use strict";
  const TAU = Math.PI * 2;
  const zz = (a, b) => a + Math.random() * (b - a);
  const wahl = l => l[Math.floor(Math.random() * l.length)];

  /* Zustandsvariablen-Filter (TPT): stabil, auch wenn sich die Frequenz laufend ändert */
  function SVF(sr) { this.sr = sr; this.s1 = 0; this.s2 = 0; this.setze(1000, 1); }
  SVF.prototype.setze = function (f, q) {
    const g = Math.tan(Math.PI * Math.min(Math.max(f, 10), this.sr * .45) / this.sr);
    this.k = 1 / q; this.a1 = 1 / (1 + g * (g + this.k)); this.a2 = g * this.a1; this.a3 = g * this.a2;
  };
  SVF.prototype.tick = function (x) {
    const v3 = x - this.s2, v1 = this.a1 * this.s1 + this.a2 * v3, v2 = this.s2 + this.a2 * this.s1 + this.a3 * v3;
    this.s1 = 2 * v1 - this.s1; this.s2 = 2 * v2 - this.s2;
    this.lp = v2; this.bp = v1 * this.k; this.hp = x - this.k * v1 - v2; return this.bp;
  };
  /* einfache Hilfsfilter über ein ganzes Array */
  function tiefpass(a, sr, f, stufen) {
    const c = 1 - Math.exp(-TAU * f / sr);
    for (let s = 0; s < (stufen || 1); s++) { let y = 0; for (let i = 0; i < a.length; i++) { y += c * (a[i] - y); a[i] = y; } }
    return a;
  }
  function hochpass(a, sr, f) {
    const c = 1 - Math.exp(-TAU * f / sr); let y = 0;
    for (let i = 0; i < a.length; i++) { y += c * (a[i] - y); a[i] -= y; }
    return a;
  }
  function normieren(a, spitze) {
    let m = 0; for (let i = 0; i < a.length; i++) { const v = Math.abs(a[i]); if (v > m) m = v; }
    if (m > 0) { const f = (spitze || .9) / m; for (let i = 0; i < a.length; i++) a[i] *= f; }
    return a;
  }
  function blenden(a, sr, ein, aus) {
    const ne = Math.floor(ein * sr), na = Math.floor(aus * sr);
    for (let i = 0; i < ne && i < a.length; i++) a[i] *= i / ne;
    for (let i = 0; i < na && i < a.length; i++) a[a.length - 1 - i] *= i / na;
    return a;
  }
  /* nahtlose Schleife: das Ende wird in den Anfang geblendet */
  function schleife(a, sr, ueber) {
    const n = Math.floor(ueber * sr), L = a.length - n, o = new Float32Array(L);
    for (let i = 0; i < L; i++) o[i] = a[i];
    for (let i = 0; i < n; i++) { const w = i / n; o[i] = a[i] * Math.sqrt(w) + a[L + i] * Math.sqrt(1 - w); }
    return o;
  }
  /* kurze Raumreflexionen – macht Dinge „weiter weg" */
  function raum(a, sr, refl) {
    const o = new Float32Array(a.length);
    for (let i = 0; i < a.length; i++) o[i] = a[i];
    refl.forEach(([d, g]) => { const n = Math.floor(d * sr); for (let i = n; i < a.length; i++) o[i] += a[i - n] * g; });
    return o;
  }
  /* angeregte Resonanz (Mode): gedämpfte Sinusschwingung, direkt aufaddiert */
  function mode(a, sr, start, f, abkling, laut, phase) {
    const i0 = Math.floor(start * sr), n = Math.min(a.length - i0, Math.floor(abkling * 7 * sr));
    const w = TAU * f / sr, d = Math.exp(-1 / (abkling * sr)); let g = laut, p = phase || 0;
    for (let i = 0; i < n; i++) { a[i0 + i] += Math.sin(p) * g; p += w; g *= d; }
  }
  /* Rauschstoß durch einen Bandpass */
  function stoss(a, sr, start, f, q, laut, dauer, form) {
    const i0 = Math.floor(start * sr), n = Math.min(a.length - i0, Math.floor(dauer * sr)), F = new SVF(sr); F.setze(f, q);
    for (let i = 0; i < n; i++) {
      const t = i / n, h = form === "weich" ? Math.sin(Math.PI * t) : Math.pow(1 - t, 3);
      F.tick(Math.random() * 2 - 1); a[i0 + i] += F.bp * laut * h;
    }
  }

  /* ---------- Stimmen ----------
     Quelle (Stimmlippen) → drei Formantfilter (Vokal) → Lautstärkehülle; dazu Hauch und Konsonanten. */
  const VOKALE = { a: [730, 1090, 2440], e: [530, 1840, 2480], i: [300, 2200, 2950], o: [570, 840, 2410], u: [320, 870, 2240], ae: [660, 1720, 2410], oe: [460, 1450, 2350] };
  const VOK_LISTE = Object.keys(VOKALE);
  /* silben: [{d, v, f0, f1, laut, hauch, kons}] ; o: {skala, jitter, rau, hauchBasis, vibrato} */
  function stimme(a, sr, t0, silben, o) {
    o = o || {};
    const skala = o.skala || 1, jit = o.jitter == null ? .02 : o.jitter, hb = o.hauchBasis || .04;
    const F = [new SVF(sr), new SVF(sr), new SVF(sr)], FG = [1, .55, .3], FQ = o.q || [6, 9, 11];
    const K = new SVF(sr); K.setze(4200, 1.2);
    let fm = VOKALE[silben[0].v].map(f => f * skala);
    let phase = 0, per = 1, i = Math.floor(t0 * sr), lp = 0;
    const vibF = o.vibrato ? o.vibrato[0] : 0, vibT = o.vibrato ? o.vibrato[1] : 0;
    for (let s = 0; s < silben.length; s++) {
      const sb = silben[s], n = Math.floor(sb.d * sr), ziel = VOKALE[sb.v].map(f => f * skala * zz(.95, 1.05));
      const att = Math.min(.03, sb.d * .25), abf = sb.d * (sb.abfall || .35);
      for (let k = 0; k < n && i < a.length; k++, i++) {
        if (i < 0) continue;
        const t = k / sr, r = k / n;
        if ((k & 15) === 0) {
          for (let j = 0; j < 3; j++) { fm[j] += (ziel[j] - fm[j]) * .12; F[j].setze(fm[j], FQ[j]); }
        }
        const f0 = (sb.f0 + (sb.f1 - sb.f0) * r) * (1 + vibT * Math.sin(TAU * vibF * (i / sr)));
        phase += f0 * per / sr;
        if (phase >= 1) { phase -= 1; per = 1 + (Math.random() * 2 - 1) * jit; }
        let quelle = 2 * phase - 1;
        if (o.rau) quelle *= 1 - o.rau * (Math.random() < .5 ? 1 : 0) * .5;
        lp += .35 * (quelle - lp); /* sanftere Obertöne */
        const huelle = t < att ? t / att : (t > sb.d - abf ? Math.max(0, (sb.d - t) / abf) : 1);
        const hauchAnteil = sb.hauch ? (r < sb.hauch ? 1 : Math.max(0, 1 - (r - sb.hauch) * 6)) : 0;
        const rausch = Math.random() * 2 - 1;
        const x = lp * (1 - hauchAnteil * .85) * 1.4 + rausch * (hb + hauchAnteil * .9);
        let y = 0; for (let j = 0; j < 3; j++) y += F[j].tick(x) * FG[j];
        let kons = 0;
        if (sb.kons && t < .045) kons = K.tick(rausch) * (1 - t / .045) * sb.kons;
        a[i] += (y * huelle + kons) * (sb.laut == null ? 1 : sb.laut);
      }
    }
  }
  /* ein Satz Geplauder: Silbenfolge mit sinkender Satzmelodie */
  function satz(grund, silbenzahl) {
    const s = [], abw = zz(.08, .2);
    for (let k = 0; k < silbenzahl; k++) {
      const r = k / silbenzahl, f = grund * (1.12 - .22 * r) * (1 + zz(-abw, abw) * (k % 3 === 1 ? 1.5 : .6));
      s.push({ d: zz(.09, .24), v: wahl(VOK_LISTE), f0: f, f1: f * zz(.93, 1.04), laut: zz(.55, 1), kons: Math.random() < .55 ? zz(.3, .8) : 0 });
    }
    s[s.length - 1].d *= 1.5; s[s.length - 1].f1 *= .88;
    return s;
  }
  /* Lachen: „ha-ha-ha" mit Hauch, fallender Tonhöhe und nachlassender Kraft */
  function lachSilben(grund) {
    const n = 4 + Math.floor(Math.random() * 6), v = wahl(["a", "a", "ae", "e", "i"]), s = [];
    const takt = zz(.15, .2);
    for (let k = 0; k < n; k++) {
      const r = k / n, f = grund * (1.45 - .45 * r) * zz(.96, 1.04);
      s.push({ d: takt * zz(.9, 1.1), v, f0: f * 1.04, f1: f * .92, laut: (1 - r * .55) * zz(.8, 1), hauch: .42, abfall: .55 });
    }
    if (Math.random() < .5) s.push({ d: .32, v: "i", f0: grund, f1: grund, laut: .25, hauch: 1 }); /* Einatmen */
    return s;
  }

  /* ---------- Kulissen ---------- */
  const KULISSE = {
    /* fernes Stimmengewirr einer vollen Gaststube (Schleife) */
    gemurmel(sr) {
      const L = 22, a = new Float32Array(Math.floor((L + 2.5) * sr));
      for (let v = 0; v < 11; v++) {
        const frau = Math.random() < .4, grund = frau ? zz(185, 240) : zz(95, 140), skala = frau ? 1.16 : zz(.95, 1.03);
        const nah = zz(.25, 1) * (v < 2 ? 1.3 : 1);
        let t = zz(-.5, 2);
        while (t < L + 2.5) {
          const s = satz(grund, 3 + Math.floor(Math.random() * 12));
          s.forEach(x => { x.laut *= nah; });
          stimme(a, sr, t, s, { skala, jitter: .025, hauchBasis: .05 });
          t += s.reduce((x, y) => x + y.d, 0) + zz(.25, 1.6);
        }
      }
      hochpass(a, sr, 160); tiefpass(a, sr, 1800, 3);
      const b = raum(a, sr, [[.019, .35], [.031, .28], [.047, .22], [.071, .15], [.103, .1]]);
      return normieren(schleife(b, sr, 2.5), .8);
    },
    /* Lagerfeuer: weiches Rauschen der Flammen, leises Knistern, selten ein Knacken */
    feuer(sr) {
      const L = 20, a = new Float32Array(Math.floor((L + 2) * sr));
      /* Flammen: rotes Rauschen, langsam atmend */
      let braun = 0, atem = .5, ziel = .5;
      const F = new SVF(sr); F.setze(260, .6);
      for (let i = 0; i < a.length; i++) {
        if (i % 2000 === 0) ziel = zz(.35, 1);
        atem += (ziel - atem) * .0004;
        braun = braun * .985 + (Math.random() * 2 - 1) * .1;
        F.tick(braun); a[i] = F.lp * .9 * atem;
      }
      /* Knistern: viele winzige Holzklicks, wenige größere – mit Körper statt Zischen */
      let t = 0;
      while (t < L + 2) {
        const gross = Math.random() < .12, laut = gross ? zz(.25, .5) : zz(.03, .14);
        mode(a, sr, t, zz(900, 2600), zz(.0015, .004), laut, Math.random() * TAU);
        if (gross) mode(a, sr, t, zz(500, 900), .006, laut * .6);
        if (Math.random() < .25) { /* kleine Kaskade */
          for (let k = 1; k < 2 + Math.random() * 5; k++) mode(a, sr, t + k * zz(.006, .03), zz(1200, 2600), .002, laut * zz(.3, .7));
        }
        t += Math.random() < .2 ? zz(.02, .08) : zz(.08, .45);
      }
      /* gelegentliches Zischen von Harz */
      for (let k = 0; k < 3; k++) stoss(a, sr, zz(0, L), zz(2500, 3800), 2, .03, zz(.6, 1.4), "weich");
      tiefpass(a, sr, 5000);
      return normieren(schleife(a, sr, 2), .8);
    }
  };

  /* Blechbläser-Ton: Sägezahn durch einen Tiefpass, der mit der Lautstärke aufgeht (so klingen Hörner und Posaunen) */
  function blech(a, sr, t0, dauer, f, o) {
    o = o || {};
    const i0 = Math.floor(t0 * sr), n = Math.min(a.length - i0, Math.floor(dauer * sr)), F = new SVF(sr);
    const ein = o.ein || .05, aus = o.aus || .12, hell = o.hell || 1800, laut = o.laut || 1;
    let p = Math.random(), p2 = Math.random();
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const h = t < ein ? t / ein : t > dauer - aus ? Math.max(0, (dauer - t) / aus) : 1;
      let ff = f * (o.gleit ? Math.pow(o.gleit, t / dauer) : 1);
      if (o.vib) ff *= 1 + o.vib * Math.sin(TAU * 5.5 * t) * Math.min(1, t / .25);
      p += ff / sr; if (p >= 1) p -= 1; p2 += ff * 1.004 / sr; if (p2 >= 1) p2 -= 1;
      const wah = o.wah ? .35 + .65 * Math.pow(Math.sin(Math.PI * Math.min(1, t / (dauer * .7))), 1.5) : 1;
      if ((i & 31) === 0) F.setze(150 + hell * Math.pow(h, 1.5) * wah, .9);
      F.tick((2 * p - 1) + (2 * p2 - 1) * .6);
      a[i0 + i] += Math.tanh(F.lp * 1.3) * h * laut;
    }
  }
  /* Becken: dichter Schwarm unharmonischer Teiltöne plus zischendes Rauschen */
  function becken(a, sr, t0, laut, dauer) {
    for (let k = 0; k < 40; k++) mode(a, sr, t0, zz(3000, 11000), dauer * zz(.3, 1), laut * zz(.02, .06), Math.random() * TAU);
    const i0 = Math.floor(t0 * sr), n = Math.min(a.length - i0, Math.floor(dauer * 2 * sr)), F = new SVF(sr); F.setze(8000, .7);
    for (let i = 0; i < n; i++) { F.tick(Math.random() * 2 - 1); a[i0 + i] += F.hp * laut * .5 * Math.exp(-i / sr / (dauer * .45)); }
  }
  /* Trommelschlag: Tonhöhe fällt, dazu Fellrauschen */
  function trommel(a, sr, t0, f0, f1, laut, dauer) {
    const i0 = Math.floor(t0 * sr), n = Math.min(a.length - i0, Math.floor(dauer * sr)); let p = 0;
    for (let i = 0; i < n; i++) { const r = i / n; p += (f1 + (f0 - f1) * Math.exp(-r * 6)) / sr; a[i0 + i] += Math.sin(TAU * p) * laut * Math.exp(-r * 5); }
    stoss(a, sr, t0, 1800, .8, laut * .45, .05);
  }
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- Effekte (je Aufruf eine neue Variante) ---------- */
  const EFFEKT = {
    lachen(sr) {
      const a = new Float32Array(Math.floor(3.4 * sr)), leute = Math.random() < .55 ? 1 : 2 + Math.floor(Math.random() * 2);
      for (let p = 0; p < leute; p++) {
        const frau = Math.random() < .45, grund = frau ? zz(260, 360) : zz(140, 210);
        const s = lachSilben(grund); s.forEach(x => { x.laut *= p ? zz(.4, .8) : 1; });
        stimme(a, sr, p ? zz(.1, .7) : .02, s, { skala: frau ? 1.15 : 1, jitter: .035, hauchBasis: .08 });
      }
      hochpass(a, sr, 180); tiefpass(a, sr, 2200, 2);
      return normieren(raum(a, sr, [[.023, .3], [.041, .22], [.067, .15]]), .9);
    },
    /* ---------- Spieltisch-Momente ---------- */
    tusch(sr) {
      const a = new Float32Array(Math.floor(2 * sr));
      trommel(a, sr, .01, 260, 170, .8, .25); stoss(a, sr, .01, 3500, .6, .5, .12);   /* ba */
      trommel(a, sr, .19, 170, 105, 1, .35);                                           /* dum */
      trommel(a, sr, .38, 90, 50, .7, .3); stoss(a, sr, .38, 2500, .7, .35, .1);
      becken(a, sr, .38, .9, 1.1);                                                     /* tss */
      return normieren(a, .9);
    },
    posaune(sr) {
      const a = new Float32Array(Math.floor(3.6 * sr)), b = zz(53, 56);
      [[0, .5, 0], [.55, .5, -1], [1.1, .5, -2], [1.65, 1.6, -3]].forEach(([t, d, iv], k) =>
        blech(a, sr, t, d, midi(b + iv), { wah: true, hell: 1000, ein: .04, aus: k === 3 ? .5 : .08, vib: k === 3 ? .025 : 0, gleit: k === 3 ? .97 : 1 }));
      tiefpass(a, sr, 3200);
      return normieren(raum(a, sr, [[.05, .2], [.09, .12]]), .9);
    },
    krit(sr) {
      const a = new Float32Array(Math.floor(3.6 * sr)), g = zz(58, 61);
      /* Fanfare: Dreiklang hinauf, dann der volle Akkord */
      [[0, .14, 0], [.15, .14, 4], [.3, .14, 7], [.45, 2.4, 12]].forEach(([t, d, iv]) => blech(a, sr, t, d, midi(g + iv), { hell: 2600, laut: .8, aus: .5 }));
      [0, 4, 7].forEach(iv => blech(a, sr, .45, 2.4, midi(g - 12 + iv), { hell: 1400, laut: .5, aus: .6 }));
      /* Chor: „Aaah!" */
      [0, 4, 7, 12].forEach((iv, k) => {
        const f = midi(g + iv);
        stimme(a, sr, .45 + k * .02, [{ d: 2.6, v: "a", f0: f, f1: f, laut: .55, abfall: .4 }], { skala: k > 1 ? 1.15 : 1, jitter: .006, hauchBasis: .03, vibrato: [5.2, .012] });
      });
      becken(a, sr, .45, .7, 2);
      trommel(a, sr, .45, 120, 60, .8, .6);
      return normieren(raum(a, sr, [[.04, .3], [.08, .2], [.15, .12]]), .92);
    },
    dramatisch(sr) {
      const a = new Float32Array(Math.floor(4.2 * sr)), g = zz(48, 51);
      const stab = (t, d, akk, laut) => akk.forEach(iv => { blech(a, sr, t, d, midi(g + iv), { hell: 2200, laut, ein: .02, aus: d > 1 ? .9 : .07 }); blech(a, sr, t, d, midi(g + iv - 12), { hell: 900, laut: laut * .7, ein: .02, aus: d > 1 ? .9 : .07 }); });
      stab(0, .28, [0, 3, 7], .5); trommel(a, sr, 0, 90, 55, .8, .4);
      stab(.36, .28, [0, 3, 7], .5); trommel(a, sr, .36, 90, 55, .8, .4);
      stab(.78, 3.2, [-1, 2, 5, 8], .55); trommel(a, sr, .78, 75, 42, 1.2, 1.2);
      /* Pauken-Wirbel im Nachklang */
      for (let t = 1.2; t < 3.4; t += zz(.05, .07)) trommel(a, sr, t, 70, 45, .2 * (1 - (t - 1.2) / 2.4), .2);
      return normieren(raum(a, sr, [[.05, .3], [.11, .22], [.2, .14]]), .92);
    },
    grillen(sr) {
      const a = new Float32Array(Math.floor(4.4 * sr));
      [[zz(4300, 4600), 0, .55, 1], [zz(4800, 5200), .27, .7, .6]].forEach(([f, start, abst, laut]) => {
        for (let t = start; t < 3.6; t += abst * zz(.92, 1.08)) {
          for (let k = 0; k < 3; k++) {
            const i0 = Math.floor((t + k * .034) * sr), n = Math.floor(.022 * sr);
            for (let i = 0; i < n && i0 + i < a.length; i++) a[i0 + i] += Math.sin(TAU * f * i / sr) * Math.sin(Math.PI * i / n) * .25 * laut;
          }
        }
      });
      /* … und irgendwer hüstelt verlegen */
      [3.75, 3.98].forEach((t, k) => stimme(a, sr, t, [{ d: .14, v: "ae", f0: 140, f1: 120, laut: .9 - k * .3, hauch: 1, abfall: .7 }], { jitter: .05, hauchBasis: .2 }));
      return normieren(a, .85);
    },
    ooh(sr) {
      const a = new Float32Array(Math.floor(2.6 * sr));
      for (let v = 0; v < 12; v++) {
        const frau = Math.random() < .45, g = (frau ? zz(220, 300) : zz(110, 160)), t = zz(0, .15);
        stimme(a, sr, t, [{ d: .5, v: "o", f0: g * .9, f1: g * 1.35, laut: zz(.5, 1), abfall: .05 }, { d: zz(1.1, 1.5), v: "u", f0: g * 1.35, f1: g * .85, laut: zz(.5, 1), abfall: .6 }],
          { skala: frau ? 1.15 : 1, jitter: .02, hauchBasis: .08 });
      }
      hochpass(a, sr, 120); tiefpass(a, sr, 3000);
      return normieren(raum(a, sr, [[.021, .3], [.037, .25], [.061, .15]]), .9);
    },
    muenzen(sr) {
      const a = new Float32Array(Math.floor(2 * sr));
      const klirr = (t, g) => {
        const f = zz(2600, 4200);
        [[1, 1, .18], [2.21, .7, .12], [3.73, .45, .08], [5.4, .3, .05]].forEach(([m, gg, d]) => { mode(a, sr, t, f * m, d, g * gg * .3, Math.random() * TAU); mode(a, sr, t, f * m * 1.003, d, g * gg * .2, Math.random() * TAU); });
        stoss(a, sr, t, 5000, 1, g * .3, .006);
      };
      let t = .02;
      for (let k = 0; k < 22; k++) { klirr(t, zz(.4, 1) * (1 - k / 30)); t += Math.random() < .3 ? zz(.005, .02) : zz(.03, .09); }
      for (let k = 0; k < 5; k++) { klirr(t, zz(.2, .4)); t += zz(.04, .08); }
      return normieren(a, .9);
    },
    ruelpser(sr) {
      const a = new Float32Array(Math.floor(1.6 * sr)), f = zz(68, 90);
      stimme(a, sr, .02, [{ d: zz(.55, .8), v: "oe", f0: f * 1.15, f1: f * .85, laut: 1, abfall: .3 }, { d: .18, v: "ae", f0: f * .85, f1: f * .7, laut: .6, abfall: .9 }],
        { jitter: .25, rau: .9, hauchBasis: .1, q: [4, 6, 8] });
      for (let i = 0; i < a.length; i++) a[i] = Math.tanh(a[i] * 4);
      tiefpass(a, sr, 2400);
      return normieren(raum(a, sr, [[.03, .25], [.06, .15]]), .9);
    },
    schnarchen(sr) {
      const a = new Float32Array(Math.floor(4.8 * sr));
      [0, 2.3].forEach(t0 => {
        /* einatmen: rasselndes Gaumensegel */
        const n = Math.floor(1.3 * sr), F1 = new SVF(sr), F2 = new SVF(sr), i0 = Math.floor(t0 * sr); F1.setze(500, 3); F2.setze(1200, 4);
        let p = 0;
        for (let i = 0; i < n; i++) {
          const r = i / n, f = 28 + 10 * r; p += f / sr; if (p >= 1) p -= 1;
          const puls = p < .25 ? 1 : 0, x = puls * zz(.6, 1) + (Math.random() * 2 - 1) * .25;
          a[i0 + i] += (F1.tick(x) + F2.tick(x) * .5) * Math.sin(Math.PI * Math.min(1, r * 1.15)) * 1.2;
        }
        /* ausatmen: „pfüüü" */
        stoss(a, sr, t0 + 1.45, zz(900, 1300), 3, .25, .75, "weich");
      });
      tiefpass(a, sr, 2200, 2);
      return normieren(a, .9);
    },
    bonk(sr) {
      const a = new Float32Array(Math.floor(2.2 * sr));
      [[zz(300, 360), .12, 1], [zz(820, 900), .07, .6], [zz(1400, 1500), .04, .35]].forEach(([f, d, g]) => mode(a, sr, .01, f, d, g * .7));
      stoss(a, sr, .01, 1200, 1, .6, .02);
      let p = 0; const n = Math.floor(.22 * sr);
      for (let i = 0; i < n; i++) { const r = i / n; p += (950 * Math.pow(.32, r)) / sr; a[i] += Math.sin(TAU * p) * .35 * (1 - r); }
      /* Vögelchen kreisen um den Kopf */
      for (let k = 0; k < 6; k++) {
        const t0 = .45 + k * .2, f = k % 2 ? 3100 : 2600, i0 = Math.floor(t0 * sr), m = Math.floor(.09 * sr); let q = 0;
        for (let i = 0; i < m; i++) { const r = i / m; q += f * (1 + .25 * Math.sin(Math.PI * r)) / sr; a[i0 + i] += Math.sin(TAU * q) * .12 * Math.sin(Math.PI * r) * (1 - k / 8); }
      }
      return normieren(a, .9);
    },
    /* ---------- Ereignisse für die Geräuschkulissen ---------- */
    moewe(sr) {
      const a = new Float32Array(Math.floor(2.4 * sr)), n = 2 + Math.floor(Math.random() * 3), f = zz(950, 1250);
      let t = .02;
      for (let k = 0; k < n; k++) {
        const d = k === n - 1 ? zz(.35, .5) : zz(.18, .26);
        stimme(a, sr, t, [{ d, v: "ae", f0: f * zz(1.05, 1.15), f1: f * zz(.6, .7), laut: 1 - k * .12, abfall: .4 }], { skala: 1.7, jitter: .03, rau: .35, hauchBasis: .05, q: [8, 10, 12] });
        t += d + zz(.08, .16);
      }
      hochpass(a, sr, 500);
      return normieren(raum(a, sr, [[.12, .18], [.25, .08]]), .9);
    },
    vogel(sr) {
      const a = new Float32Array(Math.floor(2.2 * sr)), art = Math.floor(Math.random() * 4);
      const pfiff = (t, f0, f1, d, g) => { const i0 = Math.floor(t * sr), n = Math.floor(d * sr); let p = 0;
        for (let i = 0; i < n && i0 + i < a.length; i++) { const r = i / n; p += (f0 + (f1 - f0) * r) / sr; a[i0 + i] += (Math.sin(TAU * p) + .15 * Math.sin(2 * TAU * p)) * g * Math.sin(Math.PI * r); } };
      if (art === 0) { const f = zz(3200, 4500); for (let k = 0; k < 10 + Math.random() * 12; k++) pfiff(.02 + k * .045, f * zz(.95, 1.05), f * zz(1.1, 1.25), .03, .5); }      /* Triller */
      else if (art === 1) { let t = .02; for (let k = 0; k < 4 + Math.random() * 4; k++) { const f0 = zz(2200, 4200), d = zz(.06, .16); pfiff(t, f0, f0 * zz(.7, 1.4), d, .6); t += d + zz(.02, .08); } } /* Melodie */
      else if (art === 2) { const f = zz(560, 680); pfiff(.02, f * 1.2, f * 1.18, .22, .7); pfiff(.32, f, f * .98, .3, .6); }                                             /* Kuckuck */
      else { const f = zz(5000, 6500); for (let k = 0; k < 3; k++) pfiff(.02 + k * .18, f, f * .8, .07, .4); }                                                                 /* Meise */
      return normieren(raum(a, sr, [[.09, .2], [.2, .1]]), .85);
    },
    specht(sr) {
      const a = new Float32Array(Math.floor(1.8 * sr)), f = zz(900, 1300), n = 12 + Math.floor(Math.random() * 10);
      let t = .02, abst = .065;
      for (let k = 0; k < n; k++) { const g = Math.min(1, (k + 2) / 4) * (1 - k / (n * 1.3)); mode(a, sr, t, f * zz(.97, 1.03), .012, g * .6); mode(a, sr, t, f * .42, .02, g * .5); stoss(a, sr, t, 2500, 1, g * .3, .004); t += abst; abst *= .985; }
      return normieren(raum(a, sr, [[.1, .25], [.22, .12]]), .85);
    },
    eule(sr) {
      const a = new Float32Array(Math.floor(3 * sr)), f = zz(340, 420);
      const huu = (t, d, g, glide) => { const i0 = Math.floor(t * sr), n = Math.floor(d * sr); let p = 0;
        for (let i = 0; i < n; i++) { const r = i / n; p += f * (1 + glide * Math.sin(Math.PI * r)) / sr; const h = Math.min(1, r * 6, (1 - r) * 3);
          a[i0 + i] += (Math.sin(TAU * p) + (Math.random() * 2 - 1) * .06) * g * h; } };
      huu(.05, .55, .9, .04); huu(.95, .16, .5, .02); huu(1.15, .16, .5, .02); huu(1.4, .9, .8, .06);
      tiefpass(a, sr, 1500);
      return normieren(raum(a, sr, [[.15, .3], [.33, .15]]), .85);
    },
    knacken(sr) {
      const a = new Float32Array(Math.floor(.8 * sr)); let t = .02;
      for (let k = 0; k < 2 + Math.random() * 4; k++) { mode(a, sr, t, zz(1200, 2600), .008, zz(.4, 1)); mode(a, sr, t, zz(400, 700), .012, zz(.2, .5)); stoss(a, sr, t, 3000, 1, .3, .006); t += zz(.02, .09); }
      return normieren(a, .85);
    },
    rascheln(sr) {
      const D = zz(1.5, 3), a = new Float32Array(Math.floor(D * sr)), F = new SVF(sr); F.setze(zz(3000, 5000), 1);
      for (let i = 0; i < a.length; i++) { const r = i / a.length, korn = Math.random() < .004 ? zz(2, 5) : 1; F.tick((Math.random() * 2 - 1) * korn); a[i] = F.bp * Math.sin(Math.PI * r) * (.6 + .4 * Math.sin(TAU * 3.1 * i / sr)); }
      return normieren(a, .8);
    },
    boe(sr) {
      const D = zz(3, 6), a = new Float32Array(Math.floor(D * sr)), F = new SVF(sr), P = new SVF(sr), f0 = zz(250, 400), f1 = zz(700, 1300), pf = zz(500, 900);
      let braun = 0;
      for (let i = 0; i < a.length; i++) {
        const r = i / a.length, h = Math.pow(Math.sin(Math.PI * Math.pow(r, .7)), 1.5);
        if ((i & 63) === 0) { F.setze(f0 + (f1 - f0) * h, 1.6); P.setze(pf * (1 + .25 * h), 14); }
        braun = braun * .97 + (Math.random() * 2 - 1) * .2;
        const x = braun + (Math.random() * 2 - 1) * .4;
        a[i] = (F.tick(x) + P.tick(x) * .5) * h;
      }
      return normieren(a, .9);
    },
    fensterladen(sr) {
      const a = new Float32Array(Math.floor(1.4 * sr));
      const klapp = (t, g) => { mode(a, sr, t, zz(130, 170), .05, g); mode(a, sr, t, zz(380, 460), .03, g * .7); mode(a, sr, t, zz(1000, 1300), .012, g * .4); stoss(a, sr, t, 900, .8, g * .8, .04); };
      klapp(.02, 1); let t = .02 + zz(.12, .2);
      for (let k = 0; k < 1 + Math.random() * 3; k++) { klapp(t, zz(.15, .4)); t += zz(.06, .14); }
      return normieren(raum(a, sr, [[.04, .3], [.09, .15]]), .9);
    },
    welle(sr) {
      const D = zz(5, 8), a = new Float32Array(Math.floor(D * sr)), L = new SVF(sr), H = new SVF(sr), spitze = zz(.3, .45);
      let braun = 0;
      for (let i = 0; i < a.length; i++) {
        const r = i / a.length, auf = r < spitze ? Math.pow(r / spitze, 2) : Math.exp(-(r - spitze) * 4);
        if ((i & 63) === 0) { L.setze(200 + 900 * auf, .7); H.setze(1500 + 3000 * auf, .7); }
        braun = braun * .98 + (Math.random() * 2 - 1) * .15; const w = Math.random() * 2 - 1;
        L.tick(braun + w * .3); H.tick(w);
        const schaum = r > spitze ? Math.exp(-(r - spitze) * 2.2) * (.7 + .3 * Math.random()) : 0;
        a[i] = L.lp * auf * 1.6 + H.bp * (auf * .4 + schaum * .5);
      }
      blenden(a, sr, .2, 1);
      return normieren(a, .9);
    },
    glocke(sr) {
      const a = new Float32Array(Math.floor(4 * sr)), f = zz(600, 820), n = Math.random() < .5 ? 1 : 2;
      for (let k = 0; k < n; k++) [[1, 1, 2.5], [2.01, .5, 1.6], [2.76, .4, 1.2], [5.4, .15, .5]].forEach(([m, g, d]) => { mode(a, sr, .02 + k * .9, f * m, d, g * .4, Math.random()); mode(a, sr, .02 + k * .9, f * m * 1.004, d, g * .3, 1); });
      tiefpass(a, sr, 2500);
      return normieren(raum(a, sr, [[.2, .3], [.45, .15]]), .8);
    },
    knarren(sr) {
      const D = zz(1, 1.8), a = new Float32Array(Math.floor(D * sr)), n = a.length;
      const R = [[zz(180, 240), 10, 1], [zz(500, 650), 14, .6], [zz(1200, 1500), 18, .3]].map(([f, q, g]) => { const F = new SVF(sr); F.setze(f, q); F.g = g; return F; });
      let phase = 0; const r0 = zz(30, 60), r1 = zz(60, 140);
      for (let i = 0; i < n; i++) { const r = i / n; phase += (r0 + (r1 - r0) * Math.sin(Math.PI * r)) / sr; let x = 0; if (phase >= 1) { phase -= 1; x = zz(.5, 1); }
        let y = 0; R.forEach(F => { y += F.tick(x) * F.g; }); a[i] = y * Math.sin(Math.PI * r); }
      return normieren(a, .85);
    },
    steinschlag(sr) {
      const a = new Float32Array(Math.floor(2.4 * sr)); let t = .02, abst = zz(.1, .2), g = 1;
      for (let k = 0; k < 6 + Math.random() * 8; k++) {
        mode(a, sr, t, zz(600, 1400), .02, g * .6); mode(a, sr, t, zz(1800, 3200), .008, g * .4); mode(a, sr, t, zz(120, 220), .05, g * .5);
        if (Math.random() < .4) mode(a, sr, t + zz(.01, .03), zz(900, 2000), .01, g * .3);
        t += abst * zz(.5, 1.4); abst *= .85; g *= zz(.7, .95);
      }
      return normieren(raum(a, sr, [[.11, .4], [.23, .25], [.4, .12]]), .9);
    },
    tropfen(sr) {
      const a = new Float32Array(Math.floor(1.6 * sr)), f = zz(900, 1700), i0 = Math.floor(.02 * sr), n = Math.floor(.09 * sr); let p = 0;
      for (let i = 0; i < n; i++) { const r = i / n; p += f * (1 + 1.2 * r) / sr; a[i0 + i] += Math.sin(TAU * p) * Math.exp(-r * 4) * Math.min(1, r * 30); }
      return normieren(raum(a, sr, [[.13, .45], [.27, .3], [.41, .18], [.6, .1]]), .85);
    },
    fledermaus(sr) {
      const a = new Float32Array(Math.floor(1.2 * sr)); let t = .02;
      for (let k = 0; k < 3 + Math.random() * 5; k++) { const f = zz(7000, 9500), i0 = Math.floor(t * sr), n = Math.floor(.025 * sr); let p = 0;
        for (let i = 0; i < n; i++) { const r = i / n; p += f * (1 - .3 * r) / sr; a[i0 + i] += Math.sin(TAU * p) * Math.sin(Math.PI * r) * .6; } t += zz(.05, .15); }
      for (let i = 0; i < a.length; i++) a[i] += (Math.random() * 2 - 1) * .05 * Math.max(0, Math.sin(TAU * 11 * i / sr)) * Math.sin(Math.PI * i / a.length);
      return normieren(a, .7);
    },
    stuhl(sr) {
      const D = zz(.4, .8), a = new Float32Array(Math.floor(D * sr)), n = a.length;
      const R = [[zz(300, 380), 8, 1], [zz(800, 950), 12, .6], [zz(1800, 2200), 14, .3]].map(([f, q, g]) => { const F = new SVF(sr); F.setze(f, q); F.g = g; return F; });
      let phase = 0; const rate = zz(90, 220);
      for (let i = 0; i < n; i++) { const r = i / n; phase += rate * (1 + .3 * Math.sin(TAU * 3 * r)) / sr; let x = 0; if (phase >= 1) { phase -= 1; x = zz(.4, 1); }
        let y = 0; R.forEach(F => { y += F.tick(x) * F.g; }); a[i] = y * Math.sin(Math.PI * r); }
      tiefpass(a, sr, 3000);
      return normieren(a, .85);
    },
    /* Krug auf den Tisch, Krüge stoßen an */
    krug(sr) {
      const a = new Float32Array(Math.floor(.9 * sr));
      if (Math.random() < .5) {
        const f = zz(1700, 2400);
        [[1, 1, .25], [2.32, .5, .15], [4.25, .3, .09], [6.1, .15, .05]].forEach(([m, g, d]) => mode(a, sr, .01, f * m, d, g * .25, Math.random() * TAU));
        stoss(a, sr, .01, 3000, 1, .3, .01);
      } else {
        mode(a, sr, .01, zz(120, 170), .05, .9); mode(a, sr, .01, zz(380, 520), .02, .4);
        stoss(a, sr, .01, 900, 1.2, .6, .04);
      }
      tiefpass(a, sr, 3500);
      return normieren(a, .9);
    },
    drache(sr) {
      const D = zz(2.6, 3.3), a = new Float32Array(Math.floor((D + .4) * sr)), n = Math.floor(D * sr);
      const F = [new SVF(sr), new SVF(sr), new SVF(sr), new SVF(sr)], tief = new SVF(sr); tief.setze(140, .9);
      const basis = zz(48, 62);
      let phase = 0, per = 1, amp = 1, zyk = 0;
      for (let i = 0; i < n; i++) {
        const r = i / n;
        const f0 = basis * (r < .15 ? 1 + 1.2 * r / .15 * .5 : 1.6 - (r - .15) * .9);
        if ((i & 31) === 0) {
          const o = Math.min(1, r * 4);
          F[0].setze(320 + 280 * o - 120 * r, 3); F[1].setze(780 + 300 * o, 4); F[2].setze(1750, 5); F[3].setze(2600, 6);
        }
        phase += f0 * per / sr;
        if (phase >= 1) { phase -= 1; zyk++; per = 1 + zz(-.12, .12); amp = zz(.55, 1) * (zyk % 2 ? .6 : 1); }
        const knurr = 1 - .45 * (.5 + .5 * Math.sin(TAU * 27 * i / sr + Math.sin(TAU * 3 * i / sr)));
        const quelle = (2 * phase - 1) * amp * knurr, rausch = (Math.random() * 2 - 1) * (.35 + .4 * r);
        const x = quelle + rausch;
        let y = F[0].tick(x) + F[1].tick(x) * .8 + F[2].tick(x) * .45 + F[3].tick(x) * .25;
        tief.tick(quelle); y += tief.lp * 1.6;
        const h = r < .1 ? r / .1 : r > .62 ? Math.pow(Math.max(0, (1 - r) / .38), 1.4) : 1;
        a[i] = Math.tanh(y * 2.2 * h) * .9;
      }
      tiefpass(a, sr, 4200);
      return normieren(raum(a, sr, [[.06, .3], [.11, .2], [.19, .12]]), .95);
    },
    schwert(sr) {
      const a = new Float32Array(Math.floor(2.3 * sr)), s = zz(.9, 1.12);
      stoss(a, sr, 0, 5500, .7, 1.2, .012);
      stoss(a, sr, 0, 2400, 1.5, .6, .02);
      /* Klingen klingen: unharmonische Moden, jede doppelt und leicht verstimmt – das schimmert */
      [[1820, .5, 1.1], [2470, .42, .9], [3330, .35, .7], [4420, .3, .5], [5900, .22, .35], [7400, .15, .25], [9100, .1, .15]].forEach(([f, g, d]) => {
        const ff = f * s * zz(.98, 1.02), sch = zz(2, 7);
        mode(a, sr, .002, ff, d, g * .5, Math.random() * TAU); mode(a, sr, .002, ff + sch, d * .9, g * .45, Math.random() * TAU);
      });
      [[2140, .3, .6], [3060, .25, .45], [4970, .2, .3], [6650, .12, .2]].forEach(([f, g, d]) => mode(a, sr, .006, f * s, d, g * .4, Math.random() * TAU));
      /* kurzes Schaben der Klingen aneinander */
      const n0 = Math.floor(.03 * sr), n = Math.floor(.32 * sr), F = new SVF(sr);
      for (let i = 0; i < n; i++) {
        const r = i / n; if ((i & 15) === 0) F.setze(2800 + 4500 * r, 8);
        F.tick((Math.random() * 2 - 1) * (Math.random() < .3 ? 1 : .3)); a[n0 + i] += F.bp * .35 * Math.sin(Math.PI * r);
      }
      return normieren(a, .9);
    },
    tuer(sr) {
      const knarr = zz(1.7, 2.3), a = new Float32Array(Math.floor((knarr + 1) * sr)), n = Math.floor(knarr * sr);
      /* Knarren = Haftgleiten der Angel: die Ruckrate IST die gehörte Tonhöhe (tiefes Ächzen bis hohes Quietschen),
         die Holzresonanzen färben sie */
      const R = [[zz(380, 460), 14, 1], [zz(900, 1100), 18, .8], [zz(1900, 2300), 22, .5], [zz(3100, 3500), 25, .25]].map(([f, q, g]) => { const F = new SVF(sr); F.setze(f, q); F.g = g; return F; });
      const punkte = [], teile = 3 + Math.floor(Math.random() * 2);
      for (let k = 0; k <= teile; k++) punkte.push(k === 0 ? zz(90, 160) : Math.random() < .5 ? zz(110, 220) : zz(260, 520));
      let phase = 0, mod = 0, modZiel = 1;
      for (let i = 0; i < n; i++) {
        const r = i / n, pos = r * teile, k = Math.floor(pos), f = pos - k, w = f * f * (3 - 2 * f);
        const rate = punkte[k] + (punkte[Math.min(k + 1, teile)] - punkte[k]) * w;
        if (i % 600 === 0) modZiel = zz(.45, 1);
        mod += (modZiel - mod) * .003;
        phase += rate * (1 + zz(-.04, .04)) / sr;
        let x = 0;
        if (phase >= 1) { phase -= 1; x = zz(.6, 1); }
        let y = 0; R.forEach(F => { y += F.tick(x) * F.g; });
        a[i] = y * mod * Math.min(1, r * 10, (1 - r) * 6);
      }
      /* Knarren für sich auf kräftigen Pegel bringen, dann zufallen lassen */
      let q = 0; for (let i = 0; i < n; i++) q += a[i] * a[i];
      const f = .22 / Math.sqrt(q / n); for (let i = 0; i < n; i++) a[i] = Math.tanh(a[i] * f * 1.4);
      const z = knarr + .05;
      mode(a, sr, z, zz(62, 75), .09, .9); mode(a, sr, z, zz(140, 170), .05, .7); mode(a, sr, z, zz(300, 360), .03, .5);
      stoss(a, sr, z, 500, .8, 1.2, .07);
      mode(a, sr, z + zz(.05, .08), zz(2300, 2800), .012, .3); stoss(a, sr, z + .07, 3500, 2, .25, .01);
      tiefpass(a, sr, 6500);
      return normieren(a, .95);
    },
    donner(sr) {
      const D = zz(5.5, 7), a = new Float32Array(Math.floor(D * sr));
      /* Krachen: ein reißendes Knattern über die erste halbe Sekunde, kräftig im Mittenbereich */
      for (let k = 0; k < 70; k++) {
        const t = Math.pow(Math.random(), 1.6) * .6;
        stoss(a, sr, t, zz(400, 3200), .8, zz(.4, 1) * (1 - t), zz(.01, .05));
      }
      /* Grollen: viele Rollwellen, Rauschen mit Schwerpunkt um 100–400 Hz (hörbar auch auf kleinen Lautsprechern) */
      const env = new Float32Array(a.length);
      for (let k = 0; k < 18; k++) {
        const mitte = .2 + Math.pow(Math.random(), 1.4) * (D - 1.6), breite = zz(.25, 1), h = zz(.4, 1) * Math.exp(-mitte / 2.6);
        const i0 = Math.max(0, Math.floor((mitte - breite * 2) * sr)), i1 = Math.min(a.length, Math.floor((mitte + breite * 2) * sr));
        for (let i = i0; i < i1; i++) { const x = (i / sr - mitte) / breite; env[i] += h * Math.exp(-x * x * 2); }
      }
      const T1 = new SVF(sr), T2 = new SVF(sr), M = new SVF(sr); T1.setze(90, .8); T2.setze(220, .7); M.setze(450, .7);
      for (let i = 0; i < a.length; i++) {
        const t = i / sr, w = Math.random() * 2 - 1, knall = t < 1.5 ? Math.exp(-t * 2.2) : 0;
        T1.tick(w); T2.tick(w); M.tick(w);
        const e = env[i] + knall;
        a[i] += (T1.lp * 2.2 + T2.bp * 1.6 + M.lp * .7) * e * 1.4;
      }
      for (let i = 0; i < a.length; i++) a[i] = Math.tanh(a[i] * 1.5);
      blenden(a, sr, .001, 1.4);
      return normieren(a, .95);
    },
    schrei(sr) {
      const D = zz(1.3, 1.8), a = new Float32Array(Math.floor((D + 1.2) * sr)), f = zz(560, 720);
      stimme(a, sr, .02, [
        { d: D * .25, v: "a", f0: f * .8, f1: f * 1.35, laut: 1, abfall: .01 },
        { d: D * .75, v: "a", f0: f * 1.35, f1: f * .78, laut: 1, abfall: .6 }
      ], { skala: 1.25, jitter: .04, hauchBasis: .12, rau: .5, vibrato: [6.3, .025], q: [5, 7, 9] });
      for (let i = 0; i < a.length; i++) a[i] = Math.tanh(a[i] * 3);
      hochpass(a, sr, 300); tiefpass(a, sr, 2600, 2);
      return normieren(raum(a, sr, [[.18, .35], [.37, .2], [.6, .1]]), .9);
    },
    wuerfel(sr) {
      const a = new Float32Array(Math.floor(1.6 * sr));
      const wurf = (t0, h) => {
        const m = [zz(2600, 3200), zz(3900, 4600), zz(5600, 6400)];
        let t = t0, abst = zz(.12, .16), g = 1;
        const klack = (t, g) => {
          m.forEach((f, j) => mode(a, sr, t, f * zz(.97, 1.03), .012 - j * .003, g * (.5 - j * .12), Math.random() * TAU));
          mode(a, sr, t, zz(190, 240), .03, g * .5); mode(a, sr, t, zz(780, 950), .012, g * .3);
          stoss(a, sr, t, 3000, 1, g * .4, .004);
        };
        for (let k = 0; k < 6 && t < 1.3; k++) { klack(t, g * h); t += abst; abst *= zz(.62, .78); g *= zz(.55, .75); }
        for (let k = 0; k < 8 && t < 1.45; k++) { klack(t, g * h * zz(.3, .7)); t += zz(.018, .035); g *= .82; } /* Ausrollen */
      };
      wurf(.01, 1); wurf(zz(.02, .06), zz(.6, .9));
      if (Math.random() < .6) mode(a, sr, zz(.12, .3), zz(6500, 7500), .008, .15);
      return normieren(a, .9);
    },
    zauber(sr) {
      const D = 2.8, a = new Float32Array(Math.floor(D * sr));
      /* aufsteigendes Wehen */
      const F = new SVF(sr), n = Math.floor(1.6 * sr);
      for (let i = 0; i < n; i++) { const r = i / n; if ((i & 31) === 0) F.setze(350 * Math.pow(18, r), 3); F.tick(Math.random() * 2 - 1); a[i] += F.bp * .5 * Math.sin(Math.PI * r); }
      /* gläserne Glocken, aufsteigend, mit Schwebung */
      const grund = zz(520, 700), stufen = [0, 4, 7, 12, 16, 19, 24, 28];
      stufen.forEach((iv, k) => {
        const t = .25 + k * .08, f = grund * Math.pow(2, iv / 12);
        [[1, .5, 1.2], [2.76, .2, .6], [5.4, .08, .3]].forEach(([m, g, d]) => { mode(a, sr, t, f * m, d, g * .35, 0); mode(a, sr, t, f * m * 1.003, d, g * .3, 1); });
      });
      /* Funken */
      for (let k = 0; k < 45; k++) mode(a, sr, .3 + Math.pow(Math.random(), .8) * 1.9, zz(4500, 10000), zz(.01, .04), zz(.05, .18), Math.random() * TAU);
      return normieren(a, .9);
    },
    horn(sr) {
      const D = zz(2.6, 3.1), a = new Float32Array(Math.floor((D + .6) * sr)), n = Math.floor(D * sr), f = zz(92, 104);
      const hoerner = [[f, 1, new SVF(sr)], [f * 1.006, .7, new SVF(sr)], [f * 1.5 * .999, .25, new SVF(sr)]];
      const K = new SVF(sr); K.setze(520, 1.5);
      hoerner.forEach(h => { h.p = Math.random(); });
      for (let i = 0; i < n; i++) {
        const r = i / n, t = i / sr;
        const h = t < .35 ? Math.pow(t / .35, 1.5) : r > .82 ? Math.max(0, (1 - r) / .18) : 1 - .1 * (r - .2);
        const tonh = (t < .15 ? .86 + .14 * t / .15 : 1) * (r > .85 ? 1 - .06 * (r - .85) / .15 : 1) * (1 + .004 * Math.sin(TAU * 5 * t) * Math.min(1, t));
        let y = 0;
        hoerner.forEach(([ff, g, F], j) => {
          const h2 = hoerner[j]; h2.p += ff * tonh / sr; if (h2.p >= 1) h2.p -= 1;
          if ((i & 31) === 0) F.setze(160 + 1700 * Math.pow(h, 2), .7);
          F.tick(2 * h2.p - 1); y += F.lp * g;
        });
        y += K.tick(y) * .6 + (Math.random() * 2 - 1) * .03 * h;
        a[i] = Math.tanh(y * h * 1.1);
      }
      tiefpass(a, sr, 3800);
      return normieren(raum(a, sr, [[.08, .3], [.17, .2], [.29, .12]]), .9);
    },
    jubel(sr) {
      const D = 3.4, a = new Float32Array(Math.floor(D * sr));
      /* Rufe: „Hey!", „Jaaa!", „Hoch!" – viele Stimmen durcheinander */
      for (let v = 0; v < 13; v++) {
        const frau = Math.random() < .4, grund = frau ? zz(330, 450) : zz(170, 260), t = zz(0, .5), s = [];
        const rufe = 1 + Math.floor(Math.random() * 3); let tt = 0;
        for (let k = 0; k < rufe; k++) {
          const d = zz(.25, .7), v2 = wahl(["e", "a", "ae", "o"]);
          s.push({ d, v: v2, f0: grund * zz(.9, 1), f1: grund * zz(1.05, 1.3), laut: zz(.5, 1), kons: Math.random() < .5 ? .5 : 0, hauch: .15, abfall: .5 });
          s.push({ d: zz(.08, .3), v: v2, f0: grund, f1: grund, laut: 0 });
          tt += d;
        }
        stimme(a, sr, t, s, { skala: frau ? 1.15 : 1, jitter: .03, hauchBasis: .1, rau: .3 });
      }
      /* Klatschen */
      for (let p = 0; p < 9; p++) {
        let t = zz(.3, .6); const takt = zz(.17, .26), f = zz(900, 2000);
        while (t < D - .4) { stoss(a, sr, t, f * zz(.9, 1.1), 1.4, zz(.5, 1) * Math.min(1, (D - .4 - t) * 2), .025); t += takt * zz(.92, 1.08); }
      }
      /* Pfiff und auf den Tisch hauen */
      if (Math.random() < .7) { const t0 = zz(.4, 1), n = Math.floor(.5 * sr); let p = 0; for (let i = 0; i < n; i++) { const r = i / n; p += (2300 + 700 * Math.sin(Math.PI * r)) / sr; a[Math.floor(t0 * sr) + i] += Math.sin(TAU * p) * .12 * Math.sin(Math.PI * r); } }
      for (let k = 0; k < 4; k++) { const t = .5 + k * zz(.25, .35); mode(a, sr, t, zz(110, 150), .05, .5); stoss(a, sr, t, 700, 1, .3, .03); }
      hochpass(a, sr, 120); tiefpass(a, sr, 4500);
      blenden(a, sr, .01, .6);
      return normieren(raum(a, sr, [[.021, .3], [.037, .25], [.059, .18], [.083, .1]]), .9);
    }
  };

  wurzel.Klangwerk = { KULISSE, EFFEKT };
  /* als Web Worker: rechnet im Hintergrund, damit die Musik nicht stockt */
  if (typeof importScripts === "function" && typeof window === "undefined") {
    wurzel.onmessage = e => {
      const { id, gruppe, art, sr } = e.data;
      let daten = null;
      try { daten = (gruppe === "kulisse" ? KULISSE : EFFEKT)[art](sr); } catch (_) {}
      wurzel.postMessage({ id, daten, sr }, daten ? [daten.buffer] : []);
    };
  }
  if (typeof module !== "undefined") module.exports = wurzel.Klangwerk;
})(typeof window !== "undefined" ? window : globalThis);
