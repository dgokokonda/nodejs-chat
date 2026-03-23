const express = require("express");
const router = express.Router();
const moment = require("moment");
const { User, Chat, Message } = require("../models");

moment.locale("ru");

async function toChat(req, res) {
  const { userId, userLogin } = req.session;

  if (!userId || !userLogin) {
    return res.redirect("/");
  }

  const companionId = req.params.companion || req.params.id;

  if (companionId && companionId !== userId) {
    const user = await User.findById(userId);
    const companion = await User.findById(companionId);

    if (!companion) {
      return res.redirect("/chat/users");
    }

    let chat = await Chat.findByUsers(userId, companionId);

    if (!chat) {
      const room = `${Date.now()}_${userId}_${companionId}`;
      chat = await Chat.create(room, [
        { id: userId, login: userLogin },
        { id: companionId, login: companion.login },
      ]);
    } else {
      const existingUsers = await Chat.getChatUsers(chat.id);
      const existingUserIds = existingUsers.map(u => u.user_id);

      if (!existingUserIds.includes(parseInt(userId))) {
        await db.query(
          "INSERT INTO chat_users (chat_id, user_id, login) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [chat.id, userId, userLogin]
        );
      }

      if (!existingUserIds.includes(parseInt(companionId))) {
        await db.query(
          "INSERT INTO chat_users (chat_id, user_id, login) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [chat.id, companionId, companion.login]
        );
      }
    }

    const userChats = await User.getUserChats(userId);
    const userHasChat = userChats.some(c => c.room === chat.room);

    if (!userHasChat) {
      await db.query(
        "INSERT INTO chat_users (chat_id, user_id, login) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [chat.id, userId, userLogin]
      );
    }

    const messages = await Message.findByRoom(chat.room, 50);
    await Message.markAsRead(chat.room, userId);

    res.render("chat", {
      moment,
      recipient: companion,
      room: chat.room,
      messages,
      user: {
        id: userId,
        login: userLogin,
      },
    });
  } else {
    const chats = await User.getUserChats(userId);
    const enrichedChats = [];

    for (const chat of chats) {
      const chatUsers = await Chat.getChatUsers(chat.id);
      const companion = chatUsers.find((u) => u.user_id !== parseInt(userId));
      enrichedChats.push({
        ...chat,
        companion,
        lastMsg: chat.last_msg ? {
          msg: chat.last_msg,
          sender: chat.last_msg_sender,
          createdAt: chat.last_msg_time,
        } : null,
      });
    }

    res.render("index", {
      moment,
      chats: enrichedChats,
      user: {
        id: userId,
        login: userLogin,
      },
    });
  }
}

router.get("/users", async (req, res) => {
  const { userId, userLogin } = req.session;

  if (!userId || !userLogin) {
    return res.redirect("/");
  }

  try {
    const users = await User.findAll();
    res.render("users", {
      users,
      user: {
        id: userId,
        login: userLogin,
        status: req.session.status || "offline",
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Server Error");
  }
});

router.get("/:id", (req, res) => toChat(req, res));
router.get("/:id/sel=:companion", (req, res) => toChat(req, res));

router.post("/sendMsg", async (req, res) => {
  const { msg, recipient, room } = req.body;
  const { userId, userLogin } = req.session;

  if (!userId || !userLogin) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    await Message.create(room, userId, recipient, msg);

    const chat = await Chat.findByRoom(room);
    if (chat) {
      await Chat.updateLastMessage(chat.id, userId, userLogin, msg);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;