/* Ezekiel – The Destroyer · Miras Tagebuch, Wegweiser und gefesselte Kundschafter
   Vor Ezekiel ist schon eine Gruppe in die Feste gegangen: Mira, die Kartenzeichnerin, Bruder Holm, Tavik und Grete.
   In jedem Gebiet liegt eine Seite aus Miras Tagebuch – wer alle 13 findet, kennt ihre Geschichte bis zum Ende
   und weiß, wer die Fäden spinnt. Die Seiten bleiben über alle Läufe hinweg gesammelt.
   Dazu: Wegweiser vor den Ausgängen und gefesselte Kundschafter, die nach ihrer Befreiung die Karte zeigen. */
(function () {
  "use strict";
  const Z = window.Z, T = Z.TILE, CW = Z.CW, CH = Z.CH, L = v => Z.L(v), A = Z.audio, FX = Z.fx, inp = Z.input;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const TAU = Math.PI * 2;

  /* ---------- Die Seiten ---------- */
  const PAGES = [
    { area: "torhof", t: ["Erster Tag", "Day one"], de: "Wir sind zu viert durch das Tor. Grete meint, eine Burg, die nachts auftaucht, sei eine Einladung. Holm meint, eine Einladung, die man nicht abschicken kann, sei eine Falle. Tavik hat schon die erste Truhe aufgebrochen. Ich zeichne die Karte – aber die Mauern stehen nicht still, wenn man wegsieht.", en: "Four of us went through the gate. Grete says a castle that appears at night is an invitation. Holm says an invitation you can't send back is a trap. Tavik had already cracked the first chest. I draw the map – but the walls don't stay put when you look away." },
    { area: "keller", t: ["Im Keller", "In the cellars"], de: "Wein, Ratten und ein Geruch, über den niemand spricht. Tavik hat ein Fass angestochen, Grete hat ihn davon abgehalten, das ganze auszutrinken. Holm sagt, die Ratten hier haben Augen wie Menschen. Ich habe nicht hingesehen.", en: "Wine, rats and a smell nobody talks about. Tavik tapped a barrel, Grete stopped him from drinking all of it. Holm says the rats here have eyes like people. I didn't look." },
    { area: "hallen", t: ["Die Hallen", "The halls"], de: "In den Hallen hängen Bilder. Auf jedem ist jemand, den einer von uns einmal besiegt hat. Grete hat ihren alten Rivalen erkannt, den Schmied aus Mirabar. Er lächelt auf dem Bild. Er hat nie gelächelt.", en: "Paintings hang in the halls. Each shows someone one of us once defeated. Grete recognised her old rival, the smith from Mirabar. He smiles in the painting. He never smiled." },
    { area: "wehrgang", t: ["Auf dem Wehrgang", "On the ramparts"], de: "Der Wind reißt einem die Worte aus dem Mund. Grete hat ihre Axt verloren, sie ist über die Zinnen gefallen. Wir haben gewartet, ob wir sie aufschlagen hören. Wir haben nichts gehört.", en: "The wind tears the words from your mouth. Grete lost her axe, it fell over the battlements. We waited to hear it land. We heard nothing." },
    { area: "verlies", t: ["Das Verlies", "The dungeon"], de: "Holm betet laut, damit wir die Ketten nicht hören. In einer Zelle saß ein Mann, der uns mit Namen ansprach. Er wusste, wann wir das Tor durchschritten haben. Er wusste, wann wir es nicht mehr verlassen werden.", en: "Holm prays aloud so we don't hear the chains. A man in one cell called us by name. He knew when we passed the gate. He knew when we won't leave it again." },
    { area: "hafen", t: ["Der Hafen", "The harbour"], de: "Ein Boot ohne Ruderer hat am Steg auf uns gewartet. Tavik wollte einsteigen. Holm hat ihn am Kragen festgehalten. Das Boot ist allein hinausgefahren und hat geläutet wie eine Totenglocke.", en: "A boat without an oarsman waited for us at the pier. Tavik wanted to get in. Holm held him by the collar. The boat drifted out alone, ringing like a funeral bell." },
    { area: "glocken", t: ["Der Glockenturm", "The bell tower"], de: "Ich habe es verstanden: Die Glocken läuten jedes Mal, wenn irgendwo in der Feste jemand stirbt. Heute haben sie elfmal geläutet. Wir waren nur zu viert.", en: "I understood it now: the bells ring every time someone dies somewhere in the keep. Today they rang eleven times. There were only four of us." },
    { area: "schlund", t: ["Der Schlund", "The chasm"], de: "Tavik ist weg. Ein Faden, dünn wie Haar, hat sich um seinen Knöchel gelegt, und dann war er im Dunkel. Wir haben ihn rufen hören, lange. Dann haben wir ihn lachen hören. Das war schlimmer.", en: "Tavik is gone. A thread, thin as hair, wrapped around his ankle, and then he was in the dark. We heard him call for a long time. Then we heard him laugh. That was worse." },
    { area: "schmiede", t: ["Die Runenschmiede", "The rune forge"], de: "Hier werden keine Waffen geschmiedet. Hier werden Fäden geschmiedet. Jeder Besiegte wird zu einem Faden, und aus den Fäden wird er neu gewebt. Deshalb ist niemand hier wirklich tot. Deshalb kommen sie immer wieder.", en: "No weapons are forged here. Threads are forged here. Every defeated one becomes a thread, and from the threads he is woven anew. That's why no one here is truly dead. That's why they keep coming back." },
    { area: "zinnen", t: ["Die Zinnen", "The spires"], de: "Grete wollte den kurzen Weg nach unten nehmen. Das Seil war alt. Ich habe ihr versprochen, es aufzuschreiben, damit wenigstens jemand weiß, wie mutig sie war. Grete, du warst die Mutigste von uns.", en: "Grete wanted to take the short way down. The rope was old. I promised her I would write it down so at least someone knows how brave she was. Grete, you were the bravest of us." },
    { area: "see", t: ["Der schwarze See", "The black lake"], de: "Holm bleibt am Ufer, am alten Schrein. Er sagt, jemand muss für die beten, die nach uns kommen. Er hat mir sein Amulett gegeben. Es ist warm, obwohl alles hier kalt ist.", en: "Holm stays at the shore, by the old shrine. He says someone must pray for those who come after us. He gave me his amulet. It's warm, though everything here is cold." },
    { area: "glut", t: ["Die Glutgassen", "The ember alleys"], de: "Allein. Alle Fäden laufen in eine Richtung, nach oben, in einen Turm über dem Sturm. Dort sitzt jemand und webt. Ich habe ihre Hände gesehen, Hunderte, und jede hält einen Faden. Einer davon ist meiner.", en: "Alone. All the threads run in one direction, up, into a tower above the storm. Someone sits there, weaving. I saw her hands, hundreds of them, and each holds a thread. One of them is mine." },
    { area: "sturm", t: ["Die letzte Seite", "The last page"], de: "Wer das liest: Sie heißt die Weberin. Sie hält keinen Faden für dich, du bist noch nicht besiegt. Das macht dich gefährlich für sie. Schneide die Fäden, nicht die Menschen. Und wenn du einen roten Mann mit Hörnern triffst, der Ezekiel heißt – sag ihm, die Karte stimmt nicht. Sie hat nie gestimmt. Geh trotzdem. – Mira", en: "Whoever reads this: they call her the Weaver. She holds no thread for you, you have not been defeated. That makes you dangerous to her. Cut the threads, not the people. And if you meet a red man with horns called Ezekiel – tell him the map is wrong. It always was. Go anyway. – Mira" }
  ];
  const meta = () => { Z.meta.tagebuch = Z.meta.tagebuch || {}; return Z.meta.tagebuch; };
  const count = () => Object.keys(meta()).length;

  /* ---------- Aufbau je Gebiet ---------- */
  let page = null, signs = [], scouts = [], lvRef = null, spurPrev = 0;
  function farSpot(lv, R, pred, loose) {
    const st = lv.start || { x: 0, y: 0 }, cand = [];
    for (const k in lv.cells) {
      const c = lv.cells[k]; if (c === lv.startCell) continue;
      for (let y = c.y * CH + 1; y < c.y * CH + CH - 1; y++) for (let x = c.x * CW + 2; x < c.x * CW + CW - 2; x++)
        if (Z.standable(lv, x, y, 2) && (loose || (Z.standable(lv, x - 1, y, 2) && Z.standable(lv, x + 1, y, 2))) && (!pred || pred(x, y, c))) cand.push([x, y, c, Math.abs(x - st.x) + Math.abs(y - st.y)]);
    }
    if (!cand.length) return null;
    cand.sort((a, b) => b[3] - a[3]);
    return cand[Math.min(cand.length - 1, Math.floor(R() * Math.min(cand.length, 40)))];
  }
  function setup(lv) {
    page = null; signs = []; scouts = []; lvRef = lv;
    if (!lv || lv.hub || lv.arena || lv.passage || !lv.cells) return;
    const R = Z.Rng(((lv.seed || 9) * 69069 + 3) >>> 0);
    const used = (x, y) => (Z.spuren ? Z.spuren() : []).some(s => Math.abs(s.x - x) < 8 && Math.abs(s.y - y) < 4) || (lv.doors || []).some(d => Math.abs(d.x - x) < 4 && Math.abs(d.y - y) < 3);
    /* Tagebuchseite */
    const pi = PAGES.findIndex(p => p.area === lv.biome);
    if (pi >= 0 && !meta()[pi]) {
      const s = farSpot(lv, R, (x, y, c) => (c.kind === "side" || c.dead) && !used(x, y)) || farSpot(lv, R, (x, y) => !used(x, y));
      if (s) page = { i: pi, x: s[0], y: s[1], got: false };
    }
    /* Wegweiser vor jedem Ausgang */
    for (const d of lv.doors || []) {
      if (d.kind !== "exit") continue;
      let best = null, bd = 1e9;
      for (let i = 0; i < 400; i++) {
        const x = d.x + R.int(-22, 22), y = d.y + R.int(-8, 8);
        const dist = Math.abs(x - d.x) + Math.abs(y - d.y);
        if (dist < 8 || dist > 26 || !Z.standable(lv, x, y, 3) || used(x, y) || signs.some(s => Math.abs(s.x - x) < 6 && Math.abs(s.y - y) < 3)) continue;
        if (dist < bd) { bd = dist; best = [x, y]; }
      }
      if (best) signs.push({ x: best[0], y: best[1], to: d.to, dx: Math.sign(d.x - best[0]) || 1, dy: d.y < best[1] - 2 ? -1 : d.y > best[1] + 2 ? 1 : 0, tilt: (R() - 0.5) * 0.12 });
    }
    /* gefesselter Kundschafter: in etwa jedem dritten Gebiet */
    if (R() < 0.36) {
      const s = farSpot(lv, R, (x, y) => !used(x, y) && (lv.get(x - 1, y) === 1 || lv.get(x + 1, y) === 1) && (Z.standable(lv, x - 1, y, 2) || Z.standable(lv, x + 1, y, 2)), true);
      if (s) scouts.push({ x: s[0], y: s[1], wall: lv.get(s[0] - 1, s[1]) === 1 ? -1 : 1, freed: false, t: 0, name: R.pick(["Edda", "Fenwick", "Ilse", "Bram", "Oda", "Lorn"]) });
    }
  }
  const load0 = Z.loadArea;
  Z.loadArea = function () { const r = load0.apply(this, arguments); try { setup(Z.level); } catch (e) { console.error(e); } return r; };

  /* ---------- Lesen ---------- */
  function pageHTML(i, fresh) {
    const p = PAGES[i];
    return '<div class="tagebuch">' + '<p class="tb-kopf">' + L(["Miras Tagebuch", "Mira's Diary"]) + " · " + L(["Seite", "Page"]) + " " + (i + 1) + "/" + PAGES.length + "</p>" +
      "<h2>" + esc(L(p.t)) + "</h2>" + '<p class="tb-text">' + esc(L([p.de, p.en])) + "</p>" +
      (fresh ? '<p class="hinweis">' + L(["Gefundene Seiten: ", "Pages found: "]) + count() + "/" + PAGES.length + (count() === PAGES.length ? L([" – alle! Du kennst jetzt Miras ganze Geschichte.", " – all of them! You now know Mira's whole story."]) : "") + "</p>" : "") +
      '<div class="knoepfe"><button data-act="close" autofocus>' + L(["Weiter", "Continue"]) + "</button></div></div>";
  }
  function bookHTML() {
    const m = meta();
    let h = '<div class="tagebuch"><h2>' + L(["Miras Tagebuch", "Mira's Diary"]) + '</h2><p class="hinweis">' + count() + "/" + PAGES.length + L([" Seiten – in jedem Gebiet liegt eine.", " pages – one lies in every area."]) + '</p><div class="tb-liste">';
    PAGES.forEach((p, i) => { h += m[i] ? '<button data-act="tbSeite" data-arg="' + i + '"><b>' + (i + 1) + ".</b> " + esc(L(p.t)) + "</button>" : '<button disabled><b>' + (i + 1) + ".</b> " + esc(Z.areaName ? Z.areaName(p.area) : p.area) + " · ???</button>"; });
    return h + '</div><div class="knoepfe"><button data-act="close" autofocus>' + L(["Zurück", "Back"]) + "</button></div></div>";
  }
  Z.ui.actions.tbEingang = () => {
    Z.ui.close();
    const P = Z.player, lv = Z.level; if (!P || !lv || !lv.start) return;
    try { const log = JSON.parse(localStorage.getItem("imres-zerstoerer-steck") || "[]"); log.push({ t: Date.now(), area: lv.biome, seed: lv.seed, x: Math.round(P.x), y: Math.round(P.y) }); localStorage.setItem("imres-zerstoerer-steck", JSON.stringify(log.slice(-20))); } catch (e) {}
    /* offene Siegel und Türen freigeben, dann an den Eingang */
    if (Z.ambush && Z.ambush() && Z.ambush().state === "fight") { const a = Z.ambush(); for (const [x, y, v] of a.sealed) lv.set(x, y, v); a.sealed = []; a.state = "done"; Z.dirtyTiles && Z.dirtyTiles(); }
    P.x = lv.start.x * T + 8 - P.w / 2; P.y = (lv.start.y + 1) * T - P.h; P.vx = 0; P.vy = 0; P.iframe = Math.max(P.iframe || 0, 1.5);
    P.plunge = false; P.climbing = false; P.ledge = null; P.grabbed = null; P.diveLock = false;
    Z.cam.snap(P.x, P.y); FX.burst(P.x + P.w / 2, P.y + P.h / 2, 20, { col: ["#ffd27a", "#fff0c0"], sp: 90, life: 0.6, size: 2, kind: "spark", add: true }); A.play("holy", { vol: 0.4 });
    Z.meta.unstuck = (Z.meta.unstuck || 0) + 1; Z.saveMeta();
  };
  Z.ui.actions.tbSeite = i => { Z.ui.close(); Z.ui.open(pageHTML(+i, false).replace('data-act="close"', 'data-act="tbBuch"'), { cls: "schmal" }); };
  Z.ui.actions.tbBuch = () => { Z.ui.close(); Z.ui.open(bookHTML(), { cls: "schmal" }); };
  const pause0 = Z.ui.pause;
  Z.ui.pause = function () {
    const r = pause0.apply(this, arguments);
    const box = document.querySelector("#modal .pausenmenue .knoepfe"); /* nur ins echte Pausenmenü, nie in ein anderes offenes Fenster */
    /* Sicherheitsnetz: wer feststeckt, kehrt zum Eingang des Gebiets zurück */
    if (box && Z.run && Z.level && !Z.level.hub && !box.querySelector('[data-act="tbEingang"]')) { const b = document.createElement("button"); b.dataset.act = "tbEingang"; b.textContent = "⟲ " + L(["Festgesteckt? Zurück zum Eingang", "Stuck? Back to the entrance"]); const ab = box.querySelector('[data-act="abort"]'); box.insertBefore(b, ab || null); }
    if (box && count() > 0 && !box.querySelector('[data-act="tbBuch"]')) { const b = document.createElement("button"); b.dataset.act = "tbBuch"; b.textContent = "📜 " + L(["Miras Tagebuch", "Mira's Diary"]) + " (" + count() + "/" + PAGES.length + ")"; box.insertBefore(b, box.children[1] || null); }
    return r;
  };

  /* ---------- Spielablauf ---------- */
  const tick0 = Z.ebenenTick;
  Z.ebenenTick = function (dt) {
    if (tick0) tick0(dt);
    /* gelesene Spuren dauerhaft mitzählen (für den Erfolg „Spurenleser“) */
    if (Z.stats) { const n = Z.stats.spuren || 0; if (n > spurPrev) { Z.meta.spuren = (Z.meta.spuren || 0) + (n - spurPrev); } spurPrev = n; }
    const P = Z.player; if (!P || P.dead || Z.level !== lvRef) return;
    const px = P.x + P.w / 2, py = P.y + P.h;
    if (page && !page.got && Math.abs(page.x * T + 8 - px) < 14 && Math.abs((page.y + 1) * T - py) < 18) {
      page.got = true; meta()[page.i] = 1; Z.saveMeta();
      A.play("scroll", { vol: 0.7 }); FX.burst(page.x * T + 8, (page.y + 1) * T - 8, 16, { col: ["#f0e0b0", "#ffd27a"], sp: 70, up: 40, life: 0.8, size: 1.8, kind: "spark", add: true });
      if (count() === PAGES.length && !Z.meta.tbBonus) { Z.meta.tbBonus = 1; Z.dropShards(px, P.y, 60); Z.saveMeta(); }
      /* kein Fenster mitten im Lauf: kurze Pergament-Meldung, lesen im Pausenmenü („Miras Tagebuch“) */
      const pg = PAGES[page.i], txt = L([pg.de, pg.en]), teaser = txt.length > 96 ? txt.slice(0, 92).replace(/\s+\S*$/, "") + " …" : txt;
      const pk = Z.ui.key ? Z.ui.key("pause") : "";
      Z.ui.notify("<b>" + esc(L(["Miras Tagebuch", "Mira's Diary"])) + " · " + (page.i + 1) + "/" + PAGES.length + ": " + esc(L(pg.t)) + "</b><br><small>„" + esc(teaser) + "“ — " + L(["ganz lesen: Pause", "read it all: pause"]) + (pk ? " " + pk : "") + (count() === PAGES.length ? " · " + L(["alle Seiten gefunden!", "all pages found!"]) : "") + "</small>", { prio: 2, art: "pergament", icon: "📜", dauer: 6500 });
    }
    for (const s of scouts) {
      if (s.freed) { s.t += dt; continue; }
      const near = Math.abs(s.x * T + 8 - px) < 24 && Math.abs((s.y + 1) * T - py) < 20;
      s.near = near;
      if (near && inp.pressed.use && !(Z.ui.modalOpen || Z.ui.choiceActive)) {
        inp.consume("use"); s.freed = true; s.t = 0;
        A.play("chain", { vol: 0.8 }); A.play("door", { vol: 0.3, rate: 1.5 });
        FX.burst(s.x * T + 8, (s.y + 1) * T - 10, 14, { col: ["#9a8a7a", "#5a4a40"], sp: 120, life: 0.5, size: 2.2, kind: "shard", g: 500 });
        const lv = Z.level; if (Z.explored) for (let i = 0; i < Z.explored.length; i++) Z.explored[i] = 1;
        for (const k in lv.cells) Z.fogSeen && Z.fogSeen().add(k);
        P.potions = Math.min(P.potMax || 2, (P.potions || 0) + 1);
        Z.ui.say(s.x * T + 8, s.y * T - 18, s.name, L(Z.R.pick([["Danke! Hier – meine Karte. Und ein Trank, ich brauch ihn nicht mehr.", "Thank you! Here – my map. And a potion, I won't need it."], ["Die Ausgänge? Ich hab sie alle eingezeichnet. Nimm die Karte, ich nehm die Beine in die Hand.", "The exits? I marked them all. Take the map, I'm taking to my heels."], ["Mira war hier, vor Wochen. Sie hat nach oben gewollt. Viel Glück.", "Mira was here, weeks ago. She wanted to go up. Good luck."]])), 4600);
        Z.ui.notify("<b>" + L(["Karte des Gebiets aufgedeckt", "Area map revealed"]) + "</b><small> · " + L(["+1 Heiltrank", "+1 healing potion"]) + "</small>", { prio: 1, art: "gold", ort: "welt", x: s.x * T + 8, y: s.y * T - 30, dauer: 2600 });
        if (Z.stats) Z.stats.befreit = (Z.stats.befreit || 0) + 1; Z.meta.befreit = (Z.meta.befreit || 0) + 1; Z.saveMeta();
      }
    }
  };

  /* ---------- Zeichnen ---------- */
  function drawPage(c, t) {
    if (!page || page.got) return;
    const x = page.x * T + 8, gy = (page.y + 1) * T, bob = Math.sin(t * 2.2) * 1.5;
    /* Lesepult */
    c.fillStyle = "#4a3020"; c.fillRect(x - 1, gy - 12, 2, 12); c.fillRect(x - 5, gy - 1.5, 10, 1.5);
    c.save(); c.translate(x, gy - 13); c.rotate(-0.35); c.fillStyle = "#5a3a24"; c.fillRect(-8, -1, 16, 3); c.restore();
    /* Seite */
    c.save(); c.translate(x, gy - 18 + bob); c.rotate(-0.3 + Math.sin(t * 1.3) * 0.05);
    c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(0, 0, 0, 0, 0, 16); g.addColorStop(0, "rgba(255,220,150,.45)"); g.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill(); c.restore();
    c.fillStyle = "#e8dcb8"; c.beginPath(); c.moveTo(-6, -4); c.lineTo(6, -5); c.lineTo(6.5, 4); c.lineTo(-5.5, 5); c.closePath(); c.fill();
    c.fillStyle = "#c8b890"; c.beginPath(); c.moveTo(6, -5); c.lineTo(6.5, 4); c.lineTo(4, 2); c.fill();
    c.fillStyle = "#6a4a2a"; for (let k = 0; k < 4; k++) c.fillRect(-4, -2.5 + k * 1.8, 7 - (k === 3 ? 3 : 0), 0.5);
    c.restore();
    if (Math.random() < 0.05) FX.p({ x: x + (Math.random() - 0.5) * 10, y: gy - 20, vx: 0, vy: -12, life: 1, size: 1.2, col: "#ffd27a", kind: "glow", add: true });
  }
  function drawSign(c, s) {
    const x = s.x * T + 8, gy = (s.y + 1) * T;
    c.save(); c.translate(x, gy); c.rotate(s.tilt);
    c.fillStyle = "#4a3020"; c.fillRect(-1.2, -24, 2.4, 24);
    c.fillStyle = "#3a2618"; c.fillRect(-3, -2, 6, 2);
    const txt = Z.areaName ? Z.areaName(s.to) : s.to;
    c.font = "700 6px 'Alegreya Sans',sans-serif"; const w = Math.max(30, c.measureText(txt).width + 12);
    const bx = s.dx > 0 ? -2 : -w + 2;
    c.fillStyle = "#7a5634"; c.beginPath();
    if (s.dx > 0) { c.moveTo(bx, -26); c.lineTo(bx + w - 5, -26); c.lineTo(bx + w, -21.5); c.lineTo(bx + w - 5, -17); c.lineTo(bx, -17); }
    else { c.moveTo(bx + w, -26); c.lineTo(bx + 5, -26); c.lineTo(bx, -21.5); c.lineTo(bx + 5, -17); c.lineTo(bx + w, -17); }
    c.closePath(); c.fill();
    c.strokeStyle = "#3a2414"; c.lineWidth = 0.6; c.stroke();
    c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(bx + 2, -25.5, w - 6, 1);
    c.fillStyle = "#f0dcb0"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, bx + w / 2 + (s.dx > 0 ? -2 : 2), -21.3);
    if (s.dy) { c.fillStyle = "#f0dcb0"; const ax = bx + (s.dx > 0 ? w - 9 : 9); c.beginPath(); if (s.dy < 0) { c.moveTo(ax - 2, -29); c.lineTo(ax + 2, -29); c.lineTo(ax, -32); } else { c.moveTo(ax - 2, -14); c.lineTo(ax + 2, -14); c.lineTo(ax, -11); } c.fill(); }
    c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(0, -21.5, 0.8, 0, TAU); c.fill();
    c.restore();
  }
  function drawScout(c, s, t) {
    const x = s.x * T + 8, gy = (s.y + 1) * T, f = -s.wall;
    if (!s.freed) {
      /* Ketten zur Wand */
      c.strokeStyle = "#6a625c"; c.lineWidth = 0.8; c.setLineDash([1.5, 1]);
      c.beginPath(); c.moveTo(x - f * 3, gy - 14); c.quadraticCurveTo(x - f * 8, gy - 10, x - f * 12, gy - 22); c.stroke();
      c.beginPath(); c.moveTo(x + f * 1, gy - 13); c.quadraticCurveTo(x - f * 6, gy - 6, x - f * 12, gy - 18); c.stroke(); c.setLineDash([]);
      c.fillStyle = "#4a4440"; c.fillRect(x - f * 12 - 1.5, gy - 24, 3, 3); c.fillRect(x - f * 12 - 1.5, gy - 20, 3, 3);
      /* kniende Gestalt */
      const sway = Math.sin(t * 1.5 + s.x) * 0.5;
      c.fillStyle = "#6a5a48"; c.beginPath(); c.moveTo(x - 4, gy); c.lineTo(x - 3.5, gy - 11 + sway); c.lineTo(x + 3.5, gy - 11 + sway); c.lineTo(x + 5, gy); c.fill();
      c.fillStyle = "#4a3a2e"; c.fillRect(x - 5, gy - 3, 10, 3);
      c.fillStyle = "#d8b49a"; c.beginPath(); c.arc(x + f * 0.5, gy - 13.5 + sway, 2.6, 0, TAU); c.fill();
      c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(x + f * 0.5, gy - 14.5 + sway, 2.8, Math.PI, 0); c.fill();
      c.strokeStyle = "#d8b49a"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 2, gy - 9); c.lineTo(x - f * 3, gy - 14); c.moveTo(x + 2, gy - 9); c.lineTo(x + f * 1, gy - 13); c.stroke();
      c.fillStyle = "#c8b890"; c.save(); c.translate(x + f * 6, gy - 1); c.rotate(0.3); c.fillRect(-3, -2, 6, 4); c.restore(); /* zusammengerollte Karte */
      if (s.near) {
        /* gleicher Benutzen-Hinweis wie überall (Eisenplakette mit Tastenkappe) */
        if (Z.ui.worldLabel) Z.ui.worldLabel("kundschafter" + s.x, { x, y: gy - 24, html: (Z.ui.key("use") || "✋") + " " + esc(L(["Befreien", "Free"])), jetzt: true });
      } else if (Math.sin(t * 0.7 + s.x) > 0.95) { c.font = "italic 6px 'Alegreya Sans',sans-serif"; c.textAlign = "center"; c.fillStyle = "rgba(232,216,200,.8)"; c.fillText(L(["Hilfe …", "Help…"]), x, gy - 22); }
    } else if (s.t < 4) {
      /* läuft davon */
      const run = s.t * 70, a = Math.max(0, 1 - s.t / 4);
      c.globalAlpha = a; c.fillStyle = "#6a5a48"; const rx = x + f * run; c.fillRect(rx - 3, gy - 14, 6, 10);
      c.fillStyle = "#d8b49a"; c.beginPath(); c.arc(rx, gy - 16, 2.6, 0, TAU); c.fill();
      c.strokeStyle = "#4a3a2e"; c.lineWidth = 1.4; const k = Math.sin(s.t * 18) * 3; c.beginPath(); c.moveTo(rx, gy - 4); c.lineTo(rx + k, gy); c.moveTo(rx, gy - 4); c.lineTo(rx - k, gy); c.stroke();
      c.globalAlpha = 1;
    }
  }
  const dwp0 = Z.drawWorldProps;
  Z.drawWorldProps = function (c, t) {
    if (dwp0) dwp0.apply(this, arguments);
    if (Z.level !== lvRef) return;
    /* Wegweiser nur im Bild zeichnen (große Karten, Text je Bild) */
    const cam = Z.cam;
    for (const s of signs) { const x = s.x * T + 8, y = (s.y + 1) * T; if (x < cam.x - 90 || x > cam.x + cam.w + 90 || y < cam.y - 10 || y > cam.y + cam.h + 50) continue; drawSign(c, s); }
    for (const s of scouts) drawScout(c, s, t);
    drawPage(c, t);
  };
  /* ---------- Barradins Fundbuch: die Vorgänger ---------- */
  const GROUP = [
    { id: "mira", n: "Mira", r: ["Kartenzeichnerin", "Cartographer"], page: 12, col: "#c8a060", hair: "#6a3a1a",
      fate: ["Ging allein weiter, den Fäden nach – zur Weberin.", "Went on alone, following the threads – to the Weaver."], bar: ["„Eine Frau, die Karten von Orten zeichnet, die sich bewegen. Respekt. Oder Wahnsinn.“", "“A woman who maps places that move. Respect. Or madness.”"] },
    { id: "holm", n: "Bruder Holm", r: ["Priester", "Priest"], page: 10, col: "#d8d0bc", hair: "#8a8a80",
      fate: ["Blieb am Schrein des schwarzen Sees, um für die zu beten, die nach ihnen kommen.", "Stayed at the black lake's shrine to pray for those who come after."], bar: ["„Betet für uns? Sehr nett. Ich hätte lieber seinen Heiltrank.“", "“Praying for us? Very kind. I'd rather have his potion.”"] },
    { id: "tavik", n: "Tavik", r: ["Dieb", "Thief"], page: 7, col: "#5a4a3a", hair: "#2a1a10",
      fate: ["Von einem Faden in den Schlund gezogen. Man hörte ihn lachen.", "Pulled into the chasm by a thread. He was heard laughing."], bar: ["„Ein Dieb, der von einem Faden geklaut wurde. Das schreibt sich selbst.“", "“A thief stolen by a thread. It writes itself.”"] },
    { id: "grete", n: "Grete", r: ["Zwergenkriegerin", "Dwarf warrior"], page: 9, col: "#8a3a2a", hair: "#c86a2a",
      fate: ["Nahm auf den Zinnen den kurzen Weg nach unten. Die Mutigste von allen.", "Took the short way down on the spires. The bravest of them all."], bar: ["„Ich schreibe ihr eine Ballade. Eine kurze. Mit einem langen Fall.“", "“I'll write her a ballad. A short one. With a long fall.”"] }
  ];
  function portrait(cv, g, known) {
    const c = cv.getContext("2d"); c.scale(2, 2); const W = cv.width / 2, H = cv.height / 2;
    c.fillStyle = "#2a1e1a"; c.fillRect(0, 0, W, H); c.fillStyle = "#8a6a2a"; c.lineWidth = 3; c.strokeStyle = "#8a6a2a"; c.strokeRect(1.5, 1.5, W - 3, H - 3);
    if (!known) { c.fillStyle = "#4a3a34"; c.font = "700 20px serif"; c.textAlign = "center"; c.fillText("?", W / 2, H / 2 + 7); return; }
    c.fillStyle = g.col; c.beginPath(); c.moveTo(6, H); c.quadraticCurveTo(W / 2, H - 22, W - 6, H); c.fill();
    c.fillStyle = "#d8b49a"; c.beginPath(); c.ellipse(W / 2, H / 2 - 2, 9, 11, 0, 0, TAU); c.fill();
    c.fillStyle = g.hair; c.beginPath(); c.ellipse(W / 2, H / 2 - 9, 10, 6, 0, Math.PI, 0); c.fill();
    if (g.id === "grete") { c.fillStyle = g.hair; c.beginPath(); c.moveTo(W / 2 - 8, H / 2 + 2); c.quadraticCurveTo(W / 2, H / 2 + 18, W / 2 + 8, H / 2 + 2); c.fill(); c.fillStyle = "#7a7a80"; c.beginPath(); c.arc(W / 2, H / 2 - 9, 10, Math.PI, 0); c.fill(); }
    if (g.id === "holm") { c.fillStyle = "#c8c0b0"; c.beginPath(); c.arc(W / 2, H / 2 - 4, 11, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(W / 2 + 9, H / 2 + 12); c.lineTo(W / 2 - 9, H / 2 + 12); c.fill(); c.fillStyle = "#d8b49a"; c.beginPath(); c.ellipse(W / 2, H / 2 - 1, 7, 9, 0, 0, TAU); c.fill(); }
    if (g.id === "tavik") { c.fillStyle = "#2a2018"; c.fillRect(W / 2 - 9, H / 2 - 5, 18, 3); }
    if (g.id === "mira") { c.fillStyle = "#e8dcb8"; c.fillRect(W - 16, H - 16, 10, 8); c.fillStyle = "#6a4a2a"; c.fillRect(W - 15, H - 14, 8, 0.8); c.fillRect(W - 15, H - 12, 6, 0.8); }
    c.fillStyle = "#1a1014"; c.fillRect(W / 2 - 4, H / 2 - 3, 2, 2); c.fillRect(W / 2 + 2, H / 2 - 3, 2, 2);
    c.strokeStyle = "#6a3a2a"; c.lineWidth = 1; c.beginPath(); c.arc(W / 2, H / 2 + 3, 3, 0.3, Math.PI - 0.3); c.stroke();
  }
  function groupHTML() {
    const m = meta();
    /* dieselben Reiter wie im Fundbuch, damit man mit LB/RB (oder Q/O) weiterblättern kann */
    const tabs = L(Z.TX && Z.TX.tabsCodex || [[], []]);
    let h = '<h2>' + L(["Die Vorgänger", "Those who came before"]) + '</h2><div class="reiter">' + tabs.map((x, i) => '<button data-act="codexTab" data-arg="' + i + '">' + esc(x) + "</button>").join("") + '<button data-act="tbGruppe" class="an">' + L(["Die Vorgänger", "Before us"]) + '</button></div><p class="hinweis">' + L(["Barradin hat Miras Seiten abgeschrieben. Wer vor uns in der Feste war:", "Barradin copied Mira's pages. Who entered the keep before us:"]) + '</p><div class="vorg">';
    for (const g of GROUP) {
      const known = !!m[g.page];
      h += '<div class="vg"><canvas width="112" height="128" data-g="' + g.id + '" data-k="' + (known ? 1 : 0) + '"></canvas><div><b>' + (known || count() > 0 ? esc(g.n) : "???") + "</b> <small>" + esc(L(g.r)) + "</small><p>" + (known ? esc(L(g.fate)) : L(["Ihr Schicksal steht auf einer Seite, die noch fehlt.", "Their fate is written on a page still missing."])) + "</p>" + (known ? '<p class="bar">' + esc(L(g.bar)) + "</p>" : "") + "</div></div>";
    }
    return h + '</div><div class="knoepfe"><button data-act="tbBuch">📜 ' + L(["Tagebuch lesen", "Read the diary"]) + '</button><button data-act="tbCodex" autofocus>' + L(["Zurück", "Back"]) + "</button></div>";
  }
  Z.ui.actions.tbGruppe = () => { Z.ui.close(); Z.ui.open(groupHTML(), { cls: "breit" }); document.querySelectorAll("#modal canvas[data-g]").forEach(cv => portrait(cv, GROUP.find(g => g.id === cv.dataset.g), cv.dataset.k === "1")); };
  Z.ui.actions.tbCodex = () => { Z.ui.close(); Z.ui.codex(); };
  const codex0 = Z.ui.codex;
  Z.ui.codex = function () {
    const r = codex0.apply(this, arguments);
    const tabs = document.querySelector("#modal .reiter");
    if (tabs && !tabs.querySelector('[data-act="tbGruppe"]')) { const b = document.createElement("button"); b.dataset.act = "tbGruppe"; b.textContent = L(["Die Vorgänger", "Before us"]); tabs.appendChild(b); }
    return r;
  };
  /* Seite und Kundschafter auf der Karte */
  Z.tagebuch = { pages: PAGES, count, page: () => page, signs: () => signs, scouts: () => scouts };
})();
