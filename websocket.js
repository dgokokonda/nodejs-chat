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
    console.log("New WebSocket connection");

    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId'));

    if (!userId) {
      console.log("No userId in URL");
      ws.close(1008, "Unauthorized");
      return;
    }

    ws.userId = userId;
    ws.isAlive = true;
    clients.set(userId, ws);
    console.log(`User ${userId} connected. Total clients: ${clients.size}`);

    await User.updateStatus(userId, "online");

    ws.on("pong", heartbeat);

    ws.on("message", async (data) => {
      try {
        const parsedData = JSON.parse(data);
        console.log(`[Server] Received from ${parsedData.username}:`, parsedData.msg);

        const { msg, username, userId: senderId, recipient, room } = parsedData;

        if (!msg || !room) {
          return;
        }

        // await Message.create(room, senderId, recipient, msg);

        // const chat = await Chat.findByRoom(room);
        // if (chat) {
        //   await Chat.updateLastMessage(chat.id, senderId, username, msg);
        // }

        const recipientUser = await User.findById(recipient);

        const recipientClient = clients.get(recipient);
        if (recipientClient && recipientClient.readyState === WebSocket.OPEN) {
          const messageToSend = JSON.stringify({
            msg: msg,
            username: username,
            userId: senderId,
            room: room,
            time: new Date().toLocaleTimeString(),
          });
          recipientClient.send(messageToSend);
          console.log(`[Server] Message sent ONLY to recipient ${recipientUser?.login || recipient}`);
        } else {
          console.log(`[Server] Recipient ${recipient} not connected`);
        }


      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", async () => {
      console.log(`User ${ws.userId} disconnected`);
      clients.delete(ws.userId);
      if (ws.userId) {
        await User.updateStatus(ws.userId, "offline");
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
  });

  // Ping/poll для поддержания соединения
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  console.log("WebSocket server on port 8082");
  return wss;
}

module.exports = { setupWebSocket, clients };