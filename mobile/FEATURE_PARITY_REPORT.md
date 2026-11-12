# ThinkZai AI Website-to-Android Feature Parity Audit

Audit date: 2026-11-08  
Scope: `src/` community site, `frontend/` LMS web application, `mobile/` Expo Android app, and the existing Express/Prisma/PostgreSQL services.

## Executive result

The Android app covers the active learner workflow and a broader set of LMS and community screens. This pass fixed API base URL normalization, account-isolated Wishlist state and Explore save controls, theme propagation through LMS/staff/onboarding screens, the My Learning book icon, and the visible Profile theme label. It also closed four release-blocking gaps: credentials now use Android Keystore-backed SecureStore, push registration is revoked on sign-out, Live Studio now lists/selects/create real sessions instead of a demo ID, and the Jitsi room is rendered through a short-lived backend token. Assessment polling is bounded with backoff/manual retry, and progress sync is capped with a no-progress guard.

Mobile TypeScript, Jest (84 suites / 731 tests), lint, Expo config, and Android Hermes export pass. The backend suite passes 67 tests with 1 skipped, including new Live Studio and Jitsi-token coverage. Full website-to-Android parity is **not verified or complete**: this repository has two different website entry points, the LMS frontend currently exposes role placeholders, community persistence differs between the root website and Android, PostgreSQL routes were not verified against a dedicated test database, and no physical Android device was attached for runtime verification.

## Website inventory and comparison

The repository has two web applications rather than one canonical website:

- The root `index.html` loads `src/main.jsx`, a hash-routed community site. It exposes the discussion feed, create discussion, discussion detail/replies, tags, user profile, assessment, and bookmarks. Its `ForumApi` is seeded and persists through browser `localStorage`; it does not use the PostgreSQL community API.
- `frontend/` is a separate React Router LMS site. Its active routes include landing, login, registration, organization-login placeholder, and protected admin routing. The active learner, instructor, and TA routes render “coming soon” placeholders. Existing `LearnerRoutes`, `InstructorRoutes`, `AdminRoutes`, forum routes, and live-class pages are present as source, but most are not mounted from `frontend/src/App.jsx`. `AppRoutes` also renders a `BrowserRouter` under the root `BrowserRouter`, which needs a web runtime routing pass before the legacy admin/course/batch flows can be counted as working.

| Feature | Website state | Android state | Parity result |
| --- | --- | --- | --- |
| Sign-in and registration | Active in `frontend/`; root community app has no shared sign-in flow | Login and registration call the existing auth endpoints, store the bearer token/profile, and route by role | Android implemented; shared website identity not verified |
| Five learner destinations | No active learner dashboard in the LMS frontend | Home, My Learning, Explore, Wishlist, Profile tabs | Implemented; layout, accessibility, 375 px and 390 px assertions pass |
| Course discovery and search | LMS learner routes are source-only; community app has local forum search | Live course catalogue, global search, categories, course detail | Implemented against existing catalogue/course APIs; live DB contract unverified |
| Learning and progress | Player/assessment/certificate pages exist in source but learner route is a placeholder | Course player, lesson resume, progress sync, assessments/results, certificates, downloads, code playground/history | Android implemented against `/api/lms`; no dedicated PostgreSQL journey run |
| Community forum | Root site has feed, categories/tags, posts, replies, votes, profile, assessment and bookmarks backed by browser storage | Forum home/categories/thread/create/bookmarks/notifications/moderation, reachable from My Learning | Feature surfaces integrated in Android; data is not shared with root website until that website uses the existing backend API |
| Notifications | Preference and notification pages exist only in unmounted LMS source; root forum notification state is local | Community notification center/preferences, push registration, and sign-out token revocation | Android screens and existing endpoints integrated; remote push delivery is not implemented/verified |
| Wishlist | No active website learner wishlist | Saved course list persisted per account in Android `AsyncStorage`, with save actions in Explore | Account isolation works on one device; no existing course-wishlist backend endpoint, so cross-device/database parity is absent |
| Learner profile and theme | Admin profile source exists; active learner profile is a placeholder | Learner information, global Light/Dark provider, SecureStore-backed session | Theme styles consume the active palette across learner, LMS, staff, and onboarding modules; physical screenshot/accessibility review remains |
| Admin | Active route composition includes nested-router risk; source includes users/courses/batches/profile | Admin workspace, analytics and RBAC matrix | Partial; native user/course/batch CRUD is missing |
| Instructor and TA | Active routes are placeholders; source includes module/assignment/submission/certificate/video tools | Staff tools, attendance, grading queue, real session selection, instructor controls and Live Studio | Partial; native module/assignment management, instructor certificates and video preview are missing |
| Live classes | Source learner list uses hard-coded mock classes and `/api/live-classes`; this route is not registered | Live Studio lists/selects/creates real sessions, saves instructor controls, and mounts a Jitsi WebView with a backend-issued short-lived JWT | Session lifecycle and video-room integration implemented; device/permission and configured-Jitsi verification remains |
| Checkout and payments | Checkout source route is not mounted in the active learner app | Checkout and payment result screens use existing payment client | UI exists; production payment provider/ledger is fail-closed and unavailable in this environment |

