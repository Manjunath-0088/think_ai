# ThinkZai AI Technical Audit Report

**Audit date:** 2026-11-08  
**Primary focus:** Android / React Native application  
**Scope:** Website-to-Android parity, mobile UI and navigation, API and authentication flows, backend routing/RBAC, PostgreSQL integration boundaries, repeated work/polling loops, and verification evidence.

## 1. Executive summary

The Android application has a substantial native implementation: five learner tabs, light/dark themes, course discovery and search, course detail and lesson playback, progress and resume, profile, wishlist, forum screens, notification screens, staff tools, and deep-link handling. This pass fixed API-base normalization, account-isolated Wishlist persistence, Explore save controls, the My Learning icon and Profile theme label, and static-dark theme styling in LMS/staff/onboarding screens. Current mobile TypeScript, Jest, lint, and Android JavaScript/Hermes export checks have been run.

The requested full website-to-Android equivalence is **not established**. This repository has two different web applications with different data paths. The root community site persists to browser storage, while Android community screens call the backend. The `frontend/` LMS application still routes learner, instructor, and TA roles to placeholders, and its older admin routes contain a nested router. This pass closed the previously listed secure-credential, push-token cleanup, Live Studio demo-session, video-room, and unbounded-polling gaps. Remaining production gaps include local-only wishlist synchronization, payment readiness, remote push delivery, shared website/Android community data, and live PostgreSQL/native-device verification. API URL normalization and the production EAS HTTPS guard are implemented, but device connectivity has not been verified.

This document distinguishes code-confirmed findings from unverified risks and intentional behavior. Mobile TypeScript, Jest, lint, Expo config, and Android export were rerun on 2026-11-08. Other web/backend results are prior recorded evidence and are labeled as such. No physical Android device, APK/AAB build, or dedicated PostgreSQL integration database was available, so this report does not claim those environments were verified.

## 2. Audit method and confidence

Reviewed the active app entry points and route composition in `src/`, `frontend/`, and `mobile/`; Android navigation, feature screens, API clients, local persistence, polling loops, and responsive/accessibility tests; and backend auth middleware, community/LMS route mounting, Live Studio service behavior, and relevant Prisma models.

Finding labels:

- **Confirmed:** directly supported by the current source or recorded test result.
- **Conditional:** a real risk whose user-visible impact depends on deployment configuration or runtime conditions.
- **Unverified:** requires a live service, database, signed build, or device that was not available.
- **Intentional contract:** behavior explicitly encoded in service logic/tests; it is documented so it is not mistaken for an accidental defect.

Priority guide: **P1** blocks safe/reliable release or a core parity requirement; **P2** materially limits a feature or creates a significant reliability/UX risk; **P3** improvement with narrower impact.

## 3. Findings

### TAI-01 — Physical Android release can target the emulator-only API address

**Priority:** P1 · **Status:** Conditional, source-confirmed

`mobile/src/api/http.ts` resolves a configured `EXPO_PUBLIC_API_URL` first and uses the Expo Metro LAN host when present. Otherwise, Android falls back to `http://10.0.2.2:5000/api`. `10.0.2.2` is the Android emulator's host-machine alias; it is not a reachable backend address for an installed APK on a physical phone. `mobile/app.config.js` also disables cleartext HTTP in production and documents that a release URL must be HTTPS. If the release build omits the public API URL, sign-in and all API-backed panels will fail with the generic network error shown in the earlier Android screenshot.

The configured URL now normalizes to an `/api` base, preserves an existing `/api`, and trims a trailing slash. The mobile README examples now include `/api`. Production EAS builds fail config validation unless `EXPO_PUBLIC_API_URL` is an absolute HTTPS URL. Physical-device reachability still depends on using a host reachable from the device; the emulator fallback remains development-only guidance and was not exercised on a phone.

**Completed in this pass:** normalized host-only, `/api`, and trailing-slash inputs; added unit coverage; updated mobile setup examples; and added production EAS HTTPS validation. **Remaining:** verify the deployed URL, health/login/authenticated flow from a physical device and confirm release environment configuration.

