"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config");
const mongoose = require("mongoose");
const routes = require("./routes");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

// database
mongoose.Promise = global.Promise;
mongoose.set("debug", true);

mongoose.connection
  .on("error", error => console.log(error))
  .on("close", () => console.log("Database connection closed"))
  .once("open", () => {
    const info = mongoose.connections[0];
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  });

mongoose.connect(config.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const app = express();
const sessionParser = session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  }),
  // cookie: { maxAge: 1.8e6 } // 30 мин в мс
});

// sessions
app.use(sessionParser);

// sets and uses
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules", "jquery", "dist"))
);

app.use("/", routes.auth);
app.use("/chat", routes.chat);

// catch 404 and forward to error handler
app.use("/", (req, res, next) => {
  next(new PageError("Page Not Found"));
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.render("404", {
    error
  });
  next();
});

app.listen(config.PORT, () =>
  console.log(`Server is running on port ${config.PORT}`)
);

module.exports = sessionParser;
