const repository =
    require("../repositories/moduleRepository");


/*
 * Validate and normalize numeric ID
 */
const validateId = (
    value,
    name
) => {

    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            `${name} must be a positive integer`
        );
    }

    return id;
};


/*
 * Get all modules
 */
const getAllModules = async () => {

    return repository.getAllModules();
};


/*
 * Get module by ID
 */
const getModuleById = async (
    id
) => {

    const moduleId =
        validateId(
            id,
            "Module ID"
        );

    return repository.getModuleById(
        moduleId
    );
};


/*
 * Get modules by course ID
 */
const getModulesByCourseId = async (
    courseId
) => {

    const id =
        validateId(
            courseId,
            "Course ID"
        );

    return repository.getModulesByCourseId(
        id
    );
};


/*
 * Create module
 */
const createModule = async (
    data
) => {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Module data is required"
        );
    }


    /*
     * Validate course
     */
    const courseId =
        validateId(
            data.courseId,
            "Course ID"
        );


    /*
     * Validate title
     */
    if (
        typeof data.title !== "string" ||
        !data.title.trim()
    ) {
        throw new Error(
            "Module title is required"
        );
    }


    /*
     * Description is optional.
     *
     * null is stored when it is not supplied.
     */
    let description = null;

    if (
        data.description !== undefined &&
        data.description !== null
    ) {

        if (
            typeof data.description !== "string"
        ) {
            throw new Error(
                "Module description must be a string"
            );
        }

        description =
            data.description.trim() || null;
    }


    const moduleData = {

        title:
            data.title.trim(),

        description,

        courseId
    };


    return repository.createModule(
        moduleData
    );
};


/*
 * Update module
 */
const updateModule = async (
    id,
    data
) => {

    const moduleId =
        validateId(
            id,
            "Module ID"
        );


    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Module update data is required"
        );
    }


    const updateData = {};


    /*
     * Title
     */
    if (
        data.title !== undefined
    ) {

        if (
            typeof data.title !== "string" ||
            !data.title.trim()
        ) {
            throw new Error(
                "Module title must be a non-empty string"
            );
        }

        updateData.title =
            data.title.trim();
    }


    /*
     * Description
     */
    if (
        data.description !== undefined
    ) {

        if (
            data.description === null
        ) {

            updateData.description =
                null;

        } else if (
            typeof data.description === "string"
        ) {

            updateData.description =
                data.description.trim() || null;

        } else {

            throw new Error(
                "Module description must be a string"
            );
        }
    }


    /*
     * Course
     */
    if (
        data.courseId !== undefined
    ) {

        updateData.courseId =
            validateId(
                data.courseId,
                "Course ID"
            );
    }


    /*
     * Prevent empty update
     */
    if (
        Object.keys(updateData).length === 0
    ) {

        throw new Error(
            "At least one field is required for update"
        );
    }


    return repository.updateModule(
        moduleId,
        updateData
    );
};


/*
 * Delete module
 */
const deleteModule = async (
    id
) => {

    const moduleId =
        validateId(
            id,
            "Module ID"
        );

    return repository.deleteModule(
        moduleId
    );
};


module.exports = {

    getAllModules,

    getModuleById,

    getModulesByCourseId,

    createModule,

    updateModule,

    deleteModule
};