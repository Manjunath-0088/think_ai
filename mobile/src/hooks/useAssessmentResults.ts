// Adapted from the Desktop task archives to the current authenticated LMS API and data types.
import { useCallback, useEffect, useState } from "react";
import { lmsApi } from "@/lms/api";
import { useLmsResource } from "@/lms/useLmsResource";

/**
 * Grading can take a while (coding questions run in a remote sandbox). Poll
 * with exponential backoff instead of a tight fixed interval, and stop after a
 * bounded number of attempts so a backgrounded results screen cannot keep
 * hitting the API forever. Learners can always resume with "Check now".
 */
export const ASSESSMENT_POLL_INITIAL_MS = 2000;
export const ASSESSMENT_POLL_MAX_MS = 30000;
export const ASSESSMENT_POLL_MAX_ATTEMPTS = 12;

const isPending = (status?: string) =>
  Boolean(status) && !["GRADED", "FAILED"].includes(status as string);

export function useAssessmentResults(attemptId: number) {
  const fetcher = useCallback(() => lmsApi.result(attemptId), [attemptId]);
  const resource = useLmsResource(fetcher);
  const refresh = resource.refresh;
  const [poll, setPoll] = useState({ delay: ASSESSMENT_POLL_INITIAL_MS, attempts: 0 });

  useEffect(() => {
    setPoll({ delay: ASSESSMENT_POLL_INITIAL_MS, attempts: 0 });
  }, [attemptId]);

  const pending = isPending(resource.data?.status);

  useEffect(() => {
    if (!pending || poll.attempts >= ASSESSMENT_POLL_MAX_ATTEMPTS) return;
    const timer = setTimeout(() => {
      void refresh().finally(() =>
        setPoll((current) => ({
          delay: Math.min(Math.round(current.delay * 1.5), ASSESSMENT_POLL_MAX_MS),
          attempts: current.attempts + 1,
        })),
      );
    }, poll.delay);
    return () => clearTimeout(timer);
  }, [pending, poll, refresh]);

  const checkNow = useCallback(async () => {
    setPoll({ delay: ASSESSMENT_POLL_INITIAL_MS, attempts: 0 });
    await refresh();
  }, [refresh]);

  return {
    ...resource,
    refresh: checkNow,
    polling: pending && poll.attempts < ASSESSMENT_POLL_MAX_ATTEMPTS,
  };
}
