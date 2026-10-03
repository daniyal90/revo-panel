// Optional small HTTP bridge to accept POST /emit and forward to Socket.IO server
const express = require('express');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('bridge socket connected', socket.id);
});

app.post('/emit', (req, res) => {
  const { event, payload, room } = req.body || {};
  if (room) io.to(room).emit(event, payload);
  else io.emit(event, payload);
  res.json({ ok: true });
});

const port = process.env.BRIDGE_PORT || 4001;
server.listen(port, () => console.log(`Socket bridge listening on ${port}`));
