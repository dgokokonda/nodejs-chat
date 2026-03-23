"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { pool } = require("./db");
const routes = require("./routes");
const { setupWebSocket } = require("./websocket");

const app = express();

// Session store in PostgreSQL
const sessionParser = session({
  store: new pgSession({
    pool: pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 минут
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  },
  name: 'connect.sid'
});

app.use(sessionParser);

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", routes.auth);
app.use("/chat", routes.chat);

// 404 handler
app.use("/", (req, res, next) => {
  res.status(404).render("404", { error: { message: "Page Not Found" } });
});

// Error handler
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500);
  res.render("404", { error });
});

const server = app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
  console.log(`WebSocket server will run on port 8082`);
});

// Setup WebSocket with session support
setupWebSocket(server, sessionParser);

module.exports = { sessionParser };