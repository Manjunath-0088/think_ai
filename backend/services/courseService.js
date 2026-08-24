const repository =
    require("../repositories/courseRepository");


const VALID_STATUSES = new Set([
    "ACTIVE",
    "INACTIVE"
]);


/*
 * Validate numeric ID
 */
const validateId = (value, name) => {

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
 * Normalize optional string
 *
 * Empty values are converted to null.
 */
const normalizeOptionalString = (value) => {

    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();

    return trimmed || null;
};


/*
 * Build course data for creation
 */
const buildCreateData = (data) => {

    return {
        title: data.title.trim(),

        description:
            data.description.trim(),

        category:
            data.category.trim(),

        price:
            Number(data.price),

        duration:
            data.duration.trim(),

        thumbnail:
            normalizeOptionalString(
                data.thumbnail
            ),

        videoUrl:
            normalizeOptionalString(
                data.videoUrl
            ),

        instructorName:
            normalizeOptionalString(
                data.instructorName
            ),

        instructorDetails:
            normalizeOptionalString(
                data.instructorDetails
            ),

        status:
            data.status || "ACTIVE"
    };
};


/*
 * Build only supplied fields for update
 */
const buildUpdateData = (data) => {

    const updateData = {};


    if (data.title !== undefined) {
        updateData.title =
            data.title.trim();
    }


    if (data.description !== undefined) {
        updateData.description =
            data.description.trim();
    }


    if (data.category !== undefined) {
        updateData.category =
            data.category.trim();
    }


    if (data.price !== undefined) {
        updateData.price =
            Number(data.price);
    }


    if (data.duration !== undefined) {
        updateData.duration =
            data.duration.trim();
    }


    if (data.thumbnail !== undefined) {
        updateData.thumbnail =
            normalizeOptionalString(
                data.thumbnail
            );
    }


    if (data.videoUrl !== undefined) {
        updateData.videoUrl =
            normalizeOptionalString(
                data.videoUrl
            );
    }


    if (data.instructorName !== undefined) {
        updateData.instructorName =
            normalizeOptionalString(
                data.instructorName
            );
    }


    if (data.instructorDetails !== undefined) {
        updateData.instructorDetails =
            normalizeOptionalString(
                data.instructorDetails
            );
    }


    if (data.status !== undefined) {

        if (
            !VALID_STATUSES.has(
                data.status
            )
        ) {
            throw new Error(
                "status must be either ACTIVE or INACTIVE"
            );
        }

        updateData.status =
            data.status;
    }


    return updateData;
};


/*
 * Get all courses
 *
 * Supports:
 * - Pagination
 * - Search
 */
const getAllCourses = async (
    page = 1,
    limit = 10,
    search = ""
) => {

    const parsedPage =
        Number.parseInt(page, 10);

    const parsedLimit =
        Number.parseInt(limit, 10);


    const safePage =
        Number.isInteger(parsedPage) &&
        parsedPage > 0
            ? parsedPage
            : 1;


    const safeLimit =
        Number.isInteger(parsedLimit) &&
        parsedLimit > 0
            ? Math.min(parsedLimit, 100)
            : 10;


    const skip =
        (safePage - 1) *
        safeLimit;


    const normalizedSearch =
        typeof search === "string"
            ? search.trim()
            : "";


    return repository.getAllCourses(
        skip,
        safeLimit,
        normalizedSearch
    );
};


/*
 * Get course by ID
 */
const getCourseById = async (id) => {

    const courseId =
        validateId(
            id,
            "Course ID"
        );

    return repository.getCourseById(
        courseId
    );
};


/*
 * Create course
 */
const createCourse = async (data) => {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Course data is required"
        );
    }


    return repository.createCourse(
        buildCreateData(data)
    );
};


/*
 * Update course
 *
 * Only supplied fields are updated.
 */
const updateCourse = async (
    id,
    data
) => {

    const courseId =
        validateId(
            id,
            "Course ID"
        );


    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Course update data is required"
        );
    }


    const updateData =
        buildUpdateData(data);


    if (
        Object.keys(updateData).length === 0
    ) {
        throw new Error(
            "At least one field is required for update"
        );
    }


    return repository.updateCourse(
        courseId,
        updateData
    );
};


/*
 * Delete course
 */
const deleteCourse = async (id) => {

    const courseId =
        validateId(
            id,
            "Course ID"
        );

    return repository.deleteCourse(
        courseId
    );
};


/*
 * Get batches belonging to course
 */
const getCourseBatches = async (
    courseId
) => {

    const id =
        validateId(
            courseId,
            "Course ID"
        );

    return repository.getCourseBatches(
        id
    );
};


/*
 * Get complete course content
 *
 * Course
 *   └── Modules
 *        └── Lessons
 */
const getCourseContent = async (
    courseId
) => {

    const id =
        validateId(
            courseId,
            "Course ID"
        );

    return repository.getCourseContent(
        id
    );
};


module.exports = {

    getAllCourses,

    getCourseById,

    createCourse,

    updateCourse,

    deleteCourse,

    getCourseBatches,

    getCourseContent
};