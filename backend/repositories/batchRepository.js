const prisma = require("../config/database");


/*
 * ----------------------------------------------------
 * Common batch fields
 * ----------------------------------------------------
 */

const batchSelect = {
    id: true,
    name: true,
    courseId: true,
    instructorName: true,
    capacity: true,
    startDate: true,
    endDate: true,
    status: true,
    createdAt: true,
    updatedAt: true
};


const batchWithCourseSelect = {
    ...batchSelect,

    course: {
        select: {
            id: true,
            title: true,
            category: true,
            status: true
        }
    },

    _count: {
        select: {
            enrollments: true
        }
    }
};


const batchWithBasicCourseSelect = {
    ...batchSelect,

    course: {
        select: {
            id: true,
            title: true
        }
    }
};


/*
 * ----------------------------------------------------
 * Get all batches
 * ----------------------------------------------------
 */
const getAllBatches = async () => {

    return prisma.batch.findMany({

        orderBy: {
            id: "desc"
        },

        select: batchWithCourseSelect
    });
};


/*
 * ----------------------------------------------------
 * Get batch by ID
 * ----------------------------------------------------
 */
const getBatchById = async (id) => {

    return prisma.batch.findUnique({

        where: {
            id
        },

        select: {

            ...batchSelect,

            course: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    status: true
                }
            },

            _count: {
                select: {
                    enrollments: true
                }
            }
        }
    });
};


/*
 * ----------------------------------------------------
 * Create batch
 * ----------------------------------------------------
 */
const createBatch = async (data) => {

    return prisma.batch.create({

        data,

        select: batchWithBasicCourseSelect
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

    return prisma.batch.update({

        where: {
            id
        },

        data,

        select: batchWithBasicCourseSelect
    });
};


/*
 * ----------------------------------------------------
 * Delete batch
 * ----------------------------------------------------
 */
const deleteBatch = async (id) => {

    return prisma.batch.delete({

        where: {
            id
        },

        select: {
            id: true
        }
    });
};


/*
 * ----------------------------------------------------
 * Get enrollments for a batch
 * ----------------------------------------------------
 */
const getBatchEnrollments = async (
    batchId
) => {

    return prisma.enrollment.findMany({

        where: {
            batchId
        },

        orderBy: {
            id: "desc"
        },

        select: {
            id: true,
            studentName: true,
            studentEmail: true,
            batchId: true,
            enrollmentStatus: true,
            enrolledAt: true
        }
    });
};


/*
 * ----------------------------------------------------
 * Get available batches for a course
 *
 * Only ACTIVE batches are returned.
 * ----------------------------------------------------
 */
const getAvailableBatches = async (
    courseId
) => {

    return prisma.batch.findMany({

        where: {
            courseId,
            status: "ACTIVE"
        },

        orderBy: {
            startDate: "asc"
        },

        select: {

            ...batchSelect,

            _count: {
                select: {
                    enrollments: true
                }
            }
        }
    });
};


/*
 * ----------------------------------------------------
 * Create enrollment
 * ----------------------------------------------------
 */
const createEnrollment = async (
    data
) => {

    return prisma.enrollment.create({

        data,

        select: {

            id: true,
            studentName: true,
            studentEmail: true,
            batchId: true,
            enrollmentStatus: true,
            enrolledAt: true,

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


module.exports = {

    getAllBatches,

    getBatchById,

    createBatch,

    updateBatch,

    deleteBatch,

    getBatchEnrollments,

    getAvailableBatches,

    createEnrollment
};