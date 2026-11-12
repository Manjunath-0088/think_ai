const prisma = require("../config/database");

const createAssessment = async (data) => {

    return await prisma.assessment.create({
        data: {
            title: data.title,
            description: data.description || null,

            totalMarks:
                Number(data.totalMarks),

            duration:
                data.duration !== undefined &&
                data.duration !== null
                    ? Number(data.duration)
                    : null,

            status:
                data.status || "ACTIVE",

            moduleId:
                Number(data.moduleId),

            questions: {
                create: data.questions.map(
                    (question, index) => ({
                        questionText:
                            question.questionText,

                        questionType:
                            question.questionType ||
                            "MCQ",

                        marks:
                            Number(question.marks),

                        order:
                            question.order !== undefined
                                ? Number(question.order)
                                : index,

                        options:
                            Array.isArray(
                                question.options
                            )
                                ? {
                                    create:
                                        question.options.map(
                                            (option) => ({
                                                optionText:
                                                    option.optionText,

                                                isCorrect:
                                                    option.isCorrect === true
                                            })
                                        )
                                }
                                : undefined
                    })
                )
            }
        },

        include: {
            questions: {
                include: {
                    options: true
                },
                orderBy: {
                    order: "asc"
                }
            }
        }
    });
};

const getAllAssessments = async (moduleId) => {
    const where = {};
    if (moduleId) {
        where.moduleId = Number(moduleId);
    }

    return await prisma.assessment.findMany({
        where,
        include: {
            questions: {
                include: {
                    options: true,
                    codingTestCases: true // Ensures it matches your Prisma schema
                },
                orderBy: {
                    order: "asc"
                }
            }
        },
        orderBy: {
            id: "asc"
        }
    });
};

const updateAssessment = async (id, data) => {
    return await prisma.$transaction(async (tx) => {
        await tx.assessment.update({
            where: { id: Number(id) },
            data: {
                title: data.title,
                description: data.description,
                totalMarks:
                    data.totalMarks !== undefined
                        ? Number(data.totalMarks)
                        : undefined,
                duration:
                    data.duration !== undefined
                        ? data.duration
                            ? Number(data.duration)
                            : null
                        : undefined,
                status: data.status || undefined
            }
        });

        if (Array.isArray(data.questions)) {
            await tx.question.deleteMany({
                where: { assessmentId: Number(id) }
            });

            for (const [index, question] of data.questions.entries()) {
                const questionType = question.questionType || "MCQ";
                const questionData = {
                    assessmentId: Number(id),
                    questionText: question.questionText,
                    questionType,
                    marks: Number(question.marks),
                    order: question.order !== undefined ? Number(question.order) : index
                };

                if (questionType === "MCQ" && Array.isArray(question.options)) {
                    questionData.options = {
                        create: question.options.map((option) => ({
                            optionText: option.optionText,
                            isCorrect: option.isCorrect === true
                        }))
                    };
                }

                if (questionType === "CODING" && Array.isArray(question.testCases)) {
                    questionData.title = question.title || null;
                    questionData.difficulty = question.difficulty || null;
                    questionData.problemStatement = question.problemStatement || null;
                    questionData.inputFormat = question.inputFormat || null;
                    questionData.outputFormat = question.outputFormat || null;
                    questionData.constraints = question.constraints || null;
                    questionData.explanation = question.explanation || null;
                    questionData.examples = question.examples !== undefined ? question.examples : null;
                    questionData.supportedLanguages = question.supportedLanguages !== undefined ? question.supportedLanguages : null;
                    questionData.starterCode = question.starterCode !== undefined ? question.starterCode : null;

                    questionData.codingTestCases = {
                        create: question.testCases.map((tc) => ({
                            input: tc.input !== undefined && tc.input !== null ? String(tc.input) : null,
                            expectedOutput: String(tc.expectedOutput).trim(),
                            marks: tc.marks !== undefined ? Number(tc.marks) : 1,
                            isHidden: tc.isHidden === true
                        }))
                    };
                }

                await tx.question.create({ data: questionData });
            }
        }

        return await tx.assessment.findUnique({
            where: { id: Number(id) },
            include: {
                questions: {
                    include: {
                        options: true,
                        codingTestCases: {
                            orderBy: { id: "asc" }
                        }
                    },
                    orderBy: { order: "asc" }
                }
            }
        });
    });
};

const deleteAssessment = async (id) => {
    return await prisma.assessment.delete({
        where: { id: Number(id) }
    });
};

const getAssessmentById = async (id) => {

    return await prisma.assessment.findUnique({
        where: {
            id: Number(id)
        },

        include: {
            questions: {
                include: {
                    options: true
                },

                orderBy: {
                    order: "asc"
                }
            }
        }
    });
};

