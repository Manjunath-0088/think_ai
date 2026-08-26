const express = require("express");

const router = express.Router();

const {
    executeCode,
    gradingCallback
} = require("../controllers/codeExecutionController");

const {
    getAssessmentSubmissionResult
} = require("../controllers/assessmentController");

const {
    validateCodeExecution
} = require("../validations/codeExecutionValidation");


// ----------------------------------------------------
// Swagger
// ----------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: Code Execution
 *   description: Judge0 Code Execution Proxy APIs
 */


/**
 * @swagger
 * /api/code/execute:
 *   post:
 *     summary: Execute source code using Judge0
 *     tags: [Code Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *               - code
 *               - submissionId
 *             properties:
 *               language:
 *                 type: string
 *                 example: javascript
 *                 description: Programming language
 *               code:
 *                 type: string
 *                 example: console.log("Hello World");
 *                 description: Source code to execute
 *               stdin:
 *                 type: string
 *                 example: ""
 *                 description: Standard input for the program
 *               submissionId:
 *                 type: integer
 *                 example: 1
 *                 description: Assessment submission ID
 *
 *     responses:
 *       201:
 *         description: Code submission created successfully
 *       400:
 *         description: Invalid code execution request
 *       502:
 *         description: Judge0 execution service failed
 *       503:
 *         description: Judge0 is not configured
 */
router.post(
    "/execute",
    validateCodeExecution,
    executeCode
);


/**
 * @swagger
 * /api/code/callback:
 *   put:
 *     summary: Receive Judge0 grading callback
 *     tags: [Code Execution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "8a5f5d9b-edff-48c1-8172-c4c315b3d28e"
 *               status:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 3
 *                   description:
 *                     type: string
 *                     example: Accepted
 *               stdout:
 *                 type: string
 *                 example: "Hello World"
 *               stderr:
 *                 type: string
 *                 nullable: true
 *               compile_output:
 *                 type: string
 *                 nullable: true
 *               time:
 *                 type: string
 *                 example: "0.015"
 *               memory:
 *                 type: integer
 *                 example: 10240
 *
 *     responses:
 *       200:
 *         description: Grading result processed successfully
 *       400:
 *         description: Judge0 token is missing
 *       404:
 *         description: Assessment submission not found
 *       500:
 *         description: Failed to process grading result
 */
router.put(
    "/callback",
    gradingCallback
);


/**
 * @swagger
 * /api/code/submissions/{submissionId}:
 *   get:
 *     summary: Get code execution result
 *     description: Returns the Judge0 execution result and assessment submission status.
 *     tags: [Code Execution]
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Assessment submission ID
 *
 *     responses:
 *       200:
 *         description: Code execution result retrieved successfully
 *
 *       400:
 *         description: Invalid submission ID
 *
 *       404:
 *         description: Assessment submission not found
 *
 *       500:
 *         description: Failed to get assessment submission result
 */
router.get(
    "/submissions/:submissionId",
    getAssessmentSubmissionResult
);


module.exports = router;