### TAI-02 — Bearer token is stored in AsyncStorage and persistence failures are hidden

**Priority:** P1 · **Status:** Fixed in this pass (code and automated tests); device restart verification outstanding

`mobile/src/api/session.ts` now stores the bearer token in Expo SecureStore (`expo-secure-store`), which maps to Android Keystore-backed encrypted storage. Web and test environments fall back to AsyncStorage through a small credential adapter. A legacy `thinkz_auth_token` AsyncStorage value is read once, migrated to SecureStore, and deleted. If the secure write fails, sign-in rolls back and surfaces the persistence failure instead of publishing a session that will not survive restart. Sign-out clears both stores.

**Evidence:** secure-session tests, Jest SecureStore mock, and `app.config.js` plugin registration. **Remaining:** verify sign-in, process restart, token expiry, and sign-out on a physical Android build.

### TAI-03 — Push registration is not revoked on sign-out

**Priority:** P1 · **Status:** Fixed in this pass (code and automated tests); remote delivery still unverified

The backend now exposes authenticated `DELETE /api/notifications/device-token`, scoped to the caller's own token. `mobile/src/features/notifications/pushRegistration.ts` remembers the last registered `thinkz_push_token` and calls revocation before the session is cleared; `session.ts` exposes a cleanup registration seam so sign-out does not import notification modules and create a circular dependency. Revocation failures are non-fatal and do not block local sign-out. Tests cover logout revocation and account switching.

**Remaining:** no Expo push delivery worker/sender was found in the backend, so end-to-end remote delivery remains unimplemented/unverified. Verify the delete route against the production database with a real device token.

### TAI-04 — Website and Android community data do not currently share one source of truth

**Priority:** P1 · **Status:** Confirmed

The root website (`src/main.jsx` and its community API) is a separate hash-routed community app backed by browser `localStorage` and seeded data. Android community screens use the existing Express community routes and production PostgreSQL-backed router. The same forum action can therefore affect different data depending on platform; posts, replies, bookmarks, notifications, and profile state are not guaranteed to synchronize between the root site and Android. This conflicts with the request to preserve the website's community APIs/database behavior consistently on Android.

**Recommended fix:** choose and document the canonical production website entry point, then connect its community client to the same existing authenticated backend endpoints used by Android. Keep test/demo fixtures isolated from production. Verify create/edit/reply/vote/bookmark/notification/moderation workflows on web and Android against the same dedicated PostgreSQL test records.

### TAI-05 — The active LMS website is not a complete parity reference yet

**Priority:** P1 · **Status:** Confirmed

`frontend/src/App.jsx` renders learner, instructor, and TA role placeholders for the active routes. There are richer source pages and route trees, but they are not currently equivalent to a working live role portal. In addition, `frontend/src/main.jsx` already mounts a `BrowserRouter`, while `frontend/src/routes/AppRoutes.jsx` mounts another `BrowserRouter`; that route tree will fail if rendered under the existing root router. Several source APIs (`rolesApi.js`, `liveSessionApi.js`, and `checkoutApi.js`) are explicitly configured with `USE_MOCK = true`, and the referenced `/api/live-classes` route is not registered in the main backend app.

The web Socket.IO forum/studio clients also fall back to mock socket implementations after a connection timeout; production must not present those simulated events as real backend state.

**Impact:** the audit can inventory source screens, but it cannot reliably assert runtime website parity for learner/staff flows until the active route composition and mock-backed contracts are resolved.

**Recommended fix:** establish the intended active website route graph, remove the nested router, mount only the routes intended for users, and replace production mock paths with the existing backend contracts. Gate socket mocks behind an explicit development/test option; in production show a disconnected state and retry against the live service. Treat the role placeholders and any unmounted pages as missing functionality, not completed features.

### TAI-06 — Live Studio uses a fixed demo session and can create a database row on read/join

**Priority:** P2 · **Status:** Fixed in this pass (code and backend tests); live-data verification outstanding

