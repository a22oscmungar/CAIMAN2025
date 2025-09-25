// server/index.js

console.log('Starting server...');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const USERS_FILE = path.join(__dirname, 'users.json');
let connectedUsers = {}; // socketId -> user object

// Endpoint simple de login
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, msg: 'username y password requeridos' });

  let users = JSON.parse(fs.readFileSync(USERS_FILE));
  const found = users.find(u => u.username === username && u.password === password);
  if (!found) return res.status(401).json({ ok: false, msg: 'credenciales inválidas' });

  // Devuelve solo info segura (sin password)
  const { password: _p, ...userSafe } = found;
  return res.json({ ok: true, user: userSafe });
});

// Socket.io para comunicación en tiempo real
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // El cliente emite 'join' después del login
  socket.on('join', (user) => {
  if (!user || !user.username) return;

  // Normalizamos el nombre por si viene en mayúsculas/minúsculas
  const usernameKey = user.username.toLowerCase();

  // Buscar si ya existe un usuario con ese username
  const alreadyConnected = Object.values(connectedUsers).find(
    (u) => u.username.toLowerCase() === usernameKey
  );

  if (alreadyConnected) {
    // Si ya existe, solo actualizamos el socketId (por si refrescó la página)
    connectedUsers[alreadyConnected.socketId] = {
      ...alreadyConnected,
      socketId: socket.id,
    };
    // Borramos el antiguo para evitar duplicados
    if (alreadyConnected.socketId !== socket.id) {
      delete connectedUsers[alreadyConnected.socketId];
    }
  } else {
    // Si no existe, lo añadimos normalmente
    connectedUsers[socket.id] = { ...user, socketId: socket.id };
  }

  // Notifica a todos los clientes la lista actualizada
  io.emit('connectedUsers', Object.values(connectedUsers));
  console.log('user joined', user.username);
});

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    if (connectedUsers[socket.id]) {
      delete connectedUsers[socket.id];
      io.emit('connectedUsers', Object.values(connectedUsers));
    }
  });

  // Evento placeholder para iniciar el juego
  socket.on('start-game', () => {
    io.emit('game-started');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));