## Android changes completed in this pass

- Added role-aware starting screens and route access checks for learners, instructors, TAs, moderators, and administrators. Removed a learner-facing shortcut to a staff-only screen.
- Added account registration through the existing `/auth/register` endpoint and a sign-in link to registration.
- Protected authenticated deep links, retained the requested destination through sign-in, and resumed it after authentication when the signed-in role is authorized.
- Corrected course catalogue parsing for the backend’s array response and replaced a nonexistent course-content request with the existing enrolled-course/player APIs.
- Routed numeric production course/lesson IDs into the native LMS video player and mapped the most recently updated unfinished lesson as the resume target.
- Added refresh-on-return behavior for the dashboard, My Learning, and course detail screens.
- Added regression coverage for auth, API response shapes, role navigation, deep links, course resume, and the dashboard loading state.
- Normalized configured API URLs to include `/api`, added host-only/trailing-slash tests, updated setup examples, and required an absolute HTTPS URL for production EAS builds.
- Scoped local Wishlist storage by account, guarded persistence/hydration races, and exposed Wishlist saves from Explore.
- Replaced the My Learning play/video tab icon with a book outline and changed Profile's visible “Appearance” label to “Theme.”
- Migrated static-dark LMS, staff, analytics, and onboarding style layers to active theme palettes and added a theme-switch style assertion.
- Replaced AsyncStorage bearer-token persistence with Expo SecureStore, including legacy-key migration, rollback on write failure, and a sign-out cleanup seam.
- Added authenticated `DELETE /api/notifications/device-token` and mobile sign-out revocation, including tests for account-switch cleanup.
- Added explicit Live Studio session list/create APIs; reads and joins of unknown session IDs now return 404 instead of materializing demo rows.
- Rebuilt the Android Live Studio screen around a real session picker, instructor/admin creation, saved status/instructor controls, and an 8-second guarded refresh.
- Added `JitsiRoom` with a backend-issued 10-minute JWT, runtime camera/mic permission handling, WebView media-capture grant, explicit loading/error/unavailable states, and Android camera/audio manifest permissions.
- Enforced Instructor/Admin authorization on Live Studio session creation/status, polls, and breakout rooms; message deletion now requires the author or an Instructor/Admin moderator.
- Bounded assessment-result polling with 2-second-to-30-second backoff, a 12-attempt cap, and a manual “Check now” action.
- Capped progress-sync drains at 10 batches and stopped unchanged-queue loops with a visible retry status, including JSON-equality detection.

These changes add only the Live Studio session endpoints and the notification device-token revocation endpoint; existing authentication, RBAC, LMS, and community contracts are reused.

## Key files changed in this pass

- `mobile/src/api/credentials.ts` (new), `mobile/src/api/session.ts`, `mobile/src/App.tsx`: SecureStore credentials, migration, rollback, and sign-out cleanup seam.
- `mobile/src/features/notifications/pushRegistration.ts`, `backend/routes/notificationPreferences.js`: push-token registration memory and scoped revocation.
- `mobile/src/api/liveStudioApi.ts`, `mobile/src/components/live/JitsiRoom.tsx`, `mobile/src/screens/staff/LiveStudioScreen.tsx`, `mobile/src/screens/staff/InstructorControlsScreen.tsx`, `mobile/src/navigation/*`: session lifecycle, Jitsi room, and permissions.
- `backend/src/live/liveRepository.js`, `liveService.js`, `liveController.js`, `backend/src/routes/studioRoutes.js`: explicit session APIs, not-found behavior, Jitsi token checks, and role enforcement.
- `mobile/src/hooks/useAssessmentResults.ts`, `mobile/src/screens/lms/ResultsScreen.tsx`, `mobile/src/hooks/useProgressSync.ts`: bounded polling and capped/no-progress-safe sync.
- `mobile/app.config.js`, `mobile/jest.setup.js`, `mobile/package.json`: SecureStore/WebView native config, permissions, and test mocks.
- Tests: `mobile/src/tests/api/sessionPersistence.test.ts`, `notifications/pushRevocation.test.ts`, `api/liveStudioApi.test.ts`, `live/JitsiRoom.test.tsx`, `live/LiveStudioScreen.test.tsx`, `hooks/progressSyncGuards.test.tsx`, `hooks/assessmentPolling.test.tsx`, `backend/liveStudioService.test.js`, `backend/liveControllerJitsi.test.js`, `backend/liveControllerPermissions.test.js`, `backend/notificationDeviceToken.test.js`.

## Backend, PostgreSQL, authentication, and RBAC

