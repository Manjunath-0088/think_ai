import type { ScrollViewInstance } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useVideoPlayer, VideoView } from "expo-video";
import { AppButton } from "@/components/common/AppButton";
import { ProgressBar } from "@/components/common/ProgressBar";
import type { ScreenProps } from "@/navigation/types";
import { lmsApi } from "../api";
import { HANDOVER_READ_API } from '../deployment';
import { youtubeEmbed } from '../handoverContracts';
import { HostedVideo } from '../HostedVideo';
import { useCoursePlayer } from "@/hooks/useCoursePlayer";
import { useLms } from "../LmsProvider";
import { read, storageKey } from "../storage";
import { Card, Field, LoadState, Message, Screen, useLmsStyles } from "../ui";
export function Notes({
  enrollmentId,
  lessonId,
}: {
  enrollmentId: number;
  lessonId: number;
}) {
  const styles = useLmsStyles();
  const { session, online } = useLms();
  const [text, setText] = useState(""),
    [status, setStatus] = useState("");
  const current = useRef("");
  const loaded = useRef(false);
  const [ready, setReady] = useState(false);
  const dirty = useRef(false);
  const key = storageKey(session.userId, `note:${enrollmentId}:${lessonId}`);
  const save = useCallback(async () => {
    if (!loaded.current || !dirty.current) return;
    const value = current.current;
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ text: value, dirty: true }),
      );
      setStatus("Saved on this device");
      if (HANDOVER_READ_API) {
        setStatus('Saved on this device. Server notes sync is unavailable.');
        return;
      }
      if (online) {
        await lmsApi.saveNote(enrollmentId, lessonId, value);
        if (current.current === value) {
          await AsyncStorage.setItem(
            key,
            JSON.stringify({ text: value, dirty: false }),
          );
          dirty.current = false;
          setStatus("Notes saved");
        }
      }
    } catch {
      setStatus("Notes could not sync; device copy will retry on reconnect.");
    }
  }, [key, online, enrollmentId, lessonId]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (loaded.current && dirty.current) {
          if (online) await save();
          return;
        }
        const local = await read(
          key,
          (v): v is { text: string; dirty: boolean } =>
            !!v && typeof (v as { text: string }).text === "string",
          { text: "", dirty: false },
        );
        const result =
          local.dirty || !online
            ? local
            : await lmsApi.note(enrollmentId, lessonId).catch(() => local);
        if (active) {
          current.current = result.text;
          dirty.current = local.dirty;
          loaded.current = true;
          setReady(true);
          setText(result.text);
        }
        if (local.dirty && online) await save();
      } catch {
        if (active) {
          loaded.current = true;
          setReady(true);
          setStatus("Notes could not load from the server.");
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [key, online]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") void save();
    });
    return () => {
      sub.remove();
      void save();
    };
  }, [save]);
  return (
    <Card>
      <Text style={styles.heading}>Lesson notes</Text>
      <Field
        label="Your notes (save when leaving the field)"
        editable={ready}
        multiline
        style={{ minHeight: 120, textAlignVertical: "top" }}
        value={text}
        onChangeText={(value) => {
          dirty.current = true;
          current.current = value;
          setText(value);
        }}
        onBlur={() => void save()}
      />
      <Message text={status} />
    </Card>
  );
}
export function CoursePlayerScreen({
  route,
  navigation,
}: ScreenProps<"CoursePlayer">) {
  const styles = useLmsStyles();
  const { resource, lesson, lessons, uri, message, download,
    initialPosition, completed, online, playback, downloadCurrent, setSelected } =
    useCoursePlayer(route.params.courseId, route.params.lessonId);
  const scroll = useRef<ScrollViewInstance>(null);
  const hosted = lesson?.videoUrl ? youtubeEmbed(lesson.videoUrl) : null;
  const player = useVideoPlayer(hosted ? null : uri, current => {
    current.timeUpdateEventInterval = 1;
  });
  useEffect(() => {
    if (uri && !hosted) player.currentTime = initialPosition / 1000;
  }, [player, uri, hosted, initialPosition]);
  useEffect(() => {
    const report = (finished = false) => playback({
      isLoaded: true,
      positionMillis: player.currentTime * 1000,
      isPlaying: player.playing,
      didJustFinish: finished,
    } as Parameters<typeof playback>[0]);
    const subscriptions = [
      player.addListener("timeUpdate", () => report()),
      player.addListener("playingChange", () => report()),
      player.addListener("playToEnd", () => report(true)),
      player.addListener("statusChange", event => {
        if (event.status === "error") playback({ isLoaded: false, error: event.error?.message || "Video playback failed." });
      }),
    ];
    return () => subscriptions.forEach(subscription => subscription.remove());
  }, [player, playback]);
  return (
    <Screen title={resource.data?.course.title || "Course player"} scrollRef={scroll}>
      <LoadState {...resource} retry={resource.refresh} />
      {lesson && resource.data ? (
        <>
          <Text style={styles.heading}>{lesson.title}</Text>
          {youtubeEmbed(lesson.videoUrl) ? (
            <HostedVideo key={`video:${lesson.id}`} url={youtubeEmbed(lesson.videoUrl)!} />
          ) : uri ? (
            <VideoView
              key={`${lesson.id}:${uri}`}
              player={player}
              style={{ width: "100%", height: 230, backgroundColor: "#000" }}
              nativeControls
              contentFit="contain"
              testID="lesson-video"
            />
          ) : (
            <Message text="Video unavailable for this lesson." />
          )}
          <Message text={`${completed}/${lessons.length} lessons completed`} />
          {resource.data.progressPolicy === 'server-only' ? <Message text="Showing your saved course completion. Watching this video cannot update completion until progress sync is enabled." /> : null}
          {youtubeEmbed(lesson.videoUrl) ? <Message text="This lesson uses the provider's video controls. Offline download is unavailable for this hosted video." /> : null}
          <ProgressBar
            progress={lessons.length ? (completed / lessons.length) * 100 : 0}
            accessibilityLabel="Course completion"
          />
          {message ? <Message text={message} /> : null}
          <AppButton
            title={
              download === null
                ? "Download this video"
                : `Downloading ${Math.round(download * 100)}%`
            }
            loading={download !== null}
            disabled={!online || !lesson.videoUrl || !!youtubeEmbed(lesson.videoUrl)}
            onPress={() => void downloadCurrent()}
          />
          {lesson.content ? (
            <Card>
              <Text style={styles.text}>{lesson.content}</Text>
            </Card>
          ) : null}
          <Notes
            key={`note:${lesson.id}`}
            enrollmentId={resource.data.enrollmentId}
            lessonId={lesson.id}
          />
          {resource.data.course.modules.map((module) => (
            <Card key={`module:${module.id}`}>
              <Text style={styles.heading}>{module.title}</Text>
              {module.lessons.map((l) => (
                <AppButton
                  key={l.id}
                  title={`${l.id === lesson.id ? "▶ " : ""}${l.title}`}
                  variant={l.id === lesson.id ? "primary" : "secondary"}
                  onPress={() => {
                    if (l.id !== lesson.id) player.pause();
                    setSelected(l.id);
                    scroll.current?.scrollTo({ y: 0, animated: true });
                  }}
                />
              ))}
              {module.assessments
                .filter((a) => a.status === "ACTIVE")
                .map((a) => (
                  <AppButton
                    key={`a${a.id}`}
                    title={`Take assessment: ${a.title}`}
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate("AssessmentTaking", {
                        assessmentId: a.id,
                        enrollmentId: resource.data!.enrollmentId,
                      })
                    }
                  />
                ))}
            </Card>
          ))}
          <View style={styles.row}>
            <AppButton
              title="Manage downloads"
              variant="secondary"
              onPress={() => navigation.navigate("Downloads")}
            />
            <AppButton
              title="Profile & certificates"
              variant="secondary"
              onPress={() => navigation.navigate("LearnerProfile")}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