const submitAssessment = async (
    assessmentId,
    data
) => {

    const id =
        Number(assessmentId);

    const enrollmentId =
        Number(data.enrollmentId);


    /*
     * Fetch assessment and its course
     * in one database query.
     */
    const assessment =
        await prisma.assessment.findUnique({

            where: {
                id
            },

            select: {
                id: true,
                title: true,
                totalMarks: true,
                status: true,

                module: {
                    select: {
                        courseId: true
                    }
                },

                questions: {
                    select: {
                        id: true,
                        marks: true,
                        questionType: true,

                        options: {
                            select: {
                                id: true,
                                isCorrect: true
                            }
                        }
                    },

                    orderBy: {
                        order: "asc"
                    }
                }
            }
        });


    if (!assessment) {
        throw new Error(
            "Assessment not found"
        );
    }


    /*
     * Do not allow submissions to
     * inactive assessments.
     */
    if (assessment.status !== "ACTIVE") {
        throw new Error(
            "Assessment is not active"
        );
    }


    /*
     * Get enrollment and course information.
     */
    const enrollment =
        await prisma.enrollment.findUnique({

            where: {
                id: enrollmentId
            },

            select: {
                id: true,
                enrollmentStatus: true,

                batch: {
                    select: {
                        courseId: true,
                        status: true,

                        course: {
                            select: {
                                status: true
                            }
                        }
                    }
                }
            }
        });


    if (!enrollment) {
        throw new Error(
            "Enrollment not found"
        );
    }


    /*
     * Validate enrollment status.
     */
    if (
        ![
            "ACTIVE",
            "ENROLLED"
        ].includes(
            enrollment.enrollmentStatus
        )
    ) {
        throw new Error(
            "Enrollment is not active"
        );
    }


    /*
     * Validate batch status.
     */
    if (
        enrollment.batch?.status !==
        "ACTIVE"
    ) {
        throw new Error(
            "Batch is not active"
        );
    }


    /*
     * Validate course status.
     */
    if (
        enrollment.batch?.course?.status !==
        "ACTIVE"
    ) {
        throw new Error(
            "Course is not active"
        );
    }


    /*
     * Make sure the assessment belongs
     * to the enrolled course.
     */
    if (
        !assessment.module ||
        assessment.module.courseId !==
        enrollment.batch.courseId
    ) {
        throw new Error(
            "This assessment does not belong to the enrolled course"
        );
    }


    /*
     * Validate answers.
     */
    if (!Array.isArray(data.answers)) {
        throw new Error(
            "Answers must be an array"
        );
    }


    if (data.answers.length === 0) {
        throw new Error(
            "At least one answer is required"
        );
    }


    /*
     * Prevent submitting the same
     * question multiple times.
     */
    const questionIds =
        data.answers.map(
            (answer) =>
                Number(answer.questionId)
        );

    const uniqueQuestionIds =
        new Set(questionIds);

    if (
        uniqueQuestionIds.size !==
        questionIds.length
    ) {
        throw new Error(
            "Duplicate question answers are not allowed"
        );
    }


    let score = 0;


    /*
     * Calculate answer results.
     */
    const answers =
        data.answers.map(
            (answer) => {

                const question =
                    assessment.questions.find(
                        (item) =>
                            item.id ===
                            Number(
                                answer.questionId
                            )
                    );


                if (!question) {
                    throw new Error(
                        `Question ${answer.questionId} not found in this assessment`
                    );
                }


                /*
                 * Coding questions don't use
                 * MCQ options.
                 */
                if (
                    question.questionType ===
                    "CODING"
                ) {
                    return {
                        questionId:
                            question.id,

                        selectedOptionId:
                            null,

                        isCorrect:
                            false,

                        marksObtained:
                            0
                    };
                }


                const selectedOption =
                    question.options.find(
                        (option) =>
                            option.id ===
                            Number(
                                answer.selectedOptionId
                            )
                    );


                if (!selectedOption) {
                    throw new Error(
                        `Invalid option for question ${question.id}`
                    );
                }


                const isCorrect =
                    selectedOption.isCorrect ===
                    true;


                const marksObtained =
                    isCorrect
                        ? Number(question.marks)
                        : 0;


                score += marksObtained;


                return {
                    questionId:
                        question.id,

                    selectedOptionId:
                        selectedOption.id,

                    isCorrect,

                    marksObtained
                };
            }
        );


    /*
     * Calculate percentage.
     */
    const percentage =
        Number(
            (
                assessment.totalMarks > 0
                    ? (
                        score /
                        assessment.totalMarks
                    ) * 100
                    : 0
            ).toFixed(2)
        );


    /*
     * Create submission and answers
     * inside a transaction.
     */
    const submission =
        await prisma.$transaction(
            async (tx) => {

                return await tx
                    .assessmentSubmission
                    .create({

                        data: {
                            assessmentId: id,

                            enrollmentId:
                                enrollmentId,

                            score,

                            totalMarks:
                                assessment.totalMarks,

                            percentage,

                            status:
                                "SUBMITTED",

                            answers: {
                                create:
                                    answers
                            }
                        },

                        include: {
                            answers: true
                        }
                    });
            }
        );


    return submission;
};

