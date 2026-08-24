const prisma = require("../config/database");


/*
 * Common enrollment fields
 */
const enrollmentSelect = {
    id: true,
    studentName: true,
    studentEmail: true,
    batchId: true,
    enrollmentStatus: true,
    enrolledAt: true
};


/*
 * Get all enrollments
 */
const getAllEnrollments = async () => {

    return prisma.enrollment.findMany({

        orderBy: {
            id: "desc"
        },

        select: {

            ...enrollmentSelect,

            batch: {
                select: {
                    id: true,
                    name: true,
                    courseId: true,
                    instructorName: true,
                    capacity: true,
                    startDate: true,
                    endDate: true,
                    status: true,

                    course: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            status: true
                        }
                    }
                }
            }
        }
    });
};


/*
 * Get enrollment by ID
 */
const getEnrollmentById = async (id) => {

    return prisma.enrollment.findUnique({

        where: {
            id
        },

        select: {

            ...enrollmentSelect,

            batch: {
                select: {
                    id: true,
                    name: true,
                    courseId: true,
                    instructorName: true,
                    capacity: true,
                    startDate: true,
                    endDate: true,
                    status: true,

                    course: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            category: true,
                            duration: true,
                            status: true
                        }
                    }
                }
            }
        }
    });
};


/*
 * Find an available active batch
 *
 * Selects the earliest active batch
 * that still has available capacity.
 */
const findAvailableBatch = async (courseId) => {

    const batches = await prisma.batch.findMany({

        where: {
            courseId,
            status: "ACTIVE"
        },

        orderBy: {
            startDate: "asc"
        },

        select: {
            id: true,
            name: true,
            courseId: true,
            capacity: true,
            startDate: true,
            endDate: true,
            status: true,

            _count: {
                select: {
                    enrollments: true
                }
            }
        }
    });


    return batches.find((batch) => {

        const enrollmentCount =
            batch._count?.enrollments ?? 0;

        return enrollmentCount < batch.capacity;

    }) || null;
};


/*
 * Create enrollment
 */
const createEnrollment = async (data) => {

    return prisma.enrollment.create({

        data,

        select: {

            ...enrollmentSelect,

            batch: {
                select: {
                    id: true,
                    name: true,
                    courseId: true,
                    capacity: true,
                    startDate: true,
                    endDate: true,
                    status: true
                }
            }
        }
    });
};


/*
 * Update enrollment
 */
const updateEnrollment = async (
    id,
    data
) => {

    return prisma.enrollment.update({

        where: {
            id
        },

        data,

        select: enrollmentSelect
    });
};


/*
 * Unlock course access
 *
 * NOTE:
 * This function requires `courseAccess`
 * to exist in the Enrollment Prisma model.
 */
const unlockCourseAccess = async (id) => {

    return prisma.enrollment.update({

        where: {
            id
        },

        data: {
            courseAccess: true
        },

        select: {

            ...enrollmentSelect,

            courseAccess: true,

            batch: {
                select: {
                    id: true,
                    name: true,
                    courseId: true,

                    course: {
                        select: {
                            id: true,
                            title: true,
                            status: true
                        }
                    }
                }
            }
        }
    });
};


/*
 * Delete enrollment
 */
const deleteEnrollment = async (id) => {

    return prisma.enrollment.delete({

        where: {
            id
        }
    });
};


module.exports = {

    getAllEnrollments,
    getEnrollmentById,
    findAvailableBatch,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    unlockCourseAccess
};