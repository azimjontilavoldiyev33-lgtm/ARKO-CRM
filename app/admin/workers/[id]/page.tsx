'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { STATUS_META, fmtDate, isOverdue, type Task, type Worker } from './_components/shared';
import Skeleton from './_components/Skeleton';
import EditWorkerModal from './_components/EditWorkerModal';
import RatingModal from './_components/RatingModal';
import PhotoModal from './_components/PhotoModal';
import TaskCard from './_components/TaskCard';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkerProfilePage() {
  const { id } = useParams();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingTask, setRatingTask] = useState<string | null>(null);
  const [photoTask, setPhotoTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchData = async () => {
    const [workerRes, tasksRes] = await Promise.all([
      fetch(`/api/workers/${id}`),
      fetch(`/api/tasks?worker=${id}`),
    ]);
    setWorker(await workerRes.json());
    setTasks(await tasksRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const es = new EventSource('/api/sse');
    es.onmessage = () => fetchData();
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRating = async (taskId: string, rating: number) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    setRatingTask(null);
    showToast('Baho saqlandi ✓');
    fetchData();
  };

  const handleResetDevice = async () => {
    if (!confirm("Qurilma biriktirishni bekor qilasizmi? Ishchi yangi telefondan kira oladi.")) return;
    const res = await fetch(`/api/workers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetDevice: true }),
    });
    if (res.ok) {
      showToast('Qurilma uzildi ✓');
      fetchData();
    } else {
      showToast('Xatolik yuz berdi ✗');
    }
  };

  const handleEditSave = async (data: Partial<Worker>) => {
    const res = await fetch(`/api/workers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditOpen(false);
      showToast("Ma'lumotlar yangilandi ✓");
      fetchData();
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || 'Xatolik yuz berdi ✗');
    }
  };

  if (loading) return <Skeleton />;

  if (!worker) return (
    <div
      className="min-h-screen bg-[#0f1117] flex items-center justify-center text-[#555]"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      Usta topilmadi
    </div>
  );

  const completedTasks  = tasks.filter(t => t.status === 'completed');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const overdueTasks    = tasks.filter(t => isOverdue(t));
  const ratedTasks      = completedTasks.filter(t => t.rating);
  const avgRating       = ratedTasks.length > 0
    ? (ratedTasks.reduce((s, t) => s + (t.rating ?? 0), 0) / ratedTasks.length).toFixed(1)
    : '—';

  const initials = worker.fullName.split(' ').map(n => n[0]).slice(0, 2).join('');

  return (
    <>
      <style>{`
        @keyframes slide-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in    { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up     { animation: slide-up 0.25s ease both; }
        .animate-fade-in      { animation: fade-in 0.25s ease both; }
      `}</style>

      {/* Modals */}
      {editOpen && worker && (
        <EditWorkerModal
          worker={worker}
          onClose={() => setEditOpen(false)}
          onSave={handleEditSave}
        />
      )}
      {ratingTask && (
        <RatingModal
          onClose={() => setRatingTask(null)}
          onSave={(r) => handleRating(ratingTask, r)}
        />
      )}
      {photoTask && (
        <PhotoModal task={photoTask} onClose={() => setPhotoTask(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d27] border border-[#2a2d3a] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-xl animate-fade-in whitespace-nowrap pointer-events-none">
          {toast}
        </div>
      )}

      <div
        className="min-h-screen bg-[#0f1117] text-[#e8e8e8]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {/* ── Topbar (mobile sticky) ── */}
        <div className="sticky top-0 z-30 bg-[#0f1117]/90 backdrop-blur border-b border-[#1e2130] px-4 py-3 flex items-center gap-3 sm:hidden">
          <Link
            href="/admin/workers"
            className="w-9 h-9 rounded-xl bg-[#1a1d27] flex items-center justify-center text-[#888] hover:text-white transition border border-[#2a2d3a]"
          >
            ←
          </Link>
          <span className="flex-1 font-semibold text-white text-sm truncate">{worker.fullName}</span>
          <button
            onClick={() => setEditOpen(true)}
            className="w-9 h-9 rounded-xl bg-[#1a1d27] flex items-center justify-center text-[#888] hover:text-[#f0c040] transition border border-[#2a2d3a]"
            title="Tahrirlash"
          >
            ✏️
          </button>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a2333] text-[#9aabbf] font-mono font-semibold tracking-widest">
            #{worker.code ?? '—'}
          </span>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5">

          {/* Back link (desktop) */}
          <Link
            href="/admin/workers"
            className="hidden sm:inline-flex items-center gap-2 text-[#555] text-sm hover:text-[#888] transition"
          >
            ← Ustalarga qaytish
          </Link>

          {/* ── Hero card ── */}
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[#f0c040] via-[#e8a045] to-[#f0c040]" />

            <div className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#f0c040] flex items-center justify-center text-[#0f1117] text-2xl sm:text-3xl font-extrabold shrink-0 self-start sm:self-auto"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1
                  className="text-xl sm:text-2xl font-extrabold text-white leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {worker.fullName}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                  <span className="text-[#666] text-sm">📞 +{worker.phoneNumber}</span>
                  {worker.position && (
                    <span className="text-[#666] text-sm">💼 {worker.position}</span>
                  )}
                  <span className="text-[#666] text-sm">
                    📅 {new Date(worker.createdAt).toLocaleDateString('uz-UZ')} dan
                  </span>
                </div>
              </div>

              {/* Right side: Telegram badge + Edit button */}
              <div className="self-start sm:self-auto shrink-0 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-[#14161f] text-[#9aabbf] border border-[#2a2d3a] rounded-xl px-3.5 py-2 text-xs font-mono font-semibold tracking-widest">
                  KIRISH KODI: #{worker.code ?? '—'}
                </span>

                {/* Edit button (desktop) */}
                <button
                  onClick={() => setEditOpen(true)}
                  className="hidden sm:inline-flex items-center gap-2 bg-[#14161f] hover:bg-[#2a2d3a] border border-[#2a2d3a] hover:border-[#f0c040]/40 text-[#888] hover:text-[#f0c040] rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200"
                >
                  ✏️ Tahrirlash
                </button>
              </div>
            </div>
          </div>

          {/* ── Davomat qurilmasi (device binding) ── */}
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-[#14161f] border border-[#2a2d3a] flex items-center justify-center text-lg shrink-0">📱</span>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Davomat qurilmasi
                </p>
                {worker.deviceId ? (
                  <p className="text-[#9aa0ad] text-xs mt-0.5">
                    <span className="text-emerald-400 font-semibold">● Biriktirilgan</span>
                    {worker.deviceBoundAt && (
                      <span className="text-[#666]"> · {new Date(worker.deviceBoundAt).toLocaleDateString('uz-UZ')} dan</span>
                    )}
                    <span className="block text-[#555] mt-0.5">Ishchi faqat shu telefondan davomat belgilaydi.</span>
                  </p>
                ) : (
                  <p className="text-[#9aa0ad] text-xs mt-0.5">
                    <span className="text-[#888]">○ Biriktirilmagan</span>
                    <span className="block text-[#555] mt-0.5">Ishchi birinchi marta kirgan telefoni avtomatik biriktiriladi.</span>
                  </p>
                )}
              </div>
            </div>
            {worker.deviceId && (
              <button
                onClick={handleResetDevice}
                className="self-start sm:self-auto shrink-0 bg-[#14161f] hover:bg-[#2a1414] border border-[#2a2d3a] hover:border-[#4a1a1a] text-[#888] hover:text-[#f87171] rounded-xl px-4 py-2 text-xs font-semibold transition-all"
              >
                🔓 Qurilmani uzish
              </button>
            )}
          </div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Jami vazifa',    value: tasks.length,           color: 'text-white'       },
              { label: 'Bajarilgan',     value: completedTasks.length,  color: 'text-emerald-400' },
              { label: 'Jarayonda',      value: inProgressTasks.length, color: 'text-amber-400'   },
              { label: 'Kechikkan',      value: overdueTasks.length,    color: 'text-red-400'     },
              { label: "O'rtacha baho",  value: avgRating,              color: 'text-amber-400', prefix: '⭐ ' },
            ].map(({ label, value, color, prefix }) => (
              <div
                key={label}
                className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 text-center last:col-span-2 sm:last:col-span-1"
              >
                <p className="text-[#555] text-[10px] uppercase tracking-widest mb-2">{label}</p>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold ${color}`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {prefix}{value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Tasks ── */}
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <p className="text-white font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Barcha vazifalar
                <span className="text-[#555] font-normal text-sm ml-2">({tasks.length})</span>
              </p>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 text-center text-[#555]">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">Hali vazifa yo'q</p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="sm:hidden space-y-3">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onRate={() => setRatingTask(task._id)}
                      onPhoto={() => setPhotoTask(task)}
                    />
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#14161f]">
                        {['Vazifa', 'Buyurtma', 'Muddat', 'Boshlandi', 'Tugadi', 'Status', 'Baho', 'Rasm'].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-[#555] text-[11px] font-medium uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => {
                        const sm = STATUS_META[task.status];
                        const overdue = isOverdue(task);
                        return (
                          <tr
                            key={task._id}
                            className="border-t border-[#2a2d3a] hover:bg-[#1f2235] transition-colors"
                          >
                            <td className="px-5 py-3.5 font-medium text-sm text-white max-w-[180px] truncate">
                              {task.title}
                            </td>
                            <td className="px-5 py-3.5 text-[#666] text-sm max-w-[140px] truncate">
                              {task.order?.title}
                            </td>
                            <td className={`px-5 py-3.5 text-sm ${overdue ? 'text-red-400 font-medium' : 'text-[#666]'}`}>
                              {overdue ? '⚠ ' : ''}{fmtDate(task.deadline)}
                            </td>
                            <td className="px-5 py-3.5 text-[#666] text-sm">{fmtDate(task.startedAt)}</td>
                            <td className="px-5 py-3.5 text-[#666] text-sm">{fmtDate(task.completedAt)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${sm.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                                {sm.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {task.rating ? (
                                <span className="text-amber-400 text-sm">{'⭐'.repeat(task.rating)}</span>
                              ) : task.status === 'completed' ? (
                                <button
                                  onClick={() => setRatingTask(task._id)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-800/30 text-amber-400 font-semibold hover:bg-amber-900 transition"
                                >
                                  Baholash
                                </button>
                              ) : (
                                <span className="text-[#444] text-sm">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {task.completionPhoto ? (
                                <button
                                  onClick={() => setPhotoTask(task)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-800/30 text-blue-400 font-semibold hover:bg-blue-900 transition"
                                >
                                  📸 Ko'rish
                                </button>
                              ) : (
                                <span className="text-[#444] text-sm">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
