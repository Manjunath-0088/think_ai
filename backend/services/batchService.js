const repository =
    require("../repositories/batchRepository");


/*
 * ----------------------------------------------------
 * Validation helpers
 * ----------------------------------------------------
 */

const validatePositiveInteger = (
    value,
    fieldName
) => {

    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            `${fieldName} must be a positive integer`
        );
    }

    return id;
};


const validateRequiredString = (
    value,
    fieldName
) => {

    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new Error(
            `${fieldName} is required`
        );
    }

    return value.trim();
};


/*
 * ----------------------------------------------------
 * Get all batches
 * ----------------------------------------------------
 */

const getAllBatches = async () => {

    return repository.getAllBatches();
};


/*
 * ----------------------------------------------------
 * Get batch by ID
 * ----------------------------------------------------
 */

const getBatchById = async (id) => {

    const batchId =
        validatePositiveInteger(
            id,
            "Batch ID"
        );

    return repository.getBatchById(
        batchId
    );
};


/*
 * ----------------------------------------------------
 * Create batch
 * ----------------------------------------------------
 */

const createBatch = async (data) => {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Batch data is required"
        );
    }


    const courseId =
        validatePositiveInteger(
            data.courseId,
            "Course ID"
        );


    const name =
        validateRequiredString(
            data.name,
            "Batch name"
        );


    const instructorName =
        data.instructorName !== undefined &&
        data.instructorName !== null
            ? validateRequiredString(
                data.instructorName,
                "Instructor name"
            )
            : null;


    const capacity =
        Number(data.capacity);


    if (
        !Number.isInteger(capacity) ||
        capacity <= 0
    ) {
        throw new Error(
            "Capacity must be a positive integer"
        );
    }


    if (!data.startDate) {
        throw new Error(
            "Start date is required"
        );
    }


    const startDate =
        new Date(data.startDate);


    if (Number.isNaN(startDate.getTime())) {
        throw new Error(
            "Start date must be a valid date"
        );
    }


    let endDate = null;


    if (data.endDate !== undefined &&
        data.endDate !== null &&
        data.endDate !== "") {

        endDate =
            new Date(data.endDate);


        if (Number.isNaN(endDate.getTime())) {
            throw new Error(
                "End date must be a valid date"
            );
        }


        if (endDate < startDate) {
            throw new Error(
                "End date cannot be before start date"
            );
        }
    }


    const status =
        data.status || "ACTIVE";


    if (
        !["ACTIVE", "INACTIVE"].includes(
            status
        )
    ) {
        throw new Error(
            "Status must be either ACTIVE or INACTIVE"
        );
    }


    return repository.createBatch({

        name,

        courseId,

        instructorName,

        capacity,

        startDate,

        endDate,

        status
    });
};


/*
 * ----------------------------------------------------
 * Update batch
 * ----------------------------------------------------
 */

const updateBatch = async (
    id,
    data
) => {

    const batchId =
        validatePositiveInteger(
            id,
            "Batch ID"
        );


    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error(
            "Batch update data is required"
        );
    }


    const updateData = {};


    /*
     * Batch name
     */

    if (data.name !== undefined) {

        updateData.name =
            validateRequiredString(
                data.name,
                "Batch name"
            );
    }


    /*
     * Course
     */

    if (data.courseId !== undefined) {

        updateData.courseId =
            validatePositiveInteger(
                data.courseId,
                "Course ID"
            );
    }


    /*
     * Instructor
     */

    if (data.instructorName !== undefined) {

        if (
            data.instructorName === null ||
            data.instructorName === ""
        ) {
            updateData.instructorName = null;
        } else {

            updateData.instructorName =
                validateRequiredString(
                    data.instructorName,
                    "Instructor name"
                );
        }
    }


    /*
     * Capacity
     */

    if (data.capacity !== undefined) {

        const capacity =
            Number(data.capacity);


        if (
            !Number.isInteger(capacity) ||
            capacity <= 0
        ) {
            throw new Error(
                "Capacity must be a positive integer"
            );
        }


        updateData.capacity =
            capacity;
    }


    /*
     * Start date
     */

    if (data.startDate !== undefined) {

        const startDate =
            new Date(data.startDate);


        if (Number.isNaN(startDate.getTime())) {
            throw new Error(
                "Start date must be a valid date"
            );
        }


        updateData.startDate =
            startDate;
    }


    /*
     * End date
     */

    if (data.endDate !== undefined) {

        if (
            data.endDate === null ||
            data.endDate === ""
        ) {

            updateData.endDate = null;

        } else {

            const endDate =
                new Date(data.endDate);


            if (Number.isNaN(endDate.getTime())) {
                throw new Error(
                    "End date must be a valid date"
                );
            }


            updateData.endDate =
                endDate;
        }
    }


    /*
     * Status
     */

    if (data.status !== undefined) {

        if (
            !["ACTIVE", "INACTIVE"].includes(
                data.status
            )
        ) {
            throw new Error(
                "Status must be either ACTIVE or INACTIVE"
            );
        }


        updateData.status =
            data.status;
    }


    /*
     * Prevent empty updates
     */

    if (
        Object.keys(updateData).length === 0
    ) {
        throw new Error(
            "At least one field is required for update"
        );
    }


    /*
     * Validate date relationship if both
     * dates are being updated.
     *
     * Existing DB dates are not fetched here,
     * so this check only applies when both
     * values are supplied in the update.
     */

    if (
        updateData.startDate &&
        updateData.endDate &&
        updateData.endDate <
        updateData.startDate
    ) {
        throw new Error(
            "End date cannot be before start date"
        );
    }


    return repository.updateBatch(
        batchId,
        updateData
    );
};


