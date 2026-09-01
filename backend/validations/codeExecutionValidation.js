const SUPPORTED_LANGUAGES = [
    "python",
    "python3",
    "javascript",
    "js",
    "java",
    "c",
    "cpp",
    "c++",
    "go"
];


const validatePositiveInteger = (
    value,
    fieldName,
    errors
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        errors.push(
            `${fieldName} is required`
        );

        return;
    }


    const numberValue =
        Number(value);


    if (
        !Number.isInteger(
            numberValue
        ) ||
        numberValue <= 0
    ) {

        errors.push(
            `${fieldName} must be a valid positive integer`
        );
    }
};


const validateCodeExecution = (
    req,
    res,
    next
) => {

    const {
        language,
        code,
        stdin,
        submissionId,
        questionId,
        testCaseId
    } = req.body;


    const errors = [];


    // ----------------------------------------------------
    // Validate language
    // ----------------------------------------------------

    if (
        !language ||
        typeof language !== "string" ||
        !language.trim()
    ) {

        errors.push(
            "language is required"
        );

    } else if (
        !SUPPORTED_LANGUAGES.includes(
            language
                .toLowerCase()
                .trim()
        )
    ) {

        errors.push(
            `Unsupported language. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`
        );
    }


    // ----------------------------------------------------
    // Validate code
    // ----------------------------------------------------

    if (
        !code ||
        typeof code !== "string" ||
        !code.trim()
    ) {

        errors.push(
            "code is required"
        );

    } else if (
        code.length > 100000
    ) {

        errors.push(
            "code must not exceed 100000 characters"
        );
    }


    // ----------------------------------------------------
    // Validate stdin
    // ----------------------------------------------------

    if (
        stdin !== undefined &&
        stdin !== null &&
        typeof stdin !== "string"
    ) {

        errors.push(
            "stdin must be a string"
        );
    }


    // ----------------------------------------------------
    // Validate submissionId
    // ----------------------------------------------------

    validatePositiveInteger(
        submissionId,
        "submissionId",
        errors
    );


    // ----------------------------------------------------
    // Validate questionId
    // ----------------------------------------------------

    validatePositiveInteger(
        questionId,
        "questionId",
        errors
    );


    // ----------------------------------------------------
    // Validate testCaseId
    // ----------------------------------------------------

    validatePositiveInteger(
        testCaseId,
        "testCaseId",
        errors
    );


    // ----------------------------------------------------
    // Return validation errors
    // ----------------------------------------------------

    if (
        errors.length > 0
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Code execution validation failed",

            errors

        });
    }


    next();
};


module.exports = {
    validateCodeExecution
};