const express = require("express");
const router = express.Router();
const { User, Chat, Message } = require("../models");

async function toChat(req, res) {
  const companionId = req.params.companion;
  const { userId, userLogin } = req.session;

  if (userId && userLogin) {
    const user = await User.findById(userId);
    const companion = await User.findById(companionId);
    const recipient = companion
      ? {
        id: companionId,
        login: companion.login,
        status: companion.status
      }
      : null;

    if (companion) {
      // переход в комнату чата
    
      const chatByParams = {
        users: { $all: [userId, companionId] } // $all - независимо от порядка эл-в в массиве
      };
      let chat = await Chat.findOne(chatByParams);

      if (!chat) {
        chat = await Chat.create({
          room: Date.now().toString(),
          users: [userId, companionId]
        });
      }
      
      if (!user.chats.length || !user.chats.filter(id => id == chat.room).length) {
        user.chats.push(chat.room);
        await user.save();
      }
      if (!companion.chats.length || !companion.chats.filter(id => id == chat.room).length) {
        companion.chats.push(chat.room);
        await companion.save();
      }

      let messages = await Message.find({ room: chat.room })
        // .skip({$slice: -20})
        .limit(20) || null; // отображать порциями при промотке

      res.render("chat.ejs", {
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
      const userChats = [];
      user.chats.forEach(async ch => userChats.push(await Chat.findById(ch)));

      res.render("index.ejs", {
        recipient,
        chats: userChats,
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
  
  const message = await Message.create({
    room,
    sender: userId,
    recipient,
    message: msg
  });
  res.json({
    ok: true
  });
})
// ajax send msg

module.exports = router;