The mobile screens no longer reference `demo-live-session`. `LiveStudioScreen` lists real sessions, requires a selection, and offers instructor/admin creation; `InstructorControlsScreen` uses the same session list. Backend reads and joins of unknown session IDs now return `NOT_FOUND`/404 instead of materializing a synthetic demo row, and session creation is an explicit instructor/admin operation with conflict detection for duplicate IDs. Session status and instructor controls are saved on the server.

**Evidence:** `liveStudioService.test.js` covers unknown-read/join, explicit list/create, and duplicate-ID rejection; mobile Live Studio screen tests cover empty/selected session flows. **Remaining:** exercise with real scheduled sessions from the deployed database and verify authorization denials per role.

### TAI-07 — Live Studio does not render the actual video room

**Priority:** P2 · **Status:** Fixed in this pass (code and tests); configured Jitsi/device verification outstanding

`mobile/src/components/live/JitsiRoom.tsx` builds a Jitsi meeting URL from the backend response, requests the short-lived room JWT for the selected session, asks for camera/microphone permission at runtime, and mounts the room in a WebView. The app bearer token is never passed into the embedded page. The backend now requires an existing session before issuing a token, returns the configured `domain`/`appId`, and fails closed with 503 when `JITSI_DOMAIN`, `JITSI_APP_ID`, or `JITSI_JWT_SECRET` is absent. Tests cover token configuration, unknown sessions, JWT claims, URL construction, permission denial, and error states.

**Remaining:** connect to a configured test Jitsi deployment and verify join/leave, permission prompts, audio routing, and background behavior on a physical Android device.

### TAI-08 — Wishlist is account-isolated locally but does not sync across devices

**Priority:** P2 · **Status:** Confirmed

`mobile/src/features/wishlist/wishlistStore.ts` now stores IDs under a per-account AsyncStorage key and activates/hydrates that list when identity changes. A pending-write queue and mutation-version guard prevent account switching or a save during hydration from overwriting the in-memory list. Explore course cards expose a save action and update the tab count. There is no existing backend wishlist endpoint, so saved items remain device-local and do not synchronize across devices.

**Completed in this pass:** account-scoped local storage, identity-change rehydration, save-during-hydration and account-switch tests. **Remaining:** if product requirements include cross-device persistence, add one wishlist resource through the existing backend service architecture and verify restart and deleted-course behavior.

### TAI-09 — Polling loops are now bounded and guarded

**Priority:** P2 · **Status:** Fixed in this pass (code and automated tests); runtime behavior on device outstanding

The mobile app contains these repeating loops/timers:

| Location | Cadence / behavior | Assessment |
| --- | --- | --- |
| `mobile/src/hooks/useProgressSync.ts` | 15-second trigger; drains the queue in batches of up to 100 | Has a busy guard, session/user guard, error break, and timer cleanup. The drain is now capped at 10 batches, and a batch that does not change the serialized queue stops the drain with a visible retry status. Tests cover unchanged queues and a 1,500-row queue. |
| `mobile/src/hooks/useAssessmentResults.ts` | Refreshes with exponential backoff from 2 s to 30 s, maximum 12 attempts | Timer cleanup exists; stale responses are ignored. Automatic polling now stops after the attempt cap, exposes `polling`, and `ResultsScreen` offers a manual “Check now” action. Tests cover backoff and cap behavior. |
| `mobile/src/screens/staff/LiveStudioScreen.tsx` | Every 8 seconds: guarded refresh of session, messages, polls, and breakouts | Timer cleanup and an in-flight guard prevent overlapping requests; 404 clears the stale selected session. Chat send and other writes are user-triggered rather than repeated. Prefer the existing socket channel when the server emits live updates. |
| `mobile/src/lms/useAssessment.ts` | 30-second save and 1-second assessment countdown | Intervals are cleaned up. This is expected behavior; verify background/resume timer semantics and duplicate-submit handling on device. |
| `frontend/src/pages/learner/StudentAssessmentTaker.jsx` | 1-second assessment countdown / auto-submit | The interval is cleared on expiry and in effect cleanup. The parent learner route is currently a placeholder, so this source flow is not live from the active LMS frontend. |
| `frontend/src/pages/learner/live-class/Liveclassjoin.jsx` | 1-second clock for class status/countdown | Cleanup exists. Its default class and default join callback are mock values, so it is not evidence of a live scheduled class workflow. |
| `frontend/src/services/websocket.js`, `forumSocketClient.js` | 15-second mock heartbeat after real socket connection timeout | Heartbeat timer is cleared by `disconnect`; the risk is functional, not a leaked timer: fallback mock mode can look like a connected real-time subsystem. Gate it to development/test. |

