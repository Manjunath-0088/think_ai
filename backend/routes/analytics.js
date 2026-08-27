const express = require("express");

const router = express.Router();


const {
    getEnrollmentTrends,
    getCourseEnrollments,
    getCourseCompletionRates,
    getAssessmentAnalytics
} = require("../controllers/analyticsController");


const prisma =
    require("../config/database");


// ----------------------------------------------------
// Swagger
// ----------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Course Analytics APIs
 */


/**
 * @swagger
 * /api/analytics/enrollments:
 *   get:
 *     summary: Get enrollment trends
 *     description: >
 *       Returns enrollment counts grouped by daily, monthly,
 *       or yearly periods. Optional date filtering is supported.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - DAILY
 *             - MONTHLY
 *             - YEARLY
 *             - CUSTOM
 *           default: DAILY
 *         description: Group enrollment data by day, month, year, or custom date range.
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-01
 *         description: Start date in YYYY-MM-DD format.
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-27
 *         description: End date in YYYY-MM-DD format.
 *     responses:
 *       200:
 *         description: Enrollment trend data
 *       400:
 *         description: Invalid analytics filters
 *       500:
 *         description: Failed to get enrollment trends
 */
router.get(
    "/enrollments",
    getEnrollmentTrends
);


/**
 * @swagger
 * /api/analytics/course-enrollments:
 *   get:
 *     summary: Get course-wise enrollments
 *     description: >
 *       Returns enrollment counts for each course.
 *       Optional date filtering is supported.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-01
 *         description: Start date in YYYY-MM-DD format.
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-27
 *         description: End date in YYYY-MM-DD format.
 *     responses:
 *       200:
 *         description: Course-wise enrollment analytics
 *       400:
 *         description: Invalid analytics filters
 *       500:
 *         description: Failed to get course enrollments
 */
router.get(
    "/course-enrollments",
    getCourseEnrollments
);


/**
 * @swagger
 * /api/analytics/course-completion:
 *   get:
 *     summary: Get course completion rates
 *     description: >
 *       Returns course enrollment and completion statistics.
 *       An enrollment is considered completed when it reaches
 *       at least 80 percent lesson completion.
 *       Optional date filtering is supported.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-01
 *         description: Start date in YYYY-MM-DD format.
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-27
 *         description: End date in YYYY-MM-DD format.
 *     responses:
 *       200:
 *         description: Course completion analytics
 *       400:
 *         description: Invalid analytics filters
 *       500:
 *         description: Failed to get course completion rates
 */
router.get(
    "/course-completion",
    getCourseCompletionRates
);


/**
 * @swagger
 * /api/analytics/assessment:
 *   get:
 *     summary: Get assessment analytics
 *     description: >
 *       Returns assessment submission statistics including
 *       total submissions, passed, failed, average score,
 *       highest score, lowest score, average percentage,
 *       and pass rate.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-01
 *         description: Start date in YYYY-MM-DD format.
 *       - in: query
 *         name: toDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-08-27
 *         description: End date in YYYY-MM-DD format.
 *     responses:
 *       200:
 *         description: Assessment analytics
 *       400:
 *         description: Invalid analytics filters
 *       500:
 *         description: Failed to get assessment analytics
 */
router.get(
    "/assessment",
    getAssessmentAnalytics
);


/**
 * @swagger
 * /api/analytics/heatmap:
 *   get:
 *     summary: Get audit log activity heatmap
 *     description: >
 *       Returns audit log events from the last 7 days
 *       grouped by date and hour.
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Audit log heatmap data
 *       500:
 *         description: Failed to build heatmap
 */
router.get(
    "/heatmap",
    async (req, res) => {

        try {

            const sevenDaysAgo =
                new Date(
                    Date.now() -
                    7 * 24 * 60 * 60 * 1000
                );


            const logs =
                await prisma.auditLog.findMany({

                    where: {

                        createdAt: {
                            gte:
                                sevenDaysAgo
                        }

                    },

                    select: {

                        createdAt: true,

                        action: true

                    }

                });


            const heatmap = {};


            logs.forEach((log) => {

                const day =
                    log.createdAt
                        .toISOString()
                        .slice(0, 10);


                const hour =
                    log.createdAt
                        .getUTCHours();


                const key =
                    `${day}-${hour}`;


                heatmap[key] =
                    (
                        heatmap[key] || 0
                    ) + 1;

            });


            return res.status(200).json({

                success: true,

                heatmap,

                totalEvents:
                    logs.length

            });

        } catch (error) {

            console.error(
                "Heatmap error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to build heatmap"

            });
        }
    }
);


module.exports = router;