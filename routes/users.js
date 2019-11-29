const express = require("express");
const router = express.Router();
const { User } = require("../models");

// router.get("/users", async (req, res) => {
//   const { userId, userLogin } = req.session;
//   if (userId && userLogin) {
//     try {
//       const users = await User.find({});
//       console.log(1222,users);
//       res.render("users", {
//         users
//       });
//     } catch (err) {
//       throw new Error("Server Error");
//     }
//   } else {
//     res.redirect("/");
//   }
// });

module.exports = router;
