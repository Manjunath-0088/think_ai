const service =
    require("../services/moduleService");


/*
 * Get all modules
 */
const getAllModules = async (
    req,
    res
) => {

    try {

        const modules =
            await service.getAllModules();

        return res.status(200).json({
            success: true,
            data: modules
        });

    } catch (error) {

        console.error(
            "Get modules error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve modules"
        });
    }
};


/*
 * Get module by ID
 */
const getModuleById = async (
    req,
    res
) => {

    try {

        const module =
            await service.getModuleById(
                req.params.id
            );

        if (!module) {

            return res.status(404).json({
                success: false,
                message:
                    "Module not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: module
        });

    } catch (error) {

        console.error(
            "Get module error:",
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
                "Failed to retrieve module"
        });
    }
};


/*
 * Get modules by course ID
 */
const getModulesByCourseId = async (
    req,
    res
) => {

    try {

        const modules =
            await service.getModulesByCourseId(
                req.params.courseId
            );

        return res.status(200).json({
            success: true,
            data: modules
        });

    } catch (error) {

        console.error(
            "Get course modules error:",
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
                "Failed to retrieve course modules"
        });
    }
};


/*
 * Create module
 */
const createModule = async (
    req,
    res
) => {

    try {

        const module =
            await service.createModule(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Module created successfully",
            data: module
        });

    } catch (error) {

        console.error(
            "Create module error:",
            error
        );

        const validationErrors = [
            "Module data is required",
            "Module title is required",
            "Module description must be a string"
        ];

        if (
            validationErrors.includes(
                error.message
            ) ||
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
                "Failed to create module"
        });
    }
};


/*
 * Update module
 */
const updateModule = async (
    req,
    res
) => {

    try {

        const module =
            await service.updateModule(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Module updated successfully",
            data: module
        });

    } catch (error) {

        console.error(
            "Update module error:",
            error
        );

        const validationErrors = [
            "Module update data is required",
            "Module title must be a non-empty string",
            "Module description must be a string",
            "At least one field is required for update"
        ];

        if (
            validationErrors.includes(
                error.message
            ) ||
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
         * Module does not exist
         */
        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Module not found"
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
                "Failed to update module"
        });
    }
};


/*
 * Delete module
 */
const deleteModule = async (
    req,
    res
) => {

    try {

        await service.deleteModule(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Module deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete module error:",
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


        /*
         * Module does not exist
         */
        if (
            error.code === "P2025"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Module not found"
            });
        }


        /*
         * Related lessons/assessments exist
         */
        if (
            error.code === "P2003"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "Module cannot be deleted because related data exists"
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete module"
        });
    }
};


module.exports = {

    getAllModules,

    getModuleById,

    getModulesByCourseId,

    createModule,

    updateModule,

    deleteModule
};