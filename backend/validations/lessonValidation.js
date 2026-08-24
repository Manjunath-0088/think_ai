const isPositiveInteger = (value) => {
    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number > 0
    );
};


const isNonNegativeInteger = (value) => {
    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number >= 0
    );
};


const isNonEmptyString = (value) => {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};


/*
 * Validate lesson creation
 */
const validateLessonCreate = (
    req,
    res,
    next
) => {

    const {
        title,
        description,
        content,
        videoUrl,
        duration,
        moduleId,
        order
    } = req.body || {};

    const errors = [];


    /*
     * Required title
     */
    if (!isNonEmptyString(title)) {
        errors.push(
            "title is required"
        );
    }


    /*
     * Optional string fields
     */
    const optionalStringFields = {
        description,
        content,
        videoUrl,
        duration
    };

    Object.entries(
        optionalStringFields
    ).forEach(([field, value]) => {

        if (
            value !== undefined &&
            value !== null &&
            typeof value !== "string"
        ) {
            errors.push(
                `${field} must be a string`
            );
        }

    });


    /*
     * Required module ID
     */
    if (!isPositiveInteger(moduleId)) {
        errors.push(
            "moduleId must be a positive integer"
        );
    }


    /*
     * Optional order
     */
    if (
        order !== undefined &&
        !isNonNegativeInteger(order)
    ) {
        errors.push(
            "order must be a non-negative integer"
        );
    }


    if (errors.length > 0) {

        return res.status(400).json({
            success: false,
            message:
                "Lesson validation failed",
            errors
        });
    }


    next();
};


/*
 * Validate lesson update
 *
 * At least one field must be supplied.
 */
const validateLessonUpdate = (
    req,
    res,
    next
) => {

    const {
        title,
        description,
        content,
        videoUrl,
        duration,
        moduleId,
        order
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
     * Title
     */
    if (
        title !== undefined &&
        !isNonEmptyString(title)
    ) {
        errors.push(
            "title must be a non-empty string"
        );
    }


    /*
     * Optional string fields
     */
    const optionalStringFields = {
        description,
        content,
        videoUrl,
        duration
    };

    Object.entries(
        optionalStringFields
    ).forEach(([field, value]) => {

        if (
            value !== undefined &&
            value !== null &&
            typeof value !== "string"
        ) {
            errors.push(
                `${field} must be a string`
            );
        }

    });


    /*
     * Module ID
     */
    if (
        moduleId !== undefined &&
        !isPositiveInteger(moduleId)
    ) {
        errors.push(
            "moduleId must be a positive integer"
        );
    }


    /*
     * Order
     */
    if (
        order !== undefined &&
        !isNonNegativeInteger(order)
    ) {
        errors.push(
            "order must be a non-negative integer"
        );
    }


    if (errors.length > 0) {

        return res.status(400).json({
            success: false,
            message:
                "Lesson validation failed",
            errors
        });
    }


    next();
};


/*
 * Validate /lessons/:id
 */
const validateLessonId = (
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
                "Lesson ID must be a positive integer"
        });
    }

    next();
};


/*
 * Validate /modules/:moduleId/lessons
 */
const validateModuleLessonId = (
    req,
    res,
    next
) => {

    if (
        !isPositiveInteger(
            req.params.moduleId
        )
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Module ID must be a positive integer"
        });
    }

    next();
};


module.exports = {

    validateLessonCreate,

    validateLessonUpdate,

    validateLessonId,

    validateModuleLessonId
};