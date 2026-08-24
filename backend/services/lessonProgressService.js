const repository =
    require("../repositories/lessonProgressRepository");

const automationService =
    require("./automationService");


/*
 * Validate a positive integer ID
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
 * Get all lesson progress for an enrollment
 */
const getProgressByEnrollment = (
    enrollmentId
) => {

    const id = validateId(
        enrollmentId,
        "Enrollment ID"
    );

    return repository.getProgressByEnrollment(
        id
    );
};


/*
 * Get progress for a specific lesson
 */
const getLessonProgress = (
    enrollmentId,
    lessonId
) => {

    const enrollmentIdNumber =
        validateId(
            enrollmentId,
            "Enrollment ID"
        );

    const lessonIdNumber =
        validateId(
            lessonId,
            "Lesson ID"
        );

    return repository.getLessonProgress(
        enrollmentIdNumber,
        lessonIdNumber
    );
};


/*
 * Complete a lesson
 *
 * 1. Validate IDs
 * 2. Complete lesson
 * 3. Trigger automation
 *
 * Automation failure does NOT
 * rollback successful lesson completion.
 */
const completeLesson = async (
    enrollmentId,
    lessonId
) => {

    const enrollmentIdNumber =
        validateId(
            enrollmentId,
            "Enrollment ID"
        );

    const lessonIdNumber =
        validateId(
            lessonId,
            "Lesson ID"
        );


    /*
     * Complete lesson first.
     */
    const progress =
        await repository.completeLesson(
            enrollmentIdNumber,
            lessonIdNumber
        );


    /*
     * Default automation response.
     */
    let automation = {
        success: false,
        processed: false,
        message:
            "Automation was not processed"
    };


    /*
     * Process automation only after
     * successful lesson completion.
     */
    try {

        const result =
            await automationService
                .processLessonCompletion(
                    enrollmentIdNumber
                );


        automation = {
            success: true,
            processed: true,
            data: result
        };

    } catch (error) {

        /*
         * Do not rollback lesson progress.
         *
         * The student's lesson completion
         * has already been saved successfully.
         */
        console.error(
            "Automation processing failed:",
            error
        );


        automation = {
            success: false,
            processed: false,
            message:
                "Lesson completed, but automation processing failed"
        };
    }


    return {
        progress,
        automation
    };
};


/*
 * Get course progress summary
 */
const getProgressSummary = async (
    enrollmentId
) => {

    const id =
        validateId(
            enrollmentId,
            "Enrollment ID"
        );


    const summary =
        await repository.getProgressSummary(
            id
        );


    return {
        enrollmentId: id,

        totalLessons:
            summary.totalLessons,

        completedLessons:
            summary.completedLessons,

        completionPercentage:
            summary.completionPercentage,

        courseCompletionRequirementMet:
            summary.completionPercentage >= 80
    };
};


module.exports = {

    getProgressByEnrollment,

    getLessonProgress,

    completeLesson,

    getProgressSummary
};