/*
 * ----------------------------------------------------
 * Delete batch
 * ----------------------------------------------------
 */

const deleteBatch = async (id) => {

    const batchId =
        validatePositiveInteger(
            id,
            "Batch ID"
        );


    return repository.deleteBatch(
        batchId
    );
};


/*
 * ----------------------------------------------------
 * Get batch enrollments
 * ----------------------------------------------------
 */

const getBatchEnrollments = async (
    batchId
) => {

    const id =
        validatePositiveInteger(
            batchId,
            "Batch ID"
        );


    return repository.getBatchEnrollments(
        id
    );
};


/*
 * ----------------------------------------------------
 * Automatically allocate student
 * ----------------------------------------------------
 *
 * Allocation rules:
 *
 * 1. Course ID must be valid.
 * 2. Student details must be valid.
 * 3. Batch must be ACTIVE.
 * 4. Batch must have available capacity.
 * 5. Select batch with most available seats.
 * ----------------------------------------------------
 */

const autoAllocateStudent = async ({
    studentName,
    studentEmail,
    courseId
}) => {

    const normalizedCourseId =
        validatePositiveInteger(
            courseId,
            "Course ID"
        );


    const normalizedStudentName =
        validateRequiredString(
            studentName,
            "Student name"
        );


    const normalizedStudentEmail =
        validateRequiredString(
            studentEmail,
            "Student email"
        ).toLowerCase();


    /*
     * Get only ACTIVE batches for the course.
     */

    const batches =
        await repository.getAvailableBatches(
            normalizedCourseId
        );


    if (
        !batches ||
        batches.length === 0
    ) {
        throw new Error(
            "No active batches available for this course"
        );
    }


    /*
     * Find batches with available seats.
     */

    const availableBatches =
        batches.filter((batch) => {

            const enrollmentCount =
                batch._count?.enrollments || 0;


            return (
                enrollmentCount <
                batch.capacity
            );
        });


    if (
        availableBatches.length === 0
    ) {
        throw new Error(
            "All batches for this course are full"
        );
    }


    /*
     * Select the batch with the
     * highest number of available seats.
     *
     * If two batches have the same number
     * of seats, the earlier batch in the
     * repository result is retained.
     */

    const selectedBatch =
        availableBatches.reduce(
            (bestBatch, currentBatch) => {

                const bestCount =
                    bestBatch._count?.enrollments || 0;

                const currentCount =
                    currentBatch._count?.enrollments || 0;


                const bestAvailable =
                    bestBatch.capacity -
                    bestCount;

                const currentAvailable =
                    currentBatch.capacity -
                    currentCount;


                return currentAvailable >
                    bestAvailable
                    ? currentBatch
                    : bestBatch;
            }
        );


    /*
     * Create enrollment.
     */

    const enrollment =
        await repository.createEnrollment({

            studentName:
                normalizedStudentName,

            studentEmail:
                normalizedStudentEmail,

            batchId:
                selectedBatch.id,

            enrollmentStatus:
                "ENROLLED"
        });


    return {

        enrollment,

        allocatedBatch:
            selectedBatch
    };
};


module.exports = {

    getAllBatches,

    getBatchById,

    createBatch,

    updateBatch,

    deleteBatch,

    getBatchEnrollments,

    autoAllocateStudent
};