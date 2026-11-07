/* Liest die Chronik aus inhalt.js / inhalt-en.js und gibt sie als JSON aus (für vertonen.py). */
global.window = global;
const sprache = process.argv[2] || "de";
require(require("path").join(__dirname, "../../", sprache === "en" ? "inhalt-en.js" : "inhalt.js"));
const D = sprache === "en" ? window.INHALT_EN : window.INHALT;
const kap = (D.kapitel || []).map((k, i) => ({
  nummer: k.nummer || String(i + 1), titel: k.titel || "",
  absaetze: (k.absaetze || []).filter(a => typeof a === "string")
}));
const vorab = D.erzaehler && D.erzaehler.text ? D.erzaehler.text : "";
process.stdout.write(JSON.stringify({ sprache, vorab, kapitel: kap }));
