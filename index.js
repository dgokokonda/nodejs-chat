"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config");
const mongoose = require("mongoose");
const routes = require("./routes");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const WebSocketServer = new require('ws');

const clients = {};

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

// socket
const webSocketServer = new WebSocketServer.Server({ port: 5432 });
webSocketServer.on('connection', (ws) => {
    const id = Math.random();
    clients[id] = ws;
    console.log("новое соединение " + id);

    ws.on('message', (data) => {
        console.log('получено сообщение ' + data);

        for (var key in clients) {
            const parsedData = JSON.parse(data);
            clients[key].send(JSON.stringify({ ...parsedData, id }));
        }
    });

    ws.on('close', () => {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    })
})

const app = express();

// sessions
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    cookie: { maxAge: 1.8e6 } // 30 мин в мс
  })
);

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
// app.use("/users", routes.users);

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
