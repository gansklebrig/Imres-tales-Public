const fs = require("fs"), path = require("path"), alle = {};
const dateien = process.argv.slice(2);
for (const d of dateien) { const m = require(path.resolve(d)); Object.keys(m).forEach(k => { alle[k] = (alle[k] || []).concat(m[k]); }); }
const n = Object.values(alle).reduce((a, l) => a + l.length, 0);
fs.writeFileSync(path.join(__dirname, "..", "..", "lieder.js"), "/* Liedersammlung der Bühne – " + n + " Stücke (Format: siehe liedAusSammlung in lautenwerk.js) */\nwindow.IMRES_LIEDER = " + JSON.stringify(alle) + ";\n");
console.log("lieder.js:", n, "Stücke,", Object.keys(alle).length, "Stimmungen,", Math.round(fs.statSync("/root/repo/lieder.js").size / 1024) + " KB");
