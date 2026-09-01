const prisma =
    require("../config/database");


/*
 * ============================================================
 * DATE HELPERS
 * ============================================================
 */


/*
 * Convert a date value into a Date object.
 *
 * Supported input:
 * YYYY-MM-DD
 */
const parseDate = (value, fieldName) => {

    if (!value) {
        return null;
    }


    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        throw new Error(
            `${fieldName} must be in YYYY-MM-DD format`
        );
    }


    const date =
        new Date(`${value}T00:00:00.000Z`);


    if (Number.isNaN(date.getTime())) {

        throw new Error(
            `Invalid ${fieldName}`
        );
    }


    return date;
};


/*
 * Build date filter.
 *
 * toDate is made inclusive by using
 * the next day as the exclusive upper bound.
 */
const buildDateFilter = (
    fromDate,
    toDate,
    field = "enrolledAt"
) => {

    const filter = {};


    const from =
        parseDate(
            fromDate,
            "fromDate"
        );


    const to =
        parseDate(
            toDate,
            "toDate"
        );


    if (from && to && from > to) {

        throw new Error(
            "fromDate cannot be greater than toDate"
        );
    }


    if (from) {
        filter.gte = from;
    }


    if (to) {

        const nextDay =
            new Date(to);

        nextDay.setUTCDate(
            nextDay.getUTCDate() + 1
        );

        filter.lt = nextDay;
    }


    if (
        Object.keys(filter).length === 0
    ) {
        return undefined;
    }


    return {
        [field]: filter
    };
};


/*
 * Normalize period.
 */
const normalizePeriod = (period) => {

    if (!period) {
        return "DAILY";
    }


    const normalized =
        String(period)
            .trim()
            .toUpperCase();


    const allowedPeriods = [
        "DAILY",
        "MONTHLY",
        "YEARLY",
        "CUSTOM"
    ];


    if (
        !allowedPeriods.includes(
            normalized
        )
    ) {

        throw new Error(
            "period must be DAILY, MONTHLY, YEARLY, or CUSTOM"
        );
    }


    return normalized;
};


/*
 * Create a grouping key.
 */
const getPeriodKey = (
    date,
    period
) => {

    const year =
        date.getUTCFullYear();


    const month =
        String(
            date.getUTCMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getUTCDate()
        ).padStart(2, "0");


    if (period === "YEARLY") {

        return String(year);
    }


    if (period === "MONTHLY") {

        return `${year}-${month}`;
    }


    return `${year}-${month}-${day}`;
};


/*
 * ============================================================
 * ENROLLMENT TRENDS
 * ============================================================
 *
 * Example:
 *
 * GET /api/analytics/enrollment-trends
 *
 * GET /api/analytics/enrollment-trends
 *     ?period=MONTHLY
 *
 * GET /api/analytics/enrollment-trends
 *     ?period=DAILY
 *     &fromDate=2026-08-01
 *     &toDate=2026-08-27
 *
 * GET /api/analytics/enrollment-trends
 *     ?period=YEARLY
 *     &fromDate=2024-01-01
 *     &toDate=2026-12-31
 *
 * ============================================================
 */

const getEnrollmentTrends = async (
    options = {}
) => {

    const {
        fromDate,
        toDate,
        period
    } = options;


    const normalizedPeriod =
        normalizePeriod(period);


    /*
     * CUSTOM means exact date-range
     * grouping.
     *
     * We use DAILY for the actual
     * returned trend points.
     */
    const groupingPeriod =
        normalizedPeriod === "CUSTOM"
            ? "DAILY"
            : normalizedPeriod;


    const dateFilter =
        buildDateFilter(
            fromDate,
            toDate,
            "enrolledAt"
        );


    const enrollments =
        await prisma.enrollment.findMany({

            where:
                dateFilter || {},

            select: {
                enrolledAt: true
            },

            orderBy: {
                enrolledAt: "asc"
            }
        });


    const trends = {};


    for (
        const enrollment
        of enrollments
    ) {

        if (!enrollment.enrolledAt) {
            continue;
        }


        const date =
            new Date(
                enrollment.enrolledAt
            );


        const key =
            getPeriodKey(
                date,
                groupingPeriod
            );


        trends[key] =
            (
                trends[key] || 0
            ) + 1;
    }


    return Object.entries(trends)
        .map(
            ([periodValue, enrollments]) => ({

                period:
                    periodValue,

                enrollments
            })
        );
};


