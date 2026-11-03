# Thinkz AI Learner App

Thinkz AI is an Expo React Native Android learner app backed by the existing
Thinkz LMS API and PostgreSQL database. It includes the five learner tabs
(Home, Explore/Search, My Learning, Wishlist, Profile), course and lesson
progress, resume links, app-wide light/dark themes, and the community forum.

## Local run

1. Start PostgreSQL and configure `backend/.env` with `DATABASE_URL` and a
   strong `JWT_SECRET`.
2. In `backend/`, run `npx prisma generate`. For an already-provisioned
   PostgreSQL database, apply the additive LMS runtime schema with:
   `npx prisma db execute --file ./lms/migration.sql --schema ./prisma/schema.prisma`.
   This SQL is safe to rerun and preserves existing records. Then run
   `npm run seed:community` and `npm start`.
3. The checked-in Prisma history currently mixes a SQLite migration lock with a
   PostgreSQL schema; reconcile that history before running Prisma deploy
   against a new database. See [TEST_REPORT.md](TEST_REPORT.md).
4. Community REST routes use PostgreSQL automatically in production. Set
   `COMMUNITY_STORAGE=postgres` to exercise that live path during development.
5. Start the app from `mobile/` with `npm start`. The Android emulator uses
   `http://10.0.2.2:5000/api`; for a physical device, set
   `EXPO_PUBLIC_API_URL` to the development machine's reachable API URL.
   Production Android releases must use HTTPS.

`npm run seed:community` imports only the client-provided category, thread,
reply, tag, bookmark, and notification preference seed data. It is idempotent
and leaves existing community content and user preferences in place.

## Verification

Current test and export results are recorded in [TEST_REPORT.md](TEST_REPORT.md).
The mobile app exports with `npx expo export --platform android` from `mobile/`.

The production checkout endpoints remain fail-closed until a payment provider
and durable provider-backed payment ledger are configured. Development payment
simulation stays available for existing checkout tests.
