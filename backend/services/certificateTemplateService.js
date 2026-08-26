const repository =
    require("../repositories/certificateTemplateRepository");


const validateId = (value) => {

    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "Certificate template ID must be a positive integer"
        );
    }

    return id;
};


/*
 * Get the currently active certificate template
 */
const getActiveCertificateTemplate = async () => {

    return repository.getActiveCertificateTemplate();
};


/*
 * Get all certificate templates
 */
const getAllCertificateTemplates = async () => {

    return repository.getAllCertificateTemplates();
};


/*
 * Get template by ID
 */
const getCertificateTemplateById = async (id) => {

    return repository.getCertificateTemplateById(
        validateId(id)
    );
};


/*
 * Create a new certificate template
 */
const createCertificateTemplate = async (data) => {

    return repository.createCertificateTemplate({
        name: data.name,
        title: data.title || "CERTIFICATE OF COMPLETION",

        primaryColor:
            data.primaryColor || "#000000",

        secondaryColor:
            data.secondaryColor || "#666666",

        backgroundColor:
            data.backgroundColor || "#FFFFFF",

        borderColor:
            data.borderColor || "#000000",

        logoUrl:
            data.logoUrl || null,

        signatureUrl:
            data.signatureUrl || null,

        organizationName:
            data.organizationName || null,

        organizationDetails:
            data.organizationDetails || null,

        footerText:
            data.footerText || null,

        isActive:
            data.isActive === true
    });
};


/*
 * Update certificate template
 */
const updateCertificateTemplate = async (
    id,
    data
) => {

    const templateId = validateId(id);

    const updateData = {};

    if (data.name !== undefined) {
        updateData.name = data.name;
    }

    if (data.title !== undefined) {
        updateData.title = data.title;
    }

    if (data.primaryColor !== undefined) {
        updateData.primaryColor =
            data.primaryColor;
    }

    if (data.secondaryColor !== undefined) {
        updateData.secondaryColor =
            data.secondaryColor;
    }

    if (data.backgroundColor !== undefined) {
        updateData.backgroundColor =
            data.backgroundColor;
    }

    if (data.borderColor !== undefined) {
        updateData.borderColor =
            data.borderColor;
    }

    if (data.logoUrl !== undefined) {
        updateData.logoUrl =
            data.logoUrl;
    }

    if (data.signatureUrl !== undefined) {
        updateData.signatureUrl =
            data.signatureUrl;
    }

    if (data.organizationName !== undefined) {
        updateData.organizationName =
            data.organizationName;
    }

    if (data.organizationDetails !== undefined) {
        updateData.organizationDetails =
            data.organizationDetails;
    }

    if (data.footerText !== undefined) {
        updateData.footerText =
            data.footerText;
    }

    if (data.isActive !== undefined) {
        updateData.isActive =
            data.isActive;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error(
            "No fields provided for update"
        );
    }

    return repository.updateCertificateTemplate(
        templateId,
        updateData
    );
};


/*
 * Delete certificate template
 */
const deleteCertificateTemplate = async (id) => {

    return repository.deleteCertificateTemplate(
        validateId(id)
    );
};


module.exports = {

    getActiveCertificateTemplate,

    getAllCertificateTemplates,

    getCertificateTemplateById,

    createCertificateTemplate,

    updateCertificateTemplate,

    deleteCertificateTemplate
};