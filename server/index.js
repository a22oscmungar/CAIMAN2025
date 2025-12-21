// server/index.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

// =======================
// CARGA DE DATOS
// =======================
const questionsMostLikely = JSON.parse(
  fs.readFileSync(path.join(__dirname, "mostLikely.json"))
);

const questionsTrivia = JSON.parse(
  fs.readFileSync(path.join(__dirname, "questionsTrivia.json"))
);

const USERS_FILE = path.join(__dirname, "users.json");

// =======================
// ESTADO GLOBAL
// =======================
let connectedUsers = {}; // socketId -> user
let playerVotes = {}; // MostLikely
let indexQuestion = 0;

// Trivial
let trivialIndex = 0;
let trivialAnswers = {}; // username -> answer
let triviaResolved = false;

// =======================
// SERVIDOR
// =======================
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// =======================
// LOGIN
// =======================
app.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ ok: false });

  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const found = users.find(
    u => u.username === username && u.password === password
  );

  if (!found)
    return res.status(401).json({ ok: false });

  const { password: _, ...safeUser } = found;
  res.json({ ok: true, user: safeUser });
});

// =======================
// SOCKETS
// =======================
io.on("connection", socket => {
  console.log("🔌 conectado", socket.id);

  // -----------------------
  // JOIN
  // -----------------------
  socket.on("join", user => {
    if (!user?.username) return;

    const existing = Object.values(connectedUsers).find(
      u => u.username.toLowerCase() === user.username.toLowerCase()
    );

    if (existing) {
      delete connectedUsers[existing.socketId];
    }

    connectedUsers[socket.id] = { ...user, socketId: socket.id };
    io.emit("connectedUsers", Object.values(connectedUsers));
  });

  // ======================
  // MOST LIKELY
  // ======================

  socket.on("start-game", () => {
    console.log("🔥 START GAME");
    io.emit("game-started");
  });

  socket.on("submitVote", ({ username, votedFor }) => {
    playerVotes[username] = votedFor;
  });

  socket.on("checkVotes", () => {
    if (!Object.keys(playerVotes).length) return;

    const counts = {};
    Object.values(playerVotes).forEach(v => {
      counts[v] = (counts[v] || 0) + 1;
    });

    const winner = Object.entries(counts).reduce(
      (a, b) => (b[1] > a[1] ? b : a),
      ["", 0]
    )[0];

    Object.values(connectedUsers).forEach(u => {
      if (playerVotes[u.username] === winner) {
        u.puntos = (u.puntos || 0) + 1;
      }
    });

    playerVotes = {};

    io.emit("votesChecked", {
      winner,
      scores: Object.values(connectedUsers).map(u => ({
        username: u.username,
        puntos: u.puntos
      }))
    });
  });

  socket.on("requestQuestion", ({ fromAdmin }) => {
    if (!fromAdmin) return;

    if (indexQuestion >= questionsMostLikely.length) {
      io.emit("mostLikelyFinished");
      return;
    }

    const q = questionsMostLikely[indexQuestion].question;
    indexQuestion++;
    io.emit("newQuestion", q);
  });

  // ======================
  // TRIVIAL
  // ======================
  socket.on("requestTrivialQuestion", () => {
    const q = questionsTrivia[trivialIndex];
    if (!q) {
      io.emit("trivialFinished");
      return;
    }

    triviaResolved = false;
    trivialAnswers = {};

    io.emit("newTrivialQuestion", {
      question: q.question,
      answers: q.answers
    });
  });

  socket.on("submitTrivialAnswer", ({ username, answer }) => {
    if (triviaResolved) return;
    trivialAnswers[username] = answer;
  });

  socket.on("resolveTrivialQuestion", () => {
    if (triviaResolved) return;
    triviaResolved = true;

    const correct = questionsTrivia[trivialIndex].correct;

    Object.entries(trivialAnswers).forEach(([user, answer]) => {
      const u = Object.values(connectedUsers).find(
        cu => cu.username === user
      );

      if (u && answer === correct) {
        u.puntos = (u.puntos || 0) + 1;
      }

      io.emit("trivialResult", {
        username: user,
        correct: answer === correct
      });
    });
  });

  socket.on("nextTrivialQuestion", () => {
    trivialIndex++;

    if (trivialIndex >= questionsTrivia.length) {
      io.emit("trivialFinished");
      return;
    }

    triviaResolved = false;
    trivialAnswers = {};

    const q = questionsTrivia[trivialIndex];
    io.emit("newTrivialQuestion", {
      question: q.question,
      answers: q.answers
    });
  });

  // -----------------------
  // DISCONNECT
  // -----------------------
  socket.on("disconnect", () => {
    delete connectedUsers[socket.id];
    io.emit("connectedUsers", Object.values(connectedUsers));
  });
});

// =======================
// START
// =======================
const PORT = 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server en http://localhost:${PORT}`)
);
