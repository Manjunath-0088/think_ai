const prisma =
    require("../config/database");


/*
 * ----------------------------------------------------
 * Course select fields
 *
 * Keeps returned course data consistent across APIs.
 * ----------------------------------------------------
 */
const courseSelect = {
    id: true,
    title: true,
    description: true,
    category: true,
    price: true,
    duration: true,
    thumbnail: true,
    videoUrl: true,
    instructorName: true,
    instructorDetails: true,
    status: true,
    createdAt: true,
    updatedAt: true
};


/*
 * ----------------------------------------------------
 * Get all courses
 *
 * Supports:
 * - Pagination
 * - Title search
 * ----------------------------------------------------
 */
const getAllCourses = async (
    skip = 0,
    take = 10,
    search = ""
) => {

    const safeSkip =
        Number.isInteger(Number(skip)) &&
        Number(skip) >= 0
            ? Number(skip)
            : 0;


    const safeTake =
        Number.isInteger(Number(take)) &&
        Number(take) > 0
            ? Math.min(Number(take), 100)
            : 10;


    const searchText =
        typeof search === "string"
            ? search.trim()
            : "";


    const where = searchText
        ? {
            title: {
                contains: searchText,
                mode: "insensitive"
            }
        }
        : {};


    /*
     * Both queries are independent reads.
     *
     * Promise.all avoids unnecessarily wrapping
     * simple reads inside a database transaction.
     */
    const [courses, total] =
        await Promise.all([

            prisma.course.findMany({

                where,

                skip: safeSkip,

                take: safeTake,

                orderBy: {
                    id: "desc"
                },

                select: courseSelect
            }),

            prisma.course.count({
                where
            })
        ]);


    return {

        courses,

        pagination: {

            total,

            page:
                Math.floor(
                    safeSkip / safeTake
                ) + 1,

            limit:
                safeTake,

            totalPages:
                Math.ceil(
                    total / safeTake
                )
        }
    };
};


/*
 * ----------------------------------------------------
 * Get course by ID
 * ----------------------------------------------------
 */
const getCourseById = async (id) => {

    return prisma.course.findUnique({

        where: {
            id
        },

        select: courseSelect
    });
};


/*
 * ----------------------------------------------------
 * Create course
 * ----------------------------------------------------
 */
const createCourse = async (data) => {

    return prisma.course.create({
        data
    });
};


/*
 * ----------------------------------------------------
 * Update course
 * ----------------------------------------------------
 */
const updateCourse = async (
    id,
    data
) => {

    return prisma.course.update({

        where: {
            id
        },

        data
    });
};


/*
 * ----------------------------------------------------
 * Delete course
 * ----------------------------------------------------
 */
const deleteCourse = async (id) => {

    return prisma.course.delete({

        where: {
            id
        }
    });
};


/*
 * ----------------------------------------------------
 * Get batches belonging to a course
 * ----------------------------------------------------
 */
const getCourseBatches = async (
    courseId
) => {

    return prisma.batch.findMany({

        where: {
            courseId
        },

        orderBy: [
            {
                startDate: "asc"
            },
            {
                id: "asc"
            }
        ],

        select: {

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
        }
    });
};


/*
 * ----------------------------------------------------
 * Get complete course content
 *
 * Course
 *   └── Modules
 *        └── Lessons
 * ----------------------------------------------------
 */
const getCourseContent = async (
    courseId
) => {

    return prisma.course.findUnique({

        where: {
            id: courseId
        },

        select: {

            ...courseSelect,

            modules: {

                orderBy: {
                    id: "asc"
                },

                select: {

                    id: true,
                    title: true,
                    description: true,
                    courseId: true,

                    lessons: {

                        orderBy: [
                            {
                                order: "asc"
                            },
                            {
                                id: "asc"
                            }
                        ],

                        select: {

                            id: true,
                            title: true,
                            description: true,
                            content: true,
                            videoUrl: true,
                            duration: true,
                            order: true,
                            moduleId: true
                        }
                    }
                }
            }
        }
    });
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