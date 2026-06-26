import { STATUS_META, fmtDate, isOverdue, type Task } from './shared';

export default function TaskCard({
  task,
  onRate,
  onPhoto,
}: {
  task: Task;
  onRate: () => void;
  onPhoto: () => void;
}) {
  const sm = STATUS_META[task.status];
  const overdue = isOverdue(task);

  return (
    <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-snug truncate">{task.title}</p>
          <p className="text-xs text-[#555] mt-0.5 truncate">{task.order?.title}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${sm.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
          {sm.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Muddat', val: fmtDate(task.deadline), danger: overdue },
          { label: 'Boshlandi', val: fmtDate(task.startedAt) },
          { label: 'Tugadi', val: fmtDate(task.completedAt) },
        ].map(({ label, val, danger }) => (
          <div key={label} className="bg-[#14161f] rounded-xl py-2 px-1">
            <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">{label}</p>
            <p className={`text-xs font-medium ${danger ? 'text-red-400' : 'text-[#aaa]'}`}>
              {danger ? '⚠ ' : ''}{val}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {task.rating ? (
          <span className="text-sm text-amber-400">{'⭐'.repeat(task.rating)}</span>
        ) : task.status === 'completed' ? (
          <button
            onClick={onRate}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-950 border border-amber-800/40 text-amber-400 font-semibold hover:bg-amber-900 transition"
          >
            Baholash
          </button>
        ) : (
          <span className="text-xs text-[#444]">Baho yo'q</span>
        )}
        {task.completionPhoto && (
          <button
            onClick={onPhoto}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800/40 text-blue-400 font-semibold hover:bg-blue-900 transition"
          >
            📸 Ko'rish
          </button>
        )}
      </div>
    </div>
  );
}
