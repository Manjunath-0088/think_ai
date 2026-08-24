const repository =
    require("../repositories/lessonRepository");


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
        throw new Error(
            `${fieldName} must be a positive integer`
        );
    }

    return number;
};


/*
 * Validate non-negative integer
 */
const validateNonNegativeInteger = (
    value,
    fieldName
) => {

    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < 0
    ) {
        throw new Error(
            `${fieldName} must be a non-negative integer`
        );
    }

    return number;
};


/*
 * Get all lessons
 */
const getAllLessons = async () => {

    return await repository.getAllLessons();
};


/*
 * Get lesson by ID
 */
const getLessonById = async (id) => {

    const lessonId =
        validatePositiveInteger(
            id,
            "Lesson ID"
        );

    return await repository.getLessonById(
        lessonId
    );
};


/*
 * Get lessons by module ID
 */
const getLessonsByModuleId = async (
    moduleId
) => {

    const id =
        validatePositiveInteger(
            moduleId,
            "Module ID"
        );

    return await repository.getLessonsByModuleId(
        id
    );
};


/*
 * Create lesson
 */
const createLesson = async (data) => {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Lesson data is required"
        );
    }


    const moduleId =
        validatePositiveInteger(
            data.moduleId,
            "Module ID"
        );


    if (
        typeof data.title !== "string" ||
        !data.title.trim()
    ) {
        throw new Error(
            "Lesson title is required"
        );
    }


    const order =
        data.order !== undefined
            ? validateNonNegativeInteger(
                data.order,
                "Order"
            )
            : 0;


    return await repository.createLesson({

        title:
            data.title.trim(),

        description:
            typeof data.description === "string"
                ? data.description.trim() || null
                : null,

        content:
            typeof data.content === "string"
                ? data.content.trim() || null
                : null,

        videoUrl:
            typeof data.videoUrl === "string"
                ? data.videoUrl.trim() || null
                : null,

        duration:
            typeof data.duration === "string"
                ? data.duration.trim() || null
                : null,

        order,

        moduleId
    });
};


/*
 * Update lesson
 */
const updateLesson = async (
    id,
    data
) => {

    const lessonId =
        validatePositiveInteger(
            id,
            "Lesson ID"
        );


    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Lesson update data is required"
        );
    }


    const updateData = {};


    /*
     * Title
     */
    if (data.title !== undefined) {

        if (
            typeof data.title !== "string" ||
            !data.title.trim()
        ) {
            throw new Error(
                "Lesson title must be a non-empty string"
            );
        }

        updateData.title =
            data.title.trim();
    }


    /*
     * Description
     */
    if (data.description !== undefined) {

        if (
            data.description !== null &&
            typeof data.description !== "string"
        ) {
            throw new Error(
                "description must be a string or null"
            );
        }

        updateData.description =
            typeof data.description === "string"
                ? data.description.trim() || null
                : null;
    }


    /*
     * Content
     */
    if (data.content !== undefined) {

        if (
            data.content !== null &&
            typeof data.content !== "string"
        ) {
            throw new Error(
                "content must be a string or null"
            );
        }

        updateData.content =
            typeof data.content === "string"
                ? data.content.trim() || null
                : null;
    }


    /*
     * Video URL
     */
    if (data.videoUrl !== undefined) {

        if (
            data.videoUrl !== null &&
            typeof data.videoUrl !== "string"
        ) {
            throw new Error(
                "videoUrl must be a string or null"
            );
        }

        updateData.videoUrl =
            typeof data.videoUrl === "string"
                ? data.videoUrl.trim() || null
                : null;
    }


    /*
     * Duration
     */
    if (data.duration !== undefined) {

        if (
            data.duration !== null &&
            typeof data.duration !== "string"
        ) {
            throw new Error(
                "duration must be a string or null"
            );
        }

        updateData.duration =
            typeof data.duration === "string"
                ? data.duration.trim() || null
                : null;
    }


    /*
     * Order
     */
    if (data.order !== undefined) {

        updateData.order =
            validateNonNegativeInteger(
                data.order,
                "Order"
            );
    }


    /*
     * Module ID
     */
    if (data.moduleId !== undefined) {

        updateData.moduleId =
            validatePositiveInteger(
                data.moduleId,
                "Module ID"
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


    return await repository.updateLesson(
        lessonId,
        updateData
    );
};


/*
 * Delete lesson
 */
const deleteLesson = async (id) => {

    const lessonId =
        validatePositiveInteger(
            id,
            "Lesson ID"
        );

    return await repository.deleteLesson(
        lessonId
    );
};


module.exports = {

    getAllLessons,

    getLessonById,

    getLessonsByModuleId,

    createLesson,

    updateLesson,

    deleteLesson
};