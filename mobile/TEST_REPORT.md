# Mobile app (React Native) — module test report

Owner: Manjunath
Branch: `manjunath-new-feature`
Date: 2026-09-30

## Scope

Five learner-facing screens built as an Expo app in `mobile/`, sharing one
swappable `LearningApiClient` and a component/hook library:

| Screen | Route | Notes |
| --- | --- | --- |
| Learner Dashboard | `/learner/dashboard` | Enrolled-catalog join, progress bars, resume entry point. |
| My Courses | `/learner/courses` | Search, status filter tabs, course grid. |
| Course Detail | `/learner/courses/:id` | Enrollment CTA, module accordion, deep-linkable `moduleId`. |
| Global Search | `/search` | 300 ms debounce, recent searches, per-type result cache. |
| Forum Home | `/forum` | Category chips, tag filter, sort dropdown, infinite scroll, thread composer. |

Deep links resolve through `thinkzai://` and `https://app.thinkzai.com`.

## Verified

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | passed, 0 errors |
| Lint | `npm run lint` | passed, 0 errors, 0 warnings |
| Tests | `npm test` | **223 passed, 0 failed** across 21 suites |
| Expo health | `npx expo-doctor@latest` | **17/17 checks passed** |
| App config | `npx expo config --type public` | resolved clean |
| Release bundle | `npx expo export --platform android` | bundled 757 modules in 16.4 s, no resolution errors |
| Test hygiene | console scan of the Jest run | 0 `act()` warnings, 0 `console.error`, 0 React warnings |
| Browser E2E | `node scripts/serve-web-build.js 8099` + `node scripts/verify-app.mjs` | **28/28 checks passed** across all five screens |
| Demo walkthroughs | `node scripts/record-walkthroughs.mjs` | 5 WebM walkthroughs recorded, one per screen |
| Walkthrough integrity | `node scripts/verify-walkthroughs.mjs` | **5/5 decodable**, 53.9 s total, 8/8 distinct frames each |

### Test breakdown

| Suite | Tests |
| --- | --- |
| `tests/smoke.test.ts` | 1 |
| `tests/hooks/useDebouncedValue.test.ts` | 6 |
| `tests/utils/highlight.test.ts` | 11 |
| `tests/utils/responsive.test.ts` | 8 |
| `tests/dashboard/LearnerDashboardScreen.test.tsx` | 10 |
| `tests/dashboard/CourseCard.test.tsx` | 10 |
| `tests/dashboard/ProgressBar.test.tsx` | 8 |
| `tests/myCourses/MyCoursesScreen.test.tsx` | 11 |
| `tests/myCourses/useCourseSearch.test.tsx` | 9 |
| `tests/myCourses/CourseGrid.test.tsx` | 6 |
| `tests/myCourses/FilterTabs.test.tsx` | 5 |
| `tests/myCourses/SearchBar.test.tsx` | 7 |
| `tests/course/CourseDetailScreen.test.tsx` | 12 |
| `tests/course/ModuleAccordion.test.tsx` | 8 |
| `tests/course/EnrollButton.test.tsx` | 6 |
| `tests/search/GlobalSearchScreen.test.tsx` | 19 |
| `tests/search/useGlobalSearch.test.tsx` | 8 |
| `tests/search/useRecentSearches.test.tsx` | 10 |
| `tests/search/searchComponents.test.tsx` | 16 |
| `tests/forum/ForumHomeScreen.test.tsx` | 18 |
| `tests/forum/forumUnits.test.tsx` | 34 |

### Browser end-to-end run

`scripts/verify-app.mjs` drives the real Expo web export in Chromium at
390x844 against `http://localhost:8099`, using the deterministic mock client.
It covers scrolling, filtering, deep links, the accordion, enrollment, search
debounce/recents, and the forum composer. Results land in
`demo-artifacts/verification-report.json` with 14 screenshots.

| Signal | Result |
| --- | --- |
| Checks | 28 passed, 0 failed |
| Console errors / page errors | 0 / 0 |
| Console warnings | 0 (5 expected web-only `useNativeDriver` warnings are whitelisted) |
| Frame timing | avg 16.76 ms, p95 16.9 ms, 0 frames over 50 ms, 59.7 effective FPS |

The `useNativeDriver` warnings are inherent to running an animation that is
correct on device inside a web export; `LoadingState` was left as-is rather
than degraded to silence them.

### Demo walkthroughs

`scripts/record-walkthroughs.mjs` drives the same export through each screen's
own story and records it as WebM — one video per screen, in
`demo-artifacts/walkthroughs/`. The dashboard scrolls its list, My Courses types
a query and switches all three filter tabs, Course Detail expands modules,
Global Search debounces a query then commits and replays a recent, and Forum
Home paginates, sorts, filters and posts a new thread through the composer.

