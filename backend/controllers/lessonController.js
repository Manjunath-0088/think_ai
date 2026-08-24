const service =
    require("../services/lessonService");


/*
 * Get all lessons
 */
const getAllLessons = async (
    req,
    res
) => {

    try {

        const lessons =
            await service.getAllLessons();

        return res.status(200).json({
            success: true,
            data: lessons
        });

    } catch (error) {

        console.error(
            "Get lessons error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve lessons"
        });
    }
};


/*
 * Get lesson by ID
 */
const getLessonById = async (
    req,
    res
) => {

    try {

        const lesson =
            await service.getLessonById(
                req.params.id
            );

        if (!lesson) {

            return res.status(404).json({
                success: false,
                message:
                    "Lesson not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: lesson
        });

    } catch (error) {

        console.error(
            "Get lesson error:",
            error
        );

        if (
            error.message.includes(
                "must be a positive integer"
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
                "Failed to retrieve lesson"
        });
    }
};


/*
 * Get lessons by module ID
 */
const getLessonsByModuleId = async (
    req,
    res
) => {

    try {

        const lessons =
            await service.getLessonsByModuleId(
                req.params.moduleId
            );

        return res.status(200).json({
            success: true,
            data: lessons
        });

    } catch (error) {

        console.error(
            "Get module lessons error:",
            error
        );

        if (
            error.message.includes(
                "must be a positive integer"
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
                "Failed to retrieve module lessons"
        });
    }
};


/*
 * Create lesson
 */
const createLesson = async (
    req,
    res
) => {

    try {

        const lesson =
            await service.createLesson(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Lesson created successfully",
            data: lesson
        });

    } catch (error) {

        console.error(
            "Create lesson error:",
            error
        );

        const validationErrors = [
            "Lesson data is required",
            "Lesson title is required",
            "Module ID must be a positive integer",
            "Order must be a non-negative integer"
        ];

        if (
            validationErrors.includes(
                error.message
            )
        ) {

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        /*
         * Related module does not exist
         */
        if (
            error.code === "P2003"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "The specified module does not exist"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create lesson"
        });
    }
};


/*
 * Update lesson
 */
const updateLesson = async (
    req,
    res
) => {

    try {

        const lesson =
            await service.updateLesson(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Lesson updated successfully",
            data: lesson
        });

    } catch (error) {

        console.error(
            "Update lesson error:",
            error
        );

        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }


        const validationErrors = [
            "Lesson update data is required",
            "Lesson title must be a non-empty string",
            "description must be a string or null",
            "content must be a string or null",
            "videoUrl must be a string or null",
            "duration must be a string or null",
            "At least one field is required for update"
        ];

        if (
            validationErrors.includes(
                error.message
            )
        ) {

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }


        /*
         * Lesson not found
         */
        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Lesson not found"
            });
        }


        /*
         * Module does not exist
         */
        if (
            error.code === "P2003"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "The specified module does not exist"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update lesson"
        });
    }
};


/*
 * Delete lesson
 */
const deleteLesson = async (
    req,
    res
) => {

    try {

        await service.deleteLesson(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Lesson deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete lesson error:",
            error
        );


        /*
         * Invalid ID
         */
        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }


        /*
         * Lesson not found
         */
        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Lesson not found"
            });
        }


        /*
         * Related progress/assessment
         * records may prevent deletion.
         */
        if (
            error.code === "P2003"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "Lesson cannot be deleted because related data exists"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete lesson"
        });
    }
};


module.exports = {

    getAllLessons,

    getLessonById,

    getLessonsByModuleId,

    createLesson,

    updateLesson,

    deleteLesson
};