#!/usr/bin/env node
/* Prüft Liederdateien für die Bühne von imrestales.de
   Aufruf: node pruefen.js datei1.js [datei2.js …]   (jede Datei: module.exports = { stimmung: [stück, …], … })
   Fehler (✗) müssen weg, Hinweise (·) sind musikalische Warnungen. */
const path = require("path");
const MODI = { dorisch: [0, 2, 3, 5, 7, 9, 10], mixolydisch: [0, 2, 4, 5, 7, 9, 10], aeolisch: [0, 2, 3, 5, 7, 8, 10], phrygisch: [0, 1, 3, 5, 7, 8, 10], ionisch: [0, 2, 4, 5, 7, 9, 11], lydisch: [0, 2, 4, 6, 7, 9, 11] };
const INSTRUMENTE = ["laute", "harfe", "mandoline", "fidel", "drehleier", "schalmei", "dudelsack", "glocken", "illusion", "hackbrett", "cembalo", "akkordeon", "sitar", "handpan", "psalter", "zither", "balafon"];
const BAND = { trommel: ["trommel", "pauke", "bodhran", "tamburin", "stoecke", "taiko", "marsch", "bongos", "conga", "darbuka"],
  floete: ["floete", "panfloete", "okarina", "gesang", "horn", "klarinette", "oboe", "blockfloete", "piccolo", "pfeife", "shakuhachi", "englischhorn", "oohchor", "bratsche"],
  ketten: ["ketten", "klatschen", "schnipsen", "rassel", "stampfen", "loeffel", "krug", "rahmentrommel", "kriegstrommel", "schellen", "triangel", "schlitztrommel", "windspiel"] };
const SCHLAG = ["keiner", "ruhig", "sanft", "tanz", "marsch", "treibend", "schleichend", "walzer", "jig", "kampf", "boss", "verfolgung", "spannung", "reiter", "sieg", "markt"];
const BASS = ["puls", "viertel", "halbe", "galopp", "orgel"];
const STIMMUNGEN = ["kampf", "boss", "verfolgung", "spannung", "grusel", "unterreich", "ruinen", "reise", "reiter", "heldenlied", "sieg", "rast", "trinklied", "kamin", "klage", "auenland",
  "elben", "fey", "zwerge", "dorffest", "marktplatz", "hof", "shanty", "pilger", "heimweh", "letztesgefecht", "kriegstrommeln", "gaukler", "sternenhimmel"];