| Screen | Route | Duration | Size | Console errors |
| --- | --- | --- | --- | --- |
| Learner Dashboard | `/learner/dashboard` | 5.4 s | 292 KB | 0 |
| My Courses | `/learner/courses` | 8.9 s | 404 KB | 0 |
| Course Detail | `/learner/courses/course-1?moduleId=mod-0-1` | 6.7 s | 303 KB | 0 |
| Global Search | `/search` | 10.8 s | 261 KB | 0 |
| Forum Home | `/forum` | 22.2 s | 1032 KB | 0 |

`scripts/verify-walkthroughs.mjs` then decodes each file in Chromium and checks
the EBML header, decoded duration, resolution and frame variety — a file can
have bytes on disk and still be an unplayable or frozen clip, so file size is
not treated as proof. All five report a valid 390x844 stream with 8 of 8
sampled frames distinct.

## Fixed

Product defects found while writing the tests:

1. **Pull-to-refresh and post-a-thread never refetched.** `useForumThreads`
   signalled a reload with `setPage(1)`, which React treats as a no-op when the
   list is already on page 1 — so neither `refresh()` nor `createThread()`
   issued a request. Both now bump a `reloadNonce` that participates in the
   fetch effect's dependencies (`src/hooks/useForumThreads.ts`).
2. **Rapid scroll events over-advanced pagination.** `loadMore()` relied on an
   in-flight flag that the fetch effect only set after React re-rendered, so
   several scroll events landing in one tick each queued their own page
   increment (page jumped 1 → 4). `loadMore()` now claims the slot
   synchronously before calling `setPage`.
3. **The forum composer stayed disabled forever.** `CreatePostModal` only
   adopted a category through its own fetch, so with categories already loaded
   by the screen the modal sat on `categoryId === ''` and could never submit.
   It now adopts the first available category as soon as one arrives.
4. **Catalog and enrollment courses collided.** The fixture factory emitted the
   same ids for both sets, producing duplicate React keys on the dashboard.
   `createCourseFactory(seed, idPrefix)` now namespaces them (`course-N` vs
   `catalog-N`).
5. **Every global-search query matched.** Mock result subtitles echoed the query
   back, so the relevance check always succeeded. Subtitles are now
   query-independent and matching runs against titles plus `SEARCH_KEYWORDS`.

Environment fixes:

6. `typescript` pinned to `~5.3.3` and the invalid `newArchEnabled` key removed
   from `app.json` — `expo-doctor` was failing both checks.
7. ESLint was declared in `package.json` but not installed or configured, so
   `npm run lint` could never run. Added `eslint@^8.57.0` with
   `eslint-config-expo@~7.1.2` and a `.eslintrc.js` declaring the Node and Jest
   environments for tooling and test files.

## Definition of Done

- [x] All five screens implemented with loading, error, empty, refresh,
      pagination and deep-link states.
- [x] Constants pinned to spec: `SEARCH_DEBOUNCE_MS = 300`,
      `FORUM_PAGE_SIZE = 15`, `INFINITE_SCROLL_THRESHOLD = 0.8`.
- [x] Tests written and passing (223/223).
- [x] Zero `act()` warnings, `console.error` output and React warnings in tests.
- [x] `tsc --noEmit`, ESLint, `expo-doctor` and `expo config` all clean.
- [x] Metro release bundle builds for a device target.
- [x] Browser end-to-end pass over all five screens in the web export.
- [x] **Demo recordings** for the five screen walkthroughs — 5 WebM clips,
      integrity-checked as decodable and non-static.
- [ ] **On-device verification.** Frame-drop profiling and touch/scroll checks
      on a real Android or iOS target. The Chromium run above gives a frame
      baseline only; it does not replace a device pass.

The on-device pass is still outstanding and cannot be closed on this machine.
Re-checked 2026-10-01: `adb`, `java`, `javac`, `gradle`, `emulator`,
`watchman` and `xcodebuild` are all absent, and `ANDROID_HOME`,
`ANDROID_SDK_ROOT` and `JAVA_HOME` are unset, so no device, emulator or
simulator can be launched from here. Run on a machine with the toolchain
installed:

```
npx expo start                 # then press a / i
# Android: adb shell dumpsys gfxinfo com.thinkzai.mobile   (frame stats)
```

## Blocked on other teams

- **OpenAPI contract** — no schema was available, so the client is defined by
  local TypeScript interfaces and the deterministic mock in
  `src/api/mockClient.ts`. Swapping in a generated client is a single
  `LearningApiClient` implementation.
- **Auth / JWT** — no auth service contract; the app runs unauthenticated
  against the mock.
- **WebSocket schema** — no realtime spec, so Forum Home refreshes over HTTP
  rather than subscribing to thread events.
- **Design tokens** — no official token set; `src/theme/tokens.ts` holds local
  values pending the design system.