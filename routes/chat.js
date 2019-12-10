const express = require("express");
const router = express.Router();
const moment = require("moment");
const { User, Chat, Message } = require("../models");
const WebSocketServer = new require("ws");
const clients = {};
let sessionUserId = null;

moment.locale("ru");

// socket
const wss = new WebSocketServer.Server({ port: 8082 });
// add ping pong for updating status
// update dialog last msgs
// add scroll load msgs
// filter clients by rooms
wss.on("connection", ws => {
  if (sessionUserId) {
    const id = sessionUserId;
    clients[id] = ws;

    ws.on("message", data => {
      const parsedData = JSON.parse(data);

      for (var key in clients) {
        clients[key].send(
          JSON.stringify({
            ...parsedData,
            id: key,
            time: moment(Date.now()).format("HH:mm")
          }))
      }
    });
    ws.on('close', function () {
      console.log('Соединение закрыто', id)
      delete clients[id];
      // console.log(2,Object.keys(clients))
    });
  }
});


async function toChat(req, res) {
  const { userId, userLogin } = req.session;

  if (userId && userLogin) {
    sessionUserId = userId;
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

      let messages = await Message.find(
        { room: chat.room })
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
      const chats = await Chat.find({ room: user.chats });

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
// ajax send msg

module.exports = router;
