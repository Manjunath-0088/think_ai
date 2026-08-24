require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

app.set("io", io);

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`Thinkz AI backend running on port ${PORT}`);
});

module.exports = httpServer;
