/*
 * Validate module creation
 */
const validateModuleCreate = (req, res, next) => {

    const {
        title,
        description,
        courseId
    } = req.body;

    const errors = [];


    /*
     * Validate title
     */
    if (
        typeof title !== "string" ||
        !title.trim()
    ) {
        errors.push(
            "title is required and must be a non-empty string"
        );
    }


    /*
     * Validate description
     *
     * Description is optional.
     */
    if (
        description !== undefined &&
        description !== null &&
        (
            typeof description !== "string" ||
            !description.trim()
        )
    ) {
        errors.push(
            "description must be a non-empty string"
        );
    }


    /*
     * Validate course ID
     */
    const parsedCourseId =
        Number(courseId);

    if (
        courseId === undefined ||
        courseId === null ||
        courseId === "" ||
        !Number.isInteger(parsedCourseId) ||
        parsedCourseId <= 0
    ) {
        errors.push(
            "courseId must be a positive integer"
        );
    }


    if (errors.length > 0) {

        return res.status(400).json({
            success: false,
            message:
                "Module validation failed",
            errors
        });
    }

    next();
};


/*
 * Validate module update
 *
 * All fields are optional,
 * but at least one field must be provided.
 */
const validateModuleUpdate = (
    req,
    res,
    next
) => {

    const {
        title,
        description,
        courseId
    } = req.body;

    const errors = [];


    /*
     * Prevent empty update request
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
     * Validate title
     */
    if (
        title !== undefined &&
        (
            typeof title !== "string" ||
            !title.trim()
        )
    ) {
        errors.push(
            "title must be a non-empty string"
        );
    }


    /*
     * Validate description
     *
     * null is allowed so the service
     * can clear the description.
     */
    if (
        description !== undefined &&
        description !== null &&
        (
            typeof description !== "string" ||
            !description.trim()
        )
    ) {
        errors.push(
            "description must be a non-empty string"
        );
    }


    /*
     * Validate course ID
     */
    if (courseId !== undefined) {

        const parsedCourseId =
            Number(courseId);

        if (
            courseId === null ||
            courseId === "" ||
            !Number.isInteger(parsedCourseId) ||
            parsedCourseId <= 0
        ) {
            errors.push(
                "courseId must be a positive integer"
            );
        }
    }


    if (errors.length > 0) {

        return res.status(400).json({
            success: false,
            message:
                "Module validation failed",
            errors
        });
    }

    next();
};


/*
 * Validate /modules/:id
 */
const validateModuleId = (
    req,
    res,
    next
) => {

    const id =
        Number(req.params.id);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Module ID must be a positive integer"
        });
    }

    next();
};


/*
 * Validate /modules/course/:courseId
 */
const validateCourseId = (
    req,
    res,
    next
) => {

    const courseId =
        Number(req.params.courseId);

    if (
        !Number.isInteger(courseId) ||
        courseId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Course ID must be a positive integer"
        });
    }

    next();
};


module.exports = {

    validateModuleCreate,

    validateModuleUpdate,

    validateModuleId,

    validateCourseId
};