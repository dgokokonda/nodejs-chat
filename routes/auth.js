const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models");

// Логин
router.post("/ajax/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.json({
      ok: false,
      error: "Все поля должны быть заполнены!",
      fields: ["auth-login", "auth-pass"]
    });
  }

  try {
    const user = await User.findByLogin(login);
    if (!user) {
      return res.json({
        ok: false,
        error: "Пользователь не найден!",
        fields: ["auth-login", "auth-pass"]
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({
        ok: false,
        error: "Неверный пароль!",
        fields: ["auth-login", "auth-pass"]
      });
    }

    await User.updateStatus(user.id, "online");

    req.session.userId = user.id;
    req.session.userLogin = user.login;
    req.session.status = "online";

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.json({ ok: false, error: "Ошибка сервера" });
      }
      res.json({ ok: true, userId: user.id });
    });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Ошибка сервера" });
  }
});

// Регистрация
router.post("/ajax/register", async (req, res) => {
  const { login, password, passwordConfirm } = req.body;

  // Валидация
  if (!login || !password || !passwordConfirm) {
    return res.json({
      ok: false,
      error: "Все поля должны быть заполнены!",
      fields: ["reg-login", "reg-pass", "reg-pass-confirm"]
    });
  }
  if (!/^[a-z\d_-]*$/i.test(login)) {
    return res.json({
      ok: false,
      error: "Логин может содержать только латиницу, цифры, дефис и подчёркивание",
      fields: ["reg-login"]
    });
  }
  if (login.length < 3 || login.length > 16) {
    return res.json({
      ok: false,
      error: "Длина логина от 3 до 16 символов",
      fields: ["reg-login"]
    });
  }
  if (password !== passwordConfirm) {
    return res.json({
      ok: false,
      error: "Пароли не совпадают",
      fields: ["reg-pass", "reg-pass-confirm"]
    });
  }
  if (password.length < 6) {
    return res.json({
      ok: false,
      error: "Длина пароля не менее 6 символов",
      fields: ["reg-pass"]
    });
  }

  try {
    const existingUser = await User.findByLogin(login);
    if (existingUser) {
      return res.json({
        ok: false,
        error: "Логин уже существует!",
        fields: ["reg-login"]
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create(login, hash);

    req.session.userId = user.id;
    req.session.userLogin = user.login;
    req.session.status = "online";

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.json({ ok: false, error: "Ошибка сервера" });
      }
      res.json({ ok: true, userId: user.id });
    });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Ошибка сервера" });
  }
});

// Выход
router.get("/ajax/logout", async (req, res) => {
  if (req.session && req.session.userId) {
    await User.updateStatus(req.session.userId, "offline");
    req.session.destroy(() => {
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

module.exports = router;