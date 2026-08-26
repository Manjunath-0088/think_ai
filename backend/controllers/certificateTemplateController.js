const service =
    require("../services/certificateTemplateService");


/*
 * Get active certificate template
 */
const getActiveCertificateTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.getActiveCertificateTemplate();

        if (!template) {

            return res.status(404).json({
                success: false,
                message:
                    "No active certificate template found"
            });
        }

        return res.status(200).json({
            success: true,
            data: template
        });

    } catch (error) {

        console.error(
            "Get active certificate template error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/*
 * Get all certificate templates
 *
 * Admin use
 */
const getAllCertificateTemplates = async (
    req,
    res
) => {

    try {

        const templates =
            await service.getAllCertificateTemplates();

        return res.status(200).json({
            success: true,
            data: templates
        });

    } catch (error) {

        console.error(
            "Get certificate templates error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/*
 * Get certificate template by ID
 *
 * Admin use
 */
const getCertificateTemplateById = async (
    req,
    res
) => {

    try {

        const template =
            await service.getCertificateTemplateById(
                req.params.id
            );

        if (!template) {

            return res.status(404).json({
                success: false,
                message:
                    "Certificate template not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: template
        });

    } catch (error) {

        console.error(
            "Get certificate template error:",
            error
        );

        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {
            return res.status(400).json({
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


/*
 * Create certificate template
 *
 * Admin use
 */
const createCertificateTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.createCertificateTemplate(
                req.body
            );

        return res.status(201).json({
            success: true,
            message:
                "Certificate template created successfully",
            data: template
        });

    } catch (error) {

        console.error(
            "Create certificate template error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/*
 * Update certificate template
 *
 * Admin use
 */
const updateCertificateTemplate = async (
    req,
    res
) => {

    try {

        const template =
            await service.updateCertificateTemplate(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message:
                "Certificate template updated successfully",
            data: template
        });

    } catch (error) {

        console.error(
            "Update certificate template error:",
            error
        );

        if (
            error.message.includes(
                "must be a positive integer"
            ) ||
            error.message ===
                "No fields provided for update"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.code === "P2025"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Certificate template not found"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


/*
 * Delete certificate template
 *
 * Admin use
 */
const deleteCertificateTemplate = async (
    req,
    res
) => {

    try {

        await service.deleteCertificateTemplate(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message:
                "Certificate template deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete certificate template error:",
            error
        );

        if (
            error.message.includes(
                "must be a positive integer"
            )
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (
            error.code === "P2025"
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Certificate template not found"
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {

    getActiveCertificateTemplate,

    getAllCertificateTemplates,

    getCertificateTemplateById,

    createCertificateTemplate,

    updateCertificateTemplate,

    deleteCertificateTemplate
};