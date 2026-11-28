/* Ezekiel – The Destroyer · Oberfläche
   HUD, Menüs (Titel, Pause, Einstellungen, Schmiede, Fundbuch, Schädelaltar, Händler, Segen, Schriftrollen), Touch-Steuerung, Enden.

   ===================== GEMEINSAME UI-SCHNITTSTELLE (für alle Module) =====================
   Stil „Pergament & Schmiedeeisen“ (CSS in zerstoerer.html): Fenster = Samt im Eisenrahmen (.mbox), kleine Schilder =
   Eisenplakette (.eisen), Erzählung = Pergament (.erz). Farben nach Bedeutung: Gold wertvoll · Darkin-Rot Gefahr/Fluch ·
   Violett Runen/Magie · Grün NUR Gift · kein Blau. Schriften: var(--fd) Titel, var(--fb) Text. Tasten immer als <kbd>.

   Z.ui.notify(text, { prio, icon, ort, x, y, dauer, art, key })      → Meldung; gibt das Element zurück (oder null)
       text   HTML (kurz! eine Zeile + optional <small>Zusatz</small>)
       prio   0 Stimmung (Wetter, Tipps) · 1 Info (Funde, Geheimnisse, Erfolge) · 2 wichtig (Fluch, Hinterhalt, Händlerin)
              · 3 Antwort auf eine Handlung (verriegelt, zu wenig Gold, Controller). Einstellung „Hinweise“:
              alle = ab 0, wenige = ab 2, keine = nur 3.
       ort    'hud' (Standard): EIN Meldungsbereich oben Mitte, höchstens 2 gleichzeitig, Wichtigeres verdrängt,
              Unwichtiges verfällt in der Warteschlange · 'welt': kurze Zeile an Weltposition x/y (Weltpixel, y = Boden)
       art    'gold' | 'gefahr' | 'magie' | 'gift' | 'sieg' | 'pergament' (Farbakzent)   key: gleiche Meldung nur auffrischen
   Z.toast(html, ms)  → bleibt erhalten und läuft über notify (Priorität wird aus dem Text geschätzt).
   Z.ui.worldLabel(key, { x, y, html|text, art, cls, dy, jetzt })      → Schild an einer Weltposition (Preis, Name, Hinweis)
       jetzt: true = nur solange jedes Bild erneut aufgerufen; sonst bleibt es bis worldLabel(key, null) oder Gebietswechsel.
   Z.ui.key(aktion)   → '<kbd>J</kbd>' für das aktuelle Gerät (Tastatur/Controller; Touch: '') · Z.ui.kbd(text) → Kappe
   Z.ui.klang('auf' | 'ok' | 'zurueck' | 'wahl' | 'fehler')            → einheitliche Menü-Klänge
   Z.ui.open(html, { cls: 'schmal'|'breit'|…, noEsc, onClose })        → Fenster (Samt im Eisenrahmen, Controller-Navigation,
       Reiter mit LB/RB, Kurztasten über data-hotkey="a1" bzw. data-key="1", Hinweisleiste unten) · Z.ui.close()
   Z.ui.hinweise()    → 0 | 2 | 3 (aktuelle Mindest-Priorität)
   ========================================================================================== */