const DUESTER = ["grusel", "unterreich", "ruinen", "boss", "spannung", "verfolgung", "letztesgefecht", "kriegstrommeln", "klage"];
const FL = ["", "lang", "terz", "echo", "fern"];
let fehler = 0, hinweise = 0; const alleRefrains = new Map();
const F = (wo, t) => { fehler++; console.log("  ✗ " + wo + ": " + t); }, H = (wo, t) => { hinweise++; console.log("  · " + wo + ": " + t); };
const noten = (str, n) => { const a = []; for (let i = 0; i < n; i++) { const c = str[i]; a.push(c === undefined || c === "." ? -1 : parseInt(c, 36)); } return a; };
function zeile(wo, str, n, leerOk) {
  if (typeof str !== "string") { F(wo, "Melodie muss ein Text sein"); return null; }
  if (str === "" && leerOk) return noten("", n);
  if (str.length !== n) F(wo, "Melodie hat " + str.length + " Zeichen, erwartet " + n);
  if (!/^[0-9a-e.]*$/.test(str)) F(wo, "nur 0–9, a–e und . erlaubt: " + str);
  const a = noten(str, n); if (!leerOk && a.every(x => x < 0)) F(wo, "Takt ohne Töne");
  return a;
}
function akk(wo, s, n) { if (typeof s !== "string" || s.length !== n / 4 || !/^[0-6]+$/.test(s)) { F(wo, "Akkorde: " + (n / 4) + " Ziffern 0–6, z. B. " + (n === 12 ? '"044"' : '"0044"') + " – ist " + JSON.stringify(s)); return null; } return s.split("").map(Number); }
const akkTon = (c, d) => [c, (c + 2) % 7, (c + 4) % 7].includes(((d % 7) + 7) % 7);
function stueck(k, t, nr, datei) {
  const wo0 = k + "#" + (nr + 1) + (t && t.titel ? " „" + t.titel + "“" : "");
  if (!t || typeof t !== "object") { F(wo0, "kein Objekt"); return; }
  if (!t.titel) F(wo0, "titel fehlt");
  if (!MODI[t.modus]) F(wo0, "modus muss einer sein von " + Object.keys(MODI).join(", "));
  const n = t.takt === 12 ? 12 : 16; if (t.takt != null && t.takt !== 12 && t.takt !== 16) F(wo0, "takt nur 12 oder 16");
  if (t.instrument != null && !INSTRUMENTE.includes(t.instrument)) F(wo0, "instrument unbekannt: " + t.instrument);
  if (t.band != null) { if (typeof t.band !== "object") F(wo0, "band muss Objekt sein"); else Object.keys(t.band).forEach(x => { if (!BAND[x]) F(wo0, "band." + x + " gibt es nicht"); else if (!BAND[x].includes(t.band[x])) F(wo0, "band." + x + " unbekannt: " + t.band[x]); }); }
  if (t.schlag != null && !SCHLAG.includes(t.schlag)) F(wo0, "schlag unbekannt: " + t.schlag);
  if (t.schlag == null) H(wo0, "kein schlag angegeben (Standard: sanft)");
  if (t.bass != null) { const b = typeof t.bass === "string" ? { x: t.bass } : t.bass; Object.keys(b).forEach(r => { if (typeof t.bass === "object" && !"isrbh".includes(r)) F(wo0, "bass-Rolle " + r + " gibt es nicht (i s r b h)"); if (!BASS.includes(b[r])) F(wo0, "bass unbekannt: " + b[r]); }); }
  if (t.tempo != null && !(t.tempo >= 40 && t.tempo <= 190)) F(wo0, "tempo 40–190");
  if (n === 12 && t.schlag && !["walzer", "jig", "keiner", "ruhig"].includes(t.schlag)) H(wo0, "12er-Takt mit schlag „" + t.schlag + "“ – walzer oder jig passen besser");
  const teile = [["intro", 1], ["strophe", 4], ["refrain", 4], ["bruecke", 2]];
  if (t.refrain2) teile.push(["refrain2", 4]);
  const takte = {};
  for (const [name, anz] of teile) {
    const tt = name === "intro" ? [t.intro] : t[name];
    if (!Array.isArray(tt) || tt.length !== anz || (name === "intro" && !Array.isArray(t.intro))) { F(wo0, name + ": " + anz + " Takt(e) als [akkorde, melodie, zweitstimme?] erwartet"); continue; }
    takte[name] = tt.map((b, i) => {
      const wo = wo0 + " " + name + (anz > 1 ? " " + (i + 1) : "");
      if (!Array.isArray(b) || b.length < 2 || b.length > 3) { F(wo, "Takt muss [akkorde, melodie] oder [akkorde, melodie, zweitstimme] sein"); return null; }
      const c = akk(wo, b[0], n), m = zeile(wo, b[1], n, name === "intro");
      if (b[2] != null && !FL.includes(b[2])) zeile(wo + " (Zweitstimme)", b[2], n, false);
      return c && m ? { c, m } : null;
    });
  }
  if (t.schluss != null) { const c = Array.isArray(t.schluss) && akk(wo0 + " schluss", t.schluss[0], n), m = Array.isArray(t.schluss) && zeile(wo0 + " schluss", t.schluss[1], n, false); if (c && m) takte.schluss = [{ c, m }]; }
  /* Musik */
  const duester = DUESTER.includes(k);
  let stark = 0, passt = 0, spruenge = 0, toene = 0, alle = [];
  ["strophe", "refrain", "bruecke", "refrain2", "schluss"].forEach(name => (takte[name] || []).forEach(b => { if (!b) return;
    let vor = null;
    b.m.forEach((x, i) => { if (x < 0) return; toene++; alle.push(x); if (i % 4 === 0) { stark++; if (akkTon(b.c[Math.floor(i / 4)], x)) passt++; } if (vor != null && Math.abs(x - vor) > 7) spruenge++; vor = x; });
  }));
  const quote = stark ? passt / stark : 1;
  if (quote < (duester ? .45 : .6)) H(wo0, "nur " + Math.round(quote * 100) + " % der betonten Töne sind Akkordtöne" + (duester ? " (düster ok ab 45 %)" : " (ab 60 % klingt es sauber)"));
  if (spruenge > 3) H(wo0, spruenge + " Sprünge größer als eine Oktave");
  const mittel = l => { const a = []; (l || []).forEach(b => b && b.m.forEach(x => { if (x >= 0) a.push(x); })); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; };
  if (takte.refrain && takte.strophe && mittel(takte.refrain) < mittel(takte.strophe) - .3) H(wo0, "Refrain liegt tiefer als die Strophe – ein Refrain wirkt meist stärker, wenn er etwas höher steigt");
  if (takte.refrain && takte.refrain[0] && takte.refrain[2]) { const a = takte.refrain[0].m, b = takte.refrain[2].m; let g = 0, z = 0; a.forEach((x, i) => { if (x >= 0 || b[i] >= 0) { z++; if (x === b[i]) g++; } }); if (z && g / z < .4) H(wo0, "Refrain-Takt 1 und 3 haben wenig gemeinsam – ein wiederkehrendes Motiv macht den Refrain einprägsam"); }
  const ende = takte.schluss ? takte.schluss[0] : takte.refrain && takte.refrain[3];
  if (ende) { const letzt = [...ende.m].reverse().find(x => x >= 0); if (ende.c[ende.c.length - 1] !== 0) H(wo0, "Schluss endet nicht auf dem Grundakkord (0)"); if (letzt != null && letzt % 7 !== 0 && !duester) H(wo0, "letzter Ton ist nicht der Grundton (0, 7 oder e)"); }
  if (alle.length && Math.max(...alle) - Math.min(...alle) < 5) H(wo0, "Melodie bewegt sich kaum (Umfang < 5 Stufen)");
  /* Doppelte */
  if (takte.refrain && takte.refrain.every(Boolean)) {
    const sig = takte.refrain.map(b => b.m.join(",")).join("|"), wer = k + "#" + (nr + 1) + " (" + path.basename(datei) + ")";
    if (alleRefrains.has(sig)) F(wo0, "gleicher Refrain wie " + alleRefrains.get(sig)); else alleRefrains.set(sig, wer);
    const kopf = takte.refrain[0].m.join(",");
    for (const [s2, w2] of alleRefrains) if (s2 !== sig && s2.split("|")[0] === kopf) { H(wo0, "erster Refrain-Takt identisch mit " + w2); break; }
  }
  return toene;
}
const dateien = process.argv.slice(2); if (!dateien.length) { console.log("Aufruf: node pruefen.js datei.js …"); process.exit(1); }
const zaehl = {};
for (const d of dateien) {
  let m; try { delete require.cache[path.resolve(d)]; m = require(path.resolve(d)); } catch (e) { console.log("✗ " + d + " lässt sich nicht laden: " + e.message); fehler++; continue; }
  console.log("== " + d);
  Object.keys(m).forEach(k => {
    if (!STIMMUNGEN.includes(k)) { F(k, "unbekannte Stimmung (erlaubt: " + STIMMUNGEN.join(", ") + ")"); return; }
    if (!Array.isArray(m[k])) { F(k, "muss eine Liste von Stücken sein"); return; }
    m[k].forEach((t, i) => stueck(k, t, i, d)); zaehl[k] = (zaehl[k] || 0) + m[k].length;
  });
}
console.log("\nStücke je Stimmung: " + Object.entries(zaehl).map(([k, v]) => k + " " + v).join(", "));
console.log(fehler ? "✗ " + fehler + " Fehler, " + hinweise + " Hinweise" : "✓ keine Fehler, " + hinweise + " Hinweise");
process.exit(fehler ? 1 : 0);
