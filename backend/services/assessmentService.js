const repository =
    require("../repositories/assessmentRepository");



const createAssessment = async (data) => {
    return await repository.createAssessment(data);
};


const getAllAssessments = async (moduleId) => {
    return await repository.getAllAssessments(moduleId);
};


const updateAssessment = async (id, data) => {

    const existing = await repository.getAssessmentById(Number(id));

    if (!existing) {
        throw new Error("Assessment not found");
    }

    return await repository.updateAssessment(Number(id), data);
};


const deleteAssessment = async (id) => {

    const existing = await repository.getAssessmentById(Number(id));

    if (!existing) {
        throw new Error("Assessment not found");
    }

    return await repository.deleteAssessment(Number(id));
};

const getAssessmentById = async (id) => {
    return await repository.getAssessmentById(
        Number(id)
    );
};



const submitAssessment = async (
    assessmentId,
    data
) => {

    return await repository.submitAssessment(
        Number(assessmentId),
        data
    );
};



const getAssessmentAnalytics = async (id) => {

    return await repository.getAssessmentAnalytics(
        Number(id)
    );
};


/*
 * List all submissions for a given assessment.
 * Throws if the assessment doesn't exist, same
 * pattern as updateAssessment/deleteAssessment.
 */
const getSubmissionsByAssessmentId = async (assessmentId) => {

    const existing = await repository.getAssessmentById(Number(assessmentId));

    if (!existing) {
        throw new Error("Assessment not found");
    }

    return await repository.getSubmissionsByAssessmentId(Number(assessmentId));
};



/*
 * Save Judge0 token against an
 * assessment submission.
 */
const saveJudge0Token = async (
    submissionId,
    judge0Token
) => {

    return await repository.saveJudge0Token(
        Number(submissionId),
        judge0Token
    );
};



/*
 * Find assessment submission
 * using Judge0 token.
 */
const getSubmissionByJudge0Token = async (
    judge0Token
) => {

    return await repository.getSubmissionByJudge0Token(
        judge0Token
    );
};



/*
 * Update assessment submission
 * with Judge0 execution result.
 */
const updateAssessmentSubmissionStatus =
    async (
        submissionId,
        data
    ) => {

        return await repository
            .updateAssessmentSubmissionStatus(
                Number(submissionId),
                data
            );
    };



/*
 * Check whether all assessments
 * for the enrolled course are passed.
 *
 * Passing percentage = 40%
 */
const getEnrollmentAssessmentStatus =
    async (enrollmentId) => {

        return await repository
            .getEnrollmentAssessmentStatus(
                Number(enrollmentId)
            );
    };



module.exports = {
    createAssessment,
    getAssessmentById,
    getAllAssessments,
    submitAssessment,
    updateAssessment,
    deleteAssessment,
    getAssessmentAnalytics,
    getSubmissionsByAssessmentId,
    saveJudge0Token,
    getSubmissionByJudge0Token,
    updateAssessmentSubmissionStatus,
    getEnrollmentAssessmentStatus
};