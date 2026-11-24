// Balancing-Läufe ohne Bild: node sim.js <ausgabe.json> [stufen=3] [schwierigkeit=0] [instanzen=2] [bot=std]
// Startet das PC-Programm mehrfach (xvfb), lässt je Held und Ast einen Bot laufen (nur Spiellogik, ~20-fache Geschwindigkeit)
// und schreibt je Lauf: Zeit je Stufe, Tode, Stufe/Level, Schaden je Quelle.
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const [out = 'sim.json', STUFEN = '3', DIFF = '0', INST = '2', BOT = 'std'] = process.argv.slice(2);
// STUFEN als Liste „8,16,24“ = Schnellstart: jede dieser Stufen einzeln mit passendem Level spielen
// Umgebungsvariablen: NUR="ezekiel:2,ezekiel:0" (nur diese Äste), WDH=5 (Wiederholungen)
const NUR = process.env.NUR ? process.env.NUR.split(',') : null; const WDH = +(process.env.WDH || 1);
const SCHNELL = STUFEN.includes(',') || process.env.SCHNELL ? STUFEN.split(',').map(Number) : null;
const DESK = path.join(__dirname, '..', '..', 'desktop');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function verbinden(port) { for (let i = 0; i < 60; i++) { try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = l.find(x => x.type === 'page'); if (p) { const ws = new WebSocket(p.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; }); let id = 0; const pend = {}; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d); delete pend[d.id]; } }; return e => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: e, awaitPromise: true, returnByValue: true } })); }).then(d => d.result.exceptionDetails ? { fehler: JSON.stringify(d.result.exceptionDetails).slice(0, 400) } : d.result.result.value); } } catch (e) { } await sleep(1000); } throw new Error('keine Verbindung ' + port); }
const LAUF = fs.readFileSync(path.join(__dirname, 'sim-lauf.js'), 'utf8');
(async () => {
  const jobs = []; for (const s of (SCHNELL || [null])) for (const h of ['barradin', 'friedrich', 'echo', 'ezekiel']) for (let b = 0; b < 5; b++) { if (NUR && !NUR.includes(h + ':' + b)) continue; for (let w = 0; w < WDH; w++) jobs.push({ h, b, s }); }
  const res = []; const n = Math.max(1, +INST);
  await Promise.all(Array.from({ length: n }, async (_, k) => {
    const port = 9230 + k;
    const p = spawn('xvfb-run', ['-a', '-s', '-screen 0 1280x720x24', 'npx', 'electron', '.', '--no-sandbox', '--fenster', '--ohne-update', '--ohne-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/hs-sim-${port}`], { cwd: DESK, stdio: 'ignore', detached: true });
    const ev = await verbinden(port); for (let i = 0; i < 40; i++) { if (await ev('typeof window.__hs==="object"&&document.readyState==="complete"') === true) break; await sleep(1000); }
    await sleep(6000); await ev(LAUF);
    for (;;) { const j = jobs.shift(); if (!j) break; const t0 = Date.now(); const r = await ev(j.s != null ? `__simSchnell(${JSON.stringify(j.h)},${j.b},${j.s},${+DIFF},${JSON.stringify(BOT)})` : `__simLauf(${JSON.stringify(j.h)},${j.b},${+STUFEN},${+DIFF},${JSON.stringify(BOT)})`); let o; try { o = JSON.parse(r); } catch (e) { o = { fehler: r }; } o.h = j.h; o.b = j.b; o.echt = Math.round((Date.now() - t0) / 1000); res.push(o); fs.writeFileSync(out, JSON.stringify(res)); console.log(j.s != null ? 'S' + j.s : '', j.h, j.b, o.ast || '', 'Lv', o.lv, 'Stufe', o.stufe, 'Zeit', o.zeit, 'Tode', o.tode, o.ende || '', o.fehler ? 'FEHLER ' + String(o.fehler).slice(0, 120) : ''); }
    try { process.kill(-p.pid); } catch (e) { }
  }));
  process.exit(0);
})();
