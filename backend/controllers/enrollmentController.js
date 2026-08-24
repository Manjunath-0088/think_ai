const service =
    require("../services/enrollmentService");


/*
 * ----------------------------------------------------
 * Get all enrollments
 * ----------------------------------------------------
 */

const getEnrollments = async (
    req,
    res
) => {

    try {

        const enrollments =
            await service.getAllEnrollments();


        return res.status(200).json({

            success: true,

            data: enrollments
        });

    } catch (error) {

        console.error(
            "Get enrollments error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve enrollments"
        });
    }
};


/*
 * ----------------------------------------------------
 * Get enrollment by ID
 * ----------------------------------------------------
 */

const getEnrollmentById = async (
    req,
    res
) => {

    try {

        const enrollment =
            await service.getEnrollmentById(
                req.params.id
            );


        if (!enrollment) {

            return res.status(404).json({

                success: false,

                message:
                    "Enrollment not found"
            });
        }


        return res.status(200).json({

            success: true,

            data: enrollment
        });

    } catch (error) {

        console.error(
            "Get enrollment error:",
            error
        );


        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve enrollment"
        });
    }
};


/*
 * ----------------------------------------------------
 * Create enrollment
 * ----------------------------------------------------
 */

const createEnrollment = async (
    req,
    res
) => {

    try {

        const enrollment =
            await service.createEnrollment(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Enrollment created successfully",

            data: enrollment
        });

    } catch (error) {

        console.error(
            "Create enrollment error:",
            error
        );


        /*
         * Duplicate enrollment
         */

        if (
            error.message ===
            "Student is already enrolled in this batch"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    error.message
            });
        }


        /*
         * Validation / business errors
         */

        const badRequestMessages = [

            "Enrollment data is required",

            "Batch ID must be a positive integer",

            "Student name is required",

            "Student email is required",

            "Enrollment status is invalid",

            "Selected batch not found",

            "Cannot enroll into an inactive course",

            "Cannot enroll into an inactive batch",

            "Selected batch is full and no other available batch exists",

            "No active batches available for this course",

            "All batches for this course are full",

            "No alternative batch available"
        ];


        if (
            badRequestMessages.includes(
                error.message
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        /*
         * Prisma foreign-key error
         */

        if (
            error.code === "P2003"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid batch or related record"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to create enrollment"
        });
    }
};


/*
 * ----------------------------------------------------
 * Update enrollment
 * ----------------------------------------------------
 */

const updateEnrollment = async (
    req,
    res
) => {

    try {

        const enrollment =
            await service.updateEnrollment(

                req.params.id,

                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Enrollment updated successfully",

            data: enrollment
        });

    } catch (error) {

        console.error(
            "Update enrollment error:",
            error
        );


        /*
         * Enrollment not found
         */

        if (
            error.message ===
            "Enrollment not found"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    error.message
            });
        }


        /*
         * Validation / business errors
         */

        const badRequestMessages = [

            "Enrollment ID must be a positive integer",

            "Enrollment update data is required",

            "At least one field is required for update",

            "Student name is required",

            "Student email is required",

            "Enrollment status is invalid",

            "Batch ID must be a positive integer",

            "Selected batch not found",

            "Cannot move enrollment to an inactive batch",

            "Cannot move enrollment to an inactive course",

            "Selected batch is full"
        ];


        if (
            badRequestMessages.includes(
                error.message
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        /*
         * Prisma record not found
         */

        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Enrollment not found"
            });
        }


        /*
         * Prisma foreign-key error
         */

        if (
            error.code === "P2003"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid batch or related record"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update enrollment"
        });
    }
};


/*
 * ----------------------------------------------------
 * Unlock course access
 * ----------------------------------------------------
 *
 * Called after successful payment verification.
 *
 * Requires `courseAccess` in Prisma Enrollment model.
 */

const unlockCourseAccess = async (
    req,
    res
) => {

    try {

        const enrollment =
            await service.unlockCourseAccess(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            message:
                "Course access unlocked successfully",

            data: {

                enrollmentId:
                    enrollment.id,

                courseAccess:
                    enrollment.courseAccess,

                enrollmentStatus:
                    enrollment.enrollmentStatus
            }
        });

    } catch (error) {

        console.error(
            "Unlock course access error:",
            error
        );


        if (
            error.message ===
            "Enrollment not found"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    error.message
            });
        }


        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        /*
         * Prisma errors
         */

        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Enrollment not found"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to unlock course access"
        });
    }
};


/*
 * ----------------------------------------------------
 * Delete enrollment
 * ----------------------------------------------------
 */

const deleteEnrollment = async (
    req,
    res
) => {

    try {

        await service.deleteEnrollment(
            req.params.id
        );


        return res.status(200).json({

            success: true,

            message:
                "Enrollment deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete enrollment error:",
            error
        );


        if (
            error.message ===
            "Enrollment not found"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    error.message
            });
        }


        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message
            });
        }


        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Enrollment not found"
            });
        }


        if (
            error.code === "P2003"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Enrollment cannot be deleted because related data exists"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete enrollment"
        });
    }
};


/*
 * ----------------------------------------------------
 * Exports
 * ----------------------------------------------------
 */

module.exports = {

    getEnrollments,

    getEnrollmentById,

    createEnrollment,

    updateEnrollment,

    unlockCourseAccess,

    deleteEnrollment
};