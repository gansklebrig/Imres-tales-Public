/* Lokaler PeerJS-Vermittler für die Online-Tests (kein Teil des Spiels; das Spiel nutzt sonst 0.peerjs.com).
   Aufruf: node peer-server.js [port]   (Standard ZS_PEER_PORT oder 9431)
   Braucht das npm-Paket „peer“ (1.x): npm install --no-save --prefix <ordner> peer@1.0.2 und dann ZS_PEER_MODUL=<ordner>/node_modules/peer
   (oder normal auffindbar per NODE_PATH). */
"use strict";
const ort = process.env.ZS_PEER_MODUL || "peer";
const { PeerServer } = require(ort);
const port = +(process.argv[2] || process.env.ZS_PEER_PORT || 9431);
PeerServer({ port: port, host: "127.0.0.1", path: "/", allow_discovery: false }, () => console.log("PeerJS-Vermittler auf 127.0.0.1:" + port));
