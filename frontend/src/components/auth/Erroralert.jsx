import PropTypes from 'prop-types';

export default function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs lg:text-sm mb-4 lg:mb-6 p-3 rounded-md flex items-start gap-2 text-left shadow-[0_0_15px_rgba(244,63,94,0.3)]">
      <svg className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

ErrorAlert.propTypes = {
  message: PropTypes.string,
};