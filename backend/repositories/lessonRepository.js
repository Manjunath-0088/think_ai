const prisma = require("../config/database");


const lessonSelect = {
    id: true,
    title: true,
    description: true,
    content: true,
    videoUrl: true,
    duration: true,
    order: true,
    moduleId: true
};


const lessonWithModuleSelect = {
    ...lessonSelect,

    module: {
        select: {
            id: true,
            title: true,
            courseId: true,

            course: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
    }
};


/*
 * Get all lessons
 */
const getAllLessons = async () => {

    return await prisma.lesson.findMany({

        select: lessonWithModuleSelect,

        orderBy: [
            {
                moduleId: "asc"
            },
            {
                order: "asc"
            },
            {
                id: "asc"
            }
        ]
    });
};


/*
 * Get lesson by ID
 */
const getLessonById = async (id) => {

    return await prisma.lesson.findUnique({

        where: {
            id
        },

        select: lessonWithModuleSelect
    });
};


/*
 * Get lessons belonging to a module
 */
const getLessonsByModuleId = async (
    moduleId
) => {

    return await prisma.lesson.findMany({

        where: {
            moduleId
        },

        select: lessonSelect,

        orderBy: [
            {
                order: "asc"
            },
            {
                id: "asc"
            }
        ]
    });
};


/*
 * Create lesson
 */
const createLesson = async (data) => {

    return await prisma.lesson.create({

        data,

        select: lessonWithModuleSelect
    });
};


/*
 * Update lesson
 */
const updateLesson = async (
    id,
    data
) => {

    return await prisma.lesson.update({

        where: {
            id
        },

        data,

        select: lessonWithModuleSelect
    });
};


/*
 * Delete lesson
 */
const deleteLesson = async (id) => {

    return await prisma.lesson.delete({

        where: {
            id
        },

        select: {
            id: true
        }
    });
};


module.exports = {

    getAllLessons,

    getLessonById,

    getLessonsByModuleId,

    createLesson,

    updateLesson,

    deleteLesson
};