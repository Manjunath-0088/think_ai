$file = ".\repositories\assessmentRepository.js"

$content = Get-Content $file -Raw


# ============================================================
# FIX 1
# Replace recalculateCodingQuestionScore()
# ============================================================

$startMarker = "const recalculateCodingQuestionScore = async ("
$endMarker = "/*`r`n * ============================================================`r`n * GET ASSESSMENT SUBMISSION RESULT"

$start = $content.IndexOf($startMarker)
$end = $content.IndexOf($endMarker, $start)

if ($start -lt 0 -or $end -lt 0) {
    Write-Host "Could not find recalculateCodingQuestionScore()" -ForegroundColor Red
    exit 1
}


$newFunction = @'
const recalculateCodingQuestionScore = async (
    submissionId,
    questionId
) => {

    const parsedSubmissionId =
        Number(submissionId);

    const parsedQuestionId =
        Number(questionId);


    // --------------------------------------------------------
    // Get all executions
    // --------------------------------------------------------

    const executionRecords =
        await prisma.codingTestCaseExecution.findMany({

            where: {

                submissionId:
                    parsedSubmissionId,

                questionId:
                    parsedQuestionId
            },

            include: {

                testCase: true
            },

            // Latest execution first
            orderBy: {

                id: "desc"
            }
        });


    if (executionRecords.length === 0) {

        throw new Error(
            "No coding test case executions found"
        );
    }


    // --------------------------------------------------------
    // Keep ONLY latest execution for each test case
    // --------------------------------------------------------

    const latestExecutionMap =
        new Map();


    for (
        const execution
        of executionRecords
    ) {

        if (
            !latestExecutionMap.has(
                execution.testCaseId
            )
        ) {

            latestExecutionMap.set(
                execution.testCaseId,
                execution
            );
        }
    }


    const latestExecutions =
        Array.from(
            latestExecutionMap.values()
        );


    // --------------------------------------------------------
    // Calculate current coding marks
    // --------------------------------------------------------

    const marksObtained =
        latestExecutions.reduce(

            (total, execution) =>
                total +
                Number(
                    execution.marksObtained || 0
                ),

            0
        );


    // --------------------------------------------------------
    // Check completion
    // --------------------------------------------------------

    const allCompleted =
        latestExecutions.length > 0 &&
        latestExecutions.every(
            execution =>
                execution.judge0Status !== null
        );


    // --------------------------------------------------------
    // Check whether all test cases passed
    // --------------------------------------------------------

    const allPassed =
        latestExecutions.length > 0 &&
        latestExecutions.every(
            execution =>
                execution.passed === true
        );


    // --------------------------------------------------------
    // Update coding SubmissionAnswer
    // --------------------------------------------------------

    await prisma.submissionAnswer.updateMany({

        where: {

            submissionId:
                parsedSubmissionId,

            questionId:
                parsedQuestionId
        },

        data: {

            isCorrect:
                allCompleted
                    ? allPassed
                    : null,

            marksObtained
        }
    });


    // --------------------------------------------------------
    // Get assessment submission
    // --------------------------------------------------------

    const submission =
        await prisma.assessmentSubmission.findUnique({

            where: {

                id:
                    parsedSubmissionId
            },

            select: {

                id: true,

                totalMarks: true
            }
        });


    if (!submission) {

        throw new Error(
            "Assessment submission not found"
        );
    }


    // --------------------------------------------------------
    // Get marks for OTHER questions
    // --------------------------------------------------------

    const answers =
        await prisma.submissionAnswer.findMany({

            where: {

                submissionId:
                    parsedSubmissionId
            },

            select: {

                questionId: true,

                marksObtained: true
            }
        });


    const score =
        answers.reduce(

            (total, answer) => {

                // Do not count old coding marks.
                // Current coding marks already come
                // from latestExecutions.

                if (
                    Number(answer.questionId) ===
                    parsedQuestionId
                ) {

                    return total;
                }


                return total +
                    Number(
                        answer.marksObtained || 0
                    );
            },

            marksObtained
        );


    // --------------------------------------------------------
    // Percentage
    // --------------------------------------------------------

    const percentage =
        submission.totalMarks > 0

            ? Number(
                (
                    (
                        score /
                        submission.totalMarks
                    ) * 100
                ).toFixed(2)
            )

            : 0;


    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

    const status =
        allCompleted
            ? "COMPLETED"
            : "IN_PROGRESS";


    // --------------------------------------------------------
    // Update submission
    // --------------------------------------------------------

    const updatedSubmission =
        await prisma.assessmentSubmission.update({

            where: {

                id:
                    parsedSubmissionId
            },

            data: {

                score,

                percentage,

                status
            }
        });


    return {

        submissionId:
            updatedSubmission.id,

        questionId:
            parsedQuestionId,

        marksObtained,

        score:
            updatedSubmission.score,

        totalMarks:
            updatedSubmission.totalMarks,

        percentage:
            updatedSubmission.percentage,

        status:
            updatedSubmission.status,

        allCompleted,

        allPassed
    };
};


'@


$content =
    $content.Substring(
        0,
        $start
    ) +
    $newFunction +
    $content.Substring(
        $end
    )


# ============================================================
# FIX 2
# Replace execution-result calculation
# ============================================================

$oldBlock = @'
        const executions =
            submission.codingTestCaseExecutions || [];


        const totalTestCases =
            executions.length;


        const passedTestCases =
            executions.filter(
                execution =>
                    execution.passed === true
            ).length;


        const failedTestCases =
            executions.filter(
                execution =>
                    execution.passed === false
            ).length;
'@


$newBlock = @'
        const allExecutions =
            submission.codingTestCaseExecutions || [];


        // --------------------------------------------------------
        // Keep only latest execution for each
        // question + test case
        // --------------------------------------------------------

        const latestExecutionMap =
            new Map();


        for (
            const execution
            of allExecutions
        ) {

            const key =
                `${execution.questionId}-${execution.testCaseId}`;


            const existing =
                latestExecutionMap.get(key);


            if (
                !existing ||
                Number(execution.id) >
                Number(existing.id)
            ) {

                latestExecutionMap.set(
                    key,
                    execution
                );
            }
        }


        const executions =
            Array.from(
                latestExecutionMap.values()
            ).sort(
                (a, b) =>
                    Number(a.id) -
                    Number(b.id)
            );


        const totalTestCases =
            executions.length;


        const passedTestCases =
            executions.filter(
                execution =>
                    execution.passed === true
            ).length;


        const failedTestCases =
            executions.filter(
                execution =>
                    execution.passed === false
            ).length;
'@


if (
    $content.Contains($oldBlock)
) {

    $content =
        $content.Replace(
            $oldBlock,
            $newBlock
        )

} else {

    Write-Host "Result block was not found. It may already be changed." -ForegroundColor Yellow
}


# ============================================================
# Save
# ============================================================

Set-Content `
    -Path $file `
    -Value $content `
    -Encoding UTF8


Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Coding score fix applied successfully" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "File changed:" -ForegroundColor Cyan
Write-Host $file
Write-Host ""
Write-Host "Historical executions will no longer be added together." -ForegroundColor Green
Write-Host ""