/*
 * ============================================================
 * COURSE-WISE ENROLLMENT
 * ============================================================
 */

const getCourseEnrollments = async (
    options = {}
) => {

    const {
        fromDate,
        toDate
    } = options;


    const enrollmentFilter =
        buildDateFilter(
            fromDate,
            toDate,
            "enrolledAt"
        );


    const courses =
        await prisma.course.findMany({

            select: {

                id: true,

                title: true,

                batches: {

                    select: {

                        enrollments: {

                            where:
                                enrollmentFilter
                                ? enrollmentFilter
                                : {},

                            select: {
                                id: true
                            }
                        }
                    }
                }
            },

            orderBy: {
                id: "asc"
            }
        });


    return courses.map(
        (course) => {

            const enrollments =
                course.batches.reduce(
                    (
                        total,
                        batch
                    ) =>
                        total +
                        batch.enrollments.length,
                    0
                );


            return {

                courseId:
                    course.id,

                courseName:
                    course.title,

                enrollments
            };
        }
    );
};


/*
 * ============================================================
 * COURSE COMPLETION RATES
 * ============================================================
 *
 * A course is considered completed when
 * an enrollment completes at least 80%
 * of the lessons belonging to that course.
 *
 * Date filtering is applied to enrollment date.
 *
 * ============================================================
 */

const getCourseCompletionRates = async (
    options = {}
) => {

    const {
        fromDate,
        toDate
    } = options;


    const enrollmentFilter =
        buildDateFilter(
            fromDate,
            toDate,
            "enrolledAt"
        );


    const courses =
        await prisma.course.findMany({

            select: {

                id: true,

                title: true,

                modules: {

                    select: {

                        lessons: {

                            select: {
                                id: true
                            }
                        }
                    }
                },

                batches: {

                    select: {

                        enrollments: {

                            where:
                                enrollmentFilter
                                ? enrollmentFilter
                                : {},

                            select: {

                                id: true,

                                lessonProgress: {

                                    where: {
                                        completed: true
                                    },

                                    select: {
                                        lessonId: true
                                    }
                                }
                            }
                        }
                    }
                }
            },

            orderBy: {
                id: "asc"
            }
        });


    const result = [];


    for (
        const course
        of courses
    ) {

        /*
         * Get all lesson IDs belonging
         * to this course.
         */
        const courseLessonIds =
            course.modules.flatMap(
                (module) =>
                    module.lessons.map(
                        (lesson) =>
                            lesson.id
                    )
            );


        const totalLessons =
            courseLessonIds.length;


        const courseLessonIdSet =
            new Set(
                courseLessonIds
            );


        /*
         * Get all enrollments belonging
         * to this course.
         */
        const enrollments =
            course.batches.flatMap(
                (batch) =>
                    batch.enrollments
            );


        const totalEnrollments =
            enrollments.length;


        let completedEnrollments = 0;


        let totalCompletionPercentage = 0;


        /*
         * Calculate completion for
         * every enrollment.
         */
        for (
            const enrollment
            of enrollments
        ) {

            /*
             * Only count completed lessons
             * that belong to this course.
             */
            const completedLessonIds =
                new Set(

                    enrollment.lessonProgress
                        .map(
                            (progress) =>
                                progress.lessonId
                        )
                        .filter(
                            (lessonId) =>
                                courseLessonIdSet
                                    .has(
                                        lessonId
                                    )
                        )
                );


            const completedLessons =
                completedLessonIds.size;


            const completionPercentage =
                totalLessons === 0
                    ? 0
                    : (
                        completedLessons /
                        totalLessons
                    ) * 100;


            totalCompletionPercentage +=
                completionPercentage;


            /*
             * 80% or more means
             * course completed.
             */
            if (
                completionPercentage >= 80
            ) {

                completedEnrollments++;
            }
        }


        const averageCompletionPercentage =
            totalEnrollments === 0
                ? 0
                : Number(
                    (
                        totalCompletionPercentage /
                        totalEnrollments
                    ).toFixed(2)
                );


        const completionRate =
            totalEnrollments === 0
                ? 0
                : Number(
                    (
                        (
                            completedEnrollments /
                            totalEnrollments
                        ) * 100
                    ).toFixed(2)
                );


        result.push({

            courseId:
                course.id,

            courseName:
                course.title,

            totalLessons,

            totalEnrollments,

            completedEnrollments,

            inProgressEnrollments:
                Math.max(
                    totalEnrollments -
                    completedEnrollments,
                    0
                ),

            averageCompletionPercentage,

            completionRate
        });
    }


    return result;
};