The other identified `while` loops are finite global-regex/mention parsing loops in the root and frontend community mention parsers or the queue-drain loop above; their global regex index is reset after scanning. No additional unbounded loop was confirmed by this source scan. This is a static scan, not a formal proof that every runtime loop is safe.

**Recommended follow-up:** verify background/resume and offline behavior on a device, and switch Live Studio to server-pushed events if/when the socket contract is enabled in Android.

### TAI-10 — Progress conflict behavior deliberately discards this device's newer unsynced snapshot

**Priority:** P2 · **Status:** Intentional contract; user-impacting tradeoff

The LMS API documentation and backend service define server-wins progress conflicts. In `mobile/src/lms/storage.ts`, `acknowledgeProgress` drops a conflicted row, even when playback updated that same row after the request was sent. `mobile/src/tests/lms/sync-lifecycle.test.tsx` explicitly asserts that the canonical server progress is shown and the newer local row is removed. This is internally consistent with the existing contract, not an accidental defect, but it can discard locally watched seconds after an offline/concurrent update.

**Recommended action:** retain server-wins only if this is the accepted product rule and explain it in the progress-sync UI. If local progress should never regress, design a server-supported merge rule (for example max watched seconds with server-side duration/completion validation) and change backend contract and tests together; do not silently change only the client.

### TAI-11 — Learner theme and tab-icon fixes are code-verified, not device-verified

**Priority:** P2 · **Status:** Confirmed code/UI requirement mismatch

The compact theme control remains in the Dashboard header's right side with a transparent backing. Profile now labels the selector “Theme” and its accessibility name no longer contains “Appearance.” The My Learning tab now uses an outline book instead of a circle-play icon; the five tab items retain equal flex sizing and their minimum touch target. Static dark-only styles in the shared LMS UI, analytics, staff screens, and onboarding overlay now use the active theme palette. A regression test confirms LMS surface colors switch with the selected theme.

The supplied physical screenshot was not available to compare against a new device capture. Exact placement, icon proportions, TalkBack contrast, font scaling, and the broader requested e-commerce icon treatment remain device/visual review items. The dark icon backing and light-mode color behavior are source-confirmed only.

**Completed in this pass:** dynamic theme styling, My Learning book icon, visible theme label and accessibility label cleanup, and theme-switch regression coverage. **Remaining:** capture and review a physical Android screenshot at 375/390 dp and validate contrast/touch targets with TalkBack.

### TAI-12 — Mobile staff/admin coverage remains a subset of website source features

**Priority:** P2 · **Status:** Confirmed from route/screen inventory

Android has staff tools including grading, attendance, controls, Live Studio, analytics, and an RBAC matrix. It does not provide native equivalents for the full admin user/course/batch CRUD, instructor module/assignment authoring, instructor certificate/video-preview tools, or a real scheduled live-session manager that exist in web source. Some are not active in the current web route graph (see TAI-05), so their exact parity status is also blocked by the web app state.

**Recommended fix:** define the role/feature matrix for Android explicitly, then implement only the intended mobile workflows against the existing LMS APIs. Prioritize course/lesson management and assignment/submission flows if staff are expected to manage them from phones. Add role-denial and end-to-end persistence tests for each screen.

### TAI-13 — Production checkout/payment is not a complete end-to-end path

**Priority:** P1 for paid enrollment · **Status:** Confirmed limitation in project documentation

