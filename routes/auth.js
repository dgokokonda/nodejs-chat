const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { User } = require("../models");

router.get("/", async (req, res) => {
  const { userId, userLogin } = req.session;

  if (userId && userLogin) {
    res.redirect(`/chat/${userId}`);
  } else {
    res.render("auth", { user: null });
  }
});

// Логин
router.post("/ajax/login", async (req, res) => {
  console.log("Login request body:", req.body);

  const { login, password } = req.body;

  if (!login || !password) {
    return res.json({
      ok: false,
      error: "Все поля должны быть заполнены!",
      fields: ["auth-login", "auth-pass"],
    });
  }

  try {
    const user = await User.findByLogin(login);
    console.log("Found user:", user);

    if (!user) {
      return res.json({
        ok: false,
        error: "Пользователь не найден!",
        fields: ["auth-login", "auth-pass"],
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", valid);

    if (!valid) {
      return res.json({
        ok: false,
        error: "Неверный пароль!",
        fields: ["auth-login", "auth-pass"],
      });
    }

    await User.updateStatus(user.id, "online");

    req.session.userId = user.id;
    req.session.userLogin = user.login;
    req.session.status = "online";

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.json({
          ok: false,
          error: "Ошибка сервера",
        });
      }

      console.log("Login successful, session saved");
      res.json({
        ok: true,
        userId: user.id,
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.json({
      ok: false,
      error: "Ошибка, попробуйте позже!",
    });
  }
});

// Регистрация
router.post("/ajax/register", async (req, res) => {
  console.log("Register request body:", req.body);

  const { login, password, passwordConfirm } = req.body;

  if (!login || !password || !passwordConfirm) {
    return res.json({
      ok: false,
      error: "Все поля должны быть заполнены!",
      fields: ["reg-login", "reg-pass", "reg-pass-confirm"],
    });
  }

  if (!/^[a-z\d_-]*$/i.test(login)) {
    return res.json({
      ok: false,
      error: "Логин может содержать только символы латиницы, цифр, дефиса и нижнего подчеркивания!",
      fields: ["reg-login"],
    });
  }

  if (login.length < 3 || login.length > 16) {
    return res.json({
      ok: false,
      error: "Длина логина от 3 до 16 символов!",
      fields: ["reg-login"],
    });
  }

  if (password !== passwordConfirm) {
    return res.json({
      ok: false,
      error: "Пароли не совпадают!",
      fields: ["reg-pass", "reg-pass-confirm"],
    });
  }

  if (password.length < 6) {
    return res.json({
      ok: false,
      error: "Длина пароля не менее 6 символов!",
      fields: ["reg-pass"],
    });
  }

  try {
    const existingUser = await User.findByLogin(login);
    console.log("Existing user check:", existingUser);

    if (existingUser) {
      return res.json({
        ok: false,
        error: "Логин уже существует!",
        fields: ["reg-login"],
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create(login, hash);
    console.log("User created:", user);

    req.session.userId = user.id;
    req.session.userLogin = user.login;
    req.session.status = "online";

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.json({
          ok: false,
          error: "Ошибка сервера",
        });
      }

      console.log("Registration successful, session saved");
      res.json({
        ok: true,
        userId: user.id,
      });
    });
  } catch (err) {
    console.error("Register error:", err);
    res.json({
      ok: false,
      error: "Ошибка, попробуйте позже!",
    });
  }
});

router.get("/ajax/logout", async (req, res) => {
  if (req.session && req.session.userId) {
    try {
      await User.updateStatus(req.session.userId, "offline");
      req.session.destroy(() => {
        res.redirect("/");
      });
    } catch (err) {
      console.error(err);
      res.redirect("/");
    }
  } else {
    res.redirect("/");
  }
});

module.exports = router;