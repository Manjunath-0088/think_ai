import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  acknowledgeProgress,
  appendHistory,
  clearDraft,
  clearHistory,
  draftKey,
  enqueueProgress,
  loadDraft,
  loadHistory,
  loadQueue,
  saveDraft,
  storageKey,
} from "@/lms/storage";
import { editorHtml } from "@/lms/editorHtml";
import type { Draft, HistoryEntry } from "@/lms/types";
beforeEach(async () => {
  await AsyncStorage.clear();
});
const draft: Draft = {
  attemptId: 4,
  expiresAt: "2030-01-01T00:00:00Z",
  answers: { 1: { questionId: 1, selectedOptionId: 2 } },
  flags: [1],
  savedAt: "2026-10-22T00:00:00Z",
};
test("draft survives reopening and is isolated between accounts", async () => {
  await saveDraft("learner", 1, draft);
  expect(await loadDraft("learner", 1)).toEqual(draft);
  expect(await loadDraft("other", 1)).toBeNull();
});
test.each([
  "{broken",
  JSON.stringify({ attemptId: "x", answers: [] }),
  JSON.stringify({ ...draft, answers: { 1: { questionId: "invalid" } } }),
])("invalid draft is removed without crashing: %s", async (raw) => {
  await AsyncStorage.setItem(draftKey("learner", 1), raw);
  expect(await loadDraft("learner", 1)).toBeNull();
  expect(await AsyncStorage.getItem(draftKey("learner", 1))).toBeNull();
});
test("submission clearing runs after an in-flight draft save", async () => {
  await Promise.all([saveDraft("learner", 1, draft), clearDraft("learner", 1)]);
  expect(await loadDraft("learner", 1)).toBeNull();
});
test("history keeps newest 50 entries, restores code and clears", async () => {
  for (let i = 0; i < 55; i++) {
    const entry: HistoryEntry = {
      id: String(i),
      language: "python",
      code: `print(${i})`,
      output: String(i),
      timestamp: new Date().toISOString(),
    };
    await appendHistory("learner", entry);
  }
  const rows = await loadHistory("learner");
  expect(rows).toHaveLength(50);
  expect(rows[0]?.code).toBe("print(54)");
  expect(rows[49]?.id).toBe("5");
  await clearHistory("learner");
  expect(await loadHistory("learner")).toEqual([]);
});

test("history preserves stdin/expected output and still reads older entries without those fields", async () => {
  const old: HistoryEntry = { id: "old", language: "python", code: "print(1)", output: "1", timestamp: new Date().toISOString() };
  await appendHistory("learner", old);
  await appendHistory("learner", { ...old, id: "new", input: "5\n", expectedOutput: "10\n" });
  const rows = await loadHistory("learner");
  expect(rows[0]).toMatchObject({ input: "5\n", expectedOutput: "10\n" });
  expect(rows[1]).toEqual(old);
  expect(await loadHistory("other")).toEqual([]);
});

test("clearing history waits for an in-flight append and cannot resurrect cleared entries", async () => {
  const entry: HistoryEntry = { id: "old", language: "python", code: "print(1)", output: "1", timestamp: new Date().toISOString() };
  await appendHistory("learner", entry);
  const write = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
  let entered!: () => void;
  let release!: () => void;
  const started = new Promise<void>((resolve) => { entered = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  (AsyncStorage.setItem as jest.Mock).mockImplementationOnce(async (...args) => {
    entered();
    await gate;
    return write(...args);
  });
  const appending = appendHistory("learner", { ...entry, id: "new" });
  await started;
  const clearing = clearHistory("learner");
  release();
  await Promise.all([appending, clearing]);
  expect(await loadHistory("learner")).toEqual([]);
});
test("progress coalesces offline updates and does not erase a newer update during sync", async () => {
  const first = {
    lessonId: 1,
    enrollmentId: 2,
    watchedSeconds: 20,
    updatedAt: "2026-10-22T00:00:00Z",
    baseVersion: null,
  };
  await enqueueProgress("learner", first);
  const second = {
    ...first,
    watchedSeconds: 50,
    updatedAt: "2026-10-22T00:01:00Z",
  };
  await enqueueProgress("learner", second);
  await acknowledgeProgress("learner", [first]);
  expect(await loadQueue("learner")).toEqual([second]);
  await acknowledgeProgress("learner", [second]);
  expect(await loadQueue("learner")).toEqual([]);
});
test("concurrent updates to different lessons are not lost", async () => {
  await Promise.all(
    [1, 2, 3].map((lessonId) =>
      enqueueProgress("learner", {
        lessonId,
        enrollmentId: 1,
        watchedSeconds: 10,
        updatedAt: new Date().toISOString(),
        baseVersion: null,
      }),
    ),
  );
  expect(await loadQueue("learner")).toHaveLength(3);
});
test("queue corruption is removed and source code cannot escape the editor document", async () => {
  await AsyncStorage.setItem(storageKey("learner", "progress"), "bad json");
  expect(await loadQueue("learner")).toEqual([]);
  const html = editorHtml("</script><script>alert(1)</script>", "javascript");
  expect(html).not.toContain("</script><script>alert(1)");
});

test("progress with the same millisecond timestamp is not mistaken for the sent snapshot", async () => {
  const first = { lessonId: 1, enrollmentId: 2, watchedSeconds: 15,
    updatedAt: "2026-10-22T00:00:00Z", baseVersion: null };
  await enqueueProgress("learner", first);
  await enqueueProgress("learner", { ...first, watchedSeconds: 30 });
  await acknowledgeProgress("learner", [first]);
  expect((await loadQueue("learner"))[0]?.watchedSeconds).toBe(30);
});

test("coalescing preserves a null original base version", async () => {
  const first = { lessonId: 1, enrollmentId: 2, watchedSeconds: 15,
    updatedAt: "2026-10-22T00:00:00Z", baseVersion: null };
  await enqueueProgress("learner", first);
  await enqueueProgress("learner", { ...first, watchedSeconds: 30, baseVersion: "2026-10-22T00:01:00Z" });
  expect((await loadQueue("learner"))[0]?.baseVersion).toBeNull();
});
