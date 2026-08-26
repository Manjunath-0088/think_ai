/*
 * ----------------------------------------------------
 * Validation helpers
 * ----------------------------------------------------
 */

const VALID_STATUSES = new Set([
    "ACTIVE",
    "INACTIVE"
]);


const isPositiveInteger = (value) => {

    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number > 0
    );
};


const isNonEmptyString = (value) => {

    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};


const parseValidDate = (value) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
};


/*
 * ----------------------------------------------------
 * Validate batch creation
 * ----------------------------------------------------
 */

const validateBatchCreate = (
    req,
    res,
    next
) => {

    const {
        name,
        courseId,
        instructorName,
        capacity,
        startDate,
        endDate,
        status
    } = req.body;


    const errors = [];


    /*
     * Batch name
     */

    if (!isNonEmptyString(name)) {

        errors.push(
            "name is required"
        );
    }


    /*
     * Course ID
     */

    if (
        !isPositiveInteger(courseId)
    ) {

        errors.push(
            "courseId must be a positive integer"
        );
    }


    /*
     * Instructor
     */

    if (!isNonEmptyString(instructorName)) {

        errors.push(
            "instructorName is required"
        );
    }


    /*
     * Capacity
     */

    if (
        !isPositiveInteger(capacity)
    ) {

        errors.push(
            "capacity must be a positive integer"
        );
    }


    /*
     * Start date
     */

    const start =
        parseValidDate(startDate);


    if (!start) {

        errors.push(
            "startDate must be a valid date"
        );
    }


    /*
     * End date
     */

    const end =
        parseValidDate(endDate);


    if (!end) {

        errors.push(
            "endDate must be a valid date"
        );
    }


    /*
     * Date relationship
     */

    if (
        start &&
        end &&
        start >= end
    ) {

        errors.push(
            "startDate must be before endDate"
        );
    }


    /*
     * Status
     */

    if (
        status !== undefined &&
        !VALID_STATUSES.has(status)
    ) {

        errors.push(
            "status must be either ACTIVE or INACTIVE"
        );
    }


    /*
     * Return validation errors
     */

    if (errors.length > 0) {

        return res.status(400).json({

            success: false,

            message:
                "Batch validation failed",

            errors
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate batch update
 * ----------------------------------------------------
 *
 * All fields are optional.
 * At least one field must be supplied.
 * ----------------------------------------------------
 */

const validateBatchUpdate = (
    req,
    res,
    next
) => {

    const {
        name,
        courseId,
        instructorName,
        capacity,
        startDate,
        endDate,
        status
    } = req.body;


    const errors = [];


    /*
     * Empty body
     */

    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body) ||
        Object.keys(req.body).length === 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "At least one field is required for update"
        });
    }


    /*
     * Batch name
     */

    if (
        name !== undefined &&
        !isNonEmptyString(name)
    ) {

        errors.push(
            "name must be a non-empty string"
        );
    }


    /*
     * Course ID
     */

    if (
        courseId !== undefined &&
        !isPositiveInteger(courseId)
    ) {

        errors.push(
            "courseId must be a positive integer"
        );
    }


    /*
     * Instructor
     */

    if (
        instructorName !== undefined &&
        instructorName !== null &&
        !isNonEmptyString(instructorName)
    ) {

        errors.push(
            "instructorName must be a non-empty string"
        );
    }


    /*
     * Capacity
     */

    if (
        capacity !== undefined &&
        !isPositiveInteger(capacity)
    ) {

        errors.push(
            "capacity must be a positive integer"
        );
    }


    /*
     * Start date
     */

    let start = null;

    if (startDate !== undefined) {

        start =
            parseValidDate(startDate);


        if (!start) {

            errors.push(
                "startDate must be a valid date"
            );
        }
    }


    /*
     * End date
     */

    let end = null;

    if (endDate !== undefined) {

        end =
            parseValidDate(endDate);


        if (!end) {

            errors.push(
                "endDate must be a valid date"
            );
        }
    }


    /*
     * Validate date order when
     * both are supplied.
     */

    if (
        start &&
        end &&
        start >= end
    ) {

        errors.push(
            "startDate must be before endDate"
        );
    }


    /*
     * Status
     */

    if (
        status !== undefined &&
        !VALID_STATUSES.has(status)
    ) {

        errors.push(
            "status must be either ACTIVE or INACTIVE"
        );
    }


    /*
     * Return validation errors
     */

    if (errors.length > 0) {

        return res.status(400).json({

            success: false,

            message:
                "Batch validation failed",

            errors
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate batch ID
 * ----------------------------------------------------
 */

const validateBatchId = (
    req,
    res,
    next
) => {

    if (
        !isPositiveInteger(
            req.params.id
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Batch ID must be a positive integer"
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate course ID
 * ----------------------------------------------------
 */

const validateBatchCourseId = (
    req,
    res,
    next
) => {

    if (
        !isPositiveInteger(
            req.params.courseId
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Course ID must be a positive integer"
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate batch enrollment ID
 * ----------------------------------------------------
 */

const validateBatchEnrollmentId = (
    req,
    res,
    next
) => {

    if (
        !isPositiveInteger(
            req.params.batchId
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Batch ID must be a positive integer"
        });
    }


    next();
};


module.exports = {

    validateBatchCreate,

    validateBatchUpdate,

    validateBatchId,

    validateBatchCourseId,

    validateBatchEnrollmentId
};