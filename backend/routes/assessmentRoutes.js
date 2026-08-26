const express = require("express");

const router = express.Router();

const {
    createAssessment,
    getAllAssessments,
    updateAssessment,
    deleteAssessment, 
    getAssessmentById,
    submitAssessment,
    getEnrollmentAssessmentStatus, 
    getAssessmentAnalytics,
    getAssessmentSubmissions
} = require("../controllers/assessmentController");

const {
    validateAssessmentCreate,
    validateAssessmentId,
    validateAssessmentSubmit
} = require("../validations/assessmentValidation");


// ----------------------------------------------------
// Swagger
// ----------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: Assessments
 *   description: Assessment Engine APIs
 */


/**
 * @swagger
 * /api/assessments:
 *   post:
 *     summary: Create a new assessment
 *     tags: [Assessments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - totalMarks
 *               - moduleId
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 example: Java Fundamentals Assessment
 *               description:
 *                 type: string
 *                 example: Basic Java assessment
 *               totalMarks:
 *                 type: integer
 *                 example: 10
 *               duration:
 *                 type: integer
 *                 example: 30
 *               status:
 *                 type: string
 *                 enum:
 *                   - ACTIVE
 *                   - INACTIVE
 *                 example: ACTIVE
 *               moduleId:
 *                 type: integer
 *                 example: 1
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionText
 *                     - marks
 *                     - options
 *                   properties:
 *                     questionText:
 *                       type: string
 *                       example: Which keyword is used to inherit a class in Java?
 *                     questionType:
 *                       type: string
 *                       enum:
 *                         - MCQ
 *                         - CODING
 *                       example: MCQ
 *                     marks:
 *                       type: integer
 *                       example: 1
 *                     order:
 *                       type: integer
 *                       example: 1
 *                     options:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           optionText:
 *                             type: string
 *                             example: extends
 *                           isCorrect:
 *                             type: boolean
 *                             example: true
 *     responses:
 *       201:
 *         description: Assessment created successfully
 *       400:
 *         description: Assessment validation failed
 *       500:
 *         description: Internal server error
 */
router.post(
    "/",
    validateAssessmentCreate,
    createAssessment
);


/**
 * @swagger
 * /api/assessments/{id}/analytics:
 *   get:
 *     summary: Get assessment analytics
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Assessment analytics
 *       400:
 *         description: Invalid assessment ID
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/:id/analytics",
    validateAssessmentId,
    getAssessmentAnalytics
);


/**
 * @swagger
 * /api/assessments/{id}/submissions:
 *   get:
 *     summary: List all submissions for an assessment
 *     description: >
 *       Returns every submission for the given assessment, joined with
 *       the enrollment's student name/email. Used by the instructor's
 *       "Student Submissions" page.
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of submissions
 *       400:
 *         description: Invalid assessment ID
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/:id/submissions",
    validateAssessmentId,
    getAssessmentSubmissions
);


/**
 * @swagger
 * /api/assessments/{id}:
 *   get:
 *     summary: Get assessment by ID
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Assessment details
 *       400:
 *         description: Invalid assessment ID
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/:id",
    validateAssessmentId,
    getAssessmentById
);


/**
 * @swagger
 * /api/assessments/{id}/submit:
 *   post:
 *     summary: Submit assessment and automatically grade MCQ answers
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enrollmentId
 *               - answers
 *             properties:
 *               enrollmentId:
 *                 type: integer
 *                 example: 1
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedOptionId
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                       example: 1
 *                     selectedOptionId:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Assessment submitted and graded successfully
 *       400:
 *         description: Invalid assessment submission
 *       500:
 *         description: Internal server error
 */
router.post(
    "/:id/submit",
    validateAssessmentId,
    validateAssessmentSubmit,
    submitAssessment
);

router.get("/", getAllAssessments);

router.put("/:id", validateAssessmentId, updateAssessment);
router.delete("/:id", validateAssessmentId, deleteAssessment);
router.get("/enrollment/:enrollmentId/status", getEnrollmentAssessmentStatus);


module.exports = router;