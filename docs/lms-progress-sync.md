# LMS progress synchronization

Policy: preserve the greatest valid watched progress across devices. This replaces the earlier server-wins discard policy in the local LMS service. Deploy backend and mobile changes together.

The authenticated progress-sync API verifies enrollment ownership, course access, lesson membership, configured positive duration and completion threshold. A serializable transaction reads current progress and writes min(max(server watched seconds, submitted watched seconds), configured duration). Server-validated completion never regresses. Device timestamps do not determine the winner. Concurrent transaction/unique-key races retry at most three times.

Responses keep conflict=false after an accepted merge, return canonical progress and include merged=true when the submitted base version was stale. Existing clients can consume the unchanged canonical response shape.

The mobile queue retains playback that happened while a request was in flight. If an older server returns conflict=true and the device has greater watched progress, it preserves and rebases the queued update. It never silently deletes that newer progress. A drain processes at most ten batches of 100, stops when the queue does not change, and exposes pending/retry status. Offline transitions and session changes prevent stale state updates.

This endpoint records watched-position progress using the existing backend contract; it is not a video anti-cheating system. Real shared production API deployment and multi-device acceptance remain required. Handover read-only mode keeps updates on device until the deployed server supports watch-progress sync.
