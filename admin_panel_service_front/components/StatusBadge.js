const statusStyles = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  scheduled: 'bg-amber-50 text-amber-800 border-amber-200',
  queued: 'bg-blue-50 text-blue-800 border-blue-200',
  running: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-amber-100 text-amber-800 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  blocked: 'bg-red-100 text-red-700 border-red-300',
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  fail: 'bg-red-50 text-red-700 border-red-200',
};

export default function StatusBadge({ status, className = '' }) {
  const s = (status || '').toLowerCase();
  const style = statusStyles[s] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}>
      {s || '—'}
    </span>
  );
}
