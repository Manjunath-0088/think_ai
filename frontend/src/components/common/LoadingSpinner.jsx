

export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-600 border-t-[#A435F0] rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
