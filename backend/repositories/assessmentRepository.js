const prisma = require("../config/database");


/*
 * Create assessment
 */
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
                    options: true
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
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                totalMarks:
                    data.totalMarks !== undefined
                        ? Number(data.totalMarks)
                        : undefined,
                duration:
                    data.duration !== undefined
                        ? (data.duration ? Number(data.duration) : null)
                        : undefined,
                status: data.status || undefined
            }
        });

        // If questions were sent, replace them entirely
        // (simplest consistent approach for a full-form edit)
        if (Array.isArray(data.questions)) {

            await tx.question.deleteMany({
                where: { assessmentId: id }
            });

            for (const question of data.questions) {
                await tx.question.create({
                    data: {
                        assessmentId: id,
                        questionText: question.questionText,
                        questionType: question.questionType || "MCQ",
                        marks: Number(question.marks),
                        order: question.order ? Number(question.order) : 0,
                        options: {
                            create: question.options.map((option) => ({
                                optionText: option.optionText,
                                isCorrect: option.isCorrect === true
                            }))
                        }
                    }
                });
            }
        }

        return await tx.assessment.findUnique({
            where: { id },
            include: {
                questions: {
                    include: { options: true },
                    orderBy: { order: "asc" }
                }
            }
        });
    });
};


const deleteAssessment = async (id) => {
    return await prisma.assessment.delete({
        where: { id }
    });
};


/*
 * Get assessment by ID
 */
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


/*
 * Submit assessment
 *
 * Calculates the score using the
 * correct options stored in the database.
 */
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


/*
 * Assessment Analytics
 */
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


/*
 * List all submissions for a given assessment,
 * joined with Enrollment for student name/email,
 * newest first. Used by the instructor's
 * "Student Submissions" page.
 */
const getSubmissionsByAssessmentId = async (assessmentId) => {
    return await prisma.assessmentSubmission.findMany({
        where: {
            assessmentId
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


/*
 * Save Judge0 token against
 * an assessment submission.
 */
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


/*
 * Find assessment submission
 * using Judge0 token.
 */
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


/*
 * Update assessment submission
 * with Judge0 result.
 */
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
    await prisma.codingAnswer.update({
        where: { id: codingAnswer.id },
        data: {
            status: judge0Status === "Accepted" ? "CORRECT" : "INCORRECT",
            executionTime:
                data.executionTime !== null && data.executionTime !== undefined
                    ? Number(data.executionTime)
                    : null,
            memory:
                data.memory !== null && data.memory !== undefined
                    ? Number(data.memory)
                    : null,
        },
    });
}
/*
* Check assessment completion for an enrollment.
*
* Certificate requirement:
* - Every assessment in the enrolled course must be attempted
* - Every assessment must have at least one submission
* - Passing percentage = 40%
*/
const getEnrollmentAssessmentStatus = async (
    enrollmentId
) => {

        const id =
            Number(enrollmentId);


        /*
         * Get course ID.
         */
        const enrollment =
            await prisma.enrollment.findUnique({

                where: {
                    id
                },

                select: {
                    id: true,

                    batch: {
                        select: {
                            courseId: true
                        }
                    }
                }
            });


        if (!enrollment) {
            throw new Error(
                "Enrollment not found"
            );
        }


        const courseId =
            enrollment.batch.courseId;


        /*
         * Get active assessments and only
         * the latest submission.
         */
        const assessments =
            await prisma.assessment.findMany({

                where: {
                    module: {
                        courseId
                    },

                    status: "ACTIVE"
                },

                select: {
                    id: true,
                    title: true,

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
                        },

                        take: 1
                    }
                },

                orderBy: {
                    id: "asc"
                }
            });


        const totalAssessments =
            assessments.length;


        let passedAssessments = 0;
        let failedAssessments = 0;


        const assessmentResults =
            assessments.map(
                (assessment) => {

                    const latestSubmission =
                        assessment.submissions?.[0];


                    /*
                     * No submission.
                     */
                    if (!latestSubmission) {

                        failedAssessments++;

                        return {

                            assessmentId:
                                assessment.id,

                            title:
                                assessment.title,

                            attempted:
                                false,

                            passed:
                                false,

                            percentage:
                                null
                        };
                    }


                    const percentage =
                        Number(
                            latestSubmission
                                .percentage || 0
                        );


                    /*
                     * Passing percentage = 40%.
                     */
                    const passed =
                        percentage >= 40;


                    if (passed) {
                        passedAssessments++;
                    } else {
                        failedAssessments++;
                    }


                    return {

                        assessmentId:
                            assessment.id,

                        title:
                            assessment.title,

                        attempted:
                            true,

                        passed,

                        percentage
                    };
                }
            );


        /*
         * No assessments should not block
         * certificate generation.
         */
        const allPassed =
            totalAssessments === 0 ||
            passedAssessments ===
                totalAssessments;


        return {

            enrollmentId: id,

            totalAssessments,

            passedAssessments,

            failedAssessments,

            allPassed,

            assessments:
                assessmentResults
        };
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


module.exports = {

    createAssessment,

    getAssessmentById,
    getAllAssessments,
    updateAssessment,
    deleteAssessment,
    submitAssessment,

    getAssessmentAnalytics,
    getSubmissionsByAssessmentId,
    saveJudge0Token,

    getSubmissionByJudge0Token,

    updateAssessmentSubmissionStatus,

    getEnrollmentAssessmentStatus,
    getAssessmentSubmissionResult
};
}