const service =
    require("../services/analyticsService");


/*
 * ============================================================
 * GET ENROLLMENT TRENDS
 * ============================================================
 *
 * Query parameters:
 *
 * period:
 *   DAILY
 *   MONTHLY
 *   YEARLY
 *   CUSTOM
 *
 * fromDate:
 *   YYYY-MM-DD
 *
 * toDate:
 *   YYYY-MM-DD
 *
 * Examples:
 *
 * /api/analytics/enrollment-trends
 *
 * /api/analytics/enrollment-trends
 * ?period=MONTHLY
 * &fromDate=2026-01-01
 * &toDate=2026-08-27
 *
 * ============================================================
 */

const getEnrollmentTrends = async (
    req,
    res
) => {

    try {

        const {
            period,
            fromDate,
            toDate
        } = req.query;


        const trends =
            await service.getEnrollmentTrends({

                period,

                fromDate,

                toDate

            });


        return res.status(200).json({

            success: true,

            filters: {

                period:
                    period
                        ? String(period)
                            .toUpperCase()
                        : "DAILY",

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null

            },

            data:
                trends

        });

    } catch (error) {

        console.error(
            "Get enrollment trends error:",
            error
        );


        const message =
            error?.message ||
            "Failed to get enrollment trends";


        if (
            message.includes(
                "fromDate"
            ) ||
            message.includes(
                "toDate"
            ) ||
            message.includes(
                "period must be"
            )
        ) {

            return res.status(400).json({

                success: false,

                message

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to get enrollment trends"

        });
    }
};


/*
 * ============================================================
 * GET COURSE ENROLLMENTS
 * ============================================================
 *
 * Returns enrollment count for every course.
 *
 * Supports:
 *
 * fromDate
 * toDate
 *
 * Example:
 *
 * /api/analytics/course-enrollments
 * ?fromDate=2026-08-01
 * &toDate=2026-08-27
 *
 * ============================================================
 */

const getCourseEnrollments = async (
    req,
    res
) => {

    try {

        const {
            period,
            fromDate,
            toDate
        } = req.query;


        const courseEnrollments =
            await service.getCourseEnrollments({

                period,

                fromDate,

                toDate

            });


        return res.status(200).json({

            success: true,

            filters: {

                period:
                    period
                        ? String(period)
                            .toUpperCase()
                        : "DAILY",

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null

            },

            data:
                courseEnrollments

        });

    } catch (error) {

        console.error(
            "Get course enrollments error:",
            error
        );


        const message =
            error?.message ||
            "Failed to get course enrollments";


        if (
            message.includes(
                "fromDate"
            ) ||
            message.includes(
                "toDate"
            ) ||
            message.includes(
                "period must be"
            )
        ) {

            return res.status(400).json({

                success: false,

                message

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to get course enrollments"

        });
    }
};


/*
 * ============================================================
 * GET COURSE COMPLETION RATES
 * ============================================================
 *
 * Supports:
 *
 * fromDate
 * toDate
 *
 * Example:
 *
 * /api/analytics/course-completion-rates
 * ?fromDate=2026-08-01
 * &toDate=2026-08-27
 *
 * ============================================================
 */

const getCourseCompletionRates = async (
    req,
    res
) => {

    try {

        const {
            period,
            fromDate,
            toDate
        } = req.query;


        const completionRates =
            await service.getCourseCompletionRates({

                period,

                fromDate,

                toDate

            });


        return res.status(200).json({

            success: true,

            filters: {

                period:
                    period
                        ? String(period)
                            .toUpperCase()
                        : "DAILY",

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null

            },

            data:
                completionRates

        });

    } catch (error) {

        console.error(
            "Get course completion rates error:",
            error
        );


        const message =
            error?.message ||
            "Failed to get course completion rates";


        if (
            message.includes(
                "fromDate"
            ) ||
            message.includes(
                "toDate"
            ) ||
            message.includes(
                "period must be"
            )
        ) {

            return res.status(400).json({

                success: false,

                message

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to get course completion rates"

        });
    }
};


/*
 * ============================================================
 * GET ASSESSMENT ANALYTICS
 * ============================================================
 *
 * Supports:
 *
 * fromDate
 * toDate
 *
 * Example:
 *
 * /api/analytics/assessment
 * ?fromDate=2026-08-01
 * &toDate=2026-08-27
 *
 * ============================================================
 */

const getAssessmentAnalytics = async (
    req,
    res
) => {

    try {

        const {
            period,
            fromDate,
            toDate
        } = req.query;


        const analytics =
            await service.getAssessmentAnalytics({

                period,

                fromDate,

                toDate

            });


        return res.status(200).json({

            success: true,

            filters: {

                period:
                    period
                        ? String(period)
                            .toUpperCase()
                        : "DAILY",

                fromDate:
                    fromDate || null,

                toDate:
                    toDate || null

            },

            data:
                analytics

        });

    } catch (error) {

        console.error(
            "Get assessment analytics error:",
            error
        );


        const message =
            error?.message ||
            "Failed to get assessment analytics";


        if (
            message.includes(
                "fromDate"
            ) ||
            message.includes(
                "toDate"
            ) ||
            message.includes(
                "period must be"
            )
        ) {

            return res.status(400).json({

                success: false,

                message

            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to get assessment analytics"

        });
    }
};


/*
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

    getEnrollmentTrends,

    getCourseEnrollments,

    getCourseCompletionRates,

    getAssessmentAnalytics

};