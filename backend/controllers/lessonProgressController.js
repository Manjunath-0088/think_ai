const service =
    require("../services/lessonProgressService");


/*
 * Check whether an error is an ID validation error
 */
const isInvalidIdError = (error) => {

    return (
        typeof error.message === "string" &&
        error.message.includes(
            "must be a positive integer"
        )
    );
};


/*
 * Get all progress for an enrollment
 */
const getProgressByEnrollment = async (
    req,
    res
) => {

    try {

        const progress =
            await service.getProgressByEnrollment(
                req.params.enrollmentId
            );

        return res.status(200).json({

            success: true,

            data: progress
        });

    } catch (error) {

        console.error(
            "Get progress error:",
            error
        );


        if (isInvalidIdError(error)) {

            return res.status(400).json({

                success: false,

                message: error.message
            });
        }


        if (
            error.message ===
            "Enrollment not found"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve lesson progress"
        });
    }
};


/*
 * Get progress for a specific lesson
 */
const getLessonProgress = async (
    req,
    res
) => {

    try {

        const progress =
            await service.getLessonProgress(

                req.params.enrollmentId,

                req.params.lessonId
            );


        if (!progress) {

            return res.status(404).json({

                success: false,

                message:
                    "Lesson progress not found"
            });
        }


        return res.status(200).json({

            success: true,

            data: progress
        });

    } catch (error) {

        console.error(
            "Get lesson progress error:",
            error
        );


        if (isInvalidIdError(error)) {

            return res.status(400).json({

                success: false,

                message: error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve lesson progress"
        });
    }
};


/*
 * Complete a lesson
 */
const completeLesson = async (
    req,
    res
) => {

    try {

        const progress =
            await service.completeLesson(

                req.body.enrollmentId,

                req.params.lessonId
            );


        return res.status(200).json({

            success: true,

            message:
                "Lesson completed successfully",

            data: progress
        });

    } catch (error) {

        console.error(
            "Complete lesson error:",
            error
        );


        /*
         * Invalid IDs
         */
        if (isInvalidIdError(error)) {

            return res.status(400).json({

                success: false,

                message: error.message
            });
        }


        /*
         * Enrollment / lesson not found
         */
        if (
            error.message ===
                "Enrollment not found" ||

            error.message ===
                "Lesson not found"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message
            });
        }


        /*
         * Course access restriction
         */
        if (
            error.message ===
            "Course access is not unlocked"
        ) {

            return res.status(403).json({

                success: false,

                message: error.message
            });
        }


        /*
         * Enrollment / batch / course
         * business rules
         */
        const businessErrors = new Set([

            "Enrollment is not active",

            "Batch is not active",

            "Course is not active",

            "This lesson does not belong to the enrolled course"
        ]);


        if (
            businessErrors.has(
                error.message
            )
        ) {

            return res.status(400).json({

                success: false,

                message: error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to complete lesson"
        });
    }
};


/*
 * Get course progress summary
 */
const getProgressSummary = async (
    req,
    res
) => {

    try {

        const summary =
            await service.getProgressSummary(
                req.params.enrollmentId
            );


        return res.status(200).json({

            success: true,

            data: summary
        });

    } catch (error) {

        console.error(
            "Get progress summary error:",
            error
        );


        if (isInvalidIdError(error)) {

            return res.status(400).json({

                success: false,

                message: error.message
            });
        }


        if (
            error.message ===
                "Enrollment not found" ||

            error.message ===
                "Course not found for enrollment"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve progress summary"
        });
    }
};


module.exports = {

    getProgressByEnrollment,

    getLessonProgress,

    completeLesson,

    getProgressSummary
};