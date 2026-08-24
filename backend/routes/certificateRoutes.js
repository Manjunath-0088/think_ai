const express = require("express");

const router = express.Router();

const {
    getCertificateEligibility,
    getCertificateByEnrollment,
    downloadCertificate,
    verifyCertificate
} = require("../controllers/certificateController");


// Certificate validations
const {
    validateCertificateEnrollmentId,
    validateCertificateNumber
} = require("../validations/certificateValidation");


// ----------------------------------------------------
// Swagger
// ----------------------------------------------------

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Automatic Certificate Management APIs
 */


/**
 * @swagger
 * /api/certificates/eligibility/{enrollmentId}:
 *   get:
 *     summary: Check certificate eligibility
 *     description: >
 *       Checks whether a student is eligible for a certificate.
 *       Eligibility requires at least 80% course completion and
 *       passing all required assessments.
 *       Certificate generation is handled automatically by the
 *       Automation Engine when eligibility is satisfied.
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Certificate eligibility checked successfully
 *       400:
 *         description: Invalid enrollment ID
 *       404:
 *         description: Enrollment not found
 *       500:
 *         description: Failed to check certificate eligibility
 */
router.get(
    "/eligibility/:enrollmentId",
    validateCertificateEnrollmentId,
    getCertificateEligibility
);


/**
 * @swagger
 * /api/certificates/enrollment/{enrollmentId}:
 *   get:
 *     summary: Get certificate by enrollment
 *     description: >
 *       Returns the automatically generated certificate for an enrollment.
 *       Returns 404 when the student has not yet received a certificate.
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Certificate found
 *       400:
 *         description: Invalid enrollment ID
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Failed to retrieve certificate
 */
router.get(
    "/enrollment/:enrollmentId",
    validateCertificateEnrollmentId,
    getCertificateByEnrollment
);


/**
 * @swagger
 * /api/certificates/{certificateNo}/download:
 *   get:
 *     summary: Download certificate PDF
 *     description: Downloads the automatically generated certificate PDF.
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateNo
 *         required: true
 *         schema:
 *           type: string
 *         example: CERT-2026-1786693739833-4980
 *     responses:
 *       200:
 *         description: Certificate PDF downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Certificate number is required
 *       404:
 *         description: Certificate or PDF not found
 *       500:
 *         description: Failed to download certificate
 */
router.get(
    "/:certificateNo/download",
    validateCertificateNumber,
    downloadCertificate
);


/**
 * @swagger
 * /api/certificates/verify/{certificateNo}:
 *   get:
 *     summary: Verify certificate
 *     description: >
 *       Public certificate verification endpoint.
 *       No authentication is required.
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateNo
 *         required: true
 *         schema:
 *           type: string
 *         example: CERT-2026-123456-1234
 *     responses:
 *       200:
 *         description: Valid certificate
 *       400:
 *         description: Certificate number is required
 *       404:
 *         description: Certificate not found
 *       500:
 *         description: Certificate verification failed
 */
router.get(
    "/verify/:certificateNo",
    validateCertificateNumber,
    verifyCertificate
);


module.exports = router;