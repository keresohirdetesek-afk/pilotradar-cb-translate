// pilotRADAR CB Rádió – WebSocket + fordító szerver (Railway / Node.js 18+)
// Futtatás: node server.js  |  PORT env változóból, alapértelmezés: 8080
//
// Szobák: "PUB-<1..40>" nyilvános csatornák, "PRIV-<kód>" privát csatornák.
// Fél-duplex: szobánként egyszerre csak EGY adó lehet (mint az igazi CB-n).
// Fordítás: GET /translate?sl=hu&tl=en&q=szoveg  ->  { text: "..." }

const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;

// ---------- Fordítás (Google gtx végpont, kulcs nélkül) ----------
async function translate(sl, tl, q) {
  const url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t" +
    "&sl=" + encodeURIComponent(sl) +
    "&tl=" + encodeURIComponent(tl) +
    "&q=" + encodeURIComponent(q);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("translate HTTP " + res.status);
  const data = await res.json();
  // A válasz: [[["fordítás","eredeti",...],["folytatás",...]],...]
  return (data[0] || []).map(seg => seg[0]).join("");
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");

  // CORS – a kliens másik domainről hívja
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (u.pathname === "/translate") {
    const sl = (u.searchParams.get("sl") || "auto").slice(0, 8);
    const tl = (u.searchParams.get("tl") || "en").slice(0, 8);
    const q  = (u.searchParams.get("q")  || "").slice(0, 1000);
    if (!q) { res.writeHead(400, {"Content-Type":"application/json"}); res.end('{"error":"q hiányzik"}'); return; }
    try {
      const text = await translate(sl, tl, q);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ text }));
    } catch (e) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Fordítási hiba" }));
    }
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("pilotRADAR CB szerver fut ✔");
});

const wss = new WebSocketServer({ server });

// room -> { clients:Set<ws>, txClient: ws|null }
const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, { clients: new Set(), txClient: null });
  return rooms.get(id);
}

function broadcast(roomId, data, except) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const c of room.clients) {
    if (c !== except && c.readyState === 1) c.send(data);
  }
}

function roomState(roomId) {
  const room = rooms.get(roomId);
  return JSON.stringify({
    type: "state",
    room: roomId,
    users: room ? room.clients.size : 0,
    busy: !!(room && room.txClient),
    txName: room && room.txClient ? room.txClient._name : null,
  });
}

function sendState(roomId) {
  broadcast(roomId, roomState(roomId), null);
}

function leaveRoom(ws) {
  const roomId = ws._room;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (room) {
    room.clients.delete(ws);
    if (room.txClient === ws) {
      room.txClient = null;
      broadcast(roomId, JSON.stringify({ type: "tx-end", name: ws._name }), null);
    }
    if (room.clients.size === 0) rooms.delete(roomId);
    else sendState(roomId);
  }
  ws._room = null;
}

wss.on("connection", (ws) => {
  ws._room = null;
  ws._name = "Ismeretlen";

  ws.on("message", (raw, isBinary) => {
    // Bináris üzenet = hangszegmens az aktuális adótól -> továbbítás a szobának
    if (isBinary) {
      const room = rooms.get(ws._room);
      if (room && room.txClient === ws) {
        broadcast(ws._room, raw, ws);
      }
      return;
    }

    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    switch (msg.type) {
      case "join": {
        leaveRoom(ws);
        const roomId = String(msg.room || "").slice(0, 64);
        if (!/^(PUB-([1-9]|[1-3][0-9]|40)|PRIV-[A-Z0-9]{4,20})$/.test(roomId)) {
          ws.send(JSON.stringify({ type: "error", message: "Érvénytelen csatorna." }));
          return;
        }
        ws._name = String(msg.name || "Ismeretlen").slice(0, 24);
        ws._room = roomId;
        getRoom(roomId).clients.add(ws);
        ws.send(JSON.stringify({ type: "joined", room: roomId }));
        sendState(roomId);
        break;
      }

      case "tx-start": {
        const room = rooms.get(ws._room);
        if (!room) return;
        if (room.txClient && room.txClient !== ws) {
          ws.send(JSON.stringify({ type: "busy", txName: room.txClient._name }));
          return;
        }
        room.txClient = ws;
        ws.send(JSON.stringify({ type: "tx-granted" }));
        broadcast(ws._room, JSON.stringify({ type: "tx-begin", name: ws._name }), ws);
        sendState(ws._room);
        break;
      }

      case "tx-stop": {
        const room = rooms.get(ws._room);
        if (room && room.txClient === ws) {
          room.txClient = null;
          broadcast(ws._room, JSON.stringify({ type: "tx-end", name: ws._name }), ws);
          sendState(ws._room);
        }
        break;
      }

      // Felismert beszéd (felirat) az adótól -> továbbítás a szoba többi tagjának
      case "stt": {
        const room = rooms.get(ws._room);
        if (room && room.txClient === ws) {
          broadcast(ws._room, JSON.stringify({
            type: "stt",
            name: ws._name,
            lang: String(msg.lang || "auto").slice(0, 8),
            text: String(msg.text || "").slice(0, 500),
          }), ws);
        }
        break;
      }

      case "leave":
        leaveRoom(ws);
        break;
    }
  });

  ws.on("close", () => leaveRoom(ws));
  ws.on("error", () => leaveRoom(ws));
});

// Kapcsolat-életben tartás (Railway 60 mp után bontja a tétlen kapcsolatot)
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === 1) ws.ping();
  }
}, 30000);

server.listen(PORT, () => {
  console.log("pilotRADAR CB szerver elindult a " + PORT + " porton");
});
