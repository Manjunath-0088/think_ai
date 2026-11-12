# Current Android and backend verification

Date: 2026-11-08

For the full website-to-Android comparison and outstanding blockers, see
[mobile/FEATURE_PARITY_REPORT.md](mobile/FEATURE_PARITY_REPORT.md).
For the detailed Android technical audit and prioritized findings, see
[mobile/TECHNICAL_AUDIT_REPORT.md](mobile/TECHNICAL_AUDIT_REPORT.md).

## Current verification

- Mobile TypeScript passed with 0 errors.
- Mobile Jest passed: 77 suites and 709 tests (2026-11-08).
- Mobile TypeScript passed with 0 errors; ESLint passed with 0 errors and 56
  warnings (2026-11-08).
- Expo config resolves; production EAS HTTPS URL validation and cleartext-off
  behavior passed. Android Expo export passed and emitted a roughly 3 MB Hermes bundle from
  1,188 modules. This verifies the JS/Hermes export, not a signed APK/AAB.
- Root community website tests passed: 10 files and 111 tests. They were run
  with the installed Vitest binary and a temporary config because the root
  community app has no test script or local test dependency set.
- The `frontend/` LMS production build passed. Its lint command currently
  reports 319 errors and 19 warnings.
- Backend unit tests passed: 62 passed, 0 failed, 1 skipped. The skipped auth
  E2E requires `E2E_BASE_URL` and a separately running backend.
- LMS backend tests passed: 166 tests.
- Backend route smoke tests passed: 15 tests in test-only in-memory community
  mode. With the configured PostgreSQL community router, their `u1` placeholder
  account is rejected as invalid; that run does not verify production DB routes.
- PostgreSQL LMS integration tests skipped because a dedicated
  `LMS_TEST_DATABASE_URL` is not configured. No DB writes were run as part of
  this audit.
- ADB starts outside the sandbox but reports no connected devices. Java and
  Gradle are unavailable and `mobile/android` is absent, so APK/AAB and physical
  screenshot verification are not complete.
- The LMS frontend has active learner/instructor/TA placeholders and a legacy
  nested-router issue. Community persistence also differs: the root web forum
  uses browser storage, while Android calls backend APIs.

Older backend/schema and migration validation history remains below; the
2026-11-08 parity report records the scope and current acceptance status.

## Earlier module test report

# Roopesh + Karthik module test report

Date: 2026-09-08

## Scope

- Roopesh: assessment engine, code-execution proxy, certificates, analytics,
  enrollment/payment flow, and learner portal.
- Karthik absorbed work: learner portal UI, checkout UI, notification UI, and
  live studio UI where present.
- Email delivery integration requested separately.

## Verified

- Backend test suite: 25 passed, 0 failed.
- Frontend component/integration suite: 108 passed, 0 failed.
- Frontend production build: passed.
- Local API smoke flow: health check, learner registration, login, authenticated
  `/auth/me`, and course retrieval all passed against local PostgreSQL.
- Backend lint/syntax check: passed.
- Full LMS E2E flow: course creation -> module -> lesson -> batch -> learner
  enrollment -> access unlock -> lesson completion -> certificate generation ->
  PDF download -> public certificate verification -> queued certificate email:
  passed on a fresh backend instance.
- Learner QA journey: login -> profile -> enrolled course content -> lesson
  progress -> certificate eligibility: passed. The QA course contains three
  playable public video lessons and is intentionally 33.33% complete.

## Fixed

1. Email templates existed but enrollment unlock and certificate generation did
   not enqueue any email. Both flows now enqueue recipient-addressed emails.
2. The notification queue previously only delivered to hard-coded mock users.
   It now supports real enrollment recipients while preserving preference checks
   for user-id based notifications.
3. Removed a circular queue/preference-service import that could leave the
   preference service with an undefined `enqueue` function.
4. Repaired stale RBAC test headers to use the current demo-auth header.
5. Repaired the frontend test runner by excluding incompatible Storybook test
   plugins from the normal Vitest run. The forum module dependency guard now
   permits its intentional `lucide-react` UI dependency.
6. Fixed certificate generation when no certificate-template model or active
   template is available. The service now falls back to its built-in PDF design
   and can repair a previously created certificate whose PDF was missing.
7. Removed the nested full-viewport sizing that produced a second page/scroll
   area in learner routes. Admin, instructor, and learner layouts now constrain
   their content pane with `min-h-0`; learner dashboard, course player,
   assessment, grades, and code-playground routes use the layout's scroll area
   rather than creating another viewport-height page.

## Open blockers / follow-up

- Judge0 is not reachable on `127.0.0.1:8082`; code-execution success, timeout,
  and fallback E2E cases cannot be completed until it is running.
- Payment-provider webhook confirmation is not available in this local setup,
  so the payment-provider portion of the paid-enrollment scenario remains
  unverified. The enrollment unlock and certificate portions passed.
- Real SendGrid delivery was intentionally not triggered during automated tests
  to avoid sending email to an external recipient. It requires a verified sender
  and valid provider credentials.
- The repository has a large pre-existing frontend lint backlog (289 errors in
  a full lint run), outside the focused Roopesh/Karthik flows. The production
  build still succeeds.
- A sensitive SendGrid credential is present in the local environment file.
  Rotate it immediately and keep environment files untracked.
- Visual browser E2E could not be run because no controllable browser is
  available in this session and no frontend dev server is running. API E2E and
  frontend component/integration coverage were run instead.
- Deployment blocker: course, module, lesson, batch, and enrollment management
  APIs are currently callable without role middleware. Do not expose this
  backend publicly until those mutation routes require authenticated Admin or
  Instructor roles and learner ownership checks are applied to progress routes.
