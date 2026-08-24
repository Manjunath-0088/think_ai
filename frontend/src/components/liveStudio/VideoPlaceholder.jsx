/** Video area placeholder — no real WebRTC in this module (Phase 6). */
export default function VideoPlaceholder({ title, isSharing, attendeeCount }) {
  return (
    <div
      className={`video-placeholder ${isSharing ? "video-placeholder--sharing" : ""}`}
      data-testid="video-placeholder"
    >
      <span className="video-placeholder__badge">
        {isSharing ? "🖥 Screen share (placeholder)" : "🎥 Live video"}
      </span>
      <span className="video-placeholder__icon" aria-hidden="true">
        {isSharing ? "🖥️" : "📹"}
      </span>
      <span className="video-placeholder__label">
        {title}
        {typeof attendeeCount === "number" && ` · ${attendeeCount} attendees`}
      </span>
    </div>
  );
}
