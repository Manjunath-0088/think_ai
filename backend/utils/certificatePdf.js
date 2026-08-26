const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");


/*
 * Default certificate colors
 */
const DEFAULTS = {
    primaryColor: "#1E3A8A",
    secondaryColor: "#64748B",
    backgroundColor: "#FFFFFF",
    borderColor: "#1E3A8A",
    textColor: "#111827"
};


/*
 * Validate HEX color.
 * PDFKit expects valid color values.
 */
const getSafeColor = (
    value,
    fallback
) => {

    if (
        typeof value === "string" &&
        /^#[0-9A-Fa-f]{6}$/.test(value)
    ) {
        return value;
    }

    return fallback;
};


/*
 * Safely convert a value to text.
 */
const safeText = (
    value,
    fallback = ""
) => {

    if (
        value === undefined ||
        value === null
    ) {
        return fallback;
    }

    return String(value);
};


/*
 * Generate certificate PDF
 */
const generateCertificatePdf = (
    certificate,
    template = {}
) => {

    return new Promise((resolve, reject) => {

        try {

            /*
             * -----------------------------------------
             * Certificate directory
             * -----------------------------------------
             */

            const certificatesDir =
                path.resolve(
                    __dirname,
                    "../generated/certificates"
                );


            fs.mkdirSync(
                certificatesDir,
                {
                    recursive: true
                }
            );


            /*
             * -----------------------------------------
             * Certificate file
             * -----------------------------------------
             */

            const certificateNo =
                safeText(
                    certificate.certificateNo,
                    `CERT-${Date.now()}`
                );


            const fileName =
                `${certificateNo}.pdf`;


            const filePath =
                path.join(
                    certificatesDir,
                    fileName
                );


            /*
             * -----------------------------------------
             * PDF document
             * -----------------------------------------
             */

            const doc =
                new PDFDocument({
                    size: "A4",
                    margin: 50,
                    bufferPages: true
                });


            const stream =
                fs.createWriteStream(
                    filePath
                );


            doc.pipe(stream);


            /*
             * -----------------------------------------
             * Template settings
             * -----------------------------------------
             */

            const primaryColor =
                getSafeColor(
                    template.primaryColor,
                    DEFAULTS.primaryColor
                );


            const secondaryColor =
                getSafeColor(
                    template.secondaryColor,
                    DEFAULTS.secondaryColor
                );


            const backgroundColor =
                getSafeColor(
                    template.backgroundColor,
                    DEFAULTS.backgroundColor
                );


            const borderColor =
                getSafeColor(
                    template.borderColor,
                    DEFAULTS.borderColor
                );


            const textColor =
                getSafeColor(
                    template.textColor,
                    DEFAULTS.textColor
                );


            const title =
                safeText(
                    template.title,
                    "CERTIFICATE OF COMPLETION"
                );


            const organizationName =
                safeText(
                    template.organizationName
                );


            const organizationDetails =
                safeText(
                    template.organizationDetails
                );


            const description =
                safeText(
                    template.description,
                    "This is to certify that"
                );


            const footerText =
                safeText(
                    template.footerText
                );


            /*
             * -----------------------------------------
             * Background
             * -----------------------------------------
             */

            doc
                .rect(
                    0,
                    0,
                    doc.page.width,
                    doc.page.height
                )
                .fill(backgroundColor);


            /*
             * -----------------------------------------
             * Outer border
             * -----------------------------------------
             */

            doc
                .lineWidth(4)
                .strokeColor(borderColor)
                .rect(
                    25,
                    25,
                    doc.page.width - 50,
                    doc.page.height - 50
                )
                .stroke();


            /*
             * Inner decorative border
             * -----------------------------------------
             */

            doc
                .lineWidth(1)
                .strokeColor(primaryColor)
                .rect(
                    35,
                    35,
                    doc.page.width - 70,
                    doc.page.height - 70
                )
                .stroke();


            /*
             * -----------------------------------------
             * Organization name
             * -----------------------------------------
             */

            if (organizationName) {

                doc
                    .font("Helvetica-Bold")
                    .fontSize(16)
                    .fillColor(primaryColor)
                    .text(
                        organizationName,
                        70,
                        70,
                        {
                            width:
                                doc.page.width - 140,
                            align: "center"
                        }
                    );
            }


            /*
             * Organization details
             * -----------------------------------------
             */

            if (organizationDetails) {

                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .fillColor(secondaryColor)
                    .text(
                        organizationDetails,
                        70,
                        92,
                        {
                            width:
                                doc.page.width - 140,
                            align: "center"
                        }
                    );
            }


            /*
             * -----------------------------------------
             * Logo
             * -----------------------------------------
             *
             * PDFKit requires a local file path.
             * Remote URLs should be downloaded before
             * calling this utility.
             */

            if (
                template.logoPath &&
                typeof template.logoPath === "string" &&
                fs.existsSync(template.logoPath)
            ) {

                try {

                    doc.image(
                        template.logoPath,
                        doc.page.width / 2 - 45,
                        115,
                        {
                            width: 90,
                            height: 90,
                            fit: [90, 90],
                            align: "center",
                            valign: "center"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Certificate logo error:",
                        error.message
                    );
                }
            }


            /*
             * -----------------------------------------
             * Certificate title
             * -----------------------------------------
             */

            doc
                .font("Helvetica-Bold")
                .fontSize(27)
                .fillColor(primaryColor)
                .text(
                    title,
                    60,
                    220,
                    {
                        width:
                            doc.page.width - 120,
                        align: "center"
                    }
                );


            /*
             * Decorative line
             * -----------------------------------------
             */

            doc
                .moveTo(180, 265)
                .lineTo(
                    doc.page.width - 180,
                    265
                )
                .lineWidth(2)
                .strokeColor(primaryColor)
                .stroke();


            /*
             * -----------------------------------------
             * Description
             * -----------------------------------------
             */

            doc
                .font("Helvetica")
                .fontSize(15)
                .fillColor(textColor)
                .text(
                    description,
                    70,
                    295,
                    {
                        width:
                            doc.page.width - 140,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Student name
             * -----------------------------------------
             */

            const studentName =
                safeText(
                    certificate.studentName,
                    "Student"
                );


            doc
                .font("Helvetica-Bold")
                .fontSize(25)
                .fillColor(primaryColor)
                .text(
                    studentName,
                    70,
                    335,
                    {
                        width:
                            doc.page.width - 140,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Completion message
             * -----------------------------------------
             */

            doc
                .font("Helvetica")
                .fontSize(14)
                .fillColor(textColor)
                .text(
                    "has successfully completed the course",
                    70,
                    380,
                    {
                        width:
                            doc.page.width - 140,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Course name
             * -----------------------------------------
             */

            const courseName =
                safeText(
                    certificate.courseName,
                    "Course"
                );


            doc
                .font("Helvetica-Bold")
                .fontSize(21)
                .fillColor(primaryColor)
                .text(
                    courseName,
                    70,
                    420,
                    {
                        width:
                            doc.page.width - 140,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Completion percentage
             * -----------------------------------------
             */

            const completionPercentage =
                Number(
                    certificate.completionPercentage || 0
                );


            doc
                .font("Helvetica")
                .fontSize(13)
                .fillColor(secondaryColor)
                .text(
                    `Course Completion: ${completionPercentage}%`,
                    70,
                    475,
                    {
                        width:
                            doc.page.width - 140,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Instructor
             * -----------------------------------------
             */

            if (certificate.instructorName) {

                doc
                    .font("Helvetica")
                    .fontSize(12)
                    .fillColor(textColor)
                    .text(
                        `Instructor: ${safeText(
                            certificate.instructorName
                        )}`,
                        70,
                        505,
                        {
                            width:
                                doc.page.width - 140,
                            align: "center"
                        }
                    );
            }


            /*
             * -----------------------------------------
             * Issued date
             * -----------------------------------------
             */

            const issuedDate =
                certificate.issuedAt ||
                certificate.createdAt ||
                new Date();


            const formattedDate =
                new Date(
                    issuedDate
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }
                );


            doc
                .font("Helvetica")
                .fontSize(12)
                .fillColor(textColor)
                .text(
                    `Issued Date: ${formattedDate}`,
                    70,
                    530,
                    {
                        width:
                            doc.page.width - 140,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Signature image
             * -----------------------------------------
             */

            if (
                template.signaturePath &&
                typeof template.signaturePath === "string" &&
                fs.existsSync(template.signaturePath)
            ) {

                try {

                    doc.image(
                        template.signaturePath,
                        doc.page.width / 2 - 60,
                        570,
                        {
                            width: 120,
                            height: 45,
                            fit: [120, 45],
                            align: "center",
                            valign: "center"
                        }
                    );

                } catch (error) {

                    console.error(
                        "Certificate signature error:",
                        error.message
                    );
                }
            }


            /*
             * -----------------------------------------
             * Signature name
             * -----------------------------------------
             */

            if (template.signatureName) {

                doc
                    .font("Helvetica-Bold")
                    .fontSize(11)
                    .fillColor(primaryColor)
                    .text(
                        template.signatureName,
                        70,
                        620,
                        {
                            width:
                                doc.page.width - 140,
                            align: "center"
                        }
                    );
            }


            /*
             * -----------------------------------------
             * Signature title
             * -----------------------------------------
             */

            if (template.signatureTitle) {

                doc
                    .font("Helvetica")
                    .fontSize(9)
                    .fillColor(secondaryColor)
                    .text(
                        template.signatureTitle,
                        70,
                        638,
                        {
                            width:
                                doc.page.width - 140,
                            align: "center"
                        }
                    );
            }


            /*
             * -----------------------------------------
             * Footer
             * -----------------------------------------
             */

            if (footerText) {

                doc
                    .font("Helvetica")
                    .fontSize(9)
                    .fillColor(secondaryColor)
                    .text(
                        footerText,
                        60,
                        675,
                        {
                            width:
                                doc.page.width - 120,
                            align: "center"
                        }
                    );
            }


            /*
             * -----------------------------------------
             * Certificate ID
             * -----------------------------------------
             */

            doc
                .font("Helvetica")
                .fontSize(8)
                .fillColor(secondaryColor)
                .text(
                    `Certificate ID: ${certificateNo}`,
                    60,
                    710,
                    {
                        width:
                            doc.page.width - 120,
                        align: "center"
                    }
                );


            /*
             * -----------------------------------------
             * Verification URL
             * -----------------------------------------
             */

            if (certificate.verificationUrl) {

                doc
                    .font("Helvetica")
                    .fontSize(8)
                    .fillColor(secondaryColor)
                    .text(
                        `Verify: ${certificate.verificationUrl}`,
                        60,
                        728,
                        {
                            width:
                                doc.page.width - 120,
                            align: "center"
                        }
                    );
            }


            /*
             * -----------------------------------------
             * Finalize PDF
             * -----------------------------------------
             */

            doc.end();


            /*
             * -----------------------------------------
             * File successfully created
             * -----------------------------------------
             */

            stream.on(
                "finish",
                () => {

                    resolve(filePath);

                }
            );


            /*
             * -----------------------------------------
             * File creation error
             * -----------------------------------------
             */

            stream.on(
                "error",
                (error) => {

                    reject(error);

                }
            );

        } catch (error) {

            reject(error);
        }
    });
};


module.exports = {
    generateCertificatePdf
};