/*
 * Validate positive integer
 */
const validatePositiveInteger = (
    value,
    fieldName
) => {

    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number <= 0
    ) {
        return `${fieldName} must be a positive integer`;
    }

    return null;
};


/*
 * Validate enrollment ID from route
 *
 * Used by:
 * /:enrollmentId
 */
const validateEnrollmentId = (
    req,
    res,
    next
) => {

    const error =
        validatePositiveInteger(
            req.params.enrollmentId,
            "Enrollment ID"
        );


    if (error) {

        return res.status(400).json({

            success: false,

            message: error
        });
    }


    next();
};


/*
 * Validate lesson ID from route
 *
 * Used by:
 * /:enrollmentId/lessons/:lessonId
 */
const validateLessonId = (
    req,
    res,
    next
) => {

    const error =
        validatePositiveInteger(
            req.params.lessonId,
            "Lesson ID"
        );


    if (error) {

        return res.status(400).json({

            success: false,

            message: error
        });
    }


    next();
};


/*
 * Validate enrollment ID when
 * completing a lesson.
 *
 * enrollmentId is expected
 * inside request body.
 */
const validateCompleteLesson = (
    req,
    res,
    next
) => {

    if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Request body is required"
        });
    }


    const error =
        validatePositiveInteger(
            req.body.enrollmentId,
            "Enrollment ID"
        );


    if (error) {

        return res.status(400).json({

            success: false,

            message: error
        });
    }


    next();
};


module.exports = {

    validateEnrollmentId,

    validateLessonId,

    validateCompleteLesson
};