/*
 * ============================================================
 * ASSESSMENT ANALYTICS
 * ============================================================
 *
 * Calculates:
 *
 * - Total submissions
 * - Passed submissions
 * - Failed submissions
 * - Average score
 * - Highest score
 * - Lowest score
 * - Average percentage
 * - Pass rate
 *
 * Date filtering uses submittedAt.
 *
 * ============================================================
 */

const getAssessmentAnalytics = async (
    options = {}
) => {

    const {
        fromDate,
        toDate
    } = options;


    const submissionFilter =
        buildDateFilter(
            fromDate,
            toDate,
            "submittedAt"
        );


    const submissions =
        await prisma.assessmentSubmission.findMany({

            where:
                submissionFilter || {},

            select: {

                id: true,

                score: true,

                totalMarks: true,

                percentage: true,

                status: true
            },

            orderBy: {
                id: "asc"
            }
        });


    const totalSubmissions =
        submissions.length;


    let passed = 0;

    let failed = 0;

    let totalScore = 0;

    let totalPercentage = 0;


    let highestScore =
        totalSubmissions > 0
            ? Number(
                submissions[0].score || 0
            )
            : 0;


    let lowestScore =
        totalSubmissions > 0
            ? Number(
                submissions[0].score || 0
            )
            : 0;


    for (
        const submission
        of submissions
    ) {

        const score =
            Number(
                submission.score || 0
            );


        const percentage =
            Number(
                submission.percentage || 0
            );


        totalScore += score;

        totalPercentage +=
            percentage;


        if (
            score > highestScore
        ) {
            highestScore = score;
        }


        if (
            score < lowestScore
        ) {
            lowestScore = score;
        }


        /*
         * Treat COMPLETED submissions
         * with >= 40% as passed.
         *
         * If your assessment engine already
         * stores pass/fail status explicitly,
         * this can be changed later to use
         * that field.
         */
        if (
            percentage >= 40
        ) {

            passed++;

        } else {

            failed++;
        }
    }


    const averageScore =
        totalSubmissions === 0
            ? 0
            : Number(
                (
                    totalScore /
                    totalSubmissions
                ).toFixed(2)
            );


    const averagePercentage =
        totalSubmissions === 0
            ? 0
            : Number(
                (
                    totalPercentage /
                    totalSubmissions
                ).toFixed(2)
            );


    const passRate =
        totalSubmissions === 0
            ? 0
            : Number(
                (
                    (
                        passed /
                        totalSubmissions
                    ) * 100
                ).toFixed(2)
            );


    return {

        totalSubmissions,

        averageScore,

        averagePercentage,

        highestScore,

        lowestScore,

        passed,

        failed,

        passRate
    };
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