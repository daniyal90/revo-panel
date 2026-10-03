const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('join', (room) => {
    if (room) socket.join(room);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.post('/emit', (req, res) => {
  const { event, payload, room } = req.body || {};
  if (!event) return res.status(400).json({ error: 'event required' });
  if (room) io.to(room).emit(event, payload);
  else io.emit(event, payload);
  return res.json({ ok: true });
});

const port = process.env.SOCKET_PORT || 4001;
server.listen(port, () => console.log(`Socket server listening on ${port}`));

module.exports = {
  emit: (event, payload) => io.emit(event, payload),
  to: (room) => io.to(room),
};
