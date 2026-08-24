const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const courseRoutes = require("./routes/courseRoutes");
const batchRoutes = require("./routes/batchRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const lessonProgressRoutes = require("./routes/lessonProgressRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const codeExecutionRoutes = require("./routes/codeExecutionRoutes");
const auditLogRoutes = require("./routes/auditLogs");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(morgan("dev"));

app.use(
    "/api/audit-logs",
    auditLogRoutes
);

app.use(
    "/api/analytics",
    analyticsRoutes
);

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Thinkz LMS API",
            version: "1.0.0",
            description:
                "Course, Batch, Enrollment, Assessment and Code Execution APIs"
        },

        servers: [
            {
                url: "http://localhost:5000"
            }
        ]
    },

    apis: ["./routes/*.js"]
};

const swaggerSpec =
    swaggerJsdoc(swaggerOptions);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message:
            "Thinkz LMS Backend Running Successfully"
    });
});

app.use(
    "/certificates",
    express.static(
        path.join(
            __dirname,
            "generated/certificates"
        )
    )
);

app.use(
    "/api/courses",
    courseRoutes
);

app.use(
    "/api/batches",
    batchRoutes
);

app.use(
    "/api/enrollments",
    enrollmentRoutes
);

app.use(
    "/api/modules",
    moduleRoutes
);

app.use(
    "/api/lessons",
    lessonRoutes
);

app.use(
    "/api/lesson-progress",
    lessonProgressRoutes
);

app.use(
    "/api/certificates",
    certificateRoutes
);

app.use(
    "/api/assessments",
    assessmentRoutes
);

app.use(
    "/api/code",
    codeExecutionRoutes
);

// ---------------------------------------------------------------------
// Forum module (self-contained: discussions, comments, categories,
// bookmarks, notifications, moderation, live studio).
// Mounted last on purpose — it can never shadow the routes above.
// ---------------------------------------------------------------------

app.use(
    "/api",
    require("./src/routes")
);

module.exports = app;