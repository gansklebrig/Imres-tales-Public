/* =====================================================================
   REX' SPÜRNASE – Spurensuche mit Rex und Friedrich (Teil von Friedrichs Waldbuch)
   ---------------------------------------------------------------------
   Wähle ein Gebiet. Rex nimmt eine Fährte auf und führt dich von Station
   zu Station. An jeder Station stellt Friedrich eine Frage: Foto erkennen,
   Merkmal deuten, Doppelgänger unterscheiden, Blütezeit wissen – am Ende
   wartet das Tier, dessen Spur ihr gefolgt seid. Richtig erkannte Arten
   wandern als „gefunden“ ins Waldbuch. Spürnasen-Rang steigt mit Punkten.
   ===================================================================== */
(function () {
  "use strict";
  const W = window.WB; if (!W) return;
  const esc = W.esc;

  const GEBIETE = [
    { k: "isar", name: "Isarauen", text: "Kiesbänke, Weiden, Bärlauchteppiche – und irgendwo ein Biber.", tags: ["o:auwald", "o:wasser", "o:feucht", "o:fluss", "o:kies", "o:quelle", "o:graben", "o:bach"], atmo: "a_fluss", farben: ["#e9d9b0", "#a9c27a", "#6f8f3a", "#4f6b2c"], wasser: true, baum: "weide" },
    { k: "berg", name: "Bergwald am Alpenrand", text: "Bergahorn, Tannen, Enzian – und Gämsen über dir.", tags: ["o:berg", "o:schlucht", "o:fels", "o:alm", "o:baumgrenze", "o:kalk"], atmo: "a_wind1", farben: ["#efe0c4", "#b9a889", "#5f7a3a", "#3f5424"], berge: true, baum: "tanne" },
    { k: "bayerwald", name: "Bayerischer Wald", text: "Dunkle Fichten, Moos, Heidelbeeren – und der heimliche Luchs.", tags: ["o:nadelwald", "o:fichte", "o:moos", "o:sauer", "o:kiefer"], atmo: "a_voegel2", farben: ["#e6dcc0", "#8fa66a", "#4b6430", "#2f4220"], nebel: true, baum: "fichte" },
    { k: "hecke", name: "Waldrand & Hecken in Franken", text: "Schlehen, Holler, Wildkräuter – Füchse jagen im Gras.", tags: ["o:waldrand", "o:hecke", "o:wiese", "o:trocken", "o:dorf", "o:acker", "o:weg", "o:stadt"], atmo: "a_sommerwiese", farben: ["#f2e3b8", "#c8d68f", "#7fa64a", "#5f7a3a"], wiese: true, baum: "laub" },
    { k: "buche", name: "Buchenwald im Spessart", text: "Ein grünes Dach, Waldmeister, Pilze im Laub.", tags: ["o:laubwald", "o:buche", "o:mischwald", "o:eiche", "o:schatten"], atmo: "a_voegel1", farben: ["#eee0bd", "#b8cc7e", "#6f8f3a", "#455d26"], baum: "laub" },
    { k: "moor", name: "Hochmoor im Voralpenland", text: "Birken, Torfmoos, Moorbeeren – leise, sonst versinkst du.", tags: ["o:moor", "o:birke", "o:heide", "o:feucht"], atmo: "a_schilf", farben: ["#ece0c2", "#b7b57f", "#7d8a4a", "#4f5a2c"], wasser: true, nebel: true, baum: "birke" }
  ];
  const RAENGE = [[0, "Welpe"], [120, "Schnupperer"], [350, "Spurenleser"], [800, "Fährtensucher"], [1600, "Waldläufer"], [3200, "Meister-Waldläufer"], [6000, "Friedrichs Erbe"]];
  const rang = p => { let r = RAENGE[0]; for (const x of RAENGE) if (p >= x[0]) r = x; const i = RAENGE.indexOf(r); return { name: r[1], naechst: RAENGE[i + 1] }; };
  const SPRUECHE_OK = ["Gut gesehen!", "Rex wedelt.", "Genau so!", "Da kennt sich jemand aus.", "Richtig – weiter der Nase nach!", "So macht Spurenlesen Spaß."];
  const SPRUECHE_NEIN = ["Hm, nicht ganz.", "Rex setzt sich und schaut dich an.", "Fast!", "Das passiert mir auch.", "Kein Problem – merk's dir."];

  let box = null, zustand = null, atmoEl = null;
  const stopp = () => { if (atmoEl) { atmoEl.pause(); atmoEl = null; } zustand = null; };
  const ton = (n, v) => { if (W.STAND.ton) W.Ton.kurz(n, v); };

  /* ---------- Landschaft ---------- */
  function landschaft(g, fortschritt, stationen) {
    const [himmel, fern, nah, dunkel] = g.farben;
    let s = '<svg viewBox="0 0 1000 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="width:100%;height:100%;display:block">';
    s += '<defs><linearGradient id="sp-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + himmel + '"/><stop offset="1" stop-color="#f6ecd3"/></linearGradient></defs><rect width="1000" height="260" fill="url(#sp-h)"/>';
    s += '<circle cx="820" cy="60" r="34" fill="#ffe9b0" opacity=".8"/>';
    if (g.berge) s += '<path d="M0 170 L120 70 L200 130 L310 40 L420 140 L520 80 L640 150 L760 60 L880 130 L1000 90 L1000 260 L0 260Z" fill="#b8ab98"/><path d="M280 62 L310 40 L340 64 L322 60 L310 70 L296 60Z M740 78 L760 60 L782 80 L768 76Z" fill="#f6efe2"/>';
    const r = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const baum = (x, y, h, farbe) => {
      if (g.baum === "fichte" || g.baum === "tanne") return '<path d="M' + x + " " + (y - h) + " L" + (x - h * .28) + " " + (y - h * .35) + " L" + (x - h * .12) + " " + (y - h * .38) + " L" + (x - h * .36) + " " + y + " L" + (x + h * .36) + " " + y + " L" + (x + h * .12) + " " + (y - h * .38) + " L" + (x + h * .28) + " " + (y - h * .35) + 'Z" fill="' + farbe + '"/>';
      if (g.baum === "birke") return '<rect x="' + (x - 3) + '" y="' + (y - h) + '" width="6" height="' + h + '" fill="#efe8d8"/><rect x="' + (x - 3) + '" y="' + (y - h * .6) + '" width="6" height="3" fill="#3b2a1a"/><ellipse cx="' + x + '" cy="' + (y - h) + '" rx="' + h * .22 + '" ry="' + h * .3 + '" fill="' + farbe + '" opacity=".9"/>';
      if (g.baum === "weide") return '<rect x="' + (x - 4) + '" y="' + (y - h * .6) + '" width="8" height="' + h * .6 + '" fill="#5c4229"/><path d="M' + (x - h * .35) + " " + (y - h * .2) + " Q" + x + " " + (y - h * 1.2) + " " + (x + h * .35) + " " + (y - h * .2) + 'Z" fill="' + farbe + '"/>';
      return '<rect x="' + (x - 4) + '" y="' + (y - h * .55) + '" width="8" height="' + h * .55 + '" fill="#5c4229"/><circle cx="' + x + '" cy="' + (y - h * .7) + '" r="' + h * .32 + '" fill="' + farbe + '"/><circle cx="' + (x - h * .2) + '" cy="' + (y - h * .55) + '" r="' + h * .22 + '" fill="' + farbe + '"/><circle cx="' + (x + h * .2) + '" cy="' + (y - h * .55) + '" r="' + h * .24 + '" fill="' + farbe + '"/>';
    };
    for (let i = 0; i < 22; i++) s += baum(i * 48 + r(i) * 30, 175, 70 + r(i + 3) * 40, fern);
    if (g.wasser) s += '<path d="M0 205 Q250 190 500 205 T1000 200 L1000 225 Q750 232 500 222 T0 228Z" fill="#c9cdb2" opacity=".9"/><path d="M80 212 h60 M420 210 h50 M760 214 h70" stroke="#f6f1e2" stroke-width="2" opacity=".7"/>';
    if (g.wiese) s += '<path d="M0 190 Q500 170 1000 192 L1000 260 L0 260Z" fill="' + fern + '" opacity=".6"/>';
    s += '<path d="M0 230 Q500 200 1000 232 L1000 260 L0 260Z" fill="' + nah + '"/>';
    for (let i = 0; i < 9; i++) s += baum(30 + i * 120 + r(i + 7) * 50, 248, 110 + r(i + 9) * 60, dunkel);
    if (g.nebel) s += '<rect y="150" width="1000" height="60" fill="#f6ecd3" opacity=".35"/>';
    // Fährte
    const pfad = [];
    for (let i = 0; i <= stationen; i++) pfad.push([60 + i * (880 / stationen), 236 - Math.sin(i * 1.3) * 10]);
    s += '<path d="M' + pfad.map(p => p[0] + " " + p[1]).join(" L") + '" stroke="#f6ecd3" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" fill="none" opacity=".9"/>';
    pfad.forEach((p, i) => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === stationen ? 12 : 8) + '" fill="' + (i < fortschritt ? "#c58a2c" : i === fortschritt ? "#fff3cf" : "rgba(246,236,211,.55)") + '" stroke="#3b2a1a" stroke-width="2"/>' + (i === stationen ? '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-size="13">?</text>' : ""); });
    s += "</svg>";
    return { svg: s, pfad };
  }

  /* ---------- Fragen ---------- */
  function poolFuer(g, saison) {
    let p = W.ARTEN.filter(a => W.bilderVon(a.id).length && (a.tags || "").split(/\s+/).some(t => g.tags.includes(t)));
    if (saison) {
      const m = W.heuteMonat;
      const s = p.filter(a => a.kap === "tier" || a.kap === "farn" || (a.kap === "baum") || (a.kap === "pilz" ? a.fr : a.bl.concat(a.fr, a.er)).includes(m));
      if (s.length >= 10) p = s;
    }
    if (p.length < 10) p = p.concat(W.ARTEN.filter(a => W.bilderVon(a.id).length && !p.includes(a)).slice(0, 12));
    return p;
  }
  function spurFrage(tier, g) {
    const tiere = W.ARTEN.filter(a => a.kap === "tier" && a.spur && a !== tier);
    const andere = tiere.filter(a => a.spur !== tier.spur).sort(() => Math.random() - .5).slice(0, 3);
    const antworten = [tier].concat(andere).sort(() => Math.random() - .5);
    return { a: tier, modus: "spur", frage: "Rex bleibt stehen und schnüffelt. Wer hat diese Spur hinterlassen?", spur: true, antworten, richtig: antworten.indexOf(tier), erkl: tier.de + ": " + (tier.blt || "") };
  }
  function frageFuer(a, nr) {
    const modi = ["name", "name", "bild", "merkmal", "merkmal", "monat"];
    if ((a.v || "").split(",").some(v => W.ART[v.trim()] && W.bilderVon(v.trim()).length)) modi.push("verwechslung", "verwechslung");
    if (a.kap === "tier" && a.spur) return spurFrage(a);
    return W.frageBauen(modi[Math.floor(Math.random() * modi.length)], a);
  }

  /* ---------- Bildschirme ---------- */
  function start(el) {
    box = el; stopp();
    const S = W.STAND, R = rang(S.punkte || 0);
    const gefunden = Object.keys(S.gefunden).length;
    box.innerHTML = '<h2 class="hand">Rex\' Spürnase</h2><div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap"><img src="rex-frei.webp" alt="Rex" style="height:110px;filter:drop-shadow(0 6px 8px rgba(40,25,10,.35))"><div style="flex:1;min-width:220px"><p style="margin:.2rem 0">Rex hat eine Fährte in der Nase. Folge ihm von Station zu Station – an jeder Station zeigt dir Friedrich etwas, das ihr gefunden habt. Wer richtig liegt, darf weiter. Am Ende wartet das Tier, dem ihr die ganze Zeit gefolgt seid.</p>' +
      '<p class="hand" style="font-size:1.4rem;margin:.3rem 0">Spürnasen-Rang: <b style="color:var(--moos)">' + R.name + "</b> · " + (S.punkte || 0) + " Punkte" + (R.naechst ? ' <span class="leise">(nächster Rang „' + R.naechst[1] + "“ ab " + R.naechst[0] + ")</span>" : "") + '</p><p class="leise">' + gefunden + " von " + W.ARTEN.length + " Arten selbst gefunden · " + (S.expeditionen || 0) + " Spurensuchen</p></div></div>" +
      '<div class="chips" role="group" aria-label="Jahreszeit"><button class="chip" data-s="1" aria-pressed="' + (S.saison !== false) + '">📅 nur was jetzt im ' + W.MONATE[W.heuteMonat - 1] + ' passt</button><button class="chip" data-s="0" aria-pressed="' + (S.saison === false) + '">🍂 ganzes Jahr</button></div>' +
      '<h3 class="hand">Wohin geht\'s?</h3><div class="modi">' + GEBIETE.map(g => { const l = landschaft(g, -1, 6); return '<button class="modus" data-g="' + g.k + '" style="padding:0;overflow:hidden"><div style="height:90px">' + l.svg + '</div><div style="padding:.6rem .9rem"><b>' + g.name + "</b>" + esc(g.text) + "</div></button>"; }).join("") + "</div>" +
      '<h3 class="hand">Mein Fundbuch</h3><div class="gitter" id="fundbuch"></div>';
    const fb = box.querySelector("#fundbuch");
    const liste = W.ARTEN.filter(a => S.gefunden[a.id]);
    fb.innerHTML = liste.length ? liste.slice(-24).reverse().map(a => '<a class="klebe" href="#/art/' + a.id + '"><div class="bild"><img src="' + (W.hauptbild(a.id) || "") + '" alt="" loading="lazy"></div><div class="name">' + esc(a.de) + '</div><span class="gefunden">✓</span></a>').join("") : '<p class="leise">Noch leer. Rex scharrt schon mit den Pfoten.</p>';
    box.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { S.saison = b.dataset.s === "1"; W.speichern(); start(box); }));
    box.querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => expedition(GEBIETE.find(g => g.k === b.dataset.g))));
  }
  function expedition(g) {
    const pool = poolFuer(g, W.STAND.saison !== false);
    const tiere = W.ARTEN.filter(a => a.kap === "tier" && a.spur && (a.tags || "").split(/\s+/).some(t => g.tags.includes(t)));
    const ziel = (tiere.length ? tiere : W.ARTEN.filter(a => a.kap === "tier" && a.spur))[Math.floor(Math.random() * Math.max(1, tiere.length || 1))] || W.ART.fuchs;
    const arten = pool.filter(a => a.kap !== "tier").sort(() => Math.random() - .5).slice(0, 6);
    zustand = { g, arten, ziel, nr: 0, stationen: arten.length + 1, punkte: 0, richtig: 0, serie: 0, hinweise: 3, ergebnisse: [] };
    if (W.STAND.ton) { atmoEl = new Audio("amb/" + g.atmo + ".mp3"); atmoEl.loop = true; atmoEl.volume = .3; atmoEl.play().catch(() => {}); }
    ton("e_schnueffeln_1", .7);
    station();
  }
  function station() {
    const Z = zustand; if (!Z) return;
    const letzte = Z.nr >= Z.arten.length;
    const a = letzte ? Z.ziel : Z.arten[Z.nr];
    const f = letzte ? spurFrage(a, Z.g) : frageFuer(a, Z.nr);
    Z.frage = f;
    const l = landschaft(Z.g, Z.nr, Z.stationen);
    const p = l.pfad[Math.min(Z.nr, l.pfad.length - 1)];
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap"><h2 class="hand" style="margin:0">' + esc(Z.g.name) + '</h2><span class="hand" style="font-size:1.3rem">Station ' + (Z.nr + 1) + "/" + Z.stationen + " · " + Z.punkte + " Punkte" + (Z.serie > 1 ? " · 🔥" + Z.serie + "er-Serie" : "") + '</span></div>' +
      '<div style="position:relative;height:150px;margin:.6rem 0;border-radius:10px;overflow:hidden;box-shadow:inset 0 0 20px rgba(60,40,20,.3)">' + l.svg +
      '<img src="rex-frei.webp" alt="Rex" id="rex" style="position:absolute;height:64px;left:calc(' + (p[0] / 10) + '% - 30px);bottom:' + (260 - p[1]) / 260 * 150 + 'px;transition:left 1s ease-in-out;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))"><img src="friedrich-frei.webp" alt="" style="position:absolute;height:92px;left:1%;bottom:0;opacity:.95"></div>' +
      '<div class="karte-lern" style="transform:rotate(-.4deg)"><div class="frage">' + esc(letzte ? "Fast am Ziel! " + f.frage : f.frage) + "</div>" +
      (f.spur ? '<div class="spur-bild">' + W.spurSvg(a.spur) + "</div>" : f.bild ? '<div class="fbild"><img src="' + f.bild + '" alt="Rätselbild"></div>' : "") +
      '<div class="antworten' + (f.bildwahl ? " bilder" : "") + '">' + f.antworten.map((x, i) => f.bildwahl ? '<button class="bildwahl" data-i="' + i + '" aria-label="Bild ' + (i + 1) + '"><img src="' + (W.hauptbild(x.id) || "") + '" alt=""></button>' : '<button data-i="' + i + '">' + esc(x.de) + "</button>").join("") + "</div>" +
      '<div class="reihe" style="justify-content:space-between;align-items:center"><button class="knopf klein hell" id="schnueffeln"' + (Z.hinweise && f.antworten.length > 2 ? "" : " disabled") + '>🐽 Rex schnüffeln lassen (' + Z.hinweise + ')</button><button class="knopf klein hell" id="abbrechen">Zurück zum Lager</button></div><div class="erklaerung" id="erkl"></div></div>';
    box.querySelector("#abbrechen").addEventListener("click", () => start(box));
    box.querySelector("#schnueffeln").addEventListener("click", e => {
      if (!Z.hinweise) return; Z.hinweise--; Z.hinweisGenutzt = true; e.target.disabled = true;
      ton("e_schnueffeln_1", .8);
      const falsche = f.antworten.map((x, i) => i).filter(i => i !== f.richtig).sort(() => Math.random() - .5).slice(0, 2);
      falsche.forEach(i => box.querySelector('.antworten [data-i="' + i + '"]').classList.add("weg"));
    });
    box.querySelectorAll(".antworten button").forEach(b => b.addEventListener("click", () => antwort(+b.dataset.i)));
  }
  function antwort(i) {
    const Z = zustand; if (!Z || Z.beantwortet) return;
    Z.beantwortet = true;
    const f = Z.frage, ok = i === f.richtig, a = f.a;
    box.querySelectorAll(".antworten button").forEach((x, j) => x.classList.add(j === f.richtig ? "richtig" : j === i ? "falsch" : "x"));
    let p = 0;
    if (ok) { Z.serie++; Z.richtig++; p = (Z.hinweisGenutzt ? 5 : 10) + Math.min(10, (Z.serie - 1) * 2) + (f.modus === "verwechslung" ? 5 : 0) + (f.spur ? 10 : 0); Z.punkte += p; W.STAND.gefunden[a.id] = W.STAND.gefunden[a.id] || Date.now(); ton(f.spur ? "e_bellen_2" : "e_vogel_" + (1 + Math.floor(Math.random() * 8)), .6); }
    else { Z.serie = 0; ton("e_kraehe_3", .5); }
    Z.ergebnisse.push({ id: a.id, ok });
    Z.hinweisGenutzt = false;
    W.speichern();
    const spruch = ok ? SPRUECHE_OK[Math.floor(Math.random() * SPRUECHE_OK.length)] : SPRUECHE_NEIN[Math.floor(Math.random() * SPRUECHE_NEIN.length)];
    box.querySelector("#erkl").innerHTML = '<div class="notiz" style="margin:.6rem 0">' + "<b>" + spruch + "</b> " + (ok ? "+" + p + " Punkte. " : "Richtig ist <b>" + esc(a.de) + "</b>. ") + esc((f.erkl || a.k || "").slice(0, 240)) + (a.n && !ok ? "<br>" + esc(a.n.slice(0, 160)) : "") + '<span class="unterschrift">– Friedrich</span></div><div class="reihe"><button class="knopf" id="weiter">' + (Z.nr + 1 >= Z.stationen ? "Zum Ziel →" : "Rex folgen →") + '</button><a class="knopf hell klein" href="#/art/' + a.id + '" target="_blank" rel="noopener">Im Waldbuch nachschlagen ↗</a></div>';
    const rex = box.querySelector("#rex");
    if (ok && rex) { rex.style.transform = "translateY(-10px) rotate(-6deg)"; setTimeout(() => { rex.style.transform = ""; }, 300); }
    box.querySelector("#weiter").addEventListener("click", () => {
      Z.nr++; Z.beantwortet = false;
      if (Z.nr >= Z.stationen) ende(); else { const l = landschaft(Z.g, Z.nr, Z.stationen); const pp = l.pfad[Z.nr]; if (rex) rex.style.left = "calc(" + (pp[0] / 10) + "% - 30px)"; ton("n_laubschritt_" + (1 + Math.floor(Math.random() * 9)), .5); setTimeout(station, 650); }
    });
    box.querySelector("#weiter").focus();
  }
  function ende() {
    const Z = zustand; if (!Z) return;
    const S = W.STAND;
    const sterne = Z.richtig >= Z.stationen ? 3 : Z.richtig >= Z.stationen - 2 ? 2 : Z.richtig >= Z.stationen / 2 ? 1 : 0;
    const bonus = sterne * 15;
    const vorher = rang(S.punkte || 0).name;
    S.punkte = (S.punkte || 0) + Z.punkte + bonus; S.expeditionen = (S.expeditionen || 0) + 1;
    const nachher = rang(S.punkte).name;
    W.speichern();
    const t = Z.ziel, gefunden = Z.ergebnisse.filter(e => e.ok);
    ton(sterne >= 2 ? "e_bellen_1" : "e_eule_1", .7);
    box.innerHTML = '<h2 class="hand">Am Ende der Fährte …</h2><div class="art" style="margin-top:.4rem"><div class="galerie"><div class="haupt"><img src="' + (W.hauptbild(t.id) || "") + '" alt="' + esc(t.de) + '"><div class="unter">' + esc(t.de) + '</div></div></div><div><p style="font-size:1.15rem">… sitzt ' + esc(t.de.replace(/^(Europäischer|Eurasischer|Eurasisches|Gemeiner|Braunbrustigel)\s*/, "") ) + " und schaut euch an. Dann ist es verschwunden. Rex wedelt so heftig, dass er fast umfällt.</p>" +
      '<p class="hand" style="font-size:2.4rem;margin:.2rem 0;color:var(--ocker)">' + "★".repeat(sterne) + '<span style="opacity:.25">' + "★".repeat(3 - sterne) + "</span></p>" +
      "<p>" + Z.richtig + " von " + Z.stationen + " Stationen richtig · <b>" + (Z.punkte + bonus) + " Punkte</b>" + (bonus ? " (inkl. " + bonus + " Sternbonus)" : "") + "</p>" +
      (nachher !== vorher ? '<div class="notiz">Neuer Rang: <b>' + nachher + '</b>! Rex bekommt ein Würstchen. Du auch, wenn du magst.<span class="unterschrift">– Friedrich</span></div>' : "") +
      (gefunden.length ? '<h3 class="hand">Neu im Fundbuch</h3><div class="verw">' + gefunden.map(e => '<a href="#/art/' + e.id + '"><img src="' + (W.hauptbild(e.id) || "") + '" alt="">' + esc(W.ART[e.id].de) + "</a>").join("") + "</div>" : "") +
      '<div class="reihe"><button class="knopf" id="nochmal">🐾 Noch eine Fährte hier</button><button class="knopf hell" id="lager">Zurück zum Lager</button><a class="knopf hell" href="#/art/' + t.id + '">Über ' + esc(t.de) + " lesen</a></div></div></div>";
    box.querySelector("#nochmal").addEventListener("click", () => expedition(Z.g));
    box.querySelector("#lager").addEventListener("click", () => start(box));
  }

  window.WB_SPIEL = { start, stopp };
})();
