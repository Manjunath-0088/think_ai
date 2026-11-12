const codeExecutionService =
    require("../services/codeExecutionService");


// =====================================================
const executeCode = async (
    req,
    res
) => {

    try {

        const {
            language,
            code,
            stdin,
            submissionId,
            questionId,
            testCaseId
        } = req.body;


        const parsedSubmissionId =
            Number(submissionId);

        const parsedQuestionId =
            Number(questionId);

        const parsedTestCaseId =
            Number(testCaseId);


        if (
            !Number.isInteger(parsedSubmissionId) ||
            parsedSubmissionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Submission ID must be a positive integer"
            });
        }


        if (
            !Number.isInteger(parsedQuestionId) ||
            parsedQuestionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Question ID must be a positive integer"
            });
        }


        if (
            !Number.isInteger(parsedTestCaseId) ||
            parsedTestCaseId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Test Case ID must be a positive integer"
            });
        }


        if (
            typeof language !== "string" ||
            !language.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Programming language is required"
            });
        }


        if (
            typeof code !== "string" ||
            !code.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Source code is required"
            });
        }


        if (
            stdin !== undefined &&
            stdin !== null &&
            typeof stdin !== "string"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "stdin must be a string"
            });
        }


        const callbackUrl =
            process.env.JUDGE0_CALLBACK_URL ||
            null;


        /*
         * Execute and WAIT for Judge0.
         */
        const result =
            await codeExecutionService
                .executeCode({

                    language,

                    code,

                    stdin:
                        stdin || "",

                    callbackUrl
                });


        /*
         * Run Code response.
         *
         * No IN_QUEUE response.
         */
        return res.status(200).json({

            success: true,

            message:
                "Code execution completed",

            data: {

                submissionId:
                    parsedSubmissionId,

                questionId:
                    parsedQuestionId,

                testCaseId:
                    parsedTestCaseId,

                judge0Token:
                    result.data.token,

                status:
                    result.data.status,

                stdout:
                    result.data.stdout,

                stderr:
                    result.data.stderr,

                compileOutput:
                    result.data.compileOutput,

                time:
                    result.data.time,

                memory:
                    result.data.memory
            }
        });


    } catch (error) {

        console.error(
            "Code execution error:",
            error
        );


        const message =
            error?.message ||
            "Code execution failed";


        if (
            message.includes(
                "must be a positive integer"
            ) ||
            message.includes(
                "Programming language is required"
            ) ||
            message.includes(
                "Unsupported language"
            ) ||
            message.includes(
                "Source code is required"
            ) ||
            message.includes(
                "stdin must be a string"
            )
        ) {

            return res.status(400).json({
                success: false,
                message
            });
        }


        if (
            message.includes(
                "JUDGE0_URL is not configured"
            )
        ) {

            return res.status(503).json({
                success: false,
                message
            });
        }


        if (
            message.includes(
                "Judge0"
            )
        ) {

            return res.status(502).json({
                success: false,
                message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Code execution service failed"
        });
    }
};

const submitCode = async (
    req,
    res
) => {

    try {

        const {
            submissionId,
            questionId,
            language,
            code
        } = req.body;


        const parsedSubmissionId =
            Number(submissionId);

        const parsedQuestionId =
            Number(questionId);



        if (
            !Number.isInteger(
                parsedSubmissionId
            ) ||
            parsedSubmissionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Submission ID must be a positive integer"
            });
        }


        if (
            !Number.isInteger(
                parsedQuestionId
            ) ||
            parsedQuestionId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Question ID must be a positive integer"
            });
        }


        if (
            typeof language !== "string" ||
            !language.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Programming language is required"
            });
        }


        if (
            typeof code !== "string" ||
            !code.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Source code is required"
            });
        }


        const callbackUrl =
            process.env.JUDGE0_CALLBACK_URL ||
            null;


        /*
         * This waits for ALL test cases.
         */
        const result =
            await codeExecutionService
                .submitCode({

                    submissionId:
                        parsedSubmissionId,

                    questionId:
                        parsedQuestionId,

                    language,

                    code,

                    callbackUrl
                });


        /*
         * GFG-style final response.
         */
        return res.status(200).json({

            success: true,

            message:
                "Code submitted and evaluated successfully",

            data:
                result.data
        });


    } catch (error) {

        console.error(
            "Code submission error:",
            error
        );


        const message =
            error?.message ||
            "Code submission failed";
        if ([403, 404, 409].includes(error.status)) {
            return res.status(error.status).json({ success: false, message });
        }



        if (
            message.includes(
                "must be a positive integer"
            ) ||
            message.includes(
                "Programming language is required"
            ) ||
            message.includes(
                "Unsupported language"
            ) ||
            message.includes(
                "Source code is required"
            ) ||
            message.includes(
                "No coding test cases found"
            )
        ) {

            return res.status(400).json({
                success: false,
                message
            });
        }


        if (
            message.includes(
                "JUDGE0_URL is not configured"
            )
        ) {

            return res.status(503).json({
                success: false,
                message
            });
        }


        if (
            message.includes(
                "Judge0"
            )
        ) {

            return res.status(502).json({
                success: false,
                message
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Code submission service failed"
        });
    }
};

// =====================================================
const gradingCallback = async (
    req,
    res
) => {

    try {

        const result =
            req.body;


        if (
            !result ||
            typeof result !== "object"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid Judge0 callback data"
            });
        }


        const token =
            result.token;


        if (
            typeof token !== "string" ||
            !token.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Judge0 token is required"
            });
        }


        /*
         * Callback remains available for Judge0.
         *
         * Students do NOT call this endpoint.
         *
         * The main Run/Submit flow already waits
         * for Judge0 and grades internally.
         */
        console.log(
            "DEBUG Judge0 callback received:",
            {
                token,
                status:
                    result.status?.description ||
                    "UNKNOWN"
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Judge0 callback received",

            data: {

                judge0Token:
                    token,

                judge0Status:
                    result.status?.description ||
                    "UNKNOWN"
            }
        });


    } catch (error) {

        console.error(
            "Judge0 callback error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to process Judge0 callback"
        });
    }
};

const practiceRun = async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    if (typeof language !== "string" || !language.trim()) {
      return res.status(400).json({ success: false, message: "Programming language is required" });
    }
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ success: false, message: "Source code is required" });
    }
    if (stdin !== undefined && stdin !== null && typeof stdin !== "string") {
      return res.status(400).json({ success: false, message: "stdin must be a string" });
    }

    // No submissionId, no callbackUrl — nothing is persisted.
    const result = await codeExecutionService.executeCode({
      language,
      code,
      stdin: stdin || "",
    });

    return res.status(200).json({ success: true, message: "Code execution completed", data: result.data });

  } catch (error) {
    console.error("Practice run error:", error);
    const message = error?.message || "Code execution failed";

    if (message.includes("Programming language is required") || message.includes("Unsupported language") ||
        message.includes("Source code is required") || message.includes("stdin must be a string")) {
      return res.status(400).json({ success: false, message });
    }
    if (message.includes("JUDGE0_URL is not configured")) {
      return res.status(503).json({ success: false, message });
    }
    if (message.includes("Judge0")) {
      return res.status(502).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: "Code execution service failed" });
  }
};

module.exports = { executeCode, submitCode, gradingCallback, practiceRun };

module.exports.getCodingAssessment = async (req, res, next) => {
  try {
    const assessment = await require("../services/assessmentService").getAssessmentById(req.params.assessmentId);
    const questions = (assessment?.questions || []).filter(q => q.type === 'coding' || q.coding);
    res.json({ questions });
  } catch (err) { next(err); }
};
