const express = require("express");

const router = express.Router();


const {
    getProgressByEnrollment,
    getLessonProgress,
    completeLesson,
    getProgressSummary
} = require("../controllers/lessonProgressController");


const {
    validateEnrollmentId,
    validateLessonId,
    validateCompleteLesson
} = require("../validations/lessonProgressValidation");


// ----------------------------------------------------
// Swagger
// ----------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: Lesson Progress
 *   description: Lesson Progress Management APIs
 */


/**
 * @swagger
 * /api/lesson-progress/enrollment/{enrollmentId}/summary:
 *   get:
 *     summary: Get course progress summary
 *     description: >
 *       Returns total lessons, completed lessons,
 *       completion percentage and whether the
 *       80% course completion requirement is met.
 *     tags: [Lesson Progress]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Progress summary retrieved successfully
 *       400:
 *         description: Invalid enrollment ID
 *       404:
 *         description: Enrollment or course not found
 *       500:
 *         description: Failed to retrieve progress summary
 */
router.get(
    "/enrollment/:enrollmentId/summary",
    validateEnrollmentId,
    getProgressSummary
);


/**
 * @swagger
 * /api/lesson-progress/enrollment/{enrollmentId}:
 *   get:
 *     summary: Get all lesson progress for an enrollment
 *     tags: [Lesson Progress]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Lesson progress retrieved successfully
 *       400:
 *         description: Invalid enrollment ID
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Failed to retrieve lesson progress
 */
router.get(
    "/enrollment/:enrollmentId",
    validateEnrollmentId,
    getProgressByEnrollment
);


/**
 * @swagger
 * /api/lesson-progress/enrollment/{enrollmentId}/lesson/{lessonId}:
 *   get:
 *     summary: Get progress for a specific lesson
 *     tags: [Lesson Progress]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 10
 *     responses:
 *       200:
 *         description: Lesson progress retrieved successfully
 *       400:
 *         description: Invalid enrollment or lesson ID
 *       404:
 *         description: Lesson progress not found
 *       500:
 *         description: Failed to retrieve lesson progress
 */
router.get(
    "/enrollment/:enrollmentId/lesson/:lessonId",
    validateEnrollmentId,
    validateLessonId,
    getLessonProgress
);


/**
 * @swagger
 * /api/lesson-progress/lesson/{lessonId}/complete:
 *   post:
 *     summary: Mark a lesson as completed
 *     description: >
 *       Marks a lesson as completed for an enrollment.
 *       The enrollment must have course access and
 *       the lesson must belong to the enrolled course.
 *     tags: [Lesson Progress]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enrollmentId
 *             properties:
 *               enrollmentId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Lesson completed successfully
 *       400:
 *         description: Invalid ID or lesson/course relationship
 *       403:
 *         description: Course access is not unlocked
 *       404:
 *         description: Enrollment or lesson not found
 *       500:
 *         description: Failed to complete lesson
 */
router.post(
    "/lesson/:lessonId/complete",
    validateLessonId,
    validateCompleteLesson,
    completeLesson
);


module.exports = router;