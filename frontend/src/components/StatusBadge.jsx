const statusColors = {
  online: 'bg-green-500/20 text-green-400 border-green-500/30',
  offline: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  unknown: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusDots = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  error: 'bg-amber-500',
  unknown: 'bg-slate-500',
};

export default function StatusBadge({ status = 'unknown' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] || statusColors.unknown}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[status] || statusDots.unknown}`} />
      {status}
    </span>
  );
}