The mobile app contains checkout and result screens, but the existing project documentation says production payment endpoints remain fail-closed until a provider and durable provider-backed ledger are configured. The website's legacy checkout client is mock-configured and its route is not active in the LMS app. A working UI must not be treated as a functioning purchase flow.

**Recommended fix:** select/configure the production payment provider and durable idempotent payment ledger, connect both clients to the same endpoint, and verify payment authorization, webhook reconciliation, enrollment unlock, failure, retry, and duplicate callback behavior. Do not enable production purchase controls until that flow passes.

### TAI-14 — PostgreSQL API/data-path acceptance remains unverified

**Priority:** P1 release verification gap · **Status:** Unverified

The prior report records passing route smoke tests in in-memory community mode. PostgreSQL community route smoke tests used placeholder IDs such as `u1` and received `403 Invalid account identity`; the dedicated `LMS_TEST_DATABASE_URL` was absent, so two PostgreSQL integration tests skipped. That result neither proves a production DB defect nor verifies PostgreSQL behavior. No real DB read/write journey was performed for this audit.

**Recommended fix:** provision an isolated disposable PostgreSQL database with valid numeric LMS users and linked community identities, run migrations on that database, and verify login, role denial, course/enrollment access, progress sync, forum post/reply/bookmark/notification persistence, attendance/grading where intended, and account isolation. Never run integration mutations against production.

### TAI-15 — Native Android build and device acceptance are outstanding

**Priority:** P1 release verification gap · **Status:** Build environment configured; APK build failed on environment TLS/network issue; device acceptance still unverified

The recorded Android check is `expo export --platform android`, which verifies JS/Hermes bundling. A later environment has Android Studio JDK 25, Android SDK 37, build-tools 36/37, and ADB, but no connected device. `expo prebuild --platform android` completed and a debug Gradle build was attempted; Gradle installed the required NDK 27.1.12297006, Build-Tools 36/37, and Platform 37. The build failed with TLS handshake errors when resolving `kotlin-stdlib-jdk7:1.8.22` from Maven Central and JitPack, which is an environment network restriction, not a code defect. No APK installation, Android back-button workflow, keyboard/inset check, remote-push build check, screenshot comparison, or physical performance/accessibility validation has been completed.

**Recommended fix:** resolve the environment's TLS/Maven connectivity (or use a corporate proxy/mirror), finish the debug build, install on a supported emulator and physical Android device, and record version/build ID, device/API level, API base URL, role used, and screenshots. Verify sign-in, theme, five tabs at 375/390 dp widths, course resume/progress, forum, notifications, offline recovery, deep links, logout/push cleanup, and staff restrictions.

### TAI-16 — Frontend lint acceptance is currently failing

**Priority:** P2 · **Status:** Confirmed in prior verification results

The prior LMS frontend lint run reported 319 errors and 19 warnings, although the frontend production build passed. Mobile lint passed with 0 errors and 56 warnings. The failures are outside the Android TypeScript result but prevent a clean repository-wide lint claim and can hide web parity regressions.

**Recommended fix:** split lint output by active/legacy route and fix the active app first; document any intentionally deferred legacy folders. Preserve a clean lint command in CI for all shipped web/mobile code.

### TAI-17 — Live Studio create/manage actions lacked backend role enforcement

**Priority:** P1 for authorization · **Status:** Fixed in this pass (code and automated tests)

The Live Studio router authenticated every caller but originally allowed any signed-in learner to create polls, create breakout rooms, delete any message, and rely only on controller checks for session creation/status. The controller now restricts poll and breakout creation to Instructor/Admin, keeps session create/status restricted to Instructor/Admin, and message deletion requires the author or an Instructor/Admin moderator. Tests cover learner denials, instructor success, author deletion, cross-learner denial, moderator deletion, and missing-message 404.

**Remaining:** verify the same role matrix against real LMS tokens and database records; the website's intended TA/moderation permissions should be confirmed before broadening access.

## 4. Android feature inventory

