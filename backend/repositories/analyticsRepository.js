const prisma = require("../config/database");

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

const getEnrollmentTrends = async () => {

    const enrollments =
        await prisma.enrollment.findMany({

            select: {
                enrolledAt: true
            },

            orderBy: {
                enrolledAt: "asc"
            }
        });


    const trends = {};


    for (const enrollment of enrollments) {

        const date =
            enrollment.enrolledAt
                .toISOString()
                .slice(0, 10);


        trends[date] =
            (trends[date] || 0) + 1;
    }


    return Object.entries(trends).map(
        ([date, count]) => ({
            date,
            enrollments: count
        })
    );
};

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

const getCourseCompletionRates = async () => {

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


    for (const course of courses) {

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


        /*
         * Create a Set so lesson lookup
         * is fast.
         */
        const courseLessonIdSet =
            new Set(courseLessonIds);


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


        /*
         * Calculate completion for
         * every enrollment.
         */
        for (const enrollment of enrollments) {

            /*
             * Only count completed lessons
             * that actually belong to this course.
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
                                courseLessonIdSet.has(
                                    lessonId
                                )
                        )
                );


            const completedLessons =
                completedLessonIds.size;


            /*
             * Calculate completion percentage.
             */
            const completionPercentage =
                totalLessons === 0
                    ? 0
                    : (
                        completedLessons /
                        totalLessons
                    ) * 100;


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


        /*
         * Calculate final course
         * completion rate.
         */
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

            completionRate
        });
    }


    return result;
};

const getAssessmentAnalytics = async (options = {}) => {
    const dateFilter = buildDateFilter(options.fromDate, options.toDate, "submittedAt");
    const submissions = await prisma.assessmentSubmission.findMany({
        where: { ...(dateFilter || {}), status: { in: ["COMPLETED", "GRADED", "PASSED"] } },
        select: { id: true, score: true, totalMarks: true, percentage: true, status: true,
            assessment: { select: { passPercentage: true } } },
        orderBy: { id: "asc" }
    });
    const final = submissions.filter(row =>
        ["COMPLETED", "GRADED", "PASSED"].includes(row.status) &&
        Number.isFinite(row.score) && row.score >= 0 &&
        Number.isFinite(row.totalMarks) && row.totalMarks > 0 && row.score <= row.totalMarks &&
        Number.isFinite(row.percentage) && row.percentage >= 0 && row.percentage <= 100 &&
        Number.isFinite(row.assessment?.passPercentage) &&
        row.assessment.passPercentage >= 0 && row.assessment.passPercentage <= 100
    );
    const totalSubmissions = final.length;
    const round = value => Number(value.toFixed(2));
    const average = key => totalSubmissions ? round(final.reduce((sum,row) => sum + row[key],0) / totalSubmissions) : 0;
    const passed = final.filter(row => row.percentage >= row.assessment.passPercentage).length;
    return {
        totalSubmissions, averageScore: average("score"), averagePercentage: average("percentage"),
        highestScore: totalSubmissions ? Math.max(...final.map(row => row.score)) : 0,
        lowestScore: totalSubmissions ? Math.min(...final.map(row => row.score)) : 0,
        passed, failed: totalSubmissions - passed,
        passRate: totalSubmissions ? round(passed / totalSubmissions * 100) : 0
    };
};

module.exports = { getEnrollmentTrends, getCourseEnrollments, getCourseCompletionRates, getAssessmentAnalytics };
