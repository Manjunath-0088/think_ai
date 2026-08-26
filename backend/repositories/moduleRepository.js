const prisma =
    require("../config/database");


/*
 * Common lesson selection
 *
 * Prevents unnecessary fields from
 * being returned from the database.
 */
const lessonSelect = {

    id: true,

    title: true,

    description: true,

    content: true,

    videoUrl: true,

    duration: true,

    order: true,

    moduleId: true,

    createdAt: true,

    updatedAt: true
};


/*
 * Common course selection
 */
const courseSelect = {

    id: true,

    title: true,

    status: true
};


/*
 * Get all modules
 */
const getAllModules = async () => {

    return await prisma.module.findMany({

        orderBy: {
            id: "asc"
        },

        select: {

            id: true,

            title: true,

            description: true,

            courseId: true,

            createdAt: true,

            updatedAt: true,

            course: {
                select: courseSelect
            },

            lessons: {

                orderBy: [
                    {
                        order: "asc"
                    },
                    {
                        id: "asc"
                    }
                ],

                select: lessonSelect
            }
        }
    });
};


/*
 * Get module by ID
 */
const getModuleById = async (id) => {

    return await prisma.module.findUnique({

        where: {
            id
        },

        select: {

            id: true,

            title: true,

            description: true,

            courseId: true,

            createdAt: true,

            updatedAt: true,

            course: {
                select: courseSelect
            },

            lessons: {

                orderBy: [
                    {
                        order: "asc"
                    },
                    {
                        id: "asc"
                    }
                ],

                select: lessonSelect
            }
        }
    });
};


/*
 * Get all modules belonging
 * to a course
 */
const getModulesByCourseId = async (
    courseId
) => {

    return await prisma.module.findMany({

        where: {
            courseId
        },

        orderBy: {
            id: "asc"
        },

        select: {

            id: true,

            title: true,

            description: true,

            courseId: true,

            createdAt: true,

            updatedAt: true,

            lessons: {

                orderBy: [
                    {
                        order: "asc"
                    },
                    {
                        id: "asc"
                    }
                ],

                select: lessonSelect
            }
        }
    });
};


/*
 * Create module
 */
const createModule = async (data) => {

    return await prisma.module.create({

        data,

        select: {

            id: true,

            title: true,

            description: true,

            courseId: true,

            createdAt: true,

            updatedAt: true,

            course: {
                select: courseSelect
            }
        }
    });
};


/*
 * Update module
 */
const updateModule = async (
    id,
    data
) => {

    return await prisma.module.update({

        where: {
            id
        },

        data,

        select: {

            id: true,

            title: true,

            description: true,

            courseId: true,

            createdAt: true,

            updatedAt: true,

            course: {
                select: courseSelect
            }
        }
    });
};


/*
 * Delete module
 */
const deleteModule = async (id) => {

    return await prisma.module.delete({

        where: {
            id
        }
    });
};


module.exports = {

    getAllModules,

    getModuleById,

    getModulesByCourseId,

    createModule,

    updateModule,

    deleteModule
};