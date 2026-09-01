const repository =
    require("../repositories/analyticsRepository");


/*
 * ============================================================
 * VALIDATION HELPERS
 * ============================================================
 */

const validateDate = (
    value,
    fieldName
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
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
        new Date(
            `${value}T00:00:00.000Z`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        throw new Error(
            `Invalid ${fieldName}`
        );
    }


    return value;
};


/*
 * Validate analytics options.
 */
const validateOptions = (
    options = {}
) => {

    const {
        fromDate,
        toDate,
        period
    } = options;


    const validFromDate =
        validateDate(
            fromDate,
            "fromDate"
        );


    const validToDate =
        validateDate(
            toDate,
            "toDate"
        );


    if (
        validFromDate &&
        validToDate
    ) {

        const from =
            new Date(
                `${validFromDate}T00:00:00.000Z`
            );

        const to =
            new Date(
                `${validToDate}T00:00:00.000Z`
            );


        if (from > to) {

            throw new Error(
                "fromDate cannot be greater than toDate"
            );
        }
    }


    let validPeriod =
        period
            ? String(period)
                .trim()
                .toUpperCase()
            : "DAILY";


    const allowedPeriods = [
        "DAILY",
        "MONTHLY",
        "YEARLY",
        "CUSTOM"
    ];


    if (
        !allowedPeriods.includes(
            validPeriod
        )
    ) {

        throw new Error(
            "period must be DAILY, MONTHLY, YEARLY, or CUSTOM"
        );
    }


    /*
     * CUSTOM requires a date range.
     */
    if (
        validPeriod === "CUSTOM" &&
        (
            !validFromDate ||
            !validToDate
        )
    ) {

        throw new Error(
            "fromDate and toDate are required when period is CUSTOM"
        );
    }


    return {

        fromDate:
            validFromDate,

        toDate:
            validToDate,

        period:
            validPeriod
    };
};


/*
 * ============================================================
 * ENROLLMENT TRENDS
 * ============================================================
 */

const getEnrollmentTrends = async (
    options = {}
) => {

    const validatedOptions =
        validateOptions(
            options
        );


    return await repository
        .getEnrollmentTrends(
            validatedOptions
        );
};


/*
 * ============================================================
 * COURSE-WISE ENROLLMENTS
 * ============================================================
 */

const getCourseEnrollments = async (
    options = {}
)=> {

    const validatedOptions =
        validateOptions(
            options
        );


    return await repository
        .getCourseEnrollments(
            validatedOptions
        );
};


/*
 * ============================================================
 * COURSE COMPLETION RATES
 * ============================================================
 */

const getCourseCompletionRates = async (
    options = {}
) => {

    const validatedOptions =
        validateOptions(
            options
        );


    return await repository
        .getCourseCompletionRates(
            validatedOptions
        );
};


/*
 * ============================================================
 * ASSESSMENT ANALYTICS
 * ============================================================
 */

const getAssessmentAnalytics = async (
    options = {}
) => {

    const validatedOptions =
        validateOptions(
            options
        );


    return await repository
        .getAssessmentAnalytics(
            validatedOptions
        );
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