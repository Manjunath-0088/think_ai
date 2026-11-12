// Mount smoke test for the forum / community API surface that the frontend
// (`frontend/src/services/*.js`) calls. These routes were previously disabled
// on this branch (404s like `Route not found: GET /api/discussions`).
//
// Boots the real `app.js`, so DATABASE_URL must be set (Prisma is connected at
// require time). Kept out of the default, DB-less suite; run `npm run test:routes`.
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = require("./app");
const liveService = require("./src/live/liveService");

test.before(async () => {
    // Reads no longer create sessions implicitly, so seed the shared fixture
    // explicitly for this mounted-route smoke suite.
    await liveService.ensureSession("s1");
});

const USER = { "x-user-id": "u1" };
const STUDIO_AUTH = `Bearer ${jwt.sign(
    { id: "u1", name: "Test Learner", role: "Learner" },
    process.env.JWT_SECRET || "fallback_secret"
)}`;

const GET_ENDPOINTS = [
    ["/api/discussions?page=1&limit=10", "data"],
    ["/api/categories", "data"],
    ["/api/bookmarks", "data"],
    ["/api/tags", "data"],
    ["/api/notifications?userId=u1", "data"],
    ["/api/notifications/preferences/u1", "data"],
    ["/api/moderation/flagged", "data"],
    ["/api/moderation/users", "data"],
    ["/api/moderation/audit-log", "data"],
    ["/api/live-studio/sessions/s1", "data"],
    ["/api/live-studio/sessions/s1/messages", "data"],
];

for (const [path, key] of GET_ENDPOINTS) {
    test(`GET ${path} is mounted`, async () => {
        const headers = path.startsWith("/api/moderation/")
            ? { "x-user-id": "u8" }
            : path.startsWith("/api/live-studio/")
                ? { ...USER, Authorization: STUDIO_AUTH }
                : USER;
        const res = await request(app).get(path).set(headers);
        assert.equal(res.status, 200, `${path} -> ${res.status} ${res.text}`);
        assert.equal(res.body.success, true);
        assert.ok(key in res.body, `expected "${key}" in response body`);
    });
}

test("POST /api/live-studio/sessions/s1/join is mounted", async () => {
    const res = await request(app)
        .post("/api/live-studio/sessions/s1/join")
        .set({ ...USER, Authorization: STUDIO_AUTH })
        .send({});

    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.success, true);
});
