  'use client';

  import { useEffect, useState } from 'react';


  // ─── Types ────────────────────────────────────────────────────────────────────
  interface Worker {
    _id: string;
    fullName: string;
    telegramChatId?: string;
  }

  interface Order {
    _id: string;
    title: string;
  }

interface Task {
  _id: string;
  title: string;
  description?: string;
  order?: { _id: string; title: string };
  worker: { _id: string; fullName: string };
  department?: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  pipelineId?: {
    _id: string;
    title: string;
    steps: { department: string; title: string }[];
    currentStep: number;
    status: 'active' | 'completed';
  };
  stepIndex?: number;
}

  type FormState = {
    title: string;
    order: string;
    worker: string;
    deadline: string;
    department: string;
    description: string;
  };

  // ─── Constants ────────────────────────────────────────────────────────────────
  const STATUS_META = {
    pending:     { label: 'Kutilmoqda', badge: 'bg-blue-950   text-blue-400',    dot: 'bg-blue-400'    },
    in_progress: { label: 'Jarayonda',  badge: 'bg-amber-950  text-amber-400',   dot: 'bg-amber-400'   },
    completed:   { label: 'Tugallandi', badge: 'bg-emerald-950 text-emerald-400', dot: 'bg-emerald-400' },
  } as const;

  // Bo'limlar ro'yxati — kerak bo'lsa o'zgartiring

  const DEPARTMENTS = [
    { label: "Yig'ish sexi",  slug: 'yigish-sexi'  },
    { label: "Bo'yash sexi",  slug: 'boyash-sexi'  },
    { label: "Kesish sexi",   slug: 'kesish-sexi'  },
    { label: "Ombor",         slug: 'ombor'         },
    { label: "Boshqa",        slug: 'boshqa'        },
  ];

  const fmtDate   = (d?: string) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
  const isOverdue = (t: Task)    => new Date(t.deadline) < new Date() && t.status !== 'completed';

  const EMPTY_FORM: FormState = {
    title: '', order: '', worker: '', deadline: '', department: '', description: '',
  };

  const inputCls =
    'w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-sm text-[#e8e8e8] outline-none focus:border-[#f0c040] transition placeholder-[#444] [color-scheme:dark]';

  // ─── Toast ────────────────────────────────────────────────────────────────────
  function Toast({ msg }: { msg: string }) {
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d27] border border-[#2a2d3a] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-xl animate-fade-in whitespace-nowrap pointer-events-none">
        {msg}
      </div>
    );
  }

  // ─── StatCard ─────────────────────────────────────────────────────────────────
  function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
        <p className="text-[#555] text-[10px] sm:text-[11px] uppercase tracking-widest mb-2">{label}</p>
        <p className={`text-2xl sm:text-3xl font-extrabold ${color}`} style={{ fontFamily: "'Syne', sans-serif" }}>
          {value}
        </p>
      </div>
    );
  }

  // ─── Mobile TaskCard ──────────────────────────────────────────────────────────
  function TaskCard({ task, onDelete }: { task: Task; onDelete: () => void }) {
    const meta    = STATUS_META[task.status];
    const overdue = isOverdue(task);

    return (
      <div className={`bg-[#1a1d27] rounded-2xl border p-4 space-y-3 ${overdue ? 'border-red-900/50' : 'border-[#2a2d3a]'}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#14161f] flex items-center justify-center text-lg shrink-0">📋</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">{task.title}</p>
            {task.description && <p className="text-xs text-[#666] mt-0.5 line-clamp-1">{task.description}</p>}
            {task.order?.title && <p className="text-xs text-[#555] mt-0.5 truncate">📦 {task.order.title}</p>}
            {task.department && <p className="text-xs text-[#555] mt-0.5">🏢 {task.department}</p>}
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${meta.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#14161f] rounded-xl p-2.5">
            <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Usta</p>
            <p className="text-xs text-[#aaa] font-medium truncate">👷 {task.worker?.fullName}</p>
          </div>
          <div className="bg-[#14161f] rounded-xl p-2.5">
            <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Muddat</p>
            <p className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-[#aaa]'}`}>
              {overdue ? '⚠ ' : '⏰ '}{fmtDate(task.deadline)}
            </p>
          </div>
          {task.startedAt && (
            <div className="bg-[#14161f] rounded-xl p-2.5">
              <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Boshlandi</p>
              <p className="text-xs text-[#aaa] font-medium">{fmtDate(task.startedAt)}</p>
            </div>
          )}
          {task.completedAt && (
            <div className="bg-[#14161f] rounded-xl p-2.5">
              <p className="text-[10px] text-[#555] uppercase tracking-wide mb-0.5">Tugadi</p>
              <p className="text-xs text-emerald-400 font-medium">{fmtDate(task.completedAt)}</p>
            </div>
          )}
        </div>

        <button
          onClick={onDelete}
          className="w-full py-2 rounded-xl border border-red-900/40 text-red-400 text-xs font-semibold hover:bg-red-950/40 transition"
        >
          O'chirish
        </button>
      </div>
    );
  }

  // ─── Add Modal ────────────────────────────────────────────────────────────────
  function AddModal({
    workers, orders, onClose, onSubmit, saving,
  }: {
    workers: Worker[]; orders: Order[]; onClose: () => void; onSubmit: (f: FormState) => void; saving: boolean;
  }) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const set = (k: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    // Order yoki Department — bittasi bo'lsa yetarli
    const valid = form.title && form.worker && form.deadline && (form.order || form.department);

    return (
      <div
        className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-[#1a1d27] rounded-t-3xl sm:rounded-2xl border border-[#2a2d3a] w-full sm:max-w-md p-6 pb-10 sm:pb-6 max-h-[92vh] overflow-y-auto animate-slide-up">
          <div className="w-8 h-1 bg-[#2a2d3a] rounded-full mx-auto mb-5 sm:hidden" />

          <h2 className="text-lg font-extrabold text-white mb-5" style={{ fontFamily: "'Syne', sans-serif" }}>
            Yangi vazifa
          </h2>

          <div className="space-y-3.5">
            {/* Vazifa nomi */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Vazifa nomi *</label>
              <input
                type="text"
                placeholder="Kesish, Yig'ish, Bo'yash..."
                value={form.title}
                onChange={set('title')}
                className={inputCls}
              />
            </div>

            {/* Tavsif */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Tavsif (ixtiyoriy)</label>
              <textarea
                placeholder="Vazifa haqida qo'shimcha ma'lumot..."
                value={form.description}
                onChange={set('description')}
                rows={2}
                className={inputCls + ' resize-none'}
              />
            </div>

            {/* Bo'lim */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Bo'lim / Xona</label>
              <select value={form.department} onChange={set('department')} className={inputCls}>
                <option value="">Bo'lim tanlang (ixtiyoriy)</option>
                {DEPARTMENTS.map(d => <option key={d.slug} value={d.label}>{d.label}</option>)}
              </select>
            </div>

            {/* Buyurtma */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Buyurtma (ixtiyoriy)</label>
              <select value={form.order} onChange={set('order')} className={inputCls}>
                <option value="">Buyurtma tanlang</option>
                {orders.map(o => <option key={o._id} value={o._id}>{o.title}</option>)}
              </select>
            </div>

            {/* Usta */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Usta *</label>
              <select value={form.worker} onChange={set('worker')} className={inputCls}>
                <option value="">Usta tanlang</option>
                {workers.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.fullName} {w.telegramChatId ? '✓' : "(Telegram yo'q)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Muddat */}
            <div>
              <label className="block text-[#888] text-[11px] uppercase tracking-widest mb-1.5">Muddat *</label>
              <input type="date" value={form.deadline} onChange={set('deadline')} className={inputCls} />
            </div>

            <div className="bg-emerald-950/50 border border-emerald-800/30 rounded-xl px-4 py-3">
              <p className="text-emerald-400 text-xs">
                📲 Vazifa yaratilganda usta Telegramga avtomatik xabar oladi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={onClose}
              className="py-3 rounded-xl border border-[#2a2d3a] text-[#888] text-sm font-medium hover:bg-[#2a2d3a] transition"
            >
              Bekor qilish
            </button>
            <button
              onClick={() => valid && onSubmit(form)}
              disabled={!valid || saving}
              className="py-3 rounded-xl bg-[#f0c040] text-[#0f1117] text-sm font-bold hover:bg-[#d4a832] disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {saving ? 'Yuborilmoqda...' : '📲 Yuborish'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Page ────────────────────────────────────────────────────────────────
  export default function TasksPage() {
    const [tasks, setTasks]         = useState<Task[]>([]);
    const [workers, setWorkers]     = useState<Worker[]>([]);
    const [orders, setOrders]       = useState<Order[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [toast, setToast]         = useState<string | null>(null);
    const [filterDept, setFilterDept] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

    const fetchAll = async () => {
      const [tasksRes, workersRes, ordersRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/workers'),
        fetch('/api/orders'),
      ]);
      setTasks(await tasksRes.json());
      setWorkers(await workersRes.json());
      setOrders(await ordersRes.json());
      setLoading(false);
    };

    useEffect(() => {
      fetchAll();
      const es = new EventSource('/api/events');
      es.onmessage = () => fetchAll();
      return () => es.close();
    }, []);

    const handleSubmit = async (form: FormState) => {
      setSaving(true);
      const body: Record<string, string> = {
        title: form.title,
        worker: form.worker,
        deadline: form.deadline,
      };
      if (form.order) body.order = form.order;
      if (form.department) body.department = form.department;
      if (form.description) body.description = form.description;

      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaving(false);
      setShowModal(false);
      showToast('Vazifa yaratildi ✓');
      fetchAll();
    };

    const handleDelete = async (id: string) => {
      if (!confirm("Vazifani o'chirmoqchimisiz?")) return;
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      showToast("Vazifa o'chirildi");
      fetchAll();
    };

    // Filter by department
    const filteredTasks = filterDept
      ? tasks.filter(t => t.department === filterDept)
      : tasks;

    const stats = {
      total:       tasks.length,
      pending:     tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed:   tasks.filter(t => t.status === 'completed').length,
    };

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
          @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fade-in  { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
          .animate-slide-up   { animation: slide-up 0.25s ease both; }
          .animate-fade-in    { animation: fade-in 0.25s ease both; }
        `}</style>

        {toast && <Toast msg={toast} />}
        {showModal && (
          <AddModal
            workers={workers}
            orders={orders}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            saving={saving}
          />
        )}

        <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-10">
              <div>
                <p className="text-[#555] text-[11px] uppercase tracking-[2px] mb-1">Mebel CRM</p>
                <h1
                  className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Vazifalar
                </h1>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="self-start sm:self-auto bg-[#f0c040] text-[#0f1117] text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#d4a832] active:scale-95 transition whitespace-nowrap"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                + Vazifa qo'shish
              </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8">
              <StatCard label="Jami"       value={stats.total}       color="text-white"       />
              <StatCard label="Kutilmoqda" value={stats.pending}     color="text-blue-400"    />
              <StatCard label="Jarayonda"  value={stats.in_progress} color="text-amber-400"   />
              <StatCard label="Tugallandi" value={stats.completed}   color="text-emerald-400" />
            </div>

            {/* ── Department Filter ── */}
            <div className="flex gap-2 flex-wrap mb-5">
              <button
                onClick={() => setFilterDept('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterDept === '' ? 'bg-[#f0c040] text-[#0f1117]' : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white'
                }`}
              >
                Barchasi
              </button>
              {DEPARTMENTS.map(d => (
    <div key={d.slug} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <button
        onClick={() => setFilterDept(d.label)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          filterDept === d.label
            ? 'bg-[#f0c040] text-[#0f1117]'
            : 'bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white'
        }`}
      >
        {d.label}
      </button>
      <a
        href={`/monitor/${d.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Monitorda ko'rish"
        className="text-[#444] hover:text-[#f0c040] transition text-sm"
      >
        🖥
      </a>
    </div>
  ))}

          
            </div>

            {/* ── Tasks ── */}
            {loading ? (
              <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
                <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
                <p className="text-sm">Yuklanmoqda...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-sm">Hali vazifa qo'shilmagan</p>
                <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-[#f0c040] underline underline-offset-2">
                  Birinchi vazifani qo'shish
                </button>
              </div>
            ) : (
              <>
                {/* ── Mobile cards ── */}
                <div className="sm:hidden space-y-3">
                  {filteredTasks.map(task => (
                    <TaskCard key={task._id} task={task} onDelete={() => handleDelete(task._id)} />
                  ))}
                </div>

                {/* ── Desktop rows ── */}
                <div className="hidden sm:flex flex-col gap-3">
                  {filteredTasks.map(task => {
                    const meta    = STATUS_META[task.status];
                    const overdue = isOverdue(task);
                    return (
                      <div
                        key={task._id}
                        className={`bg-[#1a1d27] rounded-2xl border flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-[#1f2235] transition ${
                          overdue ? 'border-red-900/50' : 'border-[#2a2d3a]'
                        }`}
                      >
                        <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-[#14161f] flex items-center justify-center text-xl shrink-0">
                          📋
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-[15px] text-white truncate">{task.title}</p>
                          <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-0.5 mt-1">
                            {task.department && <span className="text-[#666] text-xs">🏢 {task.department}</span>}
                            {task.order?.title && <span className="text-[#666] text-xs truncate max-w-[120px] sm:max-w-none">📦 {task.order.title}</span>}
                            <span className="text-[#666] text-xs">👷 {task.worker?.fullName}</span>
                            <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-[#666]'}`}>
                              ⏰ {overdue ? '⚠ ' : ''}{fmtDate(task.deadline)}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[#555] text-xs mt-1 line-clamp-1">{task.description}</p>
                          )}
                        </div>

                        {task.startedAt && (
                          <div className="text-right shrink-0 hidden lg:block">
                            <p className="text-[#555] text-xs">Boshlandi: {fmtDate(task.startedAt)}</p>
                            {task.completedAt && (
                              <p className="text-emerald-400 text-xs mt-0.5">Tugadi: {fmtDate(task.completedAt)}</p>
                            )}
                          </div>
                        )}

                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold ${meta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          <span className="hidden sm:inline">{meta.label}</span>
                        </span>

                        <button
                          onClick={() => handleDelete(task._id)}
                          className="shrink-0 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/40 transition"
                        >
                          O'chirish
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }