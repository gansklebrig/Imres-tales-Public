/* =====================================================================
   IMRES TALES – LEBENDE SEITENRÄNDER DER CHRONIK
   ---------------------------------------------------------------------
   Links und rechts neben dem Text zeigt die Chronik eine leise, lebendige
   Kulisse des Ortes, an dem die Geschichte gerade spielt: gezeichnete
   Scherenschnitt-Szenen (SVG) mit Licht, Nebel, Glut, Tropfen, Sporen …
   Beim Weiterlesen blendet die Kulisse sanft zum nächsten Ort über.

   Welche Kulisse zu welchem Abschnitt gehört, steht in inhalt.js:
     kapitel[i].kulissen = ["hafen", "waldstrasse", …]   (ein Eintrag pro „## “-Abschnitt)
   Fehlt ein Eintrag, rät die Seite anhand des Abschnitts (Stichwörter)
   oder behält einfach den letzten Ort bei. Alle Orte: siehe ORTE unten.

   Wird von seiten.js nachgeladen. Ändert nichts am Text der Chronik.
   ===================================================================== */
(function () {
  "use strict";
  if (window.ImresKulisse) return;
  const $ = id => document.getElementById(id);
  const chronik = $("chronik"), kapitelBox = $("chapters");
  if (!chronik || !kapitelBox) return;

  const mm = q => window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} };
  const ruhigMQ = mm("(prefers-reduced-motion: reduce)");
  let ruhig = ruhigMQ.matches;
  const handy = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") || mm("(pointer: coarse)").matches;
  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const daten = () => (sprache() === "en" ? (window.INHALT_EN || window.INHALT) : window.INHALT) || {};
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- Zufall mit festem Startwert (jede Szene sieht immer gleich aus) ---------- */
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const zufall = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const r1 = n => Math.round(n * 10) / 10;
  let zaehler = 0;

  /* =====================================================================
     ZEICHENKASTEN – kleine Bausteine, aus denen die Szenen bestehen.
     Flügel (links/rechts): viewBox 600 × 1000, Außenkante bei x = 0, Boden bei y = 1000.
     ===================================================================== */
  function Bau(schluessel) {
    this.p = "kl" + (++zaehler) + "_";
    this.defs = [];
    this.gl = {};
    this.r = zufall(hash(schluessel));
  }
  Bau.prototype = {
    z(a, b) { return a + (b - a) * this.r(); },
    zi(a, b) { return Math.floor(this.z(a, b + 1)); },
    /* weicher Lichthof als Verlauf (billiger als Unschärfe-Filter) */
    glow(c, a) {
      a = a == null ? .55 : a;
      const k = c + a;
      if (!this.gl[k]) {
        const id = this.p + "g" + Object.keys(this.gl).length;
        this.defs.push('<radialGradient id="' + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity="' + a + '"/><stop offset=".35" stop-color="' + c + '" stop-opacity="' + r1(a * .42 * 100) / 100 + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>');
        this.gl[k] = id;
      }
      return "url(#" + this.gl[k] + ")";
    },
    verlauf(stops, x2, y2) {
      const id = this.p + "v" + this.defs.length;
      this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' +
        stops.map(s => '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] == null ? 1 : s[2]) + '"/>').join("") + "</linearGradient>");
      return "url(#" + id + ")";
    },
    svg(vb, inhalt, par, cls) {
      return '<svg xmlns="' + NS + '" viewBox="' + vb + '" preserveAspectRatio="' + (par || "xMinYMax meet") + '"' + (cls ? ' class="' + cls + '"' : "") + ' aria-hidden="true" focusable="false"><defs>' + this.defs.join("") + "</defs>" + inhalt + "</svg>";
    },
    anim(cls, dauer, verz) { return ' class="' + cls + '" style="animation-duration:' + r1(dauer) + "s;animation-delay:-" + r1(verz == null ? this.z(0, dauer) : verz) + 's"'; },
    licht(x, y, r, c, a, cls) {
      return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="' + this.glow(c, a) + '"' + (cls === "" ? "" : this.anim(cls || "kl-flacker", this.z(3, 7))) + "/>";
    },
    /* ---- Natur ---- */
    laubbaum(x, y, h, f) {
      const w = h * .045;
      let s = '<path fill="' + f + '" d="M' + r1(x - w * 1.4) + " " + y + " C" + r1(x - w) + " " + r1(y - h * .3) + " " + r1(x - w * .6) + " " + r1(y - h * .5) + " " + r1(x - w * .4) + " " + r1(y - h * .62) +
        " L" + r1(x + w * .4) + " " + r1(y - h * .62) + " C" + r1(x + w * .6) + " " + r1(y - h * .5) + " " + r1(x + w) + " " + r1(y - h * .3) + " " + r1(x + w * 1.4) + " " + y + 'Z"/>';
      s += '<path fill="none" stroke="' + f + '" stroke-width="' + r1(w * .7) + '" stroke-linecap="round" d="M' + r1(x) + " " + r1(y - h * .45) + " L" + r1(x - h * .16) + " " + r1(y - h * .66) + " M" + r1(x) + " " + r1(y - h * .5) + " L" + r1(x + h * .18) + " " + r1(y - h * .7) + '"/>';
      for (let i = 0; i < 9; i++) s += '<circle fill="' + f + '" cx="' + r1(x + this.z(-.24, .24) * h) + '" cy="' + r1(y - h * this.z(.58, .9)) + '" r="' + r1(h * this.z(.11, .19)) + '"/>';
      return s;
    },
    tanne(x, y, h, f) {
      const p = [[x, y - h]], q = [];
      for (let k = 1; k <= 6; k++) {
        const yy = y - h + k * h * .145, ww = h * (.035 + .042 * k);
        p.push([x + ww, yy], [x + ww * .38, yy - h * .025]);
        q.unshift([x - ww * .38, yy - h * .025], [x - ww, yy]);
      }
      const pts = p.concat([[x + h * .03, y - h * .1], [x + h * .03, y], [x - h * .03, y], [x - h * .03, y - h * .1]]).concat(q);
      return '<polygon fill="' + f + '" points="' + pts.map(a => r1(a[0]) + "," + r1(a[1])).join(" ") + '"/>';
    },
    toterBaum(x, y, h, f) {
      let d = "";
      const ast = (x0, y0, len, wnk, tiefe) => {
        const x1 = x0 + Math.cos(wnk) * len, y1 = y0 + Math.sin(wnk) * len;
        d += '<path stroke="' + f + '" stroke-width="' + r1(Math.max(1.2, tiefe * 3.4)) + '" stroke-linecap="round" fill="none" d="M' + r1(x0) + " " + r1(y0) + " Q" + r1((x0 + x1) / 2 + this.z(-8, 8)) + " " + r1((y0 + y1) / 2) + " " + r1(x1) + " " + r1(y1) + '"/>';
        if (tiefe > 1) { ast(x1, y1, len * .68, wnk - this.z(.3, .6), tiefe - 1); ast(x1, y1, len * .62, wnk + this.z(.25, .55), tiefe - 1); }
      };
      ast(x, y, h * .42, -Math.PI / 2 + this.z(-.08, .08), 4);
      return d;
    },
    busch(x, y, w, f) {
      let s = "";
      for (let i = 0; i < 7; i++) s += '<circle fill="' + f + '" cx="' + r1(x + this.z(-.45, .45) * w) + '" cy="' + r1(y - this.z(0, .35) * w) + '" r="' + r1(w * this.z(.2, .34)) + '"/>';
      return s + '<rect fill="' + f + '" x="' + r1(x - w * .55) + '" y="' + r1(y - w * .15) + '" width="' + r1(w * 1.1) + '" height="' + r1(w * .2) + '"/>';
    },
    boden(y, f, rau) {
      rau = rau == null ? 10 : rau;
      let d = "M-10 1010 L-10 " + r1(y);
      for (let x = 0; x <= 620; x += 40) d += " L" + x + " " + r1(y + this.z(-rau, rau));
      return '<path fill="' + f + '" d="' + d + ' L620 1010Z"/>';
    },
    fels(x, y, w, h, f) {
      const n = 7, pts = [[x, y]];
      for (let i = 1; i < n; i++) pts.push([x + w * i / n + this.z(-w * .04, w * .04), y - h * (Math.sin(Math.PI * i / n) * this.z(.7, 1.05))]);
      pts.push([x + w, y]);
      return '<polygon fill="' + f + '" points="' + pts.map(a => r1(a[0]) + "," + r1(a[1])).join(" ") + '"/>';
    },
    wasser(y, c1, c2, glanz) {
      const v = this.verlauf([[0, c1], [1, c2]]);
      let s = '<rect x="-10" y="' + y + '" width="640" height="' + (1010 - y) + '" fill="' + v + '"/>';
      for (let i = 0; i < 7; i++) {
        const yy = y + 8 + this.z(0, 1000 - y - 10), x = this.z(-20, 520), w = this.z(20, 90);
        s += '<path d="M' + r1(x) + " " + r1(yy) + " h" + r1(w) + '" stroke="' + glanz + '" stroke-width="' + r1(this.z(1, 2.2)) + '" stroke-linecap="round"' + this.anim("kl-glanz", this.z(4, 8)) + "/>";
      }
      return s;
    },
    /* ---- Bauten ---- */
    haus(x, y, w, h, f, o) {
      o = o || {};
      const dh = o.dach == null ? w * .55 : o.dach;
      let s = '<rect fill="' + f + '" x="' + r1(x) + '" y="' + r1(y - h) + '" width="' + r1(w) + '" height="' + r1(h + 2) + '"/>';
      if (dh > 0) s += '<polygon fill="' + f + '" points="' + r1(x - w * .08) + "," + r1(y - h) + " " + r1(x + w * (o.first == null ? .5 : o.first)) + "," + r1(y - h - dh) + " " + r1(x + w * 1.08) + "," + r1(y - h) + '"/>';
      if (o.kamin) s += '<rect fill="' + f + '" x="' + r1(x + w * .68) + '" y="' + r1(y - h - dh * .75) + '" width="' + r1(w * .1) + '" height="' + r1(dh * .6) + '"/>';
      (o.fenster || []).forEach(fe => {
        const fx = x + w * fe[0], fy = y - h + h * fe[1], fw = w * (fe[2] || .14), fhh = h * (fe[3] || .2);
        s += this.licht(fx + fw / 2, fy + fhh / 2, fw * 2.6, o.licht || "#f0b060", .3, "kl-fenster");
        s += '<rect x="' + r1(fx) + '" y="' + r1(fy) + '" width="' + r1(fw) + '" height="' + r1(fhh) + '" fill="' + (o.licht || "#f0b060") + '" fill-opacity=".42"' + this.anim("kl-fenster", this.z(6, 12)) + "/>";
        s += '<path d="M' + r1(fx + fw / 2) + " " + r1(fy) + " v" + r1(fhh) + " M" + r1(fx) + " " + r1(fy + fhh / 2) + " h" + r1(fw) + '" stroke="' + f + '" stroke-width="' + r1(Math.max(1, fw * .12)) + '"/>';
      });
      return s;
    },
    turm(x, y, w, h, f, o) {
      o = o || {};
      let s = '<path fill="' + f + '" d="M' + r1(x) + " " + y + " L" + r1(x + w * .06) + " " + r1(y - h) + " L" + r1(x + w * .94) + " " + r1(y - h) + " L" + r1(x + w) + " " + y + 'Z"/>';
      if (o.ruine) {
        let d = "M" + r1(x + w * .06) + " " + r1(y - h + 2);
        for (let i = 0; i <= 6; i++) d += " L" + r1(x + w * .06 + w * .88 * i / 6) + " " + r1(y - h - this.z(-10, w * .5) * (i % 2 ? 1 : .4));
        s += '<path fill="' + f + '" d="' + d + " L" + r1(x + w * .94) + " " + r1(y - h + 2) + 'Z"/>';
      } else if (o.dach) {
        s += '<polygon fill="' + f + '" points="' + r1(x - w * .1) + "," + r1(y - h) + " " + r1(x + w / 2) + "," + r1(y - h - w * 1.1) + " " + r1(x + w * 1.1) + "," + r1(y - h) + '"/>';
      } else {
        const n = 5, zw = w * 1.08 / (n * 2 - 1);
        s += '<rect fill="' + f + '" x="' + r1(x - w * .04) + '" y="' + r1(y - h - w * .06) + '" width="' + r1(w * 1.08) + '" height="' + r1(w * .08) + '"/>';
        for (let i = 0; i < n; i++) s += '<rect fill="' + f + '" x="' + r1(x - w * .04 + i * 2 * zw) + '" y="' + r1(y - h - w * .2) + '" width="' + r1(zw) + '" height="' + r1(w * .16) + '"/>';
      }
      (o.fenster || []).forEach(fe => {
        const fx = x + w * fe[0], fy = y - h + h * fe[1];
        s += this.licht(fx, fy, w * .45, o.licht || "#f0a050", .45, "kl-fenster");
        s += '<rect x="' + r1(fx - w * .035) + '" y="' + r1(fy - w * .12) + '" width="' + r1(w * .07) + '" height="' + r1(w * .24) + '" rx="' + r1(w * .03) + '" fill="' + (o.licht || "#f0a050") + '" opacity=".8"/>';
      });
      return s;
    },
    laterne(x, y, c, f, kette) {
      kette = kette == null ? 40 : kette;
      return '<g' + this.anim("kl-pendel", this.z(5, 8)) + ' style="transform-origin:' + r1(x) + "px " + r1(y - kette) + 'px">' +
        '<path d="M' + r1(x) + " " + r1(y - kette) + " v" + r1(kette - 6) + '" stroke="' + f + '" stroke-width="2"/>' +
        this.licht(x, y + 8, 46, c, .55) +
        '<path fill="' + f + '" d="M' + r1(x - 8) + " " + r1(y - 4) + " h16 l-3 -4 h-10z M" + r1(x - 8) + " " + r1(y + 18) + ' h16 l-2 4 h-12z"/>' +
        '<rect x="' + r1(x - 6) + '" y="' + r1(y - 3) + '" width="12" height="21" fill="' + c + '" opacity=".85"' + this.anim("kl-flacker", this.z(3, 6)) + "/>" +
        '<path d="M' + r1(x - 7) + " " + r1(y - 3) + " v21 M" + r1(x + 7) + " " + r1(y - 3) + ' v21" stroke="' + f + '" stroke-width="2"/></g>';
    },
    fackel(x, y, c, f, gross) {
      const s = gross || 1;
      return this.licht(x, y - 26 * s, 80 * s, c, .5) +
        '<path fill="' + f + '" d="M' + r1(x - 4 * s) + " " + r1(y) + " L" + r1(x - 6 * s) + " " + r1(y - 22 * s) + " L" + r1(x + 6 * s) + " " + r1(y - 22 * s) + " L" + r1(x + 4 * s) + " " + y + 'Z"/>' +
        '<path fill="' + c + '" d="M' + r1(x) + " " + r1(y - 48 * s) + " C" + r1(x + 9 * s) + " " + r1(y - 36 * s) + " " + r1(x + 8 * s) + " " + r1(y - 26 * s) + " " + r1(x) + " " + r1(y - 22 * s) + " C" + r1(x - 8 * s) + " " + r1(y - 26 * s) + " " + r1(x - 9 * s) + " " + r1(y - 34 * s) + " " + r1(x) + " " + r1(y - 48 * s) + 'Z"' + this.anim("kl-flamme", this.z(.9, 1.6)) + "/>";
    },
    rauch(x, y, c, n, breit) {
      let s = "";
      for (let i = 0; i < (n || 4); i++) {
        const d = this.z(7, 11);
        s += '<circle cx="' + r1(x + this.z(-4, 4)) + '" cy="' + r1(y) + '" r="' + r1((breit || 14) * this.z(.8, 1.3)) + '" fill="' + this.glow(c, .5) + '" class="kl-rauch" style="animation-duration:' + r1(d) + "s;animation-delay:-" + r1(d * i / (n || 4)) + 's"/>';
      }
      return s;
    },
    netz(cx, cy, r, c, a0, a1) {
      a0 = a0 == null ? 0 : a0; a1 = a1 == null ? Math.PI * 2 : a1;
      const n = 9, sp = [];
      let s = "";
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * i / n;
        sp.push(a);
        s += "M" + r1(cx) + " " + r1(cy) + " L" + r1(cx + Math.cos(a) * r) + " " + r1(cy + Math.sin(a) * r) + " ";
      }
      for (let k = 1; k <= 6; k++) {
        const rr = r * k / 6.4;
        sp.forEach((a, i) => {
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
          if (i === 0) s += "M" + r1(px) + " " + r1(py) + " ";
          else {
            const am = (a + sp[i - 1]) / 2, rm = rr * .86;
            s += "Q" + r1(cx + Math.cos(am) * rm) + " " + r1(cy + Math.sin(am) * rm) + " " + r1(px) + " " + r1(py) + " ";
          }
        });
      }
      return '<path d="' + s + '" fill="none" stroke="' + c + '" stroke-width="1.1" opacity=".5"/>';
    },
    stalaktiten(x0, x1, y, len, f) {
      let d = "M" + x0 + " " + (y - 40) + " L" + x0 + " " + y;
      let x = x0;
      while (x < x1) {
        const w = this.z(10, 34), l = this.z(.15, 1) * len;
        d += " L" + r1(x + w * .35) + " " + r1(y + this.z(0, 6)) + " L" + r1(x + w / 2) + " " + r1(y + l) + " L" + r1(x + w * .65) + " " + r1(y + this.z(0, 6));
        x += w;
      }
      return '<path fill="' + f + '" d="' + d + " L" + x1 + " " + y + " L" + x1 + " " + (y - 40) + 'Z"/>';
    },
    pilz(x, y, s, f, c, a) {
      return this.licht(x, y - 52 * s, 90 * s, c, a == null ? .38 : a, "kl-puls") +
        '<path fill="' + f + '" d="M' + r1(x - 5 * s) + " " + y + " C" + r1(x - 4 * s) + " " + r1(y - 20 * s) + " " + r1(x - 6 * s) + " " + r1(y - 34 * s) + " " + r1(x - 3 * s) + " " + r1(y - 46 * s) + " L" + r1(x + 4 * s) + " " + r1(y - 46 * s) + " C" + r1(x + 6 * s) + " " + r1(y - 34 * s) + " " + r1(x + 5 * s) + " " + r1(y - 20 * s) + " " + r1(x + 6 * s) + " " + y + 'Z"/>' +
        '<path fill="' + c + '" fill-opacity=".38" d="M' + r1(x - 34 * s) + " " + r1(y - 44 * s) + " C" + r1(x - 30 * s) + " " + r1(y - 70 * s) + " " + r1(x + 30 * s) + " " + r1(y - 72 * s) + " " + r1(x + 34 * s) + " " + r1(y - 44 * s) + " Q" + r1(x) + " " + r1(y - 52 * s) + " " + r1(x - 34 * s) + " " + r1(y - 44 * s) + 'Z"' + this.anim("kl-puls", this.z(5, 9)) + "/>" +
        '<path fill="' + f + '" opacity=".55" d="M' + r1(x - 34 * s) + " " + r1(y - 44 * s) + " Q" + r1(x) + " " + r1(y - 52 * s) + " " + r1(x + 34 * s) + " " + r1(y - 44 * s) + " Q" + r1(x) + " " + r1(y - 40 * s) + " " + r1(x - 34 * s) + " " + r1(y - 44 * s) + 'Z"/>';
    },
    kristall(x, y, s, f, c) {
      let t = this.licht(x, y - 60 * s, 130 * s, c, .42, "kl-puls");
      [[-22, 70, -14], [0, 120, 4], [20, 86, 16], [-38, 44, -26], [36, 50, 30]].forEach(k => {
        const bx = x + k[0] * s, h = k[1] * s, w = 13 * s, neig = k[2] * s * .4;
        t += '<path fill="' + c + '" fill-opacity=".2" stroke-opacity=".8" stroke="' + f + '" stroke-width="2" d="M' + r1(bx - w) + " " + y + " L" + r1(bx - w * .8 + neig) + " " + r1(y - h * .82) + " L" + r1(bx + neig) + " " + r1(y - h) + " L" + r1(bx + w * .8 + neig) + " " + r1(y - h * .82) + " L" + r1(bx + w) + " " + y + 'Z"' + this.anim("kl-puls", this.z(4, 8)) + "/>";
      });
      return t;
    },
    /* Scherenschnitt aus einem freigestellten Bild (nur die Form zählt) – farbe als Hex; toenen = eigene Farbmatrix */
    schatten(href, x, y, w, h, farbe, deck, toenen, extra) {
      const id = this.p + "f" + this.defs.length;
      let werte = toenen;
      if (!werte) { const n = parseInt(farbe.slice(1), 16); werte = "0 0 0 0 " + ((n >> 16 & 255) / 255).toFixed(3) + " 0 0 0 0 " + ((n >> 8 & 255) / 255).toFixed(3) + " 0 0 0 0 " + ((n & 255) / 255).toFixed(3) + " 0 0 0 1 0"; }
      this.defs.push('<filter id="' + id + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' + werte + '"/></filter>');
      return '<image href="' + href + '" x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" preserveAspectRatio="xMidYMax meet" filter="url(#' + id + ')"' + (deck != null ? ' opacity="' + deck + '"' : "") + (extra || "") + "/>";
    },
    /* ---- Gestalten (Einheit: Höhe ≈ 100, Ursprung unten Mitte) ---- */
    figur(art, x, y, s, f, extra, spiegel) {
      const P = FIGUREN[art];
      return '<g transform="translate(' + r1(x) + " " + r1(y) + ") scale(" + (spiegel ? -s : s) + " " + s + ')"' + (extra || "") + '><path fill="' + f + '" d="' + P + '"/></g>';
    },
    augen(x, y, abst, c, gross) {
      const g = gross || 2.2;
      return '<g' + this.anim("kl-blinzeln", this.z(5, 9)) + ' style="transform-origin:' + r1(x) + "px " + r1(y) + 'px">' + this.licht(x, y, g * 9, c, .5, "") +
        '<circle cx="' + r1(x - abst / 2) + '" cy="' + r1(y) + '" r="' + g + '" fill="' + c + '"/><circle cx="' + r1(x + abst / 2) + '" cy="' + r1(y) + '" r="' + g + '" fill="' + c + '"/></g>';
    },
    spinne(x, y, s, f, faden, c) {
      let beine = "";
      for (let i = 0; i < 4; i++) {
        const a = -30 + i * 22;
        [-1, 1].forEach(sg => {
          beine += "M0 -4 Q" + r1(sg * 16) + " " + r1(a * .5 - 18) + " " + r1(sg * 26) + " " + r1(a * .4) + " ";
        });
      }
      return '<g class="kl-faden" style="animation-duration:' + r1(this.z(9, 15)) + "s;animation-delay:-" + r1(this.z(0, 9)) + 's"><path d="M' + r1(x) + " " + r1(y - faden) + " V" + r1(y - 8 * s) + '" stroke="' + (c || f) + '" stroke-width="1" opacity=".6"/>' +
        '<g transform="translate(' + r1(x) + " " + r1(y) + ") scale(" + s + ')"><path d="' + beine + '" fill="none" stroke="' + f + '" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="0" cy="10" rx="9" ry="12" fill="' + f + '"/><circle cx="0" cy="-5" r="6" fill="' + f + '"/></g></g>';
    },
    kokon(x, y, s, f, faden) {
      return '<g' + this.anim("kl-pendel", this.z(7, 11)) + ' style="transform-origin:' + r1(x) + "px " + r1(y - faden) + 'px"><path d="M' + r1(x) + " " + r1(y - faden) + " V" + r1(y - 40 * s) + '" stroke="' + f + '" stroke-width="1.6"/>' +
        '<path fill="' + f + '" d="M' + r1(x) + " " + r1(y - 44 * s) + " C" + r1(x + 22 * s) + " " + r1(y - 30 * s) + " " + r1(x + 20 * s) + " " + r1(y + 30 * s) + " " + r1(x) + " " + r1(y + 46 * s) + " C" + r1(x - 20 * s) + " " + r1(y + 30 * s) + " " + r1(x - 22 * s) + " " + r1(y - 30 * s) + " " + r1(x) + " " + r1(y - 44 * s) + 'Z"/>' +
        '<path fill="none" stroke="rgba(230,225,215,.18)" stroke-width="1" d="M' + r1(x - 16 * s) + " " + r1(y - 20 * s) + " L" + r1(x + 16 * s) + " " + r1(y - 8 * s) + " M" + r1(x - 18 * s) + " " + r1(y + 4 * s) + " L" + r1(x + 18 * s) + " " + r1(y + 16 * s) + " M" + r1(x - 12 * s) + " " + r1(y + 26 * s) + " L" + r1(x + 12 * s) + " " + r1(y + 36 * s) + '"/></g>';
    }
  };

  /* Scherenschnitte der Gestalten: Höhe ca. 100 Einheiten, Ursprung unten Mitte, Blick nach rechts */
  const FIGUREN = {
    goblin: "M-10 -58 C-17 -46 -16 -30 -12 -22 L-14 0 L-7 0 L-4 -18 L3 -18 L6 0 L13 0 L11 -22 C16 -32 16 -46 10 -58 Z M0 -82 C8 -82 12 -76 11 -69 C10 -62 5 -58 0 -58 C-5 -58 -10 -62 -11 -69 C-12 -76 -8 -82 0 -82 Z M-8 -74 L-32 -86 L-10 -64 Z M8 -74 L32 -86 L10 -64 Z M10 -50 L27 -40 L25 -36 L9 -44 Z M24 -42 L42 -62 L45 -59 L28 -38 Z",
    wolf: "M-34 0 C-38 -20 -34 -40 -22 -54 C-18 -60 -14 -70 -12 -78 L-9 -96 L-3 -82 L3 -98 L8 -78 C18 -77 28 -72 36 -64 L40 -60 L26 -55 C18 -50 14 -42 16 -30 L20 0 L12 0 L8 -22 L-2 -18 L-4 0 Z M-32 -4 C-52 -2 -60 -14 -54 -26 C-48 -14 -40 -12 -28 -12 Z",
    zombie: "M-14 -84 L-19 0 L-8 0 L-4 -70 L2 -70 L7 0 L18 0 L12 -84 L14 -138 C8 -142 -8 -142 -14 -138 Z M4 -166 C12 -166 17 -160 16 -152 C15 -144 9 -140 3 -140 C-4 -140 -9 -146 -8 -154 C-7 -161 -3 -166 4 -166 Z M8 -134 L42 -122 L58 -121 L58 -115 L40 -114 L6 -122 Z M-6 -128 L26 -112 L44 -108 L43 -102 L24 -103 L-8 -116 Z",
    zwerg: "M-24 0 L-26 -40 C-28 -60 -20 -70 -10 -72 L10 -72 C20 -70 28 -60 26 -40 L24 0 L9 0 L6 -20 L-6 -20 L-9 0 Z M0 -96 C9 -96 13 -89 12 -82 C11 -76 7 -72 0 -72 C-7 -72 -11 -76 -12 -82 C-13 -89 -9 -96 0 -96 Z M-11 -80 L0 -50 L11 -80 Z",
    zwergHelm: "M-24 0 L-26 -40 C-28 -60 -20 -70 -10 -72 L10 -72 C20 -70 28 -60 26 -40 L24 0 L9 0 L6 -20 L-6 -20 L-9 0 Z M0 -96 C9 -96 13 -89 12 -82 C11 -76 7 -72 0 -72 C-7 -72 -11 -76 -12 -82 C-13 -89 -9 -96 0 -96 Z M-11 -80 L0 -48 L11 -80 Z M-14 -88 Q0 -112 14 -88 Z M30 0 L30 -150 L33 -150 L33 0 Z M31.5 -168 L26 -150 L37 -150 Z",
    robe: "M-22 0 C-24 -30 -22 -56 -14 -70 C-18 -80 -14 -100 0 -102 C14 -100 18 -80 14 -70 C22 -56 24 -30 22 0 Z",
    riese: "M-50 -240 C-60 -200 -56 -150 -42 -122 L-46 0 L-14 0 L-4 -100 L14 -100 L24 0 L56 0 L46 -124 C60 -160 64 -208 50 -244 C30 -256 -30 -256 -50 -240 Z M10 -292 C26 -292 34 -280 32 -266 C30 -252 22 -244 10 -244 C-4 -244 -12 -254 -12 -268 C-12 -282 -4 -292 10 -292 Z M-48 -236 C-76 -192 -82 -150 -80 -108 L-62 -106 C-60 -150 -52 -186 -36 -212 Z M48 -236 C74 -200 86 -170 92 -130 L76 -126 C70 -160 58 -190 40 -214 Z",
    kuotoa: "M-18 0 L-14 -30 C-24 -48 -22 -68 -10 -76 C-17 -90 -12 -106 0 -108 C12 -106 18 -92 12 -76 C24 -68 26 -48 16 -30 L20 0 L10 0 L4 -24 L-4 -24 L-8 0 Z M-8 -100 L-22 -114 L-4 -106 Z M8 -100 L20 -116 L4 -106 Z M22 -60 L30 -62 L30 6 L27 6 Z M28.5 -80 L24 -62 L33 -62 Z",
    fledermaus: "M0 0 C-6 -6 -14 -6 -22 -2 C-18 -8 -26 -10 -32 -4 C-28 -14 -18 -18 -6 -10 L-2 -16 L0 -12 L2 -16 L6 -10 C18 -18 28 -14 32 -4 C26 -10 18 -8 22 -2 C14 -6 6 -6 0 0 Z",
    drache: "M-70 4 C-40 -8 0 -12 40 -8 C56 -12 70 -22 84 -34 C92 -40 100 -44 108 -44 L126 -38 L114 -33 L128 -28 L106 -24 C96 -18 82 -6 66 2 C30 14 -30 16 -70 8 Z M-68 6 C-100 10 -140 30 -176 22 L-190 30 L-186 16 L-200 8 L-178 12 C-140 18 -104 0 -70 -2 Z M8 8 L2 30 L10 30 L16 10 Z M-36 10 L-42 30 L-34 30 L-28 12 Z",
    dracheFluegel: "M-6 -6 C-14 -60 6 -120 36 -156 C32 -124 42 -108 58 -102 C52 -82 60 -66 76 -62 C64 -42 50 -22 30 -4 Z",
    dracheFluegel2: "M-24 -6 C-40 -48 -48 -96 -38 -128 C-28 -100 -16 -90 0 -88 C-6 -62 4 -40 8 -10 Z",
    wespe: "M14 -10 C24 -10 30 -4 28 2 C26 8 18 10 10 8 C2 6 -4 0 -2 -4 C0 -8 6 -10 14 -10 Z M-2 -2 C-22 -12 -50 -8 -58 2 C-50 14 -24 16 -2 6 Z M28 -2 L64 12 L64 14 L27 2 Z M10 6 L4 22 M16 8 L14 24 M22 6 L26 20",
    wespeFluegel: "M6 -8 C-6 -40 -40 -46 -44 -34 C-46 -24 -20 -12 6 -8 Z M10 -8 C14 -44 -6 -60 -14 -52 C-20 -44 -4 -22 10 -8 Z",
    geier: "M0 0 C-20 -6 -50 -22 -96 -16 C-74 -10 -82 -4 -104 4 C-72 4 -40 6 -12 10 L0 22 L12 10 C40 6 72 4 104 4 C82 -4 74 -10 96 -16 C50 -22 20 -6 0 0 Z M-4 -2 C-4 -10 0 -16 6 -16 C10 -16 12 -12 10 -8 L16 -6 L8 -4 Z",
    ratte: "M-20 0 C-22 -10 -12 -18 2 -18 C12 -18 20 -14 24 -8 L32 -6 L26 -2 L22 0 Z M-20 -4 C-34 -2 -46 2 -60 -2 C-46 4 -32 4 -20 2 Z M4 -18 C6 -24 12 -24 12 -18 Z",
    hase: "M-16 0 C-22 -12 -18 -26 -4 -30 C2 -32 8 -30 12 -26 C18 -30 22 -26 20 -20 C18 -16 14 -16 12 -16 C14 -10 12 -4 8 0 Z M8 -30 C6 -44 8 -54 12 -54 C15 -52 14 -42 12 -30 Z M14 -30 C16 -42 22 -50 24 -48 C26 -44 20 -36 16 -29 Z M-18 -10 C-24 -10 -26 -6 -22 -4 Z",
    fuchs: "M-14 0 C-18 -14 -16 -30 -6 -40 L-6 -52 L0 -46 L6 -54 L8 -42 C14 -40 18 -36 20 -32 L10 -30 C8 -22 10 -10 14 0 Z M-14 -2 C-30 -2 -42 -8 -44 -20 C-36 -12 -26 -10 -14 -12 Z",
    statue: "M-30 0 L-30 -14 L-20 -14 L-20 -24 L20 -24 L20 -14 L30 -14 L30 0 Z M-12 -24 L-14 -78 C-14 -90 -8 -96 0 -96 C8 -96 14 -90 14 -78 L12 -24 Z M0 -118 C8 -118 12 -112 11 -104 C10 -98 6 -96 0 -96 C-6 -96 -10 -98 -11 -104 C-12 -112 -8 -118 0 -118 Z M12 -86 L30 -100 L32 -96 L14 -80 Z",
    blight: "M-6 0 L-10 -30 L-20 -44 L-16 -46 L-8 -36 L-6 -52 C-14 -58 -16 -70 -10 -80 L-18 -92 L-12 -94 L-6 -86 C-2 -90 4 -90 8 -86 L14 -96 L18 -92 L12 -82 C16 -72 14 -60 6 -54 L8 -38 L18 -48 L22 -46 L10 -30 L8 0 L2 0 L1 -24 L-2 -24 L-1 0 Z",
    hut: "M-26 0 C-26 -4 26 -4 26 0 C26 3 -26 3 -26 0 Z M-12 -2 C-12 -16 -8 -20 0 -20 C8 -20 12 -16 12 -2 Z",
    drachenSitz: "M-120 0 C-110 -40 -80 -70 -40 -84 C-30 -110 -10 -150 20 -170 C40 -182 56 -176 62 -160 L80 -158 L66 -146 C60 -128 46 -112 36 -96 C60 -86 90 -60 104 -30 L130 0 Z M-40 -84 C-58 -130 -88 -170 -122 -204 C-98 -192 -72 -188 -58 -194 C-58 -172 -46 -158 -32 -162 C-32 -142 -22 -128 -8 -130 C-12 -112 -6 -98 4 -90 Z M100 -20 C130 -10 160 -20 176 -40 L170 -24 L184 -30 C166 0 130 8 96 -2 Z",
    boot: "M-60 0 C-50 14 50 14 64 0 L70 -8 L-66 -8 Z M-30 -8 L-26 -30 L-22 -8 Z M10 -8 L14 -34 L18 -8 Z M40 -8 L44 -26 L48 -8 Z M-20 -10 L50 -40 L52 -36 L-18 -6 Z",
    thron: "M-50 0 L-50 -90 L-40 -90 L-40 -150 L-56 -190 L-34 -160 L-30 -180 L-20 -150 L20 -150 L30 -180 L34 -160 L56 -190 L40 -150 L40 -90 L50 -90 L50 0 L36 0 L36 -40 L-36 -40 L-36 0 Z",
    menhir: "M-34 0 C-40 -60 -36 -140 -18 -190 C-6 -206 10 -206 20 -188 C36 -140 42 -60 36 0 Z",
    amboss: "M-50 -62 L50 -62 C54 -56 50 -50 40 -48 L70 -44 C50 -40 30 -38 22 -34 L22 -14 L36 0 L-36 0 L-22 -14 L-22 -34 C-34 -38 -48 -46 -50 -62 Z",
    ei: "M0 -100 C30 -100 44 -56 44 -32 C44 -8 24 4 0 4 C-24 4 -44 -8 -44 -32 C-44 -56 -30 -100 0 -100 Z",
    wagenrad: "",
    hund: "M-30 0 L-28 -30 C-30 -40 -24 -46 -14 -46 L14 -46 L20 -60 L22 -74 L28 -64 L36 -62 L42 -54 L34 -50 L28 -40 L28 0 L20 0 L18 -24 L-14 -24 L-18 0 Z M-28 -40 C-38 -46 -44 -56 -42 -66 C-36 -56 -32 -50 -24 -46 Z"
  };

  /* =====================================================================
     FERNE (ganze Breite, unten) und DECKE (Höhlen, oben) – werden passend
     zur Bildschirmbreite gezeichnet, damit nichts verzerrt.
     ===================================================================== */
  const FERN = {
    stadt(b, W, H, c, o) {
      o = o || {};
      let s = "";
      const basis = x => H * (o.flach ? .78 : .74) - (o.flach ? 0 : Math.max(0, Math.sin((x / W) * Math.PI)) * H * .1);
      if (o.meer) {
        s += '<rect x="0" y="' + r1(H * .8) + '" width="' + W + '" height="' + r1(H * .2) + '" fill="' + b.verlauf([[0, o.meer, .9], [1, "#0b0d0d", 1]]) + '"/>';
        for (let i = 0; i < Math.round(W / 160); i++) {
          const x = b.z(0, W), y = H * b.z(.82, .98);
          s += '<path d="M' + r1(x) + " " + r1(y) + " h" + r1(b.z(14, 60)) + '" stroke="' + c.licht + '" stroke-opacity=".22" stroke-width="1.3" stroke-linecap="round"' + b.anim("kl-glanz", b.z(4, 9)) + "/>";
        }
      }
      let d = "M0 " + H + " L0 " + r1(basis(0)), lichter = "";
      let x = 0;
      while (x < W) {
        const w = b.z(16, 44), y = basis(x), turm = b.r() < .1, h = turm ? b.z(70, 130) : b.z(16, 58);
        if (turm) { d += " L" + r1(x) + " " + r1(y - h) + " L" + r1(x + w * .25) + " " + r1(y - h - w * 1.2) + " L" + r1(x + w * .5) + " " + r1(y - h) + " L" + r1(x + w * .5) + " " + r1(y); }
        else if (b.r() < .6) d += " L" + r1(x) + " " + r1(y - h) + " L" + r1(x + w / 2) + " " + r1(y - h - w * .45) + " L" + r1(x + w) + " " + r1(y - h);
        else d += " L" + r1(x) + " " + r1(y - h) + " L" + r1(x + w) + " " + r1(y - h);
        if (b.r() < .35) lichter += '<rect x="' + r1(x + w * .3) + '" y="' + r1(y - h * .55) + '" width="3" height="4" fill="' + c.licht + '" fill-opacity=".55"' + b.anim("kl-fenster", b.z(6, 14)) + "/>";
        x += w;
      }
      s += '<path fill="' + c.fern + '" d="' + d + " L" + W + " " + H + 'Z"/>' + lichter;
      return s;
    },
    wald(b, W, H, c, o) {
      let s = "";
      [[c.fern2 || c.fern, .62, .7], [c.fern, .74, 1]].forEach(([f, y0, k]) => {
        let x = -20;
        while (x < W + 20) {
          const h = b.z(70, 170) * k * H / 400;
          s += b.r() < .6 ? b.tanne(x, H * y0 + 40, h, f) : b.laubbaum(x, H * y0 + 40, h * .9, f);
          x += b.z(18, 40) * k;
        }
        s += '<rect x="0" y="' + r1(H * y0 + 38) + '" width="' + W + '" height="' + r1(H * (1 - y0)) + '" fill="' + f + '"/>';
      });
      if (o && o.gift) s += '<rect x="0" y="' + r1(H * .55) + '" width="' + W + '" height="' + r1(H * .45) + '" fill="' + b.verlauf([[0, o.gift, 0], [1, o.gift, .18]]) + '"/>';
      return s;
    },
    huegel(b, W, H, c) {
      let s = "";
      [[c.fern2 || c.fern, .6], [c.fern, .76]].forEach(([f, y0], j) => {
        let d = "M0 " + H + " L0 " + r1(H * y0);
        for (let x = 0; x <= W + 60; x += 60) d += " L" + x + " " + r1(H * y0 - Math.sin(x / W * Math.PI * (2 + j) + j) * H * .06 - b.z(0, H * .015));
        s += '<path fill="' + f + '" d="' + d + " L" + (W + 60) + " " + H + 'Z"/>';
      });
      return s;
    },
    dorf(b, W, H, c, o) {
      let s = FERN.huegel(b, W, H, c);
      let x = b.z(0, 80);
      while (x < W) {
        const y = H * .78, w = b.z(18, 30), h = b.z(12, 22);
        if (o && o.ruine) s += b.haus(x, y + 4, w, h, c.fern, { dach: b.r() < .5 ? 0 : w * .4 });
        else s += b.haus(x, y + 4, w, h, c.fern, { dach: w * .5, fenster: b.r() < .5 ? [[.4, .35, .2, .3]] : [], licht: c.licht });
        x += b.z(60, 180);
        if (b.r() < .3) { s += b.laubbaum(x, y + 6, b.z(40, 70), c.fern); x += 30; }
      }
      return s;
    },
    hoehle(b, W, H, c, o) {
      let s = "";
      [[c.fern2 || c.fern, .62], [c.fern, .76]].forEach(([f, y0]) => {
        let d = "M0 " + H + " L0 " + r1(H * y0);
        let x = 0;
        while (x < W) {
          const w = b.z(20, 60), h = b.r() < .3 ? b.z(30, H * .28) : b.z(4, 20);
          d += " L" + r1(x + w * .4) + " " + r1(H * y0 - h) + " L" + r1(x + w * .6) + " " + r1(H * y0 - h * .92) + " L" + r1(x + w) + " " + r1(H * y0 + b.z(-6, 6));
          x += w;
        }
        s += '<path fill="' + f + '" d="' + d + " L" + W + " " + H + 'Z"/>';
      });
      if (o && o.pilze) {
        for (let i = 0; i < W / 140; i++) s += b.pilz(b.z(0, W), H * b.z(.74, .8), b.z(.35, .8), c.fern, b.r() < .5 ? c.licht : (c.licht2 || c.licht), .3);
      }
      if (o && o.fluss) s += '<path d="M0 ' + r1(H * .9) + " Q" + r1(W * .3) + " " + r1(H * .86) + " " + r1(W * .55) + " " + r1(H * .92) + " T" + W + " " + r1(H * .9) + '" stroke="' + c.wasser + '" stroke-width="5" fill="none" opacity=".45"' + b.anim("kl-glanz", 6) + "/>";
      if (o && o.lava) {
        s += '<rect x="0" y="' + r1(H * .9) + '" width="' + W + '" height="' + r1(H * .1) + '" fill="' + b.verlauf([[0, "#ff7a2a", .0], [.4, "#ff6a1a", .35], [1, "#c23a10", .5]]) + '" class="kl-lava"/>';
      }
      return s;
    },
    see(b, W, H, c, o) {
      let s = FERN.hoehle(b, W, H * .82, c);
      const y = H * .7;
      s += '<rect x="0" y="' + r1(y) + '" width="' + W + '" height="' + r1(H - y) + '" fill="' + b.verlauf([[0, c.wasser, .55], [1, "#070b0b", 1]]) + '"/>';
      for (let i = 0; i < W / 90; i++) {
        const xx = b.z(0, W), yy = y + b.z(4, H - y - 4);
        s += '<path d="M' + r1(xx) + " " + r1(yy) + (o && o.wild ? " q8 -6 16 0 t16 0" : " h" + r1(b.z(10, 50))) + '" stroke="' + (c.glanz || c.licht) + '" stroke-opacity="' + (o && o.wild ? ".35" : ".2") + '" stroke-width="1.4" fill="none" stroke-linecap="round"' + b.anim(o && o.wild ? "kl-welle" : "kl-glanz", b.z(3, 8)) + "/>";
      }
      return s;
    },
    festung(b, W, H, c) {
      let s = FERN.hoehle(b, W, H, c);
      const fels = (x0, x1, top) => {
        let d = "M" + x0 + " " + H + " L" + x0 + " " + r1(H * top);
        for (let x = x0; x <= x1; x += 30) d += " L" + x + " " + r1(H * top + b.z(-14, 14));
        return '<path fill="' + c.fern + '" d="' + d + " L" + x1 + " " + H + 'Z"/>';
      };
      s += fels(0, W * .18, .22) + fels(W * .82, W, .26);
      [[W * .03, .3], [W * .1, .4], [W * .86, .34], [W * .93, .45]].forEach(([x, t]) => {
        s += b.turm(x, H * .8, 24, H * (.8 - t), c.fern2 || c.fern, { fenster: [[.5, .3], [.5, .6]], licht: c.licht });
      });
      let x = W * .15;
      while (x < W * .85) { s += b.licht(x, H * .74, b.z(30, 60), c.licht, .25); x += b.z(80, 200); }
      let d = "M" + r1(W * .15) + " " + r1(H * .78);
      for (let xx = W * .15; xx < W * .85; xx += 16) d += " L" + r1(xx) + " " + r1(H * .7) + " L" + r1(xx + 8) + " " + r1(H * .7) + " L" + r1(xx + 8) + " " + r1(H * .72) + " L" + r1(xx + 16) + " " + r1(H * .72);
      s += '<path fill="' + c.fern + '" d="' + d + " L" + r1(W * .85) + " " + H + " L" + r1(W * .15) + " " + H + 'Z"/>';
      return s;
    },
    halle(b, W, H, c, o) {
      let s = '<rect x="0" y="' + r1(H * .86) + '" width="' + W + '" height="' + r1(H * .14) + '" fill="' + c.fern + '"/>';
      const ab = Math.max(140, W / 9);
      for (let x = ab / 2; x < W; x += ab) {
        s += '<rect x="' + r1(x - 18) + '" y="' + r1(H * .05) + '" width="36" height="' + r1(H * .82) + '" fill="' + c.fern + '"/><rect x="' + r1(x - 26) + '" y="' + r1(H * .05) + '" width="52" height="14" fill="' + c.fern + '"/><rect x="' + r1(x - 26) + '" y="' + r1(H * .84) + '" width="52" height="14" fill="' + c.fern + '"/>';
      }
      if (o && o.lava) s += '<rect x="0" y="' + r1(H * .9) + '" width="' + W + '" height="' + r1(H * .05) + '" fill="#ff6a1a" fill-opacity=".22" class="kl-lava"/>';
      return s;
    },
    innen(b, W, H, c) {
      let s = '<rect x="0" y="' + r1(H * .84) + '" width="' + W + '" height="' + r1(H * .16) + '" fill="' + c.fern + '"/>';
      for (let x = 0; x < W; x += 220) s += '<rect x="' + r1(x) + '" y="0" width="22" height="' + H + '" fill="' + c.fern + '" opacity=".7"/>';
      s += '<rect x="0" y="' + r1(H * .1) + '" width="' + W + '" height="18" fill="' + c.fern + '" opacity=".7"/>';
      return s;
    }
  };
  function decke(b, W, H, f, f2) {
    return b.stalaktiten(-10, W + 10, H * .2, H * .55, f2 || f) + b.stalaktiten(-30, W + 30, H * .08, H * .42, f);
  }

  /* =====================================================================
     DIE ORTE
     himmel: Hintergrund (CSS) · fern: Ferne · decke: Höhlendecke
     links/rechts: Flügel (wie Theaterkulissen) · teilchen: was in der Luft liegt
     Farben: niemals Blau – Nacht eher violett/silbern, Wasser dunkel-türkis.
     ===================================================================== */
  const NACHT = (() => { const h = new Date().getHours(); return h >= 20 || h < 6; })();
  const ORTE = {
    /* ---------------- Kapitel I ---------------- */
    hafen: {
      name: { de: "Der Hafen von Neverwinter", en: "Neverwinter Harbour" },
      himmel: "radial-gradient(ellipse 55% 40% at 88% 80%, rgba(220,140,80,.26), transparent 70%), radial-gradient(ellipse 45% 35% at 10% 84%, rgba(200,120,90,.2), transparent 70%), linear-gradient(180deg, #110e15 0%, #1b141c 42%, #2e1e22 74%, #191515 100%)",
      farben: { fern: "#2a1f25", fern2: "#352630", licht: "#f2b56a" },
      fern: (b, W, H, c) => FERN.stadt(b, W, H, c, { meer: "#16302c" }),
      links(b) {
        const s2 = "#0c0a0e", s1 = "#151116";
        let s = b.wasser(900, "#132824", "#090b0b", "rgba(242,181,106,.4)");
        /* Schiff am Steg: Rumpf, Mast, Rahen, gereffte Segel, Takelage */
        s += '<g class="kl-wipp" style="animation-duration:9s;transform-origin:200px 930px">';
        s += '<path fill="' + s1 + '" d="M-30 862 L440 858 Q420 930 340 958 L-30 960 Z"/>';
        s += '<rect fill="' + s1 + '" x="146" y="90" width="9" height="780"/><rect fill="' + s1 + '" x="340" y="300" width="6" height="560"/>';
        s += '<path stroke="' + s1 + '" stroke-width="6" stroke-linecap="round" d="M40 230 L262 222 M10 420 L292 412 M60 600 L250 594 M262 420 L420 412"/>';
        s += '<path stroke="' + s1 + '" stroke-width="16" stroke-linecap="round" opacity=".95" d="M48 238 Q150 252 254 230 M18 428 Q150 446 284 420 M270 428 Q340 438 412 420"/>';
        s += '<path stroke="' + s1 + '" stroke-width="1.4" fill="none" opacity=".8" d="M150 92 L-10 862 M150 92 L330 862 M150 92 L440 600 M343 300 L460 860 M343 300 L180 862 M40 230 L10 420 M262 222 L292 412"/>';
        s += '<path fill="' + s1 + '" d="M150 70 l18 12 l-18 6z"/>';
        s += "</g>";
        /* Steg mit Pfählen, Kisten, Fässern und Laterne */
        s += '<rect fill="' + s2 + '" x="-10" y="905" width="520" height="16"/>';
        [20, 130, 250, 370, 480].forEach(x => { s += '<rect fill="' + s2 + '" x="' + x + '" y="880" width="16" height="130"/>'; });
        s += '<rect fill="' + s2 + '" x="60" y="845" width="62" height="60"/><rect fill="' + s2 + '" x="108" y="868" width="40" height="38"/>';
        s += '<path fill="' + s2 + '" d="M180 905 C176 880 178 860 182 852 L222 852 C226 860 228 880 224 905 Z"/><path stroke="' + s1 + '" stroke-width="2" d="M180 870 h44 M180 890 h44"/>';
        s += '<rect fill="' + s2 + '" x="300" y="700" width="10" height="210"/><path stroke="' + s2 + '" stroke-width="6" d="M300 708 h56"/>';
        s += b.laterne(352, 738, "#f2b56a", s2, 28);
        s += b.licht(352, 960, 60, "#f2b56a", .25, "kl-glanz");
        return s;
      },
      rechts(b) {
        const s2 = "#0c0a0e", s1 = "#16111a";
        let s = b.wasser(880, "#132824", "#090b0b", "rgba(242,181,106,.35)");
        /* Fischerboot schaukelt */
        s += '<g class="kl-wipp" style="animation-duration:6.5s;transform-origin:190px 900px">';
        s += '<path fill="' + s1 + '" d="M40 870 Q190 880 360 860 Q330 920 250 930 L120 930 Q60 914 40 870 Z"/><rect fill="' + s1 + '" x="196" y="560" width="7" height="312"/>';
        s += '<path fill="' + s1 + '" opacity=".9" d="M203 580 Q290 660 300 840 L203 840 Z"/><path stroke="' + s1 + '" stroke-width="1.2" d="M199 562 L40 870 M199 562 L360 860"/>';
        s += '<path fill="' + s1 + '" d="M100 860 C96 846 110 840 120 846 C130 840 140 850 132 862 Z"/>';
        s += "</g>";
        /* Laternenpfahl, Möwen */
        s += '<rect fill="' + s2 + '" x="40" y="640" width="12" height="380"/><path stroke="' + s2 + '" stroke-width="6" d="M40 650 h70"/>';
        s += b.laterne(104, 682, "#f2b56a", s2, 26);
        s += '<rect fill="' + s2 + '" x="-10" y="960" width="200" height="50"/><path fill="' + s2 + '" d="M10 960 C8 930 40 924 60 936 C70 924 96 930 92 960Z"/>';
        for (let i = 0; i < 3; i++) s += '<g class="kl-moewe" style="animation-duration:' + r1(b.z(22, 34)) + "s;animation-delay:-" + r1(b.z(0, 30)) + 's"><path d="M' + r1(b.z(80, 360)) + " " + r1(b.z(180, 420)) + ' q7 -7 14 0 q7 -7 14 0" stroke="#b8aaa0" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round" class="kl-fluegelschlag"/></g>';
        return s;
      },
      teilchen: [{ t: "nebel", n: 4, farbe: ["#b9a6a0"] }, { t: "staub", n: 10, farbe: ["#f2c58a"] }]
    },

    waldstrasse: {
      name: { de: "Die Straße nach Phandalin", en: "The Road to Phandalin" },
      himmel: "radial-gradient(ellipse 50% 45% at 86% 82%, rgba(230,120,50,.22), transparent 70%), radial-gradient(ellipse 60% 40% at 30% 10%, rgba(140,150,110,.1), transparent 70%), linear-gradient(180deg, #0f1210 0%, #161a15 50%, #1d1d16 80%, #121310 100%)",
      farben: { fern: "#1d231c", fern2: "#263024", licht: "#f0a050" },
      fern: (b, W, H, c) => FERN.wald(b, W, H, c),
      links(b) {
        const s2 = "#0a0c0a", s1 = "#121611";
        let s = b.tanne(60, 1000, 900, s1) + b.laubbaum(260, 1000, 640, s1) + b.tanne(-20, 1000, 1000, s2);
        s += b.laubbaum(150, 1010, 520, s2);
        s += b.busch(260, 990, 150, s2) + b.busch(420, 1000, 110, s2);
        s += b.augen(250, 920, 13, "#d8e070", 2.2) + b.augen(408, 962, 11, "#d8e070", 1.9);
        s += b.boden(985, s2, 6);
        return s;
      },
      rechts(b) {
        const s2 = "#0a0c0a", s1 = "#121611";
        let s = b.tanne(30, 1000, 960, s1) + b.laubbaum(200, 990, 560, s1);
        /* umgestürzter, halb verbrannter Wagen, aus dem noch Rauch steigt */
        s += b.licht(260, 900, 170, "#e8803a", .3, "kl-glut");
        s += '<g fill="' + s2 + '"><path d="M120 950 L150 852 L380 860 L400 942 Z"/><path d="M170 852 L190 800 L240 830 L262 790 L300 850 L330 812 L350 858 Z" opacity=".9"/>' +
          '<rect x="370" y="900" width="140" height="10" transform="rotate(-14 370 900)"/></g>';
        s += '<g fill="none" stroke="' + s2 + '" stroke-width="8"><circle cx="160" cy="950" r="46"/><circle cx="380" cy="930" r="40"/></g><g stroke="' + s2 + '" stroke-width="4"><path d="M160 904 V996 M114 950 H206 M128 918 L192 982 M128 982 L192 918"/></g>';
        s += b.licht(250, 846, 50, "#ff8a3a", .5, "kl-glut") + b.licht(310, 852, 36, "#ff9a4a", .45, "kl-glut");
        s += b.rauch(260, 820, "#8a7f78", 5, 30);
        s += b.busch(40, 1000, 120, s2) + b.boden(990, s2, 5);
        return s;
      },
      teilchen: [{ t: "blatt", n: 12 }, { t: "glut", n: 6, farbe: ["#ff9a4a", "#ffbe6a"], zone: "rechts" }, { t: "nebel", n: 2, farbe: ["#8a9077"] }]
    },

    goblinhoehle: {
      name: { de: "Die Goblinhöhle", en: "The Goblin Cave" },
      himmel: "radial-gradient(ellipse 35% 40% at 12% 70%, rgba(230,130,60,.24), transparent 70%), radial-gradient(ellipse 40% 50% at 90% 60%, rgba(120,140,100,.1), transparent 70%), linear-gradient(180deg, #0e100e 0%, #141612 55%, #1a1814 100%)",
      farben: { fern: "#1c1e19", fern2: "#262820", licht: "#f0a050" },
      fern: (b, W, H, c) => FERN.wald(b, W, H, c),
      links(b) {
        const s2 = "#0b0a09", s1 = "#16140f";
        let s = '<path fill="' + s1 + '" d="M-10 0 L230 0 C200 120 260 240 220 360 C190 460 250 560 210 660 C190 740 240 820 230 1010 L-10 1010 Z"/>';
        s += '<path fill="' + s2 + '" d="M-10 0 L120 0 C110 160 150 300 120 440 C100 560 140 700 110 1010 L-10 1010 Z"/>';
        s += '<rect fill="' + s2 + '" x="214" y="560" width="30" height="8" transform="rotate(-20 214 560)"/>' + b.fackel(250, 548, "#ff9a40", s2, 1.2);
        /* angebundene Wölfe */
        s += '<path stroke="' + s2 + '" stroke-width="5" d="M330 1000 V900"/><circle cx="330" cy="900" r="6" fill="' + s2 + '"/>';
        s += '<path d="M330 920 Q360 960 380 958" stroke="' + s2 + '" stroke-width="2" fill="none"/>';
        s += b.figur("wolf", 420, 1000, 1.45, s2) + b.figur("wolf", 300, 1004, 1.15, s1, "", true);
        s += b.boden(990, s2, 4);
        return s;
      },
      rechts(b) {
        const s2 = "#0b0a09", s1 = "#16140f";
        let s = '<path fill="' + s1 + '" d="M-10 0 L420 0 C380 80 300 130 260 220 C220 300 240 380 200 470 L160 1010 L-10 1010 Z"/>';
        s += '<path fill="' + s2 + '" d="M-10 0 L200 0 C170 200 110 300 120 500 C130 700 60 800 70 1010 L-10 1010Z"/>';
        /* Wurzeln hängen in den Höhleneingang */
        s += '<path stroke="' + s1 + '" stroke-width="3" fill="none" d="M300 150 C310 220 290 260 300 330 M330 110 C340 170 330 200 344 250 M270 200 C260 260 280 300 266 360"/>';
        s += b.augen(180, 700, 12, "#e0d070", 2) + b.figur("goblin", 300, 1000, 1.3, s2);
        s += b.fels(120, 1004, 260, 60, s2) + b.boden(992, s2, 4);
        return s;
      },
      teilchen: [{ t: "tropfen", n: 6 }, { t: "glut", n: 6, farbe: ["#ff9a40"], zone: "links" }, { t: "nebel", n: 2, farbe: ["#6e6a5a"] }]
    },

    phandalin: {
      name: { de: "Phandalin", en: "Phandalin" },
      himmel: "radial-gradient(ellipse 50% 40% at 15% 78%, rgba(240,160,80,.22), transparent 70%), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(160,140,170,.12), transparent 70%), linear-gradient(180deg, #121018 0%, #1a1520 45%, #241a1c 80%, #15120f 100%)",
      farben: { fern: "#21191f", fern2: "#2c222a", licht: "#f2b56a" },
      fern: (b, W, H, c) => FERN.dorf(b, W, H, c),
      links(b) {
        const s2 = "#0c0a0d", s1 = "#151117";
        /* die Taverne mit Schild */
        let s = b.haus(-20, 1000, 330, 300, s2, { dach: 170, kamin: true, fenster: [[.2, .3, .14, .22], [.55, .3, .14, .22], [.2, .68, .14, .2]], licht: "#f2b56a" });
        s += b.rauch(215, 560, "#776a70", 5, 22);
        s += '<path stroke="' + s2 + '" stroke-width="6" d="M310 740 h90"/><g class="kl-pendel" style="animation-duration:6s;transform-origin:380px 744px"><path stroke="' + s2 + '" stroke-width="2" d="M360 744 v20 M398 744 v20"/><rect x="346" y="762" width="66" height="46" rx="4" fill="' + s2 + '"/>' +
          '<path fill="#f2b56a" opacity=".55" d="M368 772 h18 v24 h-18z M386 778 h6 a5 5 0 0 1 0 12 h-6"/></g>';
        s += '<path fill="' + s2 + '" d="M330 1000 C326 960 330 940 336 932 L376 932 C382 940 384 960 380 1000Z"/>';
        s += b.licht(440, 980, 40, "#d8e070", .4, "kl-puls");
        s += b.boden(995, s2, 3);
        return s;
      },
      rechts(b) {
        const s2 = "#0c0a0d", s1 = "#151117";
        let s = b.turm(330, 640, 60, 140, s1, { ruine: true }) + b.turm(392, 640, 40, 90, s1, { ruine: true }) + '<path fill="' + s1 + '" d="M250 660 Q380 600 520 640 L520 700 L250 700Z"/>';
        s += b.licht(360, 560, 40, "#c04a3a", .3, "kl-puls");
        s += b.haus(-10, 1000, 220, 210, s2, { dach: 120, kamin: true, fenster: [[.25, .35, .16, .24], [.6, .35, .16, .24]], licht: "#f2b56a" });
        s += b.rauch(150, 690, "#776a70", 4, 18);
        s += b.haus(230, 1000, 150, 150, s1, { dach: 90, fenster: [[.4, .4, .18, .26]], licht: "#f0a860" });
        /* zwei Rote Roben in der Gasse */
        s += b.figur("robe", 410, 1000, 1.25, "#2a0f12") + b.figur("robe", 452, 1004, 1.15, "#241014");
        s += '<path stroke="' + s2 + '" stroke-width="5" d="M0 960 H220 M20 960 V1000 M80 960 V1000 M140 960 V1000 M200 960 V1000"/>';
        s += b.boden(995, s2, 3);
        return s;
      },
      teilchen: [{ t: "kaefer", n: 9 }, { t: "nebel", n: 2, farbe: ["#8a7a80"] }]
    },

    crackmore: {
      name: { de: "Schloss Crackmore", en: "Castle Crackmore" },
      himmel: "radial-gradient(ellipse 45% 40% at 88% 72%, rgba(130,200,110,.16), transparent 70%), radial-gradient(ellipse 40% 40% at 10% 30%, rgba(170,130,190,.12), transparent 70%), linear-gradient(180deg, #100e13 0%, #17141a 55%, #1a1815 100%)",
      farben: { fern: "#1e1a20", fern2: "#28232a", licht: "#c9b070" },
      fern: (b, W, H, c) => FERN.huegel(b, W, H, c) + b.turm(W * .12, H * .78, 50, H * .3, c.fern, { ruine: true }) + b.turm(W * .86, H * .78, 60, H * .36, c.fern, { ruine: true }),
      links(b) {
        const s2 = "#0b0a0c", s1 = "#151216";
        /* Mauerruine mit Ranken und Geheimgang */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 160 L60 150 L70 120 L120 130 L130 210 L200 220 L210 300 L270 296 L280 420 L330 430 L340 1010 Z"/>';
        let ranke = "";
        for (let i = 0; i < 4; i++) { const x = b.z(20, 300); ranke += "M" + r1(x) + " " + r1(b.z(200, 420)) + " C" + r1(x + b.z(-30, 30)) + " " + r1(b.z(500, 600)) + " " + r1(x + b.z(-40, 40)) + " " + r1(b.z(700, 800)) + " " + r1(x + b.z(-20, 20)) + " 1000 "; }
        s += '<path d="' + ranke + '" stroke="' + s2 + '" stroke-width="4" fill="none"/>';
        for (let i = 0; i < 26; i++) s += '<ellipse cx="' + r1(b.z(10, 330)) + '" cy="' + r1(b.z(300, 980)) + '" rx="9" ry="5" fill="' + s2 + '" transform="rotate(' + r1(b.z(0, 180)) + ')" transform-origin="center"/>';
        s += '<path fill="#050405" d="M150 1000 L150 900 Q200 846 250 900 L250 1000 Z"/>';
        s += b.busch(130, 1004, 120, s2) + b.figur("hase", 420, 1000, 1.4, s2);
        s += b.boden(995, s2, 4);
        return s;
      },
      rechts(b) {
        const s2 = "#0b0a0c", s1 = "#151216";
        /* Regal des Alchemisten: leuchtende Gläser, Kräuterbündel */
        let s = '<rect fill="' + s1 + '" x="-10" y="380" width="380" height="630"/>';
        const glas = [["#9ad070", 40, 560, 1], ["#d0a050", 120, 556, .8], ["#b080c0", 200, 562, 1.1], ["#9ad070", 290, 558, .7], ["#d08a60", 60, 760, .9], ["#b080c0", 160, 760, 1.2], ["#9ad070", 260, 756, .9]];
        [600, 800].forEach(y => { s += '<rect fill="' + s2 + '" x="-10" y="' + y + '" width="390" height="12"/>'; });
        glas.forEach(([c, x, y, g]) => {
          s += b.licht(x, y, 60 * g, c, .32, "kl-puls");
          s += '<path fill="' + c + '" opacity=".3" stroke="' + s2 + '" stroke-width="3" d="M' + r1(x - 18 * g) + " " + (y + 40) + " L" + r1(x - 18 * g) + " " + r1(y - 20 * g) + " L" + r1(x - 7 * g) + " " + r1(y - 30 * g) + " L" + r1(x - 7 * g) + " " + r1(y - 44 * g) + " L" + r1(x + 7 * g) + " " + r1(y - 44 * g) + " L" + r1(x + 7 * g) + " " + r1(y - 30 * g) + " L" + r1(x + 18 * g) + " " + r1(y - 20 * g) + " L" + r1(x + 18 * g) + " " + (y + 40) + 'Z"/>';
        });
        s += '<circle cx="200" cy="580" r="6" fill="' + s2 + '"/><circle cx="200" cy="580" r="2" fill="#e0d070" class="kl-blinzeln" style="animation-duration:6s"/>';
        for (let i = 0; i < 6; i++) { const x = 30 + i * 60; s += '<path stroke="' + s2 + '" stroke-width="2" d="M' + x + " 380 v" + r1(b.z(30, 60)) + '"/><path fill="' + s2 + '" d="M' + (x - 14) + " " + r1(430 + b.z(0, 20)) + " q14 -30 28 0 q-6 50 -14 70 q-8 -20 -14 -70z" + '"/>'; }
        s += b.rauch(320, 990, "#86b070", 4, 26);
        s += '<path fill="#86b070" opacity=".35" d="M300 1000 l18 -26 l4 8 l14 -4 l-8 22z"/>';
        return s;
      },
      teilchen: [{ t: "staub", n: 14, farbe: ["#d8c79a"] }, { t: "sporen", n: 6, farbe: ["#9ad070", "#b080c0"], zone: "rechts" }]
    },

    wachturm: {
      name: { de: "Der Wachturm bei Nacht", en: "The Watchtower at Night" },
      mond: "radial-gradient(circle at 16% 16%, rgba(230,228,236,.85) 0 1.6vh, rgba(210,205,225,.22) 2vh, rgba(190,180,215,.06) 12vh, transparent 26vh)",
      himmel: "radial-gradient(ellipse 30% 45% at 90% 58%, rgba(185,178,210,.14), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(140,150,140,.1), transparent 70%), linear-gradient(180deg, #0c0b12 0%, #13111c 50%, #191722 85%, #121218 100%)",
      farben: { fern: "#1b1922", fern2: "#232030", licht: "#f0a050" },
      fern: (b, W, H, c) => FERN.huegel(b, W, H, c),
      links(b) {
        const s2 = "#09080c", s1 = "#121018";
        let s = "";
        for (let i = 0; i < 12; i++) s += '<circle cx="' + r1(b.z(20, 520)) + '" cy="' + r1(b.z(60, 520)) + '" r="' + r1(b.z(.8, 1.8)) + '" fill="#e8e4f0"' + b.anim("kl-funkeln", b.z(3, 7)) + "/>";
        s += b.busch(80, 1000, 210, s1) + b.busch(260, 1004, 170, s2) + b.busch(420, 1006, 120, s2) + b.busch(10, 1010, 160, s2);
        s += b.laubbaum(60, 1000, 500, s1);
        s += b.boden(992, s2, 4);
        return s;
      },
      rechts(b) {
        const s2 = "#09080c", s1 = "#121018";
        /* Rundturm mit Riss (Fackelschein), Wachhaus, Zugbrücke */
        let s = '<rect fill="' + s1 + '" x="-10" y="320" width="230" height="690"/>';
        s += '<path fill="' + s1 + '" d="M-14 320 L-14 300 L8 300 L8 284 L36 284 L36 300 L64 300 L64 284 L92 284 L92 300 L120 300 L120 284 L148 284 L148 300 L176 300 L176 284 L204 284 L204 300 L224 300 L224 320Z"/>';
        s += b.licht(110, 560, 80, "#f0a050", .4, "kl-glut") + '<path d="M106 480 L112 520 L105 560 L113 600 L108 640" stroke="#f0a050" stroke-width="1.8" stroke-opacity=".7" fill="none" class="kl-glut" style="animation-duration:4s"/>';
        s += b.haus(220, 1000, 220, 200, s2, { dach: 70, first: .3 }) + '<path fill="#060507" d="M300 1000 L300 900 Q340 860 380 900 L380 1000Z"/>';
        s += '<path stroke="' + s2 + '" stroke-width="10" d="M300 1000 L250 1010"/><path stroke="' + s2 + '" stroke-width="2" d="M300 900 L240 1004 M380 900 L420 1004"/>';
        /* die Fledermaus, die aus dem Spalt entkommt */
        s += '<g class="kl-fledermausflug" style="animation-duration:16s;animation-delay:-4s"><g transform="translate(110 520) scale(1.2)"><path fill="' + s2 + '" d="' + FIGUREN.fledermaus + '" class="kl-fluegelschlag" style="animation-duration:.5s"/></g></g>';
        s += b.busch(470, 1006, 120, s2) + b.boden(995, s2, 4);
        return s;
      },
      teilchen: [{ t: "nebel", n: 4, farbe: ["#a8a0b8"] }, { t: "staub", n: 6, farbe: ["#d8d2e0"] }]
    },

    wiedersehen: {
      name: { de: "Ein Wiedersehen", en: "A Reunion" },
      himmel: "radial-gradient(ellipse 55% 50% at 85% 85%, rgba(240,150,70,.3), transparent 70%), radial-gradient(ellipse 40% 40% at 12% 50%, rgba(240,180,100,.14), transparent 70%), linear-gradient(180deg, #140f0d 0%, #1d1510 60%, #22180f 100%)",
      farben: { fern: "#24190f", licht: "#f2b56a" },
      fern: (b, W, H, c) => FERN.innen(b, W, H, c),
      links(b) {
        const s2 = "#0d0907", s1 = "#18110c";
        let s = '<rect fill="' + s1 + '" x="40" y="300" width="200" height="260"/><rect fill="#2a2030" x="56" y="316" width="168" height="228"/>' +
          '<path stroke="' + s1 + '" stroke-width="8" d="M140 316 V544 M56 430 H224"/>';
        for (let i = 0; i < 6; i++) s += '<circle cx="' + r1(b.z(66, 214)) + '" cy="' + r1(b.z(326, 420)) + '" r="1.3" fill="#e8e0f0"' + b.anim("kl-funkeln", b.z(3, 6)) + "/>";
        s += '<rect fill="' + s2 + '" x="-10" y="620" width="300" height="12"/><rect fill="' + s2 + '" x="-10" y="760" width="300" height="12"/>';
        s += '<rect fill="' + s2 + '" x="20" y="570" width="60" height="50"/><circle cx="160" cy="596" r="24" fill="none" stroke="' + s2 + '" stroke-width="10"/><rect fill="' + s2 + '" x="210" y="700" width="50" height="60"/>';
        s += '<path fill="' + s2 + '" d="M-10 1010 L-10 880 L420 870 L420 1010Z"/><rect fill="' + s2 + '" x="380" y="880" width="20" height="130"/>';
        s += b.laterne(300, 838, "#f2b56a", s2, 0);
        return s;
      },
      rechts(b) {
        const s2 = "#0d0907", s1 = "#18110c";
        /* Kamin und zwei gleiche Hüte am Haken – die Zwillinge tragen ja sogar dieselbe Kleidung */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 520 L280 520 L280 1010 Z"/><path fill="#050303" d="M40 1010 L40 790 Q140 720 240 790 L240 1010Z"/>';
        s += b.licht(140, 930, 170, "#ff9a40", .4, "kl-glut") + '<path fill="#ff9a40" opacity=".3" d="M90 1000 Q100 940 120 930 Q118 960 140 900 Q150 950 166 920 Q170 960 190 1000Z" class="kl-flamme" style="animation-duration:1.4s;transform-origin:140px 1000px"/>';
        s += '<rect fill="' + s2 + '" x="-20" y="500" width="320" height="24"/>';
        s += '<rect fill="' + s2 + '" x="330" y="450" width="140" height="8"/><path stroke="' + s2 + '" stroke-width="4" d="M370 458 v14 M430 458 v14"/>';
        s += b.figur("hut", 370, 500, 1.1, s2) + b.figur("hut", 430, 500, 1.1, s2);
        return s;
      },
      teilchen: [{ t: "staub", n: 12, farbe: ["#f0c890"] }, { t: "glut", n: 6, farbe: ["#ffa050"], zone: "rechts" }]
    },

    schmiede: {
      name: { de: "Die magische Schmiede", en: "The Magic Forge" },
      himmel: "radial-gradient(ellipse 45% 45% at 88% 62%, rgba(170,110,220,.26), transparent 70%), radial-gradient(ellipse 40% 40% at 10% 80%, rgba(230,160,80,.14), transparent 70%), linear-gradient(180deg, #0c0a10 0%, #120f17 55%, #15121a 100%)",
      farben: { fern: "#18141e", fern2: "#211b28", licht: "#c9a0f0" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#08070a", s1 = "#110e14";
        /* Grubengerüst über der Schlucht, Leiter, Spinnweben, Knochen */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 500 L60 520 L120 600 L160 760 L150 1010Z"/>';
        s += '<g stroke="' + s2 + '" stroke-width="10"><path d="M200 1010 V420 M380 1010 V460 M190 470 H400 M190 700 H400"/></g><path stroke="' + s2 + '" stroke-width="5" d="M210 480 L370 690 M370 480 L210 690"/>';
        s += '<g stroke="' + s2 + '" stroke-width="4"><path d="M440 1010 L470 640 M500 1010 L520 640"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(i => '<path d="M' + r1(442 + i * 3.8) + " " + (980 - i * 44) + " L" + r1(500 + i * 2.4) + " " + (980 - i * 44) + '"/>').join("") + "</g>";
        s += b.netz(200, 470, 120, "#d8d0e0", 0, Math.PI / 2) + b.netz(-10, 500, 150, "#d8d0e0", -Math.PI / 2, Math.PI / 2);
        s += '<g fill="' + s2 + '"><ellipse cx="300" cy="992" rx="40" ry="10"/><circle cx="280" cy="976" r="13"/><path d="M300 984 L360 970 L362 976 L302 990Z"/></g>';
        s += b.laterne(300, 520, "#f0b060", s2, 50);
        /* Stirges hängen von der Decke */
        [[120, 120], [420, 90], [300, 180]].forEach(([x, y]) => { s += '<g transform="translate(' + x + " " + y + ') scale(1.3) rotate(180)"><path fill="' + s2 + '" d="M0 0 C-6 -4 -10 -12 -8 -18 L-2 -14 L0 -20 L2 -14 L8 -18 C10 -12 6 -4 0 0 Z M0 -2 L0 14" stroke="' + s2 + '" stroke-width="1.5"/></g>'; });
        return s;
      },
      rechts(b) {
        const s2 = "#08070a", s1 = "#110e14";
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 220 C80 200 200 260 260 320 C320 380 360 500 380 1010Z"/>';
        /* Runenkreis an der Wand, der Amboss davor */
        s += b.licht(170, 560, 260, "#b080f0", .35, "kl-puls");
        s += '<circle cx="170" cy="560" r="130" fill="none" stroke="#c9a0f0" stroke-opacity=".35" stroke-width="2"/><circle cx="170" cy="560" r="102" fill="none" stroke="#c9a0f0" stroke-opacity=".22" stroke-width="1.4"/>';
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2, x = 170 + Math.cos(a) * 116, y = 560 + Math.sin(a) * 116;
          s += '<path d="M' + r1(x - 6) + " " + r1(y - 8) + " l6 16 l6 -16 M" + r1(x - 7) + " " + r1(y) + ' h14" stroke="#e0c0ff" stroke-width="2" fill="none" class="kl-rune" style="animation-delay:-' + r1(i * .7) + 's"/>';
        }
        s += b.licht(190, 900, 120, "#f0b060", .28, "kl-puls") + b.figur("amboss", 190, 990, 1.6, s2);
        s += '<rect fill="' + s2 + '" x="150" y="990" width="80" height="20"/>';
        s += b.fels(280, 1006, 220, 70, s2) + b.boden(998, s2, 3);
        return s;
      },
      teilchen: [{ t: "sporen", n: 14, farbe: ["#c9a0f0", "#f0c070"] }, { t: "staub", n: 8, farbe: ["#c8b8d0"] }]
    },

    neverwinter: {
      name: { de: "Die Straßen von Neverwinter", en: "The Streets of Neverwinter" },
      himmel: "radial-gradient(ellipse 60% 40% at 50% 92%, rgba(230,150,80,.2), transparent 70%), radial-gradient(ellipse 50% 40% at 85% 25%, rgba(190,140,170,.14), transparent 70%), linear-gradient(180deg, #120f18 0%, #1c1620 45%, #2a1e22 80%, #18130f 100%)",
      farben: { fern: "#271d25", fern2: "#312530", licht: "#f2b56a" },
      fern: (b, W, H, c) => FERN.stadt(b, W, H, c, { flach: true }),
      links(b) {
        const s2 = "#0c0a0d", s1 = "#161118";
        /* Fachwerkhäuser mit Überhang, Gasthofschild */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 250 L80 160 L190 250 L190 420 L210 420 L210 1010Z"/>';
        s += b.haus(-10, 1010, 250, 380, s2, { dach: 0, fenster: [[.15, .2, .16, .16], [.55, .2, .16, .16], [.15, .55, .16, .16]], licht: "#f2b56a" });
        s += '<path fill="' + s2 + '" d="M-20 630 L270 630 L270 600 L130 470 L-20 600Z"/>';
        s += '<path stroke="' + s1 + '" stroke-width="5" d="M10 720 L100 900 M100 720 L10 900 M140 720 L230 900"/>';
        s += b.rauch(60, 180, "#7a6a72", 4, 18);
        s += '<path stroke="' + s2 + '" stroke-width="6" d="M240 700 h80"/><g class="kl-pendel" style="animation-duration:7s;transform-origin:300px 704px"><path stroke="' + s2 + '" stroke-width="2" d="M282 704 v18 M318 704 v18"/><rect x="266" y="720" width="70" height="44" rx="4" fill="' + s2 + '"/><path stroke="#f2b56a" stroke-opacity=".55" stroke-width="3" fill="none" d="M280 752 v-16 h40 v16 M280 744 h40"/></g>';
        s += '<rect fill="' + s2 + '" x="420" y="760" width="10" height="250"/>' + b.laterne(425, 760, "#f2b56a", s2, 0);
        s += '<rect fill="' + s2 + '" x="-10" y="996" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#0c0a0d", s1 = "#161118";
        let s = b.turm(40, 1010, 120, 760, s1, { dach: true, fenster: [[.5, .2], [.5, .5]], licht: "#f2b56a" });
        s += '<path stroke="' + s1 + '" stroke-width="3" d="M100 120 v-60"/><path fill="#7a2a24" opacity=".75" d="M100 60 l46 10 l-46 12z" class="kl-wehen" style="animation-duration:4s;transform-origin:100px 70px"/>';
        /* Marktstand mit gestreifter Markise */
        s += '<g><path fill="' + s2 + '" d="M180 1010 V820 M180 820"/><rect fill="' + s2 + '" x="180" y="820" width="8" height="190"/><rect fill="' + s2 + '" x="400" y="820" width="8" height="190"/>' +
          '<path fill="#5a2a26" d="M170 820 L420 820 L404 770 L186 770Z" opacity=".9"/>' + [0, 1, 2, 3, 4].map(i => '<path fill="#3a1a1a" d="M' + (186 + i * 48) + " 770 l24 0 l2 50 l-28 0z" + '"/>').join("") +
          '<path fill="' + s2 + '" d="M180 920 L410 920 L410 960 L180 960Z"/><circle cx="230" cy="910" r="14" fill="' + s2 + '"/><circle cx="262" cy="912" r="12" fill="' + s2 + '"/><rect x="300" y="890" width="40" height="30" fill="' + s2 + '"/></g>';
        s += b.licht(300, 880, 70, "#f2b56a", .3);
        s += '<rect fill="' + s2 + '" x="-10" y="996" width="620" height="20"/>';
        return s;
      },
      teilchen: [{ t: "staub", n: 10, farbe: ["#f2c58a"] }, { t: "nebel", n: 2, farbe: ["#9a8890"] }]
    },

    allianz: {
      name: { de: "Die Halle der Allianz", en: "The Hall of the Alliance" },
      himmel: "linear-gradient(115deg, transparent 20%, rgba(240,200,120,.08) 30%, transparent 40%), radial-gradient(ellipse 45% 50% at 12% 35%, rgba(245,205,130,.22), transparent 70%), radial-gradient(ellipse 45% 50% at 90% 50%, rgba(170,60,50,.14), transparent 70%), linear-gradient(180deg, #15110f 0%, #1d1713 55%, #1a1410 100%)",
      farben: { fern: "#241c16", licht: "#f5d08a" },
      fern: (b, W, H, c) => FERN.halle(b, W, H, c),
      links(b) {
        const s2 = "#0d0a08", s1 = "#18120e";
        /* hohes Fenster mit Morgenlicht, Lichtstrahlen */
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="420" height="1010"/>';
        s += '<path fill="#3a2a1c" d="M90 620 L90 230 Q170 120 250 230 L250 620Z"/><path fill="#f5d08a" fill-opacity=".1" d="M90 620 L90 230 Q170 120 250 230 L250 620Z" class="kl-puls" style="animation-duration:9s"/>';
        s += '<path stroke="' + s1 + '" stroke-width="7" fill="none" d="M170 160 V620 M90 380 H250 M90 500 H250"/>';
        s += '<path fill="#f5d08a" opacity=".07" d="M90 620 L250 620 L620 1010 L330 1010Z" class="kl-strahl" style="animation-duration:11s"/><path fill="#f5d08a" opacity=".05" d="M150 300 L250 300 L620 820 L560 900Z" class="kl-strahl" style="animation-duration:14s;animation-delay:-5s"/>';
        s += '<rect fill="' + s2 + '" x="360" y="0" width="70" height="1010"/><rect fill="' + s2 + '" x="346" y="960" width="98" height="50"/><rect fill="' + s2 + '" x="346" y="40" width="98" height="30"/>';
        s += '<rect fill="' + s2 + '" x="-10" y="990" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#0d0a08", s1 = "#18120e";
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="400" height="1010"/>';
        /* Banner der Allianz */
        [[60, 140, 520], [220, 170, 480]].forEach(([x, y, h], i) => {
          s += '<g class="kl-wehen" opacity=".72" style="animation-duration:' + (9 + i * 2) + 's;transform-origin:' + (x + 50) + "px " + y + 'px"><path fill="#6a1e1a" d="M' + x + " " + y + " h100 v" + h + " l-50 -40 l-50 40z" + '"/><path fill="none" stroke="#d8a64a" stroke-opacity=".6" stroke-width="3" d="M' + (x + 8) + " " + (y + 8) + " h84 v" + (h - 14) + " l-42 -34 l-42 34z" + '"/>' +
            '<path fill="#d8a64a" opacity=".55" d="M' + (x + 30) + " " + (y + 120) + " l8 -24 l12 16 l12 -16 l8 24z M" + (x + 50) + " " + (y + 150) + " l18 30 l-18 30 l-18 -30z" + '"/></g>';
          s += '<rect fill="' + s2 + '" x="' + (x - 10) + '" y="' + (y - 8) + '" width="120" height="10"/>';
        });
        s += '<rect fill="' + s2 + '" x="390" y="0" width="70" height="1010"/><rect fill="' + s2 + '" x="376" y="960" width="98" height="50"/>';
        s += '<path fill="' + s2 + '" d="M140 800 C140 760 230 760 230 800 L230 880 C230 930 185 950 185 950 C185 950 140 930 140 880Z"/>';
        s += '<rect fill="' + s2 + '" x="-10" y="990" width="620" height="20"/>';
        return s;
      },
      teilchen: [{ t: "staub", n: 22, farbe: ["#f5d690"], zone: "links" }]
    },

    donnerbaum: {
      name: { de: "Donnerbaum", en: "Thundertree" },
      himmel: "radial-gradient(ellipse 70% 40% at 50% 85%, rgba(150,160,130,.14), transparent 70%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(170,160,180,.1), transparent 70%), linear-gradient(180deg, #111211 0%, #171a17 55%, #181a16 100%)",
      farben: { fern: "#1e211d", fern2: "#272b25", licht: "#a0a080" },
      fern: (b, W, H, c) => FERN.dorf(b, W, H, c, { ruine: true }),
      links(b) {
        const s2 = "#0a0b0a", s1 = "#131512";
        let s = b.toterBaum(120, 1000, 900, s1) + b.toterBaum(330, 1000, 600, s2);
        s += b.haus(180, 1004, 210, 170, s2, { dach: 0 }) + '<path fill="' + s2 + '" d="M170 834 L230 760 L260 800 L300 770 L400 834Z"/><path fill="#050505" d="M220 1004 v-70 h40 v70z M300 900 h36 v40 h-36z"/>';
        s += '<path stroke="' + s2 + '" stroke-width="5" d="M-10 960 L170 940 M20 930 V1000 M70 926 L66 1000 M120 940 L130 1000"/>';
        s += '<path fill="#3c4a2c" opacity=".55" d="M180 1004 q30 -20 60 -6 q30 -16 60 2 q40 -14 90 4z"/>';
        /* Krähen */
        s += '<path fill="' + s2 + '" d="M196 520 c6 -10 18 -10 22 -2 l10 -2 l-8 6 c2 8 -6 12 -16 12 l-4 8 l-2 -8 c-6 -2 -6 -8 -2 -14z"/>';
        s += b.boden(995, s2, 6);
        return s;
      },
      rechts(b) {
        const s2 = "#0a0b0a", s1 = "#131512";
        /* der große, halb verfallene Wachturm mit Moos */
        let s = b.turm(60, 1010, 210, 800, s1, { ruine: true });
        s += '<path fill="#050605" d="M150 1010 V900 Q165 870 180 900 V1010Z M140 500 h20 v50 h-20z M190 330 h16 v40 h-16z"/>';
        s += '<path fill="#3c4a2c" opacity=".6" d="M70 1010 q10 -120 -4 -260 q20 80 30 260z M220 1010 q10 -200 30 -300 q-6 160 -10 300z M90 260 q30 20 80 0 q-20 40 -80 20z"/>';
        s += b.toterBaum(400, 1006, 520, s2) + b.busch(330, 1008, 120, s2);
        s += b.boden(998, s2, 6);
        return s;
      },
      teilchen: [{ t: "nebel", n: 5, farbe: ["#9aa088"] }, { t: "blatt", n: 5, farbe: ["#5a5030", "#4a4a2a"] }]
    },

    drachenturm: {
      name: { de: "Der Turm von Donnerbaum", en: "The Tower of Thundertree" },
      himmel: "radial-gradient(ellipse 60% 45% at 80% 40%, rgba(110,190,90,.2), transparent 70%), radial-gradient(ellipse 50% 40% at 15% 70%, rgba(130,180,90,.14), transparent 70%), linear-gradient(180deg, #0e120d 0%, #141a12 55%, #121610 100%)",
      farben: { fern: "#18201a", fern2: "#202a1f", licht: "#9ad070" },
      fern: (b, W, H, c) => FERN.wald(b, W, H, c, { gift: "#7ac060" }),
      links(b) {
        const s2 = "#080a07", s1 = "#11150f";
        /* Plattform des Turms: Zinnen, Treppe */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 760 L520 780 L520 1010Z"/>';
        for (let x = -10; x < 520; x += 70) s += '<rect fill="' + s1 + '" x="' + x + '" y="700" width="40" height="70"/>';
        s += '<path fill="' + s2 + '" d="M-10 1010 L-10 860 L400 880 L520 1010Z"/>';
        s += b.licht(260, 640, 240, "#8ad060", .22, "kl-puls");
        s += '<path fill="' + s2 + '" d="M300 860 l40 -10 l30 14 l-60 6z M120 870 l20 -14 l40 10z"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#080a07";
        /* der Venomfang kreist */
        let s = '<g class="kl-drachenflug" style="animation-duration:26s"><g transform="translate(250 400) scale(1.15)"><path fill="#0b0f0a" d="' + FIGUREN.dracheFluegel2 + '" class="kl-fluegel" style="animation-delay:-.2s"/><path fill="' + s2 + '" d="' + FIGUREN.drache + '"/><path fill="' + s2 + '" d="' + FIGUREN.dracheFluegel + '" class="kl-fluegel"/></g></g>';
        s += b.licht(240, 700, 220, "#8ad060", .2, "kl-puls");
        s += b.tanne(120, 1010, 380, "#0f140e") + b.tanne(300, 1010, 300, s2) + b.tanne(440, 1020, 340, "#0f140e") + b.tanne(10, 1020, 460, s2);
        return s;
      },
      teilchen: [{ t: "gift", n: 16 }, { t: "nebel", n: 4, farbe: ["#7ab060"] }]
    },

    geisterdorf: {
      name: { de: "Das verlassene Dorf", en: "The Abandoned Village" },
      himmel: "radial-gradient(ellipse 50% 45% at 86% 82%, rgba(240,110,40,.26), transparent 70%), radial-gradient(ellipse 50% 40% at 12% 60%, rgba(150,170,110,.12), transparent 70%), linear-gradient(180deg, #110f0e 0%, #19150f 55%, #22170f 100%)",
      farben: { fern: "#211b16", fern2: "#2a221b", licht: "#f09040" },
      fern: (b, W, H, c) => FERN.dorf(b, W, H, c, { ruine: true }),
      links(b) {
        const s2 = "#0b0908", s1 = "#151210";
        let s = b.toterBaum(60, 1000, 760, s1);
        s += b.haus(220, 1004, 220, 190, s1, { dach: 110, fenster: [[.6, .4, .14, .2]], licht: "#d0e080" });
        s += '<path fill="' + s1 + '" d="M250 820 l-10 -50 l14 0 l6 40z M260 790 q-10 -30 6 -50 M280 800 q10 -20 0 -40" stroke="' + s1 + '" stroke-width="3"/>';
        s += '<path fill="#5a7a3a" opacity=".5" d="M300 960 q-10 -40 4 -60 q12 30 8 60z M340 960 q-6 -50 8 -66 q10 34 4 66z"/>';
        /* Ezekiels Onkel als Statue */
        s += b.figur("statue", 130, 1000, 1.5, s1);
        /* Zombies schlurfen */
        s += '<g class="kl-schlurfen" style="animation-duration:7s">' + b.figur("zombie", 360, 1004, 1.05, s2) + "</g>";
        s += '<g class="kl-schlurfen" style="animation-duration:8.5s;animation-delay:-3s">' + b.figur("zombie", 470, 1008, .9, s2) + "</g>";
        s += b.boden(995, s2, 5);
        return s;
      },
      rechts(b) {
        const s2 = "#0b0908", s1 = "#151210";
        /* brennende Ruine (Echos Feuerball), Blights mit rubinroten Augen */
        let s = b.licht(220, 780, 260, "#ff7a2a", .35, "kl-glut");
        s += b.haus(60, 1004, 300, 260, s1, { dach: 0 }) + '<path fill="' + s1 + '" d="M50 744 L120 640 L150 700 L210 610 L250 690 L300 650 L370 744Z"/>';
        s += '<path fill="#ff8a3a" opacity=".28" d="M120 744 q10 -60 30 -70 q-4 40 20 30 q-4 -40 30 -70 q10 50 30 60 q6 -30 30 -40 q-6 50 20 90z" class="kl-flamme" style="animation-duration:1.6s;transform-origin:200px 744px"/>';
        s += '<path fill="#050403" d="M150 1004 v-90 h60 v90z"/>';
        s += b.rauch(210, 600, "#6a5a50", 6, 40);
        [[420, 1004, 1.5], [500, 1010, 1.2], [70, 1010, 1.25]].forEach(([x, y, g], i) => {
          s += '<g class="kl-schlurfen" style="animation-duration:' + (5 + i) + "s;animation-delay:-" + i * 2 + 's">' + b.figur("blight", x, y, g, s2) +
            '<circle cx="' + r1(x - 3 * g) + '" cy="' + r1(y - 72 * g) + '" r="' + r1(2 * g) + '" fill="#e0304a"/><circle cx="' + r1(x + 5 * g) + '" cy="' + r1(y - 72 * g) + '" r="' + r1(2 * g) + '" fill="#e0304a"/>' + b.licht(x + 1, y - 72 * g, 16 * g, "#e0304a", .45, "kl-puls") + "</g>";
        });
        s += b.boden(998, s2, 5);
        return s;
      },
      teilchen: [{ t: "asche", n: 16 }, { t: "glut", n: 10, farbe: ["#ff8a3a", "#ffb060"], zone: "rechts" }, { t: "nebel", n: 2, farbe: ["#7a6a5a"] }]
    },

    /* ---------------- Kapitel II ---------------- */
    kraeuternebel: {
      name: { de: "Ein Haus am Waldrand", en: "A House by the Woods" },
      himmel: "radial-gradient(ellipse 60% 55% at 70% 50%, rgba(170,120,200,.24), transparent 70%), radial-gradient(ellipse 50% 50% at 20% 70%, rgba(140,190,120,.18), transparent 70%), linear-gradient(180deg, #120f16 0%, #18141c 60%, #161319 100%)",
      farben: { fern: "#1e1822", licht: "#c8a0e0" },
      fern: (b, W, H, c) => FERN.innen(b, W, H, c),
      links(b) {
        const s2 = "#0a080c", s1 = "#141118";
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="360" height="1010"/>';
        for (let i = 0; i < 7; i++) {
          const x = 20 + i * 48, l = b.z(60, 110);
          s += '<g class="kl-pendel" style="animation-duration:' + r1(b.z(7, 11)) + "s;animation-delay:-" + r1(b.z(0, 8)) + "s;transform-origin:" + x + 'px 120px"><path stroke="' + s2 + '" stroke-width="2" d="M' + x + " 120 v" + r1(l * .4) + '"/><path fill="' + (i % 2 ? "#2a3a22" : s2) + '" d="M' + (x - 14) + " " + r1(120 + l * .4) + " q14 -10 28 0 q-4 " + r1(l * .6) + " -14 " + r1(l * .8) + " q-10 -" + r1(l * .2) + " -14 -" + r1(l * .8) + 'z"/></g>';
        }
        s += '<rect fill="' + s2 + '" x="-10" y="110" width="380" height="12"/><rect fill="' + s2 + '" x="-10" y="520" width="380" height="12"/>';
        [["#9ad070", 40], ["#c8a0e0", 110], ["#d0a050", 190], ["#9ad070", 260]].forEach(([c, x]) => { s += b.licht(x, 490, 46, c, .3, "kl-puls") + '<rect x="' + (x - 12) + '" y="470" width="24" height="50" rx="6" fill="' + c + '" opacity=".3" stroke="' + s2 + '" stroke-width="3"/>'; });
        s += b.figur("fuchs", 320, 520, 1.6, s2);
        /* der köchelnde Topf */
        s += b.licht(200, 960, 120, "#ff9a40", .4, "kl-glut") + '<path fill="' + s2 + '" d="M130 890 h140 q0 70 -70 76 q-70 -6 -70 -76z"/><path stroke="' + s2 + '" stroke-width="4" d="M150 1000 L170 960 M250 1000 L230 960"/>';
        s += b.rauch(200, 880, "#b090c8", 6, 30);
        return s;
      },
      rechts(b) {
        const s2 = "#0a080c";
        let s = "";
        /* der süßliche, giftige Dampf wogt */
        for (let i = 0; i < 7; i++) s += '<ellipse cx="' + r1(b.z(0, 500)) + '" cy="' + r1(b.z(300, 950)) + '" rx="' + r1(b.z(120, 220)) + '" ry="' + r1(b.z(50, 90)) + '" fill="' + b.glow(i % 2 ? "#b090d0" : "#90c080", .35) + '" class="kl-wogen" style="animation-duration:' + r1(b.z(14, 22)) + "s;animation-delay:-" + r1(b.z(0, 20)) + 's"/>';
        s += '<rect fill="' + s2 + '" x="-10" y="600" width="70" height="410"/><path fill="' + s2 + '" d="M-10 1010 L-10 940 L420 960 L520 1010Z"/>';
        return s;
      },
      teilchen: [{ t: "nebel", n: 7, farbe: ["#b090d0", "#90c080"] }, { t: "sporen", n: 10, farbe: ["#c8a0e0", "#a0d080"] }]
    },

    kerker: {
      name: { de: "Der Kerker", en: "The Dungeon" },
      himmel: "radial-gradient(ellipse 40% 45% at 85% 50%, rgba(170,110,210,.2), transparent 70%), radial-gradient(ellipse 35% 40% at 12% 55%, rgba(240,140,60,.18), transparent 70%), linear-gradient(180deg, #0c0a0e 0%, #121016 55%, #131116 100%)",
      farben: { fern: "#18151c", fern2: "#201c26", licht: "#c9a0f0" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#070609", s1 = "#100e13";
        /* Zellengitter, Ketten, Fackel davor */
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="480" height="1010"/>';
        s += '<rect fill="#060508" x="40" y="300" width="380" height="700"/>';
        for (let x = 60; x <= 400; x += 38) s += '<rect fill="' + s2 + '" x="' + x + '" y="290" width="9" height="720"/>';
        s += '<rect fill="' + s2 + '" x="30" y="290" width="400" height="16"/><rect fill="' + s2 + '" x="30" y="560" width="400" height="10"/>';
        s += '<path fill="none" stroke="' + s2 + '" stroke-width="5" stroke-dasharray="9 5" d="M120 310 Q130 420 150 480 M300 310 Q290 400 300 470"/>';
        s += '<g fill="none" stroke="' + s2 + '" stroke-width="6"><circle cx="152" cy="490" r="12"/><circle cx="300" cy="480" r="12"/></g>';
        s += b.fackel(480, 520, "#ff9a40", s2, 1.3);
        /* Echo als Ratte huscht vorbei */
        s += '<g class="kl-huschen" style="animation-duration:19s;animation-delay:-6s">' + b.figur("ratte", 0, 998, 1.1, s2) + "</g>";
        s += '<rect fill="' + s2 + '" x="-10" y="996" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#070609", s1 = "#100e13";
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 120 C100 110 220 160 300 240 L360 1010Z"/>';
        /* in der Ferne rauscht der Fluss */
        s += '<rect x="380" y="200" width="70" height="810" fill="' + b.verlauf([[0, "#3a6a64", 0], [.5, "#3a6a64", .22], [1, "#3a6a64", .05]]) + '" class="kl-rauschen"/>';
        /* Drow-Lichter */
        s += b.laterne(180, 420, "#c9a0f0", s2, 60) + b.laterne(80, 600, "#c9a0f0", s2, 40);
        s += '<path fill="' + s2 + '" d="M-10 1010 L-10 900 L200 920 L300 1010Z"/>';
        return s;
      },
      teilchen: [{ t: "tropfen", n: 8 }, { t: "staub", n: 8, farbe: ["#c8b8d8"] }]
    },

    ausbruch: {
      name: { de: "Ilvaras Feste", en: "Ilvara's Fortress" },
      himmel: "radial-gradient(ellipse 45% 40% at 85% 30%, rgba(200,70,60,.2), transparent 70%), radial-gradient(ellipse 40% 45% at 12% 60%, rgba(170,110,220,.22), transparent 70%), linear-gradient(180deg, #0c0a0f 0%, #130f17 55%, #120f14 100%)",
      farben: { fern: "#19141e", fern2: "#211a28", licht: "#c9a0f0", wasser: "#2a6a60" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c, { fluss: true }),
      decke: true,
      links(b) {
        const s2 = "#070609", s1 = "#100d13";
        /* Turm der Feste mit Geländer über dem Abgrund, Spinnenstatue */
        let s = b.turm(-10, 1010, 200, 760, s1, { fenster: [[.5, .25], [.5, .5]], licht: "#c9a0f0" });
        s += '<path fill="' + s2 + '" d="M180 720 L520 720 L520 736 L180 736Z"/>' + [200, 250, 300, 350, 400, 450, 500].map(x => '<rect fill="' + s2 + '" x="' + x + '" y="660" width="5" height="62"/>').join("") + '<rect fill="' + s2 + '" x="180" y="656" width="340" height="8"/>';
        s += '<rect fill="' + s2 + '" x="300" y="600" width="80" height="56"/>' + b.spinne(340, 560, 2.3, s2, 0, s2).replace('class="kl-faden"', 'class=""');
        s += b.laterne(250, 520, "#c9a0f0", s2, 80) + b.laterne(460, 560, "#c9a0f0", s2, 60);
        s += '<path fill="' + s2 + '" d="M180 736 L240 1010 L-10 1010Z"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#070609";
        /* die Chasme surrt, der Vrock kreist */
        let s = '<g class="kl-surren" style="animation-duration:7s"><g transform="translate(220 520) scale(2.1)"><path fill="' + s2 + '" d="' + FIGUREN.wespe + '" stroke="' + s2 + '" stroke-width="2"/><path fill="#c8b8d0" opacity=".22" d="' + FIGUREN.wespeFluegel + '" class="kl-schwirren"/></g></g>';
        s += '<g class="kl-kreisen" style="animation-duration:30s;animation-delay:-8s"><g transform="translate(300 220) scale(1.3)"><path fill="' + s2 + '" d="' + FIGUREN.geier + '"/></g></g>';
        s += b.licht(200, 900, 160, "#d06040", .2, "kl-glut");
        s += '<path fill="' + s2 + '" d="M-10 1010 L-10 880 L80 860 L160 900 L300 880 L420 940 L460 1010Z"/><path fill="' + s2 + '" d="M100 880 l60 -40 l8 10 l-50 34z M260 884 l20 -30 l50 20 l-10 14z"/>';
        return s;
      },
      teilchen: [{ t: "sporen", n: 10, farbe: ["#c9a0f0"] }, { t: "staub", n: 8, farbe: ["#d8c0c8"] }, { t: "tropfen", n: 3 }]
    },

    spinnweben: {
      name: { de: "Die Spinnweben des Unterreichs", en: "The Webs of the Underdark" },
      himmel: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(190,180,210,.1), transparent 70%), radial-gradient(ellipse 40% 40% at 88% 30%, rgba(150,120,190,.14), transparent 70%), linear-gradient(180deg, #0b0a0e 0%, #100e14 55%, #08070a 100%)",
      farben: { fern: "#17141c", fern2: "#1e1a24", licht: "#d8d0e8" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H * .7, c) + '<rect x="0" y="' + r1(H * .7) + '" width="' + W + '" height="' + r1(H * .3) + '" fill="#050407"/>',
      decke: true,
      links(b) {
        const s2 = "#070609", s1 = "#100e14";
        let s = '<path fill="' + s1 + '" d="M-10 0 L120 0 C140 200 90 400 130 560 C150 680 110 860 140 1010 L-10 1010Z"/>';
        s += b.netz(120, 420, 300, "#e0d8ec", -Math.PI * .45, Math.PI * .45) + b.netz(130, 820, 200, "#e0d8ec", -Math.PI * .4, Math.PI * .3);
        s += b.kokon(330, 520, 1.5, "#1a1720", 160) + b.kokon(450, 700, 1.1, "#15131a", 200);
        s += b.spinne(250, 300, 1.6, s2, 300, "#d8d0e8");
        return s;
      },
      rechts(b) {
        const s2 = "#070609", s1 = "#100e14";
        let s = '<path fill="' + s1 + '" d="M-10 0 L80 0 C110 300 70 500 100 1010 L-10 1010Z"/><path fill="' + s1 + '" d="M80 760 L260 740 L280 790 L80 810Z"/>';
        /* Netzbrücken über die Schlucht */
        s += '<path fill="none" stroke="#e0d8ec" stroke-opacity=".4" stroke-width="1.6" d="M90 500 Q330 600 620 520 M90 520 Q330 640 620 560 M90 760 Q340 860 620 800"/>';
        for (let i = 0; i < 12; i++) { const x = 110 + i * 44; s += '<path stroke="#e0d8ec" stroke-opacity=".25" stroke-width="1" d="M' + x + " " + r1(520 + Math.sin(i / 11 * Math.PI) * 80) + " L" + (x + 10) + " " + r1(560 + Math.sin(i / 11 * Math.PI) * 90) + '"/>'; }
        s += b.kokon(300, 700, 1.2, "#16131a", 140);
        s += b.spinne(420, 380, 1.3, s2, 380, "#d8d0e8") + b.spinne(200, 260, 1, s2, 260, "#d8d0e8");
        return s;
      },
      teilchen: [{ t: "glitzer", n: 14, farbe: ["#ece6f4"] }, { t: "sporen", n: 8, farbe: ["#b8a8d0"] }]
    },

    pilzgrab: {
      name: { de: "Das Grab der Magierin", en: "The Wizard's Tomb" },
      himmel: "radial-gradient(ellipse 40% 45% at 88% 70%, rgba(250,190,100,.24), transparent 70%), radial-gradient(ellipse 50% 50% at 10% 70%, rgba(120,210,170,.16), transparent 70%), radial-gradient(ellipse 50% 40% at 40% 20%, rgba(170,120,210,.12), transparent 70%), linear-gradient(180deg, #0b0c0f 0%, #10121a 30%, #131216 100%)",
      farben: { fern: "#16161c", fern2: "#1d1c24", licht: "#7ad0b0", licht2: "#d0a0f0" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c, { pilze: true }),
      decke: true,
      links(b) {
        const s2 = "#070709", s1 = "#0f0f14";
        let s = b.pilz(120, 1000, 3.6, s1, "#7ad0b0", .32) + b.pilz(330, 1000, 2.2, s2, "#d0a0f0", .34) + b.pilz(460, 1004, 1.4, s2, "#f0c070", .4) + b.pilz(30, 1010, 1.8, s2, "#f0c070", .36);
        /* funkelnder Bach */
        s += '<path d="M-10 960 Q120 930 240 970 T520 960" stroke="#7ad0b0" stroke-opacity=".35" stroke-width="10" fill="none" class="kl-glanz" style="animation-duration:6s"/>';
        s += b.boden(990, s2, 5);
        return s;
      },
      rechts(b) {
        const s2 = "#070709", s1 = "#0f0f14";
        /* Häuser hängen in Netzen über dem Abgrund, das Grab leuchtet wie ein Sonnenaufgang (Dawnbringer) */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 560 L220 570 L260 1010Z"/>';
        s += b.licht(110, 760, 230, "#f8c070", .45, "kl-puls") + '<path fill="#f8c070" fill-opacity=".2" d="M60 1010 L60 760 Q110 690 160 760 L160 1010Z" class="kl-puls" style="animation-duration:8s"/>';
        s += '<path fill="' + s1 + '" d="M40 760 L180 760 L180 740 Q110 650 40 740Z"/>';
        s += '<g class="kl-pendel" style="animation-duration:12s;transform-origin:420px 200px"><path stroke="#e0d8ec" stroke-opacity=".35" d="M420 200 L380 400 M420 200 L470 400 M330 240 L380 400 M520 230 L470 400"/>' + b.haus(370, 470, 110, 70, s2, { dach: 50, fenster: [[.4, .3, .2, .3]], licht: "#d0a0f0" }) + "</g>";
        s += b.pilz(300, 1004, 1.6, s2, "#d0a0f0", .36);
        return s;
      },
      teilchen: [{ t: "sporen", n: 18, farbe: ["#7ad0b0", "#d0a0f0", "#f0c070"] }, { t: "kaefer", n: 6, farbe: ["#c0f0a0"] }]
    },

    see: {
      name: { de: "Der unterirdische See", en: "The Underground Lake" },
      himmel: "radial-gradient(ellipse 60% 40% at 50% 85%, rgba(70,170,150,.16), transparent 70%), radial-gradient(ellipse 40% 40% at 88% 60%, rgba(150,220,170,.12), transparent 70%), linear-gradient(180deg, #0a0c0d 0%, #0e1213 55%, #0a0f0e 100%)",
      farben: { fern: "#131a1a", fern2: "#1a2222", licht: "#8ad0b8", wasser: "#1d4a44", glanz: "#9ae0c8" },
      fern: (b, W, H, c) => FERN.see(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#060808", s1 = "#0d1212";
        let s = b.wasser(880, "#173c37", "#060909", "rgba(150,224,200,.35)");
        s += b.fels(-20, 920, 300, 140, s1) + b.fels(180, 940, 200, 80, s2);
        s += b.figur("kuotoa", 120, 900, 1.6, s2) + b.augen(118, 746, 11, "#b8f0d0", 2) + b.figur("kuotoa", 250, 920, 1.25, s2, "", true);
        s += b.pilz(40, 905, 1.2, s2, "#8ad0b8", .35);
        return s;
      },
      rechts(b) {
        const s2 = "#060808", s1 = "#0d1212";
        let s = b.wasser(860, "#173c37", "#060909", "rgba(150,224,200,.3)");
        /* Pfahlstadt der Kuo-Toa mit leuchtenden Kuppeln */
        s += '<path stroke="' + s1 + '" stroke-width="6" d="M40 900 V760 M120 900 V760 M200 900 V780 M280 900 V780 M360 900 V800"/>';
        s += '<rect fill="' + s1 + '" x="20" y="752" width="370" height="12"/>';
        [[70, 752, 60, "#8ad0b8"], [180, 752, 46, "#d0e0a0"], [300, 752, 54, "#8ad0b8"]].forEach(([x, y, r, c]) => {
          s += '<path fill="' + s1 + '" d="M' + (x - r) + " " + y + " A" + r + " " + r * 1.1 + " 0 0 1 " + (x + r) + " " + y + 'Z"/>' + b.licht(x, y - r * .4, r * 1.2, c, .3, "kl-puls") +
            '<circle cx="' + x + '" cy="' + r1(y - r * .45) + '" r="5" fill="' + c + '" opacity=".75"/>';
        });
        s += '<path stroke="' + s1 + '" stroke-width="5" d="M180 700 V640 M175 650 L185 640 M185 650 L175 640"/>';
        return s;
      },
      teilchen: [{ t: "sporen", n: 12, farbe: ["#8ad0b8", "#d0e0a0"] }, { t: "nebel", n: 3, farbe: ["#5a8a80"] }, { t: "blasen", n: 6, farbe: ["#9ae0c8"] }]
    },

    demogorgon: {
      name: { de: "Am Seeufer", en: "On the Lakeshore" },
      himmel: "radial-gradient(ellipse 50% 45% at 78% 45%, rgba(200,60,80,.22), transparent 70%), radial-gradient(ellipse 45% 40% at 15% 40%, rgba(160,70,170,.16), transparent 70%), linear-gradient(180deg, #0e090d 0%, #160e14 55%, #0e0c0e 100%)",
      farben: { fern: "#1a1218", fern2: "#22161e", licht: "#e06070", wasser: "#22403c", glanz: "#d8a0a8" },
      fern: (b, W, H, c) => FERN.see(b, W, H, c, { wild: true }),
      decke: true,
      links(b) {
        const s2 = "#080507", s1 = "#120c10";
        let s = b.wasser(840, "#1d3532", "#070708", "rgba(216,160,168,.35)");
        /* die Stadt versinkt */
        s += '<g transform="rotate(-9 140 900)">' + b.turm(80, 900, 90, 380, s1, { ruine: true }) + "</g>" + '<g transform="rotate(12 300 900)">' + b.haus(250, 900, 120, 120, s1, { dach: 0 }) + "</g>";
        s += b.licht(160, 600, 160, "#d04050", .25, "kl-glut");
        /* das Boot mit den Gefährten entkommt */
        s += '<g class="kl-wipp" style="animation-duration:4s;transform-origin:380px 900px">' + b.figur("boot", 380, 905, 1.3, s2) + "</g>";
        return s;
      },
      rechts(b) {
        const s2 = "#080507";
        let s = '<g class="kl-atmen" style="animation-duration:9s;transform-origin:300px 860px">' + b.schatten("vorschau/klein/demogorgon.webp", -60, 300, 700, 593, "#150a10", .75) + "</g>";
        s += b.licht(300, 520, 260, "#c03050", .22, "kl-puls");
        const tent = (x, h, w, d) => '<g class="kl-tentakel" style="animation-duration:' + d + "s;transform-origin:" + x + 'px 900px"><path fill="' + s2 + '" d="M' + (x - w) + " 910 C" + (x - w) + " " + (900 - h * .4) + " " + (x + w * 2) + " " + (900 - h * .6) + " " + (x + w * .3) + " " + (900 - h) + " C" + (x + w * 2.4) + " " + (900 - h * .62) + " " + (x + w) + " " + (900 - h * .4) + " " + (x + w) + ' 910Z"/></g>';
        s += tent(90, 560, 26, 7) + tent(420, 420, 20, 9) + tent(250, 300, 16, 6);
        s += b.wasser(860, "#1d3532", "#070708", "rgba(216,160,168,.4)");
        return s;
      },
      teilchen: [{ t: "tropfen", n: 6 }, { t: "nebel", n: 4, farbe: ["#8a4a5a"] }, { t: "glut", n: 6, farbe: ["#e06070"] }]
    },

    gracklstugh: {
      name: { de: "Gracklstugh", en: "Gracklstugh" },
      himmel: "radial-gradient(ellipse 60% 45% at 50% 90%, rgba(240,120,40,.24), transparent 70%), radial-gradient(ellipse 40% 40% at 88% 50%, rgba(240,150,60,.16), transparent 70%), linear-gradient(180deg, #0d0a0a 0%, #160f0d 50%, #1d120c 100%)",
      farben: { fern: "#1d1411", fern2: "#261a15", licht: "#ff9a40" },
      fern: (b, W, H, c) => FERN.festung(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#090606", s1 = "#130d0b";
        /* Stadtmauer mit Tor, Wachen mit Speeren, Feuerschalen */
        let s = '<rect fill="' + s1 + '" x="-10" y="560" width="520" height="450"/>';
        for (let x = -10; x < 510; x += 50) s += '<rect fill="' + s1 + '" x="' + x + '" y="530" width="30" height="34"/>';
        s += b.turm(-20, 1010, 150, 620, s2, { fenster: [[.5, .3], [.5, .55]], licht: "#ff9a40" });
        s += '<path fill="#050303" d="M220 1010 V800 Q290 720 360 800 V1010Z"/>' + b.licht(290, 900, 90, "#ff8a30", .3, "kl-glut");
        s += b.figur("zwergHelm", 190, 1004, 1.25, s2) + b.figur("zwergHelm", 400, 1004, 1.25, s2, "", true);
        s += '<path fill="' + s2 + '" d="M150 820 h30 l-6 20 h-18z"/>' + b.licht(165, 800, 70, "#ff9a40", .45, "kl-glut") + '<path fill="#ff9a40" opacity=".8" d="M154 820 q4 -26 12 -30 q2 16 8 6 q4 14 0 24z" class="kl-flamme" style="animation-duration:1.2s;transform-origin:165px 820px"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#090606", s1 = "#130d0b";
        /* in den Fels gehauene Feste, Schmiedeschlote mit Funken */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 0 L260 0 C300 200 280 400 330 600 L360 1010Z"/>';
        [[60, 200], [160, 340], [80, 480], [200, 620]].forEach(([x, y]) => { s += '<path fill="#ff9a40" fill-opacity=".4" d="M' + x + " " + (y + 40) + " v-26 q12 -16 24 0 v26z" + '"' + b.anim("kl-fenster", b.z(6, 12)) + "/>" + b.licht(x + 12, y + 26, 50, "#ff9a40", .3); });
        s += '<path fill="' + s2 + '" d="M300 1010 L300 640 L340 640 L340 1010Z M420 1010 L420 720 L456 720 L456 1010Z"/>';
        s += b.licht(320, 640, 90, "#ff8a30", .45, "kl-glut") + b.licht(438, 720, 80, "#ff8a30", .4, "kl-glut");
        s += b.rauch(320, 620, "#5a4a44", 5, 26) + b.rauch(438, 700, "#5a4a44", 4, 22);
        s += '<path fill="' + s2 + '" d="M200 1010 L200 880 L520 880 L520 1010Z"/>' + b.licht(360, 900, 140, "#ff7a2a", .3, "kl-glut");
        return s;
      },
      teilchen: [{ t: "funken", n: 16 }, { t: "asche", n: 10, farbe: ["#5a4a44", "#3a3230"] }]
    },

    schenke: {
      name: { de: "Eine Schenke in Gracklstugh", en: "A Tavern in Gracklstugh" },
      himmel: "radial-gradient(ellipse 60% 50% at 50% 70%, rgba(240,150,70,.2), transparent 70%), radial-gradient(ellipse 40% 40% at 12% 30%, rgba(240,170,90,.14), transparent 70%), linear-gradient(180deg, #110c0a 0%, #19120e 55%, #1b130d 100%)",
      farben: { fern: "#22180f", licht: "#f2b56a" },
      fern: (b, W, H, c) => FERN.innen(b, W, H, c),
      gestalten: "wachen",
      links(b) {
        const s2 = "#0b0806", s1 = "#16100b";
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 0 L460 0 L460 120 Q300 140 230 300 L230 1010Z"/>';
        s += b.laterne(330, 280, "#f2b56a", s2, 120) + b.laterne(130, 360, "#f2b56a", s2, 0);
        /* langer Tisch mit Krügen */
        s += '<path fill="' + s2 + '" d="M-10 860 L520 860 L520 880 L-10 880Z M20 880 v130 h16 v-130z M460 880 v130 h16 v-130z"/>';
        [60, 140, 300, 400].forEach(x => { s += '<path fill="' + s2 + '" d="M' + x + " 860 v-34 h24 v34z M" + (x + 24) + ' 834 q12 0 12 12 q0 10 -12 10" stroke="' + s2 + '" stroke-width="4" fill="none"/>'; });
        s += '<ellipse cx="220" cy="852" rx="40" ry="10" fill="' + s2 + '"/>';
        return s;
      },
      rechts(b, o) {
        const s2 = "#0b0806", s1 = "#16100b";
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="200" height="1010"/>';
        s += '<g fill="' + s2 + '"><ellipse cx="60" cy="760" rx="60" ry="80"/><ellipse cx="60" cy="920" rx="60" ry="80"/></g><path stroke="#f2b56a" stroke-opacity=".3" stroke-width="3" d="M10 760 h100 M10 920 h100"/>';
        if ((o || {}).gestalten === "rotroben") {
          s += b.licht(320, 860, 160, "#d04a2a", .22, "kl-puls") + b.figur("robe", 280, 1004, 1.75, "#3a1210") + b.figur("robe", 380, 1008, 1.6, "#2e0f0e");
        } else {
          [230, 300, 370, 440].forEach((x, i) => { s += b.figur("zwergHelm", x, 1004 + i * 2, 1.15, s2, "", i % 2 === 1); });
        }
        s += '<rect fill="' + s2 + '" x="-10" y="1000" width="620" height="20"/>';
        return s;
      },
      teilchen: [{ t: "staub", n: 12, farbe: ["#f0c890"] }, { t: "nebel", n: 2, farbe: ["#7a6458"] }]
    },

    thronsaal: {
      name: { de: "Am Hof von König Horga", en: "At the Court of King Horga" },
      himmel: "radial-gradient(ellipse 70% 30% at 50% 100%, rgba(250,100,30,.3), transparent 70%), radial-gradient(ellipse 40% 50% at 88% 45%, rgba(220,90,40,.16), transparent 70%), linear-gradient(180deg, #0f0909 0%, #170d0b 55%, #210f09 100%)",
      farben: { fern: "#1f120e", licht: "#ff8a30" },
      fern: (b, W, H, c) => FERN.halle(b, W, H, c, { lava: true }),
      links(b) {
        const s2 = "#090505", s1 = "#140b09";
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="160" height="1010"/><rect fill="' + s1 + '" x="-24" y="0" width="190" height="40"/><rect fill="' + s1 + '" x="-24" y="960" width="190" height="50"/>';
        /* Fenster ohne Himmel – nur Fels. Echo sitzt jeden Morgen davor. */
        s += '<path fill="' + s1 + '" d="M220 520 L220 300 Q300 200 380 300 L380 520Z"/><path fill="#1c1310" d="M236 510 L236 306 Q300 222 364 306 L364 510Z"/>' + b.stalaktiten(236, 364, 300, 70, s1);
        s += '<rect fill="' + s2 + '" x="200" y="520" width="200" height="14"/>';
        /* Feuerschale */
        s += '<path fill="' + s2 + '" d="M380 900 h80 l-14 30 h-52z M410 930 h20 v70 h-20z"/>' + b.licht(420, 870, 110, "#ff8a30", .5, "kl-glut") + '<path fill="#ff9a40" opacity=".85" d="M388 900 q6 -40 22 -46 q-2 22 12 12 q8 18 -2 34z M420 900 q4 -30 16 -36 q2 20 10 14 q4 14 -4 22z" class="kl-flamme" style="animation-duration:1.3s;transform-origin:420px 900px"/>';
        s += '<rect x="-10" y="990" width="620" height="20" fill="' + b.verlauf([[0, "#ff6a1a", .5], [1, "#b02a08", .2]]) + '" class="kl-lava"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#090505", s1 = "#140b09";
        let s = b.licht(220, 700, 260, "#ff7a2a", .22, "kl-puls");
        s += '<path fill="' + s1 + '" d="M60 1010 L60 900 L380 900 L380 1010Z M100 900 L100 860 L340 860 L340 900Z"/>';
        s += b.figur("thron", 220, 860, 1.9, s2);
        [[40, 160], [420, 200]].forEach(([x, y]) => {
          s += '<g class="kl-wehen" style="animation-duration:10s;transform-origin:' + (x + 40) + "px " + y + 'px"><path fill="#4a1a12" d="M' + x + " " + y + " h80 v360 l-40 -30 l-40 30z" + '"/><path fill="#c08a3a" opacity=".45" d="M' + (x + 20) + " " + (y + 100) + " h40 l-6 40 h-28z M" + (x + 26) + " " + (y + 90) + " l-6 -20 l12 12 l8 -16 l8 16 l12 -12 l-6 20z" + '"/></g>';
        });
        s += '<rect x="-10" y="990" width="620" height="20" fill="' + b.verlauf([[0, "#ff6a1a", .5], [1, "#b02a08", .2]]) + '" class="kl-lava"/>';
        return s;
      },
      teilchen: [{ t: "glut", n: 14 }, { t: "asche", n: 8, farbe: ["#4a3a36"] }]
    },

    laden: {
      name: { de: "Ein Laden in Gracklstugh", en: "A Shop in Gracklstugh" },
      himmel: "radial-gradient(ellipse 45% 45% at 85% 60%, rgba(190,120,230,.22), transparent 70%), radial-gradient(ellipse 45% 45% at 12% 60%, rgba(240,170,90,.16), transparent 70%), linear-gradient(180deg, #100c10 0%, #171117 55%, #171210 100%)",
      farben: { fern: "#1f1719", licht: "#d0a0f0" },
      fern: (b, W, H, c) => FERN.innen(b, W, H, c),
      links(b) {
        const s2 = "#0a0709", s1 = "#151014";
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="420" height="1010"/>';
        [300, 500, 700].forEach(y => { s += '<rect fill="' + s2 + '" x="-10" y="' + y + '" width="430" height="12"/>'; });
        const farben = ["#e05050", "#9ad070", "#d0a0f0", "#f0c070"];
        for (let i = 0; i < 15; i++) {
          const y = [300, 500, 700][i % 3], x = 20 + Math.floor(i / 3) * 80 + b.z(-6, 6), c = farben[b.zi(0, 3)], g = b.z(.7, 1.15);
          s += b.licht(x, y - 24 * g, 34 * g, c, .32, "kl-puls") + '<path fill="' + c + '" opacity=".35" stroke="' + s2 + '" stroke-width="2.5" d="M' + r1(x - 12 * g) + " " + y + " q-4 -" + r1(26 * g) + " " + r1(8 * g) + " -" + r1(30 * g) + " v-" + r1(12 * g) + " h" + r1(8 * g) + " v" + r1(12 * g) + " q" + r1(12 * g) + " " + r1(4 * g) + " " + r1(8 * g) + " " + r1(30 * g) + 'z"/>';
        }
        /* die Flöte der Illusionen */
        s += '<g transform="rotate(-18 200 880)"><rect x="80" y="874" width="240" height="12" rx="6" fill="' + s2 + '"/>' + [120, 160, 200, 240].map(x => '<circle cx="' + x + '" cy="880" r="3" fill="#d0a0f0" opacity=".7"/>').join("") + "</g>";
        s += '<rect fill="' + s2 + '" x="-10" y="930" width="520" height="80"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#0a0709";
        /* auf der Theke legt ein winziger Demogorgon eine Miniaturstadt in Schutt und Asche */
        let s = '<rect fill="' + s2 + '" x="-10" y="820" width="460" height="190"/>';
        s += b.licht(220, 720, 180, "#c090f0", .4, "kl-puls");
        s += '<g class="kl-illusion">' + b.schatten("vorschau/klein/demogorgon.webp", 110, 626, 240, 203, "", .9, "0.32 0.32 0.32 0 0.3  0.22 0.22 0.22 0 0.14  0.42 0.42 0.42 0 0.38  0 0 0 0.85 0") +
          '<path fill="#c8a0f0" fill-opacity=".35" d="M70 822 v-24 h16 v24z M92 822 v-14 l10 -8 l10 8 v14z M330 822 v-30 h12 v30z M350 822 l4 -18 l12 4 l-2 14z"/></g>';
        return s;
      },
      teilchen: [{ t: "glitzer", n: 12, farbe: ["#d8b0f8", "#f0d080"] }, { t: "staub", n: 8, farbe: ["#e0c8a0"] }]
    },

    klingenmarkt: {
      name: { de: "Der Markt der Klingen", en: "The Market of Blades" },
      himmel: "radial-gradient(ellipse 60% 45% at 75% 55%, rgba(200,150,100,.18), transparent 70%), radial-gradient(ellipse 50% 40% at 12% 85%, rgba(240,120,50,.18), transparent 70%), linear-gradient(180deg, #0e0a09 0%, #17110e 55%, #1b130e 100%)",
      farben: { fern: "#1f1612", fern2: "#281d17", licht: "#f0a050" },
      fern: (b, W, H, c) => FERN.festung(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#090605", s1 = "#140e0b";
        /* Waffenständer, umgestürzter Marktstand */
        let s = '<rect fill="' + s2 + '" x="20" y="700" width="12" height="310"/><rect fill="' + s2 + '" x="300" y="700" width="12" height="310"/><rect fill="' + s2 + '" x="10" y="700" width="320" height="10"/>';
        for (let i = 0; i < 7; i++) { const x = 50 + i * 38; s += '<path fill="' + s2 + '" d="M' + x + " 940 L" + (x - 3) + " " + (720 + (i % 2) * 20) + " L" + x + " " + (706 + (i % 2) * 20) + " L" + (x + 3) + " " + (720 + (i % 2) * 20) + " L" + (x + 3) + ' 940Z M' + (x - 10) + " 930 h20 v6 h-20z" + '"/>'; }
        s += '<path fill="' + s2 + '" d="M360 1010 L380 880 L520 920 L500 1010Z"/><path fill="#5a2a1e" opacity=".8" d="M370 880 L530 900 L520 870 L380 850Z" transform="rotate(14 450 880)"/>';
        s += b.licht(120, 980, 120, "#f0a050", .22);
        s += '<rect fill="' + s2 + '" x="-10" y="1000" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#090605";
        /* der rasende Riese im Staub */
        let s = b.licht(260, 640, 260, "#c89060", .16, "kl-puls") + '<g class="kl-wanken" style="animation-duration:6s">' + b.schatten("vorschau/klein/riese-frei.webp", 20, 410, 500, 600, s2, .95) + "</g>";
        s += '<ellipse cx="240" cy="980" rx="300" ry="70" fill="' + b.glow("#a08a70", .3) + '" class="kl-wogen" style="animation-duration:9s"/>';
        s += '<path fill="' + s2 + '" d="M380 1010 L400 930 L470 940 L450 1010Z M30 1010 L60 960 L120 980 L100 1010Z"/>';
        return s;
      },
      teilchen: [{ t: "staub", n: 22, farbe: ["#c8a888", "#a89070"] }, { t: "nebel", n: 3, farbe: ["#8a7460"] }]
    },

    riesendorf: {
      name: { de: "Das Dorf der Riesen", en: "The Village of the Giants" },
      himmel: "radial-gradient(ellipse 60% 45% at 60% 75%, rgba(200,150,100,.16), transparent 70%), radial-gradient(ellipse 34% 40% at 12% 78%, rgba(230,150,80,.2), transparent 70%), radial-gradient(ellipse 40% 40% at 10% 30%, rgba(230,140,70,.14), transparent 70%), linear-gradient(180deg, #0e0b0a 0%, #16120f 55%, #19140f 100%)",
      farben: { fern: "#1e1814", fern2: "#28201a", licht: "#f0a050" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#090706", s1 = "#14100d";
        /* ein Riese schiebt einen gewaltigen Erzwagen */
        let s = '<g class="kl-schieben" style="animation-duration:24s">';
        s += '<path fill="' + s2 + '" d="M180 880 L470 880 L450 980 L200 980Z"/><path fill="' + s1 + '" d="M190 880 q20 -70 60 -60 q20 -40 60 -20 q30 -40 70 0 q40 -10 70 40 q10 20 20 40z"/>';
        s += '<circle cx="250" cy="985" r="26" fill="' + s2 + '"/><circle cx="410" cy="985" r="26" fill="' + s2 + '"/>';
        s += '<g transform="translate(110 1010) scale(2.2) rotate(8)"><path fill="' + s2 + '" d="' + FIGUREN.riese + '"/></g>';
        s += "</g>";
        s += '<path fill="#e0a060" opacity=".35" d="M300 830 l6 -10 l6 10z M360 820 l5 -8 l5 8z"/>';
        s += '<rect fill="' + s2 + '" x="-10" y="1000" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#090706", s1 = "#14100d";
        /* Steinbruch: Terrassen, Blöcke, ein Kran */
        let s = '<path fill="' + s1 + '" d="M-10 1010 L-10 300 L120 300 L120 460 L240 460 L240 640 L360 640 L360 820 L480 820 L480 1010Z"/>';
        s += '<rect fill="' + s2 + '" x="40" y="250" width="70" height="50"/><rect fill="' + s2 + '" x="150" y="410" width="80" height="50"/><rect fill="' + s2 + '" x="270" y="590" width="60" height="50"/>';
        s += '<path stroke="' + s2 + '" stroke-width="8" d="M420 820 V420 L260 380"/><path stroke="' + s2 + '" stroke-width="2" d="M290 388 V560"/><rect fill="' + s2 + '" x="270" y="560" width="40" height="34"/>';
        s += b.licht(200, 900, 140, "#f0a050", .2);
        return s;
      },
      teilchen: [{ t: "staub", n: 22, farbe: ["#c8a888"] }, { t: "nebel", n: 2, farbe: ["#7a6a5a"] }]
    },

    steinsprecher: {
      name: { de: "Beim Steinsprecher", en: "With the Stonespeaker" },
      himmel: "radial-gradient(ellipse 45% 45% at 85% 65%, rgba(200,140,240,.2), transparent 70%), radial-gradient(ellipse 40% 45% at 12% 60%, rgba(220,90,80,.14), transparent 70%), linear-gradient(180deg, #0d0b0e 0%, #141117 55%, #151215 100%)",
      farben: { fern: "#1b171d", fern2: "#231e26", licht: "#d0a0f0" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#080609", s1 = "#131016";
        /* „Der Stein schreit“: ein Menhir mit Gesicht und glühenden Rissen */
        let s = b.licht(220, 640, 300, "#c04a70", .24, "kl-puls");
        s += b.figur("menhir", 220, 1004, 3.4, "#1a1419") + b.figur("menhir", 420, 1008, 1.6, s2) + b.figur("menhir", 40, 1010, 2.2, s2);
        s += '<path d="M206 400 L214 470 L202 540 L218 610 L208 690 L224 780 M214 470 L236 520 M218 610 L196 660" stroke="#f07080" stroke-width="2" stroke-opacity=".75" fill="none" class="kl-rune" style="animation-duration:5s"/>';
        s += b.licht(214, 560, 70, "#f07080", .3, "kl-rune");
        s += '<rect fill="' + s2 + '" x="-10" y="1000" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#080609";
        let s = b.schatten("vorschau/klein/riese-frei.webp", -40, 500, 420, 504, s2, .95, null, ' transform="translate(380 0) scale(-1 1)"');
        s += b.kristall(360, 1000, 2, s2, "#d0a0f0");
        return s;
      },
      teilchen: [{ t: "sporen", n: 14, farbe: ["#d0a0f0", "#f0c0a0"] }, { t: "staub", n: 8, farbe: ["#c8b8c8"] }]
    },

    flammenhalle: {
      name: { de: "Die Halle der Flamme", en: "The Hall of the Flame" },
      himmel: "radial-gradient(ellipse 70% 35% at 50% 100%, rgba(255,110,30,.34), transparent 70%), radial-gradient(ellipse 45% 50% at 85% 60%, rgba(250,190,80,.18), transparent 70%), linear-gradient(180deg, #110909 0%, #1b0e0a 50%, #2a1209 100%)",
      farben: { fern: "#22110b", fern2: "#2c160e", licht: "#ff8a30" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c, { lava: true }),
      links(b) {
        const s2 = "#0a0504", s1 = "#160a07";
        let s = '<rect fill="' + s1 + '" x="-10" y="0" width="220" height="1010"/><rect fill="' + s2 + '" x="300" y="0" width="80" height="1010"/>';
        /* ein unaufhörlicher Strom aus Lava an der Wand entlang */
        s += '<path d="M200 -10 C230 200 180 400 230 600 C260 760 220 900 260 1010" stroke="#ff7a2a" stroke-width="22" fill="none" stroke-opacity=".28" class="kl-lava"/><path d="M200 -10 C230 200 180 400 230 600 C260 760 220 900 260 1010" stroke="#ffc060" stroke-width="4" fill="none" opacity=".3" stroke-dasharray="30 60" class="kl-lavafluss"/>';
        s += b.licht(230, 600, 200, "#ff7a2a", .25, "kl-glut");
        s += '<rect x="-10" y="980" width="620" height="30" fill="' + b.verlauf([[0, "#ff7a2a", .55], [1, "#a02a08", .3]]) + '" class="kl-lava"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#0a0504";
        /* Berg aus Gold, Edelsteine, goldene Tiere – sogar ein goldener Hund */
        let s = b.licht(260, 860, 280, "#ffc050", .28, "kl-puls");
        s += '<path fill="#3a2410" d="M-20 1010 C40 880 120 800 240 760 C340 780 440 860 540 1010Z"/>';
        s += '<path fill="#c08a2a" opacity=".18" d="M-20 1010 C40 880 120 800 240 760 C340 780 440 860 540 1010Z"/>';
        for (let i = 0; i < 26; i++) {
          const x = b.z(20, 500), y = b.z(800, 1000);
          s += '<path d="M' + r1(x) + " " + r1(y - 6) + " l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2z" + '" fill="#fff0b0"' + b.anim("kl-funkeln", b.z(2, 5)) + "/>";
        }
        s += '<g opacity=".9">' + b.figur("hund", 300, 790, 1.2, "#8a5a1a") + "</g>";
        s += '<path fill="#8a5a1a" d="M120 840 l20 -50 l10 40 l20 -30 l6 40z"/>';
        return s;
      },
      teilchen: [{ t: "glut", n: 16 }, { t: "glitzer", n: 10, farbe: ["#ffe08a"], zone: "rechts" }]
    },

    themberchaud: {
      name: { de: "Themberchaud", en: "Themberchaud" },
      himmel: "radial-gradient(ellipse 70% 35% at 50% 100%, rgba(255,110,30,.34), transparent 70%), radial-gradient(ellipse 50% 55% at 82% 50%, rgba(240,90,50,.24), transparent 70%), linear-gradient(180deg, #110909 0%, #1b0e0a 50%, #2a1209 100%)",
      farben: { fern: "#22110b", fern2: "#2c160e", licht: "#ff8a30" },
      fern: (b, W, H, c) => FERN.hoehle(b, W, H, c, { lava: true }),
      links(b) { return ORTE.flammenhalle.links(b); },
      rechts(b) {
        const s2 = "#0a0504";
        let s = b.licht(260, 800, 300, "#ffc050", .25, "kl-puls");
        s += '<path fill="#3a2410" d="M-20 1010 C40 900 120 830 240 800 C340 820 440 880 540 1010Z"/><path fill="#c08a2a" opacity=".22" d="M-20 1010 C40 900 120 830 240 800 C340 820 440 880 540 1010Z"/>';
        /* der Meister der Flammen auf seinem Schatz – er atmet */
        s += '<g class="kl-atmen" style="animation-duration:7s;transform-origin:240px 820px"><g transform="translate(240 830) scale(2.1)"><path fill="' + s2 + '" d="' + FIGUREN.drachenSitz + '"/></g>' +
          '<circle cx="372" cy="476" r="5" fill="#ffb040"/>' + b.licht(372, 476, 30, "#ffb040", .55, "kl-puls") + "</g>";
        for (let i = 0; i < 18; i++) s += '<path d="M' + r1(b.z(20, 500)) + " " + r1(b.z(880, 1000)) + ' l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2z" fill="#fff0b0"' + b.anim("kl-funkeln", b.z(2, 5)) + "/>";
        return s;
      },
      teilchen: [{ t: "glut", n: 14 }, { t: "noten", n: 7, farbe: ["#ffd88a"] }]
    },

    drachenei: {
      name: { de: "Die Glutkammer", en: "The Ember Chamber" },
      himmel: "radial-gradient(ellipse 45% 45% at 82% 60%, rgba(250,170,70,.24), transparent 70%), radial-gradient(ellipse 45% 40% at 12% 40%, rgba(140,130,150,.12), transparent 70%), linear-gradient(180deg, #0e0a0b 0%, #17100e 55%, #1c120c 100%)",
      farben: { fern: "#1e1512", fern2: "#271b16", licht: "#f0a050" },
      fern: (b, W, H, c) => FERN.festung(b, W, H, c),
      decke: true,
      links(b) {
        const s2 = "#080606", s1 = "#121010";
        /* Gassen der Slums: wer schleicht da durch die Schatten? */
        let s = b.haus(-20, 1010, 200, 360, s1, { dach: 0 }) + b.haus(170, 1010, 160, 260, s2, { dach: 0, fenster: [[.4, .3, .16, .16]], licht: "#c0a070" });
        s += '<path stroke="' + s2 + '" stroke-width="2" d="M180 760 Q260 790 340 760" fill="none"/><path fill="' + s2 + '" d="M220 772 h14 v26 h-14z M270 778 h16 v20 h-16z"/>';
        s += '<g class="kl-huschen" style="animation-duration:26s;animation-delay:-12s">' + b.figur("robe", 0, 1004, 1.3, "#1a181c") + "</g>";
        s += '<rect fill="' + s2 + '" x="-10" y="1000" width="620" height="20"/>';
        return s;
      },
      rechts(b) {
        const s2 = "#080606";
        /* das Abzeichen: eine faustgroße Goldmünze mit Drachenkopf – und das Drachenei */
        let s = b.licht(250, 760, 200, "#f0a050", .3, "kl-puls");
        s += '<g class="kl-schweben" opacity=".72" style="animation-duration:8s"><circle cx="250" cy="540" r="84" fill="#7a5418"/><circle cx="250" cy="540" r="84" fill="#d8a040" opacity=".22"/><circle cx="250" cy="540" r="70" fill="none" stroke="#3a2408" stroke-width="3" opacity=".7"/>' +
          '<path fill="#2a1a08" opacity=".7" d="M210 560 C214 520 240 500 270 504 L300 492 L288 512 C300 524 296 548 280 560 L262 552 L270 580 L246 560 L230 590 Z"/>' + b.licht(250, 540, 120, "#ffd080", .25, "kl-puls") + "</g>";
        s += '<path fill="' + s2 + '" d="M140 1010 L160 900 L340 900 L360 1010Z"/>';
        s += b.licht(250, 840, 90, "#ffb060", .3, "kl-puls") + '<g transform="translate(250 900) scale(1.1)"><path fill="#3a1e14" d="' + FIGUREN.ei + '"/><path fill="none" stroke="#e08a40" stroke-opacity=".45" stroke-width="2" d="M-30 -40 q30 -10 60 0 M-36 -16 q36 -12 72 0 M-20 -70 q20 -8 40 0"/></g>';
        return s;
      },
      teilchen: [{ t: "glut", n: 10 }, { t: "staub", n: 10, farbe: ["#e0c090"] }]
    }
  };
  /* Varianten */
  ORTE["schenke-rotroben"] = Object.assign({}, ORTE.schenke, { name: { de: "Die Schenke – Besuch in Rot", en: "The Tavern – Visitors in Red" }, gestalten: "rotroben" });

  /* Stichwörter, falls ein neuer Abschnitt noch keine Kulisse hat (erst Titel, dann Text) */
  const RATEN = [
    [/hafen|harbou?r|schiff|ship/i, "hafen"], [/neverwinter/i, "neverwinter"], [/allianz|alliance/i, "allianz"],
    [/phandalin/i, "phandalin"], [/crackmore|schloss|castle/i, "crackmore"], [/goblin/i, "goblinhoehle"],
    [/wachturm|watchtower/i, "wachturm"], [/schmiede|forge|mine/i, "schmiede"], [/drache|dragon|venomfang/i, "drachenturm"],
    [/donnerbaum|thundertree/i, "donnerbaum"], [/zombie|blight/i, "geisterdorf"], [/nebel|mist/i, "kraeuternebel"],
    [/kerker|zelle|gefangen|dungeon|cell|captured/i, "kerker"], [/spinnwe|netz|web/i, "spinnweben"], [/pilz|mushroom|grab|tomb/i, "pilzgrab"],
    [/demogorgon/i, "demogorgon"], [/see\b|lake|kuo-toa/i, "see"], [/themberchaud/i, "themberchaud"], [/drachenei|\begg\b/i, "drachenei"],
    [/flamme|flame|lava/i, "flammenhalle"], [/könig|king|hof\b|court|thron/i, "thronsaal"], [/riese|giant/i, "riesendorf"],
    [/steinsprecher|stonespeaker|kristall|crystal/i, "steinsprecher"], [/schenke|taverne|tavern|inn/i, "schenke"], [/laden|kauf|shop|market|markt/i, "laden"],
    [/gracklstugh|duergar/i, "gracklstugh"], [/wald|forest|straße|road/i, "waldstrasse"]
  ];

  /* =====================================================================
     AUSSEHEN
     ===================================================================== */
  const css = document.createElement("style");
  css.textContent = `
#kulisse { position: fixed; inset: 0; z-index: -2; pointer-events: none; overflow: hidden; opacity: 0; transition: opacity 1.4s ease; contain: strict; }
#kulisse.an { opacity: 1; }
#kulisse .kl-szene { position: absolute; inset: 0; opacity: 0; transition: opacity 1.6s cubic-bezier(.45,.05,.35,1); }
#kulisse .kl-szene.da { opacity: 1; }
#kulisse .kl-himmel { position: absolute; inset: -2%; }
#kulisse .kl-par { position: absolute; will-change: transform; }
#kulisse .kl-fern { left: 0; right: 0; bottom: 0; height: 56vh; }
#kulisse .kl-decke { left: 0; right: 0; top: 0; height: 30vh; }
#kulisse .kl-fl { bottom: 0; }
#kulisse .kl-links { left: 0; width: var(--fwl, 300px); }
#kulisse .kl-rechts { right: 0; width: var(--fwr, 300px); }
#kulisse .kl-par > .kl-in { width: 100%; height: 100%; transition: transform 2.4s cubic-bezier(.2,.75,.25,1), opacity 2s ease; }
#kulisse .kl-szene:not(.da) .kl-fl > .kl-in { transform: translateY(5%) scale(1.015); }
#kulisse .kl-szene:not(.da) .kl-fern > .kl-in { transform: translateY(3%); }
#kulisse .kl-szene.geht .kl-fl > .kl-in { transform: translateY(3%); }
#kulisse .kl-fern svg, #kulisse .kl-decke svg { width: 100%; height: 100%; display: block; }
#kulisse .kl-fern { opacity: .9; }
#kulisse .kl-fl svg { width: 100%; height: auto; display: block; overflow: visible; }
#kulisse .kl-rechts .kl-in svg { transform: scaleX(-1); }
#kulisse .kl-fl { opacity: .95; }
#kulisse canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#kulisse .kl-schleier { position: absolute; top: 0; bottom: 0; left: var(--sl, 0); width: var(--sw, 100%);
  background: linear-gradient(90deg, rgba(16,14,21,0), rgba(16,14,21,var(--sa,.9)) var(--fl, 120px), rgba(16,14,21,var(--sa,.9)) calc(100% - var(--fr, 120px)), rgba(16,14,21,0)); }
#kulisse .kl-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse 120% 90% at 50% 55%, transparent 55%, rgba(8,7,10,.55)), linear-gradient(180deg, rgba(10,9,13,.65), transparent 16%); }
#kulisse.schmal .kl-vignette { background: linear-gradient(180deg, rgba(10,9,13,.5), transparent 20%, transparent 85%, rgba(10,9,13,.4)); }

/* Bewegungen – alle langsam und weich */
#kulisse svg * { transform-box: fill-box; }
#kulisse .kl-flacker { animation: klFlacker 5s ease-in-out infinite; }
#kulisse .kl-fenster { animation: klFenster 9s ease-in-out infinite; }
#kulisse .kl-glut { animation: klGlut 4s ease-in-out infinite; }
#kulisse .kl-puls { animation: klPuls 7s ease-in-out infinite; }
#kulisse .kl-rune { animation: klRune 6s ease-in-out infinite; }
#kulisse .kl-glanz { animation: klGlanz 6s ease-in-out infinite; }
#kulisse .kl-welle { animation: klWelle 4s ease-in-out infinite; }
#kulisse .kl-funkeln { animation: klFunkeln 4s ease-in-out infinite; }
#kulisse .kl-flamme { animation: klFlamme 1.3s ease-in-out infinite; transform-origin: 50% 100%; }
#kulisse .kl-pendel { animation: klPendel 7s ease-in-out infinite; transform-box: view-box; }
#kulisse .kl-wehen { animation: klWehen 9s ease-in-out infinite; transform-box: view-box; }
#kulisse .kl-wipp { animation: klWipp 8s ease-in-out infinite; transform-box: view-box; }
#kulisse .kl-rauch { animation: klRauch 9s ease-out infinite; transform-origin: 50% 50%; }
#kulisse .kl-blinzeln { animation: klBlinzeln 7s ease-in-out infinite; transform-box: view-box; }
#kulisse .kl-moewe { animation: klMoewe 28s linear infinite; }
#kulisse .kl-fluegelschlag { animation: klSchlag 1.2s ease-in-out infinite; transform-origin: 50% 50%; }
#kulisse .kl-fluegel { animation: klFluegel 2.6s ease-in-out infinite; transform-origin: 30% 100%; }
#kulisse .kl-fledermausflug { animation: klFledermaus 16s ease-in-out infinite; }
#kulisse .kl-drachenflug { animation: klDrache 26s ease-in-out infinite; }
#kulisse .kl-kreisen { animation: klKreisen 30s ease-in-out infinite; }
#kulisse .kl-surren { animation: klSurren 7s ease-in-out infinite; }
#kulisse .kl-schwirren { animation: klSchwirren .14s linear infinite; transform-origin: 50% 100%; }
#kulisse .kl-faden { animation: klFaden 12s ease-in-out infinite; }
#kulisse .kl-schlurfen { animation: klSchlurfen 7s ease-in-out infinite; transform-origin: 50% 100%; }
#kulisse .kl-wanken { animation: klWanken 6s ease-in-out infinite; transform-origin: 50% 100%; }
#kulisse .kl-tentakel { animation: klTentakel 8s ease-in-out infinite; transform-box: view-box; }
#kulisse .kl-huschen { animation: klHuschen 19s linear infinite; }
#kulisse .kl-wogen { animation: klWogen 18s ease-in-out infinite; }
#kulisse .kl-strahl { animation: klStrahl 11s ease-in-out infinite; }
#kulisse .kl-lava { animation: klLava 6s ease-in-out infinite; }
#kulisse .kl-lavafluss { animation: klLavafluss 9s linear infinite; }
#kulisse .kl-rauschen { animation: klRauschen 3s ease-in-out infinite; }
#kulisse .kl-atmen { animation: klAtmen 7s ease-in-out infinite; transform-box: view-box; }
#kulisse .kl-schieben { animation: klSchieben 24s ease-in-out infinite; }
#kulisse .kl-schweben { animation: klSchweben 8s ease-in-out infinite; }
#kulisse .kl-illusion { animation: klIllusion 5s ease-in-out infinite; }
@keyframes klFlacker { 0%,100% { opacity: .85 } 20% { opacity: 1 } 35% { opacity: .72 } 55% { opacity: .95 } 75% { opacity: .8 } }
@keyframes klFenster { 0%,100% { opacity: .8 } 40% { opacity: .95 } 60% { opacity: .7 } }
@keyframes klGlut { 0%,100% { opacity: .7 } 30% { opacity: 1 } 50% { opacity: .78 } 80% { opacity: .95 } }
@keyframes klPuls { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
@keyframes klRune { 0%,100% { opacity: .25 } 50% { opacity: .95 } }
@keyframes klGlanz { 0%,100% { opacity: .2; transform: translateX(0) } 50% { opacity: .9; transform: translateX(6px) } }
@keyframes klWelle { 0%,100% { opacity: .3; transform: translate(0,0) } 50% { opacity: .9; transform: translate(8px,-3px) } }
@keyframes klFunkeln { 0%,100% { opacity: .15 } 50% { opacity: 1 } }
@keyframes klFlamme { 0%,100% { transform: scale(1,1) } 25% { transform: scale(.94,1.06) skewX(2deg) } 50% { transform: scale(1.04,.95) } 75% { transform: scale(.97,1.04) skewX(-2deg) } }
@keyframes klPendel { 0%,100% { transform: rotate(-2.2deg) } 50% { transform: rotate(2.2deg) } }
@keyframes klWehen { 0%,100% { transform: skewX(0) scaleX(1) } 50% { transform: skewX(2deg) scaleX(.985) } }
@keyframes klWipp { 0%,100% { transform: translateY(0) rotate(-.6deg) } 50% { transform: translateY(6px) rotate(.8deg) } }
@keyframes klRauch { 0% { transform: translate(0,0) scale(.5); opacity: 0 } 15% { opacity: .55 } 100% { transform: translate(24px,-180px) scale(2.4); opacity: 0 } }
@keyframes klBlinzeln { 0%,44%,52%,100% { transform: scaleY(1); opacity: 1 } 47%,49% { transform: scaleY(.1); opacity: .6 } 70%,85% { opacity: .15 } }
@keyframes klMoewe { from { transform: translate(-220px, 30px) } to { transform: translate(520px, -40px) } }
@keyframes klFluegel { 0%,100% { transform: scaleY(1) } 45% { transform: scaleY(.42) skewX(-8deg) } }
@keyframes klSchlag { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(-.5) } }
@keyframes klFledermaus { 0%,55% { transform: translate(0,0) scale(.2); opacity: 0 } 58% { opacity: 1; transform: translate(0,0) scale(.6) } 80% { transform: translate(260px,-260px) scale(1); opacity: .9 } 100% { transform: translate(560px,-520px) scale(.5); opacity: 0 } }
@keyframes klDrache { 0% { transform: translate(-60px,40px) rotate(-4deg) } 25% { transform: translate(40px,-30px) rotate(3deg) } 50% { transform: translate(120px,20px) rotate(-2deg) } 75% { transform: translate(20px,70px) rotate(4deg) } 100% { transform: translate(-60px,40px) rotate(-4deg) } }
@keyframes klKreisen { 0% { transform: translate(0,0) } 25% { transform: translate(140px,40px) } 50% { transform: translate(60px,110px) } 75% { transform: translate(-80px,50px) } 100% { transform: translate(0,0) } }
@keyframes klSurren { 0%,100% { transform: translate(0,0) } 10% { transform: translate(14px,-8px) } 22% { transform: translate(-6px,10px) } 35% { transform: translate(30px,4px) } 50% { transform: translate(8px,-20px) } 64% { transform: translate(-20px,6px) } 80% { transform: translate(10px,14px) } }
@keyframes klSchwirren { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(.55) } }
@keyframes klFaden { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-90px) } }
@keyframes klSchlurfen { 0%,100% { transform: rotate(-2deg) translateX(0) } 50% { transform: rotate(2.5deg) translateX(10px) } }
@keyframes klWanken { 0%,100% { transform: rotate(-1.5deg) } 50% { transform: rotate(1.5deg) } }
@keyframes klTentakel { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(5deg) } }
@keyframes klHuschen { 0%,62% { transform: translateX(-120px); opacity: 0 } 64% { opacity: 1 } 84% { transform: translateX(560px); opacity: 1 } 86%,100% { transform: translateX(600px); opacity: 0 } }
@keyframes klWogen { 0%,100% { transform: translate(0,0) scale(1) } 50% { transform: translate(60px,-30px) scale(1.15) } }
@keyframes klStrahl { 0%,100% { opacity: .05 } 50% { opacity: .11 } }
@keyframes klLava { 0%,100% { opacity: .55 } 50% { opacity: .9 } }
@keyframes klLavafluss { to { stroke-dashoffset: -180 } }
@keyframes klRauschen { 0%,100% { opacity: .7 } 50% { opacity: 1 } }
@keyframes klAtmen { 0%,100% { transform: scale(1) } 50% { transform: scale(1.012, 1.02) } }
@keyframes klSchieben { 0%,100% { transform: translateX(-30px) } 50% { transform: translateX(40px) } }
@keyframes klSchweben { 0%,100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-14px) rotate(2deg) } }
@keyframes klIllusion { 0%,100% { opacity: .45 } 30% { opacity: .85 } 60% { opacity: .6 } 75% { opacity: .9 } }
#kulisse.ruht *, #kulisse.ruhig * { animation-play-state: paused !important; }
#kulisse.sparsam .kl-fern *, #kulisse.sparsam .kl-decke *, #kulisse.sparsam .kl-glanz, #kulisse.sparsam .kl-funkeln, #kulisse.sparsam .kl-fenster, #kulisse.sparsam .kl-welle { animation: none !important; }
#kulisse.ruhig * { animation: none !important; }
#kulisse.ruhig .kl-par > .kl-in { transition: none; transform: none !important; }

/* Ortsschild und Steckbriefe am Rand */
#kulisse-rand { position: fixed; inset: 0; z-index: 5; pointer-events: none; opacity: 0; transition: opacity 1.2s ease; }
#kulisse-rand.an { opacity: 1; }
.mondlicht #kulisse-rand { opacity: 0 !important; }
.kl-ort { position: absolute; top: var(--ot, 6rem); left: var(--ox, 0); width: var(--ow, 20rem); text-align: center; color: var(--vellum); }
.kl-ort .kl-ort-t { position: absolute; left: 0; right: 0; top: 0; display: grid; justify-items: center; gap: .35rem; opacity: 0; transform: translateY(8px); transition: opacity 1.4s ease, transform 1.6s cubic-bezier(.2,.8,.3,1); }
.kl-ort .kl-ort-t.da { opacity: 1; transform: none; }
.kl-ort small { font-family: var(--body); font-size: .62rem; font-weight: 600; letter-spacing: .26em; text-transform: uppercase; color: var(--ember); opacity: .7; }
.kl-ort b { font-family: var(--name); font-style: italic; font-weight: 400; font-size: clamp(1.05rem, 1.4vw, 1.5rem); line-height: 1.2; color: rgba(235,226,204,.78); text-shadow: 0 2px 14px rgba(0,0,0,.9); text-wrap: balance; padding-inline: 1rem; }
.kl-ort i { display: block; width: 7rem; height: 9px; background: radial-gradient(circle, rgba(224,160,70,.7) 0 2px, transparent 3px) center/9px 9px no-repeat, linear-gradient(90deg, transparent, rgba(224,160,70,.45) 30%, transparent 46%, transparent 54%, rgba(224,160,70,.45) 70%, transparent) center/100% 1px no-repeat; }
.kl-briefe { position: absolute; top: var(--bt, 12rem); left: var(--bx, 0); width: var(--bw, 16rem); display: grid; gap: .7rem; justify-items: center; }
.kl-brief { pointer-events: auto; display: grid; grid-template-columns: 3.1rem 1fr; gap: .2rem .75rem; align-items: center; width: min(100%, 15.5rem); padding: .55rem .8rem .55rem .55rem; text-decoration: none; color: var(--vellum);
  background: linear-gradient(100deg, rgba(25,22,31,.82), rgba(25,22,31,.55)); border: 1px solid rgba(224,160,70,.22); border-radius: 2px; box-shadow: 0 10px 26px rgba(0,0,0,.35);
  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  opacity: 0; transform: translateY(14px); transition: opacity 1.1s ease, transform 1.3s cubic-bezier(.2,.8,.3,1), border-color .3s, background .3s; transition-delay: calc(var(--i, 0) * .22s + .5s); }
.kl-brief.da { opacity: .88; transform: none; }
.kl-brief.weg { opacity: 0; transform: translateY(-8px); transition-delay: 0s; transition-duration: .7s; }
.kl-brief:hover, .kl-brief:focus-visible { opacity: 1; border-color: var(--ember); background: linear-gradient(100deg, rgba(36,30,40,.92), rgba(30,26,36,.7)); }
.kl-brief .kl-bild { grid-row: span 3; width: 3.1rem; height: 3.1rem; border-radius: 50%; overflow: hidden; border: 1px solid rgba(224,160,70,.55); background: #231d28; display: grid; place-items: center; font-family: var(--display); font-size: 1.4rem; color: var(--ember); box-shadow: 0 0 0 3px rgba(16,14,21,.6); }
.kl-brief .kl-bild img { width: 100%; height: 100%; object-fit: cover; filter: saturate(.85); }
.kl-brief small { font-size: .58rem; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: var(--ember); opacity: .85; line-height: 1.2; }
.kl-brief b { font-family: var(--name); font-weight: 400; font-size: 1.05rem; line-height: 1.15; }
.kl-brief span { font-size: .74rem; line-height: 1.3; color: var(--ash); }
.kl-schild-handy { position: fixed; left: 50%; top: calc(var(--kopf, 56px) + 10px); z-index: 9; transform: translate(-50%, -6px); opacity: 0; pointer-events: none;
  padding: .3rem .9rem .35rem; border-radius: 99px; background: rgba(16,14,21,.72); border: 1px solid rgba(224,160,70,.25); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  font-family: var(--name); font-style: italic; font-size: .9rem; color: rgba(235,226,204,.85); white-space: nowrap; max-width: calc(100vw - 32px); overflow: hidden; text-overflow: ellipsis;
  transition: opacity 1.2s ease, transform 1.2s ease; }
.kl-schild-handy.da { opacity: 1; transform: translate(-50%, 0); }
.kl-hervor { animation: klHervor 2.6s ease; }
@keyframes klHervor { 0%, 60% { box-shadow: 0 0 0 2px var(--ember), 0 0 34px rgba(224,160,70,.4); } 100% { box-shadow: 0 0 0 0 transparent; } }
@media (prefers-reduced-motion: reduce) { .kl-brief, .kl-ort .kl-ort-t { transform: none !important; transition-property: opacity; } }
`;
  document.head.appendChild(css);

  /* =====================================================================
     AUFBAU
     ===================================================================== */
  const kulisse = document.createElement("div");
  kulisse.id = "kulisse"; kulisse.setAttribute("aria-hidden", "true");
  kulisse.innerHTML = '<div class="kl-buehne"></div><canvas></canvas><div class="kl-schleier"></div><div class="kl-vignette"></div>';
  document.body.prepend(kulisse);
  const buehne = kulisse.querySelector(".kl-buehne"), leinwand = kulisse.querySelector("canvas");
  if (ruhig) kulisse.classList.add("ruhig");

  const rand = document.createElement("div");
  rand.id = "kulisse-rand";
  rand.innerHTML = '<div class="kl-ort" aria-hidden="true"></div><nav class="kl-briefe"></nav>';
  document.body.appendChild(rand);
  const ortBox = rand.querySelector(".kl-ort"), briefBox = rand.querySelector(".kl-briefe");
  const schildHandy = document.createElement("div");
  schildHandy.className = "kl-schild-handy"; schildHandy.setAttribute("aria-hidden", "true");
  document.body.appendChild(schildHandy);

  /* ---------- Maße: wo steht der Text, wie breit sind die Ränder ---------- */
  let M = { vw: 0, vh: 0, tl: 0, tr: 0, ml: 0, mr: 0, schmal: true };
  function messen() {
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const k = kapitelBox.querySelector(".chapter") || kapitelBox;
    const r = k.getBoundingClientRect();
    let tl = r.left, tr = r.right;
    if (!r.width) { tl = Math.max(16, (vw - 704) / 2); tr = vw - tl; }
    const ml = Math.max(0, tl), mr = Math.max(0, vw - tr);
    const schmal = vw < 900 || Math.max(ml, mr) < 200;
    M = { vw, vh, tl, tr, ml, mr, schmal };
    kulisse.classList.toggle("schmal", schmal);
    const st = kulisse.style;
    if (schmal) {
      const w = Math.min(vw * .62, vh * .5);
      st.setProperty("--fwl", w + "px"); st.setProperty("--fwr", w + "px");
      st.setProperty("--sl", "-40px"); st.setProperty("--sw", (vw + 80) + "px"); st.setProperty("--fl", "40px"); st.setProperty("--fr", "40px"); st.setProperty("--sa", ".74");
    } else {
      const fw = m => Math.max(220, Math.min(m * 1.22 + 40, vh * .64));
      st.setProperty("--fwl", fw(ml) + "px"); st.setProperty("--fwr", fw(mr) + "px");
      const fl = Math.max(36, Math.min(ml * .45, 230)), fr = Math.max(36, Math.min(mr * .45, 230));
      st.setProperty("--sl", (tl - fl) + "px"); st.setProperty("--sw", (tr - tl + fl + fr) + "px");
      st.setProperty("--fl", fl + "px"); st.setProperty("--fr", fr + "px"); st.setProperty("--sa", ".9");
    }
    /* Ortsschild und Steckbriefe: in den breiteren Rand (Schild bevorzugt links) */
    const kopf = (document.querySelector(".top") || { offsetHeight: 56 }).offsetHeight;
    document.documentElement.style.setProperty("--kopf", kopf + "px");
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const platzL = ml - 3.5 * rem, platzR = mr - 3.5 * rem;
    const schildSeite = platzL >= 12 * rem ? "l" : platzR >= 12 * rem ? "r" : "";
    const briefSeite = platzR >= 14 * rem ? "r" : platzL >= 14 * rem ? "l" : "";
    const rs = rand.style;
    ortBox.hidden = schmal || !schildSeite;
    if (schildSeite) {
      const w = Math.min(schildSeite === "l" ? platzL : platzR, 21 * rem);
      const x = schildSeite === "l" ? (ml - w) / 2 : tr + (mr - w) / 2;
      rs.setProperty("--ox", x + "px"); rs.setProperty("--ow", w + "px"); rs.setProperty("--ot", (kopf + vh * .07) + "px");
    }
    briefBox.hidden = schmal || !briefSeite;
    if (briefSeite) {
      const w = Math.min(briefSeite === "l" ? platzL : platzR, 17 * rem);
      const x = briefSeite === "l" ? (ml - w) / 2 : tr + (mr - w) / 2;
      const unterSchild = briefSeite === schildSeite;
      rs.setProperty("--bx", x + "px"); rs.setProperty("--bw", w + "px"); rs.setProperty("--bt", (kopf + vh * (unterSchild ? .2 : .1)) + "px");
    }
  }

  /* ---------- Abschnitte der Chronik ---------- */
  let abschnitte = [];
  const reinText = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  function abschnitteSammeln() {
    const D = daten(), DE = window.INHALT || {};
    abschnitte = [];
    let letzter = null;
    kapitelBox.querySelectorAll(".chapter").forEach((ch, ki) => {
      const kap = (D.kapitel || [])[ki] || {}, kapDe = (DE.kapitel || [])[ki] || {};
      const liste = kap.kulissen || kapDe.kulissen || [];
      const texte = [];
      (kap.absaetze || []).forEach(p => { if (typeof p !== "string") return; if (p.indexOf("## ") === 0) texte.push({ titel: p.slice(3).trim(), text: "" }); else if (texte.length && p.charAt(0) !== "!") texte[texte.length - 1].text += " " + reinText(p); });
      ch.querySelectorAll(".prose > .sub").forEach((el, ai) => {
        let eintrag = liste[ai], ort = null, figuren = null;
        if (eintrag && typeof eintrag === "object") { ort = eintrag.ort; figuren = eintrag.figuren; }
        else if (typeof eintrag === "string") ort = eintrag;
        const t = texte[ai] || { titel: el.textContent, text: "" };
        if (!ort || !ORTE[ort]) {
          const treffer = RATEN.find(([re]) => re.test(t.titel));
          ort = treffer ? treffer[1] : (letzter || "hafen");
        }
        letzter = ort;
        abschnitte.push({ el, kap: ch, ki, ai, ort, titel: t.titel, text: t.titel + " " + t.text, figuren });
      });
    });
  }

  /* ---------- Szenen bauen ---------- */
  function fernSvg(ortKey, typ) {
    const O = ORTE[ortKey], c = O.farben || {};
    const W = Math.max(320, Math.round(M.vw)), H = Math.max(200, Math.round(typ === "fern" ? M.vh * .56 : M.vh * .3));
    const b = new Bau(ortKey + typ + (W >> 7));
    const inhalt = typ === "fern" ? O.fern(b, W, H, c) : decke(b, W, H, c.fern2 ? "#09080b" : "#0a090c", c.fern || "#141218");
    return b.svg("0 0 " + W + " " + H, inhalt, "none");
  }
  function szeneBauen(ortKey) {
    const O = ORTE[ortKey];
    const el = document.createElement("div");
    el.className = "kl-szene";
    el.dataset.ort = ortKey;
    const bl = new Bau(ortKey + "L"), br = new Bau(ortKey + "R");
    /* nachts zeichnet extras.js schon einen Mond – dann keinen zweiten */
    const licht = (O.farben && O.farben.licht) || "#e0a046";
    const himmel = O.himmel.replace(/rgba\((\d+),(\d+),(\d+),([\d.]+)\)/g, (m, r, g, bl, a) => "rgba(" + r + "," + g + "," + bl + "," + Math.min(1, +a * 1.45).toFixed(2) + ")");
    let html = '<div class="kl-himmel" style="background:' + esc((O.mond && !NACHT ? O.mond + ", " : "") + "radial-gradient(ellipse 34% 30% at 0% 100%, " + licht + "26, transparent 70%), radial-gradient(ellipse 34% 30% at 100% 100%, " + licht + "26, transparent 70%), " + himmel) + '"></div>';
    html += '<div class="kl-par kl-fern" data-k=".018"><div class="kl-in">' + fernSvg(ortKey, "fern") + "</div></div>";
    if (O.decke) html += '<div class="kl-par kl-decke" data-k=".03"><div class="kl-in">' + fernSvg(ortKey, "decke") + "</div></div>";
    html += '<div class="kl-par kl-fl kl-links" data-k=".055"><div class="kl-in">' + bl.svg("0 0 600 1000", O.links(bl, O), "xMinYMax meet") + "</div></div>";
    html += '<div class="kl-par kl-fl kl-rechts" data-k=".07"><div class="kl-in">' + br.svg("0 0 600 1000", O.rechts(br, O), "xMinYMax meet") + "</div></div>";
    el.innerHTML = html;
    return el;
  }

  /* ---------- Wechsel mit Überblendung ---------- */
  let aktOrt = null, aktIdx = -1, szenen = [];
  function wechsle(idx, sofort) {
    const a = abschnitte[idx];
    if (!a) return;
    aktIdx = idx;
    const ortKey = a.ort;
    briefeZeigen(a);
    if (ortKey === aktOrt) { if (szenen.length) szenen[szenen.length - 1].abschnitt = a; return; }
    aktOrt = ortKey;
    const el = szeneBauen(ortKey);
    const sz = { el, ort: ortKey, abschnitt: a, par: [] };
    el.querySelectorAll(".kl-par").forEach(p => sz.par.push({ el: p, k: parseFloat(p.dataset.k) || .05, decke: p.classList.contains("kl-decke"), y: null }));
    buehne.appendChild(el);
    szenen.forEach(s => s.el.classList.add("geht"));
    szenen.push(sz);
    parallaxe(true);
    const zeigen = () => el.classList.add("da");
    if (sofort) { el.style.transition = "none"; zeigen(); void el.offsetWidth; el.style.transition = ""; }
    else requestAnimationFrame(() => requestAnimationFrame(zeigen));
    /* Alte Szenen erst entfernen, wenn die neue wirklich ganz zu sehen ist (auch auf langsamen Geräten kein harter Schnitt) */
    const aufraeumen = () => {
      if (sz.fertig) return;
      sz.fertig = true;
      const i = szenen.indexOf(sz);
      if (i > 0) szenen.splice(0, i).forEach(alt => alt.el.remove());
    };
    if (sofort) aufraeumen();
    else {
      el.addEventListener("transitionend", e => { if (e.target === el && e.propertyName === "opacity") aufraeumen(); });
      const pruef = () => { if (sz.fertig || !el.isConnected) return; if (parseFloat(getComputedStyle(el).opacity) > .985) aufraeumen(); else setTimeout(pruef, 400); };
      setTimeout(pruef, 1800);
    }
    if (szenen.length > 4) { const alt = szenen.shift(); alt.el.remove(); }
    schildZeigen(ortKey, sofort);
    teilchenWechsel(ORTE[ortKey].teilchen || [], sofort);
  }

  /* ---------- Ortsschild ---------- */
  function schildZeigen(ortKey, sofort) {
    const O = ORTE[ortKey], name = (O.name && O.name[sprache()]) || "";
    const a = abschnitte[aktIdx], kap = a ? (sprache() === "en" ? "Chapter " : "Kapitel ") + ((daten().kapitel || [])[a.ki] || {}).nummer : "";
    ortBox.querySelectorAll(".kl-ort-t").forEach(t => { t.classList.remove("da"); setTimeout(() => t.remove(), 1500); });
    const t = document.createElement("div");
    t.className = "kl-ort-t";
    t.innerHTML = "<small>" + esc(kap) + "</small><b>" + esc(name) + "</b><i></i>";
    ortBox.appendChild(t);
    if (sofort) t.classList.add("da"); else requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("da")));
    if (M.schmal && !sofort && sichtbar) {
      schildHandy.textContent = name;
      schildHandy.classList.add("da");
      clearTimeout(schildZeigen.t);
      schildZeigen.t = setTimeout(() => schildHandy.classList.remove("da"), 3200);
    }
  }

  /* ---------- Steckbriefe der Leute und Kreaturen im Abschnitt ---------- */
  /* kleine Porträts liegen in chronik/klein/ (sonst das Original) */
  const KLEIN = new Set(["gundren-frei", "buergermeister-frei", "ilvara-druidin", "ilvara-wahr", "ploopploopeen", "portrait-koenig", "portrait-riese", "themberchaud", "bugbear", "venomfang", "blight", "chasme", "vrock", "kuo-toa", "demogorgon-karte"]);
  const bildKlein = f => { const n = String(f || "").split("/").pop().replace(/\.(jpe?g|png|webp)$/i, ""); return KLEIN.has(n) ? "chronik/klein/" + n + ".webp" : f; };
  const EXTRA_BILD = { "Gundren": "gundren-frei.webp", "Der Bürgermeister von Phandalin": "buergermeister-frei.webp", "The Mayor of Phandalin": "buergermeister-frei.webp" };
  const slug = t => String(t).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  /* Nur Vornamen: „Ilvara Mizzrym“ → „Ilvara“, „König Horga Stahl V.“ → „König Horga“ */
  function kurzName(n) {
    n = String(n || "").trim();
    if (/^(Der|Die|Das|The)\s/i.test(n)) return n.replace(/\s+(von|of)\s.*$/i, "");
    const w = n.split(/\s+/);
    if (/^(König|King|Captain|Kapitän|Königin|Queen)$/i.test(w[0])) return w.slice(0, 2).join(" ");
    return w[0];
  }
  function suchwort(n) {
    n = String(n || "").trim();
    if (/^(Der|Die|Das|The)\s/i.test(n)) return n.replace(/^(Der|Die|Das|The)\s+/i, "").replace(/\s+(von|of)\s.*$/i, "");
    const w = n.split(/\s+/);
    if (/^(König|King|Captain|Kapitän)$/i.test(w[0])) return w[1] || w[0];
    return w[0].replace(/[- ](Kultisten|cultists)$/i, "").replace(/-Kultisten$/i, "");
  }
  const TXT = {
    de: { nsc: "Bekanntschaft", tier: "Bestiarium", st: { verbuendet: "Verbündet", feindlich: "Feind", unklar: "Unklar", neutral: "Neutral", tot: "Tot", besiegt: "Besiegt", gesichtet: "Gesichtet", gefallen: "Gefallen", geruecht: "Gerücht" } },
    en: { nsc: "Acquaintance", tier: "Bestiary", st: { verbuendet: "Ally", feindlich: "Foe", unklar: "Unclear", neutral: "Neutral", tot: "Dead", besiegt: "Slain", gesichtet: "Sighted", gefallen: "Fallen", geruecht: "Rumour" } }
  };
  let wesen = [];
  function wesenSammeln() {
    const D = daten();
    wesen = [];
    (D.nsc || []).forEach(n => wesen.push({ art: "nsc", name: n.name, kurz: kurzName(n.name), wort: suchwort(n.name), bild: n.bild || EXTRA_BILD[n.name] || EXTRA_BILD[kurzName(n.name)], pos: n.bildPos, rolle: n.rolle, status: n.status, ziel: "nsc-" + slug(n.name) }));
    (D.bestiarium || []).forEach(t => wesen.push({ art: "tier", name: t.name, kurz: t.name, wort: suchwort(t.name), bild: t.bild, rolle: t.ort, status: t.status, ziel: "bestiarium" }));
    wesen.forEach(w => { w.re = new RegExp("(^|[^\\p{L}])" + w.wort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+") + "", "iu"); });
  }
  function wesenIn(a) {
    if (a.figuren && a.figuren.length) return a.figuren.map(n => wesen.find(w => w.name === n || w.kurz === n)).filter(Boolean).slice(0, 3);
    const gef = [];
    wesen.forEach(w => { const m = w.re.exec(a.text); if (m) gef.push({ w, i: m.index + (a.titel && w.re.test(a.titel) ? -1e6 : 0) }); });
    gef.sort((x, y) => x.i - y.i);
    return gef.slice(0, 3).map(g => g.w);
  }
  let briefeSchluessel = "";
  function briefeZeigen(a) {
    const liste = wesenIn(a);
    const key = liste.map(w => w.name).join("|") + sprache();
    if (key === briefeSchluessel) return;
    briefeSchluessel = key;
    briefBox.querySelectorAll(".kl-brief").forEach(b => { b.classList.add("weg"); b.tabIndex = -1; setTimeout(() => b.remove(), 800); });
    const T = TXT[sprache()];
    liste.forEach((w, i) => {
      const b = document.createElement("a");
      b.className = "kl-brief";
      b.href = "#" + w.ziel;
      if (w.art === "tier") b.dataset.tier = w.name; else b.dataset.nsc = w.ziel;
      b.style.setProperty("--i", i);
      b.title = w.name;
      b.innerHTML = '<span class="kl-bild">' + (w.bild ? '<img src="' + esc(bildKlein(w.bild)) + '" data-gross="' + esc(w.bild) + '" alt="" loading="lazy" decoding="async" style="object-position:' + esc(w.pos || "50% 20%") + '" onerror="if(this.src.indexOf(this.dataset.gross)<0)this.src=this.dataset.gross">' : esc(w.kurz.replace(/^(Der|Die|Das|The|König|King|Captain)\s+/i, "").charAt(0))) + "</span>" +
        "<small>" + esc(w.art === "tier" ? T.tier : T.nsc) + (w.status && T.st[w.status] ? " · " + esc(T.st[w.status]) : "") + "</small><b>" + esc(w.kurz) + "</b>" + (w.rolle ? "<span>" + esc(w.rolle) + "</span>" : "<span></span>");
      briefBox.appendChild(b);
      requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add("da")));
    });
  }
  /* Tippen auf einen Steckbrief: seiten.js wechselt zur Ansicht, hier wird das Wesen hervorgehoben */
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".kl-brief");
    if (!b) return;
    const hervor = el => { if (!el) return; el.classList.remove("kl-hervor"); void el.offsetWidth; el.classList.add("kl-hervor"); setTimeout(() => el.classList.remove("kl-hervor"), 2800); };
    setTimeout(() => {
      if (b.dataset.tier) {
        const art = Array.from(document.querySelectorAll("#beasts .beast")).find(x => { const h = x.querySelector("h3"); return h && h.textContent.trim() === b.dataset.tier; });
        if (art) { const kopf = (document.querySelector(".top") || { offsetHeight: 0 }).offsetHeight + 16; window.scrollTo({ top: art.getBoundingClientRect().top + window.pageYOffset - kopf, behavior: "instant" }); hervor(art); }
      } else hervor(document.getElementById(b.dataset.nsc));
    }, 80);
  });

  /* =====================================================================
     TEILCHEN (Nebel, Glut, Tropfen, Sporen …) auf einer Leinwand
     ===================================================================== */
  const TYPEN = {
    glut: { farbe: ["#ffb25a", "#ff8a3a", "#ffd08a"], g: [1.1, 2.6], leben: [5, 10], start: "unten", vy: [-42, -16], vx: [-6, 6], wackel: [8, 22], flacker: 1 },
    funken: { farbe: ["#ffd070", "#ffa040", "#fff0b0"], g: [.8, 1.7], leben: [1.4, 3], start: "unten", vy: [-130, -60], vx: [-14, 14], wackel: [4, 10], flacker: 1 },
    kaefer: { farbe: ["#d8f07a", "#f0e48a"], g: [1.3, 2.3], leben: [6, 12], start: "mitte", vy: [-6, 6], vx: [-9, 9], wackel: [14, 30], puls: 1.6 },
    sporen: { farbe: ["#c9a0f0"], g: [1, 2.4], leben: [9, 16], start: "alles", vy: [-14, -4], vx: [-5, 5], wackel: [6, 16], puls: .8 },
    gift: { farbe: ["#9ad070", "#b8e080", "#7ab060"], g: [1.2, 3], leben: [8, 14], start: "alles", vy: [-10, 4], vx: [-6, 6], wackel: [8, 18], puls: .7 },
    staub: { farbe: ["#e8d2a0"], g: [.7, 1.5], leben: [8, 14], start: "alles", vy: [-4, 3], vx: [-5, 5], wackel: [3, 8], puls: .5, hell: .55 },
    glitzer: { farbe: ["#f0e0a0"], g: [1.4, 2.8], leben: [2.5, 5], start: "alles", vy: [-2, 2], vx: [-2, 2], wackel: [0, 2], form: "stern", puls: 2.4 },
    tropfen: { farbe: ["#b8ccc4"], g: [1, 1.6], leben: [3, 3], start: "oben", vy: [150, 240], vx: [0, 0], ay: 380, form: "tropfen" },
    blatt: { farbe: ["#6b5a2a", "#7a4a22", "#4f5a2a", "#8a6a2a"], g: [4, 7], leben: [12, 20], start: "oben", vy: [18, 34], vx: [-10, 10], wackel: [20, 44], form: "blatt" },
    asche: { farbe: ["#8a8580", "#6e6a66"], g: [1, 2.2], leben: [10, 18], start: "oben", vy: [8, 22], vx: [-8, 8], wackel: [6, 16], form: "flocke", hell: .7 },
    nebel: { farbe: ["#9a90a0"], g: [190, 340], leben: [20, 32], start: "unten2", vy: [-2, 1], vx: [5, 14], wackel: [0, 6], form: "nebel", hell: .085 },
    blasen: { farbe: ["#9ae0c8"], g: [2, 4], leben: [4, 7], start: "unten", vy: [-30, -14], vx: [-3, 3], wackel: [4, 10], form: "ring", hell: .5 },
    noten: { farbe: ["#ffd88a"], g: [10, 15], leben: [8, 12], start: "unten", vy: [-22, -10], vx: [-4, 4], wackel: [10, 22], form: "note", hell: .55 }
  };
  const ctx = leinwand.getContext && leinwand.getContext("2d");
  let teilchen = [], gruppen = [], lw = 0, lh = 0, dpr = 1, gruppenId = 0;
  const sprites = new Map();
  function sprite(form, farbe) {
    const k = form + farbe;
    if (sprites.has(k)) return sprites.get(k);
    const c = document.createElement("canvas"), n = form === "nebel" ? 128 : form === "note" ? 48 : 32;
    c.width = c.height = n;
    const g = c.getContext("2d"), m = n / 2;
    if (form === "nebel") {
      const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, farbe); gr.addColorStop(.5, farbe + "88"); gr.addColorStop(1, farbe + "00");
      g.fillStyle = gr; g.fillRect(0, 0, n, n);
    } else if (form === "blatt") {
      g.fillStyle = farbe; g.beginPath(); g.moveTo(m, 3); g.quadraticCurveTo(n - 4, m, m, n - 3); g.quadraticCurveTo(4, m, m, 3); g.fill();
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(m, 5); g.lineTo(m, n - 5); g.stroke();
    } else if (form === "ring") {
      g.strokeStyle = farbe; g.lineWidth = 2; g.beginPath(); g.arc(m, m, m - 4, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(m - 4, m - 4, 2.5, 0, Math.PI * 2); g.fill();
    } else if (form === "note") {
      g.fillStyle = farbe; g.font = "36px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = farbe; g.shadowBlur = 10; g.fillText(Math.random() < .5 ? "♪" : "♫", m, m);
    } else if (form === "stern") {
      const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, farbe); gr.addColorStop(.25, farbe + "55"); gr.addColorStop(1, farbe + "00");
      g.fillStyle = gr; g.fillRect(0, 0, n, n);
      g.strokeStyle = farbe; g.lineWidth = 1.2; g.beginPath(); g.moveTo(m, 2); g.lineTo(m, n - 2); g.moveTo(2, m); g.lineTo(n - 2, m); g.stroke();
    } else if (form === "flocke") {
      g.fillStyle = farbe; g.beginPath(); g.ellipse(m, m, m * .5, m * .3, .6, 0, Math.PI * 2); g.fill();
    } else {
      const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, "#fff8e8"); gr.addColorStop(.18, farbe); gr.addColorStop(.45, farbe + "44"); gr.addColorStop(1, farbe + "00");
      g.fillStyle = gr; g.fillRect(0, 0, n, n);
    }
    sprites.set(k, c);
    return c;
  }
  const zw = (a) => a[0] + Math.random() * (a[1] - a[0]);
  function leinwandGroesse() {
    if (!ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, handy ? 1 : 1.5);
    lw = M.vw; lh = M.vh;
    leinwand.width = Math.round(lw * dpr); leinwand.height = Math.round(lh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function startX(zone) {
    if (M.schmal) return Math.random() * lw;
    const l = Math.max(0, M.tl - 10), r = Math.max(0, lw - M.tr - 10);
    if (zone === "links" && l > 40) return Math.random() * l;
    if (zone === "rechts" && r > 40) return M.tr + 10 + Math.random() * r;
    return Math.random() * (l + r) < l ? Math.random() * l : M.tr + 10 + Math.random() * r;
  }
  function neuesTeilchen(gr, anfang) {
    const T = TYPEN[gr.t] || TYPEN.staub;
    const farbe = (gr.farbe || T.farbe)[Math.floor(Math.random() * (gr.farbe || T.farbe).length)];
    const form = T.form || "punkt";
    let x = startX(gr.zone), y;
    const st = T.start;
    if (st === "unten") y = lh * (.75 + Math.random() * .3);
    else if (st === "unten2") y = lh * (.55 + Math.random() * .4);
    else if (st === "oben") y = -10 - Math.random() * 30;
    else if (st === "mitte") y = lh * (.35 + Math.random() * .6);
    else y = Math.random() * lh;
    const leben = zw(T.leben);
    const p = { gr: gr.id, x, y, vx: zw(T.vx), vy: zw(T.vy), ay: T.ay || 0, g: zw(T.g), leben, alter: anfang ? Math.random() * leben * .8 : 0, phase: Math.random() * 6.3, wackel: zw(T.wackel || [0, 0]), bild: sprite(form, farbe), form, hell: (T.hell || 1) * (.6 + Math.random() * .4), puls: T.puls || 0, flacker: T.flacker, rot: Math.random() * 6.3, vr: (Math.random() - .5) * 1.6, aus: 0 };
    if (form === "nebel") { if (Math.random() < .5) p.vx = -p.vx; if (anfang) p.x = Math.random() * lw; else p.x = p.vx > 0 ? -p.g : lw + p.g; }
    if (anfang && st === "oben") p.y = Math.random() * lh;
    if (anfang && (st === "unten" || st === "unten2") && form !== "nebel") p.y = lh * (.2 + Math.random() * .85);
    return p;
  }
  function teilchenWechsel(konf, sofort) {
    gruppen.forEach(g => { g.ziel = 0; });
    const faktor = (M.schmal ? .45 : (M.vw > 2400 ? 1.35 : 1)) * (sparsam ? .5 : 1);
    konf.forEach(k => { const g = Object.assign({}, k, { id: ++gruppenId, ziel: Math.max(1, Math.round(k.n * faktor)) }); gruppen.push(g); if (sofort) for (let i = 0; i < g.ziel; i++) teilchen.push(neuesTeilchen(g, true)); });
    /* Alte Teilchen klingen sanft aus */
    teilchen.forEach(p => { const g = gruppen.find(x => x.id === p.gr); if (g && g.ziel === 0) p.aus = .0001; });
    gruppen = gruppen.filter(g => g.ziel > 0 || teilchen.some(p => p.gr === g.id));
  }
  let zuletzt = 0, laeuft = false, bildRate = 0, sparsam = false, zeitMittel = 1 / 60, zeitZahl = 0;
  function schritt(t) {
    if (!laeuft) return;
    requestAnimationFrame(schritt);
    if (handy && t - bildRate < 30) return;
    bildRate = t;
    const roh = (t - (zuletzt || t)) / 1000, dt = Math.min(.05, roh); zuletzt = t;
    /* Gerät kommt nicht hinterher? Dann leiser: weniger Bewegung in der Ferne, halb so viele Teilchen */
    if (!sparsam && roh > 0 && roh < .5) {
      zeitMittel = zeitMittel * .97 + roh * .03;
      if (++zeitZahl > 150 && zeitMittel > (handy ? .05 : .04)) { sparsam = true; kulisse.classList.add("sparsam"); gruppen.forEach(g => { g.ziel = Math.ceil(g.ziel / 2); }); }
    }
    parallaxe(false);
    if (!ctx || ruhig) return;
    ctx.clearRect(0, 0, lw, lh);
    /* nachfüllen – sanft gestaffelt */
    gruppen.forEach(g => {
      if (!g.ziel) return;
      let n = 0; for (const p of teilchen) if (p.gr === g.id && !p.aus) n++;
      if (n < g.ziel && Math.random() < .08 + (g.ziel - n) * .02) teilchen.push(neuesTeilchen(g, false));
    });
    const behalten = [];
    for (const p of teilchen) {
      p.alter += dt;
      if (p.aus) p.aus += dt;
      p.vy += p.ay * dt;
      p.x += (p.vx + Math.sin(p.alter * 1.3 + p.phase) * p.wackel * .6) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const ein = Math.min(1, p.alter / Math.min(2.2, p.leben * .25)), aus = Math.min(1, (p.leben - p.alter) / Math.min(2.5, p.leben * .3));
      let a = Math.max(0, Math.min(ein, aus)) * p.hell * (p.aus ? Math.max(0, 1 - p.aus / 1.6) : 1);
      if (p.puls) a *= .55 + .45 * Math.sin(p.alter * p.puls * 2 + p.phase);
      if (p.flacker) a *= .7 + .3 * Math.sin(p.alter * 11 + p.phase);
      if (p.alter >= p.leben || a <= 0 && p.alter > 1 || p.y > lh + 40 || p.y < -400 || (p.aus && p.aus > 1.6) || p.x < -p.g * 2 - 60 || p.x > lw + p.g * 2 + 60) continue;
      behalten.push(p);
      if (a < .01) continue;
      ctx.globalAlpha = Math.min(1, a);
      if (p.form === "tropfen") { ctx.fillStyle = "rgba(200,220,212,.8)"; ctx.fillRect(p.x, p.y, 1.3, Math.min(14, 3 + p.vy * .03)); continue; }
      const s = p.form === "punkt" ? p.g * 7 : p.form === "nebel" ? p.g : p.g * 2.4;
      if (p.form === "blatt" || p.form === "flocke") { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(p.bild, -s / 2, -s / 2, s, s * .7); ctx.restore(); }
      else if (p.form === "nebel") ctx.drawImage(p.bild, p.x - s, p.y - s * .45, s * 2, s * .9);
      else ctx.drawImage(p.bild, p.x - s / 2, p.y - s / 2, s, s);
    }
    teilchen = behalten;
    ctx.globalAlpha = 1;
  }

  /* ---------- Parallaxe: Ebenen gleiten leicht gegen den Text ---------- */
  function parallaxe(sofort) {
    if (ruhig) return;
    const vh = M.vh || window.innerHeight;
    szenen.forEach(sz => {
      const a = sz.abschnitt; if (!a) return;
      const i = abschnitte.indexOf(a), nach = abschnitte[i + 1];
      const top = a.el.getBoundingClientRect().top;
      const unten = nach && nach.kap === a.kap ? nach.el.getBoundingClientRect().top : a.kap.getBoundingClientRect().bottom;
      const mitte = (top + unten) / 2 - vh / 2;
      const max = vh * .04;
      sz.par.forEach(p => {
        /* nur nach unten (bzw. bei der Decke nach oben) verschieben – so entsteht am Rand nie eine Lücke */
        const ziel = Math.max(-max, Math.min(max, mitte * p.k)) + (p.decke ? -max : max);
        const neu = p.y == null || sofort ? ziel : p.y + (ziel - p.y) * .08;
        if (p.y != null && !sofort && Math.abs(neu - p.y) < .04) return;
        p.y = neu;
        p.el.style.transform = "translate3d(0," + p.y.toFixed(1) + "px,0)";
      });
    });
  }

  /* ---------- Welcher Abschnitt wird gerade gelesen? (mit Hysterese) ---------- */
  let wartend = -1, wartetSeit = 0, tempo = 0, letzteY = window.pageYOffset, letzteT = performance.now();
  function lesestelle() {
    const vh = M.vh || window.innerHeight, linie = vh * .42;
    let vor = -1, zurueck = -1;
    for (let i = 0; i < abschnitte.length; i++) {
      const t = abschnitte[i].el.getBoundingClientRect().top;
      if (t <= linie - 40) vor = i;
      if (t <= linie + 40) zurueck = i;
    }
    if (vor < 0 && zurueck < 0) return 0;
    if (aktIdx < 0) return Math.max(0, vor);
    if (vor > aktIdx) return vor;
    if (zurueck < aktIdx) return Math.max(0, zurueck);
    return aktIdx;
  }
  function pruefen() {
    if (!sichtbar || !abschnitte.length) return;
    const jetzt = performance.now(), y = window.pageYOffset;
    /* Sprünge (Kapitelmenü, Suche) zählen nicht als Rasen: Tempo gedeckelt */
    const v = Math.min(4, Math.abs(y - letzteY) / Math.max(16, jetzt - letzteT));
    tempo = tempo * .7 + v * .3; letzteY = y; letzteT = jetzt;
    const idx = lesestelle();
    if (idx === aktIdx) { wartend = -1; return; }
    if (idx !== wartend) { wartend = idx; wartetSeit = jetzt; }
    /* erst wechseln, wenn die Stelle eine Weile hält und nicht mehr gerast wird – kein Flackern beim schnellen Scrollen */
    if (jetzt - wartetSeit > 320 && (tempo < 1.6 || jetzt - wartetSeit > 1400)) { wartend = -1; wechsle(idx, false); }
  }
  let pruefTimer = 0;
  function pruefSchleife() { pruefen(); if (wartend >= 0 && sichtbar) { clearTimeout(pruefTimer); pruefTimer = setTimeout(pruefSchleife, 120); } }

  /* ---------- Sichtbarkeit: nur in der Chronik, nur wenn der Tab sichtbar ist ---------- */
  let sichtbar = false;
  function chronikOffen() { return chronik.classList.contains("aktiv") && !chronik.hidden && document.body.classList.contains("ansicht-bereich"); }
  function sichtbarkeit() {
    const offen = chronikOffen() && abschnitte.length > 0;
    const vorher = sichtbar;
    sichtbar = offen;
    kulisse.classList.toggle("an", offen);
    rand.classList.toggle("an", offen);
    kulisse.classList.toggle("ruht", !offen || document.hidden);
    if (!offen) { schildHandy.classList.remove("da"); briefBox.querySelectorAll(".kl-brief").forEach(b => { b.tabIndex = -1; }); }
    else briefBox.querySelectorAll(".kl-brief").forEach(b => { b.tabIndex = 0; });
    if (offen && !vorher) { messen(); leinwandGroesse(); const i = lesestelle(); if (i !== aktIdx || !szenen.length) { aktOrt = null; wechsle(i, true); } }
    const soll = offen && !document.hidden && !ruhig;
    if (soll && !laeuft) { laeuft = true; zuletzt = 0; requestAnimationFrame(schritt); }
    if (!soll) laeuft = false;
  }

  /* ---------- Start und Ereignisse ---------- */
  function neuAufbauen() {
    abschnitteSammeln(); wesenSammeln(); briefeSchluessel = "";
    messen(); leinwandGroesse();
    aktIdx = -1; aktOrt = null;
    if (chronikOffen()) { szenen.forEach(s => s.el.remove()); szenen = []; teilchen = []; gruppen = []; }
    sichtbar = false; sichtbarkeit();
  }
  neuAufbauen();
  window.addEventListener("scroll", () => { if (!sichtbar) return; pruefen(); clearTimeout(pruefTimer); pruefTimer = setTimeout(pruefSchleife, 140); }, { passive: true });
  let groesseTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(groesseTimer);
    groesseTimer = setTimeout(() => {
      const altB = M.vw, altH = M.vh;
      messen(); leinwandGroesse();
      if (Math.abs(altB - M.vw) > 40 || Math.abs(altH - M.vh) > 120) {
        szenen.forEach(sz => {
          const f = sz.el.querySelector(".kl-fern .kl-in"), d = sz.el.querySelector(".kl-decke .kl-in");
          if (f) f.innerHTML = fernSvg(sz.ort, "fern");
          if (d) d.innerHTML = fernSvg(sz.ort, "decke");
        });
      }
      parallaxe(true); pruefen();
    }, 220);
  });
  document.addEventListener("visibilitychange", sichtbarkeit);
  new MutationObserver(sichtbarkeit).observe(chronik, { attributes: true, attributeFilter: ["class", "hidden"] });
  new MutationObserver(sichtbarkeit).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(() => { clearTimeout(neuAufbauen.t); neuAufbauen.t = setTimeout(neuAufbauen, 60); }).observe(kapitelBox, { childList: true });
  if (ruhigMQ.addEventListener) ruhigMQ.addEventListener("change", e => { ruhig = e.matches; kulisse.classList.toggle("ruhig", ruhig); if (ruhig) { teilchen = []; ctx && ctx.clearRect(0, 0, lw, lh); } });
  /* Schriften laden spät nach – danach neu vermessen */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { messen(); parallaxe(true); });

  /* Für Tests und andere Skripte */
  window.ImresKulisse = {
    orte: Object.keys(ORTE),
    zeige(ort) { if (!ORTE[ort]) return false; const a = abschnitte.find(x => x.ort === ort); if (a) { wechsle(abschnitte.indexOf(a), false); } return true; },
    abschnitte: () => abschnitte.map(a => ({ kapitel: a.ki, abschnitt: a.ai, titel: a.titel, ort: a.ort })),
    aktuell: () => aktOrt
  };
})();
