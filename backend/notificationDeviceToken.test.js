const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const prisma = require("./config/database");
const notificationRoutes = require("./routes/notificationPreferences");

const VALID_TOKEN = "ExponentPushToken[device-token-test]";

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use("/notifications", notificationRoutes);
    return app;
}

let originalDevicePushToken;
let deleteMany;

test.beforeEach(() => {
    originalDevicePushToken = prisma.devicePushToken;
    deleteMany = async () => ({ count: 1 });
    prisma.devicePushToken = { deleteMany: (...args) => deleteMany(...args) };
});

test.afterEach(() => {
    prisma.devicePushToken = originalDevicePushToken;
});

test("device-token revocation removes only the caller's registration", async () => {
    let capturedWhere = null;
    deleteMany = async (args) => {
        capturedWhere = args.where;
        return { count: 1 };
    };

    const response = await request(buildApp())
        .delete("/notifications/device-token")
        .set({ "x-demo-role": "Learner", "x-demo-user-id": "42" })
        .send({ expoPushToken: VALID_TOKEN });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.removed, 1);
    assert.deepEqual(capturedWhere, { expoPushToken: VALID_TOKEN, userId: "42" });
});

test("device-token revocation rejects a missing or malformed token", async () => {
    const response = await request(buildApp())
        .delete("/notifications/device-token")
        .set({ "x-demo-role": "Learner", "x-demo-user-id": "42" })
        .send({ expoPushToken: "not-a-push-token" });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
});

test("device-token revocation requires authentication", async () => {
    const response = await request(buildApp())
        .delete("/notifications/device-token")
        .send({ expoPushToken: VALID_TOKEN });

    assert.equal(response.status, 401);
});

test("device-token revocation reports storage failures without leaking details", async () => {
    deleteMany = async () => {
        throw new Error("database exploded");
    };

    const response = await request(buildApp())
        .delete("/notifications/device-token")
        .set({ "x-demo-role": "Learner", "x-demo-user-id": "42" })
        .send({ expoPushToken: VALID_TOKEN });

    assert.equal(response.status, 500);
    assert.equal(response.body.message, "Could not unregister this device.");
});
