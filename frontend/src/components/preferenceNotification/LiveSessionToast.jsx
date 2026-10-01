import { Link } from 'react-router-dom';

/**
 * Live Session notification toast.
 *
 * Renders the live-session notification payloads pushed over Socket.IO
 * (`session:started` → "Live class starting now" + join link,
 * `session:ended` → "Recording available" + summary link).
 *
 * Standalone, dependency-light "dumb" component so it can be unit tested
 * and also used inside the global PreferenceNotificationContainer.
 */
export default function LiveSessionToast({ toast, onDismiss }) {
  if (!toast) return null;

  const { title, message, link, linkLabel } = toast;

  return (
    <div
      data-testid="live-session-toast"
      className="flex items-start gap-3 bg-slate-900 border border-slate-700 text-slate-100 p-4 rounded-xl shadow-2xl border-l-4 border-l-purple-500"
    >
      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold text-xs">
        {'▶'}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-slate-300 mt-0.5">{message}</p>
        {link && linkLabel && (
          <Link
            to={link}
            className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss()}
          className="text-slate-400 hover:text-white text-lg leading-none cursor-pointer"
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      )}
    </div>
  );
}