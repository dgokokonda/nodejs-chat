const express = require("express");
const router = express.Router();
const moment = require("moment");
const { User, Chat, Message, Session } = require("../models");
const WebSocketServer = new require("ws");
const clients = {};
let sessionData = null;

moment.locale("ru");
 
function heartbeat() {
  this.isAlive = true;
}

// socket
const wss = new WebSocketServer.Server({ port: 8082 });
// add scroll load msgs
wss.on("connection", ws => {
  if (sessionData && sessionData.userId) {
    const id = sessionData.userId;
    clients[id] = ws;
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.on("message", async data => {
      const parsedData = JSON.parse(data);
      const roomUsers = await getRoomUsers(parsedData);

      for (var key in clients) {
        if (roomUsers.filter(({ id }) => id === key).length) {
          clients[key].send(
            JSON.stringify({
              ...parsedData,
              id: key,
              time: moment(Date.now()).format("HH:mm")
            })
          );
        }
      }
    });
    ws.on("close", async function() {
      console.log("Соединение закрыто", id);
      delete clients[id];
    });
  }
});

setInterval(function() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
  
    ws.isAlive = false;
    closeSession()
  });
}, 180000);

async function closeSession() {
  await Session.findOneAndDelete({ session: JSON.stringify(sessionData) });
  const user = await User.findById(sessionData.userId);
  user.status = 'offline';
  await user.save();
  // console.log(session, user)
  sessionData = null;
  // пока не обновляется статус на странице
}

async function getRoomUsers({ room }) {
    const chat = await Chat.findOne({ room })
    return chat.users;
}

async function toChat(req, res) {
  const { userId, userLogin } = req.session;

  if (userId && userLogin) {
    sessionData = req.session;

    const companionId = req.params.companion;
    const user = await User.findById(userId);
    const companion = await User.findById(companionId);

    if (companion) {
      // переход в комнату чата
      const recipient = {
        id: companionId,
        login: companion.login,
        status: companion.status
      };
      const chatByParams = {
        users: {
          $all: [
            { id: userId, login: userLogin },
            { id: companionId, login: companion.login }
          ]
        } // $all - независимо от порядка эл-в в массиве
      };
      let chat = await Chat.findOne(chatByParams);

      if (!chat) {
        chat = await Chat.create({
          room: Date.now().toString(),
          users: [
            { id: userId, login: userLogin },
            { id: companionId, login: companion.login }
          ]
        });
      }

      if (
        !user.chats.length ||
        !user.chats.filter(id => id == chat.room).length
      ) {
        user.chats.push(chat.room);
        await user.save();
      }
      if (
        !companion.chats.length ||
        !companion.chats.filter(id => id == chat.room).length
      ) {
        companion.chats.push(chat.room);
        await companion.save();
      }

      let messages = await Message.find({ room: chat.room })
        .sort({ createdAt: -1 })
        .limit(20);
      //  || null; // отображать порциями при промотке

      res.render("chat.ejs", {
        moment,
        recipient,
        room: chat.room,
        messages,
        user: {
          id: userId,
          login: userLogin
        }
      });
    } else {
      // рендер списка чатов
      const chats = await Chat.find({ room: user.chats }).sort({ createdAt: -1 });

      res.render("index.ejs", {
        moment,
        chats,
        user: {
          id: userId,
          login: userLogin
        }
      });
    }
  } else {
    res.redirect("/");
  }
}

router.get("/users", async (req, res) => {
  const { userId, userLogin } = req.session;
  if (userId && userLogin) {
    try {
      const users = await User.find({});
      res.render("users.ejs", {
        users,
        user: {
          id: req.session.userId,
          login: req.session.userLogin,
          status: req.session.status
        }
      });
    } catch (err) {
      throw new Error("Server Error");
    }
  } else {
    res.redirect("/");
  }
});

router.get("/:id", (req, res) => toChat(req, res));
router.get("/:id/sel=:companion", (req, res) => toChat(req, res));
router.post("/sendMsg", async (req, res) => {
  const { msg, recipient, room } = req.body;
  const { userId, userLogin, status } = req.session;

  if (userId && userLogin) {
    await Message.create({
      room,
      sender: userId,
      recipient,
      message: msg
    });

    const chat = await Chat.findOne({ room });
    
    chat.lastMsg.sender = {
      id: userId,
      name: userLogin
    };
    chat.lastMsg.msg = msg;
    await chat.save();

    res.json({
      ok: true
    });
  }
});

module.exports = router;
