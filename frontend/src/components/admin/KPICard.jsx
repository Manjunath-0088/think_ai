

export default function KPICard({ label, value, change, positive = true }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      {change && (
        <p className={`text-xs mt-2 ${positive ? 'text-cyan-400' : 'text-red-400'}`}>
          {positive ? '▲' : '▼'} {change}
        </p>
      )}
    </div>
  );
}