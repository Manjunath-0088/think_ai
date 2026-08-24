/**
 * Bottom studio toolbar: mic, camera, screen-share placeholder and raise
 * hand (Phase 6). Buttons are controlled by the page state.
 */
export default function StudioToolbar({
  muted,
  cameraOn,
  sharing,
  handRaised,
  onToggleMute,
  onToggleCamera,
  onToggleShare,
  onToggleHand,
}) {
  return (
    <div className="studio-toolbar" role="toolbar" aria-label="Studio controls">
      <button
        type="button"
        className={`toolbar-button ${muted ? "is-off" : "is-on"}`}
        aria-pressed={muted}
        onClick={onToggleMute}
      >
        <span className="toolbar-icon" aria-hidden="true">{muted ? "🔇" : "🎙️"}</span>
        {muted ? "Unmute" : "Mute"}
      </button>

      <button
        type="button"
        className={`toolbar-button ${cameraOn ? "is-on" : "is-off"}`}
        aria-pressed={cameraOn}
        onClick={onToggleCamera}
      >
        <span className="toolbar-icon" aria-hidden="true">{cameraOn ? "📷" : "🚫"}</span>
        Camera
      </button>

      <button
        type="button"
        className={`toolbar-button ${sharing ? "is-on" : ""}`}
        aria-pressed={sharing}
        onClick={onToggleShare}
      >
        <span className="toolbar-icon" aria-hidden="true">🖥️</span>
        Share
      </button>

      <button
        type="button"
        className={`toolbar-button ${handRaised ? "is-active-hand" : ""}`}
        aria-pressed={handRaised}
        onClick={onToggleHand}
      >
        <span className="toolbar-icon" aria-hidden="true">✋</span>
        Hand
      </button>
    </div>
  );
}
