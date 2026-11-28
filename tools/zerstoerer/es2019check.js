#!/usr/bin/env node
/* W39 Alt: Prüft, ob Ezekiel – The Destroyer auf alten Engines (Chromium 77, Handhelds) startet.
   1. Syntax: alle zerstoerer/*.js, die Inline-Skripte aus zerstoerer.html, tonregler.js und altcss.js werden mit acorn
      als ECMAScript 2019 geparst (kein ?., kein ??, keine Klassenfelder, kein numerischer Trenner …). Fehler → Ausgang 1.
   2. Hinweise (kein Fehler): Laufzeit-APIs, die Chromium 77 nicht kennt (replaceAll, Object.hasOwn, structuredClone, findLast,
      Promise.any, WeakRef, AbortSignal.timeout, replaceChildren, randomUUID …), wenn sie ohne erkennbare Absicherung vorkommen.
   acorn fehlt → Hinweis und Ausgang 0 (sauber übersprungen). Suche: normales require, dann ACORN_PFAD (Ordner mit node_modules).
   Aufruf:  node tools/zerstoerer/es2019check.js [--streng]   (--streng: Hinweise zählen als Fehler)
   Läuft in den Schnelltests (tools/zerstoerer/tests/schnell.py, Workflow zerstoerer-test.yml); fehlt acorn dort, ist das ein Fehler. */
"use strict";
const fs = require("fs"), path = require("path");
const WURZEL = path.resolve(__dirname, "..", "..");
let acorn = null;
for (const ort of [null, process.env.ACORN_PFAD, path.join(WURZEL, "node_modules")]) {
  try { acorn = ort ? require(require.resolve("acorn", { paths: [ort] })) : require("acorn"); break; } catch (_) { /* weiter suchen */ }
}
const streng = process.argv.includes("--streng");

/* Dateien sammeln */
const quellen = [];
const zd = path.join(WURZEL, "zerstoerer");
for (const f of fs.readdirSync(zd).sort()) if (f.endsWith(".js")) quellen.push({ name: "zerstoerer/" + f, text: fs.readFileSync(path.join(zd, f), "utf8") });
for (const f of ["tonregler.js", "altcss.js"]) { const p = path.join(WURZEL, f); if (fs.existsSync(p)) quellen.push({ name: f, text: fs.readFileSync(p, "utf8") }); }
const html = fs.readFileSync(path.join(WURZEL, "zerstoerer.html"), "utf8");
{ const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m, n = 0;
  while ((m = re.exec(html))) { n++; const zeile = html.slice(0, m.index).split("\n").length; quellen.push({ name: "zerstoerer.html#inline" + n + " (Zeile " + zeile + ")", text: m[1], versatz: zeile - 1 }); } }

let fehler = 0, hinweise = 0;
/* 1. Syntax */
if (!acorn) console.log("acorn nicht gefunden – Syntaxprüfung übersprungen (npm i acorn, oder ACORN_PFAD=<ordner> setzen).");
else for (const q of quellen) {
  try { acorn.parse(q.text, { ecmaVersion: 2019, sourceType: "script" }); }
  catch (e) { fehler++; const z = e.loc ? e.loc.line + (q.versatz || 0) : "?"; console.log("FEHLER  " + q.name + ":" + z + "  " + e.message); }
}
/* 2. Laufzeit-APIs (grob, textbasiert; abgesichert = im selben Ausdruck geprüft, z. B. „c.roundRect ? c.roundRect(…)“) */
const APIS = [
  [/\.replaceAll\(/, "String.prototype.replaceAll (Chrome 85)"], [/\bObject\.hasOwn\(/, "Object.hasOwn (93)"], [/\bstructuredClone\(/, "structuredClone (98)"],
  [/\.findLast(Index)?\(/, "Array.prototype.findLast (97)"], [/\bPromise\.any\(/, "Promise.any (85)"], [/\bnew WeakRef\(/, "WeakRef (84)"],
  [/\bAbortSignal\.timeout\(/, "AbortSignal.timeout (103)"], [/\.replaceChildren\(/, "Element.replaceChildren (86)"], [/\.randomUUID\(/, "crypto.randomUUID (92)"],
  [/\.toSorted\(|\.toReversed\(|\.toSpliced\(/, "Array-Kopiermethoden (110)"], [/\bObject\.groupBy\(|\bMap\.groupBy\(/, "groupBy (117)"],
  [/\.roundRect\(/, "CanvasRenderingContext2D.roundRect (99)"], [/\.checkVisibility\(/, "Element.checkVisibility (105)"],
  [/\brequestIdleCallback\(/, "requestIdleCallback (ok ab 47, fehlt in Safari)"]
];
for (const q of quellen) {
  const zeilen = q.text.split("\n");
  zeilen.forEach((z, i) => {
    for (const [re, was] of APIS) {
      if (!re.test(z)) continue;
      const name = (re.source.match(/[A-Za-z]{4,}/) || [""])[0];
      /* einfache Absicherung: derselbe Name wird in der Zeile vorher abgefragt (x.name ? / if (x.name) / typeof … / || Ersatz) */
      if (name && new RegExp("(\\." + name + "\\s*[?&|)]|typeof[^;]*" + name + "|\\b" + name + "\\s*\\|\\|)").test(z)) continue;
      hinweise++; console.log("HINWEIS " + q.name + ":" + (i + 1 + (q.versatz || 0)) + "  " + was + "  │ " + z.trim().slice(0, 110));
    }
  });
}
console.log((acorn ? quellen.length + " Quellen als ES2019 geprüft" : "Syntax nicht geprüft") + " · Fehler " + fehler + " · Hinweise " + hinweise);
process.exit(fehler || (streng && hinweise) ? 1 : 0);
