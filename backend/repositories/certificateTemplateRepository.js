const prisma = require("../config/database");


/*
 * Get the currently active certificate template
 */
const getActiveCertificateTemplate = async () => {

    return await prisma.certificateTemplate.findFirst({
        where: {
            isActive: true
        },
        orderBy: {
            id: "desc"
        }
    });
};


/*
 * Get all certificate templates
 */
const getAllCertificateTemplates = async () => {

    return await prisma.certificateTemplate.findMany({
        orderBy: {
            id: "desc"
        }
    });
};


/*
 * Get certificate template by ID
 */
const getCertificateTemplateById = async (id) => {

    return await prisma.certificateTemplate.findUnique({
        where: {
            id
        }
    });
};


/*
 * Create certificate template
 */
const createCertificateTemplate = async (data) => {

    return await prisma.certificateTemplate.create({
        data
    });
};


/*
 * Update certificate template
 */
const updateCertificateTemplate = async (
    id,
    data
) => {

    return await prisma.certificateTemplate.update({
        where: {
            id
        },
        data
    });
};


/*
 * Delete certificate template
 */
const deleteCertificateTemplate = async (id) => {

    return await prisma.certificateTemplate.delete({
        where: {
            id
        }
    });
};


module.exports = {

    getActiveCertificateTemplate,

    getAllCertificateTemplates,

    getCertificateTemplateById,

    createCertificateTemplate,

    updateCertificateTemplate,

    deleteCertificateTemplate
};