const startAssessment = async (assessmentId, enrollmentId) => {
    const id = Number(assessmentId);
    const enrollment = Number(enrollmentId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Assessment ID must be a positive integer");
    }

    if (!Number.isInteger(enrollment) || enrollment <= 0) {
        throw new Error("Enrollment ID must be a positive integer");
    }

    const assessment = await prisma.assessment.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            title: true,
            totalMarks: true,
            status: true,
            module: {
                select: {
                    courseId: true
                }
            }
        }
    });

    if (!assessment) {
        throw new Error("Assessment not found");
    }

    if (assessment.status !== "ACTIVE") {
        throw new Error("Assessment is not active");
    }

    const enrollmentRecord = await prisma.enrollment.findUnique({
        where: {
            id: enrollment
        },
        select: {
            id: true,
            enrollmentStatus: true,
            batch: {
                select: {
                    courseId: true,
                    status: true,
                    course: {
                        select: {
                            status: true
                        }
                    }
                }
            }
        }
    });

    if (!enrollmentRecord) {
        throw new Error("Enrollment not found");
    }

    if (!["ACTIVE", "ENROLLED"].includes(enrollmentRecord.enrollmentStatus)) {
        throw new Error("Enrollment is not active");
    }

    if (enrollmentRecord.batch?.status !== "ACTIVE") {
        throw new Error("Batch is not active");
    }

    if (enrollmentRecord.batch?.course?.status !== "ACTIVE") {
        throw new Error("Course is not active");
    }

    if (
        !assessment.module ||
        assessment.module.courseId !== enrollmentRecord.batch.courseId
    ) {
        throw new Error("This assessment does not belong to the enrolled course");
    }

    const existingSubmission = await prisma.assessmentSubmission.findFirst({
        where: {
            assessmentId: id,
            enrollmentId: enrollment
        },
        orderBy: {
            createdAt: "desc"
        },
        include: {
            answers: true
        }
    });

    if (existingSubmission) {
        return existingSubmission;
    }

    const submission = await prisma.assessmentSubmission.create({
        data: {
            assessmentId: id,
            enrollmentId: enrollment,
            score: 0,
            totalMarks: assessment.totalMarks,
            percentage: 0,
            status: "IN_PROGRESS"
        },
        include: {
            answers: true
        }
    });

    return submission;
};

const getAssessmentAnalytics =
    async (assessmentId) => {

        const id =
            Number(assessmentId);


        /*
         * Check assessment exists first.
         */
        const assessment =
            await prisma.assessment.findUnique({

                where: {
                    id
                },

                select: {
                    id: true,
                    title: true
                }
            });


        if (!assessment) {
            throw new Error(
                "Assessment not found"
            );
        }


        /*
         * Aggregate submission statistics.
         */
        const result =
            await prisma.assessmentSubmission
                .aggregate({

                    where: {
                        assessmentId: id
                    },

                    _count: {
                        id: true
                    },

                    _avg: {
                        score: true,
                        percentage: true
                    },

                    _max: {
                        score: true
                    },

                    _min: {
                        score: true
                    }
                });


        /*
         * Count passed submissions.
         */
        const passed =
            await prisma.assessmentSubmission.count({

                where: {
                    assessmentId: id,

                    percentage: {
                        gte: 40
                    }
                }
            });


        const totalSubmissions =
            result._count.id;


        const failed =
            totalSubmissions - passed;


        return {

            assessmentId:
                assessment.id,

            title:
                assessment.title,

            totalSubmissions,

            averageScore:
                Number(
                    (
                        result._avg.score || 0
                    ).toFixed(2)
                ),

            averagePercentage:
                Number(
                    (
                        result._avg.percentage || 0
                    ).toFixed(2)
                ),

            highestScore:
                Number(
                    (
                        result._max.score || 0
                    )
                ),

            lowestScore:
                Number(
                    (
                        result._min.score || 0
                    )
                ),

            passed,

            failed
        };
    };

const getSubmissionsByAssessmentId = async (assessmentId) => {
    return await prisma.assessmentSubmission.findMany({
        where: {
            assessmentId: Number(assessmentId)
        },
        include: {
            enrollment: {
                select: {
                    id: true,
                    studentName: true,
                    studentEmail: true
                }
            }
        },
        orderBy: {
            submittedAt: "desc"
        }
    });
};

