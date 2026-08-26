/*
 * Validate enrollment ID used for certificate operations
 */
const validateCertificateEnrollmentId = (
    req,
    res,
    next
) => {

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

    next();
};


/*
 * Validate certificate number
 */
const validateCertificateNumber = (
    req,
    res,
    next
) => {

    const certificateNo =
        req.params.certificateNo;

    if (
        typeof certificateNo !== "string" ||
        !certificateNo.trim()
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Certificate number is required"
        });
    }


    /*
     * Prevent unnecessarily large
     * certificate-number requests.
     */
    if (
        certificateNo.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Certificate number is too long"
        });
    }

    next();
};


module.exports = {
    validateCertificateEnrollmentId,
    validateCertificateNumber
};