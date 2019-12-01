const express = require("express");
const router = express.Router();
const { User } = require("../models");

async function toChat(req, res) {
  const recipient = req.params.companion;
  const { userId, userLogin, status } = req.session;

  if (userId && userLogin) {
    res.render("index.ejs", {
      recipient: recipient || null,
      user: {
        id: userId,
        login: userLogin,
        status
      }
    });
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

// ajax send msg

module.exports = router;
