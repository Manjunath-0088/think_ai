const test = require("node:test");
const assert = require("node:assert/strict");

const service = require("./src/live/liveService");
const controller = require("./src/live/liveController");

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

function request(role, body = {}) {
    return {
        params: { id: "s1", messageId: "1" },
        body,
        user: { id: "7", name: "Test", role },
        app: { get: () => null },
    };
}

test.beforeEach(() => {
    service.createPoll = async () => ({ id: 1 });
    service.createBreakoutRoom = async () => ({ id: 1 });
    service.createSession = async () => ({ id: "s1" });
    service.updateSessionStatus = async () => ({ id: "s1" });
});

test("learners cannot create polls or breakout rooms", async () => {
    const pollResponse = response();
    await controller.createPoll(
        request("Learner", { question: "Ready to continue?", options: ["Yes", "No"] }),
        pollResponse
    );
    assert.equal(pollResponse.statusCode, 403);

    const breakoutResponse = response();
    await controller.createBreakoutRoom(request("Learner", { name: "Group A" }), breakoutResponse);
    assert.equal(breakoutResponse.statusCode, 403);
});

test("instructors can create polls and breakout rooms", async () => {
    const pollResponse = response();
    await controller.createPoll(
        request("Instructor", { question: "Ready to continue?", options: ["Yes", "No"] }),
        pollResponse
    );
    assert.equal(pollResponse.statusCode, 201);

    const breakoutResponse = response();
    await controller.createBreakoutRoom(
        request("Instructor", { name: "Group A" }),
        breakoutResponse
    );
    assert.equal(breakoutResponse.statusCode, 201);
});

test("learners cannot create or manage live sessions", async () => {
    const createResponse = response();
    await controller.createSession(request("Learner", { title: "Unauthorized" }), createResponse);
    assert.equal(createResponse.statusCode, 403);

    const statusResponse = response();
    await controller.updateSessionStatus(request("Learner", { status: "live" }), statusResponse);
    assert.equal(statusResponse.statusCode, 403);
});
