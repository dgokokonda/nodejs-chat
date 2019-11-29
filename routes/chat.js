const express = require("express");
const router = express.Router();
const { User } = require("../models");

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

router.get("/:id", (req, res) => {
  const id = req.params.id;
  const { userId, userLogin, status } = req.session;
  //   findOne by id*

  if (userId && userLogin) {
    res.render("index.ejs", {
      user: {
        id: userId,
        login: userLogin,
        status
      }
    });
  } else {
    res.redirect("/");
  }
});

module.exports = router;