| User-facing area | Current Android implementation | Audit status |
| --- | --- | --- |
| Home dashboard | Course/discovery dashboard, enrollment summary, search, right-header compact theme icon, learner tabs | Present; API URL/device integration and final screenshot verification outstanding |
| Five bottom tabs | Home, My Learning, Explore, Wishlist, Profile; equal-flex layout and accessibility tab roles | Present; My Learning book icon and theme label fixes are code/test verified (TAI-11) |
| My Learning / course progress | Enrollment list, progress display, search/filter, resume mapping, player and progress sync | Implemented in source; conflict policy is server-wins; DB/device workflow unverified |
| Explore/search | Course catalogue and global search use backend API clients | Present; live service/database and physical network not verified |
| Wishlist | Account-scoped local course IDs persisted and displayed in Wishlist; save controls also appear in Explore | Account-isolated on one device; cross-device sync remains absent (TAI-08) |
| Profile/account | Learner profile details, sign-out, community shortcut, theme selection | Present; visible theme row is labeled “Theme”; credentials use SecureStore and sign-out revokes push tokens |
| Community | Forum feed/categories/create/detail/replies/bookmarks/notifications/moderation screens | Integrated to existing backend contract in Android; website data parity not present (TAI-04); PostgreSQL runtime unverified |
| Light/dark theme | Global ThemeProvider; compact home control; Profile theme options; dynamic styles in LMS/staff/onboarding | Palette switches in code and regression test; device contrast/screenshot checks not done (TAI-11) |
| Course/video player | Course detail and lesson player paths use existing LMS routes | Present in source; actual playback/content availability must be verified against production data |
| Deep links | Auth-aware route parsing and resume-after-login logic | Tests recorded as passing; installed-device intent handling not verified |
| Notifications | In-app preferences/notifications, Expo push-token registration, sign-out revocation | In-app UI/API and revocation present; backend remote-push sender was not found, so delivery remains unimplemented/unverified |
| Live classes | Session list/selection/create, chat, polls, breakout rooms, instructor controls, Jitsi WebView | Implemented against the existing studio API with short-lived JWT; configured Jitsi/device verification outstanding (TAI-06/07) |
| Admin/instructor/TA | Selected controls, grading, attendance, analytics/RBAC | Partial; multiple web-source workflows have no native equivalent (TAI-12) |
| Checkout | Checkout and payment result UI | UI present; production payment integration not ready (TAI-13) |

## 5. Earlier Android acceptance checklist

| Previously requested item | Current evidence/status |
| --- | --- |
| Five bottom tabs, equal panel sizing | Implemented as five equal-flex tabs with a common minimum target. Layout assertions exist; physical screenshot comparison remains outstanding. |
| Home dashboard reference layout | Dashboard structure and top-right compact theme control exist. Exact visual match to the supplied phone screenshot is not confirmed without a device screenshot. |
| My Learning dark reference | My Learning uses the app-wide theme, so it renders dark when dark mode is selected. It is not independently locked to dark mode; screenshot match is unverified. |
| Explore and Search | Explore is a bottom-tab destination and course/global search use API-backed clients. Live Android API verification is outstanding. |
| Wishlist and Profile | Present; wishlist is account-isolated locally but has no cross-device API (TAI-08). Profile shows learner details and theme options. |
| Community shortcut from My Learning | Present and routes to the existing Forum screens; cross-platform dataset sharing is absent (TAI-04). |
| Light/dark theme applies across screens | Active theme palette now reaches LMS/staff/onboarding modules; regression test covers a shared LMS surface. Physical contrast/device review remains. |
| Progress and Resume Learning | Implemented with local queue and existing LMS progress/player endpoints. Server-wins conflict policy is intentional; DB/device verification remains outstanding. |
| Deep links | Auth-aware parsing/resume logic has passing automated coverage; installed Android intent/back-stack verification remains outstanding. |
| My Learning icon no longer uses a video symbol | Met in source: replaced circle-play with a book outline; physical screenshot review remains. |
| Dashboard theme button at the marked top-right position | Code places the compact control in the Dashboard header's right slot. Exact placement and icon appearance have not been confirmed in a physical screenshot. |
| Remove visible word “Appearance” | Met in user-facing Profile and theme-control labels; section now says “Theme.” Internal component/test identifiers retain the legacy name. |
| Android icon backing removed / light-mode symbol purple | Android compact style is transparent and switches the symbol to purple in light mode. Code review only; screenshot verification remains outstanding. |
| TypeScript, lint, Jest | Current mobile TypeScript passed; lint passed with 0 errors / 53 warnings; Jest passed 84 suites / 731 tests. Web lint remains a prior failure (TAI-16). |
| Android export, APK/AAB, physical screenshot | Current JS/Hermes export passed (1,190 modules, 3.1 MB); native debug build attempted with the installed Android Studio JDK/SDK; no physical screenshot because no device is attached (TAI-15). |
| Secure credentials and sign-out cleanup | SecureStore migration, rollback-on-write-failure, push-token revocation, and cleanup tests are implemented (TAI-02/03). |
| Live Studio sessions and video | Explicit session list/create/select, 404 for unknown IDs, server-saved controls, Jitsi token and WebView integration with permission/error states; backend and mobile tests pass (TAI-06/07). |
| TEST_REPORT updated | Root and mobile reports contain recorded verification results. |
| GitHub commit/push verification | **Not verified:** the repository working tree currently contains modified and untracked files; no clean commit/push is evidenced by this audit. |

