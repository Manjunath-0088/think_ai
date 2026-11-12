const test = require("node:test");
const assert = require("node:assert/strict");

const repository = require("./src/live/liveRepository");
const service = require("./src/live/liveService");

function session(id = "s1") {
    return {
        id,
        title: "Existing class",
        hostId: "7",
        status: "scheduled",
        scheduledAt: new Date("2026-11-10T10:00:00.000Z"),
        startedAt: null,
        attendees: [],
        messages: [],
        polls: [],
        breakouts: [],
    };
}

test.beforeEach(() => {
    repository.getSession = async () => null;
    repository.createSession = async () => {
        throw new Error("createSession must not be called by reads");
    };
    repository.upsertAttendee = async () => {
        throw new Error("join must not create a missing session");
    };
    repository.listMessages = async () => [];
    repository.listSessions = async () => [];
    repository.getMessage = async () => null;
    repository.softDeleteMessage = async () => ({ count: 0 });
});

test("reading an unknown session returns null instead of creating a demo row", async () => {
    const result = await service.getSession("missing");
    assert.equal(result, null);
});

test("joining an unknown session is rejected with NOT_FOUND", async () => {
    await assert.rejects(
        () => service.joinSession("missing", { id: "7", name: "Learner" }),
        (error) => error.code === "NOT_FOUND"
    );
});

test("messages, polls and breakouts require an existing session", async () => {
    await assert.rejects(() => service.getMessages("missing"), (error) => error.code === "NOT_FOUND");
    await assert.rejects(
        () => service.createPoll("missing", { id: "7" }, { question: "Ready?", options: ["Yes", "No"] }),
        (error) => error.code === "NOT_FOUND"
    );
    await assert.rejects(() => service.listBreakoutRooms("missing"), (error) => error.code === "NOT_FOUND");
});

test("sessions can be listed and explicitly created by staff", async () => {
    repository.listSessions = async () => [session("one"), session("two")];
    const list = await service.listSessions();
    assert.deepEqual(list.map((item) => item.id), ["one", "two"]);

    let existed = false;
    repository.getSession = async (id) =>
        existed && id === "new-class" ? session("new-class") : null;
    repository.createSession = async (data) => {
        assert.equal(data.id, "new-class");
        assert.equal(data.title, "System design");
        assert.equal(data.hostId, "7");
        assert.equal(data.status, "scheduled");
        existed = true;
        return session("new-class");
    };
    const created = await service.createSession("new-class", { id: "7" }, {
        title: "System design",
        scheduledAt: "2026-11-11T10:00:00.000Z",
    });
    assert.equal(created.id, "new-class");
});

test("creating a duplicate session id is rejected", async () => {
    repository.getSession = async () => session("duplicate");
    await assert.rejects(
        () => service.createSession("duplicate", { id: "7" }, { title: "Duplicate" }),
        (error) => error.code === "CONFLICT"
    );
});

test("learners can delete their own messages but not another learner's", async () => {
    const message = { id: 12, sessionId: "s1", userId: "7", text: "Hello" };
    let deleted = 0;
    repository.getMessage = async () => message;
    repository.softDeleteMessage = async () => {
        deleted += 1;
        return { count: 1 };
    };

    await service.deleteMessage("s1", { id: "7", role: "Learner" }, 12);
    assert.equal(deleted, 1);

    await assert.rejects(
        () => service.deleteMessage("s1", { id: "8", role: "Learner" }, 12),
        (error) => error.code === "FORBIDDEN"
    );
    assert.equal(deleted, 1);
});

test("instructors and admins can moderate any message", async () => {
    const message = { id: 12, sessionId: "s1", userId: "7", text: "Hello" };
    let deleted = 0;
    repository.getMessage = async () => message;
    repository.softDeleteMessage = async () => {
        deleted += 1;
        return { count: 1 };
    };

    await service.deleteMessage("s1", { id: "99", role: "Instructor" }, 12);
    await service.deleteMessage("s1", { id: "100", role: "Admin" }, 12);
    assert.equal(deleted, 2);
});

test("deleting a missing message returns NOT_FOUND", async () => {
    repository.getMessage = async () => null;
    await assert.rejects(
        () => service.deleteMessage("s1", { id: "7", role: "Learner" }, 999),
        (error) => error.code === "NOT_FOUND"
    );
});
