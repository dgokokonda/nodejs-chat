"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { pool } = require("./db");
const routes = require("./routes");
const authRoutes = require("./routes/auth");   // <-- добавлено
const { setupWebSocket } = require("./websocket");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { typeDefs, resolvers } = require("./graphql/schema");
const context = require("./graphql/context");

const app = express();

// Session
const sessionParser = session({
  store: new pgSession({ pool, tableName: "session", createTableIfMissing: true }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000, httpOnly: true, secure: false, sameSite: 'lax' },
  name: 'connect.sid'
});

app.use(sessionParser);

// Парсеры (для REST и GraphQL)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статика
app.use(express.static(path.join(__dirname, "public")));
app.use("/js", express.static(path.join(__dirname, "node_modules", "jquery", "dist")));
app.use("/lib/moment", express.static(path.join(__dirname, "node_modules", "moment", "min")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Apollo Server
async function startServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false,
  });

  await apolloServer.start();
  // console.log("✓ Apollo Server started");

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }) => context({ req }),
    })
  );
  // console.log("✓ GraphQL middleware added");

  // REST-маршруты (авторизация)
  app.use("/", authRoutes);   // <-- добавлено

  app.post("/", (req, res) => {
    // Если форма случайно отправилась, перенаправляем на GET /
    res.redirect("/");
  });

  // Основные страницы
  app.get("/", (req, res) => {
    const { userId, userLogin } = req.session;
    if (userId && userLogin) {
      res.redirect(`/chat/${userId}`);
    } else {
      res.render("auth", { user: null });
    }
  });

  app.use("/chat", routes.chat);

  // 404 handler
  app.use((req, res) => {
    res.status(404).render("404", { error: { message: "Page Not Found" } });
  });

  // Error handler
  app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status || 500);
    res.render("404", { error });
  });


  const server = app.listen(config.PORT, () => {
    console.log(`✓ Server running on http://localhost:${config.PORT}`);
    console.log(`✓ GraphQL endpoint: http://localhost:${config.PORT}/graphql`);
    console.log(`✓ WebSocket server on port 8082`);
  });

  setupWebSocket(server, sessionParser);
}

startServer().catch(console.error);