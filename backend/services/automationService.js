const lessonProgressRepository =
    require("../repositories/lessonProgressRepository");

const assessmentService =
    require("./assessmentService");

const certificateService =
    require("./certificateService");


const validateEnrollmentId = (value) => {

    const enrollmentId = Number(value);

    if (
        !Number.isInteger(enrollmentId) ||
        enrollmentId <= 0
    ) {
        throw new Error(
            "Enrollment ID must be a positive integer"
        );
    }

    return enrollmentId;
};


const processLessonCompletion = async (enrollmentId) => {

    const id = validateEnrollmentId(enrollmentId);


    /*
     * 1. Get current course progress
     */
    const summary =
        await lessonProgressRepository.getProgressSummary(id);


    const {
        totalLessons,
        completedLessons,
        completionPercentage
    } = summary;


    /*
     * 2. Course completion requirement
     */
    if (completionPercentage < 80) {

        return {
            triggered: false,
            action: "COURSE_IN_PROGRESS",

            enrollmentId: id,

            totalLessons,
            completedLessons,
            completionPercentage
        };
    }


    /*
     * 3. Check assessment requirements
     */
    const assessmentStatus =
        await assessmentService.getEnrollmentAssessmentStatus(
            id
        );


    /*
     * 4. Assessment requirement not satisfied
     */
    if (!assessmentStatus.allPassed) {

        return {
            triggered: false,
            action: "ASSESSMENTS_PENDING",

            enrollmentId: id,

            totalLessons,
            completedLessons,
            completionPercentage,

            assessments: {
                total:
                    assessmentStatus.totalAssessments,

                passed:
                    assessmentStatus.passedAssessments,

                failed:
                    assessmentStatus.failedAssessments,

                details:
                    assessmentStatus.assessments
            }
        };
    }


    /*
     * 5. All requirements satisfied.
     *
     * Certificate service must handle
     * duplicate certificate prevention.
     */
    const certificate =
        await certificateService.generateCertificate(id);


    /*
     * 6. Certificate generated
     */
    return {
        triggered: true,

        action: "CERTIFICATE_GENERATED",

        enrollmentId: id,

        totalLessons,
        completedLessons,
        completionPercentage,

        assessments: {
            total:
                assessmentStatus.totalAssessments,

            passed:
                assessmentStatus.passedAssessments,

            failed:
                assessmentStatus.failedAssessments,

            details:
                assessmentStatus.assessments
        },

        certificate: {
            id: certificate.id,

            certificateNo:
                certificate.certificateNo,

            pdfUrl:
                certificate.pdfUrl,

            verificationUrl:
                certificate.verificationUrl
        }
    };
};


module.exports = {
    processLessonCompletion
};