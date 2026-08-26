const fs = require("fs");
const path = require("path");

const service =
    require("../services/certificateService");

const assessmentService =
    require("../services/assessmentService");

const lessonProgressRepository =
    require("../repositories/lessonProgressRepository");


/*
 * ---------------------------------------------
 * Check Certificate Eligibility
 *
 * Requirements:
 * 1. Course completion >= 80%
 * 2. Required assessments passed
 *
 * Certificate generation itself is handled
 * automatically by the Automation Engine.
 * ---------------------------------------------
 */
const getCertificateEligibility = async (
    req,
    res
) => {

    try {

        const enrollmentId =
            Number(req.params.enrollmentId);


        if (
            !Number.isInteger(enrollmentId) ||
            enrollmentId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Enrollment ID must be a positive integer"
            });
        }


        /*
         * Get lesson progress
         */
        const summary =
            await lessonProgressRepository
                .getProgressSummary(
                    enrollmentId
                );


        const {
            totalLessons,
            completedLessons,
            completionPercentage
        } = summary;


        /*
         * Course requirement
         */
        const courseCompleted =
            completionPercentage >= 80;


        /*
         * Assessment requirement
         */
        const assessmentStatus =
            await assessmentService
                .getEnrollmentAssessmentStatus(
                    enrollmentId
                );


        const assessmentsCompleted =
            assessmentStatus.allPassed;


        /*
         * Final eligibility
         */
        const eligible =
            courseCompleted &&
            assessmentsCompleted;


        return res.status(200).json({

            success: true,

            data: {

                enrollmentId,

                courseProgress: {

                    totalLessons,

                    completedLessons,

                    completionPercentage,

                    requiredPercentage: 80,

                    requirementMet:
                        courseCompleted
                },

                assessments: {

                    total:
                        assessmentStatus.totalAssessments,

                    passed:
                        assessmentStatus.passedAssessments,

                    failed:
                        assessmentStatus.failedAssessments,

                    requiredPercentage: 40,

                    requirementMet:
                        assessmentsCompleted
                },

                eligible,

                status:
                    eligible
                        ? "ELIGIBLE"
                        : "NOT_ELIGIBLE"
            }
        });

    } catch (error) {

        console.error(
            "Certificate eligibility error:",
            error
        );


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

            message:
                "Failed to check certificate eligibility"
        });
    }
};


/*
 * ---------------------------------------------
 * Get Certificate By Enrollment
 * ---------------------------------------------
 *
 * Returns the certificate generated
 * automatically for the enrollment.
 */
const getCertificateByEnrollment = async (
    req,
    res
) => {

    try {

        const enrollmentId =
            Number(req.params.enrollmentId);


        if (
            !Number.isInteger(enrollmentId) ||
            enrollmentId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Enrollment ID must be a positive integer"
            });
        }


        const certificate =
            await service.getCertificateByEnrollment(
                enrollmentId
            );


        if (!certificate) {

            return res.status(404).json({

                success: false,

                message:
                    "Certificate not found"
            });
        }


        return res.status(200).json({

            success: true,

            data: certificate
        });

    } catch (error) {

        console.error(
            "Get certificate error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to retrieve certificate"
        });
    }
};


/*
 * ---------------------------------------------
 * Download Certificate PDF
 * ---------------------------------------------
 */
const downloadCertificate = async (
    req,
    res
) => {

    try {

        const certificateNo =
            req.params.certificateNo;


        if (
            !certificateNo ||
            typeof certificateNo !== "string" ||
            !certificateNo.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Certificate number is required"
            });
        }


        const certificate =
            await service.getCertificateByNumber(
                certificateNo.trim()
            );


        if (!certificate) {

            return res.status(404).json({

                success: false,

                message:
                    "Certificate not found"
            });
        }


        if (!certificate.pdfUrl) {

            return res.status(404).json({

                success: false,

                message:
                    "Certificate PDF is not available"
            });
        }


        /*
         * Resolve stored PDF path
         */
        const pdfPath =
            path.resolve(
                certificate.pdfUrl
            );


        /*
         * Make sure PDF exists
         */
        if (!fs.existsSync(pdfPath)) {

            console.error(
                "Certificate PDF missing:",
                pdfPath
            );

            return res.status(404).json({

                success: false,

                message:
                    "Certificate PDF file does not exist"
            });
        }


        /*
         * Make sure path points to a file
         */
        const stats =
            fs.statSync(pdfPath);


        if (!stats.isFile()) {

            return res.status(404).json({

                success: false,

                message:
                    "Certificate PDF is invalid"
            });
        }


        return res.download(
            pdfPath,
            `${certificate.certificateNo}.pdf`,
            (error) => {

                if (error) {

                    console.error(
                        "Certificate download error:",
                        error
                    );
                }
            }
        );

    } catch (error) {

        console.error(
            "Download certificate error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to download certificate"
        });
    }
};


/*
 * ---------------------------------------------
 * Verify Certificate
 *
 * Public verification endpoint.
 * ---------------------------------------------
 */
const verifyCertificate = async (
    req,
    res
) => {

    try {

        const certificateNo =
            req.params.certificateNo;


        if (
            !certificateNo ||
            typeof certificateNo !== "string" ||
            !certificateNo.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Certificate number is required"
            });
        }


        const result =
            await service.verifyCertificate(
                certificateNo.trim()
            );


        if (!result.valid) {

            return res.status(404).json({

                success: false,

                message:
                    result.message
            });
        }


        return res.status(200).json({

            success: true,

            data: {

                valid: true,

                certificate:
                    result.certificate
            }
        });

    } catch (error) {

        console.error(
            "Verify certificate error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to verify certificate"
        });
    }
};


module.exports = {

    getCertificateEligibility,

    getCertificateByEnrollment,

    downloadCertificate,

    verifyCertificate
};