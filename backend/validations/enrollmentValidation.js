/*
 * ----------------------------------------------------
 * Constants
 * ----------------------------------------------------
 */

const VALID_ENROLLMENT_STATUSES = new Set([
    "ENROLLED",
    "COMPLETED",
    "CANCELLED"
]);


/*
 * ----------------------------------------------------
 * Helper functions
 * ----------------------------------------------------
 */

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


const isValidEmail = (value) => {

    if (!isNonEmptyString(value)) {
        return false;
    }

    const email =
        value.trim();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
};


/*
 * ----------------------------------------------------
 * Validate enrollment creation
 * ----------------------------------------------------
 */

const validateEnrollmentCreate = (
    req,
    res,
    next
) => {

    const {
        studentName,
        studentEmail,
        batchId,
        enrollmentStatus
    } = req.body || {};


    const errors = [];


    /*
     * Student name
     */

    if (
        !isNonEmptyString(studentName)
    ) {

        errors.push(
            "studentName is required"
        );
    }


    /*
     * Student email
     */

    if (
        !isNonEmptyString(studentEmail)
    ) {

        errors.push(
            "studentEmail is required"
        );

    } else if (
        !isValidEmail(studentEmail)
    ) {

        errors.push(
            "studentEmail must be a valid email"
        );
    }


    /*
     * Batch ID
     */

    if (
        !isPositiveInteger(batchId)
    ) {

        errors.push(
            "batchId must be a positive integer"
        );
    }


    /*
     * Enrollment status
     */

    if (
        enrollmentStatus !== undefined &&
        !VALID_ENROLLMENT_STATUSES.has(
            enrollmentStatus
        )
    ) {

        errors.push(
            "enrollmentStatus must be ENROLLED, COMPLETED, or CANCELLED"
        );
    }


    /*
     * Return validation errors
     */

    if (errors.length > 0) {

        return res.status(400).json({

            success: false,

            message:
                "Enrollment validation failed",

            errors
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate enrollment update
 * ----------------------------------------------------
 */

const validateEnrollmentUpdate = (
    req,
    res,
    next
) => {

    const {
        studentName,
        studentEmail,
        batchId,
        enrollmentStatus
    } = req.body || {};


    const errors = [];


    /*
     * Prevent empty update
     */

    if (
        !req.body ||
        Object.keys(req.body).length === 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "At least one field is required for update"
        });
    }


    /*
     * Student name
     */

    if (
        studentName !== undefined &&
        !isNonEmptyString(studentName)
    ) {

        errors.push(
            "studentName must be a non-empty string"
        );
    }


    /*
     * Student email
     */

    if (
        studentEmail !== undefined
    ) {

        if (
            !isNonEmptyString(studentEmail)
        ) {

            errors.push(
                "studentEmail must be a non-empty string"
            );

        } else if (
            !isValidEmail(studentEmail)
        ) {

            errors.push(
                "studentEmail must be a valid email"
            );
        }
    }


    /*
     * Batch ID
     */

    if (
        batchId !== undefined &&
        !isPositiveInteger(batchId)
    ) {

        errors.push(
            "batchId must be a positive integer"
        );
    }


    /*
     * Enrollment status
     */

    if (
        enrollmentStatus !== undefined &&
        !VALID_ENROLLMENT_STATUSES.has(
            enrollmentStatus
        )
    ) {

        errors.push(
            "enrollmentStatus must be ENROLLED, COMPLETED, or CANCELLED"
        );
    }


    /*
     * Return validation errors
     */

    if (errors.length > 0) {

        return res.status(400).json({

            success: false,

            message:
                "Enrollment validation failed",

            errors
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate enrollment ID
 * ----------------------------------------------------
 */

const validateEnrollmentId = (
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
                "Enrollment ID must be a positive integer"
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Validate enrollment route parameter
 *
 * Used for routes such as:
 * /enrollments/:enrollmentId
 * ----------------------------------------------------
 */

const validateEnrollmentParam = (
    req,
    res,
    next
) => {

    if (
        !isPositiveInteger(
            req.params.enrollmentId
        )
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Enrollment ID must be a positive integer"
        });
    }


    next();
};


/*
 * ----------------------------------------------------
 * Exports
 * ----------------------------------------------------
 */

module.exports = {

    validateEnrollmentCreate,

    validateEnrollmentUpdate,

    validateEnrollmentId,

    validateEnrollmentParam
};