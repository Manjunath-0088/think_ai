require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");

const { startWorker } = require("./services/notificationQueueService");
const initSockets = require("./sockets/index");

require("./config/db");

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

initSockets(io);

// Forum Live Class Studio chat (Socket.IO namespace: /studio)
require("./src/websocket/chatSocket")(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("[socket] Socket.IO attached and listening");
});

startWorker();