const saveJudge0Token = async (
    submissionId,
    judge0Token
) => {

    if (!judge0Token) {
        throw new Error(
            "Judge0 token is required"
        );
    }


    return await prisma
        .assessmentSubmission
        .update({

            where: {
                id: Number(submissionId)
            },

            data: {
                judge0Token
            }
        });
};

const getSubmissionByJudge0Token =
    async (judge0Token) => {

        if (!judge0Token) {
            throw new Error(
                "Judge0 token is required"
            );
        }


        return await prisma
            .assessmentSubmission
            .findUnique({

                where: {
                    judge0Token
                },

                include: {
                    assessment: true,
                    answers: true
                }
            });
    };

const updateAssessmentSubmissionStatus = async (
    submissionId,
    data
) => {

    const submission =
        await prisma.assessmentSubmission.findUnique({
            where: {
                id: Number(submissionId)
            },
            include: {
                assessment: {
                    include: {
                        questions: true
                    }
                },
                answers: true
            }
        });

    if (!submission) {
        throw new Error(
            "Assessment submission not found"
        );
    }

    const judge0Status =
        data.judge0Status || null;

    let status = "FAILED";

    if (judge0Status === "Accepted") {
        status = "COMPLETED";
    }

    /*
     * Find the coding answer associated
     * with this submission.
     */
    const codingAnswer =
        submission.answers.find(
            answer => answer.code
        );

    /*
     * If Judge0 accepted the code,
     * mark the coding answer correct.
     */
    if (codingAnswer) {

        const question =
            await prisma.question.findUnique({
                where: {
                    id: codingAnswer.questionId
                }
            });

        if (question) {

            const isCorrect =
                judge0Status === "Accepted";

            await prisma.submissionAnswer.update({
                where: {
                    id: codingAnswer.id
                },
                data: {
                    isCorrect,
                    marksObtained:
                        isCorrect
                            ? question.marks
                            : 0
                }
            });
        }
    }

    /*
     * Recalculate submission score.
     */
    const updatedAnswers =
        await prisma.submissionAnswer.findMany({
            where: {
                submissionId: Number(submissionId)
            }
        });

    const score =
        updatedAnswers.reduce(
            (total, answer) =>
                total +
                Number(answer.marksObtained || 0),
            0
        );

    const totalMarks =
        submission.totalMarks;

    const percentage =
        totalMarks > 0
            ? Number(
                (
                    (score / totalMarks) *
                    100
                ).toFixed(2)
            )
            : 0;

    return await prisma.assessmentSubmission.update({

        where: {
            id: Number(submissionId)
        },

        data: {

            judge0Status,

            stdout:
                data.stdout || null,

            stderr:
                data.stderr || null,

            compileOutput:
                data.compileOutput || null,

            executionTime:
                data.executionTime
                    ? String(data.executionTime)
                    : null,

            memory:
                data.memory !== undefined &&
                data.memory !== null
                    ? Number(data.memory)
                    : null,

            score,

            percentage,

            status
        },

        include: {
            assessment: {
                select: {
                    id: true,
                    title: true,
                    totalMarks: true
                }
            },

            answers: true
        }
    });
};

