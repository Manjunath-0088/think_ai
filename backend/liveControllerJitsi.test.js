const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const service = require("./src/live/liveService");
const controller = require("./src/live/liveController");

const ENV_KEYS = ["JITSI_JWT_SECRET", "JITSI_APP_ID", "JITSI_DOMAIN"];
let previousEnv;
let previousGetSession;

function response() {
    return {
        statusCode: 0,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };
}

function request(id) {
    return {
        params: { id },
        user: { id: "7", name: "Instructor" },
    };
}

test.beforeEach(() => {
    previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
    previousGetSession = service.getSession;
    for (const key of ENV_KEYS) delete process.env[key];
});

test.afterEach(() => {
    service.getSession = previousGetSession;
    for (const key of ENV_KEYS) {
        if (previousEnv[key] === undefined) delete process.env[key];
        else process.env[key] = previousEnv[key];
    }
});

test("jitsi token requests fail closed when the environment is not configured", async () => {
    const res = response();
    await controller.createJitsiToken(request("s1"), res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.success, false);
});

test("jitsi token requests return 404 for an unknown live session", async () => {
    process.env.JITSI_JWT_SECRET = "test-secret";
    process.env.JITSI_APP_ID = "thinkz";
    process.env.JITSI_DOMAIN = "meet.thinkz.test";
    service.getSession = async () => null;

    const res = response();
    await controller.createJitsiToken(request("missing"), res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
});

test("jitsi token requests return a short-lived room token for an existing session", async () => {
    process.env.JITSI_JWT_SECRET = "test-secret";
    process.env.JITSI_APP_ID = "thinkz";
    process.env.JITSI_DOMAIN = "meet.thinkz.test";
    service.getSession = async (id) => ({ id, title: "Class" });

    const res = response();
    await controller.createJitsiToken(request("s 1/2"), res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.domain, "meet.thinkz.test");
    assert.equal(res.body.data.appId, "thinkz");
    assert.equal(res.body.data.room, "thinkz-s-1-2");
    assert.equal(res.body.data.expiresInSeconds, 600);

    const decoded = jwt.verify(res.body.data.token, "test-secret");
    assert.equal(decoded.aud, "jitsi");
    assert.equal(decoded.iss, "thinkz");
    assert.equal(decoded.sub, "meet.thinkz.test");
    assert.equal(decoded.room, "thinkz-s-1-2");
    assert.equal(decoded.context.user.id, "7");
    assert.ok(decoded.exp - decoded.iat <= 600);
});
