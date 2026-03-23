const express = require("express");
const router = express.Router();
const { User, Chat } = require("../models");
// Удаляем moment, если не используется
// const moment = require("moment");

// Страница списка пользователей
router.get("/users", async (req, res) => {
  const { userId, userLogin } = req.session;

  if (!userId || !userLogin) {
    return res.redirect("/");
  }

  res.render("users", {
    user: {
      id: userId,
      login: userLogin,
      status: req.session.status || "offline",
    },
  });
});

// Страница списка чатов
router.get("/:id", async (req, res) => {
  const { userId, userLogin } = req.session;

  if (!userId || !userLogin) {
    return res.redirect("/");
  }

  res.render("index", {
    user: {
      id: userId,
      login: userLogin,
    },
  });
});

// Страница чата с конкретным пользователем
router.get("/:id/sel=:companion", async (req, res) => {
  const { userId, userLogin } = req.session;

  if (!userId || !userLogin) {
    return res.redirect("/");
  }

  const companion = await User.findById(req.params.companion);

  if (!companion) {
    return res.redirect("/chat/users");
  }

  // Находим или создаём чат
  let chat = await Chat.findByUsers(userId, companion.id);

  if (!chat) {
    const room = `${Date.now()}_${userId}_${companion.id}`;
    chat = await Chat.create(room, [
      { id: userId, login: userLogin },
      { id: companion.id, login: companion.login },
    ]);
  }

  res.render("chat", {
    recipient: companion,
    room: chat.room,
    user: {
      id: userId,
      login: userLogin,
    },
  });
});

module.exports = router;