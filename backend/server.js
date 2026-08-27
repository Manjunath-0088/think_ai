const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const { startWorker } = require("./services/notificationQueueService");
require("./config/db");

const roleMatrixRoutes = require("./routes/roleMatrix");
const courseRoutes = require("./routes/courseRoutes");
const batchRoutes = require("./routes/batchRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");   // <-- added
const lessonRoutes = require("./routes/lessonRoutes");           // <-- added
const adminUsersRoutes = require("./routes/adminUsers");
const auditLogRoutes = require("./routes/auditLog");
const notificationPreferenceRoutes = require("./routes/notificationPreferences");
const initSockets = require("./sockets/index");
const assessmentRoutes = require("./routes/assessmentRoutes");
// ...also add these if you need them and they're missing here too:
const certificateRoutes = require("./routes/certificateRoutes");
const lessonProgressRoutes = require("./routes/lessonProgressRoutes");
const codeExecutionRoutes = require("./routes/codeExecutionRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/roles", roleMatrixRoutes);

app.get("/", (req, res) => {
    res.json({ success: true, message: "LMS Backend API Running Successfully" });
});

app.use("/api/courses", courseRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/enrollments", enrollmentRoutes);   // <-- added
app.use("/api/lessons", lessonRoutes);           // <-- added
app.use("/admin", adminUsersRoutes);
app.use("/api/audit-log", auditLogRoutes);
app.use("/api/notifications", notificationPreferenceRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/lesson-progress", lessonProgressRoutes);
app.use("/api/code", codeExecutionRoutes);

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
initSockets(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("[socket] Socket.IO attached and listening");
});

startWorker();
module.exports = app;
