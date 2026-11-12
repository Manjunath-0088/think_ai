

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-red-400 text-sm">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-[#C77DFF] hover:text-[#A435F0] font-medium"
        >
          Try again
        </button>
      )}
    </div>
  );
}
