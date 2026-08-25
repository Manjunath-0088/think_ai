const service =
    require("../services/assessmentService");


/**
 * Create Assessment
 */
const createAssessment = async (req, res) => {

    try {

        const assessment =
            await service.createAssessment(
                req.body
            );


        return res.status(201).json({

            success: true,

            data: assessment

        });

    } catch (error) {

        console.error(
            "Create assessment error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });
    }
};

const getEnrollmentAssessmentStatus = async (req, res) => {

    try {

        const status =
            await service.getEnrollmentAssessmentStatus(
                req.params.enrollmentId
            );

        return res.status(200).json({
            success: true,
            data: status
        });

    } catch (error) {

        console.error("Enrollment assessment status error:", error);

        if (error.message === "Enrollment not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAllAssessments = async (req, res) => {

    try {

        const { moduleId } = req.query;

        const assessments =
            await service.getAllAssessments(moduleId);

        return res.status(200).json({
            success: true,
            data: assessments
        });

    } catch (error) {

        console.error("Get all assessments error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * Update Assessment
 */
const updateAssessment = async (req, res) => {

    try {

        const assessment =
            await service.updateAssessment(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: assessment
        });

    } catch (error) {

        console.error("Update assessment error:", error);

        if (error.message === "Assessment not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * Delete Assessment
 */
const deleteAssessment = async (req, res) => {

    try {

        await service.deleteAssessment(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Assessment deleted successfully"
        });

    } catch (error) {

        console.error("Delete assessment error:", error);

        if (error.message === "Assessment not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/**
 * Get Assessment By ID
 */
const getAssessmentById = async (req, res) => {

    try {

        const assessment =
            await service.getAssessmentById(
                req.params.id
            );


        if (!assessment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found"

            });
        }


        return res.status(200).json({

            success: true,

            data: assessment

        });

    } catch (error) {

        console.error(
            "Get assessment error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


/**
 * Submit Assessment
 */
const submitAssessment = async (req, res) => {

    try {

        const submission =
            await service.submitAssessment(
                req.params.id,
                req.body
            );


        return res.status(201).json({

            success: true,

            data: submission

        });

    } catch (error) {

        console.error(
            "Submit assessment error:",
            error
        );


        if (
            error.message ===
            "Assessment not found"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message

            });
        }


        if (
            error.message ===
            "Enrollment not found"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message

            });
        }


        return res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


/**
 * Get Assessment Analytics
 */
const getAssessmentAnalytics = async (
    req,
    res
) => {

    try {

        const analytics =
            await service.getAssessmentAnalytics(
                req.params.id
            );


        return res.status(200).json({

            success: true,

            data: analytics

        });

    } catch (error) {

        console.error(
            "Assessment analytics error:",
            error
        );


        if (
            error.message ===
            "Assessment not found"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message

            });
        }


        return res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


/**
 * Get Assessment Submissions
 *
 * Lists all submissions for a given assessment,
 * used by the instructor's "Student Submissions" page.
 */
const getAssessmentSubmissions = async (req, res) => {

    try {

        const submissions =
            await service.getSubmissionsByAssessmentId(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: submissions

        });

    } catch (error) {

        console.error(
            "Get assessment submissions error:",
            error
        );

        if (
            error.message ===
            "Assessment not found"
        ) {

            return res.status(404).json({

                success: false,

                message: error.message

            });
        }

        return res.status(500).json({

            success: false,

            message: error.message

        });
    }
};


module.exports = {

    createAssessment,
    getAllAssessments,
    updateAssessment,
    deleteAssessment,

    getAssessmentById,
    getEnrollmentAssessmentStatus,

    submitAssessment,

    getAssessmentAnalytics,
    getAssessmentSubmissions

};