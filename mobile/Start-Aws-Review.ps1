$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
    node scripts/start-aws-review.cjs
} finally {
    Pop-Location
}
