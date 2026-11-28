/* =====================================================================
   TALES NEVER END – Grafik
   ---------------------------------------------------------------------
   Alles gezeichnet als SVG, ohne Blau:
   · Spieler-Figuren mit Frisur, Hautton, Kleidung, Mimik und Reaktionen
   · der Spieltisch von oben, der auf Balken, Session-Fortschritt und
     Spieler reagiert (Kerze brennt herunter, Pizzakartons stapeln sich …)
   · Szenenbilder oben auf jeder Karte (Taverne, Dungeon, Wald, Burg …)
   · Kartenrahmen je Sprecher (Schurke, Gott, Katze, Würfel …)
   · Würfelsets für die Sammlung
   Schnittstelle: window.TNE_GRAFIK
   ===================================================================== */
(function () {
  "use strict";
  /* ---------- kleiner Zufall mit Startwert ---------- */
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const f1 = n => Math.round(n * 10) / 10;
  let uid = 0; const neueId = p => p + (++uid).toString(36);

  /* =====================================================================
     FIGUREN
     ===================================================================== */
  const HAUT = ["#f3d2b0", "#e9bf98", "#d9a77c", "#c38c5e", "#a8704a", "#8a5838", "#6c4329", "#f6dcc4"];
  const HAAR = ["#2b1d12", "#4a2f1a", "#6e4527", "#9c6a3a", "#c99a5a", "#e2c27a", "#b8452c", "#8a8279", "#e9e4dc", "#5a2d4a", "#1a1410"];
  const HEMD = ["#a83a32", "#c58a2c", "#5f7a3a", "#7d4e8a", "#6b4a2c", "#8a8279", "#2f2a26", "#c46a8a", "#b9824a", "#4f6b2c", "#9c3d5a", "#d0743a"];
  const FRISUREN = ["kurz", "lang", "zopf", "locken", "glatze", "dutt", "irokese", "pony", "wellig", "seite", "bob", "rasta"];
  function aussehenNeu(r) {
    return { haut: Math.floor(r() * HAUT.length), haar: Math.floor(r() * HAAR.length), frisur: FRISUREN[Math.floor(r() * FRISUREN.length)], hemd: Math.floor(r() * HEMD.length), sommersprossen: r() < .22, brille: r() < .18, bart: r() < .22 ? (r() < .5 ? "voll" : "stoppel") : "", ohrring: r() < .2, kopf: r() < .5 ? 0 : 1 };
  }
  function haarPfad(fr, f) {
    switch (fr) {
      case "kurz": return `<path d="M27 44 Q27 20 50 19 Q73 20 73 44 Q70 32 62 30 Q50 26 40 30 Q31 33 27 44Z" fill="${f}"/>`;
      case "lang": return `<path d="M25 47 Q24 18 50 17 Q76 18 75 47 L78 84 Q70 88 66 72 Q70 50 64 34 Q50 28 36 34 Q30 50 34 72 Q30 88 22 84Z" fill="${f}"/>`;
      case "zopf": return `<path d="M27 45 Q26 19 50 18 Q74 19 73 45 Q68 30 50 28 Q32 30 27 45Z" fill="${f}"/><path d="M71 36 Q86 44 82 66 Q80 74 76 70 Q80 56 72 44Z" fill="${f}"/><circle cx="79" cy="40" r="3" fill="#a83a32"/>`;
      case "locken": { let p = ""; for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.14); p += `<circle cx="${f1(50 + Math.cos(a) * 24)}" cy="${f1(42 + Math.sin(a) * 25)}" r="9" fill="${f}"/>`; } return p + `<circle cx="50" cy="20" r="11" fill="${f}"/>`; }
      case "glatze": return `<path d="M30 40 Q28 33 33 30" stroke="${f}" stroke-width="4" fill="none"/><path d="M70 40 Q72 33 67 30" stroke="${f}" stroke-width="4" fill="none"/><ellipse cx="44" cy="26" rx="6" ry="3" fill="#fff" opacity=".25"/>`;
      case "dutt": return `<circle cx="50" cy="14" r="9" fill="${f}"/><path d="M27 44 Q26 20 50 20 Q74 20 73 44 Q66 30 50 29 Q34 30 27 44Z" fill="${f}"/>`;
      case "irokese": return `<path d="M44 34 L42 8 L50 16 L52 4 L58 16 L62 6 L58 34Z" fill="${f}"/><path d="M28 44 Q30 30 38 28" stroke="${f}" stroke-width="2" fill="none" opacity=".5"/>`;
      case "pony": return `<path d="M26 48 Q25 18 50 18 Q75 18 74 48 L72 40 Q66 34 60 38 Q55 32 50 38 Q44 32 38 38 Q33 34 28 40Z" fill="${f}"/>`;
      case "wellig": return `<path d="M24 52 Q20 30 32 22 Q42 12 56 16 Q74 18 76 38 Q80 50 74 60 Q72 44 66 34 Q58 28 48 31 Q34 34 30 46 Q30 54 24 52Z" fill="${f}"/>`;
      case "seite": return `<path d="M27 46 Q26 18 52 18 Q75 20 74 44 Q72 34 64 30 Q48 24 36 36 Q30 40 27 46Z" fill="${f}"/><path d="M36 36 Q46 24 66 28" stroke="#000" stroke-opacity=".15" fill="none"/>`;
      case "bob": return `<path d="M24 60 Q22 18 50 17 Q78 18 76 60 L68 62 Q72 42 64 33 Q50 28 36 33 Q28 42 32 62Z" fill="${f}"/>`;
      case "rasta": { let p = `<path d="M26 44 Q26 18 50 18 Q74 18 74 44 Q68 30 50 28 Q32 30 26 44Z" fill="${f}"/>`; for (let i = 0; i < 7; i++) p += `<rect x="${24 + i * 8}" y="${38 + (i % 2) * 4}" width="5" height="${30 + (i % 3) * 8}" rx="2.5" fill="${f}"/>`; return p; }
    }
    return "";
  }
  const TYP_DETAIL = {
    power: { hemdMuster: "tank", acc: c => `<path d="M27 34 Q50 26 73 34 L73 39 Q50 31 27 39Z" fill="#a83a32"/><path d="M71 36 l8 6 l-2 3 l-8 -5Z" fill="#a83a32"/>` },
    rolle: { acc: c => `<path d="M18 92 Q14 40 50 12 Q86 40 82 92 L74 92 Q78 50 50 26 Q22 50 26 92Z" fill="#5a2d4a" opacity=".92"/>` },
    regel: { brille: true, acc: c => `<path d="M46 80 L50 100 L54 80 L50 76Z" fill="#7a2418"/>` },
    chaos: { acc: c => `<circle cx="74" cy="22" r="6" fill="#e8b14e"/><text x="74" y="26" font-size="9" text-anchor="middle" fill="#2b1d12" font-weight="800">!</text>` },
    snack: { acc: c => `<path d="M64 86 l16 -8 l6 12 l-16 8Z" fill="#e8b14e" stroke="#8a5a10" stroke-width="1.2"/><circle cx="72" cy="88" r="1.5" fill="#c0442f"/>` },
    taktik: { acc: c => `<path d="M24 36 Q50 16 76 36 L80 38 Q50 26 20 38Z" fill="#4f6b2c"/><rect x="45" y="20" width="10" height="6" rx="1" fill="#c58a2c"/>` },
    neu: { acc: c => `<rect x="62" y="70" width="16" height="18" rx="2" fill="#fff6dc" stroke="#7b3b1d" stroke-width="1.2"/><text x="70" y="83" font-size="10" text-anchor="middle" fill="#7b3b1d" font-weight="800">?</text>` },
    veteran: { bart: "voll", grau: true, acc: c => `<rect x="60" y="78" width="16" height="10" rx="2" fill="#6b4a2c"/><path d="M64 78 v-4 h8 v4" stroke="#6b4a2c" stroke-width="2" fill="none"/>` },
    handy: { acc: c => `<rect x="64" y="66" width="13" height="22" rx="3" fill="#1a1410"/><rect x="66" y="69" width="9" height="15" rx="1" fill="#ffd27a" opacity=".9"/>` },
    drama: { acc: c => `<path d="M30 84 Q50 72 70 84 Q74 90 70 96 Q50 86 30 96 Q26 90 30 84Z" fill="#b8376a"/><path d="M68 86 l12 10" stroke="#b8376a" stroke-width="5" stroke-linecap="round"/>` },
    kunst: { acc: c => `<ellipse cx="46" cy="20" rx="22" ry="7" fill="#5f7a3a"/><circle cx="58" cy="14" r="3" fill="#5f7a3a"/><path d="M68 92 L84 70" stroke="#c58a2c" stroke-width="4" stroke-linecap="round"/><path d="M84 70 l2 -3" stroke="#2b1d12" stroke-width="3"/>` },
    musik: { acc: c => `<path d="M24 46 Q24 16 50 16 Q76 16 76 46" stroke="#2b1d12" stroke-width="4" fill="none"/><rect x="18" y="40" width="9" height="15" rx="4" fill="#a83a32"/><rect x="73" y="40" width="9" height="15" rx="4" fill="#a83a32"/>` }
  };
  /* Ausdruck: lach | grins | froh | neutral | skeptisch | traurig | wuetend | schock | muede | schlaf | stolz */
  function ausdruckAus(laune, reaktion) {
    if (reaktion) return reaktion;
    return laune > 82 ? "grins" : laune > 62 ? "froh" : laune > 42 ? "neutral" : laune > 25 ? "skeptisch" : laune > 12 ? "traurig" : "wuetend";
  }
  function gesichtTeile(a, haut) {
    let augen = "", brauen = "", mund = "", extra = "";
    const auge = (x, y, art) => {
      if (art === "zu") return `<path d="M${x - 5} ${y} Q${x} ${y + 4} ${x + 5} ${y}" stroke="#2b1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      if (art === "lach") return `<path d="M${x - 5} ${y + 2} Q${x} ${y - 4} ${x + 5} ${y + 2}" stroke="#2b1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      if (art === "halb") return `<path d="M${x - 5} ${y} h10" stroke="#2b1d12" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x}" cy="${y + 1.5}" r="2" fill="#2b1d12"/>`;
      const r = art === "gross" ? 5.2 : 4.2;
      return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r + .6}" fill="#fff"/><circle cx="${x + .6}" cy="${y + .4}" r="${art === "gross" ? 2 : 2.6}" fill="#2b1d12"/><circle cx="${x + 1.4}" cy="${y - .8}" r=".9" fill="#fff"/>`;
    };
    const braue = (x, y, dy, dir) => `<path d="M${x - 6} ${y + (dir < 0 ? dy : 0)} Q${x} ${y - 2} ${x + 6} ${y + (dir > 0 ? dy : 0)}" stroke="#2b1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    switch (a) {
      case "lach": augen = auge(41, 50, "lach") + auge(59, 50, "lach"); brauen = braue(41, 42, 0, 0) + braue(59, 42, 0, 0); mund = `<path d="M38 62 Q50 78 62 62Z" fill="#7a2418"/><path d="M40 63 Q50 66 60 63" stroke="#fff" stroke-width="2.5"/>`; extra = `<ellipse cx="34" cy="60" rx="4" ry="2.5" fill="#e0573a" opacity=".35"/><ellipse cx="66" cy="60" rx="4" ry="2.5" fill="#e0573a" opacity=".35"/>`; break;
      case "grins": augen = auge(41, 50, "") + auge(59, 50, ""); brauen = braue(41, 42, 2, 1) + braue(59, 42, 2, -1); mund = `<path d="M38 62 Q50 74 62 62" stroke="#2b1d12" stroke-width="2.6" fill="#7a2418"/><path d="M41 63.5 Q50 66 59 63.5" stroke="#fff" stroke-width="2"/>`; extra = `<ellipse cx="34" cy="60" rx="4" ry="2.5" fill="#e0573a" opacity=".3"/><ellipse cx="66" cy="60" rx="4" ry="2.5" fill="#e0573a" opacity=".3"/>`; break;
      case "froh": augen = auge(41, 50, "") + auge(59, 50, ""); brauen = braue(41, 42, 0, 0) + braue(59, 42, 0, 0); mund = `<path d="M40 63 Q50 71 60 63" stroke="#2b1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; break;
      case "neutral": augen = auge(41, 50, "") + auge(59, 50, ""); brauen = braue(41, 43, 0, 0) + braue(59, 43, 0, 0); mund = `<path d="M42 65 Q50 67 58 65" stroke="#2b1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; break;
      case "skeptisch": augen = auge(41, 50, "halb") + auge(59, 50, ""); brauen = `<path d="M35 44 h12" stroke="#2b1d12" stroke-width="2.4" stroke-linecap="round"/>` + braue(59, 41, 3, 1); mund = `<path d="M42 66 Q48 64 58 63" stroke="#2b1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; break;
      case "traurig": augen = auge(41, 51, "") + auge(59, 51, ""); brauen = `<path d="M35 44 Q41 40 47 42" stroke="#2b1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M53 42 Q59 40 65 44" stroke="#2b1d12" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; mund = `<path d="M41 68 Q50 61 59 68" stroke="#2b1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; extra = `<path d="M65 54 q2 5 0 8 q-3 -2 0 -8Z" fill="#e9e4dc" opacity=".9"/>`; break;
      case "wuetend": augen = auge(41, 51, "") + auge(59, 51, ""); brauen = `<path d="M34 42 L47 47" stroke="#2b1d12" stroke-width="3" stroke-linecap="round"/><path d="M66 42 L53 47" stroke="#2b1d12" stroke-width="3" stroke-linecap="round"/>`; mund = `<path d="M40 68 Q50 60 60 68" stroke="#2b1d12" stroke-width="2.8" fill="none" stroke-linecap="round"/>`; extra = `<path d="M70 28 l3 -6 M74 32 l6 -3 M71 34 l7 2" stroke="#a83a32" stroke-width="2" stroke-linecap="round"/>`; break;
      case "schock": augen = auge(41, 50, "gross") + auge(59, 50, "gross"); brauen = braue(41, 39, -1, 0) + braue(59, 39, -1, 0); mund = `<ellipse cx="50" cy="66" rx="5" ry="6.5" fill="#7a2418"/>`; extra = `<path d="M70 34 q4 6 0 10 q-4 -4 0 -10Z" fill="#e9e4dc"/>`; break;
      case "muede": augen = auge(41, 51, "halb") + auge(59, 51, "halb"); brauen = braue(41, 44, 0, 0) + braue(59, 44, 0, 0); mund = `<ellipse cx="50" cy="66" rx="4" ry="3" fill="#7a2418"/>`; break;
      case "schlaf": augen = auge(41, 51, "zu") + auge(59, 51, "zu"); brauen = braue(41, 45, 0, 0) + braue(59, 45, 0, 0); mund = `<path d="M46 66 q4 2 8 0" stroke="#2b1d12" stroke-width="2.4" fill="none"/>`; extra = `<text x="74" y="26" font-size="11" fill="#7b3b1d" font-weight="800">z</text><text x="80" y="17" font-size="8" fill="#7b3b1d" font-weight="800">z</text>`; break;
      case "stolz": augen = auge(41, 50, "zu") + auge(59, 50, "zu"); brauen = braue(41, 41, 0, 0) + braue(59, 41, 0, 0); mund = `<path d="M40 63 Q50 72 60 63" stroke="#2b1d12" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; extra = `<path d="M74 22 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1Z" fill="#e8b14e"/>`; break;
    }
    return { augen, brauen, mund, extra };
  }
  /* sp: Spielerobjekt (typ, laune, aussehen) · reaktion: optionaler Ausdruck */
  function figur(sp, reaktion, opt) {
    opt = opt || {};
    const A = sp.aussehen || aussehenNeu(rng(hash(sp.name)));
    const T = TYP_DETAIL[sp.typ] || {};
    const haut = HAUT[A.haut % HAUT.length], haar = T.grau ? "#b8b0a4" : HAAR[A.haar % HAAR.length], hemd = HEMD[A.hemd % HEMD.length];
    const ausdruck = ausdruckAus(sp.laune == null ? 60 : sp.laune, reaktion);
    const g = gesichtTeile(ausdruck, haut);
    const id = neueId("f");
    const hintergrund = opt.ohneHintergrund ? "" : `<circle cx="50" cy="50" r="49" fill="${opt.bg || "#efe0c0"}"/><circle cx="50" cy="50" r="49" fill="url(#${id}l)"/>`;
    let s = `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${id}l" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><clipPath id="${id}c"><circle cx="50" cy="50" r="49"/></clipPath></defs>${hintergrund}<g clip-path="url(#${id}c)">`;
    if (sp.typ === "rolle") s += T.acc(hemd);
    // Oberkörper
    s += `<path d="M14 104 Q16 78 36 74 L64 74 Q84 78 86 104Z" fill="${hemd}"/>`;
    if (T.hemdMuster === "tank") s += `<path d="M36 74 Q40 86 50 86 Q60 86 64 74" fill="${haut}"/>`; else s += `<path d="M42 74 L50 84 L58 74Z" fill="${haut}"/><path d="M40 74 L50 86 L60 74" stroke="#000" stroke-opacity=".18" stroke-width="2" fill="none"/>`;
    s += `<rect x="43" y="64" width="14" height="12" fill="${haut}"/><rect x="43" y="64" width="14" height="5" fill="#000" opacity=".08"/>`;
    // Haare hinten (lang)
    if (["lang", "bob", "wellig"].includes(A.frisur)) s += haarPfad(A.frisur, haar);
    // Kopf
    s += `<ellipse cx="27" cy="52" rx="5" ry="7" fill="${haut}"/><ellipse cx="73" cy="52" rx="5" ry="7" fill="${haut}"/>`;
    s += `<ellipse cx="50" cy="48" rx="23" ry="${A.kopf ? 25 : 26.5}" fill="${haut}"/><ellipse cx="50" cy="48" rx="23" ry="26" fill="url(#${id}l)"/>`;
    if (A.ohrring) s += `<circle cx="26" cy="61" r="2" fill="#e8b14e"/>`;
    if (A.sommersprossen) for (let i = 0; i < 7; i++) s += `<circle cx="${36 + (i % 4) * 2.6 + (i > 3 ? 21 : 0)}" cy="${57 + (i % 2) * 2}" r=".9" fill="#9c5a2a" opacity=".55"/>`;
    s += `<path d="M48 55 Q50 59 52 55" stroke="#000" stroke-opacity=".2" stroke-width="1.6" fill="none"/>`;
    s += g.augen + g.brauen;
    const bart = T.bart || A.bart;
    if (bart === "voll") s += `<path d="M30 54 Q32 80 50 82 Q68 80 70 54 Q66 70 58 68 Q50 72 42 68 Q34 70 30 54Z" fill="${haar}"/>`;
    s += g.mund;
    if (bart === "stoppel") s += `<path d="M34 62 Q50 82 66 62" stroke="${haar}" stroke-width="7" opacity=".22" fill="none"/>`;
    if (T.brille || A.brille) s += `<g fill="none" stroke="#2b1d12" stroke-width="2"><rect x="33" y="44" width="15" height="11" rx="4"/><rect x="52" y="44" width="15" height="11" rx="4"/><path d="M48 49 h4 M33 48 l-6 -2 M67 48 l6 -2"/></g><path d="M35 46 l4 0" stroke="#fff" stroke-opacity=".6"/>`;
    if (!["lang", "bob", "wellig"].includes(A.frisur)) s += haarPfad(A.frisur, haar);
    s += g.extra;
    if (sp.typ !== "rolle" && T.acc) s += T.acc(hemd);
    if (opt.krone) s += `<path d="M34 20 L38 8 L44 16 L50 4 L56 16 L62 8 L66 20Z" fill="#e8b14e" stroke="#8a5a10"/>`;
    s += "</g>";
    if (!opt.ohneRand) s += `<circle cx="50" cy="50" r="48" fill="none" stroke="${opt.rand || "#8a5a30"}" stroke-width="2.5"/>`;
    return s + "</svg>";
  }

  /* =====================================================================
     SZENENBILDER (oben auf der Karte) – viewBox 0 0 400 130
     ===================================================================== */
  const HIMMEL = {
    tag: [["#f6dca8", "#f2c98a"], ["#f3e3c0", "#e9c49a"], ["#f8e2b8", "#f0b98c"], ["#efe2c8", "#d9c4a0"]],
    abend: [["#f2a96a", "#c45a4a"], ["#e89a6a", "#8a4a5a"], ["#f0b070", "#a8506a"]],
    nacht: [["#2a1d2a", "#4a2f3e"], ["#1f1820", "#3e2b36"], ["#2b2026", "#56364a"]]
  };
  function himmel(r, zeit, id) {
    const p = HIMMEL[zeit][Math.floor(r() * HIMMEL[zeit].length)];
    let s = `<defs><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><radialGradient id="${id}g"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient></defs><rect width="400" height="130" fill="url(#${id}h)"/>`;
    const x = 40 + r() * 320, y = 18 + r() * 25;
    if (zeit === "nacht") { for (let i = 0; i < 40; i++) s += `<circle cx="${f1(r() * 400)}" cy="${f1(r() * 70)}" r="${f1(.4 + r() * 1.1)}" fill="#fff6dc" opacity="${f1(.4 + r() * .6)}"/>`; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="22" fill="url(#${id}g)"/><circle cx="${f1(x)}" cy="${f1(y)}" r="10" fill="#f6ecd3"/><circle cx="${f1(x + 4)}" cy="${f1(y - 2)}" r="9" fill="${p[0]}" opacity="${r() < .5 ? .9 : 0}"/>`; }
    else s += `<circle cx="${f1(x)}" cy="${f1(y + (zeit === "abend" ? 30 : 0))}" r="40" fill="url(#${id}g)"/><circle cx="${f1(x)}" cy="${f1(y + (zeit === "abend" ? 30 : 0))}" r="${zeit === "abend" ? 16 : 12}" fill="${zeit === "abend" ? "#ffd27a" : "#fff3cf"}"/>`;
    if (zeit !== "nacht" && r() < .7) for (let i = 0; i < 3; i++) { const cx = r() * 400, cy = 15 + r() * 30; s += `<g fill="#fff8e8" opacity=".55"><ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="22" ry="6"/><ellipse cx="${f1(cx + 12)}" cy="${f1(cy - 4)}" rx="14" ry="6"/></g>`; }
    return s;
  }
  const dunkler = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f)))); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); };
  function baum(x, y, h, farbe, art, r) {
    if (art === "nadel") { let s = `<rect x="${f1(x - 2)}" y="${f1(y - h * .2)}" width="4" height="${f1(h * .2)}" fill="#3b2a1a"/>`; for (let i = 0; i < 4; i++) { const w = h * (.42 - i * .08), yy = y - h * .15 - i * h * .2; s += `<path d="M${f1(x - w)} ${f1(yy)} L${f1(x)} ${f1(yy - h * .32)} L${f1(x + w)} ${f1(yy)}Z" fill="${farbe}"/>`; } return s; }
    if (art === "tot") return `<path d="M${f1(x)} ${f1(y)} L${f1(x)} ${f1(y - h)} M${f1(x)} ${f1(y - h * .6)} L${f1(x - h * .25)} ${f1(y - h * .85)} M${f1(x)} ${f1(y - h * .45)} L${f1(x + h * .3)} ${f1(y - h * .7)} M${f1(x - h * .15)} ${f1(y - h * .75)} L${f1(x - h * .3)} ${f1(y - h * .78)}" stroke="${farbe}" stroke-width="${f1(Math.max(1.5, h * .06))}" stroke-linecap="round" fill="none"/>`;
    let s = `<rect x="${f1(x - 2.5)}" y="${f1(y - h * .45)}" width="5" height="${f1(h * .45)}" fill="#4a3220"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${f1(x + (r() - .5) * h * .4)}" cy="${f1(y - h * .55 - r() * h * .3)}" r="${f1(h * (.18 + r() * .12))}" fill="${farbe}"/>`;
    return s;
  }
  function huegel(y, amp, farbe, r, glatt) { let d = `M0 130 L0 ${f1(y)}`; for (let x = 0; x <= 400; x += 40) d += ` Q${f1(x + 20)} ${f1(y - amp * (glatt ? .5 : r()))} ${x + 40} ${f1(y + (r() - .5) * amp * .6)}`; return `<path d="${d} L400 130Z" fill="${farbe}"/>`; }
  function fackel(x, y, id) { return `<rect x="${x - 2}" y="${y}" width="4" height="16" fill="#4a3220"/><circle cx="${x}" cy="${y - 4}" r="16" fill="url(#${id}f)"/><path d="M${x} ${y - 14} Q${x + 6} ${y - 4} ${x} ${y + 1} Q${x - 6} ${y - 4} ${x} ${y - 14}Z" fill="#ffb648"/><path d="M${x} ${y - 9} Q${x + 3} ${y - 3} ${x} ${y} Q${x - 3} ${y - 3} ${x} ${y - 9}Z" fill="#fff3cf"/>`; }
  const feuerGlut = id => `<radialGradient id="${id}f"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient>`;
  const SZENEN = {
    taverne(r, z, id) {
      let s = `<defs>${feuerGlut(id)}<linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c3d24"/><stop offset="1" stop-color="#3a2414"/></linearGradient></defs><rect width="400" height="130" fill="url(#${id}w)"/>`;
      for (let x = 0; x < 400; x += 26) s += `<rect x="${x}" y="0" width="25" height="130" fill="${dunkler("#5c3d24", .85 + r() * .3)}" opacity=".6"/>`;
      s += `<rect y="10" width="400" height="10" fill="#2b1a0e"/><rect y="55" width="400" height="6" fill="#2b1a0e" opacity=".7"/>`;
      const fx = r() < .5 ? 40 + r() * 60 : 280 + r() * 60;
      s += `<path d="M${f1(fx - 34)} 130 L${f1(fx - 34)} 70 Q${f1(fx)} 50 ${f1(fx + 34)} 70 L${f1(fx + 34)} 130Z" fill="#6e6458"/><path d="M${f1(fx - 22)} 130 L${f1(fx - 22)} 84 Q${f1(fx)} 70 ${f1(fx + 22)} 84 L${f1(fx + 22)} 130Z" fill="#1a1008"/><circle cx="${f1(fx)}" cy="112" r="40" fill="url(#${id}f)"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="M${f1(fx - 14 + i * 9)} 126 Q${f1(fx - 10 + i * 9)} ${f1(100 - r() * 14)} ${f1(fx - 5 + i * 9)} 126Z" fill="${["#ff7a3a", "#ffb648", "#ffd27a", "#e0442a"][i]}"/>`;
      const regal = fx < 200 ? 250 : 60;
      s += `<rect x="${regal}" y="30" width="110" height="4" fill="#2b1a0e"/><rect x="${regal}" y="48" width="110" height="4" fill="#2b1a0e"/>`;
      for (let i = 0; i < 9; i++) { const bx = regal + 6 + i * 12, hh = 8 + r() * 8; s += `<rect x="${f1(bx)}" y="${f1(30 - hh)}" width="6" height="${f1(hh)}" rx="2" fill="${["#7a2418", "#5f7a3a", "#c58a2c", "#4a3220", "#9c6a3a"][Math.floor(r() * 5)]}"/>`; }
      for (let i = 0; i < 3; i++) { const lx = 60 + i * 140 + r() * 30; s += `<path d="M${f1(lx)} 20 v12" stroke="#2b1a0e"/><path d="M${f1(lx - 6)} 32 h12 l-2 12 h-8Z" fill="#c58a2c"/><circle cx="${f1(lx)}" cy="40" r="14" fill="url(#${id}f)"/>`; }
      for (let i = 0; i < 3; i++) { const fx2 = (fx < 200 ? 180 : 40) + i * 46 + r() * 10; s += `<ellipse cx="${f1(fx2)}" cy="112" rx="16" ry="18" fill="#6b4a2c"/><path d="M${f1(fx2 - 16)} 104 h32 M${f1(fx2 - 16)} 120 h32" stroke="#3b2a1a" stroke-width="3"/>`; }
      s += `<rect x="0" y="118" width="400" height="12" fill="#2b1a0e"/>`;
      for (let i = 0; i < 5; i++) { const mx = 20 + r() * 360; s += `<rect x="${f1(mx)}" y="104" width="10" height="14" rx="1" fill="#c99a5a"/><path d="M${f1(mx + 10)} 107 q5 2 0 7" stroke="#c99a5a" stroke-width="2" fill="none"/><rect x="${f1(mx)}" y="102" width="10" height="4" fill="#fff6dc"/>`; }
      return s;
    },
    dungeon(r, z, id) {
      let s = `<defs>${feuerGlut(id)}</defs><rect width="400" height="130" fill="#2b2622"/>`;
      for (let y = 0; y < 130; y += 16) for (let x = -(y / 16 % 2) * 18; x < 400; x += 36) s += `<rect x="${f1(x + 1)}" y="${y + 1}" width="34" height="14" rx="2" fill="${dunkler("#5a524a", .75 + r() * .4)}"/>`;
      const tx = 130 + r() * 140;
      s += `<path d="M${f1(tx - 40)} 130 L${f1(tx - 40)} 60 Q${f1(tx)} 20 ${f1(tx + 40)} 60 L${f1(tx + 40)} 130Z" fill="#6a625a"/><path d="M${f1(tx - 30)} 130 L${f1(tx - 30)} 64 Q${f1(tx)} 32 ${f1(tx + 30)} 64 L${f1(tx + 30)} 130Z" fill="#0e0b09"/>`;
      if (r() < .5) s += `<circle cx="${f1(tx - 6)}" cy="92" r="2" fill="#ff7a3a"/><circle cx="${f1(tx + 6)}" cy="92" r="2" fill="#ff7a3a"/>`;
      s += fackel(f1(tx - 70), 54, id) + fackel(f1(tx + 70), 54, id);
      for (let i = 0; i < 2; i++) { const cx = r() < .5 ? 30 + r() * 60 : 310 + r() * 60; let k = ""; for (let j = 0; j < 7; j++) k += `<ellipse cx="${f1(cx)}" cy="${10 + j * 8}" rx="3" ry="4.5" fill="none" stroke="#8a8279" stroke-width="1.6"/>`; s += k; }
      s += `<rect y="120" width="400" height="10" fill="#1a1612"/>`;
      if (r() < .6) s += `<g fill="#e9e4dc"><circle cx="${f1(40 + r() * 320)}" cy="118" r="4"/><rect x="${f1(60 + r() * 280)}" y="116" width="14" height="3" rx="1.5"/></g>`;
      return s;
    },
    wald(r, z, id) {
      let s = himmel(r, z, id);
      const farben = z === "nacht" ? ["#3a3a2e", "#2b2c22", "#1e1f18"] : ["#a9c27a", "#6f8f3a", "#3f5424"];
      s += huegel(80, 20, farben[0], r);
      for (let i = 0; i < 14; i++) s += baum(r() * 400, 92, 30 + r() * 20, farben[0], r() < .5 ? "nadel" : "laub", r);
      s += huegel(100, 14, farben[1], r);
      for (let i = 0; i < 9; i++) s += baum(r() * 400, 116, 50 + r() * 30, farben[1], r() < .4 ? "nadel" : "laub", r);
      if (z !== "nacht") for (let i = 0; i < 4; i++) { const x = r() * 400; s += `<path d="M${f1(x)} 0 L${f1(x + 30)} 0 L${f1(x + 80)} 130 L${f1(x + 40)} 130Z" fill="#fff6d8" opacity=".12"/>`; }
      s += huegel(120, 8, farben[2], r, true);
      for (let i = 0; i < 5; i++) { const x = r() * 400; s += `<path d="M${f1(x)} 126 q4 -14 10 -2 q4 -12 8 2" stroke="${farben[1]}" stroke-width="2.5" fill="none"/>`; }
      if (r() < .5) { const x = 40 + r() * 320; s += `<path d="M${f1(x - 6)} 124 Q${f1(x)} 112 ${f1(x + 6)} 124Z" fill="#a83a32"/><rect x="${f1(x - 1.5)}" y="124" width="3" height="5" fill="#efe0c0"/><circle cx="${f1(x - 2)}" cy="119" r="1" fill="#fff"/>`; }
      return s;
    },
    schloss(r, z, id) {
      let s = himmel(r, z, id);
      s += `<path d="M0 100 L60 40 L110 80 L170 30 L230 85 L300 45 L360 90 L400 60 L400 130 L0 130Z" fill="${z === "nacht" ? "#3a2f36" : "#b8ab98"}"/>`;
      const cx = 120 + r() * 160, wand = z === "nacht" ? "#4a4038" : "#9c8f7a", dach = "#7a2418";
      s += `<rect x="${f1(cx - 60)}" y="64" width="120" height="50" fill="${wand}"/>`;
      for (let i = 0; i < 12; i++) s += `<rect x="${f1(cx - 60 + i * 10)}" y="58" width="6" height="7" fill="${wand}"/>`;
      [[-70, 40, 72], [70, 40, 72], [0, 26, 90]].forEach(([dx, w, h]) => { const tx = cx + dx; s += `<rect x="${f1(tx - w / 2 + 8)}" y="${f1(114 - h)}" width="${w - 16}" height="${h}" fill="${wand}"/><path d="M${f1(tx - w / 2 + 4)} ${f1(114 - h)} L${f1(tx)} ${f1(114 - h - 26)} L${f1(tx + w / 2 - 4)} ${f1(114 - h)}Z" fill="${dach}"/><path d="M${f1(tx)} ${f1(114 - h - 26)} v-12" stroke="#2b1d12"/><path d="M${f1(tx)} ${f1(114 - h - 38)} l12 4 l-12 4Z" fill="${r() < .5 ? "#e8b14e" : "#a83a32"}"/><rect x="${f1(tx - 3)}" y="${f1(114 - h + 18)}" width="6" height="10" rx="3" fill="${z === "nacht" ? "#ffd27a" : "#2b1d12"}"/>`; });
      s += `<path d="M${f1(cx - 12)} 114 v-18 q12 -14 24 0 v18Z" fill="#2b1d12"/>`;
      s += huegel(118, 6, z === "nacht" ? "#2b2c22" : "#7fa64a", r, true) + `<path d="M${f1(cx)} 118 Q${f1(cx + 40)} 124 ${f1(cx + 20)} 130" stroke="#c9a87a" stroke-width="6" fill="none"/>`;
      return s;
    },
    meer(r, z, id) {
      let s = himmel(r, z, id);
      const wasser = z === "nacht" ? "#2e3a34" : "#7f9c8a", w2 = z === "nacht" ? "#24302a" : "#5f7f6c";
      s += `<rect y="70" width="400" height="60" fill="${wasser}"/>`;
      if (r() < .6) s += `<path d="M${f1(20 + r() * 80)} 70 q30 -24 70 0Z" fill="${z === "nacht" ? "#2b2c22" : "#6f8f3a"}"/>`;
      const sx = 160 + r() * 140;
      s += `<path d="M${f1(sx - 50)} 86 L${f1(sx + 50)} 86 L${f1(sx + 36)} 102 L${f1(sx - 38)} 102Z" fill="#5c3d24"/><path d="M${f1(sx)} 86 V30" stroke="#3b2a1a" stroke-width="3"/><path d="M${f1(sx - 4)} 34 Q${f1(sx - 34)} 58 ${f1(sx - 4)} 80Z" fill="#f6ecd3"/><path d="M${f1(sx + 4)} 40 Q${f1(sx + 30)} 60 ${f1(sx + 4)} 80Z" fill="#efe0c0"/><path d="M${f1(sx)} 30 l14 4 l-14 4Z" fill="#a83a32"/>`;
      for (let i = 0; i < 9; i++) { const y = 90 + i * 5, x = r() * 400; s += `<path d="M${f1(x)} ${y} q10 -5 20 0 t20 0" stroke="${i % 2 ? "#f6ecd3" : w2}" stroke-width="2" fill="none" opacity=".7"/>`; }
      for (let i = 0; i < 3; i++) { const x = r() * 400, y = 20 + r() * 30; s += `<path d="M${f1(x)} ${f1(y)} q5 -5 10 0 q5 -5 10 0" stroke="#3b2a1a" stroke-width="1.6" fill="none"/>`; }
      return s;
    },
    berg(r, z, id) {
      let s = himmel(r, z, id);
      const pk = []; for (let i = 0; i < 5; i++) pk.push([i * 100 - 20 + r() * 40, 20 + r() * 30]);
      pk.forEach(([x, y]) => { s += `<path d="M${f1(x - 80)} 130 L${f1(x)} ${f1(y)} L${f1(x + 80)} 130Z" fill="${z === "nacht" ? "#3a2f36" : "#9c8f7a"}"/><path d="M${f1(x - 18)} ${f1(y + 22)} L${f1(x)} ${f1(y)} L${f1(x + 18)} ${f1(y + 22)} L${f1(x + 8)} ${f1(y + 16)} L${f1(x)} ${f1(y + 24)} L${f1(x - 8)} ${f1(y + 16)}Z" fill="#f6efe2"/>`; });
      s += huegel(100, 20, z === "nacht" ? "#2b2c22" : "#6f8f3a", r);
      for (let i = 0; i < 10; i++) s += baum(r() * 400, 120, 22 + r() * 16, z === "nacht" ? "#1e1f18" : "#3f5424", "nadel", r);
      if (r() < .6) { const x = 60 + r() * 280; s += `<path d="M${f1(x)} 30 q8 -6 16 0 q8 -6 16 0" stroke="#3b2a1a" stroke-width="2" fill="none"/>`; }
      return s;
    },
    stadt(r, z, id) {
      let s = himmel(r, z, id);
      let x = -10;
      while (x < 410) { const w = 30 + r() * 30, h = 40 + r() * 40, c = ["#c99a5a", "#d9b38a", "#b8846a", "#e2c8a0", "#a8704a"][Math.floor(r() * 5)]; s += `<rect x="${f1(x)}" y="${f1(116 - h)}" width="${f1(w)}" height="${f1(h)}" fill="${z === "nacht" ? dunkler(c, .45) : c}"/><path d="M${f1(x - 3)} ${f1(116 - h)} L${f1(x + w / 2)} ${f1(116 - h - 20)} L${f1(x + w + 3)} ${f1(116 - h)}Z" fill="${z === "nacht" ? "#3a1a14" : "#8f3f1a"}"/>`; for (let i = 0; i < 3; i++) s += `<rect x="${f1(x + 5 + (i % 2) * (w - 16))}" y="${f1(116 - h + 8 + Math.floor(i / 2) * 16)}" width="7" height="9" fill="${z === "nacht" ? (r() < .6 ? "#ffd27a" : "#2b1d12") : "#5c3d24"}"/>`; x += w; }
      if (r() < .7) { const tx = 60 + r() * 280; s += `<rect x="${f1(tx - 9)}" y="30" width="18" height="86" fill="${z === "nacht" ? "#4a4038" : "#b8ab98"}"/><path d="M${f1(tx - 12)} 30 L${f1(tx)} 6 L${f1(tx + 12)} 30Z" fill="#5f7a3a"/><circle cx="${f1(tx)}" cy="46" r="5" fill="#f6ecd3" stroke="#2b1d12"/>`; }
      for (let i = 0; i < 3; i++) { const mx = 30 + i * 130 + r() * 40; const c = ["#a83a32", "#c58a2c", "#5f7a3a"][i]; s += `<rect x="${f1(mx)}" y="104" width="44" height="14" fill="#6b4a2c"/>`; for (let j = 0; j < 4; j++) s += `<path d="M${f1(mx - 2 + j * 12)} 96 h12 v8 h-12Z" fill="${j % 2 ? c : "#f6ecd3"}"/>`; }
      s += `<path d="M0 30 Q100 48 200 32 T400 36" stroke="#3b2a1a" fill="none"/>`;
      for (let i = 0; i < 12; i++) s += `<path d="M${18 + i * 32} ${f1(36 + Math.sin(i) * 4)} l6 10 l6 -10Z" fill="${["#a83a32", "#e8b14e", "#5f7a3a"][i % 3]}"/>`;
      s += `<rect y="116" width="400" height="14" fill="#8a7a62"/>`;
      return s;
    },
    sumpf(r, z, id) {
      let s = himmel(r, z === "tag" ? "abend" : z, id);
      s += `<rect y="84" width="400" height="46" fill="#4a5032"/>`;
      for (let i = 0; i < 6; i++) s += baum(r() * 400, 96, 50 + r() * 30, "#2b2c22", "tot", r);
      for (let i = 0; i < 4; i++) s += `<ellipse cx="${f1(r() * 400)}" cy="${f1(100 + r() * 20)}" rx="${f1(30 + r() * 40)}" ry="4" fill="#6e6a4a" opacity=".7"/>`;
      for (let i = 0; i < 18; i++) { const x = r() * 400; s += `<path d="M${f1(x)} 130 q${f1((r() - .5) * 8)} -18 ${f1((r() - .5) * 6)} -28" stroke="#3f5424" stroke-width="2" fill="none"/>`; }
      for (let i = 0; i < 3; i++) s += `<rect y="${70 + i * 16}" width="400" height="10" fill="#efe9dc" opacity=".12"/>`;
      for (let i = 0; i < 4; i++) { const x = r() * 400, y = 70 + r() * 30; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="6" fill="#d8f0a0" opacity=".25"/><circle cx="${f1(x)}" cy="${f1(y)}" r="2" fill="#efffc8"/>`; }
      return s;
    },
    friedhof(r, z, id) {
      let s = himmel(r, "nacht", id);
      s += huegel(96, 18, "#2b2c22", r, true);
      s += baum(40 + r() * 320, 100, 80, "#1a1410", "tot", r);
      for (let i = 0; i < 7; i++) { const x = 20 + i * 55 + r() * 20, h = 14 + r() * 12; s += r() < .5 ? `<path d="M${f1(x - 7)} 118 v-${f1(h)} q7 -8 14 0 v${f1(h)}Z" fill="#8a8279"/>` : `<path d="M${f1(x - 1.5)} 118 v-${f1(h + 6)} M${f1(x - 6)} ${f1(118 - h)} h12" stroke="#8a8279" stroke-width="3.5"/>`; }
      for (let i = 0; i < 40; i++) s += `<path d="M${i * 10} 122 v-12 l2 -3 l2 3 v12" fill="#1a1410"/>`;
      s += `<rect y="104" width="400" height="12" fill="#efe9dc" opacity=".12"/>`;
      for (let i = 0; i < 2; i++) { const x = r() * 380, y = 20 + r() * 30; s += `<path d="M${f1(x)} ${f1(y)} q6 -6 12 0 q6 -6 12 0" stroke="#1a1410" stroke-width="2.4" fill="none"/>`; }
      return s;
    },
    tempel(r, z, id) {
      let s = himmel(r, z, id);
      s += `<path d="M60 40 L200 10 L340 40Z" fill="#e2d6be"/><rect x="60" y="40" width="280" height="8" fill="#cfc2a8"/>`;
      for (let i = 0; i < 6; i++) { const x = 76 + i * 50; s += `<rect x="${x}" y="48" width="16" height="62" fill="#efe6d4"/><rect x="${x - 3}" y="48" width="22" height="5" fill="#cfc2a8"/>`; }
      s += `<rect x="40" y="110" width="320" height="6" fill="#cfc2a8"/><rect x="30" y="116" width="340" height="6" fill="#bfb296"/><rect x="20" y="122" width="360" height="8" fill="#afa286"/>`;
      s += `<path d="M180 110 L200 60 L220 110Z" fill="#fff3cf" opacity=".35"/><circle cx="200" cy="74" r="10" fill="#ffd27a" opacity=".7"/>`;
      for (let i = 0; i < 2; i++) { const x = i ? 360 : 40; s += `<rect x="${x - 6}" y="96" width="12" height="14" fill="#6b4a2c"/><path d="M${x} 80 q8 10 0 16 q-8 -6 0 -16Z" fill="#ffb648"/>`; }
      return s;
    },
    wueste(r, z, id) {
      let s = himmel(r, z, id);
      s += `<path d="M${f1(80 + r() * 200)} 90 l50 -50 l50 50Z" fill="#d9b38a" opacity=".85"/>`;
      s += huegel(92, 22, "#e9c98a", r) + huegel(108, 18, "#d9a76a", r) + huegel(120, 10, "#c58a4a", r, true);
      for (let i = 0; i < 3; i++) { const x = r() * 400; s += `<rect x="${f1(x)}" y="96" width="8" height="${f1(10 + r() * 14)}" fill="#b8a07a"/>`; }
      return s;
    },
    schnee(r, z, id) {
      let s = himmel(r, z, id);
      s += huegel(84, 18, "#efe9dc", r) ;
      for (let i = 0; i < 12; i++) { const x = r() * 400, h = 34 + r() * 28; s += baum(x, 100, h, z === "nacht" ? "#2b3426" : "#4f6b2c", "nadel", r) + `<path d="M${f1(x - h * .3)} ${f1(100 - h * .2)} L${f1(x)} ${f1(100 - h * .45)} L${f1(x + h * .3)} ${f1(100 - h * .2)}" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`; }
      const hx = 60 + r() * 280; s += `<rect x="${f1(hx - 22)}" y="96" width="44" height="22" fill="#6b4a2c"/><path d="M${f1(hx - 28)} 96 L${f1(hx)} 76 L${f1(hx + 28)} 96Z" fill="#f6f2ea"/><rect x="${f1(hx - 6)}" y="102" width="10" height="9" fill="#ffd27a"/>`;
      s += `<rect y="116" width="400" height="14" fill="#f6f2ea"/>`;
      for (let i = 0; i < 60; i++) s += `<circle cx="${f1(r() * 400)}" cy="${f1(r() * 130)}" r="${f1(.6 + r() * 1.4)}" fill="#fff" opacity=".85"/>`;
      return s;
    },
    lager(r, z, id) {
      let s = `<defs>${feuerGlut(id)}</defs>` + himmel(r, "nacht", id).replace(/^<defs>/, "<defs>");
      for (let i = 0; i < 10; i++) s += baum(r() * 400, 100, 40 + r() * 30, "#1a1410", "nadel", r);
      s += `<rect y="100" width="400" height="30" fill="#2b2016"/>`;
      const fx = 150 + r() * 100;
      s += `<circle cx="${f1(fx)}" cy="108" r="60" fill="url(#${id}f)"/>`;
      [[-1, "#a83a32"], [1, "#c58a2c"]].forEach(([d, c]) => { const tx = fx + d * (70 + r() * 30); s += `<path d="M${f1(tx - 26)} 118 L${f1(tx)} 80 L${f1(tx + 26)} 118Z" fill="${c}"/><path d="M${f1(tx - 6)} 118 L${f1(tx)} 96 L${f1(tx + 6)} 118Z" fill="#1a1008"/>`; });
      s += `<path d="M${f1(fx - 16)} 120 l32 -6 M${f1(fx - 16)} 114 l32 6" stroke="#5c3d24" stroke-width="5" stroke-linecap="round"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="M${f1(fx - 10 + i * 6)} 116 Q${f1(fx - 6 + i * 6)} ${f1(92 - r() * 12)} ${f1(fx - 2 + i * 6)} 116Z" fill="${["#e0442a", "#ff7a3a", "#ffb648", "#ffd27a"][i]}"/>`;
      for (let i = 0; i < 12; i++) s += `<circle cx="${f1(fx + (r() - .5) * 40)}" cy="${f1(60 + r() * 40)}" r="1.2" fill="#ffd27a"/>`;
      return s;
    },
    krieg(r, z, id) {
      let s = himmel(r, "abend", id);
      for (let i = 0; i < 3; i++) { const x = r() * 400; s += `<path d="M${f1(x)} 100 Q${f1(x - 20)} 60 ${f1(x + 10)} 20 Q${f1(x + 30)} 60 ${f1(x + 14)} 100Z" fill="#4a3e3a" opacity=".5"/>`; }
      s += huegel(96, 16, "#5c4a32", r);
      for (let i = 0; i < 60; i++) { const x = i * 7 + r() * 4, y = 104 + r() * 6; s += `<path d="M${f1(x)} ${f1(y)} v-${f1(16 + r() * 10)}" stroke="#2b1d12" stroke-width="1.4"/><circle cx="${f1(x)}" cy="${f1(y + 2)}" r="3" fill="#2b1d12"/>`; }
      for (let i = 0; i < 4; i++) { const x = 30 + i * 100 + r() * 30; s += `<path d="M${f1(x)} 104 V60" stroke="#3b2a1a" stroke-width="2"/><path d="M${f1(x)} 60 h22 l-5 7 l5 7 h-22Z" fill="${["#a83a32", "#e8b14e", "#5f7a3a", "#7d4e8a"][i]}"/>`; }
      s += `<rect y="116" width="400" height="14" fill="#3b2a1a"/>`;
      return s;
    },
    tisch(r, z, id) {
      let s = `<rect width="400" height="130" fill="#d9c4a0"/>`;
      for (let x = 0; x < 400; x += 8) s += `<rect x="${x}" y="0" width="4" height="96" fill="#cdb48a" opacity=".5"/>`;
      const wx = 30 + r() * 80;
      s += `<rect x="${f1(wx)}" y="14" width="70" height="56" fill="${z === "nacht" ? "#2a1d2a" : "#f2d9a8"}" stroke="#6b4a2c" stroke-width="5"/><path d="M${f1(wx + 35)} 14 v56 M${f1(wx)} 42 h70" stroke="#6b4a2c" stroke-width="3"/>`;
      if (z === "nacht") s += `<circle cx="${f1(wx + 52)}" cy="26" r="5" fill="#f6ecd3"/>`;
      const bx = 250 + r() * 60;
      s += `<rect x="${f1(bx)}" y="10" width="90" height="86" fill="#6b4a2c"/>`;
      for (let j = 0; j < 3; j++) { s += `<rect x="${f1(bx)}" y="${36 + j * 28}" width="90" height="4" fill="#4a3220"/>`; let x = bx + 4; while (x < bx + 84) { const w = 5 + r() * 6, h = 14 + r() * 8; s += `<rect x="${f1(x)}" y="${f1(36 + j * 28 - h)}" width="${f1(w)}" height="${f1(h)}" fill="${["#a83a32", "#c58a2c", "#5f7a3a", "#7d4e8a", "#efe0c0", "#2f2a26"][Math.floor(r() * 6)]}"/>`; x += w + 1; } }
      s += `<path d="M${f1(wx + 110)} 20 v30" stroke="#2b1d12" stroke-width="1.5"/><path d="M${f1(wx + 96)} 50 h28 l-6 -14 h-16Z" fill="#c58a2c"/><circle cx="${f1(wx + 110)}" cy="56" r="26" fill="#ffd27a" opacity=".25"/>`;
      s += `<rect y="96" width="400" height="34" fill="#7a5233"/><rect y="96" width="400" height="5" fill="#8f6440"/>`;
      for (let i = 0; i < 4; i++) { const x = 40 + r() * 320; s += `<path d="M${f1(x)} 112 l7 -4 l7 4 v8 l-7 4 l-7 -4Z" fill="${["#efe0c0", "#a83a32", "#c58a2c", "#5f7a3a"][i]}" stroke="#2b1d12" stroke-width=".8"/>`; }
      s += `<rect x="${f1(150 + r() * 80)}" y="102" width="40" height="22" rx="2" fill="#fffdf4" transform="rotate(-6 200 110)"/>`;
      return s;
    },
    chat(r, z, id) {
      let s = `<defs><linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c3d24"/><stop offset="1" stop-color="#2b1a0e"/></linearGradient></defs><rect width="400" height="130" fill="url(#${id}c)"/>`;
      for (let i = 0; i < 9; i++) s += `<circle cx="${f1(r() * 400)}" cy="${f1(r() * 130)}" r="${f1(14 + r() * 30)}" fill="#ffd27a" opacity="${f1(.05 + r() * .08)}"/>`;
      const handy = (x, rot, schief) => {
        let t = `<g transform="translate(${x} 10) rotate(${rot})"><rect x="0" y="0" width="92" height="150" rx="12" fill="#1a1410"/><rect x="6" y="10" width="80" height="140" rx="6" fill="#f2e6cc"/><rect x="6" y="10" width="80" height="14" fill="#5f7a3a"/><circle cx="15" cy="17" r="3.5" fill="#efe0c0"/><rect x="22" y="14.5" width="36" height="4" rx="2" fill="#efe0c0"/>`;
        let y = 30;
        for (let i = 0; i < 5; i++) { const rechts = r() < .45, w = 26 + r() * 36, h = 9 + Math.floor(r() * 2) * 6; t += `<rect x="${f1(rechts ? 82 - w : 10)}" y="${y}" width="${f1(w)}" height="${h}" rx="4" fill="${rechts ? "#d8e6b8" : "#fffdf6"}"/>`; if (r() < .35) t += `<text x="${f1(rechts ? 82 - w / 2 : 10 + w / 2)}" y="${y + 7}" font-size="6" text-anchor="middle">${["❤", "🎲", "😂", "🍕", "📦", "🙌"][Math.floor(r() * 6)]}</text>`; y += h + 4; if (y > 100) break; }
        return t + "</g>";
      };
      s += handy(28 + r() * 30, -8, 0) + handy(282 + r() * 20, 7, 1);
      s += `<g fill="#e8b14e" opacity=".8"><path d="M170 34 q10 -10 20 0 q-10 14 -10 14 q0 0 -10 -14Z" transform="translate(0 0)"/><path d="M222 60 q8 -8 16 0 q-8 11 -8 11 q0 0 -8 -11Z"/></g>`;
      return s;
    },
    boss(r, z, id) {
      let s = `<defs><radialGradient id="${id}b" cx=".5" cy=".6" r=".7"><stop offset="0" stop-color="#a8302a"/><stop offset="1" stop-color="#140806"/></radialGradient></defs><rect width="400" height="130" fill="url(#${id}b)"/>`;
      for (let i = 0; i < 5; i++) { const x = 20 + i * 90; s += `<rect x="${x}" y="0" width="22" height="130" fill="#1a0e0a"/><rect x="${x - 4}" y="0" width="30" height="10" fill="#2b1610"/>`; }
      s += `<path d="M170 130 V60 Q170 36 200 30 Q230 36 230 60 V130Z" fill="#0a0504"/><path d="M160 70 L170 40 L180 62 L190 34 L200 58 L210 34 L220 62 L230 40 L240 70Z" fill="#2b1610"/>`;
      s += `<path d="M186 88 Q200 70 214 88 L218 130 H182Z" fill="#000"/><circle cx="194" cy="80" r="2.2" fill="#ff7a3a"/><circle cx="206" cy="80" r="2.2" fill="#ff7a3a"/>`;
      for (let i = 0; i < 20; i++) s += `<circle cx="${f1(r() * 400)}" cy="${f1(80 + r() * 50)}" r="${f1(.8 + r() * 1.6)}" fill="#ffb648" opacity="${f1(.3 + r() * .5)}"/>`;
      s += `<rect y="120" width="400" height="10" fill="#0a0504"/>`;
      return s;
    }
  };
  const SZENEN_LISTE = Object.keys(SZENEN);
  const ORT_ZU_SZENE = { taverne: "taverne", wald: "wald", dungeon: "dungeon", hoehle: "dungeon", stadt: "stadt", see: "meer", meer: "meer", sturm: "berg", regen: "wald", nacht: "lager", kampf: "krieg", friedhof: "friedhof", berg: "berg", schloss: "schloss", sumpf: "sumpf", feuer: "lager", lager: "lager", schnee: "schnee", wueste: "wueste", tempel: "tempel", geister: "friedhof", hof: "stadt", tisch: "tisch", markt: "stadt", hafen: "meer", fluss: "wald", schmiede: "stadt", kueche: "taverne", wiese: "wald", krieg: "krieg", ruine: "dungeon", zelt: "lager", muehle: "wald", boss: "boss", chat: "chat" };
  const SZENE_WORTE = [
    [/gruppenchat|whatsapp|nachricht|sprachnachricht|handy|foto aus|schreibt im chat|videoanruf/i, "chat"],
    [/pizza|chips|klingel|nachbar|session|mitbewohner|wohnzimmer|würfel rollt|charakterbogen|spieltisch|am tisch|katze|stromausfall|lieferdienst|kekse|regelbuch|termin/i, "tisch"],
    [/taverne|wirt|schenke|bier|met\b|kneipe|stammtisch/i, "taverne"],
    [/dungeon|gruft|kerker|gewölbe|falle|höhle|gang\b|verlies|mimik|katakombe/i, "dungeon"],
    [/friedhof|grab|geist|untot|gespenst|nekromant|skelett|ghul/i, "friedhof"],
    [/burg|schloss|thron|palast|könig|königin|hof\b|turnier|ball am hof/i, "schloss"],
    [/schiff|meer|hafen|pirat|see\b|kapitän|ozean|insel/i, "meer"],
    [/berg|pass\b|gipfel|alm|lawine|gämse/i, "berg"],
    [/stadt|markt|händler|gilde|gasse|dorf|bürgermeister|gericht/i, "stadt"],
    [/sumpf|moor|irrlicht/i, "sumpf"],
    [/tempel|priester|gott|göttin|segen|gebet|heilig/i, "tempel"],
    [/wüste|sand|düne/i, "wueste"],
    [/schnee|winter|eis\b|frost/i, "schnee"],
    [/lager|lagerfeuer|zelt|nachtwache|rast/i, "lager"],
    [/schlacht|armee|krieg|belagerung|söldner/i, "krieg"],
    [/wald|baum|lichtung|druide|wölfe|hirsch|pilz/i, "wald"]
  ];
  function szeneFuer(karte, text, sprecher, platz, boss) {
    if (boss) return "boss";
    if (karte && karte.ort && ORT_ZU_SZENE[karte.ort]) return ORT_ZU_SZENE[karte.ort];
    if (karte && karte.szene) return karte.szene;
    if (["tisch", "katze", "gast", "regelbuch"].includes(sprecher)) return "tisch";
    for (const [re, s] of SZENE_WORTE) if (re.test(text)) return s;
    return ORT_ZU_SZENE[platz] || "wald";
  }
  function banner(szene, seed, zeitWunsch) {
    const r = rng(seed);
    const zeit = zeitWunsch || (r() < .58 ? "tag" : r() < .55 ? "abend" : "nacht");
    const id = neueId("s");
    const f = SZENEN[szene] || (window.TNE_ORTSBILD && window.TNE_ORTSBILD.SZENEN[szene]) || SZENEN.wald;
    return `<svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${f(r, zeit, id)}<rect width="400" height="130" fill="url(#${id}v)"/><defs><radialGradient id="${id}v" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2b1d12" stop-opacity=".45"/></radialGradient></defs></svg>`;
  }

  /* =====================================================================
     KARTENRAHMEN je Sprecher
     ===================================================================== */
  function rahmen(typ, selten) {
    const ecke = (inhalt) => [[0, 0, 0], [100, 0, 90], [100, 140, 180], [0, 140, 270]].map(([x, y, rot]) => `<g transform="translate(${x} ${y}) rotate(${rot})">${inhalt}</g>`).join("");
    let s = "", farbe = "#8a5a30";
    switch (typ) {
      case "schurke": farbe = "#5a1a14"; s = ecke(`<path d="M2 2 L16 2 L2 16Z" fill="#3a0e0a"/><path d="M4 4 q8 2 8 10" stroke="#a83a32" stroke-width=".8" fill="none"/>`) + `<g transform="translate(86 128)"><circle r="7" fill="#8e2a20"/><circle r="5.2" fill="none" stroke="#5a1a14" stroke-width=".8"/><path d="M-2.5 -1.5 a2.5 2.5 0 1 1 5 0 v2 h-5Z" fill="#efe0c0"/><circle cx="-1" cy="-1.5" r=".7" fill="#5a1a14"/><circle cx="1" cy="-1.5" r=".7" fill="#5a1a14"/></g>`; break;
      case "gott": farbe = "#c58a2c"; s = ecke(`<path d="M2 2 h12 M2 2 v12" stroke="#e8b14e" stroke-width="1.4"/><circle cx="6" cy="6" r="2.4" fill="#e8b14e"/><path d="M6 6 l8 8" stroke="#e8b14e" stroke-width=".6"/>`) + `<g opacity=".25">${Array.from({ length: 16 }, (_, i) => `<path d="M50 70 L${f1(50 + Math.cos(i / 16 * 6.283) * 90)} ${f1(70 + Math.sin(i / 16 * 6.283) * 90)}" stroke="#e8b14e" stroke-width=".6"/>`).join("")}</g>`; break;
      case "katze": farbe = "#6b4a2c"; s = [[8, 10, 20], [92, 16, -20], [10, 128, 10], [88, 130, -15], [50, 134, 0]].map(([x, y, rot]) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(.55)" fill="#6b4a2c" opacity=".55"><ellipse cy="3" rx="5" ry="4"/><ellipse cx="-5" cy="-4" rx="2" ry="2.6"/><ellipse cx="-1.8" cy="-7" rx="2" ry="2.6"/><ellipse cx="1.8" cy="-7" rx="2" ry="2.6"/><ellipse cx="5" cy="-4" rx="2" ry="2.6"/></g>`).join(""); break;
      case "wuerfel": farbe = "#7b3b1d"; s = ecke(`<rect x="3" y="3" width="11" height="11" rx="2" fill="#efe0c0" stroke="#7b3b1d" stroke-width=".8"/><circle cx="6" cy="6" r="1" fill="#7b3b1d"/><circle cx="8.5" cy="8.5" r="1" fill="#7b3b1d"/><circle cx="11" cy="11" r="1" fill="#7b3b1d"/>`); break;
      case "welt": farbe = "#5f7a3a"; s = `<g transform="translate(88 14)" opacity=".7"><circle r="8" fill="none" stroke="#5f7a3a" stroke-width=".8"/><path d="M0 -10 L2 0 L0 10 L-2 0Z" fill="#a83a32"/><path d="M-10 0 L0 2 L10 0 L0 -2Z" fill="#5f7a3a"/><text y="-11" font-size="4" text-anchor="middle" fill="#3f5424">N</text></g><path d="M6 134 q20 -6 30 2 t30 -2 t30 4" stroke="#5f7a3a" stroke-width=".7" fill="none" stroke-dasharray="2 2"/>`; break;
      case "tisch": farbe = "#c58a2c"; s = `<rect x="38" y="-3" width="24" height="8" fill="rgba(197,138,44,.55)" transform="rotate(-4 50 1)"/>` + Array.from({ length: 13 }, (_, i) => `<path d="M6 ${30 + i * 8} H94" stroke="#a8c08a" stroke-width=".4" opacity=".6"/>`).join("") + `<path d="M14 4 V136" stroke="#d77f74" stroke-width=".5"/>`; break;
      case "gast": farbe = "#8a5a30"; s = `<g transform="translate(80 6)"><rect width="14" height="17" fill="#efe0c0" stroke="#a83a32" stroke-width=".6" stroke-dasharray="1 .6"/><path d="M3 12 q4 -8 8 0" stroke="#a83a32" stroke-width=".8" fill="none"/></g><g transform="translate(68 14) rotate(-14)" opacity=".5"><circle r="7" fill="none" stroke="#5c3d24" stroke-width=".6"/><text y="1.5" font-size="3.4" text-anchor="middle" fill="#5c3d24">POST</text></g>`; break;
      case "regelbuch": farbe = "#7a2418"; s = `<path d="M8 10 H92" stroke="#7a2418" stroke-width=".7"/><path d="M8 12 H92" stroke="#7a2418" stroke-width=".3"/><text x="92" y="136" font-size="4.5" text-anchor="end" fill="#7a2418" font-family="serif">S. ${Math.floor(Math.random() * 300 + 10)}</text><text x="8" y="8" font-size="3.5" fill="#7a2418" font-family="serif" letter-spacing=".4">KAPITEL ${Math.floor(Math.random() * 12 + 1)}</text>`; break;
      case "geist": farbe = "#9a8f80"; s = `<path d="M0 30 Q20 20 10 50 Q0 80 14 100" stroke="#fff" stroke-width="3" opacity=".35" fill="none"/><path d="M100 50 Q84 70 96 100 Q104 120 90 136" stroke="#fff" stroke-width="3" opacity=".3" fill="none"/>`; break;
      case "sl": farbe = "#5c3d24"; s = `<rect x="3" y="3" width="94" height="134" rx="5" fill="none" stroke="#5c3d24" stroke-width=".7" stroke-dasharray="2.4 1.6"/>`; break;
      case "npc": farbe = "#8a5a30"; s = `<path d="M50 -2 Q48 6 50 10" stroke="#8a5a30" stroke-width=".7" fill="none"/><circle cx="50" cy="10" r="1.6" fill="#c58a2c"/>`; break;
      case "boss": farbe = "#8e2a20"; s = ecke(`<path d="M2 2 L18 2 L2 18Z" fill="#8e2a20"/><path d="M2 26 q3 -8 0 -12 q4 4 4 10" fill="#ff7a3a" opacity=".8"/>`); break;
      default: s = ecke(`<path d="M3 14 V3 H14" stroke="#8a5a30" stroke-width=".9" fill="none"/><circle cx="3" cy="3" r="1.4" fill="#8a5a30"/>`);
    }
    if (selten) s += `<rect x="2.5" y="2.5" width="95" height="135" rx="4" fill="none" stroke="#e8b14e" stroke-width="1.6"/><rect x="4.6" y="4.6" width="90.8" height="130.8" rx="3" fill="none" stroke="#fff3cf" stroke-width=".5"/>` + ecke(`<path d="M5 5 l5 0 l-5 5Z" fill="#e8b14e"/><circle cx="9" cy="9" r="1.4" fill="#a83a32"/>`);
    return `<svg class="rahmen" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="5" fill="none" stroke="${farbe}" stroke-width=".8" opacity=".55"/>${s}</svg>`;
  }

  /* =====================================================================
     SPIELTISCH (Hintergrund, von oben gesehen)
     ===================================================================== */
  function holz(W, H, r, id) {
    let s = `<defs><linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a3a22"/><stop offset=".5" stop-color="#4a2f1b"/><stop offset="1" stop-color="#3a2414"/></linearGradient><radialGradient id="${id}k" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffb648" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient><radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}t)"/>`;
    const breite = 120;
    for (let x = 0; x < W; x += breite) {
      s += `<rect x="${x}" y="0" width="${breite - 3}" height="${H}" fill="${dunkler("#5a3a22", .82 + r() * .32)}" opacity=".55"/><rect x="${x + breite - 3}" y="0" width="3" height="${H}" fill="#24160c" opacity=".7"/>`;
      for (let j = 0; j < 7; j++) { const gx = x + 8 + r() * (breite - 16); let d = `M${f1(gx)} 0`; for (let y = 0; y < H; y += 60) d += ` Q${f1(gx + (r() - .5) * 14)} ${y + 30} ${f1(gx + (r() - .5) * 6)} ${y + 60}`; s += `<path d="${d}" stroke="#2b1a0e" stroke-width="${f1(.6 + r() * 1.2)}" fill="none" opacity="${f1(.18 + r() * .2)}"/>`; }
      if (r() < .6) { const ax = x + 20 + r() * 80, ay = r() * H; s += `<ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="7" ry="11" fill="#2b1a0e" opacity=".45"/><ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="12" ry="18" fill="none" stroke="#2b1a0e" stroke-width="1" opacity=".25"/>`; }
    }
    return s;
  }
  const G = (x, y, s, rot, inhalt, extra) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot || 0)}) scale(${f1(s)})"${extra || ""}>${inhalt}</g>`;
  const DING = {
    kerze(p) { const h = 18 + 62 * p.rest; return `<ellipse cx="0" cy="0" rx="34" ry="34" fill="#8a7a62"/><ellipse cx="0" cy="0" rx="28" ry="28" fill="#a8977a"/><ellipse cx="0" cy="0" rx="20" ry="20" fill="#efe6d0"/><ellipse cx="0" cy="0" rx="20" ry="20" fill="none" stroke="#d9cdb0" stroke-width="${f1(80 / h)}"/>` + (p.rest > .02 ? `<circle r="${f1(40 + h * .4)}" fill="url(#glut)"/><ellipse cx="2" cy="-2" rx="4" ry="6" fill="#ffd27a"><animate attributeName="ry" values="6;7.5;5.5;6" dur="1.4s" repeatCount="indefinite"/></ellipse><circle cx="2" cy="-2" r="2.4" fill="#fff6dc"/>` : `<path d="M0 -4 q6 -14 -2 -28" stroke="#9c9488" stroke-width="2" fill="none" opacity=".6"/>`) + `<path d="M14 6 q4 8 2 14" stroke="#efe6d0" stroke-width="4" stroke-linecap="round"/>`; },
    pizza(p) { const offen = p.offen; let s = `<rect x="-60" y="-60" width="120" height="120" rx="4" fill="#d9b88a" stroke="#a8875a" stroke-width="2"/>`; if (offen) { s += `<circle r="50" fill="#e9b45a"/><circle r="44" fill="#c0442f"/>`; for (let i = 0; i < 9; i++) s += `<circle cx="${f1(Math.cos(i) * 26)}" cy="${f1(Math.sin(i * 1.7) * 26)}" r="6" fill="#8e2a20"/>`; for (let i = 0; i < 14; i++) s += `<circle cx="${f1(Math.cos(i * 2.1) * 34)}" cy="${f1(Math.sin(i * 1.3) * 34)}" r="3" fill="#f6ecd3"/>`; s += `<path d="M0 0 L50 0 A50 50 0 0 1 35 35Z" fill="#d9b88a"/>`; } else s += `<rect x="-50" y="-50" width="100" height="100" fill="none" stroke="#a8875a"/><text y="8" font-size="22" text-anchor="middle" fill="#a83a32" font-family="serif" font-weight="700">PIZZA</text><circle cx="0" cy="-28" r="8" fill="none" stroke="#a83a32" stroke-width="2"/>`; return s; },
    chips() { return `<path d="M-30 -42 L30 -42 L36 40 Q0 50 -36 40Z" fill="#c58a2c" stroke="#8a5a10" stroke-width="2"/><path d="M-30 -42 L30 -42 L28 -30 L-28 -30Z" fill="#a83a32"/><ellipse cx="0" cy="4" rx="18" ry="13" fill="#e8b14e"/><text y="10" font-size="13" text-anchor="middle" fill="#7a2418" font-weight="800">CHIPS</text><g fill="#f2c25a">${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${-50 + i * 22}" cy="${54 + (i % 2) * 8}" rx="7" ry="5" transform="rotate(${i * 30} ${-50 + i * 22} ${54 + (i % 2) * 8})"/>`).join("")}</g>`; },
    becher(p) { return `<circle r="22" fill="${p.farbe || "#a83a32"}"/><circle r="18" fill="${p.leer ? "#3a2414" : "#5c2a14"}"/>${p.leer ? "" : `<circle r="18" fill="#8a4a1a" opacity=".6"/><ellipse cx="-5" cy="-6" rx="5" ry="3" fill="#fff" opacity=".2"/>`}<path d="M22 -6 q12 6 0 12" stroke="${p.farbe || "#a83a32"}" stroke-width="5" fill="none"/>`; },
    krug(p) { return `<circle r="24" fill="#8a8279"/><circle r="20" fill="${p.leer ? "#4a3e36" : "#e8b14e"}"/>${p.leer ? "" : `<circle r="20" fill="#fff6dc" opacity=".6"/><circle cx="-6" cy="-4" r="4" fill="#fff"/><circle cx="5" cy="3" r="3" fill="#fff"/>`}<path d="M24 -8 h10 v16 h-10" stroke="#8a8279" stroke-width="6" fill="none"/>`; },
    brezn() { return `<path d="M-30 10 Q-34 -26 0 -18 Q34 -26 30 10 Q24 28 0 6 Q-24 28 -30 10Z M-10 -2 Q0 12 10 -2" fill="none" stroke="#9c5a1a" stroke-width="12" stroke-linecap="round"/><g fill="#fff">${Array.from({ length: 9 }, (_, i) => `<circle cx="${f1(-24 + i * 6)}" cy="${f1(Math.sin(i * 2) * 10 - 4)}" r="1.4"/>`).join("")}</g>`; },
    regelbuch(p) { let s = ""; for (let i = 0; i < p.n; i++) { const c = ["#7a2418", "#5f7a3a", "#5c3d24", "#7d4e8a", "#c58a2c"][i % 5]; s += `<g transform="translate(${(i % 2) * 6 - 3} ${-i * 7}) rotate(${(i % 3 - 1) * 6})"><rect x="-55" y="-40" width="110" height="80" rx="3" fill="${c}" stroke="#2b1d12" stroke-width="1.5"/><rect x="-44" y="-30" width="88" height="20" rx="2" fill="#e8b14e" opacity=".85"/><path d="M-44 4 h70 M-44 14 h60" stroke="#efe0c0" stroke-width="2.5" opacity=".7"/><rect x="50" y="-38" width="4" height="76" fill="#efe0c0" opacity=".7"/></g>`; } return s; },
    rechner() { return `<rect x="-26" y="-36" width="52" height="72" rx="5" fill="#2f2a26"/><rect x="-20" y="-30" width="40" height="14" fill="#c8d68f"/><text x="16" y="-19" font-size="10" text-anchor="end" fill="#2b1d12" font-family="monospace">193</text>${Array.from({ length: 12 }, (_, i) => `<rect x="${-20 + (i % 3) * 14}" y="${-10 + Math.floor(i / 3) * 11}" width="11" height="8" rx="1.5" fill="#8a8279"/>`).join("")}`; },
    muenzen(p) { let s = ""; const r = rng(p.seed); for (let i = 0; i < p.n; i++) { const x = (r() - .5) * 70, y = (r() - .5) * 50; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="11" fill="#e8b14e" stroke="#8a5a10" stroke-width="1.5"/><circle cx="${f1(x)}" cy="${f1(y)}" r="7" fill="none" stroke="#c58a2c"/>`; } return s; },
    mini(p) { const c = p.farbe; if (p.liegt) return `<ellipse rx="16" ry="16" fill="#2f2a26"/><g transform="rotate(${p.rot || 70}) translate(10 0)"><ellipse rx="22" ry="9" fill="${c}"/><circle cx="20" r="8" fill="${c}"/></g>`; return `<circle r="17" fill="#2f2a26"/><circle r="14" fill="#3e3630"/><circle r="10" fill="${c}"/><circle cy="-2" r="6" fill="${dunkler(c, 1.25)}"/><path d="M-12 6 L12 6" stroke="#2b1d12" stroke-width="2"/>`; },
    pokal() { return `<circle r="26" fill="#c58a2c"/><circle r="20" fill="#e8b14e"/><circle r="12" fill="#8a5a10"/><circle cx="-6" cy="-6" r="4" fill="#fff6dc" opacity=".8"/>`; },
    krone() { return `<circle r="26" fill="#c58a2c" opacity=".35"/><path d="M-24 10 L-28 -14 L-14 -2 L0 -20 L14 -2 L28 -14 L24 10Z" fill="#e8b14e" stroke="#8a5a10" stroke-width="2"/><circle cx="0" cy="2" r="4" fill="#a83a32"/>`; },
    sanduhr(p) { const oben = p.anteil, unten = 1 - p.anteil; return `<rect x="-30" y="-48" width="60" height="8" rx="3" fill="#5c3d24"/><rect x="-30" y="40" width="60" height="8" rx="3" fill="#5c3d24"/><path d="M-24 -40 Q-24 -6 0 0 Q-24 6 -24 40 H24 Q24 6 0 0 Q24 -6 24 -40Z" fill="#f6ecd3" opacity=".45" stroke="#c9b48a"/><path d="M${f1(-22 * oben)} ${f1(-4 - 34 * oben)} Q0 ${f1(-2 - 34 * oben)} ${f1(22 * oben)} ${f1(-4 - 34 * oben)} L0 -1Z" fill="#e8b14e"/><path d="M-22 38 Q0 ${f1(38 - 36 * unten)} 22 38Z" fill="#e8b14e"/><path d="M0 0 V${f1(38 - 30 * unten)}" stroke="#e8b14e" stroke-width="1.5"/>`; },
    bogen(p) { let s = `<rect x="-60" y="-80" width="120" height="160" rx="3" fill="#fffdf4" stroke="#cdbb94"/><rect x="-60" y="-80" width="120" height="22" fill="${p.farbe}" opacity=".85"/><text x="0" y="-64" font-size="11" text-anchor="middle" fill="#fff" font-family="serif" font-weight="700">${p.name}</text>`; for (let i = 0; i < 6; i++) s += `<rect x="-52" y="${-50 + i * 20}" width="22" height="16" rx="2" fill="none" stroke="#8a7a62"/><path d="M-24 ${-40 + i * 20} h${f1(30 + (i * 7) % 40)}" stroke="#8a7a62" stroke-width="1.4"/>`; s += `<path d="M-10 70 l50 -30" stroke="#c58a2c" stroke-width="6" stroke-linecap="round"/><path d="M40 40 l6 -4" stroke="#2b1d12" stroke-width="4"/>`; if (p.tot) s += `<path d="M-50 -40 L50 60 M50 -40 L-50 60" stroke="#a83a32" stroke-width="3" opacity=".55"/>`; return s; },
    wuerfel(p) { return `<path d="M0 -14 L13 -7 L13 7 L0 14 L-13 7 L-13 -7Z" fill="${p.farbe}" stroke="${p.rand}" stroke-width="1.6"/><path d="M0 -14 L0 14 M-13 -7 L13 7 M13 -7 L-13 7" stroke="${p.rand}" stroke-width=".7" opacity=".5"/><text y="4" font-size="9" text-anchor="middle" fill="${p.rand}" font-weight="800">${p.zahl}</text>`; },
    handy(p) { return `<rect x="-20" y="-38" width="40" height="76" rx="7" fill="#1a1410"/><rect x="-16" y="-32" width="32" height="62" rx="3" fill="${p.an ? "#ffd27a" : "#2b2622"}"/>${p.an ? `<circle r="70" fill="url(#glut2)"/><rect x="-12" y="-26" width="24" height="6" rx="2" fill="#c58a2c"/><rect x="-12" y="-16" width="18" height="5" rx="2" fill="#fff6dc"/><rect x="-12" y="-8" width="22" height="5" rx="2" fill="#fff6dc"/>` : ""}`; },
    karte() { return `<rect x="-90" y="-60" width="180" height="120" fill="#e9d7ad" stroke="#a8875a"/><path d="M-70 30 Q-40 -20 0 10 T70 -20" stroke="#a83a32" stroke-width="2" stroke-dasharray="5 4" fill="none"/><path d="M-60 -30 l10 -14 l10 14Z M-30 -36 l8 -10 l8 10Z" fill="#6b4a2c"/><circle cx="50" cy="-30" r="10" fill="#5f7a3a" opacity=".6"/><text x="60" y="40" font-size="20" fill="#a83a32" font-weight="800">✕</text><rect x="-96" y="-66" width="10" height="132" rx="5" fill="#d9c49a"/><rect x="86" y="-66" width="10" height="132" rx="5" fill="#d9c49a"/>`; },
    kruemel(p) { const r = rng(p.seed); let s = ""; for (let i = 0; i < p.n; i++) s += `<circle cx="${f1((r() - .5) * p.flaeche)}" cy="${f1((r() - .5) * p.flaeche * .6)}" r="${f1(1 + r() * 2.4)}" fill="${["#e8b14e", "#c58a2c", "#f2c25a"][i % 3]}" opacity=".8"/>`; return s; },
    katze(p) { return p.schlaeft ? `<ellipse rx="58" ry="44" fill="${p.farbe}"/><path d="M-50 10 Q-60 50 0 48 Q40 46 46 20" stroke="${p.farbe}" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="30" cy="-24" r="22" fill="${p.farbe}"/><path d="M16 -40 l-6 -14 l14 6Z M40 -42 l6 -14 l-14 4Z" fill="${p.farbe}"/><path d="M22 -24 q4 3 8 0 M34 -24 q4 3 8 0" stroke="#1a1410" stroke-width="1.8" fill="none"/>${Array.from({ length: 5 }, (_, i) => `<path d="M${-40 + i * 16} -30 q4 10 0 20" stroke="#000" stroke-width="3" opacity=".15" fill="none"/>`).join("")}` : ""; },
    drache() { return `<path d="M0 30 Q-30 20 -26 -4 Q-20 -30 6 -26 Q30 -22 28 4" fill="#7fa64a" stroke="#3f5424" stroke-width="2"/><circle cx="14" cy="-14" r="10" fill="#7fa64a" stroke="#3f5424" stroke-width="2"/><circle cx="17" cy="-16" r="2" fill="#1a1410"/><path d="M-10 -10 L-34 -34 L-20 -6Z" fill="#a9c27a" stroke="#3f5424"/><path d="M26 6 q14 8 6 22" stroke="#7fa64a" stroke-width="6" fill="none" stroke-linecap="round"/>`; },
    notizbuch() { return `<rect x="-60" y="-80" width="120" height="160" rx="4" fill="#5c3d24"/><rect x="-54" y="-74" width="108" height="148" fill="#f4ead2"/>${Array.from({ length: 12 }, (_, i) => `<path d="M-46 ${-60 + i * 11} h${f1(60 + (i * 13) % 30)}" stroke="#8a7a62" stroke-width="1"/>`).join("")}<path d="M-30 -66 q10 4 20 0" stroke="#a83a32" stroke-width="2" fill="none"/><rect x="50" y="-80" width="6" height="40" fill="#a83a32"/>`; },
    schirm(p) { let s = ""; for (let i = 0; i < 3; i++) s += `<g transform="translate(${(i - 1) * 120} ${i === 1 ? 0 : 10}) rotate(${(i - 1) * 8})"><rect x="-58" y="-30" width="116" height="60" fill="#5b3a22" stroke="#e8b14e" stroke-width="3"/><path d="M-46 -14 h70 M-46 0 h56 M-46 14 h64" stroke="#e8b14e" stroke-width="2.5" opacity=".45"/></g>`; return s + (p.boss ? `<circle r="140" fill="url(#bossglut)"/>` : ""); },
    luftschlange(p) { const r = rng(p.seed); let s = ""; for (let i = 0; i < 6; i++) { let d = `M${f1((r() - .5) * 160)} ${f1((r() - .5) * 100)}`; for (let j = 0; j < 4; j++) d += ` q${f1((r() - .5) * 60)} ${f1(20 + r() * 20)} ${f1((r() - .5) * 60)} ${f1(30 + r() * 20)}`; s += `<path d="${d}" stroke="${["#a83a32", "#e8b14e", "#5f7a3a", "#c46a8a", "#7d4e8a"][i % 5]}" stroke-width="5" fill="none" stroke-linecap="round"/>`; } return s; },
    papier(p) { return `<rect x="-50" y="-36" width="100" height="72" fill="#fffdf4" stroke="#cdbb94"/><path d="M-40 -20 h80 M-40 -8 h60 M-40 4 h70 M-40 16 h40" stroke="#8a7a62" stroke-width="1.4"/><rect x="-46" y="-32" width="14" height="10" fill="#a83a32" opacity=".5"/>`; }
  };
  /* zustand: { W, H, karte:{x,y,w,h}, balken:{m,l,s,t}, fortschritt 0..1, spieler:[{name,typ,laune,farbe,tot}], seed, boss, katze, wuerfelSet } */
  function tisch(z) {
    const W = Math.max(320, Math.round(z.W)), H = Math.max(240, Math.round(z.H));
    const r = rng(z.seed), id = neueId("t");
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><defs><radialGradient id="glut"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a3a" stop-opacity="0"/></radialGradient><radialGradient id="glut2"><stop offset="0" stop-color="#ffd27a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient><radialGradient id="bossglut"><stop offset="0" stop-color="#e0442a" stop-opacity=".5"/><stop offset="1" stop-color="#e0442a" stop-opacity="0"/></radialGradient></defs>`;
    const OB = window.TNE_ORTSBILD, ortT = z.ort && OB ? OB.tischOrt(W, H, r, id, z.ort, z.zustand) : null;
    s += (ortT && ortT.flaeche) || holz(W, H, r, id);
    // Ablageflächen: links/rechts der Karte, oben/unten
    const k = z.karte; const links = Math.max(40, k.x), rechts = Math.max(40, W - k.x - k.w);
    const sc = Math.max(.42, Math.min(1, Math.min(links, rechts) / 230 + .25));
    const L = (fx, fy) => [Math.max(10, k.x - links * fx), H * fy];
    const R = (fx, fy) => [Math.min(W - 10, k.x + k.w + rechts * fx), H * fy];
    const B = z.balken, plaetze = [];
    // Kleinkram des Spielorts liegt ganz unten (Teekanne, Bierdeckel, Fahrkarte …)
    if (ortT) { const pos = [L(.16, .07), R(.86, .07), L(.86, .44), R(.14, .68), L(.6, .95), R(.6, .97)]; ortT.deko.forEach((art, i) => { if (OB.DEKO[art] && pos[i]) plaetze.push(["_" + art, pos[i][0], pos[i][1], .85, (r() - .5) * 40, {}]); }); }
    // Kerze
    plaetze.push(["kerze", ...L(.55, .18), 1.1, 0, { rest: 1 - z.fortschritt }]);
    // Charakterbögen der Spieler neben der Karte
    const sp = z.spieler || [];
    sp.forEach((p, i) => { const links2 = i % 2 === 0, j = Math.floor(i / 2); const [x, y] = links2 ? L(.38 + (j % 2) * .3, .3 + j * .17) : R(.35 + (j % 2) * .3, .5 + j * .14); plaetze.push(["bogen", x, y, .62, (r() - .5) * 26, { name: p.name, farbe: p.farbe, tot: p.tot }]); if (p.handy) plaetze.push(["handy", x + 50 * sc, y + 40 * sc, .7, 20, { an: true }]); });
    // Karte / Notizbuch
    plaetze.push([r() < .5 ? "karte" : "notizbuch", ...R(.5, .16), .8, (r() - .5) * 20, {}]);
    // Spaß → Pizza, Chips, Luftschlangen
    const pizzen = Math.floor(B.s / 30);
    for (let i = 0; i < pizzen; i++) plaetze.push(["pizza", ...L(.5 + (i % 2) * .15, .48 + i * .05), .85, (r() - .5) * 30, { offen: i === pizzen - 1 }]);
    plaetze.push(["chips", ...R(.55, .44), .9, (r() - .5) * 50, {}]);
    if (B.s > 78) plaetze.push(["luftschlange", ...R(.45, .62), 1, 0, { seed: z.seed + 3 }]);
    if (r() < .55) plaetze.push(["brezn", ...L(.25, .36), .9, r() * 60, {}]);
    // Realismus → Regelbücher, Rechner, Papierkram
    plaetze.push(["regelbuch", ...R(.4, .78), .85, (r() - .5) * 20, { n: 1 + Math.floor(B.l / 22) }]);
    if (B.l > 70) { plaetze.push(["rechner", ...R(.8, .62), .9, 12, {}]); plaetze.push(["papier", ...L(.75, .7), .9, -8, {}]); plaetze.push(["papier", ...L(.62, .74), .9, 14, {}]); }
    // Macht → Minis stehen/liegen, Münzen, Pokal/Krone
    const minis = 3 + Math.floor(r() * 3);
    for (let i = 0; i < minis; i++) plaetze.push(["mini", ...L(.25 + (i % 3) * .2, .62 + Math.floor(i / 3) * .08), .9, 0, { farbe: ["#a83a32", "#5f7a3a", "#7d4e8a", "#c58a2c", "#8a8279"][i % 5], liegt: B.m < 28 && i % 2 === 0, rot: r() * 360 }]);
    plaetze.push(["muenzen", ...L(.3, .84), 1, 0, { n: 2 + Math.floor(B.m / 9), seed: z.seed + 1 }]);
    if (B.m > 72) plaetze.push([B.m > 86 ? "krone" : "pokal", ...L(.7, .86), 1, 0, {}]);
    // Tempo → Sanduhr
    plaetze.push(["sanduhr", ...R(.82, .3), .9, 0, { anteil: 1 - B.t / 100 }]);
    // Getränke
    const getraenke = 2 + Math.floor(z.fortschritt * 3);
    for (let i = 0; i < getraenke; i++) plaetze.push([r() < .5 ? "becher" : "krug", ...(i % 2 ? R(.25 + r() * .5, .1 + r() * .8) : L(.15 + r() * .6, .1 + r() * .8)), .8, r() * 360, { farbe: ["#a83a32", "#5f7a3a", "#c58a2c", "#7d4e8a"][i % 4], leer: r() < z.fortschritt }]);
    // Krümel
    plaetze.push(["kruemel", ...L(.5, .5), 1, 0, { n: Math.floor(10 + z.fortschritt * 70 + B.s / 3), flaeche: Math.max(80, links * 1.4), seed: z.seed + 7 }]);
    plaetze.push(["kruemel", ...R(.5, .55), 1, 0, { n: Math.floor(8 + z.fortschritt * 50), flaeche: Math.max(80, rechts * 1.4), seed: z.seed + 9 }]);
    // Katze
    if (z.katze) plaetze.push(["katze", ...R(.6, .9), .9, -20, { schlaeft: true, farbe: "#3a2a1e" }]);
    if (r() < .3) plaetze.push(["drache", ...R(.25, .9), .9, r() * 60, {}]);
    // Würfelhaufen
    const set = z.wuerfelSet || { farbe: "#efe0c0", rand: "#7b3b1d" };
    for (let i = 0; i < 7; i++) plaetze.push(["wuerfel", ...(i % 2 ? L(.2 + r() * .6, .25 + r() * .6) : R(.2 + r() * .6, .2 + r() * .6)), 1, r() * 360, { farbe: i % 3 ? set.farbe : ["#a83a32", "#5f7a3a", "#c58a2c"][i % 3], rand: i % 3 ? set.rand : "#2b1d12", zahl: 1 + Math.floor(r() * 20) }]);
    // Spielleiterschirm hinter der Karte (oben sichtbar)
    plaetze.push(["schirm", k.x + k.w / 2, Math.max(30, k.y - 18), Math.min(1, k.w / 380), 0, { boss: z.boss }]);
    for (const [art, x, y, sk, rot, p] of plaetze) s += `<g class="tding" style="--d:${f1(r() * .4)}s">` + G(x, y, sk * sc, rot, art[0] === "_" ? OB.DEKO[art.slice(1)](p) : DING[art](p)) + "</g>";
    if (ortT) {
      s += OB.lichtSchicht(W, H, id, ortT.licht, z.zustand, ortT.dunkel) + OB.wetterSchicht(W, H, id, z.zustand, z.ort) + (ortT.laub && z.zustand && z.zustand.wetter !== "schnee" ? OB.laubSchicht(W, H, z.zustand) : "");
      s += `<defs><radialGradient id="${id}v2" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${z.zustand && z.zustand.zeit === "nacht" ? .7 : .55}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id}v2)"/>`;
    } else s += `<rect width="${W}" height="${H}" fill="url(#${id}k)"/><rect width="${W}" height="${H}" fill="url(#${id}v)"/>`;
    if (z.boss) s += `<rect width="${W}" height="${H}" fill="#a8302a" opacity=".12"/>`;
    return s + "</svg>";
  }

  /* =====================================================================
     WÜRFELSETS
     ===================================================================== */
  const WUERFEL = [
    { k: "pergament", name: "Pergament", farbe: "#efe0c0", rand: "#7b3b1d", zahl: "#7b3b1d", ton: "", frei: "start", text: "Das Standardset. Hat schon viel gesehen." },
    { k: "holz", name: "Eiche", farbe: "#9c6a3a", rand: "#4a2f1b", zahl: "#f6ecd3", ton: "fx_0_holz_", tonN: 6, frei: "stufe3", text: "Handgedrechselt. Klackt wie ein Specht." },
    { k: "knochen", name: "Knochen", farbe: "#e9e4dc", rand: "#6e6458", zahl: "#3b2a1a", ton: "n_knochen", frei: "tod1", text: "Aus … lieber nicht fragen." },
    { k: "glut", name: "Glut", farbe: "#c0442f", rand: "#5a1a14", zahl: "#ffd27a", ton: "n_feuerstoss", frei: "nat20", text: "Wird nach einer 20 warm. Angeblich." },
    { k: "moos", name: "Moos", farbe: "#6f8f3a", rand: "#3f5424", zahl: "#efe0c0", ton: "", frei: "kampagne1", text: "Riecht ein bisschen nach Wald." },
    { k: "bernstein", name: "Bernstein", farbe: "#e8a03a", rand: "#8a5a10", zahl: "#5a2d0a", ton: "triangel", frei: "ziel1", text: "Eine Mücke ist drin. Sie heißt Gustav." },
    { k: "obsidian", name: "Obsidian", farbe: "#2b2622", rand: "#e8b14e", zahl: "#e8b14e", ton: "n_steinschlag", frei: "tpk", text: "Für Spielleiter, die schon alles gesehen haben." },
    { k: "perlmutt", name: "Perlmutt", farbe: "#f4eee6", rand: "#c46a8a", zahl: "#7d4e8a", ton: "gloeckchen", frei: "selten3", text: "Schimmert in allen Farben – außer Blau." },
    { k: "gold", name: "Gold", farbe: "#e8b14e", rand: "#8a5a10", zahl: "#5a2d0a", ton: "n_muenzen", frei: "stufe10", text: "Für echte Weltenlenker." },
    { k: "glitzer", name: "Glitzer", farbe: "#e6a0c4", rand: "#9c3d5a", zahl: "#fff", ton: "gloeckchen", frei: "spieler20", text: "Glitzer bleibt für immer. Überall." },
    { k: "drachenzahn", name: "Drachenzahn", farbe: "#d9cdb0", rand: "#a83a32", zahl: "#a83a32", ton: "e_drachenbruellen", frei: "drache", text: "Von Herbert. Er wollte, dass du ihn hast." },
    { k: "pizza", name: "Pizza", farbe: "#f2c25a", rand: "#c0442f", zahl: "#7a2418", ton: "n_einschenken", frei: "pizza10", text: "Nicht essen. Ernsthaft." },
    { k: "katze", name: "Katzenpfote", farbe: "#3a2a1e", rand: "#e8b14e", zahl: "#e8b14e", ton: "e_katze", frei: "katze", text: "Rollt manchmal einfach vom Tisch." },
    { k: "geist", name: "Geisterglas", farbe: "#efe9dc", rand: "#9a8f80", zahl: "#6e6458", ton: "e_geisterheulen", frei: "geist", text: "Man sieht durch ihn hindurch." },
    { k: "familie", name: "Familienerbstück", farbe: "#7d4e8a", rand: "#e8b14e", zahl: "#e8b14e", ton: "harfe_101", frei: "beziehung", text: "Gehörte mal der Oma eines Spielers." },
    { k: "boss", name: "Endgegner", farbe: "#5a1a14", rand: "#ff7a3a", zahl: "#ff7a3a", ton: "n_lachen_boese", frei: "boss3", text: "Für drei besiegte Endgegner." }
  ];
  function wuerfelSvg(set, zahl, gross) {
    set = set || WUERFEL[0];
    const id = neueId("w");
    let deko = "";
    if (set.k === "holz") deko = `<path d="M20 30 Q50 40 80 30 M18 60 Q50 70 82 60" stroke="#4a2f1b" stroke-width="1" opacity=".5" fill="none"/>`;
    if (set.k === "glitzer") deko = Array.from({ length: 14 }, (_, i) => `<circle cx="${20 + (i * 37) % 60}" cy="${20 + (i * 53) % 60}" r="1.4" fill="#fff"/>`).join("");
    if (set.k === "bernstein") deko = `<path d="M44 66 q4 -4 8 0 M48 66 v-6" stroke="#5a2d0a" stroke-width="1" fill="none" opacity=".6"/>`;
    if (set.k === "moos") deko = `<path d="M14 72 q6 -6 12 0 q6 -8 12 0" stroke="#a9c27a" stroke-width="3" fill="none"/>`;
    if (set.k === "pizza") deko = `<circle cx="34" cy="40" r="5" fill="#c0442f"/><circle cx="64" cy="58" r="5" fill="#c0442f"/><circle cx="62" cy="32" r="4" fill="#c0442f"/>`;
    if (set.k === "glut") deko = `<path d="M30 80 q20 -20 40 0" stroke="#ffb648" stroke-width="2" fill="none" opacity=".7"/>`;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs><path d="M50 6 L90 30 L90 72 L50 96 L10 72 L10 30Z" fill="${set.farbe}" stroke="${set.rand}" stroke-width="3"/><path d="M50 6 L90 30 L90 72 L50 96 L10 72 L10 30Z" fill="url(#${id})" ${set.k === "geist" ? 'opacity=".6"' : ""}/>${deko}<path d="M50 6 L28 58 L72 58 Z M10 30 L28 58 L10 72 M90 30 L72 58 L90 72 M28 58 L50 96 L72 58" fill="none" stroke="${set.rand}" stroke-width="1.6" opacity=".55"/><text x="50" y="52" font-size="${zahl > 9 ? 22 : 26}" text-anchor="middle" fill="${set.zahl}" font-weight="800" font-family="Alegreya Sans,sans-serif">${zahl}</text></svg>`;
  }

  /* =====================================================================
     GROSSE EFFEKTE (DOM-Überlagerungen)
     ===================================================================== */
  function randFeuer(karte) {
    if (!karte) return;
    const el = document.createElement("div"); el.className = "randfeuer";
    let s = '<svg viewBox="0 0 100 140" preserveAspectRatio="none">';
    for (let i = 0; i < 26; i++) { const seite = i % 4, t = Math.random(); const [x, y] = seite === 0 ? [t * 100, 140] : seite === 1 ? [0, t * 140] : seite === 2 ? [100, t * 140] : [t * 100, 0]; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(6 + Math.random() * 8)}" fill="${["#ff7a3a", "#ffb648", "#e0442a"][i % 3]}" opacity=".7"><animate attributeName="r" values="${f1(4 + Math.random() * 4)};${f1(9 + Math.random() * 6)};${f1(4 + Math.random() * 4)}" dur="${f1(.4 + Math.random() * .5)}s" repeatCount="indefinite"/></circle>`; }
    el.innerHTML = s + "</svg>";
    karte.appendChild(el); setTimeout(() => el.remove(), 2200);
  }
  function drachenFlug(buehne) {
    const el = document.createElement("div"); el.className = "drachenflug";
    el.innerHTML = `<svg viewBox="0 0 400 200"><g fill="#1a0e08"><path d="M40 110 Q120 96 220 100 Q270 102 300 92 L340 84 Q356 82 364 90 L350 98 Q330 100 318 108 Q280 124 220 122 Q140 126 40 110Z"/><path d="M350 86 l14 -12 l-4 14Z M356 92 l20 -2 l-18 6Z"/><circle cx="352" cy="90" r="1.6" fill="#ff7a3a"/><path d="M40 110 Q10 116 -20 104 Q4 120 30 122Z"/><g class="fluegel"><path d="M200 100 Q170 30 90 10 Q120 50 110 70 Q150 60 160 90 Q180 80 200 100Z"/><path d="M240 100 Q250 30 300 6 Q290 50 300 64 Q270 66 262 92Z"/></g><path d="M180 120 l-6 26 l8 -2 M240 120 l4 24 l8 -4" stroke="#1a0e08" stroke-width="6" fill="none"/></g><g class="feuerstrahl"><path d="M366 92 Q420 110 470 140 Q430 104 372 88Z" fill="#ff7a3a" opacity=".85"/><path d="M366 92 Q410 104 450 124 Q414 98 372 90Z" fill="#ffd27a"/></g></svg>`;
    buehne.appendChild(el); setTimeout(() => el.remove(), 3200);
  }
  function tod(karte) { if (!karte) return; karte.classList.add("tot"); const el = document.createElement("div"); el.className = "riss"; el.innerHTML = '<svg viewBox="0 0 100 140" preserveAspectRatio="none"><path d="M60 0 L52 30 L64 48 L48 70 L58 96 L44 140" stroke="#2b1d12" stroke-width="1.2" fill="none"/><path d="M52 30 L40 36 M64 48 L76 52 M48 70 L36 76" stroke="#2b1d12" stroke-width=".7" fill="none"/></svg>'; karte.appendChild(el); }

  window.TNE_GRAFIK = { rng, hash, aussehenNeu, figur, banner, szeneFuer, SZENEN_LISTE, rahmen, tisch, WUERFEL, wuerfelSvg, randFeuer, drachenFlug, tod, HEMD };
})();