- Android LMS requests use bearer-authenticated `/api/lms` routes for profile, courses, enrollments, player access, lesson notes/content, progress sync, assessments, certificates, analytics, and code execution.
- Android community requests use the existing `/api` community contract for discussions, replies, categories/tags, bookmarks, notifications/preferences, moderation, and Live Studio. The PostgreSQL community router resolves the bearer identity to a numeric LMS user and rejects unknown accounts.
- Authentication/RBAC unit coverage passed. Backend tests include role hierarchy and role-matrix checks. Route smoke checks pass in test-only in-memory mode.
- `DELETE /api/notifications/device-token` is authenticated and only removes the caller's device token; Android calls it before clearing the local session. Token revocation tests pass.
- Live Studio exposes explicit session list/create routes and rejects unknown sessions with 404. Jitsi credentials require `JITSI_DOMAIN`, `JITSI_APP_ID`, and `JITSI_JWT_SECRET`; unconfigured environments fail closed with 503, and tokens expire after 10 minutes. Session creation/status, polls, and breakout rooms require Instructor/Admin; message deletion is limited to the author or an Instructor/Admin moderator.
- A PostgreSQL route-suite run using the repository’s configured community mode returned `403 Invalid account identity` because the smoke tests still send placeholder IDs such as `u1`; that is not a valid production PostgreSQL identity fixture.
- `LMS_TEST_DATABASE_URL` is not configured. Both opt-in PostgreSQL integration tests skipped. No database writes or learner journey were run against a real/dedicated PostgreSQL test database, so PostgreSQL persistence and data synchronization remain unverified.
- The root community website uses local browser storage, while Android uses the backend. Both surfaces have similar community actions, but their posts/bookmarks/notifications are not currently one shared dataset.

## Verification results

| Check | Result |
| --- | --- |
| Android Expo export | Passed; Hermes Android bundle emitted (3.1 MB, 1,190 modules) |
| Android JS bundle after changes | Passed; `expo export --platform android` emitted the Hermes bundle |
| Android native debug build | Attempted; Gradle configured with Android Studio JDK 25, Android SDK 37, NDK 27.1.12297006. Build failed on TLS handshake when resolving dependencies from Maven Central/JitPack (environment network restriction, not code) |
| Backend unit suite | Passed, 67 passed / 0 failed / 1 skipped (auth E2E requires `E2E_BASE_URL`) |
| Live Studio backend tests | Passed, 8 tests (session lifecycle plus Jitsi configured/not-found/token behavior) |
| Live Studio controller permission tests | Passed, 6 tests (Instructor/Admin create/manage enforcement) |
| Root community website tests | Passed, 10 files / 111 tests using the installed Vitest runtime and a temporary workspace config |
| LMS frontend production build | Passed |
| LMS frontend ESLint | Failed: 319 errors and 19 warnings across existing frontend files |
| LMS backend suite | Passed, 166 tests |
| Backend route smoke suite | Passed, 15 tests in test-only in-memory community mode |
| PostgreSQL LMS integration tests | 2 skipped; dedicated `LMS_TEST_DATABASE_URL` absent |
| PostgreSQL community route verification | Not passed; placeholder `u1` fixture is rejected by the production identity check |
| Physical Android verification | Not run; ADB reports no connected devices |
| Android screenshot report | Not available; no device/emulator was attached |

The root forum test suite has no root package test script/dependency set; its 111 passing tests were run through the already-installed Vitest binary with temporary aliases/configuration. The temporary config was removed afterward.

## Remaining blockers and impact

1. **One website source of truth:** the root forum is localStorage-backed, while Android uses the existing server APIs. Community state does not synchronize between the two until the website is connected to those same routes.
2. **Unfinished web LMS routes:** learner/instructor/TA route placeholders and the nested-router issue prevent these source pages from serving as reliable live parity references.
3. **Missing Android staff/admin CRUD:** Android does not yet implement course/module/lesson, user, batch, and instructor assignment-management screens.
4. **Wishlist persistence:** there is no existing course wishlist API, so current saves are device-local.
5. **Live session availability:** Android now lists/selects/creates real sessions and renders Jitsi when the backend is configured, but the actual scheduled-session data and Jitsi environment could not be exercised without a configured test room and device.
6. **PostgreSQL verification:** provide an empty, dedicated `LMS_TEST_DATABASE_URL` and valid numeric test-user fixtures before claiming DB/RBAC journeys verified. Do not point these integration tests at a production database.
7. **Android delivery verification:** a native debug build is being attempted with the installed Android Studio JDK/SDK. A physical device or emulator must still be attached to install the APK and capture screenshots.
8. **Frontend lint debt:** the LMS web package build succeeds, but its lint command reports 319 errors and 19 warnings, so repository-wide lint acceptance is not met.

## Acceptance status

The Android app has substantial functional coverage, and this pass closed the previously identified credential-storage, push-revocation, Live Studio demo-lifecycle/video-room, and unbounded-polling gaps. Mobile and backend automated suites are green. The task still cannot be marked fully complete against the requested final acceptance criterion until the remaining website/backend/device gaps above are resolved and verified.
