const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const { User } = require("../models");

router.get("/", (req, res) => {
  const { userId, userLogin } = req.session;

  if (userId && userLogin) {
    res.redirect(`/chat/${userId}`);
  } else {
    res.render("auth");
  }
});

router.post("/ajax/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    res.json({
      ok: false,
      error: "Все поля должны быть заполнены!",
      fields: ["auth-login", "auth-pass"]
    });
  } else {
    const user = await User.findOne({ login });
    if (!user) {
      res.json({
        ok: false,
        error: "Введены неправильные данные входа!",
        fields: ["auth-login", "auth-pass"]
      });
    } else {
      bcrypt.compare(password, user.password, async (err, valid) => {
        if (!valid) {
          res.json({
            ok: false,
            error: "Введены неправильные данные входа!",
            fields: ["auth-login", "auth-pass"]
          });
        } else {
          if (user) {
            user.status = "online";
            await user.save();

            req.session.userId = user.id;
            req.session.userLogin = user.login;
            req.session.status = user.status;
            res.json({
              ok: true,
              userId: user.id
            });
          }
          if (err) {
            console.log(err);
            res.json({
              ok: false,
              error: "Ошибка, попробуйте позже!"
            });
          }
        }
      });
    }
  }
});

router.post("/ajax/register", async (req, res) => {
  const { login, password, passwordConfirm } = req.body;

  if (!login || !password || !passwordConfirm) {
    res.json({
      ok: false,
      error: "Все поля должны быть заполнены!",
      fields: ["reg-login", "reg-pass", "reg-pass-confirm"]
    });
  } else if (!/^[a-z\d_-]*$/i.test(login)) {
    res.json({
      ok: false,
      error:
        "Логин может содержать только символы латиницы, цифр, дефиса и нижнего подчеркивания!",
      fields: ["reg-login"]
    });
  } else if (login.length < 3 || login.length > 16) {
    res.json({
      ok: false,
      error: "Длина логина от 3 до 16 символов!",
      fields: ["reg-login"]
    });
  } else if (password !== passwordConfirm) {
    res.json({
      ok: false,
      error: "Пароли не совпадают!",
      fields: ["reg-pass", "reg-pass-confirm"]
    });
  } else if (password.length < 6) {
    res.json({
      ok: false,
      error: "Длина пароля не менее 6 символов!",
      fields: ["reg-pass"]
    });
  } else {
    try {
      const user = await User.findOne({ login });

      if (!user) {
        bcrypt.hash(password, null, null, async (err, hash) => {
          const user = await User.create({
            login,
            password: hash,
            status: "online"
          });

          if (user) {
            req.session.userId = user.id;
            req.session.userLogin = user.login;
            req.session.status = user.status;

            res.json({
              ok: true,
              userId: user.id
            });
          }
          if (err) {
            console.log(err);
            res.json({
              ok: false,
              error: "Ошибка, попробуйте позже!"
            });
          }
        });
      } else {
        res.json({
          ok: false,
          error: "Логин уже существует!",
          fields: ["reg-login"]
        });
      }
    } catch (err) {
      throw new Error("Server Error");
    }
  }
});

router.get("/ajax/logout", async (req, res) => {
  if (req.session) {
    try {
      const user = await User.findOne({ login: req.session.userLogin });
      user.status = "offine";
      await user.save();

      req.session.destroy(() => {
        res.redirect("/");
      });
    } catch (err) {
      throw new Error("Server Error");
    }
  } else {
    res.redirect("/");
  }
});

module.exports = router;
