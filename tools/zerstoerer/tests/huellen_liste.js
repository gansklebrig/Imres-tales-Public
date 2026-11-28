#!/usr/bin/env node
/* Übersicht der Hüllen-Ketten im Spiel (W48 Ordnung): für jede Funktion Z.<name>, die Module mit
   „const x = Z.<name>; … Z.<name> = function …“ einhüllen, die Fundstellen in Ladereihenfolge (laut zerstoerer.html).
   Außerdem die Außenschichten über Z.haken.aussen/vor/nach. Nur zum Nachsehen – kein Test, ändert nichts.
   Aufruf: node tools/zerstoerer/tests/huellen_liste.js [mindestanzahl]   (Standard 2) */
"use strict";
const fs = require("fs"), path = require("path");
const W = path.resolve(__dirname, "..", "..", "..");
const min = +(process.argv[2] || 2);
const html = fs.readFileSync(path.join(W, "zerstoerer.html"), "utf8");
const reihe = [...html.matchAll(/<script src="(zerstoerer\/[^"?]+\.js)/g)].map(m => m[1]);
const ketten = {}, haken = {};
for (const f of reihe) {
  const p = path.join(W, f); if (!fs.existsSync(p)) continue;
  const gemerkt = new Set();
  fs.readFileSync(p, "utf8").split("\n").forEach((z, i) => {
    for (const m of z.matchAll(/(?:const|let|var)\s+\w+\s*=\s*Z\.(\w+)\s*[;,]/g)) gemerkt.add(m[1]);
    for (const m of z.matchAll(/(?:^|[^.\w])Z\.(\w+)\s*=\s*(?:function|\(|\w+\s*=>|async)/g)) if (gemerkt.has(m[1])) (ketten[m[1]] = ketten[m[1]] || []).push(path.basename(f) + ":" + (i + 1));
    for (const m of z.matchAll(/\.(aussen|vor|nach)\(\s*"(\w+)"\s*,\s*"([\w-]+)"/g)) (haken[m[2]] = haken[m[2]] || []).push(path.basename(f) + ":" + (i + 1) + " (" + m[3] + ")");
  });
}
const liste = Object.entries(ketten).filter(([, l]) => l.length >= min).sort((a, b) => b[1].length - a[1].length);
for (const [n, l] of liste) console.log("Z." + n + "  " + l.length + "×  " + l.join(" "));
console.log("\nAußenschichten (Z.haken):");
for (const [n, l] of Object.entries(haken)) console.log("Z." + n + "  " + l.join(" "));
