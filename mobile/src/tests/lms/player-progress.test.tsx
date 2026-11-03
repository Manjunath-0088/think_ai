import { act, fireEvent, render } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CoursePlayerScreen } from "@/lms/screens/CoursePlayerScreen";
import { lmsApi } from "@/lms/api";
import { acknowledgeProgress, loadQueue, storageKey } from "@/lms/storage";
import { flushAllPendingWork } from "@/tests/helpers";
import { AppState } from "react-native";
const mockSync = jest.fn(async () => {});
let mockVersions = {};
let mockOnline = true;
let mockTimeUpdate: ((event: { currentTime: number }) => void) | undefined;
let mockPlayToEnd: (() => void) | undefined;
const mockVideoPlayer = {
  currentTime: 0,
  timeUpdateEventInterval: 0,
  pause: jest.fn(),
  addListener: jest.fn((event: string, listener: (payload?: any) => void) => {
    if (event === "timeUpdate") mockTimeUpdate = listener;
    if (event === "playToEnd") mockPlayToEnd = listener as () => void;
    return { remove: jest.fn() };
  }),
};
jest.mock("@/lms/LmsProvider", () => ({ useLms: () => ({
  session: { userId: "1", token: "token" }, ready: true, online: mockOnline,
  sync: mockSync, syncStatus: "", versions: mockVersions, account: { role: "Learner" },
}) }));
jest.mock("@/lms/api", () => ({ lmsApi: { player: jest.fn(), note: jest.fn(), saveNote: jest.fn() },
  LmsApiError: class extends Error { status = 0; } }));
jest.mock("@/lms/downloads", () => ({ downloadLesson: jest.fn(), localVideo: async (user: string, lesson: any) => `${user}/${lesson.id}.mp4` }));
jest.mock("expo-video", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    useVideoPlayer: (_source: string, setup: (player: typeof mockVideoPlayer) => void) => {
      setup(mockVideoPlayer);
      return mockVideoPlayer;
    },
    VideoView: (props: any) => React.createElement(View, props),
  };
});
const navigation = { navigate: jest.fn() };
const player = { enrollmentId: 2, course: { id: 4, title: "Current course", description: "", modules: [{ id: 5, title: "Module", order: 0,
  assessments: [], lessons: [1, 2].map(id => ({ id, title: id === 1 ? "First" : "Second", order: id,
    durationSeconds: 100, completionThreshold: 90, videoUrl: `https://media.invalid/${id}.mp4` })) }] },
  progress: [], summary: { percentage: 0, completedLessons: 0, totalLessons: 2, eligible: false } };
const view = () => <CoursePlayerScreen {...({ route: { params: { courseId: 4 } }, navigation } as any)} />;
beforeEach(async () => {
  await AsyncStorage.clear(); jest.clearAllMocks(); mockOnline = true; mockVersions = {};
  mockTimeUpdate = undefined; mockPlayToEnd = undefined;
  (lmsApi.player as jest.Mock).mockResolvedValue(player);
  (lmsApi.note as jest.Mock).mockResolvedValue({ text: "" });
});
test("video completion updates the visible progress bar and persists the watched position", async () => {
  const screen = render(view());
  await flushAllPendingWork();
  expect(screen.getByTestId("lesson-video")).toBeTruthy();
  expect(screen.getByLabelText("Course completion").props.accessibilityValue.now).toBe(0);
  await act(async () => { mockTimeUpdate?.({ currentTime: 100 }); mockPlayToEnd?.(); });
  await flushAllPendingWork();
  expect(screen.getByText("1/2 lessons completed")).toBeTruthy();
  expect(screen.getByLabelText("Course completion").props.accessibilityValue.now).toBe(50);
  expect(JSON.parse((await AsyncStorage.getItem(storageKey("1", "position:1")))!)).toBe(100);
  expect((await loadQueue("1"))[0]?.watchedSeconds).toBe(100);
  expect(mockSync).toHaveBeenCalled();
});
test("offline completion stays queued and lesson selection highlights the next lesson", async () => {
  mockOnline = false;
  const screen = render(view());
  await flushAllPendingWork();
  expect(screen.getByTestId("lesson-video")).toBeTruthy();
  await act(async () => { mockTimeUpdate?.({ currentTime: 100 }); mockPlayToEnd?.(); });
  await flushAllPendingWork();
  expect(screen.getByText("1/2 lessons completed")).toBeTruthy();
  expect(mockSync).not.toHaveBeenCalled();
  expect(await loadQueue("1")).toHaveLength(1);
  fireEvent.press(screen.getByText("Second"));
  await flushAllPendingWork();
  expect(screen.getByText("▶ Second")).toBeTruthy();
});

test("a sync response does not enqueue another save and backgrounding uses the latest version", async () => {
  const screen = render(view());
  await flushAllPendingWork();
  expect(screen.getByTestId("lesson-video")).toBeTruthy();
  await act(async () => { mockTimeUpdate?.({ currentTime: 15 }); });
  await acknowledgeProgress("1", await loadQueue("1"));
  expect(await loadQueue("1")).toEqual([]);
  const version = "2026-10-27T13:00:00Z";
  mockVersions = { "2:1": { enrollmentId: 2, lessonId: 1, watchedSeconds: 15, updatedAt: version } };
  await act(async () => { screen.rerender(view()); });
  await flushAllPendingWork();
  expect(await loadQueue("1")).toEqual([]);
  const listener = (AppState.addEventListener as jest.Mock).mock.calls.filter(([name]) => name === "change").at(-1)![1];
  await act(async () => { listener("background"); });
  expect((await loadQueue("1"))[0]).toMatchObject({ watchedSeconds: 15, baseVersion: version });
});

test("switching lessons and unmounting still saves each lesson's unsaved position", async () => {
  mockOnline = false;
  const screen = render(view());
  await flushAllPendingWork();
  expect(screen.getByTestId("lesson-video")).toBeTruthy();
  await act(async () => { mockTimeUpdate?.({ currentTime: 7 }); });
  expect(await loadQueue("1")).toEqual([]);
  fireEvent.press(screen.getByText("Second"));
  await flushAllPendingWork();
  expect(screen.getByText("▶ Second")).toBeTruthy();
  expect((await loadQueue("1"))[0]).toMatchObject({ lessonId: 1, watchedSeconds: 7 });
  await act(async () => { mockTimeUpdate?.({ currentTime: 9 }); });
  await act(async () => { screen.unmount(); });
  expect(await loadQueue("1")).toEqual(expect.arrayContaining([
    expect.objectContaining({ lessonId: 1, watchedSeconds: 7 }),
    expect.objectContaining({ lessonId: 2, watchedSeconds: 9 }),
  ]));
});