## 6. Backend/API and security review

- Android has separate client paths for the LMS bearer-token API and the community REST API; the community router is mounted from the main backend and switches to PostgreSQL mode in production or when `COMMUNITY_STORAGE=postgres` is set.
- Backend role middleware validates bearer identity/role on protected LMS and community operations. Category-management routes in the PostgreSQL community router apply moderator protection. Client-side role checks improve UX but must not be treated as authorization.
- No duplicate backend API was identified as necessary for the current mobile learning/community paths. Wishlist persistence and cross-device synchronization still lack a shared resource in the audited API surfaces; Live Studio now has explicit session list/create routes rather than implicit creation.
- The notification module now supports authenticated `DELETE /api/notifications/device-token` scoped to the caller. The Jitsi token route requires an existing session and fails closed when Jitsi environment variables are missing.
- The API client reports network failures with a generic “Network error — is the backend running?” message. For Android, first validate the compiled API URL, phone/backend network reachability, Android cleartext policy, server health, and auth response before interpreting the message as a backend crash.
- The Expo Go limitation for remote push is intentional and documented: push registration is skipped in Expo Go and web. Remote push requires a development or standalone build, which was not tested here.
- The legacy category router in the non-PostgreSQL in-memory community path does not itself attach moderator middleware to its write routes. Production PostgreSQL routes do enforce moderator checks. Keep the nonproduction route isolated and add route-level authorization tests so development mode does not normalize unsafe behavior.

## 7. Responsive layout and accessibility

The existing mobile suite includes 375 px and 390 px responsive assertions and tests for tab roles, accessible names, progress controls, and selected states. The bottom tab elements use equal flex widths and the shared minimum target; the My Learning “Browse” header container is 44 px tall. These are code/test assertions, not TalkBack checks. Touch target geometry, contrast ratios, font scaling, keyboard behavior, and safe-area handling still require device verification. The dark-theme black theme glyph is a specific contrast concern (TAI-11).

## 8. Verification evidence and limitations

Mobile checks below were run on 2026-11-08. Web/backend results remain the prior recorded results from 2026-11-05 and were not rerun in this pass.

