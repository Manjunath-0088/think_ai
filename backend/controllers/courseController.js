const service =
    require("../services/courseService");


/*
 * ----------------------------------------------------
 * Helpers
 * ----------------------------------------------------
 */

const isValidationError = (error) => {

    if (!error?.message) {
        return false;
    }

    return (
        error.message.includes(
            "must be a positive integer"
        ) ||
        error.message.includes(
            "is required"
        ) ||
        error.message.includes(
            "must be a non-empty string"
        ) ||
        error.message.includes(
            "must be a valid non-negative number"
        ) ||
        error.message.includes(
            "must be either ACTIVE or INACTIVE"
        ) ||
        error.message.includes(
            "At least one field is required"
        ) ||
        error.message.includes(
            "Course data is required"
        ) ||
        error.message.includes(
            "Course update data is required"
        )
    );
};


const handlePrismaError = (
    error,
    res,
    defaultMessage
) => {

    /*
     * Record not found
     */
    if (error?.code === "P2025") {

        return res.status(404).json({
            success: false,
            message: "Course not found"
        });
    }


    /*
     * Foreign key constraint
     */
    if (error?.code === "P2003") {

        return res.status(409).json({
            success: false,
            message:
                "Course cannot be deleted because related data exists"
        });
    }


    return res.status(500).json({
        success: false,
        message: defaultMessage
    });
};


/*
 * ----------------------------------------------------
 * Get all courses
 *
 * Supports:
 * - Pagination
 * - Search
 * ----------------------------------------------------
 */
const getCourses = async (
    req,
    res
) => {

    try {

        const courses =
            await service.getAllCourses(
                req.query.page,
                req.query.limit,
                req.query.search
            );


        return res.status(200).json({

            success: true,

            data: courses
        });

    } catch (error) {

        console.error(
            "Get courses error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve courses"
        });
    }
};


/*
 * ----------------------------------------------------
 * Get course by ID
 * ----------------------------------------------------
 */
const getCourseById = async (
    req,
    res
) => {

    try {

        const course =
            await service.getCourseById(
                req.params.id
            );


        if (!course) {

            return res.status(404).json({

                success: false,

                message:
                    "Course not found"
            });
        }


        return res.status(200).json({

            success: true,

            data: course
        });

    } catch (error) {

        console.error(
            "Get course by ID error:",
            error
        );


        if (isValidationError(error)) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve course"
        });
    }
};


/*
 * ----------------------------------------------------
 * Create course
 * ----------------------------------------------------
 */
const createCourse = async (
    req,
    res
) => {

    try {

        const course =
            await service.createCourse(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Course created successfully",

            data: course
        });

    } catch (error) {

        console.error(
            "Create course error:",
            error
        );


        if (isValidationError(error)) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to create course"
        });
    }
};


/*
 * ----------------------------------------------------
 * Update course
 * ----------------------------------------------------
 */
const updateCourse = async (
    req,
    res
) => {

    try {

        const course =
            await service.updateCourse(
                req.params.id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Course updated successfully",

            data: course
        });

    } catch (error) {

        console.error(
            "Update course error:",
            error
        );


        if (isValidationError(error)) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        if (error?.code === "P2025") {

            return res.status(404).json({

                success: false,

                message:
                    "Course not found"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update course"
        });
    }
};


/*
 * ----------------------------------------------------
 * Delete course
 * ----------------------------------------------------
 */
const deleteCourse = async (
    req,
    res
) => {

    try {

        await service.deleteCourse(
            req.params.id
        );


        return res.status(200).json({

            success: true,

            message:
                "Course deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete course error:",
            error
        );


        if (isValidationError(error)) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        if (
            error?.code === "P2025"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Course not found"
            });
        }


        if (
            error?.code === "P2003"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Course cannot be deleted because related data exists"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete course"
        });
    }
};


/*
 * ----------------------------------------------------
 * Get batches belonging to a course
 * ----------------------------------------------------
 */
const getCourseBatches = async (
    req,
    res
) => {

    try {

        const batches =
            await service.getCourseBatches(
                req.params.courseId
            );


        return res.status(200).json({

            success: true,

            data: batches
        });

    } catch (error) {

        console.error(
            "Get course batches error:",
            error
        );


        if (isValidationError(error)) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve course batches"
        });
    }
};


/*
 * ----------------------------------------------------
 * Get complete course content
 *
 * Course
 *   └── Modules
 *        └── Lessons
 * ----------------------------------------------------
 */
const getCourseContent = async (
    req,
    res
) => {

    try {

        const course =
            await service.getCourseContent(
                req.params.courseId
            );


        if (!course) {

            return res.status(404).json({

                success: false,

                message:
                    "Course not found"
            });
        }


        return res.status(200).json({

            success: true,

            data: course
        });

    } catch (error) {

        console.error(
            "Get course content error:",
            error
        );


        if (isValidationError(error)) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve course content"
        });
    }
};


module.exports = {

    getCourses,

    getCourseById,

    createCourse,

    updateCourse,

    deleteCourse,

    getCourseBatches,

    getCourseContent
};