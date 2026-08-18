require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // tighten this later once frontend origin is known
});

const {activeConnections,roomMembers}=require('./sockets')(io);
app.get('/api/socket/state', (req, res) => {
  const connections = Array.from(activeConnections.entries()).map(([socketId, data]) => ({
    socketId,
    userId: data.userId,
    role: data.role,
    rooms: Array.from(data.rooms),
    connectedAt: data.connectedAt,
  }));

  const rooms = Array.from(roomMembers.entries()).map(([roomName, members]) => ({
    roomName,
    memberCount: members.size,
    members: Array.from(members),
  }));

  res.json({
    totalConnections: connections.length,
    connections,
    rooms,
  });
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'think-ai-backend'
    });
});
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
