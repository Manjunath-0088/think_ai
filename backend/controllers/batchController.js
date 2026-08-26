const service =
    require("../services/batchService");


/*
 * ----------------------------------------------------
 * Get all batches
 * ----------------------------------------------------
 */

const getBatches = async (req, res) => {

    try {

        const batches =
            await service.getAllBatches();


        return res.status(200).json({

            success: true,

            data: batches
        });

    } catch (error) {

        console.error(
            "Get batches error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve batches"
        });
    }
};


/*
 * ----------------------------------------------------
 * Get batch by ID
 * ----------------------------------------------------
 */

const getBatchById = async (
    req,
    res
) => {

    try {

        const batch =
            await service.getBatchById(
                req.params.id
            );


        if (!batch) {

            return res.status(404).json({

                success: false,

                message:
                    "Batch not found"
            });
        }


        return res.status(200).json({

            success: true,

            data: batch
        });

    } catch (error) {

        console.error(
            "Get batch by ID error:",
            error
        );


        if (
            error.message?.includes(
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
                "Failed to retrieve batch"
        });
    }
};


/*
 * ----------------------------------------------------
 * Create batch
 * ----------------------------------------------------
 */

const createBatch = async (
    req,
    res
) => {

    try {

        const batch =
            await service.createBatch(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Batch created successfully",

            data: batch
        });

    } catch (error) {

        console.error(
            "Create batch error:",
            error
        );


        /*
         * Service validation errors
         */

        const validationMessages = [

            "Batch data is required",

            "Batch name is required",

            "Course ID must be a positive integer",

            "Capacity must be a positive integer",

            "Start date is required",

            "Start date must be a valid date",

            "End date must be a valid date",

            "End date cannot be before start date",

            "Status must be either ACTIVE or INACTIVE",

            "Instructor name is required"
        ];


        if (
            validationMessages.includes(
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
         * Course does not exist
         */

        if (
            error.code === "P2003"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The specified course does not exist"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to create batch"
        });
    }
};


/*
 * ----------------------------------------------------
 * Update batch
 * ----------------------------------------------------
 */

const updateBatch = async (
    req,
    res
) => {

    try {

        const batch =
            await service.updateBatch(
                req.params.id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Batch updated successfully",

            data: batch
        });

    } catch (error) {

        console.error(
            "Update batch error:",
            error
        );


        /*
         * Invalid ID
         */

        if (
            error.message?.includes(
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
         * Validation errors
         */

        const validationMessages = [

            "Batch update data is required",

            "Batch name is required",

            "Course ID must be a positive integer",

            "Capacity must be a positive integer",

            "Start date must be a valid date",

            "End date must be a valid date",

            "End date cannot be before start date",

            "Status must be either ACTIVE or INACTIVE",

            "Instructor name is required",

            "At least one field is required for update"
        ];


        if (
            validationMessages.includes(
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
         * Batch not found
         */

        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Batch not found"
            });
        }


        /*
         * Course does not exist
         */

        if (
            error.code === "P2003"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The specified course does not exist"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to update batch"
        });
    }
};


/*
 * ----------------------------------------------------
 * Delete batch
 * ----------------------------------------------------
 */

const deleteBatch = async (
    req,
    res
) => {

    try {

        await service.deleteBatch(
            req.params.id
        );


        return res.status(200).json({

            success: true,

            message:
                "Batch deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete batch error:",
            error
        );


        /*
         * Invalid ID
         */

        if (
            error.message?.includes(
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
         * Batch not found
         */

        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Batch not found"
            });
        }


        /*
         * Batch has enrollments
         */

        if (
            error.code === "P2003"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Batch cannot be deleted because enrollments exist"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete batch"
        });
    }
};


/*
 * ----------------------------------------------------
 * Get batch enrollments
 * ----------------------------------------------------
 */

const getBatchEnrollments = async (
    req,
    res
) => {

    try {

        const enrollments =
            await service.getBatchEnrollments(
                req.params.batchId
            );


        return res.status(200).json({

            success: true,

            data: enrollments
        });

    } catch (error) {

        console.error(
            "Get batch enrollments error:",
            error
        );


        if (
            error.message?.includes(
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
                "Failed to retrieve batch enrollments"
        });
    }
};


/*
 * ----------------------------------------------------
 * Automatically allocate student
 * ----------------------------------------------------
 */

const autoAllocateStudent = async (
    req,
    res
) => {

    try {

        const result =
            await service.autoAllocateStudent(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Student automatically allocated to a batch",

            data: result
        });

    } catch (error) {

        console.error(
            "Auto allocation error:",
            error
        );


        /*
         * Validation errors
         */

        const validationMessages = [

            "Student name is required",

            "Student email is required",

            "Course ID must be a positive integer"
        ];


        if (
            validationMessages.includes(
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
         * No suitable batch
         */

        const allocationErrors = [

            "No active batches available for this course",

            "All batches for this course are full"
        ];


        if (
            allocationErrors.includes(
                error.message
            )
        ) {

            return res.status(409).json({

                success: false,

                message:
                    error.message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to allocate student to a batch"
        });
    }
};


module.exports = {

    getBatches,

    getBatchById,

    createBatch,

    updateBatch,

    deleteBatch,

    getBatchEnrollments,

    autoAllocateStudent
};