| Check | Recorded result | What it does not establish |
| --- | --- | --- |
| Mobile TypeScript | Passed, 0 errors | Runtime API/database/device behavior |
| Mobile Jest | 84 suites / 731 tests passed | Physical UI rendering, production data, or untested routes |
| Mobile ESLint | Passed, 0 errors, 53 warnings | A clean warning-free codebase |
| Expo config | Passed; production EAS guard accepts HTTPS, rejects missing URLs, and disables cleartext for production; SecureStore plugin and camera/audio permissions registered | Deployed endpoint reachability |
| Android Expo export | Passed; Hermes JS bundle emitted (1,190 modules, 3.1 MB) | APK/AAB signing, install, or device launch |
| Backend unit tests | 67 passed / 0 failed / 1 skipped | Skipped auth E2E and production DB behavior |
| Live Studio backend tests | 8 tests passed: session lifecycle + Jitsi configured/not-found/token | Deployed session data and role denials |
| Live Studio controller permission tests | 6 tests passed: Instructor/Admin create/manage enforcement | Deployed role checks with real LMS tokens |
| Jitsi controller tests | 3 passed: unconfigured 503, unknown-session 404, signed token claims | Real Jitsi deployment/permission/dependency behavior |
| Root community tests | 10 files / 111 tests passed with installed Vitest and temporary config | Cross-platform shared persistence |
| LMS frontend production build | Passed | Correct active routes or runtime navigation |
| LMS frontend ESLint | Failed: 319 errors / 19 warnings | Android lint; errors are in the web package |
| LMS backend suite | 166 passed | Live DB schema/data and Android end-to-end flow |
| Community route smoke | 15 passed in test-only in-memory mode | PostgreSQL identity/persistence |
| PostgreSQL integration | 2 skipped; `LMS_TEST_DATABASE_URL` absent | DB/API acceptance |
| APK/AAB and physical device | Native debug build attempted with Android Studio JDK 25 / Android SDK 37 / NDK 27; failed on TLS handshake resolving dependencies (environment network restriction); ADB reports no devices | Install, launch, and physical UI behavior |
| GitHub commit/push | Not verified; working tree has uncommitted changes | Remote delivery and CI status |

## 9. Prioritized remediation plan

1. **Release connectivity and credential safety — credential work completed:** enforce HTTPS API URL configuration for physical Android releases; credentials now use SecureStore with legacy migration and rollback; push registration is revoked on sign-out. Remaining: verify restart/expiry/revocation on a device.
2. **Choose shared production website contracts:** decide which web app is canonical, make its community routes use the same backend as Android, repair active web routing, and remove production mock APIs/placeholders.
3. **Live Studio — completed in code:** sessions are explicitly listed/selected/created, reads and joins no longer create demo rows, and the Jitsi room renders with a short-lived token. Remaining: verify with a configured Jitsi deployment and real scheduled sessions on a device.
4. **Correct local state boundaries:** account-scoped wishlist is implemented; server-wins progress conflicts are documented and tested. Cross-device wishlist synchronization remains absent.
5. **Close Android feature gaps:** decide whether admin/instructor/TA course authoring, assessment assignment, video preview, and session management are mobile requirements; implement the accepted subset against existing APIs.
6. **Database and security acceptance:** run the core journeys against a fresh isolated PostgreSQL database with valid accounts/roles, verify data ownership and all RBAC denials, and preserve logs/test evidence.
7. **Native acceptance:** install the built APK on an emulator/physical device; test networking, 375/390 dp layouts, accessibility/TalkBack, deep links/back navigation, offline progress, notifications, themes, Jitsi permissions, and screenshots.
8. **CI quality gate:** fix active web lint errors, review mobile warnings, and add regression gates for the release configuration and the newly identified state/security scenarios.

## 10. Completion decision

The Android implementation is materially more complete than the active LMS website learner routes and has broad automated unit/UI coverage. This pass resolved the secure credential storage, push-token revocation, Live Studio demo-session/video-room, and unbounded-polling findings. It is **not ready to be described as fully website-equivalent or release-verified**. The most important unresolved acceptance blockers are physical-device API/Jitsi verification, shared website/Android community data, actual PostgreSQL integration evidence, payment provider readiness for paid enrollment, remote push delivery, and incomplete staff/admin parity.

This audit is thorough for the code paths and evidence listed above, but “every runtime bug” cannot be guaranteed from static review. A follow-up device/database run may expose additional defects; any new issue should be appended here with reproduction steps and environment details.
