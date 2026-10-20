/* =====================================================================
   SPIELESAAL – Übersicht der Tavernenspiele
   ---------------------------------------------------------------------
   Statt alle Spiele untereinander zu zeigen, beginnt die Taverne mit
   Kacheln (Vorschaubild, Genre, ein Satz). Ein Klick öffnet ein Fenster
   mit Bildern zum Durchblättern, Beschreibung, Besonderheiten, Steuerung
   und dem Knopf „Spielen“. Dann ist nur dieses eine Spiel zu sehen, groß,
   mit einer Leiste „← Alle Spiele“ und Schnellwahl zu den anderen.
   Adressen: #taverne = Übersicht, #waldlauf, #auftritt … = ein Spiel.
   Die Zurück-Taste des Browsers funktioniert.
   Bilder liegen in vorschau/ (echte Aufnahmen aus den Spielen).
   ===================================================================== */
(function () {
  "use strict";
  const sektion = document.getElementById("taverne");
  const buehne = sektion && sektion.querySelector(".taverne");
  if (!sektion || !buehne) return;
  const wrap = sektion.querySelector(".wrap");

  const sprache = () => (document.documentElement.lang === "en" ? "en" : "de");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const B = n => "vorschau/" + n + ".webp";

  /* ---------- Die Spiele ---------- */
  const SPIELE = [
    { key: "heldensturm", karte: "heldensturm", extern: "heldensturm.html", held: "barradin.jpg", bilder: [B("heldensturm-1"), B("heldensturm-2")], gross: true },
    { key: "jagd", karte: "waldlauf", held: "friedrich.jpg", bilder: [B("jagd-1"), B("jagd-2"), B("jagd-3")] },
    { key: "nacht", karte: "diebesnacht", held: "ezekiel.jpg", bilder: [B("nacht-1"), B("nacht-2")] },
    { key: "hort", karte: "echohort", held: "echo.jpg", bilder: [B("hort-1"), B("hort-2"), B("hort-3")] },
    { key: "auftritt", karte: "auftritt", held: "barradin.jpg", bilder: [B("auftritt-1"), B("auftritt-2"), B("auftritt-3")] },
    { key: "probe", karte: "barden-probe", held: "barradin.jpg", bilder: [B("probe-1"), B("probe-2")] },
    { key: "memory", karte: "memory-karte", held: "demogorgon.webp", bilder: [B("memory-1")] }
  ];

  const TX = {
    de: {
      alle: "← Alle Spiele", spielen: "▶ Spielen", oeffnen: "▶ Spiel öffnen", schliessen: "Schließen", mehr: "Mehr erfahren",
      steuerung: "Steuerung", pc: "PC", handy: "Handy", bild: (a, b) => "Bild " + a + " von " + b, zurueck: "Vorheriges Bild", vor: "Nächstes Bild",
      schnell: "Spiel wechseln", eigeneSeite: "öffnet eine eigene Seite",
      spiele: {
        heldensturm: { titel: "Heldensturm", kurz: "Die ganze Kampagne als Hordenkampf – bis nach Gracklstugh.", genre: "Roguelike", wer: "Alle vier Helden",
          text: "Wähle Barradin, Echo, Friedrich oder Ezekiel und kämpf dich durch unsere Kampagne: vom Hinterhalt auf der Straße über Schloss Crackmore, Donnerbaum und das Unterreich bis nach Gracklstugh. Jeder Lauf bringt Beute und Gold, mit dem du im Lager dauerhaft stärker wirst.",
          punkte: ["Vier spielbare Helden mit Nah- und Fernkampf und je drei Talentbäumen", "13 Orte mit 28 Stufen, Wächtern und Bossen wie Glasstab, Venomfang, Ilvara und Demogorgon", "Musik aus dem Lautenwerk, Beutel, Lager-Verbesserungen und höhere Schwierigkeiten"],
          pc: "WASD oder Pfeiltasten zum Laufen, Fähigkeiten 1–6, Esc = Pause.", handy: "Links gedrückt halten und ziehen zum Laufen, Fähigkeiten unten rechts antippen." },
        jagd: { titel: "Friedrichs Jagd", kurz: "Die Kampagne als Bogenjagd – mit Rex an der Seite.", genre: "Bogenjagd", wer: "Friedrich & Rex",
          text: "Friedrich erzählt die Kampagne nach, Kapitel für Kapitel: von der Straße nach Phandalin bis nach Gracklstugh. Goblins, Banditen und die Kreaturen des Bestiariums kommen – Rex bellt, bevor sie auftauchen.",
          punkte: ["Zehn Kapitel mit eigener Kulisse und einem Endgegner, danach eine endlose Nacht", "Nach jeder Welle eine Gabe wie Doppelschuss oder Feuerpfeile", "Drei Schwierigkeitsstufen und eine gemeinsame Bestenliste"],
          pc: "Ins Bild klicken, Maus zurückziehen, zielen, loslassen. P = Pause.", handy: "Ins Bild tippen, Finger zurückziehen, zielen, loslassen." },
        nacht: { titel: "Ezekiels lange Nacht", kurz: "Schleichen, stehlen, Schlösser knacken.", genre: "Schleichen & Stehlen", wer: "Ezekiel",
          text: "Fünf Nächte, fünfzehn Orte: Ezekiel leert fremde Taschen, bleibt im Schatten, knackt jede Truhe und ist verschwunden, bevor jemand „Dieb!“ rufen kann.",
          punkte: ["Wachen mit Sichtkegeln, Kerzen zum Auspusten, Fässer zum Verstecken", "Nebenaufträge mit Briefen aus der Kampagne und eine tägliche Nacht", "Diebesversteck mit Ausrüstung, danach geht die Nacht endlos weiter"],
          pc: "Auf einen Ort klicken, um dorthin zu schleichen; Gäste, Wachen und Truhen anklicken.", handy: "Antippen statt klicken – genauso." },
        hort: { titel: "Echos Hort", kurz: "Schätze plündern, dann den Hort verteidigen.", genre: "Raubzug & Verteidigung", wer: "Echo",
          text: "Echo schleudert seine Ranke in die Tiefe und zieht Gold, Edelsteine und Truhen hoch – als Rabe, Bär oder Ratte. Danach kommen die Plünderer, und der Hain wächst zu Wächtern um seinen Hort.",
          punkte: ["Acht Gebiete aus der Kampagne mit je drei Leveln, danach endlos", "Wildgestalt, Zauberbuch und ein Zorn, der unberechenbar wird", "Echos Hain und Schatzkammer mit dauerhaften Verbesserungen"],
          pc: "Klicken, um die Ranke zu schleudern; in der Abwehr Pflanzplätze anklicken.", handy: "Antippen statt klicken; Knöpfe unten verwandeln Echo." },
        auftritt: { titel: "Barradins Auftritt", kurz: "Rhythmusspiel – vom Hinterhof bis zu den Göttern.", genre: "Rhythmusspiel", wer: "Barradin",
          text: "Bass, Laute und Echos Flöte fallen herab – triff die Noten im Takt, dann entscheidet der Auftrittswurf. Gespielt wird mit echten Instrumentenaufnahmen.",
          punkte: ["„Barradins Weg“: elf Bühnen von der Straßenkneipe bis zu den Hallen des Ewigen Liedes", "Zehn Lieder aus der Kampagne – oder Barradin improvisiert ein neues", "Drei Publikumsstufen und eine Bestenliste je Lied"],
          pc: "Tasten A · S · D (oder J · K · L, Pfeiltasten).", handy: "Auf die jeweilige Spur tippen." },
        probe: { titel: "Loblied & Spott", kurz: "Ein W20 entscheidet über Reim und Schmeichelei.", genre: "Würfelprobe", wer: "Barradin",
          text: "Wähle, wen Barradin besingen – oder verspotten – soll, und wirf den W20. Je höher der Wurf, desto prächtiger der Reim. Beim Spott gegen Monster gibt es sogar psychischen Schaden.",
          punkte: ["Loblieder auf die Gruppe, den Spielleiter oder einen eigenen Namen", "Spott gegen die Gegner aus dem Bestiarium", "Natürliche 20 und Patzer mit eigenen Versen"],
          pc: "Ziel wählen, „W20 werfen“ klicken.", handy: "Ziel wählen, „W20 werfen“ antippen." },
        memory: { titel: "Bestiarium-Memory", kurz: "Finde die Paare aus dem Bestiarium.", genre: "Gedächtnis", wer: "Für alle",
          text: "Unter den Karten lauern die Kreaturen aus dem Bestiarium. Decke immer zwei auf und finde alle Paare in möglichst wenigen Zügen.",
          punkte: ["Alle Kreaturen aus dem Bestiarium", "Eigener Rekord wird gespeichert", "Kurz und schnell – perfekt zwischendurch"],
          pc: "Karten anklicken.", handy: "Karten antippen." }
      }
    },
    en: {
      alle: "← All games", spielen: "▶ Play", oeffnen: "▶ Open game", schliessen: "Close", mehr: "Learn more",
      steuerung: "Controls", pc: "PC", handy: "Phone", bild: (a, b) => "Image " + a + " of " + b, zurueck: "Previous image", vor: "Next image",
      schnell: "Switch game", eigeneSeite: "opens its own page",
      spiele: {
        heldensturm: { titel: "Heldensturm", kurz: "The whole campaign as a horde battle – all the way to Gracklstugh.", genre: "Roguelike", wer: "All four heroes",
          text: "Pick Barradin, Echo, Friedrich or Ezekiel and fight through our campaign: from the ambush on the road via Castle Crackmore, Thundertree and the Underdark all the way to Gracklstugh. Every run brings loot and gold to grow permanently stronger at camp.",
          punkte: ["Four playable heroes with melee and ranged attacks and three talent trees each", "13 places with 28 stages, guardians and bosses like Glasstab, Venomfang, Ilvara and Demogorgon", "Music from the Lautenwerk, bag, camp upgrades and higher difficulties"],
          pc: "WASD or arrow keys to move, abilities 1–6, Esc = pause.", handy: "Hold and drag on the left to move, tap abilities bottom right." },
        jagd: { titel: "Friedrich's Hunt", kurz: "The campaign as a bow hunt – with Rex at his side.", genre: "Bow hunt", wer: "Friedrich & Rex",
          text: "Friedrich retells the campaign chapter by chapter: from the road to Phandalin all the way to Gracklstugh. Goblins, bandits and the creatures of the bestiary attack – Rex barks before they show up.",
          punkte: ["Ten chapters, each with its own scenery and a boss, then an endless night", "A gift after every wave, like double shot or fire arrows", "Three difficulty levels and a shared leaderboard"],
          pc: "Click into the picture, pull back, aim, let go. P = pause.", handy: "Touch the picture, pull back, aim, let go." },
        nacht: { titel: "Ezekiel's Long Night", kurz: "Sneak, steal, pick locks.", genre: "Stealth & theft", wer: "Ezekiel",
          text: "Five nights, fifteen places: Ezekiel empties strangers' pockets, stays in the shadows, cracks every chest and vanishes before anyone can shout \"Thief!\".",
          punkte: ["Guards with vision cones, candles to blow out, barrels to hide in", "Side jobs with letters from the campaign and a daily night", "A thieves' den with gear – then the night goes on forever"],
          pc: "Click a spot to sneak there; click guests, guards and chests.", handy: "Tap instead of click – same thing." },
        hort: { titel: "Echo's Hoard", kurz: "Plunder treasure, then defend the hoard.", genre: "Heist & defense", wer: "Echo",
          text: "Echo hurls his vine into the depths and hauls up gold, gems and chests – as raven, bear or rat. Then the plunderers come, and the grove grows into guardians around his hoard.",
          punkte: ["Eight regions from the campaign with three levels each, then endless", "Wild shape, a spellbook and a wrath that turns unpredictable", "Echo's grove and treasury with permanent upgrades"],
          pc: "Click to hurl the vine; during defense click planting spots.", handy: "Tap instead of click; the buttons below transform Echo." },
        auftritt: { titel: "Barradin's Performance", kurz: "Rhythm game – from the back alley to the gods.", genre: "Rhythm game", wer: "Barradin",
          text: "Bass, lute and Echo's flute come falling down – hit the notes in time, then the performance check decides. Played with real instrument recordings.",
          punkte: ["\"Barradin's Road\": eleven stages from a street pub to the Halls of the Eternal Song", "Ten songs from the campaign – or Barradin improvises a new one", "Three audiences and a leaderboard for every song"],
          pc: "Keys A · S · D (or J · K · L, arrow keys).", handy: "Tap the lane." },
        probe: { titel: "Praise & Mockery", kurz: "A d20 decides rhyme and flattery.", genre: "Dice check", wer: "Barradin",
          text: "Choose who Barradin should praise – or mock – and roll the d20. The higher the roll, the grander the rhyme. Mocking monsters even deals psychic damage.",
          punkte: ["Songs of praise for the party, the game master or any name you like", "Mockery against the foes from the bestiary", "Natural 20s and fumbles with their own verses"],
          pc: "Pick a target, click \"Roll d20\".", handy: "Pick a target, tap \"Roll d20\"." },
        memory: { titel: "Bestiary Memory", kurz: "Find the pairs from the bestiary.", genre: "Memory", wer: "For everyone",
          text: "The creatures from the bestiary lurk beneath the cards. Turn over two at a time and find all pairs in as few moves as possible.",
          punkte: ["Every creature from the bestiary", "Your personal record is saved", "Short and quick – perfect in between"],
          pc: "Click the cards.", handy: "Tap the cards." }
      }
    }
  };
  const t = () => TX[sprache()];
  const vorhanden = sp => { if (sp.extern) return true; const k = document.getElementById(sp.karte); return !!k && !k.hidden; };
  const sichtbare = () => SPIELE.filter(vorhanden);
  const nachKarte = id => SPIELE.find(s => s.karte === id && !s.extern);
  const nachKey = key => SPIELE.find(s => s.key === key);

  /* ---------- Gerüst ---------- */
  const saal = document.createElement("div"); saal.className = "saal"; saal.id = "spielesaal";
  const leiste = document.createElement("div"); leiste.className = "saal-leiste"; leiste.hidden = true;
  buehne.parentNode.insertBefore(saal, buehne);
  buehne.parentNode.insertBefore(leiste, buehne);
  const dialog = document.createElement("dialog"); dialog.className = "saal-dialog"; dialog.setAttribute("aria-labelledby", "sd-titel");
  document.body.appendChild(dialog);

  function kachelnBauen() {
    const T = t();
    saal.innerHTML = sichtbare().map((sp, i) => {
      const s = T.spiele[sp.key];
      return '<button type="button" class="saal-kachel' + (sp.gross ? " gross" : "") + '" data-spiel="' + sp.key + '" style="--i:' + i + '">' +
        '<img src="' + sp.bilder[0] + '" alt="" decoding="async">' +
        '<span class="sk-text"><span class="sk-genre">' + esc(s.genre) + "</span><b>" + esc(s.titel) + "</b><small>" + esc(s.kurz) + "</small>" +
        '<span class="sk-mehr">' + esc(T.mehr) + " →</span></span></button>";
    }).join("");
  }
  function leisteBauen(aktiv) {
    const T = t();
    leiste.innerHTML = '<a class="saal-alle" href="#taverne">' + esc(T.alle) + "</a>" +
      '<nav class="saal-wahl" aria-label="' + esc(T.schnell) + '">' + sichtbare().map(sp => {
        const s = T.spiele[sp.key], href = sp.extern || "#" + sp.karte;
        return '<a href="' + href + '" data-wahl="' + sp.key + '"' + (sp.key === aktiv ? ' aria-current="page"' : "") + (sp.extern ? ' title="' + esc(T.eigeneSeite) + '"' : "") + ">" +
          '<img src="' + sp.held + '" alt="" loading="lazy">' + esc(s.titel) + (sp.extern ? " ↗" : "") + "</a>";
      }).join("") + "</nav>";
    const a = leiste.querySelector('[aria-current="page"]'), nav = leiste.querySelector(".saal-wahl");
    if (a && nav) nav.scrollLeft = Math.max(0, a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2);
  }

  /* ---------- Vorschau-Fenster ---------- */
  let offenKey = null;
  function vorschau(key) {
    const sp = nachKey(key); if (!sp) return;
    offenKey = key;
    const T = t(), s = T.spiele[key], n = sp.bilder.length;
    dialog.innerHTML =
      '<form method="dialog" class="sd-zu-form"><button class="sd-zu" aria-label="' + esc(T.schliessen) + '">×</button></form>' +
      '<div class="sd-inhalt">' +
        '<div class="sd-bilder">' +
          '<div class="sd-band" tabindex="0" aria-label="' + esc(s.titel) + '">' + sp.bilder.map((b, i) => '<figure><img src="' + b + '" alt="' + esc(s.titel + " – " + T.bild(i + 1, n)) + '" decoding="async"></figure>').join("") + "</div>" +
          (n > 1 ? '<button type="button" class="sd-pfeil links" data-schritt="-1" aria-label="' + esc(T.zurueck) + '">‹</button><button type="button" class="sd-pfeil rechts" data-schritt="1" aria-label="' + esc(T.vor) + '">›</button>' +
            '<div class="sd-punkte">' + sp.bilder.map((b, i) => '<button type="button" data-bild="' + i + '" aria-label="' + esc(T.bild(i + 1, n)) + '"' + (i ? "" : ' aria-current="true"') + "></button>").join("") + "</div>" : "") +
        "</div>" +
        '<div class="sd-text">' +
          '<p class="sd-genre">' + esc(s.genre) + " · " + esc(s.wer) + "</p>" +
          '<h3 id="sd-titel"><img src="' + sp.held + '" alt="" class="sd-held">' + esc(s.titel) + "</h3>" +
          "<p>" + esc(s.text) + "</p>" +
          '<ul class="sd-punkteliste">' + s.punkte.map(p => "<li>" + esc(p) + "</li>").join("") + "</ul>" +
          '<div class="sd-steuer"><p class="sd-steuer-titel">' + esc(T.steuerung) + '</p><p><b>' + esc(T.pc) + ":</b> " + esc(s.pc) + "</p><p><b>" + esc(T.handy) + ":</b> " + esc(s.handy) + "</p></div>" +
          '<div class="sd-aktionen">' + (sp.extern
            ? '<a class="sd-los" href="' + sp.extern + '">' + esc(T.spielen) + ' <small>↗</small></a>'
            : '<button type="button" class="sd-los" data-los="' + key + '">' + esc(T.spielen) + "</button>") +
          '<button type="button" class="sd-leise" data-zu>' + esc(T.schliessen) + "</button></div>" +
        "</div>" +
      "</div>";
    if (!dialog.open) { if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", ""); }
    document.documentElement.classList.add("saal-dialog-offen");
    const band = dialog.querySelector(".sd-band");
    band.scrollLeft = 0;
    band.addEventListener("scroll", () => {
      const i = Math.round(band.scrollLeft / Math.max(1, band.clientWidth));
      dialog.querySelectorAll(".sd-punkte button").forEach((b, k) => b.toggleAttribute("aria-current", k === i));
    }, { passive: true });
    band.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); blaettern(e.key === "ArrowRight" ? 1 : -1); } });
    const los = dialog.querySelector(".sd-los"); if (los) los.focus({ preventScroll: true });
  }
  function blaettern(schritt, ziel) {
    const band = dialog.querySelector(".sd-band"); if (!band) return;
    const n = band.children.length, w = band.clientWidth;
    let i = ziel != null ? ziel : Math.round(band.scrollLeft / Math.max(1, w)) + schritt;
    if (i < 0) i = n - 1; if (i >= n) i = 0;
    band.scrollTo({ left: i * w, behavior: "smooth" });
  }
  function vorschauZu() { if (dialog.open) { if (dialog.close) dialog.close(); else dialog.removeAttribute("open"); } }
  dialog.addEventListener("close", () => { offenKey = null; document.documentElement.classList.remove("saal-dialog-offen"); });
  dialog.addEventListener("click", e => {
    if (e.target === dialog) { vorschauZu(); return; } /* Klick neben das Fenster */
    const p = e.target.closest("[data-schritt]"); if (p) { blaettern(+p.dataset.schritt); return; }
    const d = e.target.closest("[data-bild]"); if (d) { blaettern(0, +d.dataset.bild); return; }
    if (e.target.closest("[data-zu]")) { vorschauZu(); return; }
    const l = e.target.closest("[data-los]"); if (l) { const sp = nachKey(l.dataset.los); vorschauZu(); if (sp) spielZeigen(sp.karte, true); }
  });

  /* ---------- Ansichten: Übersicht oder ein Spiel ---------- */
  let aktiv = null;
  function laufendeStoppen(ausser) {
    /* Barradins Auftritt spielt Musik weiter, wenn man ihn nur ausblendet – also abbrechen */
    const at = document.getElementById("auftritt");
    if (at && ausser !== "auftritt" && at._zustand) { const z = at._zustand(); if (z.spiel || z.stimmt) { const k = at.querySelector(".at-start"); if (k) k.click(); } }
    /* Vollbild der Tavernenkarte beenden */
    const v = buehne.querySelector(".tav-karte.tav-voll > .tav-voll-knopf"); if (v) v.click();
  }
  function uebersichtZeigen() {
    laufendeStoppen();
    aktiv = null;
    sektion.classList.remove("saal-einzeln");
    buehne.querySelectorAll(":scope > .tav-karte").forEach(k => k.classList.remove("saal-aktiv"));
    saal.hidden = false; leiste.hidden = true;
  }
  function spielZeigen(kartenId, merken) {
    const sp = nachKarte(kartenId); if (!sp || !vorhanden(sp)) { uebersichtZeigen(); return; }
    if (aktiv !== kartenId) laufendeStoppen(kartenId);
    aktiv = kartenId;
    sektion.classList.add("saal-einzeln");
    buehne.querySelectorAll(":scope > .tav-karte").forEach(k => k.classList.toggle("saal-aktiv", k.id === kartenId));
    saal.hidden = true; leiste.hidden = false;
    leisteBauen(sp.key);
    if (merken && location.hash !== "#" + kartenId) { try { history.pushState(null, "", "#" + kartenId); } catch (_) {} }
    obenHin();
    requestAnimationFrame(() => { hoeheSetzen(); window.dispatchEvent(new Event("resize")); });
    if (hoeheWache) { hoeheWache.disconnect(); const k = document.getElementById(kartenId); if (k) hoeheWache.observe(k); }
  }
  /* Spielfläche so hoch machen, wie unter Leiste und Steuerungshinweis noch Platz im Fenster ist */
  const FLAECHE = { waldlauf: [".wl-buehne", 14], diebesnacht: [".dn-buehne", 14], echohort: [".eh-buehne", 14], auftritt: [".at-canvas", 120] };
  function hoeheSetzen() {
    if (!aktiv || !FLAECHE[aktiv]) return;
    const el = document.querySelector("#" + aktiv + " " + FLAECHE[aktiv][0]); if (!el) return;
    const oben = el.getBoundingClientRect().top + window.pageYOffset;
    const h = Math.max(300, Math.round(window.innerHeight - oben - FLAECHE[aktiv][1]));
    if (sektion.style.getPropertyValue("--sh") !== h + "px") sektion.style.setProperty("--sh", h + "px");
  }
  const hoeheWache = window.ResizeObserver ? new ResizeObserver(() => requestAnimationFrame(hoeheSetzen)) : null;
  window.addEventListener("resize", () => { if (aktiv) hoeheSetzen(); });
  function obenHin() { requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }))); }
  /* Adresse auswerten (beim Laden, Zurück-Taste, Links von anderswo) */
  function ausAdresse() {
    const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    const sp = nachKarte(id);
    if (sp && vorhanden(sp)) spielZeigen(id, false);
    else uebersichtZeigen();
  }

  /* ---------- Klicks ---------- */
  saal.addEventListener("click", e => { const k = e.target.closest("[data-spiel]"); if (k) vorschau(k.dataset.spiel); });
  /* Links auf die Taverne oder ein Spiel – seiten.js hat die Adresse dann schon gesetzt */
  document.addEventListener("click", e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id !== "taverne" && !nachKarte(id)) return;
    e.preventDefault();
    if (location.hash !== "#" + id) { try { history.pushState(null, "", "#" + id); } catch (_) {} }
    if (id === "taverne") { uebersichtZeigen(); obenHin(); } else spielZeigen(id, false);
  });
  window.addEventListener("popstate", () => setTimeout(() => { ausAdresse(); if (aktiv) obenHin(); }, 0));
  window.addEventListener("hashchange", () => setTimeout(() => { ausAdresse(); if (aktiv) obenHin(); }, 0));

  /* ---------- Aussehen ---------- */
  const css = document.createElement("style");
  css.textContent = `
/* Übersicht */
.saal { display: grid; gap: clamp(.7rem, 2vw, 1.1rem); grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 900px) { .saal { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.saal[hidden] { display: none; }
.saal-kachel {
  position: relative; display: block; overflow: hidden; min-height: clamp(210px, 30vw, 330px); padding: 0; text-align: left; cursor: pointer;
  border: 1px solid var(--line); background: var(--hall); font: inherit; color: inherit; -webkit-tap-highlight-color: transparent;
  animation: saalEin .6s ease both; animation-delay: calc(var(--i) * 60ms);
  transition: border-color .3s, box-shadow .3s;
}
.saal-kachel.gross { grid-column: span 2; }
@media (max-width: 899px) { .saal-kachel.gross { min-height: clamp(190px, 46vw, 300px); } }
@keyframes saalEin { from { opacity: 0; transform: translateY(18px); } }
.saal-kachel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; filter: saturate(.85) brightness(.72); transition: transform .9s cubic-bezier(.2,.8,.3,1), filter .5s; }
.saal-kachel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(16,14,21,0) 25%, rgba(16,14,21,.55) 55%, rgba(16,14,21,.95)); }
.saal-kachel:hover, .saal-kachel:focus-visible { border-color: var(--ember); box-shadow: 0 0 0 1px var(--ember), 0 12px 34px rgba(0,0,0,.55), 0 0 26px rgba(224,160,70,.18); outline: none; }
.saal-kachel:hover img, .saal-kachel:focus-visible img { transform: scale(1.06); filter: saturate(1) brightness(.85); }
.sk-text { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; padding: .9rem; display: grid; gap: .2rem; justify-items: start; }
.sk-genre { font-size: .64rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--night); background: var(--ember); padding: .1rem .45rem; margin-bottom: .2rem; }
.sk-text b { font-family: var(--display); font-weight: 400; font-size: clamp(1.1rem, 2.6vw, 1.5rem); line-height: 1.08; color: var(--vellum); }
.saal-kachel.gross .sk-text b { font-size: clamp(1.4rem, 3.6vw, 2.2rem); }
.sk-text small { font-size: .82rem; line-height: 1.35; color: var(--ash); }
.sk-mehr { font-size: .78rem; color: var(--ember); margin-top: .15rem; opacity: .85; }
@media (max-width: 520px) { .sk-text { padding: .7rem; } .sk-text small { font-size: .76rem; } .sk-mehr { display: none; } }

/* Ein Spiel */
.saal-leiste { display: flex; align-items: center; gap: .8rem 1rem; flex-wrap: wrap; margin-bottom: 1rem; padding-bottom: .8rem; border-bottom: 1px solid var(--line); }
.saal-leiste[hidden] { display: none; }
.saal-alle { flex: none; display: inline-flex; align-items: center; padding: .5rem .95rem; border: 1px solid var(--ember); color: var(--ember); text-decoration: none; font-size: .92rem; }
.saal-alle:hover, .saal-alle:focus-visible { background: var(--ember); color: var(--night); }
.saal-wahl { flex: 1 1 18rem; min-width: 0; display: flex; gap: .4rem; overflow-x: auto; scrollbar-width: thin; padding: .15rem 0; }
.saal-wahl a { flex: none; display: inline-flex; align-items: center; gap: .45rem; padding: .3rem .75rem .3rem .3rem; border: 1px solid var(--line); border-radius: 999px; color: var(--ash); text-decoration: none; font-size: .84rem; white-space: nowrap; }
.saal-wahl img { width: 1.6rem; height: 1.6rem; border-radius: 50%; object-fit: cover; object-position: top; }
.saal-wahl a:hover { color: var(--vellum); border-color: var(--ash); }
.saal-wahl a[aria-current="page"] { color: var(--ember); border-color: var(--ember); background: rgba(224,160,70,.12); }
@media (max-width: 600px) { .saal-leiste { gap: .6rem; } .saal-wahl { flex-basis: 100%; } }

#taverne .taverne { display: none; }
#taverne.saal-einzeln .taverne { display: grid; grid-template-columns: minmax(0, 1fr); }
#taverne.saal-einzeln .taverne > .tav-karte { display: none; }
#taverne.saal-einzeln .taverne > .tav-karte.saal-aktiv { display: grid; grid-column: 1 / -1; }
#taverne.saal-einzeln .part-head, #taverne.saal-einzeln .bereich-zurueck { display: none; }
/* Titel und Beschreibung stehen schon in Leiste und Vorschau – bei den großen Spielen ausblenden */
#taverne.saal-einzeln :is(#waldlauf, #diebesnacht, #echohort) > :is(.label, h3, .tav-info),
#taverne.saal-einzeln #auftritt > :is(.label, h3) { display: none; }
#taverne.saal-einzeln :is(#waldlauf, #diebesnacht, #echohort) { padding-top: clamp(.8rem, 2vw, 1.2rem); }
#taverne.saal-einzeln .hat-voll > :is(.dn-steuerung, .eh-steuerung) { padding-right: 2.8rem; }
#taverne .heldensturm-karte { display: none !important; }

/* Spielflächen in der Einzelansicht groß, aber ganz im Fenster */
#taverne.saal-einzeln { --sh: calc(100vh - 15rem); }
#taverne.saal-einzeln .wl-buehne, #taverne.saal-einzeln .wl-liste, #taverne.saal-einzeln .wl-fuss,
#taverne.saal-einzeln .eh-buehne, #taverne.saal-einzeln .eh-liste, #taverne.saal-einzeln .eh-fuss { max-width: min(100%, max(300px, calc(var(--sh) * .8))); }
#taverne.saal-einzeln .dn-buehne, #taverne.saal-einzeln .dn-liste, #taverne.saal-einzeln .dn-fuss { max-width: min(100%, max(300px, calc(var(--sh) * ${400 / 560}))); }
#taverne.saal-einzeln .wl-fuss, #taverne.saal-einzeln .eh-fuss, #taverne.saal-einzeln .dn-fuss { width: 100%; justify-self: center; }
#taverne.saal-einzeln .at-buehne, #taverne.saal-einzeln .at-liste { max-width: min(100%, 820px); }
#taverne.saal-einzeln .tav-karte:not(.tav-voll) .at-canvas { height: clamp(300px, var(--sh), 600px); }
#taverne.saal-einzeln #barden-probe, #taverne.saal-einzeln #memory-karte { max-width: 820px; width: 100%; justify-self: center; }
#taverne.saal-einzeln .tav-karte > .tav-info, #taverne.saal-einzeln .wl-steuerung, #taverne.saal-einzeln .dn-steuerung, #taverne.saal-einzeln .eh-steuerung { max-width: 48rem; }

/* Vorschau-Fenster */
.saal-dialog { width: min(1040px, calc(100vw - 2rem)); max-height: calc(100vh - 2rem); padding: 0; border: 1px solid var(--ember); background: var(--hall, #16121a); color: var(--vellum); box-shadow: 0 30px 80px rgba(0,0,0,.7); overflow: hidden; }
.saal-dialog[open] { display: flex; flex-direction: column; animation: sdEin .25s ease; }
@keyframes sdEin { from { opacity: 0; transform: translateY(14px) scale(.985); } }
.saal-dialog::backdrop { background: rgba(6,5,10,.78); backdrop-filter: blur(3px); }
html.saal-dialog-offen { overflow: hidden; }
.sd-zu-form { position: absolute; top: .5rem; right: .5rem; z-index: 3; margin: 0; }
.sd-zu { width: 2.4rem; height: 2.4rem; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.7); color: var(--vellum); font-size: 1.4rem; line-height: 1; cursor: pointer; }
.sd-zu:hover { border-color: var(--ember); color: var(--ember); }
.sd-inhalt { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); min-height: 0; overflow: auto; }
.sd-bilder { position: relative; background: #08070c; }
.saal-dialog { --bh: min(72vh, 640px); }
.sd-band { display: flex; height: var(--bh); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; outline: none; }
.sd-band::-webkit-scrollbar { display: none; }
.sd-band figure { flex: 0 0 100%; height: 100%; box-sizing: border-box; margin: 0; scroll-snap-align: center; display: grid; place-items: center; padding: .8rem .8rem 1.8rem; }
.sd-band img { max-width: 100%; max-height: calc(var(--bh) - 2.6rem); object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,.6); }
.sd-pfeil { position: absolute; top: 50%; transform: translateY(-50%); width: 2.6rem; height: 2.6rem; border: 1px solid var(--line); border-radius: 50%; background: rgba(9,8,15,.7); color: var(--vellum); font-size: 1.6rem; line-height: 1; cursor: pointer; }
.sd-pfeil.links { left: .6rem; } .sd-pfeil.rechts { right: .6rem; }
.sd-pfeil:hover { border-color: var(--ember); color: var(--ember); }
.sd-punkte { position: absolute; left: 0; right: 0; bottom: .5rem; display: flex; justify-content: center; gap: .45rem; }
.sd-punkte button { width: .7rem; height: .7rem; padding: 0; border: 1px solid var(--vellum); border-radius: 50%; background: transparent; opacity: .6; cursor: pointer; }
.sd-punkte button[aria-current] { background: var(--ember); border-color: var(--ember); opacity: 1; }
.sd-text { display: grid; align-content: start; gap: .8rem; padding: clamp(1.2rem, 3vw, 2rem); padding-top: clamp(1.4rem, 3vw, 2.4rem); }
.sd-text p { margin: 0; color: var(--ash); line-height: 1.6; }
.sd-genre { font-size: .7rem !important; letter-spacing: .16em; text-transform: uppercase; color: var(--ember) !important; }
.sd-text h3 { margin: 0; display: flex; align-items: center; gap: .7rem; font-family: var(--name); font-weight: 400; font-size: clamp(1.6rem, 4vw, 2.3rem); line-height: 1.05; color: var(--vellum); padding-right: 2rem; }
.sd-held { flex: none; width: 2.8rem; height: 2.8rem; border-radius: 50%; object-fit: cover; object-position: top; border: 1px solid var(--ember); }
.sd-punkteliste { margin: 0; padding: 0; list-style: none; display: grid; gap: .4rem; }
.sd-punkteliste li { position: relative; padding-left: 1.3rem; color: var(--vellum); font-size: .93rem; line-height: 1.45; }
.sd-punkteliste li::before { content: "✦"; position: absolute; left: 0; color: var(--ember); font-size: .8rem; top: .1rem; }
.sd-steuer { border: 1px solid var(--line); background: rgba(0,0,0,.2); padding: .65rem .8rem; display: grid; gap: .25rem; }
.sd-steuer p { font-size: .85rem; line-height: 1.45; }
.sd-steuer b { color: var(--vellum); font-weight: 600; }
.sd-steuer-titel { font-size: .68rem !important; letter-spacing: .16em; text-transform: uppercase; color: var(--ember) !important; }
.sd-aktionen { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin-top: .2rem; }
.sd-los { display: inline-flex; align-items: center; gap: .4rem; padding: .75rem 1.6rem; border: 1px solid var(--ember); background: var(--ember); color: var(--night); font: inherit; font-size: 1.05rem; font-weight: 600; text-decoration: none; cursor: pointer; }
.sd-los:hover, .sd-los:focus-visible { background: #f0b85e; outline: none; box-shadow: 0 0 22px rgba(224,160,70,.35); }
.sd-leise { border: 0; background: none; color: var(--ash); font: inherit; font-size: .9rem; text-decoration: underline; cursor: pointer; padding: .5rem; }
.sd-leise:hover { color: var(--vellum); }

/* Handy: Fenster über den ganzen Bildschirm, Bilder oben zum Wischen, Spielen-Knopf immer sichtbar */
@media (max-width: 760px) {
  .saal-dialog { width: 100vw; max-width: 100vw; height: 100%; max-height: 100%; margin: 0; border: 0; }
  .sd-inhalt { grid-template-columns: minmax(0, 1fr); grid-auto-rows: max-content; flex: 1 1 auto; }
  .saal-dialog { --bh: min(48vh, 420px); }
  .sd-pfeil { display: none; }
  .sd-text { padding-bottom: 0; }
  .sd-aktionen { position: sticky; bottom: 0; margin: 0 calc(-1 * clamp(1.2rem, 3vw, 2rem)); padding: .8rem clamp(1.2rem, 3vw, 2rem) calc(.8rem + env(safe-area-inset-bottom, 0px)); background: linear-gradient(180deg, rgba(22,18,26,.85), var(--hall, #16121a) 35%); border-top: 1px solid var(--line); }
  .sd-los { flex: 1; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) { .saal-kachel, .saal-dialog[open] { animation: none; } .saal-kachel img { transition: none; } }
`;
  document.head.appendChild(css);

  /* ---------- Start ---------- */
  kachelnBauen();
  ausAdresse();
  if (aktiv) obenHin();
  /* Memory erscheint erst, wenn das Bestiarium geladen ist – Kacheln dann neu bauen */
  setTimeout(() => { kachelnBauen(); if (aktiv) leisteBauen((nachKarte(aktiv) || {}).key); }, 1500);
  let letzteSprache = sprache();
  new MutationObserver(() => {
    if (sprache() === letzteSprache) return; letzteSprache = sprache();
    kachelnBauen(); if (aktiv) leisteBauen((nachKarte(aktiv) || {}).key); if (offenKey) vorschau(offenKey);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
