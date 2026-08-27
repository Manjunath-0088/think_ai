const prisma = require("../config/database");


const createAssessment = async (data) => {
    return await prisma.assessment.create({
        data: {
            title: data.title,
            description: data.description,
            totalMarks: Number(data.totalMarks),
            duration: data.duration
                ? Number(data.duration)
                : null,
            status: data.status || "ACTIVE",
            moduleId: Number(data.moduleId),

            questions: {
                create: data.questions.map((question) => ({
                    questionText: question.questionText,
                    questionType:
                        question.questionType || "MCQ",
                    marks: Number(question.marks),
                    order: question.order
                        ? Number(question.order)
                        : 0,

                    options: {
                        create: question.options.map((option) => ({
                            optionText: option.optionText,
                            isCorrect:
                                option.isCorrect === true
                        }))
                    }
                }))
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


const getAssessmentById = async (id) => {
    return await prisma.assessment.findUnique({
        where: {
            id
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

    const assessment =
        await prisma.assessment.findUnique({
            where: {
                id: assessmentId
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


    if (!assessment) {
        throw new Error(
            "Assessment not found"
        );
    }


    const enrollment =
        await prisma.enrollment.findUnique({
            where: {
                id: Number(data.enrollmentId)
            }
        });


    if (!enrollment) {
        throw new Error(
            "Enrollment not found"
        );
    }


    let score = 0;


    const answers =
        data.answers.map((answer) => {

            const question =
                assessment.questions.find(
                    (item) =>
                        item.id ===
                        Number(answer.questionId)
                );


            if (!question) {
                throw new Error(
                    `Question ${answer.questionId} not found in this assessment`
                );
            }


            const selectedOption =
                question.options.find(
                    (option) =>
                        option.id ===
                        Number(answer.selectedOptionId)
                );


            if (!selectedOption) {
                throw new Error(
                    `Invalid option for question ${question.id}`
                );
            }


            const isCorrect =
                selectedOption.isCorrect === true;


            const marksObtained =
                isCorrect
                    ? question.marks
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
        });


    const percentage =
        assessment.totalMarks > 0
            ? (score / assessment.totalMarks) * 100
            : 0;


    const submission =
        await prisma.assessmentSubmission.create({
            data: {
                assessmentId,

                enrollmentId:
                    Number(data.enrollmentId),

                score,

                totalMarks:
                    assessment.totalMarks,

                percentage,

                status: "SUBMITTED",

                answers: {
                    create: answers
                }
            },

            include: {
                answers: true
            }
        });


    return submission;
};


/*
 * Assessment Analytics
 */
const getAssessmentAnalytics =
    async (assessmentId) => {

        const assessment =
            await prisma.assessment.findUnique({
                where: {
                    id: assessmentId
                },

                include: {
                    submissions: {
                        select: {
                            score: true,
                            totalMarks: true,
                            percentage: true,
                            status: true
                        }
                    }
                }
            });


        if (!assessment) {
            throw new Error(
                "Assessment not found"
            );
        }


        const submissions =
            assessment.submissions;


        const totalSubmissions =
            submissions.length;


        if (totalSubmissions === 0) {

            return {
                assessmentId:
                    assessment.id,

                title:
                    assessment.title,

                totalSubmissions: 0,

                averageScore: 0,

                averagePercentage: 0,

                highestScore: 0,

                lowestScore: 0,

                passed: 0,

                failed: 0
            };
        }


        const scores =
            submissions.map(
                (submission) =>
                    Number(
                        submission.score || 0
                    )
            );


        const percentages =
            submissions.map(
                (submission) =>
                    Number(
                        submission.percentage || 0
                    )
            );


        const totalScore =
            scores.reduce(
                (sum, score) =>
                    sum + score,
                0
            );


        const totalPercentage =
            percentages.reduce(
                (sum, percentage) =>
                    sum + percentage,
                0
            );


        const averageScore =
            totalScore /
            totalSubmissions;


        const averagePercentage =
            totalPercentage /
            totalSubmissions;


        const highestScore =
            Math.max(...scores);


        const lowestScore =
            Math.min(...scores);


        const passed =
            percentages.filter(
                (percentage) =>
                    percentage >= 40
            ).length;


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
                    averageScore.toFixed(2)
                ),

            averagePercentage:
                Number(
                    averagePercentage.toFixed(2)
                ),

            highestScore,

            lowestScore,

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


    return await prisma.assessmentSubmission.update({
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


        return await prisma.assessmentSubmission.findUnique({
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
 * with complete Judge0 result.
 */
const updateAssessmentSubmissionStatus =
    async (
        submissionId,
        data
    ) => {

        if (!data) {
            throw new Error(
                "Judge0 result data is required"
            );
        }


        return await prisma.assessmentSubmission.update({
            where: {
                id: Number(submissionId)
            },

            data: {
                status:
                    data.status || "FAILED",

                judge0Status:
                    data.judge0Status || null,

                stdout:
                    data.stdout || null,

                stderr:
                    data.stderr || null,

                compileOutput:
                    data.compileOutput || null,

                executionTime:
                    data.executionTime !== null &&
                        data.executionTime !== undefined
                        ? Number(data.executionTime)
                        : null,

                memory:
                    data.memory !== null &&
                        data.memory !== undefined
                        ? Number(data.memory)
                        : null
            }
        });
    };

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

    enrollmentId = Number(enrollmentId);

    const enrollment =
        await prisma.enrollment.findUnique({
            where: {
                id: enrollmentId
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
                                                submissions: {
                                                    where: {
                                                        enrollmentId
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


    /*
     * Get all assessments belonging
     * to the enrolled course.
     */
    const assessments =
        enrollment.batch.course.modules.flatMap(
            (module) => module.assessments
        );


    const totalAssessments =
        assessments.length;


    let passedAssessments = 0;
    let failedAssessments = 0;


    const assessmentResults =
        assessments.map((assessment) => {

            /*
             * No submission means assessment
             * has not been completed.
             */
            if (
                !assessment.submissions ||
                assessment.submissions.length === 0
            ) {

                failedAssessments++;

                return {
                    assessmentId: assessment.id,
                    title: assessment.title,
                    attempted: false,
                    passed: false,
                    percentage: null
                };
            }


            /*
             * Check whether the student has
             * passed this assessment.
             *
             * Any submission >= 40% is considered
             * a passed assessment(Change the cndition according to the requirements).
             */
            const passedSubmission =
                assessment.submissions.find(
                    (submission) =>
                        Number(
                            submission.percentage || 0
                        ) >= 40
                );


            if (passedSubmission) {

                passedAssessments++;

                return {
                    assessmentId: assessment.id,
                    title: assessment.title,
                    attempted: true,
                    passed: true,
                    percentage:
                        Number(
                            passedSubmission.percentage
                        )
                };
            }


            /*
             * Assessment attempted but not passed.
             */
            failedAssessments++;

            const latestSubmission =
                assessment.submissions[0];


            return {
                assessmentId: assessment.id,
                title: assessment.title,
                attempted: true,
                passed: false,
                percentage:
                    Number(
                        latestSubmission.percentage || 0
                    )
            };
        });


    /*
     * If there are no assessments,
     * don't block certificate generation.
     */
    const allPassed =
        totalAssessments === 0 ||
        passedAssessments === totalAssessments;


    return {

        enrollmentId,

        totalAssessments,

        passedAssessments,

        failedAssessments,

        allPassed,

        assessments:
            assessmentResults
    };
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
    getEnrollmentAssessmentStatus
};