(function () {
  "use strict";
  const Z = window.Z, U = Z.U, T = Z.TILE, A = Z.audio, inp = Z.input, L = v => Z.L(v), esc = U.esc;
  /* Stilregel „Grün nur für Gift“: die Seltenheit „Selten“ leuchtet silbern statt grün (Gewöhnlich wird dafür eisengrau) */
  if (Z.RARITY && Z.RARITY[1] && /^#7fd36a$/i.test(Z.RARITY[1].col)) { Z.RARITY[1].col = "#ece4d2"; if (Z.RARITY[0]) Z.RARITY[0].col = "#a0968a"; }
  const $ = s => document.querySelector(s);
  const ui = (Z.ui = { modalOpen: false, choiceActive: null });
  const en = () => Z.settings.lang === "en";

  /* ======================= TEXTE ======================= */
  const TX = {
    title: ["Ezekiel", "Ezekiel"], sub: ["The Destroyer · Die Feste der Fäden", "The Destroyer · The Keep of Threads"],
    play: ["Ins Lager", "To the camp"], cont: ["Weiter", "Continue"], settings: ["Einstellungen", "Settings"], tavern: ["Zur Taverne", "Back to the tavern"],
    pause: ["Pause", "Paused"], resume: ["Weiter", "Resume"], abort: ["Lauf aufgeben", "Abandon run"], camp: ["Zurück ins Lager", "Back to camp"],
    close: ["Schließen", "Close"], back: ["Zurück", "Back"], yes: ["Ja", "Yes"], no: ["Nein", "No"],
    intro: ["Barradin erzählt:<br><br>Eines Nachts war Ezekiels Platz am Feuer leer. Nur ein Brief lag dort, versiegelt mit einer Spinne aus schwarzem Wachs: <i>„The Destroyer. Die Spinne erwartet dich.“</i><br><br>Am Horizont stand eine Feste, die am Abend noch nicht dagewesen war. Fäden spannten sich von ihren Türmen bis in die Wolken, und in ihren Hallen warteten alle, die wir je besiegt haben. Oder etwas, das so aussah.<br><br>Ezekiel ging hinein. Ohne Waffe. Natürlich.",
      "Barradin recounts:<br><br>One night Ezekiel's place by the fire was empty. Only a letter lay there, sealed with a spider of black wax: <i>'The Destroyer. The Spider awaits you.'</i><br><br>On the horizon stood a keep that had not been there that evening. Threads stretched from its towers into the clouds, and in its halls waited everyone we had ever defeated. Or something that looked like them.<br><br>Ezekiel went in. Without a weapon. Of course."],
    startRun: ["Die Feste betreten?", "Enter the keep?"], startRunTxt: ["Du nimmst mit, was du in den Händen hältst – die Waffen vom Ständer vor dem Tor. Alles, was du findest, bleibt nur für diesen Lauf. Seelensplitter, die du in Durchgängen ablieferst, bleiben.", "You take what you hold in your hands – the weapons from the rack by the gate. Everything you find lasts only for this run. Soul shards delivered at passages are kept."],
    go: ["Hinein", "Go in"],
    died: ["Gefallen", "Fallen"], diedSub: ["„Noch nicht“ war es diesmal nicht.", "This time it wasn't 'not yet'."],
    kills: ["Erschlagen", "Slain"], time: ["Zeit", "Time"], gold: ["Gold", "Gold"], shardsKept: ["Splitter im Lager", "Shards in camp"], shardsLost: ["Splitter verloren", "Shards lost"], reached: ["Erreicht", "Reached"], parries: ["Paraden", "Parries"], secrets: ["Geheimgänge", "Secrets"],
    replace: ["Ersetzen", "Replace"], cancel: ["Abbrechen", "Cancel"], take: ["Aufheben", "Pick up"], open: ["Öffnen", "Open"], read: ["Lesen", "Read"], eat: ["Essen", "Eat"], enter: ["Betreten", "Enter"], talk: ["Reden", "Talk"], use: ["Benutzen", "Use"],
    scrollT: ["Schriftrolle der Macht", "Scroll of Power"], scrollD: ["Wähle, was wachsen soll. Jede Rolle gibt auch mehr Leben.", "Choose what grows. Every scroll also grants more health."],
    forge: ["Nundros Schmiede", "Nundro's Forge"], codex: ["Barradins Fundbuch", "Barradin's Ledger"], skullT: ["Schädelaltar", "Skull Altar"],
    shop: ["Händler", "Merchant"], altar: ["Segensaltar", "Altar of Blessings"], fountain: ["Brunnen", "Fountain"],
    buy: ["Kaufen", "Buy"], sold: ["Verkauft", "Sold"], noGold: ["Zu wenig Gold.", "Not enough gold."], noShards: ["Zu wenige Splitter.", "Not enough shards."],
    shards: ["Seelensplitter", "Soul shards"], level: ["Stufe", "Level"], upgrade: ["Schärfen", "Sharpen"], luck: ["Fundglück", "Find luck"], max: ["Meister", "Master"],
    unknown: ["??? – noch nie gefunden", "??? – never found"], findChance: ["Fundchance", "Find chance"], from: ["ab", "from"],
    tabsForge: [["Waffen", "Fähigkeiten", "Lager", "Glutschmiede"], ["Weapons", "Skills", "Camp", "Ember forge"]], tabsCodex: [["Waffen", "Fähigkeiten", "Gegner", "Bosse", "Enden", "Statistik"], ["Weapons", "Skills", "Enemies", "Bosses", "Endings", "Stats"]],
    ups: { trank: [["Zusätzlicher Heiltrank", "Extra healing potion"], ["Eine Ladung mehr pro Lauf.", "One more charge per run."]], zaeh: [["Zähigkeit", "Toughness"], ["+10 Leben pro Stufe.", "+10 health per level."]], klingen: [["Geschliffene Klingen", "Honed blades"], ["+5 % Schaden pro Stufe.", "+5% damage per level."]], haendler: [["Händlergunst", "Merchant's favour"], ["Händler verlangen 10 % weniger.", "Merchants charge 10% less."]] },
    tut: ["Steuerung", "Controls"],
    ctrlKeys: ["<b>A/D</b> laufen · <b>Leertaste</b> springen (zweimal: Doppelsprung) · <b>Shift</b> rollen (unverwundbar)<br><b>J</b> / Linksklick: Waffe 1 · <b>U</b> / Rechtsklick: Waffe 2 · <b>Q</b> und <b>O</b>: Fähigkeiten<br><b>R</b> Heiltrank · <b>E</b> benutzen / aufheben · <b>W</b> Leiter hoch · <b>S + Leertaste</b> durch Stege fallen<br><b>W + Angriff</b>: Aufwärtsangriff · <b>S + Angriff</b> in der Luft: Sturzangriff · <b>M</b> Karte · <b>Tab</b> Ausrüstung (halten) · <b>Esc</b> Pause",
      "<b>A/D</b> move · <b>Space</b> jump (twice: double jump) · <b>Shift</b> roll (invulnerable)<br><b>J</b> / left click: weapon 1 · <b>U</b> / right click: weapon 2 · <b>Q</b> and <b>O</b>: skills<br><b>R</b> healing potion · <b>E</b> use / pick up · <b>W</b> climb ladder · <b>S + Space</b> drop through ledges<br><b>W + attack</b>: upward attack · <b>S + attack</b> in the air: plunge · <b>M</b> map · <b>Tab</b> gear (hold) · <b>Esc</b> pause"],
    ctrlPad: ["<b>A</b> springen · <b>B</b> rollen · <b>X</b> Waffe 1 · <b>Y</b> Waffe 2 · <b>LB/RB</b> Fähigkeiten · <b>LT</b> Trank · <b>RT</b> benutzen · <b>Select</b> Karte (halten: Ausrüstung) · <b>RS</b> Ausrüstung · <b>Start</b> Pause · Stick hoch + Waffe: Aufwärtsangriff", "<b>A</b> jump · <b>B</b> roll · <b>X</b> weapon 1 · <b>Y</b> weapon 2 · <b>LB/RB</b> skills · <b>LT</b> potion · <b>RT</b> use · <b>Select</b> map (hold: gear) · <b>RS</b> gear · <b>Start</b> pause · stick up + weapon: upward attack"],
    ctrlTouch: ["Links ziehen: laufen, klettern. Rechts: Springen, Rolle, Waffen, Fähigkeiten, Trank. Das Hand-Symbol hebt auf und öffnet Türen.", "Drag on the left: move, climb. Right: jump, roll, weapons, skills, potion. The hand button picks up and opens doors."],
    tips: [["Leuchtet ein Gegner auf, holt er aus. Rolle hindurch – während der Rolle kann dich nichts treffen.", "When an enemy flashes, it's winding up. Roll through – nothing can hit you mid-roll."],
      ["Rote Doppel-Ausrufezeichen lassen sich nicht blocken. Ausweichen!", "Red double exclamation marks can't be blocked. Dodge!"],
      ["Wer getroffen wurde, kann verlorenes Leben kurz zurückholen: sofort zurückschlagen.", "When you're hit, you can win lost health back for a moment: strike back immediately."],
      ["Rissige Wände lassen sich zerschlagen. Dahinter wartet oft etwas.", "Cracked walls can be smashed. Something often waits behind them."],
      ["Seelensplitter sind erst sicher, wenn ein Durchgang erreicht ist.", "Soul shards are only safe once you reach a passage."],
      ["Jede Waffe hat ihre eigene Bedingung für kritische Treffer. Das Fundbuch weiß mehr.", "Every weapon has its own condition for critical hits. The ledger knows more."],
      ["Schmiedeglut sammeln, am Glutamboss Waffen bis +5 aufwerten – bei +2 und +4 wählst du eine Runen-Gravur.", "Collect forge embers and upgrade weapons up to +5 at an ember anvil – at +2 and +4 you choose a rune engraving."],
      ["Fernkampftreffer markieren Gegner mit einem Faden. Der nächste Nahkampfhieb darauf trifft garantiert kritisch.", "Ranged hits mark enemies with a thread. Your next melee strike on them is a guaranteed crit."],
      ["Perfekt ausgewichen? Drei Sekunden Adrenalin: +25 % Schaden. Kill-Ketten vervielfachen das Gold.", "Perfect dodge? Three seconds of adrenaline: +25% damage. Kill chains multiply gold."]],
    endings: {
      tiefe: [["Der Faden der Tiefe", "The Thread of the Deep"], ["Als Demogorgon versinkt, reißt irgendwo unter dem See ein Faden. Ezekiel steht bis zu den Knien im schwarzen Wasser und sieht den Wellen nach, bis sie still sind.<br><br>Später, am Feuer, will ich wissen, wie es war. Ich frage dreimal.<br>„Nass.“<br><br>Rex legt ihm den Kopf aufs Knie. Ezekiel lässt ihn.", "As Demogorgon sinks, somewhere beneath the lake a thread snaps. Ezekiel stands knee-deep in black water and watches the waves until they are still.<br><br>Later, by the fire, I want to know how it was. I ask three times.<br>'Wet.'<br><br>Rex lays his head on his knee. Ezekiel lets him."]],
      glut: [["Der Faden der Glut", "The Thread of Embers"], ["Themberchaud liegt still auf seinem Gold. Ezekiel steigt über den Hort hinweg, ohne hinzusehen. Fast.<br><br>Eine einzige Münze steckt er ein. Am Feuer drückt er sie Echo in die Hand.<br>„Für die Gruppenkasse.“<br><br>Echo starrt die Münze an, dann Ezekiel, dann wieder die Münze. Er wird sie nie ausgeben.", "Themberchaud lies still upon his gold. Ezekiel steps over the hoard without looking. Almost.<br><br>He pockets a single coin. By the fire he presses it into Echo's hand.<br>'For the group fund.'<br><br>Echo stares at the coin, then at Ezekiel, then at the coin again. He will never spend it."]],
      himmel: [["Der Faden des Himmels", "The Thread of the Sky"], ["Oben auf der Turmspitze, über allen Wolken, ist es zum ersten Mal still. Unter Ezekiel zerfasert die Feste wie ein altes Netz im Wind.<br><br>Dann geht die Sonne auf. Eine echte. Er sieht lange hin.<br><br>Friedrich fragt am nächsten Morgen, wo er gewesen sei.<br>„Oben.“", "At the top of the spire, above every cloud, it is quiet for the first time. Beneath Ezekiel the keep frays like an old web in the wind.<br><br>Then the sun rises. A real one. He looks at it for a long time.<br><br>The next morning Friedrich asks where he has been.<br>'Up.'"]],
      alle: [["Drei Fäden", "Three Threads"], ["Drei Fäden sind durchtrennt. Irgendwo im Dunkel zuckt ein Netz zusammen, und jemand, der es gesponnen hat, wird sehr still.<br><br>Ich frage am Feuer noch einmal, wie schon so oft: „Ezekiel. The Destroyer. Woher?“<br><br>Er sieht lange ins Feuer.<br>„Später.“<br><br>Diesmal klingt es wie ein Versprechen. Wer die Spinne wirklich ist? Das erzählt Imre. Irgendwann.", "Three threads are cut. Somewhere in the dark a web twitches, and whoever spun it grows very still.<br><br>By the fire I ask once more, as so often: 'Ezekiel. The Destroyer. Where from?'<br><br>He looks into the fire for a long time.<br>'Later.'<br><br>This time it sounds like a promise. Who the Spider really is? Imre will tell. Someday."]]
    },
    skullDesc: ["Jeder Schädel: Gegner +35 % Leben, +22 % Schaden, dunklere Hallen – aber bessere Beute und mehr Splitter.", "Each skull: enemies +35% health, +22% damage, darker halls – but better loot and more shards."],
    winSkull: ["Ein neuer Schädel hängt an deinem Gürtel.", "A new skull hangs from your belt."]
  };
  Z.TX = TX;
  const t = k => L(TX[k]);

  /* ======================= DOM ======================= */
  const hud = $("#hud"), modal = $("#modal"), toastEl = $("#toast"), banner = $("#banner"), prompt = $("#prompt"), bossbar = $("#bossbar"), choice = $("#choice"), fadeEl = $("#fade"), title = $("#title"), card = $("#card");
  /* Symbol-Leinwände für die vier Plätze */
  const slotEls = {};
  ["a1", "a2", "s1", "s2"].forEach(s => { const el = $("#slot-" + s); slotEls[s] = { el, cv: el.querySelector("canvas"), cd: el.querySelector(".cd"), uid: -1, n: el.querySelector(".n"), k: el.querySelector(".k") }; });
  /* Hinweis an der Schnellleiste: Taste für die Ausrüstungs-Schnellansicht (Tastatur/Controller, Touch: Plätze gedrückt halten) */
  const hbAusr = document.createElement("div"); hbAusr.className = "hb-ausr"; hbAusr.hidden = true;
  { const hb = document.querySelector("#hud .hb"); if (hb) hb.appendChild(hbAusr); }
  function drawSlot(s, it) {
    const se = slotEls[s], c = se.cv.getContext("2d"), dpr = 2;
    se.cv.width = 40 * dpr; se.cv.height = 40 * dpr; c.scale(dpr, dpr); c.clearRect(0, 0, 40, 40);
    const d = it ? Z.itemDef(it) : s === "a1" ? Z.WEAPONS.faeuste : null;
    se.el.style.setProperty("--rar", it ? Z.RARITY[it.rar].col : "#3d3140");
    se.el.classList.toggle("leer", !d);
    if (d) { Z.drawIcon(c, d.icon, 20, 21, 26, d.col); se.el.title = it && Z.itemTitle ? Z.itemTitle(it) : L(d.n); }
    se.n.textContent = d ? (it && Z.itemTitle ? Z.itemTitle(it) : L(d.n)) : "";
    /* Schmiedestufe: Abzeichen und Glanz am Rahmen */
    const pl = it && it.plus ? it.plus : 0;
    if (pl) { se.el.dataset.plus = "+" + pl; se.el.style.setProperty("--plc", Z.plusCol ? Z.plusCol(pl) : "#ffd27a"); } else { delete se.el.dataset.plus; }
    se.el.classList.toggle("geschmiedet", !!pl); se.el.classList.add("neu"); clearTimeout(se.nt); se.nt = setTimeout(() => se.el.classList.remove("neu"), 2200);
  }
  /* ======================= HUD ======================= */
  let hudT = 0, mapT = 0, areaShow = 0;
  /* DOM nur anfassen, wenn sich etwas ändert */
  const hudCache = {};
  function setTxt(id, v, hide) { const c = hudCache[id] || (hudCache[id] = { el: document.getElementById(id) }); if (!c.el) return; if (c.v !== v) { c.el.textContent = v; c.v = v; } if (c.h !== !!hide) { c.el.hidden = !!hide; c.h = !!hide; } }
  function sty(el, k, v) { if (el && el["_st" + k] !== v) { el["_st" + k] = v; el.style[k] = v; } }
  function setHTML(id, v) { const c = hudCache[id] || (hudCache[id] = { el: document.getElementById(id) }); if (c.el && c.v !== v) { c.el.innerHTML = v; c.v = v; } }
  const areaTitle = () => (Z.level.hub ? L(Z.biome.name) : Z.level.passage ? L(["Durchgang", "Passage"]) : Z.areaName(Z.level.id));
  function updateHud(dt) {
    const P = Z.player; if (!P || !Z.level) return;
    const hp = Math.max(0, P.hp), mx = P.hpMax;
    /* Leistung (Handheld): DOM nur bei Änderung anfassen – jede Schreibung erzwingt sonst Stil/Layout je Bild */
    sty($("#hpfill"), "width", (hp / mx * 100) + "%");
    sty($("#hprally"), "width", (Math.min(mx, hp + P.rally) / mx * 100) + "%");
    setTxt("hptxt", Math.ceil(hp) + " / " + mx);
    $("#hpbar").classList.toggle("fluch", P.curse > 0);
    setHTML("pots", Array.from({ length: P.potMax }, (_, i) => '<i class="' + (i < P.potions ? "voll" : "") + '"></i>').join(""));
    /* kompakt: Gold immer, getragene Splitter nur wenn vorhanden, Lager-Bank nur im Lager, Fluch nur wenn aktiv */
    const hub = !!Z.level.hub;
    setTxt("gold", U.fmt(P.gold));
    setTxt("shards", U.fmt(P.shards), !hub && !(P.shards > 0));
    setTxt("bank", U.fmt(Z.meta.shards), !hub);
    setTxt("fluchz", P.curse > 0 ? String(P.curse) : "", !(P.curse > 0));
    for (const s of ["a1", "a2", "s1", "s2"]) {
      const it = P.slots[s], se = slotEls[s];
      const key = it ? it.uid + "|" + (it.plus || 0) : s === "a1" ? -2 : -3;
      if (se.uid !== key) { se.uid = key; drawSlot(s, it); }
      let k = 0;
      if (s[0] === "s" && it && Z.SKILLS[it.id]) k = P.cd[s] / (Z.SKILLS[it.id].cd || 1);
      if (s[0] === "a" && it && P.mag[s] && P.mag[s].t > 0) {
        /* Magazin-Zustand einer früheren Fernwaffe, aber jetzt liegt etwas anderes im Platz (z. B. außerhalb von place belegt) */
        const wd = Z.WEAPONS[it.id];
        if (!wd || !wd.shoot) delete P.mag[s];
        else { if (!Z.magTick) { P.mag[s].t -= dt; if (P.mag[s].t <= 0) P.mag[s].n = wd.shoot.mag + (Z.metaLvl(it.id) >= 3 ? 2 : 0); } k = P.mag[s].t / (wd.shoot.reload || 1); } /* W9: Nachladen läuft in Spielzeit (kampfkunst.js Z.magTick) */
      }
      sty(se.cd, "height", Math.max(0, Math.min(1, k)) * 100 + "%");
      se.el.classList.toggle("aktiv", !!(P.act && P.act.slot === s));
      se.el.classList.toggle("stumm", s[0] === "s" && P.st.silence > 0);
      const lab = inp.label(s); if (se.lab !== lab) { se.lab = lab; se.k.textContent = lab; se.k.hidden = !lab; }
    }
    { const lab = touchy() ? "" : inp.device === "pad" ? inp.padButtonName(inp.padOf("gear") != null ? inp.padOf("gear") : inp.padOf("map")) /* W20 Steuerung */ : inp.label("gear"), k = lab + "|" + Z.settings.lang;
      if (hbAusr._k !== k) { hbAusr._k = k; hbAusr.hidden = !lab || lab === "–"; hbAusr.innerHTML = "<kbd>" + esc(lab) + "</kbd><span>" + esc(L(["Ausrüstung", "Gear"])) + "</span>"; hbAusr.title = L(["Halten: Ausrüstung ansehen", "Hold: view gear"]); } }
    hudT -= dt;
    if (hudT <= 0) {
      hudT = 0.25;
      /* Segen und Werte stehen jetzt im Pausenmenü; der Gebietsname zeigt sich nur nach dem Betreten (und auf der großen Karte) */
      const run = Z.run, an = areaShow > 0 || bigMap;
      /* W11 R38 (Grafik): Gebietsvariante dauerhaft am Ortsnamen („Das Verlies · ☠ Unruhige Brut“), Farbe je Variante */
      const gv = Z.gebietVariante && Z.gebietVariante(), gvC = gv ? ({ gold: "#f0c860", brut: "#e87060", fallen: "#a8c890" })[gv.id] || "#e8d8b0" : "";
      setHTML("area", esc(areaTitle()) + (gv ? '<span class="var-hud" style="color:' + gvC + '"> · <span class="var-ico">' + esc(gv.ico) + "</span> " + esc(L(gv.n)) + "</span>" : "") + (run && an ? '<small>' + fmtTime(run.time) + (run.skulls ? " · " + "☠".repeat(run.skulls) : "") + (run.gnade ? ' · <span class="gnade-hud" title="' + esc(L(["Hilfsmodus Barmherzigkeit", "Assist mode: Mercy"])) + '">✚</span>' : "") + "</small>" : ""));
      $("#area").classList.toggle("still", !an && !gv); $("#area").classList.toggle("varonly", !an && !!gv);
      $("#fps").textContent = Z.settings.fps ? (Z.fps || 0) + " fps" : "";
    }
    if (areaShow > 0) areaShow -= dt;
    /* Boss */
    const b = Z.boss;
    { const on = !!(b && !Z.bossDefeated && !b.def.noBar); if (ui._bkOn !== on) { ui._bkOn = on; document.body.classList.toggle("bosskampf", on); } }
    if (b && !Z.bossDefeated && !b.def.noBar) { bossbar.hidden = false; sty($("#bossfill"), "width", Math.max(0, b.hp / b.hpMax * 100) + "%"); }
    else bossbar.hidden = true;
    /* Interaktions-Hinweis */
    const o = proxyOf(Z.interactTarget);
    if (o && !ui.modalOpen && !ui.choiceActive && !P.dead) {
      const [sx, sy] = o.type === "obj" ? worldToScreen(o.o.x, o.o.y - (o.o.h || 30)) : worldToScreen(o.type === "pickup" ? o.p.x : (o.d || o.s).x * T + 8, o.type === "pickup" ? o.p.y - (o.p.rack ? 30 : 22) : ((o.d || o.s).y + 1) * T - 40);
      const hz = hudZoom();
      if (prompt.hidden) prompt.hidden = false; sty(prompt, "transform", "translate(" + Math.round(sx / hz) + "px," + Math.round(sy / hz) + "px) translate(-50%,-100%)");
      const key = inp.device === "touch" ? "✋" : inp.label("use");
      const ph = '<kbd>' + key + "</kbd> " + esc(promptLabel(o)); if (prompt._h !== ph) { prompt._h = ph; prompt.innerHTML = ph; }
      showCard(o);
    } else { if (!prompt.hidden) prompt.hidden = true; if (!card.hidden) card.hidden = true; }
    /* Karte */
    mapT -= dt; if (mapT <= 0) { mapT = 0.2; drawMinimap(); }
  }
  function promptLabel(o) {
    if (o.type === "obj") return o.o.label ? o.o.label() : t("use");
    if (o.type === "pickup") { const p = o.p; if (p.kind === "item") return t("take"); if (p.kind === "scroll") return t("read"); if (p.kind === "food") return t("eat") + ": " + L((p.food || Z.FOOD[0]).n); return t("open"); }
    if (o.type === "door") return o.d.kind === "gate" ? L(["Die Feste der Fäden", "The Keep of Threads"]) : t("enter") + ": " + Z.areaName(o.d.to);
    if (o.type === "npc") return { B: L(["Barradin · Fundbuch", "Barradin · Ledger"]), A: L(["Nundro · Schmiede", "Nundro · Forge"]), G: L(["Friedrich", "Friedrich"]), E: L(["Echo", "Echo"]), C: t("skullT"), F: L(["Lagerfeuer", "Campfire"]), Y: L(["Trainingspuppe", "Training dummy"]), R: "Rex" }[o.s.id] || t("talk");
    if (o.type === "station") return { K: t("fountain"), M: t("shop"), S: t("altar") }[o.s.id] || t("use");
    return t("use");
  }
  /* W26 Erstspieler: Schlagwörter der Waffen/Fähigkeiten (daten.js „tags“, nur deutsch) im EN-Modus übersetzen */
  const TAGS_EN = { Abpraller: "Ricochet", Abstand: "Distance", Ausweichen: "Evasion", Begleiter: "Companion", Beweglich: "Mobile", Bewegung: "Movement", Blitz: "Lightning", Blutung: "Bleed", blutung: "bleed", Brand: "Burn", Dornen: "Thorns",
    Durchschlag: "Pierce", Einzelziel: "Single target", Erholung: "Recovery", Explosion: "Explosion", Faden: "Thread", Falle: "Trap", Fechter: "Fencer", Fernkampf: "Ranged", "Fernkampf-Schutz": "Ranged defence", Festhalten: "Hold",
    Feuer: "Fire", "Fläche": "Area", Frost: "Frost", Gift: "Poison", Glaskanone: "Glass cannon", Gruppe: "Crowd", Gruppen: "Crowds", Heilung: "Healing", Heranziehen: "Pull", Kettenblitz: "Chain lightning", Kontrolle: "Control",
    "Köder": "Decoy", Lebensraub: "Lifesteal", Panzer: "Armour", Parade: "Parry", "Präzision": "Precision", Reichweite: "Reach", "Rückstoß": "Knockback", "Rückwurf": "Reflect", Schutz: "Protection", "Schwächen": "Weaken",
    Wucht: "Impact", "gegen Untote": "vs. undead", kritisch: "critical", licht: "light", meuchler: "assassin", schnell: "fast", schwer: "heavy", start: "starter" };
  const tagTxt = x => (Z.settings && Z.settings.lang === "en" && TAGS_EN[x]) || x;
  function itemCardHTML(it, cmp) {
    const d = Z.itemDef(it), r = Z.RARITY[it.rar], st = Z.STATS[d.stat];
    const kind = it.type === "skill" ? L(["Fähigkeit", "Skill"]) : d.kind === "ranged" ? L(["Fernkampf", "Ranged"]) : d.kind === "shield" ? L(["Schild", "Shield"]) : L(["Nahkampf", "Melee"]);
    const lvl = Z.metaLvl(it.id);
    return (Z.curseCardHTML ? Z.curseCardHTML(it) : "") + '<div class="ic-kopf" style="--rar:' + (it.cursed ? "#c040ff" : r.col) + '"><b>' + esc(L(d.n)) + (it.plus ? ' <span class="plus" style="color:' + (Z.plusCol ? Z.plusCol(it.plus) : "#ffd27a") + '">+' + it.plus + "</span>" : "") + "</b>" + (lvl ? ' <span class="lv" title="' + esc(L(["Nundros Schärfe (dauerhaft)", "Nundro's sharpening (permanent)"])) + '">◆' + lvl + "</span>" : "") + '<small>' + esc(L(r.n)) + " · " + kind + ' · <span style="color:' + st.col + '">' + esc(L(st.n)) + "</span> · " + L(["Stufe", "Tier"]) + " " + (it.tier + 1) + "</small></div>" +
      '<p>' + esc(L(d.d)) + "</p>" + (it.aff.length ? '<ul class="aff">' + it.aff.map(a => "<li>" + esc(L(Z.AFFIX[a].n)) + ": " + esc(L(Z.AFFIX[a].d)) + "</li>").join("") + "</ul>" : "") +
      (d.tags ? '<p class="tags">' + d.tags.map(x => "<span>" + esc(tagTxt(x)) + "</span>").join("") + "</p>" : "") +
      (lvl >= 3 && d.master ? '<p class="meister">' + esc(L(d.master)) + "</p>" : "") +
      (Z.cardExtraHTML ? Z.cardExtraHTML(it, cmp) : "") +
      (cmp ? '<p class="mul">' + L(["Kraft", "Power"]) + ": ×" + Z.itemMul(it).toFixed(2) + "</p>" : "");
  }
  /* Fundkarte über dem Gegenstand – auch für Waren auf einem Tisch (Z.interacts mit cardIt) */
  function cardFoot(o, it) {
    if (o.type === "obj") return o.o.cardFoot ? (typeof o.o.cardFoot === "function" ? o.o.cardFoot() : o.o.cardFoot) : "";
    if (touchy()) return "";
    const P = Z.player, sk = it.type === "skill", sA = sk ? "s1" : "a1", sB = sk ? "s2" : "a2";
    if (P.slots[sA] && P.slots[sB]) return '<p class="ic-tasten"><span>' + ui.key("use") + L([" aufheben, dann", " pick up, then"]) + "</span><span>" + ui.key(sA) + " " + (sk ? L(["Platz 1", "Slot 1"]) : L(["Hand 1", "Hand 1"])) + "</span><span>" + ui.key(sB) + " " + (sk ? L(["Platz 2", "Slot 2"]) : L(["Hand 2", "Hand 2"])) + "</span></p>";
    return "";
  }
  function showCard(o) {
    o = proxyOf(o);
    const it = o.type === "pickup" && o.p.kind === "item" ? o.p.it : o.type === "obj" && o.o.cardIt ? o.o.cardIt : null;
    const html0 = it ? null : o.type === "obj" && o.o.cardHTML ? (typeof o.o.cardHTML === "function" ? o.o.cardHTML() : o.o.cardHTML) : null;
    if ((!it && !html0) || ui.choiceActive) { card.hidden = true; return; }
    const foot = cardFoot(o, it || {});
    const ck = (it ? it.uid + "|" + (it.plus || 0) + "|" + (it.runes || []).join(",") : html0) + "|" + foot + (ui.kampfNah ? "|k" : ""); /* W11 R44: Größe neu messen, wenn die Karte im Kampf einklappt */
    if (card.dataset.uid !== ck) { card.innerHTML = (it ? itemCardHTML(it, true) : html0) + foot; card.dataset.uid = ck; }
    const ax = o.type === "obj" ? o.o.x : o.p.x, ay = o.type === "obj" ? o.o.y - (o.o.h || 30) - 10 : o.p.y - 40;
    const [sx, sy] = worldToScreen(ax, ay);
    const wasHidden = card.hidden; if (wasHidden) card.hidden = false;
    /* Größe nur neu messen, wenn Inhalt/Sichtbarkeit wechselt (sonst erzwingt offsetWidth je Bild ein Layout) */
    const nowT = performance.now(), m = card._wh;
    if (!m || wasHidden || m.ck !== ck || nowT - m.t > 500) card._wh = { w: card.offsetWidth, h: card.offsetHeight, ck, t: nowT };
    const w = card._wh.w, h = card._wh.h;
    const hz = hudZoom(), vw = innerWidth / hz, vh = innerHeight / hz;
    sty(card, "transform", "translate(" + Math.round(U.clamp(sx / hz - w / 2, 8, vw - w - 8)) + "px," + Math.round(U.clamp(sy / hz - h - 24, 60, vh - h - 8)) + "px)");
  }

  /* ======================= AUSLAGE IN DER WELT =======================
     Waren auf dem Tisch, Segenskugeln über dem Altar: statt eines Fensters liegen die Wahlmöglichkeiten in der Welt.
     Hingehen zeigt Karte und Preis, die Benutzen-Taste nimmt/kauft. Andere Module nutzen das über Z.ui.auslage(…):
       Z.ui.auslage({ key, x, y, abstand, hoch, items: [{ art: 'ware'|'kugel', it, icon, col, name, label(), cardHTML,
                      preis, kannt(), nimm(eintrag, gruppe) → true wenn genommen }], einmal: true (nur eines nehmbar) })
     Station-Stellvertreter: steht man an einer Lager-/Durchgangs-Station, für die eine Auslage existiert,
     gilt das nächste Stück der Auslage (Hinweis, Karte, Benutzen). */
  const auslagen = [];
  (Z.rueckHooks = Z.rueckHooks || []).push({ id: "ui", save: () => auslagen.slice(), load: s => { auslagen.length = 0; for (const g of s) auslagen.push(g); } }); /* W14 Rückweg-Gnade (rueckweg.js): Gebietszustand merken/einsetzen */
  ui.auslage = o => {
    for (let i = auslagen.length - 1; i >= 0; i--) if (auslagen[i].key === o.key || auslagen[i].lv !== Z.level) { const g0 = auslagen[i]; Z.interacts = (Z.interacts || []).filter(x => x.g !== g0); auslagen.splice(i, 1); }
    const g = { key: o.key, lv: Z.level, o, list: [], zu: false, station: o.station || null };
    const n = o.items.length, sp = o.abstand || 24;
    o.items.forEach((d, i) => {
      const e = { x: o.x + (i - (n - 1) / 2) * sp, y: o.y, r: o.r || 14, h: o.hoch || 32, g, d, t: Math.random() * 9, auslage: true,
        ok: () => !d.weg && !g.zu,
        label: () => (d.label ? d.label() : d.name || ""),
        cardIt: d.it || null, cardHTML: d.cardHTML || null,
        cardFoot: () => '<p class="ic-tasten"><span>' + ui.key("use") + " " + esc(d.verb || (d.preis != null ? L(["kaufen", "buy"]) : L(["wählen", "choose"]))) + "</span>" + (d.preis != null ? '<span class="' + (Z.player && Z.player.gold < d.preis ? "gefahr" : "") + '">' + U.fmt(d.preis) + ' <i class="muenze">●</i></span>' : "") + (o.einmal && n > 1 ? "<span>" + L(["nur eines", "only one"]) + "</span>" : "") + "</p>",
        use: () => {
          if (d.weg || g.zu) return;
          if (d.kannt && !d.kannt()) { ui.klang("fehler"); return; }
          if (d.nimm(d, g, e) !== false) { d.weg = true; if (o.einmal) g.zu = true; ui.klang("ok"); }
        } };
      g.list.push(e); (Z.interacts = Z.interacts || []).push(e);
    });
    if (Z.placeAuslage) try { Z.placeAuslage(g); } catch (err) { console.error(err); } /* platz.js: keine Kugel/Ware in der Wand */
    auslagen.push(g);
    return g;
  };
  ui.auslagen = () => auslagen.filter(g => g.lv === Z.level);
  /* Station (z. B. Händler „M“, Altar „S“) mit eigener Auslage: nächstes Stück vertritt sie */
  function proxyOf(o) {
    if (!o || o.type !== "station") return o;
    const g = auslagen.find(x => x.lv === Z.level && x.station === o.s.id && !x.zu); if (!g) return o;
    const P = Z.player, px = P.x + P.w / 2; let best = null, bd = 1e9;
    for (const e of g.list) if (!e.d.weg) { const d = Math.abs(e.x - px); if (d < bd) { bd = d; best = e; } }
    return best ? { type: "obj", o: best } : o;
  }
  ui.proxyOf = proxyOf;
  function auslageTick() {
    const P = Z.player; if (!P || !Z.level) return;
    const px = P.x + P.w / 2, py = P.y + P.h;
    const tg = proxyOf(Z.interactTarget), tgt = tg && tg.type === "obj" ? tg.o : null; /* das gewählte Stück hat Hinweis + Karte, kein Schild */
    for (const g of auslagen) {
      if (g.lv !== Z.level) continue;
      if (g.o.aktiv && !g.o.aktiv()) g.zu = true;
      const near = Math.abs(g.o.x - px) < (g.o.sicht || 150) && Math.abs(g.o.y - py) < 90;
      g.list.forEach((e, i) => {
        const d = e.d, k = "ausl-" + g.key + "-" + i;
        if (!near || d.weg || g.zu || e === tgt) return;
        if (d.preis != null) ui.worldLabel(k, { x: e.x, y: e.y - e.h + 4, html: U.fmt(d.preis) + " ●", art: P.gold >= d.preis ? "gold" : "gefahr", cls: "preis", jetzt: true });
        else if (d.name && g.o.namen !== false) ui.worldLabel(k, { x: e.x, y: e.y - e.h - 2, html: esc(d.name) + (d.unter ? "<small>" + esc(d.unter) + "</small>" : ""), art: d.artL || "magie", cls: "zwei", jetzt: true });
      });
    }
  }
  /* Zeichnen: Waren schweben über dem Tisch, Kugeln über dem Altar */
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, tt) {
    if (dwp0) dwp0.apply(this, arguments);
    const it0 = Z.interactTarget, tgt = it0 && (it0.type === "obj" ? it0.o : proxyOf(it0) && proxyOf(it0).o);
    for (const g of auslagen) {
      if (g.lv !== Z.level) continue;
      for (const e of g.list) {
        const d = e.d; if (d.weg || g.zu) continue;
        const bob = Math.sin(tt * 2.2 + e.t) * 1.6, x = e.x, y = e.y - e.h * 0.62 + bob, hi = tgt === e;
        if (d.art === "kugel") {
          const col = d.col || "#c890ff";
          c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y, (hi ? 17 : 13) + Math.sin(tt * 3 + e.t) * 1.5, rgbaHex(col, hi ? 0.7 : 0.5)); c.restore();
          Z.draw.circ(c, x, y, 4.2, col); Z.draw.circ(c, x - 1.2, y - 1.2, 1.5, "#fff6e8");
          if (Math.random() < 0.04) Z.fx.p({ x: x + (Math.random() - 0.5) * 8, y: y + 2, vx: 0, vy: -14, life: 0.9, size: 1.2, col, kind: "glow", add: true });
        } else {
          /* Tuch unter der Ware */
          c.fillStyle = "rgba(90,20,30,.85)"; c.fillRect(x - 8, e.y - 3, 16, 3);
          if (hi) { c.save(); c.globalCompositeOperation = "lighter"; Z.draw.glow(c, x, y, 14, "rgba(255,210,122,.35)"); c.restore(); }
          const def = d.it ? Z.itemDef(d.it) : null, icon = d.icon || (def && def.icon), col = d.col || (def && def.col) || "#e8d8c0";
          if (icon === "beutel") { Z.draw.ell(c, x, y + 1.5, 5.5, 5, "#7a5230"); Z.draw.ell(c, x - 1.5, y, 2.5, 2.5, "#9a6a3e"); c.fillStyle = "#c8a060"; c.fillRect(x - 3, y - 4.5, 6, 1.6); Z.draw.ell(c, x, y - 6, 2.4, 1.6, "#7a5230"); c.fillStyle = "#ffd27a"; c.fillRect(x - 0.6, y + 0.2, 1.2, 2.6); }
          else if (icon === "braten") { Z.draw.ell(c, x - 1, y + 1, 5.5, 3.6, "#8a4a22"); Z.draw.ell(c, x - 2, y, 4, 2.4, "#b8743a"); c.fillStyle = "#efe2c8"; c.fillRect(x + 3, y - 0.6, 5, 1.6); Z.draw.circ(c, x + 8, y - 0.8, 1.3, "#efe2c8"); Z.draw.circ(c, x + 8, y + 1, 1.3, "#efe2c8"); }
          else if (icon) { c.save(); c.translate(x, y); if (d.it && d.it.type !== "skill") c.rotate(-0.6); Z.drawIcon(c, icon, 0, 0, 13, col); c.restore(); }
          else { Z.draw.circ(c, x, y, 3.5, col); }
          if (d.it) { c.fillStyle = Z.RARITY[d.it.rar].col; c.fillRect(x - 6, e.y - 1, 12, 1); }
        }
      }
    }
  };
  function rgbaHex(h, a) { const n = parseInt(String(h).replace("#", "").padEnd(6, "0").slice(0, 6), 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  const cvEl = document.getElementById("cv");
  /* CSS-Breite aus dem Stil (von resize gesetzt) statt clientWidth – liest kein Layout und erzwingt so keinen Reflow je Bild */
  function worldToScreen(x, y) { const k = Z.gfx.scale / (cvEl.width / (parseFloat(cvEl.style.width) || cvEl.clientWidth || 1)); return [(x - Z.cam.x) * k, (y - Z.cam.y) * k]; }
  /* Hinweis und Karte stehen unter CSS-zoom (--hud): Bildschirmkoordinaten durch den Zoom teilen, sonst rutschen sie auf großen Bildschirmen weg */
  let hudZ = 1, hudZT = 0;
  function hudZoom() { const n = performance.now(); if (n - hudZT > 500) { hudZT = n; hudZ = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hud")) || 1; } return hudZ; }
  const fmtTime = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  /* ======================= KARTE ======================= */
  const mm = $("#minimap"), mmc = mm.getContext("2d");
  let bigMap = false;
  /* Karte auf/zu – zeigt dabei für einige Sekunden den Wegweiser-Pfeil (erkundung.js liest ui.mapPing) */
  function toggleMap() { bigMap = !bigMap; drawMinimap(); ui.mapPing = performance.now(); areaShow = Math.max(areaShow, bigMap ? 0 : 3); hudT = 0; }
  function drawMinimap() {
    const lv = Z.level; if (!lv || !Z.explored) return;
    const big = bigMap;
    mm.classList.toggle("gross", big);
    const P = Z.player, rawS = big ? Math.min(innerWidth * 0.8 / lv.W, innerHeight * 0.7 / lv.H) : 2, scale = rawS >= 2 ? Math.floor(rawS) : rawS; /* W24 Auflösung: ganzzahlige Kachelgröße – keine Nähte/kein Moiré */
    const vw = big ? lv.W : 70, vh = big ? lv.H : 40;
    mm.width = Math.ceil(vw * scale); mm.height = Math.ceil(vh * scale);
    const ox = big ? 0 : U.clamp(Math.floor((P.x + P.w / 2) / T) - vw / 2, 0, Math.max(0, lv.W - vw)), oy = big ? 0 : U.clamp(Math.floor((P.y + P.h / 2) / T) - vh / 2, 0, Math.max(0, lv.H - vh));
    mmc.fillStyle = "rgba(12,8,12,.75)"; mmc.fillRect(0, 0, mm.width, mm.height);
    for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
      const tx = x + ox, ty = y + oy; if (tx >= lv.W || ty >= lv.H) continue;
      if (!Z.explored[ty * lv.W + tx] && !lv.hub && !lv.passage) continue;
      const v = lv.get(tx, ty);
      mmc.fillStyle = v === 1 ? "#5a4a44" : v === 7 ? "#7a5a3a" : v === 2 || v === 8 ? "#8a6a40" : v === 4 ? "#a08050" : v === 3 ? "#a04040" : v === 5 ? "#ff6a1a" : v === 6 ? "#2a5a4a" : "rgba(40,30,36,.8)";
      mmc.fillRect(x * scale, y * scale, scale, scale);
    }
    for (const d of lv.doors) if (d.kind === "exit" && (Z.explored[d.y * lv.W + d.x] || big)) { mmc.fillStyle = "#ffd27a"; mmc.fillRect((d.x - ox) * scale - 1, (d.y - oy) * scale - 2, scale + 2, scale + 3); }
    for (const p of Z.pickups) if ((p.kind === "item" || p.kind === "chest" || p.kind === "scroll") && Z.explored[Math.floor(p.y / T - 1) * lv.W + Math.floor(p.x / T)]) { mmc.fillStyle = p.kind === "scroll" ? "#ffd27a" : "#7fd36a"; mmc.fillRect((p.x / T - ox) * scale - 1, (p.y / T - 1 - oy) * scale - 1, 3, 3); }
    /* Händlerin, Schrein, Glutamboss: kleine Symbole, sobald man die Stelle gesehen hat (Händlerin immer – man hört sie) */
    for (const ev of Z.abEvents || []) if (!ev.done && (ev.k === "haendler" || (ev.k === "schrein" && Z.explored[Math.floor(ev.y / T - 1) * lv.W + Math.floor(ev.x / T)]))) { const x = (ev.x / T - ox) * scale, y = (ev.y / T - 1 - oy) * scale; mmc.fillStyle = ev.k === "haendler" ? "#ffb060" : "#c890ff"; mmc.beginPath(); mmc.moveTo(x, y - 3); mmc.lineTo(x + 3, y); mmc.lineTo(x, y + 3); mmc.lineTo(x - 3, y); mmc.closePath(); mmc.fill(); }
    for (const a of Z.anvils || []) if (a.used < a.charges) { mmc.fillStyle = "#ff8a2a"; mmc.fillRect((a.x / T - ox) * scale - 2, (a.y / T - 1 - oy) * scale - 1, 4, 2); }
    if (Z.minimapExtra) try { Z.minimapExtra(mmc, ox, oy, scale, big, vw, vh); } catch (e) { console.error(e); } /* Raumzeichen (ebenen.js) */
    mmc.fillStyle = "#ff5a3a"; mmc.fillRect(((P.x + P.w / 2) / T - ox) * scale - 2, ((P.y + P.h / 2) / T - oy) * scale - 2, 4, 4);
  }

  /* ======================= UI-BAUKASTEN ======================= */
  const touchy = () => inp.device === "touch" || (ui.touchOn && inp.device !== "pad");
  ui.kbd = s => (s ? "<kbd>" + esc(String(s)) + "</kbd>" : "");
  ui.key = a => (touchy() ? "" : ui.kbd(inp.label(a)));
  ui.klang = art => {
    const o = { auf: ["ui", { vol: 0.22, rate: 0.85, gap: 0.08 }], ok: ["uiOk", { vol: 0.32, gap: 0.08 }], zurueck: ["ui", { vol: 0.2, rate: 0.62, gap: 0.08 }], wahl: ["ui", { vol: 0.12, rate: 1.5, gap: 0.03 }], fehler: ["ui", { vol: 0.25, rate: 0.5, gap: 0.1 }] }[art];
    if (o) A.play(o[0], o[1]);
  };
  /* Hinweis-Stufe: alle (0) · wenige (2) · keine (3) */
  ui.hinweise = () => ({ alle: 0, wenige: 2, keine: 3 })[Z.settings.hinweise || "alle"] || 0;

  /* ======================= MELDUNGEN (eine Warteschlange) ======================= */
  const notesEl = $("#meldungen"), weltEl = $("#welt");
  const NOTE_MAX = 2, NOTE_DUR = [2000, 2800, 3800, 2600], NOTE_WAIT = [1.2, 4, 10, 20];
  let notes = [], noteWait = [], worldNotes = [];
  const stripTags = s => String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const LEAD = /^\s*(🏆|⚖|◆|☠|✦|✧|⛓|⚷|📜|⚠|♪|✋|⚒|⟲|◈|ᚱ)\s*/u;
  function noteShow(n) {
    const el = document.createElement("div");
    el.className = "meldung eisen p" + n.prio + (n.art ? " " + n.art : "");
    /* W11 R27 (nur Optik): freigeschalteter Erfolg → kurzes gemaltes Siegel mit Glanz statt Pokal-Zeichen (figuren.js Z.siegelURL;
       Siegel des Erfolgs aus abenteuer.js Z.erfolgSiegel(html) → {motiv, stufe, selten}, sonst goldener Stern) */
    let ico = n.icon;
    if (n.icon === "🏆" && Z.siegelURL) { try { const w = Z.erfolgSiegel ? Z.erfolgSiegel(n.html) : null, ai = !w && Z.achSiegelInfo ? Z.achSiegelInfo(n.html) : null; ico = '<img class="siegel" alt="" src="' + (w && w.motiv ? Z.siegelURL(w.motiv, { stufe: w.stufe || "gold", band: w.stufe === "gold" || w.stufe === "blut" }) : ai && ai.url ? ai.url : Z.siegelURL("stern", { stufe: "gold" })) + '">'; if (w && w.selten) el.classList.add("selten"); el.classList.add("erfolg-siegel"); } catch (_) { ico = n.icon; } }
    el.innerHTML = (ico ? '<span class="mi">' + ico + "</span>" : "") + '<span class="mt">' + n.html + "</span>";
    if (n.prio >= 2) notesEl.prepend(el); else notesEl.appendChild(el);
    void el.offsetWidth; el.classList.add("an");
    n.el = el; n.t = 0; notes.push(n); ui.lastNote = el;
  }
  function noteDrop(n, fast) {
    notes = notes.filter(x => x !== n);
    const el = n.el; if (!el) return;
    el.classList.remove("an"); el.classList.add("weg");
    setTimeout(() => el.remove(), fast ? 160 : 320);
  }
  /* Platz frei? Wartende nach Priorität nachholen; zu lange Wartende verfallen */
  function notePump() {
    noteWait = noteWait.filter(n => n.wait < NOTE_WAIT[n.prio]);
    noteWait.sort((a, b) => b.prio - a.prio || a.seq - b.seq);
    while (notes.length < NOTE_MAX && noteWait.length) noteShow(noteWait.shift());
  }
  let noteSeq = 0;
  ui.notify = (text, o) => {
    o = o || {};
    let html = String(text == null ? "" : text), icon = o.icon || "";
    const prio = Math.max(0, Math.min(3, o.prio == null ? 1 : o.prio | 0));
    if (prio < ui.hinweise()) return null;
    if (!icon) { const m = LEAD.exec(html); if (m) { icon = m[1]; html = html.slice(m[0].length); } }
    if (o.ort === "welt" && Z.level && o.x != null) return worldNote(html, icon, prio, o);
    const dur = (o.dauer || NOTE_DUR[prio]) / 1000;
    const key = o.key || stripTags(html).slice(0, 60);
    const same = notes.find(n => n.key === key);
    if (same) { same.t = 0; same.dur = Math.max(same.dur, dur); same.el.querySelector(".mt").innerHTML = html; return same.el; }
    if (noteWait.some(n => n.key === key)) return null;
    const n = { html, icon, prio, art: o.art || "", dur, key, seq: noteSeq++, wait: 0 };
    if (notes.length >= NOTE_MAX) {
      const low = notes.slice().sort((a, b) => a.prio - b.prio || b.t - a.t)[0];
      if (low && low.prio < prio) noteDrop(low, true);
      else { noteWait.push(n); return null; }
    }
    noteShow(n);
    return n.el;
  };
  ui.notifyDrop = key => { noteWait = noteWait.filter(n => n.key !== key); const n = notes.find(n => n.key === key); if (n) noteDrop(n, true); }; /* W38 Abwechslung: Meldung zu einem Schlüssel sofort entfernen (z. B. Gebietslage beim Gebietswechsel) */
  /* W11 R44 (nur Optik): Kampf in der Nähe – ein aufmerksamer Gegner nahe Ezekiel (≈ 17×10 Kacheln) – lässt Meldungen,
     Weltmeldungen („Geheimnis 1/7“), Fundkarte und Herausforderungstafel zurücktreten: kleiner, blasser, ohne Zusatzzeile,
     Weltmeldungen rücken über die Köpfe. An sofort, aus 1,2 s nach dem letzten Treffer der Prüfung. body.kampfnah. */
  const knCss = document.createElement("style");
  knCss.textContent = [
    "#meldungen{transition:opacity .25s,transform .3s}body.kampfnah #meldungen{opacity:.5;transform:translateX(-50%) scale(.82);transform-origin:50% 0}body.kampfnah #meldungen.gedimmt{opacity:.16}",
    "body.kampfnah #meldungen small{display:none}",
    "body.kampfnah #card{opacity:.78}body.kampfnah #card>p,body.kampfnah #card>ul,body.kampfnah #card>.ic-tasten{display:none}",
    "body.kampfnah #hfzeile.an{opacity:.42}body.kampfnah #hfzeile .hz small,body.kampfnah #hfzeile .hw{display:none}",
    "body.kampfnah .weltmeldung{opacity:.55}body.kampfnah .weltmeldung small{display:none}"
  ].join("\n");
  document.head.appendChild(knCss);
  let knT = 0, knChk = 0; ui.kampfNah = false;
  function kampfNahTick(dt) {
    knChk -= dt; if (knChk > 0) return; knChk = 0.15;
    const P = Z.player; let hit = false;
    if (P && !P.dead && Z.level && !Z.level.hub && !(G_off() && G_off().kampfnah)) {
      const px = P.x + P.w / 2, py = P.y + P.h / 2;
      for (const e of Z.enemies || []) if (!e.dead && e.aware && Math.abs(e.x + (e.w || 0) / 2 - px) < 270 && Math.abs(e.y + (e.h || 0) / 2 - py) < 160) { hit = true; break; }
    }
    knT = hit ? 1.2 : Math.max(0, knT - 0.15);
    const on = knT > 0;
    if (on !== ui.kampfNah) { ui.kampfNah = on; document.body.classList.toggle("kampfnah", on); }
  }
  const G_off = () => Z.gfx && Z.gfx.off;
  function noteTick(dt) {
    try { kampfNahTick(dt); } catch (e) { console.error(e); } /* W11 R44 */
    if (ui.verdeckt) dt = 0; /* Kapitelseite liegt darüber: Meldungen warten */
    if (ui._bpLeft > 0) { ui._bpLeft -= dt; if (ui._bpLeft <= 0) document.body.classList.remove("bossplatte"); } /* W11 R25: Boss-Titelband (nur Lage) */
    /* großer Gebietsname (Banner) sichtbar: Stimmungs-/Info-Meldungen warten unsichtbar, Antworten (prio 3) bleiben */
    const ban = !banner.hidden && banner.classList.contains("an");
    document.body.classList.toggle("banner-an", ban);
    /* Fundkarte überdeckt den Meldungsbereich: Meldungen treten zurück, die Karte ist wichtiger */
    let dim = false;
    if (!card.hidden && notes.length) { const a = card.getBoundingClientRect(), b = notesEl.getBoundingClientRect(); dim = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
    notesEl.classList.toggle("gedimmt", dim);
    for (const n of notes.slice()) { n.t += ban && n.prio < 3 ? 0 : dt; if (n.t >= n.dur) noteDrop(n); }
    for (const n of noteWait) n.wait += dt;
    notePump();
    for (const w of worldNotes.slice()) {
      w.t += dt;
      if (w.t >= w.dur || w.lv !== Z.level) { worldNotes = worldNotes.filter(x => x !== w); w.el.style.opacity = "0"; setTimeout(() => w.el.remove(), 420); continue; }
      w.kn = (w.kn || 0) + ((ui.kampfNah ? 1 : 0) - (w.kn || 0)) * Math.min(1, dt * 6); /* W11 R44: im Kampf über die Köpfe */
      placeAt(w.el, w.x, w.y, -16 - w.t * 8 - w.kn * 52);
      w.el.style.opacity = w.t > w.dur - 0.5 ? "0" : "";
    }
  }
  ui.clearNotes = () => { for (const n of notes.slice()) noteDrop(n, true); noteWait = []; };
  /* Weltmeldung: kurze Zeile an einer Stelle in der Welt (Falle, Geheimnis, Kundschafter …) */
  function worldNote(html, icon, prio, o) {
    if (worldNotes.length >= 2) { const w = worldNotes.shift(); w.el.remove(); }
    const el = document.createElement("div");
    el.className = "weltmeldung eisen" + (o.art ? " wl " + o.art : "");
    el.innerHTML = (icon ? icon + " " : "") + html;
    weltEl.appendChild(el);
    const w = { el, x: o.x, y: o.y, t: 0, dur: (o.dauer || NOTE_DUR[prio] + 600) / 1000, lv: Z.level };
    worldNotes.push(w); placeAt(el, w.x, w.y, -16);
    return el;
  }
  /* Element mit Unterkante-Mitte an eine Weltposition hängen (CSS-zoom des HUD berücksichtigt) */
  function placeAt(el, wx, wy, dy) {
    const [sx, sy] = worldToScreen(wx, wy), hz = hudZoom();
    sty(el, "transform", "translate(" + Math.round(sx / hz) + "px," + Math.round(sy / hz + (dy || 0)) + "px) translate(-50%,-100%)");
  }
  ui.placeAt = placeAt;

  /* ======================= WELTSCHILDER ======================= */
  const labels = new Map();
  ui.worldLabel = (key, o) => {
    let L0 = labels.get(key);
    if (!o) { if (L0) { L0.el.remove(); labels.delete(key); } return null; }
    if (!L0) { const el = document.createElement("div"); weltEl.appendChild(el); L0 = { el, html: null, cls: null }; labels.set(key, L0); }
    const html = o.html != null ? o.html : esc(o.text || "");
    if (L0.html !== html) { L0.el.innerHTML = html; L0.html = html; }
    const cls = "wl eisen" + (o.art ? " " + o.art : "") + (o.cls ? " " + o.cls : "");
    if (L0.cls !== cls) { L0.el.className = cls; L0.cls = cls; }
    L0.x = o.x; L0.y = o.y; L0.dy = o.dy || 0; L0.jetzt = !!o.jetzt; L0.seen = performance.now(); L0.lv = Z.level;
    return L0.el;
  };
  function labelTick() {
    const now = performance.now(), hide = ui.modalOpen;
    for (const [k, l] of labels) {
      if (l.lv !== Z.level) { l.el.remove(); labels.delete(k); continue; }
      const off = hide || (l.jetzt && now - l.seen > 150);
      l.el.classList.toggle("aus", off);
      if (!off) placeAt(l.el, l.x, l.y, l.dy);
    }
  }
  /* W11 R43 (nur Optik): sichtbare Weltschilder als Rechtecke in Weltkoordinaten – Schwebetexte (effekte.js,
     Text-Verwalter) weichen ihnen aus. Zwischengespeichert (≤ alle 120 ms neu gemessen). */
  let lrT = 0, lrC = [];
  ui.labelRects = () => {
    const now = performance.now(); if (now - lrT < 120) return lrC; lrT = now; lrC = [];
    const cv = document.getElementById("cv"), cam = Z.cam; if (!cv || !cam || !labels.size) return lrC;
    const b = cv.getBoundingClientRect(); if (!(b.width > 0)) return lrC;
    const kx = cam.w / b.width, ky = cam.h / b.height;
    for (const [, l] of labels) { if (l.el.classList.contains("aus")) continue; const r = l.el.getBoundingClientRect(); if (!(r.width > 0)) continue;
      lrC.push({ x0: cam.x + (r.left - b.left) * kx, y0: cam.y + (r.top - b.top) * ky, x1: cam.x + (r.right - b.left) * kx, y1: cam.y + (r.bottom - b.top) * ky }); }
    return lrC;
  };
  ui.clearLabels = () => { for (const [, l] of labels) l.el.remove(); labels.clear(); for (const w of worldNotes) w.el.remove(); worldNotes = []; };

  /* Z.toast bleibt für alle Module: Priorität und Farbe aus dem Inhalt schätzen */
  function guessNote(msg) {
    const s = stripTags(msg);
    if (/🏆/.test(msg)) return { prio: 1, art: "sieg" };
    if (/Rekord|record/i.test(s)) return { prio: 2, art: "sieg" };
    if (/^\s*<small>[\s\S]*<\/small>\s*$/.test(msg)) return { prio: 0 };
    if (/Verriegelt|versperrt|Zu wenig|Zu wenige|Not enough|Locked|barred|Nicht jetzt|Not now|Controller|kopiert|copied|abgelehnt|refused|Fehler|error|Grafik|Graphics|Diagnose|Bericht|markieren/i.test(s)) return { prio: 3 };
    if (/Verfehlt|Missed/i.test(s)) return { prio: 1, art: "gefahr" };
    if (/Fluch|curse|Hinterhalt|Ambush/i.test(s)) return { prio: 2, art: "gefahr" };
    if (/Rune|Paarung|Pairing|Segen|blessing|Schrein|shrine/i.test(s)) return { prio: 1, art: "magie" };
    if (/Händlerin|Trader|Splitter|shards|Gold|Schlüssel|Key/i.test(s)) return { prio: 1, art: "gold" };
    return { prio: 1 };
  }
  Z.toast = ui.toast = (msg, ms) => { const g = guessNote(msg); return ui.notify(msg, { prio: g.prio, art: g.art, dauer: ms ? Math.min(ms, 4200) : 0 }); };
  let bannerT = null;
  ui.banner = (big, small, ms) => { banner.innerHTML = "<b>" + esc(big) + "</b>" + (small ? "<small>" + esc(small) + "</small>" : ""); banner.hidden = false; banner.classList.remove("weg"); void banner.offsetWidth; banner.classList.add("an"); clearTimeout(bannerT); bannerT = setTimeout(() => { banner.classList.remove("an"); banner.classList.add("weg"); }, ms || 3200); };
  Z.bossSay = msg => ui.toast("<i>" + esc(msg) + "</i>", 2200);
  ui.onArea = (id, B, lv) => {
    hud.hidden = false; title.hidden = true;
    areaShow = 5.5; ui.clearLabels(); ui.choiceActive = null; choice.hidden = true; bubble.hidden = true; /* Sprechblase gehört zum alten Gebiet */
    if (lv.passage) try { passageAuslage(lv); } catch (e) { console.error(e); }
    if (lv.hub) ui.banner(L(B.name), L(["Hier beginnt jeder Lauf. Mit leeren Händen.", "Every run begins here. Empty-handed."]));
    else if (lv.passage) ui.banner(L(["Durchgang", "Passage"]), L(["Weiter nach: ", "Onward to: "]) + Z.areaName(lv.to));
    else if (lv.arena) ui.banner(Z.areaName(id), "");
    else ui.banner(L(B.name), L(B.sub) + (B.story ? " – " + L(B.story) : ""), 4200);
    card.hidden = true; prompt.hidden = true;
    touchSync();
  };
  ui.bossIntro = e => {
    $("#bossname").innerHTML = esc(L(e.def.n)) + (e.def.title ? "<small>" + esc(L(e.def.title)) + "</small>" : "");
    /* W11 R26 (nur Optik): gemaltes Boss-Porträt (figuren.js, Z.bossPortraet) als Wappen am linken Ende der Boss-Leiste */
    { let im = bossbar.querySelector("img.boss-portraet"); const u = Z.bossPortraet ? Z.bossPortraet(e.def) : null;
      if (u) { if (!im) { im = document.createElement("img"); im.className = "boss-portraet"; im.alt = ""; bossbar.prepend(im); } im.src = u; } else if (im) im.remove(); }
    ui.banner(L(e.def.n), e.def.intro ? L(e.def.intro) : L(e.def.title || ["", ""]), 4200);
    /* W11 R27 (nur Optik): einfache Grafik zeigt statt des gemalten Bands das Textbanner – auch dort das Boss-Porträt */
    { const bb = banner.querySelector("b"), u = Z.bossPortraet ? Z.bossPortraet(e.def) : null; if (u && bb && bb.textContent === L(e.def.n)) { const im = document.createElement("img"); im.className = "boss-portraet"; im.alt = ""; im.src = u; banner.prepend(im); } }
    /* W11 R25 (nur Lage): solange das Boss-Titelband steht, rücken Meldungen darunter (CSS body.bossplatte) */
    document.body.classList.add("bossplatte"); ui._bpLeft = 4.6; /* zählt in noteTick mit der Spielzeit herunter, wie das Band selbst */
  };
  ui.bossDown = b => { setTimeout(() => ui.banner(L(["Besiegt", "Defeated"]) + ": " + L(b.def.n), b.def.outro ? L(b.def.outro) : "", 6000), 700); };

  /* ======================= ÜBERBLENDE ======================= */
  ui.fade = fn => { fadeEl.classList.add("an"); setTimeout(() => { try { fn(); } finally { setTimeout(() => fadeEl.classList.remove("an"), 60); } }, 380); };

  /* ======================= MODALE ======================= */
  /* Fenster, die aufgehen wollen, während ein Pflichtfenster offen ist (Tod, Ende, Schriftrolle …),
     warten, bis es geschlossen wurde – sonst ginge die Entscheidung verloren. */
  let modalQueue = [];
  const confirmGuard = { t: 0, held: {} };
  const GUARD_MS = 220;
  /* darf eine Bestätigung (A / Benutzen / Enter) jetzt auslösen? */
  function confirmOk(a) {
    if (performance.now() - confirmGuard.t < GUARD_MS) return false;
    if (a && confirmGuard.held[a]) return false;
    return true;
  }
  function openModal(html, opts) {
    opts = opts || {};
    if (ui.modalOpen && ui.noEsc && !opts.noEsc && !opts.force) { if (modalQueue.length < 4) modalQueue.push([html, opts]); return; }
    if (inp.capture) inp.capture = null;
    modal.innerHTML = '<div class="mbox ' + (opts.cls || "") + '">' + html + "</div>";
    modal.hidden = false; ui.modalOpen = true; { const bb = document.getElementById("bubble"); if (bb) bb.hidden = true; } Z.paused = true; ui.onClose = opts.onClose || null; ui.noEsc = !!opts.noEsc;
    /* Schutz vor „Durchrutschen“: Knopf/Taste, mit der das Fenster geöffnet wurde (z. B. Benutzen beim Aufheben),
       oder ein prellender Trigger lösen hier nichts aus – erst nach dem Loslassen bzw. nach einer kurzen Schonzeit */
    confirmGuard.t = performance.now(); confirmGuard.held = { jump: inp.held.jump, a1: inp.held.a1, use: inp.held.use };
    A.muffle(1600); ui.klang("auf");
    /* sofort ein vorläufiger Fokus, damit ein schneller Knopfdruck nie „ins Leere“ geht (die Feinwahl folgt unten) */
    { const f0 = modal.querySelector("[autofocus]:not([disabled])") || modal.querySelector(".mbox button:not([disabled])"); if (f0) try { f0.focus({ preventScroll: true }); } catch (_) {} }
    /* sinnvoller Startpunkt für den Controller: ausdrücklich markiert → erste echte Wahl (kein Reiter, kein Schließen) → irgendwas */
    setTimeout(() => {
      const all = [...modal.querySelectorAll("button:not([disabled]),input,select,a.btn")].filter(el => el.offsetParent !== null);
      const real = all.find(el => !el.closest(".reiter") && !/^(close|controlsBack|graphicsBack|abAchBack)$/.test(el.dataset.act || "") && el.tagName === "BUTTON");
      const f = modal.querySelector("[autofocus]:not([disabled])") || real || all[0];
      if (f) { f.focus({ preventScroll: true }); f.scrollIntoView && f.scrollIntoView({ block: "nearest" }); }
    }, 30);
  }
  function closeModal() {
    if (!ui.modalOpen) return;
    inp.capture = null; /* angefangene Tastenbelegung endet mit dem Fenster */
    modal.hidden = true; modal.innerHTML = ""; ui.modalOpen = false; ui.noEsc = false; Z.paused = false; A.muffle(20000); ui.klang("zurueck");
    const cb = ui.onClose; ui.onClose = null; if (cb) cb();
    /* W19 Slots: zurück auf dem Titelbild → Fokus wieder auf den Hauptknopf (Tastatur/Controller gehen nie ins Leere) */
    if (!ui.modalOpen && !Z.level && !title.hidden) setTimeout(() => { if (!ui.modalOpen && !title.hidden && !title.contains(document.activeElement)) { const b = title.querySelector("#t-play"); if (b) b.focus(); } }, 40);
    /* wartende Fenster nachholen (nur wenn nicht gerade ein neues aufging und der Spieler lebt) */
    if (modalQueue.length && !ui.modalOpen) { const q = modalQueue.shift(); if (Z.level && Z.player && !Z.player.dead) setTimeout(() => { if (!ui.modalOpen) openModal(q[0], q[1]); else modalQueue.unshift(q); }, 60); else modalQueue.length = 0; }
  }
  ui.clearQueue = () => { modalQueue.length = 0; };
  ui.close = closeModal; ui.open = openModal; Z.TX = TX; ui.itemCardHTML = (it, cmp) => itemCardHTML(it, cmp); ui.choiceEl = () => choice;
  /* Taverne mitten im Lauf: erst nachfragen (beim Tastenhämmern landet man sonst versehentlich außerhalb des Spiels) */
  modal.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]"); if (!a || !Z.run || a.dataset.ok) return;
    e.preventDefault(); e.stopPropagation(); const href = a.getAttribute("href");
    closeModal(); ui.confirm(t("tavern"), L(["Der laufende Durchgang geht dabei verloren.", "The current run will be lost."]), t("tavern"), () => { location.href = href; });
    /* sicherer Startpunkt: „Abbrechen“ */
    setTimeout(() => { const c = modal.querySelector('[data-act="close"]'); if (c) c.focus({ preventScroll: true }); }, 45);
  }, true);
  modal.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (!b) return; const fn = actions[b.dataset.act]; if (fn) { A.play("ui", { vol: 0.35 }); fn(b.dataset.arg, b); } });
  const actions = {}; ui.actions = actions;
  /* Tastatur in Menüs */
  ui.onKey = e => {
    if (inp.capture) return false;
    if (!title.hidden && !ui.modalOpen && (e.code === "Enter" || e.code === "Space")) { const b = title.querySelector("button:focus, a:focus") || title.querySelector("button"); if (b) { if (!e.repeat) b.click(); return true; } } /* W19 Slots: auch Links (Download, Taverne) per Enter; gehaltene Taste löst nicht mehrfach aus */
    if (!ui.modalOpen) {
      /* Karte sofort umschalten (Tab gehört jetzt der Ausrüstung: halten = Schnellansicht) */
      if (inp.keys.map.includes(e.code) && Z.level) { if (!e.repeat) toggleMap(); return true; }
      return false;
    }
    if (e.code === "Escape" || e.code === "KeyP") { if (!ui.noEsc) closeModal(); return true; }
    if (e.code === "PageUp" || e.code === "PageDown" || (!/^(Arrow|Key[WASDEJ]$|Enter|Space|Tab)/.test(e.code) && (inp.keys.s1.includes(e.code) || inp.keys.s2.includes(e.code)) && modal.querySelector(".reiter button"))) { if (!e.repeat) switchTab(e.code === "PageDown" || inp.keys.s2.includes(e.code) ? 1 : -1); return true; }
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code) && adjustField(document.activeElement, /Right|KeyD/.test(e.code) ? 1 : -1)) return true;
    /* Ausrüstungs-Taste (außer Tab, das bleibt Fokuswechsel) wechselt zwischen Pause und Ausrüstung */
    if (e.code !== "Tab" && inp.keys.gear && inp.keys.gear.includes(e.code)) { if (!e.repeat) gearTabToggle(); return true; }
    if (e.code === "Tab") { moveFocus(e.shiftKey ? -1 : 1); return true; }
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "KeyW", "KeyS", "KeyA", "KeyD"].includes(e.code)) { if (document.activeElement && document.activeElement.tagName === "TEXTAREA" && /Arrow/.test(e.code)) return false; const d = /Down|KeyS/.test(e.code) ? [0, 1] : /Up|KeyW/.test(e.code) ? [0, -1] : /Right|KeyD/.test(e.code) ? [1, 0] : [-1, 0]; moveDir(d[0], d[1]); return true; }
    /* Knöpfe mit eigener Kurztaste (data-hotkey="a1" usw.), z. B. „anlegen statt …“ im Fluchfenster */
    for (const hb of modal.querySelectorAll("[data-hotkey]")) { const ks = inp.keys[hb.dataset.hotkey]; if (ks && ks.includes(e.code)) { if (!e.repeat && !hb.disabled && confirmOk()) hb.click(); return true; } } /* auch gesperrt: Taste nicht als „Bestätigen“ auf ein anderes Element durchreichen */
    if (e.code === "Enter" || e.code === "Space" || e.code === "KeyE" || e.code === "KeyJ") {
      /* gehaltene Taste (Wiederholung) und Tastendruck direkt beim Öffnen lösen nichts aus */
      if (e.repeat || !confirmOk()) return true;
      const had = document.activeElement && modal.contains(document.activeElement) && document.activeElement !== modal;
      const f = had ? document.activeElement : ensureFocus();
      if (f && modal.contains(f)) { if (f.tagName === "INPUT" && f.type === "range") return false; if (f.tagName === "SELECT") adjustField(f, 1); else f.click(); }
      return true;
    }
    return true;
  };
  /* Regler und Auswahllisten mit Links/Rechts verstellen (Tastatur und Controller) */
  function adjustField(f, d) {
    if (!f || !modal.contains(f)) return false;
    if (f.tagName === "INPUT" && f.type === "range") { const mn = +f.min || 0, mx = +f.max || 100, st = Math.max(+f.step || 1, (mx - mn) / 20); f.value = Math.max(mn, Math.min(mx, +f.value + d * st)); f.dispatchEvent(new Event("input", { bubbles: true })); f.dispatchEvent(new Event("change", { bubbles: true })); return true; }
    if (f.tagName === "SELECT") { const n = f.options.length; f.selectedIndex = (f.selectedIndex + d + n) % n; f.dispatchEvent(new Event("change", { bubbles: true })); return true; }
    return false;
  }
  const focusables = () => [...modal.querySelectorAll("button:not([disabled]),input,select,a.btn,textarea")].filter(el => el.offsetParent !== null || el === document.activeElement);
  function focusEl(el) { if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView && el.scrollIntoView({ block: "nearest", inline: "nearest" }); A.play("ui", { vol: 0.12, rate: 1.5, gap: 0.03 }); }
  /* sicherstellen, dass etwas im Menü ausgewählt ist (Controller kann sonst „ins Leere“ drücken) */
  function ensureFocus() {
    const f = document.activeElement;
    if (f && modal.contains(f) && f !== modal) return f;
    const el = modal.querySelector("[autofocus]") || focusables()[0];
    if (el) el.focus({ preventScroll: true });
    return el;
  }
  ui.ensureFocus = ensureFocus;
  function moveFocus(d) {
    const list = focusables();
    if (!list.length) return;
    let i = list.indexOf(document.activeElement); i = i < 0 ? 0 : (i + d + list.length) % list.length; focusEl(list[i]);
  }
  /* räumliche Navigation: nächstes Element in Richtung (dx, dy) – angenehm in Rastern (Schmiede, Fundbuch, Laden) */
  function moveDir(dx, dy) {
    const list = focusables(), cur = document.activeElement;
    if (!cur || !list.includes(cur)) { focusEl(ensureFocus()); return; }
    const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bs = Infinity;
    const C = []; /* W39 Robust: Kandidaten für die Zeilen-/Spalten-Wahl unten */
    for (const el of list) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect(), ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      const px = (ex - cx) * dx + (ey - cy) * dy; /* Abstand in Richtung */
      const edge = dx ? (dx > 0 ? r.left - r0.right : r0.left - r.right) : (dy > 0 ? r.top - r0.bottom : r0.top - r.bottom);
      if (px <= 2 || edge < -Math.min(r.width, r.height, r0.width, r0.height) * 0.5) continue;
      const ortho = dx ? Math.max(0, Math.abs(ey - cy) - (r.height + r0.height) / 2) : Math.max(0, Math.abs(ex - cx) - (r.width + r0.width) / 2);
      /* senkrecht: zuerst die nächste Zeile, dann die nächste Spalte darin (Listen mit Knöpfen rechts bleiben erreichbar);
         waagrecht: in der Zeile bleiben */
      const sc = Math.max(0, edge) + ortho * (dy ? 0.6 : 2.5) + Math.abs(px) * 0.05;
      if (sc < bs) { bs = sc; best = el; }
      C.push({ el, edge: Math.max(0, edge), ov: dx ? Math.min(r.bottom, r0.bottom) - Math.max(r.top, r0.top) : Math.min(r.right, r0.right) - Math.max(r.left, r0.left), off: dx ? Math.abs(ey - cy) : Math.abs(ex - cx) });
    }
    /* W39 Robust: Raster (Pausenmenü aus frei.js, Laden, Einstellungen) – in die direkt benachbarte Zelle statt schräg/weit:
       waagrecht zuerst, was in derselben Zeile liegt (Überdeckung), davon die nächste; sonst und senkrecht die nächste Zeile/Spalte
       (Kantenabstand + Toleranz), darin die mit der größten Überdeckung, bei Gleichstand die mit der nächsten Mitte.
       Gilt nur zwischen Geschwistern eines CSS-Rasters (display: grid); sonst bleibt die Wertung oben. */
    const gp = cur.parentElement, grid = !!(gp && /grid/.test(getComputedStyle(gp).display));
    const Cg = grid ? C.filter(c => c.el.parentElement === gp) : [];
    if (Cg.length) { /* nur innerhalb eines CSS-Rasters; Listen/Einstellungen und der Weg aus dem Raster heraus bleiben wie bisher */
      const C = Cg; const pickBand = arr => { const near = Math.min(...arr.map(c => c.edge)), tol = Math.max(8, (dy ? r0.height : r0.width) * 0.5); const band = arr.filter(c => c.edge <= near + tol); band.sort((p, q) => (q.ov > 4 ? q.ov : 0) - (p.ov > 4 ? p.ov : 0) || p.off - q.off || p.edge - q.edge); return band[0].el; };
      const same = dx ? C.filter(c => c.ov > Math.min(r0.height, 12) * 0.5) : [];
      best = same.length ? same.sort((p, q) => p.edge - q.edge || p.off - q.off)[0].el : pickBand(C);
    }
    if (best) focusEl(best);
    else if (dy) {
      /* W39 Bedienung: lange Fenster mit wenigen Knöpfen (Todesfenster „Alle Werte“, Zielbuch-Text): erst den Inhalt weiterrollen, umlaufen erst am Ende */
      const box = modal.querySelector(".mbox");
      if (box && (dy > 0 ? box.scrollTop + box.clientHeight < box.scrollHeight - 4 : box.scrollTop > 4)) { box.scrollTop += dy * Math.max(40, box.clientHeight * 0.6); return; }
      if (list.length > 1) moveFocus(dy); /* am Rand: der Reihe nach weiter (umlaufend); ein einziger Knopf: nicht zu ihm zurückspringen */
    }
  }
  ui.moveDir = moveDir;
  /* Reiter wechseln (Controller LB/RB, Tastatur Fähigkeitstasten oder Bild↑/Bild↓) */
  function switchTab(d) {
    const tabs = [...modal.querySelectorAll(".reiter button")]; if (!tabs.length) return;
    const i = tabs.findIndex(b => b.classList.contains("an"));
    const n = tabs[((i < 0 ? 0 : i) + d + tabs.length) % tabs.length]; n.click();
    setTimeout(() => { const f = modal.querySelector(".reiter .an") || modal.querySelector(".reiter button"); if (f) f.focus({ preventScroll: true }); }, 30);
  }

  /* ---------- Titel ---------- */
  /* W19 Slots: Titelbild mit „Weiterspielen“ (zuletzt benutzter Spielstand, Unterzeile sagt, wohin es geht) bzw. „Neues Spiel“,
     dazu „Spielstände“ (drei Plätze: spielen, neu beginnen, kopieren, löschen). Die Kennung #t-play bleibt der Hauptknopf. */
  const SL = () => Z.slots;
  function slotName(n) { return L(["Spielstand ", "Save "]) + n; }
  function fmtWhen(ts) {
    if (!ts) return "";
    const d = new Date(ts), now = new Date();
    if (!Number.isFinite(d.getTime())) return ""; /* W26 Erstspieler: kaputtes „zuletzt“ → kein „NaN.NaN.NaN“ im Titel */
    const p = x => String(x).padStart(2, "0"), hm = p(d.getHours()) + ":" + p(d.getMinutes());
    const day = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(), diff = Math.round((day(now) - day(d)) / 864e5);
    if (diff === 0) return L(["heute ", "today "]) + hm;
    if (diff === 1) return L(["gestern ", "yesterday "]) + hm;
    return Z.settings.lang === "en" ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear();
  }
  function fmtPlay(s) {
    s = Math.round(s || 0); if (s < 60) return L(["unter 1 Min.", "under 1 min"]);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? h + " h " + m + L([" Min.", " min"]) : m + L([" Min.", " min"]);
  }
  const nRuns = n => n + " " + (n === 1 ? L(["Lauf", "run"]) : L(["Läufe", "runs"]));
  const nWins = n => n + " " + (n === 1 ? L(["Sieg", "win"]) : L(["Siege", "wins"]));
  function slotLine(i) {
    const bits = [slotName(i.n), L(["zurück ins Lager", "back to the camp"])];
    bits.push(i.runs ? nRuns(i.runs) : L(["noch kein Lauf", "no run yet"]));
    if (i.wins) bits.push(nWins(i.wins));
    if (i.zuletzt) bits.push(L(["zuletzt ", "last "]) + fmtWhen(i.zuletzt));
    return bits.join(" · ");
  }
  function startGame() {
    A.init(); if (Z.settings.autoFs !== false && fs.ok && fs.touch && !fs.on()) fs.enter(); preload();
    if (ui.modalOpen) { ui.onClose = null; closeModal(); }
    title.hidden = true; Z.player = Z.newPlayer(); Z.loadArea("lager");
    if (!Z.meta.intro) { Z.meta.intro = true; Z.saveMeta(); ui.story(); }
  }
  ui.startGame = startGame;
  function showTitle() {
    title.hidden = false; hud.hidden = true;
    const S = SL();
    /* zuletzt benutzter Platz mit Fortschritt wird der aktive (so zeigen Erfolge & Co. denselben Stand wie „Weiterspielen“) */
    if (S && !Z.level) { const ls0 = S.last(); if (ls0 && ls0 !== S.active()) S.use(ls0); }
    const info = S ? S.info(S.active()) : null, cont = !!(info && !info.leer);
    const main = cont
      ? '<button id="t-play" class="t-haupt" autofocus>' + esc(L(["Weiterspielen", "Continue"])) + '<small class="t-unter">' + esc(slotLine(info)) + "</small></button>"
      : '<button id="t-play" class="t-haupt" autofocus>' + esc(L(["Neues Spiel", "New game"])) + '<small class="t-unter">' + esc(slotName(S ? S.active() : 1) + " · " + L(["Beginn im Lager vor der Feste", "starts in the camp before the keep"])) + "</small></button>";
    title.innerHTML = '<div class="tbox"><div class="ttl">' + esc(t("title")) + '</div><div class="tsub">' + esc(t("sub")) + '</div><span class="tzier"></span>' +
      '<div class="tbtn">' + main + (S ? '<button id="t-slots">' + esc(L(["Spielstände", "Saves"])) + "</button>" : "") +
      (cont && Z.achModal ? '<button id="t-ach">' + esc(L(["Erfolge", "Achievements"])) + "</button>" : "") +
      '<button id="t-set">' + esc(t("settings")) + '</button>' + (fs.ok ? '<button id="t-fs">' + esc(fs.label()) + "</button>" : "") +
      (PC ? '<button id="t-quit">' + esc(L(["Beenden", "Quit"])) + "</button>" : "") + '<a href="./#taverne">' + esc(t("tavern")) + "</a></div>" +
      '<p class="tfoot">' + L(["Ein Spiel zu Imres Tales · Kopfhörer empfohlen", "A game for Imre's Tales · headphones recommended"]) + "</p>" + pcAngebot() + "</div>";
    $("#t-play").onclick = () => { if (S && !cont) S.use(S.active(), !S.raw(S.active())); startGame(); };
    if ($("#t-slots")) $("#t-slots").onclick = () => { A.init(); ui.slots(); };
    if ($("#t-ach")) $("#t-ach").onclick = () => { A.init(); Z.achModal(false); ui.onClose = () => { if (!Z.level) ui.showTitle(); }; };
    $("#t-set").onclick = () => { A.init(); ui.settings(); };
    if ($("#t-fs")) $("#t-fs").onclick = () => { A.init(); fs.toggle(); };
    if ($("#t-quit")) $("#t-quit").onclick = () => { try { Z.saveSettings && Z.saveSettings(); } catch (_) {} PC.beenden(); };
    setTimeout(() => { if (!ui.modalOpen && !title.hidden) { const b = $("#t-play"); if (b) b.focus(); } }, 50);
  }
  ui.showTitle = showTitle;
  /* W19 Slots: Auswahl der drei Spielstände (Fenster über dem Titelbild; Zurück/B/Esc führt zum Titelbild) */
  const backToTitle = () => { if (!Z.level) ui.showTitle(); }; /* W39 Robust: über ui.showTitle, damit Hüllen (online.js: Sitzungsende, Knopf „Online spielen“) greifen */
  function slotCard(i, foc) {
    const g = i.gebiet ? L(i.gebiet.name) : "–";
    const body = i.leer
      ? '<p class="sl-leer">' + esc(L(["Leer – hier beginnt ein neues Spiel.", "Empty – a new game starts here."])) + "</p>"
      : '<p class="sl-werte"><b>' + esc(nRuns(i.runs)) + "</b> · <b>" + esc(nWins(i.wins)) + "</b>" + (i.enden ? " · ⚔ " + i.enden + "/3 " + esc(L(["Enden", "endings"])) : "") + "</p>" +
        '<p class="sl-mehr">' + esc(L(["Höchstes Gebiet: ", "Furthest area: "]) + g) + "<br>" + esc(L(["Spielzeit ", "Play time "]) + fmtPlay(i.zeit)) + (i.zuletzt ? " · " + esc(L(["zuletzt ", "last "]) + fmtWhen(i.zuletzt)) : "") + "</p>";
    const b = (act, lab, cls, af) => '<button data-act="' + act + '" data-arg="' + i.n + '"' + (cls ? ' class="' + cls + '"' : "") + (af ? " autofocus" : "") + ">" + esc(lab) + "</button>";
    const knoepfe = i.leer
      ? b("slotNeu", L(["Neues Spiel", "New game"]), "sl-los", foc)
      : b("slotSpielen", L(["Spielen", "Play"]), "sl-los", foc) + b("slotNeu", L(["Neues Spiel", "New game"])) + b("slotKopie", L(["Kopieren nach …", "Copy to …"])) + b("slotWeg", L(["Löschen", "Delete"]), "gefahr");
    return '<div class="sl-karte' + (i.leer ? " leer" : "") + (i.aktiv && !i.leer ? " aktiv" : "") + '"><div class="sl-kopf"><b>' + esc(slotName(i.n)) + "</b>" + (i.aktiv && !i.leer ? '<small>' + esc(L(["zuletzt gespielt", "last played"])) + "</small>" : "") + "</div>" +
      body + '<div class="sl-knoepfe">' + knoepfe + "</div></div>";
  }
  ui.slots = focusN => {
    const S = SL(); if (!S) return;
    const act = S.active(); focusN = focusN || act;
    let html = "<h2>" + esc(L(["Spielstände", "Saves"])) + '</h2><p class="hinweis">' + esc(L(["Jeder Spielstand hat eigenen Fortschritt (Splitter, Schmiede, Lager, Erfolge, Runen …). Einstellungen gelten für alle.", "Each save keeps its own progress (shards, forge, camp, achievements, runes …). Settings are shared."])) + '</p><div class="sl-liste">';
    for (let n = 1; n <= S.N; n++) html += slotCard(S.info(n), n === focusN);
    html += '</div><div class="knoepfe"><button data-act="close">' + esc(t("back")) + "</button></div>";
    openModal(html, { cls: "spielstaende", onClose: backToTitle });
  };
  const slotSummary = n => { const i = SL().info(n); return i.leer ? L(["leer", "empty"]) : nRuns(i.runs) + " · " + nWins(i.wins) + (i.gebiet ? " · " + L(i.gebiet.name) : ""); };
  /* Rückfrage im selben Fenster: Abbrechen kehrt zur Spielstand-Liste zurück, Fokus liegt sicher auf „Abbrechen“ */
  function slotAsk(head, txt, okLab, fn, n, gefahr) {
    ui._slotFn = fn;
    openModal("<h2>" + esc(head) + "</h2><p>" + esc(txt) + '</p><div class="knoepfe"><button data-act="slotJa"' + (gefahr ? ' class="gefahr"' : "") + ">" + esc(okLab) + '</button><button data-act="slotZurueck" data-arg="' + n + '" autofocus>' + esc(t("cancel")) + "</button></div>",
      { cls: "schmal", onClose: () => { if (!Z.level) ui.slots(n); } });
  }
  actions.slotJa = () => { const fn = ui._slotFn; ui._slotFn = null; ui.onClose = null; if (fn) fn(); };
  actions.slotZurueck = n => { ui.onClose = null; ui.slots(+n); };
  actions.slotSpielen = n => { n = +n; const S = SL(); if (S.active() !== n) S.use(n); startGame(); };
  actions.slotNeu = n => {
    n = +n; const S = SL(), i = S.info(n);
    const go = () => { S.neu(n); startGame(); };
    if (i.leer) return go();
    slotAsk(slotName(n) + L([" überschreiben?", ": overwrite?"]), L(["Ein neues Spiel ersetzt den bisherigen Fortschritt (", "A new game replaces the current progress ("]) + slotSummary(n) + L([").", ")."]), L(["Überschreiben und neu beginnen", "Overwrite and start anew"]), go, n, true);
  };
  actions.slotWeg = n => {
    n = +n;
    slotAsk(slotName(n) + L([" löschen?", ": delete?"]), slotSummary(n), L(["Löschen …", "Delete …"]), () => {
      slotAsk(L(["Wirklich endgültig löschen?", "Really delete for good?"]), slotName(n) + " (" + slotSummary(n) + L([") wird gelöscht. Das lässt sich nicht rückgängig machen.", ") will be deleted. This cannot be undone."]),
        L(["Endgültig löschen", "Delete for good"]), () => { SL().loeschen(n); ui.slots(n); ui.toast(slotName(n) + L([" gelöscht.", " deleted."])); }, n, true);
    }, n, true);
  };
  actions.slotKopie = n => {
    n = +n; const S = SL();
    let html = "<h2>" + esc(slotName(n) + L([" kopieren nach …", ": copy to …"])) + '</h2><div class="knoepfe senk">';
    for (let k = 1; k <= S.N; k++) if (k !== n) html += '<button data-act="slotKopieZiel" data-arg="' + n + ":" + k + '"' + (html.includes("autofocus") ? "" : " autofocus") + ">" + esc(slotName(k)) + " <small>· " + esc(slotSummary(k)) + "</small></button>";
    html += '<button data-act="slotZurueck" data-arg="' + n + '">' + esc(t("cancel")) + "</button></div>";
    openModal(html, { cls: "schmal", onClose: () => { if (!Z.level) ui.slots(n); } });
  };
  actions.slotKopieZiel = arg => {
    const [a, b] = String(arg).split(":").map(Number), S = SL();
    const go = () => { const ok = S.kopieren(a, b); ui.slots(b); ui.toast(ok ? slotName(a) + L([" nach ", " copied to "]) + slotName(b) + L([" kopiert.", "."]) : L(["Kopieren fehlgeschlagen (Speicher voll?).", "Copy failed (storage full?)."])); };
    if (S.info(b).leer) return go();
    slotAsk(slotName(b) + L([" überschreiben?", ": overwrite?"]), slotName(b) + " (" + slotSummary(b) + L([") wird durch eine Kopie von ", ") will be replaced by a copy of "]) + slotName(a) + L([" ersetzt.", "."]), L(["Überschreiben", "Overwrite"]), go, a, true);
  };
  /* W19 Slots: zurück zum Titelbild (aus Lager oder Lauf) – Gebiet abbauen, Stand sichern; danach lässt sich der Spielstand wechseln */
  ui.toTitle = () => {
    if (ui.modalOpen) { ui.onClose = null; closeModal(); }
    ui.fade(() => {
      try { Z.saveMeta(); } catch (e) { console.error(e); }
      for (const k of ["enemies", "projs", "hazards", "allies", "pickups", "propsLive", "stuck", "bolts", "gadgets"]) if (Array.isArray(Z[k])) Z[k].length = 0;
      Z.run = null; Z.boss = null; Z.bossDefeated = false; Z.interacts = []; Z.player = null; Z.level = null;
      try { Z.ambience && Z.ambience.set(null); } catch (_) {}
      ui.clearQueue(); ui.choiceActive = null;
      for (const el of [bossbar, prompt, banner, choice, card, $("#bubble"), $("#touch")]) if (el) el.hidden = true;
      Z.paused = false;
      ui.showTitle(); /* W39 Robust: Hülle aus online.js – vorher blieb eine Online-Sitzung beim Titel weiterlaufen und der Knopf „Online spielen“ fehlte */
    });
  };
  actions.toTitle = () => {
    if (!Z.run) return ui.toTitle();
    ui.confirm(L(["Zum Titelbildschirm?", "Back to the title screen?"]), L(["Der laufende Durchgang endet. Nicht abgelieferte Seelensplitter gehen verloren.", "The current run ends. Undelivered soul shards will be lost."]), L(["Zum Titelbildschirm", "To the title screen"]), () => ui.toTitle());
  };
  /* W19 Slots (ersetzt den W18-Textverweis): im Browser am PC ein nachrangiger Download-Knopf – Windows → Setup, Linux x86_64 → AppImage;
     nicht im Programm (window.__zsPC), nicht auf Touch/Handy, Mac/andere: nichts */
  const DL_BASE = "https://github.com/gansklebrig/Imres-tales-Public/releases";
  ui.pcDownload = () => {
    const pl = navigator.platform || "", ua = navigator.userAgent || "";
    if (window.__zsPC || matchMedia("(pointer: coarse)").matches || /Android|CrOS|iPhone|iPad/i.test(ua)) return null;
    if (/^Win/i.test(pl) || (!pl && /Windows NT/i.test(ua))) return { os: "win", url: DL_BASE + "/download/zerstoerer-pc/Zerstoerer-Setup.exe", lab: L(["⤓ Für Windows herunterladen", "⤓ Download for Windows"]) };
    if (/Linux x86_64/i.test(pl)) return { os: "linux", url: DL_BASE + "/download/zerstoerer-pc/Zerstoerer.AppImage", lab: L(["⤓ Für Linux herunterladen", "⤓ Download for Linux"]) };
    return null;
  };
  function pcAngebot() {
    const d = ui.pcDownload(); if (!d) return "";
    return '<div class="t-dl"><a class="t-dl-knopf" href="' + d.url + '" download>' + esc(d.lab) + "</a>" +
      '<small>' + esc(L(["ca. 180 MB · Spiel-Updates kommen danach automatisch, ohne Neuinstallation", "approx. 180 MB · game updates then arrive automatically, no reinstall"])) +
      (d.os === "win" ? "<br>" + esc(L(["Windows fragt beim ersten Start: „Weitere Informationen“ → „Trotzdem ausführen“", "On first start Windows asks: “More info” → “Run anyway”"])) : "") +
      ' · <a class="t-dl-alle" href="' + DL_BASE + '/tag/zerstoerer-pc" target="_blank" rel="noopener">' + esc(L(["Alle Downloads", "All downloads"])) + "</a></small></div>";
  }
  function preload() { A.loadAll(A.allSfxPaths()); }
  ui.story = () => openModal('<h2>' + esc(t("title")) + " · " + L(["Die Feste der Fäden", "The Keep of Threads"]) + '</h2><p class="erz">' + t("intro") + '</p><div class="knoepfe"><button data-act="close" autofocus>' + esc(t("cont")) + "</button></div>", { cls: "schmal" });
  actions.close = () => closeModal();
  /* Erster Lauf: kein Fenster mehr – eine kurze Tastenübersicht blendet sich ein, das Spiel läuft weiter.
     Die volle Übersicht gibt es im Pausenmenü („Steuerung“). */
  ui.tutorial = () => {
    Z.meta.tut = true; Z.saveMeta();
    /* Lernschilder in Lager und Torhof (schilder.js) zeigen die Steuerung an Ort und Stelle – dann keine Übersicht oben */
    if (Z.schilder && Z.schilder.aktiv()) return;
    setTimeout(() => {
      if (touchy()) { ui.notify("<b>" + esc(t("tut")) + "</b><br><small>" + esc(t("ctrlTouch")) + "</small>", { prio: 2, art: "pergament", dauer: 9000, icon: "✋" }); return; }
      const k = a => ui.key(a) + " " + esc(L(ACT_NAMES[a]));
      ui.notify("<b>" + esc(t("tut")) + "</b><br><small>" + ["a1", "a2", "jump", "roll", "use", "potion", "map", "pause"].map(k).join(" · ") + "</small>", { prio: 2, art: "pergament", dauer: 10000, icon: "⚒" });
    }, 1600);
  };
  ui.controlsHelp = () => {
    const dev = (touchy() ? esc(t("ctrlTouch")) : bindingSummary()) + '<br><small class="hinweis">' + L(["Alles umbelegbar: Einstellungen → Steuerung.", "Everything can be remapped: Settings → Controls."]) + "</small>";
    openModal("<h2>" + esc(t("tut")) + '</h2><p class="steuer">' + dev + '</p><p class="tipp">' + esc(L(TX.tips[0])) + '</p><div class="knoepfe"><button data-act="close" autofocus>' + esc(t("back")) + "</button></div>", { cls: "schmal" });
  };

  /* ======================= AUSRÜSTUNG =======================
     Damit man nicht vergisst, was man trägt:
     · Schnellansicht: Ausrüstungs-Taste halten (Tab / C, Controller: rechten Stick drücken oder „Ansicht“ halten) blendet
       halbtransparent die Karten von Hand 1, Hand 2 und beiden Fähigkeiten über der Schnellleiste ein. Loslassen blendet
       aus. Das Spiel läuft weiter (keine Zeitlupe – sonst wäre Halten ein Ausweich-Trick). Maus über einem Platz der
       Schnellleiste (Touch: Platz gedrückt halten) zeigt nur dessen Karte.
     · Vollansicht: Pausenmenü, Reiter „Ausrüstung“ (LB/RB bzw. die Fähigkeitstasten, oder die Ausrüstungs-Taste):
       vollständige Waffenkarten, Fähigkeiten, Runengürtel & Familien, Bewegungs-Runen, Segen/Lied/Pakte/Fluch, Werte. */
  const SLOT_N = { a1: ["Hand 1", "Hand 1"], a2: ["Hand 2", "Hand 2"], s1: ["Fähigkeit 1", "Skill 1"], s2: ["Fähigkeit 2", "Skill 2"] };
  const nf = (v, d) => { const s = Number(v || 0).toFixed(d || 0); return en() ? s : s.replace(".", ","); };
  const pc = v => (v < 0 ? "−" : "+") + Math.round(Math.abs(v) * 100) + (en() ? "%" : " %");
  const CRIT = {
    always: ["immer kritisch", "always crits"], backstab: ["von hinten oder gegen Ahnungslose", "from behind or vs unaware foes"],
    stunned: ["gegen Betäubte und Gefesselte", "vs stunned or rooted foes"], multi: ["ab dem 3. Gegner im selben Hieb", "from the 3rd foe in one swing"],
    tip: ["mit der Spitze (auf Abstand)", "with the tip (at a distance)"], tipUp: ["mit der Spitze nach oben", "with the tip, upward"],
    air: ["gegen Gegner in der Luft", "vs airborne foes"], burning: ["gegen Brennende", "vs burning foes"], afterRoll: ["direkt nach einer Rolle", "right after a roll"],
    poisoned: ["gegen Vergiftete", "vs poisoned foes"], bleeding: ["gegen Blutende", "vs bleeding foes"], far: ["auf große Entfernung", "at long range"]
  };
  const EFF_N = { bleed: ["Blutung", "Bleeding"], burn: ["Brand", "Burning"], poison: ["Gift", "Poison"], stun: ["Betäubung", "Stun"], slow: ["Verlangsamung", "Slow"], weak: ["Schwächung", "Weaken"], root: ["Fesseln", "Root"], freeze: ["Frost", "Frost"], shock: ["Blitz", "Shock"] };
  const gearKbd = s => (touchy() ? "" : ui.key(s));
  /* Taste(n) der Ausrüstung für das aktuelle Gerät, z. B. „[Tab]“ oder „[RS] / [View] halten“ */
  function gearKeyHTML(hold) {
    if (touchy()) return "";
    if (inp.device === "pad") return (inp.padOf("gear") != null ? ui.kbd(inp.padButtonName(inp.padOf("gear"))) + " / " : "") + ui.kbd(inp.padButtonName(inp.padOf("map"))) + /* W20 Steuerung */ (hold ? " " + L(["halten", "hold"]) : "");
    const k = inp.keys.gear && (inp.keys.gear[0] || inp.keys.gear[1]);
    return k ? ui.kbd(inp.keyName(k)) + (hold ? " " + L(["halten", "hold"]) : "") : "";
  }
  ui.gearKeyHTML = gearKeyHTML;
  const kindOf = (it, d) => (it.type === "skill" ? L(["Fähigkeit", "Skill"]) : d.kind === "ranged" ? L(["Fernkampf", "Ranged"]) : d.kind === "shield" ? L(["Schild", "Shield"]) : L(["Nahkampf", "Melee"]));
  const klingen = () => (Z.meta && Z.meta.up && Z.meta.up.klingen) || 0;
  const hasB = b => !!(Z.has && Z.has(b));
  /* fester Schadensfaktor wie im Kampf (ohne kurzzeitige Zustände wie Zorn, Adrenalin, Klingentanz) */
  const fixMul = it => Z.itemMul(it) * (1 + 0.05 * klingen()) * (hasB("zerbrechlich") ? 1.5 : 1);
  const runeHas = (it, r) => !!(it && it.runes && it.runes.includes(r));
  function effsOf(d) {
    const out = {};
    const add = (e, i) => { if (!e) return; for (const k in e) if (e[k]) (out[k] = out[k] || []).push(i); };
    add(d.eff, 0); if (d.shoot) add(d.shoot.eff, 0); if (d.shield) { add(d.shield.bashEff, 0); }
    if (d.combo) d.combo.forEach((c, i) => add(c.eff, i + 1));
    return out;
  }
  function dotsOf(it, d) { const e = effsOf(d); return !!(e.burn || e.poison || e.bleed || (it.aff || []).some(a => /brennend|giftig|blutig/.test(a)) || runeHas(it, "brand") || runeHas(it, "gift")); }
  /* Werte einer Waffe: [Bezeichnung, Wert] – schon mit allen festen Faktoren */
  function weaponRows(it, d, kurz) {
    const m = fixMul(it), r = v => Math.round(v * m), rows = [];
    const spd = 1 + (Z.hasAff(it, "flink") ? 0.18 : 0) + (runeHas(it, "tempo") ? 0.15 : 0);
    if (d.combo) {
      const dm = d.combo.map(c => r(c.dmg)), dur = d.combo.reduce((a, c) => a + (c.pre || 0) + (c.act || 0) + (c.post || 0), 0) / spd, tot = dm.reduce((a, b) => a + b, 0);
      rows.push([L(["Schaden je Hieb", "Damage per strike"]), dm.join(" · ")]);
      rows.push(kurz ? [L(["Schaden/s", "Damage/s"]), "≈ " + Math.round(tot / dur)] : [L(["Kombo", "Combo"]), tot + L([" in ", " in "]) + nf(dur, 2) + " s · ≈ " + Math.round(tot / dur) + L([" je Sekunde", " per second"])]);
      if (!kurz) {
        const reach = Math.max(0, ...d.combo.map(c => (c.box ? (c.spin ? c.box[2] / 2 + 4 : c.box[0] + c.box[2]) : 0) + (c.lunge || 0) * 0.08)) / T;
        rows.push([L(["Reichweite", "Reach"]), (reach < 1.9 ? L(["kurz", "short"]) : reach < 2.6 ? L(["mittel", "medium"]) : L(["weit", "long"])) + " · " + nf(reach, 1) + L([" Felder", " tiles"])]);
        rows.push([L(["Tempo", "Speed"]), nf(d.combo.length / dur, 1) + L([" Hiebe/s", " strikes/s"]) + (spd > 1 ? " (" + pc(spd - 1) + ")" : "")]);
      }
    } else if (d.shoot) {
      const s = d.shoot, mag = s.mag ? s.mag + (Z.metaLvl(it.id) >= 3 ? 2 : 0) : 0;
      rows.push([L(["Schaden", "Damage"]), s.dmgFull ? r(s.dmg) + "–" + r(s.dmgFull) + (kurz ? "" : L([" (voll gespannt)", " (fully drawn)"])) : r(s.dmg) + (s.burst ? " ×" + s.burst : "")]);
      if (!kurz) {
        if (s.charge) rows.push([L(["Spannen", "Draw"]), nf(s.charge / (runeHas(it, "tempo") ? 1.15 : 1), 2) + " s"]);
        else rows.push([L(["Tempo", "Speed"]), nf(spd / Math.max(0.05, (s.pre || 0.06) + (s.post || 0.15)), 1) + L([" Schuss/s", " shots/s"])]);
        if (mag) rows.push([L(["Magazin", "Magazine"]), mag + L([" Schuss · Nachladen ", " shots · reload "]) + nf(s.reload || 0, 1) + " s"]);
        rows.push([L(["Reichweite", "Reach"]), L(["Fernkampf", "Ranged"]) + (d.pierce ? L([" · durchschlägt", " · pierces"]) : "")]);
      }
    } else if (d.shield) {
      const sh = d.shield;
      rows.push([L(["Schildstoß", "Shield bash"]), String(r(sh.bash)) + (kurz ? "" : " · " + L(["Konter nach Parade ", "parry riposte "]) + r(sh.bash * 1.5))]);
      rows.push([L(["Block", "Block"]), Math.round(sh.block * 100) + (en() ? "%" : " %") + L([" abgefangen", " absorbed"]) + (kurz ? "" : " · " + L(["Parade-Fenster ", "parry window "]) + nf(sh.parry, 2) + " s")]);
      if (!kurz && sh.parryStun) rows.push([L(["Nach Parade", "After a parry"]), L(["Gegner ", "foe stunned "]) + nf(sh.parryStun, 1) + L([" s betäubt", " s"])]);
    }
    if (!d.shield) {
      const cr = [];
      if (d.crit) cr.push(L(CRIT[d.crit] || [d.crit, d.crit]));
      if (d.combo) d.combo.forEach((c, i) => { if (c.crit && c.crit !== d.crit) cr.push(L(["Hieb ", "strike "]) + (i + 1) + ": " + L(CRIT[c.crit] || [c.crit, c.crit])); });
      if (Z.hasAff(it, "meuchelnd")) cr.push(L(["von hinten", "from behind"]));
      if (Z.hasAff(it, "kritisch")) cr.push(L(["15 % Chance", "15% chance"]));
      const cm = (d.critMul || (d.combo && d.combo.find(c => c.critMul) || {}).critMul || 1.8) * (runeHas(it, "krit") ? 1.5 : 1);
      rows.push([L(["Kritisch", "Critical"]), (cr.length ? cr.join(" · ") : L(["nur durch Faden, Rauch oder Konter", "only via thread, smoke or riposte"])) + " · ×" + nf(cm, 1)]);
    }
    return rows;
  }
  /* Eigenschaften: Faden, Brand/Gift/Blutung, Eigenschaften (Affixe), Besonderheiten */
  function propsHTML(it, d, kurz) {
    const out = [];
    if (d.faden) out.push(kurz ? '<span class="as-faden">◈ ' + L(["Faden", "Thread"]) + "</span>" : '<li class="faden"><b>◈ ' + L(["Faden", "Thread"]) + "</b>: " + esc(L(Z.FADEN_TXT || ["markiert Gegner", "marks foes"])).replace(/^[^:]*:\s*/, "") + "</li>");
    const ef = effsOf(d);
    for (const k in ef) { const n = L(EFF_N[k] || [k, k]), at = ef[k].filter(Boolean); const cls = k === "poison" ? "gift" : ""; out.push(kurz ? '<span class="' + cls + '">' + esc(n) + "</span>" : '<li class="' + cls + '"><b>' + esc(n) + "</b>" + (at.length && d.combo && at.length < d.combo.length ? L([" bei Hieb ", " on strike "]) + at.join(", ") : L([" bei jedem Treffer", " on every hit"])) + "</li>"); }
    for (const a of it.aff || []) { const A0 = Z.AFFIX[a]; if (!A0) continue; out.push(kurz ? '<span class="' + (a === "giftig" ? "gift" : "") + '">' + esc(L(A0.n)) + "</span>" : '<li class="' + (a === "giftig" ? "gift" : "") + '"><b>' + esc(L(A0.n)) + "</b>: " + esc(L(A0.d)) + "</li>"); }
    if (!kurz) {
      if (d.leech) out.push("<li><b>" + L(["Lebensraub", "Life drain"]) + "</b>: " + Math.round(d.leech * 100) + (en() ? "%" : " %") + "</li>");
      if (d.killHeal) out.push("<li><b>" + L(["Heilung", "Healing"]) + "</b>: " + L(["jeder Kill ", "every kill "]) + Math.round(d.killHeal * 100) + (en() ? "%" : " %") + "</li>");
      if (d.vsHoly) out.push("<li><b>" + L(["Heilig", "Holy"]) + "</b>: ×" + nf(d.vsHoly, 1) + L([" gegen Untote und Dämonen", " vs undead and demons"]) + "</li>");
      if (d.superArmor) out.push("<li><b>" + L(["Unbeirrbar", "Unflinching"]) + "</b>: " + L(["Treffer unterbrechen den Schwung nicht", "hits don't interrupt the swing"]) + "</li>");
    }
    return out.join(kurz ? " · " : "");
  }
  function runesHTML(it, kurz) {
    const rs = (it.runes || []).filter(k => Z.RUNES[k]); if (!rs.length) return "";
    if (kurz) return rs.map(k => '<span style="color:' + Z.RUNES[k].col + '">' + Z.RUNES[k].ico + " " + esc(L(Z.RUNES[k].n)) + "</span>").join(" ");
    const ra = Z.runeActive ? Z.runeActive() : { fam: {} };
    return rs.map(k => { const R = Z.RUNES[k], F = R.fam && Z.RUNE_FAM && Z.RUNE_FAM[R.fam]; return '<li style="--c:' + R.col + '"><b style="color:' + R.col + '">' + R.ico + " " + esc(L(R.n)) + "</b>: " + esc(L(R.d)) + (F ? ' <small class="ag-fam" style="color:' + F.col + '">' + F.ico + " " + esc(L(F.n)) + " " + (ra.fam[R.fam] || 0) + "/3</small>" : "") + "</li>"; }).join("");
  }
  /* Skalierung: woraus die Kraft der Waffe besteht */
  function scaleHTML(it) {
    const P = Z.player, st = Z.itemStat(it), S0 = Z.STATS[st], n = P.stats[st] || 0, lv = Z.metaLvl(it.id), rows = [];
    rows.push([L(["Fundstufe ", "Find tier "]) + (it.tier + 1), "×" + nf(Z.BAL.itemMul(it.tier), 2)]);
    if (it.rar) rows.push([L(Z.RARITY[it.rar].n), pc(0.08 * it.rar)]);
    rows.push(['<span style="color:' + S0.col + '">' + esc(L(S0.n)) + " " + n + "</span>", n ? pc(0.12 * n) : "±0"]);
    if (lv) rows.push([L(["Nundros Schärfe ◆", "Nundro's sharpening ◆"]) + lv, pc(0.1 * lv)]);
    if (it.plus) rows.push(['<span style="color:' + (Z.plusCol ? Z.plusCol(it.plus) : "#ffd27a") + '">' + L(["Schmiedestufe +", "Forge level +"]) + it.plus + "</span>", pc((Z.SCHMIEDE ? Z.SCHMIEDE.PLUS_DMG : 0.15) * it.plus)]);
    if (Z.hasAff(it, "scharf")) rows.push([L(Z.AFFIX.scharf.n), pc(0.15)]);
    if (it.cursed && Z.CURSE && Z.CURSE[it.cursed]) rows.push(['<span class="gefahr">☠ ' + esc(L(Z.CURSE[it.cursed].name)) + "</span>", "×" + nf(Z.CURSE[it.cursed].mul, 1)]);
    if (klingen()) rows.push([L(["Geschliffene Klingen (Lager)", "Honed blades (camp)"]), pc(0.05 * klingen())]);
    if (hasB("zerbrechlich")) rows.push([esc(L(Z.BLESS.zerbrechlich.n)), pc(0.5)]);
    return '<table class="werte ag-skal">' + rows.map(x => "<tr><th>" + x[0] + "</th><td>" + x[1] + "</td></tr>").join("") + '<tr class="summe"><th>' + L(["Kraft gesamt", "Total power"]) + "</th><td>×" + nf(fixMul(it), 2) + "</td></tr></table>";
  }
  /* Was Segen, Runen-Familien und Zustände gerade an dieser Waffe ändern */
  function buffsHTML(it, d) {
    const P = Z.player, out = [], skill = it.type === "skill";
    const B = (id, txt, on) => { if (hasB(id) && Z.BLESS[id]) out.push('<li class="k-' + Z.BLESS[id].k + (on ? " jetzt" : "") + '"><b>' + esc(L(Z.BLESS[id].n)) + "</b>: " + txt + (on ? ' <em>' + L(["jetzt aktiv", "active now"]) + "</em>" : "") + "</li>"); };
    if (!skill) {
      B("ersterSchlag", L(["erster Treffer je Gegner ×2", "first hit on each foe ×2"]));
      B("darkinblut", L(["unter 50 % Leben +40 %", "below 50% health +40%"]), P.hp < P.hpMax * 0.5);
      B("klingentanz", L(["nach einer Rolle 2 s lang +40 %", "+40% for 2 s after a roll"]), P.st && P.st.dance > 0);
      B("kopfgeld", L(["je Kill +8 % für 6 s (bis 5)", "+8% per kill for 6 s (up to 5)"]) + (P.bounty ? " · " + P.bounty + "/5" : ""), P.bounty > 0);
      B("fesselnd", L(["+60 % gegen Betäubte und Gefesselte", "+60% vs stunned and rooted foes"]));
      B("netzweber", L(["jeder 5. Treffer fesselt", "every 5th hit roots"]));
      B("vampir", L(["2 % des Schadens als Leben", "2% of damage as health"]));
      if (dotsOf(it, d)) B("giftmeister", L(["Brand, Gift und Blutung dieser Waffe doppelt", "this weapon's burn, poison and bleed doubled"]));
      if (d.kind === "shield") B("bollwerk", L(["jeder Block heilt 3 %", "every block heals 3%"]));
    } else {
      B("flinkeHaende", L(["lädt 30 % schneller", "recharges 30% faster"]));
    }
    if (P.wrath > 0) out.push('<li class="jetzt"><b>' + L(["Darkin-Zorn", "Darkin wrath"]) + "</b>: +60 % <em>" + L(["jetzt aktiv", "active now"]) + "</em></li>");
    if (P.st && P.st.adrenalin > 0 && !skill) out.push('<li class="jetzt"><b>' + L(["Adrenalin", "Adrenaline"]) + "</b>: +25 % <em>" + L(["jetzt aktiv", "active now"]) + "</em></li>");
    /* Familien, zu denen die Gravuren dieser Waffe beitragen */
    const ra = Z.runeActive ? Z.runeActive() : { fam: {} }, seen = {};
    for (const k of it.runes || []) { const f = Z.RUNES[k] && Z.RUNES[k].fam, F = f && Z.RUNE_FAM && Z.RUNE_FAM[f]; if (!F || seen[f]) continue; seen[f] = 1; const n = ra.fam[f] || 0; if (n >= 2) out.push('<li style="color:' + F.col + '"><b>' + F.ico + " " + esc(L(F.n)) + " " + n + "/3</b>: " + esc(L(F.b2)) + (n >= 3 ? " · " + esc(L(F.b3)) : "") + "</li>"); }
    return out.join("");
  }
  /* volle Waffen-/Fähigkeitskarte (Pausenmenü) */
  function gearCardFull(s) {
    const P = Z.player, it = P.slots[s], kopf = '<div class="ag-platz">' + gearKbd(s) + " " + esc(L(SLOT_N[s])) + "</div>";
    if (!it) {
      const fist = s === "a1" && Z.WEAPONS.faeuste;
      return '<button type="button" class="ag-karte leer" data-act="agKarte">' + kopf + (fist ? "<b>" + esc(L(fist.n)) + '</b><table class="werte">' + weaponRows({ id: "faeuste", tier: 0, rar: 0, aff: [] }, fist, false).map(x => "<tr><th>" + esc(x[0]) + "</th><td>" + esc(x[1]) + "</td></tr>").join("") + "</table>" : '<p class="hinweis">' + L(["leer", "empty"]) + "</p>") + "</button>";
    }
    const d = Z.itemDef(it); if (!d) return "";
    const r = Z.RARITY[it.rar], st = Z.STATS[d.stat] || Z.STATS.brut, lvl = Z.metaLvl(it.id), skill = it.type === "skill";
    let h = '<button type="button" class="ag-karte" data-act="agKarte" style="--rar:' + (it.cursed ? "#c040ff" : r.col) + '">' + kopf;
    h += '<div class="ic-kopf"><b>' + esc(L(d.n)) + (it.plus ? ' <span class="plus" style="color:' + (Z.plusCol ? Z.plusCol(it.plus) : "#ffd27a") + '">+' + it.plus + "</span>" : "") + "</b>" + (lvl ? ' <span class="lv">◆' + lvl + "</span>" : "") +
      "<small>" + esc(L(r.n)) + " · " + kindOf(it, d) + ' · <span style="color:' + st.col + '">' + esc(L(st.n)) + "</span> · " + L(["Fundstufe", "Tier"]) + " " + (it.tier + 1) + "</small></div>";
    if (Z.curseCardHTML) h += Z.curseCardHTML(it);
    h += '<div class="' + (skill ? "ag-innen1" : "ag-innen") + '"><div class="ag-l"><p class="ag-d">' + esc(L(d.d)) + "</p>";
    if (skill) {
      const cd = d.cd || 0, f = (hasB("flinkeHaende") ? 1 / 1.3 : 1) * (Z.hasPact && Z.hasPact("ungeduld") ? 1.5 : 1), left = P.cd[s] || 0;
      h += '<table class="werte"><tr><th>' + L(["Abklingzeit", "Cooldown"]) + "</th><td>" + nf(cd, 0) + " s" + (Math.abs(f - 1) > 0.01 ? " → " + nf(cd * f, 1) + " s" : "") + "</td></tr><tr><th>" + L(["Jetzt", "Now"]) + "</th><td>" + (left > 0.05 ? L(["lädt noch ", "ready in "]) + nf(left, 1) + " s" : '<span class="bereit">' + L(["bereit", "ready"]) + "</span>") + "</td></tr><tr><th>" + L(["Kraft", "Power"]) + "</th><td>×" + nf(Z.itemMul(it), 2) + "</td></tr></table>";
    } else h += '<table class="werte">' + weaponRows(it, d, false).map(x => "<tr><th>" + esc(x[0]) + "</th><td>" + esc(x[1]) + "</td></tr>").join("") + "</table>";
    const pr = propsHTML(it, d, false); if (pr) h += '<h4>' + L(["Eigenschaften", "Traits"]) + '</h4><ul class="ag-liste">' + pr + "</ul>";
    const rn = runesHTML(it, false); if (rn) h += "<h4>" + L(["Gravuren", "Engravings"]) + '</h4><ul class="ag-liste runen">' + rn + "</ul>";
    if (d.master) h += '<p class="' + (lvl >= 3 ? "meister" : "ag-gesperrt") + '">' + esc(L(d.master)) + (lvl >= 3 ? "" : L([" (ab Nundros Schärfe 3)", " (from Nundro's sharpening 3)"])) + "</p>";
    h += '</div><div class="ag-r">';
    if (!skill) h += "<h4>" + L(["Skalierung", "Scaling"]) + "</h4>" + scaleHTML(it);
    const bf = buffsHTML(it, d); if (bf) h += "<h4>" + L(["Wirkt gerade mit", "Currently boosted by"]) + '</h4><ul class="ag-liste ag-buffs">' + bf + "</ul>";
    if (d.tags && d.tags.length) h += '<p class="tags">' + d.tags.map(x => "<span>" + esc(tagTxt(x)) + "</span>").join("") + "</p>";
    return h + "</div></div></button>";
  }
  /* kompakte Karte (Schnellansicht über der Schnellleiste) */
  function gearCardQuick(s) {
    const P = Z.player, it = P.slots[s], skill = s[0] === "s";
    const kopf = '<div class="as-kopf">' + gearKbd(s) + " " + esc(L(SLOT_N[s])) + "</div>";
    if (!it) { const fist = s === "a1" && Z.WEAPONS.faeuste; return '<div class="as-karte leer">' + kopf + (fist ? '<b class="as-name">' + esc(L(fist.n)) + "</b>" : '<span class="as-leer">' + L(["leer", "empty"]) + "</span>") + "</div>"; }
    const d = Z.itemDef(it); if (!d) return "";
    const r = Z.RARITY[it.rar], st = Z.STATS[d.stat] || Z.STATS.brut;
    let h = '<div class="as-karte" style="--rar:' + (it.cursed ? "#c040ff" : r.col) + '">' + kopf + '<b class="as-name">' + esc(L(d.n)) + (it.plus ? ' <span style="color:' + (Z.plusCol ? Z.plusCol(it.plus) : "#ffd27a") + '">+' + it.plus + "</span>" : "") + "</b>" +
      '<small class="as-art">' + esc(L(r.n)) + " · " + kindOf(it, d) + ' · <span style="color:' + st.col + '">' + esc(L(st.n)) + "</span>" + (it.cursed ? ' · <span class="gefahr">☠</span>' : "") + "</small>";
    if (skill) {
      const cd = d.cd || 0, f = (hasB("flinkeHaende") ? 1 / 1.3 : 1) * (Z.hasPact && Z.hasPact("ungeduld") ? 1.5 : 1), left = P.cd[s] || 0;
      h += '<div class="as-z">' + L(["Abklingzeit ", "Cooldown "]) + nf(cd * f, cd * f < 10 && Math.abs(f - 1) > 0.01 ? 1 : 0) + " s · " + (left > 0.05 ? L(["noch ", "in "]) + Math.ceil(left) + " s" : '<span class="bereit">' + L(["bereit", "ready"]) + "</span>") + "</div>" +
        '<div class="as-z as-d">' + esc(L(d.d)) + "</div>";
    } else {
      for (const x of weaponRows(it, d, true)) h += '<div class="as-z"><i>' + esc(x[0]) + "</i> " + esc(x[1]) + "</div>";
    }
    const pr = propsHTML(it, d, true), rn = runesHTML(it, true);
    if (pr) h += '<div class="as-z as-eig">' + pr + "</div>";
    if (rn) h += '<div class="as-z as-rn">' + rn + "</div>";
    return h + "</div>";
  }
  /* Runengürtel, Familien, Bewegungs-Runen */
  function runenBlock() {
    const P = Z.player, ra = Z.runeActive ? Z.runeActive() : { keys: [], fam: {} }, belt = (P.runeBelt || []).filter(k => Z.RUNES[k]), mx = (Z.RUNE_NUM && Z.RUNE_NUM.guertel) || 3;
    let h = "<h4>" + L(["Runengürtel", "Rune belt"]) + " " + belt.length + "/" + mx + "</h4>";
    h += belt.length ? '<ul class="ag-liste runen">' + belt.map(k => { const R = Z.RUNES[k], F = R.fam && Z.RUNE_FAM[R.fam]; return '<li><b style="color:' + R.col + '">' + R.ico + " " + esc(L(R.n)) + "</b>: " + esc(L(R.d)) + (F ? ' <small class="ag-fam" style="color:' + F.col + '">' + F.ico + " " + esc(L(F.n)) + "</small>" : "") + "</li>"; }).join("") + "</ul>"
      : '<p class="hinweis">' + L(["Leer – Runensteine liegen in der Feste. Gravuren an den Waffen zählen auch zu den Familien.", "Empty – rune stones lie in the keep. Weapon engravings count toward families too."]) + "</p>";
    const fams = Object.keys(ra.fam || {}).filter(f => Z.RUNE_FAM && Z.RUNE_FAM[f]);
    if (fams.length) {
      h += "<h4>" + L(["Familien", "Families"]) + ' <small class="hinweis">' + L(["2 und 3 verschiedene Runen: Bonus", "2 and 3 different runes: bonus"]) + "</small></h4>";
      h += '<ul class="ag-liste ag-fams">' + fams.map(f => { const F = Z.RUNE_FAM[f], n = ra.fam[f]; return '<li style="--c:' + F.col + '"><b style="color:' + F.col + '">' + F.ico + " " + esc(L(F.n)) + " " + "◆".repeat(Math.min(3, n)) + "◇".repeat(Math.max(0, 3 - n)) + "</b>" +
        '<span class="' + (n >= 2 ? "an" : "aus") + '">2: ' + esc(L(F.b2)) + '</span><span class="' + (n >= 3 ? "an" : "aus") + '">3: ' + esc(L(F.b3)) + "</span></li>"; }).join("") + "</ul>";
    }
    const MR = Z.MOVE_RUNES || {}, frei = (Z.meta.runen && Z.meta.runen.frei) || {};
    const mv = Object.keys(MR).filter(k => Z.runeAll || (Z.hasMoveRune && Z.hasMoveRune(k)));
    /* W15 Runen: Bewegungs-Runen sind ab dem Fund immer aktiv (kein Gürtelplatz) – sichtbar als „aktiv“ */
    if (mv.length) h += "<h4>" + L(["Bewegungs-Runen", "Movement runes"]) + ' <small class="hinweis">' + L(["immer aktiv, kein Gürtelplatz nötig", "always active, no belt slot needed"]) + '</small></h4><ul class="ag-liste ag-bew">' + mv.map(k => '<li class="rn-aktiv"><b style="color:' + MR[k].col + '">ᛟ ' + esc(L(MR[k].n)) + '</b> <span class="ag-aktiv">✓ ' + L(["aktiv", "active"]) + "</span>" + (frei[k] || Z.runeAll ? "" : ' <small class="hinweis">' + L(["nur dieser Lauf", "this run only"]) + "</small>") + '<br><span class="ag-how">' + (Z.runeHow ? Z.runeHow(k)[0] : esc(L(MR[k].d))) + '</span><br><small class="ag-rd">' + esc(L(MR[k].d)) + "</small></li>").join("") + "</ul>";
    return h;
  }
  /* Ezekiel selbst: Leben, Tränke, Werte, Segen & Lied, Pakte, Fluch, Paarungen */
  function selbstBlock() {
    const P = Z.player, run = Z.run, st = P.stats;
    let h = '<table class="werte"><tr><th>' + L(["Leben", "Health"]) + "</th><td>" + Math.ceil(Math.max(0, P.hp)) + " / " + P.hpMax + "</td></tr><tr><th>" + L(["Heiltränke", "Potions"]) + "</th><td>" + P.potions + " / " + P.potMax + "</td></tr>" +
      (run ? "<tr><th>" + L(["Gold", "Gold"]) + "</th><td>" + U.fmt(P.gold) + "</td></tr>" + (P.glut ? "<tr><th>" + L(["Schmiedeglut", "Forge embers"]) + "</th><td>" + P.glut + "</td></tr>" : "") + (P.keys ? "<tr><th>" + L(["Schlüssel", "Keys"]) + "</th><td>" + P.keys + "</td></tr>" : "") : "") + "</table>";
    h += "<h4>" + L(["Werte", "Stats"]) + '</h4><ul class="ag-liste ag-werte">' + ["brut", "takt", "ueber"].map(k => { const S0 = Z.STATS[k], n = st[k] || 0, cnt = ["a1", "a2", "s1", "s2"].filter(s => P.slots[s] && Z.itemStat(P.slots[s]) === k).length;
      return '<li style="--c:' + S0.col + '"><b style="color:' + S0.col + '">' + esc(L(S0.n)) + " " + n + "</b> " + (n ? pc(0.12 * n) : "±0") + L([" Schaden", " damage"]) + (k === "ueber" ? L([", mehr Leben", ", more health"]) : "") + ' <small class="hinweis">' + cnt + L([" getragen", " carried"]) + "</small></li>"; }).join("") + "</ul>";
    const song = run && run.lgSong;
    h += "<h4>" + L(["Segen", "Blessings"]) + " " + P.bless.length + "/3</h4>" + (P.bless.length ? '<ul class="ag-liste ag-segen">' + P.bless.filter(b => Z.BLESS[b]).map(b => { const B0 = Z.BLESS[b]; return '<li class="k-' + B0.k + '"><b>' + (b === song ? "♪ " : "") + esc(L(B0.n)) + '</b> <small class="hinweis">' + esc(L(Z.BLESS_KIND[B0.k])) + (b === song ? L([" · Barradins Lied", " · Barradin's song"]) : "") + "</small><br>" + esc(L(B0.d)) + "</li>"; }).join("") + "</ul>" : '<p class="hinweis">' + L(["Noch kein Segen.", "No blessing yet."]) + "</p>");
    if (run && run.pacts && run.pacts.length && Z.PACTS) h += "<h4>" + L(["Pakte", "Pacts"]) + " <small class=\"hinweis\">" + L(["Splitter ×", "shards ×"]) + nf(1 + 0.3 * run.pacts.length, 1) + '</small></h4><ul class="ag-liste ag-pakte">' + run.pacts.filter(k => Z.PACTS[k]).map(k => "<li><b>" + esc(L(Z.PACTS[k].n)) + "</b>: " + esc(L(Z.PACTS[k].d)) + "</li>").join("") + "</ul>";
    if (P.curse > 0) h += '<p class="ag-fluch">☠ <b>' + L(["Fluch", "Curse"]) + "</b>: " + L(["noch ", ""]) + P.curse + L([" Kills ohne Treffer – jeder Treffer ist bis dahin tödlich.", " kills without a hit left – until then any hit is fatal."]) + "</p>";
    const syn = (Z.SYNERGIES || []).filter(x => Z.synActive && Z.synActive(x.id));
    if (syn.length) h += "<h4>" + L(["Paarungen", "Pairings"]) + '</h4><ul class="ag-liste">' + syn.map(x => "<li><b>" + esc(L(x.n)) + "</b>: " + esc(L(x.d)) + "</li>").join("") + "</ul>";
    return h;
  }
  /* Reiter oben in Pausenmenü und Ausrüstung */
  function pauseTabs(i) {
    const k = gearKeyHTML(false);
    return '<div class="reiter p-reiter"><button data-act="pTab" data-arg="0" class="' + (i === 0 ? "an" : "") + '">' + esc(t("pause")) + '</button><button data-act="pTab" data-arg="1" class="' + (i === 1 ? "an" : "") + '">' + L(["Ausrüstung", "Gear"]) + (k && i === 0 ? ' <span class="rt">' + k + "</span>" : "") + "</button></div>";
  }
  const ortHTML = () => { const run = Z.run; return esc(areaTitle()) + (run ? " · " + fmtTime(run.time) + (run.skulls ? " · " + "☠".repeat(run.skulls) : "") + (run.gnade ? " · ✚ " + L(["Barmherzigkeit", "Mercy"]) : "") : ""); };
  /* Vollansicht „Ausrüstung“ */
  ui.gear = () => {
    const P = Z.player; if (!P || !Z.level) return;
    if (ui.modalOpen && !modal.querySelector(".pausenmenue, .ausruestung")) return;
    const html = '<h2 class="p-kopf">' + L(["Ausrüstung", "Gear"]) + '<span class="p-ort">' + ortHTML() + "</span></h2>" + pauseTabs(1) +
      '<div class="ag-haende">' + gearCardFull("a1") + gearCardFull("a2") + "</div>" +
      '<div class="ag-unten"><div class="ag-spalte ag-faeh"><h3>' + L(["Fähigkeiten", "Skills"]) + "</h3>" + gearCardFull("s1") + gearCardFull("s2") + "</div>" +
      '<div class="ag-spalte"><h3>' + L(["Runen", "Runes"]) + '</h3><button type="button" class="ag-karte ag-block" data-act="agKarte">' + runenBlock() + "</button></div>" +
      '<div class="ag-spalte"><h3>Ezekiel</h3><button type="button" class="ag-karte ag-block" data-act="agKarte">' + selbstBlock() + "</button></div></div>" +
      '<p class="hinweis ag-fuss">' + (touchy() ? "" : L(["Unterwegs: ", "On the move: "]) + gearKeyHTML(true) + L([" zeigt die Karten über der Schnellleiste – das Spiel läuft weiter.", " shows the cards above the quick bar – the game keeps running."])) + "</p>" +
      '<div class="knoepfe"><button data-act="close">' + esc(t("resume")) + "</button></div>";
    openModal(html, { cls: "breit ausruestung" });
    /* lange Karten: oben anfangen (der Fokus auf Hand 1 soll nicht nach unten scrollen) */
    setTimeout(() => { const b = modal.querySelector(".mbox"); if (b && modal.querySelector(".ausruestung")) b.scrollTop = 0; }, 45);
  };
  actions.pTab = i => { if (+i === 1) ui.gear(); else { const was = ui.modalOpen; if (was) { ui.onClose = null; modal.hidden = true; ui.modalOpen = false; } ui.pause(); } };
  actions.agKarte = () => {};
  /* Ausrüstungs-Taste im Pausenmenü/in der Ausrüstung: Reiter wechseln */
  function gearTabToggle() {
    if (modal.querySelector(".ausruestung")) { actions.pTab(0); return true; }
    if (modal.querySelector(".pausenmenue")) { actions.pTab(1); return true; }
    return false;
  }
  /* kurze Übersicht im Pausenmenü (statt Werte-/Segen-Chips): ein Knopf öffnet die Ausrüstung */
  function pauseGearTeaser() {
    const P = Z.player; if (!P) return "";
    const name = s => { const it = P.slots[s]; if (!it) return ""; const d = Z.itemDef(it); return d ? '<span class="pt-h">' + gearKbd(s) + ' <b style="color:' + (it.cursed ? "#c040ff" : Z.RARITY[it.rar].col) + '">' + esc(Z.itemTitle ? Z.itemTitle(it) : L(d.n)) + "</b></span>" : ""; };
    const st = P.stats || { brut: 0, takt: 0, ueber: 0 }, ra = Z.runeActive ? Z.runeActive() : { keys: [] };
    const sum = ["brut", "takt", "ueber"].map(k => '<span style="color:' + Z.STATS[k].col + '">' + esc(L(Z.STATS[k].n)) + " " + st[k] + "</span>").join(" · ") +
      " · " + L(["Segen ", "Blessings "]) + P.bless.length + "/3" + (ra.keys.length ? " · " + L(["Runen ", "Runes "]) + ra.keys.length : "") + (P.curse > 0 ? ' · <span class="gefahr">☠ ' + P.curse + "</span>" : "");
    return "<h3>" + L(["Ausrüstung", "Gear"]) + '</h3><button class="p-ausr" data-act="pTab" data-arg="1"><span class="pt-reihe">' + ["a1", "a2", "s1", "s2"].map(name).join("") + '</span><small class="pt-sum">' + sum + '</small><small class="pt-mehr">' + L(["Alle Werte ansehen", "View all stats"]) + " ›</small></button>";
  }
  /* ---------- Schnellansicht über der Schnellleiste ---------- */
  const ausEl = document.createElement("div"); ausEl.id = "ausr"; ausEl.hidden = true; document.body.appendChild(ausEl);
  let ausSig = "", hoverSlot = null, mapHold = -1, mapAsGear = false;
  ["a1", "a2", "s1", "s2"].forEach(s => {
    const el = slotEls[s].el;
    el.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") hoverSlot = s; });
    el.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && hoverSlot === s) hoverSlot = null; });
    el.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") { hoverSlot = s; try { el.setPointerCapture(e.pointerId); } catch (_) {} } });
    const off = e => { if (e.pointerType !== "mouse" && hoverSlot === s) hoverSlot = null; };
    el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("lostpointercapture", off);
  });
  ui.gearQuickOpen = () => !ausEl.hidden;
  function gearQuickTick() {
    const P = Z.player;
    const held = !!(inp.held.gear || mapAsGear), want = P && Z.level && !ui.modalOpen && title.hidden && (held || hoverSlot);
    if (!want) { if (!ausEl.hidden) { ausEl.hidden = true; ausSig = ""; } return; }
    const mode = held ? "alle" : hoverSlot;
    const slots = mode === "alle" ? ["a1", "a2", "s1", "s2"] : [mode];
    let sig = mode + "|" + Z.settings.lang + "|" + inp.device + "|" + (ui.touchOn ? 1 : 0) + "|" + inp.label("gear") + "|" + P.stats.brut + P.stats.takt + P.stats.ueber + "|" + P.bless.join(",") + "|" + (P.runeBelt || []).join(",") + "|" + (P.st && P.st.dance > 0 ? 1 : 0);
    for (const s of slots) { const it = P.slots[s]; sig += "|" + (it ? it.uid + ":" + (it.plus || 0) + ":" + (it.runes || []).join(",") + ":" + (s[0] === "s" ? Math.ceil(P.cd[s] || 0) : "") : "-"); }
    if (sig !== ausSig) {
      ausSig = sig;
      const fuss = touchy() ? "" : mode === "alle" ? '<div class="as-fuss">' + L(["Alle Werte: ", "All stats: "]) + ui.key("pause") + " " + esc(t("pause")) + " → " + L(["Ausrüstung", "Gear"]) + "</div>" : '<div class="as-fuss">' + gearKeyHTML(true) + ": " + L(["alle Plätze", "all slots"]) + "</div>";
      ausEl.className = mode === "alle" ? "alle" : "eine";
      ausEl.innerHTML = '<div class="as-reihe">' + slots.map(gearCardQuick).join("") + "</div>" + fuss;
    }
    if (ausEl.hidden) ausEl.hidden = false;
    if (mode !== "alle") {
      /* über dem Platz, im Bild gehalten (das Element steht unter zoom --hud) */
      const r = slotEls[mode].el.getBoundingClientRect(), hz = hudZoom(), w = ausEl.offsetWidth, vw = innerWidth / hz;
      sty(ausEl, "left", Math.round(U.clamp((r.left + r.width / 2) / hz - w / 2, 6, vw - w - 6)) + "px");
      sty(ausEl, "bottom", Math.round((innerHeight - r.top) / hz + 10) + "px");
    } else { sty(ausEl, "left", ""); sty(ausEl, "bottom", ""); }
  }

  /* ---------- Pause ---------- */
  ui.pause = () => {
    if (ui.modalOpen || !Z.level) return;
    const inRun = !!Z.run, P = Z.player, run = Z.run;
    const tip = L(Z.R.pick(TX.tips));
    /* rechts: Lage – Herausforderungen (bilanz.js setzt sie hinter den Tipp) und eine kurze Ausrüstungs-Übersicht;
       Werte, Segen, Runen und Fluch stehen vollständig im Reiter „Ausrüstung“ */
    const ort = esc(areaTitle()) + (run ? " · " + fmtTime(run.time) + (run.skulls ? " · " + "☠".repeat(run.skulls) : "") + (run.gnade ? " · ✚ " + L(["Barmherzigkeit", "Mercy"]) : "") : "");
    const hin = { alle: L(["alle", "all"]), wenige: L(["wenige", "few"]), keine: L(["keine", "none"]) }[Z.settings.hinweise || "alle"];
    openModal('<h2 class="p-kopf">' + esc(t("pause")) + '<span class="p-ort">' + ort + '</span></h2>' + pauseTabs(0) + '<div class="p-spalten"><div class="knoepfe senk"><button data-act="close" autofocus>' + esc(t("resume")) + '</button><button data-act="ctrl">' + esc(t("tut")) + '</button><button data-act="settings">' + esc(t("settings")) + "</button>" + (Z.koopPauseHTML ? Z.koopPauseHTML() : "") /* W27 Koop */ + '<button data-act="hinweise">' + L(["Hinweise: ", "Hints: "]) + hin + "</button>" + (fs.ok ? '<button data-act="fullscreen">' + esc(fs.label()) + "</button>" : "") + /* W18 PC */ pcKnoepfe() +
      (inRun ? '<button data-act="abort" class="gefahr">' + esc(t("abort")) + "</button>" : "") + /* W19 Slots */ '<button data-act="toTitle">' + esc(L(["Zum Titelbildschirm", "To the title screen"])) + "</button>" + '<a class="btn" href="./#taverne">' + esc(t("tavern")) + '</a></div><div class="p-info"><p class="tipp">' + esc(tip) + "</p>" +
      pauseGearTeaser() + "</div></div>", { cls: "schmal pausenmenue" });
  };
  /* Hinweise schnell umschalten: alle → wenige → keine */
  actions.hinweise = (_, b) => {
    const o = ["alle", "wenige", "keine"], i = (o.indexOf(Z.settings.hinweise || "alle") + 1) % 3; Z.settings.hinweise = o[i]; Z.saveSettings();
    if (b) b.textContent = L(["Hinweise: ", "Hints: "]) + [L(["alle", "all"]), L(["wenige", "few"]), L(["keine", "none"])][i];
  };
  actions.ctrl = () => { closeModal(); ui.controlsHelp(); };
  actions.settings = () => { closeModal(); ui.settings(); };
  actions.abort = () => { closeModal(); ui.confirm(t("abort"), L(["Nicht abgelieferte Seelensplitter gehen verloren.", "Undelivered soul shards will be lost."]), t("abort"), () => { Z.run.time = Z.run.time || 0; ui.deathScreen({ abort: true }); }); };

  /* ---------- Bestätigung ---------- */
  ui.confirm = (head, txt, okLabel, fn) => {
    ui._confirmFn = fn;
    openModal("<h2>" + esc(head) + "</h2><p>" + esc(txt) + '</p><div class="knoepfe"><button data-act="confirmOk" autofocus>' + esc(okLabel) + '</button><button data-act="close">' + esc(t("cancel")) + "</button></div>", { cls: "schmal" });
  };
  actions.confirmOk = () => { const fn = ui._confirmFn; closeModal(); if (fn) fn(); };
  ui.startRunConfirm = () => {
    ui._confirmFn = () => Z.startRun();
    const sk = Z.meta.skullSel || 0;
    openModal("<h2>" + esc(t("startRun")) + "</h2><p>" + esc(t("startRunTxt")) + "</p>" + (sk ? '<p class="schaedel">' + "☠".repeat(sk) + " " + L(["Schädel aktiv", "skulls active"]) + "</p>" : "") + '<div class="knoepfe"><button data-act="confirmOk" autofocus>' + esc(t("go")) + '</button><button data-act="close">' + esc(t("cancel")) + "</button></div>", { cls: "schmal" });
  };

  /* ---------- Einstellungen ---------- */
  ui.settings = () => {
    const s = Z.settings, v = A.vol;
    const sl = (id, lab, val) => '<label class="regler">' + esc(lab) + '<input type="range" min="0" max="100" value="' + Math.round(val * 100) + '" data-vol="' + id + '"></label>';
    const ck = (id, lab, val) => '<label class="schalter"><input type="checkbox" data-set="' + id + '"' + (val ? " checked" : "") + "> " + esc(lab) + "</label>";
    openModal("<h2>" + esc(t("settings")) + '</h2><div class="einst">' +
      sl("master", L(["Gesamtlautstärke", "Master volume"]), v.master) + sl("music", L(["Musik", "Music"]), v.music) + sl("sfx", L(["Effekte", "Effects"]), v.sfx) + sl("amb", L(["Geräuschkulisse", "Ambience"]), v.amb) +
      '<button class="steuerknopf komfortknopf" data-act="komfort">' + L(["Komfort & Barrierefreiheit", "Comfort & accessibility"]) + " <small>· " + esc(komfortSumme()) + "</small></button>" +
      '<label class="regler">' + L(["Größe der Touch-Knöpfe", "Touch button size"]) + '<input type="range" min="70" max="140" value="' + Math.round(s.touchSize * 100) + '" data-touch="1"></label>' +
      /* W39 Touch: Deckkraft, Linkshänder, Tipp-Vibration */
      '<label class="regler">' + L(["Deckkraft der Touch-Knöpfe", "Touch button opacity"]) + '<input type="range" min="30" max="100" value="' + Math.round((isFinite(+s.touchAlpha) && +s.touchAlpha > 0 ? +s.touchAlpha : 1) * 100) + '" data-touchalpha="1"></label>' +
      '<label class="regler">' + L(["Stick-Totzone (Touch)", "Stick dead zone (touch)"]) + '<input type="range" min="6" max="30" value="' + Math.round(+s.touchDead || 14) + '" data-touchdead="1"></label>' +
      ck("touchMirror", L(["Touch für Linkshänder (Stick rechts, Knöpfe links)", "Left-handed touch (stick right, buttons left)"]), !!s.touchMirror) +
      ck("touchTick", L(["Kurze Vibration beim Tippen (Touch)", "Short vibration on tap (touch)"]), !!s.touchTick) +
      '<label class="schalter">' + L(["Textgröße", "Text size"]) + ' <select data-textsize="1">' + [["klein", L(["klein", "small"])], ["normal", L(["normal", "normal"])], ["gross", L(["groß", "large"])], ["riesig", L(["sehr groß", "very large"])]].map(([v, n]) => '<option value="' + v + '"' + ((s.textSize || "normal") === v ? " selected" : "") + ">" + esc(n) + "</option>").join("") + "</select></label>" +
      '<label class="schalter">' + L(["Hinweise im Spiel", "In-game hints"]) + ' <select data-hint="1">' + [["alle", L(["alle", "all"])], ["wenige", L(["wenige (nur Wichtiges)", "few (important only)"])], ["keine", L(["keine", "none"])]].map(([v, n]) => '<option value="' + v + '"' + ((s.hinweise || "alle") === v ? " selected" : "") + ">" + esc(n) + "</option>").join("") + "</select></label>" +
      ck("cinePan", L(["Kamerafahrt zum Ausgang beim Betreten", "Camera pan to the exit on arrival"]), !!s.cinePan) + ck("presentOff", L(["Fundvorführung aus", "Turn off item showcase"]), !!s.presentOff) +
      ck("showDmg", L(["Schadenszahlen", "Damage numbers"]), s.showDmg) + /* W20 Steuerung */ vibBlock("set") +
      '<label class="regler">' + L(["Stick-Totzone (Controller)", "Stick dead zone (controller)"]) + '<input type="range" min="15" max="60" value="' + Math.round((s.dead || 0.35) * 100) + '" data-dead="1"></label>' +
      '<button class="steuerknopf" data-act="controls">' + L(["Steuerung: Tastatur & Controller belegen", "Controls: remap keyboard & controller"]) + "</button>" +
      (fs.ok ? '<button class="steuerknopf" data-act="fullscreen">' + esc(fs.label()) + " <small>· F · Alt+Enter</small></button>" + ck("autoFs", L(["Am Handy beim Spielstart automatisch Vollbild", "Automatic fullscreen on phones when starting"]), Z.settings.autoFs !== false) : "") +
      '<button class="steuerknopf" data-act="graphics">' + L(["Grafik, Leistung & Fehlerbericht", "Graphics, performance & error report"]) + " <small>· " + esc(Z.gfxName()) + "</small></button>" +
      ck("autoAim", L(["Zielhilfe für Fernkampf", "Ranged aim assist"]), s.autoAim) + ck("fps", L(["Bilder pro Sekunde anzeigen", "Show FPS"]), s.fps) +
      '<label class="schalter">' + L(["Sprache", "Language"]) + ' <select data-lang="1"><option value="de"' + (s.lang === "de" ? " selected" : "") + '>Deutsch</option><option value="en"' + (s.lang === "en" ? " selected" : "") + ">English</option></select></label>" +
      '</div><div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "schmal", onClose: () => { Z.saveSettings(); A.saveVol(); if (!Z.level) ui.showTitle(); } });
    modal.querySelectorAll("[data-vol]").forEach(r => r.oninput = () => { A.vol[r.dataset.vol] = r.value / 100; A.applyVol(); if (r.dataset.vol === "sfx") A.play("hitFlesh", { vol: 0.6, gap: 0.15 }); });
    modal.querySelector("[data-dead]").oninput = e => { Z.settings.dead = e.target.value / 100; };
    wireVib(); /* W20 Steuerung */
    modal.querySelector("[data-touch]").oninput = e => { Z.settings.touchSize = e.target.value / 100; touchSync(); };
    modal.querySelector("[data-touchalpha]").oninput = e => { Z.settings.touchAlpha = e.target.value / 100; touchSync(); }; /* W39 Touch */
    modal.querySelector("[data-touchdead]").oninput = e => { Z.settings.touchDead = +e.target.value; }; /* W39 Touch */
    modal.querySelectorAll("[data-set]").forEach(c => c.onchange = () => { Z.settings[c.dataset.set] = c.checked; if (c.dataset.set === "vib") inp.vib = c.checked; if (c.dataset.set === "touchMirror") touchSync(); });
    modal.querySelector("[data-textsize]").onchange = e => { Z.settings.textSize = e.target.value; Z.saveSettings(); fitText(); const sel = modal.querySelector("[data-textsize]"); if (sel) sel.focus({ preventScroll: true }); };
    modal.querySelector("[data-hint]").onchange = e => { Z.settings.hinweise = e.target.value; Z.saveSettings(); };
    modal.querySelector("[data-lang]").onchange = e => { Z.settings.lang = e.target.value; Z.saveSettings(); closeModal(); for (const k in slotEls) slotEls[k].uid = -9; touchSync() /* W36 Feinschliff: Touch-Beschriftung sofort umstellen */; ui.settings(); };
  };


  /* ---------- Komfort & Barrierefreiheit ----------
     Eigene Unterseite der Einstellungen. Alles liegt in Z.settings und wirkt über die zentralen Faktoren in kern.js
     (Z.shakeK, Z.flashK, Z.slowK, Z.dangerHi, Z.mercy). Bedienung: ↑↓ Zeile, ←→ Wahl/Regler, A/Enter wählt, B/Esc zurück. */
  const KOPT = {
    blitze: { opts: [["voll", ["voll", "full"]], ["sanft", ["gedämpft", "reduced"]], ["aus", ["aus", "off"]]] },
    zeitlupe: { opts: [["voll", ["voll", "full"]], ["sanft", ["sanft", "subtle"]], ["aus", ["aus", "off"]]] },
    kontrast: { bool: true }, schnellstart: { bool: true }, gnade: { bool: true }
  };
  const onOff = [[true, ["an", "on"]], [false, ["aus", "off"]]];
  function komfortSumme() {
    const s = Z.settings, out = [L(["Wackeln ", "Shake "]) + Math.round(Z.shakeK() * 100) + " %"];
    if (s.blitze !== "voll") out.push(L(["Blitze ", "Flashes "]) + L(KOPT.blitze.opts.find(o => o[0] === s.blitze)[1]));
    if (s.zeitlupe !== "voll") out.push(L(["Zeitlupe ", "Slow-mo "]) + L(KOPT.zeitlupe.opts.find(o => o[0] === s.zeitlupe)[1]));
    if (s.kontrast) out.push(L(["Kontrast", "Contrast"]));
    if (s.schnellstart) out.push(L(["Schnellstart", "Quick start"]));
    if (s.gnade) out.push("✚ " + L(["Barmherzigkeit", "Mercy"]));
    return out.join(" · ");
  }
  ui.komfortSumme = komfortSumme;
  /* Tastenzeile oben: zeigt die echten Knöpfe des gerade benutzten Geräts */
  function komfortTasten() {
    const pad = inp.device === "pad", n = k => (pad ? { jump: "A", roll: "B" }[k] || inp.padButtonName(inp.pad[k]) : inp.label(k)); /* W20 Steuerung: Menüknöpfe fest */
    if (ui.touchOn && !pad) return '<p class="k-tasten">' + L(["Antippen zum Wählen · Regler ziehen", "Tap to choose · drag the slider"]) + "</p>";
    return '<p class="k-tasten">' + (pad ? ui.kbd(L(["Stick", "Stick"])) + ui.kbd("✚") : ui.kbd("↑") + ui.kbd("↓")) + L([" Zeile", " row"]) + " · " + (pad ? ui.kbd("◀") + ui.kbd("▶") : ui.kbd("←") + ui.kbd("→")) + L([" Wahl / Regler", " choice / slider"]) +
      " · " + ui.kbd(pad ? n("jump") : "Enter") + L([" übernehmen", " apply"]) + " · " + ui.kbd(pad ? n("roll") : "Esc") + L([" zurück", " back"]) + "</p>";
  }
  ui.komfort = focusKey => {
    const s = Z.settings;
    const seg = (key, opts, cur) => '<div class="k-wahl" role="radiogroup">' + opts.map(([v, n]) => '<button class="k-seg' + (v === cur ? " an" : "") + '" role="radio" aria-checked="' + (v === cur) + '" data-act="kset" data-arg="' + key + "|" + v + '">' + esc(L(n)) + "</button>").join("") + "</div>";
    const row = (key, lab, hint, ctl, cls) => '<div class="k-zeile' + (cls ? " " + cls : "") + '" data-k="' + key + '"><div class="k-text"><b>' + lab + "</b>" + (hint ? "<small>" + hint + "</small>" : "") + "</div>" + ctl + "</div>";
    const b = key => seg(key, onOff.map(([v, n]) => [String(v), n]), String(!!s[key]));
    const sh = Math.round(Z.shakeK() * 100);
    openModal("<h2>" + L(["Komfort & Barrierefreiheit", "Comfort & accessibility"]) + " <small>" + L(["wird sofort gespeichert", "saved instantly"]) + "</small></h2>" + komfortTasten() + '<div class="einst komfort">' +
      "<h3>" + L(["Bewegung & Licht", "Motion & light"]) + "</h3>" +
      row("shake", L(["Bildschirmwackeln", "Screen shake"]) + ' <em data-out="shake">' + sh + " %</em>", L(["Alle Erschütterungen von Treffern, Bossen, Beben und Fallen.", "Every shake from hits, bosses, quakes and traps."]),
        '<div class="k-regler"><input type="range" min="0" max="100" step="5" value="' + sh + '" data-kshake="1" autofocus aria-label="' + esc(L(["Bildschirmwackeln", "Screen shake"])) + '"></div>') +
      row("blitze", L(["Blitze & Aufleuchten", "Flashes & glare"]), L(["Vollbild-Blitze, Treffer-Aufleuchten, Gewitter- und Explosionslicht. „aus“ ist epilepsiefreundlich.", "Full-screen flashes, hit glare, lightning and explosion light. 'off' is epilepsy-friendly."]), seg("blitze", KOPT.blitze.opts, s.blitze)) +
      row("zeitlupe", L(["Zeitlupe & Trefferstopp", "Slow-motion & hit-stop"]), L(["Kurzes Einfrieren bei Treffern, Zeitlupe bei Paraden, Ausweichen und Siegen.", "Brief freezes on hits, slow-motion on parries, dodges and victories."]), seg("zeitlupe", KOPT.zeitlupe.opts, s.zeitlupe)) +
      "<h3>" + L(["Lesbarkeit", "Readability"]) + "</h3>" +
      row("kontrast", L(["Gefahren-Kontrast", "Hazard contrast"]), L(["Ausholende Gegner, Fallen-Vorwarnungen, Bodenwarnungen und feindliche Geschosse bekommen kräftige Umrisse und Warnschraffur – erkennbar auch ohne Farbe.", "Winding-up enemies, trap warnings, floor warnings and enemy projectiles get bold outlines and warning stripes – readable without colour."]), b("kontrast")) +
      "<h3>" + L(["Ablauf", "Flow"]) + "</h3>" +
      row("schnellstart", L(["Schnellstart", "Quick start"]), L(["Kapitelseiten beim Betreten und bei der Lagerrückkehr sowie die Kamerafahrt zum Ausgang immer überspringen.", "Always skip chapter pages on arrival and on returning to camp, and the camera pan to the exit."]), b("schnellstart")) +
      "<h3>" + L(["Hilfsmodus", "Assist mode"]) + "</h3>" +
      row("gnade", "✚ " + L(["Barmherzigkeit", "Mercy"]) + ' <span class="k-marke">' + L(["Hilfsmodus", "Assist"]) + "</span>", L(["−25 % erlittener Schaden, längere Unverwundbarkeit nach Treffern. Läufe damit werden mit ✚ gekennzeichnet; Bestzeit und neuer Schädel-Grad zählen dann nicht.", "−25% damage taken, longer invulnerability after hits. Runs with it are marked ✚; best time and new skull tiers don't count."]), b("gnade"), "gnade") +
      '<div class="k-schnell"><button class="steuerknopf" data-act="kpreset" data-arg="ruhig">' + L(["Alles schonend: kein Wackeln, keine Blitze, keine Zeitlupe", "Gentle preset: no shake, no flashes, no slow-motion"]) + '</button><button class="steuerknopf" data-act="kpreset" data-arg="std">' + L(["Standard wiederherstellen", "Restore defaults"]) + "</button></div>" +
      '</div><div class="knoepfe"><button data-act="komfortBack">' + esc(t("back")) + "</button></div>", { cls: "komfortfenster", onClose: () => { Z.saveSettings(); setTimeout(() => { if (!ui.modalOpen) actions.komfortBack(); }, 0); } }); /* Esc/B: zurück zu den Einstellungen */
    const r = modal.querySelector("[data-kshake]");
    r.oninput = () => { Z.settings.shake = r.value / 100; modal.querySelector('[data-out="shake"]').textContent = r.value + " %"; if (Z.level && +r.value > 0) Z.fx.shake = Math.max(Z.fx.shake, 6); };
    r.onchange = () => { Z.saveSettings(); };
    if (focusKey) setTimeout(() => { const el = modal.querySelector('[data-k="' + focusKey + '"] .an, [data-k="' + focusKey + '"] input, [data-act="kpreset"][data-arg="' + focusKey + '"]'); if (el) el.focus({ preventScroll: true }); }, 45);
  };
  actions.komfort = () => { Z.saveSettings(); A.saveVol(); ui.onClose = null; closeModal(); ui.komfort(); };
  actions.komfortBack = () => { Z.saveSettings(); ui.onClose = null; if (ui.modalOpen) closeModal(); ui.settings(); setTimeout(() => { const b = modal.querySelector('[data-act="komfort"]'); if (b) b.focus({ preventScroll: true }); }, 45); };
  actions.kset = (arg, btn) => {
    const [key, v] = String(arg).split("|"), o = KOPT[key]; if (!o) return;
    Z.settings[key] = o.bool ? v === "true" : v; Z.saveSettings();
    const wrap = btn && btn.closest(".k-wahl");
    if (wrap) wrap.querySelectorAll(".k-seg").forEach(x => { const on = x === btn; x.classList.toggle("an", on); x.setAttribute("aria-checked", on); });
    if (key === "gnade" && Z.settings.gnade && Z.run) { Z.run.gnade = true; ui.toast("✚ " + L(["Barmherzigkeit aktiv – dieser Lauf wird gekennzeichnet.", "Mercy active – this run will be marked."]), 2600); }
    if (key === "blitze" && v !== "aus" && Z.level) Z.fx.flashScreen("#fff3c0", 0.3); /* Vorschau in der gewählten Stärke */
  };
  actions.kpreset = arg => {
    const S = Z.settings;
    if (arg === "ruhig") Object.assign(S, { shake: 0, blitze: "aus", zeitlupe: "aus" });
    else Object.assign(S, { shake: 1, blitze: "voll", zeitlupe: "voll", kontrast: false, schnellstart: false, gnade: false });
    Z.saveSettings(); ui.onClose = null; closeModal(); ui.komfort(arg);
    ui.toast(arg === "ruhig" ? L(["Schonende Einstellungen übernommen.", "Gentle settings applied."]) : L(["Standard wiederhergestellt.", "Defaults restored."]), 2000);
  };
  /* Barmherzigkeit: −25 % erlittener Schaden, 40 % längere Unverwundbarkeit; der Lauf wird gekennzeichnet */
  {
    const hurt0 = Z.hurtPlayer;
    Z.hurtPlayer = function (dmg, o, ...rest) {
      if (!Z.mercy()) return hurt0.call(this, dmg, o, ...rest);
      const P = Z.player, hp0 = P ? P.hp : 0;
      if (Z.run) Z.run.gnade = true;
      if (typeof dmg === "number" && isFinite(dmg)) dmg *= 0.75;
      const r = hurt0.call(this, dmg, o, ...rest);
      if (P && P.hp < hp0 && P.iframe > 0) P.iframe *= 1.4;
      return r;
    };
  }
  const gnadeNote = () => (Z.run && Z.run.gnade ? '<p class="gnade-note">✚ ' + L(["Barmherzigkeit war in diesem Lauf aktiv – Bestzeit und neuer Schädel-Grad werden nicht gewertet.", "Mercy was active in this run – best time and new skull tiers are not counted."]) + "</p>" : "");

  /* Gefahren-Kontrast: kräftige Umrisse (schwarz + hell) und Warnschraffur über allem, was gleich wehtut.
     Liegt über dem Licht (auch in dunklen Gebieten lesbar), zeichnet nichts, wenn die Option aus ist. Kein Blau. */
  const DK = { ink: "#120a06", warn: "#ffd84a", hell: "#fff6e0", safe: "#8fe07a" };
  let hatchPat = null, hatchCtx = null;
  function hatch(c) {
    if (hatchPat && hatchCtx === c) return hatchPat;
    const cv = document.createElement("canvas"); cv.width = cv.height = 8; const g = cv.getContext("2d");
    g.fillStyle = DK.ink; g.fillRect(0, 0, 8, 8); g.strokeStyle = DK.warn; g.lineWidth = 2.6;
    for (const o of [-8, 0, 8]) { g.beginPath(); g.moveTo(o, 8); g.lineTo(o + 8, 0); g.stroke(); }
    hatchPat = c.createPattern(cv, "repeat"); hatchCtx = c; return hatchPat;
  }
  function outlineRect(c, x, y, w, h, lw, dash) {
    c.setLineDash([]); c.strokeStyle = DK.ink; c.lineWidth = lw * 2; c.strokeRect(x, y, w, h);
    c.strokeStyle = DK.warn; c.lineWidth = lw; if (dash) { c.setLineDash(dash); c.lineDashOffset = -dash.t || 0; } c.strokeRect(x, y, w, h); c.setLineDash([]);
  }
  function warnSign(c, x, y, s, a) {
    c.globalAlpha = a; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.95, y + s * 0.65); c.lineTo(x - s * 0.95, y + s * 0.65); c.closePath();
    c.lineJoin = "round"; c.strokeStyle = DK.ink; c.lineWidth = s * 0.45; c.stroke(); c.fillStyle = DK.warn; c.fill();
    c.fillStyle = DK.ink; c.fillRect(x - s * 0.11, y - s * 0.5, s * 0.22, s * 0.68); c.fillRect(x - s * 0.11, y + s * 0.3, s * 0.22, s * 0.2);
  }
  function hatchArea(c, x, y, w, h, a, lw) {
    if (!(w > 0 && h > 0)) return;
    c.globalAlpha = a * 0.42; c.fillStyle = hatch(c); c.fillRect(x, y, w, h);
    c.globalAlpha = 1; outlineRect(c, x, y, w, h, lw);
  }
  const TRAP_WARN = new Set(["warn", "zittert", "knarr", "pocht", "zeichen", "reisst"]);
  ui.dangerOverlay = function (c, cam, t) {
    if (!Z.dangerHi() || !Z.level || !cam) return 0;
    const FX = Z.fx, S = Z.gfx.scale || 1, ox = Math.round((-cam.x + FX.shakeX) * S) / S, oy = Math.round((-cam.y + FX.shakeY) * S) / S;
    const lw = Math.max(0.9, 2.6 / S), pulse = 0.75 + 0.25 * Math.sin(t * 14), x0 = cam.x - 40, x1 = cam.x + cam.w + 40, y0 = cam.y - 60, y1 = cam.y + cam.h + 60;
    const inView = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
    let n = 0;
    c.save(); c.setTransform(S, 0, 0, S, ox * S, oy * S); c.globalCompositeOperation = "source-over"; c.lineCap = "butt";
    /* 1) Bodenwarnungen (Vorwarnphase von Gefahrenzonen, Säulen, Einschlägen) */
    for (const h of Z.hazards || []) {
      if (!h.warn || h.t >= h.warn || h.owner === "p" || !inView(h.x, h.y)) continue;
      const tall = h.kind === "strike" || h.kind === "column", hh = tall ? Math.min(h.hgt || 400, 400) : Math.max(8, h.hgt || 24);
      hatchArea(c, h.x - h.w / 2, h.y - hh, h.w, hh, pulse, lw); warnSign(c, h.x, h.y - hh - 9, 5, 1); c.globalAlpha = 1; n++;
    }
    /* 2) Boss-Telegraphen (bossphasen.js) */
    for (const tl of Z.bossTeleList || []) {
      const k = Math.min(1, tl.t / (tl.dur || 1));
      if (tl.k === "floor") { if (!inView(tl.x, tl.y)) continue; hatchArea(c, tl.x - tl.w / 2, tl.y - 16, tl.w, 16, pulse, lw); warnSign(c, tl.x, tl.y - 27, 5, 1); }
      else if (tl.k === "band") { hatchArea(c, tl.x0, tl.y - tl.h, tl.x1 - tl.x0, tl.h, pulse * (0.6 + 0.4 * k), lw); }
      else if (tl.k === "ring") { c.globalAlpha = 1; c.setLineDash([]); c.strokeStyle = DK.ink; c.lineWidth = lw * 2; c.beginPath(); c.arc(tl.x, tl.y, tl.r, 0, 6.283); c.stroke(); c.strokeStyle = DK.warn; c.lineWidth = lw; c.setLineDash([lw * 3, lw * 2]); c.lineDashOffset = -t * 20; c.stroke(); c.setLineDash([]); warnSign(c, tl.x, tl.y - tl.r - 8, 5, 1); }
      else if (tl.k === "safe") { c.globalAlpha = 1; c.setLineDash([lw * 1.5, lw * 1.5]); c.strokeStyle = DK.ink; c.lineWidth = lw * 2; c.strokeRect(tl.x - tl.w / 2, tl.y - 30, tl.w, 30); c.strokeStyle = DK.safe; c.lineWidth = lw; c.strokeRect(tl.x - tl.w / 2, tl.y - 30, tl.w, 30); c.setLineDash([]); }
      c.globalAlpha = 1; n++;
    }
    /* 3) Gegner, die gerade ausholen: Eckwinkel um den Körper + Warnzeichen über dem Kopf */
    for (const e of Z.enemies || []) {
      if (e.dead || e.hidden) continue;
      const pre = (e.act && e.act.phase === "pre") || e.tele > 0 || (e.mv && e.mv.stage === "pre");
      if (!pre || !inView(e.x + e.w / 2, e.y)) continue;
      const pad = 2, x = e.x - pad, y = e.y - pad, w = e.w + pad * 2, h = e.h + pad * 2, q = Math.min(7, w * 0.35, h * 0.35);
      c.globalAlpha = 1; c.lineJoin = "miter";
      for (const [col, wd] of [[DK.ink, lw * 2.2], [DK.warn, lw]]) {
        c.strokeStyle = col; c.lineWidth = wd; c.beginPath();
        c.moveTo(x, y + q); c.lineTo(x, y); c.lineTo(x + q, y); c.moveTo(x + w - q, y); c.lineTo(x + w, y); c.lineTo(x + w, y + q);
        c.moveTo(x + w, y + h - q); c.lineTo(x + w, y + h); c.lineTo(x + w - q, y + h); c.moveTo(x + q, y + h); c.lineTo(x, y + h); c.lineTo(x, y + h - q); c.stroke();
      }
      warnSign(c, e.x + e.w / 2, e.y - 10 - 2 * pulse, 5.5, 1); n++;
    }
    /* 4) feindliche Geschosse: schwarzer Ring mit hellem, laufendem Strichmuster */
    for (const p of Z.projs || []) {
      if (p.owner !== "e" || p.dead || !inView(p.x, p.y)) continue;
      const r = ((p.k && p.k.r) || 3) + 3.5;
      c.globalAlpha = 1; c.setLineDash([]); c.strokeStyle = DK.ink; c.lineWidth = lw * 2.2; c.beginPath(); c.arc(p.x, p.y, r, 0, 6.283); c.stroke();
      c.strokeStyle = DK.hell; c.lineWidth = lw; c.setLineDash([lw * 2.2, lw * 1.6]); c.lineDashOffset = -t * 30; c.stroke(); c.setLineDash([]); n++;
    }
    /* 5) Fallen in der Vorwarnung (fallen.js): Warnzeichen über der Falle */
    for (const tr of Z.fallen || []) {
      const x = tr.wx != null ? tr.wx : tr.x != null ? tr.x : tr.tx, y = tr.y != null ? tr.y : tr.fy;
      if (x == null || y == null || !(tr.w === true || TRAP_WARN.has(tr.st)) || !inView(x, y)) continue;
      warnSign(c, x, y - 16 - 2 * pulse, 6, 1); n++;
    }
    c.restore();
    return n;
  };
  {
    const al0 = Z.drawAfterLight;
    Z.drawAfterLight = function (c, cam, W, H, t) { if (al0) al0.apply(this, arguments); try { ui.dangerOverlay(c, cam, t || 0); } catch (e) { console.error(e); } };
  }
  /* Aussehen der Unterseite (Pergament & Schmiedeeisen, kein Blau) */
  {
    const st = document.createElement("style");
    st.textContent = ".mbox.komfortfenster{width:min(860px,calc(96vw / var(--ui,1)))!important}.komfortfenster h2 small{margin-left:auto}.komfort{gap:6px}" +
      ".k-tasten{margin:0 0 6px;font-size:var(--fs-s);color:var(--mute)}" +
      ".komfort h3{margin:4px 0 0;font-size:var(--fs-m,16px);border-bottom:1px solid rgba(229,180,84,.18);padding-bottom:2px}" +
      ".k-zeile{display:flex;align-items:center;gap:14px;padding:5px 10px;border-radius:6px;background:linear-gradient(90deg,rgba(240,214,160,.07),rgba(240,214,160,.02));border-left:3px solid #6e5530}" +
      ".k-zeile:focus-within{border-left-color:var(--gold);background:linear-gradient(90deg,rgba(240,214,160,.14),rgba(240,214,160,.04))}" +
      ".k-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.k-text b{color:var(--text,#f0e0c0);font-size:var(--fs-m,15px)}.k-text b em{font-style:normal;color:var(--gold);margin-left:6px}.k-text small{color:var(--mute);font-size:var(--fs-xs,12px);line-height:1.3}" +
      ".k-wahl{display:flex;flex:none;border:1px solid #160f0c;border-radius:7px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,230,190,.08)}" +
      ".k-seg{background:linear-gradient(#3a2a24,#241915);color:var(--mute);border:0;border-left:1px solid #160f0c;padding:6px 11px;font-weight:700;font-size:var(--fs-s);cursor:pointer;min-width:3.2em}.k-seg:first-child{border-left:0}" +
      ".k-seg.an{background:linear-gradient(#f6e9c8,#cdb07a);color:#2a1810;text-shadow:none}.k-seg:focus{outline:2px solid var(--gold);outline-offset:-2px}.k-seg.an:focus{outline-color:#8a1f14}" +
      ".k-regler{flex:none;width:min(220px,40%)}.k-regler input{width:100%;accent-color:var(--gold)}" +
      ".k-zeile.gnade{border-left-color:#8a1f14;background:repeating-linear-gradient(135deg,rgba(138,31,20,.14) 0 10px,rgba(138,31,20,.05) 10px 20px)}" +
      ".k-marke{display:inline-block;margin-left:6px;padding:0 6px;border-radius:4px;background:#8a1f14;color:#ffe6c8;font-size:var(--fs-xs,11px);font-weight:800;letter-spacing:.04em;vertical-align:middle}" +
      ".k-schnell{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}.k-schnell .steuerknopf{flex:1;min-width:200px}" +
      ".gnade-hud{color:#ff8a6a;font-weight:800}.gnade-note{margin:8px 0;padding:6px 10px;border-left:3px solid #8a1f14;background:rgba(138,31,20,.16);color:#f0d0b0;font-size:var(--fs-s)}" +
      ".klein .k-zeile,.handheld .k-zeile{flex-wrap:wrap;padding:5px 8px}.klein .k-regler,.handheld .k-regler{width:100%}.klein .k-text small,.handheld .k-text small{display:none}" +
      ".klein .k-zeile:focus-within .k-text small,.handheld .k-zeile:focus-within .k-text small{display:block}";
    document.head.appendChild(st);
  }

  /* ---------- Vollbild ---------- */
  const fs = (Z.fs = {
    el: document.documentElement,
    ok: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    touch: matchMedia("(pointer: coarse)").matches,
    on: () => !!(document.fullscreenElement || document.webkitFullscreenElement),
    label: () => (fs.on() ? L(["Vollbild beenden", "Exit fullscreen"]) : L(["Vollbild", "Fullscreen"])),
    enter() {
      const e = fs.el, req = e.requestFullscreen || e.webkitRequestFullscreen;
      if (!req) return;
      try {
        const p = req.call(e, { navigationUI: "hide" });
        const lock = () => { try { if (fs.touch && screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {}); } catch (_) {} };
        if (p && p.then) p.then(lock).catch(() => ui.toast(L(["Vollbild wurde vom Browser abgelehnt.", "The browser refused fullscreen."]), 2400)); else lock();
      } catch (_) {}
    },
    exit() { const x = document.exitFullscreen || document.webkitExitFullscreen; try { if (x) { const p = x.call(document); if (p && p.catch) p.catch(() => {}); } } catch (_) {} },
    toggle() { fs.on() ? fs.exit() : fs.enter(); }
  });
  /* W18 PC: im PC-Programm (window.__zsPC, desktop-zerstoerer/preload.js) schaltet das Programm das Fenster-Vollbild (wie F11);
     dazu Menüpunkte „Nach Updates suchen“/„Beenden“ und der Hinweis auf geladene Updates. Im Browser ändert sich nichts. */
  const PC = window.__zsPC || null;
  if (PC) {
    let pcVoll = false;
    PC.istVollbild().then(v => { pcVoll = !!v; fsSync(); }).catch(() => {});
    fs.ok = true; fs.on = () => pcVoll;
    fs.enter = () => PC.vollbild(true).then(v => { pcVoll = !!v; fsSync(); });
    fs.exit = () => PC.vollbild(false).then(v => { pcVoll = !!v; fsSync(); });
    PC.bei(n => {
      if (!n) return;
      if (n.art === "vollbild") { pcVoll = !!n.an; fsSync(); return; }
      if (n.art === "inhalt" || n.art === "programm") pcHinweis(n);
    });
  }
  let pcWartet = null;
  function pcHinweis(n) {
    pcWartet = n;
    let el = document.getElementById("pc-update");
    if (!el) {
      el = document.createElement("div"); el.id = "pc-update";
      el.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:80;max-width:340px;padding:10px 12px;background:rgba(20,14,16,.94);border:1px solid #8a6a3a;border-radius:6px;color:#ece4d2;font:14px/1.35 var(--fb,serif);box-shadow:0 4px 18px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center";
      document.body.appendChild(el);
    }
    const prog = n.art === "programm";
    el.innerHTML = "<span>" + (prog ? L(["Programm-Update geladen – wird beim Beenden installiert", "Program update downloaded – installs when you quit"]) : L(["Update geladen – beim nächsten Start aktiv", "Update downloaded – active on next start"])) +
      (Z.run ? "<br><small style='opacity:.7'>" + L(["Spielstand bleibt; der laufende Lauf endet.", "Progress is kept; the current run ends."]) + "</small>" : "") + "</span>" +
      '<button type="button" data-pc="neu" style="white-space:nowrap;background:#3a2a1c;color:#f0d89a;border:1px solid #8a6a3a;border-radius:4px;padding:5px 9px;cursor:pointer">' + (prog ? L(["Jetzt neu starten", "Restart now"]) : L(["Jetzt neu laden", "Reload now"])) + "</button>" +
      '<button type="button" data-pc="zu" aria-label="' + L(["Schließen", "Close"]) + '" style="background:none;border:0;color:#a0968a;cursor:pointer;font-size:16px">×</button>';
    el.querySelector('[data-pc="neu"]').onclick = () => { try { Z.saveMeta && Z.saveMeta(); Z.saveSettings && Z.saveSettings(); } catch (_) {} PC.neuLaden(); };
    el.querySelector('[data-pc="zu"]').onclick = () => el.remove();
    clearTimeout(pcHinweis.t); pcHinweis.t = setTimeout(() => { if (el.isConnected) el.remove(); }, 20000);
  }
  function pcKnoepfe() {
    if (!PC) return "";
    return (pcWartet ? '<button data-act="pcNeu">' + (pcWartet.art === "programm" ? L(["Update: jetzt neu starten", "Update: restart now"]) : L(["Update: jetzt neu laden", "Update: reload now"])) + "</button>" : "") +
      '<button data-act="pcUpdates">' + L(["Nach Updates suchen", "Check for updates"]) + '</button><button data-act="pcQuit">' + L(["Beenden", "Quit"]) + "</button>";
  }
  actions.pcNeu = () => { try { Z.saveMeta && Z.saveMeta(); Z.saveSettings && Z.saveSettings(); } catch (_) {} if (PC) PC.neuLaden(); };
  actions.pcQuit = () => { try { Z.saveMeta && Z.saveMeta(); Z.saveSettings && Z.saveSettings(); } catch (_) {} if (PC) PC.beenden(); };
  actions.pcUpdates = (_, b) => {
    if (!PC) return;
    if (b) { b.disabled = true; b.textContent = L(["Suche …", "Checking …"]); }
    PC.updates().then(r => {
      const i = (r && r.inhalt) || {}, p = (r && r.programm) || {};
      let msg;
      if (p.bereit || (p.ok && p.neu)) msg = L(["Neue Programm-Fassung ", "New program version "]) + (p.version || "") + L([" wird geladen – sie wird beim Beenden installiert.", " is downloading – it installs when you quit."]);
      else if (i.ok && i.neu) msg = L(["Update geladen – beim nächsten Start aktiv.", "Update downloaded – active on next start."]);
      else if (i.ok) msg = L(["Das Spiel ist aktuell", "The game is up to date"]) + " (" + L(["Stand ", "build "]) + (i.stand || "?") + ").";
      else msg = L(["Keine Verbindung – es geht mit dem bisherigen Stand weiter.", "No connection – playing on with the current version."]);
      if (b) { b.disabled = false; b.textContent = L(["Nach Updates suchen", "Check for updates"]); }
      ui.notify(msg, { prio: 3, dauer: 4200 });
    }).catch(() => { if (b) b.disabled = false; });
  };
  { const tp = document.getElementById("tonplatz"); if (tp && window.TonRegler) tp.replaceWith(TonRegler.knoepfe("zerstoerer")); }
  const fsBtn = document.getElementById("fsbtn");
  const fsSync = () => {
    if (fsBtn) { fsBtn.hidden = !fs.ok; fsBtn.textContent = fs.on() ? "🗗" : "⛶"; fsBtn.title = fs.label(); fsBtn.setAttribute("aria-label", fs.label()); }
    const tb = document.getElementById("t-fs"); if (tb) tb.textContent = fs.label();
    modal.querySelectorAll('[data-act="fullscreen"]').forEach(b => { const sm = b.querySelector("small"); b.textContent = fs.label() + " "; if (sm) b.appendChild(sm); });
  };
  if (fsBtn) fsBtn.onclick = e => { e.preventDefault(); fs.toggle(); fsBtn.blur(); };
  document.addEventListener("fullscreenchange", fsSync); document.addEventListener("webkitfullscreenchange", fsSync);
  addEventListener("keydown", e => {
    if (e.code === "Enter" && e.altKey) { e.preventDefault(); e.stopPropagation(); fs.toggle(); return; }
    /* F: Vollbild – solange F nicht selbst belegt ist */
    if (e.code === "KeyF" && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && !inp.capture && !(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) && !Object.values(inp.keys).some(k => k && k.includes("KeyF"))) { e.preventDefault(); e.stopPropagation(); fs.toggle(); }
  }, true);
  actions.fullscreen = () => fs.toggle();
  fsSync();

  /* ---------- Grafik & Diagnose ---------- */
  ui.graphics = () => {
    const q = Z.gq, g = Z.settings.gfx, D = Z.diag;
    const opt = (v, lab, cur) => '<option value="' + v + '"' + (String(cur) === String(v) ? " selected" : "") + ">" + esc(lab) + "</option>";
    const ck = (id, lab, val) => '<label class="schalter"><input type="checkbox" data-gq="' + id + '"' + (val ? " checked" : "") + "> " + esc(lab) + "</label>";
    const rg = (id, lab, val, mn, mx, unit) => '<label class="regler">' + esc(lab) + ' <b data-out="' + id + '">' + val + unit + '</b><input type="range" min="' + mn + '" max="' + mx + '" step="5" value="' + val + '" data-gr="' + id + '"></label>';
    const nErr = (D.old || []).length + D.errors.length;
    openModal("<h2>" + L(["Grafik & Leistung", "Graphics & performance"]) + '</h2><div class="einst">' +
      '<label class="schalter">' + L(["Qualität", "Quality"]) + ' <select data-preset="1" autofocus>' + opt("auto", L(["Automatisch", "Automatic"]) + (g.preset === "auto" ? " (" + L(Z.GFX_PRESETS[q.level].n) + ")" : ""), g.preset) +
        Z.GFX_PRESETS.map((p, i) => opt(i, L(p.n), g.preset)).join("") + (g.preset === "custom" ? opt("custom", L(["Eigene", "Custom"]), g.preset) : "") + "</select></label>" +
      rg("res", L(["Auflösung", "Resolution"]), Math.round(q.res * 100), 40, 100, " %") +
      rg("part", L(["Partikel & Funken", "Particles & sparks"]), Math.round(q.part * 100), 20, 100, " %") +
      '<label class="schalter">' + L(["Licht und Schatten", "Light and shadow"]) + ' <select data-light="1">' + opt(3, L(["Fein", "Fine"]), q.light) + opt(4, L(["Normal", "Normal"]), q.light) + opt(6, L(["Einfach", "Simple"]), q.light) + opt(8, L(["Grob (schnell)", "Coarse (fast)"]), q.light) + "</select></label>" +
      ck("layers", L(["Hintergrund-Ebenen (Parallax)", "Background layers (parallax)"]), q.layers) + ck("critters", L(["Tiere im Hintergrund", "Background critters"]), q.critters) +
      ck("weather", L(["Wetter (Regen, Asche, Funken …)", "Weather (rain, ash, embers…)"]), q.weather) + ck("fog", L(["Nebel", "Fog"]), q.fog) + ck("vignette", L(["Vignette (dunkle Ränder)", "Vignette (dark edges)"]), q.vignette) +
      '<label class="schalter">' + L(["Bildrate begrenzen", "Limit frame rate"]) + ' <select data-cap="1">' + opt(0, L(["Aus", "Off"]), q.fpsCap) + opt(60, "60 fps", q.fpsCap) + opt(30, L(["30 fps (Akku sparen)", "30 fps (save battery)"]), q.fpsCap) + "</select></label>" +
      '<label class="schalter"><input type="checkbox" data-set="fps"' + (Z.settings.fps ? " checked" : "") + "> " + L(["Bilder pro Sekunde anzeigen", "Show FPS"]) + "</label>" +
      "<h3>" + L(["Fehler & Tests", "Errors & tests"]) + '</h3><p class="hinweis">' + L(["Die Berichte enthalten nur Technik (Gerät, Browser, Bildrate, Fehler) – keine persönlichen Daten. Einfach kopieren und Claude schicken.", "Reports only contain technical data (device, browser, frame rate, errors) – nothing personal. Just copy it and send it to Claude."]) +
        " " + (nErr ? "<b>" + nErr + L([" Fehler gesammelt.", " errors collected."]) + "</b>" : L(["Bisher keine Fehler.", "No errors so far."])) + "</p>" +
      '<button class="steuerknopf" data-act="diagRun">' + L(["Diagnose: 10 Sekunden normal spielen, dann Bericht", "Diagnosis: play normally for 10 seconds, then report"]) + "</button>" +
      '<button class="steuerknopf" data-act="benchRun">' + L(["Grafiktest: alle Stufen durchmessen (ca. 20 s)", "Graphics test: measure every level (approx. 20 s)"]) + "</button>" +
      '<button class="steuerknopf" data-act="diagNow">' + L(["Fehlerbericht jetzt anzeigen", "Show error report now"]) + "</button>" +
      (nErr ? '<button class="steuerknopf" data-act="diagClear">' + L(["Fehlerliste leeren", "Clear error list"]) + "</button>" : "") +
      '</div><div class="knoepfe"><button data-act="graphicsBack">' + esc(t("back")) + "</button></div>", { cls: "schmal", onClose: () => { Z.saveSettings(); if (!Z.level) ui.showTitle(); } });
    const re = () => { const f = document.activeElement && document.activeElement.dataset ? Object.entries(document.activeElement.dataset)[0] : null; ui.onClose = null; closeModal(); ui.graphics(); if (f) setTimeout(() => { const el = modal.querySelector("[data-" + f[0] + '="' + f[1] + '"]'); if (el) el.focus(); }, 40); };
    modal.querySelector("[data-preset]").onchange = e => { Z.setGfx("preset", e.target.value === "auto" || e.target.value === "custom" ? e.target.value : +e.target.value); re(); };
    modal.querySelectorAll("[data-gr]").forEach(r => { r.oninput = () => { modal.querySelector('[data-out="' + r.dataset.gr + '"]').textContent = r.value + " %"; }; r.onchange = () => { Z.setGfx(r.dataset.gr, r.value / 100); re(); }; });
    modal.querySelector("[data-light]").onchange = e => { Z.setGfx("light", +e.target.value); re(); };
    modal.querySelector("[data-cap]").onchange = e => { Z.setGfx("fpsCap", +e.target.value); };
    modal.querySelectorAll("[data-gq]").forEach(c => c.onchange = () => { Z.setGfx(c.dataset.gq, c.checked); re(); });
    modal.querySelector("[data-set=fps]").onchange = e => { Z.settings.fps = e.target.checked; Z.saveSettings(); };
  };
  actions.graphics = () => { Z.saveSettings(); A.saveVol(); ui.onClose = null; closeModal(); ui.graphics(); };
  actions.graphicsBack = () => { ui.onClose = null; closeModal(); ui.settings(); };
  actions.diagRun = () => { Z.saveSettings(); const ok = Z.level; if (!ok) { ui.toast(L(["Die Diagnose misst im laufenden Spiel – erst einen Durchgang starten oder ins Lager gehen.", "The diagnosis measures live gameplay – start a run or enter the camp first."]), 3200); return; } ui.onClose = null; Z.diag.startDiag(10000); };
  actions.benchRun = () => { Z.saveSettings(); if (!Z.level) { ui.toast(L(["Der Grafiktest braucht eine Szene – erst einen Durchgang starten oder ins Lager gehen.", "The graphics test needs a scene – start a run or enter the camp first."]), 3200); return; } ui.onClose = null; Z.diag.startBench(); };
  actions.diagNow = () => { ui.onClose = null; ui.showReport(Z.diag.quick(), L(["Fehlerbericht", "Error report"])); };
  actions.diagClear = () => { Z.diag.clearOld(); ui.onClose = null; closeModal(); ui.graphics(); };
  /* Bericht anzeigen: kopieren, teilen, Empfehlung übernehmen */
  let reportText = "", reportRec = null;
  ui.showReport = (text, head, rec) => {
    reportText = text; reportRec = rec;
    openModal("<h2>" + esc(head) + '</h2><p class="hinweis">' + L(["Kopieren und einfach im Chat einfügen.", "Copy it and paste it into the chat."]) + '</p><textarea class="bericht" readonly rows="14">' + esc(text) + "</textarea>" +
      '<div class="knoepfe">' + '<button data-act="repCopy" autofocus>' + L(["Kopieren", "Copy"]) + "</button>" + (navigator.share ? '<button data-act="repShare">' + L(["Teilen …", "Share…"]) + "</button>" : "") +
      (rec != null ? '<button data-act="repApply">' + L(["Empfehlung übernehmen: ", "Apply recommendation: "]) + esc(L(Z.GFX_PRESETS[rec].n)) + "</button>" : "") +
      '<button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
  };
  actions.repCopy = () => {
    const done = () => ui.toast(L(["Bericht kopiert – jetzt im Chat einfügen.", "Report copied – now paste it into the chat."]), 2600);
    const fallback = () => { const ta = modal.querySelector(".bericht"); if (ta) { ta.removeAttribute("readonly"); ta.select(); try { document.execCommand("copy"); done(); } catch (_) { ui.toast(L(["Bitte den Text markieren und kopieren.", "Please select the text and copy it."]), 3000); } ta.setAttribute("readonly", ""); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(reportText).then(done, fallback); else fallback(); } catch (_) { fallback(); }
  };
  actions.repShare = () => { try { navigator.share({ title: "Ezekiel – The Destroyer · Bericht", text: reportText }).catch(() => {}); } catch (_) {} };
  actions.repApply = () => { if (reportRec != null) { Z.setGfx("preset", reportRec); ui.toast(L(["Grafik: ", "Graphics: "]) + "<b>" + esc(Z.gfxName()) + "</b>", 2200); } closeModal(); };
  /* bei einem Fehler einmal pro Sitzung leise Bescheid geben */
  let errHinted = false;
  Z.diag.onError = () => { if (errHinted) return; errHinted = true; setTimeout(() => ui.toast(L(["Es ist ein Fehler aufgetreten. Bericht: Einstellungen → Grafik, Leistung & Fehlerbericht.", "An error occurred. Report: Settings → Graphics, performance & error report."]), 4200), 200); };

  /* ---------- Steuerung belegen ---------- */
  /* W20 Steuerung: freie Belegung – je Aktion zwei Tasten und zwei Controller-Knöpfe, Vorlagen, Konfliktwarnung mit
     Tauschen, Erfassung mit Abbruch (Esc · Menü/Start lange · 10 s nichts), Leeren (Entf · Controller X), Vibration mit
     Stärke und Testknopf. Alles global (eigene Speicherschlüssel bzw. Z.settings), nicht je Spielstand. */
  const ACT_NAMES = { left: ["Links", "Left"], right: ["Rechts", "Right"], up: ["Hoch / Leiter", "Up / ladder"], down: ["Runter / Ducken", "Down / crouch"], jump: ["Springen", "Jump"], roll: ["Rolle", "Roll"],
    a1: ["Waffe 1", "Weapon 1"], a2: ["Waffe 2", "Weapon 2"], s1: ["Fähigkeit 1", "Skill 1"], s2: ["Fähigkeit 2", "Skill 2"], use: ["Benutzen / Aufheben", "Use / pick up"], potion: ["Heiltrank", "Healing potion"], map: ["Karte", "Map"], gear: ["Ausrüstung ansehen (halten)", "View gear (hold)"], pause: ["Pause", "Pause"] };
  ui.ACT_NAMES = ACT_NAMES;
  function bindingSummary() {
    const pad = inp.device === "pad";
    const row = a => ui.kbd(pad ? inp.label(a) : inp.keyName(inp.keys[a][0] || inp.keys[a][1])) + " " + esc(L(ACT_NAMES[a]));
    return (pad ? L(["Linker Stick / Steuerkreuz laufen · ", "Left stick / D-pad move · "]) : ui.kbd(inp.keyName(inp.keys.left[0] || inp.keys.left[1])) + ui.kbd(inp.keyName(inp.keys.right[0] || inp.keys.right[1])) + " " + L(["laufen · ", "move · "])) +
      ["jump", "roll", "a1", "a2", "s1", "s2", "potion", "use", "map", "gear", "pause"].filter(a => !pad || inp.padOf(a) != null).map(row).join(" · ") + (pad && inp.padOf("map") != null ? " · " + ui.kbd(inp.padButtonName(inp.padOf("map"))) + " " + L(["halten: Ausrüstung", "hold: gear"]) : "") + L([" · Oben + Angriff: Aufwärtsangriff (in der Luft: Aufwärts-Schwung)", " · Up + attack: upward attack (in the air: rising swing)"]) + (pad ? "" : L([" · Linksklick/Rechtsklick: Waffe 1/2 · Runter + Sprung: durch Stege fallen · Runter + Angriff in der Luft: Sturzangriff", " · Left/right click: weapon 1/2 · Down + jump: drop through ledges · Down + attack in the air: plunge"]));
  }
  const DIRS = ["left", "right", "up", "down"];
  const slotLab = (kind, v) => (kind === "pad" ? inp.padButtonName(v) : inp.keyName(v));
  let ctrlState = null; /* { conflict: {kind, action, slot, v, other}, msg } */
  function vibBlock(id) {
    const k = Math.round((Z.settings.vibK != null ? Z.settings.vibK : 0.8) * 100);
    return '<div class="st-vib"><label class="regler">' + L(["Vibration (Controller)", "Vibration (controller)"]) + ' <em data-vibout="1">' + (k ? k + " %" : L(["aus", "off"])) + '</em><input type="range" min="0" max="100" step="5" value="' + k + '" data-vibk="' + id + '" aria-label="' + esc(L(["Vibrationsstärke", "Vibration strength"])) + '"></label>' +
      '<button class="steuerknopf st-test" data-act="vibTest">' + L(["Vibration testen", "Test vibration"]) + "</button></div>";
  }
  function wireVib() {
    modal.querySelectorAll("[data-vibk]").forEach(r => {
      r.oninput = () => { Z.setVibK(r.value / 100); const o = modal.querySelector("[data-vibout]"); if (o) o.textContent = +r.value ? r.value + " %" : L(["aus", "off"]); };
      r.onchange = () => { Z.saveSettings(); if (+r.value) Z.vib("hit"); };
    });
  }
  ui.wireVib = wireVib; ui.vibBlock = vibBlock;
  actions.vibTest = () => {
    const ok = Z.vib("test"), b = modal.querySelector('[data-act="vibTest"]');
    if (!b) return;
    b.textContent = !(Z.settings.vibK > 0) ? L(["Vibration ist aus (0 %)", "Vibration is off (0%)"]) : ok ? L(["Brrr … gespürt?", "Brrr… feel it?"]) : !inp.lastPad && inp.device !== "touch" ? L(["Kein Controller verbunden", "No controller connected"]) : L(["Kurz warten …", "Wait a moment…"]);
    clearTimeout(b._t); b._t = setTimeout(() => { if (b.isConnected) b.textContent = L(["Vibration testen", "Test vibration"]); }, 1800);
  };
  ui.controls = focusArg => {
    const padOn = !!inp.lastPad, st = ctrlState || {}, cf = st.conflict;
    const box0 = modal.querySelector(".mbox.steuerung"), scroll = box0 ? box0.scrollTop : 0;
    const cell = (a, kind, slot) => {
      const v = inp.getSlot(kind, a, slot), wait = cf && cf.action === a && cf.kind === kind && cf.slot === slot;
      return '<button class="belegung' + (v == null ? " leer" : "") + (wait ? " wartet" : "") + '" data-act="bind" data-arg="' + a + "|" + kind + "|" + slot + '" aria-label="' + esc(L(ACT_NAMES[a]) + " · " + (kind === "pad" ? "Controller " : L(["Taste ", "Key "])) + (slot + 1)) + '">' + esc(v == null ? "–" : slotLab(kind, v)) + "</button>";
    };
    let rows = "";
    for (const a in ACT_NAMES) {
      const noKey = !inp.keys[a][0] && !inp.keys[a][1], noPad = !DIRS.includes(a) && inp.padOf(a) == null;
      rows += "<tr" + (noKey || noPad ? ' class="ohne"' : "") + "><th>" + esc(L(ACT_NAMES[a])) + (noKey || noPad ? ' <small class="warn">' + (noKey ? L(["ohne Taste", "no key"]) : L(["ohne Knopf", "no button"])) + "</small>" : "") + "</th><td>" + cell(a, "key", 0) + "</td><td>" + cell(a, "key", 1) + "</td><td>" +
        (DIRS.includes(a) ? '<span class="fix">' + L(["Stick + Kreuz", "Stick + D-pad"]) + "</span>" : cell(a, "pad", 0)) + "</td><td>" + cell(a, "pad", 1) + "</td></tr>";
    }
    const pk = inp.presetOf("keys"), pp = inp.presetOf("pad");
    const pre = '<div class="st-vorlagen"><span>' + L(["Vorlage:", "Preset:"]) + "</span>" + Object.keys(inp.PRESETS).map((id, i) => '<button class="k-seg' + (pk === id && pp === id ? " an" : pk === id || pp === id ? " halb" : "") + '" data-act="bindPreset" data-arg="' + id + '"' + (!i && !cf && focusArg == null ? " autofocus" : "") + ">" + esc(L(inp.PRESETS[id].n)) + "</button>").join("") + "</div>";
    const conf = cf ? '<div class="st-konflikt" role="alertdialog"><p>⚠ ' + L(["„", "“"])[0] + "<b>" + esc(slotLab(cf.kind, cf.v)) + "</b>" + L(["“ liegt schon auf ", "” is already used by "]) + "<b>" + esc(L(ACT_NAMES[cf.other.action])) + "</b>.</p>" +
      '<div class="knoepfe"><button data-act="bindSwap" autofocus>' + L(["Tauschen", "Swap"]) + (inp.getSlot(cf.kind, cf.action, cf.slot) != null ? " <small>(" + esc(L(ACT_NAMES[cf.other.action])) + " → " + esc(slotLab(cf.kind, inp.getSlot(cf.kind, cf.action, cf.slot))) + ")</small>" : "") + '</button><button data-act="bindSteal">' + L(["Dort entfernen", "Remove there"]) + '</button><button data-act="bindNo">' + esc(t("cancel")) + "</button></div></div>" : "";
    const pad = inp.device === "pad";
    const hint = st.msg ? '<span class="st-msg">' + st.msg + "</span> " : "";
    openModal("<h2>" + L(["Steuerung", "Controls"]) + " <small>" + L(["wird sofort gespeichert · gilt für alle Spielstände", "saved instantly · applies to all save slots"]) + "</small></h2>" +
      '<p class="hinweis">' + (padOn ? "🎮 " + esc(inp.padName.replace(/\(.*?\)/g, "").trim() || L(["Controller verbunden", "Controller connected"])) : L(["Kein Controller erkannt – einmal einen Knopf drücken, dann erscheint er hier.", "No controller detected – press any button and it will appear here."])) + "</p>" +
      pre + conf +
      '<table class="belegtab"><thead><tr><th></th><th>' + L(["Taste", "Key"]) + "</th><th>" + L(["Zweite Taste", "Second key"]) + "</th><th>Controller</th><th>" + L(["Zweiter Knopf", "Second button"]) + "</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      (Z.koopCtrlHTML ? Z.koopCtrlHTML() : "") + /* W27 Koop: Tasten Spieler 2 */
      vibBlock("ctl") +
      '<p class="hinweis" id="bindhint">' + hint + (pad ? L(["Feld wählen (A), dann den neuen Knopf drücken und loslassen. Menü/Start lange halten bricht ab · X leert das Feld. In Menüs gilt immer A = Auswählen, B = Zurück.", "Pick a field (A), then press and release the new button. Hold Menu/Start to cancel · X clears the field. In menus A = select, B = back always."])
        : L(["Feld wählen, dann die neue Taste oder den Controller-Knopf drücken. Esc bricht ab · Entf leert das Feld. Maus: links Waffe 1, rechts Waffe 2.", "Pick a field, then press the new key or controller button. Esc cancels · Delete clears the field. Mouse: left weapon 1, right weapon 2."])) + "</p>" +
      '<div class="knoepfe"><button data-act="bindReset">' + L(["Standard wiederherstellen", "Restore defaults"]) + '</button><button data-act="controlsBack">' + esc(t("back")) + "</button></div>", { cls: "breit steuerung", onClose: () => { ctrlState = null; Z.saveSettings(); } });
    wireVib();
    const bx = modal.querySelector(".mbox.steuerung"); if (bx) bx.scrollTop = scroll;
    if (focusArg && !cf) setTimeout(() => { const b = modal.querySelector('[data-arg="' + focusArg + '"]'); if (b) { b.focus({ preventScroll: true }); b.scrollIntoView && b.scrollIntoView({ block: "nearest" }); } }, 40);
  };
  const refreshLabels = () => { for (const k in slotEls) slotEls[k].lab = null; padHintKey = ""; };
  const ctrlRedraw = (focusArg, msg) => { ctrlState = msg ? { msg } : null; refreshLabels(); ui.onClose = null; ui.controls(focusArg); };
  actions.controls = () => { Z.saveSettings(); closeModal(); ctrlState = null; ui.controls(); };
  actions.controlsBack = () => { ui.onClose = null; ctrlState = null; closeModal(); ui.settings(); };
  actions.bindReset = () => { inp.reset(); ctrlRedraw(null, L(["Standard wiederhergestellt.", "Defaults restored."])); };
  actions.bindPreset = id => { inp.applyPreset(id); A.play("uiOk", { vol: 0.4 }); ctrlRedraw("", L(["Vorlage „", "Preset “"]) + esc(L(inp.PRESETS[id].n)) + L(["“ übernommen.", "” applied."])); setTimeout(() => { const b = modal.querySelector('[data-act="bindPreset"][data-arg="' + id + '"]'); if (b) b.focus({ preventScroll: true }); }, 45); };
  actions.bindSwap = () => { const c = ctrlState && ctrlState.conflict; if (!c) return; inp.assign(c.kind, c.action, c.slot, c.v, "swap"); A.play("uiOk", { vol: 0.4 }); ctrlRedraw(c.action + "|" + c.kind + "|" + c.slot, L(["Getauscht mit ", "Swapped with "]) + esc(L(ACT_NAMES[c.other.action])) + "."); };
  actions.bindSteal = () => { const c = ctrlState && ctrlState.conflict; if (!c) return; inp.assign(c.kind, c.action, c.slot, c.v, "steal"); A.play("uiOk", { vol: 0.4 }); ctrlRedraw(c.action + "|" + c.kind + "|" + c.slot, esc(L(ACT_NAMES[c.other.action])) + L([" hat diesen Platz jetzt frei.", " no longer uses it."])); };
  actions.bindNo = () => { const c = ctrlState && ctrlState.conflict; ctrlRedraw(c ? c.action + "|" + c.kind + "|" + c.slot : null, L(["Nichts geändert.", "Nothing changed."])); };
  actions.bindClear = arg => {
    const [a, kind, slot] = (arg || "").split("|"); if (!ACT_NAMES[a]) return;
    if (kind === "pad" && +slot === 0 && DIRS.includes(a)) return;
    inp.clearSlot(kind, a, +slot); A.play("ui", { vol: 0.3, rate: 0.8 }); ctrlRedraw(arg, L(["Feld geleert.", "Field cleared."]));
  };
  ui.ctrlCapturing = () => !!(inp.capture && inp.capture.w20);
  actions.bind = (arg, btn) => {
    const [a, kind, slot] = arg.split("|"), sl = +slot;
    btn.textContent = kind === "pad" ? L(["Knopf drücken …", "Press button…"]) : L(["Taste drücken …", "Press key…"]);
    btn.classList.add("wartet");
    const hintEl = modal.querySelector("#bindhint"); if (hintEl) hintEl.innerHTML = kind === "pad" ? L(["Neuen Knopf drücken und loslassen · <b>Menü/Start lange halten</b> = Abbrechen · Taste auf der Tastatur = Abbrechen", "Press and release the new button · <b>hold Menu/Start</b> = cancel · any keyboard key = cancel"]) : L(["Neue Taste drücken · <b>Esc</b> = Abbrechen · <b>Entf</b> = Feld leeren · Controller-Knopf = Abbrechen", "Press the new key · <b>Esc</b> = cancel · <b>Delete</b> = clear field · controller button = cancel"]);
    inp.capture = { kind, action: a, slot: sl, w20: true, onValue: v => {
      if (v === "Delete") return actions.bindClear(arg);
      if (v == null) return ctrlRedraw(arg, L(["Abgebrochen.", "Cancelled."]));
      if (kind === "pad" && sl === 0 && DIRS.includes(a)) return ctrlRedraw(arg);
      if (inp.getSlot(kind, a, sl) === v) return ctrlRedraw(arg, L(["Unverändert.", "Unchanged."]));
      const other = inp.findBinding(kind, v, a, sl);
      /* derselbe Wert im anderen Platz derselben Aktion: einfach verschieben */
      if (other && other.action !== a) { ctrlState = { conflict: { kind, action: a, slot: sl, v, other } }; A.play("ui", { vol: 0.4, rate: 0.7 }); Z.vib && Z.vib("tick"); refreshLabels(); ui.onClose = null; ui.controls(); return; }
      inp.assign(kind, a, sl, v, "steal"); A.play("uiOk", { vol: 0.4 }); ctrlRedraw(arg);
    } };
    /* Halte-Fortschritt für „Start lange = Abbrechen“ sichtbar machen */
    if (kind === "pad") { const tick = () => { if (!inp.capture || inp.capture.action !== a || !btn.isConnected) return; btn.style.setProperty("--halt", String(inp.capture.holdK || 0)); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }
  };

  /* ---------- Gegenstand aufheben / tauschen ---------- */
  ui.offerItem = p => {
    const P = Z.player, it = p.it, isSkill = it.type === "skill";
    const sA = isSkill ? "s1" : "a1", sB = isSkill ? "s2" : "a2";
    if (!Z.meta.found[it.id]) setTimeout(() => ui.notify("<b>" + L(["Neu im Fundbuch: ", "New in the ledger: "]) + esc(L(Z.itemDef(it).n)) + "</b><br><small>" + L(["Nundro kann sie ab jetzt im Lager schärfen.", "Nundro can now sharpen it in camp."]) + "</small>", { prio: 1, art: "gold", icon: "📜", dauer: 3000 }), Z.presentItem ? 1200 : 300);
    Z.meta.found[it.id] = true; Z.saveMeta();
    const place = s => {
      const old = P.slots[s]; P.slots[s] = it;
      Z.pickups.splice(Z.pickups.indexOf(p), 1);
      if (old) Z.spawnPickup("item", p.x, p.y - 4, { it: old, drop: true, vy: -140, vx: -P.face * 60 });
      if (P.mag[s]) delete P.mag[s];
      P.combo[s] = 0;
      if (!Z.presentItem) { A.play("pickup", { vol: 0.6 }); Z.fx.text(P.x + P.w / 2, P.y - 12, L(Z.itemDef(it).n), Z.RARITY[it.rar].col, true); }
      if (Z.onPlaced) Z.onPlaced(it, s, p, old);
      Z.fx.burst(P.x + P.w / 2, P.y + 10, 14, { col: [Z.RARITY[it.rar].col, "#fff"], sp: 80, up: 40, life: 0.5, size: 2, kind: "spark", add: true });
    };
    if (!P.slots[sA]) return place(sA);
    if (!P.slots[sB]) return place(sB);
    /* beide belegt: Auswahl */
    ui.choiceActive = { p, sA, sB, place, dev: inp.device };
    const key = s => inp.device === "touch" || (ui.touchOn && inp.device !== "pad") ? "" : inp.label(s);
    const ttl = x => (Z.itemTitle ? Z.itemTitle(x) : L(Z.itemDef(x).n));
    const hand = s => (isSkill ? "" : L(s === "a1" ? ["Hand 1: ", "Hand 1: "] : ["Hand 2: ", "Hand 2: "]));
    /* kompakte Tauschwahl direkt über dem Fund – das Spiel läuft weiter, die Hand-Tasten tauschen sofort */
    choice.innerHTML = '<div class="ch-kopf">' + esc(t("replace")) + ": " + '<b style="color:' + Z.RARITY[it.rar].col + '">' + esc(ttl(it)) + '</b></div><div class="ch-reihe">' +
      [sA, sB].map(s => '<button data-slot="' + s + '">' + (key(s) ? "<kbd>" + esc(key(s)) + "</kbd> " : "") + esc(hand(s) + ttl(P.slots[s])) + '<small style="color:' + Z.RARITY[P.slots[s].rar].col + '">' + esc(L(Z.RARITY[P.slots[s].rar].n)) + "</small></button>").join("") +
      '</div><button data-slot="x" class="abbr">' + (key("roll") ? "<kbd>" + key("roll") + "</kbd> " : "") + esc(t("cancel")) + "</button>";
    choice.hidden = false; card.hidden = true; placeChoice();
    ui.klang("auf");
  };
  function placeChoice() {
    const c = ui.choiceActive; if (!c || choice.hidden) return;
    const [sx, sy] = worldToScreen(c.p.x, c.p.y - 34), hz = hudZoom(), w = choice.offsetWidth, h = choice.offsetHeight;
    const vw = innerWidth / hz, vh = innerHeight / hz;
    choice.style.transform = "translate(" + Math.round(U.clamp(sx / hz - w / 2, 8, vw - w - 8)) + "px," + Math.round(U.clamp(sy / hz - h, 60, vh - h - 90)) + "px)";
  }
  choice.addEventListener("click", e => { const b = e.target.closest("[data-slot]"); if (!b || !ui.choiceActive) return; const c = ui.choiceActive; ui.choiceActive = null; choice.hidden = true; if (b.dataset.slot !== "x") c.place(b.dataset.slot); });
  function choiceInput() {
    const c = ui.choiceActive; if (!c) return;
    /* Gerät gewechselt (Tastatur ↔ Controller): Tasten-Hinweise in der Tauschleiste nachziehen */
    if (c.dev !== inp.device) {
      c.dev = inp.device;
      const k = a => (inp.device === "touch" || (ui.touchOn && inp.device !== "pad") ? "" : inp.label(a));
      choice.querySelectorAll("[data-slot]").forEach(b => { const a = b.dataset.slot === "x" ? "roll" : b.dataset.slot, kb = b.querySelector("kbd"), lab = k(a); if (lab) { if (kb) kb.textContent = lab; else b.insertAdjacentHTML("afterbegin", "<kbd>" + esc(lab) + "</kbd> "); } else if (kb) kb.remove(); });
    }
    for (const s of [c.sA, c.sB]) if (inp.pressed[s]) { inp.consume(s); ui.choiceActive = null; choice.hidden = true; c.place(s); Z.player.buf[s] = 0; return; }
    if (inp.pressed.roll || inp.pressed.pause) { ui.choiceActive = null; choice.hidden = true; inp.consume("pause"); inp.consume("roll"); Z.player.buf.roll = 0; }
    const P = Z.player; if (P && Math.abs(c.p.x - (P.x + P.w / 2)) > 50) { ui.choiceActive = null; choice.hidden = true; return; }
    placeChoice();
  }

  /* ---------- Schriftrolle ---------- */
  ui.scrollChoice = () => {
    const P = Z.player;
    /* Welche getragenen Dinge profitieren? Zeigt konkret Schaden vorher → nachher */
    const gear = s => ["a1", "a2", "s1", "s2"].map(k => P.slots[k]).filter(x => x && Z.itemStat(x) === s);
    const kb = i => (inp.device === "keys" && !ui.touchOn ? "<kbd>" + (i + 1) + "</kbd> " : "");
    openModal("<h2>" + esc(t("scrollT")) + "</h2><p>" + esc(t("scrollD")) + '</p><div class="rollen">' +
      ["brut", "takt", "ueber"].map((s, i) => { const g = gear(s), n = P.stats[s];
        const hp = 14 + (s === "ueber" ? 14 : 0);
        const ben = g.length ? g.map(x => esc(Z.itemTitle ? Z.itemTitle(x) : L(Z.itemDef(x).n)) + " +" + Math.round(12 / (1 + 0.12 * n)) + " %").join(", ") : L(["Nichts Getragenes in dieser Farbe", "Nothing you carry in this colour"]);
        return '<button data-act="stat" data-arg="' + s + '" data-key="' + (i + 1) + '" style="--c:' + Z.STATS[s].col + '"' + (i === 0 ? " autofocus" : "") + "><b>" + kb(i) + esc(L(Z.STATS[s].n)) + " " + n + " → " + (n + 1) + "</b><small>" + esc(L(Z.STATS[s].d)) + '</small><small class="nutzen">' + L(["Jetzt: ", "Now: "]) + ben + " · +" + hp + L([" Leben", " health"]) + "</small></button>"; }).join("") +
      "</div>" + ausrLeiste(P), { cls: "schmal rollenwahl", noEsc: true });
    /* W42 Rollen: Ausrüstungsleiste unter der Wahl – Symbole zeichnen; Fokus/Zeigen auf eine Rolle hebt die passenden Teile hervor */
    const mw = document.querySelector("#modal .rollenwahl"); if (!mw) return; /* noch in der Warteschlange */
    mw.querySelectorAll(".ausr-k .ico[data-icon]").forEach(el => { if (el.firstChild) return; const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64; const c = cv.getContext("2d"); c.scale(2, 2); Z.drawIcon(c, el.dataset.icon, 16, 17, 22, el.dataset.col); el.appendChild(cv); });
    document.querySelectorAll("#modal .rollen button[data-arg]").forEach(b => {
      const an = () => { if (!mw) return; mw.classList.remove("hl-brut", "hl-takt", "hl-ueber"); mw.classList.add("hl-" + b.dataset.arg); };
      b.addEventListener("focus", an); b.addEventListener("mouseenter", an);
    });
    const f0 = document.querySelector("#modal .rollen button[autofocus]"); if (f0 && mw) mw.classList.add("hl-" + f0.dataset.arg);
  };
  /* W42 Rollen: getragene Waffen und Fähigkeiten mit Farbkennung, zu welcher Schriftrolle sie gehören */
  function ausrLeiste(P) {
    if (!document.getElementById("w42-rollen-css")) { const st = document.createElement("style"); st.id = "w42-rollen-css";
      st.textContent = ".ausr-leiste{margin-top:10px;border-top:1px solid #4a3a34;padding-top:8px}" +
        ".ausr-leiste h3{margin:0 0 6px;font-size:var(--fs-xs,12px);color:var(--mute,#b8a890);font-weight:normal;letter-spacing:.04em}" +
        ".ausr-reihe{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}" +
        ".ausr-k{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 3px 4px;border:1px solid var(--c);border-bottom-width:4px;border-radius:7px;background:linear-gradient(#24171a,#170f12);min-width:0;transition:opacity .15s,transform .15s,box-shadow .15s}" +
        ".ausr-k .ico{width:32px;height:32px}.ausr-k .ico canvas{width:32px;height:32px}" +
        ".ausr-k b{font-size:11px;line-height:1.15;color:#efe2c8;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
        ".ausr-k small{font-size:10px;line-height:1.1;color:var(--c);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}" +
        ".ausr-k.leer{border-color:#3d3140;opacity:.5}.ausr-k.leer small{color:#8a7a70}" +
        ".hl-brut .ausr-k:not(.s-brut),.hl-takt .ausr-k:not(.s-takt),.hl-ueber .ausr-k:not(.s-ueber){opacity:.32}" +
        ".hl-brut .ausr-k.s-brut,.hl-takt .ausr-k.s-takt,.hl-ueber .ausr-k.s-ueber{box-shadow:0 0 0 1px var(--c),0 0 12px var(--c);transform:translateY(-2px)}" +
        "@media (max-height:430px){.rollenwahl .rollen{gap:5px;margin-top:4px}.rollenwahl .rollen button{padding:5px 10px}.rollenwahl .rollen button small:not(.nutzen){display:none}.ausr-leiste{margin-top:6px;padding-top:5px}.ausr-leiste h3{display:none}.ausr-k{flex-direction:row;gap:4px;padding:3px 4px}.ausr-k .ico,.ausr-k .ico canvas{width:22px;height:22px;flex:none}.ausr-k small{display:none}.ausr-k b{text-align:left}}" +
        "@media (prefers-reduced-motion:reduce){.ausr-k{transition:none}.hl-brut .ausr-k.s-brut,.hl-takt .ausr-k.s-takt,.hl-ueber .ausr-k.s-ueber{transform:none}}";
      document.head.appendChild(st); }
    const ORT = { a1: ["Waffe 1", "Weapon 1"], a2: ["Waffe 2", "Weapon 2"], s1: ["Fähigkeit 1", "Skill 1"], s2: ["Fähigkeit 2", "Skill 2"] };
    const kach = ["a1", "a2", "s1", "s2"].map(k => {
      const it = P.slots[k]; if (!it) return '<div class="ausr-k leer" style="--c:#3d3140"><span class="ico"></span><b>' + esc(L(ORT[k])) + "</b><small>" + L(["leer", "empty"]) + "</small></div>";
      const d = Z.itemDef(it), st = Z.itemStat(it), S = Z.STATS[st], name = Z.itemTitle ? Z.itemTitle(it) : L(d.n);
      return '<div class="ausr-k s-' + (S ? st : "x") + '" style="--c:' + (S ? S.col : "#8a7a70") + '" title="' + esc(name) + '"><span class="ico" data-icon="' + d.icon + '" data-col="' + d.col + '"></span><b>' + esc(name) + "</b><small>" + (S ? "● " + esc(L(S.n)) : esc(L(ORT[k]))) + "</small></div>";
    }).join("");
    return '<div class="ausr-leiste"><h3>' + L(["Deine Ausrüstung – die Farbe zeigt, welche Rolle sie stärkt", "Your gear – the colour shows which scroll boosts it"]) + '</h3><div class="ausr-reihe">' + kach + "</div></div>";
  }
  actions.stat = s => { const P = Z.player; P.stats[s]++; const before = P.hpMax, hp0 = P.hp; Z.recalcPlayer(); P.hp = Math.min(P.hpMax, hp0 + Math.max(0, P.hpMax - before)); /* W26 Erstspieler: recalcPlayer skaliert schon mit – vorher 128/114 */ closeModal(); A.play("holy", { vol: 0.5 }); Z.fx.text(P.x + P.w / 2, P.y - 14, L(Z.STATS[s].n) + " +1", Z.STATS[s].col, true); Z.fx.burst(P.x + P.w / 2, P.y + 10, 20, { col: Z.STATS[s].col, sp: 60, up: 60, life: 0.8, size: 2.5, kind: "glow", add: true }); };

  /* ---------- Lager: Figuren ---------- */
  /* Sprechblase über einer Figur im Lager */
  const bubble = $("#bubble"); let bubbleT = 0, bubbleAt = null;
  ui.say = (wx, wy, who, txt, ms) => { bubble.innerHTML = (who ? "<b>" + esc(who) + "</b>" : "") + esc(txt); bubble.hidden = false; bubbleAt = [wx, wy]; bubbleT = (ms || 4200) / 1000;
    /* W11 R25 (nur Optik): gemaltes Porträt des Sprechers (figuren.js, Z.portraet), Ausdruck passend zum Satz */
    const pu = who && Z.portraet ? Z.portraet(who, txt) : null; bubble.classList.toggle("mit-bild", !!pu);
    if (pu) { const im = document.createElement("img"); im.className = "portraet"; im.alt = ""; im.src = pu; bubble.prepend(im); } };
  /* steht unter zoom (--hud): Bildschirmkoordinaten durch den Zoom teilen und die Blase im sichtbaren Bereich halten */
  function bubbleTick(dt) {
    if (bubble.hidden) return; bubbleT -= dt; if (bubbleT <= 0 || ui.modalOpen) { bubble.hidden = true; return; }
    const [x, y] = worldToScreen(bubbleAt[0], bubbleAt[1]), hz = hudZoom(), w = bubble.offsetWidth, h = bubble.offsetHeight;
    const vw = innerWidth / hz, m = 8;
    const bx = Math.max(m, Math.min(vw - w - m, x / hz - w / 2)), by = Math.max(m, Math.min(y / hz - h, (Z.freiUnten ? Z.freiUnten() : innerHeight - m) / hz - h - 2)); /* W38 Frei: nie unter die Waffenleiste/den Bildrand */
    bubble.style.transform = "translate(" + Math.round(bx) + "px," + Math.round(by) + "px)";
    bubble.style.setProperty("--zipfel", Math.round(Math.max(12, Math.min(w - 12, x / hz - bx))) + "px");
  }
  ui.npc = id => {
    const lines = Z.CAMP_TALK[id];
    const s = Z.level.props.find(p => p.id === id);
    if (lines && s) ui.say(s.x * Z.TILE + 8, s.y * Z.TILE - 22, { B: "Barradin", G: "Friedrich", E: "Echo", A: "Nundro", R: "Rex", C: "" }[id] || "", L(Z.R.pick(lines)), id === "A" || id === "B" || id === "C" ? 2600 : 4600);
    /* Fenster erst nach der Sprechblase – aber nur, wenn inzwischen nichts anderes offen ist und man noch im Lager steht */
    /* W26 Erstspieler: … und man noch bei der Figur steht (sonst ging z. B. Barradins Fundbuch auf, während man schon bei Friedrich war) */
    const near = () => !s || Math.abs(Z.player.x + Z.player.w / 2 - (s.x * Z.TILE + 8)) < 64;
    const later = (fn, ms) => { const lv = Z.level; setTimeout(() => { if (!ui.modalOpen && Z.level === lv && lv.hub && Z.player && !Z.player.dead && near()) fn(); }, ms); };
    if (id === "A") later(() => ui.forge(), 900);
    if (id === "B") later(() => ui.codex(), 900);
    if (id === "C") later(() => ui.skulls(), 700);
    if (id === "F") ui.story();
    if (id === "Y") ui.say(s.x * Z.TILE + 8, s.y * Z.TILE - 26, "", L(["Die Puppe hält alles aus. Probier deine Kombos – über ihr erscheint der Schaden pro Sekunde.", "The dummy takes everything. Try your combos – damage per second appears above it."]), 4200);
    if (id === "R") A.play("bark");
  };

  /* ---------- Schmiede ---------- */
  const FIND_COST = { haeufig: 1, selten: 1.3, rar: 1.7, legende: 2.4 };
  const lvlCost = (d, l) => Math.round((18 + 26 * l) * FIND_COST[d.find || "haeufig"]);
  const luckCost = l => [30, 70, 140][l];
  /* W6-Balancing (Meta-Kampagne mit Bot): Zähigkeit und Klingen waren nach ~5 Läufen voll (+50 Leben, +25 % Schaden) – vorher 25·(l+1) / 40·(l+1) */
  const upCost = (k, l) => ({ trank: [60, 150][l], zaeh: 40 * (l + 1), klingen: 60 * (l + 1), haendler: 50 * (l + 1) }[k]);
  const upMax = { trank: 2, zaeh: 5, klingen: 5, haendler: 3 };
  let forgeTab = 0;
  ui.forge = (tab) => {
    if (tab != null) forgeTab = +tab;
    const M = Z.meta, tabs = L(TX.tabsForge);
    let body = '<div class="reiter">' + tabs.map((x, i) => '<button data-act="forgeTab" data-arg="' + i + '" class="' + (i === forgeTab ? "an" : "") + '">' + esc(x) + "</button>").join("") + "</div>";
    if (forgeTab < 2) {
      const pool = forgeTab === 0 ? Z.WEAPONS : Z.SKILLS;
      body += '<div class="liste">';
      for (const id in pool) {
        const d = pool[id]; if (!d.find) continue;
        const found = M.found[id], lvl = M.wlvl[id] || 0, luck = M.luck[id] || 0;
        if (!found) { body += '<div class="zeile unbekannt"><span class="ico" data-icon="' + d.icon + '" data-col="#3a3236"></span><div><b>???</b><small>' + esc(L(Z.FIND[d.find].n)) + " · " + (d.only ? L(["nur an bestimmten Orten", "only in certain places"]) : L(["ab Gebietsstufe", "from area tier"]) + " " + ((d.tier || 0) + 1)) + "</small></div></div>"; continue; }
        const c1 = lvl < 5 ? lvlCost(d, lvl) : 0, c2 = luck < 3 ? luckCost(luck) : 0;
        body += '<div class="zeile"><span class="ico" data-icon="' + d.icon + '" data-col="' + d.col + '"></span><div><b>' + esc(L(d.n)) + (lvl ? ' <span class="lv">+' + lvl + "</span>" : "") + '</b><small>' + esc(L(d.d)) + "</small>" + (d.master ? '<small class="' + (lvl >= 3 ? "meister" : "gesperrt") + '">' + esc(L(d.master)) + (lvl >= 3 ? "" : L([" (ab Stufe 3)", " (from level 3)"])) + "</small>" : "") + "</div>" +
          '<div class="kauf"><button data-act="wlvl" data-arg="' + id + '"' + (lvl >= 5 || M.shards < c1 ? " disabled" : "") + ">" + (lvl >= 5 ? esc(t("max")) : esc(t("upgrade")) + " " + (lvl + 1) + " · " + c1 + "◆") + '</button><button data-act="luck" data-arg="' + id + '"' + (luck >= 3 || M.shards < c2 ? " disabled" : "") + ">" + esc(t("luck")) + " " + "★".repeat(luck) + "☆".repeat(3 - luck) + (luck < 3 ? " · " + c2 + "◆" : "") + "</button></div></div>";
      }
      body += "</div>";
    } else if (forgeTab === 3 && Z.forgeGlutHTML) {
      body += Z.forgeGlutHTML();
    } else {
      body += '<div class="liste">';
      for (const k in TX.ups) {
        const l = M.up[k] || 0, mx = upMax[k], c = l < mx ? upCost(k, l) : 0;
        body += '<div class="zeile"><div><b>' + esc(L(TX.ups[k][0])) + " " + "●".repeat(l) + "○".repeat(mx - l) + "</b><small>" + esc(L(TX.ups[k][1])) + '</small></div><div class="kauf"><button data-act="up" data-arg="' + k + '"' + (l >= mx || M.shards < c ? " disabled" : "") + ">" + (l >= mx ? esc(t("max")) : c + "◆") + "</button></div></div>";
      }
      body += "</div>";
    }
    openModal("<h2>" + esc(t("forge")) + ' <span class="bank">' + U.fmt(M.shards) + " ◆ " + esc(t("shards")) + "</span></h2>" + '<p class="hinweis">' + L(["Jede Waffe, die du einmal getragen hast, kann hier geschärft werden. Fundglück macht sie in der Feste häufiger. Finden musst du sie trotzdem.", "Any weapon you have carried once can be sharpened here. Find luck makes it more common in the keep. You still have to find it."]) + "</p>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
    drawIcons();
  };
  /* W11 R26 (nur Optik): Fundbuch-Gegner und -Bosse mit gemalten Bildern der echten Figuren (figuren.js) – unbekannte als Schattenriss */
  function drawBeasts() { if (!Z.gegnerBild) return; modal.querySelectorAll(".ico.vieh").forEach(el => { try { const bo = el.dataset.boss, d = bo ? Z.BOSSDEF[bo] : Z.ENEMIES[el.dataset.gegner]; if (!d) return;
    const kn = el.dataset.k === "1", bp = bo && kn && Z.bossPortraet ? Z.bossPortraet(d) : null, im = document.createElement("img"); im.alt = "";
    im.src = bp || (gb => Z.leinwandURL ? Z.leinwandURL(gb) : gb.toDataURL())(Z.gegnerBild(d, { w: 96, h: 96, dunkel: !kn, key: bo || el.dataset.gegner })); /* W23 Browser */ el.appendChild(im); } catch (e) { console.error(e); } }); }
  function drawIcons() { drawBeasts(); modal.querySelectorAll(".ico[data-icon]").forEach(el => { const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64; const c = cv.getContext("2d"); c.scale(2, 2); Z.drawIcon(c, el.dataset.icon, 16, 17, 22, el.dataset.col); el.appendChild(cv); }); }
  actions.forgeTab = i => ui.forge(i);
  actions.wlvl = id => { const M = Z.meta, d = Z.WEAPONS[id] || Z.SKILLS[id], l = M.wlvl[id] || 0, c = lvlCost(d, l); if (M.shards < c || l >= 5) return; M.shards -= c; M.wlvl[id] = l + 1; Z.saveMeta(); A.play("anvil", { vol: 0.7 }); ui.forge(); };
  actions.luck = id => { const M = Z.meta, l = M.luck[id] || 0, c = luckCost(l); if (M.shards < c || l >= 3) return; M.shards -= c; M.luck[id] = l + 1; Z.saveMeta(); A.play("gem", { vol: 0.6 }); ui.forge(); };
  actions.up = k => { const M = Z.meta, l = M.up[k] || 0, c = upCost(k, l); if (M.shards < c || l >= upMax[k]) return; M.shards -= c; M.up[k] = l + 1; Z.saveMeta(); A.play("anvil", { vol: 0.7 }); if (k === "trank") { Z.player.potMax = Z.player.potions = 2 + M.up.trank; } if (k === "zaeh") { Z.recalcPlayer(); Z.player.hp = Z.player.hpMax; } ui.forge(); };

  /* ---------- Fundbuch ---------- */
  let codexTab = 0;
  function findChance(id, d, tier) {
    const pool = Z.WEAPONS[id] ? Z.WEAPONS : Z.SKILLS; let sum = 0, mine = 0;
    for (const k in pool) { const x = pool[k]; if (!x.find || (x.tier || 0) > tier + 1 || x.legendaryOnly) continue; const w = Z.FIND[x.find].w * (1 + 0.7 * (Z.meta.luck[k] || 0)) * (x.only ? 0.35 : 1); sum += w; if (k === id) mine = w; }
    return sum ? mine / sum * 100 : 0;
  }
  ui.codex = (tab) => {
    if (tab != null) codexTab = +tab;
    const M = Z.meta, tabs = L(TX.tabsCodex);
    let body = '<div class="reiter">' + tabs.map((x, i) => '<button data-act="codexTab" data-arg="' + i + '" class="' + (i === codexTab ? "an" : "") + '">' + esc(x) + "</button>").join("") + "</div><div class=\"liste\">";
    if (codexTab <= 1) {
      const pool = codexTab === 0 ? Z.WEAPONS : Z.SKILLS;
      for (const id in pool) {
        const d = pool[id]; if (!d.find) continue;
        const found = M.found[id];
        const ch = d.legendaryOnly ? L(["nur vom Wraith", "only from the Wraith"]) : findChance(id, d, 3).toFixed(1) + " %";
        body += '<div class="zeile' + (found ? "" : " unbekannt") + '"><span class="ico" data-icon="' + d.icon + '" data-col="' + (found ? d.col : "#3a3236") + '"></span><div><b>' + (found ? esc(L(d.n)) : "???") + "</b><small>" + (found ? esc(L(d.d)) : esc(t("unknown"))) + '</small><small class="fund">' + esc(L(Z.FIND[d.find].n)) + " · " + esc(t("findChance")) + " ≈ " + ch + (d.only ? " · " + L(["Orte: ", "Places: "]) + d.only.map(o => Z.BOSSDEF[o] && !Z.BIOMES[o] && !Z.ARENAS[o] ? L(Z.BOSSDEF[o].n) : Z.areaName(o)).join(", ") : "") + (d.tags ? " · " + d.tags.map(tagTxt).join(", ") : "") + "</small></div></div>";
      }
    } else if (codexTab === 2) {
      for (const id in Z.ENEMIES) { if (id === "puppe" || id === "glutlingKlein") continue; const d = Z.ENEMIES[id], n = M.seen[id] || 0; body += '<div class="zeile' + (n ? "" : " unbekannt") + '"><span class="ico vieh" data-gegner="' + id + '" data-k="' + (n ? 1 : 0) + '"></span><div><b>'  + (n ? esc(L(d.n)) : "???") + "</b><small>" + (n ? L(["Erschlagen: ", "Slain: "]) + n + " · " + d.atks.length + L([" Angriffe", " attacks"]) + (d.undead ? L([" · untot", " · undead"]) : "") + (d.demon ? L([" · Dämon", " · demon"]) : "") + (d.front ? L([" · Schild vorn – von hinten angreifen", " · shield in front – attack from behind"]) : "") : "") + "</small></div></div>"; }
    } else if (codexTab === 3) {
      for (const id in Z.BOSSDEF) { if (id === "nezna") continue; const d = Z.BOSSDEF[id], b = M.bosses[id]; body += '<div class="zeile' + (b ? "" : " unbekannt") + '"><span class="ico vieh boss" data-boss="' + id + '" data-k="' + (b ? 1 : 0) + '"></span><div><b>'  + (b ? esc(L(d.n)) : "???") + "</b><small>" + (b ? esc(L(d.title || ["", ""])) + " · " + L(["Begegnet ", "Met "]) + b.seen + "× · " + L(["Besiegt ", "Defeated "]) + b.won + "×" : "") + "</small></div></div>"; }
    } else if (codexTab === 4) {
      for (const k of ["tiefe", "glut", "himmel", "alle"]) { const got = M.endings[k]; body += '<div class="zeile' + (got ? "" : " unbekannt") + '"><div><b>' + (got ? esc(L(TX.endings[k][0])) : "???") + "</b><small>" + (got ? L(TX.endings[k][1]).slice(0, 160).replace(/<br>/g, " ") + " …" : k === "alle" ? L(["Erreiche alle drei Enden.", "Reach all three endings."]) : L(["Ein Ende der Feste. Welcher Weg führt dorthin?", "An ending of the keep. Which path leads there?"])) + "</small></div></div>"; }
    } else {
      body += '<div class="zeile"><div><b>' + L(["Läufe", "Runs"]) + ": " + M.runs + " · " + L(["Siege", "Wins"]) + ": " + M.wins + "</b><small>" + L(["Meiste Kills in einem Lauf", "Most kills in one run"]) + ": " + M.best.kills + (M.best.time ? " · " + L(["Schnellster Sieg", "Fastest win"]) + ": " + fmtTime(M.best.time) : "") + "</small></div></div>";
    }
    body += "</div>";
    openModal("<h2>" + esc(t("codex")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
    drawIcons();
  };
  actions.codexTab = i => ui.codex(i);

  /* ---------- Schädelaltar ---------- */
  ui.skulls = () => {
    const M = Z.meta, mx = Math.min(5, M.skulls || 0);
    let body = "<p>" + esc(t("skullDesc")) + '</p><div class="schaedelwahl">';
    for (let i = 0; i <= 5; i++) body += '<button data-act="skull" data-arg="' + i + '"' + (i > mx ? " disabled" : "") + ' class="' + (i === (M.skullSel || 0) ? "an" : "") + '">' + (i ? "☠".repeat(i) : "–") + "</button>";
    body += "</div>" + (mx === 0 ? '<p class="hinweis">' + L(["Besiege einen Endboss, um den ersten Schädel zu verdienen.", "Defeat a final boss to earn your first skull."]) + "</p>" : "");
    openModal("<h2>" + esc(t("skullT")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close" autofocus>' + esc(t("close")) + "</button></div>", { cls: "schmal" });
  };
  actions.skull = i => { Z.meta.skullSel = +i; Z.saveMeta(); A.play("bell", { vol: 0.4 }); ui.skulls(); };

  /* ---------- Durchgang: Brunnen, Händler, Altar ---------- */
  ui.station = id => {
    const P = Z.player, lv = Z.level;
    if (id === "K") {
      if (lv.fountainUsed) return ui.toast(L(["Der Brunnen ist leer.", "The fountain is dry."]));
      lv.fountainUsed = true; P.potions = P.potMax; Z.healPlayer(P.hpMax * 0.25); A.play("splash", { vol: 0.6 }); A.play("heal");
      { const P2 = Z.koop && Z.koop.p2; if (P2 && !P2.down) P2.hp = Math.min(P2.hpMax, P2.hp + Math.round(P2.hpMax * 0.25)); } /* W39 P2: der Brunnen heilt auch Spieler 2 (Tränke sind ohnehin gemeinsam) */
      const s = lv.props.find(q => q.id === "K");
      return ui.notify(L(["Heiltränke aufgefüllt", "Healing potions refilled"]), s ? { ort: "welt", x: s.x * T + 8, y: s.y * T - 8, prio: 3, art: "gold" } : { prio: 3 });
    }
    /* Händler und Altar im Durchgang: Waren und Segenskugeln liegen in der Welt – das nächste Stück wird genommen */
    const px = proxyOf({ type: "station", s: lv.props.find(q => q.id === id) || { id } });
    if (px && px.type === "obj") return px.o.use();
    if (id === "M") return ui.shop();
    if (id === "S") return lv.blessTaken ? ui.notify(L(["Der Altar ist erloschen.", "The altar has gone dark."]), { prio: 3 }) : ui.altar();
  };
  /* Durchgang: Auslage des Händlers und Segenskugeln über dem Altar */
  function passageAuslage(lv) {
    const M = lv.props.find(q => q.id === "M"), S = lv.props.find(q => q.id === "S"), P = Z.player;
    if (M && lv.shop && lv.shop.length) {
      const wares = lv.shop.slice(); lv.shopWelt = wares; lv.shop = []; /* die kleinen Symbole am Stand zeichnet jetzt die Auslage */
      const items = wares.map(it => ({ art: "ware", it, preis: Z.itemPrice(it), verb: L(["kaufen & anlegen", "buy & equip"]),
        kannt: () => Z.player.gold >= Z.itemPrice(it) || (ui.notify(t("noGold"), { prio: 3 }), false),
        nimm: (d, g, e) => { const P2 = Z.player, pr = Z.itemPrice(it); P2.gold -= pr; it.sold = true; A.play("coin", { vol: 0.6 });
          const p = Z.spawnPickup("item", e.x, e.y, { it: Object.assign({}, it, { uid: it.uid + 100000 }), vx: 0, vy: 0, float: true }); ui.offerItem(p); } }));
      const healPrice = Math.round(40 + 30 * Z.run.tier);
      items.push({ art: "ware", icon: "braten", col: "#c88a4a", name: L(["Pilzbraten", "Mushroom roast"]), preis: healPrice, verb: L(["essen", "eat"]),
        label: () => L(["Pilzbraten – 60 % Leben", "Mushroom roast – 60% health"]),
        cardHTML: '<div class="ic-kopf" style="--rar:#e8c890"><b>' + L(["Pilzbraten", "Mushroom roast"]) + "</b><small>" + L(["Heilt 60 % Leben", "Heals 60% health"]) + "</small></div><p>" + L(["„", "“"]) + L(["Frisch aus Gracklstugh.", "Fresh from Gracklstugh."]) + L(["“", "”"]) + "</p>",
        kannt: () => (Z.player.gold < healPrice ? (ui.notify(t("noGold"), { prio: 3 }), false) : Z.player.hp >= Z.player.hpMax ? (ui.notify(L(["Du bist satt und heil.", "You're full and healthy."]), { prio: 3 }), false) : true),
        nimm: () => { const P2 = Z.player; P2.gold -= healPrice; Z.healPlayer(P2.hpMax * 0.6); A.play("heal"); } });
      if (P.curse > 0) { const cost = Math.max(150, P.curse * 15); items.push({ art: "ware", icon: "vial", col: "#c890ff", name: L(["Fluch brechen", "Break the curse"]), preis: cost, verb: L(["brechen", "break"]),
        cardHTML: '<div class="ic-kopf" style="--rar:#b07cff"><b>' + L(["Fluch brechen", "Break the curse"]) + "</b><small>" + L(["Der Fluch fällt sofort ab", "The curse falls away at once"]) + "</small></div>",
        kannt: () => Z.player.gold >= cost || (ui.notify(t("noGold"), { prio: 3 }), false), nimm: () => { const P2 = Z.player; P2.gold -= cost; P2.curse = 0; A.play("holy"); } }); }
      ui.auslage({ key: "haendler", station: "M", x: M.x * T + 8, y: (M.y + 1) * T, abstand: 21, hoch: 30, items });
    }
    if (S && lv.blessOffer && lv.blessOffer.length && !lv.blessTaken) {
      ui.auslage({ key: "altar", station: "S", x: S.x * T + 8, y: (S.y + 1) * T, abstand: 26, hoch: 44, einmal: true, aktiv: () => !Z.level.blessTaken,
        items: lv.blessOffer.map(b => segenKugel(b, () => { const P2 = Z.player; if (P2.bless.length >= 3) { actions.bless(b); return false; } actions.bless(b); })) });
    }
  }
  /* Segen als Kugel in der Welt (Altar, Schrein, Segenskugel) */
  const SEGEN_COL = { glas: "#ff7a6a", tank: "#e0b070", cc: "#c890ff", heil: "#ff9ab0", nutz: "#ffd27a" };
  function segenKugel(b, nimm, extra) {
    const d = Z.BLESS[b];
    return Object.assign({ art: "kugel", col: SEGEN_COL[d.k] || "#c890ff", name: L(d.n), unter: L(Z.BLESS_KIND[d.k]), artL: "magie", verb: L(["Segen nehmen", "take blessing"]),
      label: () => L(d.n),
      cardHTML: '<div class="ic-kopf" style="--rar:' + (SEGEN_COL[d.k] || "#c890ff") + '"><b>' + esc(L(d.n)) + "</b><small>" + esc(L(Z.BLESS_KIND[d.k])) + "</small></div><p>" + esc(L(d.d)) + "</p>" + (Z.player && Z.player.bless.length >= 3 ? '<p class="hinweis">' + L(["Du trägst schon drei Segen – danach wählst du, welcher geht.", "You already carry three – you'll then pick which one leaves."]) + "</p>" : ""),
      nimm }, extra || {});
  }
  ui.segenKugel = segenKugel;
  ui.shop = () => {
    const P = Z.player, lv = Z.level;
    let body = '<p class="hinweis">' + L(["„", "“"]) + L(["Kaufen oder raus.", "Buy or get out."]) + L(["“", "”"]) + '</p><div class="liste">';
    (lv.shop || []).forEach((it, i) => {
      const price = Z.itemPrice(it);
      body += '<div class="zeile ware"><span class="ico" data-icon="' + Z.itemDef(it).icon + '" data-col="' + Z.itemDef(it).col + '"></span><div class="ic">' + itemCardHTML(it, true) + '</div><div class="kauf"><button data-act="buy" data-arg="' + i + '"' + (it.sold || P.gold < price ? " disabled" : "") + ">" + (it.sold ? esc(t("sold")) : U.fmt(price) + " ●") + "</button></div></div>";
    });
    const healPrice = Math.round(40 + 30 * Z.run.tier);
    body += '<div class="zeile"><div><b>' + L(["Pilzbraten (60 % Leben)", "Mushroom roast (60% health)"]) + '</b><small>' + L(["„", "“"]) + L(["Frisch aus Gracklstugh.", "Fresh from Gracklstugh."]) + L(["“", "”"]) + '</small></div><div class="kauf"><button data-act="buyHeal"' + (P.gold < healPrice || P.hp >= P.hpMax ? " disabled" : "") + ">" + healPrice + " ●</button></div></div>";
    if (P.curse > 0) body += '<div class="zeile"><div><b>' + L(["Fluch brechen", "Break the curse"]) + '</b></div><div class="kauf"><button data-act="buyCurse"' + (P.gold < Math.max(150, P.curse * 15) ? " disabled" : "") + ">" + Math.max(150, P.curse * 15) + " ●</button></div></div>";
    body += "</div>";
    openModal("<h2>" + esc(t("shop")) + ' <span class="bank">' + U.fmt(P.gold) + " ● " + esc(t("gold")) + "</span></h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "breit" });
    drawIcons();
  };
  actions.buy = i => {
    const P = Z.player, it = Z.level.shop[+i], price = Z.itemPrice(it);
    if (it.sold || P.gold < price) return ui.toast(t("noGold"));
    P.gold -= price; it.sold = true; A.play("coin", { vol: 0.6 });
    closeModal();
    const p = Z.spawnPickup("item", P.x + P.w / 2 + P.face * 14, P.y + P.h, { it: Object.assign({}, it, { uid: it.uid + 100000 }), vx: 0, vy: -100 });
    ui.toast(L(["Gekauft. Es liegt vor dir.", "Bought. It lies before you."]));
  };
  actions.buyHeal = () => { const P = Z.player, price = Math.round(40 + 30 * Z.run.tier); if (P.gold < price) return; P.gold -= price; Z.healPlayer(P.hpMax * 0.6); A.play("heal"); ui.shop(); };
  actions.buyCurse = () => { const P = Z.player, cost = Math.max(150, P.curse * 15); if (P.gold < cost) return; P.gold -= cost; P.curse = 0; A.play("holy"); ui.shop(); };
  ui.altar = () => {
    const P = Z.player, lv = Z.level;
    if (lv.blessTaken) return ui.toast(L(["Der Altar ist erloschen.", "The altar has gone dark."]));
    const full = P.bless.length >= 3;
    let body = "<p>" + L(["Wähle einen Segen. Er begleitet dich bis zum Ende des Laufs. Höchstens drei.", "Choose a blessing. It stays with you until the end of the run. Three at most."]) + '</p><div class="rollen">';
    lv.blessOffer.forEach((b, i) => { const d = Z.BLESS[b]; body += '<button data-act="bless" data-arg="' + b + '"' + (i === 0 ? " autofocus" : "") + ' class="k-' + d.k + '"><b>' + esc(L(d.n)) + '</b><small class="art">' + esc(L(Z.BLESS_KIND[d.k])) + "</small><small>" + esc(L(d.d)) + "</small></button>"; });
    body += "</div>" + (full ? '<p class="hinweis">' + L(["Du trägst schon drei Segen. Wählst du einen neuen, entscheidest du danach, welcher geht.", "You already carry three blessings. If you choose a new one, you'll then decide which one leaves."]) + "</p>" : "");
    openModal("<h2>" + esc(t("altar")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("close")) + "</button></div>", { cls: "schmal" });
  };
  actions.bless = b => {
    const P = Z.player, lv = Z.level;
    if (P.bless.length >= 3) {
      closeModal();
      let body = "<p>" + L(["Welcher Segen soll gehen?", "Which blessing should leave?"]) + '</p><div class="rollen">' + P.bless.map((x, i) => '<button data-act="blessSwap" data-arg="' + x + "|" + b + '"' + (i === 0 ? " autofocus" : "") + "><b>" + esc(L(Z.BLESS[x].n)) + "</b><small>" + esc(L(Z.BLESS[x].d)) + "</small></button>").join("") + "</div>";
      return openModal("<h2>" + esc(t("altar")) + "</h2>" + body + '<div class="knoepfe"><button data-act="close">' + esc(t("cancel")) + "</button></div>", { cls: "schmal" });
    }
    P.bless.push(b); lv.blessTaken = true; afterBless(b);
  };
  actions.blessSwap = arg => { const [oldB, newB] = arg.split("|"); const P = Z.player; P.bless = P.bless.filter(x => x !== oldB); P.bless.push(newB); Z.level.blessTaken = true; afterBless(newB); };
  function afterBless(b) { closeModal(); const P = Z.player; Z.recalcPlayer(); A.play("holy", { vol: 0.6 }); Z.fx.flashScreen("#ff8a5a", 0.3); Z.fx.text(P.x + P.w / 2, P.y - 14, L(Z.BLESS[b].n), "#ffb090", true); }

  /* ---------- Tod & Ende ---------- */
  function statsHTML() {
    if (Z.runStatsHTML) return Z.runStatsHTML();
    const P = Z.player, run = Z.run || { time: 0, shardsBank: 0 };
    return '<div class="stats"><div><b>' + (Z.stats.kills || 0) + "</b>" + esc(t("kills")) + "</div><div><b>" + fmtTime(run.time) + "</b>" + esc(t("time")) + "</div><div><b>" + U.fmt(Z.stats.gold || 0) + "</b>" + esc(t("gold")) + "</div><div><b>" + (Z.stats.parries || 0) + "</b>" + esc(t("parries")) + "</div><div><b>" + run.shardsBank + "</b>" + esc(t("shardsKept")) + "</div>" + (P && P.shards ? "<div><b>" + P.shards + "</b>" + esc(t("shardsLost")) + "</div>" : "") + "</div>" +
      '<p class="hinweis">' + esc(t("reached")) + ": " + (run.route || []).map(r => esc(Z.areaName(r))).join(" → ") + "</p>";
  }
  /* W11 R27 (nur Optik): Laufbilanz (Tod, Umkehr, Sieg) schmücken – gemaltes Siegel über dem Titel (figuren.js Z.siegelURL),
     roter bzw. goldener Schein, Kacheln erscheinen nacheinander, leere Werte treten zurück. Greift, sobald die Bilanz im
     Fenster steht (auch aus der Warteschlange oder von anderen Modulen umhüllt). */
  new MutationObserver(() => { try {
    const bx = modal.querySelector(".mbox"), bl = bx && bx.querySelector(".bilanz"); if (!bl || bx.classList.contains("geschmueckt")) return;
    bx.classList.add("geschmueckt"); const sieg = !!bx.querySelector("h2.ende"), h2 = bx.querySelector("h2"), um = !sieg && h2 && h2.textContent === L(["Umgekehrt", "Turned back"]);
    bx.classList.add(sieg ? "bilanz-sieg" : "bilanz-tod");
    const sch = document.createElement("div"); sch.className = "bilanz-schein"; bx.prepend(sch);
    if (Z.siegelURL && h2) { const im = document.createElement("img"); im.className = "bilanz-siegel"; im.alt = ""; im.src = sieg ? Z.siegelURL("sieg", { stufe: "gold", band: true }) : um ? Z.siegelURL("tor", { stufe: "silber" }) : Z.siegelURL("tod", { stufe: "blut", band: true }); h2.before(im); }
    /* R28: getragener Titel des Spielers unter der Überschrift */
    { const tt = Z.achTitel ? Z.achTitel() : ""; if (tt && h2) { const p = document.createElement("p"); p.className = "bilanz-titel"; p.innerHTML = "Ezekiel · <b>„" + esc(tt) + "“</b>"; h2.after(p); } }
    /* R28: Fenster beginnt oben (Siegel und Titel sichtbar), auch wenn der Fokus auf dem Knopf unten liegt */
    for (const ms of [0, 60, 250]) setTimeout(() => { bx.scrollTop = 0; modal.scrollTop = 0; }, ms);
    bl.querySelectorAll(".bk").forEach((k, i) => { k.style.setProperty("--i", i); const v = (k.querySelector("b") || {}).textContent || ""; if (/^(0|0 m|0:00)$/.test(v.trim())) k.classList.add("leer"); });
  } catch (e) { console.error(e); } }).observe(modal, { childList: true });
  ui.deathScreen = o => {
    openModal("<h2>" + esc(o && o.abort ? L(["Umgekehrt", "Turned back"]) : t("died")) + '</h2><p class="unter">' + esc(o && o.abort ? L(["Ezekiel kehrt um. Ohne ein Wort.", "Ezekiel turns back. Without a word."]) : t("diedSub")) + "</p>" + statsHTML() + gnadeNote() + '<p class="tipp">' + esc(L(Z.R.pick(TX.tips))) + '</p><div class="knoepfe"><button data-act="toCamp" autofocus>' + esc(t("camp")) + "</button></div>", { cls: "breit todfenster", noEsc: true });
  };
  actions.toCamp = () => { modalQueue.length = 0; closeModal(); Z.backToCamp(); }; /* nach Tod/Ende nichts Altes nachholen */
  ui.ending = key => {
    const M = Z.meta, run = Z.run;
    const first = !M.endings[key];
    M.endings[key] = (M.endings[key] || 0) + 1; M.wins++;
    /* Barmherzigkeit: Sieg zählt, aber keine Bestzeit und kein neuer Schädel-Grad (fair gegenüber Läufen ohne Hilfe) */
    const mercy = !!run.gnade;
    if (!mercy && (!M.best.time || run.time < M.best.time)) M.best.time = run.time;
    const newSkull = !mercy && run.skulls >= (M.skulls || 0) && (M.skulls || 0) < 5;
    if (newSkull) M.skulls = (M.skulls || 0) + 1;
    /* Splitter aus dem letzten Abschnitt sichern */
    M.shards += Z.player.shards; run.shardsBank += Z.player.shards; Z.player.shards = 0;
    const all = M.endings.tiefe && M.endings.glut && M.endings.himmel;
    const showAll = all && !M.endings.alle;
    if (showAll) M.endings.alle = 1;
    Z.saveMeta();
    const e = TX.endings[key];
    openModal('<h2 class="ende">' + esc(L(e[0])) + '</h2><p class="erz">' + L(e[1]) + "</p>" + (showAll ? '<h2 class="ende">' + esc(L(TX.endings.alle[0])) + '</h2><p class="erz">' + L(TX.endings.alle[1]) + "</p>" : "") + statsHTML() + gnadeNote() + (newSkull ? '<p class="schaedel">☠ ' + esc(t("winSkull")) + "</p>" : "") + '<div class="knoepfe"><button data-act="toCamp" autofocus>' + esc(t("camp")) + "</button></div>", { cls: "breit endfenster", noEsc: true });
    A.play("holy", { vol: 0.6 });
  };

  /* ======================= TOUCH ======================= */
  const tc = $("#touch");
  ui.touchOn = false;
  function touchSync() { tc.hidden = !ui.touchOn || !Z.level; tc.style.setProperty("--ts", Z.settings.touchSize);
    /* W39 Touch: Deckkraft (30–100 %) und Linkshänder-Spiegelung (Stick rechts, Knöpfe links) */
    { const ta = +Z.settings.touchAlpha; tc.style.setProperty("--ta", isFinite(ta) && ta > 0 ? Math.max(0.3, Math.min(1, ta)) : 1); tc.classList.toggle("spiegel", !!Z.settings.touchMirror); document.body.classList.toggle("touchspiegel", !!Z.settings.touchMirror && ui.touchOn); }
    /* W36 Feinschliff: Touch-Knöpfe standen fest deutsch im HTML (EN-Modus: „Sprung/Rolle/Waffe 1/Trank“) */
    if (tc._lang !== Z.settings.lang) { tc._lang = Z.settings.lang; const AL = { s1: ["Fähigkeit 1", "Skill 1"], s2: ["Fähigkeit 2", "Skill 2"], use: ["Benutzen", "Use"], pause: ["Pause", "Pause"], map: ["Karte", "Map"] }, TL = { a1: ["Waffe<br>1", "Weapon<br>1"], a2: ["Waffe<br>2", "Weapon<br>2"], jump: ["Sprung", "Jump"], roll: ["Rolle", "Roll"], potion: ["Trank", "Potion"] }; tc.querySelectorAll("[data-t]").forEach(b => { const t = TL[b.dataset.t]; if (t) b.innerHTML = L(t); const al = AL[b.dataset.t]; if (al) b.setAttribute("aria-label", L(al)); }); } } /* W39 Bedienung: aria-label der Symbolknöpfe in der Sprache */
  addEventListener("touchstart", () => { if (!ui.touchOn) { ui.touchOn = true; inp.device = "touch"; touchSync(); } }, { passive: true });
  /* Stick */
  const stick = $("#stick"), knob = $("#knob");
  let stickId = null, sx0 = 0, sy0 = 0;
  const stickArea = $("#stickzone");
  const mir = () => tc.classList.contains("spiegel"), vx = x => (mir() ? innerWidth - x : x); /* W39 Touch: #touch ist gespiegelt → Anzeige-Koordinate */
  stickArea.addEventListener("pointerdown", e => { stickId = e.pointerId; sx0 = e.clientX; sy0 = e.clientY; stick.style.left = vx(sx0) + "px"; stick.style.top = sy0 + "px"; stick.classList.add("an"); try { stickArea.setPointerCapture(e.pointerId); } catch (_) {} moveStick(e); });
  stickArea.addEventListener("pointermove", e => { if (e.pointerId === stickId) moveStick(e); });
  const endStick = e => { if (e.pointerId !== stickId) return; stickId = null; stick.classList.remove("an"); knob.style.transform = ""; ["left", "right", "up", "down"].forEach(a => inp.setTouch(a, false)); };
  stickArea.addEventListener("pointerup", endStick); stickArea.addEventListener("pointercancel", endStick);
  function moveStick(e) {
    let dx = e.clientX - sx0, dy = e.clientY - sy0;
    const r = 46 * Z.settings.touchSize, d = Math.hypot(dx, dy), k = d > r ? r / d : 1;
    /* W39 Touch: Stick zieht nach – über den Rand hinaus wandert die Mitte mit, Umkehren braucht nur noch Rand + Totzone
       (gemessen vorher 140 px Rückweg nach 120 px Auslenkung) */
    if (d > r) { sx0 += dx * (1 - k); sy0 += dy * (1 - k); dx *= k; dy *= k; stick.style.left = vx(sx0) + "px"; stick.style.top = sy0 + "px"; }
    knob.style.transform = "translate(" + (mir() ? -dx : dx) + "px," + dy + "px)";
    const th = Math.max(6, Math.min(30, +Z.settings.touchDead || 14)); /* W39 Touch: Totzone einstellbar (Standard 14 px wie bisher) */
    inp.setTouch("left", dx < -th); inp.setTouch("right", dx > th);
    inp.setTouch("up", dy < -th * 2.2 && Math.abs(dy) > Math.abs(dx) * 0.7); inp.setTouch("down", dy > th * 2.2 && Math.abs(dy) > Math.abs(dx) * 0.7);
  }
  /* W39 Touch: Finger darf zwischen Aktionsknöpfen rutschen (z. B. von Sprung auf Waffe 1, ohne abzusetzen) – je Finger der gerade
     gehaltene Knopf; Pause/Karte nehmen nie an einem Rutschen teil. Optional ein kurzer Vibrations-Tick beim Drücken (Einstellung). */
  const SLIDE = new Map(), NOSLIDE = { pause: 1, map: 1 };
  const tTick = () => { if (Z.settings.touchTick && Z.vib) Z.vib({ s: 0.4, w: 0.2, ms: 22, p: 0, gap: 0.05 }); };
  tc.querySelectorAll("[data-t]").forEach(b => {
    const a = b.dataset.t;
    b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add("an"); if (a === "pause") { if (ui.modalOpen) { if (!ui.noEsc) closeModal(); } else if (!ui.choiceActive) ui.pause(); return; } if (a === "map") { toggleMap(); return; } inp.setTouch(a, true); SLIDE.set(e.pointerId, b); tTick(); A.init(); });
    b.addEventListener("pointermove", e => {
      const cur = SLIDE.get(e.pointerId); if (!cur) return;
      const el = document.elementFromPoint(e.clientX, e.clientY), nb = el && el.closest ? el.closest("#touch [data-t]") : null;
      if (!nb || nb === cur || NOSLIDE[nb.dataset.t]) return;
      cur.classList.remove("an"); inp.setTouch(cur.dataset.t, false);
      nb.classList.add("an"); inp.setTouch(nb.dataset.t, true); SLIDE.set(e.pointerId, nb); tTick();
    });
    const up = e => { const cur = (e && SLIDE.get(e.pointerId)) || b; if (e) SLIDE.delete(e.pointerId); cur.classList.remove("an"); b.classList.remove("an"); if (!NOSLIDE[cur.dataset.t]) inp.setTouch(cur.dataset.t, false); };
    b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
  });

  /* ======================= JEDES BILD ======================= */
  const navRep = { dir: "", t: 0 };
  /* Hinweisleiste für Controller in Menüs */
  const padHint = document.createElement("div"); padHint.id = "padhint"; padHint.className = "eisen"; padHint.hidden = true; document.body.appendChild(padHint);
  let padHintKey = "";
  function syncPadHint() {
    /* Controller und Tastatur bekommen eine Hinweisleiste (Touch braucht keine: dort wird getippt) */
    const pad = inp.device === "pad", show = ui.modalOpen && (pad || (inp.device === "keys" && !ui.touchOn));
    const n = k => (pad ? { jump: "A", roll: "B", s1: "LB", s2: "RB" }[k] || inp.padButtonName(inp.pad[k]) : inp.label(k)); /* W20 Steuerung: Menüknöpfe sind fest */
    const tabs = show && modal.querySelector(".reiter button");
    const key = show ? [pad, n("jump"), n("roll"), ui.noEsc, !!tabs, n("s1"), n("s2"), Z.settings.lang].join("|") : "";
    if (key === padHintKey) return; padHintKey = key;
    padHint.hidden = !show; if (!show) return;
    if (pad) padHint.innerHTML = "<span><kbd>" + esc(n("jump")) + "</kbd> " + L(["Auswählen", "Select"]) + "</span>" + (ui.noEsc ? "" : "<span><kbd>" + esc(n("roll")) + "</kbd> " + L(["Zurück", "Back"]) + "</span>") +
      (tabs ? "<span><kbd>" + esc(n("s1")) + "</kbd><kbd>" + esc(n("s2")) + "</kbd> " + L(["Reiter", "Tabs"]) + "</span>" : "") + "<span><kbd>◐</kbd> " + L(["Bewegen", "Move"]) + "</span>";
    else padHint.innerHTML = "<span><kbd>Enter</kbd> " + L(["Auswählen", "Select"]) + "</span>" + (ui.noEsc ? "" : "<span><kbd>Esc</kbd> " + L(["Zurück", "Back"]) + "</span>") +
      (tabs ? "<span><kbd>" + esc(n("s1")) + "</kbd><kbd>" + esc(n("s2")) + "</kbd> " + L(["Reiter", "Tabs"]) + "</span>" : "") + "<span><kbd>↑↓←→</kbd> " + L(["Bewegen", "Move"]) + "</span>";
  }
  let lastFrame = performance.now();
  ui.frame = dt => {
    /* Meldungen und Weltschilder laufen in Echtzeit (auch hinter Fenstern) */
    const now = performance.now(), rdt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
    try { noteTick(rdt); if (Z.level) labelTick(); } catch (e) { console.error(e); }
    syncPadHint();
    if (Z.run && !Z.run.gnade && Z.mercy()) Z.run.gnade = true; /* Hilfsmodus kennzeichnet den laufenden Durchgang */
    /* W20 Steuerung: in Menüs und auf dem Titelbild gelten am Controller feste Knöpfe (A wählt, B zurück, Menü/Start, LB/RB
       Reiter, RS Ausrüstung) – egal wie die Spielsteuerung belegt ist. X leert im Steuerungsmenü das gewählte Feld. */
    if (inp.device === "pad" && inp.menu && !inp.capture && (ui.modalOpen || !title.hidden)) {
      const m = inp.menu; for (const a of ["jump", "roll", "a1", "a2", "use", "s1", "s2", "pause", "gear", "potion", "map"]) inp.pressed[a] = false;
      inp.pressed.jump = m.ok; inp.pressed.roll = m.back; inp.pressed.pause = m.start; inp.pressed.s1 = m.lb; inp.pressed.s2 = m.rb; inp.pressed.gear = m.rs;
      if (m.x && ui.modalOpen) { const f = document.activeElement; if (f && f.classList && f.classList.contains("belegung") && modal.contains(f)) actions.bindClear(f.dataset.arg); }
    }
    if (!title.hidden && !ui.modalOpen) { if (inp.pressed.jump || inp.pressed.use || inp.pressed.a1) { const b = title.querySelector("button:focus, a:focus") || title.querySelector("button"); if (b) b.click(); } if (inp.pressed.down || inp.pressed.up) { const bs = [...title.querySelectorAll("button, a")]; const i = bs.indexOf(document.activeElement); (bs[(i + (inp.pressed.down ? 1 : -1) + bs.length) % bs.length] || bs[0]).focus(); } inp.endFrame(); return; }
    if (inp.pressed.pause && !ui.choiceActive) { inp.consume("pause"); if (ui.modalOpen) { if (!ui.noEsc) closeModal(); } else ui.pause(); }
    /* Controller „Ansicht“: antippen = Karte (beim Loslassen), halten = Ausrüstung. Die Tastatur hat eigene Tasten
       (Karte schaltet sofort über onKey, Touch über den Kartenknopf) – inp.pressed.map kommt hier nur vom Controller. */
    if (!ui.modalOpen) {
      if (inp.pressed.map) { inp.consume("map"); mapHold = 0; mapAsGear = false; }
      if (mapHold >= 0) {
        if (inp.held.map) { mapHold += rdt; if (mapHold >= 0.3) mapAsGear = true; }
        else { if (!mapAsGear) toggleMap(); mapHold = -1; mapAsGear = false; }
      }
    } else { mapHold = -1; mapAsGear = false; }
    try { gearQuickTick(); } catch (e) { console.error(e); }
    if (ui.modalOpen) {
      if (inp.capture) { inp.endFrame(); return; }
      if (inp.pressed.s1 || inp.pressed.s2) switchTab(inp.pressed.s2 ? 1 : -1);
      else if (inp.pressed.gear) { inp.consume("gear"); gearTabToggle(); }
      /* Gamepad in Menüs: Richtung mit Wiederholung beim Halten, A bestätigt, B zurück, rechter Stick blättert */
      const fe = document.activeElement;
      const dirNow = inp.held.up ? "u" : inp.held.down ? "d" : inp.held.left ? "l" : inp.held.right ? "r" : "";
      let fire = false;
      if (dirNow && dirNow !== navRep.dir) { navRep.dir = dirNow; navRep.t = 0.34; fire = true; }
      else if (dirNow) { navRep.t -= dt; if (navRep.t <= 0) { navRep.t = 0.085; fire = true; } }
      else navRep.dir = "";
      if (fire) {
        const d = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[dirNow];
        if (d[0] && adjustField(fe, d[0])) {} else moveDir(d[0], d[1]);
      }
      /* Knopf, mit dem das Fenster geöffnet wurde, gilt erst nach dem Loslassen wieder */
      for (const a of ["jump", "a1", "use"]) if (confirmGuard.held[a] && !inp.held[a]) confirmGuard.held[a] = false;
      const cf = ["jump", "a1", "use"].find(a => inp.pressed[a] && confirmOk(a));
      if (cf) { const f = ensureFocus(); if (f && modal.contains(f)) { if (f.tagName === "SELECT") adjustField(f, 1); else if (!(f.tagName === "INPUT" && f.type === "range")) f.click(); } }
      if (inp.pressed.roll && !ui.noEsc) closeModal();
      const pad = inp.lastPad; if (pad) { const ry = pad.axes[3] || 0; if (Math.abs(ry) > 0.25) { const box = modal.querySelector(".mbox"); if (box) box.scrollTop += ry * dt * 900; } }
      inp.endFrame();
      return;
    }
    choiceInput();
    if (Z.level) { updateHud(dt); bubbleTick(dt); auslageTick(); }
  };
  /* Splitter-Anzeige: Bank im Lager */
  document.addEventListener("visibilitychange", () => { if (document.hidden && Z.level && !ui.modalOpen && Z.run) ui.pause(); });

  /* ---------- Schriftgröße: Oberfläche wächst mit der Bildschirmhöhe ----------
     Hier ist die letzte Instanz für --hud (HUD, Meldungen, Weltschilder, Sprechblasen) und --ui (alle Fenster):
     pracht.js setzt beim Größenwechsel Vorschläge, fitText läuft danach (setTimeout) und überschreibt sie.
     Maßstab ist die HÖHE (Ultrawide 3440×1440 = 2560×1440); die Breite begrenzt nur bei schmalen Fenstern.
     Ziel: Fließtext in Fenstern ≈ 1,8–1,9 % der Bildschirmhöhe (1080p ≈ 21 px, 1440p ≈ 28 px), kleine Texte ≥ ~1,3 %.
     Einstellung „Textgröße“ (Z.settings.textSize: klein/normal/gross/riesig) multipliziert beides. */
  const TEXTSIZE = { klein: 0.86, normal: 1, gross: 1.17, riesig: 1.34 };
  ui.textFactor = () => TEXTSIZE[Z.settings.textSize] || 1;
  function fitText() {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const H = innerHeight, W = innerWidth, de = document.documentElement, klein = H <= 620 || W <= 900;
    const coarse = matchMedia("(pointer: coarse)").matches, tg = ui.textFactor();
    de.classList.toggle("handheld", klein);
    let hud, uiz;
    if (coarse) { hud = clamp(Math.min(H / 420, W / 860), 0.78, 1.25); uiz = clamp(H / 430, 0.8, 1.15); }
    else { hud = clamp(Math.min(W / 1280, H / 720), 0.72, 3.2); uiz = clamp(Math.min(W / 1150, Math.max(H / 780, Math.min(1, H / 700))), 0.88, 3.2); }
    if (klein) hud = Math.max(hud, Math.min(1, H / 500));
    /* HUD wächst mit der Textgröße nur gedämpft mit (Spielfeld frei halten) */
    hud *= 1 + (tg - 1) * 0.6; uiz *= tg;
    /* nie so groß, dass ein schmales Fenster (520 px) nicht mehr in die Breite passt oder die Höhe unter ~400 px fällt */
    uiz = Math.min(uiz, Math.max(0.8, W / 560), Math.max(0.8, H / 400));
    de.style.setProperty("--hud", hud.toFixed(3)); de.style.setProperty("--ui", uiz.toFixed(3)); de.style.setProperty("--tg", tg.toFixed(2));
    de.dataset.textgroesse = Z.settings.textSize || "normal";
    hudZT = 0;
  }
  ui.applyText = fitText;
  addEventListener("resize", () => setTimeout(fitText, 0)); addEventListener("orientationchange", () => setTimeout(fitText, 260)); fitText();

  /* Start */
  showTitle();
})();
