require('dotenv').config();

// Fail fast when production would otherwise accept tokens signed with a
// development fallback secret.
require('./config/jwtSecret').getJwtSecret();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { startWorker } = require('./services/notificationQueueService');
const initSockets = require('./sockets/index');
const initLiveSocket = require('./src/live/liveSocket');
const { initForumSocket } = require('./src/websocket/forumSocket');

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);
require('./lms').startLmsWorker(app, io);
initSockets(io);
initLiveSocket(io);
initForumSocket(io);

httpServer.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`Thinkz LMS Backend running on port ${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log('[socket] Socket.IO attached and listening');
});

startWorker();

module.exports = httpServer;

// Temporary script to inject a test user automatically
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedTestUser() {
  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: "test@test.com" }
    });
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: "test@test.com",
          password: "password123", 
          name: "Test Learner",
          role: "Learner"
        }
      });
      console.log("✅ Test user 'test@test.com' injected successfully!");
    } else {
      console.log("ℹ️ Test user already exists in the database.");
    }
  } catch (err) {
    console.error("❌ Failed to inject user:", err.message);
  }
}
// Run the script 3 seconds after the server boots up
setTimeout(seedTestUser, 3000);