const getEnrollmentAssessmentStatus = async (enrollmentId) => {
    const id = Number(enrollmentId);

    const enrollment = await prisma.enrollment.findUnique({
        where: {
            id
        },
        include: {
            batch: {
                include: {
                    course: {
                        include: {
                            modules: {
                                include: {
                                    assessments: {
                                        select: {
                                            id: true,
                                            title: true,
                                            passPercentage: true,
                                            submissions: {
                                                where: {
                                                    enrollmentId: id
                                                },
                                                select: {
                                                    id: true,
                                                    percentage: true,
                                                    status: true,
                                                    submittedAt: true
                                                },
                                                orderBy: {
                                                    submittedAt: "desc"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!enrollment) {
        throw new Error("Enrollment not found");
    }

    const assessments = enrollment.batch.course.modules.flatMap(
        (module) => module.assessments
    );

    const totalAssessments = assessments.length;
    let passedAssessments = 0;
    let failedAssessments = 0;

    const assessmentResults = assessments.map((assessment) => {
        if (!assessment.submissions || assessment.submissions.length === 0) {
            failedAssessments++;
            return {
                assessmentId: assessment.id,
                title: assessment.title,
                attempted: false,
                passed: false,
                percentage: null
            };
        }

        const passedSubmission = assessment.submissions.find(
            (submission) => ["COMPLETED", "GRADED", "PASSED"].includes(submission.status) &&
                submission.percentage != null &&
                Number.isFinite(Number(submission.percentage)) &&
                Number(submission.percentage) >= 0 && Number(submission.percentage) <= 100 &&
                Number(submission.percentage) >= Number(assessment.passPercentage ?? 60)
        );

        if (passedSubmission) {
            passedAssessments++;
            return {
                assessmentId: assessment.id,
                title: assessment.title,
                attempted: true,
                passed: true,
                percentage: Number(passedSubmission.percentage)
            };
        }

        failedAssessments++;
        const latestSubmission = assessment.submissions[0];

        return {
            assessmentId: assessment.id,
            title: assessment.title,
            attempted: true,
            passed: false,
            percentage: Number(latestSubmission.percentage || 0)
        };
    });

    const allPassed =
        totalAssessments > 0 && passedAssessments === totalAssessments;

    return {
        enrollmentId: id,
        totalAssessments,
        passedAssessments,
        failedAssessments,
        allPassed,
        assessments: assessmentResults
    };
};

const createCodingTestCaseExecution = async ({
    submissionId,
    questionId,
    testCaseId,
    judge0Token
}) => {
    if (!judge0Token || typeof judge0Token !== "string") {
        throw new Error("Judge0 token is required");
    }

    const submission = await prisma.assessmentSubmission.findUnique({
        where: {
            id: Number(submissionId)
        },
        select: {
            id: true
        }
    });

    if (!submission) {
        throw new Error("Assessment submission not found");
    }

    const question = await prisma.question.findUnique({
        where: {
            id: Number(questionId)
        },
        select: {
            id: true,
            questionType: true
        }
    });

    if (!question) {
        throw new Error("Question not found");
    }

    if (question.questionType !== "CODING") {
        throw new Error("Question is not a coding question");
    }

    const testCase = await prisma.codingTestCase.findUnique({
        where: {
            id: Number(testCaseId)
        },
        select: {
            id: true,
            questionId: true,
            expectedOutput: true,
            marks: true
        }
    });

    if (!testCase) {
        throw new Error("Coding test case not found");
    }

    if (testCase.questionId !== Number(questionId)) {
        throw new Error("Coding test case does not belong to the question");
    }

    return await prisma.codingTestCaseExecution.create({
        data: {
            submissionId: Number(submissionId),
            questionId: Number(questionId),
            testCaseId: Number(testCaseId),
            judge0Token: judge0Token.trim(),
            expectedOutput: testCase.expectedOutput,
            passed: false,
            marksObtained: 0
        },
        include: {
            testCase: true,
            question: true
        }
    });
};

const getCodingTestCaseExecutionByToken = async (judge0Token) => {
    if (!judge0Token || typeof judge0Token !== "string") {
        throw new Error("Judge0 token is required");
    }

    return await prisma.codingTestCaseExecution.findUnique({
        where: {
            judge0Token: judge0Token.trim()
        },
        include: {
            submission: true,
            question: true,
            testCase: true
        }
    });
};

const updateCodingTestCaseExecution = async (executionId, data) => {
    const execution = await prisma.codingTestCaseExecution.findUnique({
        where: {
            id: Number(executionId)
        },
        include: {
            testCase: true
        }
    });

    if (!execution) {
        throw new Error("Coding test case execution not found");
    }

    const actualOutput =
        data.actualOutput !== undefined && data.actualOutput !== null
            ? String(data.actualOutput)
            : "";

    const expectedOutput =
        execution.expectedOutput !== undefined &&
        execution.expectedOutput !== null
            ? String(execution.expectedOutput)
            : String(execution.testCase.expectedOutput);

    const normalizeOutput = (value) => {
        return String(value)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n")
            .map((line) => line.trimEnd())
            .join("\n")
            .trim();
    };

    const normalizedActual = normalizeOutput(actualOutput);
    const normalizedExpected = normalizeOutput(expectedOutput);

    const passed =
        data.judge0Status === "Accepted" &&
        normalizedActual === normalizedExpected;

    const marksObtained = passed ? Number(execution.testCase.marks) : 0;

    return await prisma.codingTestCaseExecution.update({
        where: {
            id: Number(executionId)
        },
        data: {
            judge0Status: data.judge0Status || null,
            actualOutput,
            expectedOutput,
            executionTime:
                data.executionTime !== undefined && data.executionTime !== null
                    ? String(data.executionTime)
                    : null,
            memory:
                data.memory !== undefined && data.memory !== null
                    ? Number(data.memory)
                    : null,
            passed,
            marksObtained
        }
    });
};

const getCodingTestCasesByQuestion = async (questionId) => {
    return await prisma.codingTestCase.findMany({
        where: {
            questionId: Number(questionId)
        },
        orderBy: {
            id: "asc"
        }
    });
};

const prepareCodingSubmission = async ({ submissionId, questionId, code, language }) => {
    return prisma.$transaction(async (tx) => {
        const submission = await tx.assessmentSubmission.findUnique({ where: { id: submissionId } });
        if (!submission) throw Object.assign(new Error("Assessment submission not found"), { status: 404 });
        if (submission.status !== "IN_PROGRESS") throw Object.assign(new Error("Assessment attempt is not active"), { status: 409 });
        const question = await tx.question.findUnique({ where: { id: questionId } });
        if (!question || question.assessmentId !== submission.assessmentId || question.questionType !== "CODING") {
            throw Object.assign(new Error("Coding question does not belong to this attempt"), { status: 403 });
        }
        return tx.submissionAnswer.upsert({
            where: { submissionId_questionId: { submissionId, questionId } },
            create: { submissionId, questionId, code, language, marksObtained: 0, isCorrect: null },
            update: { code, language, marksObtained: 0, isCorrect: null },
        });
    });
};

const recalculateCodingQuestionScore = async (submissionId, questionId) => {
    const parsedSubmissionId = Number(submissionId);
    const parsedQuestionId = Number(questionId);
    return prisma.$transaction(async (tx) => {
        const submission = await tx.assessmentSubmission.findUnique({
            where: { id: parsedSubmissionId },
            include: { assessment: { include: { questions: true } } },
        });
        if (!submission) throw Object.assign(new Error("Assessment submission not found"), { status: 404 });
        const question = submission.assessment.questions.find(q => q.id === parsedQuestionId && q.questionType === "CODING");
        if (!question) throw Object.assign(new Error("Coding question does not belong to this attempt"), { status: 403 });
        const testCases = await tx.codingTestCase.findMany({ where: { questionId: parsedQuestionId } });
        if (!testCases.length) throw new Error("No coding test cases found for this question");
        const records = await tx.codingTestCaseExecution.findMany({
            where: { submissionId: parsedSubmissionId, questionId: parsedQuestionId },
            orderBy: { id: "desc" },
        });
        const latest = new Map();
        for (const execution of records) if (!latest.has(execution.testCaseId)) latest.set(execution.testCaseId, execution);
        const questionCompleted = testCases.every(tc => latest.get(tc.id)?.judge0Status != null);
        const allPassed = questionCompleted && testCases.every(tc => latest.get(tc.id).passed === true);
        const marksObtained = Math.min(Number(question.marks), testCases.reduce((sum, tc) => {
            const execution = latest.get(tc.id);
            return sum + (execution?.passed === true ? Number(tc.marks || 0) : 0);
        }, 0));
        // updateMany must affect the answer created for this actual attempt.
        const saved = await tx.submissionAnswer.updateMany({
            where: { submissionId: parsedSubmissionId, questionId: parsedQuestionId },
            data: { isCorrect: questionCompleted ? allPassed : null, marksObtained },
        });
        if (saved.count !== 1) throw new Error("Coding answer not found for this attempt");
        const answers = await tx.submissionAnswer.findMany({ where: { submissionId: parsedSubmissionId } });
        const allCompleted = submission.assessment.questions.length > 0 && submission.assessment.questions.every(q =>
            answers.some(a => a.questionId === q.id && a.isCorrect !== null && a.isCorrect !== undefined));
        const score = submission.assessment.questions.reduce((total, q) => {
            const answer = answers.find(a => a.questionId === q.id);
            return total + Math.min(Number(q.marks), Math.max(0, Number(answer?.marksObtained || 0)));
        }, 0);
        const percentage = submission.totalMarks > 0 ? Number(((score / submission.totalMarks) * 100).toFixed(2)) : 0;
        const updated = await tx.assessmentSubmission.update({
            where: { id: parsedSubmissionId },
            data: { score, percentage, status: allCompleted ? "COMPLETED" : "IN_PROGRESS",
                ...(allCompleted ? { submittedAt: new Date() } : {}) },
        });
        return { submissionId: updated.id, questionId: parsedQuestionId, marksObtained,
            score: updated.score, totalMarks: updated.totalMarks, percentage: updated.percentage,
            status: updated.status, allCompleted, allPassed };
    });
};

const getAssessmentSubmissionResult = async (submissionId) => {

    const submission =
        await prisma.assessmentSubmission.findUnique({
            where: {
                id: Number(submissionId)
            },

            select: {
                id: true,
                assessmentId: true,
                enrollmentId: true,

                judge0Token: true,
                judge0Status: true,

                stdout: true,
                stderr: true,
                compileOutput: true,

                executionTime: true,
                memory: true,

                score: true,
                totalMarks: true,
                percentage: true,

                status: true,

                submittedAt: true,
                createdAt: true,
                updatedAt: true
            }
        });

    if (!submission) {
        throw new Error("Assessment submission not found");
    }

    return submission;
};

const createCodingQuestion = async (data) => {
    if (!data || typeof data !== "object") {
        throw new Error("Coding question data is required");
    }

    const assessmentId = Number(data.assessmentId);

    if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
        throw new Error("Assessment ID must be a positive integer");
    }

    if (typeof data.questionText !== "string" || !data.questionText.trim()) {
        throw new Error("Question text is required");
    }

    const assessment = await prisma.assessment.findUnique({
        where: {
            id: assessmentId
        }
    });

    if (!assessment) {
        throw new Error("Assessment not found");
    }

    if (!Array.isArray(data.testCases) || data.testCases.length === 0) {
        throw new Error("At least one coding test case is required");
    }

    const testCases = data.testCases.map((testCase, index) => {
        if (!testCase || typeof testCase !== "object") {
            throw new Error(`Invalid test case at position ${index + 1}`);
        }

        if (
            testCase.expectedOutput === undefined ||
            testCase.expectedOutput === null
        ) {
            throw new Error(`Expected output is required for test case ${index + 1}`);
        }

        const marks =
            testCase.marks !== undefined ? Number(testCase.marks) : 1;

        if (!Number.isFinite(marks) || marks <= 0) {
            throw new Error(`Marks for test case ${index + 1} must be greater than 0`);
        }

        return {
            input:
                testCase.input !== undefined && testCase.input !== null
                    ? String(testCase.input)
                    : null,
            expectedOutput: String(testCase.expectedOutput).trim(),
            marks,
            isHidden: testCase.isHidden === true
        };
    });

    return await prisma.question.create({
        data: {
            title: data.title || null,
            questionText: data.questionText.trim(),
            questionType: "CODING",
            difficulty: data.difficulty || null,
            marks: data.marks !== undefined ? Number(data.marks) : 1,
            order: data.order !== undefined ? Number(data.order) : 0,
            problemStatement: data.problemStatement || null,
            inputFormat: data.inputFormat || null,
            outputFormat: data.outputFormat || null,
            constraints: data.constraints || null,
            explanation: data.explanation || null,
            examples: data.examples !== undefined ? data.examples : null,
            supportedLanguages:
                data.supportedLanguages !== undefined
                    ? data.supportedLanguages
                    : null,
            starterCode: data.starterCode !== undefined ? data.starterCode : null,
            assessmentId,
            codingTestCases: {
                create: testCases
            }
        },
        include: {
            codingTestCases: {
                orderBy: {
                    id: "asc"
                }
            }
        }
    });
};

const getCodingQuestions = async (assessmentId) => {
    const id = Number(assessmentId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Assessment ID must be a positive integer");
    }

    return await prisma.question.findMany({
        where: {
            assessmentId: id,
            questionType: "CODING"
        },
        include: {
            codingTestCases: {
                orderBy: {
                    id: "asc"
                }
            }
        },
        orderBy: {
            order: "asc"
        }
    });
};

const getCodingQuestionById = async (questionId) => {
    const id = Number(questionId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID must be a positive integer");
    }

    const question = await prisma.question.findFirst({
        where: {
            id,
            questionType: "CODING"
        },
        include: {
            codingTestCases: {
                orderBy: {
                    id: "asc"
                }
            },
            assessment: {
                select: {
                    id: true,
                    title: true,
                    moduleId: true
                }
            }
        }
    });

    if (!question) {
        throw new Error("Coding question not found");
    }

    return question;
};

const updateCodingQuestion = async (questionId, data) => {
    const id = Number(questionId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID must be a positive integer");
    }

    const existing = await prisma.question.findFirst({
        where: {
            id,
            questionType: "CODING"
        }
    });

    if (!existing) {
        throw new Error("Coding question not found");
    }

    const updateData = {};

    if (data.title !== undefined) {
        updateData.title = data.title || null;
    }

    if (data.questionText !== undefined) {
        if (
            typeof data.questionText !== "string" ||
            !data.questionText.trim()
        ) {
            throw new Error("Question text is required");
        }
        updateData.questionText = data.questionText.trim();
    }

    if (data.difficulty !== undefined) {
        updateData.difficulty = data.difficulty || null;
    }

    if (data.marks !== undefined) {
        const marks = Number(data.marks);
        if (!Number.isFinite(marks) || marks <= 0) {
            throw new Error("Question marks must be greater than 0");
        }
        updateData.marks = marks;
    }

    if (data.order !== undefined) {
        updateData.order = Number(data.order);
    }

    if (data.problemStatement !== undefined) {
        updateData.problemStatement = data.problemStatement || null;
    }

    if (data.inputFormat !== undefined) {
        updateData.inputFormat = data.inputFormat || null;
    }

    if (data.outputFormat !== undefined) {
        updateData.outputFormat = data.outputFormat || null;
    }

    if (data.constraints !== undefined) {
        updateData.constraints = data.constraints || null;
    }

    if (data.explanation !== undefined) {
        updateData.explanation = data.explanation || null;
    }

    if (data.examples !== undefined) {
        updateData.examples = data.examples;
    }

    if (data.supportedLanguages !== undefined) {
        updateData.supportedLanguages = data.supportedLanguages;
    }

    if (data.starterCode !== undefined) {
        updateData.starterCode = data.starterCode;
    }

    return await prisma.question.update({
        where: {
            id
        },
        data: updateData,
        include: {
            codingTestCases: {
                orderBy: {
                    id: "asc"
                }
            }
        }
    });
};

const deleteCodingQuestion = async (questionId) => {
    const id = Number(questionId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID must be a positive integer");
    }

    const existing = await prisma.question.findFirst({
        where: {
            id,
            questionType: "CODING"
        }
    });

    if (!existing) {
        throw new Error("Coding question not found");
    }

    return await prisma.question.delete({
        where: {
            id
        }
    });
};

const createCodingTestCase = async (questionId, data) => {
    const id = Number(questionId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID must be a positive integer");
    }

    const question = await prisma.question.findFirst({
        where: {
            id,
            questionType: "CODING"
        }
    });

    if (!question) {
        throw new Error("Coding question not found");
    }

    if (
        data.expectedOutput === undefined ||
        data.expectedOutput === null
    ) {
        throw new Error("Expected output is required");
    }

    const marks = data.marks !== undefined ? Number(data.marks) : 1;

    if (!Number.isFinite(marks) || marks <= 0) {
        throw new Error("Test case marks must be greater than 0");
    }

    return await prisma.codingTestCase.create({
        data: {
            questionId: id,
            input:
                data.input !== undefined && data.input !== null
                    ? String(data.input)
                    : null,
            expectedOutput: String(data.expectedOutput).trim(),
            marks,
            isHidden: data.isHidden === true
        }
    });
};

const getCodingTestCases = async (questionId) => {
    const id = Number(questionId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Question ID must be a positive integer");
    }

    const question = await prisma.question.findFirst({
        where: {
            id,
            questionType: "CODING"
        }
    });

    if (!question) {
        throw new Error("Coding question not found");
    }

    return await prisma.codingTestCase.findMany({
        where: {
            questionId: id
        },
        orderBy: {
            id: "asc"
        }
    });
};

const updateCodingTestCase = async (testCaseId, data) => {
    const id = Number(testCaseId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Test case ID must be a positive integer");
    }

    const existing = await prisma.codingTestCase.findUnique({
        where: {
            id
        },
        include: {
            question: {
                select: {
                    questionType: true
                }
            }
        }
    });

    if (!existing || existing.question.questionType !== "CODING") {
        throw new Error("Coding test case not found");
    }

    const updateData = {};

    if (data.input !== undefined) {
        updateData.input = data.input !== null ? String(data.input) : null;
    }

    if (data.expectedOutput !== undefined) {
        if (
            data.expectedOutput === null ||
            String(data.expectedOutput).trim() === ""
        ) {
            throw new Error("Expected output is required");
        }
        updateData.expectedOutput = String(data.expectedOutput).trim();
    }

    if (data.marks !== undefined) {
        const marks = Number(data.marks);
        if (!Number.isFinite(marks) || marks <= 0) {
            throw new Error("Test case marks must be greater than 0");
        }
        updateData.marks = marks;
    }

    if (data.isHidden !== undefined) {
        updateData.isHidden = data.isHidden === true;
    }

    return await prisma.codingTestCase.update({
        where: {
            id
        },
        data: updateData
    });
};

const deleteCodingTestCase = async (testCaseId) => {
    const id = Number(testCaseId);

    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Test case ID must be a positive integer");
    }

    const existing = await prisma.codingTestCase.findUnique({
        where: {
            id
        },
        include: {
            question: {
                select: {
                    questionType: true
                }
            }
        }
    });

    if (!existing || existing.question.questionType !== "CODING") {
        throw new Error("Coding test case not found");
    }

    return await prisma.codingTestCase.delete({
        where: {
            id
        }
    });
};

module.exports = { createAssessment, getAllAssessments, getAssessmentById, updateAssessment, deleteAssessment, startAssessment, submitAssessment, getAssessmentAnalytics, getSubmissionsByAssessmentId, saveJudge0Token, getSubmissionByJudge0Token, updateAssessmentSubmissionStatus, getEnrollmentAssessmentStatus, createCodingTestCaseExecution, getCodingTestCaseExecutionByToken, updateCodingTestCaseExecution, getCodingTestCasesByQuestion, recalculateCodingQuestionScore, prepareCodingSubmission, getAssessmentSubmissionResult, createCodingQuestion, getCodingQuestions, getCodingQuestionById, updateCodingQuestion, deleteCodingQuestion, createCodingTestCase, getCodingTestCases, updateCodingTestCase, deleteCodingTestCase };
