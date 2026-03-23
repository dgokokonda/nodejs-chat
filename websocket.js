const WebSocket = require("ws");
const { User, Chat, Message } = require("./models");
const db = require("./db");

const clients = new Map();

function heartbeat() {
  this.isAlive = true;
}

function setupWebSocket(server, sessionParser) {
  const wss = new WebSocket.Server({ port: 8082 });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId'));
    if (!userId) {
      ws.close(1008, "Unauthorized");
      return;
    }

    ws.userId = userId;
    ws.isAlive = true;
    clients.set(userId, ws);
    console.log(`User ${userId} connected. Total clients: ${clients.size}`);

    ws.on("pong", heartbeat);
    ws.on("message", async (data) => {
      try {
        const parsedData = JSON.parse(data);
        const { msg, username, userId: senderId, recipient, room } = parsedData;
        if (!msg || !room) return;

        await Message.create(room, senderId, recipient, msg);
        const chat = await Chat.findByRoom(room);
        if (chat) {
          await Chat.updateLastMessage(chat.id, senderId, username, msg);
        }

        const recipientClient = clients.get(recipient);
        if (recipientClient && recipientClient.readyState === WebSocket.OPEN) {
          recipientClient.send(JSON.stringify({
            msg, username, userId: senderId, room,
            time: new Date().toLocaleTimeString(),
          }));
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", () => {
      console.log(`User ${ws.userId} disconnected`);
      clients.delete(ws.userId);
    });

    ws.on("error", (err) => console.error("WebSocket error:", err));
  });

  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));
  console.log("WebSocket server on port 8082");
  return wss;
}

module.exports = { setupWebSocket, clients };